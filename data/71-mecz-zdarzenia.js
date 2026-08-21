/* ============================================================
   PATO-ŻUŻEL :: DANE :: ZDARZENIA W TRAKCIE MECZU, WYWIADY, PATO-KOMENTARZE
   Sprint 4 (23.08.2026).
   ------------------------------------------------------------
   Trzy pule, wszystkie czytane przez engine/30b-live-zdarzenia.js:
     LIVE_EVENTS — zdarzenia MIĘDZY BIEGAMI, ze skutkami NA TE ZAWODY
                   (i czasem poza nie). Odpowiednik zdarzeń sezonowych,
                   tylko krótszy i ostrzejszy: skutek widać w następnym biegu.
     LIVE_ITW    — wywiady: przed zawodami, w trakcie i po. Trzy pytania
                   kompletnie z dupy, odpowiedzi ruszają profesjonalizm,
                   medialność albo dyspozycję.
     LIVE_TALK   — pato-komentarze POMECZOWE: osobny plik data/72-glosy-pomeczowe.js.

   JAK PISAĆ SKUTKI ZDARZENIA (`f`):
     f(live, ctx) — `live` to stan zawodów, `ctx` to {p:G.p, S:G.S, say:fn}.
     Wolno ruszać: live.formBonus (siła w kolejnych biegach), live.gearJam
     (blokada zmiany zębatki), live.setupDirty, G.p.*, G.S.*.
     Zwracasz string albo tablicę stringów — to trafia do logu zawodów.
   ============================================================ */

/* --- pomocniki skutków --- */
const fxLiveForm = (live, v) => { live.formBonus=(live.formBonus||0)+v; };
const fxLiveMed  = (p, v) => { p.med=cl(p.med+v,0,99); if(G.S) G.S.bigMed=(G.S.bigMed||0)+v; };
const fxLiveProf = (p, v) => { p.prof=cl(p.prof+v,0,99); if(G.S) G.S.bigProf=(G.S.bigProf||0)+v; };
const fxLiveAtm  = (S, v) => { if(S) S.atm=cl((S.atm==null?50:S.atm)+v,0,100); };

const LIVE_EVENTS = [
 {id:'kibol', t:'KIBIC Z SEKTORA B PRZESKAKUJE PŁOT',
  d:'Facet w klapkach i szaliku przelatuje przez siatkę i biegnie w stronę parku maszyn z twoim nazwiskiem na ustach. Ochrona jest trzy sekundy za nim.',
  opts:[
   {id:'sel', l:'ZRÓB Z NIM SELFIE, ZANIM GO ZŁAPIĄ',
    d:'Kamera to złapie. Wszystko to złapie.',
    f:(live,c)=>{ fxLiveMed(c.p,6); return 'Zdjęcie idzie w świat, zanim ochrona zdąży go zdjąć z betonu. Medialność +6, a spiker mówi o tobie przez dwa biegi.'; }},
   {id:'och', l:'ODDAJ GO OCHRONIE I WRÓĆ DO MOTOCYKLA',
    d:'Nudno. Zawodowo.',
    f:(live,c)=>{ fxLiveProf(c.p,2); return 'Wskazujesz go palcem i wracasz do sprzętu. Kierownik zawodów zapisuje sobie twoje nazwisko po dobrej stronie. Profesjonalizm +2.'; }},
   {id:'bij', l:'PRZYJEBAĆ MU, ZANIM ZDĄŻY POWIEDZIEĆ, CO CHCIAŁ',
    d:'To jest zawsze zły pomysł. Zawsze.',
    f:(live,c)=>{ fxLiveMed(c.p,11); fxLiveProf(c.p,-8);
      const o=['Poszedł na beton razem z szalikiem. Nagranie ma milion wyświetleń przed końcem zawodów. Medialność +11, profesjonalizm -8.'];
      if(chance(45)){ livePitCosts(live,'yellow').forEach(x=>o.push(x)); }
      return o; }}
  ]},

 {id:'polewaczka', t:'POLEWACZKA WJEŻDŻA NA TOR MIĘDZY BIEGAMI',
  d:'Kierownik toru puszcza wodę na drugim łuku, chociaż nikt o to nie prosił. Za dziesięć minut jedziesz.',
  opts:[
   {id:'zmien', l:'BIEGNIJ DO MECHANIKA I ZMIEŃ USTAWIENIA',
    d:'Tor będzie inny. Motocykl powinien też. Ryzyko dwóch minut w pakiecie.',
    f:(live,c)=>{ live.setupDirty=true; live.setupChanges=(live.setupChanges||0)+1;
      live.grip=cl((live.grip==null?2:live.grip)+1,0,5);
      return 'Tor złapał wody. Mechanik rozkłada klucze — od teraz w tym biegu obowiązuje ryzyko spóźnienia pod taśmę.'; }},
   {id:'nic', l:'NIC NIE RUSZAJ, JEDŹ NA TYM, CO MASZ',
    d:'Kto nic nie dotyka, ten zawsze zdąży pod taśmę.',
    f:(live,c)=>{ live.grip=cl((live.grip==null?2:live.grip)+1,0,5);
      return 'Zostawiasz sprzęt w spokoju. Tor zrobił się cięższy, a twój motocykl został ten sam.'; }},
   {id:'wies', l:'IDŹ DO WIEŻY I POWIEDZ, CO O TYM MYŚLISZ',
    d:'Sędzia bardzo lubi takie rozmowy.',
    f:(live,c)=>{ live.grip=cl((live.grip==null?2:live.grip)+1,0,5);
      const o=['Wchodzisz do wieży w kevlarze i tłumaczysz kierownikowi toru, na czym polega polewanie toru.'];
      if(chance(40)) livePitCosts(live,'yellow').forEach(x=>o.push(x));
      else { fxLiveMed(c.p,3); o.push('Sędzia machnął ręką, ale kamera stała pod drzwiami. Medialność +3.'); }
      return o; }}
  ]},

 {id:'esemes', t:'SMS OD NIEZNANEGO NUMERU: „POJEDŹ WOLNIEJ W SWOIM NASTĘPNYM BIEGU"',
  d:'Do wiadomości dopięte zdjęcie twojego busa na parkingu i kwota, która wygląda jak dwie twoje wypłaty.',
  opts:[
   {id:'zgloc', l:'POKAŻ TO KIEROWNIKOWI DRUŻYNY',
    d:'Papier idzie do PZM, ty jedziesz swoje.',
    f:(live,c)=>{ fxLiveProf(c.p,4); return 'Kierownik robi zdjęcie ekranu i dzwoni gdzie trzeba. Profesjonalizm +4, a ty masz przez resztę zawodów spokój w głowie.'; }},
   {id:'skasuj', l:'SKASUJ I NIE MYŚL O TYM',
    d:'Tylko że już o tym myślisz.',
    f:(live,c)=>{ fxLiveForm(live,-1.6); return 'Kasujesz. I przez cały następny bieg zastanawiasz się, kto ma zdjęcie twojego busa. Głowa nie tam, gdzie tor.'; }},
   {id:'odpisz', l:'ODPISZ: „ILE?"',
    d:'To jest ten moment, w którym kariera skręca w bok.',
    f:(live,c)=>{ const kasa=R(18,60)*1000; c.p.budget+=kasa; fxLiveProf(c.p,-10); fxLiveForm(live,-4.5);
      live.ustawka=true;
      return ['Przelew przyszedł przed twoim biegiem. '+zl(kasa)+' na koncie, profesjonalizm -10.',
              'Teraz musisz jeszcze pojechać tak, żeby nikt nie zauważył — a to jest trudniejsze niż wygranie biegu.']; }}
  ]},

 {id:'ojciec', t:'OJCIEC STOI PRZY SIATCE',
  d:'Nie zapowiedział się. Stoi w tej samej kurtce co dziesięć lat temu i patrzy na twój motocykl, nie na ciebie.',
  opts:[
   {id:'idz', l:'PODEJDŹ DO NIEGO',
    d:'Dwie minuty rozmowy albo dwie minuty ciszy.',
    f:(live,c)=>{ if(chance(55)){ fxLiveForm(live,2.6); return 'Powiedział trzy zdania i klepnął cię w kask. Wsiadasz na motocykl lżejszy o dziesięć kilo.'; }
      fxLiveForm(live,-2.2); return 'Powiedział: „no zobaczymy". Wsiadasz na motocykl cięższy o dwadzieścia.'; }},
   {id:'udaj', l:'UDAWAJ, ŻE GO NIE WIDZIAŁEŚ',
    d:'Sprawdzone. Działa. Do wieczora.',
    f:(live,c)=>{ fxLiveForm(live,-0.8); return 'Odwracasz się do skrzynki z narzędziami i patrzysz w nią o cztery sekundy za długo.'; }},
   {id:'kask', l:'PODAJ MU KASK PRZEZ SIATKĘ',
    d:'Bez słowa.',
    f:(live,c)=>{ fxLiveForm(live,3.4); fxLiveMed(c.p,4);
      return 'Wziął kask, obejrzał, oddał i kiwnął głową. Fotograf z portalu złapał to z drugiej strony siatki i to zdjęcie zostanie z tobą na lata.'; }}
  ]},

 {id:'sedzia', t:'SĘDZIA TECHNICZNY CHCE ZWAŻYĆ TWÓJ MOTOCYKL',
  d:'Wskazał palcem akurat ciebie, akurat teraz, akurat przed twoim biegiem.',
  opts:[
   {id:'ok', l:'PROSZĘ BARDZO, WAŻCIE',
    d:'Nie masz nic do ukrycia. Chyba.',
    f:(live,c)=>{ if(chance(12)){ live.setupDirty=true;
        return 'Waga pokazała 1,4 kg za mało. Mechanik dokłada balast w ostatniej chwili — sprzęt ruszony, ryzyko dwóch minut aktywne.'; }
      fxLiveProf(c.p,2); return 'Waga się zgadza co do dekagrama. Sędzia techniczny odchodzi bez słowa. Profesjonalizm +2.'; }},
   {id:'awantura', l:'ZAPYTAJ, CZEMU AKURAT TY',
    d:'Dobre pytanie, zły moment.',
    f:(live,c)=>{ const o=['Pytasz głośno, przy dwóch kamerach, dlaczego ważą tylko zawodników gospodarza.'];
      fxLiveMed(c.p,4);
      if(chance(50)) livePitCosts(live,'yellow').forEach(x=>o.push(x));
      else o.push('Sędzia techniczny udał, że nie słyszał. Medialność +4.');
      return o; }}
  ]},

 {id:'kolega', t:'KOLEGA Z PARY PROSI CIĘ O SILNIK',
  d:'Zatarł drugi w tych zawodach. Ma jeszcze dwa biegi i nie ma czym jechać. Ty masz zapasowy.',
  opts:[
   {id:'daj', l:'DAJ MU SWÓJ ZAPASOWY',
    d:'Drużyna to drużyna.',
    f:(live,c)=>{ fxLiveAtm(c.S,8); c.p.loyalty=cl(c.p.loyalty+4,0,100); live.noSpare=true;
      return 'Oddajesz silnik i zostajesz z jednym. Szatnia to zapamięta — atmosfera +8, lojalność +4. Jak teraz coś strzelisz, jedziesz do domu.'; }},
   {id:'nie', l:'ODMÓW. TO TWÓJ NAJWAŻNIEJSZY MECZ',
    d:'Racjonalnie. Bardzo racjonalnie.',
    f:(live,c)=>{ fxLiveAtm(c.S,-9);
      return 'Mówisz „nie mam". Obaj wiecie, że masz. Atmosfera -9 i cisza w busie w drodze powrotnej.'; }},
   {id:'sprzedaj', l:'ODDAM, ALE ZA POŁOWĘ TWOJEJ STAWKI Z DZISIAJ',
    d:'Interesy to interesy.',
    f:(live,c)=>{ const k=R(6,16)*1000; c.p.budget+=k; fxLiveAtm(c.S,-16); fxLiveProf(c.p,-4);
      return 'Przybiliście piątkę przy busie. '+zl(k)+' do kieszeni, atmosfera -16, profesjonalizm -4, a on opowie o tym całej lidze.'; }}
  ]},

 {id:'prezes', t:'PREZES SCHODZI DO PARKU MASZYN',
  d:'Nigdy tego nie robi w trakcie zawodów. Idzie prosto na ciebie i ma minę człowieka, który właśnie rozmawiał z księgową.',
  opts:[
   {id:'sluch', l:'WYSŁUCHAJ',
    d:'Cokolwiek to jest.',
    f:(live,c)=>{ if(chance(50)){ const k=R(10,40)*1000; c.p.budget+=k;
        return 'Powiedział, że dzisiaj płacą od ręki, jeśli wygracie. Zaliczka: '+zl(k)+'.'; }
      fxLiveForm(live,-1.9);
      return 'Powiedział, że jak przegracie, to „będą rozmowy o kontraktach". Wsiadasz na motocykl z tym zdaniem w kasku.'; }},
   {id:'kasa', l:'ZAPYTAJ O ZALEGŁE PIENIĄDZE. TERAZ.',
    d:'Idealny moment. Idealny.',
    f:(live,c)=>{ if(chance(35)){ const k=R(15,50)*1000; c.p.budget+=k; fxLiveAtm(c.S,-4);
        return 'Przelał z telefonu, stojąc przy bandzie. '+zl(k)+'. Nie odezwał się do ciebie do końca sezonu.'; }
      fxLiveAtm(c.S,-8); c.p.loyalty=cl(c.p.loyalty-6,0,100);
      return 'Powiedział, że „nie czas i nie miejsce", i poszedł. Atmosfera -8, lojalność -6.'; }}
  ]},

 {id:'guma', t:'W PARKU MASZYN LEŻY OBCA OPONA',
  d:'Nowa, w folii, z naklejką rywala z drugiej strony parku. Nikt nie patrzy.',
  opts:[
   {id:'wez', l:'WEŹ',
    d:'Nowa opona to nowa opona.',
    f:(live,c)=>{ if(chance(60)){ fxLiveForm(live,2.2); return 'Założona w cztery minuty. Motocykl wybija z taśmy jak nowy.'; }
      const o=['Mechanik rywala wraca po dwie minuty za wcześnie i patrzy prosto na twoje koło.'];
      fxLiveMed(c.p,5); livePitCosts(live,'yellow').forEach(x=>o.push(x)); return o; }},
   {id:'oddaj', l:'ZANIEŚ MU JĄ',
    d:'Ludzie to zapamiętają. Może.',
    f:(live,c)=>{ fxLiveProf(c.p,3); return 'Zaniosłeś. Podziękował i wyglądał na zaskoczonego bardziej, niż wypada. Profesjonalizm +3.'; }}
  ]},

 {id:'transmisja', t:'REALIZATOR TRANSMISJI PROSI, ŻEBYŚ ZAŁOŻYŁ KAMERĘ NA KASK',
  d:'Trzysta gramów na kasku i cała Polska w twoim pierwszym łuku.',
  opts:[
   {id:'tak', l:'ZAKŁADAJ',
    d:'Medialność w jednym, waga w drugim.',
    f:(live,c)=>{ fxLiveMed(c.p,7); fxLiveForm(live,-0.9);
      return 'Kamera na kasku, trzysta gramów i świadomość, że każdy błąd zobaczą wszyscy. Medialność +7.'; }},
   {id:'nie', l:'ODMÓW',
    d:'Kask jest do jazdy.',
    f:(live,c)=>{ fxLiveMed(c.p,-2); return 'Odmawiasz. Realizator zapisuje sobie coś w notatniku i już cię o nic nie poprosi.'; }}
  ]},

 {id:'buty', t:'PĘKŁ PASEK W BUCIE STARTOWYM',
  d:'Ten but jeździ z tobą od czterech sezonów. Właśnie się skończył.',
  opts:[
   {id:'tasma', l:'OWIŃ TAŚMĄ IZOLACYJNĄ',
    d:'Klasyka polskiego żużla.',
    f:(live,c)=>{ fxLiveForm(live,-0.7); return 'Trzy zwoje czarnej taśmy i jedziemy. Trzyma. Chyba trzyma.'; }},
   {id:'pozycz', l:'POŻYCZ BUTY OD JUNIORA',
    d:'Ma czterdziesty drugi. Ty czterdziesty piąty.',
    f:(live,c)=>{ fxLiveForm(live,-2.4); fxLiveAtm(c.S,3);
      return 'Wcisnąłeś stopę w but o trzy numery za mały. Junior patrzy z podziwem, twoje palce nie.'; }},
   {id:'boso', l:'JEDŹ W ZWYKŁYM BUCIE ROBOCZYM',
    d:'Ojciec by tego nie pochwalił. Ojciec nie odbiera.',
    f:(live,c)=>{ fxLiveForm(live,-1.2); fxLiveMed(c.p,3);
      return 'Wjeżdżasz pod taśmę w bucie z Castoramy. Kamera to pokazuje w zbliżeniu. Medialność +3.'; }}
  ]}
];

/* ============================================================
   WYWIADY
   ------------------------------------------------------------
   `when`: 'pre' (przed zawodami), 'mid' (w trakcie), 'post' (po).
   Każdy wywiad to TRZY pytania losowane z puli danego momentu.
   Odpowiedź: {l, prof, med, form, txt}.
   ============================================================ */
const LIVE_ITW = {
 who:{
  pre :['REPORTER Z MIKROFONEM NA KIJU','DZIENNIKARZ PORTALU','SPIKER ZAWODÓW'],
  mid :['REPORTERKA TRANSMISJI','CHŁOPAK Z KAMERĄ NA RAMIENIU','PODCASTER, KTÓRY SAM SIĘ ZAPROSIŁ'],
  post:['OSTAFIŃSKI','EKSPERT TV','REDAKTOR Z LOKALNEJ GAZETY']
 },
 intro:{
  pre :'Podchodzi do ciebie w parku maszyn na dziesięć minut przed pierwszym biegiem. Mikrofon już jest włączony.',
  mid :'Łapie cię przy busie, między biegami, z kamerą włączoną i czerwoną lampką prosto w twarz.',
  post:'Czeka na ciebie przy wyjściu z parku maszyn. Zawody się skończyły, ale on jeszcze nie.'
 },
 q:{
 pre:[
  {q:'„Czy to prawda, że przed ważnym meczem je pan zawsze to samo śniadanie?"', a:[
   {l:'„Parówki z wody i dwa jajka. Od czterech lat."',  prof:2,  med:3,  form:0,  txt:'Odpowiedziałeś na serio i wyszło z tego trzy akapity o dyscyplinie.'},
   {l:'„Nie jem przed meczem. Wtedy się nie chce wymiotować."', prof:-2, med:6, form:0, txt:'Cytat poszedł w tytule. Redakcja jest zachwycona, dietetyk klubu mniej.'},
   {l:'„Następne pytanie."',                              prof:1,  med:-3, form:0,  txt:'Cisza trwała cztery sekundy i była dłuższa niż odpowiedź.'}
  ]},
  {q:'„Gdyby pana motocykl był zwierzęciem, to jakim?"', a:[
   {l:'„Koniem. Tylko takim, co gryzie."',   prof:0, med:5, form:0, txt:'Portal zrobił z tego mem przed pierwszym biegiem.'},
   {l:'„To jest maszyna, panie redaktorze."',prof:3, med:-2,form:0, txt:'Sucho, zawodowo i kompletnie nieklikalne.'},
   {l:'„Moim teściem. Też nie odpala rano."',prof:-1,med:7, form:0, txt:'Śmiał się nawet operator. Teść ogląda transmisję.'}
  ]},
  {q:'„Kibice pytają, dlaczego nie ma pan konta na portalach społecznościowych."', a:[
   {l:'„Bo bym tam napisał, co myślę."',      prof:-1,med:6, form:0, txt:'To zdanie żyło w internecie dłużej niż całe zawody.'},
   {l:'„Mam. Prowadzi je moja siostra."',      prof:1, med:2, form:0, txt:'Siostra dowiedziała się o tym z transmisji.'},
   {l:'„Nie interesuje mnie to. Interesuje mnie tor."', prof:4, med:-4,form:0, txt:'Trener kiwnął głową zza pleców reportera.'}
  ]},
  {q:'„Czy zawodnik żużlowy powinien mieć drugi zawód?"', a:[
   {l:'„Powinien mieć drugi zawód, trzeci kredyt i czwartą pracę."', prof:0, med:5, form:0, txt:'Śmiech w parku maszyn, cisza w gabinecie prezesa.'},
   {l:'„To jest sport zawodowy. Punkt."',      prof:3, med:0, form:0, txt:'Krótko, po zawodowemu, bez nagłówka.'},
   {l:'„Ja mam. Wożę palety w zimie."',        prof:2, med:4, form:0, txt:'Redaktor zrobił z tego materiał o prawdziwym obliczu ligi.'}
  ]},
  {q:'„Jak pan skomentuje wypowiedź prezesa rywali, że pana klub «nie ma czym jeździć»?"', a:[
   {l:'„Zobaczymy po zawodach."',              prof:3, med:0,  form:1.0, txt:'Spokojnie. Zapamiętałeś to zdanie i wsiadasz z nim na motocykl.'},
   {l:'„Niech najpierw zapłaci swoim zawodnikom."', prof:-2, med:8, form:0, txt:'Awantura gotowa. Dwa portale, jedno sprostowanie i jeden telefon od prezesa.'},
   {l:'„Nie czytam takich rzeczy."',           prof:1, med:-2, form:0, txt:'Skłamałeś i obaj o tym wiecie.'}
  ]}
 ],
 mid:[
  {q:'„Co pan czuje w tej chwili?"', a:[
   {l:'„Że stoję i rozmawiam, zamiast ustawiać motocykl."', prof:0, med:6, form:0, txt:'Odpowiedź poszła na żywo. Reporterka nie wiedziała, co dalej.'},
   {l:'„Skupienie. Nic więcej."',            prof:3, med:-2,form:1.2, txt:'Wróciłeś do sprzętu z głową na miejscu.'},
   {l:'„Zimno mi w ręce."',                  prof:0, med:3, form:0, txt:'Cała Polska dowiedziała się, że w Polsce jest zimno.'}
  ]},
  {q:'„Sędzia dziś wyraźnie faworyzuje gospodarzy. Zgadza się pan?"', a:[
   {l:'„Tak. I wszyscy to widzą."',           prof:-3,med:7, form:0, txt:'Sędzia obejrzał to w przerwie. Sędzia ma dobrą pamięć.'},
   {l:'„Nie oceniam sędziów w trakcie zawodów."', prof:4, med:-1,form:0, txt:'Podręcznikowo. Kierownik drużyny odetchnął.'},
   {l:'„Sędzia jest z Leszna. Więcej nie powiem."', prof:-1,med:9, form:0, txt:'Powiedziałeś dokładnie tyle, żeby wszyscy zrozumieli.'}
  ]},
  {q:'„Czy prawdą jest, że w przerwie jadł pan kiełbasę z bufetu?"', a:[
   {l:'„Dwie."',                              prof:-2,med:8, form:-1.0, txt:'Trafiłeś na czołówkę serwisu sportowego. Żołądek trafił gdzie indziej.'},
   {l:'„To był baton węglowodanowy."',        prof:2, med:0, form:0, txt:'Nikt nie uwierzył, ale nikt nie sprawdzał.'},
   {l:'„A pan by nie zjadł?"',                prof:0, med:5, form:0, txt:'Reporter przyznał, że by zjadł. Materiał zrobił się o nim.'}
  ]},
  {q:'„Widzowie pytają, dlaczego jedzie pan w kasku z naklejką firmy pogrzebowej."', a:[
   {l:'„Bo płacą."',                          prof:0, med:7, form:0, txt:'Najuczciwsza odpowiedź tego wieczoru. Sponsor przedłuży umowę.'},
   {l:'„To sponsor mojego mechanika."',       prof:1, med:2, form:0, txt:'Mechanik dowiedział się o tym z telewizji.'},
   {l:'„Bo to jedyna firma, która wierzy, że tu wrócę."', prof:-1,med:9, form:-0.8, txt:'Zdanie obiegło internet, ale sam też je usłyszałeś.'}
  ]},
  {q:'„Pana rywal powiedział przed chwilą, że jedzie pan «jak listonosz». Odpowie pan?"', a:[
   {l:'„Odpowiem w następnym biegu."',        prof:3, med:4, form:2.0, txt:'Wsiadasz na motocykl z konkretnym powodem. To działa.'},
   {l:'„Listonosz przynajmniej coś dostarcza."', prof:0, med:7, form:0.6, txt:'Sektor B skandował to przez dwa biegi.'},
   {l:'„Kto to powiedział?"',                 prof:1, med:1, form:-0.6, txt:'Powiedzieli ci kto. Teraz myślisz o tym zamiast o torze.'}
  ]}
 ],
 post:[
  {q:'„Czy po takich zawodach da się spać?"', a:[
   {l:'„Da się. Gorzej z wstawaniem."',       prof:0, med:5, form:0, txt:'Cytat zamknął relację z zawodów.'},
   {l:'„Analizuję, wyciągam wnioski, jadę dalej."', prof:4, med:-2,form:0, txt:'Zawodowo. Trener przeczytał i był zadowolony.'},
   {l:'„Nie pana sprawa."',                   prof:-2,med:3, form:0, txt:'Redaktor napisał o tobie akapit, którego nie chciałeś przeczytać.'}
  ]},
  {q:'„Kto jest winny temu, co się dziś działo?"', a:[
   {l:'„Ja. Zawodnik odpowiada za swoje punkty."', prof:5, med:1, form:0, txt:'Szatnia to usłyszała. To się liczy bardziej niż tekst.'},
   {l:'„Tor. Ten tor to jest przestępstwo."', prof:-2,med:7, form:0, txt:'Kierownik toru czyta portale. Kierownik toru ma pamięć.'},
   {l:'„Trener. Nie umiem tego inaczej powiedzieć."', prof:-4,med:10,form:0, txt:'Bomba. W poniedziałek będzie o tym mówić cała liga.'}
  ]},
  {q:'„Za ile pieniędzy pojechałby pan w przyszłym roku w Argentynie?"', a:[
   {l:'„Za bilet w dwie strony i coś do jedzenia."', prof:0, med:5, form:0, txt:'Menedżerowie z trzech krajów zapisali sobie tę wypowiedź.'},
   {l:'„Za tyle, ile mi tu nie płacą."',      prof:-1,med:8, form:0, txt:'Prezes usłyszał to w samochodzie i zawrócił.'},
   {l:'„Nie planuję zim. Zimą śpię."',        prof:2, med:2, form:0, txt:'Najzdrowsza odpowiedź tego wieczoru.'}
  ]},
  {q:'„Czy żużel to jeszcze sport, czy już folklor?"', a:[
   {l:'„Sport. Folklor jest na trybunach i dobrze."', prof:3, med:3, form:0, txt:'Wyważone. Nawet Ostafiński nie miał się o co przyczepić.'},
   {l:'„Folklor. Ale ja z tego żyję."',       prof:-1,med:8, form:0, txt:'Zdanie poszło jako tytuł do wywiadu roku.'},
   {l:'„Zapytajcie kogoś, kto ma zapłacone."',prof:-2,med:9, form:0, txt:'Trzy kluby wydały oświadczenia. Żadne nie dotyczyło ciebie.'}
  ]},
  {q:'„Ostatnie pytanie: co powie pan dziś w domu?"', a:[
   {l:'„Że było ciężko i że jutro trening."', prof:3, med:0, form:0, txt:'Krótko i prawdziwie.'},
   {l:'„Nic. W domu nikt nie pyta."',         prof:0, med:6, form:0, txt:'Reporter opuścił mikrofon. To zdanie zostało w materiale.'},
   {l:'„Że wygrałem. Nie muszą wiedzieć, że jeden bieg."', prof:-1,med:5, form:0, txt:'Śmiech, klepnięcie w ramię i koniec wywiadu.'}
  ]}
 ]
 },
 /* Skutki odmowy — zawsze te same, zawsze ciche. */
 refuse:{
  pre :{prof:1, med:-4, form:0.8, txt:'Machnąłeś ręką i wróciłeś do motocykla. Reporter zapisał: „odmówił".'},
  mid :{prof:2, med:-5, form:1.4, txt:'„Nie teraz." Kamera zostaje na twoich plecach idących w stronę busa.'},
  post:{prof:0, med:-6, form:0,   txt:'Przeszedłeś obok mikrofonu bez słowa. To też jest wypowiedź i wszyscy ją zrozumieli.'}
 }
};

/* Pato-komentarze pomeczowe (LIVE_TALK) siedzą w data/72-glosy-pomeczowe.js —
   ten plik dobijał do 25 KB. */
