/* ==========================================================================
   LA CARTE DE LA PIAZZETTA
   --------------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour changer la carte, les prix ou les
   horaires. Le site, la carte A4 et le PDF téléchargeable se mettent à jour
   tout seuls à partir de ce fichier.

   Comment faire :
   1. Sur GitHub, ouvrez ce fichier puis cliquez sur le crayon (« Edit »).
   2. Modifiez le texte ENTRE LES GUILLEMETS "..." uniquement.
   3. Gardez la virgule à la fin de chaque ligne / de chaque bloc { ... }.
   4. Cliquez sur « Commit changes ». Le site est à jour en 1 à 2 minutes.

   Ajouter une pizza    : copiez une ligne { nom: ..., prix: [...] }, collez-la
                          en dessous, puis changez le nom, les ingrédients et
                          les prix.
   Retirer une pizza    : supprimez sa ligne.
   Changer un prix      : les 3 nombres de « prix » suivent l'ordre des tailles
                          (Petite, Big, Mega). Les centimes s'écrivent avec un
                          point : 12.5 s'affichera « 12,50 € ».
   Mettre en avant      : ajoutez  badge: "Nouveau"  (ou "Du moment", etc.).
   Pizza du moment      : ajoutez  masquee: true  pour cacher une pizza sans
                          la supprimer.
   ========================================================================== */

window.CARTE = {

  /* --- Les tailles (dans l'ordre des prix) ------------------------------ */
  tailles: [
    { nom: "Petite", taille: "30 cm" },
    { nom: "Big",    taille: "35 cm" },
    { nom: "Mega",   taille: "50 cm" },
  ],

  /* --- Les pizzas -------------------------------------------------------- */
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

  /* --- Phrase affichée sous la carte ------------------------------------- */
  mention: "Recette artisanale à l’huile d’olive · Produits frais · Pâte légère et savoureuse, comme autrefois",

  /* --- Infos pratiques --------------------------------------------------- */
  telephone: "06 40 92 51 76",
  adresse: "842 avenue de la Doulia",
  ville: "13112 La Destrousse",
  zoneLivraison: "La Destrousse et alentours",

  /* Horaires : "18h-22h" pour un jour ouvert, "" pour un jour fermé.
     Pour une coupure le midi : "11h30-14h, 18h-22h". */
  horaires: {
    lundi:    "",
    mardi:    "18h-22h",
    mercredi: "18h-22h",
    jeudi:    "18h-22h",
    vendredi: "18h-22h",
    samedi:   "18h-22h",
    dimanche: "",
  },

  /* Lien Google Maps (itinéraire et avis) */
  lienGoogle: "https://www.google.com/maps/search/?api=1&query=Piazzetta%20La%20Destrousse&query_place_id=ChIJn-yuT0iZyRIRGalZ9F80kp4",

};
