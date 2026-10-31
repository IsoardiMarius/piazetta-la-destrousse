// Génère carte.pdf à partir de carte.html (utilisé automatiquement lors du déploiement).
// Utilisation : node scripts/generer-pdf.mjs [dossier-de-sortie]
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sortie = path.resolve(process.argv[2] || racine, 'carte.pdf');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const url = pathToFileURL(path.join(racine, 'carte.html')).href + '?pdf';
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('html[data-ready]', { timeout: 15000 });
  const etat = await page.getAttribute('html', 'data-ready');
  if (etat !== 'ok') throw new Error('La carte ne s’est pas affichée correctement (vérifiez carte.js).');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: sortie, format: 'A4', printBackground: true, preferCSSPageSize: true, pageRanges: '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('✅ PDF généré : ' + path.relative(process.cwd(), sortie));
} finally {
  await browser.close();
}
