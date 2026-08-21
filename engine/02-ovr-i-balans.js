/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: OVR I BALANS
   Anty-klon OVR, skala 1:1, punkt odniesienia ligi
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 132-203 oryginału).
   ============================================================ */
/* ============================================================
   ANTY-KLON: OVR W OBRĘBIE JEDNEJ DRUŻYNY MUSI SIĘ RÓŻNIĆ
   Skąd brały się identyczne OVR? Z trzech miejsc naraz:
     · pięciu zawodników pierwszej piątki losowano z JEDNEGO rozkładu
       gauss(L-1, 4.2), a wynik obcinano do 99 — w klubie o OVR 93-95
       kilku z nich lądowało dokładnie na suficie,
     · genAllSquads() dostrajało kadrę, dodając WSZYSTKIM tę samą liczbę,
     · applySquadOvr() i korekta driftu w ageRiders() robiły to samo po sezonie.
   Zaokrąglenie do liczby całkowitej dokańczało dzieła. Ten przebieg
   rozsuwa kolizje o 1 pkt (najpierw w dół, potem w górę), zachowując
   kolejność siły w drużynie. Gracza (r.me) nigdy nie ruszamy.
   ============================================================ */
function dedupeSquadOvr(name){
 const all=squadOf(name);
 if(all.length<2) return;
 const taken=new Set(all.filter(r=>r.me).map(r=>cl(Math.round(r.ovr),1,99)));
 all.filter(r=>!r.me).sort((a,b)=>b.ovr-a.ovr).forEach(r=>{
   let v=cl(Math.round(r.ovr),1,99);
   if(!taken.has(v)){ taken.add(v); r.ovr=v; return; }
   let nv=null;
   for(let d=1; d<=14 && nv===null; d++){
     if(v-d>=1  && !taken.has(v-d)) nv=v-d;
     else if(v+d<=99 && !taken.has(v+d)) nv=v+d;
   }
   r.ovr = nv===null ? v : nv;
   taken.add(r.ovr);
 });
}
function dedupeAllSquads(){ allClubs().forEach(c=>{ dedupeSquadOvr(c.name); }); }
 
/* ============================================================
   BALANS SILNIKA — SKALA 1:1
   OVR zawodnika i OVR klubu leżą na tej samej skali. Klub 95 to klub,
   w którym pierwsza piątka kręci się w okolicach 95. Punktem odniesienia
   w każdym biegu jest średnia liga/klub — kto jest pod nią, dostaje
   po łapach mocniej, niż wynikałoby to z samej różnicy OVR.
   ============================================================ */
/* Efektywna siła w biegu: ostra kara za bycie poniżej średniej. */
function rideStr(ovr, ref, extra){
 let d = ovr - ref;
 if(d<0){
   // pierwsze punkty poniżej średniej bolą najbardziej, dalej kara robi się liniowa
   const a=Math.min(-d, BAL.knee), b=Math.max(0,-d-BAL.knee);
   d = -(a*BAL.belowPen + b*BAL.farPen);
 } else d = d*BAL.abovePow;
 return ref + d + (extra||0) + gauss(0,BAL.sigma);
}
function leagueOfClub(name){ return LKEYS.find(k=>G.leagues[k].clubs.some(c=>c.name===name)) || 'KL'; }
function clubByName(name){ for(const k of LKEYS){const c=G.leagues[k].clubs.find(x=>x.name===name); if(c) return c;} return null; }
/* Klub, który NIE wywalczył awansu do fazy play-off (miejsca 1-4 rundy
   zasadniczej). Używane przez TURNIEJE SZKOLENIOWE (simIndividual) — start
   mają tam wyłącznie juniorzy klubów spoza czołowej czwórki, zgodnie
   z regulaminem ("kluby, które nie uzyskały prawa awansu"). Bez klubu albo
   bez jeszcze policzonej tabeli traktujemy to permisywnie jako "nie awansował". */
function clubMissedPlayoffs(name){
 if(!name) return true;
 const lk=leagueOfClub(name), tab=G.tables[lk];
 if(!tab || !tab.length) return true;
 const pos=tab.findIndex(x=>x.name===name)+1;
 return pos<=0 || pos>4;
}
/* Punkt odniesienia dla zawodnika danego klubu: średnia ligi + poziom klubu. */
function refFor(clubName){
 const k=leagueOfClub(clubName), c=clubByName(clubName);
 const lg=leagueAvgOvr(k);
 return lg*BAL.leagueW + (c?c.ovr:lg)*(1-BAL.leagueW) - BAL.refDrop;
}
 
/* ---------- KLASY POSTACI ---------- */
 
 
/* ---------- STAN GRY ---------- */
