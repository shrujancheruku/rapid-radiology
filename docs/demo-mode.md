# Demo mode

A backend-free build of the frontend, deployed to GitHub Pages at <https://shrujancheruku.github.io/rapid-radiology/>. Everything runs in the browser, so visitors need no account and nothing is sent anywhere.

## How the seam works

The app talks to the outside world through two ports in [`frontend/src/backend/types.ts`](../frontend/src/backend/types.ts):

- `AuthService`: sign in, sign out, current user, access token.
- `Api`: get and save Normal Templates, generate a Report.

[`frontend/src/backend/index.ts`](../frontend/src/backend/index.ts) picks the implementations once, at build time:

```ts
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const auth = DEMO_MODE ? createDemoAuth() : createSupabaseAuth();
export const api = DEMO_MODE ? createDemoApi() : createHttpApi(auth);
```

Vite inlines `VITE_DEMO_MODE`, so in a demo build the real factories are dead code and removed. Supabase's `createClient` never runs, which is why a demo build needs no environment variables or secrets. `VITE_DEMO_MODE=true` comes from [`frontend/.env.demo`](../frontend/.env.demo), loaded by `--mode demo`.

## What's faked

- **Login** accepts any email and password (pre-filled on the login page). The user survives a reload via `localStorage`.
- **Normal Templates** are the seed content, and your edits are saved to `localStorage`. Logging out wipes them (every demo key starts with `rr-demo:`).
- **Delays**: about 300 ms for templates and a random 2 to 4 s per model for generation, to feel like the real thing.
- **Reports are canned**: per Report Type and model, regardless of what you type. The Findings box is pre-filled with matching sample Findings when you pick a Report Type.
- A banner says "Demo mode: canned output, not for clinical use".

All seed content is fictional. There are no patients, names, accession numbers or real dates.

## Run and build

```sh
cd frontend
npm run dev:demo      # dev server (vite --mode demo)
npm run build:demo    # production build into dist/
```

## Editing the seed

[`frontend/src/demo/seed.ts`](../frontend/src/demo/seed.ts) holds, for each seeded Report Type (CT Abdomen and Pelvis, CT Chest, MRI Knee): the Normal Template, the sample Findings and one canned Report per model. To add a Report Type, add an entry keyed by the `ReportType` enum. Keep the canned Reports faithful to the real behaviour: every normal line kept verbatim unless a finding replaces it, OpenAI expanding shorthand and Gemini staying near-verbatim.

## The Pages deploy

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) builds in demo mode on pushes to `main` that touch `frontend/` and deploys to GitHub Pages.

- **Base path**: the site lives under `/rapid-radiology/`, so the build passes `--base=<base_path>/` from `actions/configure-pages`. It must be absolute for the 404 fallback to work on deep links.
- **`404.html`**: Pages has no rewrites, so the workflow copies `dist/index.html` to `dist/404.html`, and deep links like `/templates` load the app.
- **One-time setting**: Pages must be enabled for the repository with the source set to GitHub Actions.
