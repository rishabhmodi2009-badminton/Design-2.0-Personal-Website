document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = String(new Date().getFullYear());
});

(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
  els.forEach(function (el) { io.observe(el); });
})();

/* LaunchLab filmstrip arrows */
document.querySelectorAll('[data-strip]').forEach(function (b) {
  b.addEventListener('click', function () {
    var strip = b.parentElement.previousElementSibling;
    strip.scrollBy({ left: +b.getAttribute('data-strip') * strip.clientWidth * .8, behavior: 'smooth' });
  });
});

/* In-page document viewer: PDFs open in an overlay, rendered page by page with PDF.js so they work on phones too */
(function () {
  var links = document.querySelectorAll('a[data-doc]');
  if (!links.length) return;
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var ready = null, viewer, pagesEl, titleEl, countEl, openBtn, task = null, lastFocus = null;

  function loadLib() {
    if (!ready) ready = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; res(window.pdfjsLib); };
      s.onerror = rej; document.head.appendChild(s);
    });
    return ready;
  }

  function build() {
    viewer = document.createElement('div');
    viewer.className = 'viewer'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-modal', 'true'); viewer.hidden = true;
    viewer.innerHTML = '<div class="viewer-box"><div class="viewer-head"><div><h3 class="viewer-title"></h3><span class="viewer-count"></span></div>' +
      '<a class="viewer-open" target="_blank" rel="noopener">Open PDF ↗</a><button type="button" class="viewer-close" aria-label="Close document">×</button></div>' +
      '<div class="viewer-pages" tabindex="0"></div></div>';
    document.body.appendChild(viewer);
    pagesEl = viewer.querySelector('.viewer-pages'); titleEl = viewer.querySelector('.viewer-title');
    countEl = viewer.querySelector('.viewer-count'); openBtn = viewer.querySelector('.viewer-open');
    viewer.querySelector('.viewer-close').addEventListener('click', close);
    viewer.addEventListener('click', function (e) { if (e.target === viewer) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !viewer.hidden) close(); });
  }

  function close() {
    viewer.hidden = true; document.documentElement.classList.remove('viewer-on');
    if (task) { task.destroy(); task = null; }
    pagesEl.innerHTML = '';
    if (lastFocus) lastFocus.focus();
  }

  function open(url, title) {
    if (!viewer) build();
    lastFocus = document.activeElement;
    titleEl.textContent = title; countEl.textContent = 'Loading…'; openBtn.href = url;
    pagesEl.innerHTML = '<div class="viewer-loading">Loading document…</div>';
    viewer.hidden = false; document.documentElement.classList.add('viewer-on');
    viewer.querySelector('.viewer-close').focus();
    loadLib().then(function (lib) {
      task = lib.getDocument(url);
      return task.promise;
    }).then(function (pdf) {
      countEl.textContent = pdf.numPages + (pdf.numPages === 1 ? ' page' : ' pages');
      pagesEl.innerHTML = '';
      var width = pagesEl.clientWidth - 32, dpr = Math.min(2, window.devicePixelRatio || 1), chain = Promise.resolve();
      for (var n = 1; n <= pdf.numPages; n++) (function (n) {
        var canvas = document.createElement('canvas'); canvas.className = 'viewer-page'; pagesEl.appendChild(canvas);
        chain = chain.then(function () {
          if (viewer.hidden) return;
          return pdf.getPage(n).then(function (page) {
            var base = page.getViewport({ scale: 1 }), scale = width / base.width, vp = page.getViewport({ scale: scale * dpr });
            canvas.width = vp.width; canvas.height = vp.height;
            canvas.style.width = width + 'px'; canvas.style.height = (vp.height / dpr) + 'px';
            return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          });
        });
      })(n);
      chain.catch(function () {});
    }).catch(function () {
      if (viewer.hidden) return;
      countEl.textContent = '';
      pagesEl.innerHTML = '<div class="viewer-loading">This document couldn’t be shown here. Use “Open PDF” instead.</div>';
    });
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); open(a.getAttribute('href'), a.getAttribute('data-doc'));
    });
  });
})();

/* Photo lightbox: clicking a photo opens it full size, with arrows through the other photos in its [data-photos] group */
(function () {
  var groups = document.querySelectorAll('[data-photos]');
  if (!groups.length) return;
  var box, img, cap, count, items = [], at = 0, lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'gallery'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.hidden = true;
    box.innerHTML = '<div class="gallery-box"><div class="gallery-head"><span class="gallery-count"></span><button type="button" class="viewer-close" aria-label="Close photo">×</button></div>' +
      '<div class="gallery-stage"><button type="button" class="gallery-nav prev" aria-label="Previous photo">‹</button><img alt=""><button type="button" class="gallery-nav next" aria-label="Next photo">›</button></div>' +
      '<p class="gallery-cap"></p></div>';
    document.body.appendChild(box);
    img = box.querySelector('.gallery-stage img'); cap = box.querySelector('.gallery-cap'); count = box.querySelector('.gallery-count');
    box.querySelector('.viewer-close').addEventListener('click', close);
    box.querySelector('.prev').addEventListener('click', function () { show(at - 1); });
    box.querySelector('.next').addEventListener('click', function () { show(at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(at - 1); else if (e.key === 'ArrowRight') show(at + 1);
    });
    var x0 = null;
    img.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  function show(i) {
    at = (i + items.length) % items.length;
    img.src = items[at].src; img.alt = items[at].alt; cap.textContent = items[at].cap;
    count.textContent = (at + 1) + ' / ' + items.length;
    box.querySelectorAll('.gallery-nav').forEach(function (b) { b.hidden = items.length < 2; });
  }

  function close() { box.hidden = true; document.documentElement.classList.remove('viewer-on'); if (lastFocus) lastFocus.focus(); }

  groups.forEach(function (g) {
    var figs = g.querySelectorAll('figure');
    figs.forEach(function (f, k) {
      var im = f.querySelector('img');
      im.setAttribute('tabindex', '0'); im.setAttribute('role', 'button');
      function open() {
        if (!box) build();
        items = Array.prototype.map.call(figs, function (x) { var i2 = x.querySelector('img'), c = x.querySelector('figcaption'); return { src: i2.getAttribute('src'), alt: i2.alt, cap: c ? c.textContent : i2.alt }; });
        lastFocus = im; box.hidden = false; document.documentElement.classList.add('viewer-on');
        show(k); box.querySelector('.viewer-close').focus();
      }
      im.addEventListener('click', open);
      im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  });
})();

/* Résumé 3D tree (three.js r128, loaded on first use): education is the seed at the root, each résumé section is a branch,
   and each entry is a leaf. Entries are read from the text résumé so the two views never drift apart. */
(function () {
  var tree = document.getElementById('tree'), text = document.getElementById('r-text');
  if (!tree || !text) return;
  var buttons = document.querySelectorAll('[data-mode]'), started = false, api = null;
  var COLORS = { education: '#8A6A3A', awards: '#C2912E', leadership: '#3F7D3A', experience: '#2F6F66', programs: '#86A84F', service: '#B0603A' };

  function setMode(m) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
    tree.hidden = m !== 'tree'; text.hidden = m === 'tree';
    try { localStorage.setItem('resume-mode', m); } catch (e) {}
    if (m === 'tree' && !started) { started = true; load(); }
    if (api) api.resize();
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });

  function load() {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = build;
    s.onerror = fail;
    document.head.appendChild(s);
  }
  function fail() {
    tree.querySelector('.tree-stage').innerHTML = '<p class="mut" style="padding:28px">The 3D view couldn’t load in this browser. The text view has everything.</p>';
  }

  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function read() {
    var secs = [];
    text.querySelectorAll('.r-sec').forEach(function (sec) {
      if (sec.id === 'skills') return;
      var items = [];
      if (sec.id === 'education') {
        var e = sec.querySelector('.edu');
        items.push({ title: txt(e.querySelector('h3')), org: txt(e.querySelector('.gpa')), date: txt(e.querySelector('.when')),
          text: 'AP scores of 5: ' + Array.prototype.map.call(e.querySelectorAll('.pill'), txt).join(', ') });
      }
      sec.querySelectorAll('.tl').forEach(function (el) {
        var parts = txt(el.querySelector('b')).split(' — ');
        items.push({ title: parts[0], org: parts[1] || '', date: txt(el.querySelector('small')), points: Array.prototype.map.call(el.querySelectorAll('li'), txt) });
      });
      sec.querySelectorAll('.aw').forEach(function (el) {
        items.push({ title: txt(el.querySelector('h3')), org: txt(el.querySelector('.org')), date: txt(el.querySelector('.yr')), text: Array.prototype.map.call(el.querySelectorAll('p'), txt).join(' ') });
      });
      secs.push({ id: sec.id, name: txt(sec.querySelector('.kick')), color: COLORS[sec.id] || '#4F7A4A', items: items });
    });
    return secs;
  }

  function el(tag, cls, content) { var n = document.createElement(tag); if (cls) n.className = cls; if (content) n.textContent = content; return n; }

  function build() {
    var T = window.THREE, stage = tree.querySelector('.tree-stage'), tip = stage.querySelector('.tree-tip');
    var card = tree.querySelector('.tree-card'), legend = tree.querySelector('.tree-legend');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { fail(); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    stage.insertBefore(renderer.domElement, stage.firstChild);

    var scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, .1, 100);
    scene.add(new T.HemisphereLight(0xfbf9f3, 0x7a6a48, .8));
    var sun = new T.DirectionalLight(0xffffff, .7); sun.position.set(4, 8, 6); scene.add(sun);
    var ground = new T.Mesh(new T.CircleGeometry(3.4, 64), new T.MeshStandardMaterial({ color: 0xb5a37b, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    for (var ring = 1; ring <= 3; ring++) {
      var rg = new T.Mesh(new T.RingGeometry(ring * 1.05, ring * 1.05 + .015, 96), new T.MeshBasicMaterial({ color: 0x8f7c55 }));
      rg.rotation.x = -Math.PI / 2; rg.position.y = .005; scene.add(rg);
    }
    var g = new T.Group(); scene.add(g);
    var bark = new T.MeshStandardMaterial({ color: 0x6b5235, roughness: .9 });

    function taper(curve, r0, r1, seg) {
      var geo = new T.TubeGeometry(curve, seg, 1, 8, false), pos = geo.attributes.position, v = new T.Vector3();
      for (var i = 0; i <= seg; i++) {
        var t = i / seg, c = curve.getPointAt(t), r = r0 + (r1 - r0) * t;
        for (var j = 0; j <= 8; j++) { var k = i * 9 + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
      }
      pos.needsUpdate = true; geo.computeVertexNormals(); return geo;
    }
    var leafShape = new T.Shape();
    leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(.26, .26, 0, .66); leafShape.quadraticCurveTo(-.26, .26, 0, 0);
    var leafGeo = new T.ShapeGeometry(leafShape, 10);

    var trunk = new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(.1, 1.5, 0), new T.Vector3(-.06, 3, .05), new T.Vector3(0, 4.7, 0)]);
    g.add(new T.Mesh(taper(trunk, .34, .08, 32), bark));
    for (var r = 0; r < 5; r++) {
      var a = r / 5 * Math.PI * 2 + .3;
      var root = new T.CatmullRomCurve3([new T.Vector3(0, .25, 0), new T.Vector3(Math.cos(a) * .55, .06, Math.sin(a) * .55), new T.Vector3(Math.cos(a) * 1.1, -.05, Math.sin(a) * 1.1)]);
      g.add(new T.Mesh(taper(root, .14, .02, 12), bark));
    }

    var secs = read(), branches = secs.filter(function (s) { return s.id !== 'education'; }), leaves = [], active = null, picked = null, hovered = null;
    var up = new T.Vector3(0, 1, 0);

    secs.forEach(function (sec) {
      sec.meshes = [];
      if (sec.id === 'education') {
        sec.angle = 0;
        var seed = new T.Mesh(new T.SphereGeometry(.24, 24, 16), new T.MeshStandardMaterial({ color: sec.color, roughness: .6, transparent: true }));
        seed.position.set(0, .3, .62); seed.scale.set(1, 1.25, 1);
        seed.userData = { sec: sec, item: sec.items[0], base: seed.scale.clone() };
        g.add(seed); leaves.push(seed); sec.meshes.push(seed);
      }
    });
    branches.forEach(function (sec, i) {
      var th = i / branches.length * Math.PI * 2 + .5, h = 1.7 + i * .52, R = 2.2 + (i % 2) * .35;
      sec.angle = th;
      var c = Math.cos(th), s = Math.sin(th);
      var curve = new T.CatmullRomCurve3([new T.Vector3(0, h, 0), new T.Vector3(c * R * .45, h + .4, s * R * .45), new T.Vector3(c * R, h + 1.25, s * R)]);
      g.add(new T.Mesh(taper(curve, .11, .025, 20), bark));
      var side = new T.Vector3(-s, 0, c), n = sec.items.length;
      sec.items.forEach(function (item, k) {
        var t = .28 + .72 * (k + .5) / n, p = curve.getPointAt(t);
        var dir = side.clone().multiplyScalar(k % 2 ? 1 : -1).add(new T.Vector3(c * .35, .55, s * .35)).normalize();
        var at = p.clone().add(dir.clone().multiplyScalar(.32));
        var twig = new T.LineCurve3(p, at);
        g.add(new T.Mesh(new T.TubeGeometry(twig, 2, .012, 5, false), bark));
        var mat = new T.MeshStandardMaterial({ color: sec.color, roughness: .65, side: T.DoubleSide, transparent: true });
        var leaf = new T.Mesh(leafGeo, mat);
        leaf.position.copy(at);
        leaf.quaternion.setFromUnitVectors(up, dir);
        leaf.rotateY((k * 1.7) % 3.1);
        var sc = 1.15 + (k % 3) * .1; leaf.scale.setScalar(sc);
        leaf.userData = { sec: sec, item: item, base: leaf.scale.clone() };
        g.add(leaf); leaves.push(leaf); sec.meshes.push(leaf);
      });
    });

    function showItem(sec, item) {
      card.hidden = false; card.innerHTML = '';
      card.appendChild(el('p', 'label', sec.name + (item.date ? ' · ' + item.date : '')));
      card.appendChild(el('h3', '', item.title));
      if (item.org) card.appendChild(el('p', 'org', item.org));
      if (item.points && item.points.length) { var ul = el('ul'); item.points.forEach(function (p) { ul.appendChild(el('li', '', p)); }); card.appendChild(ul); }
      if (item.text) card.appendChild(el('p', '', item.text));
    }
    function showSection(sec) {
      card.hidden = false; card.innerHTML = '';
      card.appendChild(el('p', 'label', sec.items.length + (sec.items.length === 1 ? ' entry' : ' entries')));
      card.appendChild(el('h3', '', sec.name));
      var list = el('div', 'tree-legend');
      sec.items.forEach(function (item, k) {
        var b = el('button'); b.type = 'button';
        b.appendChild(document.createTextNode(item.title)); b.appendChild(el('small', '', item.date));
        b.addEventListener('click', function () { select(sec.meshes[k]); });
        list.appendChild(b);
      });
      card.appendChild(list);
    }
    function paint() {
      leaves.forEach(function (m) {
        var on = !active || m.userData.sec === active, hot = m === picked || m === hovered;
        m.material.opacity = on ? 1 : .18;
        m.material.emissive = new T.Color(hot ? m.userData.sec.color : 0x000000).multiplyScalar(hot ? .45 : 0);
        m.scale.copy(m.userData.base).multiplyScalar(hot ? 1.3 : 1);
      });
      legend.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(!!active && b.dataset.sec === active.id)); });
    }
    function face(sec) {
      var want = sec.id === 'education' ? Math.PI : sec.angle - Math.PI / 2, d = want - rotY;
      d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      target = rotY + d;
    }
    function select(m) { picked = m; active = m.userData.sec; showItem(active, m.userData.item); face(active); paint(); }

    secs.forEach(function (sec) {
      var b = el('button'); b.type = 'button'; b.dataset.sec = sec.id;
      var sw = el('i'); sw.style.background = sec.color; b.appendChild(sw);
      b.appendChild(document.createTextNode(sec.id === 'education' ? 'Roots: ' + sec.name : sec.name));
      b.appendChild(el('small', '', String(sec.items.length)));
      b.addEventListener('click', function () {
        picked = null;
        if (active === sec) { active = null; card.hidden = true; } else { active = sec; showSection(sec); face(sec); }
        paint();
      });
      legend.appendChild(b);
    });

    var ray = new T.Raycaster(), ptr = new T.Vector2();
    function hit(e) {
      var b = renderer.domElement.getBoundingClientRect();
      ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
      ray.setFromCamera(ptr, camera);
      var found = ray.intersectObjects(leaves.filter(function (m) { return m.material.opacity > .5; }))[0];
      return found ? found.object : null;
    }

    var rotY = -.6, vel = 0, target = null, dragging = false, moved = 0, lastX = 0, visible = true;
    var auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; lastX = e.clientX; target = null; stage.setPointerCapture(e.pointerId); stage.classList.add('drag'); });
    stage.addEventListener('pointermove', function (e) {
      if (dragging) { var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); vel = dx * .008; rotY += vel; return; }
      var m = hit(e);
      if (m !== hovered) { hovered = m; paint(); }
      if (m) {
        var b = stage.getBoundingClientRect();
        tip.hidden = false; tip.textContent = m.userData.item.title; tip.style.left = (e.clientX - b.left) + 'px'; tip.style.top = (e.clientY - b.top) + 'px';
        stage.style.cursor = 'pointer';
      } else { tip.hidden = true; stage.style.cursor = ''; }
    });
    function end(e) {
      if (!dragging) return;
      dragging = false; stage.classList.remove('drag');
      if (moved < 6) { var m = hit(e); if (m) { vel = 0; select(m); } }
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', function () { dragging = false; stage.classList.remove('drag'); });
    stage.addEventListener('pointerleave', function () { if (!dragging) { hovered = null; tip.hidden = true; paint(); } });

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      var z = w < 520 ? 14.5 : w < 760 ? 12.5 : 11;
      camera.position.set(0, 3.9, z); camera.lookAt(0, 2.9, 0); camera.updateProjectionMatrix();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (l) { visible = l[0].isIntersecting; }).observe(stage);
    resize();

    (function loop() {
      requestAnimationFrame(loop);
      if (tree.hidden || !visible) return;
      if (!dragging) {
        if (target !== null) { rotY += (target - rotY) * .08; if (Math.abs(target - rotY) < .001) target = null; }
        else { vel *= .94; rotY += vel + (auto && !picked && !active ? .0016 : 0); }
      }
      g.rotation.y = rotY;
      renderer.render(scene, camera);
    })();

    api = { resize: resize };
  }

  var start = 'text';
  try { start = localStorage.getItem('resume-mode') || 'text'; } catch (e) {}
  if (location.hash === '#tree') start = 'tree';
  setMode(start);
})();
