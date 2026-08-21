/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: SEZON PRZEBIEG
   resolveSeasonGen — GŁÓWNY generator sezonu (pauzy na wielki mecz)
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 564-1340 oryginału).
   ============================================================ */
/* ============================================================
   ROZSTRZYGNIĘCIE SEZONU — TERAZ JAKO GENERATOR (patch 22.08.2026)
   ------------------------------------------------------------
   DLACZEGO GENERATOR: cały sezon liczył się do tej pory w jednym,
   nieprzerywalnym wywołaniu — klikasz „dalej" i dostajesz gotowy raport.
   Tryb WIELKIEGO MECZU wymaga czegoś odwrotnego: symulacja musi ZATRZYMAĆ
   SIĘ w środku (przed półfinałem, przed ostatnią rundą IMP), oddać
   sterowanie interfejsowi, poczekać na decyzję gracza i ruszyć dalej
   dokładnie z tego samego miejsca, ze wszystkimi zmiennymi lokalnymi.
   Rozbijanie tej funkcji na kawałki oznaczałoby przepisanie 600 linii
   i przeniesienie kilkudziesięciu zmiennych do wspólnego worka — generator
   robi to samo bez jednej linii przenoszenia stanu.
     · resolveSeason()      — start sezonu (jak dawniej; zwraca raport ALBO null)
     · seasonStep(decyzja)   — wznowienie po decyzji gracza
     · null jako wynik       — „sezon czeka na ciebie", szczegóły w G.pause
   ============================================================ */
let _seaGen=null;
function resolveSeason(){ _seaGen=resolveSeasonGen(); return seasonStep(); }
function seasonStep(input){
 if(!_seaGen) return G.last||null;
 let r;
 try{ r=_seaGen.next(input); }
 catch(err){
   /* Awaria w środku sezonu nie ma prawa zablokować gry na zawsze — lepiej
      stracić tryb jazdy niż całą karierę. */
   console.error('SEZON:', err);
   _seaGen=null; G.pause=null; G.live=null;
   return G.last||null;
 }
 if(r.done){ _seaGen=null; G.pause=null; G.live=null; return r.value; }
 G.pause=r.value;
 return null;
}
function seasonPending(){ return !!_seaGen; }
/* Twardy reset — wołany przy restarcie kariery, żeby niedokończony sezon
   z poprzedniego przebiegu nie został w pamięci generatora. */
function seasonReset(){ _seaGen=null; if(G){ G.pause=null; G.live=null; G.liveSnap=null; } }
function* resolveSeasonGen(){
 const p=G.p, S=G.S, club=getClub(p), lk=p.lk;
 const notes=[];
 /* --- OVR ZE ZDARZENIA: fxO zmienia p.ovr od razu po wyborze opcji, więc
        różnica względem stanu z początku sezonu (S.ovr0) to CZYSTY skutek
        zdarzenia. Wcześniej nikt tego nigdzie nie pokazywał i wyglądało to
        tak, jakby zdarzenia "nie dodawały OVR". --- */
 const evOvrDelta = p.ovr - (S.ovr0!=null?S.ovr0:p.ovr);
 if(evOvrDelta) logOvr(evOvrDelta, 'zdarzenie: '+(S.evTitle||'decyzja z ekranu zdarzenia'));
 
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
 yield* simSeasonChronoGen(ctx, lk, club.name, S.teamPts, true);
 meR.out=false;
 /* STATYSTYKI INDYWIDUALNE WSZYSTKICH LIG — zdjęcie po rundzie zasadniczej,
    zanim play-off dołoży biegi tylko połowie stawki. */
 const leagueStats = buildLeagueStats();
 const myRank = myLeagueRank(leagueStats, lk);
 
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
 /* --- WIELKI MECZ: wszystko, co się w nim wydarzyło poza torem --- */
 (S.notesBig||[]).forEach(x=>notes.push(x));
 (S.bigLog||[]).forEach(b=>notes.push('WIELKI MECZ — '+b.title+': '+b.mine+':'+b.theirs+
   (b.me&&b.me.starts?' (twoje '+(b.me.pts+b.me.bon)+' pkt z '+b.me.starts+' startów)':' (nie dojechałeś zawodów)')+'.'));
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
 for(const k of LKEYS){
   const kc = (k===lk && canRidePO) ? ctx : null;
   const kn = (k===lk) ? club.name : null;
   /* Tylko liga Gracza może się zatrzymać na WIELKI MECZ — pozostałe dwie
      lecą jak dotąd, jednym wywołaniem. */
   if(kc) yield* runPhaseGen(k, kc, kn, true);
   else runPhase(k, kc, kn);
 }
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
 /* ŚREDNIA Z BONUSAMI (patch 21.08.2026): punkt bonusowy to punkt zdobyty
    na torze, więc od teraz wchodzi do średniej biegopunktowej — w lidze,
    w play-offie i w dorobku łącznym. */
 po.avg = po.h>0 ? (po.p+po.b)/po.h : 0;
 po.avgTxt = po.h>0 ? po.avg.toFixed(2) : '—';
 
 /* --- DMPJ: jedziesz WYŁĄCZNIE do 21. roku życia (twardy warunek) --- */
 const injured=S.injDone, injMissed=S.injTotal;
 const blocked = p.banSeasons>0 || S.zeroMatches || S.longInjury || matches===0 || !!S.cried;
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
 
 /* --- ŚREDNIA BIEGOPUNKTOWA (LIGA) = (PKT + BONUSY) / BIEGI ---
    Punkty bonusowe wliczają się do średniej (zmiana z 21.08.2026). --- */
 const avg = heats>0 ? (pts+bonus)/heats : 0;
 const avgTxt = heats>0 ? avg.toFixed(2) : '—';
 
 /* --- ZAWODY INDYWIDUALNE --- */
 G.meForm = cl((avg-1.4)*9, -12, 12);
 /* Forma zapisana na zawodniku — czytają ją warunki zdarzeń (cond: p.form<0),
    dzięki czemu „kłótnia z fanem po passie słabych meczów” trafia tylko w dołku. */
 p.form = Math.round(heats>0 ? G.meForm : -3);
 const ind = !blocked ? yield* simIndividualGen(p, effOvr, defP, excP, true) : null;
 /* --- CYKL ŚWIATOWY: IMŚ, IMŚJ2, eliminacje, Challenge, mistrzostwa Europy --- */
 const world = !blocked ? yield* simWorldSeasonGen(p, effOvr, defP, excP, ind?ind.zkTop4:null, true,
                 (ind&&ind.sk)?ind.sk.top4:null) : null;
 
 /* --- OCENA SEZONU ZE WSZYSTKICH ROZGRYWEK --- */
 const tally={h:heats+po.h, p:pts+po.p+bonus+po.b};
 tally.h+=dmpj.me.heats; tally.p+=dmpj.me.pts;
 /* GROSZE OD PZM: 500 zł startowego za każdy turniej (DMPJ, IMP, MIMP, Kaski)
    + 150 zł za każdy zdobyty w nich punkt. Z tego się nie żyje, ale na paliwo jest. */
 let pzmStarts=0, pzmPts=0;
 if(dmpj && dmpj.eligible && dmpj.me){ pzmStarts+=dmpj.me.starts||0; pzmPts+=dmpj.me.pts||0; }
 const medals=[];
 if(ind){
   /* UWAGA: 'palet' NIE wchodzi do listy niżej — Puchar PALET to zawody
      międzynarodowe, nie rozgrywki PZM, więc nie dolicza się do ryczałtów
      PZM (pzmStarts/pzmPts). Ma własną wypłatę — patrz blok niżej. */
   ['imp','mimp','zk','sk','bk','szk'].forEach(k=>{
     const c=ind[k]; if(!c||!c.rode) return;
     (c.rounds||[]).forEach(rr=>{ if(rr.me){tally.h+=rr.me.codes.length; tally.p+=rr.me.pts;
                                            pzmStarts++; pzmPts+=rr.me.pts||0;} });
     if(c.mePos>=1&&c.mePos<=3) medals.push({k, name:c.name, pos:c.mePos});
   });
   if(ind.palet && ind.palet.rode){
     (ind.palet.rounds||[]).forEach(rr=>{ if(rr.me){tally.h+=rr.me.codes.length; tally.p+=rr.me.pts;} });
     if(ind.palet.mePos>=1 && ind.palet.mePos<=3) medals.push({k:'palet', name:ind.palet.name, pos:ind.palet.mePos});
   }
 }
 /* --- PUCHAR PALET — NAGRODY WEDŁUG REGULAMINU ---
    Realne stawki (netto, w euro), przeliczone na złote po kursie ok. 4,3:
    310/250/190/160/140×2/120×2/110×2/100×2/90×2/70×2/60×2 za miejsca 1-16,
    plus ryczałt startowy minimum 125 euro na zawodnika (dostajesz go zawsze,
    niezależnie od wyniku — to nie jest cykl dla gwiazd, tylko dla ludzi,
    którzy nigdy nie zobaczą Grand Prix, stąd skromne kwoty). */
 if(ind && ind.palet && ind.palet.rode){
   const prizeEUR=[310,250,190,160,140,140,120,120,110,110,100,100,90,90,70,70];
   const rank=ind.palet.mePos||16;
   const prizePLN=Math.round((prizeEUR[rank-1]||60)*4.3/10)*10;
   const travelPLN=Math.round(125*4.3/10)*10;
   const paletIncome=prizePLN+travelPLN;
   p.budget+=paletIncome; p.career.earned+=paletIncome;
   notes.push('Puchar PALET: '+rank+'. miejsce w klasyfikacji końcowej cyklu (16 zawodników z siedmiu krajów) — '+
     zl(prizePLN)+' nagrody + '+zl(travelPLN)+' ryczałtu startowego = '+zl(paletIncome)+'.');
 }
 /* ============================================================
    INDYWIDUALNE MISTRZOSTWA ŚWIATA — DOROBEK I PIENIĄDZE
    ------------------------------------------------------------
    "Najśmieszniejsze jest to, że mistrz świata dostaje mniej hajsu" — było
    tak dlatego, że cyklu światowego w grze po prostu nie było, a wszystko,
    co indywidualne, płaciło ryczałtami PZM (500 zł startowego, 150 zł za
    punkt). Teraz Grand Prix płaci jak Grand Prix: ryczałt startowy za każdą
    rundę, nagroda za miejsce w rundzie i osobna, największa pula za miejsce
    w klasyfikacji końcowej cyklu. Mistrz świata zarabia w jeden sezon więcej
    niż przeciętny ligowiec przez pół kariery — i tak ma być.
    ============================================================ */
 let imsEarned=0; const imsParts=[];
 if(world){
   [['ims','INDYWIDUALNE MISTRZOSTWA ŚWIATA'],['imsj','INDYWIDUALNE MISTRZOSTWA ŚWIATA JUNIORÓW']].forEach(([k,label])=>{
     const c=world[k]; if(!c||!c.rode) return;
     (c.rounds||[]).forEach(rd=>{ if(rd.me){ tally.h+=rd.me.codes.length; tally.p+=rd.me.chartPts; } });
     if(c.mePos>=1 && c.mePos<=3) medals.push({k, name:c.name, pos:c.mePos});
     if(c.money){ imsEarned+=c.money; imsParts.push({w:label+' — '+c.mePos+'. miejsce w cyklu', v:c.money}); }
   });
   if(world.qual && world.qual.challenge && world.qual.challenge.rode){
     const ch=world.qual.challenge;
     if(ch.money){ imsEarned+=ch.money; imsParts.push({w:'SGP Challenge — '+ch.mePos+'. miejsce', v:ch.money}); }
   }
   if(world.qualJun && world.qualJun.challenge && world.qualJun.challenge.rode){
     const ch=world.qualJun.challenge;
     if(ch.money){ imsEarned+=ch.money; imsParts.push({w:'SGP2 Challenge — '+ch.mePos+'. miejsce', v:ch.money}); }
     if(ch.mePos>=1 && ch.mePos<=4) notes.push('SGP2 CHALLENGE: '+ch.mePos+'. miejsce — masz kwalifikację do cyklu IMŚJ2 na sezon '+(G.year+1)+'.');
   }
   if(world.sec && world.sec.rode && world.sec.money){
     imsEarned+=world.sec.money;
     imsParts.push({w:'Indywidualne Mistrzostwa Europy — '+world.sec.mePos+'. miejsce', v:world.sec.money});
   }
   if(imsEarned>0){
     p.budget+=imsEarned; p.career.earned+=imsEarned;
     p.career.imsEarned=(p.career.imsEarned||0)+imsEarned;
     notes.push('CYKL ŚWIATOWY — wypłaty: '+imsParts.map(x=>x.w+' '+zl(x.v)).join(' · ')+' = '+zl(imsEarned)+'.');
   }
   if(world.ims && world.ims.mePos===1){
     p.career.worldTitles=(p.career.worldTitles||0)+1;
     notes.push('INDYWIDUALNY MISTRZ ŚWIATA '+G.year+'! Złoty medal FIM i cała pula z klasyfikacji końcowej cyklu.');
   }
   if(world.imsj && world.imsj.mePos===1){
     p.career.worldJunTitles=(p.career.worldJunTitles||0)+1;
     notes.push('INDYWIDUALNY MISTRZ ŚWIATA JUNIORÓW '+G.year+'!');
   }
   if(world.ims) notes.push('Mistrzem świata '+G.year+' został '+world.ims.champion+' ('+ctryName(world.ims.championCtry)+').');
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
 /* WIELKI MECZ ma własną rubrykę: bez tego cały spadek profesjonalizmu po
    płaczu w parku maszyn albo po wyzwiskach pod adresem trenera dopisywał się
    do zdarzenia losowego z początku sezonu i wyglądał jak błąd liczenia. */
 const evProf=p.prof-S.prof0-(S.bigProf||0), evMed=p.med-S.med0-(S.bigMed||0);
 if(evProf) statLog.push({s:'prof', d:evProf, w:'zdarzenie: '+(S.evTitle||'—')});
 if(evMed)  statLog.push({s:'med',  d:evMed,  w:'zdarzenie: '+(S.evTitle||'—')});
 if(S.bigProf) statLog.push({s:'prof', d:S.bigProf, w:S.bigProfWhy||'wielki mecz sezonu — decyzje w parku maszyn'});
 if(S.bigMed)  statLog.push({s:'med',  d:S.bigMed,  w:S.bigMedWhy||'wielki mecz sezonu — kamery były wszędzie'});
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
 
 /* ============================================================
    ROZWÓJ ZAWODNIKA — I CO NA NIEGO WPŁYWA
    ------------------------------------------------------------
    NOWE (patch 21.08.2026): OVR rozwija się SZYBCIEJ W KLUBIE Z LEPSZĄ
    ATMOSFERĄ I WIĘKSZYM BUDŻETEM. Do tej pory otoczenie nie miało z rozwojem
    nic wspólnego: 16-latek w klubie z pustą kasą, zaległościami i szatnią
    na noże rósł dokładnie tak samo jak ten sam 16-latek w mistrzowskim
    zespole z fizjoterapeutą, torem treningowym i sprzętem na miejscu.
    Teraz otoczenie liczy się jawnie, a rozpiska trafia do dziennika OVR.
    ============================================================ */
 let growth = p.age<=21?7.4 : p.age<=24?4.4 : p.age<=28?1.8 : p.age<=32?0.1 : p.age<=36?-2.6 : -5;
 const gParts=[{d:Math.round(growth*100)/100, w:'wiek '+p.age+' — naturalna krzywa rozwoju'}];
 const gAdd=(d,w)=>{ if(!d) return; growth+=d; gParts.push({d:Math.round(d*100)/100, w}); };
 gAdd((p.prof-50)/26, 'profesjonalizm '+p.prof);
 gAdd(heats>0 ? (avg-1.4)*(p.age<=21?1.4:2.4) : -3.5,
      heats>0 ? ('dyspozycja w sezonie — średnia '+avgTxt) : 'cały rok bez startów — brak rozwoju');
 /* --- OTOCZENIE: ATMOSFERA I ZAMOŻNOŚĆ KLUBU --- */
 if(club){
   const atmF=(S.atm-50)/50;                                        // -1 .. +1
   gAdd(atmF*1.25, 'atmosfera w klubie '+S.atm+'/100 ('+atmTxt+')');
   const inc=LEAGUE_INC[lk]||1;
   const budF=cl((club.budget||0)/(inc*1.6), -1.2, 1.6);            // pusto/bogato względem ligi
   gAdd(budF*1.10, 'budżet klubu '+zl(club.budget)+' na tle ligi '+G.leagues[lk].short);
   if((club.debt||0)>0) gAdd(-cl(club.debt/400000, 0.2, 1.4), 'klub zalega ci '+zl(club.debt)+' — sprzęt i serwis stoją');
   const lvl=cl((club.ovr-leagueAvgOvr(lk))/14, -0.8, 0.9);
   gAdd(lvl*0.8, 'poziom kolegów z kadry (klub '+club.ovr+' przy średniej ligi '+Math.round(leagueAvgOvr(lk))+')');
 }
 /* ============================================================
    TRENER (Sprint 3, patch 22.08.2026)
    ------------------------------------------------------------
    Ostatni czynnik przed sufitem talentu i JEDYNE miejsce, w którym
    szkoleniowiec rusza OVR Gracza. Wcześniej otoczenie kończyło się na
    atmosferze, budżecie i poziomie kolegów — czyli rok pod wychowawcą
    młodzieży z warsztatem 90 dawał dokładnie tyle samo, co rok pod
    słupem ogłoszeniowym, który zna cię wyłącznie z portali.
    Wzór jest ten sam, co dla zawodników AI (coachGrowthDelta w engine/19):
    przyrost mnożony przez warsztat i sympatię trenera, spadek po
    trzydziestce hamowany tym samym mnożnikiem. Zapalamy przy okazji
    p.coachDevApplied, żeby coachAgePlayer() w ageRiders() nie policzył
    tego samego trenera drugi raz.
    ============================================================ */
 if(club && typeof coachGrowthDelta==='function'){
   const CREL = coachRel(club.name, meR);
   const cMul = coachDevMul(club.name, meR);
   const cDel = coachGrowthDelta(club.name, meR, growth);
   gAdd(cDel, 'trener '+CREL.coach.name+' ('+CREL.type.n+', warsztat '+CREL.coach.skill+
        ') — w jego oczach jesteś: '+CREL.status.n+' (sympatia '+(CREL.rel>0?'+':'')+CREL.rel+')');
   p.coachDev = {d:Math.round(cDel*10)/10, m:Math.round(cMul*100)/100, rel:CREL.rel,
     status:CREL.status.n, coach:CREL.coach.name, type:CREL.type.n, skill:CREL.coach.skill,
     gap:CREL.gap, press:coachPressure(club.name, {pos:pos}).v,
     why: cDel>0.15 ? 'trener wyciągnął z ciebie więcej, niż dawał sam talent'
        : cDel<-0.15 ? 'rok pod trenerem, który nie miał na ciebie pomysłu'
                     : 'trener nie zmienił w tobie nic — ani w dobrą, ani w złą stronę'};
   p.coachDevYear=G.year; p.coachDevApplied=true;
   notes.push('TRENER '+CREL.coach.name.toUpperCase()+' ('+CREL.type.n+', warsztat '+CREL.coach.skill+
     '): twój status w zespole to '+CREL.status.n+' (sympatia '+(CREL.rel>0?'+':'')+CREL.rel+
     '). Wpływ na rozwój: '+(cDel>0?'+':'')+cDel.toFixed(1)+' pkt OVR (mnożnik x'+cMul.toFixed(2)+').');
 }
 gAdd(gauss(0,1.6), 'to, czego nie da się rozpisać (ciało, głowa, przypadek)');
 // sufit talentu: im bliżej swojego potencjału, tym trudniej o kolejny punkt
 if(growth>0){
   const capF=cl(((p.pot||p.ovr+8)-p.ovr)/10, 0, 1);
   if(capF<1){ const before=growth; growth*=capF;
     gParts.push({d:Math.round((growth-before)*100)/100, w:'sufit talentu — jesteś blisko swojego potencjału ('+(p.pot||'—')+')'}); }
 }
 const oldOvr=p.ovr;
 p.ovr = cl(Math.round(p.ovr+growth),1,99);
 const ovrApplied=p.ovr-oldOvr;
 if(ovrApplied) logOvr(ovrApplied, 'rozwój po sezonie — suma czynników z rozpiski niżej');
 else if(Math.abs(growth)>=0.4) G.S.ovrLog.push({d:0,
   w:'rozwój po sezonie policzony na '+(growth>0?'+':'')+growth.toFixed(1)+
     ' pkt, ale OVR uderzył w sufit skali (99) — nie ma gdzie rosnąć'});
 S.growthParts=gParts;
 S.growthRaw=Math.round(growth*100)/100;

 /* ============================================================
    SUFIT TALENTU SIĘ PRZESUWA (nowe 22.08.2026)
    ------------------------------------------------------------
    Zgłoszenie: „widełki potencjału niższych klas są ekstremalnie niskie;
    pod szczególnymi warunkami powinno dać się dobić nawet do 90, a
    profesjonalizm powinien lekko podbijać potencjał".
    Potencjał (p.pot) przestaje więc być liczbą wylosowaną raz przy
    tworzeniu postaci i zamrożoną na całą karierę. Co sezon może urosnąć
    o ułamek punktu do dwóch — ale WYŁĄCZNIE wtedy, gdy zawodnik na to
    zapracował: jeździ, dowozi wyniki ponad swoją półkę i żyje jak
    zawodowiec. Sam sufit tego wzrostu też zależy od profesjonalizmu:
    zawodnik, który traktuje żużel jak hobby, zatrzyma się w okolicach 78,
    a do 99 dojdzie tylko ktoś, kto przez lata robi WSZYSTKO jak trzeba.
    Potencjał nigdy nie spada — raz zdobyty sufit zostaje.
    ============================================================ */
 const potFrom = p.pot||0;
 const potParts=[];
 {
  let potGain=0;
  const pa=(d,w)=>{ if(d>0.02){ potGain+=d; potParts.push({d:Math.round(d*100)/100, w}); } };
  if(matches>0 && !S.longInjury && !S.cried){
    if(p.prof>55)  pa((p.prof-55)/25, 'profesjonalizm '+p.prof+' — trening, dieta, sen i regeneracja przesuwają twój sufit');
    if(p.prof>=80) pa(0.40, 'życie zawodowca — sezon bez jednego odpuszczonego treningu');
    if(p.age<=23)  pa(0.35, 'wiek '+p.age+' — ciało wciąż się układa, technika też');
    if(heats>0 && avg>=1.85) pa(0.55, 'średnia '+avgTxt+' — jeździsz wyraźnie powyżej własnej półki');
    if(p.ovr>=potFrom-2 && heats>=12) pa(0.80, 'dobiłeś do własnego sufitu i dalej dowozisz — trenerzy rewidują ocenę');
    if(medals.length) pa(0.50, 'medal w rozgrywkach mistrzowskich');
    if(world && world.ims && world.ims.rode) pa(0.60, 'jazda w cyklu Grand Prix — inny poziom sprzętu, inny poziom rywali');
  }
  /* Sufit wzrostu wg profesjonalizmu. Nigdy nie obniża już zdobytego potencjału. */
  const cap = p.prof>=85 ? 99 : p.prof>=70 ? 92 : p.prof>=55 ? 86 : 78;
  const target = cl(Math.round(potFrom + potGain), potFrom, Math.max(potFrom, cap));
  if(target>potFrom){
    p.pot=target;
    notes.push('POTENCJAŁ PRZESUNIĘTY: '+potFrom+' → '+p.pot+' (limit przy profesjonalizmie '+p.prof+' wynosi '+cap+'). '+
      potParts.map(x=>'+'+x.d.toFixed(2)+' — '+x.w).join(' · ')+'.');
  } else if(potGain>0.3 && potFrom>=cap){
    notes.push('POTENCJAŁ: zapracowałeś na +'+potGain.toFixed(2)+' sufitu, ale przy profesjonalizmie '+p.prof+
      ' twój limit to '+cap+', a masz już '+potFrom+'. Bez zmiany stylu życia wyżej nie pójdzie.');
  }
 }
 
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
   leagueName:G.leagues[lk].name,
   /* NOWE: pozycja w statystykach indywidualnych własnej ligi i kategorii wiekowej */
   indRank: myRank, leagueShort:G.leagues[lk].short,
   ims: world?world.ims:null, imsj: world?world.imsj:null
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
  avgAll     : (heats+po.h) > 0 ? (pts+po.p+bonus+po.b)/(heats+po.h) : 0,
  avgAllTxt  : (heats+po.h) > 0 ? ((pts+po.p+bonus+po.b)/(heats+po.h)).toFixed(2) : '—',
  avg, avgTxt, grade, earned, earnedBon, pos, posReg, po, dmpj, ind, tally, overall, medals,
  world, leagueStats, myRank, imsEarned, imsParts,
  signBonus:S.signBonus||0, signBonusOwed:S.signBonusOwed||0,
  tabRow:myRow, injured, injMissed, clubEvents, strikeRounds:S.strikeRounds, payLog:S.payLog,
  strike, ovrFrom:oldOvr, ovrTo:p.ovr, notes, fines:S.fines, lines, replaced,
  profFrom:S.prof0, profTo:p.prof, profDelta, medFrom:S.med0, medTo:p.med, medDelta, statLog,
  evLog:S.evLog, evTitle:S.evTitle, evChoice:S.evChoice,
  /* --- WIELKI MECZ (patch 22.08.2026) --- */
  bigLog:(S.bigLog||[]).slice(), cryNote:S.cryNote||null, bigStage:S.bigStageName||null,
  potFrom:potFrom, potTo:p.pot, potParts:potParts,
  /* --- TRENER (Sprint 3): zamrożone rozliczenie roku pod szkoleniowcem --- */
  coachDev: p.coachDev||null,
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
   /* OVR ZE ZDARZENIA — brakująca rubryka, przez którą wyglądało to tak,
      jakby zdarzenia dodające OVR nic nie robiły. */
   ovrEvent   : evOvrDelta||0,
   ovrFrom    : S.ovr0,
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
 /* --- DZIENNIK OVR: wszystko, co w tym sezonie ruszyło OVR, w jednym miejscu --- */
 res.ovrLog     = (S.ovrLog||[]).slice();
 res.growthParts= (S.growthParts||[]).slice();
 res.growthRaw  = S.growthRaw||0;
 res.equipWear  = equipWear;
 res.serviceCost= serviceCost;
 medals.forEach(m=>{
   /* Nie każdy podium to "Mistrzostwo Polski" — Turniej Szkoleniowy i Puchar
      MACEC to osobne, mniejsze rozgrywki (jeden regionalny, jeden
      międzynarodowy), więc dostają własne, trafniejsze etykiety. */
   const labels = (m.k==='szk' || m.k==='palet')
     ? ['','ZWYCIĘSTWO W KLASYFIKACJI KOŃCOWEJ','2. MIEJSCE W KLASYFIKACJI KOŃCOWEJ','3. MIEJSCE W KLASYFIKACJI KOŃCOWEJ']
     : ['','MISTRZOSTWO POLSKI','WICEMISTRZOSTWO','BRĄZOWY MEDAL'];
   notes.push(m.name+': '+labels[m.pos]+'!');
   p.career.medals=(p.career.medals||0)+1;
   if(m.pos===1 && m.k!=='szk' && m.k!=='palet' && m.k!=='ims' && m.k!=='imsj') p.career.indTitles=(p.career.indTitles||0)+1;
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
 if(S.signBonus>0 || S.signBonusOwed>0){
   notes.push('PREMIA ZA PODPIS — RATA ZA SEZON '+G.year+': należne '+zl(S.signBonusOwed||0)+
     ', klub wypłacił '+zl(S.signBonus||0)+
     ((S.signBonusOwed||0)>(S.signBonus||0)?' (reszta poszła w zaległości).':'.')+
     ' Premia z kontraktu rozlicza się co sezon przez cały okres umowy.');
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
