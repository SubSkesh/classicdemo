import { SplitText } from 'gsap/SplitText';
import { gsap, reducedMotion, finePointer } from '../motion';
import type { PageInit } from '../app';

gsap.registerPlugin(SplitText);

const init: PageInit = (root) => {
  const cleanups: Array<() => void> = [];
  const reduce = reducedMotion.matches;

  /* ingresso della pagina */
  if (!reduce) {
    const h1 = root.querySelector<HTMLElement>('[data-split]');
    if (h1) {
      const s = SplitText.create(h1, { type: 'words,chars', mask: 'chars' });
      gsap.from(s.chars, { yPercent: 105, duration: 1.1, stagger: 0.04, delay: 0.15 });
      cleanups.push(() => s.revert());
    }
    gsap.from(root.querySelectorAll('[data-fade]'), { opacity: 0, y: 20, duration: 1, delay: 0.5 });
    gsap.from(root.querySelectorAll('[data-row]'), { opacity: 0, y: 40, duration: 1.1, stagger: 0.08, delay: 0.35 });
  }

  /* locandina che segue il cursore, con inclinazione legata alla velocità */
  const follow = root.querySelector<HTMLElement>('[data-follow]');
  if (follow && finePointer.matches && !reduce) {
    const imgs = new Map<string, HTMLElement>();
    follow.querySelectorAll<HTMLElement>('[data-follow-img]').forEach((el) => imgs.set(el.dataset.followImg!, el));
    const fx = gsap.quickTo(follow, 'x', { duration: 0.6, ease: 'power3' });
    const fy = gsap.quickTo(follow, 'y', { duration: 0.6, ease: 'power3' });
    const rot = gsap.quickTo(follow, 'rotation', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    let active: string | null = null;

    const show = (id: string | null) => {
      if (id === active) return;
      if (active) gsap.to(imgs.get(active)!, { opacity: 0, scale: 0.85, duration: 0.4, overwrite: true });
      if (id) gsap.to(imgs.get(id)!, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out', overwrite: true });
      active = id;
    };
    const move = (e: PointerEvent) => {
      fx(e.clientX);
      fy(e.clientY);
      rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    const list = root.querySelector<HTMLElement>('[data-list]')!;
    root.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
      const id = row.dataset.id!;
      const link = row.querySelector<HTMLAnchorElement>('a')!;
      link.dataset.vtTarget = `#follow-${id}`; // la locandina che vola nel dettaglio è quella sotto il cursore
      row.addEventListener('pointerenter', () => show(id));
    });
    list.addEventListener('pointerleave', () => show(null));
    window.addEventListener('pointermove', move);
    gsap.set(follow, { x: innerWidth / 2, y: innerHeight / 2 });
    cleanups.push(() => window.removeEventListener('pointermove', move));
  }

  return () => cleanups.forEach((c) => c());
};

export default init;
