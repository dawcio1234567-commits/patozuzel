/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: SWIAT
   Zawodnicy zagraniczni, worldInit, worldRanking
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2906-3013 oryginału).
   ============================================================ */
/* ============================================================
   5e-0. ŚWIAT POZA POLSKĄ
   ------------------------------------------------------------
   Do Indywidualnych Mistrzostw Świata nie da się wystawić samych Polaków.
   Ten blok tworzy i utrzymuje przy życiu resztę żużlowego świata: Duńczyków,
   Szwedów, Anglików i całą drugą półkę (Niemcy, Finlandia, Francja, USA,
   Ukraina, Argentyna, Czechy). Zawodnicy zagraniczni starzeją się, rozwijają
   i kończą kariery tak samo jak krajowi, a na ich miejsce wchodzą nowi —
   dzięki temu cykl światowy ma ciągłość między sezonami, a nie losuje sobie
   stawki od zera co rok.
   ============================================================ */
let WID=500000;                                  // osobna pula ID, żeby nie zderzyć się z G.riders
/* Docelowa siła i liczebność poszczególnych krajów: `top` to poziom lidera
   danej federacji, `n` to liczba zawodników trzymanych w puli. */
const WORLD_TIERS = [
 {c:'DEN', top:97, n:16, step:2.3}, {c:'SWE', top:96, n:16, step:2.3}, {c:'GBR', top:93, n:16, step:2.5},
 {c:'CZE', top:82, n:10, step:3.0}, {c:'GER', top:81, n:10, step:3.0}, {c:'FIN', top:80, n:10, step:3.1},
 {c:'USA', top:79, n:10, step:3.1}, {c:'FRA', top:78, n:10, step:3.2}, {c:'ARG', top:76, n:10, step:3.2},
 {c:'UKR', top:75, n:10, step:3.3}
];
function worldName(c){
 const P=WORLD_NAMES[c]||WORLD_NAMES.GBR;
 return pick(P.f)+' '+pick(P.l);
}
function makeWorldRider(ctry, ovr, age){
 const a = age!=null ? age : R(17,34);
 const o = cl(Math.round(ovr),1,99);
 const pot = cl(Math.round(o + (a<=21?R(10,28) : a<=24?R(4,12) : R(0,3))), o, 99);
 return {id:WID++, name:worldName(ctry), ctry, age:a, ovr:o, pot, retired:false, world:true, sea:blankSea()};
}
function worldInit(){
 G.world=[];
 WORLD_TIERS.forEach(t=>{
   for(let i=0;i<t.n;i++){
     // drabinka: lider federacji na `top`, każdy kolejny niżej, z szumem
     const ovr = t.top - i*(t.step || (t.top>80?3.6:3.1)) + gauss(0,2.0);
     /* Ostatnie cztery miejsca każdej federacji to NARYBEK: bez tego zagraniczne
        kraje nie miały kogo wystawić do IMŚJ2 i cykl juniorski robił się polski. */
     const age = i<3 ? R(22,33) : (i>=t.n-4 ? R(16,20) : R(17,32));
     G.world.push(makeWorldRider(t.c, ovr, age));
   }
 });
 return G.world;
}
function worldPool(){
 if(!G.world || !G.world.length) worldInit();
 return G.world.filter(r=>!r.retired);
}
function worldAge(){
 if(!G.world || !G.world.length){ worldInit(); return; }
 G.world.forEach(r=>{
   r.age++; r.sea=blankSea();
   let g = r.age<=21?7.0 : r.age<=24?4.2 : r.age<=28?1.7 : r.age<=32?0.1 : r.age<=36?-2.6 : -5;
   if(g>0) g *= cl(((r.pot||r.ovr+6)-r.ovr)/9, 0, 1);
   r.ovr = cl(Math.round(r.ovr+g+gauss(0,1.9)),1,99);
   if(r.age>=R(33,41) && chance(26)) r.retired=true;
   if(r.age>41) r.retired=true;
 });
 G.world=G.world.filter(r=>!r.retired);
 // uzupełnienie federacji do zakładanej liczebności + korekta driftu poziomu
 WORLD_TIERS.forEach(t=>{
   const have=G.world.filter(r=>r.ctry===t.c);
   for(let i=have.length;i<t.n;i++) G.world.push(makeWorldRider(t.c, t.top-R(8,26)+gauss(0,3), R(16,20)));
   /* ------------------------------------------------------------
      PIPELINE MŁODZIEŻOWY KAŻDEJ FEDERACJI
      Bez tego zdarzało się, że całe pokolenie danego kraju kończyło kariery
      w tym samym czasie, federacja odbudowywała się samymi 20-latkami i przez
      kilka sezonów nie miała KOGO wystawić do IMŚJ2 — a wtedy limity krajowe
      nie miały czego przycinać i cykl juniorski robił się polski. Każdy kraj
      trzyma teraz minimum trzech zawodników do 21 lat; miejsce dla nich robi
      najsłabszy weteran.
      ------------------------------------------------------------ */
   const MINJUN=3;
   let jun=G.world.filter(r=>r.ctry===t.c && r.age<=21).length;
   while(jun<MINJUN){
     const pool=G.world.filter(r=>r.ctry===t.c);
     if(pool.length>=t.n){
       const old=pool.filter(r=>r.age>=29).sort((a,b)=>a.ovr-b.ovr)[0]
              || pool.slice().sort((a,b)=>a.ovr-b.ovr)[0];
       if(old) old.retired=true;
     }
     G.world.push(makeWorldRider(t.c, t.top-R(14,30)+gauss(0,3), R(16,19)));
     jun++;
   }
   G.world=G.world.filter(r=>!r.retired);
   /* Korekta driftu federacji: bez niej Szwecja czy Anglia potrafiły zapaść się
      na kilkanaście sezonów (jedno pokolenie kończy kariery naraz) i cykl robił
      się polsko-duński. Próg zaostrzony z 4 na 2 punkty, siła korekty w górę. */
   const cur=G.world.filter(r=>r.ctry===t.c).sort((a,b)=>b.ovr-a.ovr);
   const drift=t.top-(cur[0]?cur[0].ovr:t.top);
   if(Math.abs(drift)>=2) cur.forEach(r=>{ r.ovr=cl(Math.round(r.ovr+drift*0.45+gauss(0,0.8)),1,99); });
 });
}
/* Wspólny "paszport" dla obu światów: krajowi zawodnicy siedzą w G.riders
   (bez pola ctry, więc domyślnie POL), zagraniczni w G.world. */
const ctryOf = r => (r && r.ctry) ? r.ctry : 'POL';
const ctryName = c => WORLD_CTRY[c] || c;
/* Wiersz startowy do tabeli 20-biegowej (meeting20 czyta id/name/age/ovr). */
const worldRow = r => ({id:r.id, name:r.name, age:r.age, ovr:r.ovr, ctry:ctryOf(r)});
/* Ranking światowy: Polacy z G.riders + reszta świata, jedna lista.
   `bonus` gracza (G.meForm) doliczany tak samo jak w ranking() krajowym. */
function worldRanking(filter){
 const pol=G.riders.filter(r=>!r.retired && (!filter||filter(r)))
   .map(r=>({...r, ctry:'POL', score:r.ovr + (r.me?(G.meForm||0):0) + (r.rankBias||0)}));
 const wor=worldPool().filter(r=>!filter||filter(r)).map(r=>({...r, score:r.ovr}));
 return pol.concat(wor).sort((a,b)=>b.score-a.score);
}
