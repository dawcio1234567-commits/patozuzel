/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: Tylko dla zawodnika z kontuzją długoterminową
   Pula "EV_KONTUZJOWANY" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2054-2082 oryginału).
   ============================================================ */
const EV_KONTUZJOWANY = [
/* ===== KONTUZJOWANY POZA TOREM ===== */
/* Feedback: część zdarzeń (taniec z gwiazdami, obozy, treningi) wyskakiwała
   nawet z zerwanymi więzadłami — teraz są zablokowane (patrz injured() w
   engine.js i cond dopisane wyżej). Ale sezon spędzony w gipsie to wciąż
   sezon — coś się w nim dzieje, tylko z dala od toru. Te trzy zdarzenia
   trafiają się WYŁĄCZNIE kontuzjowanemu zawodnikowi. */
{id:'kontuzja_hejt', t:'HEJT SPOD KOSTKI GIPSOWEJ',
 x:'Siedzisz w gipsie już drugi miesiąc, a pod każdym postem klubu ktoś pyta, „kiedy w końcu zacznie zarabiać na kevlar, zamiast leżeć". DołuStats zrobiło z twojej rehabilitacji osobny wątek.',
 cond:(p)=>injured(p),
 o:[
  {l:'Odpisuję każdemu z osobna, ze szpitalnego łóżka.', f:()=>[fxM(8), fxP(-5), 'Trzy dni scrollowania zamiast rehabilitacji.']},
  {l:'Wyłączam komentarze i zajmuję się ćwiczeniami.', f:()=>[fxP(10), fxM(-5)]},
  {l:'Nagrywam szczery filmik o tym, jak to naprawdę wygląda.', f:()=>[fxM(18), fxP(5), 'Kilku dziennikarzy pyta o wywiad — pierwszy raz z dobrego powodu.']}
 ]},
{id:'kontuzja_kolega', t:'KOLEGA Z SZATNI PODJEŻDŻA Z ZAKUPAMI',
 x:'Nie możesz prowadzić, więc kolega z drużyny robi ci zakupy i przy okazji przywozi plotki z parku maszyn — kto jak jeździ, kto na kogo psioczy, kto już szuka nowego klubu na twoje miejsce.',
 cond:(p)=>injured(p),
 o:[
  {l:'Wypytuję o wszystko, chcę wiedzieć, co się dzieje beze mnie.', f:()=>[fxL(6), 'Wiesz teraz więcej o szatni, niż niejeden, kto jeździ co tydzień.']},
  {l:'Dziękuję i wolę nie myśleć o torze, dopóki nie wrócę.', f:()=>[fxP(4), 'Trudniejsze, ale spokojniejsze popołudnie.']}
 ]},
{id:'kontuzja_rehab', t:'PRYWATNA REHABILITACJA CZY NFZ',
 x:'Lekarz klubowy proponuje kolejkę do fizjoterapeuty przez NFZ — miesiące czekania. Prywatna klinika w Warszawie zrobi to samo w tydzień, tylko trzeba za to zapłacić z własnej kieszeni.',
 cond:(p)=>injured(p),
 o:[
  {l:'Płacę za prywatną rehabilitację.', f:()=>{const k=R(15000,35000);
     return [fxK(-k)+' za prywatną klinikę', fxIN(-8)+' (wracasz lepiej poskładany, niż wynikałoby z samego kalendarza)'];}},
  {l:'Czekam w kolejce jak wszyscy.', f:()=>[fxL(3), 'Miesiące na krześle w poczekalni, za to bez rachunku.']}
 ]},
];
