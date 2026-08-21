/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: FLAVOR — FINAŁ IMP / OSTATNIA RUNDA GP
   ------------------------------------------------------------
   UPROSZCZONA WERSJA zdarzeń "Zmarzlina_IMP" i "Aronsson" z pakietu
   data/21-zdarzenia-nowe-2026.js. Prawdziwy ekran wyboru (4 klikalne
   opcje w trakcie finału) wymaga architektury generatora zdarzeń
   z ui/07-ekran-zdarzenia.js, której nie mam — więc zamiast tego oba
   wątki odpalają się jako LOSOWY WYNIK bez ekranu wyboru, wpięty
   bezpośrednio w wynik finału IMP (engine/22) i ostatniej rundy GP
   (engine/23), przez podmianę (monkey-patch) generatorów
   `simIndividualGen` i `runGpSeriesGen`. Musi się ładować PO obu
   plikach, ale PRZED tym, jak gra realnie zacznie wołać te funkcje
   (czyli przed <script> boot na końcu index.html — patrz MODULY.md).
   ============================================================ */

/* --- ZMARZLINA_IMP: tylko gdy naprawdę byłeś w finale IMP i masz OVR>90 --- */
function impFinaleFlavor(imp){
 if(!imp || !imp.inFinal || !imp.rode) return;
 if((G.p.ovr||0) <= 90) return;
 if(!chance(35)) return;                       // nie za każdym razem w finale
 const r=R(1,4);
 if(r===1){                                     // Atakuję w krawężniku
   if(!chance(66)) fxBan(R(1,3));                // 34%: kontuzja obojczyka
 } else if(r===2){                               // Atakuję po bandzie
   if(chance(66)) fxBan(R(1,4));                 // 66%: złamany obojczyk
 } else if(r===3){                               // Próba nożyc
   if(chance(10)) fxBan(R(5,8));                 // 10%: kontuzja więzadeł
 } else {                                        // Obrona miejsca — pokora popłaca
   fxM(-10); fxP(10);
 }
}

/* --- ARONSSON: tylko w cyklu GP (nie IMŚJ2), gdy walczysz o czołówkę rundy --- */
function gpFinaleFlavor(result, cfg){
 if(!result || !(cfg && cfg.bigStage==='GRAND PRIX')) return;
 if(!(result.mePos>=1 && result.mePos<=5)) return;
 if(!chance(25)) return;
 if(chance(50)){
   /* MAŁA, MAŁA, MAŁAAAA — defekt teraz to jest szaleństwo */
   fxDef(15);
 } else {
   /* DUŻA, DUŻA, DUŻAAAA — wyprzedzasz po dużej */
   fxK(150000); fxO(3); fxM(15);
 }
}

/* --- PODMIANA GENERATORÓW (musi być function-expression, nie declaration,
   żeby nadpisać istniejące top-level `function*` z engine/22 i engine/23) --- */
(function(){
 const _origSimIndividualGen = simIndividualGen;
 simIndividualGen = function*(p, effOvr, defP, excP, live){
   const out = yield* _origSimIndividualGen(p, effOvr, defP, excP, live);
   try{ impFinaleFlavor(out.imp); }catch(_){}
   return out;
 };
 const _origRunGpSeriesGen = runGpSeriesGen;
 runGpSeriesGen = function*(cfg){
   const result = yield* _origRunGpSeriesGen(cfg);
   try{ gpFinaleFlavor(result, cfg); }catch(_){}
   return result;
 };
})();
