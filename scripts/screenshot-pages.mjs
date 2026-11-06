#!/usr/bin/env node
// Screenshots the built site (out/) at phone and desktop width, so a PR's pages can be looked at
// before anyone opens /dev. CI uploads the folder as the `screenshots` artifact.
// Warns (does not fail) when a page scrolls sideways or asks for a file the build lacks.
//
// Usage: node scripts/screenshot-pages.mjs [outDir] [shotDir]   (defaults: out, screenshots)
// Needs Playwright with Chromium; set BASE_PATH to the basePath the site was built with.
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const outDir = path.resolve(process.argv[2] ?? 'out');
const shotDir = path.resolve(process.argv[3] ?? 'screenshots');
const basePath = process.env.BASE_PATH ?? '';
const PAGES = [
  { name: 'home', path: '/' },
  { name: '500cc-1949', path: '/500cc/1949/', replay: true },
  { name: 'motogp-2024', path: '/motogp/2024/', replay: true },
];
const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain' };

const warn = (message) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `warning: ${message}`);

// A static server that serves out/ under basePath, as GitHub Pages does.
const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = url.startsWith(basePath) ? path.join(outDir, url.slice(basePath.length)) : null;
  if (file && existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file || !file.startsWith(outDir) || !existsSync(file)) {
    warn(`${url} is not in the build (404)`);
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

mkdirSync(shotDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    page.on('pageerror', (error) => warn(`${page.url()}: ${error.message}`));
    for (const target of PAGES) {
      await page.goto(origin + basePath + target.path, { waitUntil: 'networkidle' });
      const states = target.replay ? ['start', 'end'] : [null];
      for (const state of states) {
        // The Replay opens on its first Step; End jumps the slider to the last Session.
        if (state === 'end') await page.locator('input[type="range"]').first().press('End');
        const label = [target.name, state, viewport.name].filter(Boolean).join('-');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) warn(`${label}: the page scrolls sideways by ${overflow}px`);
        await page.screenshot({ path: path.join(shotDir, `${label}.png`), fullPage: true });
        console.log(`shot ${label}.png`);
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
