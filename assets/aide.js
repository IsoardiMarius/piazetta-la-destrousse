/* Mode aide : ouvrir le site avec « ?aide » à la fin de l'adresse (accueil ou carte).
   Chaque zone modifiable est encadrée, avec une étiquette qui indique où la changer dans Pages CMS.
   Chargé seulement dans ce mode (voir site.js et carte-a4.js) : aucun effet sur le site normal. */
(function () {
  'use strict';
  var d = document;

  /* Rubriques de Pages CMS (mêmes noms que dans .pages.yml) */
  var C1 = 'Carte (page 1)', C2 = 'Carte (page 2)', H = 'Horaires et fermetures', P = "Photos de l'accueil",
      TX = "Textes de l'accueil", E = 'Établissement', AUTO = 'Automatique · ';

  /* Sélecteur → où le modifier. Les textes calculés disent d'où ils viennent. */
  var ZONES = [
    ['[data-annonce]:not([hidden])', H + ' › Bandeau d’annonce (ou fermeture exceptionnelle)'],
    ['.brand', E + ' › Nom et logo'],
    ['[data-reseau-item]:not([hidden])', E + ' › Réseaux et commande en ligne'],
    ['[data-status]', AUTO + 'ouvert / fermé, d’après ' + H],
    ['[data-bind="lieu"]', E + ' › Type d’établissement + ville'],
    ['[data-bind="titre"]', TX + ' › Haut de page : grand titre'],
    ['[data-bind="introduction"]', TX + ' › Haut de page : introduction'],
    ['[data-bind="accroche"]', AUTO + 'zone (' + E + ') + jours (' + H + ')'],
    ['[data-hero-reseaux]:not([hidden])', E + ' › Réseaux et commande en ligne'],
    ['[data-hero-logo]', E + ' › Logo'],
    ['#contenu [data-bind="service"]', E + ' › Vente à emporter / Livraison'],
    ['[data-bind="zoneService"]', E + ' › Zone de livraison'],
    ['[data-bind="resumeJours"]', AUTO + 'd’après ' + H],
    ['[data-bind="pointFortTitre"]', TX + ' › Bandeau : point fort (titre)'],
    ['[data-bind="pointFortTexte"]', TX + ' › Bandeau : point fort (texte)'],
    ['[data-bind="histoireTitre"]', TX + ' › La maison : titre'],
    ['[data-histoire]', TX + ' › La maison : paragraphes'],
    ['[data-bind="histoireSignature"]', TX + ' › La maison : signature'],
    ['[data-bind="photosTitre"]', TX + ' › Photos : titre'],
    ['[data-gallery]', P + ' (photos, ordre, légendes)'],
    ['[data-bind="titreCarte"]', AUTO + 'nombre de produits et de tailles, d’après ' + C1],
    ['[data-bind="sousTitreCarte"]', AUTO + 'tailles et prix, d’après ' + C1],
    ['[data-bind="carteTexte"]', TX + ' › Bloc « La carte » : phrase'],
    ['.preview', AUTO + 'image de la carte, d’après ' + C1],
    ['[data-hours]', H + ' › Horaires d’ouverture'],
    ['.address', E + ' › Adresse, code postal et ville'],
    ['[data-bind="retraitTexte"]', E + ' › Vente à emporter'],
    ['[data-bind="livraisonTexte"]', E + ' › Livraison, zone ou communes livrées'],
    ['#contenu [data-email-bloc]:not([hidden]), .ftr [data-email-bloc]:not([hidden])', E + ' › E-mail'],
    ['[data-bind="nomPied"]', E + ' › Nom + ' + TX + ' › Pied de page'],
    /* Carte */
    ['[data-sheet="1"] .sh-head img', E + ' › Logo'],
    ['[data-bind="enTeteTitre"]', C1 + ' › Haut de la carte : titre'],
    ['[data-bind="enTeteSousTitre"]', C1 + ' › Haut de la carte : sous-titre (vide = automatique)'],
    ['[data-head]', C1 + ' › Titre de la liste + Tailles ou formats'],
    ['[data-rows]', C1 + ' › Produits (nom, description, prix, badge)'],
    ['[data-bind="mention"]', C1 + ' › Phrase sous la liste'],
    ['[data-suite]:not([hidden])', AUTO + 'd’après ' + C2 + ' › titre'],
    ['[data-sheet="1"] .sh-foot__item:nth-of-type(1)', E + ' › Téléphone, e-mail, vente'],
    ['[data-sheet="1"] .sh-foot__item:nth-of-type(2)', AUTO + 'd’après ' + H],
    ['[data-sheet="1"] .sh-foot__item:nth-of-type(3)', E + ' › Ville et adresse'],
    ['[data-bind="titrePage2"]', C2 + ' › Haut de la page 2 : titre'],
    ['[data-bind="sousTitrePage2"]', C2 + ' › Haut de la page 2 : sous-titre (vide = automatique)'],
    ['[data-rubriques]', C2 + ' › Rubriques et articles'],
    ['[data-bind="mentionPage2"]', C2 + ' › Phrase en bas de la page 2']
  ];

  var style = d.createElement('style');
  style.textContent =
    '.mode-aide .reveal{opacity:1!important;transform:none!important}' +
    '.aide-cible{outline:2px dashed #E07A00!important;outline-offset:3px}' +
    '.aide-couche{position:absolute;left:0;top:0;right:0;height:0;z-index:2147483000;pointer-events:none}' +
    '.aide-tag{position:absolute;width:max-content;max-width:min(300px,calc(100vw - 16px));padding:3px 8px;border-radius:6px;background:#E07A00;color:#fff;' +
    'font:600 11.5px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:normal}' +
    '.aide-tag--auto{background:#5E6B7A}' +
    '.aide-barre{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483001;display:flex;gap:10px;align-items:center;' +
    'justify-content:space-between;padding:10px 12px;border-radius:12px;background:#241411;color:#fff;font:500 13px/1.35 system-ui,-apple-system,sans-serif;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
    '.aide-barre a{color:#FFB86B;font-weight:700;white-space:nowrap}';
  d.head.appendChild(style);

  var couche = d.createElement('div');
  couche.className = 'aide-couche';
  couche.setAttribute('aria-hidden', 'true');
  d.body.appendChild(couche);

  var barre = d.createElement('div');
  barre.className = 'aide-barre';
  barre.innerHTML = '<span>Mode aide : chaque étiquette dit où modifier la zone dans Pages CMS. ' +
    '<span style="opacity:.75">Orange = à modifier · Gris = automatique. Titre de l’onglet : « Google et partage de liens » (ou automatique).</span></span>' +
    '<a href="' + location.pathname + '">Quitter</a>';
  d.body.appendChild(barre);

  function placer() {
    couche.innerHTML = '';
    var places = [];
    var chevauche = function (a) {
      return places.some(function (b) { return a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 2 && b.y < a.y + a.h + 2; });
    };
    ZONES.forEach(function (z) {
      Array.prototype.forEach.call(d.querySelectorAll(z[0]), function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        el.classList.add('aide-cible');
        var tag = d.createElement('span');
        tag.className = 'aide-tag' + (z[1].indexOf(AUTO) === 0 ? ' aide-tag--auto' : '');
        tag.textContent = z[1];
        couche.appendChild(tag);
        /* Juste au-dessus de la zone, sans sortir de l'écran ; si la place est prise, un peu plus haut,
           sinon à l'intérieur de la zone, en haut à gauche */
        var w = tag.offsetWidth, h = tag.offsetHeight;
        var x = Math.max(8, Math.min(r.left + window.scrollX, d.documentElement.clientWidth - w - 8));
        var essais = [r.top + window.scrollY - h - 4, r.top + window.scrollY - 2 * h - 6, r.top + window.scrollY + 4, r.top + window.scrollY + h + 6];
        var pos = { x: x, y: essais[0], w: w, h: h };
        for (var i = 0; i < essais.length; i++) {
          pos.y = Math.max(0, essais[i]);
          if (!chevauche(pos)) break;
        }
        places.push({ x: pos.x, y: pos.y, w: w, h: h });
        tag.style.left = pos.x + 'px';
        tag.style.top = pos.y + 'px';
      });
    });
  }

  var attente;
  var replacer = function () { clearTimeout(attente); attente = setTimeout(placer, 150); };
  window.addEventListener('resize', replacer);
  /* Contenu affiché progressivement (photos, carte mise à l'échelle) : on replace à quelques reprises */
  [300, 1200, 2500].forEach(function (t) { setTimeout(placer, t); });
  d.documentElement.classList.add('mode-aide');
})();
