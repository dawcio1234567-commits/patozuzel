/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: IMPREZY, KOBIETY, ŻYCIE POZA TOREM
   Pula "EV_ZYCIE" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 920-1003 oryginału).
   ============================================================ */
const EV_ZYCIE = [
/* ===== IMPREZY, KOBIETY, ŻYCIE POZA TOREM ===== */
{id:'kac', t:'MECZ NA KACU',
 x:'Przyjeżdżasz na mecz z gigantycznym kacem po sobotniej imprezie. Drużyna jedzie o wejście do play-off, a ty widzisz dwa pierwsze łuki.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Jadę z kacem, ale nie zawodzę kolegów.', f:()=>[fxP(-7), fxA(3), fxI(10)]},
  {l:'Mówię prezesowi, żeby jechał za mnie mój mechanik.', f:()=>[fxP(-7), fxA(-7), fxBan(1)]}
 ]},
{id:'impreza_rywal', t:'IMPREZA U RYWALA',
 x:'Balujesz w klubie na imprezie sponsora rywala, z którym jutro jedziesz ważne spotkanie. Przy barze stoi ich kierownik drużyny.',
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Zmywam się szybciej, niż zakładałem.', f:()=>[fxP(-2), 'W spotkaniu jedziesz normalnie.']},
  {l:'Baluję do końca.', f:()=>[fxP(-7), fxA(-7), fxBan(1)+' — kierownik rywali doniósł w dniu meczu']}
 ]},
{id:'policja', t:'UCIECZKA PO IMPREZIE',
 x:'Imprezowałeś w Werandzie i jedziesz do domu odpocząć. Na obwodnicy łapie cię policja, a ty masz w busie motocykl żużlowy.',
 o:[
  {l:'Proponuję magiczną sztuczkę na motocyklu żużlowym — jak wyjdzie, puszczą mnie.', f:()=>{
     const r=R(1,100);
     if(r<=20) return ['Policjanci obejrzeli, pokiwali głowami i kazali jechać do domu.','Nic się nie stało. Tym razem.'];
     if(r<=80){G.S.forcedEnd=true;return ['Zero meczów do końca sezonu.', fxM(-10), fxP(-8)];}
     G.p.banSeasons=1;G.S.forcedEnd=true;return ['POTĘŻNE ZAWIESZENIE: nie jedziesz do końca tego i przez cały kolejny sezon.', fxM(-15), fxP(-15)];}},
  {l:'Przez znajomego senatora zamiatam sprawę pod dywan.', f:()=>{const k=Math.round(Math.max(0,G.p.budget)*0.5);
     return [fxK(-k)+' na „koszty obsługi sprawy”', fxP(-5)];}}
 ]},
{id:'gps', t:'GPS OD PARTNERKI',
 x:'Twoja partnerka montuje ci potajemnie GPS w busie. Dowiadujesz się o tym od mechanika, który znalazł kabelek pod fotelem.',
 o:[
  {l:'Jeżdżę dalej, gdzie jeżdżę.', f:()=>[fxP(-3), fxOB(1)+' (regeneracja, powiedzmy)']},
  {l:'Przestaję korzystać z usług pań do towarzystwa.', f:()=>[fxP(7), fxA(-7), fxI(12)+' (spięcie i brak snu)']},
  {l:'Zakuwam ją w kajdanki i przymocowuję do kaloryfera.', f:()=>[fxM(12), fxA(-7), fxBan(1)+' — musisz się tłumaczyć na komisariacie']}
 ]},
{id:'podryw', t:'PODRYW NA IMPREZIE KLUBOWEJ',
 x:'Podczas imprezy klubowej podrywają cię piękne panie. Na barze stoją „jogurty topless” od sponsora, prezes patrzy z drugiego końca sali i nie wygląda na zachwyconego.',
 o:[
  {l:'Wybieram reporterkę z telewizji.', f:()=>[fxA(1)]},
  {l:'Wybieram nieznaną szarą myszkę.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxO(2)+' (spokój i ciepła kolacja)', fxP(3)];
     if(r<=90) return [fxA(1)];
     if(r<=98) return ['Nic ciekawego z tego nie wyszło.'];
     return [fxEnd('gigantyczny przypał i ucieczka z kraju')];}},
  {l:'Wybieram plastikową.', f:()=>{ if(chance(50)) return [fxA(-1), fxI(5), fxO(R(-2,2))];
     return [fxM(-3), fxA(2), fxO(1)];}},
  {l:'Pytam kolegi, gdzie poznał żonę, i idę do tego przybytku.', f:()=>[fxP(3), fxI(-5), fxA(-3)]},
  {l:'Mówię im, że preferuję stringi mojej babci.', f:()=>[fxM(3), fxP(3), fxA(1)]}
 ]},
{id:'weranda', t:'WERANDA Z LEGENDĄ',
 x:'Masz wolny weekend. Mechanik proponuje dodatkową sesję treningową, ale Marek Cieślak dzwoni, że wieczorem zbiera się ekipa w Werandzie i raczej nie planują wracać wcześnie.',
 o:[
  {l:'Jadę na dodatkowy trening.', f:()=>{ if(chance(50)) return [fxO(1)+' (sto wyjazdów z taśmy)']; return [fxP(7)];}},
  {l:'Impreza z Cieślakiem do 3 rano brzmi lepiej.', f:()=>[fxM(7), fxA(8), fxP(-5)]}
 ]},
{id:'daugavpils', t:'WIECZÓR W DAUGAVPILS',
 x:'Pojechałeś na GP do Daugavpils i nie masz co robić wieczorem. Kolega z parkingu pokazuje palcem na bar po drugiej stronie ulicy.',
 o:[
  {l:'Wypiję piwko.', f:()=>{ if(chance(85)) return ['Jedno piwo, dwie godziny rozmów o sprzęcie.', fxO(2)+' (głowa wreszcie odpoczęła)'];
     return ['Nagranie z baru trafiło do sieci.', fxBan(2)];}},
  {l:'Idę spać.', f:()=>[fxP(10)]}
 ]},
{id:'qubus', t:'OFERTA Z ZIELONEJ GÓRY (QUBUS)',
 x:'Klub z Zielonej Góry zaprasza cię na darmowy pobyt w hotelu Qubus. Pokój z widokiem, siłownia w cenie.',
 o:[
  {l:'Korzystam z gościnności i ćwiczę na siłowni.', f:()=>{ if(chance(85)) return [fxO(2)+' (trzy dni porządnej pracy)'];
     if(chance(35)) return ['Widzisz klamkę. Potem szpital.',
                            fxLongInj('złamana kość udowa — sztyft, sześć miesięcy o kulach')];
     G.S.forcedEnd=true;return ['Widzisz klamkę. Potem szpital.','Koniec sezonu.'];}},
  {l:'Nigdzie nie jadę.', f:()=>['Zostajesz w domu. Nic się nie dzieje.']}
 ]},
{id:'hel', t:'OFERTA OD MISTRZA',
 x:'Bartek Zmarzlik proponuje ci wspólne wciąganie helu na zapleczu parku maszyn. Balony ma własne.',
 cond:(p)=>p.ovr>75,
 o:[
  {l:'„Haha, piszczałka”.', f:()=>{ if(chance(50)) return [fxP(7)]; return ['Mistrz uznał, że jesteś nudny. Nic się nie zmienia.'];}},
  {l:'(zgoda)', f:()=>{ if(chance(50)) return [fxI(15)+' w najbliższym spotkaniu']; return ['Śmiechu było na dwa dni. Skutków brak.'];}}
 ]},
{id:'gollob', t:'POJEDYNEK WE ŚNIE Z GOLLOBEM',
 x:'Śni ci się, że jedziesz w parze z Tomaszem Gollobem. Wychodzicie spod taśmy na podwójne prowadzenie, ale Gollob zostawia ci przy krawężniku podejrzanie dużo miejsca.',
 o:[
  {l:'Wchodzę pod Golloba.', f:()=>{ if(chance(30)) return [fxO(1)+' (sen czasem uczy)'];
     return ['Upadek. Budzisz się na podłodze obok łóżka.', fxI(5)];}},
  {l:'Trzymam swoją pozycję.', f:()=>[fxP(3)]}
 ]},
 
];
