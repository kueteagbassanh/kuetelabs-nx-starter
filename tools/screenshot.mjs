#!/usr/bin/env node
/**
 * Screenshot routes of the running dev server in light and dark mode.
 *
 * Verifying a UI change by building it only proves it compiles. This renders it.
 *
 *   npx nx serve web                       # in one terminal
 *   node tools/screenshot.mjs              # in another
 *   node tools/screenshot.mjs / /login --theme dark --out .screenshots
 *
 * Options:
 *   --url <origin>     dev server origin           (default http://localhost:4200)
 *   --out <dir>        output directory            (default .screenshots)
 *   --theme <t>        light | dark | both         (default both)
 *   --viewport <WxH>   viewport size               (default 1440x900)
 *   --wait <ms>        settle time after load      (default 1500)
 *   --no-full-page     capture the viewport only
 *
 * Exits non-zero on an uncaught page error, so it is usable as a smoke check.
 * Dark mode is applied by adding `.dark` to <html>, matching the app's theme setup.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { setDefaultResultOrder } from 'node:dns';

// The dev server binds 127.0.0.1; without this, fetch() resolves localhost to ::1
// and the readiness probe reports "no dev server" against a server that is running.
setDefaultResultOrder('ipv4first');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const origin = flag('url', 'http://localhost:4200').replace(/\/$/, '');
const outDir = flag('out', '.screenshots');
const theme = flag('theme', 'both');
const wait = Number(flag('wait', 1500));
const [width, height] = flag('viewport', '1440x900').split('x').map(Number);
const fullPage = !argv.includes('--no-full-page');
const routes = argv.filter((arg, i) => arg.startsWith('/') && argv[i - 1] !== '--out');
const paths = routes.length > 0 ? routes : ['/'];
const themes = theme === 'both' ? ['light', 'dark'] : [theme];

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await fetch(origin, { signal: AbortSignal.timeout(2000) });
      return;
    } catch {
      if (Date.now() > deadline) {
        throw new Error(`No dev server at ${origin} — start one with \`npx nx serve web\`.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

await waitForServer();
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const failures = [];

for (const path of paths) {
  const name = path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => failures.push(`${path}: ${error.message}`));
  page.on('console', (msg) => msg.type() === 'error' && console.warn(`  console: ${msg.text()}`));

  await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });

  for (const mode of themes) {
    await page.evaluate((m) => document.documentElement.classList.toggle('dark', m === 'dark'), mode);
    await page.waitForTimeout(wait);
    const file = join(outDir, `${name}-${mode}.png`);
    await page.screenshot({ path: file, fullPage });
    console.log(`✔ ${file}`);
  }

  await page.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(`\n✘ ${failures.length} uncaught page error(s):`);
  failures.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}
