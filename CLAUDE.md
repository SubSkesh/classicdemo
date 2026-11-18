# Brief per Claude Code — Demo sito Classic Club (Rimini)

> Da incollare come primo messaggio in Claude Code (o salvare come `CLAUDE.md` nella cartella del nuovo progetto).
> Autore: Oscar Costanzelli — OC Software (OCSW). Data: 18 novembre 2026.

## 1. Contesto e obiettivo

Sono Oscar (OC Software, freelance: siti, applicazioni e software su misura). Domenica 15 novembre 2026 ho conosciuto di persona Yuri, responsabile del Classic Club di Rimini (Instagram: buongiorno_yuri; compare anche come contatto booking/party sulle pagine RA). Mi ha chiesto di mandargli "roba da vedere".

**Obiettivo:** costruire una **demo visiva molto curata, solo front-end**, da mostrargli in anteprima. Deve far dire "wow" su mobile e desktop, con animazioni fluide e un'identità forte da club. Non è il sito finale e non raccoglie dati reali.

**Perimetro della demo (non uscire da qui):**
1. **Home page**
2. **Pagina "Serate"** (elenco eventi + dettaglio evento)

Niente altro: niente Il Circolo, Attività culturali, Contatti, né backend. Il pre-tesseramento e la "Lista online" sono solo **mock visivi** (nessun invio dati, nessun salvataggio).

## 2. Il cliente: cosa devi sapere

- **Classic Club**: circolo privato ARCI/Arcigay a Rimini (Via Feleto 15), attivo dal 1987 (nel 2026 festeggia 39 anni). Club e after hours house/techno, circa 600 persone, due piste, piscina e giardino. Ingresso riservato ai soci, 18+, documento obbligatorio.
- Il **Buongiorno Classic** è l'after della domenica mattina: il format più riconoscibile del locale.
- Il pubblico è **LGBTQIA+**: il linguaggio visivo e i testi devono essere inclusivi, sicuri, festosi, mai stereotipati o volgari. Evitare foto di corpi in modo sessualizzato; privilegiare luci, consolle, performer, atmosfera.
- I 3 eventi attualmente pubblicati sul loro sito (usali come contenuto di esempio):
  - **Sab 21 novembre 2026** — BUONGIORNO CLASSIC — dalle 23.45 alle 07.00 — Flavio Vecchi, Ricky Montanari, Smoud Beats, Lucangelini.
  - **Sab 28 novembre 2026** — MIDNIGHT TENSION (serata LGBTQIA+, "Wintertime @ Classic Club") — dalle 23.45 alle 05.00 — Consolle: Federico Santini, Nikos; Voice: Shasha; Performers: Raven Idoll, Davide, Chiara.
  - **Lun 7 dicembre 2026** — CLASSIC & TUNGA / HAPPY BIRTHDAY CLASSIC, 39 anni — dalle 23.45 alle 05.00 — line-up TBA.
- Social: Instagram `classicclubrimini`, Facebook `classicclub.rimini.officialpage`.

## 3. Il sito attuale (analizzato il 18/11/2026)

- **Piattaforma:** WordPress, tema Bridge 7.0.9 (Qode), con LayerSlider, Slider Revolution, WPBakery (js_composer), Elementor, Contact Form 7. Template del 2020.
- **Look:** sfondo grigio chiaro con texture, forme geometriche (triangoli, cerchi con foto ritagliate in tondo), slider, font Oswald/Roboto/Montserrat. Datato, poco emozionale, poco "club".
- **Menu:** Il Circolo, Attività culturali, Eventi, Pre-Tesseramento, Lista Online, Contatti.
- **Home:** hero slider con titolo "CLASSIC CLUB" e dicitura "Circolo Privato. Ingresso riservato ai soci. 18+ Only. ID is Required.", poi "Programma prossimi eventi" con locandine (con pulsante "Iscriviti in LISTA ON-LINE"), poi link a tutti gli eventi.
- **Logo:** marchio nero a due "C" speculari con barra centrale (monogramma quadrato) + scritta CLASSIC CLUB. Versioni scaricabili:
  - bianco: https://www.classic-club.net/wp-content/uploads/2020/07/logo-white-footer.png
  - nero: https://www.classic-club.net/wp-content/uploads/2020/07/logo-dark-70.png
- **Immagini utili** (stesso dominio): locandine eventi
  - https://www.classic-club.net/wp-content/uploads/2026/11/28nov26_quad-500x500.png
  - https://www.classic-club.net/wp-content/uploads/2026/11/7dic2026-quad-500x500.png
  - https://www.classic-club.net/wp-content/uploads/2026/11/21-11-26-700x840.png
  - foto atmosfera: `.../2020/07/eventi-img-1.jpg`, `.../2019/12/rev-img-05.jpg`, `.../2024/01/fb001-768x278.jpg`, e gli elementi del primo slider (`rev-img-classic2.png`, `rev-img-02-*`, `rev-img-03-*`).
- **Usa il browser** per aprire classic-club.net e ispezionare tu stesso foto, logo, pagina /eventi/, /lista-online/ e /pre-tesseramento-online/ prima di disegnare. Scarica le immagini in `/public/assets/classic/` e **ottimizzale** (AVIF/WebP, più versioni responsive). Se le foto sono troppo piccole o poche, usa sfondi astratti generati (gradienti, grain, luci) invece di inventare foto: niente foto stock di persone.

## 4. Regole su logo, foto e dati (importanti)

- Logo, locandine e foto sono materiale del Classic: vanno bene **solo per questa demo privata** mostrata a loro. La demo sta dietro password, con `noindex` e `X-Robots-Tag: noindex`; niente repo pubblica.
- Nessuna raccolta dati reale. I form sono finti (stato di successo simulato). Nota di fondo: tesseramento e lista di un circolo LGBTQ+ trattano dati personali delicati (GDPR); questo sarà un punto da affrontare nella versione reale, non nella demo.
- Non copiare testi lunghi dal sito attuale: riscrivi e sintetizza. Mantieni i dati fattuali (date, orari, nomi artisti).

## 5. Direzione visiva

**Sensazione:** cinematografico, notturno, fluido. Come entrare in un after alle 6 del mattino: buio, luce che buca, grana, ritmo.

- **Palette:** nero profondo (#0A0A0A) e bianco osso (#F2F0EB) come base, in coerenza con il monogramma bianco/nero del Classic. **Un solo accento** (vivace, ad esempio un rosso-magenta o un acido) usato con parsimonia, più, se serve, un gradiente iridescente discreto come richiamo al mondo LGBTQ+ (mai l'arcobaleno banale).
- **Tipografia:** un display grande e condensato per i titoli (valuta una variabile tipo "Anton", "Bebas Neue" o simili, oppure un grotesk forte) + un grotesk pulito per il testo. Testi giganti, tagli di scala drammatici, molto contrasto.
- **Texture:** grana di pellicola animata leggera, vignettatura, glow di luce.
- Prima di costruire, **proponimi 2 direzioni** in due schermate statiche molto rapide (hero + card evento), poi procedi con quella che scelgo. Se non rispondo, scegli tu la più forte.

## 6. Animazioni e interazione (qui sta il valore)

Obiettivo: **fluidità a 60 fps**, niente scatti.

- **Scroll fluido** con Lenis, sincronizzato con GSAP ScrollTrigger.
- **Intro/loader** breve (max 2 secondi): il monogramma si disegna/rivela, poi la hero si apre.
- **Hero a tutto schermo**: immagine/loop con lento movimento (Ken Burns/parallax), grana, titolo gigante con reveal per riga/lettera, indicazione "scroll".
- **Marquee** infinito a più velocità (es. "BUONGIORNO CLASSIC · AFTER · DAL 1987 · RIMINI"), che reagisce alla velocità di scroll.
- **Sezione "Prossime serate"**: card con locandina, hover magnetico/tilt, cursore personalizzato su desktop, scroll orizzontale agganciato (pin) su desktop e swipe nativo su mobile.
- **Sezione manifesto** (chi siamo, 2-3 frasi): testo che si illumina parola per parola con lo scroll.
- **Galleria atmosfera** con parallax e maschere.
- **Pagina Serate**: elenco grande tipografico (riga = data + nome + line-up), hover che mostra la locandina che segue il cursore; clic → **transizione di pagina** fluida verso il dettaglio evento (lineup, orari, regole d'ingresso, pulsante "Iscriviti in lista" che apre un pannello/modal mock).
- **Opzionale (solo se resta tempo e la performance regge):** un effetto shader/WebGL leggero nella hero (distorsione, luce, particelle) con **fallback statico su mobile**.
- **Accessibilità e performance obbligatorie:** rispetta `prefers-reduced-motion` (versione senza movimenti), focus visibili, contrasto AA, tutto navigabile da tastiera, `alt` sulle immagini. Mobile-first: la maggior parte degli utenti arriva da telefono. Obiettivo Lighthouse: Performance 90+ su mobile, CLS ~0.

## 7. Stack consigliato

- **Astro** (statico, veloce) + **TypeScript**, **GSAP + ScrollTrigger**, **Lenis**; transizioni di pagina con le View Transitions di Astro o Barba/GSAP. CSS moderno (variabili, `clamp()`), Tailwind opzionale.
- Three.js/OGL **solo** se serve per l'effetto hero opzionale.
- **Deploy:** progetto Cloudflare Pages separato su sottodominio `classic.ocsw.it`, protetto da password, stessa procedura già usata per `ripamonti.ocsw.it`. Repo **privata** nuova (`classic-demo`), non quella di ocsw.
- Niente WordPress, niente CMS nella demo: i dati eventi stanno in un file `events.json` / content collection, già pensato per essere sostituibile da un CMS in futuro.

## 8. Skill e strumenti da cercare/installare per Claude Code

Prima di partire, **verifica cosa ho già installato** e proponimi un set minimo (3-4 al massimo, non di più). **Leggi il SKILL.md di ogni skill di terze parti prima di installarla** e dimmi cosa fa.

Candidate trovate (da verificare tu stesso):
- Skill ufficiale **frontend-design** (direzione estetica, tipografia, evitare l'aspetto "template").
- **gsap** (animazione/ScrollTrigger), tra le più installate secondo le directory di skill.
- Marketplace `freshtechbro/claudedesignskills`: `/plugin marketplace add freshtechbro/claudedesignskills`, poi `/plugin install gsap-scrolltrigger` (e `threejs-webgl` solo se usiamo WebGL).
- Collezione `rshvr/elite-web-design` (es. `elite-gsap`, `elite-inspiration`) per sviluppo front-end premium.
- Una skill di **audit accessibilità/web-design-guidelines** (include la verifica del reduced motion).
- Come strumenti di verifica: **Playwright** (screenshot mobile/desktop, test dei percorsi) e **Lighthouse**.

## 9. Riferimenti da studiare (siti di club e musica "cinematografici")

Parti da queste piste, **aprile nel browser** e analizza per ciascuna cosa funziona (ritmo dello scroll, tipografia, uso di foto/video, transizioni, resa su mobile). Non copiare layout o asset: prendi i principi.

- **Radio Radio (Amsterdam)** — club boutique, minimal, Site of the Day su Awwwards; interessante la gestione dei residenti e il player sempre visibile.
- **Faith Ibiza** — candidato su Awwwards.
- **Billionaire Bunker Club** — Honorable Mention su Awwwards (2025).
- **Paul Kalkbrenner** (Holographik) — Site of the Day su Awwwards, per scroll e WebGL applicati alla musica elettronica.
- Cerca tu altri: club e festival (Berlino, Ibiza, Londra, Amsterdam, Tokyo), filtrando su Awwwards per "Music/Entertainment", "Scrolling", "WebGL", "GSAP".
- Output richiesto: una pagina `docs/references.md` con 6-8 riferimenti (link + 2 righe su cosa rubare come principio e cosa evitare).

## 10. Piano di lavoro (fasi con verifica)

1. **Setup e ricerca (breve):** controlla skill già presenti, installane 3-4, apri classic-club.net, scarica e ottimizza gli asset, scrivi `docs/references.md`. *Checkpoint: mostrami skill scelte e riferimenti.*
2. **Direzione visiva:** 2 proposte statiche → scelta. Definisci design token (colori, tipografia, spaziature, easing, durate). *Checkpoint.*
3. **Scheletro:** progetto Astro, layout, navigazione, Lenis + GSAP, `events.json` con i 3 eventi, pagine Home e Serate vuote ma responsive.
4. **Home:** intro, hero, marquee, prossime serate, manifesto, galleria, CTA tesseramento (mock), footer. Verifica su mobile e desktop con screenshot Playwright.
5. **Serate:** elenco, hover, transizione di pagina, dettaglio evento, modal "lista" mock.
6. **Rifinitura:** ritmo e easing, reduced motion, accessibilità, performance (immagini, font, JS), Lighthouse mobile ≥ 90.
7. **Deploy:** Cloudflare Pages su `classic.ocsw.it` con password e noindex; mandami il link e una lista di 5 punti da mostrare a Yuri.

**Regole di lavoro:** commit piccoli e frequenti; dopo ogni fase fammi vedere uno screenshot; se una scelta cambia il perimetro, chiedi prima. Non aggiungere pagine, funzioni o dipendenze fuori da questo brief. Tutto il testo del sito in **italiano**, con le diciture di ingresso anche in inglese come sul sito originale.

## 11. Domanda aperta (da tenere a mente, non da implementare)

Se il Classic volesse cambiare piattaforma: il contenuto è poco (poche pagine, eventi, due moduli), quindi la migrazione è fattibile. L'architettura della demo (eventi in un file dati, front-end separato) è pensata per poterci collegare in seguito un CMS semplice per caricare locandina, lineup e date senza toccare codice.
