import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { sessionId?: string; deck?: string; score?: number; total?: number; durationMs?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { sessionId, deck, score, total, durationMs } = body;
  if (
    !sessionId ||
    typeof score !== "number" ||
    typeof total !== "number" ||
    total <= 0 ||
    score < 0 ||
    score > total
  ) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        sessionId,
        deck: typeof deck === "string" && deck.length > 0 ? deck.slice(0, 120) : "Core Science Mastery",
        score: Math.round(score),
        total: Math.round(total),
        durationMs: Math.max(0, Math.round(typeof durationMs === "number" ? durationMs : 0)),
      })
      .returning();
    return NextResponse.json({ ok: true, attempt: { id: attempt.id, score: attempt.score, total: attempt.total } });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
