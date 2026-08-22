/* ============================================================
   PATO-ŻUŻEL :: SILNIK :: POLA STARTOWE I REGULAMIN REZERW
   gateOrder, kaski, logika par, limity rezerwy zwykłej i taktycznej
   ------------------------------------------------------------
   Wydzielone z engine/12-mecz-ligowy.js (patch 22.08.2026, Sprint 3),
   bo 12 dobiło do 28 KB. Ten plik NIE zna meczu — zna wyłącznie zasady:
   kto gdzie stoi pod taśmą, w jakim kasku i kto kogo może zastąpić.
   Czytają go engine/12 (mecz symulowany) i engine/31 (mecz na żywo),
   więc obie ścieżki nie mają jak się rozjechać.
   ------------------------------------------------------------
   W index.html wpisz go MIĘDZY 12 a 13:
     <script src="engine/12-mecz-ligowy.js"></script>
     <script src="engine/12b-pola-i-rezerwy.js"></script>   <!-- NOWE -->
     <script src="engine/13-ekonomia-w-sezonie.js"></script>
   ============================================================ */
/* Numery młodzieżowe w programie: 6 i 7 u gości, 14 i 15 u gospodarzy. */
const isJunNum = n => n===6||n===7||n===14||n===15;

/* ============================================================
   TWARDY FIX PÓL STARTOWYCH (patch 22.08.2026, Sprint 3)
   ------------------------------------------------------------
   Poprzednia wersja gateOrder() PRÓBOWAŁA przeplatać stawkę, ale robiła to
   miękko: przy nierównej liczbie zawodników z obu stron (bieg w trójkę,
   nieudane zastępstwo, rezerwa taktyczna wchodząca pod wirtualnym numerem)
   pętla dokładała resztę jednej drużyny na koniec — i dwaj koledzy z pary
   znowu lądowali na sąsiednich torach. Do tego kask przydzielał się po
   NUMERZE POLA, a nie po drużynie, więc gospodarz potrafił wyjechać
   w białym kasku, a gość w czerwonym.
   ------------------------------------------------------------
   Teraz obowiązują trzy twarde zasady:
     1. PRZEPLOT ABSOLUTNY: G-A-G-A (albo A-G-A-G). Dwóch zawodników tej
        samej drużyny NIGDY nie stoi obok siebie — gateOrder() układa
        stawkę naprzemiennie, a gatesLegal() to sprawdza.
     2. KASKI PO DRUŻYNIE, NIE PO POLU: gospodarz zawsze czerwony
        i niebieski, gość zawsze biały i żółty. Zawsze, w każdym biegu,
        także w nominowanych i po każdym zastępstwie.
     3. LOGIKA PAR: seniorzy (1-5 / 9-13) nie mają prawa stać w parze pod
        taśmą. Jedyny wyjątek, i to wyłącznie w sytuacji, w której przeplot
        jest matematycznie niemożliwy (trzech zawodników jednej drużyny
        w czteroosobowym polu), to PARA MŁODZIEŻOWA 6-7 / 14-15 — dlatego
        przy nadwyżce jednej strony juniorzy są sortowani na koniec
        i to oni, a nie liderzy, przejmują wymuszone sąsiedztwo.
   ============================================================ */
const HELMET_H=['czerwony','niebieski'];   // GOSPODARZ — zawsze
const HELMET_A=['biały','żółty'];          // GOŚĆ — zawsze
const HELMETS=['czerwony','niebieski','biały','żółty'];   // zawody bez podziału na strony
const isJunEntry = e => !!(e && (isJun(e.r) || isJunNum(e.num)));
/* Przeplot dwóch list. A zaczyna, B odpowiada. Nadwyżka A (różnica >1)
   ląduje na końcu — i właśnie dlatego juniorzy jadą w ogonie listy. */
function gateWeave(A,B){
 const n=A.length+B.length, out=new Array(n);
 let ai=0, bi=0;
 for(let i=0;i<n;i++){
   if(i%2===0) out[i] = ai<A.length ? A[ai++] : B[bi++];
   else        out[i] = bi<B.length ? B[bi++] : A[ai++];
 }
 return out;
}
function gateOrder(entries){
 const list=entries.slice();
 const h=list.filter(e=>e.side==='h'), a=list.filter(e=>e.side==='a');
 const x=list.filter(e=>e.side!=='h' && e.side!=='a');
 let out;
 if(h.length && a.length){
   let A=h.slice(), B=a.slice();
   // pole 1 obejmuje strona liczniejsza (bieg w trójkę), a przy równowadze
   // ta, która otwierała bieg w programie — nie przestawiamy torów bez potrzeby
   if(a.length>h.length){ A=a.slice(); B=h.slice(); }
   else if(a.length===h.length && list[0] && list[0].side==='a'){ A=a.slice(); B=h.slice(); }
   // LOGIKA PAR: jeżeli przeplot się nie domknie, sąsiadami mają być juniorzy
   if(A.length-B.length>=2) A.sort((p,q)=>(isJunEntry(p)?1:0)-(isJunEntry(q)?1:0));
   out=gateWeave(A,B).concat(x);
 } else {
   out=list;
 }
 let ch=0, ca=0;
 out.forEach((e,i)=>{
   e.gate=i+1;
   /* Kask idzie za DRUŻYNĄ. Trzeci zawodnik jednej strony w polu (sytuacja,
      której regulamin nie zna, ale silnik musi ją znieść) dostaje kask
      z puli ogólnej, żeby nie wyjechać bez oznaczenia. */
   e.helmet = e.side==='h' ? (HELMET_H[ch++] || HELMETS[i] || null)
            : e.side==='a' ? (HELMET_A[ca++] || HELMETS[i] || null)
            : (HELMETS[i]||null);
 });
 gateAudit(out);
 return out;
}
/* Kontrola dla testów i debugowania: czy w stawce nie ma dwóch sąsiadów z jednej drużyny. */
function gatesLegal(line){
 for(let i=1;i<line.length;i++) if(line[i].side===line[i-1].side) return false;
 return true;
}
/* Czy każde wymuszone sąsiedztwo to PARA MŁODZIEŻOWA (jedyny dopuszczony wyjątek). */
function gatePairsLegal(line){
 for(let i=1;i<line.length;i++){
   if(line[i].side!==line[i-1].side) continue;
   if(!(isJunEntry(line[i]) && isJunEntry(line[i-1]))) return false;
 }
 return true;
}
/* Jeżeli nawet para młodzieżowa nie ratuje układu — zapisujemy to w G, zamiast
   udawać, że wszystko gra. Test regresji ma po czym poznać, że coś się zepsuło. */
function gateAudit(line){
 if(gatesLegal(line) || gatePairsLegal(line)) return true;
 if(typeof G!=='undefined' && G){
   (G.gateWarn=G.gateWarn||[]).push({year:G.year,
     line:line.map(e=>({num:e.num, side:e.side, gate:e.gate}))});
   if(G.gateWarn.length>50) G.gateWarn.shift();
 }
 return false;
}
/* ------------------------------------------------------------
   REGULAMIN REZERW (art. 719) — jedno miejsce, dwie ścieżki.
   · rezerwa zwykła   — wskakujesz za kogoś, kto nie może wyjechać;
                        młodzieżowiec ma do tego prawo DWA razy w meczu.
   · rezerwa taktyczna— trener zmienia zawodnika przy stracie 6+ punktów;
                        młodzieżowiec może z niej skorzystać RAZ.
   TWARDA ZASADA: młodzieżowca (6-7 / 14-15) nie wolno zdjąć rezerwą
   taktyczną i wstawić w jego miejsce seniora (1-5 / 9-13). Rubryka
   młodzieżowa jest rubryką młodzieżową i nie handluje się nią, kiedy
   drużyna przegrywa.
   ------------------------------------------------------------ */
function resBox(){ return {plain:0, tactic:0}; }
/* ------------------------------------------------------------
   ILE BIEGÓW WOLNO PRZEJECHAĆ (naprawa 24.08.2026)
   ------------------------------------------------------------
   Cały silnik miał wpisane na sztywno „starts<5" — i to w KAŻDYM miejscu:
   przy budowaniu pola biegu, przy rezerwie zwykłej, przy rezerwie taktycznej
   i przy biegach nominowanych. Skutek był taki, że zawodnik z kompletem
   pięciu startów z PROGRAMU nie mógł już wjechać NIGDZIE — a to właśnie
   jego trener chce wpuścić rezerwą taktyczną, bo to zwykle najlepszy
   zawodnik drużyny. Wchodzący był więc albo z góry odfiltrowany, albo
   (jeśli akurat miał 5 startów) natychmiast wymieniany z powrotem przez
   buildEntries/runHeat — stąd „-" w karcie przy zmianie, po której nikt
   nie pojechał.
   Regulaminowo limit to SZEŚĆ biegów: pięć z programu plus jeden z rezerwy
   taktycznej. U młodzieżowca te sześć składa się inaczej — trzy z programu,
   dwa z rezerwy zwykłej i jeden z taktycznej — ale suma jest ta sama.
   ------------------------------------------------------------ */
const STARTS_PROG = 5;                                   // biegi z programu
function startCap(s){ return STARTS_PROG + ((s&&s.res&&s.res.tactic)||0); }
function canRide(s){ return !!s && (s.starts||0) < startCap(s); }
/* Do rezerwy TAKTYCZNEJ wolno sięgnąć także po zawodnika z kompletem
   pięciu startów — to jest dokładnie ten szósty bieg. */
function tacticCandOk(s){ return !!s && (s.starts||0) < STARTS_PROG+1; }
function plainResOk(s, r){ return !!s && (!isJun(r) || (s.res.plain||0) < RESB.junPlain); }
function tacticResOk(s, r){ return !!s && (!isJun(r) || (s.res.tactic||0) < RESB.junTactic); }
function tacticLegal(weak, cand){
 if(!weak || !cand) return false;
 if(isJun(weak) && !isJun(cand)) return false;    // senior nie przejmuje biegu młodzieżowca
 return true;
}
/* Dlaczego trener odmówił — jednym zdaniem, do UI (patrz engine/31 i ui/09). */
function resRefusal(kind, weak, cand){
 if(kind==='starts')  return 'Masz już komplet pięciu startów w programie. Więcej regulamin nie przewiduje.';
 if(kind==='junPlain')return 'Młodzieżowiec ma prawo do dwóch startów z rezerwy zwykłej. Oba już wykorzystałeś.';
 if(kind==='junTac')  return 'Młodzieżowiec ma prawo do jednego startu z rezerwy taktycznej. Już go wykorzystałeś.';
 if(kind==='junTake') return 'Chcesz wejść za młodzieżowca. Rubryka młodzieżowa nie jest do wzięcia dla seniora.';
 if(kind==='none')    return 'Nie ma za kogo cię wpuścić. Wszyscy jadą swoje.';
 return 'Regulamin na to nie pozwala.';
}
 
