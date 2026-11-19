/**
 * LA NOTTE AL CLASSIC
 * - titolo come insegna rotta: si accende e si aggiusta man mano che compaiono le foto;
 * - un monitor in loop alterna tre fotogrammi a tagli secchi, a tempo (128 BPM);
 * - La pista si compone a barre e risponde al cursore come un equalizzatore (clic = drop);
 * - Performance si apre come un occhio di bue e il cono di luce segue il cursore.
 *
 * Desktop: scena fissata e coreografata dallo scroll; cosa fa il cursore dipende dallo stato della foto.
 * Smartphone: stessa sequenza senza pin; tocco = drop sulla pista, luce sul performer, taglio sul monitor.
 */
import { gsap, ScrollTrigger, finePointer } from '../motion';
import { neonTitle } from '../neon';

const BPM = 128;
const BEAT = 60 / BPM;
type Cleanups = Array<() => void>;
type State = 'off' | 'build' | 'on';

type Base = { el: HTMLElement; screen: HTMLElement; flash: HTMLElement; title: HTMLElement; at: number; build: number; state: State };
type Bars = Base & {
  fx: 'bars';
  cue: HTMLElement;
  barEls: HTMLElement[];
  slices: HTMLElement[];
  eq: number[];
  cur: number[];
  drop: Array<{ v: number }>;
  jit: number[];
  dirty: boolean;
  busyUntil: number;
};
type Spot = Base & {
  fx: 'spot';
  spot: HTMLElement;
  mx: number; my: number; r: number; // valori attuali (px)
  tx: number; ty: number; tr: number; // bersagli
  open: number; // raggio "tutto illuminato"
  dirty: boolean;
  release?: gsap.core.Tween;
};
type Panel = Bars | Spot;

export function techno(root: HTMLElement, mm: gsap.MatchMedia, cleanups: Cleanups) {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  if (!scene) return;
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  const N = desktop ? 18 : 10;

  /* ---------- titolo: insegna rotta che si aggiusta con le foto ---------- */
  const neon = neonTitle(scene.querySelector<HTMLElement>('[data-neon]')!);
  cleanups.push(() => neon.revert());

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
  };

  /* ---------- pannelli ---------- */
  const panels: Panel[] = [...scene.querySelectorAll<HTMLElement>('[data-panel]')].map((el) => {
    const screen = el.querySelector<HTMLElement>('[data-screen]')!;
    const base = {
      el, screen,
      flash: screen.querySelector<HTMLElement>('[data-flash]')!,
      title: el.querySelector<HTMLElement>('[data-panel-title]')!,
      at: 0, build: 1.6, state: 'off' as State,
    };
    if (el.dataset.fx === 'spot') {
      const p: Spot = { ...base, fx: 'spot', spot: screen.querySelector<HTMLElement>('[data-spot]')!, mx: 0, my: 0, r: 0, tx: 0, ty: 0, tr: 0, open: 0, dirty: true };
      const measure = () => {
        const w = screen.clientWidth;
        const h = screen.clientHeight;
        p.open = Math.hypot(w, h) * 1.3;
        if (!p.r) { p.mx = p.tx = w / 2; p.my = p.ty = h * 0.45; p.r = p.tr = p.open; }
        p.dirty = true;
      };
      measure();
      window.addEventListener('resize', measure);
      cleanups.push(() => window.removeEventListener('resize', measure));
      return p;
    }
    // barre: ogni barra contiene la stessa foto spostata, così insieme ricompongono l'immagine
    const barsBox = screen.querySelector<HTMLElement>('[data-bars]')!;
    const img = screen.querySelector<HTMLImageElement>('img')!;
    const p: Bars = {
      ...base, fx: 'bars', cue: screen.querySelector<HTMLElement>('[data-cue]')!,
      barEls: [], slices: [], eq: Array(N).fill(0), cur: Array(N).fill(0),
      drop: Array.from({ length: N }, () => ({ v: 0 })), jit: Array(N).fill(0), dirty: false, busyUntil: 0,
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

  /* ---------- un solo ticker (solo con la scena visibile) ---------- */
  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' });
  io.observe(scene);
  const tick = (_time: number, dt: number) => {
    if (!visible) return;
    if (loopOn) {
      acc += dt / 1000;
      if (acc >= (strobe ? BEAT / 4 : BEAT * 2)) {
        acc = 0;
        cut();
      }
    }
    for (const p of panels) {
      if (!p.dirty) continue;
      if (p.fx === 'bars') {
        let moving = false;
        for (let i = 0; i < N; i++) {
          p.cur[i] += (p.eq[i] - p.cur[i]) * 0.2;
          p.jit[i] *= 0.78;
          const yv = p.cur[i] + p.drop[i].v;
          if (Math.abs(yv) > 0.05 || Math.abs(p.jit[i]) > 0.1) moving = true;
          p.slices[i].style.transform = `translate3d(${p.jit[i].toFixed(1)}px, ${yv.toFixed(2)}%, 0)`;
        }
        if (!moving && p.eq.every((v) => v === 0) && performance.now() > p.busyUntil) p.dirty = false;
      } else {
        // occhio di bue: posizione e apertura del cono inseguono il bersaglio con un po' di inerzia
        p.mx += (p.tx - p.mx) * 0.14;
        p.my += (p.ty - p.my) * 0.14;
        p.r += (p.tr - p.r) * 0.1;
        p.spot.style.setProperty('--mx', `${p.mx.toFixed(1)}px`);
        p.spot.style.setProperty('--my', `${p.my.toFixed(1)}px`);
        p.spot.style.setProperty('--r', `${p.r.toFixed(1)}px`);
        if (Math.abs(p.tx - p.mx) < 0.5 && Math.abs(p.ty - p.my) < 0.5 && Math.abs(p.tr - p.r) < 0.5) p.dirty = false;
      }
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    io.disconnect();
  });

  /* ---------- azioni ---------- */
  const drop = (p: Bars, px: number) => {
    p.dirty = true;
    p.busyUntil = performance.now() + 1700;
    p.drop.forEach((d, i) => {
      const dist = Math.abs((i + 0.5) / N - px);
      gsap.timeline({ delay: dist * 0.35 })
        .to(d, { v: -(8 + (1 - dist) * 22), duration: 0.16, ease: 'power2.out', overwrite: true })
        .to(d, { v: 0, duration: 0.95, ease: 'bounce.out' });
    });
    gsap.fromTo(p.flash, { opacity: 0.45 }, { opacity: 0, duration: 0.5, ease: 'power1.out', overwrite: true });
  };
  const focus = (p: Spot, x: number, y: number) => {
    p.release?.kill();
    p.tx = x;
    p.ty = y;
    p.tr = Math.max(p.screen.clientWidth, p.screen.clientHeight) * 0.3;
    p.dirty = true;
  };
  const unfocus = (p: Spot) => {
    p.tr = p.open;
    p.tx = p.screen.clientWidth / 2;
    p.ty = p.screen.clientHeight * 0.45;
    p.dirty = true;
  };
  const local = (p: Panel, e: PointerEvent) => {
    const r = p.screen.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, px: (e.clientX - r.left) / r.width };
  };
  const listen = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener));
  };

  if (finePointer.matches) {
    /* desktop: il cursore fa cose diverse a seconda della foto e del suo stato */
    panels.forEach((p) => {
      if (p.fx === 'bars') {
        const cx = gsap.quickTo(p.cue, 'x', { duration: 0.25, ease: 'power3' });
        listen(p.screen, 'pointermove', (e) => {
          const { x, px } = local(p, e);
          if (p.state === 'on') {
            for (let i = 0; i < N; i++) {
              const d = (i + 0.5) / N - px;
              p.eq[i] = -18 * Math.exp(-(d * d) / (2 * 0.1 * 0.1));
            }
            p.dirty = true;
            cx(x);
            gsap.to(p.cue, { opacity: 1, duration: 0.2, overwrite: 'auto' });
          } else if (p.state === 'build' && Math.random() < 0.35) {
            p.jit[Math.floor(Math.random() * N)] = (Math.random() - 0.5) * 24;
            p.dirty = true;
          }
        });
        listen(p.screen, 'pointerleave', () => {
          p.eq.fill(0);
          p.dirty = true;
          gsap.to(p.cue, { opacity: 0, duration: 0.3, overwrite: 'auto' });
        });
        listen(p.screen, 'pointerdown', (e) => p.state === 'on' && drop(p, local(p, e).px));
      } else {
        listen(p.screen, 'pointermove', (e) => {
          if (p.state !== 'on') return;
          const { x, y } = local(p, e);
          focus(p, x, y);
        });
        listen(p.screen, 'pointerleave', () => unfocus(p));
      }
    });
    listen(crt, 'pointerenter', () => {
      strobe = true;
      gsap.to(monitor, { scale: 1.04, duration: 0.5, ease: 'expo.out' });
    });
    listen(crt, 'pointerleave', () => {
      strobe = false;
      gsap.to(monitor, { scale: 1, duration: 0.6, ease: 'expo.out' });
    });
    listen(crt, 'pointerdown', () => loopOn && cut(true));
  } else {
    /* smartphone: tocco = drop sulla pista, luce sul performer (poi torna a illuminare tutto), taglio sul monitor */
    panels.forEach((p) =>
      listen(p.screen, 'pointerdown', (e) => {
        if (p.state !== 'on') return;
        if (p.fx === 'bars') drop(p, local(p, e).px);
        else {
          const { x, y } = local(p, e);
          focus(p, x, y);
          p.release = gsap.delayedCall(1.8, () => unfocus(p));
        }
      }),
    );
    listen(crt, 'pointerdown', () => loopOn && cut(true));
  }

  /* ---------- coreografie ---------- */
  const powerOn = (tl: gsap.core.Timeline, at: number) =>
    tl
      .fromTo(crt, { scaleX: 0.02, scaleY: 0.006, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, at)
      .to(crt, { scaleY: 1, duration: 0.5, ease: 'expo.out' }, at + 0.3)
      .fromTo(crtFlash, { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: 'power1.out' }, at + 0.35)
      .fromTo(cap, { opacity: 0 }, { opacity: 1, duration: 0.4 }, at + 0.55);

  const reveal = (tl: gsap.core.Timeline, p: Panel, at: number) => {
    p.at = at;
    p.build = p.fx === 'bars' ? 1.6 : 1.45;
    if (p.fx === 'bars') {
      tl.fromTo(p.barEls, { yPercent: 101 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: { each: 0.045, from: 'center' } }, at);
    } else {
      // il palco si accende: un cerchio di luce che si apre dal centro
      tl.fromTo(p.screen, { clipPath: 'circle(0% at 50% 45%)' }, { clipPath: 'circle(75% at 50% 45%)', duration: 1.4, ease: 'power3.inOut' }, at);
    }
    tl.fromTo(p.title, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, at + 0.45);
  };

  mm.add(
    {
      desk: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      mob: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      if (ctx.conditions?.desk) {
        // il monitor si accende e parte il loop, poi si compongono le due foto; l'insegna si aggiusta con loro
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scene, start: 'top top', end: '+=200%', pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: () => {
              const t = tl.time();
              loopOn = t > 0.6;
              panels.forEach((p) => (p.state = t < p.at ? 'off' : t < p.at + p.build ? 'build' : 'on'));
              const last = panels[panels.length - 1];
              neon.setProgress(Math.min(1, t / (last.at + last.build)));
            },
          },
        });
        powerOn(tl, 0);
        reveal(tl, panels[0], 1.1);
        reveal(tl, panels[1], 2.0);
        // pausa a scena completa: le foto restano interattive prima che la pagina riparta
        tl.to({}, { duration: 1.2 });
      } else {
        // smartphone: niente pin; il monitor si accende in vista, le foto si compongono quando arrivano
        const prog = { v: 0 };
        const advance = (to: number) =>
          gsap.to(prog, { v: to, duration: 1.2, ease: 'power1.inOut', overwrite: true, onUpdate: () => neon.setProgress(prog.v) });
        const intro = gsap.timeline({ paused: true });
        powerOn(intro, 0);
        let introDone = false;
        const waiting: Array<() => void> = [];
        intro.call(() => {
          loopOn = true;
          introDone = true;
          advance(0.35);
          waiting.splice(0).forEach((f) => f());
        }, [], 0.7);
        ScrollTrigger.create({ trigger: monitor, start: 'top 82%', once: true, onEnter: () => void intro.play() });
        let done = 0;
        panels.forEach((p) => {
          const ptl = gsap.timeline({
            paused: true,
            onStart: () => (p.state = 'build'),
            onComplete: () => {
              p.state = 'on';
              done++;
              advance(done === panels.length ? 1 : 0.7);
            },
          });
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
