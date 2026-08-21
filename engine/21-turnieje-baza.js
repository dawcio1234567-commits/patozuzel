/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: TURNIEJE BAZA
   Statystyki lig + wspólna mechanika turnieju (meeting20, heatDraw)
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 3014-3167 oryginału).
   ============================================================ */
/* ============================================================
   STATYSTYKI INDYWIDUALNE LIG
   ------------------------------------------------------------
   Zgłoszenie gracza: „dodaj statystyki indywidualne dla każdej z lig".
   Zdjęcie robione jest PO RUNDZIE ZASADNICZEJ (przed play-offem), żeby
   klasyfikacja była porównywalna dla wszystkich — do play-offu wchodzi
   przecież tylko połowa stawki.
   ŚREDNIA LICZY PUNKTY BONUSOWE (druga prośba z tego samego zgłoszenia):
   bonus to punkt zdobyty na torze dla drużyny, więc wchodzi do średniej
   biegopunktowej, a nie tylko do portfela.
   Kategorie: juniorzy (U21) i seniorzy klasyfikowani są ODDZIELNIE —
   16-latek nie ściga się w tabeli z 30-letnim liderem Ekstraligi.
   ============================================================ */
function buildLeagueStats(){
 const out={};
 const MIN=(typeof GRADE!=='undefined' && GRADE.indRankMin) ? GRADE.indRankMin : 12;
 LKEYS.forEach(k=>{
   const rows=[];
   G.leagues[k].clubs.forEach(c=>squadOf(c.name).forEach(r=>{
     const s=r.sea||blankSea();
     if(!s.starts) return;
     rows.push({id:r.id, name:r.name, club:c.name, age:r.age, jun:isJun(r),
       m:s.m, starts:s.starts, pts:s.pts, bon:s.bon, def:s.def, exc:s.exc, rep:s.rep,
       avg:(s.pts+s.bon)/Math.max(1,s.starts), qual:s.starts>=MIN, me:!!r.me});
   }));
   const byAvg=(a,b)=> (b.qual?1:0)-(a.qual?1:0) || b.avg-a.avg || b.pts-a.pts;
   rows.sort(byAvg);
   rows.forEach((x,i)=>{ x.pos=i+1; });
   ['jun','sen'].forEach(cat=>{
     const sub=rows.filter(x=> cat==='jun' ? x.jun : !x.jun);
     const q=sub.filter(x=>x.qual);
     q.forEach((x,i)=>{ x.catPos=i+1; x.catN=q.length; });
     sub.filter(x=>!x.qual).forEach(x=>{ x.catPos=null; x.catN=q.length; });
   });
   out[k]={rows, min:MIN};
 });
 return out;
}
/* Miejsce Gracza w klasyfikacji swojej ligi i swojej kategorii wiekowej. */
function myLeagueRank(stats, lk){
 const L=stats&&stats[lk]; if(!L) return null;
 const me=L.rows.find(x=>x.me); if(!me) return null;
 return {pos:me.catPos, n:me.catN, avg:me.avg, starts:me.starts, qual:me.qual,
   cat: me.jun ? 'juniorów (U21)' : 'seniorów', jun:me.jun, min:L.min, overall:me.pos, total:L.rows.length};
}

// ranking krajowy — podstawa nominacji GKSŻ
function ranking(filter){
 const me=G.riders.find(r=>r.me);
 return G.riders.filter(r=>!r.retired && (!filter||filter(r)))
   .map(r=>({...r, score:r.ovr + (r.me?(G.meForm||0):0) + (r.rankBias||0)}))
   .sort((a,b)=>b.score-a.score);
}
 
/* --- Losowanie 20 biegów dla 16 zawodników (każdy po 5 startów) --- */
function heatDraw(){
 for(let att=0;att<300;att++){
   const pool=[]; for(let i=0;i<16;i++) for(let k=0;k<5;k++) pool.push(i);
   for(let i=pool.length-1;i>0;i--){const j=R(0,i);[pool[i],pool[j]]=[pool[j],pool[i]];}
   const heats=[]; let ok=true;
   for(let h=0;h<20 && ok;h++){
     const heat=[];
     for(let s=0;s<4;s++){
       const idx=pool.findIndex(x=>!heat.includes(x));
       if(idx<0){ok=false;break;}
       heat.push(pool[idx]); pool.splice(idx,1);
     }
     if(ok) heats.push(heat);
   }
   if(ok && pool.length===0) return heats;
 }
 const heats=[]; for(let h=0;h<20;h++) heats.push([h%16,(h+1)%16,(h+2)%16,(h+3)%16]);
 return heats;
}
/* --- Jeden bieg: 4 zawodników, punkty 3/2/1/0 --- */
function oneHeat(idxs, field, meIdx, ctx){
 const ref = field.__ref !== undefined ? field.__ref
   : (field.__ref = field.reduce((a,r)=>a+r.ovr,0)/Math.max(1,field.length));
 const res=idxs.map(i=>{
   const isMe = i===meIdx;
   const dP = isMe&&ctx ? ctx.defP : 0.030;
   const eP = isMe&&ctx ? ctx.excP : 0.028;
   const rr=Math.random();
   const out = rr<dP ? 'd' : rr<dP+eP ? 'w' : null;
   return {i, out, str: rideStr(field[i].ovr, ref, 0)};
 });
 const fin=res.filter(x=>!x.out).sort((a,b)=>b.str-a.str);
 const pts={}; const place={};
 fin.forEach((x,k)=>{pts[x.i]=[3,2,1,0][k]; place[x.i]=k+1;});
 res.forEach(x=>{ if(x.out){pts[x.i]=0; place[x.i]=4;} });
 return {pts, place, res};
}
/* --- Turniej wg tabeli 20-biegowej --- */
function meeting20(field, meIdx, ctx){
 const draw=heatDraw();
 const T=field.map((r,i)=>({i, id:r.id, name:r.name, age:r.age, me:i===meIdx,
   pts:0, codes:[], places:[0,0,0,0,0]}));
 draw.forEach(h=>{
   const H=oneHeat(h, field, meIdx, ctx);
   h.forEach(i=>{
     const t=T[i], o=H.res.find(x=>x.i===i);
     t.pts+=H.pts[i];
     /* ZERO PUNKTÓW TO „0", A NIE „-".
        W polskiej notacji kreska w rubryce biegu oznacza, że zawodnik w tym
        biegu NIE STARTOWAŁ (w lidze: został zdjęty przez rezerwę taktyczną —
        patrz simMeeting). Turniej indywidualny jedzie się według tabeli
        20-biegowej: każdy z szesnastki ma pięć swoich startów i nikt go w nich
        nie zastępuje. Wpisywanie „-" za przejechany bieg bez punktu wyglądało
        więc tak, jakby gracza w kółko ktoś zmieniał, a do tego kod „-" jest
        w reszcie gry liczony jako NIEODBYTY start. */
     if(o.out) t.codes.push(o.out); else t.codes.push(String(H.pts[i]));
     if(!o.out) t.places[H.place[i]]++;
   });
 });
 // art. 638: równe punkty → więcej pierwszych, potem drugich, trzecich, czwartych
 T.sort((a,b)=> b.pts-a.pts || b.places[1]-a.places[1] || b.places[2]-a.places[2]
   || b.places[3]-a.places[3] || b.places[4]-a.places[4] || (Math.random()-0.5));
 return T;
}
/* --- Turniej finałowy IMP: turniej główny + półfinał + finał (art. 634) --- */
function impFinalRound(field, meIdx, ctx){
 const T=meeting20(field, meIdx, ctx);
 const sfIdx=[2,3,4,5].map(k=>T[k].i);                       // miejsca 3-6
 const semi=oneHeat(sfIdx, field, meIdx, ctx);
 const semiOrder=sfIdx.slice().sort((a,b)=>semi.place[a]-semi.place[b]);
 const finIdx=[T[0].i, T[1].i, semiOrder[0], semiOrder[1]];
 const fin=oneHeat(finIdx, field, meIdx, ctx);
 const finOrder=finIdx.slice().sort((a,b)=>fin.place[a]-fin.place[b]);
 // klasyfikacja turnieju (art. 634 ust. 9)
 const cls=[...finOrder, semiOrder[2], semiOrder[3],
   ...T.slice(2).map(t=>t.i).filter(i=>!finIdx.includes(i)&&!semiOrder.slice(2).includes(i))];
 // punkty do klasyfikacji IMP: turniej główny + bieg finałowy, BEZ półfinału (art. 634a)
 const score={}; T.forEach(t=>score[t.i]=t.pts);
 finIdx.forEach(i=>score[i]+=fin.pts[i]);
 const meRow = meIdx>=0 ? T.find(t=>t.i===meIdx) : null;
 let meCodes = meRow? meRow.codes.slice() : [];
 let meSemi=null, meFin=null;
 if(meRow){
   if(sfIdx.includes(meIdx)){ meSemi = semi.res.find(x=>x.i===meIdx).out || String(semi.place[meIdx])+'m'; }
   if(finIdx.includes(meIdx)){ const o=fin.res.find(x=>x.i===meIdx);
     // jak wyżej: bieg finałowy bez punktu to „F:0", nie „F:-"
     meFin = o.out || String(fin.pts[meIdx]); meCodes.push('F:'+(o.out||String(fin.pts[meIdx]))); }
 }
 return {T, cls, score, semiOrder, finOrder, meCodes, meSemi, meFin,
   mePts: meRow? score[meIdx] : 0, mainPts: meRow? meRow.pts : 0};
}
 
/* --- Pojedyncze zawody: pomocnik budujący opis do UI --- */
function roundInfo(title, T, meIdx){
 const me=T.find(t=>t.me);
 return {title, rows:T.map((t,i)=>({pos:i+1,name:t.name,pts:t.pts,me:t.me,codes:t.codes})),
   me: me? {pts:me.pts, codes:me.codes, pos:T.indexOf(me)+1} : null};
}
