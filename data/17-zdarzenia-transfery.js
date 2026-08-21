/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: KUSZENIE PRZEZ RYWALA, TRANSFERY W TRAKCIE SEZONU
   Pula "EV_TRANSFERY" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1494-1724 oryginału).
   ============================================================ */
const EV_TRANSFERY = [
/* ===== MIĘDZYSEZONIE: KUSZENIE PRZEZ RYWALA =====
   (IM ARGENTYNY przeniesione do WINTER_EVENTS — patrz niżej) */
{id:'kuszenie', t:'KUSZENIE PRZEZ INNY KLUB — RYWAL PŁACI KARĘ UMOWNĄ',
 x:()=>{const t=temptClub(); return 'Masz podpisane jeszcze '+G.p.contract.years+' lata. Menedżer '+
   (t?esc(t.name):'bogatszego klubu')+' mówi wprost: „karę umowną bierzemy na siebie, prezes twojego klubu dostanie przelew, '+
   'a ty busa i stawkę, o jakiej tam nie pomarzysz”. Wszystko na parkingu przed halą, bez świadków.';},
 /* Tylko przy DŁUGIM, wciąż trwającym kontrakcie i realnym klubie */
 cond:(p,c,S)=>!!c && p.contract.years>=2 && !!temptClub(),
 w:6,
 o:[
  {l:'Biorę kasę i jadę. Lojalność nie płaci rat za busa.', f:()=>{
     const t=temptClub();
     const kara=R(60000,140000);
     G.p.contract.years=1;                       // umowa kończy się z tym sezonem
     G.p.next.forceClub = t ? t.name : 'weak';
     G.S.noRenew=true;
     return [fxK(kara)+' „premii lojalnościowej” od nowego pracodawcy',
             fxL(-45), fxP(-12), fxM(10),
             'Kara umowna zapłacona przez '+(t?t.name:'nowy klub')+'. Twój stary prezes dowiedział się z portalu.',
             'PO SEZONIE PRZECHODZISZ DO: '+(t?t.name:'losowego klubu')+'.']; }},
  {l:'Mam umowę i mam słowo. Zostaję.', f:()=>{
     const t=temptClub();
     return [fxL(18), fxP(10), fxM(-4),
             'Menedżer '+(t?t.name:'rywala')+' wyszedł bez pożegnania. Szatnia i sektor B dowiedzieli się, że odmówiłeś.']; }}
 ]},
{id:'slowacja', t:'ZAPROSZENIE ZE SŁOWACJI',
 x:'Martin ze Słowacji zaprasza cię do znajomych na Facebooku, a w wiadomości ma już gotową propozycję kontraktu i zdjęcie toru w Żarnovicy.',
 o:[
  {l:'Akceptuję.', f:()=>{G.p.next.forceClub='weak';G.p.next.rateMul=1.4;
     return ['Transfer do losowego klubu z najniższej ligi — za to z wysoką stawką za punkt.', fxP(-5)];}},
  {l:'Odrzucam.',  f:()=>[fxL(3)]}
 ]},
{id:'alfred', t:'TAJEMNICZA PRZEJAŻDŻKA',
 x:'Alfred z Leszna proponuje Ci przejażdżkę samochodem, aby omówić sprawy sprzętowe.',
 o:[
  {l:'Zgadzam się.', f:()=>{ 
     if(chance(25)) return [fxO(5)+' (Sprzedał Ci tajniki żużla)'];
     return [fxEnd('Wypadek podczas wycieczki z Alfredem. Koniec kariery.')];
  }},
  {l:'Polecę awionetką z Tomaszem, będzie szybciej.', f:()=>[fxI(40)]}
 ]},
{id:'maksym_wlewka', t:'WIECZOREK POETYCKI',
 x:'Maksym zaprasza Cię na małą wlewkę i wieczorek poetycki.',
 o:[
  {l:'Idę na to.', f:()=>[fxO(2), fxM(-20)]},
  {l:'Nie idę, bo dostanę depresji.', f:()=>[fxP(10)]}
 ]},
{id:'ojciec_afera', t:'KONFLIKT Z OJCEM',
 x:'Twój ojciec był przy Tobie przez całą karierę. Stwierdzasz, że czas odciąć pępowinę. Kłócicie się w parku maszyn.',
 o:[
  {l:'Nie przepraszasz ojca.', f:()=>[fxM(30), pick([fxO(5), fxO(-5)])]},
  {l:'Przepraszasz.', f:()=>[fxP(10), fxM(-5), fxO(1), fxH(10)]}
 ]},
{id:'karetka_lodz', t:'BŁYSKAWICZNA KARETKA W ŁODZI',
 x:'Podczas meczu w Łodzi ulegasz wypadkowi. Prezes klubu łapie Cię za ramię i mówi, że szybko załatwi karetkę.',
 o:[
  {l:'Zgadzasz się.', f:()=>{ 
     if(chance(80)) return [fxI(-20)];
     return [fxEnd('Karetka okazała się karawanem, a ratownika widziałeś w dokumencie o jakichś Łowcach.”. Koniec kariery.')];
  }},
  {l:'Odmawiasz i czekasz na NFZ.', f:()=>[fxI(20)]}
 ]},
{id:'brat_dziewczyna', t:'RODZINNY KONFLIKT',
 x:'Spotykasz fajną dziewczynę na stadionie. Twój brat pyta, czy może ją odprowadzić do domu.',
 o:[
  {l:'Dajesz mu wolną rękę.', f:()=>[fxI(50)+' (Agresja na torze rośnie)']},
  {l:'Nie dajesz.', f:()=>[fxM(-20)]}
 ]},
{id:'maz_dziwna', t:'WIZYTA W BUDCE KOMENTATORSKIEJ',
 x:'Tomasz zaprasza Cię jako gościa do budki komentatorskiej w trakcie meczu.',
 o:[
  {l:'Zgadzam się (i z jakiegoś powodu lepię się dziwną mazią).', f:()=>[fxM(10)]},
  {l:'Wolę go nie słuchać.', f:()=>[fxP(10)]}
 ]},
{id:'minister_sportu', t:'WIZYTA MINISTRA SPORTU',
 x:'Ważne spotkanie. Na stadionie ma się pojawić Minister Sportu, a sędziować będzie znany z surowości arbiter.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Zróbmy kartoflisko na torze.', f:()=>{ 
     if(chance(70)) return [fxT(3), fxO(1)];
     // p.club to NAZWA klubu (string), nie obiekt — stary zapis `p.club.c.budget`
     // nigdy nic nie robił. Klub wyciągamy przez clubOf().
     return [fxWalk('lose', 0), fxS('banMatches', R(0,3)),
             {t:'Kara od GKSŻ: -300 000 zł dla klubu', f:(p)=>{const c=clubOf(p); if(c) c.budget-=300000;}}];
  }},
  {l:'Jedziemy uczciwie.', f:()=>[fxT(-1), fxH(-10)]}
 ]},
{id:'swinia_szalik', t:'NIELEGALNA OPRAWA',
 x:'Grupa kibiców prosi Cię o pomoc w przemyceniu Twoim busem specyficznej oprawy na mecz derbowy.',
 o:[
  {l:'Pomagam im.', f:()=>{ 
     if(chance(10)) return [fxT(3), fxS('banMatches', 3)];
     return [fxT(3)+' (Świnia w szaliku rywali biega po torze)'];
  }},
  {l:'Odmawiam.', f:()=>[fxP(10)]}
 ]},
{id:'prezes_quad', t:'ŚWIRUJĄCY PREZES',
 x:'Jedziesz mecz finałowy o awans. Twój prezes po pierwszym wygranym spotkaniu zaczyna świrować na quadzie pod taśmą.',
 cond:(p,s)=>s.round>=14 && !injured(p),
 o:[
  {l:'Patrzysz z zażenowaniem.', f:()=>[fxP(-5), fxM(15)]}
 ]},
{id:'tlumacz_mechanik', t:'WYWIAD Z TŁUMACZEM',
 x:'Brytyjska telewizja prosi o wywiad, ale Ty nie znasz angielskiego. Obok stoi Twój mechanik z zawodówki.',
 o:[
  {l:'Odpowiadasz sam.', f:()=>[fxM(-20), fxP(10)]},
  {l:'Podstawiasz mechanika („Dobra, powiedz mu, że kurwa ciężko było”).', f:()=>[fxM(30), fxP(-15)]}
 ]},
{id:'udawany_upadek', t:'LEŻĘ DALEJ!',
 x:'Upadasz w 14. biegu na ostatniej pozycji, ale widzisz, że przegrywacie 1:5. Postanawiasz leżeć dalej, wymuszając powtórkę.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Leżę!', f:()=>{ 
     if(chance(75)) return [fxEnd('Zdemaskowali Cię. Zostałes wykluczony. Kibice spalili Ci busa. Uzależniłeś się od alkoholu. Obyś nikogo nie potrącił na drodze po pijaku.')];
     return [fxT(2)+' (Kolega wygrał powtórkę)'];
  }},
  {l:'Wstaję i zjeżdżam z toru.', f:()=>[fxP(10)]}
 ]},
{id:'komisariat_ostrowski', t:'OSTROWSKI KOMISARIAT',
 x:'Zostałes zatrzymany przez prezesa klubu pod wpływem stresu pomeczowego. Odgraża się "ty pijaku, jesteś skończony. Ja cię tak załatwię. Jesteś skończony jako zawodnik. Frajer jesteś".',
 cond:(p)=>!injured(p),
 o:[
  {l:'Ty jesteś pijakiem ', f:()=>[fxP(-20), fxM(20)]},
  {l:'Ostentacyjnie idę na łotewski bimber ', f:()=>[fxEnd('Kurcze, jednak nie kłamał - jestem skończony. Hobby wygrało z pracą. Koniec kariery. Obyś nikogo nie potrącił po pijaku.')]}
 ]},
{id:'zbiorka_junior', t:'ZBIÓRKA NA LECZENIE',
 x:'Junior z KLŻ wywalił w bandę na próbie toru. W internecie ruszyła zbiórka na jego leczenie.',
 o:[
  {l:'Jesteśmy żużlową rodziną, dorzucam się.', f:()=>{return [{t:'-100 zł z konta', f:(p)=>p.budget-=100}];}},
  {l:'Co to za ogór, nie daję nic.', f:()=>[fxM(-5)]},
  {l:'Obiecuję publicznie, że dam, ale nie przelewam.', f:()=>{ 
     if(chance(50)) return [fxM(-30), fxP(-20)+' (Wybuchła afera)'];
     return [fxM(10)];
  }}
 ]},
{id:'zbiorka_mistrz', t:'REHABILITACJA MISTRZA',
 x:'Kilkukrotny mistrz świata doznał wielokończynowego złamania. Potrzebuje drogiej rehabilitacji w Szwajcarii.',
 o:[
  {l:'Oddaję mu zarobki z turnieju.', f:()=>[fxP(10)]},
  {l:'#MistrzJestJeden. Udostępniam post, ale kasy nie daję.', f:()=>[fxM(10)]}
 ]},
{id:'kradziony_silnik', t:'CZYJ TO SILNIK?',
 x:'Przypadkiem w Twoim boksie mechanicy znajdują ukradziony silnik juniora z Twojego klubu.',
 o:[
  {l:'Nic i tym nie wiedziałem.', f:()=>[fxP(10)]},
  {l:'Coś o tym wiedziałem.', f:()=>[fxM(10), fxO(-2)]}
 ]},
{id:'rozkrecony_silnik', t:'TAJEMNICA TUNERA',
 x:'Z ciekawości rozkręciłeś silnik od topowego tunera, nie mając jego zgody.',
 o:[
  {l:'Teraz wiem, jak to działa.', f:()=>[fxE(-30), fxP(-15)+' (Tuner zablokował Ci dostęp do swoich jednostek na zawsze)']}
 ]},
{id:'pociag_gwizdek', t:'POCIĄG ZBIEG',
 x:'Prowadzisz w biegu, ale za płotem stadionu przejeżdża pociąg, który gwiżdże. Z zaskoczenia puszczasz gaz i upadasz.',
 o:[
  {l:'Mówisz, że spadł Ci łańcuszek.', f:()=>[fxP(-5), fxO(-5)]},
  {l:'Mówisz prawdę w wywiadzie.', f:()=>[fxP(-20), fxM(10)]}
 ]},
{id:'zemsta_brata', t:'ZEMSTA BRATA',
 x:'Masz upadek w pierwszym łuku z winy zawodnika rywali. Twój krewki brat wybiega z parku maszyn w stronę sprawcy.',
 o:[
  {l:'Krzyczysz, żeby go zostawił.', f:()=>[fxP(10)]},
  {l:'Pozwalasz mu kopnąć leżącego przeciwnika.', f:()=>[fxS('banMatches', 5), fxM(30), fxP(-20)]}
 ]},
{id:'impreza_rybnik', t:'IMPREZA Z RAFAŁEM',
 x:'Kolega Rafał po imprezie w Rybniku pyta, czy go podwieziesz do domu, czy ma wracać sam.',
 o:[
  {l:'Pojadę, kogo niby potrącę o 2 w nocy?', f:()=>[fxM(20), fxP(-10)]},
  {l:'Niech jedzie sam. Da radę.', f:()=>[fxP(20)]}
 ]},
{id:'impreza_spanie', t:'WIECZÓR PRZED MECZEM',
 x:'Jesteś na mocnej imprezie u ziomka, a następnego dnia rano jedziesz bardzo ważne spotkanie.',
 o:[
  {l:'Otwierasz drzwi od auta i wypadzasz na ulicę (wozisz Ryana Sullivana).', f:()=>[fxP(-10), fxO(15), {t:'Pogorszone relacje z prezesem'}]},
  {l:'Idziesz spać na tylnej kanapie.', f:()=>[fxO(-10), fxP(-5)]}
 ]},
{id:'janusz_pytanie', t:'WYWIAD O PIAŚCIE',
 x:'Lokalny dziennikarz podtyka Ci mikrofon i pyta wprost: „Kim dla Pana jest Piast Kołodziej?”.',
 o:[
  {l:'Stara k***a.', f:()=>[fxM(10), fxP(-20)]},
  {l:'Złodziej.', f:()=>[fxP(10), fxM(-5)]}
 ]},
{id:'kaczorek_ai', t:'OFERTA OD KACZORKA',
 x:'Przychodzi do Ciebie menedżer Piotr K. Mówi, że da Ci łapówkę, jeśli zrobisz parę zer, żeby dopasować Twoje wyniki do algorytmu AI.',
 o:[
  {l:'Zgadzam się.', f:()=>{return [{t:'+10 000 zł, Pomalowany sufit, OVR -5', f:(p)=>{p.budget+=20000;}}, fxO(-5)];}},
  {l:'Odmawiasz i robisz rajd z kolegami przeciwko AI na Twitterze', f:()=>[fxM(-10), fxP(20)]}
 ]},
{id:'wesela_powrot', t:'TRZODA NA WESELU',
 x:'Prezes i trener Twojego byłego klubu robią potężną trzodę na Twoim weselu i namawiają Cię do powrotu.',
 o:[
  {l:'Uśmiechasz się z nimi do zdjęcia.', f:()=>[fxP(-5), fxM(15)]},
  {l:'Wypraszasz ich z wesela z ochroną.', f:()=>[fxP(5), fxM(-10)]}
 ]},
{id:'wizyta_zaklad', t:'WIZYTA ZAKŁAD KARNY',
 x:'Podczas wizyty u kolegi Rafała w lokalnym więzieniu w Rawiczu widzisz parę znajomych twarzy z zarządu.',
 o:[
  {l:'Podchodzisz się przywitać.', f:()=>{return [{t:'W przyszłym okienku dostaniesz tylko słabe oferty', f:(p)=>{p.next.forceClub = 'weak';}}];}},
  {l:'Nie spoufalam się z kryminalistami.', f:()=>[fxP(10), fxI(20)]}
 ]},
{id:'wlasciwy_komentarz', t:'KABINA KOMENTATORSKA',
 x:'Siedzisz w kabinie. Mecz trwa, musisz coś powiedzieć do mikrofonu.',
 o:[
  {l:'„Ozon jest bliżej ziemi”.', f:()=>[fxM(-10)]},
  {l:'Krzyczysz: „HAHAHA SPIDŁEEEEJ!”.', f:()=>[fxM(5), fxP(-15)]},
  {l:'Mówisz losowe rzeczy, bo nie znasz budowy motocykla.', f:()=>[fxP(-15)]}
 ]},
{id:'kask_zapinanie', t:'NOWY KASK OD SPONSORA',
 x:'Przed meczem dostajesz nowy, niesprawdzony kask prosto z Temu.',
 o:[
  {l:'Sprawdzam zapięcie.', f:()=>[fxP(2)]},
  {l:'Zakładam jak leci.', f:()=>{ 
     if(chance(50)) return [fxEnd('Zapięcie puściło w trakcie biegu. Uraz głowy, koniec kariery.')];
     return [fxM(5)];
  }}
 ]},
{id:'szlugemose_szlug', t:'DYMEK W PARKU MASZYN',
 x:'Kolega Szlugemose częstuje Cię dziwnie pachnącym szlugiem tuż po 15. biegu.',
 o:[
  {l:'Biorę.', f:()=>{ 
     if(chance(60)) return [fxS('banMatches', 14), fxP(-30)+' (Wpadka na teście dopingowym)'];
     return [fxM(20), fxO(-2)];
  }},
  {l:'Odmawiam.', f:()=>[fxP(10)]}
 ]},
{id:'zpiecie_kibic_leszno', t:'KIBIC Z LESZNA',
 x:'Wdajesz się w pyskówkę pod płotem z nabuzowanym kibicem z Leszna (styl Tai W.).',
 o:[
  {l:'Przyjmujesz walkę.', f:()=>[fxM(15), fxI(20), fxS('banMatches', 2)]},
  {l:'Wycofujesz się i odchodzisz.', f:()=>[fxP(10)]}
 ]},
];
