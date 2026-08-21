/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: ZDARZENIA W TRAKCIE ZAWODÓW, WYWIADY, GŁOSY PO MECZU
   Sprint 4 (23.08.2026), poprawiony w Sprincie 5 (24.08.2026).
   Ładuje się MIĘDZY 30 a 31:
       <script src="engine/30-live-park-maszyn.js"></script>
       <script src="engine/30b-live-zdarzenia.js"></script>
       <script src="engine/31-live-mecz.js"></script>
   ------------------------------------------------------------
   Trzy rzeczy, wszystkie czytające dane z data/71-mecz-zdarzenia.js:

     1. ZDARZENIA MIĘDZY BIEGAMI. Losowane w parku maszyn, ze skutkami
        NA TE ZAWODY: dyspozycja w kolejnych biegach (live.formBonus),
        stan toru, ryzyko dwóch minut, kartki, kasa, atmosfera.

     2. WYWIADY. Przed zawodami, w trakcie i po.

     3. PATO-KOMENTARZE POMECZOWE — bigMatchVoices().

   ------------------------------------------------------------
   CO ZMIENIŁ SPRINT 5

   A. MAKSYMALNIE JEDEN WYWIAD NA ZAWODY. Do tej pory limity były trzy
      osobne (`itw_pre`, `itwMid`, `itw_post`), więc w jednym meczu dało się
      zaliczyć wywiad przed, w trakcie i po — a odmowa nie zamykała tematu,
      bo licznik i tak stał na swoim. Teraz jest JEDEN twardy licznik
      `live.itwCount` z limitem `SIDE.itwCap` (domyślnie 1) i podbija go
      SAMO WYLOSOWANIE wywiadu — niezależnie od tego, czy weźmiesz w nim
      udział, czy odmówisz.

   B. TURNIEJ INDYWIDUALNY NIE MA DRUŻYNY. `live.ind` (ustawiane przez
      engine/32-live-turniej.js) wycina wszystko, co zakłada istnienie
      trenera, kierownika drużyny, kolegi z pary i prezesa klubu:
        · zdarzenia oznaczone `team:true` w LIVE_EVENTS nie są losowane,
        · opcje zdarzeń oznaczone `team:true` nie są pokazywane,
        · pytania wywiadu oznaczone `team:true` nie wchodzą do puli,
        · głosy pomeczowe `team:true` (wynik drużyny) nie wypadają,
          a te, które mają wariant `ind`, mówione są przez kogoś innego.
   ============================================================ */

/* Wszystkie gałki w jednym miejscu; `BIGM.side` z data/70 nadpisuje. */
const SIDE = Object.assign({
  evChance   : 26,   // % szans na zdarzenie przy wejściu do parku maszyn
  evCap      : 3,    // maks. zdarzeń na jedne zawody
  evCool     : 2,    // ile biegów przerwy między zdarzeniami
  itwPre     : 45,   // % szans na wywiad PRZED zawodami
  itwMid     : 22,   // % szans na wywiad W TRAKCIE (przy wejściu do parku)
  itwPost    : 60,   // % szans na wywiad PO zawodach
  itwMidCap  : 1,    // ile razy w trakcie zawodów maks.
  itwCap     : 1,    // SPRINT 5: ILE WYWIADÓW NA CAŁE ZAWODY (odmowa też się liczy)
  itwMedK    : 0.35, // ile medialność Gracza podnosi szanse na wywiad
  voices     : 6     // ile pato-komentarzy pokazujemy po meczu
}, (typeof BIGM!=='undefined' && BIGM.side) || {});

/* Czy to zawody BEZ drużyny (turniej indywidualny). */
function liveIsInd(live){ return !!(live && (live.ind || live.kind==='ind')); }

/* ------------------------------------------------------------
   1. ZDARZENIA MIĘDZY BIEGAMI
   ------------------------------------------------------------ */
function liveEventRoll(live, heatNo){
 if(!live || live.abandoned) return null;
 if(!liveCanStart(live)) return null;
 if((live.evDone||0) >= SIDE.evCap) return null;
 if(live.evLast!=null && (heatNo||0) - live.evLast < SIDE.evCool) return null;
 if(!chance(SIDE.evChance)) return null;
 const ind=liveIsInd(live);
 const used=live.evUsed||(live.evUsed=[]);
 /* SPRINT 5: w turnieju indywidualnym nie ma trenera, kierownika drużyny,
    prezesa „naszego" klubu ani kolegi z pary — te zdarzenia po prostu
    nie mają w kim się odbyć, więc wypadają z puli. */
 const pool=LIVE_EVENTS.filter(e=>!used.includes(e.id) && !(ind && e.team));
 if(!pool.length) return null;
 const ev=pick(pool);
 used.push(ev.id);
 live.evDone=(live.evDone||0)+1;
 live.evLast=heatNo||0;
 return ev;
}
/* Kształt zdarzenia dla interfejsu (bez funkcji — te zostają w silniku). */
function liveEventView(ev, live){
 const ind=liveIsInd(live);
 return {id:ev.id, t:ev.t, d:ev.d,
   opts:ev.opts.filter(o=>!(ind && o.team)).map(o=>({id:o.id, l:o.l, d:o.d||''}))};
}
function liveEventApply(live, ev, optId, out){
 out=out||[];
 if(!ev) return out;
 const ind=liveIsInd(live);
 const pool=ev.opts.filter(o=>!(ind && o.team));
 const o = pool.find(x=>x.id===optId) || pool[0] || ev.opts[0];
 out.push('ZDARZENIE — '+ev.t);
 let r=null;
 try{ r = o.f ? o.f(live, {p:G.p, S:G.S, live}) : null; }
 catch(err){ r = 'Coś się wydarzyło, ale nikt tego nie zapisał.'; }
 (Array.isArray(r)?r:[r]).filter(Boolean).forEach(x=>out.push(x));
 (live.evLog=live.evLog||[]).push({t:ev.t, opt:o.l});
 return out;
}

/* ------------------------------------------------------------
   2. WYWIADY — MAKSYMALNIE JEDEN NA ZAWODY (Sprint 5)
   ------------------------------------------------------------ */
function liveItwChance(when){
 const med = (G&&G.p)?G.p.med:40;
 const base = when==='pre'?SIDE.itwPre : when==='mid'?SIDE.itwMid : SIDE.itwPost;
 return Math.round(cl(base + (med-40)*SIDE.itwMedK, 4, 95));
}
/* Czy w tych zawodach zostało jeszcze miejsce na wywiad. */
function liveItwLeft(live){
 return !!live && (live.itwCount||0) < (SIDE.itwCap==null?1:SIDE.itwCap);
}
function liveItwRoll(live, when){
 if(!live) return null;
 /* TWARDY LIMIT NA CAŁE ZAWODY. Liczy się KAŻDY wywiad, który się pojawił —
    także ten, z którego się wywinąłeś. „Odmówił" to też materiał. */
 if(!liveItwLeft(live)) return null;
 if(when==='mid' && (live.itwMid||0) >= SIDE.itwMidCap) return null;
 if(live['itw_'+when]) return null;
 if(!chance(liveItwChance(when))) return null;
 const ind=liveIsInd(live);
 /* trzy pytania z puli danego momentu, bez powtórek;
    w turnieju indywidualnym bez pytań o trenera, drużynę i gospodarzy */
 const pool=(LIVE_ITW.q[when]||[]).filter(q=>!(ind && q.team));
 if(pool.length<1) return null;
 const bag=pool.slice(), q=[];
 while(q.length<3 && bag.length) q.push(bag.splice(R(0,bag.length-1),1)[0]);
 live.itwCount=(live.itwCount||0)+1;
 if(when==='mid') live.itwMid=(live.itwMid||0)+1; else live['itw_'+when]=true;
 return {when, who:pick(LIVE_ITW.who[when]||['DZIENNIKARZ']),
   intro:LIVE_ITW.intro[when]||'', q};
}
/* Kształt jednego pytania dla interfejsu. */
function liveItwQView(it, i){
 const Q=it.q[i];
 return {when:it.when, who:it.who, intro:it.intro, i, n:it.q.length,
   q:Q.q, opts:Q.a.map((a,k)=>({id:String(k), l:a.l}))};
}
function liveItwAnswer(live, it, i, optId, out){
 out=out||[];
 const Q=it.q[i]; if(!Q) return out;
 const a=Q.a[Number(optId)] || Q.a[0];
 const p=G.p, S=G.S;
 if(a.prof){ p.prof=cl(p.prof+a.prof,0,99); if(S) S.bigProf=(S.bigProf||0)+a.prof; }
 if(a.med ){ p.med =cl(p.med +a.med ,0,99); if(S) S.bigMed =(S.bigMed ||0)+a.med;  }
 if(a.form){ live.formBonus=(live.formBonus||0)+a.form; }
 out.push('„'+a.l.replace(/^„|"$/g,'')+'" — '+a.txt+
   ' ('+[a.prof?('profesjonalizm '+(a.prof>0?'+':'')+a.prof):null,
        a.med ?('medialność '+(a.med>0?'+':'')+a.med):null,
        a.form?('dyspozycja '+(a.form>0?'+':'')+a.form.toFixed(1)):null]
      .filter(Boolean).join(', ')+')');
 live.itwGiven=(live.itwGiven||0)+1;
 return out;
}
function liveItwRefuse(live, it, out){
 out=out||[];
 const r=LIVE_ITW.refuse[it.when]||{};
 const p=G.p, S=G.S;
 if(r.prof){ p.prof=cl(p.prof+r.prof,0,99); if(S) S.bigProf=(S.bigProf||0)+r.prof; }
 if(r.med ){ p.med =cl(p.med +r.med ,0,99); if(S) S.bigMed =(S.bigMed ||0)+r.med;  }
 if(r.form){ live.formBonus=(live.formBonus||0)+r.form; }
 live.itwRefused=(live.itwRefused||0)+1;
 out.push('ODMAWIASZ WYWIADU. '+(r.txt||''),
   'Na dziś temat zamknięty — więcej mikrofonów w tych zawodach już nie będzie.');
 return out;
}

/* ------------------------------------------------------------
   WSPÓLNY KROK „POZA TOREM" — zdarzenie + wywiad.
   ------------------------------------------------------------ */
function* liveSideGen(live, snap, say, when, heatNo){
 if(!live || live.abandoned) return;
 /* --- ZDARZENIE (tylko między biegami / przed biegiem) --- */
 if(when!=='post'){
   const ev=liveEventRoll(live, heatNo);
   if(ev){
     const act = yield snap('mevent', {mevent:liveEventView(ev, live)});
     liveEventApply(live, ev, (act&&act.v)||null, []).forEach(x=>say(x));
   }
 }
 /* --- WYWIAD --- */
 const it=liveItwRoll(live, when);
 if(!it) return;
 const ask = yield snap('itw', {itw:{stage:'ask', when:it.when, who:it.who,
   intro:it.intro, n:it.q.length, chance:liveItwChance(it.when),
   only:true}});
 if((ask&&ask.a)==='itwno'){ liveItwRefuse(live, it, []).forEach(x=>say(x)); return; }
 for(let i=0;i<it.q.length;i++){
   const act = yield snap('itw', {itw:Object.assign({stage:'q'}, liveItwQView(it,i))});
   liveItwAnswer(live, it, i, (act&&act.v)!=null?act.v:'0', []).forEach(x=>say(x));
 }
 say('Wywiad ('+it.who+') skończony. Materiał pójdzie wieczorem, cokolwiek powiedziałeś.');
}

/* ------------------------------------------------------------
   3. PATO-KOMENTARZE POMECZOWE
   ------------------------------------------------------------
   Wejście: {mine, theirs, ind, me:{starts,pts,bon,codes}, live:{...}}.
   Wyjście: tablica {who, txt} — gotowa do wyrenderowania.

   SPRINT 5: w turnieju indywidualnym głosy oznaczone `team:true`
   (wynik drużyny) nie wypadają w ogóle, a te, które mają wariant `ind`,
   mówi ktoś, kto naprawdę tam jest — bo kolegi z pary i kierownika
   drużyny na turnieju indywidualnym po prostu nie ma.
   ------------------------------------------------------------ */
function bigMatchVoices(info){
 const V=[], used={};
 const ind=!!info.ind;
 const add=(key)=>{
   const box=LIVE_TALK[key];
   if(!box) return;
   if(used[key]) return;
   if(ind && box.team) return;                       // wynik drużyny — nie w indywidualnych
   const src = (ind && box.ind) ? box.ind : box;     // wariant „bez drużyny"
   if(!src.lines || !src.lines.length) return;
   used[key]=true;
   V.push({who:src.who||box.who, txt:pick(src.lines)});
 };
 const me=info.me||{}, L=info.live||{};
 const st=me.starts||0, pts=(me.pts||0)+(me.bon||0);
 const avg=st?pts/st:0;
 /* wynik drużyny (mecz drużynowy) */
 if(!ind && info.mine!=null && info.theirs!=null){
   const d=info.mine-info.theirs;
   add(d>=14?'winBig' : d>0?'win' : d===0?'draw' : d<=-14?'loseBig':'lose');
 }
 /* twój dorobek */
 if(st===0 || pts===0) add('meZero');
 else if(avg>=2.2) add('meGreat');
 else if(avg>=1.5) add('meGood');
 else if(avg>=0.9) add('meMeh');
 else add('meBad');
 /* wyczyny */
 if(L.ajsOk)     add('ajsOk');
 if(L.ajsFail)   add('ajsFail');
 if(L.nozyceOk)  add('nozyce');
 if(L.crashed)   add('crash');
 if((L.yellow||0)||L.red) add('cards');
 if(L.lateCount) add('late');
 if(L.mechAuto)  add('auto');
 if((L.itwGiven||0)>=3)   add('itw');
 else if(L.itwRefused)    add('quiet');
 add('always');
 /* dobijamy do SIDE.voices, jeżeli jest z czego (bez głosów drużynowych) */
 const rest=Object.keys(LIVE_TALK).filter(k=>!used[k] && !(ind && LIVE_TALK[k].team));
 while(V.length<SIDE.voices && rest.length){
   add(rest.splice(R(0,rest.length-1),1)[0]);
 }
 return V.slice(0, SIDE.voices);
}
