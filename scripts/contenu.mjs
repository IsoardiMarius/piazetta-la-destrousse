// Contenu du site : lit les fichiers du dossier contenu/ (modifiés depuis Pages CMS
// ou directement sur GitHub) et produit donnees.js, lu par les pages.
//
//   contenu/carte.json     La carte : tailles, pizzas, phrase sous la carte
//   contenu/boissons-desserts.json  Page 2 de la carte : rubriques (boissons, desserts…) et articles
//   contenu/horaires.json  Horaires, fermeture exceptionnelle, bandeau d'annonce
//   contenu/contact.json   Nom, téléphone, adresse, livraison, réseaux, fiche Google
//   contenu/textes.json    Textes de la page d'accueil
//   contenu/photos.json    Photos de l'accueil (ordre et description)
//
// Utilisation : node scripts/contenu.mjs [dossier-de-sortie]   (écrit donnees.js)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = path.join(RACINE, 'contenu');

const FICHIERS = {
  carte: 'carte.json',
  boissonsDesserts: 'boissons-desserts.json',
  horaires: 'horaires.json',
  contact: 'contact.json',
  textes: 'textes.json',
  photos: 'photos.json',
};

function lireJson(nom, defaut) {
  const chemin = path.join(DOSSIER, nom);
  if (!fs.existsSync(chemin)) return defaut;
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch (e) {
    throw new Error(`contenu/${nom} est illisible (${e.message}). Annulez la dernière modification de ce fichier sur GitHub.`);
  }
}

/* Charge tout le contenu : { CARTE, INFOS, photos } */
export function chargerContenu() {
  const carte = lireJson(FICHIERS.carte, {});
  /* Page 2 de la carte, rangée avec la carte : window.CARTE.boissonsDesserts */
  const page2 = lireJson(FICHIERS.boissonsDesserts, null);
  if (page2 && typeof page2 === 'object') carte.boissonsDesserts = page2;
  const infos = Object.assign({}, lireJson(FICHIERS.horaires, {}), lireJson(FICHIERS.contact, {}), lireJson(FICHIERS.textes, {}));
  const photos = lireJson(FICHIERS.photos, []);
  return { CARTE: carte, INFOS: infos, photos: Array.isArray(photos) ? photos : [] };
}

/* Fichier JavaScript lu par les pages (window.CARTE et window.INFOS) */
export function genererDonneesJs(contenu) {
  const json = (o) => JSON.stringify(o, null, 1).replace(/</g, '\\u003c');
  return `/* Fichier généré automatiquement à partir du dossier contenu/ : ne pas le modifier. */\nwindow.CARTE = ${json(contenu.CARTE)};\nwindow.INFOS = ${json(contenu.INFOS)};\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sortie = path.resolve(process.argv[2] || RACINE);
  try {
    fs.writeFileSync(path.join(sortie, 'donnees.js'), genererDonneesJs(chargerContenu()));
    console.log('✅ donnees.js généré à partir du dossier contenu/');
  } catch (e) {
    console.error('❌ ' + e.message);
    process.exit(1);
  }
}
