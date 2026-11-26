import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, aiCards } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateQuizAI } from "@/lib/generator";
import { aiEnabled } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { sessionId?: string; deckId?: number; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  const deckId = Number(body.deckId);
  const count = Math.max(3, Math.min(20, Math.round(Number(body.count) || 10)));
  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  if (!Number.isInteger(deckId)) return NextResponse.json({ error: "Choose a deck to quiz on." }, { status: 400 });

  try {
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.sessionId, sessionId)))
      .limit(1);
    if (!deck) return NextResponse.json({ error: "Deck not found." }, { status: 404 });

    const cards = await db
      .select({ front: aiCards.front, back: aiCards.back, subject: aiCards.subject })
      .from(aiCards)
      .where(eq(aiCards.deckId, deckId));

    if (cards.length < 2) {
      return NextResponse.json({ error: "Add a few more cards to this deck before quizzing it." }, { status: 422 });
    }

    const result = await generateQuizAI({
      cards,
      count,
      deckTitle: deck.title,
      subject: deck.subject,
    });

    return NextResponse.json({
      deckTitle: deck.title,
      deckId: deck.id,
      questions: result.questions,
      generatedBy: result.generatedBy,
      warning: result.warning,
      aiEnabled: aiEnabled(),
    });
  } catch (err) {
    console.error("[quiz/generate] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not build a quiz from that deck." },
      { status: 500 }
    );
  }
}
