# plated

Given a list of ingredients, show recipes you can make with them.

```
plated/
├── apps/
│   ├── api/         Hono backend — talks to Spoonacular, holds the API key
│   └── mobile/      Expo + React Native app
└── packages/
    └── shared/      zod schemas + types used by both sides
```

## Setup

This repo uses **pnpm** (pinned via `packageManager`; `corepack enable pnpm`
gets you the right version).

```bash
pnpm install
cp .env.example apps/api/.env   # then paste your Spoonacular key
```

Get a key at <https://spoonacular.com/food-api/console#Dashboard>.

## Run

```bash
pnpm api      # http://localhost:3000
pnpm mobile   # Expo dev server
```

On a **physical device**, `localhost` resolves to the phone, not your Mac.
Create `apps/mobile/.env` with your LAN address:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

Other scripts: `pnpm typecheck` (all workspaces), `pnpm lint`, `pnpm format`.

## API

| Method | Path               | Notes                                               |
| ------ | ------------------ | --------------------------------------------------- |
| `GET`  | `/health`          | Liveness + cache size                               |
| `POST` | `/recipes/suggest` | Ingredients in, recipe cards out. 1 upstream call.  |
| `GET`  | `/recipes/:id`     | Full recipe for the detail screen. 1 upstream call. |

```bash
curl -X POST http://localhost:3000/recipes/suggest \
  -H 'Content-Type: application/json' \
  -d '{"ingredients":["chicken","rice","broccoli"]}'
```

## Things that will bite you

**The Spoonacular key must never reach the mobile app.** App bundles are
trivially decompilable. Every upstream call goes through `apps/api`. Anything
prefixed `EXPO_PUBLIC_` ships inside the bundle — never put a secret there.

**Quota is the real constraint, not latency.** Search costs `1 + 0.01 × results`
points; each detail view costs 1. The free tier is 50 points/day — roughly a
dozen sessions, total, across all users. That's a development budget, not a
launch one. Cook ($29/mo, 1,500/day) is about ~365 sessions/day.

**Caching is capped at 1 hour by Spoonacular's terms.** `CACHE_TTL_SECONDS` is
hard-limited to 3600 in `apps/api/src/env.ts` so a stray `.env` can't put you
out of compliance. You cannot build a persistent local recipe corpus from their
data — the bill scales with usage indefinitely.

**`findByIngredients` returns no instructions.** No cook time, servings, or
steps either. That's why the detail screen is a separate endpoint and a separate
upstream call — only pay for it when a user actually taps in.

## Design notes

`RecipeSource` (`apps/api/src/sources/types.ts`) is the swap seam. Routes depend
on that interface, never on Spoonacular directly, so adding a second provider or
slotting an LLM re-ranking layer in front is an `apps/api` change that touches
neither the routes nor the mobile app.

The schemas in `packages/shared` define **our** contract, deliberately not
Spoonacular's shape. `id` is a string even though theirs are numeric, so a
future source with slug ids isn't a breaking change.

The official `spoonacular` SDK ships no TypeScript types and is callback-only.
`apps/api/types/spoonacular.d.ts` is a hand-written shim for the call surface;
zod validation at the boundary is what actually makes responses type-safe.
