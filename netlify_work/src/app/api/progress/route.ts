import { NextResponse } from "next/server";
import { db } from "@/db";
import { flashcards, cardStates, reviews } from "@/db/schema";
import { ensureFlashcardsSeeded } from "@/lib/server/seed";
import { computeNextState, type Rating } from "@/lib/sm2";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RATINGS = new Set([0, 1, 2, 3]);

export async function POST(req: Request) {
  let body: { sessionId?: string; flashcardId?: number; rating?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { sessionId, flashcardId, rating } = body;
  if (!sessionId || typeof flashcardId !== "number" || typeof rating !== "number" || !RATINGS.has(rating)) {
    return NextResponse.json({ error: "sessionId, flashcardId and a valid rating (0-3) are required" }, { status: 400 });
  }

  try {
    await ensureFlashcardsSeeded();
    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, flashcardId)).limit(1);
    if (!card) {
      return NextResponse.json({ error: "flashcard not found" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(cardStates)
      .where(and(eq(cardStates.sessionId, sessionId), eq(cardStates.flashcardId, flashcardId)))
      .limit(1);

    const next = computeNextState(
      {
        ease: existing?.ease ?? 2.5,
        interval: existing?.interval ?? 0,
        reps: existing?.reps ?? 0,
        lapses: existing?.lapses ?? 0,
      },
      rating as Rating
    );

    const now = new Date();
    if (existing) {
      await db
        .update(cardStates)
        .set({
          ease: next.ease,
          interval: next.interval,
          reps: next.reps,
          lapses: next.lapses,
          dueAt: next.dueAt,
          updatedAt: now,
        })
        .where(eq(cardStates.id, existing.id));
    } else {
      await db.insert(cardStates).values({
        sessionId,
        flashcardId,
        ease: next.ease,
        interval: next.interval,
        reps: next.reps,
        lapses: next.lapses,
        dueAt: next.dueAt,
        updatedAt: now,
      });
    }

    await db.insert(reviews).values({ sessionId, flashcardId, rating, reviewedAt: now });

    return NextResponse.json({
      ok: true,
      dueAt: next.dueAt.toISOString(),
      interval: next.interval,
      ease: next.ease,
      reps: next.reps,
      lapses: next.lapses,
    });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
