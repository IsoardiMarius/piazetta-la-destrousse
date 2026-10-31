// Vérifie que carte.js est valide avant de publier le site.
// Utilisation : node scripts/verifier-carte.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PZ = require('../assets/carte-lib.js');

const source = readFileSync(new URL('../carte.js', import.meta.url), 'utf8');
const ctx = { window: {} };
try {
  vm.runInNewContext(source, ctx, { filename: 'carte.js' });
} catch (e) {
  const where = (e.stack || '').split('\n').find((l) => l.includes('carte.js')) || '';
  console.error('\n❌ carte.js contient une erreur de frappe : ' + e.message);
  if (where) console.error('   ' + where.trim());
  console.error('   Astuce : vérifiez les guillemets "..." et les virgules en fin de ligne.\n');
  process.exit(1);
}

const erreurs = PZ.valider(ctx.window.CARTE);
if (erreurs.length) {
  console.error('\n❌ La carte contient ' + erreurs.length + ' problème(s) :');
  for (const e of erreurs) console.error('   • ' + e);
  console.error('');
  process.exit(1);
}
const C = ctx.window.CARTE;
console.log(`✅ carte.js est valide : ${PZ.pizzasVisibles(C).length} pizzas, ${C.tailles.length} tailles.`);
