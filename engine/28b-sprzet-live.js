/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: WARSZTAT LIVE — POGODA, DYSZA, GAŹNIK
   Sprint 4 (23.08.2026), rozszerzony w Sprincie 5 (24.08.2026).
   Wyszło z engine/28-wielki-mecz.js, żeby tamten nie spuchł —
   28 zostaje przy „który mecz jest tym meczem", tutaj siedzi całe
   USTAWIANIE MOTOCYKLA W TRAKCIE ZAWODÓW.
   ------------------------------------------------------------
   Ładuje się MIĘDZY 28 a 29:
       <script src="engine/28-wielki-mecz.js"></script>
       <script src="engine/28b-sprzet-live.js"></script>
       <script src="engine/29-live-bieg.js"></script>
   ------------------------------------------------------------
   CO TU JEST:
     1. POGODA. Raz na zawody losuje się temperatura powietrza i wilgotność.
        Z nich wychodzi GĘSTOŚĆ POWIETRZA — im zimniej i sucho, tym gęstsze
        powietrze, tym więcej tlenu w cylindrze i tym BOGATSZA musi być dysza.
        Ciepło i mokro = powietrza mało, dysza uboga, bo inaczej się zaleje.
     2. GAŹNIK (igła/przelot) idzie głównie za wilgotnością.
     3. DŁUGOŚĆ MOTOCYKLA i ZAPŁON idą za STANEM TORU, nie za pogodą.
     4. RYZYKO „DWÓCH MINUT". Pierwsze ustawienie sprzętu przed pierwszym
        biegiem jest DARMOWE (0%). Każda kolejna zmiana czegokolwiek w
        trakcie zawodów to od 0,5% (sztab jak u mistrza świata) do 5%
        (szwagier Mirek) szans, że mechanik nie zdąży i sędzia zamknie
        temat kodem „w".

   SPRINT 5 (24.08.2026) dokłada trzy rzeczy:
     A. liveTrackInit() — tor, idealna zębatka i PODPOWIEDZI MECHANIKA są
        znane JUŻ PRZED pierwszym biegiem. Wcześniej `live.grip` był null
        aż do wejścia w pierwszy własny bieg, więc boks „TOR I MOTOCYKL"
        w ogóle się nie renderował i gracz nie widział ani słowa od mechanika.
     B. liveMechWeather() podaje teraz typ na WSZYSTKIE CZTERY ustawienia
        (dysza, gaźnik, DŁUGOŚĆ, ZAPŁON) — trafność każdej podpowiedzi
        liczy się osobno z jakości mechanika, więc szwagier Mirek potrafi
        trafić dyszę i spudłować zapłon.
     C. liveMechAutoSet() — „JESTEM NIEDŹWIEDZIAKIEM I ZOSTAWIAM USTAWIENIA
        STAREMU". Gracz oddaje sprzęt mechanikowi: sam nie może już nic
        ruszyć, a mechanik ustawia wszystko SAM — tak dobrze, jak umie.
        Jeżeli grzebie w sprzęcie w trakcie zawodów, ryzyko „dwóch minut"
        jest DOKŁADNIE TAKIE SAMO jak przy zmianach ręcznych.
   ============================================================ */

/* --- ETYKIETY (to, co gracz czyta) --- */
const SETUPB = {
 /* DYSZA 0-5: od najuboższej do najbogatszej */
 jet:[
  {n:'155 — bardzo uboga', d:'Powietrza mało, paliwa jeszcze mniej. Silnik kręci wysoko i grzeje się jak piec.'},
  {n:'158 — uboga',        d:'Na ciepło i mokro. Ostro odpowiada na gaz, ale nie wybacza pomyłki.'},
  {n:'162 — lekko uboga',  d:'Kompromis w stronę ciepła. Bezpieczna na letni wieczór.'},
  {n:'166 — średnia',      d:'Standard z instrukcji. Nic nie wygrywa, nic nie zabija.'},
  {n:'170 — bogata',       d:'Na chłodne, gęste powietrze. Ciągnie z dołu, dymi na wolnych obrotach.'},
  {n:'174 — bardzo bogata',d:'Na zimno i sucho. Zalewa wszystko, co nie jest zimnym powietrzem.'}
 ],
 /* GAŹNIK 0-3: pozycja igły / przelot */
 carb:[
  {n:'IGŁA NA 1. ROWKU (najuboższy przelot)', d:'Na powietrze wilgotne jak ręcznik. Odpowiedź natychmiastowa, moc krótka.'},
  {n:'IGŁA NA 2. ROWKU',                      d:'Wilgotno, ale bez przesady. Bezpieczne ustawienie na deszczowy wieczór.'},
  {n:'IGŁA NA 3. ROWKU',                      d:'Środek skali. Tak przychodzi gaźnik od tunera.'},
  {n:'IGŁA NA 4. ROWKU (najbogatszy przelot)',d:'Na suche, ostre powietrze. Ciągnie długo, ale topi świecę, jak się pomylisz.'}
 ],
 /* DŁUGOŚĆ MOTOCYKLA 0-3 (rozstaw osi) */
 len:[
  {n:'KRÓTKI (1330 mm)',  d:'Obraca się w miejscu. Na betonie i twardym torze — jedyne, co działa.'},
  {n:'ŚREDNIO-KRÓTKI',    d:'Zwrotny, jeszcze przewidywalny.'},
  {n:'ŚREDNIO-DŁUGI',     d:'Trzyma przód na wyjściu z łuku. Na przyczepnym torze robi różnicę.'},
  {n:'DŁUGI (1400 mm)',   d:'Jak wagon. Na bagnie ciągnie prosto, na betonie nie skręca w ogóle.'}
 ],
 /* ZAPŁON 0-3 */
 ign:[
  {n:'ZAPŁON PÓŹNY',      d:'Miękko z dołu, nic nie zrywa przyczepności. Na tor, który trzyma jak dywan.'},
  {n:'ZAPŁON LEKKO PÓŹNY',d:'Łagodna charakterystyka. Bezpiecznie.'},
  {n:'ZAPŁON ŚREDNI',     d:'Fabryczny. Nikt nigdy nie wygrał ani nie przegrał przez ten wybór.'},
  {n:'ZAPŁON WCZESNY',    d:'Wystrzał z dołu. Na twardym, szklistym torze koło i tak ucieka, więc niech ucieka szybciej.'}
 ],
 /* wagi kary za pomyłkę — ile punktów siły zabiera każdy krok obok ideału */
 wJet:2.4, wCarb:1.8, wLen:1.0, wIgn:1.2,
 /* ile każdy krok obok ideału dokłada do ryzyka defektu */
 dJet:0.016, dCarb:0.010, dLen:0.003, dIgn:0.005,
 /* RYZYKO DWÓCH MINUT: widełki wg jakości mechanika (p.mech 0-99) */
 lateMin:0.5, lateMax:5.0,
 /* teksty mechanika o POGODZIE (dysza i gaźnik) */
 wxCold:['„Zimno jak w kostnicy. Powietrze gęste, musisz to czymś nakarmić."',
         '„Przy takiej temperaturze uboga dysza to jest samobójstwo na raty."'],
 wxHot :['„Gorąco. Powietrza tyle co nic — jak dasz bogatą, to się zaleje na wyjściu."',
         '„Trzydzieści stopni. Silnik będzie się dusił własnym paliwem, jeśli przesadzisz."'],
 wxWet :['„Wilgoć w powietrzu robi za paliwo. Igła w dół, bo inaczej będziesz wiózł wodę."',
         '„Mokro. Mokre powietrze jest leniwe, gaźnik musi być ubogi."'],
 wxDry :['„Sucho jak w piekarniku. Igła wyżej, bo silnik będzie chodził na powietrzu."',
         '„Przy takiej suchości można pozwolić sobie na bogatszy przelot."'],
 /* SPRINT 5: teksty mechanika o TORZE (długość i zapłon) */
 trkGrip:['„Tor trzyma. Wydłuż go, bo inaczej będzie ci uciekał przód na wyjściu."',
          '„Przy takiej przyczepności krótki motocykl to jest proszenie się o dachowanie."',
          '„Zapłon w dół, tor i tak ci wszystko odda. Nie musisz go szarpać."'],
 trkHard:['„Beton. Krótko i miękko, bo się będziesz kręcił w kółko jak autobus."',
          '„Na takim torze zapłon musi być ostry — koło i tak ucieka, niech ucieka do przodu."',
          '„Skróć to. Na twardym długi motocykl nie skręca, tylko jedzie prosto w bandę."'],
 /* SPRINT 5: „JESTEM NIEDŹWIEDZIAKIEM" — co mechanik mówi, kiedy przejmuje sprzęt */
 autoOn:['„No wreszcie. Idź się napić kawy, ja to poskładam."',
         '„Dobrze. Ty jedź, ja kręcę. Tak to kiedyś wyglądało."',
         '„Zostaw klucze i nie patrz mi na ręce."'],
 autoNone:['Mechanik obszedł motocykl, kopnął w tylne koło i nic nie ruszył. „Jest dobrze."',
           'Mechanik popatrzył na tor, popatrzył na motocykl i zapalił papierosa. Zostaje jak było.',
           'Mechanik nie wyjął nawet klucza. Uznał, że tak jest dobrze — i nikt go nie pyta o zdanie.']
};

/* --- POGODA NA ZAWODY (losowana raz) --- */
function liveWeather(){
 const temp = R(4, 33);                    // °C
 const hum  = R(28, 96);                   // % wilgotności
 /* Gęstość powietrza 0..1: zimno i sucho = 1, ciepło i mokro = 0.
    Temperatura waży więcej niż wilgotność, bo tak to działa na torze. */
 const dens = cl( (1-(temp-4)/29)*0.72 + (1-(hum-28)/68)*0.28, 0, 1);
 const wind = pick(['bezwietrznie','lekki wiatr w plecy na prostej','wiatr w twarz na wyjściu z drugiego łuku','porywisty, zmienny']);
 return {temp, hum, dens, wind};
}
/* Idealna dysza (0-5) — rośnie z gęstością powietrza. */
function liveIdealJet(w){ return cl(Math.round((w?w.dens:0.5)*5), 0, 5); }
/* Idealny gaźnik (0-3) — rośnie z suchością powietrza. */
function liveIdealCarb(w){ return cl(Math.round((1-((w?w.hum:60)-28)/68)*3), 0, 3); }
/* Idealna długość (0-3) — rośnie z przyczepnością toru (grip 0-5). */
function liveIdealLen(grip){ return cl(Math.round(((grip==null?2:grip)/5)*3), 0, 3); }
/* Idealny zapłon (0-3) — odwrotnie do przyczepności. */
function liveIdealIgn(grip){ return cl(3 - Math.round(((grip==null?2:grip)/5)*3), 0, 3); }

/* Domyślne ustawienia na start zawodów. */
function liveSetupInit(live){
 live.weather = live.weather || liveWeather();
 if(live.jet ==null) live.jet =3;
 if(live.carb==null) live.carb=2;
 if(live.len ==null) live.len =1;
 if(live.ign ==null) live.ign =2;
 live.setupDone = !!live.setupDone;     // czy PIERWSZE ustawienie zostało już zatwierdzone
 live.setupDirty= false;                // czy od ostatniego wyjazdu coś ruszono
 live.setupChanges = live.setupChanges||0;
 live.mechAuto = !!live.mechAuto;       // SPRINT 5: sprzęt oddany mechanikowi
 return live;
}
/* ------------------------------------------------------------
   SPRINT 5: TOR I MECHANIK ZNANI PRZED PIERWSZYM BIEGIEM.
   ------------------------------------------------------------
   ZGŁOSZENIE: „przed meczem nie wyświetlają się podpowiedzi mechaników".
   Powód był prosty: `live.grip` zostawał `null` aż do wejścia w PIERWSZY
   WŁASNY bieg, a ui/09c-warsztat-live.js zaczyna od `if(L.grip==null) return ''`.
   Efekt: w parku maszyn przed zawodami i na ekranie „między biegami" nie było
   ANI boksu warsztatu, ANI mechanika. Teraz stan toru losuje się razem z pogodą,
   a mechanik ma zdanie od pierwszej sekundy.
   Wołać RAZ, zaraz po liveSetupInit().
   ------------------------------------------------------------ */
function liveTrackInit(live){
 if(!live) return live;
 if(live.grip==null) live.grip = liveGrip(null);
 if(live.ideal==null) live.ideal = liveIdeal(live.grip);
 live.mech   = liveMech(live.ideal, live.gear);
 live.mechWx = liveMechWeather(live);
 return live;
}
/* Odświeżenie podpowiedzi bez zmiany stanu toru (ekran „między biegami"). */
function liveMechRefresh(live){
 if(!live || live.grip==null) return live;
 if(live.mechAuto) return live;      // sprzęt prowadzi mechanik — jego nastawa JEST podpowiedzią
 live.mech   = liveMech(live.ideal, live.gear);
 live.mechWx = liveMechWeather(live);
 return live;
}
/* ------------------------------------------------------------
   OCENA USTAWIEŃ — TU SILNIK WYMUSZA PRAWIDŁOWY DOBÓR.
   ------------------------------------------------------------ */
function liveSetupEval(live){
 if(!live || live.weather==null) return {dj:0,dc:0,dl:0,di:0,str:0,def:0,ok:true,score:0};
 const w=live.weather, g=live.grip;
 const dj=Math.abs((live.jet ==null?3:live.jet ) - liveIdealJet(w));
 const dc=Math.abs((live.carb==null?2:live.carb) - liveIdealCarb(w));
 const dl=Math.abs((live.len ==null?1:live.len ) - liveIdealLen(g));
 const di=Math.abs((live.ign ==null?2:live.ign ) - liveIdealIgn(g));
 /* Sufit i podłoga są celowe. Idealne ustawienie ma być PREMIĄ (+3,2),
    a komplet pomyłek ma boleć — ale nie bardziej niż cała reszta gry razem
    wzięta, bo wtedy jeden zły klik zamieniałby mistrza w statystę. */
 const str = cl(3.2 - (dj*SETUPB.wJet + dc*SETUPB.wCarb + dl*SETUPB.wLen + di*SETUPB.wIgn), -13, 3.2);
 const def = cl(dj*SETUPB.dJet + dc*SETUPB.dCarb + dl*SETUPB.dLen + di*SETUPB.dIgn, 0, 0.10);
 return {dj, dc, dl, di, str, def,
         ok:(dj+dc)===0, score:dj+dc+dl+di};
}
/* Jednozdaniowa ocena dla ekranu. */
function liveSetupVerdict(ev){
 const s=ev?ev.score:0;
 if(s===0) return {t:'MOTOCYKL USTAWIONY IDEALNIE POD DZISIEJSZE POWIETRZE', c:'#22c55e'};
 if(s<=1)  return {t:'BLISKO. Mechanik kiwa głową i nic nie mówi.', c:'#84cc16'};
 if(s<=3)  return {t:'DA SIĘ JECHAĆ, ale silnik nie odda wszystkiego.', c:'#eab308'};
 if(s<=5)  return {t:'ŹLE DOBRANE. Ten motocykl będzie się dusił.', c:'#f97316'};
 return {t:'MOTOCYKL Z INNEGO TORU I Z INNEJ POGODY. Tym się nie da jechać.', c:'#ef4444'};
}
/* ------------------------------------------------------------
   RYZYKO „DWÓCH MINUT"
   ------------------------------------------------------------
   0,5% przy sztabie jak u mistrza świata, 5% przy szwagrze Mirku.
   PIERWSZE ustawienie przed PIERWSZYM biegiem nie kosztuje nic.
   DOTYCZY TAK SAMO ZMIAN RĘCZNYCH, JAK I TYCH, KTÓRE MECHANIK ROBI SAM
   przy włączonym trybie „Jestem Niedźwiedziakiem" — sędzia nie pyta,
   czyja ręka trzymała klucz.
   ------------------------------------------------------------ */
function liveSetupRisk(live){
 if(live && !live.setupDone) return 0;
 const q=cl((G&&G.p)?G.p.mech:40, 1, 99);
 return Math.round((SETUPB.lateMax - (SETUPB.lateMax-SETUPB.lateMin)*(q/99))*10)/10;
}
/* Gracz (albo mechanik) właśnie coś przekręcił. Zwraca aktualne ryzyko. */
function liveSetupTouch(live){
 if(!live) return 0;
 if(live.setupDone){ live.setupDirty=true; live.setupChanges=(live.setupChanges||0)+1; }
 return liveSetupRisk(live);
}
/* Wyjazd na tor. Jeżeli od ostatniego biegu coś ruszałeś — rzut kością. */
function liveSetupTapeRoll(live, out){
 out=out||[];
 if(!live) return out;
 if(!live.setupDone){ live.setupDone=true; live.setupDirty=false; return out; }
 if(!live.setupDirty) return out;
 live.setupDirty=false;
 const r=liveSetupRisk(live);
 out.push('Mechanik ('+((G&&G.p&&G.p.mechName)||'mechanik')+') dokręca ostatnią śrubę, kiedy sędzia stoi już z ręką na taśmie — '+
   r+'% szans, że nie zdążysz pod taśmę w regulaminowym czasie.');
 if(chance(r)){
   live.lateOut=true;
   live.lateCount=(live.lateCount||0)+1;
   out.push('DWIE MINUTY. Sędzia odlicza, ty stoisz w bramie z otwartym gaźnikiem w ręku. '+
     'WYKLUCZENIE ZA PRZEKROCZENIE LIMITU DWÓCH MINUT — kod „w" w tym biegu.');
 } else {
   out.push('Zdążyłeś. Wjeżdżasz pod taśmę jako ostatni, ale wjeżdżasz.');
 }
 return out;
}
/* ------------------------------------------------------------
   PODPOWIEDŹ MECHANIKA — SPRINT 5: NA WSZYSTKIE CZTERY USTAWIENIA.
   ------------------------------------------------------------
   Do Sprintu 4 mechanik miał zdanie wyłącznie o dyszy i gaźniku, więc
   przy DŁUGOŚCI i ZAPŁONIE gracz nie widział ani jednej liczby — tylko
   napis „zależy od PRZYCZEPNOŚCI TORU". Teraz typuje wszystko cztery razy,
   a KAŻDA podpowiedź jest losowana OSOBNO tą samą trafnością: dobry
   mechanik trafia prawie zawsze, szwagier Mirek trafia dyszę i pudłuje zapłon.
   `acc` (45-96%) liczy się z p.mech dokładnie tak, jak przy zębatce.
   ------------------------------------------------------------ */
function liveMechWeather(live){
 const w=live.weather; if(!w) return null;
 const g=live.grip;
 const acc = BIGM.mechMin + (BIGM.mechMax-BIGM.mechMin)*(cl(G.p.mech,1,99)/99);
 const guess=(ideal, max, spread)=> chance(acc) ? ideal : cl(ideal + pick(spread), 0, max);
 const jet = guess(liveIdealJet(w),  5, [-2,-1,1,2]);
 const carb= guess(liveIdealCarb(w), 3, [-1,1]);
 const len = g==null ? null : guess(liveIdealLen(g), 3, [-1,1]);
 const ign = g==null ? null : guess(liveIdealIgn(g), 3, [-1,1]);
 const txt = (w.temp<=14 ? pick(SETUPB.wxCold) : w.temp>=25 ? pick(SETUPB.wxHot) :
              w.hum>=70  ? pick(SETUPB.wxWet)  : pick(SETUPB.wxDry));
 const txtTrack = g==null ? '' : (g>=3 ? pick(SETUPB.trkGrip) : pick(SETUPB.trkHard));
 return {jet, carb, len, ign, txt, txtTrack, acc:Math.round(acc)};
}
/* ------------------------------------------------------------
   SPRINT 5: „JESTEM NIEDŹWIEDZIAKIEM I ZOSTAWIAM USTAWIENIA STAREMU"
   ------------------------------------------------------------
   Gracz oddaje sprzęt mechanikowi i traci prawo dotykania czegokolwiek:
   zębatki, dyszy, gaźnika, długości i zapłonu. W zamian mechanik ustawia
   WSZYSTKO SAM, przed każdym twoim biegiem — dokładnie tak dobrze, jak umie
   (ta sama trafność 45-96% co przy podpowiedziach, losowana osobno dla
   każdego ustawienia). Szwagier Mirek zrobi ci z tego motocykl z innego toru.
   Sztab jak u mistrza świata trafi prawie zawsze.

   RYZYKO „DWÓCH MINUT" ZOSTAJE. Jeżeli mechanik grzebie w sprzęcie w trakcie
   zawodów (czyli po pierwszym, darmowym ustawieniu), liveSetupTouch() zapala
   `setupDirty` tak samo jak przy zmianie ręcznej — i tak samo możesz nie
   zdążyć pod taśmę. Sędzia nie pyta, czyja ręka trzymała klucz.

   CENA WEJŚCIA: -5 punktów procentowych profesjonalizmu (BIGM.autoProf).
   ------------------------------------------------------------ */
const AUTO_PROF = (typeof BIGM!=='undefined' && BIGM.autoProf!=null) ? BIGM.autoProf : 5;

function liveMechAutoOn(live, out){
 out=out||[];
 if(!live || live.mechAuto) return out;
 const p=G.p, S=G.S;
 live.mechAuto=true;
 p.prof = cl(p.prof - AUTO_PROF, 0, 99);
 if(S) S.bigProf=(S.bigProf||0)-AUTO_PROF;
 out.push('JESTEM NIEDŹWIEDZIAKIEM I ZOSTAWIAM USTAWIENIA STAREMU. Oddajesz '+
   ((p.mechName)||'mechanikowi')+' klucze, program i cały motocykl.',
   pick(SETUPB.autoOn),
   'Od tej chwili NIE RUSZASZ NICZEGO: ani zębatki, ani dyszy, ani gaźnika, ani długości, ani zapłonu. '+
   'Mechanik ustawia to sam przed każdym twoim biegiem — tak dobrze, jak umie ('+((G&&G.p)?G.p.mech:40)+'/99).',
   'Ryzyko „dwóch minut" zostaje bez zmian: jak on nie zdąży, to TY stoisz w bramie.',
   'Profesjonalizm -'+AUTO_PROF+' punktu procentowego. Zawodowiec ustawia sprzęt sam i wszyscy o tym wiedzą.');
 return out;
}
/* Mechanik ustawia motocykl SAM. Wołać przed każdym biegiem Gracza. */
function liveMechAutoSet(live, out){
 out=out||[];
 if(!live || !live.mechAuto) return out;
 const q  = cl((G&&G.p)?G.p.mech:40, 1, 99);
 const acc= BIGM.mechMin + (BIGM.mechMax-BIGM.mechMin)*(q/99);
 const guess=(ideal, max, spread)=> chance(acc) ? ideal : cl(ideal + pick(spread), 0, max);
 const w=live.weather, g=live.grip;
 const want={
   jet : guess(liveIdealJet(w),  5, [-2,-1,1,2]),
   carb: guess(liveIdealCarb(w), 3, [-1,1]),
   len : guess(liveIdealLen(g),  3, [-1,1]),
   ign : guess(liveIdealIgn(g),  3, [-1,1])
 };
 const wantGear = live.ideal==null ? live.gear
   : (chance(acc) ? live.ideal : cl(live.ideal + pick([-2,-1,1,2]), 0, 5));
 const nm={jet:'DYSZA', carb:'GAŹNIK', len:'DŁUGOŚĆ', ign:'ZAPŁON'};
 const lab={jet:SETUPB.jet, carb:SETUPB.carb, len:SETUPB.len, ign:SETUPB.ign};
 /* Kiedy sprzęt prowadzi mechanik, PODPOWIEDŹ NA EKRANIE = TO, CO ON WŁAŚNIE
    USTAWIŁ. Inaczej boks pokazywałby „mechanik obstawia 3" przy ustawionej
    przez niego czwórce — bo typ i nastawa losowałyby się osobno. On za to
    odpowiada, więc on się pod tym podpisuje. */
 const stand=()=>{
   live.mechWx = {jet:live.jet, carb:live.carb, len:live.len, ign:live.ign,
     txt:'„Tak ma być. Ja to ustawiałem, ja się pod tym podpisuję."',
     txtTrack:'', acc:Math.round(acc)};
   live.mech = {sug:live.gear, txt:'„Zębatka moja. Nie ruszaj."', acc:Math.round(acc)};
 };
 const chg=[];
 ['jet','carb','len','ign'].forEach(k=>{
   if(live[k]!==want[k]){
     chg.push(nm[k]+': '+(lab[k][live[k]]?lab[k][live[k]].n:live[k])+' → '+lab[k][want[k]].n);
     live[k]=want[k];
   }
 });
 if(live.gear!==wantGear){ chg.push('ZĘBATKA: '+live.gear+' → '+wantGear); live.gear=wantGear; }
 if(!chg.length){ stand(); out.push(pick(SETUPB.autoNone)); return out; }
 const r=liveSetupTouch(live);
 stand();
 out.push(((G&&G.p&&G.p.mechName)||'Mechanik')+' bierze się za motocykl bez pytania cię o zdanie: '+chg.join(' · ')+'.');
 if(r>0) out.push('Sprzęt ruszony w trakcie zawodów, tyle że nie twoją ręką — '+r+
   '% szans, że nie zdąży i sędzia zamknie temat kodem „w" w najbliższym biegu.');
 else out.push('To pierwsze ustawienie przed pierwszym biegiem, więc nikt nikogo nie goni — 0% ryzyka.');
 return out;
}
/* Jedno zdanie „dlaczego nie mogę nic kliknąć" dla ekranu i dla logu. */
function liveMechAutoBlock(){
 return ((G&&G.p&&G.p.mechName)||'Mechanik')+' odsuwa twoją rękę od gaźnika: „Umówiliśmy się. '+
   'Ty jedziesz, ja kręcę." Sprzęt jest oddany do końca tych zawodów.';
}
/* ------------------------------------------------------------
   ZBIORCZA KOREKTA DO JAZDY — jedno wejście dla obu generatorów.
   ------------------------------------------------------------ */
function liveRideMod(live){
 const ev = liveSetupEval(live);
 return {str: ev.str + ((live && live.formBonus) || 0), def: ev.def, ev};
}
