/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   data.js — statyczna "baza danych" gry (balans, klasy postaci,
   kluby, sprzęt, zdarzenia losowe, progi upadłości, imiona/nazwiska)
   ============================================================ */
 
const BAL={
 leagueW : 0.55,   // udział średniej ligi w punkcie odniesienia (reszta: własny klub)
 belowPen: 2.60,   // mnożnik kary za pierwsze 10 pkt poniżej odniesienia
 knee    : 10,     // do ilu punktów obowiązuje ostra kara
 farPen  : 1.05,   // mnożnik kary powyżej "kolana"
 abovePow: 0.58,   // przewaga nad odniesieniem liczy się łagodniej niż kara
 refDrop : 7.0,    // przelicznik: średnia OVR klubu -> średni OVR jadącego zawodnika
 sigma   : 11.0,    // losowość jednego biegu (tor, taśma, szczęście)
 home    : 2.4,    // atut własnego toru
 rounds  : 14      // kolejek w sezonie zasadniczym
};
 
const CLASSES=[
 {id:'okno', n:'Okno życia',                 ovr:[1,10],  pot:[22,46], prof:[5,30],  med:[0,15], d:'Klub bierze cię, bo ktoś musi wypełnić rubrykę. Jeździsz dla siebie i dla mamy.'},
 {id:'lic',  n:'Licencja żeby klub był bez kar', ovr:[11,25], pot:[34,60], prof:[10,40], med:[0,20], d:'Istniejesz wyłącznie po to, żeby regulamin się zgadzał.'},
 {id:'bez',  n:'Bezjajeczny grajek',         ovr:[26,40], pot:[48,74], prof:[20,55], med:[5,30], d:'Umiesz jeździć, ale w pierwszym łuku zawsze puszczasz gaz.'},
 {id:'pot',  n:'Jakiś potencjał jest',       ovr:[41,50], pot:[60,84], prof:[30,65], med:[10,40],d:'Trener mówi "on ma to coś". Trener mówi tak od czterech lat.'},
 {id:'tal',  n:'Wielki talent',              ovr:[51,60], pot:[72,93], prof:[35,75], med:[20,55],d:'Portale piszą o tobie w każdą środę. Ciśnienie rośnie.'},
 {id:'zma',  n:'Następca Zmarzliny',         ovr:[61,67], pot:[84,99], prof:[40,80], med:[35,75],d:'Etykieta cięższa niż silnik. Albo hala sław, albo hala odlotów.'}
];
 
/* ---------- BAZA KLUBÓW ---------- */
function C(name,ovr,budget){return{name,ovr,budget,debt:0,mood:R(30,80)};}
const BASE_LEAGUES=()=>({
 EL:{name:'EKSTRALIGA', short:'PGE EL', clubs:[
   C('BETARD SPARTA Wrocław',95,10000000),
   C('PRES GRUPA DEWELOPERSKA Toruń',93,9500000),
   C('FOGO UNIA Leszno',90,5000000),
   C('BAYERSYSTEM GKM Grudziądz',88,3500000),
   C('ORLEN OIL MOTOR Lublin',85,12000000),
   C('GEZET STAL Gorzów',82,2500000),
   C('STELMET FALUBAZ Zielona Góra',79,4000000),
   C('KRONO-PLAST WŁÓKNIARZ Częstochowa',68,5000000)
 ]},
 E2:{name:'2. EKSTRALIGA', short:'2. EL', clubs:[
   C('ABRAMCZYK POLONIA Bydgoszcz',72,3000000),
   C('ZDUNEK WYBRZEŻE Gdańsk',70,2600000),
   C('EBUT.PL STAL Rzeszów',68,2400000),
   C('TRANS MF LANDSHUT DEVILS',66,2000000),
   C('ARGED MALESA OSTROVIA Ostrów',64,1800000),
   C('CELLFAST WILKI Krosno',62,1600000),
   C('ŻKS ROW Rybnik',60,1500000),
   C('H. SKRZYDLEWSKA ORZEŁ Łódź',57,1200000)
 ]},
 KL:{name:'KRAJOWA LIGA ŻUŻLOWA', short:'KLŻ', clubs:[
   C('START Gniezno',52,900000),
   C('KOLEJARZ Opole',50,850000),
   C('UNIA Tarnów',48,800000),
   C('LOKOMOTIV Daugavpils',46,750000),
   C('OK BEDMET KOLEJARZ Rawicz',44,700000),
   C('SPEEDWAY WANDA Kraków',42,600000),
   C('POLONIA Piła',40,550000),
   C('ŚLĄSK Świętochłowice',38,500000)
 ]}
});
 
const LKEYS=['EL','E2','KL'];
 
/* ---------- WARSZTAT ----------
   Kolejność = drabinka: im wyżej, tym drożej i tym lepiej. Nic tu nie jest tanie,
   bo w tym sporcie nic tanie nie jest.
   `prof` = próg profesjonalizmu. Sprzęt z górnej półki nie idzie do każdego, kto
   ma gotówkę: tuner nie odda czterech silników komuś, kto gubi termin przeglądu,
   a sztab z Anglii nie podpisze się pod zawodnikiem, który śpi w busie do 11:00.
   `risk` = szansa, że zapłacisz i dostaniesz bubla. */
const TUNERS=[
 {n:'Używany silnik z OLX ("mało jeżdżony, garażowany")',  c:22000,   e:3,  risk:35, prof:0},
 {n:'Szlif u Ryśka "Turbo" z Gorzowa',                     c:60000,   e:7,  risk:18, prof:0},
 {n:'Kadłub po sezonie od kolegi z 2. Ekstraligi',         c:95000,   e:10, risk:12, prof:15},
 {n:'Rama Ellis + komplet nowych kół',                     c:145000,  e:12, risk:0,  prof:20},
 {n:'Silnik po tuningu u R. Kowalskiego',                  c:215000,  e:16, risk:4,  prof:30},
 {n:'Dwa silniki od Kowalskiego + serwis w trakcie sezonu',c:340000,  e:21, risk:2,  prof:42},
 {n:'Pakiet GM prosto od angielskiego tunera',             c:480000,  e:26, risk:0,  prof:55},
 {n:'Cztery silniki od topowego tunera + skrzynia części', c:720000,  e:32, risk:0,  prof:66},
 {n:'Pełen program: 6 silników, dwie ramy, tuner na wyłączność', c:1150000, e:40, risk:0, prof:78}
];
const MECHS=[
 {n:'Szwagier Mirek (pomaga po godzinach)',            q:15, c:14000,   prof:0},
 {n:'Zbychu z warsztatu za torem',                     q:32, c:55000,   prof:0},
 {n:'Chłopak z parku maszyn, zna się na dwutaktach',   q:45, c:110000,  prof:12},
 {n:'Solidny mechanik z Leszna',                       q:60, c:190000,  prof:25},
 {n:'Duński specjalista od GM',                        q:74, c:340000,  prof:40},
 {n:'Dwóch ludzi na etacie + bus serwisowy',           q:84, c:520000,  prof:55},
 {n:'Team manager z Anglii + dwóch ludzi',             q:91, c:780000,  prof:68},
 {n:'Sztab jak u mistrza świata (tuner, mechanik, fizjo)', q:97, c:1250000, prof:82}
];
 
/* ============================================================
   3. ZDARZENIA LOSOWE (środek sezonu)
   ============================================================ */
const EVENTS=[
{id:'kasa', t:'UPOMINASZ SIĘ O PIENIĄDZE',
 x:'Trzeci miesiąc bez przelewu. Wchodzisz do biura prezesa. Na biurku leży faktura za balony z logo klubu i wydruk z Twojego konta z kwotą 0,00 zł. Prezes uśmiecha się i pyta: „ale czy ty na pewno tego chcesz?”',
 o:[
  {l:'Naprawdę chcę tych pieniędzy.', f:()=>{G.p.next.zeroMatches=true;return['Prezes kiwa głową ze zrozumieniem.','W KOLEJNYM SEZONIE ZALICZYSZ 0 MECZÓW.'];}},
  {l:'Powietrze i fotosynteza też są spoko, pieniądze dają tylko luksus.', f:()=>{const d=R(20,40);G.S.noEarnings=true;G.S.heatPP+=10;G.p.equip=cl(G.p.equip-d,1,99);return['Prezes płacze ze wzruszenia i daje ci więcej biegów.','W tym sezonie nie zarabiasz ani grosza.','+10 p.p. do liczby biegów.','Sprzęt spada o '+d+' pkt.'];}}
 ]},
{id:'rempala', t:'DUCH KRYSTIANA REMPAŁY',
 x:'O 3:14 w nocy w parkingu przy stodole materializuje się postać w kevlarze z lat 90. Trzyma zeszyt w kratkę z napisem „RECEPTA NA SUKCES”. Chce ci go sprzedać za twoje zdrowie.',
 o:[
  {l:'Słuchasz go.', f:()=>{G.p.ovr=cl(G.p.ovr+5,1,99);G.S.injuryPP+=50;return['+5 OVR — nagle rozumiesz pierwszy łuk.','+50 p.p. szansy na uraz. Duch nie mówił o hamowaniu.'];}},
  {l:'Nie słuchasz go.', f:()=>{const k=R(1000,15000);G.p.budget+=k;return['Odganiasz ducha kaskiem.','Producent kasków widzi w tym reklamę: +'+zl(k)];}}
 ]},
{id:'swistek', t:'ŚWISTEK W GORZOWIE',
 x:'W parku maszyn podchodzi do ciebie człowiek w kurtce klubowej ze świstkiem A5. „Podpisz tu, to formalność, kwestie regulaminowe”. Nie ma nagłówka. Nie ma pieczątki. Ma za to rubrykę „oświadczam, że”.',
 o:[
  {l:'Podpisuję.', f:()=>{G.p.budget-=10000;G.S.fines+=10000;G.p.med=cl(G.p.med+5,0,99);G.S.teamPts-=1;return['PZM nakłada karę 10 000 zł.','+5 Medialność (świstek wyciekł do mediów).','Twoja drużyna traci 1 punkt w tabeli.'];}},
  {l:'Nie podpisuję.', f:()=>{G.S.injuryPP+=80;return['Człowiek w kurtce mówi „no to zobaczymy”.','+80 p.p. ryzyka urazu na jedną kolejkę.'];}}
 ]},
{id:'baraz', t:'BARAŻ O UTRZYMANIE — POWAŻNE MYŚLI SPADKOWE',
 x:'Szatnia milczy. Lider patrzy w podłogę, junior płacze w rękawicę, a menedżer nagrywa story na Instagram. Ktoś musi coś zrobić.',
 o:[
  {l:'Skrzykujesz drużynę, żeby pójść pobiegać i pokrzyczeć niemiłe wyrażenia o drużynie z Zielonej Góry.', f:()=>{G.S.teamOvr+=3;G.p.next.heatPP+=10;G.p.med=cl(G.p.med+10,0,99);return['Overall drużyny +3 — integracja przez nienawiść działa.','+10 p.p. szans na biegi w kolejnym sezonie.','+10 Medialność.'];}},
  {l:'To, gdzie jeżdżę, jest bez znaczenia, po prostu dostaję pieniądze za swoją pracę.', f:()=>{G.S.heatPP+=10;G.p.prof=cl(G.p.prof+10,0,99);G.p.next.betterOffers=true;return['+10 p.p. szans na biegi w najbliższym spotkaniu.','+10 Profesjonalizm.','W kolejnym sezonie dostaniesz lepsze oferty.'];}}
 ]},
{id:'pozarlik', t:'WYWIAD Z JULIĄ POŻARLIK',
 x:'Rywal wywiózł cię na płot na wyjściu z drugiego łuku. Adrenalina na maksa, kevlar rozdarty, a przed tobą stoi mikrofon i kamera na żywo.',
 o:[
  {l:'Patrzysz się w jej stopy i zaczynasz pleść głupoty, których nikt nie rozumie.', f:()=>{G.p.med=cl(G.p.med-10,0,99);G.p.prof=cl(G.p.prof-5,0,99);G.p.ovr=cl(G.p.ovr+2,1,99);return['-10 Medialność. Klip ma 2 mln wyświetleń, ale nie tych dobrych.','-5 Profesjonalizm.','+2 OVR — złość dobrze robi na gaz.'];}},
  {l:'Odmawiasz wywiadu.', f:()=>{return['Nic się nie dzieje. Absolutnie nic.'];}}
 ]},
{id:'muka', t:'PATEUSZ MUKA PISZE O TOBIE PASZKWIL NA X-ie',
 x:'Wątek na 14 tweetów. Tytuł: „Dlaczego ten zawodnik jest symbolem upadku polskiego żużla — analiza”. Pod spodem 400 komentarzy i twoja mama pisząca „nieprawda”.',
 o:[
  {l:'Nie reagujesz.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);G.p.med=cl(G.p.med-10,0,99);return['+5 Profesjonalizm.','-10 Medialność — cisza nie sprzedaje.'];}},
  {l:'Odpisujesz: „Staram się nie wymiotować, jak patrzę na pana”.', f:()=>{const b=R(1,4);G.p.med=cl(G.p.med+20,0,99);G.p.prof=cl(G.p.prof-30,0,99);G.S.banMatches+=b;return['+20 Medialność. Cytat idzie na koszulki.','-30 Profesjonalizm.','Liga zawiesza cię na '+b+' spotkań.'];}}
 ]},
{id:'gaczorek', t:'GACZOREK AI DOSTAJE AKTUALIZACJĘ',
 x:'Nowa wersja pozwala zawodnikom podpytywać się o ustawienia sprzętu bezpośrednio z boksu. Regulamin nic o tym nie mówi, bo regulamin nigdy nic nie mówi.',
 o:[
  {l:'Korzystasz — ale kolega z drużyny dał info mediom.', f:()=>{const d=R(-5,5);G.p.ovr=cl(G.p.ovr+d,1,99);G.p.med=cl(G.p.med-10,0,99);G.p.prof=cl(G.p.prof-20,0,99);return[(d>=0?'+':'')+d+' OVR (algorytm to loteria).','-10 Medialność.','-20 Profesjonalizm.'];}},
  {l:'Nie jest Jiśkowiakiem, sam sobie poradzisz.', f:()=>{return['Nic się nie zmienia. Ustawiasz na czuja, jak dziadek.'];}}
 ]},
{id:'tuninggor', t:'WIZYTA U LOKALNEGO "TUNING-GÓRA" W STODOLE',
 x:'Stodoła, tokarka z 1974 roku, kalendarz z 2009 i człowiek, który mówi o cylindrze „ja to czuję palcem”. Proponuje eksperymentalny szlif.',
 o:[
  {l:'Zgadzasz się na eksperymentalny szlif cylindra.', f:()=>{
     if(chance(90)){const d=R(25,40);G.p.equip=cl(G.p.equip-d,1,99);G.S.extraDefP+=0.10;return['+20 do prędkości na jedno okrążenie. Jedno.','Na drugim kółku silnik eksplodował i zrobił dziurę w karterze.','Sprzęt -'+d+', drastycznie rośnie szansa na defekt.'];}
     G.p.equip=cl(G.p.equip+12,1,99);return['CUD. Silnik wytrzymał.','Sprzęt +12. Tuning-Gór płacze ze szczęścia.'];}},
  {l:'Dziękuję, postoję.', f:()=>{return['Wychodzisz ze stodoły z całym karterem.'];}}
 ]},
{id:'guru', t:'GURU OD STATYSTYK',
 x:'Guru wyliczył w arkuszu, że jesteś najchujowszym zawodnikiem ze startu w całej lidze. Wykres jest kolorowy i, niestety, prawdziwy.',
 o:[
  {l:'Trenujesz starty.', f:()=>{const d=R(-5,5);G.p.ovr=cl(G.p.ovr+d,1,99);return['Sto wyjazdów z taśmy dziennie.',(d>=0?'+':'')+d+' OVR.'];}},
  {l:'Piszesz, że statystyki nie mają nic do żużla, a guru to farmazon.', f:()=>{const d=R(-10,10);G.p.med=cl(G.p.med+d,0,99);G.p.next.rowPen=true;return['Ostafiński codziennie nawala o tobie artykuły, że nie szanujesz mediów.',(d>=0?'+':'')+d+' Medialność.','-25% szans na ofertę od ROW-u Rybnik.'];}}
 ]},
{id:'skrzydlo', t:'WITOLD SKRZYDŁO DOWALA CI KARĘ 100 000 zł', cond:()=>getClub(G.p).debt>=60000,
 x:'Powód: brak czapki klubowej na wywiadzie. W tym samym czasie klub zalega ci 100 000 zł. Nikt w tym budynku nie widzi w tym sprzeczności.',
 o:[
  {l:'Płacę z pokorą.', f:()=>{const c=getClub(G.p);c.debt=0;G.p.med=cl(G.p.med-20,0,99);G.p.prof=cl(G.p.prof+10,0,99);return['-20 Medialność.','+10 Profesjonalizm.','Dług klubu wobec ciebie zostaje wyzerowany (kompensata).'];}},
  {l:'Pierdolę, idę do Ostafińskiego.', f:()=>{const c=getClub(G.p);G.p.med=cl(G.p.med+20,0,99);G.p.prof=cl(G.p.prof-10,0,99);G.S.forcedEnd=true;G.S.noRenew=true;
     let l=['+20 Medialność — materiał ma 900 tys. odsłon.','-10 Profesjonalizm.','Do końca roku nie jedziesz ani jednego spotkania ligowego.','Klub nie przedłuży z tobą kontraktu.'];
     if(chance(40)){c.debt=0;l.push('Trybunał PZM anulował dług klubu (40% zadziałało).');}else l.push('Trybunał PZM rozłożył ręce. Dług zostaje.');
     return l;}}
 ]},
{id:'slaczka', t:'BUS PADA W DRODZE Z DEBRECZYNA',
 x:'Skrzynia biegów w Debreczynie, mecz o 3. miejsce za 14 godzin. Janusz Ślączka podjeżdża lawetą i mówi „wskakuj na pakę, ale motocykli nie zabieramy”.',
 o:[
  {l:'Dawaj na pakę.', f:()=>{G.p.prof=cl(G.p.prof+10,0,99);G.S.equipFit=R(0,60);G.p.med=cl(G.p.med+5,0,99);G.S.injuryPP+=10;return['+10 Profesjonalizm — jesteś na miejscu, to się liczy.','Dopasowanie sprzętu w kolejnym meczu: '+G.S.equipFit+'% (pożyczony motocykl).','+5 Medialność.','+10 p.p. ryzyka urazu.'];}},
  {l:'Pierdolę, nie jadę.', f:()=>{const d=R(-10,10);G.p.budget-=50000;G.S.fines+=50000;G.p.med=cl(G.p.med+d,0,99);G.S.noRenew=true;return['Kara finansowa 50 000 zł.','Klub nie przedłuży z tobą umowy w następnym sezonie.',(d>=0?'+':'')+d+' Medialność.'];}}
 ]},
{id:'lis', t:'SĘDZIA LIS WYKLUCZA CIĘ NIESŁUSZNIE',
 x:'Dokładnie tak, jak wykluczył Rempałę w pierwszym biegu. Czerwona lampa, ty stoisz z rozłożonymi rękami, a stadion buczy.',
 o:[
  {l:'„KURWA MAĆ NIE BĄDŹ PAN ZAWODNIKIEM DO CHUJA, BO WJADĘ NA TEN TEN I SIĘ SKOŃCZY TROSZECZKĘ INACZEJ”', f:()=>{const b=R(1,3);G.p.med=cl(G.p.med+15,0,99);G.p.prof=cl(G.p.prof-20,0,99);G.S.banMatches+=b;return['+15 Medialność. Nagranie leci w każdym serwisie.','-20 Profesjonalizm.','Czerwona kartka w spotkaniu.','Zawieszenie na '+b+' kolejek.'];}},
  {l:'Jadę grzecznie dalej.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);G.p.med=cl(G.p.med-10,0,99);G.S.injuryPP+=20;return['+5 Profesjonalizm.','-10 Medialność.','+20 p.p. szans na uraz do końca meczu (jedziesz na wściekłości).'];}}
 ]},
{id:'spoznienie', t:'SPÓŹNIASZ SIĘ 6 MINUT NA MECZ PÓŁFINAŁOWY',
 x:'Sędzia Lis źle kliknął cyferki w kalkulatorze i przez ciebie jest walkower. Łysa pała z telewizji już biegnie z mikrofonem.',
 o:[
  {l:'Płaczę, że mi smutno, ale mówię, że to nie moja wina.', f:()=>{G.S.walkower=true;G.p.med=cl(G.p.med+10,0,99);G.p.prof=cl(G.p.prof-15,0,99);return['+10 Medialność — łzy sprzedają się najlepiej.','-15 Profesjonalizm.'];}},
  {l:'Odmawiam wywiadu przez „problemy żołądkowe”.', f:()=>{G.S.walkower=true;G.p.med=cl(G.p.med-10,0,99);G.p.budget-=10000;G.S.fines+=10000;return['-10 Medialność.','10 000 zł kary od telewizji.','Mecz i tak będzie powtórzony przez błąd sędziego.'];}}
 ]},
{id:'prezeska', t:'PREZESKA: „TOR JEST NIEBEZPIECZNY”',
 x:'Lider wrócił dopiero z kontuzji, tor przypomina tarkę do sera, a prezes każe wracać do domu. Zespół patrzy na ciebie. Od twojego głosu zależy wszystko.',
 o:[
  {l:'To wielka szansa — jedziemy.', f:()=>{G.p.med=cl(G.p.med+10,0,99);G.p.prof=cl(G.p.prof+15,0,99);G.S.injuryPP+=60;G.S.noRenew=true;return['+10 Medialność, +15 Profesjonalizm.','+60 p.p. szansy na uraz w tym meczu.','Klub nie przedłuży z tobą umowy — prezes zapamiętał.'];}},
  {l:'Wracamy do Rzeszowa.', f:()=>{G.p.prof=cl(G.p.prof-10,0,99);G.p.med=cl(G.p.med-20,0,99);G.p.budget-=60000;G.S.fines+=60000;G.S.walkower=true;return['-10 Profesjonalizm, -20 Medialność.','PZM nakłada na każdego zawodnika karę 50 000 zł.','10 000 zł na lakierowanie busa po obrzuceniu kamieniami.','Mecz kończy się wynikiem 0:75.'];}}
 ]},
{id:'argentyna', t:'ARGENTYŃCZYK CHCE KUPIĆ TWÓJ MOTOCYKL',
 x:'Pisze po hiszpańsku przez tłumacza, że to start jego pięknej kariery w Europie. Ma odłożone oszczędności całej rodziny.',
 o:[
  {l:'Jestem uczciwy.', f:()=>{G.p.budget+=20000;G.p.med=cl(G.p.med+5,0,99);G.p.prof=cl(G.p.prof+10,0,99);return['+20 000 zł.','+5 Medialność, +10 Profesjonalizm.'];}},
  {l:'Nazywam się Dawid Stachyra i sprzedaję mu złom oklejony naklejkami Nickiego Pedersena.', f:()=>{G.p.budget+=75000;G.p.med=cl(G.p.med-10,0,99);G.p.prof=cl(G.p.prof-10,0,99);G.p.next.noArg=true;return['+75 000 zł.','-10 Medialność, -10 Profesjonalizm.','Do końca kariery nie otrzymasz zaproszenia na IM Argentyny.'];}}
 ]},
{id:'zona', t:'KOLEGA Z ZESPOŁU I TWOJA ŻONA',
 x:'Dowiadujesz się z grupy na WhatsAppie. Ten sam kolega wywozi cię w trzecim biegu na trzecim łuku, przez co tracisz pozycję.',
 o:[
  {l:'Walę go w mordę.', f:()=>{const b=R(1,3),k=R(1000,10000);G.p.med=cl(G.p.med+10,0,99);G.p.prof=cl(G.p.prof-15,0,99);G.S.banMatches+=b;G.p.budget-=k;G.S.fines+=k;return['+10 Medialność.','-15 Profesjonalizm.','Zawieszenie PZM: '+b+' mecze.','Kara finansowa: '+zl(k)];}},
  {l:'Robię cosplay Krzyśka Gonciarza.', f:()=>{const d=R(-10,5);G.p.med=cl(G.p.med-10,0,99);G.p.prof=cl(G.p.prof+d,0,99);return['-10 Medialność.',(d>=0?'+':'')+d+' Profesjonalizm.'];}},
  {l:'Zostawiam robotę mechanikom.', f:()=>{G.p.med=cl(G.p.med+5,0,99);G.p.prof=cl(G.p.prof-5,0,99);G.S.equipFit=0;return['+5 Medialność, -5 Profesjonalizm.','Do końca meczu dopasowanie sprzętu spada do 0%.'];}}
 ]},
{id:'doping', t:'KONTROLA ANTYDOPINGOWA W BIRMINGHAM',
 x:'Szwagier miał urodziny i przez cały weekend imprezowałeś. Pijany jedziesz na mecz ligowy do Birmingham. Wyrywkowa kontrola przed meczem każe ci oddać mocz do badania.',
 o:[
  {l:'Oddaję mocz.', f:()=>{G.p.banSeasons=2;G.S.forcedEnd=true;return['Wynik przyszedł po trzech tygodniach.','ZAWIESZENIE NA DWA LATA.'];}},
  {l:'Nie oddaję moczu.', f:()=>{G.p.banSeasons=1;G.S.forcedEnd=true;return['Odmowa to przyznanie się.','ZAWIESZENIE NA ROK.'];}},
  {l:'Każę sędziemu się gonić i odjeżdżam na lotnisko.', f:()=>{G.p.banSeasons=2;G.S.forcedEnd=true;G.p.budget-=100000;G.S.fines+=100000;return['ZAWIESZENIE NA DWA LATA.','Grzywna 20 000 funtów (ok. 100 000 zł).'];}}
 ]},
 
/* ===== ZDARZENIA DODATKOWE ===== */
{id:'reklamowka', t:'WYPŁATA W REKLAMÓWCE Z BIEDRONKI',
 x:'Prezes zamyka drzwi gabinetu, wyciąga z szafy pancernej reklamówkę i mówi: „jest wszystko, tylko bez papierów, bo księgowa ma teraz trudny okres”. W środku faktycznie coś szeleści.',
 o:[
  {l:'Biorę reklamówkę i nie zadaję pytań.', f:()=>{const k=R(15000,60000);const c=getClub(G.p);G.p.budget+=k;c.debt=Math.max(0,c.debt-k);G.p.prof=cl(G.p.prof-10,0,99);return['+'+zl(k)+' w banknotach po 50.','-10 Profesjonalizm.','Klub odhaczył sobie część długu wobec ciebie.'];}},
  {l:'Chcę przelew i PIT-11 jak człowiek.', f:()=>{const c=getClub(G.p);const d=R(30000,90000);c.debt+=d;G.p.prof=cl(G.p.prof+5,0,99);G.S.heatPP-=10;return['+5 Profesjonalizm.','Prezes obraził się śmiertelnie: -10 p.p. szans na biegi.','Zaległości klubu rosną o '+zl(d)+'.'];}}
 ]},
{id:'race', t:'RACE NA TRYBUNIE, MECZ PRZERWANY NA 40 MINUT',
 x:'Sektor młodzieżowy odpalił wszystko, co miał. Dym zasłonił drugi łuk, sędzia przerwał zawody, a spiker prosi o spokój głosem człowieka, który wie, że nikt go nie słucha.',
 o:[
  {l:'Idziesz pod trybunę i klaszczesz kibicom.', f:()=>{G.p.med=cl(G.p.med+15,0,99);G.p.prof=cl(G.p.prof-5,0,99);G.p.budget-=5000;G.S.fines+=5000;return['+15 Medialność — zdjęcie idzie na okładkę.','-5 Profesjonalizm.','5 000 zł kary regulaminowej.'];}},
  {l:'Siedzisz w parku maszyn i grzejesz silnik.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);G.p.med=cl(G.p.med-5,0,99);return['+5 Profesjonalizm.','-5 Medialność — kamery poszły do tych pod trybuną.'];}}
 ]},
{id:'mechsen', t:'MECHANIK ZASNĄŁ W BUSIE Z PAPIEROSEM',
 x:'Obudził go dopiero swąd tapicerki. Bus ocalał, plandeka nie. Mechanik twierdzi, że „to był wypadek przy pracy” i że zna GM-y jak własną kieszeń.',
 o:[
  {l:'Zwalniam go na miejscu.', f:()=>{const q=R(10,25);G.p.mech=q;G.p.mechName='Przypadkowy człowiek z parku maszyn';G.p.budget-=20000;G.p.prof=cl(G.p.prof+5,0,99);return['Odprawa: 20 000 zł.','Nowy mechanik ma jakość '+q+'. Ktoś musi kręcić kluczem.','+5 Profesjonalizm.'];}},
  {l:'Zostawiam, bo zna się na GM-ach.', f:()=>{G.S.extraDefP+=0.06;G.p.med=cl(G.p.med+5,0,99);return['+6 p.p. szansy na defekt w każdym biegu.','+5 Medialność — historia o busie obiegła całą ligę.'];}}
 ]},
{id:'taniec', t:'ZAPROSZENIE DO "TAŃCA Z GWIAZDAMI"',
 x:'Produkcja dzwoni w środku okresu startowego. Mówią, że żużel „jest teraz modny” i że potrzebują kogoś z charakterem. Honorarium jest większe niż twój kontrakt.',
 o:[
  {l:'Idę tańczyć.', f:()=>{G.p.med=cl(G.p.med+30,0,99);G.p.prof=cl(G.p.prof-15,0,99);G.S.heatPP-=8;G.p.budget+=150000;return['+30 Medialność. Jesteś w każdym śniadaniówce.','-15 Profesjonalizm, -8 p.p. do liczby biegów (treningi odpadły).','+150 000 zł honorarium.'];}},
  {l:'Odmawiam, mam sezon.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);G.p.med=cl(G.p.med-5,0,99);return['+5 Profesjonalizm.','-5 Medialność.'];}}
 ]},
{id:'lombard', t:'LOMBARD "SZYBKA GOTÓWKA" CHCE BYĆ NA TWOIM KEVLARZE',
 x:'Logo miałoby zajmować cały tył, pod numerem. Właściciel mówi, że to „inwestycja w lokalny sport”, a jego trzej pracownicy stoją przy wejściu i nic nie mówią.',
 o:[
  {l:'Biorę, kevlar i tak jest brzydki.', f:()=>{const k=R(40000,120000);G.p.budget+=k;G.p.med=cl(G.p.med-15,0,99);return['+'+zl(k)+' od sponsora.','-15 Medialność — memy z twoim tyłkiem i napisem "SZYBKA GOTÓWKA".'];}},
  {l:'Dziękuję, poczekam na normalnego sponsora.', f:()=>{G.p.med=cl(G.p.med+10,0,99);return['+10 Medialność. Zero złotych, ale godność w cenie.'];}}
 ]},
{id:'gpchallenge', t:'DZIKA KARTA NA GRAND PRIX CHALLENGE',
 x:'Ktoś się wykruszył, ktoś zadzwonił, i nagle masz miejsce w turnieju, o którym marzy pół ligi. Termin koliduje z trzema meczami ligowymi.',
 o:[
  {l:'Jadę. Raz się żyje.', f:()=>{G.p.ovr=cl(G.p.ovr+3,1,99);G.p.med=cl(G.p.med+15,0,99);G.S.injuryPP+=10;G.p.budget-=30000;return['+3 OVR — poziom robi swoje.','+15 Medialność.','+10 p.p. ryzyka urazu.','Koszty wyjazdu: 30 000 zł.'];}},
  {l:'Liga jest ważniejsza. Zostaję.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);G.S.heatPP+=5;return['+5 Profesjonalizm — trener zapamiętał.','+5 p.p. szans na biegi.'];}}
 ]},
{id:'dietetyk', t:'DIETETYK Z INSTAGRAMA: "ZBIJEMY CI 4 KG, POJEDZIESZ JAK RAKIETA"',
 x:'Ma 200 tysięcy obserwujących, certyfikat z webinaru i plan żywieniowy w PDF-ie. Twoja mama mówi, że wyglądasz jak z obozu.',
 o:[
  {l:'Robię cut przed rundą rewanżową.', f:()=>{G.p.ovr=cl(G.p.ovr+2,1,99);G.p.prof=cl(G.p.prof-10,0,99);G.S.injuryPP+=25;return['+2 OVR — mniej kilo na maszynie.','-10 Profesjonalizm (osłabienie).','+25 p.p. ryzyka urazu.'];}},
  {l:'Jem schabowego u mamy jak co niedzielę.', f:()=>{G.p.ovr=cl(G.p.ovr-1,1,99);G.p.prof=cl(G.p.prof+5,0,99);return['-1 OVR.','+5 Profesjonalizm — spokój ducha to też forma.'];}}
 ]},
{id:'australijczyk', t:'KLUB ŚCIĄGA AUSTRALIJCZYKA NA TWOJE MIEJSCE',
 x:'Ma 24 lata, średnią 2.1 w swojej lidze i uśmiech z reklamy pasty do zębów. Menedżer klubu mówi ci o tym w SMS-ie o 23:40.',
 o:[
  {l:'Idę do prezesa i stawiam sprawę na ostrzu noża.', f:()=>{ if(chance(50)){G.S.heatPP+=15;return['Prezes się ugiął.','+15 p.p. szans na biegi — jedziesz przed Australijczykiem.'];} G.S.noRenew=true;return['Prezes wysłuchał, pokiwał głową i nie zmienił nic.','Klub nie przedłuży z tobą kontraktu.'];}},
  {l:'Trenuję w ciszy i udowadniam na torze.', f:()=>{G.p.ovr=cl(G.p.ovr+3,1,99);G.S.heatPP-=10;return['+3 OVR — sto wyjazdów dziennie.','-10 p.p. szans na biegi w tym sezonie (Australijczyk jedzie).'];}}
 ]},
{id:'podcast', t:'PODCAST "ŻUŻEL BEZ CENZURY" — TRZY GODZINY NA ŻYWO',
 x:'Prowadzący nalewa ci piwo już w piętnastej minucie i pyta, „co naprawdę myślisz o prezesach w tej lidze”. Kamera się nagrywa. Czerwona lampka mruga.',
 o:[
  {l:'Mówię wszystko. Nazwiska, kwoty, daty.', f:()=>{G.p.med=cl(G.p.med+25,0,99);G.p.prof=cl(G.p.prof-15,0,99);G.p.budget-=30000;G.S.fines+=30000;return['+25 Medialność. Odcinek ma 1,2 mln odsłon.','-15 Profesjonalizm.','30 000 zł kary od PZM za "naruszenie dobrego imienia".'];}},
  {l:'Mówię o "świetnej atmosferze w zespole".', f:()=>{G.p.med=cl(G.p.med+5,0,99);G.p.prof=cl(G.p.prof+5,0,99);return['+5 Medialność, +5 Profesjonalizm.','Nudno, ale bezpiecznie.'];}}
 ]},
{id:'kradziez', t:'SKRADZIONO CI SILNIKI SPOD HOTELU',
 x:'Bus stoi otwarty, plandeka pocięta, w środku pusto. Recepcjonistka mówi, że „monitoring działa tylko od frontu”. Do najbliższego meczu zostały cztery dni.',
 o:[
  {l:'Zgłaszam policji i czekam na swoje.', f:()=>{const d=R(15,30);G.p.equip=cl(G.p.equip-d,1,99);G.p.prof=cl(G.p.prof+5,0,99);return['Sprzęt -'+d+' — jedziesz na zapasowym złomie.','+5 Profesjonalizm.'];}},
  {l:'Kupuję na szybko używane od Tuning-Góra.', f:()=>{const k=R(30000,80000);const d=R(5,15);G.p.budget-=k;G.p.equip=cl(G.p.equip-d,1,99);G.S.extraDefP+=0.04;return['-'+zl(k)+' za "sprawdzone, garażowane" silniki.','Sprzęt -'+d+'.','+4 p.p. szansy na defekt.'];}}
 ]},
{id:'speedcoin', t:'KOLEGA Z PARKU MASZYN WCHODZI W "SPEEDCOINA"',
 x:'Pokazuje ci wykres na telefonie z pękniętym ekranem. Mówi, że to „krypto dla żużlowców” i że jego kuzyn zrobił na tym mieszkanie w Rybniku.',
 o:[
  {l:'Wchodzę za połowę budżetu.', f:()=>{const inv=Math.round(G.p.budget*0.5); if(inv<1000) return['Nie masz za co wejść. Kolega patrzy na ciebie z politowaniem.'];
     G.p.budget-=inv; if(chance(25)){G.p.budget+=inv*4;return['SPEEDCOIN X4. Zainwestowałeś '+zl(inv)+', wyjąłeś '+zl(inv*4)+'.','Kolega chce teraz procent.'];}
     return['Projekt zniknął w trzy tygodnie razem ze stroną.','Straciłeś '+zl(inv)+'.'];}},
  {l:'Nie wchodzę. Wolę silnik.', f:()=>{G.p.prof=cl(G.p.prof+2,0,99);return['+2 Profesjonalizm.','Kolega przestał się odzywać. Po trzech tygodniach zaczął znowu.'];}}
 ]},
{id:'zima', t:'PRZYGOTOWANIA ZIMOWE: HISZPANIA CZY SIŁOWNIA W ZABRZU',
 x:'Grupa zawodników leci na trzy tygodnie do Almerii. Bilet, hotel i tor kosztują 80 000 zł. Alternatywa to siłownia na osiedlu, gdzie pan Mietek każe ci robić przysiady na czas.',
 o:[
  {l:'Lecę do Hiszpanii.', f:()=>{ if(G.p.budget<80000) return['Sprawdziłeś konto i odłożyłeś telefon. Nie stać cię.'];
     G.p.budget-=80000;G.p.ovr=cl(G.p.ovr+4,1,99);G.p.prof=cl(G.p.prof+5,0,99);return['-80 000 zł.','+4 OVR — trzy tygodnie na suchym torze robią różnicę.','+5 Profesjonalizm.'];}},
  {l:'Siłownia u pana Mietka.', f:()=>{G.p.ovr=cl(G.p.ovr+1,1,99);G.p.med=cl(G.p.med-5,0,99);return['+1 OVR.','-5 Medialność — inni wrzucali story z plaży, ty ze schodów.'];}}
 ]},
{id:'ojciec', t:'OJCIEC-MENEDŻER CHCE NEGOCJOWAĆ ZA CIEBIE',
 x:'Ma teczkę, koszulę i przekonanie, że wszyscy w tej lidze to złodzieje. W sumie ma rację, ale prezesi już się o nim między sobą pisali.',
 o:[
  {l:'Niech negocjuje, zna się.', f:()=>{G.S.rateMul=1.3;G.p.med=cl(G.p.med-10,0,99);G.S.heatPP-=10;return['Stawka za punkt w tym sezonie +30%.','-10 Medialność.','-10 p.p. szans na biegi — trener nie znosi "tatusiów".'];}},
  {l:'Sam sobie załatwiam.', f:()=>{G.p.prof=cl(G.p.prof+5,0,99);return['+5 Profesjonalizm.','Ojciec nie odzywa się do ciebie przez miesiąc.'];}}
 ]},
{id:'obojczyk', t:'LEKARZ: "PĘKNIĘTY OBOJCZYK, SZEŚĆ TYGODNI PRZERWY" — A ZA TYDZIEŃ BARAŻ',
 x:'Zdjęcie RTG wisi pod lampą i nie pozostawia złudzeń. Trener stoi obok lekarza i patrzy na ciebie tym jednym spojrzeniem, które wszyscy w tym sporcie znają.',
 o:[
  {l:'Jadę na zastrzykach.', f:()=>{G.p.med=cl(G.p.med+10,0,99);G.p.prof=cl(G.p.prof+10,0,99);G.p.ovr=cl(G.p.ovr-3,1,99);G.S.injuryPP+=40;return['+10 Medialność, +10 Profesjonalizm — szatnia to zapamięta.','-3 OVR (jedziesz jedną ręką).','+40 p.p. ryzyka poważnego urazu.'];}},
  {l:'Leczę się jak dorosły człowiek.', f:()=>{G.S.banMatches+=4;G.p.med=cl(G.p.med-5,0,99);G.p.ovr=cl(G.p.ovr+2,1,99);return['Pauzujesz 4 spotkania.','-5 Medialność.','+2 OVR — ciało wreszcie odpoczęło.'];}}
 ]},
{id:'tiktok', t:'PREZES ZAKAZUJE ZAWODNIKOM TIKTOKA',
 x:'Regulamin wewnętrzny, punkt 14b: „zakaz publikowania treści z parku maszyn”. Powodem jest filmik, na którym twój kolega pokazuje, ile klub zalega mu za zeszły rok.',
 o:[
  {l:'Wrzucam i tak. Nawet z parku maszyn.', f:()=>{G.p.med=cl(G.p.med+20,0,99);G.p.prof=cl(G.p.prof-5,0,99);G.p.budget-=15000;G.S.fines+=15000;G.p.loyalty=cl(G.p.loyalty-15,0,100);return['+20 Medialność. 400 tysięcy wyświetleń w dobę.','-5 Profesjonalizm, kara klubowa 15 000 zł.','-15 Lojalność.'];}},
  {l:'Kasuję konto i kończę temat.', f:()=>{G.p.med=cl(G.p.med-15,0,99);G.p.prof=cl(G.p.prof+10,0,99);G.p.loyalty=cl(G.p.loyalty+10,0,100);return['-15 Medialność.','+10 Profesjonalizm, +10 Lojalność.'];}}
 ]},
 
/* ===== ZDARZENIA WARUNKOWE — wynikają z twojej aktualnej sytuacji ===== */
{id:'komornik_klub', t:'KOMORNIK W BIURZE KLUBU', cond:()=>getClub(G.p).debt>=40000,
 x:()=>'Klub zalega ci '+zl(getClub(G.p).debt)+'. Wchodzisz po podpis na delegację i widzisz dwóch panów spisujących sprzęt biurowy. Prezes tłumaczy im, że ekspres do kawy jest leasingowany.',
 o:[
  {l:'Dopisuję się do listy wierzycieli.', f:()=>{const c=getClub(G.p);const odzysk=Math.round(c.debt*RF(0.3,0.6));c.debt-=odzysk;G.p.budget+=odzysk;G.p.med=cl(G.p.med-5,0,99);G.p.loyalty=cl(G.p.loyalty-15,0,100);return['Odzyskujesz '+zl(odzysk)+' z masy.','-5 Medialność, -15 Lojalność. Szatnia patrzy krzywo.'];}},
  {l:'Czekam, bo prezes obiecał, że "za dwa tygodnie wszystko wraca".', f:()=>{const c=getClub(G.p);G.p.loyalty=cl(G.p.loyalty+10,0,100);
     if(chance(35)){const s=Math.round(c.debt*0.8);c.debt-=s;G.p.budget+=s;return['Sponsor dosypał w ostatniej chwili: '+zl(s)+'.','+10 Lojalność.'];}
     c.debt+=R(10000,40000);return['Dwa tygodnie minęły. Nic nie wróciło. Dług urósł.','+10 Lojalność (za darmo).'];}}
 ]},
{id:'zlom', t:'TWÓJ SILNIK TO JUŻ EKSPONAT', cond:()=>G.p.equip<=18,
 x:()=>'Sprzęt na poziomie '+G.p.equip+'/99. Mechanik rywala zagląda pod plandekę, robi zdjęcie i wysyła je na grupę na WhatsAppie. Podpis: "on tym jeździ w '+G.year+' roku".',
 o:[
  {l:'Biorę pożyczkę i kupuję silnik od razu.', f:()=>{G.p.budget-=60000;G.p.equip=cl(G.p.equip+16,1,99);G.p.prof=cl(G.p.prof+5,0,99);return['-60 000 zł (część na kredyt).','+16 Sprzęt.','+5 Profesjonalizm.'];}},
  {l:'Jeżdżę dalej. Jakoś to będzie.', f:()=>{G.S.extraDefP+=0.05;G.p.med=cl(G.p.med+5,0,99);return['+5 p.p. szansy na defekt w każdym biegu.','+5 Medialność — internet pokochał ten silnik.'];}}
 ]},
{id:'bogacz', t:'SALON SAMOCHODOWY W GORZOWIE', cond:()=>G.p.budget>=900000,
 x:()=>'Masz na koncie '+zl(G.p.budget)+'. Kolega z zespołu przyjechał na trening nowym niemieckim SUV-em i pyta, na co ty właściwie czekasz.',
 o:[
  {l:'Kupuję auto. Zasłużyłem.', f:()=>{const k=Math.round(G.p.budget*0.35);G.p.budget-=k;G.p.med=cl(G.p.med+15,0,99);G.p.prof=cl(G.p.prof-10,0,99);return['-'+zl(k)+'.','+15 Medialność (story z salonu).','-10 Profesjonalizm.'];}},
  {l:'Pakuję wszystko w silniki i tunera.', f:()=>{const k=Math.round(Math.min(G.p.budget*0.3,300000));G.p.budget-=k;G.p.equip=cl(G.p.equip+Math.round(k/12000),1,99);G.p.prof=cl(G.p.prof+8,0,99);return['-'+zl(k)+' w bazę sprzętową.','Sprzęt +'+Math.round(k/12000)+'.','+8 Profesjonalizm.'];}}
 ]},
{id:'dlugi_moje', t:'WINDYKACJA DZWONI DO CIEBIE', cond:()=>G.p.budget<0,
 x:()=>'Twoje konto: '+zl(G.p.budget)+'. Pani z firmy windykacyjnej jest bardzo miła i bardzo dobrze poinformowana o terminarzu twoich meczów.',
 o:[
  {l:'Sprzedaję zapasowy motocykl.', f:()=>{G.p.budget+=45000;G.p.equip=cl(G.p.equip-12,1,99);return['+45 000 zł.','Sprzęt -12 — zostajesz z jednym kompletem.'];}},
  {l:'Biorę zaliczkę u prezesa na przyszły sezon.', f:()=>{const c=getClub(G.p);G.p.budget+=60000;c.debt=Math.max(0,c.debt-60000);G.p.loyalty=cl(G.p.loyalty+15,0,100);G.S.rateMul*=0.75;return['+60 000 zł zaliczki.','+15 Lojalność.','Stawka za punkt w tym sezonie -25% (zaliczka się odbija).'];}}
 ]},
{id:'gwiazda', t:'AGENT MARKETINGOWY Z WARSZAWY', cond:()=>G.p.med>=70,
 x:()=>'Medialność '+G.p.med+'/99. Facet w marynarce na gołe ciało mówi, że "zbudował markę trzem sportowcom" i chce 30% od wszystkiego.',
 o:[
  {l:'Podpisuję. Niech zarabia, byle na mnie.', f:()=>{const k=R(80000,250000);G.p.budget+=k;G.p.med=cl(G.p.med+10,0,99);G.S.heatPP-=5;return['+'+zl(k)+' z kontraktów reklamowych.','+10 Medialność.','-5 p.p. szans na biegi (sesje zdjęciowe zamiast treningów).'];}},
  {l:'Nie oddam 30% komuś, kto nie umie odpalić motocykla.', f:()=>{G.p.prof=cl(G.p.prof+8,0,99);return['+8 Profesjonalizm.','Agent obraził się i napisał o tobie na LinkedInie.'];}}
 ]},
{id:'legenda_klubu', t:'KIBICE CHCĄ TWOJEJ FLAGI NA TRYBUNIE', cond:()=>G.p.loyalty>=55,
 x:()=>'Po '+Math.round(G.p.loyalty/18)+' sezonach w klubie sektor młodzieżowy zrobił zbiórkę na sektorówkę z twoją podobizną. Wyszedłeś na niej trochę jak Zmarzlina, ale intencja się liczy.',
 o:[
  {l:'Wychodzę pod trybunę i dziękuję.', f:()=>{G.p.med=cl(G.p.med+12,0,99);G.p.loyalty=cl(G.p.loyalty+10,0,100);G.S.heatPP+=6;return['+12 Medialność, +10 Lojalność.','+6 p.p. szans na biegi — trener nie zdejmie ulubieńca trybun.'];}},
  {l:'Wykorzystuję moment i idę do prezesa po podwyżkę.', f:()=>{G.S.rateMul*=1.25;G.p.loyalty=cl(G.p.loyalty-10,0,100);G.p.prof=cl(G.p.prof-5,0,99);return['Stawka za punkt w tym sezonie +25%.','-10 Lojalność, -5 Profesjonalizm.'];}}
 ]},
{id:'kompromitacja', t:'"NAJSŁABSZY ZAWODNIK LIGI" — RANKING PORTALU', cond:()=>G.p.prof<28,
 x:()=>'Profesjonalizm '+G.p.prof+'/99. Portal zrobił zestawienie zawodników, którzy najczęściej dotykają taśmy. Jesteś na podium, i to nie na trzecim stopniu.',
 o:[
  {l:'Zatrudniam trenera od startów.', f:()=>{G.p.budget-=40000;G.p.prof=cl(G.p.prof+18,0,99);return['-40 000 zł.','+18 Profesjonalizm. Sto wyjazdów z taśmy dziennie.'];}},
  {l:'Taśma to loteria, nie moja wina.', f:()=>{G.p.med=cl(G.p.med+8,0,99);G.p.prof=cl(G.p.prof-5,0,99);return['+8 Medialność (cytat poszedł w świat).','-5 Profesjonalizm.'];}}
 ]},
{id:'mechanik_odchodzi', t:'MECHANIK DOSTAJE OFERTĘ ZE SPARTY', cond:()=>G.p.mech>=60,
 x:()=>'Twój mechanik (jakość '+G.p.mech+') dostał telefon z klubu, który płaci trzy razy więcej. Stoi z telefonem w ręce i patrzy na ciebie.',
 o:[
  {l:'Przebijam ofertę.', f:()=>{const k=R(90000,220000);G.p.budget-=k;G.p.mech=cl(G.p.mech+4,1,99);G.p.loyalty=cl(G.p.loyalty+5,0,100);return['-'+zl(k)+'.','Mechanik zostaje, jakość +4.'];}},
  {l:'Niech jedzie, znajdę innego.', f:()=>{const q=R(20,40);G.p.mech=q;G.p.mechName='Zastępstwo z ogłoszenia';G.p.budget+=15000;return['Nowy mechanik: jakość '+q+'.','+15 000 zł (nie płacisz starej pensji).'];}}
 ]},
{id:'anglia', t:'TELEFON Z ANGLII — OFERTA Z BRITISH SPEEDWAY', cond:()=>G.p.ovr>=62 && G.p.age>=20,
 x:()=>'Klub z Premiership chce cię na czwartki. To dodatkowe pieniądze i dodatkowe 4000 kilometrów miesięcznie w busie.',
 o:[
  {l:'Biorę. Kasa to kasa.', f:()=>{const k=R(120000,300000);G.p.budget+=k;G.p.ovr=cl(G.p.ovr+2,1,99);G.S.injuryPP+=20;G.p.equip=cl(G.p.equip-8,1,99);return['+'+zl(k)+' za sezon w Anglii.','+2 OVR (więcej jazdy).','+20 p.p. ryzyka urazu, sprzęt -8 (eksploatacja).'];}},
  {l:'Odmawiam, skupiam się na lidze.', f:()=>{G.S.heatPP+=6;G.p.prof=cl(G.p.prof+6,0,99);return['+6 p.p. szans na biegi.','+6 Profesjonalizm — trener docenił.'];}}
 ]},
{id:'spadkowicz', t:'SZATNIA PRZED OSTATNIĄ KOLEJKĄ', cond:()=>getClub(G.p).ovr<=62,
 x:()=>'Klub ('+esc(getClub(G.p).name)+', OVR '+getClub(G.p).ovr+') ledwo zipie. Kapitan proponuje, żeby wszyscy zrzekli się premii, byle utrzymać drużynę przy życiu.',
 o:[
  {l:'Zrzekam się premii.', f:()=>{G.S.rateMul*=0.6;G.S.teamOvr+=2;G.p.loyalty=cl(G.p.loyalty+20,0,100);G.p.med=cl(G.p.med+8,0,99);return['Stawka za punkt -40% w tym sezonie.','Overall drużyny +2, +20 Lojalność, +8 Medialność.'];}},
  {l:'Mam kredyt, nie zrzekam się niczego.', f:()=>{G.p.loyalty=cl(G.p.loyalty-20,0,100);G.p.med=cl(G.p.med-10,0,99);G.S.teamOvr-=1;return['-20 Lojalność, -10 Medialność.','Overall drużyny -1. Szatnia się posypała.'];}}
 ]},
{id:'bogaty_klub', t:'PREZES POKAZUJE NOWĄ HALĘ', cond:()=>getClub(G.p).budget>=8000000,
 x:()=>'Klub ma budżet '+zl(getClub(G.p).budget)+' i właśnie otworzył centrum treningowe z siłownią, sauną i salą do analizy wideo. Prezes pyta, czy chcesz klucz.',
 o:[
  {l:'Wprowadzam się praktycznie na stałe.', f:()=>{G.p.ovr=cl(G.p.ovr+3,1,99);G.p.prof=cl(G.p.prof+10,0,99);G.p.med=cl(G.p.med-5,0,99);return['+3 OVR, +10 Profesjonalizm.','-5 Medialność — zniknąłeś z życia towarzyskiego.'];}},
  {l:'Wolę swój warsztat u siebie w garażu.', f:()=>{G.p.loyalty=cl(G.p.loyalty-10,0,100);G.p.equip=cl(G.p.equip+4,1,99);return['-10 Lojalność.','Sprzęt +4 — jednak coś tam dłubiesz.'];}}
 ]},
{id:'weteran', t:'MŁODY PYTA CIĘ O USTAWIENIA', cond:()=>G.p.age>=30,
 x:()=>'Masz '+G.p.age+' lat. Osiemnastolatek z twojego klubu podchodzi po treningu i pyta, jak ustawiasz zawieszenie na mokry tor. Za trzy lata będzie walczył z tobą o miejsce w składzie.',
 o:[
  {l:'Tłumaczę mu wszystko.', f:()=>{G.p.prof=cl(G.p.prof+10,0,99);G.p.med=cl(G.p.med+8,0,99);G.S.teamOvr+=2;G.S.heatPP-=6;return['+10 Profesjonalizm, +8 Medialność.','Overall drużyny +2.','-6 p.p. szans na biegi — wychowałeś sobie konkurencję.'];}},
  {l:'"Sam się naucz, mnie nikt nie tłumaczył."', f:()=>{G.p.med=cl(G.p.med-8,0,99);G.S.heatPP+=4;return['-8 Medialność.','+4 p.p. szans na biegi.'];}}
 ]},
{id:'junior_kadra', t:'POWOŁANIE DO KADRY MŁODZIEŻOWEJ', cond:()=>G.p.age<=21 && G.p.ovr>=40,
 x:()=>'Masz '+G.p.age+' lat i OVR '+G.p.ovr+'. Trener kadry chce cię na zgrupowanie, ale termin nachodzi na dwa mecze ligowe. Prezes klubu już dzwoni z pretensjami.',
 o:[
  {l:'Jadę na zgrupowanie.', f:()=>{G.p.ovr=cl(G.p.ovr+4,1,99);G.p.med=cl(G.p.med+12,0,99);G.S.banMatches+=2;G.p.loyalty=cl(G.p.loyalty-10,0,100);return['+4 OVR, +12 Medialność.','Opuszczasz 2 spotkania ligowe.','-10 Lojalność wobec klubu.'];}},
  {l:'Zostaję z klubem.', f:()=>{G.p.loyalty=cl(G.p.loyalty+15,0,100);G.p.prof=cl(G.p.prof+5,0,99);G.p.med=cl(G.p.med-8,0,99);return['+15 Lojalność, +5 Profesjonalizm.','-8 Medialność — trener kadry cię skreślił na ten rok.'];}}
 ]},
{id:'forma_zycia', t:'NAJLEPSZA FORMA W KARIERZE', cond:()=>G.history.length>0 && G.history[G.history.length-1].avg>=1.9,
 x:()=>'Zeszły sezon skończyłeś ze średnią '+G.history[G.history.length-1].avgTxt+'. Trzy kluby dzwonią, dwóch tunerów oferuje sprzęt za darmo w zamian za logo, a Ostafiński nazwał cię "objawieniem".',
 o:[
  {l:'Biorę darmowy sprzęt od tunera za reklamę.', f:()=>{G.p.equip=cl(G.p.equip+18,1,99);G.p.med=cl(G.p.med-8,0,99);return['Sprzęt +18 za darmo.','-8 Medialność — kevlar wygląda jak bilbord.'];}},
  {l:'Płacę za swoje i nikomu nic nie jestem winien.', f:()=>{const k=Math.min(G.p.budget,120000);G.p.budget-=k;G.p.equip=cl(G.p.equip+Math.round(k/9000),1,99);G.p.prof=cl(G.p.prof+8,0,99);return['-'+zl(k)+'.','Sprzęt +'+Math.round(k/9000)+'.','+8 Profesjonalizm.'];}}
 ]}
];
 
/* --- PROGI UPADŁOŚCI (jedno miejsce do kręcenia gałką) ---
   Uwaga na skalę: ARESZTOWANIE PREZESA losuje się teraz z szansą ok. 1,5% na klub
   na sezon (patrz clubEconomy() w engine.js), a klubów jest 24. Przy onArrest:40
   wychodzi z tego średnio jedna upadłość na kilka sezonów — stare szyldy żyją dłużej,
   a zniknięcie klubu z mapy znowu jest wydarzeniem, a nie coroczną rutyną. */
const BANKRUPTCY={
 onArrest  : 40,         // % szans na upadłość po ARESZTOWANIU PREZESA
 onSpoloss : 100,        // % szans po UTRACIE SPÓŁKI SKARBU PAŃSTWA z dziurą w kasie
 deepMinus : 0.25,       // "potężny minus" = budżet poniżej -25% kosztów sezonu
 debtLimit : 3000000,    // powyżej tego długu (3 mln zł) wchodzi syndyk...
 onDebt    : 50          // ...z taką szansą (przy ujemnym budżecie)
};
 
const IMIE=['Bartosz','Maciej','Patryk','Dawid','Kacper','Szymon','Mateusz','Jakub','Wiktor','Damian',
 'Krzysztof','Grzegorz','Adrian','Norbert','Sebastian','Paweł','Tobiasz','Oskar','Hubert','Kamil',
 'Rafał','Mariusz','Przemysław','Janusz','Zbigniew','Marcin','Łukasz','Piotr','Tomasz','Wojciech'];
const NAZW=['Nowak','Wiśniewski','Wójcik','Kamiński','Zieliński','Szymański','Woźniak','Dąbrowski','Kozłowski',
 'Jankowski','Mazur','Kwiatkowski','Krawczyk','Piotrowski','Grabowski','Nowakowski','Pawłowski','Michalski',
 'Adamczyk','Dudek','Zając','Wieczorek','Jabłoński','Król','Majewski','Olszewski','Jaworski','Wróbel',
 'Pawlak','Witkowski','Walczak','Stępień','Górski','Rutkowski','Michalak','Sikora','Ostrowski','Baran',
 'Duda','Szewczyk','Tomaszewski','Pietrzak','Marciniak','Wróblewski','Zalewski','Jakubowski','Jasiński',
 'Zawadzki','Sadowski','Chmielewski','Włodarczyk','Borkowski','Czarnecki','Sawicki','Sokołowski','Urbański',
 'Kubiak','Maciejewski','Szczepański','Kucharski','Wilk','Kalinowski','Mazurek','Wysocki','Adamski',
 'Kaźmierczak','Sobczak','Czerwiński','Konieczny','Kaczmarek','Głowacki','Bednarek','Ziółkowski'];