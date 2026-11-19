// Verifica delle interazioni della scena "La notte al Classic". Uso: node scripts/techno-check.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4321', out = 'docs/shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const ok = (name, cond, extra = '') => console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

/* desktop: scorre fino a scena composta, poi hover (EQ) e clic (drop) */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const scene = page.locator('[data-scene]');
  // porta la scena in cima e scorri dentro il pin fino alla fine della coreografia
  await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-gallery]').getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(400);
  for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, 160); await page.waitForTimeout(90); }
  await page.waitForTimeout(1600);
  const screen = page.locator('[data-panel]').first().locator('[data-screen]');
  const box = await screen.boundingBox();
  ok('scena composta in vista', !!box && box.y > -50 && box.y < 900, box ? `y=${Math.round(box.y)}` : 'nessun box');
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.5, { steps: 10 });
  await page.waitForTimeout(350);
  const lifted = await page.locator('[data-panel]').first().locator('.slice').evaluateAll((els) =>
    els.map((e) => new DOMMatrix(getComputedStyle(e).transform).m42).filter((y) => y < -2).length);
  ok('hover: le barre vicine al cursore si alzano (EQ)', lifted >= 3, `${lifted} barre`);
  const cueOp = await page.locator('[data-panel]').first().locator('[data-cue]').evaluate((e) => getComputedStyle(e).opacity);
  ok('hover: linea di luce visibile', Number(cueOp) > 0.5, `opacity ${cueOp}`);
  await page.screenshot({ path: `${out}/techno-hover-desktop.png` });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${out}/techno-drop-desktop.png` });
  // Performance: il cono di luce segue il cursore e si stringe
  await page.mouse.move(700, 120);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(1500);
  const p2 = page.locator('[data-panel]').nth(1).locator('[data-screen]');
  const b2 = await p2.boundingBox();
  await page.mouse.move(b2.x + b2.width * 0.7, b2.y + b2.height * 0.4, { steps: 8 });
  await page.waitForTimeout(900);
  const spot = await page.locator('[data-spot]').evaluate((e) => ({ r: parseFloat(e.style.getPropertyValue('--r')), x: parseFloat(e.style.getPropertyValue('--mx')), w: e.clientWidth }));
  ok('Performance: occhio di bue che segue il cursore', spot.r > 0 && spot.r < spot.w * 0.6 && spot.x > spot.w * 0.55, `r=${Math.round(spot.r)} x=${Math.round(spot.x)} w=${spot.w}`);
  await page.screenshot({ path: `${out}/techno-spot-desktop.png` });
  // monitor: hover = strobo
  const crt = await page.locator('[data-crt]').boundingBox();
  await page.mouse.move(crt.x + crt.width / 2, crt.y + crt.height / 2, { steps: 5 });
  const seen = new Set();
  for (let i = 0; i < 12; i++) { seen.add(await page.locator('[data-frame-label]').innerText()); await page.waitForTimeout(45); }
  ok('monitor: con il cursore sopra va in strobo (scene diverse in mezzo secondo)', seen.size >= 2, [...seen].join(', '));
  ok('nessun errore JS (desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* smartphone: la sequenza parte da sola, il tocco fa il drop */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.locator('[data-monitor]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  const p1 = page.locator('[data-panel]').first();
  await p1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  const shown = await p1.locator('.bar').evaluateAll((els) => els.filter((e) => Math.abs(new DOMMatrix(getComputedStyle(e).transform).m42) < 1).length);
  ok('mobile: la foto si è composta a barre', shown >= 8, `${shown} barre al loro posto`);
  const b = await p1.locator('[data-screen]').boundingBox();
  await page.touchscreen.tap(b.x + b.width * 0.5, b.y + b.height * 0.5);
  await page.waitForTimeout(170);
  const jumped = await p1.locator('.slice').evaluateAll((els) => els.filter((e) => new DOMMatrix(getComputedStyle(e).transform).m42 < -2).length);
  ok('mobile: il tocco fa il drop', jumped >= 3, `${jumped} barre in salto`);
  await page.screenshot({ path: `${out}/techno-drop-mobile.png` });
  ok('nessun errore JS (mobile)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
await browser.close();
