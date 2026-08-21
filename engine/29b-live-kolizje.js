/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIVE KOLIZJE I POWTÓRKI
   Wykluczenia, powtórki biegu, kolizje, Rejtan
   ------------------------------------------------------------
   Moduł dopisany w Sprincie 2 (patch 21.08.2026). Wyszedł z
   `engine/29-live-bieg.js`, bo tamten przekroczył 25 KB — treść jest
   dokładnie ta sama, co miała trafić do 29. Ładuje się MIĘDZY 29 a 30:

       <script src="engine/29-live-bieg.js"></script>
       <script src="engine/29b-live-kolizje.js"></script>   ← TO DOPISZ
       <script src="engine/30-live-park-maszyn.js"></script>

   Wszystko tu to zwykłe funkcje globalne wołane w czasie gry, więc
   kolejność względem 30 nie ma znaczenia — ale trzymamy numerki.
   ============================================================ */
/* ============================================================
   9b-2. KOLIZJE, POWTÓRKI I REJTAN (patch 21.08.2026, Sprint 2)
   ------------------------------------------------------------
   Trzy rzeczy, których do tej pory nie było, a bez których bieg na żywo
   był tylko losowaniem z ładnymi opisami:

     1. WYKLUCZENIE KOGOKOLWIEK ZAWSZE PRZERYWA I POWTARZA BIEG.
        Nie ma już sytuacji, w której rywal wylatuje z biegu, a ty jedziesz
        dalej z darmowym awansem o jedno miejsce. Czerwone światła, wszyscy
        wracają pod taśmę BEZ wykluczonych, a wartości jazdy wracają do
        `x.base` — czyli do stanu sprzed pierwszej decyzji.
        Obsługa: liveExclude() → liveNeedRerun() → liveRerunApply().

     2. KOLIZJE MAJĄ OFIARĘ I MAJĄ CENĘ.
        · z rywalem  — COLL.rivalInjury% szans, że nie wstaje o własnych
          siłach: -OVR, koniec zawodów dla niego (live.hurtOut), medialność
          dla ciebie i gwizdy do końca meczu;
        · z kolegą z pary — atmosfera w dół i bura w parku maszyn.
        Kogo trafiasz, decyduje liveVictim(): tego, kogo właśnie atakujesz.

     3. REJTAN. Po WŁASNYM upadku bieg się zatrzymuje, a ty wybierasz:
        „Leż" albo „Wstawaj i zbiegnij". Wstanie kosztuje zero punktów i kod
        „u" — ale zamyka temat. Leżenie oddaje decyzję sędziemu, który
        wyklucza CIEBIE, wyklucza RYWALA albo daje ci CZERWONĄ KARTKĘ za
        symulowanie (liveFallResolve()).
        Do tego dwie nowe akcje z ekranu biegu: liveSimFall() („symuluj
        upadek", 80% czerwonej, gdy rywale prowadzą) i liveSimDefect()
        („symuluj defekt" — bura od rywala albo od kolegi z pary, jeżeli
        zabierasz mu punkt bonusowy).

   Turniej indywidualny (engine/32-live-turniej.js) NIE ustawia `live.fallAsk`
   ani nie konsumuje `rc.rerun`, więc działa tam po staremu — modale są
   opcjonalne z założenia, żeby jeden generator nie zmuszał drugiego do zmian.
   ============================================================ */
/* Wszystkie liczby w jednym miejscu; `BIGM.coll` z data/70-wielki-mecz.js nadpisuje. */
const COLL = Object.assign({
  rivalInjury      : 22,   // % kontuzji rywala przy zwykłej kolizji
  rivalInjuryPika  : 30,   // … po pice
  rivalInjuryPlot  : 34,   // … po jeździe przy płocie
  mateDown         : 50,   // % szans, że kolega z pary po kontakcie leży
  mateAtmMin       : 5,
  mateAtmMax       : 10,
  mateProf         : 3,
  simFallRedBehind : 80,   // % czerwonej za symulowany upadek, gdy rywale prowadzą
  simFallRedLead   : 30,   // … gdy prowadzisz
  simDefAtmMin     : 4,
  simDefAtmMax     : 9,
  fallLieYou       : 45,   // waga: sędzia wyklucza CIEBIE
  fallLieRival     : 30,   // waga: sędzia wyklucza RYWALA
  fallLieRed       : 25,   // waga: czerwona za symulowanie
  fallLieMed       : 18,   // % szans, że karetka kończy twoje zawody
  rerunCap         : 3     // po tylu powtórkach sędzia nie zarządza kolejnej
}, (typeof BIGM!=='undefined' && BIGM.coll) || {});

/* Czy `x` to twój kolega z drużyny (w meczu drużynowym — z tej samej pary kasków). */
function liveIsMate(rc, x){
  const me = rc && rc.rid.find(y=>y.me);
  return !!(me && x && !x.me && x.side!=null && x.side===me.side);
}
/* Kogo trafiasz: tego, kogo właśnie atakujesz (jedno miejsce przed tobą),
   a gdy prowadzisz — tego, kto siedzi ci na tylnym kole. */
function liveVictim(rc){
  const o = liveOrder(rc).filter(x=>!x.out);
  const i = o.findIndex(x=>x.me);
  if(i<0) return o[0] || null;
  return o[i-1] || o[i+1] || null;
}
/* --- POWTÓRKA BIEGU --- */
function liveNeedRerun(rc, why, out){
  out=out||[];
  if(!rc || rc.rerun) return out;
  rc.rerun={why: why||'wykluczenie'};
  out.push('CZERWONE ŚWIATŁA. Wykluczenie zawsze przerywa bieg — sędzia zarządza POWTÓRKĘ bez wykluczonych.');
  return out;
}
function liveExclude(rc, x, why, out){
  out=out||[];
  if(!x || x.out) return out;
  x.out='w';
  out.push((x.me ? 'TY' : esc0(x.name)) + (x.num?' ('+x.num+')':'') +
    ' — WYKLUCZONY: '+(why||'decyzja sędziego')+'.');
  liveNeedRerun(rc, (x.me?'twoje wykluczenie':'wykluczenie: '+esc0(x.name)), out);
  return out;
}
/* Wykonuje powtórkę: cofa wartości, kasuje stare losy, ustawia rc.restart.
   Generator meczu ma po tym wrócić na TAŚMĘ (rc.ph=0). */
function liveRerunApply(rc, live, out){
  out=out||[];
  if(!rc || !rc.rerun) return out;
  const why=rc.rerun.why;
  rc.rerun=null;
  if((rc.reruns||0) >= COLL.rerunCap){
    out.push('Sędzia ma dość. Po '+rc.reruns+' powtórkach ogłasza, że bieg zostaje rozstrzygnięty tak, jak stoi.');
    rc.restart=false;
    return out;
  }
  rc.reruns=(rc.reruns||0)+1;
  rc.ph=0;
  rc.restart=true;
  rc.rid.forEach(x=>{
    if(x.out) return;
    if(typeof x.base==='number') x.val=x.base;
    x.fate=null; x.fateAt=null;
    /* w powtórce silnik też potrafi paść — ale rzadziej niż w pierwszym podejściu */
    if(chance(4)){ x.fate='d'; x.fateAt=R(0,3); }
  });
  const left=rc.rid.filter(x=>!x.out).length;
  out.push('POWTÓRKA BIEGU ('+why+'). Pod taśmę wraca '+left+' '+
    (left===1?'zawodnik':'zawodników')+', a wszystko, co ugrałeś w poprzednim podejściu, przepada.');
  return out;
}
/* Powtórka bez Gracza: reszta biegu liczy się sama. */
function liveFinishWithoutMe(rc, live, out){
  out=out||[];
  let guard=0;
  while(guard++ < 8){
    for(let ph=Math.max(0, rc.ph||0); ph<=3; ph++){
      liveFate(rc, ph).forEach(m=>out.push(m));
      liveDrift(rc, false);
    }
    rc.ph=4;
    if(!rc.rerun) break;
    liveRerunApply(rc, live, out);
    if(!rc.restart) break;
    rc.restart=false;
  }
  return out;
}
/* --- BURA W PARKU MASZYN --- */
function liveBura(live, out, opts){
  out=out||[]; opts=opts||{};
  const S=G.S;
  const atm = opts.atm!=null ? opts.atm : R(3,6);
  if(S && !opts.foe) S.atm=cl((S.atm==null?50:S.atm)-atm, 0, 100);
  live.buras=(live.buras||0)+1;
  if(!opts.foe) live.atmLost=(live.atmLost||0)+atm;
  out.push('BURA W PARKU MASZYN'+(opts.who?' — '+esc0(opts.who):'')+': '+
    (opts.txt||'kilka zdań, których nie da się puścić w telewizji publicznej.')+
    (opts.foe?'' : ' Atmosfera w drużynie −'+atm+'.'));
  return out;
}
/* --- KONTUZJOWANIE RYWALA --- */
function liveInjureRival(rc, live, v, out){
  out=out||[];
  const r = v && v.e ? v.e.r : null;
  const dmg = R(1,4);
  if(r){
    r.ovr  = cl(r.ovr - dmg, 1, 99);
    r.form = cl((r.form||0) - R(4,8), -12, 12);
    /* koniec ZAWODÓW dla niego — engine/31 nie wpuści go już pod taśmę */
    (live.hurtOut = live.hurtOut||[]).push(r.id);
  }
  live.hurtRivals=(live.hurtRivals||0)+1;
  live.enemy=(live.enemy||0)+1;
  const med=R(3,6);
  G.p.med=cl(G.p.med+med,0,99);
  if(G.S) G.S.bigMed=(G.S.bigMed||0)+med;
  live.medGain=(live.medGain||0)+med;
  out.push('KARETKA NA TORZE. '+esc0(v.name)+' nie wstaje o własnych siłach — nosze, kołnierz, '+
    'koniec zawodów (−'+dmg+' OVR). Trybuny gwiżdżą na ciebie do końca meczu, a portale mają temat na tydzień.');
  liveExclude(rc, v, 'kontuzja po kolizji z tobą', out);
  return out;
}
/* --- KOLIZJA --- */
function liveCollide(rc, live, v, out, opts){
  out=out||[]; opts=opts||{};
  if(!v || v.out) return out;
  const down = opts.down!==false;
  if(liveIsMate(rc, v)){
    live.mateHits=(live.mateHits||0)+1;
    out.push('KOLIZJA Z KOLEGĄ Z PARY — '+esc0(v.name)+' jedzie w tych samych kevlarach co ty.');
    if(down && chance(opts.mateDown!=null?opts.mateDown:COLL.mateDown))
      liveExclude(rc, v, 'przewrócony przez kolegę z pary', out);
    else v.val -= R(4,9);
    liveBura(live, out, {who:v.name, atm:R(COLL.mateAtmMin, COLL.mateAtmMax),
      txt:'„Ja jestem z TWOJEJ drużyny. Z twojej. Popatrz na kevlar." Mechanicy rozdzielają was przy busie, '+
          'kierownik drużyny notuje coś w programie.'});
    G.p.prof=cl(G.p.prof-COLL.mateProf,0,99);
    if(G.S) G.S.bigProf=(G.S.bigProf||0)-COLL.mateProf;
  } else {
    const ch = opts.injCh!=null ? opts.injCh : COLL.rivalInjury;
    out.push('KOLIZJA Z RYWALEM ('+esc0(v.name)+') — '+ch+'% szans, że nie wstanie o własnych siłach.');
    if(chance(ch)) liveInjureRival(rc, live, v, out);
    else if(down) liveExclude(rc, v, 'przewrócony w kolizji', out);
    else v.val -= R(4,9);
  }
  return out;
}
/* --- REJTAN: „LEŻ" ALBO „WSTAWAJ I ZBIEGNIJ" --- */
function liveFallPending(live){ return !!(live && live.fallPending); }
function liveFallResolve(rc, live, choice, out){
  out=out||[];
  if(!live || !live.fallPending) return out;
  live.fallPending=null;
  const me=rc.rid.find(x=>x.me);
  if(!me || me.out) return out;
  if(choice==='getup'){
    me.out=(typeof LIVE_FALL!=='undefined') ? LIVE_FALL : 'u';
    live.gotUp=(live.gotUp||0)+1;
    out.push('WSTAJESZ I ZBIEGASZ Z TORU. Motocykl zostaje przy bandzie, ty za bandą — sędzia nie musi '+
      'przerywać biegu, bieg jedzie dalej bez ciebie. Zero punktów i kod „'+me.out+'" w karcie meczowej, '+
      'ale też zero tłumaczenia się przed komisją.');
    return out;
  }
  /* LEŻ — oddajesz decyzję sędziemu */
  live.layDown=(live.layDown||0)+1;
  out.push('ZOSTAJESZ NA TORZE. Czerwone światła, bieg przerwany, sędzia ogląda powtórkę trzy razy, '+
    'a kamera nie schodzi z twojej twarzy.');
  const v=liveVictim(rc);
  const prof=(G&&G.p)?G.p.prof:50;
  const wYou = Math.max(1, COLL.fallLieYou + (50-prof)*0.20);
  const wRiv = v ? Math.max(0, COLL.fallLieRival - (50-prof)*0.10) : 0;
  const wRed = Math.max(1, COLL.fallLieRed + (live.layDown-1)*10 + (live.simFalls||0)*12 + (50-prof)*0.10);
  const tot  = wYou + wRiv + wRed;
  const roll = Math.random()*tot;
  if(roll < wYou){
    out.push('WERDYKT: „Wykluczony zawodnik, który spowodował przerwanie biegu." Czyli ty.');
    liveExclude(rc, me, 'sędzia uznał cię za sprawcę przerwania biegu', out);
  } else if(roll < wYou+wRiv){
    out.push('WERDYKT: sędzia widzi kontakt i wskazuje na '+esc0(v.name)+'. Ty wracasz do powtórki.');
    liveExclude(rc, v, 'sprawca kolizji — decyzja sędziego', out);
  } else {
    out.push('WERDYKT: SYMULOWANIE. Sędzia nie znalazł ani kontaktu, ani dziury w torze — '+
      'znalazł za to zawodnika leżącego na prostej z rękami pod głową.');
    liveRedCard(live, out, 'symulowanie upadku w celu przerwania biegu');
    liveExclude(rc, me, 'czerwona kartka za symulowanie', out);
  }
  if(chance(COLL.fallLieMed) && !live.medOut)
    liveMedicalOut(live, out, 'zniesiony z toru po tym, jak nie wstałeś o własnych siłach');
  return out;
}
/* --- „SYMULUJ UPADEK" (akcja z ekranu biegu) --- */
function liveSimFall(rc, live, out){
  out=out||[];
  const me=rc.rid.find(x=>x.me);
  if(!me || me.out) return out;
  const behind = liveMyPos(rc) > 1;
  const red = behind ? COLL.simFallRedBehind : COLL.simFallRedLead;
  live.simFalls=(live.simFalls||0)+1;
  out.push('KŁADZIESZ SIĘ SAM. Nie było kontaktu, nie było dziury — układasz motocykl na łuku i zostajesz na piachu.'+
    (behind ? ' Rywale prowadzili, więc cały stadion wie, po co to zrobiłeś.'
            : ' Prowadziłeś, więc na trybunach jest raczej konsternacja niż gwizdy.'));
  out.push('Sędzia ogląda powtórkę — '+red+'% szans, że uzna to za symulowanie.');
  if(chance(red)){
    liveRedCard(live, out, 'symulowanie upadku w celu wymuszenia powtórki');
    liveExclude(rc, me, 'czerwona kartka za symulowanie upadku', out);
  } else {
    out.push('Kupił. Bieg przerwany, POWTÓRKA W PEŁNYM SKŁADZIE — z tobą pod taśmą.');
    liveNeedRerun(rc, 'przerwanie biegu po twoim upadku', out);
  }
  return out;
}
/* --- „SYMULUJ DEFEKT" (akcja z ekranu biegu) --- */
function liveSimDefect(rc, live, out){
  out=out||[];
  const me=rc.rid.find(x=>x.me);
  if(!me || me.out) return out;
  live.simDefs=(live.simDefs||0)+1;
  me.out='d';
  out.push('PODNOSISZ RĘKĘ I ZJEŻDŻASZ POD BANDĘ. Niby silnik. Silnikowi nic nie jest — mechanik wie, ty wiesz.');
  /* Komu popsułeś interes: jeżeli jechałeś PRZED kolegą z pary, to jemu właśnie
     zabrałeś punkt bonusowy (art. 720 — bonus jedzie za partnerem). */
  const mate = rc.rid.filter(x=>!x.out && liveIsMate(rc,x)).sort((a,b)=>b.val-a.val)[0];
  if(mate && mate.val < me.val){
    liveBura(live, out, {who:mate.name, atm:R(COLL.simDefAtmMin, COLL.simDefAtmMax),
      txt:'„Jechałem po bonus ZA TOBĄ. Za tobą! A ty mi zjeżdżasz pod bandę?" — zabrałeś koledze z pary '+
          'punkt bonusowy i on doskonale wie, że silnik chodził.'});
  } else {
    const foe = rc.rid.filter(x=>!x.out && !x.me && !liveIsMate(rc,x)).sort((a,b)=>b.val-a.val)[0];
    liveBura(live, out, {who: foe?foe.name:'rywal', foe:true, atm:R(2,5),
      txt:'„Wszyscy słyszeli, że ten silnik chodził." Popycha cię w klatkę piersiową przy wjeździe do parku, '+
          'sędzia techniczny akurat wiąże but.'});
  }
  return out;
}

