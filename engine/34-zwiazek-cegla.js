/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: ZWIĄZEK ZAWODOWY (SZZZ) I CEGIELSKI
   ------------------------------------------------------------
   NOWY MODUŁ. Wpina się do gry BEZ zmian w istniejących plikach —
   wszystko, co potrzebne, robi przez opakowanie (wrapper) już
   istniejących funkcji. Dzięki temu stare zapisy i stare pliki
   działają dalej, a jak ktoś wgra sam ten plik, to najgorsze,
   co się stanie, to brak nowych zdarzeń w puli.

   Co ten plik daje:
     1. FLAGI: p.hasSZZZ (szef związku) i p.ceglaLvl (poziom Cegielskiego,
        BEZ SUFITU) — dokładane do newPlayer() i dosypywane leniwie
        do zapisów sprzed patcha.
     2. RYCZAŁT SZEFA ZWIĄZKU: +50 000 zł na starcie KAŻDEGO sezonu,
        z wpisem do G.szzzLog i rubryką w podsumowaniu (ui/23).
     3. KSM PO WYROKU UOKiK: G.ksmMul — globalny mnożnik stawek za punkt,
        który wchodzi do KAŻDEJ przyszłej oferty (offerRate), a nie tylko
        do bieżącego kontraktu.
     4. forceClub='rival': rywal z TEJ SAMEJ ligi. makeOffers() zna tylko
        'weak'/'weak_medium'/'any'/'current'/nazwę klubu, więc tłumaczymy
        'rival' na konkretną nazwę tuż przed wejściem do rynku.
     5. ZIMOWE HELPERY, których nie było: fxMech, fxDefN, fxTN.
   ============================================================ */

/* --- fxMech: MECHANIK. W data/06 nie ma helpera na p.mech, a nowe
   zdarzenia ruszają nim regularnie (obchód toru, strajki, warsztat). --- */
var fxMech = d => { G.p.mech = cl(G.p.mech+d, 0, 99); return (d>0?'+':'')+d+' Mechanik'; };

/* --- ZIMOWE ODPOWIEDNIKI fxDef I fxT ---
   Zimą nie ma obiektu sezonu (patrz komentarz w MODULY.md), więc efekt
   trzeba odłożyć na p.next i skonsumować przy starcie kolejnego sezonu. */
var fxDefN = d => { G.p.next.defPP  = (G.p.next.defPP||0)+d;
                    return (d>0?'+':'')+d+' p.p. szansy na defekt w kolejnym sezonie'; };
var fxTN   = d => { G.p.next.teamOvr= (G.p.next.teamOvr||0)+d;
                    return (d>0?'+':'')+d+' OVR drużyny w kolejnym sezonie'; };

/* --- LENIWA MIGRACJA STARYCH ZAPISÓW ---
   Kariera zaczęta przed tym patchem nie ma pól hasSZZZ/ceglaLvl.
   Wszystkie warunki i tak czytają je przez (p.ceglaLvl||0), ale UI woli
   mieć liczbę, a nie undefined. */
function szzzEnsure(p){
 p = p || (typeof G!=='undefined' && G ? G.p : null);
 if(!p) return null;
 if(p.hasSZZZ  === undefined) p.hasSZZZ  = false;
 if(p.ceglaLvl === undefined) p.ceglaLvl = 0;
 return p;
}
/* Poziom Cegielskiego BEZ SUFITU — świadomie. Kto chce włazić w dupę
   telewizji przez piętnaście sezonów, ten niech ma lvl 15. */
function ceglaUp(p, n){
 p = szzzEnsure(p);
 if(!p) return 0;
 p.ceglaLvl = (p.ceglaLvl||0) + (n||1);
 return p.ceglaLvl;
}
/* Nazwa opisowa Cegły — do paska zawodnika i podsumowania. */
const CEGLA_TIER = ['—','Podlizywacz','Cegielski','Betoniarz','Fundament centrali'];
function ceglaName(lvl){
 lvl = lvl||0;
 return lvl<=0 ? '—' : (CEGLA_TIER[lvl] || 'Fundament centrali (lvl '+lvl+')');
}

/* --- KTO JEST TWOIM RYWALEM W LIDZE ---
   „Dobra wylotówka z miasta" prowadzi do klubu z TEJ SAMEJ ligi.
   Bez klubu (albo gdy liga ma jeden zespół) oddajemy null, a wtedy
   makeOffers dostanie 'any' i po prostu wylosuje cokolwiek. */
function szzzRivalClub(p){
 p = p || G.p;
 try{
  const lk = p.lk || pick(LKEYS);
  const bag = G.leagues[lk].clubs.filter(c=>c.name!==p.club && !c.bankrupt);
  if(!bag.length) return null;
  /* „w twojej okolicy" — bierzemy klub o zbliżonym poziomie, żeby oferta
     rywala była realną ofertą, a nie zsyłką. */
  const near = bag.slice().sort((a,b)=>Math.abs(a.ovr-p.ovr)-Math.abs(b.ovr-p.ovr)).slice(0,4);
  return pick(near.length?near:bag).name;
 }catch(_){ return null; }
}

/* ============================================================
   WRAPPERY — tu wpinamy się w istniejący silnik
   ============================================================ */

/* 1) newPlayer(): nowa kariera od razu z obiema flagami. */
if(typeof newPlayer === 'function'){
 const _newPlayer_pre = newPlayer;
 newPlayer = function(){
  const p = _newPlayer_pre.apply(this, arguments);
  p.hasSZZZ  = false;   // szef Samorządnego Związku Zawodowego Żużlowców
  p.ceglaLvl = 0;       // poziom Cegielskiego (bez sufitu)
  return p;
 };
}

/* 2) startSeason(): ryczałt związkowy + konsumpcja zimowych efektów,
      których stary silnik nie zna (defekt i OVR drużyny z p.next). */
if(typeof startSeason === 'function'){
 const _startSeason_pre = startSeason;
 startSeason = function(){
  const p = szzzEnsure(G && G.p);
  /* Odczyt PRZED wywołaniem oryginału: startSeason potrafi wyczyścić p.next. */
  const carryDef  = p ? (p.next && p.next.defPP  ? p.next.defPP  : 0) : 0;
  const carryTeam = p ? (p.next && p.next.teamOvr? p.next.teamOvr: 0) : 0;
  const out = _startSeason_pre.apply(this, arguments);
  try{
   if(p && G.S){
    if(carryDef){  G.S.extraDefP += carryDef/100; if(p.next) p.next.defPP=0; }
    if(carryTeam){ G.S.teamOvr   += carryTeam;    if(p.next) p.next.teamOvr=0; }
    /* RYCZAŁT SZEFA ZWIĄZKU — co sezon, dopóki trzymasz funkcję. */
    if(p.hasSZZZ){
      const kwota = SZZZ_PAY;
      p.budget += kwota;
      if(p.career) p.career.earned = (p.career.earned||0) + kwota;
      G.S.szzzPay = kwota;
      G.szzzLog = G.szzzLog || [];
      G.szzzLog.push({year:G.year, kwota});
    }
   }
  }catch(_){}
  return out;
 };
}
const SZZZ_PAY = 50000;   // ryczałt funkcyjny szefa SZZZ, co sezon

/* 3) offerRate(): wyrok UOKiK podnosi stawki w CAŁEJ lidze, na stałe.
      Mnożnik siedzi w G.ksmMul i wchodzi do każdej przyszłej oferty —
      także tych od klubów, z którymi nie masz nic wspólnego. */
if(typeof offerRate === 'function'){
 const _offerRate_pre = offerRate;
 offerRate = function(p, c, lk, rating, gap){
  const RT = _offerRate_pre(p, c, lk, rating, gap);
  const m = (G && G.ksmMul) ? G.ksmMul : 1;
  if(m && m !== 1){
   RT.rate = Math.max(120, Math.round(RT.rate * m));
   (RT.parts = RT.parts || []).push({
     w:'po wyroku UOKiK w sprawie maksymalnych stawek — rynek płacowy poszedł w górę',
     v:'×'+m.toFixed(2)});
  }
  return RT;
 };
}

/* 4) makeOffers(): tłumaczenie forceClub='rival' na konkretną nazwę klubu. */
if(typeof makeOffers === 'function'){
 const _makeOffers_pre = makeOffers;
 makeOffers = function(){
  try{
   const p = G && G.p;
   if(p && p.next && p.next.forceClub === 'rival'){
     p.next.forceClub = szzzRivalClub(p) || 'any';
   }
  }catch(_){}
  return _makeOffers_pre.apply(this, arguments);
 };
}
