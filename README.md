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
   string**. You need two of the connection strings shown there — the
   *Transaction* pooler (port 6543) and the *Session* pooler (port 5432).
   Do **not** use the raw "direct connection" host
   (`db.<ref>.supabase.co`) for either — it's IPv6-only unless you've
   bought Supabase's IPv4 add-on, and most local networks and CI/build
   environments can't reach it.
3. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — the Transaction pooler string (append
     `?pgbouncer=true` if not already present)
   - `DIRECT_URL` — the Session pooler string
   - `SESSION_SECRET` — a random secret:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `INVITE_CODE` — a shared code required to sign up:
     `node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))"`

   If your database password contains characters like `@ : / ? #` or
   non-ASCII letters, URL-encode it first (`node -e
   "console.log(encodeURIComponent(process.argv[1]))" 'your-password'`) —
   an unescaped `@` in particular breaks the connection string, since `@`
   is what separates credentials from the host.
4. Install dependencies and apply the schema:
   ```bash
   npm install
   npm run db:migrate
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
- `npm run db:migrate` — apply pending migrations without prompting (what
  production uses)

---

## Deploying (Netlify or Vercel + Supabase)

The app is host-agnostic Next.js — these steps work the same on Netlify
or Vercel, just adjust which dashboard you're in.

1. Push this repo to GitHub and import it into
   [Netlify](https://app.netlify.com/start) or
   [Vercel](https://vercel.com/new). Build settings are auto-detected
   (build command `npm run build`, publish directory `.next`) — leave
   them as-is.
2. In the site's environment variables settings, add:
   - `DATABASE_URL` — the Transaction pooler string
   - `DIRECT_URL` — the Session pooler string
   - `SESSION_SECRET` — a **different** value than your local one
   - `INVITE_CODE` — share this only with people you want to invite
3. Deploy. The build only runs `next build` — it does **not** touch the
   database, so a build can never fail because Supabase happened to be
   unreachable from the build server.
4. Apply pending migrations as an explicit, separate step, from anywhere
   that can reach the database (your machine, a CI job, etc.):
   ```bash
   npm run db:migrate
   ```
   Do this once before the first deploy, and again after any deploy that
   includes a schema change (i.e. a new folder under `prisma/migrations`).
5. First deploy will have no users — sign up with the invite code once the
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
| `npm run build` | Build for production (doesn't touch the database) |
| `npm run db:migrate` | Apply pending Prisma migrations |
| `npm start` | Start the production server (after `build`) |
| `npm run lint` | Run ESLint |
