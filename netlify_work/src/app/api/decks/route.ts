import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, aiCards } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { aiEnabled } from "@/lib/gemini";
import type { DeckSummary } from "@/lib/ai-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  try {
    const rows = await db
      .select({
        id: decks.id,
        title: decks.title,
        subject: decks.subject,
        sourceType: decks.sourceType,
        summary: decks.summary,
        generatedBy: decks.generatedBy,
        createdAt: decks.createdAt,
        totalCards: count(aiCards.id),
        dueCards: sql<number>`count(case when ${aiCards.dueAt} <= now() then 1 end)`,
        masteredCards: sql<number>`count(case when ${aiCards.reps} >= 3 then 1 end)`,
      })
      .from(decks)
      .leftJoin(aiCards, eq(aiCards.deckId, decks.id))
      .where(eq(decks.sessionId, sessionId))
      .groupBy(decks.id)
      .orderBy(sql`${decks.createdAt} desc`);

    const list: DeckSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      sourceType: r.sourceType,
      summary: r.summary,
      generatedBy: r.generatedBy === "gemini" ? "gemini" : "deterministic",
      totalCards: Number(r.totalCards ?? 0),
      dueCards: Number(r.dueCards ?? 0),
      masteredCards: Number(r.masteredCards ?? 0),
      createdAt: new Date(r.createdAt).toISOString(),
    }));

    return NextResponse.json({ decks: list, aiEnabled: aiEnabled() });
  } catch (err) {
    console.error("[decks] list failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not load decks." }, { status: 503 });
  }
}
