/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: STAN GRY
   G, newGame(), newPlayer() — cały stan rozgrywki
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 204-260 oryginału).
   ============================================================ */
let G=null;
function newGame(){
 return {
  screen:'create', year:2026,
  leagues:BASE_LEAGUES(),
  tables:{}, results:{}, playoff:null, promo:[], bankrupts:[], greenTable:[],
  p:null, last:null, history:[], log:[], ev:null, S:null,
  phase:{}, riders:[], recIMP:[], recMIMP:null, meForm:0,
  /* --- ŚWIAT: zawodnicy spoza Polski + stan cyklu IMŚ (patrz sekcja 5e) --- */
  world:[], sgp:null, imsHist:[], imsjHist:[],
  /* --- PODGLĄD MECZU (klikniecie w wynik) --- */
  matchView:null,
  /* --- WIELKI MECZ / JAZDA NA ŻYWO (patch 22.08.2026) ---
     pause  — na co czeka zatrzymana symulacja sezonu (patrz seasonStep),
     live   — stan spotkania jechanego ręcznie, czytany przez scLive() w UI. */
  pause:null, live:null, liveSnap:null,
  /* --- USTAWIENIA KARIERY (Sprint 5, patch 24.08.2026) ---
     Wybierane RAZ, na ekranie tworzenia zawodnika, i obowiązujące przez
     całą karierę:
       liveMatches — czy gra ma w ogóle proponować JAZDĘ NA ŻYWO w wielkim
                     meczu. `false` = ekran „przesymuluj / jadę / rozpłacz się"
                     nigdy się nie pokazuje, a wszystkie spotkania liczy silnik.
                     Sprawdza to bigMatchAsk() w engine/28-wielki-mecz.js.
     Stare zapisy (sprzed patcha) nie mają tego pola — dlatego wszędzie
     czytamy je przez gameOpt('liveMatches'), które domyśla się `true`. */
  opts:{liveMatches:true},
  /* --- SPONSORZY TYTULARNI ---
     bannedSponsors: firmy z Grupy B, które już raz uciekły z kasą — znikają z gry na zawsze.
     sponsorRenames: zmiany nazw klubów czekające na wejście w nowym roku (do raportu w UI). */
  bannedSponsors:[], sponsorRenames:[], renamed:{},
  /* --- ZDARZENIE MIĘDZYSEZONOWE (przerwa zimowa) --- */
  wev:null, wevLog:[], wevTitle:null, wevChoice:null, wevAfter:'hub',
  /* --- TRENERZY (Sprint 3, patch 22.08.2026) ---
     Sam trener siedzi na obiekcie klubu (c.coach) — dzięki temu przeżywa
     awans, spadek i zmianę szyldu razem z drużyną. Tutaj trzymamy tylko to,
     co jest HISTORIĄ rozgrywki:
       coachLog  — kto kogo zwolnił, w którym roku i za co (plus twój roczny
                   bilans rozwoju pod danym szkoleniowcem),
       coachCoup — ostatni pucz gwiazdy: zarząd wybrał ciebie, trener wyleciał. */
  coachLog:[], coachCoup:null,
  /* Dziennik nielegalnych ustawień pod taśmą — pusty przy poprawnym silniku.
     Trzyma go gateAudit() (engine/12) i czyta test regresji. */
  gateWarn:[],
  /* --- PAMIĘĆ KOMENTARZY POSEZONOWYCH ---
     { klucz warunku: [użyte indeksy] } — dzięki temu „CO MÓWIĄ PO SEZONIE"
     nie powtarza tych samych zdań, dopóki nie wyczerpie całej puli. */
  talkSeen:{}
 };
}
 
function newPlayer(name,clsId){
 const c=CLASSES.find(x=>x.id===clsId);
 return {
  name, cls:c.n, clsId,
  age:16, ovr:R(c.ovr[0],c.ovr[1]), pot:R(c.pot[0],c.pot[1]),
  prof:R(c.prof[0],c.prof[1]), med:R(c.med[0],c.med[1]),
  budget:(c.budget||0), equip:20, mech:25, mechName:'Mechanik klubowy (z łapanki)', mechCost:0,
  loyalty:0, club:null, lk:null,
  contract:{type:'Amatorski', years:1, rate:R(150,350), bonus:0},
  banSeasons:0, injured:0, retired:false, retireReason:'',
  /* longInjury — ile PEŁNYCH sezonów wypadasz po zerwaniu więzadeł / złamaniu udu.
     alimony   — ile jeszcze rat po 45 000 zł zejdzie z budżetu po sezonie. */
  longInjury:0, longInjuryWhy:'', alimony:0,
  // FORMA: dyspozycja z ostatniego sezonu (-12..+12). Ujemna = dołek.
  // Czytają ją warunki zdarzeń losowych (cond: p.form<0).
  form:0,
  /* TRENER (Sprint 3): coachDev to rozliczenie ostatniego roku pod
     szkoleniowcem — ile OVR ci dołożył albo zabrał, jaka była sympatia
     i jaki status w zespole. coachDevYear pilnuje, żeby policzyć to raz. */
  coachDev:null, coachDevYear:null,
  // RUBRYKA BUDŻETOWA OSTATNIEJ DECYZJI — patrz chooseEv()/applyWinterChoice().
  lastDecisionBudgetDelta:0, lastDecisionLabel:'',
  shop:{bought:[],log:[],spent:0,equipGain:0,mechHired:false},
  next:{zeroMatches:false, heatPP:0, betterOffers:false, noRenew:false, rowPen:false, noArg:false,
        noUK:false,
        injuryPP:0, rateMul:1, noSponsor:false, lockTransfer:0, forceClub:null, atmBonus:0,
        tribunalCase:null},
  career:{seasons:0,matches:0,heats:0,pts:0,bon:0,def:0,exc:0,earned:0,titles:0,best:'—',bestAvg:0,
          living:0, service:0, renewals:0, coachesFired:0}
 };
}

/* ------------------------------------------------------------
   USTAWIENIA KARIERY — jedno wejście, odporne na stare zapisy.
   Rozgrywka zaczęta przed Sprintem 5 nie ma `G.opts`, więc brak pola
   znaczy „tak jak było do tej pory": wielki mecz PYTA o jazdę na żywo.
   ------------------------------------------------------------ */
function gameOpt(k, dflt){
 const d = dflt===undefined ? true : dflt;
 if(!G) return d;
 if(!G.opts) G.opts={};
 return G.opts[k]===undefined ? d : G.opts[k];
}
function setGameOpt(k, v){
 if(!G) return v;
 if(!G.opts) G.opts={};
 G.opts[k]=v;
 return v;
}
