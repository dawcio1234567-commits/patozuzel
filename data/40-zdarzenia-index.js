/* ============================================================
   PATO-ŻUŻEL :: ZDARZENIA :: SKLEJKA PUL
   Buduje EVENTS i WINTER_EVENTS z pul tematycznych. Ładować PO wszystkich pulach.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 660, 2083, 2106, 2714 oryginału).
   ============================================================ */
/* Kolejność MA ZNACZENIE: rollEvent()/rollWinterEvent() losują z tej listy,
   a testy regresji opierają się na identycznej kolejności pul.
   Dodajesz nową pulę? Dopisz plik w index.html PRZED tym modułem
   i dorzuć nazwę do właściwego concat() poniżej. */

const EVENTS = [].concat(
  EV_MEDIA,
  EV_TOR,
  EV_ZYCIE,
  EV_KASA,
  EV_SPRZET,
  EV_ZDROWIE,
  EV_MECZE,
  EV_TRANSFERY,
  EV_PATOLOGIE,
  EV_MESSENGER,
  EV_KONTUZJOWANY,
  EV_NOWE2026
);

const WINTER_EVENTS = [].concat(
  WEV_PODSTAWA,
  WEV_PATOLOGIE,
  WEV_POZA_TOREM,
  WEV_Z_LATA,
  WEV_UNIWERSALNE,
  WEV_MESSENGER,
  WEV_KONTUZJOWANY,
  WEV_NOWE2026
);
