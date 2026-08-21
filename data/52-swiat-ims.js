/* ============================================================
   PATO-ŻUŻEL :: DANE :: INDYWIDUALNE MISTRZOSTWA ŚWIATA — REGULAMIN I KASA
   SGP: liczba rund, punktacja, nagrody, limity krajowe, eliminacje.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2859-2957 oryginału).
   ============================================================ */
/* ============================================================
   INDYWIDUALNE MISTRZOSTWA ŚWIATA — REGULAMIN I KASA
   ------------------------------------------------------------
   Format jeden do jednego z regulaminu cyklu:
     · 16 zawodników w każdej rundzie, 20 biegów zasadniczych,
     · 3 pkt za wygrany bieg, 2 za drugie miejsce, 1 za trzecie, 0 za czwarte,
       wykluczenie albo nieukończenie biegu,
     · dwóch najlepszych z tabeli jedzie prosto do FINAŁU,
     · miejsca 3-10 trafiają do biegów ostatniej szansy LCQ1 i LCQ2,
       zwycięzca każdego z nich dołącza do finału,
     · zwycięzca finału wygrywa rundę. Razem 23 biegi.
   Skład cyklu (art. "Line-up"):
     · 7 najlepszych z poprzedniego roku — kwalifikacja automatyczna,
     · 4 najlepszych z Challenge (ostatniej rundy eliminacji do cyklu),
     · Mistrz Europy (SEC) — miejsce gwarantowane,
     · 3 stałe dzikie karty od Komisji (4, gdy mistrz Europy jest w czołowej
       siódemce cyklu),
     · plus jedna dzika karta rundy — ona dopełnia szesnastkę,
     · dwóch rezerwowych toru na każdą rundę.
   NAJŚMIESZNIEJSZE W POPRZEDNIEJ WERSJI GRY BYŁO TO, ŻE MISTRZ ŚWIATA
   DOSTAWAŁ MNIEJ PIENIĘDZY NIŻ PRZECIĘTNY LIGOWIEC. Stawki niżej to
   naprawiają: sam ryczałt startowy w jednej rundzie cyklu jest wyższy niż
   dniówka w Krajowej Lidze, a klasyfikacja końcowa płaci jak mistrzostwo świata.
   ============================================================ */
const SGP = {
 rounds    : 10,          // rund Grand Prix w sezonie
 roundsJun : 3,           // IMŚJ2 (juniorzy) — na życzenie: tylko trzy rundy
 /* punkty do klasyfikacji generalnej za miejsce 1-16 w rundzie */
 pts       : [20,18,16,14,12,11,10,9,8,7,6,5,4,3,2,1],
 /* nagroda za miejsce w POJEDYNCZEJ rundzie (zł) */
 prize     : [90000,70000,55000,45000,38000,33000,29000,26000,23000,20000,18000,16000,14000,12000,10000,9000],
 startFee  : 15000,       // ryczałt startowy za każdą rundę, niezależnie od wyniku
 /* nagroda za miejsce w KLASYFIKACJI KOŃCOWEJ cyklu (zł) */
 series    : [1250000,820000,560000,410000,320000,265000,215000,175000,145000,120000,100000,84000,70000,60000,52000,45000],
 /* IMŚJ2 — ta sama drabinka, ale młodzieżowe stawki */
 junPrizeMul : 0.30,
 junSeriesMul: 0.26,
 /* SGP CHALLENGE — ostatnia runda eliminacji, awans do cyklu dla TOP4 */
 chPrize   : [140000,105000,80000,62000,50000,42000,36000,31000,27000,23000,20000,17000,15000,13000,11000,10000],
 chStartFee: 9000,
 /* MISTRZOSTWA EUROPY (SEC) — zwycięzca ma gwarantowane miejsce w cyklu */
 secPrize  : [220000,150000,110000,85000,70000,58000,49000,42000,36000,31000,27000,24000,21000,18000,16000,14000],
 /* ------------------------------------------------------------
    LIMITY KRAJOWE W CYKLU (hotfix 21.08.2026)
    ------------------------------------------------------------
    Zgłoszenie: „w cyklach międzynarodowych występuje za dużo Polaków".
    Powód był czysto statystyczny: polska liga to ponad 250 zawodników
    w bazie, a każda federacja zagraniczna miała ich kilkanaście — więc
    przy doborze „po prostu najlepszych" Polska brała 11-13 miejsc z 15
    samą masą, a nie klasą. Prawdziwy cykl działa inaczej: Komisja pilnuje,
    żeby stawka była MIĘDZYNARODOWA, a federacje mają przydziały.
    Poniżej twarde limity na skład cyklu — Polska zostaje najsilniejszą
    federacją (5 z 15), ale przestaje być całą stawką.
    ------------------------------------------------------------ */
 natCap    : {POL:5, DEN:3, SWE:3, GBR:2},
 natCapDef : 2,           // limit dla pozostałych federacji
 chNatCap  : 2,           // ile miejsc z jednego kraju może dać jeden Challenge
 secNatCap : {POL:4},     // Mistrzostwa Europy — obsada 16, Polaków maksymalnie tylu
 secNatDef : 3,
 /* GOSPODARZE RUND — każda runda jedzie się w innym kraju, a dziką kartę rundy
    dostaje zawodnik gospodarzy. Bez tego dzika karta rundy zawsze szła do Polaka
    (bo ranking polski jest najliczniejszy) i cykl robił się jeszcze bardziej polski. */
 hosts     : ['POL','SWE','DEN','GBR','GER','POL','CZE','SWE','DEN','POL'],
 hostsJun  : ['POL','DEN','SWE'],
 /* OBSADA ELIMINACJI DO CHALLENGE — ile miejsc daje która droga (razem 16).
    Polska: TOP4 Złotego Kasku. Anglia, Szwecja i Dania mają własne eliminacje.
    Reszta świata (Niemcy, Finlandia, Francja, USA, Ukraina, Argentyna, Czechy)
    jedzie w JEDNYCH wspólnych eliminacjach i wyprowadza z nich tylko trzech —
    bo to jednak słabsze żużlowo kraje i inaczej rozwaliłyby balans cyklu. */
 qual      : {POL:4, GBR:3, SWE:3, DEN:3, REST:3},
 restCtry  : ['GER','FIN','FRA','USA','UKR','ARG','CZE'],
 /* ------------------------------------------------------------
    ELIMINACJE DO IMŚJ2 — WŁASNA DROGA JUNIORÓW (nowe 22.08.2026)
    ------------------------------------------------------------
    Zgłoszenie: „dodaj również kwalifikacje na wzór Challenge do IMŚ 2".
    Do tej pory skład cyklu juniorskiego brał się z gołego rankingu OVR
    („nominacja z rankingu juniorów") — czyli komputer wpisywał do stawki
    piętnastu najlepszych i tyle. Nikt niczego nie musiał wywalczyć,
    a gracz nie miał ŻADNEJ drogi do IMŚJ2 poza czekaniem, aż jego OVR
    urośnie. Teraz cykl juniorski ma dokładnie tę samą strukturę co seniorski:
      · kwalifikacja z poprzedniego cyklu (czołowa siódemka, o ile wciąż U21),
      · SGP2 CHALLENGE — turniej finałowy eliminacji, awans dla czterech,
      · miejsce gwarantowane dla Młodzieżowego Mistrza Europy,
      · reszta to dzikie karty Komisji, już z limitami krajowymi.
    Do SGP2 Challenge prowadzą eliminacje krajowe: w Polsce jest nimi
    SREBRNY KASK (jego czterej najlepsi), Anglia, Szwecja i Dania mają
    własne turnieje po trzy miejsca, a pozostałe federacje jadą we
    wspólnych eliminacjach o trzy miejsca — jak u seniorów.
    ------------------------------------------------------------ */
 qualJun   : {POL:4, GBR:3, SWE:3, DEN:3, REST:3},
 junTop    : 7,           // ilu z klasyfikacji IMŚJ2 zachowuje kwalifikację na kolejny rok
 junCh     : 4,           // ilu wchodzi do cyklu z SGP2 Challenge
 junWild   : 4,           // stałe dzikie karty Komisji w cyklu juniorskim
 chJunMul  : 0.30,        // nagrody SGP2 Challenge to ułamek stawek seniorskich
 /* liczebność świata poza Polską (generowana na starcie gry) */
 worldSize : 96
};
