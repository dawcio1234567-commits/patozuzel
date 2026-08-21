/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: SZANSA NA SKLAD
   effectiveOvr, appearanceChance — kto wjeżdża do siódemki
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 261-329 oryginału).
   PATCH 22.08.2026 (Sprint 3): oba szacunki liczą teraz TO SAMO, co realny
   sezon — czyli także sympatię trenera. Wcześniej `lineupFrom()` dostawał
   pulę bez nazwy klubu, więc składnik `LINEUP_REL_W` w `lineupValue()`
   wychodził zerem: procent z ekranu ofert obiecywał skłóconemu z trenerem
   dokładnie tyle samo, co ulubieńcowi szatni.
   ============================================================ */
/* ============================================================
   1. SZANSA NA WYSTĘP — PARASOL MŁODZIEŻOWY
   ============================================================ */
// SKALA 1:1 — OVR klubu to poziom, wokół którego kręci się jego pierwsza piątka.
const riderLevel = club => club.ovr;
 
/* --- EFEKTYWNY OVR ---
   To, co widzi trener i tor: umiejętności PLUS sprzęt (i atmosfera w klubie).
   Zawodnik 60 na złomie jest realnie słabszy od zawodnika 55 z czterema silnikami.
   Jedno miejsce dla całej gry, żeby szacowana szansa na skład liczyła dokładnie
   to samo, co potem liczy sezon. */
function equipEffOf(p, equipFit){
 return p.equip * (0.55 + 0.45*(cl(equipFit==null?100:equipFit,0,100)/100));
}
function effectiveOvr(p, equipFit, atmAdd){
 return cl(p.ovr + (atmAdd||0) + (equipEffOf(p,equipFit)/99 - 0.45)*16, 1, 99);
}
 
/* --- SZANSA NA WYSTĘP ---
   Nie ma abstrakcyjnego procentu: 140 razy układamy realny skład tego klubu
   i liczymy, ile razy trener wpisał CIEBIE do siódemki.
   Kluczowe: losujemy DYSPOZYCJĘ całej kadry (i twoją). W sezonie o numerach
   decyduje forma, a nie sam OVR — szacunek, który zakłada zerową formę
   wszystkich, obiecywałby 95% komuś, kto realnie wypada ze składu po dwóch
   słabych meczach. Liczymy też twój OVR razem ze sprzętem.
   SPRINT 3: wirtualny „ty" w puli dostaje `me:true`, dzięki czemu trener
   czyta twój prawdziwy profesjonalizm, medialność i lojalność (patrz
   riderProfile w engine/19), a nie szacunek po samym OVR. */
const FORM_SIGMA = 4.6;                       // typowy rozrzut formy w trakcie sezonu
function appearanceChance(p,club,atm,S){
 const sq=squadOf(club.name).filter(r=>!r.inj && !r.me);
 if(!sq.length) return isJun(p)?85:60;
 const bias = p.loyalty*0.10 + ((atm||55)-50)*0.03 + ((S&&S.heatPP)||0)*0.20;
 const myOvr = effectiveOvr(p, 100, 0);
 const draw  = s => cl(gauss(0,s), -12, 12);
 let hit=0; const N=140;
 for(let t=0;t<N;t++){
   const pool=sq.map(r=>({...r, form:draw(FORM_SIGMA)}));
   // twoja forma buja się mniej: zawodnik poza składem nie ma jak jej wyrobić,
   // bo dyspozycja aktualizuje się dopiero po starcie
   pool.push({id:-1, me:true, ovr:myOvr, age:p.age, form:draw(FORM_SIGMA*0.72)});
   const L=lineupFrom(pool, 0.8, {id:-1, v:bias}, false, club.name);
   if(L && Object.values(L).some(r=>r&&r.id===-1)) hit++;
 }
 return cl(Math.round(100*hit/N),1,99);
}
 
 
/* --- SZANSA NA SKŁAD W KONKRETNEJ KOLEJCE ---
   appearanceChance() (wyżej) liczy szansę "na zimno": zakłada, że cała kadra
   wjeżdża w sezon z zerową dyspozycją. To dobre na ekran ofert, ale bezużyteczne
   w trakcie sezonu, gdzie o numerach decyduje BIEŻĄCA forma — twoja i kolegów.
   Ta funkcja bierze realny stan kadry na dziś i dokłada tylko tyle losowości,
   ile ma sam trener przy układaniu składu. Dzięki temu liczba pokazywana przy
   każdej kolejce faktycznie się zmienia: po dwóch dobrych meczach rośnie,
   po dwóch słabych spada. */
function appearanceChanceNow(clubName, meR, bias, N){
 if(!clubName || !meR) return null;
 const sq=squadOf(clubName).filter(r=>!r.inj && !r.strike && !r.out && !r.me);
 if(!sq.length) return 99;
 N = N || 48;
 const jitter = (f,s) => cl((f||0)*0.65 + cl(gauss(0,s),-12,12), -12, 12);
 let hit=0;
 for(let t=0;t<N;t++){
   const pool=sq.map(r=>({...r, form:jitter(r.form, FORM_SIGMA*0.80)}));
   pool.push({...meR, form:jitter(meR.form, FORM_SIGMA*0.62)});
   const L=lineupFrom(pool, 0.8, bias, false, clubName);
   if(L && Object.values(L).some(r=>r&&r.id===meR.id)) hit++;
 }
 return cl(Math.round(100*hit/N),1,99);
}
/* --- ILE Z TEJ SZANSY TO TRENER ---
   Do UI (ekran ofert, pasek kolejki): różnica między szansą liczoną z sympatią
   trenera a tą samą szansą przy zerowej sympatii. Dzięki temu gracz widzi
   wprost, ile procent zabiera mu (albo dokłada) sam człowiek z programem
   w ręku — zamiast zgadywać, dlaczego przy tym samym OVR jeden klub daje
   80%, a drugi 45%. */
function appearanceCoachPart(p, club, atm, S){
 if(typeof coachLike!=='function' || typeof LINEUP_REL_W==='undefined') return 0;
 const rel = coachLike(club.name, {id:-1, me:true, ovr:p.ovr, age:p.age, form:p.form||0});
 if(!rel) return 0;
 // 1 punkt sympatii ≈ LINEUP_REL_W „punktu OVR" w oczach trenera
 return Math.round(rel*LINEUP_REL_W*10)/10;
}
