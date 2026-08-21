/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN ZDARZENIA
   Ekran zdarzenia sezonowego, pulpit „co z tego wyszło", routing sezonu.
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1032-1107 oryginału).
   ============================================================ */
/* ---- EKRAN: ZDARZENIE ---- */
function scEvent(){
 const e=G.ev;
 return head()+`<div class="fade">
 <div class="brut border-orange-900">
  <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">ŚRODEK SEZONU ${G.year} // ZDARZENIE</div>
  <div class="p-5">
   <div class="text-orange-500 font-extrabold tracking-wider text-[15px] mb-3">${e.t}</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-5 border-l-2 border-orange-900 pl-4">${evText(e)}</div>
   <div class="space-y-2">
   ${e.o.map((o,i)=>`<button onclick="chooseEv(${i})" class="btn w-full text-left px-4 py-3 text-[12px]"><span class="text-orange-600 font-bold mr-2">${i+1}.</span>${o.l}</button>`).join('')}
   </div>
  </div>
 </div></div>`;
}
/* ============================================================
   WYBÓR OPCJI W ZDARZENIU → PULPIT PODSUMOWANIA → DOPIERO POTEM SEZON
   ------------------------------------------------------------
   Gracze zgłaszali brak feedbacku narracyjnego: klikasz opcję i lądujesz
   od razu w raporcie sezonu, nie wiedząc, co się właściwie stało.
   Teraz opcja może dostarczyć tekst na osobny, mały pulpit:
     · statycznie:  {l:'...', sum:'Tekst na ekran', f:()=>[...]}
     · dynamicznie: f:()=>[fxSum('Tekst zależny od losowania'), fxP(-5)]
   Jeżeli bufor podsumowań (EV_SUM w data.js) jest pusty, zachowujemy stare
   zachowanie i lecimy prosto do rozstrzygnięcia sezonu.
   ============================================================ */
function chooseEv(i){
 const e=G.ev, o=e.o[i];
 G.S.evTitle=e.t; G.S.evChoice=o.l;
 evSumClear();                                    // czyścimy bufor przed odpaleniem efektów
 /* RUBRYKA BUDŻETOWA DECYZJI: gracze pytali, czy zdarzenia z hajsem w opcji
    faktycznie ruszają budżet, czy to tylko tekst. Łapiemy stan konta PRZED
    i PO efekcie i pokazujemy różnicę w pasku gracza (playerStrip), dopóki
    nie zapadnie kolejna decyzja budżetowa. */
 const budgetBefore = G.p.budget;
 /* fxApply() zamienia cokolwiek zwróci zdarzenie na listę czytelnych linijek
    i odpala odroczone efekty z deskryptorów { t, f } — bez tego w rubryce
    EFEKTY lądowało „[object Object]", a sam efekt nigdy się nie wykonywał.
    try/catch, bo pojedyncze zdarzenie nie ma prawa zawiesić całego sezonu. */
 try{ G.S.evLog=fxApply(o.f()); }
 catch(err){ G.S.evLog=['(zdarzenie nie doszło do skutku: '+err.message+')']; }
 const budgetDelta = Math.round(G.p.budget - budgetBefore);
 if(budgetDelta!==0){ G.p.lastDecisionBudgetDelta=budgetDelta; G.p.lastDecisionLabel=e.t; }
 let sum = evSumTake();                           // to, co wrzuciło fxSum() wewnątrz f()
 if(o.sum) sum = [o.sum].concat(sum);             // + statyczny tekst opcji
 if(sum.length){
   G.evSum = sum;
   G.screen='evsum'; render(); return;            // sezon czeka na kliknięcie OK
 }
 finishEv();
}
/* ============================================================
   ZAMKNIĘCIE ZDARZENIA → ROZSTRZYGNIĘCIE SEZONU
   ------------------------------------------------------------
   resolveSeason() nie jest już „jednym kliknięciem": od patcha 22.08.2026
   może zatrzymać się w środku i poprosić o decyzję (wielki mecz, jazda
   na żywo). Zwraca wtedy null, a szczegóły pauzy siedzą w G.pause.
   seasonRoute() jest JEDYNYM miejscem, które to rozstrzyga — wszystkie
   przyciski trybu jazdy przechodzą przez nie.
   ============================================================ */
function finishEv(){
 G.evSum=null;
 seasonRoute(resolveSeason());
}
function seasonRoute(r){
 if(r===null && G.pause){
   G.screen = G.pause.ui==='big' ? 'big' : 'live';
   render(); return;
 }
 G.screen='summary'; render();
}
/* Decyzja przed wielkim meczem: 'sim' | 'ride' | 'cry'. */
function bigChoose(a){ seasonRoute(seasonStep({a})); }
/* Każdy przycisk trybu jazdy: akcja + ewentualna wartość (zębatka, linia jazdy). */
function liveAct(a, v){ seasonRoute(seasonStep({a, v})); }


/* ---- EKRAN: PULPIT PODSUMOWANIA ZDARZENIA (modal nad tłem zdarzenia) ---- */
function scEvSum(){
 const e=G.ev, lines=G.evSum||[];
 return head()+`<div class="fade">
 <div class="brut border-orange-900 relative">
  <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">ŚRODEK SEZONU ${G.year} // ZDARZENIE</div>
  <div class="p-5 opacity-30 pointer-events-none select-none">
   <div class="text-orange-500 font-extrabold tracking-wider text-[15px] mb-3">${e?e.t:''}</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-5 border-l-2 border-orange-900 pl-4">${e?evText(e):''}</div>
  </div>
 </div>
 <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="position:fixed;top:0;right:0;bottom:0;left:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.82)">
  <div class="brut border-orange-600 w-full" style="max-width:560px;box-shadow:0 0 0 3px #000, 0 12px 40px rgba(0,0,0,.9)">
   <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">CO Z TEGO WYSZŁO</div>
   <div class="p-5">
    <div class="text-[11px] text-zinc-400 tracking-widest mb-2">${esc(G.S&&G.S.evChoice?G.S.evChoice:'—')}</div>
    ${lines.map(l=>`<div class="text-zinc-100 text-[13.5px] leading-relaxed mb-3 border-l-2 border-orange-600 pl-4">${esc(l)}</div>`).join('')}
    <button onclick="finishEv()" class="btn px-8 py-3 font-extrabold tracking-[.25em] text-orange-500 w-full sm:w-auto">OK</button>
   </div>
  </div>
 </div></div>`;
}
