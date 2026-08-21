/* Test dymny: przechodzi N sezonów kariery i zbiera błędy konsoli.
   Uruchomienie: node smoke.js <ścieżka-do-index.html> <seed> <sezony> */
const { chromium } = require('playwright');
const path = require('path');

const file = path.resolve(process.argv[2] || 'index.html');
const seed = Number(process.argv[3] || 12345);
const seasons = Number(process.argv[4] || 12);
const mode = Number(process.argv[5] || 0);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,   // podmień, jeśli masz Chrome w nietypowym miejscu
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  // Deterministyczny Math.random przed jakimkolwiek skryptem strony.
  await page.addInitScript(s => {
    let x = s >>> 0;
    Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }, seed);

  await page.route(/^https?:/, r => r.abort());
  await page.goto('file://' + file, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof G !== 'undefined' && G && G.screen, null, { timeout: 20000 });

  const result = await page.evaluate(async ({n, mode}) => {
    const log = [];
    let guard = 0;
    // start kariery
    doCreate();
    while (log.length < n && guard++ < 8000) {
      const s = G.screen;
      if (s === 'create') { doCreate(); }
      else if (s === 'sign') {
        if (typeof _offers !== 'undefined' && _offers.length) pickOffer(mode ? _offers.length - 1 : 0);
        else skipYear();
      }
      else if (s === 'mech') mechContinue();
      else if (s === 'renew') doRenew(mode ? 0 : 1);
      else if (s === 'winter') { if (!G.wevDone) chooseWev(mode ? G.wev.o.length - 1 : 0); else afterWinter(); }
      else if (s === 'tribunal') { if (!G.tribunalDone) resolveTribunal(!mode); else afterTribunal(); }
      else if (s === 'hub') startSeason();
      else if (s === 'event') chooseEv(mode ? G.ev.o.length - 1 : 0);
      else if (s === 'evsum') finishEv();
      else if (s === 'big') bigChoose(mode ? 'ride' : (guard % 2 ? 'sim' : 'ride'));
      else if (s === 'live') {
        const L = G.live;
        if (!L) { seasonRoute(seasonStep({ a: 'go' })); }
        else if (L.phase === 'coach') liveAct(mode ? 'argue' : 'accept');
        else if (L.phase === 'race') {
          const opts = L.race.options.filter(x => x.id !== 'plot');
          const o = mode ? opts[opts.length - 1] : opts[0];
          liveAct(L.race.ph === 0 ? 'start' : 'move', o.id);
        } else liveAct('go');
      }
      else if (s === 'summary') {
        const r = G.last;
        log.push({ year: r.year, club: r.club, m: r.matches, h: r.heats, p: r.pts,
                   bon: r.bonus, avg: r.avgTxt, ovr: r.ovrTo, pos: r.pos,
                   budget: Math.round(G.p.budget), grade: r.grade.t });
        // przeklikaj wszystkie zakładki podsumowania — renderują cały UI raportu
        try { seasonTabs(r).forEach(t => setTab(t.k)); setTab('sezon'); } catch (e) { log.push({ tabErr: String(e) }); }
        nextYear();
      }
      else if (s === 'end') {
        try { scEnd(); careerCardHtml(); smTrophies(); } catch (e) { log.push({ endErr: String(e) }); }
        log.push({ end: G.p.retireReason, seasons: G.p.career.seasons, pts: G.p.career.pts });
        break;
      }
      else { log.push({ unknownScreen: s }); break; }
    }
    return { log, guard, screen: G.screen, html: document.getElementById('app').innerHTML.length };
  }, {n: seasons, mode});

  console.log(JSON.stringify({ errors, ...result }, null, 1));
  await browser.close();
  if (errors.length) process.exitCode = 2;
})();
