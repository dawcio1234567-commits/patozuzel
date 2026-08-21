/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Zima w gipsie
   Pula "WEV_KONTUZJOWANY" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2688-2713 oryginału).
   ============================================================ */
const WEV_KONTUZJOWANY = [
/* ===== KONTUZJOWANY W PRZERWIE ZIMOWEJ ===== */
/* Te same zasady, co przy zdarzeniach sezonowych: fizycznie niemożliwe rzeczy
   (Argentyna, zgrupowania, treningi na lodzie) są teraz zablokowane dla
   kontuzjowanego (patrz injured() w engine.js), ale zima w gipsie to wciąż
   zima — poniższe trzy zdarzenia trafiają się WYŁĄCZNIE jemu. */
{id:'kontuzja_zima_kibice', t:'KIBICE PRZYWOŻĄ KARTKĘ DO SZPITALA',
 x:'Delegacja kibiców przyjeżdża pod dom z ogromną kartką „Wracaj zdrowy" i skrzynką piwa bezalkoholowego — „bo wiadomo, rehabilitacja". Ktoś od razu robi z tego relację na klubowym Facebooku.',
 cond:(p)=>injured(p),
 o:[
  {l:'Wpuszczam ich, robimy sobie zdjęcie do gazety.', f:()=>[fxM(12), fxL(6)]},
  {l:'Dziękuję przez domofon, nie jestem w formie na gości.', f:()=>[fxP(5), fxM(-4)]}
 ]},
{id:'kontuzja_zima_offer', t:'KLUB PYTA, CZY ZDĄŻYSZ NA OKIENKO',
 x:'Zarząd dzwoni z pytaniem wprost: czy z takim urazem w ogóle warto czekać, czy lepiej od razu szukać zawodnika na zastępstwo na cały przyszły sezon. Twoja odpowiedź trafi do protokołu z zebrania.',
 cond:(p)=>injured(p),
 o:[
  {l:'Zapewniam, że wrócę silniejszy niż przed kontuzją.', f:()=>[fxP(8), fxM(4), 'Zarząd zapisuje to sobie na przyszłość — dobrze albo źle, zależy, jak wróci sezon.']},
  {l:'Mówię wprost: decyzja należy do nich, ja teraz się nie liczę.', f:()=>[fxL(-4), fxP(3), 'Szczerze, ale zarząd zapamiętuje taki ton.']}
 ]},
{id:'kontuzja_zima_dieta', t:'ZIMA NA KANAPIE',
 x:'Bez treningów i bez toru dni w gipsie ciągną się jednakowo — kanapa, telewizor, jedzenie na pocieszenie. Dietetyk klubowy dzwoni z przypomnieniem, że mięśnie, których nie używasz, nie czekają w miejscu.',
 cond:(p)=>injured(p),
 o:[
  {l:'Trzymam dietę mimo wszystko, choć nie mogę jeździć.', f:()=>[fxP(7), fxIN(-4)+' (wracasz z mniejszą nadwyżką kilogramów do zrzucenia)']},
  {l:'Odpuszczam sobie — i tak nikt tego nie widzi.', f:()=>[fxP(-6), 'Kilka kilogramów, które trener zauważy pierwszego dnia zbiórki.']}
 ]}
];
