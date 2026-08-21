/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: PLAYOFF
   tie(), runPhase() — play-off i play-down
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2501-2585 oryginału).
   ============================================================ */
/* ============================================================
   5b. FAZA PLAY-OFF I PLAY-DOWN
   ============================================================ */
// Dwumecz. cA = wyżej rozstawiony — gospodarz rewanżu, wygrywa przy remisie
// w dwumeczu (bieg dodatkowy). Jeśli w parze jest klub gracza, dopisujemy
// jego linię startową do obu spotkań.
function tie(stage, cA, cB, ctx, myClub){
 const g=tieGen(stage,cA,cB,ctx,myClub,false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* tieGen(stage, cA, cB, ctx, myClub, live){
 const mine = myClub && (cA.name===myClub||cB.name===myClub);
 let c = (ctx && mine && !(G.S&&G.S.cried)) ? ctx : null;
 /* --- WIELKI MECZ: pytanie przed najważniejszym dwumeczem sezonu --- */
 let ride=false;
 if(live && c){
   const dec = yield* bigMatchAsk({kind:'tie', stage,
     myClub, opp: (cA.name===myClub?cB.name:cA.name),
     lk: leagueOfClub(myClub)}, c);
   if(dec==='ride') ride=true;
   if(dec==='cry')  c=null;
 }
 let M1,M2;
 if(ride){
   M1 = yield* liveMeetingGen(cB.name, cA.name, c, c.meId, {stage, leg:1, legs:2, title:stage});
   M2 = yield* liveMeetingGen(cA.name, cB.name, c, c.meId, {stage, leg:2, legs:2, title:stage+' — REWANŻ'});
   if(!M1) M1=simMeeting(cB.name, cA.name, c, c?c.meId:null);
   if(!M2) M2=simMeeting(cA.name, cB.name, c, c?c.meId:null);
 } else {
   M1=simMeeting(cB.name, cA.name, c, c?c.meId:null);   // 1. mecz u niżej rozstawionego
   M2=simMeeting(cA.name, cB.name, c, c?c.meId:null);   // rewanż u wyżej rozstawionego
 }
 if(!M1||!M2) return {stage,a:cA.name,b:cB.name,legs:[],agA:0,agB:0,win:cA,lose:cB,winner:cA.name};
 const agA=M1.as+M2.hs, agB=M1.hs+M2.as;
 const draw = agA===agB;
 const win = agB>agA ? cB : cA, lose = agB>agA ? cA : cB;
 const legs=[{h:cB.name,aw:cA.name,hs:M1.hs,as:M1.as,me:M1.me,heats:M1.heats,box:M1.box},
             {h:cA.name,aw:cB.name,hs:M2.hs,as:M2.as,me:M2.me,heats:M2.heats,box:M2.box}];
 return {stage, a:cA.name, b:cB.name, legs, agA, agB, draw, win, lose, winner:win.name};
}
function runPhase(lk, ctx, myClub){
 const g=runPhaseGen(lk,ctx,myClub,false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* runPhaseGen(lk, ctx, myClub, live){
 const T=G.tables[lk], clubs=G.leagues[lk].clubs;
 const C=n=>clubs.find(c=>c.name===n);
 const s=i=>C(T[i].name);
 const rank=n=>T.findIndex(r=>r.name===n);
 const ord=(x,y)=> rank(x.name)<rank(y.name)?[x,y]:[y,x];   // wg rundy zasadniczej
 const ties=[], order=new Array(8);
 
 /* --- PLAY-OFF: 1-4 i 2-3, potem finał --- */
 const sf1=yield* tieGen('PÓŁFINAŁ', s(0), s(3), ctx, myClub, live);
 const sf2=yield* tieGen('PÓŁFINAŁ', s(1), s(2), ctx, myClub, live);
 ties.push(sf1,sf2);
 const [fa,fb]=ord(sf1.win,sf2.win);
 const fin=yield* tieGen('FINAŁ', fa, fb, ctx, myClub, live); ties.push(fin);
 order[0]=fin.winner; order[1]=fin.lose.name;
 const [ta,tb]=ord(sf1.lose,sf2.lose);
 if(lk==='EL'){                                  // mecz o 3. miejsce tylko w Ekstralidze
   const t3=yield* tieGen('MECZ O 3. MIEJSCE', ta, tb, ctx, myClub, live); ties.push(t3);
   order[2]=t3.winner; order[3]=t3.lose.name;
 } else { order[2]=ta.name; order[3]=tb.name; }
 
 /* --- PLAY-DOWN: 5-8 i 6-7, przegrani o utrzymanie (nie ma w KLŻ) --- */
 if(lk==='EL'||lk==='E2'){
   const pd1=yield* tieGen('PLAY-DOWN', s(4), s(7), ctx, myClub, live);
   const pd2=yield* tieGen('PLAY-DOWN', s(5), s(6), ctx, myClub, live);
   ties.push(pd1,pd2);
   const [w1,w2]=ord(pd1.win,pd2.win);
   order[4]=w1.name; order[5]=w2.name;
   const [l1,l2]=ord(pd1.lose,pd2.lose);
   const rel=yield* tieGen('DWUMECZ O UTRZYMANIE', l1, l2, ctx, myClub, live); ties.push(rel);
   order[6]=rel.winner;      // ratuje się, ale jedzie baraż
   order[7]=rel.lose.name;   // spada bezpośrednio
 } else {
   order[4]=T[4].name; order[5]=T[5].name; order[6]=T[6].name; order[7]=T[7].name;
 }
 G.phase[lk]={ties, order};
 return G.phase[lk];
}
