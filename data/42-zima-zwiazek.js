/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: NEGOCJACJE, WYLOTÓWKA, SZANTAŻ
   Pula "WEV_ZWIAZEK".
   ------------------------------------------------------------
   Ładuje się PO data/40-zdarzenia-index.js i dopisuje na koniec
   WINTER_EVENTS (push) — bez ruszania sklejki.

   ZIMĄ NIE MA SEZONU: żadnego fxA, fxT, fxOB, fxH, fxI, fxBan.
   Zamiast nich fxAN, fxTN, fxHN, fxIN, fxDefN i p.next.*
   (fxTN / fxDefN dokłada engine/34-zwiazek-cegla.js).
   ============================================================ */
const WEV_ZWIAZEK = [

/* ===== WYLOTÓWKA I ZBIÓRKI =====
   Warunek: sezon minimum dobry — czytany z ostatniego wpisu w historii,
   dokładnie tak, jak liczy to raport sezonu (średnia biegopunktowa). */
{id:'wylotowka_zbiorki', t:'WYLOTÓWKA I ZBIÓRKI', w:4,
 x:'Trwają zimowe negocjacje. Przyjechałeś do biura prezesa. Prezes znany jest z twardych negocjacji - nie rzuca pieniędzmi na lewo i prawo. Zasadniczo się dogadaliście za stawkę niższą niż oczekiwałeś. Niemniej powiedziałeś, że musisz się zastanowić nad ofertą. A i zapytałeś się o dobry wyjazd na wylotówkę z miasta (nie musi wiedzieć że do przeciwnika ligowego). Jednak chcesz zostać w klubie, ale jakby ktoś Ci coś więcej dorzucił... Co robisz?',
 cond:(p)=>G.history.length>0 && (G.history[G.history.length-1].avg||0)>=1.5,
 o:[
  {l:'Odpalasz kontakty w klubie kibica, żeby utworzyli zbiórkę na utrzymanie Ciebie',
   sum:'Ludzie wpłacają na głupoty, to może z głupoty i na ciebie?',
   f:()=>{ const p=G.p;
     if(chance(50)){ p.next.forceClub='current';
       return ['Uzbierali idioci - przedłużasz kontrakt.', fxK(50000), fxL(-10), fxP(-10)];
     }
     p.next.noRenew=true;
     return ['"Na pana miejsce mam 3 innych idiotow" no i skorzystali...',
             'BAN TRANSFEROWY NA STARY KLUB: oferty przedłużenia nie będzie.'];}},
  {l:'Korzystasz z dobrej wylotówki',
   sum:'Pewien mechanik powiedział "Żużlowcy to chuje". No miał rację.',
   f:()=>{ const p=G.p;
     if(chance(50)){ p.next.forceClub='rival';
       return ['GORĄCA OFERTA RYWALA W TWOJEJ OKOLICY [PODPISZ TERAZ]',
               'Podpisujesz kontrakt w oknie z rywalem z tej samej ligi.',
               fxK(100000)+' jednorazowo', fxL(-10)];
     }
     p.next.noRenew=true;
     return ['Ale czemu mnie wszyscy zlewają...',
             'BAN TRANSFEROWY NA STARY KLUB — licz na dobre oferty last minute.'];}},
  {l:'Nieważne co mam w sercu, ważne co mam w dupie...',
   sum:'...a w dupie mam rywali i przeprowadzki',
   f:()=>{ G.p.next.forceClub='current';
     return [fxL(20), fxP(10), 'Przedłużasz kontrakt ze starym klubem.'];}}
 ]},

/* ===== SZANTAŻ WYBITNEGO [PATOLOGIA/UŻYWKI] =====
   Warunek: młody gwiazdor, który wyrósł ponad drużynę (OVR o 8+ wyżej
   od poziomu klubu) i przy tym ma to wszystko gdzieś (prof < 40). */
{id:'szantaz_wybitnego', t:'SZANTAŻ WYBITNEGO', w:4,
 x:'Jest wybitnym zawodnikiem na tle kolegów z drużyny. Cóż można powiedzieć - dusisz się, choć środowisko lubisz. Prezes klubu zrobi absolutnie wszystko by Ciebie zatrzymać w składzie.',
 cond:(p)=>p.age>=23 && p.age<=27 && p.prof<40 && p.ovr >= ((clubOf(p)||{}).ovr||0) + 8,
 o:[
  {l:'"Załatwcie mi ślub na Wawelu" - powinno to zerwać rozmowy',
   sum:'Przecież jesteś niewierzący.',
   f:()=>{ const p=G.p;
     if(chance(80)){ p.next.forceClub='current';
       return ['Ale zabawniejsze jest to, że dostajesz papier od arcybiskupa - "Zgadzam się". Bóg tak chciał.',
               'Przedłużasz kontrakt.', fxO(5), fxTN(5), fxIN(-20), fxDefN(-20), fxMech(10)];
     }
     p.next.noRenew=true;
     return ['Ale nie udało się spełnić warunku. Ahoj przygodo!',
             'Brak oferty od starego klubu.', fxMech(10), fxP(10), fxDefN(-10)];}},
  {l:'"Ja po prostu chcę czegoś nowego" dyplomatycznie zrywasz negocjacje',
   sum:'Ahoj przygodo!',
   f:()=>{ G.p.next.noRenew=true;
     return ['Brak oferty od starego klubu.', fxMech(10), fxP(20), fxDefN(-10), fxIN(-10)];}},
  {l:'"Ok, poproszę Chevroleta Camaro". To Twój ulubiony samochód',
   f:()=>{ const p=G.p;
     if(chance(80)){ p.next.forceClub='current';
       return [fxSum('Samochód jak malowany. Tylko po podpisaniu kontraktu okazuje się, że leasing... Trzeba zwrócić. Naucz się stawiać warunki.'),
               'Przedłużasz kontrakt.', fxAN(10), fxMech(10), fxDefN(10), fxIN(5)];
     }
     p.next.noRenew=true;
     return [fxSum('Ale nie udało się spełnić warunku. Ahoj przygodo!'),
             'Brak oferty od starego klubu.', fxMech(10), fxP(10), fxDefN(-10)];}},
  {l:'"Kasa misiu kasa, mówi to Panu coś". Klasyczne.',
   sum:'Wielka ściepa wśród sponsorów. Niesamowite.',
   f:()=>{ const p=G.p;
     if(chance(80)){ p.next.forceClub='current';
       return ['I się im udało jeszcze!', 'Przedłużasz kontrakt.',
               fxK(200000), fxP(-10), fxMech(10), fxHN(10)];
     }
     p.next.noRenew=true;
     return ['Ale nie udało się spełnić warunku. Ahoj przygodo!',
             'Brak oferty od starego klubu.', fxMech(10), fxP(10), fxDefN(-10)];}}
 ]}

];

try{ if(typeof WINTER_EVENTS!=='undefined' && Array.isArray(WINTER_EVENTS)) WINTER_EVENTS.push.apply(WINTER_EVENTS, WEV_ZWIAZEK); }catch(_){}
