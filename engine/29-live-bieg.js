/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LIVE BIEG
   Jeden bieg na żywo: start, decyzje co łuk, kraksy
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4655-4805 oryginału).
   ============================================================ */
/* ============================================================
   9b. JEDEN BIEG NA ŻYWO
   ------------------------------------------------------------
   Bieg dzieli się na cztery momenty (BIGM.phases): taśma, pierwszy łuk,
   walka w środku dystansu i ostatni łuk. W każdym z nich wybierasz linię
   jazdy. Wszystko liczy się na tej samej skali, co zwykły bieg silnika
   (rideStr + BAL.sigma) — decyzja przesuwa cię o kilka punktów w górę
   albo w dół, więc potrafi zmienić miejsce w biegu, ale nie zamieni
   zawodnika z OVR 30 w mistrza świata.
   ============================================================ */
function liveMkRace(entries, ctx, meId, fitIdx, spy, mod){
 /* SPRINT 4: `mod` to korekta z liveRideMod() — ustawienia motocykla
    (dysza, gaźnik, długość, zapłon) plus skutki zdarzeń i wywiadów. */
 const mS=(mod&&mod.str)||0, mD=(mod&&mod.def)||0;
 const rid = entries.map(e=>{
   const me = e.r.id===meId;
   const trb = (e.trouble||0) * (me?0.5:1);
   const base = rideStr(e.r.ovr + (e.r.form||0) - trb, e.ref, e.home?BAL.home:0);
   const val = base + (me ? BIGM.fitStr[fitIdx] + (spy?1.2:0) + mS : 0);
   /* `base` to wartość SPRZED pierwszej decyzji. Powtórka biegu (Sprint 2)
      cofa wszystkich do niej — inaczej wykluczenie kogokolwiek byłoby premią
      dla tego, kto zdążył już ugrać kilka punktów na łuku. */
   return {e, id:e.r.id, name:e.r.name, num:e.num, side:e.side, me,
     val, base:val, out:null};
 });
 /* Defekty i wykluczenia losujemy JAK W SILNIKU, ale ujawniamy je w losowym
    momencie biegu — inaczej gracz podejmowałby decyzje, wiedząc już, że
    i tak nie dojedzie. */
 rid.forEach(x=>{
   const me = x.id===meId;
   const dP = me&&ctx ? ctx.defP + BIGM.fitDef[fitIdx] + mD + (x.e.trouble||0)*0.0016
                      : cl(0.028 + (78-x.e.r.ovr)*0.0006 + (x.e.trouble||0)*0.0022, 0.012, 0.14);
   const eP = me&&ctx ? ctx.excP : cl(0.024 + (74-x.e.r.ovr)*0.0005, 0.010, 0.065);
   const rr=Math.random();
   if(rr<dP)      { x.fate='d'; x.fateAt=R(0,3); }
   else if(rr<dP+eP){ x.fate='w'; x.fateAt=R(0,3); }
 });
 return {ph:0, rid, log:[], done:false, hist:[], reruns:0, rerun:null, restart:false};
}
function liveOrder(rc){
 const live=rc.rid.filter(x=>!x.out).sort((a,b)=>b.val-a.val);
 const dead=rc.rid.filter(x=>x.out);
 return live.concat(dead);
}
function liveMyPos(rc){
 const o=liveOrder(rc); const i=o.findIndex(x=>x.me);
 return i<0?4:i+1;
}
/* Rywale też jadą: drobny dryf co łuk, żeby pozycje nie stały w miejscu. */
function liveDrift(rc, guard){
 rc.rid.forEach(x=>{ if(x.out||x.me) return; x.val += gauss(0, guard?1.4:2.6); });
}
function liveFate(rc, ph){
 const out=[];
 rc.rid.forEach(x=>{
   if(x.out || x.fate==null || x.fateAt!==ph) return;
   if(x.fate==='w'){
     /* Sprint 2: wykluczenie KOGOKOLWIEK przerywa bieg i każe go powtórzyć. */
     liveExclude(rc, x, 'decyzja sędziego', out);
     return;
   }
   x.out=x.fate;
   out.push((x.me?'TWÓJ MOTOCYKL':'Motocykl rywala ('+esc0(x.name)+')')+
     ' — DEFEKT. Silnik gaśnie w połowie łuku.');
 });
 return out;
}
const esc0 = s => String(s);

/* --- SZANSA POWODZENIA DECYZJI --- */
function liveMoveChance(rc, move, grip, fitIdx){
 const p=G.p;
 const me=rc.rid.find(x=>x.me);
 const opp=rc.rid.filter(x=>!x.me && !x.out);
 const avg=opp.length? opp.reduce((a,x)=>a+x.val,0)/opp.length : me.val;
 const edge=cl(me.val-avg, -30, 30);
 let base = {kreda:48, zewn:48, pika:44, obrona:76, nozyce:41, ajs:4, plot:12}[move]||45;
 if(move==='kreda') base += (2-grip)*4.5;         // sucho i szklisto — kreda jedzie
 if(move==='zewn')  base += (grip-2)*4.5;         // ciężko i mokro — świeży tor przy bandzie
 if(move==='pika')  base += (p.prof-50)*0.06;
 /* SPRINT 4 — DWIE NOWE LINIE.
    NOŻYCE: ścinka z zewnętrznej do małej. Klasyka, więc liczy się to,
    co w klasyce: umiejętności (OVR), stan toru i to, o ile jesteś
    szybszy od reszty. Solidna szansa na wyprzedzenie, uczciwa cena.
    AJS SPIDŁEJ: wyprostowany motocykl po bandach. Baza 4%, bo to nie
    jest manewr — to jest zdarzenie losowe, które sam na siebie
    sprowadzasz. Umiejętności podnoszą ją najwyżej do kilkunastu procent
    i ANI PUNKTU WIĘCEJ (twardy sufit w cl() niżej). */
 if(move==='nozyce') base += (grip-2)*2.2 + (p.ovr-52)*0.26 + (p.prof-50)*0.05;
 if(move==='ajs')    base += (p.ovr-70)*0.16 + (p.prof-50)*0.04 + (2-Math.abs(grip-2))*0.8;
 base += edge*0.85 + (p.prof-50)*0.09 - fitIdx*2.2;
 if(move==='ajs') return Math.round(cl(base, 1, 15));
 return Math.round(cl(base, 4, 93));
}
/* Kolizje, powtórki biegu i modal po upadku (Sprint 2) wyprowadziliśmy do
   `engine/29b-live-kolizje.js` — ten plik dobijał do 25 KB. Stamtąd pochodzą:
   liveExclude, liveNeedRerun, liveRerunApply, liveFinishWithoutMe, liveCollide,
   liveInjureRival, liveBura, liveFallResolve, liveSimFall, liveSimDefect
   oraz stała COLL. liveResolveMove() poniżej z nich korzysta. */
/* --- ROZSTRZYGNIĘCIE JEDNEJ DECYZJI --- */
function liveResolveMove(rc, move, grip, fitIdx, live){
 const me=rc.rid.find(x=>x.me);
 const out=[];
 const ch=liveMoveChance(rc, move, grip, fitIdx);
 const ok=chance(ch);
 /* WŁASNY UPADEK. Od Sprintu 2 nie rozstrzyga się sam: leżysz, a wybór należy
    do ciebie (liveFallResolve). Generator, który nie chce modala — np. turniej
    indywidualny — po prostu nie ustawia `live.fallAsk` i dostaje starą wersję:
    wykluczenie i powtórka bez ciebie. */
 const crash=(why)=>{
   live.crashed=(live.crashed||0)+1;
   liveCrashDamage(live, out);
   if(me.out) return;
   if(live && live.fallAsk){
     live.fallPending={why:why||'upadek', pos:liveMyPos(rc)};
     out.push('LEŻYSZ. Motocykl w płocie, kask w piachu, czerwone światła. '+
       'Sędzia patrzy, karetka rusza — a ty masz sekundę na decyzję.');
   } else {
     liveExclude(rc, me, why||'upadek', out);
   }
 };
 if(move==='kreda'){
   if(ok){ me.val += R(5,9); out.push('Wchodzisz po kredzie tak wąsko, że sędzia liniowy odskakuje. Wyjeżdżasz z łuku przed rywalem.'); }
   else if(chance(6)){ crash('upadek na wewnętrznej'); }
   else { me.val -= R(2,5); out.push('Przednie koło ucieka na wewnętrznej, musisz odpuścić gaz. Tracisz pół motocykla.'); }
 } else if(move==='zewn'){
   if(ok){ me.val += R(4,8); out.push('Po dmuchawie, przy bandzie, na świeżym torze — łapiesz przyczepność i objeżdżasz go z zewnątrz.'); }
   else if(chance(4)){ crash('upadek przy bandzie'); }
   else { me.val -= R(1,4); out.push('Szeroka droga okazała się po prostu dłuższa. Rywal wyszedł z łuku pierwszy.'); }
 } else if(move==='pika'){
   if(ok){
     me.val += R(6,11);
     out.push('PIKA! Wjeżdżasz mu pod koło i zamykasz drzwi. Trybuny wstają.');
     if(chance(20)){
       const v=liveVictim(rc);
       if(v){
         out.push(esc0(v.name)+' nie wytrzymał tego manewru i położył motocykl.');
         liveCollide(rc, live, v, out, {injCh:COLL.rivalInjuryPika});
       }
     }
   } else {
     const r=R(1,100);
     if(r<=14){ crash('upadek po nieudanej pice'); }
     else if(r<=22){
       const v=liveVictim(rc);
       out.push('Wjechałeś w niego jak w bramę garażową. Obaj po dmuchawie.');
       if(v) liveCollide(rc, live, v, out, {injCh:COLL.rivalInjuryPika});
       crash('spowodowanie kolizji');
     }
     else { me.val -= R(3,6); out.push('Zamknął ci drzwi wcześniej, niż zdążyłeś wjechać. Musisz się cofnąć i odpuścić.'); }
   }
 } else if(move==='nozyce'){
   /* KLASYCZNE, ŻUŻLOWE NOŻYCE — wychodzisz szeroko, ścinasz do małej
      i zamykasz mu drzwi na wyjściu. Kiedyś tak jeździła cała liga. */
   if(ok){
     me.val += R(6,11);
     live.nozyceOk=(live.nozyceOk||0)+1;
     out.push('NOŻYCE. Wyprowadzasz motocykl na zewnętrzną, ścinasz do małej i wychodzisz z łuku dokładnie tam, '+
       'gdzie on chciał być za pół sekundy. Podręcznikowo.');
     if(chance(10)){
       const v=liveVictim(rc);
       if(v){
         out.push('Ścinka była o dziesięć centymetrów za ostra — '+esc0(v.name)+' musiał puścić gaz i położył motocykl.');
         liveCollide(rc, live, v, out, {down:false});
       }
     }
   } else {
     const r=R(1,100);
     if(r<=9){ crash('upadek przy ścince do wewnętrznej'); }
     else if(r<=16){
       const v=liveVictim(rc);
       out.push('Ściąłeś w miejsce, w którym już ktoś był.');
       if(v) liveCollide(rc, live, v, out, {down:false});
       me.val -= R(3,7);
     }
     else { me.val -= R(2,6); out.push('Wyszedłeś na zewnętrzną i nie miałeś już czym wrócić do środka. Ścinka spóźniona o pół łuku.'); }
   }
 } else if(move==='ajs'){
   /* AJS SPIDŁEJ. Wyprostowany motocykl, gaz do dechy, jazda po bandach.
      Uda się — wyprzedzasz WSZYSTKICH przed sobą naraz. Nie uda się —
      a nie uda się prawie zawsze — to jest jeden z najcięższych upadków,
      jakie ta gra potrafi zrobić. Szanse skalują się umiejętnościami:
      lepszy zawodnik częściej trafia i rzadziej się zabija, ale nikt,
      nigdy, nie ma tu przewagi większej niż kilkanaście procent. */
   live.ajsTries=(live.ajsTries||0)+1;
   if(ok){
     const others=rc.rid.filter(x=>!x.out && !x.me);
     const top = others.length ? Math.max.apply(null, others.map(x=>x.val)) : me.val;
     me.val = Math.max(me.val, top) + R(4,9);
     live.ajsOk=(live.ajsOk||0)+1;
     out.push('AJS SPIDŁEJ, AJS SPIDŁEJ AHAHAHAHA — motocykl wyprostowany jak struna, koło na bandzie, '+
       'gaz zablokowany i cztery sekundy, w których nikt na tym stadionie nie oddycha.');
     out.push('TO NIE JEST ZEWNĘTRZNA, NIE WIEM, JAK NAZWAĆ TOR KTÓRYM PODRÓŻUJE');
     out.push('WYPRZEDZASZ WSZYSTKICH PRZED SOBĄ. Jednym manewrem, po bandach, na pierwsze miejsce.');
     const med=R(8,14);
     G.p.med=cl(G.p.med+med,0,99);
     if(G.S) G.S.bigMed=(G.S.bigMed||0)+med;
     live.medGain=(live.medGain||0)+med;
   } else {
     live.ajsFail=(live.ajsFail||0)+1;
     const p2=G.p;
     /* im lepszy zawodnik, tym częściej z tego wychodzi bez katastrofy */
     const crashCh = Math.round(cl(84 - (p2.ovr-50)*0.32 - (p2.prof-50)*0.10, 52, 94));
     const r=R(1,100);
     if(r<=crashCh){
       /* POTĘŻNY UPADEK — dokładka do zwykłej kraksy */
       const eq=R(3,9);
       p2.equip=cl(p2.equip-eq,1,99);
       out.push('Motocykl wchodzi w bandę bokiem, odbija się i leci przez pół prostej. '+
         'Sprzęt po tym locie: -'+eq+' dodatkowo (przód, tył, zbiornik i kilka rzeczy bez nazwy).');
       if(chance(24)){
         const dmg=R(2,4);
         p2.ovr=cl(p2.ovr-dmg,1,99);
         const meR=G.riders.find(r2=>r2.me); if(meR) meR.ovr=cl(meR.ovr-dmg,1,99);
         if(typeof logOvr==='function') logOvr(-dmg, 'AJS SPIDŁEJ — upadek po bandach');
         live.hurt=(live.hurt||0)+dmg;
         out.push('Bark, obojczyk i lewa strona żeber. -'+dmg+' OVR i rozmowa z lekarzem zawodów.');
         if(chance(45)) liveMedicalOut(live, out, 'uraz po jeździe po bandach (-'+dmg+' OVR)');
       }
       crash('AJS SPIDŁEJ — jazda po bandach');
     } else if(r<=crashCh+9){
       const v=liveVictim(rc);
       out.push('Zszedłeś z bandy dokładnie na tor, po którym jechał '+(v?esc0(v.name):'rywal')+'.');
       if(v) liveCollide(rc, live, v, out, {injCh:COLL.rivalInjuryPlot});
       crash('zabranie rywala z bandy');
     } else {
       me.val -= R(5,10);
       out.push('W ostatniej chwili puściłeś gaz i zjechałeś z bandy na tor. Straciłeś dwa miejsca, '+
         'ale masz jeszcze wszystkie kości tam, gdzie powinny być.');
     }
   }
 } else if(move==='obrona'){
   if(ok){ me.val += R(0,1); out.push('Zamykasz wewnętrzną i pilnujesz tego, co masz. Nudno. Skutecznie.'); }
   else { me.val -= R(2,4); out.push('Zbyt zachowawczo — objechał cię z zewnątrz, zanim zorientowałeś się, że tam w ogóle jest tor.'); }
 } else if(move==='plot'){
   const r=R(1,100);
   if(r<=62){ out.push('Płot wygrał. Płot zawsze wygrywa.'); crash('jazda przy płocie'); }
   else if(r<=82){
     me.val += R(8,14);
     out.push('NIE WIADOMO JAK, ALE PRZEJECHAŁEŚ. Odbiłeś się od dmuchawy, złapałeś przyczepność i wyjechałeś jak z procy. '+
       'Spiker krzyczy coś, czego nie da się powtórzyć w telewizji publicznej.');
     G.p.med=cl(G.p.med+3,0,99); live.medGain=(live.medGain||0)+3;
   }
   else if(r<=94){
     const v=liveVictim(rc);
     out.push('Wziąłeś ze sobą '+(v?esc0(v.name):'rywala')+'.');
     if(v) liveCollide(rc, live, v, out, {injCh:COLL.rivalInjuryPlot});
     crash('zabranie rywala do płotu');
   }
   else { me.val -= R(0,2); out.push('W ostatniej chwili puściłeś gaz. Płot został płotem, a ty zawodnikiem. Na razie.'); }
 }
 return {ch, ok, out};
}

/* Kraksa kosztuje: sprzęt zawsze, zdrowie czasami. */
function liveCrashDamage(live, out){
 const p=G.p;
 const eq=R(2,7);
 p.equip=cl(p.equip-eq,1,99);
 out.push('Sprzęt po kraksie: -'+eq+' (rama, kierownica, błotnik, duma).');
 if(chance(11)){
   const dmg=R(1,3);
   p.ovr=cl(p.ovr-dmg,1,99);
   const meR=G.riders.find(r=>r.me); if(meR) meR.ovr=cl(meR.ovr-dmg,1,99);
   logOvr(-dmg, 'kraksa w wielkim meczu sezonu');
   live.hurt=(live.hurt||0)+dmg;
   out.push('Bark i żebra dostały swoje. -'+dmg+' OVR — do końca sezonu jeździsz na przeciwbólowych.');
   /* Sprint 1: cięższy uraz to nie tylko -OVR. Lekarz zawodów zamyka starty,
      a drużyna musi kogoś wpuścić w pozostałe biegi — patrz liveMedicalOut(). */
   if(dmg>=3 || chance(30)) liveMedicalOut(live, out, 'uraz po kraksie (-'+dmg+' OVR)');
 }
}

/* ============================================================
   9d. ZASTĘPSTWA MEDYCZNE (patch 21.08.2026, Sprint 1)
   ------------------------------------------------------------
   Zgłoszenie testerów: zawodnik zbierał kontuzję w wielkim meczu i… jechał
   dalej, jakby nic się nie stało, albo jego biegi znikały z karty meczowej
   bez śladu. Regulaminowo jest tak:
     · kontuzjowanego, którego lekarz zawodów nie dopuszcza do startu,
       w POZOSTAŁYCH biegach zastępuje rezerwowy — o ile jest kogo wpuścić:
         – ten sam klub, wolny limit startów (art. 719: maks. 5 startów),
         – nie stoi już w tym biegu,
         – biegi młodzieżowca przejmuje w pierwszej kolejności inny U21;
           senior wchodzi tam dopiero wtedy, gdy młodzieżowca nie ma,
       a kontuzjowany dostaje przy tych biegach kod „-" (zmieniony);
     · jeżeli nie ma kogo wpuścić pod taśmę, bieg odjeżdża bez tej pozycji,
       a w karcie meczowej ląduje „w" — WYKLUCZENIE ZA PRZEKROCZENIE LIMITU
       DWÓCH MINUT (zawodnik nie stawił się na starcie w regulaminowym czasie).
   Samo wypełnianie karty robi liveExcludeRest() z engine/30-live-park-maszyn.js
   — ta sama maszyneria, co przy czerwonej kartce.
   ============================================================ */
/* Kto może wskoczyć za kontuzjowanego. Zwraca zawodnika albo null. */
function liveMedSub(live, injured, opts){
 opts=opts||{};
 if(!injured) return null;
 const limit  = opts.limit!=null ? opts.limit : 5;
 const inHeat = opts.inHeat || [];
 const starts = opts.starts || (()=>0);
 let pool = opts.pool;
 if(!pool){
   const club = opts.club || live.club
     || (typeof clubOf==='function' && G && G.p ? (clubOf(G.p)||{}).name : null);
   pool = (club && typeof availableRiders==='function') ? availableRiders(club) : [];
 }
 pool = (pool||[]).filter(r => r && r.id!==injured.id && !r.out && !r.me
                            && !inHeat.includes(r.id) && starts(r) < limit);
 if(!pool.length) return null;
 // młodzieżowca zastępuje młodzieżowiec — dopiero gdy takiego nie ma, wchodzi senior
 if(typeof isJun==='function' && isJun(injured)){
   const jn = pool.filter(isJun);
   if(jn.length) pool = jn;
 }
 return pool.sort((a,b)=> (starts(a)-starts(b)) || (b.ovr-a.ovr))[0] || null;
}
/* Kontuzja Gracza w trakcie zawodów: koniec startów + zastępstwo albo dwie minuty. */
function liveMedicalOut(live, out, why){
 out=out||[];
 if(!live || live.medOut || live.outOfMeeting) return out;
 live.medOut=true; live.injured=true;
 live.injuredWhy = why || 'kontuzja w trakcie zawodów';
 out.push('LEKARZ ZAWODÓW: '+live.injuredWhy+' — brak zgody na dalsze starty w tym meczu.');
 const meR = (live.meId!=null && live.st && live.st[live.meId]) ? live.st[live.meId].r
           : (G.riders && G.riders.find(r=>r.me));
 const sub = liveMedSub(live, meR || {id:null}, {
   inHeat: (live.rc && Array.isArray(live.rc.rid)) ? live.rc.rid.map(x=>x.id) : [],
   starts: r => (live.st && live.st[r.id] ? (live.st[r.id].starts||0) : 0)
 });
 if(sub){
   live.medSub = {id:sub.id, name:sub.name};
   live.medSubId = sub.id;              // ← buildEntries() w engine/31 wpuszcza DOKŁADNIE jego
   out.push('ZASTĘPSTWO: w twoich pozostałych biegach jedzie '+esc0(sub.name)+
     '. Twoja karta meczowa zostaje zamknięta kodem „-".');
   if(typeof liveExcludeRest==='function')
     liveExcludeRest(live, live.injuredWhy, out, {code:(typeof LIVE_REP!=='undefined'?LIVE_REP:'-'), med:true});
 } else {
   live.twoMinutes = true;
   out.push('Nie ma kogo wpuścić: rezerwowi mają wyjeżdżony limit startów albo klub nie ma nikogo więcej pod ręką. '+
     'Sędzia odlicza dwie minuty i zamyka temat.');
   if(typeof liveExcludeRest==='function')
     liveExcludeRest(live, 'przekroczenie limitu dwóch minut (brak zastępstwa)', out,
       {code:(typeof LIVE_EXC!=='undefined'?LIVE_EXC:'w'), twoMin:true});
 }
 return out;
}
