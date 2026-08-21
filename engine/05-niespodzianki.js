/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: NIESPODZIANKI
   rollRoundSurprise — 5% na kolejkę
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 330-381 oryginału).
   ============================================================ */
/* ============================================================
   NIEOCZEKIWANE ZDARZENIA — RZUT KOŚCIĄ PRZED KAŻDĄ KOLEJKĄ
   Progi w SURPRISE (data.js): pięć typów po 1%, łącznie 5% na kolejkę.
   Zwraca opis tego, co się stało, i ustawia flagi na TĘ JEDNĄ kolejkę.
   ============================================================ */
function surpriseScale(){
 const S=SURPRISE, sum=S.halfSquad+S.jumpIn+S.formUp+S.formDown+S.dropOut;
 const cap=S.total||sum;
 return sum>cap ? cap/sum : 1;                 // nikt nie przekroczy sufitu, choćby ustawił 9%
}
function rollRoundSurprise(rd, clubName, meR){
 const S=SURPRISE, k=surpriseScale();
 const out={round:rd+1, forceIn:false, forceOut:null, hidden:[], log:null, kind:null};
 if(!clubName || !meR) return null;
 /* Kolejność ma znaczenie: jeden typ na kolejkę, żeby suma szans naprawdę
    wynosiła 5%, a nie 5% razy pięć. */
 if(chance(S.halfSquad*k)){
   const sq=squadOf(clubName).filter(r=>!r.me && !r.inj && !r.strike);
   const n=Math.min(sq.length, Math.max(1, Math.round(sq.length*(S.halfShare||0.5))));
   out.hidden=shuffle(sq).slice(0,n);
   out.hidden.forEach(r=>{ r.inj=1; });
   out.forceIn=true; out.kind='halfSquad';
   out.log='Kolejka '+(rd+1)+': POŁOWA SKŁADU KONTUZJOWANA ('+n+' zawodników poza torem — kraksa na treningu, grypa i dwie kontuzje z poprzedniego meczu). Trener nie ma z kogo układać siódemki — wskakujesz do składu.';
   return out;
 }
 if(chance(S.jumpIn*k)){
   out.forceIn=true; out.kind='jumpIn';
   out.log='Kolejka '+(rd+1)+': WSKOCZYŁEŚ DO SKŁADU. Ktoś nie dojechał, komuś zabrali licencję na tydzień, ktoś inny pokłócił się z prezesem. Telefon o 22:00, rano pakujesz bus.';
   return out;
 }
 if(chance(S.formUp*k)){
   const d=R(S.formUpMin, S.formUpMax);
   meR.form = cl((meR.form||0)+d, -12, 12);
   out.forceIn=true; out.kind='formUp';
   out.log='Kolejka '+(rd+1)+': NAGŁY WZROST FORMY (+'+d+' pkt dyspozycji). Silnik nagle chodzi, tor nagle pasuje, taśma nagle puszcza w dobrym momencie — trener wpisuje cię do składu.';
   return out;
 }
 if(chance(S.formDown*k)){
   const d=R(S.formDownMin, S.formDownMax);
   meR.form = cl((meR.form||0)-d, -12, 12);
   out.kind='formDown';
   out.log='Kolejka '+(rd+1)+': NAGŁY ZJAZD FORMY (-'+d+' pkt dyspozycji). Nic się nie zmieniło w sprzęcie ani w głowie, a jedziesz o pół sekundy wolniej. Skład układa się bez ciebie.';
   return out;
 }
 if(chance(S.dropOut*k)){
   out.forceOut='NIEOCZEKIWANIE POZA SKŁADEM'; out.kind='dropOut';
   out.log='Kolejka '+(rd+1)+': NAGLE WYPADASZ ZE SKŁADU. Bez powodu, bez rozmowy, bez uzasadnienia — dowiedziałeś się z komunikatu na stronie klubu.';
   return out;
 }
 return null;
}
