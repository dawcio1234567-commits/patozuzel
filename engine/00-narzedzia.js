/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: NARZEDZIA
   Losowanie, zaokrąglenia, formatowanie (R, RF, cl, pick, chance, zl, esc)
   ------------------------------------------------------------
   Moduł wydzielony z engine.js (linie 1-24 oryginału).
   ============================================================ */
/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   engine.js — rdzeń symulacji: utilsy, generowanie gry/zawodnika,
   rozstrzyganie sezonu, mecze ligowe, ekonomia klubów, spadki/awanse,
   zawody indywidualne (IMP/MIMP/Kaski) oraz DMPJ.
   Wymaga wcześniejszego wczytania data.js.
   ============================================================ */
 
/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   Mechanika "Copero": jedno kliknięcie = jeden pełny sezon.
   ============================================================ */
 
/* ---------- UTIL ---------- */
const R  = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const RF = (a,b)=>Math.random()*(b-a)+a;
const cl = (v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;
function gauss(m,s){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const zl = n => Math.round(n).toLocaleString('pl-PL')+' zł';
const esc= s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=R(0,i);[b[i],b[j]]=[b[j],b[i]];}return b;};
