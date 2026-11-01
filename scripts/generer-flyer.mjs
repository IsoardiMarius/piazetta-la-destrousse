// Génère flyer.pdf, le flyer à envoyer à l'imprimeur, à partir de flyer.html :
// format A5 (148 × 210 mm) avec 3 mm de fond perdu tout autour, soit une page de 154 × 216 mm.
// Lancé automatiquement à la publication, une fois les pages pré-remplies et le QR code généré :
//   node scripts/generer-flyer.mjs <dossier-du-site>
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const dossier = path.resolve(process.argv[2] || '_site');
const url = pathToFileURL(path.join(dossier, 'flyer.html')).href + '?pdf';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });  // mise en page de l'impression, vérifiée telle quelle
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('html[data-ready="ok"], html[data-ready="error"]', { timeout: 20000 });
  if ((await page.getAttribute('html', 'data-ready')) !== 'ok') {
    throw new Error('Le flyer ne s’est pas affiché correctement (vérifiez le dossier contenu/).');
  }
  if ((await page.getAttribute('html', 'data-trop-long')) !== null) {
    const msg = '### ⚠️ Le texte du flyer est trop long\n- Il ne tient pas sur le flyer : raccourcir l’accroche ou la phrase mise en avant dans Pages CMS (rubrique « Flyer à imprimer »).\n';
    console.warn(msg);
    fs.appendFileSync('rapport-contenu.md', msg);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, msg);
  }
  await page.pdf({
    path: path.join(dossier, 'flyer.pdf'), width: '154mm', height: '216mm', pageRanges: '1',
    printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('✅ Flyer généré : flyer.pdf (A5 avec 3 mm de fond perdu)');
} finally {
  await browser.close();
}
