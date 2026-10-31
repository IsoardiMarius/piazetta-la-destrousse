# Piazzetta La Destrousse — site web

Site vitrine de la pizzeria, publié avec GitHub Pages.

## Changer la carte : un seul fichier

Tout se règle dans **[`carte.js`](carte.js)** : pizzas, ingrédients, prix, tailles, téléphone, adresse et horaires.

1. Sur GitHub, ouvrez `carte.js` puis cliquez sur le crayon ✏️ (« Edit this file »).
2. Modifiez le texte entre les guillemets `"..."`.
3. Cliquez sur **Commit changes** (sur la branche `main`).

Une à deux minutes plus tard, tout est à jour :

- la carte affichée sur le site (avec le choix de la taille) ;
- la carte au format A4 (`carte.html`) ;
- le **PDF téléchargeable** (`carte.pdf`), regénéré automatiquement ;
- les horaires, le badge « Ouvert / Fermé » en temps réel et les infos pratiques.

Exemples :

```js
// Changer un prix (ordre : Petite, Big, Mega)
{ nom: "Reine", ingredients: "Tomate fraîche, jambon, …", prix: [11, 17, 26] },

// Ajouter une nouveauté mise en avant
{ nom: "Burrata", ingredients: "Tomate fraîche, burrata, basilic", prix: [14, 20, 29], badge: "Nouveau" },

// Cacher une pizza sans la supprimer
{ nom: "Yéyé", ingredients: "…", prix: [14, 20, 29], masquee: true },
```

Si `carte.js` contient une erreur (guillemet ou virgule oubliés, prix manquant…), la publication s'arrête et **l'ancien site reste en ligne**. Le message d'erreur, en français, s'affiche dans l'onglet **Actions** du dépôt et indique la ligne à corriger.

La carte A4 s'ajuste toute seule pour tenir sur une page, même si vous ajoutez des pizzas.

## Publication sur GitHub Pages

Le fichier [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) vérifie la carte, génère le PDF puis publie le site **à chaque push sur la branche par défaut** du dépôt (celle que GitHub propose quand on modifie un fichier en ligne). Rien d'autre à faire : modifier `carte.js` suffit.

- Suivre une publication : onglet **Actions › Publier le site**.
- Relancer à la main : **Actions › Publier le site › Run workflow**.
- Réglage GitHub nécessaire (déjà en place) : **Settings › Pages › Source : GitHub Actions**.

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
| `carte.js` | **Le contenu à modifier** (carte, prix, horaires, contact) |
| `index.html` | Page d'accueil |
| `carte.html` | Carte au format A4 (source du PDF, imprimable) |
| `assets/` | Styles, scripts, logo, polices auto-hébergées |
| `scripts/` | Vérification de la carte et génération du PDF |

## Choix techniques

- Site statique, sans framework ni base de données : rapide, et rien à maintenir.
- Polices auto-hébergées : aucun appel à Google Fonts, donc aucune adresse IP de visiteur transmise à un tiers.
- Aucun cookie ni outil de statistiques : pas de bandeau de consentement nécessaire.
- Animations discrètes, désactivées automatiquement si l'appareil demande à réduire les animations.
- Mise en page testée de 320 px (petit téléphone) à l'écran large.
