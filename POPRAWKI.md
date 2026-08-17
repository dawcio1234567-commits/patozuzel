# PATO-ŻUŻEL — 8 poprawek: co było zepsute i co dokładnie zmieniłem

Wszystkie trzy pliki są kompletne i podmienne 1:1. Poniżej dla każdego punktu: **diagnoza** (dlaczego nie działało) i **miejsce zmiany**.

---

## 1. Niedziałające skutki zdarzeń (walkowery / transfery)

Zweryfikowałem wszystkie flagi ustawiane w `data.js`. Wynik audytu:

| flaga | stan przed | co zrobiłem |
|---|---|---|
| `G.S.walkower` | **ZEPSUTA** — powodowała tylko tyle, że Gracz dostawał w jednej kolejce status „WALKOWER" i nie jechał. Mecz rozgrywał się normalnie, wchodził do tabeli z prawdziwym wynikiem, a rywal zdobywał punkty na torze. Tekst zdarzenia mówił „0:75", tabela pokazywała np. 44:46. | realny walkower (niżej) |
| `G.S.teamPts` | działała (przekazywana jako `ptsPen` do `simSeasonChrono`), ale przy walkowerze obustronnym karę dostawała **tylko twoja drużyna**, choć event pisał „obie drużyny tracą po punkcie" | kara dla obu stron przez `S.walkPen` |
| `G.p.next.forceClub` | **ZEPSUTA** — konsumuje ją wyłącznie `makeOffers()`, a `nextYear()` wołało ekran ofert tylko gdy `contract.years<=0`. Przy umowie na 2–3 lata skutek zdarzenia (świstek, kask juniora, wejście na lewo dla dziadka, Słowacja, diamenty, kuszenie przez rywala, mycie pancerzy) **przepadał bezpowrotnie** | wymuszony transfer zrywa umowę |
| `G.p.next.noArg` | **MARTWA** — ustawiana w evencie „sprzedaję Argentyńcowi oklejony złom", ale nigdy nigdzie nie czytana | podpięta pod warunek zimowej Argentyny (pkt 3) |
| `fxEnd(...)` | **ZEPSUTA** — ustawiała `p.retired=true`, ale **nikt tego nie sprawdzał**. Po katastrofie awionetki, urazie kręgosłupa na crossie czy „gigantycznym przypale" gracz spokojnie jechał dalej | `nextYear()` sprawdza `p.retired` na wejściu |
| pozostałe (`noEarnings`, `zeroMatches`, `banMatches`, `teamOvr`, `ovrBonus`, `heatPP`, `injuryPP`, `extraDefP`, `equipFit`, `rateMul`, `betterOffers`, `rowPen`, `noSponsor`, `lockTransfer`, `banSeasons`, `forcedEnd`) | działały poprawnie | bez zmian |

### Walkower — nowa mechanika

`data.js` — nowy helper zamiast surowego `G.S.walkower=true`:

```js
const fxWalk = (mode, pen) => {          // 'lose' | 'win' | 'both' | 'void'
 G.S.walkower = true; G.S.walkMode = mode || 'lose'; G.S.walkPen = pen || 0;
 ...
};
```

Podmienione w eventach: `przyczepny` → `fxWalk('lose',0)`, `obchod` (opcja 3) → `fxWalk('both',1)`, `rzeszow` → `fxWalk('lose',0)`, `rozdzielnia` → `fxWalk('void',0)`, `spoznienie` (obie opcje) → `fxWalk('lose',0)`, `swistek` → `fxWalk('both',1)`. Z `obchod` i `swistek` usunąłem ręczne `G.S.teamPts-=1`, żeby kara nie liczyła się podwójnie.

`engine.js` — nowa funkcja `applyWalkover(box,h,a,myClub,rd)` + przechwycenie w `simSeasonChrono`:

```js
const mine = myClub && k===myLk && (h===myClub||a===myClub);
/* WALKOWER: to spotkanie w ogóle się nie odbywa — nie symulujemy go. */
if(mine && G.S && G.S.walkower && rd===G.S.walkRound){
  applyWalkover(st[k], h, a, myClub, rd);
  return;
}
```

Tryby: `lose` → 0:75 i 2 pkt dla rywala, `win` → 75:0, `both` → 0:0 i **nikt** nie dostaje punktów meczowych (+ po −1 pkt w tabeli), `void` → mecz nieweryfikowany (nie wchodzi do tabeli, klub ma 13 zamiast 14 spotkań). Wynik wchodzi też do dwumeczu (punkt bonusowy) i do `G.myLog`, więc w „WYNIKACH SPOTKAŃ" wiersz jest czerwony z adnotacją.

Świadomie **nie** ruszałem `simMeeting()` — walkower to decyzja o tym, czy mecz się odbywa, więc jego miejsce jest o poziom wyżej, w pętli kolejek.

### Wymuszony transfer

`index.html` — `nextYear()` rozbite na `nextYear()` + `afterWinter()`:

```js
if(p.next.forceClub && p.contract.years>0){ p.contract.years=0; p.forcedExit=true; }
if(p.contract.years<=0 || noRenew || p.next.forceClub){ _offers=[]; G.screen='sign'; render(); return; }
```

Na ekranie ofert wyświetla się czerwony boks „UMOWA ZERWANA — MUSISZ ZMIENIĆ KLUB". `makeRenewOffer()` zwraca `null`, gdy `forceClub` jest ustawiona (nie ma sensu proponować przedłużenia komuś, kto już wychodzi).

---

## 2. Punkt bonusowy dla przegranego

Potwierdzone. `makeSchedule()` buduje rewanż z **zamienionymi rolami**, więc w drugim meczu `f.h === a`, a wtedy:

```
g1 = f.hs + M.as   → dorobek klubu f.h, czyli GOŚCIA tego meczu (rowA)
```

czyli komentarz `// dorobek klubu h` był nieprawdziwy i punkt szedł do przegranego. Twoja propozycja (`g1>g2 → rowA`) jest w praktyce poprawna, ale zapisałem to jawnie po nazwach klubów — jest odporne również na przypadek, w którym oba mecze pary rozegrano u tego samego gospodarza:

```js
const g1 = f.h===h ? f.hs+M.hs : f.hs+M.as;    // dorobek klubu f.h w dwumeczu
const g2 = f.h===h ? f.as+M.as : f.as+M.hs;    // dorobek klubu f.a w dwumeczu
const rowFH = T.find(x=>x.name===f.h), rowFA = T.find(x=>x.name===f.a);
if(rowFH && rowFA){
  if(g1>g2){ rowFH.pts++; rowFH.bon++; }
  else if(g2>g1){ rowFA.pts++; rowFA.bon++; }
}
```

Test: przy wymuszonym wyniku „klub pierwszy alfabetycznie wygrywa 60:30 w każdym meczu" wszystkie 8 klubów ma dokładnie tyle bonusów, ile wygranych dwumeczów (suma = 28 par). Przy remisowych dwumeczach suma bonusów = 0.

---

## 3. Zdarzenia międzysezonowe + rozbudowana Argentyna

**Nowa pula** `WINTER_EVENTS` w `data.js` (osobna od `EVENTS`), odpalana wyłącznie w przerwie zimowej — **między `resolveSeason()` a `makeOffers()`**:

```
podsumowanie → nextYear() → ageRiders + sponsorzy + retireCheck
            → [62% szans] ekran 'winter' → chooseWev() → skutki + OK
            → afterWinter() → oferty / przedłużenie / hub
```

Silnik: `rollWinterEvent()`, `winterCtx()`, `applyWinterChoice()` (podstawia atrapę `G.S`, żeby ewentualne użycie `fxA/fxT/fxI` zimą nie wysypało gry). UI: `scWinter()`, `chooseWev()` — dwuetapowy ekran (wybór → skutki → „OK, IDĘ DO OFERT"). W puli obok Argentyny są jeszcze: zgrupowanie w Almerii, zima w warsztacie vs Weranda, menedżer przed okienkiem, zimowa operacja ortopedyczna i list z sądu rodzinnego (tylko gdy płacisz alimenty).

`argentyna_im` **przeniesiony** z `EVENTS` do `WINTER_EVENTS`. Zachowane wszystkie stare efekty (30% mistrz Argentyny +3 OVR i nagrody / 40% zgubiona skrzynia −20 sprzętu / 30% upadek), warunek zmieniony na `p.ovr>=45 && p.ovr<=75 && !p.next.noArg` (sztuczne `S.round<=5` już niepotrzebne), a `fxI(25)` zamienione na `fxIN(25)` — zimą nie ma sezonu, więc ryzyko urazu musi lecieć na **kolejny** rok.

**Twarde 10% na wpadkę**, losowane niezależnie od wyniku sportowego (możesz wrócić jako mistrz Argentyny i z alimentami):

```js
if(chance(10)){
  l.push('Valentina z Mar del Plata. Trzy tygodnie, jedno asado i telefon w lipcu: będzie dziecko.',
         fxAlimony(), fxM(6), fxP(-6));
}
```

**Alimenty:** `ECON.alimony = 45000`, `ECON.alimonyYrs = 18`, `fxAlimony()` ustawia `p.alimony = 18`. Pobór w jednym miejscu — `chargeAlimony(p)` w `engine.js` — wołany z `resolveSeason()` (a także z `skipYear()` i `mechanicPath()`, bo sąd nie robi przerwy na rok bez kontraktu). W raporcie finansowym (`settleHtml`) osobny wiersz na czerwonym tle:

> **Alimenty do Argentyny** (pozostało rat: 17) &nbsp;&nbsp; **−45 000 zł**

Kwota wchodzi do „BILANSU ROKU", pojawia się w ostrzeżeniach przed sezonem, na ekranie mechanika i w podsumowaniu kariery. Zmierzone na 4000 losowaniach: 9,6% wpadek.

---

## 4. Bardzo długie kontuzje

`data.js` → `INJ`: `catP: 7` (% **urazów**, nie sezonów), `catDmgMin/Max: 5..11`, `catSeasons: 1`.

Dwie drogi do zerwania więzadeł / złamania udu:

**A) pech na torze** — `playerRoundStatus()` ma teraz trzy poziomy urazu:

```js
const cat = chance(INJ.catP);
if(cat){
  S.injCatWhy  = pick(CAT_INJ);              // 4 warianty opisu
  S.injTotal   = Math.max(1, BAL.rounds-rd); // reszta sezonu
  S.injDmg     = R(INJ.catDmgMin, INJ.catDmgMax);
  S.forcedEnd  = true;                       // play-off, DMPJ, IMP — wszystko odpada
  p.longInjury = Math.max(p.longInjury||0, INJ.catSeasons);
}
```

**B) zdarzenia patologiczne** — nowy helper `fxLongInj(opis)` wpięty w: `cross` (7%), `qubus` (35% z gałęzi „widzisz klamkę"), `przerwanie` (12% — stanie na torze przy pracujących silnikach), `rempala` (10% — duch nie mówił o hamowaniu), `obojczyk` (14% — jazda na zastrzykach).

Konsumpcja: `startSeason()` czyta `S.longInjury = p.longInjury>0`, `playerRoundStatus()` zwraca `'KONTUZJA DŁUGOTERMINOWA — CAŁY SEZON'` w każdej kolejce (0 meczów, 0 biegów), `canRidePO` i `blocked` wykluczają play-off/DMPJ/turnieje, a licznik schodzi w `resolveSeason()` — **z zabezpieczeniem**, żeby świeżo złapany uraz nie skasował się w tym samym sezonie:

```js
if(S.longInjury && !S.longInjuryNew) p.longInjury = Math.max(0,(p.longInjury||0)-1);
```

**UI na czerwono:** nowa plansza `longInjuryHtml(r)` na ekranie podsumowania (ramka `border-2 border-red-700`, migający nagłówek, wypunktowane konsekwencje w tym „KOLEJNY SEZON MASZ Z GŁOWY") + `longInjuryWarnHtml()` na ekranie hubu i ofert + zaktualizowany kafelek „RYZYKO KONTUZJI" w prognozie.

---

## 5. Eksport karty statystyk (html2canvas)

Cztery realne przyczyny, dla których nic się nie pobierało:

1. `#smCardWrap` stoi na `position:fixed; left:-14000px`. html2canvas klonuje **realny** dokument i liczy pozycje z `getBoundingClientRect()` — element 14 000 px poza ekranem daje pusty albo obcięty obrazek. Poprawianie tego w `onclone` jest zawodne: rozmiary bierze się z **oryginału** jeszcze przed klonowaniem.
2. `el.offsetHeight` przy ujemnym `z-index` i długiej tabeli bywa mniejsze niż `scrollHeight` → ucięta karta.
3. `scale:2` przy karcie 1240 px i kilkunastu sezonach przekraczało limit powierzchni canvasa (Safari/iOS) → `toDataURL()` zwracał pusty ciąg, który stary kod i tak wstawiał jako `href` → „pobrany" plik 0 bajtów.
4. Brak obsługi błędu: `alert('...'+e)` pokazywał surowy obiekt, a przy wyjątku **przed** wejściem w Promise przycisk zostawał zablokowany na zawsze.

Nowa wersja: wyciąga kontener na `position:absolute; left:0; top:0` na czas zrzutu (i **zawsze** odkłada z powrotem w `finally`), czeka na layout (2× `requestAnimationFrame`) i na `document.fonts.ready`, liczy realne `scrollWidth/scrollHeight`, dobiera `scale` do limitu `PNG_MAX_PX`, usuwa klasę `.blink` w klonie, a zapis idzie kaskadą: **`toBlob` + ObjectURL → `toDataURL` → otwarcie karty w nowym oknie** do zrzutu/„drukuj do PDF". Wszystko w `try/catch/finally` z komunikatem po polsku, który mówi, co się stało.

Przetestowane w prawdziwym Chromium: pobrany plik **2480 × 2012 px, ~1 MB, poprawny nagłówek PNG**, kontener wraca na `left:-14000px`, przycisk odblokowany. Ścieżka błędu (zablokowany CDN) daje jeden czytelny alert i otwiera kartę w nowej zakładce.

---

## 6. Sponsorzy tytularni

`data.js`: `SPONSORS_A` (35 nazw — puste wpisy z Twojej listy pominąłem), `SPONSORS_B` (31 nazw) i konfiguracja `SPON` z jednym pokrętłem na każdy parametr. `BANKRUPTCY.onSponsorRun = 75`.

Model danych: `c.titles = [{n, grp:'A'|'B', years, left, cash}]` + `c.base` (nazwa bez sponsorów). Pełna nazwa = sponsorzy doklejeni **przed** bazą → `"Złomrex MojeKajmany META Gniezno"`.

`engine.js` — `sponsorSeason(c,k,log)` wołane z `clubEconomy()`:

* **Grupa A** — mały przelew *co sezon* (1–4,5% rocznych wpływów ligi), zero ryzyka.
* **Grupa B** — potężne wejście (55–135% rocznych wpływów ligi), `left = R(1,2)` sezonów, potem **ucieczka**: dziura w kasie nie mniejsza niż potrzebna, żeby zejść pod próg `BANKRUPTCY.deepMinus` (bogaty klub nie może wchłonąć afery bez mrugnięcia okiem), +35% tej kwoty jako zaległości wobec kadry, i `chance(75)` na syndyka. Firma ląduje w `G.bannedSponsors` i `freeSponsors()` **nigdy** jej już nie wylosuje.
* **Kara za słup ogłoszeniowy** — `SPON.ovrPen = [0,0,-2,-5]`, naliczana jako **różnica** przy zmianie liczby sponsorów (nie co roku od nowa), przez `applySquadOvr`.
* Wszystko raportowane w „CO SIĘ STAŁO W KLUBACH PO SEZONIE": `NOWY SPONSOR TYTULARNY`, `WIELKI SPONSOR TYTULARNY — KASA JAK Z BAJKI`, `SPONSOR TYTULARNY UCIEKŁ Z KASĄ`, `SZATNIA O KOLEJNYM SPONSORZE`.

**Kluczowa decyzja projektowa:** samą **zmianę nazwy** odkładam do nowego roku (`applyPendingSponsors()` w `nextYear`/`skipYear`/`mechanicPath`). Gdyby klub zmienił nazwę w trakcie rozliczania sezonu, `promotionsRelegations()` i `G.phase[k].order` (trzymające **stringi**, nie referencje) przestałyby się zgadzać i klub wypadłby z awansów i spadków. `renameClub()` przepisuje przy tym `r.club` całej kadry i `G.p.club`. Na podsumowaniu sezonu jest osobna sekcja „ZMIANY NAZW KLUBÓW OD SEZONU X". Upadłość czyści listę sponsorów — nowy byt prawny wchodzi do KLŻ z czystym szyldem.

**Blokada dla profesjonalistów** w `makeOffers()`:

```js
if(p.prof>SPON.profBlock && titleCount(c)>=SPON.profBlockFrom){
  if(isOld) oldMiss={code:'billboard', titles:titleCount(c)};
  return;
}
```

Do tego nowy powód odmowy w `renewRejection()` (kod `billboard`), filtr w „kole ratunkowym" z dna KLŻ, blokada w `makeRenewOffer()` i badge przy ofercie: *„SŁUP OGŁOSZENIOWY: 3 sponsorów tytularnych (…) — bazowy OVR klubu obniżony o 5 pkt"*.

Balans po 40 sezonach: 0 sponsorów 22–26% klubów, 1 → 28–32%, 2 → 29–34%, 3 → 12–17%. Afera z Grupy B raz na ~3 sezony w całej lidze; upadłości rosną z ~0,1 do ~0,25 na sezon. Jedno pokrętło do korekty: `SPON.bChance` (obecnie 5).

---

## 7. Ścieżka „Zostań mechanikiem"

**Widoczność przycisku:** boks „DRUGA DROGA: PARK MASZYN" wyciągnąłem do funkcji `mechanicBox(reason)` i pokazuję go również wtedy, gdy oferty są, ale wszystkie z najniższej ligi:

```js
const onlyKL = offers.every(o=>o.lk==='KL');
```

Wariant „klz" ma dodatkowe zdanie: *„WSZYSTKIE OFERTY, JAKIE MASZ, SĄ Z KRAJOWEJ LIGI ŻUŻLOWEJ. Nie musisz tego brać."*

**Dedykowany ekran wyniku:** `mechanicPath()` nie rzuca już gracza z powrotem na kontrakty. Buduje obiekt `G.mech` (nagłówek, wprowadzenie, tabela zmian przed→po, pensja, koszty życia, alimenty) i przechodzi na nowy ekran `'mech'` → `scMech()`:

* 5% — **ZROZUMIAŁEŚ ŻUŻEL U NICKIEGO**: OVR 52 → 62 (+10), sprzęt 41 → 99, profesjonalizm +6, medialność → 0
* 95% — **MYŁEŚ PANCERZE W KLŻ**: OVR −4, profesjonalizm −10, sprzęt −6, kontrakt tylko w KLŻ

Ewentualny wyrok o końcu kariery (wiek albo trzeci rok poza torem) jest **odłożony** i pokazany na tym samym ekranie w czerwonej ramce — gracz najpierw widzi wynik roku w warsztacie, a dopiero po kliknięciu `mechContinue()` przechodzi dalej (na oferty albo na ekran końca).

---

## 8. Brakujące info o upadłości klubu

Diagnoza: `G.bankrupts` **przepływa poprawnie** (ustawiane w `promotionsRelegations()`, snapshot idzie do `res.bankruptsAll`). Zepsuty był render — `bankruptcyBoardHtml()` było wołane **wyłącznie** z `playoffHtml()`, czyli widoczne tylko po przejściu na zakładkę PLAY-OFF. Na głównym ekranie `scSummary` informacji o zmianie nazwy po bankructwie nie było wcale.

Dodatkowo funkcja czytała **żywe** `G.bankrupts`, które w kolejnym roku jest nadpisywane — przy powrocie do widoku plansza pokazywała dane z niewłaściwego sezonu.

```js
function bankruptcyBoardHtml(r){
  const B=(r&&r.bankruptsAll)||G.bankrupts||[], GT=(r&&r.greenTable)||G.greenTable||[];
  ...
}
```

Wołane teraz z `scSummary()` (główna zakładka, obok `bankruptHtml(r)`) **i** z `playoffHtml()`, w obu miejscach z `G.last`, z datą sezonu w nagłówku. Obok doszła sekcja `sponsorRenameHtml()` ze zmianami nazw od sponsorów.

---

## Weryfikacja

* **90 testów celowanych** (po jednym–kilkunastu na każdy punkt) — wszystkie przechodzą, stabilnie w 15 kolejnych uruchomieniach.
* **60 pełnych karier / 1108 sezonów** headless — zero wyjątków; wszystkie nowe mechaniki odpalają się w realnej grze (walkowery w 3 trybach, 26 zerwanych więzadeł, 19 sezonów w gipsie, alimenty, 234 sponsorów z Grupy B, 206 ucieczek, 3 kluby z 3 sponsorami, 12 upadłości klubu Gracza, 93 wymuszone transfery).
* **Prawdziwe Chromium** (Playwright): przeklikanie kariery realnymi przyciskami DOM włącznie z nowymi ekranami zimowym i mechanika, render wszystkich zakładek podsumowania, oraz faktyczne pobranie PNG (2480×2012, poprawny plik).

### Jedna obserwacja poza zakresem

Przy podpisywaniu zawsze najmocniejszego klubu **53% sezonów kończy się zerową liczbą meczów** (w Ekstralidze nawet 85%) — gracz siedzi na ławce całymi latami. Sprawdziłem to na Twojej **oryginalnej** wersji: 53,5%, czyli identycznie. To nie regresja, ale jeśli uznasz, że seria 13–15 sezonów bez ani jednego biegu psuje grę, warto by klub, w którym gracz nie odjechał ani jednego meczu, rzadziej przedłużał umowę albo żeby `appearanceChance` mocniej odstraszało od ofert z góry tabeli.
