/* ============================================================
   PATO-ŻUŻEL :: DANE :: BALANS SILNIKA
   BAL, SZK_ROUNDS, RETIRE, INJ, SURPRISE, ECON, GRADE — gałki do kręcenia.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 170-385 oryginału).
   ============================================================ */

const BAL={
 /* NAPRAWA (feedback: "zbyt duże różnice poziomu między ligami" — zawodnik ze
    średnią 2.1 po awansie do wyższej ligi lądował następny sezon ze średnią 1.0):
    refFor() liczy punkt odniesienia w dużej mierze ze ŚREDNIEJ CAŁEJ LIGI, a ta
    między ligami różni się nawet o 30+ pkt OVR (Ekstraliga ~85, KLŻ ~51). Awans
    zwykle oznacza dołączenie do NAJSŁABSZEGO klubu wyższej ligi — więc odniesienie
    liczone głównie z ligi skacze dużo mocniej, niż realnie skacze poziom, na jakim
    zawodnik faktycznie jeździ. Do tego kara poniżej odniesienia była bardzo ostra
    (2.60×) i zaczynała się natychmiast (knee=10) — więc typowy skok ligowy wpychał
    świeżo awansowanego zawodnika głęboko w strefę kary. Trzy zmiany:
      leagueW  0.55→0.48 — mniej wagi na "całą ligę", więcej na WŁASNY KLUB (który
                po awansie i tak jest zwykle tym najsłabszym w nowej lidze — bliżej
                realnego poziomu, na jakim się jeździ),
      belowPen 2.60→1.90 — kara poniżej odniesienia łagodniejsza,
      knee     10→14     — szerszy zakres, zanim zacznie się najostrzejsza kara.
    Różnica między ligami dalej jest wyraźnie odczuwalna (to ma sens: wyższa liga
    MA być trudniejsza), ale przestaje być urwiskiem z dnia na dzień. */
 leagueW : 0.48,   // udział średniej ligi w punkcie odniesienia (reszta: własny klub)
 belowPen: 1.90,   // mnożnik kary za pierwsze pkt poniżej odniesienia (do `knee`)
 knee    : 14,     // do ilu punktów obowiązuje ostra kara
 farPen  : 1.05,   // mnożnik kary powyżej "kolana"
 abovePow: 0.58,   // przewaga nad odniesieniem liczy się łagodniej niż kara
 refDrop : 7.0,    // przelicznik: średnia OVR klubu -> średni OVR jadącego zawodnika
 sigma   : 11.0,    // losowość jednego biegu (tor, taśma, szczęście)
 home    : 2.4,    // atut własnego toru
 rounds  : 14      // kolejek w sezonie zasadniczym
};

/* Ile turniejów liczy CYKL TURNIEJÓW SZKOLENIOWYCH (patch 21.08.2026 — było: jeden). */
const SZK_ROUNDS = 8;
 
/* ============================================================
   WIEK EMERYTALNY — DYNAMICZNY (czyta go retireAgeOf() w engine.js)
   Kariery nie kończy sztywna liczba 40. Kończy ją ciało i głowa:
   zawodowiec z profesjonalizmem 99 dojeżdża nawet do 45. roku życia,
   a patus z profesjonalizmem poniżej 20 pakuje bus zaraz po trzydziestce —
   chyba że ma taki OVR, że kluby wciąż płacą mu za same punkty.
   ============================================================ */
const RETIRE={
 base     : 29.5,   // punkt wyjścia: zero profesjonalizmu, zero talentu
 profSpan : 11.5,   // pełne 99 profesjonalizmu dokłada tyle lat
 ovrSpan  : 4.2,    // sam talent (OVR) dokłada maksymalnie tyle lat
 ovrRef   : 55,     // OVR neutralny — poniżej niego talent zaczyna zabierać lata
 ovrFloor : -2.0,   // ile lat maksymalnie zabiera bardzo niski OVR
 min      : 28,     // niżej nie schodzimy
 max      : 45,     // twardy sufit
 /* Ostatnie lata przed wyliczoną granicą to loteria: ciało potrafi odmówić
    wcześniej, a im gorszy profesjonalizm, tym częściej. */
 wobbleFrom : 2,
 wobbleP    : 26,
 wobbleMin  : 30    // loteria "cialo odmowilo wczesniej" wchodzi dopiero po trzydziestce
};
 
/* ============================================================
   KONTUZJE — TO MA BOLEĆ
   injuryP liczone jest NA SEZON, a potem rozbijane na kolejki
   (S.injPerRound w engine.js). Przy tych wartościach zawodnik
   z profesjonalizmem 50 łapie uraz mniej więcej co trzeci sezon,
   a patus z profesjonalizmem 10 — prawie co drugi.
   ============================================================ */
const INJ={
 base    : 19,     // bazowe % szans na uraz w sezonie
 profW   : 0.26,   // ile dokłada każdy brakujący punkt profesjonalizmu
 ageFrom : 31,     // od tego wieku ciało regeneruje się gorzej
 ageW    : 1.6,    // p.p. za każdy rok powyżej
 equipW  : 7,      // zajeżdżony sprzęt też łamie obojczyki (skala 0-100)
 outMin  : 2,      // minimum opuszczonych spotkań
 outMax  : 7,      // maksimum przy zwykłym urazie
 badP    : 14,     // % szans, że uraz jest ciężki...
 badMin  : 8, badMax:13,   // ...i wtedy pauza jest taka
 dmgMin  : 1, dmgMax:4,    // ile OVR zabiera uraz
 /* ============================================================
    KONTUZJE, PO KTÓRYCH NIE MA SEZONU — ZERWANE WIĘZADŁA / ZŁAMANE UDO
    Do tej pory najgorsze, co mogło się stać, to pauza 8-13 spotkań: gracz
    wracał w tym samym roku i sezon dawało się jeszcze uratować. W żużlu
    zerwane więzadła krzyżowe albo złamana kość udowa to nie „13 meczów",
    to CAŁY ROK: operacja, rehabilitacja, powrót dopiero w kolejnym sezonie.
    catP liczone jest OD URAZU (a nie od sezonu): raz na kilkanaście urazów
    trafia się ten, po którym pakuje się bus na dwanaście miesięcy.
    ============================================================ */
 catP      : 7,            // % szans, że złapany uraz jest katastrofalny
 catDmgMin : 5,            // ...i wtedy zabiera tyle OVR
 catDmgMax : 11,
 catSeasons: 1             // ile PEŁNYCH kolejnych sezonów wypada z gry (p.longInjury)
};
 
/* ============================================================
   NIEOCZEKIWANE ZDARZENIA W TRAKCIE SEZONU
   ------------------------------------------------------------
   Rzeczy, o których nie decyduje ani ekran zdarzenia, ani twoja forma
   z poprzedniej kolejki. Losowane PRZED KAŻDĄ KOLEJKĄ, niezależnie od siebie:
     halfSquad — pół kadry w szpitalu, trener nie ma z kogo układać składu
     jumpIn    — wskakujesz do składu (ktoś zachorował, komuś zabrali licencję)
     formUp    — nagły wzrost formy: silnik nagle chodzi, ty jedziesz jak nie ty
     formDown  — nagły zjazd formy: to samo, tylko w drugą stronę
     dropOut   — nagle wypadasz ze składu, choć nic złego nie zrobiłeś
   Każdy typ ma osobno maksymalnie 1% szans na kolejkę, łącznie 5% (cap total).
   Chcesz to nastroić? Zmieniasz liczby tutaj, silnika nie ruszasz.
   ============================================================ */
const SURPRISE={
 halfSquad : 1,     // % na kolejkę
 jumpIn    : 1,
 formUp    : 1,
 formDown  : 1,
 dropOut   : 1,
 total     : 5,     // twardy sufit sumy powyższych (silnik skaluje, gdy ktoś przesadzi)
 formUpMin : 6, formUpMax : 11,     // ile punktów dyspozycji dokłada/zabiera skok formy
 formDownMin: 6, formDownMax: 11,
 jumpBias  : 40,    // ile „punktów wartości" dokłada trenerowi decyzja o wstawieniu cię
 halfShare : 0.5    // jaka część kadry wypada przy zbiorowej kraksie/grypie
};

/* ============================================================
   EKONOMIA GRACZA — ŻEBY LICZYĆ KAŻDY GROSZ
   Wcześniej pieniądze tylko wpływały. Teraz istnieje druga strona
   przelewu: bus, paliwo, hotele, dom. Do tego młody zawodnik NIE
   zarabia stawki seniora, nawet jeśli ma ją wpisaną w kontrakcie —
   reszta „idzie na jego rozwój” (i na nowy samochód prezesa).
   ============================================================ */
const ECON={
 liveBase   : 46000,                        // roczny koszt życia na starcie
 liveAge    : 3200,                         // każdy rok powyżej 18 lat
 /* KL Z 0.90 NA 0.72, E2 Z 1.12 NA 1.05: przy analizie budżetu okazało się,
    że nawet DOROSŁY zawodnik dopasowany poziomem do klubu KLŻ kończył sezon
    kilkadziesiąt tysięcy złotych pod kreską — różnica w kosztach życia
    między ligami (1.56:1.24:1) była dużo mniejsza niż różnica w stawce za
    punkt (5:2,4:1), więc dolne ligi strukturalnie nie miały szans wyjść na
    zero. Mniejsze miasteczko KLŻ to i tańszy wynajem, i krótsze wyjazdy. */
 liveLeague : {EL:1.40, E2:1.05, KL:0.72},  // w Ekstralidze wszystko jest droższe
 liveIdle   : 0.55,                         // rok bez klubu = tańsze życie, ale wciąż koszt
 liveAmat   : 0.50,                         // amator mieszka u mamy i jeździ klubowym sprzętem
 /* Mnożnik stawki za punkt wg wieku: junior dostaje ułamek tego, co ma na papierze. */
 youngRate  : {16:0.40, 17:0.46, 18:0.54, 19:0.62, 20:0.72, 21:0.82, 22:0.90, 23:0.96},
 /* Serwis posezonowy — zawodowiec musi rozebrać, umyć i złożyć sprzęt. */
 svcBase    : 12000,
 svcPerHeat : 1200,
 svcEquipW  : 140,                          // im lepszy sprzęt, tym droższy serwis
 /* SERWIS WEDŁUG LIGI: rachunek za tuning był do tej pory SZTYWNY, niezależny
    od klasy rozgrywkowej — podczas gdy stawka za punkt (rateBase) różni się
    między ligami prawie pięciokrotnie (EL 2400 / E2 1150 / KL 480 zł/pkt).
    Efekt: w KLŻ, przy pełnym sezonie (ok. 70-90 biegów), serwis sam w sobie
    potrafił przekroczyć CAŁE zarobki z ligi — zawodnik przegrywał finansowo
    każdy sezon niezależnie od formy. Lokalny warsztat w Krajowej Lidze nie
    kosztuje tyle, co fabryczny serwis w Ekstralidze — teraz to widać w cenie. */
 svcLeague  : {EL:1.30, E2:0.80, KL:0.42},
 /* Odstępne za mechanika: tyle procent ceny odzyskujesz, oddając go dalej. */
 mechBuyout : 0.35,
 /* ALIMENTY — jedna zima w Argentynie, osiemnaście lat przelewów.
    Kwota jest sztywna i schodzi z budżetu po KAŻDYM sezonie, dopóki
    licznik p.alimony nie zejdzie do zera. Sąd nie interesuje się tym,
    czy miałeś kontuzję i czy klub ci zapłacił. */
 alimony    : 45000,
 alimonyYrs : 18
};
 
/* ============================================================
   OCENA SEZONU — WAGI (czyta je seasonScore() w engine.js)
   Ocena to NIE jest sucha średnia biegowa. Zawodnik, który wrócił
   z gipsu na cztery mecze i uratował klub w barażu, nie może dostać
   „BEZNADZIEJNEJ” tylko dlatego, że nie zdążył nabić biegów.
   ============================================================ */
const GRADE={
 shrinkW : 20,    // przy tylu biegach ocena jest w połowie drogi między twoją średnią a średnią ligi
 neutral : 1.25,  // średnia „szarego zawodnika ligowego” — do niej ciągniemy małe próby
 volume  : 0.16,  // premia za odjeżdżenie pełnego sezonu
 champ   : 0.30,  // mistrzostwo ligi
 podium  : 0.14,  // podium play-off
 promo   : 0.28,  // awans do wyższej ligi
 saved   : 0.20,  // utrzymanie wywalczone w play-downie/barażu
 releg   : -0.12, // spadek
 dmpj    : 0.18,  // drużynowe mistrzostwo Polski juniorów
 medal   : [0, 0.34, 0.20, 0.12],  // złoto / srebro / brąz w turnieju indywidualnym
 injW    : 0.025, // za każde spotkanie opuszczone przez kontuzję (do injMax)
 injMax  : 0.14,
 bonusPts: 0.06,  // za sezon z 8+ punktami bonusowymi (jazda na kolegę)
 /* ------------------------------------------------------------
    POZYCJA W STATYSTYKACH INDYWIDUALNYCH LIGI (patch 21.08.2026)
    Sezon ocenia się nie tylko po własnej średniej, ale też po tym, JAK
    WYPADŁEŚ NA TLE KONKURENCJI Z TEJ SAMEJ LIGI I TEJ SAMEJ KATEGORII
    WIEKOWEJ — junior porównywany z juniorami, senior z seniorami.
    Średnia 1,60 w Ekstralidze i średnia 1,60 w Krajowej Lidze to dwie
    zupełnie różne rzeczy; ranking to wreszcie widzi.
    indRankW  — maksymalna premia za 1. miejsce w swojej kategorii,
    indRankP  — maksymalna kara za ostatnie miejsce,
    indRankMin— minimalna liczba startów, żeby ranking w ogóle liczył.
    ------------------------------------------------------------ */
 indRankW  : 0.34,
 indRankP  : -0.16,
 indRankMin: 12,
 /* SUKCESY W CYKLU ŚWIATOWYM — inna półka niż mistrzostwa Polski */
 imsMedal  : [0, 0.60, 0.40, 0.26],
 imsTop8   : 0.12
};
 
/* `budget` = z czym wchodzisz w dorosłość. U większości klas jest UJEMNY:
   bus na kredyt, kevlar na raty, dług u ojca za pierwszy silnik. Pierwsze
   sezony to nie budowanie majątku, tylko wychodzenie na zero. */
/* ------------------------------------------------------------
   KLASY POSTACI — WIDEŁKI POTENCJAŁU (zmiana 22.08.2026)
   ------------------------------------------------------------
   Zgłoszenie: „zrób wyższe widełki potencjału dla zawodników niższych klas,
   jak Okno życia, żeby nie było to ekstremalnie nisko". Racja — stary sufit
   46 punktów przy Oknie życia oznaczał, że ta klasa NIGDY nie miała szansy
   wyjść poza Krajową Ligę, choćby gracz zrobił wszystko idealnie: sufit
   talentu obcinał rozwój na poziomie, na którym w Ekstralidze jeżdżą
   młodzieżowcy. Widełki są teraz wyraźnie szersze i ZACHODZĄ NA SIEBIE —
   dolny koniec Okna życia to dalej dramat, ale górny koniec daje realną,
   choć rzadką, drogę do ligowego średniaka.
   Do tego doszedł drugi mechanizm (patrz resolveSeason w engine.js):
   PROFESJONALIZM PODNOSI SAM SUFIT. Zawodnik, który przez lata żyje jak
   zawodowiec, przesuwa swój potencjał w górę o punkt, dwa na sezon —
   dzięki temu „chłopak z rubryki" po dekadzie ciężkiej roboty może dobić
   nawet w okolice 90. To ma być wyjątek nagradzający konsekwencję,
   a nie standardowa ścieżka.
   ------------------------------------------------------------ */
