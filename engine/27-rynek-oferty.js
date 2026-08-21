/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: RYNEK OFERTY
   makeOffers, makeRenewOffer, signContract
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4254-4537 oryginału).
   PATCH 22.08.2026 (Sprint 3): głos trenera przy stole negocjacyjnym —
   i pucz gwiazdy, po którym z klubu wylatuje trener, a nie zawodnik.
   ============================================================ */
/* ============================================================
   SIŁA GWIAZDY KONTRA AUTORYTET TRENERA (Sprint 3)
   ------------------------------------------------------------
   Zarząd nie rozstrzyga konfliktu „kto ma rację". Zarząd liczy, kto jest
   trudniejszy do zastąpienia. Twoja pozycja to sport plus szum wokół
   nazwiska (OVR + medialność), pozycja trenera to jego autorytet
   i warsztat. Jeżeli trener cię nie znosi (rel <= COACHB.coupHate),
   a ty przewyższasz go o COACHB.coupGap — nie przedłużają umowy TOBIE,
   tylko rozwiązują ją Z NIM. Z hukiem, konferencją i wpisem do historii.
   ============================================================ */
function coachPower(){
 const p=G.p;
 return p ? (p.ovr + p.med*0.55) : 0;
}
function coachCoup(clubName){
 const REL=coachRel(clubName, meRider());
 const auth = REL.coach ? (REL.coach.auth + REL.coach.skill*0.35) : 999;
 const edge = Math.round(coachPower() - auth);
 return {REL, edge, on: REL.rel<=COACHB.coupHate && edge>=COACHB.coupGap};
}
function coachCoupFire(clubName, C){
 const co=C.REL.coach;
 return fireCoach(clubName, 'przegrał starcie z zawodnikiem', {me:true,
   txt:'Zarząd '+clubName+' stanął przed wyborem: trener '+co.name+' albo '+G.p.name+'. '+
       'Wybrał tego, po kogo dzwonią inne kluby. '+co.name+' pożegnany bez podania dnia i godziny, '+
       'komunikat na stronie ma cztery zdania, z czego dwa to podziękowania.'});
}
/* ============================================================
   PRZEDŁUŻENIE W TRAKCIE UMOWY — „ONE-CLUB MAN"
   Jeżeli masz umowę wieloletnią, wysoką lojalność i sezon, który się broni,
   klub sam wychodzi z nową, dłuższą i lepiej płatną umową — jeszcze zanim
   stara wygaśnie. To jedyna droga, żeby zbudować karierę w jednych barwach.
   ============================================================ */
function makeRenewOffer(){
 const p=G.p;
 if(!p || p.retired || !p.club) return null;
 if(p.contract.years<1) return null;                       // i tak wchodzisz na rynek
 if((p.longInjury||0)>0) return null;                      // po operacji nikt nie przedłuża w ciemno
 if(p.loyalty<=70) return null;                            // warunek z założenia: lojalność > 70
 if(p.next.noRenew) return null;
 if(p.next.lockTransfer>0) return null;                    // masz już dziesięciolatkę od prezesa
 if(p.next.forceClub) return null;                         // idziesz gdzie indziej, i to nie z własnej woli
 const c=clubOf(p); if(!c || c.bankrupt) return null;
 /* Profesjonalista nie przedłuża z klubem, który sprzedał własną nazwę (2-3 sponsorów). */
 if(p.prof>SPON.profBlock && titleCount(c)>=SPON.profBlockFrom) return null;
 const last=G.history.length ? G.history[G.history.length-1] : null;
 if(!last || last.matches<4) return null;
 const avg=last.avg||0;
 if(avg<1.30) return null;                                 // „dobra średnia" — bez tego klub nie ryzykuje
 /* --- SPRINT 3: CO NA TO TRENER --- */
 const C=coachCoup(p.club);
 const REL=C.REL;
 let base = cl(45 + (p.loyalty-70)*1.4 + (avg-1.30)*45, 20, 92);
 base = C.on ? cl(base+32, 55, 98)                          // zarząd wybiera ciebie
             : cl(base + REL.rel*COACHB.relRenewW, 5, 96);  // sympatia trenera waży ~±38 pkt
 if(!chance(Math.round(base))) return null;
 const fired = C.on ? coachCoupFire(p.club, C) : null;
 const years=cl(p.contract.years + R(2,3), 2, 6);
 const mul=RF(1.08,1.32) + cl((avg-1.50)*0.14, 0, 0.22);
 const rate=Math.round(p.contract.rate*mul);
 const bonus=Math.round(Math.max(0,c.budget)*RF(0.004,0.020)*cl(p.loyalty/70,0.5,1.6));
 /* Ta sama wycena, co na rynku — żeby gracz mógł porównać, ile jest wart
    „na mieście", zanim podpisze przedłużenie w ciemno. */
 const MV=marketValue(p, avg);
 return {club:c.name, lk:p.lk, ovr:c.ovr, budget:c.budget, debt:c.debt,
   type:p.contract.type, years, rate, bonus, extend:true, stay:true,
   oldRate:p.contract.rate, oldYears:p.contract.years, avg,
   rating:MV.rating, ratingParts:MV.parts,
   coach:{name:REL.coach.name, type:REL.type.n, rel:REL.rel, status:REL.status.n,
          edge:C.edge, chance:Math.round(base)},
   coachFired:fired,
   ride:appearanceChance(p, c, 55, null)};
}
function acceptRenew(o){
 const p=G.p;
 p.contract={type:o.type, years:o.years, rate:o.rate, bonus:o.bonus};
 /* jak wyżej: premia leci co sezon, nie raz przy podpisie */
 p.loyalty = cl(p.loyalty+14, 0, 100);
 p.prof    = cl(p.prof+2, 0, 99);
 p.next.noRenew=false;
 p.career.renewals=(p.career.renewals||0)+1;
}
function declineRenew(){
 const p=G.p;
 p.loyalty = cl(p.loyalty-8, 0, 100);
 p.career.declined=(p.career.declined||0)+1;
}
 
function makeOffers(){
 const p=G.p, cands=[];
 let oldMiss=null;                 // dlaczego stary klub odpadł z listy
 G.noRenew=null;
 /* ============================================================
    ZERWANE WIĘZADŁA / ZŁAMANE UDO — RYNEK SIĘ ZAMYKA
    ------------------------------------------------------------
    Zgłoszenie gracza: „przy dłuższej kontuzji, o ile nie pojedziemy
    w następnym sezonie, żaden klub nie powinien nam zaproponować kontraktu".
    Do tej pory zawodnik z p.longInjury>0 (czyli taki, który CAŁY nadchodzący
    sezon spędzi po operacji) dostawał normalne oferty i podpisywał umowę,
    z której klub nie miał ani jednego biegu. Żaden zarząd tego nie zrobi:
    zawodnik nie ma licencji na sezon, w którym leży w gipsie.
    Teraz rynek jest dla niego zamknięty — zostaje "PRZECZEKAJ ROK"
    (rehabilitacja odlicza sezon) albo praca u mechanika.
    ============================================================ */
 if((p.longInjury||0)>0){
   G.market={rating:0, parts:[], maxOffers:0,
     maxWhy:[{d:0, w:'kontuzja długoterminowa — w sezonie '+G.year+' nie odjedziesz ani jednego biegu'}],
     lastAvg:null, interested:0, checked:allClubs().length, floor:null,
     age:p.age, prof:p.prof, med:p.med, ovr:p.ovr, longInjury:true};
   G.noRenew={code:'injury', club:p.club||'—', lk:p.lk,
     t:'NIKT NIE PODPISUJE KONTRAKTU Z ZAWODNIKIEM PO OPERACJI',
     x:'Masz za sobą zerwane więzadła / złamaną kość udową. Cały sezon '+G.year+' to rehabilitacja — '+
       'w rubryce startowej nie pojawisz się ani razu. Kluby zgłaszają skład na cały rok i nie zamrażają '+
       'miejsca dla kogoś, kto wróci najwcześniej za dwanaście miesięcy.',
     quote:'Wracaj na tor, wtedy pogadamy. Teraz nie mam czym cię zgłosić.',
     tip:'Przeczekaj rok — rehabilitacja odlicza sezon, a po nim rynek otworzy się normalnie.'};
   return [];
 }
 const lastAvg = G.history.length ? (G.history[G.history.length-1].avg||0) : 1.4;
 const MV = marketValue(p, lastAvg);
 const rating = MV.rating;

 /* --- JEDNA FABRYKA OFERT (używana też przez skutki zdarzeń losowych) --- */
 const mkOffer=(c,lk,gap,interest)=>{
   const pro = c.ovr>55 || p.ovr>45;
   const RT  = offerRate(p, c, lk, rating, gap);
   const rate = pro ? RT.rate : R(150,400);
   /* PREMIA ZA PODPIS — realny ułamek budżetu klubu, ważony twoją wartością
      i przycięty przez jego długi. Klub, który zalega kadrze, nie wykłada
      gotówki za sam podpis. Decyzja „pierdolcie się, śmieszki" (noSponsor)
      zabiera premię w całości. */
   const bon = (pro && !p.next.noSponsor)
     ? Math.round(Math.max(0,c.budget) * MARKET.bonusMax
         * cl(rating/95, 0.05, 0.95)
         * cl(1-(c.debt||0)/1500000, 0.20, 1)
         * ((c.arr||0)>0?0.45:1)
         * RF(0.35,1.00))
     : 0;
   /* DŁUGOŚĆ UMOWY też ma logikę: młodego wiąże się na dłużej, weterana na rok.
      W wieku juniorskim (≤21) i w oknie U24 (22-24) kluby najchętniej podpisują
      DOKŁADNIE na tyle lat, ile zostało do końca danej kategorii wiekowej —
      to standardowa praktyka (rubryka młodzieżowa/U24 w składzie). Reszta
      ofert zostaje przy starym, szerszym rozstrzale, żeby rynek nie stał się
      w 100% deterministyczny. */
   const juniorLeftYears = Math.max(1, 22-p.age);   // do końca wieku juniorskiego (≤21 r.ż. włącznie)
   const u24LeftYears    = Math.max(1, 25-p.age);   // do końca okna U24 (≤24 r.ż. włącznie)
   const years = p.age<=21 ? (chance(65) ? juniorLeftYears : R(2,3))
               : p.age<=24 ? (chance(65) ? u24LeftYears    : R(1,3))
               : p.age<=27 ? R(1,3) : p.age<=32 ? R(1,2) : 1;
   const I = interest || clubInterest(p, c, lk, rating);
   /* SPRINT 3: KTO CIĘ TAM POPROWADZI. Trener klubu to część oferty —
      dwa kluby z tym samym budżetem to nie to samo, jeżeli w jednym siedzi
      wychowawca młodzieży, a w drugim słup ogłoszeniowy. `devMul` mówi
      wprost, jak szybko będziesz pod nim rósł (albo się sypał). */
   const CO=coachRel(c.name, meRider());
   return {club:c.name, lk, ovr:c.ovr, budget:c.budget, debt:c.debt, arr:c.arr||0,
     type: pro?'Zawodowy':'Amatorski', years, rate, bonus:bon,
     stay:c.name===p.club, ride:appearanceChance(p, c, 55, null),
     /* --- SKĄD TA OFERTA (rozpiska dla UI) --- */
     rating, ratingParts: MV.parts,
     want: I.want, wantParts: I.parts, gap: Math.round(I.gap), press: I.press,
     rateParts: pro ? RT.parts : [{w:'kontrakt amatorski — sprzęt klubowy, stawka symboliczna, zero premii za podpis', v:zl(rate)+'/pkt'}],
     lastAvg,
     coach:{name:CO.coach.name, type:CO.type.n, short:CO.type.short, skill:CO.coach.skill,
            auth:CO.coach.auth, rel:CO.rel, status:CO.status.n, statusCol:CO.status.c,
            gap:CO.gap, devMul:Math.round(coachDevMul(c.name, meRider())*100)/100,
            quote:coachQuote(CO, coachPressure(c.name))},
     /* ILE SZYLDÓW NA KEVLARZE — UI pokazuje to przy ofercie, a profesjonalista
        w ogóle takiej oferty nie zobaczy (patrz filtr niżej). */
     titles: titleCount(c), sponsors: clubTitles(c).map(s=>s.n),
     titlePen: sponsorPen(titleCount(c))};
 };
 const findClub=name=>{ for(const k of LKEYS){ const f=G.leagues[k].clubs.find(x=>x.name===name || x.name.includes(name)); if(f) return {c:f,lk:k}; } return null; };
 
 /* --- WYMUSZONY TRANSFER (świstek, wiatrówka, plan kolegi, Słowacja, diamenty) --- */
 if(p.next.forceClub){
   const want=p.next.forceClub; p.next.forceClub=null; p.next.noSponsor=false;
   let hit=null;
   if(want==='weak'){ const c=pick(G.leagues.KL.clubs.slice().sort((a,b)=>a.ovr-b.ovr).slice(0,3)); hit={c, lk:'KL'}; }
   /* 'weak_medium' — KARA ŁAGODNIEJSZA NIŻ 'weak'.
      'weak' wysyłał zawsze na samo dno: trzy najsłabsze kluby Krajowej Ligi.
      Przy zdarzeniach typu „niezapięty kask juniora" to była kara nieproporcjonalna
      do przewinienia. Tutaj losujemy z szerszego worka: cała dolna połowa KLŻ
      PLUS dolna połowa 2. Ekstraligi — czyli klub słaby ALBO średni. */
   else if(want==='weak_medium'){
     const half = arr => arr.slice().sort((a,b)=>a.ovr-b.ovr).slice(0, Math.max(2, Math.ceil(arr.length/2)));
     const bag = half(G.leagues.KL.clubs).map(c=>({c, lk:'KL'}))
          .concat(half(G.leagues.E2.clubs).map(c=>({c, lk:'E2'})))
          .filter(x=>x.c && !x.c.bankrupt);
     hit = bag.length ? pick(bag) : null;
   }
   /* 'any' = zdarzenie wypycha cię z klubu, ale nie mówi dokąd — losowy klub
      z dowolnej ligi. 'current' = blokada, zostajesz tam, gdzie jesteś.
      Wcześniej obie wartości szły do findClub() i zwracały null, więc opcja
      nie robiła absolutnie nic. */
   else if(want==='any'){ const k=pick(LKEYS); hit={c:pick(G.leagues[k].clubs), lk:k}; }
   else if(want==='current'){ hit = p.club ? findClub(p.club) : null; }
   else hit=findClub(want);
   if(hit){ const o=mkOffer(hit.c, hit.lk, rating-riderLevel(hit.c));
            if(p.next.rateMul && p.next.rateMul!==1){ o.rate=Math.round(o.rate*p.next.rateMul); p.next.rateMul=1; }
            return [o]; }
 }
 /* --- BLOKADA TRANSFEROWA (dziesięcioletnia umowa à la Krzysztof M.) --- */
 if(p.next.lockTransfer>0 && p.club){
   p.next.lockTransfer--; p.next.noSponsor=false;
   const hit=findClub(p.club);
   if(hit) return [mkOffer(hit.c, hit.lk, rating-riderLevel(hit.c))];
 }
 
 /* --- ILE TELEFONÓW MOŻE ZADZWONIĆ ---
    Też jawnie, żeby dało się przeczytać, dlaczego w jednym roku masz cztery
    oferty, a w kolejnym jedną. */
 const maxWhy=[];
 let maxOffers = rating>78?4 : rating>62?3 : rating>48?2 : 1;
 maxWhy.push({d:maxOffers, w:'wartość rynkowa '+Math.round(rating)});
 if(p.age<=21){      maxOffers+=1; maxWhy.push({d:1, w:'jesteś młodzieżowcem U21 — regulamin zmusza kluby do szukania'}); }
 else if(p.age<=24){ maxOffers+=1; maxWhy.push({d:1, w:'pozycja U24 — obowiązkowa rubryka w pierwszej piątce'}); }
 if(p.med>=70){      maxOffers+=1; maxWhy.push({d:1, w:'medialność '+p.med+' — dzwonią też ci, którzy cię nie potrzebują'}); }
 if(p.age>34){       maxOffers-=1; maxWhy.push({d:-1,w:'wiek '+p.age+' — lista chętnych sama się skraca'}); }
 if(p.prof<25){      maxOffers-=1; maxWhy.push({d:-1,w:'profesjonalizm '+p.prof+' — połowa menedżerów nawet nie oddzwoni'}); }
 if(p.next.betterOffers){ maxOffers+=1; maxWhy.push({d:1, w:'sprawa poszła szeroko — masz na stole więcej niż zwykle'}); }
 maxOffers = cl(maxOffers, 1, 5);

 // JAK DALEKO PONIŻEJ POZIOMU KLUBU MOŻESZ BYĆ, ŻEBY W OGÓLE ZADZWONILI
 // (junior wypełnia rubrykę młodzieżową, więc bierze go nawet klub o klasę wyżej)
 const floor = p.age<=21 ? -45 : p.age<=24 ? -22 : -8;
 /* SPRINT 3: pucz w macierzystym klubie rozstrzyga się DOPIERO wtedy, gdy
    oferta starego klubu faktycznie trafi na stół — inaczej wyrzucalibyśmy
    trenera przy każdym przeliczeniu rynku. */
 let coupPending=null;
 
 LKEYS.forEach(lk=>{
  G.leagues[lk].clubs.forEach(c=>{
   const isOld = c.name===p.club;
   if(p.next.noRenew && isOld){ oldMiss={code:'behave'}; return; }
   /* ------------------------------------------------------------
      SŁUP OGŁOSZENIOWY — BLOKADA DLA PROFESJONALISTÓW
      Zawodnik z profesjonalizmem powyżej SPON.profBlock nie podpisze
      z klubem, który ma 2-3 sponsorów tytularnych w nazwie. Kevlar jak
      tablica ogłoszeń, nazwa na trzy linijki i zarząd, który sprzedaje
      wszystko, co da się sprzedać — to nie miejsce na poważną karierę.
      ------------------------------------------------------------ */
   if(p.prof>SPON.profBlock && titleCount(c)>=SPON.profBlockFrom){
     if(isOld) oldMiss={code:'billboard', titles:titleCount(c)};
     return;
   }
   const gap = rating - riderLevel(c);            // >0 = jesteś ponad poziomem tej drużyny
   if(gap < floor){ if(isOld) oldMiss={code:'sport', gap}; return; }
   /* ZAINTERESOWANIE liczone jednym, jawnym wzorem (clubInterest) — ta sama
      liczba trafia potem na ekran oferty jako „ZAINTERESOWANIE KLUBU". */
   const I = clubInterest(p, c, lk, rating);
   /* --- SPRINT 3: TRENER TEGO KLUBU MA ZDANIE ---
      W obcym klubie sympatia liczona jest „na sucho" (trener widzi twoje
      liczby, nie zna cię z szatni), więc waży o połowę mniej. W MACIERZYSTYM
      działa pełną siłą — a jeśli trener cię nie znosi i przy tym jest
      od ciebie słabszy, zarząd rozwiązuje sprawę po swojemu. */
   const CO=coachRel(c.name, meRider());
   let coup=null;
   if(isOld){
     coup=coachCoup(c.name);
     I.want = cl(Math.round(I.want + (coup.on ? 28 : CO.rel*COACHB.relRenewW)), 1, 99);
     I.parts = (I.parts||[]).concat([{d: coup.on?28:Math.round(CO.rel*COACHB.relRenewW),
       w: coup.on ? 'zarząd stawia na ciebie wbrew trenerowi ('+CO.coach.name+')'
                  : 'trener '+CO.coach.name+' ('+CO.type.n+'): '+CO.status.n}]);
   } else {
     I.want = cl(Math.round(I.want + CO.rel*COACHB.relRenewW*0.5), 1, 99);
   }
   if(!chance(I.want)){
     if(isOld) oldMiss={code:'roll', want:I.want, gap, coachRel:CO.rel, coachName:CO.coach.name,
                        coachStatus:CO.status.n, coachType:CO.type.n};
     return;
   }
   if(isOld && coup && coup.on) coupPending={club:c.name, C:coup};
   cands.push({c, lk, gap, interest:I});
  });
 });
 
 /* KOŁO RATUNKOWE: jak nikt nie chce, czasem odezwie się ktoś z dołu KLŻ.
    Dla młodzieżowca to niemal pewnik — klub bez młodzieżowca nie ustawi składu
    i weźmie nawet zawodnika, który jeszcze nie umie wyjechać z łuku. */
 if(!cands.length && p.banSeasons===0 && chance(p.age<=21?92:60)){
   const weak=G.leagues.KL.clubs.slice()
     .filter(c=>!(p.prof>SPON.profBlock && titleCount(c)>=SPON.profBlockFrom))
     .sort((a,b)=>a.ovr-b.ovr).slice(0,3);
   if(weak.length){ const c=pick(weak);
     cands.push({c, lk:'KL', gap:rating-riderLevel(c), lifeline:true,
                 interest:clubInterest(p, c, 'KL', rating)}); }
 }
 
 // najmocniejsze kluby, które faktycznie cię chcą
 cands.sort((a,b)=> b.c.ovr - a.c.ovr);
 let sel = cands.slice(0,maxOffers);
 /* Klub, w którym jeździsz i który NAPRAWDĘ chce cię zatrzymać, zawsze pokazuje
    swoją ofertę — wcześniej potrafił wypaść z listy tylko dlatego, że był słabszy
    od innych chętnych, i wyglądało to jak brak przedłużenia. */
 const oldIn = cands.find(x=>x.c.name===p.club);
 if(oldIn && !sel.some(x=>x.c.name===p.club)){
   if(sel.length) sel[sel.length-1]=oldIn; else sel=[oldIn];
 }
 const out = sel.map(({c,lk,gap,interest})=>mkOffer(c,lk,gap,interest));
 /* --- PUCZ: TRENER WYLATUJE, TY ZOSTAJESZ ---
    Odpalamy dopiero teraz, kiedy oferta starego klubu naprawdę leży na stole. */
 if(coupPending && out.some(o=>o.stay && o.club===coupPending.club)){
   const fired=coachCoupFire(coupPending.club, coupPending.C);
   const mine=out.find(o=>o.club===coupPending.club);
   if(mine){ mine.coachFired=fired; mine.coup=coupPending.C.edge;
     mine.coach=Object.assign({}, mine.coach, {fired:true}); }
   G.coachCoup={year:G.year, club:coupPending.club, edge:coupPending.C.edge,
     out:fired?fired.out:'—', inn:fired?fired.inn:'—'};
 }
 /* POWÓD BRAKU PRZEDŁUŻENIA — do pokazania na ekranie ofert */
 G.noRenew = (p.club && !out.some(o=>o.stay)) ? renewRejection(oldMiss, rating, lastAvg) : null;
 /* Jeżeli to trener zamknął temat, dopisujemy to wprost — bez zgadywania,
    dlaczego „klub nie był zainteresowany". */
 if(G.noRenew && oldMiss && oldMiss.code==='roll' && oldMiss.coachRel!=null && oldMiss.coachRel<-15){
   G.noRenew.coach={name:oldMiss.coachName, type:oldMiss.coachType,
     rel:oldMiss.coachRel, status:oldMiss.coachStatus};
   G.noRenew.coachTxt='Decyzję podjął trener '+oldMiss.coachName+' ('+oldMiss.coachType+'). '+
     'W jego oczach byłeś w tej drużynie „'+oldMiss.coachStatus+'" — i tyle było warte twoje nazwisko na liście do przedłużenia.';
 }
 /* --- PODSUMOWANIE RYNKU DLA UI: skąd w ogóle wzięła się ta lista --- */
 G.market = {rating, parts:MV.parts, maxOffers, maxWhy, lastAvg,
             interested:cands.length, checked:allClubs().length, floor,
             age:p.age, prof:p.prof, med:p.med, ovr:p.ovr};
 /* --- JEDNORAZOWE FLAGI ZE ZDARZEŃ: KONSUMUJEMY JE TU ---
    Wcześniej `betterOffers` i `rowPen` raz ustawione zostawały na stałe:
    jeden dobry (albo jeden głupi) wybór na ekranie zdarzenia rzutował
    na KAŻDE kolejne okienko transferowe do końca kariery. Teraz działają
    na to jedno okienko, tak jak opisuje je samo zdarzenie. */
 p.next.noSponsor=false;      // blokada sponsorska obowiązywała na TO okienko
 p.next.betterOffers=false;
 p.next.rowPen=false;
 return out;
}
function signContract(o){
 const p=G.p;
 // odchodząc, część zaległości udaje się wyszarpać przy podpisywaniu papierów
 if(!o.stay && p.club){
   const old=LKEYS.map(k=>G.leagues[k].clubs.find(c=>c.name===p.club)).find(Boolean);
   if(old && old.debt>0 && chance(55)){
     const got=Math.round(old.debt*RF(0.35,0.85));
     old.debt=Math.max(0,old.debt-got); p.budget+=got; p.career.earned+=got;
   }
 }
 p.loyalty = o.stay ? cl(p.loyalty+18,0,100) : Math.round(p.loyalty*0.15);
 p.club=o.club; p.lk=o.lk; p.next.noRenew=false; p.idleYears=0; p.idleLog=[];
 const meR=G.riders.find(r=>r.me); if(meR){meR.club=o.club; meR.age=p.age; meR.ovr=p.ovr;}
 p.contract={type:o.type, years:o.years, rate:o.rate, bonus:o.bonus};
 /* SPRINT 3: podpis kasuje pamięć poprzedniego roku pod trenerem — w nowym
    klubie (albo pod nowym szkoleniowcem) relacja liczy się od zera. */
 p.coachDevYear=null;
 /* PREMIA ZA PODPIS NIE JEST JUŻ JEDNORAZOWA — wypłaca się na starcie KAŻDEGO
    sezonu objętego umową (patrz startSeason w engine.js). Dlatego tu nic nie
    dopisujemy do budżetu; pierwsza rata wpłynie razem z pierwszym sezonem. */
 if(o.type==='Amatorski'){
   const c=getClub(p);
   /* NAPRAWA SPRZĘTOWA: warunek czytał się jako "pierwszy kontrakt w karierze",
      ale w kodzie sprawdzał tylko typ oferty (Amatorski) — więc WETERAN, który
      po latach zakupów i zdarzeń sprzętowych trafił na amatorską ofertę (np.
      wymuszony transfer do słabego klubu po zaległościach), miał cały dorobek
      sprzętowy KASOWANY do gołego poziomu klubowego. Gracze zgłaszali to jako
      "zdarzenia sprzętowe nic nie dają" — bo i tak wszystko szło do zera przy
      najbliższym kontrakcie amatorskim. Reset do poziomu klubowego obowiązuje
      TERAZ wyłącznie przy debiucie (p.career.seasons===0); później kontrakt
      amatorski nie dokłada nic ponad to, co już masz, ale też nic nie zabiera. */
   if(p.career.seasons===0){
     const clubGear = 20;
     p.equip = p.keepEquip ? Math.max(p.equip, clubGear) : clubGear;
   }
   // p.career.seasons>0: kontrakt amatorski w trakcie kariery — p.equip zostaje
   // bez zmian (klub nie ma czym dołożyć, ale twój sprzęt jest wciąż twój).
   p.keepEquip=false;
   p.mech=25; p.mechName='Mechanik klubowy (z łapanki)'; p.mechCost=0;
 }
 G.screen='hub'; render();
}
