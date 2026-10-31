# Référencement local : ce qui se règle en dehors du site

Le site est optimisé : titres, descriptions, fiche « Restaurant » pour Google avec la carte et les prix, sitemap, pages pré-remplies, rapidité. Pour ressortir sur « pizzeria La Destrousse » ou « pizza livraison La Destrousse », **Google regarde d'abord la fiche Google et la cohérence des informations sur Internet**. Voici quoi faire, par ordre d'importance.

## Ce qui a été constaté en ligne (31 octobre 2026)

| Où | Ce qu'on trouve | À faire |
| --- | --- | --- |
| [Site](https://piazzetta-ladestrousse.com) | **Piazzetta La Destrousse**, 842 avenue de la Doulia, 13112 La Destrousse, 06 40 92 51 76, du mardi au samedi 18h–22h | Référence : c'est ce qu'il faut recopier partout |
| [Uber Eats](https://www.ubereats.com/fr/store/piazzetta-destrousse/3hAM1KrBRzO7w2VnZtQnDQ) | **« Piazzetta Destrousse »**, 842 avenue de la Doulia, ouverture à 18h | Renommer en **« Piazzetta La Destrousse »** dans Uber Eats Manager |
| [Facebook](https://www.facebook.com/p/PiazzettaDestrousse-Pizzeria-61593981164995/) | Page **« PiazzettaDestrousse - Pizzeria »** | Renommer en **« Piazzetta La Destrousse »** et vérifier adresse, téléphone, horaires et lien vers le site |
| Fiche Google | Existe (identifiant `ChIJn-yuT0iZyRIRGalZ9F80kp4`), contenu non vérifiable d'ici | Vérifier les points ci-dessous |
| Instagram, PagesJaunes, TripAdvisor | Rien trouvé | Créer au moins Instagram et PagesJaunes |
| Téléphone 06 40 92 51 76 | Cité sur aucune page indexée | Il le sera via la fiche Google, le site et les annuaires |

À noter : une autre entreprise, **« Pizzeria La Destrousse »** (route des Vignerons), porte un nom très proche de la recherche « pizzeria La Destrousse ». Il ne faut **pas** utiliser ce nom pour la Piazzetta : toujours écrire « Piazzetta La Destrousse ».

## 1. La fiche Google (le plus important)

Sur business.google.com, ou en cherchant « Piazzetta La Destrousse » sur Google une fois connecté avec le compte qui gère la fiche :

- [ ] **Nom** : exactement « Piazzetta La Destrousse », sans ajout de mots-clés comme « pizza livraison… » (interdit par Google, risque de suspension).
- [ ] **Catégorie principale** : « Pizzeria ». **Catégories secondaires** : « Livraison de pizzas », « Pizzas à emporter », « Restaurant italien ».
- [ ] **Adresse et téléphone** : identiques au site.
- [ ] **Horaires** : identiques au site, avec les **horaires exceptionnels** (congés, jours fériés) renseignés à l'avance.
- [ ] **Site web** : `https://piazzetta-ladestrousse.com`
- [ ] **Lien vers le menu** : `https://piazzetta-ladestrousse.com/carte.html`
- [ ] **Zone desservie** : les communes de livraison (les mêmes que `communesLivrees` dans `infos.js`).
- [ ] **Description** : 2 ou 3 phrases naturelles, par exemple « Pizzeria artisanale à La Destrousse : pâte légère, produits frais, huile d'olive. Pizzas à emporter ou livrées du mardi au samedi dès 18h. »
- [ ] **Photos** : les 5 photos du site et quelques autres (devanture, four, équipe). En ajouter une ou deux par mois.
- [ ] **Attributs** : « À emporter », « Livraison », moyens de paiement acceptés.
- [ ] **Posts** : une publication de temps en temps (nouvelle pizza, congés).

## 2. Les avis clients

Le nombre d'avis, leur note et leur fraîcheur pèsent beaucoup dans le classement local.

- [ ] Si vous imprimez quelque chose (affiche en vitrine, autocollant sur les cartons, cartes de visite…), un QR code qui ouvre le site est prêt : **[`qr-site.png`](qr-site.png)** ([`qr-site.svg`](qr-site.svg) pour un imprimeur).
- [ ] Imprimer le QR code **[`qr-avis-google.png`](qr-avis-google.png)** (ou la version vectorielle [`qr-avis-google.svg`](qr-avis-google.svg) pour un imprimeur) : il ouvre directement la page « Laisser un avis ». À coller sur les cartons à pizza, au comptoir ou sur les flyers, avec une phrase comme « Vous avez aimé ? Laissez-nous un avis ».
- [ ] Le bouton **« Votre avis »** du site (rubrique « Nous trouver ») ouvre la même page.
- [ ] **Répondre à chaque avis**, positif comme négatif, poliment et rapidement.
- [ ] Ne jamais acheter d'avis ni en écrire soi-même : Google les détecte et peut sanctionner la fiche.

## 3. Les mêmes informations partout

Partout où un champ « site web » existe, mettre **l'adresse du site : `https://piazzetta-ladestrousse.com`**. L'adresse postale, elle, ne change pas.

Nom, adresse et téléphone écrits **exactement** comme sur le site, à chaque endroit :

- [ ] Uber Eats : renommer « Piazzetta Destrousse » → « Piazzetta La Destrousse » et ajouter le site `https://piazzetta-ladestrousse.com` si Uber Eats Manager le permet.
- [ ] Facebook : renommer la page « Piazzetta La Destrousse » et ajouter `https://piazzetta-ladestrousse.com` dans « À propos ». Le lien Facebook est déjà dans `infos.js`.
- [ ] Instagram : si un compte est créé, ajouter son adresse dans `infos.js` (rubrique `reseaux`) : le lien apparaît en bas du site et est signalé à Google.
- [ ] PagesJaunes (inscription gratuite sur pagesjaunes.fr/pros).
- [ ] Éventuellement TripAdvisor, Apple Plans (Apple Business Connect), Bing Places.

## 4. Les outils de Google et Bing

- [x] **Google Search Console** : propriété « Domaine » `piazzetta-ladestrousse.com` créée et validée (enregistrement TXT dans Cloudflare).
- [x] **Plan du site** : dans Search Console, menu de gauche **Indexation › Sitemaps**, champ « Ajouter un sitemap », saisir l'adresse complète `https://piazzetta-ladestrousse.com/sitemap.xml` puis **Envoyer**. L'état passe à « Opération effectuée » en quelques heures ou jours (un « Impossible de récupérer » au début est courant : attendre).
- [x] **Accélérer la première indexation** : en haut de Search Console, coller `https://piazzetta-ladestrousse.com/` dans la barre « Inspecter n'importe quelle URL », puis **Demander l'indexation**. Refaire la même chose avec `https://piazzetta-ladestrousse.com/carte.html`.
- [ ] **Bing Webmaster Tools** (bing.com/webmasters) : « Importer depuis Google Search Console », en un clic. Bing alimente aussi ChatGPT, Copilot et DuckDuckGo.
- [ ] **Dans 2 semaines** : vérifier dans Search Console que l'état du sitemap est « Opération effectuée » et que les 2 pages apparaissent dans **Indexation › Pages**. Ensuite, une fois par mois, regarder **Performances** : sur quelles recherches le site apparaît.

## 5. Des liens vers le site depuis des sites locaux

Google fait davantage confiance à un site cité par d'autres sites de la région.

- [ ] Demander à la **mairie de La Destrousse** d'ajouter la pizzeria (avec le lien du site) à la liste des commerces de son site, si elle en a une.
- [ ] Publier le lien dans les **groupes Facebook locaux** (« Tu es de La Destrousse si… », groupes d'entraide des communes voisines).
- [ ] Office de tourisme du Pays d'Aubagne et de l'Étoile, associations ou clubs sportifs que la pizzeria soutient : leur demander un lien.

## 6. Dans `infos.js`

- [x] **`communesLivrees`** : laissé vide, le site affiche « La Destrousse et alentours ». Si un jour vous voulez ressortir sur « pizzeria Peypin », etc., lister les communes livrées (ex. `["La Destrousse", "Peypin"]`).
- [x] **`reseaux`** : Facebook et Uber Eats renseignés. Ajouter Instagram s'il est créé.
