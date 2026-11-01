# Mise en ligne du site : tout ce qui a été fait

Ce document recense **comment le site est hébergé, publié et relié à son nom de domaine**, qui possède quoi, et quoi faire en cas de problème. À garder à jour à chaque changement.

Adresse du site : **https://piazzetta-ladestrousse.com**

## En bref : qui fait quoi

| Élément | Où | Propriétaire / accès |
| --- | --- | --- |
| Code du site | GitHub, dépôt public `IsoardiMarius/piazetta-la-destrousse` | Compte GitHub du développeur (IsoardiMarius) |
| Hébergement | GitHub Pages (gratuit, dépôt public) | Même compte GitHub |
| Contenu (carte, boissons et desserts, horaires, photos, contact, textes) | Dossier `contenu/` du dépôt, modifié depuis **Pages CMS** (app.pagescms.org) | Le gérant (invité par e-mail) et le développeur |
| Publication | GitHub Actions, workflow « Publier le site » (`.github/workflows/deploy.yml`) | Automatique à chaque modification |
| Nom de domaine | `piazzetta-ladestrousse.com`, acheté sur Cloudflare Registrar | Compte Cloudflare du développeur, payé avec sa carte (renouvellement automatique) ; le gérant le rembourse (environ 10 € par an, par Wero) |
| DNS (aiguillage du domaine vers le site) | Cloudflare, rubrique DNS du domaine | Même compte Cloudflare |
| Certificat HTTPS | Délivré et renouvelé automatiquement par GitHub (Let's Encrypt) | Rien à faire |

Aucun mot de passe, aucune carte bancaire et aucun identifiant ne sont stockés dans le dépôt.

## 1. Hébergement et publication (GitHub)

**Réglages du dépôt** (Settings) :

- **Pages › Build and deployment › Source : GitHub Actions** (et non « Deploy from a branch », qui publierait le site sans le PDF, les photos ni les optimisations).
- **Pages › Custom domain : `piazzetta-ladestrousse.com`**, case **Enforce HTTPS** cochée.
- Branche par défaut : **`main`** (renommée le 31 octobre 2026 ; elle s'appelait `claude/affectionate-euler-l61emv`, et GitHub redirige les anciens liens). Le workflow publie à chaque push sur la branche par défaut, quel que soit son nom.
- Si une publication échoue à l'étape « deploy » avec « not allowed to deploy to github-pages due to environment protection rules » : Settings › Environments › github-pages › Deployment branches and tags, ajouter `main`.

**Réglage du compte GitHub** (Settings du compte › Pages) :

- Domaine **`piazzetta-ladestrousse.com` vérifié** (enregistrement TXT `_github-pages-challenge-isoardimarius` côté Cloudflare). Cela empêche quelqu'un d'autre d'utiliser ce domaine sur GitHub.

**Ce que fait la publication**, à chaque modification (2 minutes environ, suivi dans l'onglet **Actions**) :

1. vérifie le contenu du dossier `contenu/` : une erreur grave (fichier abîmé, carte vide) arrête la publication et l'ancien site reste en ligne ; une erreur mineure (prix manquant, photo introuvable…) est ignorée et signalée (voir l'étape 10) ;
2. prépare le logo s'il a été changé dans Pages CMS (toutes ses tailles, icônes d'onglet et d'iPhone), génère `donnees.js` (le contenu lu par les pages), puis le PDF de la carte (page 1 : pizzas ; page 2 : boissons et desserts, s'il y en a) et sa vignette, et signale une page trop longue pour tenir sur une feuille A4 ;
3. prépare les photos de la liste `contenu/photos.json`, dans l'ordre choisi (redressées, allégées en 4 tailles, légèrement mises en valeur, données GPS retirées) ;
4. dessine les images d'aperçu des liens (SMS, WhatsApp, Facebook) ;
5. récupère l'adresse officielle du site auprès de GitHub (`https://piazzetta-ladestrousse.com`) ;
6. pré-remplit les pages et ajoute ce qu'il faut pour Google (titres, descriptions, adresse canonique, fiche « Restaurant », `sitemap.xml`, `robots.txt`) ;
7. **contrôle** que les pages générées correspondent exactement au contenu (`scripts/controler-site.mjs`) : chaque prix de chaque taille, pizzas masquées absentes, horaires, téléphone, liens des réseaux, photos, fiche Google, aperçus de liens, plan du site ; au moindre écart, la publication s'arrête et l'ancien site reste en ligne ;
8. change l'adresse des fichiers pour que personne ne garde une ancienne version en cache ;
9. met le site en ligne ;
10. si des éléments ont été ignorés ou sont à vérifier (photo introuvable, carte trop longue…), ouvre un signalement « **Points à vérifier sur le site** » (« issue » GitHub, donc un e-mail au propriétaire du dépôt), ou le complète s'il est déjà ouvert ; il se ferme tout seul à la première publication sans point à vérifier ;
11. en cas d'échec, ouvre une alerte « **La publication du site a échoué** », qui se ferme toute seule à la publication réussie suivante.

L'adresse du domaine n'est écrite nulle part en dur dans les scripts : si le domaine change un jour, il suffit de modifier le domaine personnalisé dans GitHub puis de relancer la publication.

## 2. Interface d'édition (Pages CMS)

[Pages CMS](https://pagescms.org) (gratuit, open source) affiche des formulaires pour modifier le contenu sans toucher au code. Chaque enregistrement modifie un fichier du dossier `contenu/` (ou ajoute une photo dans `photos/`) et déclenche la publication automatique.

- **Configuration des formulaires** : fichier [`.pages.yml`](../.pages.yml) à la racine du dépôt (rubriques, libellés, aides, vérification du format des horaires et des liens).
- **Mise en place** (une seule fois, par le développeur) : se connecter sur https://app.pagescms.org avec le compte GitHub, installer l'application Pages CMS sur le dépôt `piazetta-la-destrousse` (accès à ce seul dépôt), ouvrir le projet, puis **Settings › Collaborators** › inviter le gérant par son adresse e-mail.
- **Le gérant** se connecte avec le lien reçu par e-mail, **sans compte GitHub**. Il peut modifier le contenu et les photos, mais pas la configuration ni les accès.
- **Les modifications** sont enregistrées dans l'historique du dépôt avec le message « Modification : … (via Pages CMS) ».
- **Si Pages CMS disparaissait** : le site continue de fonctionner. Le contenu reste dans le dépôt et se modifie directement sur GitHub (fichiers JSON du dossier `contenu/`). Pages CMS étant open source, on peut aussi l'héberger soi-même.
- Mode d'emploi pour le gérant : [`guide-modifier-le-site.md`](guide-modifier-le-site.md).

## 3. Nom de domaine (Cloudflare)

**Achat** : `piazzetta-ladestrousse.com`, sur Cloudflare Registrar (prix coûtant, sans surcoût au renouvellement), depuis le **compte Cloudflare du développeur**, payé avec sa carte. Renouvellement automatique activé. Le gérant rembourse le développeur chaque année (environ 10 €, par Wero). Aucune carte bancaire du gérant n'a été transmise.

**Bon à savoir** : le domaine est rattaché au compte du développeur. Si la pizzeria doit un jour le gérer seule, il faudra le transférer vers un compte à son nom (Cloudflare ou autre registraire) avant tout changement d'organisation, pour que le site ne soit pas coupé.

**Enregistrements DNS** (Cloudflare › le domaine › DNS › Records), **tous en « DNS only » (nuage gris)** :

| Type | Nom | Valeur | Rôle |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | Serveurs de GitHub Pages |
| A | `@` | `185.199.109.153` | Serveurs de GitHub Pages |
| A | `@` | `185.199.110.153` | Serveurs de GitHub Pages |
| A | `@` | `185.199.111.153` | Serveurs de GitHub Pages |
| CNAME | `www` | `isoardimarius.github.io` | `www.piazzetta-ladestrousse.com` redirige vers l'adresse principale |
| TXT | `_github-pages-challenge-isoardimarius` | (code fourni par GitHub) | Vérification du domaine sur GitHub |

**Pourquoi « DNS only » et pas « Proxied » (nuage orange)** : GitHub ne peut délivrer le certificat HTTPS que de cette façon, et les visites ne passent pas par les serveurs de Cloudflare (aucun intermédiaire supplémentaire ne voit les visiteurs).

**Redirections en place** :

- `http://…` → `https://piazzetta-ladestrousse.com` (Enforce HTTPS) ;
- `www.piazzetta-ladestrousse.com` → `piazzetta-ladestrousse.com` ;
- l'ancienne adresse `isoardimarius.github.io/piazetta-la-destrousse/` → `piazzetta-ladestrousse.com`.

## 4. Historique de la mise en place

1. Création du site statique (HTML, CSS, JavaScript, sans framework ni base de données) à partir de la maquette.
2. Activation de GitHub Pages, d'abord en « Deploy from a branch », puis **passage à « GitHub Actions »** pour bénéficier du PDF, des photos et des optimisations (les deux modes se concurrençaient à chaque publication).
3. Correction de la publication : le runner `ubuntu-latest` (Ubuntu 26.04) n'étant pas pris en charge par l'outil de génération du PDF, le workflow utilise **Ubuntu 24.04**.
4. Ajout de la vérification des fichiers, des photos, des aperçus de liens et du pré-remplissage pour Google.
5. Achat du domaine `piazzetta-ladestrousse.com` sur le compte Cloudflare du développeur (remboursé par le gérant).
6. Création des enregistrements DNS ci-dessus, en « DNS only ».
7. Vérification du domaine dans les réglages du compte GitHub (enregistrement TXT).
8. Domaine personnalisé saisi dans les réglages Pages du dépôt, puis **Enforce HTTPS** coché une fois le certificat délivré.
9. Publication relancée (Actions › Publier le site › Run workflow) : le site utilise désormais `https://piazzetta-ladestrousse.com` pour Google et les aperçus de liens. Vérifié dans le journal de la publication du 31 octobre 2026.
10. Site déclaré dans Google Search Console (propriété « Domaine », TXT dans Cloudflare), plan du site envoyé, indexation demandée pour l'accueil et la carte.
11. Branche par défaut renommée en `main`.
12. Contenu déplacé dans le dossier `contenu/` (fichiers JSON) et interface Pages CMS mise en place pour que le gérant modifie le site lui-même ; alerte par e-mail en cas d'échec de publication.
13. Contrôle final des pages générées avant chaque mise en ligne et signalement « Points à vérifier » ; site testé avec des contenus extrêmes (22 pizzas, 4 tailles, 12 photos, horaires avec coupure, congés, 3 réseaux, et à l'inverse 2 pizzas, 1 taille, 1 photo, aucun réseau ni texte) sur 14 tailles d'écran.
14. Page 2 de la carte « Boissons & desserts » (rubrique Pages CMS du même nom) et animations de chargement (photos, vignette de la carte, visionneuse, page de la carte).
15. Tout le contenu affiché devient modifiable dans Pages CMS (textes de l'accueil et de la carte, page « adresse introuvable », logo, cases Livraison / À emporter) ; rubriques réorganisées ; menu mobile sans transparence à l'ouverture.
16. Pages CMS et contenu rendus génériques (aucun libellé ni texte automatique propre à une pizzeria : type d'établissement, produits et cuisine sont des réglages) ; données renommées (`produits`, `description`, `masque`, `carte-page2.json`) ; bouton flottant « Voir la carte » retiré.

## 5. Entretien

| Quand | Quoi |
| --- | --- |
| Chaque année | Le domaine se renouvelle automatiquement sur le compte Cloudflare du développeur : vérifier que sa carte est à jour (Cloudflare envoie des rappels par e-mail). Le gérant rembourse environ 10 € par Wero. |
| À chaque changement de carte, d'horaires ou de photos | Le gérant le fait dans Pages CMS (ou le développeur, dans Pages CMS ou sur GitHub) : tout le reste est automatique. |
| De temps en temps | Onglet **Actions** : les publications doivent être vertes. GitHub signale aussi que certaines actions du workflow fonctionnent avec une ancienne version de Node.js : sans conséquence aujourd'hui, mais il faudra passer à leurs nouvelles versions quand elles seront disponibles. |

## 6. En cas de problème

| Symptôme | Cause probable | Que faire |
| --- | --- | --- |
| Une modification n'apparaît pas | Publication en cours, en échec, ou cache du navigateur | Attendre 2 minutes et recharger. Sinon, onglet **Actions** : le résumé de la publication indique ce qui bloque. En cas d'échec, une alerte « La publication du site a échoué » est aussi ouverte (onglet **Issues**) et envoyée par e-mail. |
| Une photo ou un produit manque, la carte déborde | Élément ignoré à la publication | Onglet **Issues** › « Points à vérifier sur le site » : il dit quoi corriger (photo introuvable, prix manquant, carte trop longue → masquer quelques produits). |
| « Le site généré ne correspond pas au contenu » | Contrôle final en échec (cas imprévu dans le contenu ou modification du code) | Le détail est dans le résumé de la publication ; l'ancien site reste en ligne. Corriger, puis relancer. |
| Le site affiche une erreur de certificat | Certificat en cours de renouvellement ou DNS modifié | Vérifier que les enregistrements DNS sont toujours en « DNS only » et que le domaine personnalisé est toujours saisi dans Settings › Pages. |
| Le site ne répond plus du tout | Domaine expiré ou DNS supprimé | Vérifier le domaine sur Cloudflare (Domain Registration) et les enregistrements DNS. |
| Revenir à une version précédente | Erreur de contenu | Sur GitHub, ouvrir l'historique du fichier modifié, reprendre l'ancien contenu et enregistrer : la publication repart automatiquement. |
| Changer de nom de domaine | — | Acheter le nouveau domaine, recréer les mêmes enregistrements DNS, le saisir dans Settings › Pages, relancer la publication. Garder l'ancien domaine au moins un an pour ne pas perdre les visiteurs. |

## 7. Encore à faire hors du site

Voir **[`referencement.md`](referencement.md)** : mettre l'adresse `https://piazzetta-ladestrousse.com` sur la fiche Google, Facebook et Uber Eats, déclarer le site dans Google Search Console, et collecter des avis avec le QR code.
