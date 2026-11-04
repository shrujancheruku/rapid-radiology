# Orchestration config

<!-- Read by /orchestrate:run and its agents. One source per rule: point at files that already hold a fact (CI, instruction files), and write here only what lives nowhere else. -->

## Backlog

- **Tracker docs:** `docs/agents/issue-tracker.md` (operations, blocking, claiming) and `docs/agents/triage-labels.md` (label strings), from `/setup-matt-pocock-skills`. Takeable tickets are open, `ready-for-agent`, unassigned and unblocked, with no open sub-issues and no `wayfinder:` label, taken in ascending issue number. Claim = assign to the user.
- **Domain docs:** `docs/agents/domain.md` (the glossary and ADRs workers and reviewers follow). `GLOSSARY.md` exists; `docs/adr/` does not yet.

## Slots

- **Slots:** 2. How many tickets are in flight at once. Parallel workers multiply token use, so this is the throttle. `/orchestrate:run` suggests changes of one; it changes this line only when the user says yes.
- **Exclusive holds:** while an open PR touches `backend/migrations/` or `.github/workflows/`, no other ticket touches that path.

Tickets run in parallel only when their touch maps don't overlap outside the shared files.

## Verify

Same as `.github/workflows/ci.yml`. Run in each directory the PR touches:

- `backend/`: `uv sync --locked && uv run ruff check . && uv run ruff format --check . && uv run pytest`
- `frontend/`: `npm ci && npm run lint && npm run build && npm run format:check` (no frontend tests exist)

Fix formatting with `uv run ruff format .` / `npm run format`.

## Shared files

- `backend/uv.lock`, `frontend/package-lock.json`: never merge by hand; after a rebase, regenerate with `uv lock` / `npm install`.
- `backend/migrations/versions/`: one new revision per PR; after a rebase, re-point its `down_revision` at the current head (`uv run alembic heads` must show one head).
- `GLOSSARY.md`: add new terms only; don't edit existing entries.
- `frontend/src/types.ts`, `frontend/src/clients/apiClient.ts`, `backend/models.py`: additive changes only (new types, functions, fields); changing existing ones is in-scope only if the ticket says so.
- No generated code. No status files; the orchestrator owns ticket assignment and closing via the tracker.

## PRs and merging

- **Branch:** `<number>-<slug>`
- **Commits:** Conventional Commits (`type(scope): description`; scopes in use: `backend`, `frontend`). No attribution lines or `Co-Authored-By` trailers.
- **PR title:** Conventional Commits, same rules. **Body:** `Closes #<n>`; no attribution lines.
- **Method:** squash, deleting the branch (`gh pr merge --squash --delete-branch`).
- **Orchestrator merges:** yes. Rule: CI green (`backend` and `frontend` jobs; not enforced by branch protection, so check them), every dependency merged, branch up to date, reviewer approved.

## Gates

- **Start gates:** none.
- **Merge gates:** none. The orchestrator merges every approved PR with green CI, including ones touching risk paths or `.github/workflows/` (those still get the L review).

## Human-only steps

- Changing GitHub repo settings (enabling Pages, branch protection, environments).
- Adding repo secrets or real `.env` values.
- Supabase dashboard or project work.
- Running migrations against a real (non-test) database.

## Environment

- **Setup per worktree:** `cd backend && uv sync --locked`; `cd frontend && npm ci`. Each worktree has its own `.venv` and `node_modules`.
- **Collisions:** tests use in-memory SQLite (`backend/tests/conftest.py`), so no shared DB. Dev servers default to fixed ports (Vite 5173, backend 8000): workers don't start dev servers; if one must, use a free port (`npm run dev -- --port 0`, uvicorn `--port 0`) and stop it before finishing.
- **`.worktreeinclude`:** `backend/.env`, `frontend/.env*` (copied once they exist; tests don't need them).

## Models

| Role | Model | Effort |
|---|---|---|
| Orchestrator | the session's model | |
| Worker | sonnet | medium |
| Scout, mechanic | haiku | low |
| Reviewer | S haiku · M sonnet · L sonnet, then an orchestrator read | medium |

## Review

- **Instruction files:** `CLAUDE.md`, `docs/agents/*.md`, `GLOSSARY.md`, this file.
- **Risk paths** (any PR touching them is reviewed as L): `backend/auth.py`, `backend/config.py`, `backend/db.py`, `backend/migrations/**`, `backend/llm.py`, `backend/prompt.py`, `backend/reports.py`, `backend/templates.py`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/clients/supabaseClient.ts`, `.github/workflows/**`
- **Tiers:** S is at most 50 changed lines in at most 3 files, none on a risk path; L touches a risk path or changes more than 400 lines; M is everything else. A `size:S|M|L` label on the ticket overrides.
- **Repo-specific checks:** no secrets or real patient data committed; free-text findings sent to LLMs only through `backend/llm.py`; one alembic head; lockfiles regenerated, not hand-edited; new domain terms added to `GLOSSARY.md`.
- **Post reviews:** yes. The reviewer posts each round on the PR as a comment review.
