/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN LIVE — TRENER
   Pasek relacji z trenerem, kask przy nazwisku i alert regulaminowy
   ------------------------------------------------------------
   Wydzielone z ui/09-ekran-live.js (patch 22.08.2026, Sprint 3),
   bo 09 dobił do 28 KB. Same funkcje rysujące — dane przychodzą
   gotowe z engine/31-live-mecz.js (L.coachInfo, L.refuse).
   ------------------------------------------------------------
   W index.html wpisz go PRZED 09 (albo zaraz za nim — kolejność nie ma
   znaczenia, bo to same deklaracje funkcji):
     <script src="ui/09-ekran-live.js"></script>
     <script src="ui/09b-live-trener.js"></script>          <!-- NOWE -->
   ============================================================ */
/* ============================================================
   PASEK TRENERA (Sprint 3)
   ------------------------------------------------------------
   Gracz musi widzieć TRZY rzeczy, bo z nich wynika połowa decyzji trenera
   w tym meczu: kim ten człowiek jest, co o tobie myśli (status w zespole)
   i czy właśnie nie leci z posady. Do tego licznik startów z rezerwy,
   żeby młodzieżowiec wiedział, ile mu jeszcze wolno.
   ============================================================ */
function liveCoachBar(L){
 const C=L.coachInfo; if(!C) return '';
 const relCol = C.rel>=42?'#4ade80' : C.rel>=14?'#a3e635' : C.rel>=-14?'#d4d4d8' : C.rel>=-44?'#f59e0b' : '#ef4444';
 const pressCol = C.press>=74?'#ef4444' : C.press>=55?'#eab308' : '#71717a';
 const res=C.res;
 return `<div class="brut mb-2">
  <div class="px-3 py-2 flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
   <div class="text-[11px]">
     <span class="text-zinc-500 tracking-widest">TRENER</span>
     <b class="text-zinc-200 ml-1">${esc(C.name)}</b>
     <span class="text-zinc-500">· ${esc(C.type)} · warsztat ${C.skill} · autorytet ${C.auth}</span>
   </div>
   <div class="text-[11px]">
     <span class="text-zinc-500 tracking-widest">TWÓJ STATUS</span>
     <b class="ml-1" style="color:${C.statusCol||relCol}">${esc(C.status)}</b>
     <span class="ml-1" style="color:${relCol}">(${C.rel>0?'+':''}${C.rel})</span>
     ${C.gap?`<span class="text-zinc-600"> · ${C.gap>0?'+':''}${C.gap} OVR wzgl. drużyny</span>`:''}
   </div>
   <div class="text-[11px]">
     <span class="text-zinc-500 tracking-widest">PRESJA NA TRENERZE</span>
     <b class="ml-1" style="color:${pressCol}">${C.press}/100</b>
     ${C.hot?'<span class="blink ml-1" style="color:#ef4444">GORĄCE KRZESŁO</span>':''}
   </div>
   ${res&&res.jun?`<div class="text-[11px] text-zinc-400">
     <span class="text-zinc-500 tracking-widest">REZERWA</span>
     zwykła <b class="text-zinc-200">${res.plain}/${res.plainMax}</b> ·
     taktyczna <b class="text-zinc-200">${res.tactic}/${res.tacticMax}</b></div>`:''}
  </div>
  <div class="px-3 pb-2 text-[11px] text-zinc-400 italic border-l-2 border-zinc-700 ml-3">„${esc(C.quote||'')}"</div>
 </div>`;
}
/* ============================================================
   ALERT REGULAMINOWY — „TY TO CHYBA REGULAMINU W BURDELU SIĘ UCZYŁEŚ"
   ------------------------------------------------------------
   Wchodzi zawsze, kiedy gracz poprosi trenera o coś, na co regulamin
   nie pozwala: komplet pięciu startów, wyczerpany limit rezerwy zwykłej
   młodzieżowca albo próba wejścia SENIORA za MŁODZIEŻOWCA. Nie liczymy
   wtedy żadnych procentów — trener odpowiada jednym zdaniem, a pod spodem
   stoi konkretny paragraf, żeby gracz wiedział, o co poszło.
   ============================================================ */
function liveRefuseBox(L){
 const F=L.refuse; if(!F) return '';
 return `<div class="brut mb-3 border-2" style="border-color:#dc2626;background:rgba(127,29,29,.15)">
  <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#dc2626;color:#f87171">
    TRENER${F.coach?' — '+esc(F.coach):''}</div>
  <div class="p-3">
   <div class="text-[15px] font-extrabold blink mb-1" style="color:#f87171">„${esc(F.txt)}"</div>
   <div class="text-[11.5px] text-zinc-300">${esc(F.why||'')}</div>
   <div class="text-[10.5px] text-zinc-500 mt-1">Art. 719 — rezerwa zwykła i taktyczna. Sędzia nie wpisze tego do programu,
     a trener nie będzie się o to kłócił z komisją.</div>
  </div>
 </div>`;
}
/* Kask przy nazwisku — kolor po DRUŻYNIE, nie po polu (patrz engine/12). */
function helmetDot(h){
 if(!h) return '';
 const c = h==='czerwony'?'#dc2626' : h==='niebieski'?'#2563eb' : h==='żółty'?'#eab308' : '#e4e4e7';
 return `<span title="kask ${esc(h)}" style="display:inline-block;width:9px;height:9px;border:1px solid #52525b;background:${c}"></span>`;
}
