/* ============================================================
   PATO-ŻUŻEL :: INTERFEJS :: KARTA KARIERY HTML
   Karta „SportoweMity.pl" — cały HTML pamiątki
   ------------------------------------------------------------
   Moduł wydzielony z index.html (linie 2816-3144 oryginału).
   ============================================================ */
function careerCardHtml(){
 const p=G.p, c=p.career, H=G.history;
 const totalUnpaid = H.reduce((a,h)=>a+smUnpaid(h),0);
 const totalPzm    = H.reduce((a,h)=>a+smPzm(h),0);
 const wiped       = H.reduce((a,h)=>a+(h.bankruptLost||0),0);
 const avg = c.heats>0 ? (c.pts/c.heats).toFixed(2) : '0.00';
 const clubs=smClubs();
 const ini = p.name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
 const today = new Date().toLocaleDateString('pl-PL',{day:'2-digit',month:'long',year:'numeric'});

 const TH=(t,w,al)=>`<th style="background:${SM.gd};color:#fff;font-size:11px;font-weight:bold;
   padding:7px 5px;text-align:${al||'center'};border-right:1px solid rgba(255,255,255,.18);
   white-space:nowrap;${w?'width:'+w+'px;':''}">${t}</th>`;
 const TD=(t,st)=>`<td style="padding:6px 5px;font-size:12px;text-align:center;
   border-bottom:1px solid ${SM.bd};color:${SM.tx};${st||''}">${t}</td>`;

 /* --- suma wszystkich sezonów (wiersz ŁĄCZNIE) --- */
 const tot={M:0,B:0,I:0,II:0,III:0,IV:0,D:0,U:0,W:0,T:0,P:0,BON:0,DL:0};
 H.forEach(h=>{ const s=smCodes(h);
   tot.M+=smM(h); tot.B+=smB(h); tot.I+=s.I; tot.II+=s.II; tot.III+=s.III; tot.IV+=s.IV;
   tot.D+=s.D; tot.U+=s.U; tot.W+=s.W; tot.T+=s.T; tot.P+=smP(h); tot.BON+=smBon(h);
   tot.DL+=smUnpaid(h); });
 const totAvg = tot.B>0 ? (tot.P/tot.B).toFixed(2) : '—';

 const rows = H.map((h,i)=>{
   const s=smCodes(h), bg = i%2 ? SM.gl2 : '#fff';
   const dl=smUnpaid(h);
   return `<tr style="background:${bg}">
     ${TD(h.year,'font-weight:bold;color:'+SM.gd)}
     ${TD(h.age)}
     ${TD(esc(h.league),'color:'+SM.g+';font-weight:bold')}
     ${TD(esc(h.club),'text-align:left;color:'+SM.g+';font-weight:bold;padding-left:8px')}
     ${TD(smM(h))}${TD(smB(h))}
     ${TD(s.I,'font-weight:bold')}${TD(s.II)}${TD(s.III)}${TD(s.IV,'color:'+SM.mu)}
     ${TD(s.D,'color:'+SM.rd)}${TD(s.U,'color:'+SM.mu)}${TD(s.W,'color:'+SM.rd)}${TD(s.T,'color:'+SM.mu)}
     ${TD(smP(h),'font-weight:bold;font-size:13px')}
     ${TD(smBon(h),'color:#1d4ed8')}
     ${TD(smAvg(h),'font-weight:bold;background:'+SM.gl)}
     ${TD(esc(h.grade.t),'font-size:10px;letter-spacing:.02em')}
     ${TD(dl?'−'+zl(dl):'0 zł', dl?'color:'+SM.rd+';font-weight:bold;white-space:nowrap':'color:'+SM.mu+';white-space:nowrap')}
   </tr>`;
 }).join('');

 const tabs=['STATYSTYKI KARIERY','PROFIL','MECZE','TRANSFERY','GALERIA','FORUM']
   .map((t,i)=>`<span style="display:inline-block;padding:8px 16px;font-size:12px;font-weight:bold;
     ${i===0?'background:'+SM.g+';color:#fff;':'background:'+SM.gl+';color:'+SM.gd+';'}
     border:1px solid ${SM.bd};border-bottom:none;margin-right:3px;">${t}</span>`).join('');

 const nav=['ŻUŻEL','PIŁKA NOŻNA','SIATKÓWKA','KOSZYKÓWKA','MMA','TENIS','TRANSFERY','TYPER']
   .map((t,i)=>`<span style="display:inline-block;padding:10px 13px;font-size:12px;font-weight:bold;
     color:${i===0?'#fff':'#d9f0e1'};${i===0?'background:'+SM.gd+';':''}">${t}</span>`).join('');

 /* ============================================================
    OSIĄGNIĘCIA INDYWIDUALNE — GABLOTA
    Wchodzi zaraz pod tabelą sezonów ligowych: komplet tytułów i medali
    z IMP, MIMP, Złotego / Srebrnego / Brązowego Kasku oraz DMPJ i DMP.
    ============================================================ */
 const GOLD='#b8860b', SILV='#71797e', BRNZ='#a0522d';
 const T=smTrophies();
 /* ============================================================
    TYTUŁY MISTRZA ŚWIATA — WŁASNA, OSOBNA RUBRYKA (patch 22.08.2026)
    ------------------------------------------------------------
    Zgłoszenie: „wyszczególnij w generowanym po karierze obrazie PNG tytuły
    mistrza świata". Do tej pory złoto IMŚ leżało w tej samej tabeli, co
    Brązowy Kask i cykl turniejów szkoleniowych — formalnie było, ale
    najważniejszy tytuł w tym sporcie ginął w wierszu numer jeden.
    Teraz ma własny, złoty pas nad gablotą, własny kafelek w profilu
    i własną linijkę w nagłówku karty.
    ============================================================ */
 const wIms  = T.find(t=>t.k==='ims')  || {g:[],si:[],b:[],starts:0};
 const wImsj = T.find(t=>t.k==='imsj') || {g:[],si:[],b:[],starts:0};
 const worldGold = wIms.g.length, worldJunGold = wImsj.g.length;
 const worldMed  = wIms.g.length+wIms.si.length+wIms.b.length;
 const wTag=(y)=>`<span style="display:inline-block;border:2px solid ${GOLD};background:#fffbe8;
    padding:7px 13px;margin:0 7px 7px 0;font-size:15px;font-weight:bold;color:#7a5c00;white-space:nowrap">★ ${y}</span>`;

 const rode=T.filter(t=>t.starts>0);
 const gAll =T.reduce((a,t)=>a+t.g.length,0);
 const siAll=T.reduce((a,t)=>a+t.si.length,0);
 const bAll =T.reduce((a,t)=>a+t.b.length,0);
 const medAll=gAll+siAll+bAll;
 const smMedale = n => n===1 ? 'medal'
   : (n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20)) ? 'medale' : 'medali';
 /* Kafelek z krążkiem — puste miejsce zostaje szare, żeby gablota nie kłamała. */
 const disc=(cnt,col,lab)=>`<td style="border:1px solid ${SM.bd};background:${cnt?'#fffdf5':'#fafafa'};
   padding:8px 10px;text-align:center;width:96px">
   <div style="font-size:22px;font-weight:bold;color:${cnt?col:'#c9cdd1'};line-height:1.1">${cnt}</div>
   <div style="font-size:9px;letter-spacing:.08em;color:${cnt?col:SM.mu}">${lab}</div></td>`;
 /* Lata na podium z widoczną etykietą krążka — bez niej „2027, 2028  2026"
    czytało się jak jeden ciąg i nie było wiadomo, co jest złotem, a co brązem. */
 const yrs=(arr,col,lab)=>arr.length
   ? `<span style="white-space:nowrap"><span style="display:inline-block;background:${col};color:#fff;
        font-size:9px;font-weight:bold;padding:1px 4px;margin-right:3px;vertical-align:1px">${lab}</span>
      <span style="color:${col};font-weight:bold">${arr.join(', ')}</span></span>` : '';
 const posTxt=t=>{
   if(!t.starts) return `<span style="color:${SM.mu}">nie startował</span>`;
   if(!t.best)   return `<span style="color:${SM.mu}">bez miejsca w finale</span>`;
   return `<b>${t.best}.</b> miejsce <span style="color:${SM.mu}">(${t.bestYear})</span>`;
 };
 const trophyRows = rode.map((t,i)=>{
   const bg = i%2 ? SM.gl2 : '#fff';
   const parts=[yrs(t.g,GOLD,'ZŁ'), yrs(t.si,SILV,'SR'), yrs(t.b,BRNZ,'BR')].filter(Boolean);
   return `<tr style="background:${bg}">
     ${TD(esc(t.s),'font-weight:bold;color:'+SM.gd+';font-size:11px')}
     ${TD(esc(t.n),'text-align:left;font-weight:bold;color:'+SM.tx+';padding-left:8px')}
     ${TD(t.starts,'color:'+SM.mu)}
     ${TD(t.g.length ||'–', t.g.length ?'font-weight:bold;font-size:14px;color:'+GOLD:'color:#c9cdd1')}
     ${TD(t.si.length||'–', t.si.length?'font-weight:bold;font-size:14px;color:'+SILV:'color:#c9cdd1')}
     ${TD(t.b.length ||'–', t.b.length ?'font-weight:bold;font-size:14px;color:'+BRNZ:'color:#c9cdd1')}
     ${TD(posTxt(t),'text-align:left;padding-left:8px;font-size:11px')}
     ${TD(parts.join('&nbsp;&nbsp;')||`<span style="color:${SM.mu}">—</span>`,
          'text-align:left;padding-left:8px;font-size:11px')}
   </tr>`;
 }).join('');
 /* Pasek tytułów: każdy złoty krążek osobno, rok po roku — to jest to,
    po co gracz w ogóle otwiera taką kartę. */
 const goldBadges = T.flatMap(t=>t.g.map(y=>({s:t.s, title:t.gold||t.n, y})))
   .sort((a,b)=>a.y-b.y || a.s.localeCompare(b.s))
   .map(x=>`<span style="display:inline-block;border:1px solid ${GOLD};border-left:5px solid ${GOLD};
     background:#fffbef;padding:6px 11px;margin:0 6px 6px 0;font-size:12px;white-space:nowrap">
     <b style="color:${GOLD}">★ ${esc(x.title)}</b>
     <span style="color:${SM.mu}"> · ${esc(x.s)} · </span><b>${x.y}</b></span>`).join('');

 const worldBanner = (worldGold||worldJunGold||worldMed) ? `
  <div style="padding:0 22px 14px 22px">
   <div style="background:${GOLD};color:#fff;font-size:13px;font-weight:bold;padding:6px 10px">
     MISTRZOSTWA ŚWIATA — TYTUŁY I MEDALE
     <span style="float:right;font-weight:normal;font-size:11px;color:#fff5d6">FIM SPEEDWAY GRAND PRIX · IMŚJ2</span>
     <div style="clear:both"></div>
   </div>
   <div style="border:2px solid ${GOLD};border-top:none;padding:14px;background:#fffdf5">
    ${worldGold ? `<div style="font-size:26px;font-weight:bold;color:#7a5c00;line-height:1.2;margin-bottom:8px">
        ${worldGold}× INDYWIDUALNY MISTRZ ŚWIATA</div>
      <div style="margin-bottom:10px">${wIms.g.map(wTag).join('')}</div>`
      : `<div style="font-size:15px;font-weight:bold;color:${SM.mu};margin-bottom:8px">
        Bez tytułu mistrza świata.</div>`}
    ${worldJunGold ? `<div style="font-size:17px;font-weight:bold;color:#7a5c00;margin-bottom:6px">
        ${worldJunGold}× INDYWIDUALNY MISTRZ ŚWIATA JUNIORÓW</div>
      <div style="margin-bottom:10px">${wImsj.g.map(wTag).join('')}</div>`:''}
    <table style="width:100%;margin-top:4px"><tr>
      ${disc(wIms.g.length,GOLD,'ZŁOTO IMŚ')}${disc(wIms.si.length,SILV,'SREBRO IMŚ')}${disc(wIms.b.length,BRNZ,'BRĄZ IMŚ')}
      ${disc(wImsj.g.length,GOLD,'ZŁOTO IMŚJ2')}
      <td style="padding:8px 14px;vertical-align:middle;font-size:11px;color:${SM.mu};line-height:1.6">
        Starty w cyklu Grand Prix: <b style="color:${SM.tx}">${wIms.starts}</b> ${wIms.starts?`sezonów`:''} ·
        najlepsze miejsce w klasyfikacji generalnej:
        <b style="color:${SM.tx}">${wIms.best?wIms.best+'. ('+wIms.bestYear+')':'—'}</b>.
        ${wImsj.starts?`Cykl juniorski: <b style="color:${SM.tx}">${wImsj.starts}</b> sezonów, najlepiej
        <b style="color:${SM.tx}">${wImsj.best?wImsj.best+'.':'—'}</b>.`:''}
        ${(p.career.imsEarned||0)?`Zarobki z cyklu światowego: <b style="color:${SM.g}">${zl(p.career.imsEarned)}</b>.`:''}
      </td>
    </tr></table>
   </div>
  </div>` : '';
 const trophyBlock = `
  <div style="padding:0 22px 14px 22px">
    <div style="background:${SM.g};color:#fff;font-size:13px;font-weight:bold;padding:6px 10px">
      OSIĄGNIĘCIA INDYWIDUALNE I TYTUŁY
      <span style="float:right;font-weight:normal;font-size:11px;color:#d9f0e1">
        IMP · MIMP · ZŁOTY / SREBRNY / BRĄZOWY KASK · DMPJ · DMP</span>
      <div style="clear:both"></div>
    </div>
    <div style="border:1px solid ${SM.bd};border-top:none;padding:12px">

      <table style="width:100%;margin-bottom:12px"><tr>
        ${disc(gAll,GOLD,'ZŁOTO')}${disc(siAll,SILV,'SREBRO')}${disc(bAll,BRNZ,'BRĄZ')}
        <td style="padding:8px 14px;vertical-align:middle">
          ${medAll
            ? `<div style="font-size:15px;font-weight:bold;color:${SM.tx}">
                 ${medAll} ${smMedale(medAll)} w ${rode.reduce((a,t)=>a+t.starts,0)} startach w rozgrywkach mistrzowskich</div>
               <div style="font-size:11px;color:${SM.mu};margin-top:2px">
                 Tytuły mistrzowskie (złoto): <b style="color:${GOLD}">${gAll}</b> ·
                 medale indywidualne (IMP, MIMP, Kaski): <b>${(p.career.medals||0)}</b></div>`
            : `<div style="font-size:15px;font-weight:bold;color:${SM.mu}">Gablota pusta.</div>
               <div style="font-size:11px;color:${SM.mu};margin-top:2px">
                 Ani jednego medalu w rozgrywkach mistrzowskich. Za to bus ma przebieg jak autobus miejski.</div>`}
        </td>
      </tr></table>

      ${goldBadges ? `<div style="margin-bottom:12px">${goldBadges}</div>` : ''}

      <table style="width:100%;border:1px solid ${SM.bd}">
        <thead><tr>
          ${TH('CYKL',62)}${TH('ROZGRYWKI',null,'left')}${TH('STARTY',58)}
          ${TH('ZŁOTO',54)}${TH('SREBRO',58)}${TH('BRĄZ',50)}
          ${TH('NAJLEPSZY WYNIK',150,'left')}${TH('LATA NA PODIUM',null,'left')}
        </tr></thead>
        <tbody>
          ${trophyRows || `<tr><td colspan="8" style="padding:14px;text-align:center;font-size:12px;color:${SM.mu}">
            Zawodnik nie wystąpił w żadnych rozgrywkach mistrzowskich.</td></tr>`}
        </tbody>
      </table>
      <div style="font-size:10px;color:${SM.mu};padding:6px 2px;line-height:1.6">
        STARTY — sezony, w których zawodnik faktycznie pojawił się w danym cyklu (choćby w eliminacjach).
        DMPJ liczone tylko do 21. roku życia. DMP — miejsce w fazie play-off tej klasy rozgrywkowej,
        w której zawodnik jeździł w danym sezonie.
        ${(p.career.dmpjTitles||0)?`Drużynowe mistrzostwo Polski juniorów: <b style="color:${SM.g}">${p.career.dmpjTitles}×</b>.`:''}
      </div>
    </div>
  </div>`;

 return `<div id="smCardWrap"><div id="smCard" style="width:1240px;background:#fff;color:${SM.tx}">

  <!-- ===== PASEK SERWISOWY ===== -->
  <div style="background:${SM.gd};color:#bfe6cd;font-size:11px;padding:5px 22px">
    <span style="float:left">SportoweMity.pl · portal, który wie lepiej niż ty</span>
    <span style="float:right">${today} · wydanie internetowe</span>
    <div style="clear:both"></div>
  </div>

  <!-- ===== NAGŁÓWEK / LOGO ===== -->
  <div style="background:${SM.g};padding:16px 22px 0 22px">
    <div style="font-size:34px;font-weight:bold;color:#fff;letter-spacing:-.5px;line-height:1">
      Sportowe<span style="color:#bff0cf">Mity</span><span style="font-size:20px;color:#d9f0e1">.pl</span>
      <span style="float:right;font-size:11px;color:#d9f0e1;text-align:right;line-height:1.5;font-weight:normal;padding-top:6px">
        KARTA STATYSTYK ZAWODNIKA<br>ŻUŻEL · POLSKA · ARCHIWUM KARIER</span>
      <div style="clear:both"></div>
    </div>
    <div style="margin-top:12px">${nav}</div>
  </div>

  <!-- ===== OKRUSZKI ===== -->
  <div style="border-bottom:3px solid ${SM.g};padding:9px 22px;font-size:11px;color:${SM.mu};background:#fff">
    Żużel &rsaquo; Zawodnicy &rsaquo; Polska &rsaquo; <b style="color:${SM.g}">${esc(p.name)}</b>
  </div>

  <!-- ===== PROFIL ZAWODNIKA ===== -->
  <table style="width:100%;padding:18px 22px;background:#fff"><tr>
    <td style="width:118px;vertical-align:top;padding:18px 0 14px 22px">
      <div style="width:100px;height:100px;background:${SM.gl};border:3px solid ${SM.g};
        text-align:center;line-height:94px;font-size:38px;font-weight:bold;color:${SM.g}">${esc(ini)}</div>
    </td>
    <td style="vertical-align:top;padding:18px 22px 14px 16px">
      <div style="font-size:29px;font-weight:bold;color:${SM.tx};line-height:1.1">${esc(p.name)}</div>
      <div style="font-size:13px;color:${SM.mu};margin-top:4px">
        ${esc(p.cls)} · kariera ${H.length?H[0].year+'–'+H[H.length-1].year:'—'} ·
        zakończona w wieku ${p.age} lat · <span style="color:${SM.g};font-weight:bold">${esc(clubs.length?clubs[clubs.length-1].club:'brak klubu')}</span>
      </div>
      ${(c.worldTitles||0)?`<div style="margin-top:6px;display:inline-block;border:2px solid #b8860b;background:#fffbe8;
        padding:4px 10px;font-size:13px;font-weight:bold;color:#7a5c00">★ INDYWIDUALNY MISTRZ ŚWIATA ${(c.worldTitles||0)>1?'('+c.worldTitles+'×)':''}</div>`:''}
      ${(c.worldJunTitles||0)?`<div style="margin-top:6px;margin-left:6px;display:inline-block;border:1px solid #b8860b;background:#fffdf5;
        padding:4px 10px;font-size:12px;font-weight:bold;color:#7a5c00">★ MISTRZ ŚWIATA JUNIORÓW ${(c.worldJunTitles||0)>1?'('+c.worldJunTitles+'×)':''}</div>`:''}
      <div style="font-size:12px;color:${SM.mu};margin-top:3px;font-style:italic">„${esc(p.retireReason||'Decyzja własna.')}”</div>
      <table style="margin-top:12px;width:100%"><tr>
        ${[['SEZONY',c.seasons],['MECZE',c.matches],['BIEGI',c.heats],['PUNKTY',c.pts],
           ['BONUSY',c.bon||0],['ŚREDNIA KARIERY',avg],['TYTUŁY',(c.titles||0)+(c.indTitles||0)]]
          .concat((c.worldTitles||0)?[['MISTRZ ŚWIATA',(c.worldTitles||0)+'×']]:[])
          .concat([['ZAROBIONE',zl(c.earned)]])
          .map(x=>`<td style="border:1px solid ${SM.bd};background:${SM.gl};padding:7px 9px;text-align:center">
            <div style="font-size:9px;color:${SM.gd};letter-spacing:.06em">${x[0]}</div>
            <div style="font-size:17px;font-weight:bold;color:${SM.tx}">${x[1]}</div></td>`).join('')}
      </tr></table>
      <div style="font-size:10px;color:${SM.mu};margin-top:5px">
        Kafelki i tabela poniżej liczą to samo: rundę zasadniczą razem z fazą play-off.
        Turnieje indywidualne (IMP, MIMP, Kaski) i DMPJ mają własną rubrykę — patrz OSIĄGNIĘCIA INDYWIDUALNE.</div>
    </td>
  </tr></table>

  <!-- ===== KLUBY Z KARIERY ===== -->
  <div style="padding:0 22px 16px 22px">
    <div style="background:${SM.g};color:#fff;font-size:13px;font-weight:bold;padding:6px 10px">KLUBY Z KARIERY</div>
    <div style="border:1px solid ${SM.bd};border-top:none;padding:10px">
      ${clubs.length ? clubs.map(k=>`<span style="display:inline-block;border:1px solid ${SM.bd};
        border-left:4px solid ${SM.g};background:${SM.gl2};padding:6px 10px;margin:0 6px 6px 0;font-size:12px">
        <b style="color:${SM.g}">${esc(k.club)}</b>
        <span style="color:${SM.mu}"> · ${k.from}${k.to!==k.from?'–'+k.to:''} · ${k.seasons} sez. ·
        <span style="color:${SM.g}">${k.leagues.map(esc).join(' / ')}</span> · ${k.pts} pkt</span>
        ${k.debt?`<span style="color:${SM.rd};font-weight:bold"> · dług ${zl(k.debt)}</span>`:''}
      </span>`).join('') : `<span style="font-size:12px;color:${SM.mu}">Brak rozegranych sezonów.</span>`}
    </div>
  </div>

  <!-- ===== ZAKŁADKI + TABELA ===== -->
  <div style="padding:0 22px 6px 22px">${tabs}</div>
  <div style="padding:0 22px 10px 22px">
   <table style="width:100%;border:1px solid ${SM.bd}">
    <thead><tr>
      ${TH('ROK',52)}${TH('WIEK',44)}${TH('LIGA',62)}${TH('KLUB',null,'left')}
      ${TH('M',36)}${TH('B',36)}${TH('I',32)}${TH('II',32)}${TH('III',32)}${TH('IV',32)}
      ${TH('D',30)}${TH('U',30)}${TH('W',30)}${TH('T',30)}
      ${TH('PKT',46)}${TH('BON',42)}${TH('ŚR./B',56)}${TH('OCENA',104)}${TH('DŁUG',96)}
    </tr></thead>
    <tbody>
      ${rows || `<tr><td colspan="19" style="padding:14px;text-align:center;font-size:12px;color:${SM.mu}">Brak sezonów w archiwum.</td></tr>`}
      <tr style="background:${SM.gl};border-top:2px solid ${SM.g}">
        ${TD('ŁĄCZNIE','font-weight:bold;color:'+SM.gd)}${TD('')}${TD('LIGA+PO','font-size:10px;color:'+SM.gd)}
        ${TD(clubs.length+' '+smKlub(clubs.length),'text-align:left;color:'+SM.gd+';font-weight:bold;padding-left:8px')}
        ${TD(tot.M,'font-weight:bold')}${TD(tot.B,'font-weight:bold')}
        ${TD(tot.I,'font-weight:bold')}${TD(tot.II,'font-weight:bold')}${TD(tot.III,'font-weight:bold')}${TD(tot.IV,'font-weight:bold')}
        ${TD(tot.D,'font-weight:bold;color:'+SM.rd)}${TD(tot.U,'font-weight:bold')}${TD(tot.W,'font-weight:bold;color:'+SM.rd)}${TD(tot.T,'font-weight:bold')}
        ${TD(tot.P,'font-weight:bold;font-size:14px')}${TD(tot.BON,'font-weight:bold;color:#1d4ed8')}
        ${TD(totAvg,'font-weight:bold;background:#fff')}${TD('KARIERA','font-size:10px;font-weight:bold;color:'+SM.gd)}
        ${TD(tot.DL?'−'+zl(tot.DL):'0 zł','font-weight:bold;color:'+SM.rd+';white-space:nowrap')}
      </tr>
    </tbody>
   </table>
   <div style="font-size:10px;color:${SM.mu};padding:6px 2px;line-height:1.6">
     M — mecze (runda zasadnicza + play-off) · B — biegi (starty) · I / II / III / IV — miejsca w biegach ·
     D — defekt · U — upadek · W — wykluczenie · T — taśma · ŚR./B — średnia biegopunktowa ·
     DŁUG — kwota, której klub nie przelał w danym sezonie.
     ${totalPzm?`Startowe i kilometrówka PZM przez całą karierę: <b style="color:${SM.g}">${zl(totalPzm)}</b>.`:''}
     Biegi zdjęte przez rezerwę taktyczną nie wchodzą do statystyki startów.
   </div>
  </div>

  <!-- ===== MISTRZOSTWA ŚWIATA ===== -->
  ${worldBanner}

  <!-- ===== OSIĄGNIĘCIA INDYWIDUALNE ===== -->
  ${trophyBlock}

  <!-- ===== WIELKI CZERWONY NAPIS ===== -->
  <div style="margin:4px 22px 0 22px;border:3px solid ${SM.rd};background:#fff5f5;padding:16px;text-align:center">
    <div style="font-size:12px;color:${SM.rd};letter-spacing:.18em;font-weight:bold">BILANS ZAMKNIĘCIA KARIERY</div>
    <div style="font-size:27px;font-weight:bold;color:${SM.rd};line-height:1.25;margin-top:6px">
      CAŁKOWITE NIEZAPŁACONE ZALEGŁOŚCI W KARIERZE: ${zl(totalUnpaid)}
    </div>
    ${wiped?`<div style="font-size:13px;color:${SM.rd};margin-top:6px">w tym ${zl(wiped)} umorzone przez syndyka — masa upadłościowa nie wypłaciła nic</div>`:''}
  </div>

  <!-- ===== STOPKA ===== -->
  <div style="margin-top:16px;background:${SM.gd};color:#bfe6cd;font-size:11px;padding:10px 22px">
    <span style="float:left">SportoweMity.pl · dane z archiwum PATO-ŻUŻEL · przedruk za zgodą prezesa (ustną, w busie)</span>
    <span style="float:right">wygenerowano ${today}</span>
    <div style="clear:both"></div>
  </div>

 </div></div>`;
}
