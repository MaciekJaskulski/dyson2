/* Zoe entry point on the Result page:
   suggested questions above the price of the top product card -> inline "Dyson AI Assistant" widget below the card.
   Mock answers only – edit ANSWERS to change what Zoe says. */
(function () {
  var SPARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1z"/><path d="M19 3v4M17 5h4" stroke-linecap="round"/></svg>';
  var QUESTIONS = ['How is it powered?', 'What are the dimensions?', 'How do I install it?'];

  // %N = product name. NOTE: placeholder copy – confirm the figures before showing to a client.
  var ANSWERS = {
    'How is it powered?':
      '<p>The <strong>%N</strong> is <strong>mains-powered</strong>. Just plug it into a wall socket – there is no battery to charge, so it can run continuously.</p>' +
      '<p>You can control it with the MyDyson app or the remote control.</p>',
    'What are the dimensions?':
      '<p>The <strong>%N</strong> is a slim tower design:</p><ul>' +
      '<li>Height: about <strong>105 cm</strong></li><li>Width: about <strong>22 cm</strong></li><li>Depth: about <strong>22 cm</strong></li></ul>' +
      '<p>It has a small footprint, so it fits next to a sofa, desk or bed.</p>',
    'How do I install it?':
      '<p>There is nothing to assemble:</p><ul>' +
      '<li>Take it out of the box and place it on a flat, stable surface.</li>' +
      '<li>The filter is already fitted – just plug it in.</li>' +
      '<li>Optional: connect it to the MyDyson app to set it up and track air quality.</li></ul>' +
      '<p>Leave a little space around it so air can flow freely.</p>'
  };
  var GREETING = '<p>Hi, I\u2019m Zoe, your AI assistant. I\u2019m happy to answer your questions.</p>';
  var TERM_Q = 'How does the app connectivity work?';
  ANSWERS[TERM_Q] =
    '<p>The <strong>%N</strong> connects to your home <strong>Wi-Fi</strong> and pairs with the <strong>MyDyson app</strong> (iOS and Android).</p><ul>' +
    '<li>Download the app, switch the machine on and follow the in-app steps to connect it to your Wi-Fi.</li>' +
    '<li>Control fan speed, oscillation and night mode from anywhere.</li>' +
    '<li>See live air-quality information and set schedules.</li>' +
    '<li>Software updates are delivered through the app.</li></ul>' +
    '<p>You can still use the remote control if your Wi-Fi is down.</p>';
  var FALLBACK = '<p>This is a design mockup, so I can only answer the suggested questions. In the live version I would answer using the product information on this page.</p>';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function time() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ', Today'; }
  function productName() {
    var n = document.querySelector('.top-product-card .top-product-card__name');
    return n ? n.textContent.trim() : 'Dyson air purifier';
  }

  var widget = null, api = null;

  function buildWidget() {
    var w = el('section', 'zoe-inline');
    w.setAttribute('aria-label', 'Dyson AI Assistant');
    w.innerHTML =
      '<div class="zoe-inline__header"><div><div class="zoe-inline__title">Dyson AI Assistant</div>' +
      '<div class="zoe-inline__sub">Ask me anything about this page</div></div>' +
      '<div class="zoe-inline__hbtn">' +
      '<button type="button" class="zoe-restart" aria-label="Restart conversation"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button>' +
      '<button type="button" class="zoe-close" aria-label="Close assistant"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '</div></div>' +
      '<div class="zoe-inline__body" role="log" aria-live="polite"></div>' +
      '<div class="zoe-inline__foot"><form class="zoe-inline__form"><input class="zoe-inline__input" type="text" aria-label="Message" placeholder="Ask about this product…">' +
      '<button class="zoe-inline__send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l11 2-11 2z"/></svg></button></form>' +
      '<div class="zoe-inline__note">You are currently chatting with an AI assistant.</div></div>';

    var body = w.querySelector('.zoe-inline__body');
    var asked = [];

    function scroll() { body.scrollTop = body.scrollHeight; }
    function bot(html) {
      var m = el('div', 'zoe-msg');
      m.appendChild(el('div', 'zoe-avatar', SPARK));
      var c = el('div', 'zoe-msg__col');
      c.appendChild(el('div', 'zoe-msg__meta', 'Dyson AI Assistant ' + time()));
      c.appendChild(el('div', 'zoe-msg__bubble', html));
      m.appendChild(c); body.appendChild(m); return m;
    }
    function user(text) {
      var m = el('div', 'zoe-msg zoe-msg--user');
      var c = el('div', 'zoe-msg__col');
      c.appendChild(el('div', 'zoe-msg__meta', 'You ' + time()));
      var b = el('div', 'zoe-msg__bubble'); b.textContent = text;
      c.appendChild(b); m.appendChild(c); body.appendChild(m);
    }
    function chips() {
      var old = body.querySelector('.zoe-chips'); if (old) old.remove();
      var left = QUESTIONS.filter(function (q) { return asked.indexOf(q) < 0; });
      if (!left.length) return;
      var wrap = el('div', 'zoe-chips');
      left.forEach(function (q) {
        var b = el('button', 'zoe-chip', SPARK + '<span></span>'); b.type = 'button';
        b.lastChild.textContent = q;
        b.onclick = function () { ask(q); };
        wrap.appendChild(b);
      });
      body.appendChild(wrap); scroll();
    }
    function ask(text) {
      var old = body.querySelector('.zoe-chips'); if (old) old.remove();
      if (QUESTIONS.indexOf(text) >= 0 && asked.indexOf(text) < 0) asked.push(text);
      user(text);
      var m = bot('<span class="zoe-typing"><i></i><i></i><i></i></span>');
      scroll();
      setTimeout(function () {
        m.querySelector('.zoe-msg__bubble').innerHTML = (ANSWERS[text] || FALLBACK).replace(/%N/g, productName());
        chips(); scroll();
      }, 900);
    }
    function reset(greet) {
      asked = []; body.innerHTML = '';
      if (greet === true) bot(GREETING);
      chips(); body.scrollTop = 0;
    }

    w.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var i = w.querySelector('input'), v = i.value.trim(); if (!v) return;
      i.value = ''; ask(v);
    });
    w.querySelector('.zoe-restart').onclick = function () { reset(true); };
    w.querySelector('.zoe-close').onclick = function () {
      w.classList.remove('zoe-inline--open');
      var c = document.querySelector('.top-product-card'); if (c) { c.classList.remove('zoe-chat-open'); c.classList.add('zoe-chat-closed'); }
    };
    reset();
    return { el: w, ask: ask, reset: reset };
  }

  function openWith(question, card, greet) {
    if (!api) { api = buildWidget(); widget = api.el; }
    if (!widget.isConnected) card.parentNode.insertBefore(widget, card.nextSibling);
    var wasOpen = widget.classList.contains('zoe-inline--open');
    widget.classList.add('zoe-inline--open');
    card.classList.add('zoe-chat-open'); card.classList.remove('zoe-chat-closed');
    if (!wasOpen) api.reset(!question || greet);
    if (question) api.ask(question);
    setTimeout(function () { widget.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
  }

  function mount() {
    var card = document.querySelector('.top-product-card');
    if (!card) return;
    if (widget && widget.isConnected === false && widget.classList.contains('zoe-inline--open')) {
      card.parentNode.insertBefore(widget, card.nextSibling);
    }
    var desc = card.querySelector('.top-product-card__description');
    if (desc && !desc.querySelector('.zoe-term')) {
      var walker = document.createTreeWalker(desc, NodeFilter.SHOW_TEXT), tn;
      while ((tn = walker.nextNode())) {
        var ix = tn.nodeValue.search(/app connectivity/i);
        if (ix < 0) continue;
        var rest = tn.splitText(ix); rest.splitText('app connectivity'.length);
        var term = el('button', 'zoe-term'); term.type = 'button'; term.textContent = rest.nodeValue;
        term.addEventListener('click', function () { openWith(TERM_Q, card); });
        rest.parentNode.replaceChild(term, rest);
        break;
      }
    }
    var features = card.querySelector('.top-product-card__features');
    if (!features || card.querySelector('.zoe-suggest')) return;
    var box = el('div', 'zoe-suggest');
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Ask Dyson AI assistant');
    QUESTIONS.forEach(function (q) {
      var b = el('button', 'zoe-suggest__btn', SPARK + '<span></span>'); b.type = 'button';
      b.lastChild.textContent = q;
      b.addEventListener('click', function () { openWith(q, card); });
      box.appendChild(b);
    });
    var own = el('button', 'zoe-own', 'or ask your own question'); own.type = 'button';
    own.addEventListener('click', function () { openWith(null, card, true); });
    box.appendChild(own);
    features.parentNode.insertBefore(box, features.nextSibling);
    var ask = el('button', 'zoe-askbtn', SPARK + '<span>Ask our AI assistant</span>'); ask.type = 'button';
    ask.addEventListener('click', function () { openWith(null, card, true); });
    features.parentNode.insertBefore(ask, box.nextSibling);
  }

  function start() {
    mount();
    var t;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(mount, 150); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
