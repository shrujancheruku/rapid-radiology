# Research: GitHub Pages hosting for the Vite SPA

Ticket: [#12](https://github.com/shrujancheruku/rapid-radiology/issues/12) · Map: [#6](https://github.com/shrujancheruku/rapid-radiology/issues/6) · Researched 2026-11-04

**Question.** What does it take to deploy `frontend/` (Vite 7, React 19, react-router-dom 7, Tailwind 4) to `https://shrujancheruku.github.io/rapid-radiology/` as a demo build (`VITE_DEMO_MODE=true`) via GitHub Actions on push to `main`?

## TL;DR / recommendation

1. **Vite `base`**: build with `--base=/rapid-radiology/`, passed from the workflow and not hard-coded, so `npm run dev` stays at `/`. The base must be **absolute**, not `./`, because of the 404 fallback below.
2. **Router `basename`**: set `<BrowserRouter basename={import.meta.env.BASE_URL}>`. In dev that evaluates to `/` and in the Pages build to `/rapid-radiology/`.
3. **Deep links / refresh**: keep `BrowserRouter` and **copy `dist/index.html` to `dist/404.html`** in the workflow. This is one line, gives clean URLs and needs no router change. Choose `HashRouter` only if the HTTP 404 status on deep links ever becomes a problem. It doesn't matter for a portfolio demo.
4. **Workflow**: use the official Vite/GitHub template with current majors: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`. Run steps in `frontend/` via `defaults.run.working-directory`, upload `frontend/dist`, and set `VITE_DEMO_MODE: "true"` as step env. No secrets are needed.
5. **Repo settings**: Settings → Pages → Source = **GitHub Actions**. Pages is **not enabled yet**: `GET /repos/.../pages` returns 404. The repo is public, so Pages is available on the free plan.

## Current repo state (checked)

- `frontend/src/App.tsx` uses declarative `<BrowserRouter>` with no `basename`. Routes are `/`, `/templates` and `/login`. Navigation goes through `navigate("/")` and `navigate("/templates")` in `LoginPage.tsx` and `HomePage.tsx`, plus `<Navigate to="/login"/>`. All of these are router-relative, so they pick up `basename` automatically.
- `frontend/vite.config.ts` has no `base`, so it defaults to `/`.
- `frontend/index.html` references `/icon.ico` (a public-dir file) and `/src/main.tsx`. **Verified locally**: `npx vite build --base=/rapid-radiology/` (vite 7.1.7) rewrites these to `/rapid-radiology/icon.ico`, `/rapid-radiology/assets/index-*.js` and `/rapid-radiology/assets/index-*.css`. No hard-coded public asset paths exist elsewhere in `src/`.
- `frontend/public/_redirects` (a Render leftover) is copied into `dist/`. It does nothing on Pages and is harmless, but delete it in the cleanup PR.
- Existing `import.meta.env` uses: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_URL`. In demo mode these must not be read at module load, because `supabaseClient.ts` calls `createClient` at import time, which throws (`supabaseUrl is required`) when the URL is undefined. That belongs to the demo-mode ticket, but the Pages build will fail at runtime if a real client module is still imported eagerly.
- No `.github/workflows/` exists yet.

## Findings

### 1. Vite `base`

- For a project site at `<USER>.github.io/<REPO>/`, set `base` to `'/<REPO>/'`. ([Vite: Deploying a Static Site → GitHub Pages](https://vite.dev/guide/static-deploy#github-pages))
- `base` can also be set from the CLI with `--base`. During build, Vite adjusts JS-imported asset URLs, CSS `url()` references and asset references in `.html` files. URLs built at runtime should use `import.meta.env.BASE_URL`, which is statically replaced and must be written exactly like that. ([Vite: Public Base Path](https://vite.dev/guide/build#public-base-path))
- `npm run build -- --base=/rapid-radiology/` appends the flag to the end of the script string (`tsc -b && vite build`), so it reaches `vite build`. `configure-pages` exposes `outputs.base_path` (for example `/my-repo`), which avoids hard-coding the repo name. ([configure-pages action.yml](https://github.com/actions/configure-pages/blob/main/action.yml))
- Option: hard-code `base: process.env.GITHUB_ACTIONS ? '/rapid-radiology/' : '/'` in `vite.config.ts`. The CLI flag is simpler and keeps the config untouched. Recommendation: CLI flag.

### 2. Router `basename`

- `BrowserRouter` accepts `basename` ("Application basename"). ([React Router: BrowserRouter](https://reactrouter.com/api/declarative-routers/BrowserRouter))
- Source check, react-router 7.9.3 as installed: `<Router>` normalizes `basename` with `.replace(/^\/*/, "/")`, and `stripBasename` handles a trailing slash (`basename.endsWith("/") ? length - 1 : length`). So passing `import.meta.env.BASE_URL` (`/rapid-radiology/` or `/`) directly is safe, and no trimming is needed. (`node_modules/react-router/dist/development/chunk-*.mjs`, `function Router` / `function stripBasename`)
- Edge: the bare `/rapid-radiology` without a trailing slash does not match the basename. GitHub Pages serves the directory index at `/rapid-radiology/`, so link to the trailing-slash URL in the README badge.

### 3. Deep links and refresh: `404.html` fallback vs `HashRouter`

GitHub Pages has no rewrite rules: `_redirects` and similar files are ignored. A refresh on `/rapid-radiology/templates` hits a path with no file, so Pages serves the site's custom `404.html` if one exists at the publishing root. ([GitHub Docs: Creating a custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site))

| | `404.html` = copy of `index.html` | `HashRouter` |
|---|---|---|
| URLs | clean: `/rapid-radiology/templates` | `/rapid-radiology/#/templates` |
| App change | `basename` only | swap router, and `basename` becomes unnecessary |
| HTTP status on a deep-link refresh | 404 (the body is the app, so users see the app) | always 200 |
| Requirement | absolute `base` (assets must resolve from any depth) | none |
| Effort | one `cp` line in the workflow | one import change |

The 404 status code is how Pages serves `404.html`. The GitHub doc does not state the status explicitly; it's widely observed. It only affects crawlers and link-preview bots, and for this demo only `/` (which redirects in-app to `/login`) is likely to be shared. **Recommend the `404.html` copy.** It keeps `BrowserRouter`, dev and prod use identical routing, and the screenshot script can hit clean URLs.

Note: a relative `base: './'` would break the 404 fallback. At `/rapid-radiology/templates`, `./assets/...` resolves to `/rapid-radiology/assets/...` by luck at one level, but the same path breaks at deeper levels. Keep it absolute.

### 4. Official Actions workflow (current versions)

- Vite's documented workflow lives in the Vite repo as [`docs/guide/static-deploy-github-pages.yaml`](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml). It runs a single `deploy` job: checkout → setup-node (`lts/*`, npm cache) → `npm ci` → `npm run build` → configure-pages → upload-pages-artifact (`./dist`) → deploy-pages. It sets `permissions: contents: read, pages: write, id-token: write`, `concurrency: group: pages, cancel-in-progress: true` and `environment: github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`.
- Latest releases (GitHub API, 2026-11-04): `actions/checkout` v7.0.1, `actions/setup-node` v7.1.0, `actions/configure-pages` v6.0.0, `actions/upload-pages-artifact` v5.0.0, `actions/deploy-pages` v5.0.1. The Vite template pins the same majors by SHA. The upload/deploy READMEs still show `@v3`/`@v4` examples, which are stale.
- `deploy-pages` needs at least `pages: write` and `id-token: write`, and deploys to the `github-pages` environment. ([deploy-pages README](https://github.com/actions/deploy-pages#usage))
- `upload-pages-artifact`: `path` defaults to `_site/`, so set it to `frontend/dist`. Since v4, dotfiles are excluded unless you set `include-hidden-files: true`, which v5 added; our `dist/` has none. The artifact must be under 1 GB (officially supported) and contain no symlinks. ([upload-pages-artifact README](https://github.com/actions/upload-pages-artifact), [v4.0.0 release](https://github.com/actions/upload-pages-artifact/releases/tag/v4.0.0))
- `.nojekyll` is not needed with the Actions source. GitHub Docs mention it only for workflows that push to a branch. ([GitHub Docs: Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site))

### 5. Building from `frontend/`

- Use `defaults.run.working-directory: frontend`. It applies to `run:` steps only, not `uses:` steps.
- Set `setup-node` `cache-dependency-path: frontend/package-lock.json`, because the lockfile isn't at the repo root.
- Set upload-pages-artifact `path: frontend/dist`, because `uses:` steps resolve paths from the workspace root.
- Node: Vite 7 requires `^20.19.0 || >=22.12.0` (`npm view vite@7 engines`). `lts/*` (Node 24) is fine.
- Optional: `on.push.paths: ['frontend/**', '.github/workflows/pages.yml']` avoids redeploying on backend-only commits.

### 6. Build-time env (`VITE_DEMO_MODE`)

- Env vars already present in the process take priority over `.env*` files. Only `VITE_`-prefixed vars reach client code, and all values are **strings**, so check `import.meta.env.VITE_DEMO_MODE === "true"`. Declare the variable in `src/vite-env.d.ts` (`interface ImportMetaEnv`). ([Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode))
- Set it as `env:` on the build step. `VITE_*` values are inlined into the public bundle, so never route secrets this way. Demo mode needs none.

### 7. Repo settings

- Settings → Pages → Build and deployment → Source: **GitHub Actions**. From the CLI: `gh api -X POST repos/shrujancheruku/rapid-radiology/pages -f build_type=workflow`. ([GitHub Docs: Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site))
- The `github-pages` environment is created automatically on first deploy. GitHub recommends a deployment protection rule that limits it to the default branch (`main`). Deploys from other branches then fail, which is intended.
- Optional: `configure-pages` with `enablement: true` can turn Pages on itself, but only with a PAT or App token, not `GITHUB_TOKEN`. Doing it once in Settings is simpler. ([configure-pages action.yml](https://github.com/actions/configure-pages/blob/main/action.yml))

## Draft workflow: `.github/workflows/pages.yml`

```yaml
name: Deploy demo to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['frontend/**', '.github/workflows/pages.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - id: pages
        uses: actions/configure-pages@v6

      - run: npm ci

      - name: Build (demo mode)
        run: npm run build -- --base=${{ steps.pages.outputs.base_path }}/
        env:
          VITE_DEMO_MODE: "true"

      - name: SPA fallback for deep links
        run: cp dist/index.html dist/404.html

      - uses: actions/upload-pages-artifact@v5
        with:
          path: frontend/dist

      - id: deployment
        uses: actions/deploy-pages@v5
```

`steps.pages.outputs.base_path` is `/rapid-radiology` for this repo, so the flag becomes `--base=/rapid-radiology/`. If you want it explicit, hard-code `--base=/rapid-radiology/`.

## Required app changes (for the demo-mode PR, not made here)

1. `App.tsx`: `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
2. Add `src/vite-env.d.ts` (none exists today): declare `VITE_DEMO_MODE`, plus the existing `VITE_*` vars.
3. Make sure demo builds don't eagerly import `supabaseClient.ts`/`apiClient.ts` with empty env. Choose the fake-or-real implementation behind the flag.
4. Delete `frontend/public/_redirects`.

## Open points

- The HTTP 404 status for the `404.html` fallback is observed behavior, not documented. Verify with `curl -I` after the first deploy if it matters.
- Newer majors exist (Vite 8.3.5, react-router 8.5.1; `react-router-dom` stays at 7.18.5). Nothing here depends on upgrading. That decision belongs to the "Dependency upgrades" item on the map.
