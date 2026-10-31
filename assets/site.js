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

  /* ---------- Carte : sélecteur de taille + liste ---------- */
  var seg = $('[data-sizes]');
  var list = $('[data-pizzas]');
  var thumb = seg && $('.seg__thumb', seg);
  var current = Math.min(1, tailles.length - 1); // « Big » par défaut quand il existe
  try { var saved = parseInt(localStorage.getItem('pz-taille'), 10); if (saved >= 0 && saved < tailles.length) current = saved; } catch (e) {}
  if (current < 0) current = 0;

  if (seg) {
    if (tailles.length < 2) seg.hidden = true;
    tailles.forEach(function (t, i) {
      var opt = document.createElement('div');
      opt.className = 'seg__opt';
      opt.innerHTML = '<input type="radio" name="taille" id="taille-' + i + '" value="' + i + '"' + (i === current ? ' checked' : '') + '>' +
        '<label for="taille-' + i + '"><b>' + PZ.esc(t.taille || t.nom) + '</b>' + (t.taille ? '<small>' + PZ.esc(t.nom) + '</small>' : '') + '</label>';
      seg.appendChild(opt);
    });
    seg.addEventListener('change', function (e) {
      if (e.target.name !== 'taille') return;
      current = +e.target.value;
      try { localStorage.setItem('pz-taille', current); } catch (err) {}
      moveThumb(true);
      updatePrices(true);
    });
  }

  function moveThumb(animate) {
    if (!thumb) return;
    var input = $('input[value="' + current + '"]', seg);
    if (!input) return;
    var label = input.nextElementSibling;
    if (!animate) thumb.style.transition = 'none';
    thumb.style.setProperty('--w', label.offsetWidth + 'px');
    thumb.style.setProperty('--x', (label.parentNode.offsetLeft - 5) + 'px');
    if (!animate) { void thumb.offsetWidth; thumb.style.transition = ''; }
  }

  if (list) {
    list.innerHTML = pizzas.map(function (p, i) {
      return '<li class="pizza reveal" style="--i:' + (i % 2) + '">' +
        '<h2 class="pizza__name">' + PZ.esc(p.nom) + (p.badge ? ' <span class="pizza__badge">' + PZ.esc(p.badge) + '</span>' : '') + '</h2>' +
        '<span class="pizza__price" data-i="' + i + '"></span>' +
        (p.ingredients ? '<p class="pizza__ing">' + PZ.esc(p.ingredients) + '</p>' : '') +
        '</li>';
    }).join('');
  }

  function updatePrices(animate) {
    if (!list) return;
    var t = tailles[current] || {};
    $$('.pizza__price', list).forEach(function (el, k) {
      var p = pizzas[+el.getAttribute('data-i')];
      var v = PZ.prix((p.prix || [])[current]);
      el.textContent = v;
      el.setAttribute('aria-label', v + ' en taille ' + (t.nom || '') + (t.taille ? ' ' + t.taille : ''));
      if (animate && !reduce) {
        el.classList.remove('swap');
        void el.offsetWidth;
        el.style.animationDelay = Math.min(k, 12) * 18 + 'ms';
        el.classList.add('swap');
      }
    });
  }
  updatePrices(false);
  if (seg) {
    requestAnimationFrame(function () { moveThumb(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveThumb(false); });
    window.addEventListener('resize', function () { moveThumb(false); }, { passive: true });
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

  function setupUi() {
    /* En-tête : ombre au défilement */
    var hdr = $('.hdr');
    var onScroll = function () { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Apparition au défilement */
    var reveals = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) reveals.forEach(function (el) { el.classList.add('is-in'); });
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
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
