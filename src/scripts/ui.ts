import { gsap, lenis, finePointer, reducedMotion } from './motion';

/* ---------------- Modali mock ---------------- */

let lastTrigger: HTMLElement | null = null;

function openDialog(id: string, trigger?: HTMLElement | null) {
  const dlg = document.getElementById(id);
  if (!(dlg instanceof HTMLDialogElement)) return;
  lastTrigger = trigger ?? null;
  resetDialog(dlg);
  dlg.showModal();
  lenis?.stop();
  dlg.dispatchEvent(new CustomEvent('mock:open', { detail: { trigger } }));
}

function resetDialog(dlg: HTMLDialogElement) {
  const form = dlg.querySelector<HTMLFormElement>('[data-mock-form]');
  const ok = dlg.querySelector<HTMLElement>('[data-mock-success]');
  if (form && ok) {
    form.hidden = false;
    ok.hidden = true;
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  }
}

document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const opener = t.closest<HTMLElement>('[data-dialog-open]');
  if (opener) {
    ev.preventDefault();
    openDialog(opener.dataset.dialogOpen!, opener);
    return;
  }
  if (t.closest('[data-dialog-close]')) {
    t.closest('dialog')?.close();
    return;
  }
  // clic sul backdrop
  if (t instanceof HTMLDialogElement && t.open) t.close();
});

document.addEventListener(
  'close',
  (ev) => {
    if (!(ev.target instanceof HTMLDialogElement)) return;
    lenis?.start();
    lastTrigger?.focus({ preventScroll: true });
  },
  true,
);

document.addEventListener('submit', (ev) => {
  const form = ev.target as HTMLFormElement;
  if (!form.matches('[data-mock-form]')) return;
  ev.preventDefault();
  let firstInvalid: HTMLElement | null = null;
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((f) => {
    const bad = !f.checkValidity();
    if (bad) f.setAttribute('aria-invalid', 'true');
    else f.removeAttribute('aria-invalid');
    if (bad && !firstInvalid) firstInvalid = f;
  });
  if (firstInvalid) {
    (firstInvalid as HTMLElement).focus();
    return;
  }
  // nessun invio: solo stato di successo simulato
  const ok = form.parentElement?.querySelector<HTMLElement>('[data-mock-success]');
  if (!ok) return;
  form.hidden = true;
  ok.hidden = false;
  ok.focus();
  if (!reducedMotion.matches) gsap.from(ok.children, { y: 24, opacity: 0, stagger: 0.08, duration: 0.8 });
});

/* ---------------- Cursore (solo desktop con mouse) ---------------- */

function initCursor() {
  const el = document.querySelector<HTMLElement>('[data-cursor-el]');
  if (!el || !finePointer.matches || reducedMotion.matches) return;
  const label = el.querySelector<HTMLElement>('[data-cursor-label]')!;
  document.documentElement.classList.add('has-cursor');
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  let shown = false;
  let px = -1;
  let py = -1;
  const update = (node: Element | null) => {
    const target = node?.closest<HTMLElement>('[data-cursor], a, button, label, input, select');
    const text = target?.dataset.cursor ?? '';
    el.classList.toggle('is-label', !!text);
    el.classList.toggle('is-link', !!target && !text);
    if (text && label.textContent !== text) label.textContent = text;
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX;
    py = e.clientY;
    if (!shown) {
      gsap.set(el, { x: px, y: py });
      el.classList.add('is-on');
      shown = true;
    }
    x(px);
    y(py);
    update(e.target as Element);
  });
  // durante lo scroll il puntatore resta fermo ma il contenuto sotto cambia
  window.addEventListener('scroll', () => shown && update(document.elementFromPoint(px, py)), { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  document.addEventListener('pointerenter', () => shown && el.classList.add('is-on'));
}

initCursor();
