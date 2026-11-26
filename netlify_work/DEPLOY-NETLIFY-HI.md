# Netlify par deploy kaise karein (Hindi)

## Zaroori setup
1. Neon ya Supabase par PostgreSQL database banayein.
2. Uska pooled PostgreSQL connection URL copy karein.
3. Netlify site ke **Site configuration → Environment variables** mein `DATABASE_URL` add karein.
4. Gemini AI chahiye to `GEMINI_API_KEY` bhi add karein. Is key ko `NEXT_PUBLIC_` naam na dein.
5. Variables ko Builds aur Functions dono scopes mein available rakhein.

## Database tables banayein
Project ko apne PC par extract karke terminal mein chalayein:

```bash
npm install
copy .env.example .env.local
```

`.env.local` mein actual `DATABASE_URL` bharein, phir:

```bash
npm run db:push
```

Yeh command database ki required tables banayegi.

## Netlify deploy
1. Project ko GitHub repository mein upload karein.
2. Netlify → Add new site → Import an existing project.
3. Repository select karein.
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Node version: `22` (project mein `.nvmrc` bhi diya hai).
7. Deploy site par click karein.

Netlify Next.js App Router aur API routes ko automatically serverless runtime par chalata hai. Is project ko static export mat karein.

## Deploy ke baad check
`https://YOUR-SITE.netlify.app/api/health` kholein. `{"ok":true}` ka matlab database connection sahi hai. Error aaye to `DATABASE_URL`, SSL, database access aur `npm run db:push` check karein.

Detailed instructions English mein `README-NETLIFY.md` mein hain.


## Supabase REST API setup

- `SUPABASE_URL`: `https://fzlllbypgsegaztsoqjk.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Project Settings → API Keys se service-role/secret key (sirf server-side).
- `SUPABASE_PUBLISHABLE_KEY`: tumhari `sb_publishable_...` key (ye publishable key hai, service-role key nahi; RLS apply hogi).
- `SUPABASE_SERVICE_ROLE_KEY`: sirf tab jab privileged server-side access zaroori ho; ise browser/GitHub mein kabhi expose mat karna.
- `SUPABASE_ANON_KEY`: purane projects ke legacy anon key ke liye optional.

Project ka server-only helper `src/lib/supabase/scholarai.ts` `/rest/v1/ScholarAI` endpoint use karta hai. `ScholarAI` table aur uske columns/RLS policies Supabase mein verify karna zaroori hai. Aapka diya hua REST URL `DATABASE_URL` nahi hai; PostgreSQL connection string Dashboard ke **Connect** section se alag milega. Di hui `sb_publishable_...` key ko Netlify mein `SUPABASE_PUBLISHABLE_KEY` naam se add karein—ise `SUPABASE_SERVICE_ROLE_KEY` naam se set na karein.
