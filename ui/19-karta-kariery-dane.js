/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: KARTA KARIERY DANE
   Liczenie gabloty: medale, kluby, kody biegów
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2689-2815 oryginału).
   ============================================================ */
/* ============================================================
   8. PAMIĄTKOWA KARTA STATYSTYK — "SportoweMity.pl"
   Ukryty kontener (poza ekranem, ale wyrenderowany — html2canvas nie
   potrafi sfotografować display:none) stylizowany na portal sportowy
   w barwach zielono-białych. Z tego robi się PNG na pamiątkę kariery.
   ============================================================ */
const SM={g:'#0f8a3d', gd:'#0a6b2f', gl:'#eaf6ee', gl2:'#f6fbf7', bd:'#d5e3d9',
          tx:'#1f2937', mu:'#6b7280', rd:'#c81e1e'};

/* Rozbicie kodów z linii meczowych: miejsca w biegach + biegi nieukończone.
   Silnik notuje "d" (defekt) i "w" (wykluczenie); kolumny U (upadek) i T (taśma)
   zostają w tabeli dla zgodności z układem portalu i czekają na dane.
   LICZYMY RUNDĘ ZASADNICZĄ **I** PLAY-OFF — dokładnie ten sam zakres, z którego
   biorą się kolumny M i B oraz kafelki na górze karty. Wcześniej kody szły
   wyłącznie z ligi, więc suma I+II+III+IV+D+W nie schodziła się z liczbą biegów. */
function smCodes(h){
 const s={I:0,II:0,III:0,IV:0,D:0,U:0,W:0,T:0};
 const one = c => {
   if(c==='-') return;                       // zmieniony przez rezerwę — to nie był start
   if(c==='d'){s.D++;return;}
   if(c==='u'){s.U++;return;}
   if(c==='w'){s.W++;return;}
   if(c==='t'){s.T++;return;}
   const v=parseInt(c,10);
   if(v===3)s.I++; else if(v===2)s.II++; else if(v===1)s.III++; else if(v===0)s.IV++;
 };
 (h.lines||[]).forEach(L=>{ if(!L.rode || !L.codes) return; L.codes.forEach(one); });
 ((h.po && h.po.codes) || []).forEach(one);
 return s;
}
/* Dorobek sezonu w jednym miejscu: liga + play-off. Stare zapisy w G.history
   (sprzed poprawki) nie mają pól *All — dla nich liczymy je z r.po na miejscu,
   żeby wczytana wcześniej kariera też pokazywała spójne liczby. */
const smM   = h => h.matchesAll != null ? h.matchesAll : (h.matches||0) + ((h.po&&h.po.m)||0);
const smB   = h => h.heatsAll   != null ? h.heatsAll   : (h.heats||0)   + ((h.po&&h.po.h)||0);
const smP   = h => h.ptsAll     != null ? h.ptsAll     : (h.pts||0)     + ((h.po&&h.po.p)||0);
const smBon = h => h.bonusAll   != null ? h.bonusAll   : (h.bonus||0)   + ((h.po&&h.po.b)||0);
const smAvg = h => { const b=smB(h); return b>0 ? (smP(h)/b).toFixed(2) : '—'; };
/* Kluby z kariery — kolejne "przystanki", sklejone po sąsiadujących sezonach. */
function smClubs(){
 const out=[];
 G.history.forEach(h=>{
   const last=out[out.length-1];
   if(last && last.club===h.club){
     last.to=h.year; last.seasons++; last.pts+=smP(h); last.matches+=smM(h);
     if(!last.leagues.includes(h.league)) last.leagues.push(h.league);
     last.debt += (h.settle&&h.settle.unpaid)||0;
   } else out.push({club:h.club, leagues:[h.league], from:h.year, to:h.year,
                    seasons:1, pts:smP(h), matches:smM(h),
                    debt:(h.settle&&h.settle.unpaid)||0});
 });
 return out;
}
/* ============================================================
   GABLOTA — OSIĄGNIĘCIA INDYWIDUALNE I TYTUŁY
   Karta kariery pokazywała dotąd wyłącznie ligę, sezon po sezonie. Cały
   dorobek z turniejów (IMP, MIMP, Kaski) i DMPJ istniał w danych, ale nigdzie
   nie schodził się w jedno miejsce — trzeba go było zbierać z zakładek
   poszczególnych sezonów. Tu leci komplet: złoto / srebro / brąz z latami,
   liczba startów i najlepszy wynik dla każdych rozgrywek osobno.
   ============================================================ */
const SM_TROPHY = [
 {k:'imp',  n:'INDYWIDUALNE MISTRZOSTWA POLSKI', s:'IMP',  gold:'Indywidualny Mistrz Polski'},
 {k:'mimp', n:'MŁODZIEŻOWE IND. MISTRZOSTWA POLSKI', s:'MIMP', gold:'Młodzieżowy Ind. Mistrz Polski'},
 {k:'zk',   n:'ZŁOTY KASK',    s:'ZK', gold:'Zwycięzca Złotego Kasku'},
 {k:'sk',   n:'SREBRNY KASK',  s:'SK', gold:'Zwycięzca Srebrnego Kasku'},
 {k:'bk',   n:'BRĄZOWY KASK',  s:'BK', gold:'Zwycięzca Brązowego Kasku'},
 {k:'szk',  n:'TURNIEJE SZKOLENIOWE (CYKL)', s:'TSZ', gold:'Zwycięzca cyklu Turniejów Szkoleniowych'},
 {k:'palet',n:'PUCHAR PALET',  s:'PALET', gold:'Zdobywca Pucharu PALET'}
];
/* Cykl światowy trzymamy osobno: nie siedzi w h.ind, tylko w h.world. */
const SM_WORLD = [
 {k:'ims',  n:'INDYWIDUALNE MISTRZOSTWA ŚWIATA', s:'IMŚ',  gold:'INDYWIDUALNY MISTRZ ŚWIATA'},
 {k:'imsj', n:'IND. MISTRZOSTWA ŚWIATA JUNIORÓW', s:'IMŚJ2', gold:'Indywidualny Mistrz Świata Juniorów'}
];
/* Pozycja drużyny gracza w finale DMPJ (0 = nie było jej w finałowej czwórce). */
function smDmpjPos(h){
 const D=h.dmpj;
 if(!D || !D.eligible) return null;
 const team = D.myTeam || h.club;
 return ((D.classification||[]).indexOf(team) + 1) || 0;
}
function smTrophies(){
 const mk=(n,s)=>({n, s, g:[], si:[], b:[], starts:0, best:0, bestYear:null});
 const rows = SM_TROPHY.map(d=>Object.assign(mk(d.n,d.s), {k:d.k, gold:d.gold}));
 const dmpj = Object.assign(mk('DMPJ — DRUŻYNOWE MP JUNIORÓW','DMPJ'),
                            {gold:'Drużynowy Mistrz Polski Juniorów'});
 /* DMP — DRUŻYNOWE MISTRZOSTWA POLSKI: to miano należy się WYŁĄCZNIE tytułowi
    z Ekstraligi. Wcześniej ten sam napis „Drużynowy Mistrz Polski” i wspólna
    rubryka DMP zbierały też mistrzostwo 2. Ekstraligi i Krajowej Ligi
    Żużlowej — w karcie kariery wyglądało to tak, jakby awans z KLŻ był
    mistrzostwem kraju. Teraz każda klasa rozgrywkowa ma swoją, osobną gablotę. */
 const dmp  = Object.assign(mk('DMP — DRUŻYNOWE MISTRZOSTWA POLSKI (EKSTRALIGA)','DMP'),
                            {gold:'Drużynowy Mistrz Polski'});
 const dmp2 = Object.assign(mk('MISTRZOSTWO 2. EKSTRALIGI','2.EL'),
                            {gold:'Mistrz 2. Ekstraligi'});
 const dmpKl= Object.assign(mk('MISTRZOSTWO KRAJOWEJ LIGI ŻUŻLOWEJ','KLŻ'),
                            {gold:'Mistrz Krajowej Ligi Żużlowej'});
 const note = (r,pos,year)=>{
   if(pos===1) r.g.push(year); else if(pos===2) r.si.push(year); else if(pos===3) r.b.push(year);
   if(pos>0 && (!r.best || pos<r.best)){ r.best=pos; r.bestYear=year; }
 };
 const wrows = SM_WORLD.map(d=>Object.assign(mk(d.n,d.s), {k:d.k, gold:d.gold}));
 G.history.forEach(h=>{
   const I=h.ind||{};
   rows.forEach(r=>{ const c=I[r.k]; if(!c || !c.rode) return;
     r.starts++; note(r, c.mePos||0, h.year); });
   const W=h.world||{};
   wrows.forEach(r=>{ const c=W[r.k]; if(!c || !c.rode) return;
     r.starts++; note(r, c.mePos||0, h.year); });
   const dp=smDmpjPos(h);
   if(dp!==null){ dmpj.starts++; note(dmpj, dp, h.year); }
   /* Liga: 1-3 miejsce w play-off to komplet medali DMP danej klasy rozgrywkowej —
      ale liczone do WŁAŚCIWEJ tabeli, wg tego, w której lidze (h.lk) faktycznie grałeś. */
   if(h.matches>0 && h.pos>0){
     const target = h.lk==='EL' ? dmp : h.lk==='E2' ? dmp2 : dmpKl;
     target.starts++; note(target, h.pos<=3?h.pos:0, h.year);
   }
 });
 return [...wrows, ...rows, dmpj, dmp, dmp2, dmpKl];
}
/* "1 klub", "2 kluby", "7 klubów" — portal ma wyglądać poważnie. */
const smKlub = n => n===1 ? 'klub'
  : (n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20)) ? 'kluby' : 'klubów';
const smUnpaid = h => (h.settle && h.settle.unpaid) || 0;
const smPzm    = h => (h.settle && h.settle.pzmEarned) || 0;
