/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: LOSOWANIE ZDARZEN
   rollEvent, rollWinterEvent, applyWinterChoice
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 449-533 oryginału).
   ============================================================ */
let evHist=[];
/* WARUNEK ZDARZENIA — cond(p, c, S):
     p = Gracz (G.p), c = jego klub (albo null), S = stan sezonu (G.S).
   Event bez `cond` jest dostępny zawsze. Warunek, który się wywali
   (np. odwołanie do klubu, którego nie ma), traktujemy jak niespełniony. */
function evOk(e,p,c,S){
 if(!e.cond) return true;
 try{ return !!e.cond(p,c,S); }catch(_){ return false; }
}
function rollEvent(){
 const p=G.p, c=clubOf(p), S=G.S;
 // 1) FILTR WARUNKÓW: zostają tylko sytuacje możliwe w twoim położeniu
 const validEvents = EVENTS.filter(e => !e.cond || evOk(e,p,c,S));
 if(!validEvents.length) return pick(EVENTS);
 // 2) świeżość — nie powtarzamy tego samego zdarzenia w kółko
 let pool = validEvents.filter(e=>!evHist.includes(e.id));
 if(!pool.length){ evHist=[]; pool = validEvents; }
 // 3) zdarzenia warunkowe mają pierwszeństwo — to one komentują twoją realną sytuację
 const cnd = pool.filter(e=>e.cond), gen = pool.filter(e=>!e.cond);
 /* WAGA `w` (domyślnie 1): rzadkie sytuacje z wąskim warunkiem — jak zaproszenie
    do Argentyny czy kuszenie przez rywala — przy 100 zdarzeniach w puli trafiałyby
    się raz na kilka karier. Waga podnosi im szansę bez ruszania reszty. */
 const wpick = arr => { const bag=[];
   arr.forEach(x=>{ const w=cl(Math.round(x.w||1),1,20); for(let i=0;i<w;i++) bag.push(x); });
   return pick(bag); };
 let e;
 if(cnd.length && (chance(60)||!gen.length)) e=wpick(cnd);
 else if(gen.length) e=wpick(gen);
 else e=wpick(pool);
 evHist.push(e.id); if(evHist.length>25) evHist.shift();
 return e;
}
const evText = e => typeof e.x==='function' ? e.x() : e.x;

/* ============================================================
   3-bis. ZDARZENIE MIĘDZYSEZONOWE (PRZERWA ZIMOWA)
   ------------------------------------------------------------
   Osobna pula (WINTER_EVENTS w data.js) odpalana MIĘDZY sezonami:
   po resolveSeason() i PRZED makeOffers(). Dzięki temu skutki decyzji
   zimowych (OVR, sprzęt, gotówka, alimenty, wymuszony transfer, lepsze
   oferty) są już widoczne w okienku transferowym.

   Zima nie ma obiektu sezonu, więc podstawiamy pusty kontekst zimowy —
   warunki cond(p,c,S) czytające S.round dostają 0 i po prostu nie przechodzą,
   a nie wysypują gry.
   ============================================================ */
const WINTER_CHANCE = 62;              // % szans na zdarzenie w danej przerwie zimowej
let wevHist=[];
function winterCtx(){ return {winter:true, round:0, matches:0, atm:55, heatPP:0}; }
function rollWinterEvent(){
 if(typeof WINTER_EVENTS==='undefined' || !WINTER_EVENTS.length) return null;
 const p=G.p, c=clubOf(p), S=winterCtx();
 const valid=WINTER_EVENTS.filter(e=>evOk(e,p,c,S));
 if(!valid.length) return null;
 let pool=valid.filter(e=>!wevHist.includes(e.id));
 if(!pool.length){ wevHist=[]; pool=valid; }
 const bag=[]; pool.forEach(x=>{ const w=cl(Math.round(x.w||1),1,20); for(let i=0;i<w;i++) bag.push(x); });
 const e=pick(bag);
 wevHist.push(e.id); if(wevHist.length>6) wevHist.shift();
 return e;
}
/* Odpalenie wybranej opcji zimowej. Efekty z data.js sięgają do G.S
   (fxA/fxT/fxOB...), więc na czas zimy podstawiamy atrapę sezonu —
   nawet gdyby ktoś kiedyś użył takiego helpera w zdarzeniu zimowym,
   gra się nie wywali, a efekt po prostu przepadnie z atrapą. */
function applyWinterChoice(e, i){
 const o=e.o[i];
 const keep=G.S;
 G.S=Object.assign(winterCtx(), {teamPts:0, teamOvr:0, ovrBonus:0, injuryPP:0, heatPP:0,
   extraDefP:0, banMatches:0, fines:0, equipFit:100, rateMul:1, evLog:[], walkower:false});
 let out=[];
 evSumClear();                                   // bufor pulpitu podsumowania (fxSum)
 const budgetBefore=G.p.budget;                  // rubryka budżetowa decyzji — patrz chooseEv() w index.html
 // fxApply: spłaszcza wynik f(), odpala odroczone deskryptory { t, f } i zwraca
 // same stringi — inaczej w rubryce EFEKTY lądowało „[object Object]".
 try{ out=fxApply(o.f()); }catch(err){ out=['(zdarzenie zimowe nie doszło do skutku: '+err.message+')']; }
 const budgetDelta=Math.round(G.p.budget-budgetBefore);
 if(budgetDelta!==0){ G.p.lastDecisionBudgetDelta=budgetDelta; G.p.lastDecisionLabel=e.t; }
 let sum=evSumTake();
 if(o.sum) sum=[o.sum].concat(sum);
 G.S=keep;
 G.wevTitle=e.t; G.wevChoice=o.l; G.wevLog=out; G.wevSum=sum;
 return out;
}
