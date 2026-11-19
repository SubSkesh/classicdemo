/**
 * LA NOTTE AL CLASSIC — scena "techno":
 * - un monitor in loop alterna tre fotogrammi a tagli secchi, a tempo (128 BPM);
 * - le due foto grandi si compongono a barre, come un equalizzatore;
 * - un analizzatore di spettro batte la cassa e prende energia da scroll, mouse e tocchi.
 *
 * Desktop: scena fissata e coreografata dallo scroll. Il cursore fa cose diverse a seconda dello stato:
 *   foto composta → le barre rispondono come un EQ e una linea di luce segue il mouse, clic = "drop";
 *   foto in composizione → le barre "glitchano"; monitor → strobo veloce, clic = taglio.
 * Smartphone: stessa sequenza senza pin, tocco = drop / taglio / energia.
 */
import { gsap, ScrollTrigger, finePointer } from '../motion';
import { stretchIn, equalizer } from '../type-fx';

const BPM = 128;
const BEAT = 60 / BPM;
type Cleanups = Array<() => void>;
type State = 'off' | 'build' | 'on';

type Panel = {
  el: HTMLElement;
  screen: HTMLElement;
  cue: HTMLElement;
  flash: HTMLElement;
  title: HTMLElement;
  line: HTMLElement;
  barEls: HTMLElement[];
  slices: HTMLElement[];
  eq: number[]; // bersaglio EQ (yPercent) per barra
  cur: number[]; // valore attuale
  drop: Array<{ v: number }>; // spinta del "drop", animata da GSAP
  jit: number[]; // glitch orizzontale (px)
  at: number; // momento d'ingresso nella coreografia
  state: State;
  dirty: boolean;
  busyUntil: number; // finché un drop è in corso il ticker non smette di aggiornare
};

export function techno(root: HTMLElement, mm: gsap.MatchMedia, cleanups: Cleanups) {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  if (!scene) return;
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  const N = desktop ? 18 : 10;

  /* ---------- titolo: entra largo e si comprime, poi "suona" con lo scroll ---------- */
  const title = scene.querySelector<HTMLElement>('[data-eq]')!;
  let stopEq: (() => void) | undefined;
  const fx = stretchIn(title, { trigger: title, start: 'top 80%', onDone: () => (stopEq = equalizer(fx.split.chars as HTMLElement[])) });
  cleanups.push(() => {
    stopEq?.();
    fx.revert();
  });

  /* ---------- monitor ---------- */
  const monitor = scene.querySelector<HTMLElement>('[data-monitor]')!;
  const crt = monitor.querySelector<HTMLElement>('[data-crt]')!;
  const frames = [...crt.querySelectorAll<HTMLElement>('[data-frame]')];
  const label = monitor.querySelector<HTMLElement>('[data-frame-label]')!;
  const crtFlash = crt.querySelector<HTMLElement>('[data-flash]')!;
  const cap = monitor.querySelector<HTMLElement>('figcaption')!;
  let idx = 0;
  let loopOn = false;
  let strobe = false;
  let acc = 0;
  const cut = (hard = false) => {
    frames[idx].classList.remove('on');
    idx = (idx + 1) % frames.length;
    frames[idx].classList.add('on');
    label.textContent = frames[idx].dataset.label ?? '';
    gsap.fromTo(crtFlash, { opacity: hard ? 0.8 : strobe ? 0.5 : 0.25 }, { opacity: 0, duration: strobe ? 0.08 : 0.2, ease: 'power1.out', overwrite: true });
    energy = Math.max(energy, hard ? 1 : 0.35);
  };

  /* ---------- spettro ---------- */
  const spectrum = scene.querySelector<HTMLElement>('[data-spectrum]')!;
  const sBars = [...spectrum.children] as HTMLElement[];
  let energy = 0;
  let pointerEnergy = 0;

  /* ---------- pannelli a barre ---------- */
  const panels: Panel[] = [...scene.querySelectorAll<HTMLElement>('[data-panel]')].map((el) => {
    const screen = el.querySelector<HTMLElement>('[data-screen]')!;
    const barsBox = screen.querySelector<HTMLElement>('[data-bars]')!;
    const img = screen.querySelector<HTMLImageElement>('.src img, img.src, img')!;
    const p: Panel = {
      el, screen,
      cue: screen.querySelector<HTMLElement>('[data-cue]')!,
      flash: screen.querySelector<HTMLElement>('[data-flash]')!,
      title: el.querySelector<HTMLElement>('[data-panel-title]')!,
      line: el.querySelector<HTMLElement>('[data-panel-line]')!,
      barEls: [], slices: [], eq: Array(N).fill(0), cur: Array(N).fill(0),
      drop: Array.from({ length: N }, () => ({ v: 0 })), jit: Array(N).fill(0),
      at: 0, state: 'off', dirty: false, busyUntil: 0,
    };
    const sliceImgs: HTMLImageElement[] = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < N; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      const slice = document.createElement('div');
      slice.className = 'slice';
      const im = document.createElement('img');
      im.alt = '';
      im.decoding = 'async';
      im.style.width = `${N * 100}%`;
      im.style.left = `${-i * 100}%`;
      slice.appendChild(im);
      bar.appendChild(slice);
      frag.appendChild(bar);
      p.barEls.push(bar);
      p.slices.push(slice);
      sliceImgs.push(im);
    }
    barsBox.appendChild(frag);
    // le fette usano la stessa immagine già scelta dal browser (AVIF/WebP, taglia giusta)
    const fill = () => sliceImgs.forEach((im) => (im.src = img.currentSrc || img.src));
    if (img.complete && img.naturalWidth) fill();
    else img.addEventListener('load', fill, { once: true });
    screen.classList.add('bars-on');
    cleanups.push(() => {
      barsBox.replaceChildren();
      screen.classList.remove('bars-on');
    });
    return p;
  });

  /* ---------- un solo ticker per loop, spettro e barre (solo se la scena è visibile) ---------- */
  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' });
  io.observe(scene);
  let lastY = window.scrollY;
  const tick = (time: number, dt: number) => {
    if (!visible) return;
    const sec = dt / 1000;
    // tempo del loop: due battute normalmente, un sedicesimo in strobo
    if (loopOn) {
      acc += sec;
      const period = strobe ? BEAT / 4 : BEAT * 2;
      if (acc >= period) {
        acc = 0;
        cut();
      }
    }
    // energia: scroll + movimento del mouse + colpi, con decadimento
    const y = window.scrollY;
    const sv = (Math.abs(y - lastY) / Math.max(dt, 1)) * 16.67;
    lastY = y;
    pointerEnergy *= 0.9;
    energy = Math.max(energy * 0.95, Math.min(sv / 28, 1), pointerEnergy);
    const phase = (time % BEAT) / BEAT;
    const kick = Math.exp(-phase * 7);
    const n = sBars.length;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const base = 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(time * (2.2 + f * 7) + i * 1.3));
      const lvl = Math.min(1, base + kick * (1 - f) * 0.42 + energy * (0.3 + 0.45 * Math.abs(Math.sin(time * 9 + i * 0.7))));
      sBars[i].style.transform = `scaleY(${lvl.toFixed(3)})`;
    }
    // barre dei pannelli: EQ + drop + glitch
    for (const p of panels) {
      if (!p.dirty) continue;
      let moving = false;
      for (let i = 0; i < N; i++) {
        p.cur[i] += (p.eq[i] - p.cur[i]) * 0.2;
        p.jit[i] *= 0.78;
        const yv = p.cur[i] + p.drop[i].v;
        if (Math.abs(yv) > 0.05 || Math.abs(p.jit[i]) > 0.1) moving = true;
        p.slices[i].style.transform = `translate3d(${p.jit[i].toFixed(1)}px, ${yv.toFixed(2)}%, 0)`;
      }
      if (!moving && p.eq.every((v) => v === 0) && performance.now() > p.busyUntil) p.dirty = false;
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    io.disconnect();
  });

  /* ---------- azioni ---------- */
  const drop = (p: Panel, px: number) => {
    p.dirty = true;
    p.busyUntil = performance.now() + 1700;
    p.drop.forEach((d, i) => {
      const dist = Math.abs((i + 0.5) / N - px);
      gsap.timeline({ delay: dist * 0.35 })
        .to(d, { v: -(8 + (1 - dist) * 22), duration: 0.16, ease: 'power2.out', overwrite: true })
        .to(d, { v: 0, duration: 0.95, ease: 'bounce.out' });
    });
    gsap.fromTo(p.flash, { opacity: 0.45 }, { opacity: 0, duration: 0.5, ease: 'power1.out', overwrite: true });
    energy = 1;
  };
  const glitch = (p: Panel) => {
    p.dirty = true;
    const i = Math.floor(Math.random() * N);
    p.jit[i] = (Math.random() - 0.5) * 24;
    pointerEnergy = Math.max(pointerEnergy, 0.5);
  };

  const listen = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener));
  };

  if (finePointer.matches) {
    /* desktop: il cursore fa cose diverse a seconda dello stato della foto */
    let lastX = 0;
    listen(scene, 'pointermove', (e) => {
      pointerEnergy = Math.max(pointerEnergy, Math.min(Math.abs(e.clientX - lastX) / 40, 0.8));
      lastX = e.clientX;
    });
    panels.forEach((p) => {
      const cx = gsap.quickTo(p.cue, 'x', { duration: 0.25, ease: 'power3' });
      listen(p.screen, 'pointermove', (e) => {
        const r = p.screen.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        if (p.state === 'on') {
          // EQ: le barre vicine al cursore saltano, come le frequenze sotto un fader
          for (let i = 0; i < N; i++) {
            const d = (i + 0.5) / N - px;
            p.eq[i] = -18 * Math.exp(-(d * d) / (2 * 0.1 * 0.1));
          }
          p.dirty = true;
          cx(e.clientX - r.left);
          gsap.to(p.cue, { opacity: 1, duration: 0.2, overwrite: 'auto' });
        } else if (p.state === 'build') {
          if (Math.random() < 0.35) glitch(p);
        }
      });
      listen(p.screen, 'pointerleave', () => {
        p.eq.fill(0);
        p.dirty = true;
        gsap.to(p.cue, { opacity: 0, duration: 0.3, overwrite: 'auto' });
      });
      listen(p.screen, 'pointerdown', (e) => {
        if (p.state !== 'on') return;
        const r = p.screen.getBoundingClientRect();
        drop(p, (e.clientX - r.left) / r.width);
      });
    });
    listen(crt, 'pointerenter', () => {
      strobe = true;
      gsap.to(monitor, { scale: 1.05, duration: 0.5, ease: 'expo.out' });
    });
    listen(crt, 'pointerleave', () => {
      strobe = false;
      gsap.to(monitor, { scale: 1, duration: 0.6, ease: 'expo.out' });
    });
    listen(crt, 'pointerdown', () => loopOn && cut(true));
    listen(spectrum, 'pointermove', () => (pointerEnergy = 1));
  } else {
    /* smartphone: il tocco fa il drop sulle foto, taglia il monitor, carica lo spettro */
    panels.forEach((p) =>
      listen(p.screen, 'pointerdown', (e) => {
        if (p.state !== 'on') return;
        const r = p.screen.getBoundingClientRect();
        drop(p, (e.clientX - r.left) / r.width);
      }),
    );
    listen(crt, 'pointerdown', () => loopOn && cut(true));
    listen(spectrum, 'pointerdown', () => (energy = 1));
  }

  /* ---------- coreografie ---------- */
  const powerOn = (tl: gsap.core.Timeline, at: number) =>
    tl
      .fromTo(crt, { scaleX: 0.02, scaleY: 0.006, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, at)
      .to(crt, { scaleY: 1, duration: 0.5, ease: 'expo.out' }, at + 0.3)
      .fromTo(crtFlash, { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: 'power1.out' }, at + 0.35)
      .fromTo(cap, { opacity: 0 }, { opacity: 1, duration: 0.4 }, at + 0.55)
      .fromTo(spectrum, { opacity: 0, scaleY: 0, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 0.8, ease: 'expo.out' }, at + 0.45);

  const reveal = (tl: gsap.core.Timeline, p: Panel, at: number) => {
    p.at = at;
    tl.fromTo(p.barEls, { yPercent: 101 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: { each: 0.045, from: 'center' } }, at)
      .fromTo(p.title, { opacity: 0, x: -24, fontStretch: '125%' }, { opacity: 1, x: 0, fontStretch: '62%', duration: 1, ease: 'expo.out' }, at + 0.4)
      .fromTo(p.line, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, at + 0.55);
  };
  const BUILD = 1.1 + 0.045 * (N / 2) + 0.1; // durata della composizione di un pannello

  mm.add(
    {
      desk: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      mob: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      if (ctx.conditions?.desk) {
        // prima il monitor si accende e parte il loop, poi si compongono le due foto
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scene, start: 'top top', end: '+=200%', pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: () => {
              const t = tl.time();
              loopOn = t > 0.6;
              panels.forEach((p) => (p.state = t < p.at ? 'off' : t < p.at + BUILD ? 'build' : 'on'));
            },
          },
        });
        powerOn(tl, 0);
        reveal(tl, panels[0], 1.1);
        reveal(tl, panels[1], 2.0);
        tl.to({}, { duration: 0.6 });
      } else {
        // smartphone: niente pin; il monitor si accende in vista, le foto si compongono dopo, quando arrivano
        const intro = gsap.timeline({ paused: true });
        powerOn(intro, 0);
        let introDone = false;
        const waiting: Array<() => void> = [];
        intro.call(() => {
          loopOn = true;
          introDone = true;
          waiting.splice(0).forEach((f) => f());
        }, [], 0.7);
        ScrollTrigger.create({ trigger: monitor, start: 'top 82%', once: true, onEnter: () => void intro.play() });
        panels.forEach((p) => {
          const ptl = gsap.timeline({ paused: true, onStart: () => (p.state = 'build'), onComplete: () => (p.state = 'on') });
          reveal(ptl, p, 0);
          ScrollTrigger.create({
            trigger: p.el, start: 'top 85%', once: true,
            onEnter: () => (introDone ? void ptl.play() : waiting.push(() => void ptl.play())),
          });
        });
      }
    },
  );
}
