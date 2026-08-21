/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Bale, freak fighty, tatuaże, sylwester
   Pula "WEV_PATOLOGIE" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2269-2401 oryginału).
   ============================================================ */
const WEV_PATOLOGIE = [
{id:'bal_tygodnika', t:'BAL Periodyka',
 x:'Zostałeś zaproszony na Bal Periodyka Żużlowego. Wszyscy są już po kilku głębszych, a prezes lokalnych rywali głośno obraża Cię przy barze.',
 o:[
  {l:'Rzucasz w niego kieliszkiem z wódką.', f:()=>{return [fxM(30), fxP(-30), {t:'Kara od centrali: -20 000 zł', f:(p)=>p.budget-=20000}];}},
  {l:'Ignorujesz i idziesz tańczyć z żoną redaktora.', f:()=>[fxP(15), fxM(10)]}
 ]},
{id:'tuner_zdrada', t:'DRAMAT U TUNERA',
 x:'Jedziesz w lutym odebrać silniki od topowego tunera. Przez okno widzisz, jak pakuje Twoje najlepsze głowice do busa zawodnika z Grand Prix.',
 o:[
  {l:'Robisz awanturę na pół warsztatu.', f:()=>[fxP(-15), fxE(-30)+' (Zemsta tunera: wcisnął Ci szrot)']},
  {l:'Kupujesz mu dobrą whisky i błagasz o cokolwiek.', f:()=>[fxP(10), fxE(15)]}
 ]},
{id:'freak_fight', t:'OFERTA Z FAME MMA',
 x:'Marcin Najman i federacja freak-fightowa proponują Ci walkę w klatce z sędzią, który rok temu wyrzucił Cię w 14. biegu.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Biorę to! Zemsta i pieniądze!', f:()=>{return [fxM(50), fxP(-30), fxIN(40), {t:'Wypłata z PPV: +150 000 zł', f:(p)=>p.budget+=150000}];}},
  {l:'Jestem żużlowcem, nie patusem.', f:()=>[fxP(20), fxM(-10)]}
 ]},
{id:'kalendarz_miesny', t:'KALENDARZ SPONSORA',
 x:'Główny sponsor (zakłady mięsne) wymaga, abyś zimą zapozował nago z pętą kiełbasy śląskiej do klubowego kalendarza.',
 o:[
  {l:'Pozuję, w końcu płacą.', f:()=>{return [fxM(-30), {t:'Premia za wstyd: +15 000 zł', f:(p)=>p.budget+=15000}];}},
  {l:'Odmawiam stanowczo.', f:()=>{return [fxP(10), {t:'Utrata dotacji sponsora: -50 000 zł w kasie klubu', f:(p)=>{const c=clubOf(p); if(c) c.budget-=50000;}}];}}
 ]},
{id:'skoki_zakopane', t:'INTEGRACJA POD KROKWIĄ',
 x:'Prezes zabiera drużynę na integrację do Zakopanego na skoki narciarskie. O 3 w nocy ktoś proponuje zjazd na miednicy z zeskoku.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Zjeżdżam, co może pójść nie tak?', f:()=>{
     if(chance(40)) return [fxLongInj('Uderzenie w bandę przy 80 km/h. Połamane obie nogi.')]; 
     return [fxHN(25), fxO(2)+' (Hart duetu)'];
  }},
  {l:'Pilnuję kolegów, żeby się nie pozabijali.', f:()=>[fxP(15), fxHN(-10)]}
 ]},
{id:'mechanik_spawa', t:'ZDRADA MECHANIKA',
 x:'W styczniu Twój główny mechanik dzwoni, że odchodzi z teamu, bo znalazł lepszą pracę przy spawaniu tłumików w Niemczech.',
 o:[
  {l:'Dajesz mu podwyżkę pod stołem.', f:()=>{return [{t:'-30 000 zł z Twojej kieszeni', f:(p)=>p.budget-=30000}, fxE(15)];}},
  {l:'Niech spierdala, sam sobie ustawię zapłon.', f:()=>[fxE(-30), fxP(-10)]}
 ]},
{id:'wybory_ulotki', t:'KAMPANIA WYBORCZA PREZESA',
 x:'Prezes startuje w lokalnych wyborach na radnego i zmusza drużynę do rozdawania ulotek pod kościołem o 7 rano w niedzielę.',
 o:[
  {l:'Rozdaję z uśmiechem.', f:()=>{return [fxM(-10), {t:'Dobre relacje (Premia +10k)', f:(p)=>p.budget+=10000}];}},
  {l:'Wyrzucam ulotki do śmietnika.', f:()=>[fxP(5), fxM(5), fxHN(-15)]}
 ]},
{id:'garaz_odpalenie', t:'ZIMOWY GŁÓD METANOLU',
 x:'Nie możesz wytrzymać do wiosny. W lutym odpalasz motocykl w garażu podziemnym w swoim bloku.',
 o:[
  {l:'Gaz do dechy, niech sąsiedzi czują rycynę!', f:()=>{return [fxP(-20), fxM(15), {t:'Mandat i pozew: -5 000 zł', f:(p)=>p.budget-=5000}];}},
  {l:'Rozsądek wygrywa, gaszę.', f:()=>[fxP(10)]}
 ]},
{id:'szaman_klub', t:'ENERGO-TERAPEUTA W KLUBIE',
 x:'Klub zatrudnia bioenergoterapeutę. Każe Ci zimą pić wodę ładowaną przez telewizor i nosić miedziane wkładki w butach.',
 o:[
  {l:'Piję, jeśli ma pomóc na starty.', f:()=>{
     if(chance(30)) return [fxO(5)+' (To placebo, ale działa)']; 
     return [fxP(-15), fxO(-5)+' (Zatrucie pokarmowe przed sezonem)'];
  }},
  {l:'Wyśmiewam szamana na forum publicznym.', f:()=>[fxP(10), fxHN(-10)]}
 ]},
{id:'tatuaz_herb', t:'PIJANY TATUAŻ',
 x:'Po noworocznej imprezie robisz sobie wielki tatuaż z herbem obecnego klubu na całych plecach.',
 o:[
  {l:'Dumnie pokazuję na Instagramie.', f:()=>{return [{t:'Blokada transferu! (Zostajesz w klubie na ten rok)', f:(p)=>p.next.forceClub='current'}, fxM(30)];}},
  {l:'Usuwam laserowo w bolesnej tajemnicy.', f:()=>{return [{t:'-15 000 zł za zabiegi laserowe', f:(p)=>p.budget-=15000}, fxIN(15)];}}
 ]},
{id:'esport_speedway', t:'TURNIEJ E-SPORTOWY',
 x:'Zima się dłuży, więc bierzesz udział w oficjalnym turnieju e-sportowym w Speedway Challenge.',
 o:[
  {l:'Gram na poważnie, skupienie na 100%.', f:()=>[fxM(15), fxP(5)]},
  {l:'Wkurzam się na lagi i rozbijam klawiaturę na streamie.', f:()=>[fxM(25), fxP(-20)]}
 ]},
{id:'ksm_zmiana', t:'AFERA Z KSM',
 x:'W połowie lutego GKSŻ niespodziewanie wprowadza KSM (Kalkulowana Średnia Meczowa). Twój współczynnik absolutnie nie pasuje do wizji drużyny.',
 o:[
  {l:'Piszę pismo z błaganiem o status zastępstwa.', f:()=>[fxM(-10), fxP(-10)]},
  {l:'No to będę trzaskać komplety gdzie indziej', f:()=>{return [{t:'Wymuszony transfer na słabszy klub', f:(p)=>p.next.forceClub='weak'}, fxP(10)];}}
 ]},
{id:'sylwester_petarda', t:'SYLWESTER Z MOŹDZIERZEM',
 x:'O północy kolega daje Ci do odpalenia ogromną, chińską petardę bez żadnego atestu.',
 o:[
  {l:'Odpalam, raz się żyje!', f:()=>{
     if(chance(30)) return [fxEnd('Petarda wybuchła w dłoni. Uraz amputacyjny. Koniec kariery.')]; 
     return [fxM(5), fxO(2)];
  }},
  {l:'Nie ruszam tego gówna, chronię ręce.', f:()=>[fxP(15), fxIN(-10)]}
 ]},
{id:'morsowanie', t:'ZIMOWE MORSOWANIE',
 x:'Prezes umawia drużynę na modne morsowanie w lokalnym jeziorze, żeby zbudować charakter.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Wchodzę do przerębla z uśmiechem.', f:()=>[fxHN(15), fxO(2)]},
  {l:'Zostaję na brzegu w kurtce.', f:()=>[fxHN(-15), fxP(-5)]}
 ]},
{id:'silnik_puzle', t:'ZABAWA W TUNERA',
 x:'Z nudów rozkręciłeś swój najlepszy silnik wyścigowy na dywanie w salonie, ale zapomniałeś, jak złożyć rozrząd.',
 o:[
  {l:'Składam na czuja. Metoda prób i błędów.', f:()=>{
     if(chance(50)) return [fxE(-40)+' (Silnik wybuchł na pierwszej próbie toru)']; 
     return [fxE(15)+' (Odkryłeś nową krzywą mocy)'];
  }},
  {l:'Wiozę części w kartonie po butach do mechanika.', f:()=>[fxP(-10), fxE(5)]}
 ]},
{id:'reality_show', t:'OFERTA Z TELEWIZJI',
 x:'Dostajesz propozycję z telewizji. Chcą Cię w nowym sezonie "Rolnik szuka żony", bo masz kawałek pola pod miastem.',
 o:[
  {l:'Biorę udział, darmowa promocja.', f:()=>[fxM(60), fxP(-30)]},
  {l:'Odmawiam robienia z siebie pośmiewiska.', f:()=>[fxP(20)]}
 ]},
{id:'auto_sponsora', t:'ROZBITE AUTO SPONSORA',
 x:'Na ośnieżonej drodze wpadasz w poślizg i kasujesz wypożyczone luksusowe auto od klubowego sponsora.',
 o:[
  {l:'Dzwonię na policję i się przyznaję.', f:()=>{return [fxP(10), {t:'-50 000 zł za szkodę', f:(p)=>p.budget-=50000}];}},
  {l:'Uciekam z miejsca zdarzenia.', f:()=>{
     if(chance(70)) return [fxEnd('Nagranie z monitoringu trafiło do sieci. Skandal, więzienie, koniec kariery.')]; 
     return [fxM(10)+' (Cudem Ci upiekło)'];
  }}
 ]},
{id:'oboz_survival', t:'SURVIVAL W BIESZCZADACH',
 x:'Prezes organizuje zimowy obóz survivalowy w Bieszczadach. Zero telefonów, spanie w szałasie i jedzenie kory.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Przechodzę to i wracam twardszy.', f:()=>[fxO(5), fxHN(20), fxIN(10)]},
  {l:'Uciekam w nocy do pensjonatu z ciepłą wodą.', f:()=>[fxP(-15), fxHN(-20)]}
 ]},
{id:'swiecenie_motocykli', t:'ŚWIĘCENIE SPRZĘTU',
 x:'W marcu prezes zaprasza lokalnego proboszcza na święcenie motocykli. Ksiądz polewa je obficie wodą święconą prosto po gaźnikach.',
 o:[
  {l:'Pozwalasz mu lać.', f:()=>[fxE(-20)+' (Woda zalała gaźnik)', fxP(5)]},
  {l:'Zasłaniasz motocykl własnym ciałem.', f:()=>[fxM(15), fxE(10)]}
 ]},
];
