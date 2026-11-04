// Generates the README images and flow GIF from the demo build, so no backend,
// Supabase project or API keys are needed. Run with `npm run screenshots`.
// Needs Node 22.18+ (runs this .ts file natively), Playwright's Chromium
// (`npx playwright install chromium`) and ffmpeg on the PATH.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { preview } from "vite";

const OUT = fileURLToPath(new URL("../../docs/images/", import.meta.url));
const TMP = fileURLToPath(new URL("../.screenshots-tmp/", import.meta.url));
const VIEWPORT = { width: 1280, height: 800 };
const HERO_TYPE = "CT Abdomen and Pelvis";

mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// Serves ./dist, which `npm run screenshots` has just built in demo mode.
// Port 0 picks a free port so this never collides with a dev server.
const server = await preview({ preview: { port: 0, open: false } });
const base = server.resolvedUrls!.local[0];
const browser = await chromium.launch();

/** Fonts loaded and the longest framer-motion entrance (1 s) finished. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300);
}

async function openLogin(page: Page) {
  await page.goto(`${base}login`);
  await settle(page);
}

async function submitLogin(page: Page) {
  // Demo login is pre-filled, and any credentials are accepted.
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("button", { name: HERO_TYPE }).waitFor();
  await settle(page);
}

async function waitForBothReports(page: Page) {
  // The demo fakes a 2-4 s delay per model; wait for both Reports to land.
  await page.waitForFunction(
    () =>
      document.querySelectorAll("textarea[readonly]").length === 2 &&
      [...document.querySelectorAll("textarea[readonly]")].every(
        (t) => (t as HTMLTextAreaElement).value.length > 0,
      ),
    undefined,
    { timeout: 15_000 },
  );
}

async function stills(theme: "light" | "dark") {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    // ThemeProvider falls back to "system" with empty storage, so emulating
    // the media feature is all it takes.
    colorScheme: theme,
  });
  const page = await context.newPage();
  const shoot = (name: string) =>
    page.screenshot({
      path: `${OUT}${name}-${theme}.png`,
      animations: "disabled",
    });

  await openLogin(page);
  await shoot("login");
  await submitLogin(page);

  await page.getByRole("button", { name: HERO_TYPE }).click();
  await settle(page); // Findings are pre-filled in demo mode
  await page.getByRole("button", { name: "Generate Reports" }).click();
  await waitForBothReports(page);
  await settle(page);
  await shoot("hero");

  await page.getByRole("link", { name: "Normal Templates" }).click();
  await page.waitForURL(/templates$/);
  await settle(page);
  await shoot("templates");

  await context.close();
}

/** Records the whole flow and converts it to a compact GIF with ffmpeg. */
async function flow() {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "light",
    recordVideo: { dir: TMP, size: VIEWPORT },
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();
  const start = Date.now();

  await openLogin(page);
  await submitLogin(page);
  // Everything before this point (blank page, load, login) is trimmed off.
  const trim = (Date.now() - start) / 1000;

  await page.waitForTimeout(800);
  await page.getByRole("button", { name: HERO_TYPE }).click();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Generate Reports" }).click();
  await waitForBothReports(page);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Copy" }).first().click();
  await page.waitForTimeout(2000);

  const video = page.video()!;
  await context.close();
  const webm = `${TMP}flow.webm`;
  await video.saveAs(webm);

  execFileSync(
    "ffmpeg",
    [
      ...["-y", "-loglevel", "error", "-ss", trim.toFixed(2), "-i", webm],
      ...[
        "-vf",
        "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];" +
          "[s0]palettegen=stats_mode=diff[p];" +
          "[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
      ],
      ...["-loop", "0", "-final_delay", "200", `${OUT}flow.gif`],
    ],
    { stdio: "inherit" },
  );
  const mb = statSync(`${OUT}flow.gif`).size / 1024 / 1024;
  console.log(`flow.gif: ${mb.toFixed(1)} MB`);
}

try {
  await stills("light");
  await stills("dark");
  await flow();
} finally {
  await browser.close();
  rmSync(TMP, { recursive: true, force: true });
  await new Promise((resolve) => server.httpServer.close(resolve));
}
