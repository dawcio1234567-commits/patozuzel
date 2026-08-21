/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: PIENIĄDZE, KLUB, PREZESI
   Pula "EV_KASA" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1004-1166 oryginału).
   ============================================================ */
const EV_KASA = [
/* ===== PIENIĄDZE, KLUB, PREZESI ===== */
{id:'kasa', t:'UPOMINASZ SIĘ O PIENIĄDZE',
 x:'Trzeci miesiąc bez przelewu. Na biurku prezesa leży faktura za balony z logo klubu i wydruk z twojego konta z kwotą 0,00 zł. Prezes uśmiecha się i pyta: „ale czy ty na pewno tego chcesz?”.',
 cond:(p,c)=>!!c && c.debt>10000,
 o:[
  {l:'Naprawdę chcę tych pieniędzy.', f:()=>{G.p.next.zeroMatches=true;return ['Prezes kiwa głową ze zrozumieniem.','W KOLEJNYM SEZONIE ZALICZYSZ 0 MECZÓW.'];}},
  {l:'Powietrze i fotosynteza też są spoko.', f:()=>{G.S.noEarnings=true;return ['W tym sezonie nie zarabiasz ani grosza.', fxH(10), fxE(-15)+' (brak kasy na serwis)'];}}
 ]},
{id:'reklamowka', t:'WYPŁATA W REKLAMÓWCE Z BIEDRONKI',
 x:'Prezes zamyka drzwi gabinetu, wyciąga z szafy pancernej reklamówkę i mówi: „jest wszystko, tylko bez papierów, bo księgowa ma teraz trudny okres”. W środku faktycznie coś szeleści.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Biorę i nie zadaję pytań.', f:()=>{const c=clubOf(G.p);const k=Math.min(c?c.debt:0, R(15000,40000));
     if(c) c.debt=Math.max(0,c.debt-k);
     return [fxK(k)+' w banknotach po 50', 'Dług klubu wobec ciebie maleje o tyle samo.', fxP(-5)];}},
  {l:'Chcę przelew i PIT.', f:()=>{const c=clubOf(G.p);const d=R(20000,50000); if(c) c.debt+=d;
     return [fxP(5), 'Zaległości klubu rosną o '+zl(d)+'.', fxH(-10)+' (prezes obraził się śmiertelnie)'];}}
 ]},
{id:'diamenty', t:'WYPŁATA W DIAMENTACH',
 x:'Prezes rozkłada na biurku aksamitną szmatkę, a na niej kilka kamieni. Mówi, że „to lepsze niż złoto” i że ma na to papier od znajomego.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Akceptuję.', f:()=>[fxK(-50000)+' (koszty paserskie i wycena)', fxP(-10)]},
  {l:'Nie zgadzam się.', f:()=>{G.S.noRenew=true;G.p.next.forceClub='weak';
     return ['Zrywasz kontrakt.','W kolejnym sezonie jeździsz wyłącznie w najniższej klasie rozgrywkowej.'];}}
 ]},
{id:'zbiorka', t:'ZBIÓRKA RATUNKOWA',
 x:'Twój klub organizuje publiczną zbiórkę na spłatę długów. Kibice wrzucają po dwadzieścia złotych, a menedżer nagrywa story z podziękowaniami.',
 cond:(p,c)=>!!c && c.debt>50000,
 o:[
  {l:'Pomagam.', f:()=>{const c=clubOf(G.p); if(c) c.debt=Math.max(0,c.debt-10000);
     /* NAPRAWA: opcja premiowana dodatnio (lojalność, publiczne poparcie) miała
        wpisany fxRateN(0.5) — CIĘCIE stawki za punkt o połowę w kolejnym sezonie,
        bez żadnego wyjaśnienia w tekście. Gracze zgłaszali, że "zdarzenia z kasą
        za punkty nie działają jak trzeba" — to jeden z takich odwróconych znaków.
        Pomoc klubowi w potrzebie to gest lojalności, nie kara na własną stawkę. */
     return [fxK(-10000)+' na zbiórkę', fxRateN(1.15)+' — zarząd pamięta, kto pomógł, gdy było krucho', fxL(15)];}},
  {l:'Mam to w dupie.', f:()=>{G.S.noRenew=true;return [fxL(-15), 'Klub rozwiązuje z tobą kontrakt.'];}}
 ]},
{id:'komornik', t:'KOMORNIK W BIURZE KLUBU',
 x:'Wchodzisz po podpis na delegację i widzisz dwóch panów spisujących ekspres do kawy. Prezes tłumaczy im, że ekspres jest leasingowany.',
 cond:(p,c)=>!!c && c.debt>=40000,
 o:[
  {l:'Dopisuję się do listy wierzycieli.', f:()=>{const c=clubOf(G.p);const o=Math.round((c?c.debt:0)*0.4);
     if(c) c.debt=Math.max(0,c.debt-o);
     return ['Odzyskujesz '+zl(o)+' z masy.', fxK(o), fxM(-5), fxL(-10)+' — szatnia patrzy krzywo'];}},
  {l:'Czekam na cud.', f:()=>{const c=clubOf(G.p);const l=[fxL(10)];
     if(chance(35)){const s=Math.round((c?c.debt:0)*0.8); if(c) c.debt-=s; G.p.budget+=s; l.push('Sponsor dosypał w ostatniej chwili: '+zl(s)+'.');}
     else { if(c) c.debt+=R(10000,30000); l.push('Nic nie wróciło, a dług klubu urósł.');}
     return l;}}
 ]},
{id:'skrzydlo', t:'WALENTY SKRZYDŁO DOWALA CI KARĘ 100 000 ZŁ',
 x:'Powód: brak czapki klubowej na wywiadzie. W tym samym czasie klub zalega ci wielkie pieniądze. Nikt w tym budynku nie widzi w tym sprzeczności.',
 cond:(p,c)=>!!c && c.debt>=60000,
 o:[
  {l:'Płacę z pokorą.', f:()=>{const c=clubOf(G.p); if(c) c.debt=0;
     return [fxM(-10), fxP(10), 'Dług klubu wobec ciebie wyzerowany (kompensata).'];}},
  {l:'Pierdolę, idę do Taflińskiego.', f:()=>{const c=clubOf(G.p);G.S.forcedEnd=true;G.S.noRenew=true;
     const l=[fxM(15), fxP(-10), 'Do końca sezonu nie jedziesz ani jednego spotkania.'];
     if(chance(40)){ if(c) c.debt=0; l.push('PZM zwrócił dług z gwarancji.'); } else l.push('Trybunał PZM rozłożył ręce. Dług zostaje.');
     return l;}}
 ]},
{id:'winda', t:'ZABLOKOWANA WINDA I DOTACJA',
 x:'Jeden radny zatrzasnął się w windzie i nie dotarł na głosowanie. Twój klub nie dostał dotacji ratującej finanse, a ty ostatnią wypłatę pamiętasz jak przez mgłę.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Siedzę cicho, muszę się pokazać.', f:()=>[fxP(20)+' — zarząd docenił, że nie robisz szumu', fxM(-15)+' — zniknąłeś z anten', fxO(-1)+' (sprzęt stoi u tunera i czeka na przelew)']},
  {l:'Idę płakać w ramię Julii Pożarlik podczas kolejnego meczu.', f:()=>[fxM(25), fxP(-25), fxO(-1)]},
  {l:'Urządzam protest, zaczynam głodówkę i przykuwam się do kaloryfera w biurze klubu.', f:()=>{
     const c=clubOf(G.p);const l=[fxM(25), fxP(-18)];
     if(chance(25)){const k=Math.round((c?c.debt:0)*0.6); if(c) c.debt-=k; G.p.budget+=k; l.push('Klub znalazł pieniądze: '+zl(k)+'.');}
     if(chance(25)){G.S.noRenew=true;G.p.next.betterOffers=true;l.push('Sprawa poszła szeroko — po sezonie możesz wybrać nowy klub.');}
     return l;}}
 ]},
{id:'dolustats', t:'DOŁUSTATS I PRAWDA O FINANSACH',
 x:'W trakcie sezonu, przeglądając X, natykasz się na statystyki DołuStats. Wykres twojej drużyny wygląda jak profil zjazdu do Zakopanego.',
 cond:(p,c)=>!!c && c.debt>0,
 o:[
  {l:'Głęboko je analizuję.', f:()=>{const r=R(1,3);
     if(r===1) return [fxO(2), fxT(1), fxP(22)+' — zacząłeś prowadzić własny zeszyt ustawień'];
     if(r===2) return ['Popatrzyłeś, pokiwałeś głową, nic z tego nie wynikło.', fxP(5)];
     return [fxO(-1), fxT(-1)+' — zaraziłeś szatnię defetyzmem', fxP(-12)];}},
  {l:'Piszę tweeta, że większym kłamstwem jest terminowość wypłat.', f:()=>[fxM(25), fxP(-20), fxBan(1)+' — klub ukarał cię regulaminowo']}
 ]},
{id:'brakkasy', t:'BRAK KASY Z KLUBU',
 x:'Klub nie płacił od wiosny, a ty naprawdę potrzebujesz pieniędzy na życie. Rata za busa nie czeka.',
 cond:(p,c)=>p.budget<10000 || (!!c && c.debt>50000),
 o:[
  {l:'Zaciskam zęby i zaciskam pasa.', f:()=>[fxP(5)]},
  {l:'Szukam metod zarobku.', f:()=>{const r=R(1,3);
     if(r===1) return ['Mrożonki w Niemczech. Trzy miesiące na chłodni.', fxHN(15)];
     if(r===2) return ['Trzeba rozwieźć bułki, wędliny…', fxHN(-10), fxK(5000)];
     const l=['Plan kolegi. Nie pytasz o szczegóły.'];const q=R(1,100);
     if(q<=50) l.push(fxO(R(-2,2)));
     else if(q<=70) l.push(fxBan(R(2,3)));
     else if(q<=90) l.push(fxH(5));
     else if(q<=98) l.push('Nic z tego nie wyszło.');
     else { l.push('Wjazd o 6 rano. Wyrok w zawieszeniu.'); G.p.banSeasons=1; G.S.forcedEnd=true; }
     return l;}}
 ]},
{id:'haracz', t:'HARACZ DLA TRENERA',
 x:'Trener oczekuje 10% od punktówki za wystawianie cię w składzie. Mówi to przy kawie, jakby chodziło o składkę na kwiatek.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Płacę.',     f:()=>[fxK(-15000), fxH(15)]},
  {l:'Nie płacę.', f:()=>[fxH(-20), 'Trener nagle „nie widzi cię w tym zestawieniu”.']}
 ]},
{id:'awangarda', t:'ZBIÓRKA AWANGARDY',
 x:'Przy ofercie sponsoringowej odzywa się Awangarda żużlowa. Organizują na grupie zbiórkę, żeby móc ci zapłacić za logo.',
 cond:(p)=>p.budget<50000,
 o:[
  {l:'Zgadzam się i lajkuję fanpage.', f:()=>{const l=[];
     if(chance(15)) l.push(fxK(8000)+' ze zbiórki'); else l.push('Zbiórka utknęła na 340 zł.');
     l.push(fxM(R(-4,4))); l.push(fxP(-2)); return l;}},
  {l:'Wy jesteście normalnie nienormalni.', f:()=>{G.p.next.noSponsor=true;
     return [fxP(3), 'Żadnych ofert sponsorskich w najbliższym okienku.'];}}
 ]},
{id:'windykacja', t:'WINDYKACJA DZWONI DO CIEBIE',
 x:()=>'Twoje konto: '+zl(G.p.budget)+'. Pani z firmy windykacyjnej jest miła i bardzo dobrze poinformowana o terminarzu twoich meczów.',
 cond:(p)=>p.budget<0,
 o:[
  {l:'Sprzedaję zapasowy motocykl.', f:()=>[fxK(30000), fxE(-15)]},
  {l:'Biorę zaliczkę od prezesa.',   f:()=>{const c=clubOf(G.p); if(c) c.debt=Math.max(0,c.debt-50000);
     return [fxK(50000), 'Dług klubu wobec ciebie maleje o tyle samo.', fxL(10)];}}
 ]},
{id:'speedcoin', t:'KOLEGA WCHODZI W „SPEEDCOINA”',
 x:'Pokazuje ci wykres na telefonie z pękniętym ekranem. Mówi, że to „krypto dla żużlowców” i że jego kuzyn zrobił na tym mieszkanie w Rybniku.',
 cond:(p)=>p.budget>=10000,
 o:[
  {l:'Wchodzę za 20% budżetu.', f:()=>{const inv=Math.round(G.p.budget*0.2);G.p.budget-=inv;
     if(chance(25)){G.p.budget+=inv*3;return ['Wpłaciłeś '+zl(inv)+', wyjąłeś '+zl(inv*3)+'.','Kolega chce teraz procent.'];}
     return ['Projekt zniknął razem ze stroną.','Straciłeś '+zl(inv)+'.'];}},
  {l:'Nie wchodzę.', f:()=>[fxP(2)]}
 ]},
{id:'marcel', t:'SPOSÓB NA ZAROBEK',
 x:'Kolega Marcel przychodzi z propozycją zarabiania bez wychodzenia z domu. Ma prezentację w PowerPoincie i zeszyt z nazwiskami.',
 o:[
  {l:'Korzystam z rad.', f:()=>{G.S.forcedEnd=true;G.p.next.forceClub='MOSIĄDZ Gorzów';
     return [fxK(30000), fxP(-15), 'Pauzujesz do końca sezonu — sprawa się rypła.','Po sezonie zostaje ci tylko oferta z Gorzowa.'];}},
  {l:'Odmawiam.', f:()=>['Marcel obraził się i sprzedał ten sposób juniorowi.']}
 ]},
{id:'bogacz', t:'SALON SAMOCHODOWY W GORZOWIE',
 x:()=>'Masz na koncie '+zl(G.p.budget)+'. Kolega z zespołu przyjechał na trening nowym SUV-em i pyta, na co ty właściwie czekasz.',
 cond:(p)=>p.budget>=900000,
 o:[
  {l:'Kupuję auto.',        f:()=>{const k=Math.round(G.p.budget*0.3);return [fxK(-k), fxM(10)+' (story z salonu)', fxP(-10)];}},
  {l:'Pakuję w silniki.',   f:()=>[fxK(-200000), fxE(20), fxP(5)]}
 ]},
{id:'mrozek', t:'PORADA KRZYSZTOFA M.',
 x:'Klub chce podpisać z tobą dziesięcioletni kontrakt. Prezes zainspirował się Krzysztofem Mrozkiem i kładzie na stole umowę dłuższą niż niejedna kariera.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Podpisuję.', f:()=>{G.p.next.lockTransfer=3;return [fxL(8), 'Blokada transferowa: przez najbliższe sezony nie zmienisz klubu.'];}},
  {l:'„Panie prezesie, bez przesady”.', f:()=>[fxL(-3), 'Pozostajesz dostępny na rynku transferowym.']}
 ]},
{id:'spadkowicz', t:'SZATNIA PRZED OSTATNIĄ KOLEJKĄ SPADKOWICZA',
 x:()=>'Klub ('+esc((clubOf(G.p)||{name:'—'}).name)+') ledwo zipie finansowo i sportowo. Kapitan proponuje, żeby wszyscy zrzekli się premii punktowej, byle utrzymać drużynę przy życiu.',
 cond:(p,c)=>!!c && c.ovr<=62,
 o:[
  {l:'Zrzekam się.', f:()=>[fxT(2), fxL(15), fxM(5), fxRate(0.5)]},
  {l:'Mam kredyt, nie zrzekam się.', f:()=>[fxL(-15), fxM(-10), fxT(-1)+' — szatnia się sypie']}
 ]},
 
];
