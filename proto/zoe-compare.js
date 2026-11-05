/* Zoe on the Compare page: "Summarize it with AI" opens an inline widget that streams a summary of the differences.
   Facts come from the comparison table on this page (BP04, HP1, PC1, HP2). */
(function () {
  var SPARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1z"/><path d="M19 3v4M17 5h4" stroke-linecap="round"/></svg>';

  var SUMMARY =
    '<p>Here is how your 4 models differ. All of them are <strong>Wi-Fi enabled via the MyDyson app</strong> and share 10 speed settings, night mode and scheduling – so the key differences are:</p>' +
    '<ul>' +
    '<li><strong>Heating:</strong> only the <strong>HP1</strong> and <strong>HP2</strong> (Hot+Cool) also <strong>heat</strong>. The <strong>BP04</strong> and <strong>PC1</strong> cool and purify only.</li>' +
    '<li><strong>Formaldehyde:</strong> the <strong>BP04</strong> and <strong>HP2</strong> have a <strong>lifetime formaldehyde filter</strong> that continuously breaks it down. The HP1 and PC1 don’t.</li>' +
    '<li><strong>Size and weight:</strong> the <strong>BP04</strong> is the largest and heaviest (<strong>11.9 kg</strong>, 830 mm). The <strong>PC1</strong> is the lightest (<strong>4.72 kg</strong>) and the tallest, slim tower at <strong>1,055 mm</strong>. The HP1 (5.26 kg, 770 mm) and HP2 (5.5 kg, 764 mm) are compact.</li>' +
    '<li><strong>Air-quality sensing:</strong> only the <strong>HP1</strong> lists automatic sensing (PM2.5, PM10, VOCs, NO₂, humidity and temperature).</li>' +
    '<li><strong>Price:</strong> <strong>PC1 £449.99</strong> is the cheapest, then <strong>HP1 £549.99</strong> and <strong>HP2 £549.99</strong> (<strong>save £150</strong>, was £699.99). The <strong>BP04 at £899.99</strong> is the most expensive.</li>' +
    '</ul>' +
    '<p><strong>In short:</strong> choose the <strong>PC1</strong> for the lowest price and a lightweight cooling purifier, the <strong>HP2</strong> if you want heating plus formaldehyde removal at a reduced price, the <strong>HP1</strong> if automatic sensing matters, and the <strong>BP04</strong> for a large formaldehyde-destroying purifier without heating.</p>';
  var FALLBACK = '<p>This is a design mockup, so I can only summarise the comparison above. In the live version I would answer using the product information on this page.</p>';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function time() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ', Today'; }

  var widget, body, streamTimer, followTimer;
  var FOLLOWUP = '<p>What will you be using it for? Tell me a bit about your space and what matters most to you, and I can point you to the best fit.</p>';

  function bot(html) {
    var m = el('div', 'zoe-msg');
    m.appendChild(el('div', 'zoe-avatar', SPARK));
    var c = el('div', 'zoe-msg__col');
    c.appendChild(el('div', 'zoe-msg__meta', 'Dyson AI Assistant ' + time()));
    var b = el('div', 'zoe-msg__bubble', html);
    c.appendChild(b); m.appendChild(c); body.appendChild(m); return b;
  }
  function user(text) {
    var m = el('div', 'zoe-msg zoe-msg--user');
    var c = el('div', 'zoe-msg__col');
    c.appendChild(el('div', 'zoe-msg__meta', 'You ' + time()));
    var b = el('div', 'zoe-msg__bubble'); b.textContent = text;
    c.appendChild(b); m.appendChild(c); body.appendChild(m);
  }
  function scroll() { body.scrollTop = body.scrollHeight; }

  // stream html word by word (tags are emitted whole, so bold appears as it is typed)
  function stream(bubble, html, done) {
    var tokens = html.match(/<[^>]+>|[^<\s]+\s*|\s+/g) || [], i = 0, out = '';
    bubble.classList.add('zoe-streaming');
    clearInterval(streamTimer);
    streamTimer = setInterval(function () {
      var n = 0;
      while (i < tokens.length && n < 2) { out += tokens[i]; if (tokens[i].charAt(0) !== '<') n++; i++; }
      bubble.innerHTML = out; scroll();
      if (i >= tokens.length) { clearInterval(streamTimer); bubble.classList.remove('zoe-streaming'); if (done) done(); }
    }, 35);
  }

  function reset() {
    clearInterval(streamTimer); clearTimeout(followTimer);
    body.innerHTML = '';
    var b = bot('<span class="zoe-typing"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      stream(b, SUMMARY, function () {
        followTimer = setTimeout(function () {
          var f = bot('<span class="zoe-typing"><i></i><i></i><i></i></span>'); scroll();
          followTimer = setTimeout(function () { f.innerHTML = FOLLOWUP; scroll(); }, 900);
        }, 600);
      });
    }, 700);
  }

  function build() {
    var w = el('section', 'zoe-inline zoe-inline--compare');
    w.setAttribute('aria-label', 'Dyson AI Assistant');
    w.innerHTML =
      '<div class="zoe-inline__header"><div><div class="zoe-inline__title">Dyson AI Assistant</div>' +
      '<div class="zoe-inline__sub">Ask me anything about this comparison</div></div>' +
      '<div class="zoe-inline__hbtn">' +
      '<button type="button" class="zoe-restart" aria-label="Restart conversation"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button>' +
      '<button type="button" class="zoe-close" aria-label="Close assistant"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '</div></div>' +
      '<div class="zoe-inline__body" role="log" aria-live="polite"></div>' +
      '<div class="zoe-inline__foot"><form class="zoe-inline__form"><input class="zoe-inline__input" type="text" aria-label="Message" placeholder="Ask about these products…">' +
      '<button class="zoe-inline__send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l11 2-11 2z"/></svg></button></form>' +
      '<div class="zoe-inline__note">You are currently chatting with an AI assistant.</div></div>';
    body = w.querySelector('.zoe-inline__body');
    w.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var i = w.querySelector('input'), v = i.value.trim(); if (!v) return;
      i.value = ''; user(v);
      var b = bot('<span class="zoe-typing"><i></i><i></i><i></i></span>'); scroll();
      setTimeout(function () { b.innerHTML = FALLBACK; scroll(); }, 900);
    });
    w.querySelector('.zoe-restart').onclick = reset;
    w.querySelector('.zoe-close').onclick = function () { clearInterval(streamTimer); clearTimeout(followTimer); w.classList.remove('zoe-inline--open'); };
    return w;
  }

  window.ZoeCompare = {
    open: function () {
      var anchor = document.querySelector('.show-difference-wrapper');
      if (!anchor) return;
      if (!widget) widget = build();
      if (!widget.isConnected) anchor.parentNode.insertBefore(widget, anchor.nextSibling);
      var wasOpen = widget.classList.contains('zoe-inline--open');
      widget.classList.add('zoe-inline--open');
      if (!wasOpen) reset();
      setTimeout(function () { widget.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
    }
  };
})();
