# Piazzetta La Destrousse — site web

Site vitrine de la pizzeria : **https://piazzetta-ladestrousse.com**

Hébergement, publication, nom de domaine et réglages (GitHub, Cloudflare) : tout est recensé dans **[`docs/mise-en-ligne.md`](docs/mise-en-ligne.md)**.

## Modifier le site : deux fichiers, c'est tout

| Je veux changer… | Fichier | Lien direct |
| --- | --- | --- |
| Les pizzas, les ingrédients, les prix, les tailles | **[`carte.js`](carte.js)** | [✏️ Modifier la carte](https://github.com/IsoardiMarius/piazetta-la-destrousse/edit/main/carte.js) |
| Les horaires, une fermeture pour congés, une annonce, le téléphone, l'adresse, les textes de l'accueil | **[`infos.js`](infos.js)** | [✏️ Modifier les infos](https://github.com/IsoardiMarius/piazetta-la-destrousse/edit/main/infos.js) |
| Les photos de la page d'accueil | dossier **[`photos/`](photos/)** | [📷 Ajouter des photos](https://github.com/IsoardiMarius/piazetta-la-destrousse/upload/main/photos) |

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

## Publication

Le site est hébergé sur GitHub Pages et relié au domaine **piazzetta-ladestrousse.com** (acheté sur Cloudflare). Le fichier [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) vérifie la carte, génère le PDF, prépare les photos et publie le site **à chaque push sur la branche par défaut** du dépôt (celle que GitHub propose quand on modifie un fichier en ligne). Rien d'autre à faire : modifier `carte.js`, `infos.js` ou le dossier `photos/` suffit.

- Suivre une publication : onglet **Actions › Publier le site**.
- Relancer à la main : **Actions › Publier le site › Run workflow**.
- Réglages GitHub et Cloudflare en place, enregistrements DNS, entretien et dépannage : **[`docs/mise-en-ligne.md`](docs/mise-en-ligne.md)**.

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
| `scripts/` | Vérification, PDF, photos et pré-remplissage des pages à la publication |

## Être trouvé sur Google

Le site fait sa part (voir ci-dessous). Le reste se joue sur la fiche Google, les avis et la cohérence des informations sur Internet : la liste des choses à faire, avec un QR code « Laisser un avis » à imprimer, est dans **[`docs/referencement.md`](docs/referencement.md)**.

## Rapidité, Google et aperçus de liens

À chaque publication, le site est préparé automatiquement, comme le ferait un framework type Next.js, sans en avoir la lourdeur :

- **Pages pré-remplies** : textes, horaires, carte et photos sont déjà dans les pages publiées. Google et les aperçus de liens les lisent sans attendre JavaScript.
- **Google** : titres et descriptions de pages pensés pour « pizzeria La Destrousse », adresse officielle (canonique), plan du site (`sitemap.xml`), `robots.txt`, fiche « Restaurant » (adresse, horaires, communes livrées, carte et prix de chaque pizza, lien vers la fiche Google et les réseaux) et nom du site pour les résultats de recherche.
- **Aperçus de liens** (SMS, WhatsApp, Facebook, Messenger…) : une image est dessinée pour chaque page aux couleurs du site. Pour l'accueil : logo, nom, « Pizzeria à La Destrousse », téléphone et la première photo en rond. Pour la carte : nombre de pizzas, prix et la carte en vignette. Elle se met à jour toute seule (photos, prix, téléphone).
- **Images** : chaque photo existe en 4 tailles, le navigateur télécharge la plus adaptée à l'écran. Un aperçu flou s'affiche pendant le chargement.
- **Cache** : chaque publication change l'adresse des fichiers, pour que personne ne voie une ancienne version.
- **Page 404** aux couleurs du site.

## Choix techniques

- Site statique, sans framework ni base de données : rapide, et rien à maintenir.
- Polices auto-hébergées : aucun appel à Google Fonts, donc aucune adresse IP de visiteur transmise à un tiers.
- Aucun cookie ni outil de statistiques : pas de bandeau de consentement nécessaire.
- Animations discrètes, désactivées automatiquement si l'appareil demande à réduire les animations.
- Mise en page testée de 320 px (petit téléphone) à l'écran large.
