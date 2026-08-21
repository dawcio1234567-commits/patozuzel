/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: KARTA KARIERY PNG
   Zrzut karty do PNG (html2canvas)
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 3145-3297 oryginału).
   ============================================================ */
/* ============================================================
   ZRZUT KARTY DO PNG — WERSJA ODPORNA NA BŁĘDY
   ------------------------------------------------------------
   DLACZEGO WCZEŚNIEJ NIE POBIERAŁO SIĘ NIC:
   1) #smCardWrap stoi na `position:fixed; left:-14000px`. html2canvas
      klonuje REALNY dokument i liczy pozycje z getBoundingClientRect()
      — element 14 000 px poza ekranem daje pusty (albo obcięty) obrazek.
      Poprawianie tego w `onclone` jest zawodne: rozmiary bierze się
      z ORYGINAŁU (offsetWidth/Height) jeszcze przed klonowaniem, a przy
      `position:fixed` w klonie i tak zostaje przesunięty kontekst.
   2) `el.offsetHeight` na elemencie z ujemnym z-index i długą tabelą
      potrafi zwrócić mniej niż realna wysokość treści (scrollHeight).
   3) `scale:2` przy karcie 1240 px i kilkunastu sezonach przekraczało
      limit powierzchni canvasa w Safari/iOS — toDataURL zwracał wtedy
      pusty ciąg albo rzucał wyjątkiem, a stary kod ustawiał go jako href
      i „pobierał" plik 0-bajtowy.
   4) Brakowało obsługi błędu: `.catch(e=>alert(...))` pokazywał surowy
      obiekt, a przycisk zostawał zablokowany, gdy coś poszło nie tak
      przed wejściem w Promise.

   CO ROBI TERAZ:
   · na czas zrzutu wyciąga kontener na `position:absolute; left:0; top:0`
     (i zawsze go odkłada z powrotem — również przy wyjątku),
   · czeka na layout (2 × requestAnimationFrame) i na fonty,
   · liczy realną szerokość/wysokość i DOBIERA `scale` do limitu canvasa,
   · zapis: toBlob → (fallback) toDataURL → (fallback) otwarcie karty
     w nowym oknie do ręcznego zrzutu,
   · wszystko w try/catch/finally z czytelnym komunikatem po polsku.
   ============================================================ */
const PNG_MAX_PX = 12000;          // bezpieczny limit dłuższej krawędzi canvasa

function careerSlug(){
 return ((G.p&&G.p.name)||'zawodnik').toLowerCase()
   .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l').replace(/ń/g,'n')
   .replace(/ó/g,'o').replace(/ś/g,'s').replace(/[żź]/g,'z')
   .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'zawodnik';
}
/* Zapis canvasa na dysk. Zwraca true, jeśli plik faktycznie poszedł do pobrania. */
function saveCanvasAsPNG(canvas, filename){
 return new Promise(resolve=>{
   const viaUrl=url=>{ try{
       const a=document.createElement('a');
       a.download=filename; a.href=url; a.rel='noopener';
       document.body.appendChild(a); a.click(); a.remove();
       return true;
     }catch(_){ return false; } };
   // 1) najpewniejsza droga: Blob + ObjectURL (nie ma limitu długości URL-a)
   if(typeof canvas.toBlob==='function'){
     let done=false;
     const guard=setTimeout(()=>{ if(!done){ done=true; resolve(fallbackDataUrl()); } }, 8000);
     canvas.toBlob(blob=>{
       if(done) return; done=true; clearTimeout(guard);
       if(!blob || !blob.size){ resolve(fallbackDataUrl()); return; }
       const url=URL.createObjectURL(blob);
       const ok=viaUrl(url);
       setTimeout(()=>URL.revokeObjectURL(url), 30000);
       resolve(ok);
     },'image/png');
     return;
   }
   resolve(fallbackDataUrl());
   // 2) awaryjnie: data URL
   function fallbackDataUrl(){
     let data='';
     try{ data=canvas.toDataURL('image/png'); }catch(_){ return false; }
     if(!data || data.length<2000) return false;         // pusty/uszkodzony zrzut
     return viaUrl(data);
   }
 });
}
/* Ostatnia linia obrony: pokazujemy kartę w nowym oknie, żeby dało się
   zrobić zrzut ekranu albo wydrukować do PDF-a. */
function openCareerCardWindow(){
 try{
   const el=document.getElementById('smCard');
   if(!el) return false;
   const w=window.open('','_blank');
   if(!w) return false;
   w.document.write('<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">'+
     '<title>Karta statystyk — '+esc((G.p&&G.p.name)||'')+'</title>'+
     '<style>body{margin:0;background:#fff}#smCard,#smCard *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}'+
     '#smCard table{border-collapse:collapse}#smCard td,#smCard th{padding:0}</style></head><body>'+
     el.outerHTML+'</body></html>');
   w.document.close();
   return true;
 }catch(_){ return false; }
}

function downloadCareerPNG(btn){
 const oldLabel = btn ? btn.innerHTML : null;
 const wrap = document.getElementById('smCardWrap');
 const el   = document.getElementById('smCard');
 const restore = () => { if(btn){ btn.innerHTML=oldLabel; btn.disabled=false; } };

 (async()=>{
  let prevStyle=null;
  try{
   if(!wrap || !el)
     throw new Error('Nie znalazłem karty statystyk w dokumencie (#smCard). Odśwież stronę i spróbuj ponownie.');
   if(typeof html2canvas!=='function')
     throw new Error('Biblioteka html2canvas nie została wczytana — najczęściej blokuje ją brak internetu, '+
                     'wtyczka typu uBlock albo firmowy proxy. Karta nie może zostać wygenerowana.');
   if(btn){ btn.innerHTML='GENERUJĘ KARTĘ...'; btn.disabled=true; }

   /* --- 1) WYCIĄGAMY KONTENER Z OFFSCREENU --- */
   prevStyle = wrap.getAttribute('style');
   wrap.setAttribute('style','position:absolute;left:0;top:0;z-index:-1;opacity:1;'+
                             'pointer-events:none;background:#ffffff');
   /* --- 2) CZEKAMY NA LAYOUT I FONTY --- */
   await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
   if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; }catch(_){} }

   /* --- 3) REALNE WYMIARY + BEZPIECZNA SKALA --- */
   const w = Math.max(el.scrollWidth,  el.offsetWidth,  1240);
   const h = Math.max(el.scrollHeight, el.offsetHeight, 400);
   const scale = Math.max(1, Math.min(2, PNG_MAX_PX/Math.max(w,h)));

   let canvas=null;
   try{
     canvas = await html2canvas(el, {
       backgroundColor:'#ffffff', scale, logging:false,
       useCORS:true, allowTaint:false, foreignObjectRendering:false, imageTimeout:4000,
       width:w, height:h, windowWidth:w+40, windowHeight:h+40, scrollX:0, scrollY:0,
       /* w klonie nie ma po co trzymać animacji ani offscreenu */
       onclone:doc=>{ const cw=doc.getElementById('smCardWrap');
         if(cw) cw.setAttribute('style','position:static;left:0;top:0;z-index:0;opacity:1;background:#ffffff');
         doc.querySelectorAll('.blink').forEach(n=>n.classList.remove('blink')); }
     });
   } finally {
     /* kontener wraca poza ekran ZAWSZE — także gdy html2canvas rzuci wyjątkiem */
     if(prevStyle===null) wrap.removeAttribute('style'); else wrap.setAttribute('style',prevStyle);
     prevStyle=null;
   }
   if(!canvas || !canvas.width || !canvas.height)
     throw new Error('html2canvas zwrócił pusty obrazek (0 × 0 px).');

   /* --- 4) ZAPIS --- */
   const ok = await saveCanvasAsPNG(canvas, 'sportowemity-'+careerSlug()+'-kariera.png');
   if(!ok) throw new Error('Przeglądarka nie pozwoliła zapisać pliku PNG (zablokowane pobieranie '+
                           'albo przekroczony limit rozmiaru obrazka: '+canvas.width+' × '+canvas.height+' px).');
  }catch(err){
   if(prevStyle!==null){ wrap.setAttribute('style',prevStyle); }
   const msg=(err&&err.message)?err.message:String(err);
   const opened = openCareerCardWindow();
   alert('NIE UDAŁO SIĘ POBRAĆ KARTY STATYSTYK.\n\n'+msg+'\n\n'+
     (opened ? 'Otworzyłem kartę w nowej karcie przeglądarki — zrób zrzut ekranu albo wydrukuj ją do PDF (Ctrl+P).'
             : 'Spróbuj wyłączyć blokowanie skryptów dla tej strony i kliknąć jeszcze raz.'));
  }finally{
   restore();
  }
 })();
}
