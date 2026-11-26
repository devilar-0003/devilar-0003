import { aiEnabled, geminiGenerate, parseJsonLoose, GeminiError, type GeminiPart } from "@/lib/gemini";
import type {
  CardKind,
  GeneratedBy,
  GeneratedCard,
  GeneratedQuestion,
  PlanDay,
  StudyPlan,
  WeakSubject,
} from "@/lib/ai-types";

const STOPWORDS = new Set(
  "the a an and or but of to in for on with is are was were be been being that this these those it its as at by from into than then so such not no can could may might will would should shall do does did have has had you your we our they their he she his her which who whom what when where why how all any each other some more most very also between during about over under".split(
    " "
  )
);

/* ----------------------------- sanitising ----------------------------- */

function clean(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const cut = slice.lastIndexOf(" ");
  return `${slice.slice(0, cut > max * 0.6 ? cut : max).trim()}…`;
}

const KIND_SET = new Set<CardKind>(["qa", "cloze", "image"]);

function normaliseCard(raw: unknown, fallbackKind: CardKind): GeneratedCard | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const front = clean(String(obj.front ?? obj.question ?? obj.term ?? ""));
  const back = clean(String(obj.back ?? obj.answer ?? obj.definition ?? ""));
  if (front.length < 3 || back.length < 2) return null;
  const kindRaw = String(obj.kind ?? obj.type ?? fallbackKind).toLowerCase();
  const kind: CardKind = KIND_SET.has(kindRaw as CardKind) ? (kindRaw as CardKind) : fallbackKind;
  return { front: clamp(front, 500), back: clamp(back, 1400), kind };
}

/* ------------------------- deterministic engine ------------------------ */

function sentences(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => clean(s))
    .filter((s) => s.length >= 45 && s.length <= 420 && /[a-zA-Z]/.test(s));
}

function keyTerm(sentence: string): string | null {
  const words = sentence.match(/[A-Za-z][A-Za-z-]{4,}|\d{2,}(?:\.\d+)?/g) ?? [];
  const scored = words
    .filter((w) => !STOPWORDS.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return scored[0] ?? null;
}

export function cardsFromText(text: string, count: number, forceCloze: boolean): GeneratedCard[] {
  const pool = sentences(text);
  const cards: GeneratedCard[] = [];
  const used = new Set<string>();

  for (const sentence of pool) {
    if (cards.length >= count) break;
    if (used.has(sentence)) continue;
    used.add(sentence);
    const clozeTurn = forceCloze || cards.length % 2 === 0;

    if (clozeTurn) {
      const term = keyTerm(sentence);
      if (!term) continue;
      const idx = sentence.indexOf(term);
      if (idx < 0) continue;
      const front = `${sentence.slice(0, idx)}{{${term}}}${sentence.slice(idx + term.length)}`;
      cards.push({ front: clamp(front, 500), back: clamp(sentence, 900), kind: "cloze" });
    } else {
      const m = sentence.match(/^(.{3,90}?)\s+(?:is|are|was|were|means|refers to|defined as)\s+(.{10,300})$/i);
      if (m) {
        cards.push({
          front: clamp(`What ${/s$/.test(m[1]) ? "are" : "is"} ${m[1].trim()}?`, 400),
          back: clamp(`${m[2].trim().replace(/[.;]$/, "")}.`, 900),
          kind: "qa",
        });
      } else {
        const term = keyTerm(sentence);
        if (!term) continue;
        cards.push({
          front: clamp(`Explain the role of “${term}” in: ${sentence.slice(0, 120)}…`, 400),
          back: clamp(sentence, 900),
          kind: "qa",
        });
      }
    }
  }

  // Serve remaining cards as cloze no matter the alternation.
  if (cards.length < count) {
    for (const sentence of pool) {
      if (cards.length >= count) break;
      const term = keyTerm(sentence);
      if (!term) continue;
      const front = `${sentence.slice(0, sentence.indexOf(term))}{{${term}}}${sentence.slice(
        sentence.indexOf(term) + term.length
      )}`;
      if (cards.some((c) => c.front === front)) continue;
      cards.push({ front: clamp(front, 500), back: clamp(sentence, 900), kind: "cloze" });
    }
  }

  return cards.slice(0, count);
}

function scaffoldCards(topic: string, subject: string, count: number): GeneratedCard[] {
  const t = topic.trim() || subject;
  const templates: GeneratedCard[] = [
    {
      front: `Define “${t}” in one precise sentence.`,
      back: `Write your own definition of ${t}, then check it against your notes. A definition card is only "retained" when you can say it without looking.`,
      kind: "qa",
    },
    {
      front: `What are the three most examinable facts about ${t}?`,
      back: `List the three facts you'd bet marks on, then cover them and recall out loud. Add the ones you miss as new cards.`,
      kind: "qa",
    },
    {
      front: `“${t}” — fill the blank: the single most important mechanism is ______.`,
      back: `Name the mechanism, then explain it in one causal chain (cause → process → result). This is the highest-yield recall shape for ${subject}.`,
      kind: "cloze",
    },
    {
      front: `Give one worked example that demonstrates ${t}.`,
      back: `Work an example end-to-end, including units/labels, and note where you hesitated. Hesitation marks the weak sub-topic.`,
      kind: "qa",
    },
    {
      front: `What is the most common mistake students make with ${t}?`,
      back: `Name the trap, then write the correction. Naming the mistake out loud is stronger than re-reading the right answer.`,
      kind: "qa",
    },
    {
      front: `Connect ${t} to one other topic you already know.`,
      back: `State the connection in one sentence. Cross-links make recall faster under exam pressure because you get two retrieval paths.`,
      kind: "qa",
    },
    {
      front: `${t}: which formula/relationship must you be able to write from memory?`,
      back: `Write it, label every symbol, and state when it is valid. If you can't, make it its own cloze card.`,
      kind: "cloze",
    },
    {
      front: `If a question on ${t} appeared first in the paper, what is your 20-second plan?`,
      back: `Decide: read the stem for the command word → list knowns → pick the relationship → sanity-check units. Practising the plan is part of retention.`,
      kind: "qa",
    },
  ];
  return templates.slice(0, Math.max(3, Math.min(count, templates.length)));
}

export function quizFromCards(
  cards: { front: string; back: string; subject: string }[],
  count: number,
  subject: string
): GeneratedQuestion[] {
  const usable = cards
    .map((c) => ({ front: clean(c.front.replace(/\{\{(.*?)\}\}/g, "$1")), back: clean(c.back), subject: c.subject || subject }))
    .filter((c) => c.front.length > 6 && c.back.length > 8);

  const questions: GeneratedQuestion[] = [];
  const pool = usable.slice(0, Math.max(count, 1));

  for (let i = 0; i < pool.length && questions.length < count; i++) {
    const card = pool[i];
    const correct = clamp(card.back, 150);
    const distractors = usable
      .filter((c, j) => j !== i)
      .map((c) => clamp(c.back, 150))
      .filter((d) => d !== correct)
      .slice(i, i + 3);
    while (distractors.length < 3) {
      distractors.push(
        ["None of the listed statements", "The opposite of the stated relationship", "It cannot be determined from the information given"][
          distractors.length
        ]
      );
    }
    const options = [correct, ...distractors.slice(0, 3)];
    // deterministic but shuffled placement
    const shift = (i * 3 + correct.length) % 4;
    const rotated = [...options.slice(shift), ...options.slice(0, shift)];
    questions.push({
      question: clamp(card.front, 300),
      options: rotated.map((o) => clamp(o, 180)),
      correctIndex: rotated.indexOf(correct),
      explanation: clamp(card.back, 400),
      subject: card.subject,
    });
  }
  return questions;
}

function fallbackPlan(ctx: PlanContext): StudyPlan {
  const { daysLeft, dueToday, cardsTotal, weakSubjects } = ctx;
  const weakest = weakSubjects[0]?.subject;
  const second = weakSubjects[1]?.subject;
  const daily = Math.max(10, Math.min(60, Math.ceil((dueToday + cardsTotal) / 5)));

  const days: PlanDay[] = [
    {
      day: "Day 1",
      focus: "Clear the backlog",
      task: `Review the ${dueToday} cards due now${weakest ? `, starting with ${weakest}` : ""} — rate honestly, "Again" is information, not failure.`,
      minutes: daily,
    },
    {
      day: "Day 2",
      focus: weakest ? `${weakest} repair` : "Active recall",
      task: `Rebuild your weakest area: one AI deck from your notes, then a 12-question quiz. Note every miss and turn it into a cloze card.`,
      minutes: daily + 10,
    },
    {
      day: "Day 3",
      focus: "Interleave",
      task: `Mix ${second ?? "two subjects"} in one session. Switch subjects every 8 cards to force context-switching recall.`,
      minutes: daily,
    },
    {
      day: "Day 4",
      focus: "Weak-topic audit",
      task: `Open Weak topics and re-quiz anything under 70% mastery. Upload the PDF chapter you've been avoiding.`,
      minutes: daily + 5,
    },
    {
      day: "Day 5",
      focus: "Record-pace run",
      task: `One full quiz against the clock. Target under 75 seconds with 80%+ accuracy.`,
      minutes: 15,
    },
    {
      day: "Day 6",
      focus: "Cloze-only recall",
      task: `Study only the cloze cards — fill the blank aloud before flipping. Speed matters less than honesty.`,
      minutes: daily,
    },
    {
      day: "Day 7",
      focus: "Exam simulation",
      task: `Full mock quiz + a 10-minute written brain dump of everything you remember, then check the gaps.`,
      minutes: 30,
    },
  ];

  return {
    headline: `${daysLeft} days to go — ${dueToday} cards are your only job today.`,
    rationale: `Built from your own data: ${cardsTotal} AI-generated cards, ${dueToday} due now, and ${
      weakSubjects.length > 0 ? `weakest areas ${weakSubjects.map((w) => w.subject).slice(0, 2).join(" & ")}` : "no weak spots recorded yet"
    }. Deterministic planner — add a Gemini key for a fully personalised narrative.`,
    days: daysLeft < 7 ? days.slice(0, Math.max(3, daysLeft)) : days,
    tips: [
      "Review before you feel ready — recall difficulty is the mechanism.",
      "Rate “Good” only if you could say the answer out loud, unaided.",
      "Two 10-minute sessions beat one 40-minute session, every time.",
    ],
  };
}

/* ------------------------------- AI paths ------------------------------ */

const CARD_SYSTEM = `You are Retain, an expert exam-prep flashcard author. You produce accurate, exam-ready recall material.
Rules:
- Return ONLY a JSON array. No markdown, no prose.
- Each item: {"front": string, "back": string, "kind": "qa" | "cloze", "topic": string}
- front is a single, answerable question or a cloze sentence.
- For kind="cloze", wrap the removed term in double curly braces like {{mitochondrion}} inside front; back is the full sentence plus a short explanation.
- back is concise (max 60 words), factual and self-contained.
- Never invent facts. If the source is thin, ask about what is present.
- Cover distinct ideas, prioritise high-yield exam material, and avoid duplicates.`;

export async function generateCards(input: {
  mode: "prompt" | "pdf" | "image";
  subject: string;
  prompt?: string;
  text?: string;
  image?: { mimeType: string; data: string };
  count: number;
  cloze: boolean;
}): Promise<{ cards: GeneratedCard[]; summary: string; generatedBy: GeneratedBy; warning?: string }> {
  const count = Math.max(3, Math.min(30, Math.round(input.count)));
  const defaultKind: CardKind = input.cloze ? "cloze" : "qa";

  if (aiEnabled()) {
    try {
      const instruction =
        input.mode === "image"
          ? `Analyse the attached study image (diagram, slide, worksheet or handwritten note). Extract labels, relationships and definitions, then write ${count} flashcards that test the important ideas.`
          : input.mode === "pdf"
            ? `From the following source material (${input.subject}) write ${count} high-yield flashcards. Do not copy long paragraphs.\n\nSOURCE:\n${(input.text ?? "").slice(0, 45_000)}`
            : `Write ${count} high-yield exam flashcards for ${input.subject} on the topic: ${input.prompt ?? input.subject}. ${
                input.cloze ? "Make every card a cloze deletion." : "Mix short-answer and cloze cards."
              }`;

      const parts: GeminiPart[] = [{ text: instruction }];
      if (input.mode === "image" && input.image) {
        parts.push({ inlineData: input.image });
      }

      const raw = await geminiGenerate({
        system: CARD_SYSTEM,
        json: true,
        temperature: 0.55,
        maxOutputTokens: 4096,
        parts,
      });

      const parsed = parseJsonLoose<unknown>(raw);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { cards?: unknown[] }).cards)
          ? ((parsed as { cards: unknown[] }).cards)
          : [];
      const cards = list
        .map((c) => normaliseCard(c, defaultKind))
        .filter((c): c is GeneratedCard => c !== null)
        .slice(0, count);

      if (cards.length > 0) {
        return {
          cards,
          generatedBy: "gemini",
          summary: `${cards.length} AI-generated cards for ${input.subject}.`,
        };
      }
    } catch (err) {
      const message = err instanceof GeminiError ? err.message : "Gemini failed";
      console.error("[generate] gemini error:", message);
      const fallback = fallbackCards(input, count, defaultKind);
      return {
        ...fallback,
        warning: `Gemini was unavailable (${message.slice(0, 120)}). Deterministic cards were created instead.`,
      };
    }
  }

  return fallbackCards(input, count, defaultKind);
}

function fallbackCards(
  input: { mode: "prompt" | "pdf" | "image"; subject: string; prompt?: string; text?: string },
  count: number,
  defaultKind: CardKind
): { cards: GeneratedCard[]; summary: string; generatedBy: GeneratedBy; warning?: string } {
  const sourceText = input.text?.trim() ?? "";
  let cards: GeneratedCard[] = [];

  if (sourceText.length > 80) {
    cards = cardsFromText(sourceText, count, false);
  }
  if (cards.length < 3) {
    cards = scaffoldCards(input.prompt ?? sourceText.slice(0, 90), input.subject, count);
  }

  return {
    cards,
    summary: `${cards.length} cards created for ${input.subject} (deterministic mode).`,
    generatedBy: "deterministic",
    warning:
      "Gemini is not connected, so cards were built with the offline engine. Add GEMINI_API_KEY to unlock true AI generation from PDFs and images.",
  };
}

export async function generateQuizAI(input: {
  cards: { front: string; back: string; subject: string }[];
  count: number;
  deckTitle: string;
  subject: string;
}): Promise<{ questions: GeneratedQuestion[]; generatedBy: GeneratedBy; warning?: string }> {
  const count = Math.max(3, Math.min(20, Math.round(input.count)));
  const source = input.cards
    .slice(0, 40)
    .map((c, i) => `${i + 1}. Q: ${c.front} | A: ${c.back} [${c.subject}]`)
    .join("\n");

  if (aiEnabled()) {
    try {
      const raw = await geminiGenerate({
        system: `You are Retain's exam question writer. Return ONLY a JSON array.
Each item: {"question": string, "options": [4 strings], "correctIndex": 0-3, "explanation": string, "subject": string}.
Questions must be answerable strictly from the provided material, have exactly one unambiguous answer, and use plausible distractors. No markdown.`,
        json: true,
        temperature: 0.5,
        maxOutputTokens: 3500,
        parts: [
          {
            text: `Write ${count} multiple-choice exam questions from this deck (“${input.deckTitle}”, subject ${input.subject}):\n${source}`,
          },
        ],
      });
      const parsed = parseJsonLoose<unknown>(raw);
      const list = Array.isArray(parsed) ? parsed : [];
      const questions: GeneratedQuestion[] = [];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const question = clean(String(o.question ?? ""));
        const options = Array.isArray(o.options) ? o.options.map((x) => clean(String(x))).slice(0, 4) : [];
        const correctIndex = Number(o.correctIndex);
        if (question.length < 6 || options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3)
          continue;
        questions.push({
          question: clamp(question, 400),
          options: options.map((x) => clamp(x, 220)),
          correctIndex,
          explanation: clamp(clean(String(o.explanation ?? options[correctIndex] ?? "")), 500),
          subject: clean(String(o.subject ?? input.subject)) || input.subject,
        });
      }
      if (questions.length >= 1) {
        return { questions: questions.slice(0, count), generatedBy: "gemini" };
      }
    } catch (err) {
      console.error("[quiz] gemini error:", err instanceof Error ? err.message : err);
    }
  }

  const questions = quizFromCards(input.cards, count, input.subject);
  if (questions.length === 0) {
    throw new GeminiError("This deck doesn't have enough content to build a quiz yet.", 422);
  }
  return {
    questions,
    generatedBy: "deterministic",
    warning: aiEnabled()
      ? "Gemini was unavailable — the quiz was assembled from your deck with the offline engine."
      : "Gemini is not connected. Quiz questions were assembled from your deck (offline engine).",
  };
}

export interface PlanContext {
  daysLeft: number;
  examName: string;
  dueToday: number;
  cardsTotal: number;
  reviewedToday: number;
  streak: number;
  quizAvg: number | null;
  weakSubjects: WeakSubject[];
}

export async function generatePlan(ctx: PlanContext): Promise<{ plan: StudyPlan; generatedBy: GeneratedBy; warning?: string }> {
  if (aiEnabled()) {
    try {
      const raw = await geminiGenerate({
        system: `You are Retain's study coach. Return ONLY JSON:
{"headline": string, "rationale": string, "days": [{"day": string, "focus": string, "task": string, "minutes": number}], "tips": [string]}
Rules: 5-7 days max, concrete and time-boxed, each task ≤ 25 words, reference the learner's real numbers, no fluff, no markdown.`,
        json: true,
        temperature: 0.6,
        maxOutputTokens: 2200,
        parts: [
          {
            text: `Build a study plan.
Exam: ${ctx.examName} in ${ctx.daysLeft} days.
Cards: ${ctx.cardsTotal} total, ${ctx.dueToday} due now, ${ctx.reviewedToday} reviewed today, streak ${ctx.streak} days.
Quiz average: ${ctx.quizAvg ?? "no attempts"}%.
Weak subjects: ${ctx.weakSubjects.map((w) => `${w.subject} ${w.mastery}% (${w.attempts} reviews)`).join("; ") || "none recorded"}.`,
          },
        ],
      });
      const parsed = parseJsonLoose<Partial<StudyPlan>>(raw);
      if (parsed && typeof parsed.headline === "string" && Array.isArray(parsed.days) && parsed.days.length > 0) {
        const days: PlanDay[] = parsed.days.slice(0, 7).map((d, i) => ({
          day: clean(String(d?.day ?? `Day ${i + 1}`)),
          focus: clean(String(d?.focus ?? "Study")),
          task: clamp(clean(String(d?.task ?? "")), 260),
          minutes: Math.max(5, Math.min(120, Number(d?.minutes) || 20)),
        }));
        return {
          plan: {
            headline: clamp(clean(parsed.headline), 220),
            rationale: clamp(clean(String(parsed.rationale ?? "")), 500),
            days,
            tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4).map((t) => clamp(clean(String(t)), 180)) : [],
          },
          generatedBy: "gemini",
        };
      }
    } catch (err) {
      console.error("[plan] gemini error:", err instanceof Error ? err.message : err);
    }
  }
  return {
    plan: fallbackPlan(ctx),
    generatedBy: "deterministic",
    warning: aiEnabled()
      ? "Gemini was unavailable — your plan was built by the offline coach."
      : "Gemini is not connected. Your plan is built by the offline coach from your real study data.",
  };
}

export async function explainDoubt(input: {
  question: string;
  cards: { front: string; back: string; subject: string }[];
  examName: string;
  daysLeft: number;
}): Promise<{ answer: string; generatedBy: GeneratedBy; sources: { front: string; back: string; subject: string }[] }> {
  const notes = input.cards
    .slice(0, 30)
    .map((c, i) => `${i + 1}. ${c.front.replace(/\{\{(.*?)\}\}/g, "$1")} → ${c.back} [${c.subject}]`)
    .join("\n");

  const keywords = input.question
    .toLowerCase()
    .match(/[a-z][a-z-]{3,}/g)
    ?.filter((w) => !STOPWORDS.has(w)) ?? [];
  const scored = input.cards
    .map((c) => {
      const hay = `${c.front} ${c.back}`.toLowerCase();
      const hits = keywords.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
      return { card: c, hits };
    })
    .sort((a, b) => b.hits - a.hits);
  const sources = scored.filter((s) => s.hits > 0).slice(0, 3).map((s) => s.card);

  if (aiEnabled()) {
    try {
      const answer = await geminiGenerate({
        system: `You are Retain's tutor. Answer the learner's doubt clearly and exam-accurately.
Structure: a one-line direct answer, then "Why it works" (2-3 short steps), then "Exam trap" (1 line). Max 180 words. Plain text, no markdown headings, no code fences. If the provided notes are relevant, ground the answer in them and say so.`,
        temperature: 0.5,
        maxOutputTokens: 900,
        parts: [
          {
            text: `Learner doubt: ${input.question}
Exam: ${input.examName} in ${input.daysLeft} days.
Their notes (may be empty or partially relevant):
${notes || "(none)"}`,
          },
        ],
      });
      return { answer, generatedBy: "gemini", sources };
    } catch (err) {
      console.error("[explain] gemini error:", err instanceof Error ? err.message : err);
    }
  }

  const direct = sources[0];
  const lines: string[] = [];
  lines.push(
    direct
      ? `Closest thing in your notes: ${direct.front.replace(/\{\{(.*?)\}\}/g, "$1")} — ${direct.back}`
      : `No card in your decks covers “${input.question}” yet. That gap is useful: make it the next card you create.`
  );
  if (sources.length > 1) {
    lines.push("");
    lines.push("Also relevant:");
    for (const s of sources.slice(1)) lines.push(`• ${s.front.replace(/\{\{(.*?)\}\}/g, "$1")} — ${s.back}`);
  }
  lines.push("");
  lines.push("How to attack it without AI:");
  lines.push("1) Say the answer out loud from memory, even badly. 2) Find the exact sentence in your notes/PDF that fixes it. 3) Generate a cloze card from that sentence so it comes back on schedule.");
  lines.push("");
  lines.push(
    `Add GEMINI_API_KEY to get a full worked explanation with exam traps. You have ${input.daysLeft} days until ${input.examName}.`
  );

  return { answer: lines.join("\n"), generatedBy: "deterministic", sources };
}
