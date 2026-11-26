import { db } from "@/db";
import { flashcards } from "@/db/schema";
import { count } from "drizzle-orm";
import { FLASHCARDS } from "@/lib/content";

let seeded = false;

/** Idempotently seed the shared flashcard deck. */
export async function ensureFlashcardsSeeded() {
  if (seeded) return;
  const [row] = await db.select({ n: count() }).from(flashcards);
  if ((row?.n ?? 0) === 0) {
    await db.insert(flashcards).values(FLASHCARDS.map((c) => ({ subject: c.subject, front: c.front, back: c.back })));
  }
  seeded = true;
}
