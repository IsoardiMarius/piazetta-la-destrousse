// Génère carte.pdf à partir de carte.html, ainsi que la vignette de la carte
// (assets/apercu-carte.jpg). Utilisé automatiquement à chaque publication.
// Utilisation : node scripts/generer-pdf.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(racine, 'carte.html')).href + '?pdf';

async function ouvrir(browser, options = {}) {
  const page = await browser.newPage(options);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('html[data-ready="ok"], html[data-ready="error"]', { timeout: 20000 });
  if ((await page.getAttribute('html', 'data-ready')) !== 'ok') {
    throw new Error('La carte ne s’est pas affichée correctement (vérifiez le dossier contenu/).');
  }
  return page;
}

const browser = await chromium.launch();
try {
  // 1. Le PDF (page 1 : produits principaux ; page 2 : autres produits, s'il y en a)
  const page = await ouvrir(browser);
  const trop = await page.getAttribute('html', 'data-trop-long');
  if (trop !== null) {
    const pages = trop.split(',');
    const msg = '### ⚠️ La carte est trop longue pour tenir sur une page A4\n' +
      (pages.includes('1') ? '- Page 1 : le bas est coupé. Masquer quelques produits ou raccourcir des descriptions dans Pages CMS (rubrique « Carte (page 1) »).\n' : '') +
      (pages.includes('2') ? '- Page 2 : le bas est coupé. Masquer quelques articles dans Pages CMS (rubrique « Carte (page 2) »).\n' : '');
    console.warn(msg);
    fs.appendFileSync('rapport-contenu.md', msg);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, msg);
  }
  const nbPages = (await page.evaluate(() => document.documentElement.classList.contains('has-page2'))) ? 2 : 1;
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(racine, 'carte.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, pageRanges: nbPages === 2 ? '1-2' : '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(`✅ PDF généré : carte.pdf (${nbPages} page${nbPages > 1 ? 's' : ''})`);

  // 2. La vignette de la carte affichée sur la page d'accueil (286 px de large, écrans haute définition)
  const vignette = await ouvrir(browser, { viewport: { width: 794, height: 1123 }, deviceScaleFactor: 572 / 794 });
  await vignette.screenshot({ path: path.join(racine, 'assets', 'apercu-carte.jpg'), type: 'jpeg', quality: 84 });
  console.log('✅ Vignette générée : assets/apercu-carte.jpg');
} finally {
  await browser.close();
}
