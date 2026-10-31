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
for (const f of ['index.html', 'carte.html', '404.html', 'donnees.js', 'carte.pdf', 'assets/apercu-carte.jpg', 'assets/og-accueil.jpg', 'assets/og-carte.jpg', 'assets/photos.json']) {
  verifier(existe(f), `Fichier manquant : ${f}`);
}
if (base) for (const f of ['sitemap.xml', 'robots.txt']) verifier(existe(f), `Fichier manquant : ${f}`);
if (problemes.length) terminer();

/* ---------- donnees.js = contenu ---------- */
const donnees = {};
new Function('window', lire('donnees.js'))(donnees);
verifier(JSON.stringify(donnees.CARTE) === JSON.stringify(contenu.CARTE), 'donnees.js ne correspond pas à contenu/carte.json');
verifier(JSON.stringify(donnees.INFOS) === JSON.stringify(contenu.INFOS), 'donnees.js ne correspond pas aux infos (horaires, contact, textes)');

const accueil = lire('index.html');
const carte = lire('carte.html');
const pizzas = PZ.pizzasVisibles(D);
const tailles = D.tailles || [];

/* ---------- Valeurs impossibles ---------- */
for (const [nom, page] of [['index.html', accueil], ['carte.html', carte], ['404.html', lire('404.html')]]) {
  const sansScripts = page.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const mot of ['undefined', 'NaN', '[object Object]']) verifier(!sansScripts.includes(mot), `${nom} contient « ${mot} »`);
}

/* ---------- Nom de la pizzeria ---------- */
for (const [nom, page] of [['index.html', accueil], ['carte.html', carte]]) {
  for (const m of page.matchAll(/download="([^"]*)"/g)) verifier(m[1] === PZ.nomPdf(D), `${nom} : le PDF se télécharge sous le nom « ${m[1]} » au lieu de « ${PZ.nomPdf(D)} »`);
  if (PZ.nomOfficiel(D) !== 'Piazzetta La Destrousse') verifier(!page.includes('Piazzetta La Destrousse'), `${nom} contient encore l'ancien nom « Piazzetta La Destrousse »`);
  verifier(/<title>[^<]+<\/title>/.test(page) && page.match(/<title>([^<]*)<\/title>/)[1].includes(html(PZ.nomCourt(D))), `${nom} : le titre de l'onglet ne contient pas le nom de la pizzeria`);
}

/* ---------- Page d'accueil ---------- */
for (const k of ['titre', 'introduction', 'histoireTitre', 'photosTitre', 'histoireSignature', 'telephone', 'resumeJours', 'resumeHeures', 'statutDefaut', 'accroche', 'titreCarte', 'sousTitreCarte', 'livraisonTexte', 'lieu', 'nomPied', 'nomCourt', 'adresse', 'ville']) {
  if (T[k] === undefined || !accueil.includes(`data-bind="${k}"`)) continue;
  const valeur = contenuDe(accueil, `data-bind="${k}"`);
  verifier(valeur === html(T[k]), `Accueil : « ${k} » affiche « ${valeur} » au lieu de « ${T[k]} »`);
}
verifier(contenuDe(accueil, 'data-histoire') === PZ.htmlHistoire(D), 'Accueil : le texte « La maison » ne correspond pas au contenu');
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
verifier(photos.length === Math.min(attendues.length, 12), `Photos : ${photos.length} préparée(s) pour ${attendues.length} dans la liste`);
const galerie = contenuDe(accueil, 'data-gallery') || '';
verifier((galerie.match(/class="ph reveal"/g) || []).length === photos.length, 'Accueil : la galerie ne contient pas toutes les photos');
photos.forEach((p, i) => {
  verifier(existe(p.src) && existe(p.grande), `Photos : fichier manquant pour la photo n°${i + 1}`);
  verifier(galerie.includes(`src="${p.src}"`), `Accueil : la photo n°${i + 1} n'est pas dans la galerie`);
});
verifier(cache(accueil, 'data-photos') === (photos.length === 0), 'Accueil : la section photos est affichée ou masquée à tort');

/* ---------- Page carte (feuille A4, source du PDF) ---------- */
const lignes = (contenuDe(carte, 'data-rows') || '').split('<div class="row">').slice(1);
verifier(lignes.length === pizzas.length, `Carte : ${lignes.length} pizzas affichées pour ${pizzas.length} dans le contenu`);
pizzas.forEach((p, i) => {
  const l = lignes[i] || '';
  verifier(present(l, p.nom), `Carte : la pizza n°${i + 1} devrait être « ${p.nom} »`);
  if (p.ingredients) verifier(present(l, p.ingredients), `Carte : ingrédients de « ${p.nom} » absents`);
  if (p.badge) verifier(present(l, p.badge), `Carte : badge de « ${p.nom} » absent`);
  const prixAffiches = (l.match(/<span class="row__price">([^<]*)<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, ''));
  const prixAttendus = tailles.map((_, j) => PZ.prix((p.prix || [])[j]));
  verifier(JSON.stringify(prixAffiches) === JSON.stringify(prixAttendus), `Carte : prix de « ${p.nom} » : ${prixAffiches.join(' / ')} au lieu de ${prixAttendus.join(' / ')}`);
});
const nomsVisibles = new Set(pizzas.map((p) => p.nom));
(D.pizzas || []).filter((p) => p && p.nom && p.masquee && !nomsVisibles.has(p.nom))
  .forEach((p) => verifier(!lignes.some((l) => l.includes(`<b>${PZ.esc(p.nom)}<`)), `Carte : « ${p.nom} » est masquée mais affichée`));
const entete = contenuDe(carte, 'data-head') || '';
tailles.forEach((t) => verifier(present(entete, t.taille || t.nom), `Carte : la taille « ${t.taille || t.nom} » n'est pas dans l'en-tête`));
for (const k of ['telephone', 'resumeJoursCourt', 'resumeHeures', 'villeCourte', 'mention', 'titrePage2', 'sousTitrePage2', 'mentionPage2', 'suitePage2']) {
  if (T[k] === undefined || !carte.includes(`data-bind="${k}"`)) continue;
  verifier(contenuDe(carte, `data-bind="${k}"`) === html(T[k]), `Carte : « ${k} » ne correspond pas au contenu`);
}

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
((D.boissonsDesserts || {}).rubriques || []).forEach((r) => ((r && r.articles) || []).filter((a) => a && a.nom && a.masque && !visibles2.has(a.nom))
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
    const items = ld.hasMenu.hasMenuSection[0].hasMenuItem;
    verifier(items.length === pizzas.length && items.every((it, i) => it.name === pizzas[i].nom && it.offers.length === tailles.length), 'Google : la carte transmise ne correspond pas au contenu');
    const sections = ld.hasMenu.hasMenuSection.slice(1);
    verifier(sections.length === rubriques.length && sections.every((sec, i) => sec.hasMenuItem.length === rubriques[i].articles.length), 'Google : les boissons et desserts transmis ne correspondent pas au contenu');
    const creneaux = PZ.JOURS.reduce((n, j) => n + PZ.parseCreneaux((D.horaires || {})[j]).filter(Boolean).length, 0);
    verifier(ld.openingHoursSpecification.length === creneaux, 'Google : les horaires transmis ne correspondent pas au contenu');
  }
  const attr = (v) => html(v).replace(/"/g, '&quot;');
  verifier(accueil.includes(`<meta name="description" content="${attr(PZ.description(D))}">`), 'Accueil : description pour Google périmée');
  verifier(carte.includes(`<meta name="description" content="${attr(PZ.descriptionCarte(D))}">`), 'Carte : description pour Google périmée');
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
    console.log(`✅ Site cohérent avec le contenu : ${pizzas.length} pizza(s), ${tailles.length} taille(s), ${rubriques.reduce((n, r) => n + r.articles.length, 0)} boisson(s) et dessert(s), photos, horaires, liens et données Google vérifiés.`);
    process.exit(0);
  }
  const texte = ['### ❌ Le site généré ne correspond pas au contenu (publication arrêtée)', ...problemes.map((p) => '- ' + p), ''].join('\n');
  console.error(texte);
  fs.appendFileSync('rapport-contenu.md', texte + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte + '\n');
  process.exit(1);
}
