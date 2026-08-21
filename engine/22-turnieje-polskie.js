/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: TURNIEJE POLSKIE
   IMP, MIMP, Złoty/Srebrny/Brązowy Kask, szkoleniowe, PALET
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 3168-3440 oryginału).
   ============================================================ */
/* ============================================================
   Symulacja całego sezonu indywidualnego
   ============================================================ */
/* WIELKI TURNIEJ: simIndividual jest generatorem z tego samego powodu, co
   resolveSeason — ostatni turniej finałowy IMP można przejechać ręcznie,
   a to znaczy, że symulacja musi umieć się w tym miejscu zatrzymać. */
function simIndividual(p, effOvr, defP, excP){
 const g=simIndividualGen(p, effOvr, defP, excP, false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
function* simIndividualGen(p, effOvr, defP, excP, live){
 const me=G.riders.find(r=>r.me);
 me.age=p.age; me.ovr=cl(Math.round(effOvr),1,99); me.name=p.name;
 const ctx={defP, excP};
 const out={};
 const byId=id=>G.riders.find(r=>r.id===id);
 const fieldOf=arr=>arr.map(r=>({id:r.id,name:r.name,age:r.age,ovr:r.ovr}));
 const meIn=f=>f.findIndex(r=>r.id===me.id);
 
 /* ---------- ZŁOTY KASK — jeden turniej finałowy, bez ograniczeń wieku ---------- */
 {
  const rank=ranking();
  const nom=rank.slice(0,15);
  const wildPool=rank.slice(15,32);
  if(wildPool.length) nom.push(pick(wildPool));                 // dzika karta GKSŻ
  const f=fieldOf(nom.slice(0,16));
  const mi=meIn(f);
  const T=meeting20(f, mi, mi>=0?ctx:null);
  out.zk=finishInd({name:'ZŁOTY KASK', sub:'Memoriał Jerzego Szczakiela · jeden turniej finałowy · TOP 4 jedzie do SGP CHALLENGE',
    rode:mi>=0, rounds:[roundInfo('FINAŁ ZŁOTEGO KASKU',T,mi)],
    podium:T.slice(0,3).map(t=>t.name), mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0,
    mePts: mi>=0? T.find(t=>t.me).pts : 0,
    /* TOP 4 Złotego Kasku = polskie eliminacje do SGP Challenge (patrz simWorldQualifiers). */
    top4:T.slice(0,4).map(t=>({id:t.id, name:t.name}))});
  out.zkTop4=out.zk.top4;
 }
 /* ---------- SREBRNY KASK — młodzieżowcy (twardo U21), eliminacje + finał ---------- */
 out.sk = kaskYouth('SREBRNY KASK','podstawa nominacji do IMŚJ', isJun, me, ctx, fieldOf, meIn);
 /* ---------- BRĄZOWY KASK — twardo do 19 lat, eliminacje + finał ---------- */
 out.bk = kaskYouth('BRĄZOWY KASK','podstawa nominacji do IMEJ', isU19, me, ctx, fieldOf, meIn);

 /* ============================================================
    TURNIEJE SZKOLENIOWE — CYKL OŚMIU TURNIEJÓW
    ------------------------------------------------------------
    ZMIANA (patch 21.08.2026): to nie jest JEDEN turniej, tylko CYKL OŚMIU
    turniejów rozgrywanych w sezonie (art. 61: tabela 20-biegowa, 16 zawodników
    + 2 rezerwowych, wyłącznie krajowi zawodnicy młodzieżowi z klubów, które nie
    uzyskały prawa startu w fazie play-off). Wcześniej gra rozgrywała jedną
    rundę i uznawała sprawę za zamkniętą — reszta cyklu "toczyła się bez twojego
    udziału", co przy ośmiu turniejach w kalendarzu było po prostu nieprawdą.
    Klasyfikacja końcowa cyklu to suma punktów ze wszystkich ośmiu rund;
    przy równej liczbie punktów wyżej ten, kto miał lepsze miejsce w turnieju
    rozegranym PÓŹNIEJ.
    ============================================================ */
 {
  const eligible = isJun(p) && clubMissedPlayoffs(p.club);
  const pool = ranking(r=>isJun(r) && clubMissedPlayoffs(r.club));
  let nom = pool.slice(0,16);
  if(eligible && !nom.some(r=>r.id===me.id)){
    const meRow = pool.find(r=>r.id===me.id);
    if(meRow){ nom = nom.slice(0,15); nom.push(meRow); }
  }
  const sub='cykl 8 turniejów dla juniorów klubów spoza czołowej czwórki (art. 61) · tabela 20-biegowa · 16 zawodników + 2 rezerwowych · klasyfikacja = suma punktów z ośmiu rund';
  if(eligible && nom.length>=16){
    const f=fieldOf(nom.slice(0,16));
    const mi=meIn(f);
    const N=SZK_ROUNDS;
    const total={}; f.forEach((r,k)=>total[k]=0);
    const roundPos=f.map(()=>[]);
    const szkRounds=[]; let rode=false;
    for(let t=0;t<N;t++){
      const T=meeting20(f, mi, mi>=0?ctx:null);
      T.forEach((row,pos)=>{ const k=f.findIndex(r=>r.id===row.id); if(k>=0){ total[k]+=row.pts; roundPos[k].push(pos+1); } });
      if(mi>=0) rode=true;
      szkRounds.push(roundInfo('TURNIEJ SZKOLENIOWY — RUNDA '+(t+1)+'/'+N, T, mi));
    }
    const order=f.map((r,k)=>k).sort((a,b)=>{
      if(total[b]!==total[a]) return total[b]-total[a];
      for(let t=N-1;t>=0;t--){ const d=(roundPos[a][t]||99)-(roundPos[b][t]||99); if(d) return d; }
      return 0;
    });
    const cls=order.map(k=>({name:f[k].name, pts:total[k], me:k===mi}));
    const mePos = mi>=0 ? order.indexOf(mi)+1 : 0;
    out.szk=finishInd({name:'TURNIEJE SZKOLENIOWE', sub, rode, rounds:szkRounds, classification:cls,
      clsLabel:'KLASYFIKACJA KOŃCOWA CYKLU (suma punktów z '+N+' turniejów)',
      podium:cls.slice(0,3).map(c=>c.name), mePos, mePts: mi>=0? total[mi] : 0});
  } else {
    out.szk=finishInd({name:'TURNIEJE SZKOLENIOWE', sub, rode:false, rounds:[], podium:[], mePos:0, mePts:0});
  }
 }

 /* ============================================================
    PUCHAR PALET — MIĘDZYNARODOWY CYKL DRUGIEJ PÓŁKI
    ------------------------------------------------------------
    ZMIANY (patch 21.08.2026), obie ze zgłoszenia gracza:
      1) cykl nazywa się teraz PUCHAR PALET (dawniej "Puchar MACEC"),
      2) w cyklu jeżdżą TEŻ POLACY. Wcześniej stawkę robiło piętnastu
         obcokrajowców i samotny Gracz — teraz obok niego startuje kilku
         krajowych zawodników z tej samej półki (ten sam przedział OVR),
         a resztę uzupełniają rywale ze Słowacji, Czech, Rumunii, Bułgarii,
         Węgier i Ukrainy.
    Format bez zmian: 16 zawodników, tabela 20-biegowa, kilka rund tej samej
    stawki, klasyfikacja końcowa to suma punktów. Art. 1.5 regulaminu: przy
    remisie punktowym wyżej ten, kto miał lepsze miejsce w turnieju rozegranym
    PÓŹNIEJ — liczone tu wstecz, runda po rundzie.
    Kwalifikacja: umiarkowany OVR — to cykl dla zawodników, którzy nigdy nie
    zobaczą Grand Prix, nie dla gwiazd klubu.
    ============================================================ */
 {
  const paletOk = p.ovr>=18 && p.ovr<=62;
  const sub='międzynarodowy cykl — POL/SVK/CZE/ROU/BGR/HUN/UKR · tabela 20-biegowa · klasyfikacja = suma punktów z rund';
  if(paletOk){
   /* POLACY W STAWCE: krajowi zawodnicy o zbliżonym poziomie (18-62 OVR),
      z pominięciem Gracza — to oni robią cykl "polskim", a nie tylko wyjazdowym. */
   const polPool = ranking(r=>!r.me && r.ovr>=16 && r.ovr<=66);
   const polN = cl(R(4,6), 0, polPool.length);
   const poles = shuffle(polPool.slice(0, Math.min(polPool.length, 22))).slice(0, polN)
     .map(r=>({id:r.id, name:r.name+' (POL)', age:r.age, ovr:r.ovr, ctry:'POL'}));
   const foreignN = 15-poles.length;
   const foreign=shuffle(PALET_NAMES.slice()).slice(0,foreignN).map((x,k)=>{
     const bump=(x.c==='ROU'||x.c==='BGR'||x.c==='HUN'||x.c==='UKR') ? R(2,10) : R(-6,4);
     return {id:-1000-k, name:x.n+' ('+x.c+')', age:R(19,34), ovr:cl(Math.round(G.p.ovr+bump+gauss(0,6)),15,70), ctry:x.c};
   });
   const meRow={id:me.id, name:me.name, age:p.age, ovr:cl(Math.round(effOvr),1,99), ctry:'POL'};
   const field=shuffle([meRow, ...poles, ...foreign]).slice(0,16);
   const mi=field.findIndex(r=>r.id===me.id);
   const roundsN=R(3,4);
   const total={}; field.forEach((r,k)=>total[k]=0);
   const roundPos=field.map(()=>[]);           // miejsce w KAŻDEJ rundzie — materiał na tiebreak art. 1.5
   const paletRounds=[]; let rode=false;
   for(let t=0;t<roundsN;t++){
    const T=meeting20(field, mi, mi>=0?ctx:null);
    T.forEach((row,pos)=>{ const k=field.findIndex(r=>r.id===row.id); if(k>=0){ total[k]+=row.pts; roundPos[k].push(pos+1); } });
    if(mi>=0) rode=true;
    paletRounds.push(roundInfo('PUCHAR PALET — RUNDA '+(t+1), T, mi));
   }
   const order=field.map((r,k)=>k).sort((a,b)=>{
     if(total[b]!==total[a]) return total[b]-total[a];
     for(let t=roundsN-1;t>=0;t--){ const d=(roundPos[a][t]||99)-(roundPos[b][t]||99); if(d) return d; }
     return 0;
   });
   const cls=order.map(k=>({name:field[k].name, pts:total[k], me:k===mi}));
   const mePos = mi>=0 ? order.indexOf(mi)+1 : 0;
   out.palet=finishInd({name:'PUCHAR PALET', sub, rode, rounds:paletRounds, classification:cls,
     clsLabel:'KLASYFIKACJA KOŃCOWA CYKLU (suma punktów ze wszystkich rund)',
     podium:cls.slice(0,3).map(c=>c.name), mePos, mePts: mi>=0? total[mi] : 0,
     poles:poles.length+1});
  } else {
   out.palet=finishInd({name:'PUCHAR PALET', sub, rode:false, rounds:[], podium:[], mePos:0, mePts:0});
  }
  out.macec=out.palet;                 // zgodność wsteczna ze starymi zapisami
 }

 /* ---------- MIMP — eliminacje + finał, TYLKO juniorzy U21 ----------
    Filtr wieku jest twardy: zawodnik po 21. urodzinach (w tym Gracz) nie ma
    prawa startu i nie pojawi się ani w eliminacjach, ani w finale. */
 {
  const pool=ranking(isJun).filter(isJun);
  const rounds=[]; let rode=false;
  const qual=[];
  for(let g=0; g<2; g++){
    const grp=pool.filter((_,i)=>i%2===g).slice(0,16);
    if(grp.length<16) continue;
    const f=fieldOf(grp), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE MIMP — GRUPA '+(g+1),T,mi));}
    T.slice(0,8).forEach(t=>qual.push(byId(t.id)));
  }
  if(qual.length>=16){
    const f=fieldOf(qual.slice(0,16)), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('FINAŁ MIMP',T,mi));}
    out.mimp=finishInd({name:'MŁODZIEŻOWE INDYWIDUALNE MISTRZOSTWA POLSKI', sub:'eliminacje + finał · tylko juniorzy krajowi',
      rode, rounds, podium:T.slice(0,3).map(t=>t.name),
      mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0? T.find(t=>t.me).pts : 0});
    G.nextMimpChamp=T[0].name;
  } else out.mimp=finishInd({name:'MIMP', rode, rounds, podium:[], mePos:0, mePts:0});
 }
 
 /* ---------- IMP — eliminacje → challenge → trzy turnieje finałowe ---------- */
 {
  const pool=ranking();
  const rounds=[]; let rode=false;
  const toChallenge=[];
  for(let g=0; g<4; g++){
    const grp=pool.filter((_,i)=>i%4===g).slice(0,16);
    if(grp.length<16) continue;
    const f=fieldOf(grp), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE IMP — GRUPA '+(g+1),T,mi));}
    T.slice(0,4).forEach(t=>toChallenge.push(byId(t.id)));      // po 4 z każdej eliminacji
  }
  let finalists=[];
  if(toChallenge.length>=16){
    const f=fieldOf(toChallenge.slice(0,16)), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('CHALLENGE IMP',T,mi));}
    finalists=T.slice(0,7).map(t=>byId(t.id));                  // 7 najlepszych z challengu
  }
  // miejsca gwarantowane: medaliści IMP z zeszłego roku, czołówka rankingu (cykl GP),
  // Młodzieżowy Mistrz Polski z zeszłego roku, dzika karta
  const add=r=>{ if(r && !r.retired && !finalists.some(x=>x.id===r.id)) finalists.push(r); };
  (G.recIMP||[]).forEach(n=>add(G.riders.find(r=>r.name===n&&!r.retired)));
  if(G.recMIMP) add(G.riders.find(r=>r.name===G.recMIMP&&!r.retired));
  pool.slice(0,6).forEach(r=>add(byId(r.id)));                  // uczestnicy cyklu GP
  const wild=pool.slice(6,26); if(wild.length) add(byId(pick(wild).id));
  let i=0; while(finalists.length<16 && i<pool.length){add(byId(pool[i].id)); i++;}
  finalists=finalists.slice(0,16);
 
  const f=fieldOf(finalists), mi=meIn(f);
  const total={}; f.forEach((r,k)=>total[k]=0);
  const finRounds=[];
  for(let t=0;t<3;t++){
    let Rn=null;
    /* OSTATNI TURNIEJ FINAŁOWY IMP — tu rozstrzyga się mistrzostwo Polski,
       więc to jest moment na pytanie „jedziesz czy przesymulować". */
    if(live && t===2 && mi>=0){
      const dec = yield* bigMatchAsk({kind:'ind', stage:'IMP',
        title:'TRZECI TURNIEJ FINAŁOWY INDYWIDUALNYCH MISTRZOSTW POLSKI'}, null);
      if(dec==='cry') break;
      if(dec==='ride') Rn = yield* liveImpFinalGen(f, mi, ctx,
        {title:'IMP — TRZECI TURNIEJ FINAŁOWY', stage:'IMP',
         sub:'tabela 20-biegowa + półfinał + bieg finałowy (art. 634)'});
    }
    if(!Rn) Rn=impFinalRound(f, mi, mi>=0?ctx:null);
    Object.keys(Rn.score).forEach(k=>total[k]+=Rn.score[k]);
    if(mi>=0) rode=true;
    finRounds.push({title:'TURNIEJ FINAŁOWY IMP '+(t+1)+(Rn.live?' · PRZEJECHANY OSOBIŚCIE':''),
      rows:Rn.cls.map((ix,pos)=>({pos:pos+1,name:f[ix].name,pts:Rn.score[ix],me:ix===mi})),
      me: mi>=0? {pts:Rn.mePts, codes:Rn.meCodes, pos:Rn.cls.indexOf(mi)+1} : null});
  }
  const cls=f.map((r,k)=>({name:r.name, pts:total[k], me:k===mi})).sort((a,b)=>b.pts-a.pts);
  out.imp=finishInd({name:'INDYWIDUALNE MISTRZOSTWA POLSKI', sub:'eliminacje → challenge → trzy turnieje finałowe',
    rode, rounds:[...rounds,...finRounds], classification:cls,
    podium:cls.slice(0,3).map(c=>c.name),
    mePos: mi>=0? cls.findIndex(c=>c.me)+1 : 0, mePts: mi>=0? cls.find(c=>c.me).pts : 0,
    inFinal: mi>=0});
  G.nextIMP=cls.slice(0,3).map(c=>c.name);
 }
 return out;
}
// etap, na którym skończyłeś dane rozgrywki (0 = nie awansowałeś do finału)
function finishInd(c){
 const mine=(c.rounds||[]).filter(x=>x.me);
 c.stage = mine.length ? mine[mine.length-1].title : '—';
 c.outFinal = c.rode && !c.mePos;
 return c;
}
function kaskYouth(name, sub, filt, me, ctx, fieldOf, meIn){
 // TWARDA WERYFIKACJA WIEKU: w turniejach młodzieżowych nie ma prawa startu
 // nikt po 21. roku życia — filtr turnieju nakładamy na warunek U21, nie odwrotnie.
 const pool=ranking(r=>isJun(r)&&filt(r)).filter(isJun);
 const rounds=[]; let rode=false; const qual=[];
 for(let g=0; g<2; g++){
   const grp=pool.filter((_,i)=>i%2===g).slice(0,16);
   if(grp.length<16) continue;
   const f=fieldOf(grp), mi=meIn(f);
   const T=meeting20(f, mi, mi>=0?ctx:null);
   if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE — GRUPA '+(g+1),T,mi));}
   T.slice(0,8).forEach(t=>qual.push(G.riders.find(r=>r.id===t.id)));
 }
 if(qual.length<16) return finishInd({name, sub, rode, rounds, podium:[], mePos:0, mePts:0});
 const f=fieldOf(qual.slice(0,16)), mi=meIn(f);
 const T=meeting20(f, mi, mi>=0?ctx:null);
 if(mi>=0) rode=true;
 rounds.push(roundInfo('FINAŁ — '+name, T, mi));
 return finishInd({name, sub, rode, rounds, podium:T.slice(0,3).map(t=>t.name),
   mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0? T.find(t=>t.me).pts : 0,
   /* TOP 4 SREBRNEGO KASKU = polskie eliminacje do SGP2 CHALLENGE (patrz simJunQualifiers). */
   top4:T.slice(0,4).map(t=>({id:t.id, name:t.name}))});
}
