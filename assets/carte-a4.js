/* Carte A4 : construite à partir de carte.js, ajustée pour tenir sur une page. */
(function () {
  'use strict';
  var C = window.CARTE, PZ = window.PZ, d = document, root = d.documentElement;
  function $(s) { return d.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(d.querySelectorAll(s)); }
  function bind(k, v) { $$('[data-bind="' + k + '"]').forEach(function (el) { el.textContent = v; }); }

  if (!C || !PZ) { root.setAttribute('data-ready', 'error'); return; }
  var erreurs = PZ.valider(C);
  if (erreurs.length) console.warn('[carte.js] ' + erreurs.join('\n'));

  var tailles = C.tailles || [];
  var pizzas = PZ.pizzasVisibles(C);
  var sheet = $('[data-sheet]');
  sheet.style.setProperty('--cols', tailles.length);

  /* En-tête des colonnes */
  $('[data-head]').insertAdjacentHTML('beforeend', tailles.map(function (t) {
    return '<div class="size"><b>' + PZ.esc(t.taille || t.nom) + '</b>' + (t.taille ? '<small>' + PZ.esc(t.nom) + '</small>' : '') + '</div>';
  }).join(''));

  /* Lignes */
  $('[data-rows]').innerHTML = pizzas.map(function (p) {
    return '<div class="row">' +
      '<div class="row__name"><b>' + PZ.esc(p.nom) + (p.badge ? '<em>' + PZ.esc(p.badge) + '</em>' : '') + '</b>' +
      (p.ingredients ? '<span>' + PZ.esc(p.ingredients) + '</span>' : '') + '</div>' +
      tailles.map(function (t, i) { return '<span class="row__price">' + PZ.prix((p.prix || [])[i]) + '</span>'; }).join('') +
      '</div>';
  }).join('');

  /* Textes */
  bind('telephone', C.telephone || '');
  bind('mention', C.mention || '');
  var jours = PZ.resumeJours(C);
  if (jours) bind('resumeJours', jours.replace(/^Du (\S+) au (\S+)$/, function (_, a, b) { return PZ.cap(a) + ' – ' + b; }));
  var h = PZ.resumeHeures(C); if (h) bind('resumeHeures', h);
  var ville = (C.ville || '').replace(/^\d{5}\s+/, '');
  if (ville) bind('villeCourte', ville);
  if (C.adresse) bind('adresseCourte', C.adresse.replace(/\bavenue\b/i, 'av.') + ' · et alentours');

  /* Ajuste la taille du texte pour que tout tienne sur une seule page A4 */
  function fit() {
    var main = $('[data-main]'), list = $('[data-list]');
    var k = 1.15;
    sheet.style.setProperty('--k', k);
    while (k > 0.6 && list.scrollHeight > main.clientHeight - 16) {
      k = Math.round((k - 0.02) * 100) / 100;
      sheet.style.setProperty('--k', k);
    }
  }

  /* Zoom d'affichage : la feuille s'adapte à la largeur de l'écran */
  var stage = $('[data-stage]');
  var box = d.createElement('div');
  box.className = 'stage__box';
  stage.insertBefore(box, sheet);
  box.appendChild(sheet);
  function zoom() {
    if (root.classList.contains('is-bare')) { root.style.setProperty('--s', 1); return; }
    var avail = Math.min(stage.clientWidth - 32, 900);
    root.style.setProperty('--s', Math.min(1, avail / 794));
  }
  zoom();
  window.addEventListener('resize', zoom, { passive: true });

  /* Liens */
  var pdf = $('[data-pdf]');
  function noPdf() { pdf.href = '?imprimer'; pdf.removeAttribute('download'); pdf.querySelector('span').textContent = 'Enregistrer en PDF'; pdf.addEventListener('click', function (e) { e.preventDefault(); window.print(); }); }
  if (pdf) {
    if (location.protocol === 'file:') noPdf();
    else fetch(pdf.getAttribute('href'), { method: 'HEAD', cache: 'no-store' }).then(function (r) { if (!r.ok) noPdf(); }).catch(noPdf);
  }
  var pr = $('[data-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });

  var ready = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
  ready.then(function () {
    fit();
    root.setAttribute('data-ready', 'ok');
    if (root.classList.contains('is-print-auto')) setTimeout(function () { window.print(); }, 300);
  });
})();
