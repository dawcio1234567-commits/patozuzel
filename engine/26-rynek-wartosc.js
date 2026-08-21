/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: RYNEK WARTOSC
   Wartość rynkowa, zainteresowanie klubu, stawka za punkt
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4030-4253 oryginału).
   ============================================================ */
/* ============================================================
   6. KONTRAKTY / OFERTY
   ============================================================ */
/* ============================================================
   DLACZEGO STARY KLUB SIĘ NIE ODEZWAŁ
   W realnym żużlu prezes po prostu przestaje odbierać telefon, a zawodnik
   dowiaduje się z portalu, że wzięli Szweda. W grze to wyglądało jak bug
   silnika, więc makeOffers() zapisuje teraz powód odrzucenia do G.noRenew,
   a UI wywala go graczowi na ekran ofert.
   ============================================================ */
function renewRejection(miss, rating, lastAvg){
 const p=G.p;
 if(!p.club) return null;
 let lk=null, c=null;
 LKEYS.forEach(k=>{ const f=G.leagues[k].clubs.find(x=>x.name===p.club); if(f&&!c){c=f;lk=k;} });
 const avgTxt=(lastAvg==null?1.4:lastAvg).toFixed(2);
 if(!c) return {club:p.club, lk:null, code:'gone',
   t:'TWÓJ KLUB PRZESTAŁ ISTNIEĆ',
   x:'Szyld, pod którym jeździłeś, zniknął z ewidencji. Nie ma z kim negocjować, nie ma kto podpisać.',
   quote:'„Numer nieaktualny. Biuro klubu jest zamknięte, a klucze ma syndyk."'};
 
 const gap=Math.round(rating - riderLevel(c));
 const brokeMoney = c.budget<=0 || (c.arr||0)>100000 || (c.debt||0)>150000;
 
 // 1) ZACHOWANIE POZA TOREM — twarda flaga z sezonu
 if(miss && miss.code==='behave') return {club:c.name, lk, code:'behave',
   t:'KLUB ZERWAŁ NEGOCJACJE — POWÓD POZASPORTOWY',
   x:'To nie kwestia średniej. '+c.name+' zamknął temat twojego kontraktu jeszcze w trakcie sezonu, '+
     'po tym, co zrobiłeś poza torem. Decyzja zapadła w gabinecie, nie na torze.',
   quote:'„Sportowo? Sportowo nie mieliśmy zastrzeżeń. Ale są rzeczy, których się w tym klubie nie robi."',
   tip:'Profesjonalizm i lojalność odbudujesz tylko czasem i spokojnym sezonem.'};
 
 // 1b) SŁUP OGŁOSZENIOWY — TO TY NIE CHCESZ ICH, NIE ODWROTNIE
 if(miss && miss.code==='billboard') return {club:c.name, lk, code:'billboard',
   t:'ODMÓWIŁEŚ PRZEDŁUŻENIA — KLUB SPRZEDAŁ WŁASNĄ NAZWĘ',
   x:c.name+' ma w nazwie '+(miss.titles||2)+' sponsorów tytularnych. Kevlar wygląda jak tablica '+
     'ogłoszeń, spiker nie wyrabia z przeczytaniem szyldu, a przy twoim profesjonalizmie ('+p.prof+
     ') nikt z twojego otoczenia nie pozwoliłby ci tam zostać. To nie klub, to slup reklamowy z torem.',
   quote:'„Panie, my mamy trzech sponsorów w nazwie. TRZECH. Jak pan chce robić karierę, to nie tutaj."',
   tip:'Kluby z 2-3 sponsorami tytularnymi są zamknięte dla zawodników z profesjonalizmem powyżej '+SPON.profBlock+'.'};

 // 2) SPORTOWO ZA SŁABY NA ICH AMBICJE
 if(miss && miss.code==='sport') return {club:c.name, lk, code:'sport',
   t:'JESTEŚ SPORTOWO ZA SŁABY NA ICH AMBICJE',
   x:c.name+' celuje w poziom OVR '+c.ovr+'. Twoja wartość rynkowa to '+Math.round(rating)+
     ' (OVR '+p.ovr+', medialność '+p.med+', średnia z zeszłego sezonu '+avgTxt+') — różnica '+gap+
     ' pkt jest większa, niż ten klub jest w stanie przełknąć w składzie.',
   quote:'„Szanujemy chłopaka, ale my walczymy o play-off, a nie o to, żeby ktoś nam wypełniał rubrykę."',
   tip:'Zejdź klasę niżej, odbuduj średnią i wróć — albo szukaj klubu o OVR bliżej '+Math.max(20,Math.round(rating))+'.'};
 
 // 3) KLUBU NA CIEBIE NIE STAĆ
 if(brokeMoney) return {club:c.name, lk, code:'money',
   t:'KLUBU PO PROSTU NA CIEBIE NIE STAĆ',
   x:c.name+' tonie w zobowiązaniach'+((c.debt||0)>0?' (samemu tobie zalega '+zl(c.debt)+')':'')+
     ((c.arr||0)>0?', a wobec całej kadry ma '+zl(c.arr)+' zaległości':'')+
     '. Budżet na twój kontrakt nie istnieje — nie w tym roku.',
   quote:'„Panie, my nie mamy czym zapłacić za prąd na stadionie, a pan przychodzi po kontrakt."',
   tip:'Kluby z długami biorą tanich zawodników. Twoja stawka była za wysoka jak na ich kasę.'};
 
 // 4) DECYZJA SPORTOWO-KADROWA: junior, Szwed, twoja średnia
 let why, quote;
 if(p.age>33){
   why='Klub przestawia się na młodszą kadrę. Masz '+p.age+' lat i, jak to ujął menedżer, „nie jesteś inwestycją".';
   quote='„Musimy budować drużynę na trzy lata do przodu. On tych trzech lat już nie ma."';
 } else if((lastAvg||0)<1.2){
   why='Twoja średnia '+avgTxt+' nie broni miejsca w składzie. Postawili na juniora z własnego szkolenia — '+
       'kosztuje mniej i wypełnia rubrykę młodzieżową.';
   quote='„Przy takiej średniej to my wolimy dać jeździć swojemu chłopakowi. Przynajmniej się nauczy."';
 } else if(p.prof<35){
   why='Sportowo się bronisz, ale sztab ma dosyć twojej pracy poza torem (profesjonalizm '+p.prof+
       '): spóźnienia, sprzęt nieprzygotowany, telefon wyłączony.';
   quote='„Talent talentem, tylko my nigdy nie wiedzieliśmy, w jakim on przyjedzie stanie."';
 } else {
   why='Zwykła decyzja kadrowa: na twoje miejsce wzięli obcokrajowca ze średnią wyżej niż twoja ('+avgTxt+'). '+
       'Dowiedziałeś się z portalu, jak wszyscy.';
   quote='„Rozmowy? Były rozmowy. No, mieliśmy zadzwonić."';
 }
 return {club:c.name, lk, code:'squad', t:'KLUB NIE ZŁOŻYŁ CI OFERTY PRZEDŁUŻENIA', x:why, quote,
   tip:'Nic nie jest przesądzone — inne kluby z listy obok wciąż cię chcą.'};
}
 
/* ============================================================
   RYNEK TRANSFEROWY — SKĄD BIORĄ SIĘ OFERTY
   ------------------------------------------------------------
   Do tej pory cała wycena zawodnika mieściła się w jednej linijce
   (`rating = OVR + medialność*0,08 + (średnia-1,4)*7`), a gracz nie widział
   z niej NIC: na ekranie pojawiały się kluby, stawki i premie, których nie
   dało się z niczym powiązać — stąd wrażenie, że oferty są przypadkowe.
   Teraz są dwie jawne liczby, obie rozpisane na składniki i obie pokazywane
   przy każdej ofercie:

     WARTOŚĆ RYNKOWA — ile jesteś wart sportowo, na tej samej skali, na której
                       liczony jest OVR klubów. Składa się z: OVR, średniej
                       z ostatniego sezonu, medialności, profesjonalizmu,
                       wieku i (u zawodowca) własnego sprzętu.
     ZAINTERESOWANIE — na ile TEN konkretny klub cię chce: różnica wartości
                       do jego poziomu, rubryka młodzieżowa/U24, lojalność,
                       realne miejsce w ich składzie i stan ich kasy.

   Stawka za punkt i premia za podpis liczone są z tych samych liczb oraz
   z zamożności klubu — a nie z gołego rzutu kością. Klub bez pieniędzy nie
   złoży oferty jak z Ekstraligi, a klub z pełną kadrą na twojej pozycji
   nie będzie się bił o kogoś, kto i tak będzie oglądał mecze z parkingu.
   ============================================================ */
const MARKET={
 /* AVGW PODNIESIONE Z 9 NA 15: skarżono się, że średnia z ostatniego sezonu
    zbyt słabo przekłada się na oferty — mistrzowski rok ze średnią 2.7+
    powinien wywindować wycenę wyraźnie, a fatalny sezon (średnia poniżej 1.0)
    powinien tak samo wyraźnie ją zdołować. Przy avgW=15 różnica między
    średnią 1.0 a 2.7 to już +25.5 pkt do wyceny (dawniej +15.3). */
 avgRef   : 1.40,  avgW  : 15,        // średnia biegopunktowa: odniesienie i waga
 medRef   : 40,    medW  : 0.10,
 profRef  : 45,    profW : 0.12,
 equipRef : 55,    equipW: 0.10,
 /* Krzywa wieku: 19-27 to okno, w którym kluby płacą najchętniej. Junior jest
    tańszy sportowo (ale ma rubrykę), trzydziestolatek zaczyna tracić. */
 age      : {16:-6, 17:-4, 18:-2, 19:0, 20:1, 21:2, 22:2, 23:2, 24:2, 25:2,
             26:1, 27:1, 28:0, 29:0, 30:-1, 31:-2, 32:-4, 33:-6, 34:-8, 35:-10},
 ageOld   : -13,                                    // 36 lat i więcej
 /* KL Z 480 NA 650, E2 Z 1150 NA 1350: stawka za punkt w dolnych ligach była
    ustawiona tak nisko, że nawet zawodnik dopasowany poziomem do klubu nie
    był w stanie odrobić kosztów życia i serwisu w trakcie sezonu — patrz
    komentarz przy ECON.liveLeague/ECON.svcLeague w data.js. Ekstraliga
    zostaje bez zmian, żeby nie spłaszczyć różnicy między ligami do zera. */
 rateBase : {EL:2400, E2:1350, KL:650},             // zł/pkt w klubie o średnim poziomie ligi
 bonusMax : 0.030                                   // maks. część budżetu klubu na premię za podpis
};

/* WARTOŚĆ RYNKOWA + ROZPISKA. Skala ta sama, co OVR klubów. */
function marketValue(p, lastAvg){
 const parts=[];
 const add=(d,w)=>{ d=Math.round(d*10)/10; if(d) parts.push({d,w}); return d; };
 let s=p.ovr;
 parts.push({d:p.ovr, w:'OVR '+p.ovr+' — czysta jazda, punkt wyjścia całej wyceny'});
 s += add((lastAvg-MARKET.avgRef)*MARKET.avgW,
   'średnia biegopunktowa ostatniego sezonu '+lastAvg.toFixed(2)+' (odniesienie '+MARKET.avgRef.toFixed(2)+')');
 s += add((p.med-MARKET.medRef)*MARKET.medW,
   'medialność '+p.med+' — bilety, logo sponsora, telefon od dziennikarza');
 s += add((p.prof-MARKET.profRef)*MARKET.profW,
   'profesjonalizm '+p.prof+' — sprzęt gotowy na czas, terminy, brak awantur');
 const ag = p.age>=36 ? MARKET.ageOld : (MARKET.age[p.age]!=null?MARKET.age[p.age]:0);
 s += add(ag, 'wiek '+p.age+' lat — '+(ag>0
     ? 'jesteś w oknie, w którym kluby płacą najchętniej'
     : ag<0 ? (p.age<=18 ? 'jeszcze surowy, klub kupuje przyszłość, nie punkty'
                         : 'kluby liczą lata, nie tylko punkty')
            : 'wiek neutralny dla wyceny'));
 if(p.contract && p.contract.type==='Zawodowy')
   s += add((p.equip-MARKET.equipRef)*MARKET.equipW,
     'sprzęt '+p.equip+'/99 — jeździsz swoim, klub bierze to pod uwagę');
 if(p.next.betterOffers) s += add(5, 'twoja sprawa poszła szeroko — menedżerowie dzwonią sami');
 if(p.banSeasons>0)      s += add(-15, 'aktywna dyskwalifikacja — na papierze jesteś nie do wystawienia');
 return {rating: Math.round(s*10)/10, parts};
}

/* SZYBKI SZACUNEK MIEJSCA W SKŁADZIE (bez 140 symulacji na każdy z 24 klubów).
   Z kim realnie walczysz: młodzieżowiec o dwa miejsca młodzieżowe, senior
   o pierwszą piątkę. Wynik >0 = wchodzisz do składu tego klubu. */
function squadPressure(p, clubName){
 const sq=squadOf(clubName).filter(r=>!r.me && !r.retired);
 if(!sq.length) return 12;
 const me=effectiveOvr(p, 100, 0);
 const rel = isJun(p) ? sq.filter(isJun) : sq.filter(r=>!isJun(r)||isU24(r));
 const slots = isJun(p) ? 2 : 5;
 const sorted = (rel.length?rel:sq).slice().sort((a,b)=>b.ovr-a.ovr);
 const cut = sorted[slots-1] ? sorted[slots-1].ovr : (sorted[sorted.length-1]||{ovr:0}).ovr;
 return Math.round(me-cut);
}

/* ZAINTERESOWANIE KLUBU (0-100 %) + ROZPISKA. */
function clubInterest(p, c, lk, rating){
 const parts=[];
 const add=(d,w)=>{ d=Math.round(d); if(d) parts.push({d,w}); return d; };
 const gap = rating - riderLevel(c);
 let want=42;
 parts.push({d:42, w:'punkt wyjścia — każdy klub kogoś szuka'});
 /* Młodzieżowiec bije się o rubrykę młodzieżową, a nie o miejsce w pierwszej
    piątce — dlatego bycie poniżej poziomu klubu boli go dużo mniej niż seniora.
    Bez tego 16-latek z OVR 30 nie dostawał telefonu z ŻADNEJ ligi, mimo że
    regulamin każe klubom szukać właśnie takich. */
 const gw = gap>=0 ? 2.4 : (p.age<=21 ? 1.0 : p.age<=24 ? 1.7 : 2.4);
 want += add(cl(gap*gw,-60,40),
   'wartość rynkowa '+Math.round(rating)+' kontra poziom klubu '+c.ovr+' (różnica '+(gap>0?'+':'')+Math.round(gap)+')'+
   (gap<0&&p.age<=24?' — łagodzona przez rubrykę wiekową':''));
 if(p.age<=21)      want += add(20, 'rubryka młodzieżowa U21 — bez młodzieżowca klub nie ustawi składu');
 else if(p.age<=24) want += add(9,  'rubryka U24 — obowiązkowe miejsce w pierwszej piątce');
 if(p.age>=33)      want += add(-10,'wiek '+p.age+' — klub buduje kadrę na kilka sezonów do przodu');
 if(c.name===p.club && p.loyalty>0) want += add(p.loyalty*0.55, 'znają cię tu — lojalność '+p.loyalty+'/100');
 if(p.prof<30)      want += add(-14,'profesjonalizm '+p.prof+' — opinia idzie przed tobą');
 else if(p.prof>75) want += add(8,  'profesjonalizm '+p.prof+' — z takim zawodnikiem nie ma problemów organizacyjnych');
 if(p.med>70)       want += add(7,  'medialność '+p.med+' — sprzedajesz bilety i zadowalasz sponsora');
 const press=squadPressure(p, c.name);
 want += add(cl(press*0.9,-24,10), press>=0
   ? 'ich kadra: wchodzisz do składu (przewaga '+press+' pkt nad ostatnim z rotacji)'
   : 'ich kadra: mają już kogo wystawiać (brakuje ci '+(-press)+' pkt do składu)');
 if((c.debt||0)>150000)             want += add(12, 'klub ma wobec kadry zaległości '+zl(c.debt)+' — bierze tego, kto podpisze');
 if(c.budget<=0 && (c.arr||0)>0)    want += add(-22,'puste konto i niezapłacone pensje — nie mają za co brać nikogo');
 if(c.name.includes('Rybnik') && p.next.rowPen) want += add(-25, 'twój wpis o „guru" — tutaj ci go nie zapomnieli');
 return {want: cl(Math.round(want),2,96), parts, gap, press};
}

/* STAWKA ZA PUNKT — LICZONA, NIE LOSOWANA.
   Liga × poziom klubu × jego realna zamożność × twoja wartość × medialność. */
function offerRate(p, c, lk, rating, gap){
 const parts=[];
 const base=MARKET.rateBase[lk]||MARKET.rateBase.KL;
 const avgL=leagueAvgOvr(lk)||c.ovr;
 const qual   = cl(0.55+0.45*(c.ovr/Math.max(1,avgL)), 0.50, 1.50);
 const budgetF= cl(0.70+Math.max(0,c.budget)/Math.max(1,(LEAGUE_INC[lk]||1)*2.2), 0.55, 1.45);
 const valF   = cl(1+gap*0.022, 0.60, 1.70);
 const medF   = cl(1+(p.med-40)/320, 0.85, 1.20);
 let rate = base*qual*budgetF*valF*medF*RF(0.94,1.08);
 parts.push({w:'stawka bazowa w lidze '+(G.leagues[lk]?G.leagues[lk].short:lk), v:zl(base)});
 parts.push({w:'poziom klubu ('+c.ovr+' przy średniej ligi '+Math.round(avgL)+')', v:'×'+qual.toFixed(2)});
 parts.push({w:'zamożność klubu (budżet '+zl(c.budget)+')', v:'×'+budgetF.toFixed(2)});
 parts.push({w:'twoja wartość kontra poziom klubu', v:'×'+valF.toFixed(2)});
 parts.push({w:'medialność '+p.med, v:'×'+medF.toFixed(2)});
 if((c.arr||0)>0){ rate*=0.85; parts.push({w:'klub zalega kadrze '+zl(c.arr)+' — negocjuje w dół', v:'×0,85'}); }
 if(p.age<=23){
   const m=ECON.youngRate[p.age]||1;
   parts.push({w:'uwaga: przy twoim wieku klub wypłaci '+Math.round(m*100)+'% tej stawki (taryfa młodzieżowa)', v:''});
 }
 return {rate: Math.max(120, Math.round(rate)), parts};
}
