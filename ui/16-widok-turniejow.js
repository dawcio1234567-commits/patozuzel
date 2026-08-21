/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: WIDOK TURNIEJOW
   Turnieje indywidualne i DMPJ
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2307-2409 oryginału).
   ============================================================ */
/* ---- EKRAN ZAWODÓW INDYWIDUALNYCH ---- */
function medalTxt(pos){return pos===1?'ZŁOTO':pos===2?'SREBRO':pos===3?'BRĄZ':pos+'. miejsce';}
function medalCol(pos){return pos===1?'text-yellow-400':pos===2?'text-zinc-200':pos===3?'text-amber-600':'text-zinc-300';}
function indHtml(c,r){
 if(!c) return '';
 const rounds=(c.rounds||[]).filter(x=>x.me);
 return `<div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] text-yellow-500 font-bold">
   ${esc(c.name)} ${r.year}</div>
 <div class="p-3">
  <div class="text-[11px] text-zinc-400 tracking-widest mb-3">${esc(c.sub||'')}</div>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
    ${kpi('TWOJE MIEJSCE', c.mePos?c.mePos+'.':'—', medalCol(c.mePos))}
    ${kpi('PUNKTY', c.mePts||0, 'text-orange-400')}
    ${kpi('TURNIEJE', rounds.length)}
    ${kpi('WYNIK', c.outFinal?'brak awansu':(c.mePos<=3?medalTxt(c.mePos):'bez medalu'), c.outFinal?'text-red-500':medalCol(c.mePos))}
  </div>
  ${c.outFinal?`<div class="brut p-3 mb-3 border-red-900"><div class="text-[11px] text-red-400">
    Nie awansowałeś do finału. Twój sezon w tych rozgrywkach skończył się na etapie: <b>${esc(c.stage)}</b>.</div></div>`
   :`<div class="text-[11px] text-zinc-400 mb-3">Ostatni etap z twoim udziałem: <b class="text-zinc-300">${esc(c.stage)}</b></div>`}
  ${c.podium&&c.podium.length?`<div class="brut p-3 mb-3">
   <div class="text-[11px] text-yellow-600 tracking-widest mb-1">PODIUM</div>
   ${c.podium.map((n,i)=>`<div class="text-[12px] ${medalCol(i+1)} ${n===r.pname?'font-bold':''}">${i+1}. ${esc(n)}</div>`).join('')}
  </div>`:''}
  ${c.classification?`<div class="brut p-3 mb-3">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">${esc(c.clsLabel||'KLASYFIKACJA KOŃCOWA (suma punktów z trzech turniejów finałowych, bez biegów półfinałowych)')}</div>
   <table class="w-full text-[11px]">${c.classification.map((x,i)=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
     <td class="w-6 font-bold ${i<3?medalCol(i+1):'text-zinc-400'}">${i+1}</td>
     <td class="truncate max-w-[240px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}</td>
     <td class="text-right text-zinc-300">${x.pts} pkt</td></tr>`).join('')}</table></div>`:''}
  <div class="space-y-2">
  ${rounds.map(rd=>`<div class="brut p-3">
    <div class="text-[11px] text-yellow-600 tracking-widest mb-1">${esc(rd.title)}</div>
    <div class="text-[12px] mb-2">Twój wynik: <span class="text-orange-400 font-bold">*${rd.me.pts}</span>
      <span class="text-zinc-300">(${codesHtml(rd.me.codes)})</span>
      <span class="text-zinc-400"> · miejsce ${rd.me.pos}.</span></div>
    ${rd.rows?`<table class="w-full text-[11px]">${rd.rows.slice(0,8).map(x=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
      <td class="w-6 text-zinc-400">${x.pos}</td>
      <td class="truncate max-w-[220px] ${x.me?'text-orange-400 font-bold':'text-zinc-300'}">${esc(x.name)}</td>
      <td class="text-right text-zinc-300">${x.pts}</td></tr>`).join('')}</table>`:''}
  </div>`).join('')}
  </div>
  <div class="text-[11px] text-zinc-400 mt-3 tracking-wide">Tabela 20-biegowa: 16 zawodników, po 5 startów ·
   <span class="text-zinc-300">-</span> = zero · <span class="text-red-400">w</span> = wykluczenie ·
   <span class="text-red-500">d</span> = defekt · <span class="text-zinc-300">F:</span> = bieg finałowy ·
   <b class="text-zinc-300">W TURNIEJACH INDYWIDUALNYCH NIE MA PUNKTÓW BONUSOWYCH</b> — nie ma par klubowych, więc nie ma za kogo jechać
   (punkt bonusowy z art. 720 istnieje wyłącznie w lidze).</div>
 </div></div>`;
}

/* ---- DMPJ ---- */
function dmpjHtml(r){
 const D=r.dmpj; if(!D) return '';
 const cls=D.classification, myFin=cls.indexOf(r.club);
 return `<div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-pink-500 font-bold">
   DMPJ ${r.year} — DRUŻYNOWE MISTRZOSTWA POLSKI JUNIORÓW</div>
 <div class="p-3">
 ${!D.eligible?`<div class="text-[11px] text-zinc-400 mb-3">Masz ${r.age} lat — w rozgrywkach młodzieżowych mogą startować wyłącznie krajowi zawodnicy młodzieżowi (do 21 lat). Poniżej wynik rozgrywek bez twojego udziału.</div>`
 :`<div class="brut p-3 mb-3 border-pink-900">
   ${D.skipEarly?`<div class="text-[11px] text-yellow-500 mb-2 border-l-2 border-yellow-700 pl-2">OCHRONA SPRZĘTU: masz OVR ${G.p.ovr} i regularnie jeździsz w lidze, więc trener nie zgłosił cię na eliminacje ani ćwierćfinały — tam pojechały "wkłady do kevlaru" (poziom odniesienia niżej o ${D.earlyPen} pkt). Twoje kody wyników z tych faz są puste. Dołączasz od półfinału.</div>`:''}
   <div class="text-[11px] text-pink-500 tracking-widest mb-1">TWÓJ DOROBEK W DMPJ · ${esc(r.club)} · dotarłeś do etapu: <b>${D.reached}</b></div>
   <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
     ${kpi('TURNIEJE',D.me.starts)}${kpi('BIEGI',D.me.heats)}${kpi('PUNKTY',D.me.pts,'text-orange-400')}
     ${kpi('DEF / WYK',D.me.def+' / '+D.me.exc,'text-red-500')}${kpi('ŚREDNIA',D.me.avgTxt,'text-emerald-400')}
   </div>
   ${D.me.lines.length?`<div class="mt-2 max-h-[220px] overflow-y-auto"><table class="w-full text-[11px]">
     ${D.me.lines.map(L=>`<tr class="border-b border-zinc-700/60">
       <td class="text-[11px] text-zinc-400 truncate max-w-[150px]">${esc(L.stage)}</td>
       <td class="text-[11px] text-zinc-400">R${L.round}</td>
       <td class="text-zinc-300 text-[11px] whitespace-nowrap">${L.teamPos>0?'drużyna '+L.teamPos+'. ('+L.teamHp+' pkt bieg.)':'—'}</td>
       <td class="text-right whitespace-nowrap"><span class="text-orange-400 font-bold">*${L.mp}</span>
       <span class="text-zinc-300">(${codesHtml(L.codes)})</span></td></tr>`).join('')}
   </table></div>`:'<div class="text-[11px] text-zinc-400 mt-2">Nie pojechałeś ani jednego turnieju.</div>'}
 </div>`}
 <div class="grid md:grid-cols-2 gap-3">
  <div class="brut p-3"><div class="text-[11px] text-pink-500 tracking-widest mb-1">FINAŁ DMPJ — CZTERY TURNIEJE</div>
   <table class="w-full text-[11px]">${D.finale.tab.map((t,i)=>`<tr class="${t.name===r.club?'rowhl':''} border-b border-zinc-700/60">
     <td class="${i===0?'text-pink-400':'text-zinc-300'} font-bold w-6">${i+1}</td>
     <td class="truncate max-w-[190px] ${t.name===r.club?'text-orange-400 font-bold':'text-zinc-200'}">${esc(t.name)}</td>
     <td class="text-center text-zinc-300">${t.mp} pkt mecz.</td>
     <td class="text-right text-zinc-300">${t.hp} pkt bieg.</td></tr>`).join('')}</table>
   <div class="text-[11px] text-zinc-400 mt-2">Złoto: <b class="text-pink-400">${esc(cls[0])}</b>${myFin>=0?` · twoja drużyna: <b class="text-orange-400">${myFin+1}. miejsce</b>`:''}</div>
  </div>
  ${D.myGroup?`<div class="brut p-3"><div class="text-[11px] text-pink-500 tracking-widest mb-1">TWOJA ${esc(D.myGroup.name)} ELIMINACYJNA</div>
   <table class="w-full text-[11px]">${D.myGroup.tab.map((t,i)=>`<tr class="${t.name===r.club?'rowhl':''} border-b border-zinc-700/60">
     <td class="${i<3?'text-emerald-400':'text-red-500'} font-bold w-6">${i+1}</td>
     <td class="truncate max-w-[180px] ${t.name===r.club?'text-orange-400 font-bold':'text-zinc-200'}">${esc(t.name)}</td>
     <td class="text-center text-zinc-300">${t.mp} pkt mecz.</td>
     <td class="text-right text-zinc-300">${t.hp} pkt bieg.</td></tr>`).join('')}</table>
   <div class="text-[11px] text-zinc-400 mt-1">Awans z miejsc 1–3 (plus najlepsza drużyna z 4. miejsc w całych eliminacjach).</div></div>`
  :`<div class="brut p-3"><div class="text-[11px] text-zinc-400 tracking-widest mb-1">STRUKTURA ROZGRYWEK</div>
   <div class="text-[11px] text-zinc-300 space-y-1">
    <div>ELIMINACJE — 5 grup (4–5 drużyn), po 4 rundy czwórmeczów</div>
    <div>ĆWIERĆFINAŁY — 4 grupy po 4, awans z miejsc 1–2</div>
    <div>PÓŁFINAŁY — 2 grupy po 4, awans z miejsc 1–2</div>
    <div>FINAŁ — cztery turnieje tej samej czwórki</div>
    <div class="text-[11px] text-zinc-400 pt-1">Każdy czwórmecz to <b class="text-zinc-300">24 biegi</b>: 4 drużyny po 4 juniorów,
     w każdym biegu po jednym zawodniku z drużyny, 6 startów na zawodnika. Punktacja meczowa 4 / 3 / 2 / 1 pkt wg sumy punktów
     biegowych (przy remisie dzielone po równo — art. 804 ust. 3).
     <b class="text-zinc-300">W czwórmeczu nie ma punktów bonusowych</b> — nie ma pary klubowej, za którą można finiszować.</div>
   </div></div>`}
 </div></div></div>`;
}
