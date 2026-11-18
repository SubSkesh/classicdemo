import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { gsap, ScrollTrigger, lenis, reducedMotion, finePointer } from '../motion';
import type { PageInit } from '../app';

gsap.registerPlugin(SplitText, DrawSVGPlugin);

const INTRO_KEY = 'cc-intro-seen';

const init: PageInit = (root) => {
  const reduce = reducedMotion.matches;
  const mm = gsap.matchMedia();
  const cleanups: Array<() => void> = [];

  /* ---------- Intro + hero ---------- */
  const hero = root.querySelector<HTMLElement>('[data-hero]')!;
  const slit = hero.querySelector<HTMLElement>('[data-slit]')!;
  const walls = hero.querySelectorAll<SVGPathElement>('.walls path');
  const title = hero.querySelector<HTMLElement>('[data-hero-title]')!;
  const fades = hero.querySelectorAll<HTMLElement>('[data-hero-fade]');
  const intro = document.querySelector<HTMLElement>('[data-intro]');
  const playIntro = document.documentElement.classList.contains('intro') && !!intro && !reduce;

  if (reduce) {
    document.documentElement.classList.remove('intro');
  } else {
    const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
    gsap.set(['[data-hero-copy]', '.hero .stage'], { opacity: 1, animation: 'none' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    if (playIntro && intro) {
      lenis?.stop();
      const mark = intro.querySelectorAll('path');
      gsap.set(mark, { drawSVG: '0%' });
      tl.to(mark[0], { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, 0.1)
        .to(mark[2], { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, 0.1)
        .to(mark[1], { drawSVG: '100%', duration: 0.45, ease: 'power3.in' }, 0.55)
        .to(intro.querySelector('svg'), { scale: 6, opacity: 0, duration: 0.8, ease: 'power3.in' }, 1.05)
        .to(intro, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' }, 1.35)
        .add(() => {
          document.documentElement.classList.remove('intro');
          try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* storage non disponibile */ }
          lenis?.start();
        });
    }
    const t0 = playIntro ? 1.3 : 0.05;
    tl.fromTo(slit, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 1.6, ease: 'expo.inOut' }, t0)
      .from(walls, { opacity: 0, duration: 1.4, ease: 'power2.out' }, t0 + 0.3)
      .from(split.chars, { yPercent: 105, duration: 1.1, stagger: 0.025 }, t0 + 0.35)
      .from(fades, { y: 18, opacity: 0, duration: 1, stagger: 0.08 }, t0 + 0.8);

    // respiro lento della luce (il "Ken Burns" della fessura)
    gsap.to(slit, { scaleX: 1.18, opacity: 0.82, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: t0 + 1.6 });
    gsap.to('[data-glow]', { xPercent: 6, yPercent: -4, scale: 1.08, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // allo scroll le due C si aprono come porte, la fessura si allarga
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(walls[0], { xPercent: -22, ease: 'none', scrollTrigger: st });
    gsap.to(walls[1], { xPercent: 22, ease: 'none', scrollTrigger: st });
    gsap.to('.hero .stage', { yPercent: 12, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero-copy]', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '80% top' } });

    cleanups.push(() => split.revert());
  }

  /* ---------- Marquee che reagisce alla velocità di scroll ---------- */
  const rows = root.querySelectorAll<HTMLElement>('[data-marquee]');
  if (!reduce && rows.length) {
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

  /* ---------- Titoli di sezione: reveal per riga ---------- */
  if (!reduce) {
    root.querySelectorAll<HTMLElement>('[data-reveal-title], .gallery h2, .member h2').forEach((h) => {
      const s = SplitText.create(h, { type: 'lines', mask: 'lines' });
      gsap.from(s.lines, { yPercent: 105, duration: 1.2, stagger: 0.08, scrollTrigger: { trigger: h, start: 'top 85%' } });
      cleanups.push(() => s.revert());
    });
  }

  /* ---------- Prossime serate: pin orizzontale su desktop, swipe nativo su mobile ---------- */
  const rail = root.querySelector<HTMLElement>('[data-rail]');
  const track = root.querySelector<HTMLElement>('[data-rail-track]');
  if (rail && track) {
    mm.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      document.documentElement.classList.add('rail-pinned');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: rail,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      // le card entrano con un leggero ritardo l'una dall'altra lungo il binario
      track.querySelectorAll('[data-card]').forEach((card) => {
        gsap.from(card, {
          yPercent: 14, rotate: 2, opacity: 0.4, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true },
        });
      });
      return () => document.documentElement.classList.remove('rail-pinned');
    });
  }

  /* ---------- Tilt magnetico sulle locandine ---------- */
  if (finePointer.matches && !reduce) {
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

  /* ---------- Manifesto: si illumina parola per parola ---------- */
  const manifesto = root.querySelector<HTMLElement>('[data-manifesto]');
  if (manifesto && !reduce) {
    const s = SplitText.create(manifesto, { type: 'words', wordsClass: 'word' });
    gsap.fromTo(s.words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
    cleanups.push(() => s.revert());
  }

  /* ---------- Galleria: maschere e parallax ---------- */
  if (!reduce) {
    const open = root.querySelector<HTMLElement>('[data-open-mask]');
    if (open) {
      gsap.fromTo(open, { clipPath: 'inset(0% 46% 0% 46%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: open, start: 'top 90%', end: 'center 45%', scrub: true },
      });
    }
    root.querySelectorAll<HTMLElement>('[data-clip] .mask').forEach((m) => {
      gsap.fromTo(m, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
        scrollTrigger: { trigger: m, start: 'top 85%' },
      });
    });
    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const amt = Number(el.dataset.parallax ?? 0.15) * 100;
      gsap.fromTo(el, { yPercent: -amt / 2 }, {
        yPercent: amt / 2, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    root.querySelectorAll<HTMLElement>('[data-float]').forEach((el) => {
      gsap.fromTo(el, { y: 0 }, {
        y: Number(el.dataset.float), ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  ScrollTrigger.refresh();
  return () => {
    cleanups.forEach((c) => c());
    mm.revert();
  };
};

export default init;
