/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Plebiscyty, dorabianie, treningi na lodzie
   Pula "WEV_POZA_TOREM" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2402-2496 oryginału).
   ============================================================ */
const WEV_POZA_TOREM = [
{id:'plebiscyt', t:'LOKALNY PLEBISCYT',
 x:'Na gali "Sportowiec Roku" przegrywasz statuetkę z młotem. Znaczy się z gościem co rzuca młotem. Masz już promile we krwi, a gość śmieje się w swej mowie z tego że jeździsz na motorynce, a on zdobywa medale olimpijskie.',
 o:[
  {l:'Wchodzisz na scenę i robisz dym przed kamerami.', f:()=>[fxM(40), fxP(-30)]},
  {l:'Klaszczesz grzecznie i idziesz topić smutki w wódce.', f:()=>[fxP(5), fxO(-2)]}
 ]},
{id:'kradziez_busa', t:'UKRADZIONY BUS W WOŁOMINIE',
 x:'W lutym dowiadujesz się, że Twój klubowy bus z częściami odnalazł się na dziupli w Wołominie.',
 o:[
  {l:'Płacę złodziejom okup pod stołem.', f:()=>{return [{t:'-40 000 zł, ale sprzęt wraca', f:(p)=>p.budget-=40000}, fxE(15)];}},
  {l:'Liczę na sprawność polskiej policji.', f:()=>[fxE(-40)+' (Policja zabezpieczyła sprzęt jako dowód do 2030 roku)']}]
 },
{id:'reklama_lokalna', t:'LOKALNA REKLAMA W TV',
 x:'Znajomy prosi o nagranie (w kevlarze!) taniej reklamy lokalnego salonu glazury i terakoty.',
 o:[
  {l:'Nagrywam z uśmiechem, kasa to kasa.', f:()=>{return [fxM(-10), {t:'+8 000 zł wpadło', f:(p)=>p.budget+=8000}];}},
  {l:'Odmawiam wstydu.', f:()=>[fxP(10)]}
 ]},
{id:'cross_zima', t:'TRENING NA ZAMARZNIĘTYM CROSSIE',
 x:'Koledzy wyciągają Cię na zamarznięty tor motocrossowy. Opony ślizgają się jak na szkle.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Idę pełnym gazem, muszę czuć prędkość!', f:()=>{
     if(chance(35)) return [fxLongInj('Koszmarny upadek na zlodowaciałej ziemi. Złamana miednica.')]; 
     return [fxO(8)+' (Niesamowite czucie motocykla)'];
  }},
  {l:'Odpuszczam, to igranie ze śmiercią.', f:()=>[fxP(15)]}
 ]},
{id:'dieta_weganska', t:'ZIMOWA ZMIANA DIETY',
 x:'Po obejrzeniu dokumentu na Netflixie zimą przechodzisz na restrykcyjny weganizm.',
 o:[
  {l:'Zostaję przy jedzeniu trawy.', f:()=>[fxO(-8)+' (Brak siły do utrzymania motocykla)', fxM(20)]},
  {l:'Łamię się i wcinam schabowego.', f:()=>[fxO(4), fxP(-5)]}
 ]},
{id:'spor_kibice_zima', t:'SPOTKANIE Z KIBOLAMI',
 x:'Na przedsezonowej prezentacji gniazdowy wytyka Ci słabą formę z zeszłego roku i każe oddać kevlar.',
 o:[
  {l:'Pyskujesz z mikrofonem w ręku.', f:()=>[fxM(35), fxP(-20), fxHN(-25)]},
  {l:'Bierzesz na klatę i obiecujesz poprawę.', f:()=>[fxP(15), fxHN(15)]}
 ]},
{id:'praca_budowa', t:'DORABIANIE NA BUDOWIE',
 x:'Budżet na zimę się nie spina. Idziesz robić na budowie u wujka, żeby opłacić mechaników.',
 o:[
  {l:'Zasuwam z workami cementu.', f:()=>{return [fxO(5)+' (Fizol, kondycja rośnie)', {t:'+12 000 zł zarobku', f:(p)=>p.budget+=12000}, fxM(-15)];}},
  {l:'Wstydzę się, wolę wziąć chwilówkę.', f:()=>{return [{t:'Pętla długów: -25 000 zł na start sezonu', f:(p)=>p.budget-=25000}, fxP(-15)];}}
 ]},
{id:'zmiana_numeru', t:'KŁÓTNIA O NUMER STARTOWY',
 x:'Nowy zimowy hit transferowy Twojego klubu dzwoni i żąda oddania Twojego szczęśliwego numeru startowego.',
 o:[
  {l:'Oddajesz bez walki, dla dobra atmosfery.', f:()=>[fxP(10), fxHN(-10), fxO(-2)]},
  {l:'Stawiasz się i robisz kwas w mediach.', f:()=>[fxP(-15), fxHN(20), fxM(25)]}
 ]},
{id:'narty_z_woda', t:'KULIG ZA BUSEM',
 x:'Grudzień, spadło dużo śniegu. Mechanicy przywiązali starą maskę od Żuka do haka w klubowym busie i robią kulig po polnej drodze.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Wsiadam na maskę, gazu!', f:()=>{
     if(chance(25)) return [fxLongInj('Bus szarpnął, wyleciałeś w drzewo. Uraz kręgosłupa, cały sezon z głowy.')]; 
     return [fxHN(30), fxO(3)];
  }},
  {l:'Nagrywam ich tylko na telefon.', f:()=>[fxM(10), fxP(10)]}
 ]},
{id:'sponsor_wigilia', t:'WIGILIA ZE SPONSOREM',
 x:'Firmowa wigilia u potężnego sponsora klubu. Po kilku głębszych prezes firmy każe Ci śpiewać kolędy na karaoke.',
 o:[
  {l:'Śpiewam fałszując, ale z sercem.', f:()=>{return [fxP(-10), {t:'Prezes dorzuca +20 000 zł do budżetu', f:(p)=>p.budget+=20000}];}},
  {l:'Odmawiam stanowczo.', f:()=>[fxP(15), fxM(-10)]}
 ]},
{id:'testy_na_lodzie', t:'TESTY NA ZAMARZNIĘTYM JEZIORZE',
 x:'Tuner dzwoni, że wymyślił nową krzywkę rozrządu i musisz ją przetestować w lutym na zamarzniętym jeziorze.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Ryzykuję utonięcie i jadę testować.', f:()=>{
     if(chance(20)) return [fxEnd('Lód zarwał się pod motocyklem. Utonąłeś.')]; 
     return [fxE(25)+' (Niesamowita przewaga sprzętowa)'];
  }},
  {l:'Czekam na roztopienie śniegu.', f:()=>[fxP(10), fxE(-10)]}
 ]},
{id:'zablokowany_paszport', t:'ZAGUBIONY PASZPORT',
 x:'Przed wylotem na zgrupowanie do Hiszpanii orientujesz się, że pies pogryzł Twój dowód i paszport.',
 o:[
  {l:'Próbuję przekupić straż graniczną.', f:()=>[fxEnd('Aresztowanie za próbę korupcji. Koniec kariery w hańbie.')]},
  {l:'Zostaję w Polsce i biegam po lesie.', f:()=>[fxP(15), fxO(-4)]}
 ]},
{id:'trening_z_psem', t:'TRENING Z PITBULLEM',
 x:'Dla poprawy refleksu zimą postanawiasz biegać po lesie, uciekając przed agresywnym psem kolegi.',
 cond:(p)=>!injured(p),
 o:[
  {l:'Biegnij Forrest, biegnij!', f:()=>{
     if(chance(40)) return [fxIN(50)+' (Pies Cię dopadł i pogryzł łydkę)']; 
     return [fxO(8)+' (Kondycja jak u maratończyka)'];
  }},
  {l:'Zapisuję się normalnie na siłownię.', f:()=>[fxP(10), fxO(2)]}
 ]},

];
