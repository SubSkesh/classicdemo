/**
 * Effetti tipografici sull'asse di larghezza di Archivo (wdth 62–125).
 * - stretchIn: le lettere entrano larghe e "luminose" e si comprimono al loro posto.
 * - equalizer: le lettere si allargano a onda come un VU-meter, guidate dalla velocità di scroll.
 */
import { SplitText } from 'gsap/SplitText';
import { gsap, lenis } from './motion';

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
    { yPercent: 70, opacity: 0, fontStretch: `${o.from ?? 125}%`, filter: 'blur(6px)' },
    {
      yPercent: 0, opacity: 1, fontStretch: `${REST}%`, filter: 'blur(0px)',
      duration: 1.3, ease: 'expo.out', stagger: o.stagger ?? 0.035, clearProps: 'filter',
    },
  );
  return { split, tl, revert: () => { tl.kill(); split.revert(); } };
}

/** Da chiamare dopo stretchIn (riusa i suoi caratteri). Restituisce la funzione di pulizia. */
export function equalizer(chars: HTMLElement[], amp = 46) {
  let level = 0;
  let phase = 0;
  let resting = true;
  const tick = (_t: number, dt: number) => {
    const v = lenis ? Math.abs(lenis.velocity) : 0;
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
