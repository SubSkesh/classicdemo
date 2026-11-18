import manifest from '../data/images.json';

type Entry = { w: number; h: number; widths: number[]; alpha: boolean; lqip: string };
const images = manifest as Record<string, Entry>;
const base = '/assets/classic';

export function img(name: string) {
  const e = images[name];
  if (!e) throw new Error(`Immagine sconosciuta: ${name}`);
  const set = (ext: string) => e.widths.map((w) => `${base}/${name}-${w}.${ext} ${Math.min(w, e.w)}w`).join(', ');
  const largest = e.widths[e.widths.length - 1];
  return {
    width: e.w,
    height: e.h,
    avif: set('avif'),
    webp: set('webp'),
    src: `${base}/${name}-${largest}.webp`,
    lqip: e.lqip,
  };
}
