/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIVE PARK MASZYN
   Koszty kartek, presja na trenerze
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4806-4836 oryginału).
   ============================================================ */
/* ============================================================
   9c. PARK MASZYN — WSZYSTKO, CO MOŻESZ ZROBIĆ MIĘDZY BIEGAMI
   ------------------------------------------------------------
   Zębatka, podglądanie sprzętu rywali, awantura z trenerem, rękoczyny
   i najgłupsza możliwa decyzja, czyli wyjazd z parku maszyn w trakcie
   zawodów. Każda z tych rzeczy ma procent powodzenia i cenę.
   ============================================================ */
/* ============================================================
   NAPRAWA (patch 21.08.2026, Sprint 1): MATEMATYKA KARTEK.
   ------------------------------------------------------------
   Było źle na dwa sposoby naraz:
     · czerwona zapalała się dopiero przy TRZECIEJ żółtej,
     · a kiedy już się zapaliła, zabierała zawodnikowi jeden bieg — do karty
       meczowej wpadał pojedynczy kod, resztę spotkania jechał dalej.
   Jest regulaminowo:
     · DRUGA żółta kartka w tych samych zawodach zamienia się automatycznie
       na czerwoną,
     · czerwona to wykluczenie z ZAWODÓW: kod 'w' wchodzi do WSZYSTKICH
       pozostałych biegów zawodnika w tym meczu, a nie tylko do najbliższego.
   Cała robota siedzi w `liveExcludeRest()` — korzysta z niej też zastępstwo
   medyczne z `engine/29-live-bieg.js` (limit dwóch minut).
   ============================================================ */
const LIVE_EXC='w';          // kod wykluczenia w karcie meczowej
const LIVE_REP='-';          // kod „zmieniony / nie startował"

/* Ile biegów zostało zawodnikowi w tych zawodach i pod jakimi numerami.
   Generatory (engine/31-live-mecz.js, engine/32-live-turniej.js) trzymają
   program startów pod różnymi nazwami — bierzemy pierwszą, która istnieje.
   Zwraca tablicę numerów biegów albo null, gdy programu nie da się odczytać. */
function liveHeatsLeft(live){
 if(!live) return null;
 /* WPIĘCIE JAWNE (Sprint 1): generator meczu (engine/31) podaje własną listę
    pozostałych biegów Gracza — zna program, numer startowy i limit 5 startów.
    Argument mówi, czy bieg AKTUALNIE jechany już się liczy (kraksa w trakcie)
    czy jeszcze nie (decyzja w parku maszyn przed wyjazdem na tor). */
 if(typeof live.restHeats==='function'){
   const l=live.restHeats(!!live.inRace);
   if(Array.isArray(l)) return l;
 }
 const now = [live.heatNo, live.heatIdx, live.heat, live.h].find(v=>typeof v==='number');
 const prog = [live.myHeats, live.mine, live.program, live.plan].find(v=>Array.isArray(v));
 if(prog){
   const no = x => typeof x==='number' ? x : (x && typeof x==='object' ? (x.no!=null?x.no:(x.label!=null?x.label:x.heat)) : null);
   return prog.map(no).filter(n=>typeof n==='number' && (now==null || n>now));
 }
 const total = [live.myStarts, live.myTotal, live.startsPlanned].find(v=>typeof v==='number');
 if(typeof total==='number'){
   const done = liveCodeSink(live).length;
   const left = Math.max(0, total-done);
   return new Array(left).fill(null).map((_,i)=> (now==null?null:now+1+i));
 }
 return null;
}
/* Ile biegów z PROGRAMU (HEAT_SETS) zostało zawodnikowi o numerze `num`,
   licząc od biegu `from` (indeks 0-12) i nie więcej niż `cap` startów —
   art. 719 nie pozwala nikomu na więcej niż 5 startów w zawodach.
   Wynik to numery biegów 1-13; używa tego generator meczu na żywo. */
function liveProgramHeatsLeft(set, num, from, cap){
 if(num==null || !Array.isArray(set)) return [];
 const list=[];
 for(let i=Math.max(0,from); i<set.length && list.length<Math.max(0,cap); i++)
   if(set[i].includes(num)) list.push(i+1);
 return list;
}
/* Kartoteka kodów Gracza w tych zawodach — obsługujemy wszystkie kształty stanu. */
function liveCodeSink(live){
 if(Array.isArray(live.codes)) return live.codes;                      // turniej indywidualny: T[me].codes
 const meR = G.riders && G.riders.find(r=>r.me);
 const id  = live.meId!=null ? live.meId : (meR?meR.id:null);
 if(id!=null && live.st && live.st[id] && Array.isArray(live.st[id].codes)) return live.st[id].codes;
 if(live.me && Array.isArray(live.me.codes)) return live.me.codes;
 return (live.codes=[]);
}
/* KONIEC STARTÓW W TYCH ZAWODACH.
   Wpisuje `code` do każdego pozostałego biegu zawodnika i zamyka mu kartę.
   `opts.code`  — 'w' (wykluczenie) albo '-' (zmieniony przez rezerwowego),
   `opts.red`   — czy powodem jest czerwona kartka.
   Generator meczu przed każdym kolejnym biegiem sprawdza `liveCanStart(live)`:
   jeżeli zwróci false, biegu NIE rozgrywa i NIE dopisuje już żadnego kodu —
   kody są w karcie od momentu wykluczenia. */
function liveExcludeRest(live, why, out, opts){
 opts=opts||{}; out=out||[];
 if(!live || live.outOfMeeting) return out;
 const code = opts.code || LIVE_EXC;
 live.outOfMeeting = true;
 live.forceCode = code;
 live.outWhy = why || 'wykluczenie z zawodów';
 if(opts.red) live.red = true;
 /* `fill:false` (albo live.noFill) = kody dopisuje sam generator przy każdym
    biegu — tak działa turniej indywidualny, gdzie bieg i tak trzeba przeliczyć
    bez wykluczonego. Mecz drużynowy wypełnia kartę od razu. */
 const fill = opts.fill!==false && !live.noFill;
 const left = fill ? liveHeatsLeft(live) : null;
 if(!fill){
   live.excludedCount=null;
   out.push('Każdy twój pozostały bieg w tych zawodach zostaje zapisany jako „'+code+'".');
 } else if(left){
   const sink = liveCodeSink(live);
   /* KOLEJNOŚĆ W KARCIE MECZOWEJ. Kontuzja zdarza się W TRAKCIE biegu, którego
      wynik nie jest jeszcze zapisany — gdybyśmy dopisali „w" od razu, kod
      bieżącego biegu wylądowałby PO wykluczeniach. Dlatego w trakcie jazdy
      kody czekają w `live.fillPending`, a generator wywołuje je zaraz po
      zapisaniu wyniku biegu. */
   const push=()=>left.forEach(()=>sink.push(code));
   if(live.inRace) live.fillPending=push; else push();
   live.excludedHeats = left.filter(n=>typeof n==='number');
   live.excludedCount = left.length;
   if(left.length) out.push('Do karty meczowej wchodzi „'+code+'" przy '+left.length+
     (left.length===1?' pozostałym biegu':' pozostałych biegach')+
     (live.excludedHeats && live.excludedHeats.length ? ' (bieg '+live.excludedHeats.join(', ')+')' : '')+'.');
   else out.push('Nie zostało ci już nic do przejechania — karta meczowa zamknięta.');
 } else {
   // programu nie znamy (np. turniej liczony na bieżąco): kod dopisze generator,
   // czytając live.forceCode przy każdym biegu, którego zawodnik już nie pojedzie
   live.excludedCount = null;
   out.push('Wszystkie twoje pozostałe biegi w tych zawodach zostają zapisane jako „'+code+'".');
 }
 return out;
}
/* Czy zawodnik ma jeszcze prawo startu w tych zawodach. */
function liveCanStart(live){ return !(live && (live.outOfMeeting || live.red)); }
/* CZERWONA KARTKA — dwie żółte albo bezpośrednio od sędziego. */
function liveRedCard(live, out, why, opts){
 out=out||[];
 if(!live || live.red) return out;
 live.red=true;
 return liveExcludeRest(live, why||'czerwona kartka', out, Object.assign({code:LIVE_EXC, red:true}, opts||{}));
}

function livePitCosts(live, kind){
 const p=G.p, S=G.S;
 const out=[];
 if(kind==='yellow'){
   live.yellow=(live.yellow||0)+1;
   p.budget-=BIGM.yellowCost; S.fines=(S.fines||0)+BIGM.yellowCost;
   out.push('ŻÓŁTA KARTKA od sędziego zawodów — '+zl(BIGM.yellowCost)+' kary regulaminowej.');
   if(live.yellow>=2 && !live.red){
     out.push('DRUGA żółta kartka w jednych zawodach. Sędzia zamienia ją automatycznie na CZERWONĄ — koniec startów.');
     liveRedCard(live, out, 'druga żółta kartka w jednych zawodach');
   }
 }
 return out;
}
/* Presja na trenerze: „wpuść mnie za niego". */
function livePushChance(live, mates){
 const p=G.p, S=G.S;
 const weak = mates.length ? mates[mates.length-1] : null;
 let ch = BIGM.pushBase + (p.med-50)*0.14 + (S.atm-50)*0.10 + (p.loyalty-40)*0.08;
 if(weak) ch += cl((G.riders.find(r=>r.me).ovr - weak.ovr)*0.8, -20, 20);
 if(live.pushed) ch -= 22*live.pushed;                 // za drugim razem trener już nie słucha
 if(!liveCanStart(live)) return 0;                     // wykluczony nie ma o co prosić
 return Math.round(cl(ch, 3, 88));
}

/* ============================================================
   9c-2. STAN TORU, PROTESTY I ODWOŁANIE ZAWODÓW
   (patch 21.08.2026, Sprint 2)
   ------------------------------------------------------------
   Zgłoszenie: gracz nie miał ŻADNEJ drogi, żeby przerwać beznadziejny mecz —
   „opuść park maszyn" kończyło tylko jego własne zawody, a spotkanie jechało
   dalej. Teraz są DWIE OSOBNE drogi, obie z ceną:

     · OPUŚĆ PARK MASZYN — poza dotychczasowymi skutkami (kara umowna,
       profesjonalizm, atmosfera, lojalność, ryzyko zerwania kontraktu)
       dochodzi szansa, że sędzia uzna to za powód do ODWOŁANIA ZAWODÓW:
       od 1% na betonie do 15% na torze najtrudniejszym.

     · PROTESTUJ ZE WZGLĘDU NA STAN TORU (tylko MIĘDZY biegami) — kosztuje
       ryzyko żółtej kartki (a druga żółta to czerwona i koniec startów),
       ale nie zrywa ci kontraktu. Szansa na odwołanie meczu też rośnie
       z trudnością toru i jest ZAWSZE NIŻSZA niż przy opuszczeniu parku.
       To niezmiennik, nie zbieg okoliczności: domykamy go twardo przez
       Math.min(protest, leave-1) — patrz liveProtestCancelChance().

   Co się dzieje po skutecznym przerwaniu, liczy liveAbandonMeeting():
   po 8. biegu (12. w play-offie i play-downie) wynik jest regulaminowo
   ważny i staje się końcowy; wcześniej — mecz anulowany i wraca do
   terminarza jako POWTÓRKA OD 0:0 (engine/15-liga-chronologia.js).
   ============================================================ */

/* Wszystkie gałki w jednym miejscu. Jeżeli chcesz je trzymać razem z resztą
   liczb wielkiego meczu, wystarczy dopisać `abandon:{...}` do BIGM
   w data/70-wielki-mecz.js — ten obiekt nadpisze wartości domyślne. */
const ABANDON = Object.assign({
  heatStd      : 8,     // runda zasadnicza: po tylu biegach wynik jest ważny
  heatPO       : 12,    // play-off / play-down: dopiero po tylu
  leaveMin     : 1,     // % odwołania po opuszczeniu parku — tor „beton"
  leaveMax     : 15,    // % odwołania po opuszczeniu parku — tor najtrudniejszy
  protestFactor: 0.40,  // protest = tyle % szansy z powyższego (zawsze mniej)
  protestYellow: 35,    // % żółtej kartki za pierwszy protest
  protestYellowStep: 15,// każdy kolejny protest w tych zawodach o tyle drożej
  protestAtm   : 2,     // atmosfera w drużynie za protest (kolegom się nie podoba)
  protestMed   : 2,     // medialność — kamery lubią awantury o stan toru
  replayMin    : 1,     // za ile kolejek najwcześniej powtórka
  replayMax    : 3,     // …i najpóźniej
  replayCap    : 2      // ile razy z rzędu wolno przerwać ten sam mecz na żywo
}, (typeof BIGM!=='undefined' && BIGM.abandon) || {});

const LIVE_FALL = 'u';   // kod „upadek / nie ukończył" w karcie meczowej

/* Kod do karty meczowej dla zawodnika, który nie dojechał biegu.
   Generator (engine/31, engine/32) powinien pytać TĘ funkcję zamiast
   porównywać `x.out` z 'd'/'w' na piechotę — od Sprintu 2 istnieje też 'u'. */
function liveOutCode(x){
  if(!x || !x.out) return null;
  return x.out==='d' ? 'd' : x.out==='u' ? LIVE_FALL : LIVE_EXC;
}

/* --- TRUDNOŚĆ TORU ---------------------------------------------------
   BIGM.grip to lista stanów toru od najtwardszego (beton, indeks 0) do
   najtrudniejszego (indeks ostatni). Stan live trzyma sam OBIEKT przyczepności
   (L.grip.n / L.grip.d), a ekran biegu — indeks (RC.grip). Bierzemy to,
   co akurat jest pod ręką. */
function liveGripIdx(live){
  if(live==null) return 0;
  if(typeof live==='number') return live;
  if(typeof live.gripI==='number') return live.gripI;
  if(typeof live.grip==='number') return live.grip;
  if(live.grip && typeof BIGM!=='undefined' && Array.isArray(BIGM.grip)){
    const i=BIGM.grip.indexOf(live.grip);
    if(i>=0) return i;
    const j=BIGM.grip.findIndex(g=>g && g.n===live.grip.n);
    if(j>=0) return j;
  }
  return 0;
}
/* 0 = beton, 1 = tor, na którym nie da się jechać. */
function liveTrackHard(live){
  const n = (typeof BIGM!=='undefined' && Array.isArray(BIGM.grip)) ? BIGM.grip.length : 5;
  return cl(liveGripIdx(live) / Math.max(1, n-1), 0, 1);
}
/* Szansa, że sędzia odwoła zawody po tym, jak WYJEDZIESZ Z PARKU MASZYN. */
function liveLeaveCancelChance(live){
  const d = liveTrackHard(live);
  return Math.round(cl(ABANDON.leaveMin + d*(ABANDON.leaveMax-ABANDON.leaveMin),
                       ABANDON.leaveMin, ABANDON.leaveMax));
}
/* Szansa, że sędzia odwoła zawody po TWOIM PROTEŚCIE. Z definicji niższa. */
function liveProtestCancelChance(live){
  const lv = liveLeaveCancelChance(live);
  return Math.max(0, Math.min(Math.round(lv*ABANDON.protestFactor), lv-1));
}
/* Szansa na żółtą kartkę za protest — rośnie z każdym kolejnym w tych zawodach. */
function liveProtestYellowChance(live){
  const n = (live && live.protests) || 0;
  const prof = (G && G.p) ? G.p.prof : 50;
  return Math.round(cl(ABANDON.protestYellow + n*ABANDON.protestYellowStep - (prof-50)*0.15, 5, 92));
}

/* --- ILE BIEGÓW JUŻ ODJECHANO -----------------------------------------
   Generator zna to dokładnie i powinien podawać `live.heatsDone`. Reszta to
   awaryjne odczytanie ze stanu: bieg AKTUALNIE jechany jeszcze się nie liczy. */
function liveHeatsDone(live){
  if(!live) return 0;
  if(typeof live.heatsDone==='number') return live.heatsDone;
  const now=[live.heatNo, live.heatIdx, live.heat, live.h].find(v=>typeof v==='number');
  if(now==null) return 0;
  return Math.max(0, live.inRace ? now-1 : now);
}
/* Czy to faza play-off / play-down (próg 12 biegów zamiast 8).
   UWAGA: „MECZ O PLAY-OFF" w ostatniej kolejce rundy zasadniczej to NIE jest
   faza play-off — dlatego regexp jest zakotwiczony na początku napisu, a
   engine/17-playoff.js i tak powinien podawać jawne `po:true`. */
function liveIsPO(live){
  if(!live) return false;
  if(typeof live.po==='boolean') return live.po;
  if(live.phaseKind) return live.phaseKind==='po';
  return /^\s*play-?(off|down)/i.test(String(live.stage||''));
}

/* --- ODWOŁANIE ZAWODÓW -------------------------------------------------
   Jedno wejście dla obu dróg (park maszyn i protest) oraz dla czegokolwiek,
   co dopiszemy później. Ustawia `live.abandoned` — generator meczu ma po tym
   PRZERWAĆ pętlę biegów i zwrócić wynik z `abandoned/abandonCounted`. */
function liveAbandonMeeting(live, why, out, opts){
  out=out||[]; opts=opts||{};
  if(!live || live.abandoned) return out;
  const need = liveIsPO(live) ? ABANDON.heatPO : ABANDON.heatStd;
  const done = liveHeatsDone(live);
  live.abandoned     = true;
  live.abandonWhy    = why || 'zawody przerwane';
  live.abandonHeat   = done;
  live.abandonNeed   = need;
  live.abandonCounted= done >= need;
  live.abandonBy     = opts.by || null;          // 'leave' | 'protest' | inne
  out.push('SĘDZIA PRZERYWA ZAWODY — '+live.abandonWhy+'.');
  if(live.abandonCounted){
    out.push('Odjechano '+done+' '+(done===1?'bieg':'biegów')+', a regulamin uznaje zawody za '+
      'rozegrane po '+need+'. biegu'+(liveIsPO(live)?' (faza play-off / play-down)':'')+
      '. WYNIK Z TEJ CHWILI JEST WYNIKIEM KOŃCOWYM.');
  } else {
    out.push('Odjechano dopiero '+done+' '+(done===1?'bieg':'biegów')+' — regulamin wymaga '+need+
      '. Zawody są ANULOWANE: do tabeli nie wchodzi nic, a spotkanie zostanie '+
      'rozegrane od stanu 0:0 w nowym terminie.');
  }
  return out;
}

/* --- PROTEST ZE WZGLĘDU NA STAN TORU (akcja MIĘDZY biegami) ------------- */
function liveProtestOk(live){
  /* Protestować wolno tylko z parku maszyn między biegami i tylko dopóki
     w ogóle masz prawo startu — wykluczony nie jest już stroną. */
  return !!(live && !live.abandoned && liveCanStart(live));
}
function liveProtest(live, out){
  out=out||[];
  if(!live) return out;
  if(!liveProtestOk(live)){ out.push('Nie masz już czego protestować — twoje zawody i tak się skończyły.'); return out; }
  const p=G.p, S=G.S;
  const cCh = liveProtestCancelChance(live);
  const yCh = liveProtestYellowChance(live);
  live.protests=(live.protests||0)+1;
  out.push('PROTEST: idziesz do wieży z kolegami z drużyny i pokazujesz sędziemu koleinę na drugim łuku. '+
    'Spiker udaje, że nic nie widzi, kamera jedzie prosto na ciebie.');
  p.med = cl(p.med + ABANDON.protestMed, 0, 99);
  if(S) S.atm = cl((S.atm==null?50:S.atm) - ABANDON.protestAtm, 0, 100);
  live.medGain=(live.medGain||0)+ABANDON.protestMed;
  if(chance(cCh)){
    liveAbandonMeeting(live, 'protest zawodników na stan toru ('+cCh+'% szans)', out, {by:'protest'});
    return out;
  }
  out.push('Sędzia schodzi na tor, kopie nogą nawierzchnię, kręci głową. Jedziemy dalej.');
  if(chance(yCh)) livePitCosts(live, 'yellow').forEach(m=>out.push(m));
  else out.push('Tym razem uszło ci to płazem — sędzia uznał, że masz prawo pytać.');
  return out;
}

/* --- OPUSZCZENIE PARKU MASZYN: DOKŁADKA DO DOTYCHCZASOWYCH SKUTKÓW ------
   engine/31 wywołuje to PO naliczeniu kary umownej, profesjonalizmu,
   atmosfery, lojalności i losowania zerwania kontraktu. */
function liveLeaveCancelRoll(live, out){
  out=out||[];
  if(!live || live.abandoned) return out;
  const ch = liveLeaveCancelChance(live);
  out.push('Sędzia patrzy, jak pakujesz motocykl do busa przy '+
    (typeof BIGM!=='undefined' && Array.isArray(BIGM.grip) ? esc0(BIGM.grip[liveGripIdx(live)].n) : 'tym stanie toru')+
    ' — '+ch+'% szans, że uzna to za argument za odwołaniem zawodów.');
  if(chance(ch))
    liveAbandonMeeting(live, 'zawodnik opuścił park maszyn, a stan toru dał sędziemu pretekst ('+ch+'%)',
      out, {by:'leave'});
  else
    out.push('Nie uznał. Zawody jadą dalej, a ty stoisz na parkingu i słuchasz spikera przez płot.');
  return out;
}
