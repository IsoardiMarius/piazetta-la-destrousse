// Vérifie le contenu (dossier contenu/) avant de publier le site.
// - Erreur grave (fichier illisible, carte vide) : la publication s'arrête, l'ancien site reste en ligne.
// - Avertissement : le site est publié, l'élément fautif est ignoré ; le message est signalé.
// Utilisation : node scripts/verifier-contenu.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chargerContenu } from './contenu.mjs';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

let contenu;
try {
  contenu = chargerContenu();
} catch (e) {
  rapporter([e.message], []);
  process.exit(1);
}
const { erreurs, avertissements } = PZ.valider(contenu.CARTE, contenu.INFOS);
(contenu.photos || []).forEach((p, i) => {
  const chemin = String((p && p.image) || '').replace(/^\//, '');
  if (!chemin) avertissements.push(`Photos : la photo n°${i + 1} n’a pas d’image (ignorée).`);
  else if (!fs.existsSync(chemin)) avertissements.push(`Photos : l’image « ${chemin} » est introuvable (ignorée).`);
});
{
  const logo = String((contenu.INFOS && contenu.INFOS.logo) || '').replace(/^\//, '');
  if (logo && !fs.existsSync(logo)) avertissements.push(`Logo : l’image « ${logo} » est introuvable (le logo d’origine est conservé).`);
}
{
  const photo = String((contenu.INFOS && contenu.INFOS.flyer && contenu.INFOS.flyer.photo) || '').replace(/^\//, '');
  if (photo && !fs.existsSync(photo)) avertissements.push(`Flyer : l’image « ${photo} » est introuvable (la 1re photo de l’accueil est utilisée).`);
}
rapporter(erreurs, avertissements);
if (erreurs.length) process.exit(1);
const D = PZ.donnees(contenu);
console.log(`✅ Contenu valide : ${PZ.produitsVisibles(D).length} produit(s) en page 1, ${(D.tailles || []).length} taille(s), ${contenu.photos.length} photo(s).`);

/* Affiche les messages et les garde pour le résumé de publication et l'alerte en cas d'échec */
function rapporter(err, avert) {
  const lignes = [];
  if (err.length) lignes.push('### ❌ Publication arrêtée', ...err.map((e) => '- ' + e), '');
  if (avert.length) lignes.push('### ⚠️ Points à vérifier (le site est publié quand même)', ...avert.map((e) => '- ' + e), '');
  if (!lignes.length) return;
  const texte = lignes.join('\n');
  console.log(texte);
  fs.writeFileSync('rapport-contenu.md', texte + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte + '\n');
}
