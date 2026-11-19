// Screenshot mobile + desktop delle pagine della demo.
// Uso: npm run shots -- [baseUrl] [outDir] [path...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4321', out = 'docs/shots', ...paths] = process.argv.slice(2);
const routes = paths.length ? paths : ['/', '/serate/', '/serate/buongiorno-classic-2026-11-21/'];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
// SIZES=360x740,430x932 → solo quei telefoni (più "landscape" con LAND=1)
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const viewports = process.env.SIZES
  ? process.env.SIZES.split(',').map((s) => { const [w, h] = s.split('x').map(Number); return [`m${w}x${h}`, { width: w, height: h }, phone]; })
  : [
      ['mobile', { width: 390, height: 844 }, phone],
      ['desktop', { width: 1440, height: 900 }, { deviceScaleFactor: 1 }],
    ];
for (const route of routes) {
  for (const [name, viewport, opts] of viewports) {
    const ctx = await browser.newContext({ viewport, ...opts, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const slug = route.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home';
    if (process.env.FRAMES) {
      // fotogrammi a tempi fissi dal caricamento (per controllare le entrate)
      await page.goto(base + route, { waitUntil: 'commit' });
      const t0 = Date.now();
      for (const ms of process.env.FRAMES.split(',').map(Number)) {
        await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
        await page.screenshot({ path: `${out}/${slug}-${name}-t${String(ms).padStart(4, '0')}.png` });
      }
      await ctx.close();
      continue;
    }
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(Number(process.env.WAIT ?? 2600));
    if (process.env.TOUR) {
      // scorre con la rotella come un utente (Lenis + ScrollTrigger reagiscono davvero) e scatta a ogni passo
      const steps = Number(process.env.TOUR);
      for (let i = 0; i < steps; i++) {
        await page.screenshot({ path: `${out}/${slug}-${name}-tour${String(i).padStart(2, '0')}.png` });
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.wheel(0, viewport.height * 0.85);
        await page.waitForTimeout(1100);
      }
    } else {
      await page.screenshot({ path: `${out}/${slug}-${name}.png`, fullPage: !process.env.VIEWPORT_ONLY });
    }
    if (errors.length) console.log(`[${route} ${name}] errori:`, errors);
    await ctx.close();
  }
}
await browser.close();
console.log('ok', routes.join(' '));
