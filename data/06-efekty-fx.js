/* ============================================================
   PATO-ŻUŻEL :: DANE :: SILNIK EFEKTÓW ZDARZEŃ (fx*)
   Cały słownik efektów, z których buduje się opcje zdarzeń losowych.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 472-659 oryginału).
   ============================================================ */
/* ============================================================
   3. ZDARZENIA LOSOWE — SILNIK WARUNKÓW
   ------------------------------------------------------------
   Każdy event może mieć OPCJONALNY warunek cond(p, c, S):
     p — obiekt Gracza (G.p)
     c — jego aktualny klub (obiekt z G.leagues) albo null, gdy Gracz jest bez kontraktu
     S — stan/kontekst sezonu (G.S). Najważniejsze pola:
           S.round   — kolejka, w której wypada sytuacja
                       (1-14 = sezon zasadniczy, 15-16 = play-off / baraże)
           S.matches — ile kolejek już się odbyło
           S.atm     — atmosfera w drużynie (0-100)
   Brak klucza `cond` = event dostępny zawsze.
 
   BALANS (twardo trzymany):
     · OVR                    : zmiany maksymalnie 1-3 pkt
     · prof / med / lojalność : maksymalnie kilkanaście punktów (do 15)
     · atmosfera              : do ±15
     · kary PZM / klubowe     : realne kwoty z polskiego żużla
     · ryzyko urazu, defektu i szans na biegi liczone w punktach procentowych
   ============================================================ */
 
/* --- SKRÓTY DO EFEKTÓW ---
   Każdy helper zmienia stan gry i zwraca gotową linijkę do raportu z sezonu. */
const sgn   = d => (d>0?'+':'')+d;
const fxP   = d => { G.p.prof   = cl(G.p.prof+d,0,99);      return sgn(d)+' Profesjonalizm'; };
const fxM   = d => { G.p.med    = cl(G.p.med+d,0,99);       return sgn(d)+' Medialność'; };
const fxO   = d => { G.p.ovr    = cl(G.p.ovr+d,1,99);       return sgn(d)+' OVR'; };
const fxL   = d => { G.p.loyalty= cl(G.p.loyalty+d,0,100);  return sgn(d)+' Lojalność'; };
const fxA   = d => { G.S.atm    = cl(G.S.atm+d,0,100);      return sgn(d)+' atmosfera w drużynie'; };
/* fxAN — TO SAMO, ALE NA ZIMĘ: w przerwie międzysezonowej nie ma jeszcze atmosfery
   (rzuca się ją dopiero na starcie kolejnego sezonu, patrz startSeason() w engine.js),
   więc zimowe zdarzenia dokładają się do G.p.next.atmBonus, a nie do G.S.atm wprost —
   inaczej efekt siadał na atrapie sezonu i znikał (patrz NAPRAWA w CHANGELOGU). */
const fxAN  = d => { G.p.next.atmBonus = (G.p.next.atmBonus||0)+d; return sgn(d)+' nastroje w szatni na start kolejnego sezonu'; };
const fxE   = d => { G.p.equip  = cl(G.p.equip+d,1,99);     return sgn(d)+' Sprzęt'; };
const fxT   = d => { G.S.teamOvr += d;                      return sgn(d)+' OVR drużyny'; };
const fxOB  = d => { G.S.ovrBonus += d;                     return sgn(d)+' OVR w meczach tego sezonu'; };
const fxH   = d => { G.S.heatPP += d;                       return sgn(d)+' p.p. szans na biegi'; };
const fxHN  = d => { G.p.next.heatPP += d;                  return sgn(d)+' p.p. szans na biegi w kolejnym sezonie'; };
const fxI   = d => { G.S.injuryPP += d;                     return sgn(d)+' p.p. ryzyka urazu'; };
const fxIN  = d => { G.p.next.injuryPP += d;                return sgn(d)+' p.p. ryzyka urazu w kolejnym sezonie'; };
const fxDef = d => { G.S.extraDefP += d/100;                return sgn(d)+' p.p. szansy na defekt'; };
const fxK   = k => { G.p.budget += k;                       return (k>=0?'+':'-')+zl(Math.abs(k)); };
const fxFine= k => { G.p.budget -= k; G.S.fines += k;       return 'Kara '+zl(k); };
const fxBan = n => { G.S.banMatches += n;                   return 'Pauza: '+n+(n===1?' spotkanie':' spotkania'); };
const fxFit = d => { G.S.equipFit = cl(G.S.equipFit-d,0,100); return 'Dopasowanie sprzętu: '+G.S.equipFit+'%'; };
const fxRate= m => { G.S.rateMul *= m; return 'Stawka za punkt w tym sezonie '+(m>=1?'+':'')+Math.round((m-1)*100)+'%'; };
const fxRateN=m => { G.p.next.rateMul = m; return 'Stawka za punkt w kolejnym sezonie '+(m>=1?'+':'')+Math.round((m-1)*100)+'%'; };
const fxEnd = why => { G.p.retired=true; G.p.retireReason=why; G.S.forcedEnd=true; return 'KONIEC KARIERY: '+why; };

/* --- fxSum: PULPIT PODSUMOWANIA PO WYBORZE OPCJI ---
   Gracze zgłaszali brak feedbacku narracyjnego: klikasz opcję i gra od razu
   leci do raportu sezonu. fxSum() wrzuca tekst do bufora, a chooseEv()
   (index.html) po zastosowaniu efektów sprawdza bufor i — jeśli coś w nim
   jest — pokazuje mały pulpit z przyciskiem OK. Dopiero OK zamyka zdarzenie.
   Dwa sposoby użycia:
     · dynamicznie, wewnatrz f():   f:()=>[fxP(-5), fxSum('Tekst na ekran')]
     · statycznie, polem opcji:     {l:'...', sum:'Tekst na ekran', f:()=>[...]}
   fxSum zwraca null, więc NIE trafia do rubryki EFEKTY (fxApply pomija null). */
let EV_SUM=[];
const fxSum = t => { if(t!=null && String(t).trim()) EV_SUM.push(String(t).trim()); return null; };
function evSumClear(){ EV_SUM=[]; }
function evSumTake(){ const a=EV_SUM.slice(); EV_SUM=[]; return a; }

/* --- KTÓRY SĘDZIA PROWADZI ZAWODY ---
   Ten sam problem, co przy `temptClub()` w engine.js: opis zdarzenia (x)
   renderuje się PRZED kliknięciem, a skutek (f) liczy się PO. Gdyby nazwisko
   losowało się dwa razy, gracz czytałby o Pałce, a dostawał walkower Wojaczka.
   Wybór zapada raz na sezon i siedzi w G.S. */
const JUDGES = {
 palka:   {n:'PAŁKA',    d:'służbista, który na gówno torach czyta regulamin literka po literce'},
 wojaczek:{n:'WOJACZEK', d:'ten od obustronnego walkowera w GNIOŚCIE'},
 kobak:   {n:'KOBAK',    d:'niesłuszne czerwone i źle włączone dwie minuty w Gnieźnie'}
};
function judgeDraw(){
 try{
  if(G.S && G.S.judgeCase && JUDGES[G.S.judgeCase]) return G.S.judgeCase;
  const k = pick(Object.keys(JUDGES));
  if(G.S) G.S.judgeCase = k;
  return k;
 }catch(_){ return 'palka'; }
}

/* --- fxS: GENERYCZNY SETTER POLA STANU SEZONU ---
   Część zdarzeń w data.js była pisana skrótem `fxS('banMatches', 14)`, ale
   samego helpera nikt nigdy nie napisał. Efekt: przy wyborze takiej opcji
   `o.f()` leciało ReferenceError, a `chooseEv()` (index.html) NIE miało
   try/catch — gra zatrzymywała się na ekranie zdarzenia i nie dało się
   przejść dalej. Teraz helper istnieje, dokłada wartość do G.S i zwraca
   czytelną linijkę do raportu. */
const FXS_LABEL = {
 banMatches : n => 'Pauza: '+n+(n===1?' spotkanie':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?' spotkania':' spotkań'),
 heatPP     : d => sgn(d)+' p.p. szans na biegi',
 injuryPP   : d => sgn(d)+' p.p. ryzyka urazu',
 teamOvr    : d => sgn(d)+' OVR drużyny',
 ovrBonus   : d => sgn(d)+' OVR w meczach tego sezonu',
 fines      : k => 'Kara '+zl(k),
 extraDefP  : d => sgn(d)+' p.p. szansy na defekt'
};
const fxS = (key, val) => {
 if(!G.S) return String(key)+': '+val;
 const cur = G.S[key];
 if(typeof cur === 'number' || cur === undefined) G.S[key] = (cur||0) + val;
 else G.S[key] = val;
 return FXS_LABEL[key] ? FXS_LABEL[key](val) : (String(key)+' '+sgn(val));
};

/* --- fxApply: JEDNA BRAMA DLA WSZYSTKICH SKUTKÓW ZDARZENIA ---
   Skąd brało się „[object Object]" w rubryce EFEKTY:
   większość zdarzeń zwraca z `f()` tablicę STRINGÓW (helpery fx* same
   zwracają gotowy tekst), ale kilkadziesiąt opcji napisano w drugim,
   nigdy nieobsłużonym formacie — deskryptorze { t:'opis', f:(p)=>... }.
   UI robiło na takim wpisie esc(obiekt) → „[object Object]", a funkcja
   `f` z deskryptora NIGDY się nie wykonywała, więc opcja nie miała żadnych
   skutków poza tekstem-śmieciem.
   fxApply() spłaszcza cokolwiek zwróci zdarzenie, odpala odroczone `f(p)`
   i oddaje czystą listę linijek do wyświetlenia. */
function fxApply(out){
 const txt=[];
 const walk = item => {
   if(item==null || item===false) return;
   if(Array.isArray(item)){ item.forEach(walk); return; }
   if(typeof item==='string'){ if(item.trim()) txt.push(item.trim()); return; }
   if(typeof item==='number'){ txt.push(String(item)); return; }
   if(typeof item==='function'){                       // efekt podany samą funkcją
     try{ walk(item(G.p)); }catch(e){ txt.push('(efekt nie doszedł do skutku: '+e.message+')'); }
     return;
   }
   if(typeof item==='object'){
     if(typeof item.f==='function'){
       try{ item.f(G.p); }catch(e){ txt.push('(efekt nie doszedł do skutku: '+e.message+')'); }
     }
     const t = item.t!=null ? item.t : item.txt!=null ? item.txt : item.text!=null ? item.text : item.l;
     if(t!=null && String(t).trim()) txt.push(String(t).trim());
     return;
   }
   txt.push(String(item));
 };
 walk(out);
 return txt;
}

/* --- WALKOWER — MECZ, KTÓRY SIĘ NIE ODBYŁ ---
   Wcześniej `G.S.walkower=true` powodowało wyłącznie to, że Gracz nie jechał
   w jednej kolejce, a mecz i tak rozgrywał się normalnie i wchodził do tabeli
   z prawdziwym wynikiem. Teraz flaga naprawdę przerywa spotkanie.
   mode:
     'lose' — twoja drużyna oddaje mecz walkowerem (0:75), rywal bierze 2 pkt
     'win'  — rywal się nie stawia (75:0 dla ciebie)
     'both' — obustronny walkower: 0:0, obie drużyny bez punktów meczowych
     'void' — mecz nierozegrany i nieweryfikowany (nikt nie dostaje nic)
   pen — ile punktów w tabeli traci twoja drużyna (przy 'both' traci tyle samo rywal). */
const fxWalk = (mode, pen) => {
 G.S.walkower = true;
 G.S.walkMode = mode || 'lose';
 G.S.walkPen  = pen || 0;
 /* NAPRAWA (feedback): w zdarzeniach dających wynik 0:75 tekst "WALKOWER"
    zastąpiony na życzenie graczy konkretnym cytatem — wynik w tabeli
    (0:75) zostaje bez zmian, zmienia się tylko opis tego, co się stało. */
 return ({lose:'Wróciliśmy do domu. Bez honoru i ambicji, za to z karą od PZM. (0:75)',
          win :'WALKOWER: rywal się nie stawił — 75:0 dla was.',
          both:'OBUSTRONNY WALKOWER: mecz nieodbyty, 0:0.',
          void:'MECZ NIEROZEGRANY: wynik anulowany, nikt nie dostaje punktów.'}[G.S.walkMode])
        + (pen?' Kara w tabeli: -'+pen+' pkt'+(G.S.walkMode==='both'?' dla obu drużyn.':' dla twojej drużyny.'):'');
};

/* --- BARDZO DŁUGA KONTUZJA — ZERWANE WIĘZADŁA / ZŁAMANE UDO ---
   Kończy TEN sezon i zabiera CAŁY kolejny (p.longInjury). Czyta to
   startSeason() i playerRoundStatus() w engine.js. */
const fxLongInj = (what) => {
 const p=G.p;
 p.longInjury = Math.max(p.longInjury||0, INJ.catSeasons);
 const dmg = R(INJ.catDmgMin, INJ.catDmgMax);
 p.ovr = cl(p.ovr-dmg, 1, 99);
 if(typeof logOvr==='function') logOvr(-dmg, 'zerwane więzadła / złamane udo (zdarzenie)');
 G.S.forcedEnd = true;
 G.S.longInjuryNew = (what||'Zerwane więzadła krzyżowe.');
 G.S.longInjuryDmg = dmg;
 return 'KONIEC SEZONU I CAŁY KOLEJNY ROK POZA TOREM: '+(what||'zerwane więzadła krzyżowe')+
        ' (-'+dmg+' OVR). Operacja, rehabilitacja, powrót najwcześniej za dwa lata.';
};

/* --- ALIMENTY --- */
const fxAlimony = () => {
 G.p.alimony = ECON.alimonyYrs;
 return 'ALIMENTY DO ARGENTYNY: '+zl(ECON.alimony)+' co sezon przez '+ECON.alimonyYrs+' lat.';
};
