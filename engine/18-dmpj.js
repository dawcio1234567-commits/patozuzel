/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: DMPJ
   Drużynowe Mistrzostwa Polski Juniorów
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2586-2761 oryginału).
   ============================================================ */
/* ============================================================
   5c. DRUŻYNOWE MISTRZOSTWA POLSKI JUNIORÓW
   Cztery stopnie: eliminacje → ćwierćfinały → półfinały → finał.
   Wszystko rozgrywane czwórmeczami: 4 pkt meczowe za I miejsce,
   3 za II, 2 za III, 1 za IV, plus punkty biegowe (art. 804).
   ============================================================ */
/* ------------------------------------------------------------
   CZWÓRMECZ DMPJ — TERAZ SYMULOWANY BIEG PO BIEGU
   ------------------------------------------------------------
   ODPOWIEDŹ NA PYTANIE „czy każdy mecz jest symulowany wg silnika":
   liga i cała faza play-off zawsze szły przez simMeeting (siódemka na drużynę,
   15 biegów), turnieje indywidualne przez tabelę 20-biegową — ale DMPJ było
   jedynym miejscem, gdzie wynik brał się z rzutu kością na poziom drużyny,
   a nie z przejechanych biegów. Od tego patcha czwórmecz też jedzie się realnie:
     · 4 drużyny po 4 juniorów (16 zawodników),
     · 24 biegi, w każdym po jednym zawodniku z każdej drużyny, 3-2-1-0,
     · każdy zawodnik ma 6 startów, defekty i wykluczenia liczone tak samo
       jak w lidze,
     · punkty meczowe 4/3/2/1 wg sumy punktów biegowych (art. 804 ust. 3:
       przy remisie punkty meczowe dzielą się po równo).
   PUNKTÓW BONUSOWYCH TU NIE MA I BYĆ NIE MOŻE: w czwórmeczu każda drużyna ma
   w biegu jednego zawodnika, więc nie istnieje „kolega z pary", za którym
   można finiszować. Stąd zniknęły gwiazdki z linii DMPJ.
   ------------------------------------------------------------ */
function dmpjSquad(team, ctx, myTeam){
 const real=squadOf(team.name).filter(isJun).sort((a,b)=>b.ovr-a.ovr);
 const ladder=[5,1,-3,-8];
 const out=ladder.map((off,i)=>({
   name: real[i] ? real[i].name : (pick(IMIE)+' '+pick(NAZW)),
   ovr : cl(Math.round(team.ovr+off+gauss(0,2.2)),5,95),
   team: team.name, me:false
 }));
 if(ctx && myTeam && team.name===myTeam){
   out[0]={name:G.p.name, ovr:cl(Math.round(ctx.meOvr||team.ovr+5),1,99), team:team.name, me:true};
 }
 return out;
}
function quad(teams, ctx, myTeam){
 /* Stawka czwórmeczu: 4 drużyny × 4 zawodników. */
 const squads=teams.map(t=>dmpjSquad(t, ctx, myTeam));
 const all=[]; squads.forEach((sq,ti)=>sq.forEach((r,ri)=>all.push({...r, ti, ri, pts:0, bon:0, starts:0, codes:[]})));
 const ref=all.reduce((a,r)=>a+r.ovr,0)/Math.max(1,all.length);
 /* Program: każdy zawodnik po 6 startów, w każdym biegu po jednym z drużyny. */
 const HEATS=24;
 const prog=squads.map((sq,ti)=>{
   const seq=[]; for(let i=0;i<4;i++) for(let k=0;k<6;k++) seq.push(i);
   return shuffle(seq);
 });
 const heats=[];
 for(let h=0; h<HEATS; h++){
   const entries=all.filter(r=>prog[r.ti][h]===r.ri);
   if(entries.length<2) continue;
   const res=entries.map(r=>{
     const dP = r.me&&ctx ? ctx.defP : cl(0.030+(62-r.ovr)*0.0007, 0.014, 0.13);
     const eP = r.me&&ctx ? ctx.excP : cl(0.026+(58-r.ovr)*0.0005, 0.010, 0.07);
     const rr=Math.random();
     const out = rr<dP ? 'd' : rr<dP+eP ? 'w' : null;
     return {r, out, str: rideStr(r.ovr, ref, 0)};
   });
   const fin=res.filter(x=>!x.out).sort((a,b)=>b.str-a.str);
   fin.forEach((x,i)=>x.pts=[3,2,1,0][i]);
   res.forEach(x=>{ if(x.out) x.pts=0; });
   res.forEach(x=>{ x.r.starts++; x.r.pts+=x.pts; x.r.codes.push(x.out||String(x.pts)); });
   heats.push({label:h+1, res:res.map(x=>({name:x.r.name, team:x.r.team, pts:x.pts, out:x.out, me:x.r.me}))});
 }
 /* Tabela drużynowa. */
 const rows=teams.map((t,ti)=>({name:t.name, hp: all.filter(r=>r.ti===ti).reduce((a,r)=>a+r.pts,0)}));
 rows.sort((a,b)=>b.hp-a.hp);
 // art. 804 ust. 3 — przy równych punktach biegowych dzielimy punkty meczowe
 let i=0;
 while(i<rows.length){
   let j=i; while(j+1<rows.length && rows[j+1].hp===rows[i].hp) j++;
   const share=[];for(let k=i;k<=j;k++) share.push(4-k);
   const val=share.reduce((a,b)=>a+b,0)/share.length;
   for(let k=i;k<=j;k++){rows[k].mp=val;rows[k].tied=j>i;}
   i=j+1;
 }
 const meR=all.find(r=>r.me);
 const me = (ctx && myTeam && meR)
   ? {h:meR.starts, codes:meR.codes, mp:meR.pts, mb:0,
      d:meR.codes.filter(c=>c==='d').length, w:meR.codes.filter(c=>c==='w').length}
   : null;
 return {rows, me, teams:teams.map(t=>t.name), heats,
   box: all.map(r=>({name:r.name, team:r.team, pts:r.pts, starts:r.starts, codes:r.codes, me:r.me}))
          .sort((a,b)=>b.pts-a.pts)};
}
function groupStage(teams, rounds, ctx, myTeam){
 const tab=teams.map(t=>({name:t.name,ovr:t.ovr,mp:0,hp:0}));
 const meets=[];
 for(let r=0;r<rounds;r++){
   let sel = teams.length<=4 ? teams : teams.filter((_,i)=>i!==(r%teams.length)).slice(0,4);
   const q=quad(sel,ctx,myTeam);
   q.rows.forEach(row=>{const t=tab.find(x=>x.name===row.name);t.mp+=row.mp;t.hp+=row.hp;});
   meets.push(q);
 }
 tab.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 return {tab, meets};
}
/* Eliminacje i ćwierćfinały DMPJ to poligon dla najsłabszych: trenerzy wysyłają
   tam "wkłady do kevlaru", a sprzęt zostaje w busie. Poziom odniesienia leci
   w dół o kilkanaście punktów, a lepsi juniorzy dołączają dopiero od półfinału. */
const DMPJ_EARLY=['ELIMINACJE','ĆWIERĆFINAŁ'];
function simDMPJ(effOvr, defP, excP, myClub, eligible, skipEarly){
 // TWARDA WERYFIKACJA WIEKU — DMPJ to rozgrywki juniorskie: po 21. urodzinach
 // nie ma znaczenia, co ustalił trener i co mówi prezes. Nie jedziesz.
 if(!isJun(G.p)) eligible=false;
 const all=[];
 LKEYS.forEach(k=>G.leagues[k].clubs.forEach(c=>
   // OVR drużyny juniorskiej wynika z klubu, ale jest solidnie pomieszany —
   // dobry klub bywa pusty na młodzieży i odwrotnie
   all.push({name:c.name, ovr:cl(Math.round(c.ovr-R(12,32)+gauss(0,4)),8,90)})));
 const base={}; all.forEach(t=>base[t.name]=t.ovr);
 const EARLY_PEN=R(15,20);                                   // sztuczne zaniżenie wczesnych faz
 const T=(names,pen)=>names.map(n=>({name:n, ovr:cl(Math.round(base[n]-pen),5,90)}));
 const jAvg  = all.reduce((a,t)=>a+t.ovr,0)/all.length;
 const jAvgE = cl(jAvg-EARLY_PEN,5,90);
 const mkCtx = avg => ({ppr:cl(1.45+(effOvr-avg)*0.052,0.15,2.9), defP, excP, heatBase:5, fixed:5, meOvr:effOvr});
 const ctxLate  = eligible ? mkCtx(jAvg)  : null;
 const ctxEarly = (eligible && !skipEarly) ? mkCtx(jAvgE) : null;
 const myLate   = eligible ? myClub : null;
 const myEarly  = (eligible && !skipEarly) ? myClub : null;
 
 for(let i=all.length-1;i>0;i--){const j=R(0,i);[all[i],all[j]]=[all[j],all[i]];}
 const sizes=[5,5,5,5,4], groups=[]; let idx=0;
 sizes.forEach(s=>{const part=all.slice(idx,idx+s); idx+=s; if(part.length) groups.push(T(part.map(t=>t.name),EARLY_PEN));});
 
 /* ELIMINACJE — 5 grup, 4 rundy (obniżony poziom odniesienia) */
 const elim=groups.map((g,i)=>({name:'GRUPA '+String.fromCharCode(65+i), ...groupStage(g,4,ctxEarly,myEarly)}));
 const adv=[], fourths=[];
 elim.forEach(g=>{g.tab.slice(0,3).forEach(t=>adv.push(t)); if(g.tab[3]) fourths.push(g.tab[3]);});
 fourths.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 if(fourths[0]) adv.push(fourths[0]);                 // najlepsza drużyna z 4. miejsc
 
 /* ĆWIERĆFINAŁY — 4 grupy po 4, 4 rundy, awansują po 2 (nadal poligon) */
 adv.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 const qg=[[],[],[],[]]; adv.forEach((t,i)=>qg[i%4].push(t.name));
 const qf=qg.filter(g=>g.length).map((g,i)=>({name:'ĆWIERĆFINAŁ '+(i+1), ...groupStage(T(g,EARLY_PEN),4,ctxEarly,myEarly)}));
 const adv2=[]; qf.forEach(g=>g.tab.slice(0,2).forEach(t=>adv2.push(t)));
 
 /* PÓŁFINAŁY — 2 grupy po 4, 4 rundy, awansują po 2 (pełny poziom, wchodzą lepsi) */
 adv2.sort((a,b)=>b.mp-a.mp||b.hp-a.hp);
 const sg=[[],[]]; adv2.forEach((t,i)=>sg[i%2].push(t.name));
 const sf=sg.filter(g=>g.length).map((g,i)=>({name:'PÓŁFINAŁ '+(i+1), ...groupStage(T(g,0),4,ctxLate,myLate)}));
 const fin4=[]; sf.forEach(g=>g.tab.slice(0,2).forEach(t=>fin4.push(t.name)));
 
 /* FINAŁ — cztery turnieje tej samej czwórki */
 const finale=groupStage(T(fin4,0),4,ctxLate,myLate);
 
 /* --- ŚCIEŻKA GRACZA + JEGO DOROBEK --- */
 const stages=[{k:'ELIMINACJE',gs:elim,my:myEarly},{k:'ĆWIERĆFINAŁ',gs:qf,my:myEarly},
               {k:'PÓŁFINAŁ',gs:sf,my:myLate},{k:'FINAŁ',gs:[finale],my:myLate}];
 const me={starts:0,heats:0,pts:0,bon:0,def:0,exc:0,lines:[]};
 let reached = skipEarly ? 'DRUŻYNA ODPADŁA PRZED PÓŁFINAŁEM (BEZ CIEBIE)' : 'NIE ZAKWALIFIKOWAŁ SIĘ', myGroup=null;
 if(eligible){
   stages.forEach(st=>{
     const mt=st.my; if(!mt) return;                       // faza rozegrana bez ciebie: kody puste
     st.gs.forEach(g=>{
       if(!g.tab.some(t=>t.name===mt)) return;
       if(st.k==='ELIMINACJE') myGroup=g;
       reached=st.k;
       g.meets.forEach((q,i)=>{ if(!q.me) return;
         me.starts++; me.heats+=q.me.h; me.pts+=q.me.mp; me.bon+=q.me.mb; me.def+=q.me.d; me.exc+=q.me.w;
         const row=q.rows.find(r=>r.name===mt);
         me.lines.push({stage:st.k+(st.gs.length>1?' · '+g.name:''), round:i+1,
           teamPos:q.rows.indexOf(row)+1, teamHp:row?row.hp:0, codes:q.me.codes, mp:q.me.mp});
       });
     });
   });
 }
 me.avg = me.heats>0 ? me.pts/me.heats : 0;
 me.avgTxt = me.heats>0 ? me.avg.toFixed(2) : '—';
 const classification=finale.tab.map(t=>t.name);
 return {elim, qf, sf, finale, classification, me, reached, myGroup, eligible,
         myTeam:eligible?myClub:null, skipEarly:!!skipEarly, earlyPen:EARLY_PEN};
}
