# Daily Goals Tracker

A shared household goals tracker. Each person keeps a list of daily
goals worth points; completions roll up into a daily grade shown on a
shared calendar so everyone can see everyone else's progress. See
[plan.md](./plan.md) for the full concept and [design-plan.md](./design-plan.md)
for the visual system.

**Stack:** Next.js 15 (App Router) · Prisma · Postgres (Supabase) · Tailwind ·
JWT session cookies (`jose`) · Zod validation.

---

## Local development

1. **Create a Supabase project** (or use an existing one) at
   [supabase.com](https://supabase.com).
2. In the Supabase dashboard: **Project Settings → Database → Connection
   string**. Copy the *Transaction pooler* string (port 6543) and the
   *direct* connection string (port 5432).
3. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — the pooler connection string (append
     `?pgbouncer=true` if not already present)
   - `DIRECT_URL` — the direct connection string
   - `SESSION_SECRET` — a random secret:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `INVITE_CODE` — a shared code required to sign up:
     `node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"`
4. Install dependencies and apply the schema:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000), sign up using the
   `INVITE_CODE` you generated above.

### Useful Prisma commands

- `npx prisma studio` — browse/edit data in a GUI
- `npx prisma migrate dev --name <change>` — create a new migration after
  editing `prisma/schema.prisma` (requires a reachable dev database)
- `npx prisma migrate deploy` — apply pending migrations without prompting
  (what production uses)

---

## Deploying (Vercel + Supabase)

1. Push this repo to GitHub and import it into
   [Vercel](https://vercel.com/new).
2. In the Vercel project's **Settings → Environment Variables**, add for
   the Production (and Preview, if used) environment:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SESSION_SECRET` — a **different** value than your local one
   - `INVITE_CODE` — share this only with people you want to invite
3. Deploy. The build runs `prisma migrate deploy` automatically (see
   `package.json`'s `build` script) before `next build`, so pending
   migrations are applied on every deploy.
4. First deploy will have no users — sign up with the invite code once the
   site is live to create the first account.

### Notes

- Every route except `/login` requires a session; `src/middleware.ts`
  redirects unauthenticated visitors there.
- The whole app is marked `noindex, nofollow` (see `next.config.mjs` and
  `layout.tsx`) since it's a private, personal-data app — don't rely on
  that alone, keep the deployed URL and invite code out of public places.
- Login/signup are rate-limited per IP (`src/lib/rateLimit.ts`) as a
  brute-force deterrent. It's in-memory per server instance, not a
  distributed limiter — sufficient for a small household app, not for
  anything at real scale.

---

## Security posture

- **Sessions** are signed JWTs (`jose`, HS256) in an httpOnly, `SameSite=Lax`
  cookie. Each user has a `tokenVersion`; every request checks the token's
  version against the DB, so a session can be revoked before its 30-day
  expiry — "Log out other devices" in the nav bumps it. `SESSION_SECRET`
  is checked at runtime to make sure production never runs on the local
  dev default.
- **Passwords** are hashed with bcrypt (cost 12). Login always runs a
  bcrypt comparison, even for an email that doesn't exist (against a fixed
  dummy hash), so response timing can't be used to enumerate accounts.
- **Signup** requires `INVITE_CODE` and fails closed (rejects all signups)
  if that env var isn't set, rather than defaulting to open.
- **Headers**: a nonce-based Content-Security-Policy (`src/middleware.ts`,
  loosened for `unsafe-eval`/websockets only in dev, for Fast Refresh) plus
  HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and
  `Permissions-Policy` (`next.config.mjs`).
- **Rate limiting** (`src/lib/rateLimit.ts`, in-memory per instance) on
  login, signup, and goal creation.
- **Authorization**: every goal read/write re-checks `goal.userId` against
  the session user server-side (Prisma, no raw SQL) — cross-user IDs
  return 404, not another user's data.
- **Dependencies**: `npm audit` is clean except one high-severity postcss
  advisory bundled *inside* Next.js's own `node_modules` (not a top-level
  dependency) — it requires processing attacker-controlled CSS/source
  maps at runtime, which this app never does, and the fix requires Next 16
  (very new at time of writing). Re-run `npm audit` periodically and take
  the Next 16 upgrade once it's had time to mature.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Apply pending migrations, then build for production |
| `npm start` | Start the production server (after `build`) |
| `npm run lint` | Run ESLint |
