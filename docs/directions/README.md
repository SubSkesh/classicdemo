# Direzioni visive — Fase 2

Due schermate statiche (hero + card evento). Si aprono direttamente nel browser: `a-fessura.html`, `b-flyer.html`. Screenshot desktop (1440) e mobile (390) accanto.

## A · La fessura
Il monogramma diventa architettura: due C scure come pareti, la barra centrale è una fessura di luce iridescente che buca il buio. Cinematografico, quieto, notturno: l'after alle 6 del mattino.

| Token | Valore |
|---|---|
| Nero | `#0A0A0A` |
| Osso | `#F2F0EB` |
| Cenere (testo secondario) | `#9A978F` (6,9:1 su nero, AA) |
| Accento | rosso-magenta `#FF2D6F` (solo data, CTA, filo "prossima serata") |
| Iridescente | magenta → viola `#B44CFF` → ciano `#5CE1E6`, **solo dentro la fessura** |
| Display | Archivo variabile, larghezza 62, peso 850, maiuscolo |
| Testo | Instrument Sans 400–600 |
| Movimento previsto | la fessura si accende nell'intro (il monogramma si disegna, poi la luce "apre" la hero), respira lentamente, la grana scorre |

## B · Il flyer
Tipografia totale da locandina: righe giganti che escono dal bordo, la folla del Classic dentro le lettere di "BUONGIORNO", una fascia acida con il monogramma come separatore, la card evento come biglietto perforato.

| Token | Valore |
|---|---|
| Nero | `#0A0A0A` |
| Osso | `#F2F0EB` |
| Cenere | `#9A978F` |
| Accento | acido `#CFFF3A` (fascia marquee, stato attivo, data) |
| Display | Big Shoulders Display 800–900, maiuscolo |
| Testo | Hanken Grotesk 400–700 |
| Movimento previsto | righe che scorrono in direzioni opposte con lo scroll, foto che si muove dentro le lettere, marquee legato alla velocità |

## Token comuni (validi per entrambe)
- Spaziature: gutter `clamp(16px, 4vw, 56px)`, sezioni `clamp(72px, 12vw, 160px)`.
- Easing: `expo.out` per i reveal, `power3.inOut` per le transizioni di pagina, `none` per gli scrub.
- Durate: micro 0,2 s, reveal 0,9–1,2 s, transizione pagina 0,8 s, intro ≤ 2 s.
- Grana: SVG `feTurbulence` a opacità 6–7%, animata a scatti (8 fps) per non pesare.
