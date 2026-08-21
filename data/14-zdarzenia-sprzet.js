/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA SEZONOWE :: SPRZĘT, MECHANICY, TUNERZY
   Pula "EV_SPRZET" — trafia do EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 1167-1225 oryginału).
   ============================================================ */
const EV_SPRZET = [
/* ===== SPRZĘT, MECHANICY, TUNERZY ===== */
{id:'tuninggor', t:'WIZYTA U LOKALNEGO „TUNING-GÓRA” W STODOLE',
 x:'Stodoła, tokarka z 1974 roku, kalendarz z 2009 i człowiek, który mówi o cylindrze „ja to czuję palcem”. Proponuje eksperymentalny szlif.',
 o:[
  {l:'Zgadzam się.', f:()=>{ if(chance(80)) return ['Na drugim kółku silnik zrobił dziurę w karterze.', fxE(-20), fxDef(10)];
     return ['CUD. Silnik wytrzymał i jedzie jak nowy.', fxE(10)];}},
  {l:'Pozostaję przy silnikach od babci.', f:()=>['Wychodzisz ze stodoły z całym karterem.']}
 ]},
{id:'zlom', t:'TWÓJ SILNIK TO JUŻ EKSPONAT',
 x:()=>'Sprzęt na poziomie '+G.p.equip+'/99. Mechanik rywala zagląda pod plandekę, robi zdjęcie i wysyła na grupę z podpisem: „on tym jeździ w tym roku?”.',
 cond:(p)=>p.equip<=18,
 o:[
  {l:'Biorę pożyczkę i kupuję silnik.', f:()=>[fxK(-40000), fxE(20), fxP(5)]},
  {l:'Jeżdżę dalej złomem.',            f:()=>[fxDef(5), fxM(5)+' — internet pokochał ten silnik']}
 ]},
{id:'kradziez', t:'SKRADZIONO CI SILNIKI SPOD HOTELU',
 x:'Bus stoi otwarty, plandeka pocięta, w środku pusto. Recepcjonistka mówi, że „monitoring działa tylko od frontu”. Do meczu cztery dni.',
 o:[
  {l:'Zgłaszam policji.', f:()=>[fxE(-20)+' — jedziesz na rezerwowym złomie', fxP(5)]},
  {l:'Kupuję na szybko używane z czarnego rynku.', f:()=>[fxK(-50000), fxE(-10), fxDef(5)]}
 ]},
{id:'mechsen', t:'MECHANIK ZASNĄŁ W BUSIE Z PAPIEROSEM',
 x:'Obudził go dopiero swąd tapicerki. Bus ocalał, plandeka nie. Mechanik twierdzi, że „to był wypadek przy pracy” i że zna GM-y jak własną kieszeń.',
 cond:(p)=>p.mech>10,
 o:[
  {l:'Zwalniam go na miejscu.', f:()=>{const q=R(10,25);G.p.mech=q;G.p.mechName='Przypadkowy człowiek z parku maszyn';
     return [fxK(-10000)+' odprawy', 'Nowy mechanik ma jakość '+q+'.', fxP(5)];}},
  {l:'Zostawiam, bo zna się na GM-ach.', f:()=>[fxDef(5), fxM(5)]}
 ]},
{id:'mechanik_oferta', t:'MECHANIK DOSTAJE OFERTĘ ZE SPARTY',
 x:()=>'Twój mechanik (jakość '+G.p.mech+') dostał telefon z bogatego klubu, który płaci dużo więcej. Stoi z telefonem w ręce i wymownie na ciebie patrzy.',
 cond:(p)=>p.mech>=60,
 o:[
  {l:'Przebijam ofertę.', f:()=>{G.p.mech=cl(G.p.mech+4,1,99);return [fxK(-50000), 'Mechanik zostaje, jakość +4.', fxL(5)];}},
  {l:'Niech jedzie, znajdę innego.', f:()=>{const q=R(20,40);G.p.mech=q;G.p.mechName='Zastępstwo z ogłoszenia';
     return [fxK(10000)+' oszczędności', 'Nowy mechanik z ogłoszenia: jakość '+q+'.'];}}
 ]},
{id:'slaczka', t:'BUS PADA W DRODZE Z DEBRECZYNA',
 x:'Skrzynia biegów wysiadła pod Debreczynem, a mecz o trzecie miejsce jest za 14 godzin. Janusz Ślączka podjeżdża lawetą: „wskakuj na pakę, ale motocykli nie zabieramy”.',
 o:[
  {l:'Dawaj na pakę.',      f:()=>[fxP(10), fxM(5), fxFit(30)+' (pożyczony sprzęt)', fxI(10)]},
  {l:'Dziękuję, postoję na poboczu.', f:()=>[fxFine(20000)+' regulaminowej', fxM(-10)]}
 ]},
{id:'forma_zycia', t:'NAJLEPSZA FORMA W KARIERZE',
 x:()=>'Zeszły sezon skończyłeś ze średnią '+(G.history[G.history.length-1]||{avgTxt:'—'}).avgTxt+'. Trzy kluby dzwonią, tunerzy dają sprzęt za darmo w zamian za bycie słupem reklamowym.',
 cond:()=>G.history.length>0 && G.history[G.history.length-1].avg>=1.9,
 o:[
  {l:'Biorę darmowy sprzęt za obklejenie kevlaru.', f:()=>[fxE(20), fxM(-5)+' — wyglądasz jak choinka']},
  {l:'Płacę za swoje i nic nikomu nie wiszę.',      f:()=>[fxK(-100000), fxE(20), fxP(8)]}
 ]},
{id:'masc', t:'MAŚĆ Z NORWEGII',
 x:'Rune z Norwegii proponuje ci specjalną maść na mięśnie. Etykieta jest po norwesku, a zapach czuć przez zamknięty słoik.',
 o:[
  {l:'Smaruj bengaja.', f:()=>{ if(chance(50)) return [fxI(20)+' (skurcz w najgorszym momencie)'];
     G.p.contract.rate=Math.round(G.p.contract.rate*0.85);
     return ['Zapominasz polskiego na trzy dni.', 'Stawka za punkt na kontrakcie spada o 15%.', fxO(-2)];}},
  {l:'Nie smaruję.', f:()=>[fxO(1), fxP(5)]}
 ]},
 
];
