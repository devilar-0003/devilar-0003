import {
  date,
  integer,
  real,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  pgTable,
} from "drizzle-orm/pg-core";

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  name: text("name").notNull().default("My exam"),
  examDate: date("exam_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cardStates = pgTable(
  "card_states",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    flashcardId: integer("flashcard_id")
      .notNull()
      .references(() => flashcards.id),
    ease: real("ease").notNull().default(2.5),
    interval: integer("interval").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.sessionId, t.flashcardId)]
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  flashcardId: integer("flashcard_id")
    .notNull()
    .references(() => flashcards.id),
  rating: smallint("rating").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  deck: text("deck").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* AI workspace: generated decks, cards, media, and review telemetry   */
/* ------------------------------------------------------------------ */

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default("General"),
  /** prompt | pdf | image */
  sourceType: text("source_type").notNull().default("prompt"),
  summary: text("summary").notNull().default(""),
  /** gemini | deterministic */
  generatedBy: text("generated_by").notNull().default("deterministic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // base64 payload
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiCards = pgTable("ai_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id")
    .notNull()
    .references(() => decks.id),
  sessionId: text("session_id").notNull(),
  subject: text("subject").notNull().default("General"),
  /** qa | cloze | image */
  kind: text("kind").notNull().default("qa"),
  front: text("front").notNull(),
  back: text("back").notNull(),
  imageId: integer("image_id"),
  ease: real("ease").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiReviews = pgTable("ai_reviews", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  deckId: integer("deck_id").notNull(),
  cardId: integer("card_id").notNull(),
  subject: text("subject").notNull().default("General"),
  rating: smallint("rating").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
});
