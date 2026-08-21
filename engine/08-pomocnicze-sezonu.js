/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: POMOCNICZE SEZONU
   riderLine, getClub, clubOf, leagueAvgOvr
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 534-563 oryginału).
   ============================================================ */
/* ============================================================
   4. ROZSTRZYGNIĘCIE SEZONU — ŻELAZNA MATEMATYKA
   ============================================================ */
/* Jedna linia startowa zawodnika w jednym spotkaniu (3-5 wyjazdów). */
function riderLine(ctx){
 const h=cl(Math.round(gauss(ctx.heatBase,0.55)), ctx.fixed||3, ctx.fixed||5);
 const codes=[]; let mp=0,mb=0,d=0,w=0;
 for(let k=0;k<h;k++){
   const rr=Math.random();
   if(rr<ctx.defP){d++;codes.push('d');continue;}
   if(rr<ctx.defP+ctx.excP){w++;codes.push('w');continue;}
   /* BEZ PUNKTÓW BONUSOWYCH: ten pomocnik obsługuje zawody, w których nie ma
      par klubowych (turnieje indywidualne, czwórmecze), więc bonus z art. 720
      nie ma tu prawa bytu. Gwiazdki wyleciały (patch 21.08.2026). */
   const v=cl(Math.round(ctx.ppr+gauss(0,0.95)),0,3); mp+=v;
   codes.push(String(v));
 }
 return {h,codes,mp,mb,d,w};
}
function getClub(p){return G.leagues[p.lk].clubs.find(c=>c.name===p.club);}
/* BEZPIECZNY DOSTĘP DO KLUBU — zawodnik bez kontraktu ma po prostu null.
   Używany przez warunki i efekty zdarzeń losowych (data.js), żeby event
   o długach klubu nie wysypywał gry bezrobotnemu żużlowcowi. */
function clubOf(p){
 p = p || (typeof G!=='undefined' && G ? G.p : null);
 if(!p || !p.club || !p.lk || !G || !G.leagues || !G.leagues[p.lk]) return null;
 return G.leagues[p.lk].clubs.find(c=>c.name===p.club) || null;
}
function leagueAvgOvr(lk){const cs=G.leagues[lk].clubs;return cs.reduce((a,c)=>a+c.ovr,0)/cs.length;}
