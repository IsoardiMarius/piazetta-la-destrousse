# Référencement local : ce qui se règle en dehors du site

Le site est optimisé : titres, descriptions, fiche « Restaurant » pour Google avec la carte et les prix, sitemap, pages pré-remplies, rapidité. Pour ressortir sur « pizzeria La Destrousse » ou « pizza livraison La Destrousse », **Google regarde d'abord la fiche Google et la cohérence des informations sur Internet**. Voici quoi faire, par ordre d'importance.

## Ce qui a été constaté en ligne (31 octobre 2026)

| Où | Ce qu'on trouve | À faire |
| --- | --- | --- |
| Site | **Piazzetta La Destrousse**, 842 avenue de la Doulia, 13112 La Destrousse, 06 40 92 51 76, du mardi au samedi 18h–22h | Référence : c'est ce qu'il faut recopier partout |
| Uber Eats | **« Piazzetta Destrousse »**, 842 avenue de la Doulia, ouverture à 18h | Renommer en **« Piazzetta La Destrousse »** dans Uber Eats Manager |
| Fiche Google | Existe (identifiant `ChIJn-yuT0iZyRIRGalZ9F80kp4`), contenu non vérifiable d'ici | Vérifier les points ci-dessous |
| Facebook, Instagram, PagesJaunes, TripAdvisor | Rien trouvé | Créer au moins Facebook ou Instagram, et PagesJaunes |
| Téléphone 06 40 92 51 76 | Cité sur aucune page indexée | Il le sera via la fiche Google, le site et les annuaires |

À noter : une autre entreprise, **« Pizzeria La Destrousse »** (route des Vignerons), porte un nom très proche de la recherche « pizzeria La Destrousse ». Il ne faut **pas** utiliser ce nom pour la Piazzetta : toujours écrire « Piazzetta La Destrousse ».

## 1. La fiche Google (le plus important)

Sur business.google.com, ou en cherchant « Piazzetta La Destrousse » sur Google une fois connecté avec le compte qui gère la fiche :

- [ ] **Nom** : exactement « Piazzetta La Destrousse », sans ajout de mots-clés comme « pizza livraison… » (interdit par Google, risque de suspension).
- [ ] **Catégorie principale** : « Pizzeria ». **Catégories secondaires** : « Livraison de pizzas », « Pizzas à emporter », « Restaurant italien ».
- [ ] **Adresse et téléphone** : identiques au site.
- [ ] **Horaires** : identiques au site, avec les **horaires exceptionnels** (congés, jours fériés) renseignés à l'avance.
- [ ] **Site web** : l'adresse du site (le nom de domaine une fois acheté).
- [ ] **Lien vers le menu** : l'adresse de la page carte (`…/carte.html`).
- [ ] **Zone desservie** : les communes de livraison (les mêmes que `communesLivrees` dans `infos.js`).
- [ ] **Description** : 2 ou 3 phrases naturelles, par exemple « Pizzeria artisanale à La Destrousse : pâte légère, produits frais, huile d'olive. Pizzas à emporter ou livrées du mardi au samedi dès 18h. »
- [ ] **Photos** : les 5 photos du site et quelques autres (devanture, four, équipe). En ajouter une ou deux par mois.
- [ ] **Attributs** : « À emporter », « Livraison », moyens de paiement acceptés.
- [ ] **Posts** : une publication de temps en temps (nouvelle pizza, congés).

## 2. Les avis clients

Le nombre d'avis, leur note et leur fraîcheur pèsent beaucoup dans le classement local.

- [ ] Imprimer le QR code **[`qr-avis-google.png`](qr-avis-google.png)** (ou la version vectorielle [`qr-avis-google.svg`](qr-avis-google.svg) pour un imprimeur) : il ouvre directement la page « Laisser un avis ». À coller sur les cartons à pizza, au comptoir ou sur les flyers, avec une phrase comme « Vous avez aimé ? Laissez-nous un avis ».
- [ ] Le bouton **« Votre avis »** du site (rubrique « Nous trouver ») ouvre la même page.
- [ ] **Répondre à chaque avis**, positif comme négatif, poliment et rapidement.
- [ ] Ne jamais acheter d'avis ni en écrire soi-même : Google les détecte et peut sanctionner la fiche.

## 3. Les mêmes informations partout

Nom, adresse et téléphone écrits **exactement** comme sur le site, à chaque endroit :

- [ ] Uber Eats (renommer « Piazzetta Destrousse » → « Piazzetta La Destrousse »).
- [ ] Facebook et/ou Instagram : créer la page avec le lien du site, puis ajouter leurs adresses dans `infos.js` (rubrique `reseaux`) : les liens apparaissent en bas du site et sont signalés à Google.
- [ ] PagesJaunes (inscription gratuite sur pagesjaunes.fr/pros).
- [ ] Éventuellement TripAdvisor, Apple Plans (Apple Business Connect), Bing Places.

## 4. Les outils de Google et Bing

- [ ] **Google Search Console** (search.google.com/search-console) : ajouter le site, puis déclarer le plan du site `sitemap.xml`. Permet aussi de voir sur quelles recherches le site apparaît.
- [ ] **Bing Webmaster Tools** : importer le site depuis Search Console en un clic.

## 5. Dans `infos.js`

- [ ] **`communesLivrees`** : lister les communes livrées (ex. `["La Destrousse", "Peypin", "La Bouilladisse"]`). Elles s'affichent sur le site et sont transmises à Google, ce qui aide à ressortir sur « pizzeria Peypin », etc.
- [ ] **`reseaux`** : ajouter les adresses Facebook, Instagram et Uber Eats dès qu'elles existent.
