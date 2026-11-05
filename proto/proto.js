/* Dyson prototype – shared routing + entry points.
   Injected as the first script in <head> of every prototype page. */
(function () {
  var base = document.currentScript.src.replace(/proto\/[^\/]*$/, '');
  var PAGES = {
    home:   'Dyson UK _ Main Page.html',
    air:    'Dyson Air Treatment _ Purifiers, Fans, Heaters & Humidifiers.html',
    plp:    'Dyson_PLP.html',
    search: 'Search Results.html',
    hmc:    'Help me choose _ Air treatment.html',
    result: 'Help me choose _ Air treatment_Result.html',
    compare: 'Dyson Compare.html'
  };
  function url(key) { return base + encodeURIComponent(PAGES[key]); }
  function go(key) { location.href = url(key); }

  var file = decodeURIComponent(location.pathname.split('/').pop());
  var current = Object.keys(PAGES).filter(function (k) { return PAGES[k] === file; })[0];

  // live dyson.co.uk URL -> prototype page key (null = not part of the prototype)
  function route(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.origin === location.origin) {
      var f = decodeURIComponent(u.pathname.split('/').pop());
      return Object.keys(PAGES).filter(function (k) { return PAGES[k] === f; })[0] || null;
    }
    if (!/(^|\.)dyson\.co\.uk$/.test(u.hostname)) return null;
    var p = u.pathname.replace(/\/+$/, '').toLowerCase();
    if (p === '' || p === '/en') return 'home';
    if (p === '/air-treatment') return 'air';
    if (p === '/air-treatment/all') return 'plp';
    if (p === '/help-me-choose/air-treatment') return 'hmc';
    if (p === '/search-results') return 'search';
    return null;
  }

  // 1. The saved pages try to re-render lists from the Dyson API and wipe the snapshot – keep requests pending.
  var never = function () { return new Promise(function () {}); };
  var origFetch = window.fetch;
  window.fetch = function (input) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    return /api\.dyson\./.test(u) ? never() : origFetch.apply(this, arguments);
  };
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    if (/api\.dyson\./.test(u)) { this.send = function () {}; }
    return origOpen.apply(this, arguments);
  };

  // 2. Navigation: only routed links work, everything else stays on the page.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^javascript:/i.test(raw)) return;
    var key = a.hasAttribute('data-proto-go') ? a.getAttribute('data-proto-go') : route(a.href);
    e.preventDefault();
    e.stopImmediatePropagation();
    if (key && !e.ctrlKey && !e.metaKey) go(key);
  }, true);

  // Compare button in the PLP compare footer opens the Dyson Compare page
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.js-compare-modal-open')) {
      e.preventDefault(); e.stopImmediatePropagation(); go('compare');
    }
  }, true);

  // Closing the compare view goes back to the PLP
  document.addEventListener('click', function (e) {
    if (current === 'compare' && e.target.closest && e.target.closest('.compare-modal__close')) {
      e.preventDefault(); e.stopImmediatePropagation(); go('plp');
    }
  }, true);

  // Help me choose: Next goes straight to the result page
  document.addEventListener('click', function (e) {
    if (current !== 'hmc' || !e.target.closest) return;
    var n = e.target.closest('.sticky-cta__button');
    if (!n) { var c = e.target.closest('.zv-breadcrumb__control'); if (c && !/back/i.test(c.getAttribute('aria-label') || '')) n = c; }
    if (n) { e.preventDefault(); e.stopImmediatePropagation(); go('result'); }
  }, true);

  // 3. Search: any query submitted from the header search opens Search Results.
  function toSearch(e) { e.preventDefault(); e.stopImmediatePropagation(); go('search'); }
  document.addEventListener('submit', function (e) {
    if (e.target.matches && e.target.matches('form.js-search-form, form[name=searchNavForm]')) toSearch(e);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('input.js-search-input, input.search-nav__overlay-input')) {
      if (e.target.value.trim()) toSearch(e);
    }
  }, true);

  // 4. Entry points
  function hmcButton(extraClass) {
    var a = document.createElement('a');
    a.className = 'proto-hmc ' + (extraClass || '');
    a.href = url('hmc');
    a.setAttribute('data-proto-go', 'hmc');
    a.setAttribute('data-analytics-action-name', 'cta~help me choose');
    a.innerHTML = '<span>Help me choose</span>';
    return a;
  }

  var p3d;
  function load3d() {
    if (window.DysonPreview3D) return Promise.resolve();
    return p3d || (p3d = new Promise(function (res) {
      var s = document.createElement('script'); s.src = base + 'chatbot/dyson-3d.js?v=3'; s.onload = res; document.head.appendChild(s);
    }));
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = base + 'proto/proto.css?v=17';
    document.head.appendChild(css);

    if (current === 'result') {
      var zc = document.createElement('link'); zc.rel = 'stylesheet'; zc.href = base + 'proto/zoe.css?v=10'; document.head.appendChild(zc);
      var zs = document.createElement('script'); zs.src = base + 'proto/zoe.js?v=4'; document.head.appendChild(zs);
    }

    if (current === 'compare') {
      var cc = document.createElement('link'); cc.rel = 'stylesheet'; cc.href = base + 'proto/zoe.css?v=10'; document.head.appendChild(cc);
      var cs = document.createElement('script'); cs.src = base + 'proto/zoe-compare.js?v=2'; document.head.appendChild(cs);
    }

    // PLP: small sticky nudge towards the assistant after 10 s on the page
    if (current === 'plp') {
      setTimeout(function () {
        var n = document.createElement('div');
        n.className = 'proto-nudge'; n.setAttribute('role', 'complementary');
        n.innerHTML = '<button type="button" class="proto-nudge__x" aria-label="Close">\u00d7</button>' +
          '<p>Not sure what to choose? Let us help you!</p>';
        n.appendChild(hmcButton('proto-hmc--small'));
        n.querySelector('.proto-nudge__x').addEventListener('click', function () { n.classList.remove('proto-nudge--in'); setTimeout(function () { n.remove(); }, 300); });
        document.body.appendChild(n);
        requestAnimationFrame(function () { requestAnimationFrame(function () { n.classList.add('proto-nudge--in'); }); });
      }, 10000);
    }

    function install() {
      // Home: Air treatment tile in carousel-cards-nav is active
      if (current === 'home') {
        document.querySelectorAll('ul.carousel-cards-nav a.carousel-cards__link').forEach(function (a) {
          if (/air treatment/i.test(a.textContent)) { a.setAttribute('data-proto-go', 'air'); a.classList.add('proto-active'); }
        });
      }
      // Air treatment: "Shop all" tile -> PLP, with inline Help me choose CTA
      if (current === 'air') {
        document.querySelectorAll('ul.carousel-cards-nav li').forEach(function (li) {
          var a = li.querySelector('a.carousel-cards__link');
          if (!a || !/^\s*shop all\s*$/i.test(a.textContent) || li.querySelector('.proto-hmc')) return;
          a.setAttribute('data-proto-go', 'plp');
          li.classList.add('proto-has-cta');
          li.appendChild(hmcButton('proto-hmc--tile'));
        });
      }
      // PLP: CTA in the product listing filter bar, next to the product count
      if (current === 'plp') {
        var c = document.querySelector('.product-listing__filter .product-listing__count-container-lg');
        if (c && !c.querySelector('.proto-hmc')) { c.classList.add('proto-count'); c.appendChild(hmcButton()); }
      }
      // Help me choose: keep Next clickable (the saved page does not register answers)
      if (current === 'hmc') {
        var nx = document.querySelector('.sticky-cta__button[disabled]');
        if (nx) nx.removeAttribute('disabled');
      }
      // Result page: "3D Preview" button next to "Learn more" on every product card
      if (current === 'result') {
        document.querySelectorAll('.top-product-purchase__actions').forEach(function (box) {
          if (box.querySelector('.dy-3d-btn')) return;
          var learn = box.querySelector('.top-product-purchase__btn--learn');
          if (!learn) return;
          var btn = document.createElement('button');
          [].forEach.call(learn.attributes, function (a) { if (/^data-v-/.test(a.name)) btn.setAttribute(a.name, a.value); });
          btn.type = 'button';
          btn.className = learn.className + ' dy-3d-btn';
          btn.textContent = '3D Preview';
          btn.addEventListener('click', function () {
            var card = btn.closest('.top-product-card');
            var n = card && card.querySelector('.top-product-card__name');
            load3d().then(function () {
              window.DysonPreview3D.open({ title: n ? n.textContent.trim() : 'Dyson air purifier' });
            });
          });
          learn.parentNode.insertBefore(btn, learn.nextSibling);
        });
      }
      // Compare: "Summarize it with AI" CTA in the toggle row
      if (current === 'compare') {
        var w = document.querySelector('.show-difference-wrapper');
        if (w && !w.querySelector('.proto-ai')) {
          var ai = document.createElement('button');
          ai.type = 'button'; ai.className = 'proto-ai';
          ai.setAttribute('data-analytics-action-name', 'cta~summarize it with ai');
          ai.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1z"/><path d="M19 3v4M17 5h4" stroke-linecap="round"/></svg><span>Summarize it with AI</span>';
          ai.addEventListener('click', function () { if (window.ZoeCompare) window.ZoeCompare.open(); });
          w.appendChild(ai);
        }
      }
      // Search results: CTA in the sort box, to the left of the divider
      if (current === 'search') {
        var b = document.querySelector('.product-listing__filter .enhanced-search-box, .enhanced-search-box');
        if (b && !b.querySelector('.proto-hmc')) {
          b.classList.add('proto-sortbox');
          b.insertBefore(hmcButton(), b.firstChild);
        }
      }
    }
    install();
    // site scripts may rebuild parts of the DOM – re-apply (idempotent)
    var t;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(install, 150); })
      .observe(document.body, { childList: true, subtree: true });
  });
})();
