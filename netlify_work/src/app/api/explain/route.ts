import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, aiCards, exams, flashcards } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { explainDoubt } from "@/lib/generator";
import { aiEnabled } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { sessionId?: string; question?: string; deckId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  const question = (body.question ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  if (question.length < 4) return NextResponse.json({ error: "Ask a fuller question." }, { status: 400 });
  if (question.length > 1200) return NextResponse.json({ error: "Keep the doubt under 1200 characters." }, { status: 400 });

  try {
    let cards: { front: string; back: string; subject: string }[] = [];

    if (body.deckId && Number.isInteger(Number(body.deckId))) {
      const deckId = Number(body.deckId);
      const [deck] = await db
        .select({ id: decks.id })
        .from(decks)
        .where(and(eq(decks.id, deckId), eq(decks.sessionId, sessionId)))
        .limit(1);
      if (deck) {
        cards = await db
          .select({ front: aiCards.front, back: aiCards.back, subject: aiCards.subject })
          .from(aiCards)
          .where(eq(aiCards.deckId, deckId))
          .limit(40);
      }
    }

    if (cards.length === 0) {
      const aiRows = await db
        .select({ front: aiCards.front, back: aiCards.back, subject: aiCards.subject })
        .from(aiCards)
        .where(eq(aiCards.sessionId, sessionId))
        .limit(40);
      const seededRows = await db
        .select({ front: flashcards.front, back: flashcards.back, subject: flashcards.subject })
        .from(flashcards)
        .limit(20);
      cards = [...aiRows, ...seededRows];
    }

    const [examRow] = await db.select().from(exams).where(eq(exams.sessionId, sessionId)).limit(1);
    const daysLeft = examRow
      ? Math.max(0, Math.ceil((new Date(`${examRow.examDate}T23:59:59`).getTime() - Date.now()) / 86_400_000))
      : 45;

    const result = await explainDoubt({
      question,
      cards,
      examName: examRow?.name ?? "your exam",
      daysLeft,
    });

    return NextResponse.json({ ...result, aiEnabled: aiEnabled() });
  } catch (err) {
    console.error("[explain] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The tutor is unavailable right now. Try again." }, { status: 500 });
  }
}
