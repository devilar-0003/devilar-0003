# Supabase connection settings

Use these Netlify environment variables (Functions/Runtime scope):

- `SUPABASE_URL=https://fzlllbypgsegaztsoqjk.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=<your sb_publishable_... key>`
- `DATABASE_URL=<PostgreSQL connection string from Supabase Dashboard → Connect>`

Important:
- The REST URL `https://fzlllbypgsegaztsoqjk.supabase.co/rest/v1/ScholarAI` is an HTTP endpoint, not a PostgreSQL connection string.
- The provided `sb_publishable_...` key is a publishable key, not a service-role key. Set it as `SUPABASE_PUBLISHABLE_KEY`; Row Level Security (RLS) still applies.
- Do not put credentials in source files, commit `.env.local`, or use `NEXT_PUBLIC_` for database or privileged keys.
- Only configure `SUPABASE_SERVICE_ROLE_KEY` if privileged server-side access is actually needed. Never use a publishable key under that variable name.
- The app's server-only REST helper targets `/rest/v1/ScholarAI`. The table's columns and RLS policies must be checked in Supabase before application reads/writes are wired to a specific schema.
