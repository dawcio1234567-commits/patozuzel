/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA ZIMOWE :: Te same zdarzenia co latem, w wersji zimowej
   Pula "WEV_UNIWERSALNE" — trafia do WINTER_EVENTS przez data/40-zdarzenia-index.js.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2575-2644 oryginału).
   ============================================================ */
const WEV_UNIWERSALNE = [
/* ============================================================
   ZDARZENIA UNIWERSALNE — TA SAMA SYTUACJA, WERSJA ZIMOWA
   Te same zdarzenia zostają też w EVENTS (pula letnia). Tutaj mają
   sufiks `_w` w id (historia losowań jest wspólna po id w obrębie puli),
   zimowy opis i modyfikatory międzysezonowe zamiast sezonowych.
   ============================================================ */
{id:'nagrania_w', t:'WYCIEK PRYWATNYCH NAGRAŃ (MIĘDZYSEZONIE)',
 x:'Sylwester, trzecia nad ranem, czyjś telefon. Rano w sieci wiszą nagrania, na których śpiewasz „Eniułej, eniułej”, „Słodko-słodka” i „Nie ma mocnych na Mariolę”. Do pierwszego meczu cztery miesiące, do pierwszego mema — cztery minuty.',
 w:3,
 o:[
  {l:'Skoro wyciekło, to jadę z tym dalej!', f:()=>[fxM(15), fxP(-5), fxHN(-5)+' — trener obejrzał to przed podpisaniem składu']},
  {l:'Obracam w żart, ale nowych filmików nie będzie.', f:()=>[fxM(7), fxP(3)]},
  {l:'Usuwajcie to natychmiast!', f:()=>[fxP(7), fxM(-7), 'Prawnik wziął zaliczkę i tyle go widziałeś.']}
 ]},

{id:'podryw_w', t:'PODRYW NA BALU KLUBOWYM',
 x:'Zimowy bal klubowy. Podrywają cię piękne panie, na barze stoją „jogurty topless” od sponsora, a prezes patrzy z drugiego końca sali i nie wygląda na zachwyconego.',
 w:3,
 o:[
  {l:'Wybieram reporterkę z telewizji.', f:()=>[fxM(6), fxP(-3)]},
  {l:'Wybieram nieznaną szarą myszkę.', f:()=>{const r=R(1,100);
     if(r<=60) return [fxO(2)+' (spokojna zima i ciepła kolacja)', fxP(3)];
     if(r<=90) return ['Zima zleciała spokojnie.'];
     if(r<=98) return ['Nic ciekawego z tego nie wyszło.'];
     return [fxEnd('gigantyczny przypał i ucieczka z kraju')];}},
  {l:'Wybieram plastikową.', f:()=>{ if(chance(50)) return [fxIN(5), fxO(R(-2,2))];
     return [fxM(-3), fxO(1)];}},
  {l:'Mówię im, że preferuję stringi mojej babci.', f:()=>[fxM(3), fxP(3)]}
 ]},

{id:'gollob_w', t:'POJEDYNEK WE ŚNIE Z GOLLOBEM (ZIMOWY)',
 x:'Luty, żadnej jazdy od października. Śni ci się, że jedziesz w parze z Tomaszem Gollobem. Wychodzicie spod taśmy na podwójne prowadzenie, ale Gollob zostawia ci przy krawężniku podejrzanie dużo miejsca.',
 w:2,
 o:[
  {l:'Wchodzę pod Golloba.', f:()=>{ if(chance(30)) return [fxO(1)+' (sen czasem uczy)'];
     return ['Upadek. Budzisz się na podłodze obok łóżka.', fxIN(5)];}},
  {l:'Trzymam swoją pozycję.', f:()=>[fxP(3)]}
 ]},

{id:'awangarda_w', t:'ZBIÓRKA AWANGARDY (PRZED OKIENKIEM)',
 x:'Zima, konto puste, a przy ofercie sponsoringowej odzywa się Awangarda żużlowa. Organizują na grupie zbiórkę, żeby móc ci zapłacić za logo na kevlarze w nowym sezonie.',
 cond:(p)=>p.budget<50000,
 w:3,
 o:[
  {l:'Zgadzam się i lajkuję fanpage.', f:()=>{const l=[];
     if(chance(15)) l.push(fxK(8000)+' ze zbiórki'); else l.push('Zbiórka utknęła na 340 zł.');
     l.push(fxM(R(-4,4))); l.push(fxP(-2)); return l;}},
  {l:'Wy jesteście normalnie nienormalni.', f:()=>{G.p.next.noSponsor=true;
     return [fxP(3), 'Żadnych ofert sponsorskich w najbliższym okienku.'];}}
 ]},

{id:'speedcoin_w', t:'KOLEGA WCHODZI W „SPEEDCOINA” (ZIMĄ)',
 x:'Międzysezonie, wszyscy siedzą w domach. Pokazuje ci wykres na telefonie z pękniętym ekranem. Mówi, że to „krypto dla żużlowców” i że jego kuzyn zrobił na tym mieszkanie w Rybniku.',
 cond:(p)=>p.budget>=10000,
 w:3,
 o:[
  {l:'Wchodzę za 20% budżetu.', f:()=>{const inv=Math.round(G.p.budget*0.2);G.p.budget-=inv;
     if(chance(25)){G.p.budget+=inv*3;return ['Wpłaciłeś '+zl(inv)+', wyjąłeś '+zl(inv*3)+'.','Kolega chce teraz procent.'];}
     return ['Projekt zniknął razem ze stroną. I to jeszcze przed okienkiem transferowym.','Straciłeś '+zl(inv)+'.'];}},
  {l:'Nie wchodzę.', f:()=>[fxP(2)]}
 ]},

{id:'dietetyk_w', t:'DIETETYK Z INSTAGRAMA (ZIMOWA REDUKCJA)',
 x:'Ma 200 tysięcy obserwujących, certyfikat z webinaru i plan żywieniowy w PDF-ie. Twoja mama mówi, że wyglądasz jak z obozu, a do pierwszego meczu są jeszcze trzy miesiące.',
 w:3,
 o:[
  {l:'Robię redukcję przez całą zimę.', f:()=>[fxO(2), fxP(-10)+' (osłabienie organizmu)', fxIN(15)]},
  {l:'Jem schabowego u mamy.',          f:()=>[fxO(-1), fxP(5)]}
 ]},

];
