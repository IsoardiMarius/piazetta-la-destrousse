/* Carte A4 : construite à partir du contenu (dossier contenu/, via donnees.js), ajustée pour tenir sur une page. */
(function () {
  'use strict';
  var PZ = window.PZ, d = document, root = d.documentElement;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function bind(k, v) { $$('[data-bind="' + k + '"]').forEach(function (el) { el.textContent = v; }); }

  if (!PZ || !window.CARTE || !window.INFOS) { root.setAttribute('data-ready', 'error'); return; }
  var C = PZ.donnees(window);
  var v = PZ.valider(window.CARTE, window.INFOS), erreurs = v.erreurs.concat(v.avertissements);
  if (erreurs.length) console.warn('[contenu] ' + erreurs.join('\n'));

  var sheet = $('[data-sheet="1"]'), sheet2 = $('[data-sheet="2"]');
  sheet.style.setProperty('--cols', (C.tailles || []).length);

  /* Contenu (déjà en place sur le site publié ; utile en local) */
  var head = $('[data-head]'), rows = $('[data-rows]');
  var hHead = PZ.htmlEnteteTailles(C), hRows = PZ.htmlLignesCarte(C);
  if (head.innerHTML !== hHead) head.innerHTML = hHead;
  if (rows.innerHTML !== hRows) rows.innerHTML = hRows;
  var T = PZ.textes(C);
  Object.keys(T).forEach(function (k) { bind(k, T[k]); });
  /* Attributs reliés au contenu (texte d'une image, nom lu par les lecteurs d'écran) */
  $$('[data-bind-alt]').forEach(function (el) { var v = T[el.getAttribute('data-bind-alt')]; if (v !== undefined) el.alt = v; });
  $$('[data-bind-aria]').forEach(function (el) { var v = T[el.getAttribute('data-bind-aria')]; if (v !== undefined) el.setAttribute('aria-label', v); });
  var email = PZ.emailValide(C);
  $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + email; });
  $$('[data-email-bloc]').forEach(function (el) { el.hidden = !email; });
  var hResume = PZ.htmlResumeHeures(C, true);
  $$('[data-resume-heures-court]').forEach(function (el) { if (el.innerHTML !== hResume) el.innerHTML = hResume; });

  /* Page 2 (boissons, desserts…) : seulement s'il y a au moins un article à afficher */
  var rub = $('[data-rubriques]'), hRub = PZ.htmlRubriques(C), avecPage2 = !!hRub && !!sheet2;
  if (rub && rub.innerHTML !== hRub) rub.innerHTML = hRub;
  $$('[data-page2], [data-suite]').forEach(function (el) { el.hidden = !avecPage2; });
  root.classList.toggle('has-page2', avecPage2);

  /* Ajuste la taille du texte pour que tout tienne sur la page A4 ; renvoie false si ça déborde quand même */
  function fit(feuille, kMax) {
    var main = $('[data-main]', feuille), list = $('[data-list]', feuille);
    /* Hauteur disponible pour la liste : la zone centrale, sans ses marges intérieures */
    var place = function () {
      var cs = getComputedStyle(main);
      return main.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    };
    var k = kMax;
    feuille.style.setProperty('--k', k);
    while (k > 0.6 && list.scrollHeight > place()) {
      k = Math.round((k - 0.02) * 100) / 100;
      feuille.style.setProperty('--k', k);
    }
    return list.scrollHeight <= place() + 1;
  }
  function fitTout() {
    var trop = [];
    if (!fit(sheet, 1.15)) trop.push(1);
    if (avecPage2 && !fit(sheet2, 1.3)) trop.push(2);
    /* Même au plus petit, une page déborde : signalé à la publication (numéros des pages) */
    if (trop.length) root.setAttribute('data-trop-long', trop.join(','));
    else root.removeAttribute('data-trop-long');
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
    fitTout();
    root.setAttribute('data-ready', 'ok');
    if (root.classList.contains('is-print-auto')) setTimeout(function () { window.print(); }, 300);
  });
})();
