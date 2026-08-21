/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: WIELKI MECZ
   Wybór meczu sezonu, płacz, tor/zębatka/mechanik
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 4538-4654 oryginału).
   ============================================================ */
/* ============================================================
   9. WIELKI MECZ — TRYB JAZDY NA ŻYWO (patch 22.08.2026)
   ------------------------------------------------------------
   Do tej pory gra była w całości „jedno kliknięcie = jeden sezon".
   Raz w roku, przed NAJWAŻNIEJSZYM spotkaniem sezonu, gra zatrzymuje się
   i pyta, co chcesz z nim zrobić:
     · PRZESYMULOWAĆ — jak zawsze, komputer liczy wszystko za ciebie,
     · POJECHAĆ      — siadasz na motocyklu i podejmujesz decyzje: zębatka
       przed każdym biegiem, linia jazdy co łuk, awantury w parku maszyn,
     · ROZPŁAKAĆ SIĘ — i nie zadzwonić do ojca. Konsekwencje poniżej.
   Najważniejszy mecz to (wg wagi): FINAŁ > DWUMECZ O UTRZYMANIE >
   PÓŁFINAŁ / MECZ O 3. MIEJSCE > PLAY-DOWN, a gdy w fazie play-off nie ma
   dla ciebie nic — ostatnia runda cyklu indywidualnego (GP, Challenge, IMP).
   ============================================================ */
const BIG_RANK = {
 'OSTATNIA KOLEJKA — MECZ O PLAY-OFF':1, 'PLAY-DOWN':1, 'PÓŁFINAŁ':2, 'MECZ O 3. MIEJSCE':2,
 'DWUMECZ O UTRZYMANIE':3, 'FINAŁ':4,
 'IMP':3, 'SGP CHALLENGE':3, 'GRAND PRIX':4, 'IMŚJ2':3, 'SGP2 CHALLENGE':3
};
const BIG_WHY = {
 'OSTATNIA KOLEJKA — MECZ O PLAY-OFF':'Ostatnia kolejka rundy zasadniczej, a wy wisicie na granicy czwórki. Wygracie — jedziecie play-off. Przegracie — jedziecie play-down i całą zimę tłumaczycie to kibicom.',
 'PÓŁFINAŁ':'Wygrywasz — jedziesz o mistrzostwo. Przegrywasz — jedziesz o brąz i wszyscy zapominają.',
 'FINAŁ':'Finał. Jeden dwumecz dzieli cię od tego, żeby twoje nazwisko zostało w tabelach na zawsze.',
 'MECZ O 3. MIEJSCE':'Brązowy medal. Nikt o nim nie pamięta, dopóki go nie ma w gablocie.',
 'PLAY-DOWN':'Przegracie, a zjedziecie do dwumeczu o utrzymanie. Wtedy robi się naprawdę nieprzyjemnie.',
 'DWUMECZ O UTRZYMANIE':'Przegrany spada. Nie „może spaść" — spada. Klub, twoja stawka, twój bus, wszystko.',
 'GRAND PRIX':'Ostatnia runda cyklu. Tu się rozdaje mistrzostwo świata i tu się je oddaje.',
 'SGP CHALLENGE':'Czterech pierwszych jedzie w przyszłym roku w Grand Prix. Piąty ogląda w telewizji.',
 'SGP2 CHALLENGE':'Czterech pierwszych wchodzi do cyklu juniorskiego mistrzostw świata.',
 'IMP':'Ostatni turniej finałowy Indywidualnych Mistrzostw Polski. Tu się kończy sezon.',
 'IMŚJ2':'Ostatnia runda mistrzostw świata juniorów. Drugi raz szesnastu lat nie będziesz miał.'
};

/* Czy klub Gracza wisi na granicy czwórki przed ostatnią kolejką? */
function playoffBubble(T, myClub){
 if(!T || !myClub) return false;
 const tab=T.slice().sort((a,b)=> b.pts-a.pts || (b.sf-b.sa)-(a.sf-a.sa) || b.sf-a.sf);
 const pos=tab.findIndex(x=>x.name===myClub)+1;
 return pos>=3 && pos<=6;
}
/* ============================================================
   NAPRAWA (patch 21.08.2026, Sprint 1): JAZDA W WIELKIM MECZU BEZ KLUBU.
   ------------------------------------------------------------
   Gracz, który wyjechał z parku maszyn w trakcie zawodów albo w inny sposób
   zerwał kontrakt (płacz przed meczem, przymusowe zakończenie sezonu),
   formalnie NIE MA BARW, w których mógłby wystartować — a silnik i tak
   podsuwał mu ekran „przesymuluj / pojedź / rozpłacz się" i wpuszczał go na
   tor w składzie klubu, który już go nie ma w kadrze. Stąd brały się
   zgłoszenia typu „zerwałem umowę w czerwcu, a we wrześniu jadę finał".
   Teraz jest to twardy warunek, sprawdzany w TRZECH miejscach:
     · przy pytaniu o wielki mecz (bigMatchAsk),
     · przy sprawdzaniu, czy Gracz wjeżdża do składu (bigMatchRides),
     · przy odbiorze decyzji — nawet ręcznie podstawione 'ride' spada do 'sim'.
   ============================================================ */
function hasLiveContract(){
 const p=G&&G.p, S=(G&&G.S)||{};
 if(!p) return false;
 if(S.cried) return false;                       // płacz w parku maszyn = rozwiązana umowa
 if(S.contractBroken || S.leftPits || S.quitPits) return false;   // wyjazd z parku maszyn w trakcie zawodów
 if(S.forcedEnd || S.noClub) return false;       // sezon zamknięty przymusowo, brak przynależności klubowej
 const club = (typeof clubOf==='function') ? clubOf(p) : null;
 if(!club) return false;                         // nie ma klubu — nie ma czym jechać
 const meR = G.riders && G.riders.find(r=>r.me);
 if(meR && meR.out) return false;                // skreślony z kadry na resztę sezonu
 return true;
}
/* Czy TEN mecz jest meczem klubowym (dwumecz/kolejka), a nie turniejem indywidualnym. */
const isClubEvent = info => !!(info && (info.kind==='tie' || info.myClub));

/* --- Czy Gracz w ogóle wjeżdża do składu na ten dwumecz? --- */
function bigMatchRides(myClub, ctx){
 if(!myClub || !ctx) return false;
 if(!hasLiveContract()) return false;   // ← zerwana umowa: nie ma go w żadnym składzie
 const bias = ctx.bias && ctx.bias.club===myClub ? ctx.bias : null;
 const L = bestLineup(myClub, bias, 0, false);
 if(!L) return false;
 return Object.values(L).some(r=>r && r.id===ctx.meId);
}

/* --- PŁACZ PRZED MECZEM (i brak telefonu do ojca) --- */
function bigCry(){
 const p=G.p, S=G.S, club=clubOf(p);
 S.cried=true; S.forcedEnd=true; S.noRenew=true;
 S.forcedFrom = Math.min(S.forcedFrom==null?99:S.forcedFrom, BAL.rounds);
 p.budget -= BIGM.cryFine; S.fines=(S.fines||0)+BIGM.cryFine;
 S.bigProf=(S.bigProf||0)-BIGM.cryProf; S.bigProfWhy='płacz w parku maszyn przed najważniejszym meczem sezonu';
 p.prof = cl(p.prof-BIGM.cryProf,0,99);
 S.bigMed=(S.bigMed||0)+9; S.bigMedWhy='nagranie z płaczem ma dwa miliony wyświetleń';
 p.med  = cl(p.med+9,0,99);
 p.loyalty = cl(p.loyalty-40,0,100);
 S.atm = cl(S.atm-25,0,100);
 const meR=G.riders.find(r=>r.me); if(meR) meR.out=true;
 S.cryNote = 'PŁACZ PRZED NAJWAŻNIEJSZYM MECZEM SEZONU: rozkleiłeś się w parku maszyn, przy sprzęcie, '+
  'przy kamerze i przy dwóch tysiącach ludzi na trybunie. Telefonu do ojca nie wykonałeś. '+
  'Nie dojechałeś sezonu do końca'+(club?', '+club.name+' rozwiązuje z tobą umowę':'')+', '+
  'kara umowna '+zl(BIGM.cryFine)+', profesjonalizm -'+BIGM.cryProf+'.';
 (G.S.notesBig=G.S.notesBig||[]).push(S.cryNote);
 return S.cryNote;
}

/* --- PYTANIE PRZED WIELKIM MECZEM ---
   Zwraca 'sim' | 'ride' | 'cry'. Pyta najwyżej dwa razy w sezonie i tylko
   wtedy, gdy nowy mecz jest WAŻNIEJSZY od tego, o który już pytaliśmy. --- */
function* bigMatchAsk(info, ctx){
 const S=G.S;
 if(!S || S.cried) return 'sim';
 /* TWARDY WARUNEK (Sprint 1): mecz klubowy wymaga klubu i ważnej umowy,
    a przymusowo zamknięty sezon nie pozwala nawet na turniej indywidualny. */
 if(S.forcedEnd) return 'sim';
 if(isClubEvent(info) && !hasLiveContract()) return 'sim';
 const rank = BIG_RANK[info.stage]||0;
 if(!rank) return 'sim';
 if(rank <= (S.bigRank||0)) return 'sim';
 if((S.bigAsked||0) >= 3) return 'sim';
 if(info.kind==='tie' && !bigMatchRides(info.myClub, ctx)) return 'sim';
 S.bigRank=rank; S.bigAsked=(S.bigAsked||0)+1; S.bigStageName=info.stage;
 const dec = yield {ui:'big', big:{
   kind:info.kind, stage:info.stage, title:info.title||info.stage,
   opp:info.opp||null, myClub:info.myClub||null, lk:info.lk||null,
   why: BIG_WHY[info.stage]||'Najważniejszy mecz tego sezonu.',
   note:info.note||null
 }};
 const a = (dec&&dec.a) || 'sim';
 if(a==='cry'){ bigCry(); return 'cry'; }
 // ostatnia bramka: między pytaniem a odpowiedzią umowa mogła zniknąć
 if(a==='ride' && isClubEvent(info) && !hasLiveContract()) return 'sim';
 return a==='ride' ? 'ride' : 'sim';
}

/* ============================================================
   9a. TOR, ZĘBATKA I MECHANIK
   ------------------------------------------------------------
   Przyczepność toru zmienia się z biegu na bieg (polewaczka, równiarka,
   dwadzieścia motocykli, słońce). Do każdego stanu toru pasuje inna
   zębatka — im więcej przyczepności, tym dłuższe przełożenie ma sens.
   Idealnej zębatki NIE WIDZISZ. Widzisz tylko tor i to, co mówi mechanik,
   a mechanik jest dokładnie tak dobry, jak ci, za których zapłaciłeś.
   ============================================================ */
function liveGrip(prev){
 if(prev==null) return R(0,5);
 return cl(prev + (chance(60) ? R(-1,1) : R(-2,2)), 0, 5);
}
function liveIdeal(grip){ return cl(grip + (chance(28) ? (chance(50)?1:-1) : 0), 0, 5); }
function liveMech(ideal, cur){
 const p=G.p;
 const acc = BIGM.mechMin + (BIGM.mechMax-BIGM.mechMin)*(cl(p.mech,1,99)/99);
 const ok  = chance(acc);
 const sug = ok ? ideal : cl(ideal + pick([-3,-2,-1,1,2,3]), 0, 5);
 const txt = sug===cur ? pick(BIGM.mechStay) : pick(BIGM.mechMove).replace('{g}','zębatkę '+sug);
 return {sug, txt, acc:Math.round(acc)};
}
const liveFit = (gear, ideal) => cl(Math.abs(gear-ideal), 0, 5);
