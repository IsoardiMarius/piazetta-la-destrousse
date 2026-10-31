// Génère les images d'aperçu des liens partagés (SMS, WhatsApp, Facebook…),
// dessinées comme une petite page aux couleurs du site, avec ses vraies polices.
//   assets/og-accueil.jpg : logo, nom, « Pizzeria à … », téléphone + la première photo
//   assets/og-carte.jpg   : « La carte », nombre de pizzas, prix + la vignette de la carte
// Utilisation (lancé automatiquement à la publication) :
//   node scripts/generer-apercus.mjs <dossier-du-site>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chargerContenu } from './contenu.mjs';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const dossier = path.resolve(process.argv[2] || '_site');
const lire = (f) => fs.readFileSync(path.join(dossier, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(dossier, f));

const D = PZ.donnees(chargerContenu());
const T = PZ.textes(D);
const photos = existe('assets/photos.json') ? JSON.parse(lire('assets/photos.json')) : [];
const fp = PZ.fourchettePrix(D);
const esc = PZ.esc;

const tel = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

const style = `
@font-face{font-family:'Bricolage Grotesque';src:url(assets/fonts/bricolage-latin.woff2) format('woff2');font-weight:600 700}
@font-face{font-family:'DM Sans';src:url(assets/fonts/dmsans-latin.woff2) format('woff2');font-weight:400 600}
*{box-sizing:border-box}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#F6F0E6}
.card{position:relative;width:1200px;height:630px;overflow:hidden;background:#F6F0E6;color:#241411;font-family:'DM Sans',sans-serif}
.card::before{content:"";position:absolute;right:-180px;top:50%;width:820px;height:820px;margin-top:-410px;border-radius:50%;background:#EDE2D2}
.txt{position:absolute;left:84px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center}
.logo{width:88px;height:88px;border-radius:50%;margin-bottom:34px}
.kicker{font-size:21px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#6B1A14;margin-bottom:12px}
h1{margin:0;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:100px;line-height:.95;letter-spacing:-.045em}
.sub{margin-top:22px;font-size:29px;line-height:1.35;color:#5E4C47;max-width:480px;text-wrap:balance}
.tel{margin-top:38px;display:inline-flex;align-items:center;gap:14px;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:34px;letter-spacing:-.01em;color:#6B1A14}
.pizza{position:absolute;right:-96px;top:50%;width:620px;height:620px;margin-top:-310px;border-radius:50%;object-fit:cover;box-shadow:0 44px 90px -34px rgba(82,19,16,.6)}
.feuille{position:absolute;right:96px;top:70px;width:400px;border-radius:10px;transform:rotate(4deg);box-shadow:0 40px 80px -30px rgba(36,20,17,.55)}
`;

function page(contenu) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${style}</style></head><body><div class="card">${contenu}</div></body></html>`;
}

const accueil = page(`
  <div class="txt">
    <img class="logo" src="assets/logo-360.webp" alt="">
    <div class="kicker">${esc(T.lieu)}</div>
    <h1>${esc(PZ.nomCourt(D))}</h1>
    <div class="sub">Pizzas artisanales ${esc(PZ.service(D).phrase)}</div>
    <div class="tel">${tel}${esc(D.telephone || '')}</div>
  </div>
  ${photos.length ? `<img class="pizza" src="${esc(photos[0].grande)}" alt="">` : `<img class="pizza" src="assets/logo-720.webp" alt="" style="object-fit:contain;background:#F6F0E6">`}
`);

const n = PZ.pizzasVisibles(D).length, nt = (D.tailles || []).length;
const carte = page(`
  <div class="txt">
    <img class="logo" src="assets/logo-360.webp" alt="">
    <div class="kicker">La carte · ${esc(PZ.nomCourt(D))}</div>
    <h1>${n} pizza${n > 1 ? 's' : ''}</h1>
    <div class="sub">${nt} taille${nt > 1 ? 's' : ''}${fp ? `, de ${esc(PZ.prix(fp.min))} à ${esc(PZ.prix(fp.max))}` : ''}.<br>${esc(PZ.cap(PZ.service(D).phrase))}.</div>
    <div class="tel">${tel}${esc(D.telephone || '')}</div>
  </div>
  ${existe('assets/apercu-carte.jpg') ? '<img class="feuille" src="assets/apercu-carte.jpg" alt="">' : ''}
`);

const browser = await chromium.launch();
try {
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [nom, html] of [['og-accueil.jpg', accueil], ['og-carte.jpg', carte]]) {
    const fichier = path.join(dossier, '_apercu.html');
    fs.writeFileSync(fichier, html);
    await p.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
    await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
    await p.screenshot({ path: path.join(dossier, 'assets', nom), type: 'jpeg', quality: 88 });
    fs.unlinkSync(fichier);
    console.log('✅ Aperçu de lien généré : assets/' + nom);
  }
} finally {
  await browser.close();
}
