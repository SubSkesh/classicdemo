import { SplitText } from 'gsap/SplitText';
import { gsap, ScrollTrigger, reducedMotion, finePointer } from '../motion';
import { stretchIn } from '../type-fx';
import { hero } from '../home/hero';
import { techno } from '../home/techno';
import type { PageInit } from '../app';

gsap.registerPlugin(SplitText);

type Cleanups = Array<() => void>;

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
  let lastY = window.scrollY;
  const onResize = () => state.forEach((s) => (s.width = (s.row.firstElementChild as HTMLElement).offsetWidth));
  window.addEventListener('resize', onResize);
  const tick = (_t: number, dt: number) => {
    // velocità dallo scroll reale: vale con la rotella (Lenis) e con il dito sul telefono
    const y = window.scrollY;
    const v = ((y - lastY) / Math.max(dt, 1)) * 16.67 * 0.5;
    lastY = y;
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
  techno(root, mm, cleanups);

  ScrollTrigger.refresh();
  return () => {
    cleanups.forEach((c) => c());
    mm.revert();
  };
};

export default init;
