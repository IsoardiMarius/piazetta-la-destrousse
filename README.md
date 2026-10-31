# Piazzetta La Destrousse — site web

Site vitrine de la pizzeria, publié avec GitHub Pages.

## Modifier le site : deux fichiers, c'est tout

| Je veux changer… | Fichier | Lien direct |
| --- | --- | --- |
| Les pizzas, les ingrédients, les prix, les tailles | **[`carte.js`](carte.js)** | [✏️ Modifier la carte](https://github.com/IsoardiMarius/piazetta-la-destrousse/edit/claude/affectionate-euler-l61emv/carte.js) |
| Les horaires, une fermeture pour congés, une annonce, le téléphone, l'adresse, les textes de l'accueil | **[`infos.js`](infos.js)** | [✏️ Modifier les infos](https://github.com/IsoardiMarius/piazetta-la-destrousse/edit/claude/affectionate-euler-l61emv/infos.js) |
| Les photos de la page d'accueil | dossier **[`photos/`](photos/)** | [📷 Ajouter des photos](https://github.com/IsoardiMarius/piazetta-la-destrousse/upload/claude/affectionate-euler-l61emv/photos) |

1. Cliquez sur le lien direct (ou ouvrez le fichier puis cliquez sur le crayon ✏️).
2. Modifiez le texte entre les guillemets `"..."`.
3. Cliquez sur **Commit changes**.

Une à deux minutes plus tard, tout est à jour : la page d'accueil, la carte, le **PDF téléchargeable** (regénéré à chaque publication avec la carte, les horaires et les coordonnées du moment), le badge « Ouvert / Fermé » et les photos.

Pour les photos, le mode d'emploi complet est dans [`photos/LISEZ-MOI.md`](photos/LISEZ-MOI.md). En bref : on dépose les photos dans le dossier, le site les redresse, les allège, les met légèrement en valeur et retire les données GPS du téléphone.

### Exemples dans `carte.js`

```js
// Changer un prix (ordre : Petite, Big, Mega)
{ nom: "Reine", ingredients: "Tomate fraîche, jambon, …", prix: [11, 17, 26] },

// Ajouter une nouveauté mise en avant
{ nom: "Burrata", ingredients: "Tomate fraîche, burrata, basilic", prix: [14, 20, 29], badge: "Nouveau" },

// Cacher une pizza sans la supprimer
{ nom: "Yéyé", ingredients: "…", prix: [14, 20, 29], masquee: true },
```

### Exemples dans `infos.js`

```js
// Ouvrir aussi le dimanche soir
dimanche: "18h-22h",

// Ajouter un service le midi le samedi
samedi: "11h30-14h, 18h-22h",

// Partir en vacances : le site affiche « Fermé » et un bandeau automatique
fermetureDu: "01/08/2027",
fermetureAu: "15/08/2027",

// Afficher un message en haut du site (laisser "" pour l'enlever)
annonce: "Nouveau : la pizza Burrata est arrivée !",
```

Les dates de congés passées n'ont aucun effet : pas besoin de les effacer tout de suite.

### En cas d'erreur

Si un fichier contient une faute (guillemet ou virgule oubliés, prix ou horaire illisible…), la publication s'arrête et **l'ancien site reste en ligne**. Le message d'erreur, en français, s'affiche dans l'onglet **Actions** du dépôt et indique quoi corriger.

La carte A4 (PDF) s'ajuste toute seule pour tenir sur une page, même si vous ajoutez des pizzas.

## Publication sur GitHub Pages

Le fichier [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) vérifie la carte, génère le PDF puis publie le site **à chaque push sur la branche par défaut** du dépôt (celle que GitHub propose quand on modifie un fichier en ligne). Rien d'autre à faire : modifier `carte.js` ou `infos.js` suffit.

- Suivre une publication : onglet **Actions › Publier le site**.
- Relancer à la main : **Actions › Publier le site › Run workflow**.
- Réglage GitHub nécessaire, une seule fois : **Settings › Pages › Build and deployment › Source : GitHub Actions** (et non « Deploy from a branch », qui publierait le site sans le PDF).

Adresse du site : `https://isoardimarius.github.io/piazetta-la-destrousse/`

> GitHub Pages n'est gratuit que pour un dépôt **public** (ou avec un abonnement GitHub payant).

## Voir le site sur son ordinateur

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000. Pour générer le PDF en local : `npm install`, `npx playwright install chromium`, puis `npm run pdf`.

## Organisation des fichiers

| Fichier | Rôle |
| --- | --- |
| `carte.js` | **À modifier** : la carte (pizzas, prix, tailles) |
| `infos.js` | **À modifier** : horaires, congés, annonce, contact, textes |
| `index.html` | Page d'accueil |
| `photos/` | **À remplir** : les photos de la page d'accueil |
| `carte.html` | Aperçu de la carte A4 avec boutons Imprimer et PDF (source du PDF) |
| `assets/` | Styles, scripts, logo, polices auto-hébergées |
| `scripts/` | Vérification de la carte et génération du PDF |

## Choix techniques

- Site statique, sans framework ni base de données : rapide, et rien à maintenir.
- Polices auto-hébergées : aucun appel à Google Fonts, donc aucune adresse IP de visiteur transmise à un tiers.
- Aucun cookie ni outil de statistiques : pas de bandeau de consentement nécessaire.
- Animations discrètes, désactivées automatiquement si l'appareil demande à réduire les animations.
- Mise en page testée de 320 px (petit téléphone) à l'écran large.
