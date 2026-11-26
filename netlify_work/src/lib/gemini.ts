/**
 * Minimal, dependency-free Gemini REST client.
 *
 * Configure with GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY).
 * When no key is present every caller falls back to the deterministic engine in
 * `src/lib/generator.ts`, so the product keeps working end-to-end.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export function getApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_GENAI_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

export function aiEnabled(): boolean {
  return getApiKey() !== null;
}

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

function endpoint(): string {
  const base = process.env.GEMINI_API_BASE ?? "https://generativelanguage.googleapis.com/v1beta";
  return `${base}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
}

export async function geminiGenerate(opts: {
  parts: GeminiPart[];
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const key = getApiKey();
  if (!key) throw new GeminiError("Gemini is not configured", 503);

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: opts.parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new GeminiError(`Gemini request failed (${res.status}): ${text.slice(0, 300)}`, res.status);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };
    if (data.promptFeedback?.blockReason) {
      throw new GeminiError(`Gemini blocked the request (${data.promptFeedback.blockReason})`, 400);
    }
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";
    if (!text) throw new GeminiError("Gemini returned an empty response", 502);
    return text;
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiError("Gemini request timed out", 504);
    }
    throw new GeminiError(err instanceof Error ? err.message : "Gemini request failed", 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Parse model JSON defensively: strips fences, trailing commas and prose wrappers. */
export function parseJsonLoose<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();

  const attempt = (candidate: string): T | undefined => {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return undefined;
    }
  };

  const direct = attempt(text);
  if (direct !== undefined) return direct;

  const cleaned = text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  const second = attempt(cleaned);
  if (second !== undefined) return second;

  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start >= 0 && end > start) {
    const slice = attempt(cleaned.slice(start, end + 1));
    if (slice !== undefined) return slice;
  }
  throw new GeminiError("Could not parse the AI response as JSON", 502);
}
