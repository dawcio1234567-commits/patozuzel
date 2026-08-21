/* ============================================================
   PATO-ŻUŻEL :: DANE :: WIELKI MECZ — KONFIGURACJA I TEKSTY
   BIGM: przyczepność toru, zębatki, kwoty kar, teksty spikera i mechanika.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 3873-3957 oryginału).
   ============================================================ */
/* ============================================================
   WIELKI MECZ — KONFIGURACJA I TEKSTY (patch 22.08.2026)
   ------------------------------------------------------------
   Wszystko, co gracz CZYTA w trybie jazdy na żywo, siedzi tutaj.
   Silnik (engine.js) czyta z tego wyłącznie liczby i etykiety —
   dzięki temu balans i teksty da się kręcić bez ruszania logiki.
   ============================================================ */
const BIGM = {
 /* --- PRZYCZEPNOŚĆ TORU (0-5) ---
    0 = beton, tor wyschnięty na wiór, koło ucieka przy każdym otwarciu gazu
    5 = tor ciężki, mokry, trzyma jak dywan, ale wypłuca silnik
    Do KAŻDEGO stanu toru pasuje inna zębatka. Im większa przyczepność,
    tym „dłuższe" przełożenie ma sens — dlatego idealna zębatka rośnie
    razem z przyczepnością (z drobnym marginesem, o którym wie tylko tor). */
 grip:[
  {n:'BETON',        d:'Tor wyschnięty na wiór. Twardy, szklisty, bez śladu wilgoci. Koło ucieka przy samej myśli o gazie.'},
  {n:'SUCHO',        d:'Sucho i gładko. Ślizgawka na wejściu w łuk, ale da się jechać, jeśli ktoś umie kręcić gazem.'},
  {n:'ŚREDNIO',      d:'Tor przeciętny. Nawierzchnia równa, przyczepność normalna, żadnych fajerwerków. Klasyka Ekstraligi.'},
  {n:'PRZYCZEPNIE',  d:'Dołożyli wody i przeorali. Trzyma, wybija do przodu, ale wybacza mniej niż się wydaje.'},
  {n:'CIĘŻKO',       d:'Tor ciężki, gruby, mokry po deszczu. Motocykl dławi się na wyjściu, ale przód trzyma jak przyklejony.'},
  {n:'BAGNO',        d:'Bagno. Woda stoi na łuku, kluby dzwonią do sędziego, sędzia patrzy w niebo. Jedziemy.'}
 ],
 /* Skutek dopasowania zębatki: indeks = |zębatka - idealna| (0-5). */
 fitStr : [ 3.8, 1.4, -1.2, -3.8, -6.4, -9.2 ],
 fitDef : [ 0.000, 0.008, 0.020, 0.036, 0.055, 0.078 ],
 fitTxt : ['ZĘBATKA IDEALNA','ZĘBATKA BLISKO','ZĘBATKA NIE TA','ZĘBATKA ZŁA','ZĘBATKA FATALNA','ZĘBATKA Z INNEGO TORU'],
 gearTxt: [
  '0 — najkrótsza. Wyrywa z taśmy jak petarda, na prostej kończy się powietrze.',
  '1 — krótka. Start dobry, prosta średnia.',
  '2 — kompromis. Nic nie wygrywa, nic nie przegrywa.',
  '3 — dłuższa. Trochę cierpliwości z taśmy, ale ciągnie do bandy.',
  '4 — długa. Na przyczepnym torze zjada rywali na prostej.',
  '5 — najdłuższa. Albo bagno, albo wstyd.'
 ],
 /* --- MECHANIK ---
    Trafność podpowiedzi liczy się z jakości mechanika (p.mech 0-99):
    45% na dnie skali, 96% u tunera na wyłączność. Zły mechanik nie mówi
    „nie wiem" — mówi z pełnym przekonaniem coś głupiego. */
 mechMin : 45, mechMax : 96,
 mechStay: ['„Zostaw. Ja bym nic nie ruszał."','„Jest dobrze. Nie psuj tego, co działa."',
            '„Ja bym została przy tym. Serio."','„Nie dotykaj. Tor się nie zmienił aż tak."'],
 mechMove: ['„Zmieniłbym na {g}. Zaufaj mi."','„Dawaj {g}. Widziałem, jak wychodzą z łuku."',
            '„Na to bagno musi być {g}. Inaczej się udusisz."','„{g} i po sprawie. Dwie minuty roboty."'],
 /* --- PARK MASZYN: KOSZTY I PROGI --- */
 spyOk       : 50,        // % powodzenia podglądania sprzętu rywala
 yellowCost  : 3500,      // żółta kartka regulaminowa
 redFine     : 30000,     // czerwona kartka za rękoczyny
 redProf     : 14,        // ...i ile zabiera profesjonalizmu
 leaveFine   : 150000,    // opuszczenie parku maszyn w trakcie zawodów
 leaveProf   : 22,
 leaveAtm    : 30,
 leaveLoy    : 45,
 cryFine     : 50000,     // płacz przed meczem i brak telefonu do ojca
 cryProf     : 50,
 argueBase   : 46,        // % szans, że kłótnia z trenerem coś da
 insultBase  : 62,        // wyzwiska działają częściej, kosztują nieporównanie więcej
 pushBase    : 40,        // presja, żeby wpuścił cię za kolegę
 /* --- START --- */
 starts:[
  {id:'tape', l:'ATAK NA TAŚMĘ', d:'Koło na taśmie, sprzęgło w połowie. Albo wyjeżdżasz pierwszy, albo sędzia zapala czerwoną i wykluczają cię z biegu.'},
  {id:'clean',l:'CZYSTO Z TAŚMY', d:'Normalny start. Tyle, ile daje sprzęt, refleks i zębatka.'},
  {id:'safe', l:'SPOKOJNIE, PO SWOJEMU', d:'Puszczasz taśmę bezpiecznie i liczysz, że rywale sami się pozabijają w pierwszym łuku.'}
 ],
 /* --- DECYZJE W BIEGU (co łuk) --- */
 moves:[
  {id:'kreda', l:'KREDA (do wewnątrz, po krawężniku)',
   d:'Wąsko, po kredzie, koło przy krawężniku. Najkrótsza droga i najmniej miejsca na pomyłkę.'},
  {id:'zewn',  l:'ZEWNĘTRZNA (po dmuchawie)',
   d:'Szeroko, po świeżym torze przy bandzie. Dłuższa droga, za to prawdziwa przyczepność.'},
  {id:'pika',  l:'PIKA (wjazd pod rywala)',
   d:'Wchodzisz mu pod koło i zamykasz. Albo go wyprzedzasz, albo obaj lecicie po dmuchawie.'},
  {id:'obrona',l:'OBRONA (trzymam linię)',
   d:'Żadnych fajerwerków. Zamykasz wewnętrzną i pilnujesz tego, co masz.'},
  {id:'nozyce',l:'KLASYCZNE, ŻUŻLOWE NOŻYCE',
   d:'Wychodzisz na zewnętrzną, ścinasz do małej i zamykasz mu wyjście z łuku. Kiedyś tak jeździła cała liga.'},
  {id:'ajs',   l:'AJS SPIDŁEJ, AJS SPIDŁEJ AHAHAHAHA',
   d:'Motocykl wyprostowany, gaz zablokowany, jazda po bandach. Uda się — wyprzedzasz WSZYSTKICH przed sobą naraz. Nie uda się — a prawie nigdy się nie udaje — i zbierają cię z prostej.'},
  {id:'plot',  l:'ŁADUJEMY W PŁOT',
   d:'Gaz do dechy, kierunek banda, myślenie na potem. Ojciec by tego nie pochwalił. Ojciec nie odbiera.'}
 ],
 phases:['START','1. OKRĄŻENIE — ŁUK 1 i 2','2-3. OKRĄŻENIE — WALKA','OSTATNI ŁUK'],
 /* --- SPRINT 4: ZDARZENIA W TRAKCIE ZAWODÓW I WYWIADY ---
    Nadpisuje wartości domyślne stałej SIDE z engine/30b-live-zdarzenia.js.
    Zostawione jawnie, żeby dało się to kręcić bez ruszania silnika. */
 side:{
  evChance:26, evCap:3, evCool:2,
  itwPre:45, itwMid:22, itwPost:60, itwMidCap:1, itwMedK:0.35,
  voices:6
 },
 /* --- KOMENTARZ SPIKERA (do smaku, losowany) --- */
 crowd:[
  'Sektor B stoi na krzesełkach.','Spiker urywa zdanie w połowie.',
  'Ktoś z trybun rzuca kubkiem w płot.','Kamera pokazuje twarz prezesa. Prezes nie wygląda dobrze.',
  'Trener chowa twarz w dłoniach.','Na trybunach zapala się race, choć nie wolno.',
  'Mechanik ściska klucz tak, że bieleją mu palce.','Twoja matka ogląda to w telewizji i nie oddycha.'
 ]
};
