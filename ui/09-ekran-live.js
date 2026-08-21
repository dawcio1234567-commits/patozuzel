/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: EKRAN LIVE
   Cały interfejs jazdy na żywo
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 1163-1391 oryginału).
   PATCH 22.08.2026 (Sprint 3): pasek trenera (kim jest, co o tobie myśli,
   ile mu się pali pod nogami) i ALERT REGULAMINOWY — jedno zdanie, które
   trener mówi każdemu, kto prosi o coś, czego regulamin nie przewiduje.
   ============================================================ */
/* ============================================================
   EKRAN: JAZDA NA ŻYWO
   ------------------------------------------------------------
   Jeden ekran obsługuje obie odmiany: mecz drużynowy (G.live.kind
   niezdefiniowany) i turniej indywidualny (kind==='ind').
   ============================================================ */
function liveHeadBar(L){
 const ind = L.kind==='ind';
 return `<div class="brut-h px-3 py-2 flex justify-between items-center flex-wrap gap-2" style="border-color:#f97316">
   <div>
     <div class="text-[10px] text-zinc-500 tracking-[.25em]">${ind?'TURNIEJ NA ŻYWO':'MECZ NA ŻYWO'} // ${G.year}</div>
     <div class="text-orange-500 font-extrabold tracking-wider text-[13px]">${esc(L.title||L.stage||'')}</div>
   </div>
   ${ind ? `<div class="text-right"><div class="text-[10px] text-zinc-500 tracking-widest">TWÓJ DOROBEK</div>
     <div class="text-[20px] font-extrabold text-zinc-100">${L.me?L.me.pts:0} <span class="text-[11px] text-zinc-500">pkt</span></div></div>`
   : `<div class="text-right">
      <div class="text-[10px] text-zinc-500 tracking-widest">${esc(L.home)} — ${esc(L.away)}</div>
      <div class="text-[22px] font-extrabold tracking-wider ${L.mySide==='h'?(L.hs>=L.as?'text-emerald-400':'text-red-400'):(L.as>=L.hs?'text-emerald-400':'text-red-400')}">
        ${L.hs}:${L.as}</div></div>`}
 </div>`;
}
/* Tor + zębatka + mechanik — pasek widoczny w parku maszyn i w biegu. */
function liveTrackBox(L, editable){
 if(L.grip==null) return '';
 const fitCol = L.ideal!=null ? (L.fit<=0?'#22c55e':L.fit===1?'#84cc16':L.fit===2?'#eab308':'#ef4444') : '#71717a';
 return `<div class="brut mb-3">
  <div class="brut-h px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest">TOR I MOTOCYKL</div>
  <div class="p-3">
   <div class="flex justify-between items-baseline flex-wrap gap-2 mb-1">
     <div class="text-[13px] font-extrabold text-orange-400">PRZYCZEPNOŚĆ: ${esc(L.grip.n)}</div>
     <div class="text-[10px] text-zinc-500 tracking-widest">stan toru zmienia się co bieg</div>
   </div>
   <div class="text-[11.5px] text-zinc-300 leading-relaxed mb-3">${esc(L.grip.d)}</div>
   <div class="text-[10px] text-zinc-500 tracking-widest mb-1">ZĘBATKA (0 = najkrótsza, 5 = najdłuższa)</div>
   <div class="flex gap-1 flex-wrap mb-2">
     ${[0,1,2,3,4,5].map(i=>`<button ${editable?`onclick="liveAct('gear',${i})"`:'disabled'}
       class="${i===L.gear?'btn':'btn'} px-3 py-2 text-[12px] font-bold"
       style="${i===L.gear?'background:#f97316;color:#000;border-color:#fdba74':''}${editable?'':';opacity:.55;cursor:default'}">${i}</button>`).join('')}
     <div class="text-[11px] text-zinc-400 self-center ml-2">${esc(BIGM.gearTxt[L.gear])}</div>
   </div>
   ${L.ideal!=null
     ? `<div class="text-[11.5px] font-bold" style="color:${fitCol}">PODEJRZANE U RYWALA: dziś jedzie zębatka <b>${L.ideal}</b> — ${esc(BIGM.fitTxt[L.fit])}.</div>`
     : `<div class="text-[11px] text-zinc-500">Idealnej zębatki nie widzisz. Widzisz tor i mechanika.</div>`}
   ${L.mech?`<div class="text-[12px] text-zinc-200 mt-2 border-l-2 border-zinc-600 pl-3">
     <b class="text-zinc-400">${esc(G.p.mechName)}:</b> ${esc(L.mech.txt)}
     <div class="text-[10px] text-zinc-500 mt-0.5">trafność podpowiedzi tego mechanika: ok. ${L.mech.acc}%</div></div>`:''}
  </div>
 </div>`;
}
function liveMsgBox(L){
 if(!L.msgs || !L.msgs.length) return '';
 return `<div class="brut mb-3" style="border-color:#f97316">
  <div class="p-3">${L.msgs.map(m=>`<div class="text-[12.5px] text-zinc-100 leading-relaxed mb-1.5">› ${esc(m)}</div>`).join('')}</div>
 </div>`;
}
/* Pasek trenera (liveCoachBar), alert regulaminowy (liveRefuseBox)
   i kask przy nazwisku (helmetDot) siedzą w ui/09b-live-trener.js. */
/* Wspólne akcje parku maszyn. */
function livePitActions(L, full){
 const b=[];
 b.push(`<button onclick="liveAct('spy')" class="btn w-full text-left px-3 py-2 text-[12px]">
   <b>PODEJRZYJ SPRZĘT RYWALA</b> <span class="text-zinc-500">— ${BIGM.spyOk}% powodzenia</span>
   <div class="text-[10.5px] text-zinc-400 mt-0.5">Udane: wiesz, jaka zębatka jedzie dziś na tym torze (i jedziesz odrobinę pewniej).
   Nieudane: żółta kartka i ${zl(BIGM.yellowCost)}. <b>Dwie żółte w jednych zawodach robią czerwoną</b>,
   a czerwona to wykluczenie („w") we wszystkich twoich pozostałych biegach.</div></button>`);
 if(full && L.push && L.push.show){
   /* SPRINT 3: przycisk zostaje AKTYWNY także wtedy, gdy regulamin zabrania —
      bo to gracz ma usłyszeć od trenera, dlaczego nie. Kliknięcie w wersji
      zablokowanej nie rzuca kością: wraca alert z jednym zdaniem. */
   const blocked = L.push.legal===false;
   b.push(`<button onclick="liveAct('push')" class="${blocked?'btn-d':'btn'} w-full text-left px-3 py-2 text-[12px]"
     ${blocked?'style="border-color:#dc2626"':''}>
     <b>PRESJA NA TRENERZE, ŻEBY CIĘ WPUŚCIŁ ZA KOGOŚ</b>
     ${blocked ? `<span style="color:#fca5a5">— REGULAMIN TEGO ZABRANIA</span>`
               : `<span class="text-zinc-500">— ${L.push.chance}% powodzenia${L.push.who?' (za: '+esc(L.push.who)+')':''}</span>`}
     <div class="text-[10.5px] mt-0.5 ${blocked?'':'text-zinc-400'}" ${blocked?'style="color:#fca5a5"':''}>${
       blocked ? esc(L.push.block||'')+' Możesz spróbować — usłyszysz, co trener o tym myśli.'
               : 'Udane: wjeżdżasz w najbliższy bieg zamiast kolegi z kadry. Nieudane: w najlepszym razie zbywa cię jednym zdaniem, w najgorszym to CIEBIE zdejmie z twojego własnego biegu.'
     }</div></button>`);
 }
 b.push(`<button onclick="liveAct('hit')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
   <b>PRZYJEBAĆ RYWALOWI W PARKU MASZYN</b>
   <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Prawie zawsze czerwona kartka: wykluczenie („w") we wszystkich pozostałych biegach,
   ${zl(BIGM.redFine)} kary, profesjonalizm −${BIGM.redProf}, ryzyko zawieszenia i rozmowy z prezesem.
   Medialność rośnie. Medialność zawsze rośnie.</div></button>`);
 /* SPRINT 2: PROTEST NA STAN TORU — tylko między biegami (full), tylko dopóki
    masz prawo startu i widziałeś już tor z siodełka. Tańszy niż wyjazd z parku
    i z DEFINICJI niższa szansa na odwołanie meczu. */
 if(full && L.protest && L.protest.show){
   b.push(`<button onclick="liveAct('protest')" class="btn w-full text-left px-3 py-2 text-[12px]" style="border-color:#eab308">
     <b style="color:#fde047">PROTESTUJ ZE WZGLĘDU NA STAN TORU</b>
     <span class="text-zinc-500">— ${L.protest.yellow}% żółtej kartki${L.protest.count?` · protest nr ${L.protest.count+1}`:''}</span>
     <div class="text-[10.5px] text-zinc-400 mt-0.5">Idziesz z kolegami z drużyny do wieży i pokazujesz sędziemu koleinę na drugim łuku.
     <b class="text-zinc-200">${L.protest.cancel}% szans, że sędzia odwoła zawody</b> — zawsze mniej niż przy opuszczeniu parku maszyn,
     bo protest to prośba, a nie szantaż. Cena: ryzyko żółtej kartki (druga w jednych zawodach = czerwona),
     atmosfera w szatni −${(typeof ABANDON!=='undefined'?ABANDON.protestAtm:2)} i rosnąca nerwowość sędziego przy każdym kolejnym proteście.</div></button>`);
 }
 b.push(`<button onclick="liveAct('leave')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
   <b>OPUŚĆ PARK MASZYN</b>
   <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Zmieniony do końca zawodów. Kara umowna ${zl(BIGM.leaveFine)},
   profesjonalizm −${BIGM.leaveProf}, atmosfera −${BIGM.leaveAtm}, lojalność −${BIGM.leaveLoy},
   ponad połowa szans, że klub rozwiąże kontrakt.
   <b>Do tego ${L.leaveCancel!=null?L.leaveCancel:1}% szans, że sędzia uzna twój wyjazd za powód do ODWOŁANIA ZAWODÓW</b>
   — im trudniejszy tor, tym chętniej (od 1% na betonie do 15% na najgorszym).</div></button>`);
 return b.join('');
}
/* Tabela punktowa obu drużyn (mecz) albo tabela turnieju (indywidualne). */
function liveTableBox(L){
 if(L.kind==='ind'){
   const rows=(L.table||[]).slice(0,16);
   return `<div class="brut mb-3">
    <div class="brut-h px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest">TABELA TURNIEJU</div>
    <div class="p-2 overflow-x-auto"><table class="w-full text-[11.5px]">
     ${rows.map(r=>`<tr class="${r.me?'rowhl':''}">
       <td class="text-zinc-500 w-6">${r.pos}.</td>
       <td class="${r.me?'text-orange-400 font-bold':'text-zinc-300'}">${esc(r.name)}</td>
       <td class="text-right font-bold text-zinc-100 w-8">${r.pts}</td>
       <td class="text-right text-zinc-500 w-24">${codesHtml(r.codes||[])}</td></tr>`).join('')}
    </table></div></div>`;
 }
 const side=(rows,name,score,mine)=>`<div>
   <div class="text-[11px] font-bold ${mine?'text-orange-400':'text-zinc-300'} mb-1">${esc(name)} <span class="text-zinc-500">— ${score}</span></div>
   <table class="w-full text-[11.5px]">
   ${rows.map(r=>`<tr class="${r.me?'rowhl':''}">
     <td class="text-zinc-500 w-6">${r.num}</td>
     <td class="${r.me?'text-orange-400 font-bold':'text-zinc-300'}">${esc(r.name)}</td>
     <td class="text-right font-bold text-zinc-100 w-7">${r.pts}</td>
     <td class="text-right text-zinc-500 w-24">${codesHtml(r.codes||[])}</td></tr>`).join('')}
   </table></div>`;
 return `<div class="brut mb-3">
  <div class="brut-h px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest">ZDOBYCZ PUNKTOWA</div>
  <div class="p-3 grid sm:grid-cols-2 gap-4">
    ${side(L.rows.h, L.home, L.hs, L.mySide==='h')}
    ${side(L.rows.a, L.away, L.as, L.mySide==='a')}
  </div></div>`;
}
/* Kolejność w biegu — pokazywana co łuk. */
function liveOrderBox(order, title){
 return `<div class="brut mb-3">
  <div class="brut-h px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest">${esc(title||'KOLEJNOŚĆ NA TORZE')}</div>
  <div class="p-3">
   ${order.map((x,i)=>`<div class="flex justify-between text-[12.5px] py-0.5 ${x.me?'rowhl px-1':''}">
     <span><b class="text-zinc-500 mr-2">${i+1}.</b><span class="${x.me?'text-orange-400 font-bold':'text-zinc-300'}">${esc(x.name)}</span>
     ${x.num?`<span class="text-zinc-600 text-[10px] ml-1">(${x.num})</span>`:''}</span>
     <span class="text-[11px] ${x.out?'text-red-500 font-bold':'text-zinc-600'}">${
       x.out==='d'?'DEFEKT':x.out==='w'?'WYKLUCZONY':x.out==='u'?'UPADEK':''}</span>
   </div>`).join('')}
  </div></div>`;
}
function scLive(){
 const L=G.live;
 if(!L) return head()+`<div class="brut p-5 text-zinc-300">Mecz się zakończył. <button onclick="seasonRoute(seasonStep({a:'go'}))" class="btn px-4 py-2 ml-2">DALEJ</button></div>`;
 const ind = L.kind==='ind';
 let body='';
 if(L.phase==='between'){
   body = liveMsgBox(L) + `
   <div class="brut mb-3">
    <div class="brut-h px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest">PARK MASZYN — CZEKASZ NA SWÓJ BIEG</div>
    <div class="p-3">
     <div class="text-[12.5px] text-zinc-300 mb-3">Najbliższe biegi jadą bez ciebie. Możesz je przepuścić jednym kliknięciem
       — albo zrobić w tym czasie coś, czego regulamin nie przewiduje.</div>
     <button onclick="liveAct('go')" class="btn w-full px-4 py-3 text-[13px] font-extrabold tracking-widest text-orange-500 mb-2">
       PRZESYMULUJ BIEGI DO TWOJEGO STARTU ▸</button>
     ${livePitActions(L, true)}
    </div></div>` + liveTableBox(L);
 } else if(L.phase==='pit'){
   body = liveMsgBox(L) + `
   <div class="brut mb-3" style="border-color:#f97316">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#f97316;color:#fb923c">
      BIEG ${L.next?L.next.label:''} — TWÓJ START. PARK MASZYN</div>
    <div class="p-3">
     ${L.field?`<div class="text-[12px] text-zinc-300 mb-3">
        <div class="text-[10px] text-zinc-500 tracking-widest mb-1">POD TAŚMĄ — POLA 1-4 (gospodarz: czerwony i niebieski, gość: biały i żółty)</div>
        ${L.field.map(f=>`<span class="inline-flex items-center gap-1 mr-3">
          <span class="text-zinc-600 text-[10px]">${f.gate||''}.</span>
          ${helmetDot(f.helmet)}
          <span class="${f.me?'text-orange-400 font-bold':(f.mine?'text-zinc-200':'text-zinc-400')}">${esc(f.name)}</span>
          ${f.num?`<span class="text-zinc-600 text-[10px]">(${f.num})</span>`:''}</span>`).join('')}</div>`:''}
     <button onclick="liveAct('go')" class="btn w-full px-4 py-3 text-[13px] font-extrabold tracking-widest text-orange-500 mb-2">
       WYJAZD NA TOR ▸</button>
     ${livePitActions(L, false)}
    </div></div>` + liveTrackBox(L, true) + liveTableBox(L);
 } else if(L.phase==='coach'){
   const C=L.coach;
   body = liveMsgBox(L) + `
   <div class="brut mb-3" style="border-color:#dc2626">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#dc2626;color:#f87171">
      TRENER CHCE CIĘ ZMIENIĆ${C.coach?' — '+esc(C.coach):''}</div>
    <div class="p-4">
     <div class="text-[12.5px] text-zinc-200 leading-relaxed mb-4">
       Kierownik drużyny idzie w twoją stronę z programem w ręku. Do twojego biegu ma wpisać
       <b class="text-zinc-100">${esc(C.who)}</b> (OVR ${C.ovr}) w ramach rezerwy taktycznej.
       Drużyna traci, a ty w tym spotkaniu nie dowozisz.
       ${C.status?`<div class="text-[11px] text-zinc-400 mt-1">W jego oczach jesteś w tej drużynie:
         <b class="text-zinc-200">${esc(C.status)}</b> (sympatia ${C.rel>0?'+':''}${C.rel}). To już policzone w procentach niżej.</div>`:''}</div>
     <div class="space-y-2">
      <button onclick="liveAct('accept')" class="btn w-full text-left px-3 py-2 text-[12px]">
        <b>ZSIADAM BEZ SŁOWA</b><div class="text-[10.5px] text-zinc-400 mt-0.5">Tracisz start, zyskujesz spokój w szatni.</div></button>
      <button onclick="liveAct('argue')" class="btn w-full text-left px-3 py-2 text-[12px]">
        <b>KŁÓCĘ SIĘ</b> <span class="text-zinc-500">— ${C.argue}% szans</span>
        <div class="text-[10.5px] text-zinc-400 mt-0.5">Udana kłótnia: jedziesz. Nieudana: i tak cię zmienia, a atmosfera siada.</div></button>
      <button onclick="liveAct('insult')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
        <b>WYZYWAM TRENERA</b> <span style="color:#fca5a5">— ${C.insult}% szans</span>
        <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Działa częściej, kosztuje nieporównanie więcej:
        atmosfera w gruzach, profesjonalizm w dół, spora szansa, że prezes zamknie temat kontraktu.</div></button>
     </div>
    </div></div>`;
 } else if(L.phase==='race'){
   const RC=L.race;
   body = liveMsgBox(L) + liveOrderBox(RC.order, 'BIEG '+RC.label+' — '+(RC.ph===0?'USTAWIENIE NA TAŚMIE':'KOLEJNOŚĆ NA TORZE')) + `
   <div class="brut mb-3" style="border-color:#f97316">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#f97316;color:#fb923c">
      ${esc(RC.phaseName)}${RC.pos?' · JEDZIESZ '+RC.pos+'.':''}</div>
    <div class="p-3">
     <div class="text-[11px] text-zinc-500 mb-2">
       zębatka <b class="text-zinc-300">${RC.gear}</b> · ${esc(RC.fitTxt)} ·
       tor: <b class="text-zinc-300">${esc(BIGM.grip[RC.grip].n)}</b>
       ${RC.ph===0?'':' · procenty liczone z twojej dyspozycji, profesjonalizmu, zębatki i stanu toru'}</div>
     <div class="space-y-2">
      ${RC.options.map(o=>`<button onclick="liveAct('${RC.ph===0?'start':'move'}','${o.id}')"
        class="${o.id==='plot'?'btn-d':'btn'} w-full text-left px-3 py-2 text-[12px]">
        <b>${esc(o.l)}</b>${o.ch!=null?` <span class="${o.ch>=60?'text-emerald-400':o.ch>=35?'text-yellow-400':'text-red-400'}">— ${o.ch}%</span>`:''}
        <div class="text-[10.5px] ${o.id==='plot'?'':'text-zinc-400'} mt-0.5" ${o.id==='plot'?'style="color:#fca5a5"':''}>${esc(o.d)}</div></button>`).join('')}
     </div>
     ${RC.sim&&RC.sim.show?`<div class="mt-3 pt-3" style="border-top:1px solid #3f3f46">
      <div class="text-[10px] text-zinc-500 tracking-[.25em] mb-2">POZA REGULAMINEM</div>
      <div class="space-y-2">
       <button onclick="liveAct('simfall')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
         <b>SYMULUJ UPADEK</b> <span style="color:#fca5a5">— ${RC.sim.fallRed}% czerwonej kartki</span>
         <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Kładziesz motocykl sam, żeby sędzia przerwał bieg i kazał go powtórzyć.
         ${RC.sim.behind?'<b>Rywale prowadzą</b>, więc cały stadion wie, po co to robisz — sędzia też'
                        :'Prowadzisz, więc trudniej to uzasadnić, ale i trudniej udowodnić'}.
         Uda się: POWTÓRKA W PEŁNYM SKŁADZIE, z tobą. Nie uda się: czerwona kartka, kod „w" we wszystkich pozostałych biegach.</div></button>
       <button onclick="liveAct('simdef')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
         <b>SYMULUJ DEFEKT</b> <span style="color:#fca5a5">— pewne zero, pewna bura</span>
         <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Podnosisz rękę i zjeżdżasz pod bandę. Silnikowi nic nie jest.
         Kod „d" w karcie, zero punktów i bura w parku maszyn: od rywala, któremu popsułeś bieg —
         albo od <b>kolegi z pary, jeżeli zabierasz mu punkt bonusowy</b>.</div></button>
      </div></div>`:''}
    </div></div>`;
 } else if(L.phase==='fall'){
   /* REJTAN (Sprint 2): leżysz na torze i to TY decydujesz, co dalej. */
   const F=L.fall||{};
   body = liveMsgBox(L) + `
   <div class="brut mb-3" style="border-color:#dc2626">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#dc2626;color:#f87171">
      LEŻYSZ NA TORZE — BIEG ${esc(String(F.label||''))}</div>
    <div class="p-4">
     <div class="text-[12.5px] text-zinc-200 leading-relaxed mb-4">
       ${esc(F.why||'upadek')}${F.pos?` — jechałeś <b class="text-zinc-100">${F.pos}.</b>`:''}.
       Czerwone światła się nie zapaliły. Sędzia patrzy przez lornetkę, karetka stoi w bramie,
       spiker milczy. Masz sekundę.</div>
     <div class="space-y-2">
      <button onclick="liveAct('lie')" class="btn-d w-full text-left px-3 py-2 text-[12px]">
        <b>LEŻ</b>
        <div class="text-[10.5px] mt-0.5" style="color:#fca5a5">Sędzia MUSI przerwać bieg — i MUSI kogoś wskazać.
        Wyklucza ciebie jako sprawcę, wyklucza rywala, który cię dołożył, albo daje ci
        <b>czerwoną kartkę za symulowanie</b>. Do tego szansa, że karetka zabierze cię z toru i skończy ci zawody.</div></button>
      <button onclick="liveAct('getup')" class="btn w-full text-left px-3 py-2 text-[12px]">
        <b>WSTAWAJ I ZBIEGNIJ</b>
        <div class="text-[10.5px] text-zinc-400 mt-0.5">Motocykl zostaje przy bandzie, ty za bandą. Bieg jedzie dalej bez ciebie:
        zero punktów i kod „u" w karcie meczowej — ale żadnej kartki, żadnej komisji i żadnego tłumaczenia się.</div></button>
     </div>
    </div></div>`;
 } else if(L.phase==='abandon'){
   /* ZAWODY ODWOŁANE PRZED PROGIEM — mecz anulowany, będzie powtórka od 0:0. */
   const A=L.abandon||{}, RS=L.result||{};
   body = liveMsgBox(L) + `
   <div class="brut mb-3" style="border-color:#eab308">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest" style="border-color:#eab308;color:#fde047">
      ZAWODY ODWOŁANE</div>
    <div class="p-4 text-center">
     <div class="text-[34px] font-extrabold tracking-wider text-zinc-500 line-through">${L.hs}:${L.as}</div>
     <div class="text-[12px] text-zinc-400 mb-3">${esc(L.home)} — ${esc(L.away)}</div>
     <div class="text-[12.5px] text-zinc-200 leading-relaxed mb-2">${esc(A.why||'sędzia przerwał zawody')}.</div>
     <div class="text-[12.5px] leading-relaxed" style="color:#fde047">
       Odjechano <b>${A.heat||0}</b> ${A.heat===1?'bieg':'biegów'}, regulamin wymaga <b>${A.need||8}</b>.
       MECZ ANULOWANY — wynik nie liczy się do niczego, spotkanie zostanie rozegrane
       <b>od stanu 0:0 w nowym terminie</b>.</div>
     <button onclick="liveAct('go')" class="btn px-8 py-3 mt-4 text-[13px] font-extrabold tracking-widest text-orange-500">DALEJ ▸</button>
    </div></div>` + liveTableBox(L);
 } else if(L.phase==='heatres'){
   const RS=L.result;
   body = liveMsgBox(L) + (RS&&RS.order?liveOrderBox(RS.order,'WYNIK BIEGU '+(L.next?L.next.label:'')):'') + `
   <div class="brut mb-3"><div class="p-3">
     <button onclick="liveAct('go')" class="btn w-full px-4 py-3 text-[13px] font-extrabold tracking-widest text-orange-500">DALEJ ▸</button>
   </div></div>` + liveTableBox(L);
 } else if(L.phase==='end'){
   const RS=L.result||{};
   const win = RS.mine>RS.theirs, draw=RS.mine===RS.theirs;
   body = `<div class="brut mb-3" style="border-color:${win?'#22c55e':draw?'#a1a1aa':'#dc2626'}">
    <div class="brut-h px-3 py-1 text-[10px] font-bold tracking-widest"
      style="border-color:${win?'#22c55e':draw?'#a1a1aa':'#dc2626'};color:${win?'#4ade80':draw?'#d4d4d8':'#f87171'}">
      KONIEC SPOTKANIA</div>
    <div class="p-4 text-center">
     <div class="text-[34px] font-extrabold tracking-wider ${win?'text-emerald-400':draw?'text-zinc-300':'text-red-400'}">${L.hs}:${L.as}</div>
     <div class="text-[12px] text-zinc-400 mb-3">${esc(L.home)} — ${esc(L.away)}</div>
     ${RS.me?`<div class="text-[13px] text-zinc-200">Twój dorobek: <b class="text-orange-400">${RS.me.pts}${RS.me.bon?'+'+RS.me.bon:''} pkt</b>
       z ${RS.me.starts} startów <span class="text-zinc-500">(${RS.me.codes.join(', ')||'—'})</span></div>`
       :`<div class="text-[13px] text-zinc-400">Nie dojechałeś tego spotkania do końca.</div>`}
     <button onclick="liveAct('go')" class="btn px-8 py-3 mt-4 text-[13px] font-extrabold tracking-widest text-orange-500">DALEJ ▸</button>
    </div></div>` + liveTableBox(L);
 } else {
   body = liveMsgBox(L)+`<div class="brut p-3"><button onclick="liveAct('go')" class="btn px-6 py-2 text-orange-500 font-bold">DALEJ ▸</button></div>`;
 }
 /* PASEK DYSCYPLINARNY (Sprint 1): druga żółta = czerwona, a czerwona zabiera
    WSZYSTKIE pozostałe biegi. Gracz musi widzieć, ile ich przepadło i dlaczego. */
 const excTxt = L.excluded ? ` — kod „${L.excludedCode||'w'}" w ${L.excluded} ${
   L.excluded===1?'pozostałym biegu':'pozostałych biegach'}${
   (L.excludedHeats&&L.excludedHeats.length)?` (bieg ${L.excludedHeats.join(', ')})`:''}` : '';
 /* SPRINT 2: pasek „zawody przerwane" — musi być widoczny na KAŻDYM ekranie,
    bo zmienia znaczenie wszystkiego, co gracz właśnie widzi w tabeli. */
 const aband = L.abandon ? `<div class="brut mb-2 px-3 py-2 text-[11.5px] leading-relaxed"
   style="border-color:${L.abandon.counted?'#22c55e':'#eab308'};color:${L.abandon.counted?'#4ade80':'#fde047'}">
   <b>ZAWODY PRZERWANE PO ${L.abandon.heat||0}. BIEGU</b> — ${esc(L.abandon.why||'')}.
   ${L.abandon.counted
     ? `Regulamin uznaje zawody za rozegrane po ${L.abandon.need}. biegu, więc <b>ten wynik jest końcowy</b>.`
     : `Regulamin wymaga ${L.abandon.need} biegów — <b>mecz anulowany i zostanie powtórzony od 0:0</b>.`}</div>` : '';
 const cards = (L.cards&&(L.cards.y||L.cards.r)) || L.outOfMeeting || L.injured
   || L.hurtRivals || L.reruns
   ? `<div class="text-[11px] mb-2">
      ${L.cards&&L.cards.y?`<span class="mr-3" style="color:#eab308">ŻÓŁTE KARTKI: ${L.cards.y}/2</span>`:''}
      ${L.cards&&L.cards.r?`<span class="mr-3" style="color:#ef4444">CZERWONA KARTKA${esc(excTxt)}</span>`:''}
      ${!(L.cards&&L.cards.r)&&L.outOfMeeting?`<span class="mr-3" style="color:#f87171">KONIEC STARTÓW${
         L.outWhy?' — '+esc(L.outWhy):''}${esc(excTxt)}</span>`:''}
      ${L.medSub?`<span class="mr-3" style="color:#38bdf8">ZASTĘPSTWO MEDYCZNE: ${esc(L.medSub)}</span>`:''}
      ${L.twoMin?`<span class="mr-3" style="color:#f87171">BRAK ZASTĘPCY — WYKLUCZENIE ZA LIMIT DWÓCH MINUT</span>`:''}
      ${L.reruns?`<span class="mr-3" style="color:#a1a1aa">POWTÓRKI BIEGU: ${L.reruns}</span>`:''}
      ${L.hurtRivals?`<span style="color:#fb923c">KONTUZJOWANI RYWALE: ${L.hurtRivals}</span>`:''}
     </div>` : '';
 const story = (L.story&&L.story.length>1)
   ? accLite('PRZEBIEG ZAWODÓW — CO SIĘ DZIAŁO', `<div class="text-[11.5px] text-zinc-400 leading-relaxed">
       ${L.story.map(x=>`<div class="mb-1">› ${esc(x)}</div>`).join('')}</div>`) : '';
 return head()+`<div class="fade">
  <div class="brut mb-3" style="border-color:#f97316">${liveHeadBar(L)}</div>
  ${ind?'':liveCoachBar(L)}
  ${liveRefuseBox(L)}
  ${aband}${cards}${body}
  ${L.phase==='race'?liveTrackBox(L, false):''}
  ${story}
 </div>`;
}
