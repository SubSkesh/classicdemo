import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { gsap, ScrollTrigger, lenis, reducedMotion, finePointer } from '../motion';
import { createSmoke } from '../smoke';
import { stretchIn, equalizer } from '../type-fx';
import type { PageInit } from '../app';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

const SEEN_KEY = 'cc-hero-seen';
type Cleanups = Array<() => void>;

/* ====================================================================
   HERO: il neon si accende, la luce disegna il monogramma,
   CLASSIC e CLUB escono dalla fessura. Allo scroll le C si aprono.
   ==================================================================== */
function hero(root: HTMLElement, cleanups: Cleanups) {
  const h = root.querySelector<HTMLElement>('[data-hero]');
  if (!h) return;
  const q = <T extends Element>(s: string) => h.querySelector<T>(s)!;
  const rims = h.querySelectorAll('[data-rim]');
  const fills = h.querySelectorAll('.wall .fill');
  const walls = h.querySelectorAll<SVGGElement>('[data-wall]');
  const bar = q<SVGGElement>('[data-bar]');
  const bloom = q<HTMLElement>('[data-bloom]');
  const beam = q<HTMLElement>('[data-beam]');
  const hazes = h.querySelectorAll<HTMLElement>('[data-haze]');
  const canvas = q<HTMLCanvasElement>('[data-smoke]');
  const wl = q<HTMLElement>('[data-word="l"]');
  const wr = q<HTMLElement>('[data-word="r"]');
  const fades = h.querySelectorAll<HTMLElement>('[data-hero-fade]');
  const stacked = window.matchMedia('(max-width: 760px)').matches;

  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage non disponibile: si vede l'entrata completa */
  }

  gsap.set(h.querySelectorAll('[data-hero-hide]'), { opacity: 1, animation: 'none' });

  /* fumo WebGL solo su desktop con mouse */
  const light = { intensity: 0, open: 0 };
  const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
  // la compilazione dello shader blocca il thread per qualche decina di ms:
  // la rimandiamo a un momento libero (il fumo entra comunque dopo mezzo secondo)
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

  /* stati iniziali */
  gsap.set(rims, { drawSVG: '0%' });
  gsap.set(fills, { opacity: 0 });
  gsap.set(bar, { opacity: 0 });
  gsap.set(bloom, { opacity: 0, scale: 0.35 });
  gsap.set(beam, { scaleY: 0, opacity: 0 });
  gsap.set(hazes, { opacity: 0 });
  gsap.set(fades, { opacity: 0, y: 18 });
  if (stacked) {
    gsap.set([wl, wr], { clipPath: 'inset(0% 50% 0% 50%)', fontStretch: '100%' });
  } else {
    gsap.set(wl, { xPercent: 103, fontStretch: '100%' });
    gsap.set(wr, { xPercent: -103, fontStretch: '100%' });
  }

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (seen) tl.timeScale(1.8);
  // 1. il neon della barra si accende a scatti
  tl.to(bar, { keyframes: { opacity: [0, 1, 0.08, 0.9, 0.25, 1] }, duration: 0.6, ease: 'none' }, 0.12)
    // 2. la luce invade: fascio, bloom, foschia, fumo
    .to(beam, { scaleY: 1, opacity: 1, duration: 1.2, ease: 'expo.inOut' }, 0.45)
    .to(bloom, { opacity: 1, scale: 1, duration: 1.3 }, 0.5)
    .to(hazes, { opacity: desktop ? 0.6 : 1, duration: 1.4, ease: 'power2.out' }, 0.5)
    .to(light, { intensity: 1, duration: 2, ease: 'power2.out' }, 0.5)
    // 3. la luce disegna il bordo delle due C, poi le pareti prendono corpo
    .to(rims, { drawSVG: '100%', duration: 1.05, ease: 'power2.inOut' }, 0.62)
    .to(fills, { opacity: 1, duration: 0.9, ease: 'power1.out' }, 1.05)
    // 4. le parole escono dalla fessura e si comprimono
    .to(
      [wl, wr],
      stacked
        ? { clipPath: 'inset(0% 0% 0% 0%)', fontStretch: '62%', duration: 1.1, stagger: 0.12 }
        : { xPercent: 0, fontStretch: '62%', duration: 1.15 },
      1.02,
    )
    // 5. il resto della pagina
    .to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.55)
    .add(() => {
      gsap.set([wl, wr], { clearProps: 'clipPath' });
      // respiro: il bloom pulsa, il neon ogni tanto vibra
      gsap.to(bloom, { opacity: 0.78, scale: 1.07, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to(h.querySelectorAll('.hot'), { opacity: 0.5, duration: 0.08, ease: 'none', repeat: -1, yoyo: true, repeatDelay: 2.6 });
    });

  /* scroll: le porte si aprono, la luce si allarga, il testo se ne va */
  gsap
    .timeline({ scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } })
    .to(walls[0], { xPercent: -18, ease: 'none' }, 0)
    .to(walls[1], { xPercent: 18, ease: 'none' }, 0)
    .to(h.querySelector('.w-l'), { x: '-9vw', ease: 'none' }, 0)
    .to(h.querySelector('.w-r'), { x: '9vw', ease: 'none' }, 0)
    .to(beam, { scaleX: 3.4, ease: 'none' }, 0)
    .to(light, { open: 1, ease: 'none' }, 0)
    .to(h.querySelector('[data-sign]'), { y: '-6svh', scale: 1.06, ease: 'none' }, 0)
    .to(h.querySelector('[data-hero-copy]'), { yPercent: -40, opacity: 0, ease: 'none' }, 0);
}

/* ====================================================================
   MARQUEE che reagisce alla velocità di scroll
   ==================================================================== */
function marquee(root: HTMLElement, cleanups: Cleanups) {
  const rows = root.querySelectorAll<HTMLElement>('[data-marquee]');
  if (!rows.length) return;
  const state = [...rows].map((row) => ({
    row,
    dir: Number(row.dataset.dir ?? -1),
    speed: Number(row.dataset.speed ?? 1),
    x: 0,
    width: (row.firstElementChild as HTMLElement).offsetWidth,
  }));
  let boost = 0;
  const onResize = () => state.forEach((s) => (s.width = (s.row.firstElementChild as HTMLElement).offsetWidth));
  window.addEventListener('resize', onResize);
  const tick = (_t: number, dt: number) => {
    const v = lenis ? lenis.velocity : 0;
    boost += (Math.min(Math.abs(v) * 0.6, 14) - boost) * 0.08;
    const scrollDir = v < -0.1 ? -1 : 1;
    state.forEach((s) => {
      s.x += s.dir * scrollDir * (0.9 + boost) * s.speed * (dt / 16.67);
      if (s.x <= -s.width) s.x += s.width;
      if (s.x > 0) s.x -= s.width;
      s.row.style.transform = `translate3d(${s.x}px,0,0)`;
    });
  };
  gsap.ticker.add(tick);
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    window.removeEventListener('resize', onResize);
  });
}

/* ====================================================================
   PROSSIME SERATE: pin orizzontale su desktop, swipe nativo su mobile, tilt
   ==================================================================== */
function rail(root: HTMLElement, mm: gsap.MatchMedia, cleanups: Cleanups) {
  const section = root.querySelector<HTMLElement>('[data-rail]');
  const track = root.querySelector<HTMLElement>('[data-rail-track]');
  if (section && track) {
    mm.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      document.documentElement.classList.add('rail-pinned');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      track.querySelectorAll('[data-card]').forEach((card) => {
        gsap.from(card, {
          yPercent: 14, rotate: 2, opacity: 0.4, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true },
        });
      });
      return () => document.documentElement.classList.remove('rail-pinned');
    });
  }

  if (!finePointer.matches) return;
  root.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const poster = card.querySelector<HTMLElement>('[data-tilt]');
    if (!poster) return;
    gsap.set(poster, { transformPerspective: 900 });
    const rx = gsap.quickTo(poster, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(poster, 'rotationY', { duration: 0.6, ease: 'power3' });
    const tx = gsap.quickTo(poster, 'x', { duration: 0.6, ease: 'power3' });
    const ty = gsap.quickTo(poster, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = poster.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 10); rx(-py * 10); tx(px * 14); ty(py * 14);
    };
    const leave = () => { rx(0); ry(0); tx(0); ty(0); };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', leave);
    });
  });
}

/* ====================================================================
   MANIFESTO: si illumina parola per parola
   ==================================================================== */
function manifesto(root: HTMLElement, cleanups: Cleanups) {
  const el = root.querySelector<HTMLElement>('[data-manifesto]');
  if (!el) return;
  // il testo vero è in una copia sr-only: qui niente ARIA. Il grigio di partenza (#6e6c67, 3,6:1)
  // rispetta già il contrasto AA per testo grande, la parola "si accende" fino al bianco osso.
  const s = SplitText.create(el, { type: 'words', wordsClass: 'word', aria: 'none' });
  gsap.fromTo(s.words, { color: '#6e6c67' }, {
    color: '#f2f0eb', ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  cleanups.push(() => s.revert());
}

/* ====================================================================
   GALLERIA: le sfere nascono dalla luce, si raccolgono e si spostano;
   alla fine della loro animazione si aprono le due foto.
   ==================================================================== */
function gallery(root: HTMLElement, mm: gsap.MatchMedia, cleanups: Cleanups) {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  if (!scene) return;
  const title = scene.querySelector<HTMLElement>('[data-eq]')!;
  const orbs = [...scene.querySelectorAll<HTMLElement>('[data-orb]')];
  const bodies = orbs.map((o) => o.querySelector<HTMLElement>('[data-orb-body]')!);
  const caps = scene.querySelectorAll<HTMLElement>('[data-orb-cap]');
  const shots = [...scene.querySelectorAll<HTMLElement>('[data-shot]')];

  // titolo: entra largo e si comprime, poi "suona" con la velocità dello scroll
  let stopEq: (() => void) | undefined;
  const fx = stretchIn(title, {
    trigger: title,
    start: 'top 80%',
    onDone: () => (stopEq = equalizer(fx.split.chars as HTMLElement[])),
  });
  cleanups.push(() => {
    stopEq?.();
    fx.revert();
  });

  // galleggiamento continuo (sul corpo interno, così non litiga con la coreografia)
  bodies.forEach((b, i) =>
    gsap.to(b, { y: i % 2 ? 14 : -14, rotation: i % 2 ? -5 : 5, duration: 3.4 + i * 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
  );

  const shotIn = (tl: gsap.core.Timeline, s: HTMLElement, at: number) => {
    const mask = s.querySelector('[data-shot-mask]');
    const inner = s.querySelector('[data-shot-inner]');
    const t = s.querySelector('[data-shot-title]');
    const line = s.querySelector('[data-shot-line]');
    tl.fromTo(mask, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut' }, at)
      .fromTo(inner, { scale: 1.35 }, { scale: 1, duration: 1.4, ease: 'power2.out' }, at)
      .fromTo(t, { opacity: 0, x: -24, fontStretch: '125%' }, { opacity: 1, x: 0, fontStretch: '62%', duration: 1, ease: 'expo.out' }, at + 0.35)
      .fromTo(line, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, at + 0.5);
  };

  mm.add(
    {
      desk: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      mob: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      if (ctx.conditions?.desk) {
        const W = () => scene.clientWidth;
        const H = () => scene.clientHeight;
        const c = (o: HTMLElement) => ({ x: o.offsetLeft + o.offsetWidth / 2, y: o.offsetTop + o.offsetHeight / 2 });
        // dove si raccolgono a metà scena, grandi, prima di lasciare spazio alle foto
        const mids = [
          { x: 0.42, y: 0.62, s: 1.6 },
          { x: 0.62, y: 0.46, s: 1.9 },
          { x: 0.8, y: 0.64, s: 2.1 },
        ];
        const tl = gsap.timeline({
          scrollTrigger: { trigger: scene, start: 'top top', end: '+=240%', pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        orbs.forEach((o, i) => {
          tl.fromTo(
            o,
            { x: () => W() / 2 - c(o).x, y: () => H() / 2 - c(o).y, scale: 0.12, rotation: -40, autoAlpha: 0 },
            { x: () => mids[i].x * W() - c(o).x, y: () => mids[i].y * H() - c(o).y, scale: mids[i].s, rotation: 0, autoAlpha: 1, duration: 1.1, ease: 'power2.out' },
            i * 0.16,
          );
        });
        tl.fromTo(caps, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1 }, 0.9);
        orbs.forEach((o, i) => tl.to(o, { x: 0, y: 0, scale: 1, duration: 1, ease: 'power2.inOut' }, 1.75 + i * 0.1));
        shots.forEach((s, i) => shotIn(tl, s, 2.85 + i * 0.5));
        tl.to({}, { duration: 0.5 });
      } else {
        // mobile: niente pin, la sequenza parte quando le sfere entrano nello schermo
        const tl = gsap.timeline({ paused: true });
        orbs.forEach((o, i) =>
          tl.fromTo(o, { scale: 0, rotation: -25, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.5)' }, i * 0.18),
        );
        tl.fromTo(caps, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1 }, 0.7);
        let done = false;
        const waiting: Array<() => void> = [];
        tl.eventCallback('onComplete', () => {
          done = true;
          waiting.splice(0).forEach((f) => f());
        });
        ScrollTrigger.create({ trigger: scene.querySelector('[data-orbs]'), start: 'top 75%', once: true, onEnter: () => void tl.play() });
        // le foto si aprono solo quando sono nello schermo E le sfere hanno finito
        shots.forEach((s) => {
          const stl = gsap.timeline({ paused: true });
          shotIn(stl, s, 0);
          ScrollTrigger.create({
            trigger: s, start: 'top 85%', once: true,
            onEnter: () => (done ? void stl.play() : waiting.push(() => void stl.play())),
          });
        });
      }
    },
  );
}

const init: PageInit = (root) => {
  if (reducedMotion.matches) return;
  const mm = gsap.matchMedia();
  const cleanups: Cleanups = [];

  hero(root, cleanups);
  marquee(root, cleanups);
  // titoli di sezione: entrano larghi e si comprimono (asse wdth di Archivo)
  root.querySelectorAll<HTMLElement>('[data-reveal-title], .member h2').forEach((h) => {
    const fx = stretchIn(h, { trigger: h, start: 'top 85%', stagger: 0.03 });
    cleanups.push(() => fx.revert());
  });
  rail(root, mm, cleanups);
  manifesto(root, cleanups);
  gallery(root, mm, cleanups);

  ScrollTrigger.refresh();
  return () => {
    cleanups.forEach((c) => c());
    mm.revert();
  };
};

export default init;
