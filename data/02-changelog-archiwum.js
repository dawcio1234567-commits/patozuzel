/* ============================================================
   PATO-ŻUŻEL :: DANE :: CHANGELOG — ARCHIWUM
   Stare wpisy. Tego pliku przy zwykłym patchu NIE ruszasz.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 56-168 oryginału).
   ============================================================ */
const CHANGELOG_ARCHIWUM = [
 {v:'21.08.2026 · HOTFIX', t:'HOTFIX: KLIKANIE W WYNIK MECZU I ZBYT WIELU POLAKÓW W CYKLACH ŚWIATOWYCH', l:[
  'NAPRAWA: KLIKNIĘCIE W WYNIK MECZU NIC NIE ROBIŁO. Argumenty przycisku szły przez JSON.stringify(), który opakowuje napisy w PODWÓJNY cudzysłów — a cały handler siedzi w atrybucie onclick="...". Pierwszy taki cudzysłów zamykał atrybut, więc przeglądarka dostawała połamany HTML i przycisk był po prostu martwy. Argumenty składane są teraz ręcznie, w apostrofach. Przetestowane automatem, który wyciąga z wygenerowanego HTML wszystkie klikalne wyniki i naprawdę je klika: 192 na 192 otwierają kartę meczową z tabelą punktów wszystkich zawodników i przebiegiem bieg po biegu.',

  'NAPRAWA BALANSU: W CYKLACH MIĘDZYNARODOWYCH BYŁO ZA DUŻO POLAKÓW — realnie 11 do 13 miejsc na 15 w składzie Grand Prix. Powód był czysto statystyczny, nie sportowy: polska liga to ponad 250 zawodników w bazie, a każda federacja zagraniczna miała ich kilkanaście, więc przy doborze "po prostu najlepszych" Polska brała stawkę samą masą. Wprowadzone zostały LIMITY KRAJOWE, tak jak w prawdziwym cyklu: Polska 5 miejsc, Dania 3, Szwecja 3, Anglia 2, pozostałe federacje po 2. Efekt po kilkunastu przetestowanych sezonach: skład to zwykle 5 Polaków, 3 Duńczyków, 3 Szwedów, 1-2 Anglików i 1-2 zawodników z Czech, Niemiec, Finlandii czy USA, a tytuł mistrza świata wędruje między federacjami.',

  'Limit działa W KOLEJNOŚCI PIERWSZEŃSTWA i nikomu nie odbiera wywalczonego miejsca: kwalifikacja z poprzedniego cyklu, awans z Challenge i tytuł Mistrza Europy są nietykalne — przydział przycina wyłącznie dobór uznaniowy, czyli dzikie karty Komisji. Dodatkowo przydział z Challenge liczy się DYNAMICZNIE (jako reszta limitu federacji po odliczeniu tych, którzy już mają kwalifikację), żeby liczba zawodników jednego kraju nie pełzła w górę z roku na rok.',

  'WYJĄTEK DLA GRACZA: jeżeli wjedziesz do czwórki SGP Challenge, miejsce w cyklu dostajesz ZAWSZE, nawet gdy limit Polski jest już wypełniony — to twoja główna droga do Grand Prix i nie zamyka jej arytmetyka przydziałów.',

  'NOWE: KAŻDA RUNDA GRAND PRIX MA GOSPODARZA. Rundy jadą kolejno w Polsce, Szwecji, Danii, Anglii, Niemczech, znowu w Polsce, Czechach, Szwecji, Danii i Polsce — a dziką kartę rundy dostaje zawodnik GOSPODARZY. Wcześniej brało się najlepszego z rankingu poza stawką, więc dziką kartę rundy niemal zawsze dostawał Polak. Nazwa kraju widoczna jest teraz w tytule każdej rundy.',

  'ZBALANSOWANE: reszta świata mocniejsza i głębsza. Czołowe federacje mają teraz po 16 zawodników z łagodniejszą drabinką (Dania 97, Szwecja 96, Anglia 93 na czele), pozostałe po 10. Korekta poziomu federacji między sezonami jest ostrzejsza (próg z 4 na 2 punkty) — bez tego Szwecja albo Anglia potrafiły zapaść się na kilkanaście sezonów, gdy jedno pokolenie kończyło kariery naraz.',

  'NAPRAWA: KAŻDA FEDERACJA MA WŁASNY NARYBEK. Zdarzało się, że cały rocznik danego kraju kończył kariery w tym samym czasie i przez kilka sezonów nie było KOGO wystawić do IMŚJ2 — wtedy limity krajowe nie miały czego przycinać i cykl juniorski robił się polski (potrafiło być 9-11 Polaków na 15). Każdy kraj trzyma teraz minimum trzech zawodników do 21 lat, a przy generowaniu świata cztery ostatnie miejsca każdej federacji to z założenia juniorzy. IMŚJ2 jest po tej poprawce równie międzynarodowe jak cykl seniorski.',

  'Bez zmian: Puchar PALET zostaje cyklem z dużym udziałem Polaków — to było wprost w zgłoszeniu i tak ma zostać.'
 ]},
 {v:'21.08.2026', t:'PATCH: MISTRZOSTWA ŚWIATA, STATYSTYKI INDYWIDUALNE LIG, PODGLĄD MECZÓW I PORZĄDKI W PUNKTACH BONUSOWYCH', l:[
  'Największy patch od premiery. Poniżej wszystko, co się zmieniło — z wyjaśnieniem, na czym polegał problem, tam gdzie to była realna naprawa, a nie sam balans.',

  'NOWE: INDYWIDUALNE MISTRZOSTWA ŚWIATA (IMŚ). Pełny cykl, format jeden do jednego z regulaminu: 16 zawodników, 20 biegów zasadniczych (3-2-1-0, wykluczenie i defekt = 0 punktów), dwóch najlepszych z tabeli jedzie prosto do finału, miejsca 3-10 rozstawione są na dwa biegi ostatniej szansy LCQ1 i LCQ2, zwycięzcy dołączają do finału, a zwycięzca finału wygrywa rundę. Razem 23 biegi. Dziesięć rund w sezonie, klasyfikacja generalna liczona punktami za miejsca w rundach.',

  'NOWE: SKŁAD CYKLU WEDŁUG REGULAMINU. Siedmiu najlepszych z poprzedniego roku ma kwalifikację automatyczną, czterech dochodzi z SGP Challenge, jedno miejsce jest gwarantowane dla Mistrza Europy (a jeżeli mistrz Europy i tak jest w czołowej siódemce, Komisja przyznaje czwartą stałą dziką kartę zamiast trzeciej). Szesnastkę każdej rundy dopełnia dzika karta rundy, do tego dwóch rezerwowych toru. W zakładce IMŚ widać przy każdym nazwisku, KTÓRĄ DROGĄ ten zawodnik wszedł do cyklu.',

  'NOWE: ELIMINACJE DO CYKLU. W Polsce eliminacją jest ZŁOTY KASK — jego czterej najlepsi jadą do SGP Challenge. Anglia, Szwecja i Dania mają własne eliminacje krajowe (po trzy miejsca). Pozostałe federacje (Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy) jadą we WSPÓLNYCH eliminacjach i wyprowadzają z nich tylko trzech — stoją żużlowo słabiej i szerszy przydział rozwaliłby balans cyklu. Z Challenge do Grand Prix wchodzi czterech; jeżeli któryś z tej czwórki i tak kończy sezon w czołowej siódemce cyklu, jego miejsce bierze kolejny zawodnik Challenge bez kwalifikacji — dokładnie jak w regulaminie.',

  'NOWE: INDYWIDUALNE MISTRZOSTWA ŚWIATA JUNIORÓW (IMŚJ2) — ten sam, 23-biegowy format, wyłącznie dla zawodników do 21 lat, ale na życzenie tylko TRZY RUNDY w sezonie.',

  'NOWE: INDYWIDUALNE MISTRZOSTWA EUROPY (SEC) — osobny turniej finałowy, którego zwycięzca ma miejsce w cyklu Grand Prix na kolejny rok.',

  'NOWE: RESZTA ŚWIATA. Do gry wchodzi trwała pula zawodników z Danii, Szwecji, Wielkiej Brytanii, Czech, Niemiec, Finlandii, USA, Francji, Argentyny i Ukrainy. Starzeją się, rozwijają i kończą kariery tak samo jak Polacy, a na ich miejsce wchodzą nowi — cykl światowy ma więc ciągłość między sezonami, a nie losuje sobie stawki od zera co rok.',

  'NAPRAWA NAJŚMIESZNIEJSZEGO BŁĘDU W GRZE: mistrz świata dostawał mniej pieniędzy niż przeciętny ligowiec. Powód był prozaiczny — cyklu światowego w grze po prostu nie było, a wszystko, co indywidualne, płaciło ryczałtami PZM (500 zł startowego, 150 zł za punkt). Teraz Grand Prix płaci jak Grand Prix: ryczałt startowy za każdą rundę, nagroda za miejsce w rundzie i osobna, największa pula za miejsce w klasyfikacji końcowej. Mistrz świata zarabia w jednym sezonie więcej niż przeciętny ligowiec przez pół kariery.',

  'ODPOWIEDŹ NA PYTANIE „czy każdy mecz jest symulowany wg silnika, z siódemką na drużynę": sprawdzone i rozpisane. Liga (14 kolejek × 4 mecze × 3 ligi) oraz CAŁA faza play-off, play-down, dwumecze o utrzymanie i baraże zawsze szły przez ten sam silnik — 7 zawodników w każdej drużynie, 15 biegów, numery 9-15 u gospodarza i 1-7 u gościa, rezerwa taktyczna i biegi nominowane włącznie. Audyt trzech pełnych sezonów: 612 spotkań, 15 biegów w każdym, zero wyników poza regulaminowym zakresem, zero zawodników z więcej niż pięcioma startami. Skład 7-osobowy w 1207 przypadkach na 1224; pozostałe 17 to sytuacja regulaminowa, a nie błąd — klub, któremu na daną kolejkę zabrakło DRUGIEGO zdrowego zawodnika U21 (kontuzje, bunt płacowy, zbiorowa kraksa kadry), jedzie z pustym numerem młodzieżowym, bo seniora nie wolno tam wpisać. To zachowanie było w grze od zawsze i zostaje. Turnieje indywidualne jadą tabelą 20-biegową (16 zawodników po 5 startów) i tak ma być. JEDYNYM miejscem, gdzie wynik brał się z rzutu kością na poziom drużyny zamiast z przejechanych biegów, było DMPJ — i to zostało naprawione (niżej).',

  'NAPRAWA: DMPJ jest teraz symulowane biegami. Czwórmecz to 4 drużyny po 4 juniorów (16 zawodników), 24 biegi, w każdym po jednym zawodniku z każdej drużyny, po 6 startów na zawodnika, z defektami i wykluczeniami liczonymi jak w lidze. Punkty meczowe 4/3/2/1 wg sumy punktów biegowych, przy remisie dzielone po równo (art. 804 ust. 3).',

  'NAPRAWA: W LIDZE NIE BYŁO WIDAĆ, KTÓRY BIEG DAŁ PUNKT BONUSOWY. Silnik liczył bonus poprawnie, ale do kodów biegu wpisywał samą liczbę punktów — gwiazdka „2★"/„1★" istniała WYŁĄCZNIE w uproszczonym generatorze DMPJ, czyli dokładnie tam, gdzie punktów bonusowych w ogóle być nie powinno. Teraz jest odwrotnie i zgodnie z regulaminem: bonus zapisuje się przy biegu ligowym (i w play-offie), a z turniejów indywidualnych i z DMPJ gwiazdki zniknęły — w czwórmeczu i w turnieju indywidualnym nie ma pary klubowej, więc nie ma za kogo jechać.',

  'ZMIANA: PUNKTY BONUSOWE LICZĄ SIĘ DO ŚREDNIEJ BIEGOPUNKTOWEJ. To punkty zdobyte na torze dla drużyny, więc wchodzą do średniej — w lidze, w play-offie i w dorobku łącznym. Do wyniku spotkania nadal nie wchodzą, bo tam liczy się goła punktacja biegowa.',

  'NOWE: PODGLĄD SPOTKANIA. Kliknięcie w dowolny wynik — ligowy, play-off, play-down albo barażowy — otwiera kartę meczową: tabelę ze zdobyczą punktową WSZYSTKICH zawodników obu drużyn (numer startowy, starty, punkty, bonusy, kody biegów) oraz przebieg bieg po biegu z wynikiem narastająco. W zakładce LIGA doszła sekcja ze wszystkimi wynikami wszystkich trzech lig, kolejka po kolejce.',

  'NOWE: STATYSTYKI INDYWIDUALNE DLA KAŻDEJ Z LIG. Osobna zakładka z klasyfikacją średnich w Ekstralidze, 2. Ekstralidze i Krajowej Lidze Żużlowej — juniorzy (U21) i seniorzy klasyfikowani ODDZIELNIE. Zdjęcie robione jest po rundzie zasadniczej, minimum 12 startów, średnia liczona razem z bonusami.',

  'NOWE: OCENA SEZONU BIERZE POD UWAGĘ MIEJSCE W TEJ KLASYFIKACJI. Ta sama średnia znaczy co innego w Ekstralidze i co innego w Krajowej Lidze, i co innego u 17-latka niż u 30-latka — dlatego junior porównywany jest z juniorami, senior z seniorami, i to w obrębie własnej ligi. Pierwsze miejsce daje pełną premię, środek stawki jest neutralny, ogon klasyfikacji zabiera punkty. Osobna, wyraźnie wyższa premia leci za medale i czołową ósemkę cyklu światowego.',

  'NOWE: ROZWIJANA LISTA „CO WPŁYNĘŁO NA TWÓJ OVR W TYM SEZONIE" na ekranie podsumowania. Widać w niej każdą zmianę OVR co do punktu: skutek zdarzenia, kontuzję z konkretnej kolejki i pełną rozpiskę rozwoju po sezonie (wiek, profesjonalizm, dyspozycja, atmosfera, budżet klubu, zaległości, poziom kolegów z kadry, sufit talentu).',

  'NAPRAWA: zdarzenia dodające OVR faktycznie dodawały OVR (fxO zmienia kartę zawodnika od razu), ale KONTROLA WYKONANIA o tym milczała — nie było takiej rubryki. Stąd zgłoszenie „to się nie wyświetla". Teraz OVR ze zdarzenia ma własny wiersz w kontroli wykonania, razem ze stanem OVR na start sezonu.',

  'ZMIANA: OVR ROZWIJA SIĘ SZYBCIEJ W KLUBIE Z LEPSZĄ ATMOSFERĄ I WIĘKSZYM BUDŻETEM. Do tej pory otoczenie nie miało z rozwojem nic wspólnego: 16-latek w klubie z pustą kasą, zaległościami i szatnią na noże rósł dokładnie tak samo jak ten sam 16-latek w mistrzowskim zespole ze sprzętem na miejscu i fizjoterapeutą. Teraz atmosfera, zamożność klubu, jego zaległości wobec ciebie i poziom kolegów z kadry liczą się jawnie — i widać je w rozpisce OVR.',

  'ZMIANA: PREMIA ZA PODPIS WYPŁACANA JEST CO SEZON, a nie raz przy podpisaniu kontraktu. Wcześniej przy umowie na cztery lata trzy sezony szły bez grosza premii. Teraz rata premii wpływa na starcie każdego sezonu objętego umową — i tak jak stawka za punkt podlega wypłacalności klubu (klub bez kasy dopisze ją sobie do zaległości).',

  'BALANS: SPRZĘT ZA MILION MUSI ROBIĆ RÓŻNICĘ. Zgłoszenie: „najdroższa część daje tylko +40, co jest kompletnie niezbalansowane". Racja — skala sprzętu ma 99 punktów, zużycie zabiera 16-26 punktów w KAŻDYM sezonie, a górna półka kosztuje 1,15 mln zł. Cała drabinka tunerów przeskalowana (z 3/7/10/12/16/21/26/32/40 na 6/12/18/24/32/42/52/64/78): najtańszy złom z OLX to dalej łatanie dziur, ale pełen program u tunera na wyłączność realnie wsadza zawodnika na sprzęt klasy mistrzowskiej.',

  'ZMIANA: PRZY KONTUZJI DŁUGOTERMINOWEJ ŻADEN KLUB NIE ZŁOŻY CI OFERTY. Zawodnik po zerwanych więzadłach / złamanym udzie, który cały nadchodzący sezon spędza na rehabilitacji, dostawał do tej pory normalne oferty i podpisywał umowę, z której klub nie miał ani jednego biegu. Żaden zarząd tego nie zrobi. Rynek jest teraz dla niego zamknięty (razem z przedłużeniem „one-club man"), zostaje przeczekanie roku — rehabilitacja odlicza sezon — albo praca u mechanika.',

  'ZMIANA: TURNIEJE SZKOLENIOWE TO CYKL OŚMIU TURNIEJÓW, nie jeden. Wcześniej gra rozgrywała jedną rundę i uznawała sprawę za zamkniętą, tłumacząc, że reszta cyklu toczy się bez twojego udziału — przy ośmiu turniejach w kalendarzu to była po prostu nieprawda. Klasyfikacja końcowa to suma punktów z ośmiu rund, przy remisie wyżej ten, kto lepiej pojechał w turnieju rozegranym później.',

  'ZMIANA: PUCHAR MACEC NAZYWA SIĘ TERAZ PUCHAR PALET. Druga poprawka z tego samego zgłoszenia: w cyklu jeżdżą TEŻ POLACY. Wcześniej stawkę robiło piętnastu obcokrajowców i samotny Gracz — teraz obok niego startuje kilku krajowych zawodników z tej samej półki, a resztę uzupełniają rywale ze Słowacji, Czech, Rumunii, Bułgarii, Węgier i Ukrainy.',

  'DROBNE: karta kariery ma nowe gabloty (Indywidualne Mistrzostwa Świata, IMŚJ2, cykl Turniejów Szkoleniowych, Puchar PALET), rozliczenie sezonu pokazuje osobne rubryki na ratę premii za podpis i na pieniądze z cyklu światowego, a legendy wyników i turniejów zostały przepisane pod nowe zasady punktów bonusowych.'
 ]},
 {v:'20.08.2026', t:'PATCH: TRYBUNAŁ PZM, PUCHAR MACEC, TURNIEJE SZKOLENIOWE I NAPRAWY ZGŁOSZONE PRZEZ GRACZY', l:[
  'Duży patch po zbiorczym feedbacku. Poniżej, co dokładnie się zmieniło — z konkretnym wyjaśnieniem, na czym polegał problem, tam gdzie to była realna naprawa, nie tylko balans.',

  'NAPRAWA (poważna): zdarzenia z przerwy zimowej (WINTER_EVENTS) liczyły swoje skutki na ATRAPIE sezonu, która jest wyrzucana zaraz po zamknięciu zdarzenia — więc zmiany szans na biegi, ryzyka urazu i atmosfery w szatni z 23 zdarzeń zimowych POKAZYWAŁY SIĘ w opisie skutków, ale nigdy realnie nie wchodziły do kolejnego sezonu. To najbardziej prawdopodobne źródło zgłoszenia "zdarzenia zmieniające ryzyko urazu nie dają efektu". Wszystkie 23 przepisane na warianty "na kolejny sezon" (fxHN/fxIN), a atmosfera dostała nowy, brakujący do tej pory odpowiednik (fxAN + G.p.next.atmBonus), który realnie wchodzi w losowanie nastrojów szatni na starcie następnego sezonu.',

  'NAPRAWA: zdarzenie „ZBIÓRKA RATUNKOWA" (pomoc klubowi w długach) miało wpisaną karę -50% stawki za punkt w kolejnym sezonie przy wyborze „Pomagam" — bez żadnego wyjaśnienia w tekście, mimo że to gest lojalności premiowany też +15 lojalności. Odwrócony znak, prawdopodobnie kolejne źródło zgłoszenia o zdarzeniach z kasą za punkty. Zamienione na +15% (i podpisane w tekście dlaczego).',

  'NAPRAWA (spora): kontrakt typu „Amatorski" zerował sprzęt do gołego poziomu klubowego przy KAŻDYM podpisaniu — nie tylko przy debiucie w karierze, jak sugerował komentarz w kodzie. Efekt: weteran, który po latach zakupów i zdarzeń sprzętowych trafił na amatorską ofertę (np. po wymuszonym transferze do słabego klubu przez zaległości), tracił cały dorobek sprzętowy co do sztuki. Reset do poziomu klubowego działa teraz wyłącznie przy pierwszym kontrakcie w karierze.',

  'ZBALANSOWANE: różnice poziomu między ligami. Awans do wyższej ligi (szczególnie do klubu, który w niej jest najsłabszy — a tak zwykle wygląda awans) potrafił zamienić średnią 2.1 w średnią bliską 1.0 w jeden sezon, bo punkt odniesienia w silniku liczył się w większości ze ŚREDNIEJ CAŁEJ LIGI (a te różnią się między sobą nawet o 30+ pkt OVR), a kara za bycie poniżej odniesienia była bardzo ostra i zaczynała się natychmiast. Waga ligi w punkcie odniesienia zmniejszona na rzecz poziomu WŁASNEGO klubu (który po awansie jest bliżej twojego realnego poziomu niż cała liga), kara złagodzona, a strefa najostrzejszej kary poszerzona. Wyższa liga dalej ma być trudniejsza — teraz to urwisko, a nie ściana.',

  'ZBALANSOWANE: kluby zbyt rzadko realnie zadłużały się wobec gracza, więc próg buntu płacowego (odmowa jazdy) był praktycznie nieosiągalny — stąd zgłoszenie „na 10 karier zawodnik ani razu nie odmówił jazdy". Próg „zdrowego" klubu, który zawsze płaci w całości, obniżony, a zadłużony klub płaci teraz gorzej niż wcześniej. Progi buntu (25 000 zł dla dorosłych / 70 000 zł dla niepełnoletnich, zamiast 40 000 / 100 000) i tempo eskalacji też pod tym kątem poprawione.',

  'NOWE: TRYBUNAŁ PZM. Gdy w sezonie doszło do buntu płacowego przy wieloletnim kontrakcie, a klub wciąż zalega z pieniędzmi, w najbliższej przerwie zimowej dochodzi osobne, niezależne zdarzenie (możesz więc zobaczyć DWA zdarzenia zimowe w tej samej przerwie — zwykłe losowe i to). Masz wybór: zgłosić klub do trybunału PZM albo odpuścić. Przy zgłoszeniu — 75% szans, że trybunał rozwiązuje kontrakt (i klub musi rozliczyć część zaległości), 25% szans, że prezes przekupił związek: kontrakt trwa dalej, ale cała zaległość znika z papierów.',

  'NOWE: PUCHAR MACEC — prawdziwie symulowany, międzynarodowy turniej indywidualny (jak Turnieje Szkoleniowe, nie zdarzenie z rzutem kością). Stawka to Ty plus piętnastu zagranicznych rywali ze Słowacji, Czech, Rumunii, Bułgarii, Węgier i Ukrainy, kilka rund tej samej tabeli 20-biegowej, klasyfikacja końcowa to suma punktów ze wszystkich rund (art. 1.5 regulaminu: przy remisie wyżej ten, kto lepiej pojechał w PÓŹNIEJSZYM turnieju). Dostępny dla zawodników o umiarkowanym OVR — to liga dla ludzi, którzy nigdy nie zobaczą Grand Prix, nie dla gwiazd klubu. Nagrody i ryczałt startowy liczone z realnego regulaminu (netto w euro, przeliczone na złote) — kwoty celowo skromne.',

  'NOWE: TURNIEJE SZKOLENIOWE — kolejny prawdziwie symulowany turniej indywidualny (tabela 20-biegowa, art. 61), dostępny dla juniorów z klubów, które nie awansowały do czołowej czwórki rundy zasadniczej (czyli odpadły przed fazą play-off). Coś do zrobienia w sezonie, który i tak kończy się bez gry o awans.',

  'NAPRAWA: część zdarzeń losowych (Taniec z Gwiazdami, obozy treningowe, testy na zamarzniętym jeziorze, walka MMA i kilkanaście innych) potrafiła trafić się nawet przy zerwanych więzadłach czy złamanej kości udowej — czyli w trakcie sezonu spędzonego w gipsie. Wprowadzona jedna, wspólna definicja "kontuzjowany" (injured()), którą czyta teraz ok. 20 zdarzeń fizycznie niemożliwych do zrobienia z takim urazem — są dla kontuzjowanego zablokowane. W zamian dodano 6 nowych zdarzeń (3 sezonowe, 3 zimowe) WYŁĄCZNIE dla kontuzjowanego zawodnika, żeby sezon w gipsie nie był po prostu pustym miejscem w kalendarzu.',

  'NAPRAWA: w zdarzeniach kończących się wynikiem 0:75 tekst „WALKOWER" zamieniony na „Wróciliśmy do domu. Bez honoru i ambicji, za to z karą od PZM." — wynik w tabeli bez zmian.',

  'NAPRAWA (czytelność): bonus w pojedynczym biegu (kod „1*"/„2*") wizualnie ginął obok gwiazdki oznaczającej dorobek meczowy w tej samej linijce wyników. Kod bonusowy renderuje się teraz jako czytelna gwiazdka ★ (dane w tle bez zmian), z jaśniejszym opisem w legendzie wyników i turniejów indywidualnych. Przy okazji: zabezpieczony przypadek brzegowy w wierszach DMPJ, gdzie brak dopasowania drużyny w danym biegu potrafił pokazać mylące „drużyna 0. (0 pkt)" zamiast po prostu „—".'
 ]},
 {v:'19.08.2026', t:'PATCH: PORZĄDKI W INTERFEJSIE — MNIEJ OKIENEK NA RAZ', l:[
  'Feedback graczy: "za dużo małych okienek, kilka rzeczy zlewa się na raz". Racja — ekran między sezonami i podsumowanie sezonu piętrzyły nawet dziesięć osobnych boksów jeden pod drugim.',
  'NOWE: drugorzędne dane (jak działa ustawianie składu, skąd bierze się wiek emerytalny, jak działa warsztat, kontrola matematyczna, składniki oceny, kontrola wykonania zdarzenia) chowają się teraz za wyraźnym przełącznikiem "▸ ROZWIŃ" — jednym kliknięciem widzisz wszystko, ale nie musisz na to patrzeć za każdym razem.',
  'HISTORIA KARIERY na hubie i na ekranie końca kariery jest teraz zwinięta domyślnie, z licznikiem sezonów w nagłówku.',
  'Pięć osobnych boksów w podsumowaniu sezonu (wydarzenia klubowe, zmiany szyldów, rozwój profesjonalizmu/medialności, plotki po sezonie, raport) połączono w jedno "WIĘCEJ Z TEGO SEZONU" z jednym przełącznikiem zamiast pięciu.',
  'Bez zmian: liczby, ostrzeżenia i rozliczenie finansowe zostają widoczne od razu — zwijaniu podlega tylko to, co jest wyjaśnieniem albo dodatkiem, nie samo mięso sezonu.'
 ]},
 {v:'17.08.2026', t:'PATCH: NUMERY, WYNIKI, OFERTY I NIEOCZEKIWANE ZDARZENIA', l:[
   'NAPRAWA: numery startowe były odwrócone. Zgodnie z regulaminem gospodarz jedzie z numerami 9–15, a gość z numerami 1–7. Do tej pory silnik robił dokładnie odwrotnie i w meczu u siebie dostawałeś numer gościa.',
   'NAPRAWA: mecz potrafił skończyć się wynikiem, którego nie da się zdobyć na torze (np. 76:14 albo 16:74). Winna była rezerwa taktyczna: wjeżdżała do biegu pod ujemnym numerem wewnętrznym, a silnik czytał z tej liczby stronę meczu — każda liczba ujemna wychodziła mu jako gospodarz. Punkty rezerwy taktycznej gości lądowały więc na koncie gospodarzy. Stąd „zdobyłeś dwa punkty" przy wyniku, w którym twoja drużyna ich nie miała.',
   'Wynik drużyny jest teraz na koniec meczu odtwarzany ze składów — żadne punkty nie mają jak trafić do nie tej rubryki.',
   'NOWE: imię i nazwisko na ekranie startowym losuje się z puli. Przycisk LOSUJ przelosowuje propozycję.',
   'PRZEBUDOWA: system ofert kontraktowych. Widzisz teraz swoją WARTOŚĆ RYNKOWA rozpisaną na składniki (OVR, średnia z sezonu, medialność, profesjonalizm, wiek, sprzęt), a przy każdej ofercie — zainteresowanie tego klubu z powodami i rozbiór stawki za punkt.',
   'Stawki i premie za podpis liczone są z poziomu ligi, poziomu i zamożności klubu oraz twojej wartości, a nie z gołego rzutu kością. Klub z zaległościami negocjuje w dół i nie płaci za podpis.',
   'Długość kontraktu zależy od wieku: młodego wiąże się na 2–3 lata, po trzydziestce dostajesz rok.',
   'Młodzieżowiec nie zostaje już bez klubu tylko dlatego, że ma niski OVR — regulaminowa rubryka U21 realnie działa na jego korzyść.',
   'NAPRAWA: efekty „lepsze oferty" i „minus za wpis o guru" zostawały włączone do końca kariery. Teraz obowiązują na jedno okienko transferowe, tak jak opisuje to samo zdarzenie.',
   'NOWE: szansa na skład liczona jest osobno PRZED KAŻDĄ KOLEJKĄ, z realnej dyspozycji całej kadry — widać ją w kolumnie SZANSA w wynikach spotkań, razem ze średnią, minimum i maksimum sezonu.',
   'NOWE: nieoczekiwane zdarzenia w trakcie sezonu — łącznie 5% szans na kolejkę, po 1% na typ: połowa składu kontuzjowana, wskakujesz do składu, nagły wzrost formy, nagły zjazd formy, nagle wypadasz ze składu.',
   'NOWE: boks KONTROLA WYKONANIA przy zdarzeniu sezonowym — pokazuje, jak skutki twojego wyboru realnie weszły do sezonu (kary, walkower, zawieszenie, stawka, ryzyko urazu, szanse na skład) i co przechodzi na kolejny rok.',
   'Przejrzano wszystkie 380 wariantów decyzji ze zdarzeń sezonowych i zimowych: każdy wykonuje się bez błędu i zwraca opis skutku.'
 ]}
];
