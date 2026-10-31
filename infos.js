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
  telephone:     "06 40 92 51 76",
  adresse:       "842 avenue de la Doulia",
  ville:         "13112 La Destrousse",
  zoneLivraison: "La Destrousse et alentours",
  lienGoogle:    "https://www.google.com/maps/search/?api=1&query=Piazzetta%20La%20Destrousse&query_place_id=ChIJn-yuT0iZyRIRGalZ9F80kp4",

  /* ------------------------------------------------------------------------
     5. TEXTES DE LA PAGE D'ACCUEIL
     ------------------------------------------------------------------------ */
  titre: "Pizzas artisanales, à emporter ou livrées.",
  introduction: "Une pâte légère travaillée avec soin, des produits frais et de l’huile d’olive.",

  /* Le petit mot de la maison */
  histoireTitre: "Comme sur une petite place de village.",
  histoire: [
    "Une piazzetta, c’est la petite place où l’on se croise, où l’on prend des nouvelles et où l’on ne regarde pas trop l’heure. C’est un peu l’idée de notre pizzeria.",
    "Ici, la pâte prend le temps qu’il lui faut, la tomate est fraîche, l’huile d’olive ne se compte pas et la merguez vient de Cadolive, juste à côté. Le reste, c’est vous : un coup de fil, quelques minutes de patience, et le soir prend tout de suite un air de vacances.",
  ],
  histoireSignature: "L’équipe de la Piazzetta",

  /* Titre au-dessus des photos. Les photos elles-mêmes se mettent dans le
     dossier « photos » (voir le fichier LISEZ-MOI.md de ce dossier). */
  photosTitre: "Tout juste sorties du four.",

};
