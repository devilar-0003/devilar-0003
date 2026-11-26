# Deploy this project to Netlify

This is a full-stack Next.js App Router application. Keep it as a Next.js deployment; **do not use a static export** and do not add a `/* /index.html 200` SPA redirect. Netlify's managed Next.js adapter handles server rendering and `/api/*` route handlers.

## 1. Prepare PostgreSQL

Create a hosted PostgreSQL database (for example, Neon or Supabase) and copy its connection string. Prefer the provider's pooled connection string for serverless workloads. Ensure SSL is enabled when required by the provider.

## 2. Configure environment variables

In Netlify: **Site configuration → Environment variables**, add:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string (from Supabase Dashboard → Connect; use a pooler connection for serverless) |
| `SUPABASE_URL` | For Supabase REST | `https://fzlllbypgsegaztsoqjk.supabase.co` (root project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | For privileged REST calls | Supabase service-role key; server-side only, never expose to the browser |
| `SUPABASE_PUBLISHABLE_KEY` | Optional | Supabase `sb_publishable_...` key; access is governed by Row Level Security (RLS) |
| `SUPABASE_ANON_KEY` | Optional legacy alternative | Legacy anon key; access is governed by RLS |
| `GEMINI_API_KEY` | Optional | Google Gemini API key; without it, the app uses its built-in deterministic generation fallback |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-2.5-flash` |
| `GEMINI_API_BASE` | Optional | Defaults to Google's Generative Language API base URL |

Keep all secrets server-side. Never use `NEXT_PUBLIC_` for database credentials or AI keys. Make variables available to both **Builds** and **Functions** scopes if Netlify offers scope selection. Redeploy after changing environment variables.

### Supabase REST API integration

The project includes `src/lib/supabase/scholarai.ts`, a server-only helper targeting the exact REST resource supplied for this project: `/rest/v1/ScholarAI`. It sends the Supabase API key in the required `apikey` and bearer authorization headers and disables fetch caching. Use it only from server code (API route handlers or server actions), for example:

```ts
import { scholarAiRest } from "@/lib/supabase/scholarai";

const rows = await scholarAiRest<unknown[]>({
  method: "GET",
  query: new URLSearchParams({ select: "*", limit: "10" }),
});
```

The actual table columns and Row Level Security policies have not been supplied, so the helper does not assume a schema or automatically read/write user data. The supplied `sb_publishable_...` credential is a publishable key, not a service-role secret; configure it as `SUPABASE_PUBLISHABLE_KEY`. Create/verify the `ScholarAI` table and its RLS policies in Supabase before using the REST helper. Prefer the service-role key only for trusted server-side operations; never prefix it with `NEXT_PUBLIC_` or commit it to Git.

## 3. Deploy

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. Use the included settings: build command `npm run build`, publish directory `.next`, Node.js `22`.
4. Deploy. Netlify detects Next.js and configures its managed adapter automatically.

You can also deploy the ZIP by extracting it locally, then importing the extracted project into a Git repository. Netlify's Git-based deployment is recommended.

## 4. Create the database tables

Before using the app, run this once from your local project folder with `DATABASE_URL` set to the same hosted database:

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set DATABASE_URL (and optionally GEMINI_API_KEY)
npm run db:push
```

For the REST integration, set `SUPABASE_URL` and either `SUPABASE_SERVICE_ROLE_KEY` (privileged server-side access; never expose it) or `SUPABASE_PUBLISHABLE_KEY` (your supplied `sb_publishable_...` key; RLS-restricted access) in Netlify environment variables. A publishable key is not a service-role key and cannot bypass RLS. The REST helper also accepts the legacy `SUPABASE_ANON_KEY` variable. The REST key is separate from `DATABASE_URL`; the `/rest/v1/ScholarAI` URL is not a PostgreSQL connection string.

Alternatively, run `npm run db:generate` and apply committed migrations with `npm run db:migrate` in your release workflow. Do not run schema-push automatically on every production build.

## 5. Verify after deployment

Open `https://YOUR-SITE.netlify.app/api/health`. A healthy database returns `{"ok":true}`. If it returns HTTP 500, verify `DATABASE_URL`, database network access, SSL settings, and that the schema has been pushed. Then test deck creation, flashcards, quiz, plan, and AI generation.

## Notes

- The app uses PostgreSQL for persistent data; Netlify's filesystem is not persistent storage and is not used for app data.
- API routes use the Node.js runtime where required (including PDF extraction and Gemini calls).
- Gemini is optional: core deterministic generation can run without a Gemini key, but Gemini-powered features require a valid key.
- The project uses anonymous browser session IDs in local storage. This is not user authentication; do not treat it as an account/login system.
- Set usage limits and billing alerts on your database and Gemini provider before public launch.
