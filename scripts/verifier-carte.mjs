// Vérifie carte.js et infos.js avant de publier le site.
// Utilisation : node scripts/verifier-carte.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const window = {};
let ok = true;

for (const fichier of ['carte.js', 'infos.js']) {
  const source = readFileSync(new URL('../' + fichier, import.meta.url), 'utf8');
  try {
    vm.runInNewContext(source, { window }, { filename: fichier });
  } catch (e) {
    const ligne = (e.stack || '').split('\n').find((l) => l.includes(fichier)) || '';
    console.error(`\n❌ ${fichier} contient une erreur de frappe : ${e.message}`);
    if (ligne) console.error('   Ligne : ' + ligne.trim());
    console.error('   Astuce : vérifiez les guillemets "..." et la virgule en fin de ligne.\n');
    ok = false;
  }
}
if (!ok) process.exit(1);

const erreurs = [...PZ.validerCarte(window.CARTE), ...PZ.validerInfos(window.INFOS)];
if (erreurs.length) {
  console.error(`\n❌ ${erreurs.length} problème(s) à corriger :`);
  for (const e of erreurs) console.error('   • ' + e);
  console.error('');
  process.exit(1);
}
const D = PZ.donnees(window);
console.log(`✅ carte.js et infos.js sont valides : ${PZ.pizzasVisibles(D).length} pizzas, ${D.tailles.length} tailles.`);
