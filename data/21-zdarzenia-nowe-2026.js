/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: PAKIET NOWYCH ZDARZEŃ 2026
   Pula "EV_NOWE2026" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   STATUS PO WERYFIKACJI (engine/14,21-27):
   - 'zmarzlina_imp' i 'aronsson' zostały PRZENIESIONE z tej puli do
     engine/22c-imp-gp-finale-flavor.js — tam odpalają się bezpośrednio
     z finału IMP i ostatniej rundy GP (uproszczona wersja: losowy wynik
     bez ekranu wyboru, bo prawdziwy wybór wymaga ui/07-ekran-zdarzenia.js,
     którego nie mam). NIE MA ICH już w tej tablicy.
   - 'przeklety_mecz', 'anielski_orszak' (rywal Częstochowa/Grudziądz) i
     'kierownica_rozkladana' (tuner<10) zostają w tej puli, ale z
     cond:()=>false — bezpiecznie WYŁĄCZONE. Odblokowanie wymaga
     engine/15-liga-chronologia.js (pole przeciwnika w rundzie) i
     data/05-klasy-kluby-sprzet.js (pole tunera klubu). Kod jest gotowy,
     wystarczy zamienić cond, jak podeślesz te pliki.
   ============================================================ */
function _c(p){ try{ return clubOf(p); }catch(_){ return null; } }
function _weak(p){ try{ const c=_c(p); return !!c && c.ovr<70; }catch(_){ return false; } }
function _strongClub(p){ try{ const c=_c(p); return !!c && c.ovr>=85; }catch(_){ return false; } }
function _bieda(p){ try{ const c=_c(p); return (!!c && ((c.debt||0)>50000 || (c.budget||0)<0)) || p.budget<20000; }catch(_){ return false; } }
function _clubK(delta){ return {t:'Kasa klubu '+(delta>=0?'+':'-')+zl(Math.abs(delta)), f:(p)=>{const c=clubOf(p); if(c) c.budget+=delta;}}; }

const EV_NOWE2026 = [

{id:'odkrecasz_kolo', t:'ODKRĘCASZ PRZEDNIE KOŁO',
 x:'Odkręcasz przednie koło i idziesz na wieżyczkę z kołem pod pachą -> Gdyby nie policja wezwana przez sędziego, to by doszło do tragedii. A koło nie miałoby by szprych. Ale i tak jedziesz nie mecz a na dołek.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Wina spada głównie na Ciebie; koniec kariery.', f:()=>[fxEnd('Koniec kariery bandyty torowego i pozatorowego. Może to orzeźwi Ciebie. Lecz się agresorze.')]},
  {l:'Telefon na policję, niech leci kontrola.', f:()=>{G.S.forcedEnd=true; G.p.banSeasons=1;
    return [fxP(-20), fxM(-60), fxH(-30), fxK(-200000),
      '"Tak dalej być nie będzie" padło ze strony GKSŻ. Za dużo inb i agresji. Zostaliście wywaleni z ligi, zawodnicy ukarani i zawieszeni. WIELKIE ZAWIESZENIE.',
      _clubK(-500000), 'Klub zastąpiony innym ośrodkiem (syndyk).'];}},
  {l:'Wszyscy się kurwa uspokójmy. Mnie też poniosło.', f:()=>{
     const r=R(1,100);
     if(r<=60) return [fxP(-5), fxM(-15), fxH(-20), fxK(-50000), fxBan(R(2,7)), _clubK(-150000), fxWalk('lose',0)];
     if(r<=95){ G.S.forcedEnd=true;
       return [fxP(-10), fxM(-30), fxH(-30), fxK(-100000), 'Zawieszenie do końca sezonu.', _clubK(-300000), fxWalk('lose',0), 'Klub zastąpiony innym ośrodkiem.'];}
     G.S.forcedEnd=true; G.p.banSeasons=1;
     return [fxP(-20), fxM(-60), fxH(-30), fxK(-200000), 'WIELKIE ZAWIESZENIE.', _clubK(-500000), 'Klub usunięty i zastąpiony nowym ośrodkiem.'];}}
 ]},

{id:'rumunskie_palety', t:'RUMUŃSKIE PALETY',
 x:'Jedziesz na Puchar PALET do Rumunii. Po drodze dzwoni do ciebie prezes tamtejszego klubu i mówi, że nie ma zawodów. W tle słyszysz jednak śmiech jednego z zawodników.',
 /* Puchar PALET (engine/22) jest turniejem symulowanym poza rollEvent() —
    tak samo jak IMP/GP, nie ma flagi w G.S. Zostawiam warunek jako
    dokumentację intencji; ponieważ Puchar PALET nie ma jeszcze "flavor
    hooka" jak IMP/GP, event ten po prostu nigdy się nie odpali (bezpiecznie). */
 cond:(p,c,S)=>!!S.isPucharPalet,
 o:[
  {l:'Wracam do domu.', f:()=>[fxP(-5), fxM(-5), 'Zawody jadą bez ciebie i wygrywa Rumun.']},
  {l:'Coś mi tutaj śmierdzi. Jadę dalej.', f:()=>{const l=[fxK(10000), 'Przyjeżdżasz na zawody, a blady ze strachu prezes ogląda jak poniewierasz jego wychowanka.'];
     if(chance(25)) l.push('Stadion zostaje zamknięty.'); return l;}}
 ]},

{id:'zoladkowe_rewolucje', t:'ŻOŁĄDKOWE REWOLUCJE',
 x:'Myślałem że to będzie kolejny spokojny mecz ligowy. W dniu meczu okazało się że masz grypę żołądkową. Czujesz się fatalnie. Jesteś blady jak księgowa na widok konieczności wypłacenia punktowki za 75pkt. Dramat.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Nie dam rady. Pokazujesz papiery zdrowotne.', f:()=>{
     if(chance(60)) return [fxBan(1), fxI(-20), fxP(10), fxH(5)];
     return [fxWalk('lose',0), fxBan(R(1,2)), fxH(-10), fxP(-10), fxM(-10)];}},
  {l:'Jadę, o ile się da.', f:()=>{const r=R(1,100);
     if(r<=40) return [fxBan(R(2,5)), 'Złamana kostka i żebra + wstrząs mózgu.', fxK(-10000), fxH(-15), fxM(-30)];
     if(r<=80) return [fxI(25), fxP(-20), fxM(-10)];
     return [fxBan(R(1,3)), 'Hospitalizacja z powodu brzucha.', fxP(-15), fxM(-10), fxK(-10000)];}}
 ]},

{id:'owocowy_brat', t:'OWOCOWY BRAT',
 x:'Przed tobą ważny mecz. Twój brat bliźniak oferuje pomoc.',
 cond:(p,c,S)=>p.ovr<40 && _weak(p),
 o:[
  {l:'Przebieraj się w mój kevlar.', f:()=>{const r=R(1,100);
     if(r<=33) return [fxOB(30), 'Wchodzisz w kevlar brata — dziś jedziesz jak nigdy.'];
     if(r<=66) return [fxBan(R(0,3)), 'Czerwona kartka.', fxP(-10), fxM(20)];
     return [fxOB(-70), 'Zapomniałeś, że masz brata. Dałeś ciała.'];}},
  {l:'Wal się braciak.', f:()=>[fxI(10), fxP(10), fxM(-5)]}
 ]},

{id:'papierosek_ukrainski', t:'PAPIEROSEK UKRAIŃSKI [PATOLOGIA/UŻYWKI]',
 x:'W drodze na Ukrainę robicie przystanek. Mechanik pali papierosa koło samochodu. Proponuje Ci jednego.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'"I co? Niby paliwo nagle stało się łatwopalne?" Biorę.', f:()=>{const l=[fxE(-50), 'Był pożar i utrata sprzętu.'];
     if(chance(15)) l.push(fxEnd('Pożar w drodze na Ukrainę. Koniec kariery.')); return l;}},
  {l:'Chłopie Ty się zastanów, gdzie to robisz.', f:()=>[fxP(5)]}
 ]},

{id:'psi_chuj', t:'PSI CHUJ',
 x:'Mecz o nic. Nawet ostatni bieg o nic. Ty jedziesz drugi.',
 o:[
  {l:'Jedziesz bezpiecznie i dowozisz 2 pkt.', f:()=>[fxP(10)]},
  {l:'Co się może stać — każdy bieg jest o IMŚ.', f:()=>{const r=R(1,100);
     if(r<=30) return [fxEnd('Kraksa w biegu o nic. Koniec kariery.')];
     if(r<=60) return [fxBan(R(1,2)), 'Lekki uraz.'];
     if(r<=90) return [fxLongInj('Ciężki uraz odniesiony w biegu o zupełne nic.')];
     return ['Nic się nie dzieje.'];}}
 ]},

{id:'orzel_reszka_imsj', t:'ORZEŁ CZY RESZKA',
 x:'Standardowo w Anglii by pojechali. A my musimy jechać w finale IMŚJ. Jeden turniej, który decyduje o wszystkim. Idzie mi perfekcyjnie (3,3,2). Główny rywal ma (3,2,3). Nie jechaliśmy razem biegu i nie pojedziemy, bo wody tyle, że ratownicy nad bajorem wywiesili czerwoną flagę. Sędzia przyszedł do parku maszyn i mówi że będzie losowanie o mistrzostwo.',
 /* IMŚJ2 liczy się w runGpSeriesGen() (engine/23), poza rollEvent(). Warunek
    zostaje jako dokumentacja intencji, event bezpiecznie nigdy się nie odpali
    (brak flavor-hooka jak przy IMP/GP — nie było w zakresie "uproszczonej wersji"). */
 cond:(p,c,S)=>!!S.isIMSJ,
 o:[
  {l:'Jestem patriotą. Wybieram orzełka.', f:()=>{const l=[fxL(20), fxM(10), fxH(10)];
     if(chance(50)) l.push(fxK(50000), 'WYGRYWASZ IMŚJ.'); else l.push('Porażka w IMŚJ. Srebro.');
     return l;}},
  {l:'Lubię cyferki - zwłaszcza te na swoim koncie. Wybieram reszkę.', f:()=>{const l=[fxP(20), fxI(-10)];
     if(chance(50)) l.push(fxK(5000), fxH(10), 'WYGRYWASZ IMŚJ.'); else l.push('Porażka w IMŚJ. Srebro.');
     return l;}}
 ]},

{id:'potancowka_dohren', t:'POTAŃCÓWKA W DOHREN',
 x:'Potańcówka po zawodach w Dohren. Podbiega do ciebie Niemka i prosi o autograf.',
 o:[
  {l:'Dajesz.', f:()=>[{t:'Losowy transfer', f:(p)=>{p.next.forceClub='any';}}]},
  {l:'Spadaj babo.', f:()=>[]}
 ]},

{id:'regulaminowe_ligi', t:'REGULAMINOWE LIGI',
 x:'Duński promotor prosi cię o przyjazd na jeden mecz swojej ligi masz już podpisane kontrakty w trzech ligach.',
 cond:(p,c,S)=>S.round<=Math.ceil((BAL.rounds||14)/2),
 o:[
  {l:'I tak nie jeżdżę - pakuję busa.', f:()=>[fxK(R(10000,30000)), fxP(-10)]},
  {l:'Nie jadę, przepis to przepis.', f:()=>[fxP(5)]}
 ]},

{id:'countryside_era', t:'COUNTRYSIDE ERA',
 x:'Angielski promotor zarządzający dwoma klubami żużlowymi chce podpisać z Tobą kontrakt. Problem w tym, że musisz wybrać drużynę. Pierwszy klub leży w dobrze skomunikowanym miejscu, skąd bez problemu dostaniesz się na mecze w Polsce. Drugi znajduje się na wsi tak odległej, że każda podróż do Polski może zamienić się w logistyczny koszmar.',
 cond:(p)=>!!(p.leagues && p.leagues.includes && p.leagues.includes('UK')),
 o:[
  {l:'"PIERWSZA OPCJA BRZMI SENSOWNIE" - Biorę pierwszy.', f:()=>[fxP(4), fxOB(-2)]},
  {l:'"A CO MI TAM, JAK SIĘ BAWIĆ TO SIĘ BAWIĆ. PREZES ZROZUMIE"', f:()=>{const l=[fxOB(-5)];
     if(chance(20)) l.push(fxK(R(5000,20000)));
     if(chance(40)){ l.push(fxBan(1), fxL(-30)); }
     l.push('Dopiero po podpisaniu kontraktu odkrywasz, że „niedaleko lotniska” według promotora oznacza trzy godziny samochodem.');
     return l;}}
 ]},

{id:'koszykowka', t:'KOSZYKÓWKA',
 x:'Otrzymujesz niespodziewany telefon od znanego koszykarza Martina Hammera. Okazuje się, że chce spróbować swoich sił jako… agent żużlowy. Hammer przekonuje, że jego sportowe kontakty i umiejętności negocjacyjne wystarczą, aby znaleźć Ci świetny kontrakt. Problem? Nie ma żadnego doświadczenia w żużlu.',
 o:[
  {l:'"A CO TAM. ZAPRASZAM W SKROMNE PROGI"', f:()=>[{t:'Natychmiastowy losowy transfer do klubu 2. Ekstraligi lub KLŻ', f:(p)=>{p.next.forceClub='weak';}}]},
  {l:'"NIE RYZYKUJE"', f:()=>[fxP(5), fxL(5), fxM(-1)]}
 ]},

{id:'trening_topless', t:'TRENING TOPLESS [PATOLOGIA/UŻYWKI]',
 x:'Podczas luźnego wieczoru Twój australijski kolega z drużyny wpada na kolejny „genialny” pomysł. Proponuje Ci nocną jazdę po torze żużlowym, ale jest jeden haczyk — możecie mieć na sobie wyłącznie kaski, buty żużlowe i bokserki. Według niego „prawdziwi Australijczycy nie potrzebują kevlaru”. Wyzwanie brzmi idiotycznie, ale nagranie z przejazdu mogłoby zrobić furorę wśród kibiców.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'"PRZYJMUJE" - Wchodzę w to!', f:()=>[fxM(10), fxL(5), fxP(-10), fxI(15)]},
  {l:'"NIE, TO NIE DLA MNIE"', f:()=>[fxP(5), fxL(-3), fxM(-3), fxI(-5)]},
  {l:'"TA? PA NA TO"', f:()=>{const l=[fxP(-5), fxM(3), fxLongInj('Złamanie nogi/złamanie ręki po ześlizgnięciu z siodełka przy próbie "jaskółki".')];
     if(chance(50)) l.push(fxL(-10)+' — prezes wściekły'); return l;}}
 ]},

{id:'dziecko_w_rodzinie', t:'DZIECKO W RODZINIE',
 x:'Długo czekaliśmy z żoną na dziecko. Ale w końcu się doczekaliśmy! Ale w sumie po co...',
 cond:(p)=>p.age>30,
 o:[
  {l:'Ono jest niepotrzebne, bo mam karierę. W ogóle odchodzę.', f:()=>[fxM(-15), fxAlimony()]},
  {l:'Teraz jesteśmy piękną rodziną.', f:()=>[fxO(5), fxT(3), fxH(10), fxE(20)]}
 ]},

{id:'przeklety_mecz', t:'PRZEKLĘTY MECZ',
 x:'Macie sezon naznaczony tragediami. Jak nie urazy, to dwumecz z Częstochową. W pierwszym meczu wasz utalentowany junior upadł nieszczęśliwie, że zmarł w szpitalu, a zawody przerwano w trosce o jego zdrowie i jeszcze wówczas życie. Druga odsłona nie doszła do skutku, bo trener i inni zawodnicy - jadący jednym samochodem - mieli wypadek. Na szczęście wszyscy przeżyli, choć są dotkliwie poturbowani. Zrozpaczony prezes pyta się co zrobić z tym meczem w Częstochowie.',
 /* WYŁĄCZONE: brak pola przeciwnika w kolejce w przesłanych plikach silnika
    (engine/14 ma tylko S.round/S.matches, nie nazwę rywala). Podeślij
    engine/15-liga-chronologia.js albo engine/09-sezon-przebieg.js, żeby to odblokować. */
 cond:()=>false,
 o:[
  {l:'Tu ciąży jakaś klątwa. Po prostu oddajmy go walkowerem.', f:()=>[fxM(-10), fxP(10), fxI(-10), fxH(10), fxT(3), fxWalk('lose',0)]},
  {l:'Do trzech razy sztuka. Niemniej jedziecie na mecz z księdzem.', f:()=>[fxM(21), fxI(37), fxP(5), fxT(-3), fxH(10), fxA(10)]},
  {l:'Nie wierzę w żadne klątwy. Jedziemy po zwycięstwo.', f:()=>[fxP(10), fxH(10), fxT(-7), fxI(50)]}
 ]},

{id:'lotniczy_wal', t:'LOTNICZY WAŁ',
 x:'Miałeś zawody w Wielkiej Brytanii, które skończyły się bardzo późno. Lot do Polski masz za kilka godzin. Prawdę mówiąc w klubie nie płacą i nie opłaca Ci się jechać na złamanie karku na mecz. Masz możliwość mieć spokój w niedzielę i brak strat finansowych... Działacze wysłali delegację na lotnisko Okęcie, która odbierze ciebie i przetransportuje na mecz.',
 cond:(p)=>_bieda(p),
 o:[
  {l:'Dzwonisz, że miałeś wypadek w czasie meczu i słabo się czujesz.', f:()=>[fxE(10), fxP(-5), fxH(-10), fxBan(R(3,5)), 'Zakazali Ci jazdy tam, gdzie nie trzeba.']},
  {l:'No to se jeszcze poczekają...', f:()=>[fxWalk('lose',0), _clubK(-100000), fxP(-10), fxH(-30), fxA(-10)]},
  {l:'Szukam lotu alternatywnego.', f:()=>[fxK(80000), fxP(15), fxM(15), fxH(10), fxA(10)]}
 ]},

{id:'wypadek_w_lesie', t:'WYPADEK W LESIE',
 x:'Klub ma problem ze złożeniem składu. Zasadniczo od Ciebie zależy czy mecz odjedziecie, czy klub zostanie ukarany walkowerem. W drodze na mecz spotkało Ciebie wielkie szczęście - ktoś wjechał w twojego busa. Możesz wymiksować się z meczu chyba bez żadnych konsekwencji...',
 cond:(p)=>_weak(p) && _bieda(p),
 o:[
  {l:'Informuję, że miałem wypadek, ale nie przesyłam dokumentów.', f:()=>[fxWalk('lose',0), fxH(-80), fxA(-7), _clubK(-100000)]},
  {l:'Informuję, że miałem wypadek, przesyłam potwierdzenie.', f:()=>[fxP(10), fxL(10), fxE(10)]},
  {l:'Tłumaczę się dopiero, jak prezes na mnie krzyczy.', f:()=>[fxP(5), fxM(20), fxH(-80), fxA(-15), fxWalk('lose',0)]}
 ]},

{id:'ruskie_kosztownosci', t:'RUSKIE KOSZTOWNOŚCI',
 x:'Ty i Twój kolega z reprezentacji dostaliście bojowe zadanie reprezentować Polskę na arenie międzynarodowej. FIM wam każe jechać na półfinał Mistrzostw Europy Par do lat 33. Zawody odbywają się w rosyjskim Togliatti. Centrala załatwia wam paszporty. Kolega widzi możliwość dodatkowego zarobku.',
 cond:(p)=>p.age<33,
 o:[
  {l:'Handel złotem, srebrem i dolarami? Mordo jesteś geniuszem.', f:()=>[fxM(30), {t:'Utrata całości budżetu', f:(p)=>{p.budget=0;}},
    fxEnd('Sprytny plan zrodzony w waszych głowach doprowadził do wielogodzinnego przesłuchania, procesu i łagrów na Syberii. Przyznaliście się do wszystkiego - nawet do bycia szpiegami. Może kiedyś wrócicie do kraju...')]},
  {l:'Jedziemy na szrocie, opylamy sprzęt przed zawodami, a sami jemy ogórki kiszone z mlekiem.', f:()=>[fxP(-10), fxM(-10), fxH(10), fxK(70000), fxI(20)]},
  {l:'Ja jadę uczciwie.', f:()=>[fxE(-30), fxK(-150000), fxM(30), fxP(10)]}
 ]},

{id:'pchanie_motocykla', t:'PCHANIE MOTOCYKLA',
 x:'Bieda nie pozwala na inwestycje. Wykluczenia, defekty, nawet mylicie kolory kasków. Mecze jedziecie na trzy motocykle, czasem cztery jak konserwator zabytków zezwoli na pożyczenie sprzętu. Podczas jednego biegu kolega odpadł na trzecim okrążeniu. Tobie maszyna odmówiła posłuszeństwa na początku czwartego okrążenia i wiozłeś nawet rywala! Do przepchania 400m.',
 cond:(p)=>_weak(p) && _bieda(p),
 o:[
  {l:'Oglądałeś Tour de France i słyszysz w głowie "Pchamy, pchamy!"', f:()=>[fxP(10), fxL(10), fxE(10), fxH(10), fxK(50000)]},
  {l:'Za takie pieniądze, zrobię co słuszne. Czyli nic, ale przynajmniej udaję że się staram.', f:()=>[fxI(-5), fxP(-5), fxE(-10), fxL(5)]},
  {l:'Ostentacyjnie zostawiam motocykl na środku toru i wracam pieszo do parku maszyn.', f:()=>[fxI(-10), fxP(-10), fxM(-10), fxE(-10)]}
 ]},

{id:'trening_juniorski', t:'TRENING JUNIORSKI',
 x:'Odbywałeś trening pod okiem trenera. Wymyślił naukę jeżdżenia po dziurach, wyrwach i rynnach. Zadanie jazda przy krawężniku. Trener nadzoruje to zza połowy szerokości toru.',
 cond:(p)=>p.ovr<20 && p.age<21,
 o:[
  {l:'Trzymam krawężnik, najbardziej jak się da.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxBan(R(1,3)), 'Złamana ręka.'];
     if(r<=90) return [fxO(3)];
     G.S.noRenew=true; return [fxO(1), fxT(-6), fxA(-10), 'Brak kontraktu na kolejny sezon od obecnej drużyny.'];}},
  {l:'Próbuje manewrować między dziurami, ale chyba nie mam umiejętności.', f:()=>{G.S.noRenew=true;
     return [fxBan(R(0,1)), 'Skręcona kostka.', fxO(1), fxT(-6), fxA(-10), 'Brak kontraktu na kolejny sezon od obecnej drużyny.'];}},
  {l:'Zamykam gaz. Trener oszalał z tym torem!', f:()=>{G.S.noRenew=true;
     return [fxP(-15), fxL(-10), fxI(10), 'Brak kontraktu na kolejny sezon od obecnej drużyny.'];}}
 ]},

{id:'pomeczowe_pozegnanie', t:'POMECZOWE POŻEGNANIE',
 x:'Po zawodach tradycyjnie wyjechaliście na tor żeby pożegnać się po emocjonujących zawodach i podziękować za doping. W ciągu ułamka sekundy euforię zmącił makabryczny incydent. Czar prysnął i radość zamieniła się w rozpacz. Wjechałeś w...',
 o:[
  {l:'Stojak od taśmy...', f:()=>{if(chance(75)) return [fxBan(R(2,4)), 'Kontuzja obojczyka.'];
     return [fxBan(R(3,7)), 'Kontuzja łopatki.'];}},
  {l:'Dziecko, które uciekło ojcu...', f:()=>[fxBan(R(0,2)), 'Kontuzja: złamany nos.']},
  {l:'W kolegę z drużyny, w jego plecy.', f:()=>{const r=R(1,100);
     if(r<=34) return [fxBan(R(1,3)), 'Złamane ręce i żebra.'];
     if(r<=67) return [fxBan(R(0,2)), fxI(30), 'Wybity bark.'];
     G.S.forcedEnd=true; return ['Złamana miednica. Koniec sezonu.'];}}
 ]},

{id:'toi_toi', t:'TOI-TOI',
 x:'Na stadionie od dłuższego nie przeprowadzono inwestycji. Wieża sędziowska ledwo stoi, a PINB obserwuje sytuację. Sanepid zaś zwraca uwagę na brak toalet na stadionie. W sumie dziwne że macie licencję. Prezes podjął decyzję, że wynajmie przenośne kabiny.',
 cond:(p)=>_weak(p) && _bieda(p),
 o:[
  {l:'Serio? Zawodnicy mniej warci niż toi-toie! Gdzie nasze wypłaty?', f:()=>{G.S.forcedEnd=true; return [fxP(5), 'Zawieszenie do końca sezonu.', fxDef(10)];}},
  {l:'Wiem komu daliście w łapę. Inni mają wiedzieć?', f:()=>[fxM(40), fxH(10), fxA(-7),
    {t:'Dostajesz 50% zaległości klubowych', f:(p)=>{const c=clubOf(p); if(c){const pay=Math.round((c.debt||0)*0.5); c.debt=Math.max(0,c.debt-pay); p.budget+=pay;}}}]},
  {l:'Siedzę cicho, bo jak klub upadnie to nic nie dostanę.', f:()=>[fxI(-10)]}
 ]},

{id:'ognisko', t:'OGNISKO',
 x:'Prezes zaprasza ciebie na ognisko. Niby w klubie bieda, ale powiedział, że ma trochę makulatury i szpargałów, na których spaleniu będzie można zrobić wielkie ognisko. Ale kiełbasa w swoim zakresie.',
 cond:(p)=>_weak(p) && _bieda(p),
 o:[
  {l:'Płonie łęcina i szumi rde-est.', f:()=>{G.S.forcedEnd=true; return ['Echo niesie policyjne syreny. Palicie fakturami.', 'Zawieszenie do końca sezonu.', fxM(-20), fxP(-10), fxI(10)];}},
  {l:'Pachnie wałem. Nie idę.', f:()=>[fxP(15), fxDef(-10), fxI(-10)]}
 ]},

{id:'potrzebna_dotacja', t:'POTRZEBNA DOTACJA',
 x:'Macie problemy finansowe, czasami jedziesz, czasami nie. Prezes płacze ci w ramię i pyta się co ma zrobić, żeby ratować klubowe finanse. Mówi że miasto rozpisuje przetargi dla klubów sportowych ale na jakieś bzdety. Patrzysz w warunki dotacji.',
 cond:(p)=>_bieda(p),
 o:[
  {l:'"Weźcie dotację na usługi informatyczne dla sekcji piłki ręcznej".', f:()=>{
     if(chance(50)) return [{t:'Dostajesz zaległą kasę', f:(p)=>{const c=clubOf(p); if(c){const pay=Math.round((c.debt||0)*0.5); c.debt=Math.max(0,c.debt-pay); p.budget+=pay;}}}, fxA(10), fxL(20)];
     G.S.forcedEnd=true; G.p.banSeasons=1; return ['WIELKIE ZAWIESZENIE.', fxO(-7)];}},
  {l:'Weź kredyt, zmień pracę...', f:()=>{
     if(chance(50)) return [{t:'Dostajesz zaległą kasę', f:(p)=>{const c=clubOf(p); if(c){const pay=Math.round((c.debt||0)*0.5); c.debt=Math.max(0,c.debt-pay); p.budget+=pay;}}}, fxL(-20), fxA(10), fxP(7)];
     return ['Debil wziął chwilówkę, ale nic z tego nie wyszło.', 'Klub trafia pod syndyka.'];}},
  {l:'Ja jeżdżę w kółko za drobne, nie znam się.', f:()=>[fxH(-10), fxDef(10), fxA(10)]}
 ]},

{id:'hotdog', t:'HOTDOG',
 x:'Stałeś ulubieńcem drużyny i nagle zmieniasz na inny zespół? Poprzedni zespół nie jest dłużny i w ramach pożegnania jesteś przedstawiony w Simsach w stroju parówy w hotdogu.',
 cond:(p)=>p.loyalty>55,
 o:[
  {l:'Udostępniam grafikę pożegnalną.', f:()=>[fxM(10), fxP(-5), fxDef(10)]},
  {l:'Udostępniasz mema jako parówa w hotdogu Zmarzliny.', f:()=>[fxM(15), fxP(-5), fxI(-10)]}
 ]},

{id:'sniezyca', t:'ŚNIEŻYCA',
 x:'Pada deszcz, w sumie nawet śnieg. W połowie sezonu... Ale jedziemy. Niestety mamy częste problemy ze sprzętem, a teraz na domiar złego podczas biegu urwał się w goglach eeee dzyndzelek.',
 cond:(p,c,S)=>_weak(p) && (S.extraDefP*100)>50,
 o:[
  {l:'Jadę na pamięć.', f:()=>[fxP(10), fxM(10), fxDef(-20)]},
  {l:'Jadę na słuch.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxBan(R(1,2)), 'Lekki uraz żeber.', fxP(-10), fxM(-15)];
     if(r<=90) return [fxBan(R(2,5)), 'Uraz obojczyka.', fxP(-10), fxM(-25)];
     return [fxBan(R(4,7)), 'Uraz obojczyka i więzadeł.', fxP(-15), fxM(-25)];}},
  {l:'Zjeżdżam na murawę, o ile w nią trafię.', f:()=>[fxP(5), fxM(15), fxDef(5)]}
 ]},

{id:'wizjatv', t:'WIZJATV',
 x:'Zaproszono cię do WizjaTV na ekspertowanie w meczu. Ciągle słyszysz jakieś greckie epopeje i o kieszonkowym duńczyku.',
 cond:(p)=>p.med>60 && p.prof<40,
 o:[
  {l:'Dopasowuję się, wieczorki poetyckie nie pójdą na marne.', f:()=>[fxM(10), fxP(-10), fxK(20000)]},
  {l:'Co on w ogóle gada?', f:()=>[fxM(20), fxP(20), fxK(-10000)]}
 ]},

{id:'anielski_orszak', t:'ANIELSKI ORSZAK',
 x:'Mecz w Grudziądzu to jak zwykle ciekawe duchowe przeżycie. Cmentarz jest 100 metrów stąd. Rywale zaś jadą bardzo agresywnie. Teraz masz bieg na parę Kościecha-Grabarz…',
 /* WYŁĄCZONE — jak przy 'przeklety_mecz': brak pola przeciwnika w kolejce. */
 cond:()=>false,
 o:[
  {l:'O nie, życie mi jeszcze miłe.', f:()=>[fxBan(1), fxFine(20000), fxM(-10), fxP(-20)]},
  {l:'DO DĘBU.', f:()=>{if(chance(10)) return [fxEnd('Anielski orszak uniósł Twoją duszę na nowy poziom.')];
     return [fxI(20), fxO(R(1,5)), fxP(10)];}}
 ]},

{id:'jablonka', t:'JABŁONKA',
 x:'Akurat masz przerwę w startach, bo tak terminarz wypadł. Dziadek prosi ciebie o pomoc w zbiorach jabłek.',
 cond:(p)=>_weak(p),
 o:[
  {l:'Treningowo wspinam się po drzewach.', f:()=>{const r=R(1,100);
     if(r<=34) return [fxBan(R(3,5)), 'Poważny uraz rąk.', fxP(-10), fxM(-10)];
     if(r<=67) return [fxBan(R(0,2)), 'Skręcona kostka.', fxP(-5), fxM(-5), fxO(1)];
     return [fxK(2137), fxO(1), fxP(5)];}},
  {l:'Gardzę drabiną, przestawianie jej to marnowanie czasu.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxBan(R(2,4)), 'Poważna kontuzja rąk i żeber.', fxP(-10), fxM(-10)];
     if(r<=90) return [fxBan(R(4,8)), 'Kontuzja kręgosłupa.', fxP(-30), fxM(-30)];
     return [fxEnd('Najbardziej żałosny koniec kariery. Z powodu jabłek dziadka.')];}},
  {l:'Jeszcze spadnę z drzewa i będzie draka.', f:()=>[fxP(10), fxK(2137)]}
 ]},

{id:'borowka', t:'BORÓWKA',
 x:'Prezes klubu chwali się swoim sukcesami w roli. Mówi, że jeśli mam oszczędności, to powinienem zainwestować w borówkę amerykańską, bo niedługo będzie świetna koniunktura na nią.',
 cond:(p)=>!_weak(p) && p.budget>200000,
 o:[
  {l:'Prezes zawsze ma rację - inwestuję wszystko.', f:()=>[{t:'Tracisz wszystkie pieniądze', f:(p)=>{p.budget=0;}}, fxP(-10)]},
  {l:'Zobaczę, czy temat zażre - inwestuję częściowo.', f:()=>[{t:'-100 000 zł', f:(p)=>{p.budget-=100000;}}, fxP(-5)]},
  {l:'Czytam dużo na ten temat i dopiero decyduję.', f:()=>[fxP(5)]},
  {l:'Dziękuję za tę garść cennych informacji, ale nie jestem rolnikiem.', f:()=>[]}
 ]},

{id:'windykator', t:'WINDYKATOR',
 x:'Kolega z drużyny miał to szczęście że podpisał kontrakt sponsorski i kupił auto. Miał też nieszczęście, bo biznesmen nie płacił. Prosi więc ciebie o pomoc w odebraniu długu.',
 o:[
  {l:'Najpierw negocjujemy.', f:()=>{if(chance(20)) return [fxK(10000), fxP(15), fxA(5)]; return [];}},
  {l:'Może go przestraszymy pałkami? [PATOLOGIA/UŻYWKI]', cond:(p)=>p.prof<40, f:()=>{const r=R(1,100);
     if(r<=50) return [];
     if(r<=75) return [fxK(20000), fxP(7), fxA(10)];
     if(r<=95){ G.S.forcedEnd=true; return [fxA(-10), fxT(-4), fxO(-5), fxK(-25000), fxM(-30), fxP(-40)]; }
     return [fxEnd('Windykacja pałkami poszła fatalnie.'), fxK(-100000), fxM(-75)];}},
  {l:'Plan kolegi ma pewne niedociągnięcia [PATOLOGIA/UŻYWKI]', cond:(p)=>p.prof<40, f:()=>{const r=R(1,100);
     if(r<=10) return [];
     if(r<=25) return [fxK(40000), fxP(7), fxA(10)];
     if(r<=50){ G.S.forcedEnd=true; G.p.banSeasons=1; return ['WIELKIE ZAWIESZENIE.', fxA(-10), fxT(-4), fxO(-7), fxK(-50000), fxM(-40), fxP(-50)]; }
     return [fxEnd('Windykacja poszła fatalnie.'), fxK(-100000), fxM(-75)];}},
  {l:'Po prostu pójdź do komornika.', f:()=>[]}
 ]},

{id:'smieciowe_zloto', t:'ŚMIECIOWE ZŁOTO',
 x:'Ważny sponsor strategiczny Guns N\' Roses Recycling ma problemy finansowe odbijające się na klubie. Wysypisko śmieci nie zwraca się za dobrze. Prezes podchodzi do Ciebie po poradę.',
 cond:(p)=>_weak(p) && _bieda(p),
 o:[
  {l:'Może ubezpieczenie za pożar?', f:()=>{const r=R(1,100);
     if(r<=50) return [_clubK(R(1000000,3000000)), fxM(-10), fxK(20000), fxL(5)];
     if(r<=90){ G.S.forcedEnd=true; return ['Wielkie zawieszenie (ten i kolejny mecz).', fxK(-250000)]; }
     return [fxEnd('Śledztwo w sprawie pożaru na wysypisku dobiega końca kariery.'), fxK(-250000)];}},
  {l:'Znam dobrego księgowego...', f:()=>{const r=R(1,100);
     if(r<=70) return [_clubK(R(1000000,3000000)), fxM(-10), fxK(10000), fxL(5)];
     if(r<=95){ G.S.forcedEnd=true; return ['Wielkie zawieszenie (ten i kolejny mecz).', fxK(-50000)]; }
     return [fxEnd('Księgowe machinacje wychodzą na jaw. Koniec kariery.'), fxK(-50000)];}}
 ]},

{id:'krzeselka', t:'KRZESEŁKA',
 x:'Prezesowi zarzuca się że nie umie prowadzić klubu. Ego nie akceptuje takiego osądu i w czasie spotkania z kibicami stwierdza "Jak się wk... to odkręcę krzesełka na stadionie i zabiorę je, bo są moje". W końcu nie wytrzymał.',
 cond:(p)=>_bieda(p),
 o:[
  {l:'Pomagam mu.', f:()=>[{t:'Brak długu klubu wobec ciebie', f:(p)=>{const c=clubOf(p); if(c) c.debt=0;}}, fxL(-3), fxM(10)]},
  {l:'"Przecież kibice mają rację"', f:()=>{G.S.forcedEnd=true; return ['Koniec sezonu zawodnika.', fxA(4), fxP(10)];}}
 ]},

{id:'elektropepiki', t:'ELEKTROPEPIKI',
 x:'Defekt maszyny po pierwszym biegu zawodów w Czechach. Drugi motocykl został w Polsce. Prezes klubu proponuje nowe cudo z Liberca - elektryczna popierdółka.',
 cond:(p)=>p.ovr<60 || p.age<24,
 o:[
  {l:'Jestem fanem hybrydy.', f:()=>[fxP(6), fxM(10)]},
  {l:'Weź mnie to gówno.', f:()=>[{t:'-10 000 zł', f:(p)=>{p.budget-=10000;}}, fxL(3)]}
 ]},

{id:'rozmowa_na_mlynie', t:'ROZMOWA NA MŁYNIE',
 x:'To co jedziecie jako drużyna to woła o pomstę do nieba. Jazda parą? Chyba jazda paraolimpijska...',
 cond:(p)=>_strongClub(p),
 o:[
  {l:'Kibice, nic się nie stało.', f:()=>[fxP(-10), fxM(-10), fxK(-5000)]},
  {l:'Chyba jednak coś się stało, nie ryzykujmy.', f:()=>[fxK(-20000), fxL(-5), fxI(10)]},
  {l:'Idę rozmawiać z młynowym.', f:()=>[fxT(3), fxO(1), fxL(-5)]}
 ]},

{id:'matematyka', t:'MATEMATYKA',
 x:'Bieg jak bieg. Taśma w górę, tabliczka 2, tabliczka 3, żółta flaga czarny krzyż, żółta flaga czarny krz... Co?',
 cond:(p)=>_weak(p),
 o:[
  {l:'Odpuszczam gaz, przecież to było czwarte okrążenie!', f:()=>[fxP(10), fxM(5), fxH(5)]},
  {l:'Ufam kierownikowi startu.', f:()=>[fxP(15), fxM(-5), fxI(5), fxDef(10)]},
  {l:'Nie patrzyłem na kierownika startu, tylko liczyłem do 4 - chyba umiem liczyć?', f:()=>[fxP(-10), fxM(-10), fxH(-10)]}
 ]},

{id:'van_buuren', t:'VAN BUUREN [PATOLOGIA/UŻYWKI]',
 x:'Przyjaciel Armina van Breugla chce żebyś jeździł u niego w drużynie oferuje 10 000 zł za pkt i 1 000 000 za podpis w klz.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Taka oferta jest raz w życiu!', f:()=>{G.S.noRenew=true; return ['Schizofrenię to się leczy kolego. Brak klubu na kolejny sezon.'];}},
  {l:'Dziękujesz.', f:()=>[]}
 ]},

{id:'polis', t:'POLIS [PATOLOGIA/UŻYWKI]',
 x:'W drużynie pojawił się młodziutki talent. Stanowi zagrożenie dla Twojej pozycji w drużynie.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Biorę go na stronę i sprawdzam ręką jak oddycha.', f:()=>{G.S.forcedEnd=true; G.p.banSeasons=1;
     return ['WIELKIE ZAWIESZENIE: ten i kolejny sezon.', fxO(-7), fxH(-20)];}},
  {l:'Sprawdźmy, czy umie tańce baszkirskie.', f:()=>{const l=[fxH(20)];
     if(chance(25)) l.push('Klub nie przedłuża kontraktu juniorowi.'); return l;}}
 ]},

{id:'barak6', t:'BARAK6 [PATOLOGIA/UŻYWKI]',
 x:'Podejrzanie brzmiący użytkownik "Barack The Sixth" wulgarnie komentuje na X Twój ostatni występ.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Odpisujesz "No pojechałem jak pizda".', f:()=>[fxM(15), fxP(-10), fxH(-10)]},
  {l:'Odpowiadam "Wiem gdzie mieszkasz, wychodź pod żabkę".', f:()=>{if(chance(80)) return [fxM(-20), fxP(-10), fxO(2)];
     return [fxEnd('Mordo ale walczy się na torze nie pod żabką. Chłop złamał Ci rękę i masz teraz niedowład ręki i umysłowy. Może jako fizycznego gdzieś ciebie zatrudnią.')];}}
 ]},

{id:'papierologia', t:'PAPIEROLOGIA',
 x:'Jedziesz w niemieckich zawodach. Potrzebujesz jednego biegu do odnowienia licencji. Organizatorzy mówią, że kończą zawody. Czujesz jak pod nosem przechodzą grube miliony.',
 cond:(p)=>!(p.career && p.career.lastSeasonHeats>0),
 o:[
  {l:'Błagam, jeszcze jeden bieg.', f:()=>[fxP(-6)]},
  {l:'Jadę dalej.', f:()=>{if(chance(50)) return [fxM(20), 'Najlepsza baba na świecie.'];
     return [fxM(10), 'Wicemistrz świata.'];}},
  {l:'Pokaż mi papier.', f:()=>{const l=[{t:'Gwarantowany kontrakt', f:(p)=>{p.next.betterOffers=true;}}];
     if(chance(30)){ if(chance(50)){ G.S.forcedEnd=true; G.p.banSeasons=1; l.push('Wielkie zawieszenie za podrabianie dokumentów, z banem transferowym.'); }
       else { G.S.forcedEnd=true; l.push('Zawieszenie do końca sezonu za podrabianie dokumentów, z banem transferowym.'); } }
     return l;}}
 ]},

{id:'kabelki', t:'KABELKI',
 x:'W czasie zawodów doszło do awarii elektryki. Ogarneliście dzieci żeby tańczyły poloneza podczas kiedy wy walczycie o brak walkowera. Okazuje się że trzeba przeciąć jeden kabelek i wszystko zacznie działać, ale też że coś innego zepsujecie. Który kabel tniesz?',
 cond:(p)=>_weak(p),
 o:[
  {l:'Kabelek 4', f:()=>[fxWalk('lose',0), fxM(-10), fxI(20), fxA(-1)]},
  {l:'Kabelek 2', f:()=>[fxWalk('lose',0), fxM(-7), fxH(5), fxI(-10), fxDef(10)]},
  {l:'Kabelek 5', f:()=>[fxWalk('lose',1), fxM(-20), fxA(-2)]},
  {l:'Kabelek 1', f:()=>{const l=[fxWalk('lose',0), fxM(-20), fxH(-10), fxE(-10)];
     if(chance(15)) l.push(fxBan(R(3,5)), 'Kontuzja słuchu.'); return l;}},
  {l:'Kabelek 3', f:()=>[fxWalk('lose',1), fxM(-7), fxI(21)]}
 ]},

{id:'rozowy_rowerek', t:'RÓŻOWY ROWEREK',
 x:'Przed biegiem rywale czekają już pod taśmą na swoich motocyklach. Koledzy dla jaj podsuwają ci malutki, różowy, trójkołowy rowerek dla dzieci i namawiają, żebyś właśnie na nim wyjechał do próbnego startu.',
 o:[
  {l:'Wyjeżdżasz rowerkiem pod taśmę, stajesz obok kompletnie zdezorientowanych rywali i robisz próbny start.', f:()=>[fxM(15), fxA(15), fxP(-5), fxDef(5)]},
  {l:'Nie wychodzisz z roli wcale, ustawiasz rowerek pod taśmą i na pełnej powadze prosisz kierownika startu o wyrównanie koleiny pod przednim kołem.', f:()=>[fxM(20), fxA(20), fxT(2), fxP(-10)]},
  {l:'Pokazujesz, że rowerek zdefektował. Wobec czego wsiadasz na "niewidzialny motocykl" i robisz całe przygotowania, nawet wkręcając gaz.', f:()=>{const l=[fxM(30), fxA(20), fxT(4), fxP(-15)]; if(chance(5)) l.push(fxBan(R(0,1))); return l;}},
  {l:'Odmawiasz, bierzesz swój prawdziwy motocykl i normalnie jedziesz do próbnego startu.', f:()=>[fxP(15), fxA(-5), fxM(-10), fxH(5), fxDef(10)]}
 ]},

{id:'kierownica_rozkladana', t:'KIEROWNICA ROZKŁADANA',
 x:'Jedziesz pewnie na drugim miejscu i wchodzisz w ostatni łuk. Nagle prowizorycznie zamontowana kierownica zaczyna się rozpadać, a ty masz ułamek sekundy na reakcję.',
 /* WYŁĄCZONE: brak potwierdzonego pola "tuner klubu" w data/05-klasy-kluby-sprzet.js. */
 cond:()=>false,
 o:[
  {l:'"CZAS NA GLEBE"', f:()=>[fxI(5), fxH(-25), fxP(5)]},
  {l:'"TRZYMAM KIERE, TRZEBA DOWIEŹĆ PUNKTY"', f:()=>{if(chance(50)) return [fxH(20)];
     return [fxH(-20), fxI(25), fxM(20), fxP(-5)];}}
 ]},

{id:'pies_spawacz', t:'PIES SPAWACZ',
 x:'Wąsaty gość w czapce pewnego australijskiego żużlowca pyta, czy znasz żart o psie spawaczu.',
 o:[
  {l:'Znam!', f:()=>[fxL(10), fxO(-1)]},
  {l:'Przesada.', f:()=>[fxM(-10)]}
 ]},

{id:'wizyta_komornika', t:'WIZYTA KOMORNIKA',
 x:'W czasie meczu w parku maszyn pojawia się komornik. Okazuje się, że masz spore zaległości finansowe, a jego uwagę natychmiast przykuwa twój świeżo przygotowany motocykl.',
 cond:(p)=>(p.debt||0)>200000 || (_c(p) && (_c(p).debt||0)>200000),
 o:[
  {l:'Dogadujesz się z komornikiem, obiecując spłatę części długu zaraz po otrzymaniu meczówki.', f:()=>[fxP(10), fxA(-5)]},
  {l:'Chowasz motocykl w busie kolegi, a komornikowi wmawiasz, że przyjechałeś dziś tylko popatrzeć.', f:()=>[fxP(-20), fxM(10), fxH(5), fxA(-10)]},
  {l:'"TO PROSZĘ SOBIE BRAĆ", oddajesz komornikowi motocykl, po czym na zawody pożyczasz kompletnie obcy sprzęt od juniora.', f:()=>[fxH(-25), fxO(-5), fxP(-5), fxE(-50), {t:'-100 000 zł', f:(p)=>{p.budget-=100000;}}]}
 ]},

{id:'najt', t:'NAJT',
 x:'Zaczepił Ciebie na X znany twitterowicz Południe.',
 o:[
  {l:'Wyzywasz go żeby wracał do swojego Obi.', f:()=>{const l=[fxM(10)]; if(chance(20)) l.push(fxBan(1)); return l;}},
  {l:'Blokujesz go.', f:()=>[fxP(10), fxH(5)]}
 ]}

];
