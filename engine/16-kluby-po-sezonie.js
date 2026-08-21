/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: KLUBY PO SEZONIE
   clubEconomy, sponsorzy tytularni, zmiany nazw
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 2260-2500 oryginału).
   ============================================================ */
/* ============================================================
   5b-bis. PATO-EKOSYSTEM: CO SIĘ DZIEJE Z KLUBAMI PO SEZONIE
   Gospodarność (wpływy kontra wydatki na kontrakty) + rzut kością
   na wydarzenia, które w polskim żużlu zdarzają się naprawdę.
   ============================================================ */
function applySquadOvr(c, d){
 if(!d) return;
 /* Wspólna korekta po sezonie ROZJEŻDŻA się na zawodnikach (gauss), a potem
    i tak przechodzi anty-klon — bez tego cała kadra dostawała identyczną
    liczbę i po dwóch sezonach połowa drużyny miała ten sam OVR. */
 squadOf(c.name).forEach(r=>{ if(r.me) return; r.ovr=cl(Math.round(r.ovr+d+gauss(0,1.4)),1,99); });
 dedupeSquadOvr(c.name);
 c.ovr=squadStrength(c.name);
}
/* ============================================================
   5b-ter. SPONSORZY TYTULARNI — „ZŁOMREX MOJEKAJMANY META GNIEZNO"
   ------------------------------------------------------------
   Klub trzyma listę `c.titles` = [{n, grp:'A'|'B', years, left, cash}] oraz
   nazwę bazową `c.base` (bez sponsorów). Pełna nazwa to sponsorzy doklejeni
   PRZED bazą. Zmiana nazwy wchodzi w życie DOPIERO W NOWYM ROKU
   (applyPendingSponsors() z nextYear/skipYear/mechanicPath) — gdybyśmy
   przechrzcili klub w trakcie rozliczania sezonu, promotionsRelegations()
   i tabele z runPhase (trzymające NAZWY, nie referencje) przestałyby się
   zgadzać i klub wypadłby z awansów/spadków.

   GRUPA A: mały przelew co sezon, zero ryzyka.
   GRUPA B: ogromne wejście, po 1-2 sezonach ucieczka, dziura w kasie,
            zaległości wobec kadry i (z dużą szansą) syndyk. Uciekinier
            ląduje w G.bannedSponsors i nigdy nie wraca do gry.
   Każdy sponsor powyżej pierwszego to kara do OVR klubu (SPON.ovrPen).
   ============================================================ */
function clubTitles(c){ if(!c) return []; if(!Array.isArray(c.titles)) c.titles=[]; return c.titles; }
function titleCount(c){ return clubTitles(c).length; }
function clubBaseName(c){ if(!c.base) c.base=c.name; return c.base; }
function composeClubName(c){
 const t=clubTitles(c).map(s=>s.n).filter(Boolean);
 return (t.length ? t.join(' ')+' ' : '') + clubBaseName(c);
}
function sponsorPen(n){ return SPON.ovrPen[cl(n,0,SPON.ovrPen.length-1)]||0; }
function sponsorInUse(name){ return allClubs().some(c=>clubTitles(c).some(s=>s.n===name)); }
function freeSponsors(pool){
 const ban=new Set(G.bannedSponsors||[]);
 return (pool||[]).filter(n=>n && !ban.has(n) && !sponsorInUse(n));
}
/* Zmiana nazwy klubu w CAŁEJ grze: kadra, Gracz, mapa starych nazw. */
function renameClub(c, nn){
 const old=c.name;
 if(!nn || nn===old) return null;
 let uniq=nn, g=2;
 while(allClubs().some(x=>x!==c && x.name===uniq)) uniq=nn+' '+(g++);
 c.name=uniq;
 G.riders.forEach(r=>{ if(r.club===old) r.club=uniq; });
 if(G.p && G.p.club===old) G.p.club=uniq;
 G.renamed=G.renamed||{}; G.renamed[old]=uniq;
 return {old, now:uniq};
}
function applyPendingSponsors(){
 const out=[];
 G.renamed={};
 allClubs().forEach(c=>{ const r=renameClub(c, composeClubName(c)); if(r) out.push(r); });
 G.sponsorRenames=out;
 return out;
}
/* Jeden sezon życia sponsorskiego jednego klubu. Zwraca {d, bkWhy}. */
function sponsorSeason(c, k, log){
 let d=0;
 const titles=clubTitles(c);
 clubBaseName(c);
 const before=titles.length;
 const inc=LEAGUE_INC[k]||LEAGUE_INC.KL;

 /* --- 1) PRZELEWY OD OBECNYCH + TYKAJĄCY ZEGAR GRUPY B --- */
 const runaways=[];
 for(let i=titles.length-1;i>=0;i--){
   const s=titles[i];
   s.years=(s.years||0)+1;
   if(s.grp==='A'){
     const cash=Math.round(inc*RF(SPON.aCash[0],SPON.aCash[1]));
     c.budget+=cash; s.paid=(s.paid||0)+cash;
   } else {
     if(s.left==null) s.left=R(SPON.bLife[0],SPON.bLife[1]);
     s.left--;
     if(s.left<=0){ titles.splice(i,1); runaways.push(s); }
   }
 }

 /* --- 2) UCIECZKA OSZUSTA: dziura w kasie, zaległości, syndyk --- */
 let bkWhy=null;
 runaways.forEach(s=>{
   /* „Potężny dług i ujemny budżet" musi być POTĘŻNY i musi być UJEMNY —
      inaczej bogaty klub wchłaniał ucieczkę oszusta bez mrugnięcia okiem
      i syndyk nigdy nie wchodził. Dziura jest więc nie mniejsza niż to,
      co potrzebne, żeby zejść pod próg BANKRUPTCY.deepMinus. */
   const cost=Math.max(1, c.seasonCost||inc);
   const minHole=Math.max(0,c.budget) + Math.round(Math.max(300000, cost*BANKRUPTCY.deepMinus*1.25));
   const hole=Math.max(Math.round((s.cash||inc*0.8)*RF(SPON.bHole[0],SPON.bHole[1])), minHole);
   const arr =Math.round(hole*SPON.bArrShare);
   c.budget-=hole;
   c.arr=(c.arr||0)+arr;
   G.bannedSponsors=G.bannedSponsors||[];
   if(!G.bannedSponsors.includes(s.n)) G.bannedSponsors.push(s.n);
   log.push({club:c.name, lk:k, t:'SPONSOR TYTULARNY UCIEKŁ Z KASĄ', d:'−'+zl(hole), good:false,
     x:s.n+' zniknął po '+s.years+(s.years===1?' sezonie':' sezonach')+': konta wyczyszczone, faktury '+
       'niezapłacone, prezes dowiedział się z portalu. Dziura '+zl(hole)+', zaległości wobec kadry +'+zl(arr)+
       '. Od nowego sezonu klub nazywa się '+composeClubName(c)+
       '. Firma trafia na czarną listę i nigdy już nie pojawi się w tej lidze.'});
   if(c.budget<0 && chance(BANKRUPTCY.onSponsorRun))
     bkWhy='Sponsor tytularny '+s.n+' uciekł z kasą i zostawił dziurę '+zl(-c.budget)+'. Wierzyciele nie czekali na wyjaśnienia.';
 });

 /* --- 3) NOWY SPONSOR TYTULARNY (od 1 do 3 naraz) --- */
 if(titles.length<SPON.max){
   let ch=SPON.addBase - titles.length*SPON.addPerHave;
   if(c.budget<=0 || (c.arr||0)>0) ch+=SPON.addPoor;      // desperacja zarządu
   if(chance(cl(ch,1,80))){
     const poolB=freeSponsors(SPONSORS_B), poolA=freeSponsors(SPONSORS_A);
     const wantB=chance(SPON.bChance);
     const grp = (wantB && poolB.length) ? 'B' : (poolA.length ? 'A' : null);
     if(grp==='A'){
       const n=pick(poolA), cash=Math.round(inc*RF(SPON.aCash[0],SPON.aCash[1]));
       c.budget+=cash;
       titles.push({n, grp:'A', years:0, cash, paid:cash});
       log.push({club:c.name, lk:k, t:'NOWY SPONSOR TYTULARNY', d:'+'+zl(cash), good:true,
         x:n+' wchodzi do nazwy klubu — od nowego sezonu: '+composeClubName(c)+
           '. Pieniędzy tyle, co kot napłakał, ale przelew przychodzi na czas i będzie przychodził co roku.'});
     } else if(grp==='B'){
       const n=pick(poolB), cash=Math.round(inc*RF(SPON.bCash[0],SPON.bCash[1]));
       c.budget+=cash;
       titles.push({n, grp:'B', years:0, left:R(SPON.bLife[0],SPON.bLife[1]), cash});
       log.push({club:c.name, lk:k, t:'WIELKI SPONSOR TYTULARNY — KASA JAK Z BAJKI', d:'+'+zl(cash), good:true,
         x:n+' wykłada '+zl(cash)+' i wchodzi do nazwy: '+composeClubName(c)+
           '. Prezes mówi o przełomie, księgowa o zaliczkach, a nikt nie pytał, skąd te pieniądze.'});
     }
   }
 }

 /* --- 4) KARA ZA BYCIE SŁUPEM OGŁOSZENIOWYM --- */
 const after=titles.length;
 const pd=sponsorPen(after)-sponsorPen(before);
 if(pd){
   d+=pd;
   log.push({club:c.name, lk:k, t:(pd<0?'SZATNIA O KOLEJNYM SPONSORZE':'JEDEN SZYLD MNIEJ'),
     d:(pd>0?'+':'')+pd+' OVR', good:pd>0,
     x: pd<0
       ? 'Kevlar wygląda jak tablica ogłoszeń, a nazwa klubu nie mieści się w tabeli. '+after+
         ' sponsorów tytularnych to łącznie '+sponsorPen(after)+' OVR — szatnia wie, że to nie potęga, tylko desperacja zarządu.'
       : 'Nazwa znowu mieści się w jednej linijce. Kadra odetchnęła ('+(pd>0?'+':'')+pd+' OVR).'});
 }
 c.pendingName=composeClubName(c);
 return {d, bkWhy};
}

function clubEconomy(){
 const log=[];
 LKEYS.forEach(k=>{
  const ord=(G.phase[k]&&G.phase[k].order)||[];
  G.leagues[k].clubs.forEach(c=>{
   const idx=ord.indexOf(c.name), pos = idx>=0 ? idx+1 : 5;
   const inc=c.seasonIncome||LEAGUE_INC[k], cost=c.seasonCost||inc;
   const prize=Math.round(LEAGUE_INC[k]*(0.34-0.042*(pos-1)));      // nagrody, frekwencja, TV
   c.budget+=prize;
   const bal=inc+prize-cost;
   let d=0, why=null;
   if(bal < -0.08*inc){                                             // przepłacone kontrakty
     d -= 1+Math.min(6, Math.round(-bal/(inc*0.15)));
     c.budget -= Math.round(Math.min(-bal*0.35, Math.max(0,c.budget)*0.5));
     why='przepłacone kontrakty ('+zl(-bal)+' pod kreską)';
   } else if(bal > 0.10*inc && pos<=4){                             // sukces + rozsądek
     d += 1+Math.min(5, Math.round(bal/(inc*0.22)));
     why='wyniki i zdrowe finanse (+'+zl(bal)+')';
   } else if(bal>0) d += R(0,1);
   if(pos<=2) d+=R(0,2);
   if(pos>=7) d-=R(0,2);
   if((c.arr||0)>0){ d-=R(1,3); why=why||'zaległości wobec kadry ('+zl(c.arr)+')'; }
 
   /* --- gotówka zamienia się w kadrę, a dziura w kasie w wyprzedaż --- */
   const excess=c.budget-cost*1.5;
   if(excess>0){ const inv=Math.round(excess*0.45); c.budget-=inv;
     d+=Math.min(7, inv/(cost*0.32)); why=why||'transfery za nadwyżkę ('+zl(inv)+')'; }
   else if(c.budget<0){ d-=Math.min(7, -c.budget/(cost*0.30));
     c.budget=Math.round(c.budget*0.5); why=why||'wyprzedaż kadry na spłatę dziury'; }
   d=Math.round(d);

   /* --- SPONSORZY TYTULARNI: przelewy, ucieczki oszustów, nowe szyldy --- */
   const spon = sponsorSeason(c, k, log);
   d += spon.d;

   /* --- RZUT KOŚCIĄ: PATO-ZDARZENIA --- */
   const roll=Math.random()*100;
   let bkWhy=null;                                                  // zapalnik upadłości
   if(roll<5){
     const cash=Math.round(LEAGUE_INC[k]*RF(1.4,3.2));
     c.budget+=cash; d+=R(4,9);
     log.push({club:c.name, lk:k, t:'BOGATY INWESTOR', d:'+'+zl(cash), good:true,
       x:'Człowiek z branży budowlanej pokochał żużel. Na razie.'});
   } else if(roll<10){
     const before=c.budget; c.budget=Math.round(c.budget*RF(0.15,0.40)); d-=R(4,9);
     log.push({club:c.name, lk:k, t:'UTRATA SPÓŁKI SKARBU PAŃSTWA', d:'−'+zl(before-c.budget), good:false,
       x:'Zmiana zarządu, zmiana strategii sponsoringowej. Logo znika z kevlarów.'});
     // spółka odeszła, a w kasie została dziura nie do zasypania
     if(c.budget < -Math.max(300000, cost*BANKRUPTCY.deepMinus) && chance(BANKRUPTCY.onSpoloss))
       bkWhy='Spółka Skarbu Państwa wypisała się ze sponsoringu, a w kasie została dziura '+zl(-c.budget)+'.';
   } else if(roll<11.5){                              // ARESZTOWANIE: 1,5% na klub na sezon
     const before=c.budget; c.budget=Math.round(c.budget*RF(0.05,0.25)); d-=R(7,14);
     c.arr=(c.arr||0)+Math.round(cost*0.25);
     log.push({club:c.name, lk:k, t:'ARESZTOWANIE PREZESA / RADNEGO ZA KORUPCJĘ', d:'−'+zl(before-c.budget), good:false,
       x:'CBA weszło o 6:00. Konta zablokowane, biuro opieczętowane, kadra bez wypłat.'});
     if(chance(BANKRUPTCY.onArrest)) bkWhy='Prezes siedzi, konta zablokowane, licencji nikt nie podpisze.';
   } else if(why && Math.abs(d)>=3){
     log.push({club:c.name, lk:k, t: d>0?'DOBRY ROK W KSIĘGOWOŚCI':'GOSPODARKA KLUBU LEŻY', d:(d>0?'+':'')+d+' OVR', good:d>0, x:why});
   }
   c.budget=Math.round(c.budget);

   /* --- BOMBA ZEGAROWA SPONSORA Z GRUPY B: ma pierwszeństwo przed resztą --- */
   if(!bkWhy && spon.bkWhy) bkWhy=spon.bkWhy;

   /* --- SYNDYK: dług ponad 3 mln przy ujemnym budżecie to rzut monetą --- */
   if(!bkWhy && (c.debt||0) > BANKRUPTCY.debtLimit && c.budget < 0 && chance(BANKRUPTCY.onDebt))
     bkWhy='Dług '+zl(c.debt)+' przy ujemnej kasie. Wierzyciele złożyli wniosek, sąd go przyjął.';
 
   if(bkWhy && !c.bankrupt){
     c.bankrupt = true;
     c.bankruptWhy = bkWhy;
     /* --- ZWALNIANIE GWIAZD ---
        Bankrut nie utrzyma elitarnej kadry. Każdy z OVR > 50 rwie kontrakt
        i ląduje na bezrobociu. Zostaje tylko Gracz — żeby zobaczyć to z bliska. --- */
     let freed=0;
     G.riders.forEach(r=>{
       if(r.retired || r.me) return;
       if(r.club===c.name && r.ovr>50){ r.club=null; freed++; }
     });
     log.push({club:c.name, lk:k, t:'UPADŁOŚĆ KLUBU — WCHODZI SYNDYK', d:freed?freed+' zawodników na bruk':'kadra rozwiązana', good:false, x:bkWhy});
   }
 
   applySquadOvr(c, d);
  });
 });
 G.clubEvents=log;
 return log;
}
