/* Piazzetta — comportement des pages. Le contenu vient de infos.js et carte.js. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var PZ = window.PZ;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function bind(key, val) { $$('[data-bind="' + key + '"]').forEach(function (el) { el.textContent = val; }); }
  function lower1(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  /* Typographie française : pas de mot court ni de ponctuation isolés en fin de ligne */
  function fr(s) {
    return String(s)
      .replace(/(^|\s)(à|a|ou|et|de|du|le|la|les|un|une|en|au|aux|sur|ce|ne)\s+/gi, '$1$2\u00A0')
      .replace(/\s+([?!:;»])/g, '\u202F$1')
      .replace(/(«)\s+/g, '$1\u202F');
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  if (!PZ || !window.CARTE || !window.INFOS) { setupUi(); return; }
  var erreurs = PZ.validerCarte(window.CARTE).concat(PZ.validerInfos(window.INFOS));
  if (erreurs.length && window.console) console.warn(erreurs.join('\n'));

  var D = PZ.donnees(window);
  var pizzas = PZ.pizzasVisibles(D);
  var tailles = D.tailles || [];

  /* ---------- Textes simples ---------- */
  ['titre', 'introduction', 'histoireTitre'].forEach(function (k) {
    if (typeof D[k] === 'string') bind(k, fr(D[k]));
  });
  if (typeof D.photosTitre === 'string') bind('photosTitre', fr(D.photosTitre));
  ['histoireSignature', 'adresse', 'ville', 'zoneLivraison', 'mention'].forEach(function (k) {
    if (typeof D[k] === 'string') bind(k, D[k]);
  });

  var tel = D.telephone || '';
  bind('telephone', tel);
  $$('[data-tel]').forEach(function (a) {
    a.href = PZ.telLink(tel);
    if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', 'Appeler le ' + tel);
  });
  if (D.lienGoogle) $$('[data-google]').forEach(function (a) { a.href = D.lienGoogle; });

  /* Le petit mot de la maison : un paragraphe par ligne de la liste */
  var histoire = $('[data-histoire]');
  if (histoire && D.histoire) {
    var paras = Array.isArray(D.histoire) ? D.histoire : [D.histoire];
    histoire.innerHTML = paras.filter(Boolean).map(function (p) { return '<p>' + PZ.esc(fr(p)) + '</p>'; }).join('');
  }
  var story = $('#maison');
  if (story && !D.histoire && !D.histoireTitre) story.hidden = true;

  /* Horaires résumés */
  var jours = PZ.resumeJours(D), heures = PZ.resumeHeures(D), ouv = PZ.premiereOuverture(D);
  if (jours) bind('resumeJours', jours);
  if (heures) { bind('resumeHeures', heures); bind('resumeHeuresMin', lower1(heures)); }
  if (D.zoneLivraison && jours) {
    bind('accroche', 'À ' + D.zoneLivraison + ', ' + lower1(jours) + (ouv ? ' dès ' + ouv : '') + '.');
  }

  /* Titre et sous-titre de la carte */
  var n = pizzas.length;
  bind('titreCarte', n + ' pizza' + (n > 1 ? 's' : '') + ' artisanale' + (n > 1 ? 's' : '') + ', ' + tailles.length + ' taille' + (tailles.length > 1 ? 's' : '') + '.');
  var fp = PZ.fourchettePrix(D);
  var lt = tailles.map(function (t) { return t.nom + (t.taille ? ' ' + t.taille : ''); });
  var tl = lt.length > 1 ? lt.slice(0, -1).join(', ') + ' ou ' + lt[lt.length - 1] : (lt[0] || '');
  bind('sousTitreCarte', tl + (fp ? (fp.min === fp.max ? ', ' + PZ.prix(fp.min) : ', de ' + PZ.prix(fp.min) + ' à ' + PZ.prix(fp.max)) : '') + '.');

  /* ---------- Bandeau d'annonce ---------- */
  var annonce = $('[data-annonce]');
  var msg = (D.annonce && String(D.annonce).trim()) || PZ.messageFermeture(D);
  if (annonce && msg) {
    $('[data-annonce-text]', annonce).textContent = msg;
    annonce.hidden = false;
  }

  /* ---------- Horaires et statut en direct ---------- */
  var hoursEl = $('[data-hours]');
  function renderHours() {
    if (!hoursEl) return;
    var now = PZ.maintenantParis();
    var f = PZ.fermeture(D);
    var conges = f && PZ.estFerme(D, now);
    hoursEl.innerHTML = PZ.JOURS.map(function (j) {
      var today = PZ.JS_DAY[j] === now.getDay();
      var txt = PZ.creneauxTexte(D.horaires[j]);
      if (today && conges) txt = 'Fermé';
      var closed = txt === 'Fermé';
      return '<li class="' + (closed ? 'is-closed' : '') + (today ? ' is-today' : '') + '">' +
        '<span class="day">' + PZ.cap(j) + (today ? '<span class="today-tag">Aujourd’hui</span>' : '') + '</span>' +
        '<span class="time">' + PZ.esc(txt) + '</span></li>';
    }).join('') + (f && msg && !D.annonce ? '<li class="hours__note">' + PZ.esc(msg) + '</li>' : '');
  }
  var pill = $('[data-status]');
  function renderStatus() {
    if (!pill) return;
    var s = PZ.statut(D);
    pill.classList.toggle('is-open', s.ouvert);
    $('[data-status-text]', pill).textContent = s.texte;
  }
  renderHours();
  renderStatus();
  setInterval(function () { renderStatus(); renderHours(); }, 60000);

  /* ---------- Photos (dossier photos/, préparées à la publication) ---------- */
  var photosSec = $('[data-photos]');
  if (photosSec && 'fetch' in window && location.protocol !== 'file:') {
    fetch('assets/photos.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (photos) { if (Array.isArray(photos) && photos.length) renderPhotos(photosSec, photos); })
      .catch(function () {});
  }

  function renderPhotos(sec, photos) {
    var ul = $('[data-gallery]', sec);
    ul.setAttribute('data-count', Math.min(photos.length, 6));
    ul.innerHTML = photos.map(function (p, i) {
      var alt = p.legende ? p.legende + ', pizza de la Piazzetta' : 'Pizza de la Piazzetta';
      return '<li class="ph reveal" style="--i:' + (i % 5) + '">' +
        '<button type="button" class="ph__btn" data-ph="' + i + '" aria-label="Agrandir la photo' + (p.legende ? ' : ' + PZ.esc(p.legende) : '') + '">' +
        '<img src="' + PZ.esc(p.src) + '" srcset="' + PZ.esc(p.srcset) + '" sizes="(max-width: 760px) 80vw, (max-width: 1200px) 50vw, 600px" width="' + p.largeur + '" height="' + p.hauteur + '" alt="' + PZ.esc(alt) + '" loading="lazy" decoding="async">' +
        '</button></li>';
    }).join('');
    sec.hidden = false;
    $$('[data-photos-link]').forEach(function (el) { el.hidden = false; });
    observeReveals($$('.reveal', ul));
    setupLightbox(photos, ul);
  }

  function setupLightbox(photos, ul) {
    var dlg = $('[data-lightbox]');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var img = $('[data-lb-img]', dlg), count = $('[data-lb-count]', dlg);
    var idx = 0, startX = null, opener = null;
    function show(i, dir) {
      idx = (i + photos.length) % photos.length;
      var p = photos[idx];
      img.classList.remove('lb-in', 'lb-in-l', 'lb-in-r');
      void img.offsetWidth;
      img.src = p.grande; img.removeAttribute('srcset');
      img.alt = p.legende ? p.legende + ', pizza de la Piazzetta' : 'Pizza de la Piazzetta';
      img.classList.add(dir > 0 ? 'lb-in-r' : dir < 0 ? 'lb-in-l' : 'lb-in');
      count.textContent = photos.length > 1 ? (idx + 1) + ' / ' + photos.length : '';
      dlg.classList.toggle('is-single', photos.length < 2);
    }
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ph]');
      if (!b) return;
      opener = b;
      show(+b.getAttribute('data-ph'), 0);
      dlg.showModal();
      document.documentElement.classList.add('lb-open');
    });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(idx - 1, -1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(idx + 1, 1); });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); if (opener) opener.focus(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, -1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, 1); }
    });
    dlg.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    dlg.addEventListener('pointerup', function (e) {
      if (startX == null || photos.length < 2) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
  }

  /* ---------- Lien PDF : repli vers l'impression si le PDF n'existe pas ---------- */
  $$('[data-pdf]').forEach(function (pdf) {
    var fallback = function () { pdf.href = 'carte.html?imprimer'; pdf.removeAttribute('download'); };
    if (location.protocol === 'file:') fallback();
    else fetch(pdf.getAttribute('href'), { method: 'HEAD', cache: 'no-store' }).then(function (r) { if (!r.ok) fallback(); }).catch(fallback);
  });

  /* ---------- Données structurées (référencement Google) ---------- */
  try {
    var dayMap = { lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday' };
    var pad = function (m) { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var spec = [];
    PZ.JOURS.forEach(function (j) {
      PZ.parseCreneaux(D.horaires[j]).filter(Boolean).forEach(function (r) {
        spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[j], opens: pad(r[0]), closes: pad(r[1]) });
      });
    });
    var cp = (D.ville || '').match(/^(\d{5})\s+(.*)$/);
    var ld = {
      '@context': 'https://schema.org', '@type': 'Restaurant',
      name: 'Piazzetta La Destrousse', servesCuisine: 'Pizza',
      telephone: PZ.telLink(tel).replace('tel:', ''),
      url: new URL('./', location.href).href,
      image: new URL('assets/og-image.jpg', location.href).href,
      address: { '@type': 'PostalAddress', streetAddress: D.adresse, postalCode: cp ? cp[1] : undefined, addressLocality: cp ? cp[2] : D.ville, addressCountry: 'FR' },
      openingHoursSpecification: spec,
      hasMenu: new URL('carte.html', location.href).href
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  } catch (e) {}

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
      window.matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
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

    /* Barre du bas (mobile) : apparaît une fois les boutons principaux dépassés */
    var callbar = $('[data-callbar]');
    var anchor = $('[data-callbar-anchor]');
    var footer = $('.ftr');
    if (callbar && anchor && 'IntersectionObserver' in window) {
      var anchorVisible = true, footerVisible = false;
      var upd = function () { callbar.classList.toggle('is-visible', !anchorVisible && !footerVisible); };
      new IntersectionObserver(function (e) { anchorVisible = e[0].isIntersecting || e[0].boundingClientRect.top > 0; upd(); }).observe(anchor);
      if (footer) new IntersectionObserver(function (e) { footerVisible = e[0].isIntersecting; upd(); }).observe(footer);
    } else if (callbar) {
      callbar.classList.add('is-visible');
    }
  }
})();
