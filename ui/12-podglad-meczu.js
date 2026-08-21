/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: PODGLAD MECZU
   Modal spotkania: bieg po biegu + wielki mecz w raporcie
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1760-1941 oryginału).
   ============================================================ */
/* ============================================================
   PODGLĄD MECZU — KTO ILE ZDOBYŁ I JAK SZŁY BIEGI
   ------------------------------------------------------------
   Zgłoszenie gracza: „dodaj możliwość popatrzenia na wyniki meczów ligowych
   jak i play-off/play-out; po kliknięciu w wynik powinno się zobaczyć tabelkę
   ze zdobytymi punktami przez wszystkich zawodników biorących udział w meczu
   oraz wyniki bieg po biegu". Silnik i tak liczy każdy mecz biegami (patrz
   simMeeting), więc wystarczyło przestać wyrzucać te dane do kosza: każde
   spotkanie ma teraz zamrożoną kartę meczową (M.box) i komplet biegów.
   ============================================================ */
/* ============================================================
   WIELKI MECZ — CO Z NIEGO ZOSTAŁO (patch 22.08.2026)
   Osobny boks w podsumowaniu: wynik spotkania przejechanego osobiście,
   pełny przebieg zawodów i — jeżeli tak się skończyło — notatka o płaczu.
   ============================================================ */
function bigMatchHtml(r){
 const logs=r.bigLog||[];
 if(!logs.length && !r.cryNote) return '';
 const cry = r.cryNote ? `<div class="brut mb-3" style="border-color:#dc2626">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#dc2626;color:#f87171">
     ROZPŁAKAŁEŚ SIĘ PRZED NAJWAŻNIEJSZYM MECZEM SEZONU</div>
   <div class="p-4 text-[12.5px] text-zinc-200 leading-relaxed">${esc(r.cryNote)}
   <div class="text-[11px] text-zinc-400 mt-2">Do ojca nie zadzwoniłeś. Ojciec też nie zadzwonił.</div></div></div>` : '';
 if(!logs.length) return cry;
 const box = logs.map(b=>`<div class="brut mb-2">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#f97316;color:#fb923c">
     ${esc(b.title)}${b.ind?' — TURNIEJ PRZEJECHANY OSOBIŚCIE':' — MECZ PRZEJECHANY OSOBIŚCIE'}</div>
   <div class="p-3">
    ${b.ind ? '' : `<div class="text-[20px] font-extrabold ${b.mine>b.theirs?'text-emerald-400':b.mine===b.theirs?'text-zinc-300':'text-red-400'} mb-1">
      ${b.mine}:${b.theirs}</div>`}
    ${b.me?`<div class="text-[12px] text-zinc-300 mb-2">Twój dorobek: <b class="text-orange-400">${b.me.pts}${b.me.bon?'+'+b.me.bon:''} pkt</b>
      z ${b.me.starts} startów <span class="text-zinc-500">(${(b.me.codes||[]).join(', ')||'—'})</span></div>`:''}
    ${bigVoicesHtml(b.voices)}
    ${(b.story&&b.story.length)?accLite('PRZEBIEG — BIEG PO BIEGU',
      `<div class="text-[11.5px] text-zinc-400 leading-relaxed">${b.story.map(x=>`<div class="mb-1">› ${esc(x)}</div>`).join('')}</div>`):''}
   </div></div>`).join('');
 return `<div class="mb-3">
  <div class="text-[11px] text-orange-500 tracking-[.2em] font-bold mb-2">WIELKI MECZ SEZONU</div>
  ${box}${cry}</div>`;
}
/* ============================================================
   PATO-KOMENTARZE POMECZOWE (Sprint 4, 23.08.2026)
   ------------------------------------------------------------
   Zgłoszenie: „po wielkim meczu nie ma żadnej reakcji świata".
   Racja — dostawałeś wynik i przebieg, i tyle. Teraz pod wynikiem
   siedzi zestaw głosów o TWOIM występie i o wyniku drużyny, w tej
   samej konwencji co głosy z końca sezonu (data/60-62): spiker,
   kibic z sektora B, mechanik, sędzia Lis, rzecznik klubu i ten
   jeden facet z parkingu, którego bus nigdy nie odpala.
   Kto je dobiera: bigMatchVoices() w engine/30b-live-zdarzenia.js.
   Ten sam zestaw pokazuje ekran końca meczu (ui/09c).
   ============================================================ */
function bigVoicesHtml(voices){
 if(!voices || !voices.length) return '';
 return `<div class="brut mt-2 mb-1" style="border-color:#a16207">
  <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#a16207;color:#eab308">
    CO MÓWIĄ PO TYCH ZAWODACH</div>
  <div class="p-3 space-y-2">
   ${voices.map(v=>`<div class="text-[12.5px] leading-relaxed">
     <div class="text-[10px] text-zinc-500 tracking-[.2em]">${esc(v.who)}</div>
     <div class="text-zinc-200">${esc(v.txt)}</div></div>`).join('')}
  </div></div>`;
}
/* ---- SUFIT TALENTU: co się z nim stało w tym sezonie ---- */
function potHtml(r){
 if(r.potTo==null || r.potFrom==null) return '';
 if(r.potTo===r.potFrom) return '';
 return `<div class="brut mb-3" style="border-color:#a16207">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#a16207;color:#eab308">
    SUFIT TALENTU PRZESUNIĘTY: ${r.potFrom} → ${r.potTo}</div>
  <div class="p-3">
   <div class="text-[12px] text-zinc-300 mb-2">Potencjał nie jest liczbą wylosowaną raz przy tworzeniu postaci.
     Zawodnik, który jeździ, dowozi i żyje jak zawodowiec, z roku na rok przesuwa własny sufit — o ułamek punktu,
     ale przez całą karierę robi to różnicę między ligowym średniakiem a kimś, o kim się pamięta.</div>
   ${(r.potParts||[]).map(x=>`<div class="text-[11.5px] text-zinc-300">
     <b class="text-yellow-500">+${x.d.toFixed(2)}</b> — ${esc(x.w)}</div>`).join('')}
  </div></div>`;
}

function openMatch(src, a, b, c){
 G.matchView={src, a, b, c};
 render();
}
function closeMatch(){ G.matchView=null; render(); }
function matchData(){
 const V=G.matchView; if(!V) return null;
 try{
  if(V.src==='league'){
    const row=(G.results[V.a]||[])[V.b]; if(!row) return null;
    return {h:row.h, a:row.a||row.aw, hs:row.hs, as:row.as, heats:row.heats||[], box:row.box||[],
      label:(G.leagues[V.a]?G.leagues[V.a].name:'')+' · '+V.c, walk:row.walk||null};
  }
  if(V.src==='po'){
    const t=(G.phase[V.a]&&G.phase[V.a].ties)?G.phase[V.a].ties[V.b]:null; if(!t) return null;
    const L=t.legs[V.c]; if(!L) return null;
    return {h:L.h, a:L.aw, hs:L.hs, as:L.as, heats:L.heats||[], box:L.box||[],
      label:t.stage+' · '+(V.c===0?'pierwszy mecz':'rewanż')};
  }
  if(V.src==='bar'){
    const b=(G.playoff||[])[V.a]; if(!b) return null;
    const L=b.legs[V.b]; if(!L) return null;
    return {h:L.h, a:L.aw, hs:L.hs, as:L.as, heats:L.heats||[], box:L.box||[],
      label:'BARAŻ O AWANS/UTRZYMANIE · '+(V.b===0?'pierwszy mecz':'rewanż')};
  }
 }catch(_){ return null; }
 return null;
}
function matchModalHtml(){
 const M=matchData(); if(!M) return '';
 const H=M.box.filter(x=>x.side==='h'), A=M.box.filter(x=>x.side==='a');
 const sum=arr=>arr.reduce((a,x)=>a+x.pts,0);
 const sumB=arr=>arr.reduce((a,x)=>a+(x.bon||0),0);
 const rider=x=>`<tr class="${x.me?'rowhl':''} border-b border-zinc-700/60">
   <td class="text-zinc-400 w-8 text-center">${x.num||'—'}</td>
   <td class="truncate max-w-[170px] ${x.me?'text-orange-400 font-bold':'text-zinc-200'}">${esc(x.name)}${x.me?' (TY)':''}</td>
   <td class="text-center text-zinc-400">${x.starts}</td>
   <td class="text-center font-bold text-orange-400">${x.pts}</td>
   <td class="text-center text-sky-400">${x.bon||0}</td>
   <td class="text-center font-bold text-zinc-100">${x.pts+(x.bon||0)}</td>
   <td class="text-zinc-300 text-[11px] whitespace-nowrap">${codesHtml(x.codes||[])}</td></tr>`;
 const team=(name,arr,score)=>`<div class="brut p-2">
   <div class="text-[11px] tracking-widest mb-1 flex justify-between gap-2">
     <span class="text-orange-500 font-bold truncate">${esc(name)}</span>
     <span class="text-zinc-100 font-extrabold">${score}</span></div>
   <table class="w-full text-[11px]">
    <thead><tr class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700">
     <th>NR</th><th class="text-left">ZAWODNIK</th><th>ST.</th><th>PKT</th><th>BON</th><th>RAZEM</th><th class="text-left">BIEGI</th></tr></thead>
    <tbody>${arr.map(rider).join('')}</tbody>
    <tfoot><tr class="border-t border-zinc-600">
      <td colspan="3" class="text-zinc-400 text-[11px] tracking-widest">RAZEM</td>
      <td class="text-center font-extrabold text-orange-400">${sum(arr)}</td>
      <td class="text-center font-bold text-sky-400">${sumB(arr)}</td>
      <td class="text-center font-extrabold text-zinc-100">${sum(arr)+sumB(arr)}</td><td></td></tr></tfoot>
   </table></div>`;
 /* --- BIEG PO BIEGU --- */
 let rh=0, ra=0;
 const heatRows=(M.heats||[]).map(ht=>{
   const res=ht.res||[];
   res.forEach(x=>{ if(x.side==='h') rh+=x.pts; else ra+=x.pts; });
   const cell=x=>`<span class="${x.side==='h'?'text-orange-300':'text-sky-300'}">${esc(x.name)}</span>
     <b class="${x.out?'text-red-500':'text-zinc-100'}">${x.out==='d'?'d':x.out==='w'?'w':x.pts}${x.bon?'<span class="text-sky-400">★</span>':''}</b>`;
   const ord=res.slice().sort((a,b)=> (a.out?9:0)-(b.out?9:0) || b.pts-a.pts);
   return `<tr class="border-b border-zinc-700/60">
     <td class="text-zinc-400 w-10 text-[11px]">${typeof ht.label==='number'?'B'+ht.label:esc(String(ht.label))}${ht.nominated?'<span class="text-yellow-600" title="bieg nominowany">*</span>':''}</td>
     <td class="text-[11px] leading-relaxed">${ord.map(cell).join(' <span class="text-zinc-600">·</span> ')}</td>
     <td class="text-right text-[11px] font-bold text-zinc-200 whitespace-nowrap">${rh}:${ra}</td></tr>`;
 }).join('');
 return `<div class="brut mb-3" style="border-color:#f97316">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold flex justify-between items-center gap-2" style="border-color:#f97316;color:#f97316">
    <span>PODGLĄD SPOTKANIA — ${esc(M.label||'')}</span>
    <button onclick="closeMatch()" class="btn px-2 py-0.5 text-[11px] text-zinc-300">ZAMKNIJ ✕</button></div>
  <div class="p-3">
   <div class="text-center mb-3">
     <div class="text-[12px] text-zinc-300 truncate">${esc(M.h)} — ${esc(M.a)}</div>
     <div class="text-3xl font-extrabold ${M.hs>M.as?'text-emerald-400':M.hs<M.as?'text-red-500':'text-yellow-500'}">${M.hs}:${M.as}</div>
     ${M.walk?`<div class="text-[11px] text-red-500 font-bold">WALKOWER — spotkanie nie zostało rozegrane</div>`:''}
   </div>
   <div class="grid lg:grid-cols-2 gap-2 mb-3">
     ${team(M.h,H,M.hs)}
     ${team(M.a,A,M.as)}
   </div>
   ${heatRows?`<div class="brut p-2">
     <div class="text-[11px] text-orange-600 tracking-widest mb-1">BIEG PO BIEGU</div>
     <div class="max-h-[360px] overflow-y-auto"><table class="w-full text-[11px]">${heatRows}</table></div>
     <div class="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
      Kolejność w wierszu = kolejność na mecie · <span class="text-orange-300">pomarańczowy</span> = gospodarz,
      <span class="text-sky-300">niebieski</span> = gość · <span class="text-sky-400">★</span> = punkt bonusowy w tym biegu (art. 720) ·
      <span class="text-red-500">d</span> = defekt, <span class="text-red-500">w</span> = wykluczenie ·
      <span class="text-yellow-600">*</span> przy numerze biegu = bieg nominowany (XIV/XV) · ostatnia kolumna to wynik narastająco.</div>
   </div>`:'<div class="text-[11px] text-zinc-400">Brak zapisu biegów dla tego spotkania.</div>'}
  </div></div>`;
}
/* Klikalny wynik — jeden wzorzec dla wszystkich tabel z wynikami. */
/* ------------------------------------------------------------
   NAPRAWA (21.08.2026, hotfix): KLIKNIĘCIE W WYNIK NIC NIE ROBIŁO.
   Argumenty do onclick szły przez JSON.stringify(), które opakowuje napisy
   w PODWÓJNY cudzysłów — a cały handler siedzi w atrybucie
   onclick="...". Pierwszy taki cudzysłów zamykał atrybut, więc przeglądarka
   dostawała połamany HTML i przycisk był martwy. Argumenty składamy teraz
   ręcznie, w apostrofach (liczby lecą gołe).
   ------------------------------------------------------------ */
const jsArg = v => (typeof v==='number' || v===null || v===undefined)
  ? String(v===null||v===undefined ? "''" : v)
  : "'"+String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;')+"'";
function scoreBtn(hs,as,src,a,b,c,cls){
 return `<button type="button" onclick="openMatch(${jsArg(src)},${jsArg(a)},${jsArg(b)},${jsArg(c)})"
   class="underline decoration-dotted underline-offset-2 hover:text-orange-400 cursor-pointer ${cls||''}" title="pokaż przebieg spotkania">${hs}:${as}</button>`;
}
/* ---- WSZYSTKIE WYNIKI KOLEJKI PO KOLEJCE (każda liga) ---- */
function allResultsHtml(lk){
 const RS=G.results[lk]||[];
 if(!RS.length) return '<div class="text-[11px] text-zinc-400">brak danych</div>';
 const byRound={};
 RS.forEach((row,i)=>{ (byRound[row.round]=byRound[row.round]||[]).push({row,i}); });
 const rounds=Object.keys(byRound).map(Number).sort((a,b)=>a-b);
 return `<div class="max-h-[460px] overflow-y-auto pr-1">${rounds.map(rd=>`
   <div class="mb-2">
    <div class="text-[11px] text-zinc-400 tracking-widest border-b border-zinc-700 mb-1">KOLEJKA ${rd}</div>
    ${byRound[rd].map(({row,i})=>{
      const mine = row.h===G.p.club || row.a===G.p.club;
      return `<div class="flex justify-between gap-2 text-[11px] ${mine?'text-orange-300':'text-zinc-300'}">
       <span class="truncate">${esc(row.h)} — ${esc(row.a)}</span>
       <span class="font-bold whitespace-nowrap">${scoreBtn(row.hs,row.as,'league',lk,i,'kolejka '+rd, mine?'text-orange-300':'text-zinc-100')}</span></div>`;
    }).join('')}
   </div>`).join('')}</div>`;
}
