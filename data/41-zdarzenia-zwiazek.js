/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: ZWIĄZEK ZAWODOWY, CEGIELSKI, UOKiK
   Pula "EV_ZWIAZEK".
   ------------------------------------------------------------
   UWAGA NA KOLEJNOŚĆ: ten plik ładuje się PO data/40-zdarzenia-index.js
   i dopisuje się na KONIEC tablicy EVENTS (push), zamiast wchodzić
   do concat() w sklejce. Efekt jest ten sam (nowa pula na końcu,
   zgodnie z zasadą 3 z MODULY.md), a sklejki nie trzeba ruszać.

   NOWE FLAGI używane w tej puli:
     p.hasSZZZ  — jesteś szefem związku zawodowego żużlowców
     p.ceglaLvl — poziom Cegielskiego (bez sufitu), rośnie od włażenia
                  w dupę centrali i telewizji
   Obie obsługuje engine/34-zwiazek-cegla.js (razem z fxMech).
   ============================================================ */
const EV_ZWIAZEK = [

{id:'gollob_urodziny', t:'URODZINY TOMASZA GOLLOBA',
 x:'Urodziny Tomasza Golloba, redaktor Marcin Kwietniewski pyta Cię czy wiesz że dziś są urodziny Tomasza Golloba:',
 o:[
  {l:'składasz życzenia', f:()=>[fxP(5)]},
  {l:'robisz aluzje do działaności Zusu', f:()=>[fxM(10), fxP(-10)]}
 ]},

{id:'niedoszly', t:'NIEDOSZŁY',
 x:'amerykański zawodnik MMA staranował ciebie podczas zawodów we Szwecji. Twoje drużyna jest o krok od awansu do finału. Potrzebujesz odjechać jeden bieg, ale masz wyraźny problem z chodzeniem.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'WracaMY',
   sum:'kierownik zespołu siłą zmusza ciebie, abyś zszedł z motocykla i pojechał do szpitala.',
   f:()=>[fxP(-5), fxFine(10000), fxBan(4)]},
  {l:'Nie czuję się najlepiej',
   sum:'Jedziesz do szpitala, gdzie stwierdzają złamanie nogi. Grunt, że nie chciałeś jechać, pajacu.',
   f:()=>[fxP(5), fxBan(4)]}
 ]},

/* ===== ZWIĄZEK ZAWODOWY — BRAMA DO CAŁEJ RESZTY PULI =====
   Warunek jest celowo wąski: albo dwa razy właziłeś w dupę telewizji
   (Cegła lvl 2), albo raz, ale przy profesjonalizmie ponad 95 — czyli
   jesteś układny I wzorowy. Waga podniesiona, bo inaczej przy tak
   wąskim warunku SZZZ trafiałoby się raz na kilka karier. */
{id:'zwiazek_zawodowy', t:'ZWIĄZEK ZAWODOWY', w:8,
 x:'Kristoff Pustacki był zauroczony Twoim występem w telewizji. Być może podlizywanie się było trochę zabawne, ale teraz dostajesz od niego telefon. Potrzebuje nowego szefa związku zawodowego żużlowców.',
 cond:(p)=>((p.ceglaLvl||0)>=2) || ((p.ceglaLvl||0)>=1 && p.prof>95),
 o:[
  {l:'Szef, szefito, boss. Biorę to.',
   sum:'Poważna funkcja i poważne obowiązki. Odblokowujesz nowe wydarzenia.',
   f:()=>{ const p=G.p; p.hasSZZZ=true;
     return [fxM(30),
             fxK(50000)+' — pierwsza transza ryczałtu funkcyjnego',
             'RYCZAŁT SZEFA ZWIĄZKU: +50 000 zł na starcie każdego kolejnego sezonu.',
             'Od teraz to ty odbierasz telefony od zawodników, kiedy tor wygląda jak tarka do sera.'];}},
  {l:'Mam niańczyć innych i świecić swoją mordą? Absolutnie nie',
   f:()=>[]}
 ]},

/* ===== TELEWIZJA PUSTACKI — TU SIĘ RODZI CEGŁA ===== */
{id:'tv_pustacki', t:'TELEWIZJA PUSTACKI',
 x:'W trakcie programu "Na żużlu poważnie rozmawiamy" Kristoff Pustacki powiedział, że kiedyś tory były skandaliczne, ale nowe przepisy ucywilizowały krewkich i bezmyślnych działaczy.',
 cond:(p)=>p.age>=27,
 o:[
  {l:'W pełni się zgadzam. No nic dodać, nic ująć.',
   sum:'Po co Ty w ogóle tak włazisz w dupę? Chcesz jakiejś funkcji?',
   f:()=>{ const lvl=ceglaUp(G.p,1);
     return [fxM(-10), fxP(-10), fxMech(-10),
             'CEGIELSKI +1 → poziom '+lvl+' ('+ceglaName(lvl)+')'];}},
  {l:'Ale poczekaj, kiedyś to były tory... Dzisiaj trochę pokropi i trzeba odwoływać lub ogarniać 7 karetek na mecz bo młodzi nie potrafią.',
   sum:'Ale z ciebie boomer. Powiedz jeszcze, że w Anglii by pojechali...',
   f:()=>[fxMech(10), fxP(10), fxH(10)]}
 ]},

/* ===== STRAJKI SZEFA ZWIĄZKU =====
   Oba zdarzenia mają ten sam szkielet (80/20) i różnią się długością
   zawieszenia po przegranym proteście — wkopywanie band to sprawa
   cięższa regulaminowo niż gwoździe u podnóża bandy. */
{id:'wkopywanie_band', t:'WKOPYWANIE BAND', w:6,
 x:'Jedziecie krajowe ważne zawody nieligowe. Ostatnio coraz więcej wypadków, gdzie banda się podnosiła, kiedy zawodnik puszczał motocykl przed uderzeniem w baloty, a sam wpadał pod nie, często uderzając w drewno. Na obchodzie dostrzegasz nie tylko plastelinę na krawężniku, ale że pod dmuchańce to sam byś wlazł bez pomocy motocykla. Co robisz?',
 cond:(p)=>!!p.hasSZZZ,
 o:[
  {l:'Organizujesz strajk zawodników, domagając się poprawy bezpieczeństwa przez wkopywanie band.',
   f:()=>{ if(chance(80))
      return [fxSum('Przekonałeś większość zawodników, a zarazem postawiłes w szach GKSŻ, sędziego. Musieli się ugiąć i wydali stosowne zarządzenia'),
              fxM(30), fxI(-40), fxMech(10), fxP(10)];
     return [fxSum('"Przecież jeździcie w Danii i Anglii - tam nie jesteście tak rozpieszczani". Niestety protest upada, a Ty dostajesz zawieszenie'),
             fxBan(R(2,4)), fxK(-100000), fxM(-20), fxP(10)];}},
  {l:'"Bez przesady. Zawsze tak jeździliśmy. Teraz i tak jest bezpieczniej."',
   sum:'Niektórzy marudzą. Ale pewnie nie chce im się jechać, jak zawsze w takich zawodach.',
   f:()=>[fxM(-10), fxDef(5), fxI(15)]}
 ]},

{id:'wystajace_gwozdzie', t:'WYSTAJĄCE GWOŹDZIE', w:6,
 x:'Jedziecie krajowe ważne zawody nieligowe. Podczas obchodu toru dostrzegacie z innymi zawodnikami, że tor po zimie wygląda jakby wybrakowany. Jakby brakowało nawierzchni. Stan tej mieszanki jest tak niski, że odsłania gwoździe u podnóża drewnianej bandy. Co robisz?',
 cond:(p)=>!!p.hasSZZZ,
 o:[
  {l:'Zwołujesz strajk, żądając dokonania takich prac, aby te gwoździe już nie wystawały.',
   f:()=>{ if(chance(80))
      return [fxSum('Przekonałeś większość zawodników, a zarazem postawiłes w szach GKSŻ, sędziego. Zawody trzeba było odjechać w innym terminie i na innym torze'),
              fxM(30), fxI(-40), fxMech(10), fxP(10)];
     return [fxSum('"Przecież jeździcie w Danii i Anglii - tam nie jesteście tak rozpieszczani". Niestety protest upada, a Ty dostajesz zawieszenie'),
             fxBan(R(1,2)), fxK(-100000), fxM(-20), fxP(10)];}},
  {l:'"Bez przesady. Zawsze tak jeździliśmy. Teraz i tak jest bezpieczniej."',
   sum:'Niektórzy marudzą. Ale pewnie nie chce im się jechać, jak zawsze w takich zawodach.',
   f:()=>[fxM(-10), fxDef(5), fxI(15)]}
 ]},

/* ===== UOKiK I STAWKI =====
   To jedyne zdarzenie w grze, które rusza RYNEK, a nie tylko ciebie:
   G.ksmMul wchodzi do offerRate() (patrz engine/34), więc podwyżka
   zostaje na resztę kariery i widać ją przy każdej przyszłej ofercie. */
{id:'uokik_stawki', t:'UOKiK I STAWKI', w:5,
 x:'Centrala wprowadziła stawki za punkt chcąc ograniczyć liczbę upadłości klubów żużlowych. System działa dłuższy czas, ale ty wraz z zawodnikami nie jesteście zadowoleni z takiego obrotu regulaminowego. Uważacie, że uniemożliwia to konkurencję finansową. Przecież wy ryzykujecie życiem, liczycie się z szybkim końcem kariery. Kilku zawodników poprosiło ciebie o interwencję.',
 cond:(p)=>p.age>30 && !!p.hasSZZZ,
 o:[
  {l:'"Szanowny Prezesie UOKiK, uprzejmie donosimy, iż..."',
   f:()=>{ const p=G.p;
     if(chance(70)){
       p.contract.rate  = Math.round(p.contract.rate*1.25);
       p.contract.bonus = Math.round((p.contract.bonus||0)*1.25);
       G.ksmMul = (G.ksmMul||1)*1.25;
       return [fxSum('"Porozumienia w zakresie ustalenia maksymalnych stawek wynagrodzeń zawodników sportu żużlowego jako ograniczającego konkurencję polegającą na ograniczeniu klubom możliwości zawierania kontraktów z zawodnikami". Zmieniono regulaminy. Złote czasy zawodników, syndyków i komorników.'),
               fxM(30), fxH(-5),
               'PŁACE WYSTRZELIŁY W KOSMOS: +25% do twojej stawki za punkt ('+zl(p.contract.rate)+'/pkt) i premii za podpis.',
               'Rynek zmieniony na stałe: każda przyszła oferta liczona jest ze współczynnikiem ×'+(G.ksmMul).toFixed(2)+'.'];
     }
     return [fxSum('"W wyniku przeprowadzonej kontroli, Prezes UOKiK nie dostrzegł żadnych uchybień". Pismo nic nie zmieniło, wracacie do pracy.'),
             fxM(10), fxH(-5)];}},
  {l:'Może troche mniej, ale trochę pewniej. Jeszcze będziemy płakali za tym systemem.',
   f:()=>[fxP(10), fxH(10)]}
 ]},

/* ===== UPROWADZENIE RODZICIELSKIE [PATOLOGIA/UŻYWKI] =====
   „Kontuzja ojcostwo" nie jest kontuzją w rozumieniu silnika — to
   nieobecność w składzie, więc idzie zwykłym fxBan(1-2). */
{id:'uprowadzenie', t:'UPROWADZENIE RODZICIELSKIE',
 x:'Jesteś po rozwodzie, gdzie walczono o orzeczenie winy. Walka również była o dzieci - opieka naprzemienna. Teraz córeczki miały przyjechać do Ciebie. Zdarza się, że jest opóźnienie, ale tym razem kolega usłyszał na meczu w Danii, że pewien Duńczyk wraz z twoją byłą ustalili, że dzieci już nie zobaczysz, że je wywożą, gdzieś w kraj...',
 cond:(p)=>p.age>33 && p.prof<40,
 o:[
  {l:'Rzucam wszystko, zgłaszam uprowadzenie rodzicielskie i szukam dzieci',
   sum:'Prawdziwy bohater i wzór ojca.',
   f:()=>[fxBan(R(1,2))+' — kontuzja ojcostwo', fxA(5), fxM(25), fxP(10), fxH(10), fxMech(10)]},
  {l:'Ta blondi od klubowych social mediów jest niczego sobie. Trzeba chyba nowe życie sobie ułożyć...',
   sum:'Dzieci przepadły podobnie jak twoja forma',
   f:()=>[fxO(-5), fxH(-10), fxA(-5), fxM(40), fxMech(15)]}
 ]}

];

/* Dopisanie puli na KONIEC EVENTS — sklejka data/40 pozostaje nietknięta. */
try{ if(typeof EVENTS!=='undefined' && Array.isArray(EVENTS)) EVENTS.push.apply(EVENTS, EV_ZWIAZEK); }catch(_){}
