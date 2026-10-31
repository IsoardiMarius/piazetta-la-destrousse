# Piazzetta La Destrousse — site web

Site vitrine de la pizzeria : **https://piazzetta-ladestrousse.com**

Hébergement, publication, nom de domaine et réglages (GitHub, Cloudflare) : tout est recensé dans **[`docs/mise-en-ligne.md`](docs/mise-en-ligne.md)**.

## Modifier le site

### Avec l'interface Pages CMS (le plus simple)

Ouvrir **https://app.pagescms.org**, se connecter (avec GitHub, ou avec le lien reçu par e-mail pour les personnes invitées), choisir le site, puis la rubrique :

| Rubrique | Ce qu'on y change |
| --- | --- |
| **La carte** | Pizzas (ajouter, supprimer, réordonner, masquer, badge « Nouveau »), ingrédients, prix, tailles, phrase sous la carte |
| **Horaires et congés** | Horaires de chaque jour, fermeture exceptionnelle (calendrier), bandeau d'annonce |
| **Photos** | Ajouter, retirer et réordonner les photos de l'accueil |
| **Contact et réseaux** | Nom, téléphone, adresse, zone de livraison, Uber Eats, Facebook, Instagram |
| **Textes de l'accueil** | Grand titre, introduction, « La maison », titre des photos |

Cliquer sur **Enregistrer** : 1 à 2 minutes plus tard, tout est à jour et regénéré automatiquement (pages, carte, **PDF**, photos, aperçus de liens, données pour Google, badge « Ouvert / Fermé »).

Le mode d'emploi pour le gérant est dans **[`docs/guide-modifier-le-site.md`](docs/guide-modifier-le-site.md)**.

### Directement sur GitHub (pour le développeur)

Le contenu est dans le dossier **[`contenu/`](contenu/)** (fichiers JSON : `carte.json`, `horaires.json`, `photos.json`, `contact.json`, `textes.json`) et les photos dans **[`photos/`](photos/)**. L'interface ne fait que modifier ces fichiers ; on peut aussi les modifier à la main.

### Sécurités

- **Formulaires guidés** : prix en chiffres, dates au calendrier, format des horaires et des liens vérifié avant l'enregistrement.
- **Erreur mineure** (prix manquant, photo introuvable…) : le site est publié quand même, l'élément fautif est ignoré ou affiché « – », et le point est signalé dans le résumé de la publication.
- **Erreur grave** (fichier abîmé, carte vide) : la publication s'arrête et **l'ancien site reste en ligne**.
- **Alerte** : si une publication échoue, une alerte (« issue ») est ouverte sur GitHub et le propriétaire du dépôt reçoit un e-mail. Elle se ferme toute seule à la publication réussie suivante.
- La carte A4 (PDF) s'ajuste toute seule pour tenir sur une page, même si on ajoute des pizzas.

## Publication

Le site est hébergé sur GitHub Pages et relié au domaine **piazzetta-ladestrousse.com** (acheté sur Cloudflare). Le fichier [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) vérifie le contenu, génère le PDF, prépare les photos et publie le site **à chaque modification de la branche par défaut** (`main`), qu'elle vienne de Pages CMS ou de GitHub.

- Suivre une publication : onglet **Actions › Publier le site**.
- Relancer à la main : **Actions › Publier le site › Run workflow**.
- Réglages GitHub et Cloudflare en place, enregistrements DNS, entretien et dépannage : **[`docs/mise-en-ligne.md`](docs/mise-en-ligne.md)**.

> GitHub Pages n'est gratuit que pour un dépôt **public** (ou avec un abonnement GitHub payant).

## Voir le site sur son ordinateur

```bash
npm run serve
```

Puis ouvrir http://localhost:8000 (`npm run serve` génère d'abord `donnees.js` à partir du dossier `contenu/`). Pour vérifier le contenu : `npm run verifier`. Pour générer le PDF : `npm install`, `npx playwright install chromium`, puis `npm run pdf`.

## Organisation des fichiers

| Fichier | Rôle |
| --- | --- |
| `contenu/` | **Le contenu** (carte, horaires, photos, contact, textes), modifié depuis Pages CMS |
| `.pages.yml` | Configuration des formulaires de Pages CMS |
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
