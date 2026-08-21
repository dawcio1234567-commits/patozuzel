/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: MEDIA, INTERNET I INNE PATOLOGIE
   Pula "EV_MEDIA" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 662-788 oryginału).
   ============================================================ */
const EV_MEDIA = [
/* ===== MEDIA, INTERNET I INNE PATOLOGIE ===== */
{id:'zmarzl', t:'AFERA „ZMARZŁEŚ”',
 x:'Miałeś wypadek, po którym trafiłeś do szpitala. Profil „Awangarda Metanolu” zrobił z tego cały cykl memów. Potem poszła fama, że to przez ciebie zablokowano im konto.',
 o:[
  {l:'Dementuję wszystko, ale przyznaję, że było zabawne.',
   f:()=>[fxP(-8), fxO(-2), fxFine(15000)+' od klubu za „nieuzgodnione stanowisko”', fxA(1),
          'Pół parku maszyn i tak myśli, że to ty zgłosiłeś.']},
  {l:'Nie robię nic — potem tłumaczę ludziom, że to nie moja wina.',
   sum:'Tydzień odpowiadania. Nikt nie uwierzył.',
   f:()=>[fxM(-15), fxO(-3), fxK(-12000)+' na prawnika, który nic nie wskórał']},
  {l:'Udostępniam i robię z tego bekę.',
   f:()=>[fxP(-15), fxM(5), fxO(-3), fxFine(25000)+' za szkodzenie wizerunkowi klubu', 'Prezes dzwonił. Nie odebrałeś.']}
 ]},
{id:'karetka', t:'ZMARZŁEŚ W KARETCE',
 x:'Po wypadku jeden z profili tematycznych pisze, że „zmarzłeś w karetce”. Screen leci dalej, twoja mama znowu komentuje.',
 o:[
  {l:'Robię inbę i próbuję zablokować twórców.', f:()=>[fxM(-10), fxP(7), 'Prawnik klubu przynajmniej miał co robić.']},
  {l:'Mówię, że w karetce faktycznie nie było zbyt ciepło.', f:()=>[fxM(10), fxP(-7), 'Cytat wisi teraz na koszulkach.']}
 ]},
{id:'nagrania', t:'WYCIEK PRYWATNYCH NAGRAŃ',
 x:'Ktoś opublikował nagrania, na których śpiewasz „Eniułej, eniułej”, „Słodko-słodka” i „Nie ma mocnych na Mariolę”. Sektor B już się tego nauczył.',
 o:[
  {l:'Skoro wyciekło, to jadę z tym dalej!', f:()=>[fxM(15), fxP(-5), fxA(-7)]},
  {l:'Obracam w żart, ale nowych filmików nie będzie.', f:()=>[fxM(7), fxA(5), fxP(3)]},
  {l:'Usuwajcie to natychmiast!', f:()=>[fxP(7), fxM(-7), fxA(-15), 'Szatnia uznała, że przesadziłeś.']}
 ]},
{id:'lech', t:'PYTANIE ZE STADIONU LECHA',
 x:'Odjechałeś zawody w Poznaniu. Internetowy śmieszek podstawia ci mikrofon: „jest taka popularna przyśpiewka — kurwy i śmiecie z Poznania nie wyjedziecie — wolałbyś być kurwą czy śmieciem?”.',
 o:[
  {l:'Kurwą.',  f:()=>[fxM(-15), fxP(-15), fxA(-5)+' — szatnia oglądała to sto razy']},
  {l:'Śmieciem.', f:()=>[fxM(-15), fxP(-15), fxA(-5)+' — kierownik drużyny złapał się za głowę']},
  {l:'Oddaję głos do studia i wracam malować sufit.', f:()=>['Nic się nie dzieje. Sufit wyszedł równo.']}
 ]},
{id:'opowiadanie', t:'DZIENNIKARZ I OPOWIADANIE',
 x:'Przychodzi do ciebie dziennikarz gazety sportowej i pyta, czy przeczytasz z nim na wizji pewne opowiadanie z internetu.',
 o:[
  {l:'Jasna sprawa, Przemo.', f:()=>[fxM(10), fxP(-10)]},
  {l:'Ty chory pojebie.',     f:()=>[fxP(10), fxM(-5)]}
 ]},
{id:'muka', t:'PATEUSZ MUKA PISZE O TOBIE PASZKWIL NA X-ie',
 x:'Wątek na 14 tweetów: „Dlaczego ten zawodnik jest symbolem upadku polskiego żużla — analiza”. Pod spodem 400 komentarzy i twoja mama pisząca „nieprawda”.',
 o:[
  {l:'Nie reaguję.', f:()=>[fxP(5), fxM(-5)]},
  {l:'„Staram się nie wymiotować, jak patrzę na pana”.', f:()=>{const b=R(1,2);return [fxM(15), fxP(-15), fxBan(b), 'Regulamin ligi zna słowo „wizerunek”.'];}}
 ]},
{id:'podcast', t:'PODCAST „GADA SIĘ RZURZEL”',
 x:'„Podcast żużlawki” nalewa ci piwo już w piętnastej minucie i pyta, co naprawdę myślisz o prezesach w tej lidze. Kamera się nagrywa, a w tle stoi roll-up Awangardy Metanolu.',
 o:[
  {l:'Mówię wszystko. Nazwiska, kwoty, daty.', f:()=>[fxM(15), fxP(-10), fxFine(15000)+' z PZM za „naruszenie dobrego imienia”']},
  {l:'Mówię o świetnej atmosferze w zespole.', f:()=>[fxM(3), fxP(3), 'Nudno, ale bezpiecznie.']}
 ]},
{id:'pozarlik', t:'WYWIAD Z JULIĄ POŻARLIK',
 x:'Rywal wywiózł cię na płot na wyjściu z drugiego łuku. Adrenalina na maksa, kevlar rozdarty, a przed tobą mikrofon i kamera na żywo.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Patrzę się w jej stopy i plotę głupoty, których nikt nie rozumie.', f:()=>[fxM(-8), fxP(-5), fxA(5), fxOB(2)+' (złość dobrze robi na gaz)']},
  {l:'Odmawiam wywiadu.', f:()=>['Nic się nie dzieje. Absolutnie nic.']}
 ]},
{id:'jezus', t:'WYWIAD Z JEZUSEM ZE SZROTOWIZJI',
 x:'Reporter Szrotowizji, który wygląda jak Jezus, zaprasza cię do wywiadu — po czym przedstawia cię jako zwycięzcę biegu, Kranciszka Franczewskiego.',
 cond:(p)=>p.age<=21,
 o:[
  {l:'„Ale Kranek jest tam, ja Wzymon Szolski jestem”.', f:()=>[fxM(15), 'Klip obejrzała cała liga.']},
  {l:'Udaję Franczewskiego.', f:()=>{const d=R(5,15);return [fxM(5), fxP(d)+' (Kranek się nie zorientował)'];}}
 ]},
{id:'zdrowko', t:'CZY ZE ZDRÓWKIEM JEST OKEJ?',
 x:'Miałeś kraksę, a reporter Szrotowizji wyglądający jak Jezus podbiega z pytaniem, czy ze zdrówkiem jest okej.',
 cond:(p)=>p.age<=21,
 o:[
  {l:'Bluzgam go i każę mu wypierdalać.', f:()=>{const m=R(-10,10);return [fxM(m), fxP(R(-15,-10))];}},
  {l:'Grzecznie odpowiadam.', f:()=>[fxP(5)]}
 ]},
{id:'dj', t:'DJ-ING W KLUBIE',
 x:'Znajomy DJ zaprosił cię do występu w jednym z klubów. Konsola świeci, tłum nagrywa, a ty masz w niedzielę mecz.',
 cond:(p)=>p.med>40,
 o:[
  {l:'Jedna noc nikomu nie zaszkodzi — gram do końca!', f:()=>[fxM(12), fxP(-3)]},
  {l:'Skoro już mnie nagrywają, zróbmy z tego show!',   f:()=>[fxM(15), fxP(-7), fxA(-5)]},
  {l:'Chyba wystarczy tej zabawy. Wracam do domu.',      f:()=>[fxP(7), fxA(5), fxM(-7)]},
  {l:'Spodobało mi się. Chętnie zagram tu ponownie!',    f:()=>[fxM(14), fxP(-5), fxA(-3)]}
 ]},
{id:'taniec', t:'ZAPROSZENIE DO „TAŃCA Z GWIAZDAMI”',
 x:'Produkcja dzwoni w środku okresu startowego. Mówią, że żużel „jest teraz modny” i że potrzebują kogoś z charakterem. Honorarium jest większe niż twój kontrakt.',
 cond:(p)=>p.med>30 && !injured(p),
 o:[
  {l:'Idę tańczyć.', f:()=>[fxM(15), fxP(-15), fxK(100000), fxH(-30)+' (treningi odpadły, trener wpisał cię do rezerwy)', fxOB(-2)]},
  {l:'Odmawiam, mam sezon.', f:()=>[fxP(10), fxM(-5), fxO(2)+' (cały luty na torze zamiast na parkiecie)', fxOB(2)+' — forma życia']}
 ]},
{id:'tiktok', t:'PREZES ZAKAZUJE ZAWODNIKOM TIKTOKA',
 x:'Regulamin wewnętrzny 14b: „zakaz publikowania treści z parku maszyn”. Powodem jest filmik kolegi, który pokazał, ile klub mu zalega.',
 cond:(p)=>p.med>20,
 o:[
  {l:'Wrzucam i tak.', f:()=>[fxM(15), fxP(-5), fxL(-10), fxFine(10000)+' (regulaminowa)']},
  {l:'Kasuję konto.',  f:()=>[fxM(-10), fxP(10), fxL(10)]}
 ]},
{id:'gwiazda', t:'AGENT MARKETINGOWY Z WARSZAWY',
 x:'Facet w marynarce na gołe ciało mówi, że „zbudował markę trzem sportowcom” i chce 30% od wszystkiego w zamian za duży hajs z reklam.',
 cond:(p)=>p.med>=70,
 o:[
  {l:'Podpisuję z nim układ.', f:()=>{const k=R(50000,150000);return [fxK(k)+' z kontraktów reklamowych', fxM(10), fxH(-5)+' (sesje zdjęciowe zamiast treningu)'];}},
  {l:'Nie oddam procentów komuś, kto nie umie odpalić motocykla.', f:()=>[fxP(8), 'Agent obsmarował cię na LinkedInie.']}
 ]},
{id:'lombard', t:'LOMBARD „SZYBKA GOTÓWKA” CHCE BYĆ NA TWOIM KEVLARZE',
 x:'Logo miałoby zajmować cały tył, pod numerem. Właściciel mówi, że to „inwestycja w lokalny sport”, a jego trzej pracownicy stoją przy wejściu i nic nie mówią.',
 o:[
  {l:'Biorę, kevlar i tak jest brzydki.', f:()=>[fxK(40000), fxM(-15)]},
  {l:'Dziękuję, poczekam na normalnego sponsora.', f:()=>[fxM(10)]}
 ]},
{id:'polewaczka', t:'CYTAT NA POLEWACZCE',
 x:'Prezes pyta, czy pomożesz mu nakleić na polewaczkę cytat pewnego austriackiego akwarelisty. Ma już wydrukowaną folię.',
 o:[
  {l:'Ja wohl.', f:()=>[fxL(5), fxM(15), fxP(-15), fxFine(5000)+' z PZM']},
  {l:'Nie.',     f:()=>[fxP(10), 'Prezes obraził się na dwa tygodnie.']}
 ]},
{id:'pies', t:'PIES ZE SCHRONISKA',
 x:'Lokalne schronisko prosi, żebyś wziął od nich psa. Zdjęcie już wisi na ich fanpage’u, podpisane twoim nazwiskiem.',
 o:[
  {l:'Czas wytresować Psa.', f:()=>[fxO(1)+' (spacery to też trening)', fxM(10)]},
  {l:'Won z tym kundlem.',   f:()=>[fxO(-1), fxM(-15)]}
 ]},
{id:'wejscie', t:'WEJŚCIE NA LEWO',
 x:'Starszy pan prosi cię o załatwienie wejścia na lewo na lokalną rundę SGP. Mówi coś o rekordzie obejrzanych rund i pokazuje zeszyt.',
 o:[
  {l:'Wpuszczam go.', f:()=>{G.p.next.forceClub='weak';return [fxM(-15), 'Ochrona zapamiętała twoją twarz.','W kolejnym sezonie zostaje ci kontrakt w słabym klubie z najniższej ligi.'];}},
  {l:'Spieprzaj dziadu.', f:()=>[fxP(15)]}
 ]},
 
];
