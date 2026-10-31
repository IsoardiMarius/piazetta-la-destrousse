/* Version A4 de la carte (impression, PDF, aperçu) : construite à partir de
   carte.js et infos.js, puis ajustée pour tenir sur une seule page. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, PZ = window.PZ;
  var sheet = d.querySelector('[data-sheet]');
  if (!sheet) return;
  if (!PZ || !window.CARTE || !window.INFOS) { root.setAttribute('data-ready', 'error'); return; }

  var D = PZ.donnees(window);
  var tailles = D.tailles || [];
  var pizzas = PZ.pizzasVisibles(D);
  function $(s) { return sheet.querySelector(s); }
  function bind(k, v) { Array.prototype.forEach.call(sheet.querySelectorAll('[data-bind="' + k + '"]'), function (el) { el.textContent = v; }); }

  sheet.style.setProperty('--cols', tailles.length);

  $('[data-head]').insertAdjacentHTML('beforeend', tailles.map(function (t) {
    return '<div class="size"><b>' + PZ.esc(t.taille || t.nom) + '</b>' + (t.taille ? '<small>' + PZ.esc(t.nom) + '</small>' : '') + '</div>';
  }).join(''));

  $('[data-rows]').innerHTML = pizzas.map(function (p) {
    return '<div class="row">' +
      '<div class="row__name"><b>' + PZ.esc(p.nom) + (p.badge ? '<em>' + PZ.esc(p.badge) + '</em>' : '') + '</b>' +
      (p.ingredients ? '<span>' + PZ.esc(p.ingredients) + '</span>' : '') + '</div>' +
      tailles.map(function (t, i) { return '<span class="row__price">' + PZ.prix((p.prix || [])[i]) + '</span>'; }).join('') +
      '</div>';
  }).join('');

  var jours = PZ.resumeJours(D);
  if (jours) bind('resumeJoursCourt', jours.replace(/^Du (\S+) au (\S+)$/, function (_, a, b) { return PZ.cap(a) + ' – ' + b; }));
  var ville = (D.ville || '').replace(/^\d{5}\s+/, '');
  if (ville) bind('villeCourte', ville);
  if (D.adresse) bind('adresseCourte', D.adresse.replace(/\bavenue\b/i, 'av.') + ' · et alentours');

  /* Réduit légèrement le texte si la carte est trop longue pour une page */
  function fit() {
    var main = $('[data-main]'), list = $('[data-list]');
    var k = 1.15;
    sheet.style.setProperty('--k', k);
    while (k > 0.6 && list.scrollHeight > main.clientHeight - 16) {
      k = Math.round((k - 0.02) * 100) / 100;
      sheet.style.setProperty('--k', k);
    }
  }

  var pr = d.querySelector('[data-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });

  var ready = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
  ready.then(function () {
    fit();
    root.setAttribute('data-ready', 'ok');
    if (root.classList.contains('is-print-auto')) setTimeout(function () { window.print(); }, 400);
  });
})();
