/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: UPADLOSCI AWANSE
   Syndyk, zielony stolik, awanse i spadki
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 3923-4029 oryginału).
   ============================================================ */
/* ============================================================
   6a. UPADŁOŚCI KLUBÓW — EGZEKUCJA
   Klub oznaczony flagą `bankrupt` w clubEconomy() przestaje istnieć
   w dotychczasowej formie: zostaje z niego miasto, nowy szyld,
   OVR 40, 100 tys. na koncie i czysta karta długów. Ląduje na końcu
   tabeli najniższej ligi. Wierzyciele (w tym Gracz) obchodzą się smakiem.
   ============================================================ */
const BK_PREFIX=['ŻKS ','TŻ ','KS ','Speedway ','KŻ '];
function executeBankruptcies(){
 const done=[];
 LKEYS.forEach(k=>{
  G.leagues[k].clubs.slice().forEach(c=>{
   if(!c.bankrupt) return;
   const old=c.name;
   const city=String(old).trim().split(/\s+/).pop();           // samo miasto: ostatnie słowo
   let nn=pick(BK_PREFIX)+city, g=2;
   while(allClubs().some(x=>x!==c && x.name===nn)) nn=pick(BK_PREFIX)+city+' '+(g++);
   /* SPONSORZY TYTULARNI IDĄ W ŚLAD ZA PIECZĄTKĄ: nowy byt prawny wchodzi
      do KLŻ bez ani jednego sponsora w nazwie i bez kary OVR za bycie słupem.
      Sponsorzy z Grupy A po prostu odchodzą (nie trafiają na czarną listę
      — nie oni okradli klub). */
   clubTitles(c).length=0;
   c.base=nn; c.pendingName=nn;
   // nowy byt prawny
   c.name=nn; c.ovr=40; c.budget=100000; c.debt=0;
   c.seasonCost=null; c.seasonIncome=null; c.incRound=null; c.costRound=null;
   c.arr=0; c.mood=R(20,50); c.bankrupt=false;
   // kadra: gwiazdy poszły w clubEconomy, reszta (i Gracz) przechodzi na nowy szyld
   G.riders.forEach(r=>{ if(r.club===old) r.club=nn; });
   if(G.p && G.p.club===old) G.p.club=nn;
   // z powrotem na dno: usuń z obecnej ligi, dopisz na koniec najniższej
   const arr=G.leagues[k].clubs, i=arr.indexOf(c);
   if(i>=0) arr.splice(i,1);
   G.leagues.KL.clubs.push(c);
   done.push({old, now:nn, city, from:k, why:c.bankruptWhy||'Finanse.'});
   c.bankruptWhy=null;
  });
 });
 return done;
}
/* ZIELONY STOLIK — po upadłościach trzeba odtworzyć obsadę lig od góry.
   Ekstraliga uzupełnia się najlepszą drużyną z 2. Ekstraligi,
   2. Ekstraliga — najlepszą z Krajowej Ligi. */
function greenTable(green){
 const moved=[];
 // kilka przebiegów, bo wakat w Ekstralidze otwiera wakat w 2. EL, a ten w KLŻ
 for(let pass=0; pass<3; pass++){
  [['EL','E2'],['E2','KL']].forEach(([hi,lo])=>{
   let guard=0;
   while(G.leagues[hi].clubs.length<8 && G.leagues[lo].clubs.length>0 && guard++<16){
    const best=G.leagues[lo].clubs.slice().sort((a,b)=>b.ovr-a.ovr)[0];
    if(!best) break;
    const arr=G.leagues[lo].clubs; arr.splice(arr.indexOf(best),1);
    G.leagues[hi].clubs.push(best);
    green.add(best.name);
    moved.push({club:best.name, from:lo, to:hi});
   }
  });
 }
 return moved;
}
function promotionsRelegations(){
 const out=[]; const pf=[];
 /* --- NAJPIERW SYNDYCY, POTEM DOPIERO SPORT --- */
 const bankrupts = executeBankruptcies();
 const green = new Set();
 const greenMoves = bankrupts.length ? greenTable(green) : [];
 G.bankrupts = bankrupts; G.greenTable = greenMoves;
 /* Tabele końcowe po korektach: bez upadłych, z wakatami załatanymi przez zielony stolik. */
 const ORD={};
 LKEYS.forEach(k=>{ ORD[k]=(((G.phase[k]&&G.phase[k].order)||[])
   .filter(n=>n && G.leagues[k].clubs.some(c=>c.name===n))); });
 const pairs=[['EL','E2'],['E2','KL']];
 pairs.forEach(([hi,lo])=>{
  // kluby wciągnięte zielonym stolikiem nie spadają i nie awansują w tym samym roku
  const Th=ORD[hi].filter(n=>!green.has(n)), Tl=ORD[lo].filter(n=>!green.has(n));
  if(Th.length<2||Tl.length<2) return;
  const cH=n=>G.leagues[hi].clubs.find(c=>c.name===n);
  const cL=n=>G.leagues[lo].clubs.find(c=>c.name===n);
  // bezpośrednie: 8. po play-downie spada, mistrz play-offów niższej ligi awansuje
  const down=cH(Th[Th.length-1]), up=cL(Tl[0]);
  if(!down||!up) return;
  out.push({type:'spadek', club:down.name, from:hi, to:lo});
  out.push({type:'awans',  club:up.name,   from:lo, to:hi});
  // baraż: 7. wyższej ligi (ocalały z dwumeczu o utrzymanie) vs wicemistrz niższej
  const b7=cH(Th[Th.length-2]), l2=cL(Tl[1]);
  if(!b7||!l2) return;
  const tl=twoLeg(b7,l2);
  pf.push({hi,lo,a:b7.name,b:l2.name,...tl, winner:tl.win.name});
  let extraDown=null, extraUp=null;
  if(tl.win.name===l2.name){extraDown=b7;extraUp=l2;
    out.push({type:'spadek(baraż)',club:b7.name,from:hi,to:lo});
    out.push({type:'awans(baraż)', club:l2.name,from:lo,to:hi});}
  // przenosiny
  const move=(club,from,to)=>{const arr=G.leagues[from].clubs;const i=arr.indexOf(club);if(i>=0){arr.splice(i,1);G.leagues[to].clubs.push(club);} };
  move(down,hi,lo); move(up,lo,hi);
  if(extraDown){move(extraDown,hi,lo);move(extraUp,lo,hi);}
 });
 // korekty OVR po zmianie ligi (świeży bankrut zostaje na twardym 40)
 const fresh=new Set(bankrupts.map(b=>b.now));
 LKEYS.forEach(k=>{G.leagues[k].clubs.forEach(c=>{ if(fresh.has(c.name)) return;
   c.ovr=cl(Math.round(c.ovr+R(-2,2)),20,99);});});
 // gracz podąża za klubem
 LKEYS.forEach(k=>{ if(G.leagues[k].clubs.some(c=>c.name===G.p.club)) G.p.lk=k; });
 G.playoff=pf; G.promo=out;
}
