/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN TWORZENIA
   Ekran startowy: klasa postaci, changelog, info o becie
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 184-254 oryginału).
   ------------------------------------------------------------
   SPRINT 5 (24.08.2026): doszedł TRZECI WYBÓR NA STARCIE KARIERY —
   czy gra ma w ogóle proponować JAZDĘ NA ŻYWO w najważniejszym meczu
   sezonu. Wybór ląduje w `G.opts.liveMatches` (engine/03-stan-gry.js)
   i czyta go bigMatchAsk() w engine/28-wielki-mecz.js. Zmienia się go
   raz, przy zakładaniu postaci — bo to decyzja o tym, CZYM ta gra dla
   ciebie jest: symulatorem kariery czy symulatorem kariery z żużlem.
   ============================================================ */
/* ---- EKRAN: TWORZENIE ---- */
function scCreate(){
 return head()+`<div class="fade">
 <div class="brut mb-4"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">TWORZENIE ZAWODNIKA // WIEK STARTOWY: 16 LAT</div>
 <div class="p-4 space-y-4">
   <div><label class="block text-[11px] text-zinc-300 tracking-widest mb-1">IMIĘ I NAZWISKO</label>
   <div class="flex gap-2 flex-wrap items-center">
     <input id="pname" maxlength="28" value="${esc(suggestName())}" class="w-full sm:w-96">
     <button onclick="rollName()" class="btn px-3 py-2 text-[11px] font-bold tracking-widest text-orange-500">LOSUJ</button>
   </div>
   <div class="text-[11px] text-zinc-400 mt-1">Propozycja jest losowana z puli imion i nazwisk. Możesz ją nadpisać własną.</div></div>
   <div><label class="block text-[11px] text-zinc-300 tracking-widest mb-2">KLASA POSTACI</label>
   <div class="grid sm:grid-cols-2 gap-2">
   ${CLASSES.map(c=>`<label class="brut p-3 cursor-pointer hover:border-orange-600 block">
     <div class="flex items-start gap-2"><input type="radio" name="cls" value="${c.id}" ${c.id==='bez'?'checked':''} class="mt-1 accent-orange-500">
     <div><div class="font-bold text-zinc-100">${c.n}</div>
     <div class="text-[11px] text-orange-600 tracking-widest">OVR ${c.ovr[0]}–${c.ovr[1]}</div>
     <div class="text-[11px] text-zinc-300 mt-1">${c.d}</div></div></div></label>`).join('')}
   </div></div>

   <div><label class="block text-[11px] text-zinc-300 tracking-widest mb-2">CZY CHCESZ SAM JEŹDZIĆ NAJWAŻNIEJSZE MECZE?</label>
   <div class="grid sm:grid-cols-2 gap-2">
     <label class="brut p-3 cursor-pointer hover:border-orange-600 block">
       <div class="flex items-start gap-2"><input type="radio" name="livemode" value="1" checked class="mt-1 accent-orange-500">
       <div><div class="font-bold text-zinc-100">TAK, SIADAM NA MOTOCYKLU</div>
       <div class="text-[11px] text-orange-600 tracking-widest">RAZ W SEZONIE GRA SIĘ ZATRZYMUJE</div>
       <div class="hint text-[11px] text-zinc-300 mt-1">Przed najważniejszym spotkaniem roku dostajesz wybór: przesymulować,
       pojechać samemu albo rozpłakać się w parku maszyn. Jazda na żywo to park maszyn, warsztat (zębatka, dysza, gaźnik,
       długość, zapłon), decyzje co łuk, kartki, wywiady i kraksy, które bolą naprawdę.</div></div></div></label>
     <label class="brut p-3 cursor-pointer hover:border-orange-600 block">
       <div class="flex items-start gap-2"><input type="radio" name="livemode" value="0" class="mt-1 accent-orange-500">
       <div><div class="font-bold text-zinc-100">NIE, PRZESYMULUJ MI WSZYSTKO</div>
       <div class="text-[11px] text-orange-600 tracking-widest">JEDNO KLIKNIĘCIE = JEDEN SEZON</div>
       <div class="hint text-[11px] text-zinc-300 mt-1">Gra nigdy nie zapyta cię o wielki mecz i nigdy nie pokaże ekranu jazdy.
       Wszystkie spotkania — z finałem włącznie — liczy silnik, a ty czytasz wyniki w raporcie sezonu.
       Cała reszta kariery (kontrakty, zdarzenia, trenerzy, zima, karta kariery) działa bez zmian.</div></div></div></label>
   </div>
   <div class="hint text-[11px] text-zinc-400 mt-2 border-l-2 border-zinc-700 pl-3">Tego wyboru dokonujesz raz, na starcie kariery.</div></div>
   <div class="text-[11px] text-zinc-400 border-l-2 border-zinc-700 pl-3">
   Startujesz na kontrakcie <b class="text-zinc-300">amatorskim</b>: darmowy sprzęt klubowy, grosze za punkty, zero kasy za podpis.<br>
   Budżet: 0 zł &nbsp;·&nbsp; Sprzęt: 20 &nbsp;·&nbsp; Profesjonalizm i Medialność: ukryte, zależne od klasy.</div>
   <button onclick="doCreate()" class="btn px-6 py-2.5 font-bold tracking-widest text-orange-500">ZACZYNAM KARIERĘ &gt;</button>
 </div></div>
 ${infoBox()}
 ${changelogBox()}
 </div>`;
}
/* ---- EKRAN TYTUŁOWY: ZGŁASZANIE BŁĘDÓW I ZASTRZEŻENIE ---- */
function infoBox(){
 return `<div class="brut mb-4" style="border-color:#a16207">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#a16207;color:#eab308">
    INFORMACJE // OSTATNI UPDATE: ${GAME_UPDATE}</div>
  <div class="p-4 space-y-2 text-[12px] text-zinc-200 leading-relaxed">
   <div><b style="color:#eab308">Wszelkie bugi proszę zgłaszać, oznaczając profil twórcy
     <span class="text-zinc-100">${GAME_X}</span> na X.</b></div>
<div><b style="color:#eab308">Gra jest w wersji beta. Od patcha 21.08.2026 w grze jeżdżą już Indywidualne Mistrzostwa Świata (z eliminacjami krajowymi, Challenge i Mistrzostwami Europy), Indywidualne Mistrzostwa Świata Juniorów, pełny cykl ośmiu Turniejów Szkoleniowych i Puchar PALET. Wciąż brakuje m.in. rozgrywek reprezentacyjnych — będą dodawane sukcesywnie w updateach.
   <div class="text-zinc-300">Podobieństwo do wszelkich wydarzeń, nazwisk i klubów do rzeczywistości jest przypadkowe.</div>
   <div class="text-[11px] text-zinc-400">Ostatni update: <b class="text-zinc-300">${GAME_UPDATE}</b></div>
  </div></div>`;
}
/* ---- EKRAN TYTUŁOWY: CHANGELOG ---- */
function changelogBox(){
 if(typeof CHANGELOG==='undefined' || !CHANGELOG.length) return '';
 return `<div class="brut mb-4">
  <div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">CHANGELOG — CO SIĘ ZMIENIŁO</div>
  <div class="p-3 space-y-3">
   ${CHANGELOG.map((c,i)=>`<details ${i===0?'open':''} class="border border-zinc-700">
     <summary class="cursor-pointer px-3 py-1.5 text-[11px] tracking-widest text-orange-400 select-none">
       ${esc(c.v)} — ${esc(c.t)}</summary>
     <ul class="px-3 py-2 text-[11px] text-zinc-300 space-y-1 border-t border-zinc-700">
       ${c.l.map(x=>'<li>› '+esc(x)+'</li>').join('')}</ul>
   </details>`).join('')}
  </div></div>`;
}
/* Przelosowanie propozycji bez przeładowania całego ekranu (radio klasy postaci
   i tak zostaje tam, gdzie było). */
function rollName(){
 const el=document.getElementById('pname'); if(el) el.value=suggestName();
}
function doCreate(){
 const n=document.getElementById('pname').value.trim()||'Bezimienny Grajek';
 const c=document.querySelector('input[name=cls]:checked').value;
 /* SPRINT 5: tryb rozgrywki idzie do G.opts, nie do zawodnika — bo dotyczy
    całej kariery, także tej po zmianie klubu, kontuzji i przerwie zimowej. */
 const lm=document.querySelector('input[name=livemode]:checked');
 if(typeof setGameOpt==='function') setGameOpt('liveMatches', !lm || lm.value==='1');
 G.p=newPlayer(n,c);
 genAllSquads();
 worldInit();                       // reszta świata (cykl IMŚ) rodzi się razem z nową karierą
 ensureSgpSeed();                   // pierwszy skład Grand Prix — zanim ruszy pierwszy sezon
 const meR=makeRider(G.p.age, G.p.ovr); meR.me=true; meR.name=G.p.name; G.riders.push(meR);
 G.screen='sign'; render();
}
