/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIGA CHRONOLOGIA
   Walkowery + simSeasonChrono (14 kolejek)
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2066-2259 oryginału).
   ============================================================ */
/* ============================================================
   5b-0. WALKOWER — SPOTKANIE, KTÓRE NIE ZOSTAŁO ROZEGRANE
   ------------------------------------------------------------
   NAPRAWA: wcześniej `G.S.walkower=true` powodowało tylko tyle, że Gracz
   dostawał w jednej kolejce status „WALKOWER" i nie jechał — ale mecz
   rozgrywał się normalnie, wchodził do tabeli z prawdziwym wynikiem,
   a rywal zdobywał punkty na torze. Tekst zdarzenia mówił „0:75", tabela
   pokazywała 44:46. Teraz spotkanie faktycznie się NIE ODBYWA:
     · 'lose' — twoja drużyna oddaje mecz 0:75, rywal bierze 2 pkt
     · 'win'  — rywal się nie stawił: 75:0 dla ciebie
     · 'both' — obustronny walkower: 0:0, NIKT nie dostaje punktów meczowych
     · 'void' — mecz nierozegrany i nieweryfikowany (nie wchodzi do tabeli)
   Do tego S.walkPen zabiera punkty w tabeli (przy 'both' obu drużynom).
   ============================================================ */
const WALK_SCORE = 75;
function applyWalkover(box, h, a, myClub, rd){
 const S=G.S, T=box.T;
 const hi=T.findIndex(x=>x.name===h), ai=T.findIndex(x=>x.name===a);
 if(hi<0||ai<0) return;
 const home = (h===myClub);
 const mode = S.walkMode||'lose';
 let hs=0, as=0, counts=true;
 if(mode==='void')      counts=false;
 else if(mode==='both'){ hs=0; as=0; }
 else if(mode==='win')   { hs=home?WALK_SCORE:0; as=home?0:WALK_SCORE; }
 else                    { hs=home?0:WALK_SCORE; as=home?WALK_SCORE:0; }   // 'lose'
 if(counts){
   T[hi].m++; T[ai].m++;
   T[hi].sf+=hs; T[hi].sa+=as; T[ai].sf+=as; T[ai].sa+=hs;
   if(mode==='both'){ T[hi].l++; T[ai].l++; }                 // walkower obustronny: zero punktów
   else if(hs>as){ T[hi].pts+=2; T[hi].w++; T[ai].l++; }
   else          { T[ai].pts+=2; T[ai].w++; T[hi].l++; }
   // dwumecz liczy się dalej — walkower to też wynik
   const key=[h,a].sort().join('||'), A=box.agg;
   if(!A[key]) A[key]={first:{h,a,hs,as}};
   else {
     const f=A[key].first;
     const g1=(f.h===h)?f.hs+hs:f.hs+as, g2=(f.h===h)?f.as+as:f.as+hs;
     const rowFH=T.find(x=>x.name===f.h), rowFA=T.find(x=>x.name===f.a);
     if(rowFH&&rowFA){ if(g1>g2){rowFH.pts++;rowFH.bon++;} else if(g2>g1){rowFA.pts++;rowFA.bon++;} }
     A[key].done=true;
   }
   box.RS.push({round:rd+1, h, a, hs, as, me:null, heats:[], walk:mode});
 }
 /* KARA W TABELI (obchod / świstek: „obie drużyny tracą po punkcie") */
 const pen=S.walkPen||0;
 if(pen){
   const mineRow = home?T[hi]:T[ai], oppRow = home?T[ai]:T[hi];
   if(mineRow) mineRow.pts-=pen;
   if(mode==='both' && oppRow) oppRow.pts-=pen;
 }
 G.myLog.push({round:rd+1, home, opp:home?a:h,
   teamFor:home?hs:as, teamAgn:home?as:hs,
   rode:false, me:null, savedIn:false, gap:null, reg:false, walk:mode,
   why:'WALKOWER — '+({lose:'oddaliście spotkanie 0:75', win:'rywal się nie stawił (75:0)',
        both:'obustronny, 0:0', void:'mecz nierozegrany'}[mode]||'0:75')});
}

/* ============================================================
   5b-1. MECZ PRZERWANY PRZEZ SĘDZIEGO (patch 21.08.2026, Sprint 2)
   ------------------------------------------------------------
   Od Sprintu 2 spotkanie jechane na żywo może się skończyć wcześniej, niż
   przewiduje program: opuszczenie parku maszyn albo protest na stan toru
   (engine/30-live-park-maszyn.js) potrafią skłonić sędziego do odwołania
   zawodów. Generator meczu (engine/31-live-mecz.js) zwraca wtedy:

       {abandoned:true, abandonCounted:<bool>, abandonWhy, abandonHeat, abandonNeed}

   i są dokładnie dwie drogi:

     · abandonCounted === true  — odjechano co najmniej 8 biegów (12 w fazie
       play-off / play-down). Zawody są ZALICZONE, a wynik z tej chwili jest
       wynikiem końcowym. Wchodzi do tabeli, do dwumeczu i do statystyk tak
       samo, jak mecz dojechany do 15. biegu — tylko z krótszą kartą.

     · abandonCounted === false — mecz jest ANULOWANY. Nie wchodzi NIGDZIE:
       ani do tabeli, ani do bilansu, ani do statystyk zawodników. Wraca do
       terminarza jako POWTÓRKA OD STANU 0:0 w jednej z najbliższych kolejek
       (ABANDON.replayMin..replayMax). Powtórki rozgrywamy NA POCZĄTKU danej
       kolejki, przed jej własnym terminarzem — tak jak w rzeczywistości
       rozgrywa się zaległe spotkanie w środku tygodnia.

   Jeżeli w sezonie nie ma już wolnego terminu (przerwano mecz w ostatniej
   kolejce), spotkanie zostaje nierozegrane i nieweryfikowane — czyli
   dokładnie to, co robi walkower w trybie 'void'.
   ============================================================ */
function chronoAbandonCfg(){
  return (typeof ABANDON!=='undefined') ? ABANDON
       : {heatStd:8, heatPO:12, replayMin:1, replayMax:3, replayCap:2};
}
/* Wpisuje mecz do kolejki powtórek. Zwraca wpis albo null, gdy nie ma terminu. */
function scheduleReplay(lk, h, a, fromRd, why, gen){
  const S=G.S; if(!S) return null;
  const C=chronoAbandonCfg();
  const round = fromRd + R(C.replayMin, C.replayMax);
  const rep={lk, h, a, from:fromRd, why:why||'mecz przerwany', gen:(gen||0)+1, done:false,
             round: Math.min(round, BAL.rounds-1)};
  if(rep.round<=fromRd){ rep.noRoom=true; rep.done=true; }   // sezon się kończy — nie ma kiedy
  (S.replays=S.replays||[]).push(rep);
  return rep;
}
/* Zapis wyniku do tabeli, bilansu, dwumeczu i listy spotkań kolejki.
   Wyjęte z pętli sezonu, bo od Sprintu 2 potrzebują tego DWA miejsca:
   normalny terminarz i powtórki zaległych spotkań. */
function chronoApplyResult(S1, h, a, M, rd, opts){
  opts=opts||{};
  const T=S1.T, hi=T.findIndex(x=>x.name===h), ai=T.findIndex(x=>x.name===a);
  if(hi<0||ai<0) return false;
  T[hi].m++; T[ai].m++;
  T[hi].sf+=M.hs; T[hi].sa+=M.as; T[ai].sf+=M.as; T[ai].sa+=M.hs;
  if(M.hs>M.as){T[hi].pts+=2;T[hi].w++;T[ai].l++;}
  else if(M.hs<M.as){T[ai].pts+=2;T[ai].w++;T[hi].l++;}
  else {T[hi].pts++;T[ai].pts++;T[hi].d++;T[ai].d++;}
  /* ------------------------------------------------------------
     PUNKT BONUSOWY ZA WYGRANY DWUMECZ — POPRAWIONA LOGIKA
     Stary kod: `if(g1>g2){rowH.pts++;...} else if(g2>g1){rowA.pts++;...}`
     był ODWRÓCONY. W terminarzu rewanż ma zamienione role (f.h === a),
     więc g1 = f.hs + M.as to dorobek klubu `f.h`, czyli GOŚCIA tego meczu
     (rowA), a nie gospodarza. Punkt bonusowy trafiał do przegranego.
     Teraz liczymy jawnie po NAZWACH klubów z pierwszego meczu — wynik jest
     poprawny niezależnie od tego, kto był gospodarzem którego spotkania.
     ------------------------------------------------------------ */
  const key=[h,a].sort().join('||'), A=S1.agg;
  if(!A[key]) A[key]={first:{h,a,hs:M.hs,as:M.as}};
  else {
    const f=A[key].first;
    const g1 = f.h===h ? f.hs+M.hs : f.hs+M.as;    // dorobek klubu f.h w dwumeczu
    const g2 = f.h===h ? f.as+M.as : f.as+M.hs;    // dorobek klubu f.a w dwumeczu
    const rowFH = T.find(x=>x.name===f.h), rowFA = T.find(x=>x.name===f.a);
    if(rowFH && rowFA){
      if(g1>g2){ rowFH.pts++; rowFH.bon++; }
      else if(g2>g1){ rowFA.pts++; rowFA.bon++; }
    }
    A[key].done=true;
  }
  S1.RS.push({round:rd+1, h, a, hs:M.hs, as:M.as, me:opts.me||null, heats:M.heats, box:M.box,
              replay:!!opts.replay, abandoned:!!opts.abandoned, abandonHeat:opts.abandonHeat||null});
  return true;
}
/* Wiersz dziennika Gracza — też potrzebny w dwóch miejscach. */
function chronoMyLog(rd, home, opp, M, c, extra){
  G.myLog.push(Object.assign({
    round:rd+1, home, opp,
    teamFor: home?M.hs:M.as, teamAgn: home?M.as:M.hs,
    rode: !!(c&&M.me&&M.me.starts>0), me: (c&&M.me&&M.me.starts>0)?M.me:null,
    savedIn:false, gap:null, reg:false
  }, extra||{}));
}
/* MECZ ANULOWANY: nic do tabeli, wpis do dziennika, powtórka do terminarza. */
function chronoAnnul(lk, rd, h, a, M, myClub, mine, gen){
  const rep = scheduleReplay(lk, h, a, rd, M.abandonWhy, gen);
  const when = rep && !rep.noRoom ? 'powtórka w '+(rep.round+1)+'. kolejce'
                                  : 'w tym sezonie nie ma już terminu — mecz nierozegrany i nieweryfikowany';
  if(mine){
    const home = h===myClub;
    G.myLog.push({round:rd+1, home, opp:home?a:h, teamFor:0, teamAgn:0,
      rode:false, me:null, savedIn:false, gap:null, reg:false, voidMatch:true,
      replayRound: rep && !rep.noRoom ? rep.round+1 : null,
      why:'MECZ PRZERWANY I ANULOWANY — '+M.abandonWhy+
          ' (odjechano '+(M.abandonHeat||0)+' z wymaganych '+(M.abandonNeed||8)+' biegów). '+
          'Wynik '+M.hs+':'+M.as+' nie liczy się do niczego, '+when+'.'});
  }
  return rep;
}
/* POWTÓRKI ZALEGŁE NA TĘ KOLEJKĘ. Rozgrywamy je PRZED własnym terminarzem
   kolejki — zaległe spotkanie jedzie się w środku tygodnia, nie po weekendzie. */
function* chronoReplays(S1, lk, rd, ctx, myClub, myLk, status, live){
  const S=G.S;
  if(!S || !Array.isArray(S.replays)) return;
  const due=S.replays.filter(r=>!r.done && r.lk===lk && r.round===rd);
  const C=chronoAbandonCfg();
  for(const rep of due){
    rep.done=true;
    const h=rep.h, a=rep.a;
    const mine = myClub && lk===myLk && (h===myClub||a===myClub);
    let c = (mine && ctx && !status) ? ctx : null;
    const save = {h:needsSaving(clubByName(h)), a:needsSaving(clubByName(a))};
    let M=null;
    /* Powtórkę swojego meczu jedziesz na żywo — ale tylko do ABANDON.replayCap
       podejść. Bez tego limitu dałoby się protestować w nieskończoność. */
    if(live && mine && c && rep.gen<=C.replayCap && typeof liveMeetingGen==='function'){
      M = yield* liveMeetingGen(h, a, c, c.meId,
            {stage:'POWTÓRKA ZALEGŁEGO SPOTKANIA', leg:1, legs:1, replay:true,
             title:'POWTÓRKA OD 0:0 — '+(h===myClub?'MECZ U SIEBIE':'MECZ NA WYJEŹDZIE')});
    }
    if(!M) M = simMeeting(h, a, c, c?c.meId:null, save);
    if(!M) continue;
    if(M.abandoned && !M.abandonCounted){          // powtórkę też da się przerwać
      chronoAnnul(lk, rd, h, a, M, myClub, mine, rep.gen);
      continue;
    }
    if(!chronoApplyResult(S1, h, a, M, rd,
         {replay:true, me:c?M.me:null, abandoned:!!M.abandoned, abandonHeat:M.abandonHeat})) continue;
    if(mine) chronoMyLog(rd, h===myClub, h===myClub?a:h, M, c,
      {replay:true, abandoned:!!M.abandoned,
       why:'POWTÓRKA ZALEGŁEGO SPOTKANIA (pierwotny termin: '+(rep.from+1)+'. kolejka)'});
  }
}

function simSeasonChrono(ctx, myLk, myClub, ptsPen){
 const g=simSeasonChronoGen(ctx, myLk, myClub, ptsPen, false); let r=g.next();
 while(!r.done) r=g.next({a:'sim'});
 return r.value;
}
/* `live` = wolno zatrzymać sezon i zapytać o WIELKI MECZ (ostatnia kolejka
   rundy zasadniczej, gdy jedzie się o wejście do fazy play-off). */
function* simSeasonChronoGen(ctx, myLk, myClub, ptsPen, live){
 const meR=G.riders.find(r=>r.me);
 const st={};
 LKEYS.forEach(k=>{
   const clubs=G.leagues[k].clubs;
   st[k]={ T:clubs.map((c,i)=>({i,name:c.name,m:0,w:0,d:0,l:0,pts:0,bon:0,sf:0,sa:0})),
           RS:[], sched:makeSchedule(clubs.map(c=>c.name)), agg:{} };
 });
 G.myLog=[];
 if(G.S) G.S.replays=[];                 // Sprint 2: kolejka powtórek startuje pusta
 /* Zimowa dyspozycja: nikt nie wjeżdża w sezon "na zero". Jeden przepracował zimę
    w Hiszpanii, drugi wrócił z brzuchem — dlatego skład na pierwszą kolejkę nie jest
    zwykłym rankingiem OVR, tylko realną oceną tego, kto jak wygląda na treningach. */
 allClubs().forEach(c=>{ clubSeasonBudget(c);
   squadOf(c.name).forEach(r=>{ r.strike=false; r.form=cl(gauss(0,3.2),-9,9); }); });
 
 for(let rd=0; rd<BAL.rounds; rd++){
   G.roundNo=rd+1;
   let status = (ctx&&myClub) ? playerRoundStatus(rd) : null;
   /* --- NIEOCZEKIWANE ZDARZENIE TEJ KOLEJKI (5% łącznie) --- */
   let sur=null, biasBoost=0;
   if(ctx && myClub && meR && !status){
     sur = rollRoundSurprise(rd, myClub, meR);
     if(sur){
       if(G.S){ G.S.surprises=G.S.surprises||[]; G.S.surprises.push(sur); }
       if(sur.forceOut) status = sur.forceOut;
       if(sur.forceIn && ctx.bias){ biasBoost=SURPRISE.jumpBias; ctx.bias.v += biasBoost; }
     }
   }
   /* --- SZANSA NA SKŁAD PRZED TĄ KOLEJKĄ ---
      Liczona z REALNEJ dyspozycji kadry na dziś, więc zmienia się z tygodnia
      na tydzień. Zapisujemy ją do dziennika, żeby gracz widział w tabeli,
      czy ławka była pechem, czy arytmetyką. */
   let chanceNow=null;
   if(ctx && myClub && meR) chanceNow = status ? 0 : appearanceChanceNow(myClub, meR, ctx.bias);
   if(meR) meR.out = !!status;                      // trener nie ma cię do dyspozycji
   for(const k of LKEYS){
     /* SPRINT 2: najpierw zaległe powtórki meczów anulowanych w poprzednich kolejkach */
     yield* chronoReplays(st[k], k, rd, ctx, myClub, myLk, status, live);
     for(const [h,a] of (st[k].sched[rd]||[])){
       const mine = myClub && k===myLk && (h===myClub||a===myClub);
       /* WALKOWER: to spotkanie w ogóle się nie odbywa — nie symulujemy go. */
       if(mine && G.S && G.S.walkower && rd===G.S.walkRound){
         applyWalkover(st[k], h, a, myClub, rd);
         continue;
       }
       let c = (mine && ctx && !status) ? ctx : null;
       /* OSZCZĘDZANIE NA GWIAZDACH: klub z zaległościami wobec kadry albo
          z pustym kontem przy niespłaconym długu zostawia gwiazdy w domu. */
       const save = {h:needsSaving(clubByName(h)), a:needsSaving(clubByName(a))};
       let M=null;
       /* ------------------------------------------------------------
          WIELKI MECZ W RUNDZIE ZASADNICZEJ — OSTATNIA KOLEJKA O PLAY-OFF
          Pytamy tylko wtedy, gdy to spotkanie NAPRAWDĘ o czymś decyduje:
          ostatnia kolejka, a twój klub siedzi na granicy czwórki (miejsca
          3-6 przed tą kolejką). Wtedy jeden mecz dzieli fazę play-off od
          play-downu — i to jest moment na pytanie, czy chcesz go przejechać.
          ------------------------------------------------------------ */
       if(live && mine && c && rd===BAL.rounds-1 && playoffBubble(st[k].T, myClub)){
         const dec = yield* bigMatchAsk({kind:'league', stage:'OSTATNIA KOLEJKA — MECZ O PLAY-OFF',
           title:'OSTATNIA KOLEJKA RUNDY ZASADNICZEJ — MECZ O WEJŚCIE DO PLAY-OFF',
           myClub, opp:(h===myClub?a:h), lk:k}, c);
         if(dec==='cry'){ c=null; if(G.S) G.S.forcedFrom=Math.min(G.S.forcedFrom==null?99:G.S.forcedFrom, rd); }
         else if(dec==='ride'){
           M = yield* liveMeetingGen(h, a, c, c.meId,
             {stage:'MECZ O PLAY-OFF', leg:1, legs:1,
              title:'OSTATNIA KOLEJKA — '+(h===myClub?'MECZ U SIEBIE':'MECZ NA WYJEŹDZIE')});
         }
       }
       if(!M) M = simMeeting(h, a, c, c?c.meId:null, save);
       if(!M) continue;
       /* SPRINT 2: sędzia przerwał zawody przed 8. (12.) biegiem — mecz anulowany.
          Nie wchodzi do tabeli ani do statystyk; wraca jako powtórka od 0:0. */
       if(M.abandoned && !M.abandonCounted){ chronoAnnul(k, rd, h, a, M, myClub, mine, 0); continue; }
       if(!chronoApplyResult(st[k], h, a, M, rd,
            {me:c?M.me:null, abandoned:!!M.abandoned, abandonHeat:M.abandonHeat})) return;
       if(mine){
         const home=h===myClub, rode=!!(c&&M.me&&M.me.starts>0);
         const savedIn = rode && !!M.saveIn;
         if(savedIn && G.S) G.S.saveIn=(G.S.saveIn||0)+1;
         chronoMyLog(rd, home, home?a:h, M, c, {
           savedIn, gap: rode?null:M.meGap, reg: rode?false:!!M.meReg,
           chance: chanceNow, sur: sur?{kind:sur.kind, log:sur.log}:null,
           abandoned: !!M.abandoned,
           why: (M.abandoned ? 'ZAWODY PRZERWANE PO '+M.abandonHeat+'. BIEGU — '+M.abandonWhy+
                               '. Regulaminowo wynik jest ważny i zostaje końcowy. ' : '')
                + (status || (c? (M.abandoned?'':'ŁAWKA / POZA SKŁADEM') : 'BRAK MIEJSCA W SKŁADZIE')) || null});
       }
     }
   }
   /* --- SPRZĄTANIE PO NIEOCZEKIWANYM ZDARZENIU ---
      Efekty formy zostają (mają boleć albo cieszyć przez kilka kolejek),
      ale zbiorowa kontuzja kadry i podbicie u trenera dotyczą TEJ jednej kolejki. */
   if(sur){
     sur.hidden.forEach(r=>{ r.inj=0; });
     if(biasBoost && ctx.bias) ctx.bias.v -= biasBoost;
   }
   clubsAfterRound();
   aiStrikes();
   if(ctx&&myClub) settleRound(rd, myClub);
 }
 /* --- POWTÓRKI, DLA KTÓRYCH ZABRAKŁO TERMINU ---
    Mecz przerwany w ostatnich kolejkach nie ma już kiedy zostać rozegrany.
    Zostaje nierozegrany i nieweryfikowany — do tabeli nie wchodzi nic. */
 if(G.S && Array.isArray(G.S.replays)){
   const lost=G.S.replays.filter(r=>r.noRoom || !r.done);
   lost.forEach(r=>{ r.done=true; r.noRoom=true; });
   if(lost.length) G.S.replaysLost=(G.S.replaysLost||0)+lost.length;
 }
 if(meR) meR.out=false;
 LKEYS.forEach(k=>{
   if(ptsPen && myClub && k===myLk){ const row=st[k].T.find(x=>x.name===myClub); if(row) row.pts+=ptsPen; }
   st[k].T.sort((a,b)=> b.pts-a.pts || (b.sf-b.sa)-(a.sf-a.sa) || b.sf-a.sf);
   G.tables[k]=st[k].T; G.results[k]=st[k].RS;
 });
}
