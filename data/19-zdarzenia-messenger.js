/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: SET Z „MESSENGERA" — surowy ton 1:1
   Pula "EV_MESSENGER" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1839-2053 oryginału).
   ============================================================ */
const EV_MESSENGER = [
/* ===== DOPISKA: SET ZDARZEŃ Z „MESSENGERA" — zachowany surowy, patologiczny ton 1:1.
   Każda opcja liczy skutki i mutuje G.p / G.S BEZPOŚREDNIO przed return, oddając
   wyłącznie tablicę stringów i gotowych helperów fx* — bez deskryptorów {t,f},
   żeby rubryka EFEKTY nigdy nie pokazała [object Object]. ===== */

{id:'plot_awantura', t:'AWANTURA O PŁOT',
 x:'Twój rywal ciągle zamykał ci płot. Za każdym razem było niebezpiecznie.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Żadne fair play - będziemy się prać',
   f:()=>{ if(chance(50)) return ['Jakby to były freak fighty to byś zarobił...', fxBan(R(0,1)), fxM(30)];
     return ['Tym razem rywal okazał się twardszy.', fxBan(R(1,3)), fxI(10), fxM(10)]; }},
  {l:'Dzwonię do sędziego „Wjechał we mnie! Przepraszam za słownictwo. Wywiózł mnie w płot. Gdzie miałem jechać?”',
   f:()=>['Tylko telefon na wieżyczkę ukoi Twe nerwy.', fxM(10), fxP(5), fxH(5)]}
 ]},

{id:'kryterium_jopkow', t:'KRYTERIUM JOPKÓW',
 x:'Podczas Kryterium Jopków doszło do karambolu w drugim łuku. Dla ciebie skończyło się wyłącznie na strachu i nie ma przeszkód do dalszej jazdy. Do czasu powtórki. Okazało się, że zapomniano zrobić ci rutynowe badania. Z tego powodu zostajesz wykluczony. To kolejna kontrowersyjna decyzja sędziego Wojaka wymierzona w ciebie.',
 cond:(p,c,S)=>S.round>0 && S.round<5,
 o:[
  {l:'W ramach protestu zostaję na torze, a nawet się na nim kładę',
   f:()=>['Powstają memy Rejtan. Upadek żużla.', fxM(10), fxP(-5), fxBan(R(0,2))]},
  {l:'W parku maszyn oceniam pracę sędziego „Normalnie, motyla noga, polski cwaniaczek…”',
   f:()=>['Kibice klaskają, geje tańczą poloneza bez sędziego.', fxM(5), fxP(-15), fxBan(R(1,4))]},
  {l:'Skrzyknąłem swoich wiernych fanów o blokadę wieżyczki',
   f:()=>['Hehe, potrzebna eskorta dla eskorty.', fxM(5), fxP(-5), fxH(-10), fxBan(R(0,2))]}
 ]},

{id:'wsparcie_rodziny', t:'WSPARCIE Z RODZINY',
 x:'Znajoma żużlowa rodzina zaprasza ciebie na wspólne spędzanie czasu i wzmacnianie się przed zawodami. Z kim spędzasz czas i jaką metodę rozwoju wybierasz:',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Ojciec rodu „fifteen shots, fifteen points”',
   f:()=>{const l=['Pradawna polska technika — szanowana przez trenera.', fxO(R(0,3)), fxI(10), fxH(15)];
     if(chance(30)) l.push(fxBan(R(2,5)));
     return l;}},
  {l:'Syn „Kroplówka robi kap kap”',
   f:()=>{const l=['Można było robić gorsze rzeczy dożylnie.', fxO(R(0,2)), fxI(-10)];
     if(chance(10)){ G.p.banSeasons=1; G.S.forcedEnd=true; l.push('KONIEC SEZONU I CAŁY KOLEJNY ROK POZA TOREM.'); }
     return l;}},
  {l:'Bratanek „Proszek działa dobrze na ciało, gorzej na zęby”',
   f:()=>{const l=['Może chłop w szufladzie ma pół Meksyku, za to tylko połowę zębów.', fxO(6), fxP(-15)];
     if(chance(50)){ G.p.banSeasons=1; G.S.forcedEnd=true; l.push('KONIEC SEZONU I ZAWIESZENIE NA CAŁY KOLEJNY SEZON.'); }
     return l;}}
 ]},

{id:'bezpieczenstwo_ruchu', t:'BEZPIECZEŃSTWO RUCHU',
 x:'Trenerem twojej drużyny został ekspert od bezpieczeństwa ruchu drogowego (chce robić program na ŻTV o bezpieczeństwie ruchu na żużlu). Na treningach każe wam robić plac manewrowy i uczy jeździć „partnersko”.',
 cond:(p,c)=>!!c && !injured(p),
 o:[
  {l:'Chłonę jego wiedzę',
   f:()=>{ G.p.form=cl((G.p.form||0)-10,-12,12);
     return ['Plac manewrowy zamiast startów — koledzy nazywają cię już „kursantem”.', fxP(10), '-10 pkt dyspozycji', fxT(-7), fxI(-100)+' (twardy dolny próg ryzyka i tak zostaje 2%)']; }},
  {l:'Jadę szybko, ale bezpiecznie',
   f:()=>{ const r=R(1,100);
     if(r<=10) return [fxEnd('Wypadek na „placu manewrowym” trenera od bezpieczeństwa ruchu. Kariera się kończy.')];
     if(r<=55) return ['Trener wylatuje z zespołu — nikt już nie chce chodzić na kursy prawa jazdy zamiast na trening.', fxA(5)];
     G.S.noRenew=true;
     return ['Siedzisz na ławie do końca sezonu. Drużyna nie podpisuje z tobą nowego kontraktu.', fxH(-80)]; }}
 ]},

{id:'alkomat_dmpj', t:'OKNO ŻYCIA — ALKOMAT',
 x:'Masz problemy z kontrolą motocykla w trakcie DMPJtów. Sędzia zawodów, widząc twoje „popisy”, uznaje, że musisz być pod wpływem alkoholu, dlatego wzywa policję, aby zbadać twoją trzeźwość alkomatem.',
 cond:(p)=>p.age<=21 && p.ovr<40 && p.prof<40 && !injured(p),
 o:[
  {l:'Dmucham, nie mając nic do zarzucenia',
   f:()=>['Dmuchasz w alkomat, który pokazuje 0,0 promila.', fxP(2), fxH(-1)]},
  {l:'„Ja nic nie piłem, nie potrzebuję testu”',
   f:()=>{ G.S.forcedEnd=true; G.S.noRenew=true;
     return ['Odrzucasz test alkomatem, co oznacza, że jednak coś piłeś.', 'ZAWIESZENIE NA CAŁY SEZON.', fxP(-5), 'Klub rozwiązuje z tobą kontrakt.']; }}
 ]},

{id:'braki_kadrowe', t:'BRAKI KADROWE',
 x:'Właściciel klubu na zebraniu przyznaje się, że w drużynie brakuje osób na etacie mechanika klubowego oraz kierownika drużyny. Chce, abyś ty przejął obowiązki na tym etacie.',
 cond:(p,c,S)=>!!c && appearanceChance(p,c,S.atm,S)<10,
 o:[
  {l:'No chyba kogoś z metanolem pogięło',
   f:()=>{ G.S.forcedEnd=true; return ['Odrzucasz propozycję.', fxH(-20), fxP(5), 'Do końca sezonu nie jedziesz ani jednego spotkania.']; }},
  {l:'Mogę spróbować',
   f:()=>['Podejmujesz rolę mechanika klubowego oraz prezesa klubu w jednej osobie.', fxP(-10), fxO(-3), fxH(15)]}
 ]},

{id:'oszustwo_sprzet', t:'OSZUSTWO SPRZĘT',
 x:'Trwa obchód przed ważnym meczem ligowym. Wszyscy Twoi rywale i ich mechanicy wyszli na tor, pozostawiając sprzęt bez nadzoru. Szczęście i modlitwa to może być za mało na rywala. Potrzeba przewagi technologicznej. Proponujesz:',
 cond:(p,c,S)=>S.round>0 && !injured(p),
 o:[
  {l:'wyciągnięcie beczki wzmocnionego etanolu',
   f:()=>{ const l=['Nie pytam, czym i jak zostało to ochrzczone — ważne, że motocykl frunie.', fxT(6), fxA(3), fxO(1)];
     if(chance(40)) l.push(fxBan(R(2,4)));
     return l;}},
  {l:'dosypanie do baków rywali cukru',
   f:()=>{ const l=['Ugotowaliśmy słodkie zwycięstwa.', fxT(4), fxA(3)];
     if(chance(20)) l.push(fxBan(R(0,2)));
     return l;}},
  {l:'jedna śrubka = miesiąc wódka',
   f:()=>{ const l=['Pana tu, pana tam, zwycięstwu zmierza ku nam.', fxT(2), fxA(3)];
     if(chance(10)) l.push(fxBan(R(0,1)));
     return l;}}
 ]},

{id:'dziurawy_czestochowa', t:'DZIURAWY TOR CZĘSTOCHOWA',
 x:'Kierownik drużyny narzeka, że drużyna nie ma atutu toru. Pyta się Ciebie, co można zrobić z tym fantem.',
 cond:(p,c)=>!!c && !!p.club && p.club.includes('Częstochowa'),
 o:[
  {l:'Tu trzeba trenować',
   f:()=>['Daliście z siebie wszystko, ale najpewniej znowu to będzie za mało.', fxP(10), fxO(1), fxH(10)]},
  {l:'Kopa po klejnotach, że widać tylko skaczące kaski',
   f:()=>['Na pobliskiej budowie nie ma tylu dziur co w tym kartoflisku.', fxT(3), fxH(10), fxI(30), fxBan(R(0,1))]},
  {l:'Kilka ton glinki by się przydało',
   f:()=>{ G.S.noRenew=true;
     const l=['Wysypanie glinki przed ulewą nie było najinteligentniejszym pomysłem… Może kiedyś się zwiąże.',
               fxT(6), fxO(1), fxBan(R(2,4)), 'Brak oferty w oknie transferowym od Częstochowy.'];
     if(chance(30)) l.push('WALKOWER 40:0 — mecz odwołany przez stan toru.', fxWalk('lose',0));
     return l;}}
 ]},

{id:'drzewo_grudziadz', t:'DRZEWO GRUDZIĄDZ',
 x:'Jedziesz w Grudziądzu i masz przed sobą słynny dąb na 2 łuku. Co robisz?',
 cond:(p,c)=>!!c && !!p.club && p.club.includes('Grudziądz') && !injured(p),
 o:[
  {l:'Dąb przynosi szczęście, pakuję się w niego z impetem',
   f:()=>['Jedziesz po szerokiej tak, że dziki byłyby dumne.', fxO(2), fxI(40)]},
  {l:'Kolega Pludra pokazał, jak omijać i poszerzać rywalowi',
   f:()=>['Kasujesz rywala ścinką z krawężnika na zewnętrzną.', fxP(-10), fxM(10), fxA(-5)]}
 ]},

{id:'ostatni_luk', t:'OSTATNI ŁUK DYLEMAT',
 x:'Wchodzisz w pierwszy łuk i widzisz ogromną lukę przy krawężniku. Problem w tym, że motocykl zaczyna wyciągać cię na zewnętrzną, a przed tobą jedzie cała trójka rywali. Co robisz?',
 cond:(p,c,S)=>S.round>0 && !injured(p),
 o:[
  {l:'Zamykasz gaz, odpuszczasz atak i próbujesz ustabilizować motocykl',
   f:()=>['Stabilizujesz motocykl, ale z łuku wyjeżdżasz ostatni.', fxP(10), fxH(-5), fxA(3)]},
  {l:'„Jakoś się zmieszczę”',
   f:()=>['Nie zamykasz gazu i wciskasz się po krawężniku. Udaje ci się wyprzedzić jednego żużlowca, na drugiego brakuje siły.', fxH(10), fxP(-5), fxI(10)]},
  {l:'Pełna dzida, odkręcasz gaz do końca i liczysz, że motocykl sam znajdzie przyczepność',
   f:()=>['Motocykl znajduje przyczepność, a ty wyprzedzasz całą czwórkę na jednym wirażu — video z akcji robi furorę na X.', fxH(25), fxI(20), fxM(15), fxO(1)]},
  {l:'„ALBO WSZYSCY, ALBO NIKT”',
   f:()=>{ const l=['Wywozi ciebie na zewnętrzną i niekontrolowanie kasujesz wszystkich zawodników z toru. Akcja robi się absolutnym viralem w polskim internecie.',
                     fxP(-30), fxM(30), fxA(-25), fxI(30)];
     if(chance(10)) l.push(fxBan(R(0,1)));
     return l;}}
 ]},

{id:'atmosfera_torun', t:'ZŁA ATMOSFERA TORUŃ',
 x:'Od jakiegoś czasu są problemy z atmosferą i równą formą w zespole. Dostałeś bojowe zadanie ogarnięcia problemu.',
 cond:(p,c,S)=>{ if(injured(p)) return false; if(!c || !p.club || p.club.includes('Toruń')) return false;
   const top3 = G.leagues[p.lk].clubs.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,3).some(x=>x.name===c.name);
   return !top3; },
 o:[
  {l:'Wyjdźmy wszyscy na rower',
   f:()=>['Urządzacie wyścigi rowerowe wokół miasta.', fxT(2), fxO(1), fxA(3), fxI(5)]},
  {l:'Ściągam psychoterapeutkę',
   f:()=>['Jeny, ileż można bawić się piłkami.', fxT(2), fxO(1), fxA(6)]},
  {l:'Kupuję na bazarze WIAROZOL INTENSE©',
   f:()=>['WIARA WIARA JEST W NAS, MISTRZ POLSKI NADSZEDŁ CZAS.', fxT(5), fxO(2), fxA(1)]}
 ]},

{id:'bus_policja_lodz', t:'BUS, POLICJA, ŁÓDŹ',
 x:'Rozbijasz klubowego busa na ulicach Łodzi. Masz na pokładzie więcej osób, niż pozwala dowód rejestracyjny, więc każesz nadprogramowym pasażerom spadać, a policjantów przekonujesz, żeby papierologię dokończyć po meczu. Na stadion docierasz w eskorcie radiowozu, a za chwilę masz pierwszy bieg.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Jedziesz jak gdyby nigdy nic',
   f:()=>{ const l=['Wychodzisz do prezentacji prosto z radiowozu.', fxM(25), fxP(-15), fxA(-10)];
     if(chance(5)) l.push(fxBan(R(0,1)));
     return l;}},
  {l:'Przyznajesz się do wszystkiego',
   f:()=>['Przepraszasz policjantów i klub, po czym skupiasz się na zawodach.', fxP(2), fxM(8), fxA(5), fxK(-10000)]},
  {l:'„PANOWIE, PO MECZU!”',
   f:()=>{ const l=['Zostawiasz policjantów pod stadionem i pędzisz prosto pod taśmę.', fxM(20), fxP(-20), fxK(-2500)+' mandatu', fxA(-5)];
     if(chance(25)) l.push(fxBan(R(1,2)));
     return l;}},
  {l:'Pełna koncentracja na meczu — mimo całego zamieszania wyjeżdżasz do pierwszego biegu',
   f:()=>{ G.S.noRenew=true;
     const inj=pick(['złamana ręka','złamana noga']);
     const l=['Zaliczasz dzwon, który kończy się złamaniem — '+inj+'.', fxH(-30), fxO(-5), fxM(15), fxA(-15), 'Klub rozwiązuje z tobą kontrakt.'];
     if(chance(35)){ G.S.forcedEnd=true; l.push('KONIEC SEZONU.'); }
     return l;}}
 ]},

{id:'rzucanie_pieniedzmi', t:'RZUCANIE PIENIĘDZMI',
 x:'Klub od dłuższego czasu ma problemy z płynnością finansową. Dodatkowo jedziecie teraz ważny mecz. Poszło ci bardzo słabo. Kibice zarzucają, że zostałeś przekupiony. Ostentacyjnie rzucają w ciebie pieniędzmi.',
 cond:(p,c)=>p.budget<20000 && (!c || c.budget<200000),
 o:[
  {l:'Tak być nie może…',
   f:()=>{ G.p.budget+=21.37; return ['Nie można zmarnować tych pieniędzy, więc zaczynasz je zbierać.', '+21,37 zł', fxM(-20), fxH(-5)]; }},
  {l:'Dostałem tyle samo pieniędzy, co nasz klub zapłacił…',
   f:()=>['A klub prawie wcale nie płaci — taki problem.', fxM(-10), fxH(-15), fxBan(R(0,1)), fxA(-3)]}
 ]},

{id:'magazyn_ekstraligi', t:'MAGAZYN EKSTRALIGI',
 x:'Dostajesz zaproszenie do Magazynu Ekstraligi, a w niej jednym z gości obok ciebie ma być Kristoff Pustacki, który jest wielkim zwolennikiem polskiego juniora.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Potulnie zgadzasz się ze wszystkimi jego słowami',
   f:()=>[fxM(-5), fxP(5)]},
  {l:'Wykłócam się z ekspertem, twierdząc, że zagraniczny junior jest lepszy',
   f:()=>{ const l=[fxM(25), fxP(-5)];
     if(chance(5)){ G.S.noRenew=true; l.push('Nakablował na ciebie do klubu — kontrakt rozwiązany.'); }
     return l;}}
 ]},

{id:'walka_w_bagnie', t:'WALKA W BAGNIE',
 x:'Co prawda my chcemy „noł”, a sędzia „kaman”, to jednak wizja zawieszeń zmotywowała nas do jazdy. Bagno takie, że jedno wirażowego wcięło na amen. No ale jedziemy… Jeden z rywali strasznie nadstawia koło, żeby Ciebie oszprycować.',
 cond:(p,c,S)=>S.round>0 && !injured(p),
 o:[
  {l:'Próbuję jechać jeszcze węziej, może krawężnik odda',
   f:()=>['Pojechałeś jak łajza po tej nieszczęsnej kredzie i nic nie wskórałeś.', fxP(-5), fxM(-10), fxK(-5000)]},
  {l:'Zdejmuję gogle, bo nie mam zrywek, ale desperacko atakuję po szerokiej',
   f:()=>['Pierwszy na mecie, pierwszy u okulisty, a to nie są tanie rzeczy…', fxL(5), fxI(10), fxK(-20000), fxP(7), fxM(15), fxO(1)]},
  {l:'Nie ma sensu jechać dalej i zbierać błota',
   f:()=>['Jednym prostym trikiem masz mniej do czyszczenia, ale kibice tego nie doceniają.', fxP(-15), fxL(-3)]},
  {l:'Uprzejmie pokazuję po biegu, jaką szprycę mi dawał',
   f:()=>['Sędzia wątpi, że zrzucenie rywala z motocykla to szczyt uprzejmości — daje czerwoną kartkę.', fxK(-7000), fxH(-5), fxBan(R(1,2))]}
 ]},

];
