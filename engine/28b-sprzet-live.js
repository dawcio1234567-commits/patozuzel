/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: WARSZTAT LIVE — POGODA, DYSZA, GAŹNIK
   Sprint 4 (23.08.2026). Wyszło z engine/28-wielki-mecz.js, żeby tamten
   nie spuchł — 28 zostaje przy „który mecz jest tym meczem", tutaj
   siedzi całe USTAWIANIE MOTOCYKLA W TRAKCIE ZAWODÓW.
   ------------------------------------------------------------
   Ładuje się MIĘDZY 28 a 29:
       <script src="engine/28-wielki-mecz.js"></script>
       <script src="engine/28b-sprzet-live.js"></script>   ← TO DOPISZ
       <script src="engine/29-live-bieg.js"></script>
   ------------------------------------------------------------
   CO TU JEST:
     1. POGODA. Raz na zawody losuje się temperatura powietrza i wilgotność.
        Z nich wychodzi GĘSTOŚĆ POWIETRZA — im zimniej i sucho, tym gęstsze
        powietrze, tym więcej tlenu w cylindrze i tym BOGATSZA musi być dysza.
        Ciepło i mokro = powietrza mało, dysza uboga, bo inaczej się zaleje.
        To nie jest ozdobnik: źle dobrana dysza zabiera realną moc i podnosi
        ryzyko defektu. Silnik WYMUSZA prawidłowy dobór — patrz liveSetupEval().
     2. GAŹNIK (igła/przelot) idzie głównie za wilgotnością.
     3. DŁUGOŚĆ MOTOCYKLA i ZAPŁON idą za STANEM TORU, nie za pogodą:
        na przyczepnym torze dłuższy motocykl trzyma przód, na betonie
        krótszy się obraca; zapłon odwrotnie.
     4. RYZYKO „DWÓCH MINUT". Pierwsze ustawienie sprzętu przed pierwszym
        biegiem jest DARMOWE (0%). Każda kolejna zmiana czegokolwiek w
        trakcie zawodów to od 0,5% (sztab jak u mistrza świata) do 5%
        (szwagier Mirek) szans, że mechanik nie zdąży i sędzia zamknie
        temat kodem „w".
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
 /* teksty mechanika o pogodzie */
 wxCold:['„Zimno jak w kostnicy. Powietrze gęste, musisz to czymś nakarmić."',
         '„Przy takiej temperaturze uboga dysza to jest samobójstwo na raty."'],
 wxHot :['„Gorąco. Powietrza tyle co nic — jak dasz bogatą, to się zaleje na wyjściu."',
         '„Trzydzieści stopni. Silnik będzie się dusił własnym paliwem, jeśli przesadzisz."'],
 wxWet :['„Wilgoć w powietrzu robi za paliwo. Igła w dół, bo inaczej będziesz wiózł wodę."',
         '„Mokro. Mokre powietrze jest leniwe, gaźnik musi być ubogi."'],
 wxDry :['„Sucho jak w piekarniku. Igła wyżej, bo silnik będzie chodził na powietrzu."',
         '„Przy takiej suchości można pozwolić sobie na bogatszy przelot."']
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
 return live;
}
/* ------------------------------------------------------------
   OCENA USTAWIEŃ — TU SILNIK WYMUSZA PRAWIDŁOWY DOBÓR.
   Zwraca odchyłki, karę do siły jazdy i dokładkę do ryzyka defektu.
   Dysza i gaźnik ważą najwięcej, bo to one zależą od POGODY, której
   nie da się przewidzieć przed zawodami — trzeba ją odczytać.
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
   PIERWSZE ustawienie przed PIERWSZYM biegiem nie kosztuje nic —
   wtedy nikt się nie śpieszy, park maszyn stoi otwarty.
   ------------------------------------------------------------ */
function liveSetupRisk(live){
 if(live && !live.setupDone) return 0;
 const q=cl((G&&G.p)?G.p.mech:40, 1, 99);
 return Math.round((SETUPB.lateMax - (SETUPB.lateMax-SETUPB.lateMin)*(q/99))*10)/10;
}
/* Gracz właśnie coś przekręcił. Zwraca aktualne ryzyko (do pokazania). */
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
/* Podpowiedź mechanika o pogodzie — trafność ta sama, co przy zębatce. */
function liveMechWeather(live){
 const w=live.weather; if(!w) return null;
 const acc = BIGM.mechMin + (BIGM.mechMax-BIGM.mechMin)*(cl(G.p.mech,1,99)/99);
 const ok  = chance(acc);
 const jet = ok ? liveIdealJet(w)  : cl(liveIdealJet(w)  + pick([-2,-1,1,2]), 0, 5);
 const carb= ok ? liveIdealCarb(w) : cl(liveIdealCarb(w) + pick([-1,1]),      0, 3);
 const txt = (w.temp<=14 ? pick(SETUPB.wxCold) : w.temp>=25 ? pick(SETUPB.wxHot) :
              w.hum>=70  ? pick(SETUPB.wxWet)  : pick(SETUPB.wxDry));
 return {jet, carb, txt, acc:Math.round(acc)};
}
/* ------------------------------------------------------------
   ZBIORCZA KOREKTA DO JAZDY — jedno wejście dla obu generatorów.
   Składa się z ustawień motocykla (dysza/gaźnik/długość/zapłon)
   i z `live.formBonus`, czyli tego, co zrobiły z tobą zdarzenia
   i wywiady w trakcie zawodów (engine/30b-live-zdarzenia.js).
   ------------------------------------------------------------ */
function liveRideMod(live){
 const ev = liveSetupEval(live);
 return {str: ev.str + ((live && live.formBonus) || 0), def: ev.def, ev};
}
