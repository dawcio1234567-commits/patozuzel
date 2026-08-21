/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: PODSUMOWANIE BOKSY
   Liga, kontuzje, upadłość, rozliczenie z klubem, głosy, TRENER
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1590-1759 oryginału).
   PATCH 22.08.2026 (Sprint 3): boks „TRENER I TWÓJ STATUS W ZESPOLE" —
   wyliczona opinia szkoleniowca, presja na jego posadzie i to, co
   ta relacja zrobiła z twoim OVR.
   ============================================================ */
function ligaView(r){
 return `<div class="grid lg:grid-cols-2 gap-3">
  <div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">RUNDA ZASADNICZA — ${r.leagueName} · TY: ${r.posReg}. → PO PLAY-OFF: ${r.pos}.</div>
  <div class="p-2 overflow-x-auto">${tableHtml(r.lk)}</div></div>
  <div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">WYNIKI SPOTKAŃ — ${esc(r.club)} <span class="text-zinc-400">· kliknij wynik, żeby zobaczyć przebieg meczu</span></div>
  <div class="p-2 max-h-[420px] overflow-y-auto">${myResultsHtml(r)}</div></div>
 </div>
 ${coachSeasonHtml(r)}
 <div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">
   WSZYSTKIE WYNIKI — KOLEJKA PO KOLEJCE <span class="text-zinc-400">· kliknij dowolny wynik, żeby zobaczyć tabelę punktów i biegi</span></div>
 <div class="p-2 grid lg:grid-cols-3 gap-3">
  ${LKEYS.map(k=>`<div><div class="text-[11px] text-zinc-400 tracking-widest mb-1">${G.leagues[k].name}</div>${allResultsHtml(k)}</div>`).join('')}
 </div></div>
 <div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">POZOSTAŁE LIGI</div>
 <div class="p-2 grid lg:grid-cols-2 gap-3">
  ${LKEYS.filter(k=>k!==r.lk).map(k=>`<div><div class="text-[11px] text-zinc-400 tracking-widest mb-1">${G.leagues[k].name}</div>${tableHtml(k)}</div>`).join('')}
 </div></div>
 ${squadStatsHtml(r)}`;
}
/* ============================================================
   TRENER I TWÓJ STATUS W ZESPOLE (Sprint 3)
   ------------------------------------------------------------
   Wszystko, co silnik policzył w coachRel() / coachPressure(), pokazane
   wprost: kim jest szkoleniowiec, co dokładnie w tobie lubi (albo czego
   nie znosi), jak nazywa się twoje miejsce w tej drużynie — od „Legendy"
   po „Wkład do kevlaru" — i ile ta relacja kosztowała (albo dała) OVR.
   Liczenie siedzi w engine/19-zawodnicy-kadry.js; tutaj jest wyłącznie
   rysowanie, zgodnie z zasadą „ui/ nie liczy symulacji".
   ============================================================ */
function coachSeasonHtml(r){
 if(!r || !r.club || typeof coachReport!=='function') return '';
 const RP=coachReport(r.club, r);
 if(!RP) return '';
 const REL=RP.rel, P=RP.press, co=RP.coach, S=REL.status;
 const relPct = Math.round((cl(REL.rel,-100,100)+100)/2);
 const pressCol = P.v>=74?'#ef4444' : P.v>=55?'#eab308' : '#22c55e';
 const d=v=>`<span class="${v>0?'text-emerald-400':v<0?'text-red-400':'text-zinc-400'} font-bold">${v>0?'+':''}${v}</span>`;
 const rows = (REL.parts||[]).map(x=>
   `<li class="flex justify-between gap-2"><span class="text-zinc-300">${esc(x.w)}</span>${d(x.d)}</li>`).join('')
   || '<li class="text-zinc-400">trener nie ma o tobie zdania. To też jest zdanie.</li>';
 const pRows = (P.parts||[]).map(x=>
   `<li class="flex justify-between gap-2"><span class="text-zinc-300">${esc(x.w)}</span>${d(x.d)}</li>`).join('')
   || '<li class="text-zinc-400">spokojny sezon w gabinecie.</li>';
 const dev = RP.dev;
 const coup = (G.coachCoup && G.coachCoup.club===r.club && G.coachCoup.year>=G.year-1) ? G.coachCoup : null;
 return `<div class="brut mt-3">
  <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">TRENER I TWÓJ STATUS W ZESPOLE</div>
  <div class="p-3 grid md:grid-cols-2 gap-4">
   <div>
    <div class="text-[13px] font-extrabold text-zinc-100">${esc(co.name)}</div>
    <div class="text-[11px] text-zinc-400 mb-2">${esc(RP.type.n)} · warsztat <b class="text-zinc-200">${co.skill}</b>
      · autorytet <b class="text-zinc-200">${co.auth}</b>
      · w klubie ${co.seasons||0} ${(co.seasons||0)===1?'sezon':'sezony/-ów'}</div>
    <div class="text-[11.5px] text-zinc-300 leading-relaxed mb-3">${esc(RP.type.d)}</div>
    <div class="text-[10px] text-zinc-500 tracking-widest mb-1">TWÓJ STATUS W ZESPOLE</div>
    <div class="text-[20px] font-extrabold tracking-wider mb-1" style="color:${S.c}">${esc(S.n).toUpperCase()}</div>
    <div class="text-[11.5px] text-zinc-300 mb-2">${esc(S.d)}</div>
    <div class="bar mb-1"><i style="width:${relPct}%;background:${S.c}"></i></div>
    <div class="text-[10.5px] text-zinc-500">sympatia trenera: <b style="color:${S.c}">${REL.rel>0?'+':''}${REL.rel}</b> / 100
      · twój poziom względem drużyny: <b class="text-zinc-300">${REL.gap>0?'+':''}${REL.gap} OVR</b>
      (tolerancja tego trenera: ±${REL.tol})</div>
    <div class="text-[12px] text-zinc-200 italic mt-2 border-l-2 border-zinc-600 pl-3">„${esc(RP.quote)}"</div>
   </div>
   <div>
    <div class="text-[10px] text-zinc-500 tracking-widest mb-1">Z CZEGO TO WYSZŁO</div>
    <ul class="text-[11px] space-y-0.5 mb-3">${rows}</ul>
    <div class="text-[10px] text-zinc-500 tracking-widest mb-1">PRESJA NA TRENERZE
      <b style="color:${pressCol}">${P.v}/100</b>${P.hot?' <span class="blink" style="color:#ef4444">GORĄCE KRZESŁO</span>':''}</div>
    <div class="bar mb-1"><i style="width:${P.v}%;background:${pressCol}"></i></div>
    <ul class="text-[11px] space-y-0.5">${pRows}</ul>
   </div>
  </div>
  ${dev?`<div class="px-3 pb-3">
    <div class="brut p-3" style="border-color:${dev.d>0?'#22c55e':dev.d<0?'#dc2626':'#52525b'}">
     <div class="text-[10px] tracking-widest mb-1" style="color:${dev.d>0?'#4ade80':dev.d<0?'#f87171':'#a1a1aa'}">
       WKŁAD TRENERA W TWÓJ ROZWÓJ — SEZON ${r.year||G.year}</div>
     <div class="text-[13px] text-zinc-100 font-bold">${dev.d>0?'+':''}${Number(dev.d).toFixed(1)} pkt OVR z całego przyrostu
       <span class="text-[11px] text-zinc-500 font-normal">(mnożnik rozwoju ×${dev.m} — warsztat ${dev.skill} plus sympatia ${dev.rel>0?'+':''}${dev.rel})</span></div>
     <div class="text-[11.5px] text-zinc-300">${esc(dev.why)}</div>
    </div></div>`:''}
  ${coup?`<div class="px-3 pb-3">
    <div class="brut p-3 border-2" style="border-color:#eab308;background:rgba(113,63,18,.20)">
     <div class="text-[11px] font-bold tracking-widest blink mb-1" style="color:#fde047">ZARZĄD WYBRAŁ CIEBIE — TRENER WYLECIAŁ</div>
     <div class="text-[12.5px] text-zinc-200">Twoja pozycja (OVR + medialność) przewyższyła autorytet szkoleniowca o
       <b style="color:#fde047">${coup.edge}</b> punktów. Klub rozwiązał umowę z <b>${esc(coup.out)}</b>,
       a twój kontrakt leżał na stole następnego dnia. Nowym trenerem został <b>${esc(coup.inn)}</b>.</div>
    </div></div>`:''}
  ${(RP.fires&&RP.fires.length)?`<div class="px-3 pb-3">
    <div class="text-[10px] text-zinc-500 tracking-widest mb-1">KARUZELA TRENERSKA W TYM KLUBIE</div>
    ${RP.fires.map(f=>`<div class="text-[11px] text-zinc-400">${f.year}: <span class="line-through">${esc(f.out)}</span>
      → <b class="text-zinc-200">${esc(f.inn)}</b> <span class="text-zinc-500">· ${esc(f.why)}</span></div>`).join('')}
   </div>`:''}
 </div>`;
}
/* ============================================================
   BARDZO DŁUGIE KONTUZJE — CZERWONA PLANSZA, KTÓREJ NIE DA SIĘ PRZEOCZYĆ
   Gracz musi wiedzieć od razu, że sezon (albo dwa) ma z głowy.
   ============================================================ */
function longInjuryHtml(r){
 if(!r.longInjuryNew && !r.longInjuryOut && !r.injCat) return '';
 const why = r.longInjuryNew || r.injCatWhy || r.longInjuryWhy || 'Zerwane więzadła / złamana kość udowa.';
 const next = r.longInjuryNext;
 return `<div class="brut p-3 mt-3 border-2 border-red-700 bg-red-950/20">
  <div class="text-[12px] text-red-500 font-bold tracking-widest blink mb-1">
    ${r.longInjuryOut && !r.longInjuryNew ? 'CAŁY SEZON POZA TOREM — KONTUZJA DŁUGOTERMINOWA'
                                          : 'ZERWANE WIĘZADŁA / ZŁAMANA KOŚĆ UDOWA'}</div>
  <div class="text-[13px] text-red-400 font-bold mb-2">${esc(why)}</div>
  <ul class="text-[11px] text-red-400 space-y-0.5 font-bold">
   ${r.longInjuryDmg?`<li>› Uraz zabrał ${r.longInjuryDmg} pkt OVR. Tego nie odrobisz w rehabilitacji.</li>`:''}
   ${r.longInjuryOut?`<li>› TEN sezon przeleciał obok ciebie: 0 meczów, 0 biegów, brak rozwoju, kary za brak startów w profesjonalizmie i medialności.</li>`:''}
   ${r.longInjuryNew?`<li>› Sezon urwany od razu: play-off, DMPJ i turnieje indywidualne odpadają w całości.</li>`:''}
   ${next?`<li class="blink">› KOLEJNY SEZON (${G.year+1}) MASZ Z GŁOWY. Operacja, śruby, rehabilitacja — wracasz najwcześniej w ${G.year+2}.</li>`:''}
   <li>› Koszty życia, serwis sprzętu${G.p.alimony>0?' i alimenty':''} lecą dalej. Kontuzja nie zawiesza rachunków.</li>
  </ul>
 </div>`;
}
/* ---- KARIERA URWANA PRZEZ ZDARZENIE (fxEnd) ---- */
function careerOverHtml(r){
 if(!r.careerOver) return '';
 return `<div class="brut p-3 mt-3 border-2 border-red-700 bg-red-950/20">
  <div class="text-[12px] text-red-500 font-bold tracking-widest blink mb-1">KONIEC KARIERY — DECYZJA ZAPADŁA POZA TOREM</div>
  <div class="text-[13px] text-red-400 font-bold">${esc(r.careerOverWhy||'—')}</div>
  <div class="text-[11px] text-zinc-200 mt-1">To był twój ostatni sezon. Kliknięcie „DALEJ" zamknie karierę
   i przeniesie cię na ekran podsumowania z kartą statystyk.</div>
 </div>`;
}
/* ---- NOWE SZYLDY SPONSORSKIE, KTÓRE WEJDĄ W ŻYCIE OD NOWEGO ROKU ---- */
function sponsorRenameHtml(){
 const L=allClubs().filter(c=>c.pendingName && c.pendingName!==c.name)
   .map(c=>({old:c.name, now:c.pendingName, lk:leagueOfClub(c.name), n:titleCount(c)}));
 if(!L.length) return '';
 return `<div class="brut p-3 mt-3" style="border-color:#a16207">
  <div class="text-[11px] tracking-widest mb-2" style="color:#eab308">ZMIANY NAZW KLUBÓW OD SEZONU ${G.year+1} (SPONSORZY TYTULARNI)</div>
  <div class="space-y-1">${L.map(x=>`<div class="text-[11px]">
    <span class="text-zinc-400">${G.leagues[x.lk]?G.leagues[x.lk].short:''}</span>
    <span class="text-zinc-300 line-through">${esc(x.old)}</span>
    <span class="text-zinc-500">→</span> <b style="color:#eab308">${esc(x.now)}</b>
    ${x.n>=2?`<span class="text-red-500"> · ${x.n} sponsorów tytularnych: ${sponsorPen(x.n)} OVR</span>`:''}</div>`).join('')}</div>
 </div>`;
}
/* ---- UPADŁOŚĆ TWOJEGO KLUBU: gruba czerwona notatka ---- */
function bankruptHtml(r){
 const b=r.bankrupt; if(!b) return '';
 const lost=r.bankruptLost||0;
 return `<div class="brut p-3 mt-3 border-2 border-red-700 bg-red-950/20">
  <div class="text-[12px] text-red-500 font-bold tracking-widest blink mb-1">UPADŁOŚĆ KLUBU — WSZEDŁ SYNDYK</div>
  <div class="text-[13px] text-red-400 font-bold mb-1">${esc(b.old)} → ${esc(b.now)}</div>
  <div class="text-[11px] text-zinc-200 mb-2">${esc(b.why)}</div>
  <ul class="text-[11px] text-red-400 space-y-0.5 font-bold">
   <li>› Klub startuje od zera: OVR 40, budżet ${zl(100000)}, Krajowa Liga Żużlowa.</li>
   <li>› Wszyscy zawodnicy z OVR powyżej 50 zerwali kontrakty. Zostałeś ty.</li>
   <li>› DŁUG KLUBU WOBEC CIEBIE ZOSTAŁ UMORZONY${lost>0?' — TRACISZ '+zl(lost):''}. Masa upadłościowa nie wypłaci ci nic.</li>
   <li>› Jeździsz dalej pod nowym szyldem. Ten sam bus, ta sama stodoła, inna pieczątka.</li>
  </ul>
 </div>`;
}
/* ---- ROZLICZENIE Z KLUBEM: skąd wzięła się każda złotówka ---- */
function settleHtml(r){
 const s=r.settle; if(!s) return '';
 const debtNow=(G.leagues[r.lk]&&G.leagues[r.lk].clubs.find(c=>c.name===r.club)||{}).debt||0;
 const row=(l,v,c='text-zinc-200')=>`<tr class="border-b border-zinc-700/60"><td class="text-zinc-300">${l}</td><td class="text-right ${c} font-bold whitespace-nowrap">${v}</td></tr>`;
 return `<div class="brut p-3 mt-3">
 <div class="text-[11px] text-orange-600 tracking-widest mb-2">ROZLICZENIE Z KLUBEM</div>
 <table class="w-full text-[11px]">
  ${row('Punkty ligowe: '+r.pts+' × '+zl(Math.round(r.earned/Math.max(1,r.pts))), zl(r.earned))}
  ${r.bonus?row('Punkty bonusowe: '+r.bonus+' (liczą się do twojej średniej, nie do wyniku meczu)', zl(r.earnedBon),'text-sky-400'):''}
  ${r.signBonusOwed?row('PREMIA ZA PODPIS — rata za ten sezon'+((r.signBonusOwed>r.signBonus)?' (klub wypłacił część)':''), '+'+zl(r.signBonus||0),'text-emerald-400'):''}
  ${r.earnedPo?row('Faza play-off ('+r.po.p+' pkt + '+r.po.b+' bon.), stawka 150%', zl(r.earnedPo)):''}
  ${row('NALEŻNOŚĆ ZA SEZON', zl(s.owed),'text-zinc-100')}
  ${row('Klub przelał ('+s.ratio+'%)', zl(s.paid),'text-emerald-400')}
  ${s.unpaid?row('Klub NIE przelał — nowa zaległość', '−'+zl(s.unpaid),'text-red-500'):''}
  ${s.pzmEarned?row('Startowe i kilometrówka PZM (DMPJ / Indywidualne)', '+'+zl(s.pzmEarned),'text-emerald-400'):''}
  ${r.imsEarned?row('CYKL ŚWIATOWY (IMŚ / Challenge / Mistrzostwa Europy)', '+'+zl(r.imsEarned),'text-yellow-400'):''}
  ${r.fines?row('Kary i grzywny', '−'+zl(r.fines),'text-red-500'):''}
  ${r.serviceCost?row('Serwis posezonowy sprzętu'+(r.equipWear?' (zużycie -'+r.equipWear+' pkt)':''), '−'+zl(r.serviceCost),'text-red-500'):''}
  ${r.living?row('Koszty życia i utrzymania busa', '−'+zl(r.living),'text-red-500'):''}
  ${r.alimony?`<tr class="border-b border-zinc-700/60" style="background:rgba(220,38,38,.10)">
     <td class="text-red-500 font-bold">Alimenty do Argentyny${r.alimonyLeft!=null?' <span class="text-[11px] text-zinc-400 font-normal">(pozostało rat: '+r.alimonyLeft+')</span>':''}</td>
     <td class="text-right text-red-500 font-bold whitespace-nowrap blink">−${zl(r.alimony)}</td></tr>`:''}
  ${(function(){const bal=s.paid+(s.pzmEarned||0)+(r.imsEarned||0)+(r.signBonus||0)-(r.fines||0)-(r.serviceCost||0)-(r.living||0)-(r.alimony||0);
     return row('BILANS ROKU (do kieszeni)', (bal>=0?'+':'')+zl(bal), bal>=0?'text-emerald-400':'text-red-500');})()}
 </table>
 ${r.alimony?`<div class="text-[11px] text-red-500 font-bold mt-1">Alimenty do Argentyny: −${zl(r.alimony)}${r.alimonyLeft?' — do zapłaty jeszcze '+zl(r.alimony*r.alimonyLeft)+' w '+r.alimonyLeft+' ratach.':' — to była ostatnia rata.'}</div>`:''}
 ${s.pzmEarned?`<div class="text-[11px] text-zinc-400 mt-1">PZM płaci od ręki, niezależnie od kondycji klubu: ${s.pzmStarts||0} × ${zl(500)} startowego + ${s.pzmPts||0} pkt × ${zl(150)}.</div>`:''}
 ${(r.imsParts&&r.imsParts.length)?`<div class="mt-2"><div class="text-[11px] tracking-widest mb-0.5" style="color:#eab308">PIENIĄDZE Z CYKLU ŚWIATOWEGO</div>
   ${r.imsParts.map(x=>`<div class="text-[11px] text-yellow-400">${esc(x.w)}: +${zl(x.v)}</div>`).join('')}
   <div class="text-[11px] text-zinc-400">Grand Prix płaci niezależnie od klubu — i płaci najwięcej ze wszystkiego w tej grze.</div></div>`:''}
 ${(r.payLog&&r.payLog.length)?`<div class="mt-2"><div class="text-[11px] text-zinc-400 tracking-widest mb-0.5">SPŁATY ZALEGŁOŚCI W TRAKCIE SEZONU</div>
   ${r.payLog.map(x=>`<div class="text-[11px] text-emerald-400">kolejka ${x.round}: +${zl(x.amount)}${x.left?' (zostaje '+zl(x.left)+')':' — czysto'}</div>`).join('')}</div>`:''}
 ${debtNow>0?`<div class="text-[11px] mt-2 ${refusalChance(G.p.age,debtNow)>0?'text-red-500 blink':'text-yellow-500'}">
   Łączne zaległości klubu wobec ciebie: <b>${zl(debtNow)}</b> · próg odmowy jazdy dla twojego wieku: ${zl(refusalThreshold(G.p.age))}
   ${refusalChance(G.p.age,debtNow)>0?' — ryzyko buntu '+refusalChance(G.p.age,debtNow)+'% na kolejkę.':''}</div>`
  :'<div class="text-[11px] mt-2 text-emerald-500">Klub nie ma wobec ciebie żadnych zaległości.</div>'}
 </div>`;
}
/* ---- PATO-ZDARZENIA W KLUBACH (po sezonie) ---- */
function clubEventsHtml(r){
 const E=r.clubEvents||[]; if(!E.length) return '';
 const big=E.filter(x=>x.t.length>22), rest=E.filter(x=>x.t.length<=22);
 const row=x=>`<div class="border-l-2 ${x.good?'border-emerald-800':'border-red-900'} pl-3 py-0.5">
   <div class="text-[11px] ${x.good?'text-emerald-500':'text-red-500'} tracking-widest">${esc(x.t)} · ${G.leagues[x.lk]?G.leagues[x.lk].short:''} · <span class="text-zinc-300">${esc(x.d)}</span></div>
   <div class="text-[11px] text-zinc-200">${esc(x.club)}</div>
   <div class="text-[11px] text-zinc-400">${esc(x.x)}</div></div>`;
 return `<div class="brut p-3 mt-3">
  <div class="text-[11px] text-orange-600 tracking-widest mb-2">CO SIĘ STAŁO W KLUBACH PO SEZONIE ${r.year}</div>
  <div class="grid md:grid-cols-2 gap-x-4 gap-y-1">${[...big,...rest].map(row).join('')}</div>
  <div class="text-[11px] text-zinc-400 mt-2">Budżet i OVR każdego klubu przeliczane są po sezonie: gospodarność (wpływy kontra wydatki na kontrakty), miejsce w tabeli i rzut kością na pato-zdarzenia.</div>
 </div>`;
}
/* ---- KARUZELA TRENERSKA W CAŁEJ LIDZE (Sprint 3) ---- */
function coachCarouselHtml(r){
 const L=(G.coachLog||[]).filter(x=>x.kind==='fire' && x.year===r.year);
 if(!L.length) return '';
 return `<div class="brut p-3 mt-3">
  <div class="text-[11px] text-orange-600 tracking-widest mb-2">KARUZELA TRENERSKA PO SEZONIE ${r.year}</div>
  <div class="grid md:grid-cols-2 gap-x-4 gap-y-1">
   ${L.map(x=>`<div class="border-l-2 ${x.me?'border-yellow-600':'border-zinc-700'} pl-3 py-0.5">
     <div class="text-[11px] ${x.me?'text-yellow-500':'text-zinc-400'} tracking-widest">${esc(x.club)}${x.me?' · TWOJA SPRAWA':''}</div>
     <div class="text-[11px] text-zinc-200"><span class="line-through text-zinc-500">${esc(x.out)}</span>
       → <b>${esc(x.inn)}</b> <span class="text-zinc-500">(${esc(x.innType)}, warsztat ${x.innSkill})</span></div>
     <div class="text-[11px] text-zinc-400">${esc(x.why)}</div></div>`).join('')}
  </div>
 </div>`;
}
function statsDevHtml(r){
 const d=(v,col)=>`<span class="${v>0?'text-emerald-400':v<0?'text-red-400':'text-zinc-400'} font-bold">${v>0?'+':''}${v}</span>`;
 const rows=s=>r.statLog.filter(x=>x.s===s).map(x=>
   `<li class="flex justify-between gap-2"><span class="text-zinc-300 truncate">${esc(x.w)}</span>${d(x.d)}</li>`).join('')
   || '<li class="text-zinc-400">bez zmian</li>';
 return `<div class="grid md:grid-cols-2 gap-3 mt-3">
 <div class="brut p-3"><div class="text-[11px] text-lime-500 tracking-widest mb-1">PROFESJONALIZM &nbsp;
   <b class="text-zinc-300">${r.profFrom} → ${r.profTo}</b> ${d(r.profDelta)}</div>
   <div class="bar mb-2"><i style="width:${r.profTo}%;background:#84cc16"></i></div>
   <ul class="text-[11px] space-y-0.5">${rows('prof')}</ul></div>
 <div class="brut p-3"><div class="text-[11px] text-purple-400 tracking-widest mb-1">MEDIALNOŚĆ &nbsp;
   <b class="text-zinc-300">${r.medFrom} → ${r.medTo}</b> ${d(r.medDelta)}</div>
   <div class="bar mb-2"><i style="width:${r.medTo}%;background:#a855f7"></i></div>
   <ul class="text-[11px] space-y-0.5">${rows('med')}</ul></div>
 </div>`;
}
function talkHtml(r){
 if(!r.talk||!r.talk.length) return '';
 return `<div class="brut p-3 mt-3"><div class="text-[11px] text-orange-600 tracking-widest mb-2">CO MÓWIĄ PO SEZONIE</div>
 <div class="space-y-2">${r.talk.map(t=>`<div class="border-l-2 border-zinc-700 pl-3">
   <div class="text-[11px] text-orange-500 tracking-widest">${esc(t.who)}</div>
   <div class="text-[12px] text-zinc-200">${esc(t.txt)}</div></div>`).join('')}</div></div>`;
}
/* ---- WSZYSTKO, CO DRUGORZĘDNE Z TEGO SEZONU, POD JEDNYM PRZEŁĄCZNIKIEM ----
   Wcześniej to było 4-5 osobnych boksów jeden pod drugim (pato-zdarzenia
   w klubach, zmiany szyldów, rozwój profesjonalizmu/medialności, głosy po
   sezonie, raport) — stąd skarga graczy, że się zlewa. Rdzeń sezonu
   (KPI, ocena, zdarzenie, rozliczenie z klubem, alerty) zostaje widoczny
   od razu; to tutaj chowa się za jednym, wyraźnie podpisanym "ROZWIŃ". */
function moreFromSeasonHtml(r){
 const parts=[clubEventsHtml(r), coachCarouselHtml(r), sponsorRenameHtml(), statsDevHtml(r), talkHtml(r)].filter(Boolean);
 if(r.notes.length) parts.push(`<div class="mt-3"><div class="text-[11px] text-zinc-400 tracking-widest mb-1">RAPORT SEZONU</div>
   <ul class="text-[11px] text-zinc-300 space-y-0.5">${r.notes.map(n=>'<li>› '+esc(n)+'</li>').join('')}</ul></div>`);
 if(!parts.length) return '';
 return acc('WIĘCEJ Z TEGO SEZONU', parts.join(''),
   {badge:parts.length+' '+(parts.length===1?'sekcja':parts.length<5?'sekcje':'sekcji'), tone:'text-orange-600'});
}
