/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: ZWIĄZEK ZAWODOWY I CEGIELSKI
   ------------------------------------------------------------
   Boks "ZWIĄZEK ZAWODOWY I CEGIELSKI": funkcja szefa SZZZ, ryczałt
   za bieżący sezon, poziom Cegły (bez sufitu) i mnożnik stawek
   po wyroku UOKiK.

   Wpina się dwoma wrapperami, bez zmian w istniejących plikach:
     · playerStrip()  (ui/04) — boks widać w HUB-ie PRZED każdym sezonem,
     · ekran podsumowania sezonu — wrapper zakłada się na pierwszą
       znalezioną funkcję ekranu raportu; jeżeli w tej wersji gry
       nazywa się inaczej, boks po prostu zostaje w HUB-ie i nic
       się nie wywala.
   ============================================================ */
function szzzBoxHtml(opts){
 try{
  const p = (typeof szzzEnsure==='function') ? szzzEnsure(G && G.p) : (G && G.p);
  if(!p) return '';
  const lvl  = p.ceglaLvl||0;
  const ksm  = (G && G.ksmMul) ? G.ksmMul : 1;
  const pay  = (opts && opts.season && G.S && G.S.szzzPay) ? G.S.szzzPay : 0;
  const log  = (G && G.szzzLog) ? G.szzzLog : [];
  const suma = log.reduce((a,x)=>a+(x.kwota||0),0);
  if(!p.hasSZZZ && !lvl && ksm===1) return '';   // nic do pokazania — nie zaśmiecamy ekranu
  return `<div class="brut mb-3" style="border-color:#0e7490">
   <div class="brut-h px-3 py-1.5 text-[11px] font-bold" style="border-color:#0e7490;color:#22d3ee">
     ZWIĄZEK ZAWODOWY I CEGIELSKI</div>
   <div class="p-3 text-[11px] leading-relaxed space-y-1">
    ${p.hasSZZZ
      ? `<div class="text-[12px] font-extrabold" style="color:#22d3ee">JESTEŚ SZEFEM ZWIĄZKU ZAWODOWEGO ŻUŻLOWCÓW (SZZZ).</div>
         <div class="text-zinc-300">Ryczałt funkcyjny: <b class="text-emerald-400">${zl(50000)}</b> na starcie każdego sezonu.
         ${pay?`W tym sezonie wpłynęło już <b class="text-emerald-400">${zl(pay)}</b>.`:''}
         ${log.length?`Łącznie z funkcji: <b class="text-zinc-200">${zl(suma)}</b> przez ${log.length} ${log.length===1?'sezon':'sezonów'}.`:''}</div>
         <div class="text-zinc-400">Odblokowane: strajki na obchodzie toru (bandy, gwoździe) i droga do UOKiK-u.</div>`
      : `<div class="text-zinc-400">Nie pełnisz żadnej funkcji związkowej. Telefon od Pustackiego dzwoni tylko do tych, którzy dobrze wypadli w telewizji.</div>`}
    <div class="text-zinc-300">CEGIELSKI: <b class="${lvl>0?'text-orange-400':'text-zinc-400'}">${lvl>0?'poziom '+lvl+' — '+esc(ceglaName(lvl)):'poziom 0 — jeszcze nikomu nie właziłeś w dupę'}</b></div>
    ${ksm!==1?`<div class="text-emerald-400">RYNEK PO WYROKU UOKiK: stawki za punkt w każdej przyszłej ofercie ×${ksm.toFixed(2)}.</div>`:''}
   </div></div>`;
 }catch(_){ return ''; }
}

/* --- HUB: boks przed każdym sezonem --- */
if(typeof playerStrip === 'function'){
 const _playerStrip_pre = playerStrip;
 playerStrip = function(){
  let base='';
  try{ base=_playerStrip_pre.apply(this, arguments); }catch(e){ throw e; }
  try{ return base + szzzBoxHtml({season:false}); }catch(_){ return base; }
 };
}

/* --- PODSUMOWANIE SEZONU: ta sama rubryka, z kwotą za TEN sezon ---
   Nie wiemy na pewno, jak nazywa się funkcja ekranu raportu w tej
   wersji gry (ui/10-podsumowanie.js), więc próbujemy po kolei
   najbardziej prawdopodobnych nazw i bierzemy pierwszą istniejącą. */
(function(){
 const CAND = ['scSum','scSummary','scReport','scSeason','scRaport','scPodsumowanie','scResult'];
 for(const n of CAND){
  try{
   if(typeof window[n] === 'function'){
    const pre = window[n];
    window[n] = function(){
     let base='';
     try{ base = pre.apply(this, arguments); }catch(e){ throw e; }
     try{ const add = szzzBoxHtml({season:true}); return add ? base + add : base; }
     catch(_){ return base; }
    };
    break;
   }
  }catch(_){}
 }
})();
