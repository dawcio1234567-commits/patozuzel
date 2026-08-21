/* ============================================================
   PATO-ŻUŻEL :: DANE :: KLASY POSTACI, KLUBY, TUNERZY, MECHANICY, TRENERZY
   CLASSES, BASE_LEAGUES, LKEYS, TUNERS, MECHS, COACH_TYPES, COACHB.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 386-471 oryginału).
   PATCH 22.08.2026 (Sprint 3): doszła sekcja TRENERZY — typy szkoleniowców,
   ich sympatie i cały balans relacji trener–zawodnik.
   ============================================================ */
const CLASSES=[
 {id:'okno', n:'Okno życia',                 ovr:[1,10],  pot:[34,72], prof:[5,30],  med:[0,15], budget:-14000, d:'Klub bierze cię, bo ktoś musi wypełnić rubrykę. Jeździsz dla siebie i dla mamy. Bus po dziadku, rata jeszcze leci.'},
 {id:'lic',  n:'Licencja żeby klub był bez kar', ovr:[11,25], pot:[42,78], prof:[10,40], med:[0,20], budget:-11000, d:'Istniejesz wyłącznie po to, żeby regulamin się zgadzał.'},
 {id:'bez',  n:'Bezjajeczny grajek',         ovr:[26,40], pot:[54,84], prof:[20,55], med:[5,30], budget:-8000, d:'Umiesz jeździć, ale w pierwszym łuku zawsze puszczasz gaz.'},
 {id:'pot',  n:'Jakiś potencjał jest',       ovr:[41,50], pot:[64,88], prof:[30,65], med:[10,40],budget:-5000, d:'Trener mówi "on ma to coś". Trener mówi tak od czterech lat.'},
 {id:'tal',  n:'Wielki talent',              ovr:[51,60], pot:[74,95], prof:[35,75], med:[20,55],budget:0, d:'Portale piszą o tobie w każdą środę. Ciśnienie rośnie.'},
 {id:'zma',  n:'Następca Zmarzliny',         ovr:[61,67], pot:[86,99], prof:[40,80], med:[35,75],budget:6000, d:'Etykieta cięższa niż silnik. Albo hala sław, albo hala odlotów.'}
];
 
/* ---------- BAZA KLUBÓW ---------- */
function C(name,ovr,budget){return{name,ovr,budget,debt:0,mood:R(30,80),coach:null};}
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
   C('PASAŻ Poznań',48,800000),      // Wakat po PSŻ Poznań załatany przy zielonym stoliku
   C('MRÓZ Rybnik',60,1500000),
   C('CMENTARZ Łódź',57,1200000),
   C('MOSIĄDZ Rzeszów',68,2400000),
   C('BOLONIA Piła',40,550000),      // Awans do 2. EL
   C('OSTRO OSTRÓW',64,1800000),
   C('KSM Krosno',62,1600000)
 ]},
 KL:{name:'KRAJOWA LIGA ŻUŻLOWA', short:'KLŻ', clubs:[
   C('NADMORZE Gdańsk',70,2600000),  // Bolesny spadek
   C('SCHEISSE Landshut',66,2000000),// Bolesny spadek
   C('META Gniezno',52,900000),
   C('MOTORNICZY Opole',50,850000),
   C('LOKOMOTYWA Daugavpils',46,750000),
   C('BANDA Kraków',42,600000),
   C('GERMANIA Świętochłowice',38,500000),
   C('FUNIA TARNÓW',44,700000)   // Dopełnienie do 8 drużyn dla parzystości terminarza
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
/* ------------------------------------------------------------
   BALANS 21.08.2026 — SPRZĘT ZA MILION MUSI ROBIĆ RÓŻNICĘ
   Zgłoszenie gracza: "najdroższa część daje tylko +40, co jest kompletnie
   niezbalansowane". Racja. Skala sprzętu ma 99 punktów, zużycie zabiera
   16-26 punktów W KAŻDYM sezonie, a górna półka kosztuje 1,15 mln zł —
   przy +40 pełen program u tunera na wyłączność ledwo odrabiał dwa lata
   zajeżdżania i nigdy nie dawał sprzętu klasy mistrzowskiej. Cała drabinka
   przeskalowana tak, żeby CENA szła w parze z EFEKTEM: najtańszy złom z OLX
   to dalej łatanie dziur, ale komplet od topowego tunera realnie wsadza
   zawodnika na sprzęt 90+.
   ------------------------------------------------------------ */
const TUNERS=[
 {n:'Używany silnik z OLX ("mało jeżdżony, garażowany")',  c:22000,   e:6,  risk:35, prof:0},
 {n:'Szlif u Ryśka "Turbo" z Gorzowa',                     c:60000,   e:12, risk:18, prof:0},
 {n:'Kadłub po sezonie od kolegi z 2. Ekstraligi',         c:95000,   e:18, risk:12, prof:15},
 {n:'Rama Ellis + komplet nowych kół',                     c:145000,  e:24, risk:0,  prof:20},
 {n:'Silnik po tuningu u R. Kowalskiego',                  c:215000,  e:32, risk:4,  prof:30},
 {n:'Dwa silniki od Kowalskiego + serwis w trakcie sezonu',c:340000,  e:42, risk:2,  prof:42},
 {n:'Pakiet GM prosto od angielskiego tunera',             c:480000,  e:52, risk:0,  prof:55},
 {n:'Cztery silniki od topowego tunera + skrzynia części', c:720000,  e:64, risk:0,  prof:66},
 {n:'Pełen program: 6 silników, dwie ramy, tuner na wyłączność', c:1150000, e:78, risk:0, prof:78}
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
   TRENERZY (Sprint 3, patch 22.08.2026)
   ------------------------------------------------------------
   Każdy klub ma szkoleniowca. Trener to trzy liczby i jeden charakter:
     skill  — warsztat. Decyduje, jak szybko zawodnicy pod nim rosną
              (i jak wolno się sypią po trzydziestce).
     auth   — autorytet. Ile znaczy w gabinecie prezesa. Poniżej tej liczby
              gwiazda potrafi go wywalić (patrz engine/27-rynek-oferty.js).
     nerve  — nerwy. Jak szybko sięga po rezerwę taktyczną i jak łatwo
              wchodzi w konflikt.
   `w` to WAGI SYMPATII: za czym ten konkretny trener przepada. Belfer
   ceni profesjonalizm i nie znosi celebrytów, słup ogłoszeniowy dokładnie
   odwrotnie. Stąd bierze się `coachRel()` — od -100 (nienawiść) do +100
   (twój człowiek), a z niej status w zespole, minuty na torze i to,
   czy klub w ogóle wyciągnie do ciebie rękę z przedłużeniem.
   `tol` — ile punktów OVR RÓŻNICY względem poziomu drużyny trener zniesie,
   zanim zacznie cię nie lubić. Bo nie lubi się nie tylko słabszych:
   zawodnik wyraźnie LEPSZY od reszty kadry to dla przeciętnego trenera
   chodzące zagrożenie — media pytają o niego, a nie o taktykę.
   ============================================================ */
const COACH_TYPES=[
 {id:'belfer', n:'Belfer', short:'BEL',
  d:'Zeszyt, długopis, odprawa na 40 minut przed pierwszym treningiem. Nie znosi spóźnień i wywiadów.',
  w:{prof:1.35, med:-0.40, loy:0.55, pts:0.85}, tol:15, auth:64, dev:9, youth:1,
  flavor:'Kto nie ma podkładek serwisowych, ten u mnie nie jeździ.'},
 {id:'slup', n:'Słup ogłoszeniowy', short:'SŁP',
  d:'Trener z nazwy, konferansjer z zamiłowania. Ustawia skład pod to, o czym napiszą portale.',
  w:{prof:-0.35, med:1.40, loy:0.20, pts:0.65}, tol:11, auth:36, dev:-6, youth:0,
  flavor:'Chłopie, ty masz jeździć tak, żeby o tym gadali w poniedziałek.'},
 {id:'wynik', n:'Rachmistrz', short:'RCH',
  d:'Liczy średnie biegowe w Excelu i nie ma sentymentów. Punkty albo do widzenia.',
  w:{prof:0.55, med:0.10, loy:0.10, pts:1.60}, tol:19, auth:58, dev:2, youth:-1,
  flavor:'Twoja średnia to 1,42. Reszta mnie nie interesuje.'},
 {id:'wychowawca', n:'Wychowawca młodzieży', short:'WYC',
  d:'Wozi juniorów busem na treningi po nocach. W seniorze widzi materiał, nie towar.',
  w:{prof:0.85, med:-0.10, loy:0.80, pts:0.55}, tol:23, auth:47, dev:13, youth:6,
  flavor:'Ja cię wychowałem, to ja ci powiem, kiedy jesteś gotowy.'},
 {id:'kolega', n:'Ziomek z szatni', short:'ZMK',
  d:'Był zawodnikiem, gra z chłopakami w karty i wie, kto z kim nie gada. Taktyki brak.',
  w:{prof:0.15, med:0.45, loy:1.15, pts:0.60}, tol:20, auth:33, dev:-2, youth:2,
  flavor:'U mnie najważniejsze, żeby w busie się dogadywać.'},
 {id:'dyktator', n:'Dyktator', short:'DYK',
  d:'Jedna wizja, jeden głos i lista rzeczy, których nie wolno. Nie znosi konkurencji we własnej drużynie.',
  w:{prof:0.95, med:-0.55, loy:0.95, pts:1.05}, tol:9, auth:76, dev:5, youth:-2,
  flavor:'W tej drużynie jest jedna gwiazda i ta gwiazda stoi w kożuchu przy bandzie.'}
];

/* ---------- BALANS RELACJI Z TRENEREM ---------- */
const COACHB={
 /* progi statusu w zespole — od góry, pierwszy pasujący wygrywa */
 status:[
  {min: 72, n:'Legenda',            c:'#22c55e', d:'Twoje nazwisko wisi w świetlicy. Trener ustawia skład wokół ciebie.'},
  {min: 42, n:'Gwiazda',            c:'#4ade80', d:'Jedziesz wszystko, co się da, i nikt nie pyta o twoją średnią.'},
  {min: 14, n:'Filar składu',       c:'#a3e635', d:'Solidny numer w programie. Trener śpi spokojnie, kiedy widzi cię pod taśmą.'},
  {min:-14, n:'Numer w programie',  c:'#d4d4d8', d:'Jesteś. Wypełniasz rubrykę. Tyle.'},
  {min:-44, n:'Rubryka do wypełnienia', c:'#f59e0b', d:'Trener wystawia cię, bo musi, i zdejmuje przy pierwszej okazji.'},
  {min:-101,n:'Wkład do kevlaru',   c:'#ef4444', d:'Wozisz kevlar i patrzysz. Gdyby regulamin pozwalał, nie zgłosiłby cię w ogóle.'}
 ],
 /* dwa statusy SPECJALNE — nie wynikają z samej sympatii, tylko z POWODU:
    ktoś odstaje od drużyny w górę albo w dół i trener nie ma na to pomysłu */
 tooGood:{n:'Gwiazda nie na tę drużynę', c:'#f59e0b',
   d:'Jesteś za dobry na ten skład i trener o tym wie. Odstawia cię nie dlatego, że nie dowozisz — dlatego, że przy tobie nikt go nie słucha.'},
 tooWeak:{n:'Wkład do kevlaru', c:'#ef4444',
   d:'Poziom drużyny jest gdzie indziej, a ty wozisz kevlar i patrzysz. Gdyby regulamin pozwalał, nie zgłosiłby cię w ogóle.'},
 /* rozwój OVR pod trenerem */
 devMin:0.45, devMax:1.85,         // mnożnik przyrostu (i odwrotnie: spadku) OVR
 devPlayerK:{jun:7.0, u24:5.0, prime:3.2, old:2.4},   // ile OVR gracza waży trener w danym wieku
 /* presja na trenerze */
 fireAt:74,                        // od tej presji zarząd zaczyna szukać następcy
 /* pucz gwiazdy: (OVR + med*0.55) - (auth + skill*0.35) */
 coupGap:16,                       // ile trzeba mieć przewagi nad trenerem, żeby zarząd wybrał ciebie
 coupHate:-25,                     // przy jakiej sympatii trener w ogóle zaczyna cię blokować
 relRenewW:0.38                    // ile sympatia waży w szansie na przedłużenie
};

/* Regulamin rezerw (art. 719) — jedno miejsce na limity startów z rezerwy. */
const RESB={
 junPlain:2,      // młodzieżowiec: dwa starty jako REZERWA ZWYKŁA
 junTactic:1,     // ...i jeden jako REZERWA TAKTYCZNA
 tacticDiff:-6,   // od jakiej straty trener sięga po rezerwę taktyczną
 burdel:'Ty to chyba regulaminu w burdelu się uczyłeś'   // ulubione zdanie każdego trenera w tym kraju
};
