import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  try {
    const [row] = await db.select().from(exams).where(eq(exams.sessionId, sessionId)).limit(1);
    return NextResponse.json({ exam: row ? { name: row.name, date: row.examDate } : null });
  } catch (err) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  let body: { sessionId?: string; name?: string; date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { sessionId, name, date: examDate } = body;
  if (!sessionId || !examDate || !DATE_RE.test(examDate)) {
    return NextResponse.json({ error: "sessionId and a valid date are required" }, { status: 400 });
  }
  try {
    const safeName = (name ?? "My exam").trim().slice(0, 80) || "My exam";
    const existing = await db.select().from(exams).where(eq(exams.sessionId, sessionId)).limit(1);
    if (existing.length) {
      await db.update(exams).set({ name: safeName, examDate }).where(eq(exams.sessionId, sessionId));
    } else {
      await db.insert(exams).values({ sessionId, name: safeName, examDate });
    }
    return NextResponse.json({ exam: { name: safeName, date: examDate } });
  } catch {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
