/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN OFERT
   Okienko transferowe: wartość rynkowa, oferty, powód braku przedłużenia
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 255-504 oryginału).
   PATCH 22.08.2026 (Sprint 3): przy każdej ofercie widać, KTO cię tam
   poprowadzi — trener klubu, jego typ, warsztat, to co już o tobie myśli
   i mnożnik, o jaki przyspieszy (albo zdusi) twój rozwój.
   ============================================================ */
/* ============================================================
   BOKS: DLACZEGO STARY KLUB NIE ZŁOŻYŁ OFERTY
   Silnik (makeOffers → renewRejection) zapisuje powód do G.noRenew.
   Bez tego brak przedłużenia wyglądał jak bug: telefon milczy i tyle.
   ============================================================ */
function noRenewBox(){
 const n=G.noRenew; if(!n) return '';
 const col={behave:'#dc2626', sport:'#f59e0b', money:'#f59e0b', gone:'#dc2626', squad:'#a1a1aa', injury:'#dc2626'}[n.code]||'#a1a1aa';
 return `<div class="brut mb-3" style="border-color:${col}">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:${col};color:${col}">
    BEZ PRZEDŁUŻENIA — ${esc(n.club)} ${n.lk?'· '+G.leagues[n.lk].short:''}</div>
  <div class="p-3">
   <div class="text-[12px] font-bold mb-1" style="color:${col}">${esc(n.t)}</div>
   <div class="text-[11px] text-zinc-200 leading-relaxed mb-2">${esc(n.x)}</div>
   <div class="text-[12px] text-zinc-300 border-l-2 pl-3 italic" style="border-color:${col}">
     ${esc(n.quote)} <span class="text-[11px] text-zinc-500 not-italic">— były pracodawca</span></div>
   ${n.coachTxt?`<div class="text-[11px] mt-2 border-t border-zinc-700 pt-2" style="color:#f59e0b">
     <b>DECYZJA TRENERA:</b> ${esc(n.coachTxt)}</div>`:''}
   ${n.tip?`<div class="text-[11px] text-zinc-400 mt-2">› ${esc(n.tip)}</div>`:''}
  </div></div>`;
}

/* ============================================================
   KTO CIĘ TAM POPROWADZI (Sprint 3)
   ------------------------------------------------------------
   Dwa kluby z tym samym budżetem i tym samym OVR to nie to samo, jeżeli
   w jednym siedzi wychowawca młodzieży z warsztatem 90, a w drugim słup
   ogłoszeniowy, który zna cię wyłącznie z portali. Dane liczy silnik
   (engine/27 → mkOffer → coachRel + coachDevMul); tutaj tylko rysujemy.
   ============================================================ */
function offerCoachHtml(o){
 const c=o.coach; if(!c) return '';
 const col = c.rel>=42?'#4ade80' : c.rel>=14?'#a3e635' : c.rel>=-14?'#d4d4d8' : c.rel>=-44?'#f59e0b' : '#ef4444';
 const m=c.devMul||1;
 const dev = m>=1.20?['ROZWÓJ WYRAŹNIE PRZYSPIESZY','#4ade80']
   : m>=1.06?['ROZWÓJ LEKKO PRZYSPIESZY','#a3e635']
   : m>=0.94?['ROZWÓJ BEZ ZMIAN','#d4d4d8']
   : m>=0.80?['ROZWÓJ ZWOLNI','#f59e0b']
   : ['ROZWÓJ STANIE W MIEJSCU','#ef4444'];
 return `<div class="mt-2 border border-zinc-700 px-2 py-1.5">
   <div class="flex justify-between items-baseline gap-2">
     <span class="text-[11px] text-zinc-400 tracking-widest">TRENER</span>
     <span class="text-[11px] font-bold" style="color:${col}">${esc(c.status)} (${c.rel>0?'+':''}${c.rel})</span>
   </div>
   <div class="text-[12px] text-zinc-100 font-bold">${esc(c.name)}</div>
   <div class="text-[11px] text-zinc-400">${esc(c.type)} · warsztat ${c.skill} · autorytet ${c.auth}${
     c.gap?` · dzielisz z drużyną ${c.gap>0?'+':''}${c.gap} OVR`:''}</div>
   <div class="text-[11px] font-bold mt-1" style="color:${dev[1]}">${dev[0]} <span class="text-zinc-500 font-normal">(x${m.toFixed(2)} do rozwoju OVR po sezonie)</span></div>
   ${c.quote?`<div class="text-[11px] text-zinc-400 italic mt-1 border-l-2 pl-2" style="border-color:${col}">„${esc(c.quote)}"</div>`:''}
   ${c.fired?`<div class="text-[11px] font-bold mt-1 blink" style="color:#fde047">
     ZARZĄD WYBRAŁ CIEBIE — POPRZEDNI TRENER WŁAŚNIE STRACIŁ PRACĘ. Nowy przychodzi z twoim nazwiskiem w papierach.</div>`:''}
 </div>`;
}

/* ---- EKRAN: PODPISANIE KONTRAKTU ---- */
let _offers=[];
function scSign(){
 const p=G.p;
 if(!_offers.length){
   if(p.club===null){ G.noRenew=null; _offers=firstOffers(); }
   else _offers=makeOffers();
 }
 const offers=_offers;
 if(!offers.length){
   const idle=p.idleYears||0;
   return head()+`<div class="brut border-red-900 fade">
   <div class="brut-h px-3 py-1.5 text-[11px] text-red-500 font-bold" style="border-color:#7f1d1d">RYNEK TRANSFEROWY ${G.year} // BRAK OFERT</div>
   <div class="p-5">
   ${(p.longInjury||0)>0
     ? `<div class="text-zinc-300 mb-3">Rynek jest dla ciebie zamknięty — nie przez formę, tylko przez papiery.
        Po zerwanych więzadłach / złamanym udzie cały sezon ${G.year} spędzisz na rehabilitacji, a klub nie zgłosi do rozgrywek
        zawodnika, który nie odjedzie ani jednego biegu.</div>`
     : `<div class="text-zinc-300 mb-3">Żaden klub w Polsce nie chce cię widzieć na torze. Telefon milczy.</div>`}
   ${longInjuryWarnHtml()}
   ${marketBox()}
   ${noRenewBox()}
   <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
     ${kpi('WIEK',p.age)}${kpi('OVR',p.ovr)}${kpi('LATA BEZ KLUBU',idle,idle>=2?'text-red-500':'text-zinc-100')}${kpi('BUDŻET',zl(p.budget),'text-orange-400')}
   </div>
   ${p.idleLog&&p.idleLog.length?`<div class="brut p-3 mb-4"><div class="text-[11px] text-zinc-400 tracking-widest mb-1">CO SIĘ DZIAŁO</div>
     <ul class="text-[11px] text-zinc-300 space-y-0.5">${p.idleLog.map(l=>'<li>› '+esc(l)+'</li>').join('')}</ul></div>`:''}
   <div class="text-[11px] text-zinc-400 mb-4">Możesz czekać na telefon i trenować na własną rękę — ale każdy rok bez ścigania zjada twój OVR.
   ${idle>=2?'<b class="text-red-500 blink">Po trzecim roku bez klubu kariera kończy się sama.</b>':''}</div>
   ${mechanicBox('brak')}
   <div class="flex gap-2 flex-wrap">
     <button onclick="skipYear()" class="btn px-5 py-2.5 font-bold tracking-widest text-orange-500">PRZECZEKAJ ROK ${G.year} &gt;</button>
     <button onclick="mechanicPath()" class="btn px-5 py-2.5 font-bold tracking-widest" style="color:#eab308">PIERDOLĘ, IDĘ ROBIĆ ZA MECHANIKA</button>
     <button onclick="retire('Nikt już nie dzwonił.')" class="btn-d px-5 py-2.5 font-bold tracking-widest text-red-400">ZAKOŃCZ KARIERĘ</button>
   </div></div></div>`;
 }
 /* ============================================================
    ŚCIEŻKA MECHANIKA PRZY SAMYCH OFERTAMI Z KLŻ
    „Pierdolę, idę robić za mechanika" pokazywało się WYŁĄCZNIE przy zerowej
    liczbie ofert. Tymczasem najniższa liga bywa gorsza niż etat w warsztacie —
    jeżeli wszystkie oferty są z KLŻ, gracz musi mieć ten wybór na ekranie.
    ============================================================ */
 const onlyKL = offers.every(o=>o.lk==='KL');
 return head()+`<div class="fade">
 ${playerStrip()}
 ${longInjuryWarnHtml()}
 ${forcedExitHtml()}
 ${marketBox()}
 ${noRenewBox()}
 <div class="brut"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">OKIENKO TRANSFEROWE // OFERTY NA SEZON ${G.year}</div>
 <div class="p-3 grid md:grid-cols-2 gap-2">
 ${offers.map((o,i)=>`<div class="brut p-3 ${o.stay?'border-orange-800':''}">
   <div class="flex justify-between items-start gap-2">
     <div><div class="font-bold text-zinc-100 text-[12px]">${esc(o.club)}</div>
     <div class="text-[11px] text-zinc-400 tracking-widest">${G.leagues[o.lk].short} · OVR ${o.ovr} · budżet ${zl(o.budget)}</div></div>
     ${o.stay?'<span class="text-[11px] text-orange-500 border border-orange-800 px-1.5 py-0.5">PRZEDŁUŻENIE</span>':''}
   </div>
   ${o.titles>=2?`<div class="mt-2 text-[11px] border px-2 py-1" style="border-color:#a16207;color:#eab308">
     SŁUP OGŁOSZENIOWY: ${o.titles} sponsorów tytularnych w nazwie (${o.sponsors.map(esc).join(', ')})
     — bazowy OVR klubu obniżony o ${Math.abs(o.titlePen)} pkt. Szatnia wie, że to desperacja zarządu.</div>`
    :o.titles===1?`<div class="mt-1 text-[11px] text-zinc-400">sponsor tytularny: ${esc(o.sponsors[0])}</div>`:''}
   <div class="mt-2 border border-zinc-700 bg-[rgba(249,115,22,.07)] px-2 py-1.5">
     <span class="text-[11px] text-zinc-300 tracking-widest">DŁUGOŚĆ UMOWY</span>
     <span class="text-[13px] font-extrabold text-orange-400 ml-2">${o.years} ${lataTxt(o.years)}</span>
     <span class="text-[11px] text-zinc-400 ml-1">(do końca sezonu ${G.year+o.years-1}${o.years>1?' — przez ten czas nie ma okienka transferowego':''})</span>
   </div>
   <div class="mt-2 grid grid-cols-3 gap-2 text-[11px]">
     <div><div class="text-zinc-400">KONTRAKT</div><div class="${o.type==='Zawodowy'?'text-emerald-400':'text-zinc-300'}">${o.type}</div></div>
     <div><div class="text-zinc-400">ZA PUNKT</div><div class="text-zinc-100">${zl(o.rate)}</div></div>
     <div><div class="text-zinc-400">PREMIA CO SEZON</div><div class="text-zinc-100">${o.bonus?zl(o.bonus):'—'}</div></div>
   </div>
   <div class="mt-2">
     <div class="flex justify-between text-[11px]"><span class="text-zinc-400">SZANSA NA JAZDĘ W SKŁADZIE</span>
     <span class="${o.ride>=70?'text-emerald-400':o.ride>=40?'text-yellow-500':'text-red-500'} font-bold">${o.ride}%</span></div>
     <div class="bar"><i style="width:${o.ride}%;background:${o.ride>=70?'#34d399':o.ride>=40?'#eab308':'#ef4444'}"></i></div>
     <div class="text-[11px] text-zinc-400 mt-0.5">${o.ride>=70?'pierwszy skład':o.ride>=40?'rotacja / rezerwa':'będziesz oglądał z parkingu'}${
       o.coach&&o.coach.rel<=-25?' <span style="color:#f59e0b">— i pamiętaj, że ten procent liczy już niechęć trenera</span>':''}</div>
   </div>
   ${offerCoachHtml(o)}
   ${o.debt>0?`<div class="text-[11px] text-red-500 mt-1">UWAGA: klub ma zaległości ${zl(o.debt)} — kadra takiego klubu jeździ wyraźnie słabiej</div>`:''}
   ${offerWhyHtml(o,i)}
   <button onclick="pickOffer(${i})" class="btn w-full mt-2 py-1.5 text-[11px] font-bold tracking-widest">PODPISUJĘ NA ${o.years} ${lataTxt(o.years).toUpperCase()}</button>
 </div>`).join('')}
 </div>
 ${onlyKL?`<div class="px-3 pb-3">
   ${mechanicBox('klz')}
   <div class="flex gap-2 flex-wrap">
     <button onclick="mechanicPath()" class="btn px-5 py-2.5 font-bold tracking-widest" style="color:#eab308">PIERDOLĘ, IDĘ ROBIĆ ZA MECHANIKA</button>
     <button onclick="retire('Wolał zostać w parku maszyn niż jeździć w KLŻ.')" class="btn-d px-5 py-2.5 font-bold tracking-widest text-red-400">ZAKOŃCZ KARIERĘ</button>
   </div></div>`:''}
 </div></div>`;
}
/* ============================================================
   SKĄD SIĘ BIORĄ OFERTY — DWA JAWNE BOKSY
   ------------------------------------------------------------
   marketBox()    — twoja WARTOŚĆ RYNKOWA rozpisana na składniki (OVR, średnia,
                    medialność, profesjonalizm, wiek, sprzęt) plus wyjaśnienie,
                    ile telefonów w ogóle mogło zadzwonić.
   offerWhyHtml() — przy KAŻDEJ ofercie: zainteresowanie tego klubu rozpisane
                    na powody i rozbiór stawki za punkt.
   Wcześniej gracz widział tylko wynik — stąd wrażenie, że oferty są losowe.
   ============================================================ */
function deltaLine(x){
 return `<li class="flex justify-between gap-2">
   <span class="text-zinc-300">${esc(x.w)}</span>
   <span class="font-bold whitespace-nowrap ${x.d>0?'text-emerald-400':x.d<0?'text-red-400':'text-zinc-400'}">${x.d>0?'+':''}${x.d}</span></li>`;
}
function marketBox(){
 const M=G.market; if(!M) return '';
 const p=G.p;
 const cat = M.rating>=85?['ZAWODNIK Z GÓRNEJ PÓŁKI','#f97316']
   : M.rating>=70?['SOLIDNY LIGOWIEC','#84cc16']
   : M.rating>=55?['ŚREDNIAK Z ROTACJI','#eab308']
   : M.rating>=40?['ZAWODNIK DO WYPEŁNIENIA SKŁADU','#a1a1aa']
   : ['NIKT SIĘ O CIEBIE NIE BIJE','#dc2626'];
 return `<div class="brut mb-3" style="border-color:${cat[1]}">
  <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:${cat[1]};color:${cat[1]}">
    TWOJA WARTOŚĆ RYNKOWA — SKĄD BIORĄ SIĘ TE OFERTY</div>
  <div class="p-3 grid md:grid-cols-2 gap-3">
   <div>
    <div class="flex items-end gap-2 mb-1">
     <div class="text-3xl font-extrabold" style="color:${cat[1]}">${Math.round(M.rating)}</div>
     <div class="text-[11px] text-zinc-400 pb-1">na skali OVR klubów · <b class="text-zinc-300">${cat[0]}</b></div>
    </div>
    <div class="text-[11px] text-zinc-400 mb-2">Kluby porównują tę liczbę ze swoim poziomem. Im wyżej jesteś ponad klubem, tym chętniej dzwonią i tym lepszą dają stawkę.</div>
    <ul class="text-[11px] space-y-0.5 border-t border-zinc-700 pt-2">${(M.parts||[]).map(deltaLine).join('')}</ul>
   </div>
   <div>
    <div class="text-[11px] text-zinc-400 tracking-widest mb-1">ILE TELEFONÓW MOGŁO ZADZWONIĆ: <b class="text-zinc-200">${M.maxOffers}</b></div>
    <ul class="text-[11px] space-y-0.5 mb-2">${(M.maxWhy||[]).map(deltaLine).join('')}</ul>
    <div class="text-[11px] text-zinc-400 border-t border-zinc-700 pt-2">
     Sprawdzono <b class="text-zinc-300">${M.checked}</b> klubów w trzech ligach, realne zainteresowanie zgłosiło
     <b class="text-zinc-300">${M.interested}</b>. Na ekran trafiają najmocniejsze z nich.
     ${M.lastAvg!=null?`<br>Twoja średnia z sezonu ${G.year-1}: <b class="text-zinc-300">${M.lastAvg.toFixed(2)}</b> — to ona najmocniej rusza wartością w górę i w dół.`:''}
     ${M.floor!=null?`<br>Próg dostępności: klub odpada, gdy jesteś od niego słabszy o więcej niż <b class="text-zinc-300">${Math.abs(M.floor)}</b> pkt
       (${p.age<=21?'młodzieżowiec ma tu ogromną taryfę ulgową — wypełnia rubrykę':p.age<=24?'U24 ma taryfę ulgową dzięki obowiązkowej rubryce':'senior nie ma żadnej taryfy ulgowej'}).`:''}
    </div>
   </div>
  </div></div>`;
}
function offerWhyHtml(o,i){
 if(!o.ratingParts && !o.wantParts) return '';
 const wc = o.want>=70?'text-emerald-400':o.want>=40?'text-yellow-500':'text-red-500';
 return `<details class="mt-2 border border-zinc-700">
  <summary class="cursor-pointer px-2 py-1 text-[11px] text-zinc-300 tracking-widest select-none">
    SKĄD TA OFERTA · SZANSA NA TELEFON STĄD: <b class="${wc}">${o.want!=null?o.want+'%':'—'}</b>
    ${o.gap!=null?`<span class="text-zinc-400">· twoja wartość ${Math.round(o.rating)} vs poziom klubu ${o.ovr} (${o.gap>0?'+':''}${o.gap})</span>`:''}
  </summary>
  <div class="px-2 py-2 border-t border-zinc-700">
   ${o.want!=null&&o.want<25?`<div class="text-[11px] mb-2" style="color:#eab308">
     Ten telefon nie miał prawa zadzwonić — przy ${o.want}% szans taka oferta trafia się raz na kilka lat. Ktoś w klubie postawił na ciebie wbrew tabelce.</div>`:''}
   ${o.wantParts?`<div class="text-[11px] text-zinc-400 tracking-widest mb-1">DLACZEGO TEN KLUB CIĘ CHCE</div>
     <ul class="text-[11px] space-y-0.5 mb-2">${o.wantParts.map(deltaLine).join('')}</ul>`:''}
   ${o.rateParts&&o.rateParts.length?`<div class="text-[11px] text-zinc-400 tracking-widest mb-1 border-t border-zinc-700 pt-2">SKĄD STAWKA ${zl(o.rate)} ZA PUNKT</div>
     <ul class="text-[11px] space-y-0.5">${o.rateParts.map(x=>`<li class="flex justify-between gap-2">
       <span class="text-zinc-300">${esc(x.w)}</span><span class="text-zinc-200 font-bold whitespace-nowrap">${esc(x.v||'')}</span></li>`).join('')}</ul>`:''}
   ${o.bonus?`<div class="text-[11px] text-zinc-400 mt-2 border-t border-zinc-700 pt-2">
     Premia za podpis to ułamek budżetu klubu (${zl(o.budget)}) ważony twoją wartością${o.debt>0?', ścięty przez jego zaległości wobec ciebie':''}${o.arr>0?' i przez niezapłacone pensje kadry':''}.</div>`
    :`<div class="text-[11px] text-zinc-400 mt-2 border-t border-zinc-700 pt-2">Bez premii za podpis${o.type==='Amatorski'?' — kontrakt amatorski nie przewiduje takiej rubryki.':'.'}</div>`}
  </div></details>`;
}

/* ---- BOKS „DRUGA DROGA: PARK MASZYN" (wspólny dla obu wariantów ekranu ofert) ---- */
function mechanicBox(reason){
 return `<div class="brut p-3 mb-4" style="border-color:#a16207">
   <div class="text-[11px] font-bold tracking-widest mb-1" style="color:#eab308">DRUGA DROGA: PARK MASZYN</div>
   ${reason==='klz'?`<div class="text-[11px] mb-1" style="color:#eab308">
     WSZYSTKIE OFERTY, JAKIE MASZ, SĄ Z KRAJOWEJ LIGI ŻUŻLOWEJ. Nie musisz tego brać.</div>`:''}
   <div class="text-[11px] text-zinc-300 leading-relaxed">${reason==='klz'
     ? 'Zamiast jeździć w najniższej lidze za grosze, możesz przez rok robić za mechanika.'
     : 'Zamiast czekać na telefon, możesz przez rok robić za mechanika.'}
   Pensja jest, dach nad głową jest, tor jest — tylko nie twój. <b class="text-zinc-200">5%</b> szans, że trafisz na człowieka,
   u którego wreszcie zrozumiesz ten sport (OVR +10, sprzęt 99, ale medialność spada do zera — rok cię nie było).
   <b class="text-zinc-200">95%</b>, że przez rok będziesz myć pancerze, stracisz formę i zostanie ci kontrakt w KLŻ.
   Wynik zobaczysz na osobnym ekranie, zanim wrócisz na rynek.</div>
 </div>`;
}
/* ---- CZERWONE OSTRZEŻENIE: SEZON MASZ Z GŁOWY ---- */
function longInjuryWarnHtml(){
 const p=G.p; if(!(p.longInjury>0)) return '';
 return `<div class="brut p-3 mb-3 border-2 border-red-700 bg-red-950/20">
  <div class="text-[12px] text-red-500 font-bold tracking-widest blink mb-1">KONTUZJA DŁUGOTERMINOWA — SEZON ${G.year} MASZ Z GŁOWY</div>
  <div class="text-[12px] text-red-400 font-bold mb-1">${esc(p.longInjuryWhy||'Zerwane więzadła / złamana kość udowa.')}</div>
  <div class="text-[11px] text-zinc-200">Operacja, rehabilitacja, powrót na tor najwcześniej w sezonie ${G.year+ (p.longInjury||1)}.
   Możesz podpisać kontrakt, ale w tym roku nie odjedziesz ANI JEDNEGO biegu: zero meczów, zero punktów, zero rozwoju
   — a koszty życia, serwis i alimenty lecą dalej.</div>
 </div>`;
}
/* ---- CZERWONE OSTRZEŻENIE: UMOWA ZERWANA PRZEZ SKUTEK ZDARZENIA ---- */
function forcedExitHtml(){
 const p=G.p; if(!p.forcedExit) return '';
 p.forcedExit=false;
 return `<div class="brut p-3 mb-3" style="border-color:#dc2626">
  <div class="text-[12px] font-bold tracking-widest mb-1" style="color:#dc2626">UMOWA ZERWANA — MUSISZ ZMIENIĆ KLUB</div>
  <div class="text-[11px] text-zinc-200">Skutek twojej decyzji z ekranu zdarzenia. Kontrakt miał biec dalej,
   ale po tym, co się stało, nie ma do czego wracać: rynek otwiera się dla ciebie w trybie awaryjnym
   i wybór jest taki, jaki jest.</div>
 </div>`;
}
function firstOffers(){
 const p=G.p, out=[], used=new Set();
 const MV=marketValue(p, 1.40);
 G.market={rating:MV.rating, parts:MV.parts, maxOffers:3,
   maxWhy:[{d:3, w:'pierwszy kontrakt w karierze — trzy różne ścieżki do wyboru'}],
   lastAvg:null, interested:3, checked:allClubs().length, floor:null,
   age:p.age, prof:p.prof, med:p.med, ovr:p.ovr, first:true};
 // Trzy różne ścieżki: prestiż (będziesz grzał ławkę), środek, albo klub,
 // w którym od razu wskoczysz do składu. Wybór należy do ciebie.
 const targets=[p.ovr+32+R(-4,4), p.ovr+17+R(-4,4), p.ovr+5+R(-4,4)];
 targets.forEach(t=>{
   const target=cl(t,30,97);
   const pool=[];
   LKEYS.forEach(lk=>G.leagues[lk].clubs.forEach(c=>{
     if(used.has(c.name)) return;
     pool.push({c,lk,diff:Math.abs(c.ovr-target)});
   }));
   pool.sort((a,b)=>a.diff-b.diff);
   const best=pool[0]; if(!best) return;
   used.add(best.c.name);
   const I=clubInterest(p, best.c, best.lk, MV.rating);
   out.push({club:best.c.name, lk:best.lk, ovr:best.c.ovr, budget:best.c.budget, debt:best.c.debt, arr:best.c.arr||0,
     type:'Amatorski', years:R(1,2), rate:R(150,400), bonus:0, stay:false,
     ride:appearanceChance(p,best.c,55,null),
     rating:MV.rating, ratingParts:MV.parts, want:I.want, wantParts:I.parts,
     gap:Math.round(I.gap), press:I.press, rateParts:null, lastAvg:null,
     titles:titleCount(best.c), sponsors:clubTitles(best.c).map(s=>s.n),
     titlePen:sponsorPen(titleCount(best.c)),
     /* Sprint 3: przy pierwszym kontrakcie trener waży najwięcej w całej karierze —
        to on decyduje, czy szesnastolatek urośnie, czy przez trzy lata będzie woził kevlar. */
     coach: (typeof coachRel==='function') ? (function(){
       const CO=coachRel(best.c.name, {id:-1, me:true, ovr:p.ovr, age:p.age, form:0});
       return {name:CO.coach.name, type:CO.type.n, short:CO.type.short, skill:CO.coach.skill,
         auth:CO.coach.auth, rel:CO.rel, status:CO.status.n, statusCol:CO.status.c, gap:CO.gap,
         devMul:Math.round(coachDevMul(best.c.name, {id:-1, me:true, ovr:p.ovr, age:p.age})*100)/100,
         quote:coachQuote(CO, coachPressure(best.c.name))};
     })() : null});
 });
 return out.sort((a,b)=>b.ovr-a.ovr);
}
function pickOffer(i){ const o=_offers[i]; _offers=[]; signContract(o); }
