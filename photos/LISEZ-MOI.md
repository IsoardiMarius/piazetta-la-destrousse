# Photos du site

Ce dossier contient les photos d'origine. **Les photos affichées sur la page d'accueil, leur ordre et leur description se gèrent dans Pages CMS, rubrique « Photos »** (fichier `contenu/photos.json`). Mode d'emploi : [`docs/guide-modifier-le-site.md`](../docs/guide-modifier-le-site.md).

- Une photo ajoutée depuis Pages CMS est enregistrée ici automatiquement, avec un nom sans espaces ni accents.
- Une photo déposée ici directement sur GitHub n'est **pas** affichée tant qu'elle n'est pas ajoutée à la liste « Photos » (dans Pages CMS, ou dans `contenu/photos.json`).
- Retirer une photo de la liste la retire du site ; le fichier peut rester ici sans gêner.

## Ce que fait le site à chaque publication

- redresse les photos prises au téléphone ;
- les met légèrement en valeur (un peu de relief et d'éclat), en restant naturel ;
- les allège en 4 tailles WebP : chaque écran télécharge la plus adaptée ;
- crée un aperçu flou affiché pendant le chargement ;
- retire la position GPS et les autres informations cachées du téléphone ;
- utilise la **première photo** de la liste pour l'image d'aperçu quand on partage le lien du site.

Formats acceptés : JPG, PNG, WebP et photos d'iPhone (HEIC). 4 ou 5 photos suffisent (12 au maximum).

## Conseils pour de belles photos

- Lumière du jour, près d'une fenêtre, sans flash.
- Photo prise du dessus, ou légèrement de biais, avec la pizza entière.
- Un fond simple : planche en bois, carton à pizza, table.
