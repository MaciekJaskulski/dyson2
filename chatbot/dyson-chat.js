/* Dyson AI Assistant – left-column chatbot (mockup). Usage: <script src="chatbot/dyson-chat.js" data-page="choose|result"> */
(function () {
  var script = document.currentScript;
  var page = (script && script.getAttribute('data-page')) || 'choose';
  var base = script.src.replace(/[^\/]*$/, '');

  var link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = base + 'dyson-chat.css?v=3';
  document.head.appendChild(link);

  var SPARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1z"/><path d="M19 3v4M17 5h4" stroke-linecap="round"/></svg>';

  var CONVOS = {
    choose: [
      { u: null, b: '<p>Hi! I’m Dyson’s AI assistant. Ask me anything about the products and options on this page – I can explain the differences, help you choose and answer product questions.</p>' },
      { u: 'What’s the difference between purification and humidification?',
        b: '<p>They solve two different problems:</p><ul>' +
           '<li><strong>Purification</strong> cleans the air. Dyson purifiers draw air through a sealed HEPA H13 filter plus an activated carbon filter, capturing 99.95% of particles as small as 0.1 microns (dust, pollen, pet dander) and helping remove odours and gases.</li>' +
           '<li><strong>Humidification</strong> adds moisture to dry air. Dyson Purifier Humidify+Cool models release UV-C treated mist and, in Auto mode, maintain your target humidity – helpful for dry skin, throat and static.</li></ul>' +
           '<p>Purifier-only models don’t change humidity. Humidify+Cool models do both, and you can switch humidification off to use them as a purifying fan.</p>' },
      { u: 'What exactly do I need if I already have air conditioner and the air feels dry?',
        b: '<p>Air conditioners cool the air and typically remove moisture as a by-product – they don’t add any back. So a purifier-only model won’t fix the dryness.</p>' +
           '<p>What you need is <strong>humidification</strong>. A <strong>Dyson Purifier Humidify+Cool</strong> will:</p><ul>' +
           '<li>sense dry air and add moisture automatically to keep your chosen humidity level,</li>' +
           '<li>keep purifying at the same time (HEPA + carbon filtration),</li>' +
           '<li>run in Diffused mode, so airflow isn’t pointed at you while the A/C is already cooling.</li></ul>' +
           '<p>Select <strong>Humidification</strong> in the first question and I’ll show you the matching models.</p>' }
    ],
    result: [
      { u: null, b: '<p>Here are your 4 matches. I can answer questions about any of these products – power, filters, coverage, controls and more.</p>' },
      { u: 'Does this run on battery or is there some battery included that I need to charge and how long does the battery last?',
        b: '<p>No battery to charge – the <strong>Dyson Purifier Cool PC1</strong> and the other models in your matches are <strong>mains-powered</strong>. You plug them into a wall socket, so there is no battery life limit and they can run continuously.</p>' +
           '<p>They’re designed to stay in one room, but you can move them wherever there’s a socket nearby. You can control them with the MyDyson app, and some models also come with a remote.</p>' },
      { u: 'Add it to the cart',
        b: '<p>Done – I’ve added the <strong>Dyson Purifier Cool PC1 Purifying fan (White)</strong> to your cart.</p>' +
           '<p>One suggestion: the filter should be replaced about <strong>every 12 months</strong> (sooner if your machine notifies you). It might be a good idea to add a spare <strong>Dyson Purifier Cool PC1 replacement filter</strong> (360° glass HEPA H13 + activated carbon filter) to your cart now, so you have the next one ready when the current one is used up.</p>' +
           '<p>Would you like me to add it?</p>' }
    ]
  };
  var CHIPS = {
    choose: [],
    result: ['Yes, add the filter to my cart', 'No, thanks']
  };
  var PLACEHOLDER = page === 'result' ? 'Ask about these products…' : 'Ask about the options on this page…';
  var CANNED = {
    'Yes, add the filter to my cart': '<p>Added! The <strong>Dyson Purifier Cool PC1 replacement filter</strong> is now in your cart next to your purifier.</p>',
    'No, thanks': '<p>No problem. You can always add a replacement filter later from the Dyson spare parts page.</p>'
  };
  var FALLBACK = '<p>This is a design mockup, so I can only answer the questions shown in this conversation. In the live version I would answer using the product information on this page.</p>';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function time() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ', Today'; }

  function botMsg(body, html) {
    var m = el('div', 'dy-msg');
    m.appendChild(el('div', 'dy-avatar', SPARK));
    var c = el('div', 'dy-msg__col');
    c.appendChild(el('div', 'dy-msg__meta', 'Dyson AI Assistant ' + time()));
    c.appendChild(el('div', 'dy-msg__bubble', html));
    m.appendChild(c); body.appendChild(m); return m;
  }
  function userMsg(body, text) {
    var m = el('div', 'dy-msg dy-msg--user');
    var c = el('div', 'dy-msg__col');
    c.appendChild(el('div', 'dy-msg__meta', 'You ' + time()));
    var b = el('div', 'dy-msg__bubble'); b.textContent = text;
    c.appendChild(b); m.appendChild(c); body.appendChild(m); return m;
  }

  function build() {
    var host = document.querySelector('.help-me-choose');
    if (!host || document.querySelector('.dy-chat')) return;

    var layout = el('div', 'dy-layout');
    host.parentNode.insertBefore(layout, host);

    var chat = el('aside', 'dy-chat');
    chat.setAttribute('aria-label', 'Dyson AI Assistant');
    chat.innerHTML =
      '<div class="dy-chat__header"><div><div class="dy-chat__title">Dyson AI Assistant</div>' +
      '<div class="dy-chat__sub">Ask me anything about this page</div></div>' +
      '<div class="dy-chat__hbtn"><button type="button" aria-label="Restart conversation" class="dy-restart"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button></div></div>' +
      '<div class="dy-chat__body" role="log" aria-live="polite"></div>' +
      '<div class="dy-chat__foot"><form class="dy-chat__form"><input class="dy-chat__input" type="text" aria-label="Message" placeholder="' + PLACEHOLDER + '">' +
      '<button class="dy-chat__send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l11 2-11 2z"/></svg></button></form>' +
      '<div class="dy-chat__note">You are currently chatting with an AI assistant.</div></div>';
    layout.appendChild(chat);
    layout.appendChild(host);

    var body = chat.querySelector('.dy-chat__body');
    var form = chat.querySelector('form');
    var input = chat.querySelector('input');

    function scroll() { body.scrollTop = body.scrollHeight; }
    function renderChips() {
      var old = body.querySelector('.dy-chips'); if (old) old.remove();
      if (!CHIPS[page].length) return;
      var w = el('div', 'dy-chips');
      CHIPS[page].forEach(function (t) {
        var b = el('button', 'dy-chip', SPARK + '<span></span>'); b.type = 'button';
        b.lastChild.textContent = t;
        b.onclick = function () { ask(t); };
        w.appendChild(b);
      });
      body.appendChild(w); scroll();
    }
    function ask(text) {
      var old = body.querySelector('.dy-chips'); if (old) old.remove();
      userMsg(body, text);
      var m = botMsg(body, '<span class="dy-typing"><i></i><i></i><i></i></span>');
      scroll();
      setTimeout(function () { m.querySelector('.dy-msg__bubble').innerHTML = CANNED[text] || FALLBACK; scroll(); }, 900);
    }
    function render() {
      body.innerHTML = '';
      CONVOS[page].forEach(function (t) {
        if (t.u) userMsg(body, t.u);
        botMsg(body, t.b);
      });
      renderChips();
      body.scrollTop = 0;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (!v) return;
      input.value = ''; ask(v);
    });
    chat.querySelector('.dy-restart').onclick = render;
    render();
  }

  var p3d;
  function load3d() {
    if (window.DysonPreview3D) return Promise.resolve();
    return p3d || (p3d = new Promise(function (res) {
      var s = document.createElement('script'); s.src = base + 'dyson-3d.js?v=3'; s.onload = res; document.head.appendChild(s);
    }));
  }

  /* 3D Preview button next to Add to Cart / Learn more (placeholder, no action yet) */
  function addPreviewButtons() {
    document.querySelectorAll('.top-product-purchase__actions').forEach(function (box) {
      if (box.querySelector('.dy-3d-btn')) return;
      var learn = box.querySelector('.top-product-purchase__btn--learn');
      if (!learn) return;
      var b = learn.cloneNode(false);
      b.removeAttribute('href'); b.removeAttribute('target'); b.removeAttribute('rel'); b.removeAttribute('aria-label');
      var btn = document.createElement('button');
      [].forEach.call(learn.attributes, function (a) {
        if (/^data-v-/.test(a.name)) btn.setAttribute(a.name, a.value);
      });
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

  /* Step 1 -> Results: the top-right "Next" arrow (nav > button[2]) opens the Results page */
  var NEXT_URL = (script && script.getAttribute('data-next')) || '';
  function enableNext() {
    document.querySelectorAll('#zoovu-assistant nav.zv-breadcrumb--steps button:nth-of-type(2)').forEach(function (b) {
      if (b.disabled) b.removeAttribute('disabled');
      b.style.opacity = '1'; b.style.cursor = 'pointer'; b.style.pointerEvents = 'auto';
    });
  }
  function wireNext() {
    enableNext();
    new MutationObserver(enableNext).observe(document.getElementById('zoovu-assistant') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#zoovu-assistant nav.zv-breadcrumb--steps button:nth-of-type(2)');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      window.location.href = NEXT_URL;
    }, true);
  }

  /* Results -> step 1: the "Back" button (nav > button[1]) returns to the previous screen */
  var PREV_URL = (script && script.getAttribute('data-prev')) || '';
  var BACK_SEL = '#zoovu-assistant nav.zv-breadcrumb--results button:nth-of-type(1)';
  function wireBack() {
    function enable() {
      document.querySelectorAll(BACK_SEL).forEach(function (b) {
        if (b.disabled) b.removeAttribute('disabled');
        b.style.cursor = 'pointer'; b.style.pointerEvents = 'auto';
      });
    }
    enable();
    new MutationObserver(enable).observe(document.getElementById('zoovu-assistant') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    document.addEventListener('click', function (e) {
      if (!(e.target.closest && e.target.closest(BACK_SEL))) return;
      e.preventDefault(); e.stopPropagation();
      window.location.href = PREV_URL;
    }, true);
  }

  function init() {
    build();
    if (page === 'result' && PREV_URL) wireBack();
    if (page === 'choose' && NEXT_URL) wireNext();
    if (page === 'result') {
      addPreviewButtons();
      new MutationObserver(addPreviewButtons).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
