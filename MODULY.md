# PATO-ŻUŻEL — mapa modułów

Gra jest pocięta na **94 małe pliki** (~880 KB razem) zamiast trzech wielkich.
Sens jest jeden: **żeby update nie kosztował przeczytania całej gry**.

Zamiast podsyłać `data.js` (284 KB) po to, żeby dopisać jedno zdarzenie losowe, podsyłasz
jeden plik po 8–14 KB. To jest różnica rzędu **20×** w zużyciu na prompt.

> **Zasada nadrzędna:** podeślij **najmniejszy zestaw plików, w którym mieści się zmiana**.
> Jak nie wiesz który — podeślij ten plik i MODULY.md, resztę dopytam.

---

## Jak to jest poukładane

```
gra/
  index.html        ← tylko HTML, CSS i lista <script src="...">
  MODULY.md         ← ten plik
  data/             ← dane: balans, zdarzenia, teksty, nazwiska
  engine/           ← logika symulacji, nie dotyka DOM-u
  ui/               ← ekrany i renderowanie HTML
  test/smoke.js     ← test regresji (opis na dole)
```

> **Po Sprincie 2 doszedł jeden plik:** `engine/29b-live-kolizje.js`.
> Trzeba mu dopisać `<script>` w `index.html`, **między 29 a 30**:
> ```html
> <script src="engine/29-live-bieg.js"></script>
> <script src="engine/29b-live-kolizje.js"></script>   <!-- NOWE -->
> <script src="engine/30-live-park-maszyn.js"></script>
> ```

> **Po Sprincie 3 doszły dwa pliki:** `engine/12b-pola-i-rezerwy.js` i `ui/09b-live-trener.js`
> (plus `test/sprint3.js`, który nie wchodzi do `index.html`). Trzeba im dopisać `<script>`:
> ```html
> <script src="engine/12-mecz-ligowy.js"></script>
> <script src="engine/12b-pola-i-rezerwy.js"></script>   <!-- NOWE -->
> <script src="engine/13-ekonomia-w-sezonie.js"></script>
> ...
> <script src="ui/09-ekran-live.js"></script>
> <script src="ui/09b-live-trener.js"></script>          <!-- NOWE -->
> ```

> **Po Sprincie 4 doszło pięć plików:** `engine/28b-sprzet-live.js`,
> `engine/30b-live-zdarzenia.js`, `data/71-mecz-zdarzenia.js`,
> `data/72-glosy-pomeczowe.js` i `ui/09c-warsztat-live.js`.
> Każdy potrzebuje `<script>` w `index.html`, **dokładnie w tych miejscach**:
> ```html
> <script src="data/70-wielki-mecz.js"></script>
> <script src="data/71-mecz-zdarzenia.js"></script>      <!-- NOWE -->
> <script src="data/72-glosy-pomeczowe.js"></script>     <!-- NOWE -->
> ...
> <script src="engine/28-wielki-mecz.js"></script>
> <script src="engine/28b-sprzet-live.js"></script>      <!-- NOWE -->
> <script src="engine/29-live-bieg.js"></script>
> ...
> <script src="engine/30-live-park-maszyn.js"></script>
> <script src="engine/30b-live-zdarzenia.js"></script>   <!-- NOWE -->
> <script src="engine/31-live-mecz.js"></script>
> ...
> <script src="ui/09b-live-trener.js"></script>
> <script src="ui/09c-warsztat-live.js"></script>        <!-- NOWE -->
> ```
> Do `index.html` doszły też dwie klasy CSS: `.pulse-hot` i `.pulse-txt` (pulsujący
> boks warsztatu), razem z `@media (prefers-reduced-motion:reduce)`.

Wszystko to **zwykłe skrypty globalne**, bez `import`/`export` — dokładnie tak jak było.
Kolejność ładowania w `index.html` **ma znaczenie** i idzie po numerkach w nazwach:
`data/` → `engine/` → `ui/`, a `boot` (`G=newGame(); render();`) jest na końcu `index.html`.

Pliki `*-index.js` to **sklejki**: budują `EVENTS`, `WINTER_EVENTS`, `TALK` i `CHANGELOG`
z mniejszych pul. Ładują się PO tych pulach.

---

## PRZEPISY: co podesłać, żeby zmienić…

### ⭐ Zdarzenia losowe w sezonie (to robimy najczęściej)

| chcę | podeślij |
|---|---|
| dopisać / poprawić zdarzenie o mediach, hejcie, portalach | `data/10-zdarzenia-media.js` |
| …o torze, sędziach, szatni | `data/11-zdarzenia-tor.js` |
| …o imprezach, kobietach, życiu poza torem | `data/12-zdarzenia-zycie.js` |
| …o kasie, prezesie, zaległościach | `data/13-zdarzenia-kasa.js` |
| …o sprzęcie, mechaniku, tunerze | `data/14-zdarzenia-sprzet.js` |
| …o kontuzjach, zdrowiu, dopingu | `data/15-zdarzenia-zdrowie.js` |
| …o wielkim meczu, turnieju, presji | `data/16-zdarzenia-mecze.js` |
| …o kuszeniu przez inny klub / transferze w trakcie sezonu | `data/17-zdarzenia-transfery.js` |
| …o sędziach, wyspach, deweloperach | `data/18-zdarzenia-patologie.js` |
| …z setu „Messengera” | `data/19-zdarzenia-messenger.js` |
| …dla zawodnika leżącego w gipsie | `data/20-zdarzenia-kontuzjowany.js` |

**Nie wiesz, w której puli siedzi zdarzenie?** Podaj jego `id` albo tytuł — znajdę po nazwie
pliku, bez czytania wszystkich. Albo podeślij sam `MODULY.md` i tytuł zdarzenia.

**Potrzebujesz efektu, którego jeszcze nie ma** (np. „zabierz 3 punkty w tabeli na kolejny sezon”)?
Dorzuć **`data/06-efekty-fx.js`** — tam mieszkają wszystkie `fx*`.

**Chcesz, żeby zdarzenie wypadało tylko w konkretnej sytuacji** (`cond`) albo zmienić częstotliwość?
Dorzuć **`engine/07-losowanie-zdarzen.js`**.

**Zakładasz zupełnie nową pulę tematyczną?** Wtedy trzeba trzech rzeczy:
`data/40-zdarzenia-index.js` (dopisanie do `concat`), `index.html` (nowy `<script>`)
i sam nowy plik. Powiedz tylko, jak ma się nazywać — resztę dopiszę.

### ⭐ Zdarzenia w przerwie zimowej

| chcę | podeślij |
|---|---|
| Argentyna, zgrupowania, operacja, alimenty | `data/30-zima-podstawa.js` |
| bale, freak fighty, tatuaże, sylwester | `data/31-zima-patologie.js` |
| plebiscyty, dorabianie, trening na lodzie | `data/32-zima-poza-torem.js` |
| sytuacje wyłącznie zimowe (przeniesione z lata) | `data/33-zima-z-puli-letniej.js` |
| zimowe wersje zdarzeń letnich | `data/34-zima-uniwersalne.js` |
| zimowy set „Messengera” | `data/35-zima-messenger.js` |
| zima w gipsie | `data/36-zima-kontuzjowany.js` |
| **ekran** przerwy zimowej / trybunał PZM | `ui/18-przejscie-roku.js` |

> Pamiętaj o zasadzie z komentarza w kodzie: **zimą nie ma sezonu**, więc nie używamy tam
> `fxA`, `fxT`, `fxOB`, `fxH`, `fxI`, `fxBan`. Zamiast nich `fxHN`, `fxIN`, `fxRateN`, `p.next.*`.

### Balans i liczby

| chcę | podeślij |
|---|---|
| przekręcić ryzyko kontuzji, koszty życia, wiek emerytalny, wagi oceny sezonu | `data/04-balans.js` |
| zmienić, jak liczy się ocena sezonu w praktyce | `data/04-balans.js` + `engine/11-ocena-sezonu.js` |
| zmienić rozwój OVR po sezonie (w tym wpływ trenera) | `engine/09-sezon-przebieg.js` (uwaga: 47 KB) |
| zmienić szansę wejścia do składu (liczy też sympatię trenera) | `engine/04-szansa-na-sklad.js` |
| zmienić poziom trudności między ligami | `data/04-balans.js` (`BAL`) + `engine/02-ovr-i-balans.js` |

### Kluby, ligi, sponsorzy, kadry

| chcę | podeślij |
|---|---|
| dodać / usunąć / przenieść klub, zmienić OVR i budżety | `data/05-klasy-kluby-sprzet.js` |
| dorzucić sponsora tytularnego albo zmienić progi upadłości | `data/50-upadlosci-sponsorzy.js` |
| zmienić mechanikę sponsorów i gospodarki klubów | `engine/16-kluby-po-sezonie.js` |
| zmienić awanse / spadki / zielony stolik | `engine/25-upadlosci-awanse.js` |
| zmienić generowanie zawodników i starzenie kadr | `engine/19-zawodnicy-kadry.js` |
| dodać typ trenera, zmienić jego sympatie, progi statusów, presję | `data/05-klasy-kluby-sprzet.js` (`COACH_TYPES`, `COACHB`) |
| zmienić mechanikę trenerów: sympatia, presja, rozwój OVR, zwolnienia | `engine/19-zawodnicy-kadry.js` |
| zmienić limity rezerwy zwykłej/taktycznej i próg -6 pkt | `data/05-klasy-kluby-sprzet.js` (`RESB`) |
| dorzucić imiona i nazwiska | `data/51-nazwiska.js` |
| dodać nową klasę postaci albo tunera / mechanika | `data/05-klasy-kluby-sprzet.js` |

### Mecz, liga, play-off

| chcę | podeślij |
|---|---|
| zmienić przebieg biegu / meczu ligowego, punkty bonusowe, rezerwę taktyczną | `engine/12-mecz-ligowy.js` |
| zmienić układ pól startowych, kaski, logikę par pod taśmą | `engine/12b-pola-i-rezerwy.js` (`gateOrder`) |
| zmienić, kogo trener zdejmuje w meczu na żywo i za co odmawia | `engine/31-live-mecz.js` + `data/05-klasy-kluby-sprzet.js` (`RESB.burdel`) |
| zmienić liczbę kolejek, terminarz, walkowery | `engine/14-terminarz-i-kolejki.js` + `engine/15-liga-chronologia.js` |
| zmienić play-off / play-down | `engine/17-playoff.js` |
| zmienić DMPJ | `engine/18-dmpj.js` |
| zmienić wypłaty i bunty płacowe w trakcie sezonu | `engine/13-ekonomia-w-sezonie.js` |

### Turnieje indywidualne i świat

| chcę | podeślij |
|---|---|
| IMP, MIMP, Kaski, szkoleniowe, Puchar PALET | `engine/22-turnieje-polskie.js` |
| format turnieju 20-biegowego (wspólny dla wszystkich) | `engine/21-turnieje-baza.js` |
| Grand Prix: skład cyklu, punktacja rundy | `engine/23-ims-cykl.js` + `data/52-swiat-ims.js` |
| eliminacje, Challenge, Mistrzostwa Europy | `engine/24-ims-eliminacje.js` |
| IMŚJ2 i eliminacje juniorskie | `engine/33-imsj2-eliminacje.js` |
| zawodnicy zagraniczni, ranking światowy | `engine/20-swiat.js` |
| **widok** tych rozgrywek w raporcie | `ui/14-widok-ims.js`, `ui/16-widok-turniejow.js` |

### Wielki mecz i jazda na żywo

| chcę | podeślij |
|---|---|
| zmienić teksty toru, opisy zębatek, kwoty kartek i kar | `data/70-wielki-mecz.js` |
| zmienić, KTÓRY mecz jest „tym meczem” + ekran wyboru | `engine/28-wielki-mecz.js` |
| zmienić mechanikę pojedynczego biegu na żywo | `engine/29-live-bieg.js` |
| przekręcić **nożyce** albo **AJS SPIDŁEJ** (szanse, skutki) | `engine/29-live-bieg.js` (`liveMoveChance`, `liveResolveMove`) + `data/70-wielki-mecz.js` (`BIGM.moves` — teksty) |
| zmienić pogodę, dobór **dyszy i gaźnika**, długość, zapłon | `engine/28b-sprzet-live.js` (`SETUPB`, `liveIdealJet`, `liveIdealCarb`) |
| przekręcić **ryzyko „dwóch minut"** po zmianie sprzętu | `engine/28b-sprzet-live.js` (`SETUPB.lateMin` / `lateMax`, `liveSetupRisk`) |
| poprawić **wygląd warsztatu live** (suwaki, pulsowanie) | `ui/09c-warsztat-live.js` + `index.html` (klasa `.pulse-hot`) |
| dopisać / zmienić **zdarzenie w trakcie meczu** | `data/71-mecz-zdarzenia.js` (`LIVE_EVENTS`) |
| zmienić częstotliwość zdarzeń i wywiadów | `engine/30b-live-zdarzenia.js` (stała `SIDE`) albo `data/70-wielki-mecz.js` (`BIGM.side` nadpisuje) |
| dopisać **pytanie do wywiadu** (przed / w trakcie / po) | `data/71-mecz-zdarzenia.js` (`LIVE_ITW.q`) |
| dopisać **pato-komentarz pomeczowy** | `data/72-glosy-pomeczowe.js` (`LIVE_TALK`) |
| zmienić, KTÓRE komentarze wypadają po jakim meczu | `engine/30b-live-zdarzenia.js` (`bigMatchVoices`) |
| zmienić kolizje, kontuzjowanie rywali, bury, powtórki biegu, modal po upadku | `engine/29b-live-kolizje.js` (+ `ui/09-ekran-live.js`, jeśli dochodzi przycisk) |
| przekręcić procenty kolizji / symulowania / Rejtana | `engine/29b-live-kolizje.js` (stała `COLL`) albo `data/70-wielki-mecz.js` (`BIGM.coll` nadpisuje) |
| dodać nową akcję w parku maszyn | `engine/30-live-park-maszyn.js` + `ui/09-ekran-live.js` |
| przekręcić protesty, próg 8/12 biegów i szanse na odwołanie meczu | `engine/30-live-park-maszyn.js` (stała `ABANDON`) albo `data/70-wielki-mecz.js` (`BIGM.abandon` nadpisuje) |
| zmienić, co się dzieje z meczem anulowanym i kiedy jedzie powtórka | `engine/15-liga-chronologia.js` |
| zmienić przebieg meczu drużynowego na żywo | `engine/31-live-mecz.js` |
| zmienić przebieg turnieju na żywo | `engine/32-live-turniej.js` |
| poprawić sam wygląd ekranu jazdy | `ui/09-ekran-live.js` |

### Kontrakty i rynek

| chcę | podeślij |
|---|---|
| zmienić wartość rynkową, zainteresowanie klubów, stawkę za punkt | `engine/26-rynek-wartosc.js` |
| zmienić liczbę ofert, długość umów, premie za podpis | `engine/27-rynek-oferty.js` |
| zmienić powody braku przedłużenia | `engine/26-rynek-wartosc.js` (`renewRejection`) |
| poprawić **wygląd** ekranu ofert, boks trenera przy ofercie | `ui/02-ekran-ofert.js` |

### Interfejs

| chcę | podeślij |
|---|---|
| ekran tworzenia postaci, changelog na stronie | `ui/01-ekran-tworzenia.js` |
| hub między sezonami, podgląd kadry | `ui/04-ekran-hub.js` |
| warsztat, ostrzeżenia, prognoza kariery | `ui/05-ekran-warsztat.js` |
| raport sezonu: zakładki i kafelki | `ui/10-podsumowanie.js` |
| raport sezonu: rozliczenie z klubem, alerty, głosy | `ui/11-podsumowanie-boksy.js` |
| boks „TRENER I TWÓJ STATUS W ZESPOLE” w raporcie sezonu | `ui/11-podsumowanie-boksy.js` (`coachSeasonHtml`) |
| pasek trenera i alert regulaminowy na ekranie jazdy | `ui/09b-live-trener.js` (`liveCoachBar`, `liveRefuseBox`) |
| podgląd meczu bieg po biegu | `ui/12-podglad-meczu.js` |
| tabele lig i wyniki kolejek | `ui/15-tabele-i-wyniki.js` |
| karta kariery „SportoweMity.pl” (wygląd) | `ui/20-karta-kariery-html.js` |
| co się liczy do gabloty na karcie | `ui/19-karta-kariery-dane.js` |
| pobieranie karty do PNG | `ui/21-karta-kariery-png.js` |
| **CSS, kolory, czcionki, cała stylistyka** | `index.html` (style siedzą w `<head>`) |

### Teksty po sezonie („co mówią”)

| chcę | podeślij |
|---|---|
| głosy zależne od średniej (szatnia, kibic, trener, ekspert) | `data/60-glosy-oceny.js` |
| Ostafiński, mechanik, sędzia, kolega z pary | `data/61-glosy-media.js` |
| prezes, dziennikarz, księgowa, komornik, selekcjoner | `data/62-glosy-klub.js` |
| **dodać zupełnie nowy typ głosu** | odpowiedni plik + `engine/10-glosy-po-sezonie.js` |

### Patch i changelog

| chcę | podeślij |
|---|---|
| dopisać wpis o nowym patchu | `data/01-changelog-biezacy.js` + `data/00-meta.js` |
| przenieść stare wpisy do archiwum | dodatkowo `data/02-changelog-archiwum.js` |

---

## Pełna lista plików

### data/ — dane, teksty, balans

| plik | KB | co siedzi w środku |
|---|---:|---|
| `data/00-meta.js` | 1 | Data ostatniego patcha + profil X do zgłaszania bugów |
| `data/01-changelog-biezacy.js` | 13 | Wpis o NAJNOWSZYM patchu (tu dopisujesz) |
| `data/02-changelog-archiwum.js` | 24 | Starsze wpisy changeloga |
| `data/03-changelog-index.js` | 1 | Sklejka: CHANGELOG = nowy + archiwum |
| `data/04-balans.js` | 13 | Wszystkie gałki: kontuzje, ekonomia, ocena sezonu, wiek emerytalny |
| `data/05-klasy-kluby-sprzet.js` | 10 | Klasy postaci, kluby w 3 ligach, tunerzy, mechanicy, **TRENERZY** (`COACH_TYPES`, `COACHB`) i limity rezerw (`RESB`) |
| `data/06-efekty-fx.js` | 11 | Helpery fx* — z nich budujesz skutki opcji w zdarzeniach |
| `data/10-zdarzenia-media.js` | 9 | ZDARZENIA: media, internet, hejt, portale |
| `data/11-zdarzenia-tor.js` | 8 | ZDARZENIA: tor, sędziowie, szatnia |
| `data/12-zdarzenia-zycie.js` | 6 | ZDARZENIA: imprezy, kobiety, życie poza torem |
| `data/13-zdarzenia-kasa.js` | 11 | ZDARZENIA: pieniądze, klub, prezesi |
| `data/14-zdarzenia-sprzet.js` | 4 | ZDARZENIA: sprzęt, mechanicy, tunerzy |
| `data/15-zdarzenia-zdrowie.js` | 6 | ZDARZENIA: kontuzje, zdrowie, doping |
| `data/16-zdarzenia-mecze.js` | 13 | ZDARZENIA: wielkie mecze, turnieje, presja |
| `data/17-zdarzenia-transfery.js` | 12 | ZDARZENIA: kuszenie przez rywala, transfery w sezonie |
| `data/18-zdarzenia-patologie.js` | 9 | ZDARZENIA: sędziowie, wyspy, deweloperzy |
| `data/19-zdarzenia-messenger.js` | 14 | ZDARZENIA: set „z Messengera” |
| `data/20-zdarzenia-kontuzjowany.js` | 3 | ZDARZENIA: tylko dla zawodnika z długą kontuzją |
| `data/30-zima-podstawa.js` | 9 | ZIMA: Argentyna, zgrupowania, operacja, alimenty |
| `data/31-zima-patologie.js` | 8 | ZIMA: bale, freak fighty, tatuaże, sylwester |
| `data/32-zima-poza-torem.js` | 6 | ZIMA: plebiscyty, dorabianie, trening na lodzie |
| `data/33-zima-z-puli-letniej.js` | 5 | ZIMA: sytuacje wyłącznie zimowe (przeniesione z lata) |
| `data/34-zima-uniwersalne.js` | 5 | ZIMA: te same zdarzenia co latem, w wersji zimowej |
| `data/35-zima-messenger.js` | 3 | ZIMA: zimowy set „z Messengera” |
| `data/36-zima-kontuzjowany.js` | 2 | ZIMA: zima w gipsie |
| `data/40-zdarzenia-index.js` | 1 | Sklejka: EVENTS i WINTER_EVENTS z pul tematycznych |
| `data/50-upadlosci-sponsorzy.js` | 4 | Progi upadłości + pule sponsorów tytularnych |
| `data/51-nazwiska.js` | 10 | Imiona i nazwiska: polskie, zagraniczne, PALET, propozycje dla gracza |
| `data/52-swiat-ims.js` | 7 | SGP: format cyklu, punktacja, nagrody, limity krajowe |
| `data/60-glosy-oceny.js` | 19 | GŁOSY PO SEZONIE: szatnia, kibic, trener, ekspert (wg średniej) |
| `data/61-glosy-media.js` | 24 | GŁOSY PO SEZONIE: Ostafiński, mechanik, sędzia, kolega z pary |
| `data/62-glosy-klub.js` | 21 | GŁOSY PO SEZONIE: prezes, dziennikarz, księgowa, komornik |
| `data/63-glosy-index.js` | 1 | Sklejka: TALK |
| `data/70-wielki-mecz.js` | 7 | WIELKI MECZ: przyczepność, zębatki, **nożyce i AJS SPIDŁEJ**, kwoty kar, teksty spikera, `BIGM.side` |
| `data/71-mecz-zdarzenia.js` | 17 | ZDARZENIA W TRAKCIE MECZU (`LIVE_EVENTS`) i WYWIADY (`LIVE_ITW`) |
| `data/72-glosy-pomeczowe.js` | 11 | PATO-KOMENTARZE POMECZOWE (`LIVE_TALK`) |


### engine/ — logika symulacji (zero DOM-u)

| plik | KB | co siedzi w środku |
|---|---:|---|
| `engine/00-narzedzia.js` | 2 | R, RF, cl, pick, chance, zl, esc — używane wszędzie |
| `engine/01-kariera-koszty.js` | 6 | Wiek emerytalny, dziennik OVR, koszty życia, alimenty |
| `engine/02-ovr-i-balans.js` | 4 | Anty-klon OVR, punkt odniesienia ligi (refFor) |
| `engine/03-stan-gry.js` | 3 | G, newGame(), newPlayer() — kształt całego stanu gry |
| `engine/04-szansa-na-sklad.js` | 5 | Kto wjeżdża do siódemki (appearanceChance) — z sympatią trenera |
| `engine/05-niespodzianki.js` | 3 | Nieoczekiwane zdarzenia kolejki (5%) |
| `engine/06-start-sezonu.js` | 4 | startSeason() — budowa kontekstu sezonu G.S |
| `engine/07-losowanie-zdarzen.js` | 5 | rollEvent, rollWinterEvent, applyWinterChoice, warunki cond |
| `engine/08-pomocnicze-sezonu.js` | 2 | getClub, clubOf, riderLine, leagueAvgOvr |
| `engine/09-sezon-przebieg.js` | 47 | GŁÓWNY generator sezonu: co, kiedy i w jakiej kolejności się liczy (+ rubryka trenera w rozwoju OVR) |
| `engine/10-glosy-po-sezonie.js` | 3 | Dobór głosu z TALK do sytuacji |
| `engine/11-ocena-sezonu.js` | 6 | seasonScore, gradeOf — z czego wychodzi ocena |
| `engine/12-mecz-ligowy.js` | 22 | Ustawianie składu, pojedynczy bieg, cały mecz 15-biegowy, rezerwa taktyczna z AI trenera |
| `engine/12b-pola-i-rezerwy.js` | 7 | Pola startowe i kaski (`gateOrder`), logika par pod taśmą, limity rezerwy zwykłej i taktycznej, zakaz zdejmowania juniora przez seniora |
| `engine/13-ekonomia-w-sezonie.js` | 6 | Pensje, zaległości, bunty płacowe, próg odmowy jazdy |
| `engine/14-terminarz-i-kolejki.js` | 6 | Terminarz, status gracza na kolejkę, rozliczenie kolejki |
| `engine/15-liga-chronologia.js` | 17 | Walkowery, mecz przerwany/anulowany, powtórki, przebieg 14 kolejek |
| `engine/16-kluby-po-sezonie.js` | 12 | Gospodarka klubów, sponsorzy tytularni, zmiany nazw |
| `engine/17-playoff.js` | 4 | Play-off i play-down |
| `engine/18-dmpj.js` | 10 | Drużynowe Mistrzostwa Polski Juniorów |
| `engine/19-zawodnicy-kadry.js` | 17 | Generowanie zawodników, kategorie wiekowe, starzenie kadr + **AI TRENERÓW**: sympatie, status w zespole, presja, rozwój OVR, zwolnienia |
| `engine/20-swiat.js` | 6 | Zawodnicy zagraniczni i ranking światowy |
| `engine/21-turnieje-baza.js` | 7 | Statystyki lig + wspólna mechanika turnieju 20-biegowego |
| `engine/22-turnieje-polskie.js` | 15 | IMP, MIMP, Kaski, szkoleniowe, Puchar PALET |
| `engine/23-ims-cykl.js` | 14 | Grand Prix: skład cyklu, runda, klasyfikacja |
| `engine/24-ims-eliminacje.js` | 14 | Eliminacje krajowe, SGP Challenge, Mistrzostwa Europy |
| `engine/25-upadlosci-awanse.js` | 5 | Syndyk, zielony stolik, awanse i spadki |
| `engine/26-rynek-wartosc.js` | 14 | Wartość rynkowa, zainteresowanie klubu, stawka za punkt |
| `engine/27-rynek-oferty.js` | 17 | Generowanie ofert, przedłużenia, podpisanie kontraktu |
| `engine/28-wielki-mecz.js` | 7 | Wybór meczu sezonu, płacz, tor/zębatka/mechanik |
| `engine/28b-sprzet-live.js` | 10 | WARSZTAT LIVE: pogoda (temperatura + wilgotność), dobór dyszy i gaźnika, długość i zapłon pod stan toru, ryzyko „dwóch minut" |
| `engine/29-live-bieg.js` | 13 | Jeden bieg na żywo: start, decyzje co łuk, kraksy, zastępstwa medyczne |
| `engine/29b-live-kolizje.js` | 13 | Wykluczenie = powtórka biegu, kolizje, kontuzjowanie rywala, bury, „Leż / Wstawaj", symulowanie upadku i defektu |
| `engine/30-live-park-maszyn.js` | 18 | Kartki, presja na trenerze, protest na stan toru, odwołanie zawodów (próg 8/12 biegów) |
| `engine/30b-live-zdarzenia.js` | 9 | Zdarzenia między biegami, wywiady (przed/w trakcie/po), dobór pato-komentarzy pomeczowych (`bigMatchVoices`) |
| `engine/31-live-mecz.js` | 40 | Generator meczu drużynowego na żywo + decyzje trenera AI pod taśmą |
| `engine/32-live-turniej.js` | 14 | Generator turnieju indywidualnego na żywo |
| `engine/33-imsj2-eliminacje.js` | 7 | Droga do IMŚJ2: eliminacje juniorskie i SGP2 Challenge |


### ui/ — ekrany i renderowanie HTML

| plik | KB | co siedzi w środku |
|---|---:|---|
| `ui/00-wspolne.js` | 5 | render(), nagłówek, rozwijane sekcje, kody biegów |
| `ui/01-ekran-tworzenia.js` | 5 | Ekran startowy, wybór klasy, changelog na stronie |
| `ui/02-ekran-ofert.js` | 20 | Okienko transferowe: wartość rynkowa, karty ofert, boks trenera |
| `ui/03-ekran-mechanika.js` | 7 | Rok w warsztacie zamiast na torze |
| `ui/04-ekran-hub.js` | 14 | Pasek zawodnika, kadra klubu, status w cyklu światowym |
| `ui/05-ekran-warsztat.js` | 15 | Prognoza kariery, ostrzeżenia, zakup sprzętu i mechanika |
| `ui/06-ekran-przedluzenie.js` | 4 | Propozycja przedłużenia w trakcie umowy |
| `ui/07-ekran-zdarzenia.js` | 6 | Ekran zdarzenia + pulpit „co z tego wyszło” |
| `ui/08-ekran-wielki-mecz.js` | 4 | Trzy drogi przed najważniejszym meczem |
| `ui/09-ekran-live.js` | 24 | Cały interfejs jazdy na żywo (+ modal po upadku, protest, ekran odwołanych zawodów) |
| `ui/09b-live-trener.js` | 5 | Pasek relacji z trenerem, kask przy nazwisku, alert regulaminowy |
| `ui/09c-warsztat-live.js` | 11 | Pulsujący boks TOR I MOTOCYKL (suwaki dyszy, gaźnika, długości i zapłonu), ekran zdarzenia meczowego, ekran wywiadu, głosy po meczu |
| `ui/10-podsumowanie.js` | 12 | Zakładki raportu, KPI sezonu, kontrola wykonania zdarzenia |
| `ui/11-podsumowanie-boksy.js` | 14 | Rozliczenie z klubem, kontuzje, upadłość, głosy |
| `ui/12-podglad-meczu.js` | 12 | Modal spotkania bieg po biegu + wielki mecz w raporcie |
| `ui/13-statystyki-ligi.js` | 6 | Klasyfikacje indywidualne lig, dziennik OVR |
| `ui/14-widok-ims.js` | 13 | Grand Prix, eliminacje, Challenge, IMŚJ2 — widok |
| `ui/15-tabele-i-wyniki.js` | 10 | kpi(), tabele lig, wyniki spotkań, faza play-off |
| `ui/16-widok-turniejow.js` | 9 | Turnieje indywidualne i DMPJ — widok |
| `ui/17-upadlosci-historia.js` | 5 | Zielony stolik, baraże, historia kariery |
| `ui/18-przejscie-roku.js` | 12 | nextYear, przerwa zimowa, trybunał PZM, przeczekanie roku |
| `ui/19-karta-kariery-dane.js` | 7 | Liczenie gabloty: medale, kluby, kody biegów |
| `ui/20-karta-kariery-html.js` | 21 | Karta „SportoweMity.pl” — cały HTML pamiątki |
| `ui/21-karta-kariery-png.js` | 8 | Zrzut karty do PNG |
| `ui/22-ekran-konca.js` | 6 | Werdykt kariery, one-club man, restart |


---

## Dwa pliki, które zostały duże — i dlaczego

- **`engine/09-sezon-przebieg.js` (45 KB)** — to jedna funkcja: `resolveSeasonGen()`.
  Generator, który potrafi zatrzymać sezon w środku (wielki mecz, jazda na żywo) i wznowić go
  po decyzji gracza. Nie da się jej pociąć na pliki bez przepisania na mniejsze funkcje —
  a to jest zmiana ryzykowna, bo od kolejności operacji w środku zależy cała matematyka sezonu.
  **Jeśli chcesz, mogę to rozbić w osobnym podejściu** (z testem regresji, który to pilnuje).
- **`engine/31-live-mecz.js` (35 KB po Sprincie 2)** — analogicznie: jeden generator
  `liveMeetingGen()`. Sprint 2 dołożył mu pętlę powtórek biegu, modal po upadku i
  rozgałęzienie na mecz przerwany — wszystko wewnątrz tej samej domknięcia, więc
  wyciągnąć się tego nie da bez przepisania generatora. Sama MECHANIKA poszła
  jednak na zewnątrz (`engine/29b`, `engine/30`) — tutaj został przepływ.

Reszta gry: **57 plików poniżej 10 KB**, wszystkie poza tymi dwoma poniżej 25 KB.
`engine/29-live-bieg.js` dobił w Sprincie 2 do 25 KB i **dlatego został pocięty** na
`29` (bieg + zastępstwa medyczne) i `29b` (kolizje, powtórki, Rejtan) — po 13 KB.

---

## Zasady, żeby to nie rozjechało się z powrotem

1. **Nowy plik = nowy `<script>` w `index.html`.** Numer w nazwie wyznacza miejsce w kolejności.
2. **Numeracja zostawia luki** (`10, 11, … 20, 30, … 40`) — jest gdzie dopisać nową pulę.
3. **Kolejność pul w `concat()` ma znaczenie** — zmiana kolejności zmienia losowania.
   Nowe pule dopisuj **na końcu** `concat`, nie w środku.
4. **`engine/` nie dotyka DOM-u, `ui/` nie liczy symulacji.** Jak zaczynasz pisać `document.`
   w `engine/`, to znak, że kod trafił nie tam.
5. **Jeden plik nie powinien przekroczyć ~25 KB.** Jak rośnie — tniemy na dwa.

---

## Test regresji (`test/smoke.js`)

Odpala grę w przeglądarce bez okna, z podmienionym `Math.random` na deterministyczny,
przechodzi całą karierę (do 40 sezonów), klika wszystkie zakładki raportu, generuje kartę
kariery i sprawdza, czy w konsoli nie było błędów.

```bash
npm install playwright
node test/smoke.js gra/index.html 12345 40 0
```

Argumenty: ścieżka do `index.html`, ziarno losowania, ile sezonów, tryb decyzji (`0` = pierwsza
opcja w każdym wyborze, `1` = ostatnia).

**Co doszło w Sprincie 2.** Bot klika teraz także:

| ekran / faza | co robi |
|---|---|
| `L.phase === 'fall'` | modal po własnym upadku — na przemian „Leż" i „Wstawaj i zbiegnij", żeby test przechodził też przez werdykt sędziego (wykluczenie / czerwona za symulowanie) |
| `L.phase === 'abandon'` | ekran odwołanych zawodów |
| `L.phase === 'between'` | co jakiś czas „PROTESTUJ ZE WZGLĘDU NA STAN TORU" |
| `L.phase === 'race'` | co jakiś czas „SYMULUJ UPADEK" / „SYMULUJ DEFEKT" |

Nowe akcje są klikane **rzadko i z twardymi limitami** (`PROTEST_CAP`, `SIM_CAP`).
Powód jest praktyczny: protest potrafi odwołać mecz, odwołany mecz wraca jako powtórka,
a powtórkę znów da się przerwać — bot bez limitu kręciłby jeden mecz w kółko i test
kończyłby się timeoutem zamiast wynikiem. Z tego samego powodu `guard` urósł
z 8 000 do 30 000 kliknięć: powtórki biegu (wykluczenie = czerwone światła) wydłużają mecz.

Wynik testu ma teraz dodatkowe pole `seen` — licznik trafień w nowe ścieżki
(`fall`, `lie`, `getup`, `abandon`, `protest`, `simfall`, `simdef`, `rerunMax`).
Jeżeli po zmianie w silniku któryś z nich spadnie do zera, to znaczy, że bot
przestał gdzieś docierać — i to jest sygnał, zanim jeszcze pojawi się błąd w konsoli.

Ten test posłużył do sprawdzenia samego podziału: **11 przebiegów kariery na 6 ziarnach dało
wynik co do znaku identyczny** z wersją sprzed podziału — te same punkty, średnie, budżety,
oceny i powody zakończenia kariery. Podział niczego nie zmienił w rozgrywce.

Po każdym większym patchu warto puścić go na kilku ziarnach — jeżeli coś się wywali, zobaczysz
to od razu, a nie po tygodniu w zgłoszeniu od gracza.

---

## Sprint 2 — co dokładnie się zmieniło (21.08.2026)

**1. Wykluczenie kogokolwiek = powtórka biegu.** Nie ma już darmowego awansu o miejsce,
kiedy rywalowi zapali się czerwone. Wszyscy wracają pod taśmę bez wykluczonych, a wartości
jazdy cofają się do stanu sprzed pierwszej decyzji (`x.base`). Limit: `COLL.rerunCap`
powtórek, potem sędzia rozstrzyga bieg tak, jak stoi.

**2. Kolizje mają ofiarę.** `liveVictim()` wskazuje tego, kogo właśnie atakujesz.
Rywal — `COLL.rivalInjury`% (więcej po pice i przy płocie), że nie wstaje: −OVR, koniec
zawodów dla niego (`live.hurtOut`, respektowane przez `buildEntries` i `nominate`).
Kolega z pary — atmosfera w dół i bura w parku maszyn.

**3. Rejtan.** Po własnym upadku bieg czeka na twoją decyzję. „Wstawaj i zbiegnij" =
kod `u`, zero punktów, zero komisji. „Leż" = sędzia wyklucza ciebie, wyklucza rywala
albo daje ci czerwoną za symulowanie (plus szansa, że karetka zamknie ci zawody).
Do tego dwie akcje z ekranu biegu: **symuluj upadek** (80% czerwonej, gdy rywale prowadzą)
i **symuluj defekt** (bura od rywala albo od kolegi z pary, jeśli zabierasz mu bonus).

**4. Dwie osobne drogi do odwołania meczu.** „Opuść park maszyn" ma teraz dodatkowo
1% (beton) → 15% (tor najtrudniejszy) szans, że sędzia odwoła zawody. „Protestuj ze
względu na stan toru" (między biegami) kosztuje ryzyko żółtej kartki i ma szansę
**zawsze niższą** — domknięte przez `Math.min(protest, leave-1)` w
`liveProtestCancelChance()`, więc to niezmiennik, a nie zbieg okoliczności.

**5. Mecz przerwany.** Po 8. biegu (12. w play-offie i play-downie) wynik jest ważny
i staje się końcowy. Wcześniej mecz jest anulowany: nie wchodzi do tabeli, do bilansu
ani do statystyk zawodników, a `engine/15-liga-chronologia.js` planuje **powtórkę
od 0:0** w jednej z 1–3 najbliższych kolejek (rozgrywaną na jej początku, przed
własnym terminarzem). Jeśli w sezonie nie ma już terminu — mecz zostaje nierozegrany
i nieweryfikowany.

### Co jeszcze warto dopiąć (świadomy dług)

- `liveMeetingGen()` woła się także z **`engine/09-sezon-przebieg.js`**, **`engine/17-playoff.js`**
  i **`engine/18-dmpj.js`**. Te pliki nie sprawdzają jeszcze `M.abandoned && !M.abandonCounted`,
  więc anulowany mecz wejdzie tam do wyniku jak zwykłe, krótkie spotkanie. **Nie wywali się** —
  generator celowo oddaje pełny kształt wyniku (`hs/as/st/box/me/lineH/lineA`) — ale
  regulaminowo powinien tam trafić ten sam warunek co w chronologii (`chronoAnnul`).
- **`engine/32-live-turniej.js`** (turniej indywidualny) korzysta z tego samego
  `liveResolveMove()`, ale nie ustawia `live.fallAsk` i nie konsumuje `rc.rerun` —
  działa więc po staremu: upadek to od razu wykluczenie, bez modala i bez powtórki.
  To jest wybór, nie przeoczenie: modale są opcjonalne, żeby jeden generator nie
  zmuszał drugiego do zmian. Jak chcesz Rejtana też w turniejach — podeślij 32.

---

## Sprint 3 — co dokładnie się zmieniło (22.08.2026)

**1. Twardy fix pól startowych.** `gateOrder()` (engine/12b) wymusza teraz **absolutny
przeplot** Gospodarz–Gość–Gospodarz–Gość w KAŻDYM biegu: programowym, po zastępstwie,
po rezerwie taktycznej i w biegach nominowanych. Kask przydziela się po **drużynie**,
a nie po numerze pola: gospodarz zawsze czerwony i niebieski, gość zawsze biały i żółty.
Kontrolę trzymają trzy funkcje: `gatesLegal()` (czy jest przeplot), `gatePairsLegal()`
(czy wymuszone sąsiedztwo to para młodzieżowa) i `gateAudit()` — ta ostatnia zapisuje
każdy nielegalny układ do `G.gateWarn`, więc test regresji ma po czym poznać regres.

**2. Logika par.** Seniorzy (1-5 / 9-13) nie mają prawa stać obok siebie pod taśmą.
Jedyne dopuszczone sąsiedztwo tej samej drużyny to **para młodzieżowa 6-7 / 14-15**
i tylko wtedy, gdy przeplot jest matematycznie niemożliwy (trzech zawodników jednej
strony w czteroosobowym polu) — wtedy juniorzy są sortowani na koniec stawki i to oni
przejmują wymuszone sąsiedztwo, nigdy liderzy.

**3. AI trenerów.** Każdy klub ma szkoleniowca (`c.coach`, tworzony leniwie przez
`clubCoach()`, więc działa też w rozgrywce sprzed patcha). Trener ma warsztat (`skill`),
autorytet (`auth`), nerwy (`nerve`) i **typ** z `COACH_TYPES`: Belfer ceni profesjonalizm,
Słup ogłoszeniowy medialność, Rachmistrz średnią biegową, Wychowawca młodzież,
Ziomek z szatni lojalność, Dyktator nie znosi konkurencji. Z tego wychodzi
`coachRel()` — sympatia od -100 do +100 — a z niej **status w zespole**: od Legendy
przez Gwiazdę po Wkład do kevlaru.

**4. Odstajesz — trener cię nie lubi.** Rdzeniem sympatii jest RÓŻNICA między twoim OVR
a poziomem drużyny. Za słaby: trener nie ma na ciebie pomysłu. Za dobry: trener przestaje
być najważniejszą osobą w klubie i zaczyna liczyć dni do końca kontraktu (dlatego kara
za odstawanie w górę rośnie tym mocniej, im słabszy jest jego autorytet). Zawodnik
pasujący do poziomu drużyny dostaje premię. Sympatia wchodzi do `lineupValue()`
(waga `LINEUP_REL_W`), więc realnie przesuwa numery w programie.

**5. Rozwój OVR pod trenerem.** `coachDevMul()` daje mnożnik 0,45-1,85. Punkt zerowy to
warsztat 60 — poniżej trener hamuje, powyżej przyspiesza. Ten sam mnożnik odwrócony
(`2-m`) obsługuje ZJAZD po trzydziestce: dobry szkoleniowiec przedłuża karierę.
Dla zawodników AI liczy to `ageRiders()`, dla Gracza `coachAgePlayer()` — raz na rok,
z wpisem do `G.coachLog` i rubryką w raporcie sezonu.

**6. Regulamin rezerw (`RESB`).** Młodzieżowiec może wejść **2× jako rezerwa zwykła**
i **1× jako taktyczna**. Trener AI sięga po rezerwę taktyczną przy stracie co najmniej
6 punktów, wybierając kogo zdjąć i kogo wpuścić **przez własne sympatie** (a pod presją
wyników — szybciej). TWARDA ZASADA: **młodzieżowca nie wolno zdjąć na rzecz seniora**
(`tacticLegal()`), a w biegach XIV-XV junior może pojawić się **wyłącznie jako rezerwa**,
czyli dopiero wtedy, gdy drużyna nie ma dwóch seniorów z wolnym startem.

**7. Odmowa trenera.** Prośba o wpuszczenie z rezerwy (`liveAct('push')`) sprawdza
najpierw PAPIERY, a dopiero potem rzuca kością. Komplet pięciu startów, wyczerpany limit
młodzieżowca albo próba wejścia seniora za juniora = zero procentów i alert trenera na
ekranie (`liveRefuseBox()` w ui/09) z tekstem z `RESB.burdel`. Przycisk zostaje aktywny
także wtedy, gdy regulamin zabrania — bo to gracz ma usłyszeć, dlaczego nie.

**8. Zwalnianie trenera przez gwiazdę.** Sympatia trenera wchodzi do szansy na
przedłużenie (`COACHB.relRenewW`). Jeżeli trener cię nie znosi, szansa spada — **chyba że**
twoja pozycja (OVR + medialność·0,55) przewyższa jego autorytet i warsztat o
`COACHB.coupGap`. Wtedy zarząd wybiera ciebie: podpisujesz kontrakt, a trener wylatuje
z hukiem — `fireCoach()` wpisuje to do `G.coachLog`, `G.coachCoup` trzyma ostatni pucz,
a raport sezonu pokazuje planszę ZARZĄD WYBRAŁ CIEBIE — TRENER WYLECIAŁ.

### Test

Doszedł `test/sprint3.js` — odpalany bez przeglądarki, na atrapach:

```bash
node test/sprint3.js
```

Sprawdza cztery grupy niezmienników: 50 000 losowych stawek pod taśmą (przeplot, kaski,
numery pól), zakresy sympatii i mnożnika rozwoju, 600 pełnych meczów ligowych (limity
rezerw, brak juniorów w biegach nominowanych, pusty `G.gateWarn`) i sześć sezonów
starzenia pod trenerami (drift OVR, karuzela trenerska, liczebność kadr).

### Sprint 3b — domknięcie długu (22.08.2026)

Trzy rzeczy, które w pierwszym podejściu zostały „na potem", są już wpięte:

**`engine/09-sezon-przebieg.js` — trener liczy się RAZ, w rozwoju po sezonie.**
W rozpisce wzrostu OVR (`gParts`) doszła osobna rubryka: *trener X (typ, warsztat) —
w jego oczach jesteś: STATUS (sympatia ±N)*. Wzór jest ten sam, co dla zawodników AI
(`coachGrowthDelta()` w engine/19): przyrost mnożony przez warsztat i sympatię, spadek
po trzydziestce hamowany tym samym mnożnikiem. Żeby ten sam trener nie policzył się
dwa razy, 09 zapala `p.coachDevApplied`, a `coachAgePlayer()` w `ageRiders()` konsumuje
tę flagę i wychodzi. Kto wgra sam engine/19 bez zmiany w 09 — dostanie stare zachowanie
(osobna rubryka przy przejściu roku), nic się nie wywali.

**`engine/04-szansa-na-sklad.js` — procent na ekranie ofert mówi prawdę.**
Oba szacunki (`appearanceChance` „na zimno" i `appearanceChanceNow` w trakcie sezonu)
podają teraz `lineupFrom()` nazwę klubu, więc liczą DOKŁADNIE to samo, co realny mecz —
razem ze składnikiem `LINEUP_REL_W`. Wirtualny „ty" w puli dostał `me:true`, dzięki czemu
trener czyta twój prawdziwy profesjonalizm, medialność i lojalność zamiast szacować je
po samym OVR. Doszła też `appearanceCoachPart()` — ile z tego procentu to sam trener.

**`ui/02-ekran-ofert.js` — widzisz, kto cię tam poprowadzi.**
Przy każdej ofercie (także przy pierwszym kontrakcie w karierze) jest boks TRENER:
nazwisko, typ, warsztat, autorytet, twój status w jego oczach, jego zdanie o tobie
i mnożnik rozwoju przełożony na ludzki język — od „ROZWÓJ WYRAŹNIE PRZYSPIESZY" po
„ROZWÓJ STANIE W MIEJSCU". Przy ofercie przedłużenia po puczu dochodzi żółta linijka
o trenerze, który właśnie stracił pracę. Boks „BEZ PRZEDŁUŻENIA" pokazuje wprost,
kiedy to trener zamknął temat.

**Przy okazji dwie poprawki w silniku trenerów:**

- `coachRel()` nie liczy już bieżącej dyspozycji. Forma wchodzi do składu osobno
  (`LINEUP_FORM_W`), więc trzymanie jej także w sympatii liczyło ten sam dołek dwa razy.
  Sympatia to opinia z całego sezonu, nie humor po jednym meczu.
- `clubByName()` dostał indeks po nazwie. `coachRel()` woła się przy każdym z 140 losowań
  w `appearanceChance()`, a stare liniowe szukanie przez `allClubs()` budowało za każdym
  razem nową 24-elementową tablicę. Po zmianie: ~14 ms na jedno pełne oszacowanie,
  ~5 ms na kolejkę w sezonie.

### Czego dalej nie ruszam (świadomie)

- **`engine/32-live-turniej.js`** nie ma trenera z definicji (turniej indywidualny) —
  i tak zostaje.
- **`data/01-changelog-biezacy.js`** — gotowy wpis leży w `CHANGELOG-sprint3.txt`,
  wystarczy go wkleić do puli. Plus data patcha w `data/00-meta.js`.
- **`engine/17-playoff.js`, `engine/18-dmpj.js`, `engine/09`** nadal nie sprawdzają
  `M.abandoned && !M.abandonCounted` po `liveMeetingGen()` (dług ze Sprintu 2, nie z tego).


---

## Sprint 4 — co dokładnie się zmieniło (23.08.2026)

**1. Warsztat live zamiast samej zębatki.** Zakładka „TOR I MOTOCYKL" ma teraz cztery
dodatkowe ustawienia: **DŁUGOŚĆ MOTOCYKLA** (0-3), **ZAPŁON** (0-3), **GAŹNIK** (0-3)
i **DYSZA** (0-5). Boks **pulsuje** (`.pulse-hot`) zawsze, kiedy da się w nim coś zmienić —
i tylko wtedy, bo pulsujący boks, którego nie można kliknąć, byłby hałasem.
Warsztat jest dostępny w parku maszyn przed biegiem **i między biegami**.

**2. Pogoda wymusza dyszę i gaźnik.** `liveWeather()` losuje raz na zawody temperaturę
(4-33°C) i wilgotność (28-96%), z nich liczy gęstość powietrza. `liveIdealJet()` rośnie
z gęstością (zimno + sucho = bogata dysza), `liveIdealCarb()` z suchością.
Długość i zapłon idą za `grip`, nie za pogodą. `liveSetupEval()` zamienia odchyłki na
korektę siły jazdy (od **+3,2** przy ideale do **-13** przy komplecie pomyłek, twardo
zaciśnięte w `cl()`) i na dokładkę do ryzyka defektu (do +10 pkt proc.).
Wchodzi to do `liveMkRace()` szóstym argumentem — patrz `liveRideMod()`.

**3. Ryzyko „dwóch minut".** `liveSetupTouch()` zapala `live.setupDirty` przy KAŻDEJ
zmianie sprzętu (zębatka też), ale dopiero po tym, jak pierwsze ustawienie zostało
zatwierdzone (`live.setupDone`) — pierwsze przed pierwszym biegiem kosztuje 0%.
`liveSetupTapeRoll()` rzuca kością przy wyjeździe na tor: od 0,5% (mechanik 99)
do 5% (mechanik 1). Trafienie = kod `w` **w tym jednym biegu** (nie w całych zawodach —
to nie jest czerwona kartka), bieg jedzie bez ciebie.

**4. Dwie nowe decyzje co łuk — w OBU generatorach naraz.** `BIGM.moves` czytają
zarówno `engine/31-live-mecz.js`, jak i `engine/32-live-turniej.js`, więc dopisanie
`nozyce` i `ajs` do tej tablicy plus dwie gałęzie w `liveResolveMove()` wystarczyło,
żeby akcje pojawiły się w meczu ligowym, play-offie i turniejach indywidualnych.
`ajs` ma **własny sufit** w `liveMoveChance()` (`cl(base, 1, 15)`) — nikt, nigdy,
nie wyciągnie z tego więcej niż 15%. Po udanym manewrze `me.val` jest ustawiane
**ponad najwyższą wartość w stawce**, czyli awans na 1. miejsce jest gwarantowany,
a nie prawdopodobny.

**5. Zdarzenia i wywiady przez jeden generator.** `liveSideGen(live, snap, say, when, heatNo)`
w `engine/30b` woła się przez `yield*` i obsługuje oba tryby jazdy. `when` to
`'pre' | 'mid' | 'post'`. Nowe fazy interfejsu: **`mevent`** (zdarzenie) i **`itw`**
(wywiad — najpierw ekran „weź udział / odmów", potem trzy pytania).
Skutki zdarzeń i odpowiedzi wpadają do `live.formBonus`, który dokleja się do siły
jazdy w kolejnych biegach przez ten sam `liveRideMod()`.

**6. Pato-komentarze pomeczowe.** `bigMatchVoices(info)` dobiera sześć głosów z `LIVE_TALK`
po: wyniku drużyny, twojej średniej w meczu, udanym/nieudanym AJS-ie, nożycach,
kraksach, kartkach, spóźnieniach pod taśmę i zachowaniu wobec mediów. Trafiają na ekran
końca meczu (`ui/09c` → `liveVoicesHtml`) i do raportu sezonu (`ui/12` → `bigVoicesHtml`),
a także do `G.S.bigLog[].voices`.

### Czego pilnować przy kolejnym patchu

- **`liveAct(a, v)`** musi po prostu przekazywać `{a, v}` do generatora. Sprint 4 dokłada
  akcje `setup` (`v` w formacie `'jet:3'`), `mevent` (`v` = id opcji), `itwyes`, `itwno`
  i `itwq` (`v` = indeks odpowiedzi). Jeżeli `liveAct` ma gdzieś białą listę akcji,
  trzeba je do niej dopisać.
- **Zdarzenia w `LIVE_EVENTS` wołają `livePitCosts()` i `chance()`** — to znaczy, że
  `data/71` ładuje się PRZED `engine/30`, ale funkcje są wołane dopiero w czasie gry,
  więc kolejność `<script>` jest bez znaczenia. Nie przenoś ich do `data/06-efekty-fx.js`:
  tamte `fx*` działają na sezonie, te na zawodach.
- **Dług ze Sprintu 2 nadal otwarty:** `engine/17-playoff.js`, `engine/18-dmpj.js`
  i `engine/09-sezon-przebieg.js` wciąż nie sprawdzają `M.abandoned && !M.abandonCounted`.
