/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Sytuacje, które dzieją się WYŁĄCZNIE zimą
   Pula "WEV_Z_LATA" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2497-2574 oryginału).
   ============================================================ */
const WEV_Z_LATA = [
/* ============================================================
   PRZENIESIONE Z PULI LETNIEJ — TE SYTUACJE DZIEJĄ SIĘ WYŁĄCZNIE ZIMĄ
   (usunięte z EVENTS, żeby nie wypadały w środku okresu startowego)
   Efekty przepisane na wersje międzysezonowe: fxH→fxHN, fxI→fxIN,
   fxRate→fxRateN, „koniec sezonu” → p.next.zeroMatches / p.next.heatPP.
   ============================================================ */
{id:'schabowe', t:'SCHABOWE Z ŻONĄ',
 x:'Grudniowy wieczór. Wchodzisz do kuchni, a twoja żona trzyma w ręku nóż. Radio gra „Nie ma mocnych na Mariolę”.',
 w:3,
 o:[
  {l:'Wchodzę do kuchni.', f:()=>{ if(chance(95)) return ['Robi schabowe. Same płaty, panierka jak trzeba.', fxO(1)+' — zima przy takim jedzeniu wyszła spokojna'];
     G.p.next.heatPP = (G.p.next.heatPP||0) - 10;
     return ['Odcinasz sobie palec przy krojeniu.', fxO(-2),
             'Ręka w gipsie do marca — wchodzisz w sezon nieprzygotowany (-10 p.p. szans na biegi).'];}},
  {l:'Wracam do salonu i udaję, że nic nie widziałem.', f:()=>['Kolacja była o 22:00. Zimna.']}
 ]},

{id:'wiatrowka', t:'ZNALEZIONA WIATRÓWKA',
 x:'Styczeń, nuda, śnieg po kostki. Znajdujesz w domu wiatrówkę po dziadku. Obok leży puszka śrutu i stara tarcza z korka.',
 w:2,
 o:[
  {l:'Czas się zabawić.', f:()=>{ if(chance(95)) return ['Kilka strzałów do puszki i tyle. Sąsiad nawet nie wyszedł.'];
     return [fxEnd('niekontrolowany odpał na podwórku')];}},
  {l:'Zostawiam ją w spokoju.', f:()=>[fxP(5)]}
 ]},

{id:'zima_zabrze', t:'PRZYGOTOWANIA ZIMOWE: HISZPANIA CZY SIŁOWNIA W ZABRZU',
 x:'Grupa zawodników leci na trzy tygodnie do Almerii. Alternatywa to siłownia na osiedlu w Zabrzu, gdzie pan Mietek każe robić przysiady na czas.',
 cond:(p)=>p.budget>=80000 && !injured(p),
 w:3,
 o:[
  {l:'Lecę do Hiszpanii.', f:()=>[fxK(-80000), fxO(3), fxP(5), fxHN(5)]},
  {l:'Siłownia u Mietka w Zabrzu.', f:()=>[fxO(1), fxM(-5)+' — inni wrzucali story z plaży']}
 ]},

{id:'ojciec', t:'OJCIEC-MENEDŻER CHCE NEGOCJOWAĆ',
 x:'Okienko transferowe za pasem. Ojciec ma teczkę, koszulę i przekonanie, że wszyscy w tej lidze to złodzieje. W sumie ma rację, ale prezesi już się o nim między sobą pisali.',
 w:3,
 o:[
  {l:'Niech negocjuje.',     f:()=>[fxRateN(1.2), fxM(-10), fxHN(-10)+' — trener nie znosi „tatusiów”']},
  {l:'Sam sobie załatwiam.', f:()=>[fxP(5)]}
 ]},

{id:'bogaty_klub', t:'PREZES POKAZUJE NOWĄ HALĘ',
 x:()=>'Zima. Klub ma budżet '+zl((clubOf(G.p)||{budget:0}).budget)+' i właśnie otworzył centrum treningowe z sauną i salą do wideo-analiz. Prezes pyta, czy chcesz swój klucz na te cztery miesiące.',
 cond:(p,c)=>!!c && c.budget>=8000000,
 w:3,
 o:[
  {l:'Wprowadzam się tam na stałe.', f:()=>[fxO(2), fxP(10), fxM(-5)+' — znikasz z życia towarzyskiego', fxHN(4)]},
  {l:'Wolę swój brudny warsztat.',   f:()=>[fxL(-10), fxE(4)]}
 ]},

{id:'argentyna_motocykl', t:'ARGENTYŃCZYK CHCE KUPIĆ TWÓJ MOTOCYKL',
 x:'Międzysezon, więc sprzęt stoi w warsztacie. Zhristian Cubillaga Pisze po hiszpańsku przez tłumacza, że to start jego pięknej kariery w Europie. Ma odłożone oszczędności całej rodziny.',
 w:3,
 o:[
  {l:'Jestem uczciwy.',              f:()=>[fxK(20000), fxM(5), fxP(5)]},
  {l:'Sprzedaję mu oklejony naklejkami Pickiego Nedersena złom.',  f:()=>{G.p.next.noArg=true;return [fxK(50000), fxM(-10), fxP(-10),
     'Most spalony: zaproszenia na IM Argentyny już nie dostaniesz.'];}}
 ]},

{id:'cross', t:'CROSS I MELDONIUM',
 x:'Cztery miesiące bez meczu i przekonanie, że masz za mało jazdy. Dostajesz zaproszenie na zimowe treningi motocrossowe, a przy okazji ktoś podsuwa ci „coś na regenerację”.',
 cond:(p)=>p.form<0 && !injured(p),
 w:4,
 o:[
  {l:'Jadę, bo co może się złego wydarzyć.', f:()=>{const r=R(1,100);
     if(r<=30) return [fxO(2), fxHN(5)];
     if(r<=58) return ['Trzy weekendy w błocie. Zero efektu.'];
     if(r<=86){G.p.next.zeroMatches=true;
       return ['Wpadka dopingowa na zimowych zawodach — federacja zawiesza cię na cały nadchodzący sezon.'];}
     if(r<=92) return ['Otarcia, siniaki i nic więcej.'];
     if(r<=99) return ['Zeskok z hopy, kolano zostaje w koleinie.',
                       fxLongInj('zerwane więzadła krzyżowe w kolanie na treningu crossowym')];
     return [fxEnd('poważny uraz kręgosłupa na crossie — renta')];}},
  {l:'Nie będę się rozpraszać bzdurami.', f:()=>[fxP(3)]}
 ]},

];
