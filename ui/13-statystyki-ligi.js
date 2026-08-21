/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: STATYSTYKI LIGI
   Klasyfikacje indywidualne lig, dziennik OVR
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1942-2016 oryginału).
   ============================================================ */
/* ============================================================
   STATYSTYKI INDYWIDUALNE LIG
   ============================================================ */
function statsTableHtml(rows, min, title, col){
 if(!rows.length) return '';
 return `<div class="brut p-2">
  <div class="text-[11px] ${col} tracking-widest mb-1">${title}</div>
  <div class="max-h-[420px] overflow-y-auto"><table class="w-full text-[11px]">
   <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
    <th class="text-left">#</th><th class="text-left">ZAWODNIK</th><th class="text-left">KLUB</th><th>W</th>
    <th>M</th><th>BIEGI</th><th>PKT</th><th>BON</th><th>ŚR.</th></tr></thead>
   <tbody>${rows.map(x=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
     <td class="${x.catPos===1?'text-yellow-400 font-bold':x.catPos&&x.catPos<=3?'text-emerald-400 font-bold':'text-zinc-400'} w-7">${x.catPos||'—'}</td>
     <td class="truncate max-w-[170px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}${x.me?' (TY)':''}</td>
     <td class="truncate max-w-[150px] text-zinc-400 text-[11px]">${esc(x.club)}</td>
     <td class="text-center text-zinc-400">${x.age}</td>
     <td class="text-center text-zinc-300">${x.m}</td>
     <td class="text-center text-zinc-300">${x.starts}</td>
     <td class="text-center text-orange-400 font-bold">${x.pts}</td>
     <td class="text-center text-sky-400">${x.bon}</td>
     <td class="text-center font-bold ${x.avg>=2?'text-emerald-400':x.avg>=1.4?'text-lime-400':'text-zinc-300'}">${x.avg.toFixed(2)}</td></tr>`).join('')}
   </tbody></table></div>
  <div class="text-[11px] text-zinc-400 mt-1">Klasyfikowani są zawodnicy z minimum <b class="text-zinc-300">${min}</b> startami. Średnia = (punkty + bonusy) ÷ biegi.</div>
 </div>`;
}
function leagueStatsHtml(r){
 const ST=r.leagueStats; if(!ST) return '<div class="brut p-3 text-[11px] text-zinc-400">Brak statystyk — w tym sezonie nie rozegrano rundy zasadniczej.</div>';
 const mine=r.myRank;
 const head = mine ? `<div class="brut p-3 mb-3 border-orange-800">
   <div class="text-[11px] text-orange-600 tracking-widest mb-1">TWOJE MIEJSCE W KLASYFIKACJI ${G.leagues[r.lk].short}</div>
   ${mine.qual && mine.pos
     ? `<div class="text-2xl font-extrabold ${mine.pos===1?'text-yellow-400':mine.pos<=3?'text-emerald-400':'text-zinc-100'}">${mine.pos}. <span class="text-sm text-zinc-400">na ${mine.n} w klasyfikacji ${mine.cat}</span></div>
        <div class="text-[11px] text-zinc-300">Średnia <b class="text-emerald-400">${mine.avg.toFixed(2)}</b> z ${mine.starts} biegów · w całej lidze (bez podziału na kategorie): ${mine.overall}. na ${mine.total}.</div>
        <div class="text-[11px] text-zinc-400 mt-1">To miejsce wchodzi do OCENY SEZONU: junior porównywany jest z juniorami, senior z seniorami — bo ta sama średnia znaczy co innego w każdej lidze i w każdym wieku.</div>`
     : `<div class="text-[12px] text-zinc-300">Za mało startów (${mine.starts}), żeby wejść do klasyfikacji — minimum ${mine.min}.</div>`}
  </div>` : '';
 return head + LKEYS.map(k=>{
   const L=ST[k]; if(!L) return '';
   const sen=L.rows.filter(x=>!x.jun), jun=L.rows.filter(x=>x.jun);
   return `<div class="brut mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">
     STATYSTYKI INDYWIDUALNE — ${G.leagues[k].name} ${r.year}${k===r.lk?' <span class="text-zinc-400">· twoja liga</span>':''}</div>
    <div class="p-2 grid lg:grid-cols-2 gap-2">
     ${statsTableHtml(sen, L.min, 'SENIORZY', 'text-zinc-300')}
     ${statsTableHtml(jun, L.min, 'JUNIORZY (U21)', 'text-pink-400')}
    </div></div>`;
 }).join('') + `<div class="text-[11px] text-zinc-400">Klasyfikacja liczona jest po RUNDZIE ZASADNICZEJ — do play-offu wchodzi tylko połowa stawki, więc doliczanie tamtych biegów robiłoby z tej tabeli loterię.</div>`;
}
/* ============================================================
   CO RUSZYŁO TWÓJ OVR
   ============================================================ */
function ovrLogHtml(r){
 const log=r.ovrLog||[], parts=r.growthParts||[];
 if(!log.length && !parts.length) return '';
 const sgn=v=>(v>0?'+':'')+v;
 const col=v=>v>0?'text-emerald-400':v<0?'text-red-400':'text-zinc-400';
 const body = `
  <div class="text-[11px] text-zinc-400 mb-2">OVR ${r.ovrFrom} → <b class="${r.ovrTo>=r.ovrFrom?'text-emerald-400':'text-red-400'}">${r.ovrTo}</b>
   ${r.ovrTo!==r.ovrFrom?`(${sgn(r.ovrTo-r.ovrFrom)})`:'(bez zmian)'}</div>
  ${log.length?`<div class="brut p-2 mb-2">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">ZDARZENIA I ZMIANY W TRAKCIE SEZONU</div>
   <ul class="text-[11px] space-y-0.5">${log.map(x=>`<li class="flex justify-between gap-2">
     <span class="text-zinc-300">${esc(x.w)}</span><b class="${col(x.d)} whitespace-nowrap">${sgn(x.d)}</b></li>`).join('')}</ul></div>`:''}
  ${parts.length?`<div class="brut p-2">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">ROZWÓJ PO SEZONIE — SKŁADNIKI (suma: ${sgn(r.growthRaw||0)} pkt przed zaokrągleniem)</div>
   <ul class="text-[11px] space-y-0.5">${parts.map(x=>`<li class="flex justify-between gap-2">
     <span class="text-zinc-300">${esc(x.w)}</span><b class="${col(x.d)} whitespace-nowrap">${sgn(x.d)}</b></li>`).join('')}</ul>
   <div class="text-[11px] text-zinc-400 mt-2 leading-relaxed">
    <b class="text-zinc-300">OTOCZENIE MA ZNACZENIE:</b> ten sam zawodnik rozwija się szybciej w klubie z dobrą atmosferą
    i pełną kasą (sprzęt na miejscu, fizjoterapeuta, tor treningowy) niż w klubie, który zalega z wypłatami i ma szatnię na noże.
    Ujemna pozycja „sufit talentu" oznacza, że jesteś już blisko swojego potencjału i każdy kolejny punkt OVR kosztuje więcej.</div>
  </div>`:''}`;
 return acc('CO WPŁYNĘŁO NA TWÓJ OVR W TYM SEZONIE', body,
   {badge:(r.ovrTo>=r.ovrFrom?'+':'')+(r.ovrTo-r.ovrFrom)+' pkt', tone:'text-sky-500'});
}
