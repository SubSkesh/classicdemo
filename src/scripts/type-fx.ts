/**
 * Effetti tipografici sull'asse di larghezza di Archivo (wdth 62–125).
 * - stretchIn: le lettere entrano larghe e "luminose" e si comprimono al loro posto.
 *
 * L'insegna rotta (neonTitle) è in ./neon.ts.
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

