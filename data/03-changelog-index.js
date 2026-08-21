/* ============================================================
   PATO-ŻUŻEL :: DANE :: CHANGELOG — SKLEJKA
   Buduje CHANGELOG. Ładować PO obu plikach changeloga.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 14, 169 oryginału).
   ============================================================ */
/* Changelog jest sklejany z dwóch plików, żeby dopisanie nowego wpisu
   nie wymagało otwierania całego archiwum. */

const CHANGELOG = [].concat(CHANGELOG_NOWY, CHANGELOG_ARCHIWUM);
