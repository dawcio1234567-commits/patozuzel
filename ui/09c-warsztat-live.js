/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: WARSZTAT LIVE I GŁOSY PO MECZU
   Sprint 4 (23.08.2026), przebudowany w Sprincie 5 (24.08.2026).
   ------------------------------------------------------------
   Ładuje się PO ui/09:
       <script src="ui/09-ekran-live.js"></script>
       <script src="ui/09b-live-trener.js"></script>
       <script src="ui/09c-warsztat-live.js"></script>
   ------------------------------------------------------------
   Siedzą tu: liveRowBtns(), liveSetupBox(), liveTrackBox(),
   liveVoicesHtml(), liveEventScreen() i liveItwScreen().
   Wszystko woła scLive() z ui/09.
   ------------------------------------------------------------
   CO ZMIENIŁ SPRINT 5

   1. MECHANIK TYPUJE WSZYSTKO. Do tej pory „mechanik obstawia N" wisiało
      wyłącznie przy DYSZY i GAŹNIKU, więc przy DŁUGOŚCI i ZAPŁONIE gracz
      nie dostawał ŻADNEJ liczby — tylko napis „zależy od przyczepności".
      Teraz typ jest przy każdym z czterech ustawień PLUS przy zębatce,
      a trafność każdego z nich liczy się osobno z jakości mechanika.

   2. BOKS DZIAŁA OD PIERWSZEJ SEKUNDY. `L.grip` jest ustawiane już przy
      starcie zawodów (liveTrackInit w engine/28b), więc warsztat i
      podpowiedzi widać w parku maszyn PRZED pierwszym biegiem, a nie
      dopiero po wjechaniu na tor.

   3. MNIEJ MAŁEGO TEKSTU. Wszystkie akapity wyjaśniające chowamy w klasie
      `.hint` — domyślnie NIEWIDOCZNEJ (index.html). Na ekranie zostają
      same liczby i nazwy; opisy wraca jednym przyciskiem „POKAŻ OPISY"
      w nagłówku (ui/00-wspolne.js → toggleHints()).

   4. „JESTEM NIEDŹWIEDZIAKIEM". Kiedy `L.mechAuto` jest zapalone, cały
      warsztat jest ZABLOKOWANY: żaden przycisk nie działa, boks nie pulsuje,
      a na górze stoi jedna linijka, kto teraz kręci tym motocyklem.
   ============================================================ */

/* Jeden rząd przycisków ustawienia + typ mechanika. */
function liveRowBtns(L, editable, key, list, cur, ideal){
 return `<div class="flex gap-1 flex-wrap items-center">
   ${list.map((o,i)=>`<button ${editable?`onclick="liveAct('setup','${key}:${i}')"`:'disabled'}
     title="${esc(o.d||'')}"
     class="btn px-2.5 py-1.5 text-[11px] font-bold"
     style="${i===cur?'background:#f97316;color:#000;border-color:#fdba74':''}${editable?'':';opacity:.55;cursor:default'}">${i}</button>`).join('')}
   <div class="text-[11px] text-zinc-300 ml-2 leading-tight">
     <b>${esc(list[cur]?list[cur].n:'—')}</b>
     ${ideal!=null ? (ideal===cur
        ? `<span style="color:#4ade80"> — mechanik: TAK ZOSTAW</span>`
        : `<span style="color:#f87171"> — mechanik obstawia ${ideal}</span>`) : ''}
   </div></div>`;
}
function liveSetupBox(L, editable){
 const S=L.setup; if(!S) return '';
 const W=L.weather||{};
 const V=S.verdict||{t:'',c:'#a1a1aa'};
 const mw=L.mechWx||null;
 const risk = S.risk||0;
 const row=(lab, key, list, cur, hintTxt, ideal)=>`<div class="mb-2.5">
   <div class="text-[10px] text-zinc-500 tracking-widest mb-1">${lab}${hintTxt?`<span class="hint text-zinc-600 normal-case"> — ${hintTxt}</span>`:''}</div>
   ${liveRowBtns(L, editable, key, list, cur, ideal)}
 </div>`;
 return `<div class="p-3 pt-0">
  <div class="mb-3 p-2" style="border:1px dashed #52525b">
   <div class="text-[10px] text-zinc-500 tracking-widest mb-1">POWIETRZE NAD TOREM</div>
   <div class="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
     <span class="text-zinc-200">TEMPERATURA: <b style="color:${W.temp<=13?'#38bdf8':W.temp>=25?'#f97316':'#e4e4e7'}">${W.temp!=null?W.temp+'°C':'—'}</b></span>
     <span class="text-zinc-200">WILGOTNOŚĆ: <b style="color:${W.hum>=72?'#38bdf8':W.hum<=42?'#f59e0b':'#e4e4e7'}">${W.hum!=null?W.hum+'%':'—'}</b></span>
     <span class="text-zinc-400 text-[11px]">${esc(W.wind||'')}</span>
   </div>
   <div class="hint text-[11px] text-zinc-400 mt-1 leading-relaxed">
     Zimne i suche powietrze jest GĘSTE — więcej tlenu w cylindrze, więc <b class="text-zinc-200">dysza musi być bogatsza</b>.
     Ciepłe i wilgotne jest rzadkie — <b class="text-zinc-200">dysza uboższa</b>, bo inaczej silnik się zaleje.
     Gaźnik idzie za samą wilgotnością, długość i zapłon za stanem toru. Silnik to sprawdza i nie udaje, że nie widzi.
   </div>
  </div>
  ${row('DYSZA (0-5)','jet',SETUPB.jet,S.jet,'zależy od TEMPERATURY i WILGOTNOŚCI', mw?mw.jet:null)}
  ${row('GAŹNIK — igła (0-3)','carb',SETUPB.carb,S.carb,'zależy od WILGOTNOŚCI', mw?mw.carb:null)}
  ${row('DŁUGOŚĆ MOTOCYKLA (0-3)','len',SETUPB.len,S.len,'zależy od PRZYCZEPNOŚCI TORU', mw?mw.len:null)}
  ${row('ZAPŁON (0-3)','ign',SETUPB.ign,S.ign,'zależy od PRZYCZEPNOŚCI TORU', mw?mw.ign:null)}
  <div class="text-[12px] font-bold mt-2" style="color:${V.c}">${esc(V.t)}</div>
  ${mw?`<div class="text-[12px] text-zinc-200 mt-2 border-l-2 border-zinc-600 pl-3">
    <b class="text-zinc-400">${esc(G.p.mechName)}:</b> ${esc(mw.txt)}
    ${mw.txtTrack?`<div class="hint text-[12px] text-zinc-300 mt-1">${esc(mw.txtTrack)}</div>`:''}
    <div class="hint text-[10px] text-zinc-500 mt-0.5">Trafność jego typu: ok. <b>${mw.acc}%</b> — i liczona jest OSOBNO dla
      zębatki, dyszy, gaźnika, długości i zapłonu. Kiepski mechanik potrafi trafić jedno i spudłować resztę.</div></div>`:''}
  <div class="mt-3 pt-2 text-[11.5px] leading-relaxed" style="border-top:1px solid #3f3f46">
   ${!S.done
     ? `<span style="color:#4ade80"><b>PIERWSZE USTAWIENIE — 0% RYZYKA.</b></span>
        <span class="hint"> Park maszyn stoi otwarty, nikt nikogo nie goni. Ustaw teraz wszystko, co chcesz ustawić.</span>`
     : `<span style="color:${S.dirty?'#f87171':'#a1a1aa'}"><b>RYZYKO „DWÓCH MINUT": ${risk}%</b></span>
        ${S.dirty?'<b style="color:#fca5a5"> — sprzęt już ruszony w tym biegu.</b>':'<span class="text-zinc-500"> — w tym biegu nic nie ruszano.</span>'}
        <span class="hint"> Tyle szans, że mechanik nie zdąży i sędzia zamknie temat kodem „w" w tym biegu.
        Liczy się z jakości mechanika (${esc(G.p.mechName)}), od 0,5% u sztabu jak u mistrza świata do 5% u szwagra.
        ${S.changes?`Zmian w tych zawodach: ${S.changes}.`:''}</span>`}
  </div>
 </div>`;
}
/* Tor + zębatka + mechanik + warsztat — pasek widoczny w parku maszyn i w biegu. */
function liveTrackBox(L, editable){
 if(L.grip==null) return '';
 /* SPRINT 5: oddany sprzęt = warsztat martwy. Nie pulsuje, nie klika się,
    a gracz widzi jedno zdanie, dlaczego. */
 const auto = !!L.mechAuto;
 const ed   = !!editable && !auto;
 const fitCol = L.ideal!=null ? (L.fit<=0?'#22c55e':L.fit===1?'#84cc16':L.fit===2?'#eab308':'#ef4444') : '#71717a';
 const mechGear = (L.mech && L.mech.sug!=null) ? L.mech.sug : null;
 return `<div class="brut mb-3 ${ed?'pulse-hot':''}" style="border-color:${auto?'#52525b':'#f97316'}">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold tracking-widest flex justify-between items-center gap-2"
       style="border-color:${auto?'#52525b':'#f97316'};color:${auto?'#a1a1aa':'#fb923c'}">
    <span class="${ed?'pulse-txt':''}">⚙ TOR I MOTOCYKL${auto?' — PROWADZI MECHANIK':' — WARSZTAT'}</span>
    ${ed?`<span class="text-[10px]" style="color:#fdba74">USTAW SPRZĘT, ZANIM WYJEDZIESZ</span>`:''}
  </div>
  ${auto?`<div class="px-3 py-2 text-[11.5px]" style="color:#a1a1aa;border-bottom:1px solid #3f3f46">
    <b class="text-zinc-300">JESTEŚ NIEDŹWIEDZIAKIEM I ZOSTAWIŁEŚ USTAWIENIA STAREMU.</b>
    ${esc(G.p.mechName)} kręci wszystkim sam do końca tych zawodów.
    <div class="hint mt-1">Ty nie ruszasz ani zębatki, ani dyszy, ani gaźnika, ani długości, ani zapłonu.
    Mechanik ustawia motocykl przed każdym twoim biegiem tak dobrze, jak umie (${G.p.mech}/99) —
    a jeżeli zrobi to w trakcie zawodów, ryzyko „dwóch minut" obowiązuje dokładnie tak samo jak przy zmianach ręcznych.</div>
  </div>`:''}
  <div class="p-3">
   <div class="flex justify-between items-baseline flex-wrap gap-2 mb-1">
     <div class="text-[13px] font-extrabold text-orange-400">PRZYCZEPNOŚĆ: ${esc(L.grip.n)}</div>
     <div class="hint text-[10px] text-zinc-500 tracking-widest">stan toru zmienia się co bieg</div>
   </div>
   <div class="hint text-[11.5px] text-zinc-300 leading-relaxed mb-3">${esc(L.grip.d)}</div>
   <div class="text-[10px] text-zinc-500 tracking-widest mb-1 mt-2">ZĘBATKA (0-5)</div>
   <div class="flex gap-1 flex-wrap mb-2 items-center">
     ${[0,1,2,3,4,5].map(i=>`<button ${ed?`onclick="liveAct('gear',${i})"`:'disabled'}
       class="btn px-3 py-2 text-[12px] font-bold"
       style="${i===L.gear?'background:#f97316;color:#000;border-color:#fdba74':''}${ed?'':';opacity:.55;cursor:default'}">${i}</button>`).join('')}
     <div class="text-[11px] text-zinc-300 self-center ml-2 leading-tight">
       <b>${esc((BIGM.gearTxt[L.gear]||'').split('—')[0].trim()||String(L.gear))}</b>
       ${mechGear!=null ? (mechGear===L.gear
          ? `<span style="color:#4ade80"> — mechanik: TAK ZOSTAW</span>`
          : `<span style="color:#f87171"> — mechanik obstawia ${mechGear}</span>`) : ''}
       <div class="hint text-zinc-500">${esc(BIGM.gearTxt[L.gear]||'')}</div>
     </div>
   </div>
   ${L.ideal!=null
     ? `<div class="text-[11.5px] font-bold" style="color:${fitCol}">PODEJRZANE U RYWALA: dziś jedzie zębatka <b>${L.ideal}</b> — ${esc(BIGM.fitTxt[L.fit])}.</div>`
     : `<div class="hint text-[11px] text-zinc-500">Idealnej zębatki nie widzisz. Widzisz tor i mechanika.</div>`}
   ${L.mech?`<div class="text-[12px] text-zinc-200 mt-2 border-l-2 border-zinc-600 pl-3">
     <b class="text-zinc-400">${esc(G.p.mechName)}:</b> ${esc(L.mech.txt)}
     <div class="hint text-[10px] text-zinc-500 mt-0.5">trafność podpowiedzi tego mechanika: ok. ${L.mech.acc}%</div></div>`:''}
  </div>
  ${liveSetupBox(L, ed)}
 </div>`;
}
/* --- PATO-KOMENTARZE POMECZOWE (Sprint 4) --- */
function liveVoicesHtml(voices, title){
 if(!voices || !voices.length) return '';
 return `<div class="brut mb-3" style="border-color:#a16207">
  <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#a16207;color:#eab308">
    ${esc(title||'CO MÓWIĄ PO TYCH ZAWODACH')}</div>
  <div class="p-3 space-y-2">
   ${voices.map(v=>`<div class="text-[12.5px] leading-relaxed">
     <div class="text-[10px] text-zinc-500 tracking-[.2em]">${esc(v.who)}</div>
     <div class="text-zinc-200">${esc(v.txt)}</div></div>`).join('')}
  </div></div>`;
}

/* --- EKRAN ZDARZENIA W TRAKCIE ZAWODÓW (Sprint 4) --- */
function liveEventScreen(L){
 const E=L.mevent||{};
   return `
   <div class="brut mb-3" style="border-color:#a16207">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#a16207;color:#eab308">
      COŚ SIĘ DZIEJE W PARKU MASZYN</div>
    <div class="p-4">
     <div class="text-[14px] font-extrabold text-zinc-100 mb-2">${esc(E.t||'')}</div>
     <div class="text-[12.5px] text-zinc-200 leading-relaxed mb-4">${esc(E.d||'')}</div>
     <div class="space-y-2">
      ${(E.opts||[]).map(o=>`<button onclick="liveAct('mevent','${o.id}')" class="btn w-full text-left px-3 py-2 text-[12px]">
        <b>${esc(o.l)}</b>
        <div class="hint text-[10.5px] text-zinc-400 mt-0.5">${esc(o.d||'')}</div></button>`).join('')}
     </div>
    </div></div>`;
}
/* --- EKRAN WYWIADU: przed zawodami, w trakcie i po (Sprint 4/5) --- */
function liveItwScreen(L){
 const I=L.itw||{};
   const whenTxt = I.when==='pre'?'WYWIAD PRZED ZAWODAMI'
                 : I.when==='mid'?'WYWIAD W TRAKCIE ZAWODÓW' : 'WYWIAD PO ZAWODACH';
   return `
   <div class="brut mb-3" style="border-color:#38bdf8">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#38bdf8;color:#7dd3fc">
      ${whenTxt} — ${esc(I.who||'')}</div>
    <div class="p-4">
     ${I.stage==='ask' ? `
       <div class="text-[12.5px] text-zinc-200 leading-relaxed mb-4">${esc(I.intro||'')}
       <div class="hint text-[11px] text-zinc-400 mt-2">Zapowiada ${I.n||3} pytania i tym razem nie kłamie.
       <b class="text-zinc-300">To jedyny wywiad w tych zawodach</b> — cokolwiek wybierzesz, drugi raz nikt cię dziś nie zaczepi.</div></div>
       <div class="space-y-2">
        <button onclick="liveAct('itwyes')" class="btn w-full text-left px-3 py-2 text-[12px]">
          <b>WEŹ UDZIAŁ</b>
          <div class="hint text-[10.5px] text-zinc-400 mt-0.5">Trzy pytania. Każda odpowiedź coś rusza: profesjonalizm, medialność
          albo twoją głowę na kolejny bieg. Nie ma tu bezpiecznej opcji, jest tylko wybór, czym płacisz.</div></button>
        <button onclick="liveAct('itwno')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
          <b>ODMÓW</b>
          <div class="hint text-[10.5px] mt-0.5" style="color:#fca5a5">Cisza jest tania: trochę profesjonalizmu w górę, medialność w dół,
          a głowa zostaje przy motocyklu. Dziennikarz zapisze „odmówił" i to też się kiedyś odezwie.</div></button>
       </div>`
     : `
       <div class="text-[10px] text-zinc-500 tracking-[.25em] mb-2">PYTANIE ${(I.i||0)+1} z ${I.n||3}</div>
       <div class="text-[13.5px] text-zinc-100 leading-relaxed mb-4">${esc(I.q||'')}</div>
       <div class="space-y-2">
        ${(I.opts||[]).map(o=>`<button onclick="liveAct('itwq','${o.id}')" class="btn w-full text-left px-3 py-2 text-[12px]">
          ${esc(o.l)}</button>`).join('')}
       </div>`}
    </div></div>`;
}
