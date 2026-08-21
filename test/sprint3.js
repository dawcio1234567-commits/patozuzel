/* ============================================================
   TEST NIEZMIENNIKÓW — SPRINT 3 (trenerzy, pola startowe, rezerwy)
   Odpalany na atrapach, bez przeglądarki:  node test/sprint3.js
   ============================================================ */
const fs=require('fs'), vm=require('vm');
const stub=[
"const IMIE=['Marek','Zbigniew','Kamil','Bartosz','Mirosław','Sebastian'];",
"const NAZW=['Kowalik','Zmarzły','Pawlicki','Dudek','Ostafiński','Bąk'];",
"function R(a,b){return Math.floor(Math.random()*(b-a+1))+a;}",
"function RF(a,b){return Math.random()*(b-a)+a;}",
"function cl(v,a,b){return Math.max(a,Math.min(b,v));}",
"function pick(a){return a[Math.floor(Math.random()*a.length)];}",
"function chance(p){return Math.random()*100<p;}",
"function gauss(m,s){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();",
"  return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}",
"function zl(v){return v+' zł';}",
"function esc(s){return String(s);}",
"const BAL={home:2};",
"function refFor(n){const c=allClubs().find(x=>x.name===n);return c?c.ovr:50;}",
"function clubTrouble(){return 0;}",
"function rideStr(ovr,ref,home){return ovr-ref+(home||0)+gauss(0,6);}",
"function riderWage(r){return r.ovr*1000;}",
"function dedupeSquadOvr(){}","function dedupeAllSquads(){}","function worldAge(){}",
"function leagueOfClub(n){for(const k of LKEYS){if(G.leagues[k].clubs.some(c=>c.name===n))return k;}return null;}"
].join('\n');
const src=[stub,
 fs.readFileSync('data/05-klasy-kluby-sprzet.js','utf8'),
 fs.readFileSync('engine/03-stan-gry.js','utf8'),
 fs.readFileSync('engine/04-szansa-na-sklad.js','utf8'),
 fs.readFileSync('engine/12b-pola-i-rezerwy.js','utf8'),
 fs.readFileSync('engine/12-mecz-ligowy.js','utf8'),
 fs.readFileSync('engine/19-zawodnicy-kadry.js','utf8')].join('\n');
const ctx=vm.createContext({console, Math, Object, Array, Set, Map, String, Number, isFinite, JSON});
vm.runInContext(src,ctx);
vm.runInContext('G=newGame(); genAllSquads();',ctx);
const run=s=>vm.runInContext('(function(){'+s+'})()',ctx);

let fail=0;
const ok=(c,m)=>{ if(!c){ console.log('  X  '+m); fail++; } else console.log('  ok '+m); };

/* 1. POLA STARTOWE ------------------------------------------------------- */
const g=run([
"  let bad=0, helm=0, gates=0, n=0;",
"  for(let i=0;i<50000;i++){",
"    const nh=1+Math.floor(Math.random()*2), na=1+Math.floor(Math.random()*2);",
"    const E=[];",
"    for(let k=0;k<nh;k++) E.push({r:{id:100+k,age:Math.random()<0.3?18:27}, side:'h', num:9+k});",
"    for(let k=0;k<na;k++) E.push({r:{id:200+k,age:Math.random()<0.3?18:27}, side:'a', num:1+k});",
"    if(Math.random()<0.5) E.reverse();",
"    const line=gateOrder(E); n++;",
"    if(!gatesLegal(line)) bad++;",
"    line.forEach((e,ix)=>{",
"      const good = e.side==='h' ? HELMET_H.indexOf(e.helmet)>=0 : HELMET_A.indexOf(e.helmet)>=0;",
"      if(!good) helm++;",
"      if(e.gate!==ix+1) gates++;",
"    });",
"  }",
"  return {bad, helm, gates, n};"].join('\n'));
console.log('1) POLA STARTOWE ('+g.n+' losowych stawek 1-2 na stronę)');
ok(g.bad===0,  'przeplot G-A-G-A wymuszony w 100% przypadków');
ok(g.helm===0, 'kaski: gospodarz zawsze czerwony/niebieski, gość biały/żółty');
ok(g.gates===0,'numery pól 1..4 nadane po kolei');

/* 2. AI TRENERÓW --------------------------------------------------------- */
const c=run([
"  const cs=allClubs();",
"  const all=cs.map(x=>clubCoach(x));",
"  const types=new Set(all.map(x=>x.type));",
"  const rels=[], devs=[];",
"  cs.forEach(x=>squadOf(x.name).forEach(r=>{ rels.push(coachRel(x.name,r).rel); devs.push(coachDevMul(x.name,r)); }));",
"  const club=G.leagues.KL.clubs[5];",           // słaby klub, ok. 42 OVR
"  const mk=o=>({id:-1,name:'X',age:26,ovr:o,form:0,sea:null,me:false});",
"  const lvl=Math.round(riderLevel(club));",
"  const star=coachRel(club.name,mk(97)), fit=coachRel(club.name,mk(lvl)), weak=coachRel(club.name,mk(12));",
"  return {n:all.length, types:types.size,",
"    minRel:Math.min.apply(null,rels), maxRel:Math.max.apply(null,rels),",
"    minDev:Math.min.apply(null,devs), maxDev:Math.max.apply(null,devs),",
"    star:star.rel, fit:fit.rel, weak:weak.rel,",
"    sStar:star.status.n, sFit:fit.status.n, sWeak:weak.status.n, lvl};"].join('\n'));
console.log('2) AI TRENERÓW');
ok(c.n===24 && c.types>=4, '24 trenerów, '+c.types+' różnych typów');
ok(c.minRel>=-100 && c.maxRel<=100, 'sympatia zawsze w -100..100 ('+c.minRel+'..'+c.maxRel+')');
ok(c.minDev>=0.45 && c.maxDev<=1.85, 'mnożnik rozwoju w widełkach ('+c.minDev.toFixed(2)+'-'+c.maxDev.toFixed(2)+')');
ok(c.fit>c.star && c.fit>c.weak,
  'pasujący do drużyny ('+c.fit+' → '+c.sFit+') > gwiazda ponad poziom ('+c.star+' → '+c.sStar+') i słabeusz ('+c.weak+' → '+c.sWeak+')');

/* 3. MECZ LIGOWY: WYNIKI, REZERWY, BIEGI NOMINOWANE ---------------------- */
const m=run([
"  let bad=0, junNom=0, ovrPlain=0, ovrTac=0, scores=[];",
"  for(let i=0;i<600;i++){",
"    const cs=allClubs(), a=pick(cs); let b=pick(cs); while(b===a) b=pick(cs);",
"    const M=simMeeting(a.name,b.name,null,null,null);",
"    if(!M) continue;",
"    scores.push(M.hs, M.as);",
"    if(M.hs<0||M.as<0||M.hs+M.as>90) bad++;",
"    M.box.forEach(x=>{ if(x.age<=21){ if(x.res.plain>RESB.junPlain) ovrPlain++;",
"                                      if(x.res.tactic>RESB.junTactic) ovrTac++; } });",
"    M.heats.filter(h=>h.label>=14).forEach(h=>{",
"      ['h','a'].forEach(s=>{",
"        const rid=h.res.filter(x=>x.side===s);",
"        const jun=rid.filter(x=>{const bx=M.box.find(y=>y.id===x.id); return bx&&bx.age<=21;});",
"        const sen=M.box.filter(y=>y.side===s&&y.age>21&&y.starts<5);",
"        if(jun.length && sen.length>=2) junNom++;",
"      });",
"    });",
"  }",
"  return {bad, junNom, ovrPlain, ovrTac, gw:(G.gateWarn||[]).length,",
"    min:Math.min.apply(null,scores), max:Math.max.apply(null,scores), n:scores.length/2};"].join('\n'));
console.log('3) MECZ LIGOWY ('+m.n+' spotkań)');
ok(m.bad===0,      'suma punktów nigdy poza regulaminowym zakresem');
ok(m.min>=8 && m.max<=82, 'wyniki drużyn w widełkach ('+m.min+'-'+m.max+')');
ok(m.ovrPlain===0, 'nikt nie przekroczył limitu rezerwy zwykłej młodzieżowca ('+RESB_junPlain()+')');
ok(m.ovrTac===0,   'nikt nie przekroczył limitu rezerwy taktycznej młodzieżowca');
ok(m.junNom===0,   'w biegach XIV-XV nie ma juniora, dopóki drużyna ma dwóch wolnych seniorów');
ok(m.gw===0,       'gateAudit nie zgłosił żadnego nielegalnego ustawienia w meczu');
function RESB_junPlain(){ return vm.runInContext('RESB.junPlain',ctx); }

/* 4. SZEŚĆ SEZONÓW POD TRENERAMI ----------------------------------------- */
const a=run([
"  for(let y=0;y<6;y++){ G.year++; ageRiders(); }",
"  const o=allClubs().map(x=>x.ovr);",
"  return {min:Math.min.apply(null,o), max:Math.max.apply(null,o),",
"    fires:(G.coachLog||[]).filter(x=>x.kind==='fire').length, riders:G.riders.length};"].join('\n'));
console.log('4) SZEŚĆ SEZONÓW STARZENIA POD TRENERAMI');
ok(a.min>15 && a.max<=99, 'OVR klubów nie ucieka ('+a.min+'-'+a.max+')');
ok(a.fires>0,   'karuzela trenerska działa ('+a.fires+' zwolnień w 6 lat)');
ok(a.riders>200,'kadry się nie wyludniły ('+a.riders+' zawodników)');

/* 5. SZANSA NA SKŁAD LICZY TO SAMO, CO SEZON --------------------------- */
const ap=run([
"  G.p=newPlayer('Testowy Zawodnik','tal');",
"  const club=G.leagues.E2.clubs[0];",
"  G.p.club=club.name; G.p.lk='E2'; G.p.ovr=Math.round(riderLevel(club)); G.p.equip=60;",
"  G.riders.push({id:99999, me:true, name:G.p.name, age:G.p.age, ovr:G.p.ovr, form:0,",
"                 club:club.name, retired:false, inj:0, out:false, strike:false, sea:blankSea()});",
"  const r=squadOf(club.name)[0];",
"  const withC=lineupValue(r,null,0,club.name), noC=lineupValue(r,null,0,null);",
"  const rel=coachLike(club.name,r);",
"  const diff=Math.round((withC-noC)*1000)/1000, want=Math.round(rel*LINEUP_REL_W*1000)/1000;",
"  const ch=appearanceChance(G.p, club, 55, null);",
"  const part=appearanceCoachPart(G.p, club, 55, null);",
"  /* ten sam trener, dwa skrajne profile: belfer/rachmistrz reagują na prof, słup na med */",
"  G.p.prof=95; G.p.med=95; const relHi=coachLike(club.name, meRider());",
"  G.p.prof=5;  G.p.med=5;  const relLo=coachLike(club.name, meRider());",
"  /* podwójne naliczenie trenera: engine/09 zapala flagę, ageRiders ma odpuścić */",
"  G.p.prof=50; G.p.med=50; G.p.coachDevApplied=true; G.p.coachDev={d:1};",
"  const o0=G.p.ovr; coachAgePlayer(); const dbl=G.p.ovr-o0;",
"  const g1=coachGrowthDelta(club.name, r, 4), g2=coachGrowthDelta(club.name, r, -4);",
"  return {diff, want, ch, part, relHi, relLo, dbl, g1, g2,",
"          m:Math.round(coachDevMul(club.name,r)*100)/100};"].join('\n'));
console.log('5) SZANSA NA SKŁAD I ROZWÓJ');
ok(ap.diff===ap.want, 'lineupValue z nazwą klubu dokłada dokładnie sympatię x LINEUP_REL_W ('+ap.diff+')');
ok(ap.ch>=1 && ap.ch<=99, 'appearanceChance zwraca sensowny procent ('+ap.ch+'%)');
ok(ap.relHi!==ap.relLo, 'profesjonalizm i medialność realnie ruszają sympatią ('+ap.relLo+' → '+ap.relHi+')');
ok(ap.dbl===0, 'ageRiders nie nalicza trenera drugi raz, gdy zrobił to engine/09');
ok((ap.m>1 ? (ap.g1>0 && ap.g2>0) : (ap.g1<=0 && ap.g2<=0)),
   'coachGrowthDelta: dobry trener podbija przyrost i hamuje spadek (x'+ap.m+' → '+ap.g1.toFixed(2)+' / '+ap.g2.toFixed(2)+')');

console.log(fail? '\nBLEDOW: '+fail : '\nWSZYSTKO GRA.');
process.exit(fail?1:0);
