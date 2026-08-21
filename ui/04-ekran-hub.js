/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN HUB
   Pasek zawodnika, kadra klubu, status w cyklu światowym
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 616-791 oryginału).
   ============================================================ */
/* ---- PASEK ZAWODNIKA ---- */
function playerStrip(){
 const p=G.p, club=p.club?getClub(p):null;
 return `<div class="brut mb-3">
 <div class="brut-h px-3 py-1.5 flex justify-between items-center flex-wrap gap-1">
  <div class="text-[12px] font-bold text-zinc-100">${esc(p.name)} <span class="text-zinc-400 font-normal">· ${p.age} lat · ${esc(p.cls)}</span></div>
  <div class="text-right">
   <div class="text-[11px] text-orange-500 font-bold">${zl(p.budget)}</div>
   ${p.lastDecisionBudgetDelta?`<div class="text-[9px] ${p.lastDecisionBudgetDelta>0?'text-emerald-400':'text-red-400'}" title="${esc(p.lastDecisionLabel||'')}">
     wynik decyzji: ${p.lastDecisionBudgetDelta>0?'+':''}${zl(p.lastDecisionBudgetDelta)}</div>`:''}
  </div>
 </div>
 <div class="p-3 grid sm:grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-1">
  <div>${statBar('OVR (UMIEJĘTNOŚCI)',p.ovr)}${statBar('SPRZĘT',p.equip,'#0ea5e9')}</div>
  <div>${statBar('PROFESJONALIZM',p.prof,'#84cc16')}${statBar('MEDIALNOŚĆ',p.med,'#a855f7')}</div>
  <div>${statBar('MECHANIK ('+p.mech+')',p.mech,'#eab308')}${statBar('LOJALNOŚĆ',p.loyalty,'#ec4899')}</div>
  <div class="text-[11px] space-y-0.5">
    <div class="text-zinc-400">KLUB</div><div class="text-zinc-100 text-[11px]">${club?esc(club.name):'—'}</div>
    <div class="text-zinc-400 mt-1">KONTRAKT</div>
    <div class="${p.contract.type==='Zawodowy'?'text-emerald-400':'text-zinc-300'}">${p.contract.type} · ${zl(p.contract.rate)}/pkt</div>
    <div class="text-zinc-300">Umowa: <b class="text-zinc-200">${p.contract.years} ${lataTxt(p.contract.years)}</b> — do końca sezonu ${G.year+Math.max(0,p.contract.years-1)}</div>
    ${club&&club.debt>0?`<div class="text-red-500 ${club.debt>100000?'blink':''}">ZALEGŁOŚCI: ${zl(club.debt)}</div>`:''}
  </div>
 </div></div>`;
}

/* ---- EKRAN: HUB / MIĘDZYSEZONIE ---- */
/* ---- HUB: STATUS W CYKLU ŚWIATOWYM ----
   Gracz musi wiedzieć PRZED sezonem, czy ma miejsce w Grand Prix i którą drogą
   może się do niego dostać — inaczej cykl światowy jest niewidzialny do momentu
   podsumowania sezonu. */
function worldStatusBox(){
 try{
  if(typeof ensureSgpSeed!=='function') return '';
  const meR=G.riders.find(r=>r.me); if(!meR) return '';
  ensureSgpSeed();
  const perm=sgpLineup();
  const mine=perm.find(x=>x.r.id===meR.id);
  const champ=(G.imsHist&&G.imsHist.length)?G.imsHist[G.imsHist.length-1]:null;
  const jun=isJun(G.p);
  return `<div class="brut mb-3" style="border-color:#a16207">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#a16207;color:#eab308">
     CYKL ŚWIATOWY ${G.year} — INDYWIDUALNE MISTRZOSTWA ŚWIATA</div>
   <div class="p-3 text-[11px] leading-relaxed">
    ${mine
      ? `<div class="text-[13px] font-extrabold" style="color:#eab308">MASZ MIEJSCE W CYKLU GRAND PRIX ${G.year}.</div>
         <div class="text-zinc-300">Podstawa: ${esc(mine.how)}. ${SGP.rounds} rund, 16 zawodników w każdej, 23 biegi na rundę.</div>`
      : `<div class="text-zinc-300">Nie masz stałego miejsca w cyklu Grand Prix ${G.year}.
         Droga do niego: <b class="text-zinc-200">TOP 4 Złotego Kasku → SGP Challenge → TOP 4 Challenge</b>,
         tytuł Mistrza Europy albo dzika karta Komisji. Zdarza się też dzika karta pojedynczej rundy.</div>`}
    ${jun?`<div class="text-pink-400 mt-1">Jako zawodnik U21 jesteś w puli nominacyjnej IMŚJ2 — trzy rundy, ten sam format.</div>`:''}
    ${champ?`<div class="text-zinc-400 mt-1">Aktualny mistrz świata (${champ.year}): <b class="text-zinc-300">${esc(champ.champ||'—')}</b>
      ${champ.ctry?'('+esc(ctryName(champ.ctry))+')':''}.</div>`:''}
    <div class="text-zinc-400 mt-1">Nagrody: ${zl(SGP.startFee)} ryczałtu za każdą rundę, ${zl(SGP.prize[0])} za wygraną rundę,
     ${zl(SGP.series[0])} za mistrzostwo świata w klasyfikacji końcowej.</div>
   </div></div>`;
 }catch(_){ return ''; }
}
function scHub(){
 const p=G.p, club=getClub(p);
 const banInfo = p.banSeasons>0 ? `<div class="brut p-3 mb-3 border-red-900"><div class="text-red-500 font-bold tracking-widest blink">ZAWIESZENIE AKTYWNE: ${p.banSeasons} sezon(y)</div><div class="text-[11px] text-zinc-300">Nie wolno ci startować. Sezon przeleci obok ciebie.</div></div>`:'';
 return head()+`<div class="fade">
 ${playerStrip()}
 ${banInfo}
 ${longInjuryWarnHtml()}
 ${squadHtml()}
 ${outlookBox()}
 ${worldStatusBox()}
 ${warnings()}
 ${p.contract.type==='Zawodowy'?workshop():amateurNote()}
 ${G.history.length?historyBox():''}
 <div class="brut mt-3">
  <div class="p-4 flex items-center justify-between flex-wrap gap-3">
   <div><div class="text-[11px] text-zinc-300 tracking-widest">SEZON ${G.year} · ${esc(club.name)} · ${G.leagues[p.lk].name}</div>
   <div class="text-[11px] text-zinc-400">Szansa na skład w pojedynczej kolejce (140 symulacji ustawień trenera, z losowaną dyspozycją całej kadry): <b class="text-zinc-200">${appearanceChance(p,club,55,null)}%</b> ${isJun(p)?'· jesteś młodzieżowcem (U21) — walczysz o wszystkie siedem pozycji, łącznie z rubryką młodzieżową':isU24(p)?'· jesteś seniorem U24 — tylko pierwsza piątka, w tym rubryka U24. Pozycje młodzieżowe są dla ciebie zamknięte':'· jesteś seniorem — tylko pierwsza piątka'}
   <span class="block text-zinc-400 mt-0.5">To szansa na JEDNĄ kolejkę przy losowej dyspozycji kadry, a nie gwarancja liczby meczów.
   Powyżej 80% jeździsz praktycznie co tydzień; poniżej 60% to rotacja — jak forma nie wejdzie, sezon potrafi zejść na ławce.</span></div></div>
   <button onclick="startSeason()" class="btn px-7 py-3 font-extrabold tracking-[.2em] text-orange-500">SYMULUJ SEZON ${G.year} &gt;</button>
  </div>
  <div class="px-4 pb-3 text-[11px] text-zinc-400 border-t border-zinc-700 pt-2">
   <b class="text-orange-500">WIELKI MECZ:</b> przed najważniejszym spotkaniem sezonu — finałem, dwumeczem o utrzymanie,
   półfinałem, a jeżeli w play-offie nie będzie dla ciebie nic, to przed ostatnią rundą Grand Prix, Challenge albo IMP —
   gra zatrzyma się i zapyta, czy chcesz go <b class="text-zinc-300">przejechać osobiście</b>: zębatka pod tor przed każdym biegiem,
   decyzje co łuk i park maszyn do twojej dyspozycji. Warunek jest jeden: musisz wjechać do składu.
  </div>
  <div class="px-4 pb-3 text-[11px] ${p.contract.years>1?'text-zinc-400':'text-orange-500'} border-t border-zinc-700 pt-2">
   ${p.contract.years>1
     ? 'KONTRAKT: masz umowę jeszcze na '+p.contract.years+' '+lataTxt(p.contract.years)+' (do końca sezonu '+(G.year+p.contract.years-1)+'). '+
       'Dlatego po tym sezonie NIE zobaczysz ekranu ofert — okienko transferowe otworzy się dopiero po wygaśnięciu umowy.'
     : 'KONTRAKT: to ostatni sezon umowy. Po nim wchodzisz na rynek — zobaczysz ekran ofert i wybierzesz nowy klub oraz długość kontraktu.'}
  </div>
 </div>
 <div class="mt-3 text-right"><button onclick="retire()" class="text-[11px] text-zinc-400 hover:text-red-500 tracking-widest">[ zakończ karierę ]</button></div>
 </div>`;
}
/* Zawodnik-Gracz istnieje w G.riders jako zwykły rider i to jego dane widzi
   trener układający skład. Wiek rośnie w nextYear(), a ageRiders() celowo omija
   Gracza — bez tej synchronizacji podgląd składu pokazywałby 22-latka wciąż
   na numerze młodzieżowym, mimo że silnik w meczu już by go tam nie wpuścił. */
function syncMeRider(){
 const p=G.p, r=G.riders.find(x=>x.me);
 if(!r) return null;
 r.age=p.age; r.name=p.name; r.ovr=p.ovr;
 if(p.club){ r.club=p.club; dedupeSquadOvr(p.club); }   // OVR gracza mógł zająć liczbę kolegi z kadry
 return r;
}
/* ---- KADRA KLUBU: z kim realnie walczysz o numer startowy ---- */
function squadHtml(){
 const p=G.p, club=getClub(p);
 syncMeRider();
 const L=bestLineup(club.name, {id:(G.riders.find(r=>r.me)||{}).id, v:p.loyalty*0.10});
 if(!L) return '';
 const numOf={}; for(let n=1;n<=7;n++) if(L[n]) numOf[L[n].id]=n;
 const sq=squadOf(club.name).sort((a,b)=>(numOf[a.id]||99)-(numOf[b.id]||99)||b.ovr-a.ovr);
 const meNum=numOf[(G.riders.find(r=>r.me)||{}).id];
 return `<div class="brut mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold flex justify-between flex-wrap gap-2">
   <span>KADRA — ${esc(club.name)}</span>
   <span class="${meNum?'text-emerald-400':'text-red-500'}">${meNum?'JESTEŚ W SKŁADZIE — POZYCJA '+meNum+' (u siebie nr '+(meNum+8)+', na wyjeździe nr '+meNum+')':'POZA SIÓDEMKĄ — OGLĄDASZ Z PARKINGU'}</span></div>
 <div class="p-2 overflow-x-auto">
 <table class="w-full text-[11px]">
 <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
  <th class="text-left">POZ.</th><th class="text-left">ZAWODNIK</th><th>WIEK</th><th class="text-left">KATEGORIA</th><th>OVR</th><th>FORMA</th><th>WARTOŚĆ</th><th class="text-left">STATUS</th></tr></thead>
 <tbody>${sq.map(r=>{
   const n=numOf[r.id];
   const fm=Math.round((r.form||0)*10)/10;
   const val=Math.round(r.ovr+(r.form||0)*LINEUP_FORM_W);
   const st = n
     ? (n<=5 ? 'pierwsza piątka'+(isJun(r)?' (młodzieżowiec)':isU24(r)?' (rubryka U24)':' (senior)')
             : 'numer młodzieżowy '+n+' — tylko U21')
     : (r.strike?'BUNT — nie wyjeżdża':'poza składem');
   return `<tr class="${r.me?'rowhl':''} border-b border-zinc-700/60">
   <td class="${n?'text-orange-400 font-bold':'text-zinc-400'} w-8">${n||'—'}</td>
   <td class="${r.me?'text-orange-400 font-bold':'text-zinc-200'} truncate max-w-[190px]">${esc(r.name)}${r.me?' (TY)':''}</td>
   <td class="text-center text-zinc-300">${r.age}</td>
   <td class="${catCol(r)} text-[11px]">${catOf(r)}</td>
   <td class="text-center ${r.ovr>=riderLevel(club)?'text-emerald-400':'text-zinc-300'}">${r.ovr}</td>
   <td class="text-center text-[11px] ${fm>0.5?'text-emerald-400':fm<-0.5?'text-red-400':'text-zinc-400'}">${fm>0?'+':''}${fm}</td>
   <td class="text-center font-bold ${n?'text-orange-400':'text-zinc-300'}">${val}</td>
   <td class="text-[11px] ${n?'text-zinc-300':'text-zinc-400'}">${st}</td></tr>`;}).join('')}</tbody></table>
 ${accLite('JAK DZIAŁA USTAWIANIE SKŁADU I NUMERY STARTOWE', `
  <div class="text-[11px] text-zinc-400 tracking-wide leading-relaxed">
  <b class="text-zinc-300">O numerze NIE decyduje sam OVR.</b> Trener patrzy na WARTOŚĆ = OVR + forma × ${LINEUP_FORM_W}
  (forma chodzi od −12 do +12, więc potrafi przestawić zawodnika o ok. 20 punktów). Dlatego czwarty OVR w drużynie
  po dwóch słabych meczach ląduje poza składem, a rozkręcony rezerwowy wskakuje na jego miejsce.<br>
  Pozycje 6 i 7: wyłącznie zawodnicy młodzieżowi U21 — senior nie zajmie tych miejsc, choćby miał najwyższy OVR w lidze.
  W pierwszej piątce musi jechać zawodnik U24: jeśli nie ma w niej nikogo do 24 lat, najsłabszy z niej wylatuje,
  nawet gdy jest wyżej w rankingu wartości. Skład układany jest od nowa PRZED KAŻDĄ KOLEJKĄ.<br>
  <b class="text-zinc-300">NUMERY STARTOWE:</b> kolumna POZ. to pozycja w składzie (1–5 = pierwsza piątka, 6–7 = młodzież).
  Numer w programie zależy od tego, gdzie jedziecie: <b class="text-zinc-300">gospodarz startuje z numerami 9–15</b>,
  <b class="text-zinc-300">gość z numerami 1–7</b> — pozycja 1 to nr 9 u siebie i nr 1 na wyjeździe.</div>`)}
 </div></div>`;
}
/* ---- ŚREDNIE ZAWODNIKÓW KADRY ZA SEZON ---- */
function squadStatsHtml(r){
 const sq=squadOf(r.club).filter(x=>x.sea&&x.sea.starts>0)
   .sort((a,b)=>((b.sea.pts+b.sea.bon)/b.sea.starts)-((a.sea.pts+a.sea.bon)/a.sea.starts));
 if(!sq.length) return '';
 return `<div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">ŚREDNIE ZAWODNIKÓW — ${esc(r.club)}</div>
 <div class="p-2 overflow-x-auto"><table class="w-full text-[11px]">
 <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
  <th class="text-left">ZAWODNIK</th><th>WIEK</th><th>KAT.</th><th>M</th><th>BIEGI</th><th>PKT</th><th>BON</th><th>DEF</th><th>WYK</th><th>ZMIAN</th><th>FORMA</th><th>ŚR.</th></tr></thead>
 <tbody>${sq.map(x=>{const s=x.sea, av=((s.pts+s.bon)/s.starts);
   return `<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
   <td class="${x.me?'text-orange-400 font-bold':'text-zinc-200'} truncate max-w-[200px]">${esc(x.name)}${x.me?' (TY)':''}</td>
   <td class="text-center text-zinc-300">${x.age}</td>
   <td class="text-center text-[11px] ${catCol(x)}">${catShort(x)}</td><td class="text-center text-zinc-300">${s.m}</td>
   <td class="text-center">${s.starts}</td><td class="text-center text-orange-400 font-bold">${s.pts}</td>
   <td class="text-center text-sky-400">${s.bon}</td><td class="text-center text-red-500">${s.def}</td>
   <td class="text-center text-red-400">${s.exc}</td><td class="text-center text-zinc-400">${s.rep}</td>
   <td class="text-center text-[11px] ${(x.form||0)>0.5?'text-emerald-400':(x.form||0)<-0.5?'text-red-400':'text-zinc-400'}">${(x.form||0)>0?'+':''}${Math.round((x.form||0)*10)/10}</td>
   <td class="text-center ${av>=2?'text-emerald-400':av>=1.4?'text-lime-400':'text-zinc-300'} font-bold">${av.toFixed(2)}</td></tr>`;}).join('')}
 </tbody></table>
 <div class="text-[11px] text-zinc-400 mt-1.5">Średnia = (punkty + bonusy) ÷ biegi. Kolumna ZMIAN = ile razy zawodnik był zdejmowany na rzecz rezerwy — te biegi nie wchodzą do jego startów ani do średniej.
  FORMA = dyspozycja na koniec sezonu (−12…+12); to ona, razem z OVR, decydowała o numerach startowych w kolejnych meczach.</div>
 </div></div>`;
}
