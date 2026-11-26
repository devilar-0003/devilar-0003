import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiCards, aiReviews, decks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { computeNextState, type Rating } from "@/lib/sm2";

export const dynamic = "force-dynamic";

const RATINGS = new Set([0, 1, 2, 3]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deckId = Number(id);
  let body: { sessionId?: string; cardId?: number; rating?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sessionId, cardId, rating } = body;
  if (!sessionId || !Number.isInteger(deckId)) {
    return NextResponse.json({ error: "Missing session or deck." }, { status: 400 });
  }
  if (typeof cardId !== "number" || typeof rating !== "number" || !RATINGS.has(rating)) {
    return NextResponse.json({ error: "cardId and a rating from 0-3 are required." }, { status: 400 });
  }

  try {
    const [deck] = await db
      .select({ id: decks.id })
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.sessionId, sessionId)))
      .limit(1);
    if (!deck) return NextResponse.json({ error: "Deck not found." }, { status: 404 });

    const [card] = await db
      .select()
      .from(aiCards)
      .where(and(eq(aiCards.id, cardId), eq(aiCards.deckId, deckId)))
      .limit(1);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const next = computeNextState(
      { ease: card.ease, interval: card.interval, reps: card.reps, lapses: card.lapses },
      rating as Rating
    );

    await db
      .update(aiCards)
      .set({
        ease: next.ease,
        interval: next.interval,
        reps: next.reps,
        lapses: next.lapses,
        dueAt: next.dueAt,
      })
      .where(eq(aiCards.id, card.id));

    await db.insert(aiReviews).values({
      sessionId,
      deckId,
      cardId: card.id,
      subject: card.subject,
      rating,
    });

    return NextResponse.json({
      ok: true,
      dueAt: next.dueAt.toISOString(),
      interval: next.interval,
      ease: next.ease,
      reps: next.reps,
      lapses: next.lapses,
    });
  } catch (err) {
    console.error("[review] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not save that review." }, { status: 503 });
  }
}
