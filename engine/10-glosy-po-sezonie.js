/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: GLOSY PO SEZONIE
   talkPick, seasonTalk
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1341-1405 oryginału).
   ============================================================ */
/* ============================================================
   KOMENTARZE PO SEZONIE
   ------------------------------------------------------------
   Każdy warunek miał wcześniej JEDNĄ linijkę wpisaną na stałe, więc gracz
   czytał w kółko to samo zdanie komornika, mechanika i Ostafińskiego.
   Teraz teksty siedzą w puli TALK (data.js, po 32 na warunek), a talkPick()
   losuje z PAMIĘCIĄ: dopóki pula się nie wyczerpie, żaden tekst nie wróci.
   Pamięć trzymamy w G.talkSeen, żeby przechodziła przez cały przebieg kariery.
   ============================================================ */
function talkPick(key, vars){
 const pool = (typeof TALK!=='undefined') && TALK[key];
 if(!pool || !pool.lines || !pool.lines.length) return null;
 if(!G.talkSeen) G.talkSeen={};
 let used = G.talkSeen[key] || [];
 // wszystkie teksty z tej puli już poszły — zaczynamy od nowa, ale bez
 // powtórki ostatnio użytego zdania (żeby nie trafić dwa razy pod rząd)
 if(used.length >= pool.lines.length) used = used.slice(-1);
 let free = pool.lines.map((_,i)=>i).filter(i=>!used.includes(i));
 if(!free.length) free = pool.lines.map((_,i)=>i);
 const idx = pick(free);
 G.talkSeen[key] = used.concat(idx);
 let txt = pool.lines[idx];
 // podstawienia: {n}, {rok}, {kasa}, {avg}, {klub}
 if(vars) Object.keys(vars).forEach(k=>{ txt = txt.split('{'+k+'}').join(vars[k]); });
 return {who:pool.who, txt};
}
function seasonTalk(r,p){
 const A=[], avg=r.avg;
 const add=(key,vars)=>{ const t=talkPick(key,vars); if(t) A.push(t); };
 // --- główna ocena jazdy ---
 if(r.matches===0) add('none');
 else if(avg<0.5) add('awful');
 else if(avg<0.9) add('bad');
 else if(avg<1.4) add('meh');
 else if(avg<1.8) add('solid');
 else if(avg<2.2) add('good');
 else add('great');
 // --- Ostafiński ---
 if(r.medDelta<=-10) add('ostaSilent');
 else if(r.medDelta>=12) add('ostaLoud');
 else if(p.med>70) add('ostaStar');
 else if(p.med<20) add('ostaNobody');
 // --- defekty i wykluczenia ---
 if(r.defects>=6) add('defMany',{n:r.defects});
 else if(r.defects===0&&r.heats>15) add('defZero');
 if(r.exclusions>=5) add('excMany',{n:r.exclusions});
 // --- bonusy ---
 if(r.bonus>=10) add('bonMany');
 else if(r.bonus===0&&r.heats>10) add('bonZero');
 // --- tabela ---
 if(r.pos===1) add('champion');
 else if(r.pos===8) add('relegated');
 // --- finanse ---
 if(r.strike) add('strike',{rok:r.year});
 if(r.fines>50000) add('fines',{kasa:zl(r.fines)});
 if(p.budget<0) add('broke');
 // --- sprzęt / wiek ---
 if(p.equip<15) add('junk');
 if(p.age>=34&&avg<1.2) add('oldSlow');
 if(p.age<=19&&avg>1.6) add('youngFast');
 // wybierz maks. 4, zawsze z pierwszą pozycją
 const first=A.shift(), rest=A.sort(()=>Math.random()-0.5).slice(0,3);
 return [first,...rest].filter(Boolean);
}
