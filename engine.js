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
  phase:{}, riders:[], recIMP:[], recMIMP:null, meForm:0
 };
}
 
function newPlayer(name,clsId){
 const c=CLASSES.find(x=>x.id===clsId);
 return {
  name, cls:c.n, clsId,
  age:16, ovr:R(c.ovr[0],c.ovr[1]), pot:R(c.pot[0],c.pot[1]),
  prof:R(c.prof[0],c.prof[1]), med:R(c.med[0],c.med[1]),
  budget:0, equip:20, mech:25, mechName:'Mechanik klubowy (z łapanki)',
  loyalty:0, club:null, lk:null,
  contract:{type:'Amatorski', years:1, rate:R(150,350), bonus:0},
  banSeasons:0, injured:0, retired:false, retireReason:'',
  // FORMA: dyspozycja z ostatniego sezonu (-12..+12). Ujemna = dołek.
  // Czytają ją warunki zdarzeń losowych (cond: p.form<0).
  form:0,
  shop:{bought:[],log:[],spent:0,equipGain:0,mechHired:false},
  next:{zeroMatches:false, heatPP:0, betterOffers:false, noRenew:false, rowPen:false, noArg:false,
        injuryPP:0, rateMul:1, noSponsor:false, lockTransfer:0, forceClub:null},
  career:{seasons:0,matches:0,heats:0,pts:0,bon:0,def:0,exc:0,earned:0,titles:0,best:'—',bestAvg:0}
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
 
 
/* ============================================================
   2. START SEZONU
   ============================================================ */
function startSeason(){
 const p=G.p, club=getClub(p);
 const atm=R(0,100);
 G.S={
  atm, heatPP:p.next.heatPP, injuryPP:p.next.injuryPP||0, noEarnings:false,
  teamPts:0, teamOvr:0, banMatches:0, equipFit:100,
  extraDefP:0, zeroMatches:p.next.zeroMatches, forcedEnd:false,
  walkower:false, fines:0, evLog:[], noRenew:p.next.noRenew,
  rateMul:p.next.rateMul||1, ovrBonus:0,
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
         rowPen:p.next.rowPen, noArg:p.next.noArg,
         injuryPP:0, rateMul:1,
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
 let e;
 if(cnd.length && (chance(60)||!gen.length)) e=pick(cnd);
 else if(gen.length) e=pick(gen);
 else e=pick(pool);
 evHist.push(e.id); if(evHist.length>25) evHist.shift();
 return e;
}
const evText = e => typeof e.x==='function' ? e.x() : e.x;
 
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
 S.walkRound = S.walkower ? R(0,BAL.rounds-1) : -1;
 S.striking  = false; S.strikeRounds=0; S.strikeLog=[]; S.payLog=[];
 S.owed=0; S.paid=0; S.roundLog=[];
 const injuryP = cl(6 + (100-p.prof)*0.10 + S.injuryPP, 0, 95);
 S.injPerRound = (1-Math.pow(1-injuryP/100, 1/BAL.rounds))*100;
 if(S.zeroMatches) notes.push('Efekt decyzji z poprzedniego sezonu: 0 meczów.');
 if(S.forcedEnd)   notes.push('Sezon urwany przez decyzję pozaboiskową (od '+(S.forcedFrom+1)+'. kolejki).');
 if(S.banMatches>0)notes.push('Zawieszenie: -'+S.banMatches+' spotkań.');
 if(S.walkower)    notes.push('Jedno spotkanie zweryfikowane jako walkower.');
 
 const ctx={defP, excP, meId:meR.id, bias};
 
 /* --- SYMULACJA SEZONU: KOLEJKA PO KOLEJCE, MECZ PO MECZU --- */
 simSeasonChrono(ctx, lk, club.name, S.teamPts);
 meR.out=false;
 
 if(S.injDone) notes.push('KONTUZJA w '+(S.injRound||'trakcie sezonu')+'. kolejce. Pauza '+S.injTotal+' spotkań, -'+S.injDmg+' OVR.');
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
               paid:L.paid||0, owed:L.owed||0, debt:L.debt||0};
   if(!L.rode || !L.me) return {...base, rode:false, why:L.why||'ŁAWKA / POZA SKŁADEM', gap:L.gap, reg:L.reg};
   const M=L.me;
   matches++; heats+=M.starts; pts+=M.pts; bonus+=M.bon;
   M.codes.forEach(c=>{ if(c==='d')defects++; else if(c==='w')exclusions++; else if(c==='-')replaced++; });
   return {...base, rode:true, mp:M.pts, mb:M.bon, codes:M.codes, num:M.num};
 });
 const strike = S.strikeRounds>0;
 if(strike) notes.push('Bunt płacowy: opuściłeś '+S.strikeRounds+' kolejek przez zaległości klubu.');
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
 const canRidePO = matches>0 && !S.striking && p.banSeasons===0 && !S.forcedEnd && !S.zeroMatches;
 LKEYS.forEach(k=>runPhase(k, k===lk&&canRidePO?ctx:null, k===lk?club.name:null));
 const order=G.phase[lk].order;
 const pos=order.indexOf(club.name)+1;
 
 /* --- TWÓJ DOROBEK W FAZIE PLAY-OFF (liczony osobno) --- */
 const po={m:0,h:0,p:0,b:0,d:0,w:0,rep:0};
 G.phase[lk].ties.forEach(t=>t.legs.forEach(L=>{ if(!L.me)return;
   po.m++; po.h+=L.me.starts; po.p+=L.me.pts; po.b+=L.me.bon;
   L.me.codes.forEach(c=>{if(c==='d')po.d++;else if(c==='w')po.w++;else if(c==='-')po.rep++;}); }));
 po.avg = po.h>0 ? po.p/po.h : 0;
 po.avgTxt = po.h>0 ? po.avg.toFixed(2) : '—';
 
 /* --- DMPJ: jedziesz WYŁĄCZNIE do 21. roku życia (twardy warunek) --- */
 const injured=S.injDone, injMissed=S.injTotal;
 const blocked = p.banSeasons>0 || S.zeroMatches || matches===0;
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
   ['imp','mimp','zk','sk','bk'].forEach(k=>{
     const c=ind[k]; if(!c||!c.rode) return;
     (c.rounds||[]).forEach(rr=>{ if(rr.me){tally.h+=rr.me.codes.length; tally.p+=rr.me.pts;
                                            pzmStarts++; pzmPts+=rr.me.pts||0;} });
     if(c.mePos>=1&&c.mePos<=3) medals.push({k, name:c.name, pos:c.mePos});
   });
 }
 const PZM_START=500, PZM_PER_PT=150;
 const pzmEarned = pzmStarts*PZM_START + pzmPts*PZM_PER_PT;
 const overall = tally.h>0 ? tally.p/tally.h : 0;
 let score = overall;
 medals.forEach(m=>{ score += m.pos===1?0.30 : m.pos===2?0.18 : 0.10; });
 if(pos===1) score += 0.12;
 const grade = gradeOf(tally.h>0?score:0, tally.h);
 
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
 
 /* --- ROZWÓJ --- */
 let growth = p.age<=21?7.4 : p.age<=24?4.4 : p.age<=28?1.8 : p.age<=32?0.1 : p.age<=36?-2.6 : -5;
 growth += (p.prof-50)/26;
 growth += heats>0 ? (avg-1.4)*(p.age<=21?1.4:2.4) : -3.5;   // brak startów = brak rozwoju
 growth += gauss(0,1.6);
 // sufit talentu: im bliżej swojego potencjału, tym trudniej o kolejny punkt
 if(growth>0) growth *= cl(((p.pot||p.ovr+8)-p.ovr)/10, 0, 1);
 const oldOvr=p.ovr;
 p.ovr = cl(Math.round(p.ovr+growth),1,99);
 
 /* --- ZUŻYCIE SPRZĘTU --- */
 if(p.contract.type==='Zawodowy') p.equip=cl(p.equip-R(5,11),1,99);
 else p.equip = cl(Math.round(20 + club.ovr*0.32 + R(-3,3)),1,99);
 
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
 
 const res={
  year:G.year, club:seasonClubName, pname:p.name, lk, leagueName:G.leagues[lk].name, league:G.leagues[lk].short, age:p.age,
  bankrupt:myBk, bankruptsAll:G.bankrupts||[], greenTable:G.greenTable||[],
  atm:S.atm, atmTxt, matches, heats, completed, pts, bonus, defects, exclusions,
  avg, avgTxt, grade, earned, earnedBon, pos, posReg, po, dmpj, ind, tally, overall, medals,
  tabRow:myRow, injured, injMissed, clubEvents, strikeRounds:S.strikeRounds, payLog:S.payLog,
  strike, ovrFrom:oldOvr, ovrTo:p.ovr, notes, fines:S.fines, lines, replaced,
  profFrom:S.prof0, profTo:p.prof, profDelta, medFrom:S.med0, medTo:p.med, medDelta, statLog,
  evLog:S.evLog, evTitle:S.evTitle, evChoice:S.evChoice,
  ban:p.banSeasons>0
 };
 medals.forEach(m=>{
   const t=['','MISTRZOSTWO POLSKI','WICEMISTRZOSTWO','BRĄZOWY MEDAL'][m.pos];
   notes.push(m.name+': '+t+'!');
   p.career.medals=(p.career.medals||0)+1;
   if(m.pos===1) p.career.indTitles=(p.career.indTitles||0)+1;
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
 
 p.career.seasons++; p.career.matches+=matches+po.m; p.career.heats+=heats+po.h;
 p.career.pts+=pts+po.p; p.career.bon=(p.career.bon||0)+bonus+po.b;
 p.career.def+=defects+po.d; p.career.exc+=exclusions+po.w;
 if(avg>p.career.bestAvg){p.career.bestAvg=avg;p.career.best=avg.toFixed(2)+' ('+G.year+')';}
 if(pos===1) p.career.titles++;
 
 G.last=res; G.history.push(res);
 return res;
}
 
/* ---- KOMENTARZE PO SEZONIE ---- */
function seasonTalk(r,p){
 const A=[], avg=r.avg;
 const add=(who,txt)=>A.push({who,txt});
 // --- główna ocena jazdy ---
 if(r.matches===0) add('SZATNIA','„A on to w ogóle jeszcze jeździ? Myślałem, że skończył."');
 else if(avg<0.5) add('KIBIC Z SEKTORA B','„Pojechałeś jak pizda. Mój wujek na kosiarce robi lepsze czasy."');
 else if(avg<0.9) add('KIBIC Z SEKTORA B','„Kolego, ja płacę za bilet, a nie za oglądanie, jak wywozisz się na własnym cieniu."');
 else if(avg<1.4) add('TRENER','„Jest średnio. Ani nie boli, ani nie cieszy. Jak zupa w barze mlecznym."');
 else if(avg<1.8) add('TRENER','„Solidnie. Bez fajerwerków, ale w tabelce się zgadza."');
 else if(avg<2.2) add('TRENER','„No i o to chodziło. Wreszcie ktoś jedzie do tego pierwszego łuku, a nie obok."');
 else add('EKSPERT TV','„To już nie jest zawodnik ligowy. To jest problem dla reszty stawki."');
 // --- Ostafiński ---
 if(r.medDelta<=-10) add('OSTAFIŃSKI','„W tym sezonie nie napisałem o nim ani słowa. Nie było o czym. I to jest najsmutniejsze zdanie w tym tekście."');
 else if(r.medDelta>=12) add('OSTAFIŃSKI','„Rozpisywałem się o nim tak, że redakcja kazała mi zrobić przerwę. Nie zrobiłem."');
 else if(p.med>70) add('OSTAFIŃSKI','„Znowu on. Czy ktoś w tej lidze robi coś poza nim? Pytam poważnie."');
 else if(p.med<20) add('OSTAFIŃSKI','„Zapytałem o niego w parku maszyn. Nikt nie skojarzył nazwiska."');
 // --- defekty i wykluczenia ---
 if(r.defects>=6) add('MECHANIK','„'+r.defects+' defektów. Ja już nie wiem, czy to silnik, czy klątwa."');
 else if(r.defects===0&&r.heats>15) add('MECHANIK','„Zero defektów. Zapamiętaj ten sezon, bo drugi taki nie będzie."');
 if(r.exclusions>=5) add('SĘDZIA LIS','„Znam pana kevlar lepiej niż własne dzieci. '+r.exclusions+' razy pan u mnie był."');
 // --- bonusy ---
 if(r.bonus>=10) add('KOLEGA Z PARY','„Chłopie, ty tych bonusów masz tyle, że powinieneś mi płacić abonament."');
 else if(r.bonus===0&&r.heats>10) add('KOLEGA Z PARY','„Ani jednego bonusa. Ty jedziesz w tej drużynie czy obok niej?"');
 // --- tabela ---
 if(r.pos===1) add('PREZES','„Mistrzostwo! Premie wypłacimy... no, wypłacimy. Kiedyś."');
 else if(r.pos===8) add('PREZES','„Spadliśmy, ale to był rok budowania. Budowaliśmy. Dół tabeli."');
 // --- finanse ---
 if(r.strike) add('DZIENNIKARZ','„Zawodnik nie wyjechał na tor, bo klub nie płaci. Klasyka gatunku, wydanie '+r.year+'."');
 if(r.fines>50000) add('KSIĘGOWA KLUBU','„Kar na '+zl(r.fines)+'. Panie, pan więcej płaci, niż zarabia."');
 if(p.budget<0) add('KOMORNIK','„Dzień dobry. Ładny ten bus."');
 // --- sprzęt / wiek ---
 if(p.equip<15) add('TUNING-GÓR','„Ten silnik to już nie silnik. To eksponat. Przynieś go do stodoły."');
 if(p.age>=34&&avg<1.2) add('MENEDŻER','„Może czas pomyśleć o czymś spokojniejszym? Znam człowieka, ma myjnię."');
 if(p.age<=19&&avg>1.6) add('SELEKCJONER','„Zapamiętajcie to nazwisko. Albo i nie, zobaczymy za trzy lata."');
 // wybierz maks. 4, zawsze z pierwszą pozycją
 const first=A.shift(), rest=A.sort(()=>Math.random()-0.5).slice(0,3);
 return [first,...rest].filter(Boolean);
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
   Numery 1-5 / 9-13 : każdy zawodnik
   Numery 6,7 / 14,15: wyłącznie zawodnicy młodzieżowi
   Numery 8 / 16     : zawodnicy do lat 24 (mogą też juniorzy)
   ============================================================ */
// Rozkład biegów I-XIII wg dwóch regulaminowych zestawów torów.
const HEAT_SETS=[
 [[1,9,3,11],[15,6,14,7],[5,12,2,13],[14,4,10,6],[11,3,12,4],[13,2,15,1],[7,10,5,9],
  [3,13,4,14],[9,1,10,2],[6,11,5,12],[12,4,9,1],[2,15,7,11],[10,5,13,3]],
 [[9,1,11,3],[6,15,7,14],[12,5,13,2],[4,14,6,10],[3,11,4,12],[2,13,1,15],[10,7,9,5],
  [13,3,14,4],[1,9,2,10],[11,6,12,5],[4,12,1,9],[15,2,11,7],[5,10,3,13]]
];
const isHomeNum = n => n<=7;
 
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
 const map={}; for(let n=1;n<=7;n++){ if(LH[n]) map[n]=LH[n]; if(LA[n]) map[n+8]=LA[n]; }
 const REF={h:refFor(homeName), a:refFor(awayName)};
 const TRB={h:clubTrouble(homeName), a:clubTrouble(awayName)};   // kara za niepłacenie
 const st={}; Object.values(map).forEach(r=>{ if(r) st[r.id]={r, starts:0, pts:0, bon:0, codes:[], num:null}; });
 for(let n=1;n<=15;n++) if(map[n]) st[map[n].id].num=n;
 const set=HEAT_SETS[R(0,1)];
 let hs=0, as=0;
 const tacticUsed={h:false,a:false};
 const heats=[];
 const reserves=side=>[6,7].map(n=>map[side==='h'?n:n+8]).filter(Boolean);
 
 const runHeat=(nums, label)=>{
   const entries=[];
   const inHeat=()=>entries.map(e=>e.r.id);
   nums.forEach(n=>{
     const side = isHomeNum(n)?'h':'a';
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
     entries.push({r, side, home:side==='h', num:n, ref:REF[side], trouble:TRB[side]});
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
     nums=nums.map(n=>map[n]&&map[n].id===weak.id ? -cand.id : n);
     map[-cand.id]=cand;                      // wirtualny numer dla rezerwy taktycznej
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
     const side = st[s.r.id].num<=7 ? 'h':'a';
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
   Klub z płynnością płaci normalnie. Dziura w kasie = przelew "w miarę możliwości". */
function payRatioOf(club){
 const health = club.budget/Math.max(1,club.seasonCost||1);
 if(health>0.35 && (club.arr||0)<=0) return chance(88) ? 1 : cl(0.55+RF(0,0.45),0,1);
 let r = 0.15 + cl(health,0,1)*0.85 + (G.p.med/99)*0.08 + RF(-0.12,0.15);
 if(club.budget<=0) r*=0.30;
 if(club.debt>0)    r-=0.08;                 // kto raz nie zapłacił, ten znowu nie zapłaci
 return cl(r,0,1);
}
/* Progi buntu. Młodzi (poniżej 18 lat) wytrzymują dużo więcej niż seniorzy. */
function refusalThreshold(age){ return age<18 ? 100000 : 40000; }
function refusalStep(age){      return age<18 ?  10000 :  8000; }
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
function playerRoundStatus(rd){
 const p=G.p, S=G.S;
 if(p.banSeasons>0)                    return 'DYSKWALIFIKACJA';
 if(S.zeroMatches)                     return 'KARA PREZESA';
 if(S.forcedEnd && rd>=S.forcedFrom)   return 'DECYZJA POZABOISKOWA';
 if(S.walkRound===rd)                  return 'WALKOWER';
 if(S.injLeft>0){ S.injLeft--;         return 'KONTUZJA'; }
 if(S.banLeft>0){ S.banLeft--;         return 'ZAWIESZENIE'; }
 if(S.striking)                        return 'ODMOWA JAZDY — KLUB NIE PŁACI';
 if(!S.injDone && chance(S.injPerRound)){
   S.injDone=true; S.injRound=rd+1; S.injTotal=R(2,6); S.injLeft=S.injTotal-1;
   S.injDmg=R(1,4);
   p.ovr=cl(p.ovr-S.injDmg,1,99);
   const me=G.riders.find(r=>r.me); if(me) me.ovr=cl(me.ovr-S.injDmg,1,99);
   return 'KONTUZJA';
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
   const status = (ctx&&myClub) ? playerRoundStatus(rd) : null;
   if(meR) meR.out = !!status;                      // trener nie ma cię do dyspozycji
   LKEYS.forEach(k=>{
     (st[k].sched[rd]||[]).forEach(([h,a])=>{
       const mine = myClub && k===myLk && (h===myClub||a===myClub);
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
       // punkt bonusowy za wygrany dwumecz — dopisywany po rewanżu
       const key=[h,a].sort().join('||'), A=st[k].agg;
       if(!A[key]) A[key]={first:{h,a,hs:M.hs,as:M.as}};
       else {
         const f=A[key].first;
         const g1 = f.h===h ? f.hs+M.hs : f.hs+M.as;    // dorobek klubu `h` w dwumeczu
         const g2 = f.h===h ? f.as+M.as : f.as+M.hs;
         const rowH=T[hi], rowA=T[ai];
         if(g1>g2){rowH.pts++;rowH.bon++;} else if(g2>g1){rowA.pts++;rowA.bon++;}
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
           why: status || (c? 'ŁAWKA / POZA SKŁADEM' : 'BRAK MIEJSCA W SKŁADZIE')});
       }
     });
   });
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
 squadOf(c.name).forEach(r=>{ if(r.me) return; r.ovr=cl(Math.round(r.ovr+d+gauss(0,1.1)),1,99); });
 c.ovr=squadStrength(c.name);
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
 
/* --- KADRY KLUBOWE (SKALA 1:1) ---
   OVR klubu to poziom jego pierwszej piątki. Klub 95 ma piątkę w okolicach 95,
   juniorzy siedzą 15-30 punktów niżej i dopiero z wiekiem podchodzą pod kadrę. --- */
const junOvr = (L,age) => L - (22-age)*5.0 - R(0,6);      // 16 lat: ~L-36, 21 lat: ~L-8
function genSquad(club){
 const L=riderLevel(club), sq=[];
 for(let i=0;i<5;i++) sq.push(makeRider(R(23,36), gauss(L-1,4.2), club.name));     // pierwsza piątka
 sq.push(makeRider(R(22,24), gauss(L-7,5), club.name));                            // zawodnik U24
 sq.push(makeRider(R(25,34), gauss(L-9,5), club.name));                            // rezerwowy senior
 for(let i=0;i<4;i++){ const a=R(16,21); sq.push(makeRider(a, junOvr(L,a)+gauss(0,3), club.name, gauss(L-2,7))); }
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
 // dostrojenie: przesuwamy kadrę tak, żeby jej siła zgadzała się z OVR klubu
 for(let pass=0;pass<5;pass++){
   allClubs().forEach(c=>{
     const diff=c.ovr-squadStrength(c.name);
     if(Math.abs(diff)<1) return;
     squadOf(c.name).forEach(r=>r.ovr=cl(Math.round(r.ovr+diff*0.9),1,99));
   });
 }
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
 allClubs().forEach(c=>{ c.ovr=squadStrength(c.name); });
 const TARGET={EL:85.0, E2:65.0, KL:45.0};
 LKEYS.forEach(k=>{
   const cs=G.leagues[k].clubs;
   const avg=cs.reduce((a,c)=>a+c.ovr,0)/cs.length;
   const drift=TARGET[k]-avg;
   if(Math.abs(drift)<3) return;                       // słaba korekta — kluby mają prawo się rozjechać
   cs.forEach(c=>squadOf(c.name).forEach(r=>{ if(!r.me) r.ovr=cl(Math.round(r.ovr+drift*0.30),1,99); }));
 });
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
     if(o.out) t.codes.push(o.out); else t.codes.push(H.pts[i]===0?'-':String(H.pts[i]));
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
     meFin = o.out || String(fin.pts[meIdx]); meCodes.push('F:'+(o.out||(fin.pts[meIdx]===0?'-':fin.pts[meIdx]))); }
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
function makeOffers(){
 const p=G.p, cands=[];
 const lastAvg = G.history.length ? G.history[G.history.length-1].avg : 1.4;
 const rating = p.ovr + p.med*0.08 + (p.next.betterOffers?5:0) + (lastAvg-1.4)*7;
 
 /* --- JEDNA FABRYKA OFERT (używana też przez skutki zdarzeń losowych) --- */
 const mkOffer=(c,lk,gap)=>{
   const pro = c.ovr>55 || p.ovr>45;
   const rate = pro ? Math.round((600 + c.ovr*38 + c.budget/26000) * RF(0.85,1.2) * cl(1+gap*0.02,0.7,1.4))
                    : R(150,400);
   // BRAK OFERT SPONSORSKICH (decyzja „pierdolcie się, śmieszki”) = zero premii za podpis
   const bon  = (pro && !p.next.noSponsor) ? Math.round(c.budget*RF(0.008,0.05)*cl(rating/70,0.3,1.6)) : 0;
   return {club:c.name, lk, ovr:c.ovr, budget:c.budget, debt:c.debt,
     type: pro?'Zawodowy':'Amatorski', years:R(1,3), rate, bonus:bon,
     stay:c.name===p.club, ride:appearanceChance(p, c, 55, null)};
 };
 const findClub=name=>{ for(const k of LKEYS){ const f=G.leagues[k].clubs.find(x=>x.name===name || x.name.includes(name)); if(f) return {c:f,lk:k}; } return null; };
 
 /* --- WYMUSZONY TRANSFER (świstek, wiatrówka, plan kolegi, Słowacja, diamenty) --- */
 if(p.next.forceClub){
   const want=p.next.forceClub; p.next.forceClub=null; p.next.noSponsor=false;
   let hit=null;
   if(want==='weak'){ const c=pick(G.leagues.KL.clubs.slice().sort((a,b)=>a.ovr-b.ovr).slice(0,3)); hit={c, lk:'KL'}; }
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
 
 // ILE OFERT MOŻESZ W OGÓLE DOSTAĆ
 let maxOffers;
 if(p.age<=21)      maxOffers = 4;                          // juniora chce każdy, regulamin
 else if(p.age<=24) maxOffers = 3;                          // pozycja U24
 else               maxOffers = rating>72?4 : rating>58?3 : rating>46?2 : 1;
 if(p.age>34) maxOffers = Math.max(1, maxOffers-1);
 if(p.prof<25) maxOffers = Math.max(1, maxOffers-1);
 
 // JAK DALEKO PONIŻEJ POZIOMU KLUBU MOŻESZ BYĆ, ŻEBY W OGÓLE ZADZWONILI
 // (junior wypełnia rubrykę młodzieżową, więc bierze go nawet klub o klasę wyżej)
 const floor = p.age<=21 ? -45 : p.age<=24 ? -22 : -8;
 
 LKEYS.forEach(lk=>{
  G.leagues[lk].clubs.forEach(c=>{
   if(p.next.noRenew && c.name===p.club) return;
   const gap = rating - riderLevel(c);            // >0 = jesteś ponad poziomem tej drużyny
   if(gap < floor) return;                        // twarde odcięcie: za słaby, nie zadzwonią
   let want = 50 + gap*2.2 + (c.name===p.club?p.loyalty*1.1:0) - (p.prof<35?10:0);
   // juniora chce każdy — bez niego klub nie wypełni rubryki młodzieżowej
   if(p.age<=21) want = Math.max(want+16, 32); else if(p.age<=24) want += 7;
   if(p.age>33) want -= 18;
   if(c.debt>150000) want += 14;                  // klub z długami bierze każdego
   if(c.name.includes('ROW Rybnik') && p.next.rowPen) want -= 25;
   if(!chance(cl(want,3,96))) return;
   cands.push({c,lk,gap});
  });
 });
 
 // koło ratunkowe: jak nikt nie chce, czasem odezwie się ktoś z dołu KLŻ
 if(!cands.length && p.banSeasons===0 && chance(60)){
   const weak=G.leagues.KL.clubs.slice().sort((a,b)=>a.ovr-b.ovr).slice(0,3);
   const c=pick(weak); cands.push({c, lk:'KL', gap:rating-riderLevel(c), lifeline:true});
 }
 
 // najmocniejsze kluby, które faktycznie cię chcą
 cands.sort((a,b)=> b.c.ovr - a.c.ovr);
 const out = cands.slice(0,maxOffers).map(({c,lk,gap})=>mkOffer(c,lk,gap));
 p.next.noSponsor=false;      // blokada sponsorska obowiązywała na TO okienko
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
   // pierwszy kontrakt w karierze: sprzęt startowy = 20 (zgodnie z regulaminem gry)
   p.equip = p.career.seasons===0 ? 20 : cl(Math.round(20+c.ovr*0.32),1,99);
   p.mech=25; p.mechName='Mechanik klubowy (z łapanki)';
 }
 G.screen='hub'; render();
}