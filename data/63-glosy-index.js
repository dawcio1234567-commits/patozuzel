/* ============================================================
   PATO-ŻUŻEL :: GŁOSY PO SEZONIE :: SKLEJKA
   Buduje TALK. Ładować PO wszystkich pulach głosów.
   ------------------------------------------------------------
   Moduł wydzielony z data.js (linie 3005, 3871 oryginału).
   ============================================================ */
/* TALK powstaje ze sklejenia pul tematycznych. Kolejność kluczy nie ma
   znaczenia dla silnika (talkPick czyta po nazwie warunku), ale trzymamy
   ją zgodną z oryginałem. */

const TALK = Object.assign({}, TALK_OCENY, TALK_MEDIA, TALK_KLUB);
