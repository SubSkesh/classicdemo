import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'expo.out', duration: 1 });

export { gsap, ScrollTrigger };

/** Preferenza dell'utente: se true niente smooth scroll, niente parallax, niente scrub. */
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

export let lenis: Lenis | null = null;

const tick = (time: number) => lenis?.raf(time * 1000);

export function startLenis() {
  if (lenis || reducedMotion.matches) return;
  lenis = new Lenis({ lerp: 0.1, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add('has-lenis');
}

export function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
  document.documentElement.classList.remove('has-lenis');
}

reducedMotion.addEventListener('change', () => {
  document.documentElement.classList.toggle('reduced', reducedMotion.matches);
  if (reducedMotion.matches) stopLenis();
  else startLenis();
  ScrollTrigger.refresh();
});
document.documentElement.classList.toggle('reduced', reducedMotion.matches);

/** true dopo la prima navigazione client-side (View Transitions): le pagine evitano di duplicare il morph. */
export const nav = { client: false };
