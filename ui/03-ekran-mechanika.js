/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN MECHANIKA
   Rok w warsztacie zamiast na torze
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 505-615 oryginału).
   ============================================================ */
/* ============================================================
   „PIERDOLĘ, IDĘ ROBIĆ ZA MECHANIKA"
   Rok poza torem, ale nie na kanapie: przewijamy sezon (liga żyje dalej),
   zerujemy lojalność i rzucamy kością 5/95.
   ============================================================ */
function mechanicPath(){
 const p=G.p, y=G.year;
 // świat leci dalej: budżety, gospodarka klubów, starzenie się kadr
 allClubs().forEach(clubSeasonBudget);
 clubEconomy();
 ageRiders();
 applyPendingSponsors();                  // nowe szyldy sponsorskie wchodzą i tak
 // etat mechanika: jakaś pensja jest, koszty życia też
 const wage=R(38000,62000), live=livingCostOf(p,true);
 p.budget += wage-live;
 p.loyalty=0;
 p.idleLog=p.idleLog||[];
 /* Rok poza torem to też rok rehabilitacji — długa kontuzja tyka dalej. */
 if((p.longInjury||0)>0){ p.longInjury--; if(!p.longInjury) p.longInjuryWhy=''; }
 const alim = chargeAlimony(p);
 const M={year:y, wage, live, good:false, head:'', rows:[], alimony:alim};
 if(chance(5)){
   /* 5% — TRAFIŁEŚ DO WŁAŚCIWEGO WARSZTATU */
   const o0=p.ovr, e0=p.equip, m0=p.med, f0=p.prof;
   p.ovr   = cl(p.ovr+10,1,99);
   p.equip = 99;
   p.med   = 0;
   p.prof  = cl(p.prof+6,0,99);
   p.keepEquip = true;                    // ten sprzęt zabierasz ze sobą do nowego klubu
   p.mechPath  = 'nicki';
   M.good=true;
   M.head='ZROZUMIAŁEŚ ŻUŻEL U NICKIEGO';
   M.lead='Rok przy stole warsztatowym u człowieka, który silnik składa jak zegarek. Pierwsze trzy miesiące '+
          'podawałeś klucze. Potem zacząłeś rozumieć, dlaczego to wszystko jedzie — albo nie jedzie.';
   M.rows=[['OVR (umiejętności)', o0+' → '+p.ovr, '+10', true],
           ['SPRZĘT', e0+' → '+p.equip, '+'+(p.equip-e0)+' — i ten sprzęt zabierasz ze sobą', true],
           ['PROFESJONALIZM', f0+' → '+p.prof, '+'+(p.prof-f0), true],
           ['MEDIALNOŚĆ', m0+' → '+p.med, 'przez rok nikt o tobie nie napisał ani słowa', false]];
 } else {
   /* 95% — MYŁEŚ PANCERZE */
   const o0=p.ovr, e0=p.equip, f0=p.prof;
   p.ovr   = cl(p.ovr-4,1,99);
   p.prof  = cl(p.prof-10,0,99);
   p.equip = cl(p.equip-6,1,99);
   p.next.forceClub = 'weak';             // zostaje ci najniższa liga
   p.mechPath = 'pancerze';
   M.good=false;
   M.head='MYŁEŚ PANCERZE W KLŻ';
   M.lead='Myjka, opony, plandeka, powrót do domu o czwartej rano. Kierownik drużyny nie zapamiętał '+
          'twojego nazwiska, choć wołał cię co weekend.';
   M.rows=[['OVR (umiejętności)', o0+' → '+p.ovr, '-'+(o0-p.ovr)+' — rok bez motocykla', false],
           ['PROFESJONALIZM', f0+' → '+p.prof, '-'+(f0-p.prof), false],
           ['SPRZĘT', e0+' → '+p.equip, '-'+(e0-p.equip)+' — rdzewiał w garażu', false],
           ['KONTRAKT NA PRZYSZŁY ROK', 'KLŻ', 'zostaje ci wyłącznie najniższa liga', false]];
 }
 p.idleLog.unshift(y+': '+M.head+'. Zarobek na etacie: '+zl(wage)+', koszty życia: '+zl(live)+'.');
 if(p.idleLog.length>4) p.idleLog.pop();
 p.idleYears=(p.idleYears||0)+1;
 p.age++; G.year++;
 syncMeRider();
 if(p.banSeasons>0) p.banSeasons--;
 /* Wyrok o końcu kariery ZAPADA TERAZ, ale gracz najpierw musi zobaczyć,
    co wyszło z roku w warsztacie. Dlatego trzymamy powód i pokazujemy go
    na ekranie wyniku razem z przyciskiem OK. */
 M.retire = retireCheck(p) ||
   (p.idleYears>=3 ? 'Trzy lata poza torem. Zostałeś w parku maszyn na stałe — po drugiej stronie plandeki.' : null);
 G.mech=M; G.screen='mech'; render();
}
/* ---- EKRAN: WYNIK ROKU W WARSZTACIE ---- */
function scMech(){
 const M=G.mech;
 if(!M){ _offers=[]; G.screen='sign'; return scSign(); }
 const col = M.good ? '#22c55e' : '#eab308';
 return head()+`<div class="fade">
 <div class="brut" style="border-color:${col}">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:${col};color:${col}">
    ROK ${M.year} // ETAT MECHANIKA — CO Z TEGO WYSZŁO</div>
  <div class="p-5">
   <div class="font-extrabold tracking-wider text-[17px] mb-2" style="color:${col}">${esc(M.head)}</div>
   <div class="text-zinc-300 text-[12.5px] leading-relaxed mb-4 border-l-2 pl-4" style="border-color:${col}">${esc(M.lead)}</div>
   <table class="w-full text-[12px] mb-4">
    ${M.rows.map(r=>`<tr class="border-b border-zinc-700/60">
      <td class="text-zinc-400 text-[11px] tracking-widest">${esc(r[0])}</td>
      <td class="text-right font-bold ${r[3]?'text-emerald-400':'text-red-400'} whitespace-nowrap">${esc(r[1])}</td>
      <td class="text-[11px] text-zinc-400 pl-3">${esc(r[2])}</td></tr>`).join('')}
    <tr class="border-b border-zinc-700/60"><td class="text-zinc-400 text-[11px] tracking-widest">PENSJA NA ETACIE</td>
      <td class="text-right font-bold text-emerald-400 whitespace-nowrap">+${zl(M.wage)}</td>
      <td class="text-[11px] text-zinc-400 pl-3">umowa o pracę, pierwszy raz w życiu</td></tr>
    <tr class="border-b border-zinc-700/60"><td class="text-zinc-400 text-[11px] tracking-widest">KOSZTY ŻYCIA</td>
      <td class="text-right font-bold text-red-400 whitespace-nowrap">−${zl(M.live)}</td>
      <td class="text-[11px] text-zinc-400 pl-3">taryfa „rok bez klubu”</td></tr>
    ${M.alimony?`<tr class="border-b border-zinc-700/60"><td class="text-red-500 text-[11px] tracking-widest font-bold">ALIMENTY DO ARGENTYNY</td>
      <td class="text-right font-bold text-red-500 whitespace-nowrap">−${zl(M.alimony.amount)}</td>
      <td class="text-[11px] text-zinc-400 pl-3">pozostało rat: ${M.alimony.left}</td></tr>`:''}
   </table>
   <div class="text-[11px] text-zinc-400 mb-4">Budżet po tym roku: <b class="${G.p.budget<0?'text-red-500':'text-orange-400'}">${zl(G.p.budget)}</b>
     · wiek: <b class="text-zinc-200">${G.p.age}</b> · lata poza torem: <b class="${G.p.idleYears>=2?'text-red-500':'text-zinc-200'}">${G.p.idleYears}</b></div>
   ${M.retire?`<div class="brut p-3 mb-4 border-2 border-red-700 bg-red-950/20">
     <div class="text-[12px] text-red-500 font-bold tracking-widest blink mb-1">TO JUŻ KONIEC</div>
     <div class="text-[12px] text-zinc-200">${esc(M.retire)}</div></div>`:''}
   <button onclick="mechContinue()" class="btn px-8 py-3 font-extrabold tracking-[.2em]" style="color:${col}">
     OK${M.retire?' — ZAMYKAM KARIERĘ':', SZUKAM KLUBU'} &gt;</button>
  </div>
 </div></div>`;
}
function mechContinue(){
 const M=G.mech; G.mech=null;
 if(M && M.retire){ retire(M.retire); return; }
 _offers=[]; G.screen='sign'; render();
}
