/* Outils partagés par le site, la carte A4 et les scripts de vérification.
   Rien à modifier ici pour changer la carte : voir carte.js à la racine. */
(function (root) {
  'use strict';

  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var JS_DAY = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };
  var NBSP = ' ';

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

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

  function telLink(tel) {
    var d = String(tel || '').replace(/[^\d+]/g, '');
    if (d.charAt(0) === '0') d = '+33' + d.slice(1);
    return 'tel:' + d;
  }

  /* "18h-22h" / "11h30-14h, 18h-22h" -> [[1080,1320], ...] (minutes) */
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

  function creneauxTexte(txt, sep) {
    var c = parseCreneaux(txt).filter(Boolean);
    if (!c.length) return 'Fermé';
    return c.map(function (r) { return heure(r[0]) + (sep || ' – ') + heure(r[1]); }).join(', ');
  }

  /* Validation : renvoie une liste d'erreurs lisibles (vide si tout va bien). */
  function valider(C) {
    var err = [];
    if (!C || typeof C !== 'object') return ['Le fichier carte.js ne définit pas window.CARTE.'];
    if (!Array.isArray(C.tailles) || !C.tailles.length) err.push('« tailles » doit contenir au moins une taille.');
    var nbT = (C.tailles || []).length;
    (C.tailles || []).forEach(function (t, i) {
      if (!t || !t.nom) err.push('Taille n°' + (i + 1) + ' : le « nom » est vide.');
    });
    if (!Array.isArray(C.pizzas) || !C.pizzas.length) err.push('« pizzas » doit contenir au moins une pizza.');
    (C.pizzas || []).forEach(function (p, i) {
      var label = 'Pizza n°' + (i + 1) + (p && p.nom ? ' (' + p.nom + ')' : '');
      if (!p || !p.nom) err.push(label + ' : le « nom » est vide.');
      if (!p || !Array.isArray(p.prix)) { err.push(label + ' : « prix » doit être une liste, ex. [11, 17, 26].'); return; }
      if (p.prix.length !== nbT) err.push(label + ' : ' + p.prix.length + ' prix pour ' + nbT + ' tailles.');
      p.prix.forEach(function (x) {
        if (typeof x !== 'number' || !isFinite(x) || x < 0) err.push(label + ' : le prix « ' + x + ' » n’est pas un nombre (écrire 12.5 et non "12,50").');
      });
    });
    if (!C.telephone) err.push('« telephone » est vide.');
    if (!C.horaires || typeof C.horaires !== 'object') err.push('« horaires » est manquant.');
    else JOURS.forEach(function (j) {
      if (!(j in C.horaires)) { err.push('Horaires : le jour « ' + j + ' » est manquant.'); return; }
      parseCreneaux(C.horaires[j]).forEach(function (r) {
        if (!r) err.push('Horaires du ' + j + ' : « ' + C.horaires[j] + ' » n’est pas compris (format attendu : "18h-22h").');
      });
    });
    return err;
  }

  function pizzasVisibles(C) {
    return (C.pizzas || []).filter(function (p) { return p && !p.masquee; });
  }

  /* Statut d'ouverture en temps réel (heure de Paris). */
  function maintenantParis() {
    try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); }
    catch (e) { return new Date(); }
  }

  function statut(C, now) {
    now = now || maintenantParis();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var byJs = {};
    JOURS.forEach(function (j) { byJs[JS_DAY[j]] = (parseCreneaux(C.horaires[j]) || []).filter(Boolean); });

    // Ouvert maintenant ? (y compris un créneau de la veille qui passe minuit)
    var today = byJs[day] || [];
    for (var i = 0; i < today.length; i++) {
      if (mins >= today[i][0] && mins < today[i][1]) return { ouvert: true, texte: 'Ouvert · jusqu’à ' + heure(today[i][1]) };
    }
    var yest = byJs[(day + 6) % 7] || [];
    for (var y = 0; y < yest.length; y++) {
      if (yest[y][1] > 1440 && mins < yest[y][1] - 1440) return { ouvert: true, texte: 'Ouvert · jusqu’à ' + heure(yest[y][1]) };
    }
    for (var k = 0; k < today.length; k++) {
      if (mins < today[k][0]) return { ouvert: false, texte: 'Ouvre ' + (today[k][0] < 17 * 60 ? 'à ' : 'ce soir à ') + heure(today[k][0]) };
    }
    for (var d = 1; d <= 7; d++) {
      var n = (day + d) % 7, c = byJs[n] || [];
      if (c.length) {
        var nom = JOURS.filter(function (j) { return JS_DAY[j] === n; })[0];
        return { ouvert: false, texte: d === 1 ? 'Fermé · ouvre demain à ' + heure(c[0][0]) : 'Fermé · réouverture ' + nom + ' à ' + heure(c[0][0]) };
      }
    }
    return { ouvert: false, texte: 'Fermé' };
  }

  /* Résumé des jours d'ouverture : [{du:'mardi', au:'samedi', creneaux:'18h-22h'}] */
  function groupesHoraires(C) {
    var groups = [];
    JOURS.forEach(function (j) {
      var v = String(C.horaires[j] || '').replace(/\s+/g, '');
      if (!v) return;
      var last = groups[groups.length - 1];
      if (last && last.cle === v && JOURS.indexOf(last.au) === JOURS.indexOf(j) - 1) last.au = j;
      else groups.push({ du: j, au: j, cle: v, creneaux: C.horaires[j] });
    });
    return groups;
  }

  function resumeJours(C) {
    return groupesHoraires(C).map(function (g) {
      if (g.du === g.au) return 'Le ' + g.du;
      if (JOURS.indexOf(g.au) - JOURS.indexOf(g.du) === 1) return cap(g.du) + ' et ' + g.au;
      return 'Du ' + g.du + ' au ' + g.au;
    }).join(' · ').replace(/ · Le /g, ' · le ');
  }

  function resumeHeures(C) {
    var g = groupesHoraires(C);
    if (!g.length) return '';
    var same = g.every(function (x) { return x.cle === g[0].cle; });
    if (!same) return 'Horaires selon le jour';
    var c = parseCreneaux(g[0].creneaux).filter(Boolean);
    return c.map(function (r) { return 'de ' + heure(r[0]) + ' à ' + heure(r[1]); }).join(' et ').replace(/^d/, 'D');
  }

  function fourchettePrix(C) {
    var all = [];
    pizzasVisibles(C).forEach(function (p) { (p.prix || []).forEach(function (x) { if (typeof x === 'number') all.push(x); }); });
    if (!all.length) return null;
    return { min: Math.min.apply(null, all), max: Math.max.apply(null, all) };
  }

  var nombres = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

  var api = {
    JOURS: JOURS, cap: cap, esc: esc, prix: prix, telLink: telLink, heure: heure,
    parseCreneaux: parseCreneaux, creneauxTexte: creneauxTexte, valider: valider,
    pizzasVisibles: pizzasVisibles, statut: statut, maintenantParis: maintenantParis,
    groupesHoraires: groupesHoraires, resumeJours: resumeJours, resumeHeures: resumeHeures,
    fourchettePrix: fourchettePrix, nombres: nombres, JS_DAY: JS_DAY
  };
  root.PZ = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
