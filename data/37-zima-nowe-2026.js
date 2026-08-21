/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: PAKIET NOWYCH ZDARZEŃ 2026
   Pula "WEV_NOWE2026" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   Zima: fxA/fxT/fxOB/fxH/fxI/fxBan NIE są używane — zamiast nich fxHN/fxIN/fxRateN/p.next.*
   ============================================================ */
const WEV_NOWE2026 = [

{id:'nauka_longtrack', t:'NAUKA LONGTRACK',
 x:'Nieznany Francuz dzwoni do ciebie w przed sezonem i proponuje naukę jazdy na długim torze. Mówi, że ci zapłaci, jeżeli ogarniesz jego synowi kontrakt w Polsce.',
 o:[
  {l:'Od zawsze byłem fanem jego talentu.', f:()=>[fxP(-5), fxK(25000), fxHN(-5)]},
  {l:'Spadaj żabojadzie.', f:()=>[fxP(5), fxK(-10000)]}
 ]},

{id:'australijskie_zloto', t:'AUSTRALIJSKIE ZŁOTO',
 x:'Twój australijski kolega z drużyny proponuje Ci nietypowy sposób na dodatkowy zarobek przed sezonem, czyli kilka dni wspólnego kopania złota. Pieniądze kuszą, ale ciężka fizyczna praca może odbić się na Twojej formie.',
 o:[
  {l:'Raz się żyje, dawaj ten kilof.', f:()=>[fxK(R(0,100000)), fxL(5), fxP(-10), fxHN(-15), fxO(-5), fxIN(15)]},
  {l:'Mam już wystarczająco szalony zawód. Kop sobie sam, ja idę trenować.', f:()=>[fxP(5), fxO(2), fxL(-1)]}
 ]},

{id:'muzykant', t:'MUZYKANT',
 x:'Sezon się skończył, więc dobrze byłoby się czymś zająć. Ponieważ filmik jak śpiewasz "Kochana jak się masz" okazał się viralem, dostajesz propozycje wspólnych występów.',
 cond:(p,c,S)=>!!S.winter,
 o:[
  {l:'Będę pisał i występował sam!', f:()=>[fxM(10), fxP(-10), fxHN(-10)]},
  {l:'Korzystasz z oferty niemieckiego mistrza świata - czas na dojcze disco polo.', f:()=>[fxK(50000), fxP(-10), fxO(2)]},
  {l:'Jestę diżeję.', f:()=>[fxK(20000), fxP(-5), fxM(20)]},
  {l:'Wystarczy mi śpiewanie kolęd w stroju elfa na klubowych mediach.', f:()=>[fxL(5), fxHN(15), fxP(5)]}
 ]},

{id:'aktorzyna', t:'AKTORZYNA',
 x:'Sezon się skończył, więc dobrze byłoby się czymś zająć. Miałeś kilka upadków, gdzie przyaktorzyłeś na tyle, że sędziowie dali się nabrać. Próbujesz swych sił.',
 cond:(p,c,S)=>!!S.winter && _weak(p),
 o:[
  {l:'Superprodukcja "Żużel" to jest to.', f:()=>[fxM(20), fxP(-10), fxHN(10), fxK(50000)]},
  {l:'Gram w filmie po ślōnsku.', f:()=>[fxM(10), fxP(-5), fxK(25000)]},
  {l:'Jadę do Hollywood! [PATOLOGIA/UŻYWKI]', cond:(p)=>p.prof<40, f:()=>[fxP(-10), fxM(-10), fxHN(-10), fxK(-10000)]},
  {l:'Nagrywam tiktoki.', f:()=>[fxO(-4), fxT(-2), fxHN(-10)]},
  {l:'Może jednak pojadę na narty.', f:()=>[fxK(-10000), fxP(10), fxIN(5)]}
 ]},

{id:'skladanie_szafy_grudzien', t:'SKŁADANIE SZAFY',
 x:'Nawalony żużlowy influencer dzwoni do Ciebie w grudniu i zaprasza na wspólne składanie szafy z IKEI.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Zgadzam się.', f:()=>[fxO(2), fxIN(30)]},
  {l:'Dzwonię na płokułatułę.', f:()=>[fxM(-10), fxP(10)]}
 ]}

];
