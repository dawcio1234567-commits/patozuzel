/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Argentyna, zgrupowania, operacja, alimenty
   Pula "WEV_PODSTAWA" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2107-2268 oryginału).
   ============================================================ */
const WEV_PODSTAWA = [

{id:'argentyna_im', t:'INDYWIDUALNE MISTRZOSTWA ARGENTYNY',
 x:()=>'Zima. Faks (tak, faks) z Buenos Aires: zaproszenie na cykl turniejów o mistrzostwo Argentyny. '+
       'Twój OVR ('+G.p.ovr+') mieści się dokładnie w przedziale, którego szukają: ktoś z Europy, kto nie jest gwiazdą '+
       'i zgodzi się jechać za bilet oraz asado. Liga rusza za sześć tygodni.',
 /* TYLKO ŚREDNI OVR. `noArg` = spaliłeś most, sprzedając Argentyńcowi oklejony złom. */
 cond:(p)=>p.ovr>=45 && p.ovr<=75 && !p.next.noArg,
 w:10,
 o:[
  {l:'Jadę na własny koszt — zima w Argentynie brzmi lepiej niż Mietek.', f:()=>{
     const koszt=R(25000,40000);
     const l=[fxK(-koszt)+' za bilety i transport sprzętu'];
     /* --- CZĘŚĆ SPORTOWA: bez zmian względem starej wersji (zysk OVR / utrata sprzętu / upadek) --- */
     const r=R(1,100);
     if(r<=30){ const nagr=R(60000,110000);
       l.push('WYGRYWASZ CAŁY CYKL. Mistrz Argentyny.', fxO(3), fxM(8), fxK(nagr)+' nagród i startowego', fxP(4)); }
     else if(r<=70){
       l.push('Linia lotnicza zgubiła skrzynię ze sprzętem. Znalazła się. W Limie. Po sezonie.',
              fxE(-20), fxK(-R(20000,45000))+' na sprzęt zastępczy i odprawy celne',
              fxM(5)+' (płacz na wizji obejrzała cała Polska)'); }
     else {
       l.push('Upadek na twardym torze w Prowincji Buenos Aires na tydzień przed startem ligi.',
              fxIN(25)+' (plecy pamiętają ten tor)', fxO(1)+' (jazdy jednak trochę było)'); }
     /* --- TWARDE 10%: WPADKA Z ARGENTYNKĄ ---
        Losowane NIEZALEŻNIE od wyniku sportowego: możesz wrócić jako mistrz
        Argentyny i z alimentami na osiemnaście lat. */
     if(chance(10)){
       l.push('Valentina z Mar del Plata. Trzy tygodnie, jedno asado i telefon w lipcu: będzie dziecko.',
              fxAlimony(),
              fxM(6)+' (temat obiegł wszystkie portale)', fxP(-6));
     }
     return l; }},
  {l:'Zostaję trenować u Mietka. Przysiady na czas, ale u siebie.',
   f:()=>[fxO(1), fxP(4), 'Bez fajerwerków. Za to bez gipsu, bez faktur z lotniska i bez alimentów.']}
 ]},

{id:'zima_hiszpania', t:'ZIMOWE ZGRUPOWANIE W ALMERII',
 x:'Grupa zawodników leci na trzy tygodnie do Almerii: tor, siłownia, dietetyk i zero wymówek. Cena za osobę robi wrażenie.',
 cond:(p)=>p.budget>=80000 && !injured(p),
 w:4,
 o:[
  {l:'Lecę. Trzy tygodnie jazdy w styczniu robią sezon.', f:()=>[fxK(-80000), fxO(3), fxP(5), fxHN(5)]},
  {l:'Siłownia u pana Mietka na osiedlu.', f:()=>[fxO(1), fxM(-4)+' — inni wrzucali story z plaży']}
 ]},

{id:'zima_warsztat', t:'ZIMA W WARSZTACIE ALBO ZIMA W WERANDZIE',
 x:'Cztery miesiące bez meczu. Mechanik rozłożył silniki na części i pyta, czy przyjeżdżasz to składać, czy on ma to zrobić sam.',
 w:3,
 o:[
  {l:'Siedzę z nim w warsztacie do lutego.', f:()=>[fxP(8), fxE(6), fxM(-4)+' — zniknąłeś z internetu']},
  {l:'Zima jest raz w roku. Weranda też.',   f:()=>[fxM(8), fxP(-8), fxE(-4), fxIN(8)+' (kondycja po zimie)']}
 ]},

{id:'zima_menedzer', t:'MENEDŻER DZWONI PRZED OKIENKIEM',
 x:'„Mam dla ciebie dwa telefony, ale musisz mi obiecać, że nie podpiszesz nic bez mojej wiedzy”. Chce 15% i zaliczkę na paliwo.',
 w:3,
 o:[
  {l:'Niech dzwoni. 15% to 15%.', f:()=>{G.p.next.betterOffers=true;
     return [fxK(-8000)+' zaliczki', 'Menedżer obdzwonił ligę — w tym okienku dostajesz lepsze oferty.'];}},
  {l:'Sam sobie zadzwonię.', f:()=>[fxP(5)]}
 ]},

{id:'zima_operacja', t:'ZIMOWA OPERACJA — „TO TRZEBA WRESZCIE POSKŁADAĆ”',
 x:'Ortopeda oglądał zdjęcia z całej kariery i mówi wprost: albo teraz płytka i śruby, albo za dwa lata koniec.',
 cond:(p)=>p.career.seasons>=3 && p.age>=24,
 w:3,
 o:[
  {l:'Kładę się na stół w grudniu.', f:()=>[fxK(-35000)+' za zabieg poza kolejką', fxO(2), fxIN(-15)+' (wreszcie poskładany)', fxP(6)]},
  {l:'Pojadę na zastrzykach, jak zawsze.', f:()=>[fxIN(18), fxM(3)]}
 ]},

{id:'zima_alimenty', t:'LIST Z SĄDU RODZINNEGO',
 x:()=>'Koperta z Buenos Aires przez polski sąd. Zostało rat: '+(G.p.alimony||0)+'. Adwokat proponuje wniosek o obniżenie kwoty.',
 /* Odpala się TYLKO wtedy, gdy naprawdę płacisz alimenty */
 cond:(p)=>(p.alimony||0)>0,
 w:8,
 o:[
  {l:'Płacę adwokatowi i walczę o obniżkę.', f:()=>{
     const l=[fxK(-12000)+' zaliczki dla adwokata'];
     if(chance(35)){ G.p.alimony=Math.max(0,G.p.alimony-4);
       l.push('Sąd skrócił obowiązek o 4 lata. Zostało rat: '+G.p.alimony+'.'); }
     else l.push('Wniosek odrzucony. Zostało rat: '+G.p.alimony+'.');
     return l;}},
  {l:'Płacę i nie komentuję.', f:()=>[fxP(4), 'Rat do zapłaty: '+(G.p.alimony||0)+'.']}
 ]},
 
 {id:'matka_boska_klub', t:'OBJAWIENIE SPONSORA',
 x:'Prezes wielkiej firmy po wybudowaniu figury Matki Boskiej doznaje wizji, że Ty musisz poprowadzić jego nowy klub żużlowy.',
 o:[
  {l:'Tak jak Pan Jezus powiedział – wchodzę w to.', f:()=>{ 
     return [fxHN(50), fxM(10), pick([fxO(5), fxO(-5)]), {t:'Wymuszony transfer + Kasa', f:(p)=>{p.next.forceClub='any'; p.budget+=pick([100000, -100000]);}}];
  }},
  {l:'Prędzej zaufam wąsatemu gościowi na quadzie.', f:()=>[fxP(10)]}
 ]},
{id:'insta_15latka', t:'WIADOMOŚĆ NA INSTAGRAMIE',
 x:'Pisze do Ciebie 15-latka na Instagramie.',
 o:[
  {l:'„Zapraszam na herbatkę.”', f:()=>[fxP(10), fxM(10)]},
  {l:'„Pokaż pupę w stringach.”', f:()=>{ 
     if(chance(10)) return [{t:'Afera obyczajowa, wylatujesz z klubu.', f:(p)=>{p.next.forceClub='weak';}}, fxM(-20)];
     if(chance(10)) return [fxO(2), fxM(-20)];
     return [fxM(-20)];
  }}
 ]},
{id:'zima_emilcin', t:'WIGILIA W EMILCINIE',
 x:'Z nudów jedziesz w Wigilię do Emilcina.',
 o:[
  {l:'Dotykasz pomnika kosmitów.', f:()=>[fxO(10)+' (Dostałeś energię z kosmosu)']},
  {l:'Żałujesz wyjazdu, nie wierzysz w UFO.', f:()=>[fxM(-10), fxIN(15)]}
 ]},
{id:'szafa_influencer', t:'SKŁADANIE SZAFY',
 x:'Nawalony żużlowy influencer dzwoni do Ciebie w grudniu i zaprasza na wspólne składanie szafy z IKEI.',
 o:[
  {l:'Zgadzam się.', f:()=>[fxO(2), fxIN(30)]},
  {l:'Dzwonię na płokułatułę', f:()=>[fxM(-10), fxP(10)]}
 ]},
{id:'romans_prezeska', t:'PROPOZYCJA PREZESKI',
 x:'Prezeska klubu dzwoni przed okienkiem. Składa ofertę przyjaźni z benefitani kontraktowymi. Wykonanie ma odbyć się na oczach męża.',
 o:[
  // stawka za punkt siedzi w kontrakcie zawodnika (p.contract.rate), a nie w klubie
  {l:'Zgadzam się.', f:()=>{return [{t:'Podwyżka +2 000 zł za punkt.', f:(p)=>{p.contract.rate+=2000;}}];}},
  {l:'Rozwiązuję kontrakt z obrzydzenia.', f:()=>{return [{t:'Uciekasz do innej ligi.', f:(p)=>{p.next.forceClub='weak';}}];}}
 ]},
{id:'corka_prezesa', t:'ROMANS Z CÓRKĄ',
 x:'Wdajesz się w grudniowy romans z córką prezesa.',
 o:[
  {l:'Oświadczasz się jej.', f:()=>{return [{t:'Kontrakt przedłużony o 5 lat!', f:(p)=>{p.contract.years+=5;}}];}},
  {l:'Mówisz prezesowi, że jej nie znasz.', f:()=>{return [{t:'Wkurzony prezes niszczy Ci reputację. Masz oferty tylko z KLŻ.', f:(p)=>{p.next.forceClub='weak';}}];}}
 ]},
{id:'zamrzniete_jezioro', t:'MROŹNY TRENING',
 x:'Mróz -20 stopni. Wpadasz na genialny pomysł trenowania na kolcach po zamarzniętym jeziorze.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Wyjeżdżam na lód.', f:()=>{ 
     if(chance(50)) return [fxEnd('Lód pęka. Utonąłeś wraz z motocyklem.')];
     return [fxO(5)];
  }},
  {l:'Spokojnie, idę na saunę.', f:()=>[fxP(10)]}
 ]},
{id:'chris_harris', t:'TRENING Z BOMBEREM',
 x:'Chris Harris dzwoni w lutym i zaprasza Cię na wspólny trening na szkółkowym owalu w Anglii.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Jadę trenować.', f:()=>[fxM(30), fxP(-10)]},
  {l:'Zostaję w domu.', f:()=>[fxM(-40)]}
 ]},
{id:'dietetyk_wawrzyniak', t:'DIETA OD DAWIDA',
 x:'Dawid Spożywczak proponuje, że od zimy zostanie Twoim osobistym dietetykiem.',
 o:[
  {l:'No raczej, wchodzę w to.', f:()=>[fxO(-5)+' (Prędkość spada, waga rośnie)']},
  {l:'Nie potrzebuję dietetyka.', f:()=>[fxP(-20)]}
 ]},
 {id:'gala_lodowa_drabik', t:'GALA LODOWA W CZĘSTOCHOWIE',
 x:'Sławomir Drabik dzwoni i zaprasza na tradycyjną Galę Lodową. Tor jest z lodu, masz jechać na starych oponach z wkrętami do drewna.',
 o:[
  {l:'Wbijam wkręty i jadę w futrze!', f:()=>{ 
     if(chance(20)) return [fxEnd('Wkręt wyleciał koledze z opony i trafił. Tragedia na lodzie, koniec kariery.')]; 
     if(chance(40)) return [fxIN(30)+' (Rozorana łydka)'];
     return [fxM(30), fxO(3)];
  }},
  {l:'Za zimno, siedzę w domu z grzańcem.', f:()=>[fxP(10)]}
 ]},
];
