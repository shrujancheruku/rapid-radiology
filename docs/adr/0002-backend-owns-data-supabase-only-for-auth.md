---
status: accepted
date: 2026-11-04
---

# Backend owns the data; Supabase only for authentication

Supabase is used only for authentication. Normal Templates live in the backend's own Postgres tables (managed with Alembic), behind FastAPI, which verifies the Supabase JWT, rather than the SPA reading and writing them through supabase-js and row-level security (RLS). The LLM keys and the prompt must sit on a server anyway, so keeping the data there too gives one trust boundary.

The backend verifies the JWT with Supabase's legacy shared HS256 secret (`SUPABASE_JWT_SECRET`, see `backend/auth.py`). Supabase's asymmetric signing keys (JWKS) are the upgrade path; that is not done yet.

## Considered Options

- **supabase-js + RLS for Normal Templates, with an edge function for generation.** Less backend code, but it splits the trust boundary in two (RLS policies for data, an edge function for the keys and prompt) and ties the data model to Supabase.
