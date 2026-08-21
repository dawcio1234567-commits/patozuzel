/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIVE MECZ
   Generator meczu drużynowego na żywo
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4837-5337 oryginału).
   PATCH 22.08.2026 (Sprint 3): AI trenera pod taśmą — sympatie decydują,
   kogo trener zdejmuje rezerwą taktyczną, regulamin rezerw jest twardy,
   a prośba o wpuszczenie wbrew regulaminowi kończy się jednym zdaniem.
   ============================================================ */
/* ============================================================
   9d. SPOTKANIE NA ŻYWO — GENERATOR
   ------------------------------------------------------------
   Zwraca DOKŁADNIE to samo, co simMeeting(): wynik, karty biegów, box,
   linię Gracza i składy. Dzięki temu dwumecz, tabela, karta meczowa
   i statystyki nie wiedzą nawet, że mecz był jechany ręcznie.
   ============================================================ */
function* liveMeetingGen(homeName, awayName, ctx, meId, meta){
 const bH = ctx&&ctx.bias&&ctx.bias.club===homeName?ctx.bias:null;
 const bA = ctx&&ctx.bias&&ctx.bias.club===awayName?ctx.bias:null;
 const LH=bestLineup(homeName, bH, 0, false);
 const LA=bestLineup(awayName, bA, 0, false);
 if(!LH||!LA) return null;
 const inL = L => !!(L && Object.values(L).some(r=>r&&r.id===meId));
 if(!inL(LH) && !inL(LA)) return null;             // trenera nie przekonałeś — nie ma czego jechać
 const mySide  = inL(LH)?'h':'a';
 const myClub  = mySide==='h'?homeName:awayName;
 const oppClub = mySide==='h'?awayName:homeName;

 const map={}, sideOf={};
 for(let n=1;n<=7;n++){
   if(LH[n]){ map[n+8]=LH[n]; sideOf[n+8]='h'; }
   if(LA[n]){ map[n]  =LA[n]; sideOf[n]  ='a'; }
 }
 const REF={h:refFor(homeName), a:refFor(awayName)};
 const TRB={h:clubTrouble(homeName), a:clubTrouble(awayName)};
 const st={}; Object.values(map).forEach(r=>{ if(r) st[r.id]={r, starts:0, pts:0, bon:0, codes:[], num:null, res:resBox()}; });
 for(let n=1;n<=15;n++) if(map[n]) st[map[n].id].num=n;
 const myNum = st[meId] ? st[meId].num : null;
 const set=HEAT_SETS[R(0,1)];
 let hs=0, as=0;
 const tacticUsed={h:false,a:false};
 const heats=[];
 const reserves=side=>[6,7].map(n=>map[numFor(side,n)]).filter(Boolean);
 const nameOf=side=>side==='h'?homeName:awayName;
 /* ------------------------------------------------------------
    SPRINT 3: TRENER TWOJEJ DRUŻYNY.
    Relacja liczona raz na bieg (relNow()), a nie przy każdym renderze —
    zmienia się w trakcie meczu tylko przez atmosferę i twoją dyspozycję,
    więc odświeżamy ją przy każdym snapie, ale bez iterowania kadry
    (coachRel czyta riderLevel klubu, nie sumuje zawodników).
    ------------------------------------------------------------ */
 const myCoach = clubCoach(myClub) ||
   {id:0, name:'Kierownik drużyny', type:'kolega', skill:50, auth:50, nerve:50, seasons:0};
 const relNow  = () => coachRel(myClub, st[meId]?st[meId].r:meRider());
 const pressNow= () => coachPressure(myClub);

 const live={
   grip:null, ideal:null, gear:2, mech:null, spyKnown:false,
   yellow:0, red:false, outOfMeeting:false, benched:false, benchNext:false,
   pushed:0, crashed:0, hurt:0, medGain:0, enemy:0, msgs:[], story:[],
   // Sprint 1: kartki (engine/30) i zastępstwa (engine/29) muszą znać kartotekę,
   // klub i program startów Gracza — podajemy je jawnie, bez zgadywania po nazwach
   meId, club:myClub, st, inRace:false, medSubId:null,
   /* --- SPRINT 2 ---
      fallAsk    : ten generator UMIE pokazać modal „Leż / Wstawaj i zbiegnij",
                   więc engine/29b woła go zamiast wykluczać cię od razu;
      hurtOut    : rywale, których zniosła karetka — nie wracają pod taśmę;
      heatsDone  : ile biegów faktycznie odjechano (próg 8/12 przy odwołaniu);
      po         : czy to faza play-off / play-down (wtedy próg to 12 biegów). */
   fallAsk:true, hurtOut:[], heatsDone:0, protests:0, abandoned:false,
   po: !!(meta && meta.po),
   /* --- SPRINT 3 ---
      refuse     : ostatnia odmowa trenera (regulamin) — pokazuje ją ui/09;
      pushTarget : za kogo trener obiecał cię wpuścić. */
   refuse:null, pushTarget:null, coachRow:0
 };
 /* Pozostałe biegi Gracza (program 1-13, limit 5 startów wg art. 719).
    skipCurrent = bieg właśnie jechany już się liczy (kraksa w jego trakcie). */
 let curH=0;
 live.restHeats=(skipCurrent)=>liveProgramHeatsLeft(set, myNum,
   curH + (skipCurrent?1:0), 5 - ((st[meId]?st[meId].starts:0) + (live.inRace?1:0)));

 /* --- SNAPSHOT DLA INTERFEJSU --- */
 const rowsOf=side=>Object.values(st).filter(s=>sideOf[s.num]===side)
   .sort((a,b)=>(a.num||99)-(b.num||99))
   .map(s=>({num:s.num, name:s.r.name, pts:s.pts, bon:s.bon, starts:s.starts, me:s.r.id===meId, codes:s.codes.slice()}));
 const coachSnap=()=>{
   const REL=relNow(), P=pressNow(), s=st[meId];
   return {name:myCoach.name, type:REL.type.n, short:REL.type.short, skill:myCoach.skill,
     auth:myCoach.auth, rel:REL.rel, status:REL.status.n, statusCol:REL.status.c,
     gap:REL.gap, press:P.v, hot:P.hot, quote:coachQuote(REL,P),
     res: s ? {plain:s.res.plain, tactic:s.res.tactic,
               plainMax: isJun(s.r)?RESB.junPlain:null,
               tacticMax:isJun(s.r)?RESB.junTactic:null, jun:isJun(s.r)} : null};
 };
 const snap=(phase, extra)=>{
   G.live=Object.assign({
     title:meta.title, stage:meta.stage, leg:meta.leg, legs:meta.legs,
     home:homeName, away:awayName, myClub, oppClub, mySide, myNum,
     hs, as, phase,
     grip: live.grip==null?null:{i:live.grip, n:BIGM.grip[live.grip].n, d:BIGM.grip[live.grip].d},
     gear: live.gear, ideal: live.spyKnown ? live.ideal : null,
     mech: live.mech, fit: live.ideal==null?null:liveFit(live.gear, live.ideal),
     cards:{y:live.yellow, r:live.red}, outOfMeeting:live.outOfMeeting, benched:live.benched,
     outWhy: live.outWhy||null, excluded: live.excludedCount||0,
     excludedCode: live.forceCode||null, excludedHeats: (live.excludedHeats||[]).slice(),
     medSub: live.medSub ? live.medSub.name : null, injured: !!live.medOut, twoMin: !!live.twoMinutes,
     msgs: live.msgs.slice(), story: live.story.slice(-14),
     me: st[meId] ? {starts:st[meId].starts, pts:st[meId].pts, bon:st[meId].bon,
                     codes:st[meId].codes.slice(), num:st[meId].num} : null,
     rows:{h:rowsOf('h'), a:rowsOf('a')},
     heats:heats.map(h=>({label:h.label, res:h.res})),
     race:null, coach:null, next:null, push:null, fall:null,
     /* SPRINT 3: kim jest trener, co o tobie myśli i czy właśnie ci odmówił */
     coachInfo: coachSnap(), refuse: live.refuse||null,
     /* SPRINT 2: pasek „zawody przerwane", protest i cena wyjazdu z parku */
     abandon: live.abandoned ? {why:live.abandonWhy, counted:live.abandonCounted,
                                heat:live.abandonHeat, need:live.abandonNeed, by:live.abandonBy} : null,
     protest: {show:false, count:live.protests||0,
               cancel: liveProtestCancelChance(live), yellow: liveProtestYellowChance(live)},
     leaveCancel: liveLeaveCancelChance(live),
     hurtRivals: live.hurtRivals||0, reruns: live.rc ? (live.rc.reruns||0) : 0
   }, extra||{});
   return {ui:'live'};
 };
 const say=(...xs)=>{ xs.filter(Boolean).forEach(x=>{ live.msgs.push(x); live.story.push(x); }); };
 const clearMsg=()=>{ live.msgs=[]; };

 /* --- BUDOWA POLA BIEGU (jak w simMeeting) --- */
 const buildEntries=(nums)=>{
   const entries=[];
   const inHeat=()=>entries.map(e=>e.r.id);
   const hurt = id => (live.hurtOut||[]).includes(id);   // Sprint 2: zniesiony z toru
   nums.forEach(n=>{
     const side = sideOf[n] || (isHomeNum(n)?'h':'a');
     let r=map[n];
     if(!r || st[r.id].starts>=5 || hurt(r.id) || (r.id===meId && live.outOfMeeting)){
       const name = nameOf(side);
       const cands = reserves(side).concat(availableRiders(name).filter(x=>st[x.id]))
            .filter(x=>st[x.id].starts<5 && !inHeat().includes(x.id) && !hurt(x.id)
                       && plainResOk(st[x.id], x)
                       && !(x.id===meId && live.outOfMeeting))
            .sort((a,b)=>b.ovr-a.ovr);
       // Sprint 1: w twoje biegi wchodzi zawodnik wskazany przez liveMedSub()
       const wasMe = !!(map[n] && map[n].id===meId);
       r = (wasMe && live.medSubId ? cands.find(x=>x.id===live.medSubId) : null) || cands[0];
       if(!r) return;
       st[r.id].res.plain++;              // Sprint 3: limit startów z rezerwy zwykłej
     }
     if(inHeat().includes(r.id)) return;
     const pnum=(st[r.id]&&st[r.id].num!=null)?st[r.id].num:(n>0?n:null);
     entries.push({r, side, home:side==='h', num:pnum, ref:REF[side], trouble:TRB[side]});
   });
   // pod taśmą para nie może stać obok siebie — ta sama funkcja co w engine/12
   return gateOrder(entries);
 };
 const applyRes=(res, label, nominated)=>{
   res.forEach(x=>{
     const s=st[x.r.id]; if(!s) return;
     s.starts++; s.pts+=x.pts; s.bon+=x.bon;
     s.codes.push(x.out || (String(x.pts)+(x.bon?'*':'')));
     if(x.side==='h') hs+=x.pts; else as+=x.pts;
   });
   heats.push({label, nominated:!!nominated,
     res:res.map(x=>({id:x.r.id,name:x.r.name,num:x.num,gate:x.gate||null,helmet:x.helmet||null,
       pts:x.pts,bon:x.bon||0,out:x.out,side:x.side}))});
   live.heatsDone=heats.length;      // Sprint 2: próg 8/12 biegów przy odwołaniu zawodów
 };
 /* Punkt bonusowy (art. 720) — ta sama funkcja co w leagueHeat. NAPRAWA
    (Sprint 1): stała tu druga kopia starej reguły, liczyła bonusy inaczej. */
 const bonusOf=(res)=>applyBonus(res);
 /* Zwykły, nieinteraktywny bieg. */
 const simHeat=(nums, label, nominated)=>{
   const entries=buildEntries(nums);
   if(entries.length<2) return;
   const res=leagueHeat(entries, null, null);
   applyRes(res, label, nominated);
 };

 /* ------------------------------------------------------------
    REZERWA TAKTYCZNA — DECYZJA TRENERA AI (Sprint 3)
    ------------------------------------------------------------
    Warunek wejścia jest regulaminowy i twardy: biegi III-XIII, strata
    co najmniej 6 punktów (RESB.tacticDiff), klub bez zaległości u tunera.
    Reszta to już charakter trenera:
      · KOGO ZDEJMUJE — w obcej drużynie po prostu najsłabszego. W TWOJEJ
        patrzy na to, co widzi dziś na torze, ale przez własne sympatie:
        zawodnika, którego nie lubi, zdejmie przy pierwszej wymówce,
        a ulubieńca zostawi nawet po dwóch zerach. Trener pod presją
        (coachPressure) zdejmuje szybciej — bo musi komuś pokazać, że reaguje.
      · KOGO WPUSZCZA — najlepszego, ale znowu z korektą na sympatię.
      · CZEGO NIE ZROBI NIGDY — nie zdejmie młodzieżowca po to, żeby wsadzić
        seniora (tacticLegal), i nie wpuści młodzieżowca z rezerwy taktycznej
        drugi raz w meczu (tacticResOk).
    ------------------------------------------------------------ */
 const tacticNums=function*(h, nums){
   const pairs=[['h',hs-as],['a',as-hs]];
   for(const [side,diff] of pairs){
     if(h<2 || tacticUsed[side] || diff>RESB.tacticDiff) continue;
     if(TRB[side]>=10) continue;
     const name=nameOf(side);
     const co=clubCoach(name);
     // nerwy trenera: przy stracie dokładnie 6-7 punktów spokojny jeszcze czeka
     if(diff>=RESB.tacticDiff-1 && !chance(cl(35+(co?co.nerve:50)*0.65, 20, 96))) continue;
     const mine=nums.filter(n=>(sideOf[n]||(isHomeNum(n)?'h':'a'))===side);
     if(mine.length<2) continue;
     const pool=mine.map(n=>map[n]).filter(Boolean);
     const relOf=r=>coachLike(name, r);
     let weak;
     if(side===mySide){
       /* Silnik ligowy bierze po prostu najsłabszego OVR-em — i to zostaje dla
          drużyny przeciwnej. W TWOJEJ drużynie, w meczu jechanym osobiście,
          trener patrzy na to, co widzi na torze DZISIAJ, plus na to, kogo lubi.
          Dzięki temu awantura z trenerem („chcesz mnie zmienić?") jest realną
          sytuacją meczową, a nie ciekawostką dla zawodnika z najniższym OVR. */
       const P=pressNow();
       const meetForm=r=>{
         const x=st[r.id]; let v=(x&&x.starts) ? x.pts/x.starts : 9;
         v += relOf(r)*0.012;                                   // sympatia ≈ ±1,2 pkt/bieg
         if(r.id===meId && P.hot && relOf(r)<0) v-=0.35;        // trener pod presją szuka winnego
         return v;
       };
       weak = pool.slice().sort((a,b)=> meetForm(a)-meetForm(b) || a.ovr-b.ovr)[0];
     } else {
       weak = pool.slice().sort((a,b)=> (a.ovr+relOf(a)*0.16)-(b.ovr+relOf(b)*0.16))[0];
     }
     if(!weak) continue;
     const cand=availableRiders(name)
       .filter(r=>st[r.id] && st[r.id].starts<5 && r.id!==weak.id
                  && !mine.some(n=>map[n]&&map[n].id===r.id)
                  && tacticResOk(st[r.id], r) && tacticLegal(weak, r))
       .sort((a,b)=>(b.ovr+relOf(b)*0.16)-(a.ovr+relOf(a)*0.16))[0];
     if(!cand) continue;
     const better = side===mySide
       ? (cand.ovr > weak.ovr-8 && ((st[weak.id]&&st[weak.id].starts)? st[weak.id].pts/st[weak.id].starts : 9)<1.05)
       : (cand.ovr > weak.ovr);
     if(!better) continue;
     /* TO CIEBIE CHCĄ ZDJĄĆ — masz prawo się z tym nie zgodzić. */
     if(weak.id===meId && !live.outOfMeeting){
       const keep = yield* coachFight(cand);
       if(keep) continue;
     }
     tacticUsed[side]=true;
     if(st[weak.id]) st[weak.id].codes.push('-');
     if(st[cand.id]) st[cand.id].res.tactic++;
     const vkey=-cand.id;
     nums=nums.map(n=>map[n]&&map[n].id===weak.id ? vkey : n);
     map[vkey]=cand; sideOf[vkey]=side;
   }
   return nums;
 };
 /* Trener chce cię zmienić. Trzy drogi, każda z ceną.
    SPRINT 3: sympatia trenera przesuwa oba procenty — z człowiekiem, który
    cię lubi, dogadasz się słowem; z takim, który cię nie znosi, nie dogadasz
    się w ogóle, więc zostaje awantura. */
 const coachFight=function*(cand){
   const p=G.p, S=G.S, REL=relNow();
   const argue = Math.round(cl(BIGM.argueBase + (p.med-50)*0.12 + (S.atm-50)*0.12 + (p.loyalty-40)*0.10
                              + REL.rel*0.30, 5, 90));
   const insult= Math.round(cl(BIGM.insultBase + (p.med-50)*0.16 - (p.prof-50)*0.10
                              + REL.rel*0.12, 8, 94));
   clearMsg();
   const act = yield snap('coach', {coach:{who:cand.name, ovr:cand.ovr, argue, insult,
     coach:myCoach.name, type:REL.type.n, rel:REL.rel, status:REL.status.n}});
   const a=(act&&act.a)||'accept';
   if(a==='accept'){
     say('Zsiadasz z motocykla bez słowa. Kierownik drużyny klepie cię w ramię, co w tej branży znaczy „nie masz racji, ale dziękuję".');
     S.atm=cl(S.atm+2,0,100);
     return false;
   }
   if(a==='argue'){
     if(chance(argue)){
       say('Kłócisz się przy busie, wymachując rękawicą. '+myCoach.name+' macha ręką: „Jedź, ale to na twoją odpowiedzialność."');
       S.atm=cl(S.atm-4,0,100);
       return true;
     }
     say('Kłótnia trwała dokładnie tyle, ile trzeba, żeby mechanik zdążył odpalić motocykl rywala z twojej drużyny. Jedzie '+cand.name+'.');
     S.atm=cl(S.atm-9,0,100);
     return false;
   }
   /* WYZWISKA — działa częściej, kosztuje nieporównanie więcej */
   if(chance(insult)){
     say('Nazwałeś trenera w sposób, który spiker musiał zagłuszyć muzyką. '+myCoach.name+' zbladł i powiedział: „Jedź."');
     S.atm=cl(S.atm-20,0,100);
     G.S.bigProf=(G.S.bigProf||0)-6; p.prof=cl(p.prof-6,0,99);
     p.med=cl(p.med+7,0,99); G.S.bigMed=(G.S.bigMed||0)+7;
     return true;
   }
   say('Wyzwiska poszły w eter przez otwarty mikrofon kamery przy parku maszyn. Trener nie odpowiedział, tylko wpisał '+cand.name+'.');
   S.atm=cl(S.atm-26,0,100);
   G.S.bigProf=(G.S.bigProf||0)-12; p.prof=cl(p.prof-12,0,99);
   p.med=cl(p.med+10,0,99); G.S.bigMed=(G.S.bigMed||0)+10;
   if(chance(38)){ G.S.noRenew=true; say('Prezes słyszał wszystko. Kontraktu nie będzie.'); }
   return false;
 };

 /* ------------------------------------------------------------
    CZY REGULAMIN W OGÓLE POZWALA CIĘ WPUŚCIĆ (Sprint 3)
    ------------------------------------------------------------
    Zanim policzymy jakiekolwiek procenty, sprawdzamy papiery. Gracz może
    prosić trenera o co chce — ale trener nie wpisze do programu czegoś,
    czego nie wpisze sędzia. Trzy twarde blokady:
      · komplet pięciu startów,
      · młodzieżowiec po dwóch startach z rezerwy zwykłej,
      · SENIOR CHCĄCY WEJŚĆ ZA MŁODZIEŻOWCA — rubryka młodzieżowa nie jest
        do wzięcia (ta sama zasada co przy rezerwie taktycznej).
    ------------------------------------------------------------ */
 const pushLegal=(nums)=>{
   const s=st[meId];
   if(!s) return {ok:false, why:resRefusal('none')};
   if(live.outOfMeeting) return {ok:false, why:'Twoje zawody są skończone. Nie ma czego wpisywać.'};
   if(s.starts>=5) return {ok:false, why:resRefusal('starts')};
   if(!plainResOk(s, s.r)) return {ok:false, why:resRefusal('junPlain')};
   const mineNums=(nums||[]).filter(n=>(sideOf[n]||(isHomeNum(n)?'h':'a'))===mySide);
   const pool=mineNums.map(n=>map[n]).filter(Boolean).filter(r=>r.id!==meId);
   if(!pool.length) return {ok:false, why:resRefusal('none')};
   const legal=pool.filter(r=>tacticLegal(r, s.r));
   if(!legal.length) return {ok:false, why:resRefusal('junTake')};
   return {ok:true, target:legal.slice().sort((a,b)=>a.ovr-b.ovr)[0]};
 };

 /* --- AKCJE PARKU MASZYN (wspólne dla ekranu „między biegami" i „przed biegiem") --- */
 const pitAction=function*(act, heatNums){
   const p=G.p, S=G.S;
   const a=(act&&act.a)||'go';
   clearMsg();
   live.refuse=null;                 // każda nowa akcja kasuje poprzednią odmowę
   if(a==='gear'){
     const v=cl(Number(act.v)||0,0,5);
     if(v===live.gear) say('Mechanik patrzy na ciebie, potem na zębatkę, potem znowu na ciebie. Zostaje jak było.');
     else { say('Zębatka '+live.gear+' → '+v+'. Mechanik robi to w dziewięćdziesiąt sekund i zdąży jeszcze splunąć.'); live.gear=v; }
     return false;
   }
   if(a==='spy'){
     if(live.spyDone){ say('Drugi raz w tym biegu nie wejdziesz im do parkingu. Kierownik zawodów już cię zna.'); return false; }
     live.spyDone=true;
     if(chance(BIGM.spyOk)){
       live.spyKnown=true;
       say('Podchodzisz „po klucz nasadowy" i patrzysz na ich zębatkę. Wiesz już, co jest dziś dobre na ten tor.');
     } else {
       say('Mechanik rywala zauważa cię z odległości dwóch metrów i woła sędziego technicznego.');
       livePitCosts(live,'yellow').forEach(x=>say(x));
     }
     return false;
   }
   if(a==='hit'){
     p.med=cl(p.med+12,0,99); S.bigMed=(S.bigMed||0)+12;
     if(chance(12)){
       say('Przyjebałeś mu w park maszyn tak, że nikt tego nie nagrał, a on nie ma świadków. Sędzia rozkłada ręce. Kierownik drużyny patrzy na ciebie z podziwem, którego się wstydzi.');
       S.atm=cl(S.atm-6,0,100);
       return false;
     }
     p.budget-=BIGM.redFine; S.fines=(S.fines||0)+BIGM.redFine;
     S.bigProf=(S.bigProf||0)-BIGM.redProf; p.prof=cl(p.prof-BIGM.redProf,0,99);
     S.atm=cl(S.atm-16,0,100);
     say('CZERWONA KARTKA. Rękoczyny w parku maszyn, kamery, protokół, komisja. Koniec startów w tych zawodach.',
         'Kara '+zl(BIGM.redFine)+', profesjonalizm -'+BIGM.redProf+'.');
     // Sprint 1: czerwona = kod 'w' we WSZYSTKICH pozostałych biegach, nie w jednym
     liveRedCard(live, [], 'rękoczyny w parku maszyn').forEach(x=>say(x));
     if(chance(30)){ S.banMatches=(S.banMatches||0)+2; say('Wydział Dyscypliny dokłada 2 mecze zawieszenia w kolejnym sezonie.'); }
     if(chance(20)){ S.noRenew=true; say('Zarząd klubu ogłasza, że „nie widzi cię w projekcie na kolejny sezon".'); }
     return true;
   }
   if(a==='protest'){
     /* PROTEST ZE WZGLĘDU NA STAN TORU (Sprint 2) — tylko między biegami.
        Tańszy niż wyjazd z parku (nie zrywa kontraktu), ale niesie żółtą
        kartkę, a szansa na odwołanie meczu jest z definicji niższa. */
     liveProtest(live, []).forEach(x=>say(x));
     return live.abandoned || !liveCanStart(live);
   }
   if(a==='leave'){
     live.benched=true;
     S.leftPits=true;                    // ← engine/28: bez tego dalej dostawałbyś wielkie mecze
     p.budget-=BIGM.leaveFine; S.fines=(S.fines||0)+BIGM.leaveFine;
     S.bigProf=(S.bigProf||0)-BIGM.leaveProf; p.prof=cl(p.prof-BIGM.leaveProf,0,99);
     S.atm=cl(S.atm-BIGM.leaveAtm,0,100);
     p.loyalty=cl(p.loyalty-BIGM.leaveLoy,0,100);
     p.med=cl(p.med+15,0,99); S.bigMed=(S.bigMed||0)+15;
     say('WYJEŻDŻASZ Z PARKU MASZYN W TRAKCIE ZAWODÓW. Bus, brama, droga wojewódzka, cisza.',
         'Zostajesz zmieniony do końca spotkania. Kara umowna '+zl(BIGM.leaveFine)+', profesjonalizm -'+BIGM.leaveProf+
         ', atmosfera w szatni -'+BIGM.leaveAtm+', lojalność -'+BIGM.leaveLoy+'.');
     /* SPRINT 2: zanim wpiszemy kody, sędzia decyduje, czy twój wyjazd z parku
        nie jest przypadkiem argumentem za odwołaniem całych zawodów. Kolejność
        ma znaczenie: jak mecz zostanie odwołany, nie ma czego wpisywać. */
     liveLeaveCancelRoll(live, []).forEach(x=>say(x));
     // zmieniony do końca zawodów = kod '-' (nie startował) przy każdym pozostałym biegu
     if(!live.abandoned)
       liveExcludeRest(live, 'opuszczenie parku maszyn w trakcie zawodów', [], {code:'-'}).forEach(x=>say(x));
     if(chance(55)){ S.noRenew=true; S.contractBroken=true;
       say('Klub rozwiązuje z tobą kontrakt ze skutkiem natychmiastowym po zawodach.'); }
     else say('Klub zostawia cię w kadrze, ale prezes powiedział dziennikarzom zdanie, które będzie ci wracać przez lata.');
     if(chance(35)){ S.banMatches=(S.banMatches||0)+3; say('Wydział Dyscypliny: 3 mecze zawieszenia w kolejnym sezonie.'); }
     return true;
   }
   if(a==='push'){
     /* ------------------------------------------------------------
        PROŚBA O WPUSZCZENIE Z REZERWY.
        Najpierw REGULAMIN, dopiero potem procenty. Jeżeli papiery się nie
        zgadzają, trener nie rzuca kością — rzuca jednym zdaniem.
        ------------------------------------------------------------ */
     const legal=pushLegal(heatNums);
     if(!legal.ok){
       live.refuse={txt:RESB.burdel, why:legal.why, coach:myCoach.name, type:coachType(myCoach).n};
       say(myCoach.name+' nawet nie podnosi wzroku znad programu: „'+RESB.burdel+'."', legal.why);
       S.atm=cl(S.atm-2,0,100);
       return false;
     }
     const mates=availableRiders(myClub).filter(r=>st[r.id] && r.id!==meId && st[r.id].starts<5)
       .sort((a2,b2)=>b2.ovr-a2.ovr);
     const REL=relNow();
     const ch=cl(Math.round(livePushChance(live, mates) + REL.rel*0.25), 2, 95);
     live.pushed=(live.pushed||0)+1;
     if(chance(ch)){
       live.pushIn=true;
       live.pushTarget=legal.target?legal.target.id:null;
       say('Dopadasz trenera przy tablicy z programem. „Wpuść mnie za niego, ja to dowiozę." '+
           myCoach.name+' patrzy na wynik, patrzy na ciebie i skreśla cudzy numer.');
       return false;
     }
     const r=R(1,100);
     if(r<=55){ say('„Siadaj i czekaj na swój bieg." Tyle. Rozmowa trwała cztery sekundy.'); G.S.atm=cl(G.S.atm-5,0,100); }
     else if(r<=85){
       live.benchNext=true;
       say('Chciałeś, żeby trener wpuścił cię z rezerwy — a w nagrodę to CIEBIE zdejmie z twojego własnego biegu. '+
           '„Skoro tak ci się chce jeździć, to popatrz, jak się to robi."');
       G.S.atm=cl(G.S.atm-10,0,100);
     } else {
       live.benched=true;
       say(myCoach.name+' wysłuchał do końca, kiwnął głową i wpisał kogoś innego do WSZYSTKICH twoich pozostałych biegów. '+
           'Zawody skończyły się dla ciebie przy tablicy z programem.');
       liveExcludeRest(live, 'zmieniony przez trenera do końca zawodów', [], {code:'-'}).forEach(x=>say(x));
       G.S.atm=cl(G.S.atm-14,0,100);
     }
     return true;
   }
   return true;      // 'go'
 };

 /* --- EKRAN „MIĘDZY BIEGAMI" --- */
 const between=function*(nextHeat, nums){
   while(true){
     const mates=availableRiders(myClub).filter(r=>st[r.id] && r.id!==meId && st[r.id].starts<5)
       .sort((a2,b2)=>b2.ovr-a2.ovr);
     const legal=pushLegal(nums);
     const REL=relNow();
     const act = yield snap('between', {
       next:{label:nextHeat, mine:false},
       push:{show:mates.length>0 && !live.outOfMeeting,
             chance: legal.ok ? cl(Math.round(livePushChance(live, mates)+REL.rel*0.25),2,95) : 0,
             legal: legal.ok, block: legal.ok?null:legal.why,
             who: legal.ok&&legal.target ? legal.target.name : (mates.length?mates[mates.length-1].name:null)},
       /* protest ma sens dopiero, gdy zobaczyłeś tor z siodełka (live.grip!=null) */
       protest:{show: live.grip!=null && liveProtestOk(live), count:live.protests||0,
                cancel: liveProtestCancelChance(live), yellow: liveProtestYellowChance(live)}
     });
     const done = yield* pitAction(act, nums);
     if(live.abandoned) return;
     if((act&&act.a)==='go' || done) return;
   }
 };

 /* --- BIEG GRACZA: park maszyn → taśma → cztery decyzje → wynik --- */
 const myHeat=function*(nums, label, nominated){
   const p=G.p;
   /* tor zmienia się z biegu na bieg */
   live.grip=liveGrip(live.grip);
   live.ideal=liveIdeal(live.grip);
   live.spyKnown=false; live.spyDone=false;
   live.mech=liveMech(live.ideal, live.gear);
   clearMsg(); live.refuse=null;
   /* PARK MASZYN */
   while(true){
     const act = yield snap('pit', {
       next:{label, mine:true},
       push:{show:false, chance:0, who:null},
       field: buildEntries(nums).map(e=>({num:e.num, name:e.r.name, me:e.r.id===meId, side:e.side,
                                          gate:e.gate||null, helmet:e.helmet||null,
                                          mine:e.side===mySide}))
     });
     if((act&&act.a)==='go') break;
     const done = yield* pitAction(act, nums);
     if(done) break;
   }
   if(live.outOfMeeting){
     // kody za ten i pozostałe biegi wpisało już liveExcludeRest() — nic nie dopisujemy
     simHeat(nums, label, nominated);
     return;
   }
   if(live.benchNext){
     live.benchNext=false;
     if(st[meId]) st[meId].codes.push('-');
     clearMsg();
     say('Trener dotrzymał słowa: w twoim biegu jedzie kolega z kadry. Ty stoisz przy bandzie w komplecie kevlarów.');
     const alt=availableRiders(myClub).filter(r=>st[r.id] && r.id!==meId && st[r.id].starts<5
                                                && tacticLegal(st[meId]?st[meId].r:null, r))
       .sort((a2,b2)=>b2.ovr-a2.ovr)[0];
     let ns=nums.slice();
     if(alt){ const vk=-alt.id; map[vk]=alt; sideOf[vk]=mySide; ns=ns.map(n=>map[n]&&map[n].id===meId?vk:n); }
     simHeat(ns, label, nominated);
     yield snap('heatres', {next:{label, mine:false}});
     return;
   }
   const entries=buildEntries(nums);
   if(!entries.some(e=>e.r.id===meId)){ simHeat(nums, label, nominated); return; }
   const fit=liveFit(live.gear, live.ideal);
   const rc=liveMkRace(entries, ctx, meId, fit, live.spyKnown);
   live.rc=rc; live.inRace=true;     // kraksa w tym biegu wyklucza dopiero NASTĘPNE
   const meX=()=>rc.rid.find(x=>x.me);
   /* ------------------------------------------------------------
      SPRINT 2: BIEG MOŻE ZOSTAĆ POWTÓRZONY.
      Po KAŻDEJ decyzji sprawdzamy dwie rzeczy:
        1. czy leżysz — wtedy modal „Leż" / „Wstawaj i zbiegnij" (Rejtan),
        2. czy ktokolwiek został wykluczony — wtedy czerwone światła
           i cały bieg jedzie od nowa, bez wykluczonych.
      Obsługę liczy engine/29b-live-kolizje.js; tutaj jest tylko pętla.
      ------------------------------------------------------------ */
   const afterStep=function*(){
     let g=0;
     while(liveFallPending(live) && g++<3){
       const F=live.fallPending;
       const act = yield snap('fall', {fall:{why:F.why, pos:F.pos, label,
         red: (live.simFalls||0)?COLL.simFallRedBehind:null}});
       clearMsg();
       liveFallResolve(rc, live, ((act&&act.a)==='lie') ? 'lie' : 'getup').forEach(x=>say(x));
     }
     if(rc.rerun){
       liveRerunApply(rc, live).forEach(x=>say(x));
       if(rc.restart){ rc.restart=false; return true; }
     }
     return false;
   };
   let rerunGuard=0;
   while(rerunGuard++ <= COLL.rerunCap+2){
     clearMsg();
     if(meX().out){ liveFinishWithoutMe(rc, live).forEach(x=>say(x)); break; }
     /* --- TAŚMA --- */
     {
       const act = yield snap('race', {race:{
         ph:0, phaseName:BIGM.phases[0], label,
         options:BIGM.starts.map(o=>({id:o.id, l:o.l, d:o.d, ch:null})),
         order:liveOrder(rc).map(x=>({name:x.name, num:x.num, me:x.me, out:x.out})),
         gear:live.gear, fit, fitTxt:BIGM.fitTxt[fit], grip:live.grip, log:[],
         reruns:rc.reruns||0, sim:{show:false}
       }});
       const s=(act&&act.v)||'clean';
       const me=meX();
       if(s==='tape'){
         if(chance(cl(52+(p.prof-50)*0.12-fit*3,10,88))){ me.val+=R(5,10); say('WYSTRZELIŁEŚ Z TAŚMY. Pierwszy łuk twój, reszta patrzy w plecy.'); }
         else if(chance(38)){
           say('DOTKNĄŁEŚ TAŚMY. Czerwone światło, sędzia wyklucza cię z biegu. Trybuny gwiżdżą, mechanik odwraca wzrok.');
           liveExclude(rc, me, 'dotknięcie taśmy', []).forEach(x=>say(x));
         }
         else { me.val-=R(2,5); say('Ruszyłeś o ćwierć sekundy za wcześnie, złapałeś sprzęgłem pustkę i wyjechałeś ostatni.'); }
       } else if(s==='safe'){
         me.val-=R(1,4); say('Puściłeś taśmę spokojnie. Bezpiecznie, przewidywalnie, trzeci.');
       } else {
         me.val+=R(-2,3); say('Normalny start. Tyle, ile daje sprzęt i zębatka.');
       }
       liveFate(rc,0).forEach(x=>say(x));
       liveDrift(rc,false);
       rc.ph=1;
       rc.hist.push({ph:0, order:liveOrder(rc).map(x=>({name:x.name,me:x.me,out:x.out}))});
     }
     if(yield* afterStep()) continue;
     /* --- TRZY ŁUKI DECYZJI --- */
     let again=false;
     for(let ph=1; ph<=3 && !meX().out; ph++){
       const fitNow=fit;
       const pos=liveMyPos(rc);
       const opts=BIGM.moves.map(m=>({id:m.id, l:m.l, d:m.d, ch:liveMoveChance(rc, m.id, live.grip, fitNow)}));
       const act = yield snap('race', {race:{
         ph, phaseName:BIGM.phases[ph], label,
         options:opts,
         order:liveOrder(rc).map(x=>({name:x.name, num:x.num, me:x.me, out:x.out})),
         pos, gear:live.gear, fit:fitNow, fitTxt:BIGM.fitTxt[fitNow], grip:live.grip,
         reruns:rc.reruns||0,
         /* SPRINT 2: dwie akcje spoza regulaminu, dostępne dopiero na torze */
         sim:{show:true, behind:pos>1,
              fallRed: pos>1 ? COLL.simFallRedBehind : COLL.simFallRedLead}
       }});
       clearMsg();
       const a=(act&&act.a)||'move';
       const mv=(act&&act.v)||'obrona';
       if(a==='simfall')      liveSimFall(rc, live, []).forEach(x=>say(x));
       else if(a==='simdef')  liveSimDefect(rc, live, []).forEach(x=>say(x));
       else {
         const r=liveResolveMove(rc, mv, live.grip, fitNow, live);
         r.out.forEach(x=>say(x));
       }
       liveFate(rc, ph).forEach(x=>say(x));
       liveDrift(rc, mv==='obrona');
       rc.ph=ph+1;
       rc.hist.push({ph, order:liveOrder(rc).map(x=>({name:x.name,me:x.me,out:x.out}))});
       if(yield* afterStep()){ again=true; break; }
     }
     if(again) continue;
     if(meX().out && (rc.ph||0)<=3) liveFinishWithoutMe(rc, live).forEach(x=>say(x));
     break;
   }
   live.rc=rc;
   /* --- META --- */
   const fin=rc.rid.filter(x=>!x.out).sort((a,b)=>b.val-a.val);
   const res=rc.rid.map(x=>{
     const pts = x.out ? 0 : [3,2,1,0][fin.indexOf(x)];
     return {r:x.e.r, side:x.side, home:x.e.home, num:x.num, ref:x.e.ref, trouble:x.e.trouble,
             gate:x.e.gate||null, helmet:x.e.helmet||null, out:x.out, pts, bon:0};
   });
   bonusOf(res);
   live.inRace=false; live.rc=null;
   applyRes(res, label, nominated);
   if(live.fillPending){ live.fillPending(); live.fillPending=null; }   // wykluczenia PO kodzie tego biegu
   const mine=res.find(x=>x.r.id===meId);
   say(mine.out==='d' ? 'DEFEKT. Zero punktów i rachunek u tunera.'
     : mine.out==='w' ? 'WYKLUCZENIE. Zero punktów, za to materiał wideo na cały tydzień.'
     : mine.out==='u' ? 'UPADEK. Wstałeś o własnych siłach i zbiegłeś z toru — zero punktów, kod „u" w karcie.'
     : 'Bieg '+label+': '+mine.pts+(mine.bon?' + bonus':'')+' pkt. '+pick(BIGM.crowd));
   yield snap('heatres', {next:{label, mine:true},
     result:{pts:mine.pts, bon:mine.bon, out:mine.out,
             order:liveOrder(rc).map((x,i)=>({pos:i+1, name:x.name, num:x.num, me:x.me, out:x.out}))}});
 };

 /* ============================================================
    PRZEBIEG SPOTKANIA — 13 biegów programu + 2 nominowane
    ============================================================ */
 let h=0;
 while(h<13){
   if(live.abandoned) break;                  // Sprint 2: sędzia przerwał zawody
   curH=h;                                    // ← z tego liczy się „pozostałe biegi"
   let nums = yield* tacticNums(h, set[h].slice());
   if(live.pushIn && !live.outOfMeeting && st[meId] && st[meId].starts<5 &&
      !nums.some(n=>map[n]&&map[n].id===meId)){
     /* PRESJA ZADZIAŁAŁA: wchodzisz za kolegę z tego biegu.
        SPRINT 3: nie „za najsłabszego", tylko za tego, za kogo WOLNO —
        młodzieżowca senior nie zastąpi, choćby prosił trzy razy. */
     const mineNums=nums.filter(n=>(sideOf[n]||(isHomeNum(n)?'h':'a'))===mySide);
     const meR=st[meId].r;
     const pool=mineNums.map(n=>map[n]).filter(Boolean).filter(r=>tacticLegal(r, meR));
     const weak = pool.find(r=>r.id===live.pushTarget) || pool.sort((a,b)=>a.ovr-b.ovr)[0];
     if(weak){
       if(st[weak.id]) st[weak.id].codes.push('-');
       st[meId].res.plain++;                       // wchodzisz z rezerwy zwykłej
       nums=nums.map(n=>map[n]&&map[n].id===weak.id ? (myNum!=null?myNum:n) : n);
       live.pushIn=false; live.pushTarget=null;
     } else {
       live.pushIn=false; live.pushTarget=null;
       live.refuse={txt:RESB.burdel, why:resRefusal('junTake'), coach:myCoach.name};
     }
   }
   const mineIn = !live.outOfMeeting && st[meId] && st[meId].starts<5 &&
                  nums.some(n=>map[n] && map[n].id===meId);
   if(!mineIn){
     yield* between(h+1, nums);
     if(live.abandoned) break;                // protest przerwał mecz w parku maszyn
     if(live.outOfMeeting){ simHeat(nums, h+1); h++; continue; }
     /* jeden klik = wszystkie biegi bez ciebie, aż do twojego startu */
     let guard=0;
     while(h<13 && guard++<20){
       if(live.abandoned || live.pushIn) break;  // trener właśnie cię wpuścił — wracamy do pętli głównej
       curH=h;
       let ns = yield* tacticNums(h, set[h].slice());
       const mi = !live.outOfMeeting && st[meId] && st[meId].starts<5 &&
                  ns.some(n=>map[n] && map[n].id===meId);
       if(mi) break;
       simHeat(ns, h+1); h++;
     }
     continue;
   }
   yield* myHeat(nums, h+1, false);
   h++;
 }
 curH=13;                                      // program się skończył — zostały tylko nominowane
 /* --- BIEGI XIV i XV: NOMINOWANI (art. 721) ---
    SPRINT 3: młodzieżowiec nie jest nominowany z urzędu — trafia tu wyłącznie
    jako rezerwa, czyli dopiero wtedy, gdy drużyna nie ma dwóch seniorów
    z wolnym startem. Ta sama zasada co w engine/12-mecz-ligowy.js. */
 const nominate=(side,name)=>{
   const pool=availableRiders(name).filter(r=>st[r.id]&&st[r.id].starts<5
      && !(live.hurtOut||[]).includes(r.id) && !(r.id===meId&&live.outOfMeeting));
   const by=(a,b)=> (st[b.id].pts/Math.max(1,st[b.id].starts)) - (st[a.id].pts/Math.max(1,st[a.id].starts)) || b.ovr-a.ovr;
   const sen=pool.filter(r=>!isJun(r)).sort(by);
   const jun=pool.filter(isJun).filter(r=>plainResOk(st[r.id], r)).sort(by);
   return sen.concat(jun);
 };
 for(let extra=0; extra<2; extra++){
   if(live.abandoned) break;                    // biegi nominowane też się nie odbędą
   const H=nominate('h',homeName).slice(0,2), A=nominate('a',awayName).slice(0,2);
   [...H,...A].forEach(r=>{ if(isJun(r) && st[r.id]) st[r.id].res.plain++; });
   const entries=gateOrder([...H.map(r=>({r,side:'h',home:true,num:st[r.id].num,ref:REF.h,trouble:TRB.h})),
                  ...A.map(r=>({r,side:'a',home:false,num:st[r.id].num,ref:REF.a,trouble:TRB.a}))]);
   if(entries.length<3) break;
   const label=14+extra;
   if(entries.some(e=>e.r.id===meId) && !live.outOfMeeting){
     const nums=entries.map(e=>{ const vk=-e.r.id; map[vk]=e.r; sideOf[vk]=e.side; return vk; });
     yield* myHeat(nums, label, true);
   } else {
     const res=leagueHeat(entries, null, null);
     applyRes(res, label, true);
   }
 }
 /* ============================================================
    SPRINT 2: ZAWODY PRZERWANE PRZEZ SĘDZIEGO
    ------------------------------------------------------------
    Próg liczy liveAbandonMeeting() (engine/30): po 8. biegu — a w play-offie
    i play-downie po 12. — wynik jest regulaminowo ważny i zostaje wynikiem
    końcowym; wcześniej mecz jest ANULOWANY.
    Mecz anulowany nie wchodzi NIGDZIE: ani do tabeli, ani do statystyk
    zawodników, ani do formy. Wraca do terminarza jako powtórka od 0:0 —
    obsługuje to engine/15-liga-chronologia.js po `abandoned && !abandonCounted`.
    ============================================================ */
 const abandonInfo = live.abandoned ? {
   abandoned:true, abandonCounted:!!live.abandonCounted, abandonWhy:live.abandonWhy,
   abandonHeat:live.abandonHeat, abandonNeed:live.abandonNeed, abandonBy:live.abandonBy||null
 } : null;
 /* --- SKUTKI POZASPORTOWE DO RAPORTU SEZONU (obie drogi ich potrzebują) --- */
 const finishNotes=(meSt)=>{
   const note=[];
   if(live.yellow) note.push(live.yellow+'× żółta kartka w parku maszyn ('+zl(live.yellow*BIGM.yellowCost)+')');
   if(live.red) note.push('czerwona kartka'+(live.excludedCount?' (wykluczenie w '+live.excludedCount+' biegach)':''));
   if(live.medOut) note.push(live.medSub ? 'kontuzja — zastąpiony przez '+live.medSub.name
                                         : 'kontuzja i wykluczenie za przekroczenie dwóch minut');
   if(live.benched) note.push('zmieniony do końca zawodów');
   if(live.crashed) note.push(live.crashed+'× kraksa');
   if(live.hurt) note.push('-'+live.hurt+' OVR po upadku');
   /* Sprint 2 */
   if(live.protests)   note.push(live.protests+'× protest na stan toru');
   if(live.simFalls)   note.push(live.simFalls+'× symulowany upadek');
   if(live.simDefs)    note.push(live.simDefs+'× symulowany defekt');
   if(live.layDown)    note.push(live.layDown+'× Rejtan (zostałeś na torze)');
   if(live.hurtRivals) note.push(live.hurtRivals+'× kontuzjowany rywal');
   if(live.mateHits)   note.push(live.mateHits+'× kolizja z kolegą z pary');
   if(live.abandoned)  note.push('ZAWODY PRZERWANE ('+live.abandonWhy+') — '+
     (live.abandonCounted ? 'wynik zaliczony po '+live.abandonHeat+'. biegu'
                          : 'mecz anulowany, do powtórki od 0:0'));
   if(note.length) (G.S.notesBig=G.S.notesBig||[]).push('WIELKI MECZ ('+meta.title+'): '+note.join(', ')+'.');
   /* SPRINT 3: relacja z trenerem po tym konkretnym spotkaniu — do raportu sezonu */
   const REL=relNow();
   (G.S.coachNotes=G.S.coachNotes||[]).push({title:meta.title, coach:myCoach.name,
     type:coachType(myCoach).n, rel:REL.rel, status:REL.status.n, press:pressNow().v});
   (G.S.bigLog=G.S.bigLog||[]).push({title:meta.title, hs, as, mine:mySide==='h'?hs:as, theirs:mySide==='h'?as:hs,
     me: meSt ? {starts:meSt.starts, pts:meSt.pts, bon:meSt.bon, codes:meSt.codes.slice()} : null,
     abandoned: !!live.abandoned, abandonCounted: !!live.abandonCounted,
     coach:{name:myCoach.name, rel:REL.rel, status:REL.status.n},
     story: live.story.slice()});
 };
 const annulled = !!(live.abandoned && !live.abandonCounted);
 /* --- ZAPIS DO STATYSTYK I FORMA (identycznie jak simMeeting) ---
    MECZ ANULOWANY POMIJA TEN BLOK: skoro spotkania nie było, to nie było też
    startów, punktów ani zmiany formy. Kartę i box budujemy mimo to (niżej),
    żeby wynik miał ten sam KSZTAŁT co zwykle — patrz komentarz przy return. */
 if(!annulled) Object.values(st).forEach(s=>{
   if(!s.r.sea) s.r.sea=blankSea();
   s.r.sea.m++; s.r.sea.starts+=s.starts; s.r.sea.pts+=s.pts; s.r.sea.bon+=s.bon;
   s.codes.forEach(c=>{ if(c==='d') s.r.sea.def++; else if(c==='w') s.r.sea.exc++;
                        else if(c==='-') s.r.sea.rep++;
                        else if(c==='u') s.r.sea.fall=(s.r.sea.fall||0)+1; });   // Sprint 2: upadek
   if(s.starts>0){
     const side = isHomeNum(s.num) ? 'h':'a';
     const exp = cl(1.35 + (s.r.ovr - REF[side])*0.055, 0.15, 2.75);
     const got = s.pts/s.starts;
     s.r.form = cl((s.r.form||0)*0.40 + (got-exp)*3.5, -12, 12);
   }
 });
 [homeName, awayName].forEach(n=>squadOf(n).forEach(r=>{
   if(st[r.id] && st[r.id].starts>0) return;
   if(r.form) r.form = Math.abs(r.form)<0.4 ? 0 : r.form*0.7;
 }));
 /* --- KONTROLA WYNIKU (suma punktów po składach) --- */
 const idsH=new Set(Object.values(LH).filter(Boolean).map(r=>r.id));
 const idsA=new Set(Object.values(LA).filter(Boolean).map(r=>r.id));
 { let hh=0, aa=0;
   Object.values(st).forEach(s=>{ if(idsH.has(s.r.id)) hh+=s.pts; else if(idsA.has(s.r.id)) aa+=s.pts; });
   hs=hh; as=aa; }
 const box=Object.values(st).map(x=>({
   id:x.r.id, name:x.r.name, num:x.num, age:x.r.age,
   side: idsH.has(x.r.id) ? 'h' : 'a',
   starts:x.starts, pts:x.pts, bon:x.bon, codes:x.codes.slice(),
   res:{plain:x.res.plain, tactic:x.res.tactic},
   me: !!(meId && x.r.id===meId)
 })).sort((a,b)=> (a.side===b.side ? (a.num||99)-(b.num||99) : (a.side==='h'?1:-1)));
 const meSt = meId && st[meId] ? st[meId] : null;
 if(annulled){
   /* MECZ ANULOWANY. Zwracamy PEŁNY kształt wyniku (hs/as/st/box/me/lineH/lineA),
      a nie okrojony obiekt — dzięki temu wywołania, które jeszcze nie znają
      Sprintu 2, nie wywalają się na `M.box` czy `M.me.pts`; dostają po prostu
      krótki mecz. Wywołania ŚWIADOME sprawdzają `M.abandoned && !M.abandonCounted`
      i wtedy nie zapisują niczego — tak robi engine/15-liga-chronologia.js
      (chronoAnnul → scheduleReplay). Ten sam warunek warto dopisać wszędzie,
      gdzie jeszcze woła się liveMeetingGen(): engine/09-sezon-przebieg.js,
      engine/17-playoff.js, engine/18-dmpj.js. */
   finishNotes(meSt);
   clearMsg();
   yield snap('abandon', {result:{hs, as, mine:mySide==='h'?hs:as, theirs:mySide==='h'?as:hs}});
   G.live=null;
   return Object.assign({hs, as, heats, st, box,
     me: meSt ? {starts:meSt.starts, pts:meSt.pts, bon:meSt.bon,
                 codes:meSt.codes.filter(c=>typeof c==='string'), num:meSt.num} : null,
     lineH:LH, lineA:LA, saveIn:false, save:{h:false,a:false}, meGap:null, meReg:false, live:true},
     abandonInfo);
 }
 /* --- PODSUMOWANIE SPOTKANIA NA EKRAN --- */
 clearMsg();
 yield snap('end', {result:{
   hs, as, mine: mySide==='h'?hs:as, theirs: mySide==='h'?as:hs,
   me: meSt ? {starts:meSt.starts, pts:meSt.pts, bon:meSt.bon, codes:meSt.codes.slice()} : null
 }});
 finishNotes(meSt);
 G.live=null;
 return Object.assign({hs, as, heats, st, box,
   me: meSt ? {starts:meSt.starts, pts:meSt.pts, bon:meSt.bon,
               codes:meSt.codes.filter(c=>typeof c==='string'), num:meSt.num} : null,
   lineH:LH, lineA:LA, saveIn:false, save:{h:false,a:false}, meGap:null, meReg:false, live:true},
   abandonInfo||{});
}
