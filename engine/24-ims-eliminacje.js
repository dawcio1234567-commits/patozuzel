/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: IMS ELIMINACJE
   Eliminacje krajowe, SGP Challenge, Mistrzostwa Europy
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 3693-3922 oryginału).
   ============================================================ */
function simWorldQualifiers(p, ctx, zkTop4, inGp){
 const g=simWorldQualifiersGen(p, ctx, zkTop4, inGp, false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* simWorldQualifiersGen(p, ctx, zkTop4, inGp, live){
 const ex=new Set(inGp||[]);
 const meR=G.riders.find(r=>r.me);
 const meId = meR? meR.id : null;
 const quals=[]; const field=[];
 /* --- POLSKA: cztery pierwsze miejsca Złotego Kasku --- */
 const pol=[];
 (zkTop4||[]).forEach(x=>{ const r=G.riders.find(y=>y.id===x.id && !y.retired); if(r && !ex.has(r.id)) pol.push(r); });
 if(pol.length<SGP.qual.POL){
   ranking().filter(r=>!ex.has(r.id)).forEach(r=>{ if(pol.length<SGP.qual.POL && !pol.some(x=>x.id===r.id)) pol.push(r); });
 }
 pol.slice(0,SGP.qual.POL).forEach(r=>field.push(worldRow(r)));
 quals.push({title:'ELIMINACJE KRAJOWE — POLSKA', note:'kwalifikują się zdobywcy czterech pierwszych miejsc ZŁOTEGO KASKU',
   table: pol.slice(0,SGP.qual.POL).map((r,i)=>({pos:i+1, name:r.name, ctry:'POL', pts:null, me:!!r.me, through:true}))});
 /* --- ANGLIA / SZWECJA / DANIA: osobne eliminacje --- */
 [['GBR','ANGLIA'],['SWE','SZWECJA'],['DEN','DANIA']].forEach(([c,label])=>{
   const q=natQual([c], SGP.qual[c], 'ELIMINACJE KRAJOWE — '+label, null, null, ex);
   q.through.forEach(r=>{ if(r) field.push(r); });
   quals.push({title:q.title, note:'awans: '+SGP.qual[c]+' pierwsze miejsca', table:q.table});
 });
 /* --- WSPÓLNE ELIMINACJE RESZTY ŚWIATA --- */
 {
  const q=natQual(SGP.restCtry, SGP.qual.REST, 'ELIMINACJE WSPÓLNE — POZOSTAŁE KRAJE', null, null, ex);
  q.through.forEach(r=>{ if(r) field.push(r); });
  quals.push({title:q.title, note:'Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy — razem, awans: '+SGP.qual.REST,
    table:q.table});
 }
 /* --- CHALLENGE — 16 zawodników, tabela 20-biegowa, awans do cyklu dla TOP4 --- */
 let rows=field.slice(0,16);
 rows=padField(rows,'CZE',16, rows.length?rows[rows.length-1].ovr:50);
 const mi = meId!=null ? rows.findIndex(r=>r.id===meId) : -1;
 let T=null, chLive=false;
 /* SGP CHALLENGE — czterech pierwszych jedzie w przyszłym roku w Grand Prix.
    Dla zawodnika spoza cyklu to najważniejszy turniej sezonu i tak jest
    traktowany przez tryb WIELKIEGO MECZU. */
 if(live && mi>=0){
   const dec = yield* bigMatchAsk({kind:'ind', stage:'SGP CHALLENGE',
     title:'SGP CHALLENGE — OSTATNIA RUNDA ELIMINACJI'}, null);
   if(dec==='ride'){
     const lv=liveNewState();
     T = yield* liveInd20Gen(rows, mi, ctx, lv,
       {title:'SGP CHALLENGE', stage:'SGP CHALLENGE', sub:'16 zawodników · tabela 20-biegowa · TOP 4 wchodzi do cyklu'});
     chLive=true; liveWrapUp(lv, 'SGP CHALLENGE');
   }
 }
 if(!T) T=meeting20(rows, mi, mi>=0?ctx:null);
 const chTable=T.map((t,i)=>({pos:i+1, name:t.name, ctry:(rows.find(r=>r.id===t.id)||{}).ctry||'POL',
   pts:t.pts, me:t.me, codes:t.codes}));
 let money=0;
 if(mi>=0){
   const pos=T.findIndex(t=>t.me)+1;
   money=Math.round((SGP.chPrize[pos-1]||SGP.chPrize[SGP.chPrize.length-1])+SGP.chStartFee);
 }
 return {quals, challenge:{title:'SGP CHALLENGE — OSTATNIA RUNDA ELIMINACJI'+(chLive?' · PRZEJECHANY OSOBIŚCIE':''), table:chTable, rode:mi>=0, live:chLive,
   mePos: mi>=0 ? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0 ? T.find(t=>t.me).pts : 0, money},
   order:T.map(t=>rows.find(r=>r.id===t.id)).filter(Boolean)};
}
/* --- MISTRZOSTWA EUROPY: zwycięzca ma miejsce w cyklu na kolejny rok --- */
function simSEC(ctx, inGp){
 const ex=new Set(inGp||[]);
 const EU=['POL','GBR','SWE','DEN','GER','FIN','FRA','UKR','CZE','LAT','SVK'];
 const meR=G.riders.find(r=>r.me);
 const cand=worldRanking(r=>EU.includes(ctryOf(r))).filter(r=>!ex.has(r.id));
 /* Mistrzostwa Europy to też turniej międzynarodowy, a nie polski finał
    z zaproszonymi gośćmi — obsada 16 miejsc z limitem na federację. */
 let rows=capPick(cand, SGP.secNatCap, SGP.secNatDef, 16).map(worldRow);
 rows=padField(rows,'GER',16, rows.length?rows[rows.length-1].ovr:55);
 const mi = meR ? rows.findIndex(r=>r.id===meR.id) : -1;
 const T=meeting20(rows, mi, mi>=0?ctx:null);
 const win=rows.find(r=>r.id===T[0].id);
 let money=0;
 if(mi>=0){ const pos=T.findIndex(t=>t.me)+1; money=Math.round(SGP.secPrize[pos-1]||SGP.secPrize[SGP.secPrize.length-1]); }
 return {title:'INDYWIDUALNE MISTRZOSTWA EUROPY', rode:mi>=0,
   table:T.map((t,i)=>({pos:i+1, name:t.name, ctry:(rows.find(r=>r.id===t.id)||{}).ctry||'POL', pts:t.pts, me:t.me})),
   winner:win, mePos: mi>=0 ? T.findIndex(t=>t.me)+1 : 0, money};
}

/* ------------------------------------------------------------
   CAŁY SEZON ŚWIATOWY — WOŁANY Z resolveSeason()
   ------------------------------------------------------------ */
function simWorldSeason(p, effOvr, defP, excP, zkTop4){
 const g=simWorldSeasonGen(p, effOvr, defP, excP, zkTop4, false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* simWorldSeasonGen(p, effOvr, defP, excP, zkTop4, live, skTop4){
 const meR=G.riders.find(r=>r.me);
 if(meR){ meR.ovr=cl(Math.round(effOvr),1,99); meR.name=p.name; meR.age=p.age; }
 const ctx={defP, excP};
 ensureSgpSeed();
 /* --- IMŚ: cykl seniorski --- */
 const perm=sgpLineup();
 const inGp=perm.map(x=>x.r.id);
 /* Pula dzikich kart rundy: najlepsi spoza stawki, ale z limitem 3 na federację —
    inaczej lista byłaby w całości polska i rotacja gospodarzy nic by nie dała.
    Gracz dopisywany jest osobno, żeby dzika karta rundy była dla niego realną
    drogą do Grand Prix, nawet gdy limit jego federacji jest już wypełniony. */
 const wildRank=worldRanking(r=>!isJun(r)).filter(r=>!inGp.includes(r.id));
 let wildPool=capPick(wildRank, {POL:4, DEN:3, SWE:3, GBR:3}, 3, 30);
 if(meR && !inGp.includes(meR.id) && !wildPool.some(r=>r.id===meR.id)){
   const meRow=wildRank.find(r=>r.id===meR.id);
   if(meRow && wildRank.indexOf(meRow)<40) wildPool.push(meRow);
 }
 const ims=yield* runGpSeriesGen({
   name:'INDYWIDUALNE MISTRZOSTWA ŚWIATA', live, bigStage:'GRAND PRIX',
   sub:'16 zawodników · 20 biegów + LCQ1, LCQ2 i finał (23 biegi) · '+SGP.rounds+' rund w cyklu',
   perm, rounds:SGP.rounds, meId: meR?meR.id:null, ctx, hosts:SGP.hosts,
   prize:SGP.prize, series:SGP.series, startFee:SGP.startFee, wildPool});
 ims.lineup=perm.map(x=>({name:x.r.name, ctry:ctryOf(x.r), how:x.how}));
 /* --- IMŚJ2: cykl juniorski, trzy rundy ---
    Skład NIE jest już zwykłym rankingiem OVR: idzie przez kwalifikację
    z poprzedniego cyklu, SGP2 Challenge i dzikie karty (patrz sgpJLineup). */
 const jPool=worldRanking(isJun);
 ensureSgpJSeed();
 let jPerm=sgpJLineup();
 if(jPerm.length<15){                      // awaryjnie: za wąska pula juniorów na świecie
   const have=new Set(jPerm.map(x=>x.r.id));
   jPerm=jPerm.concat(jPool.filter(r=>!have.has(r.id)).slice(0,15-jPerm.length)
     .map(r=>({r, how:'nominacja Komisji — brak pełnej obsady eliminacji', ctry:ctryOf(r)})));
 }
 const jIds=jPerm.map(x=>x.r.id);
 const imsj = jPerm.length>=15 ? yield* runGpSeriesGen({
   name:'INDYWIDUALNE MISTRZOSTWA ŚWIATA JUNIORÓW', live, bigStage:'IMŚJ2',
   sub:'cykl IMŚJ2 · wyłącznie zawodnicy do 21 lat · tylko '+SGP.roundsJun+' rundy · format 23-biegowy',
   perm:jPerm, rounds:SGP.roundsJun, meId:(meR && isJun(p))?meR.id:null, ctx,
   prize:SGP.prize.map(v=>Math.round(v*SGP.junPrizeMul)),
   series:SGP.series.map(v=>Math.round(v*SGP.junSeriesMul)),
   startFee:Math.round(SGP.startFee*SGP.junPrizeMul), hosts:SGP.hostsJun,
   wildPool:capPick(jPool.filter(r=>!jIds.includes(r.id)), {POL:4}, 3, 24), jun:true}) : null;
 if(imsj) imsj.lineup=jPerm.map(x=>({name:x.r.name, ctry:ctryOf(x.r), how:x.how}));
 /* --- ELIMINACJE, CHALLENGE, MISTRZOSTWA EUROPY --- */
 const Q=yield* simWorldQualifiersGen(p, ctx, zkTop4, inGp, live);
 const sec=simSEC(ctx, inGp);
 /* --- ELIMINACJE I SGP2 CHALLENGE (droga do cyklu juniorskiego) --- */
 const QJ = yield* simJunQualifiersGen(p, ctx, skTop4, jIds, live);
 /* --- STAN NA KOLEJNY SEZON --- */
 const top7ids=ims.classification.slice(0,7).map(c=>c.id);
 const refOf=id=>{ const w=(G.world||[]).find(x=>x.id===id); if(w) return sgpRef(w);
                   const r=(G.riders||[]).find(x=>x.id===id); return r?sgpRef(r):null; };
 const nextTop7=ims.classification.slice(0,7).map(c=>refOf(c.id)).filter(Boolean);
 /* Regulamin: jeżeli któryś z czwórki Challenge jest już w czołowej siódemce cyklu,
    jego miejsce bierze najwyżej sklasyfikowany zawodnik Challenge, który jeszcze
    nie ma kwalifikacji. */
 /* ------------------------------------------------------------
    LIMIT KRAJOWY NA WEJŚCIU Z CHALLENGE — LICZONY DYNAMICZNIE
    ------------------------------------------------------------
    Sam sztywny limit „2 z Challenge na kraj" nie wystarczał: przy pięciu
    Polakach z kwalifikacji z poprzedniego cyklu plus dwóch z Challenge
    robiło się siedmiu, w kolejnym roku dziewięciu i stawka znowu pełzła
    w stronę jednonarodowej. Teraz przydział Challenge to RESZTA
    przydziału federacji po odliczeniu tych, którzy już mają kwalifikację —
    dzięki temu liczba zawodników jednego kraju w cyklu nie rośnie z roku
    na rok, tylko stoi na ustalonym poziomie.
    WYJĄTEK: GRACZ. Jeżeli wjedzie do czwórki Challenge, miejsce dostaje
    zawsze — bo to jego główna droga do Grand Prix i nie może jej zamknąć
    arytmetyka przydziałów. Wtedy jego kraj ma po prostu o jednego więcej.
    ------------------------------------------------------------ */
 const alreadyTop7=ctryCount(nextTop7, x=>x);
 const chCnt={};
 const natLim=c=>(SGP.natCap[c]!=null?SGP.natCap[c]:SGP.natCapDef);
 const chLim=c=>Math.max(0, Math.min(SGP.chNatCap||2, natLim(c)-(alreadyTop7[c]||0)));
 const ch4=[];
 Q.order.forEach(r=>{
   if(ch4.length>=4 || top7ids.includes(r.id)) return;
   const isMe = meR && r.id===meR.id;
   const c=ctryOf(r);
   if(!isMe && (chCnt[c]||0) >= chLim(c)) return;
   chCnt[c]=(chCnt[c]||0)+1; ch4.push(sgpRef(r));
 });
 const secRef = sec.winner && !top7ids.includes(sec.winner.id) ? sgpRef(sec.winner) : null;
 const used=new Set([...top7ids, ...ch4.map(x=>x.id), ...(secRef?[secRef.id]:[])]);
 /* Dzikie karty Komisji na kolejny sezon dobiera się już z uwzględnieniem tego,
    ile miejsc dana federacja ma zaklepane z kwalifikacji i Challenge. */
 const already=ctryCount([...nextTop7, ...ch4, ...(secRef?[secRef]:[])], x=>x);
 const wildCaps={};
 Object.keys(SGP.natCap).forEach(c=>{ wildCaps[c]=Math.max(0, SGP.natCap[c]-(already[c]||0)); });
 const wilds=capPick(worldRanking(r=>!isJun(r)).filter(r=>!used.has(r.id)),
   wildCaps, SGP.natCapDef, 4).map(sgpRef);
 G.sgp={top7:nextTop7, ch4, sec:secRef, wilds, champ:ims.champion, champYear:G.year, seeded:true};
 G.imsHist=(G.imsHist||[]).concat([{year:G.year, champ:ims.champion, ctry:ims.championCtry,
   mePos:ims.mePos, mePts:ims.mePts}]).slice(-30);
 /* --- STAN CYKLU JUNIORSKIEGO NA KOLEJNY SEZON ---
    Czołowa siódemka zachowuje kwalifikację (kto skończy 22 lata, i tak wypadnie
    przy układaniu składu), czterech dochodzi z SGP2 Challenge, resztę dobiera
    Komisja z rankingu — już z limitami krajowymi. */
 if(imsj){
   /* KWALIFIKACJA MA MIEĆ SENS: bierzemy tylko tych, którzy w KOLEJNYM sezonie
      wciąż będą młodzieżowcami (dziś najwyżej 20 lat). Bez tego połowa stawki
      wywalczała miejsce i traciła je w tej samej zimie, kończąc 22 lata,
      a cykl i tak wypełniały dzikie karty. */
   const stillJun = id => { const r=(G.world||[]).find(x=>x.id===id) || (G.riders||[]).find(x=>x.id===id);
     return !!r && !r.retired && Number(r.age)<=20; };
   const jTop=imsj.classification.slice(0,SGP.junTop).filter(c=>stillJun(c.id)).map(c=>refOf(c.id)).filter(Boolean);
   const jTopIds=jTop.map(x=>x.id);
   const jCh=[];
   const jCnt={}, jLim=c=>Math.max(0, Math.min(SGP.chNatCap||2,
     (SGP.natCap[c]!=null?SGP.natCap[c]:SGP.natCapDef) - (ctryCount(jTop, x=>x)[c]||0)));
   (QJ.order||[]).forEach(r=>{
     if(jCh.length>=SGP.junCh || jTopIds.includes(r.id) || Number(r.age)>20) return;
     const isMe = meR && r.id===meR.id;                 // Gracza limit nigdy nie zatrzymuje
     const c=ctryOf(r);
     if(!isMe && (jCnt[c]||0) >= jLim(c)) return;
     jCnt[c]=(jCnt[c]||0)+1; jCh.push(sgpRef(r));
   });
   const jUsed=new Set([...jTopIds, ...jCh.map(x=>x.id)]);
   const jAlready=ctryCount([...jTop, ...jCh], x=>x);
   const jCaps={}; Object.keys(SGP.natCap).forEach(c=>{ jCaps[c]=Math.max(0, SGP.natCap[c]-(jAlready[c]||0)); });
   const jWild=capPick(worldRanking(r=>isJun(r)&&Number(r.age)<=20).filter(r=>!jUsed.has(r.id)), jCaps, SGP.natCapDef, SGP.junWild).map(sgpRef);
   G.sgpJ={top:jTop, ch4:jCh, wilds:jWild, champ:imsj.champion, seeded:true};
   G.imsjHist=(G.imsjHist||[]).concat([{year:G.year, champ:imsj.champion, ctry:imsj.championCtry,
     mePos:imsj.mePos, mePts:imsj.mePts}]).slice(-30);
 }
 if(imsj) imsj.qual=QJ;
 return {ims, imsj, qual:Q, sec, qualJun:QJ};
}

/* --- BARAŻE + AWANSE/SPADKI --- */
function twoLeg(a,b){ // a = wyżej notowany
 const M1=simMeeting(a.name,b.name,null,null), M2=simMeeting(b.name,a.name,null,null);
 if(!M1||!M2) return {legs:[],agA:0,agB:0,win:a,lose:b};
 const agA=M1.hs+M2.as, agB=M1.as+M2.hs;
 return {legs:[{h:a.name,aw:b.name,hs:M1.hs,as:M1.as,heats:M1.heats,box:M1.box},
               {h:b.name,aw:a.name,hs:M2.hs,as:M2.as,heats:M2.heats,box:M2.box}],
   agA, agB, win: agA>=agB?a:b, lose: agA>=agB?b:a};
}
