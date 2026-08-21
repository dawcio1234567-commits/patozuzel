/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN KONCA
   Werdykt kariery, one-club man, restart
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 3298-3381 oryginału).
   ============================================================ */
/* ---- EKRAN KOŃCA KARIERY ---- */
function retire(reason){
 G.p.retired=true; G.p.retireReason=reason||'Decyzja własna.';
 G.screen='end'; render();
}
function scEnd(){
 const p=G.p, c=p.career;
 const avg = c.heats>0 ? (c.pts/c.heats).toFixed(2) : '0.00';
 let verdict;
 if((c.indTitles||0)>0 && +avg>2.0) verdict='INDYWIDUALNY MISTRZ POLSKI. Puchar im. Józefa Dochy stał u ciebie na kredensie. Rondo to kwestia czasu.';
 else if(c.titles>0 && +avg>2.0) verdict='LEGENDA. Twoje nazwisko wyryte na trybunie. Ktoś nazwie tobą rondo.';
 else if(+avg>1.8) verdict='KLASOWY ZAWODNIK. Portale nazwą cię „filarem ligi”, a potem zapomną w trzy lata.';
 else if(+avg>1.3) verdict='SOLIDNY RZEMIEŚLNIK. Nie zachwycałeś, ale wypełniałeś rubrykę i płacili.';
 else if(+avg>0.8) verdict='ZAWODNIK OD PARZYSTEJ. Jeździłeś, żeby klub nie miał kar. Też ktoś musi.';
 else verdict='PATO-ŻUŻEL W CZYSTEJ POSTACI. Więcej defektów niż punktów. Legenda internetu, nie toru.';
 return head()+`<div class="fade">
 <div class="brut border-red-900 mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-red-500 font-bold">KONIEC KARIERY</div>
 <div class="p-5">
  <div class="text-2xl font-extrabold text-zinc-100 mb-1">${esc(p.name)}</div>
  <div class="text-[11px] text-zinc-400 mb-4">${esc(p.cls)} · zakończył w wieku ${p.age} lat · ${esc(p.retireReason)}</div>
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
   ${kpi('SEZONY',c.seasons)}${kpi('MECZE',c.matches)}${kpi('BIEGI',c.heats)}
   ${kpi('PUNKTY',c.pts,'text-orange-400')}${kpi('BONUSOWE',c.bon||0,'text-sky-400')}${kpi('DEFEKTY',c.def,'text-red-500')}${kpi('WYKLUCZENIA',c.exc,'text-red-400')}
   ${kpi('ŚR. KARIERY',avg,'text-emerald-400')}
  </div>
  <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
   ${kpi('MISTRZOSTWA LIGI',c.titles,'text-yellow-400')}
   ${kpi('TYTUŁY INDYWIDUALNE',c.indTitles||0,'text-yellow-400')}
   ${kpi('MEDALE INDYWIDUALNE',c.medals||0,'text-zinc-100')}
   ${kpi('NAJLEPSZA ŚREDNIA',c.best,'text-emerald-400')}${kpi('ZAROBIONE',zl(c.earned),'text-orange-400')}
  </div>
  ${c.dmpjStarts?`<div class="text-[11px] text-zinc-300 mb-3">DMPJ: ${c.dmpjStarts} turniejów, ${c.dmpjPts||0} punktów${c.dmpjTitles?`, <b class="text-pink-400">${c.dmpjTitles}× drużynowe mistrzostwo Polski juniorów</b>`:''}.</div>`:''}
  ${c.pzmEarned?`<div class="text-[11px] text-zinc-300 mb-3">Startowe i kilometrówka PZM przez całą karierę: <b class="text-emerald-400">${zl(c.pzmEarned)}</b>.</div>`:''}
  <div class="brut p-4 text-[13px] text-zinc-200 border-l-2 border-orange-700">${verdict}</div>
  ${oneClubHtml()}
  ${(c.living||c.service)?`<div class="text-[11px] text-zinc-400 mt-3">Przez całą karierę zostawiłeś
   <b class="text-red-400">${zl(c.living||0)}</b> na kosztach życia i <b class="text-red-400">${zl(c.service||0)}</b>
   na serwisie sprzętu. To są pieniądze, których nie widać w rubryce „zarobione".</div>`:''}
  ${c.alimony?`<div class="brut p-3 mt-3 border-2 border-red-700 bg-red-950/20">
   <div class="text-[11px] text-red-500 font-bold tracking-widest mb-1">ALIMENTY DO ARGENTYNY</div>
   <div class="text-[12px] text-red-400 font-bold">Wysłane przez całą karierę: ${zl(c.alimony)}</div>
   ${G.p.alimony>0?`<div class="text-[11px] text-zinc-300 mt-1">Do zapłaty zostało jeszcze ${G.p.alimony} rat
     (${zl(ECON.alimony*G.p.alimony)}). Koniec kariery nic tu nie zmienia — sąd nie interesuje się emeryturą.</div>`
    :`<div class="text-[11px] text-zinc-300 mt-1">Zobowiązanie spłacone w całości. Jedna zima w Argentynie, osiemnaście lat przelewów.</div>`}
  </div>`:''}
 </div></div>

 <div class="brut mb-3" style="border-color:#14532d">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#14532d;color:#22c55e">PAMIĄTKA — KARTA STATYSTYK "SportoweMity.pl"</div>
  <div class="p-4 flex items-center justify-between flex-wrap gap-3">
   <div class="text-[11px] text-zinc-300 max-w-xl">
    Cała kariera na jednej planszy w barwach portalu: kluby, sezon po sezonie, miejsca w biegach,
    defekty, wykluczenia i — na samym dole, wielkim czerwonym drukiem — suma tego, czego kluby
    nigdy ci nie przelały: <b class="text-red-500">${zl(unpaidCareerTotal())}</b>.
   </div>
   <button onclick="downloadCareerPNG(this)" class="btn px-6 py-3 font-extrabold tracking-[.15em]"
     style="color:#22c55e;border-color:#166534">POBIERZ KARTĘ (PNG) &darr;</button>
  </div>
 </div>

 ${G.history.length?historyBox():''}
 <button onclick="restart()" class="btn px-7 py-3 font-extrabold tracking-[.2em] text-orange-500">NOWA KARIERA &gt;</button>
 ${careerCardHtml()}
 </div>`;
}
const unpaidCareerTotal = () => G.history.reduce((a,h)=>a+smUnpaid(h),0);
/* ---- ONE-CLUB MAN: nagroda za karierę w jednych barwach ---- */
function oneClubHtml(){
 const p=G.p, c=p.career, clubs=smClubs();
 if(!G.history.length) return '';
 if(clubs.length===1 && c.seasons>=6){
  return `<div class="brut p-4 mt-3" style="border-color:#a16207">
   <div class="text-[12px] font-bold tracking-widest mb-1" style="color:#eab308">ONE-CLUB MAN</div>
   <div class="text-[12px] text-zinc-200">Całe ${c.seasons} sezonów w jednym klubie: <b class="text-orange-400">${esc(clubs[0].club)}</b>
   (${clubs[0].from}–${clubs[0].to})${c.renewals?`, ${c.renewals}× przedłużenie umowy jeszcze w trakcie jej trwania`:''}.
   Sektor B pamięta takich dłużej niż mistrzów, którzy zmieniali barwy co dwa lata.</div></div>`;
 }
 if(clubs.length>=6) return `<div class="brut p-4 mt-3">
   <div class="text-[12px] text-zinc-300 tracking-widest mb-1">WĘDROWNY GRAJEK</div>
   <div class="text-[12px] text-zinc-300">${clubs.length} klubów w ${c.seasons} sezonów. Bus znał drogę wszędzie, kibice nigdzie.</div></div>`;
 return '';
}
function restart(){seasonReset();G=newGame();evHist=[];wevHist=[];_offers=[];_renew=null;render();}
