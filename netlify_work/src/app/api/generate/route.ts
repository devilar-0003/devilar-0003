import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, aiCards, mediaAssets } from "@/db/schema";
import { generateCards } from "@/lib/generator";
import { aiEnabled } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMAGE_BYTES_LIMIT = 5 * 1024 * 1024;

interface Body {
  sessionId?: string;
  mode?: "prompt" | "pdf" | "image";
  title?: string;
  subject?: string;
  prompt?: string;
  text?: string;
  count?: number;
  cloze?: boolean;
  image?: { mimeType?: string; data?: string };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  const mode = body.mode ?? "prompt";
  const subject = (body.subject ?? "General").trim().slice(0, 40) || "General";
  const count = Math.max(3, Math.min(30, Math.round(Number(body.count) || 10)));

  if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  if (!["prompt", "pdf", "image"].includes(mode)) {
    return NextResponse.json({ error: "Unknown generation mode." }, { status: 400 });
  }
  if (mode === "prompt" && !(body.prompt ?? "").trim()) {
    return NextResponse.json({ error: "Describe the topic you want cards for." }, { status: 400 });
  }
  if (mode === "pdf" && (body.text ?? "").trim().length < 80) {
    return NextResponse.json(
      { error: "Extract or paste at least a paragraph of source text before generating." },
      { status: 400 }
    );
  }

  let imagePayload: { mimeType: string; data: string } | undefined;
  if (mode === "image") {
    const mime = (body.image?.mimeType ?? "").toLowerCase();
    const data = body.image?.data ?? "";
    if (!/^image\/(png|jpe?g|webp|heic|heif)$/.test(mime)) {
      return NextResponse.json({ error: "Upload a PNG, JPG or WebP image." }, { status: 415 });
    }
    if (!data) return NextResponse.json({ error: "Image data missing." }, { status: 400 });
    if (Buffer.byteLength(data, "base64") > IMAGE_BYTES_LIMIT) {
      return NextResponse.json({ error: "Image is larger than 5 MB — compress it and retry." }, { status: 413 });
    }
    imagePayload = { mimeType: mime, data };
  }

  try {
    const result = await generateCards({
      mode,
      subject,
      prompt: body.prompt?.trim(),
      text: body.text,
      image: imagePayload,
      count,
      cloze: Boolean(body.cloze),
    });

    if (result.cards.length === 0) {
      return NextResponse.json({ error: "No cards could be generated. Add more source material." }, { status: 422 });
    }

    let imageId: number | null = null;
    if (imagePayload) {
      const [asset] = await db
        .insert(mediaAssets)
        .values({ sessionId, mimeType: imagePayload.mimeType, data: imagePayload.data })
        .returning({ id: mediaAssets.id });
      imageId = asset?.id ?? null;
    }

    const fallbackTitle =
      mode === "prompt"
        ? `Topic: ${(body.prompt ?? "").trim().slice(0, 70)}`
        : mode === "pdf"
          ? "PDF chapter deck"
          : "Image notes deck";
    const title = (body.title ?? "").trim().slice(0, 90) || fallbackTitle;

    const [deck] = await db
      .insert(decks)
      .values({
        sessionId,
        title,
        subject,
        sourceType: mode,
        summary: result.summary,
        generatedBy: result.generatedBy,
      })
      .returning();

    if (!deck) throw new Error("deck insert failed");

    await db.insert(aiCards).values(
      result.cards.map((c) => ({
        deckId: deck.id,
        sessionId,
        subject,
        kind: mode === "image" && imageId ? ("image" as const) : c.kind,
        front: c.front,
        back: c.back,
        imageId,
      }))
    );

    return NextResponse.json({
      deckId: deck.id,
      deck: {
        id: deck.id,
        title: deck.title,
        subject: deck.subject,
        sourceType: deck.sourceType,
        summary: deck.summary,
        generatedBy: result.generatedBy,
        totalCards: result.cards.length,
      },
      cards: result.cards,
      aiEnabled: aiEnabled(),
      warning: result.warning,
    });
  } catch (err) {
    console.error("[generate] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed. Try a shorter source." },
      { status: 500 }
    );
  }
}
