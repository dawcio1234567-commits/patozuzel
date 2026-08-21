/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: TABELE I WYNIKI
   kpi(), tabele lig, wyniki spotkań, faza play-off
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2193-2306 oryginału).
   ============================================================ */
function kpi(l,v,c='text-zinc-100'){
 return `<div class="brut p-2.5"><div class="text-[11px] text-zinc-400 tracking-widest leading-tight">${l}</div><div class="text-xl font-extrabold ${c}">${v}</div></div>`;
}
function tableHtml(lk){
 const T=G.tables[lk]; if(!T) return '<div class="text-zinc-400 text-[11px]">brak danych</div>';
 return `<table class="w-full text-[11px]">
 <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
 <th class="text-left">#</th><th class="text-left">DRUŻYNA</th><th>M</th><th>Z</th><th>R</th><th>P</th><th>BON</th><th>PKT MAŁE</th><th>PKT</th></tr></thead><tbody>
 ${T.map((r,i)=>{
   const me = r.name===G.p.club;
   const zone = i<4?'text-emerald-400': (lk!=='KL'?'text-yellow-500':'text-zinc-200');
   return `<tr class="${me?'rowhl':''} border-b border-zinc-700/60">
   <td class="${zone} font-bold">${i+1}</td><td class="${me?'text-orange-400 font-bold':'text-zinc-200'} truncate max-w-[190px]">${esc(r.name)}</td>
   <td class="text-center text-zinc-300">${r.m}</td><td class="text-center">${r.w}</td><td class="text-center">${r.d}</td><td class="text-center">${r.l}</td>
   <td class="text-center text-sky-400">${r.bon}</td><td class="text-center text-zinc-300">${r.sf}:${r.sa}</td>
   <td class="text-center font-bold text-orange-400">${r.pts}</td></tr>`;}).join('')}
 </tbody></table>
 <div class="text-[11px] text-zinc-400 mt-1.5 tracking-wider">RUNDA ZASADNICZA · 2 pkt za wygraną · 1 pkt za remis · +1 pkt bonusowy za wygrany dwumecz &nbsp;|&nbsp; <span class="text-emerald-500">1–4 play-off</span>${lk!=='KL'?' · <span class="text-yellow-600">5–8 play-down</span>':''}</div>`;
}
function myResultsHtml(r){
 const head = r.chanceAvg!=null ? `<div class="text-[11px] mb-2 border border-zinc-700 px-2 py-1.5">
   <span class="text-zinc-400 tracking-widest">SZANSA NA SKŁAD W TRAKCIE SEZONU:</span>
   średnio <b class="text-zinc-200">${r.chanceAvg}%</b> ·
   najniżej <b class="text-red-400">${r.chanceMin}%</b> ·
   najwyżej <b class="text-emerald-400">${r.chanceMax}%</b>
   <span class="block text-zinc-400">Liczona osobno przed KAŻDĄ kolejką z realnej dyspozycji całej kadry — dlatego rośnie po dobrych meczach i spada po słabych.</span>
  </div>` : '';
 const rows=(r.lines||[]).map((m,i)=>{
  const w=m.teamFor>m.teamAgn?'text-emerald-400':m.teamFor<m.teamAgn?'text-red-500':'text-yellow-500';
  const line = m.rode
    ? `<span class="text-orange-400 font-bold">*${m.mp}</span> <span class="text-zinc-300">(${codesHtml(m.codes)})</span>`
    : `<span class="text-zinc-400">— ${m.why}${m.gap!=null?` <span class="text-zinc-400">(zabrakło ${m.gap.toFixed(1)} pkt do ostatniego numeru)</span>`
        :m.reg?' <span class="text-sky-400">(byłeś lepszy — wypchnęła cię rubryka U24)</span>':''}</span>`;
  const cash = m.rode&&m.owed ? `<span class="${m.paid>=m.owed?'text-emerald-500':m.paid>0?'text-yellow-600':'text-red-500'}">${zl(m.paid)}${m.paid<m.owed?' / '+zl(m.owed):''}</span>` : '';
  const ch = m.chance==null ? '<span class="text-zinc-600">—</span>'
    : `<span class="${m.chance>=70?'text-emerald-400':m.chance>=40?'text-yellow-500':'text-red-500'}">${m.chance}%</span>`;
  const surRow = m.sur ? `<tr class="border-b border-zinc-700/60" style="background:rgba(56,189,248,.08)">
   <td colspan="8" class="text-[11px]" style="color:#38bdf8">⚡ ${esc(m.sur.log)}</td></tr>` : '';
  return `<tr class="border-b border-zinc-700/60 ${m.rode?'':'opacity-60'}${m.walk?' bg-red-950/30':''}">
   <td class="text-zinc-400 text-[11px] whitespace-nowrap">K${m.round||i+1}</td>
   <td class="text-zinc-400 text-[11px]">${m.home?'DOM':'WYJ'}</td>
   <td class="truncate max-w-[150px] text-zinc-300">${esc(m.opp)}</td>
   <td class="text-[11px] text-right whitespace-nowrap">${ch}</td>
   <td class="text-right font-bold ${m.walk?'text-red-500':w} whitespace-nowrap">${m.walk==='void'?'—':(function(){
     const idx=(G.results[r.lk]||[]).findIndex(x=>x.round===m.round && (x.h===G.p.club||x.a===G.p.club));
     const sc=(m.home?m.teamFor+':'+m.teamAgn:m.teamAgn+':'+m.teamFor);
     return idx>=0 ? scoreBtn(m.home?m.teamFor:m.teamAgn, m.home?m.teamAgn:m.teamFor,'league',r.lk,idx,'kolejka '+m.round, m.walk?'text-red-500':w)
                   : (m.teamFor+':'+m.teamAgn);
   })()}</td>
   <td class="text-right whitespace-nowrap pl-2">${line}</td>
   <td class="text-[11px] text-zinc-400 text-right whitespace-nowrap">${m.rode&&m.num?'nr '+m.num:''}</td>
   <td class="text-[11px] text-right whitespace-nowrap pl-2">${cash}</td></tr>${surRow}`;}).join('');
 return head+`<table class="w-full text-[11px]">${rows}</table>
 <div class="text-[11px] text-zinc-400 mt-2 tracking-wide leading-relaxed">
 <span style="color:#38bdf8">⚡ niebieski wiersz</span> = nieoczekiwane zdarzenie tej kolejki (łącznie 5% szans na kolejkę, po 1% na typ) ·
 Kolejki idą chronologicznie — <b class="text-zinc-300">K1 … K14</b> · kolumna SZANSA to wyliczona przed kolejką szansa na wejście do składu ·
 kolumna NR to numer startowy z programu: <b class="text-zinc-300">gospodarz 9–15, gość 1–7</b> ·
 ostatnia kolumna to przelew z klubu za tę kolejkę (przelane / należne) ·
 <b class="text-zinc-300">*liczba</b> = twój dorobek w meczu · w nawiasie biegi po kolei ·
 <span class="text-zinc-300">3/2/1/0</span> = zdobyte punkty (0 = ostatnie miejsce, ale bieg objechany) ·
 <span class="text-sky-400">2★ / 1★</span> = ten bieg dał dodatkowo punkt bonusowy (art. 720) ·
 <span class="text-red-400">w</span> = wykluczenie · <span class="text-red-500">d</span> = defekt
 — jedno i drugie liczy się jako start (art. 720 ust. 4) ·
 <span class="text-zinc-300">-</span> = zmieniony przez rezerwę, <b class="text-zinc-300">nie liczy się jako objechany bieg</b> ·
 <span class="text-red-500">wiersz na czerwono</span> = <b class="text-zinc-300">WALKOWER</b>: spotkanie w ogóle się nie odbyło,
 a do tabeli wpisano wynik administracyjny (0:75, 75:0 albo 0:0 przy walkowerze obustronnym)</div>`;
}
/* ---- FAZA PLAY-OFF / PLAY-DOWN ---- */
function tieBox(t,club,lk,ti){
 const mine=t.a===club||t.b===club;
 const col=t.stage==='FINAŁ'?'text-orange-400':t.stage==='DWUMECZ O UTRZYMANIE'?'text-red-500'
   :t.stage==='PLAY-DOWN'?'text-yellow-500':'text-zinc-300';
 return `<div class="brut p-2.5 ${mine?'border-orange-800':''}">
  <div class="text-[11px] ${col} tracking-widest mb-1">${t.stage}${t.draw?' · BIEG DODATKOWY':''}</div>
  ${t.legs.map((L,li)=>`<div class="text-[11px]">
    <div class="flex justify-between gap-2"><span class="truncate text-zinc-300">${esc(L.h)} — ${esc(L.aw)}</span>
    <span class="text-zinc-100 font-bold whitespace-nowrap">${L.box?scoreBtn(L.hs,L.as,'po',lk,ti,li,'text-zinc-100'):(L.hs+':'+L.as)}</span></div>
    ${L.me&&L.me.starts?`<div class="text-[11px] text-right"><span class="text-zinc-300">${esc(G.p.name)}:</span>
      <span class="text-orange-400 font-bold">*${L.me.pts}</span>
      <span class="text-zinc-300">(${codesHtml(L.me.codes||[])})</span>
      ${L.me.num?`<span class="text-zinc-400"> nr ${L.me.num}</span>`:''}</div>`:''}
  </div>`).join('')}
  <div class="text-[11px] mt-1 border-t border-zinc-700 pt-1">Dwumecz <b class="text-zinc-200">${t.agA}:${t.agB}</b> ·
   awans <b class="text-emerald-400">${esc(t.winner)}</b></div>
 </div>`;
}
function phaseHtml(r){
 const ph=G.phase&&G.phase[r.lk]; if(!ph) return '';
 const club=r.club;
 const label=['MISTRZ','WICEMISTRZ','3. MIEJSCE','4. MIEJSCE','5. MIEJSCE','6. MIEJSCE','7. MIEJSCE — BARAŻ','8. MIEJSCE — SPADEK'];
 return `<div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">
   FAZA PLAY-OFF I PLAY-DOWN — ${r.leagueName}</div>
 <div class="p-3">
  ${r.po.m?`<div class="brut p-3 mb-3">
    <div class="text-[11px] text-orange-600 tracking-widest mb-1">TWÓJ DOROBEK W FAZIE PLAY-OFF (liczony osobno od rundy zasadniczej)</div>
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
      ${kpi('SPOTKANIA',r.po.m)}${kpi('BIEGI',r.po.h)}${kpi('PUNKTY',r.po.p,'text-orange-400')}
      ${kpi('BONUSOWE',r.po.b,'text-sky-400')}${kpi('DEF / WYK',r.po.d+' / '+r.po.w,'text-red-500')}${kpi('ŚREDNIA',r.po.avgTxt,'text-emerald-400')}
    </div>${r.earnedPo?`<div class="text-[11px] text-zinc-300 mt-2">Stawka play-off 150%: <b class="text-orange-400">${zl(r.earnedPo)}</b></div>`:''}</div>`
   :'<div class="text-[11px] text-zinc-400 mb-3">W fazie play-off nie pojechałeś ani jednego spotkania.</div>'}
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">${ph.ties.map((t,ti)=>tieBox(t,club,r.lk,ti)).join('')}</div>
  <div class="brut p-3">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">KLASYFIKACJA KOŃCOWA ${r.leagueName}</div>
   <table class="w-full text-[11px]">${ph.order.map((n,i)=>{
     const me=n===club, reg=G.tables[r.lk].findIndex(x=>x.name===n)+1;
     const c=i===0?'text-orange-400':i<3?'text-emerald-400':i===6?'text-yellow-500':i===7?'text-red-500':'text-zinc-300';
     return `<tr class="${me?'rowhl':''} border-b border-zinc-700/60">
       <td class="${c} font-bold w-6">${i+1}</td><td class="${me?'text-orange-400 font-bold':'text-zinc-200'} truncate max-w-[220px]">${esc(n)}</td>
       <td class="text-[11px] text-zinc-400 text-right whitespace-nowrap">runda zas. ${reg}.</td>
       <td class="text-[11px] ${c} text-right whitespace-nowrap">${label[i]}</td></tr>`;}).join('')}</table>
  </div>
 </div></div>`;
}
