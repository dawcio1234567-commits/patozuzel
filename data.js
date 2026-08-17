/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   data.js — statyczna "baza danych" gry (balans, klasy postaci,
   kluby, sprzęt, zdarzenia losowe, progi upadłości, imiona/nazwiska)
   ============================================================ */
 
/* ============================================================
   METRYCZKA GRY + CHANGELOG
   Wyświetlane na ekranie tytułowym (scCreate w index.html).
   Najnowszy wpis na górze.
   ============================================================ */
const GAME_UPDATE='17.08.2026';
const GAME_X='@polskizuzlowiec';
const CHANGELOG=[
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

const BAL={
 leagueW : 0.55,   // udział średniej ligi w punkcie odniesienia (reszta: własny klub)
 belowPen: 2.60,   // mnożnik kary za pierwsze 10 pkt poniżej odniesienia
 knee    : 10,     // do ilu punktów obowiązuje ostra kara
 farPen  : 1.05,   // mnożnik kary powyżej "kolana"
 abovePow: 0.58,   // przewaga nad odniesieniem liczy się łagodniej niż kara
 refDrop : 7.0,    // przelicznik: średnia OVR klubu -> średni OVR jadącego zawodnika
 sigma   : 11.0,    // losowość jednego biegu (tor, taśma, szczęście)
 home    : 2.4,    // atut własnego toru
 rounds  : 14      // kolejek w sezonie zasadniczym
};
 
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
 liveLeague : {EL:1.40, E2:1.12, KL:0.90},  // w Ekstralidze wszystko jest droższe
 liveIdle   : 0.55,                         // rok bez klubu = tańsze życie, ale wciąż koszt
 liveAmat   : 0.50,                         // amator mieszka u mamy i jeździ klubowym sprzętem
 /* Mnożnik stawki za punkt wg wieku: junior dostaje ułamek tego, co ma na papierze. */
 youngRate  : {16:0.40, 17:0.46, 18:0.54, 19:0.62, 20:0.72, 21:0.82, 22:0.90, 23:0.96},
 /* Serwis posezonowy — zawodowiec musi rozebrać, umyć i złożyć sprzęt. */
 svcBase    : 12000,
 svcPerHeat : 1200,
 svcEquipW  : 140,                          // im lepszy sprzęt, tym droższy serwis
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
 bonusPts: 0.06   // za sezon z 8+ punktami bonusowymi (jazda na kolegę)
};
 
/* `budget` = z czym wchodzisz w dorosłość. U większości klas jest UJEMNY:
   bus na kredyt, kevlar na raty, dług u ojca za pierwszy silnik. Pierwsze
   sezony to nie budowanie majątku, tylko wychodzenie na zero. */
const CLASSES=[
 {id:'okno', n:'Okno życia',                 ovr:[1,10],  pot:[22,46], prof:[5,30],  med:[0,15], budget:-14000, d:'Klub bierze cię, bo ktoś musi wypełnić rubrykę. Jeździsz dla siebie i dla mamy. Bus po dziadku, rata jeszcze leci.'},
 {id:'lic',  n:'Licencja żeby klub był bez kar', ovr:[11,25], pot:[34,60], prof:[10,40], med:[0,20], budget:-11000, d:'Istniejesz wyłącznie po to, żeby regulamin się zgadzał.'},
 {id:'bez',  n:'Bezjajeczny grajek',         ovr:[26,40], pot:[48,74], prof:[20,55], med:[5,30], budget:-8000, d:'Umiesz jeździć, ale w pierwszym łuku zawsze puszczasz gaz.'},
 {id:'pot',  n:'Jakiś potencjał jest',       ovr:[41,50], pot:[60,84], prof:[30,65], med:[10,40],budget:-5000, d:'Trener mówi "on ma to coś". Trener mówi tak od czterech lat.'},
 {id:'tal',  n:'Wielki talent',              ovr:[51,60], pot:[72,93], prof:[35,75], med:[20,55],budget:0, d:'Portale piszą o tobie w każdą środę. Ciśnienie rośnie.'},
 {id:'zma',  n:'Następca Zmarzliny',         ovr:[61,67], pot:[84,99], prof:[40,80], med:[35,75],budget:6000, d:'Etykieta cięższa niż silnik. Albo hala sław, albo hala odlotów.'}
];
 
/* ---------- BAZA KLUBÓW ---------- */
function C(name,ovr,budget){return{name,ovr,budget,debt:0,mood:R(30,80)};}
const BASE_LEAGUES=()=>({
 EL:{name:'EKSTRALIGA', short:'PGE EL', clubs:[
   C('WUTEES Wrocław',95,10000000),
   C('Patodeweloperka Toruń',93,9500000),
   C('ŁUNIA Leszno',90,5000000),
   C('BAYERN GTŻ Grudziądz',88,3500000),
   C('ROWER Lublin',85,12000000),
   C('MOSIĄDZ Gorzów',82,2500000),
   C('BALUBAZ Zielona Góra',79,4000000),
   C('WŁÓK Częstochowa',68,5000000)
 ]},
 E2:{name:'2. EKSTRALIGA', short:'2. EL', clubs:[
   C('BOLONIA Bydgoszcz',72,3000000),
   C('NADMORZE Gdańsk',70,2600000),
   C('MOSIĄDZ Rzeszów',68,2400000),
   C('SCHEISSE Landshut',66,2000000),
   C('OSTRO OSTRÓW',64,1800000),
   C('KSM Krosno',62,1600000),
   C('MRÓZ Rybnik',60,1500000),
   C('CMENTARZ Łódź',57,1200000)
 ]},
 KL:{name:'KRAJOWA LIGA ŻUŻLOWA', short:'KLŻ', clubs:[
   C('META Gniezno',52,900000),
   C('MOTORNICZY Opole',50,850000),
   C('ŁUNIA Tarnów',48,800000),
   C('LOKOMOTYWA Daugavpils',46,750000),
   C('MOTORNICZY Rawicz',44,700000),
   C('BANDA Kraków',42,600000),
   C('BOLONIA Piła',40,550000),
   C('GERMANIA Świętochłowice',38,500000)
 ]}
});
 
const LKEYS=['EL','E2','KL'];
 
/* ---------- WARSZTAT ----------
   Kolejność = drabinka: im wyżej, tym drożej i tym lepiej. Nic tu nie jest tanie,
   bo w tym sporcie nic tanie nie jest.
   `prof` = próg profesjonalizmu. Sprzęt z górnej półki nie idzie do każdego, kto
   ma gotówkę: tuner nie odda czterech silników komuś, kto gubi termin przeglądu,
   a sztab z Anglii nie podpisze się pod zawodnikiem, który śpi w busie do 11:00.
   `risk` = szansa, że zapłacisz i dostaniesz bubla. */
const TUNERS=[
 {n:'Używany silnik z OLX ("mało jeżdżony, garażowany")',  c:22000,   e:3,  risk:35, prof:0},
 {n:'Szlif u Ryśka "Turbo" z Gorzowa',                     c:60000,   e:7,  risk:18, prof:0},
 {n:'Kadłub po sezonie od kolegi z 2. Ekstraligi',         c:95000,   e:10, risk:12, prof:15},
 {n:'Rama Ellis + komplet nowych kół',                     c:145000,  e:12, risk:0,  prof:20},
 {n:'Silnik po tuningu u R. Kowalskiego',                  c:215000,  e:16, risk:4,  prof:30},
 {n:'Dwa silniki od Kowalskiego + serwis w trakcie sezonu',c:340000,  e:21, risk:2,  prof:42},
 {n:'Pakiet GM prosto od angielskiego tunera',             c:480000,  e:26, risk:0,  prof:55},
 {n:'Cztery silniki od topowego tunera + skrzynia części', c:720000,  e:32, risk:0,  prof:66},
 {n:'Pełen program: 6 silników, dwie ramy, tuner na wyłączność', c:1150000, e:40, risk:0, prof:78}
];
const MECHS=[
 {n:'Szwagier Mirek (pomaga po godzinach)',            q:15, c:14000,   prof:0},
 {n:'Zbychu z warsztatu za torem',                     q:32, c:55000,   prof:0},
 {n:'Chłopak z parku maszyn, zna się na dwutaktach',   q:45, c:110000,  prof:12},
 {n:'Solidny mechanik z Leszna',                       q:60, c:190000,  prof:25},
 {n:'Duński specjalista od GM',                        q:74, c:340000,  prof:40},
 {n:'Dwóch ludzi na etacie + bus serwisowy',           q:84, c:520000,  prof:55},
 {n:'Team manager z Anglii + dwóch ludzi',             q:91, c:780000,  prof:68},
 {n:'Sztab jak u mistrza świata (tuner, mechanik, fizjo)', q:97, c:1250000, prof:82}
];
 
/* ============================================================
   3. ZDARZENIA LOSOWE — SILNIK WARUNKÓW
   ------------------------------------------------------------
   Każdy event może mieć OPCJONALNY warunek cond(p, c, S):
     p — obiekt Gracza (G.p)
     c — jego aktualny klub (obiekt z G.leagues) albo null, gdy Gracz jest bez kontraktu
     S — stan/kontekst sezonu (G.S). Najważniejsze pola:
           S.round   — kolejka, w której wypada sytuacja
                       (1-14 = sezon zasadniczy, 15-16 = play-off / baraże)
           S.matches — ile kolejek już się odbyło
           S.atm     — atmosfera w drużynie (0-100)
   Brak klucza `cond` = event dostępny zawsze.
 
   BALANS (twardo trzymany):
     · OVR                    : zmiany maksymalnie 1-3 pkt
     · prof / med / lojalność : maksymalnie kilkanaście punktów (do 15)
     · atmosfera              : do ±15
     · kary PZM / klubowe     : realne kwoty z polskiego żużla
     · ryzyko urazu, defektu i szans na biegi liczone w punktach procentowych
   ============================================================ */
 
/* --- SKRÓTY DO EFEKTÓW ---
   Każdy helper zmienia stan gry i zwraca gotową linijkę do raportu z sezonu. */
const sgn   = d => (d>0?'+':'')+d;
const fxP   = d => { G.p.prof   = cl(G.p.prof+d,0,99);      return sgn(d)+' Profesjonalizm'; };
const fxM   = d => { G.p.med    = cl(G.p.med+d,0,99);       return sgn(d)+' Medialność'; };
const fxO   = d => { G.p.ovr    = cl(G.p.ovr+d,1,99);       return sgn(d)+' OVR'; };
const fxL   = d => { G.p.loyalty= cl(G.p.loyalty+d,0,100);  return sgn(d)+' Lojalność'; };
const fxA   = d => { G.S.atm    = cl(G.S.atm+d,0,100);      return sgn(d)+' atmosfera w drużynie'; };
const fxE   = d => { G.p.equip  = cl(G.p.equip+d,1,99);     return sgn(d)+' Sprzęt'; };
const fxT   = d => { G.S.teamOvr += d;                      return sgn(d)+' OVR drużyny'; };
const fxOB  = d => { G.S.ovrBonus += d;                     return sgn(d)+' OVR w meczach tego sezonu'; };
const fxH   = d => { G.S.heatPP += d;                       return sgn(d)+' p.p. szans na biegi'; };
const fxHN  = d => { G.p.next.heatPP += d;                  return sgn(d)+' p.p. szans na biegi w kolejnym sezonie'; };
const fxI   = d => { G.S.injuryPP += d;                     return sgn(d)+' p.p. ryzyka urazu'; };
const fxIN  = d => { G.p.next.injuryPP += d;                return sgn(d)+' p.p. ryzyka urazu w kolejnym sezonie'; };
const fxDef = d => { G.S.extraDefP += d/100;                return sgn(d)+' p.p. szansy na defekt'; };
const fxK   = k => { G.p.budget += k;                       return (k>=0?'+':'-')+zl(Math.abs(k)); };
const fxFine= k => { G.p.budget -= k; G.S.fines += k;       return 'Kara '+zl(k); };
const fxBan = n => { G.S.banMatches += n;                   return 'Pauza: '+n+(n===1?' spotkanie':' spotkania'); };
const fxFit = d => { G.S.equipFit = cl(G.S.equipFit-d,0,100); return 'Dopasowanie sprzętu: '+G.S.equipFit+'%'; };
const fxRate= m => { G.S.rateMul *= m; return 'Stawka za punkt w tym sezonie '+(m>=1?'+':'')+Math.round((m-1)*100)+'%'; };
const fxRateN=m => { G.p.next.rateMul = m; return 'Stawka za punkt w kolejnym sezonie '+(m>=1?'+':'')+Math.round((m-1)*100)+'%'; };
const fxEnd = why => { G.p.retired=true; G.p.retireReason=why; G.S.forcedEnd=true; return 'KONIEC KARIERY: '+why; };

/* --- fxS: GENERYCZNY SETTER POLA STANU SEZONU ---
   Część zdarzeń w data.js była pisana skrótem `fxS('banMatches', 14)`, ale
   samego helpera nikt nigdy nie napisał. Efekt: przy wyborze takiej opcji
   `o.f()` leciało ReferenceError, a `chooseEv()` (index.html) NIE miało
   try/catch — gra zatrzymywała się na ekranie zdarzenia i nie dało się
   przejść dalej. Teraz helper istnieje, dokłada wartość do G.S i zwraca
   czytelną linijkę do raportu. */
const FXS_LABEL = {
 banMatches : n => 'Pauza: '+n+(n===1?' spotkanie':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?' spotkania':' spotkań'),
 heatPP     : d => sgn(d)+' p.p. szans na biegi',
 injuryPP   : d => sgn(d)+' p.p. ryzyka urazu',
 teamOvr    : d => sgn(d)+' OVR drużyny',
 ovrBonus   : d => sgn(d)+' OVR w meczach tego sezonu',
 fines      : k => 'Kara '+zl(k),
 extraDefP  : d => sgn(d)+' p.p. szansy na defekt'
};
const fxS = (key, val) => {
 if(!G.S) return String(key)+': '+val;
 const cur = G.S[key];
 if(typeof cur === 'number' || cur === undefined) G.S[key] = (cur||0) + val;
 else G.S[key] = val;
 return FXS_LABEL[key] ? FXS_LABEL[key](val) : (String(key)+' '+sgn(val));
};

/* --- fxApply: JEDNA BRAMA DLA WSZYSTKICH SKUTKÓW ZDARZENIA ---
   Skąd brało się „[object Object]" w rubryce EFEKTY:
   większość zdarzeń zwraca z `f()` tablicę STRINGÓW (helpery fx* same
   zwracają gotowy tekst), ale kilkadziesiąt opcji napisano w drugim,
   nigdy nieobsłużonym formacie — deskryptorze { t:'opis', f:(p)=>... }.
   UI robiło na takim wpisie esc(obiekt) → „[object Object]", a funkcja
   `f` z deskryptora NIGDY się nie wykonywała, więc opcja nie miała żadnych
   skutków poza tekstem-śmieciem.
   fxApply() spłaszcza cokolwiek zwróci zdarzenie, odpala odroczone `f(p)`
   i oddaje czystą listę linijek do wyświetlenia. */
function fxApply(out){
 const txt=[];
 const walk = item => {
   if(item==null || item===false) return;
   if(Array.isArray(item)){ item.forEach(walk); return; }
   if(typeof item==='string'){ if(item.trim()) txt.push(item.trim()); return; }
   if(typeof item==='number'){ txt.push(String(item)); return; }
   if(typeof item==='function'){                       // efekt podany samą funkcją
     try{ walk(item(G.p)); }catch(e){ txt.push('(efekt nie doszedł do skutku: '+e.message+')'); }
     return;
   }
   if(typeof item==='object'){
     if(typeof item.f==='function'){
       try{ item.f(G.p); }catch(e){ txt.push('(efekt nie doszedł do skutku: '+e.message+')'); }
     }
     const t = item.t!=null ? item.t : item.txt!=null ? item.txt : item.text!=null ? item.text : item.l;
     if(t!=null && String(t).trim()) txt.push(String(t).trim());
     return;
   }
   txt.push(String(item));
 };
 walk(out);
 return txt;
}

/* --- WALKOWER — MECZ, KTÓRY SIĘ NIE ODBYŁ ---
   Wcześniej `G.S.walkower=true` powodowało wyłącznie to, że Gracz nie jechał
   w jednej kolejce, a mecz i tak rozgrywał się normalnie i wchodził do tabeli
   z prawdziwym wynikiem. Teraz flaga naprawdę przerywa spotkanie.
   mode:
     'lose' — twoja drużyna oddaje mecz walkowerem (0:75), rywal bierze 2 pkt
     'win'  — rywal się nie stawia (75:0 dla ciebie)
     'both' — obustronny walkower: 0:0, obie drużyny bez punktów meczowych
     'void' — mecz nierozegrany i nieweryfikowany (nikt nie dostaje nic)
   pen — ile punktów w tabeli traci twoja drużyna (przy 'both' traci tyle samo rywal). */
const fxWalk = (mode, pen) => {
 G.S.walkower = true;
 G.S.walkMode = mode || 'lose';
 G.S.walkPen  = pen || 0;
 return ({lose:'WALKOWER: oddajecie spotkanie 0:75.',
          win :'WALKOWER: rywal się nie stawił — 75:0 dla was.',
          both:'OBUSTRONNY WALKOWER: mecz nieodbyty, 0:0.',
          void:'MECZ NIEROZEGRANY: wynik anulowany, nikt nie dostaje punktów.'}[G.S.walkMode])
        + (pen?' Kara w tabeli: -'+pen+' pkt'+(G.S.walkMode==='both'?' dla obu drużyn.':' dla twojej drużyny.'):'');
};

/* --- BARDZO DŁUGA KONTUZJA — ZERWANE WIĘZADŁA / ZŁAMANE UDO ---
   Kończy TEN sezon i zabiera CAŁY kolejny (p.longInjury). Czyta to
   startSeason() i playerRoundStatus() w engine.js. */
const fxLongInj = (what) => {
 const p=G.p;
 p.longInjury = Math.max(p.longInjury||0, INJ.catSeasons);
 const dmg = R(INJ.catDmgMin, INJ.catDmgMax);
 p.ovr = cl(p.ovr-dmg, 1, 99);
 G.S.forcedEnd = true;
 G.S.longInjuryNew = (what||'Zerwane więzadła krzyżowe.');
 G.S.longInjuryDmg = dmg;
 return 'KONIEC SEZONU I CAŁY KOLEJNY ROK POZA TOREM: '+(what||'zerwane więzadła krzyżowe')+
        ' (-'+dmg+' OVR). Operacja, rehabilitacja, powrót najwcześniej za dwa lata.';
};

/* --- ALIMENTY --- */
const fxAlimony = () => {
 G.p.alimony = ECON.alimonyYrs;
 return 'ALIMENTY DO ARGENTYNY: '+zl(ECON.alimony)+' co sezon przez '+ECON.alimonyYrs+' lat.';
};
 
const EVENTS=[
 
/* ===== MEDIA, INTERNET I INNE PATOLOGIE ===== */
{id:'zmarzl', t:'AFERA „ZMARZŁEŚ”',
 x:'Miałeś wypadek, po którym trafiłeś do szpitala. Grupa śmieszków żartowała, że zmarzłeś. Potem poszła fama, że to przez ciebie zablokowano im konto z memami.',
 o:[
  {l:'Dementuję wszystko, ale przyznaję, że było zabawne.', f:()=>[fxP(-2), fxA(1), 'Pół parku maszyn i tak myśli, że to ty zgłosiłeś.']},
  {l:'Nie robię nic — potem tłumaczę ludziom, że to nie moja wina.', f:()=>[fxM(-5), 'Tydzień odpowiadania na komentarze. Nikt nie uwierzył.']},
  {l:'Udostępniam i robię z tego bekę.', f:()=>[fxP(-5), fxM(5), 'Prezes dzwonił. Nie odebrałeś.']}
 ]},
{id:'karetka', t:'ZMARZŁEŚ W KARETCE',
 x:'Po wypadku jeden z profili tematycznych pisze, że „zmarzłeś w karetce”. Screen leci dalej, twoja mama znowu komentuje.',
 o:[
  {l:'Robię inbę i próbuję zablokować twórców.', f:()=>[fxM(-10), fxP(7), 'Prawnik klubu przynajmniej miał co robić.']},
  {l:'Mówię, że w karetce faktycznie nie było zbyt ciepło.', f:()=>[fxM(10), fxP(-7), 'Cytat wisi teraz na koszulkach.']}
 ]},
{id:'nagrania', t:'WYCIEK PRYWATNYCH NAGRAŃ',
 x:'Ktoś opublikował nagrania, na których śpiewasz „Eniułej, eniułej”, „Słodko-słodka” i „Nie ma mocnych na Mariolę”. Sektor B już się tego nauczył.',
 o:[
  {l:'Skoro wyciekło, to jadę z tym dalej!', f:()=>[fxM(15), fxP(-5), fxA(-7)]},
  {l:'Obracam w żart, ale nowych filmików nie będzie.', f:()=>[fxM(7), fxA(5), fxP(3)]},
  {l:'Usuwajcie to natychmiast!', f:()=>[fxP(7), fxM(-7), fxA(-15), 'Szatnia uznała, że przesadziłeś.']}
 ]},
{id:'lech', t:'PYTANIE ZE STADIONU LECHA',
 x:'Odjechałeś zawody w Poznaniu. Internetowy śmieszek pyta na wizji: „kurwy i śmiecie z Poznania nie wyjedziecie — wolałbyś być kurwą czy śmieciem?”.',
 o:[
  {l:'Kurwą.',  f:()=>[fxP(2), fxM(-2)]},
  {l:'Śmieciem.', f:()=>[fxM(2), fxP(-2)]},
  {l:'Oddaję głos do studia i wracam malować sufit.', f:()=>['Nic się nie dzieje. Sufit wyszedł równo.']}
 ]},
{id:'opowiadanie', t:'DZIENNIKARZ I OPOWIADANIE',
 x:'Przychodzi do ciebie dziennikarz gazety sportowej i pyta, czy przeczytasz z nim na wizji pewne opowiadanie z internetu.',
 o:[
  {l:'Jasna sprawa, Przemo.', f:()=>[fxM(10), fxP(-10)]},
  {l:'Ty chory pojebie.',     f:()=>[fxP(10), fxM(-5)]}
 ]},
{id:'muka', t:'PATEUSZ MUKA PISZE O TOBIE PASZKWIL NA X-ie',
 x:'Wątek na 14 tweetów: „Dlaczego ten zawodnik jest symbolem upadku polskiego żużla — analiza”. Pod spodem 400 komentarzy i twoja mama pisząca „nieprawda”.',
 o:[
  {l:'Nie reaguję.', f:()=>[fxP(5), fxM(-5)]},
  {l:'„Staram się nie wymiotować, jak patrzę na pana”.', f:()=>{const b=R(1,2);return [fxM(15), fxP(-15), fxBan(b), 'Regulamin ligi zna słowo „wizerunek”.'];}}
 ]},
{id:'podcast', t:'PODCAST „GADA SIĘ RZURZEL”',
 x:'Dacek Jreczka nalewa ci piwo już w piętnastej minucie i pyta, co naprawdę myślisz o prezesach w tej lidze. Kamera się nagrywa.',
 o:[
  {l:'Mówię wszystko. Nazwiska, kwoty, daty.', f:()=>[fxM(15), fxP(-10), fxFine(15000)+' z PZM za „naruszenie dobrego imienia”']},
  {l:'Mówię o świetnej atmosferze w zespole.', f:()=>[fxM(3), fxP(3), 'Nudno, ale bezpiecznie.']}
 ]},
{id:'pozarlik', t:'WYWIAD Z JULIĄ POŻARLIK',
 x:'Rywal wywiózł cię na płot na wyjściu z drugiego łuku. Adrenalina na maksa, kevlar rozdarty, a przed tobą mikrofon i kamera na żywo.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Patrzę się w jej stopy i plotę głupoty, których nikt nie rozumie.', f:()=>[fxM(-8), fxP(-5), fxA(5), fxOB(2)+' (złość dobrze robi na gaz)']},
  {l:'Odmawiam wywiadu.', f:()=>['Nic się nie dzieje. Absolutnie nic.']}
 ]},
{id:'jezus', t:'WYWIAD Z JEZUSEM ZE SZROTOWIZJI',
 x:'Reporter Szrotowizji, który wygląda jak Jezus, zaprasza cię do wywiadu — po czym przedstawia cię jako zwycięzcę biegu, Kranciszka Franczewskiego.',
 cond:(p)=>p.age<=21,
 o:[
  {l:'„Ale Kranek jest tam, ja Wzymon Szolski jestem”.', f:()=>[fxM(15), 'Klip obejrzała cała liga.']},
  {l:'Udaję Franczewskiego.', f:()=>{const d=R(5,15);return [fxM(5), fxP(d)+' (Kranek się nie zorientował)'];}}
 ]},
{id:'zdrowko', t:'CZY ZE ZDRÓWKIEM JEST OKEJ?',
 x:'Miałeś kraksę, a reporter Szrotowizji wyglądający jak Jezus podbiega z pytaniem, czy ze zdrówkiem jest okej.',
 cond:(p)=>p.age<=21,
 o:[
  {l:'Bluzgam go i każę mu wypierdalać.', f:()=>{const m=R(-10,10);return [fxM(m), fxP(R(-15,-10))];}},
  {l:'Grzecznie odpowiadam.', f:()=>[fxP(5)]}
 ]},
{id:'dj', t:'DJ-ING W KLUBIE',
 x:'Znajomy DJ zaprosił cię do występu w jednym z klubów. Konsola świeci, tłum nagrywa, a ty masz w niedzielę mecz.',
 cond:(p)=>p.med>40,
 o:[
  {l:'Jedna noc nikomu nie zaszkodzi — gram do końca!', f:()=>[fxM(12), fxP(-3)]},
  {l:'Skoro już mnie nagrywają, zróbmy z tego show!',   f:()=>[fxM(15), fxP(-7), fxA(-5)]},
  {l:'Chyba wystarczy tej zabawy. Wracam do domu.',      f:()=>[fxP(7), fxA(5), fxM(-7)]},
  {l:'Spodobało mi się. Chętnie zagram tu ponownie!',    f:()=>[fxM(14), fxP(-5), fxA(-3)]}
 ]},
{id:'taniec', t:'ZAPROSZENIE DO „TAŃCA Z GWIAZDAMI”',
 x:'Produkcja dzwoni w środku okresu startowego. Mówią, że żużel „jest teraz modny” i że potrzebują kogoś z charakterem. Honorarium jest większe niż twój kontrakt.',
 cond:(p)=>p.med>30,
 o:[
  {l:'Idę tańczyć.', f:()=>[fxM(15), fxP(-15), fxK(100000), fxH(-10)+' (treningi odpadły)']},
  {l:'Odmawiam, mam sezon.', f:()=>[fxP(5), fxM(-5)]}
 ]},
{id:'tiktok', t:'PREZES ZAKAZUJE ZAWODNIKOM TIKTOKA',
 x:'Regulamin wewnętrzny 14b: „zakaz publikowania treści z parku maszyn”. Powodem jest filmik kolegi, który pokazał, ile klub mu zalega.',
 cond:(p)=>p.med>20,
 o:[
  {l:'Wrzucam i tak.', f:()=>[fxM(15), fxP(-5), fxL(-10), fxFine(10000)+' (regulaminowa)']},
  {l:'Kasuję konto.',  f:()=>[fxM(-10), fxP(10), fxL(10)]}
 ]},
{id:'gwiazda', t:'AGENT MARKETINGOWY Z WARSZAWY',
 x:'Facet w marynarce na gołe ciało mówi, że „zbudował markę trzem sportowcom” i chce 30% od wszystkiego w zamian za duży hajs z reklam.',
 cond:(p)=>p.med>=70,
 o:[
  {l:'Podpisuję z nim układ.', f:()=>{const k=R(50000,150000);return [fxK(k)+' z kontraktów reklamowych', fxM(10), fxH(-5)+' (sesje zdjęciowe zamiast treningu)'];}},
  {l:'Nie oddam procentów komuś, kto nie umie odpalić motocykla.', f:()=>[fxP(8), 'Agent obsmarował cię na LinkedInie.']}
 ]},
{id:'lombard', t:'LOMBARD „SZYBKA GOTÓWKA” CHCE BYĆ NA TWOIM KEVLARZE',
 x:'Logo miałoby zajmować cały tył, pod numerem. Właściciel mówi, że to „inwestycja w lokalny sport”, a jego trzej pracownicy stoją przy wejściu i nic nie mówią.',
 o:[
  {l:'Biorę, kevlar i tak jest brzydki.', f:()=>[fxK(40000), fxM(-15)]},
  {l:'Dziękuję, poczekam na normalnego sponsora.', f:()=>[fxM(10)]}
 ]},
{id:'polewaczka', t:'CYTAT NA POLEWACZCE',
 x:'Prezes pyta, czy pomożesz mu nakleić na polewaczkę cytat pewnego austriackiego akwarelisty. Ma już wydrukowaną folię.',
 o:[
  {l:'Ja wohl.', f:()=>[fxL(5), fxM(15), fxP(-15), fxFine(5000)+' z PZM']},
  {l:'Nie.',     f:()=>[fxP(10), 'Prezes obraził się na dwa tygodnie.']}
 ]},
{id:'pies', t:'PIES ZE SCHRONISKA',
 x:'Lokalne schronisko prosi, żebyś wziął od nich psa. Zdjęcie już wisi na ich fanpage’u, podpisane twoim nazwiskiem.',
 o:[
  {l:'No pewnie, kochany zwierzak.', f:()=>[fxO(1)+' (spacery to też trening)', fxM(10)]},
  {l:'Jebać tego kundla.',           f:()=>[fxO(-1), fxM(-15)]}
 ]},
{id:'wejscie', t:'WEJŚCIE NA LEWO',
 x:'Starszy pan prosi cię o załatwienie wejścia na lewo na lokalną rundę SGP. Mówi coś o rekordzie obejrzanych rund i pokazuje zeszyt.',
 o:[
  {l:'Wpuszczam go.', f:()=>{G.p.next.forceClub='weak';return [fxM(-15), 'Ochrona zapamiętała twoją twarz.','W kolejnym sezonie zostaje ci kontrakt w słabym klubie z najniższej ligi.'];}},
  {l:'Spieprzaj dziadu.', f:()=>[fxP(15)]}
 ]},
 
/* ===== TOR, SĘDZIOWIE, SZATNIA ===== */
{id:'busoprawa', t:'OPRAWA W BUSIE',
 x:'Grupa kibiców prosi cię o pomoc w przemyceniu twoim busem specyficznej oprawy na mecz. W kartonie coś się rusza.',
 cond:(p,c,S)=>S.round>0 && !!c,
 o:[
  {l:'Pomagam i patrzę, jak świnia w szaliku rywali biega po torze.', f:()=>{const l=[fxA(3), fxT(1)];
     if(chance(10)) l.push(fxBan(1)+' — wydział regulaminowy obejrzał nagrania'); else l.push('Nikt niczego nie udowodnił.');
     return l;}},
  {l:'Odmawiam.', f:()=>[fxP(3)]}
 ]},
{id:'przyczepny', t:'PRZYCZEPNY TOR I BUNT',
 x:'Przyjeżdżasz na mecz, na którym gospodarz przygotował tor tak przyczepny, że koledzy z drużyny wywracają się już na próbie toru.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Buntuję ekipę i odmawiamy startu.', f:()=>{const l=[fxA(2), fxWalk('lose',0)];
     if(chance(20)) l.push(fxBan(1)+' — PZM uznał odmowę za twoją inicjatywę'); return l;}},
  {l:'Odjeżdżam pełne spotkanie.', f:()=>[fxP(3), fxI(10)]}
 ]},
{id:'obchod', t:'MĘSKA DECYZJA NA OBCHODZIE TORU',
 x:'Przed meczem obie drużyny robią obchód toru. Po opadach nawierzchnia wygląda jak pole po orce, a spiker już zapowiada „znakomite warunki”.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Męska decyzja — odjeżdżamy spotkanie.', f:()=>[fxP(6), fxA(6)]},
  {l:'Odwołujemy spotkanie.',                 f:()=>[fxP(-2), fxA(-2)]},
  {l:'Sędzia mówi, że tor jest dobry — razem z rywalami odmawiamy jazdy.', f:()=>{
     return [fxP(-7), fxM(15), fxWalk('both',1), 'Obustronny walkower, obie drużyny tracą po punkcie w tabeli.'];}}
 ]},
{id:'przerwanie', t:'CZEKANIE NA PRZERWANIE WYŚCIGU',
 x:'W trakcie meczu rywal wsadza cię w płot na przeciwległej prostej. Leżysz w trawie, silniki jeszcze pracują.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Nic nie robię.', f:()=>[fxP(3)]},
  {l:'Mówię w wywiadzie, że to kawał szmaty i nic więcej.', f:()=>[fxM(6), fxP(-2)]},
  {l:'Wstaję i stoję na środku toru, aż sędzia przerwie wyścig.', f:()=>{
     const l=[fxP(-7), fxM(15), 'Czerwona kartka — wykluczenie z meczu.', fxBan(1)];
     /* Stanie na torze przy pracujących silnikach to nie protest, to loteria. */
     if(chance(12)) l.push('Ostatni zawodnik nie zdążył zejść z gazu i wjechał w ciebie.',
                           fxLongInj('wieloodłamowe złamanie kości udowej po wjechaniu przez rywala'));
     return l;}}
 ]},
{id:'lis', t:'SĘDZIA LIS WYKLUCZA CIĘ NIESŁUSZNIE',
 x:'Dokładnie tak samo, jak w poprzednim biegu wyglądała próba rywala — tam było czysto. Czerwona lampa, ty stoisz z rozłożonymi rękami, stadion buczy.',
 o:[
  {l:'„KURWA MAĆ, NIE BĄDŹ PAN ZAWODNIKIEM DO CHUJA…”', f:()=>[fxM(15), fxP(-15), 'Czerwona kartka w spotkaniu.', fxBan(1)]},
  {l:'Cofam się do parku maszyn i przyjmuję tłumaczenie sędziego.', f:()=>[fxP(10), fxM(-3)]}
 ]},
{id:'sedziamotor', t:'JAZDA NA MOTOCYKLU SĘDZIEGO',
 x:'Sędzia proponuje, że będzie odliczał do trzech przy puszczaniu taśmy, jeśli pozwolisz mu przejechać się na twoim motocyklu.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'„Nie bądź pan zawodnikiem do chuja”.', f:()=>[fxP(3), fxH(-10)]},
  {l:'„Bądź pan zawodnikiem do chuja”.',     f:()=>[fxP(-3), fxH(10)]}
 ]},
{id:'dublowanie', t:'DUBLOWANIE JUNIORA',
 x:'W biegu jedzie tylko trójka zawodników — ty i twój junior z pary. Na trzecim okrążeniu orientujesz się, że możesz go zdublować.',
 cond:(p,c,S)=>p.ovr>75 && S.round>0,
 o:[
  {l:'Hamuję nogami, byle przywiózł punkt.', f:()=>[fxA(8), fxP(-6)]},
  {l:'Dubluję kolegę z pary.',               f:()=>[fxP(7), fxA(-15), fxH(-10)]}
 ]},
{id:'juniormotyw', t:'MOTYWACJA DLA JUNIORA',
 x:'Twój junior traci pozycje na trasie i wraca do parku maszyn ze spuszczoną głową. Patrzy na ciebie jak na wyrocznię.',
 cond:(p,c,S)=>p.age>21 && S.round>0,
 o:[
  {l:'Mówię mu, że mencele go jebią.', f:()=>[fxP(-2), fxA(-2)]},
  {l:'Mówię, że nic się nie stało.',   f:()=>[fxP(2)]}
 ]},
{id:'kaskjuniora', t:'KASK JUNIORA',
 x:'Widzisz, że utalentowany junior jadący z tobą w biegu nie zapiął kasku. Taśma za dziesięć sekund.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Zwracam mu uwagę.', f:()=>[fxP(10)]},
  {l:'Zlewam, co będzie, to będzie.', f:()=>{G.p.next.forceClub='weak';return [fxP(-10), 'Karma działa wolno, ale skutecznie: po sezonie zostaje ci transfer do słabego klubu.'];}}
 ]},
{id:'licencjaz', t:'NOWY TALENT Z LICENCJĄ Ż',
 x:'Junior klubu zdał licencję Ż. W parku maszyn mówi się, że ma taki talent, że za rok zabierze ci miejsce w składzie.',
 cond:(p,c,S)=>p.age>21 && S.round>0,
 o:[
  {l:'Pokazuję mu magię X-Demona i Werandy.', f:()=>[fxH(10)+' do końca sezonu', 'Junior ma teraz inne priorytety.']},
  {l:'Zamknięte oczy, zamknięta banda, otwarte oczy trenera.', f:()=>{G.S.noRenew=true;return [fxBan(2), 'Klub zrywa negocjacje o nowy kontrakt.'];}}
 ]},
{id:'weteran', t:'MŁODY PYTA CIĘ O USTAWIENIA',
 x:'Osiemnastolatek z twojego klubu podchodzi po treningu i pyta, jak ustawiasz zawieszenie na mokry tor. Za trzy lata będzie chciał wygryźć cię ze składu.',
 cond:(p)=>p.age>=30,
 o:[
  {l:'Tłumaczę mu.', f:()=>[fxP(10), fxM(5), fxT(2), fxH(-5)+' (pomagasz konkurencji)']},
  {l:'„Sam się naucz”.', f:()=>[fxM(-5), fxH(5)]}
 ]},
{id:'gaznik', t:'CUDOWNY GAŹNIK',
 x:'Zapominasz założyć dyszę w gaźniku, a motocykl jedzie szybciej niż kiedykolwiek. Zdobywasz czysty komplet punktów i nie masz pojęcia, jak to wytłumaczyć.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Oddaję kierownikowi zawodów drugi, sprawny motocykl.', f:()=>[fxP(-7), fxA(3), 'Nikt się nie zorientował. Prawie nikt.']},
  {l:'Przyznaję się kierownikowi.', f:()=>{G.S.noRenew=true;G.S.teamPts-=1;
     return [fxP(3), 'Punkty z tego spotkania odebrane — drużyna traci 1 pkt w tabeli.', 'Klub zrywa negocjacje o nowy kontrakt.'];}}
 ]},
{id:'podprowadzajaca', t:'PODPROWADZAJĄCA I SABOTAŻ',
 x:'Spodobałeś się najbardziej urokliwej podprowadzającej twojego klubu. Ma pomysł, jak ci się odwdzięczyć przed domowym meczem.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Pierdolę, mam swoją godność.', f:()=>[fxP(2), fxM(-3)]},
  {l:'Mrugam okiem, żeby jej koleżanki pojebały pola startowe.', f:()=>{const l=[fxOB(1)+' (jeden bieg masz w kieszeni)', fxP(-5)];
     if(chance(35)) l.push(fxBan(R(2,3))+' — komisja obejrzała nagranie z pól startowych'); return l;}}
 ]},
{id:'ksiazeczka', t:'BRAK KSIĄŻECZKI Z BADANIAMI',
 x:'Zapomniałeś książeczki z badaniami lekarskimi, a kierownik zawodów stoi przy stoliku i przegląda dokumenty jednego zawodnika po drugim.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Wkładam 50 zł w dowód rejestracyjny busa i podaję sędziemu.', f:()=>{
     if(chance(50)) return ['Sędzia oddał dowód bez słowa. Jedziesz w meczu.'];
     return [fxBan(2), fxP(-10), 'Sprawa poszła do wydziału regulaminowego.'];}},
  {l:'Przyznaję się do błędu.', f:()=>[fxBan(1), fxP(5)]}
 ]},
{id:'obiad', t:'OBIAD DLA OSÓB FUNKCYJNYCH',
 x:'Twój stary znowu wchodzi na catering i wpierdala porcję przeznaczoną dla osób funkcyjnych. Kierownik toru patrzy, ale nic nie mówi.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Porcja była nieświeża — stary ma sraczkę, ty tracisz mechanika na ten mecz.', f:()=>[fxFit(20), fxP(-5)]},
  {l:'Nic nie robię.', f:()=>[fxK(50*BAL.rounds)+' (oszczędność na obiadach)']}
 ]},
 
/* ===== IMPREZY, KOBIETY, ŻYCIE POZA TOREM ===== */
{id:'kac', t:'MECZ NA KACU',
 x:'Przyjeżdżasz na mecz z gigantycznym kacem po sobotniej imprezie. Drużyna jedzie o wejście do play-off, a ty widzisz dwa pierwsze łuki.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Jadę z kacem, ale nie zawodzę kolegów.', f:()=>[fxP(-7), fxA(3), fxI(10)]},
  {l:'Mówię prezesowi, żeby jechał za mnie mój mechanik.', f:()=>[fxP(-7), fxA(-7), fxBan(1)]}
 ]},
{id:'impreza_rywal', t:'IMPREZA U RYWALA',
 x:'Balujesz w klubie na imprezie sponsora rywala, z którym jutro jedziesz ważne spotkanie. Przy barze stoi ich kierownik drużyny.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Zmywam się szybciej, niż zakładałem.', f:()=>[fxP(-2), 'W spotkaniu jedziesz normalnie.']},
  {l:'Baluję do końca.', f:()=>[fxP(-7), fxA(-7), fxBan(1)+' — kierownik rywali doniósł w dniu meczu']}
 ]},
{id:'policja', t:'UCIECZKA PO IMPREZIE',
 x:'Imprezowałeś w Werandzie i jedziesz do domu odpocząć. Na obwodnicy łapie cię policja, a ty masz w busie motocykl żużlowy.',
 o:[
  {l:'Proponuję magiczną sztuczkę na motocyklu żużlowym — jak wyjdzie, puszczą mnie.', f:()=>{
     const r=R(1,100);
     if(r<=20) return ['Policjanci obejrzeli, pokiwali głowami i kazali jechać do domu.','Nic się nie stało. Tym razem.'];
     if(r<=80){G.S.forcedEnd=true;return ['Zero meczów do końca sezonu.', fxM(-10), fxP(-8)];}
     G.p.banSeasons=1;G.S.forcedEnd=true;return ['POTĘŻNE ZAWIESZENIE: nie jedziesz do końca tego i przez cały kolejny sezon.', fxM(-15), fxP(-15)];}},
  {l:'Przez znajomego senatora zamiatam sprawę pod dywan.', f:()=>{const k=Math.round(Math.max(0,G.p.budget)*0.5);
     return [fxK(-k)+' na „koszty obsługi sprawy”', fxP(-5)];}}
 ]},
{id:'gps', t:'GPS OD PARTNERKI',
 x:'Twoja partnerka montuje ci potajemnie GPS w busie. Dowiadujesz się o tym od mechanika, który znalazł kabelek pod fotelem.',
 o:[
  {l:'Jeżdżę dalej, gdzie jeżdżę.', f:()=>[fxP(-3), fxOB(1)+' (regeneracja, powiedzmy)']},
  {l:'Przestaję korzystać z usług pań do towarzystwa.', f:()=>[fxP(7), fxA(-7), fxI(12)+' (spięcie i brak snu)']},
  {l:'Zakuwam ją w kajdanki i przymocowuję do kaloryfera.', f:()=>[fxM(12), fxA(-7), fxBan(1)+' — musisz się tłumaczyć na komisariacie']}
 ]},
{id:'podryw', t:'PODRYW NA IMPREZIE KLUBOWEJ',
 x:'Podczas imprezy klubowej podrywają cię piękne panie. Prezes patrzy z drugiego końca sali i nie wygląda na zachwyconego.',
 o:[
  {l:'Wybieram reporterkę z telewizji.', f:()=>[fxA(1)]},
  {l:'Wybieram nieznaną szarą myszkę.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxO(2)+' (spokój i ciepła kolacja)', fxP(3)];
     if(r<=90) return [fxA(1)];
     if(r<=98) return ['Nic ciekawego z tego nie wyszło.'];
     return [fxEnd('gigantyczny przypał i ucieczka z kraju')];}},
  {l:'Wybieram plastikową.', f:()=>{ if(chance(50)) return [fxA(-1), fxI(5), fxO(R(-2,2))];
     return [fxM(-3), fxA(2), fxO(1)];}},
  {l:'Pytam kolegi, gdzie poznał żonę, i idę do tego przybytku.', f:()=>[fxP(3), fxI(-5), fxA(-3)]},
  {l:'Mówię im, że preferuję stringi mojej babci.', f:()=>[fxM(3), fxP(3), fxA(1)]}
 ]},
{id:'schabowe', t:'SCHABOWE Z ŻONĄ',
 x:'Wchodzisz do kuchni, a twoja żona trzyma w ręku nóż. Radio gra „Nie ma mocnych na Mariolę”.',
 o:[
  {l:'Wchodzę do kuchni.', f:()=>{ if(chance(95)) return ['Robi schabowe. Same płaty, panierka jak trzeba.', fxOB(2)+' na najbliższe mecze'];
     G.S.forcedEnd=true;
     return ['Odcinasz sobie palec przy krojeniu.', fxO(-2), 'Koniec sezonu — ręka w gipsie i powolna utrata formy.'];}},
  {l:'Wracam do salonu i udaję, że nic nie widziałem.', f:()=>['Kolacja była o 22:00. Zimna.']}
 ]},
{id:'weranda', t:'WERANDA Z LEGENDĄ',
 x:'Masz wolny weekend. Mechanik proponuje dodatkową sesję treningową, ale Marek Cieślak dzwoni, że wieczorem zbiera się ekipa w Werandzie i raczej nie planują wracać wcześnie.',
 o:[
  {l:'Jadę na dodatkowy trening.', f:()=>{ if(chance(50)) return [fxO(1)+' (sto wyjazdów z taśmy)']; return [fxP(7)];}},
  {l:'Impreza z Cieślakiem do 3 rano brzmi lepiej.', f:()=>[fxM(7), fxA(8), fxP(-5)]}
 ]},
{id:'daugavpils', t:'WIECZÓR W DAUGAVPILS',
 x:'Pojechałeś na GP do Daugavpils i nie masz co robić wieczorem. Kolega z parkingu pokazuje palcem na bar po drugiej stronie ulicy.',
 o:[
  {l:'Wypiję piwko.', f:()=>{ if(chance(85)) return ['Jedno piwo, dwie godziny rozmów o sprzęcie.', fxO(2)+' (głowa wreszcie odpoczęła)'];
     return ['Nagranie z baru trafiło do sieci.', fxBan(2)];}},
  {l:'Idę spać.', f:()=>[fxP(10)]}
 ]},
{id:'qubus', t:'OFERTA Z ZIELONEJ GÓRY (QUBUS)',
 x:'Klub z Zielonej Góry zaprasza cię na darmowy pobyt w hotelu Qubus. Pokój z widokiem, siłownia w cenie.',
 o:[
  {l:'Korzystam z gościnności i ćwiczę na siłowni.', f:()=>{ if(chance(85)) return [fxO(2)+' (trzy dni porządnej pracy)'];
     if(chance(35)) return ['Widzisz klamkę. Potem szpital.',
                            fxLongInj('złamana kość udowa — sztyft, sześć miesięcy o kulach')];
     G.S.forcedEnd=true;return ['Widzisz klamkę. Potem szpital.','Koniec sezonu.'];}},
  {l:'Nigdzie nie jadę.', f:()=>['Zostajesz w domu. Nic się nie dzieje.']}
 ]},
{id:'wiatrowka', t:'ZNALEZIONA WIATRÓWKA',
 x:'Znajdujesz w domu wiatrówkę po dziadku. Obok leży puszka śrutu i stara tarcza z korka.',
 o:[
  {l:'Czas się zabawić.', f:()=>{ if(chance(95)) return ['Kilka strzałów do puszki i tyle. Sąsiad nawet nie wyszedł.'];
     return [fxEnd('niekontrolowany odpał na podwórku')];}},
  {l:'Zostawiam ją w spokoju.', f:()=>[fxP(5)]}
 ]},
{id:'hel', t:'OFERTA OD MISTRZA',
 x:'Bartek Zmarzlik proponuje ci wspólne wciąganie helu na zapleczu parku maszyn. Balony ma własne.',
 cond:(p)=>p.ovr>75,
 o:[
  {l:'„Haha, piszczałka”.', f:()=>{ if(chance(50)) return [fxP(7)]; return ['Mistrz uznał, że jesteś nudny. Nic się nie zmienia.'];}},
  {l:'(zgoda)', f:()=>{ if(chance(50)) return [fxI(15)+' w najbliższym spotkaniu']; return ['Śmiechu było na dwa dni. Skutków brak.'];}}
 ]},
{id:'gollob', t:'POJEDYNEK WE ŚNIE Z GOLLOBEM',
 x:'Śni ci się, że jedziesz w parze z Tomaszem Gollobem. Wychodzicie spod taśmy na podwójne prowadzenie, ale Gollob zostawia ci przy krawężniku podejrzanie dużo miejsca.',
 o:[
  {l:'Wchodzę pod Golloba.', f:()=>{ if(chance(30)) return [fxO(1)+' (sen czasem uczy)'];
     return ['Upadek. Budzisz się na podłodze obok łóżka.', fxI(5)];}},
  {l:'Trzymam swoją pozycję.', f:()=>[fxP(3)]}
 ]},
 
/* ===== PIENIĄDZE, KLUB, PREZESI ===== */
{id:'kasa', t:'UPOMINASZ SIĘ O PIENIĄDZE',
 x:'Trzeci miesiąc bez przelewu. Na biurku prezesa leży faktura za balony z logo klubu i wydruk z twojego konta z kwotą 0,00 zł. Prezes uśmiecha się i pyta: „ale czy ty na pewno tego chcesz?”.',
 cond:(p,c)=>!!c && c.debt>10000,
 o:[
  {l:'Naprawdę chcę tych pieniędzy.', f:()=>{G.p.next.zeroMatches=true;return ['Prezes kiwa głową ze zrozumieniem.','W KOLEJNYM SEZONIE ZALICZYSZ 0 MECZÓW.'];}},
  {l:'Powietrze i fotosynteza też są spoko.', f:()=>{G.S.noEarnings=true;return ['W tym sezonie nie zarabiasz ani grosza.', fxH(10), fxE(-15)+' (brak kasy na serwis)'];}}
 ]},
{id:'reklamowka', t:'WYPŁATA W REKLAMÓWCE Z BIEDRONKI',
 x:'Prezes zamyka drzwi gabinetu, wyciąga z szafy pancernej reklamówkę i mówi: „jest wszystko, tylko bez papierów, bo księgowa ma teraz trudny okres”. W środku faktycznie coś szeleści.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Biorę i nie zadaję pytań.', f:()=>{const c=clubOf(G.p);const k=Math.min(c?c.debt:0, R(15000,40000));
     if(c) c.debt=Math.max(0,c.debt-k);
     return [fxK(k)+' w banknotach po 50', 'Dług klubu wobec ciebie maleje o tyle samo.', fxP(-5)];}},
  {l:'Chcę przelew i PIT.', f:()=>{const c=clubOf(G.p);const d=R(20000,50000); if(c) c.debt+=d;
     return [fxP(5), 'Zaległości klubu rosną o '+zl(d)+'.', fxH(-10)+' (prezes obraził się śmiertelnie)'];}}
 ]},
{id:'diamenty', t:'WYPŁATA W DIAMENTACH',
 x:'Prezes rozkłada na biurku aksamitną szmatkę, a na niej kilka kamieni. Mówi, że „to lepsze niż złoto” i że ma na to papier od znajomego.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Akceptuję.', f:()=>[fxK(-50000)+' (koszty paserskie i wycena)', fxP(-10)]},
  {l:'Nie zgadzam się.', f:()=>{G.S.noRenew=true;G.p.next.forceClub='weak';
     return ['Zrywasz kontrakt.','W kolejnym sezonie jeździsz wyłącznie w najniższej klasie rozgrywkowej.'];}}
 ]},
{id:'zbiorka', t:'ZBIÓRKA RATUNKOWA',
 x:'Twój klub organizuje publiczną zbiórkę na spłatę długów. Kibice wrzucają po dwadzieścia złotych, a menedżer nagrywa story z podziękowaniami.',
 cond:(p,c)=>!!c && c.debt>50000,
 o:[
  {l:'Pomagam.', f:()=>{const c=clubOf(G.p); if(c) c.debt=Math.max(0,c.debt-10000);
     return [fxK(-10000)+' na zbiórkę', fxRateN(0.5), fxL(15)];}},
  {l:'Mam to w dupie.', f:()=>{G.S.noRenew=true;return [fxL(-15), 'Klub rozwiązuje z tobą kontrakt.'];}}
 ]},
{id:'komornik', t:'KOMORNIK W BIURZE KLUBU',
 x:'Wchodzisz po podpis na delegację i widzisz dwóch panów spisujących ekspres do kawy. Prezes tłumaczy im, że ekspres jest leasingowany.',
 cond:(p,c)=>!!c && c.debt>=40000,
 o:[
  {l:'Dopisuję się do listy wierzycieli.', f:()=>{const c=clubOf(G.p);const o=Math.round((c?c.debt:0)*0.4);
     if(c) c.debt=Math.max(0,c.debt-o);
     return ['Odzyskujesz '+zl(o)+' z masy.', fxK(o), fxM(-5), fxL(-10)+' — szatnia patrzy krzywo'];}},
  {l:'Czekam na cud.', f:()=>{const c=clubOf(G.p);const l=[fxL(10)];
     if(chance(35)){const s=Math.round((c?c.debt:0)*0.8); if(c) c.debt-=s; G.p.budget+=s; l.push('Sponsor dosypał w ostatniej chwili: '+zl(s)+'.');}
     else { if(c) c.debt+=R(10000,30000); l.push('Nic nie wróciło, a dług klubu urósł.');}
     return l;}}
 ]},
{id:'skrzydlo', t:'WITOLD SKRZYDŁO DOWALA CI KARĘ 100 000 ZŁ',
 x:'Powód: brak czapki klubowej na wywiadzie. W tym samym czasie klub zalega ci wielkie pieniądze. Nikt w tym budynku nie widzi w tym sprzeczności.',
 cond:(p,c)=>!!c && c.debt>=60000,
 o:[
  {l:'Płacę z pokorą.', f:()=>{const c=clubOf(G.p); if(c) c.debt=0;
     return [fxM(-10), fxP(10), 'Dług klubu wobec ciebie wyzerowany (kompensata).'];}},
  {l:'Pierdolę, idę do Ostafińskiego.', f:()=>{const c=clubOf(G.p);G.S.forcedEnd=true;G.S.noRenew=true;
     const l=[fxM(15), fxP(-10), 'Do końca sezonu nie jedziesz ani jednego spotkania.'];
     if(chance(40)){ if(c) c.debt=0; l.push('PZM zwrócił dług z gwarancji.'); } else l.push('Trybunał PZM rozłożył ręce. Dług zostaje.');
     return l;}}
 ]},
{id:'winda', t:'ZABLOKOWANA WINDA I DOTACJA',
 x:'Jeden radny zatrzasnął się w windzie i nie dotarł na głosowanie. Twój klub nie dostał dotacji ratującej finanse, a ty ostatnią wypłatę pamiętasz jak przez mgłę.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Siedzę cicho, muszę się pokazać.', f:()=>[fxO(-1)+' (sprzęt stoi u tunera i czeka na przelew)']},
  {l:'Idę płakać w ramię Julii Pożarlik podczas kolejnego meczu.', f:()=>[fxM(4), fxP(-2), fxO(-1)]},
  {l:'Urządzam protest, zaczynam głodówkę i przykuwam się do kaloryfera w biurze klubu.', f:()=>{
     const c=clubOf(G.p);const l=[fxM(15), fxP(2)];
     if(chance(25)){const k=Math.round((c?c.debt:0)*0.6); if(c) c.debt-=k; G.p.budget+=k; l.push('Klub znalazł pieniądze: '+zl(k)+'.');}
     if(chance(25)){G.S.noRenew=true;G.p.next.betterOffers=true;l.push('Sprawa poszła szeroko — po sezonie możesz wybrać nowy klub.');}
     return l;}}
 ]},
{id:'dolustats', t:'DOŁUSTATS I PRAWDA O FINANSACH',
 x:'W trakcie sezonu, przeglądając X, natykasz się na statystyki DołuStats. Wykres twojej drużyny wygląda jak profil zjazdu do Zakopanego.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Głęboko je analizuję.', f:()=>{const r=R(1,3);
     if(r===1) return [fxO(2), fxT(1), fxP(3)];
     if(r===2) return ['Popatrzyłeś, pokiwałeś głową, nic z tego nie wynikło.'];
     return [fxO(-1), fxT(-1)+' — zaraziłeś szatnię defetyzmem'];}},
  {l:'Piszę tweeta, że większym kłamstwem jest terminowość wypłat.', f:()=>[fxM(4), fxBan(1)+' — klub ukarał cię regulaminowo']}
 ]},
{id:'brakkasy', t:'BRAK KASY Z KLUBU',
 x:'Klub nie płacił od wiosny, a ty naprawdę potrzebujesz pieniędzy na życie. Rata za busa nie czeka.',
 cond:(p,c)=>p.budget<10000 || (!!c && c.debt>50000),
 o:[
  {l:'Zaciskam zęby i zaciskam pasa.', f:()=>[fxP(5)]},
  {l:'Szukam metod zarobku.', f:()=>{const r=R(1,3);
     if(r===1) return ['Mrożonki w Niemczech. Trzy miesiące na chłodni.', fxHN(15)];
     if(r===2) return ['Trzeba rozwieźć bułki, wędliny…', fxHN(-10), fxK(5000)];
     const l=['Plan kolegi. Nie pytasz o szczegóły.'];const q=R(1,100);
     if(q<=50) l.push(fxO(R(-2,2)));
     else if(q<=70) l.push(fxBan(R(2,3)));
     else if(q<=90) l.push(fxH(5));
     else if(q<=98) l.push('Nic z tego nie wyszło.');
     else { l.push('Wjazd o 6 rano. Wyrok w zawieszeniu.'); G.p.banSeasons=1; G.S.forcedEnd=true; }
     return l;}}
 ]},
{id:'haracz', t:'HARACZ DLA TRENERA',
 x:'Trener oczekuje 10% od punktówki za wystawianie cię w składzie. Mówi to przy kawie, jakby chodziło o składkę na kwiatek.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Płacę.',     f:()=>[fxK(-15000), fxH(15)]},
  {l:'Nie płacę.', f:()=>[fxH(-20), 'Trener nagle „nie widzi cię w tym zestawieniu”.']}
 ]},
{id:'awangarda', t:'ZBIÓRKA AWANGARDY',
 x:'Przy ofercie sponsoringowej odzywa się Awangarda żużlowa. Organizują na grupie zbiórkę, żeby móc ci zapłacić za logo.',
 cond:(p)=>p.budget<50000,
 o:[
  {l:'Zgadzam się i lajkuję fanpage.', f:()=>{const l=[];
     if(chance(15)) l.push(fxK(8000)+' ze zbiórki'); else l.push('Zbiórka utknęła na 340 zł.');
     l.push(fxM(R(-4,4))); l.push(fxP(-2)); return l;}},
  {l:'Pierdolcie się, śmieszki.', f:()=>{G.p.next.noSponsor=true;
     return [fxP(3), 'Żadnych ofert sponsorskich w najbliższym okienku.'];}}
 ]},
{id:'windykacja', t:'WINDYKACJA DZWONI DO CIEBIE',
 x:()=>'Twoje konto: '+zl(G.p.budget)+'. Pani z firmy windykacyjnej jest miła i bardzo dobrze poinformowana o terminarzu twoich meczów.',
 cond:(p)=>p.budget<0,
 o:[
  {l:'Sprzedaję zapasowy motocykl.', f:()=>[fxK(30000), fxE(-15)]},
  {l:'Biorę zaliczkę od prezesa.',   f:()=>{const c=clubOf(G.p); if(c) c.debt=Math.max(0,c.debt-50000);
     return [fxK(50000), 'Dług klubu wobec ciebie maleje o tyle samo.', fxL(10)];}}
 ]},
{id:'speedcoin', t:'KOLEGA WCHODZI W „SPEEDCOINA”',
 x:'Pokazuje ci wykres na telefonie z pękniętym ekranem. Mówi, że to „krypto dla żużlowców” i że jego kuzyn zrobił na tym mieszkanie w Rybniku.',
 cond:(p)=>p.budget>=10000,
 o:[
  {l:'Wchodzę za 20% budżetu.', f:()=>{const inv=Math.round(G.p.budget*0.2);G.p.budget-=inv;
     if(chance(25)){G.p.budget+=inv*3;return ['Wpłaciłeś '+zl(inv)+', wyjąłeś '+zl(inv*3)+'.','Kolega chce teraz procent.'];}
     return ['Projekt zniknął razem ze stroną.','Straciłeś '+zl(inv)+'.'];}},
  {l:'Nie wchodzę.', f:()=>[fxP(2)]}
 ]},
{id:'marcel', t:'SPOSÓB NA ZAROBEK',
 x:'Kolega Marcel przychodzi z propozycją zarabiania bez wychodzenia z domu. Ma prezentację w PowerPoincie i zeszyt z nazwiskami.',
 o:[
  {l:'Korzystam z rad.', f:()=>{G.S.forcedEnd=true;G.p.next.forceClub='MOSIĄDZ Gorzów';
     return [fxK(30000), fxP(-15), 'Pauzujesz do końca sezonu — sprawa się rypła.','Po sezonie zostaje ci tylko oferta z Gorzowa.'];}},
  {l:'Odmawiam.', f:()=>['Marcel obraził się i sprzedał ten sposób juniorowi.']}
 ]},
{id:'bogacz', t:'SALON SAMOCHODOWY W GORZOWIE',
 x:()=>'Masz na koncie '+zl(G.p.budget)+'. Kolega z zespołu przyjechał na trening nowym SUV-em i pyta, na co ty właściwie czekasz.',
 cond:(p)=>p.budget>=900000,
 o:[
  {l:'Kupuję auto.',        f:()=>{const k=Math.round(G.p.budget*0.3);return [fxK(-k), fxM(10)+' (story z salonu)', fxP(-10)];}},
  {l:'Pakuję w silniki.',   f:()=>[fxK(-200000), fxE(20), fxP(5)]}
 ]},
{id:'zima', t:'PRZYGOTOWANIA ZIMOWE: HISZPANIA CZY SIŁOWNIA W ZABRZU',
 x:'Grupa zawodników leci na trzy tygodnie do Almerii. Alternatywa to siłownia na osiedlu, gdzie pan Mietek każe robić przysiady na czas.',
 cond:(p)=>p.budget>=80000,
 o:[
  {l:'Lecę do Hiszpanii.', f:()=>[fxK(-80000), fxO(3), fxP(5)]},
  {l:'Siłownia u Mietka.', f:()=>[fxO(1), fxM(-5)+' — inni wrzucali story z plaży']}
 ]},
{id:'ojciec', t:'OJCIEC-MENEDŻER CHCE NEGOCJOWAĆ',
 x:'Ma teczkę, koszulę i przekonanie, że wszyscy w tej lidze to złodzieje. W sumie ma rację, ale prezesi już się o nim między sobą pisali.',
 o:[
  {l:'Niech negocjuje.',     f:()=>[fxRate(1.2), fxM(-10), fxH(-10)+' — trener nie znosi „tatusiów”']},
  {l:'Sam sobie załatwiam.', f:()=>[fxP(5)]}
 ]},
{id:'mrozek', t:'PORADA KRZYSZTOFA M.',
 x:'Klub chce podpisać z tobą dziesięcioletni kontrakt. Prezes zainspirował się Krzysztofem Mrozkiem i kładzie na stole umowę dłuższą niż niejedna kariera.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Podpisuję.', f:()=>{G.p.next.lockTransfer=3;return [fxL(8), 'Blokada transferowa: przez najbliższe sezony nie zmienisz klubu.'];}},
  {l:'„Panie prezesie, bez przesady”.', f:()=>[fxL(-3), 'Pozostajesz dostępny na rynku transferowym.']}
 ]},
{id:'spadkowicz', t:'SZATNIA PRZED OSTATNIĄ KOLEJKĄ SPADKOWICZA',
 x:()=>'Klub ('+esc((clubOf(G.p)||{name:'—'}).name)+') ledwo zipie finansowo i sportowo. Kapitan proponuje, żeby wszyscy zrzekli się premii punktowej, byle utrzymać drużynę przy życiu.',
 cond:(p,c)=>!!c && c.ovr<=62,
 o:[
  {l:'Zrzekam się.', f:()=>[fxT(2), fxL(15), fxM(5), fxRate(0.5)]},
  {l:'Mam kredyt, nie zrzekam się.', f:()=>[fxL(-15), fxM(-10), fxT(-1)+' — szatnia się sypie']}
 ]},
{id:'bogaty_klub', t:'PREZES POKAZUJE NOWĄ HALĘ',
 x:()=>'Klub ma budżet '+zl((clubOf(G.p)||{budget:0}).budget)+' i właśnie otworzył centrum treningowe z sauną i salą do wideo-analiz. Prezes pyta, czy chcesz swój klucz.',
 cond:(p,c)=>!!c && c.budget>=8000000,
 o:[
  {l:'Wprowadzam się tam na stałe.', f:()=>[fxO(2), fxP(10), fxM(-5)+' — znikasz z życia towarzyskiego']},
  {l:'Wolę swój brudny warsztat.',   f:()=>[fxL(-10), fxE(4)]}
 ]},
 
/* ===== SPRZĘT, MECHANICY, TUNERZY ===== */
{id:'tuninggor', t:'WIZYTA U LOKALNEGO „TUNING-GÓRA” W STODOLE',
 x:'Stodoła, tokarka z 1974 roku, kalendarz z 2009 i człowiek, który mówi o cylindrze „ja to czuję palcem”. Proponuje eksperymentalny szlif.',
 o:[
  {l:'Zgadzam się.', f:()=>{ if(chance(80)) return ['Na drugim kółku silnik zrobił dziurę w karterze.', fxE(-20), fxDef(10)];
     return ['CUD. Silnik wytrzymał i jedzie jak nowy.', fxE(10)];}},
  {l:'Dziękuję, postoję.', f:()=>['Wychodzisz ze stodoły z całym karterem.']}
 ]},
{id:'zlom', t:'TWÓJ SILNIK TO JUŻ EKSPONAT',
 x:()=>'Sprzęt na poziomie '+G.p.equip+'/99. Mechanik rywala zagląda pod plandekę, robi zdjęcie i wysyła na grupę z podpisem: „on tym jeździ w tym roku?”.',
 cond:(p)=>p.equip<=18,
 o:[
  {l:'Biorę pożyczkę i kupuję silnik.', f:()=>[fxK(-40000), fxE(20), fxP(5)]},
  {l:'Jeżdżę dalej złomem.',            f:()=>[fxDef(5), fxM(5)+' — internet pokochał ten silnik']}
 ]},
{id:'kradziez', t:'SKRADZIONO CI SILNIKI SPOD HOTELU',
 x:'Bus stoi otwarty, plandeka pocięta, w środku pusto. Recepcjonistka mówi, że „monitoring działa tylko od frontu”. Do meczu cztery dni.',
 o:[
  {l:'Zgłaszam policji.', f:()=>[fxE(-20)+' — jedziesz na rezerwowym złomie', fxP(5)]},
  {l:'Kupuję na szybko używane z czarnego rynku.', f:()=>[fxK(-50000), fxE(-10), fxDef(5)]}
 ]},
{id:'mechsen', t:'MECHANIK ZASNĄŁ W BUSIE Z PAPIEROSEM',
 x:'Obudził go dopiero swąd tapicerki. Bus ocalał, plandeka nie. Mechanik twierdzi, że „to był wypadek przy pracy” i że zna GM-y jak własną kieszeń.',
 cond:(p)=>p.mech>10,
 o:[
  {l:'Zwalniam go na miejscu.', f:()=>{const q=R(10,25);G.p.mech=q;G.p.mechName='Przypadkowy człowiek z parku maszyn';
     return [fxK(-10000)+' odprawy', 'Nowy mechanik ma jakość '+q+'.', fxP(5)];}},
  {l:'Zostawiam, bo zna się na GM-ach.', f:()=>[fxDef(5), fxM(5)]}
 ]},
{id:'mechanik_oferta', t:'MECHANIK DOSTAJE OFERTĘ ZE SPARTY',
 x:()=>'Twój mechanik (jakość '+G.p.mech+') dostał telefon z bogatego klubu, który płaci dużo więcej. Stoi z telefonem w ręce i wymownie na ciebie patrzy.',
 cond:(p)=>p.mech>=60,
 o:[
  {l:'Przebijam ofertę.', f:()=>{G.p.mech=cl(G.p.mech+4,1,99);return [fxK(-50000), 'Mechanik zostaje, jakość +4.', fxL(5)];}},
  {l:'Niech jedzie, znajdę innego.', f:()=>{const q=R(20,40);G.p.mech=q;G.p.mechName='Zastępstwo z ogłoszenia';
     return [fxK(10000)+' oszczędności', 'Nowy mechanik z ogłoszenia: jakość '+q+'.'];}}
 ]},
{id:'slaczka', t:'BUS PADA W DRODZE Z DEBRECZYNA',
 x:'Skrzynia biegów wysiadła pod Debreczynem, a mecz o trzecie miejsce jest za 14 godzin. Janusz Ślączka podjeżdża lawetą: „wskakuj na pakę, ale motocykli nie zabieramy”.',
 o:[
  {l:'Dawaj na pakę.',      f:()=>[fxP(10), fxM(5), fxFit(30)+' (pożyczony sprzęt)', fxI(10)]},
  {l:'Pierdolę, nie jadę.', f:()=>[fxFine(20000)+' regulaminowej', fxM(-10)]}
 ]},
{id:'forma_zycia', t:'NAJLEPSZA FORMA W KARIERZE',
 x:()=>'Zeszły sezon skończyłeś ze średnią '+(G.history[G.history.length-1]||{avgTxt:'—'}).avgTxt+'. Trzy kluby dzwonią, tunerzy dają sprzęt za darmo w zamian za bycie słupem reklamowym.',
 cond:()=>G.history.length>0 && G.history[G.history.length-1].avg>=1.9,
 o:[
  {l:'Biorę darmowy sprzęt za obklejenie kevlaru.', f:()=>[fxE(20), fxM(-5)+' — wyglądasz jak choinka']},
  {l:'Płacę za swoje i nic nikomu nie wiszę.',      f:()=>[fxK(-100000), fxE(20), fxP(8)]}
 ]},
{id:'argentyna', t:'ARGENTYŃCZYK CHCE KUPIĆ TWÓJ MOTOCYKL',
 x:'Pisze po hiszpańsku przez tłumacza, że to start jego pięknej kariery w Europie. Ma odłożone oszczędności całej rodziny.',
 o:[
  {l:'Jestem uczciwy.',              f:()=>[fxK(20000), fxM(5), fxP(5)]},
  {l:'Sprzedaję mu oklejony złom.',  f:()=>{G.p.next.noArg=true;return [fxK(50000), fxM(-10), fxP(-10)];}}
 ]},
{id:'masc', t:'MAŚĆ Z NORWEGII',
 x:'Rune z Norwegii proponuje ci specjalną maść na mięśnie. Etykieta jest po norwesku, a zapach czuć przez zamknięty słoik.',
 o:[
  {l:'Smaruj bengaja.', f:()=>{ if(chance(50)) return [fxI(20)+' (skurcz w najgorszym momencie)'];
     G.p.contract.rate=Math.round(G.p.contract.rate*0.85);
     return ['Zapominasz polskiego na trzy dni.', 'Stawka za punkt na kontrakcie spada o 15%.', fxO(-2)];}},
  {l:'Nie smaruję.', f:()=>[fxO(1), fxP(5)]}
 ]},
 
/* ===== KONTUZJE, ZDROWIE, DOPING ===== */
{id:'anglia_ur', t:'NIEDOLECZONA KONTUZJA W ANGLII',
 x:'W ostatnim meczu w Anglii uszkodziłeś rękę, ale najbliższe spotkanie ligowe może zdecydować, czy klub utrzyma się w lidze.',
 cond:(p,c,S)=>S.round>=10,
 o:[
  {l:'Odmawiam jazdy z niedoleczoną kontuzją.', f:()=>[fxA(-7), fxBan(1)]},
  {l:'Jadę z niedoleczoną kontuzją.', f:()=>{const l=[fxA(7)];
     if(chance(5)){G.p.banSeasons=1;G.S.forcedEnd=true;l.push('Wypuściłeś motocykl z rąk. Potężne zawieszenie i przerwa na cały kolejny sezon.');}
     else l.push('Ręka wytrzymała. Ledwo.');
     return l;}}
 ]},
{id:'obojczyk', t:'LEKARZ: „PĘKNIĘTY OBOJCZYK” — A ZA TYDZIEŃ BARAŻ',
 x:'Zdjęcie RTG nie pozostawia złudzeń. Trener stoi obok i patrzy na ciebie tym jednym spojrzeniem, które wszyscy w tym sporcie znają.',
 cond:(p,c,S)=>S.round>=10,
 o:[
  {l:'Jadę na zastrzykach.',        f:()=>{
     const l=[fxM(10), fxP(10), fxOB(-3)+' (jedziesz jedną ręką)', fxI(30)];
     if(chance(14)) l.push('Ręka puściła kierownicę w pierwszym łuku barażu.',
                           fxLongInj('zerwane więzadła w kolanie i otwarte złamanie udu po upadku z niedoleczoną ręką'));
     return l;}},
  {l:'Leczę się jak dorosły człowiek.', f:()=>[fxBan(3), fxM(-5), fxO(2)+' — ciało wreszcie odpoczęło']}
 ]},
{id:'dietetyk', t:'DIETETYK Z INSTAGRAMA',
 x:'Ma 200 tysięcy obserwujących, certyfikat z webinaru i plan żywieniowy w PDF-ie. Twoja mama mówi, że wyglądasz jak z obozu.',
 o:[
  {l:'Robię cut przed rewanżami.', f:()=>[fxO(2), fxP(-10)+' (osłabienie organizmu)', fxI(15)]},
  {l:'Jem schabowego u mamy.',     f:()=>[fxO(-1), fxP(5)]}
 ]},
{id:'cross', t:'CROSS I MELDONIUM',
 x:'Uważasz, że masz za mało jazdy. Dostajesz zaproszenie na treningi motocrossowe, a przy okazji ktoś podsuwa ci „coś na regenerację”.',
 cond:(p)=>p.form<0,
 o:[
  {l:'Jadę, bo co może się złego wydarzyć.', f:()=>{const r=R(1,100);
     if(r<=30) return [fxO(2), fxH(5), fxA(1)];
     if(r<=58) return ['Trzy weekendy w błocie. Zero efektu.'];
     if(r<=86){G.S.forcedEnd=true;return ['Wpadka dopingowa — zawieszenie do końca sezonu.'];}
     if(r<=92) return ['Otarcia, siniaki i nic więcej.'];
     if(r<=99) return ['Zeskok z hopy, kolano zostaje w koleinie.',
                       fxLongInj('zerwane więzadła krzyżowe w kolanie na treningu crossowym')];
     return [fxEnd('poważny uraz kręgosłupa na crossie — renta')];}},
  {l:'Nie będę się rozpraszać bzdurami.', f:()=>[fxP(3)]}
 ]},
{id:'doping', t:'KONTROLA ANTYDOPINGOWA W BIRMINGHAM',
 x:'Szwagier miał urodziny i przez cały weekend imprezowałeś. Wyrywkowa kontrola przed meczem w Anglii każe ci oddać mocz do badania.',
 o:[
  {l:'Oddaję mocz.', f:()=>{ if(chance(60)){G.S.forcedEnd=true;return ['Wynik przyszedł po trzech tygodniach.','Zawieszenie do końca obecnego sezonu.'];}
     return ['Czysto. Sam się zdziwiłeś.', fxP(5)];}},
  {l:'Nie oddaję moczu.', f:()=>{G.p.banSeasons=1;G.S.forcedEnd=true;return ['Odmowa to przyznanie się.','Zawieszenie do końca tego i przez cały kolejny sezon.'];}},
  {l:'Każę sędziemu się gonić.', f:()=>{G.S.forcedEnd=true;return [fxFine(50000)+' grzywny', 'Zawieszenie do końca sezonu.'];}}
 ]},
{id:'wyjazdy', t:'WYJAZDY ZAGRANICZNE',
 x:'Potrzebujesz jazdy, żeby złapać formę. Na stole leżą cztery terminarze i jeden kalendarz ligowy, w który wszystko musi się zmieścić.',
 cond:(p)=>p.form<0 || p.ovr<70,
 o:[
  {l:'Wybieram Szwecję.',        f:()=>[fxP(3), fxO(R(0,1))]},
  {l:'Wybieram Danię.',          f:()=>{const b=R(0,2);const l=[fxP(2), fxO(R(1,2))]; if(b) l.push(fxBan(b)+' w polskiej lidze'); return l;}},
  {l:'Wybieram Wielką Brytanię.',f:()=>{const b=R(0,1);const l=[fxM(2), fxO(R(0,1)), fxH(3)]; if(b) l.push(fxBan(b)); return l;}},
  {l:'Siedzę na dupie w kraju.', f:()=>['Trzy tygodnie bez motocykla. Nic się nie zmienia.']}
 ]},
{id:'anglia', t:'TELEFON Z ANGLII — OFERTA Z BRITISH SPEEDWAY',
 x:'Klub z Premiership chce cię na czwartki. To dodatkowe pieniądze i dodatkowe 4000 kilometrów w busie co tydzień.',
 cond:(p)=>p.ovr>=62 && p.age>=20,
 o:[
  {l:'Biorę.', f:()=>[fxK(100000), fxO(2)+' (więcej jazdy)', fxI(15)+' z przemęczenia', fxE(-10)]},
  {l:'Skupiam się na polskiej lidze.', f:()=>[fxH(5), fxP(5)]}
 ]},
{id:'lot', t:'SPÓŹNIENIE NA LOT',
 x:'Spóźniłeś się na samolot, ale klub ma szerokie kontakty, żeby ściągnąć cię na mecz. Prezes mówi tylko: „mam człowieka od awionetek”.',
 cond:(p,c,S)=>S.round>0 && p.budget>15000,
 o:[
  {l:'Wybieram tradycyjną metodę z przesiadkami.', f:()=>{ const l=[fxP(-3)];
     if(chance(75)) l.push(fxBan(1)+' — nie zdążyłeś'); else l.push('Zdążyłeś w ostatniej chwili.');
     return l;}},
  {l:'Korzystam z awionetki.', f:()=>{const r=R(1,100);
     if(r<=70) return ['Wylądowałeś 40 minut przed pierwszym biegiem.'];
     if(r<=90) return ['Daremny trud — mgła nad lotniskiem.', fxBan(1)];
     if(r<=95){G.p.next.zeroMatches=true;G.S.forcedEnd=true;return ['Przymusowe awaryjne lądowanie. Uraz kręgosłupa.','Kolejny sezon: 0 spotkań.'];}
     if(r<=96) return [fxEnd('katastrofa awionetki')];
     return ['Wylądowałeś, choć pilot wyglądał na zaskoczonego.'];}}
 ]},
{id:'francja', t:'ZAWODY WE FRANCJI',
 x:'Powołano cię na zawody reprezentacyjne do Francji, dzień przed meczem ligowym. Jesteś wykończony, ale duński kolega proponuje, że cię odwiezie.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Daję mu telefon, żeby wpisał miejscowość w Maps, i idę spać.', f:()=>{
     if(chance(50)) return ['Pomylił miasta o tej samej nazwie.', fxBan(1), fxM(-15)];
     return ['Zdążyliście na czas.', fxP(5), fxK(20000)+' premii'];}},
  {l:'Jadę sam z mechanikami.', f:()=>{ if(chance(80)) return ['Nie zdążyłeś.', fxBan(1), fxP(5)];
     return ['Zdążyłeś, ale ledwo trzymasz kierownicę.', fxI(20)];}}
 ]},
 
/* ===== WIELKIE MECZE, TURNIEJE, PRESJA ===== */
{id:'rzeszow', t:'PREZESKA: „TOR JEST NIEBEZPIECZNY”',
 x:'Prezeska mówi, że tor przypomina tarkę do sera, a lider właśnie wrócił z kontuzji. Zespół patrzy na ciebie — od twojego głosu zależy, czy jedziemy, czy pakujemy bus.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'To wielka szansa — jedziemy.', f:()=>{G.S.noRenew=true;
     return [fxM(12), fxP(10), fxI(25), 'Klub nie przedłuży z tobą umowy — prezeska zapamiętała.'];}},
  {l:'Wracamy do Rzeszowa.', f:()=>{
     return [fxP(-15), fxM(-15), fxFine(15000)+' z PZM', fxK(-3000)+' na lakierowanie obrzuconego busa',
             fxWalk('lose',0), 'Mecz kończy się wynikiem 0:75.'];}}
 ]},
{id:'rozdzielnia', t:'ROZDZIELNIA PRĄDU',
 x:'Drużyna jedzie fatalny mecz rewanżowy w finale o awans. Od ciebie zależy, czy to spotkanie w ogóle zostanie dokończone.',
 cond:(p,c,S)=>S.round>=14,
 o:[
  {l:'Proszę prezesa o zajebanie siekierą w rozdzielnię.', f:()=>{
     return ['Mecz odwołany przy stanie, którego nikt już nie policzy.', fxWalk('void',0), fxM(12), fxP(-10)];}},
  {l:'Odjeżdżam mecz do końca.', f:()=>{G.S.teamPts-=2;
     return [fxP(7), 'Brak awansu — rywal był po prostu lepszy.'];}}
 ]},
{id:'baraz', t:'BARAŻ O UTRZYMANIE — POWAŻNE MYŚLI SPADKOWE',
 x:'Szatnia milczy. Lider patrzy w podłogę, junior płacze w rękawicę, a menedżer nagrywa story na Instagram. Ktoś musi coś zrobić.',
 cond:(p,c,S)=>S.round>=14 && !!c && c.ovr<=65,
 o:[
  {l:'Skrzykuję drużynę, żeby pokrzyczeć niemiłe rzeczy o rywalach.', f:()=>[fxT(3), fxHN(10), fxM(10)]},
  {l:'„To, gdzie jeżdżę, jest bez znaczenia…”', f:()=>[fxH(10), fxP(10)]}
 ]},
{id:'spoznienie', t:'SPÓŹNIASZ SIĘ 6 MINUT NA MECZ PÓŁFINAŁOWY',
 x:'Sędzia Lis źle kliknął cyferki w kalkulatorze i przez ciebie jest walkower. Łysa pała z telewizji już biegnie z mikrofonem.',
 cond:(p,c,S)=>S.round>=14,
 o:[
  {l:'Płaczę, że to nie moja wina.', f:()=>[fxM(10), fxP(-10), fxWalk('lose',0)],
  },
  {l:'Odmawiam wywiadu przez „problemy żołądkowe”.', f:()=>[fxM(-10), fxFine(10000), fxWalk('lose',0)]}
 ]},
{id:'quad', t:'ŚWIĘTOWANIE NA QUADZIE',
 x:'Po zwycięstwie w pierwszym meczu finałowym atmosfera na stadionie jest znakomita, ale przed wami wciąż rewanż decydujący o awansie.',
 cond:(p,c,S)=>S.round>=14,
 o:[
  {l:'„HEJ PREZES, SIADAJ NA QUADA!”', f:()=>[fxM(10), fxL(8), fxA(7), fxP(-5), fxT(-1)+' — rywal zmobilizowany na rewanż']},
  {l:'„Spokojnie, jeszcze niczego nie wygraliśmy”.', f:()=>[fxP(8), fxL(5), fxM(-3), fxA(-3)]}
 ]},
{id:'memorial', t:'MEMORIAŁ WIELKIEGO MISTRZA',
 x:'Dostałeś zaproszenie na Memoriał Wielkiego Mistrza. Obsada lepsza niż w Grand Prix, ale tor ma być ciężki i mokry.',
 cond:(p)=>p.ovr>70,
 o:[
  {l:'Jadę i pokażę, co potrafię.', f:()=>{ if(chance(35)) return ['WYGRANA w obsadzie lepszej niż GP.', fxO(3), fxM(5)];
     return ['Drobny wypadek w półfinale.', fxO(-1), fxBan(1)];}},
  {l:'Nic nie robię.', f:()=>['Zostajesz w domu. Memoriał wygrał ktoś inny.']}
 ]},
{id:'gpwywiad', t:'WYWIAD O GP CHALLENGE',
 x:'Dziennikarz pyta cię o obsadę tegorocznego GP Challenge. Nagrywa, a przy stoliku obok siedzi jeden z zawodników z tej listy.',
 cond:(p)=>p.ovr>70 && p.med>30,
 o:[
  {l:'Mówię, że obsada jest znakomita.', f:()=>[fxP(10)]},
  {l:'Mówię, że jest niepoważna, i wyśmiewam zawodnika z brzuszkiem.', f:()=>[fxO(-3)+' — klątwa Bombera działa natychmiast', fxM(3)]}
 ]},
{id:'challenge', t:'CHALLENGE I KLĄTWA',
 x:'Jedziesz świetny sezon i dostałeś się do GP Challenge. Zostały trzy tygodnie i mnóstwo pytań o ustawienia.',
 cond:(p)=>p.ovr>=75,
 o:[
  {l:'Zawierzam występ Chrisowi Harrisowi.', f:()=>{const l=[fxP(5), fxO(1)];
     if(chance(70)) l.push(fxH(10)); return l;}},
  {l:'Mówię, że nie mam z kim przegrać, i wyśmiewam każdego ze stawki.', f:()=>{const l=[fxM(3), fxP(-5)];
     if(chance(50)){ l.push(fxI(10)); l.push(fxH(-10)); l.push('Klątwa działa. Zawsze działa.'); }
     return l;}}
 ]},
{id:'gpchallenge', t:'DZIKA KARTA NA GRAND PRIX CHALLENGE',
 x:'Ktoś się wykruszył, ktoś zadzwonił, i nagle masz miejsce w turnieju, o którym marzy pół ligi. Termin koliduje z trzema meczami ligowymi.',
 cond:(p)=>p.ovr>65,
 o:[
  {l:'Jadę. Raz się żyje.',   f:()=>[fxO(2), fxM(10), fxK(-20000)+' kosztów wyjazdu']},
  {l:'Liga jest ważniejsza.', f:()=>[fxP(5), fxH(5)]}
 ]},
{id:'junior_kadra', t:'POWOŁANIE DO KADRY MŁODZIEŻOWEJ',
 x:'Trener kadry chce cię na zgrupowanie, ale termin nachodzi na dwa mecze ligowe, a prezes grozi rozwiązaniem umowy.',
 cond:(p)=>p.age<=21 && p.ovr>=40,
 o:[
  {l:'Jadę na zgrupowanie.', f:()=>[fxO(3), fxM(10), fxBan(2), fxL(-10)]},
  {l:'Zostaję w klubie.',    f:()=>[fxL(10), fxP(5), fxM(-5)]}
 ]},
{id:'australijczyk', t:'KLUB ŚCIĄGA AUSTRALIJCZYKA NA TWOJE MIEJSCE',
 x:'Ma 24 lata, średnią 2.1 w swojej lidze i uśmiech z reklamy pasty do zębów. Menedżer klubu mówi ci o tym w SMS-ie o 23:40.',
 o:[
  {l:'Idę do prezesa na noże.', f:()=>{ if(chance(50)) return ['Prezes się ugiął.', fxH(15)];
     return ['Prezes wysłuchał i nie zmienił nic.', fxH(-25)+' — tracisz miejsce w składzie'];}},
  {l:'Trenuję w ciszy.', f:()=>[fxO(2), fxH(-10)+' w tym sezonie']}
 ]},
{id:'guru', t:'GURU OD STATYSTYK',
 x:'Guru wyliczył w arkuszu, że jesteś najsłabszym startującym zawodnikiem w całej lidze. Wykres jest kolorowy i, niestety, prawdziwy.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Trenuję starty.', f:()=>[fxO(R(-2,2)), fxP(5)]},
  {l:'Piszę, że guru to farmazon.', f:()=>{G.p.next.rowPen=true;return [fxM(R(-5,5)), '-15% szans na ofertę od ROW-u Rybnik.'];}}
 ]},
{id:'kompromitacja', t:'„NAJSŁABSZY ZAWODNIK LIGI” — RANKING PORTALU',
 x:()=>'Profesjonalizm '+G.p.prof+'/99. Portal zrobił zestawienie zawodników, którzy najczęściej dotykają taśmy i zawalają starty. Jesteś na podium.',
 cond:(p)=>p.prof<28,
 o:[
  {l:'Zatrudniam trenera od startów.', f:()=>[fxK(-20000), fxP(15)]},
  {l:'„Taśma to loteria, nie moja wina”.', f:()=>[fxM(8), fxP(-5)]}
 ]},
{id:'dolufan', t:'KŁÓTNIA Z FANEM DOŁUSTATS',
 x:'Masz passę słabych zawodów i o 1:40 w nocy kłócisz się w internecie z kibicem własnej drużyny. On ma screeny, ty masz argumenty.',
 cond:(p)=>p.form<0,
 o:[
  {l:'Rezygnuję z odpisywania.', f:()=>[fxP(3), fxH(-5), fxA(-1)]},
  {l:'Zakładam się z nim o wynik.', f:()=>['Wygrałeś zakład — kibic piłuje karnet na wizji.', fxO(1), fxM(3), fxA(1)]}
 ]},
{id:'zona', t:'KOLEGA Z ZESPOŁU I TWOJA ŻONA',
 x:'Dowiadujesz się z grupy na WhatsAppie. Ten sam kolega wywozi cię w trzecim biegu na trzecim łuku, przez co tracisz pozycję.',
 o:[
  {l:'Walę go w mordę.', f:()=>[fxM(10), fxP(-10), fxFine(5000), fxBan(1)]},
  {l:'Cosplay Krzyśka Gonciarza.', f:()=>[fxM(-10), fxP(R(-5,5))]},
  {l:'Zostawiam robotę mechanikom.', f:()=>[fxM(5), fxP(-5), fxFit(30)]}
 ]},
{id:'race', t:'RACE NA TRYBUNIE, MECZ PRZERWANY NA 40 MINUT',
 x:'Sektor młodzieżowy odpalił wszystko, co miał. Dym zasłonił drugi łuk, sędzia przerwał zawody, a spiker prosi o spokój głosem człowieka, który wie, że nikt go nie słucha.',
 o:[
  {l:'Idę pod trybunę klaskać.', f:()=>[fxM(10), fxP(-5), fxFine(5000)]},
  {l:'Siedzę w parku maszyn.',   f:()=>[fxP(5), fxM(-5)]}
 ]},
{id:'flaga', t:'KIBICE CHCĄ TWOJEJ FLAGI NA TRYBUNIE',
 x:'Po latach w klubie sektor młodzieżowy zrobił zbiórkę na sektorówkę z twoją podobizną. Wyszedłeś jak Zmarzlina, ale intencja się liczy.',
 cond:(p)=>p.loyalty>=55,
 o:[
  {l:'Wychodzę pod trybunę i dziękuję.', f:()=>[fxM(12), fxL(10), fxH(6)]},
  {l:'Wykorzystuję moment i idę po podwyżkę.', f:()=>[fxRate(1.2), fxL(-10), fxP(-5)]}
 ]},
{id:'swistek', t:'ŚWISTEK W GORZOWIE',
 x:'W parku maszyn podchodzi do ciebie człowiek w kurtce klubowej ze świstkiem A5. „Podpisz tu, to formalność, kwestie regulaminowe”. Nie ma nagłówka, nie ma pieczątki. Jest rubryka „oświadczam, że odmawiam…”.',
 o:[
  {l:'Podpisuję.', f:()=>{
     return [fxFine(10000)+' z PZM', fxM(5)+' (świstek wyciekł do mediów)', fxWalk('both',1),
             'Następny mecz: obustronny walkower, obie drużyny tracą po punkcie.'];}},
  {l:'Nie podpisuję.', f:()=>[fxI(25)+' w najbliższej kolejce', 'Jedziesz na torze, na który nikt nie chciał wyjechać.']}
 ]},
{id:'rempala', t:'DUCH KRYSTIANA REMPAŁY',
 x:'O 3:14 w nocy na parkingu przy stodole materializuje się postać w biało-niebieskim kevlarze. Trzyma biały kask z napisem „RECEPTA NA SUKCES” i chce ci sprzedać patent na lepszą aerodynamikę.',
 o:[
  {l:'Słuchasz go.',     f:()=>{
     const l=[fxO(3)+' — nagle rozumiesz pierwszy łuk', fxI(50)+' (duch nie mówił o hamowaniu)'];
     if(chance(10)) l.push('Patent na aerodynamikę zadziałał. Hamowanie już nie.',
                           fxLongInj('zerwane więzadła i złamane udo po wjechaniu w bandę na pełnym gazie'));
     return l;}},
  {l:'Nie słuchasz go.', f:()=>{const k=R(1000,5000);return ['Odganiasz ducha kaskiem.', fxK(k)+' od producenta kasków za tę reklamę'];}}
 ]},
{id:'gaczorek', t:'GACZOREK AI DOSTAJE AKTUALIZACJĘ',
 x:'Nowa wersja pozwala zawodnikom podpytywać o ustawienia sprzętu bezpośrednio z boksu. Regulamin nic o tym nie mówi, bo regulamin nigdy nic nie mówi.',
 o:[
  {l:'Korzystam — ale ktoś kabluje.', f:()=>[fxO(R(-3,3))+' (algorytm to loteria)', fxM(-10), fxP(-10)]},
  {l:'„Sam sobie poradzisz”.', f:()=>['Ustawiasz na czuja, jak dziadek. Nic się nie zmienia.']}
 ]},
/* ===== MIĘDZYSEZONIE: KUSZENIE PRZEZ RYWALA =====
   (IM ARGENTYNY przeniesione do WINTER_EVENTS — patrz niżej) */
{id:'kuszenie', t:'KUSZENIE PRZEZ INNY KLUB — RYWAL PŁACI KARĘ UMOWNĄ',
 x:()=>{const t=temptClub(); return 'Masz podpisane jeszcze '+G.p.contract.years+' lata. Menedżer '+
   (t?esc(t.name):'bogatszego klubu')+' mówi wprost: „karę umowną bierzemy na siebie, prezes twojego klubu dostanie przelew, '+
   'a ty busa i stawkę, o jakiej tam nie pomarzysz”. Wszystko na parkingu przed halą, bez świadków.';},
 /* Tylko przy DŁUGIM, wciąż trwającym kontrakcie i realnym klubie */
 cond:(p,c,S)=>!!c && p.contract.years>=2 && !!temptClub(),
 w:6,
 o:[
  {l:'Biorę kasę i jadę. Lojalność nie płaci rat za busa.', f:()=>{
     const t=temptClub();
     const kara=R(60000,140000);
     G.p.contract.years=1;                       // umowa kończy się z tym sezonem
     G.p.next.forceClub = t ? t.name : 'weak';
     G.S.noRenew=true;
     return [fxK(kara)+' „premii lojalnościowej” od nowego pracodawcy',
             fxL(-45), fxP(-12), fxM(10),
             'Kara umowna zapłacona przez '+(t?t.name:'nowy klub')+'. Twój stary prezes dowiedział się z portalu.',
             'PO SEZONIE PRZECHODZISZ DO: '+(t?t.name:'losowego klubu')+'.']; }},
  {l:'Mam umowę i mam słowo. Zostaję.', f:()=>{
     const t=temptClub();
     return [fxL(18), fxP(10), fxM(-4),
             'Menedżer '+(t?t.name:'rywala')+' wyszedł bez pożegnania. Szatnia i sektor B dowiedzieli się, że odmówiłeś.']; }}
 ]},
{id:'slowacja', t:'ZAPROSZENIE ZE SŁOWACJI',
 x:'Martin ze Słowacji zaprasza cię do znajomych na Facebooku, a w wiadomości ma już gotową propozycję kontraktu i zdjęcie toru w Żarnovicy.',
 o:[
  {l:'Akceptuję.', f:()=>{G.p.next.forceClub='weak';G.p.next.rateMul=1.4;
     return ['Transfer do losowego klubu z najniższej ligi — za to z wysoką stawką za punkt.', fxP(-5)];}},
  {l:'Odrzucam.',  f:()=>[fxL(3)]}
 ]},
{id:'alfred', t:'TAJEMNICZA PRZEJAŻDŻKA',
 x:'Alfred z Leszna proponuje Ci przejażdżkę samochodem, aby omówić sprawy sprzętowe.',
 o:[
  {l:'Zgadzam się.', f:()=>{ 
     if(chance(25)) return [fxO(5)+' (Sprzedał Ci tajniki żużla)'];
     return [fxEnd('Wypadek podczas wycieczki z Alfredem. Koniec kariery.')];
  }},
  {l:'Pojadę awionetką z Tomaszem, będzie szybciej.', f:()=>[fxI(40)]}
 ]},
{id:'maksym_wlewka', t:'WIECZOREK POETYCKI',
 x:'Maksym zaprasza Cię na małą wlewkę i wieczorek poetycki.',
 o:[
  {l:'Idę na to.', f:()=>[fxO(2), fxM(-20)]},
  {l:'Nie idę, bo dostanę depresji.', f:()=>[fxP(10)]}
 ]},
{id:'ojciec_afera', t:'KONFLIKT Z OJCEM',
 x:'Twój ojciec był przy Tobie przez całą karierę. Stwierdzasz, że czas odciąć pępowinę. Kłócicie się w parku maszyn.',
 o:[
  {l:'Nie przepraszasz ojca.', f:()=>[fxM(30), pick([fxO(5), fxO(-5)])]},
  {l:'Przepraszasz.', f:()=>[fxP(10), fxM(-5), fxO(1), fxH(10)]}
 ]},
{id:'wojna_kraj', t:'KONFLIKT ZBROJNY',
 x:'Twój kraj rozpoczyna wojnę z innym państwem.',
 o:[
  {l:'Udaję, że jestem przeciwko.', f:()=>[fxS('banMatches', 14), {t:'+250 000 zł z zagranicznego kontraktu', f:(p)=>p.budget+=250000}]},
  {l:'Jaka wojna? Kto to widział.', f:()=>[fxEnd('Zawieszenie i deportacja. Koniec kariery w Polsce.')]}
 ]},
{id:'karetka_lodz', t:'BŁYSKAWICZNA KARETKA W ŁODZI',
 x:'Podczas meczu w Łodzi ulegasz wypadkowi. Prezes klubu łapie Cię za ramię i mówi, że szybko załatwi karetkę.',
 o:[
  {l:'Zgadzasz się.', f:()=>{ 
     if(chance(80)) return [fxI(-20)];
     return [fxEnd('Karetka okazała się karawanem. Dostałeś „piąteczkę pavuloniku”. Koniec kariery.')];
  }},
  {l:'Odmawiasz i czekasz na NFZ.', f:()=>[fxI(20)]}
 ]},
{id:'brat_dziewczyna', t:'RODZINNY KONFLIKT',
 x:'Spotykasz fajną dziewczynę na stadionie. Twój brat pyta, czy może ją odprowadzić do domu.',
 o:[
  {l:'Dajesz mu wolną rękę.', f:()=>[fxI(50)+' (Agresja na torze rośnie)']},
  {l:'Nie dajesz.', f:()=>[fxM(-20)]}
 ]},
{id:'maz_dziwna', t:'WIZYTA W BUDCE KOMENTATORSKIEJ',
 x:'Tomasz zaprasza Cię jako gościa do budki komentatorskiej w trakcie meczu.',
 o:[
  {l:'Zgadzam się (i z jakiegoś powodu lepię się dziwną mazią).', f:()=>[fxM(10)]},
  {l:'Wolę go nie słuchać.', f:()=>[fxP(10)]}
 ]},
{id:'minister_sportu', t:'WIZYTA MINISTRA SPORTU',
 x:'Ważne spotkanie. Na stadionie ma się pojawić Minister Sportu, a sędziować będzie znany z surowości arbiter.',
 o:[
  {l:'Zróbmy kartoflisko na torze.', f:()=>{ 
     if(chance(70)) return [fxT(3), fxO(1)];
     // p.club to NAZWA klubu (string), nie obiekt — stary zapis `p.club.c.budget`
     // nigdy nic nie robił. Klub wyciągamy przez clubOf().
     return [fxWalk('lose', 0), fxS('banMatches', R(0,3)),
             {t:'Kara od GKSŻ: -300 000 zł dla klubu', f:(p)=>{const c=clubOf(p); if(c) c.budget-=300000;}}];
  }},
  {l:'Jedziemy uczciwie.', f:()=>[fxT(-1), fxH(-10)]}
 ]},
{id:'swinia_szalik', t:'NIELEGALNA OPRAWA',
 x:'Grupa kibiców prosi Cię o pomoc w przemyceniu Twoim busem specyficznej oprawy na mecz derbowy.',
 o:[
  {l:'Pomagam im.', f:()=>{ 
     if(chance(10)) return [fxT(3), fxS('banMatches', 3)];
     return [fxT(3)+' (Świnia w szaliku rywali biega po torze)'];
  }},
  {l:'Odmawiam.', f:()=>[fxP(10)]}
 ]},
{id:'prezes_quad', t:'ŚWIRUJĄCY PREZES',
 x:'Jedziesz mecz finałowy o awans. Twój prezes po pierwszym wygranym spotkaniu zaczyna świrować na quadzie pod taśmą.',
 cond:(p,s)=>s.round>=14,
 o:[
  {l:'Patrzysz z zażenowaniem.', f:()=>[fxP(-5), fxM(15)]}
 ]},
{id:'tlumacz_mechanik', t:'WYWIAD Z TŁUMACZEM',
 x:'Brytyjska telewizja prosi o wywiad, ale Ty nie znasz angielskiego. Obok stoi Twój mechanik z zawodówki.',
 o:[
  {l:'Odpowiadasz sam.', f:()=>[fxM(-20), fxP(10)]},
  {l:'Podstawiasz mechanika („Dobra, powiedz mu, że kurwa ciężko było”).', f:()=>[fxM(30), fxP(-15)]}
 ]},
{id:'udawany_upadek', t:'LEŻĘ DALEJ!',
 x:'Upadasz w 14. biegu na ostatniej pozycji, ale widzisz, że przegrywacie 1:5. Postanawiasz leżeć dalej, wymuszając powtórkę.',
 o:[
  {l:'Leżę!', f:()=>{ 
     if(chance(75)) return [fxEnd('Zdemaskowali Cię. Zostałeś wykluczony, kibice spalili Ci busa. Po latach zostałeś bezdomnym i dostałeś raka skóry.')];
     return [fxT(2)+' (Kolega wygrał powtórkę)'];
  }},
  {l:'Wstaję i zjeżdżam z toru.', f:()=>[fxP(10)]}
 ]},
{id:'komisariat_ostrowski', t:'OSTROWSKI KOMISARIAT',
 x:'Zostałeś zatrzymany przez lokalną policję pod wpływem stresu pomeczowego.',
 o:[
  {l:'W chuja zrobił Andrzej wariat.', f:()=>[fxP(-20), fxM(20)]},
  {l:'Uciekam w alkohol.', f:()=>[fxEnd('Potrącasz kobietę i odsiadujesz wyrok wyższy niż za morderstwo.')]}
 ]},
{id:'zbiorka_junior', t:'ZBIÓRKA NA LECZENIE',
 x:'Junior z KLŻ wypierdolił w bandę na próbie toru. W internecie ruszyła zbiórka na jego leczenie.',
 o:[
  {l:'Jesteśmy żużlową rodziną, dorzucam się.', f:()=>{return [{t:'-100 zł z konta', f:(p)=>p.budget-=100}];}},
  {l:'Co to za ogór, nie daję nic.', f:()=>[fxM(-5)]},
  {l:'Obiecuję publicznie, że dam, ale nie przelewam.', f:()=>{ 
     if(chance(50)) return [fxM(-30), fxP(-20)+' (Wybuchła afera)'];
     return [fxM(10)];
  }}
 ]},
{id:'zbiorka_mistrz', t:'REHABILITACJA MISTRZA',
 x:'Kilkukrotny mistrz świata doznał wielokończynowego złamania. Potrzebuje drogiej rehabilitacji w Szwajcarii.',
 o:[
  {l:'Oddaję mu zarobki z turnieju.', f:()=>[fxP(10)]},
  {l:'#MistrzJestJeden. Udostępniam post, ale kasy nie daję.', f:()=>[fxM(10)]}
 ]},
{id:'kradziony_silnik', t:'CZYJ TO SILNIK?',
 x:'Przypadkiem w Twoim boksie mechanicy znajdują ukradziony silnik juniora z Twojego klubu.',
 o:[
  {l:'Nic o tym nie wiedziałem.', f:()=>[fxP(10)]},
  {l:'Zajebałem jak Dawid w Argentynie.', f:()=>[fxM(10), fxO(-2)]}
 ]},
{id:'rozkrecony_silnik', t:'TAJEMNICA TUNERA',
 x:'Z ciekawości rozkręciłeś silnik od topowego tunera, nie mając jego zgody.',
 o:[
  {l:'Teraz wiem, jak to działa.', f:()=>[fxE(-30), fxP(-15)+' (Tuner zablokował Ci dostęp do swoich jednostek na zawsze)']}
 ]},
{id:'pociag_gwizdek', t:'POCIĄG ZBIEG',
 x:'Prowadzisz w biegu, ale za płotem stadionu przejeżdża pociąg, który gwiżdże. Z zaskoczenia puszczasz gaz i upadasz.',
 o:[
  {l:'Mówisz, że spadł Ci łańcuszek.', f:()=>[fxP(-5), fxO(-5)]},
  {l:'Mówisz prawdę w wywiadzie.', f:()=>[fxP(-20), fxM(10)]}
 ]},
{id:'zemsta_brata', t:'ZEMSTA BRATA',
 x:'Masz upadek w pierwszym łuku z winy zawodnika rywali. Twój krewki brat wybiega z parku maszyn w stronę sprawcy.',
 o:[
  {l:'Krzyczysz, żeby go zostawił.', f:()=>[fxP(10)]},
  {l:'Pozwalasz mu kopnąć leżącego przeciwnika.', f:()=>[fxS('banMatches', 5), fxM(30), fxP(-20)]}
 ]},
{id:'impreza_rybnik', t:'IMPREZA Z RAFAŁEM',
 x:'Kolega Rafał po imprezie w Rybniku pyta, czy go podwieziesz do domu, czy ma wracać sam.',
 o:[
  {l:'Pojadę, kogo niby potrącę o 2 w nocy?', f:()=>[fxM(20), fxP(-10)]},
  {l:'Niech jedzie sam. Da radę.', f:()=>[fxP(20)]}
 ]},
{id:'impreza_spanie', t:'WIECZÓR PRZED MECZEM',
 x:'Jesteś na mocnej imprezie u ziomka, a następnego dnia rano jedziesz bardzo ważne spotkanie.',
 o:[
  {l:'Otwierasz drzwi od auta i wypadzasz na ulicę (wozisz Ryana Sullivana).', f:()=>[fxP(-10), fxO(15), {t:'Pogorszone relacje z prezesem'}]},
  {l:'Idziesz spać na tylnej kanapie.', f:()=>[fxO(-10), fxP(-5)]}
 ]},
{id:'janusz_pytanie', t:'WYWIAD O JANUSZU',
 x:'Lokalny dziennikarz podtyka Ci mikrofon i pyta wprost: „Kim dla Pana jest Janusz Kołodziej?”.',
 o:[
  {l:'Stara k***a.', f:()=>[fxM(10), fxP(-20)]},
  {l:'Złodziej.', f:()=>[fxP(10), fxM(-5)]}
 ]},
{id:'kaczorek_ai', t:'OFERTA OD KACZORKA',
 x:'Przychodzi do Ciebie menedżer Piotr K. Mówi, że da Ci łapówkę, jeśli zrobisz parę zer, żeby dopasować Twoje wyniki do algorytmu AI.',
 o:[
  {l:'Zgadzam się.', f:()=>{return [{t:'+10 000 zł, Pomalowany sufit, OVR -5', f:(p)=>{p.budget+=10000;}}, fxO(-5)];}},
  {l:'Wzywasz Nighta i robisz wykład o szkodliwości AI.', f:()=>[fxM(-10), fxP(20)]}
 ]},
{id:'wesela_powrot', t:'TRZODA NA WESELU',
 x:'Prezes i trener Twojego byłego klubu robią potężną trzodę na Twoim weselu i namawiają Cię do powrotu.',
 o:[
  {l:'Uśmiechasz się z nimi do zdjęcia.', f:()=>[fxP(-5), fxM(15)]},
  {l:'Wypraszasz ich z wesela z ochroną.', f:()=>[fxP(5), fxM(-10)]}
 ]},
{id:'wizyta_zaklad', t:'WIZYTA ZAKŁAD KARNY',
 x:'Podczas wizyty u kolegi Rafała w lokalnym więzieniu w Rawiczu widzisz parę znajomych twarzy z zarządu.',
 o:[
  {l:'Podchodzisz się przywitać.', f:()=>{return [{t:'W przyszłym okienku dostaniesz tylko słabe oferty', f:(p)=>{p.next.forceClub = 'weak';}}];}},
  {l:'Nie spoufalam się z kryminalistami.', f:()=>[fxP(10), fxI(20)]}
 ]},
{id:'wlasciwy_komentarz', t:'KABINA KOMENTATORSKA',
 x:'Siedzisz w kabinie. Mecz trwa, musisz coś powiedzieć do mikrofonu.',
 o:[
  {l:'„Ozon jest bliżej ziemi”.', f:()=>[fxM(10)]},
  {l:'Krzyczysz: „HAHAHA SPIDŁEEEEJ!”.', f:()=>[fxM(20), fxP(-10)]},
  {l:'Mówisz losowe rzeczy, bo nie znasz budowy motocykla.', f:()=>[fxP(-15)]}
 ]},
{id:'kask_zapinanie', t:'NOWY KASK OD SPONSORA',
 x:'Przed meczem dostajesz nowy, niesprawdzony kask prosto z Temu.',
 o:[
  {l:'Sprawdzam zapięcie.', f:()=>[fxP(2)]},
  {l:'Pierdolę to, zakładam jak leci.', f:()=>{ 
     if(chance(50)) return [fxEnd('Zapięcie puściło w trakcie biegu. Uraz głowy, koniec kariery.')];
     return [fxM(5)];
  }}
 ]},
{id:'birkmose_szlug', t:'DYMEK W PARKU MASZYN',
 x:'Marcus Birkemose częstuje Cię dziwnie pachnącym szlugiem tuż po 15. biegu.',
 o:[
  {l:'Biorę.', f:()=>{ 
     if(chance(60)) return [fxS('banMatches', 14), fxP(-30)+' (Wpadka na teście dopingowym)'];
     return [fxM(20), fxO(-2)];
  }},
  {l:'Odmawiam.', f:()=>[fxP(10)]}
 ]},
{id:'zpiecie_kibic_leszno', t:'KIBIC Z LESZNA',
 x:'Wdajesz się w pyskówkę pod płotem z nabuzowanym kibicem z Leszna (styl Tai W.).',
 o:[
  {l:'Przyjmujesz walkę.', f:()=>[fxM(15), fxI(20), fxS('banMatches', 2)]},
  {l:'Wycofujesz się i odchodzisz.', f:()=>[fxP(10)]}
 ]}
];

/* ============================================================
   3-bis. ZDARZENIA MIĘDZYSEZONOWE (PRZERWA ZIMOWA)
   ------------------------------------------------------------
   OSOBNA PULA, odpalana WYŁĄCZNIE między sezonami: po resolveSeason()
   i PRZED makeOffers() (patrz rollWinterEvent() / scWinter w engine.js
   i index.html). Dzięki temu „zima w Argentynie" nie trafia się już
   w środku okresu startowego, a jej skutki (OVR, sprzęt, gotówka,
   alimenty, wymuszony transfer) są widoczne jeszcze przed okienkiem
   transferowym — dokładnie tak, jak w życiu.

   UWAGA DLA AUTORÓW NOWYCH ZDARZEŃ ZIMOWYCH:
   w przerwie zimowej NIE MA obiektu sezonu (G.S jest wyzerowany do
   pustego kontekstu), więc nie używamy tu fxA / fxT / fxOB / fxH / fxI
   ani fxBan — one dotyczą TRWAJĄCEGO sezonu. Zamiast nich:
     fxHN  — szanse na biegi w KOLEJNYM sezonie
     fxIN  — ryzyko urazu w KOLEJNYM sezonie
     fxRateN, G.p.next.* — wszystko, co ma zadziałać po okienku
   cond dostaje (p, c, S) tak jak zwykle, ale S to pusty kontekst zimowy
   ({winter:true, round:0, matches:0}).
   ============================================================ */
const WINTER_EVENTS=[

{id:'argentyna_im', t:'INDYWIDUALNE MISTRZOSTWA ARGENTYNY',
 x:()=>'Zima. Faks (tak, faks) z Buenos Aires: zaproszenie na cykl turniejów o mistrzostwo Argentyny. '+
       'Twój OVR ('+G.p.ovr+') mieści się dokładnie w przedziale, którego szukają: ktoś z Europy, kto nie jest gwiazdą '+
       'i zgodzi się jechać za bilet oraz asado. Liga rusza za sześć tygodni.',
 /* TYLKO ŚREDNI OVR. `noArg` = spaliłeś most, sprzedając Argentyńcowi oklejony złom. */
 cond:(p)=>p.ovr>=45 && p.ovr<=75 && !p.next.noArg,
 w:10,
 o:[
  {l:'Jadę na własny koszt — zima w Argentynie brzmi lepiej niż Mietek.', f:()=>{
     const koszt=R(25000,40000);
     const l=[fxK(-koszt)+' za bilety i transport sprzętu'];
     /* --- CZĘŚĆ SPORTOWA: bez zmian względem starej wersji (zysk OVR / utrata sprzętu / upadek) --- */
     const r=R(1,100);
     if(r<=30){ const nagr=R(60000,110000);
       l.push('WYGRYWASZ CAŁY CYKL. Mistrz Argentyny.', fxO(3), fxM(8), fxK(nagr)+' nagród i startowego', fxP(4)); }
     else if(r<=70){
       l.push('Linia lotnicza zgubiła skrzynię ze sprzętem. Znalazła się. W Limie. Po sezonie.',
              fxE(-20), fxK(-R(20000,45000))+' na sprzęt zastępczy i odprawy celne',
              fxM(5)+' (płacz na wizji obejrzała cała Polska)'); }
     else {
       l.push('Upadek na twardym torze w Prowincji Buenos Aires na tydzień przed startem ligi.',
              fxIN(25)+' (plecy pamiętają ten tor)', fxO(1)+' (jazdy jednak trochę było)'); }
     /* --- TWARDE 10%: WPADKA Z ARGENTYNKĄ ---
        Losowane NIEZALEŻNIE od wyniku sportowego: możesz wrócić jako mistrz
        Argentyny i z alimentami na osiemnaście lat. */
     if(chance(10)){
       l.push('Valentina z Mar del Plata. Trzy tygodnie, jedno asado i telefon w lipcu: będzie dziecko.',
              fxAlimony(),
              fxM(6)+' (temat obiegł wszystkie portale)', fxP(-6));
     }
     return l; }},
  {l:'Zostaję trenować u Mietka. Przysiady na czas, ale u siebie.',
   f:()=>[fxO(1), fxP(4), 'Bez fajerwerków. Za to bez gipsu, bez faktur z lotniska i bez alimentów.']}
 ]},

{id:'zima_hiszpania', t:'ZIMOWE ZGRUPOWANIE W ALMERII',
 x:'Grupa zawodników leci na trzy tygodnie do Almerii: tor, siłownia, dietetyk i zero wymówek. Cena za osobę robi wrażenie.',
 cond:(p)=>p.budget>=80000,
 w:4,
 o:[
  {l:'Lecę. Trzy tygodnie jazdy w styczniu robią sezon.', f:()=>[fxK(-80000), fxO(3), fxP(5), fxHN(5)]},
  {l:'Siłownia u pana Mietka na osiedlu.', f:()=>[fxO(1), fxM(-4)+' — inni wrzucali story z plaży']}
 ]},

{id:'zima_warsztat', t:'ZIMA W WARSZTACIE ALBO ZIMA W WERANDZIE',
 x:'Cztery miesiące bez meczu. Mechanik rozłożył silniki na części i pyta, czy przyjeżdżasz to składać, czy on ma to zrobić sam.',
 w:3,
 o:[
  {l:'Siedzę z nim w warsztacie do lutego.', f:()=>[fxP(8), fxE(6), fxM(-4)+' — zniknąłeś z internetu']},
  {l:'Zima jest raz w roku. Weranda też.',   f:()=>[fxM(8), fxP(-8), fxE(-4), fxIN(8)+' (kondycja po zimie)']}
 ]},

{id:'zima_menedzer', t:'MENEDŻER DZWONI PRZED OKIENKIEM',
 x:'„Mam dla ciebie dwa telefony, ale musisz mi obiecać, że nie podpiszesz nic bez mojej wiedzy”. Chce 15% i zaliczkę na paliwo.',
 w:3,
 o:[
  {l:'Niech dzwoni. 15% to 15%.', f:()=>{G.p.next.betterOffers=true;
     return [fxK(-8000)+' zaliczki', 'Menedżer obdzwonił ligę — w tym okienku dostajesz lepsze oferty.'];}},
  {l:'Sam sobie zadzwonię.', f:()=>[fxP(5)]}
 ]},

{id:'zima_operacja', t:'ZIMOWA OPERACJA — „TO TRZEBA WRESZCIE POSKŁADAĆ”',
 x:'Ortopeda oglądał zdjęcia z całej kariery i mówi wprost: albo teraz płytka i śruby, albo za dwa lata koniec.',
 cond:(p)=>p.career.seasons>=3 && p.age>=24,
 w:3,
 o:[
  {l:'Kładę się na stół w grudniu.', f:()=>[fxK(-35000)+' za zabieg poza kolejką', fxO(2), fxIN(-15)+' (wreszcie poskładany)', fxP(6)]},
  {l:'Pojadę na zastrzykach, jak zawsze.', f:()=>[fxIN(18), fxM(3)]}
 ]},

{id:'zima_alimenty', t:'LIST Z SĄDU RODZINNEGO',
 x:()=>'Koperta z Buenos Aires przez polski sąd. Zostało rat: '+(G.p.alimony||0)+'. Adwokat proponuje wniosek o obniżenie kwoty.',
 /* Odpala się TYLKO wtedy, gdy naprawdę płacisz alimenty */
 cond:(p)=>(p.alimony||0)>0,
 w:8,
 o:[
  {l:'Płacę adwokatowi i walczę o obniżkę.', f:()=>{
     const l=[fxK(-12000)+' zaliczki dla adwokata'];
     if(chance(35)){ G.p.alimony=Math.max(0,G.p.alimony-4);
       l.push('Sąd skrócił obowiązek o 4 lata. Zostało rat: '+G.p.alimony+'.'); }
     else l.push('Wniosek odrzucony. Zostało rat: '+G.p.alimony+'.');
     return l;}},
  {l:'Płacę i nie komentuję.', f:()=>[fxP(4), 'Rat do zapłaty: '+(G.p.alimony||0)+'.']}
 ]},
 
 {id:'matka_boska_klub', t:'OBJAWIENIE SPONSORA',
 x:'Prezes wielkiej firmy po wybudowaniu figury Matki Boskiej doznaje wizji, że Ty musisz poprowadzić jego nowy klub żużlowy.',
 o:[
  {l:'Tak jak Pan Jezus powiedział – wchodzę w to.', f:()=>{ 
     return [fxH(50), fxM(10), pick([fxO(5), fxO(-5)]), {t:'Wymuszony transfer + Kasa', f:(p)=>{p.next.forceClub='any'; p.budget+=pick([100000, -100000]);}}];
  }},
  {l:'Prędzej zaufam wąsatemu gościowi na quadzie.', f:()=>[fxP(10)]}
 ]},
{id:'insta_15latka', t:'WIADOMOŚĆ NA INSTAGRAMIE',
 x:'Pisze do Ciebie 15-latka na Instagramie.',
 o:[
  {l:'„Zapraszam na herbatkę.”', f:()=>[fxP(10), fxM(10)]},
  {l:'„Pokaż pupę w stringach.”', f:()=>{ 
     if(chance(10)) return [{t:'Afera obyczajowa, wylatujesz z klubu.', f:(p)=>{p.next.forceClub='weak';}}, fxM(-20)];
     if(chance(10)) return [fxO(2), fxM(-20)];
     return [fxM(-20)];
  }}
 ]},
{id:'zima_emilcin', t:'WIGILIA W EMILCINIE',
 x:'Z nudów jedziesz w Wigilię do Emilcina.',
 o:[
  {l:'Dotykasz pomnika kosmitów.', f:()=>[fxO(10)+' (Dostałeś energię z kosmosu)']},
  {l:'Żałujesz wyjazdu, nie wierzysz w UFO.', f:()=>[fxM(-10), fxI(15)]}
 ]},
{id:'szafa_influencer', t:'SKŁADANIE SZAFY',
 x:'Najebany żużlowy influencer dzwoni do Ciebie w grudniu i zaprasza na wspólne składanie szafy z IKEI.',
 o:[
  {l:'Zgadzam się.', f:()=>[fxO(2), fxI(30)]},
  {l:'Pierdolę, dzwonię na psy.', f:()=>[fxM(-10), fxP(10)]}
 ]},
{id:'romans_prezeska', t:'PROPOZYCJA PREZESKI',
 x:'Prezeska klubu dzwoni przed okienkiem. Chce, żebyś ją wyruchał na oczach jej męża.',
 o:[
  // stawka za punkt siedzi w kontrakcie zawodnika (p.contract.rate), a nie w klubie
  {l:'Zgadzam się.', f:()=>{return [{t:'Podwyżka +2 000 zł za punkt.', f:(p)=>{p.contract.rate+=2000;}}];}},
  {l:'Rozwiązuję kontrakt z obrzydzenia.', f:()=>{return [{t:'Uciekasz do innej ligi.', f:(p)=>{p.next.forceClub='weak';}}];}}
 ]},
{id:'corka_prezesa', t:'ROMANS Z CÓRKĄ',
 x:'Wdajesz się w grudniowy romans z córką prezesa.',
 o:[
  {l:'Oświadczasz się jej.', f:()=>{return [{t:'Kontrakt przedłużony o 5 lat!', f:(p)=>{p.contract.years+=5;}}];}},
  {l:'Mówisz prezesowi, że jej nie znasz.', f:()=>{return [{t:'Wkurzony prezes niszczy Ci reputację. Masz oferty tylko z KLŻ.', f:(p)=>{p.next.forceClub='weak';}}];}}
 ]},
{id:'zamrzniete_jezioro', t:'MROŹNY TRENING',
 x:'Mróz -20 stopni. Wpadasz na genialny pomysł trenowania na kolcach po zamarzniętym jeziorze.',
 o:[
  {l:'Wyjeżdżam na lód.', f:()=>{ 
     if(chance(50)) return [fxEnd('Lód pęka. Utonąłeś wraz z motocyklem.')];
     return [fxO(5)];
  }},
  {l:'Spokojnie, idę na saunę.', f:()=>[fxP(10)]}
 ]},
{id:'chris_harris', t:'TRENING Z BOMBEREM',
 x:'Chris Harris dzwoni w lutym i zaprasza Cię na wspólny trening na szkółkowym owalu w Anglii.',
 o:[
  {l:'Jadę trenować.', f:()=>[fxM(30), fxP(-10)]},
  {l:'Zostaję w domu.', f:()=>[fxM(-40)]}
 ]},
{id:'dietetyk_wawrzyniak', t:'DIETA OD DAWIDA',
 x:'Dawid Wawrzyniak proponuje, że od zimy zostanie Twoim osobistym dietetykiem.',
 o:[
  {l:'No raczej, wchodzę w to.', f:()=>[fxO(-5)+' (Prędkość spada, waga rośnie)']},
  {l:'Nie potrzebuję dietetyka.', f:()=>[fxP(-20)]}
 ]},
 {id:'gala_lodowa_drabik', t:'GALA LODOWA W CZĘSTOCHOWIE',
 x:'Sławomir Drabik dzwoni i zaprasza na tradycyjną Galę Lodową. Tor jest z lodu, masz jechać na starych oponach z wkrętami do drewna.',
 o:[
  {l:'Wbijam wkręty i jadę w futrze!', f:()=>{ 
     if(chance(20)) return [fxEnd('Wkręt wyleciał koledze z opony i trafił Cię w tętnicę. Tragedia na lodzie, koniec kariery.')]; 
     if(chance(40)) return [fxI(30)+' (Rozorana łydka)'];
     return [fxM(30), fxO(3)];
  }},
  {l:'Za zimno, siedzę w domu z grzańcem.', f:()=>[fxP(10)]}
 ]},
{id:'bal_tygodnika', t:'BAL TYGODNIKA ŻUŻLOWEGO',
 x:'Zostałeś zaproszony na Bal Tygodnika Żużlowego. Wszyscy są już po kilku głębszych, a prezes lokalnych rywali głośno obraża Cię przy barze.',
 o:[
  {l:'Rzucasz w niego kieliszkiem z wódką.', f:()=>{return [fxM(30), fxP(-30), {t:'Kara od centrali: -20 000 zł', f:(p)=>p.budget-=20000}];}},
  {l:'Ignorujesz i idziesz tańczyć z żoną redaktora.', f:()=>[fxP(15), fxM(10)]}
 ]},
{id:'tuner_zdrada', t:'DRAMAT U TUNERA',
 x:'Jedziesz w lutym odebrać silniki od topowego tunera. Przez okno widzisz, jak pakuje Twoje najlepsze głowice do busa zawodnika z Grand Prix.',
 o:[
  {l:'Robisz awanturę na pół warsztatu.', f:()=>[fxP(-15), fxE(-30)+' (Zemsta tunera: wcisnął Ci szrot)']},
  {l:'Kupujesz mu dobrą whisky i błagasz o cokolwiek.', f:()=>[fxP(10), fxE(15)]}
 ]},
{id:'freak_fight', t:'OFERTA Z FAME MMA',
 x:'Marcin Najman i federacja freak-fightowa proponują Ci walkę w klatce z sędzią, który rok temu wyrzucił Cię w 14. biegu.',
 o:[
  {l:'Biorę to! Zemsta i pieniądze!', f:()=>{return [fxM(50), fxP(-30), fxI(40), {t:'Wypłata z PPV: +150 000 zł', f:(p)=>p.budget+=150000}];}},
  {l:'Jestem żużlowcem, nie patusem.', f:()=>[fxP(20), fxM(-10)]}
 ]},
{id:'kalendarz_miesny', t:'KALENDARZ SPONSORA',
 x:'Główny sponsor (zakłady mięsne) wymaga, abyś zimą zapozował nago z pętą kiełbasy śląskiej do klubowego kalendarza.',
 o:[
  {l:'Pozuję, w końcu płacą.', f:()=>{return [fxM(-30), {t:'Premia za wstyd: +15 000 zł', f:(p)=>p.budget+=15000}];}},
  {l:'Odmawiam stanowczo.', f:()=>{return [fxP(10), {t:'Utrata dotacji sponsora: -50 000 zł w kasie klubu', f:(p)=>{const c=clubOf(p); if(c) c.budget-=50000;}}];}}
 ]},
{id:'skoki_zakopane', t:'INTEGRACJA POD KROKWIĄ',
 x:'Prezes zabiera drużynę na integrację do Zakopanego na skoki narciarskie. O 3 w nocy ktoś proponuje zjazd na miednicy z zeskoku.',
 o:[
  {l:'Zjeżdżam, co może pójść nie tak?', f:()=>{
     if(chance(40)) return [fxLongInj('Uderzenie w bandę przy 80 km/h. Połamane obie nogi.')]; 
     return [fxH(25), fxO(2)+' (Hart duetu)'];
  }},
  {l:'Pilnuję kolegów, żeby się nie pozabijali.', f:()=>[fxP(15), fxH(-10)]}
 ]},
{id:'mechanik_spawa', t:'ZDRADA MECHANIKA',
 x:'W styczniu Twój główny mechanik dzwoni, że odchodzi z teamu, bo znalazł lepszą pracę przy spawaniu tłumików w Niemczech.',
 o:[
  {l:'Dajesz mu podwyżkę pod stołem.', f:()=>{return [{t:'-30 000 zł z Twojej kieszeni', f:(p)=>p.budget-=30000}, fxE(15)];}},
  {l:'Niech spierdala, sam sobie ustawię zapłon.', f:()=>[fxE(-30), fxP(-10)]}
 ]},
{id:'wybory_ulotki', t:'KAMPANIA WYBORCZA PREZESA',
 x:'Prezes startuje w lokalnych wyborach na radnego i zmusza drużynę do rozdawania ulotek pod kościołem o 7 rano w niedzielę.',
 o:[
  {l:'Rozdaję z uśmiechem.', f:()=>{return [fxM(-10), {t:'Dobre relacje (Premia +10k)', f:(p)=>p.budget+=10000}];}},
  {l:'Wyrzucam ulotki do śmietnika.', f:()=>[fxP(5), fxM(5), fxH(-15)]}
 ]},
{id:'garaz_odpalenie', t:'ZIMOWY GŁÓD METANOLU',
 x:'Nie możesz wytrzymać do wiosny. W lutym odpalasz motocykl w garażu podziemnym w swoim bloku.',
 o:[
  {l:'Gaz do dechy, niech sąsiedzi czują rycynę!', f:()=>{return [fxP(-20), fxM(15), {t:'Mandat i pozew: -5 000 zł', f:(p)=>p.budget-=5000}];}},
  {l:'Rozsądek wygrywa, gaszę.', f:()=>[fxP(10)]}
 ]},
{id:'szaman_klub', t:'ENERGO-TERAPEUTA W KLUBIE',
 x:'Klub zatrudnia bioenergoterapeutę. Każe Ci zimą pić wodę ładowaną przez telewizor i nosić miedziane wkładki w butach.',
 o:[
  {l:'Piję, jeśli ma pomóc na starty.', f:()=>{
     if(chance(30)) return [fxO(5)+' (To placebo, ale działa)']; 
     return [fxP(-15), fxO(-5)+' (Zatrucie pokarmowe przed sezonem)'];
  }},
  {l:'Wyśmiewam szamana na forum publicznym.', f:()=>[fxP(10), fxH(-10)]}
 ]},
{id:'tatuaz_herb', t:'PIJANY TATUAŻ',
 x:'Po noworocznej imprezie robisz sobie wielki tatuaż z herbem obecnego klubu na całych plecach.',
 o:[
  {l:'Dumnie pokazuję na Instagramie.', f:()=>{return [{t:'Blokada transferu! (Zostajesz w klubie na ten rok)', f:(p)=>p.next.forceClub='current'}, fxM(30)];}},
  {l:'Usuwam laserowo w bolesnej tajemnicy.', f:()=>{return [{t:'-15 000 zł za zabiegi laserowe', f:(p)=>p.budget-=15000}, fxI(15)];}}
 ]},
{id:'esport_speedway', t:'TURNIEJ E-SPORTOWY',
 x:'Zima się dłuży, więc bierzesz udział w oficjalnym turnieju e-sportowym w Speedway Challenge.',
 o:[
  {l:'Gram na poważnie, skupienie na 100%.', f:()=>[fxM(15), fxP(5)]},
  {l:'Wkurzam się na lagi i rozbijam klawiaturę na streamie.', f:()=>[fxM(25), fxP(-20)]}
 ]},
{id:'ksm_zmiana', t:'AFERA Z KSM',
 x:'W połowie lutego GKSŻ niespodziewanie wprowadza KSM (Kalkulowana Średnia Meczowa). Twój współczynnik absolutnie nie pasuje do wizji drużyny.',
 o:[
  {l:'Piszę pismo z błaganiem o status zastępstwa.', f:()=>[fxM(-10), fxP(-10)]},
  {l:'Jebie mnie to, idę do innej ligi.', f:()=>{return [{t:'Wymuszony transfer na słabszy klub', f:(p)=>p.next.forceClub='weak'}, fxP(10)];}}
 ]},
{id:'sylwester_petarda', t:'SYLWESTER Z MOŹDZIERZEM',
 x:'O północy kolega daje Ci do odpalenia ogromną, chińską petardę bez żadnego atestu.',
 o:[
  {l:'Odpalam, raz się żyje!', f:()=>{
     if(chance(30)) return [fxEnd('Petarda wybuchła w dłoni. Uraz amputacyjny. Koniec kariery.')]; 
     return [fxM(5), fxO(2)];
  }},
  {l:'Nie ruszam tego gówna, chronię ręce.', f:()=>[fxP(15), fxI(-10)]}
 ]},
{id:'morsowanie', t:'ZIMOWE MORSOWANIE',
 x:'Prezes umawia drużynę na modne morsowanie w lokalnym jeziorze, żeby zbudować charakter.',
 o:[
  {l:'Wchodzę do przerębla z uśmiechem.', f:()=>[fxH(15), fxO(2)]},
  {l:'Zostaję na brzegu w kurtce.', f:()=>[fxH(-15), fxP(-5)]}
 ]},
{id:'silnik_puzle', t:'ZABAWA W TUNERA',
 x:'Z nudów rozkręciłeś swój najlepszy silnik wyścigowy na dywanie w salonie, ale zapomniałeś, jak złożyć rozrząd.',
 o:[
  {l:'Składam na czuja. Metoda prób i błędów.', f:()=>{
     if(chance(50)) return [fxE(-40)+' (Silnik wybuchł na pierwszej próbie toru)']; 
     return [fxE(15)+' (Odkryłeś nową krzywą mocy)'];
  }},
  {l:'Wiozę części w kartonie po butach do mechanika.', f:()=>[fxP(-10), fxE(5)]}
 ]},
{id:'reality_show', t:'OFERTA Z TELEWIZJI',
 x:'Dostajesz propozycję z telewizji. Chcą Cię w nowym sezonie "Rolnik szuka żony", bo masz kawałek pola pod miastem.',
 o:[
  {l:'Biorę udział, darmowa promocja.', f:()=>[fxM(60), fxP(-30)]},
  {l:'Odmawiam robienia z siebie pośmiewiska.', f:()=>[fxP(20)]}
 ]},
{id:'auto_sponsora', t:'ROZBITE AUTO SPONSORA',
 x:'Na ośnieżonej drodze wpadasz w poślizg i kasujesz wypożyczone luksusowe auto od klubowego sponsora.',
 o:[
  {l:'Dzwonię na policję i się przyznaję.', f:()=>{return [fxP(10), {t:'-50 000 zł za szkodę', f:(p)=>p.budget-=50000}];}},
  {l:'Uciekam z miejsca zdarzenia.', f:()=>{
     if(chance(70)) return [fxEnd('Nagranie z monitoringu trafiło do sieci. Skandal, więzienie, koniec kariery.')]; 
     return [fxM(10)+' (Cudem Ci upiekło)'];
  }}
 ]},
{id:'oboz_survival', t:'SURVIVAL W BIESZCZADACH',
 x:'Prezes organizuje zimowy obóz survivalowy w Bieszczadach. Zero telefonów, spanie w szałasie i jedzenie kory.',
 o:[
  {l:'Przechodzę to i wracam twardszy.', f:()=>[fxO(5), fxH(20), fxI(10)]},
  {l:'Uciekam w nocy do pensjonatu z ciepłą wodą.', f:()=>[fxP(-15), fxH(-20)]}
 ]},
{id:'swiecenie_motocykli', t:'ŚWIĘCENIE SPRZĘTU',
 x:'W marcu prezes zaprasza lokalnego proboszcza na święcenie motocykli. Ksiądz polewa je obficie wodą święconą prosto po gaźnikach.',
 o:[
  {l:'Pozwalasz mu lać.', f:()=>[fxE(-20)+' (Woda zalała gaźnik)', fxP(5)]},
  {l:'Zasłaniasz motocykl własnym ciałem.', f:()=>[fxM(15), fxE(10)]}
 ]},
{id:'plebiscyt', t:'LOKALNY PLEBISCYT',
 x:'Na gali "Sportowiec Roku" przegrywasz statuetkę z ping-pongistą z trzeciej ligi. Masz już promile we krwi.',
 o:[
  {l:'Wchodzisz na scenę i robisz dym przed kamerami.', f:()=>[fxM(40), fxP(-30)]},
  {l:'Klaszczesz grzecznie i idziesz topić smutki w wódce.', f:()=>[fxP(5), fxO(-2)]}
 ]},
{id:'kradziez_busa', t:'UKRADZIONY BUS W WOŁOMINIE',
 x:'W lutym dowiadujesz się, że Twój klubowy bus z częściami odnalazł się na dziupli w Wołominie.',
 o:[
  {l:'Płacę złodziejom okup pod stołem.', f:()=>{return [{t:'-40 000 zł, ale sprzęt wraca', f:(p)=>p.budget-=40000}, fxE(15)];}},
  {l:'Liczę na sprawność polskiej policji.', f:()=>[fxE(-40)+' (Policja zabezpieczyła sprzęt jako dowód do 2030 roku)']}]
 },
{id:'reklama_lokalna', t:'LOKALNA REKLAMA W TV',
 x:'Znajomy prosi o nagranie (w kevlarze!) taniej reklamy lokalnego salonu glazury i terakoty.',
 o:[
  {l:'Nagrywam z uśmiechem, kasa to kasa.', f:()=>{return [fxM(-10), {t:'+8 000 zł wpadło', f:(p)=>p.budget+=8000}];}},
  {l:'Odmawiam wstydu.', f:()=>[fxP(10)]}
 ]},
{id:'cross_zima', t:'TRENING NA ZAMARZNIĘTYM CROSSIE',
 x:'Koledzy wyciągają Cię na zamarznięty tor motocrossowy. Opony ślizgają się jak na szkle.',
 o:[
  {l:'Idę pełnym gazem, muszę czuć prędkość!', f:()=>{
     if(chance(35)) return [fxLongInj('Koszmarny upadek na zlodowaciałej ziemi. Złamana miednica.')]; 
     return [fxO(8)+' (Niesamowite czucie motocykla)'];
  }},
  {l:'Odpuszczam, to igranie ze śmiercią.', f:()=>[fxP(15)]}
 ]},
{id:'dieta_weganska', t:'ZIMOWA ZMIANA DIETY',
 x:'Po obejrzeniu dokumentu na Netflixie zimą przechodzisz na restrykcyjny weganizm.',
 o:[
  {l:'Zostaję przy jedzeniu trawy.', f:()=>[fxO(-8)+' (Brak siły do utrzymania motocykla)', fxM(20)]},
  {l:'Łamię się i wcinam schabowego.', f:()=>[fxO(4), fxP(-5)]}
 ]},
{id:'spor_kibice_zima', t:'SPOTKANIE Z KIBOLAMI',
 x:'Na przedsezonowej prezentacji gniazdowy wytyka Ci słabą formę z zeszłego roku i każe oddać kevlar.',
 o:[
  {l:'Pyskujesz z mikrofonem w ręku.', f:()=>[fxM(35), fxP(-20), fxH(-25)]},
  {l:'Bierzesz na klatę i obiecujesz poprawę.', f:()=>[fxP(15), fxH(15)]}
 ]},
{id:'praca_budowa', t:'DORABIANIE NA BUDOWIE',
 x:'Budżet na zimę się nie spina. Idziesz robić na budowie u wujka, żeby opłacić mechaników.',
 o:[
  {l:'Zasuwam z workami cementu.', f:()=>{return [fxO(5)+' (Fizol, kondycja rośnie)', {t:'+12 000 zł zarobku', f:(p)=>p.budget+=12000}, fxM(-15)];}},
  {l:'Wstydzę się, wolę wziąć chwilówkę.', f:()=>{return [{t:'Pętla długów: -25 000 zł na start sezonu', f:(p)=>p.budget-=25000}, fxP(-15)];}}
 ]},
{id:'zmiana_numeru', t:'KŁÓTNIA O NUMER STARTOWY',
 x:'Nowy zimowy hit transferowy Twojego klubu dzwoni i żąda oddania Twojego szczęśliwego numeru startowego.',
 o:[
  {l:'Oddajesz bez walki, dla dobra atmosfery.', f:()=>[fxP(10), fxH(-10), fxO(-2)]},
  {l:'Stawiasz się i robisz kwas w mediach.', f:()=>[fxP(-15), fxH(20), fxM(25)]}
 ]},
{id:'narty_z_woda', t:'KULIG ZA BUSEM',
 x:'Grudzień, spadło dużo śniegu. Mechanicy przywiązali starą maskę od Żuka do haka w klubowym busie i robią kulig po polnej drodze.',
 o:[
  {l:'Wsiadam na maskę, gazu!', f:()=>{
     if(chance(25)) return [fxLongInj('Bus szarpnął, wyleciałeś w drzewo. Złamany kręgosłup, cały sezon z głowy.')]; 
     return [fxH(30), fxO(3)];
  }},
  {l:'Nagrywam ich tylko na telefon.', f:()=>[fxM(10), fxP(10)]}
 ]},
{id:'sponsor_wigilia', t:'WIGILIA ZE SPONSOREM',
 x:'Firmowa wigilia u potężnego sponsora klubu. Po kilku głębszych prezes firmy każe Ci śpiewać kolędy na karaoke.',
 o:[
  {l:'Śpiewam fałszując, ale z sercem.', f:()=>{return [fxP(-10), {t:'Prezes dorzuca +20 000 zł do budżetu', f:(p)=>p.budget+=20000}];}},
  {l:'Odmawiam stanowczo.', f:()=>[fxP(15), fxM(-10)]}
 ]},
{id:'testy_na_lodzie', t:'TESTY NA ZAMARZNIĘTYM JEZIORZE',
 x:'Tuner dzwoni, że wymyślił nową krzywkę rozrządu i musisz ją przetestować w lutym na zamarzniętym jeziorze.',
 o:[
  {l:'Ryzykuję utonięcie i jadę testować.', f:()=>{
     if(chance(20)) return [fxEnd('Lód zarwał się pod motocyklem. Utonąłeś.')]; 
     return [fxE(25)+' (Niesamowita przewaga sprzętowa)'];
  }},
  {l:'Czekam na roztopienie śniegu.', f:()=>[fxP(10), fxE(-10)]}
 ]},
{id:'zablokowany_paszport', t:'ZAGUBIONY PASZPORT',
 x:'Przed wylotem na zgrupowanie do Hiszpanii orientujesz się, że pies pogryzł Twój dowód i paszport.',
 o:[
  {l:'Próbuję przekupić straż graniczną.', f:()=>[fxEnd('Aresztowanie za próbę korupcji. Koniec kariery w hańbie.')]},
  {l:'Zostaję w Polsce i biegam po lesie.', f:()=>[fxP(15), fxO(-4)]}
 ]},
{id:'trening_z_psem', t:'TRENING Z PITBULLEM',
 x:'Dla poprawy refleksu zimą postanawiasz biegać po lesie, uciekając przed agresywnym psem kolegi.',
 o:[
  {l:'Biegnij Forrest, biegnij!', f:()=>{
     if(chance(40)) return [fxI(50)+' (Pies Cię dopadł i pogryzł łydkę)']; 
     return [fxO(8)+' (Kondycja jak u maratończyka)'];
  }},
  {l:'Zapisuję się normalnie na siłownię.', f:()=>[fxP(10), fxO(2)]}
 ]}
];
 
/* --- PROGI UPADŁOŚCI (jedno miejsce do kręcenia gałką) ---
   Uwaga na skalę: ARESZTOWANIE PREZESA losuje się teraz z szansą ok. 1,5% na klub
   na sezon (patrz clubEconomy() w engine.js), a klubów jest 24. Przy onArrest:40
   wychodzi z tego średnio jedna upadłość na kilka sezonów — stare szyldy żyją dłużej,
   a zniknięcie klubu z mapy znowu jest wydarzeniem, a nie coroczną rutyną. */
const BANKRUPTCY={
 onArrest  : 40,         // % szans na upadłość po ARESZTOWANIU PREZESA
 onSpoloss : 100,        // % szans po UTRACIE SPÓŁKI SKARBU PAŃSTWA z dziurą w kasie
 deepMinus : 0.25,       // "potężny minus" = budżet poniżej -25% kosztów sezonu
 debtLimit : 3000000,    // powyżej tego długu (3 mln zł) wchodzi syndyk...
 onDebt    : 50,         // ...z taką szansą (przy ujemnym budżecie)
 onSponsorRun : 75       // % szans na syndyka, gdy sponsor z Grupy B uciekł i została dziura
};

/* ============================================================
   SPONSORZY TYTULARNI — DWIE LIGI, DWA ŚWIATY
   ------------------------------------------------------------
   Klub może mieć w nazwie od 1 do 3 sponsorów tytularnych. Nazwa składa się
   z ich nazw doklejonych PRZED nazwą bazową klubu, np.:
       "Złomrex MojeKajmany META Gniezno"
   Obsługa siedzi w clubEconomy() (silnik) i applyPendingSponsors() (nowy rok).

   GRUPA A — bieda, ale stabilnie. Mały zastrzyk gotówki co sezon, zero ryzyka.
   GRUPA B — oszuści. Ogromny hajs przy wejściu, po 1-2 sezonach ucieczka,
             potężna dziura w kasie i syndyk. Uciekinier ląduje w
             G.bannedSponsors i NIGDY nie wraca do gry.
   ============================================================ */
const SPONSORS_A=[
 'Marne Polskie Kondomy','Miliard TEAM','Wenus RTV AGD','Punkt G','Judyta','Bractwo','Złomrex',
 'Dundersztyc','Murzynianka','ZGP Komputery','MojeKajmany','Retard','Polska Grupa Biedy',
 'Grupa Kłopoty','H. Nielot Usługi Pogrzebowe','Eko-Dno','Salami Kabanos','Drewnospan','Cell-slow',
 'Farma Polskie Folie','Dusz-pel','Półbax','Zdu-pol','Aluminium','Tor-Złom','Pogo','Mróz-Pol',
 'Kantor w Budzie','Amator','Błotos','Siko','Kałum','Wena','Najs','Globus'
];
const SPONSORS_B=[
 'Piusa X','Polnord','AmberGold','Browary Starego','Morawiecki','Jeanette','Trabant','Video-Brud',
 'Twoje Guantanamo','składypapy.pl','Guns&Roses Recycling','KJG Company','Auto Nie-Gwarant',
 'Aferti Financial','Diamentowe Czeki Nawrota','Get Lost','eFrajer','Wał-ron','Kredyty Pętla',
 'Kapi-Wał','Fin-Zawał','Tax-Off','Cipciarz.com','ZOOleszczyk','Bory-Szef','Węglo-Brak','H-Zero',
 '7Z','Opatrzność Finanse','Ślepy Traf Bookmacher','Fundusz Bezprawia'
];
const SPON={
 max        : 3,          // maksymalnie tyle sponsorów tytularnych w nazwie
 addBase    : 30,         // % szans na dopięcie KOLEJNEGO sponsora w danym sezonie
 addPerHave : 11,         // ...minus tyle p.p. za każdego, którego klub już ma
 addPoor    : 12,         // +tyle p.p., gdy klub jest pod kreską (desperacja zarządu)
 bChance    : 5,          // % — jeżeli już dopina sponsora, to z takim prawdopodobieństwem z GRUPY B
                          //     (celowo bardzo mało: jedna afera na kilka sezonów w całej lidze,
                          //      inaczej syndyk chodziłby po klubach co roku)
 /* GRUPA A: mały, przewidywalny zastrzyk co sezon (skalowany poziomem ligi) */
 aCash      : [0.010, 0.045],
 /* GRUPA B: wielkie wejście, a potem dziura */
 bCash      : [0.55, 1.35],   // × roczne wpływy przeciętnego klubu ligi
 bLife      : [1, 2],         // po tylu sezonach uciekają
 bHole      : [1.15, 2.30],   // dziura zostawiona w kasie = tyle × kwota wejścia
 bArrShare  : 0.35,           // ...z czego tyle ląduje jako zaległości wobec kadry
 /* KARA ZA BYCIE SŁUPEM OGŁOSZENIOWYM (kumulatywnie, wg liczby sponsorów) */
 ovrPen     : [0, 0, -2, -5],
 /* Zawodnik z profesjonalizmem powyżej tej wartości nie podpisze z klubem,
    który ma 2-3 sponsorów tytularnych w nazwie (patrz makeOffers). */
 profBlock  : 50,
 profBlockFrom : 2
};
 
const IMIE=['Bartosz','Maciej','Patryk','Dawid','Kacper','Szymon','Mateusz','Jakub','Wiktor','Damian',
 'Krzysztof','Grzegorz','Adrian','Norbert','Sebastian','Paweł','Tobiasz','Oskar','Hubert','Kamil',
 'Rafał','Mariusz','Przemysław','Janusz','Zbigniew','Marcin','Łukasz','Piotr','Tomasz','Wojciech'];
const NAZW=['Nowak','Wiśniewski','Wójcik','Kamiński','Zieliński','Szymański','Woźniak','Dąbrowski','Kozłowski',
 'Jankowski','Mazur','Kwiatkowski','Krawczyk','Piotrowski','Grabowski','Nowakowski','Pawłowski','Michalski',
 'Adamczyk','Dudek','Zając','Wieczorek','Jabłoński','Król','Majewski','Olszewski','Jaworski','Wróbel',
 'Pawlak','Witkowski','Walczak','Stępień','Górski','Rutkowski','Michalak','Sikora','Ostrowski','Baran',
 'Duda','Szewczyk','Tomaszewski','Pietrzak','Marciniak','Wróblewski','Zalewski','Jakubowski','Jasiński',
 'Zawadzki','Sadowski','Chmielewski','Włodarczyk','Borkowski','Czarnecki','Sawicki','Sokołowski','Urbański',
 'Kubiak','Maciejewski','Szczepański','Kucharski','Wilk','Kalinowski','Mazurek','Wysocki','Adamski',
 'Kaźmierczak','Sobczak','Czerwiński','Konieczny','Kaczmarek','Głowacki','Bednarek','Ziółkowski'];

/* ============================================================
   PULA IMION I NAZWISK DLA PROPOZYCJI NA EKRANIE TWORZENIA POSTACI
   ------------------------------------------------------------
   Wcześniej pole „IMIĘ I NAZWISKO" miało na sztywno wpisane jedno nazwisko,
   więc każda kariera zaczynała się od tej samej osoby. Teraz przy każdym
   wejściu na ekran (i po kliknięciu „LOSUJ") pole dostaje losowe zestawienie
   z poniższych pul. Podobieństwo do jakichkolwiek osób jest przypadkowe.
   ============================================================ */
const SUG_IMIE=['Łukasz','Dawid','Arkadiusz','Tomasz','Patryk','Mateusz','Mateusz','Bartosz','Patryk',
 'Maksymilian','Remigiusz','Oskar','Paweł','Karol','Bartosz','Marco','Kamil','Rafał','Łukasz','Mike',
 'Dawid','Maciej','Łukasz','Patryk','Kamil','Krzysztof','Denis','Karol','Mateusz','Iwan','Marcin','Rafał',
 'Marcin','Kamil','Damian','Łukasz','Damian','Marcin','Radosław','Sajmon','Piotr','Bartosz','Łukasz',
 'Rafał','Łukasz','Mikołaj','Paweł','Piotr','Damian','Adrian','Kamil','Grzegorz','Mateusz','Szymon',
 'Dawid','Konrad','Artur','Paweł','Patryk','Michał','Arkadiusz','Artur','Mikołaj','Marcin','Bartosz',
 'Kamil','Arkadiusz','Tomasz','Wojciech','Mateusz','Dawid','Tomasz','Patryk','Adrian','Paweł','Damian',
 'Bartosz','Jakub','Kamil','Michał','Marek','Adrian','Marcin','Marcin','Jarosław','Przemysław','Mateusz',
 'Tomasz','Patryk','Damian','Patryk','Eryk','Michał','Kacper','Jarosław','Mateusz','Przemysław','Paweł','Oskar'];
const SUG_NAZW=['Lesiak','Matura','Madej','Walasek','Karczmarz','Kwiatkowski','Piernikowski','Pietrykowski',
 'Rumiński','Ristok','Perzyński','Lis','Urbański','Jóźwik','Bietracki','Gaschka','Prokop','Malczewski',
 'Bojarski','Trzensiok','Dąbek','Kubasik','Michałek','Beśko','Matyjas','Wittstock','Niedzielski','Szychowski',
 'Łukaszewski','Pleszakow','Bubel','Konopka','Wawrzyniak','Matuszak','Michalski','Wieliński','Albrecht',
 'Riedel','Małuch','Paczewski','Rybak','Łapacz','Witoszek','Fleger','Piecha','Drożdżowski','Busz','Czerwiński',
 'Synowiec','Wojewoda','Fleger','Bassara','Wieczorek','Błocian','Domagała','Matuszewski','Winiarski','Parys',
 'Wolniewiński','Kordas','Pawlak','Cyło','Trępała','Kraft','Kibała','Merena','Potoniec','Szmaj','Beyger',
 'Gołost','Krywald','Mroczkowski','Przywieczerski','Sikora','Śliwiński','Wolender','Dąbrowski','Hassa',
 'Łukaszewski','Nowacki','Piosicki','Lutowicz','Bułanowski','Kościelski','Turowski','Krzywosz','Liszka',
 'Rząsa','Orwat','Rydlewski','Stalkowski','Sitarek','Budzyń','Nowiński','Grzegorczyk','Paliwoda','Burzyński',
 'Portas','Staniszewski','Nocuń'];
/* Wołane z UI (ekran tworzenia postaci). `pick` mieszka w engine.js, który
   ładuje się po data.js — dlatego to funkcja, a nie wyliczona stała. */
function suggestName(){ return pick(SUG_IMIE)+' '+pick(SUG_NAZW); }
/* ============================================================
   CO MÓWIĄ PO SEZONIE — PULE TEKSTÓW
   ------------------------------------------------------------
   Wcześniej każdy warunek miał DOKŁADNIE JEDNĄ linijkę wpisaną na sztywno
   w seasonTalk() (engine.js). Efekt: gracz, który przez pięć sezonów siedział
   pod kreską, pięć razy z rzędu czytał to samo zdanie komornika o busie.
   Teraz każdy warunek ma własną pulę (min. 30 tekstów), a silnik losuje
   z pamięcią — patrz talkPick() — więc te same zdania nie wracają w kółko.

   PODSTAWIENIA (opcjonalne, zależnie od warunku):
     {n}    — liczba (defekty, wykluczenia)
     {rok}  — rok sezonu
     {kasa} — kwota już sformatowana przez zl()
     {avg}  — średnia biegopunktowa
     {klub} — nazwa klubu
   ============================================================ */
const TALK = {

/* ---------- SEZON W OGÓLE NIEROZEGRANY (0 meczów) ---------- */
none: { who:'SZATNIA', lines:[
 '„A on to w ogóle jeszcze jeździ? Myślałem, że skończył."',
 '„Jego kevlar wisi w szatni od marca. Nikt go nie ruszał, bo nikt nie wiedział, czy to eksponat."',
 '„Pytali o niego w PZM. Odpisaliśmy, że sprawdzimy i się odezwiemy. Nie odezwaliśmy się."',
 '„Cały sezon i ani jednego startu. To już nawet nie jest kariera, to abonament."',
 '„Widziałem go raz, w bufecie. Kupił parówkę i poszedł. To był jego najlepszy występ w tym roku."',
 '„Mamy w składzie takiego jednego, co nie jeździ. Prezes mówi, że to strategia."',
 '„Zapytałem trenera, czemu go nie stawia. Powiedział: «a jest?»."',
 '„W programie meczowym drukowali go z rozpędu. Do sierpnia. Potem drukarnia sama zrezygnowała."',
 '„Zero startów. Zero. Nawet kontuzjowani mają lepsze statystyki, bo przynajmniej mają diagnozę."',
 '„Trener mówi, że go szanuje. Za co konkretnie, nie doprecyzował."',
 '„Chłopaki zrobili zakłady, w której kolejce wyjedzie. Wszyscy przegrali."',
 '„Jego szafka to jedyne miejsce w tym klubie, gdzie panuje spokój."',
 '„Kibice zrobili transparent «GDZIE ON JEST». Powiesili go i po miesiącu zdjęli, bo nikt nie odpowiedział."',
 '„Na zdjęciu drużynowym stoi w drugim rzędzie. To jego jedyny udokumentowany udział w tym sezonie."',
 '„Sezon przesiedział na krzesełku przy bandzie. Zna teraz każdego kibica z pierwszego rzędu po imieniu."',
 '„Mówią, że trenuje. Nikt nie mówi gdzie."',
 '„Regulaminowo jest zawodnikiem. Praktycznie jest gościem z przepustką."',
 '„Miał wyjechać w barażach. Baraże się odbyły. On nie."',
 '„Zapłacili mu za sezon, w którym nie zdobył ani jednego punktu. To jest najbardziej udana negocjacja w historii tego klubu."',
 '„W parku maszyn stał jego motocykl. Cały sezon. Z założoną plandeką."',
 '„Ktoś zapytał, czy on jeszcze ma licencję. Zapadła cisza."',
 '„To był rok bez jednego wyjazdu na tor. Za to bez jednego defektu — bilans dodatni."',
 '„Miałem go w typerze. Straciłem dużo pieniędzy i trochę wiary w ludzi."',
 '„Trener tłumaczył, że buduje go pod przyszły sezon. Buduje. Od trzech miesięcy. Bez narzędzi."',
 '„Zawodnik-widmo. Jest w składzie na papierze i tylko tam."',
 '„Nawet Ostafiński go nie wyśmiał. Trzeba by najpierw zauważyć."',
 '„Na koniec sezonu dostał dyplom za zaangażowanie. Chłopaki się śmiali do Wigilii."',
 '„Ma najczystszy kevlar w lidze. Bo czysty."',
 '„Podobno przyjeżdżał na każdy mecz. Podobno."',
 '„Jak się nie jeździ, to się nie przegrywa. Tak sobie chyba to poukładał."',
 '„Cały rok w rezerwie. Nawet nie taktycznej. Po prostu w rezerwie."',
 '„Jeden z chłopaków zapytał, jak ma na nazwisko. To był jego kolega z pary sprzed dwóch lat."'
]},

/* ---------- ŚREDNIA PONIŻEJ 0,50 ---------- */
awful: { who:'KIBIC Z SEKTORA B', lines:[
 '„Pojechałeś jak pizda. Mój wujek na kosiarce robi lepsze czasy."',
 '„Za te pieniądze to ja bym chociaż udawał, że się staram."',
 '„Widziałem szybsze rzeczy na parkingu przed stadionem. Były zaparkowane."',
 '„Człowieku, ty tam wjeżdżasz czy zwiedzasz?"',
 '„Pierwszy łuk, drugi łuk, i już cię nie ma. Za każdym razem. To już nie pech, to metoda."',
 '„Kupiłem karnet. Chcę zwrot. Nie za mecz — za rok."',
 '„Moja babcia szybciej wnosi węgiel na drugie piętro."',
 '„Jak on wyjeżdża, to nawet spiker traci entuzjazm w połowie zdania."',
 '„Płacę za żużel, a oglądam rekonstrukcję historyczną."',
 '„Zawodnik, przy którym taśma startowa czuje się niedoceniona."',
 '„Widziałem, jak go wyprzedził chłopak, który miał defekt dwa biegi wcześniej. Na tym samym silniku."',
 '„Ta średnia to nie średnia. To pomyłka pisarska, która trwa cały sezon."',
 '„Panie, pan tam jedzie na czterech kołach czy pan pcha?"',
 '„Powiem tak: on się nie ściga. On uczestniczy."',
 '„Mam do niego szacunek. Trzeba mieć charakter, żeby wyjechać po raz piąty i znowu być ostatnim."',
 '„Ostatni w biegu to jeszcze nie wstyd. Ostatni w każdym biegu — to już profil zawodowy."',
 '„Jak on hamuje przed łukiem, to ja hamuję przed zakupem następnego biletu."',
 '„Byłem na wszystkich meczach. Nie wiem po co, ale byłem."',
 '„W tym sezonie zdobywał punkty rzadziej niż ja podwyżkę."',
 '„Kolego, ta maszyna ma 80 koni. Nie wiem, gdzie ty je trzymasz."',
 '„Startuje z taśmy jak z sofy."',
 '„Zrobiłem sobie z jego przejazdów wygaszacz ekranu. Uspokaja."',
 '„Nawet jego mechanik przestał podnosić głowę, jak on jedzie."',
 '„Widzowie z sektora B mają dla niego oklaski. Ironiczne, ale zawsze."',
 '„W tym roku zdobył mniej punktów, niż ja mam lat. A mam czterdzieści dwa."',
 '„Jeździ tak, jakby ktoś mu obiecał premię za nieuszkodzenie motocykla."',
 '„Jest bezpieczny na torze. Bezpieczny dla wszystkich innych."',
 '„Nazywają go «drugi łuk», bo tam się kończy."',
 '„Statystycznie rzecz biorąc, nie zaszkodził nikomu. Ani rywalom, ani drużynie, ani sobie."',
 '„Gdyby żużel był o dojechaniu do mety, byłby średniakiem. Ale nie jest."',
 '„Widziałem lepsze przejazdy na treningu żaków."',
 '„Panie, pan się nie martw. Zawsze może być gorzej. Chociaż nie wiem jak."'
]},

/* ---------- ŚREDNIA 0,50 - 0,89 ---------- */
bad: { who:'KIBIC Z SEKTORA B', lines:[
 '„Kolego, ja płacę za bilet, a nie za oglądanie, jak wywozisz się na własnym cieniu."',
 '„Jeden punkcik, dwa punkciki. Zbierasz to jak butelki."',
 '„Nie jest tragicznie. Jest po prostu bez sensu."',
 '„Ty masz ten motocykl na abonament czy na własność? Bo jedziesz jak wypożyczonym."',
 '„Trzecie miejsce w biegu to twoje naturalne środowisko."',
 '„Wiesz, co jest najgorsze? Że ty naprawdę próbujesz."',
 '„Mam wrażenie, że jak wyjeżdżasz, to rywale zwalniają z uprzejmości."',
 '„Punkt tu, punkt tam. Statystyka mówi, że byłeś. Nic więcej nie mówi."',
 '„Sezon jak zupa z proszku: technicznie to jedzenie."',
 '„Nie wygwiżdżę cię, bo szkoda mi płuc."',
 '„Ty to masz taki talent, że go trzeba szukać z latarką."',
 '„Nadrabiasz sercem. Serce to jednak nie jest część silnika."',
 '„Na starcie wyglądasz groźnie. Potem następuje pierwszy łuk."',
 '„Jak dojeżdżasz trzeci, to cały stadion mówi «no i dobrze». To nie jest komplement."',
 '„Za każdym razem myślę, że teraz to już pojedzie. Za każdym razem się mylę."',
 '„Kupiłem szalik z twoim nazwiskiem. Noszę go pod kurtką."',
 '„Ty nie jesteś słaby. Ty jesteś dokładnie tak dobry, żeby nikt cię nie zwolnił."',
 '„W tym sezonie byłeś jak przystanek autobusowy: potrzebny, ale nikt się nie cieszy."',
 '„Twoja średnia wygląda jak temperatura w listopadzie."',
 '„Chłopie, jedziesz ostrożnie jak z jajkami w plecaku."',
 '„Bywało lepiej. Bywało też gorzej. Głównie jednak bywało tak samo."',
 '„Doceniam, że dojeżdżasz do mety. Serio, ktoś to musi robić."',
 '„Twoje przejazdy mają w sobie taki spokój, że mnie usypiają."',
 '„Sąsiad pyta, czy warto przyjść. Mówię mu, że pogoda ma być ładna."',
 '„Jesteś zawodnikiem, którego nazwisko się zna, ale nie pamięta się skąd."',
 '„Zapytali mnie w pracy, jak wypadłeś. Powiedziałem «no jeździł». Zamknęli temat."',
 '„Jeszcze rok takich występów i będziesz miał w klubie status mebla."',
 '„Nie chodzi o to, że jesteś wolny. Chodzi o to, że oni są szybsi."',
 '„Punkty zdobywasz jak ludzie chodzą do dentysty: rzadko i z bólem."',
 '„Widać było poprawę. W drugiej połowie sezonu przegrywałeś mniejszą różnicą."',
 '„Jesteś jak deszcz na majówce: przewidywalny i lekko rozczarowujący."',
 '„Chłopaki z sektora nazwali cię «Punkcik». Nie obrażaj się, mogło być gorzej."'
]},

/* ---------- ŚREDNIA 0,90 - 1,39 ---------- */
meh: { who:'TRENER', lines:[
 '„Jest średnio. Ani nie boli, ani nie cieszy. Jak zupa w barze mlecznym."',
 '„Robi swoje. Tyle że «swoje» to niewiele."',
 '„Nie mam mu nic do zarzucenia i nie mam go za co pochwalić. Dziwna sytuacja."',
 '„Wpisuję go do składu, bo ktoś musi tam pojechać."',
 '„To zawodnik, który nigdy nie przegra ci meczu. Wygrać też nie."',
 '„Pytają mnie, czy jestem zadowolony. Jestem obojętny. To gorzej."',
 '„Dostajesz od niego dokładnie tyle, ile płacisz. Ani grosza więcej."',
 '„Solidny wypełniacz składu. Brzmi źle, a to komplement."',
 '„Jak patrzę na jego kartę, to widzę same dwójki i jedynki. Jakby ktoś rysował płot."',
 '„W poniedziałek analiza, we wtorek trening, w piątek to samo co zawsze."',
 '„Zawodnik bez wad. Bez zalet też, ale to już drugorzędne."',
 '„Nie muszę na niego krzyczeć. Nie mam też po co go chwalić."',
 '„W tej lidze to jest poziom «da się z tym żyć»."',
 '„Ustawiam go na czwórce i wiem, co dostanę. To ma swoją wartość."',
 '„Nie jest problemem. Nie jest też rozwiązaniem."',
 '„Rozmawiałem z nim o formie. Powiedział, że czuje, że idzie w dobrym kierunku. Idzie. Powoli."',
 '„Średnia jak średnia. Gorzej, że stoi w miejscu od trzech lat."',
 '„Chciałbym powiedzieć, że drzemie w nim potencjał. Drzemie. Głęboko."',
 '„Punkty zdobywa jak człowiek, który zna trasę do sklepu i nie planuje jej zmieniać."',
 '„Jak mam wybrać między nim a juniorem, to zaczynam się poważnie zastanawiać. To źle."',
 '„Nie chodzi o brak talentu. Chodzi o brak wściekłości."',
 '„Zawsze dojedzie. Zawsze trzeci. To jest jakaś forma niezawodności."',
 '„Rok bez wpadki i bez fajerwerku. Księgowa zadowolona, kibice mniej."',
 '„Przeciętność w sporcie to nie grzech. To po prostu sufit."',
 '„Jedzie poprawnie. «Poprawnie» to słowo, którego trener używa, kiedy nie chce skłamać."',
 '„Nie wyrzucę go ze składu, ale też nie będę o niego walczył w okienku."',
 '„Ma równą formę. Równo płaską."',
 '„Trzy punkty w meczu, cztery w następnym. Jak rachunek za prąd."',
 '„Zawodnik do zadań średnich. Wykonuje je średnio."',
 '„Nie zrobił nic złego. Powtarzam to sobie za każdym razem, jak patrzę na tabelę."',
 '„Jest jak zapasowe koło: dobrze, że jest, szkoda że trzeba go używać."',
 '„Zapytałem, czy chce więcej. Powiedział, że chce. Nadal czekam."'
]},

/* ---------- ŚREDNIA 1,40 - 1,79 ---------- */
solid: { who:'TRENER', lines:[
 '„Solidnie. Bez fajerwerków, ale w tabelce się zgadza."',
 '„Na takim zawodniku buduje się drużynę. Nie kończy, ale buduje."',
 '„Wiem, co dostanę, i to jest w tej lidze warte fortunę."',
 '„Nie muszę go pilnować. Zrobił swoje i pojechał do domu."',
 '„To już nie jest wypełniacz. To zawodnik."',
 '„W trudnym wyjeździe wyciągnął nam punkty, o które nikt nie prosił."',
 '„Ma dobrą głowę na starcie. Tego się nie nauczy."',
 '„Jak potrzebuję pewnych dwóch punktów, wiem, do kogo iść."',
 '„Nie zachwyca. Ale nie zawodzi, a to rzadsze."',
 '„Zrobił porządny rok. Bez awantur, bez wymówek, bez telefonów o trzeciej w nocy."',
 '„Jest w tym miejscu kariery, w którym mógłby zacząć wygrywać biegi. Niech spróbuje."',
 '„Trzymam go w pierwszej piątce i śpię spokojnie."',
 '„Zaczyna czytać tor. To widać, i to jest ważniejsze niż średnia."',
 '„Sezon dojrzały. Bez błysku, ale dojrzały."',
 '„Rywale zaczęli go pilnować na starcie. To jest awans."',
 '„Kiedyś tracił punkty na głupotach. W tym roku prawie nie."',
 '„Może wygrać z każdym i przegrać z każdym, ale częściej wygrywa."',
 '„Chciałbym mieć w składzie trzech takich. Mam jednego i to i tak dobrze."',
 '„Nie jest gwiazdą i nie udaje, że jest. Cenię to bardziej, niż powinienem."',
 '„W kluczowych meczach nie schował się. To dużo mówi."',
 '„Jego forma nie skacze. Trener kocha coś takiego bardziej niż talent."',
 '„Poprawił start. Reszta przyszła sama."',
 '„Zaczął jeździć jak zawodnik, który wie, po co przyjechał."',
 '„Kibice go nie noszą na rękach, ale w szatni ma szacunek. Wolę tę kolejność."',
 '„Zrobił dokładnie to, co obiecywał w lipcu. To się nie zdarza."',
 '„W tej klasie rozgrywkowej to jest solidny średniak z górnej półki. Bez ironii."',
 '„Nie musiałem go w tym roku ani razu zdjąć w rezerwie taktycznej. Ani razu."',
 '„Jedzie mądrze. Nie zawsze szybko, ale zawsze mądrze."',
 '„Jak coś się sypało, to nie po jego stronie."',
 '„Prezes pytał, kogo zatrzymać. Wskazałem jego, zanim skończył pytanie."',
 '„Dorósł do pierwszej piątki i zaczyna to rozumieć."',
 '„Sezon, po którym nie mam żadnej rozmowy dyscyplinującej w kalendarzu. Doceniam."'
]},

/* ---------- ŚREDNIA 1,80 - 2,19 ---------- */
good: { who:'TRENER', lines:[
 '„No i o to chodziło. Wreszcie ktoś jedzie do tego pierwszego łuku, a nie obok."',
 '„Wygrywa biegi, których nie miał prawa wygrać. Lubię takie problemy."',
 '„Rywale przestali go traktować jak przystawkę."',
 '„Zaczął zabierać punkty liderom. To zmienia rozmowy w gabinecie prezesa."',
 '„Jak on wyjeżdża, to ja przestaję patrzeć w notes i patrzę na tor."',
 '„To jest zawodnik, wokół którego można ułożyć skład."',
 '„Ma teraz coś, czego nie miał: pewność, że mu się należy."',
 '„Trzy razy w tym sezonie wyciągnął nas z dołka. Trzy razy."',
 '„Startuje agresywnie i nie przeprasza. Wreszcie."',
 '„Dzwonią po niego z innych klubów. To najlepsza recenzja, jaką znam."',
 '„W wyjazdowych meczach jest równie dobry jak u siebie. To rzadkość."',
 '„Wygrywa pojedynki, nie tylko biegi. Różnica jest ogromna."',
 '„Zrobił skok, na który czekałem dwa lata."',
 '„Jest w formie, w której powinien myśleć o turniejach indywidualnych. I myśli."',
 '„Nie musiałem go w tym roku niczego uczyć. Sam się dowiedział."',
 '„Jak on jest w składzie, to my mamy plan. Jak go nie ma, to mamy problem."',
 '„Zaczął wygrywać starty z pierwszego pola i z czwartego. To już wybór stylu, nie przypadek."',
 '„Nie odpuszcza nawet przy trzecim miejscu. Zbiera punkty jak zawodowiec."',
 '„Kibice wstają, kiedy on wyjeżdża. Sam sprawdziłem, nie zmyślam."',
 '„W tym roku był najlepszym zawodnikiem tej drużyny i nikt nawet nie próbuje dyskutować."',
 '„Jest głodny. To najważniejsze zdanie w tej rozmowie."',
 '„Zaczął dyktować tempo. Kiedyś się dopasowywał."',
 '„Prezes chce mu podnieść stawkę. Powiedziałem, żeby zrobił to szybko."',
 '„Robi rzeczy, o których w lipcu mówiliśmy, że jeszcze nie teraz."',
 '„Ma najlepszy pierwszy łuk w drużynie i drugi najlepszy w lidze."',
 '„Jak potrzebuję trójki, to jej nie proszę. Ja ją zakładam."',
 '„Wyprzedza na zewnątrz. W tej lidze to prawie prowokacja."',
 '„Odkąd zmienił styl jazdy, nikt nie chce z nim jechać w parze przeciwko."',
 '„Ten sezon go ustawił. Reszta zależy już tylko od głowy."',
 '„Nie pamiętam meczu, w którym byłbym z niego niezadowolony."',
 '„W szatni po meczu jest cicho, bo wszyscy patrzą na jego kartę."',
 '„Awansował do kategorii «zawodnik, którego się pilnuje»."'
]},

/* ---------- ŚREDNIA 2,20 I WYŻEJ ---------- */
great: { who:'EKSPERT TV', lines:[
 '„To już nie jest zawodnik ligowy. To jest problem dla reszty stawki."',
 '„Oglądamy kogoś, kto przerósł tę klasę rozgrywkową o dwa poziomy."',
 '„Nie pytam, czy wygra bieg. Pytam, o ile."',
 '„Jego przejazdy powinny być pokazywane w szkółkach jako materiał szkoleniowy."',
 '„W tej lidze on się już tylko rozgrzewa."',
 '„Nie ma tu z kim jeździć i to nie jest jego wina."',
 '„Statystyka mówi jedno, oczy drugie, a obie rzeczy mówią to samo: klasa."',
 '„Jak on wychodzi z taśmy, to reszta jedzie o drugie miejsce."',
 '„Widzieliśmy dziś przejazd, o którym będzie się mówić do końca sezonu. Trzeci taki w tym miesiącu."',
 '„Rywale go nie pilnują. Rywale mu ustępują."',
 '„To jest jazda, za którą kupuje się bilety."',
 '„Nie ma słabych meczów. Ma mecze dobre i bardzo dobre."',
 '„Powiem coś niepopularnego: on w tym klubie marnuje czas."',
 '„W każdym biegu ma jedną decyzję do podjęcia i za każdym razem podejmuje właściwą."',
 '„To już poziom kadry. Bez dyskusji."',
 '„Jego pierwszy łuk to jest osobna dyscyplina sportu."',
 '„Rozmawiałem z rywalami. Mówią jedno: jak on wyjdzie ze startu, to koniec tematu."',
 '„Zdobywa punkty tak spokojnie, że to aż niegrzeczne wobec reszty."',
 '„Nie widziałem, żeby ktoś tak czytał tor od czasów, o których nie wypada mi mówić na antenie."',
 '„Prowadzi bieg, jakby miał plan na trzy okrążenia do przodu."',
 '„Nie jest najszybszy. Jest najmądrzejszy, a to na dłuższą metę groźniejsze."',
 '„Gdyby jeździł w mocniejszej lidze, mówilibyśmy o nim inaczej. Ale tak samo dobrze."',
 '„Jego obecność w składzie warta jest cztery punkty meczowe. Sama obecność."',
 '„To nie jest dobra forma. To jest inny poziom."',
 '„Zawodnik kompletny: start, tor, głowa, sprzęt. Rzadko wszystko naraz."',
 '„Kiedy on przegrywa bieg, redakcja robi z tego newsa."',
 '„Nie ma w tej stawce nikogo, kto mógłby go pilnować przez cały mecz."',
 '„Jedzie tak, że komentowanie robi się nudne. To najwyższa pochwała, jaką znam."',
 '„Ten sezon powinien się skończyć telefonem od selekcjonera. Jak się nie skończy, to źle o nas świadczy."',
 '„Przewaga, którą buduje na starcie, jest niesportowa. W dobrym sensie."',
 '„Widziałem go z bliska w parku maszyn. On się nawet nie spocił."',
 '„Zamykamy transmisję i wszyscy wiemy, kto był najlepszy. Znowu."'
]},

/* ---------- OSTAFIŃSKI: MEDIALNOŚĆ MOCNO W DÓŁ ---------- */
ostaSilent: { who:'OSTAFIŃSKI', lines:[
 '„W tym sezonie nie napisałem o nim ani słowa. Nie było o czym. I to jest najsmutniejsze zdanie w tym tekście."',
 '„Sprawdziłem w archiwum: ostatni raz wymieniłem go w zdaniu podrzędnym. W marcu."',
 '„Zniknął z radaru tak skutecznie, że aż podejrzewam profesjonalizm."',
 '„Dostałem pytanie od czytelnika, co u niego. Nie znałem odpowiedzi. Nie szukałem."',
 '„Jego nazwisko przestało generować kliknięcia. W tym zawodzie to jest wyrok."',
 '„Kiedyś dzwonił do redakcji z pretensjami. Teraz nie dzwoni. Tęsknię, ale nie bardzo."',
 '„W notatniku mam pustą stronę z jego nazwiskiem u góry. Tak zostało."',
 '„Media go nie skreśliły. Media po prostu przestały zauważać. To gorsza forma."',
 '„Napisałem o nim akapit. Redaktor wyciął. Nie protestowałem."',
 '„Cały rok bez jednej wypowiedzi, jednej afery, jednego głupstwa. Podejrzanie dorosłe zachowanie."',
 '„Jest zawodnikiem, o którym pisze się tylko wtedy, gdy trzeba wypełnić tabelkę."',
 '„Zapytałem kolegę z innej gazety, czy ma na niego coś. Zapytał, o kogo chodzi."',
 '„Zaczynam podejrzewać, że on tego chciał. Jeżeli tak, to gratuluję strategii."',
 '„Statystycznie był. Medialnie go nie było."',
 '„Nie ma się o co czepiać, więc nie ma o czym pisać. Taki jest ten zawód."',
 '„Przygotowałem sylwetkę. Leży w szufladzie od maja. Chyba tam zostanie."',
 '„Portale piszą o nim raz w roku, przy okazji okienka transferowego. I to w zbiorczej notce."',
 '„Zawodnik, którego zdjęcie w archiwum jest sprzed czterech lat. Nikt nie robił nowego."',
 '„Nie było skandalu, nie było wywiadu, nie było niczego. Rok pustej rubryki."',
 '„W tym biznesie milczenie też jest oświadczeniem. Jego było bardzo długie."',
 '„Zrobiłem ranking najbardziej niewidocznych zawodników sezonu. Nie chciało mi się go tam wpisywać."',
 '„Jego konto w mediach społecznościowych ma tyle życia, co park maszyn w styczniu."',
 '„Kiedyś był tematem. Teraz jest przypisem."',
 '„Redakcja przestała mnie pytać o niego. To był ostatni etap."',
 '„Nawet hejterzy sobie odpuścili. To najgorszy znak."',
 '„Mam listę zawodników do obdzwonienia po sezonie. Skreśliłem go bez wyrzutów sumienia."',
 '„Rok temu pisałem, że musi coś ze sobą zrobić. Zrobił: zniknął."',
 '„Nie pamiętam brzmienia jego głosu, a przeprowadzałem z nim wywiad."',
 '„Zapytałem w klubie o cytat. Dali mi cytat prezesa."',
 '„Znikanie też jest karierą. Krótszą."',
 '„W podsumowaniu roku wymieniłem czterdzieści nazwisk. Jego nie."',
 '„Napisałbym, że rozczarował, ale rozczarowanie wymaga wcześniejszych oczekiwań."'
]},

/* ---------- OSTAFIŃSKI: MEDIALNOŚĆ MOCNO W GÓRĘ ---------- */
ostaLoud: { who:'OSTAFIŃSKI', lines:[
 '„Rozpisywałem się o nim tak, że redakcja kazała mi zrobić przerwę. Nie zrobiłem."',
 '„W tym sezonie napisałem o nim więcej niż o całej reszcie ligi razem wziętej."',
 '„Każdy jego mecz kończył się u mnie tekstem. Każdy."',
 '„Jest najlepszym, co się przydarzyło mojej rubryce od lat."',
 '„Dostaję maile, żebym przestał o nim pisać. To znaczy, że piszę dobrze."',
 '„Zrobił mi rok. Nie wiem, czy sobie."',
 '„Nazwisko, które podnosi klikalność o połowę. W tej branży to jest waluta."',
 '„Zacząłem sezon obojętny, kończę z folderem zdjęć podpisanym jego nazwiskiem."',
 '„Trzy okładki. Trzy. W lidze, w której okładka to rzadkość jak wypłata na czas."',
 '„Redaktor naczelny zna go z imienia. Nie zna z imienia większości radnych."',
 '„Nie musiałem szukać tematów. Tematy jeździły za mnie."',
 '„Wywiad z nim to pół godziny nagrania i cztery gotowe teksty."',
 '„Zrobiliśmy o nim podcast. Odsłuchy przebiły relację z finału."',
 '„Kiedy on coś powie, to następnego dnia mówi o tym cała liga."',
 '„Napisałem tekst krytyczny. Skomentowało go osiem tysięcy osób. Wszyscy go bronili."',
 '„Jego nazwisko w tytule to jest gwarancja, że tekst przeczytają."',
 '„Byłem na trzech jego meczach z rzędu. Zwrot kosztów podróży opłacił się redakcji."',
 '„W tym sezonie stał się postacią. To coś zupełnie innego niż bycie zawodnikiem."',
 '„Zaczęli go rozpoznawać ludzie, którzy nie oglądają żużla."',
 '„Dwa razy dzwonili do mnie z telewizji śniadaniowej. Pytali o niego."',
 '„Nie wiem, czy jest najlepszy. Wiem, że jest najgłośniejszy, a to inna liga."',
 '„Napisałem o nim tak dużo, że zaczynam brzmieć jak jego rzecznik. Muszę uważać."',
 '„Fani zrobili o nim mem. Mem żyje własnym życiem od czerwca."',
 '„Przestałem tłumaczyć, kim jest. Już nie trzeba."',
 '„Poszedłem do kiosku. Trzy tytuły, trzy jego zdjęcia."',
 '„W tym roku był newsem nawet wtedy, gdy nic nie robił."',
 '„Skończył sezon z rozpoznawalnością, o jakiej marzą ludzie z zupełnie innych dyscyplin."',
 '„Zbudował markę. Teraz musi ją tylko przeżyć."',
 '„Redakcja założyła osobny tag. Osobny tag, na jednego zawodnika."',
 '„Dostał zaproszenie do programu, w którym normalnie siedzą politycy."',
 '„Jego cytaty żyją dłużej niż jego przejazdy. To komplement i ostrzeżenie."',
 '„Sezon medialnie wybitny. Zobaczymy, co z tego zostanie w kwietniu."'
]},

/* ---------- OSTAFIŃSKI: WYSOKA MEDIALNOŚĆ (>70) ---------- */
ostaStar: { who:'OSTAFIŃSKI', lines:[
 '„Znowu on. Czy ktoś w tej lidze robi coś poza nim? Pytam poważnie."',
 '„Otwieram serwis, a tam jego twarz. Zamykam, otwieram inny — to samo."',
 '„Jest wszędzie. Zaczynam podejrzewać, że ma agenta lepszego niż zawodnik."',
 '„Reklamuje bank, chipsy i szpachlę. Żużel przy okazji."',
 '„Nie da się napisać podsumowania kolejki bez wymienienia go dwa razy."',
 '„To już nie jest zawodnik, to jest marka z licencją torową."',
 '„Ludzie znają jego nazwisko, nie znając jego średniej. Tak działa medialność."',
 '„Ma więcej obserwujących niż niejeden klub z Ekstraligi."',
 '„W każdej rozmowie o żużlu pada jego nazwisko w pierwszych trzech minutach."',
 '„Podpisuje kaski, plakaty i rachunki. Głównie plakaty."',
 '„Zrobił sobie z rozpoznawalności drugi etat. I dobrze płatny."',
 '„Nie musi wygrywać, żeby być na czołówce. To jest przywilej i pułapka."',
 '„W parku maszyn są zawodnicy lepsi od niego. Nikt o nich nie pisze."',
 '„Kamera go szuka nawet wtedy, gdy jedzie ktoś inny."',
 '„Jego wizerunek pracuje na niego mocniej niż silnik."',
 '„Sponsorzy stoją w kolejce. To rzadszy widok niż wypłata w terminie."',
 '„Jest twarzą tej ligi, chociaż liga nigdy się na to nie zgodziła."',
 '„Dziennikarze nie muszą go szukać. On już tam jest."',
 '„Ma stały felieton w cudzych felietonach."',
 '„Zapytałem dzieciaków przed stadionem, kogo znają. Padło jedno nazwisko."',
 '„Popularność ma to do siebie, że nie pyta o średnią. On to wykorzystał wzorowo."',
 '„W tej lidze jest gwiazdą. To brzmi ironicznie, ale mówię serio."',
 '„Przy nim inni zawodnicy wyglądają jak personel techniczny."',
 '„Widziałem jego podobiznę na koszulce w mieście, w którym nie ma toru."',
 '„Zrobiono z niego symbol. Symbol czego, nikt nie doprecyzował."',
 '„Jego nazwisko sprzedaje bilety. Reszta drużyny jeździ za darmo."',
 '„Trzy wywiady w tygodniu i ani jeden ciekawy. Ale wszystkie przeczytane."',
 '„Media go stworzyły i media go rozliczą. Na razie jesteśmy w fazie tworzenia."',
 '„Prezes wozi go na spotkania z radnymi. Jako argument."',
 '„W ankiecie na najpopularniejszego żużlowca wygrał, nie startując w niej."',
 '„Jest sławny w sposób, który przestał mieć związek z wynikami."',
 '„Można go nie lubić. Nie da się go pominąć."'
]},

/* ---------- OSTAFIŃSKI: NISKA MEDIALNOŚĆ (<20) ---------- */
ostaNobody: { who:'OSTAFIŃSKI', lines:[
 '„Zapytałem o niego w parku maszyn. Nikt nie skojarzył nazwiska."',
 '„Ma rozpoznawalność opony. Też jest okrągła i też nikt o niej nie mówi."',
 '„Wpisałem jego nazwisko w wyszukiwarkę. Wyszły trzy wyniki i dwa dotyczyły kogoś innego."',
 '„Jest anonimowy w stopniu, który w sporcie zawodowym wymaga wysiłku."',
 '„Kibice przed stadionem nie wiedzieli, że jeździ w tej drużynie. W tej drużynie."',
 '„Nie ma zdjęcia w bazie. Redakcja użyła fotografii tyłem."',
 '„Sponsorzy nie dzwonią. Sponsorzy nie wiedzą."',
 '„Jego konto społecznościowe ma mniej obserwujących niż osiedlowa grupa wymiany rzeczy."',
 '„Zawodnik z gatunku tych, których nazwisko czyta spiker i sam się waha."',
 '„Poprosiłem o komentarz. Spytał, czy to na pewno do niego."',
 '„Nie umie się sprzedać, a w tej lidze to prawie tak ważne jak start."',
 '„Nikt go nie hejtuje. Nikt go nie chwali. Nikogo nie ma."',
 '„Robiłem sondę wśród kibiców. Zero wskazań. Nawet przypadkowych."',
 '„Ma tyle uwagi mediów, co przetarg na koszenie trawy przy torze."',
 '„Klub nie wrzuca jego zdjęć, bo nie generują reakcji. Powiedzieli mi to wprost."',
 '„Jeździ jak zawodowiec, funkcjonuje jak amator. Chodzi o wizerunek, nie o jazdę."',
 '„Zapytałem, czy ma menedżera. Zaśmiał się. To była odpowiedź."',
 '„Można obejrzeć cały mecz i nie zauważyć, że tam był."',
 '„Reklamowałby cokolwiek, gdyby ktokolwiek zaproponował."',
 '„W programie meczowym ma dwa zdania biografii. Jedno jest błędne."',
 '„Nie istnieje w internecie. W dwa tysiące dwudziestych to osiągnięcie."',
 '„Rozmawiałem z jego prezesem. Nie pamiętał, ile ma lat."',
 '„Ma nazwisko, które wypada z głowy w drodze z trybuny na parking."',
 '„Nikt nie zrobił o nim mema. To dziś jedyna miara sławy."',
 '„Zawodnik, którego kevlar sponsoruje wyłącznie klub. Bo nikt inny nie chciał."',
 '„Media go nie krzywdzą. Media go nie zauważają, a to inny rodzaj krzywdy."',
 '„Jego nazwisko pomylono w komunikacie PZM. Nikt nie zgłosił sprostowania."',
 '„Anonimowość ma jeden plus: nikt nie pisze o tobie źle."',
 '„Poprosiłem o wywiad. Zgodził się od razu. Za szybko, żeby to było zdrowe."',
 '„Jest jednym z tych, o których dowiadujesz się dopiero z komunikatu o zakończeniu kariery."',
 '„W tym roku nie pojawił się w żadnym zestawieniu. W żadnym."',
 '„Gdyby jutro przestał jeździć, informacja poszłaby w rubryce «pozostałe»."'
]},

/* ---------- DUŻO DEFEKTÓW ({n}) ---------- */
defMany: { who:'MECHANIK', lines:[
 '„{n} defektów. Ja już nie wiem, czy to silnik, czy klątwa."',
 '„{n} razy stanąłeś na torze. Tyle razy w życiu nie stałem nawet w kolejce."',
 '„Rozebrałem ten silnik {n} razy. Znam go lepiej niż własne mieszkanie."',
 '„Przy {n} defektach to już nie jest awaria. To jest stały element programu."',
 '„{n} defektów w jeden sezon. Zacznij się modlić albo zmień tunera."',
 '„Wożę teraz dwa zapasowe silniki. Przy tobie to nie przezorność, to konieczność."',
 '„{n} razy pchałeś motocykl. Kondycja ci wzrosła, punkty nie."',
 '„Powiem tak: sprzęt cię nie lubi. Odwzajemnia się {n} razy."',
 '„Za te {n} defektów kupiłbym używane auto. Niezłe używane auto."',
 '„Nie wiem, co ty robisz z tym gazem, ale {n} razy to się skończyło ciszą."',
 '„Mam już odruch: jak wyjeżdżasz, to biorę wózek. {n} razy się przydał."',
 '„{n} defektów. Sędzia mnie zna po imieniu, a to nie jest komplement."',
 '„Wymieniłem ci w tym roku wszystko poza numerem startowym. Nadal {n} defektów."',
 '„Ten silnik ma więcej godzin w warsztacie niż na torze. Bilans: {n}."',
 '„Chłopie, {n} razy. Ludzie chodzą do wróżki przy mniejszych problemach."',
 '„Przy {n} defektach zaczynam wierzyć, że ktoś ci sypie cukier do baku."',
 '„Zapisuję każdą awarię w zeszycie. Zeszyt się skończył w sierpniu."',
 '„{n} defektów to nie pech. To diagnoza."',
 '„Kupiłeś sprzęt, czy ktoś ci go oddał w prezencie za karę?"',
 '„Tyle razy stawałeś, że kibice zaczęli klaskać ironicznie. {n} razy."',
 '„Serwis kosztował tyle, co dwa sezony jazdy. Efekt: {n} defektów."',
 '„Mam w busie części na trzy motocykle. Wystarczyło na {n} awarii, czyli prawie."',
 '„{n} defektów. Jeżeli to sprzęt, to zmień. Jeżeli to ty, to porozmawiajmy."',
 '„W tym roku najczęściej powtarzane zdanie w naszym parku maszyn: «znowu?». {n} razy."',
 '„Zaczynam podejrzewać paliwo, tuner podejrzewa mnie, a ty podejrzewasz cały świat."',
 '„Silnik po {n} defektach nadaje się do gabloty. Jako przestroga."',
 '„Nie ma takiej ilości oleju, która by to naprawiła. {n} razy sprawdzone."',
 '„Ustawiam ci sprzęt jak dla mistrza. Kończy się jak dla pechowca. {n} razy."',
 '„{n} razy usłyszałem tę ciszę na prostej. Śni mi się."',
 '„Gdyby za defekty dawali punkty, byłbyś mistrzem Polski. Masz ich {n}."',
 '„Powiedziałem prezesowi, że potrzebujemy nowego silnika. Pokazał mi {n} faktur."',
 '„Po {n} defektach ja już nie naprawiam. Ja odprawiam."'
]},

/* ---------- ZERO DEFEKTÓW W PEŁNYM SEZONIE ---------- */
defZero: { who:'MECHANIK', lines:[
 '„Zero defektów. Zapamiętaj ten sezon, bo drugi taki nie będzie."',
 '„Ani razu nie stanąłeś. Ani razu. Muszę to zapisać, bo mi nie uwierzą."',
 '„Silnik chodził cały rok jak zegarek. Boję się go teraz dotykać."',
 '„Zero awarii. Zaczynam podejrzewać, że ktoś nam podmienił sprzęt na lepszy."',
 '„Przez cały sezon ani jednego telefonu w środku nocy. Odzwyczaiłem się."',
 '„Nie wiem, co robisz inaczej, ale rób tak dalej."',
 '„Sezon bez defektu w tej lidze to jest cud techniczny."',
 '„Wożę zapasowy silnik od marca. Nadal jest zafoliowany."',
 '„Zero. Pierwszy raz w mojej karierze mam taką kolumnę w zeszycie."',
 '„Traktujesz ten sprzęt jak człowiek, który za niego płaci. I to widać."',
 '„W parku maszyn pytali, u kogo się serwisujesz. Powiedziałem, że u siebie w głowie."',
 '„Ani jednego postoju. Kibice nawet nie wiedzą, jak wygląda nasz wózek."',
 '„Cały rok bez awarii. Idź kupić los na loterii, ale dzisiaj."',
 '„Nie forsujesz silnika na rozgrzewce. To dlatego. Powiedz to innym."',
 '„Zero defektów i pełen sezon. Ktoś tu wreszcie słucha mechanika."',
 '„Miałem najspokojniejszy rok od dwudziestu lat. Dziękuję."',
 '„Sprzęt odwdzięczył się za każdą złotówkę, którą w niego włożyłeś."',
 '„Zero. Piękna liczba. Zwłaszcza w tej rubryce."',
 '„Zapytali mnie, czy się nudzę. Odpowiedziałem, że tak. To był komplement."',
 '„Tuner nie widział cię od maja. Pytał, czy jeszcze jeździsz."',
 '„Ani jednej awarii. Statystycznie należą ci się teraz trzy w przyszłym roku."',
 '„To nie przypadek. To przeglądy robione na czas."',
 '„Silnik po tym sezonie jest w lepszym stanie niż mój kręgosłup."',
 '„Nie musiałem w tym roku niczego ratować taśmą klejącą. Historyczny wynik."',
 '„Zero defektów. Powiedziałbym, że masz szczęście, ale znam cię za dobrze."',
 '„Cały sezon i żadnej ciszy na prostej. Uszy odpoczęły."',
 '„Chłopaki z innych klubów pytają o ustawienia. Nic im nie mówię."',
 '„Ten sezon zamknąłem z pełnym kompletem sprawnych silników. To się nie zdarza."',
 '„Nie stanąłeś ani razu, a to znaczy, że nie musiałeś nadrabiać głupotą."',
 '„Zero awarii. Postaw mi kawę, zasłużyłem tak samo jak ty."',
 '„W tym sezonie sprzęt był twoim sojusznikiem, a nie wymówką."',
 '„Bezawaryjny rok. W tej lidze to jest tytuł."'
]},

/* ---------- DUŻO WYKLUCZEŃ ({n}) ---------- */
excMany: { who:'SĘDZIA LIS', lines:[
 '„Znam pana kevlar lepiej niż własne dzieci. {n} razy pan u mnie był."',
 '„{n} wykluczeń. Zaczynam pana rozpoznawać po sposobie, w jaki pan podjeżdża do taśmy."',
 '„Panie kolego, {n} razy w jednym sezonie. Regulamin czytał pan czy przeglądał?"',
 '„Mam w notatniku pana nazwisko {n} razy. To rekord tego sezonu."',
 '„{n} razy czerwona lampa. Za każdym razem to samo zdziwienie na pana twarzy."',
 '„Nie mam do pana nic osobistego. Mam do pana {n} zapisów w protokole."',
 '„Dotyka pan taśmy jak człowiek, który jej nie widzi. {n} razy."',
 '„{n} wykluczeń. Proszę potraktować to jako informację zwrotną."',
 '„Widzimy się częściej niż ja z rodziną. {n} razy w tym sezonie."',
 '„Pan jedzie z taką pewnością siebie, jakby ten pierwszy łuk był pana własnością. {n} razy się okazało, że nie jest."',
 '„{n} razy. Przy takim tempie skończy pan sezon w moim gabinecie."',
 '„Proszę mi wierzyć, ja też wolałbym pana nie wykluczać. Ale pan naprawdę się stara."',
 '„Pana pojedynki są widowiskowe. Regulaminowo są {n} razy nieudane."',
 '„{n} wykluczeń to nie jest walka. To jest bilans."',
 '„Nauczył się pan startować szybciej niż taśma. Gratuluję refleksu, {n} razy."',
 '„Wykluczyłem pana {n} razy i za każdym razem pan pytał «za co». To już rytuał."',
 '„Panie, ja mam swój zeszyt i pan ma w nim własną stronę. {n} wpisów."',
 '„Powtórka wideo nie pomogła. Ani razu. A oglądaliśmy ją {n} razy."',
 '„{n} razy poza sezonem to byłoby dużo. W sezonie to jest niepokojące."',
 '„Rozmawialiśmy o tym w maju. Potem jeszcze {n} minus jeden razy."',
 '„Podnosi pan poprzeczkę. Innym zawodnikom, bo oni muszą się pana wystrzegać. {n} razy."',
 '„Regulamin ma jeden paragraf, który zna pan doskonale. Odczuł go pan {n} razy."',
 '„{n} wykluczeń, a mimo to podaje mi pan rękę po meczu. Doceniam."',
 '„Nie jest pan brutalny. Jest pan po prostu {n} razy nieprecyzyjny."',
 '„Trzy sekundy na starcie i pan potrzebuje z nich jednej dodatkowej. {n} razy."',
 '„Kolega z komisji założył się o pana wykluczenie. Wygrał {n} razy."',
 '„Panie, jak pan wjeżdża w taśmę, to ja już nawet nie sięgam po lornetkę."',
 '„{n} razy. W papierach to wygląda gorzej niż na torze, a na torze też wyglądało źle."',
 '„Ma pan talent do znajdowania się w niewłaściwym miejscu. {n} udokumentowanych przypadków."',
 '„Wykluczenie {n} razy w sezonie oznacza, że problem nie jest po stronie sędziego."',
 '„Panu się śpieszy. Regulaminowi nie. Wynik: {n} do zera dla regulaminu."',
 '„Zbliża się pan do rekordu, którego nikt nie chce mieć. Na razie {n}."'
]},

/* ---------- DUŻO BONUSÓW ---------- */
bonMany: { who:'KOLEGA Z PARY', lines:[
 '„Chłopie, ty tych bonusów masz tyle, że powinieneś mi płacić abonament."',
 '„Jedziesz za mnie tak, że zaczynam się czuć jak pasażer."',
 '„Za każdym razem, jak patrzę w lusterko, ty tam jesteś. To krzepiące i trochę straszne."',
 '„Nasza para działa. Głównie dzięki tobie, ale nie będę tego powtarzał."',
 '„Zablokowałeś mi w tym roku tylu rywali, że powinienem ci postawić obiad."',
 '„Ty nie jedziesz na siebie, ty jedziesz na drużynę. W tej lidze to prawie dziwactwo."',
 '„Nie ma lepszego uczucia niż wiedzieć, że ktoś pilnuje ci pleców. Dziękuję."',
 '„Bonusy to jest jazda dla kolegi. Ty ją opanowałeś do perfekcji."',
 '„Trener nas rozdzielił na jeden mecz. Nigdy więcej tego nie zrobił."',
 '„Wyprowadzasz mnie na prowadzenie i sam zostajesz drugi. Kto tak dzisiaj robi?"',
 '„W szatni mówią, że jesteśmy zgraną parą. Nie mówią, że to głównie twoja robota."',
 '„Zbierasz bonusy jak inni zbierają mandaty."',
 '„Jak jedziemy razem, to rywale wiedzą, że będzie ciasno. To twoja zasługa."',
 '„Postawiłeś na drużynę zamiast na własną kartę. Ludzie tego nie doceniają. Ja doceniam."',
 '„Kiedyś oddam ci te punkty. Nie w tym sezonie, ale oddam."',
 '„Twoja jazda w parze to jest osobna umiejętność. Rzadka."',
 '„Prezes patrzy na punkty. Ja patrzę na to, kto mnie przepuścił do przodu."',
 '„Za każdy bonus należy ci się piwo. Jestem winien tyle, że muszę wziąć kredyt."',
 '„Nie jesteś egoistą. W tej dyscyplinie to jest wada i zaleta naraz."',
 '„Jedziemy jak jeden zawodnik na dwóch motocyklach."',
 '„Wiem, że mogłeś mnie wyprzedzić. Nie zrobiłeś tego. Zapamiętam."',
 '„Twoje bonusy uratowały nam dwa mecze. Sprawdziłem."',
 '„Trener mówi, że jesteś zawodnikiem drużynowym. Mówi to tak, jakby to było oczywiste. Nie jest."',
 '„Rywale nienawidzą z nami jeździć. To najlepsza rekomendacja."',
 '„Zamykasz tor tak, że nawet ja mam czasem problem, żeby wyjechać."',
 '„W tabeli bonusów jesteś wyżej niż w tabeli punktów. To o czymś świadczy."',
 '„Kiedy widzę twój numer obok mojego, wiem, że będzie dobrze."',
 '„Nasza para to najlepsza rzecz, jaka się zdarzyła tej drużynie w tym roku."',
 '„Ludzie liczą punkty. Zawodnicy liczą bonusy. Ty jesteś zawodnikiem."',
 '„Robisz miejsce, którego nie ma. Nie wiem jak, ale robisz."',
 '„Sezon w twoim towarzystwie to komfort, do którego nie chcę się przyzwyczaić, bo potem będzie boleć."',
 '„Dzięki tobie mam najlepszy sezon w karierze. Powiedziałem to i nie cofnę."'
]},

/* ---------- ZERO BONUSÓW ---------- */
bonZero: { who:'KOLEGA Z PARY', lines:[
 '„Ani jednego bonusa. Ty jedziesz w tej drużynie czy obok niej?"',
 '„Za każdym razem, jak się oglądam, ciebie już nie ma. Albo jesteś przede mną i mnie mijasz."',
 '„Wiesz, że jedziemy w parze? Pytam, bo nie jestem pewien, czy ty wiesz."',
 '„Zero bonusów. Statystycznie to znaczy, że jeździsz sam."',
 '„Raz mogłeś mnie przepuścić. Raz. Cały sezon."',
 '„Nie mam pretensji. Mam obserwację."',
 '„Trener pyta, czemu nam nie wychodzi w parze. Nie odpowiadam, bo jestem grzeczny."',
 '„Jak wyprzedzasz rywala, to super. Jak wyprzedzasz mnie, to gorzej."',
 '„Bonus to nie jałmużna. To robota w drużynie."',
 '„Cały sezon i ani razu nie zablokowałeś nikogo dla mnie. Ani razu."',
 '„Jedziesz na siebie. Rozumiem to, ale w tabeli jest napisane «drużynowe»."',
 '„Zero bonusów w sezonie to jest komunikat. Odczytałem go."',
 '„Nie musisz mnie lubić. Wystarczyłoby, żebyś zauważył mój numer."',
 '„Widziałem, jak zamykasz tor. Mnie."',
 '„Chłopie, my mamy te same barwy. Kolor kevlaru to nie przypadek."',
 '„W parze jesteś tak samotny, jak w bufecie po meczu."',
 '„Jeden bonus by wystarczył, żebym o tym nie mówił. Nie było ani jednego."',
 '„Punkty masz swoje. Drużyna ma swoje. Te zbiory się nie przecinają."',
 '„Mówiłem ci przed sezonem: jedziemy razem. Chyba usłyszałeś tylko «jedziemy»."',
 '„Nie jesteś złym zawodnikiem. Jesteś złym partnerem w parze."',
 '„W szatni nikt tego nie powie głośno, więc powiem ja: zero bonusów."',
 '„Za każdym razem robisz miejsce rywalowi zamiast mnie. To już wygląda na system."',
 '„Trener przestał nas stawiać razem. Wiesz dlaczego."',
 '„Bonusy to jest ta część żużla, która odróżnia drużynę od turnieju indywidualnego."',
 '„Rywale się cieszą, jak nas widzą razem. Wiesz, co to znaczy?"',
 '„Zero. W tabeli, w protokole i w mojej pamięci."',
 '„Mogę zrozumieć jeden mecz. Cały sezon to już charakter."',
 '„Nie proszę o przysługę. Proszę o jazdę drużynową."',
 '„Ludzie mówią, że jesteś indywidualistą. Ładne słowo na to, co robisz."',
 '„Może w przyszłym roku. Ale w przyszłym roku pewnie już nie będziemy w parze."',
 '„Jedziesz swoje i tyle. Szkoda, bo we dwóch bylibyśmy nie do przejechania."',
 '„Zero bonusów. Prezes tego nie zauważy. Ja zauważyłem."'
]},

/* ---------- MISTRZOSTWO ---------- */
champion: { who:'PREZES', lines:[
 '„Mistrzostwo! Premie wypłacimy... no, wypłacimy. Kiedyś."',
 '„Złoto! Zawsze mówiłem, że mam do tego rękę. Do zarządzania, nie do jazdy."',
 '„Mistrzowie Polski. Zamawiam banery. Płacę w przyszłym kwartale."',
 '„Wygraliśmy! Teraz proszę o rozsądek przy negocjacjach kontraktów."',
 '„Tytuł nasz. Miasto już dzwoni, że współfinansowało sukces. Współfinansowało trawnik."',
 '„Mistrzostwo. Nie ukrywam, że to była moja wizja od pierwszego dnia. Od dziewiątego, ale to szczegół."',
 '„Chłopcy, jesteście wielcy. Faktury też, ale o tym potem."',
 '„Złoty medal! Zaczynamy planować obronę tytułu, czyli sprzedaż dwóch najlepszych zawodników."',
 '„Wygraliśmy ligę i przegraliśmy z księgowością. Bilans na plus."',
 '„Mistrzostwo Polski. Chyba muszę kupić nowy garnitur na galę."',
 '„Wiedziałem. Zawsze wiedziałem. Mam nawet notatkę z lutego, mogę pokazać."',
 '„Tytuł! Dziękuję zawodnikom, sztabowi i temu jednemu sponsorowi, który zapłacił."',
 '„Jesteśmy mistrzami. Proszę nie pytać, za co."',
 '„Puchar stoi u mnie w gabinecie. Jest cięższy niż nasze zobowiązania. Chyba."',
 '„Mistrzostwo! Kibice mogą świętować, ja idę policzyć premie i zblednąć."',
 '„To był plan trzyletni zrealizowany w rok. Głównie dlatego, że plan był na rok."',
 '„Zdobyliśmy tytuł. Teraz wszyscy chcą podwyżki. Przewidywalne."',
 '„Złoto dla naszego miasta. Miasto dowie się o tym z gazety."',
 '„Wygraliśmy. Nie pytajcie o budżet na przyszły sezon."',
 '„Mistrzowie! Zorganizujemy fetę na rynku. Skromną. Bardzo skromną."',
 '„Ten tytuł to zasługa całego klubu. I tego jednego zawodnika, ale nie będę wskazywał palcem."',
 '„Jesteśmy najlepsi w Polsce. W swojej klasie rozgrywkowej, ale to brzmi gorzej."',
 '„Mistrzostwo. Odbieram telefony od ludzi, którzy nie odbierali moich przez trzy lata."',
 '„Puchar jest nasz. Wypożyczalnia limuzyn już dzwoniła z ofertą."',
 '„Wygrana liga to jest coś, czego nikt nam nie odbierze. Sponsor tytularny może, ale nie odbierze."',
 '„Chłopaki, zapracowaliście na to. Ja też, choć inaczej."',
 '„Złoto! Ogłaszam, że budujemy nową trybunę. Ogłaszam to co roku."',
 '„Tytuł mistrzowski. Zaczynam wierzyć w to, co mówię na konferencjach."',
 '„Wygraliśmy ligę i to jest fakt niepodważalny. W przeciwieństwie do naszych sprawozdań."',
 '„Mistrzostwo Polski dla nas. Dla mnie osobiście: spokojna zima."',
 '„Zrobiliśmy to. Teraz muszę tylko znaleźć pieniądze, żeby zrobić to jeszcze raz."',
 '„Tytuł nasz. Proszę mi już nie przypominać, co mówiłem w kwietniu."'
]},

/* ---------- SPADEK (8. MIEJSCE) ---------- */
relegated: { who:'PREZES', lines:[
 '„Spadliśmy, ale to był rok budowania. Budowaliśmy. Dół tabeli."',
 '„Spadek to nowe otwarcie. Otwieramy się na niższą klasę rozgrywkową."',
 '„Nie mówimy «spadek». Mówimy «reset projektu sportowego»."',
 '„To był rok trudny, ale wyciągamy wnioski. Wnioski złożymy do PZM."',
 '„Spadliśmy. Odpowiedzialność biorę na siebie i przekazuję ją trenerowi."',
 '„Wracamy silniejsi. Za rok, dwa. Może trzy."',
 '„Klasa niżej to niższe koszty. Patrzę na to optymistycznie, bo muszę."',
 '„Rok przejściowy. Przeszliśmy do niższej ligi, więc nazwa się zgadza."',
 '„Spadek jest konsekwencją decyzji, które podejmowali inni. Ja jedynie je zatwierdzałem."',
 '„Kibice mają prawo być zawiedzeni. Ja mam prawo do urlopu."',
 '„Nie udało się. Dziękuję zawodnikom, którzy zostali do końca. Obu."',
 '„Budowaliśmy zespół na lata. Zbudowaliśmy na jeden sezon i to nie ten."',
 '„Spadamy, ale zostaje infrastruktura. Zostaje tor i długi."',
 '„W niższej lidze będziemy faworytem. Tak się mówi po każdym spadku."',
 '„To nie jest koniec. To jest przecinek. Bardzo długi przecinek."',
 '„Zawiedliśmy kibiców. Głównie tych, którzy kupili karnety w marcu."',
 '„Popełniliśmy błędy transferowe. Wszystkie z rzędu."',
 '„Spadek boli. Najbardziej boli, że wszyscy się go spodziewali od maja."',
 '„Analiza sezonu potrwa kilka tygodni. Wyniku analizy nie ogłosimy."',
 '„Zabrakło punktów, pieniędzy i szczęścia. W tej kolejności, choć może odwrotnej."',
 '„Zapewniam, że klub przetrwa. Zapewniam też, że w kwietniu mówiłem coś innego."',
 '„Spadliśmy z ligi, ale nie z mapy. Jeszcze nie."',
 '„Rozstajemy się z trenerem za porozumieniem stron. Strony się nie porozumiały."',
 '„Sezon do zapomnienia. Pracujemy nad tym, żeby zapomnieć jak najszybciej."',
 '„Nie było łatwo i nie będzie. To był mój najszczerszy komunikat od lat."',
 '„Odbudowa. Ulubione słowo tego klubu. Używamy go od sześciu lat."',
 '„W niższej lidze wrócimy do korzeni. Korzenie są tanie."',
 '„Spadek to jest lekcja. Lekcja kosztowała nas sponsora tytularnego."',
 '„Dziękuję kibicom, którzy przyjeżdżali na wyjazdy. Wszystkim dwudziestu."',
 '„Nie szukam winnych. Znalazłem ich już w sierpniu."',
 '„Przegraliśmy walkę o utrzymanie w ostatniej kolejce. I w przedostatniej. I w tych wcześniejszych."',
 '„Będziemy walczyć o powrót. To zdanie mam już wydrukowane, oszczędzam na drukarce."'
]},

/* ---------- BUNT PŁACOWY / STRAJK ---------- */
strike: { who:'DZIENNIKARZ', lines:[
 '„Zawodnik nie wyjechał na tor, bo klub nie płaci. Klasyka gatunku, wydanie {rok}."',
 '„Odmowa startu z powodu zaległości. W {rok} to już nie jest sensacja, to rubryka stała."',
 '„Rozmawiałem z nim po meczu, na który nie wyjechał. Był spokojniejszy niż prezes."',
 '„Bunt płacowy w {rok}. Klub wydał oświadczenie o «różnicy zdań co do harmonogramu»."',
 '„Nie pojechał, bo mu nie zapłacili. Nagłówek pisze się sam."',
 '„Kibice gwizdali na zawodnika, który upomniał się o swoje pieniądze. Piękny kraj."',
 '„Klub twierdzi, że przelewy są w drodze. Droga trwa siódmy miesiąc."',
 '„Zawodnik zrobił to, co powinien zrobić związek zawodowy. Gdyby istniał."',
 '„Odmówił jazdy. Prezes nazwał to «brakiem lojalności». Faktury nazwał inaczej."',
 '„To nie strajk. To jest przypomnienie o istnieniu umowy."',
 '„W {rok} zawodnicy nadal muszą wybierać między jazdą a wypłatą. Postęp."',
 '„Zapytałem prezesa o zaległości. Odesłał mnie do księgowej. Księgowa jest na zwolnieniu."',
 '„Nie wyjechał na tor i nagle wszyscy przypomnieli sobie o jego kontrakcie."',
 '„Zawodnik-dłużnik klubu, a nie odwrotnie. To zdanie powinno kogoś zawstydzić."',
 '„Sprawa trafi do trybunału PZM. Trybunał rozpatrzy ją po sezonie. Po którym, nie doprecyzowano."',
 '„Klub w komunikacie użył słowa «nieporozumienie». Kwota nieporozumienia jest sześciocyfrowa."',
 '„Nie pojechał i miał rację. Napisałem to i dostałem telefon z klubu."',
 '„Kolejna kolejka, kolejny zawodnik bez pieniędzy. Rok {rok}, liga zawodowa."',
 '„Prezes mówi, że «wszyscy są w tej samej sytuacji». To akurat prawda i to jest najgorsze."',
 '„Bunt jednego zawodnika. Reszta milczy, bo ma kredyty."',
 '„Klub zapowiada wyciągnięcie konsekwencji. Wobec zawodnika, oczywiście."',
 '„Zaległości rosną, a rozmowa toczy się o «postawie». Zawsze o postawie."',
 '„Zawodnik pokazał charakter. W tej lidze charakter kosztuje jedną kolejkę pauzy."',
 '„To nie jest kaprys. To jest niezapłacona faktura z odsetkami."',
 '„Sezon {rok} zapamiętamy nie z powodu wyników, tylko z powodu przelewów, których nie było."',
 '„Zapytałem kibiców, po czyjej są stronie. Odpowiedzi nie nadają się do druku."',
 '„Klub proponuje rozłożenie zaległości na raty. Raty na raty."',
 '„Odmowa startu w proteście. Za pięć lat będzie to standardowa procedura, dziś jest skandalem."',
 '„W komunikacie klubu nie padło słowo «pieniądze». Ani razu."',
 '„Zawodnik wybrał godność. Tabela wybrała minus dwa punkty."',
 '„Rozmawiałem z jego mechanikiem. On też nie dostał."',
 '„Jeżeli w {rok} trzeba strajkować o wypłatę, to nie mówmy już o sporcie zawodowym."'
]},

/* ---------- WYSOKIE KARY ({kasa}) ---------- */
fines: { who:'KSIĘGOWA KLUBU', lines:[
 '„Kar na {kasa}. Panie, pan więcej płaci, niż zarabia."',
 '„{kasa} kar w jednym sezonie. Mam osobną teczkę. Gruba."',
 '„Wpisuję pana kary w oddzielną rubrykę, bo psuły mi zestawienie. {kasa}."',
 '„Panie kolego, {kasa}. Za te pieniądze kupiłby pan silnik. Nawet dwa."',
 '„Regulamin dyscyplinarny zna pan pewnie na pamięć. {kasa} lekcji."',
 '„{kasa}. To jest kwota, przy której zaczynam się o pana martwić. Zawodowo."',
 '„Kary: {kasa}. Wynagrodzenie: mniej. Nie jestem doradcą finansowym, ale coś tu nie gra."',
 '„Pan płaci temu klubowi, a nie odwrotnie. {kasa} dowodu."',
 '„Zrobiłam wykres pana kar. Rośnie ładnie, jak na wykresie ma być."',
 '„{kasa}. Proszę mi wierzyć, przeliczyłam trzy razy, bo sama nie wierzyłam."',
 '„Za {kasa} można by opłacić juniorowi cały sezon. Z busem."',
 '„Panie, pana kary finansują nam kadrę juniorską. Dziękujemy, ale proszę przestać."',
 '„W tym sezonie był pan naszym najbardziej regularnym źródłem wpływów. {kasa}."',
 '„{kasa} kar. Prezes żartował, że powinniśmy dać panu premię za obrót."',
 '„Kolejny mandat, kolejny przelew. Razem {kasa}."',
 '„Mam pana nazwisko w systemie wpisane jako pozycję kosztową. To nie żart."',
 '„{kasa}. Panie, przy takim tempie skończy pan sezon z ujemnym wynagrodzeniem."',
 '„Kary regulaminowe: {kasa}. Kary od życia: nieksięgowane."',
 '„Odejmowałam to panu z każdej wypłaty. {kasa} razem."',
 '„Proszę spojrzeć na to inaczej: gdyby nie kary, byłby pan całkiem dobrze zarabiającym człowiekiem."',
 '„{kasa}. Zaczęłam prowadzić dla pana osobny arkusz."',
 '„Panie, ja nie oceniam. Ja tylko podliczam. Wyszło {kasa}."',
 '„Za {kasa} można wyremontować szatnię. Całą."',
 '„Kary w wysokości {kasa}. Prezes powiedział, że to nasz najlepszy interes w tym roku."',
 '„Widziałam pana podpis na tylu protokołach, że rozpoznam go wszędzie."',
 '„{kasa}. Panie, może warto po prostu przestać?"',
 '„Nie ma pan długu wobec klubu. Ma pan abonament."',
 '„Pana kary przekroczyły budżet na paliwo dla całej drużyny. {kasa}."',
 '„{kasa} w rubryce «pozostałe». Musiałam ją rozszerzyć."',
 '„Rozmawiałam z panem o tym w czerwcu. Od tamtej pory doszło jeszcze sporo."',
 '„Panie, {kasa} to jest kwota, przy której człowiek powinien zrobić rachunek sumienia."',
 '„Zamykam księgi. Pana pozycja jest najbardziej kolorowa. {kasa}."'
]},

/* ---------- UJEMNY BUDŻET ---------- */
broke: { who:'KOMORNIK', lines:[
 '„Dzień dobry. Ładny ten bus."',
 '„Dzień dobry. Przyszedłem w sprawie, o której pan wie."',
 '„Spisujemy tylko to, co widać. Reszta zostaje, na razie."',
 '„Nie musi pan otwierać garażu. Sąsiad już otworzył."',
 '„Motocykl żużlowy. Wartość rynkowa: dyskusyjna. Wartość dla pana: bezcenna. Wpisuję rynkową."',
 '„Rozumiem, że to narzędzie pracy. Wszyscy tak mówią, panie."',
 '„Proszę o dokumenty na przyczepę. Jakiekolwiek."',
 '„Miałem dziś trzy adresy. Pan był najbardziej uprzejmy."',
 '„Widzę, że ma pan puchar. Pucharów nie zabieramy. To dobra wiadomość dnia."',
 '„Wpłata częściowa też jest wpłatą. Proszę o tym pomyśleć."',
 '„Numer konta ma pan w piśmie. To pismo, którego pan nie odebrał."',
 '„Nie jestem od oceniania. Jestem od zajmowania."',
 '„Ten telewizor jest leasingowany? Wszyscy tak mówią."',
 '„Wrócę. To nie jest groźba, to jest procedura."',
 '„Ma pan trzy dni. Potem mam ja."',
 '„Sportowiec, a takie długi. Panie, widziałem gorsze przypadki. Wczoraj."',
 '„Zajmujemy rachunek. Pozostałe środki: sprawdziłem, nie ma."',
 '„Proszę się nie denerwować. Denerwowanie się nie wstrzymuje egzekucji."',
 '„To pan jest tym żużlowcem? Syn mnie o pana pytał. Nie powiem mu, gdzie byłem."',
 '„Kevlar zostaje. Nie ma na to rynku wtórnego."',
 '„Panie, ja tu jestem od dziesiątej rano. Jest pan piątym zawodnikiem dzisiaj."',
 '„Podpis tutaj. To tylko potwierdzenie, że pan wie."',
 '„Rozłożenie na raty jest możliwe. Trzeba było odbierać telefony."',
 '„Bus zostaje na razie. Ale numer rejestracyjny zapisałem."',
 '„W protokole napiszę «brak przedmiotów wartościowych». To pana ratuje i pana opisuje."',
 '„Widziałem pana w telewizji. Wyglądał pan na bogatszego."',
 '„Nie ma pan pieniędzy, ale ma pan cztery silniki. Zaraz to zmienimy."',
 '„Proszę nie zamykać drzwi. To niczego nie rozwiązuje, a wydłuża."',
 '„Dług nie znika. Dług tylko czeka."',
 '„Zostawiam wezwanie na stole. Przy fakturach. Ładnie się komponuje."',
 '„Ma pan piękny kask. Ma pan też trzy niezapłacone tytuły wykonawcze."',
 '„Do widzenia. Podkreślam: do widzenia."'
]},

/* ---------- SPRZĘT W OPŁAKANYM STANIE ---------- */
junk: { who:'TUNING-GÓR', lines:[
 '„Ten silnik to już nie silnik. To eksponat. Przynieś go do stodoły."',
 '„Chłopie, ja to widziałem ostatnio w muzeum. I tam było w lepszym stanie."',
 '„Otworzyłem to i się przeżegnałem. Zamknąłem z powrotem."',
 '„Na tym się nie jeździ. Na tym się dojeżdża, jak dobrze pójdzie."',
 '„Tłok wygląda jak po ostrzale. Serio, po ostrzale."',
 '„Przywieź to do stodoły, ale przywieź na lawecie. Nie ryzykuj."',
 '„Ten sprzęt ma za sobą więcej sezonów niż mój pies lat."',
 '„Mogę to skleić. Nie mogę tego naprawić. To dwie różne usługi."',
 '„Panie, tu nawet śruby są zmęczone."',
 '„Zrobię ci przegląd, ale to będzie raczej sekcja zwłok."',
 '„Ten motocykl nie potrzebuje tunera. Potrzebuje księdza."',
 '„Głowica jest w takim stanie, że ja bym jej nie wziął nawet za darmo."',
 '„Jak ty na tym jeździsz, to masz odwagę. Albo nie wiesz."',
 '„Widziałem lepsze silniki wyciągnięte z rowu."',
 '„To już nie kwestia mocy. To kwestia bezpieczeństwa."',
 '„Chłopie, kup nowy. Serio. Nie żartuję, a ja zawsze żartuję."',
 '„Ten sprzęt zabiera ci pół sekundy na okrążeniu. Pół sekundy to jest cały wyścig."',
 '„Rozbieram to od trzech godzin i wciąż znajduję rzeczy, których nie rozumiem."',
 '„Zapytałem, kiedy była ostatnia rewizja. Powiedziałeś, że nie pamiętasz. To była odpowiedź."',
 '„Ja to potraktuję jak wyzwanie. Ale rachunek będzie wyzwaniem dla ciebie."',
 '„Ten silnik ma charakter. Zły."',
 '„Widzisz te opiłki? To nie powinno tak wyglądać. Nigdy."',
 '„Możesz na tym jeździć jeszcze dwa mecze. Potem to już loteria."',
 '„W stodole mam lepszy sprzęt na częściach. Dosłownie na częściach."',
 '„Nie dziwię się twoim defektom. Dziwię się, że nie masz ich więcej."',
 '„To jest sprzęt na trening. Na trening dla kogoś, kogo nie lubisz."',
 '„Przywieź to, wypijemy kawę i pogadamy, co dalej. «Dalej» oznacza zakupy."',
 '„Powiem ci szczerze, bo lubię: to się nadaje na kwietnik."',
 '„Rama ma mikropęknięcie. Mikro, ale w złym miejscu."',
 '„Twój silnik brzmi jak młocarnia mojego dziadka. Młocarnia jeździła szybciej."',
 '„Wydajesz na paliwo więcej niż ten sprzęt jest wart."',
 '„Nie oszczędzaj na sprzęcie. Oszczędzaj na czymś, co cię nie wysadzi na prostej."'
]},

/* ---------- WIEK 34+ I SŁABA FORMA ---------- */
oldSlow: { who:'MENEDŻER', lines:[
 '„Może czas pomyśleć o czymś spokojniejszym? Znam człowieka, ma myjnię."',
 '„Nie mówię, żeby kończyć. Mówię, żeby mieć plan B. I C."',
 '„Telefony od klubów przestały dzwonić. To nie jest awaria telefonu."',
 '„Rynek się zmienił. Kluby wolą dwudziestolatka, który jest gorszy, ale tańszy i młodszy."',
 '„Rozmawiałem z trzema prezesami. Wszyscy pytali o twój rocznik, nie o średnią."',
 '„Ciało już nie wybacza. Kalendarz też nie."',
 '„Masz doświadczenie, którego nikt nie chce kupić. Taki paradoks."',
 '„Znam klub, który cię weźmie. Klasa niżej i za pół stawki."',
 '„Nie chodzi o to, że jeździsz źle. Chodzi o to, że inni jeżdżą tak samo, tylko taniej."',
 '„Pomyśl o licencji trenerskiej. Serio, mówię to jako przyjaciel, nie jako menedżer."',
 '„W tym wieku każdy słaby sezon liczy się podwójnie."',
 '„Mogę ci załatwić kontrakt, ale będziesz się na niego wstydził patrzeć."',
 '„Regeneracja po meczu trwa u ciebie tyle, co kiedyś przygotowania do sezonu."',
 '„Prezesi mówią o tobie w czasie przeszłym. Zauważyłem to w czerwcu."',
 '„Masz jeszcze rok, może dwa. Wykorzystaj je świadomie."',
 '„Nie sprzedam cię jako perspektywę. Mogę cię sprzedać jako stabilizację. To mniej warte."',
 '„Kluby patrzą na PESEL zanim spojrzą na kartę meczową."',
 '„Znam ludzi w mediach. Mógłbyś komentować. Płacą mniej, ale nie boli."',
 '„Twoja wartość rynkowa spadła bardziej niż twoja średnia. Tak działa ten rynek."',
 '„Powiem ci to raz: jeszcze jeden taki sezon i nie znajdę ci nic."',
 '„Rozważ jazdę w niższej lidze. Będziesz tam liderem, nie balastem."',
 '„W kadrze cię nie ma i już nie będzie. To nie jest opinia, to jest fakt."',
 '„Twój sprzęt kosztuje tyle samo, co dziesięć lat temu. Twoja stawka nie."',
 '„Możesz jeździć dla przyjemności. Tylko czy ta przyjemność jeszcze jest?"',
 '„Miałeś dobrą karierę. Używam czasu przeszłego świadomie."',
 '„Zapytałem cię przed sezonem, czego chcesz. Nie odpowiedziałeś. To też odpowiedź."',
 '„Kolega w twoim wieku otworzył warsztat. Ma spokój i weekendy."',
 '„Nie namawiam do niczego. Pokazuję ci arkusz i sam sobie zobacz."',
 '„W tej dyscyplinie po trzydziestce nie ma powrotów. Są tylko przedłużenia."',
 '„Jeszcze cię lubię, ale coraz trudniej mi cię komuś polecić."',
 '„Trzy oferty w zeszłym roku, zero w tym. To nie jest przypadek."',
 '„Zima jest dobrym momentem, żeby porozmawiać poważnie. Zadzwonię w grudniu."'
]},

/* ---------- MŁODY I SZYBKI ---------- */
youngFast: { who:'SELEKCJONER', lines:[
 '„Zapamiętajcie to nazwisko. Albo i nie, zobaczymy za trzy lata."',
 '„Mamy chłopaka. Teraz trzeba go nie zepsuć, a to najtrudniejsza część."',
 '„W tym wieku takie liczby robi się raz na kilka lat."',
 '„Obserwujemy go od dwóch sezonów. Od dzisiaj obserwujemy uważnie."',
 '„Talent widać. Głowę zobaczymy przy pierwszym gorszym miesiącu."',
 '„Nie chcę mu zawrócić w głowie powołaniem. Ale powołanie będzie."',
 '„Jeździ jak ktoś o pięć lat starszy. To rzadkie i cenne."',
 '„Rozmawiałem z jego trenerem klubowym. Prosił, żeby go za bardzo nie chwalić. Za późno."',
 '„Młodzieżowiec, który nie boi się pierwszego łuku. Reszty można nauczyć."',
 '„Widziałem go w Kasku. Zapamiętałem, a widziałem tam trzydziestu innych."',
 '„To jest materiał na reprezentanta. Materiał, podkreślam."',
 '„Ma to coś, czego nie mierzy się stoperem."',
 '„Nie zamierzam go przyspieszać. Ale zamierzam go pilnować."',
 '„W jego wieku liczy się progresja, nie średnia. Progresja jest znakomita."',
 '„Startuje odważniej niż połowa seniorów w tej lidze."',
 '„Trzeba go trzymać z dala od głupich pieniędzy przez najbliższe dwa lata."',
 '„Zapraszamy go na konsultacje. To nie jest jeszcze powołanie, ale to pierwszy stopień."',
 '„Kluby już dzwonią po niego. Mam nadzieję, że wybierze rozwój, a nie stawkę."',
 '„Widać robotę szkoleniowca. Widać też coś, czego szkoleniowiec nie dał."',
 '„Sezon jak z podręcznika. Teraz najtrudniejsze: powtórzyć."',
 '„Ma sprzęt gorszy od rywali i wyniki lepsze. To mówi wszystko."',
 '„Nie chcę używać wielkich słów. Ale mam je przygotowane."',
 '„Jeżeli utrzyma tempo rozwoju, za trzy lata rozmawiamy o zupełnie innej lidze."',
 '„Popełnia błędy, ale zawsze do przodu. Wolę takie błędy."',
 '„Zapytałem go o cele. Odpowiedział konkretnie i bez pozy. Dobry znak."',
 '„Największym zagrożeniem dla niego są teraz ludzie wokół niego."',
 '„Ma czternaście lat kariery przed sobą, jeżeli nie zrobi głupstwa."',
 '„Widziałem, jak przegrywa bieg i jak reaguje. Reakcja była lepsza niż przejazd."',
 '„Chcemy go w kadrze młodzieżowej. Chcemy też, żeby jeszcze trochę pojeździł w spokoju."',
 '„To jest chłopak, dla którego warto zorganizować sparingi za granicą."',
 '„Nie porównuję go do nikogo. Porównania w tym wieku zabijają."',
 '„Sezon rewelacyjny jak na jego rocznik. Reszta zależy od zimy."'
]}

};
