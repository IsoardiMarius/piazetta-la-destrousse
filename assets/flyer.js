/* Flyer à imprimer : construit à partir du contenu (dossier contenu/, via donnees.js).
   Sur le site publié, il est déjà en place (pré-rempli à la publication) : ce script ne fait
   alors que les boutons et la vérification que tout tient sur le format. */
(function () {
  'use strict';
  var PZ = window.PZ, d = document, root = d.documentElement;
  if (!PZ || !window.CARTE || !window.INFOS) { root.setAttribute('data-ready', 'error'); return; }
  var D = PZ.donnees(window);

  /* Couleurs choisies dans Pages CMS (déjà en place sur le site publié) */
  var css = PZ.cssCouleurs(D);
  if (css && !d.getElementById('couleurs')) {
    var st = d.createElement('style'); st.id = 'couleurs'; st.textContent = css; d.head.appendChild(st);
  }

  /* Contenu (utile en local, avant publication) */
  var fl = d.querySelector('[data-flyer]');
  if (!fl.children.length) {
    fl.innerHTML = PZ.htmlFlyer(D, { photo: 'assets/flyer-photo.jpg', qr: 'assets/qr-carte.svg', site: location.host });
    /* Photo ou QR code pas encore préparés (ils le sont à la publication) */
    var ph = fl.querySelector('.fl-photo'), qr = fl.querySelector('.fl-qr img');
    if (ph) ph.addEventListener('error', function () { ph.src = 'assets/logo-720.webp'; ph.classList.add('fl-photo--logo'); }, { once: true });
    if (qr) qr.addEventListener('error', function () { qr.parentNode.hidden = true; }, { once: true });
  }

  /* Boutons : PDF (impression si le PDF n'existe pas encore, en local) et impression */
  var pdf = d.querySelector('[data-pdf]');
  function sansPdf() {
    pdf.removeAttribute('download');
    pdf.addEventListener('click', function (e) { e.preventDefault(); window.print(); });
  }
  if (pdf) {
    if (location.protocol === 'file:') { if (!root.classList.contains('is-pdf')) sansPdf(); }
    else fetch(pdf.getAttribute('href'), { method: 'HEAD', cache: 'no-store' }).then(function (r) { if (!r.ok) sansPdf(); }).catch(sansPdf);
  }
  var pr = d.querySelector('[data-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });

  /* Une fois polices et images prêtes : le texte tient-il sur le flyer ? (signalé à la publication sinon) */
  var polices = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  var images = Array.prototype.map.call(fl.querySelectorAll('img'), function (i) { return i.decode ? i.decode().catch(function () {}) : null; });
  var haut = fl.querySelector('.fl-haut');
  function deborde() { return fl.scrollHeight > fl.clientHeight + 1 || (!!haut && haut.scrollHeight > haut.clientHeight + 1); }
  /* La photo rétrécit d'abord (CSS) ; si ça ne suffit pas, les textes réduisent un peu (jusqu'à 80 %) */
  function ajuster() {
    var k = 1;
    fl.style.setProperty('--k', k);
    while (deborde() && k > 0.8) { k = Math.round((k - 0.04) * 100) / 100; fl.style.setProperty('--k', k); }
    if (deborde()) root.setAttribute('data-trop-long', ''); else root.removeAttribute('data-trop-long');
  }
  Promise.all([polices].concat(images)).then(function () {
    ajuster();
    root.setAttribute('data-ready', 'ok');  /* (mêmes proportions à l'impression : le réglage reste valable) */
  });
})();
