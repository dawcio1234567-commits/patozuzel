/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: MECZ LIGOWY
   Ustawianie składu, bieg, simMeeting (system 15-biegowy)
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1514-1845 oryginału).
   ============================================================ */
/* ============================================================
   5. LIGA: KAŻDY Z KAŻDYM + REWANŻ + PUNKT BONUSOWY
   ============================================================ */
/* ============================================================
   5a. MECZ LIGOWY — SYSTEM 15-BIEGOWY (art. 717-721)
   ------------------------------------------------------------
   NAPRAWA (patch 17.08.2026): NUMERY STARTOWE BYŁY ODWRÓCONE.
   W polskiej lidze numery przydziela się tak, że GOSPODARZ jedzie z numerami
   9-15, a GOŚĆ z numerami 1-7 (w niższych ligach odpowiednio 9-16 i 1-8).
   Silnik robił dokładnie odwrotnie: w meczu u siebie Gracz dostawał numer
   1-7, czyli numer gościa, a na wyjeździe 9-15. Teraz jest zgodnie
   z regulaminem:
     · GOSPODARZ  — numery 9, 10, 11, 12, 13 (pierwsza piątka) + 14, 15 (młodzież)
     · GOŚĆ       — numery 1, 2, 3, 4, 5     (pierwsza piątka) + 6, 7  (młodzież)
   Program biegów (HEAT_SETS) zostaje ten sam — jest symetryczny, zmienia się
   wyłącznie to, która drużyna siedzi pod którym kompletem numerów.
   ============================================================ */
// Rozkład biegów I-XIII wg dwóch regulaminowych zestawów torów.
const HEAT_SETS=[
 [[1,9,3,11],[15,6,14,7],[5,12,2,13],[14,4,10,6],[11,3,12,4],[13,2,15,1],[7,10,5,9],
  [3,13,4,14],[9,1,10,2],[6,11,5,12],[12,4,9,1],[2,15,7,11],[10,5,13,3]],
 [[9,1,11,3],[6,15,7,14],[12,5,13,2],[4,14,6,10],[3,11,4,12],[2,13,1,15],[10,7,9,5],
  [13,3,14,4],[1,9,2,10],[11,6,12,5],[4,12,1,9],[15,2,11,7],[5,10,3,13]]
];
/* Numer z programu (1-15) → strona. Gospodarz: 9-15. Gość: 1-7. */
const isHomeNum = n => n>=9;
/* Numery „w programie" dla danej strony: gospodarz startuje od 9. */
const numFor = (side, slot) => side==='h' ? slot+8 : slot;
/* Pola startowe, kaski, logika par pod taśmą i cały regulamin rezerw
   (limity młodzieżowca, zakaz zdejmowania juniora przez seniora) siedzą
   w osobnym module: engine/12b-pola-i-rezerwy.js. Ten plik tylko z nich
   korzysta — gateOrder(), plainResOk(), tacticResOk(), tacticLegal(). */

/* ------------------------------------------------------------
   USTAWIENIE SKŁADU PRZED KOLEJKĄ (art. 717)
   · numery 6 i 7 (14 i 15) — wyłącznie zawodnicy młodzieżowi U21
   · wśród numerów 1-5 (9-13) musi jechać co najmniej jeden zawodnik U24
   · kolejność numerów 1-5 wynika z BIEŻĄCEJ formy i OVR, a nie z umowy —
     skład układany jest od nowa przed każdym meczem
   `noise` symuluje niepewność decyzji trenera (używane przy szacowaniu szans).
   ------------------------------------------------------------ */
/* Waga formy przy układaniu składu. Forma chodzi w zakresie -12..+12, więc przy
   tym mnożniku potrafi przestawić zawodnika o ok. 20 "punktów OVR" w oczach
   trenera: gwiazda w dołku ląduje poza piątką, a rozkręcony rezerwowy w niej.
   Ta sama waga jest używana przy szacowaniu szansy na skład (appearanceChance),
   więc procent z ekranu ofert i realny sezon liczą dokładnie to samo. */
const LINEUP_FORM_W = 1.7;
/* SPRINT 3: waga SYMPATII TRENERA przy układaniu składu. Trener nie stawia
   arkusza kalkulacyjnego pod taśmą — stawia ludzi, których lubi. Sympatia
   chodzi w zakresie -100..+100, więc przy tym mnożniku potrafi przesunąć
   zawodnika o ok. ±9 „punktów OVR" w oczach trenera. To wystarczy, żeby
   ulubieniec awansował o numer, a skłócony spadł poza piątkę — i za mało,
   żeby juniora z OVR 40 wstawić przed lidera. */
const LINEUP_REL_W = 0.09;
function lineupValue(r,bias,noise,clubName){
 const rel = clubName ? coachLike(clubName, r)*LINEUP_REL_W : 0;
 return r.ovr + (r.form||0)*LINEUP_FORM_W + rel + (bias&&bias.id===r.id?bias.v:0) + (noise?gauss(0,noise):0);
}
/* OSZCZĘDZANIE NA GWIAZDACH — klub bez kasy (zaległości albo pusty budżet przy
   długu) zostawia w domu 1-2 najdroższych zawodników. Ich miejsce zajmuje ten,
   kto akurat jest tańszy — czasem Gracz. */
function saveCut(pool, bias){
 const keep = r => r.me || r.id<0 || (bias && bias.id===r.id);      // Gracza nigdy nie chowamy
 const drop = Math.min(R(1,2), Math.max(0, pool.length-7));
 if(drop<=0) return pool;
 const cand = pool.filter(r=>!keep(r)).sort((a,b)=>riderWage(b)-riderWage(a)).slice(0,drop);
 if(!cand.length) return pool;
 const ids=new Set(cand.map(r=>r.id));
 const rest = pool.filter(r=>!ids.has(r.id));
 return rest.length>=7 ? rest : pool;
}
function lineupFrom(pool, noise, bias, forceSave, clubName){
 if(!pool || pool.length<3) return null;
 if(forceSave) pool = saveCut(pool, bias);
 const val=r=>lineupValue(r,bias,noise,clubName);
 const score=new Map(); pool.forEach(r=>score.set(r.id,val(r)));
 const v=r=>score.get(r.id);
 const used=new Set(), L={};
 const put=(n,r)=>{ if(r){L[n]=r; used.add(r.id);} };
 const free=()=>pool.filter(r=>!used.has(r.id)).sort((a,b)=>v(b)-v(a));
 // 1) najpierw obowiązek młodzieżowy — numery 6 i 7 (TYLKO U21, twardo)
 const jn=free().filter(isJun); put(6,jn[0]); put(7,jn[1]);
 // 2) pierwsza piątka — najlepsi z pozostałych
 for(let n=1;n<=5;n++) put(n, free()[0]);
 // 3) wymóg U24 w pierwszej piątce
 const five=()=>[1,2,3,4,5].filter(n=>L[n]);
 if(!five().some(n=>isU24(L[n]))){
   const cand=free().filter(isU24)[0];
   const weak=five().sort((a,b)=>v(L[a])-v(L[b]))[0];
   if(cand && weak){ used.delete(L[weak].id); L[weak]=cand; used.add(cand.id); }
   else if(weak){
     // brak wolnego U24 — junior z numeru 7 (albo 6) wchodzi do piątki,
     // a jego miejsce zajmuje kolejny młodzieżowiec z kadry
     const src=[7,6].find(n=>L[n]);
     if(src){ const j=L[src]; delete L[src]; used.delete(L[weak].id); L[weak]=j;
       const nj=free().filter(isJun)[0]; if(nj) put(src,nj); }
   }
 }
 // 4) numery 1-5 porządkujemy wg aktualnej dyspozycji
 const fiveRiders=five().map(n=>L[n]).sort((a,b)=>v(b)-v(a));
 fiveRiders.forEach((r,i)=>L[i+1]=r);
 for(let n=fiveRiders.length+1;n<=5;n++) delete L[n];
 Object.keys(L).forEach(k=>{ if(!L[k]) delete L[k]; });
 // 5) TWARDA WERYFIKACJA WIEKU: numery 6 i 7 (a więc i 14, 15 u gości) to
 //    wyłącznie zawodnicy U21. Jeżeli cokolwiek wcześniej wcisnęło tam seniora,
 //    numer zostaje pusty — regulamin nie zna wyjątków.
 [6,7].forEach(n=>{ if(L[n] && !isJun(L[n])) delete L[n]; });
 return Object.keys(L).length?L:null;
}
function bestLineup(clubName, bias, noise, forceSave){
 return lineupFrom(availableRiders(clubName), noise||0, bias, forceSave, clubName);
}
/* ------------------------------------------------------------
   NAPRAWA (patch 21.08.2026, Sprint 1): PUNKT BONUSOWY (art. 720).
   Było: bonus dostawał każdy, kto dojechał za kolegą z pary i miał choć
   jeden punkt — czyli także tam, gdzie za zawodnikiem NIE MA ŻADNEGO RYWALA
   (np. bieg w trójkę po nieudanym zastępstwie). Regulaminowo bonus należy się
   wtedy i tylko wtedy, gdy spełnione są DWA warunki naraz:
     1) kolega z pary ukończył bieg PRZED nim (sam musi dojechać do mety),
     2) przywiózł za sobą co najmniej jednego rywala — rywal dojechał za nim
        ALBO w ogóle nie dojechał (defekt / wykluczenie z tyłu).
   W praktyce: 5:1, 4:2 i para 2-3 dają bonus; para 3-4, 2:4 i bieg,
   w którym za zawodnikiem nikogo nie ma — nie dają go nigdy.
   Zwycięzca biegu (3 pkt) bonusu nie dostaje — nie ma przed kim jechać.
   JEDNO ŹRÓDŁO PRAWDY: tę samą funkcję woła leagueHeat() i generator meczu
   na żywo (engine/31-live-mecz.js), żeby obie ścieżki nie rozjechały się
   nigdy więcej.
   ------------------------------------------------------------ */
function applyBonus(res){
 res.forEach(x=>{ x.bon=0;
   if(x.out || x.pts===3) return;                       // nie dojechał albo wygrał bieg
   const mate=res.find(y=>y!==x && y.side===x.side);
   /* NAPRAWA (24.08.2026): BONUS ZA TRZECIE MIEJSCE „ZZA RYWALA".
      Warunek brzmiał „kolega ma WIĘCEJ punktów", a nie „kolega jest BEZPOŚREDNIO
      przede mną". Skutek: para 1-3 (kolega wygrywa, między wami wjeżdża rywal,
      ty jesteś trzeci) dawała bonus, bo 3 > 1 i z tyłu został czwarty rywal.
      Regulaminowo bonus należy się WYŁĄCZNIE za dojechanie TUŻ ZA kolegą z pary,
      bez rywala pomiędzy. Punkty w biegu to 3-2-1-0, więc „tuż za" znaczy
      dokładnie: kolega ma o JEDEN punkt więcej. To samo domyka warunek (2):
      skoro nikt nie wjechał między was, a bieg ma czterech, to za tobą stoi rywal. */
   if(!mate || mate.out || mate.pts !== x.pts+1) return;   // (1) kolega z pary TUŻ przed nim
   const rivalBehind = res.some(y=>y.side!==x.side && (y.out || y.pts<x.pts));
   if(rivalBehind) x.bon=1;                             // (2) co najmniej jeden rywal z tyłu
 });
 return res;
}
/* Jeden bieg meczowy: 4 zawodników, 3-2-1-0.
   Siła liczona względem punktu odniesienia (średnia ligi + poziom klubu) —
   zawodnik poniżej tej średniej dostaje ostrą karę. */
function leagueHeat(entries, ctx, meId){
 const res=entries.map(e=>{
   const r=e.r, me=r.id===meId;
   // kłopoty klubu: zawodnik na własnym sprzęcie (Gracz) traci na tym o połowę mniej
   const trb = (e.trouble||0) * (me?0.5:1);
   const dP = me&&ctx ? ctx.defP + (e.trouble||0)*0.0016
                      : cl(0.028 + (78-r.ovr)*0.0006 + (e.trouble||0)*0.0022, 0.012, 0.14);
   const eP = me&&ctx ? ctx.excP : cl(0.024 + (74-r.ovr)*0.0005, 0.010, 0.065);
   const rr=Math.random();
   const out = rr<dP ? 'd' : rr<dP+eP ? 'w' : null;
   return {...e, out, str: rideStr(r.ovr + (r.form||0) - trb, e.ref, e.home?BAL.home:0)};
 });
 const fin=res.filter(x=>!x.out).sort((a,b)=>b.str-a.str);
 fin.forEach((x,i)=>x.pts=[3,2,1,0][i]);
 res.forEach(x=>{ if(x.out) x.pts=0; });
 applyBonus(res);
 return res;
}
/* Pełny mecz. Zwraca wynik, statystyki obu drużyn i linię gracza. */
function simMeeting(homeName, awayName, ctx, meId, forceSave){
 const bH = ctx&&ctx.bias&&ctx.bias.club===homeName?ctx.bias:null;
 const bA = ctx&&ctx.bias&&ctx.bias.club===awayName?ctx.bias:null;
 const svH = !!(forceSave&&forceSave.h), svA = !!(forceSave&&forceSave.a);
 const LH=bestLineup(homeName, bH, 0, svH);
 const LA=bestLineup(awayName, bA, 0, svA);
 if(!LH||!LA) return null;
 /* Czy Gracz wskoczył do składu WYŁĄCZNIE dlatego, że klub oszczędzał na gwiazdach?
    Porównujemy skład oszczędnościowy ze składem, który stanąłby przy pełnej kasie. */
 const inL = L => !!(L && Object.values(L).some(r=>r&&r.id===meId));
 let saveIn=false;
 if(meId && (svH||svA)){
   const side = inL(LH) ? 'h' : inL(LA) ? 'a' : null;
   if(side && ((side==='h'&&svH) || (side==='a'&&svA))){
     const L0 = bestLineup(side==='h'?homeName:awayName, side==='h'?bH:bA, 0, false);
     saveIn = !inL(L0);
   }
 }
 /* DLACZEGO NIE JEDZIESZ — ile dyspozycji zabrakło do ostatniego numeru.
    Senior bije się o numery 1-5, młodzieżowiec dodatkowo o 6 i 7. Bez tej liczby
    "mam czwarty OVR w drużynie, a siedzę na ławce" wygląda jak błąd, a jest
    zwykłą arytmetyką trenera: OVR plus bieżąca forma plus to, czy trener
    w ogóle chce cię widzieć (SPRINT 3). */
 let meGap=null, meReg=false;
 if(meId && !inL(LH) && !inL(LA) && ctx && ctx.bias && ctx.bias.club){
   const club=ctx.bias.club;
   if(club===homeName || club===awayName){
     const L = club===homeName?LH:LA, bias = club===homeName?bH:bA;
     const me = availableRiders(club).find(r=>r.id===meId);
     if(me && L){
       const val=r=>lineupValue(r,bias,0,club);
       const five=[1,2,3,4,5].map(n=>L[n]).filter(Boolean);
       // z kim realnie się biłeś: zawodnika trzymającego rubrykę U24 nie da się
       // wyprzeć, choćbyś był lepszy — regulamin jest ponad dyspozycją
       let cands=five;
       if(!isU24(me) && five.filter(isU24).length===1) cands=five.filter(r=>!isU24(r));
       if(isJun(me)) cands=cands.concat([6,7].map(n=>L[n]).filter(Boolean));
       const weakest = cands.sort((a,b)=>val(a)-val(b))[0];
       if(!weakest) meReg=true;
       else {
         const g = Math.round((val(weakest)-val(me))*10)/10;
         if(g<0) meReg=true; else meGap=g;    // ujemna różnica = wyparła cię rubryka, nie forma
       }
     }
   }
 }
 /* --- PRZYDZIAŁ NUMERÓW STARTOWYCH ---
    Gospodarz: 9-15. Gość: 1-7. `sideOf` trzyma stronę dla KAŻDEGO klucza w mapie
    (także dla wirtualnych kluczy rezerwy taktycznej) — patrz naprawa niżej. */
 const map={}, sideOf={};
 for(let n=1;n<=7;n++){
   if(LH[n]){ map[n+8]=LH[n]; sideOf[n+8]='h'; }
   if(LA[n]){ map[n]  =LA[n]; sideOf[n]  ='a'; }
 }
 const REF={h:refFor(homeName), a:refFor(awayName)};
 const TRB={h:clubTrouble(homeName), a:clubTrouble(awayName)};   // kara za niepłacenie
 const st={}; Object.values(map).forEach(r=>{ if(r) st[r.id]={r, starts:0, pts:0, bon:0, codes:[], num:null, res:resBox()}; });
 for(let n=1;n<=15;n++) if(map[n]) st[map[n].id].num=n;
 const set=HEAT_SETS[R(0,1)];
 let hs=0, as=0;
 const tacticUsed={h:false,a:false};
 const heats=[];
 const reserves=side=>[6,7].map(n=>map[numFor(side,n)]).filter(Boolean);
 const nameOf=side=>side==='h'?homeName:awayName;

 const runHeat=(nums, label)=>{
   const entries=[];
   const inHeat=()=>entries.map(e=>e.r.id);
   nums.forEach(n=>{
     /* ------------------------------------------------------------
        NAPRAWA (patch 17.08.2026): PUNKTY DOPISYWANE NIE TEJ DRUŻYNIE.
        Rezerwa taktyczna wjeżdżała do biegu pod WIRTUALNYM numerem `-id`
        (liczba ujemna). Stronę wyliczano wtedy z `isHomeNum(n)`, czyli
        z porównania liczbowego — a każda liczba ujemna wychodziła z niego
        jako GOSPODARZ. Efekt: gdy rezerwę taktyczną robili GOŚCIE, ich
        punkty lądowały na koncie gospodarzy. Stąd brały się wyniki, których
        nie da się zdobyć na torze (m.in. 76:14 czy 16:74) i sytuacje, w których
        zawodnik „zdobył punkty", a jego drużyna ich nie miała. Teraz strona
        czyta się z jawnej mapy `sideOf`, a nie ze znaku liczby.
        ------------------------------------------------------------ */
     const side = sideOf[n] || (isHomeNum(n)?'h':'a');
     let r=map[n];
     // brak zawodnika pod numerem albo wyczerpany limit startów → rezerwa zwykła (art. 719 ust. 3)
     if(!r || !canRide(st[r.id])){
       const name = nameOf(side);
       r = reserves(side).concat(availableRiders(name).filter(x=>st[x.id]))
            .filter(x=>canRide(st[x.id]) && !inHeat().includes(x.id) && plainResOk(st[x.id], x))
            .sort((a,b)=>b.ovr-a.ovr)[0];
       if(!r) return;
       st[r.id].res.plain++;                 // Sprint 3: młodzieżowiec ma na to dwa starty
     }
     if(inHeat().includes(r.id)) return;
     // numer w programie bierzemy z kartoteki zawodnika — nie z klucza mapy,
     // bo pod kluczem może siedzieć rezerwa taktyczna albo zwykłe zastępstwo
     const pnum = (st[r.id] && st[r.id].num!=null) ? st[r.id].num : (n>0?n:null);
     entries.push({r, side, home:side==='h', num:pnum, ref:REF[side], trouble:TRB[side]});
   });
   // pod taśmą para nie może stać obok siebie — przeplatamy kaski (gateOrder)
   const line=gateOrder(entries);
   if(line.length<2) return;
   const res=leagueHeat(line, ctx, meId);
   res.forEach(x=>{
     const s=st[x.r.id];
     s.starts++; s.pts+=x.pts; s.bon+=x.bon;
     /* ------------------------------------------------------------
        NAPRAWA (patch 21.08.2026): W LIDZE NIE BYŁO WIDAĆ, KTÓRY BIEG DAŁ
        PUNKT BONUSOWY. Silnik liczył bonus poprawnie (x.bon), ale do kodów
        biegu wpisywał samą liczbę punktów — gwiazdka „2*"/„1*" istniała
        WYŁĄCZNIE w uproszczonym generatorze DMPJ (riderLine), czyli
        dokładnie tam, gdzie punktów bonusowych w ogóle być nie powinno.
        Teraz jest odwrotnie i zgodnie z regulaminem: bonus (art. 720)
        zapisuje się przy biegu ligowym, a w zawodach, w których nie ma par
        klubowych, nie ma go wcale.
        ------------------------------------------------------------ */
     s.codes.push(x.out || (String(x.pts)+(x.bon?'*':'')));
     if(x.side==='h') hs+=x.pts; else as+=x.pts;
   });
   heats.push({label, res:res.map(x=>({id:x.r.id,name:x.r.name,num:x.num,gate:x.gate||null,helmet:x.helmet||null,
     pts:x.pts,bon:x.bon||0,out:x.out,side:x.side}))});
 };
 
 for(let h=0; h<13; h++){
   let nums=set[h].slice();
   /* NAPRAWA (24.08.2026): „-" W KARCIE BEZ ZMIANY.
      Kod „zmieniony" wpisywaliśmy zdejmowanemu OD RAZU, zanim bieg w ogóle
      się odbył. Jeżeli potem runHeat() nie wpuściło wchodzącego — bo bieg
      nie miał obsady (line.length<2) albo ten zawodnik już w nim siedział
      jako rezerwa zwykła — zmiana nie następowała, a „-" zostawało w karcie.
      Stąd zawodnicy z „-" przy komplecie normalnych startów. Teraz kod
      wpisujemy DOPIERO PO biegu i tylko wtedy, gdy wchodzący faktycznie
      wystartował; inaczej cofamy też zużytą rezerwę taktyczną. */
   const swaps=[];
   /* --- REZERWA TAKTYCZNA (art. 719 ust. 5) ---
      Biegi III-XIII, strata co najmniej 6 punktów. SPRINT 3: decyduje AI
      trenera, a nie sam OVR — zdejmuje tego, kogo najmniej lubi wśród
      słabszych, i wpuszcza tego, komu najbardziej ufa. Młodzieżowca nie
      wolno zdjąć na rzecz seniora (tacticLegal), a sam młodzieżowiec ma
      prawo wejść z rezerwy taktycznej tylko raz (tacticResOk). */
   [['h',hs-as],['a',as-hs]].forEach(([side,diff])=>{
     if(h<2 || tacticUsed[side] || diff>RESB.tacticDiff) return;
     // klub tonący w zaległościach nie ma czym zrobić rezerwy taktycznej:
     // zapasowy silnik stoi u tunera i czeka na przelew
     if(TRB[side]>=10) return;
     const name=nameOf(side);
     const mine=nums.filter(n=>(sideOf[n]||(isHomeNum(n)?'h':'a'))===side);
     if(mine.length<2) return;
     const rel=r=>coachLike(name, r)*0.16;
     const pool=mine.map(n=>map[n]).filter(Boolean);
     /* ------------------------------------------------------------
        NAPRAWA (Sprint 5c, 24.08.2026): REZERWA TAKTYCZNA PRAWIE NIGDY
        NIE WCHODZIŁA — TA SAMA POMYŁKA CO W engine/31.
        Braliśmy JEDNEGO kandydata do zdjęcia: najsłabszego w biegu. A najsłabszy
        w biegu to prawie zawsze MŁODZIEŻOWIEC (6-7 / 14-15). Chwilę później
        tacticLegal() mówił „senior nie przejmuje biegu młodzieżowca" i wycinał
        WSZYSTKICH kandydatów — a kod robił `return`, czyli rezygnował z całej
        zmiany, zamiast zdjąć TEGO DRUGIEGO, seniora, za którego wejście jest
        w pełni legalne. Efekt: opcja istniała, a w tabelach nie było jej widać.
        Teraz idziemy pool od najsłabszego i bierzemy PIERWSZĄ parę
        (kto schodzi / kto wchodzi), która przechodzi regulamin.
        ------------------------------------------------------------ */
     let weak=null, cand=null;
     for(const w of pool.slice().sort((a2,b2)=>(a2.ovr+rel(a2))-(b2.ovr+rel(b2)))){
       const c=availableRiders(name)
         .filter(r=>st[r.id] && tacticCandOk(st[r.id]) && r.id!==w.id
                    && !mine.some(n=>map[n]&&map[n].id===r.id)
                    && tacticResOk(st[r.id], r) && tacticLegal(w, r))
         .sort((a2,b2)=>(b2.ovr+rel(b2))-(a2.ovr+rel(a2)))[0];
       if(!c || c.ovr<=w.ovr) continue;
       weak=w; cand=c; break;
     }
     if(!weak || !cand) return;
     tacticUsed[side]=true;
     st[cand.id].res.tactic++;
     swaps.push({side, weak, cand});         // „-" dopiszemy po biegu, jeśli zmiana doszła do skutku
     const vkey = -cand.id;                   // wirtualny klucz dla rezerwy taktycznej
     nums=nums.map(n=>map[n]&&map[n].id===weak.id ? vkey : n);
     map[vkey]=cand;
     sideOf[vkey]=side;                       // ← bez tego punkty szły do złej drużyny
   });
   runHeat(nums, h+1);
   if(swaps.length){
     const last=heats[heats.length-1];
     const rode = id => !!(last && last.label===h+1 && last.res.some(x=>x.id===id));
     swaps.forEach(sw=>{
       if(rode(sw.cand.id)) st[sw.weak.id].codes.push('-');
       else { st[sw.cand.id].res.tactic--; tacticUsed[sw.side]=false; }
     });
   }
 }
 /* --- Biegi XIV i XV: nominowani, po dwóch z drużyny (art. 721) ---
    SPRINT 3: MŁODZIEŻOWIEC NIE JEST NOMINOWANY Z URZĘDU. Numery 6-7 (14-15)
    dostają program młodzieżowy i tam mają swoje starty; w biegach nominowanych
    mogą pojawić się WYŁĄCZNIE jako rezerwa — czyli dopiero wtedy, gdy drużyna
    nie ma dwóch seniorów z wolnym startem. Wcześniej sortowanie po samej
    średniej biegowej potrafiło wstawić do biegu XV dwóch juniorów, bo mieli
    najwyższą średnią z trzech startów w słabych biegach. */
 const nominate=(side,name,byPts)=>{
   /* BIEG XV — DWÓCH NAJLEPSZYCH WEDŁUG PUNKTÓW (poprawka 24.08.2026).
      W biegu XIV zostaje dobór regulaminowy (senior przed młodzieżowcem, junior
      tylko jako rezerwa). W BIEGU XV jadą po prostu DWAJ NAJLEPSI PUNKTOWO
      zawodnicy każdej drużyny — bez bonusów, bo bonus to zasługa pary, nie jego.
      Wcześniej oba biegi nominowane sortowały po ŚREDNIEJ biegowej, więc do
      biegu XV potrafił wjechać zawodnik z 2 punktami z jednego startu zamiast
      lidera z 12 punktami z pięciu. */
   const pool=availableRiders(name).filter(r=>st[r.id]&&canRide(st[r.id]));
   const avg=r=>st[r.id].pts/Math.max(1,st[r.id].starts);
   if(byPts) return pool.slice().sort((a,b)=> st[b.id].pts-st[a.id].pts || avg(b)-avg(a) || b.ovr-a.ovr);
   const by=(a,b)=> avg(b)-avg(a) || b.ovr-a.ovr;
   const sen=pool.filter(r=>!isJun(r)).sort(by);
   const jun=pool.filter(isJun).filter(r=>plainResOk(st[r.id], r)).sort(by);
   return sen.concat(jun);
 };
 for(let extra=0; extra<2; extra++){
   const H=nominate('h',homeName,extra===1).slice(0,2), A=nominate('a',awayName,extra===1).slice(0,2);
   [...H,...A].forEach(r=>{ if(isJun(r) && st[r.id]) st[r.id].res.plain++; });   // wchodzi jako rezerwa
   const entries=[...H.map(r=>({r,side:'h',home:true,num:st[r.id].num,ref:REF.h,trouble:TRB.h})),
                  ...A.map(r=>({r,side:'a',home:false,num:st[r.id].num,ref:REF.a,trouble:TRB.a}))];
   // biegi nominowane też jadą w przeplocie: [gospodarz, gość, gospodarz, gość]
   const line=gateOrder(entries);
   if(line.length<3) break;
   const res=leagueHeat(line, ctx, meId);
   res.forEach(x=>{ const s=st[x.r.id]; s.starts++; s.pts+=x.pts; s.bon+=x.bon;
     s.codes.push(x.out||(String(x.pts)+(x.bon?'*':''))); if(x.side==='h') hs+=x.pts; else as+=x.pts; });
   heats.push({label:14+extra, nominated:true,
     res:res.map(x=>({id:x.r.id,name:x.r.name,num:x.num,gate:x.gate||null,helmet:x.helmet||null,
       pts:x.pts,bon:x.bon||0,out:x.out,side:x.side}))});
 }
 // zapis do statystyk sezonowych + AKTUALIZACJA FORMY (wpływa na numery w kolejnym meczu)
 Object.values(st).forEach(s=>{
   if(!s.r.sea) s.r.sea=blankSea();
   s.r.sea.m++; s.r.sea.starts+=s.starts; s.r.sea.pts+=s.pts; s.r.sea.bon+=s.bon;
   s.codes.forEach(c=>{ if(c==='d') s.r.sea.def++; else if(c==='w') s.r.sea.exc++; else if(c==='-') s.r.sea.rep++; });
   if(s.starts>0){
     const side = isHomeNum(st[s.r.id].num) ? 'h':'a';
     const exp = cl(1.35 + (s.r.ovr - REF[side])*0.055, 0.15, 2.75);   // czego się po nim spodziewano
     const got = s.pts/s.starts;
     // DYNAMICZNA FORMA: pamięć krótka (0.40), reakcja ostra (×3.5), zakres -12..+12.
     // Dwa słabe mecze z rzędu i zawodnik realnie wypada z pierwszej piątki.
     s.r.form = cl((s.r.form||0)*0.40 + (got-exp)*3.5, -12, 12);
   }
 });
 /* KTO NIE JECHAŁ, TEN ODPOCZYWAŁ.
    Bez tego forma zawodnika poza składem zostaje zamrożona na wieki: jeden słaby
    mecz wyrzucał go z siódemki i nie miał już JAK wrócić, bo forma aktualizuje się
    tylko po starcie. Teraz dyspozycja rezerwowego wraca do zera i po dwóch-trzech
    kolejkach znowu bije się o numer — dokładnie tak, jak działa prawdziwa rotacja. */
 [homeName, awayName].forEach(n=>squadOf(n).forEach(r=>{
   if(st[r.id] && st[r.id].starts>0) return;
   if(r.form) r.form = Math.abs(r.form)<0.4 ? 0 : r.form*0.7;
 }));
 /* --- KONTROLA WYNIKU ---
    Wynik drużyny to suma punktów jej zawodników i nic więcej. Ta rekonstrukcja
    liczy go jeszcze raz, tym razem po SKŁADACH (a nie po stronie zapisanej przy
    biegu), więc żadna przyszła przeróbka rezerw nie ma jak dopisać punktów
    nie tej drużynie. Przy 15 biegach daje to twardy zakres 15-75 na drużynę. */
 {
  const idsH=new Set(Object.values(LH).filter(Boolean).map(r=>r.id));
  const idsA=new Set(Object.values(LA).filter(Boolean).map(r=>r.id));
  let hh=0, aa=0;
  Object.values(st).forEach(s=>{ if(idsH.has(s.r.id)) hh+=s.pts; else if(idsA.has(s.r.id)) aa+=s.pts; });
  hs=hh; as=aa;
 }
 /* --- KARTA MECZOWA DO PODGLĄDU (patch 21.08.2026) ---
    Zamrożony, samowystarczalny zapis spotkania: kto jechał, pod jakim numerem,
    ile zdobył punktów i bonusów, z jakimi kodami biegów. Trzymamy go zamiast
    referencji do żywych obiektów zawodników — te zmieniają się z każdym
    kolejnym sezonem, więc wynik sprzed trzech lat pokazywałby dzisiejszą kadrę. */
 const idsH=new Set(Object.values(LH).filter(Boolean).map(r=>r.id));
 const box=Object.values(st).map(x=>({
   id:x.r.id, name:x.r.name, num:x.num, age:x.r.age,
   side: idsH.has(x.r.id) ? 'h' : 'a',
   starts:x.starts, pts:x.pts, bon:x.bon, codes:x.codes.slice(),
   res:{plain:x.res.plain, tactic:x.res.tactic},
   me: !!(meId && x.r.id===meId)
 })).sort((a,b)=> (a.side===b.side ? (a.num||99)-(b.num||99) : (a.side==='h'?1:-1)));
 const me = meId && st[meId] ? st[meId] : null;
 return {hs, as, heats, st, box, me: me? {starts:me.starts, pts:me.pts, bon:me.bon, codes:me.codes.filter(c=>typeof c==='string'), num:me.num} : null,
   lineH:LH, lineA:LA, saveIn, save:{h:svH, a:svA}, meGap, meReg};
}
