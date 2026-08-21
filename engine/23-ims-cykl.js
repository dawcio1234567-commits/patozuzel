/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: IMS CYKL
   Grand Prix: skład cyklu, runda GP, klasyfikacja
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 3441-3692 oryginału).
   ============================================================ */
/* ============================================================
   5e. INDYWIDUALNE MISTRZOSTWA ŚWIATA (IMŚ)
   ------------------------------------------------------------
   W papierach FIM cykl nazywa się "Speedway Grand Prix" i tak też opisuje go
   regulamin, na którym oparty jest ten blok. Format rundy — jeden do jednego:
     · 16 zawodników, 20 biegów zasadniczych, 3-2-1-0 (wykluczenie i defekt = 0),
     · dwóch z czoła tabeli jedzie prosto do FINAŁU,
     · miejsca 3-10 rozstawiane są na dwa biegi ostatniej szansy (LCQ1, LCQ2),
       zwycięzca każdego dołącza do finału,
     · zwycięzca finału wygrywa rundę. Razem 23 biegi.
   Klasyfikacja cyklu to suma punktów za miejsca w rundach (SGP.pts).
   Skład, eliminacje, dzikie karty i rezerwy toru — patrz komentarz przy SGP
   w data.js oraz sgpLineup() niżej.
   ============================================================ */

/* --- REFERENCJE DO ZAWODNIKÓW: jedna forma dla Polaka i obcokrajowca --- */
const sgpRef  = r => ({t: r.world?'W':'P', id:r.id, name:r.name, ctry:ctryOf(r)});
function sgpFind(ref){
 if(!ref) return null;
 const src = ref.t==='W' ? (G.world||[]) : (G.riders||[]);
 return src.find(x=>x.id===ref.id && !x.retired) || null;
}
/* ------------------------------------------------------------
   LIMITY KRAJOWE — JEDNO NARZĘDZIE DLA CAŁEGO CYKLU
   ------------------------------------------------------------
   `capPick` przechodzi listę OD NAJLEPSZEGO i bierze zawodnika tylko wtedy,
   gdy jego federacja nie wyczerpała jeszcze przydziału. Dzięki temu Polska
   zostaje najsilniejszą federacją stawki, ale przestaje BYĆ stawką — a przy
   okazji do cyklu wchodzą Czesi, Niemcy czy Australijczycy, którzy przy
   doborze „po prostu najlepszych" nie mieli szans przebić się przez masę
   polskiej ligi.
   ------------------------------------------------------------ */
function capPick(list, caps, def, n, seen){
 const cnt={}, out=[], used=seen||new Set();
 const lim=c=>(caps && caps[c]!=null) ? caps[c] : (def==null?99:def);
 for(const r of list){
   if(!r || used.has(r.id)) continue;
   const c=ctryOf(r);
   if((cnt[c]||0) >= lim(c)) continue;
   cnt[c]=(cnt[c]||0)+1; used.add(r.id); out.push(r);
   if(n && out.length>=n) break;
 }
 return out;
}
/* Ile miejsc w danym komplecie zajmuje już dana federacja. */
function ctryCount(list, getter){
 const o={}; list.forEach(x=>{ const c=ctryOf(getter?getter(x):x); o[c]=(o[c]||0)+1; }); return o;
}
/* Rezerwa toru / zastępstwo: ktoś z tej samej półki, kto akurat jest wolny. */
function sgpSub(seen, minOvr){
 const pool=worldRanking().filter(r=>!seen.has(r.id) && r.ovr>=(minOvr||0));
 return pool.length ? pool[R(0, Math.min(5,pool.length-1))] : null;
}

/* --- JEDEN BIEG POZA TABELĄ (LCQ / FINAŁ) — opis do UI --- */
function gpExtraHeat(idxs, field, meIdx, ctx, label){
 const H=oneHeat(idxs, field, meIdx, ctx);
 const order=idxs.slice().sort((a,b)=>H.place[a]-H.place[b]);
 return {label, H, order,
   rows: order.map((ix,k)=>({pos:k+1, name:field[ix].name, ctry:field[ix].ctry||'POL',
     out:(H.res.find(x=>x.i===ix)||{}).out||null, me:ix===meIdx}))};
}
/* --- PEŁNA RUNDA GRAND PRIX: 20 biegów + LCQ1 + LCQ2 + FINAŁ --- */
function gpRound(field, meIdx, ctx, title){
 const T=meeting20(field, meIdx, ctx);          // tabela 20-biegowa (posortowana)
 const chart=T.map(t=>t.i);                     // indeksy w polu wg miejsca w tabeli
 const chartPts={}; T.forEach(t=>chartPts[t.i]=t.pts);
 /* Rozstawienie biegów ostatniej szansy: miejsca 3-10 z tabeli. */
 const l1i=[chart[2],chart[5],chart[6],chart[9]].filter(x=>x!=null);
 const l2i=[chart[3],chart[4],chart[7],chart[8]].filter(x=>x!=null);
 const L1=gpExtraHeat(l1i, field, meIdx, ctx, 'LCQ1 — BIEG OSTATNIEJ SZANSY');
 const L2=gpExtraHeat(l2i, field, meIdx, ctx, 'LCQ2 — BIEG OSTATNIEJ SZANSY');
 const fi=[chart[0],chart[1],L1.order[0],L2.order[0]].filter(x=>x!=null);
 const F=gpExtraHeat(fi, field, meIdx, ctx, 'FINAŁ RUNDY');
 /* Klasyfikacja rundy: finał 1-4, dalej przegrani LCQ wg miejsc, na końcu tabela. */
 const cls=[...F.order];
 const pair=(k)=>{ const a=L1.order[k], b=L2.order[k];
   const av=a!=null?chart.indexOf(a):99, bv=b!=null?chart.indexOf(b):99;
   return av<=bv ? [a,b] : [b,a]; };
 [1,2,3].forEach(k=>pair(k).forEach(x=>{ if(x!=null && !cls.includes(x)) cls.push(x); }));
 chart.forEach(x=>{ if(!cls.includes(x)) cls.push(x); });
 /* Linia gracza: kody z tabeli + LCQ + finał. */
 let me=null;
 if(meIdx>=0){
   const row=T.find(t=>t.i===meIdx);
   const codes=row? row.codes.slice() : [];
   const lcq = L1.H.place[meIdx]!=null && l1i.includes(meIdx) ? {n:1, place:L1.H.place[meIdx], out:(L1.H.res.find(x=>x.i===meIdx)||{}).out}
             : l2i.includes(meIdx) ? {n:2, place:L2.H.place[meIdx], out:(L2.H.res.find(x=>x.i===meIdx)||{}).out} : null;
   if(lcq) codes.push('LCQ'+lcq.n+':'+(lcq.out || lcq.place+'m'));
   const inF=fi.includes(meIdx);
   if(inF) codes.push('F:'+((F.H.res.find(x=>x.i===meIdx)||{}).out || (F.H.place[meIdx]+'m')));
   me={chartPts: row?row.pts:0, chartPos: chart.indexOf(meIdx)+1, codes,
       pos: cls.indexOf(meIdx)+1, lcq, inFinal:inF};
 }
 return {title, T, chart, chartPts, cls, L1, L2, F, me,
   rows: cls.map((ix,k)=>({pos:k+1, name:field[ix].name, ctry:field[ix].ctry||'POL',
     chart:chartPts[ix]||0, gp:SGP.pts[k]||0, me:ix===meIdx}))};
}

/* --- STAN CYKLU MIĘDZY SEZONAMI --- */
function ensureSgpSeed(){
 if(G.sgp && G.sgp.top7) return G.sgp;
 const rank=worldRanking(r=>!isJun(r)).filter(r=>r.age>=20);
 /* Pierwsza obsada cyklu też podlega limitom krajowym — inaczej gra startowała
    z piętnastoma Polakami i cały cykl przez lata próbował się z tego odkopać. */
 const pool=capPick(rank, SGP.natCap, SGP.natCapDef, 15);
 const take=(a,b)=>pool.slice(a,b).map(sgpRef);
 G.sgp={ top7:take(0,7), ch4:take(7,11), sec:pool[11]?sgpRef(pool[11]):null,
         wilds:take(12,15), champ:null, champYear:null, seeded:true };
 return G.sgp;
}
/* --- SKŁAD CYKLU: 15 stałych uczestników (art. "Line-up") --- */
function sgpLineup(){
 const S=ensureSgpSeed(), out=[], seen=new Set(), cnt={};
 const lim=c=>(SGP.natCap[c]!=null) ? SGP.natCap[c] : SGP.natCapDef;
 /* Limit krajowy obowiązuje w KOLEJNOŚCI PIERWSZEŃSTWA: najpierw kwalifikacja
    z poprzedniego cyklu (tego nikt nikomu nie odbierze), potem Challenge,
    mistrz Europy, a na końcu dzikie karty. Dzięki temu nikt wywalczonego
    miejsca nie traci — przydział przycina wyłącznie dobór uznaniowy. */
 const put=(r,how,hard)=>{
   if(!r||seen.has(r.id)) return false;
   const c=ctryOf(r);
   if(!hard && (cnt[c]||0) >= lim(c)) return false;
   seen.add(r.id); cnt[c]=(cnt[c]||0)+1; out.push({r, how, ctry:c}); return true;
 };
 (S.top7||[]).forEach((ref,i)=>put(sgpFind(ref), 'kwalifikacja z cyklu '+(G.year-1)+' — miejsce '+(i+1)+'.', true));
 (S.ch4||[]).forEach((ref,i)=>put(sgpFind(ref), 'Challenge — miejsce '+(i+1)+'.', true));
 if(S.sec) put(sgpFind(S.sec), 'Mistrz Europy (SEC) — miejsce gwarantowane', true);
 (S.wilds||[]).forEach(ref=>put(sgpFind(ref), 'stała dzika karta Komisji'));
 /* Braki (kontuzje, końce karier, mistrz Europy już w czołowej siódemce)
    uzupełnia Komisja kolejnymi stałymi dzikimi kartami — już z limitem. */
 const pool=worldRanking(r=>!isJun(r));
 let i=0;
 while(out.length<15 && i<pool.length){ put(pool[i++], 'stała dzika karta Komisji'); }
 /* Awaryjnie (bardzo wąska pula) dopuszczamy złamanie limitu, żeby stawka
    w ogóle się zebrała — lepszy cykl z nadreprezentacją niż cykl bez obsady. */
 i=0;
 while(out.length<15 && i<pool.length){ put(pool[i++], 'stała dzika karta Komisji', true); }
 return out.slice(0,15);
}

/* ------------------------------------------------------------
   CYKL — WSPÓLNY SILNIK DLA IMŚ I IMŚJ2
   ------------------------------------------------------------ */
function runGpSeries(cfg){
 const g=runGpSeriesGen(cfg); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* runGpSeriesGen(cfg){
 const {name, sub, perm, rounds, meId, ctx, prize, series, startFee, wildPool, jun, hosts, live, bigStage} = cfg;
 const total={}, wins={}, seenRef={};
 perm.forEach(x=>{ total[x.r.id]=0; wins[x.r.id]=0; seenRef[x.r.id]=x.r; });
 const roundsOut=[]; let rode=false;
 const meStat={rounds:0, chartPts:0, finals:0, podiums:0, roundWins:0};
 let money=0; const moneyParts=[];
 for(let t=0;t<rounds;t++){
   /* ------------------------------------------------------------
      DZIKA KARTA RUNDY — SZESNASTY ZAWODNIK, INNY W KAŻDEJ RUNDZIE
      Każda runda jedzie się w innym kraju i dziką kartę dostaje zawodnik
      GOSPODARZY. Wcześniej brało się po prostu najlepszego z rankingu poza
      stawką — a że polski ranking jest najliczniejszy, dziką kartę rundy
      niemal zawsze dostawał Polak i cykl robił się jeszcze bardziej polski.
      ------------------------------------------------------------ */
   const host=(hosts && hosts.length) ? hosts[t % hosts.length] : null;
   const seen=new Set(perm.map(x=>x.r.id));
   const wcAll=(wildPool||[]).filter(r=>!seen.has(r.id));
   const wcHome=host ? wcAll.filter(r=>ctryOf(r)===host) : [];
   const wcPool = wcHome.length ? wcHome : wcAll;
   const wc = wcPool.length ? wcPool[R(0,Math.min(4,wcPool.length-1))] : sgpSub(seen,0);
   const fieldRows = perm.map(x=>worldRow(x.r));
   if(wc) fieldRows.push(worldRow(wc));
   while(fieldRows.length<16){ const s=sgpSub(new Set(fieldRows.map(f=>f.id)),0); if(!s) break; fieldRows.push(worldRow(s)); }
   const field=fieldRows.slice(0,16);
   const mi = meId!=null ? field.findIndex(r=>r.id===meId) : -1;
   if(mi>=0) rode=true;
   if(wc && total[wc.id]==null){ total[wc.id]=0; wins[wc.id]=0; seenRef[wc.id]=wc; }
   field.forEach(f=>{ if(total[f.id]==null){ total[f.id]=0; wins[f.id]=0; seenRef[f.id]=f; } });
   let Rn=null;
   /* OSTATNIA RUNDA CYKLU — tu się rozdaje mistrzostwo świata. */
   if(live && bigStage && mi>=0 && t===rounds-1){
     const dec = yield* bigMatchAsk({kind:'ind', stage:bigStage,
       title:name+' — OSTATNIA RUNDA CYKLU'}, null);
     if(dec==='ride') Rn = yield* liveGpRoundGen(field, mi, ctx,
       name+' — RUNDA '+(t+1), {stage:bigStage, sub:'20 biegów + LCQ1, LCQ2 i finał'});
   }
   if(!Rn) Rn=gpRound(field, mi, mi>=0?ctx:null, name+' — RUNDA '+(t+1));
   Rn.cls.forEach((ix,k)=>{ const id=field[ix].id; total[id]+=SGP.pts[k]||0; if(k===0) wins[id]++; });
   if(mi>=0 && Rn.me){
     meStat.rounds++; meStat.chartPts+=Rn.me.chartPts;
     if(Rn.me.inFinal) meStat.finals++;
     if(Rn.me.pos<=3) meStat.podiums++;
     if(Rn.me.pos===1) meStat.roundWins++;
     const pr=Math.round((prize[Rn.me.pos-1]||prize[prize.length-1]));
     money+=pr+startFee;
     moneyParts.push({w:'runda '+(t+1)+' — '+Rn.me.pos+'. miejsce', v:pr+startFee});
   }
   Rn.wild = wc ? {name:wc.name, ctry:ctryOf(wc)} : null;
   Rn.host = host;
   if(host) Rn.title = Rn.title + ' · GRAND PRIX — ' + ctryName(host).toUpperCase();
   roundsOut.push(Rn);
 }
 const ids=Object.keys(total);
 const cls=ids.map(id=>({id:Number(id), name:(seenRef[id]||{}).name||'—', ctry:ctryOf(seenRef[id]||{}),
     pts:total[id], wins:wins[id]||0, me:meId!=null && Number(id)===meId}))
   .sort((a,b)=> b.pts-a.pts || b.wins-a.wins);
 const mePos = meId!=null ? cls.findIndex(c=>c.me)+1 : 0;
 if(mePos>0){
   const sp=Math.round(series[mePos-1]||series[series.length-1]);
   money+=sp;
   moneyParts.push({w:'klasyfikacja końcowa — '+mePos+'. miejsce', v:sp});
 }
 return {name, sub, rode, rounds:roundsOut, classification:cls, perm,
   mePos, mePts: mePos>0 ? cls[mePos-1].pts : 0, meStat,
   podium: cls.slice(0,3).map(c=>({name:c.name, ctry:c.ctry})),
   champion: cls[0]? cls[0].name : null, championCtry: cls[0]? cls[0].ctry : null,
   money: Math.round(money), moneyParts, jun:!!jun};
}

/* ------------------------------------------------------------
   ELIMINACJE DO CYKLU + CHALLENGE + MISTRZOSTWA EUROPY
   ------------------------------------------------------------
   Droga do Grand Prix prowadzi przez eliminacje krajowe, a te kończą się
   turniejem Challenge — to z niego wychodzi czterech nowych uczestników cyklu.
     · POLSKA — kwalifikują się zdobywcy czterech pierwszych miejsc Złotego Kasku,
     · ANGLIA, SZWECJA, DANIA — każdy z tych krajów ma własne eliminacje (po 3 miejsca),
     · RESZTA ŚWIATA (Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy)
       jedzie we WSPÓLNYCH eliminacjach i wyprowadza z nich tylko trzech — te
       federacje stoją żużlowo słabiej i szerszy przydział rozwaliłby balans cyklu.
   ------------------------------------------------------------ */
function padField(rows, ctry, n, baseOvr, jun){
 while(rows.length<n){
   rows.push(worldRow(makeWorldRider(ctry||'GBR', (baseOvr||45)-rows.length*1.2+gauss(0,4),
     jun ? R(16,20) : R(17,30))));
 }
 return rows;
}
/* `filt` (opcjonalny) zawęża obsadę eliminacji — używa go droga juniorska
   do IMŚJ2, gdzie startować mogą wyłącznie zawodnicy do 21. roku życia. */
function natQual(ctryList, slots, title, meId, ctx, exclude, filt){
 const ex = exclude || new Set();
 const pool = worldPool().filter(r=>ctryList.includes(r.ctry) && !ex.has(r.id) && (!filt||filt(r)))
   .sort((a,b)=>b.ovr-a.ovr);
 let rows=pool.slice(0,16).map(worldRow);
 rows=padField(rows, ctryList[0], 16, rows.length?rows[rows.length-1].ovr:45, !!filt);
 const mi = meId!=null ? rows.findIndex(r=>r.id===meId) : -1;
 const T=meeting20(rows, mi, mi>=0?ctx:null);
 return {title, rows, T, mi,
   through: T.slice(0,slots).map(t=>rows.find(r=>r.id===t.id)),
   table: T.map((t,i)=>({pos:i+1, name:t.name, ctry:(rows.find(r=>r.id===t.id)||{}).ctry||ctryList[0],
     pts:t.pts, me:t.me, through:i<slots}))};
}
