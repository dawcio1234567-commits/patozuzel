/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN WARSZTAT
   Prognoza kariery, ostrzeżenia, tuner i mechanik
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 792-969 oryginału).
   ============================================================ */
/* Szacowane ryzyko kontuzji w nadchodzącym sezonie — ten sam wzór, co w silniku. */
function injuryPreview(){
 const p=G.p;
 return cl(INJ.base + (100-p.prof)*INJ.profW + Math.max(0,p.age-INJ.ageFrom)*INJ.ageW
   + (1-cl(p.equip,1,99)/99)*INJ.equipW + (p.next.injuryPP||0), 2, 95);
}
/* ---- PROGNOZA KARIERY: ile ci jeszcze zostało i ile to kosztuje ---- */
function outlookBox(){
 const p=G.p;
 const lim=retireAgeOf(p), left=Math.max(0,lim-p.age);
 const inj=injuryPreview();
 const live=livingCostOf(p,false);
 const pro=p.contract.type==='Zawodowy';
 const cell=(l,v,c,x)=>`<div class="brut p-2"><div class="text-[11px] text-zinc-400 tracking-widest leading-tight">${l}</div>
   <div class="text-lg font-extrabold ${c}">${v}</div><div class="text-[11px] text-zinc-400 leading-tight">${x}</div></div>`;
 return `<div class="brut mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold">PROGNOZA — CO CIĘ CZEKA</div>
 <div class="p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
  ${cell('KONIEC KARIERY (SZACUNEK)', lim+' lat', left<=2?'text-red-500':left<=5?'text-yellow-500':'text-zinc-100',
     'zostało ok. '+left+' sezonów · liczone z profesjonalizmu ('+p.prof+') i OVR ('+p.ovr+')')}
  ${cell('RYZYKO KONTUZJI W SEZONIE', inj.toFixed(0)+'%', inj>=45?'text-red-500':inj>=30?'text-yellow-500':'text-emerald-400',
     'profesjonalizm, wiek i stan sprzętu · pauza 2–13 spotkań i utrata OVR, a w '+INJ.catP+
     '% urazów zerwane więzadła / złamane udo = TEN i CAŁY KOLEJNY sezon poza torem')}
  ${cell('KOSZTY ŻYCIA / ROK', zl(live), 'text-orange-400',
     (p.contract.type==='Amatorski'?'taryfa amatorska (mieszkasz u mamy)':'bus, paliwo, hotele, dom')+' · '+G.leagues[p.lk].short)}
  ${cell(pro?'SERWIS PO SEZONIE':'SPRZĘT KLUBOWY', pro?zl(servicePreview()):'0 zł',
     pro?'text-red-400':'text-emerald-400',
     pro?'rachunek przyjdzie niezależnie od wyników':'dopóki jeździsz na kontrakcie amatorskim')}
 </div>
 <div class="px-3 pb-3">${accLite('SKĄD BIERZE SIĘ WIEK EMERYTALNY', `
  <div class="text-[11px] text-zinc-400">
  Wiek emerytalny NIE jest sztywny. Zawodowiec z profesjonalizmem 99 dojeżdża do ${RETIRE.max} lat, a zawodnik,
  który traktuje ten sport jak hobby, kończy zaraz po trzydziestce — chyba że ma OVR, za który kluby wciąż płacą.
  W ostatnich ${RETIRE.wobbleFrom} latach przed granicą ciało potrafi odmówić wcześniej.
 </div>`)}</div></div>`;
}
function warnings(){
 const p=G.p, c=getClub(p), w=[];
 const th=refusalThreshold(p.age), ch=refusalChance(p.age,c.debt);
 const thTxt = p.age<18 ? 'Masz '+p.age+' lat — do '+zl(th)+' w ogóle się tym nie przejmujesz.'
                        : 'Masz '+p.age+' lat — senior nie jeździ za darmo, próg to zaledwie '+zl(th)+'.';
 if(ch>0) w.push(['ZALEGŁOŚCI KLUBU: '+zl(c.debt)+' — RYZYKO ODMOWY JAZDY '+ch+'% NA KOLEJKĘ',
   thTxt+' Każde kolejne '+zl(refusalStep(p.age))+' długu to +10 p.p. szansy, że nie wyjedziesz na tor. Spłata długu w trakcie sezonu wraca cię do składu.']);
 else if(c.debt>0) w.push(['Klub zalega ci '+zl(c.debt),'Jeszcze jedziesz. '+thTxt]);
 const trb=clubTrouble(c);
 if((c.arr||0)>50000 || trb>=4) w.push(['KLUB ZALEGA CAŁEJ KADRZE: '+zl(c.arr||0)+' — DRUŻYNA TRACI '+trb.toFixed(0)+' PKT OVR NA ZAWODNIKA',
   'Mechanicy nie przyjeżdżają, silniki zostają u tunera, szatnia rozmawia o pieniądzach zamiast o ustawieniach. '+
   'Do czterech zawodników może odmówić jazdy, a rezerwy taktycznej taki klub nie zrobi wcale — nie ma zapasowego silnika. '+
   'W tabeli to widać: klub z zaległościami przegrywa mecze, które na papierze wygrywał.']);
 if(p.contract.type==='Zawodowy'&&p.equip<25) w.push(['SPRZĘT NA POZIOMIE '+p.equip+'/99','Silniki są zajeżdżone. Bez wizyty u tunera będziesz zbierał defekty.']);
 if(p.mechCost>0) w.push(['MECHANIK '+p.mechName+' KOSZTUJE '+zl(mechSeasonFee())+' NA SEZON',
   'Ta kwota schodzi z budżetu przy starcie KAŻDEGO sezonu. Jak jej nie będzie, mechanik zrywa współpracę '+
   'i wracasz do klubowego z łapanki (jakość 25/99) — gorsze podpowiedzi i wyższe ryzyko „dwóch minut".']);
 if(p.contract.type==='Zawodowy'&&p.mech<30) w.push(['MECHANIK JAKOŚCI '+p.mech,'Nawet dobry silnik zepsuje ci się w boksie. Zatrudnij kogoś trzeźwego.']);
 if(p.prof<25) w.push(['PROFESJONALIZM '+p.prof,'Będziesz zbierał taśmy i wykluczenia jak Rempała w młodości.']);
 if(p.alimony>0) w.push(['ALIMENTY DO ARGENTYNY: '+zl(ECON.alimony)+' PO KAŻDYM SEZONIE (POZOSTAŁO RAT: '+p.alimony+')',
   'Kwota jest sztywna i schodzi z budżetu niezależnie od wyników, kontuzji i tego, czy klub ci zapłacił. '+
   'Do końca zobowiązania zostawisz w Argentynie '+zl(ECON.alimony*p.alimony)+'.']);
 if(titleCount(c)>=2) w.push(['KLUB MA '+titleCount(c)+' SPONSORÓW TYTULARNYCH W NAZWIE — '+Math.abs(sponsorPen(titleCount(c)))+' PKT OVR',
   'Kevlar wygląda jak tablica ogłoszeń, a szatnia wie, że to nie potęga, tylko desperacja zarządu. '+
   'Zawodnicy z profesjonalizmem powyżej '+SPON.profBlock+' nie podpisują z takimi klubami — jeśli podniesiesz swój, '+
   'ten klub przestanie być dla ciebie opcją.']);
 if(!w.length) return '';
 return `<div class="brut border-red-900 mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-red-500 font-bold" style="border-color:#7f1d1d">OSTRZEŻENIA PRZED SEZONEM</div>
 <div class="p-3 space-y-1.5">${w.map(x=>`<div><div class="text-[11px] text-red-400 font-bold">${esc(x[0])}</div><div class="text-[11px] text-zinc-300">${esc(x[1])}</div></div>`).join('')}</div></div>`;
}
function amateurNote(){
 return `<div class="brut p-3 mb-3"><div class="text-[11px] text-zinc-300"><b class="text-zinc-200">KONTRAKT AMATORSKI.</b> Sprzęt daje klub (jakość zależy od jego poziomu), mechanik jest wspólny dla całego zespołu. Warsztat odblokujesz dopiero na kontrakcie zawodowym.</div></div>`;
}
function defectPreview(){
 const p=G.p;
 return cl(0.010 + (1-p.equip/99)*0.055 + (1-p.mech/99)*0.040, 0.004, 0.30)*100;
}
function workshop(){
 const p=G.p, W=p.shop;
 const dp=defectPreview();
 const spent=W.spent;
 return `<div class="brut mb-3"><div class="brut-h px-3 py-1.5 text-[11px] text-orange-500 font-bold flex justify-between flex-wrap gap-2">
   <span>WARSZTAT — PRZYGOTOWANIA DO SEZONU ${G.year}</span>
   <span class="text-zinc-300">wydane w tym oknie: <b class="text-orange-400">${zl(spent)}</b></span></div>
 <div class="p-3 grid sm:grid-cols-3 gap-2">
   <div class="brut p-2"><div class="text-[11px] text-zinc-400 tracking-widest">SPRZĘT (TUNER)</div>
     <div class="text-xl font-extrabold text-sky-400">${p.equip}<span class="text-zinc-400 text-sm">/99</span>
     ${W.equipGain?`<span class="text-[11px] text-emerald-400 ml-1">+${W.equipGain} w tym oknie</span>`:''}</div></div>
   <div class="brut p-2"><div class="text-[11px] text-zinc-400 tracking-widest">MECHANIK</div>
     <div class="text-xl font-extrabold text-yellow-400">${p.mech}<span class="text-zinc-400 text-sm">/99</span></div>
     <div class="text-[11px] ${W.mechHired?'text-emerald-400':'text-zinc-300'} truncate">${W.mechHired?'✔ ':''}${esc(p.mechName)}</div>
     <div class="text-[11px] ${p.mechCost?'text-orange-400':'text-zinc-500'}">${p.mechCost?zl(mechSeasonFee())+' / sezon':'za darmo (klubowy)'}</div></div>
   <div class="brut p-2"><div class="text-[11px] text-zinc-400 tracking-widest">RYZYKO DEFEKTU / BIEG</div>
     <div class="text-xl font-extrabold ${dp>7?'text-red-500':dp>4?'text-yellow-500':'text-emerald-400'}">${dp.toFixed(1)}%</div>
     <div class="text-[11px] text-zinc-400">${dp>7?'będziesz stał na prostej':dp>4?'do przeżycia':'sprzęt trzyma'}</div></div>
 </div>
 ${W.log.length?`<div class="px-3 pb-2"><div class="text-[11px] text-zinc-400 tracking-widest mb-1">CO JUŻ KUPIŁEŚ W TYM OKNIE</div>
   <div class="space-y-0.5">${W.log.map(l=>`<div class="text-[11px] text-emerald-400">✔ ${esc(l)}</div>`).join('')}</div></div>`:
   `<div class="px-3 pb-2 text-[11px] text-zinc-400">Nic jeszcze nie kupiłeś. Sprzęt zużywa się co sezon — jak nic nie zrobisz, będziesz zbierał defekty.</div>`}
 <div class="p-3 pt-0 grid md:grid-cols-2 gap-3">
 <div class="brut"><div class="brut-h px-3 py-1 text-[11px] text-sky-400 font-bold flex justify-between gap-2">
   <span>TUNER — BAZA SPRZĘTOWA</span><span class="text-zinc-400">próg = wymagany PROFESJONALIZM</span></div>
 <div class="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
  ${TUNERS.map((t,i)=>{const bought=W.bought.includes(i), afford=p.budget>=t.c, prof=p.prof>=(t.prof||0);
   const ok=afford&&prof;
   return `<div class="flex items-center justify-between gap-2 border-b border-zinc-700 pb-1.5 ${bought?'opacity-70':''} ${!prof?'opacity-60':''}">
    <div><div class="text-[11px] ${bought?'text-emerald-400':prof?'text-zinc-200':'text-zinc-300'}">${bought?'✔ ':''}${!prof?'🔒 ':''}${t.n}</div>
    <div class="text-[11px] text-zinc-400">+${t.e} Sprzęt${t.risk?` · ${t.risk}% ryzyka bubla`:''}${bought?' · KUPIONE':''}
    ${t.prof?` · <span class="${prof?'text-lime-600':'text-red-500 font-bold'}">wymaga PROF ${t.prof}</span>`:''}</div>
    ${!prof?`<div class="text-[11px] text-red-500">Tuner nie odda tego sprzętu komuś z profesjonalizmem ${p.prof}. Najpierw pokaż, że umiesz o niego zadbać.</div>`
      :!afford?`<div class="text-[11px] text-zinc-400">brakuje ${zl(t.c-p.budget)}</div>`:''}</div>
    <button onclick="buyTuner(${i})" ${ok?'':'disabled'} class="btn px-2 py-1 text-[11px] whitespace-nowrap ${ok?'':'opacity-30 cursor-not-allowed'}">${zl(t.c)}</button>
  </div>`;}).join('')}
 </div></div>
 <div class="brut"><div class="brut-h px-3 py-1 text-[11px] text-yellow-400 font-bold flex justify-between gap-2">
   <span>MECHANIK — JAKOŚĆ OBSŁUGI</span><span class="text-zinc-400">obecny: ${p.mech}/99</span></div>
 <div class="p-2 text-[11px] text-zinc-400 border-b border-zinc-700">
   Mechanik bierze <b class="text-orange-400">${Math.round((ECON.mechSeason||0.55)*100)}% ceny CO SEZON</b> — nie zapłacisz, zrywa współpracę. Zatrudniasz JEDNEGO na sezon. Gorszego od obecnego (${p.mech}) nie da się kliknąć — kasa nie znika
   za nic. Przy zmianie na lepszego odzyskujesz <b class="text-zinc-300">${Math.round(ECON.mechBuyout*100)}% ceny obecnego</b>
   (odstępne od klubu, który go przejmie)${p.mechCost?': dziś '+zl(Math.round(p.mechCost*ECON.mechBuyout)):' — mechanik z łapanki nie jest nic wart'}.
 </div>
 <div class="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
  ${MECHS.map((m,i)=>{
   const cur=p.mechName===m.n, prof=p.prof>=(m.prof||0);
   const worse = !cur && m.q<=p.mech;                         // BLOKADA: nie kupujesz sobie gorszego
   const buyout = mechBuyout();
   const net = Math.max(0, m.c-buyout);
   const afford = p.budget>=net;
   const ok = afford && prof && !cur && !worse;
   return `<div class="flex items-center justify-between gap-2 border-b border-zinc-700 pb-1.5 ${cur?'bg-[rgba(234,179,8,.07)]':''} ${(!prof||worse)&&!cur?'opacity-60':''}">
    <div><div class="text-[11px] ${cur?'text-yellow-400 font-bold':worse?'text-zinc-500':prof?'text-zinc-200':'text-zinc-300'}">${cur?'✔ ':''}${worse?'⊘ ':''}${!prof&&!cur&&!worse?'🔒 ':''}${m.n}</div>
    <div class="text-[11px] text-zinc-400">Jakość ${m.q}/99 · na cały sezon${cur?' · ZATRUDNIONY':''}
    ${m.prof?` · <span class="${prof?'text-lime-600':'text-red-500 font-bold'}">wymaga PROF ${m.prof}</span>`:''}
    ${(!cur&&!worse&&buyout>0)?` · <span class="text-emerald-500">netto ${zl(net)} po odstępnym</span>`:''}</div>
    ${worse?`<div class="text-[11px] text-zinc-500">Słabszy od twojego obecnego (${p.mech}/99). Klub nie zwraca różnicy, więc gra na to nie pozwala.</div>`
      :!prof&&!cur?`<div class="text-[11px] text-red-500">Nie podpisze się pod zawodnikiem z profesjonalizmem ${p.prof}. Ma nazwisko do stracenia.</div>`
      :!afford&&!cur?`<div class="text-[11px] text-zinc-400">brakuje ${zl(net-p.budget)}</div>`:''}</div>
    ${cur?'<span class="text-[11px] text-yellow-500 border border-yellow-800 px-2 py-1 whitespace-nowrap">TWÓJ</span>'
        :worse?'<span class="text-[11px] text-zinc-500 border border-zinc-700 px-2 py-1 whitespace-nowrap">GORSZY</span>'
        :`<button onclick="hireMech(${i})" ${ok?'':'disabled'} class="btn px-2 py-1 text-[11px] whitespace-nowrap ${ok?'':'opacity-30 cursor-not-allowed'}">${zl(m.c)}</button>`}
  </div>`;}).join('')}
 </div></div></div>
 <div class="px-3 pb-3">${accLite('DLACZEGO NIEKTÓRY SPRZĘT JEST ZABLOKOWANY I ILE KOSZTUJE ZUŻYCIE', `
  <div class="text-[11px] text-zinc-400 leading-relaxed">
  Górna półka jest zamknięta nie tylko przez cenę: tuner z czterema silnikami i sztab z Anglii patrzą też na to,
  jak pracujesz. <b class="text-zinc-300">Podnieś PROFESJONALIZM</b> (pełne sezony w składzie, brak wykluczeń, trener od startów),
  a odblokujesz sprzęt, którego za same pieniądze nie kupisz.
  <div class="mt-2 border-t border-zinc-700 pt-2">
   <b class="text-red-400">SPRZĘT SIĘ ZAJEŻDŻA.</b> Pełny sezon zawodowca to około
   <b class="text-zinc-300">-16 do -26 pkt sprzętu</b> (zużycie rośnie z liczbą odjechanych biegów, kraksa dokłada swoje),
   a po sezonie przychodzi rachunek za serwis: <b class="text-zinc-300">${zl(servicePreview())}</b> przy twoim obecnym przebiegu i sprzęcie.
   Rok bez wizyty u tunera = defekty na prostej.
  </div>
 </div>`)}</div></div>`;
}
function buyTuner(i){const t=TUNERS[i],p=G.p;
 if(p.budget<t.c || p.prof<(t.prof||0)) return;
 p.budget-=t.c; p.shop.spent+=t.c; p.shop.bought.push(i);
 if(t.risk&&chance(t.risk)){const g=Math.max(0,Math.round(t.e*0.2)-4);p.equip=cl(p.equip+g,1,99);p.shop.equipGain+=g;
   p.shop.log.push(t.n+' — BUBEL, sprzęt ledwo drgnął ('+(g>=0?'+':'')+g+')');}
 else {p.equip=cl(p.equip+t.e,1,99);p.shop.equipGain+=t.e;p.shop.log.push(t.n+' (+'+t.e+' Sprzęt)');}
 render();}
/* Ile odzyskasz, oddając obecnego mechanika (odstępne od nowego pracodawcy). */
function mechBuyout(){ return Math.round((G.p.mechCost||0)*ECON.mechBuyout); }
/* Szacunkowy rachunek za serwis posezonowy — żeby gracz widział, co go czeka. */
function servicePreview(){
 const p=G.p, h=G.history.length?G.history[G.history.length-1]:null;
 const run=h?(h.heats+((h.po&&h.po.h)||0)):55;
 return Math.round(ECON.svcBase + run*ECON.svcPerHeat + p.equip*ECON.svcEquipW);
}
function hireMech(i){const m=MECHS[i],p=G.p;
 /* BLOKADA NADPISANIA: gorszy (albo równy) mechanik to wyrzucanie pieniędzy —
    wcześniej kliknięcie tańszej pozycji podmieniało dobrego fachowca bez ostrzeżenia
    i bez grosza rekompensaty. */
 if(p.mechName===m.n || m.q<=p.mech) return;
 if(p.prof<(m.prof||0)) return;
 const buyout=mechBuyout();
 const net=Math.max(0,m.c-buyout);
 if(p.budget<net) return;
 p.budget-=net; p.shop.spent+=net;
 const old=p.mechName;
 p.mech=m.q; p.mechName=m.n; p.mechCost=m.c;
 p.shop.log=p.shop.log.filter(l=>!l.startsWith('Mechanik: '));
 p.shop.log.push('Mechanik: '+m.n+' (jakość '+m.q+')'+
   (buyout>0?' · odstępne za '+old+': +'+zl(buyout)+', koszt netto '+zl(net):''));
 p.shop.mechHired=true; render();}
