/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   data.js — statyczna "baza danych" gry (balans, klasy postaci,
   kluby, sprzęt, zdarzenia losowe, progi upadłości, imiona/nazwiska)
   ============================================================ */
 
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