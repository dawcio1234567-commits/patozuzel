/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: TOR, SĘDZIOWIE, SZATNIA
   Pula "EV_TOR" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 789-919 oryginału).
   ============================================================ */
const EV_TOR = [
/* ===== TOR, SĘDZIOWIE, SZATNIA ===== */
{id:'busoprawa', t:'OPRAWA W BUSIE',
 x:'Grupa kibiców prosi cię o pomoc w przemyceniu twoim busem specyficznej oprawy na mecz. W kartonie coś się rusza.',
 cond:(p,c,S)=>S.round>0 && !!c,
 o:[
  {l:'Pomagam kibicom.',
   sum:'Patrzę jak świnia w szaliku rywali biega po torze.',
   f:()=>{const l=[fxA(3), fxT(1)];
     if(chance(10)) l.push(fxBan(1)+' — wydział regulaminowy obejrzał nagrania'); else l.push('Nikt niczego nie udowodnił.');
     return l;}},
  {l:'Odmawiam.',
   sum:'Nie ma oprawy w busie, są kamienie.',
   f:()=>[fxP(3), fxK(-10000)+' na naprawę busa (szyby, lakier, jedna felga)', fxA(-5)]}
 ]},
{id:'przyczepny', t:'PRZYCZEPNY TOR I BUNT',
 x:'Przyjeżdżasz na mecz, na którym gospodarz przygotował tor tak przyczepny, że koledzy z drużyny wywracają się już na próbie toru.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Buntuję ekipę i odmawiamy startu.', f:()=>{const l=[fxA(2), fxWalk('lose',0)];
     if(chance(20)) l.push(fxBan(1)+' — PZM uznał odmowę za twoją inicjatywę'); return l;}},
  {l:'Odjeżdżam pełne spotkanie.', f:()=>[fxP(3), fxI(10)]}
 ]},
{id:'obchod', t:'MĘSKA DECYZJA NA OBCHODZIE TORU',
 x:'Przed meczem obie drużyny robią obchód toru. Po opadach nawierzchnia wygląda jak pole po orce, a spiker już zapowiada „znakomite warunki”.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Męska decyzja — odjeżdżamy spotkanie.', f:()=>[fxP(6), fxA(6)]},
  {l:'Odwołujemy spotkanie.',                 f:()=>[fxP(-2), fxA(-2)]},
  {l:'Sędzia mówi, że tor jest dobry — razem z rywalami odmawiamy jazdy.', f:()=>{
     return [fxP(-7), fxM(15), fxWalk('both',1), 'Obustronny walkower, obie drużyny tracą po punkcie w tabeli.'];}}
 ]},
{id:'przerwanie', t:'CZEKANIE NA PRZERWANIE WYŚCIGU',
 x:'W trakcie meczu rywal wsadza cię w płot na przeciwległej prostej. Leżysz w trawie, silniki jeszcze pracują.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Nic nie robię.', f:()=>[fxP(3)]},
  {l:'Mówię w wywiadzie, że to kawał szmaty i nic więcej.', f:()=>[fxM(6), fxP(-2)]},
  {l:'Wstaję i stoję na środku toru, aż sędzia przerwie wyścig.', f:()=>{
     const l=[fxP(-7), fxM(15), 'Czerwona kartka — wykluczenie z meczu.', fxBan(1)];
     /* Stanie na torze przy pracujących silnikach to nie protest, to loteria. */
     if(chance(12)) l.push('Ostatni zawodnik nie zdążył zejść z gazu i wjechał w ciebie.',
                           fxLongInj('wieloodłamowe złamanie kości udowej po wjechaniu przez rywala'));
     return l;}}
 ]},
{id:'lis', t:'SĘDZIA LIS WYKLUCZA CIĘ NIESŁUSZNIE',
 x:'Dokładnie tak samo, jak w poprzednim biegu wyglądała próba rywala — tam było czysto. Czerwona lampa, ty stoisz z rozłożonymi rękami, stadion buczy.',
 o:[
  {l:'„KURWA MAĆ, NIE BĄDŹ PAN ZAWODNIKIEM DO CHUJA…”', f:()=>[fxM(15), fxP(-15), 'Czerwona kartka w spotkaniu.', fxBan(1)]},
  {l:'Cofam się do parku maszyn i przyjmuję tłumaczenie sędziego.', f:()=>[fxP(10), fxM(-3)]}
 ]},
{id:'sedziamotor', t:'JAZDA NA MOTOCYKLU SĘDZIEGO',
 x:'Sędzia proponuje, że będzie odliczał do trzech przy puszczaniu taśmy, jeśli pozwolisz mu przejechać się na twoim motocyklu.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'„Nie bądź pan zawodnikiem do chuja”.', f:()=>[fxP(3), fxH(-10)]},
  {l:'„Bądź pan zawodnikiem do chuja”.',     f:()=>[fxP(-3), fxH(10)]}
 ]},
{id:'dublowanie', t:'DUBLOWANIE JUNIORA',
 x:'W biegu jedzie tylko trójka zawodników — ty i twój junior z pary. Na trzecim okrążeniu orientujesz się, że możesz go zdublować.',
 cond:(p,c,S)=>p.ovr>75 && S.round>0,
 o:[
  {l:'Hamuję nogami, byle przywiózł punkt.', f:()=>[fxA(8), fxP(-6)]},
  {l:'Dubluję kolegę z pary.',               f:()=>[fxP(7), fxA(-15), fxH(-10)]}
 ]},
{id:'juniormotyw', t:'MOTYWACJA DLA JUNIORA',
 x:'Twój junior traci pozycje na trasie i wraca do parku maszyn ze spuszczoną głową. Patrzy na ciebie jak na wyrocznię.',
 cond:(p,c,S)=>p.age>21 && S.round>0,
 o:[
  {l:'Mówię mu, że mencele go jebią.', f:()=>[fxP(-10), fxA(-10), fxM(12)+' — nagranie z parku maszyn poszło w świat']},
  {l:'Mówię, że nic się nie stało.',   f:()=>[fxP(10), fxA(12)+' — szatnia widziała, jak podnosisz dzieciaka', fxL(5)]}
 ]},
{id:'kaskjuniora', t:'KASK JUNIORA',
 x:'Widzisz, że utalentowany junior jadący z tobą w biegu nie zapiął kasku. Taśma za dziesięć sekund.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Zwracam mu uwagę.', f:()=>[fxP(10)]},
  {l:'Zlewam, co będzie, to będzie.', f:()=>{G.p.next.forceClub='weak_medium';
     return [fxP(-10), 'Karma działa wolno, ale skutecznie: po sezonie zmieniasz klub — na słaby albo średni, jak padnie.'];}}
 ]},
{id:'licencjaz', t:'NOWY TALENT Z LICENCJĄ Ż',
 x:'Junior klubu zdał licencję Ż. W parku maszyn mówi się, że ma taki talent, że za rok zabierze ci miejsce w składzie.',
 cond:(p,c,S)=>p.age>21 && S.round>0,
 o:[
  {l:'Pokazuję mu magię X-Demona i Werandy.', f:()=>[fxH(10)+' do końca sezonu', 'Junior ma teraz inne priorytety.']},
  {l:'Zamknięte oczy, zamknięta banda, otwarte oczy trenera.', f:()=>{G.S.noRenew=true;return [fxBan(2), 'Klub zrywa negocjacje o nowy kontrakt.'];}}
 ]},
{id:'weteran', t:'MŁODY PYTA CIĘ O USTAWIENIA',
 x:'Osiemnastolatek z twojego klubu podchodzi po treningu i pyta, jak ustawiasz zawieszenie na mokry tor. Za trzy lata będzie chciał wygryźć cię ze składu.',
 cond:(p)=>p.age>=30,
 o:[
  {l:'Tłumaczę mu.', f:()=>[fxP(10), fxM(5), fxT(2), fxH(-5)+' (pomagasz konkurencji)']},
  {l:'„Sam się naucz”.', f:()=>[fxM(-5), fxH(5)]}
 ]},
{id:'gaznik', t:'CUDOWNY GAŹNIK',
 x:'Zapominasz założyć dyszę w gaźniku, a motocykl jedzie szybciej niż kiedykolwiek. Zdobywasz czysty komplet punktów i nie masz pojęcia, jak to wytłumaczyć.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Oddaję kierownikowi zawodów drugi, sprawny motocykl.', f:()=>[fxP(-7), fxA(3), 'Nikt się nie zorientował. Prawie nikt.']},
  {l:'Przyznaję się kierownikowi.', f:()=>{G.S.noRenew=true;G.S.teamPts-=1;
     return [fxP(3), 'Punkty z tego spotkania odebrane — drużyna traci 1 pkt w tabeli.', 'Klub zrywa negocjacje o nowy kontrakt.'];}}
 ]},
{id:'podprowadzajaca', t:'PODPROWADZAJĄCA I SABOTAŻ',
 x:'Spodobałeś się najbardziej urokliwej podprowadzającej twojego klubu. Ma pomysł, jak ci się odwdzięczyć przed domowym meczem.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Nie, dzięki, mam swoją godność.', f:()=>[fxP(2), fxM(-3)]},
  {l:'Mrugam okiem, żeby jej koleżanki pomyliły pola startowe.', f:()=>{const l=[fxOB(1)+' (jeden bieg masz w kieszeni)', fxP(-5)];
     if(chance(35)) l.push(fxBan(R(2,3))+' — komisja obejrzała nagranie z pól startowych'); return l;}}
 ]},
{id:'ksiazeczka', t:'BRAK KSIĄŻECZKI Z BADANIAMI',
 x:'Zapomniałeś książeczki z badaniami lekarskimi, a kierownik zawodów stoi przy stoliku i przegląda dokumenty jednego zawodnika po drugim.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Wkładam 500 zł w dowód rejestracyjny busa i podaję sędziemu.', f:()=>{
     G.p.budget -= 500;                                   // koperta wychodzi z kieszeni ZAWSZE
     if(chance(50)) return ['Sędzia oddał dowód bez słowa. Jedziesz w meczu.', '-'+zl(500)+' (koperta w dowodzie)'];
     return [fxBan(2), fxP(-10), '-'+zl(500)+' (koperty nikt nie oddał)', 'Sprawa poszła do wydziału regulaminowego.'];}},
  {l:'Przyznaję się do błędu.', f:()=>[fxBan(1), fxP(5)]}
 ]},
{id:'obiad', t:'OBIAD DLA OSÓB FUNKCYJNYCH',
 x:'Twój stary znowu wchodzi na catering i pałaszuje porcję przeznaczoną dla osób funkcyjnych. Kierownik toru patrzy, ale nic nie mówi.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Niech je, w końcu przyjechał.',
   sum:'Porcja była nieświeża, stary ma sraczkę.',
   f:()=>[fxFit(20), fxP(-5), 'Mechanika w tym meczu nie ma — siedzi z ojcem pod toaletą.']},
  {l:'Wyciągam go za rękaw i sam biorę tacę.',
   sum:'W końcu coś innego niż mielone.',
   f:()=>[fxK(50*BAL.rounds)+' (oszczędność na obiadach)', fxP(3)]}
 ]},
 
];
