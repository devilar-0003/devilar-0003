import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, aiCards, aiReviews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { CardKind, DeckDetail, StudyCard } from "@/lib/ai-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  const deckId = Number(id);
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  if (!Number.isInteger(deckId)) return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });

  try {
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.sessionId, sessionId)))
      .limit(1);
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const rows = await db
      .select()
      .from(aiCards)
      .where(eq(aiCards.deckId, deckId))
      .orderBy(sql`${aiCards.dueAt} asc, ${aiCards.id} asc`);

    const cards: StudyCard[] = rows.map((c) => ({
      id: c.id,
      deckId: c.deckId,
      subject: c.subject,
      kind: (["qa", "cloze", "image"].includes(c.kind) ? c.kind : "qa") as CardKind,
      front: c.front,
      back: c.back,
      imageId: c.imageId,
      ease: c.ease,
      interval: c.interval,
      reps: c.reps,
      lapses: c.lapses,
      dueAt: new Date(c.dueAt).toISOString(),
    }));

    const imageId = cards.find((c) => c.imageId)?.imageId ?? null;

    const detail: DeckDetail = {
      id: deck.id,
      title: deck.title,
      subject: deck.subject,
      sourceType: deck.sourceType,
      summary: deck.summary,
      generatedBy: deck.generatedBy === "gemini" ? "gemini" : "deterministic",
      createdAt: new Date(deck.createdAt).toISOString(),
      imageId,
      cards,
    };

    return NextResponse.json({ deck: detail });
  } catch (err) {
    console.error("[deck] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not load deck." }, { status: 503 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  const deckId = Number(id);
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  if (!Number.isInteger(deckId)) return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });

  try {
    const [deck] = await db
      .select({ id: decks.id })
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.sessionId, sessionId)))
      .limit(1);
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    await db.delete(aiReviews).where(eq(aiReviews.deckId, deckId));
    await db.delete(aiCards).where(eq(aiCards.deckId, deckId));
    await db.delete(decks).where(eq(decks.id, deckId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[deck] delete failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not delete deck." }, { status: 503 });
  }
}
