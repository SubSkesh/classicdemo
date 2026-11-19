/**
 * Titolo come insegna rotta.
 * - Le lettere sono spente (grigio che rispetta comunque il contrasto AA per testo grande).
 * - Una luce le percorre e le lascia spegnere dietro di sé.
 * - Alcune lettere sono crepate (due metà sfalsate lungo una frattura) e sfarfallano.
 * - setProgress(0→1): man mano che le foto compaiono le lettere restano accese e le crepe si saldano.
 */
import { SplitText } from 'gsap/SplitText';
import { gsap } from './motion';

gsap.registerPlugin(SplitText);

export type Neon = { setProgress: (p: number) => void; revert: () => void };

export function neonTitle(el: HTMLElement): Neon {
  const split = SplitText.create(el, { type: 'words,chars', charsClass: 'nch' });
  const chars = split.chars as HTMLElement[];
  const n = chars.length;
  const fs = parseFloat(getComputedStyle(el).fontSize);

  // lettere crepate: scelte a mano per distribuirle tra le due righe
  const crackAt = [1, 5, 10, 13].filter((i) => i < n);
  const cracks = crackAt.map((i, k) => {
    const c = chars[i];
    const t = c.textContent ?? '';
    c.classList.add('crk');
    c.innerHTML = `<span class="g">${t}</span><span class="h a">${t}</span><span class="h b">${t}</span>`;
    const a = c.querySelector<HTMLElement>('.a')!;
    const b = c.querySelector<HTMLElement>('.b')!;
    const s = k % 2 ? -1 : 1;
    const broken = {
      a: { x: s * 0.045 * fs, y: -0.03 * fs, rotation: s * 3 },
      b: { x: -s * 0.05 * fs, y: 0.02 * fs, rotation: -s * 1.2 },
    };
    gsap.set(a, broken.a);
    gsap.set(b, broken.b);
    return { i, a, b, broken, fixed: false, at: 0.22 + k * 0.2 };
  });
  const isCrack = new Set(crackAt);

  // ordine in cui le lettere "restano accese" con il progredire della scena
  const lockAt = chars.map((_, i) => 0.12 + (((i * 7) % n) / n) * 0.8);
  let progress = 0;
  const shown = new Float32Array(n).fill(-1);
  const shownGlow = new Float32Array(n).fill(-1);
  const blink = new Float32Array(n);

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(el);

  const tick = (time: number) => {
    if (!visible) return;
    // la luce attraversa le lettere in 1,6 s, poi una pausa, poi riparte
    const cycle = 2.6;
    const s = ((time % cycle) / 1.6) * (n + 6) - 3;
    for (let i = 0; i < n; i++) {
      const locked = progress >= lockAt[i];
      const sweep = progress >= 1 ? 0 : Math.exp(-((i - s) ** 2) / 1.6);
      let L = locked ? 1 : sweep * 0.95;
      // il bagliore c'è solo dove passa la luce: a insegna aggiustata il testo resta nitido
      const G = Math.round(sweep * (locked ? 0.45 : 0.9) * 40) / 40;
      if (G !== shownGlow[i]) {
        chars[i].style.setProperty('--glow', String(G));
        shownGlow[i] = G;
      }
      // neon che non regge: le crepate sfarfallano spesso, le altre ogni tanto
      const broken = isCrack.has(i) && !cracks.find((c) => c.i === i)!.fixed;
      const chance = broken ? 0.05 : locked ? 0.002 : 0.006;
      if (Math.random() < chance) blink[i] = 1;
      blink[i] *= 0.78;
      L *= 1 - blink[i] * (broken ? 0.95 : 0.6);
      if (broken && !locked) L = Math.max(L, 0.18 * (Math.random() < 0.5 ? 1 : 0));
      const q = Math.round(L * 40) / 40;
      if (q !== shown[i]) {
        chars[i].style.setProperty('--lit', String(q));
        shown[i] = q;
      }
    }
  };
  gsap.ticker.add(tick);

  const setProgress = (p: number) => {
    progress = p;
    cracks.forEach((c) => {
      const should = p >= c.at;
      if (should === c.fixed) return;
      c.fixed = should;
      if (should) {
        // la crepa si salda con uno scatto e un lampo
        gsap.to([c.a, c.b], { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'back.out(2.6)', overwrite: true });
        gsap.fromTo(chars[c.i], { '--glow': 1 }, { '--glow': 0, duration: 0.7, ease: 'power2.out', onComplete: () => (shownGlow[c.i] = 0) });
      } else {
        gsap.to(c.a, { ...c.broken.a, duration: 0.3, ease: 'power2.out', overwrite: true });
        gsap.to(c.b, { ...c.broken.b, duration: 0.3, ease: 'power2.out', overwrite: true });
      }
    });
  };

  return {
    setProgress,
    revert: () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      split.revert();
    },
  };
}
