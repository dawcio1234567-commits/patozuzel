/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: ZAWODNICY, KADRY I TRENERZY
   makeRider, isJun/isU24, genSquad, ageRiders + AI TRENERÓW
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2762-2905 oryginału).
   PATCH 22.08.2026 (Sprint 3): doszła cała sekcja AI TRENERÓW —
   generowanie szkoleniowców, sympatie, presja, status w zespole
   i wpływ trenera na rozwój OVR po sezonie.
   ============================================================ */
/* ============================================================
   5d. ZAWODY INDYWIDUALNE
   IMP · MIMP · ZŁOTY / SREBRNY / BRĄZOWY KASK
   Wszystko wg tabeli 20-biegowej: 16 zawodników, po 5 startów.
   ============================================================ */
let RID=1;
function blankSea(){return {m:0,starts:0,pts:0,bon:0,def:0,exc:0,rep:0};}
function makeRider(age,ovr,club,pot){
 const o=cl(Math.round(ovr),1,99);
 const p=cl(Math.round(pot!==undefined?pot:o+(age<=21?R(14,34):age<=24?R(5,14):R(0,4))),o,99);
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
/* ------------------------------------------------------------
   POTENCJAŁ MŁODZIEŻOWCA — SZERSZE OKNO (zmiana 22.08.2026)
   ------------------------------------------------------------
   Wcześniej junior dostawał potencjał gauss(poziom klubu - 2, 7). W klubie
   Krajowej Ligi (OVR ~50) oznaczało to sufit w okolicach 45-55 — czyli
   NIKT wychowany w niższej lidze nie miał prawa zostać gwiazdą, a każdy
   ligowy talent musiał urodzić się od razu w Ekstralidze. Tak to nie
   działa: Zmarzlik nie wychował się w klubie mistrzowskim. Okno jest
   teraz szersze i ma własną loterię — mniej więcej co dziesiąty junior
   dostaje potencjał wyraźnie ponad poziom swojego klubu.
   ------------------------------------------------------------ */
function youthPot(L){
 let v = gauss(L+1, 8.5);
 if(chance(10)) v += R(8,22);          // jeden na dziesięciu to talent z zapadłej dziury
 return cl(Math.round(v), 18, 99);
}
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
 for(let i=0;i<4;i++){ const a=R(16,21); sq.push(makeRider(a, junOvr(L,a)+gauss(0,3), club.name, youthPot(L))); }
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
 ensureCoaches();                    // Sprint 3: każdy klub dostaje szkoleniowca
}

/* ============================================================
   ================  AI TRENERÓW (Sprint 3)  ==================
   ------------------------------------------------------------
   Trener jest własnością KLUBU (c.coach), a nie stanu gry, dzięki czemu
   przeżywa wszystko, co przeżywa klub: awanse, spadki, upadłość i zmianę
   szyldu. Tworzy się leniwie — clubCoach() dorobi go w locie każdej
   drużynie, która jeszcze go nie ma (także w rozgrywce wczytanej sprzed
   tego patcha).
   ------------------------------------------------------------
   Co z niego wynika:
     coachRel()      — sympatia -100..+100 i status w zespole
     coachPressure() — ile mu się pali pod nogami (0-100)
     coachDevMul()   — mnożnik rozwoju OVR zawodnika po sezonie
     fireCoach()     — zwolnienie z hukiem + wpis do G.coachLog
   ============================================================ */
let COID=1;
/* Lookup klubu po nazwie z indeksem. coachRel() woła to przy KAŻDYM rzucie
   appearanceChance() (140 losowań x 11 zawodników), więc liniowe przeszukanie
   24 klubów przez allClubs() — które za każdym razem buduje nową tablicę —
   robiło z tego kilkaset tysięcy alokacji na sezon. Indeks przebudowuje się,
   gdy zmieni się rok albo liczebność lig (awanse, spadki, upadłości), i sam
   się naprawia, gdy trafi na nieaktualny wpis (zmiana nazwy po sponsorze). */
let _cbIdx=null, _cbKey='';
function clubIndexBuild(key){
 _cbIdx=new Map(); allClubs().forEach(c=>_cbIdx.set(c.name,c)); _cbKey=key;
}
function clubByName(n){
 if(!n) return null;
 if(typeof n==='object') return n;
 const key=G.year+'|'+LKEYS.map(k=>G.leagues[k].clubs.length).join(',');
 if(!_cbIdx || _cbKey!==key) clubIndexBuild(key);
 let c=_cbIdx.get(n);
 if(!c || c.name!==n){ clubIndexBuild(key); c=_cbIdx.get(n); }
 return c || null;
}
function coachType(co){ return COACH_TYPES.find(t=>t.id===(co&&co.type)) || COACH_TYPES[0]; }
function coachName(){
 const i = (typeof IMIE!=='undefined' && IMIE.length) ? pick(IMIE) : 'Mirosław';
 const n = (typeof NAZW!=='undefined' && NAZW.length) ? pick(NAZW) : 'Kowalik';
 return i+' '+n;
}
function makeCoach(club){
 const t=pick(COACH_TYPES);
 const base = club ? riderLevel(club) : 50;
 /* Warsztat trenera idzie za poziomem klubu, ale luźno: w Krajowej Lidze
    trafia się szkoleniowiec lepszy niż połowa Ekstraligi — i odwrotnie,
    bo w Ekstralidze zatrudnia się też po znajomości. */
 const skill = cl(Math.round(gauss(26 + base*0.55, 12)), 5, 97);
 return {id:COID++, name:coachName(), type:t.id, skill,
   auth: cl(Math.round(t.auth + (skill-50)*0.55 + gauss(0,8)), 5, 98),
   nerve: R(18,84), since: (typeof G!=='undefined'&&G?G.year:2026), seasons:0};
}
function clubCoach(name){
 const c=clubByName(name);
 if(!c) return null;
 if(!c.coach) c.coach=makeCoach(c);
 return c.coach;
}
function ensureCoaches(){ allClubs().forEach(c=>{ if(!c.coach) c.coach=makeCoach(c); }); }
function meRider(){
 const r = G.riders ? G.riders.find(x=>x.me) : null;
 if(r) return r;
 const p=G.p;
 return p ? {id:-1, me:true, name:p.name, ovr:p.ovr, age:p.age, form:p.form||0, club:p.club, sea:null} : null;
}
/* Trener nie widzi „statystyk" zawodników AI, bo ich nie ma. Widzi to,
   co widzi na torze: poziom, wiek i to, ile dowozi. Dla GRACZA czyta
   prawdziwe liczby z G.p. */
function riderProfile(r){
 if(!r) return null;
 if(r.me && G.p){
   const h=G.history&&G.history.length?G.history[G.history.length-1]:null;
   /* OVR bierzemy z REKORDU zawodnika, nie z G.p: w trakcie sezonu meR.ovr to
      OVR EFEKTYWNY (umiejętności + sprzęt + atmosfera), a trener ocenia
      dokładnie to, co widzi na torze. Poza sezonem oba są równe. */
   /* Średnia: najpierw BIEŻĄCY sezon z kartoteki (r.sea aktualizuje simMeeting
      i generator live), a dopiero w jego braku ostatni wiersz historii.
      Bez tego trener oceniał cię po zeszłym roku jeszcze w chwili, w której
      liczyliśmy rozwój po TYM sezonie. */
   const cur = (r.sea && r.sea.starts) ? (r.sea.pts + (r.sea.bon||0))/r.sea.starts : null;
   return {ovr:(r.ovr!=null?r.ovr:G.p.ovr), prof:G.p.prof, med:G.p.med, loy:G.p.loyalty, age:G.p.age,
     jun:G.p.age<=21, me:true, form:(r.form!=null?r.form:(G.p.form||0)),
     avg: cur!=null ? cur : (h?(h.avg||null):null)};
 }
 const avg = (r.sea && r.sea.starts) ? r.sea.pts/r.sea.starts : null;
 return {ovr:r.ovr, prof:cl(Math.round(42+(r.ovr-50)*0.45),5,95),
   med:cl(Math.round(22+(r.ovr-50)*0.85),0,95), loy:50, age:r.age,
   jun:isJun(r), me:false, form:r.form||0, avg};
}
function coachStatus(rel){
 return COACHB.status.find(s=>rel>=s.min) || COACHB.status[COACHB.status.length-1];
}
/* ------------------------------------------------------------
   SYMPATIA TRENERA (-100..+100)
   ------------------------------------------------------------
   Wymóg z patcha: „Jeśli gracz bardzo odstaje sportowo od drużyny (w dół
   lub w górę), trener musi go nie lubić (i odstawiać) — i vice versa."
   Dlatego rdzeniem wzoru NIE jest sam OVR, tylko RÓŻNICA między tobą
   a poziomem drużyny. Za słaby — trener nie ma na ciebie pomysłu.
   Za dobry — trener przestaje być najważniejszą osobą w klubie i zaczyna
   liczyć, ile zostało mu do końca kontraktu. Tolerancja rośnie z jego
   warsztatem (dobry szkoleniowiec uniesie gwiazdę) i z typem: wychowawca
   wybaczy słabszemu, dyktator nie wybaczy nikomu.
   ------------------------------------------------------------ */
function coachRel(clubName, r){
 const c=clubByName(clubName), co=clubCoach(c);
 const P=riderProfile(r);
 if(!co||!P) return {rel:0, gap:0, parts:[], coach:co, type:coachType(co), lvl:50,
                     status:coachStatus(0), tol:15};
 const T=coachType(co);
 const lvl = riderLevel(c);
 const gap = P.ovr - lvl;
 const tol = T.tol + co.skill*0.11;
 const parts=[]; let rel=0;
 const add=(v,w)=>{ const d=Math.round(v); if(d){ rel+=d; parts.push({d, w}); } };
 add((P.prof-50)*(T.w.prof)*0.50, 'profesjonalizm '+P.prof);
 add((P.med -50)*(T.w.med )*0.50, 'medialność '+P.med);
 add((P.loy -45)*(T.w.loy )*0.26, 'lojalność '+P.loy);
 if(P.avg!=null) add((P.avg-1.55)*T.w.pts*16, 'średnia biegowa '+P.avg.toFixed(2));
 /* BIEŻĄCEJ DYSPOZYCJI TU NIE MA — I NIE MOŻE BYĆ.
    Forma wchodzi do składu osobno, przez LINEUP_FORM_W w lineupValue().
    Gdyby siedziała jeszcze w sympatii, ten sam dołek liczyłby się dwa razy:
    raz jako gorsza jazda, drugi raz jako „trener przestał cię lubić".
    Sympatia to opinia z całego sezonu (dorobek, profesjonalizm, medialność,
    lojalność, poziom względem drużyny), a nie humor po jednym meczu. */
 const over=Math.abs(gap)-tol;
 if(over>0){
   /* ODSTAJESZ. W górę boli tym bardziej, im słabszy autorytet ma trener. */
   const up = gap>0;
   const mul = up ? 1.45*cl((110-co.auth)/60, 0.45, 1.55) : 1.15;
   add(-over*mul, up ? 'jesteś o '+Math.round(gap)+' OVR ponad poziom drużyny — trener liczy dni do końca kontraktu'
                     : 'jesteś o '+Math.round(-gap)+' OVR poniżej poziomu drużyny — trener nie ma na ciebie pomysłu');
 } else {
   add(7 + (tol-Math.abs(gap))*0.40, 'pasujesz do poziomu drużyny (różnica '+(gap>0?'+':'')+Math.round(gap)+' OVR)');
 }
 if(P.jun) add(T.youth*2.2, 'młodzieżowiec — rubryka, którą trener musi wypełnić');
 rel=cl(Math.round(rel), -100, 100);
 /* NAZWA STATUSU BIERZE POD UWAGĘ NIE TYLKO SYMPATIĘ, ALE I POWÓD.
    Zawodnik wyraźnie LEPSZY od drużyny, którego trener nie znosi, nie jest
    „rubryką do wypełnienia" — jest gwiazdą, której ten trener nie umie
    ustawić. Skutek na torze ten sam (odstawianie), ale nazwa musi mówić
    prawdę, bo z niej gracz czyta, o co w tym konflikcie chodzi. */
 let S=coachStatus(rel);
 if(rel<0 && gap>tol)        S=COACHB.tooGood;
 else if(rel<-14 && gap<-tol) S=COACHB.tooWeak;
 return {rel, gap:Math.round(gap*10)/10, parts, coach:co, type:T, lvl:Math.round(lvl),
         status:S, tol:Math.round(tol)};
}
/* Skrót używany w silniku meczu — sama liczba, bez rozpiski. */
function coachLike(clubName, r){ return coachRel(clubName, r).rel; }
/* ------------------------------------------------------------
   PRESJA NA TRENERZE (0-100)
   Wyliczana z: warsztatu, wyników drużyny względem siły kadry,
   nastrojów wokół klubu, długów — ORAZ z ciebie: twojego OVR,
   medialności i tego, czy jesteście ze sobą w konflikcie.
   ------------------------------------------------------------ */
function coachPressure(clubName, opt){
 const c=clubByName(clubName), co=clubCoach(c);
 if(!c||!co) return {v:0, parts:[], coach:null, hot:false};
 const parts=[]; let v=30;
 const add=(x,w)=>{ const d=Math.round(x); if(d){ v+=d; parts.push({d,w}); } };
 add((58-co.skill)*0.34, 'warsztat trenerski '+co.skill);
 add((50-(c.mood!=null?c.mood:50))*0.18, 'nastroje wokół klubu');
 if((c.debt||0)>0) add(cl(c.debt/180000, 0, 12), 'zaległości klubu wobec kadry');
 const lk = (typeof leagueOfClub==='function') ? leagueOfClub(c.name) : null;
 if(lk && G.leagues[lk]){
   const cs=G.leagues[lk].clubs.slice().sort((a,b)=>b.ovr-a.ovr);
   const expect=cs.findIndex(x=>x.name===c.name)+1;
   const pos=(opt&&opt.pos)?opt.pos:expect;
   add((pos-expect)*5.5, 'miejsce '+pos+'. przy kadrze na '+expect+'.');
 }
 if(G.p && G.p.club===c.name){
   const REL=coachRel(c.name, meRider());
   add((G.p.med-50)*0.15, 'medialność zawodnika '+G.p.med);
   if(REL.rel<-20) add(-REL.rel*0.18, 'otwarty konflikt z zawodnikiem, o którym piszą');
   if(REL.gap>REL.tol) add(cl(REL.gap*0.55,0,18), 'masz w kadrze kogoś lepszego od całej reszty');
 }
 if((co.seasons||0)>=4) add(-6, 'lata pracy w klubie — kredyt zaufania');
 v=cl(Math.round(v),0,100);
 return {v, parts, coach:co, hot:v>=COACHB.fireAt};
}
/* ------------------------------------------------------------
   ROZWÓJ POD TRENEREM
   Mnożnik przyrostu OVR. Ten sam mnożnik odwrócony (2-m) obsługuje
   ZJAZD po trzydziestce: dobry szkoleniowiec przedłuża karierę,
   słup ogłoszeniowy ją skraca.
   ------------------------------------------------------------ */
function coachDevMul(clubName, r){
 const co=clubCoach(clubName);
 if(!co||!r) return 1;
 const T=coachType(co);
 /* PUNKT ZEROWY: trener o warsztacie 60 (średnia w tej grze — patrz makeCoach)
    nie zmienia niczego, m=1.00. Dopiero powyżej przyspiesza, poniżej hamuje.
    Bez tego KAŻDY szkoleniowiec rozpędzał kadrę, bo skala startowała od 0,72. */
 let m = 1 + (co.skill-60)/85 + T.dev/100;
 const rel=coachLike(clubName, r);
 m *= 1 + cl(rel,-100,100)/270;
 if(isJun(r)) m *= 1 + T.youth*0.022;
 return cl(m, COACHB.devMin, COACHB.devMax);
}
/* ILE TRENER DOKŁADA DO SUROWEGO PRZYROSTU.
   Jeden wzór dla wszystkich ścieżek: przyrost mnożymy przez mnożnik trenera,
   a SPADEK przez jego odwrotność (2-m). Zwracamy samą RÓŻNICĘ, żeby dało się
   ją wpisać jako osobną rubrykę w rozpisce rozwoju (engine/09). */
function coachGrowthDelta(clubName, r, growth){
 const m=coachDevMul(clubName, r);
 return growth>0 ? growth*(m-1) : growth*(1-m);
}
/* GRACZ: trener dokłada (albo zabiera) osobno, PONAD to, co policzy
   engine/09-sezon-przebieg.js. Odpalane raz na rok z ageRiders(). */
function coachAgePlayer(){
 const p=G.p;
 if(!p || p.retired || !p.club) return null;
 /* engine/09-sezon-przebieg.js wlicza trenera PROSTO w rozwój po sezonie
    (gAdd) i zapala tę flagę. Wtedy tutaj nie ma czego dodawać — konsumujemy
    ją i wychodzimy, żeby ten sam trener nie policzył się dwa razy. Gdyby
    ktoś wgrał sam ten moduł, bez zmiany w 09, flaga nigdy nie wstaje
    i rozliczenie leci tutaj, po staremu. */
 if(p.coachDevApplied){ p.coachDevApplied=false; return p.coachDev||null; }
 if(p.coachDevYear===G.year) return p.coachDev||null;
 const me=meRider(); if(!me) return null;
 const REL=coachRel(p.club, me);
 const m=coachDevMul(p.club, me);
 const K = p.age<=21?COACHB.devPlayerK.jun : p.age<=24?COACHB.devPlayerK.u24
         : p.age<=30?COACHB.devPlayerK.prime : COACHB.devPlayerK.old;
 const d = Math.round((m-1)*K);
 p.coachDevYear=G.year;
 p.coachDev={d, m:Math.round(m*100)/100, rel:REL.rel, status:REL.status.n,
   coach:REL.coach.name, type:REL.type.n, skill:REL.coach.skill,
   why: d>0 ? 'trener wyciągnął z ciebie więcej, niż dawał sam talent'
      : d<0 ? 'rok pod trenerem, który nie miał na ciebie pomysłu'
            : 'trener nie zmienił w tobie nic — ani w dobrą, ani w złą stronę'};
 if(d){ p.ovr=cl(p.ovr+d,1,99); const mr=G.riders.find(x=>x.me); if(mr) mr.ovr=p.ovr; }
 (G.coachLog=G.coachLog||[]).push({year:G.year, club:p.club, kind:'dev', me:true,
   coach:REL.coach.name, d, rel:REL.rel, status:REL.status.n,
   txt:'Rok pod trenerem '+REL.coach.name+' ('+REL.type.n+'): '+(d>0?'+':'')+d+' OVR, status w zespole: '+REL.status.n+'.'});
 return p.coachDev;
}
/* ------------------------------------------------------------
   ZWOLNIENIE TRENERA — zawsze z hukiem i zawsze z wpisem do historii.
   ------------------------------------------------------------ */
function fireCoach(clubName, why, extra){
 const c=clubByName(clubName); if(!c) return null;
 const old=clubCoach(c);
 const neo=makeCoach(c);
 c.coach=neo;
 const e={year:G.year, club:c.name, kind:'fire',
   out: old?old.name:'—', outType: old?coachType(old).n:'—', outSkill: old?old.skill:0,
   inn: neo.name, innType: coachType(neo).n, innSkill: neo.skill,
   why: why||'wyniki', me: !!(extra&&extra.me),
   txt: (extra&&extra.txt) || ((old?old.name:'Trener')+' pożegnany w klubie '+c.name+'. Powód: '+(why||'wyniki')+'.')};
 (G.coachLog=G.coachLog||[]).push(e);
 /* Trenerów wyrzuconych PRZEZ CIEBIE liczymy osobno — to trafia na kartę kariery. */
 if(e.me && G.p && G.p.career) G.p.career.coachesFired=(G.p.career.coachesFired||0)+1;
 return e;
}
/* Koniec roku w gabinetach: kto się nie wyrobił, ten pakuje kożuch. */
function coachSeasonEnd(){
 allClubs().forEach(c=>{
   const co=clubCoach(c); if(!co) return;
   co.seasons=(co.seasons||0)+1;
   const P=coachPressure(c.name);
   if(P.hot && chance(cl((P.v-COACHB.fireAt)*2.4, 6, 82)))
     fireCoach(c.name, 'presja wyników ('+P.v+'/100)');
   else if(chance(4)) fireCoach(c.name, 'odszedł sam, „za porozumieniem stron"');
 });
}
/* Krótka notka do raportu sezonu / UI. */
function coachReport(clubName, seasonRow){
 const co=clubCoach(clubName); if(!co) return null;
 const REL=coachRel(clubName, meRider());
 const P=coachPressure(clubName, seasonRow&&seasonRow.pos?{pos:seasonRow.pos}:null);
 /* Rozliczenie roku pod trenerem bierzemy z ZAMROŻONEGO wiersza sezonu
    (engine/09 wkłada je do raportu), a dopiero w jego braku z żywego G.p —
    dzięki temu raport sprzed trzech lat pokazuje tamtego trenera, nie obecnego. */
 const dev=(seasonRow&&seasonRow.coachDev) ? seasonRow.coachDev : ((G.p&&G.p.coachDev)?G.p.coachDev:null);
 const fires=(G.coachLog||[]).filter(x=>x.kind==='fire' && x.club===clubName).slice(-3);
 return {coach:co, type:coachType(co), rel:REL, press:P, dev, fires, quote:coachQuote(REL,P)};
}
function coachQuote(REL, P){
 const T=REL.type, r=REL.rel;
 if(r>=72) return 'Bez niego nie ustawiam tej drużyny. Mogą mnie zwolnić, i tak to powiem.';
 if(r>=42) return T.flavor;
 if(r>=14) return 'Solidny zawodnik. Wie, gdzie stanąć i kiedy nie gadać.';
 if(r>=-14) return 'Jest w kadrze. Kiedy trzeba, pojedzie.';
 if(r>=-44) return REL.gap>0
   ? 'Niech sobie jeździ w tych swoich Grand Prix. Ja tu układam skład na czternaście kolejek.'
   : 'Ja go wystawiam, bo regulamin każe. Gdyby nie rubryka, nie byłoby go w programie.';
 return (P&&P.hot)
   ? 'Albo on, albo ja. I obaj wiemy, kto tu jest tańszy.'
   : 'Wozi kevlar i patrzy. Tyle mam do powiedzenia.';
}
/* ============================================================
   ==================  KONIEC AI TRENERÓW  ====================
   ============================================================ */

function ageRiders(){
 ensureCoaches();
 coachAgePlayer();                  // Sprint 3: trener dokłada gracza swoje ±OVR
 G.riders.forEach(r=>{
   if(r.me) return;
   r.age++; r.inj=0; r.out=false; r.strike=false; r.form=0; r.sea=blankSea();
   let g = r.age<=21?7.4 : r.age<=24?4.4 : r.age<=28?1.8 : r.age<=32?0.1 : r.age<=36?-2.6 : -5;
   if(g>0) g *= cl(((r.pot||r.ovr+6)-r.ovr)/9, 0, 1);        // im bliżej sufitu, tym wolniej
   /* SPRINT 3: JAKOŚĆ TRENERA DECYDUJE O TEMPIE.
      Przyrost mnożymy przez mnożnik trenera, a SPADEK przez jego odwrotność
      (2-m) — dzięki temu ten sam szkoleniowiec, który rozpędza juniora,
      hamuje też zjazd trzydziestolatka. */
   if(r.club) g += coachGrowthDelta(r.club, r, g);
   r.ovr = cl(Math.round(r.ovr+g+gauss(0,2.0)),1,99);
   if(r.age>=R(33,41) && chance(28)) r.retired=true;
   if(r.age>41) r.retired=true;
 });
 G.riders=G.riders.filter(r=>!r.retired||r.me);
 // uzupełnienie kadr: junior z własnego szkolenia albo transfer
 allClubs().forEach(c=>{
   const sq=squadOf(c.name), L=riderLevel(c);
   const jun=sq.filter(isJun).length, sen=sq.filter(r=>!isU24(r)).length;
   for(let i=jun;i<3;i++) G.riders.push(makeRider(16, junOvr(L,16)+gauss(0,4), c.name, youthPot(L)));
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
 coachSeasonEnd();                 // Sprint 3: rozliczenie szkoleniowców po sezonie
 worldAge();                       // reszta świata też ma kolejny rok na karku
}
