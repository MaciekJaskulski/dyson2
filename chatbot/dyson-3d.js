/* 3D Preview modal – procedural model of a Dyson tower air purifier (loop-aperture design), built with three.js r128 */
(function () {
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var threePromise;
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (!threePromise) threePromise = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = THREE_URL; s.onload = res; s.onerror = function () { threePromise = null; rej(new Error('three.js failed to load')); };
      document.head.appendChild(s);
    });
    return threePromise;
  }

  var css = '' +
    '.dy3d-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;font-family:DysonFutura,Helvetica,Arial,sans-serif;animation:dy3dIn .18s ease-out}' +
    '@keyframes dy3dIn{from{opacity:0}to{opacity:1}}' +
    '.dy3d-modal{background:#fff;border-radius:10px;width:min(920px,100%);height:min(680px,calc(100vh - 48px));display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
    '.dy3d-head{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid #e6e6e6}' +
    '.dy3d-title{font-size:18px;font-weight:600;color:#1a1a1a;line-height:1.2}' +
    '.dy3d-sub{font-size:12px;color:#666;margin-top:2px}' +
    '.dy3d-close{margin-left:auto;border:0;background:none;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a1a1a}' +
    '.dy3d-close:hover{background:#eee}.dy3d-close:focus-visible,.dy3d-btn:focus-visible{outline:2px solid #1a1a1a;outline-offset:2px}' +
    '.dy3d-stage{position:relative;flex:1;min-height:0;background:radial-gradient(ellipse at 50% 35%,#fff 0%,#eceeef 70%,#dfe2e4 100%);touch-action:none;cursor:grab}' +
    '.dy3d-stage.drag{cursor:grabbing}' +
    '.dy3d-stage canvas{display:block;width:100%;height:100%}' +
    '.dy3d-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#555;font-size:14px;pointer-events:none;text-align:center;padding:20px}' +
    '.dy3d-foot{display:flex;align-items:center;gap:12px;padding:10px 20px;border-top:1px solid #e6e6e6;font-size:12px;color:#666;flex-wrap:wrap}' +
    '.dy3d-btn{border:1px solid #1a1a1a;background:#fff;border-radius:4px;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer;color:#1a1a1a}' +
    '.dy3d-btn:hover{background:#1a1a1a;color:#fff}' +
    '.dy3d-foot .dy3d-note{margin-left:auto}' +
    '@media(max-width:600px){.dy3d-overlay{padding:0}.dy3d-modal{height:100%;border-radius:0}.dy3d-foot .dy3d-note{margin-left:0}}';
  var styleEl;

  /* ---------- geometry helpers ---------- */
  function stadium(w, h) {
    var r = w / 2, s = new THREE.Shape(), y = h / 2 - r;
    s.moveTo(-r, -y); s.lineTo(-r, y); s.absarc(0, y, r, Math.PI, 0, true);
    s.lineTo(r, -y); s.absarc(0, -y, r, 0, Math.PI, true);
    return s;
  }
  function stadiumPath(w, h) {
    var p = stadium(w, h); return new THREE.Path(p.getPoints(48));
  }
  function ring(wOut, hOut, inset, depth, bevel) {
    var s = stadium(wOut, hOut);
    s.holes.push(stadiumPath(wOut - 2 * inset, hOut - 2 * inset));
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 48 });
    g.translate(0, 0, -depth / 2); return g;
  }
  function meshTexture(renderer) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'); x.fillStyle = '#f2f2f0'; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#8d9196';
    [[16, 16], [48, 48], [48, 16], [16, 48]].forEach(function (p, i) { x.beginPath(); x.arc(p[0] + (i > 1 ? 0 : 0), p[1], 5.2, 0, 7); x.fill(); });
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(26, 5); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  function envTexture(renderer) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#aeb2b6'); g.addColorStop(1, '#6a6e72');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(60, 40, 90, 70); x.fillRect(300, 30, 130, 60);
    var t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping;
    var pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose(); return env;
  }

  function buildPurifier(renderer) {
    var G = new THREE.Group();
    var white = new THREE.MeshStandardMaterial({ color: 0xeeeeec, roughness: .4, metalness: .05 });
    var graphite = new THREE.MeshStandardMaterial({ color: 0x5b5d60, roughness: .35, metalness: .6 });
    var silver = new THREE.MeshStandardMaterial({ color: 0xc9cbcd, roughness: .25, metalness: .85 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xb79a68, roughness: .3, metalness: .85 });
    var mesh = new THREE.MeshStandardMaterial({ map: meshTexture(renderer), roughness: .7, metalness: 0 });
    var R = 0.15, add = function (g, m, y) { var o = new THREE.Mesh(g, m); o.position.y = y; G.add(o); return o; };

    // foot, perforated filter body, shoulder
    add(new THREE.CylinderGeometry(R + .004, R + .008, .035, 64), graphite, .0175);
    add(new THREE.CylinderGeometry(R, R, .30, 96, 1, true), mesh, .035 + .15);
    add(new THREE.CylinderGeometry(R, R, .30, 96, 1, true), mesh, .035 + .15).scale.set(.995, 1, .995);
    add(new THREE.CylinderGeometry(R + .003, R, .028, 64), silver, .335 + .014);
    add(new THREE.CylinderGeometry(R - .01, R + .003, .055, 64), graphite, .363 + .0275);

    // control dot on the front of the shoulder
    var dot = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .006, 32), silver);
    dot.rotation.x = Math.PI / 2; dot.position.set(0, .386, R - .012); G.add(dot);

    // loop-aperture
    var W = .30, H = .74, bottom = .372, cy = bottom + H / 2, depth = .105, inset = .05;
    var loop = new THREE.Mesh(ring(W, H, inset, depth, .014), white); loop.position.y = cy; G.add(loop);
    var liner = new THREE.Mesh(ring(W - 2 * inset + .003, H - 2 * inset + .003, .006, depth + .006, 0), gold);
    liner.position.y = cy; G.add(liner);
    // dark gap line splitting the loop (front/back shells)
    var seam = new THREE.Mesh(ring(W + .001, H + .001, .0, .002, 0), graphite);
    seam.geometry.dispose(); seam.geometry = ring(W + .002, H + .002, .0015 + inset - .002, .003, 0);
    seam.position.y = cy; G.add(seam);

    G.position.y = -.5;  // centre vertically around origin
    return G;
  }

  /* ---------- modal ---------- */
  var active = null;
  function open(opts) {
    if (active) return;
    opts = opts || {};
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.textContent = css; document.head.appendChild(styleEl); }
    var trigger = document.activeElement;
    var ov = document.createElement('div'); ov.className = 'dy3d-overlay';
    ov.innerHTML =
      '<div class="dy3d-modal" role="dialog" aria-modal="true" aria-label="3D Preview">' +
      '<div class="dy3d-head"><div><div class="dy3d-title"></div><div class="dy3d-sub">3D Preview</div></div>' +
      '<button type="button" class="dy3d-close" aria-label="Close 3D preview"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
      '<div class="dy3d-stage"><div class="dy3d-msg">Loading 3D model…</div></div>' +
      '<div class="dy3d-foot"><button type="button" class="dy3d-btn dy3d-reset">Reset view</button><span>Drag to rotate · Scroll to zoom</span><span class="dy3d-note">Illustrative model based on product photos</span></div></div>';
    ov.querySelector('.dy3d-title').textContent = opts.title || 'Dyson air purifier';
    document.body.appendChild(ov);
    var prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    var stage = ov.querySelector('.dy3d-stage'), msg = ov.querySelector('.dy3d-msg');
    var closeBtn = ov.querySelector('.dy3d-close'); closeBtn.focus();

    var state = { raf: 0, dead: false };
    function close() {
      state.dead = true; cancelAnimationFrame(state.raf);
      if (state.cleanup) state.cleanup();
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow; ov.remove(); active = null;
      if (trigger && trigger.focus) trigger.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'Tab') {
        var f = ov.querySelectorAll('button'); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    closeBtn.onclick = close;
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    active = { close: close };

    loadThree().then(function () {
      if (state.dead) return;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
      stage.appendChild(renderer.domElement);
      var scene = new THREE.Scene(); scene.environment = envTexture(renderer);
      var cam = new THREE.PerspectiveCamera(28, 1, .1, 50);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b3b6, .35));
      var key = new THREE.DirectionalLight(0xffffff, .8); key.position.set(2, 3, 2.5); scene.add(key);
      var rim = new THREE.DirectionalLight(0xffffff, .35); rim.position.set(-3, 1.5, -2); scene.add(rim);

      // soft contact shadow
      var sc = document.createElement('canvas'); sc.width = sc.height = 128;
      var sx = sc.getContext('2d'), sg = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
      sg.addColorStop(0, 'rgba(0,0,0,.32)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
      var shadow = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.499; scene.add(shadow);

      var model = buildPurifier(renderer); scene.add(model);

      var DEF = { th: .6, ph: 1.5, r: 2.5 }, v = { th: DEF.th, ph: DEF.ph, r: DEF.r }, auto = true, tgtR = v.r;
      function place() {
        cam.position.set(v.r * Math.sin(v.ph) * Math.sin(v.th), v.r * Math.cos(v.ph) + .05, v.r * Math.sin(v.ph) * Math.cos(v.th));
        cam.lookAt(0, .02, 0);
      }
      function resize() {
        var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
        renderer.setSize(w, h, false); cam.aspect = w / h;
        cam.fov = w / h < .7 ? 38 : 28; cam.updateProjectionMatrix();
      }
      var ro = new ResizeObserver(resize); ro.observe(stage); resize(); msg.remove();

      var drag = null, el = renderer.domElement;
      el.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; auto = false; stage.classList.add('drag'); el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', function (e) {
        if (!drag) return;
        v.th -= (e.clientX - drag.x) * .008; v.ph = Math.min(1.9, Math.max(.9, v.ph - (e.clientY - drag.y) * .006));
        drag.x = e.clientX; drag.y = e.clientY;
      });
      function up() { drag = null; stage.classList.remove('drag'); }
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      el.addEventListener('wheel', function (e) { e.preventDefault(); tgtR = Math.min(4, Math.max(1.4, tgtR + e.deltaY * .003)); }, { passive: false });
      ov.querySelector('.dy3d-reset').onclick = function () { v.th = DEF.th; v.ph = DEF.ph; tgtR = DEF.r; auto = true; };

      var last = performance.now();
      (function loop(t) {
        if (state.dead) return;
        var dt = Math.min(.05, (t - last) / 1000); last = t;
        if (auto) v.th += dt * .6;
        v.r += (tgtR - v.r) * .15;
        place(); renderer.render(scene, cam);
        state.raf = requestAnimationFrame(loop);
      })(last);

      state.cleanup = function () {
        ro.disconnect();
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (o.material.map) && o.material.map.dispose(); o.material.dispose(); } });
        renderer.dispose();
      };
    }).catch(function () {
      msg.textContent = 'The 3D viewer could not be loaded. Please check your internet connection and try again.';
    });
  }

  window.DysonPreview3D = { open: open };
})();
