/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: KONTUZJE, ZDROWIE, DOPING
   Pula "EV_ZDROWIE" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1226-1304 oryginału).
   ============================================================ */
const EV_ZDROWIE = [
/* ===== KONTUZJE, ZDROWIE, DOPING ===== */
{id:'anglia_ur', t:'NIEDOLECZONA KONTUZJA W ANGLII',
 x:'W ostatnim meczu w Anglii uszkodziłeś rękę, ale najbliższe spotkanie ligowe może zdecydować, czy klub utrzyma się w lidze.',
 cond:(p,c,S)=>S.round>=10,
 o:[
  {l:'Odmawiam jazdy z niedoleczoną kontuzją.', f:()=>[fxA(-7), fxBan(1)]},
  {l:'Jadę z niedoleczoną kontuzją.', f:()=>{const l=[fxA(7)];
     if(chance(5)){G.p.banSeasons=1;G.S.forcedEnd=true;l.push('Wypuściłeś motocykl z rąk. Potężne zawieszenie i przerwa na cały kolejny sezon.');}
     else l.push('Ręka wytrzymała. Ledwo.');
     return l;}}
 ]},
{id:'obojczyk', t:'LEKARZ: „PĘKNIĘTY OBOJCZYK” — A ZA TYDZIEŃ BARAŻ',
 x:'Zdjęcie RTG nie pozostawia złudzeń. Trener stoi obok i patrzy na ciebie tym jednym spojrzeniem, które wszyscy w tym sporcie znają.',
 cond:(p,c,S)=>S.round>=10,
 o:[
  {l:'Jadę na zastrzykach.',        f:()=>{
     const l=[fxM(10), fxP(10), fxOB(-3)+' (jedziesz jedną ręką)', fxI(30)];
     if(chance(14)) l.push('Ręka puściła kierownicę w pierwszym łuku barażu.',
                           fxLongInj('zerwane więzadła w kolanie i otwarte złamanie uda po upadku z niedoleczoną ręką'));
     return l;}},
  {l:'Leczę się jak dorosły człowiek.', f:()=>[fxBan(3), fxM(-5), fxO(2)+' — ciało wreszcie odpoczęło']}
 ]},
{id:'dietetyk', t:'DIETETYK Z INSTAGRAMA',
 x:'Ma 200 tysięcy obserwujących, certyfikat z webinaru i plan żywieniowy w PDF-ie. Twoja mama mówi, że wyglądasz jak z obozu.',
 o:[
  {l:'Robię cut przed rewanżami.', f:()=>[fxO(2), fxP(-10)+' (osłabienie organizmu)', fxI(15)]},
  {l:'Jem schabowego u mamy.',     f:()=>[fxO(-1), fxP(5)]}
 ]},
{id:'doping', t:'KONTROLA ANTYDOPINGOWA W BIRMINGHAM',
 x:'Szwagier miał urodziny i przez cały weekend imprezowałeś. Wyrywkowa kontrola przed meczem w Anglii każe ci oddać mocz do badania.',
 o:[
  {l:'Oddaję mocz.', f:()=>{ if(chance(60)){G.S.forcedEnd=true;return ['Wynik przyszedł po trzech tygodniach.','Zawieszenie do końca obecnego sezonu.'];}
     return ['Czysto. Sam się zdziwiłeś.', fxP(5)];}},
  {l:'Nie oddaję moczu.', f:()=>{G.p.banSeasons=1;G.S.forcedEnd=true;return ['Odmowa to przyznanie się.','Zawieszenie do końca tego i przez cały kolejny sezon.'];}},
  {l:'Każę sędziemu się gonić.', f:()=>{G.S.forcedEnd=true;return [fxFine(50000)+' grzywny', 'Zawieszenie do końca sezonu.'];}}
 ]},
{id:'wyjazdy', t:'WYJAZDY ZAGRANICZNE',
 x:'Potrzebujesz jazdy, żeby złapać formę. Na stole leżą cztery terminarze i jeden kalendarz ligowy, w który wszystko musi się zmieścić.',
 cond:(p)=>p.form<0 || p.ovr<70,
 o:[
  {l:'Wybieram Szwecję.',        f:()=>[fxP(3), fxO(R(0,1))]},
  {l:'Wybieram Danię.',          f:()=>{const b=R(0,2);const l=[fxP(2), fxO(R(1,2))]; if(b) l.push(fxBan(b)+' w polskiej lidze'); return l;}},
  {l:'Wybieram Wielką Brytanię.',f:()=>{const b=R(0,1);const l=[fxM(2), fxO(R(0,1)), fxH(3)]; if(b) l.push(fxBan(b)); return l;}},
  {l:'Siedzę na dupie w kraju.', f:()=>['Trzy tygodnie bez motocykla. Nic się nie zmienia.']}
 ]},
{id:'anglia', t:'TELEFON Z ANGLII — OFERTA Z BRITISH SPEEDWAY',
 x:'Klub z Premiership chce cię na czwartki. To dodatkowe pieniądze i dodatkowe 4000 kilometrów w busie co tydzień.',
 cond:(p)=>p.ovr>=62 && p.age>=20,
 o:[
  {l:'Biorę.', f:()=>[fxK(100000), fxO(2)+' (więcej jazdy)', fxI(15)+' z przemęczenia', fxE(-10)]},
  {l:'Skupiam się na polskiej lidze.', f:()=>[fxH(5), fxP(5)]}
 ]},
{id:'lot', t:'SPÓŹNIENIE NA LOT',
 x:'Spóźniłeś się na samolot, ale klub ma szerokie kontakty, żeby ściągnąć cię na mecz. Prezes mówi tylko: „mam człowieka od awionetek”.',
 cond:(p,c,S)=>S.round>0 && p.budget>15000,
 o:[
  {l:'Wybieram tradycyjną metodę z przesiadkami.', f:()=>{ const l=[fxP(-3)];
     if(chance(75)) l.push(fxBan(1)+' — nie zdążyłeś'); else l.push('Zdążyłeś w ostatniej chwili.');
     return l;}},
  {l:'Korzystam z awionetki.', f:()=>{const r=R(1,100);
     if(r<=70) return ['Wylądowałeś 40 minut przed pierwszym biegiem.'];
     if(r<=90) return ['Daremny trud — mgła nad lotniskiem.', fxBan(1)];
     if(r<=95){G.p.next.zeroMatches=true;G.S.forcedEnd=true;return ['Przymusowe awaryjne lądowanie. Uraz kręgosłupa.','Kolejny sezon: 0 spotkań.'];}
     if(r<=96) return [fxEnd('katastrofa awionetki')];
     return ['Wylądowałeś, choć pilot wyglądał na zaskoczonego.'];}}
 ]},
{id:'francja', t:'ZAWODY WE FRANCJI',
 x:'Powołano cię na zawody reprezentacyjne do Francji, dzień przed meczem ligowym. Jesteś wykończony, ale duński kolega proponuje, że cię odwiezie.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Daję mu telefon, żeby wpisał miejscowość w Maps, i idę spać.', f:()=>{
     if(chance(50)) return [fxSum('Tylko debil by źle wklepał adres, mój kolega ogarnia.'),
                            'Zdążyliście na czas.', fxP(5), fxK(20000)+' premii'];
     return [fxSum('Tylko debil by pomylił wiochę pod Pcimiem z miastem - i nim był.'),
             'Pomylił miasta o tej samej nazwie.', fxBan(1), fxM(-15)];}},
  {l:'Życie na walizkach, ale co to za życie.', f:()=>{ if(chance(80)) return ['Nie zdążyłeś.', fxBan(1), fxP(5)];
     return ['Zdążyłeś, ale ledwo trzymasz kierownicę.', fxI(20)];}}
 ]},
 
];
