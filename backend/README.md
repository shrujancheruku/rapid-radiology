# Rapid Radiology backend

FastAPI + SQLModel + Alembic service. See the [root README](../README.md) for what the project is and [docs/development.md](../docs/development.md) for setup.

| Command                                        | What it does                                    |
| ---------------------------------------------- | ----------------------------------------------- |
| `uv sync --locked`                             | Install dependencies                            |
| `uv run fastapi dev main.py`                   | Run the API on port 8000 (needs `backend/.env`) |
| `uv run alembic upgrade head`                  | Apply database migrations                       |
| `uv run pytest`                                | Tests (in-memory SQLite, no `.env` needed)      |
| `uv run ruff check .` / `uv run ruff format .` | Lint / format                                   |
