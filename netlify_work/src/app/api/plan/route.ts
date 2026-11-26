import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams, decks, aiCards, aiReviews, reviews, flashcards, quizAttempts } from "@/db/schema";
import { and, eq, count, sql } from "drizzle-orm";
import { generatePlan } from "@/lib/generator";
import { aiEnabled } from "@/lib/gemini";
import type { WeakSubject } from "@/lib/ai-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SubjectAgg {
  subject: string;
  total: number;
  good: number;
  lapses: number;
}

export async function POST(req: Request) {
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [examRow] = await db.select().from(exams).where(eq(exams.sessionId, sessionId)).limit(1);

    const [aiDueRow] = await db
      .select({ n: count() })
      .from(aiCards)
      .where(and(eq(aiCards.sessionId, sessionId), sql`${aiCards.dueAt} <= now()`));

    const [aiTotalRow] = await db
      .select({ n: count() })
      .from(aiCards)
      .where(eq(aiCards.sessionId, sessionId));

    const [aiReviewedTodayRow] = await db
      .select({ n: count() })
      .from(aiReviews)
      .where(and(eq(aiReviews.sessionId, sessionId), sql`${aiReviews.reviewedAt} >= ${startOfToday}`));

    const seededDueResult = await db.execute(
      sql`select count(*)::int as n from card_states where session_id = ${sessionId} and due_at <= now()`
    );
    const seededDueRow = (seededDueResult.rows[0] ?? { n: 0 }) as { n: number | string };

    const [seededReviewedTodayRow] = await db
      .select({ n: count() })
      .from(reviews)
      .where(and(eq(reviews.sessionId, sessionId), sql`${reviews.reviewedAt} >= ${startOfToday}`));

    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.sessionId, sessionId));
    const quizAvg =
      attempts.length > 0
        ? Math.round((attempts.reduce((a, b) => a + b.score / b.total, 0) / attempts.length) * 100)
        : null;

    const aiAgg = await db
      .select({
        subject: aiReviews.subject,
        total: count(aiReviews.id),
        good: sql<number>`count(case when ${aiReviews.rating} >= 2 then 1 end)`,
      })
      .from(aiReviews)
      .where(eq(aiReviews.sessionId, sessionId))
      .groupBy(aiReviews.subject);

    const seededAgg = await db
      .select({
        subject: flashcards.subject,
        total: count(reviews.id),
        good: sql<number>`count(case when ${reviews.rating} >= 2 then 1 end)`,
      })
      .from(reviews)
      .innerJoin(flashcards, eq(flashcards.id, reviews.flashcardId))
      .where(eq(reviews.sessionId, sessionId))
      .groupBy(flashcards.subject);

    const aiDueBySubject = await db
      .select({ subject: aiCards.subject, n: count() })
      .from(aiCards)
      .where(and(eq(aiCards.sessionId, sessionId), sql`${aiCards.dueAt} <= now()`))
      .groupBy(aiCards.subject);

    const merged = new Map<string, SubjectAgg>();
    for (const row of [...aiAgg, ...seededAgg]) {
      const cur = merged.get(row.subject) ?? { subject: row.subject, total: 0, good: 0, lapses: 0 };
      cur.total += Number(row.total ?? 0);
      cur.good += Number(row.good ?? 0);
      merged.set(row.subject, cur);
    }

    const aiLapses = await db
      .select({ subject: aiCards.subject, lapses: sql<number>`coalesce(sum(${aiCards.lapses}), 0)` })
      .from(aiCards)
      .where(eq(aiCards.sessionId, sessionId))
      .groupBy(aiCards.subject);
    for (const row of aiLapses) {
      const cur = merged.get(row.subject);
      if (cur) cur.lapses += Number(row.lapses ?? 0);
    }

    const dueBySubject = new Map<string, number>();
    for (const row of aiDueBySubject) dueBySubject.set(row.subject, Number(row.n ?? 0));

    const weakSubjects: WeakSubject[] = [...merged.values()]
      .map((s) => ({
        subject: s.subject,
        attempts: s.total,
        mastery: s.total > 0 ? Math.round((s.good / s.total) * 100) : 0,
        lapses: s.lapses,
        due: dueBySubject.get(s.subject) ?? 0,
      }))
      .filter((s) => s.attempts > 0)
      .sort((a, b) => a.mastery - b.mastery);

    const deckRows = await db
      .select({ id: decks.id, title: decks.title, subject: decks.subject })
      .from(decks)
      .where(eq(decks.sessionId, sessionId));

    const daysLeft = examRow
      ? Math.max(0, Math.ceil((new Date(`${examRow.examDate}T23:59:59`).getTime() - Date.now()) / 86_400_000))
      : 45;

    const cardsTotal = Number(aiTotalRow?.n ?? 0);
    const dueToday = Number(aiDueRow?.n ?? 0) + Number(seededDueRow?.n ?? 0);
    const reviewedToday = Number(aiReviewedTodayRow?.n ?? 0) + Number(seededReviewedTodayRow?.n ?? 0);

    const streakRows = await db
      .select({ n: count() })
      .from(aiReviews)
      .where(and(eq(aiReviews.sessionId, sessionId), sql`${aiReviews.reviewedAt} >= now() - interval '1 day'`));

    const context = {
      daysLeft,
      examName: examRow?.name ?? "your exam",
      dueToday,
      cardsTotal,
      reviewedToday,
      streak: Number(streakRows[0]?.n ?? 0) > 0 ? 1 : 0,
      quizAvg,
      weakSubjects,
    };

    const { plan, generatedBy, warning } = await generatePlan(context);

    return NextResponse.json({
      ...context,
      plan,
      generatedBy,
      warning,
      aiEnabled: aiEnabled(),
      decks: deckRows,
      quizAttempts: attempts.length,
    });
  } catch (err) {
    console.error("[plan] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not build your study plan right now." }, { status: 503 });
  }
}
