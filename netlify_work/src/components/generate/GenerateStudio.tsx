"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import { SUBJECTS } from "@/lib/content";
import { ClozeText, KIND_LABEL } from "@/components/Cloze";
import type { GeneratedCard } from "@/lib/ai-types";

type Mode = "prompt" | "pdf" | "image";

interface Extracted {
  text: string;
  chars: number;
  totalChars: number;
  pages: number | null;
  truncated: boolean;
  filename: string;
}

interface Result {
  deckId: number;
  deck: { title: string; subject: string; summary: string; generatedBy: string; totalCards: number };
  cards: GeneratedCard[];
  aiEnabled: boolean;
  warning?: string;
}

const MODES: { id: Mode; label: string; icon: typeof Wand2; hint: string }[] = [
  { id: "prompt", label: "Topic prompt", icon: Wand2, hint: "Describe what you're studying" },
  { id: "pdf", label: "PDF upload", icon: FileText, hint: "Turn a chapter into cards" },
  { id: "image", label: "Image notes", icon: ImageIcon, hint: "Diagrams, slides, handwriting" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export default function GenerateStudio({ aiEnabled }: { aiEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("prompt");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [cloze, setCloze] = useState(false);
  const [title, setTitle] = useState("");

  const [extract, setExtract] = useState<Extracted | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const pdfInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setPrompt("");
    setSourceText("");
    setExtract(null);
    setImageFile(null);
    setImagePreview(null);
    setTitle("");
    setPdfError(null);
    setImageError(null);
    if (pdfInput.current) pdfInput.current.value = "";
    if (imgInput.current) imgInput.current.value = "";
  }, []);

  async function handlePdf(file: File) {
    setPdfError(null);
    setExtract(null);
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setPdfError("Please choose a PDF file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setPdfError("That PDF is over 12 MB — split the chapter first.");
      return;
    }
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setPdfError(data.error ?? "Could not read that PDF.");
        return;
      }
      setExtract(data as Extracted);
      setSourceText(data.text ?? "");
      if (!title) setTitle(file.name.replace(/\.pdf$/i, "").slice(0, 80));
    } catch {
      setPdfError("Upload failed — check your connection and retry.");
    } finally {
      setExtracting(false);
    }
  }

  function handleImage(file: File) {
    setImageError(null);
    if (!/^image\//.test(file.type)) {
      setImageError("Choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image is over 5 MB — compress or crop it first.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (!title) setTitle(file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 80));
  }

  async function generate() {
    setError(null);
    if (mode === "prompt" && prompt.trim().length < 4) {
      setError("Describe the topic you want to retain.");
      return;
    }
    if (mode === "pdf" && sourceText.trim().length < 80) {
      setError("Upload a PDF (or paste at least a paragraph) first.");
      return;
    }
    if (mode === "image" && !imageFile) {
      setError("Choose an image of your notes or diagram.");
      return;
    }

    setGenerating(true);
    try {
      const sessionId = getSessionId();
      const body: Record<string, unknown> = {
        sessionId,
        mode,
        subject,
        count,
        cloze,
        title: title.trim() || undefined,
        prompt: mode === "prompt" ? prompt.trim() : title.trim() || subject,
        text: mode === "pdf" ? sourceText : undefined,
      };
      if (mode === "image" && imageFile) {
        body.image = { mimeType: imageFile.type || "image/jpeg", data: await fileToBase64(imageFile) };
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed. Try again.");
        return;
      }
      setResult(data as Result);
    } catch {
      setError("Generation failed — check your connection and retry.");
    } finally {
      setGenerating(false);
    }
  }

  /* --------------------------- result view --------------------------- */
  if (result) {
    return (
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-8 md:px-8">
        <div className="surface relative overflow-hidden p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-acid/20 blur-3xl" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-acid">
                <CheckCircle2 className="size-3.5" /> Deck saved
              </span>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-cream">{result.deck.title}</h2>
              <p className="mt-2 text-sm text-cream-dim">
                {result.deck.totalCards} cards · {result.deck.subject} ·{" "}
                <span className={result.deck.generatedBy === "gemini" ? "text-acid" : "text-cream-faint"}>
                  {result.deck.generatedBy === "gemini" ? "Gemini generated" : "Offline engine"}
                </span>
              </p>
            </div>
            <button onClick={reset} className="press rounded-full border border-hairline-strong px-4 py-2 text-xs font-semibold text-cream-dim hover:text-cream">
              Create another
            </button>
          </div>

          {result.warning && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs leading-relaxed text-cream-dim">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" />
              {result.warning}
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/decks/${result.deckId}`}
              className="press inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3 text-sm font-bold text-ink hover:bg-cream"
            >
              Study now <ArrowRight className="size-4" />
            </Link>
            <Link
              href={`/quiz?deck=${result.deckId}`}
              className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-6 py-3 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
            >
              Quiz this deck
            </Link>
            <Link
              href="/decks"
              className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-6 py-3 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
            >
              All decks
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {result.cards.map((card, i) => (
            <div key={i} className="surface p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-cream-faint">
                  {KIND_LABEL[card.kind] ?? "Q&A"} · {i + 1}
                </span>
                <span className="text-[0.6rem] uppercase tracking-[0.18em] text-cream-faint">{result.deck.subject}</span>
              </div>
              <p className="mt-3 font-display text-lg font-medium leading-snug text-cream">
                <ClozeText text={card.front} revealed={false} />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                <ClozeText text={card.back} revealed />
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* --------------------------- studio form --------------------------- */
  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">AI studio</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,5.4vw,3.4rem)] font-medium leading-[1.02] text-cream">
            Source in. <span className="italic text-acid">Recall out.</span>
          </h1>
          <p className="mt-3 max-w-xl text-cream-dim">
            Turn a topic, a PDF chapter or a photo of your notes into a scheduled flashcard deck.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${
            aiEnabled ? "border-acid/40 bg-acid/10 text-acid" : "border-hairline-strong bg-ink-3 text-cream-dim"
          }`}
        >
          <span className={`size-1.5 rounded-full ${aiEnabled ? "bg-acid" : "bg-cream-faint"}`} />
          {aiEnabled ? "Gemini connected" : "Offline engine"}
        </span>
      </div>

      {!aiEnabled && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl border border-hairline bg-ink-2/70 p-4 text-xs leading-relaxed text-cream-dim">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-acid" />
          No <code className="text-acid">GEMINI_API_KEY</code> is configured, so generation runs on the built-in offline
          engine (real cloze cards from your PDF text, scaffolds from prompts). Add the key to the environment and every
          AI feature — generation, image analysis, quizzes, plans and explanations — switches to Gemini automatically.
        </p>
      )}

      {/* mode tabs */}
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`press rounded-2xl border p-4 text-left transition-all ${
              mode === m.id
                ? "border-acid/60 bg-acid/10 shadow-[0_0_28px_rgba(207,240,76,0.12)]"
                : "border-hairline bg-ink-2/60 hover:border-hairline-strong"
            }`}
          >
            <m.icon className={`size-5 ${mode === m.id ? "text-acid" : "text-cream-dim"}`} />
            <p className="mt-3 text-sm font-semibold text-cream">{m.label}</p>
            <p className="mt-1 text-xs text-cream-faint">{m.hint}</p>
          </button>
        ))}
      </div>

      {/* source panel */}
      <div className="surface mt-5 p-6">
        {mode === "prompt" && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-faint">Topic or instruction</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Photosynthesis light-dependent reactions, with the exam traps for C4 plants"
              className="mt-2 w-full resize-y rounded-xl border border-hairline bg-ink-3 px-4 py-3 text-sm leading-relaxed text-cream placeholder:text-cream-faint focus:border-acid/60 focus:outline-none"
            />
            <p className="mt-2 text-xs text-cream-faint">Be specific about the syllabus level — it changes the depth of every card.</p>
          </div>
        )}

        {mode === "pdf" && (
          <div>
            <input
              ref={pdfInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePdf(f);
              }}
            />
            <button
              onClick={() => pdfInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handlePdf(f);
              }}
              className="press flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline-strong bg-ink-3/50 px-6 py-10 text-center transition-colors hover:border-acid/60"
            >
              {extracting ? <Loader2 className="size-7 animate-spin text-acid" /> : <UploadCloud className="size-7 text-acid" />}
              <span className="mt-1 text-sm font-semibold text-cream">
                {extracting ? "Extracting text…" : extract ? "Replace PDF" : "Drop a PDF or click to upload"}
              </span>
              <span className="text-xs text-cream-faint">Up to 12 MB · text is extracted on the server</span>
            </button>

            {pdfError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs text-cream-dim">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /> {pdfError}
              </p>
            )}

            {extract && (
              <div className="mt-4 rounded-2xl border border-hairline bg-ink-3/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-cream">
                    <FileText className="size-4 text-acid" /> {extract.filename}
                  </p>
                  <span className="text-[0.68rem] uppercase tracking-[0.16em] text-cream-faint">
                    {extract.pages ? `${extract.pages} pages · ` : ""}
                    {extract.chars.toLocaleString()} chars{extract.truncated ? " (trimmed)" : ""}
                  </span>
                </div>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={6}
                  className="mt-3 w-full resize-y rounded-xl border border-hairline bg-ink px-3.5 py-3 text-xs leading-relaxed text-cream-dim focus:border-acid/60 focus:outline-none"
                />
                <p className="mt-2 text-[0.68rem] text-cream-faint">Edit the extract to remove page numbers or unrelated chapters.</p>
              </div>
            )}
          </div>
        )}

        {mode === "image" && (
          <div>
            <input
              ref={imgInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImage(f);
              }}
            />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Uploaded study image" className="max-h-72 w-full object-contain bg-ink" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (imgInput.current) imgInput.current.value = "";
                  }}
                  className="press absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-ink/80 text-cream hover:bg-ember hover:text-ink"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => imgInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleImage(f);
                }}
                className="press flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline-strong bg-ink-3/50 px-6 py-10 text-center transition-colors hover:border-acid/60"
              >
                <ImageIcon className="size-7 text-acid" />
                <span className="mt-1 text-sm font-semibold text-cream">Drop a diagram, slide or handwritten page</span>
                <span className="text-xs text-cream-faint">PNG / JPG / WebP · up to 5 MB</span>
              </button>
            )}
            {imageError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs text-cream-dim">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /> {imageError}
              </p>
            )}
            {!aiEnabled && (
              <p className="mt-3 text-xs text-cream-faint">
                Offline mode builds recall scaffolds about the image topic; connect Gemini to read labels and relationships
                from the picture itself.
              </p>
            )}
          </div>
        )}

        {/* options */}
        <div className="mt-6 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-faint">Deck title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional — auto-named"
              className="mt-2 w-full rounded-xl border border-hairline bg-ink-3 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-faint focus:border-acid/60 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-faint">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-xl border border-hairline bg-ink-3 px-3.5 py-2.5 text-sm text-cream focus:border-acid/60 focus:outline-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-cream-faint">
              Cards <span className="text-acid">{count}</span>
            </span>
            <input
              type="range"
              min={5}
              max={25}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-3 w-full accent-[#cff04c]"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-hairline bg-ink-3 px-4 py-3">
            <input
              type="checkbox"
              checked={cloze}
              onChange={(e) => setCloze(e.target.checked)}
              className="size-4 accent-[#cff04c]"
            />
            <span className="text-sm text-cream">
              Prefer cloze deletions
              <span className="block text-xs text-cream-faint">Fill-the-blank recall</span>
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs text-cream-dim">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /> {error}
          </p>
        )}

        <button
          onClick={generate}
          disabled={generating || extracting}
          className="press mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-acid px-6 py-4 text-sm font-bold text-ink shadow-[0_10px_36px_rgba(207,240,76,0.28)] transition-colors hover:bg-cream disabled:opacity-60"
        >
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {generating ? "Drafting your deck…" : `Generate ${count} cards`}
        </button>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-cream-faint">
        <Layers className="size-3.5" /> Cards are saved to your deck library and scheduled with spaced repetition.
      </p>
    </div>
  );
}
