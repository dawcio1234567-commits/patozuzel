/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: EKONOMIA W SEZONIE
   Pensje, zaległości, bunty płacowe, payRatio
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1846-1950 oryginału).
   ============================================================ */
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
   5a-ter. MECHANIK NA ETACIE (Sprint 5b, 24.08.2026)
   ------------------------------------------------------------
   Do tej pory mechanika kupowało się RAZ i miało do końca kariery — jedyny
   pracownik w tym sporcie, który pracował za darmo przez piętnaście lat.
   Teraz bierze pieniądze co sezon, jak każdy inny. Jak w kasie nie ma tej
   kwoty przy starcie sezonu, nie robi awantury: pakuje skrzynkę i idzie do
   klubu, który płaci. Wracasz wtedy do klubowego z łapanki (jakość 25),
   z całym tego dobrodziejstwem w podpowiedziach i w ryzyku „dwóch minut".
   ------------------------------------------------------------ */
const MECH_BASE = {q:25, n:'Mechanik klubowy (z łapanki)'};

function mechSeasonFee(){
 const p=G&&G.p;
 if(!p || !p.mechCost) return 0;
 return Math.max(ECON.mechSeasonMin||0, Math.round(p.mechCost*(ECON.mechSeason||0.55)));
}
function mechPaySeason(){
 const p=G&&G.p, S=G&&G.S;
 if(!p) return null;
 const fee=mechSeasonFee();
 if(fee<=0) return null;
 if(p.budget>=fee){
   p.budget-=fee;
   const t='Wypłata dla mechanika ('+p.mechName+') za sezon: -'+zl(fee)+'.';
   if(S) (S.notes=S.notes||[]).push(t);
   return {paid:true, fee, txt:t};
 }
 const old=p.mechName;
 p.mech=MECH_BASE.q; p.mechName=MECH_BASE.n; p.mechCost=0;
 const t='MECHANIK ZRYWA WSPÓŁPRACĘ. '+old+' chciał '+zl(fee)+' za sezon, w kasie było '+zl(Math.max(0,p.budget))+
   '. Spakował skrzynkę bez jednego słowa. Zostaje ci klubowy z łapanki (jakość '+MECH_BASE.q+'/99).';
 if(S){ (S.notes=S.notes||[]).push(t); S.mechQuit=old; }
 return {paid:false, fee, txt:t};
}
/* Wpięcie bez ruszania engine/06: opakowujemy startSeason(), tak samo jak
   robi to engine/34-zwiazek-cegla.js z ryczałtem SZZZ. Kolejność ładowania
   jest po naszej stronie — 06 idzie przed 13. */
if(typeof startSeason==='function'){
 const _startSeasonBeforeMech = startSeason;
 startSeason = function(){ const r=_startSeasonBeforeMech.apply(this, arguments); mechPaySeason(); return r; };
}
