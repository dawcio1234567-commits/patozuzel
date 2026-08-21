/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: TERMINARZ I KOLEJKI
   makeSchedule, playerRoundStatus, settleRound
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1951-2065 oryginału).
   ============================================================ */
/* ============================================================
   5b. TERMINARZ + CHRONOLOGICZNA SYMULACJA SEZONU
   Sezon NIE jest liczony jednym płaskim wzorem. Rozgrywamy 14 kolejek
   po kolei; po każdej z nich aktualizujemy budżety, długi, formę
   zawodników i skład na kolejny mecz.
   ============================================================ */
function makeSchedule(names){
 const arr=shuffle(names), n=arr.length, first=[];
 for(let r=0;r<n-1;r++){
   const pairs=[];
   for(let i=0;i<n/2;i++){
     const a=arr[i], b=arr[n-1-i];
     pairs.push((r+i)%2===0?[a,b]:[b,a]);
   }
   first.push(pairs);
   arr.splice(1,0,arr.pop());                 // rotacja karuzeli
 }
 return [...first, ...first.map(rd=>rd.map(([h,a])=>[a,h]))];   // runda rewanżowa
}
/* Dostępność gracza w danej kolejce (null = jedzie). */
/* Katastrofa: zerwane więzadła krzyżowe albo złamana kość udowa.
   Losowana tabelka opisów, żeby raport nie brzmiał zawsze tak samo. */
const CAT_INJ=[
 'Zerwane więzadła krzyżowe w kolanie — rekonstrukcja z własnego ścięgna.',
 'Złamanie kości udowej z przemieszczeniem — gwóźdź śródszpikowy.',
 'Wieloodłamowe złamanie udu i zerwane więzadła poboczne.',
 'Zerwane więzadła w stawie skokowym i złamanie piszczeli — dwie operacje.'
];
function playerRoundStatus(rd){
 const p=G.p, S=G.S;
 if(p.banSeasons>0)                    return 'DYSKWALIFIKACJA';
 /* CAŁY ROK W GIPSIE — skutek zerwanych więzadeł / złamanego udu z poprzedniego sezonu */
 if(S.longInjury)                      return 'KONTUZJA DŁUGOTERMINOWA — CAŁY SEZON';
 if(S.zeroMatches)                     return 'KARA PREZESA';
 if(S.forcedEnd && rd>=S.forcedFrom)   return 'DECYZJA POZABOISKOWA';
 if(S.walkRound===rd)                  return 'WALKOWER';
 if(S.injLeft>0){ S.injLeft--;         return 'KONTUZJA'; }
 if(S.banLeft>0){ S.banLeft--;         return 'ZAWIESZENIE'; }
 if(S.striking)                        return 'ODMOWA JAZDY — KLUB NIE PŁACI';
 if(!S.injDone && chance(S.injPerRound)){
   S.injDone=true; S.injRound=rd+1;
   /* --- TRZY POZIOMY URAZU ---
      1) katastrofalny (INJ.catP): zerwane więzadła / złamane udo — koniec TEGO
         sezonu i CAŁY KOLEJNY poza torem (p.longInjury),
      2) ciężki (INJ.badP): obojczyk, 8-13 spotkań,
      3) zwykły: 2-7 spotkań. */
   const cat = chance(INJ.catP);
   const bad = cat ? true : chance(INJ.badP);
   S.injCat = cat; S.injBad = bad;
   if(cat){
     S.injCatWhy   = pick(CAT_INJ);
     S.injTotal    = Math.max(1, BAL.rounds-rd);        // reszta sezonu, do ostatniej kolejki
     S.injLeft     = S.injTotal-1;
     S.injDmg      = R(INJ.catDmgMin, INJ.catDmgMax);
     S.forcedEnd   = true;                              // play-off, IMP, DMPJ — wszystko odpada
     S.forcedFrom  = Math.min(S.forcedFrom, rd);
     p.longInjury  = Math.max(p.longInjury||0, INJ.catSeasons);
     p.longInjuryWhy = S.injCatWhy;
     S.longInjuryNew = S.injCatWhy;
     S.longInjuryDmg = S.injDmg;
   } else {
     S.injTotal = bad ? R(INJ.badMin, INJ.badMax) : R(INJ.outMin, INJ.outMax);
     S.injLeft  = S.injTotal-1;
     S.injDmg   = bad ? R(INJ.dmgMin+1, INJ.dmgMax+2) : R(INJ.dmgMin, INJ.dmgMax);
   }
   p.ovr=cl(p.ovr-S.injDmg,1,99);
   logOvr(-S.injDmg, (cat?'kontuzja katastrofalna':bad?'poważna kontuzja':'kontuzja')+' w '+(rd+1)+'. kolejce');
   const me=G.riders.find(r=>r.me); if(me) me.ovr=cl(me.ovr-S.injDmg,1,99);
   return cat ? 'ZERWANE WIĘZADŁA / ZŁAMANE UDO' : 'KONTUZJA';
 }
 return null;
}
/* Rozliczenie gracza po kolejce + próg buntu na następny mecz. */
function settleRound(rd, myClub){
 const p=G.p, S=G.S, club=clubByName(myClub); if(!club) return;
 const L=G.myLog[G.myLog.length-1];
 if(L && L.round===rd+1 && L.rode && L.me && !S.noEarnings && p.banSeasons===0){
   const owed=Math.round((L.me.pts+L.me.bon)*p.contract.rate*S.rateMul);
   const ratio=payRatioOf(club);
   const paid=Math.round(owed*ratio), unpaid=owed-paid;
   p.budget+=paid; p.career.earned+=paid; club.budget-=paid;
   if(unpaid>0) club.debt+=unpaid;
   S.owed+=owed; S.paid+=paid;
   L.owed=owed; L.paid=paid;
 }
 // klub może spłacić zaległości w trakcie sezonu — wtedy wracasz do składu
 const eager = S.striking ? 2.2 : 1;          // gdy odmawiasz jazdy, prezes nagle znajduje kasę
 if(club.debt>0 && club.budget>0 && chance(cl((8+club.budget/150000)*eager,5,80))){
   const pay=Math.min(club.debt, Math.round(club.budget*RF(0.10,0.35)*eager));
   if(pay>0){ club.debt-=pay; club.budget-=pay; p.budget+=pay; p.career.earned+=pay; S.paid+=pay;
     S.payLog.push({round:rd+1, amount:pay, left:club.debt}); }
 }
 if(L) L.debt=club.debt;
 // BUNT: decyzja dotyczy KOLEJNEGO meczu
 const th=refusalThreshold(p.age), ch=refusalChance(p.age, club.debt);
 if(club.debt<th){
   if(S.striking){ S.striking=false; S.strikeLog.push({round:rd+2, back:true}); }
 } else if(!S.striking && chance(ch)){
   S.striking=true; S.strikeLog.push({round:rd+2, back:false, debt:club.debt, ch});
 }
 if(S.striking) S.strikeRounds++;
}
/* Kasa wszystkich klubów po kolejce. */
function clubsAfterRound(){
 allClubs().forEach(c=>{
   c.budget += Math.round(c.incRound||0);
   const cost=Math.round(c.costRound||0);
   if(c.budget>=cost) c.budget-=cost;
   else { const canPay=Math.max(0,c.budget); c.arr=(c.arr||0)+(cost-canPay); c.budget-=canPay; }
   if((c.arr||0)>0 && c.budget>0 && chance(35)){
     const pay=Math.min(c.arr, Math.round(c.budget*RF(0.10,0.35)));
     c.arr-=pay; c.budget-=pay;
   }
 });
}
