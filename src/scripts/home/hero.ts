/**
 * HERO — il neon della barra si accende, la luce disegna il monogramma (che resta bianco pieno
 * come l'originale), poi CLASSIC e CLUB si costruiscono lettera per lettera uscendo dalla fessura.
 * Allo scroll le due C si aprono come porte e la luce si allarga.
 */
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { gsap } from '../motion';
import { createSmoke } from '../smoke';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

const SEEN_KEY = 'cc-hero-seen';
type Cleanups = Array<() => void>;

export function hero(root: HTMLElement, cleanups: Cleanups) {
  const h = root.querySelector<HTMLElement>('[data-hero]');
  if (!h) return;
  const q = <T extends Element>(s: string) => h.querySelector<T>(s)!;
  const rims = h.querySelectorAll('[data-rim]');
  const fills = h.querySelectorAll('.wall .fill');
  const walls = h.querySelectorAll<SVGGElement>('[data-wall]');
  const bar = q<SVGRectElement>('[data-bar]');
  const bloom = q<HTMLElement>('[data-bloom]');
  const beam = q<HTMLElement>('[data-beam]');
  const hazes = h.querySelectorAll<HTMLElement>('[data-haze]');
  const canvas = q<HTMLCanvasElement>('[data-smoke]');
  const wl = q<HTMLElement>('[data-word="l"]');
  const wr = q<HTMLElement>('[data-word="r"]');
  const fades = h.querySelectorAll<HTMLElement>('[data-hero-fade]');
  // stessa regola del CSS: parole impilate su telefono in verticale, affiancate altrove
  const mq = (s: string) => window.matchMedia(s).matches;
  const stacked = mq('(max-width: 760px)') && !mq('(orientation: landscape) and (max-height: 520px)');
  const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;

  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage non disponibile: si vede l'entrata completa */
  }

  /* ---------- fumo WebGL (desktop), avviato in un momento libero ---------- */
  const light = { intensity: 0, open: 0 };
  let alive = true;
  const startSmoke = () => {
    if (!alive) return;
    const smoke = createSmoke(canvas);
    if (!smoke) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(h);
    const t0 = performance.now();
    const tick = () => {
      if (!visible || document.hidden) return;
      smoke.set('intensity', light.intensity);
      smoke.set('open', light.open);
      smoke.render((performance.now() - t0) / 1000);
    };
    const move = (e: PointerEvent) => smoke.pointer(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    const resize = () => smoke.resize();
    gsap.ticker.add(tick);
    window.addEventListener('pointermove', move);
    window.addEventListener('resize', resize);
    gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out' });
    cleanups.push(() => {
      gsap.ticker.remove(tick);
      io.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', resize);
      smoke.destroy();
    });
  };
  if (desktop) {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(startSmoke, { timeout: 900 });
    else setTimeout(startSmoke, 350);
  }
  cleanups.push(() => (alive = false));

  /* ---------- titolo diviso in lettere (le misure si prendono a font caricato) ---------- */
  const split = SplitText.create([wl, wr], { type: 'chars', charsClass: 'ch', aria: 'none' });
  const chars = split.chars as HTMLElement[];
  cleanups.push(() => split.revert());

  /* ---------- stati iniziali ---------- */
  gsap.set(h.querySelectorAll('[data-hero-hide]'), { opacity: 1, animation: 'none' });
  gsap.set(rims, { drawSVG: '0%' });
  gsap.set([...fills, bar], { opacity: 0 });
  gsap.set(bloom, { opacity: 0, scale: 0.4 });
  gsap.set(beam, { scaleY: 0, opacity: 0 });
  gsap.set(hazes, { opacity: 0 });
  gsap.set(chars, { opacity: 0 });
  gsap.set(fades, { opacity: 0, y: 18 });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (seen) tl.timeScale(1.8);

  // 1. il neon della barra si accende a scatti (bianco, come il logo)
  tl.to(bar, { keyframes: { opacity: [0, 1, 0.1, 0.9, 0.3, 1] }, duration: 0.62, ease: 'none' }, 0.12)
    // 2. la luce si apre dietro il marchio
    .to(beam, { scaleY: 1, opacity: 1, duration: 1.3, ease: 'expo.inOut' }, 0.45)
    .to(bloom, { opacity: 1, scale: 1, duration: 1.4 }, 0.5)
    .to(hazes, { opacity: desktop ? 0.7 : 1, duration: 1.5, ease: 'power2.out' }, 0.5)
    .to(light, { intensity: 1, duration: 2.2, ease: 'power2.out' }, 0.5)
    // 3. la luce traccia il contorno delle due C, poi il marchio si riempie di bianco
    .to(rims, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, 0.62)
    .to(fills, { opacity: 1, duration: 0.8, ease: 'power2.inOut' }, 1.3)
    // il contorno serviva solo a "disegnare": a marchio pieno sparisce (niente segni sugli angoli)
    .to(rims, { opacity: 0, duration: 0.4, ease: 'power1.out' }, 2.05);

  // 4. CLASSIC e CLUB: ogni lettera esce dalla fessura e raggiunge con calma il suo posto,
  //    dalla più vicina alla luce alla più lontana
  const buildTitle = () => {
    const tt = gsap.timeline();
    if (!stacked) {
      // ogni parola si srotola dalla fessura: tutte le lettere partono nascoste dietro la luce
      // (spostate di una parola intera), la prima a uscire è la più lontana, e ognuna arriva
      // con calma. L'ordine non si inverte mai: le lettere escono distanziate e si compattano.
      const words: Array<[HTMLElement, 1 | -1]> = [[wl, 1], [wr, -1]];
      words.forEach(([w, dir]) => {
        const list = (chars.filter((c) => w.contains(c)) as HTMLElement[]);
        const order = dir === 1 ? list : [...list].reverse(); // CLASSIC da sinistra, CLUB da destra
        const shift = w.getBoundingClientRect().width * 1.04 * dir;
        order.forEach((c, k) => {
          const at = k * 0.11;
          tt.fromTo(c, { x: shift, scaleX: 1.5, transformOrigin: dir === 1 ? '100% 50%' : '0% 50%' }, { x: 0, scaleX: 1, duration: 2.5, ease: 'power3.out' }, at)
            .to(c, { opacity: 1, duration: 0.6, ease: 'power1.out' }, at + 0.15);
        });
      });
    } else {
      // telefono: le due righe si aprono dalla fessura centrale, le lettere sbocciano sul posto
      gsap.set([wl, wr], { clipPath: 'inset(0% 50% 0% 50%)' });
      tt.to([wl, wr], { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.2, ease: 'power3.inOut', stagger: 0.18 }, 0);
      [wl, wr].forEach((w, row) => {
        const list = chars.filter((c) => w.contains(c)) as HTMLElement[];
        tt.fromTo(
          list,
          { scaleX: 0.15, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 1.9, ease: 'power3.out', stagger: { each: 0.08, from: 'center' } },
          0.15 + row * 0.18,
        );
      });
      tt.add(() => gsap.set([wl, wr], { clearProps: 'clipPath' }));
    }
    tl.add(tt, Math.max(1.15, tl.time()));
    // 5. il resto della pagina, quando il nome è quasi al suo posto
    tl.to(fades, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, Math.max(2.5, tl.time()));
    tl.add(() => {
      gsap.to(bloom, { opacity: 0.8, scale: 1.06, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  };
  document.fonts.ready.then(() => (alive ? buildTitle() : undefined));

  /* ---------- scroll: le porte si aprono, la luce si allarga, il testo se ne va ---------- */
  gsap
    .timeline({ scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } })
    .to(walls[0], { xPercent: -18, ease: 'none' }, 0)
    .to(walls[1], { xPercent: 18, ease: 'none' }, 0)
    .to(h.querySelector('.w-l'), { x: '-9vw', ease: 'none' }, 0)
    .to(h.querySelector('.w-r'), { x: '9vw', ease: 'none' }, 0)
    .to(beam, { scaleX: 3, ease: 'none' }, 0)
    .to(light, { open: 1, ease: 'none' }, 0)
    .to(h.querySelector('[data-sign]'), { y: '-6svh', scale: 1.06, ease: 'none' }, 0)
    .to(h.querySelector('[data-hero-copy]'), { yPercent: -40, opacity: 0, ease: 'none' }, 0);
}
