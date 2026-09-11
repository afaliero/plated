# plated

Given a list of ingredients, show recipes you can make with them.

```
plated/
├── compose.yaml                        Local MySQL + persistent data volume
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── routes/                  HTTP routes + orchestrator
│   │       ├── services/ai/
│   │       │   ├── openai-client.ts     Responses API transport
│   │       │   ├── model-policy.ts      Explicit task-to-model policy
│   │       │   └── types.ts              AI client contracts
│   │       ├── services/fridge/
│   │       │   ├── fridge-service.ts     Inventory operations
│   │       │   ├── types.ts              Service + repository contracts
│   │       │   └── storage/              MySQL fridge repository
│   │       ├── services/recipe/
│   │       │   ├── recipe-service.ts     Recipe logic + internal conversion
│   │       │   ├── preference-ranker.ts  Recipe preference ranking task
│   │       │   ├── types.ts              Service contract
│   │       │   ├── storage/              Recipe-owned cache instances
│   │       │   └── client/
│   │       │       ├── recipe-client.ts  Vendor-neutral client
│   │       │       └── spoonacular/      Vendor client + configuration
│   │       ├── storage/
│   │           ├── cache.ts             Shared cache primitive
│   │           ├── knexfile.ts          Knex/MySQL configuration
│   │           └── db/
│   │               ├── knex.ts          Shared DB + startup initialization
│   │               ├── migrations/      Numbered table migrations
│   │               └── seeds/           Numbered table seeds
│   │       └── evals/recipe-preferences/
│   │           ├── metrics.ts           Deterministic ranking metrics
│   │           └── metrics.test.ts      Offline eval tests
│   └── frontend/                        Expo + React Native app
└── packages/
    └── shared/      zod schemas + types used by both sides
```

Backend recipe flow:

```text
route -> orchestrator -> RecipeService -> RecipeClient -> SpoonacularClient
```

Personalized recipe flow:

```text
POST /fridge/recipes
  -> Orchestrator -> RecipeService (uncached when preferences are present)
  -> PreferenceRanker (gpt-5.6-luna only)
  -> validated candidate IDs -> trusted recipe cards
```

OpenAI transport lives under `apps/backend/src/services/ai/`. It owns the
Responses API client and the explicit task-to-model policy. Domain services own
their prompts and output validation; recipe preference eval metrics live under
`apps/backend/src/evals/recipe-preferences/`.

Fridge inventory flow:

```text
FridgeScreen -> useFridge -> API client -> fridge routes (development user 1)
             -> orchestrator -> FridgeService -> FridgeRepository -> MySQL
```

Frontend navigation:

```text
RootNavigator (bottom tabs)
├── Fridge  -> FridgeScreen
└── Recipes -> native stack
               ├── Search -> SearchScreen
               └── RecipeDetail -> RecipeDetailScreen
```

The tab bar remains visible on recipe details, with a back button returning to
the recipe list. Fridge inventory loads from MySQL, and additions/removals update
the screen after the API confirms them. Recipes load from the saved fridge and
refresh when the Recipes tab comes into focus.

## Setup

This repo uses **pnpm** (pinned via `packageManager`; `corepack enable pnpm`
gets you the right version).

```bash
pnpm install
cp .env.example apps/backend/.env   # then paste your Spoonacular key
```

Get a key at <https://spoonacular.com/food-api/console#Dashboard>.

Enable the local secret-scanning commit hook once per clone:

```bash
brew install git-secrets
pnpm hooks:install
```

The hook scans staged contents using git-secrets with AWS and project credential
patterns. It blocks real `.env` files, allows the specific placeholders in
`.env.example`, and accepts Docker environment-variable references. Findings
report filenames without printing secret values. A missing scanner or scan
failure blocks the commit. Never bypass the hook. These pattern checks do not
guarantee detection of every secret or scan existing commit history.

Install and open Docker Desktop. Set `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`
in `apps/backend/.env` to local development passwords. MySQL runs in Docker,
available to the backend at `127.0.0.1:3307`; its data lives in a named volume.
Docker creates the configured database and user on the first initialization.
Changing these environment settings later does not update an existing database's
credentials.

`pnpm backend` starts MySQL, waits for its health check, and starts the backend
locally. Every backend startup applies pending migrations and then reseeds the
`users`, `ingredients`, and `fridges` tables, deleting their previous contents.
This reseeding is intentional for local development; revisit it before moving
to a hosted database.

```text
pnpm backend -> Docker MySQL ready -> backend migrations -> seeds -> HTTP server
```

## Run

```bash
pnpm backend   # http://localhost:3000
pnpm frontend  # Expo dev server
```

Keep Docker Desktop running. If a newly installed `docker` command is not found,
open a new terminal tab so your shell picks up Docker's PATH configuration.
Stop the backend with Ctrl+C before running `pnpm backend` again; its development
watcher also restarts the backend and reseeds after source edits.

```bash
docker compose --env-file apps/backend/.env ps
docker compose --env-file apps/backend/.env logs -f db
docker compose --env-file apps/backend/.env stop db
```

Stopping the container preserves the volume, but backend startup still reseeds
the application tables.

On a **physical device**, `localhost` resolves to the phone, not your Mac.
Create `apps/frontend/.env` with your LAN address:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

Other scripts: `pnpm typecheck` (all workspaces), `pnpm lint`, `pnpm format`.

## API

| Method   | Path                          | Notes                                                                  |
| -------- | ----------------------------- | ---------------------------------------------------------------------- |
| `GET`    | `/health`                     | Liveness + cache size                                                  |
| `POST`   | `/recipes/suggest`            | Ingredients in, recipe cards out. 1 upstream call.                     |
| `GET`    | `/recipes/:id`                | Full recipe for the detail screen. 1 upstream call.                    |
| `GET`    | `/fridge`                     | Saved inventory for the development user.                              |
| `POST`   | `/fridge/items`               | Add `{ "name": "rice" }`; return updated inventory.                    |
| `DELETE` | `/fridge/items/:ingredientId` | Remove an item; return updated inventory.                              |
| `POST`   | `/fridge/recipes`             | Recipe suggestions; optional `{ "preferences": "salty and citrusy" }`. |

Fridge responses have the shape `{ "items": [{ "id": 2, "name": "rice" }] }`.
When preferences are included in `POST /fridge/recipes`, the backend makes one
uncached Spoonacular call followed by one `gpt-5.6-luna` ranking call. The model
can select only IDs from the Spoonacular candidate set. If ranking fails, the
backend returns the unranked candidates and does not try another model.
Names are normalized for case and whitespace. Adding an existing ingredient or
removing an absent item succeeds without creating duplicates. Custom ingredient
names are supported, with a maximum of 150 characters.

Until authentication is implemented, all fridge requests use seeded user `1`,
selected by the backend. This is a local development identity, not authentication;
clients cannot select a different user. Added inventory survives app reloads but
is reset by the required reseeding on every backend restart.

Fridge API tests run from `apps/backend` with
`node --import tsx --test src/routes/fridge.test.ts`. The MySQL integration test
uses temporary records in a rolled-back transaction without running seeds:

```bash
cd apps/backend
RUN_DB_TESTS=1 node --env-file-if-exists=.env --import tsx --test src/services/fridge/storage/fridge-repository.test.ts
```

```bash
curl -X POST http://localhost:3000/recipes/suggest \
  -H 'Content-Type: application/json' \
  -d '{"ingredients":["chicken","rice","broccoli"]}'
```

## Things that will bite you

**The Spoonacular key must never reach the mobile app.** App bundles are
trivially decompilable. Every upstream call goes through `apps/backend`. Anything
prefixed `EXPO_PUBLIC_` ships inside the bundle — never put a secret there.

**Quota is the real constraint, not latency.** Search costs `1 + 0.01 × results`
points; each detail view costs 1. The free tier is 50 points/day — roughly a
dozen sessions, total, across all users. That's a development budget, not a
launch one. Cook ($29/mo, 1,500/day) is about ~365 sessions/day.

**Caching is capped at 1 hour by Spoonacular's terms.**
`SPOONACULAR_CACHE_TTL_SECONDS` is hard-limited to 3600 in the Spoonacular
client's configuration so a stray `.env` can't put you out of compliance. You
cannot build a persistent local recipe corpus from their data — the bill scales
with usage indefinitely.

**`findByIngredients` returns no instructions.** No cook time, servings, or
steps either. That's why the detail screen is a separate endpoint and a separate
upstream call — only pay for it when a user actually taps in.

## Design notes

Routes validate HTTP input and hand requests to the backend `Orchestrator`. The
orchestrator calls `RecipeService`, which owns recipe conversion and its cache.
`RecipeService` depends on the vendor-neutral `RecipeClient`; the client delegates
to `SpoonacularClient`. A future vendor implements the same client contract, so
neither the service contract nor the routes need to change.

The schemas in `packages/shared` define **our** contract, deliberately not
Spoonacular's shape. `id` is a string even though theirs are numeric, so a
future source with slug ids isn't a breaking change.

The official `spoonacular` SDK ships no TypeScript types and is callback-only.
`apps/backend/types/spoonacular.d.ts` is a hand-written shim for the call surface;
zod validation at the boundary is what actually makes responses type-safe.
