/* ==========================================================================
   LES INFOS DU SITE — horaires, contact, textes, fermetures
   --------------------------------------------------------------------------
   Pour changer les pizzas ou les prix, c'est dans l'autre fichier : carte.js

   Comment modifier (directement sur GitHub) :
   1. Cliquez sur le crayon ✏️ en haut à droite de ce fichier.
   2. Changez uniquement le texte ENTRE GUILLEMETS "...".
   3. Gardez la virgule à la fin de chaque ligne.
   4. Cliquez sur « Commit changes ». Le site est à jour en 1 à 2 minutes.

   Si une faute de frappe se glisse, rien n'est cassé : l'ancien site reste en
   ligne et l'onglet « Actions » de GitHub indique la ligne à corriger.
   ========================================================================== */

window.INFOS = {

  /* ------------------------------------------------------------------------
     1. HORAIRES
     Un jour ouvert : "18h-22h"      Un jour fermé : ""
     Avec une coupure : "11h30-14h, 18h-22h"
     ------------------------------------------------------------------------ */
  horaires: {
    lundi:    "",
    mardi:    "18h-22h",
    mercredi: "18h-22h",
    jeudi:    "18h-22h",
    vendredi: "18h-22h",
    samedi:   "18h-22h",
    dimanche: "",
  },

  /* ------------------------------------------------------------------------
     2. FERMETURE EXCEPTIONNELLE (vacances, jour férié…)
     Dates au format "jour/mois/année", par exemple "01/08/2027".
     Pendant ces dates, le site affiche « Fermé » et un bandeau d'information.
     Laissez "" quand il n'y a pas de fermeture prévue.
     ------------------------------------------------------------------------ */
  fermetureDu: "",
  fermetureAu: "",

  /* ------------------------------------------------------------------------
     3. BANDEAU D'ANNONCE (en haut du site)
     Exemple : "Nouveau : la pizza Burrata est arrivée !"
     Laissez "" pour ne rien afficher. Pendant une fermeture exceptionnelle,
     un message est affiché automatiquement si ce champ est vide.
     ------------------------------------------------------------------------ */
  annonce: "",

  /* ------------------------------------------------------------------------
     4. CONTACT
     ------------------------------------------------------------------------ */
  /* Nom, adresse et téléphone : à écrire EXACTEMENT pareil sur la fiche Google,
     Uber Eats, Facebook, Instagram… Google compare ces informations entre les
     sites : plus elles sont identiques, mieux la pizzeria est classée. */
  nom:           "Piazzetta La Destrousse",
  telephone:     "06 40 92 51 76",
  adresse:       "842 avenue de la Doulia",
  ville:         "13112 La Destrousse",
  zoneLivraison: "La Destrousse et alentours",

  /* Communes où vous livrez, une par une, entre guillemets.
     Elles sont affichées sur le site et indiquées à Google : la pizzeria peut
     alors ressortir dans les recherches « pizzeria Peypin », etc.
     Exemple : ["La Destrousse", "Peypin", "La Bouilladisse"]
     Laissez [] pour garder simplement « La Destrousse et alentours ». */
  communesLivrees: [],

  /* ------------------------------------------------------------------------
     5. GOOGLE ET RÉSEAUX SOCIAUX
     ------------------------------------------------------------------------ */
  /* Identifiant de la fiche Google (ne pas modifier). Il sert aux boutons
     « Itinéraire » et « Laisser un avis », et à relier le site à la fiche. */
  googlePlaceId: "ChIJn-yuT0iZyRIRGalZ9F80kp4",

  /* Adresses complètes des pages (copiées depuis le navigateur).
     Laissez "" si la pizzeria n'y est pas : rien ne s'affiche. */
  reseaux: {
    facebook:  "https://www.facebook.com/p/PiazzettaDestrousse-Pizzeria-61593981164995/",
    instagram: "",
    uberEats:  "https://www.ubereats.com/fr/store/piazzetta-destrousse/3hAM1KrBRzO7w2VnZtQnDQ",
  },

  /* ------------------------------------------------------------------------
     6. TEXTES DE LA PAGE D'ACCUEIL
     ------------------------------------------------------------------------ */
  titre: "Pizzas artisanales, à emporter ou livrées.",
  introduction: "Une pâte légère travaillée avec soin, des produits frais et de l’huile d’olive.",

  /* Le petit mot de la maison */
  histoireTitre: "Le goût des choses simples.",
  histoire: [
    "À la Piazzetta, on fait les pizzas comme on aime les manger : une pâte légère, des produits frais, un filet d’huile d’olive et des recettes généreuses.",
    "Rien de compliqué, juste le plaisir d’une bonne pizza à partager, à emporter ou livrée chez vous.",
  ],
  histoireSignature: "L’équipe de la Piazzetta",

  /* Titre au-dessus des photos. Les photos elles-mêmes se mettent dans le
     dossier « photos » (voir le fichier LISEZ-MOI.md de ce dossier). */
  photosTitre: "Tout juste sorties du four.",

};
