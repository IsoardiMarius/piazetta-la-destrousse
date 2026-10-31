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
  - mentions légales et mention RGPD ajoutées (`mentions-legales.html`) ;
  - Claude n'a pas déclenché le déploiement : il a préparé le workflow. L'activation (Settings › Pages) et la fusion dans `main` restent à la main du builder.
- **Décision** : écart accepté par le builder (demande explicite).
