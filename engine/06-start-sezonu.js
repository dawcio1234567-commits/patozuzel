/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: START SEZONU
   startSeason() — kontekst sezonu G.S
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 382-448 oryginału).
   ============================================================ */
/* ============================================================
   2. START SEZONU
   ============================================================ */
function startSeason(){
 const p=G.p, club=getClub(p);
 /* NAPRAWA: zdarzenia zimowe, które ruszały nastroje w szatni (fxAN), pisały
    kiedyś do G.p.next.atmBonus, ale nikt tego pola nigdy nie czytał — efekt
    znikał bez śladu. Teraz wjeżdża w losowanie atmosfery na start sezonu. */
 const atm=cl(R(0,100)+(p.next.atmBonus||0),0,100);
 G.S={
  atm, heatPP:p.next.heatPP, injuryPP:p.next.injuryPP||0, noEarnings:false,
  teamPts:0, teamOvr:0, banMatches:0, equipFit:100,
  extraDefP:0, zeroMatches:p.next.zeroMatches, forcedEnd:false,
  /* WALKOWER: flaga + tryb + kara punktowa. Czyta to simSeasonChrono(),
     które realnie NIE ROZGRYWA tego spotkania (patrz walkoverRow). */
  walkower:false, walkMode:null, walkPen:0,
  /* DŁUGA KONTUZJA Z POPRZEDNIEGO ROKU — cały sezon poza torem. */
  longInjury:(p.longInjury||0)>0, longInjuryWhy:p.longInjuryWhy||'', longInjuryNew:null, longInjuryDmg:0,
  fines:0, evLog:[], noRenew:p.next.noRenew,
  /* STAWKA REALNA = stawka z kontraktu × efekty zdarzeń × mnożnik wieku.
     Junior dostaje ułamek tego, co ma na papierze (ECON.youngRate). */
  rateMul:(p.next.rateMul||1)*youngRateMul(p), ageMul:youngRateMul(p), ovrBonus:0,
  /* KONTEKST ZDARZENIA LOSOWEGO — w której kolejce wypada sytuacja z ekranu eventu.
     1-14 = sezon zasadniczy, 15-16 = play-off / baraże. Warunki cond(p,c,S)
     czytają S.round i S.matches, żeby "afera po meczu" nie trafiła się zimą. */
  round: R(1, BAL.rounds+2),
  matches: 0,
  prof0:p.prof, med0:p.med, ovr0:p.ovr, equip0:p.equip,
  /* DZIENNIK ZMIAN OVR — patrz logOvr() i rubryka „CO RUSZYŁO TWÓJ OVR" w UI. */
  ovrLog:[], signBonus:0
 };
 G.S.matches = G.S.round-1;
 /* ============================================================
    PREMIA ZA PODPIS — CO SEZON, A NIE RAZ NA KONTRAKT
    ------------------------------------------------------------
    Zgłoszenie gracza: „kwotę za podpis powinno się dostawać co sezon, nie
    tylko po podpisaniu kontraktu". Racja i tak to działa w realnych umowach:
    premia jest rozpisana na lata trwania kontraktu, a nie wypłacana raz na
    pięć lat z góry. Wcześniej signContract()/acceptRenew() dopisywały ją do
    budżetu w chwili podpisu i tyle — przy umowie na cztery lata trzy sezony
    szły bez grosza premii. Teraz premia z kontraktu wpływa NA STARCIE
    KAŻDEGO SEZONU objętego umową (wypłata jest po stronie klubu, więc
    obowiązuje ją ten sam limit wypłacalności co stawkę za punkt).
    ============================================================ */
 if(club && p.contract && p.contract.bonus>0 && p.banSeasons===0){
   const owed=Math.round(p.contract.bonus);
   const ratio=payRatioOf(club);
   const paid=Math.round(owed*ratio), unpaid=owed-paid;
   p.budget += paid; p.career.earned += paid; club.budget -= paid;
   if(unpaid>0) club.debt += unpaid;
   p.career.signBonus=(p.career.signBonus||0)+paid;
   G.S.signBonus=paid; G.S.signBonusOwed=owed;
 }
 /* Flagi przenoszone na OKIENKO TRANSFEROWE (konsumuje je makeOffers) zostają;
    reszta jednorazowych efektów z poprzedniego sezonu się zeruje. */
 p.next={zeroMatches:false, heatPP:0, betterOffers:p.next.betterOffers, noRenew:false,
         rowPen:p.next.rowPen, noArg:p.next.noArg, noUK:p.next.noUK,
         injuryPP:0, rateMul:1, atmBonus:0,
         noSponsor:p.next.noSponsor, lockTransfer:p.next.lockTransfer||0, forceClub:p.next.forceClub||null};
 
 // Zaległości NIE biorą się z powietrza — powstają dopiero z niewypłaconej
 // części twojego wynagrodzenia, po zakończeniu sezonu (patrz resolveSeason).
 p.shop={bought:[],log:[],spent:0,equipGain:0,mechHired:false};
 G.ev = rollEvent();
 G.screen='event'; render();
}
