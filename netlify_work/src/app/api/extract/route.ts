import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

function tidy(raw: string): string {
  return raw
    .replace(/\r/g, "\n")
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n +/g, "\n")
    .trim();
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file received." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "PDF is larger than 12 MB. Split the chapter and try again." }, { status: 413 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Only PDF files are supported here. Use the image tab for photos." }, { status: 415 });
  }

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buffer);
    const extracted = await extractText(pdf, { mergePages: true });
    const raw = Array.isArray(extracted.text) ? extracted.text.join("\n\n") : extracted.text;
    const text = tidy(raw ?? "");
    const pages = extracted.totalPages ?? null;

    if (text.length < 40) {
      return NextResponse.json(
        {
          error:
            "No selectable text found. This PDF is probably a scan — upload a screenshot of the page in the Image tab instead.",
          pages,
          chars: text.length,
        },
        { status: 422 }
      );
    }

    const LIMIT = 120_000;
    const truncated = text.length > LIMIT;
    return NextResponse.json({
      text: truncated ? text.slice(0, LIMIT) : text,
      chars: Math.min(text.length, LIMIT),
      totalChars: text.length,
      pages,
      truncated,
      filename: file.name,
    });
  } catch (err) {
    console.error("[extract] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not read that PDF. It may be encrypted or corrupted — try a screenshot in the Image tab." },
      { status: 422 }
    );
  }
}
