/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: IMSJ2 ELIMINACJE
   Droga do IMŚJ2: eliminacje juniorskie i SGP2 Challenge
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 5609-5721 oryginału).
   ============================================================ */
/* ============================================================
   5e-bis. DROGA DO IMŚJ2 — ELIMINACJE I SGP2 CHALLENGE
   ------------------------------------------------------------
   (nowe 22.08.2026 — zgłoszenie: „dodaj kwalifikacje na wzór Challenge
   do IMŚ 2")
   Skład cyklu juniorskiego brał się dotąd z gołego rankingu OVR: komputer
   wpisywał piętnastu najlepszych młodzieżowców świata i tyle. Nikt niczego
   nie musiał wywalczyć, a Gracz nie miał ŻADNEJ drogi do IMŚJ2 poza
   czekaniem, aż jego OVR sam urośnie ponad stawkę. Teraz cykl juniorski ma
   tę samą strukturę co seniorski:
     · czołowa siódemka poprzedniego cyklu — kwalifikacja automatyczna
       (o ile wciąż mieści się w wieku młodzieżowym; komu stuknęły 22 lata,
        ten miejsce oddaje),
     · SGP2 CHALLENGE — turniej finałowy eliminacji, awans dla czterech,
     · reszta to stałe dzikie karty Komisji, z limitami krajowymi.
   Do samego Challenge prowadzą eliminacje: Polska wystawia czterech
   najlepszych SREBRNEGO KASKU, Anglia, Szwecja i Dania mają własne
   turnieje (po trzy miejsca), a pozostałe federacje jadą we wspólnych
   eliminacjach o trzy miejsca.
   ============================================================ */
const isJunRef = r => !!r && isJun(r);
/* ELIMINACJE JADĄ NA PRZYSZŁY SEZON, więc obowiązuje w nich ostrzejszy limit
   wieku: startuje ten, kto W KOLEJNYM ROKU wciąż będzie młodzieżowcem, czyli
   dziś ma najwyżej 20 lat. Inaczej cała czwórka wywalczałaby kwalifikację
   i traciła ją w tej samej zimie, kończąc 22 lata. */
const isJunQ = r => !!r && Number(r.age)<=20;
function ensureSgpJSeed(){
 if(G.sgpJ && G.sgpJ.top) return G.sgpJ;
 const rank=worldRanking(isJun);
 const pool=capPick(rank, SGP.natCap, SGP.natCapDef, 15);
 const take=(a,b)=>pool.slice(a,b).map(sgpRef);
 G.sgpJ={ top:take(0,SGP.junTop), ch4:take(SGP.junTop, SGP.junTop+SGP.junCh),
          wilds:take(SGP.junTop+SGP.junCh, 15), champ:null, seeded:true };
 return G.sgpJ;
}
/* Skład cyklu juniorskiego — 15 stałych uczestników, z opisem drogi. */
function sgpJLineup(){
 const S=ensureSgpJSeed(), out=[], seen=new Set(), cnt={};
 const lim=c=>(SGP.natCap[c]!=null) ? SGP.natCap[c] : SGP.natCapDef;
 const put=(r,how,hard)=>{
   if(!r || seen.has(r.id) || !isJun(r)) return false;    // 22 lata = koniec drogi juniorskiej
   const c=ctryOf(r);
   if(!hard && (cnt[c]||0) >= lim(c)) return false;
   seen.add(r.id); cnt[c]=(cnt[c]||0)+1; out.push({r, how, ctry:c}); return true;
 };
 (S.top||[]).forEach((ref,i)=>put(sgpFind(ref), 'kwalifikacja z cyklu '+(G.year-1)+' — miejsce '+(i+1)+'.', true));
 (S.ch4||[]).forEach((ref,i)=>put(sgpFind(ref), 'SGP2 Challenge — miejsce '+(i+1)+'.', true));
 (S.wilds||[]).forEach(ref=>put(sgpFind(ref), 'stała dzika karta Komisji'));
 const pool=worldRanking(isJun);
 let i=0;
 while(out.length<15 && i<pool.length) put(pool[i++], 'stała dzika karta Komisji');
 i=0;
 while(out.length<15 && i<pool.length) put(pool[i++], 'stała dzika karta Komisji', true);
 return out.slice(0,15);
}
/* Eliminacje krajowe + SGP2 CHALLENGE. Struktura odpowiedzi jest taka sama
   jak w simWorldQualifiers, żeby UI mogło renderować obie drogi tym samym kodem. */
function* simJunQualifiersGen(p, ctx, skTop4, inJun, live){
 const ex=new Set(inJun||[]);
 const meR=G.riders.find(r=>r.me);
 const meId=(meR && isJunQ(p)) ? meR.id : null;
 const quals=[], field=[];
 /* --- POLSKA: czterej najlepsi SREBRNEGO KASKU --- */
 const pol=[];
 (skTop4||[]).forEach(x=>{ const r=G.riders.find(y=>y.id===x.id && !y.retired && isJunQ(y)); if(r && !ex.has(r.id)) pol.push(r); });
 if(pol.length<SGP.qualJun.POL){
   ranking(isJunQ).filter(r=>!ex.has(r.id)).forEach(r=>{
     if(pol.length<SGP.qualJun.POL && !pol.some(x=>x.id===r.id)) pol.push(r); });
 }
 pol.slice(0,SGP.qualJun.POL).forEach(r=>field.push(worldRow(r)));
 quals.push({title:'ELIMINACJE KRAJOWE — POLSKA (U21)',
   note:'kwalifikują się zdobywcy czterech pierwszych miejsc SREBRNEGO KASKU (rocznikowo: dziś najwyżej 20 lat)',
   table: pol.slice(0,SGP.qualJun.POL).map((r,i)=>({pos:i+1, name:r.name, ctry:'POL', pts:null, me:!!r.me, through:true}))});
 /* --- ANGLIA / SZWECJA / DANIA --- */
 [['GBR','ANGLIA'],['SWE','SZWECJA'],['DEN','DANIA']].forEach(([c,label])=>{
   const q=natQual([c], SGP.qualJun[c], 'ELIMINACJE KRAJOWE U21 — '+label, null, null, ex, isJunQ);
   q.through.forEach(r=>{ if(r) field.push(r); });
   quals.push({title:q.title, note:'wyłącznie zawodnicy do 21 lat · awans: '+SGP.qualJun[c]+' pierwsze miejsca', table:q.table});
 });
 /* --- WSPÓLNE ELIMINACJE RESZTY ŚWIATA --- */
 {
  const q=natQual(SGP.restCtry, SGP.qualJun.REST, 'ELIMINACJE WSPÓLNE U21 — POZOSTAŁE KRAJE', null, null, ex, isJunQ);
  q.through.forEach(r=>{ if(r) field.push(r); });
  quals.push({title:q.title, note:'Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy — razem, awans: '+SGP.qualJun.REST, table:q.table});
 }
 /* --- SGP2 CHALLENGE --- */
 let rows=field.slice(0,16);
 rows=padField(rows,'CZE',16, rows.length?rows[rows.length-1].ovr:40, true);
 const mi = meId!=null ? rows.findIndex(r=>r.id===meId) : -1;
 let T=null, chLive=false;
 if(live && mi>=0){
   const dec = yield* bigMatchAsk({kind:'ind', stage:'SGP2 CHALLENGE',
     title:'SGP2 CHALLENGE — OSTATNIA RUNDA ELIMINACJI DO IMŚJ2'}, null);
   if(dec==='ride'){
     const lv=liveNewState();
     T = yield* liveInd20Gen(rows, mi, ctx, lv,
       {title:'SGP2 CHALLENGE', stage:'SGP2 CHALLENGE', sub:'16 juniorów · tabela 20-biegowa · TOP 4 wchodzi do cyklu IMŚJ2'});
     chLive=true; liveWrapUp(lv, 'SGP2 CHALLENGE');
   }
 }
 if(!T) T=meeting20(rows, mi, mi>=0?ctx:null);
 const chTable=T.map((t,i)=>({pos:i+1, name:t.name, ctry:(rows.find(r=>r.id===t.id)||{}).ctry||'POL',
   pts:t.pts, me:t.me, codes:t.codes}));
 let money=0;
 if(mi>=0){
   const pos=T.findIndex(t=>t.me)+1;
   money=Math.round(((SGP.chPrize[pos-1]||SGP.chPrize[SGP.chPrize.length-1])+SGP.chStartFee)*SGP.chJunMul);
 }
 return {quals, challenge:{title:'SGP2 CHALLENGE — OSTATNIA RUNDA ELIMINACJI DO IMŚJ2'+(chLive?' · PRZEJECHANY OSOBIŚCIE':''),
   table:chTable, rode:mi>=0, live:chLive,
   mePos: mi>=0 ? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0 ? T.find(t=>t.me).pts : 0, money},
   order:T.map(t=>rows.find(r=>r.id===t.id)).filter(Boolean)};
}
