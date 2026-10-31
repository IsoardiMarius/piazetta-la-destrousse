# Mise en ligne du site : tout ce qui a été fait

Ce document recense **comment le site est hébergé, publié et relié à son nom de domaine**, qui possède quoi, et quoi faire en cas de problème. À garder à jour à chaque changement.

Adresse du site : **https://piazzetta-ladestrousse.com**

## En bref : qui fait quoi

| Élément | Où | Propriétaire / accès |
| --- | --- | --- |
| Code du site | GitHub, dépôt public `IsoardiMarius/piazetta-la-destrousse` | Compte GitHub du développeur (IsoardiMarius) |
| Hébergement | GitHub Pages (gratuit, dépôt public) | Même compte GitHub |
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

1. vérifie `carte.js` et `infos.js` (en cas d'erreur, la publication s'arrête et l'ancien site reste en ligne) ;
2. génère le PDF de la carte et sa vignette ;
3. prépare les photos du dossier `photos/` (redressées, allégées en 4 tailles, légèrement mises en valeur, données GPS retirées) ;
4. dessine les images d'aperçu des liens (SMS, WhatsApp, Facebook) ;
5. récupère l'adresse officielle du site auprès de GitHub (`https://piazzetta-ladestrousse.com`) ;
6. pré-remplit les pages et ajoute ce qu'il faut pour Google (titres, descriptions, adresse canonique, fiche « Restaurant », `sitemap.xml`, `robots.txt`) ;
7. change l'adresse des fichiers pour que personne ne garde une ancienne version en cache ;
8. met le site en ligne.

L'adresse du domaine n'est écrite nulle part en dur dans les scripts : si le domaine change un jour, il suffit de modifier le domaine personnalisé dans GitHub puis de relancer la publication.

## 2. Nom de domaine (Cloudflare)

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

## 3. Historique de la mise en place

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

## 4. Entretien

| Quand | Quoi |
| --- | --- |
| Chaque année | Le domaine se renouvelle automatiquement sur le compte Cloudflare du développeur : vérifier que sa carte est à jour (Cloudflare envoie des rappels par e-mail). Le gérant rembourse environ 10 € par Wero. |
| À chaque changement de carte, d'horaires ou de photos | Modifier `carte.js`, `infos.js` ou le dossier `photos/` sur GitHub : tout le reste est automatique. |
| De temps en temps | Onglet **Actions** : les publications doivent être vertes. GitHub signale aussi que certaines actions du workflow fonctionnent avec une ancienne version de Node.js : sans conséquence aujourd'hui, mais il faudra passer à leurs nouvelles versions quand elles seront disponibles. |

## 5. En cas de problème

| Symptôme | Cause probable | Que faire |
| --- | --- | --- |
| Une modification n'apparaît pas | Publication en échec ou cache du navigateur | Onglet **Actions** : si la publication est rouge, le message indique quoi corriger dans `carte.js` ou `infos.js`. Sinon, attendre 2 minutes et recharger la page. |
| Le site affiche une erreur de certificat | Certificat en cours de renouvellement ou DNS modifié | Vérifier que les enregistrements DNS sont toujours en « DNS only » et que le domaine personnalisé est toujours saisi dans Settings › Pages. |
| Le site ne répond plus du tout | Domaine expiré ou DNS supprimé | Vérifier le domaine sur Cloudflare (Domain Registration) et les enregistrements DNS. |
| Revenir à une version précédente | Erreur de contenu | Sur GitHub, ouvrir l'historique du fichier modifié, reprendre l'ancien contenu et enregistrer : la publication repart automatiquement. |
| Changer de nom de domaine | — | Acheter le nouveau domaine, recréer les mêmes enregistrements DNS, le saisir dans Settings › Pages, relancer la publication. Garder l'ancien domaine au moins un an pour ne pas perdre les visiteurs. |

## 6. Encore à faire hors du site

Voir **[`referencement.md`](referencement.md)** : mettre l'adresse `https://piazzetta-ladestrousse.com` sur la fiche Google, Facebook et Uber Eats, déclarer le site dans Google Search Console, et collecter des avis avec le QR code.
