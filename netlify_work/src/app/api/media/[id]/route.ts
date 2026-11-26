import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mediaId = Number(id);
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!Number.isInteger(mediaId) || !sessionId) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const [asset] = await db
      .select({ mimeType: mediaAssets.mimeType, data: mediaAssets.data })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.sessionId, sessionId)))
      .limit(1);

    if (!asset) return new Response("Not found", { status: 404 });

    const bytes = Buffer.from(asset.data, "base64");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
