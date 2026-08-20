/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   engine.js — rdzeń symulacji: utilsy, generowanie gry/zawodnika,
   rozstrzyganie sezonu, mecze ligowe, ekonomia klubów, spadki/awanse,
   zawody indywidualne (IMP/MIMP/Kaski) oraz DMPJ.
   Wymaga wcześniejszego wczytania data.js.
   ============================================================ */
 
/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   Mechanika "Copero": jedno kliknięcie = jeden pełny sezon.
   ============================================================ */
 
/* ---------- UTIL ---------- */
const R  = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const RF = (a,b)=>Math.random()*(b-a)+a;
const cl = (v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;
function gauss(m,s){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const zl = n => Math.round(n).toLocaleString('pl-PL')+' zł';
const esc= s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=R(0,i);[b[i],b[j]]=[b[j],b[i]];}return b;};
 
/* ============================================================
   WIEK EMERYTALNY — LICZONY, NIE WPISANY NA SZTYWNO
   Wcześniej kariera kończyła się zawsze na 40. urodzinach, niezależnie
   od tego, czy zawodnik był zawodowcem z fizjoterapeutą, czy człowiekiem,
   który regenerację rozumie jako drugie piwo. Teraz granicę wyznaczają
   PROFESJONALIZM (główny czynnik) i OVR (talent, za który klub jeszcze płaci).
   Progi siedzą w RETIRE w data.js.
   ============================================================ */
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
 
/* ============================================================
   ANTY-KLON: OVR W OBRĘBIE JEDNEJ DRUŻYNY MUSI SIĘ RÓŻNIĆ
   Skąd brały się identyczne OVR? Z trzech miejsc naraz:
     · pięciu zawodników pierwszej piątki losowano z JEDNEGO rozkładu
       gauss(L-1, 4.2), a wynik obcinano do 99 — w klubie o OVR 93-95
       kilku z nich lądowało dokładnie na suficie,
     · genAllSquads() dostrajało kadrę, dodając WSZYSTKIM tę samą liczbę,
     · applySquadOvr() i korekta driftu w ageRiders() robiły to samo po sezonie.
   Zaokrąglenie do liczby całkowitej dokańczało dzieła. Ten przebieg
   rozsuwa kolizje o 1 pkt (najpierw w dół, potem w górę), zachowując
   kolejność siły w drużynie. Gracza (r.me) nigdy nie ruszamy.
   ============================================================ */
function dedupeSquadOvr(name){
 const all=squadOf(name);
 if(all.length<2) return;
 const taken=new Set(all.filter(r=>r.me).map(r=>cl(Math.round(r.ovr),1,99)));
 all.filter(r=>!r.me).sort((a,b)=>b.ovr-a.ovr).forEach(r=>{
   let v=cl(Math.round(r.ovr),1,99);
   if(!taken.has(v)){ taken.add(v); r.ovr=v; return; }
   let nv=null;
   for(let d=1; d<=14 && nv===null; d++){
     if(v-d>=1  && !taken.has(v-d)) nv=v-d;
     else if(v+d<=99 && !taken.has(v+d)) nv=v+d;
   }
   r.ovr = nv===null ? v : nv;
   taken.add(r.ovr);
 });
}
function dedupeAllSquads(){ allClubs().forEach(c=>{ dedupeSquadOvr(c.name); }); }
 
/* ============================================================
   BALANS SILNIKA — SKALA 1:1
   OVR zawodnika i OVR klubu leżą na tej samej skali. Klub 95 to klub,
   w którym pierwsza piątka kręci się w okolicach 95. Punktem odniesienia
   w każdym biegu jest średnia liga/klub — kto jest pod nią, dostaje
   po łapach mocniej, niż wynikałoby to z samej różnicy OVR.
   ============================================================ */
/* Efektywna siła w biegu: ostra kara za bycie poniżej średniej. */
function rideStr(ovr, ref, extra){
 let d = ovr - ref;
 if(d<0){
   // pierwsze punkty poniżej średniej bolą najbardziej, dalej kara robi się liniowa
   const a=Math.min(-d, BAL.knee), b=Math.max(0,-d-BAL.knee);
   d = -(a*BAL.belowPen + b*BAL.farPen);
 } else d = d*BAL.abovePow;
 return ref + d + (extra||0) + gauss(0,BAL.sigma);
}
function leagueOfClub(name){ return LKEYS.find(k=>G.leagues[k].clubs.some(c=>c.name===name)) || 'KL'; }
function clubByName(name){ for(const k of LKEYS){const c=G.leagues[k].clubs.find(x=>x.name===name); if(c) return c;} return null; }
/* Klub, który NIE wywalczył awansu do fazy play-off (miejsca 1-4 rundy
   zasadniczej). Używane przez TURNIEJE SZKOLENIOWE (simIndividual) — start
   mają tam wyłącznie juniorzy klubów spoza czołowej czwórki, zgodnie
   z regulaminem ("kluby, które nie uzyskały prawa awansu"). Bez klubu albo
   bez jeszcze policzonej tabeli traktujemy to permisywnie jako "nie awansował". */
function clubMissedPlayoffs(name){
 if(!name) return true;
 const lk=leagueOfClub(name), tab=G.tables[lk];
 if(!tab || !tab.length) return true;
 const pos=tab.findIndex(x=>x.name===name)+1;
 return pos<=0 || pos>4;
}
/* Punkt odniesienia dla zawodnika danego klubu: średnia ligi + poziom klubu. */
function refFor(clubName){
 const k=leagueOfClub(clubName), c=clubByName(clubName);
 const lg=leagueAvgOvr(k);
 return lg*BAL.leagueW + (c?c.ovr:lg)*(1-BAL.leagueW) - BAL.refDrop;
}
 
/* ---------- KLASY POSTACI ---------- */
 
 
/* ---------- STAN GRY ---------- */
let G=null;
function newGame(){
 return {
  screen:'create', year:2026,
  leagues:BASE_LEAGUES(),
  tables:{}, results:{}, playoff:null, promo:[], bankrupts:[], greenTable:[],
  p:null, last:null, history:[], log:[], ev:null, S:null,
  phase:{}, riders:[], recIMP:[], recMIMP:null, meForm:0,
  /* --- SPONSORZY TYTULARNI ---
     bannedSponsors: firmy z Grupy B, które już raz uciekły z kasą — znikają z gry na zawsze.
     sponsorRenames: zmiany nazw klubów czekające na wejście w nowym roku (do raportu w UI). */
  bannedSponsors:[], sponsorRenames:[], renamed:{},
  /* --- ZDARZENIE MIĘDZYSEZONOWE (przerwa zimowa) --- */
  wev:null, wevLog:[], wevTitle:null, wevChoice:null, wevAfter:'hub',
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
  // RUBRYKA BUDŻETOWA OSTATNIEJ DECYZJI — patrz chooseEv()/applyWinterChoice().
  lastDecisionBudgetDelta:0, lastDecisionLabel:'',
  shop:{bought:[],log:[],spent:0,equipGain:0,mechHired:false},
  next:{zeroMatches:false, heatPP:0, betterOffers:false, noRenew:false, rowPen:false, noArg:false,
        noUK:false,
        injuryPP:0, rateMul:1, noSponsor:false, lockTransfer:0, forceClub:null, atmBonus:0,
        tribunalCase:null},
  career:{seasons:0,matches:0,heats:0,pts:0,bon:0,def:0,exc:0,earned:0,titles:0,best:'—',bestAvg:0,
          living:0, service:0, renewals:0}
 };
}
 
/* ============================================================
   1. SZANSA NA WYSTĘP — PARASOL MŁODZIEŻOWY
   ============================================================ */
// SKALA 1:1 — OVR klubu to poziom, wokół którego kręci się jego pierwsza piątka.
const riderLevel = club => club.ovr;
 
/* --- EFEKTYWNY OVR ---
   To, co widzi trener i tor: umiejętności PLUS sprzęt (i atmosfera w klubie).
   Zawodnik 60 na złomie jest realnie słabszy od zawodnika 55 z czterema silnikami.
   Jedno miejsce dla całej gry, żeby szacowana szansa na skład liczyła dokładnie
   to samo, co potem liczy sezon. */
function equipEffOf(p, equipFit){
 return p.equip * (0.55 + 0.45*(cl(equipFit==null?100:equipFit,0,100)/100));
}
function effectiveOvr(p, equipFit, atmAdd){
 return cl(p.ovr + (atmAdd||0) + (equipEffOf(p,equipFit)/99 - 0.45)*16, 1, 99);
}
 
/* --- SZANSA NA WYSTĘP ---
   Nie ma abstrakcyjnego procentu: 140 razy układamy realny skład tego klubu
   i liczymy, ile razy trener wpisał CIEBIE do siódemki.
   Kluczowe: losujemy DYSPOZYCJĘ całej kadry (i twoją). W sezonie o numerach
   decyduje forma, a nie sam OVR — szacunek, który zakłada zerową formę
   wszystkich, obiecywałby 95% komuś, kto realnie wypada ze składu po dwóch
   słabych meczach. Liczymy też twój OVR razem ze sprzętem. */
const FORM_SIGMA = 4.6;                       // typowy rozrzut formy w trakcie sezonu
function appearanceChance(p,club,atm,S){
 const sq=squadOf(club.name).filter(r=>!r.inj && !r.me);
 if(!sq.length) return isJun(p)?85:60;
 const bias = p.loyalty*0.10 + ((atm||55)-50)*0.03 + ((S&&S.heatPP)||0)*0.20;
 const myOvr = effectiveOvr(p, 100, 0);
 const draw  = s => cl(gauss(0,s), -12, 12);
 let hit=0; const N=140;
 for(let t=0;t<N;t++){
   const pool=sq.map(r=>({...r, form:draw(FORM_SIGMA)}));
   // twoja forma buja się mniej: zawodnik poza składem nie ma jak jej wyrobić,
   // bo dyspozycja aktualizuje się dopiero po starcie
   pool.push({id:-1, ovr:myOvr, age:p.age, form:draw(FORM_SIGMA*0.72)});
   const L=lineupFrom(pool, 0.8, {id:-1, v:bias});
   if(L && Object.values(L).some(r=>r&&r.id===-1)) hit++;
 }
 return cl(Math.round(100*hit/N),1,99);
}
 
 
/* --- SZANSA NA SKŁAD W KONKRETNEJ KOLEJCE ---
   appearanceChance() (wyżej) liczy szansę "na zimno": zakłada, że cała kadra
   wjeżdża w sezon z zerową dyspozycją. To dobre na ekran ofert, ale bezużyteczne
   w trakcie sezonu, gdzie o numerach decyduje BIEŻĄCA forma — twoja i kolegów.
   Ta funkcja bierze realny stan kadry na dziś i dokłada tylko tyle losowości,
   ile ma sam trener przy układaniu składu. Dzięki temu liczba pokazywana przy
   każdej kolejce faktycznie się zmienia: po dwóch dobrych meczach rośnie,
   po dwóch słabych spada. */
function appearanceChanceNow(clubName, meR, bias, N){
 if(!clubName || !meR) return null;
 const sq=squadOf(clubName).filter(r=>!r.inj && !r.strike && !r.out && !r.me);
 if(!sq.length) return 99;
 N = N || 48;
 const jitter = (f,s) => cl((f||0)*0.65 + cl(gauss(0,s),-12,12), -12, 12);
 let hit=0;
 for(let t=0;t<N;t++){
   const pool=sq.map(r=>({...r, form:jitter(r.form, FORM_SIGMA*0.80)}));
   pool.push({...meR, form:jitter(meR.form, FORM_SIGMA*0.62)});
   const L=lineupFrom(pool, 0.8, bias);
   if(L && Object.values(L).some(r=>r&&r.id===meR.id)) hit++;
 }
 return cl(Math.round(100*hit/N),1,99);
}

/* ============================================================
   NIEOCZEKIWANE ZDARZENIA — RZUT KOŚCIĄ PRZED KAŻDĄ KOLEJKĄ
   Progi w SURPRISE (data.js): pięć typów po 1%, łącznie 5% na kolejkę.
   Zwraca opis tego, co się stało, i ustawia flagi na TĘ JEDNĄ kolejkę.
   ============================================================ */
function surpriseScale(){
 const S=SURPRISE, sum=S.halfSquad+S.jumpIn+S.formUp+S.formDown+S.dropOut;
 const cap=S.total||sum;
 return sum>cap ? cap/sum : 1;                 // nikt nie przekroczy sufitu, choćby ustawił 9%
}
function rollRoundSurprise(rd, clubName, meR){
 const S=SURPRISE, k=surpriseScale();
 const out={round:rd+1, forceIn:false, forceOut:null, hidden:[], log:null, kind:null};
 if(!clubName || !meR) return null;
 /* Kolejność ma znaczenie: jeden typ na kolejkę, żeby suma szans naprawdę
    wynosiła 5%, a nie 5% razy pięć. */
 if(chance(S.halfSquad*k)){
   const sq=squadOf(clubName).filter(r=>!r.me && !r.inj && !r.strike);
   const n=Math.min(sq.length, Math.max(1, Math.round(sq.length*(S.halfShare||0.5))));
   out.hidden=shuffle(sq).slice(0,n);
   out.hidden.forEach(r=>{ r.inj=1; });
   out.forceIn=true; out.kind='halfSquad';
   out.log='Kolejka '+(rd+1)+': POŁOWA SKŁADU KONTUZJOWANA ('+n+' zawodników poza torem — kraksa na treningu, grypa i dwie kontuzje z poprzedniego meczu). Trener nie ma z kogo układać siódemki — wskakujesz do składu.';
   return out;
 }
 if(chance(S.jumpIn*k)){
   out.forceIn=true; out.kind='jumpIn';
   out.log='Kolejka '+(rd+1)+': WSKOCZYŁEŚ DO SKŁADU. Ktoś nie dojechał, komuś zabrali licencję na tydzień, ktoś inny pokłócił się z prezesem. Telefon o 22:00, rano pakujesz bus.';
   return out;
 }
 if(chance(S.formUp*k)){
   const d=R(S.formUpMin, S.formUpMax);
   meR.form = cl((meR.form||0)+d, -12, 12);
   out.forceIn=true; out.kind='formUp';
   out.log='Kolejka '+(rd+1)+': NAGŁY WZROST FORMY (+'+d+' pkt dyspozycji). Silnik nagle chodzi, tor nagle pasuje, taśma nagle puszcza w dobrym momencie — trener wpisuje cię do składu.';
   return out;
 }
 if(chance(S.formDown*k)){
   const d=R(S.formDownMin, S.formDownMax);
   meR.form = cl((meR.form||0)-d, -12, 12);
   out.kind='formDown';
   out.log='Kolejka '+(rd+1)+': NAGŁY ZJAZD FORMY (-'+d+' pkt dyspozycji). Nic się nie zmieniło w sprzęcie ani w głowie, a jedziesz o pół sekundy wolniej. Skład układa się bez ciebie.';
   return out;
 }
 if(chance(S.dropOut*k)){
   out.forceOut='NIEOCZEKIWANIE POZA SKŁADEM'; out.kind='dropOut';
   out.log='Kolejka '+(rd+1)+': NAGLE WYPADASZ ZE SKŁADU. Bez powodu, bez rozmowy, bez uzasadnienia — dowiedziałeś się z komunikatu na stronie klubu.';
   return out;
 }
 return null;
}

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
  prof0:p.prof, med0:p.med, ovr0:p.ovr, equip0:p.equip
 };
 G.S.matches = G.S.round-1;
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
 
/* ============================================================
   4. ROZSTRZYGNIĘCIE SEZONU — ŻELAZNA MATEMATYKA
   ============================================================ */
/* Jedna linia startowa zawodnika w jednym spotkaniu (3-5 wyjazdów). */
function riderLine(ctx){
 const h=cl(Math.round(gauss(ctx.heatBase,0.55)), ctx.fixed||3, ctx.fixed||5);
 const codes=[]; let mp=0,mb=0,d=0,w=0;
 for(let k=0;k<h;k++){
   const rr=Math.random();
   if(rr<ctx.defP){d++;codes.push('d');continue;}
   if(rr<ctx.defP+ctx.excP){w++;codes.push('w');continue;}
   const v=cl(Math.round(ctx.ppr+gauss(0,0.95)),0,3); mp+=v;
   if((v===1||v===2) && chance(30)){mb++;codes.push(v+'*');}
   else codes.push(String(v));
 }
 return {h,codes,mp,mb,d,w};
}
function getClub(p){return G.leagues[p.lk].clubs.find(c=>c.name===p.club);}
/* BEZPIECZNY DOSTĘP DO KLUBU — zawodnik bez kontraktu ma po prostu null.
   Używany przez warunki i efekty zdarzeń losowych (data.js), żeby event
   o długach klubu nie wysypywał gry bezrobotnemu żużlowcowi. */
function clubOf(p){
 p = p || (typeof G!=='undefined' && G ? G.p : null);
 if(!p || !p.club || !p.lk || !G || !G.leagues || !G.leagues[p.lk]) return null;
 return G.leagues[p.lk].clubs.find(c=>c.name===p.club) || null;
}
function leagueAvgOvr(lk){const cs=G.leagues[lk].clubs;return cs.reduce((a,c)=>a+c.ovr,0)/cs.length;}
 
function resolveSeason(){
 const p=G.p, S=G.S, club=getClub(p), lk=p.lk;
 const notes=[];
 
 /* --- atmosfera w klubie (na skali 1:1 liczona w PUNKTACH OVR, nie w procentach) --- */
 let atmAdd=0; let atmTxt='przeciętna';
 if(S.atm<30){atmAdd=-5;atmTxt='fatalna';notes.push('Atmosfera w klubie fatalna ('+S.atm+'/100) — efektywny OVR spada o 5 pkt.');}
 else if(S.atm>80){atmAdd=5;atmTxt='rewelacyjna';notes.push('Atmosfera w klubie rewelacyjna ('+S.atm+'/100) — efektywny OVR rośnie o 5 pkt.');}
 
 /* --- SPRZĘT / MECHANIK --- */
 const equipEff = equipEffOf(p, S.equipFit);
 const equipAdd = (equipEff/99 - 0.45)*16;                 // ok. -7 .. +9 pkt OVR
 /* S.ovrBonus — chwilowa forma z decyzji na ekranie zdarzenia (schabowy u żony,
    jazda na zastrzykach). Działa TYLKO w tym sezonie i nie rusza p.ovr. */
 let effOvr = effectiveOvr(p, S.equipFit, atmAdd + (S.ovrBonus||0));
 if(S.ovrBonus) notes.push('Skutek decyzji z ekranu zdarzenia: '+(S.ovrBonus>0?'+':'')+S.ovrBonus+' OVR w meczach tego sezonu.');
 /* S.teamOvr — decyzje, które ruszyły poziom całej drużyny (zrzeczenie się premii,
    integracja przez nienawiść, wychowanie następcy). */
 if(S.teamOvr){
   club.ovr = cl(Math.round(club.ovr + S.teamOvr), 20, 99);
   notes.push('Twoja decyzja odbiła się na drużynie: OVR klubu '+(S.teamOvr>0?'+':'')+S.teamOvr+' (teraz '+club.ovr+').');
 }
 
 /* --- OBECNOŚĆ W SKŁADZIE ---
    Nie ma abstrakcyjnej "szansy na mecz": przed każdą kolejką walczysz
    o konkretny numer startowy z konkretnymi ludźmi z kadry. --- */
 const meR=G.riders.find(r=>r.me);
 meR.club=club.name; meR.age=p.age; meR.name=p.name;
 meR.inj=0; meR.out=false; meR.strike=false; meR.form=0; meR.sea=blankSea();
 const bias = {id:meR.id, club:club.name, v: p.loyalty*0.10 + (S.atm-50)*0.03 + S.heatPP*0.20};
 meR.ovr = cl(Math.round(effOvr),1,99);
 
 /* --- PRAWDOPODOBIEŃSTWA (sprzęt, mechanik, profesjonalizm) --- */
 let defP = cl(0.010 + (1-equipEff/99)*0.055 + (1-p.mech/99)*0.040 + S.extraDefP, 0.004, 0.30);
 let excP = cl(0.006 + (1-p.prof/99)*0.048, 0.003, 0.12);
 
 /* --- KALENDARZ NIEDOSPOZYCYJNOŚCI (rozstrzygany kolejka po kolejce) --- */
 S.banLeft   = S.banMatches;
 S.injLeft   = 0; S.injDone=false; S.injTotal=0; S.injDmg=0;
 S.forcedFrom= R(6,10);
 /* W której kolejce wypada walkower. Uwaga: to spotkanie NIE zostanie rozegrane
    (simSeasonChrono wstawia sztywny wynik), więc losujemy je raz i na sztywno. */
 S.walkRound = S.walkower ? R(0,BAL.rounds-1) : -1;
 S.walkMode  = S.walkMode || 'lose';
 S.striking  = false; S.strikeRounds=0; S.strikeLog=[]; S.payLog=[];
 S.owed=0; S.paid=0; S.roundLog=[];
 /* --- RYZYKO KONTUZJI ---
    Stary wzór (6 + brak profesjonalizmu × 0,10) dawał ok. 11% na sezon,
    czyli jeden uraz na dziewięć lat kariery — w żużlu to fikcja.
    Teraz liczy się profesjonalizm, wiek i stan sprzętu, a progi siedzą
    w INJ w data.js. Prawdopodobieństwo sezonowe rozbijamy na kolejki. */
 const injuryP = cl(INJ.base
   + (100-p.prof)*INJ.profW
   + Math.max(0, p.age-INJ.ageFrom)*INJ.ageW
   + (1-cl(p.equip,1,99)/99)*INJ.equipW
   + S.injuryPP, 2, 95);
 S.injuryP = Math.round(injuryP);
 S.injPerRound = (1-Math.pow(1-injuryP/100, 1/BAL.rounds))*100;
 if(S.zeroMatches) notes.push('Efekt decyzji z poprzedniego sezonu: 0 meczów.');
 if(S.forcedEnd)   notes.push('Sezon urwany przez decyzję pozaboiskową (od '+(S.forcedFrom+1)+'. kolejki).');
 if(S.banMatches>0)notes.push('Zawieszenie: -'+S.banMatches+' spotkań.');
 if(S.longInjury)  notes.push('KONTUZJA DŁUGOTERMINOWA Z POPRZEDNIEGO SEZONU'+
   (S.longInjuryWhy?' ('+S.longInjuryWhy+')':'')+' — cały ten rok poza torem. 0 meczów, 0 biegów, zero rozwoju.');
 if(S.walkower)    notes.push('WALKOWER w '+(S.walkRound+1)+'. kolejce — spotkanie nie zostało rozegrane ('+
   ({lose:'0:75 dla rywala', win:'75:0 dla was', both:'obustronny, 0:0', void:'wynik anulowany'}[S.walkMode]||'0:75')+').');
 
 const ctx={defP, excP, meId:meR.id, bias};
 
 /* --- SYMULACJA SEZONU: KOLEJKA PO KOLEJCE, MECZ PO MECZU --- */
 simSeasonChrono(ctx, lk, club.name, S.teamPts);
 meR.out=false;
 
 if(S.injDone) notes.push((S.injCat?'KONTUZJA WYKLUCZAJĄCA NA ROK':S.injBad?'POWAŻNA KONTUZJA':'KONTUZJA')+
   ' w '+(S.injRound||'trakcie sezonu')+'. kolejce. '+
   'Pauza '+S.injTotal+' spotkań, -'+S.injDmg+' OVR.'+
   (S.injCat?' '+(S.injCatWhy||'Zerwane więzadła.')+' KOLEJNY SEZON MASZ Z GŁOWY — operacja i rehabilitacja.'
            :S.injBad?' Obojczyk, szpital, sezon praktycznie zamknięty.':''));
 /* Uraz katastrofalny z EKRANU ZDARZENIA (fxLongInj) — osobny komunikat. */
 if(S.longInjuryNew) notes.push('ZERWANE WIĘZADŁA / ZŁAMANE UDO: '+S.longInjuryNew+
   ' (-'+(S.longInjuryDmg||0)+' OVR). CAŁY KOLEJNY SEZON POZA TOREM.');
 notes.push('Ryzyko kontuzji w tym sezonie wynosiło '+(S.injuryP||0)+'% (profesjonalizm '+S.prof0+', wiek '+p.age+', sprzęt '+S.equip0+').');
 S.strikeLog.forEach(x=>notes.push(x.back
   ? 'Klub uregulował zaległości — od '+x.round+'. kolejki wracasz do składu.'
   : 'Kolejka '+x.round+': zaległości '+zl(x.debt)+' — odmawiasz wyjazdu na tor (ryzyko buntu '+x.ch+'%).'));
 
 const tab=G.tables[lk];
 const myRow=tab.find(r=>r.name===club.name);
 const posReg=tab.indexOf(myRow)+1;
 
 /* --- TWOJE LINIE MECZOWE (chronologicznie) --- */
 let heats=0, defects=0, exclusions=0, pts=0, bonus=0, replaced=0, matches=0;
 const lines=G.myLog.map(L=>{
   const base={round:L.round, home:L.home, opp:L.opp, teamFor:L.teamFor, teamAgn:L.teamAgn,
               paid:L.paid||0, owed:L.owed||0, debt:L.debt||0, walk:L.walk||null,
               chance:(L.chance==null?null:L.chance), sur:L.sur||null};
   if(!L.rode || !L.me) return {...base, rode:false, why:L.why||'ŁAWKA / POZA SKŁADEM', gap:L.gap, reg:L.reg};
   const M=L.me;
   matches++; heats+=M.starts; pts+=M.pts; bonus+=M.bon;
   M.codes.forEach(c=>{ if(c==='d')defects++; else if(c==='w')exclusions++; else if(c==='-')replaced++; });
   return {...base, rode:true, mp:M.pts, mb:M.bon, codes:M.codes, num:M.num};
 });
 const strike = S.strikeRounds>0;
 if(strike) notes.push('Bunt płacowy: opuściłeś '+S.strikeRounds+' kolejek przez zaległości klubu.');
 /* --- SZANSA NA SKŁAD: JAK SIĘ ZMIENIAŁA W CIĄGU SEZONU --- */
 const chances = lines.map(L=>L.chance).filter(v=>v!=null && v>0);
 if(chances.length){
   const avgCh = Math.round(chances.reduce((a,b)=>a+b,0)/chances.length);
   notes.push('Szansa na skład liczona przed każdą kolejką (z realnej dyspozycji całej kadry): '+
     'średnio '+avgCh+'%, najniżej '+Math.min(...chances)+'%, najwyżej '+Math.max(...chances)+'%. '+
     'To ona, a nie sam OVR, decydowała o tym, czy pakujesz bus.');
 }
 /* --- NIEOCZEKIWANE ZDARZENIA (5% na kolejkę, po 1% na typ) --- */
 (S.surprises||[]).forEach(s=>{ if(s && s.log) notes.push('NIEOCZEKIWANE ZDARZENIE — '+s.log); });
 if(S.saveIn>0) notes.push('Nieoczekiwane zdarzenie: wskoczyłeś do składu na mecze ligowe, bo klub miał problemy finansowe i oszczędzał na gwiazdach.');
 /* Ile razy trener zostawił cię poza siódemką i jak blisko było — bez tej liczby
    ławka wygląda jak kaprys, a jest arytmetyką: OVR plus bieżąca forma. */
 const benched=lines.filter(L=>!L.rode && L.gap!=null);
 if(benched.length){
   const gaps=benched.map(L=>L.gap);
   const avgGap=gaps.reduce((a,b)=>a+b,0)/gaps.length;
   const close=gaps.filter(g=>g<=3).length;
   notes.push('Poza składem w '+benched.length+(benched.length===1?' kolejce':' kolejkach')+
     ' — do ostatniego numeru brakowało ci średnio '+
     avgGap.toFixed(1)+' pkt dyspozycji (OVR + forma)'+
     (close?', w tym '+close+' × mniej niż 3 pkt':'')+'.');
 }
 const regOut=lines.filter(L=>!L.rode && L.reg).length;
 if(regOut) notes.push('W '+regOut+(regOut===1?' kolejce':' kolejkach')+
   ' miałeś lepszą dyspozycję niż ktoś z piątki, ale wypchnęła cię rubryka regulaminowa: '+
   'wśród numerów 1-5 musi jechać zawodnik U24, a jego miejsca nie da się zająć lepszą formą.');
 
 /* --- FAZA PLAY-OFF / PLAY-DOWN WE WSZYSTKICH LIGACH --- */
 G.phase={};
 const canRidePO = matches>0 && !S.striking && p.banSeasons===0 && !S.forcedEnd && !S.zeroMatches && !S.longInjury;
 LKEYS.forEach(k=>runPhase(k, k===lk&&canRidePO?ctx:null, k===lk?club.name:null));
 const order=G.phase[lk].order;
 const pos=order.indexOf(club.name)+1;
 
 /* --- TWÓJ DOROBEK W FAZIE PLAY-OFF (liczony osobno) --- */
 /* po.codes — komplet kodów z dwumeczów play-off. Bez tego karta kariery
    liczyła miejsca w biegach (I/II/III/IV) wyłącznie z rundy zasadniczej,
    a kafelki BIEGI/MECZE brały już ligę RAZEM z play-offem — stąd tabela,
    która nie sumowała się do własnego podsumowania. */
 const po={m:0,h:0,p:0,b:0,d:0,w:0,rep:0,codes:[]};
 G.phase[lk].ties.forEach(t=>t.legs.forEach(L=>{ if(!L.me)return;
   po.m++; po.h+=L.me.starts; po.p+=L.me.pts; po.b+=L.me.bon;
   L.me.codes.forEach(c=>{ po.codes.push(c);
     if(c==='d')po.d++;else if(c==='w')po.w++;else if(c==='-')po.rep++;}); }));
 po.avg = po.h>0 ? po.p/po.h : 0;
 po.avgTxt = po.h>0 ? po.avg.toFixed(2) : '—';
 
 /* --- DMPJ: jedziesz WYŁĄCZNIE do 21. roku życia (twardy warunek) --- */
 const injured=S.injDone, injMissed=S.injTotal;
 const blocked = p.banSeasons>0 || S.zeroMatches || S.longInjury || matches===0;
 const dmpjOk = isJun(p) && !blocked;
 // OCHRONA SPRZĘTU: junior z OVR > 50, który regularnie jeździ w lidze, nie dostaje
 // powołania na eliminacje i ćwierćfinały DMPJ. Dołącza dopiero od półfinału.
 const dmpjSkipEarly = dmpjOk && p.ovr>50 && matches>=Math.ceil(BAL.rounds*0.5);
 const dmpj = simDMPJ(effOvr, defP, excP, club.name, dmpjOk, dmpjSkipEarly);
 if(dmpjSkipEarly) notes.push('DMPJ: trener nie zgłosił cię na eliminacje i ćwierćfinały — jeździsz w lidze, sprzęt zostaje w busie. Wchodzisz od półfinału.');
 if(dmpj.eligible){
   const mypos=dmpj.classification.indexOf(club.name);
   if(mypos===0){notes.push('DRUŻYNOWE MISTRZOSTWO POLSKI JUNIORÓW dla '+club.name+'!');p.career.dmpjTitles=(p.career.dmpjTitles||0)+1;}
   else if(mypos>0) notes.push('DMPJ: '+(mypos+1)+'. miejsce w finale.');
   else notes.push('DMPJ: odpadłeś na etapie — '+dmpj.reached.toLowerCase()+'.');
   p.career.dmpjPts=(p.career.dmpjPts||0)+dmpj.me.pts;
   p.career.dmpjStarts=(p.career.dmpjStarts||0)+dmpj.me.starts;
 }
 
 /* --- BIEGI UKOŃCZONE / KONTROLA --- */
 const completed = Math.max(0, heats - defects - exclusions);
 pts = cl(pts, 0, completed*3);
 
 /* --- ŚREDNIA BIEGOPUNKTOWA (LIGA) = PKT / BIEGI --- */
 const avg = heats>0 ? pts/heats : 0;
 const avgTxt = heats>0 ? avg.toFixed(2) : '—';
 
 /* --- ZAWODY INDYWIDUALNE --- */
 G.meForm = cl((avg-1.4)*9, -12, 12);
 /* Forma zapisana na zawodniku — czytają ją warunki zdarzeń (cond: p.form<0),
    dzięki czemu „kłótnia z fanem po passie słabych meczów” trafia tylko w dołku. */
 p.form = Math.round(heats>0 ? G.meForm : -3);
 const ind = !blocked ? simIndividual(p, effOvr, defP, excP) : null;
 
 /* --- OCENA SEZONU ZE WSZYSTKICH ROZGRYWEK --- */
 const tally={h:heats+po.h, p:pts+po.p};
 tally.h+=dmpj.me.heats; tally.p+=dmpj.me.pts;
 /* GROSZE OD PZM: 500 zł startowego za każdy turniej (DMPJ, IMP, MIMP, Kaski)
    + 150 zł za każdy zdobyty w nich punkt. Z tego się nie żyje, ale na paliwo jest. */
 let pzmStarts=0, pzmPts=0;
 if(dmpj && dmpj.eligible && dmpj.me){ pzmStarts+=dmpj.me.starts||0; pzmPts+=dmpj.me.pts||0; }
 const medals=[];
 if(ind){
   /* UWAGA: 'macec' NIE wchodzi do listy niżej — Puchar MACEC to zawody
      międzynarodowe organizowane przez MACEC, nie przez PZM, więc nie
      dolicza się do ryczałtów PZM (pzmStarts/pzmPts). Ma własną, osobną
      wypłatę z regulaminu — patrz blok „PUCHAR MACEC — NAGRODY" niżej. */
   ['imp','mimp','zk','sk','bk','szk'].forEach(k=>{
     const c=ind[k]; if(!c||!c.rode) return;
     (c.rounds||[]).forEach(rr=>{ if(rr.me){tally.h+=rr.me.codes.length; tally.p+=rr.me.pts;
                                            pzmStarts++; pzmPts+=rr.me.pts||0;} });
     if(c.mePos>=1&&c.mePos<=3) medals.push({k, name:c.name, pos:c.mePos});
   });
   if(ind.macec && ind.macec.rode){
     (ind.macec.rounds||[]).forEach(rr=>{ if(rr.me){tally.h+=rr.me.codes.length; tally.p+=rr.me.pts;} });
     if(ind.macec.mePos>=1 && ind.macec.mePos<=3) medals.push({k:'macec', name:ind.macec.name, pos:ind.macec.mePos});
   }
 }
 /* --- PUCHAR MACEC — NAGRODY WEDŁUG REGULAMINU ---
    Realne stawki (netto, w euro), przeliczone na złote po kursie ok. 4,3:
    310/250/190/160/140×2/120×2/110×2/100×2/90×2/70×2/60×2 za miejsca 1-16,
    plus ryczałt startowy minimum 125 euro na zawodnika (dostajesz go zawsze,
    niezależnie od wyniku — to nie jest liga dla gwiazd, tylko dla ludzi,
    którzy nigdy nie zobaczą Grand Prix, stąd skromne kwoty). */
 if(ind && ind.macec && ind.macec.rode){
   const prizeEUR=[310,250,190,160,140,140,120,120,110,110,100,100,90,90,70,70];
   const rank=ind.macec.mePos||16;
   const prizePLN=Math.round((prizeEUR[rank-1]||60)*4.3/10)*10;
   const travelPLN=Math.round(125*4.3/10)*10;
   const macecIncome=prizePLN+travelPLN;
   p.budget+=macecIncome; p.career.earned+=macecIncome;
   notes.push('Puchar MACEC: '+rank+'. miejsce w klasyfikacji końcowej cyklu (16 zawodników z sześciu krajów) — '+
     zl(prizePLN)+' nagrody + '+zl(travelPLN)+' ryczałtu startowego = '+zl(macecIncome)+'.');
 }
 const PZM_START=500, PZM_PER_PT=150;
 const pzmEarned = pzmStarts*PZM_START + pzmPts*PZM_PER_PT;
 const overall = tally.h>0 ? tally.p/tally.h : 0;
 /* OCENA SEZONU liczona jest NIŻEJ — dopiero po barażach, awansach i spadkach,
    bo uratowanie klubu przed spadkiem jest częścią tej oceny (patrz seasonScore). */
 
 /* --- KASA (należność brutto; realne przelewy szły co kolejkę) --- */
 let earned=0, earnedBon=0;
 if(!S.noEarnings && p.banSeasons===0){
   earned    = Math.round(pts   * p.contract.rate * S.rateMul);
   earnedBon = Math.round(bonus * p.contract.rate * S.rateMul);
 }
 if(S.noEarnings) notes.push('Zrzekłeś się wynagrodzenia — z ligi nie wpłynął ani grosz.');
 
 /* --- PROFESJONALIZM I MEDIALNOŚĆ W TRAKCIE SEZONU --- */
 const statLog=[];
 const evProf=p.prof-S.prof0, evMed=p.med-S.med0;
 if(evProf) statLog.push({s:'prof', d:evProf, w:'zdarzenie: '+(S.evTitle||'—')});
 if(evMed)  statLog.push({s:'med',  d:evMed,  w:'zdarzenie: '+(S.evTitle||'—')});
 const bump=(s,d,w)=>{ if(!d) return; d=Math.round(d); if(!d) return;
   if(s==='prof') p.prof=cl(p.prof+d,0,99); else p.med=cl(p.med+d,0,99);
   statLog.push({s,d,w}); };
 if(matches>=10) bump('prof',3,'pełny sezon w składzie, rutyna zrobiła swoje');
 else if(matches===0) bump('prof',-4,'cały rok poza torem — wypadłeś z rytmu');
 if(heats>0 && exclusions>=4) bump('prof',-(2+Math.floor(exclusions/3)),exclusions+' wykluczeń — sędziowie mają cię na oku');
 if(heats>0 && exclusions===0 && heats>15) bump('prof',4,'sezon bez jednego wykluczenia');
 if(avg>=1.8) bump('prof',2,'jazda na poziomie, sztab przestał się kłócić');
 if(p.age<=21) bump('prof',2,'rok doświadczenia w kadrze juniorskiej');
 if(avg>=2.0) bump('med',10,'średnia '+avgTxt+' — portale zrobiły z ciebie temat tygodnia');
 else if(avg>=1.5) bump('med',5,'solidna średnia, wchodzisz do studia po meczu');
 else if(heats>0 && avg<0.8) bump('med',-8,'średnia '+avgTxt+' — nikt nie dzwoni po wywiad');
 if(matches===0) bump('med',-12,'zniknąłeś z anten na cały rok');
 if(pos===1) bump('med',8,'mistrzostwo — jesteś na każdym zdjęciu z pucharem');
 else if(pos>=7) bump('med',-4,'grasz w zespole ze strefy spadkowej');
 if(bonus>=8) bump('prof',2,bonus+' punktów bonusowych — jeździsz na kolegę, nie na siebie');
 bump('med',-3,'naturalny zanik zainteresowania mediów');
 const profDelta=p.prof-S.prof0, medDelta=p.med-S.med0;
 
 /* --- LOJALNOŚĆ: KAŻDY SEZON W TYCH SAMYCH BARWACH COŚ ZNACZY ---
    Wcześniej lojalność rosła wyłącznie przy podpisywaniu przedłużenia (+18),
    więc próg 70 wymagany do budowania legendy jednego klubu był praktycznie
    nieosiągalny. Teraz liczy się przesiedziany (i przejeżdżony) rok w tych samych barwach. */
 if(club){
   let loy = matches>0 ? R(4,8) : 1;
   if(pos===1) loy += 3;
   if(matches>=BAL.rounds-2) loy += 2;
   if(S.strikeRounds>0) loy -= 4;                      // bunt płacowy to nie jest miłość do herbu
   const loy0=p.loyalty;
   p.loyalty = cl(p.loyalty+loy, 0, 100);
   if(p.loyalty!==loy0) notes.push('Lojalność wobec klubu: '+loy0+' → '+p.loyalty+' (kolejny sezon w tych samych barwach).');
 }
 
 /* --- ROZWÓJ --- */
 let growth = p.age<=21?7.4 : p.age<=24?4.4 : p.age<=28?1.8 : p.age<=32?0.1 : p.age<=36?-2.6 : -5;
 growth += (p.prof-50)/26;
 growth += heats>0 ? (avg-1.4)*(p.age<=21?1.4:2.4) : -3.5;   // brak startów = brak rozwoju
 growth += gauss(0,1.6);
 // sufit talentu: im bliżej swojego potencjału, tym trudniej o kolejny punkt
 if(growth>0) growth *= cl(((p.pot||p.ovr+8)-p.ovr)/10, 0, 1);
 const oldOvr=p.ovr;
 p.ovr = cl(Math.round(p.ovr+growth),1,99);
 
 /* --- ZUŻYCIE SPRZĘTU I SERWIS POSEZONOWY ---
    Stare -5..-11 na sezon oznaczało, że jeden zakup u dobrego tunera starczał
    na trzy lata i warsztat przestawał być decyzją. Teraz zużycie zależy od
    PRZEBIEGU (biegi w lidze + play-off), a po sezonie przychodzi rachunek
    za rozebranie, umycie i złożenie sprzętu — im lepszy sprzęt, tym droższy
    serwis. Zawodowiec, który nic nie kupuje, w dwa lata jedzie złomem. */
 let equipWear=0, serviceCost=0;
 if(p.contract.type==='Zawodowy'){
   const run = heats + po.h;                                   // realny przebieg sezonu
   equipWear = R(8,13) + Math.round(run/8) + (S.injDone?2:0);  // ok. -16..-26 przy pełnym sezonie
   p.equip = cl(p.equip-equipWear, 1, 99);
   notes.push('ZUŻYCIE SPRZĘTU: -'+equipWear+' (przebieg: '+run+' biegów'+(S.injDone?' + kraksa':'')+'). Sprzęt: '+p.equip+'/99.');
   // sezon bez startow to sam magazyn i konserwacja, a nie pelny serwis
   serviceCost = run>0 ? Math.round(ECON.svcBase + run*ECON.svcPerHeat + p.equip*ECON.svcEquipW)
                       : Math.round(ECON.svcBase*0.35);
   // SERWIS WEDŁUG LIGI — patrz komentarz przy ECON.svcLeague w data.js:
   // lokalny warsztat w KLŻ nie kosztuje tyle, co fabryczny serwis w Ekstralidze.
   serviceCost = Math.round(serviceCost * (ECON.svcLeague[p.lk]||1));
   // MŁODZIEŻOWA ZNIŻKA NA SERWIS — ta sama logika co w livingCostOf(): junior
   // na kontrakcie zawodowym zarabia ułamek stawki seniora, więc rachunek za
   // tuning nie może być liczony po cenach seniorskich (patrz youngCostMul()).
   serviceCost = Math.round(serviceCost * youngCostMul(p));
   p.budget -= serviceCost;
   p.career.service = (p.career.service||0) + serviceCost;
   notes.push('SERWIS POSEZONOWY: '+zl(serviceCost)+' (rozbiórka, tłoki, uszczelki, transport do tunera). Nikt tego za ciebie nie zapłaci.');
 } else {
   // amator jeździ sprzętem klubowym — dostaje to, na co klub go stać
   p.equip = cl(Math.round(20 + club.ovr*0.32 + R(-3,3)),1,99);
 }
 
 /* --- KLUB: dług, atmosfera --- */
 if(club.debt>0){
   const rich=cl(club.budget/12000000,0,1);
   if(chance(45+rich*45)){
     const spl=Math.round(club.debt*RF(0.25,rich>0.5?1:0.7));
     club.debt=Math.max(0,club.debt-spl); p.budget+=spl; p.career.earned+=spl;
     notes.push('Klub spłacił część starych zaległości: '+zl(spl)+(club.debt>0?' (zostaje '+zl(club.debt)+')':' — czysto.'));
   } else notes.push('Klub nie ruszył starych zaległości ('+zl(club.debt)+').');
 }
 
 /* --- EKOSYSTEM KLUBÓW: gospodarność + pato-zdarzenia (przed ruchem między ligami) --- */
 const clubEvents = clubEconomy();
 
 /* Nazwa klubu z rozegranego sezonu — syndyk może ją zaraz zmienić, a raport
    i wszystkie tabele muszą pokazywać stan z sezonu, nie po upadłości. */
 const seasonClubName = club.name;
 
 /* --- BARAŻE, AWANSE I SPADKI (rozstrzygane od razu po sezonie) --- */
 promotionsRelegations();
 
 /* --- UPADŁOŚĆ TWOJEGO KLUBU --- */
 const myBk = (G.bankrupts||[]).find(b=>b.old===seasonClubName) || null;
 if(myBk){
   notes.push('UPADŁOŚĆ KLUBU: '+myBk.old+' przestał istnieć. '+myBk.why);
   notes.push('Nowy szyld: '+myBk.now+' — OVR 40, start od Krajowej Ligi Żużlowej.');
   notes.push('Dług klubu wobec ciebie zniknął razem z klubem. Nie zobaczysz z tego ani złotówki.');
 }
 
 G.promo.filter(x=>x.club===seasonClubName).forEach(x=>{
   notes.push((x.type.startsWith('awans')?'AWANS! ':'SPADEK. ')+seasonClubName+' → '+G.leagues[x.to].name+
              (x.type.includes('baraż')?' (po dwumeczu barażowym)':''));
 });
 if(pos===1) notes.push('MISTRZOSTWO '+G.leagues[lk].name+'!');
 
 /* --- OCENA SEZONU ZE WSZYSTKICH ROZGRYWEK ---
    Liczona po rozstrzygnięciu baraży, awansów i spadków: gracz, który wrócił
    z gipsu na cztery mecze i utrzymał klub w lidze, nie ma prawa dostać
    „BEZNADZIEJNEJ" tylko dlatego, że nie zdążył nabić biegów. */
 const gradeCalc = seasonScore({
   overall, heats:tally.h, matches:matches+po.m, pos, avg, po, medals, dmpj,
   injured:S.injDone, injMissed:S.injTotal||0, bonus, club:seasonClubName, lk,
   leagueName:G.leagues[lk].name
 });
 const grade = gradeOf(gradeCalc.score, tally.h);
 
 const res={
  year:G.year, club:seasonClubName, pname:p.name, lk, leagueName:G.leagues[lk].name, league:G.leagues[lk].short, age:p.age,
  bankrupt:myBk, bankruptsAll:G.bankrupts||[], greenTable:G.greenTable||[],
  atm:S.atm, atmTxt, matches, heats, completed, pts, bonus, defects, exclusions,
  /* ------------------------------------------------------------------
     DOROBEK ŁĄCZNY (RUNDA ZASADNICZA + PLAY-OFF)
     BŁĄD, KTÓRY TO NAPRAWIA: kafelek „MECZE" na karcie kariery czytał
     p.career.matches, a ten od zawsze rósł o `matches + po.m` (liga plus
     dwumecze play-off). Tabela sezon-po-sezonie w tej samej karcie brała
     natomiast r.matches, czyli SAMĄ rundę zasadniczą. Zawodnik, który
     przejechał 14 kolejek i dwa dwumecze play-off, widział więc 14 w tabeli
     i 16 w kafelku — i słusznie uznawał to za błąd liczenia.
     Trzymamy teraz jedną, jawną definicję dorobku i podajemy ją do UI,
     żeby wiersz „ŁĄCZNIE" faktycznie sumował się do kafelków.
     ------------------------------------------------------------------ */
  matchesAll : matches + po.m,
  heatsAll   : heats   + po.h,
  ptsAll     : pts     + po.p,
  bonusAll   : bonus   + po.b,
  defectsAll : defects + po.d,
  exclAll    : exclusions + po.w,
  avgAll     : (heats+po.h) > 0 ? (pts+po.p)/(heats+po.h) : 0,
  avgAllTxt  : (heats+po.h) > 0 ? ((pts+po.p)/(heats+po.h)).toFixed(2) : '—',
  avg, avgTxt, grade, earned, earnedBon, pos, posReg, po, dmpj, ind, tally, overall, medals,
  tabRow:myRow, injured, injMissed, clubEvents, strikeRounds:S.strikeRounds, payLog:S.payLog,
  strike, ovrFrom:oldOvr, ovrTo:p.ovr, notes, fines:S.fines, lines, replaced,
  profFrom:S.prof0, profTo:p.prof, profDelta, medFrom:S.med0, medTo:p.med, medDelta, statLog,
  evLog:S.evLog, evTitle:S.evTitle, evChoice:S.evChoice,
  ban:p.banSeasons>0,
  /* --- NIEOCZEKIWANE ZDARZENIA I SZANSA NA SKŁAD (do UI) --- */
  surprises : (S.surprises||[]).slice(),
  chanceAvg : chances.length ? Math.round(chances.reduce((a,b)=>a+b,0)/chances.length) : null,
  chanceMin : chances.length ? Math.min(...chances) : null,
  chanceMax : chances.length ? Math.max(...chances) : null,
  /* --- KONTUZJE DŁUGOTERMINOWE (do czerwonego boksu w UI) --- */
  longInjuryOut : !!S.longInjury,                 // ten sezon przeleciał w gipsie
  longInjuryWhy : S.longInjuryWhy||'',
  longInjuryNew : S.longInjuryNew||null,          // ...a TERAZ złapałeś kolejny taki uraz
  longInjuryDmg : S.longInjuryDmg||0,
  longInjuryNext: (p.longInjury||0)>0,            // kolejny sezon też masz z głowy
  injCat        : !!S.injCat,
  injCatWhy     : S.injCatWhy||'',
  /* --- KARIERA URWANA PRZEZ ZDARZENIE (fxEnd) --- */
  careerOver    : !!p.retired,
  careerOverWhy : p.retireReason||''
 };
 /* ============================================================
    KONTROLA WYKONANIA SKUTKÓW ZDARZENIA
    ------------------------------------------------------------
    Ekran zdarzenia obiecuje konkretne rzeczy: karę, walkower, więcej biegów,
    większe ryzyko urazu, inną stawkę, gorsze oferty. Do tej pory gracz musiał
    wierzyć na słowo. Tu spisujemy stan, w jakim te obietnice REALNIE weszły
    do sezonu (i co przechodzi na kolejny rok), a UI pokazuje to obok wyboru.
    ============================================================ */
 res.evEffects = {
   heatPP     : S.heatPP||0,
   injuryPP   : S.injuryPP||0,
   injuryP    : S.injuryP||0,
   ovrBonus   : S.ovrBonus||0,
   teamOvr    : S.teamOvr||0,
   teamPts    : S.teamPts||0,
   banMatches : S.banMatches||0,
   fines      : S.fines||0,
   equipFit   : S.equipFit,
   rateMul    : S.rateMul||1,
   extraDefP  : S.extraDefP||0,
   noEarnings : !!S.noEarnings,
   zeroMatches: !!S.zeroMatches,
   forcedEnd  : !!S.forcedEnd,
   noRenew    : !!S.noRenew,
   walkover   : S.walkower ? {mode:S.walkMode, round:(S.walkRound||0)+1, pen:S.walkPen||0} : null,
   next : {zeroMatches:!!p.next.zeroMatches, heatPP:p.next.heatPP||0, injuryPP:p.next.injuryPP||0,
           betterOffers:!!p.next.betterOffers, rateMul:p.next.rateMul||1, forceClub:p.next.forceClub||null,
           lockTransfer:p.next.lockTransfer||0, noSponsor:!!p.next.noSponsor, rowPen:!!p.next.rowPen,
           longInjury:p.longInjury||0, alimony:p.alimony||0}
 };
 res.gradeParts = gradeCalc.parts;      // rozpiska oceny do UI: skąd wzięła się ta ocena
 res.gradeScore = Math.round(gradeCalc.score*100)/100;
 res.equipWear  = equipWear;
 res.serviceCost= serviceCost;
 medals.forEach(m=>{
   /* Nie każdy podium to "Mistrzostwo Polski" — Turniej Szkoleniowy i Puchar
      MACEC to osobne, mniejsze rozgrywki (jeden regionalny, jeden
      międzynarodowy), więc dostają własne, trafniejsze etykiety. */
   const labels = (m.k==='szk' || m.k==='macec')
     ? ['','ZWYCIĘSTWO W KLASYFIKACJI KOŃCOWEJ','2. MIEJSCE W KLASYFIKACJI KOŃCOWEJ','3. MIEJSCE W KLASYFIKACJI KOŃCOWEJ']
     : ['','MISTRZOSTWO POLSKI','WICEMISTRZOSTWO','BRĄZOWY MEDAL'];
   notes.push(m.name+': '+labels[m.pos]+'!');
   p.career.medals=(p.career.medals||0)+1;
   if(m.pos===1 && m.k!=='szk' && m.k!=='macec') p.career.indTitles=(p.career.indTitles||0)+1;
 });
 if(ind&&ind.imp&&ind.imp.rode&&!medals.some(m=>m.k==='imp')&&ind.imp.mePos)
   notes.push('IMP: '+ind.imp.mePos+'. miejsce w klasyfikacji końcowej.');
 res.talk = seasonTalk(res,p);
 
 /* --- KARIERA --- */
 const poCash = (!S.noEarnings && p.banSeasons===0)
   ? Math.round((po.p+po.b)*p.contract.rate*S.rateMul*1.5) : 0;   // play-off płatny 150%
 res.earnedPo=poCash;
 
 /* --- ROZLICZENIE Z KLUBEM ---
    Kasa szła co kolejkę: klub przelewał tyle, na ile było go stać, a reszta
    lądowała w rubryce „zaległości”. Tu tylko dopinamy fazę play-off
    i pokazujemy bilans całego roku. --- */
 if(poCash>0){
   // syndyk nie przelewa nic i niczego nie dopisuje do długu — dług już nie istnieje
   const r2 = myBk ? 0 : payRatioOf(club);
   const pp=Math.round(poCash*r2), un=poCash-pp;
   p.budget+=pp; p.career.earned+=pp; club.budget-=pp;
   if(un>0 && !myBk) club.debt+=un;
   S.owed+=poCash; S.paid+=pp;
 }
 const owed=S.owed, paid=S.paid, unpaid=Math.max(0,owed-paid);
 const ratio = owed>0 ? Math.round(paid/owed*100) : 100;
 if(owed>0){
   res.settle={owed, paid, unpaid, ratio, wiped:myBk?unpaid:0};
   notes.push(unpaid>0
     ? 'Rozliczenie sezonu: należność '+zl(owed)+', klub przelał '+zl(paid)+' ('+ratio+'%). Niezapłacone: '+zl(unpaid)+'.'
     : 'Rozliczenie sezonu: klub wypłacił całość — '+zl(paid)+'.');
 }
 if(myBk) res.bankruptLost = unpaid;
 
 /* --- GROSZE ZA DMPJ I TURNIEJE INDYWIDUALNE ---
    PZM płaci od ręki i niezależnie od tego, czy klub ma czym płacić. --- */
 if(pzmEarned>0){
   p.budget += pzmEarned;
   p.career.earned += pzmEarned;
   p.career.pzmEarned = (p.career.pzmEarned||0) + pzmEarned;
   notes.push('Ryczałty PZM (DMPJ, IMP, MIMP, Kaski): '+pzmStarts+' × 500 zł startowego + '
              +pzmPts+' pkt × 150 zł = '+zl(pzmEarned)+'.');
   if(!res.settle) res.settle={owed:0, paid:0, unpaid:0, ratio:100, wiped:0};
 }
 if(res.settle){
   res.settle.pzmEarned = pzmEarned;
   res.settle.pzmStarts = pzmStarts;
   res.settle.pzmPts    = pzmPts;
 }
 res.pzmEarned = pzmEarned;   // skrót dla UI, gdyby nie chciało schodzić do settle
 
 /* --- KOSZTY ŻYCIA ---
    Druga strona przelewu: bus, paliwo na 40 tysięcy kilometrów, hotele,
    ubezpieczenie, dom. Amator mieszka u mamy i jeździ sprzętem klubowym,
    więc płaci połowę. Bez tej rubryki gra była zbierackim symulatorem gotówki. */
 const living = Math.round(livingCostOf(p, false) * (matches>0 ? 1 : 0.60));
 p.budget -= living;
 p.career.living = (p.career.living||0) + living;
 res.living = living;

 /* --- ALIMENTY DO ARGENTYNY ---
    Sztywne 45 000 zł co sezon, dopóki licznik p.alimony nie zejdzie do zera.
    Nie interesuje ich kontuzja, spadek ani to, że klub nie zapłacił.
    Raport finansowy pokazuje tę rubrykę na czerwono (patrz settleHtml). */
 const alim = chargeAlimony(p);
 if(alim){
   res.alimony     = alim.amount;
   res.alimonyLeft = alim.left;
   notes.push('Alimenty do Argentyny: -'+zl(alim.amount)+' (pozostało rat: '+alim.left+').');
   // rubryka musi się pokazać także wtedy, gdy w tym sezonie nie było żadnych wpływów
   if(!res.settle) res.settle={owed:0, paid:0, unpaid:0, ratio:100, wiped:0, pzmEarned:pzmEarned};
 }
 res.livingTxt = 'Koszty życia i utrzymania busa ('+G.leagues[lk].short+', wiek '+p.age+
   (p.contract.type==='Amatorski'?', taryfa amatorska':'')+'): '+zl(living)+'.';
 notes.push(res.livingTxt);
 if(S.ageMul && S.ageMul<1)
   notes.push('Stawka młodzieżowa: klub wypłacał ci '+Math.round(S.ageMul*100)+'% stawki z kontraktu ('+
     zl(Math.round(p.contract.rate*S.ageMul))+' zamiast '+zl(p.contract.rate)+' za punkt). Reszta „poszła na twój rozwój".');
 
 /* --- ODLICZANIE DŁUGIEJ KONTUZJI ---
    Sezon spędzony w gipsie „zużywa" jedną jednostkę p.longInjury. Jeżeli
    jednak DOPIERO TERAZ zerwałeś więzadła (S.longInjuryNew), licznik zostaje
    nietknięty — kolejny rok też masz z głowy. */
 if(S.longInjury && !S.longInjuryNew){
   p.longInjury = Math.max(0, (p.longInjury||0)-1);
   if(!p.longInjury) p.longInjuryWhy='';
 }

 p.career.seasons++; p.career.matches+=matches+po.m; p.career.heats+=heats+po.h;
 p.career.pts+=pts+po.p; p.career.bon=(p.career.bon||0)+bonus+po.b;
 p.career.def+=defects+po.d; p.career.exc+=exclusions+po.w;
 if(avg>p.career.bestAvg){p.career.bestAvg=avg;p.career.best=avg.toFixed(2)+' ('+G.year+')';}
 if(pos===1) p.career.titles++;

 /* --- ZGŁOSZENIE KLUBU DO TRYBUNAŁU PZM ---
    Feedback: gdy mamy WIELOLETNI kontrakt, a klub zalega nam na tyle, że
    odmawiamy jazdy (bunt płacowy), a mimo to umowa formalnie trwa dalej,
    powinna być osobna droga: zgłoszenie do trybunału PZM. To NIE jest
    zwykłe zdarzenie z puli WINTER_EVENTS — leci jako OSOBNY, niezależny
    ekran w przerwie zimowej (patrz afterWinter()/scTribunal() w index.html),
    więc w tej samej przerwie mogą wypaść DWA zdarzenia: zwykłe losowe
    i to, tribunałowe. Warunek: kontrakt z co najmniej 2 latami na papierze
    (żeby "długoterminowy" znaczyło coś więcej niż "i tak kończy się teraz"),
    bunt płacowy w tym sezonie i wciąż niespłacona zaległość klubu. */
 if(strike && club && club.debt>0 && (p.contract.years||0)>=2){
   p.next.tribunalCase = {club:club.name, debt:Math.round(club.debt), strikeRounds:S.strikeRounds};
 } else {
   p.next.tribunalCase = null;
 }

 G.last=res; G.history.push(res);
 return res;
}
 
/* ============================================================
   KOMENTARZE PO SEZONIE
   ------------------------------------------------------------
   Każdy warunek miał wcześniej JEDNĄ linijkę wpisaną na stałe, więc gracz
   czytał w kółko to samo zdanie komornika, mechanika i Ostafińskiego.
   Teraz teksty siedzą w puli TALK (data.js, po 32 na warunek), a talkPick()
   losuje z PAMIĘCIĄ: dopóki pula się nie wyczerpie, żaden tekst nie wróci.
   Pamięć trzymamy w G.talkSeen, żeby przechodziła przez cały przebieg kariery.
   ============================================================ */
function talkPick(key, vars){
 const pool = (typeof TALK!=='undefined') && TALK[key];
 if(!pool || !pool.lines || !pool.lines.length) return null;
 if(!G.talkSeen) G.talkSeen={};
 let used = G.talkSeen[key] || [];
 // wszystkie teksty z tej puli już poszły — zaczynamy od nowa, ale bez
 // powtórki ostatnio użytego zdania (żeby nie trafić dwa razy pod rząd)
 if(used.length >= pool.lines.length) used = used.slice(-1);
 let free = pool.lines.map((_,i)=>i).filter(i=>!used.includes(i));
 if(!free.length) free = pool.lines.map((_,i)=>i);
 const idx = pick(free);
 G.talkSeen[key] = used.concat(idx);
 let txt = pool.lines[idx];
 // podstawienia: {n}, {rok}, {kasa}, {avg}, {klub}
 if(vars) Object.keys(vars).forEach(k=>{ txt = txt.split('{'+k+'}').join(vars[k]); });
 return {who:pool.who, txt};
}
function seasonTalk(r,p){
 const A=[], avg=r.avg;
 const add=(key,vars)=>{ const t=talkPick(key,vars); if(t) A.push(t); };
 // --- główna ocena jazdy ---
 if(r.matches===0) add('none');
 else if(avg<0.5) add('awful');
 else if(avg<0.9) add('bad');
 else if(avg<1.4) add('meh');
 else if(avg<1.8) add('solid');
 else if(avg<2.2) add('good');
 else add('great');
 // --- Ostafiński ---
 if(r.medDelta<=-10) add('ostaSilent');
 else if(r.medDelta>=12) add('ostaLoud');
 else if(p.med>70) add('ostaStar');
 else if(p.med<20) add('ostaNobody');
 // --- defekty i wykluczenia ---
 if(r.defects>=6) add('defMany',{n:r.defects});
 else if(r.defects===0&&r.heats>15) add('defZero');
 if(r.exclusions>=5) add('excMany',{n:r.exclusions});
 // --- bonusy ---
 if(r.bonus>=10) add('bonMany');
 else if(r.bonus===0&&r.heats>10) add('bonZero');
 // --- tabela ---
 if(r.pos===1) add('champion');
 else if(r.pos===8) add('relegated');
 // --- finanse ---
 if(r.strike) add('strike',{rok:r.year});
 if(r.fines>50000) add('fines',{kasa:zl(r.fines)});
 if(p.budget<0) add('broke');
 // --- sprzęt / wiek ---
 if(p.equip<15) add('junk');
 if(p.age>=34&&avg<1.2) add('oldSlow');
 if(p.age<=19&&avg>1.6) add('youngFast');
 // wybierz maks. 4, zawsze z pierwszą pozycją
 const first=A.shift(), rest=A.sort(()=>Math.random()-0.5).slice(0,3);
 return [first,...rest].filter(Boolean);
}
 
/* ============================================================
   OCENA SEZONU — CO SIĘ NA NIĄ SKŁADA
   Wejście: dorobek ze wszystkich rozgrywek + kontekst drużynowy.
   Wyjście: {score, parts} — parts to gotowa rozpiska dla UI, żeby gracz
   widział, skąd wzięła się ocena, zamiast kłócić się z literą na ekranie.
   Wagi siedzą w GRADE (data.js).
   ============================================================ */
function seasonScore(o){
 const parts=[];
 const push=(d,w)=>{ if(Math.abs(d)>=0.005) parts.push({d:Math.round(d*100)/100, w}); };
 const h=o.heats||0;
 if(h===0) return {score:0, parts:[{d:0, w:'zero biegów w całym sezonie — nie ma czego oceniać'}]};
 
 /* 1) PODSTAWA: średnia ze wszystkich rozgrywek, ale ściągnięta w stronę
       średniej ligowej tym mocniej, im mniejsza próba. 12 biegów po powrocie
       z gipsu nie może ważyć tyle, co 180 biegów pełnego sezonu. */
 const W=GRADE.shrinkW;
 const base=(o.overall*h + GRADE.neutral*W)/(h+W);
 parts.push({d:Math.round(base*100)/100,
   w:'średnia '+o.overall.toFixed(2)+' z '+h+' biegów'+
     (h<W ? ' — mała próba, ocena ciągnięta do średniej ligowej '+GRADE.neutral.toFixed(2) : '')});
 let s=base;
 
 /* 2) OBJĘTOŚĆ SEZONU: kto odjechał komplet, ten ma prawo do premii; kto
       przesiedział rok na ławce, ten nie schowa się za jedną dobrą średnią. */
 const vol=cl((o.matches-6)/16,-0.5,1)*GRADE.volume;
 s+=vol; push(vol, o.matches+' rozegranych spotkań (liga + play-off)');
 
 /* 3) MEDALE INDYWIDUALNE */
 (o.medals||[]).forEach(m=>{ const d=GRADE.medal[m.pos]||0; s+=d;
   push(d, m.name+' — '+['','złoto','srebro','brąz'][m.pos]); });
 
 /* 4) DRUŻYNA: tytuł, podium, awans, utrzymanie, spadek */
 if(o.pos===1){ s+=GRADE.champ; push(GRADE.champ,'MISTRZOSTWO — '+o.leagueName); }
 else if(o.pos<=3){ s+=GRADE.podium; push(GRADE.podium, o.pos+'. miejsce w play-off'); }
 const moves=(G.promo||[]).filter(x=>x.club===o.club);
 const wentUp=moves.some(x=>String(x.type).startsWith('awans'));
 const wentDown=moves.some(x=>String(x.type).startsWith('spadek'));
 if(wentUp){ s+=GRADE.promo; push(GRADE.promo,'AWANS do wyższej ligi'); }
 /* 8. miejsce to spadek bezpośredni — nawet gdy tabeli awansów nie ma pod ręką.
    Premię „za utrzymanie" dostaje wyłącznie 7. miejsce: ten, kto wygrał dwumecz
    o utrzymanie i obronił się w barażu. */
 if(wentDown || (!wentUp && o.pos===8 && o.lk!=='KL')){
   s+=GRADE.releg; push(GRADE.releg,'spadek z ligi');
 } else if(!wentUp && o.pos===7 && o.lk!=='KL' && o.matches>0){
   s+=GRADE.saved; push(GRADE.saved,'utrzymanie wywalczone w play-downie/barażu — klub został w lidze');
 }
 
 /* 5) FAZA PLAY-OFF liczy się osobno: tam jedzie się o wszystko */
 if(o.po && o.po.h>0){
   const d=cl((o.po.avg-1.30)*0.18, -0.10, 0.22); s+=d;
   push(d,'faza play-off: średnia '+o.po.avgTxt+' w '+o.po.h+' biegach');
 }
 
 /* 6) DMPJ */
 if(o.dmpj && o.dmpj.eligible && o.dmpj.classification && o.dmpj.classification[0]===o.club){
   s+=GRADE.dmpj; push(GRADE.dmpj,'drużynowe mistrzostwo Polski juniorów');
 }
 
 /* 7) KONTUZJA — nie liczymy jej przeciwko zawodnikowi */
 if(o.injured && o.injMissed>0){
   const d=cl(o.injMissed*GRADE.injW, 0, GRADE.injMax); s+=d;
   push(d,'kontuzja: '+o.injMissed+' spotkań poza torem, nie twoja wina');
 }
 
 /* 8) JAZDA NA KOLEGĘ Z PARY */
 if(o.bonus>=8){ s+=GRADE.bonusPts; push(GRADE.bonusPts, o.bonus+' punktów bonusowych — jeździsz na drużynę'); }
 
 return {score:Math.max(0,s), parts};
}
 
function gradeOf(avg,heats){
 if(heats===0) return {t:'BRAK STARTÓW', f:'nie istniejesz', c:'text-zinc-600'};
 if(avg<0.60) return {t:'BEZNADZIEJNA', f:'beznadziejna', c:'text-red-600'};
 if(avg<1.00) return {t:'SŁABA',        f:'słaba',        c:'text-red-400'};
 if(avg<1.40) return {t:'PRZECIĘTNA',   f:'przeciętna',   c:'text-zinc-400'};
 if(avg<1.80) return {t:'DOBRA',        f:'dobra',        c:'text-lime-400'};
 if(avg<2.20) return {t:'BARDZO DOBRA', f:'bardzo dobra', c:'text-emerald-400'};
 return              {t:'WYBITNA',      f:'wybitna',      c:'text-orange-400 glow'};
}
 
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
function lineupValue(r,bias,noise){
 return r.ovr + (r.form||0)*LINEUP_FORM_W + (bias&&bias.id===r.id?bias.v:0) + (noise?gauss(0,noise):0);
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
function lineupFrom(pool, noise, bias, forceSave){
 if(!pool || pool.length<3) return null;
 if(forceSave) pool = saveCut(pool, bias);
 const val=r=>lineupValue(r,bias,noise);
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
 return lineupFrom(availableRiders(clubName), noise||0, bias, forceSave);
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
 // punkt bonusowy: nieostatni, tuż za kolegą z pary
 res.forEach(x=>{ x.bon=0; if(x.out||x.pts===3) return;
   const mate=res.find(y=>y!==x && y.side===x.side);
   if(mate && !mate.out && mate.pts>x.pts && x.pts>0) x.bon=1; });
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
    zwykłą arytmetyką trenera: OVR plus bieżąca forma. */
 let meGap=null, meReg=false;
 if(meId && !inL(LH) && !inL(LA) && ctx && ctx.bias && ctx.bias.club){
   const club=ctx.bias.club;
   if(club===homeName || club===awayName){
     const L = club===homeName?LH:LA, bias = club===homeName?bH:bA;
     const me = availableRiders(club).find(r=>r.id===meId);
     if(me && L){
       const val=r=>lineupValue(r,bias,0);
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
 const st={}; Object.values(map).forEach(r=>{ if(r) st[r.id]={r, starts:0, pts:0, bon:0, codes:[], num:null}; });
 for(let n=1;n<=15;n++) if(map[n]) st[map[n].id].num=n;
 const set=HEAT_SETS[R(0,1)];
 let hs=0, as=0;
 const tacticUsed={h:false,a:false};
 const heats=[];
 const reserves=side=>[6,7].map(n=>map[numFor(side,n)]).filter(Boolean);

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
     if(!r || st[r.id].starts>=5){
       const name = side==='h'?homeName:awayName;
       r = reserves(side).concat(availableRiders(name).filter(x=>st[x.id]))
            .filter(x=>st[x.id].starts<5 && !inHeat().includes(x.id))
            .sort((a,b)=>b.ovr-a.ovr)[0];
       if(!r) return;
     }
     if(inHeat().includes(r.id)) return;
     // numer w programie bierzemy z kartoteki zawodnika — nie z klucza mapy,
     // bo pod kluczem może siedzieć rezerwa taktyczna albo zwykłe zastępstwo
     const pnum = (st[r.id] && st[r.id].num!=null) ? st[r.id].num : (n>0?n:null);
     entries.push({r, side, home:side==='h', num:pnum, ref:REF[side], trouble:TRB[side]});
   });
   if(entries.length<2) return;
   const res=leagueHeat(entries, ctx, meId);
   res.forEach(x=>{
     const s=st[x.r.id];
     s.starts++; s.pts+=x.pts; s.bon+=x.bon;
     s.codes.push(x.out || String(x.pts));
     if(x.side==='h') hs+=x.pts; else as+=x.pts;
   });
   heats.push({label, res:res.map(x=>({id:x.r.id,name:x.r.name,num:x.num,pts:x.pts,out:x.out,side:x.side}))});
 };
 
 for(let h=0; h<13; h++){
   let nums=set[h].slice();
   // rezerwa taktyczna: biegi III-XIII, gdy drużyna traci co najmniej 6 punktów
   [['h',hs-as],['a',as-hs]].forEach(([side,diff])=>{
     if(h<2 || tacticUsed[side] || diff>-6) return;
     // klub tonący w zaległościach nie ma czym zrobić rezerwy taktycznej:
     // zapasowy silnik stoi u tunera i czeka na przelew
     if(TRB[side]>=10) return;
     const mine=nums.filter(n=>(isHomeNum(n)?'h':'a')===side);
     if(mine.length<2) return;
     const weak=mine.map(n=>map[n]).filter(Boolean).sort((a,b)=>a.ovr-b.ovr)[0];
     if(!weak) return;
     const cand=availableRiders(side==='h'?homeName:awayName)
       .filter(r=>st[r.id] && st[r.id].starts<5 && r.id!==weak.id
                  && !mine.some(n=>map[n]&&map[n].id===r.id))
       .sort((a,b)=>b.ovr-a.ovr)[0];
     if(!cand || cand.ovr<=weak.ovr) return;
     tacticUsed[side]=true;
     st[weak.id].codes.push('-');            // zmieniony — to NIE jest jego start
     const vkey = -cand.id;                   // wirtualny klucz dla rezerwy taktycznej
     nums=nums.map(n=>map[n]&&map[n].id===weak.id ? vkey : n);
     map[vkey]=cand;
     sideOf[vkey]=side;                       // ← bez tego punkty szły do złej drużyny
   });
   runHeat(nums, h+1);
 }
 /* --- Biegi XIV i XV: nominowani, po dwóch z drużyny (art. 721) --- */
 const nominate=(side,name)=>availableRiders(name).filter(r=>st[r.id]&&st[r.id].starts<5)
   .sort((a,b)=> (st[b.id].pts/Math.max(1,st[b.id].starts)) - (st[a.id].pts/Math.max(1,st[a.id].starts)) || b.ovr-a.ovr);
 for(let extra=0; extra<2; extra++){
   const H=nominate('h',homeName).slice(0,2), A=nominate('a',awayName).slice(0,2);
   const entries=[...H.map(r=>({r,side:'h',home:true,num:st[r.id].num,ref:REF.h,trouble:TRB.h})),
                  ...A.map(r=>({r,side:'a',home:false,num:st[r.id].num,ref:REF.a,trouble:TRB.a}))];
   if(entries.length<3) break;
   const res=leagueHeat(entries, ctx, meId);
   res.forEach(x=>{ const s=st[x.r.id]; s.starts++; s.pts+=x.pts; s.bon+=x.bon;
     s.codes.push(x.out||String(x.pts)); if(x.side==='h') hs+=x.pts; else as+=x.pts; });
   heats.push({label:14+extra, nominated:true,
     res:res.map(x=>({id:x.r.id,name:x.r.name,num:x.num,pts:x.pts,out:x.out,side:x.side}))});
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
 const me = meId && st[meId] ? st[meId] : null;
 return {hs, as, heats, st, me: me? {starts:me.starts, pts:me.pts, bon:me.bon, codes:me.codes.filter(c=>typeof c==='string'), num:me.num} : null,
   lineH:LH, lineA:LA, saveIn, save:{h:svH, a:svA}, meGap, meReg};
}
 
/* ============================================================
   5a-bis. EKONOMIA KLUBU W TRAKCIE SEZONU
   Budżet nie jest dekoracją: to kasa, z której klub płaci pensje
   po każdej kolejce. Jak zabraknie — rosną zaległości, a zawodnicy
   przestają wyjeżdżać na tor.
   ============================================================ */
const LEAGUE_INC={EL:4300000, E2:2800000, KL:1500000};   // roczne wpływy przeciętnego klubu
function riderWage(r){ return Math.round(150*Math.pow(Math.max(10,r.ovr),1.8)*(isJun(r)?0.35:1)); }
function squadCost(name){ return squadOf(name).reduce((a,r)=>a+riderWage(r),0); }
function clubSeasonBudget(c){
 const lk=leagueOfClub(c.name), avg=leagueAvgOvr(lk)||c.ovr;
 c.seasonCost   = Math.round(squadCost(c.name) + 300000 + c.ovr*7000);         // pensje + organizacja
 c.seasonIncome = Math.round(LEAGUE_INC[lk]*(0.60+0.40*(c.ovr/Math.max(1,avg)))*RF(0.82,1.18));
 c.incRound  = c.seasonIncome/BAL.rounds;
 c.costRound = c.seasonCost/BAL.rounds;
 c.arr = c.arr||0;
 return c;
}
/* ------------------------------------------------------------
   KLUB, KTÓRY NIE PŁACI, JEDZIE GORZEJ — I TO WIDAĆ W WYNIKU
   Zaległości nie są tylko rubryką w tabelce. Mechanicy nie przyjeżdżają,
   paliwo kupuje się na kreskę, silniki wracają z tunera nieodebrane, a szatnia
   rozmawia o pieniądzach zamiast o ustawieniach. To realna strata na torze:
   do 28 "punktów OVR" na każdego zawodnika takiej drużyny.
   ------------------------------------------------------------ */
function clubTrouble(name){
 const c = typeof name==='string' ? clubByName(name) : name;
 if(!c) return 0;
 const cost=Math.max(1, c.seasonCost||1);
 let t = cl((c.arr||0)/cost, 0, 1.2)*15;              // zaległości wobec całej kadry
 if((c.debt||0)>0) t += cl(c.debt/300000,0,1)*5;      // dług wobec Gracza
 if(c.budget<=0)   t += 3;                            // puste konto
 t += squadOf(c.name).filter(r=>r.strike).length*1.6; // każdy buntownik rozkłada szatnię
 return cl(t, 0, 22);
}
/* Czy klub musi w tej kolejce oszczędzać na gwiazdach?
   Zaległości wobec kadry (arr) albo puste konto przy niespłaconym długu
   oznaczają, że najdroższych zawodników nie ma po prostu za co wystawić. */
function needsSaving(c){
 if(!c) return false;
 return (c.arr||0) > 0 || (c.budget<=0 && (c.debt||0) > 0);
}
/* Jaki procent należności klub jest w stanie realnie przelać.
   Klub z płynnością płaci normalnie. Dziura w kasie = przelew "w miarę możliwości".
   NAPRAWA (feedback: "kluby za mało się zadłużają — na 10 karier zawodnik ani razu
   nie odmówił jazdy"): próg "zdrowego" klubu, który zawsze płaci w całości, był
   ustawiony tak wysoko (health>0.35, 88% szans na pełną wypłatę), że w praktyce
   niemal każdy klub płacił zawsze na czas — dług wobec gracza (c.debt) prawie
   nigdy nie rósł do progu buntu (40 000 zł). Zaostrzone: próg zdrowia klubu niżej,
   szansa na pełną wypłatę niższa, a klub, który raz nie zapłacił, płaci gorzej niż
   wcześniej — dzięki temu zaległości realnie się kumulują u słabszych klubów. */
function payRatioOf(club){
 const health = club.budget/Math.max(1,club.seasonCost||1);
 if(health>0.28 && (club.arr||0)<=0) return chance(72) ? 1 : cl(0.50+RF(0,0.40),0,1);
 let r = 0.15 + cl(health,0,1)*0.85 + (G.p.med/99)*0.08 + RF(-0.12,0.15);
 if(club.budget<=0) r*=0.30;
 if(club.debt>0)    r-=0.14;                 // kto raz nie zapłacił, ten znowu nie zapłaci
 /* SIŁA PRZEBICIA GWIAZDY: skarżono się, że nawet zawodnik z OVR 90+ po sezonie
    z mistrzostwem i średnią 2.7 kończył rok z długami „jak w Gorzowie" — bo
    payRatio zależy WYŁĄCZNIE od kondycji klubu, a gwiazda takiej dźwigni
    w realnym żużlu po prostu ma (albo idzie do prezesa, albo do PZM).
    Próg obniżony z 75 do 55 (granica "zawodowego" kontraktu w mkOffer): to
    właśnie w tym przedziale ląduje utalentowany JUNIOR na kontrakcie
    zawodowym — bez podłogi płacił pełne, dorosłe rachunki (serwis, życie),
    a od klubu dostawał grosze, bo payRatio liczy się wyłącznie z kondycji
    klubu. Podłoga rośnie łagodnie od 55 do 75 OVR, dalej tak jak było. */
 if(G.p.ovr>=55){
   const floor = G.p.ovr>=75 ? 0.35 + (G.p.ovr-75)*0.012 : 0.15 + (G.p.ovr-55)*0.01;
   r = Math.max(r, floor);
 }
 return cl(r,0,1);
}
/* Progi buntu. Młodzi (poniżej 18 lat) wytrzymują dużo więcej niż seniorzy.
   NAPRAWA: progi 100 000/40 000 zł przy tym, jak rzadko dług realnie rósł
   (patrz payRatioOf wyżej), praktycznie nigdy nie były osiągane. Obniżone,
   a szansa na bunt rośnie teraz szybciej z każdą kolejną zaległą transzą. */
function refusalThreshold(age){ return age<18 ? 70000 : 25000; }
function refusalStep(age){      return age<18 ?  8000 :  6000; }
function refusalChance(age, debt){
 const th=refusalThreshold(age);
 if(debt<th) return 0;
 return cl(10 + Math.floor((debt-th)/refusalStep(age))*10, 0, 95);
}
/* Bunty w klubach AI — kadra klubu bez kasy zaczyna odmawiać jazdy.
   Odmowa ma boleć: buntuje się do czterech zawodników naraz, a wracają dopiero
   po REALNEJ spłacie (próg zejścia jest niżej niż próg wejścia w bunt).
   Kiedy trzeba kogoś dosłać, żeby w ogóle odbyć mecz, wraca NAJTAŃSZY — gwiazda
   zostaje w domu, bo to jej klub jest winien najwięcej. */
function aiStrikes(){
 allClubs().forEach(c=>{
  const sq=squadOf(c.name).filter(r=>!r.me);
  if(!sq.length) return;
  const share=(c.arr||0)/sq.length;
  let striking=sq.filter(r=>r.strike).length;
  sq.forEach(r=>{
    if(r.strike){ if(share < refusalThreshold(r.age)*0.5) r.strike=false; return; }
    const ch=refusalChance(r.age, share);
    if(ch>0 && striking<4 && chance(ch*0.85)){ r.strike=true; striking++; }
  });
  const av=availableRiders(c.name);
  if(av.length<5) sq.filter(r=>r.strike).sort((a,b)=>riderWage(a)-riderWage(b))
    .slice(0,5-av.length).forEach(r=>r.strike=false);
 });
}
 
/* ============================================================
   5b. TERMINARZ + CHRONOLOGICZNA SYMULACJA SEZONU
   Sezon NIE jest liczony jednym płaskim wzorem. Rozgrywamy 14 kolejek
   po kolei; po każdej z nich aktualizujemy budżety, długi, formę
   zawodników i skład na kolejny mecz.
   ============================================================ */
function makeSchedule(names){
 const arr=shuffle(names), n=arr.length, first=[];
 for(let r=0;r<n-1;r++){
   const pairs=[];
   for(let i=0;i<n/2;i++){
     const a=arr[i], b=arr[n-1-i];
     pairs.push((r+i)%2===0?[a,b]:[b,a]);
   }
   first.push(pairs);
   arr.splice(1,0,arr.pop());                 // rotacja karuzeli
 }
 return [...first, ...first.map(rd=>rd.map(([h,a])=>[a,h]))];   // runda rewanżowa
}
/* Dostępność gracza w danej kolejce (null = jedzie). */
/* Katastrofa: zerwane więzadła krzyżowe albo złamana kość udowa.
   Losowana tabelka opisów, żeby raport nie brzmiał zawsze tak samo. */
const CAT_INJ=[
 'Zerwane więzadła krzyżowe w kolanie — rekonstrukcja z własnego ścięgna.',
 'Złamanie kości udowej z przemieszczeniem — gwóźdź śródszpikowy.',
 'Wieloodłamowe złamanie udu i zerwane więzadła poboczne.',
 'Zerwane więzadła w stawie skokowym i złamanie piszczeli — dwie operacje.'
];
function playerRoundStatus(rd){
 const p=G.p, S=G.S;
 if(p.banSeasons>0)                    return 'DYSKWALIFIKACJA';
 /* CAŁY ROK W GIPSIE — skutek zerwanych więzadeł / złamanego udu z poprzedniego sezonu */
 if(S.longInjury)                      return 'KONTUZJA DŁUGOTERMINOWA — CAŁY SEZON';
 if(S.zeroMatches)                     return 'KARA PREZESA';
 if(S.forcedEnd && rd>=S.forcedFrom)   return 'DECYZJA POZABOISKOWA';
 if(S.walkRound===rd)                  return 'WALKOWER';
 if(S.injLeft>0){ S.injLeft--;         return 'KONTUZJA'; }
 if(S.banLeft>0){ S.banLeft--;         return 'ZAWIESZENIE'; }
 if(S.striking)                        return 'ODMOWA JAZDY — KLUB NIE PŁACI';
 if(!S.injDone && chance(S.injPerRound)){
   S.injDone=true; S.injRound=rd+1;
   /* --- TRZY POZIOMY URAZU ---
      1) katastrofalny (INJ.catP): zerwane więzadła / złamane udo — koniec TEGO
         sezonu i CAŁY KOLEJNY poza torem (p.longInjury),
      2) ciężki (INJ.badP): obojczyk, 8-13 spotkań,
      3) zwykły: 2-7 spotkań. */
   const cat = chance(INJ.catP);
   const bad = cat ? true : chance(INJ.badP);
   S.injCat = cat; S.injBad = bad;
   if(cat){
     S.injCatWhy   = pick(CAT_INJ);
     S.injTotal    = Math.max(1, BAL.rounds-rd);        // reszta sezonu, do ostatniej kolejki
     S.injLeft     = S.injTotal-1;
     S.injDmg      = R(INJ.catDmgMin, INJ.catDmgMax);
     S.forcedEnd   = true;                              // play-off, IMP, DMPJ — wszystko odpada
     S.forcedFrom  = Math.min(S.forcedFrom, rd);
     p.longInjury  = Math.max(p.longInjury||0, INJ.catSeasons);
     p.longInjuryWhy = S.injCatWhy;
     S.longInjuryNew = S.injCatWhy;
     S.longInjuryDmg = S.injDmg;
   } else {
     S.injTotal = bad ? R(INJ.badMin, INJ.badMax) : R(INJ.outMin, INJ.outMax);
     S.injLeft  = S.injTotal-1;
     S.injDmg   = bad ? R(INJ.dmgMin+1, INJ.dmgMax+2) : R(INJ.dmgMin, INJ.dmgMax);
   }
   p.ovr=cl(p.ovr-S.injDmg,1,99);
   const me=G.riders.find(r=>r.me); if(me) me.ovr=cl(me.ovr-S.injDmg,1,99);
   return cat ? 'ZERWANE WIĘZADŁA / ZŁAMANE UDO' : 'KONTUZJA';
 }
 return null;
}
/* Rozliczenie gracza po kolejce + próg buntu na następny mecz. */
function settleRound(rd, myClub){
 const p=G.p, S=G.S, club=clubByName(myClub); if(!club) return;
 const L=G.myLog[G.myLog.length-1];
 if(L && L.round===rd+1 && L.rode && L.me && !S.noEarnings && p.banSeasons===0){
   const owed=Math.round((L.me.pts+L.me.bon)*p.contract.rate*S.rateMul);
   const ratio=payRatioOf(club);
   const paid=Math.round(owed*ratio), unpaid=owed-paid;
   p.budget+=paid; p.career.earned+=paid; club.budget-=paid;
   if(unpaid>0) club.debt+=unpaid;
   S.owed+=owed; S.paid+=paid;
   L.owed=owed; L.paid=paid;
 }
 // klub może spłacić zaległości w trakcie sezonu — wtedy wracasz do składu
 const eager = S.striking ? 2.2 : 1;          // gdy odmawiasz jazdy, prezes nagle znajduje kasę
 if(club.debt>0 && club.budget>0 && chance(cl((8+club.budget/150000)*eager,5,80))){
   const pay=Math.min(club.debt, Math.round(club.budget*RF(0.10,0.35)*eager));
   if(pay>0){ club.debt-=pay; club.budget-=pay; p.budget+=pay; p.career.earned+=pay; S.paid+=pay;
     S.payLog.push({round:rd+1, amount:pay, left:club.debt}); }
 }
 if(L) L.debt=club.debt;
 // BUNT: decyzja dotyczy KOLEJNEGO meczu
 const th=refusalThreshold(p.age), ch=refusalChance(p.age, club.debt);
 if(club.debt<th){
   if(S.striking){ S.striking=false; S.strikeLog.push({round:rd+2, back:true}); }
 } else if(!S.striking && chance(ch)){
   S.striking=true; S.strikeLog.push({round:rd+2, back:false, debt:club.debt, ch});
 }
 if(S.striking) S.strikeRounds++;
}
/* Kasa wszystkich klubów po kolejce. */
function clubsAfterRound(){
 allClubs().forEach(c=>{
   c.budget += Math.round(c.incRound||0);
   const cost=Math.round(c.costRound||0);
   if(c.budget>=cost) c.budget-=cost;
   else { const canPay=Math.max(0,c.budget); c.arr=(c.arr||0)+(cost-canPay); c.budget-=canPay; }
   if((c.arr||0)>0 && c.budget>0 && chance(35)){
     const pay=Math.min(c.arr, Math.round(c.budget*RF(0.10,0.35)));
     c.arr-=pay; c.budget-=pay;
   }
 });
}
/* ============================================================
   5b-0. WALKOWER — SPOTKANIE, KTÓRE NIE ZOSTAŁO ROZEGRANE
   ------------------------------------------------------------
   NAPRAWA: wcześniej `G.S.walkower=true` powodowało tylko tyle, że Gracz
   dostawał w jednej kolejce status „WALKOWER" i nie jechał — ale mecz
   rozgrywał się normalnie, wchodził do tabeli z prawdziwym wynikiem,
   a rywal zdobywał punkty na torze. Tekst zdarzenia mówił „0:75", tabela
   pokazywała 44:46. Teraz spotkanie faktycznie się NIE ODBYWA:
     · 'lose' — twoja drużyna oddaje mecz 0:75, rywal bierze 2 pkt
     · 'win'  — rywal się nie stawił: 75:0 dla ciebie
     · 'both' — obustronny walkower: 0:0, NIKT nie dostaje punktów meczowych
     · 'void' — mecz nierozegrany i nieweryfikowany (nie wchodzi do tabeli)
   Do tego S.walkPen zabiera punkty w tabeli (przy 'both' obu drużynom).
   ============================================================ */
const WALK_SCORE = 75;
function applyWalkover(box, h, a, myClub, rd){
 const S=G.S, T=box.T;
 const hi=T.findIndex(x=>x.name===h), ai=T.findIndex(x=>x.name===a);
 if(hi<0||ai<0) return;
 const home = (h===myClub);
 const mode = S.walkMode||'lose';
 let hs=0, as=0, counts=true;
 if(mode==='void')      counts=false;
 else if(mode==='both'){ hs=0; as=0; }
 else if(mode==='win')   { hs=home?WALK_SCORE:0; as=home?0:WALK_SCORE; }
 else                    { hs=home?0:WALK_SCORE; as=home?WALK_SCORE:0; }   // 'lose'
 if(counts){
   T[hi].m++; T[ai].m++;
   T[hi].sf+=hs; T[hi].sa+=as; T[ai].sf+=as; T[ai].sa+=hs;
   if(mode==='both'){ T[hi].l++; T[ai].l++; }                 // walkower obustronny: zero punktów
   else if(hs>as){ T[hi].pts+=2; T[hi].w++; T[ai].l++; }
   else          { T[ai].pts+=2; T[ai].w++; T[hi].l++; }
   // dwumecz liczy się dalej — walkower to też wynik
   const key=[h,a].sort().join('||'), A=box.agg;
   if(!A[key]) A[key]={first:{h,a,hs,as}};
   else {
     const f=A[key].first;
     const g1=(f.h===h)?f.hs+hs:f.hs+as, g2=(f.h===h)?f.as+as:f.as+hs;
     const rowFH=T.find(x=>x.name===f.h), rowFA=T.find(x=>x.name===f.a);
     if(rowFH&&rowFA){ if(g1>g2){rowFH.pts++;rowFH.bon++;} else if(g2>g1){rowFA.pts++;rowFA.bon++;} }
     A[key].done=true;
   }
   box.RS.push({round:rd+1, h, a, hs, as, me:null, heats:[], walk:mode});
 }
 /* KARA W TABELI (obchod / świstek: „obie drużyny tracą po punkcie") */
 const pen=S.walkPen||0;
 if(pen){
   const mineRow = home?T[hi]:T[ai], oppRow = home?T[ai]:T[hi];
   if(mineRow) mineRow.pts-=pen;
   if(mode==='both' && oppRow) oppRow.pts-=pen;
 }
 G.myLog.push({round:rd+1, home, opp:home?a:h,
   teamFor:home?hs:as, teamAgn:home?as:hs,
   rode:false, me:null, savedIn:false, gap:null, reg:false, walk:mode,
   why:'WALKOWER — '+({lose:'oddaliście spotkanie 0:75', win:'rywal się nie stawił (75:0)',
        both:'obustronny, 0:0', void:'mecz nierozegrany'}[mode]||'0:75')});
}

function simSeasonChrono(ctx, myLk, myClub, ptsPen){
 const meR=G.riders.find(r=>r.me);
 const st={};
 LKEYS.forEach(k=>{
   const clubs=G.leagues[k].clubs;
   st[k]={ T:clubs.map((c,i)=>({i,name:c.name,m:0,w:0,d:0,l:0,pts:0,bon:0,sf:0,sa:0})),
           RS:[], sched:makeSchedule(clubs.map(c=>c.name)), agg:{} };
 });
 G.myLog=[];
 /* Zimowa dyspozycja: nikt nie wjeżdża w sezon "na zero". Jeden przepracował zimę
    w Hiszpanii, drugi wrócił z brzuchem — dlatego skład na pierwszą kolejkę nie jest
    zwykłym rankingiem OVR, tylko realną oceną tego, kto jak wygląda na treningach. */
 allClubs().forEach(c=>{ clubSeasonBudget(c);
   squadOf(c.name).forEach(r=>{ r.strike=false; r.form=cl(gauss(0,3.2),-9,9); }); });
 
 for(let rd=0; rd<BAL.rounds; rd++){
   G.roundNo=rd+1;
   let status = (ctx&&myClub) ? playerRoundStatus(rd) : null;
   /* --- NIEOCZEKIWANE ZDARZENIE TEJ KOLEJKI (5% łącznie) --- */
   let sur=null, biasBoost=0;
   if(ctx && myClub && meR && !status){
     sur = rollRoundSurprise(rd, myClub, meR);
     if(sur){
       if(G.S){ G.S.surprises=G.S.surprises||[]; G.S.surprises.push(sur); }
       if(sur.forceOut) status = sur.forceOut;
       if(sur.forceIn && ctx.bias){ biasBoost=SURPRISE.jumpBias; ctx.bias.v += biasBoost; }
     }
   }
   /* --- SZANSA NA SKŁAD PRZED TĄ KOLEJKĄ ---
      Liczona z REALNEJ dyspozycji kadry na dziś, więc zmienia się z tygodnia
      na tydzień. Zapisujemy ją do dziennika, żeby gracz widział w tabeli,
      czy ławka była pechem, czy arytmetyką. */
   let chanceNow=null;
   if(ctx && myClub && meR) chanceNow = status ? 0 : appearanceChanceNow(myClub, meR, ctx.bias);
   if(meR) meR.out = !!status;                      // trener nie ma cię do dyspozycji
   LKEYS.forEach(k=>{
     (st[k].sched[rd]||[]).forEach(([h,a])=>{
       const mine = myClub && k===myLk && (h===myClub||a===myClub);
       /* WALKOWER: to spotkanie w ogóle się nie odbywa — nie symulujemy go. */
       if(mine && G.S && G.S.walkower && rd===G.S.walkRound){
         applyWalkover(st[k], h, a, myClub, rd);
         return;
       }
       const c = (mine && ctx && !status) ? ctx : null;
       /* OSZCZĘDZANIE NA GWIAZDACH: klub z zaległościami wobec kadry albo
          z pustym kontem przy niespłaconym długu zostawia gwiazdy w domu. */
       const save = {h:needsSaving(clubByName(h)), a:needsSaving(clubByName(a))};
       const M = simMeeting(h, a, c, c?c.meId:null, save);
       if(!M) return;
       const T=st[k].T, hi=T.findIndex(x=>x.name===h), ai=T.findIndex(x=>x.name===a);
       if(hi<0||ai<0) return;
       T[hi].m++; T[ai].m++;
       T[hi].sf+=M.hs; T[hi].sa+=M.as; T[ai].sf+=M.as; T[ai].sa+=M.hs;
       if(M.hs>M.as){T[hi].pts+=2;T[hi].w++;T[ai].l++;}
       else if(M.hs<M.as){T[ai].pts+=2;T[ai].w++;T[hi].l++;}
       else {T[hi].pts++;T[ai].pts++;T[hi].d++;T[ai].d++;}
       /* ------------------------------------------------------------
          PUNKT BONUSOWY ZA WYGRANY DWUMECZ — POPRAWIONA LOGIKA
          Stary kod: `if(g1>g2){rowH.pts++;...} else if(g2>g1){rowA.pts++;...}`
          był ODWRÓCONY. W terminarzu rewanż ma zamienione role (f.h === a),
          więc g1 = f.hs + M.as to dorobek klubu `f.h`, czyli GOŚCIA tego meczu
          (rowA), a nie gospodarza. Punkt bonusowy trafiał do przegranego.
          Teraz liczymy jawnie po NAZWACH klubów z pierwszego meczu — wynik jest
          poprawny niezależnie od tego, kto był gospodarzem którego spotkania.
          ------------------------------------------------------------ */
       const key=[h,a].sort().join('||'), A=st[k].agg;
       if(!A[key]) A[key]={first:{h,a,hs:M.hs,as:M.as}};
       else {
         const f=A[key].first;
         const g1 = f.h===h ? f.hs+M.hs : f.hs+M.as;    // dorobek klubu f.h w dwumeczu
         const g2 = f.h===h ? f.as+M.as : f.as+M.hs;    // dorobek klubu f.a w dwumeczu
         const rowFH = T.find(x=>x.name===f.h), rowFA = T.find(x=>x.name===f.a);
         if(rowFH && rowFA){
           if(g1>g2){ rowFH.pts++; rowFH.bon++; }
           else if(g2>g1){ rowFA.pts++; rowFA.bon++; }
         }
         A[key].done=true;
       }
       st[k].RS.push({round:rd+1,h,a,hs:M.hs,as:M.as,me:c?M.me:null,heats:M.heats,lineH:M.lineH,lineA:M.lineA});
       if(mine){
         const home=h===myClub, rode=!!(c&&M.me&&M.me.starts>0);
         const savedIn = rode && !!M.saveIn;
         if(savedIn && G.S) G.S.saveIn=(G.S.saveIn||0)+1;
         G.myLog.push({round:rd+1, home, opp:home?a:h,
           teamFor:home?M.hs:M.as, teamAgn:home?M.as:M.hs,
           rode, me:rode?M.me:null, savedIn, gap: rode?null:M.meGap, reg: rode?false:!!M.meReg,
           chance: chanceNow, sur: sur?{kind:sur.kind, log:sur.log}:null,
           why: status || (c? 'ŁAWKA / POZA SKŁADEM' : 'BRAK MIEJSCA W SKŁADZIE')});
       }
     });
   });
   /* --- SPRZĄTANIE PO NIEOCZEKIWANYM ZDARZENIU ---
      Efekty formy zostają (mają boleć albo cieszyć przez kilka kolejek),
      ale zbiorowa kontuzja kadry i podbicie u trenera dotyczą TEJ jednej kolejki. */
   if(sur){
     sur.hidden.forEach(r=>{ r.inj=0; });
     if(biasBoost && ctx.bias) ctx.bias.v -= biasBoost;
   }
   clubsAfterRound();
   aiStrikes();
   if(ctx&&myClub) settleRound(rd, myClub);
 }
 if(meR) meR.out=false;
 LKEYS.forEach(k=>{
   if(ptsPen && myClub && k===myLk){ const row=st[k].T.find(x=>x.name===myClub); if(row) row.pts+=ptsPen; }
   st[k].T.sort((a,b)=> b.pts-a.pts || (b.sf-b.sa)-(a.sf-a.sa) || b.sf-a.sf);
   G.tables[k]=st[k].T; G.results[k]=st[k].RS;
 });
}
 
/* ============================================================
   5b-bis. PATO-EKOSYSTEM: CO SIĘ DZIEJE Z KLUBAMI PO SEZONIE
   Gospodarność (wpływy kontra wydatki na kontrakty) + rzut kością
   na wydarzenia, które w polskim żużlu zdarzają się naprawdę.
   ============================================================ */
function applySquadOvr(c, d){
 if(!d) return;
 /* Wspólna korekta po sezonie ROZJEŻDŻA się na zawodnikach (gauss), a potem
    i tak przechodzi anty-klon — bez tego cała kadra dostawała identyczną
    liczbę i po dwóch sezonach połowa drużyny miała ten sam OVR. */
 squadOf(c.name).forEach(r=>{ if(r.me) return; r.ovr=cl(Math.round(r.ovr+d+gauss(0,1.4)),1,99); });
 dedupeSquadOvr(c.name);
 c.ovr=squadStrength(c.name);
}
/* ============================================================
   5b-ter. SPONSORZY TYTULARNI — „ZŁOMREX MOJEKAJMANY META GNIEZNO"
   ------------------------------------------------------------
   Klub trzyma listę `c.titles` = [{n, grp:'A'|'B', years, left, cash}] oraz
   nazwę bazową `c.base` (bez sponsorów). Pełna nazwa to sponsorzy doklejeni
   PRZED bazą. Zmiana nazwy wchodzi w życie DOPIERO W NOWYM ROKU
   (applyPendingSponsors() z nextYear/skipYear/mechanicPath) — gdybyśmy
   przechrzcili klub w trakcie rozliczania sezonu, promotionsRelegations()
   i tabele z runPhase (trzymające NAZWY, nie referencje) przestałyby się
   zgadzać i klub wypadłby z awansów/spadków.

   GRUPA A: mały przelew co sezon, zero ryzyka.
   GRUPA B: ogromne wejście, po 1-2 sezonach ucieczka, dziura w kasie,
            zaległości wobec kadry i (z dużą szansą) syndyk. Uciekinier
            ląduje w G.bannedSponsors i nigdy nie wraca do gry.
   Każdy sponsor powyżej pierwszego to kara do OVR klubu (SPON.ovrPen).
   ============================================================ */
function clubTitles(c){ if(!c) return []; if(!Array.isArray(c.titles)) c.titles=[]; return c.titles; }
function titleCount(c){ return clubTitles(c).length; }
function clubBaseName(c){ if(!c.base) c.base=c.name; return c.base; }
function composeClubName(c){
 const t=clubTitles(c).map(s=>s.n).filter(Boolean);
 return (t.length ? t.join(' ')+' ' : '') + clubBaseName(c);
}
function sponsorPen(n){ return SPON.ovrPen[cl(n,0,SPON.ovrPen.length-1)]||0; }
function sponsorInUse(name){ return allClubs().some(c=>clubTitles(c).some(s=>s.n===name)); }
function freeSponsors(pool){
 const ban=new Set(G.bannedSponsors||[]);
 return (pool||[]).filter(n=>n && !ban.has(n) && !sponsorInUse(n));
}
/* Zmiana nazwy klubu w CAŁEJ grze: kadra, Gracz, mapa starych nazw. */
function renameClub(c, nn){
 const old=c.name;
 if(!nn || nn===old) return null;
 let uniq=nn, g=2;
 while(allClubs().some(x=>x!==c && x.name===uniq)) uniq=nn+' '+(g++);
 c.name=uniq;
 G.riders.forEach(r=>{ if(r.club===old) r.club=uniq; });
 if(G.p && G.p.club===old) G.p.club=uniq;
 G.renamed=G.renamed||{}; G.renamed[old]=uniq;
 return {old, now:uniq};
}
function applyPendingSponsors(){
 const out=[];
 G.renamed={};
 allClubs().forEach(c=>{ const r=renameClub(c, composeClubName(c)); if(r) out.push(r); });
 G.sponsorRenames=out;
 return out;
}
/* Jeden sezon życia sponsorskiego jednego klubu. Zwraca {d, bkWhy}. */
function sponsorSeason(c, k, log){
 let d=0;
 const titles=clubTitles(c);
 clubBaseName(c);
 const before=titles.length;
 const inc=LEAGUE_INC[k]||LEAGUE_INC.KL;

 /* --- 1) PRZELEWY OD OBECNYCH + TYKAJĄCY ZEGAR GRUPY B --- */
 const runaways=[];
 for(let i=titles.length-1;i>=0;i--){
   const s=titles[i];
   s.years=(s.years||0)+1;
   if(s.grp==='A'){
     const cash=Math.round(inc*RF(SPON.aCash[0],SPON.aCash[1]));
     c.budget+=cash; s.paid=(s.paid||0)+cash;
   } else {
     if(s.left==null) s.left=R(SPON.bLife[0],SPON.bLife[1]);
     s.left--;
     if(s.left<=0){ titles.splice(i,1); runaways.push(s); }
   }
 }

 /* --- 2) UCIECZKA OSZUSTA: dziura w kasie, zaległości, syndyk --- */
 let bkWhy=null;
 runaways.forEach(s=>{
   /* „Potężny dług i ujemny budżet" musi być POTĘŻNY i musi być UJEMNY —
      inaczej bogaty klub wchłaniał ucieczkę oszusta bez mrugnięcia okiem
      i syndyk nigdy nie wchodził. Dziura jest więc nie mniejsza niż to,
      co potrzebne, żeby zejść pod próg BANKRUPTCY.deepMinus. */
   const cost=Math.max(1, c.seasonCost||inc);
   const minHole=Math.max(0,c.budget) + Math.round(Math.max(300000, cost*BANKRUPTCY.deepMinus*1.25));
   const hole=Math.max(Math.round((s.cash||inc*0.8)*RF(SPON.bHole[0],SPON.bHole[1])), minHole);
   const arr =Math.round(hole*SPON.bArrShare);
   c.budget-=hole;
   c.arr=(c.arr||0)+arr;
   G.bannedSponsors=G.bannedSponsors||[];
   if(!G.bannedSponsors.includes(s.n)) G.bannedSponsors.push(s.n);
   log.push({club:c.name, lk:k, t:'SPONSOR TYTULARNY UCIEKŁ Z KASĄ', d:'−'+zl(hole), good:false,
     x:s.n+' zniknął po '+s.years+(s.years===1?' sezonie':' sezonach')+': konta wyczyszczone, faktury '+
       'niezapłacone, prezes dowiedział się z portalu. Dziura '+zl(hole)+', zaległości wobec kadry +'+zl(arr)+
       '. Od nowego sezonu klub nazywa się '+composeClubName(c)+
       '. Firma trafia na czarną listę i nigdy już nie pojawi się w tej lidze.'});
   if(c.budget<0 && chance(BANKRUPTCY.onSponsorRun))
     bkWhy='Sponsor tytularny '+s.n+' uciekł z kasą i zostawił dziurę '+zl(-c.budget)+'. Wierzyciele nie czekali na wyjaśnienia.';
 });

 /* --- 3) NOWY SPONSOR TYTULARNY (od 1 do 3 naraz) --- */
 if(titles.length<SPON.max){
   let ch=SPON.addBase - titles.length*SPON.addPerHave;
   if(c.budget<=0 || (c.arr||0)>0) ch+=SPON.addPoor;      // desperacja zarządu
   if(chance(cl(ch,1,80))){
     const poolB=freeSponsors(SPONSORS_B), poolA=freeSponsors(SPONSORS_A);
     const wantB=chance(SPON.bChance);
     const grp = (wantB && poolB.length) ? 'B' : (poolA.length ? 'A' : null);
     if(grp==='A'){
       const n=pick(poolA), cash=Math.round(inc*RF(SPON.aCash[0],SPON.aCash[1]));
       c.budget+=cash;
       titles.push({n, grp:'A', years:0, cash, paid:cash});
       log.push({club:c.name, lk:k, t:'NOWY SPONSOR TYTULARNY', d:'+'+zl(cash), good:true,
         x:n+' wchodzi do nazwy klubu — od nowego sezonu: '+composeClubName(c)+
           '. Pieniędzy tyle, co kot napłakał, ale przelew przychodzi na czas i będzie przychodził co roku.'});
     } else if(grp==='B'){
       const n=pick(poolB), cash=Math.round(inc*RF(SPON.bCash[0],SPON.bCash[1]));
       c.budget+=cash;
       titles.push({n, grp:'B', years:0, left:R(SPON.bLife[0],SPON.bLife[1]), cash});
       log.push({club:c.name, lk:k, t:'WIELKI SPONSOR TYTULARNY — KASA JAK Z BAJKI', d:'+'+zl(cash), good:true,
         x:n+' wykłada '+zl(cash)+' i wchodzi do nazwy: '+composeClubName(c)+
           '. Prezes mówi o przełomie, księgowa o zaliczkach, a nikt nie pytał, skąd te pieniądze.'});
     }
   }
 }

 /* --- 4) KARA ZA BYCIE SŁUPEM OGŁOSZENIOWYM --- */
 const after=titles.length;
 const pd=sponsorPen(after)-sponsorPen(before);
 if(pd){
   d+=pd;
   log.push({club:c.name, lk:k, t:(pd<0?'SZATNIA O KOLEJNYM SPONSORZE':'JEDEN SZYLD MNIEJ'),
     d:(pd>0?'+':'')+pd+' OVR', good:pd>0,
     x: pd<0
       ? 'Kevlar wygląda jak tablica ogłoszeń, a nazwa klubu nie mieści się w tabeli. '+after+
         ' sponsorów tytularnych to łącznie '+sponsorPen(after)+' OVR — szatnia wie, że to nie potęga, tylko desperacja zarządu.'
       : 'Nazwa znowu mieści się w jednej linijce. Kadra odetchnęła ('+(pd>0?'+':'')+pd+' OVR).'});
 }
 c.pendingName=composeClubName(c);
 return {d, bkWhy};
}

function clubEconomy(){
 const log=[];
 LKEYS.forEach(k=>{
  const ord=(G.phase[k]&&G.phase[k].order)||[];
  G.leagues[k].clubs.forEach(c=>{
   const idx=ord.indexOf(c.name), pos = idx>=0 ? idx+1 : 5;
   const inc=c.seasonIncome||LEAGUE_INC[k], cost=c.seasonCost||inc;
   const prize=Math.round(LEAGUE_INC[k]*(0.34-0.042*(pos-1)));      // nagrody, frekwencja, TV
   c.budget+=prize;
   const bal=inc+prize-cost;
   let d=0, why=null;
   if(bal < -0.08*inc){                                             // przepłacone kontrakty
     d -= 1+Math.min(6, Math.round(-bal/(inc*0.15)));
     c.budget -= Math.round(Math.min(-bal*0.35, Math.max(0,c.budget)*0.5));
     why='przepłacone kontrakty ('+zl(-bal)+' pod kreską)';
   } else if(bal > 0.10*inc && pos<=4){                             // sukces + rozsądek
     d += 1+Math.min(5, Math.round(bal/(inc*0.22)));
     why='wyniki i zdrowe finanse (+'+zl(bal)+')';
   } else if(bal>0) d += R(0,1);
   if(pos<=2) d+=R(0,2);
   if(pos>=7) d-=R(0,2);
   if((c.arr||0)>0){ d-=R(1,3); why=why||'zaległości wobec kadry ('+zl(c.arr)+')'; }
 
   /* --- gotówka zamienia się w kadrę, a dziura w kasie w wyprzedaż --- */
   const excess=c.budget-cost*1.5;
   if(excess>0){ const inv=Math.round(excess*0.45); c.budget-=inv;
     d+=Math.min(7, inv/(cost*0.32)); why=why||'transfery za nadwyżkę ('+zl(inv)+')'; }
   else if(c.budget<0){ d-=Math.min(7, -c.budget/(cost*0.30));
     c.budget=Math.round(c.budget*0.5); why=why||'wyprzedaż kadry na spłatę dziury'; }
   d=Math.round(d);

   /* --- SPONSORZY TYTULARNI: przelewy, ucieczki oszustów, nowe szyldy --- */
   const spon = sponsorSeason(c, k, log);
   d += spon.d;

   /* --- RZUT KOŚCIĄ: PATO-ZDARZENIA --- */
   const roll=Math.random()*100;
   let bkWhy=null;                                                  // zapalnik upadłości
   if(roll<5){
     const cash=Math.round(LEAGUE_INC[k]*RF(1.4,3.2));
     c.budget+=cash; d+=R(4,9);
     log.push({club:c.name, lk:k, t:'BOGATY INWESTOR', d:'+'+zl(cash), good:true,
       x:'Człowiek z branży budowlanej pokochał żużel. Na razie.'});
   } else if(roll<10){
     const before=c.budget; c.budget=Math.round(c.budget*RF(0.15,0.40)); d-=R(4,9);
     log.push({club:c.name, lk:k, t:'UTRATA SPÓŁKI SKARBU PAŃSTWA', d:'−'+zl(before-c.budget), good:false,
       x:'Zmiana zarządu, zmiana strategii sponsoringowej. Logo znika z kevlarów.'});
     // spółka odeszła, a w kasie została dziura nie do zasypania
     if(c.budget < -Math.max(300000, cost*BANKRUPTCY.deepMinus) && chance(BANKRUPTCY.onSpoloss))
       bkWhy='Spółka Skarbu Państwa wypisała się ze sponsoringu, a w kasie została dziura '+zl(-c.budget)+'.';
   } else if(roll<11.5){                              // ARESZTOWANIE: 1,5% na klub na sezon
     const before=c.budget; c.budget=Math.round(c.budget*RF(0.05,0.25)); d-=R(7,14);
     c.arr=(c.arr||0)+Math.round(cost*0.25);
     log.push({club:c.name, lk:k, t:'ARESZTOWANIE PREZESA / RADNEGO ZA KORUPCJĘ', d:'−'+zl(before-c.budget), good:false,
       x:'CBA weszło o 6:00. Konta zablokowane, biuro opieczętowane, kadra bez wypłat.'});
     if(chance(BANKRUPTCY.onArrest)) bkWhy='Prezes siedzi, konta zablokowane, licencji nikt nie podpisze.';
   } else if(why && Math.abs(d)>=3){
     log.push({club:c.name, lk:k, t: d>0?'DOBRY ROK W KSIĘGOWOŚCI':'GOSPODARKA KLUBU LEŻY', d:(d>0?'+':'')+d+' OVR', good:d>0, x:why});
   }
   c.budget=Math.round(c.budget);

   /* --- BOMBA ZEGAROWA SPONSORA Z GRUPY B: ma pierwszeństwo przed resztą --- */
   if(!bkWhy && spon.bkWhy) bkWhy=spon.bkWhy;

   /* --- SYNDYK: dług ponad 3 mln przy ujemnym budżecie to rzut monetą --- */
   if(!bkWhy && (c.debt||0) > BANKRUPTCY.debtLimit && c.budget < 0 && chance(BANKRUPTCY.onDebt))
     bkWhy='Dług '+zl(c.debt)+' przy ujemnej kasie. Wierzyciele złożyli wniosek, sąd go przyjął.';
 
   if(bkWhy && !c.bankrupt){
     c.bankrupt = true;
     c.bankruptWhy = bkWhy;
     /* --- ZWALNIANIE GWIAZD ---
        Bankrut nie utrzyma elitarnej kadry. Każdy z OVR > 50 rwie kontrakt
        i ląduje na bezrobociu. Zostaje tylko Gracz — żeby zobaczyć to z bliska. --- */
     let freed=0;
     G.riders.forEach(r=>{
       if(r.retired || r.me) return;
       if(r.club===c.name && r.ovr>50){ r.club=null; freed++; }
     });
     log.push({club:c.name, lk:k, t:'UPADŁOŚĆ KLUBU — WCHODZI SYNDYK', d:freed?freed+' zawodników na bruk':'kadra rozwiązana', good:false, x:bkWhy});
   }
 
   applySquadOvr(c, d);
  });
 });
 G.clubEvents=log;
 return log;
}
 
/* ============================================================
   5b. FAZA PLAY-OFF I PLAY-DOWN
   ============================================================ */
// Dwumecz. cA = wyżej rozstawiony — gospodarz rewanżu, wygrywa przy remisie
// w dwumeczu (bieg dodatkowy). Jeśli w parze jest klub gracza, dopisujemy
// jego linię startową do obu spotkań.
function tie(stage, cA, cB, ctx, myClub){
 const mine = myClub && (cA.name===myClub||cB.name===myClub);
 const c = (ctx && mine) ? ctx : null;
 const M1=simMeeting(cB.name, cA.name, c, c?c.meId:null);   // 1. mecz u niżej rozstawionego
 const M2=simMeeting(cA.name, cB.name, c, c?c.meId:null);   // rewanż u wyżej rozstawionego
 if(!M1||!M2) return {stage,a:cA.name,b:cB.name,legs:[],agA:0,agB:0,win:cA,lose:cB,winner:cA.name};
 const agA=M1.as+M2.hs, agB=M1.hs+M2.as;
 const draw = agA===agB;
 const win = agB>agA ? cB : cA, lose = agB>agA ? cA : cB;
 const legs=[{h:cB.name,aw:cA.name,hs:M1.hs,as:M1.as,me:M1.me,heats:M1.heats},
             {h:cA.name,aw:cB.name,hs:M2.hs,as:M2.as,me:M2.me,heats:M2.heats}];
 return {stage, a:cA.name, b:cB.name, legs, agA, agB, draw, win, lose, winner:win.name};
}
function runPhase(lk, ctx, myClub){
 const T=G.tables[lk], clubs=G.leagues[lk].clubs;
 const C=n=>clubs.find(c=>c.name===n);
 const s=i=>C(T[i].name);
 const rank=n=>T.findIndex(r=>r.name===n);
 const ord=(x,y)=> rank(x.name)<rank(y.name)?[x,y]:[y,x];   // wg rundy zasadniczej
 const ties=[], order=new Array(8);
 
 /* --- PLAY-OFF: 1-4 i 2-3, potem finał --- */
 const sf1=tie('PÓŁFINAŁ', s(0), s(3), ctx, myClub);
 const sf2=tie('PÓŁFINAŁ', s(1), s(2), ctx, myClub);
 ties.push(sf1,sf2);
 const [fa,fb]=ord(sf1.win,sf2.win);
 const fin=tie('FINAŁ', fa, fb, ctx, myClub); ties.push(fin);
 order[0]=fin.winner; order[1]=fin.lose.name;
 const [ta,tb]=ord(sf1.lose,sf2.lose);
 if(lk==='EL'){                                  // mecz o 3. miejsce tylko w Ekstralidze
   const t3=tie('MECZ O 3. MIEJSCE', ta, tb, ctx, myClub); ties.push(t3);
   order[2]=t3.winner; order[3]=t3.lose.name;
 } else { order[2]=ta.name; order[3]=tb.name; }
 
 /* --- PLAY-DOWN: 5-8 i 6-7, przegrani o utrzymanie (nie ma w KLŻ) --- */
 if(lk==='EL'||lk==='E2'){
   const pd1=tie('PLAY-DOWN', s(4), s(7), ctx, myClub);
   const pd2=tie('PLAY-DOWN', s(5), s(6), ctx, myClub);
   ties.push(pd1,pd2);
   const [w1,w2]=ord(pd1.win,pd2.win);
   order[4]=w1.name; order[5]=w2.name;
   const [l1,l2]=ord(pd1.lose,pd2.lose);
   const rel=tie('DWUMECZ O UTRZYMANIE', l1, l2, ctx, myClub); ties.push(rel);
   order[6]=rel.winner;      // ratuje się, ale jedzie baraż
   order[7]=rel.lose.name;   // spada bezpośrednio
 } else {
   order[4]=T[4].name; order[5]=T[5].name; order[6]=T[6].name; order[7]=T[7].name;
 }
 G.phase[lk]={ties, order};
 return G.phase[lk];
}
 
/* ============================================================
   5c. DRUŻYNOWE MISTRZOSTWA POLSKI JUNIORÓW
   Cztery stopnie: eliminacje → ćwierćfinały → półfinały → finał.
   Wszystko rozgrywane czwórmeczami: 4 pkt meczowe za I miejsce,
   3 za II, 2 za III, 1 za IV, plus punkty biegowe (art. 804).
   ============================================================ */
function quad(teams, ctx, myTeam){
 const avg=teams.reduce((a,t)=>a+t.ovr,0)/teams.length;
 let raw=teams.map(t=>Math.max(4, gauss(24+(t.ovr-avg)*0.55, 4.5)));
 const s=raw.reduce((a,b)=>a+b,0);
 let hp=raw.map(v=>Math.round(v*96/s));
 hp[0]+=96-hp.reduce((a,b)=>a+b,0);
 const rows=teams.map((t,i)=>({name:t.name,hp:Math.max(0,hp[i])}));
 rows.sort((a,b)=>b.hp-a.hp);
 // art. 804 ust. 3 — przy równych punktach biegowych dzielimy punkty meczowe
 let i=0;
 while(i<rows.length){
   let j=i; while(j+1<rows.length && rows[j+1].hp===rows[i].hp) j++;
   const share=[];for(let k=i;k<=j;k++) share.push(4-k);
   const val=share.reduce((a,b)=>a+b,0)/share.length;
   for(let k=i;k<=j;k++){rows[k].mp=val;rows[k].tied=j>i;}
   i=j+1;
 }
 const me = (ctx&&myTeam&&teams.some(t=>t.name===myTeam)) ? riderLine({...ctx,heatBase:5,fixed:5}) : null;
 return {rows, me, teams:teams.map(t=>t.name)};
}
function groupStage(teams, rounds, ctx, myTeam){
 const tab=teams.map(t=>({name:t.name,ovr:t.ovr,mp:0,hp:0}));
 const meets=[];
 for(let r=0;r<rounds;r++){
   let sel = teams.length<=4 ? teams : teams.filter((_,i)=>i!==(r%teams.length)).slice(0,4);
   const q=quad(sel,ctx,myTeam);
   q.rows.forEach(row=>{const t=tab.find(x=>x.name===row.name);t.mp+=row.mp;t.hp+=row.hp;});
   meets.push(q);
 }
 tab.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 return {tab, meets};
}
/* Eliminacje i ćwierćfinały DMPJ to poligon dla najsłabszych: trenerzy wysyłają
   tam "wkłady do kevlaru", a sprzęt zostaje w busie. Poziom odniesienia leci
   w dół o kilkanaście punktów, a lepsi juniorzy dołączają dopiero od półfinału. */
const DMPJ_EARLY=['ELIMINACJE','ĆWIERĆFINAŁ'];
function simDMPJ(effOvr, defP, excP, myClub, eligible, skipEarly){
 // TWARDA WERYFIKACJA WIEKU — DMPJ to rozgrywki juniorskie: po 21. urodzinach
 // nie ma znaczenia, co ustalił trener i co mówi prezes. Nie jedziesz.
 if(!isJun(G.p)) eligible=false;
 const all=[];
 LKEYS.forEach(k=>G.leagues[k].clubs.forEach(c=>
   // OVR drużyny juniorskiej wynika z klubu, ale jest solidnie pomieszany —
   // dobry klub bywa pusty na młodzieży i odwrotnie
   all.push({name:c.name, ovr:cl(Math.round(c.ovr-R(12,32)+gauss(0,4)),8,90)})));
 const base={}; all.forEach(t=>base[t.name]=t.ovr);
 const EARLY_PEN=R(15,20);                                   // sztuczne zaniżenie wczesnych faz
 const T=(names,pen)=>names.map(n=>({name:n, ovr:cl(Math.round(base[n]-pen),5,90)}));
 const jAvg  = all.reduce((a,t)=>a+t.ovr,0)/all.length;
 const jAvgE = cl(jAvg-EARLY_PEN,5,90);
 const mkCtx = avg => ({ppr:cl(1.45+(effOvr-avg)*0.052,0.15,2.9), defP, excP, heatBase:5, fixed:5});
 const ctxLate  = eligible ? mkCtx(jAvg)  : null;
 const ctxEarly = (eligible && !skipEarly) ? mkCtx(jAvgE) : null;
 const myLate   = eligible ? myClub : null;
 const myEarly  = (eligible && !skipEarly) ? myClub : null;
 
 for(let i=all.length-1;i>0;i--){const j=R(0,i);[all[i],all[j]]=[all[j],all[i]];}
 const sizes=[5,5,5,5,4], groups=[]; let idx=0;
 sizes.forEach(s=>{const part=all.slice(idx,idx+s); idx+=s; if(part.length) groups.push(T(part.map(t=>t.name),EARLY_PEN));});
 
 /* ELIMINACJE — 5 grup, 4 rundy (obniżony poziom odniesienia) */
 const elim=groups.map((g,i)=>({name:'GRUPA '+String.fromCharCode(65+i), ...groupStage(g,4,ctxEarly,myEarly)}));
 const adv=[], fourths=[];
 elim.forEach(g=>{g.tab.slice(0,3).forEach(t=>adv.push(t)); if(g.tab[3]) fourths.push(g.tab[3]);});
 fourths.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 if(fourths[0]) adv.push(fourths[0]);                 // najlepsza drużyna z 4. miejsc
 
 /* ĆWIERĆFINAŁY — 4 grupy po 4, 4 rundy, awansują po 2 (nadal poligon) */
 adv.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 const qg=[[],[],[],[]]; adv.forEach((t,i)=>qg[i%4].push(t.name));
 const qf=qg.filter(g=>g.length).map((g,i)=>({name:'ĆWIERĆFINAŁ '+(i+1), ...groupStage(T(g,EARLY_PEN),4,ctxEarly,myEarly)}));
 const adv2=[]; qf.forEach(g=>g.tab.slice(0,2).forEach(t=>adv2.push(t)));
 
 /* PÓŁFINAŁY — 2 grupy po 4, 4 rundy, awansują po 2 (pełny poziom, wchodzą lepsi) */
 adv2.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 const sg=[[],[]]; adv2.forEach((t,i)=>sg[i%2].push(t.name));
 const sf=sg.filter(g=>g.length).map((g,i)=>({name:'PÓŁFINAŁ '+(i+1), ...groupStage(T(g,0),4,ctxLate,myLate)}));
 const fin4=[]; sf.forEach(g=>g.tab.slice(0,2).forEach(t=>fin4.push(t.name)));
 
 /* FINAŁ — cztery turnieje tej samej czwórki */
 const finale=groupStage(T(fin4,0),4,ctxLate,myLate);
 
 /* --- ŚCIEŻKA GRACZA + JEGO DOROBEK --- */
 const stages=[{k:'ELIMINACJE',gs:elim,my:myEarly},{k:'ĆWIERĆFINAŁ',gs:qf,my:myEarly},
               {k:'PÓŁFINAŁ',gs:sf,my:myLate},{k:'FINAŁ',gs:[finale],my:myLate}];
 const me={starts:0,heats:0,pts:0,bon:0,def:0,exc:0,lines:[]};
 let reached = skipEarly ? 'DRUŻYNA ODPADŁA PRZED PÓŁFINAŁEM (BEZ CIEBIE)' : 'NIE ZAKWALIFIKOWAŁ SIĘ', myGroup=null;
 if(eligible){
   stages.forEach(st=>{
     const mt=st.my; if(!mt) return;                       // faza rozegrana bez ciebie: kody puste
     st.gs.forEach(g=>{
       if(!g.tab.some(t=>t.name===mt)) return;
       if(st.k==='ELIMINACJE') myGroup=g;
       reached=st.k;
       g.meets.forEach((q,i)=>{ if(!q.me) return;
         me.starts++; me.heats+=q.me.h; me.pts+=q.me.mp; me.bon+=q.me.mb; me.def+=q.me.d; me.exc+=q.me.w;
         const row=q.rows.find(r=>r.name===mt);
         me.lines.push({stage:st.k+(st.gs.length>1?' · '+g.name:''), round:i+1,
           teamPos:q.rows.indexOf(row)+1, teamHp:row?row.hp:0, codes:q.me.codes, mp:q.me.mp});
       });
     });
   });
 }
 me.avg = me.heats>0 ? me.pts/me.heats : 0;
 me.avgTxt = me.heats>0 ? me.avg.toFixed(2) : '—';
 const classification=finale.tab.map(t=>t.name);
 return {elim, qf, sf, finale, classification, me, reached, myGroup, eligible,
         myTeam:eligible?myClub:null, skipEarly:!!skipEarly, earlyPen:EARLY_PEN};
}
 
/* ============================================================
   5d. ZAWODY INDYWIDUALNE
   IMP · MIMP · ZŁOTY / SREBRNY / BRĄZOWY KASK
   Wszystko wg tabeli 20-biegowej: 16 zawodników, po 5 startów.
   ============================================================ */
let RID=1;
function blankSea(){return {m:0,starts:0,pts:0,bon:0,def:0,exc:0,rep:0};}
function makeRider(age,ovr,club,pot){
 const o=cl(Math.round(ovr),1,99);
 const p=cl(Math.round(pot!==undefined?pot:o+(age<=21?R(12,30):age<=24?R(4,12):R(0,3))),o,99);
 return {id:RID++, name:pick(IMIE)+' '+pick(NAZW), age, ovr:o, pot:p,
   club:club||null, retired:false, me:false, inj:0, out:false, strike:false, form:0, sea:blankSea()};
}
/* TWARDA DEFINICJA WIEKU — jedno miejsce dla całej gry.
   Junior (młodzieżowiec) to zawodnik, który ma NIE WIĘCEJ niż 21 lat. Kropka.
   Zero wyjątków, zero "no ale on jeszcze się łapie". */
const junAge = r => (r && r.age!=null && isFinite(Number(r.age))) ? Number(r.age) : Infinity;
const isJun = r => junAge(r) <= 21;   // zawodnik młodzieżowy (numery 6,7 / 14,15)
const isU24 = r => junAge(r) <= 24;   // numery 8 / 16
const isU19 = r => junAge(r) <= 19;   // Brązowy Kask
/* --- KONTUZJA DŁUGOTERMINOWA — JEDNA DEFINICJA DLA WSZYSTKICH ZDARZEŃ ---
   Feedback graczy: w przerwie międzysezonowej, z zerwanymi więzadłami (cały
   sezon i cały kolejny rok poza torem, p.longInjury>0), wciąż potrafiły trafić
   się zdarzenia w rodzaju "Taniec z gwiazdami" albo obozu treningowego — rzeczy
   fizycznie niemożliwe dla kogoś w gipsie. `injured(p)` to jeden warunek, który
   czytają cond() zdarzeń wymagających sprawności fizycznej (patrz EVENTS/
   WINTER_EVENTS w data.js) — zamiast każde z osobna zgadywać, czy gracz jest
   akurat na chodzie. */
const injured = p => !!(p && (p.longInjury||0) > 0);
 
/* --- KADRY KLUBOWE (SKALA 1:1) ---
   OVR klubu to poziom jego pierwszej piątki. Klub 95 ma piątkę w okolicach 95,
   juniorzy siedzą 15-30 punktów niżej i dopiero z wiekiem podchodzą pod kadrę. --- */
const junOvr = (L,age) => L - (22-age)*5.0 - R(0,6);      // 16 lat: ~L-36, 21 lat: ~L-8
function genSquad(club){
 const L=riderLevel(club), sq=[];
 /* PIERWSZA PIĄTKA — DRABINKA, NIE PIĘĆ LOSÓW Z JEDNEGO ROZKŁADU.
    Wcześniej każdy z piątki losował się z gauss(L-1, 4.2) i był obcinany do 99.
    W klubie o OVR 93-95 oznaczało to, że dwóch, trzech, a czasem czterech
    zawodników lądowało dokładnie na tej samej liczbie — stąd wrażenie
    „zaciętego seeda". Teraz każdy numer ma własny poziom odniesienia
    (lider, drugi zawodnik, trzeci…), a rozrzut jest węższy, więc kolejność
    w drużynie ma sens i nie ma zlepków. */
 const ladder=[3.4, 1.2, -0.7, -2.6, -5.0];
 ladder.forEach(off=>sq.push(makeRider(R(23,36), gauss(L-1+off, 2.7), club.name)));
 sq.push(makeRider(R(22,24), gauss(L-7,5), club.name));                            // zawodnik U24
 sq.push(makeRider(R(25,34), gauss(L-9,5), club.name));                            // rezerwowy senior
 for(let i=0;i<4;i++){ const a=R(16,21); sq.push(makeRider(a, junOvr(L,a)+gauss(0,3), club.name, gauss(L-2,7))); }
 dedupeSquadOvr(club.name);
 return sq;
}
function allClubs(){const o=[];LKEYS.forEach(k=>G.leagues[k].clubs.forEach(c=>o.push(c)));return o;}
function squadOf(name){return G.riders.filter(r=>!r.retired && r.club===name);}
// zawodnicy realnie do dyspozycji trenera (bez kontuzjowanych i buntujących się)
function availableRiders(name){return G.riders.filter(r=>!r.retired && r.club===name && !r.inj && !r.strike && !r.out);}
// OVR klubu = poziom pierwszej piątki, z lekką korektą na jakość młodzieży
function squadStrength(name){
 const sq=squadOf(name);
 if(!sq.length) return 20;
 const top=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,5);
 const jun=sq.filter(isJun);
 const t=top.reduce((a,r)=>a+r.ovr,0)/top.length;
 const j=jun.length? jun.reduce((a,r)=>a+r.ovr,0)/jun.length : t-20;
 return cl(Math.round(t*0.88 + (j+20)*0.12),15,99);
}
function genAllSquads(){
 G.riders=[];
 allClubs().forEach(c=>{ genSquad(c).forEach(r=>G.riders.push(r)); });
 // dostrojenie: przesuwamy kadrę tak, żeby jej siła zgadzała się z OVR klubu.
 // UWAGA: przesunięcie dostaje własny szum na zawodnika — identyczna poprawka
 // dla wszystkich była drugim źródłem powtarzalnych OVR.
 for(let pass=0;pass<5;pass++){
   allClubs().forEach(c=>{
     const diff=c.ovr-squadStrength(c.name);
     if(Math.abs(diff)<1) return;
     squadOf(c.name).forEach(r=>{ if(r.me) return; r.ovr=cl(Math.round(r.ovr+diff*0.9+gauss(0,0.7)),1,99); });
   });
 }
 dedupeAllSquads();
 allClubs().forEach(c=>{ c.ovr=squadStrength(c.name); });
}
function ageRiders(){
 G.riders.forEach(r=>{
   if(r.me) return;
   r.age++; r.inj=0; r.out=false; r.strike=false; r.form=0; r.sea=blankSea();
   let g = r.age<=21?7.4 : r.age<=24?4.4 : r.age<=28?1.8 : r.age<=32?0.1 : r.age<=36?-2.6 : -5;
   if(g>0) g *= cl(((r.pot||r.ovr+6)-r.ovr)/9, 0, 1);        // im bliżej sufitu, tym wolniej
   r.ovr = cl(Math.round(r.ovr+g+gauss(0,2.0)),1,99);
   if(r.age>=R(33,41) && chance(28)) r.retired=true;
   if(r.age>41) r.retired=true;
 });
 G.riders=G.riders.filter(r=>!r.retired||r.me);
 // uzupełnienie kadr: junior z własnego szkolenia albo transfer
 allClubs().forEach(c=>{
   const sq=squadOf(c.name), L=riderLevel(c);
   const jun=sq.filter(isJun).length, sen=sq.filter(r=>!isU24(r)).length;
   for(let i=jun;i<3;i++) G.riders.push(makeRider(16, junOvr(L,16)+gauss(0,4), c.name, gauss(L-2,7)));
   for(let i=sen;i<5;i++) G.riders.push(makeRider(R(23,30), gauss(L-3,5), c.name));
   while(squadOf(c.name).length>14){
     const w=squadOf(c.name).filter(r=>!r.me).sort((a,b)=>a.ovr-b.ovr)[0];
     if(!w) break; w.retired=true;
   }
 });
 // transfery: kilku zawodników zmienia barwy
 const pool=G.riders.filter(r=>!r.retired&&!r.me);
 for(let i=0;i<10;i++){
   const r=pick(pool), target=pick(allClubs());
   if(!r||!target||r.club===target.name) continue;
   if(squadOf(target.name).length>=13) continue;
   if(Math.abs(r.ovr-riderLevel(target))>18) continue;
   r.club=target.name;
 }
 // stabilizacja poziomu: liga jako całość nie może się rozjechać w górę ani w dół,
 // ale poszczególne kluby wciąż rosną i podupadają względem siebie (patrz clubEconomy)
 dedupeAllSquads();
 allClubs().forEach(c=>{ c.ovr=squadStrength(c.name); });
 const TARGET={EL:85.0, E2:65.0, KL:45.0};
 LKEYS.forEach(k=>{
   const cs=G.leagues[k].clubs;
   const avg=cs.reduce((a,c)=>a+c.ovr,0)/cs.length;
   const drift=TARGET[k]-avg;
   if(Math.abs(drift)<3) return;                       // słaba korekta — kluby mają prawo się rozjechać
   cs.forEach(c=>squadOf(c.name).forEach(r=>{ if(!r.me) r.ovr=cl(Math.round(r.ovr+drift*0.30+gauss(0,0.6)),1,99); }));
 });
 dedupeAllSquads();
 allClubs().forEach(c=>{ c.ovr=squadStrength(c.name); });
}
// ranking krajowy — podstawa nominacji GKSŻ
function ranking(filter){
 const me=G.riders.find(r=>r.me);
 return G.riders.filter(r=>!r.retired && (!filter||filter(r)))
   .map(r=>({...r, score:r.ovr + (r.me?(G.meForm||0):0) + (r.rankBias||0)}))
   .sort((a,b)=>b.score-a.score);
}
 
/* --- Losowanie 20 biegów dla 16 zawodników (każdy po 5 startów) --- */
function heatDraw(){
 for(let att=0;att<300;att++){
   const pool=[]; for(let i=0;i<16;i++) for(let k=0;k<5;k++) pool.push(i);
   for(let i=pool.length-1;i>0;i--){const j=R(0,i);[pool[i],pool[j]]=[pool[j],pool[i]];}
   const heats=[]; let ok=true;
   for(let h=0;h<20 && ok;h++){
     const heat=[];
     for(let s=0;s<4;s++){
       const idx=pool.findIndex(x=>!heat.includes(x));
       if(idx<0){ok=false;break;}
       heat.push(pool[idx]); pool.splice(idx,1);
     }
     if(ok) heats.push(heat);
   }
   if(ok && pool.length===0) return heats;
 }
 const heats=[]; for(let h=0;h<20;h++) heats.push([h%16,(h+1)%16,(h+2)%16,(h+3)%16]);
 return heats;
}
/* --- Jeden bieg: 4 zawodników, punkty 3/2/1/0 --- */
function oneHeat(idxs, field, meIdx, ctx){
 const ref = field.__ref !== undefined ? field.__ref
   : (field.__ref = field.reduce((a,r)=>a+r.ovr,0)/Math.max(1,field.length));
 const res=idxs.map(i=>{
   const isMe = i===meIdx;
   const dP = isMe&&ctx ? ctx.defP : 0.030;
   const eP = isMe&&ctx ? ctx.excP : 0.028;
   const rr=Math.random();
   const out = rr<dP ? 'd' : rr<dP+eP ? 'w' : null;
   return {i, out, str: rideStr(field[i].ovr, ref, 0)};
 });
 const fin=res.filter(x=>!x.out).sort((a,b)=>b.str-a.str);
 const pts={}; const place={};
 fin.forEach((x,k)=>{pts[x.i]=[3,2,1,0][k]; place[x.i]=k+1;});
 res.forEach(x=>{ if(x.out){pts[x.i]=0; place[x.i]=4;} });
 return {pts, place, res};
}
/* --- Turniej wg tabeli 20-biegowej --- */
function meeting20(field, meIdx, ctx){
 const draw=heatDraw();
 const T=field.map((r,i)=>({i, id:r.id, name:r.name, age:r.age, me:i===meIdx,
   pts:0, codes:[], places:[0,0,0,0,0]}));
 draw.forEach(h=>{
   const H=oneHeat(h, field, meIdx, ctx);
   h.forEach(i=>{
     const t=T[i], o=H.res.find(x=>x.i===i);
     t.pts+=H.pts[i];
     /* ZERO PUNKTÓW TO „0", A NIE „-".
        W polskiej notacji kreska w rubryce biegu oznacza, że zawodnik w tym
        biegu NIE STARTOWAŁ (w lidze: został zdjęty przez rezerwę taktyczną —
        patrz simMeeting). Turniej indywidualny jedzie się według tabeli
        20-biegowej: każdy z szesnastki ma pięć swoich startów i nikt go w nich
        nie zastępuje. Wpisywanie „-" za przejechany bieg bez punktu wyglądało
        więc tak, jakby gracza w kółko ktoś zmieniał, a do tego kod „-" jest
        w reszcie gry liczony jako NIEODBYTY start. */
     if(o.out) t.codes.push(o.out); else t.codes.push(String(H.pts[i]));
     if(!o.out) t.places[H.place[i]]++;
   });
 });
 // art. 638: równe punkty → więcej pierwszych, potem drugich, trzecich, czwartych
 T.sort((a,b)=> b.pts-a.pts || b.places[1]-a.places[1] || b.places[2]-a.places[2]
   || b.places[3]-a.places[3] || b.places[4]-a.places[4] || (Math.random()-0.5));
 return T;
}
/* --- Turniej finałowy IMP: turniej główny + półfinał + finał (art. 634) --- */
function impFinalRound(field, meIdx, ctx){
 const T=meeting20(field, meIdx, ctx);
 const sfIdx=[2,3,4,5].map(k=>T[k].i);                       // miejsca 3-6
 const semi=oneHeat(sfIdx, field, meIdx, ctx);
 const semiOrder=sfIdx.slice().sort((a,b)=>semi.place[a]-semi.place[b]);
 const finIdx=[T[0].i, T[1].i, semiOrder[0], semiOrder[1]];
 const fin=oneHeat(finIdx, field, meIdx, ctx);
 const finOrder=finIdx.slice().sort((a,b)=>fin.place[a]-fin.place[b]);
 // klasyfikacja turnieju (art. 634 ust. 9)
 const cls=[...finOrder, semiOrder[2], semiOrder[3],
   ...T.slice(2).map(t=>t.i).filter(i=>!finIdx.includes(i)&&!semiOrder.slice(2).includes(i))];
 // punkty do klasyfikacji IMP: turniej główny + bieg finałowy, BEZ półfinału (art. 634a)
 const score={}; T.forEach(t=>score[t.i]=t.pts);
 finIdx.forEach(i=>score[i]+=fin.pts[i]);
 const meRow = meIdx>=0 ? T.find(t=>t.i===meIdx) : null;
 let meCodes = meRow? meRow.codes.slice() : [];
 let meSemi=null, meFin=null;
 if(meRow){
   if(sfIdx.includes(meIdx)){ meSemi = semi.res.find(x=>x.i===meIdx).out || String(semi.place[meIdx])+'m'; }
   if(finIdx.includes(meIdx)){ const o=fin.res.find(x=>x.i===meIdx);
     // jak wyżej: bieg finałowy bez punktu to „F:0", nie „F:-"
     meFin = o.out || String(fin.pts[meIdx]); meCodes.push('F:'+(o.out||String(fin.pts[meIdx]))); }
 }
 return {T, cls, score, semiOrder, finOrder, meCodes, meSemi, meFin,
   mePts: meRow? score[meIdx] : 0, mainPts: meRow? meRow.pts : 0};
}
 
/* --- Pojedyncze zawody: pomocnik budujący opis do UI --- */
function roundInfo(title, T, meIdx){
 const me=T.find(t=>t.me);
 return {title, rows:T.map((t,i)=>({pos:i+1,name:t.name,pts:t.pts,me:t.me,codes:t.codes})),
   me: me? {pts:me.pts, codes:me.codes, pos:T.indexOf(me)+1} : null};
}
 
/* ============================================================
   Symulacja całego sezonu indywidualnego
   ============================================================ */
function simIndividual(p, effOvr, defP, excP){
 const me=G.riders.find(r=>r.me);
 me.age=p.age; me.ovr=cl(Math.round(effOvr),1,99); me.name=p.name;
 const ctx={defP, excP};
 const out={};
 const byId=id=>G.riders.find(r=>r.id===id);
 const fieldOf=arr=>arr.map(r=>({id:r.id,name:r.name,age:r.age,ovr:r.ovr}));
 const meIn=f=>f.findIndex(r=>r.id===me.id);
 
 /* ---------- ZŁOTY KASK — jeden turniej finałowy, bez ograniczeń wieku ---------- */
 {
  const rank=ranking();
  const nom=rank.slice(0,15);
  const wildPool=rank.slice(15,32);
  if(wildPool.length) nom.push(pick(wildPool));                 // dzika karta GKSŻ
  const f=fieldOf(nom.slice(0,16));
  const mi=meIn(f);
  const T=meeting20(f, mi, mi>=0?ctx:null);
  out.zk=finishInd({name:'ZŁOTY KASK', sub:'Memoriał Jerzego Szczakiela · jeden turniej finałowy',
    rode:mi>=0, rounds:[roundInfo('FINAŁ ZŁOTEGO KASKU',T,mi)],
    podium:T.slice(0,3).map(t=>t.name), mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0,
    mePts: mi>=0? T.find(t=>t.me).pts : 0});
 }
 /* ---------- SREBRNY KASK — młodzieżowcy (twardo U21), eliminacje + finał ---------- */
 out.sk = kaskYouth('SREBRNY KASK','podstawa nominacji do IMŚJ', isJun, me, ctx, fieldOf, meIn);
 /* ---------- BRĄZOWY KASK — twardo do 19 lat, eliminacje + finał ---------- */
 out.bk = kaskYouth('BRĄZOWY KASK','podstawa nominacji do IMEJ', isU19, me, ctx, fieldOf, meIn);

 /* ============================================================
    TURNIEJ SZKOLENIOWY — dla juniorów klubów, które nie awansowały do
    fazy play-off (art. 61 regulaminu: tabela 20-biegowa, 16 zawodników
    + 2 rezerwowych, wyłącznie krajowi zawodnicy młodzieżowi). To poligon
    dla juniorów słabszych klubów — coś, co jest do zrobienia w sezonie,
    który i tak kończy się bez play-off. Jeden turniej z cyklu rozgrywanego
    równolegle w całej Polsce; reszta cyklu toczy się bez twojego udziału.
    ============================================================ */
 {
  const eligible = isJun(p) && clubMissedPlayoffs(p.club);
  const pool = ranking(r=>isJun(r) && clubMissedPlayoffs(r.club));
  let nom = pool.slice(0,16);
  if(eligible && !nom.some(r=>r.id===me.id)){
    const meRow = pool.find(r=>r.id===me.id);
    if(meRow){ nom = nom.slice(0,15); nom.push(meRow); }
  }
  const sub='dla juniorów klubów spoza czołowej czwórki (art. 61) · tabela 20-biegowa · 16 zawodników + 2 rezerwowych';
  if(eligible && nom.length>=16){
    const f=fieldOf(nom.slice(0,16));
    const mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    out.szk=finishInd({name:'TURNIEJ SZKOLENIOWY', sub, rode:mi>=0,
      rounds:[roundInfo('TURNIEJ SZKOLENIOWY',T,mi)],
      podium:T.slice(0,3).map(t=>t.name), mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0,
      mePts: mi>=0? T.find(t=>t.me).pts : 0});
  } else {
    out.szk=finishInd({name:'TURNIEJ SZKOLENIOWY', sub, rode:false, rounds:[], podium:[], mePos:0, mePts:0});
  }
 }

 /* ============================================================
    PUCHAR MACEC — międzynarodowy cykl dla zawodników spoza czołówki
    (Stowarzyszenie Motocyklowe Krajów Europy Środkowej). Stawka: gracz +
    15 zagranicznych rywali ze Słowacji, Czech, Rumunii, Bułgarii, Węgier
    i Ukrainy — 16 zawodników, kilka rund tej samej stawki, klasyfikacja
    końcowa to suma punktów ze wszystkich rund. Art. 1.5 regulaminu: przy
    remisie punktowym wyżej ten, kto miał lepsze miejsce w turnieju
    rozegranym PÓŹNIEJ — liczone tu wstecz, runda po rundzie.
    Kwalifikacja: umiarkowany OVR — to liga dla zawodników, którzy nigdy
    nie zobaczą Grand Prix, nie dla gwiazd klubu. ---------------------- */
 {
  const macecOk = p.ovr>=18 && p.ovr<=62;
  const sub='międzynarodowy cykl — SVK/CZE/ROU/BGR/HUN/UKR · tabela 20-biegowa · klasyfikacja = suma punktów z rund';
  if(macecOk){
   /* Stawka: 15 zagranicznych rywali (fikcyjni, patrz MACEC_NAMES w data.js) +
      gracz. Zawodnicy z ROU/BGR/HUN/UKR są w tej stawce relacyjnie mocniejsi —
      zgodnie z opisem "super, jak na poziom tych krajów". */
   const foreign=shuffle(MACEC_NAMES.slice()).slice(0,15).map((x,k)=>{
     const bump=(x.c==='ROU'||x.c==='BGR'||x.c==='HUN'||x.c==='UKR') ? R(2,10) : R(-6,4);
     return {id:-1000-k, name:x.n+' ('+x.c+')', age:R(19,34), ovr:cl(Math.round(G.p.ovr+bump+gauss(0,6)),15,70)};
   });
   const meRow={id:me.id, name:me.name, age:p.age, ovr:cl(Math.round(effOvr),1,99)};
   const field=shuffle([meRow, ...foreign]);
   const mi=field.findIndex(r=>r.id===me.id);
   const roundsN=R(3,4);
   const total={}; field.forEach((r,k)=>total[k]=0);
   const roundPos=field.map(()=>[]);           // miejsce w KAŻDEJ rundzie — materiał na tiebreak art. 1.5
   const macecRounds=[]; let rode=false;
   for(let t=0;t<roundsN;t++){
    const T=meeting20(field, mi, mi>=0?ctx:null);
    T.forEach((row,pos)=>{ const k=field.findIndex(r=>r.id===row.id); total[k]+=row.pts; roundPos[k].push(pos+1); });
    if(mi>=0) rode=true;
    macecRounds.push(roundInfo('PUCHAR MACEC — RUNDA '+(t+1), T, mi));
   }
   const order=field.map((r,k)=>k).sort((a,b)=>{
     if(total[b]!==total[a]) return total[b]-total[a];
     for(let t=roundsN-1;t>=0;t--){ const d=(roundPos[a][t]||99)-(roundPos[b][t]||99); if(d) return d; }
     return 0;
   });
   const cls=order.map(k=>({name:field[k].name, pts:total[k], me:k===mi}));
   const mePos = mi>=0 ? order.indexOf(mi)+1 : 0;
   out.macec=finishInd({name:'PUCHAR MACEC', sub, rode, rounds:macecRounds, classification:cls,
     podium:cls.slice(0,3).map(c=>c.name), mePos, mePts: mi>=0? total[mi] : 0});
  } else {
   out.macec=finishInd({name:'PUCHAR MACEC', sub, rode:false, rounds:[], podium:[], mePos:0, mePts:0});
  }
 }
 
 /* ---------- MIMP — eliminacje + finał, TYLKO juniorzy U21 ----------
    Filtr wieku jest twardy: zawodnik po 21. urodzinach (w tym Gracz) nie ma
    prawa startu i nie pojawi się ani w eliminacjach, ani w finale. */
 {
  const pool=ranking(isJun).filter(isJun);
  const rounds=[]; let rode=false;
  const qual=[];
  for(let g=0; g<2; g++){
    const grp=pool.filter((_,i)=>i%2===g).slice(0,16);
    if(grp.length<16) continue;
    const f=fieldOf(grp), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE MIMP — GRUPA '+(g+1),T,mi));}
    T.slice(0,8).forEach(t=>qual.push(byId(t.id)));
  }
  if(qual.length>=16){
    const f=fieldOf(qual.slice(0,16)), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('FINAŁ MIMP',T,mi));}
    out.mimp=finishInd({name:'MŁODZIEŻOWE INDYWIDUALNE MISTRZOSTWA POLSKI', sub:'eliminacje + finał · tylko juniorzy krajowi',
      rode, rounds, podium:T.slice(0,3).map(t=>t.name),
      mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0? T.find(t=>t.me).pts : 0});
    G.nextMimpChamp=T[0].name;
  } else out.mimp=finishInd({name:'MIMP', rode, rounds, podium:[], mePos:0, mePts:0});
 }
 
 /* ---------- IMP — eliminacje → challenge → trzy turnieje finałowe ---------- */
 {
  const pool=ranking();
  const rounds=[]; let rode=false;
  const toChallenge=[];
  for(let g=0; g<4; g++){
    const grp=pool.filter((_,i)=>i%4===g).slice(0,16);
    if(grp.length<16) continue;
    const f=fieldOf(grp), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE IMP — GRUPA '+(g+1),T,mi));}
    T.slice(0,4).forEach(t=>toChallenge.push(byId(t.id)));      // po 4 z każdej eliminacji
  }
  let finalists=[];
  if(toChallenge.length>=16){
    const f=fieldOf(toChallenge.slice(0,16)), mi=meIn(f);
    const T=meeting20(f, mi, mi>=0?ctx:null);
    if(mi>=0){rode=true; rounds.push(roundInfo('CHALLENGE IMP',T,mi));}
    finalists=T.slice(0,7).map(t=>byId(t.id));                  // 7 najlepszych z challengu
  }
  // miejsca gwarantowane: medaliści IMP z zeszłego roku, czołówka rankingu (cykl GP),
  // Młodzieżowy Mistrz Polski z zeszłego roku, dzika karta
  const add=r=>{ if(r && !r.retired && !finalists.some(x=>x.id===r.id)) finalists.push(r); };
  (G.recIMP||[]).forEach(n=>add(G.riders.find(r=>r.name===n&&!r.retired)));
  if(G.recMIMP) add(G.riders.find(r=>r.name===G.recMIMP&&!r.retired));
  pool.slice(0,6).forEach(r=>add(byId(r.id)));                  // uczestnicy cyklu GP
  const wild=pool.slice(6,26); if(wild.length) add(byId(pick(wild).id));
  let i=0; while(finalists.length<16 && i<pool.length){add(byId(pool[i].id)); i++;}
  finalists=finalists.slice(0,16);
 
  const f=fieldOf(finalists), mi=meIn(f);
  const total={}; f.forEach((r,k)=>total[k]=0);
  const finRounds=[];
  for(let t=0;t<3;t++){
    const Rn=impFinalRound(f, mi, mi>=0?ctx:null);
    Object.keys(Rn.score).forEach(k=>total[k]+=Rn.score[k]);
    if(mi>=0) rode=true;
    finRounds.push({title:'TURNIEJ FINAŁOWY IMP '+(t+1),
      rows:Rn.cls.map((ix,pos)=>({pos:pos+1,name:f[ix].name,pts:Rn.score[ix],me:ix===mi})),
      me: mi>=0? {pts:Rn.mePts, codes:Rn.meCodes, pos:Rn.cls.indexOf(mi)+1} : null});
  }
  const cls=f.map((r,k)=>({name:r.name, pts:total[k], me:k===mi})).sort((a,b)=>b.pts-a.pts);
  out.imp=finishInd({name:'INDYWIDUALNE MISTRZOSTWA POLSKI', sub:'eliminacje → challenge → trzy turnieje finałowe',
    rode, rounds:[...rounds,...finRounds], classification:cls,
    podium:cls.slice(0,3).map(c=>c.name),
    mePos: mi>=0? cls.findIndex(c=>c.me)+1 : 0, mePts: mi>=0? cls.find(c=>c.me).pts : 0,
    inFinal: mi>=0});
  G.nextIMP=cls.slice(0,3).map(c=>c.name);
 }
 return out;
}
// etap, na którym skończyłeś dane rozgrywki (0 = nie awansowałeś do finału)
function finishInd(c){
 const mine=(c.rounds||[]).filter(x=>x.me);
 c.stage = mine.length ? mine[mine.length-1].title : '—';
 c.outFinal = c.rode && !c.mePos;
 return c;
}
function kaskYouth(name, sub, filt, me, ctx, fieldOf, meIn){
 // TWARDA WERYFIKACJA WIEKU: w turniejach młodzieżowych nie ma prawa startu
 // nikt po 21. roku życia — filtr turnieju nakładamy na warunek U21, nie odwrotnie.
 const pool=ranking(r=>isJun(r)&&filt(r)).filter(isJun);
 const rounds=[]; let rode=false; const qual=[];
 for(let g=0; g<2; g++){
   const grp=pool.filter((_,i)=>i%2===g).slice(0,16);
   if(grp.length<16) continue;
   const f=fieldOf(grp), mi=meIn(f);
   const T=meeting20(f, mi, mi>=0?ctx:null);
   if(mi>=0){rode=true; rounds.push(roundInfo('ELIMINACJE — GRUPA '+(g+1),T,mi));}
   T.slice(0,8).forEach(t=>qual.push(G.riders.find(r=>r.id===t.id)));
 }
 if(qual.length<16) return finishInd({name, sub, rode, rounds, podium:[], mePos:0, mePts:0});
 const f=fieldOf(qual.slice(0,16)), mi=meIn(f);
 const T=meeting20(f, mi, mi>=0?ctx:null);
 if(mi>=0) rode=true;
 rounds.push(roundInfo('FINAŁ — '+name, T, mi));
 return finishInd({name, sub, rode, rounds, podium:T.slice(0,3).map(t=>t.name),
   mePos: mi>=0? T.findIndex(t=>t.me)+1 : 0, mePts: mi>=0? T.find(t=>t.me).pts : 0});
}
 
/* --- BARAŻE + AWANSE/SPADKI --- */
function twoLeg(a,b){ // a = wyżej notowany
 const M1=simMeeting(a.name,b.name,null,null), M2=simMeeting(b.name,a.name,null,null);
 if(!M1||!M2) return {legs:[],agA:0,agB:0,win:a,lose:b};
 const agA=M1.hs+M2.as, agB=M1.as+M2.hs;
 return {legs:[{h:a.name,aw:b.name,hs:M1.hs,as:M1.as},{h:b.name,aw:a.name,hs:M2.hs,as:M2.as}],
   agA, agB, win: agA>=agB?a:b, lose: agA>=agB?b:a};
}
/* ============================================================
   6a. UPADŁOŚCI KLUBÓW — EGZEKUCJA
   Klub oznaczony flagą `bankrupt` w clubEconomy() przestaje istnieć
   w dotychczasowej formie: zostaje z niego miasto, nowy szyld,
   OVR 40, 100 tys. na koncie i czysta karta długów. Ląduje na końcu
   tabeli najniższej ligi. Wierzyciele (w tym Gracz) obchodzą się smakiem.
   ============================================================ */
const BK_PREFIX=['ŻKS ','TŻ ','KS ','Speedway ','KŻ '];
function executeBankruptcies(){
 const done=[];
 LKEYS.forEach(k=>{
  G.leagues[k].clubs.slice().forEach(c=>{
   if(!c.bankrupt) return;
   const old=c.name;
   const city=String(old).trim().split(/\s+/).pop();           // samo miasto: ostatnie słowo
   let nn=pick(BK_PREFIX)+city, g=2;
   while(allClubs().some(x=>x!==c && x.name===nn)) nn=pick(BK_PREFIX)+city+' '+(g++);
   /* SPONSORZY TYTULARNI IDĄ W ŚLAD ZA PIECZĄTKĄ: nowy byt prawny wchodzi
      do KLŻ bez ani jednego sponsora w nazwie i bez kary OVR za bycie słupem.
      Sponsorzy z Grupy A po prostu odchodzą (nie trafiają na czarną listę
      — nie oni okradli klub). */
   clubTitles(c).length=0;
   c.base=nn; c.pendingName=nn;
   // nowy byt prawny
   c.name=nn; c.ovr=40; c.budget=100000; c.debt=0;
   c.seasonCost=null; c.seasonIncome=null; c.incRound=null; c.costRound=null;
   c.arr=0; c.mood=R(20,50); c.bankrupt=false;
   // kadra: gwiazdy poszły w clubEconomy, reszta (i Gracz) przechodzi na nowy szyld
   G.riders.forEach(r=>{ if(r.club===old) r.club=nn; });
   if(G.p && G.p.club===old) G.p.club=nn;
   // z powrotem na dno: usuń z obecnej ligi, dopisz na koniec najniższej
   const arr=G.leagues[k].clubs, i=arr.indexOf(c);
   if(i>=0) arr.splice(i,1);
   G.leagues.KL.clubs.push(c);
   done.push({old, now:nn, city, from:k, why:c.bankruptWhy||'Finanse.'});
   c.bankruptWhy=null;
  });
 });
 return done;
}
/* ZIELONY STOLIK — po upadłościach trzeba odtworzyć obsadę lig od góry.
   Ekstraliga uzupełnia się najlepszą drużyną z 2. Ekstraligi,
   2. Ekstraliga — najlepszą z Krajowej Ligi. */
function greenTable(green){
 const moved=[];
 // kilka przebiegów, bo wakat w Ekstralidze otwiera wakat w 2. EL, a ten w KLŻ
 for(let pass=0; pass<3; pass++){
  [['EL','E2'],['E2','KL']].forEach(([hi,lo])=>{
   let guard=0;
   while(G.leagues[hi].clubs.length<8 && G.leagues[lo].clubs.length>0 && guard++<16){
    const best=G.leagues[lo].clubs.slice().sort((a,b)=>b.ovr-a.ovr)[0];
    if(!best) break;
    const arr=G.leagues[lo].clubs; arr.splice(arr.indexOf(best),1);
    G.leagues[hi].clubs.push(best);
    green.add(best.name);
    moved.push({club:best.name, from:lo, to:hi});
   }
  });
 }
 return moved;
}
function promotionsRelegations(){
 const out=[]; const pf=[];
 /* --- NAJPIERW SYNDYCY, POTEM DOPIERO SPORT --- */
 const bankrupts = executeBankruptcies();
 const green = new Set();
 const greenMoves = bankrupts.length ? greenTable(green) : [];
 G.bankrupts = bankrupts; G.greenTable = greenMoves;
 /* Tabele końcowe po korektach: bez upadłych, z wakatami załatanymi przez zielony stolik. */
 const ORD={};
 LKEYS.forEach(k=>{ ORD[k]=(((G.phase[k]&&G.phase[k].order)||[])
   .filter(n=>n && G.leagues[k].clubs.some(c=>c.name===n))); });
 const pairs=[['EL','E2'],['E2','KL']];
 pairs.forEach(([hi,lo])=>{
  // kluby wciągnięte zielonym stolikiem nie spadają i nie awansują w tym samym roku
  const Th=ORD[hi].filter(n=>!green.has(n)), Tl=ORD[lo].filter(n=>!green.has(n));
  if(Th.length<2||Tl.length<2) return;
  const cH=n=>G.leagues[hi].clubs.find(c=>c.name===n);
  const cL=n=>G.leagues[lo].clubs.find(c=>c.name===n);
  // bezpośrednie: 8. po play-downie spada, mistrz play-offów niższej ligi awansuje
  const down=cH(Th[Th.length-1]), up=cL(Tl[0]);
  if(!down||!up) return;
  out.push({type:'spadek', club:down.name, from:hi, to:lo});
  out.push({type:'awans',  club:up.name,   from:lo, to:hi});
  // baraż: 7. wyższej ligi (ocalały z dwumeczu o utrzymanie) vs wicemistrz niższej
  const b7=cH(Th[Th.length-2]), l2=cL(Tl[1]);
  if(!b7||!l2) return;
  const tl=twoLeg(b7,l2);
  pf.push({hi,lo,a:b7.name,b:l2.name,...tl, winner:tl.win.name});
  let extraDown=null, extraUp=null;
  if(tl.win.name===l2.name){extraDown=b7;extraUp=l2;
    out.push({type:'spadek(baraż)',club:b7.name,from:hi,to:lo});
    out.push({type:'awans(baraż)', club:l2.name,from:lo,to:hi});}
  // przenosiny
  const move=(club,from,to)=>{const arr=G.leagues[from].clubs;const i=arr.indexOf(club);if(i>=0){arr.splice(i,1);G.leagues[to].clubs.push(club);} };
  move(down,hi,lo); move(up,lo,hi);
  if(extraDown){move(extraDown,hi,lo);move(extraUp,lo,hi);}
 });
 // korekty OVR po zmianie ligi (świeży bankrut zostaje na twardym 40)
 const fresh=new Set(bankrupts.map(b=>b.now));
 LKEYS.forEach(k=>{G.leagues[k].clubs.forEach(c=>{ if(fresh.has(c.name)) return;
   c.ovr=cl(Math.round(c.ovr+R(-2,2)),20,99);});});
 // gracz podąża za klubem
 LKEYS.forEach(k=>{ if(G.leagues[k].clubs.some(c=>c.name===G.p.club)) G.p.lk=k; });
 G.playoff=pf; G.promo=out;
}
 
/* ============================================================
   6. KONTRAKTY / OFERTY
   ============================================================ */
/* ============================================================
   DLACZEGO STARY KLUB SIĘ NIE ODEZWAŁ
   W realnym żużlu prezes po prostu przestaje odbierać telefon, a zawodnik
   dowiaduje się z portalu, że wzięli Szweda. W grze to wyglądało jak bug
   silnika, więc makeOffers() zapisuje teraz powód odrzucenia do G.noRenew,
   a UI wywala go graczowi na ekran ofert.
   ============================================================ */
function renewRejection(miss, rating, lastAvg){
 const p=G.p;
 if(!p.club) return null;
 let lk=null, c=null;
 LKEYS.forEach(k=>{ const f=G.leagues[k].clubs.find(x=>x.name===p.club); if(f&&!c){c=f;lk=k;} });
 const avgTxt=(lastAvg==null?1.4:lastAvg).toFixed(2);
 if(!c) return {club:p.club, lk:null, code:'gone',
   t:'TWÓJ KLUB PRZESTAŁ ISTNIEĆ',
   x:'Szyld, pod którym jeździłeś, zniknął z ewidencji. Nie ma z kim negocjować, nie ma kto podpisać.',
   quote:'„Numer nieaktualny. Biuro klubu jest zamknięte, a klucze ma syndyk."'};
 
 const gap=Math.round(rating - riderLevel(c));
 const brokeMoney = c.budget<=0 || (c.arr||0)>100000 || (c.debt||0)>150000;
 
 // 1) ZACHOWANIE POZA TOREM — twarda flaga z sezonu
 if(miss && miss.code==='behave') return {club:c.name, lk, code:'behave',
   t:'KLUB ZERWAŁ NEGOCJACJE — POWÓD POZASPORTOWY',
   x:'To nie kwestia średniej. '+c.name+' zamknął temat twojego kontraktu jeszcze w trakcie sezonu, '+
     'po tym, co zrobiłeś poza torem. Decyzja zapadła w gabinecie, nie na torze.',
   quote:'„Sportowo? Sportowo nie mieliśmy zastrzeżeń. Ale są rzeczy, których się w tym klubie nie robi."',
   tip:'Profesjonalizm i lojalność odbudujesz tylko czasem i spokojnym sezonem.'};
 
 // 1b) SŁUP OGŁOSZENIOWY — TO TY NIE CHCESZ ICH, NIE ODWROTNIE
 if(miss && miss.code==='billboard') return {club:c.name, lk, code:'billboard',
   t:'ODMÓWIŁEŚ PRZEDŁUŻENIA — KLUB SPRZEDAŁ WŁASNĄ NAZWĘ',
   x:c.name+' ma w nazwie '+(miss.titles||2)+' sponsorów tytularnych. Kevlar wygląda jak tablica '+
     'ogłoszeń, spiker nie wyrabia z przeczytaniem szyldu, a przy twoim profesjonalizmie ('+p.prof+
     ') nikt z twojego otoczenia nie pozwoliłby ci tam zostać. To nie klub, to slup reklamowy z torem.',
   quote:'„Panie, my mamy trzech sponsorów w nazwie. TRZECH. Jak pan chce robić karierę, to nie tutaj."',
   tip:'Kluby z 2-3 sponsorami tytularnymi są zamknięte dla zawodników z profesjonalizmem powyżej '+SPON.profBlock+'.'};

 // 2) SPORTOWO ZA SŁABY NA ICH AMBICJE
 if(miss && miss.code==='sport') return {club:c.name, lk, code:'sport',
   t:'JESTEŚ SPORTOWO ZA SŁABY NA ICH AMBICJE',
   x:c.name+' celuje w poziom OVR '+c.ovr+'. Twoja wartość rynkowa to '+Math.round(rating)+
     ' (OVR '+p.ovr+', medialność '+p.med+', średnia z zeszłego sezonu '+avgTxt+') — różnica '+gap+
     ' pkt jest większa, niż ten klub jest w stanie przełknąć w składzie.',
   quote:'„Szanujemy chłopaka, ale my walczymy o play-off, a nie o to, żeby ktoś nam wypełniał rubrykę."',
   tip:'Zejdź klasę niżej, odbuduj średnią i wróć — albo szukaj klubu o OVR bliżej '+Math.max(20,Math.round(rating))+'.'};
 
 // 3) KLUBU NA CIEBIE NIE STAĆ
 if(brokeMoney) return {club:c.name, lk, code:'money',
   t:'KLUBU PO PROSTU NA CIEBIE NIE STAĆ',
   x:c.name+' tonie w zobowiązaniach'+((c.debt||0)>0?' (samemu tobie zalega '+zl(c.debt)+')':'')+
     ((c.arr||0)>0?', a wobec całej kadry ma '+zl(c.arr)+' zaległości':'')+
     '. Budżet na twój kontrakt nie istnieje — nie w tym roku.',
   quote:'„Panie, my nie mamy czym zapłacić za prąd na stadionie, a pan przychodzi po kontrakt."',
   tip:'Kluby z długami biorą tanich zawodników. Twoja stawka była za wysoka jak na ich kasę.'};
 
 // 4) DECYZJA SPORTOWO-KADROWA: junior, Szwed, twoja średnia
 let why, quote;
 if(p.age>33){
   why='Klub przestawia się na młodszą kadrę. Masz '+p.age+' lat i, jak to ujął menedżer, „nie jesteś inwestycją".';
   quote='„Musimy budować drużynę na trzy lata do przodu. On tych trzech lat już nie ma."';
 } else if((lastAvg||0)<1.2){
   why='Twoja średnia '+avgTxt+' nie broni miejsca w składzie. Postawili na juniora z własnego szkolenia — '+
       'kosztuje mniej i wypełnia rubrykę młodzieżową.';
   quote='„Przy takiej średniej to my wolimy dać jeździć swojemu chłopakowi. Przynajmniej się nauczy."';
 } else if(p.prof<35){
   why='Sportowo się bronisz, ale sztab ma dosyć twojej pracy poza torem (profesjonalizm '+p.prof+
       '): spóźnienia, sprzęt nieprzygotowany, telefon wyłączony.';
   quote='„Talent talentem, tylko my nigdy nie wiedzieliśmy, w jakim on przyjedzie stanie."';
 } else {
   why='Zwykła decyzja kadrowa: na twoje miejsce wzięli obcokrajowca ze średnią wyżej niż twoja ('+avgTxt+'). '+
       'Dowiedziałeś się z portalu, jak wszyscy.';
   quote='„Rozmowy? Były rozmowy. No, mieliśmy zadzwonić."';
 }
 return {club:c.name, lk, code:'squad', t:'KLUB NIE ZŁOŻYŁ CI OFERTY PRZEDŁUŻENIA', x:why, quote,
   tip:'Nic nie jest przesądzone — inne kluby z listy obok wciąż cię chcą.'};
}
 
/* ============================================================
   RYNEK TRANSFEROWY — SKĄD BIORĄ SIĘ OFERTY
   ------------------------------------------------------------
   Do tej pory cała wycena zawodnika mieściła się w jednej linijce
   (`rating = OVR + medialność*0,08 + (średnia-1,4)*7`), a gracz nie widział
   z niej NIC: na ekranie pojawiały się kluby, stawki i premie, których nie
   dało się z niczym powiązać — stąd wrażenie, że oferty są przypadkowe.
   Teraz są dwie jawne liczby, obie rozpisane na składniki i obie pokazywane
   przy każdej ofercie:

     WARTOŚĆ RYNKOWA — ile jesteś wart sportowo, na tej samej skali, na której
                       liczony jest OVR klubów. Składa się z: OVR, średniej
                       z ostatniego sezonu, medialności, profesjonalizmu,
                       wieku i (u zawodowca) własnego sprzętu.
     ZAINTERESOWANIE — na ile TEN konkretny klub cię chce: różnica wartości
                       do jego poziomu, rubryka młodzieżowa/U24, lojalność,
                       realne miejsce w ich składzie i stan ich kasy.

   Stawka za punkt i premia za podpis liczone są z tych samych liczb oraz
   z zamożności klubu — a nie z gołego rzutu kością. Klub bez pieniędzy nie
   złoży oferty jak z Ekstraligi, a klub z pełną kadrą na twojej pozycji
   nie będzie się bił o kogoś, kto i tak będzie oglądał mecze z parkingu.
   ============================================================ */
const MARKET={
 /* AVGW PODNIESIONE Z 9 NA 15: skarżono się, że średnia z ostatniego sezonu
    zbyt słabo przekłada się na oferty — mistrzowski rok ze średnią 2.7+
    powinien wywindować wycenę wyraźnie, a fatalny sezon (średnia poniżej 1.0)
    powinien tak samo wyraźnie ją zdołować. Przy avgW=15 różnica między
    średnią 1.0 a 2.7 to już +25.5 pkt do wyceny (dawniej +15.3). */
 avgRef   : 1.40,  avgW  : 15,        // średnia biegopunktowa: odniesienie i waga
 medRef   : 40,    medW  : 0.10,
 profRef  : 45,    profW : 0.12,
 equipRef : 55,    equipW: 0.10,
 /* Krzywa wieku: 19-27 to okno, w którym kluby płacą najchętniej. Junior jest
    tańszy sportowo (ale ma rubrykę), trzydziestolatek zaczyna tracić. */
 age      : {16:-6, 17:-4, 18:-2, 19:0, 20:1, 21:2, 22:2, 23:2, 24:2, 25:2,
             26:1, 27:1, 28:0, 29:0, 30:-1, 31:-2, 32:-4, 33:-6, 34:-8, 35:-10},
 ageOld   : -13,                                    // 36 lat i więcej
 /* KL Z 480 NA 650, E2 Z 1150 NA 1350: stawka za punkt w dolnych ligach była
    ustawiona tak nisko, że nawet zawodnik dopasowany poziomem do klubu nie
    był w stanie odrobić kosztów życia i serwisu w trakcie sezonu — patrz
    komentarz przy ECON.liveLeague/ECON.svcLeague w data.js. Ekstraliga
    zostaje bez zmian, żeby nie spłaszczyć różnicy między ligami do zera. */
 rateBase : {EL:2400, E2:1350, KL:650},             // zł/pkt w klubie o średnim poziomie ligi
 bonusMax : 0.030                                   // maks. część budżetu klubu na premię za podpis
};

/* WARTOŚĆ RYNKOWA + ROZPISKA. Skala ta sama, co OVR klubów. */
function marketValue(p, lastAvg){
 const parts=[];
 const add=(d,w)=>{ d=Math.round(d*10)/10; if(d) parts.push({d,w}); return d; };
 let s=p.ovr;
 parts.push({d:p.ovr, w:'OVR '+p.ovr+' — czysta jazda, punkt wyjścia całej wyceny'});
 s += add((lastAvg-MARKET.avgRef)*MARKET.avgW,
   'średnia biegopunktowa ostatniego sezonu '+lastAvg.toFixed(2)+' (odniesienie '+MARKET.avgRef.toFixed(2)+')');
 s += add((p.med-MARKET.medRef)*MARKET.medW,
   'medialność '+p.med+' — bilety, logo sponsora, telefon od dziennikarza');
 s += add((p.prof-MARKET.profRef)*MARKET.profW,
   'profesjonalizm '+p.prof+' — sprzęt gotowy na czas, terminy, brak awantur');
 const ag = p.age>=36 ? MARKET.ageOld : (MARKET.age[p.age]!=null?MARKET.age[p.age]:0);
 s += add(ag, 'wiek '+p.age+' lat — '+(ag>0
     ? 'jesteś w oknie, w którym kluby płacą najchętniej'
     : ag<0 ? (p.age<=18 ? 'jeszcze surowy, klub kupuje przyszłość, nie punkty'
                         : 'kluby liczą lata, nie tylko punkty')
            : 'wiek neutralny dla wyceny'));
 if(p.contract && p.contract.type==='Zawodowy')
   s += add((p.equip-MARKET.equipRef)*MARKET.equipW,
     'sprzęt '+p.equip+'/99 — jeździsz swoim, klub bierze to pod uwagę');
 if(p.next.betterOffers) s += add(5, 'twoja sprawa poszła szeroko — menedżerowie dzwonią sami');
 if(p.banSeasons>0)      s += add(-15, 'aktywna dyskwalifikacja — na papierze jesteś nie do wystawienia');
 return {rating: Math.round(s*10)/10, parts};
}

/* SZYBKI SZACUNEK MIEJSCA W SKŁADZIE (bez 140 symulacji na każdy z 24 klubów).
   Z kim realnie walczysz: młodzieżowiec o dwa miejsca młodzieżowe, senior
   o pierwszą piątkę. Wynik >0 = wchodzisz do składu tego klubu. */
function squadPressure(p, clubName){
 const sq=squadOf(clubName).filter(r=>!r.me && !r.retired);
 if(!sq.length) return 12;
 const me=effectiveOvr(p, 100, 0);
 const rel = isJun(p) ? sq.filter(isJun) : sq.filter(r=>!isJun(r)||isU24(r));
 const slots = isJun(p) ? 2 : 5;
 const sorted = (rel.length?rel:sq).slice().sort((a,b)=>b.ovr-a.ovr);
 const cut = sorted[slots-1] ? sorted[slots-1].ovr : (sorted[sorted.length-1]||{ovr:0}).ovr;
 return Math.round(me-cut);
}

/* ZAINTERESOWANIE KLUBU (0-100 %) + ROZPISKA. */
function clubInterest(p, c, lk, rating){
 const parts=[];
 const add=(d,w)=>{ d=Math.round(d); if(d) parts.push({d,w}); return d; };
 const gap = rating - riderLevel(c);
 let want=42;
 parts.push({d:42, w:'punkt wyjścia — każdy klub kogoś szuka'});
 /* Młodzieżowiec bije się o rubrykę młodzieżową, a nie o miejsce w pierwszej
    piątce — dlatego bycie poniżej poziomu klubu boli go dużo mniej niż seniora.
    Bez tego 16-latek z OVR 30 nie dostawał telefonu z ŻADNEJ ligi, mimo że
    regulamin każe klubom szukać właśnie takich. */
 const gw = gap>=0 ? 2.4 : (p.age<=21 ? 1.0 : p.age<=24 ? 1.7 : 2.4);
 want += add(cl(gap*gw,-60,40),
   'wartość rynkowa '+Math.round(rating)+' kontra poziom klubu '+c.ovr+' (różnica '+(gap>0?'+':'')+Math.round(gap)+')'+
   (gap<0&&p.age<=24?' — łagodzona przez rubrykę wiekową':''));
 if(p.age<=21)      want += add(20, 'rubryka młodzieżowa U21 — bez młodzieżowca klub nie ustawi składu');
 else if(p.age<=24) want += add(9,  'rubryka U24 — obowiązkowe miejsce w pierwszej piątce');
 if(p.age>=33)      want += add(-10,'wiek '+p.age+' — klub buduje kadrę na kilka sezonów do przodu');
 if(c.name===p.club && p.loyalty>0) want += add(p.loyalty*0.55, 'znają cię tu — lojalność '+p.loyalty+'/100');
 if(p.prof<30)      want += add(-14,'profesjonalizm '+p.prof+' — opinia idzie przed tobą');
 else if(p.prof>75) want += add(8,  'profesjonalizm '+p.prof+' — z takim zawodnikiem nie ma problemów organizacyjnych');
 if(p.med>70)       want += add(7,  'medialność '+p.med+' — sprzedajesz bilety i zadowalasz sponsora');
 const press=squadPressure(p, c.name);
 want += add(cl(press*0.9,-24,10), press>=0
   ? 'ich kadra: wchodzisz do składu (przewaga '+press+' pkt nad ostatnim z rotacji)'
   : 'ich kadra: mają już kogo wystawiać (brakuje ci '+(-press)+' pkt do składu)');
 if((c.debt||0)>150000)             want += add(12, 'klub ma wobec kadry zaległości '+zl(c.debt)+' — bierze tego, kto podpisze');
 if(c.budget<=0 && (c.arr||0)>0)    want += add(-22,'puste konto i niezapłacone pensje — nie mają za co brać nikogo');
 if(c.name.includes('Rybnik') && p.next.rowPen) want += add(-25, 'twój wpis o „guru" — tutaj ci go nie zapomnieli');
 return {want: cl(Math.round(want),2,96), parts, gap, press};
}

/* STAWKA ZA PUNKT — LICZONA, NIE LOSOWANA.
   Liga × poziom klubu × jego realna zamożność × twoja wartość × medialność. */
function offerRate(p, c, lk, rating, gap){
 const parts=[];
 const base=MARKET.rateBase[lk]||MARKET.rateBase.KL;
 const avgL=leagueAvgOvr(lk)||c.ovr;
 const qual   = cl(0.55+0.45*(c.ovr/Math.max(1,avgL)), 0.50, 1.50);
 const budgetF= cl(0.70+Math.max(0,c.budget)/Math.max(1,(LEAGUE_INC[lk]||1)*2.2), 0.55, 1.45);
 const valF   = cl(1+gap*0.022, 0.60, 1.70);
 const medF   = cl(1+(p.med-40)/320, 0.85, 1.20);
 let rate = base*qual*budgetF*valF*medF*RF(0.94,1.08);
 parts.push({w:'stawka bazowa w lidze '+(G.leagues[lk]?G.leagues[lk].short:lk), v:zl(base)});
 parts.push({w:'poziom klubu ('+c.ovr+' przy średniej ligi '+Math.round(avgL)+')', v:'×'+qual.toFixed(2)});
 parts.push({w:'zamożność klubu (budżet '+zl(c.budget)+')', v:'×'+budgetF.toFixed(2)});
 parts.push({w:'twoja wartość kontra poziom klubu', v:'×'+valF.toFixed(2)});
 parts.push({w:'medialność '+p.med, v:'×'+medF.toFixed(2)});
 if((c.arr||0)>0){ rate*=0.85; parts.push({w:'klub zalega kadrze '+zl(c.arr)+' — negocjuje w dół', v:'×0,85'}); }
 if(p.age<=23){
   const m=ECON.youngRate[p.age]||1;
   parts.push({w:'uwaga: przy twoim wieku klub wypłaci '+Math.round(m*100)+'% tej stawki (taryfa młodzieżowa)', v:''});
 }
 return {rate: Math.max(120, Math.round(rate)), parts};
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
 if(!chance(cl(45 + (p.loyalty-70)*1.4 + (avg-1.30)*45, 20, 92))) return null;
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
   ride:appearanceChance(p, c, 55, null)};
}
function acceptRenew(o){
 const p=G.p;
 p.contract={type:o.type, years:o.years, rate:o.rate, bonus:o.bonus};
 p.budget += o.bonus; p.career.earned += o.bonus;
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
   return {club:c.name, lk, ovr:c.ovr, budget:c.budget, debt:c.debt, arr:c.arr||0,
     type: pro?'Zawodowy':'Amatorski', years, rate, bonus:bon,
     stay:c.name===p.club, ride:appearanceChance(p, c, 55, null),
     /* --- SKĄD TA OFERTA (rozpiska dla UI) --- */
     rating, ratingParts: MV.parts,
     want: I.want, wantParts: I.parts, gap: Math.round(I.gap), press: I.press,
     rateParts: pro ? RT.parts : [{w:'kontrakt amatorski — sprzęt klubowy, stawka symboliczna, zero premii za podpis', v:zl(rate)+'/pkt'}],
     lastAvg,
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
   if(!chance(I.want)){ if(isOld) oldMiss={code:'roll', want:I.want, gap}; return; }
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
 /* POWÓD BRAKU PRZEDŁUŻENIA — do pokazania na ekranie ofert */
 G.noRenew = (p.club && !out.some(o=>o.stay)) ? renewRejection(oldMiss, rating, lastAvg) : null;
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
 p.budget += o.bonus;
 p.career.earned += o.bonus;
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