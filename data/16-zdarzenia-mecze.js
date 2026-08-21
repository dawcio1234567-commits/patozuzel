/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: WIELKIE MECZE, TURNIEJE, PRESJA
   Pula "EV_MECZE" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1305-1493 oryginału).
   ============================================================ */
const EV_MECZE = [
/* ===== WIELKIE MECZE, TURNIEJE, PRESJA ===== */
{id:'rzeszow', t:'PREZESKA: „TOR JEST NIEBEZPIECZNY”',
 x:'Prezeska wykopała z toru kilogram ziemniaków, położyła je na stoliku sędziowskim i mówi, że nawierzchnia przypomina tarkę do sera. Lider właśnie wrócił z kontuzji. Zespół patrzy na ciebie — od twojego głosu zależy, czy jedziemy, czy pakujemy bus.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'To wielka szansa — jedziemy.', f:()=>{G.S.noRenew=true;
     return [fxM(12), fxP(10), fxI(25), 'Klub nie przedłuży z tobą umowy — prezeska zapamiętała.'];}},
  {l:'Wracamy do Rzeszowa.', f:()=>{
     return [fxP(-15), fxM(-15), fxFine(15000)+' z PZM', fxK(-3000)+' na lakierowanie obrzuconego busa',
             fxWalk('lose',0), 'Mecz kończy się wynikiem 0:75.'];}}
 ]},
{id:'rozdzielnia', t:'ROZDZIELNIA PRĄDU',
 x:'Drużyna jedzie fatalny mecz rewanżowy w finale o awans. Od ciebie zależy, czy to spotkanie w ogóle zostanie dokończone.',
 cond:(p,c,S)=>S.round>=14 && !injured(p),
 o:[
  {l:'Mam sprytny plan.',
   sum:'Kto by pomyślał, że siekiera w rozdzielni przerwie mecz.',
   f:()=>{
     return ['Mecz odwołany przy stanie, którego nikt już nie policzy.', fxWalk('void',0), fxM(12), fxP(-10),
             fxBan(3)+' — wydział regulaminowy uznał cię za prowodyra', fxFine(20000)+' za „działanie na szkodę zawodów”'];}},
  {l:'Odjeżdżam mecz do końca.', f:()=>{G.S.teamPts-=2;
     return [fxP(7), 'Brak awansu — rywal był po prostu lepszy.'];}}
 ]},
{id:'baraz', t:'BARAŻ O UTRZYMANIE — POWAŻNE MYŚLI SPADKOWE',
 x:'Szatnia milczy. Lider patrzy w podłogę, junior płacze w rękawicę, a menedżer nagrywa story na Instagram. Ktoś musi coś zrobić.',
 cond:(p,c,S)=>S.round>=14 && !!c && c.ovr<=65 && !injured(p),
 o:[
  {l:'Idziemy biegać i krzyczeć niemiłe słowa o drużynie z Zielonej Góry.', f:()=>[fxT(3), fxHN(10), fxM(10)]},
  {l:'„To, gdzie jeżdżę, jest bez znaczenia…”', f:()=>[fxH(10), fxP(10)]}
 ]},
{id:'spoznienie', t:'SPÓŹNIASZ SIĘ 6 MINUT NA MECZ PÓŁFINAŁOWY',
 x:'Sędzia Lis źle kliknął cyferki w kalkulatorze i przez ciebie jest walkower. Łysy z telewizji już biegnie z mikrofonem.',
 cond:(p,c,S)=>S.round>=14 && !injured(p),
 o:[
  {l:'Płaczę, że to nie moja wina.', f:()=>[fxM(10), fxP(-10), fxWalk('lose',0)],
  },
  {l:'Odmawiam wywiadu przez „problemy żołądkowe”.', f:()=>[fxM(-10), fxFine(10000), fxWalk('lose',0)]}
 ]},
{id:'quad', t:'ŚWIĘTOWANIE NA QUADZIE',
 x:'Po zwycięstwie w pierwszym meczu finałowym atmosfera na stadionie jest znakomita, ale przed wami wciąż rewanż decydujący o awansie.',
 cond:(p,c,S)=>S.round>=14 && !injured(p),
 o:[
  {l:'„HEJ PREZES, SIADAJ NA QUADA!”', f:()=>[fxM(10), fxL(8), fxA(7), fxP(-5), fxT(-1)+' — rywal zmobilizowany na rewanż']},
  {l:'„Spokojnie, jeszcze niczego nie wygraliśmy”.', f:()=>[fxP(8), fxL(5), fxM(-3), fxA(-3)]}
 ]},
{id:'memorial', t:'MEMORIAŁ WIELKIEGO MISTRZA',
 x:'Dostałeś zaproszenie na Memoriał Wielkiego Mistrza. Zawody są obsadzone lepiej niż Grand Prix. To Twoja szansa, ale tor ma być ciężki.',
 cond:(p)=>p.ovr>70,
 o:[
  /* ORZEŁ ALBO RESZKA — dosłownie. 50% szans na +25 OVR, 50% na natychmiastowy
     koniec kariery z konkretnym, wymaganym tekstem na ekranie końcowym.
     fxEnd ustawia p.retired + p.retireReason, a scEnd() (index.html) pokazuje
     tę treść jako powód zakończenia kariery. */
  {l:'Jadę i pokażę co potrafię.', f:()=>{
     const heats=[]; let win=0;
     for(let i=0;i<5;i++){ const pts=R(0,3); win+=pts; heats.push('Bieg '+(i+1)+': '+pts+' pkt'); }
     if(chance(50)){
       return [fxSum('WYGRYWASZ MEMORIAŁ. '+heats.join(' · ')+' — łącznie '+win+' pkt i puchar nad głową.'),
               'WYGRANA MEMORIAŁU W OBSADZIE LEPSZEJ NIŻ GRAND PRIX.',
               fxO(25)+' — jedne zawody, które przestawiły całą karierę',
               fxM(15), fxP(5), fxK(120000)+' nagrody głównej'];
     }
     return [fxSum('Zapomniałeś zapiąć kasku i okazało się że Memoriał był dla Ciebie. Koniec kariery.'),
             fxEnd('Zapomniałeś zapiąć kasku i okazało się że Memoriał był dla Ciebie. Koniec kariery')];}},
  {l:'Nic nie robię.', f:()=>[]}
 ]},
{id:'gpwywiad', t:'WYWIAD O GP CHALLENGE',
 x:'Dziennikarz pyta cię o obsadę tegorocznego GP Challenge. Nagrywa, a przy stoliku obok siedzi jeden z zawodników z tej listy.',
 cond:(p)=>p.ovr>70 && p.med>30,
 o:[
  {l:'Mówię, że obsada jest znakomita.', f:()=>[fxP(10)]},
  {l:'Mówię, że jest niepoważna, i wyśmiewam zawodnika z brzuszkiem.', f:()=>[fxO(-3)+' — klątwa Bombera działa natychmiast', fxM(3)]}
 ]},
{id:'challenge', t:'CHALLENGE I KLĄTWA',
 x:'Jedziesz świetny sezon i dostałeś się do GP Challenge. Zostały trzy tygodnie i mnóstwo pytań o ustawienia.',
 cond:(p)=>p.ovr>=75,
 o:[
  {l:'Zawierzam występ Chrisowi Harrisowi.', f:()=>{const l=[fxP(5), fxO(1)];
     if(chance(70)) l.push(fxH(10)); return l;}},
  {l:'Mówię, że nie mam z kim przegrać, i wyśmiewam każdego ze stawki.', f:()=>{const l=[fxM(3), fxP(-5)];
     if(chance(50)){ l.push(fxI(10)); l.push(fxH(-10)); l.push('Klątwa działa. Zawsze działa.'); }
     return l;}}
 ]},
{id:'gpchallenge', t:'DZIKA KARTA NA GRAND PRIX CHALLENGE',
 x:'Ktoś się wykruszył, ktoś zadzwonił, i nagle masz miejsce w turnieju, o którym marzy pół ligi. Termin koliduje z trzema meczami ligowymi.',
 cond:(p)=>p.ovr>65,
 o:[
  {l:'Jadę. Raz się żyje.',   f:()=>[fxO(2), fxM(10), fxK(-20000)+' kosztów wyjazdu']},
  {l:'Liga jest ważniejsza.', f:()=>[fxP(5), fxH(5)]}
 ]},
{id:'junior_kadra', t:'POWOŁANIE DO KADRY MŁODZIEŻOWEJ',
 x:'Trener kadry chce cię na zgrupowanie, ale termin nachodzi na dwa mecze ligowe, a prezes grozi rozwiązaniem umowy.',
 cond:(p)=>p.age<=21 && p.ovr>=40,
 o:[
  {l:'Jadę na zgrupowanie.', f:()=>[fxO(3), fxM(10), fxBan(2), fxL(-10)]},
  {l:'Zostaję w klubie.',    f:()=>[fxL(10), fxP(5), fxM(-5)]}
 ]},
{id:'australijczyk', t:'KLUB ŚCIĄGA AUSTRALIJCZYKA NA TWOJE MIEJSCE',
 x:'Ma 24 lata, średnią 2.1 w swojej lidze i uśmiech z reklamy pasty do zębów. Menedżer klubu mówi ci o tym w SMS-ie o 23:40.',
 o:[
  {l:'Idę do prezesa na noże.', f:()=>{ if(chance(50)) return ['Prezes się ugiął.', fxH(15)];
     return ['Prezes wysłuchał i nie zmienił nic.', fxH(-25)+' — tracisz miejsce w składzie'];}},
  {l:'Trenuję w ciszy.', f:()=>[fxO(2), fxH(-10)+' w tym sezonie']}
 ]},
{id:'guru', t:'DOŁU OD STATYSTYK',
 x:'Dołu wyliczył w arkuszu, że jesteś najsłabszym startującym zawodnikiem w całej lidze. Wykres jest kolorowy i, niestety, prawdziwy.',
 cond:(p)=>p.prof<40,
 o:[
  {l:'Trenuję starty.', f:()=>[fxO(R(-2,2)), fxP(5)]},
  {l:'Piszę, że dołu to farmazon.', f:()=>{G.p.next.rowPen=true;return [fxM(R(-5,5)), '-15% szans na ofertę od ROW-u Rybnik.'];}}
 ]},
{id:'kompromitacja', t:'„NAJSŁABSZY ZAWODNIK LIGI” — RANKING PORTALU',
 x:()=>'Profesjonalizm '+G.p.prof+'/99. Portal zrobił zestawienie zawodników, którzy najczęściej dotykają taśmy i zawalają starty. Jesteś na podium.',
 cond:(p)=>p.prof<28,
 o:[
  {l:'Zatrudniam trenera od startów.', f:()=>[fxK(-20000), fxP(15)]},
  {l:'„Ale przynajmniej nie mam tyle ostrzeżeń co Musielak”.', f:()=>[fxM(8), fxP(-5)]}
 ]},
{id:'dolufan', t:'KŁÓTNIA Z FANEM DOŁUSTATS',
 x:'Masz passę słabych zawodów i o 1:40 w nocy kłócisz się w internecie z kibicem własnej drużyny. On ma screeny, ty masz argumenty.',
 cond:(p)=>p.form<0,
 o:[
  {l:'Nie ma sensu rozmawiać z trollami, lepiej pójść spać.', f:()=>[fxP(3), fxH(-5), fxA(-1)]},
  {l:'Zakładam się z nim o wynik.', f:()=>['Wygrałeś zakład — kibic piłuje karnet na wizji.', fxO(1), fxM(3), fxA(1)]}
 ]},
{id:'zona', t:'KOLEGA Z ZESPOŁU I TWOJA ŻONA',
 x:'Dowiadujesz się z grupy na WhatsAppie. Ten sam kolega wywozi cię w trzecim biegu na trzecim łuku, przez co tracisz pozycję.',
 o:[
  {l:'Walę go w mordę.', f:()=>[fxM(10), fxP(-10), fxFine(5000), fxBan(1)]},
  {l:'Cosplay Krzyśka Gonciarza.', f:()=>[fxM(-10), fxP(R(-5,5))]},
  {l:'Zostawiam robotę mechanikom.', f:()=>[fxM(5), fxP(-5), fxFit(30)]}
 ]},
{id:'race', t:'RACE NA TRYBUNIE, MECZ PRZERWANY NA 40 MINUT',
 x:'Sektor młodzieżowy odpalił wszystko, co miał. Dym zasłonił drugi łuk, sędzia przerwał zawody, a spiker prosi o spokój głosem człowieka, który wie, że nikt go nie słucha.',
 o:[
  {l:'Idę pod trybunę klaskać.', f:()=>[fxM(10), fxP(-5), fxFine(5000)]},
  {l:'Siedzę w parku maszyn.',   f:()=>[fxP(5), fxM(-5)]}
 ]},
{id:'flaga', t:'KIBICE CHCĄ TWOJEJ FLAGI NA TRYBUNIE',
 x:'Po latach w klubie sektor młodzieżowy zrobił zbiórkę na sektorówkę z twoją podobizną. Wyszedłeś jak Zmarzlina, ale intencja się liczy.',
 cond:(p)=>p.loyalty>=55,
 o:[
  {l:'Wychodzę pod trybunę i dziękuję.', f:()=>[fxM(12), fxL(10), fxH(6)]},
  {l:'Wykorzystuję moment i idę po podwyżkę.', f:()=>[fxRate(1.2), fxL(-10), fxP(-5)]}
 ]},
{id:'swistek', t:'ŚWISTEK W GORZOWIE',
 x:'W parku maszyn podchodzi do ciebie człowiek w kurtce klubowej ze świstkiem A5. „Podpisz tu, to formalność, kwestie regulaminowe”. Nie ma nagłówka, nie ma pieczątki. Jest rubryka „oświadczam, że odmawiam…”.',
 o:[
  {l:'Podpisuję.', f:()=>{
     return [fxFine(10000)+' z PZM', fxM(5)+' (świstek wyciekł do mediów)', fxWalk('both',1),
             'Następny mecz: obustronny walkower, obie drużyny tracą po punkcie.'];}},
  {l:'Nie podpisuję.', f:()=>[fxI(25)+' w najbliższej kolejce', 'Jedziesz na torze, na który nikt nie chciał wyjechać.']}
 ]},
{id:'rempala', t:'DUCH KRYSTIANA REMPAŁY',
 x:'O 3:14 w nocy na parkingu przy stodole materializuje się postać w biało-niebieskim kevlarze. Trzyma biały kask z napisem „RECEPTA NA SUKCES” i chce ci sprzedać patent na lepszą aerodynamikę.',
 o:[
  {l:'Słuchasz go.',     f:()=>{
     const l=[fxO(3)+' — nagle rozumiesz pierwszy łuk', fxI(50)+' (duch nie mówił o hamowaniu)'];
     if(chance(10)) l.push('Patent na aerodynamikę zadziałał. Hamowanie już nie.',
                           fxLongInj('zerwane więzadła i złamane udo po wjechaniu w bandę na pełnym gazie'));
     return l;}},
  {l:'Nie słuchasz go.', f:()=>{const k=R(1000,5000);return ['Odganiasz ducha kaskiem.', fxK(k)+' od producenta kasków za tę reklamę'];}}
 ]},
{id:'jedziemy', t:'JEDZIEMY',
 x:'Bus zapakowany, mechanik przypina ostatnią oponę, ty stoisz z telefonem w ręku. W aplikacji miga powiadomienie: „Gaczorek AI przeanalizował Twój ostatni mecz i ma gotowy setup”. Jedziemy.',
 cond:(p,c,S)=>S.round>0,
 o:[
  /* ALGORYTM JAKO RULETKA: jedno kliknięcie potrafi zrobić z ciebie lidera
     albo złom na kółkach. Przedziały są celowo ogromne — o to w tym chodzi. */
  {l:'Skorzystaj z Gaczorek AI.', f:()=>{
     const dOvr = R(-12,12), dEq = R(-30,30), dFit = R(-25,25), dHeat = R(-20,20);
     const l=[fxOB(dOvr)+' (algorytm przestawił wszystko: przełożenia, sprężynę, kąt główki ramy)',
              fxE(dEq)+' (Gaczorek kazał rozebrać silnik na parkingu)',
              fxH(dHeat)];
     G.S.equipFit = cl(G.S.equipFit - dFit, 0, 100);
     l.push('Dopasowanie sprzętu po ingerencji algorytmu: '+G.S.equipFit+'%');
     if(dOvr>=8)      l.push(fxSum('Algorytm trafił idealnie. Cztery wyjścia spod taśmy jak z podręcznika. Ktoś w parku maszyn pyta, kto ci to ustawił — mówisz, że wujek.'), fxM(10));
     else if(dOvr<=-8)l.push(fxSum('Motocykl jedzie bokiem tam, gdzie powinien jechać przodem. Gaczorek AI napisał potem, że „dane wejściowe były niepełne”.'), fxM(-8), fxP(-5));
     else             l.push(fxSum('Jedziemy. Wyszło mniej więcej tak samo jak zawsze, tylko z większą liczbą wykresów.'));
     if(chance(20)) l.push(fxDef(12)+' — algorytm nie przewidział, że to silnik z 2011 roku');
     return l;}},
  {l:'Ustawiam na czuja, jak dziadek.', f:()=>[fxP(6), 'Bez wykresów, bez aplikacji. Bus rusza o piątej.']}
 ]},
{id:'gaczorek', t:'GACZOREK AI DOSTAJE AKTUALIZACJĘ',
 x:'Nowa wersja pozwala zawodnikom podpytywać o ustawienia sprzętu bezpośrednio z boksu. Regulamin nic o tym nie mówi, bo regulamin nigdy nic nie mówi.',
 o:[
  {l:'Korzystam — ale ktoś kabluje.', f:()=>[fxO(R(-3,3))+' (algorytm to loteria)', fxM(-10), fxP(-10)]},
  {l:'„Sam sobie poradzisz”.', f:()=>['Ustawiasz na czuja, jak dziadek. Nic się nie zmienia.']}
 ]},
];
