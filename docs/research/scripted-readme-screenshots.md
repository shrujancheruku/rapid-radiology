# Research: Scripted README screenshots and flow GIF

Ticket: [#13](https://github.com/shrujancheruku/rapid-radiology/issues/13) · Map: [#6](https://github.com/shrujancheruku/rapid-radiology/issues/6) · Researched 2026-11-04

**Question.** What is the best way to script README screenshots and a flow GIF against the backend-free demo build (`VITE_DEMO_MODE=true`)? This covers Playwright screenshot options, recording the generate flow and converting it to a README-friendly format, and where the script lives and how it runs.

## TL;DR / recommendation

1. **Tool**: use the **`playwright` library** (not `@playwright/test`) as a frontend devDependency, with Chromium only (`npx playwright install chromium`). This is a one-shot asset generator, not a test suite, so a plain script is enough and there's no runner config to maintain.
2. **Layout**:
   - `frontend/scripts/screenshots.ts`: the script. It starts `vite preview` itself through Vite's JS `preview()` API, drives Chromium, writes the assets and shuts down.
   - `docs/images/`: committed outputs. These are `hero-light.png`, `hero-dark.png`, `templates-light.png`, `templates-dark.png`, `login-light.png`, `login-dark.png` and `flow.gif`.
   - `frontend/.screenshots-tmp/` (gitignored): the raw `.webm` recording.
3. **npm scripts** (in `frontend/package.json`):
   ```json
   "build:demo": "vite build --mode demo",
   "screenshots": "npm run build:demo && node scripts/screenshots.ts"
   ```
   `--mode demo` loads `.env.demo` (which holds `VITE_DEMO_MODE=true`). If the demo-mode ticket picks a different switch, use `VITE_DEMO_MODE=true vite build` instead. Build **without** the Pages `--base=/rapid-radiology/`, or else navigate to that prefix. The `.ts` script runs on plain Node ≥ 22.18 with no `tsx`, because type stripping is on by default there. Relative imports must spell out `.ts`.
4. **Screenshots**: use a 1280×800 viewport, `deviceScaleFactor: 2` (retina-crisp in the README) and one fresh context per theme with `colorScheme: 'light' | 'dark'`. Before each shot, wait for `document.fonts.ready` and for the framer-motion entrance to finish. Then call `page.screenshot({ animations: 'disabled' })`.
5. **Theme**: **`colorScheme` emulation alone is enough**, so no localStorage seeding is needed. The details are below.
6. **Flow capture**: `recordVideo` with `size` equal to the viewport (1280×800, otherwise Playwright downscales to fit 800×800). Then ffmpeg converts it with a two-pass palette to a **GIF at 960px wide and 12 fps**, committed to `docs/images/flow.gif`. Aim for under 5 MB.
7. **Format**: **use a committed GIF** as the scripted, reproducible default. An MP4 looks better, but in a README it only plays inline as a `user-attachments` upload. That upload has to be done by hand in the browser, which breaks "scripted". Have the script also write `flow.mp4` (H.264), in case someone later wants to upload it by hand.
8. **Light/dark pair in the README**: use `<picture>` with `prefers-color-scheme` sources so GitHub shows the image that matches the viewer's theme.

## Current repo state (checked)

- **Theme selection** (`frontend/src/contexts/ThemeProvider.tsx`): the initial state is `localStorage.getItem("vite-ui-theme") || defaultTheme`, and `App.tsx` passes no `defaultTheme`, so it falls back to `"system"`. A mount `useEffect` calls `applyThemeClass`. For `"system"`, that reads `window.matchMedia("(prefers-color-scheme: dark)").matches` and adds `light` or `dark` to `<html>`. Tailwind's dark variant is `@custom-variant dark (&:is(.dark *))` in `src/index.css`.
  - So a **fresh Playwright context**, which has empty storage, plus `colorScheme: 'dark'` renders dark. Playwright's `colorScheme` defaults to `'light'`, so it isn't left to the host OS. No `addInitScript` localStorage seeding is needed.
  - Seeding is only needed if you reuse a `storageState` that already holds `vite-ui-theme`, because a stored value beats the media query. If that ever happens, seed with `context.addInitScript(() => localStorage.setItem('vite-ui-theme', 'dark'))`.
  - **Don't click `ModeToggle` mid-script.** `setTheme` adds `.theme-transition`, a 1000 ms colour transition on `*`, and removes it after 1100 ms. Use separate contexts per theme instead.
  - The class is added in `useEffect` after the first paint, so there's one light frame before dark applies. This doesn't matter for screenshots. If a dark-mode video were recorded, trim its first frames.
- **Animations**: `HomePage.tsx` and `TemplatesPage.tsx` use framer-motion `motion.div` with `initial={{opacity:0, y:…}}`, `animate={{opacity:1, y:0}}` and durations of 0.3 to 1 s, inside `AnimatePresence`. There's **no `<MotionConfig>`** anywhere in `src/`.
- **Copy**: `navigator.clipboard.writeText(report)` followed by `toast.success("Copied OpenAI report to clipboard!")` (sonner). The toast is the visible "copied" moment to hold on in the GIF.
- **Fonts**: `index.html` `@import`s Geist Mono and JetBrains Mono from Google Fonts, so the screenshots need network access and a `document.fonts.ready` wait.
- **Selectors**: there are no `data-testid`s. Use role and placeholder locators: `getByPlaceholder('Enter radiologist findings...')`, `getByRole('button', { name: … })`. Don't touch app code for this. Add test ids only if locators turn out brittle.
- **Routes**: `/`, `/templates` and `/login`. `/` and `/templates` redirect to `/login` when `user` is falsy. The demo-mode design must let the script reach a logged-out `/login` **and** a logged-in `/` (for example, demo auto-login except on `/login`, or a query flag). This is an open question for the demo-mode ticket.
- There's no `docs/images/` yet, and `frontend/` has no Playwright dependency.

## Findings

### 1. Playwright screenshot options

- **`viewport`**: defaults to 1280×720. ([BrowserType/Browser.newContext options](https://playwright.dev/docs/api/class-browser#browser-new-context))
- **`deviceScaleFactor`**: "Specify device scale factor (can be thought of as dpr). Defaults to 1." With `2` and a 1280×800 viewport, you get 2560×1600 PNGs, which are sharp on retina screens. In the README, set `width="..."` on the `<img>` so it doesn't render at double size. ([same](https://playwright.dev/docs/api/class-browser#browser-new-context))
- **`page.screenshot({ scale })`**: `"css"` gives "a single pixel per each css pixel". The default is `"device"`, which respects `deviceScaleFactor`, so leave it at the default. ([Page.screenshot](https://playwright.dev/docs/api/class-page#page-screenshot))
- **`colorScheme`**: "Emulates prefers-colors-scheme media feature, supported values are 'light' and 'dark' … Passing null resets emulation to system defaults. Defaults to 'light'." This can also be changed per page with `page.emulateMedia({ colorScheme })`. ([Playwright `params.md` source](https://github.com/microsoft/playwright/blob/main/docs/src/api/params.md), `context-option-colorscheme`)
- **`reducedMotion`**: "Emulates 'prefers-reduced-motion' … supported values are 'reduce', 'no-preference' … Defaults to 'no-preference'." ([same](https://github.com/microsoft/playwright/blob/main/docs/src/api/params.md), `context-option-reducedMotion`)
  - **This doesn't help here.** framer-motion's `MotionConfig reducedMotion` defaults to `"never"`, which means it doesn't respect reduced motion. Even with `"user"`, only "transform and layout animations will be disabled", while opacity keeps animating. ([Motion: MotionConfig](https://motion.dev/docs/react-motion-config)) The app has no `MotionConfig`, so emulating `reduce` changes nothing.
- **`animations: 'disabled'`**: "stops CSS animations, CSS transitions and Web Animations … finite animations are fast-forwarded to completion … infinite animations are canceled to initial state". The default is `"allow"`. ([`params.md`](https://github.com/microsoft/playwright/blob/main/docs/src/api/params.md), `screenshot-option-animations`)
  - This covers Tailwind and tw-animate CSS transitions and any WAAPI-driven motion values. It **doesn't** cover values that framer-motion drives from JS frame loops, such as an independent `y` transform. Keep it on as a safety net, but **wait out the motion explicitly**: wait for the target to be visible, then use `await expect.poll`, or a `page.waitForFunction` that checks that the element's computed `opacity` is `"1"`, plus a short settle. The simplest deterministic version is `waitForTimeout(1200)` after the element appears, since the longest entrance is `duration: 1`.
- **`caret`**: the default is `"hide"`, so the textarea caret won't show in stills. ([Page.screenshot](https://playwright.dev/docs/api/class-page#page-screenshot))
- **Element shots**: `page.locator(...).screenshot()` works for a tight crop of the two report cards for the hero. A `fullPage: true` option also exists. ([Playwright: Screenshots](https://playwright.dev/docs/screenshots))

### 2. Recording the flow

- **`recordVideo: { dir, size }`**: if `size` isn't given, it's "equal to `viewport` scaled down to fit into 800x800". Set `size: { width: 1280, height: 800 }` to match the viewport. ([`params.md`](https://github.com/microsoft/playwright/blob/main/docs/src/api/params.md), `context-option-recordvideo`) The latest release (1.64.1) also documents `fps` (default 25) and `showActions` annotations. Leave annotations off for a clean README.
- **Saving**: "Make sure to await `browserContext.close()` for videos to be saved." `page.video().saveAs(path)` "waits until the video is fully saved". ([Playwright: Videos](https://playwright.dev/docs/videos), [Video class](https://playwright.dev/docs/api/class-video))
- **Format**: always **WebM**. The recorder names files `*.webm`, rejects other extensions, and encodes VP8 with `-deadline realtime -crf 8 -b:v ~1M` (scaled to the size). ([`videoRecorder.ts` @ v1.64.1](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/src/server/videoRecorder.ts)) The quality is fine as a GIF source but not as a final asset, so always convert it.
- **Trimming the lead-in**: recording starts when the page is created, which includes the blank frames before load. Record `t0 = Date.now()` right after `newPage()` and `t1` once the page has settled, then pass `-ss ((t1 - t0)/1000)` to ffmpeg. The capture also uses `deviceScaleFactor: 1`, since the GIF is downscaled anyway.
- **Clipboard**: `navigator.clipboard.writeText` needs permission in headless Chromium. Call `context.grantPermissions(['clipboard-read', 'clipboard-write'])`. `vite preview` on `localhost` counts as a secure context.

### 3. ffmpeg conversion

The installed ffmpeg is 9.0.2. These options were checked with `ffmpeg -h filter=palettegen`, `-h filter=paletteuse` and `-h muxer=gif`:

- `palettegen`: `max_colors` (2 to 256, default 256) and `stats_mode` (`full` by default, `diff` for "only the part that differs from previous frame", or `single`). `diff` suits a mostly static UI where only the changing parts need the palette budget.
- `paletteuse`: `dither` (default `sierra2_4a`; `bayer` is "ordered 8x8 … (deterministic)"), `bayer_scale` (0 to 5) and `diff_mode=rectangle` ("process smallest different rectangle"). Bayer dithering with `diff_mode=rectangle` keeps static regions identical frame to frame, which compresses much better for UI captures.
- The GIF muxer has `-loop 0` (infinite, the default) and `-final_delay <centiseconds>` to hold the last frame, for example on the "Copied" toast.

**GIF (committed):**
```sh
ffmpeg -y -ss "$TRIM" -i .screenshots-tmp/flow.webm \
  -vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 -final_delay 200 ../docs/images/flow.gif
```

**MP4 (optional, for a manual `user-attachments` upload):**
```sh
ffmpeg -y -ss "$TRIM" -i .screenshots-tmp/flow.webm \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an flow.mp4
```
`yuv420p` is needed for browser and QuickTime playback, and `+faststart` moves the moov atom to the front so playback can start while the file is still downloading. GitHub recommends "H.264 for greatest compatibility". ([GitHub: Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files))

I smoke-tested both commands locally on a synthetic 1280×800 6 s WebM: they ran cleanly, giving a 3.0 MB GIF and a 1.3 MB MP4. `testsrc2` is high-entropy noise, so a real UI capture will be much smaller. A ~15 s flow at 960px and 12 fps should land at 1 to 4 MB. If it doesn't, drop to `fps=10`, `scale=800` or `max_colors=128`.

Run ffmpeg from the script with `child_process.execFileSync('ffmpeg', [...])`. Document `brew install ffmpeg` as a prerequisite rather than adding an `ffmpeg-static` dependency.

### 4. What GitHub renders in a README

- **Images**: "use relative links" for images in the repository. ([GitHub: Basic formatting → Images](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images)) A committed `docs/images/flow.gif` referenced as `![…](docs/images/flow.gif)` animates inline. This needs no upload step and is fully reproducible from the script.
- **Light/dark**: "The `<picture>` HTML element is supported." ([same](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#the-picture-element)) GitHub's own example switches images on `prefers-color-scheme`. ([GitHub docs source, quickstart-for-writing-on-github.md](https://github.com/github/docs/blob/main/content/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/quickstart-for-writing-on-github.md))
  ```html
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/hero-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/hero-light.png">
    <img alt="OpenAI and Gemini reports side by side" src="docs/images/hero-light.png" width="900">
  </picture>
  ```
- **Video**: since 2021, "Video upload is now supported everywhere you can author Markdown in GitHub", including READMEs. ([GitHub changelog 2021-05-13](https://github.blog/changelog/2021-05-13-video-uploads-now-generally-available)) The supported types are .mp4, .mov and .webm, and "Video codec compatibility is browser specific". The upload limit is **10 MB for videos on a free plan** (100 MB on paid) and 10 MB for images and GIFs. ([GitHub: Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files))
  - The catch is that a playable video means drag-and-drop uploading in a browser Markdown editor, which produces a `github.com/user-attachments/assets/…` URL. There's no supported token-based upload API, and GitHub strips `<video poster>`. That's a third-party report, not a GitHub doc, so it's lower trust. ([coder/agent-tty#106](https://github.com/coder/agent-tty/pull/106)) Either way, it can't be scripted end to end, which is why the committed GIF is the default.
- **Repository file size**: Git warns above 50 MiB and GitHub blocks files above 100 MiB. ([GitHub: About large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)) A GIF of a few MB is nowhere near that. Keep the PNGs and GIF small anyway, because every regeneration adds a new blob to history permanently. Regenerate on purpose, not in CI on every push.
- **Animated WebP**: not in GitHub's "supported in all contexts" list, and the local ffmpeg build lacks `libwebp_anim`. Skip it.

### 5. Script sketch

`frontend/scripts/screenshots.ts`: an outline that uses only documented APIs.

```ts
import { preview } from 'vite';
import { chromium, type Browser } from 'playwright';
import { execFileSync } from 'node:child_process';

const OUT = new URL('../../docs/images/', import.meta.url).pathname;
const VIEWPORT = { width: 1280, height: 800 };

const server = await preview({ preview: { port: 4173, strictPort: true } });
const base = server.resolvedUrls!.local[0];          // e.g. http://localhost:4173/
const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);                    // longest framer-motion entrance is 1s
}

async function stills(browser: Browser, scheme: 'light' | 'dark') {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: scheme });
  const page = await ctx.newPage();
  // login (logged-out), templates, and hero (generated reports) — exact demo-mode entry TBD
  await page.goto(base + 'login'); await settle(page);
  await page.screenshot({ path: `${OUT}login-${scheme}.png`, animations: 'disabled' });
  // ... templates-${scheme}.png, then run the generate flow and shoot hero-${scheme}.png
  await ctx.close();
}

await stills(browser, 'light');
await stills(browser, 'dark');

// flow recording (light only)
const vctx = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light',
  recordVideo: { dir: '.screenshots-tmp', size: VIEWPORT } });
await vctx.grantPermissions(['clipboard-read', 'clipboard-write']);
const vpage = await vctx.newPage(); const t0 = Date.now();
await vpage.goto(base); await settle(vpage); const trim = (Date.now() - t0) / 1000;
// click report type → type findings (pressSequentially with delay for a "typing" look)
// → click Generate → wait for both reports (2–4s fake delay) → click Copy → wait for toast
await vpage.waitForTimeout(1500);
await vctx.close();
await vpage.video()!.saveAs('.screenshots-tmp/flow.webm');
execFileSync('ffmpeg', [/* GIF command from §3 with -ss trim */], { stdio: 'inherit' });

await browser.close();
server.httpServer.close();
```

- Vite's `preview()` returns a `PreviewServer` with `resolvedUrls` and `httpServer`, the "native Node http server instance". ([Vite JS API](https://vite.dev/guide/api-javascript))
- Node type stripping is enabled by default from v22.18.0 / v23.6.0 and stable from v24.12.0. "file extensions are mandatory in import statements". ([Node.js: TypeScript](https://nodejs.org/api/typescript.html))
- The fake demo delay should be deterministic. If it's random in the 2 to 4 s range, the GIF length changes on every run. Let the script override it (for example with a fixed seed, or a `?demoDelay=2500` param) so diffs between regenerations stay small.

## Open questions

1. How does demo mode expose both a logged-out `/login` and a logged-in `/`? This is for the demo-mode ticket.
2. Should the demo delay be overridable or fixed, so regenerated GIFs are stable?
3. Hero framing: a full-viewport shot or a tight `locator.screenshot()` of the two report cards?
