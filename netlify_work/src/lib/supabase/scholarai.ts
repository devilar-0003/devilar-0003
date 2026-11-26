import "server-only";

const SUPABASE_RESOURCE = "ScholarAI";

type RestMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Server-only helper for the Supabase REST resource configured by the project owner.
 * Keep the service-role key on the server; never expose it through NEXT_PUBLIC_*.
 */
export async function scholarAiRest<T = unknown>(options: {
  method?: RestMethod;
  query?: URLSearchParams;
  body?: unknown;
  prefer?: string;
} = {}): Promise<T> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  if (!apiKey) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY, or SUPABASE_ANON_KEY");

  const method = options.method ?? "GET";
  const query = options.query?.toString();
  const endpoint = `${supabaseUrl}/rest/v1/${SUPABASE_RESOURCE}${query ? `?${query}` : ""}`;
  const headers = new Headers({
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  });

  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.prefer) headers.set("Prefer", options.prefer);

  const response = await fetch(endpoint, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    // Avoid returning provider response bodies that may contain schema or data details.
    throw new Error(`Supabase ScholarAI REST request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  const responseText = await response.text();
  return (responseText ? JSON.parse(responseText) : undefined) as T;
}
