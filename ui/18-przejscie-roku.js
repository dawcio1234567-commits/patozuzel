/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: PRZEJSCIE ROKU
   nextYear, przerwa zimowa, trybunał PZM, przeczekanie roku
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2464-2688 oryginału).
   ============================================================ */
/* ---- PRZEJŚCIE DO KOLEJNEGO ROKU ---- */
function nextYear(){
 const p=G.p;
 /* KARIERA URWANA PRZEZ ZDARZENIE (fxEnd: wiatrówka, katastrofa awionetki,
    uraz kręgosłupa na crossie, gigantyczny przypał). Wcześniej fxEnd ustawiał
    p.retired=true i NIKT tego nie sprawdzał — gracz spokojnie jechał dalej. */
 if(p.retired){ retire(p.retireReason||'Zdarzenie zamknęło karierę.'); return; }
 if(G.nextIMP){G.recIMP=G.nextIMP;G.nextIMP=null;}
 if(G.nextMimpChamp){G.recMIMP=G.nextMimpChamp;G.nextMimpChamp=null;}
 ageRiders();
 /* NOWE SZYLDY SPONSORÓW TYTULARNYCH wchodzą w życie z nowym rokiem —
    dopiero teraz klub realnie zmienia nazwę (kadra, Gracz, tabele). */
 applyPendingSponsors();
 p.age++; G.year++;
 syncMeRider();                       // Gracz też się starzeje — także w oczach trenera
 if(p.banSeasons>0) p.banSeasons--;
 p.contract.years--;
 // rozwój klubów
 LKEYS.forEach(k=>G.leagues[k].clubs.forEach(c=>{c.mood=R(20,90);}));
 /* KONIEC KARIERY LICZONY, NIE SZTYWNY: granicę wyznaczają profesjonalizm i OVR
    (retireAgeOf/retireCheck w engine.js), a nie stałe „40 lat". */
 const why=retireCheck(p);
 if(why){ retire(why); return; }
 /* ============================================================
    PRZERWA ZIMOWA — OSOBNA PULA ZDARZEŃ (WINTER_EVENTS)
    Odpalana MIĘDZY resolveSeason() a makeOffers(): skutki decyzji
    zimowych (OVR, sprzęt, kasa, alimenty, wymuszony transfer, lepsze
    oferty) są widoczne już w okienku transferowym.
    ============================================================ */
 G.wev=null; G.wevLog=[]; G.wevDone=false; G.wevTitle=null; G.wevChoice=null; G.wevSum=[];
 if(chance(WINTER_CHANCE)){
   const e=rollWinterEvent();
   if(e){ G.wev=e; G.screen='winter'; render(); return; }
 }
 afterWinter();
}
/* Routing PO przerwie zimowej: okienko transferowe / przedłużenie / hub. */
function afterWinter(){
 const p=G.p;
 /* KARIERA URWANA PRZEZ ZDARZENIE ZIMOWE (fxEnd: wiatrówka, lód pod motocyklem,
    petarda, próba przekupienia straży granicznej). nextYear() sprawdza p.retired
    tylko na WEJŚCIU, czyli PRZED przerwą zimową — bez tej linijki gracz
    „po zakończonej karierze" spokojnie podpisywał kontrakt i jechał kolejny sezon,
    a koniec kariery wchodził dopiero rok później. */
 if(p.retired){ retire(p.retireReason||'Zdarzenie zimowe zamknęło karierę.'); return; }
 /* ============================================================
    TRYBUNAŁ PZM — OSOBNE, NIEZALEŻNE ZDARZENIE ZIMOWE
    Ustawiane przez resolveSeason() (engine.js), gdy w sezonie był bunt
    płacowy przy wieloletnim kontrakcie, a klub wciąż zalega. Pokazuje się
    ZAWSZE, niezależnie od tego, czy zwykłe losowanie zimowe (WINTER_EVENTS)
    coś wylosowało — więc w jednej przerwie mogą wypaść dwa ekrany zdarzeń.
    ============================================================ */
 if(p.next.tribunalCase){ G.screen='tribunal'; render(); return; }
 afterWinterCore();
}
/* Dawna treść afterWinter() — teraz wołana PO ewentualnym trybunale. */
function afterWinterCore(){
 const p=G.p;
 const noRenew = G.S ? G.S.noRenew : false;
 /* ============================================================
    WYMUSZONY TRANSFER MUSI OTWORZYĆ OKIENKO
    Zdarzenia ustawiają p.next.forceClub (świstek, niezapięty kask juniora,
    wejście na lewo dla dziadka, Słowacja, wypłata w diamentach, kuszenie
    przez rywala, rok mycia pancerzy). Konsumuje tę flagę WYŁĄCZNIE
    makeOffers() — a ten był wołany tylko wtedy, gdy umowa wygasła. Przy
    kontrakcie na 2-3 lata skutek zdarzenia po prostu przepadał.
    Teraz wymuszony transfer zrywa umowę i otwiera rynek.
    ============================================================ */
 if(p.next.forceClub && p.contract.years>0){
   p.contract.years=0;
   p.forcedExit=true;
 }
 if(p.contract.years<=0 || noRenew || p.next.forceClub){
   if(noRenew) p.next.noRenew=true;
   _offers=[]; G.screen='sign'; render(); return;
 }
 /* PRZEDŁUŻENIE W TRAKCIE UMOWY — droga do kariery w jednym klubie */
 _renew = makeRenewOffer();
 if(_renew){ G.screen='renew'; render(); return; }
 G.screen='hub'; render();
}

/* ---- EKRAN: TRYBUNAŁ PZM ---- */
function resolveTribunal(reported){
 const p=G.p, tc=p.next.tribunalCase;
 let log=[];
 if(reported){
   if(chance(75)){
     const c=clubOf(p);
     let recovered=0;
     if(c && c.debt>0){
       recovered=Math.round(c.debt*RF(0.50,0.85));
       c.debt=Math.max(0,c.debt-recovered);
       p.budget+=recovered; p.career.earned+=recovered;
     }
     p.contract.years=0; p.forcedExit=true; p.next.noRenew=true;
     log=['TRYBUNAŁ PZM ROZWIĄZUJE KONTRAKT.',
          'Umowa z '+tc.club+' przestaje obowiązywać ze skutkiem natychmiastowym.',
          recovered? ('Klub musi rozliczyć zaległości: odzyskujesz '+zl(recovered)+' z '+zl(tc.debt)+'.')
                   : 'Z zaległości nie udaje się odzyskać ani grosza — klub formalnie nie ma z czego oddać.',
          'Wchodzisz na wolny rynek już teraz, przed zwykłym okienkiem transferowym.'];
   } else {
     const c=clubOf(p);
     if(c) c.debt=0;
     log=['PREZES PRZEKUPIŁ ZWIĄZEK.',
          'Trybunał oddala sprawę. Kontrakt z '+tc.club+' trwa dalej bez zmian —',
          'ale, o dziwo, cała zaległość ('+zl(tc.debt)+') znika z papierów klubu. Nikt niczego nie tłumaczy.'];
   }
 } else {
   log=['Odpuszczasz sprawę, żeby nie zadzierać z zarządem.',
        'Zaległość ('+zl(tc.debt)+') zostaje tam, gdzie była — kontrakt trwa dalej na dotychczasowych warunkach.'];
 }
 p.next.tribunalCase=null;
 G.tribunalLog=log; G.tribunalDone=true; render();
}
function afterTribunal(){
 G.tribunalDone=false; G.tribunalLog=null;
 afterWinterCore();
}
function scTribunal(){
 const p=G.p, tc=p.next.tribunalCase||{club:'—',debt:0,strikeRounds:0};
 const box=(inner)=>head()+`<div class="fade">
  <div class="brut" style="border-color:#b91c1c">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#b91c1c;color:#ef4444">
     PRZERWA ZIMOWA ${G.year-1}/${G.year} // TRYBUNAŁ PZM</div>
   <div class="p-5">${inner}</div>
  </div></div>`;
 if(!G.tribunalDone){
  return box(`
   <div class="font-extrabold tracking-wider text-[15px] mb-3" style="color:#ef4444">ZALEGŁOŚCI KLUBU — ZGŁOSZENIE DO TRYBUNAŁU PZM</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-5 border-l-2 pl-4" style="border-color:#7f1d1d">
     Masz wieloletni kontrakt z ${esc(tc.club)}, a klub zalega ci już ${zl(tc.debt)}.
     W minionym sezonie odmówiłeś wyjazdu na tor przez ${tc.strikeRounds} ${tc.strikeRounds===1?'kolejkę':(tc.strikeRounds<5?'kolejki':'kolejek')}
     — a mimo to umowa formalnie trwa dalej. Możesz zgłosić sprawę do trybunału Polskiego Związku Motorowego.
   </div>
   <div class="space-y-2">
    <button onclick="resolveTribunal(true)" class="btn w-full text-left px-4 py-3 text-[12px]"><span class="font-bold mr-2" style="color:#ef4444">1.</span>Zgłaszam klub do trybunału PZM.</button>
    <button onclick="resolveTribunal(false)" class="btn w-full text-left px-4 py-3 text-[12px]"><span class="font-bold mr-2" style="color:#ef4444">2.</span>Odpuszczam — nie chcę zadzierać z zarządem.</button>
   </div>
   <div class="text-[11px] text-zinc-400 mt-4">To zdarzenie jest niezależne od zwykłego losowania zimowego — mogłeś już zobaczyć inne.</div>`);
 }
 return box(`
  <div class="font-extrabold tracking-wider text-[15px] mb-3" style="color:#ef4444">ROZSTRZYGNIĘCIE TRYBUNAŁU</div>
  <div class="brut p-4 mb-3" style="border-color:#ef4444">
   ${(G.tribunalLog||[]).map(l=>`<div class="text-zinc-100 text-[13.5px] leading-relaxed mb-2 border-l-2 pl-4" style="border-color:#ef4444">${esc(l)}</div>`).join('')}
  </div>
  <button onclick="afterTribunal()" class="btn px-7 py-3 font-extrabold tracking-[.2em]" style="color:#ef4444">OK, IDĘ DALEJ &gt;</button>`);
}

/* ---- EKRAN: ZDARZENIE MIĘDZYSEZONOWE (ZIMA) ---- */
function scWinter(){
 const e=G.wev;
 if(!e){ afterWinter(); return ''; }
 const box = (inner)=>head()+`<div class="fade">
  <div class="brut" style="border-color:#0369a1">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#0369a1;color:#38bdf8">
     PRZERWA ZIMOWA ${G.year-1}/${G.year} // MIĘDZYSEZONIE — PRZED OKIENKIEM TRANSFEROWYM</div>
   <div class="p-5">${inner}</div>
  </div></div>`;
 if(!G.wevDone){
  return box(`
   <div class="font-extrabold tracking-wider text-[15px] mb-3" style="color:#38bdf8">${e.t}</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-5 border-l-2 pl-4" style="border-color:#0c4a6e">${evText(e)}</div>
   <div class="space-y-2">
   ${e.o.map((o,i)=>`<button onclick="chooseWev(${i})" class="btn w-full text-left px-4 py-3 text-[12px]"><span class="font-bold mr-2" style="color:#0ea5e9">${i+1}.</span>${o.l}</button>`).join('')}
   </div>
   <div class="text-[11px] text-zinc-400 mt-4">To zdarzenie dzieje się ZIMĄ — jego skutki zobaczysz jeszcze przed ofertami kontraktowymi.</div>`);
 }
 const alimNew = (G.p.alimony||0)>0;
 return box(`
  <div class="font-extrabold tracking-wider text-[15px] mb-1" style="color:#38bdf8">${esc(G.wevTitle||e.t)}</div>
  <div class="text-[11px] text-zinc-400 mb-3">Twoja decyzja: „${esc(G.wevChoice||'—')}”</div>
  ${(G.wevSum||[]).length?`<div class="brut p-4 mb-3" style="border-color:#0ea5e9">
    ${(G.wevSum||[]).map(l=>`<div class="text-zinc-100 text-[13.5px] leading-relaxed mb-2 border-l-2 pl-4" style="border-color:#0ea5e9">${esc(l)}</div>`).join('')}
   </div>`:''}
  <div class="brut p-3 mb-3">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">SKUTKI</div>
   <ul class="text-[12px] text-zinc-200 space-y-0.5">${(G.wevLog||[]).map(l=>'<li>› '+esc(l)+'</li>').join('')||'<li class="text-zinc-400">Bez skutków.</li>'}</ul>
  </div>
  ${alimNew?`<div class="brut p-3 mb-3 border-2 border-red-700 bg-red-950/20">
    <div class="text-[12px] text-red-500 font-bold tracking-widest mb-1">ALIMENTY DO ARGENTYNY</div>
    <div class="text-[12px] text-red-400 font-bold">${zl(ECON.alimony)} co sezon · pozostało rat: ${G.p.alimony}</div>
    <div class="text-[11px] text-zinc-300 mt-1">Kwota schodzi z budżetu po każdym sezonie, niezależnie od tego,
    czy jeździłeś, czy leżałeś w gipsie, i czy klub w ogóle ci zapłacił.</div></div>`:''}
  <button onclick="afterWinter()" class="btn px-7 py-3 font-extrabold tracking-[.2em]" style="color:#38bdf8">OK, IDĘ DO OFERT &gt;</button>`);
}
function chooseWev(i){
 applyWinterChoice(G.wev, i);
 G.wevDone=true;
 render();
}
function skipYear(){
 const p=G.p, y=G.year;
 // liga żyje dalej także wtedy, gdy ty siedzisz w domu
 allClubs().forEach(clubSeasonBudget);
 clubEconomy();
 ageRiders();
 applyPendingSponsors();
 /* Rok poza torem to też rok rehabilitacji. */
 if((p.longInjury||0)>0){ p.longInjury--; if(!p.longInjury) p.longInjuryWhy=''; }
 const alim = chargeAlimony(p);
 const loss=R(1,4);
 p.ovr=cl(p.ovr-loss,1,99);
 p.med=cl(p.med-R(5,12),0,99);
 p.equip=cl(p.equip-R(3,8),1,99);
 p.loyalty=0;
 // rok bez klubu też kosztuje — jeść trzeba, rata za busa leci dalej
 const live=livingCostOf(p,true);
 p.budget-=live;
 p.career.living=(p.career.living||0)+live;
 p.idleYears=(p.idleYears||0)+1;
 p.idleLog=p.idleLog||[];
 p.idleLog.unshift(y+': cały rok bez klubu — OVR -'+loss+', medialność w dół, sprzęt rdzewieje w garażu, '+
   'koszty życia '+zl(live)+(alim?', alimenty do Argentyny '+zl(alim.amount)+' (rat: '+alim.left+')':'')+
   (p.banSeasons>0?' (trwa zawieszenie)':''));
 if(p.idleLog.length>4) p.idleLog.pop();
 p.age++; G.year++;
 syncMeRider();
 if(p.banSeasons>0) p.banSeasons--;
 const why=retireCheck(p);
 if(why){retire(why);return;}
 if(p.idleYears>=3){retire('Trzy lata bez klubu. Kariera skończyła się bez ogłoszenia.');return;}
 _offers=[]; G.screen='sign'; render();
}
