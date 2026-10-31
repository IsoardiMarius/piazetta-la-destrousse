// Génère carte.pdf à partir de carte.html, ainsi que la vignette de la carte
// (assets/apercu-carte.jpg). Utilisé automatiquement à chaque publication.
// Utilisation : node scripts/generer-pdf.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(racine, 'carte.html')).href + '?pdf';

async function ouvrir(browser, options = {}) {
  const page = await browser.newPage(options);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('html[data-ready="ok"], html[data-ready="error"]', { timeout: 20000 });
  if ((await page.getAttribute('html', 'data-ready')) !== 'ok') {
    throw new Error('La carte ne s’est pas affichée correctement (vérifiez carte.js et infos.js).');
  }
  return page;
}

const browser = await chromium.launch();
try {
  // 1. Le PDF (une page A4)
  const page = await ouvrir(browser);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(racine, 'carte.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, pageRanges: '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('✅ PDF généré : carte.pdf');

  // 2. La vignette de la carte affichée sur la page d'accueil (286 px de large, écrans haute définition)
  const vignette = await ouvrir(browser, { viewport: { width: 794, height: 1123 }, deviceScaleFactor: 572 / 794 });
  await vignette.screenshot({ path: path.join(racine, 'assets', 'apercu-carte.jpg'), type: 'jpeg', quality: 84 });
  console.log('✅ Vignette générée : assets/apercu-carte.jpg');
} finally {
  await browser.close();
}
