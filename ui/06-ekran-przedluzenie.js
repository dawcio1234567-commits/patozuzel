/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN PRZEDLUZENIE
   Propozycja przedłużenia w trakcie umowy
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 970-1031 oryginału).
   ============================================================ */
/* ============================================================
   EKRAN: PRZEDŁUŻENIE KONTRAKTU W TRAKCIE UMOWY („ONE-CLUB MAN")
   Pojawia się PO sezonie, mimo trwającego kontraktu, jeśli lojalność
   przekroczyła 70, a sezon się obronił. Klub sam wychodzi z dłuższą
   i lepiej płatną umową — inaczej zbudowanie kariery w jednych barwach
   było niemożliwe, bo okienko transferowe otwiera się dopiero po wygaśnięciu.
   ============================================================ */
let _renew=null;
function scRenew(){
 const o=_renew, p=G.p;
 if(!o){ G.screen='hub'; return scHub(); }
 const up=Math.round((o.rate/Math.max(1,o.oldRate)-1)*100);
 return head()+`<div class="fade">
 ${playerStrip()}
 <div class="brut border-orange-800">
  <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">PROPOZYCJA PRZEDŁUŻENIA — ${esc(o.club)} · ${G.leagues[o.lk].short}</div>
  <div class="p-5">
   <div class="text-orange-500 font-extrabold tracking-wider text-[15px] mb-3">PREZES CHCE ZWIĄZAĆ CIĘ Z KLUBEM NA DŁUŻEJ</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-4 border-l-2 border-orange-900 pl-4">
    Umowa biegnie jeszcze <b class="text-zinc-100">${o.oldYears} ${lataTxt(o.oldYears)}</b>, ale po sezonie ze średnią
    <b class="text-zinc-100">${o.avg.toFixed(2)}</b> i przy twojej lojalności (<b class="text-zinc-100">${p.loyalty}/100</b>)
    klub nie chce czekać do okienka. Na stole leży nowy papier: dłuższy i lepiej płatny.
    Sektor B już wie, że rozmawiacie.
   </div>
   <div class="grid sm:grid-cols-2 gap-3 mb-4">
    <div class="brut p-3">
     <div class="text-[11px] text-zinc-400 tracking-widest mb-1">OBECNA UMOWA</div>
     <div class="text-[12px] text-zinc-300">${p.contract.type}</div>
     <div class="text-[12px] text-zinc-300">${zl(o.oldRate)} za punkt</div>
     <div class="text-[12px] text-zinc-300">jeszcze ${o.oldYears} ${lataTxt(o.oldYears)}</div>
    </div>
    <div class="brut p-3 border-orange-800">
     <div class="text-[11px] text-orange-500 tracking-widest mb-1">NOWA UMOWA</div>
     <div class="text-[12px] text-zinc-100">${o.type}</div>
     <div class="text-[12px] text-orange-400 font-bold">${zl(o.rate)} za punkt <span class="text-[11px] ${up>=0?'text-emerald-400':'text-red-400'}">(${up>=0?'+':''}${up}%)</span></div>
     <div class="text-[12px] text-zinc-100">${o.years} ${lataTxt(o.years)} — do końca sezonu ${G.year+o.years-1}</div>
     <div class="text-[12px] text-zinc-300">premia co sezon: ${o.bonus?zl(o.bonus):'—'}</div>
    </div>
   </div>
   ${o.ratingParts?`<details class="mb-4 border border-zinc-700">
    <summary class="cursor-pointer px-3 py-1.5 text-[11px] text-zinc-300 tracking-widest select-none">
      ILE JESTEŚ WART NA RYNKU: <b class="text-orange-400">${Math.round(o.rating)}</b>
      <span class="text-zinc-400">· poziom tego klubu: ${o.ovr} · sprawdź, zanim podpiszesz w ciemno</span></summary>
    <ul class="px-3 py-2 text-[11px] space-y-0.5 border-t border-zinc-700">${o.ratingParts.map(deltaLine).join('')}</ul>
   </details>`:''}
   <div class="text-[11px] text-zinc-400 mb-4 border border-zinc-700 px-3 py-2 leading-relaxed">
    PODPISUJĘ: +14 lojalności, +2 profesjonalizmu, premia za podpis od ręki — i zamknięte okienko na
    ${o.years} ${lataTxt(o.years)}. Kariera w jednych barwach robi się realna, ale rynku nie zobaczysz.<br>
    ODMAWIAM: -8 lojalności, stara umowa biegnie dalej, a na rynek wyjdziesz dopiero, gdy wygaśnie.
   </div>
   <div class="flex gap-2 flex-wrap">
    <button onclick="doRenew(1)" class="btn px-6 py-3 font-extrabold tracking-widest text-orange-500">PODPISUJĘ NA ${o.years} ${lataTxt(o.years).toUpperCase()} &gt;</button>
    <button onclick="doRenew(0)" class="btn-d px-6 py-3 font-bold tracking-widest text-red-400">DZIĘKUJĘ, ZOSTAJĘ PRZY STAREJ</button>
   </div>
  </div>
 </div></div>`;
}
function doRenew(yes){
 if(yes && _renew) acceptRenew(_renew); else declineRenew();
 _renew=null; G.screen='hub'; render();
}
