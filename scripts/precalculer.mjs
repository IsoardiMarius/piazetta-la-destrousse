// Pré-remplit les pages publiées avec le contenu du dossier contenu/ et les photos,
// et ajoute ce qu'il faut pour Google et les aperçus de liens (WhatsApp, Facebook…).
// Les visiteurs et les moteurs de recherche reçoivent ainsi des pages déjà complètes,
// sans attendre JavaScript.
//
// Utilisation (lancé automatiquement à la publication) :
//   node scripts/precalculer.mjs <dossier-du-site> <adresse-du-site>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chargerContenu } from './contenu.mjs';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const dossier = path.resolve(process.argv[2] || '_site');
let base = process.argv[3] || '';
if (base && !base.endsWith('/')) base += '/';

const lire = (f) => fs.readFileSync(path.join(dossier, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(dossier, f));
const ecrire = (f, contenu) => fs.writeFileSync(path.join(dossier, f), contenu);

const D = PZ.donnees(chargerContenu());
const T = PZ.textes(D);
const photos = existe('assets/photos.json') ? JSON.parse(lire('assets/photos.json')) : [];

const html = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => html(s).replace(/"/g, '&quot;');
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Remplace le contenu de chaque élément portant l'attribut donné.
   Les balises imbriquées du même type sont comptées : on peut relancer le script
   sur une page déjà remplie sans rien casser. */
function remplirTout(page, attribut, contenu) {
  const ouverture = new RegExp(`<(\\w+)\\b[^>]*\\s${attribut}(?=[\\s>])[^>]*>`, 'g');
  let resultat = '', curseur = 0, m;
  while ((m = ouverture.exec(page))) {
    const tag = m[1], debut = m.index + m[0].length;
    const balise = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    balise.lastIndex = debut;
    let niveau = 1, b, fin = -1;
    while ((b = balise.exec(page))) {
      niveau += b[1] ? -1 : 1;
      if (niveau === 0) { fin = b.index; break; }
    }
    if (fin < 0) break;
    resultat += page.slice(curseur, debut) + contenu;
    curseur = fin;
    ouverture.lastIndex = fin;
  }
  return resultat + page.slice(curseur);
}
/* Nom du fichier PDF proposé au téléchargement : « Carte-Nom-De-L-Etablissement.pdf » */
function nommer(page) {
  return page.replace(/download="Carte-[^"]*\.pdf"/g, `download="${attr(PZ.nomPdf(D))}"`);
}
/* Attributs reliés au contenu : data-bind-alt="clé" (texte alternatif d'une image), data-bind-aria="clé" (nom lu par les lecteurs d'écran) */
function remplirAttributs(page) {
  for (const [marque, attribut] of [['data-bind-alt', 'alt'], ['data-bind-aria', 'aria-label']]) {
    page = page.replace(new RegExp(`<[^>]*\\s${marque}="([^"]+)"[^>]*>`, 'g'), (balise, cle) =>
      T[cle] === undefined ? balise : balise.replace(new RegExp(`\\s${attribut}="[^"]*"`), ` ${attribut}="${attr(T[cle])}"`));
  }
  return page;
}
function remplirBinds(page) {
  for (const [k, v] of Object.entries(T)) page = remplirTout(page, `data-bind="${reEsc(k)}"`, html(v));
  return remplirAttributs(page);
}
function afficher(page, attribut) {
  return page.replace(new RegExp(`(<[^>]*\\s${attribut}(?=[\\s>])[^>]*?)\\s+hidden(?=[\\s>])`, 'g'), '$1');
}
function liens(page) {
  const tel = PZ.telLink(D.telephone);
  page = page.replace(/href="tel:[^"]*"/g, `href="${attr(tel)}"`)
    .replace(/aria-label="Appeler le [^"]*"/g, `aria-label="${attr('Appeler le ' + D.telephone)}"`);
  const email = PZ.emailValide(D);
  if (email) {
    page = page.replace(/(<a\b[^>]*?)\shref="[^"]*"([^>]*\sdata-email(?=[\s>]))/g, `$1 href="${attr('mailto:' + email)}"$2`);
    page = afficher(page, 'data-email-bloc');
  }
  const G = PZ.liensGoogle(D);
  page = page.replace(/<a\b([^>]*?)\shref="[^"]*"([^>]*\sdata-google="(\w+)"[^>]*)>/g, (_, avant, apres, type) => `<a${avant} href="${attr(G[type] || G.fiche)}"${apres}>`);
  const R = D.reseaux || {};
  for (const [cle, url] of Object.entries(R)) {
    if (!/^https?:\/\//.test(url || '')) continue;
    page = page.replace(new RegExp(`(<a\\b[^>]*?)\\shref="[^"]*"([^>]*\\sdata-reseau="${cle}")`, 'g'), `$1 href="${attr(url)}"$2`)
      .replace(new RegExp(`(<li\\b[^>]*\\sdata-reseau-item="${cle}")\\s+hidden`, 'g'), '$1');
  }
  const hero = PZ.htmlLiensHero(D);
  if (hero) page = afficher(remplirTout(page, 'data-hero-reseaux', hero), 'data-hero-reseaux');
  const reseaux = PZ.htmlReseaux(D);
  if (reseaux) page = afficher(remplirTout(page, 'data-reseaux', reseaux), 'data-reseaux');
  return page;
}
function meta(page, { titre, description, url, image }) {
  const balises = [
    `<meta name="description" content="${attr(description)}">`,
    url && `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:site_name" content="${attr(PZ.nomOfficiel(D))}">`,
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
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${html(titre)}</title>`);
  return page.replace(/(<title>[^<]*<\/title>)/, `$1\n${balises.join('\n')}`);
}

/* ---------- Page d'accueil ---------- */
let accueil = nommer(lire('index.html'));
accueil = remplirBinds(accueil);
accueil = remplirTout(accueil, 'data-histoire', PZ.htmlHistoire(D));
accueil = remplirTout(accueil, 'data-hours', PZ.htmlHoraires(D, null, ''));
accueil = remplirTout(accueil, 'data-resume-heures', PZ.htmlResumeHeures(D));
if (photos.length) {
  accueil = remplirTout(accueil, 'data-gallery', PZ.htmlGalerie(photos, D))
    .replace(/(<ul class="gallery" data-gallery)(?: data-count="\d+")*/, `$1 data-count="${Math.min(photos.length, 6)}"`);
  accueil = afficher(afficher(accueil, 'data-photos'), 'data-photos-link');
}
accueil = liens(accueil);
/* Bandeau d'annonce saisi dans Pages CMS (le bandeau de congés, lui, dépend de la date et est ajouté par le navigateur) */
if (D.annonce && String(D.annonce).trim()) {
  accueil = afficher(remplirTout(accueil, 'data-annonce-text', html(String(D.annonce).trim())), 'data-annonce');
}
/* Version dans l'adresse des images d'aperçu : WhatsApp, Facebook… rechargent l'image après chaque publication */
const version = (process.env.GITHUB_SHA || '').slice(0, 8);
const v = version ? '?v=' + version : '';
const imageAccueil = base + (existe('assets/og-accueil.jpg') ? 'assets/og-accueil.jpg' : 'assets/og-image.jpg') + v;
accueil = meta(accueil, {
  titre: PZ.titrePageAccueil(D),
  description: PZ.descriptionAccueil(D),
  url: base,
  image: base && imageAccueil,
});
if (base) {
  const ld = JSON.stringify(PZ.jsonLd(D, base, photos)).replace(/</g, '\\u003c');
  accueil = accueil.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
    .replace('</head>', `<script type="application/ld+json">${ld}</script>\n</head>`);
}
ecrire('index.html', accueil);

/* ---------- Carte ---------- */
let carte = nommer(lire('carte.html'));
carte = remplirBinds(carte);
carte = remplirTout(carte, 'data-head', PZ.htmlEnteteTailles(D));
carte = remplirTout(carte, 'data-rows', PZ.htmlLignesCarte(D));
carte = remplirTout(carte, 'data-resume-heures-court', PZ.htmlResumeHeures(D, true));
/* Page 2 (boissons, desserts…) et renvoi depuis la page 1, seulement s'il y a des articles */
carte = remplirTout(carte, 'data-rubriques', PZ.htmlRubriques(D));
if (PZ.rubriquesVisibles(D).length) {
  carte = afficher(afficher(carte, 'data-page2'), 'data-suite').replace(/<html lang="fr"(?![^>]*has-page2)/, '<html lang="fr" class="has-page2"');
}
carte = liens(carte);
carte = meta(carte, {
  titre: PZ.titrePageCarte(D),
  description: PZ.descriptionPageCarte(D),
  url: base && base + 'carte.html',
  image: base && existe('assets/og-carte.jpg') ? base + 'assets/og-carte.jpg' + v : base && imageAccueil,
});
ecrire('carte.html', carte);

/* ---------- Page 404 : chemins absolus, elle peut s'afficher à n'importe quelle adresse ---------- */
if (existe('404.html') && base) {
  ecrire('404.html', liens(remplirBinds(nommer(lire('404.html')))).replace(/<title>[^<]*<\/title>/, `<title>${html(PZ.titrePage404(D))}</title>`)
    .replace(/\n?<base [^>]*>/g, '').replace('<head>', `<head>\n<base href="${attr(base)}">`));
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
