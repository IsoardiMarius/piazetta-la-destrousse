// Pré-remplit les pages publiées avec le contenu de carte.js, infos.js et des photos,
// et ajoute ce qu'il faut pour Google et les aperçus de liens (WhatsApp, Facebook…).
// Les visiteurs et les moteurs de recherche reçoivent ainsi des pages déjà complètes,
// sans attendre JavaScript.
//
// Utilisation (lancé automatiquement à la publication) :
//   node scripts/precalculer.mjs <dossier-du-site> <adresse-du-site>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const dossier = path.resolve(process.argv[2] || '_site');
let base = process.argv[3] || '';
if (base && !base.endsWith('/')) base += '/';

const lire = (f) => fs.readFileSync(path.join(dossier, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(dossier, f));
const ecrire = (f, contenu) => fs.writeFileSync(path.join(dossier, f), contenu);

const window = {};
vm.runInNewContext(lire('carte.js') + '\n' + lire('infos.js'), { window });
const D = PZ.donnees(window);
const T = PZ.textes(D);
const photos = existe('assets/photos.json') ? JSON.parse(lire('assets/photos.json')) : [];

const html = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => html(s).replace(/"/g, '&quot;');
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Remplace le contenu de chaque élément portant l'attribut donné */
function remplirTout(page, attribut, contenu) {
  const re = new RegExp(`(<(\\w+)\\b[^>]*\\s${attribut}(?=[\\s>])[^>]*>)([\\s\\S]*?)(</\\2>)`, 'g');
  return page.replace(re, (_, ouv, _t, _c, ferm) => ouv + contenu + ferm);
}
function remplirBinds(page) {
  for (const [k, v] of Object.entries(T)) page = remplirTout(page, `data-bind="${reEsc(k)}"`, html(v));
  return page;
}
function afficher(page, attribut) {
  return page.replace(new RegExp(`(<[^>]*\\s${attribut}(?=[\\s>])[^>]*?)\\s+hidden(?=[\\s>])`, 'g'), '$1');
}
function liens(page) {
  const tel = PZ.telLink(D.telephone);
  page = page.replace(/href="tel:[^"]*"/g, `href="${attr(tel)}"`)
    .replace(/aria-label="Appeler le [^"]*"/g, `aria-label="${attr('Appeler le ' + D.telephone)}"`);
  if (D.lienGoogle) page = page.replace(/href="[^"]*"(?=[^>]*data-google)/g, `href="${attr(D.lienGoogle)}"`);
  return page;
}
function meta(page, { titre, description, url, image }) {
  const balises = [
    `<meta name="description" content="${attr(description)}">`,
    url && `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:site_name" content="Piazzetta La Destrousse">`,
    `<meta property="og:title" content="${attr(titre)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    url && `<meta property="og:url" content="${attr(url)}">`,
    image && `<meta property="og:image" content="${attr(image)}">`,
    image && `<meta property="og:image:width" content="1200">`,
    image && `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${attr(titre)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    image && `<meta name="twitter:image" content="${attr(image)}">`,
  ].filter(Boolean);
  page = page.replace(/\s*<meta (name|property)="(description|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
    .replace(/\s*<link rel="canonical"[^>]*>/g, '');
  return page.replace(/(<title>[^<]*<\/title>)/, `$1\n${balises.join('\n')}`);
}

/* ---------- Page d'accueil ---------- */
let accueil = lire('index.html');
accueil = remplirBinds(accueil);
accueil = remplirTout(accueil, 'data-histoire', PZ.htmlHistoire(D));
accueil = remplirTout(accueil, 'data-hours', PZ.htmlHoraires(D, null, ''));
if (photos.length) {
  accueil = remplirTout(accueil, 'data-gallery', PZ.htmlGalerie(photos))
    .replace(/(<ul class="gallery" data-gallery)/, `$1 data-count="${Math.min(photos.length, 6)}"`);
  accueil = afficher(afficher(accueil, 'data-photos'), 'data-photos-link');
}
accueil = liens(accueil);
const imageAccueil = base + (existe('assets/og-accueil.jpg') ? 'assets/og-accueil.jpg' : 'assets/og-image.jpg');
accueil = meta(accueil, {
  titre: 'Piazzetta La Destrousse — Pizzeria artisanale',
  description: PZ.description(D),
  url: base,
  image: base && imageAccueil,
});
if (base) {
  const ld = JSON.stringify(PZ.jsonLd(D, base, photos)).replace(/</g, '\\u003c');
  accueil = accueil.replace('</head>', `<script type="application/ld+json">${ld}</script>\n</head>`);
}
ecrire('index.html', accueil);

/* ---------- Carte ---------- */
let carte = lire('carte.html');
carte = remplirBinds(carte);
carte = remplirTout(carte, 'data-head', PZ.htmlEnteteTailles(D));
carte = remplirTout(carte, 'data-rows', PZ.htmlLignesCarte(D));
carte = liens(carte);
carte = meta(carte, {
  titre: 'La carte — Piazzetta La Destrousse',
  description: PZ.descriptionCarte(D),
  url: base && base + 'carte.html',
  image: base && existe('assets/og-carte.jpg') ? base + 'assets/og-carte.jpg' : base && imageAccueil,
});
ecrire('carte.html', carte);

/* ---------- Page 404 : chemins absolus, elle peut s'afficher à n'importe quelle adresse ---------- */
if (existe('404.html') && base) {
  ecrire('404.html', liens(lire('404.html')).replace('<head>', `<head>\n<base href="${attr(base)}">`));
}

/* ---------- Plan du site et robots.txt pour les moteurs de recherche ---------- */
if (base) {
  const jour = new Date().toISOString().slice(0, 10);
  ecrire('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${html(base)}</loc><lastmod>${jour}</lastmod></url>
  <url><loc>${html(base)}carte.html</loc><lastmod>${jour}</lastmod></url>
</urlset>
`);
  ecrire('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);
}

console.log(`✅ Pages pré-remplies (${photos.length} photo(s))${base ? ' pour ' + base : ''}.`);
