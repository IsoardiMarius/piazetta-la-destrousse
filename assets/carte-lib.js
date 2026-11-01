/* Outils partagés par le site, la carte A4 et les scripts de vérification.
   Rien à modifier ici : le contenu est dans le dossier contenu/ (modifiable depuis Pages CMS). */
(function (root) {
  'use strict';

  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var JS_DAY = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var NBSP = ' ';

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function nomJour(jsDay) { return JOURS.filter(function (j) { return JS_DAY[j] === jsDay; })[0]; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function prix(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '–';
    var s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
    return s + NBSP + '€';
  }

  /* Adresse e-mail du contenu si elle est bien formée, sinon chaîne vide (rien n'est affiché) */
  function emailValide(D) {
    var e = String(D.email || '').trim();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : '';
  }

  function telLink(tel) {
    var d = String(tel || '').replace(/[^\d+]/g, '');
    if (d.charAt(0) === '0') d = '+33' + d.slice(1);
    return 'tel:' + d;
  }

  /* Rassemble la carte (window.CARTE) et les infos (window.INFOS) en un seul objet. */
  function donnees(w) {
    var D = {}, k;
    var I = w.INFOS || {}, C = w.CARTE || {};
    for (k in I) D[k] = I[k];
    for (k in C) D[k] = C[k];
    return D;
  }

  /* ---------- Horaires ---------- */

  /* "18h-22h" / "11h30-14h, 18h-22h" -> [[1080,1320], ...] (minutes) ; null si illisible */
  function parseCreneaux(txt) {
    if (!txt || !String(txt).trim()) return [];
    return String(txt).split(',').map(function (part) {
      var m = part.trim().match(/^(\d{1,2})\s*h\s*(\d{2})?\s*[-–à]+\s*(\d{1,2})\s*h\s*(\d{2})?$/i);
      if (!m) return null;
      var a = (+m[1]) * 60 + (+(m[2] || 0));
      var b = (+m[3]) * 60 + (+(m[4] || 0));
      if (b <= a) b += 24 * 60; // fermeture après minuit
      return [a, b];
    });
  }

  function heure(min) {
    min = min % (24 * 60);
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? String(m).padStart(2, '0') : '');
  }

  function creneauxTexte(txt) {
    var c = parseCreneaux(txt).filter(Boolean);
    if (!c.length) return 'Fermé';
    return c.map(function (r) { return heure(r[0]) + ' – ' + heure(r[1]); }).join(', ');
  }

  function creneauxDuJour(D, jsDay) {
    return parseCreneaux((D.horaires || {})[nomJour(jsDay)]).filter(Boolean);
  }

  /* ---------- Dates et fermeture exceptionnelle ---------- */

  function parseDate(s) {
    var iso = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);  /* format du calendrier : 2027-08-01 */
    if (iso) return parseDate(iso[3] + '/' + iso[2] + '/' + iso[1]);
    var m = String(s || '').trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (!m) return null;
    var y = +m[3]; if (y < 100) y += 2000;
    var d = new Date(y, +m[2] - 1, +m[1]);
    if (d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return null;
    return d;
  }

  function jourSeul(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  function dateTexte(d) { return (d.getDate() === 1 ? '1er' : d.getDate()) + NBSP + MOIS[d.getMonth()]; }

  function fermeture(D) {
    var du = parseDate(D.fermetureDu), au = parseDate(D.fermetureAu);
    if (du && !au) au = du;
    if (au && !du) du = au;
    if (!du) return null;
    if (au < du) { var t = du; du = au; au = t; }
    return { du: du, au: au };
  }

  function estFerme(D, date) {
    var f = fermeture(D);
    if (!f) return false;
    var j = jourSeul(date);
    return j >= f.du && j <= f.au;
  }

  /* Message automatique pour le bandeau (fermeture en cours ou dans les 21 jours). */
  function messageFermeture(D, now) {
    var f = fermeture(D);
    if (!f) return '';
    now = jourSeul(now || maintenantParis());
    if (now > f.au) return '';
    if ((f.du - now) / 864e5 > 21) return '';
    var periode = f.du.getTime() === f.au.getTime()
      ? 'le ' + dateTexte(f.du)
      : 'du ' + (f.du.getMonth() === f.au.getMonth() && f.du.getFullYear() === f.au.getFullYear()
        ? (f.du.getDate() === 1 ? '1er' : f.du.getDate()) : dateTexte(f.du)) + ' au ' + dateTexte(f.au);
    return 'Fermeture exceptionnelle ' + periode + '. À très vite\u202F!';
  }

  /* ---------- Statut d'ouverture en temps réel (heure de Paris) ---------- */

  /* Heure de Paris, quel que soit le fuseau de l'appareil. Construite à partir des nombres
     (jour, heure, minute) : relire un texte comme « 12:22 AM » donnait midi au lieu de minuit sur iPhone. */
  function maintenantParis() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris', hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var d = new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) { return new Date(); }
  }

  function statut(D, now) {
    now = now || maintenantParis();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = estFerme(D, now) ? [] : creneauxDuJour(D, now.getDay());

    for (var i = 0; i < today.length; i++) {
      if (mins >= today[i][0] && mins < today[i][1]) return { ouvert: true, texte: 'Ouvert · jusqu’à ' + heure(today[i][1]) };
    }
    var hier = new Date(now.getTime() - 864e5);
    var yest = estFerme(D, hier) ? [] : creneauxDuJour(D, hier.getDay());
    for (var y = 0; y < yest.length; y++) {
      if (yest[y][1] > 1440 && mins < yest[y][1] - 1440) return { ouvert: true, texte: 'Ouvert · jusqu’à ' + heure(yest[y][1]) };
    }
    for (var k = 0; k < today.length; k++) {
      if (mins < today[k][0]) return { ouvert: false, texte: 'Ouvre ' + (today[k][0] < 17 * 60 ? 'à ' : 'ce soir à ') + heure(today[k][0]) };
    }
    var enConges = estFerme(D, now);
    for (var d = 1; d <= 120; d++) {
      var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      if (estFerme(D, date)) continue;
      var c = creneauxDuJour(D, date.getDay());
      if (!c.length) continue;
      var h = heure(c[0][0]);
      if (enConges) return { ouvert: false, texte: 'Fermé · réouverture le ' + nomJour(date.getDay()) + ' ' + dateTexte(date) };
      if (d === 1) return { ouvert: false, texte: 'Fermé · ouvre demain à ' + h };
      if (d < 7) return { ouvert: false, texte: 'Fermé · réouverture ' + nomJour(date.getDay()) + ' à ' + h };
      return { ouvert: false, texte: 'Fermé · réouverture le ' + dateTexte(date) };
    }
    return { ouvert: false, texte: 'Fermé' };
  }

  /* Résumé des jours d'ouverture : [{du:'mardi', au:'samedi', creneaux:'18h-22h'}] */
  function groupesHoraires(D) {
    var groups = [];
    JOURS.forEach(function (j) {
      var v = String((D.horaires || {})[j] || '').replace(/\s+/g, '');
      if (!v) return;
      var last = groups[groups.length - 1];
      if (last && last.cle === v && JOURS.indexOf(last.au) === JOURS.indexOf(j) - 1) last.au = j;
      else groups.push({ du: j, au: j, cle: v, creneaux: D.horaires[j] });
    });
    return groups;
  }

  /* Jours d'ouverture consécutifs, quels que soient les horaires : [{du:'mardi', au:'dimanche'}] */
  function plagesOuverture(D) {
    var plages = [];
    JOURS.forEach(function (j, i) {
      if (!String((D.horaires || {})[j] || '').trim()) return;
      var last = plages[plages.length - 1];
      if (last && JOURS.indexOf(last.au) === i - 1) last.au = j;
      else plages.push({ du: j, au: j });
    });
    return plages;
  }

  /* « Du mardi au samedi » : les jours d'ouverture ; les heures sont résumées par resumeHeures */
  function resumeJours(D) {
    var plages = plagesOuverture(D).map(function (g) {
      var s;
      if (g.du === g.au) s = 'le ' + g.du;
      else if (JOURS.indexOf(g.au) - JOURS.indexOf(g.du) === 1) s = g.du + ' et ' + g.au;
      else s = 'du ' + g.du + ' au ' + g.au;
      return s;
    });
    /* « Du mardi au jeudi et le samedi » */
    return cap(listeFr(plages));
  }

  /* Version courte pour le pied de page de la carte : « Mardi – samedi », « Vendredi », « Lun., mer.–ven. et dim. » */
  function resumeJoursCourt(D) {
    var p = plagesOuverture(D);
    if (!p.length) return '';
    if (p.length === 1) return p[0].du === p[0].au ? cap(p[0].du) : cap(p[0].du) + ' – ' + p[0].au;
    return cap(listeFr(p.map(function (g) {
      var a = JOURS.indexOf(g.du), b = JOURS.indexOf(g.au);
      return JOURS_COURTS[a] + (b > a ? '–' + JOURS_COURTS[b] : '');
    })));
  }

  /* Jours ouverts regroupés par horaire identique (même s'ils ne se suivent pas), dans l'ordre de la semaine :
     [{ jours: [1, 2, 3, 4, 6], creneaux: [[1080, 1320]] }, { jours: [5], creneaux: [[690, 840], [1080, 1350]] }] */
  function horairesParHeures(D) {
    var groupes = [], parCle = {};
    JOURS.forEach(function (j, i) {
      var c = parseCreneaux((D.horaires || {})[j]).filter(Boolean);
      if (!c.length) return;
      var cle = c.map(function (r) { return r.join('-'); }).join(',');
      if (!parCle[cle]) { parCle[cle] = { jours: [], creneaux: c }; groupes.push(parCle[cle]); }
      parCle[cle].jours.push(i);
    });
    return groupes;
  }
  var JOURS_COURTS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  /* Jours d'un groupe : « Mardi – jeudi », « Vendredi – samedi », « Lundi, mercredi – vendredi »
     (version courte pour le PDF : « Mar. – jeu. ») */
  function joursDuGroupe(jours, court) {
    var plages = [];
    jours.forEach(function (i) {
      var l = plages[plages.length - 1];
      if (l && l[1] === i - 1) l[1] = i; else plages.push([i, i]);
    });
    var nom = function (i) { return court ? JOURS_COURTS[i] : JOURS[i]; };
    return cap(plages.map(function (p) { return nom(p[0]) + (p[1] > p[0] ? NBSP + '– ' + nom(p[1]) : ''); }).join(', '));
  }
  function texteCreneau(r) { return heure(r[0]) + NBSP + '–' + NBSP + heure(r[1]); }

  /* Résumé des heures en texte : « De 18h à 22h » si c'est pareil tous les jours d'ouverture,
     sinon « Mardi – jeudi : 18h – 22h30 · Vendredi – samedi : 18h – 1h » */
  function resumeHeures(D) {
    var g = horairesParHeures(D);
    if (!g.length) return '';
    if (g.length > 1) return g.map(function (x) { return joursDuGroupe(x.jours) + NBSP + ': ' + x.creneaux.map(texteCreneau).join(', '); }).join(' · ');
    return cap(g[0].creneaux.map(function (r) { return 'de ' + heure(r[0]) + ' à ' + heure(r[1]); }).join(' et '));
  }

  /* Même résumé en HTML : quand les horaires varient, un petit tableau jours | heures (heures en gras),
     pour l'accueil (jours en toutes lettres) et le pied de page de la carte (court = jours abrégés) */
  function htmlResumeHeures(D, court) {
    var g = horairesParHeures(D);
    if (g.length < 2) return esc(textes(D).resumeHeures);
    return '<span class="hdet">' + g.map(function (x) {
      return '<span class="hdet__j">' + esc(joursDuGroupe(x.jours, court)) + '</span>' +
        '<b class="hdet__h">' + x.creneaux.map(function (r) { return '<span>' + esc(texteCreneau(r)) + '</span>'; }).join(', ') + '</b>';
    }).join('') + '</span>';
  }

  /* Heure d'ouverture si elle est la même tous les jours (« dès 18h »), même si la fermeture varie */
  function premiereOuverture(D) {
    var g = horairesParHeures(D);
    if (!g.length || !g.every(function (x) { return x.creneaux[0][0] === g[0].creneaux[0][0]; })) return '';
    return heure(g[0].creneaux[0][0]);
  }

  /* ---------- Carte ---------- */

  function produitsVisibles(D) {
    return (D.produits || []).filter(function (p) { return p && p.nom && !p.masque; });
  }

  function fourchettePrix(D) {
    var all = [];
    produitsVisibles(D).forEach(function (p) { (p.prix || []).forEach(function (x) { if (typeof x === 'number') all.push(x); }); });
    if (!all.length) return null;
    return { min: Math.min.apply(null, all), max: Math.max.apply(null, all) };
  }

  /* ---------- Validation (messages lisibles, en français) ---------- */

  /* Vérification du contenu.
     - erreurs : rendent le site impossible à construire (publication arrêtée, l'ancien site reste en ligne) ;
     - avertissements : le site est publié quand même, l'élément fautif est ignoré ou affiché « – ». */
  function valider(C, I) {
    var erreurs = [], avert = [];
    C = C || {}; I = I || {};
    var tailles = Array.isArray(C.tailles) ? C.tailles : [];
    if (!tailles.length) erreurs.push('La carte : il faut au moins une taille.');
    tailles.forEach(function (t, i) { if (!t || !t.nom) avert.push('La carte : la taille n°' + (i + 1) + ' n’a pas de nom.'); });
    var liste = Array.isArray(C.produits) ? C.produits : [];
    if (!liste.filter(function (p) { return p && p.nom && !p.masque; }).length) erreurs.push('Carte (page 1) : il faut au moins un produit affiché.');
    liste.forEach(function (p, i) {
      var label = 'Carte (page 1) : produit n°' + (i + 1) + (p && p.nom ? ' (' + p.nom + ')' : '');
      if (!p || !p.nom) { avert.push(label + ' n’a pas de nom.'); return; }
      var prixListe = Array.isArray(p.prix) ? p.prix : [];
      if (prixListe.length !== tailles.length) avert.push(label + ' : ' + prixListe.length + ' prix pour ' + tailles.length + ' tailles (les prix manquants s’affichent « – »).');
      prixListe.forEach(function (x) {
        if (typeof x !== 'number' || !isFinite(x) || x < 0) avert.push(label + ' : le prix « ' + x + ' » n’est pas un nombre.');
      });
    });
    var P2 = C.page2 && typeof C.page2 === 'object' ? C.page2 : {};
    (Array.isArray(P2.rubriques) ? P2.rubriques : []).forEach(function (r, i) {
      var nomR = 'Carte (page 2) : rubrique n°' + (i + 1) + (r && r.titre ? ' (' + r.titre + ')' : '');
      (r && Array.isArray(r.articles) ? r.articles : []).forEach(function (a, j) {
        var label = nomR + ', article n°' + (j + 1) + (a && a.nom ? ' (' + a.nom + ')' : '');
        if (!a || !a.nom) { avert.push(label + ' n’a pas de nom (ignoré).'); return; }
        if (!a.masque && (typeof a.prix !== 'number' || !isFinite(a.prix) || a.prix < 0)) avert.push(label + ' : le prix est manquant ou n’est pas un nombre (affiché « – »).');
      });
    });
    if (!I.telephone) avert.push('Établissement : le téléphone est vide.');
    if (!String(I.ville || '').trim()) avert.push('Établissement : le code postal et la ville sont vides.');
    ['couleurPrincipale', 'couleurFond'].forEach(function (k) {
      if (I[k] && !hexCouleur(I[k])) avert.push('Établissement : la couleur « ' + I[k] + ' » n’est pas un code couleur (#xxxxxx), la couleur d’origine est gardée.');
    });
    ['lienGoogle', 'lienAvis'].forEach(function (k) {
      if (I[k] && !lienHttp(I[k])) avert.push('Établissement : le lien « ' + I[k] + ' » doit commencer par https:// (ignoré).');
    });
    if (I.email && !emailValide(I)) avert.push('Établissement : l’adresse e-mail « ' + I.email + ' » n’est pas valide (elle n’est pas affichée).');
    var h = I.horaires && typeof I.horaires === 'object' ? I.horaires : {};
    JOURS.forEach(function (j) {
      parseCreneaux(h[j]).forEach(function (r) {
        if (!r) avert.push('Horaires : « ' + h[j] + ' » (' + j + ') n’est pas compris, le jour s’affiche « Fermé ». Format attendu : 18h-22h.');
      });
    });
    ['fermetureDu', 'fermetureAu'].forEach(function (k) {
      if (I[k] && !parseDate(I[k])) avert.push('Horaires : la date de fermeture « ' + I[k] + ' » n’est pas comprise, elle est ignorée.');
    });
    var r = I.reseaux && typeof I.reseaux === 'object' ? I.reseaux : {};
    Object.keys(r).forEach(function (k) {
      if (r[k] && !/^https?:\/\//.test(r[k])) avert.push('Établissement : l’adresse « ' + k + ' » doit commencer par https:// (lien ignoré).');
    });
    return { erreurs: erreurs, avertissements: avert };
  }

  /* ---------- Textes et blocs HTML (partagés par le navigateur et la publication) ---------- */

  /* Typographie française : pas de mot court ni de ponctuation isolés en fin de ligne */
  function fr(s) {
    return String(s)
      .replace(/(^|\s)(à|a|ou|et|de|du|le|la|les|un|une|en|au|aux|sur|ce|ne)\s+/gi, '$1$2 ')
      .replace(/\s+([?!:;»])/g, ' $1')
      .replace(/(«)\s+/g, '$1 ');
  }
  function lower1(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

  function listeFr(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1] : (a[0] || ''); }
  function nomOfficiel(D) { return String(D.nom || '').trim(); }
  function villeSeule(D) { return String(D.ville || '').replace(/^\d{5}\s+/, '').trim(); }
  /* « à La Destrousse », ou rien si la ville n'est pas renseignée */
  function aVille(D) { var v = villeSeule(D); return v ? ' à ' + v : ''; }
  /* Nom sans la ville, pour le logo de la barre et les titres : « Piazzetta La Destrousse » → « Piazzetta » */
  function nomCourt(D) {
    var n = nomOfficiel(D), v = villeSeule(D).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!v) return n;
    return n.replace(new RegExp('\\s*[-–—,]?\\s+' + v + '$', 'i'), '') || n;
  }
  /* Nom de fichier du PDF : « Carte-Piazzetta-La-Destrousse.pdf » */
  function nomPdf(D) {
    var slug = nomOfficiel(D).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'Carte-' + (slug || 'etablissement') + '.pdf';
  }
  function communes(D) { return Array.isArray(D.communesLivrees) ? D.communesLivrees.filter(Boolean) : []; }

  /* Liens vers la fiche Google : fiche, itinéraire et page « laisser un avis » */
  /* Identifiant de la fiche Google, s'il figure dans le lien collé (query_place_id=…, placeid=… ou « ChIJ… ») */
  function idFicheGoogle(lien) {
    lien = String(lien || '');
    var m = lien.match(/(?:query_place_id|destination_place_id|placeid|place_id)=([\w-]{10,})/i) || lien.match(/(?:^|[^A-Za-z0-9_]|!19s)(ChIJ[\w-]{10,})/);
    return m ? m[1] : '';
  }
  function lienHttp(x) { x = String(x || '').trim(); return /^https?:\/\//.test(x) ? x : ''; }

  /* Liens Google des boutons « Itinéraire » et « Votre avis » (rubrique « Établissement » de Pages CMS) :
     - fiche : le lien collé, sinon une recherche du nom et de l'adresse sur Google Maps ;
     - itinéraire : vers le nom et l'adresse, précisé par l'identifiant de la fiche s'il est connu ;
     - avis : le lien « Demander des avis » collé, sinon calculé depuis l'identifiant, sinon la fiche. */
  function liensGoogle(D) {
    var lien = lienHttp(D.lienGoogle), id = idFicheGoogle(lien);
    var q = encodeURIComponent([nomOfficiel(D), D.adresse, D.ville].filter(Boolean).join(', '));
    var fiche = lien || 'https://www.google.com/maps/search/?api=1&query=' + q;
    return {
      fiche: fiche,
      itineraire: 'https://www.google.com/maps/dir/?api=1&destination=' + q + (id ? '&destination_place_id=' + id : ''),
      avis: lienHttp(D.lienAvis) || (id ? 'https://search.google.com/local/writereview?placeid=' + id : fiche)
    };
  }

  var RESEAUX = { uberEats: 'Uber Eats', facebook: 'Facebook', instagram: 'Instagram' };
  function reseaux(D) {
    var r = D.reseaux || {};
    return Object.keys(RESEAUX).filter(function (k) { return /^https?:\/\//.test(r[k] || ''); }).map(function (k) { return { cle: k, nom: RESEAUX[k], url: r[k] }; });
  }
  function htmlReseaux(D) {
    return reseaux(D).map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.nom) + '</a>'; }).join('');
  }

  /* Liens discrets sous les boutons de l'accueil */
  var ICONE_EXT = '<svg class="ic" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>';
  var LIBELLES_HERO = { uberEats: 'Commander sur Uber Eats', facebook: 'Suivre sur Facebook', instagram: 'Suivre sur Instagram' };
  function htmlLiensHero(D) {
    return reseaux(D).map(function (x) {
      return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(LIBELLES_HERO[x.cle] || x.nom) + ICONE_EXT + '</a>';
    }).join('<span class="hero__sep" aria-hidden="true">·</span>');
  }

  /* Valeur de chaque élément data-bind="..." des pages */
  /* Activité de l'établissement (rubrique « Établissement » de Pages CMS) : rien de propre à une
     pizzeria n'est écrit dans le code */
  function activite(D) { return String(D.activite || '').trim() || 'Restaurant'; }
  /* Nom des produits de la page 1, accordé : nomProduits(D, 1) = « pizza artisanale », nomProduits(D, 13) = « pizzas artisanales » */
  function nomProduits(D, n) {
    var un = String(D.produitSingulier || '').trim() || 'produit', plusieurs = String(D.produitPluriel || '').trim() || un + 's';
    return n > 1 ? plusieurs : un;
  }
  function cuisine(D) {
    var c = (Array.isArray(D.cuisine) ? D.cuisine : []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return c.length ? c : undefined;
  }

  /* ---------- Couleurs (rubrique « Établissement » de Pages CMS) ----------
     Deux couleurs au choix (principale et fond) ; toutes les nuances en sont tirées automatiquement.
     Avec les couleurs d'origine, aucune surcharge : le site garde exactement ses réglages d'origine. */
  var COULEURS_ORIGINE = {
    brand: '#6B1A14', 'brand-dark': '#521310', bg: '#F6F0E6', ink: '#241411', 'ink-2': '#3B2A26',
    muted: '#6B5853', 'muted-2': '#5E4C47', cream: '#F6EEE3', 'cream-muted': '#EAD9C8', 'cream-2': '#E7D3C2',
    chip: '#EDE2D2', 'chip-2': '#E6D7C3', card: '#FFFCF7', line: '#E6DACB', 'line-2': '#D9C6B0',
    page: '#E9E0D2', 'sk-pate': '#F1E6D6', 'sk-pate-2': '#E5D2BA', 'sk-pied': '#7A2A22'
  };
  function hexCouleur(x) { x = String(x || '').trim(); return /^#[0-9a-f]{6}$/i.test(x) ? x.toUpperCase() : ''; }
  function rvb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function hex(c) { return '#' + c.map(function (x) { return ('0' + Math.round(Math.max(0, Math.min(255, x))).toString(16)).slice(-2); }).join('').toUpperCase(); }
  /* Mélange : t = part de la seconde couleur (0 à 1) */
  function melange(a, b, t) { var A = rvb(a), B = rvb(b); return hex(A.map(function (x, i) { return x + (B[i] - x) * t; })); }
  function luminance(h) {
    return rvb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  /* Toutes les couleurs du site, de la carte et du flyer, à partir des deux couleurs choisies */
  function couleurs(D) {
    var p = hexCouleur(D.couleurPrincipale) || COULEURS_ORIGINE.brand, f = hexCouleur(D.couleurFond) || COULEURS_ORIGINE.bg;
    if (p === COULEURS_ORIGINE.brand && f === COULEURS_ORIGINE.bg) return COULEURS_ORIGINE;
    /* Texte : foncé (teinté de la couleur principale) sur fond clair, clair sur fond foncé */
    var ink = luminance(f) > 0.25 ? melange(melange(p, '#000000', 0.72), '#1C1C1C', 0.3) : melange(f, '#FFFFFF', 0.92);
    /* Texte posé sur la couleur principale (boutons, bloc carte, pied de la carte) : foncé si elle est claire, clair sinon */
    var surP = luminance(p) > 0.4 ? melange(p, '#000000', 0.82) : melange('#FFFFFF', p, 0.05);
    return {
      brand: p, 'brand-dark': melange(p, '#000000', 0.23), bg: f, ink: ink, 'ink-2': melange(ink, f, 0.12),
      muted: melange(ink, f, 0.38), 'muted-2': melange(ink, f, 0.3),
      cream: surP, 'cream-muted': melange(surP, p, 0.18), 'cream-2': melange(surP, p, 0.22),
      chip: melange(f, ink, 0.06), 'chip-2': melange(f, ink, 0.1), card: melange(f, '#FFFFFF', 0.6),
      line: melange(f, ink, 0.09), 'line-2': melange(f, ink, 0.16),
      page: melange(f, ink, 0.06), 'sk-pate': melange(f, ink, 0.03), 'sk-pate-2': melange(f, ink, 0.09), 'sk-pied': melange(p, '#FFFFFF', 0.1)
    };
  }
  /* Feuille de style à ajouter aux pages : vide avec les couleurs d'origine */
  function cssCouleurs(D) {
    var c = couleurs(D);
    if (c === COULEURS_ORIGINE) return '';
    var dessin = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='%23" + c.brand.slice(1) +
      "' stroke-opacity='.28' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='24' cy='24' r='18'/%3E%3Cpath d='M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18'/%3E%3C/svg%3E\")";
    return ':root{' + Object.keys(c).map(function (k) { return '--' + k + ':' + c[k]; }).join(';') + ';--sk-pizza:' + dessin + '}';
  }

  /* Livraison et / ou vente à emporter (cases à cocher dans Pages CMS) : adapte tous les textes concernés */
  function service(D) {
    var l = D.livraison !== false, e = D.emporter !== false;
    if (!l && !e) e = true;
    return {
      livraison: l, emporter: e,
      titre: l && e ? 'Livraison et à emporter' : l ? 'Livraison' : 'À emporter',
      phrase: l && e ? 'à emporter ou en livraison' : l ? 'en livraison' : 'à emporter',
      livrees: l && e ? 'à emporter ou livrées' : l ? 'livrées' : 'à emporter'
    };
  }

  /* Textes modifiables dans Pages CMS : un champ vidé par erreur reprend le texte d'origine */
  var TEXTES_DEFAUT = {
    pointFortTitre: 'Recette artisanale',
    pointFortTexte: 'Produits frais, fait maison',
    carteTexte: 'Toute la carte, avec le détail de chaque produit, est aussi disponible en PDF.',
    piedDePage: '',
    introuvableTitre: 'Cette page s’est égarée.',
    introuvableTexte: 'L’adresse demandée n’existe pas ou plus. La carte, elle, est toujours là.',
    enTeteTitre: 'La carte'
  };

  function textes(D) {
    var T = {};
    var rempli = function (k) { return typeof D[k] === 'string' && D[k].trim() !== ''; };
    var S = service(D);
    var defauts = {
      titre: cap(nomProduits(D, 2)) + ', ' + S.livrees + '.',
      introduction: 'Des produits frais, préparés avec soin.',
      histoireTitre: 'Le goût des choses simples.',
      photosTitre: 'En images.'
    };
    Object.keys(defauts).forEach(function (k) { T[k] = fr(rempli(k) ? D[k] : defauts[k]); });
    ['histoireSignature', 'adresse', 'ville', 'zoneLivraison', 'mention', 'telephone'].forEach(function (k) { if (typeof D[k] === 'string') T[k] = D[k]; });
    Object.keys(TEXTES_DEFAUT).forEach(function (k) { T[k] = fr(rempli(k) ? D[k].trim() : TEXTES_DEFAUT[k]); });
    T.service = S.titre;
    T.enTeteSousTitre = rempli('enTeteSousTitre') ? D.enTeteSousTitre.trim() : cap(nomProduits(D, 2)) + ' · ' + cap(S.phrase);
    T.titreListe = rempli('titreListe') ? fr(D.titreListe.trim()) : 'Nos ' + nomProduits(D, 2);
    T.email = emailValide(D);
    T.nom = nomOfficiel(D);
    T.nomCourt = nomCourt(D);
    T.nomPied = nomOfficiel(D) + ' · ' + (T.piedDePage || activite(D));
    var jours = resumeJours(D), heures = resumeHeures(D), ouv = premiereOuverture(D);
    T.resumeJours = jours || 'Horaires : nous appeler';
    T.resumeJoursCourt = jours ? resumeJoursCourt(D) : 'Sur appel';
    T.resumeHeures = heures || (D.telephone ? 'Au ' + D.telephone : '');
    T.statutDefaut = jours ? jours + (ouv ? ' dès ' + ouv : '') : 'Commandes par téléphone';
    var zone = (service(D).livraison && D.zoneLivraison) || villeSeule(D);
    var quand = jours ? lower1(jours) + (ouv ? ' dès ' + ouv : '') : '';
    T.accroche = zone ? 'À ' + zone + (quand ? ', ' + quand : '') + '.' : (quand ? cap(quand) + '.' : '');
    var tailles = D.tailles || [], n = produitsVisibles(D).length;
    T.titreCarte = n + ' ' + nomProduits(D, n) + ', ' + tailles.length + ' taille' + (tailles.length > 1 ? 's' : '') + '.';
    var fp = fourchettePrix(D);
    var lt = tailles.map(function (t) { return t.nom + (t.taille ? ' ' + t.taille : ''); });
    var tl = lt.length > 1 ? lt.slice(0, -1).join(', ') + ' ou ' + lt[lt.length - 1] : (lt[0] || '');
    T.sousTitreCarte = tl + (fp ? (fp.min === fp.max ? ', ' + prix(fp.min) : ', de ' + prix(fp.min) + ' à ' + prix(fp.max)) : '') + '.';
    T.villeCourte = villeSeule(D);
    T.lieu = activite(D) + aVille(D);
    T.logoAlt = 'Logo ' + nomOfficiel(D);
    T.retourHaut = nomOfficiel(D) + ', retour en haut';
    var cs = communes(D);
    var zoneLiv = cs.length ? listeFr(cs) : (D.zoneLivraison || villeSeule(D));
    T.livraisonTexte = S.livraison ? (zoneLiv ? 'Livraison à ' + zoneLiv + '.' : 'Livraison possible.') : '';
    T.retraitTexte = S.emporter ? 'Retrait des commandes sur place.' : '';
    T.zoneService = S.livraison ? (D.zoneLivraison || villeSeule(D) || 'Livraison possible') : 'Retrait sur place' + aVille(D);
    if (D.adresse) T.adresseCourte = D.adresse.replace(/\bavenue\b/i, 'av.') + (S.livraison ? ' · et alentours' : '');
    var rv = rubriquesVisibles(D);
    T.titrePage2 = titrePage2(D);
    T.suitePage2 = T.titrePage2 + ' en page 2';
    var st2 = String(donneesPage2(D).sousTitre || '').trim();
    T.sousTitrePage2 = rv.length ? (st2 || rv.map(function (r) { return r.titre; }).filter(Boolean).concat([cap(S.phrase)]).join(' · ')) : '';
    T.mentionPage2 = typeof donneesPage2(D).mention === 'string' ? donneesPage2(D).mention : '';
    return T;
  }

  function htmlHistoire(D) {
    var paras = Array.isArray(D.histoire) ? D.histoire : (D.histoire ? [D.histoire] : []);
    return paras.filter(Boolean).map(function (p) { return '<p>' + esc(fr(p)) + '</p>'; }).join('');
  }

  /* Horaires de la semaine ; avec `now`, le jour courant est mis en avant */
  /* Jour du service en cours : après minuit, tant que le service de la veille n'est pas fini
     (ex. samedi 18h-1h, dimanche à 0h30), c'est encore la veille */
  function jourDeService(D, now) {
    var hier = new Date(now.getTime() - 864e5), mins = now.getHours() * 60 + now.getMinutes();
    var enCours = !estFerme(D, hier) && creneauxDuJour(D, hier.getDay()).some(function (c) { return c[1] > 1440 && mins < c[1] - 1440; });
    return enCours ? hier : now;
  }

  function htmlHoraires(D, now, note) {
    if (now) now = jourDeService(D, now);
    var conges = now && estFerme(D, now);
    return JOURS.map(function (j) {
      var today = !!now && JS_DAY[j] === now.getDay();
      var txt = creneauxTexte((D.horaires || {})[j]);
      if (today && conges) txt = 'Fermé';
      var closed = txt === 'Fermé';
      /* Un créneau par bloc insécable : avec une coupure (midi et soir), le 2e passe à la ligne si l'écran est étroit */
      var parts = txt.split(', ');
      var creneaux = parts.map(function (c, i) { return '<span>' + esc(c) + (i < parts.length - 1 ? ',' : '') + '</span>'; }).join(' ');
      return '<li class="' + (closed ? 'is-closed' : '') + (today ? ' is-today' : '') + '">' +
        '<span class="day">' + cap(j) + (today ? '<span class="today-tag">Aujourd’hui</span>' : '') + '</span>' +
        '<span class="time">' + creneaux + '</span></li>';
    }).join('') + (note ? '<li class="hours__note">' + esc(note) + '</li>' : '');
  }

  /* Texte lu par Google et les lecteurs d'écran : « Reine, Piazzetta La Destrousse, pizzeria à La Destrousse » */
  function altPhoto(p, D) {
    D = D || {};
    return (p.legende || cap(nomProduits(D, 1))) + ', ' + nomOfficiel(D) + ', ' + activite(D).toLowerCase() + aVille(D);
  }

  /* Squelette de chargement : une pizza qui se dessine (croûte, parts, garniture) sur fond de pâte farinée */
  var SK_ICONE = '<svg class="sk__icone" viewBox="0 0 48 48" aria-hidden="true">' +
    '<circle class="sk__croute" cx="24" cy="24" r="18" pathLength="100"/>' +
    '<path class="sk__parts" d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18" pathLength="100"/>' +
    '<circle class="sk__garni" cx="34.5" cy="24" r="2.3"/><circle class="sk__garni" cx="18.8" cy="14.9" r="2.3"/><circle class="sk__garni" cx="18.8" cy="33.1" r="2.3"/>' +
    '</svg>';

  function htmlGalerie(photos, D) {
    return photos.map(function (p, i) {
      var grand = i === 0 || photos.length < 3;
      var sizes = '(max-width: 760px) 80vw, ' + (grand ? '(max-width: 1200px) 50vw, 600px' : '300px');
      return '<li class="ph reveal" style="--i:' + (i % 5) + '">' +
        '<button type="button" class="ph__btn" data-ph="' + i + '" data-grande="' + esc(p.grande) + '" data-sk aria-label="Agrandir la photo"' +
        (p.lqip ? ' style="--lqip:url(\'' + p.lqip + '\')"' : '') + '>' +
        '<img src="' + esc(p.src) + '" srcset="' + esc(p.srcset) + '" sizes="' + sizes + '" width="' + p.largeur + '" height="' + p.hauteur + '" alt="' + esc(altPhoto(p, D)) + '" loading="lazy" decoding="async" data-fade>' +
        (p.texte ? '<span class="ph__leg">' + esc(p.texte) + '</span>' : '') +
        '<span class="sk">' + SK_ICONE + '</span>' +
        '</button></li>';
    }).join('');
  }

  function htmlEnteteTailles(D) {
    return '<span class="row__label">' + esc(textes(D).titreListe) + '</span>' + (D.tailles || []).map(function (t) {
      return '<div class="size"><b>' + esc(t.taille || t.nom) + '</b>' + (t.taille ? '<small>' + esc(t.nom) + '</small>' : '') + '</div>';
    }).join('');
  }

  /* Texte saisi sur plusieurs lignes : les retours à la ligne sont gardés */
  function multiligne(t) { return esc(String(t).trim()).replace(/[ \t]*\r?\n[ \t\r\n]*/g, '<br>'); }

  function htmlLignesCarte(D) {
    var tailles = D.tailles || [];
    return produitsVisibles(D).map(function (p) {
      return '<div class="row">' +
        '<div class="row__name"><b>' + esc(p.nom) + (p.badge ? '<em>' + esc(p.badge) + '</em>' : '') + '</b>' +
        (p.description ? '<span>' + multiligne(p.description) + '</span>' : '') + '</div>' +
        tailles.map(function (t, i) { return '<span class="row__price">' + prix((p.prix || [])[i]) + '</span>'; }).join('') +
        '</div>';
    }).join('');
  }

  /* ---------- Page 2 de la carte : boissons, desserts, salades… (contenu/carte-page2.json) ---------- */

  function donneesPage2(D) { return D.page2 && typeof D.page2 === 'object' ? D.page2 : {}; }
  /* Rubriques ayant au moins un article affiché ; la page 2 n'existe que s'il y en a une */
  function rubriquesVisibles(D) {
    var R = Array.isArray(donneesPage2(D).rubriques) ? donneesPage2(D).rubriques : [];
    return R.filter(function (r) { return r && typeof r === 'object'; }).map(function (r) {
      var articles = (Array.isArray(r.articles) ? r.articles : []).filter(function (a) { return a && a.nom && !a.masque; });
      return { titre: r.titre || '', articles: articles };
    }).filter(function (r) { return r.articles.length; });
  }
  function titrePage2(D) { return String(donneesPage2(D).titre || '').trim() || 'Boissons & desserts'; }

  function htmlRubriques(D) {
    var rv = rubriquesVisibles(D);
    if (!rv.length) return '';
    /* Sur deux colonnes ; une rubrique courte reste d'un seul tenant */
    return '<div class="rubs" data-n="' + Math.min(rv.length, 2) + '">' + rv.map(function (r) {
      return '<section class="rub' + (r.articles.length > 8 ? ' rub--longue' : '') + '">' + (r.titre ? '<h2 class="rub__titre">' + esc(r.titre) + '</h2>' : '') +
        r.articles.map(function (a) {
          return '<div class="art"><div class="art__ligne"><b>' + esc(a.nom) + (a.badge ? '<em>' + esc(a.badge) + '</em>' : '') + '</b>' +
            '<i class="art__pts" aria-hidden="true"></i><span class="art__prix">' + prix(a.prix) + '</span></div>' +
            (a.detail ? '<span class="art__detail">' + esc(a.detail) + '</span>' : '') + '</div>';
        }).join('') + '</section>';
    }).join('') + '</div>';
  }

  /* Descriptions pour Google et les aperçus de liens */
  function description(D) {
    var T = textes(D), fp = fourchettePrix(D);
    var cs = communes(D);
    var S = service(D);
    return nomCourt(D) + ', ' + activite(D).toLowerCase() + aVille(D) + ' : ' + nomProduits(D, 2) + ' ' + S.livrees + (S.livraison && cs.length ? ' à ' + listeFr(cs) : '') + ', ' +
      (T.resumeJours ? lower1(T.resumeJours) + (premiereOuverture(D) ? ' dès ' + premiereOuverture(D) : '') : '') + '. ' +
      produitsVisibles(D).length + ' au choix' + (fp ? ', de ' + prix(fp.min) + ' à ' + prix(fp.max) : '') + '. ' +
      'Tél. ' + (D.telephone || '') + '.';
  }
  /* Description de la page de la carte (environ 160 caractères, la longueur affichée par Google) */
  function descriptionCarte(D) {
    var n = produitsVisibles(D).length, tailles = (D.tailles || []).length, fp = fourchettePrix(D), rv = rubriquesVisibles(D);
    var d = nomCourt(D) + ', ' + activite(D).toLowerCase() + aVille(D) + ' : la carte, ' + n + ' ' + nomProduits(D, n) +
      (fp ? (fp.min === fp.max ? ' à ' + prix(fp.min) : ' de ' + prix(fp.min) + ' à ' + prix(fp.max)) : '') +
      (tailles > 1 ? ' en ' + tailles + ' tailles' : '') +
      (rv.length ? ', ' + listeFr(rv.map(function (r) { return r.titre.toLowerCase(); }).filter(Boolean)) : '') + '. ' + cap(service(D).phrase) + '.';
    return d.replace(/\u00a0/g, ' ');
  }

  /* Titres d'onglet (et de Google) et descriptions : générés à partir du contenu, sauf s'ils sont
     personnalisés dans la rubrique « Google et partage de liens » de Pages CMS */
  function perso(D, k) { return String(D[k] || '').trim(); }
  function titrePageAccueil(D) {
    return perso(D, 'seoTitreAccueil') || nomCourt(D) + ' — ' + activite(D) + aVille(D) + ', ' + service(D).titre.toLowerCase();
  }
  function titrePageCarte(D) {
    return perso(D, 'seoTitreCarte') || 'Carte et prix — ' + nomCourt(D) + ', ' + activite(D).toLowerCase() + aVille(D);
  }
  function titrePage404(D) { return 'Page introuvable — ' + nomOfficiel(D); }
  function descriptionAccueil(D) { return perso(D, 'seoDescriptionAccueil') || description(D); }
  function descriptionPageCarte(D) { return perso(D, 'seoDescriptionCarte') || descriptionCarte(D); }
  /* Autres noms sous lesquels l'établissement est connu (Google) : nom court + liste du contenu */
  function autresNoms(D) {
    var vus = {}, liste = [nomCourt(D)].concat(Array.isArray(D.autresNoms) ? D.autresNoms : []);
    return liste.map(function (x) { return String(x || '').trim(); }).filter(function (x) {
      if (!x || x === nomOfficiel(D) || vus[x.toLowerCase()]) return false;
      vus[x.toLowerCase()] = true; return true;
    });
  }

  /* Fiche « Restaurant » pour Google (données structurées schema.org) */
  function jsonLd(D, base, photos) {
    var dayMap = { lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday' };
    var pad = function (m) { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var spec = [];
    JOURS.forEach(function (j) {
      parseCreneaux((D.horaires || {})[j]).filter(Boolean).forEach(function (r) {
        spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/' + dayMap[j], opens: pad(r[0]), closes: pad(r[1]) });
      });
    });
    /* Fermeture exceptionnelle à venir ou en cours : indiquée à Google */
    var f = fermeture(D), aujourdhui = jourSeul(maintenantParis());
    var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    var speciaux = f && f.au >= aujourdhui ? [{ '@type': 'OpeningHoursSpecification', opens: '00:00', closes: '00:00', validFrom: iso(f.du), validThrough: iso(f.au) }] : undefined;
    var cp = (D.ville || '').match(/^(\d{5})\s+(.*)$/);
    var tailles = D.tailles || [];
    var fp = fourchettePrix(D);
    var images = [base + 'assets/og-image.jpg'].concat((photos || []).map(function (p) { return base + p.grande; }));
    var G = liensGoogle(D), cs = communes(D);
    var restaurant = {
      '@type': 'Restaurant',
      '@id': base + '#restaurant',
      name: nomOfficiel(D),
      alternateName: autresNoms(D),
      description: description(D),
      url: base,
      telephone: telLink(D.telephone).replace('tel:', ''),
      email: emailValide(D) || undefined,
      image: images,
      logo: base + 'assets/logo-360.webp',
      servesCuisine: cuisine(D),
      priceRange: fp ? (Math.round(fp.min) + '–' + Math.round(fp.max) + ' €') : undefined,
      acceptsReservations: false,
      address: { '@type': 'PostalAddress', streetAddress: D.adresse, postalCode: cp ? cp[1] : undefined, addressLocality: cp ? cp[2] : D.ville, addressCountry: 'FR' },
      areaServed: !service(D).livraison ? undefined : cs.length ? cs.map(function (c) { return { '@type': 'City', name: c }; }) : (villeSeule(D) ? { '@type': 'City', name: villeSeule(D) } : undefined),
      hasMap: G.fiche,
      sameAs: [G.fiche].concat(reseaux(D).map(function (x) { return x.url; })),
      menu: base + 'carte.html',
      openingHoursSpecification: spec,
      specialOpeningHoursSpecification: speciaux,
      hasMenu: {
        '@type': 'Menu',
        name: 'La carte',
        url: base + 'carte.html',
        hasMenuSection: [{
          '@type': 'MenuSection',
          name: cap(nomProduits(D, 2)),
          hasMenuItem: produitsVisibles(D).map(function (p) {
            return {
              '@type': 'MenuItem',
              name: p.nom,
              description: p.description,
              offers: tailles.map(function (t, i) {
                return { '@type': 'Offer', name: t.nom + (t.taille ? ' ' + t.taille : ''), price: (p.prix || [])[i], priceCurrency: 'EUR' };
              })
            };
          })
        }].concat(rubriquesVisibles(D).map(function (r) {
          return {
            '@type': 'MenuSection',
            name: r.titre || titrePage2(D),
            hasMenuItem: r.articles.map(function (a) {
              return { '@type': 'MenuItem', name: a.nom, description: a.detail || undefined, offers: typeof a.prix === 'number' ? { '@type': 'Offer', price: a.prix, priceCurrency: 'EUR' } : undefined };
            })
          };
        }))
      }
    };
    return {
      '@context': 'https://schema.org',
      '@graph': [
        restaurant,
        { '@type': 'WebSite', '@id': base + '#site', url: base, name: nomOfficiel(D), alternateName: nomCourt(D), inLanguage: 'fr-FR', publisher: { '@id': base + '#restaurant' } }
      ]
    };
  }

  var api = {
    JOURS: JOURS, JS_DAY: JS_DAY, cap: cap, esc: esc, prix: prix, telLink: telLink, emailValide: emailValide, heure: heure,
    donnees: donnees, parseCreneaux: parseCreneaux, creneauxTexte: creneauxTexte,
    parseDate: parseDate, dateTexte: dateTexte, fermeture: fermeture, estFerme: estFerme, messageFermeture: messageFermeture,
    statut: statut, maintenantParis: maintenantParis,
    groupesHoraires: groupesHoraires, resumeJours: resumeJours, resumeHeures: resumeHeures, htmlResumeHeures: htmlResumeHeures, premiereOuverture: premiereOuverture,
    produitsVisibles: produitsVisibles, fourchettePrix: fourchettePrix,
    valider: valider,
    fr: fr, textes: textes, htmlHistoire: htmlHistoire, htmlHoraires: htmlHoraires, htmlGalerie: htmlGalerie, altPhoto: altPhoto,
    htmlEnteteTailles: htmlEnteteTailles, htmlLignesCarte: htmlLignesCarte, multiligne: multiligne,
    description: description, descriptionCarte: descriptionCarte, jsonLd: jsonLd,
    liensGoogle: liensGoogle, htmlReseaux: htmlReseaux, htmlLiensHero: htmlLiensHero, nomOfficiel: nomOfficiel, villeSeule: villeSeule, aVille: aVille,
    titrePageAccueil: titrePageAccueil, titrePageCarte: titrePageCarte, titrePage404: titrePage404,
    descriptionAccueil: descriptionAccueil, descriptionPageCarte: descriptionPageCarte,
    nomCourt: nomCourt, nomPdf: nomPdf, rubriquesVisibles: rubriquesVisibles, htmlRubriques: htmlRubriques, titrePage2: titrePage2, SK_ICONE: SK_ICONE, service: service, couleurs: couleurs, cssCouleurs: cssCouleurs, hexCouleur: hexCouleur, activite: activite, nomProduits: nomProduits
  };
  root.PZ = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
