/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: WIDOK IMS
   Grand Prix, eliminacje, Challenge, IMŚJ2
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2017-2192 oryginału).
   ============================================================ */
/* ============================================================
   INDYWIDUALNE MISTRZOSTWA ŚWIATA — EKRAN
   ============================================================ */
const flag = c => `<span class="text-zinc-500 text-[11px]">${esc(c||'POL')}</span>`;
function gpHeatHtml(X){
 if(!X) return '';
 return `<div class="text-[11px] mb-1">
   <span class="text-yellow-600 tracking-widest">${esc(X.label)}:</span>
   ${X.rows.map(r=>`<span class="${r.me?'text-orange-400 font-bold':'text-zinc-300'}">${r.pos}. ${esc(r.name)}${r.out?' <span class="text-red-500">('+r.out+')</span>':''}</span>`).join(' <span class="text-zinc-600">·</span> ')}
 </div>`;
}
function gpRoundHtml(rd, i){
 const top=rd.rows.slice(0,3).map(x=>x.name).join(' · ');
 const body=`
  ${rd.wild?`<div class="text-[11px] text-zinc-400 mb-1">Dzika karta rundy: <b class="text-zinc-300">${esc(rd.wild.name)}</b> ${flag(rd.wild.ctry)}</div>`:''}
  ${rd.me?`<div class="text-[12px] mb-2">Twój przejazd: <b class="text-orange-400">${rd.me.chartPts} pkt</b> w tabeli (${rd.me.chartPos}. miejsce)
    <span class="text-zinc-300">(${codesHtml(rd.me.codes)})</span> → <b class="${rd.me.pos===1?'text-yellow-400':rd.me.pos<=3?'text-emerald-400':'text-zinc-200'}">${rd.me.pos}. miejsce w rundzie</b>
    <span class="text-zinc-400">· ${SGP.pts[rd.me.pos-1]||0} pkt do klasyfikacji</span></div>`:''}
  ${gpHeatHtml(rd.L1)}${gpHeatHtml(rd.L2)}${gpHeatHtml(rd.F)}
  <table class="w-full text-[11px] mt-2">
   <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
    <th class="text-left">#</th><th class="text-left">ZAWODNIK</th><th>KRAJ</th><th>TABELA</th><th>PKT GP</th></tr></thead>
   <tbody>${rd.rows.map(x=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
     <td class="w-6 font-bold ${x.pos===1?'text-yellow-400':x.pos<=3?'text-emerald-400':'text-zinc-400'}">${x.pos}</td>
     <td class="truncate max-w-[200px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}</td>
     <td class="text-center">${flag(x.ctry)}</td>
     <td class="text-center text-zinc-300">${x.chart}</td>
     <td class="text-center text-orange-400 font-bold">${x.gp}</td></tr>`).join('')}
   </tbody></table>`;
 return accLite(esc(rd.title), body, {badge:top, tone:'text-yellow-600', open:!!(rd.me && i===0)});
}
function imsHtml(c, r){
 if(!c) return '<div class="brut p-3 text-[11px] text-zinc-400">Ten cykl nie został w tym sezonie rozegrany.</div>';
 const mine=c.rode;
 return `<div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="color:#eab308">
   ${esc(c.name)} ${r.year}</div>
 <div class="p-3">
  <div class="text-[11px] text-zinc-400 tracking-widest mb-3">${esc(c.sub||'')}</div>
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
   ${kpi('TWOJE MIEJSCE', mine&&c.mePos?c.mePos+'.':'—', medalCol(mine?c.mePos:0))}
   ${kpi('PUNKTY W CYKLU', mine?c.mePts:'—','text-orange-400')}
   ${kpi('RUNDY Z TWOIM UDZIAŁEM', mine?c.meStat.rounds:0)}
   ${kpi('FINAŁY RUND', mine?c.meStat.finals:0,'text-sky-400')}
   ${kpi('WYGRANE RUNDY', mine?c.meStat.roundWins:0,'text-yellow-400')}
   ${kpi('ZAROBEK', mine?zl(c.money):'—','text-emerald-400')}
  </div>
  ${!mine?`<div class="brut p-3 mb-3 border-red-900"><div class="text-[11px] text-red-400">
    W tym sezonie nie miałeś miejsca w cyklu. Droga do Grand Prix prowadzi przez ${c.jun?'ranking juniorów świata':'eliminacje krajowe i turniej SGP Challenge (zakładka ELIMINACJE)'} —
    albo przez dziką kartę, którą Komisja przyznaje najlepszym zawodnikom spoza cyklu.</div></div>`:''}
  <div class="grid lg:grid-cols-2 gap-3 mb-3">
   <div class="brut p-3">
    <div class="text-[11px] text-yellow-600 tracking-widest mb-1">KLASYFIKACJA KOŃCOWA CYKLU</div>
    <div class="max-h-[420px] overflow-y-auto"><table class="w-full text-[11px]">
     <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
      <th class="text-left">#</th><th class="text-left">ZAWODNIK</th><th>KRAJ</th><th>WYGR.</th><th>PKT</th></tr></thead>
     <tbody>${c.classification.map((x,i)=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
       <td class="w-6 font-bold ${i===0?'text-yellow-400':i<3?'text-emerald-400':'text-zinc-400'}">${i+1}</td>
       <td class="truncate max-w-[190px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}</td>
       <td class="text-center">${flag(x.ctry)}</td>
       <td class="text-center text-zinc-400">${x.wins}</td>
       <td class="text-center font-bold text-orange-400">${x.pts}</td></tr>`).join('')}</tbody></table></div>
    <div class="text-[11px] text-zinc-400 mt-1">Punkty za miejsce w rundzie: ${SGP.pts.slice(0,6).join(' / ')} … ${SGP.pts[SGP.pts.length-1]}.</div>
   </div>
   <div class="brut p-3">
    <div class="text-[11px] text-yellow-600 tracking-widest mb-1">SKŁAD CYKLU — SKĄD SIĘ WZIĄŁ</div>
    <div class="max-h-[300px] overflow-y-auto"><table class="w-full text-[11px]">
     ${(c.lineup||[]).map((x,i)=>`<tr class="border-b border-zinc-700/60">
      <td class="w-6 text-zinc-400">${i+1}</td>
      <td class="truncate max-w-[150px] ${x.name===r.pname?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}</td>
      <td class="text-center">${flag(x.ctry)}</td>
      <td class="text-[11px] text-zinc-400 text-right truncate max-w-[220px]">${esc(x.how)}</td></tr>`).join('')}
    </table></div>
    <div class="text-[11px] text-zinc-400 mt-2 leading-relaxed">
     Piętnastu stałych uczestników plus jedna dzika karta rundy = szesnastka na starcie każdej rundy.
     Do tego dwóch rezerwowych toru, którzy wchodzą za zawodnika wykluczonego za przekroczenie taśmy albo wycofanego po kraksie.</div>
   </div>
  </div>
  ${mine&&c.moneyParts&&c.moneyParts.length?`<div class="brut p-3 mb-3">
    <div class="text-[11px] text-emerald-500 tracking-widest mb-1">TWOJE PIENIĄDZE Z CYKLU</div>
    <table class="w-full text-[11px]">${c.moneyParts.map(x=>`<tr class="border-b border-zinc-700/60">
      <td class="text-zinc-300">${esc(x.w)}</td><td class="text-right text-emerald-400 font-bold whitespace-nowrap">${zl(x.v)}</td></tr>`).join('')}
      <tr><td class="text-zinc-200 font-bold">RAZEM</td><td class="text-right text-emerald-400 font-extrabold">${zl(c.money)}</td></tr></table>
    <div class="text-[11px] text-zinc-400 mt-1">Ryczałt startowy ${zl(c.jun?Math.round(SGP.startFee*SGP.junPrizeMul):SGP.startFee)} za każdą rundę leci niezależnie od wyniku.</div>
   </div>`:''}
  <div class="space-y-2">${(c.rounds||[]).map((rd,i)=>gpRoundHtml(rd,i)).join('')}</div>
  <div class="text-[11px] text-zinc-400 mt-3 leading-relaxed">
   FORMAT RUNDY: 16 zawodników, 20 biegów zasadniczych (każdy po 5 startów), 3-2-1-0 · dwóch z czoła tabeli jedzie prosto do finału ·
   miejsca 3-10 rozstawione są na LCQ1 i LCQ2, zwycięzca każdego z nich dołącza do finału · zwycięzca finału wygrywa rundę. Razem 23 biegi.
   <b class="text-zinc-300">W turniejach indywidualnych nie ma punktów bonusowych</b> — nie ma par klubowych, nie ma za kogo jechać.</div>
 </div></div>`;
}
/* ---- ELIMINACJE DO CYKLU: kwalifikacje krajowe + Challenge + SEC ---- */
function imsQualHtml(r){
 const W=r.world; if(!W||!W.qual) return '';
 const Q=W.qual, CH=Q.challenge, SEC=W.sec;
 const tbl=(rows,cols)=>`<table class="w-full text-[11px]">
  ${rows.map(x=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
   <td class="w-6 font-bold ${x.through?'text-emerald-400':x.pos<=3?'text-zinc-200':'text-zinc-400'}">${x.pos}</td>
   <td class="truncate max-w-[190px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}</td>
   <td class="text-center">${flag(x.ctry)}</td>
   ${x.pts!=null?`<td class="text-right text-zinc-300">${x.pts}</td>`:'<td></td>'}
   ${cols?`<td class="text-right text-[11px] ${x.through?'text-emerald-500':'text-zinc-600'}">${x.through?'AWANS':''}</td>`:''}</tr>`).join('')}
 </table>`;
 return `<div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="color:#eab308">
   DROGA DO GRAND PRIX ${r.year} — ELIMINACJE, CHALLENGE, MISTRZOSTWA EUROPY</div>
 <div class="p-3">
  <div class="text-[11px] text-zinc-400 leading-relaxed mb-3">
   Kwalifikacja do cyklu prowadzi przez eliminacje krajowe, a te kończą się turniejem <b class="text-zinc-300">SGP CHALLENGE</b> —
   czterech najlepszych z Challenge dostaje miejsca w cyklu na kolejny rok. W Polsce eliminacją jest
   <b class="text-zinc-300">ZŁOTY KASK</b>: jego czterej najlepsi jadą do Challenge. Anglia, Szwecja i Dania mają własne eliminacje.
   Pozostałe federacje (Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy) jadą we wspólnym turnieju i wyprowadzają z niego
   tylko trzech — stoją żużlowo słabiej i szerszy przydział rozwaliłby balans cyklu.
   Osobną drogą jest tytuł <b class="text-zinc-300">Mistrza Europy</b>: jego zdobywca ma miejsce w cyklu z automatu.
  </div>
  <div class="brut p-3 mb-3" style="border-color:#eab308">
   <div class="text-[11px] tracking-widest mb-1" style="color:#eab308">${esc(CH.title)}</div>
   ${CH.rode?`<div class="text-[12px] mb-2">Twój wynik: <b class="text-orange-400">${CH.mePts} pkt</b> · <b class="${CH.mePos<=4?'text-emerald-400':'text-zinc-200'}">${CH.mePos}. miejsce</b>
     ${CH.mePos<=4?' — <b class="text-emerald-400">MASZ MIEJSCE W CYKLU NA KOLEJNY ROK!</b>':''} · nagroda ${zl(CH.money)}</div>`
    :'<div class="text-[11px] text-zinc-400 mb-2">Nie zakwalifikowałeś się do Challenge.</div>'}
   ${tbl(CH.table.map((x,i)=>({...x, through:i<4})), true)}
   <div class="text-[11px] text-zinc-400 mt-1">Awans do cyklu: cztery pierwsze miejsca. Jeżeli któryś z tej czwórki i tak kończy sezon
    w czołowej siódemce Grand Prix, jego miejsce bierze kolejny zawodnik Challenge bez kwalifikacji.</div>
  </div>
  <div class="grid md:grid-cols-2 gap-2 mb-3">
   ${Q.quals.map(q=>`<div class="brut p-2">
     <div class="text-[11px] text-zinc-300 tracking-widest">${esc(q.title)}</div>
     <div class="text-[11px] text-zinc-400 mb-1">${esc(q.note)}</div>
     ${tbl(q.table.slice(0,10), true)}</div>`).join('')}
  </div>
  <div class="brut p-3">
   <div class="text-[11px] tracking-widest mb-1" style="color:#38bdf8">${esc(SEC.title)} ${r.year}</div>
   <div class="text-[11px] text-zinc-300 mb-1">Mistrz Europy: <b class="text-sky-400">${esc(SEC.winner?SEC.winner.name:'—')}</b> ${flag(SEC.winner?SEC.winner.ctry:'')}
    — miejsce w cyklu Grand Prix ${r.year+1} z automatu.</div>
   ${SEC.rode?`<div class="text-[12px] mb-1">Twoje miejsce: <b class="${SEC.mePos===1?'text-yellow-400':'text-zinc-200'}">${SEC.mePos}.</b> · nagroda ${zl(SEC.money)}</div>`:''}
   ${tbl(SEC.table.slice(0,8).map((x,i)=>({...x, through:i===0})), true)}
  </div>
  ${junQualHtml(r, tbl)}
 </div></div>`;
}
/* ============================================================
   DROGA DO IMŚJ2 — ELIMINACJE I SGP2 CHALLENGE (nowe 22.08.2026)
   ------------------------------------------------------------
   Ta sama struktura co u seniorów, tylko z ostrzejszym limitem wieku:
   w eliminacjach jedzie ten, kto W KOLEJNYM SEZONIE wciąż będzie
   młodzieżowcem. Polską eliminacją jest SREBRNY KASK.
   ============================================================ */
function junQualHtml(r, tbl){
 const W=r.world; if(!W||!W.qualJun) return '';
 const Q=W.qualJun, CH=Q.challenge;
 return `<div class="brut p-3 mt-3" style="border-color:#22c55e">
  <div class="text-[11px] tracking-widest mb-1" style="color:#4ade80">DROGA DO IMŚJ2 — ELIMINACJE I SGP2 CHALLENGE</div>
  <div class="text-[11px] text-zinc-400 leading-relaxed mb-3">
   Cykl juniorski ma od tego sezonu własne kwalifikacje, zbudowane jak seniorskie:
   czołowa siódemka poprzedniego cyklu zachowuje miejsce (o ile nie skończyła 22 lat),
   czterech dochodzi z turnieju <b class="text-zinc-300">SGP2 CHALLENGE</b>, resztę dobiera Komisja dzikimi kartami.
   Polską eliminacją jest <b class="text-zinc-300">SREBRNY KASK</b> — jego czterej najlepsi jadą do Challenge.
   Anglia, Szwecja i Dania mają własne turnieje, pozostałe federacje wspólny.
   W eliminacjach startuje wyłącznie ten, kto w kolejnym sezonie wciąż będzie młodzieżowcem.
  </div>
  <div class="brut p-3 mb-3" style="border-color:#22c55e">
   <div class="text-[11px] tracking-widest mb-1" style="color:#4ade80">${esc(CH.title)}</div>
   ${CH.rode?`<div class="text-[12px] mb-2">Twój wynik: <b class="text-orange-400">${CH.mePts} pkt</b> ·
      <b class="${CH.mePos<=4?'text-emerald-400':'text-zinc-200'}">${CH.mePos}. miejsce</b>
      ${CH.mePos<=4?' — <b class="text-emerald-400">MASZ MIEJSCE W CYKLU IMŚJ2 NA KOLEJNY ROK!</b>':''} · nagroda ${zl(CH.money)}</div>`
    :'<div class="text-[11px] text-zinc-400 mb-2">Nie jechałeś w tych eliminacjach (wiek albo brak awansu z kraju).</div>'}
   ${tbl(CH.table.map((x,i)=>({...x, through:i<4})), true)}
  </div>
  <div class="grid md:grid-cols-2 gap-2">
   ${Q.quals.map(q=>`<div class="brut p-2">
     <div class="text-[11px] text-zinc-300 tracking-widest">${esc(q.title)}</div>
     <div class="text-[11px] text-zinc-400 mb-1">${esc(q.note)}</div>
     ${tbl(q.table.slice(0,10), true)}</div>`).join('')}
  </div>
 </div>`;
}
