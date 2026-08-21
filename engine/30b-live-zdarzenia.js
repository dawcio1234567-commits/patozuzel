/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: ZDARZENIA W TRAKCIE ZAWODÓW, WYWIADY, GŁOSY PO MECZU
   Sprint 4 (23.08.2026). Ładuje się MIĘDZY 30 a 31:
       <script src="engine/30-live-park-maszyn.js"></script>
       <script src="engine/30b-live-zdarzenia.js"></script>   ← TO DOPISZ
       <script src="engine/31-live-mecz.js"></script>
   ------------------------------------------------------------
   Trzy rzeczy, wszystkie czytające dane z data/71-mecz-zdarzenia.js:

     1. ZDARZENIA MIĘDZY BIEGAMI. Losowane w parku maszyn, ze skutkami
        NA TE ZAWODY: dyspozycja w kolejnych biegach (live.formBonus),
        stan toru, ryzyko dwóch minut, kartki, kasa, atmosfera.
        Odpowiednik zdarzeń sezonowych, tylko że skutek widać od razu.

     2. WYWIADY. Przed zawodami, w trakcie i po. Możesz odmówić albo
        wziąć udział — wtedy trzy pytania kompletnie z dupy i trzy
        odpowiedzi, z których każda coś rusza w profesjonalizmie,
        medialności albo w twojej głowie na kolejny bieg.

     3. PATO-KOMENTARZE POMECZOWE — bigMatchVoices(). Zestaw głosów
        o TWOIM występie i o wyniku drużyny, w stylu głosów z końca sezonu.
        Renderuje je ui/09 (ekran końca meczu) i ui/12 (raport sezonu).

   WSPÓLNE DLA OBU GENERATORÓW. liveSideGen() jest generatorem, więc
   wołasz go przez `yield*` — i mecz drużynowy (engine/31), i turniej
   indywidualny (engine/32) używają dokładnie tego samego kodu.
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
  itwMedK    : 0.35, // ile medialność Gracza podnosi szanse na wywiad
  voices     : 6     // ile pato-komentarzy pokazujemy po meczu
}, (typeof BIGM!=='undefined' && BIGM.side) || {});

/* ------------------------------------------------------------
   1. ZDARZENIA MIĘDZY BIEGAMI
   ------------------------------------------------------------ */
function liveEventRoll(live, heatNo){
 if(!live || live.abandoned) return null;
 if(!liveCanStart(live)) return null;
 if((live.evDone||0) >= SIDE.evCap) return null;
 if(live.evLast!=null && (heatNo||0) - live.evLast < SIDE.evCool) return null;
 if(!chance(SIDE.evChance)) return null;
 const used=live.evUsed||(live.evUsed=[]);
 const pool=LIVE_EVENTS.filter(e=>!used.includes(e.id));
 if(!pool.length) return null;
 const ev=pick(pool);
 used.push(ev.id);
 live.evDone=(live.evDone||0)+1;
 live.evLast=heatNo||0;
 return ev;
}
/* Kształt zdarzenia dla interfejsu (bez funkcji — te zostają w silniku). */
function liveEventView(ev){
 return {id:ev.id, t:ev.t, d:ev.d,
   opts:ev.opts.map(o=>({id:o.id, l:o.l, d:o.d||''}))};
}
function liveEventApply(live, ev, optId, out){
 out=out||[];
 if(!ev) return out;
 const o = ev.opts.find(x=>x.id===optId) || ev.opts[0];
 out.push('ZDARZENIE — '+ev.t);
 let r=null;
 try{ r = o.f ? o.f(live, {p:G.p, S:G.S, live}) : null; }
 catch(err){ r = 'Coś się wydarzyło, ale nikt tego nie zapisał.'; }
 (Array.isArray(r)?r:[r]).filter(Boolean).forEach(x=>out.push(x));
 (live.evLog=live.evLog||[]).push({t:ev.t, opt:o.l});
 return out;
}

/* ------------------------------------------------------------
   2. WYWIADY
   ------------------------------------------------------------ */
function liveItwChance(when){
 const med = (G&&G.p)?G.p.med:40;
 const base = when==='pre'?SIDE.itwPre : when==='mid'?SIDE.itwMid : SIDE.itwPost;
 return Math.round(cl(base + (med-40)*SIDE.itwMedK, 4, 95));
}
function liveItwRoll(live, when){
 if(!live) return null;
 if(when==='mid' && (live.itwMid||0) >= SIDE.itwMidCap) return null;
 if(live['itw_'+when]) return null;
 if(!chance(liveItwChance(when))) return null;
 if(when==='mid') live.itwMid=(live.itwMid||0)+1; else live['itw_'+when]=true;
 /* trzy pytania z puli danego momentu, bez powtórek */
 const pool=(LIVE_ITW.q[when]||[]).slice();
 const q=[];
 while(q.length<3 && pool.length) q.push(pool.splice(R(0,pool.length-1),1)[0]);
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
 out.push('ODMAWIASZ WYWIADU. '+(r.txt||''));
 return out;
}

/* ------------------------------------------------------------
   WSPÓLNY KROK „POZA TOREM" — zdarzenie + wywiad.
   Generator: woła się przez `yield*`. `snap` i `say` podaje generator
   meczu albo turnieju, więc ten sam kod obsługuje oba tryby.
   ------------------------------------------------------------ */
function* liveSideGen(live, snap, say, when, heatNo){
 if(!live || live.abandoned) return;
 /* --- ZDARZENIE (tylko między biegami / przed biegiem) --- */
 if(when!=='post'){
   const ev=liveEventRoll(live, heatNo);
   if(ev){
     const act = yield snap('mevent', {mevent:liveEventView(ev)});
     liveEventApply(live, ev, (act&&act.v)||null, []).forEach(x=>say(x));
   }
 }
 /* --- WYWIAD --- */
 const it=liveItwRoll(live, when);
 if(!it) return;
 const ask = yield snap('itw', {itw:{stage:'ask', when:it.when, who:it.who,
   intro:it.intro, n:it.q.length, chance:liveItwChance(it.when)}});
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
   ------------------------------------------------------------ */
function bigMatchVoices(info){
 const V=[], used={};
 const add=(key)=>{
   const box=LIVE_TALK[key];
   if(!box || !box.lines || !box.lines.length) return;
   if(used[key]) return;
   used[key]=true;
   V.push({who:box.who, txt:pick(box.lines)});
 };
 const me=info.me||{}, L=info.live||{};
 const st=me.starts||0, pts=(me.pts||0)+(me.bon||0);
 const avg=st?pts/st:0;
 /* wynik drużyny (mecz drużynowy) */
 if(!info.ind && info.mine!=null && info.theirs!=null){
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
 if((L.itwGiven||0)>=3)   add('itw');
 else if(L.itwRefused)    add('quiet');
 add('always');
 /* dobijamy do SIDE.voices, jeżeli jest z czego */
 const rest=Object.keys(LIVE_TALK).filter(k=>!used[k]);
 while(V.length<SIDE.voices && rest.length){
   add(rest.splice(R(0,rest.length-1),1)[0]);
 }
 return V.slice(0, SIDE.voices);
}
