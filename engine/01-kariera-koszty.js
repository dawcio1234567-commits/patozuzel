/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: KARIERA KOSZTY
   Wiek emerytalny, dziennik OVR, koszty życia, alimenty
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 25-131 oryginału).
   ============================================================ */
/* ============================================================
   WIEK EMERYTALNY — LICZONY, NIE WPISANY NA SZTYWNO
   Wcześniej kariera kończyła się zawsze na 40. urodzinach, niezależnie
   od tego, czy zawodnik był zawodowcem z fizjoterapeutą, czy człowiekiem,
   który regenerację rozumie jako drugie piwo. Teraz granicę wyznaczają
   PROFESJONALIZM (główny czynnik) i OVR (talent, za który klub jeszcze płaci).
   Progi siedzą w RETIRE w data.js.
   ============================================================ */
/* ============================================================
   DZIENNIK ZMIAN OVR
   ------------------------------------------------------------
   Zgłoszenie gracza: „sprawdź, czy zdarzenia dodające OVR faktycznie dodają
   OVR, bo nie widać tego w kontroli wykonania" — i osobno: „dodaj rozwijaną
   listę, co wpłynęło na spadek/wzrost OVR". Zdarzenia OVR dodawały (fxO
   zmienia G.p.ovr od razu), ale nigdzie tego nie było widać, więc wyglądało
   to na błąd. Od teraz KAŻDA zmiana OVR w sezonie przechodzi przez ten
   dziennik i ląduje w raporcie.
   ============================================================ */
function logOvr(delta, why){
 if(!delta) return;
 if(!G || !G.S) return;
 if(!G.S.ovrLog) G.S.ovrLog=[];
 G.S.ovrLog.push({d:Math.round(delta*100)/100, w:why});
}
function retireAgeOf(p){
 if(!p) return RETIRE.max;
 const prof=cl(p.prof||0,0,99), ovr=cl(p.ovr||1,1,99);
 let a = RETIRE.base + (prof/99)*RETIRE.profSpan;
 const t = (ovr-RETIRE.ovrRef)/(99-RETIRE.ovrRef);        // >0 = talent ponad przeciętną
 a += t>=0 ? cl(t,0,1)*RETIRE.ovrSpan : cl(t,-1,0)*(-RETIRE.ovrFloor);
 return cl(Math.round(a), RETIRE.min, RETIRE.max);
}
/* Czy TEN rok jest ostatnim? Zwraca powód (string) albo null.
   Tuż pod wyliczoną granicą wchodzi loteria — im gorszy profesjonalizm,
   tym większa szansa, że ciało wysiądzie rok czy dwa wcześniej. */
function retireCheck(p){
 const lim=retireAgeOf(p);
 if(p.age>=lim)
   return 'Wiek. Przy profesjonalizmie '+p.prof+' i OVR '+p.ovr+' twoje ciało kończy karierę w wieku '+lim+' lat.';
 if(p.age>=Math.max(lim-RETIRE.wobbleFrom, RETIRE.wobbleMin||30) &&
    chance(RETIRE.wobbleP*(1-cl(p.prof,0,99)/99)))
   return 'Ciało odmówiło wcześniej, niż wynikało z papierów (granica: '+lim+' lat). Przy takim profesjonalizmie regeneracja to loteria.';
 return null;
}
/* Młody nie dostaje stawki seniora, choćby miał ją wpisaną w umowie. */
function youngRateMul(p){ return ECON.youngRate[p.age] || 1; }
/* ---------- EKONOMIA MŁODZIEŻOWCA: KOSZTY TEŻ MUSZĄ BYĆ MŁODZIEŻOWE ----------
   Zgłoszony problem: junior na kontrakcie ZAWODOWYM kończył sezon głęboko na
   minusie NIEZALEŻNIE od tego, jak dobrze jeździł. Powód: youngRateMul() tnie
   mu WYNAGRODZENIE nawet do 40% stawki (16 lat), ale koszty życia i serwis
   posezonowy liczyły się po pełnej, dorosłej stawce — 16-latek z kontraktem
   zawodowym płacił dokładnie tyle samo za mieszkanie i serwis silnika, co
   30-letni senior, zarabiając przy tym ułamek jego pensji. Amator miał
   osobną, płaską zniżkę (ECON.liveAmat), ale zawodowy junior — żaden.
   youngCostMul() skaluje koszty tym samym mechanizmem wieku: przy 16 latach
   (youngRateMul 0.40) koszty spadają do ok. 70%, przy 23 latach (0.96) różnica
   jest już kosmetyczna (ok. 98%) — od 24. roku życia znika całkowicie. */
function youngCostMul(p){
 if(!p || (p.age||18)>23) return 1;
 return cl(0.50 + 0.50*youngRateMul(p), 0.5, 1);
}
function livingCostOf(p, idle){
 const lk = (p.lk && ECON.liveLeague[p.lk]) ? p.lk : 'KL';
 let c = (ECON.liveBase + Math.max(0,(p.age||18)-18)*ECON.liveAge) * ECON.liveLeague[lk];
 if(idle) c *= ECON.liveIdle;
 /* Amator też jest młodzieżowcem: stara wersja dawała WSZYSTKIM amatorom tę
    samą płaską zniżkę (0.50), więc 16-latek mieszkający u rodziców kosztował
    tyle samo, co 21-letni amator na swoim. Teraz zniżka amatorska i zniżka
    wiekowa MNOŻĄ się — najmłodsi żyją najtaniej, próg znika przy 24 latach. */
 else if(p.contract && p.contract.type==='Amatorski') c *= ECON.liveAmat*youngCostMul(p);
 else c *= youngCostMul(p);         // zawodowy junior — koszty życia też młodzieżowe
 return Math.round(c);
}

/* ============================================================
   ALIMENTY DO ARGENTYNY — 45 000 ZŁ CO SEZON
   Jedno miejsce dla całej gry: wołane z resolveSeason() (po rozegranym
   sezonie), ale też ze skipYear() i mechanicPath() — sąd nie robi przerwy
   tylko dlatego, że nie miałeś kontraktu. Zwraca null albo {amount, left}.
   ============================================================ */
function chargeAlimony(p){
 p = p || (typeof G!=='undefined' && G ? G.p : null);
 if(!p || !(p.alimony>0)) return null;
 const amount = ECON.alimony;
 p.budget -= amount;
 p.alimony = Math.max(0, p.alimony-1);
 p.career.alimony = (p.career.alimony||0) + amount;
 return {amount, left:p.alimony};
}
 
/* ---------- KLUB, KTÓRY CIĘ KUSI (event „KUSZENIE PRZEZ INNY KLUB") ----------
   Wybór jest stabilny w obrębie sezonu: opis eventu i jego skutek muszą
   mówić o TYM SAMYM klubie. */
function temptClub(){
 try{
  const p=(typeof G!=='undefined'&&G)?G.p:null; if(!p) return null;
  const c=clubOf(p); if(!c) return null;
  const pool=allClubs().filter(x=>x.name!==c.name && !x.bankrupt && x.ovr>=c.ovr+3 && (x.budget||0)>200000);
  if(!pool.length) return null;
  if(G.S && G.S.temptClub){ const f=pool.find(x=>x.name===G.S.temptClub); if(f) return f; }
  const sorted=pool.sort((a,b)=>b.ovr-a.ovr);
  const hit=sorted[R(0,Math.min(3,sorted.length-1))];
  if(G.S) G.S.temptClub=hit.name;
  return hit;
 }catch(_){ return null; }
}
