import { SplitText } from 'gsap/SplitText';
import { gsap, reducedMotion, nav } from '../motion';
import type { PageInit } from '../app';

gsap.registerPlugin(SplitText);

const init: PageInit = (root) => {
  if (reducedMotion.matches) return;
  const cleanups: Array<() => void> = [];
  const h1 = root.querySelector<HTMLElement>('[data-split]');
  // arrivando da un'altra pagina il titolo fa già il morph: animarlo di nuovo sarebbe un doppione
  if (h1 && !nav.client) {
    const s = SplitText.create(h1, { type: 'words,chars', mask: 'chars' });
    gsap.from(s.chars, { yPercent: 105, duration: 1.1, stagger: 0.03, delay: 0.1 });
    gsap.from(root.querySelector('.poster'), { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', delay: 0.2 });
    cleanups.push(() => s.revert());
  }
  gsap.from(root.querySelectorAll('[data-fade]'), {
    opacity: 0, y: 28, duration: 1, stagger: 0.07, delay: nav.client ? 0.45 : 0.4, clearProps: 'all',
  });
  return () => cleanups.forEach((c) => c());
};

export default init;
