/* Outils partagés par le site, la carte A4 et les scripts de vérification.
   Rien à modifier ici : le contenu est dans carte.js et infos.js. */
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

  function telLink(tel) {
    var d = String(tel || '').replace(/[^\d+]/g, '');
    if (d.charAt(0) === '0') d = '+33' + d.slice(1);
    return 'tel:' + d;
  }

  /* Rassemble carte.js et infos.js en un seul objet. */
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
      : 'du ' + dateTexte(f.du) + ' au ' + dateTexte(f.au);
    return 'Fermeture exceptionnelle ' + periode + '. À très vite\u202F!';
  }

  /* ---------- Statut d'ouverture en temps réel (heure de Paris) ---------- */

  function maintenantParis() {
    try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); }
    catch (e) { return new Date(); }
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

  function resumeJours(D) {
    return groupesHoraires(D).map(function (g, i) {
      var s;
      if (g.du === g.au) s = 'le ' + g.du;
      else if (JOURS.indexOf(g.au) - JOURS.indexOf(g.du) === 1) s = g.du + ' et ' + g.au;
      else s = 'du ' + g.du + ' au ' + g.au;
      return i === 0 ? cap(s) : s;
    }).join(' · ');
  }

  function resumeHeures(D) {
    var g = groupesHoraires(D);
    if (!g.length) return '';
    var same = g.every(function (x) { return x.cle === g[0].cle; });
    if (!same) return 'Horaires selon le jour';
    var c = parseCreneaux(g[0].creneaux).filter(Boolean);
    return cap(c.map(function (r) { return 'de ' + heure(r[0]) + ' à ' + heure(r[1]); }).join(' et '));
  }

  function premiereOuverture(D) {
    var g = groupesHoraires(D);
    if (g.length !== 1) return '';
    var c = parseCreneaux(g[0].creneaux).filter(Boolean);
    return c.length ? heure(c[0][0]) : '';
  }

  /* ---------- Carte ---------- */

  function pizzasVisibles(D) {
    return (D.pizzas || []).filter(function (p) { return p && !p.masquee; });
  }

  function fourchettePrix(D) {
    var all = [];
    pizzasVisibles(D).forEach(function (p) { (p.prix || []).forEach(function (x) { if (typeof x === 'number') all.push(x); }); });
    if (!all.length) return null;
    return { min: Math.min.apply(null, all), max: Math.max.apply(null, all) };
  }

  /* ---------- Validation (messages lisibles, en français) ---------- */

  function validerCarte(C) {
    var err = [];
    if (!C || typeof C !== 'object') return ['carte.js ne définit pas window.CARTE.'];
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
    return err.map(function (e) { return 'carte.js — ' + e; });
  }

  function validerInfos(I) {
    var err = [];
    if (!I || typeof I !== 'object') return ['infos.js ne définit pas window.INFOS.'];
    if (!I.telephone) err.push('« telephone » est vide.');
    if (!I.horaires || typeof I.horaires !== 'object') err.push('« horaires » est manquant.');
    else JOURS.forEach(function (j) {
      if (!(j in I.horaires)) { err.push('Horaires : le jour « ' + j + ' » est manquant.'); return; }
      parseCreneaux(I.horaires[j]).forEach(function (r) {
        if (!r) err.push('Horaires du ' + j + ' : « ' + I.horaires[j] + ' » n’est pas compris (format attendu : "18h-22h").');
      });
    });
    ['fermetureDu', 'fermetureAu'].forEach(function (k) {
      if (I[k] && !parseDate(I[k])) err.push('« ' + k + ' » : « ' + I[k] + ' » n’est pas une date (format attendu : "01/08/2027").');
    });
    if (I.histoire != null && !Array.isArray(I.histoire) && typeof I.histoire !== 'string') err.push('« histoire » doit être un texte ou une liste de paragraphes.');
    return err.map(function (e) { return 'infos.js — ' + e; });
  }

  var api = {
    JOURS: JOURS, JS_DAY: JS_DAY, cap: cap, esc: esc, prix: prix, telLink: telLink, heure: heure,
    donnees: donnees, parseCreneaux: parseCreneaux, creneauxTexte: creneauxTexte,
    parseDate: parseDate, dateTexte: dateTexte, fermeture: fermeture, estFerme: estFerme, messageFermeture: messageFermeture,
    statut: statut, maintenantParis: maintenantParis,
    groupesHoraires: groupesHoraires, resumeJours: resumeJours, resumeHeures: resumeHeures, premiereOuverture: premiereOuverture,
    pizzasVisibles: pizzasVisibles, fourchettePrix: fourchettePrix,
    validerCarte: validerCarte, validerInfos: validerInfos
  };
  root.PZ = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
