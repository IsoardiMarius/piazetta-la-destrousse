/* ==========================================================================
   LA CARTE — pizzas, ingrédients, prix et tailles
   --------------------------------------------------------------------------
   Pour changer les horaires, le téléphone, l'adresse ou les textes du site,
   c'est dans l'autre fichier : infos.js

   Comment modifier (directement sur GitHub) :
   1. Cliquez sur le crayon ✏️ en haut à droite de ce fichier.
   2. Changez uniquement le texte ENTRE GUILLEMETS "..." et les nombres.
   3. Gardez la virgule à la fin de chaque ligne.
   4. Cliquez sur « Commit changes ». Le site, la page carte et le PDF sont
      à jour en 1 à 2 minutes.

   Les 3 prix suivent l'ordre des tailles : [Petite, Big, Mega].
   Les centimes s'écrivent avec un point : 12.5 s'affichera « 12,50 € ».

   Ajouter une pizza   : copiez une ligne, collez-la dessous, modifiez-la.
   Retirer une pizza   : supprimez sa ligne.
   Mettre en avant     : ajoutez  badge: "Nouveau"  dans la ligne.
   Cacher sans effacer : ajoutez  masquee: true  dans la ligne.

   Exemple complet :
   { nom: "Burrata", ingredients: "Tomate fraîche, burrata, basilic", prix: [14, 20, 29], badge: "Nouveau" },
   ========================================================================== */

window.CARTE = {

  tailles: [
    { nom: "Petite", taille: "30 cm" },
    { nom: "Big",    taille: "35 cm" },
    { nom: "Mega",   taille: "50 cm" },
  ],

  pizzas: [
    { nom: "Reine",      ingredients: "Tomate fraîche, jambon, emmental, champignons frais, origan, olives", prix: [11, 17, 26] },
    { nom: "Fermière",   ingredients: "Tomate fraîche, jambon, emmental, champignons frais, œuf, crème, parmesan, origan, olives", prix: [12, 18, 27] },
    { nom: "Chérie",     ingredients: "Tomate fraîche, jambon, emmental, champignons frais, chèvre frais, crème, parmesan, origan, olives", prix: [13, 19, 28] },
    { nom: "5 Fromages", ingredients: "Tomate fraîche, jambon, emmental, champignons frais, chèvre frais, cantal, mozzarella, parmesan, crème de basilic, olives", prix: [15, 21, 30] },
    { nom: "Provençale", ingredients: "Tomate fraîche, emmental, champignons frais, aubergine, courgette, poivron, persillade, olives", prix: [13, 19, 28] },
    { nom: "Atlantique", ingredients: "Tomate fraîche, emmental, champignons frais, saumon fumé, crème, ciboulette, olives", prix: [14, 20, 29] },
    { nom: "Chef",       ingredients: "Tomate fraîche, emmental, champignons frais, poivron, tapenade, petits anchois marinés, olives", prix: [14, 20, 29] },
    { nom: "Orientale",  ingredients: "Tomate fraîche, emmental, champignons frais, merguez de Cadolive, poivron, parmesan, œuf, origan, olives", prix: [13, 19, 28] },
    { nom: "Royale",     ingredients: "Tomate fraîche, jambon, emmental, champignons frais, œuf, parmesan, poivron, chorizo, origan, olives", prix: [13, 19, 28] },
    { nom: "Grand-Mère", ingredients: "Tomate fraîche, jambon, emmental, champignons frais, lardons, artichaut, persillade, œuf, crème, olives", prix: [13, 19, 28] },
    { nom: "Yéyé",       ingredients: "Tomate fraîche, champignons frais, mozzarella, jambon de Parme, crème de basilic, tomate cerise, olives", prix: [14, 20, 29] },
  ],

  /* Petite phrase affichée sous la carte */
  mention: "Recette artisanale à l’huile d’olive · Produits frais · Pâte légère et savoureuse, comme autrefois",

};
