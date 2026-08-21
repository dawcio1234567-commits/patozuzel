/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN WIELKI MECZ
   Decyzja: symuluj / jadę / rozpłacz się
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1108-1162 oryginału).
   ============================================================ */
/* ============================================================
   EKRAN: WIELKI MECZ — DECYZJA (patch 22.08.2026)
   ------------------------------------------------------------
   Trzy drogi. Dwie sportowe i jedna, po której nie ma już powrotu.
   ------------------------------------------------------------
   SPRINT 5 (24.08.2026): tego ekranu w ogóle nie zobaczy gracz, który przy
   tworzeniu kariery wybrał „NIE, PRZESYMULUJ MI WSZYSTKO" — bramka stoi
   w bigMatchAsk() (engine/28-wielki-mecz.js), więc żadna ścieżka sezonu
   nie potrafi go tu wepchnąć. Opisy trzech dróg mają klasę `.hint`
   i chowają się razem z resztą opisów w grze.
   ============================================================ */
function scBig(){
 const B=(G.pause&&G.pause.big)||{};
 const p=G.p;
 const opp = B.opp ? esc(B.opp) : null;
 const rideTxt = B.kind==='tie'
   ? 'Siadasz na motocyklu. Przed każdym swoim biegiem ustawiasz zębatkę pod tor, w parku maszyn robisz to, co uważasz za stosowne, a w biegu decydujesz co łuk: kreda, zewnętrzna, pika, obrona albo płot. Dwa spotkania, piętnaście biegów każde.'
   : 'Siadasz na motocyklu. Zębatka przed każdym swoim biegiem, decyzje co łuk, park maszyn do twojej dyspozycji. Dwadzieścia biegów tabeli, a potem biegi dodatkowe.';
 return head()+`<div class="fade">
 <div class="brut" style="border-color:#dc2626">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold blink" style="border-color:#dc2626;color:#f87171">
    NAJWAŻNIEJSZY MECZ SEZONU ${G.year}</div>
  <div class="p-5">
   <div class="text-[11px] text-zinc-500 tracking-[.25em] mb-1">${esc(B.lk?G.leagues[B.lk].name:'CYKL INDYWIDUALNY')}</div>
   <div class="text-orange-500 font-extrabold tracking-wider text-[19px] leading-tight mb-1">${esc(B.title||B.stage||'WIELKI MECZ')}</div>
   ${opp?`<div class="text-[13px] text-zinc-200 mb-3">${esc(B.myClub||'')} <span class="text-zinc-500">kontra</span> <b class="text-zinc-100">${opp}</b></div>`:''}
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-4 border-l-2 border-red-800 pl-4">${esc(B.why||'')}</div>

   <div class="text-[11px] text-zinc-500 tracking-[.2em] mb-2">CO ROBISZ</div>
   <div class="space-y-2">
    <button onclick="bigChoose('sim')" class="btn w-full text-left px-4 py-3 text-[12px]">
      <span class="text-orange-600 font-bold mr-2">1.</span><b>PRZESYMULUJ TO SPOTKANIE</b>
      <div class="hint text-[11px] text-zinc-400 mt-1 ml-6">Tak jak zawsze. Komputer liczy wszystko według silnika, ty czytasz wynik w raporcie.
      Bez ryzyka, bez zębatki, bez kartek. Twój OVR i forma robią swoje.</div></button>

    <button onclick="bigChoose('ride')" class="btn w-full text-left px-4 py-3 text-[12px]" style="border-color:#f97316">
      <span class="text-orange-600 font-bold mr-2">2.</span><b class="text-orange-400">JADĘ TO SPOTKANIE</b>
      <div class="hint text-[11px] text-zinc-400 mt-1 ml-6">${esc(rideTxt)}
      Wszystko, co robisz na torze, liczy się tym samym silnikiem co reszta sezonu — decyzje przesuwają cię o kilka punktów,
      nie zamieniają cię w innego zawodnika. Kraksa boli naprawdę: sprzęt, czasem OVR.</div></button>

    <button onclick="bigChoose('cry')" class="btn-d w-full text-left px-4 py-3 text-[12px]">
      <span class="font-bold mr-2">3.</span><b>ROZPŁAKAĆ SIĘ I NIE PRZEPROSIĆ OJCA</b>
      <div class="hint text-[11px] mt-1 ml-6" style="color:#fca5a5">Siadasz na kanapie w parku maszyn i już nie wstajesz.
      Nie dojeżdżasz sezonu do końca. Klub rozwiązuje umowę. Kara ${zl(BIGM.cryFine)}, profesjonalizm −${BIGM.cryProf},
      lojalność i atmosfera w gruzach. Materiał obejrzy dwa miliony ludzi.
      <b>Tej decyzji nie da się cofnąć.</b></div></button>
   </div>

   <div class="text-[10.5px] text-zinc-500 mt-4 leading-relaxed">
     Twój stan na dziś: OVR <b class="text-zinc-300">${p.ovr}</b> ·
     forma <b class="text-zinc-300">${p.form>0?'+':''}${p.form}</b> ·
     sprzęt <b class="text-zinc-300">${p.equip}/99</b> ·
     mechanik <b class="text-zinc-300">${p.mech}/99</b> (${esc(p.mechName)}) ·
     profesjonalizm <b class="text-zinc-300">${p.prof}</b>.
     Mechanik podpowiada zębatkę tym celniej, im więcej za niego płacisz.
   </div>
  </div>
 </div></div>`;
}
