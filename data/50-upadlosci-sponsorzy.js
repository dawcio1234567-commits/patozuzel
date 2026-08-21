/* ============================================================
   PATO-ŻUŻEL :: DANE :: UPADŁOŚCI I SPONSORZY TYTULARNI
   BANKRUPTCY, SPONSORS_A, SPONSORS_B, SPON.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 2715-2779 oryginału).
   ============================================================ */

/* --- PROGI UPADŁOŚCI (jedno miejsce do kręcenia gałką) ---
   Uwaga na skalę: ARESZTOWANIE PREZESA losuje się teraz z szansą ok. 1,5% na klub
   na sezon (patrz clubEconomy() w engine.js), a klubów jest 24. Przy onArrest:40
   wychodzi z tego średnio jedna upadłość na kilka sezonów — stare szyldy żyją dłużej,
   a zniknięcie klubu z mapy znowu jest wydarzeniem, a nie coroczną rutyną. */
const BANKRUPTCY={
 onArrest  : 40,         // % szans na upadłość po ARESZTOWANIU PREZESA
 onSpoloss : 100,        // % szans po UTRACIE SPÓŁKI SKARBU PAŃSTWA z dziurą w kasie
 deepMinus : 0.25,       // "potężny minus" = budżet poniżej -25% kosztów sezonu
 debtLimit : 3000000,    // powyżej tego długu (3 mln zł) wchodzi syndyk...
 onDebt    : 50,         // ...z taką szansą (przy ujemnym budżecie)
 onSponsorRun : 75       // % szans na syndyka, gdy sponsor z Grupy B uciekł i została dziura
};

/* ============================================================
   SPONSORZY TYTULARNI — DWIE LIGI, DWA ŚWIATY
   ------------------------------------------------------------
   Klub może mieć w nazwie od 1 do 3 sponsorów tytularnych. Nazwa składa się
   z ich nazw doklejonych PRZED nazwą bazową klubu, np.:
       "Złomrex MojeKajmany META Gniezno"
   Obsługa siedzi w clubEconomy() (silnik) i applyPendingSponsors() (nowy rok).

   GRUPA A — bieda, ale stabilnie. Mały zastrzyk gotówki co sezon, zero ryzyka.
   GRUPA B — oszuści. Ogromny hajs przy wejściu, po 1-2 sezonach ucieczka,
             potężna dziura w kasie i syndyk. Uciekinier ląduje w
             G.bannedSponsors i NIGDY nie wraca do gry.
   ============================================================ */
const SPONSORS_A=[
 'Marne Polskie Kondomy','Miliard TEAM','Wenus RTV AGD','Punkt G','Judyta','Bractwo','Złomrex',
 'Dundersztyc','Murzynianka','ZGP Komputery','MojeKajmany','Retard','Polska Grupa Biedy',
 'Grupa Kłopoty','H. Nielot Usługi Pogrzebowe','Eko-Dno','Salami Kabanos','Drewnospan','Cell-slow',
 'Farma Polskie Folie','Dusz-pel','Półbax','Zdu-pol','Aluminium','Tor-Złom','Pogo','Mróz-Pol',
 'Kantor w Budzie','Amator','Błotos','Siko','Kałum','Wena','Najs','Globus'
];
const SPONSORS_B=[
 'Piusa X','Polnord','AmberGold','Browary Starego','Morawiecki','Jeanette','Trabant','Video-Brud',
 'Twoje Guantanamo','składypapy.pl','Guns&Roses Recycling','KJG Company','Auto Nie-Gwarant',
 'Aferti Financial','Diamentowe Czeki Nawrota','Get Lost','eFrajer','Wał-ron','Kredyty Pętla',
 'Kapi-Wał','Fin-Zawał','Tax-Off','Cipciarz.com','ZOOleszczyk','Bory-Szef','Węglo-Brak','H-Zero',
 '7Z','Opatrzność Finanse','Ślepy Traf Bookmacher','Fundusz Bezprawia'
];
const SPON={
 max        : 3,          // maksymalnie tyle sponsorów tytularnych w nazwie
 addBase    : 30,         // % szans na dopięcie KOLEJNEGO sponsora w danym sezonie
 addPerHave : 11,         // ...minus tyle p.p. za każdego, którego klub już ma
 addPoor    : 12,         // +tyle p.p., gdy klub jest pod kreską (desperacja zarządu)
 bChance    : 5,          // % — jeżeli już dopina sponsora, to z takim prawdopodobieństwem z GRUPY B
                          //     (celowo bardzo mało: jedna afera na kilka sezonów w całej lidze,
                          //      inaczej syndyk chodziłby po klubach co roku)
 /* GRUPA A: mały, przewidywalny zastrzyk co sezon (skalowany poziomem ligi) */
 aCash      : [0.010, 0.045],
 /* GRUPA B: wielkie wejście, a potem dziura */
 bCash      : [0.55, 1.35],   // × roczne wpływy przeciętnego klubu ligi
 bLife      : [1, 2],         // po tylu sezonach uciekają
 bHole      : [1.15, 2.30],   // dziura zostawiona w kasie = tyle × kwota wejścia
 bArrShare  : 0.35,           // ...z czego tyle ląduje jako zaległości wobec kadry
 /* KARA ZA BYCIE SŁUPEM OGŁOSZENIOWYM (kumulatywnie, wg liczby sponsorów) */
 ovrPen     : [0, 0, -2, -5],
 /* Zawodnik z profesjonalizmem powyżej tej wartości nie podpisze z klubem,
    który ma 2-3 sponsorów tytularnych w nazwie (patrz makeOffers). */
 profBlock  : 50,
 profBlockFrom : 2
};
