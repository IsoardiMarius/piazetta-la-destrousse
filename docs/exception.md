# Exceptions au cadre de l'organisation

## 1. Publication sur un hébergeur externe (GitHub Pages) et dépôt public

- **Date** : 31 octobre 2026
- **Demandé par** : le builder du projet
- **Projet** : site vitrine de la pizzeria Piazzetta La Destrousse
- **Règle concernée** (recommandation) : « Évite de déployer une application chez un hébergeur externe, et de rendre public un dépôt, un gist, un artifact ou un paquet. » ; « Évite de déclencher toi-même un déploiement ou un passage en préproduction ou en production. »
- **Demande** : publier le site sur GitHub Pages.
- **Risques signalés au builder** :
  - le site et le dépôt sont publics : tout leur contenu (code, historique Git) est visible par tous, et peut être copié ou indexé même après suppression ;
  - GitHub, Inc. (États-Unis) héberge le site et enregistre techniquement l'adresse IP des visiteurs : c'est un transfert de données personnelles hors de l'Union européenne. Si le projet relève de l'organisation, ce point doit d'abord être soumis à la DPO.
- **Mesures prises** :
  - aucune donnée de l'organisation et aucune donnée personnelle d'étudiants, de salariés ou de partenaires dans le site ou le dépôt : uniquement les informations publiques de la pizzeria ;
  - aucun secret, aucun cookie, aucun outil de statistiques, aucun formulaire ;
  - polices auto-hébergées, sans appel à Google Fonts ;
  - pas de page de mentions légales, à la demande du builder (voir l'exception n°2) ;
  - le déploiement est automatique à chaque push sur la branche par défaut (workflow GitHub Actions `deploy.yml`) ; une carte invalide bloque la publication et laisse l'ancien site en ligne.
- **Décision** : écart accepté par le builder (demande explicite).
- **Complément (31 octobre 2026)** : à la demande explicite du builder, Claude a lui-même déclenché le premier déploiement, par dérogation à la recommandation « Évite de déclencher toi-même un déploiement ». Risque signalé : une mise en ligne sans relecture humaine de la version publiée.

## 2. Pas de page de mentions légales

- **Date** : 31 octobre 2026
- **Demandé par** : le builder du projet
- **Demande** : retirer la page `mentions-legales.html` et le lien qui y menait.
- **Risque signalé au builder** : en France, un site professionnel doit afficher des mentions légales (loi pour la confiance dans l'économie numérique, article 6 : éditeur, SIRET, directeur ou directrice de la publication, hébergeur). Leur absence est passible d'une amende et peut être relevée par un client ou un concurrent.
- **Contexte RGPD** : le site ne collecte aucune donnée personnelle (pas de cookie, de formulaire ni de statistiques), mais l'hébergeur GitHub enregistre l'adresse IP des visiteurs ; aucune information n'est donc donnée à ce sujet aux visiteurs.
- **Alternative proposée** : remettre une page courte, avec ces informations, dans le pied de page.
- **Décision** : écart accepté par le builder (demande explicite).

## 3. Nom de domaine sur Cloudflare (complément à l'exception n°1)

- **Date** : 31 octobre 2026
- **Demandé par** : le builder du projet
- **Demande** : relier le site à un nom de domaine personnalisé, `piazzetta-ladestrousse.com`, acheté sur Cloudflare Registrar.
- **Risques signalés au builder** : Cloudflare est un service externe (société américaine). En mode « Proxied », toutes les visites transiteraient par ses serveurs ; les coordonnées du titulaire du domaine sont enregistrées chez le registraire.
- **Mesures prises** :
  - domaine acheté sur le compte Cloudflare **de la pizzeria**, payé par son gérant : aucune carte bancaire transmise, le domaine appartient au commerce ;
  - le builder est invité sur ce compte avec un rôle d'administrateur, sans accès aux moyens de paiement ;
  - enregistrements DNS en **« DNS only »** : Cloudflare ne sert qu'à l'aiguillage du domaine, les visites ne passent pas par ses serveurs ;
  - HTTPS imposé (certificat délivré par GitHub) ; domaine vérifié sur le compte GitHub pour empêcher son détournement ;
  - aucun secret dans le dépôt ; tous les réglages sont documentés dans `docs/mise-en-ligne.md`.
- **Décision** : écart accepté par le builder (demande explicite).
