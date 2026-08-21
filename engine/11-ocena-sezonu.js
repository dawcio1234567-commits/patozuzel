/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: OCENA SEZONU
   seasonScore, gradeOf
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1406-1513 oryginału).
   ============================================================ */
/* ============================================================
   OCENA SEZONU — CO SIĘ NA NIĄ SKŁADA
   Wejście: dorobek ze wszystkich rozgrywek + kontekst drużynowy.
   Wyjście: {score, parts} — parts to gotowa rozpiska dla UI, żeby gracz
   widział, skąd wzięła się ocena, zamiast kłócić się z literą na ekranie.
   Wagi siedzą w GRADE (data.js).
   ============================================================ */
function seasonScore(o){
 const parts=[];
 const push=(d,w)=>{ if(Math.abs(d)>=0.005) parts.push({d:Math.round(d*100)/100, w}); };
 const h=o.heats||0;
 if(h===0) return {score:0, parts:[{d:0, w:'zero biegów w całym sezonie — nie ma czego oceniać'}]};
 
 /* 1) PODSTAWA: średnia ze wszystkich rozgrywek, ale ściągnięta w stronę
       średniej ligowej tym mocniej, im mniejsza próba. 12 biegów po powrocie
       z gipsu nie może ważyć tyle, co 180 biegów pełnego sezonu. */
 const W=GRADE.shrinkW;
 const base=(o.overall*h + GRADE.neutral*W)/(h+W);
 parts.push({d:Math.round(base*100)/100,
   w:'średnia '+o.overall.toFixed(2)+' z '+h+' biegów'+
     (h<W ? ' — mała próba, ocena ciągnięta do średniej ligowej '+GRADE.neutral.toFixed(2) : '')});
 let s=base;
 
 /* 2) OBJĘTOŚĆ SEZONU: kto odjechał komplet, ten ma prawo do premii; kto
       przesiedział rok na ławce, ten nie schowa się za jedną dobrą średnią. */
 const vol=cl((o.matches-6)/16,-0.5,1)*GRADE.volume;
 s+=vol; push(vol, o.matches+' rozegranych spotkań (liga + play-off)');
 
 /* 3) MEDALE INDYWIDUALNE */
 (o.medals||[]).forEach(m=>{ const d=GRADE.medal[m.pos]||0; s+=d;
   push(d, m.name+' — '+['','złoto','srebro','brąz'][m.pos]); });
 
 /* 4) DRUŻYNA: tytuł, podium, awans, utrzymanie, spadek */
 if(o.pos===1){ s+=GRADE.champ; push(GRADE.champ,'MISTRZOSTWO — '+o.leagueName); }
 else if(o.pos<=3){ s+=GRADE.podium; push(GRADE.podium, o.pos+'. miejsce w play-off'); }
 const moves=(G.promo||[]).filter(x=>x.club===o.club);
 const wentUp=moves.some(x=>String(x.type).startsWith('awans'));
 const wentDown=moves.some(x=>String(x.type).startsWith('spadek'));
 if(wentUp){ s+=GRADE.promo; push(GRADE.promo,'AWANS do wyższej ligi'); }
 /* 8. miejsce to spadek bezpośredni — nawet gdy tabeli awansów nie ma pod ręką.
    Premię „za utrzymanie" dostaje wyłącznie 7. miejsce: ten, kto wygrał dwumecz
    o utrzymanie i obronił się w barażu. */
 if(wentDown || (!wentUp && o.pos===8 && o.lk!=='KL')){
   s+=GRADE.releg; push(GRADE.releg,'spadek z ligi');
 } else if(!wentUp && o.pos===7 && o.lk!=='KL' && o.matches>0){
   s+=GRADE.saved; push(GRADE.saved,'utrzymanie wywalczone w play-downie/barażu — klub został w lidze');
 }
 
 /* 5) FAZA PLAY-OFF liczy się osobno: tam jedzie się o wszystko */
 if(o.po && o.po.h>0){
   const d=cl((o.po.avg-1.30)*0.18, -0.10, 0.22); s+=d;
   push(d,'faza play-off: średnia '+o.po.avgTxt+' w '+o.po.h+' biegach');
 }
 
 /* 6) DMPJ */
 if(o.dmpj && o.dmpj.eligible && o.dmpj.classification && o.dmpj.classification[0]===o.club){
   s+=GRADE.dmpj; push(GRADE.dmpj,'drużynowe mistrzostwo Polski juniorów');
 }
 
 /* 7) KONTUZJA — nie liczymy jej przeciwko zawodnikowi */
 if(o.injured && o.injMissed>0){
   const d=cl(o.injMissed*GRADE.injW, 0, GRADE.injMax); s+=d;
   push(d,'kontuzja: '+o.injMissed+' spotkań poza torem, nie twoja wina');
 }
 
 /* 8) JAZDA NA KOLEGĘ Z PARY */
 if(o.bonus>=8){ s+=GRADE.bonusPts; push(GRADE.bonusPts, o.bonus+' punktów bonusowych — jeździsz na drużynę'); }

 /* ============================================================
    9) MIEJSCE W STATYSTYKACH INDYWIDUALNYCH SWOJEJ LIGI
    ------------------------------------------------------------
    Ta sama średnia znaczy co innego w Ekstralidze i co innego w Krajowej
    Lidze — i co innego u 17-latka niż u 30-latka. Dlatego ocenę sezonu
    domyka pozycja w klasyfikacji WŁASNEJ ligi i WŁASNEJ kategorii wiekowej
    (juniorzy osobno, seniorzy osobno). 1. miejsce daje pełną premię,
    środek stawki jest neutralny, ogon klasyfikacji zabiera punkty.
    ============================================================ */
 if(o.indRank && o.indRank.qual && o.indRank.pos && o.indRank.n>=4){
   const R1=o.indRank;
   const pct = 1 - (R1.pos-1)/Math.max(1,(R1.n-1));       // 1 = najlepszy, 0 = ostatni
   const val = pct>=0.5 ? (pct-0.5)*2*GRADE.indRankW : (pct-0.5)*2*(-GRADE.indRankP);
   s+=val;
   push(val, R1.pos+'. miejsce na '+R1.n+' w klasyfikacji '+R1.cat+' '+(o.leagueShort||'')+
     ' (średnia '+R1.avg.toFixed(2)+')');
 } else if(o.indRank && !o.indRank.qual){
   push(0, 'za mało startów ('+o.indRank.starts+'), żeby wejść do klasyfikacji indywidualnej ligi — minimum '+o.indRank.min);
 }

 /* 10) CYKL ŚWIATOWY — inna półka niż krajowe podwórko */
 [['ims','Indywidualne Mistrzostwa Świata'],['imsj','Indywidualne Mistrzostwa Świata Juniorów']].forEach(([k,label])=>{
   const c=o[k]; if(!c || !c.rode || !c.mePos) return;
   if(c.mePos<=3){ const d=GRADE.imsMedal[c.mePos]||0; s+=d; push(d, label+' — '+['','złoto','srebro','brąz'][c.mePos]); }
   else if(c.mePos<=8){ s+=GRADE.imsTop8; push(GRADE.imsTop8, label+' — '+c.mePos+'. miejsce w klasyfikacji cyklu'); }
 });

 return {score:Math.max(0,s), parts};
}
 
function gradeOf(avg,heats){
 if(heats===0) return {t:'BRAK STARTÓW', f:'nie istniejesz', c:'text-zinc-600'};
 if(avg<0.60) return {t:'BEZNADZIEJNA', f:'beznadziejna', c:'text-red-600'};
 if(avg<1.00) return {t:'SŁABA',        f:'słaba',        c:'text-red-400'};
 if(avg<1.40) return {t:'PRZECIĘTNA',   f:'przeciętna',   c:'text-zinc-400'};
 if(avg<1.80) return {t:'DOBRA',        f:'dobra',        c:'text-lime-400'};
 if(avg<2.20) return {t:'BARDZO DOBRA', f:'bardzo dobra', c:'text-emerald-400'};
 return              {t:'WYBITNA',      f:'wybitna',      c:'text-orange-400 glow'};
}
