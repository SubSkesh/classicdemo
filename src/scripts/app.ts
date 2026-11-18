import { gsap, ScrollTrigger, lenis, startLenis } from './motion';

type Cleanup = () => void;
export type PageInit = (root: HTMLElement) => Cleanup | void;

/** Ogni pagina dichiara `<main data-page="...">` e qui trova il suo modulo di animazione. */
const pages: Record<string, () => Promise<{ default: PageInit }>> = {
  home: () => import('./pages/home'),
  serate: () => import('./pages/serate'),
  evento: () => import('./pages/evento'),
};

let ctx: gsap.Context | null = null;
let cleanup: Cleanup | void;

document.addEventListener('astro:page-load', async () => {
  startLenis();
  const root = document.querySelector<HTMLElement>('main[data-page]');
  const key = root?.dataset.page;
  const load = key ? pages[key] : undefined;
  if (root && load) {
    const mod = await load();
    ctx = gsap.context(() => {
      cleanup = mod.default(root);
    }, root);
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());
});

document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = undefined;
  ctx?.revert();
  ctx = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
});

document.addEventListener('astro:after-swap', () => {
  if (!location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
  lenis?.resize();
});
