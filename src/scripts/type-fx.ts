/**
 * Effetti tipografici sull'asse di larghezza di Archivo (wdth 62–125).
 * - stretchIn: le lettere entrano larghe e "luminose" e si comprimono al loro posto.
 * - equalizer: le lettere si allargano a onda come un VU-meter, guidate dalla velocità di scroll.
 */
import { SplitText } from 'gsap/SplitText';
import { gsap } from './motion';

gsap.registerPlugin(SplitText);

const REST = 62;

type StretchOpts = { trigger?: Element; start?: string; delay?: number; stagger?: number; from?: number; onDone?: () => void };

export function stretchIn(el: HTMLElement, o: StretchOpts = {}) {
  const split = SplitText.create(el, { type: 'lines,chars', mask: 'lines', charsClass: 'ch' });
  const tl = gsap.timeline({
    paused: !o.trigger,
    delay: o.delay ?? 0,
    onComplete: o.onDone,
    scrollTrigger: o.trigger ? { trigger: o.trigger, start: o.start ?? 'top 82%', once: true } : undefined,
  });
  tl.fromTo(
    split.chars,
    { yPercent: 80, opacity: 0, fontStretch: `${o.from ?? 125}%` },
    { yPercent: 0, opacity: 1, fontStretch: `${REST}%`, duration: 1.4, ease: 'expo.out', stagger: o.stagger ?? 0.035 },
  );
  return { split, tl, revert: () => { tl.kill(); split.revert(); } };
}

/** Da chiamare dopo stretchIn (riusa i suoi caratteri). Restituisce la funzione di pulizia. */
export function equalizer(chars: HTMLElement[], amp = 46) {
  let level = 0;
  let phase = 0;
  let resting = true;
  let lastY = window.scrollY;
  const tick = (_t: number, dt: number) => {
    // velocità misurata sullo scroll reale: funziona con Lenis (rotella) e con il touch nativo
    const y = window.scrollY;
    const v = Math.abs(y - lastY) / Math.max(dt, 1) * 16.67;
    lastY = y;
    const target = Math.min(v / 26, 1);
    level += (target - level) * (target > level ? 0.18 : 0.05);
    if (level < 0.004) {
      if (!resting) {
        chars.forEach((c) => (c.style.fontStretch = `${REST}%`));
        resting = true;
      }
      return;
    }
    resting = false;
    phase += (dt / 1000) * (5 + level * 9);
    chars.forEach((c, i) => {
      const wave = 0.5 + 0.5 * Math.sin(phase - i * 0.62);
      c.style.fontStretch = `${(REST + level * amp * wave).toFixed(1)}%`;
    });
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
