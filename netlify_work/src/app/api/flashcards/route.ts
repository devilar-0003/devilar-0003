import { NextResponse } from "next/server";
import { db } from "@/db";
import { flashcards, cardStates } from "@/db/schema";
import { ensureFlashcardsSeeded } from "@/lib/server/seed";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  try {
    await ensureFlashcardsSeeded();
    const rows = await db
      .select({
        id: flashcards.id,
        subject: flashcards.subject,
        front: flashcards.front,
        back: flashcards.back,
        ease: cardStates.ease,
        interval: cardStates.interval,
        reps: cardStates.reps,
        lapses: cardStates.lapses,
        dueAt: cardStates.dueAt,
      })
      .from(flashcards)
      .leftJoin(
        cardStates,
        and(eq(cardStates.flashcardId, flashcards.id), eq(cardStates.sessionId, sessionId))
      );

    const cards = rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      front: r.front,
      back: r.back,
      state:
        r.ease !== null || r.interval !== null
          ? {
              ease: r.ease ?? 2.5,
              interval: r.interval ?? 0,
              reps: r.reps ?? 0,
              lapses: r.lapses ?? 0,
              dueAt: r.dueAt ? new Date(r.dueAt).toISOString() : null,
            }
          : null,
    }));

    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
