/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIVE TURNIEJ
   Generator turnieju indywidualnego na żywo
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 5338-5608 oryginału).
   ============================================================ */
/* ============================================================
   9e. TURNIEJ INDYWIDUALNY NA ŻYWO
   ------------------------------------------------------------
   Ta sama mechanika co w meczu ligowym (zębatka, tor, decyzje co łuk,
   park maszyn), tylko bez drużyny: nie ma trenera, nie ma rezerwy
   taktycznej i nie ma za kogo jechać, więc nie ma też punktów bonusowych.
   Zwraca dokładnie taką tabelę, jaką zwraca meeting20() — reszta gry
   nie musi wiedzieć, że ten turniej ktoś przejechał ręcznie.
   ============================================================ */
function liveNewState(){
 /* `noFill:true` — w turnieju indywidualnym kodów nie wpisujemy „na zapas".
    Każdy bieg i tak trzeba przeliczyć bez wykluczonego (patrz liveDropExcluded),
    więc kod „w" wpada do tabeli dokładnie wtedy, kiedy bieg się odbywa. */
 /* SPRINT 4: turniej dostaje ten sam warsztat live co mecz drużynowy —
    pogodę, dyszę, gaźnik, długość, zapłon, ryzyko dwóch minut, zdarzenia
    w parku maszyn i wywiady. Trenera dalej nie ma, bo to turniej indywidualny.
    ------------------------------------------------------------
    SPRINT 5 (24.08.2026): `ind:true`.
    To jest TA jedna flaga, po której engine/30b-live-zdarzenia.js poznaje,
    że w tych zawodach NIE MA DRUŻYNY — i wycina wszystko, co jej wymaga:
    zdarzenia z kolegą z pary i prezesem klubu, opcje typu „pokaż to
    kierownikowi drużyny", pytania o trenera i gospodarzy, a po zawodach
    głosy spikera o wyniku drużyny i komentarz kolegi z pary.
    Do tego `mechAuto` (oddanie sprzętu mechanikowi) i `itwCount`
    (maksymalnie jeden wywiad na zawody). */
 const L = {ind:true, grip:null, ideal:null, gear:2, mech:null, mechWx:null, spyKnown:false, spyDone:false,
   yellow:0, red:false, outOfMeeting:false, noFill:true, crashed:0, hurt:0, msgs:[], story:[],
   jet:null, carb:null, len:null, ign:null, weather:null,
   setupDone:false, setupDirty:false, setupChanges:0, formBonus:0,
   mechAuto:false, itwCount:0,
   evUsed:[], evDone:0, evLast:null, voices:null};
 liveSetupInit(L);
 /* SPRINT 5: tor i mechanik znani PRZED pierwszym biegiem — inaczej boks
    „TOR I MOTOCYKL" nie renderuje się w parku maszyn przed turniejem. */
 liveTrackInit(L);
 return L;
}
/* ============================================================
   NAPRAWA (patch 21.08.2026, Sprint 1): WYKLUCZONY JECHAŁ DALEJ.
   ------------------------------------------------------------
   Po czerwonej kartce albo opuszczeniu parku maszyn turniej przepuszczał
   pozostałe biegi przez oneHeat() z pełną stawką — a więc zawodnik, który
   miał już koniec startów, dalej zdobywał w nich punkty i miejsca.
   Teraz każdy jego pozostały bieg jest przeliczany tak, jak wygląda na torze:
   jego pozycja to „w" i zero punktów, a pozostała trójka dostaje 3-2-1
   w tej samej kolejności, w jakiej dojechała.
   ============================================================ */
function liveDropExcluded(H, idxs, meIdx){
 if(!H || meIdx==null || !idxs.includes(meIdx)) return H;
 const o=H.res.find(x=>x.i===meIdx); if(o) o.out='w';
 H.pts[meIdx]=0; H.place[meIdx]=4;
 const rest=idxs.filter(i=>i!==meIdx).sort((a,b)=>H.place[a]-H.place[b]);
 let k=0;
 rest.forEach(i=>{
   const r=H.res.find(x=>x.i===i);
   if(r && r.out){ H.pts[i]=0; H.place[i]=4; return; }
   H.pts[i]=[3,2,1,0][k]; H.place[i]=k+1; k++;
 });
 return H;
}
/* Park maszyn w turnieju indywidualnym: zębatka, podglądanie, rękoczyny, ucieczka. */
function liveIndPit(act, live){
 const p=G.p, S=G.S, out=[];
 const a=(act&&act.a)||'go';
 live.msgs=[];
 const say=(...xs)=>xs.filter(Boolean).forEach(x=>{ live.msgs.push(x); live.story.push(x); });
 if(a==='gear'){
   if(live.mechAuto){ say(liveMechAutoBlock()); return false; }   // SPRINT 5
   const v=cl(Number(act.v)||0,0,5);
   if(v===live.gear) say('Mechanik nawet nie sięga po klucz. Zostaje jak było.');
   else {
     say('Zębatka '+live.gear+' → '+v+'.'); live.gear=v;
     const r=liveSetupTouch(live);
     if(r>0) say('Sprzęt ruszony w trakcie turnieju — '+r+'% szans, że nie zdążysz pod taśmę.');
   }
   return false;
 }
 /* SPRINT 4: DŁUGOŚĆ, ZAPŁON, GAŹNIK, DYSZA — dokładnie ta sama mechanika
    co w meczu drużynowym (engine/31), łącznie z ryzykiem dwóch minut. */
 if(a==='setup'){
   const parts=String((act&&act.v)||'').split(':');
   const k=parts[0];
   /* SPRINT 5: „JESTEM NIEDŹWIEDZIAKIEM I ZOSTAWIAM USTAWIENIA STAREMU" —
      ta sama mechanika co w meczu drużynowym (engine/31), ten sam kanał
      akcji ('setup' z wartością 'auto:1'), ta sama cena w profesjonalizmie. */
   if(k==='auto'){
     if(live.mechAuto){ say('Już oddałeś sprzęt. Drugi raz nie da się tego oddać.'); return false; }
     liveMechAutoOn(live, []).forEach(x=>say(x));
     liveMechAutoSet(live, []).forEach(x=>say(x));
     return false;
   }
   if(live.mechAuto){ say(liveMechAutoBlock()); return false; }
   const max={jet:5, carb:3, len:3, ign:3}[k];
   if(max==null) return false;
   const v=cl(Number(parts[1])||0, 0, max);
   const nm={jet:'DYSZA', carb:'GAŹNIK (igła)', len:'DŁUGOŚĆ MOTOCYKLA', ign:'ZAPŁON'}[k];
   const lab={jet:SETUPB.jet, carb:SETUPB.carb, len:SETUPB.len, ign:SETUPB.ign}[k];
   if(live[k]===v){ say(nm+' zostaje bez zmian.'); return false; }
   const from=lab[live[k]] ? lab[live[k]].n : String(live[k]);
   live[k]=v;
   const r=liveSetupTouch(live);
   say(nm+': '+from+' → '+lab[v].n+'.');
   if(r>0) say('Sprzęt ruszony w trakcie turnieju — '+r+'% szans na wykluczenie za limit dwóch minut.');
   else say('Pierwsze ustawienie przed pierwszym biegiem — 0% ryzyka.');
   return false;
 }
 if(a==='spy'){
   if(live.spyDone){ say('Drugi raz w tym biegu nikt cię tam nie wpuści.'); return false; }
   live.spyDone=true;
   if(chance(BIGM.spyOk)){ live.spyKnown=true; say('Zajrzałeś rywalowi w zębatkę pod pretekstem pożyczania kluczy. Wiesz już, co dziś jedzie na tym torze.'); }
   else { say('Sędzia techniczny widział wszystko.'); livePitCosts(live,'yellow').forEach(x=>say(x)); }
   return false;
 }
 if(a==='hit'){
   p.med=cl(p.med+12,0,99); S.bigMed=(S.bigMed||0)+12;
   if(chance(12)){ say('Przyjebałeś mu za busem, bez świadków i bez kamer. Rywal milczy, bo nie ma dowodów, a ty masz spokój.'); return false; }
   p.budget-=BIGM.redFine; S.fines=(S.fines||0)+BIGM.redFine;
   S.bigProf=(S.bigProf||0)-BIGM.redProf; p.prof=cl(p.prof-BIGM.redProf,0,99);
   say('CZERWONA KARTKA za rękoczyny w parku maszyn. Wykluczenie z dalszych startów w turnieju.',
       'Kara '+zl(BIGM.redFine)+', profesjonalizm -'+BIGM.redProf+'.');
   liveRedCard(live, [], 'rękoczyny w parku maszyn').forEach(x=>say(x));
   if(chance(30)){ S.banMatches=(S.banMatches||0)+2; say('Wydział Dyscypliny dokłada 2 mecze zawieszenia w kolejnym sezonie.'); }
   return true;
 }
 if(a==='leave'){
   S.leftPits=true;                     // ← engine/28: zerwana umowa blokuje wielkie mecze
   p.budget-=BIGM.leaveFine; S.fines=(S.fines||0)+BIGM.leaveFine;
   S.bigProf=(S.bigProf||0)-BIGM.leaveProf; p.prof=cl(p.prof-BIGM.leaveProf,0,99);
   p.med=cl(p.med+15,0,99); S.bigMed=(S.bigMed||0)+15;
   say('WYJEŻDŻASZ Z PARKU MASZYN W ŚRODKU TURNIEJU. Pakujesz sprzęt przy zapalonych światłach, na oczach szesnastu tysięcy ludzi.',
       'Pozostałe biegi przepadają. Kara '+zl(BIGM.leaveFine)+', profesjonalizm -'+BIGM.leaveProf+'.');
   // niestawienie się pod taśmą = wykluczenie za przekroczenie dwóch minut w każdym pozostałym biegu
   liveExcludeRest(live, 'opuszczenie parku maszyn (limit dwóch minut)', [], {code:'w'}).forEach(x=>say(x));
   if(chance(45)){ S.noRenew=true; say('Klub, który cię zgłosił, ogłasza rozstanie „za porozumieniem stron".'); }
   return true;
 }
 return true;
}
/* Jeden bieg turnieju z udziałem Gracza — wspólny dla tabeli 20-biegowej,
   biegów LCQ, półfinału i finału. Zwraca to samo co oneHeat(). */
function* liveIndHeatGen(idxs, field, meIdx, ctx, live, label, snap){
 const ref = field.__ref !== undefined ? field.__ref
   : (field.__ref = field.reduce((a,r)=>a+r.ovr,0)/Math.max(1,field.length));
 /* PARK MASZYN */
 live.grip=liveGrip(live.grip);
 live.ideal=liveIdeal(live.grip);
 live.spyKnown=false; live.spyDone=false;
 live.mech=liveMech(live.ideal, live.gear);
 live.mechWx=liveMechWeather(live);
 live.msgs=[];
 const say0=(x)=>{ live.msgs.push(x); live.story.push(x); };
 /* SPRINT 5: sprzęt oddany „staremu" — mechanik ustawia motocykl SAM. */
 liveMechAutoSet(live, []).forEach(x=>say0(x));
 yield* liveSideGen(live, snap, say0, 'mid', label);   // SPRINT 4
 while(true){
   const act = yield snap('pit', {next:{label, mine:true},
     field: idxs.map(i=>({name:field[i].name, me:i===meIdx, ctry:field[i].ctry||null}))});
   if((act&&act.a)==='go') break;
   if(liveIndPit(act, live)) break;
 }
 if(live.outOfMeeting) return null;
 /* SPRINT 4: grzebałeś w sprzęcie między biegami — sędzia odlicza dwie minuty. */
 liveSetupTapeRoll(live, []).forEach(x=>say0(x));
 if(live.lateOut){ live.lateOut=false; live.lateHeat=true; return null; }
 const entries = idxs.map(i=>({r:{id:field[i].id, name:field[i].name, ovr:field[i].ovr, form:0},
   side:'x', home:false, num:null, ref, trouble:0, idx:i}));
 const fit=liveFit(live.gear, live.ideal);
 const meId=field[meIdx].id;
 const rc=liveMkRace(entries, ctx, meId, fit, live.spyKnown, liveRideMod(live));
 const say=(...xs)=>xs.filter(Boolean).forEach(x=>{ live.msgs.push(x); live.story.push(x); });
 live.msgs=[];
 /* TAŚMA */
 {
  const act = yield snap('race', {race:{ph:0, phaseName:BIGM.phases[0], label,
    options:BIGM.starts.map(o=>({id:o.id,l:o.l,d:o.d,ch:null})),
    order:liveOrder(rc).map(x=>({name:x.name, me:x.me, out:x.out})),
    gear:live.gear, fit, fitTxt:BIGM.fitTxt[fit], grip:live.grip}});
  const s=(act&&act.v)||'clean', me=rc.rid.find(x=>x.me), p=G.p;
  if(s==='tape'){
    if(chance(cl(52+(p.prof-50)*0.12-fit*3,10,88))){ me.val+=R(5,10); say('WYSTRZELIŁEŚ Z TAŚMY.'); }
    else if(chance(38)){ me.out='w'; say('DOTKNĄŁEŚ TAŚMY. Wykluczenie z biegu.'); }
    else { me.val-=R(2,5); say('Za wcześnie o ćwierć sekundy. Wyjechałeś ostatni.'); }
  } else if(s==='safe'){ me.val-=R(1,4); say('Spokojny start.'); }
  else { me.val+=R(-2,3); say('Normalny start.'); }
  liveFate(rc,0).forEach(x=>say(x));
  liveDrift(rc,false);
 }
 for(let ph=1; ph<=3 && !rc.rid.find(x=>x.me).out; ph++){
   const opts=BIGM.moves.map(m=>({id:m.id, l:m.l, d:m.d, ch:liveMoveChance(rc, m.id, live.grip, fit)}));
   const act = yield snap('race', {race:{ph, phaseName:BIGM.phases[ph], label, options:opts,
     order:liveOrder(rc).map(x=>({name:x.name, me:x.me, out:x.out})),
     pos:liveMyPos(rc), gear:live.gear, fit, fitTxt:BIGM.fitTxt[fit], grip:live.grip}});
   live.msgs=[];
   const r=liveResolveMove(rc, (act&&act.v)||'obrona', live.grip, fit, live);
   r.out.forEach(x=>say(x));
   liveFate(rc, ph).forEach(x=>say(x));
   liveDrift(rc, ((act&&act.v)||'')==='obrona');
 }
 /* META — wynik w formacie oneHeat() */
 const fin=rc.rid.filter(x=>!x.out).sort((a,b)=>b.val-a.val);
 const pts={}, place={}, res=[];
 fin.forEach((x,k)=>{ pts[x.e.idx]=[3,2,1,0][k]; place[x.e.idx]=k+1; });
 rc.rid.forEach(x=>{ if(x.out){ pts[x.e.idx]=0; place[x.e.idx]=4; }
   res.push({i:x.e.idx, out:x.out, str:x.val}); });
 const mine=rc.rid.find(x=>x.me);
 say(mine.out==='d' ? 'DEFEKT — zero punktów.' : mine.out==='w' ? 'WYKLUCZENIE — zero punktów.'
   : 'Bieg '+label+': '+pts[meIdx]+' pkt. '+pick(BIGM.crowd));
 yield snap('heatres', {next:{label, mine:true}, result:{pts:pts[meIdx], out:mine.out,
   order:liveOrder(rc).map((x,i)=>({pos:i+1, name:x.name, me:x.me, out:x.out}))}});
 return {pts, place, res};
}
/* --- TURNIEJ WG TABELI 20-BIEGOWEJ, NA ŻYWO --- */
function* liveInd20Gen(field, meIdx, ctx, live, meta){
 const draw=heatDraw();
 const T=field.map((r,i)=>({i, id:r.id, name:r.name, age:r.age, me:i===meIdx,
   pts:0, codes:[], places:[0,0,0,0,0]}));
 live.meId=field[meIdx] ? field[meIdx].id : null;
 live.codes=T[meIdx] ? T[meIdx].codes : null;      // kartoteka kodów Gracza w tym turnieju
 const done=[];
 const snap=(phase, extra)=>{
   G.live=Object.assign({
     kind:'ind', title:meta.title, stage:meta.stage, sub:meta.sub||null,
     phase, hs:null, as:null,
     grip: live.grip==null?null:{i:live.grip, n:BIGM.grip[live.grip].n, d:BIGM.grip[live.grip].d},
     gear:live.gear, ideal: live.spyKnown ? live.ideal : null, mech:live.mech,
     fit: live.ideal==null?null:liveFit(live.gear, live.ideal),
     cards:{y:live.yellow, r:live.red}, outOfMeeting:live.outOfMeeting,
     outWhy: live.outWhy||null, excludedCode: live.forceCode||null,
     medSub:null, injured: !!live.medOut, twoMin: !!live.twoMinutes,
     msgs:live.msgs.slice(), story:live.story.slice(-14),
     table:T.slice().sort((a,b)=>b.pts-a.pts||b.places[1]-a.places[1])
            .map((t,k)=>({pos:k+1, name:t.name, pts:t.pts, me:t.me, codes:t.codes.slice()})),
     me: T[meIdx] ? {pts:T[meIdx].pts, codes:T[meIdx].codes.slice(), starts:T[meIdx].codes.length} : null,
     heats:done.slice(-6), race:null, coach:null, next:null, push:null,
     mevent:null, itw:null,
     /* SPRINT 4: warsztat live — ten sam boks co w meczu drużynowym */
     weather: live.weather||null, mechWx: live.mechWx||null,
     setup:{jet:live.jet, carb:live.carb, len:live.len, ign:live.ign,
            verdict: liveSetupVerdict(liveSetupEval(live)),
            risk: liveSetupRisk(live), dirty:!!live.setupDirty,
            done:!!live.setupDone, changes:live.setupChanges||0,
            auto:!!live.mechAuto},
     mechAuto: !!live.mechAuto,        // SPRINT 5: sprzęt oddany mechanikowi
     voices: live.voices||null
   }, extra||{});
   return {ui:'live'};
 };
 const runHeat=(h)=>{
   let H=oneHeat(h, field, -1, null);
   // wykluczony nie jedzie: jego pozycja to „w", reszta biegu liczy się od nowa
   if(live.outOfMeeting) H=liveDropExcluded(H, h, meIdx);
   h.forEach(i=>{ const t=T[i], o=H.res.find(x=>x.i===i);
     t.pts+=H.pts[i];
     if(o.out) t.codes.push(o.out); else t.codes.push(String(H.pts[i]));
     if(!o.out) t.places[H.place[i]]++; });
   done.push({label:done.length+1, res:h.map(i=>({name:field[i].name, pts:H.pts[i], me:i===meIdx,
     out:(H.res.find(x=>x.i===i)||{}).out||null}))});
 };
 const apply=(h,H)=>{
   h.forEach(i=>{ const t=T[i], o=H.res.find(x=>x.i===i);
     t.pts+=H.pts[i];
     if(o.out) t.codes.push(o.out); else t.codes.push(String(H.pts[i]));
     if(!o.out) t.places[H.place[i]]++; });
   done.push({label:done.length+1, res:h.map(i=>({name:field[i].name, pts:H.pts[i], me:i===meIdx,
     out:(H.res.find(x=>x.i===i)||{}).out||null}))});
 };
 const sayT=(x)=>{ live.msgs.push(x); live.story.push(x); };
 yield* liveSideGen(live, snap, sayT, 'pre', 0);      // SPRINT 4: wywiad przed turniejem
 let k=0;
 while(k<20){
   const mine = draw[k].includes(meIdx) && !live.outOfMeeting;
   if(!mine){
     liveMechRefresh(live);                            // SPRINT 5: mechanik mówi też w oczekiwaniu
     yield* liveSideGen(live, snap, sayT, 'mid', k+1); // SPRINT 4: zdarzenie / wywiad
     while(true){
       const act = yield snap('between', {next:{label:k+1, mine:false}});
       if((act&&act.a)==='go') break;
       if(liveIndPit(act, live)) break;
     }
     while(k<20 && !(draw[k].includes(meIdx) && !live.outOfMeeting)){ runHeat(draw[k]); k++; }
     continue;
   }
   const H = yield* liveIndHeatGen(draw[k], field, meIdx, ctx, live, k+1, snap);
   if(H) apply(draw[k], live.outOfMeeting ? liveDropExcluded(H, draw[k], meIdx) : H);
   else if(live.lateHeat){
     /* SPRINT 4: nie zdążyłeś pod taśmę — bieg jedzie bez ciebie, tobie „w". */
     live.lateHeat=false;
     apply(draw[k], liveDropExcluded(oneHeat(draw[k], field, -1, null), draw[k], meIdx));
   }
   else  runHeat(draw[k]);        // wyjechałeś z parku maszyn — bieg jedzie bez ciebie
   k++;
 }
 T.sort((a,b)=> b.pts-a.pts || b.places[1]-a.places[1] || b.places[2]-a.places[2]
   || b.places[3]-a.places[3] || b.places[4]-a.places[4] || (Math.random()-0.5));
 G.liveSnap=snap;                       // przydaje się biegom dodatkowym (LCQ, finał)
 return T;
}
/* --- BIEG POZA TABELĄ (LCQ / półfinał / finał) --- */
function* liveIndExtraGen(idxs, field, meIdx, ctx, live, label, snap){
 if(live.outOfMeeting) return liveDropExcluded(oneHeat(idxs, field, -1, null), idxs, meIdx);
 if(!idxs.includes(meIdx)) return oneHeat(idxs, field, -1, null);
 const H = yield* liveIndHeatGen(idxs, field, meIdx, ctx, live, label, snap);
 return H || oneHeat(idxs, field, -1, null);
}
/* --- PEŁNA RUNDA GRAND PRIX NA ŻYWO (20 biegów + LCQ1 + LCQ2 + FINAŁ) --- */
function* liveGpRoundGen(field, meIdx, ctx, title, meta){
 const live=liveNewState();
 const T = yield* liveInd20Gen(field, meIdx, ctx, live, {title, stage:meta.stage, sub:meta.sub});
 const snap=G.liveSnap;
 const chart=T.map(t=>t.i);
 const chartPts={}; T.forEach(t=>chartPts[t.i]=t.pts);
 const l1i=[chart[2],chart[5],chart[6],chart[9]].filter(x=>x!=null);
 const l2i=[chart[3],chart[4],chart[7],chart[8]].filter(x=>x!=null);
 const mk=(H, idxs, label)=>{
   const order=idxs.slice().sort((a,b)=>H.place[a]-H.place[b]);
   return {label, H, order, rows:order.map((ix,k)=>({pos:k+1, name:field[ix].name, ctry:field[ix].ctry||'POL',
     out:(H.res.find(x=>x.i===ix)||{}).out||null, me:ix===meIdx}))};
 };
 const H1 = yield* liveIndExtraGen(l1i, field, meIdx, ctx, live, 'LCQ1', snap);
 const L1 = mk(H1, l1i, 'LCQ1 — BIEG OSTATNIEJ SZANSY');
 const H2 = yield* liveIndExtraGen(l2i, field, meIdx, ctx, live, 'LCQ2', snap);
 const L2 = mk(H2, l2i, 'LCQ2 — BIEG OSTATNIEJ SZANSY');
 const fi=[chart[0],chart[1],L1.order[0],L2.order[0]].filter(x=>x!=null);
 const HF = yield* liveIndExtraGen(fi, field, meIdx, ctx, live, 'FINAŁ RUNDY', snap);
 const F = mk(HF, fi, 'FINAŁ RUNDY');
 const cls=[...F.order];
 const pair=(k)=>{ const a=L1.order[k], b=L2.order[k];
   const av=a!=null?chart.indexOf(a):99, bv=b!=null?chart.indexOf(b):99;
   return av<=bv ? [a,b] : [b,a]; };
 [1,2,3].forEach(k=>pair(k).forEach(x=>{ if(x!=null && !cls.includes(x)) cls.push(x); }));
 chart.forEach(x=>{ if(!cls.includes(x)) cls.push(x); });
 let me=null;
 if(meIdx>=0){
   const row=T.find(t=>t.i===meIdx);
   const codes=row? row.codes.slice() : [];
   const lcq = l1i.includes(meIdx) ? {n:1, place:L1.H.place[meIdx], out:(L1.H.res.find(x=>x.i===meIdx)||{}).out}
             : l2i.includes(meIdx) ? {n:2, place:L2.H.place[meIdx], out:(L2.H.res.find(x=>x.i===meIdx)||{}).out} : null;
   if(lcq) codes.push('LCQ'+lcq.n+':'+(lcq.out || lcq.place+'m'));
   const inF=fi.includes(meIdx);
   if(inF) codes.push('F:'+((F.H.res.find(x=>x.i===meIdx)||{}).out || (F.H.place[meIdx]+'m')));
   me={chartPts: row?row.pts:0, chartPos: chart.indexOf(meIdx)+1, codes,
       pos: cls.indexOf(meIdx)+1, lcq, inFinal:inF};
 }
 yield* liveSideGen(live, snap, (x)=>{ live.msgs.push(x); live.story.push(x); }, 'post', 23);
 liveWrapUp(live, title, me);
 return {title, T, chart, chartPts, cls, L1, L2, F, me, live:true,
   rows: cls.map((ix,k)=>({pos:k+1, name:field[ix].name, ctry:field[ix].ctry||'POL',
     chart:chartPts[ix]||0, gp:SGP.pts[k]||0, me:ix===meIdx}))};
}
/* --- TURNIEJ FINAŁOWY IMP NA ŻYWO (art. 634) --- */
function* liveImpFinalGen(field, meIdx, ctx, meta){
 const live=liveNewState();
 const T = yield* liveInd20Gen(field, meIdx, ctx, live, {title:meta.title, stage:meta.stage, sub:meta.sub});
 const snap=G.liveSnap;
 const sfIdx=[2,3,4,5].map(k=>T[k].i);
 const semi = yield* liveIndExtraGen(sfIdx, field, meIdx, ctx, live, 'PÓŁFINAŁ TURNIEJU', snap);
 const semiOrder=sfIdx.slice().sort((a,b)=>semi.place[a]-semi.place[b]);
 const finIdx=[T[0].i, T[1].i, semiOrder[0], semiOrder[1]];
 const fin = yield* liveIndExtraGen(finIdx, field, meIdx, ctx, live, 'BIEG FINAŁOWY', snap);
 const finOrder=finIdx.slice().sort((a,b)=>fin.place[a]-fin.place[b]);
 const cls=[...finOrder, semiOrder[2], semiOrder[3],
   ...T.slice(2).map(t=>t.i).filter(i=>!finIdx.includes(i)&&!semiOrder.slice(2).includes(i))];
 const score={}; T.forEach(t=>score[t.i]=t.pts);
 finIdx.forEach(i=>score[i]+=fin.pts[i]);
 const meRow = meIdx>=0 ? T.find(t=>t.i===meIdx) : null;
 let meCodes = meRow? meRow.codes.slice() : [];
 let meSemi=null, meFin=null;
 if(meRow){
   if(sfIdx.includes(meIdx)) meSemi = (semi.res.find(x=>x.i===meIdx)||{}).out || String(semi.place[meIdx])+'m';
   if(finIdx.includes(meIdx)){ const o=fin.res.find(x=>x.i===meIdx)||{};
     meFin = o.out || String(fin.pts[meIdx]); meCodes.push('F:'+(o.out||String(fin.pts[meIdx]))); }
 }
 yield* liveSideGen(live, snap, (x)=>{ live.msgs.push(x); live.story.push(x); }, 'post', 23);
 liveWrapUp(live, meta.title, {chartPts:meRow?meRow.pts:0});
 return {T, cls, score, semiOrder, finOrder, meCodes, meSemi, meFin, live:true,
   mePts: meRow? score[meIdx] : 0, mainPts: meRow? meRow.pts : 0};
}
/* Skutki pozasportowe turnieju jechanego ręcznie — do raportu sezonu. */
function liveWrapUp(live, title, me){
 const note=[];
 if(live.yellow) note.push(live.yellow+'× żółta kartka ('+zl(live.yellow*BIGM.yellowCost)+')');
 if(live.red) note.push('czerwona kartka');
 if(live.outOfMeeting && !live.red) note.push('opuszczony park maszyn');
 if(live.crashed) note.push(live.crashed+'× kraksa');
 if(live.hurt) note.push('-'+live.hurt+' OVR po upadku');
 /* Sprint 4 */
 if(live.lateCount)  note.push(live.lateCount+'× wykluczenie za limit dwóch minut');
 if(live.setupChanges) note.push(live.setupChanges+'× zmiana ustawień motocykla');
 if(live.mechAuto)   note.push('ustawienia oddane mechanikowi („Jestem Niedźwiedziakiem") — profesjonalizm -'+AUTO_PROF);
 if(live.ajsOk)      note.push(live.ajsOk+'× UDANY AJS SPIDŁEJ');
 if(live.ajsFail)    note.push(live.ajsFail+'× nieudany AJS SPIDŁEJ');
 if(live.nozyceOk)   note.push(live.nozyceOk+'× udane nożyce');
 if(live.evDone)     note.push(live.evDone+'× zdarzenie w parku maszyn');
 if(live.itwGiven)   note.push('wywiady: '+live.itwGiven+' odpowiedzi');
 if(live.itwRefused) note.push(live.itwRefused+'× odmowa wywiadu');
 if(note.length) (G.S.notesBig=G.S.notesBig||[]).push('WIELKI TURNIEJ ('+title+'): '+note.join(', ')+'.');
 /* SPRINT 4: pato-komentarze po turnieju — bez wyniku drużynowego, więc
    głosy mówią wyłącznie o tobie i o tym, co narobiłeś na torze. */
 live.voices = bigMatchVoices({ind:true, live,
   me:{starts:(live.codes||[]).length, pts: me&&me.chartPts!=null ? me.chartPts : 0, bon:0,
       codes:(live.codes||[]).slice()}});
 (G.S.bigLog=G.S.bigLog||[]).push({title, ind:true, voices:live.voices, story:live.story.slice()});
 G.live=null; G.liveSnap=null;
}
