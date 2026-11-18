// Test dei percorsi principali della demo. Uso: node scripts/flows.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4321', out = 'docs/shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

async function session(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { ctx, page, errors };
}

/* 1. Desktop: home → card del binario → dettaglio (con View Transition) */
{
  const { ctx, page, errors } = await session({ width: 1440, height: 900 });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2400); // intro
  await page.locator('[data-rail] a.hit').first().click();
  await page.waitForURL('**/serate/buongiorno-classic-2026-11-21/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/flow-transition-mid.png` });
  await page.waitForTimeout(1200);
  check('home → dettaglio evento', (await page.locator('h1').innerText()).toUpperCase().includes('BUONGIORNO'));
  await page.screenshot({ path: `${out}/flow-detail-desktop.png` });

  // CTA del dettaglio apre la lista con la serata già scelta
  await page.getByRole('button', { name: 'Iscriviti in lista' }).click();
  await page.waitForTimeout(700);
  const sel = await page.locator('#dlg-lista select[name="serata"]').inputValue();
  check('lista preselezionata sulla serata', sel === 'buongiorno-classic-2026-11-21', sel);
  await page.locator('#dlg-lista button[type="submit"]').click();
  const invalid = await page.locator('#dlg-lista [aria-invalid="true"]').count();
  check('invio vuoto segnala i campi', invalid >= 3, `${invalid} campi`);
  await page.fill('#dlg-lista input[name="nome"]', 'Prova');
  await page.fill('#dlg-lista input[name="cognome"]', 'Demo');
  await page.fill('#dlg-lista input[name="email"]', 'prova@example.test');
  await page.check('#dlg-lista input[name="privacy"]');
  await page.locator('#dlg-lista button[type="submit"]').click();
  await page.waitForTimeout(900);
  check('stato di successo simulato', await page.locator('#dlg-lista [data-mock-success]').isVisible());
  await page.screenshot({ path: `${out}/flow-list-success.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Esc chiude il modale', !(await page.locator('#dlg-lista').evaluate((d) => d.open)));
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('focus torna al pulsante', focused === 'Iscriviti in lista', focused);

  /* 2. Serate: hover mostra la locandina che segue il cursore, clic → dettaglio */
  await page.goto(base + '/serate/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const row = page.locator('[data-row]').nth(1);
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 8 });
  await page.waitForTimeout(800);
  const op = await page.locator('#follow-midnight-tension-2026-11-28').evaluate((el) => getComputedStyle(el).opacity);
  check('hover mostra la locandina', Number(op) > 0.9, `opacity ${op}`);
  await page.screenshot({ path: `${out}/flow-serate-hover.png` });
  await row.locator('a').click();
  await page.waitForURL('**/midnight-tension-2026-11-28/');
  await page.waitForTimeout(1500);
  check('serate → dettaglio', (await page.locator('h1').innerText()).toUpperCase().includes('MIDNIGHT'));

  /* 3. Header: "Lista online" apre il modale da qualunque pagina */
  await page.locator('header .pill').click();
  await page.waitForTimeout(600);
  check('header apre la lista', await page.locator('#dlg-lista').evaluate((d) => d.open));
  check('URL invariato aprendo la lista', page.url().includes('midnight-tension'));
  await page.keyboard.press('Escape');

  check('nessun errore in console (desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 4. Mobile: tastiera e navigazione senza cursore personalizzato */
{
  const { ctx, page, errors } = await session({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(base + '/serate/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('primo Tab = skip link', first === 'Vai al contenuto', first);
  await page.screenshot({ path: `${out}/flow-serate-mobile.png`, fullPage: true });
  await page.locator('[data-row] a').first().tap();
  await page.waitForURL('**/buongiorno-classic-2026-11-21/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/flow-detail-mobile.png`, fullPage: true });
  check('mobile serate → dettaglio', true);
  check('nessun errore in console (mobile)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 5. Reduced motion: nessun intro, contenuto subito visibile */
{
  const { ctx, page } = await session({ width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const introVisible = await page.locator('[data-intro]').isVisible();
  const copyOpacity = await page.locator('[data-hero-copy]').evaluate((el) => getComputedStyle(el).opacity);
  check('reduced motion: niente intro, hero visibile', !introVisible && copyOpacity === '1', `intro ${introVisible}, opacity ${copyOpacity}`);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} superati`);
process.exit(failed ? 1 : 0);
