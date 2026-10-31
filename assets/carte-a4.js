/* Carte A4 : construite à partir de carte.js et infos.js, ajustée pour tenir sur une page. */
(function () {
  'use strict';
  var PZ = window.PZ, d = document, root = d.documentElement;
  function $(s) { return d.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(d.querySelectorAll(s)); }
  function bind(k, v) { $$('[data-bind="' + k + '"]').forEach(function (el) { el.textContent = v; }); }

  if (!PZ || !window.CARTE || !window.INFOS) { root.setAttribute('data-ready', 'error'); return; }
  var C = PZ.donnees(window);
  var erreurs = PZ.validerCarte(window.CARTE).concat(PZ.validerInfos(window.INFOS));
  if (erreurs.length) console.warn('[carte.js] ' + erreurs.join('\n'));

  var sheet = $('[data-sheet]');
  sheet.style.setProperty('--cols', (C.tailles || []).length);

  /* Contenu (déjà en place sur le site publié ; utile en local) */
  var head = $('[data-head]'), rows = $('[data-rows]');
  var hHead = PZ.htmlEnteteTailles(C), hRows = PZ.htmlLignesCarte(C);
  if (head.innerHTML !== hHead) head.innerHTML = hHead;
  if (rows.innerHTML !== hRows) rows.innerHTML = hRows;
  var T = PZ.textes(C);
  Object.keys(T).forEach(function (k) { bind(k, T[k]); });

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
  function zoom() {
    if (root.classList.contains('is-bare')) { root.style.setProperty('--s', 1); return; }
    var avail = Math.min(stage.clientWidth - 32, 900);
    root.style.setProperty('--s', Math.min(1, avail / 794));
  }
  zoom();
  window.addEventListener('resize', zoom, { passive: true });

  /* Liens */
  var pdf = $('[data-pdf]');
  function noPdf() { pdf.href = '?imprimer'; pdf.removeAttribute('download'); pdf.addEventListener('click', function (e) { e.preventDefault(); window.print(); }); }
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
