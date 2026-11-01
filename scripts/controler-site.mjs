// Contrôle final du site généré, avant sa mise en ligne : vérifie que tout ce qui a
// été produit (pages, carte A4, PDF, photos, aperçus de liens, données pour Google,
// plan du site) correspond bien au contenu du dossier contenu/.
// En cas d'écart, la publication s'arrête : l'ancien site reste en ligne.
// Utilisation : node scripts/controler-site.mjs <dossier-du-site> [adresse-du-site]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chargerContenu } from './contenu.mjs';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const dossier = path.resolve(process.argv[2] || '_site');
let base = process.argv[3] || '';
if (base && !base.endsWith('/')) base += '/';

const contenu = chargerContenu();
const D = PZ.donnees(contenu);
const T = PZ.textes(D);
const problemes = [];
const lire = (f) => fs.readFileSync(path.join(dossier, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(dossier, f.split('?')[0]));
const html = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const present = (page, valeur) => [String(valeur), html(valeur), PZ.esc(valeur)].some((v) => page.includes(v));
const verifier = (condition, message) => { if (!condition) problemes.push(message); };

/* Contenu d'un élément repéré par un attribut (balises imbriquées comptées) */
function contenuDe(page, attribut) {
  const m = new RegExp(`<(\\w+)\\b[^>]*\\s${attribut}(?=[\\s>])[^>]*>`).exec(page);
  if (!m) return null;
  const debut = m.index + m[0].length, balise = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, 'gi');
  balise.lastIndex = debut;
  let niveau = 1, b;
  while ((b = balise.exec(page))) {
    niveau += b[1] ? -1 : 1;
    if (niveau === 0) return page.slice(debut, b.index);
  }
  return null;
}
function cache(page, attribut) {
  const m = page.match(new RegExp(`<[^>]*\\s${attribut}(?=[\\s>])[^>]*>`));
  return m ? /\shidden(?=[\s>])/.test(m[0]) : null;
}

/* ---------- Fichiers attendus ---------- */
for (const f of ['index.html', 'carte.html', '404.html', 'flyer.html', 'donnees.js', 'carte.pdf', 'flyer.pdf', 'assets/apercu-carte.jpg', 'assets/og-accueil.jpg', 'assets/og-carte.jpg', 'assets/photos.json']) {
  verifier(existe(f), `Fichier manquant : ${f}`);
}
if (base) for (const f of ['sitemap.xml', 'robots.txt', 'assets/qr-carte.svg']) verifier(existe(f), `Fichier manquant : ${f}`);
if (problemes.length) terminer();

/* ---------- donnees.js = contenu ---------- */
const donnees = {};
new Function('window', lire('donnees.js'))(donnees);
verifier(JSON.stringify(donnees.CARTE) === JSON.stringify(contenu.CARTE), 'donnees.js ne correspond pas à contenu/carte.json');
verifier(JSON.stringify(donnees.INFOS) === JSON.stringify(contenu.INFOS), 'donnees.js ne correspond pas aux infos (horaires, contact, textes)');

const accueil = lire('index.html');
const carte = lire('carte.html');
const flyer = lire('flyer.html');
const pizzas = PZ.produitsVisibles(D);
const tailles = D.tailles || [];

/* ---------- Valeurs impossibles ---------- */
for (const [nom, page] of [['index.html', accueil], ['carte.html', carte], ['404.html', lire('404.html')], ['flyer.html', flyer]]) {
  const sansScripts = page.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const mot of ['undefined', 'NaN', '[object Object]']) verifier(!sansScripts.includes(mot), `${nom} contient « ${mot} »`);
}

/* ---------- Nom de l'établissement ---------- */
for (const [nom, page] of [['index.html', accueil], ['carte.html', carte]]) {
  for (const m of page.matchAll(/download="([^"]*)"/g)) verifier(m[1] === PZ.nomPdf(D), `${nom} : le PDF se télécharge sous le nom « ${m[1]} » au lieu de « ${PZ.nomPdf(D)} »`);

}

/* ---------- Page d'accueil ---------- */
/* Titres des onglets : ceux du contenu (personnalisés ou générés) */
const page404 = lire('404.html');
for (const [nom, page, attendu] of [['Accueil', accueil, PZ.titrePageAccueil(D)], ['Carte', carte, PZ.titrePageCarte(D)], ['Page introuvable', page404, PZ.titrePage404(D)]]) {
  const titre = (page.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (nom !== 'Page introuvable' || base) verifier(titre === html(attendu), `${nom} : titre de l'onglet « ${titre} » au lieu de « ${attendu} »`);
}

/* Attributs reliés au contenu : texte des images (data-bind-alt), nom lu par les lecteurs d'écran (data-bind-aria) */
/* (la page introuvable n'est pré-remplie que pour la publication, avec l'adresse du site) */
const pagesReliees = [['Accueil', accueil], ['Carte', carte]].concat(base ? [['Page introuvable', page404]] : []);
for (const [nom, page] of pagesReliees) {
  for (const [marque, attribut] of [['data-bind-alt', 'alt'], ['data-bind-aria', 'aria-label']]) {
    for (const m of page.matchAll(new RegExp(`<[^>]*\\s${marque}="([^"]+)"[^>]*>`, 'g'))) {
      const valeur = (m[0].match(new RegExp(`\\s${attribut}="([^"]*)"`)) || [])[1];
      verifier(T[m[1]] !== undefined && valeur === html(T[m[1]]).replace(/"/g, '&quot;'), `${nom} : ${attribut} « ${valeur} » au lieu de « ${T[m[1]]} »`);
    }
  }
}

/* Chaque texte relié au contenu (data-bind), sur chaque page, doit afficher exactement le contenu */
for (const [nom, page] of pagesReliees) {
  const cles = new Set([...page.matchAll(/\sdata-bind="([^"]+)"/g)].map((m) => m[1]));
  for (const k of cles) {
    if (T[k] === undefined) { verifier(false, `${nom} : le texte « ${k} » n'existe pas dans le contenu`); continue; }
    const valeurs = [];
    let reste = page, i;
    while ((i = reste.indexOf(`data-bind="${k}"`)) >= 0) {
      const debut = reste.lastIndexOf('<', i);
      valeurs.push(contenuDe(reste.slice(debut), `data-bind="${k}"`));
      reste = reste.slice(i + 10);
    }
    valeurs.forEach((v) => verifier(v === html(T[k]), `${nom} : « ${k} » affiche « ${v} » au lieu de « ${T[k]} »`));
  }
}
verifier(contenuDe(accueil, 'data-histoire') === PZ.htmlHistoire(D), 'Accueil : le texte « La maison » ne correspond pas au contenu');
for (const m of accueil.matchAll(/<[^>]*\sdata-maison(?:-link)?(?=[\s>])[^>]*>/g)) {
  verifier(/\shidden(?=[\s>])/.test(m[0]) === !PZ.htmlHistoire(D), 'Accueil : la section « La maison » est affichée ou masquée à tort');
}
verifier(contenuDe(accueil, 'data-hours') === PZ.htmlHoraires(D, null, ''), 'Accueil : les horaires affichés ne correspondent pas au contenu');
const tel = PZ.telLink(D.telephone);
const liensTel = accueil.match(/href="tel:[^"]*"/g) || [];
verifier(liensTel.length >= 4 && liensTel.every((l) => l === `href="${tel}"`), `Accueil : les boutons « Appeler » ne pointent pas tous vers ${tel}`);

const annonce = String(D.annonce || '').trim();
if (annonce) {
  verifier(cache(accueil, 'data-annonce') === false && present(contenuDe(accueil, 'data-annonce-text') || '', annonce), 'Accueil : le bandeau d\'annonce n\'est pas affiché');
}

const R = D.reseaux || {};
for (const cle of ['uberEats', 'facebook', 'instagram']) {
  const url = /^https?:\/\//.test(R[cle] || '') ? R[cle] : '';
  const items = accueil.match(new RegExp(`<li data-reseau-item="${cle}"[^>]*>\\s*<a[^>]*>`, 'g')) || [];
  for (const it of items) {
    if (url) verifier(!/\shidden/.test(it.split('<a')[0]) && it.includes(`href="${html(url)}"`), `Accueil : le lien ${cle} n'est pas affiché ou pointe ailleurs`);
    else verifier(/\shidden/.test(it.split('<a')[0]), `Accueil : le lien ${cle} est affiché alors qu'il est vide`);
  }
}

/* Photos : nombre, ordre et fichiers */
const photos = JSON.parse(lire('assets/photos.json'));
const attendues = (contenu.photos || []).filter((p) => p && p.image && fs.existsSync(String(p.image).replace(/^\//, '')));
const MAX_PHOTOS = 16;  /* même limite que scripts/preparer-photos.py */
verifier(photos.length === Math.min(attendues.length, MAX_PHOTOS), `Photos : ${photos.length} préparée(s) pour ${attendues.length} dans la liste`);
const galerie = contenuDe(accueil, 'data-gallery') || '';
verifier((galerie.match(/class="ph reveal"/g) || []).length === photos.length, 'Accueil : la galerie ne contient pas toutes les photos');
const legendes = photos.filter((p) => p.texte).map((p) => p.texte);
verifier((galerie.match(/class="ph__leg"/g) || []).length === legendes.length && legendes.every((t) => galerie.includes(`<span class="ph__leg">${PZ.esc(t)}</span>`)), 'Accueil : les légendes des photos ne correspondent pas au contenu');
photos.forEach((p, i) => {
  verifier(existe(p.src) && existe(p.grande), `Photos : fichier manquant pour la photo n°${i + 1}`);
  verifier(galerie.includes(`src="${p.src}"`), `Accueil : la photo n°${i + 1} n'est pas dans la galerie`);
});
verifier(cache(accueil, 'data-photos') === (photos.length === 0), 'Accueil : la section photos est affichée ou masquée à tort');

/* ---------- Page carte (feuille A4, source du PDF) ---------- */
const lignes = (contenuDe(carte, 'data-rows') || '').split('<div class="row">').slice(1);
verifier(lignes.length === pizzas.length, `Carte : ${lignes.length} produits affichés pour ${pizzas.length} dans le contenu`);
pizzas.forEach((p, i) => {
  const l = lignes[i] || '';
  verifier(present(l, p.nom), `Carte : le produit n°${i + 1} devrait être « ${p.nom} »`);
  if (p.description) verifier(l.includes(PZ.multiligne(p.description)), `Carte : description de « ${p.nom} » absente`);
  if (p.badge) verifier(present(l, p.badge), `Carte : badge de « ${p.nom} » absent`);
  const prixAffiches = (l.match(/<span class="row__price">([^<]*)<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, ''));
  const prixAttendus = tailles.map((_, j) => PZ.prix((p.prix || [])[j]));
  verifier(JSON.stringify(prixAffiches) === JSON.stringify(prixAttendus), `Carte : prix de « ${p.nom} » : ${prixAffiches.join(' / ')} au lieu de ${prixAttendus.join(' / ')}`);
});
const nomsVisibles = new Set(pizzas.map((p) => p.nom));
(D.produits || []).filter((p) => p && p.nom && p.masque && !nomsVisibles.has(p.nom))
  .forEach((p) => verifier(!lignes.some((l) => l.includes(`<b>${PZ.esc(p.nom)}<`)), `Carte : « ${p.nom} » est masquée mais affichée`));
const entete = contenuDe(carte, 'data-head') || '';
tailles.forEach((t) => verifier(present(entete, t.taille || t.nom), `Carte : la taille « ${t.taille || t.nom} » n'est pas dans l'en-tête`));

/* ---------- Couleurs choisies dans Pages CMS ---------- */
{
  const css = PZ.cssCouleurs(D);
  for (const [nom, page] of [['Accueil', accueil], ['Carte', carte]]) {
    const style = (page.match(/<style id="couleurs">([\s\S]*?)<\/style>/) || [])[1] || '';
    verifier(style === css, css ? `${nom} : les couleurs choisies ne sont pas appliquées` : `${nom} : une feuille de couleurs est présente alors que les couleurs sont celles d'origine`);
  }
}

/* ---------- Flyer à imprimer ---------- */
{
  const titre = (flyer.match(/<title>([^<]*)<\/title>/) || [])[1];
  verifier(titre === html(PZ.titrePageFlyer(D)), `Flyer : titre de l'onglet « ${titre} » au lieu de « ${PZ.titrePageFlyer(D)} »`);
  verifier(flyer.includes('<meta name="robots" content="noindex">'), 'Flyer : la page doit rester hors de Google (noindex)');
  /* Même calcul que scripts/precalculer.mjs */
  const options = {
    photo: existe('assets/flyer-photo.jpg') ? 'assets/flyer-photo.jpg' : '',
    qr: existe('assets/qr-carte.svg') ? 'assets/qr-carte.svg' : '',
    site: base.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  };
  verifier(contenuDe(flyer, 'data-flyer') === PZ.htmlFlyer(D, options), 'Flyer : le flyer ne correspond pas au contenu');
  const F = PZ.textesFlyer(D);
  for (const valeur of [F.nom, F.accroche, F.telephone]) verifier(present(contenuDe(flyer, 'data-flyer') || '', valeur), `Flyer : « ${valeur} » absent`);
  const choix = String((D.flyer || {}).photo || '').replace(/^\//, '');
  const photoAttendue = photos.length > 0 || (!!choix && fs.existsSync(choix));
  verifier(!!options.photo === photoAttendue, photoAttendue ? 'Flyer : photo absente (le logo est affiché à la place)' : 'Flyer : photo présente alors qu’il n’y en a aucune');
  const telechargement = (flyer.match(/download="([^"]*)"/) || [])[1];
  verifier(telechargement === PZ.nomPdf(D, 'Flyer'), `Flyer : le PDF se télécharge sous le nom « ${telechargement} » au lieu de « ${PZ.nomPdf(D, 'Flyer')} »`);
  const style = (flyer.match(/<style id="couleurs">([\s\S]*?)<\/style>/) || [])[1] || '';
  verifier(style === PZ.cssCouleurs(D), 'Flyer : les couleurs choisies ne sont pas appliquées');
  /* PDF pour l'imprimeur : une page de 154 × 216 mm (A5 + 3 mm de fond perdu), format fini A5 indiqué (TrimBox) */
  const pdf = fs.readFileSync(path.join(dossier, 'flyer.pdf'), 'latin1');
  const mm = (cadre) => {
    const n = (pdf.match(new RegExp(`/${cadre}\\s*\\[\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s*\\]`)) || []).slice(1).map(Number);
    return n.length === 4 ? [(n[2] - n[0]) * 25.4 / 72, (n[3] - n[1]) * 25.4 / 72] : [];
  };
  const proche = (t, l, h) => t.length === 2 && Math.abs(t[0] - l) < 0.05 && Math.abs(t[1] - h) < 0.05;
  verifier(proche(mm('MediaBox'), 154, 216), `Flyer : le PDF ne fait pas 154 × 216 mm (${mm('MediaBox').map((x) => x.toFixed(2)).join(' × ')} mm)`);
  verifier(proche(mm('TrimBox'), 148, 210), 'Flyer : le format fini A5 (TrimBox) n’est pas indiqué dans le PDF');
  verifier((pdf.match(/\/Type\s*\/Page(?!s)/g) || []).length === 1, 'Flyer : le PDF doit avoir une seule page');
  verifier(/<a class="ftr__flyer" href="flyer\.html">/.test(accueil), 'Accueil : le lien « Flyer à imprimer » est absent du pied de page');
  if (base) verifier(!lire('sitemap.xml').includes('flyer'), 'Plan du site : le flyer ne doit pas y figurer');
}

/* ---------- Liens Google (« Itinéraire », « Votre avis ») ---------- */
const G = PZ.liensGoogle(D);
for (const m of accueil.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*\sdata-google="(\w+)"/g)) {
  verifier(m[1] === html(G[m[2]] || G.fiche).replace(/"/g, '&quot;'), `Accueil : lien Google « ${m[2]} » incorrect`);
}

/* ---------- E-mail (accueil et carte) ---------- */
const email = PZ.emailValide(D);
for (const [nom, page, attendu] of [['Accueil', accueil, 2], ['Carte', carte, 2]]) {
  const liensMail = [...page.matchAll(/<a\b[^>]*\sdata-email(?=[\s>])[^>]*>/g)].map((m) => m[0]);
  verifier(liensMail.length === attendu, `${nom} : ${liensMail.length} lien(s) e-mail au lieu de ${attendu}`);
  const blocs = [...page.matchAll(/<[^>]*\sdata-email-bloc(?=[\s>])[^>]*>/g)].map((m) => m[0]);
  verifier(blocs.every((b) => /\shidden(?=[\s>])/.test(b) === !email), email ? `${nom} : l'e-mail est renseigné mais masqué` : `${nom} : un e-mail est affiché alors qu'il est vide`);
  verifier(liensMail.every((l) => l.includes(`href="mailto:${html(email)}"`)), email ? `${nom} : lien e-mail incorrect` : `${nom} : une ancienne adresse e-mail reste dans la page`);
}

/* ---------- Résumé des heures (accueil et pied de page de la carte) ---------- */
verifier(contenuDe(accueil, 'data-resume-heures') === PZ.htmlResumeHeures(D), 'Accueil : le résumé des heures ne correspond pas aux horaires');
const resumesCarte = carte.split('data-resume-heures-court').length - 1;
verifier(resumesCarte === 2 && contenuDe(carte, 'data-resume-heures-court') === PZ.htmlResumeHeures(D, true), 'Carte : le résumé des heures du pied de page ne correspond pas aux horaires');

/* ---------- Carte, page 2 : boissons, desserts… ---------- */
const rubriques = PZ.rubriquesVisibles(D);
const page2 = contenuDe(carte, 'data-rubriques') || '';
verifier(cache(carte, 'data-page2') === !rubriques.length, rubriques.length ? 'Carte : la page 2 (boissons et desserts) est masquée alors qu’elle a du contenu' : 'Carte : la page 2 est affichée alors qu’elle est vide');
verifier(cache(carte, 'data-suite') === !rubriques.length, 'Carte : le renvoi « en page 2 » ne correspond pas au contenu');
verifier(page2 === PZ.htmlRubriques(D), 'Carte : la page 2 ne correspond pas au contenu (boissons et desserts)');
const articlesAffiches = page2.match(/<div class="art">/g) || [];
const nbArticles = rubriques.reduce((n, r) => n + r.articles.length, 0);
verifier(articlesAffiches.length === nbArticles, `Carte : ${articlesAffiches.length} boissons et desserts affichés pour ${nbArticles} dans le contenu`);
rubriques.forEach((r) => r.articles.forEach((a) => {
  verifier(page2.includes(`<b>${PZ.esc(a.nom)}`) && page2.includes(`<span class="art__prix">${PZ.prix(a.prix)}</span>`), `Carte : « ${a.nom} » ou son prix est absent de la page 2`);
}));
const visibles2 = new Set(rubriques.flatMap((r) => r.articles.map((a) => a.nom)));
((D.page2 || {}).rubriques || []).forEach((r) => ((r && r.articles) || []).filter((a) => a && a.nom && a.masque && !visibles2.has(a.nom))
  .forEach((a) => verifier(!page2.includes(`<b>${PZ.esc(a.nom)}`), `Carte : « ${a.nom} » est masqué mais affiché en page 2`)));

/* ---------- Google : données structurées, descriptions, plan du site ---------- */
if (base) {
  const ldBrut = (accueil.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  verifier(!!ldBrut, 'Accueil : fiche « Restaurant » pour Google absente');
  if (ldBrut) {
    const ld = JSON.parse(ldBrut)['@graph'].find((g) => g['@type'] === 'Restaurant');
    verifier(ld.name === PZ.nomOfficiel(D), 'Google : nom différent du contenu');
    verifier(ld.telephone === tel.replace('tel:', ''), 'Google : téléphone différent du contenu');
    verifier(ld.address.streetAddress === D.adresse, 'Google : adresse différente du contenu');
    verifier((ld.email || '') === PZ.emailValide(D), 'Google : e-mail différent du contenu');
    const items = ld.hasMenu.hasMenuSection[0].hasMenuItem;
    verifier(items.length === pizzas.length && items.every((it, i) => it.name === pizzas[i].nom && it.offers.length === tailles.length), 'Google : la carte transmise ne correspond pas au contenu');
    const sections = ld.hasMenu.hasMenuSection.slice(1);
    verifier(sections.length === rubriques.length && sections.every((sec, i) => sec.hasMenuItem.length === rubriques[i].articles.length), 'Google : les boissons et desserts transmis ne correspondent pas au contenu');
    const creneaux = PZ.JOURS.reduce((n, j) => n + PZ.parseCreneaux((D.horaires || {})[j]).filter(Boolean).length, 0);
    verifier(ld.openingHoursSpecification.length === creneaux, 'Google : les horaires transmis ne correspondent pas au contenu');
  }
  const attr = (v) => html(v).replace(/"/g, '&quot;');
  verifier(accueil.includes(`<meta name="description" content="${attr(PZ.descriptionAccueil(D))}">`), 'Accueil : description pour Google périmée');
  verifier(carte.includes(`<meta name="description" content="${attr(PZ.descriptionPageCarte(D))}">`), 'Carte : description pour Google périmée');
  verifier(accueil.includes(`<link rel="canonical" href="${base}">`), 'Accueil : adresse canonique incorrecte');
  verifier(carte.includes(`<link rel="canonical" href="${base}carte.html">`), 'Carte : adresse canonique incorrecte');
  for (const [nom, page] of [['Accueil', accueil], ['Carte', carte]]) {
    const img = (page.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '';
    verifier(img.startsWith(base) && existe(img.slice(base.length)), `${nom} : image d'aperçu des liens introuvable (${img})`);
  }
  const plan = lire('sitemap.xml');
  verifier(plan.includes(`<loc>${base}</loc>`) && plan.includes(`<loc>${base}carte.html</loc>`), 'Plan du site incomplet');
  verifier(lire('404.html').includes(`<base href="${base}">`), 'Page 404 : adresse de base absente');
}

terminer();

function terminer() {
  if (!problemes.length) {
    console.log(`✅ Site cohérent avec le contenu : ${pizzas.length} produit(s) en page 1, ${tailles.length} taille(s), ${rubriques.reduce((n, r) => n + r.articles.length, 0)} en page 2, photos, horaires, liens et données Google vérifiés.`);
    process.exit(0);
  }
  const texte = ['### ❌ Le site généré ne correspond pas au contenu (publication arrêtée)', ...problemes.map((p) => '- ' + p), ''].join('\n');
  console.error(texte);
  fs.appendFileSync('rapport-contenu.md', texte + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte + '\n');
  process.exit(1);
}
