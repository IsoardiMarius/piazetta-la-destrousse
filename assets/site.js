/* Piazzetta — comportement des pages.
   Le contenu vient du dossier contenu/ (via donnees.js). À la publication, les pages sont déjà
   pré-remplies (scripts/precalculer.mjs) ; ce script ne fait que les mettre à jour
   (statut d'ouverture, jour en cours) et gérer les interactions. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js', 'site-ok');

  var PZ = window.PZ;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function bind(key, val) { $$('[data-bind="' + key + '"]').forEach(function (el) { if (el.textContent !== val) el.textContent = val; }); }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Images : apparition en fondu une fois chargées (l'aperçu flou ou le fond disparaît) */
  function fadeImages(root) {
    $$('img[data-fade]', root).forEach(function (img) {
      var done = function () {
        img.classList.add('is-loaded');
        var box = img.closest('[data-sk]');
        if (box) box.classList.add('is-loaded');
      };
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }
  fadeImages(document);
  setupPhotos();

  if (!PZ || !window.CARTE || !window.INFOS) { setupUi(); return; }
  var v = PZ.valider(window.CARTE, window.INFOS), erreurs = v.erreurs.concat(v.avertissements);
  if (erreurs.length && window.console) console.warn(erreurs.join('\n'));

  var D = PZ.donnees(window);

  /* Couleurs choisies dans Pages CMS (déjà en place sur le site publié) */
  (function () {
    var css = PZ.cssCouleurs(D);
    if (css && !document.getElementById('couleurs')) {
      var st = document.createElement('style'); st.id = 'couleurs'; st.textContent = css; document.head.appendChild(st);
    }
  })();

  /* ---------- Textes (déjà en place sur le site publié ; utile en local) ---------- */
  var T = PZ.textes(D);
  Object.keys(T).forEach(function (k) { bind(k, T[k]); });
  /* Attributs reliés au contenu (texte d'une image, nom lu par les lecteurs d'écran) */
  $$('[data-bind-alt]').forEach(function (el) { var v = T[el.getAttribute('data-bind-alt')]; if (v !== undefined) el.alt = v; });
  $$('[data-bind-aria]').forEach(function (el) { var v = T[el.getAttribute('data-bind-aria')]; if (v !== undefined) el.setAttribute('aria-label', v); });
  /* Résumé des heures (petit tableau quand les horaires varient d'un jour à l'autre) */
  var hResume = PZ.htmlResumeHeures(D);
  $$('[data-resume-heures]').forEach(function (el) { if (el.innerHTML !== hResume) el.innerHTML = hResume; });
  /* « La maison » : masquée (avec ses liens du menu) s'il n'y a aucun paragraphe */
  var histoire = $('[data-histoire]'), hHistoire = PZ.htmlHistoire(D);
  if (histoire && histoire.innerHTML !== hHistoire) histoire.innerHTML = hHistoire;
  $$('[data-maison], [data-maison-link]').forEach(function (el) { el.hidden = !hHistoire; });

  $$('[data-tel]').forEach(function (a) {
    a.href = PZ.telLink(D.telephone);
    if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', 'Appeler le ' + D.telephone);
  });
  /* E-mail : liens et blocs affichés seulement si l'adresse est renseignée */
  var email = PZ.emailValide(D);
  $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + email; });
  $$('[data-email-bloc]').forEach(function (el) { el.hidden = !email; });
  var G = PZ.liensGoogle(D);
  $$('[data-google]').forEach(function (a) { a.href = G[a.getAttribute('data-google')] || G.fiche; });
  /* Liens Uber Eats / Facebook de l'en-tête et du menu : affichés seulement s'ils sont renseignés */
  var R = D.reseaux || {};
  $$('[data-reseau]').forEach(function (a) {
    var url = R[a.getAttribute('data-reseau')];
    var item = a.closest('[data-reseau-item]') || a;
    if (/^https?:\/\//.test(url || '')) { a.href = url; item.hidden = false; } else item.hidden = true;
  });
  var heroRes = $('[data-hero-reseaux]');
  if (heroRes) { var hh = PZ.htmlLiensHero(D); if (heroRes.innerHTML !== hh) heroRes.innerHTML = hh; heroRes.hidden = !hh; }
  var res = $('[data-reseaux]');
  if (res) { var hr = PZ.htmlReseaux(D); if (res.innerHTML !== hr) res.innerHTML = hr; res.hidden = !hr; }

  /* ---------- Bandeau d'annonce (calculé chaque jour) : la fermeture exceptionnelle à venir passe
     toujours en premier, suivie de l'annonce saisie dans Pages CMS s'il y en a une ---------- */
  var annonce = $('[data-annonce]');
  var msgFermeture = PZ.messageFermeture(D);
  var msg = [msgFermeture, (D.annonce && String(D.annonce).trim()) || ''].filter(Boolean).join(' ');
  if (annonce) {
    if (msg) $('[data-annonce-text]', annonce).textContent = msg;
    annonce.hidden = !msg;
  }

  /* ---------- Horaires (jour en cours) et statut en direct ---------- */
  var hoursEl = $('[data-hours]');
  var note = msgFermeture;
  function renderHours() { if (hoursEl) hoursEl.innerHTML = PZ.htmlHoraires(D, PZ.maintenantParis(), note); }
  var pill = $('[data-status]');
  function renderStatus() {
    if (!pill) return;
    var st = PZ.statut(D);
    pill.classList.toggle('is-open', st.ouvert);
    $('[data-status-text]', pill).textContent = st.texte;
  }
  renderHours();
  renderStatus();
  setInterval(function () { renderStatus(); renderHours(); }, 60000);

  /* ---------- Lien PDF : repli vers l'impression si le PDF n'existe pas ---------- */
  $$('[data-pdf]').forEach(function (pdf) {
    var fallback = function () { pdf.href = 'carte.html?imprimer'; pdf.removeAttribute('download'); };
    if (location.protocol === 'file:') fallback();
    else fetch(pdf.getAttribute('href'), { method: 'HEAD', cache: 'no-store' }).then(function (r) { if (!r.ok) fallback(); }).catch(fallback);
  });

  /* ---------- Photos : déjà dans la page publiée ; sinon chargées depuis photos.json ---------- */
  function setupPhotos() {
    var sec = $('[data-photos]');
    if (!sec) return;
    var ul = $('[data-gallery]', sec);
    if (ul.children.length) { photosReady(sec, ul); return; }
    if (!('fetch' in window) || location.protocol === 'file:' || !window.PZ) return;
    fetch('assets/photos.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (photos) {
        if (!Array.isArray(photos) || !photos.length) return;
        ul.setAttribute('data-count', Math.min(photos.length, 6));
        ul.innerHTML = window.PZ.htmlGalerie(photos, D);
        photosReady(sec, ul);
        observeReveals($$('.reveal', ul));
      })
      .catch(function () {});
  }

  function photosReady(sec, ul) {
    sec.hidden = false;
    $$('[data-photos-link]').forEach(function (el) { el.hidden = false; });
    fadeImages(ul);
    setupLightbox(ul);
    setupDefilement(ul);
  }

  /* Carrousel des photos : flèches (ordinateur) affichées seulement s'il y a de quoi faire défiler ;
     chaque clic avance d'une « page » de photos */
  function setupDefilement(ul) {
    var nav = $('[data-gal-nav]');
    if (!nav) return;
    var prev = $('[data-gal-prev]', nav), next = $('[data-gal-next]', nav);
    var maj = function () {
      var defile = ul.scrollWidth > ul.clientWidth + 4;
      nav.hidden = !defile;
      prev.disabled = ul.scrollLeft <= 4;
      next.disabled = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 4;
    };
    var avancer = function (sens) {
      var tuile = $('.ph', ul);
      var largeur = tuile ? tuile.getBoundingClientRect().width + (parseFloat(getComputedStyle(ul).columnGap) || 0) : ul.clientWidth;
      var parPage = Math.max(1, Math.floor((ul.clientWidth + 1) / largeur));
      ul.scrollBy({ left: sens * parPage * largeur, behavior: reduce ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { avancer(-1); });
    next.addEventListener('click', function () { avancer(1); });
    ul.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
    maj();
  }

  function setupLightbox(ul) {
    var dlg = $('[data-lightbox]');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var btns = $$('[data-ph]', ul);
    var img = $('[data-lb-img]', dlg), count = $('[data-lb-count]', dlg), cap = $('[data-lb-cap]', dlg);
    var idx = 0, startX = null, opener = null;
    function show(i, dir) {
      idx = (i + btns.length) % btns.length;
      var b = btns[idx];
      var anim = dir > 0 ? 'lb-in-r' : dir < 0 ? 'lb-in-l' : 'lb-in';
      img.classList.remove('lb-in', 'lb-in-l', 'lb-in-r');
      img.onload = img.onerror = null;
      /* Pendant le chargement de la grande photo : le dessin d'attente ; puis la photo arrive */
      var go = function () {
        img.onload = img.onerror = null;
        dlg.classList.remove('is-loading');
        void img.offsetWidth;
        img.classList.add(anim);
      };
      dlg.classList.add('is-loading');
      img.src = b.getAttribute('data-grande');
      img.alt = $('img', b).alt;
      if (img.complete && img.naturalWidth) go();
      else { img.onload = go; img.onerror = go; }
      count.textContent = btns.length > 1 ? (idx + 1) + ' / ' + btns.length : '';
      /* Légende facultative de la photo, reprise sous la grande photo */
      var leg = $('.ph__leg', b);
      if (cap) { cap.textContent = leg ? leg.textContent : ''; cap.hidden = !leg; }
      dlg.classList.toggle('is-single', btns.length < 2);
    }
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ph]');
      if (!b) return;
      opener = b;
      show(btns.indexOf(b), 0);
      dlg.showModal();
      doc.classList.add('lb-open');
    });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(idx - 1, -1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(idx + 1, 1); });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { doc.classList.remove('lb-open'); if (opener) opener.focus(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, -1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, 1); }
    });
    dlg.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    dlg.addEventListener('pointerup', function (e) {
      if (startX == null || btns.length < 2) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
  }

  setupUi();

  function observeReveals(els) {
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    if (!observeReveals.io) {
      observeReveals.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); observeReveals.io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach(function (el) { observeReveals.io.observe(el); });
  }

  function setupUi() {
    /* En-tête : ombre au défilement */
    var hdr = $('.hdr');
    var onScroll = function () { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Apparition au défilement */
    observeReveals($$('.reveal'));

    /* Menu mobile */
    var toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
    if (toggle && menu) {
      var closeTimer;
      var setMenu = function (open) {
        clearTimeout(closeTimer);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        doc.classList.toggle('menu-ouvert', open);
        if (open) {
          menu.hidden = false;
          requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
        } else {
          menu.classList.remove('is-open');
          closeTimer = setTimeout(function () { menu.hidden = true; }, reduce ? 0 : 450);
        }
      };
      toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
      menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.hdr')) setMenu(false);
      });
      window.matchMedia('(min-width: 1041px)').addEventListener('change', function (m) { if (m.matches && !hdr.classList.contains('hdr--serre')) setMenu(false); });
    }

    /* Barre complète ou menu à bouton : on mesure plutôt que de deviner, car la place
       nécessaire dépend du contenu (nombre de réseaux renseignés, longueur des libellés). */
    var hdrIn = $('.hdr__in'), nomBarre = $('.brand span');
    if (hdr && hdrIn) {
      var ajusterEntete = function () {
        var etait = hdr.classList.contains('hdr--serre');
        hdr.classList.remove('hdr--serre');
        /* Liens qui débordent, ou nom de l'établissement raccourci par manque de place */
        var serre = hdrIn.scrollWidth > hdrIn.clientWidth + 1 || (!!nomBarre && nomBarre.scrollWidth > nomBarre.clientWidth + 1);
        hdr.classList.toggle('hdr--serre', serre);
        if (etait && !serre && toggle && toggle.getAttribute('aria-expanded') === 'true' &&
            window.matchMedia('(min-width: 1041px)').matches) setMenu(false);
      };
      ajusterEntete();
      var resizeTimer;
      window.addEventListener('resize', function () { cancelAnimationFrame(resizeTimer); resizeTimer = requestAnimationFrame(ajusterEntete); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusterEntete);
    }

    /* Lien actif dans la navigation */
    var links = $$('.navlink[href^="#"]');
    if (links.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', e.isIntersecting ? 'true' : 'false');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) spy.observe(el); });
    }
  }
})();
