/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: UPADLOSCI HISTORIA
   Zielony stolik, baraże, historia kariery
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2410-2463 oryginału).
   ============================================================ */
/* ============================================================
   UPADŁOŚCI I ZIELONY STOLIK
   NAPRAWA: ta plansza wisiała wyłącznie w zakładce PLAY-OFF (playoffHtml),
   więc informacja o zmianie nazwy klubu po bankructwie nie pojawiała się
   na głównym ekranie podsumowania i wyglądała na zgubioną. Poza tym
   funkcja czytała ŻYWE G.bankrupts, które w kolejnym roku jest nadpisywane
   — dlatego bierzemy teraz snapshot z wyniku sezonu (r.bankruptsAll /
   r.greenTable ustawiane w resolveSeason po promotionsRelegations).
   ============================================================ */
function bankruptcyBoardHtml(r){
 const B=(r&&r.bankruptsAll)||G.bankrupts||[], GT=(r&&r.greenTable)||G.greenTable||[];
 if(!B.length && !GT.length) return '';
 return `<div class="brut mt-3 border-red-900"><div class="brut-h px-3 py-1.5 text-[11px] text-red-500 font-bold">UPADŁOŚCI I ZIELONY STOLIK${r&&r.year?' — PO SEZONIE '+r.year:''}</div>
 <div class="p-3 space-y-1">
 ${B.map(b=>`<div class="border-l-2 border-red-800 pl-3 py-0.5">
   <div class="text-[11px] text-red-500 tracking-widest">SYNDYK · ${G.leagues[b.from]?G.leagues[b.from].short:''} → KLŻ</div>
   <div class="text-[11px] text-zinc-200"><b class="line-through text-zinc-300">${esc(b.old)}</b> → <b class="text-red-400">${esc(b.now)}</b></div>
   <div class="text-[11px] text-zinc-400">${esc(b.why)}</div></div>`).join('')}
 ${GT.map(m=>`<div class="border-l-2 border-emerald-800 pl-3 py-0.5">
   <div class="text-[11px] text-emerald-500 tracking-widest">ZIELONY STOLIK · ${G.leagues[m.from]?G.leagues[m.from].short:''} → ${G.leagues[m.to]?G.leagues[m.to].short:''}</div>
   <div class="text-[11px] text-zinc-200">${esc(m.club)} uzupełnia obsadę po upadłym klubie</div></div>`).join('')}
 <div class="text-[11px] text-zinc-400 pt-1">Kluby wciągnięte zielonym stolikiem nie biorą udziału w spadkach i barażach w tym samym roku.</div>
 </div></div>`;
}
function playoffHtml(){
 const r=G.last;
 if(!G.playoff||!G.playoff.length) return bankruptcyBoardHtml(r);
 return bankruptcyBoardHtml(r)+`<div class="brut mt-3"><div class="brut-h px-3 py-1.5 text-[11px] text-yellow-500 font-bold">BARAŻE O AWANS/UTRZYMANIE + RUCH MIĘDZY LIGAMI</div>
 <div class="p-3 grid md:grid-cols-2 gap-3">
 ${G.playoff.map((b,bi)=>`<div class="brut p-3">
   <div class="text-[11px] text-zinc-400 tracking-widest mb-1">${G.leagues[b.hi].short} (7.) vs ${G.leagues[b.lo].short} (2.)</div>
   ${b.legs.map((l,li)=>`<div class="text-[11px] flex justify-between gap-2"><span class="truncate text-zinc-300">${esc(l.h)} — ${esc(l.aw)}</span><span class="text-zinc-100 font-bold">${l.box?scoreBtn(l.hs,l.as,'bar',bi,li,'','text-zinc-100'):(l.hs+':'+l.as)}</span></div>`).join('')}
   <div class="text-[11px] mt-1 border-t border-zinc-700 pt-1">Dwumecz: <b class="text-zinc-200">${b.agA}:${b.agB}</b> · wygrywa <b class="text-emerald-400">${esc(b.winner)}</b></div>
 </div>`).join('')}
 </div>
 <div class="px-3 pb-3 text-[11px] space-y-0.5">
 ${G.promo.map(x=>`<div class="${x.type.startsWith('awans')?'text-emerald-400':'text-red-500'}">${x.type.toUpperCase()}: ${esc(x.club)} → ${G.leagues[x.to].short}</div>`).join('')}
 </div></div>`;
}
function historyBox(){
 const n=G.history.length;
 const body = `<div class="overflow-x-auto"><table class="w-full text-[11px]">
 <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
 <th class="text-left">ROK</th><th class="text-left">KLUB</th><th>WIEK</th><th>M</th><th>BIEGI</th><th>PKT</th><th>BON</th><th>DEF</th><th>WYK</th><th>ŚR.</th><th>POZ.</th><th class="text-left">OCENA</th></tr></thead><tbody>
 ${G.history.slice().reverse().map(h=>`<tr class="border-b border-zinc-700/60">
  <td class="text-zinc-300">${h.year}</td><td class="truncate max-w-[150px] text-zinc-200">${esc(h.club)}</td>
  <td class="text-center text-zinc-300">${h.age}</td><td class="text-center">${smM(h)}</td><td class="text-center">${smB(h)}</td>
  <td class="text-center text-orange-400 font-bold">${smP(h)}</td><td class="text-center text-sky-400">${smBon(h)}</td><td class="text-center text-red-500">${h.defectsAll!=null?h.defectsAll:h.defects}</td><td class="text-center text-red-400">${h.exclAll!=null?h.exclAll:h.exclusions}</td>
  <td class="text-center text-emerald-400">${smAvg(h)}</td><td class="text-center">${h.pos}.</td><td class="${h.grade.c} text-[11px]">${h.grade.t}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="pt-2 text-[10px] text-zinc-500">Liczby obejmują rundę zasadniczą razem z fazą play-off — tak samo jak kafelki kariery.</div>`;
 return `<div class="mb-3">${acc('HISTORIA KARIERY', body, {badge:n+' '+sezTxt(n), tone:'text-zinc-300'})}</div>`;
}
