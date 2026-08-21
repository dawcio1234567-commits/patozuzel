/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: WSPOLNE
   render(), head(), acc/accLite, kategorie wiekowe, kody biegów
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 87-183 oryginału).
   ============================================================ */
/* ============================================================
   PATO-ŻUŻEL :: SYMULATOR KARIERY POLSKIEGO ŻUŻLOWCA
   Logika interfejsu (UI): ekrany, renderowanie HTML, obsługa
   interakcji. Wymaga wcześniejszego wczytania data.js i engine.js.
   ============================================================ */

/* ---- KATEGORIE WIEKOWE (jedno źródło prawdy dla całego UI) ----
   Silnik zna tylko twardy warunek: junior = U21. Powyżej 21 lat nikt nie jest
   już "juniorem" — jest U24 (do 24. roku życia włącznie) albo seniorem. */
/* "1 rok", "2 lata", "5 lat" — pojawia się przy każdej ofercie kontraktu. */
const lataTxt = n => n===1 ? 'rok'
  : (n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20)) ? 'lata' : 'lat';

const catOf    = r => isJun(r) ? 'JUNIOR (U21)' : isU24(r) ? 'U24' : 'SENIOR';
const catShort = r => isJun(r) ? 'U21' : isU24(r) ? 'U24' : 'SENIOR';
const catCol   = r => isJun(r) ? 'text-pink-400' : isU24(r) ? 'text-sky-400' : 'text-zinc-300';
const sezTxt = n => n===1 ? 'sezon'
  : (n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20)) ? 'sezony' : 'sezonów';

/* ---- ROZWIJANE SEKCJE: dwie odmiany tego samego wzorca ----
   Zamiast piętrzyć osobne ".brut" boksy jeden pod drugim (stąd skarga
   graczy — "za dużo małych okienek, wszystko się zlewa"), drugorzędne
   dane (wyjaśnienia, wyliczenia, "co jeszcze się wydarzyło") chowamy
   za jawnym, podpisanym przełącznikiem. Domyślnie ZAMKNIĘTE, chyba że
   opts.open=true — najważniejsze liczby i tak zostają widoczne bez klikania,
   bo trafiają do wywołania spoza acc()/accLite().
   acc()     — samodzielny boks z własną ramką (używaj między innymi boksami).
   accLite() — lekka wersja BEZ ramki, do wpięcia wewnątrz istniejącego boksu. */
function acc(title, body, opts={}){
 if(!body) return '';
 const {open=false, badge='', tone='text-orange-600'} = opts;
 return `<details class="acc"${open?' open':''}>
  <summary><span class="${tone} font-bold tracking-widest text-[11px]">${title}${badge?` <span class="text-zinc-500 font-normal normal-case tracking-normal">— ${esc(badge)}</span>`:''}</span>
  <span class="acc-ind"></span></summary>
  <div class="acc-body">${body}</div>
 </details>`;
}
function accLite(title, body, opts={}){
 if(!body) return '';
 const {open=false, badge='', tone='text-zinc-400'} = opts;
 return `<details class="acc-lite"${open?' open':''}>
  <summary><span class="acc-lite-t ${tone} tracking-widest text-[11px]">${title}${badge?` <span class="text-zinc-500 normal-case tracking-normal">— ${esc(badge)}</span>`:''}</span>
  <span class="acc-lite-ind"></span></summary>
  <div class="acc-lite-body">${body}</div>
 </details>`;
}

/* Kod "1*"/"2*" oznacza bieg z bonusem (art. 720). Renderujemy trailing '*'
   jako czytelną gwiazdkę ★ zamiast gołej "*" — na życzenie graczy, którzy
   zgłaszali, że bonus "nie widać" przy wynikach poszczególnych biegów: sam
   asterisk ginął wzrokowo obok "*liczba" (Twój dorobek meczowy) w tej samej
   linijce, mimo że dane były poprawne. Surowy format z '*' w `codes` (dane)
   zostaje bez zmian — liczy się go dalej jak dotąd (parseInt, endsWith). */
const bonusStar = c => c.endsWith('*') ? c.slice(0,-1)+'★' : c;
function codesHtml(codes){
 return codes.map(c=> c==='d'?'<span class="text-red-500">d</span>'
   : c==='w'?'<span class="text-red-400">w</span>'
   : c==='-'?'<span class="text-zinc-400">-</span>'
   : c.endsWith('*')?'<span class="text-sky-400" title="bieg z bonusem">'+bonusStar(c)+'</span>' : c).join(',');
}

/* ============================================================
   7. RENDER
   ============================================================ */
const app=()=>document.getElementById('app');
function render(){
 const s=G.screen;
 app().innerHTML =
   s==='create'  ? scCreate() :
   s==='sign'    ? scSign()   :
   s==='hub'     ? scHub()    :
   s==='renew'   ? scRenew()  :
   s==='event'   ? scEvent()  :
   s==='evsum'   ? scEvSum()  :
   s==='big'     ? scBig()    :
   s==='live'    ? scLive()   :
   s==='winter'  ? scWinter() :
   s==='tribunal'? scTribunal():
   s==='mech'    ? scMech()   :
   s==='summary' ? scSummary():
   s==='end'     ? scEnd()    : '';
 window.scrollTo({top:0});
}

function head(){
 return `<div class="mb-4 border-b border-zinc-700 pb-2 flex items-end justify-between flex-wrap gap-2">
  <div><div class="text-orange-500 font-extrabold tracking-[.3em] text-lg glow">POLSKI ŻUŻLOWIEC SIMULATOR</div>
  <div class="text-[11px] text-zinc-400 tracking-[.25em]">SYMULATOR KARIERY // ROK ${G.year}</div></div>
  <div class="text-[11px] text-zinc-400 text-right">${(G.screen==='live'||G.screen==='big')
    ? '<span class="text-orange-500 font-bold">tego meczu nikt za ciebie nie przejedzie</span>'
    : 'jedno kliknięcie = jeden sezon'}</div></div>`;
}
function statBar(l,v,col='#f97316'){
 return `<div class="mb-1.5"><div class="flex justify-between text-[11px] text-zinc-300 tracking-wider"><span>${l}</span><span class="text-zinc-200">${v}</span></div>
 <div class="bar"><i style="width:${cl(v,0,99)}%;background:${col}"></i></div></div>`;
}
