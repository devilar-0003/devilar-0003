import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, cardStates, quizAttempts, flashcards } from "@/db/schema";
import { eq, gte, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayReviews, allReviews, attempts, allCardStates, joinRows] = await Promise.all([
      db.select().from(reviews).where(and(eq(reviews.sessionId, sessionId), gte(reviews.reviewedAt, startOfToday))),
      db.select({ reviewedAt: reviews.reviewedAt }).from(reviews).where(eq(reviews.sessionId, sessionId)).orderBy(desc(reviews.reviewedAt)),
      db.select().from(quizAttempts).where(eq(quizAttempts.sessionId, sessionId)).orderBy(desc(quizAttempts.createdAt)),
      db.select().from(cardStates).where(eq(cardStates.sessionId, sessionId)),
      db
        .select({
          reviewId: reviews.id,
          flashcardId: reviews.flashcardId,
          rating: reviews.rating,
          reviewedAt: reviews.reviewedAt,
          front: flashcards.front,
          subject: flashcards.subject,
        })
        .from(reviews)
        .innerJoin(flashcards, eq(flashcards.id, reviews.flashcardId))
        .where(eq(reviews.sessionId, sessionId))
        .orderBy(desc(reviews.reviewedAt))
        .limit(6),
    ]);

    // due = state due on or before now
    const nowIso = now.getTime();
    const dueCount = allCardStates.filter((s) => new Date(s.dueAt).getTime() <= nowIso).length;

    const totalReviews = allReviews.length;

    // streak: consecutive days ending today with at least one review
    const daysWithReview = new Set<string>();
    for (const r of allReviews) daysWithReview.add(dayKey(new Date(r.reviewedAt)));
    let streak = 0;
    const cursor = new Date(startOfToday);
    if (!daysWithReview.has(dayKey(cursor))) {
      // if today empty, try starting yesterday (grace) — streak counts history
      cursor.setDate(cursor.getDate() - 1);
    }
    while (daysWithReview.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // weekly buckets (last 7 days, oldest first)
    const weekly: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const count = allReviews.filter((r) => dayKey(new Date(r.reviewedAt)) === key).length;
      weekly.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), count });
    }

    // quiz aggregates
    const totalAttempts = attempts.length;
    const avgPercent =
      totalAttempts > 0
        ? Math.round((attempts.reduce((a, b) => a + b.score / b.total, 0) / totalAttempts) * 100)
        : null;
    const bestPercent =
      totalAttempts > 0 ? Math.round(Math.max(...attempts.map((a) => (a.score / a.total) * 100))) : null;
    const totalQuestionsAnswered = attempts.reduce((a, b) => a + b.score, 0);
    const totalQuestionsTotal = attempts.reduce((a, b) => a + b.total, 0);

    // recent feed
    const recent = [
      ...joinRows.map((r) => ({
        kind: "review" as const,
        id: `rev-${r.reviewId}`,
        at: new Date(r.reviewedAt).toISOString(),
        title: r.front,
        subject: r.subject,
        meta: r.rating === 0 ? "Again" : r.rating === 1 ? "Hard" : r.rating === 2 ? "Good" : "Easy",
      })),
      ...attempts.slice(0, 4).map((a) => ({
        kind: "quiz" as const,
        id: `quiz-${a.id}`,
        at: new Date(a.createdAt).toISOString(),
        title: a.deck,
        subject: "Quiz",
        meta: `${a.score}/${a.total} · ${Math.round((a.score / a.total) * 100)}%`,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 7);

    return NextResponse.json({
      dueCount,
      reviewedToday: todayReviews.length,
      totalReviews,
      streak,
      weekly,
      attempts: {
        total: totalAttempts,
        avgPercent,
        bestPercent,
        totalQuestionsAnswered,
        totalQuestionsTotal,
      },
      recent,
    });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
