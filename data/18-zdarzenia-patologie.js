/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: SĘDZIOWIE, WYSPY, DEWELOPERZY
   Pula "EV_PATOLOGIE" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1725-1838 oryginału).
   ============================================================ */
const EV_PATOLOGIE = [
/* ===== NOWE PATOLOGIE: SĘDZIOWIE, WYSPY, DEWELOPERZY ===== */
{id:'sedzia_nazwisko', t:'SĘDZIA PRZY STOLIKU',
 x:()=>{const j=JUDGES[judgeDraw()];
   return 'Zawody prowadzi sędzia '+j.n+' — '+j.d+'. Przed pierwszym biegiem stoisz przy stoliku sędziowskim '+
          'i już wiesz, że ten wieczór nie skończy się normalnie.';},
 cond:(p,c,S)=>S.round>0,
 o:[
  {l:'Idę do stolika i grzecznie pytam o interpretację.', f:()=>{
     const k=judgeDraw();
     if(k==='palka')    return [fxSum('PAŁKA: „Regulamin, punkt 072, podpunkt 4”. Kevlar bez naszywki, kask bez homologacji, bus zaparkowany 40 cm za linią. Trzy protokoły, jeden wieczór.'),
                                fxFine(6000)+' za trzy uchybienia regulaminowe', fxP(5), fxM(-4)];
     if(k==='wojaczek') return [fxSum('WOJACZEK: obustronny walkower w GNIOŚCIE. Dwie drużyny, zero punktów, jeden protokół i cztery godziny drogi powrotnej.'),
                                fxWalk('both',2), fxP(3), fxM(6)];
     return [fxSum('KOBAK: niesłuszne czerwone światło, a dwie minuty włączone dopiero, gdy stałeś już przy taśmie. W Gnieźnie to podobno standard.'),
             fxOB(-2)+' — jeden bieg oddany za darmo', fxP(4), fxA(-3)];}},
  {l:'Robię awanturę przy stoliku na oczach kamer.', f:()=>{
     const k=judgeDraw(), l=[];
     l.push(fxM(14), fxP(-12), fxFine(8000)+' za zachowanie niesportowe');
     if(k==='wojaczek') l.push(fxWalk('both',2), fxSum('WOJACZEK i tak dał obustronny walkower. Awantura zmieniła tylko to, że masz ją nagraną z trzech kamer.'));
     else if(chance(45)) l.push(fxBan(2), fxSum('Wydział regulaminowy obejrzał nagranie. Sędzia '+JUDGES[k].n+' napisał raport na dwie strony.'));
     else l.push(fxSum('Sędzia '+JUDGES[k].n+' wysłuchał wszystkiego bez mrugnięcia okiem i wrócił do protokołu. Nic z tego nie wynikło.'));
     return l;}},
  {l:'Zaciskam zęby i jadę swoje.', f:()=>[fxP(8), 'Sędzia sędzią, tor torem.']}
 ]},

{id:'krakus_hold', t:'HOŁD DLA KRAKUSA',
 x:'Klub organizuje memoriałowy turniej „Hołd dla Krakusa”. Tor to szrot: koleiny po deszczu, banda wiązana drutem, karetka wypożyczona z ośrodka zdrowia. '+
   'Zaległości klubu wobec zawodników sięgają siedmiu cyfr, a organizator mówi, że „kasa będzie po turnieju”.',
 o:[
  {l:'Odmowa jazdy, byle nie dostać kary na szrocie.', f:()=>[
     fxFine(12000)+' regulaminowej za niestawienie się', fxP(10), fxM(-8),
     fxSum('Nie jedziesz. Dwóch kolegów, którzy pojechali, wróciło z turnieju karetką — tą wypożyczoną z ośrodka zdrowia.')]},
  {l:'Jadę, przecież to hołd.', f:()=>{
     const l=[fxM(10), fxA(6)];
     const r=R(1,100);
     if(r<=45) l.push(fxI(25), fxE(-15), 'Kolein nie dało się objechać. Sprzęt do rozbiórki.');
     else if(r<=75) l.push(fxO(1)+' (jazda po szrocie uczy pokory)', 'Wróciłeś cało. Cudem.');
     else l.push(fxLongInj('złamana miednica po kontakcie z bandą wiązaną drutem'));
     l.push('Organizator obiecał przelew do piątku. Który piątek — nie doprecyzował.');
     l.push(fxSum('Puchar odebrany, hołd oddany, przelewu nie ma. Dług klubu urósł o twoją stawkę.'));
     return l;}}
 ]},

{id:'uk_wycofanie', t:'BRYTYJSKI KLUB SIĘ WYCOFUJE',
 x:'Twój brytyjski klub kończy działalność w połowie sezonu: promotor policzył, że wyścigi psów na tym samym obiekcie są po prostu opłacalne. '+
   'Zamiast zaległej wypłaty dostajesz promotora w cylindrze, który wciska ci fanty: dwa komplety opon, kevlar z 2009 roku i skrzynkę napoju energetycznego bez etykiety.',
 cond:(p)=>p.age>=20,
 o:[
  {l:'Biorę fanty. Brytyjczyk płakał, jak oddawał.', f:()=>[fxP(5), fxM(-10),
     fxSum('Brytyjczyk płakał, jak oddawał. Cylinder zdjął dopiero przy busie.')]},
  {l:'Niech sobie wsadzi ten cylinder w dupę.', f:()=>[fxK(15000)+' zrzutki od brytyjskich kibiców', fxP(-10), fxM(8),
     fxSum('Nagranie z parkingu obiegło wyspiarski internet. Kibice zrobili zbiórkę „for the Polish lad”.')]}
 ]},

{id:'uk_psy', t:'PSY W NEWCASTLE',
 x:'Dzień wcześniej na tym samym owalu odbyły się wyścigi chartów. Tor wygląda, jakby przeszło po nim stado, bo przeszło po nim stado. '+
   'Promotor rozkłada ręce i prosi, żebyś jechał, bo „ludzie już kupili bilety”.',
 cond:(p,c,S)=>S.round>0 && !p.next.noUK,
 o:[
  {l:'Ale to się ślizga!', f:()=>[fxBan(2), fxA(7),
     fxSum('Ślizgało się tak, że w trzecim biegu położyłeś motocykl na prostej. Dwa spotkania oglądasz z boksu, ale szatnia stanęła za tobą murem.')]},
  {l:'No chyba nie, walnięty knurze.', f:()=>{G.p.next.noUK=true;
     return [fxP(-5), fxA(-5),
       'Zerwany kontakt z promotorem — telefonów z Wysp już nie będzie.',
       fxSum('Promotor zdjął słuchawkę tylko po to, żeby ją odłożyć. Na Wyspy w tym sezonie nie wracasz.')];}}
 ]},

{id:'uk_prawo_ulicy', t:'PRAWO ULICY',
 x:'W biegu na brytyjskim torze młody zawodnik gospodarzy wchodzi ci pod koło i zrzuca cię do bandy. Wstajesz, otrzepujesz kevlar, a on stoi przy krawężniku obok swojego ojca, który jest tu kierownikiem drużyny.',
 cond:(p,c,S)=>S.round>0 && !p.next.noUK,
 o:[
  {l:'Spokojna rozmowa po biegu.', f:()=>[fxP(3),
     fxSum('Powiedziałeś mu, co zrobił źle, on przeprosił, ojciec podał rękę. Tyle. Nudne, ale dorosłe.')]},
  {l:'Prawo ulicy — uderzam młodego na oczach ojca.', f:()=>[
     fxP(-20), fxBan(3), fxFine(10000)+' od brytyjskiej federacji', fxM(12), fxA(-8),
     fxSum('Uderzyłeś go przy parkingu, na oczach ojca i trzech kamer telefonów. Prawo ulicy działa w obie strony: wracasz do Polski wcześniej, niż planowałeś.')]}
 ]},

{id:'uk_mistrz', t:'MISTRZ ŚWIATA NA SĄSIEDNIM POLU',
 x:'Losowanie ustawiło cię w biegu obok aktualnego Mistrza Świata, który dorabia w tej lidze na czwartkowych meczach. Trybuny wstały, zanim jeszcze podjechaliście pod taśmę.',
 cond:(p,c,S)=>S.round>0 && !p.next.noUK,
 o:[
  {l:'Zakładam go na starcie.', f:()=>[fxP(5), fxA(7), fxL(10), fxM(8),
     fxSum('Wyszedłeś spod taśmy pierwszy i utrzymałeś to do mety. Mistrz Świata poklepał cię po kasku w parku maszyn.')]},
  {l:'Bawię się z nim na dystansie.', f:()=>[fxK(10000)+' premii od promotora za widowisko', fxM(10), fxA(3),
     fxSum('Cztery okrążenia koło w koło. Promotor przyniósł kopertę jeszcze przed końcem zawodów.')]},
  {l:'Pakuję go w krawężnik.', f:()=>[fxP(-10), fxM(6), fxA(-6),
     'Mistrz Świata upada, ty przejeżdżasz obok bez oglądania się za siebie.',
     fxSum('Mistrz upadł, ty pojechałeś dalej. Jego klub zamknął się po sezonie — podobno sponsor tytularny nie chciał już oglądać takich obrazków.')]}
 ]},

{id:'deweloper_bloki', t:'PREZES, DEWELOPER I PALIWO LOTNICZE',
 x:'Prezes zaprasza cię do biura na zapleczu trybuny. Na stole leży wizualizacja: cztery bloki, parking podziemny i przedszkole dokładnie tam, gdzie teraz jest tor. '+
   'Mówi, że w Coventry i Miszkolcu poszło gładko, i pyta, czy nie podłożyłbyś ognia pod stadion. Paliwo lotnicze już czeka w kanistrach w kotłowni.',
 cond:(p,c)=>!!c,
 o:[
  {l:'Odmawiam i wychodzę z biura.', f:()=>{const l=[fxP(15), fxL(-10)];
     if(chance(35)){ G.S.noRenew=true; l.push('Prezes zapamiętał. Kontraktu nie przedłuży.'); }
     l.push(fxSum('Wyszedłeś, a wizualizacja została na stole. Stadion stoi. Na razie.'));
     return l;}},
  {l:'Zgadzam się. Kanistry same się nie wyleją.', f:()=>{
     const kasa=R(250000,400000);
     const l=[fxK(kasa)+' w gotówce, w reklamówce, bez faktury', fxP(-25), fxM(-15), fxL(-25)];
     const c=clubOf(G.p);
     if(c){ c.bankrupt=true; c.bankruptWhy='Pożar trybuny. Ubezpieczyciel odmówił wypłaty, teren kupił deweloper.'; c.debt=0; }
     G.p.next.forceClub='weak_medium';
     l.push('Stadion płonie w nocy z soboty na niedzielę. Trybuna B nie nadaje się nawet do rozbiórki.',
            'Klub upada. W okienku szukasz nowego pracodawcy.');
     if(chance(25)) l.push(fxSum('Biegli wskazali paliwo lotnicze, monitoring wskazał ciebie, a prezes wskazał adwokata — swojego, nie twojego.'),
                           fxEnd('Biegli wskazali paliwo lotnicze, monitoring wskazał ciebie. Kariera kończy się na sali sądowej.'));
     else l.push(fxSum('Bloki staną za dwa lata. Prezes zapłacił co do złotówki, a ty od tamtej nocy nie znosisz zapachu benzyny.'));
     return l;}}
 ]},

];
