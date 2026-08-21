# PATCH: ZWIĄZEK ZAWODOWY (SZZZ) + CEGIELSKI

## Co wgrać
| plik | status |
|---|---|
| `data/41-zdarzenia-zwiazek.js` | NOWY |
| `data/42-zima-zwiazek.js` | NOWY |
| `engine/34-zwiazek-cegla.js` | NOWY |
| `ui/23-zwiazek-cegla.js` | NOWY |
| `index.html` | PODMIENIONY (4 nowe `<script>`) |

Sklejka `data/40-zdarzenia-index.js` **nie wymaga zmian** — obie nowe pule
dopisują się na koniec `EVENTS` / `WINTER_EVENTS` przez `push`, czyli
dokładnie tam, gdzie każe zasada 3 z MODULY.md. Dlatego `data/41` i `data/42`
muszą ładować się PO `data/40-zdarzenia-index.js` (tak są wpięte w index.html).

## Nowe flagi na graczu
- `p.hasSZZZ` — szef związku zawodowego żużlowców.
- `p.ceglaLvl` — poziom Cegielskiego, **bez sufitu**.

Obie dokładane są w `newPlayer()` przez wrapper w `engine/34`, a stare zapisy
dostają je leniwie przez `szzzEnsure(p)`. Warunki i tak czytają `(p.ceglaLvl||0)`.

## Nowe mechaniki systemowe
1. **Ryczałt SZZZ +50 000 zł co sezon** — dopisywany w opakowanym `startSeason()`,
   z wpisem do `G.szzzLog` i `G.S.szzzPay`. Widać go w boksie
   „ZWIĄZEK ZAWODOWY I CEGIELSKI".
2. **KSM po wyroku UOKiK** — `G.ksmMul` mnoży stawkę w opakowanym `offerRate()`,
   więc podwyżka wchodzi do **każdej przyszłej oferty**, nie tylko do bieżącego
   kontraktu (ten dostaje ×1,25 od razu, razem z premią za podpis).
3. **`p.next.forceClub='rival'`** — silnik tego nie znał. Wrapper na `makeOffers()`
   tłumaczy `'rival'` na konkretną nazwę klubu z TEJ SAMEJ ligi, o poziomie
   zbliżonym do twojego (`szzzRivalClub()`).
4. **Nowe helpery**: `fxMech(d)` (nie było niczego na `p.mech`) oraz zimowe
   `fxDefN(d)` i `fxTN(d)` — odkładane na `p.next` i konsumowane przy starcie
   kolejnego sezonu.

## Jedno miejsce do domknięcia
Boks pokazuje się na pewno w HUB-ie (wrapper na `playerStrip()` z `ui/04`).
Wrapper „na podsumowanie sezonu" szuka funkcji ekranu raportu po nazwie
(`scSum`, `scSummary`, `scReport`, `scSeason`…) i wpina się w pierwszą znalezioną.
Jeżeli w `ui/10-podsumowanie.js` nazywa się inaczej, boks po prostu nie pojawi się
w raporcie — **nic się nie wywali**. Podeślij `ui/10-podsumowanie.js`, to wepnę
rubrykę na sztywno, tam gdzie ma być.
