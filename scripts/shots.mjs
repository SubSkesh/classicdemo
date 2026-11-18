// Screenshot mobile + desktop delle pagine della demo.
// Uso: npm run shots -- [baseUrl] [outDir] [path...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4321', out = 'docs/shots', ...paths] = process.argv.slice(2);
const routes = paths.length ? paths : ['/', '/serate/', '/serate/buongiorno-classic-2026-11-21/'];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const viewports = [
  ['mobile', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { width: 1440, height: 900 }, { deviceScaleFactor: 1 }],
];
for (const route of routes) {
  for (const [name, viewport, opts] of viewports) {
    const ctx = await browser.newContext({ viewport, ...opts, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(Number(process.env.WAIT ?? 2600));
    const slug = route.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home';
    await page.screenshot({ path: `${out}/${slug}-${name}.png`, fullPage: !process.env.VIEWPORT_ONLY });
    if (errors.length) console.log(`[${route} ${name}] errori:`, errors);
    await ctx.close();
  }
}
await browser.close();
console.log('ok', routes.join(' '));
