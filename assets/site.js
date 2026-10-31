/* Piazzetta — comportement du site. Les contenus viennent de carte.js. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var C = window.CARTE;
  var PZ = window.PZ;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function bind(key, val) { $$('[data-bind="' + key + '"]').forEach(function (el) { el.textContent = val; }); }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  if (!C || !PZ) { revealAll(); return; }
  var erreurs = PZ.valider(C);
  if (erreurs.length && window.console) console.warn('[carte.js] ' + erreurs.join('\n'));

  var pizzas = PZ.pizzasVisibles(C);
  var tailles = C.tailles || [];

  /* ---------- Textes ---------- */
  var tel = C.telephone || '';
  bind('telephone', tel);
  $$('[data-tel]').forEach(function (a) {
    a.href = PZ.telLink(tel);
    if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', 'Appeler le ' + tel);
  });
  if (C.lienGoogle) $$('[data-google]').forEach(function (a) { a.href = C.lienGoogle; });
  if (C.adresse) bind('adresse', C.adresse);
  if (C.ville) bind('ville', C.ville);
  if (C.zoneLivraison) bind('zoneLivraison', C.zoneLivraison);
  bind('mention', C.mention || '');
  bind('nbTailles', tailles.length);

  var jours = PZ.resumeJours(C), heures = PZ.resumeHeures(C);
  if (jours) bind('resumeJours', jours);
  if (heures) bind('resumeHeures', heures);
  var premierCreneau = (PZ.groupesHoraires(C)[0] || {}).creneaux;
  var ouverture = premierCreneau ? PZ.heure((PZ.parseCreneaux(premierCreneau)[0] || [0])[0]) : '';
  var zone = C.zoneLivraison ? 'À ' + C.zoneLivraison : '';
  if (zone && jours) {
    bind('accroche', zone + ', ' + jours.charAt(0).toLowerCase() + jours.slice(1) + (ouverture && PZ.groupesHoraires(C).length === 1 ? ' dès ' + ouverture : '') + '.');
  }

  var n = pizzas.length;
  bind('titreCarte', n + ' pizza' + (n > 1 ? 's' : '') + ' artisanale' + (n > 1 ? 's' : '') + ', ' + tailles.length + ' taille' + (tailles.length > 1 ? 's' : '') + '.');
  var fp = PZ.fourchettePrix(C);
  var listeTailles = tailles.map(function (t) { return t.nom + (t.taille ? ' ' + t.taille : ''); });
  var tl = listeTailles.length > 1 ? listeTailles.slice(0, -1).join(', ') + ' ou ' + listeTailles[listeTailles.length - 1] : listeTailles[0] || '';
  bind('sousTitreCarte', tl + (fp ? (fp.min === fp.max ? ', ' + PZ.prix(fp.min) : ', de ' + PZ.prix(fp.min) + ' à ' + PZ.prix(fp.max)) : '') + '.');

  /* ---------- Sélecteur de taille ---------- */
  var seg = $('[data-sizes]');
  var thumb = seg && $('.seg__thumb', seg);
  var current = Math.min(1, tailles.length - 1); // « Big » par défaut quand il existe
  try { var saved = parseInt(localStorage.getItem('pz-taille'), 10); if (saved >= 0 && saved < tailles.length) current = saved; } catch (e) {}
  if (current < 0) current = 0;

  if (seg) {
    if (tailles.length < 2) seg.hidden = true;
    tailles.forEach(function (t, i) {
      var id = 'taille-' + i;
      var wrap = document.createElement('div');
      wrap.className = 'seg__opt';
      wrap.innerHTML = '<input type="radio" name="taille" id="' + id + '" value="' + i + '"' + (i === current ? ' checked' : '') + '>' +
        '<label for="' + id + '"><b>' + PZ.esc(t.taille || t.nom) + '</b>' + (t.taille ? '<small>' + PZ.esc(t.nom) + '</small>' : '') + '</label>';
      seg.appendChild(wrap);
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

  /* ---------- Liste des pizzas ---------- */
  var list = $('[data-pizzas]');
  if (list) {
    list.innerHTML = pizzas.map(function (p, i) {
      return '<li class="pizza reveal" style="--i:' + (i % 2) + '">' +
        '<h3 class="pizza__name">' + PZ.esc(p.nom) + (p.badge ? ' <span class="pizza__badge">' + PZ.esc(p.badge) + '</span>' : '') + '</h3>' +
        '<span class="pizza__price" data-i="' + i + '"></span>' +
        (p.ingredients ? '<p class="pizza__ing">' + PZ.esc(p.ingredients) + '</p>' : '') +
        '</li>';
    }).join('');
  }

  function updatePrices(animate) {
    var t = tailles[current] || {};
    $$('.pizza__price', list).forEach(function (el, k) {
      var p = pizzas[+el.getAttribute('data-i')];
      el.textContent = PZ.prix((p.prix || [])[current]);
      el.setAttribute('aria-label', PZ.prix((p.prix || [])[current]) + ' en ' + (t.nom || '') + (t.taille ? ' ' + t.taille : ''));
      if (animate && !reduce) {
        el.classList.remove('swap');
        void el.offsetWidth;
        el.style.animationDelay = Math.min(k, 12) * 18 + 'ms';
        el.classList.add('swap');
      }
    });
  }
  updatePrices(false);
  requestAnimationFrame(function () { moveThumb(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveThumb(false); });
  window.addEventListener('resize', function () { moveThumb(false); }, { passive: true });

  /* ---------- Horaires ---------- */
  var hoursEl = $('[data-hours]');
  function renderHours() {
    if (!hoursEl) return;
    var now = PZ.maintenantParis();
    hoursEl.innerHTML = PZ.JOURS.map(function (j) {
      var today = PZ.JS_DAY[j] === now.getDay();
      var txt = PZ.creneauxTexte(C.horaires[j]);
      var closed = txt === 'Fermé';
      return '<li class="' + (closed ? 'is-closed' : '') + (today ? ' is-today' : '') + '">' +
        '<span class="day">' + PZ.cap(j) + (today ? '<span class="today-tag">Aujourd’hui</span>' : '') + '</span>' +
        '<span class="time">' + PZ.esc(txt) + '</span></li>';
    }).join('');
  }

  var pill = $('[data-status]');
  function renderStatus() {
    if (!pill) return;
    var s = PZ.statut(C);
    pill.classList.toggle('is-open', s.ouvert);
    $('[data-status-text]', pill).textContent = s.texte;
  }
  renderHours();
  renderStatus();
  setInterval(function () { renderStatus(); renderHours(); }, 60000);

  /* ---------- Lien PDF : repli vers la page A4 si le PDF n'existe pas encore ---------- */
  var pdf = $('[data-pdf]');
  if (pdf) {
    if (location.protocol === 'file:') fallbackPdf();
    else fetch(pdf.getAttribute('href'), { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { if (!r.ok) fallbackPdf(); })
      .catch(fallbackPdf);
  }
  function fallbackPdf() {
    pdf.href = 'carte.html?imprimer';
    pdf.removeAttribute('download');
  }

  /* ---------- Données structurées (référencement Google) ---------- */
  try {
    var dayMap = { lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday' };
    var pad = function (m) { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var spec = [];
    PZ.JOURS.forEach(function (j) {
      PZ.parseCreneaux(C.horaires[j]).filter(Boolean).forEach(function (r) {
        spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[j], opens: pad(r[0]), closes: pad(r[1]) });
      });
    });
    var cp = (C.ville || '').match(/^(\d{5})\s+(.*)$/);
    var ld = {
      '@context': 'https://schema.org', '@type': 'Restaurant',
      name: 'Piazzetta La Destrousse', servesCuisine: 'Pizza', priceRange: '€',
      telephone: PZ.telLink(tel).replace('tel:', ''),
      url: location.href.split('#')[0],
      image: new URL('assets/og-image.jpg', location.href).href,
      address: { '@type': 'PostalAddress', streetAddress: C.adresse, postalCode: cp ? cp[1] : undefined, addressLocality: cp ? cp[2] : C.ville, addressCountry: 'FR' },
      openingHoursSpecification: spec,
      hasMenu: new URL('carte.html', location.href).href
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  } catch (e) {}

  /* ---------- En-tête au défilement ---------- */
  var hdr = $('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Animations d'apparition ---------- */
  function revealAll() { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }
  if (!('IntersectionObserver' in window) || reduce) revealAll();
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* ---------- Lien actif dans la navigation ---------- */
  if ('IntersectionObserver' in window) {
    var links = $$('.navlink');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var id = e.target.id;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', e.isIntersecting ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['carte', 'infos'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Barre « Appeler » mobile : apparaît une fois le héros dépassé ---------- */
  var callbar = $('[data-callbar]');
  var heroActions = $('.hero .actions');
  var footer = $('.ftr');
  if (callbar && heroActions && 'IntersectionObserver' in window) {
    var heroVisible = true, footerVisible = false;
    var upd = function () { callbar.classList.toggle('is-visible', !heroVisible && !footerVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; upd(); }).observe(heroActions);
    if (footer) new IntersectionObserver(function (e) { footerVisible = e[0].isIntersecting; upd(); }).observe(footer);
  } else if (callbar) {
    callbar.classList.add('is-visible');
  }
})();
