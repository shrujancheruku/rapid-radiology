# Development

Setup for running the full stack locally. If you only want to look at the app, use [demo mode](demo-mode.md): no accounts or keys needed.

## Prerequisites

- Node 24 (see `frontend/.nvmrc`)
- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- A Supabase project, an OpenAI API key and a Gemini API key (below)

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Keep email auth on. There is no sign-up page, so create your user by hand under Authentication > Users.
3. Collect four values:
   - **Project URL** and **anon key**: Project Settings > API (frontend).
   - **JWT secret**: Project Settings > API (backend; the backend verifies tokens with this shared secret, see [ADR 0002](adr/0002-backend-owns-data-supabase-only-for-auth.md)).
   - **Postgres connection string**: Connect > Connection string (URI) (backend).

## Model API keys

- OpenAI: <https://platform.openai.com/api-keys>
- Gemini: <https://aistudio.google.com/apikey>

## Environment variables

Copy each example file and fill it in. Every variable has a comment saying where its value comes from.

| File                                                | Variables                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`backend/.env.example`](../backend/.env.example)   | `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ENV`, `CORS_ORIGINS` |
| [`frontend/.env.example`](../frontend/.env.example) | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`                                    |

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Never commit real values.

## Migrations

```sh
cd backend && uv run alembic upgrade head
```

With `ENV=development` the backend also runs migrations on startup.

## Run it

```sh
# backend, on http://localhost:8000
cd backend && uv sync --locked && uv run fastapi dev main.py

# frontend, on http://localhost:5173
cd frontend && npm ci && npm run dev
```

## Checks

These are the same commands CI runs (`.github/workflows/ci.yml`).

```sh
# backend/
uv sync --locked && uv run ruff check . && uv run ruff format --check . && uv run pytest

# frontend/
npm ci && npm run lint && npm run build && npm run format:check
```

Fix formatting with `uv run ruff format .` and `npm run format`. Backend tests use in-memory SQLite, so they need no `.env`. The frontend has no tests.

## Demo mode and screenshots

- `npm run dev:demo` runs the app with fake auth and API ([demo-mode.md](demo-mode.md)).
- `npm run screenshots` rebuilds the demo, drives it with Playwright and writes the images and GIF in [`docs/images/`](images/). One-time prerequisites: `npx playwright install chromium` and ffmpeg on your PATH (`brew install ffmpeg`). Node 22.18 or later is needed to run the TypeScript script directly. Regenerate on purpose, not on every change: each run adds new binary blobs to git history. The demo's fake delay is random (2 to 4 s), so the GIF's timing varies slightly between runs.

## Adding a Report Type

1. Add an Alembic migration that adds the value to the Postgres enum (see `backend/migrations/versions/` for an example; keep one migration head).
2. Add the member to the `ReportType` enum in `backend/models.py`.
3. Add it to the frontend `ReportType` in `frontend/src/types.ts`.
