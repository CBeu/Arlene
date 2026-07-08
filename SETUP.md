# Setup — Supabase + React (TypeScript) in an existing repo

Assumes you've created the GitHub repo and cloned it, and you're
inside the empty repo folder.

## 1. Scaffold the project in place

```bash
# from inside the empty repo folder
npm create vite@latest . -- --template react-ts
npm install
npm install @supabase/supabase-js
```

The `.` scaffolds into the current directory instead of creating a
subfolder. If the folder isn't quite empty (README, LICENSE, .git are
fine), Vite will ask — choose "Ignore files and continue".

Then add the provided files (overwrite the generated `App.tsx`):

```
src/
  App.tsx
  lib/supabaseClient.ts
  hooks/useAuth.ts
  pages/LoginPage.tsx
  pages/LoginPage.css
vite.config.ts        (overwrite, see step 6)
.github/workflows/deploy.yml
```

You can also delete the scaffold's `src/App.css` and `src/assets/`
demo files if you want a clean slate — optional.

## 2. Keep secrets out of git

Vite's generated `.gitignore` already ignores `*.local`. Confirm it
contains this line before your first commit:

```
*.local
```

Your Supabase keys will live in `.env.local`, so they never get
committed.

## 3. Create the Supabase project

1. https://supabase.com → New project (free tier).
2. SQL Editor → run `schema.sql` to create profiles, nominations,
   and votes with row level security enabled.

## 4. Environment variables (local dev)

Create `.env.local` in the repo root:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Both values: Supabase dashboard → Settings → API.

## 5. Enable the sign-in providers

Supabase dashboard → Authentication → Providers:

**Email** — on by default; the app uses magic links, so nothing else
is required. The built-in sender is rate-limited (~2 emails/hour) —
fine for testing; add a free SMTP provider under Authentication →
Email before real use.

**Google**
1. Google Cloud Console → OAuth 2.0 Client ID (Web application).
2. Authorized redirect URI:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Paste client ID + secret into Supabase's Google provider.

**Apple**
1. Requires an Apple Developer account ($99/yr).
2. App ID + Services ID with "Sign in with Apple" enabled.
3. Return URL: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Paste Services ID, Team ID, Key ID, and private key into Supabase.

Apple can wait — Google + email is enough to start.

## 6. Configure Vite for GitHub Pages

Pages serves project sites from `/REPO-NAME/`, so replace
`vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/REPO-NAME/', // must match your repo name, with both slashes
})
```

Using a custom domain or a `username.github.io` root repo? Set
`base: '/'` instead.

## 7. Redirect URLs in Supabase

Authentication → URL Configuration:

- Site URL: `https://USERNAME.github.io/REPO-NAME/`
- Additional redirect URLs: `http://localhost:5173`

Without this, magic links and OAuth will redirect to the wrong place.

## 8. GitHub Pages deployment

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Repo → Settings → Secrets and variables → Actions → add two
   repository secrets: `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` (same values as `.env.local`).
3. Commit and push — the included `.github/workflows/deploy.yml`
   builds and publishes on every push to `main`.

(The anon key appears in the built JS. That's expected — it's the
public client key, and row level security is what protects the data.)

## 9. Run locally

```bash
npm run dev
```

http://localhost:5173 — sign in with email first (zero setup), and
verify a row appears in the `profiles` table.
