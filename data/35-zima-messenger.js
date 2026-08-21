/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Zimowy set z „Messengera"
   Pula "WEV_MESSENGER" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2645-2687 oryginału).
   ============================================================ */
const WEV_MESSENGER = [
/* ===== DOPISKA: ZIMOWY SET Z „MESSENGERA" — tekst zachowany 1:1. Efekty
   sezonowe (fxA/fxH/fxI...) w zimie są kosmetyczne, jak w reszcie tej puli
   (patrz applyWinterChoice w engine.js) — realny skutek na kolejny sezon
   dają wyłącznie mutacje p.next.* i warianty fxHN/fxIN/fxK/fxO/fxP/fxM. ===== */

{id:'historia_leszno', t:'HISTORIA LESZNO',
 x:'Jeden z kibiców Unii Leszno jest wielkim fanem historii. Pragnie dostać się do sejfu z dokumentami historycznymi i poznać tajemnice i ciekawostki z historii klubu.',
 cond:(p)=>!!p.club && p.club.includes('Leszno'),
 o:[
  {l:'Pomagasz mu.',
   f:()=>{ G.p.next.zeroMatches=true; G.p.next.noRenew=true;
     return ['Tajemnica ujawniona — naprawdę Unia Leszno To Nie Jest Polski Klub.', fxM(30),
             'W KOLEJNYM SEZONIE ZALICZASZ 0 MECZÓW.', 'Brak oferty kontraktu od Leszna.']; }},
  {l:'Liczy się tu i teraz!',
   f:()=>['Ciekawe, kiedy tajemnice ujrzą światło dzienne…', fxP(10), fxAN(3), fxHN(10)]}
 ]},

{id:'komentowanie_drwal', t:'KOMENTOWANIE — DRWAL',
 x:'Jeden z komentatorów mówi, że nie może być tak, że skończysz karierę i nie będziesz miał co robić. Ugaduje pierwsze zawody do skomentowania. Nie musisz się na tym znać. Współkomentujesz:',
 cond:(p)=>p.age>40,
 o:[
  {l:'Mistrzostwa Świata w Byciu Drwalem',
   f:()=>['Przynajmniej tutaj piła nie ma długów…', fxP(3), fxM(3), fxHN(5), fxO(R(1,2))]},
  {l:'Mistrzostwa Europy w sambo bojowym',
   f:()=>['„PO AMBITNEJ WALCE!” — doznajesz olśnienia co do walki ciało w ciało.', fxO(R(1,2)), fxP(10), fxM(-5)]},
  {l:'Kwalifikacje olimpijskie w bierkach podwodnych elektrycznych',
   f:()=>['Doznajesz olśnienia co do czasu reakcji.', fxO(2), fxM(10), fxP(-10)]}
 ]},

{id:'reklama_krosno', t:'REKLAMA KROSNO',
 x:'Po dołączeniu do klubu, sponsor strategiczny stwierdza, że potrzebuje nowej reklamy. Potrzebuje też nowej twarzy, a Twoja okazuje się być idealna.',
 cond:(p)=>!!p.club && p.club.includes('Krosno'),
 o:[
  {l:'Imię nazwisko, polecam',
   f:()=>{ const k=R(20000,40000); return ['Reklama jest grana wszędzie i każdy ma jej dosyć.', fxM(-10), fxK(k)]; }},
  {l:'Czekam na lepsze oferty',
   f:()=>{ const base=R(15000,35000); const r=R(1,3);
     if(r===1) return ['Sponsor traci zainteresowanie. Żadnej kasy z tego nie będzie.'];
     if(r===2) return ['Sponsor jednak się targuje.', fxK(Math.round(base*0.5))];
     return ['Sponsor odpala kampanię w podwójnym budżecie.', fxM(10), fxK(base*2)];
   }}
 ]},

];
