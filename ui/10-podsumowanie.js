/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: PODSUMOWANIE
   Zakładki raportu, KPI sezonu, kontrola wykonania zdarzenia
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1415-1589 oryginału).
   ============================================================ */
/* ---- EKRAN: PODSUMOWANIE SEZONU ---- */
function seasonTabs(r){
 const t=[{k:'sezon',n:'PODSUMOWANIE'},{k:'liga',n:'LIGA'},{k:'po',n:'PLAY-OFF'}];
 if(r.leagueStats) t.push({k:'stats',n:'STATYSTYKI INDYWIDUALNE'});
 if(r.dmpj&&r.dmpj.eligible) t.push({k:'dmpj',n:'DMPJ'});
 const I=r.ind||{};
 if(I.imp&&I.imp.rode)   t.push({k:'imp', n:'IMP'});
 if(I.mimp&&I.mimp.rode) t.push({k:'mimp',n:'MIMP'});
 if(I.zk&&I.zk.rode)     t.push({k:'zk',  n:'ZŁOTY KASK'});
 if(I.sk&&I.sk.rode)     t.push({k:'sk',  n:'SREBRNY KASK'});
 if(I.bk&&I.bk.rode)     t.push({k:'bk',  n:'BRĄZOWY KASK'});
 if(I.szk&&I.szk.rode)   t.push({k:'szk', n:'TURNIEJE SZKOLENIOWE'});
 if(I.palet&&I.palet.rode) t.push({k:'palet', n:'PUCHAR PALET'});
 /* --- CYKL ŚWIATOWY --- */
 const W=r.world;
 if(W&&W.ims)  t.push({k:'ims', n:'IMŚ'+(W.ims.rode?'':' (świat)')});
 if(W&&W.imsj) t.push({k:'imsj',n:'IMŚJ2'+(W.imsj.rode?'':' (świat)')});
 if(W&&W.qual) t.push({k:'chal',n:'ELIMINACJE / CHALLENGE'});
 return t;
}
function setTab(k){G.tabView=k;render();}
function tabBar(r){
 const t=seasonTabs(r);
 if(!t.some(x=>x.k===G.tabView)) G.tabView='sezon';
 return `<div class="flex flex-wrap gap-1 mb-3">${t.map(x=>`<button onclick="setTab('${x.k}')"
   class="px-3 py-1.5 text-[11px] font-bold tracking-widest border ${G.tabView===x.k
     ?'bg-orange-700 border-orange-500 text-black':'btn text-zinc-300'}">${x.n}</button>`).join('')}</div>`;
}
function scSummary(){
 const r=G.last, p=G.p;
 const bar = tabBar(r);
 const foot = `<div class="mt-4 flex gap-2 flex-wrap">
  <button onclick="nextYear()" class="btn px-7 py-3 font-extrabold tracking-[.2em] text-orange-500">DALEJ — MIĘDZYSEZONIE &gt;</button>
  <button onclick="retire()" class="btn-d px-5 py-3 font-bold tracking-widest text-red-400">ZAKOŃCZ KARIERĘ</button>
 </div></div>`;
 const V=G.tabView;
 /* PODGLĄD SPOTKANIA — wisi nad każdą zakładką, dopóki go nie zamkniesz */
 const mv = G.matchView ? matchModalHtml() : '';
 if(V==='liga')  return head()+`<div class="fade">${bar}${mv}${ligaView(r)}${foot}`;
 if(V==='po')    return head()+`<div class="fade">${bar}${mv}${phaseHtml(r)}${playoffHtml()}${foot}`;
 if(V==='stats') return head()+`<div class="fade">${bar}${leagueStatsHtml(r)}${foot}`;
 if(V==='dmpj')  return head()+`<div class="fade">${bar}${dmpjHtml(r)}${foot}`;
 if(V==='ims')   return head()+`<div class="fade">${bar}${imsHtml(r.world?r.world.ims:null,r)}${foot}`;
 if(V==='imsj')  return head()+`<div class="fade">${bar}${imsHtml(r.world?r.world.imsj:null,r)}${foot}`;
 if(V==='chal')  return head()+`<div class="fade">${bar}${imsQualHtml(r)}${foot}`;
 if(['imp','mimp','zk','sk','bk','szk','palet','macec'].includes(V)) return head()+`<div class="fade">${bar}${indHtml(r.ind[V],r)}${foot}`;
 return head()+`<div class="fade">
 ${bar}
 <div class="brut mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">PODSUMOWANIE SEZONU ${r.year} // ${esc(r.club)} (${r.league})</div>
 <div class="p-4">
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
   ${kpi('MECZE (LIGA)',r.matches)}
   ${kpi('BIEGI (STARTY)',r.heats)}
   ${kpi('ZDOBYTE PUNKTY',r.pts,'text-orange-400')}
   ${kpi('PUNKTY BONUSOWE',r.bonus,'text-sky-400')}
   ${kpi('DEFEKTY',r.defects,'text-red-500')}
   ${kpi('WYKLUCZENIA',r.exclusions,'text-red-400')}
   ${kpi('ŚREDNIA BIEGOPUNKTOWA',r.avgTxt,'text-emerald-400')}
  </div>
  ${/* Kafelki wyżej to SAMA runda zasadnicza (na nich opiera się kontrola matematyczna
       niżej). Ta linijka pokazuje dorobek, który realnie trafia do statystyk kariery,
       żeby nikt nie musiał się zastanawiać, skąd na karcie kariery bierze się
       liczba większa niż liczba kolejek. */''}
  ${(r.po && r.po.m) ? `<div class="text-[11px] text-zinc-400 mb-4 border border-zinc-700 px-3 py-2">
   DO STATYSTYK KARIERY LICZY SIĘ LIGA <b class="text-zinc-300">RAZEM Z PLAY-OFFEM</b>:
   mecze ${r.matches} + ${r.po.m} = <b class="text-zinc-300">${r.matchesAll}</b> ·
   biegi ${r.heats} + ${r.po.h} = <b class="text-zinc-300">${r.heatsAll}</b> ·
   punkty ${r.pts} + ${r.po.p} = <b class="text-zinc-300">${r.ptsAll}</b> ·
   średnia łączna = <b class="text-emerald-400">${r.avgAllTxt}</b>
  </div>` : ''}
  <div class="mb-4">${accLite('KONTROLA MATEMATYCZNA — SKĄD BIORĄ SIĘ TE LICZBY', `
   <div class="text-[11px] text-zinc-400 border border-zinc-700 px-3 py-2">
   biegi ukończone = ${r.heats} − (${r.defects} + ${r.exclusions}) = <b class="text-zinc-300">${r.completed}</b> ·
   maks. możliwe punkty = ${r.completed}×3 = <b class="text-zinc-300">${r.completed*3}</b> ·
   średnia = (${r.pts} pkt + ${r.bonus} bonusowych) ÷ ${r.heats} = <b class="text-zinc-300">${r.avgTxt}</b>
   ${r.replaced?` · byłeś zmieniany przez rezerwę <b class="text-zinc-300">${r.replaced}×</b> — te biegi nie wchodzą do liczby startów`:''} ·
   <b class="text-sky-400">PUNKTY BONUSOWE LICZĄ SIĘ DO ŚREDNIEJ BIEGOPUNKTOWEJ</b> (zmiana z 21.08.2026): to punkty zdobyte na torze dla drużyny,
   więc wchodzą do średniej i do portfela — do wyniku spotkania nie wchodzą, bo tam liczy się goła punktacja biegowa
  </div>`)}</div>
  <div class="grid md:grid-cols-2 gap-3">
   <div class="brut p-3">
    <div class="text-[11px] text-zinc-400 tracking-widest mb-1">OCENA SEZONU — WSZYSTKIE ROZGRYWKI</div>
    <div class="text-2xl font-extrabold ${r.grade.c}">${r.grade.t}</div>
    <div class="text-[11px] text-zinc-300 mt-1">Forma: <b class="${r.grade.c}">${r.grade.f}</b></div>
    <div class="text-[11px] text-zinc-400 mt-1">Łącznie ${r.tally.p} pkt w ${r.tally.h} biegach (liga + play-off + DMPJ + turnieje indywidualne) = średnia <b class="text-zinc-300">${r.tally.h?r.overall.toFixed(2):'—'}</b></div>
    ${gradePartsHtml(r)}
    ${r.medals.length?`<div class="mt-1">${r.medals.map(m=>`<div class="text-[11px] ${medalCol(m.pos)}">${medalTxt(m.pos)} — ${esc(m.name)}</div>`).join('')}</div>`:''}
    <div class="text-[11px] text-zinc-300 mt-2">Atmosfera w klubie: <b class="text-zinc-200">${r.atm}/100 (${r.atmTxt})</b></div>
    <div class="text-[11px] text-zinc-300">Rozwój: OVR ${r.ovrFrom} → <b class="${r.ovrTo>=r.ovrFrom?'text-emerald-400':'text-red-400'}">${r.ovrTo}</b></div>
   </div>
   <div class="brut p-3">
    <div class="text-[11px] text-orange-600 tracking-widest mb-1">ZDARZENIE: ${esc(r.evTitle||'—')}</div>
    <div class="text-[11px] text-zinc-300 mb-2">Wybór: „${esc(r.evChoice||'—')}”</div>
    <ul class="text-[11px] text-zinc-300 space-y-0.5">${(r.evLog||[]).map(l=>'<li>› '+esc(l)+'</li>').join('')}</ul>
    ${evEffectsHtml(r)}
   </div>
  </div>
  ${bigMatchHtml(r)}
  ${ovrLogHtml(r)}
  ${potHtml(r)}
  ${careerOverHtml(r)}
  ${longInjuryHtml(r)}
  ${bankruptHtml(r)}
  ${bankruptcyBoardHtml(r)}
  ${settleHtml(r)}
  ${moreFromSeasonHtml(r)}
 </div></div>`+foot;
}
/* ============================================================
   CO NAPRAWDĘ ZROBIŁ TWÓJ WYBÓR — KONTROLA WYKONANIA
   Ekran zdarzenia obiecuje karę, walkower, więcej biegów, inną stawkę.
   Ten boks pokazuje, jak te obietnice weszły do rozegranego sezonu
   i co z nich przechodzi na kolejny rok. Nic tu nie jest opisem — to odczyt
   stanu, z którym silnik naprawdę policzył sezon.
   ============================================================ */
function evEffectsHtml(r){
 const E=r.evEffects; if(!E) return '';
 const L=[];
 const ok=(t)=>L.push({t, c:'text-emerald-400'});
 const bad=(t)=>L.push({t, c:'text-red-400'});
 const neu=(t)=>L.push({t, c:'text-zinc-300'});
 /* OVR ZE ZDARZENIA — rubryka, której tu brakowało. Zdarzenia typu „+2 OVR"
    naprawdę dodawały OVR (fxO zmienia G.p.ovr od razu), ale kontrola wykonania
    o tym milczała, więc wyglądało to na błąd. Teraz widać to czarno na białym,
    a pełna rozpiska jest w boksie „CO WPŁYNĘŁO NA TWÓJ OVR". */
 if(E.ovrEvent)     (E.ovrEvent>0?ok:bad)('OVR ze zdarzenia: '+(E.ovrEvent>0?'+':'')+E.ovrEvent+
   ' — zapisane na stałe w twojej karcie (OVR na start sezonu: '+(E.ovrFrom!=null?E.ovrFrom:'—')+')');
 if(E.fines)        bad('Kary finansowe pobrane z budżetu: '+zl(E.fines));
 if(E.rateMul!==1)  (E.rateMul>1?ok:bad)('Stawka za punkt w tym sezonie: ×'+E.rateMul.toFixed(2)+' — rozliczona przy każdej kolejce');
 if(E.noEarnings)   bad('Zrzeczenie się wynagrodzenia wykonane: z ligi nie wpłynął ani grosz');
 if(E.heatPP)       (E.heatPP>0?ok:bad)('Wpływ na skład: '+(E.heatPP>0?'+':'')+E.heatPP+' p.p. — doliczone do twojej wartości u trenera przy KAŻDEJ kolejce');
 if(E.ovrBonus)     (E.ovrBonus>0?ok:bad)('Dyspozycja w meczach: '+(E.ovrBonus>0?'+':'')+E.ovrBonus+' OVR — liczone w każdym biegu tego sezonu');
 if(E.teamOvr)      (E.teamOvr>0?ok:bad)('OVR całej drużyny: '+(E.teamOvr>0?'+':'')+E.teamOvr+' — zmieniony na stałe');
 if(E.teamPts)      (E.teamPts>0?ok:bad)('Punkty drużyny w tabeli: '+(E.teamPts>0?'+':'')+E.teamPts);
 if(E.banMatches)   bad('Zawieszenie wykonane: '+E.banMatches+' spotkań poza składem');
 if(E.injuryPP)     (E.injuryPP>0?bad:ok)('Ryzyko urazu: '+(E.injuryPP>0?'+':'')+E.injuryPP+' p.p. (łącznie w tym sezonie '+E.injuryP+'%)');
 if(E.extraDefP)    bad('Ryzyko defektu: +'+Math.round(E.extraDefP*1000)/10+' p.p. na każdy bieg');
 if(E.equipFit!=null && E.equipFit<100) bad('Dopasowanie sprzętu: '+E.equipFit+'% — mniej mocy w każdym biegu');
 if(E.walkover)     bad('WALKOWER wykonany w '+E.walkover.round+'. kolejce ('+
   ({lose:'0:75 dla rywala',win:'75:0 dla was',both:'obustronny 0:0',void:'wynik anulowany'}[E.walkover.mode]||'0:75')+
   ')'+(E.walkover.pen?' + kara '+E.walkover.pen+' pkt w tabeli':'')+' — spotkanie NIE zostało rozegrane');
 if(E.zeroMatches)  bad('Kara prezesa wykonana: zero meczów w tym sezonie');
 if(E.forcedEnd)    bad('Sezon urwany decyzją pozaboiskową — play-off, DMPJ i turnieje odpadły');
 if(E.noRenew)      bad('Klub zerwał rozmowy o kontrakcie — po sezonie wychodzisz na rynek');
 const N=E.next||{}, NX=[];
 if(N.zeroMatches)  NX.push('kolejny sezon: 0 meczów');
 if(N.heatPP)       NX.push('szanse na skład '+(N.heatPP>0?'+':'')+N.heatPP+' p.p.');
 if(N.injuryPP)     NX.push('ryzyko urazu '+(N.injuryPP>0?'+':'')+N.injuryPP+' p.p.');
 if(N.rateMul&&N.rateMul!==1) NX.push('stawka ×'+N.rateMul.toFixed(2));
 if(N.betterOffers) NX.push('lepsze oferty w najbliższym okienku (+5 do wartości rynkowej, +1 oferta)');
 if(N.forceClub)    NX.push('wymuszona zmiana klubu w okienku');
 if(N.lockTransfer) NX.push('blokada transferowa na '+N.lockTransfer+' okienko/okienka');
 if(N.noSponsor)    NX.push('zero premii za podpis w najbliższym okienku');
 if(N.rowPen)       NX.push('mniejsza szansa na ofertę z Rybnika');
 if(N.longInjury)   NX.push('kolejny sezon poza torem (kontuzja długoterminowa)');
 if(N.alimony)      NX.push('alimenty: pozostało rat '+N.alimony);
 if(!L.length && !NX.length) return accLite('KONTROLA WYKONANIA',
   `<div class="text-[11px] text-zinc-400">Ten wybór nie miał skutków mechanicznych — poza tym, co przeczytałeś wyżej.</div>`);
 const body = `<ul class="text-[11px] space-y-0.5">${L.map(x=>`<li class="${x.c}">✓ ${esc(x.t)}</li>`).join('')}</ul>
  ${NX.length?`<div class="text-[11px] mt-1" style="color:#38bdf8">PRZECHODZI NA KOLEJNY ROK: ${esc(NX.join(' · '))}</div>`:''}`;
 return accLite('KONTROLA WYKONANIA — CO SILNIK REALNIE POLICZYŁ', body,
   {badge:L.length+(NX.length?' + '+NX.length+' na przyszłość':'')});
}

/* ---- SKĄD WZIĘŁA SIĘ TA OCENA ----
   Ocena to nie sama średnia biegowa: liczy się liczba odjechanych biegów
   (mała próba ciągnięta jest do średniej ligowej), awans, utrzymanie, medale,
   play-off i to, ile spotkań zabrała kontuzja. */
function gradePartsHtml(r){
 const P=r.gradeParts||[]; if(!P.length) return '';
 const body = `<ul class="text-[11px] space-y-0.5">${P.map(x=>`<li class="flex justify-between gap-2">
    <span class="text-zinc-300">${esc(x.w)}</span>
    <span class="font-bold whitespace-nowrap ${x.d>0?'text-emerald-400':x.d<0?'text-red-400':'text-zinc-400'}">${x.d>0?'+':''}${x.d.toFixed(2)}</span></li>`).join('')}</ul>`;
 return accLite('SKĄD WZIĘŁA SIĘ TA OCENA', body, {badge:'wynik '+r.gradeScore});
}
