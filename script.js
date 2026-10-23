document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = String(new Date().getFullYear());
});

(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach(function (el) { io.observe(el); });

  var counters = new IntersectionObserver(function (list) {
    list.forEach(function (en) {
      if (!en.isIntersecting) return;
      counters.unobserve(en.target);
      var el = en.target, to = +el.getAttribute('data-count'), t0 = performance.now();
      (function tick(t) {
        var k = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + (el.getAttribute('data-suffix') || '');
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: .4 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counters.observe(el); });
})();

/* 3D hero (three.js r128): the EcoBean kit in the middle, with a shuttlecock, an AI chip and a Project Wish heart orbiting it */
(function () {
  var THREE = window.THREE, stage = document.querySelector('.stage[data-scene="kit"]');
  if (!THREE || !stage) return;
  function std(color, rough, metal) { return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? .6 : rough, metalness: metal || 0 }); }

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'gl';
  stage.appendChild(renderer.domElement);
  stage.classList.add('has-gl');

  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1, .1, 60);
  cam.position.set(0, 1.6, 7.2); cam.lookAt(0, .2, 0);
  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x8a6a4a, 1.05));
  var key = new THREE.DirectionalLight(0xffffff, .95); key.position.set(4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xffd9b0, .45); rim.position.set(-5, 3, -4); scene.add(rim);
  var ground = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), new THREE.ShadowMaterial({ opacity: .16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.05; ground.receiveShadow = true; scene.add(ground);

  function newsTexture() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    var x = c.getContext('2d');
    x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 1024, 256);
    x.fillStyle = '#2b1d14';
    x.font = 'bold 44px Georgia'; x.fillText('THE DAILY SPROUT', 30, 56); x.fillText('GREEN NEWS', 560, 56);
    x.fillRect(30, 70, 960, 3);
    x.globalAlpha = .55;
    for (var col = 0; col < 8; col++) for (var row = 0; row < 12; row++) x.fillRect(30 + col * 122, 90 + row * 13, 90 + (row * 37 + col * 11) % 28, 5);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    return t;
  }
  function bean() {
    var g = new THREE.Group();
    var b = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 14), std(0x5a3520, .45));
    b.scale.set(1, .72, 1.35); b.castShadow = true; g.add(b);
    var crease = new THREE.Mesh(new THREE.BoxGeometry(.022, .014, .27), std(0x24130a, .8));
    crease.position.y = .083; g.add(crease);
    return g;
  }

  var world = new THREE.Group(); scene.add(world);
  var root = new THREE.Group(); world.add(root);
  var can = new THREE.Group(); root.add(can);
  var body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.9, 64, 1, true), std(0x9fb3b8, .28, .85));
  body.material.side = THREE.DoubleSide; body.castShadow = true; can.add(body);
  for (var i = -2; i <= 2; i++) { var rib = new THREE.Mesh(new THREE.TorusGeometry(1.004, .018, 8, 64), std(0xb8c8cc, .3, .9)); rib.rotation.x = Math.PI / 2; rib.position.y = i * .17 - .55; can.add(rib); }
  var lip = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 12, 64), std(0xc5d3d6, .25, .9)); lip.rotation.x = Math.PI / 2; lip.position.y = .95; can.add(lip);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(1, .96, .08, 64), std(0x8aa0a6, .3, .85)); base.position.y = -.98; can.add(base);
  var sleeve = new THREE.Mesh(new THREE.CylinderGeometry(1.025, 1.025, .95, 64, 1, true), new THREE.MeshStandardMaterial({ map: newsTexture(), roughness: .9, side: THREE.DoubleSide }));
  sleeve.position.y = .05; sleeve.castShadow = true; can.add(sleeve);
  var twine = new THREE.Mesh(new THREE.TorusGeometry(1.04, .03, 8, 64), std(0xb98a52, .8)); twine.rotation.x = Math.PI / 2; twine.position.y = .3; can.add(twine);
  var tag = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .02), std(0x2E7D3E, .6)); tag.position.set(.55, .1, .9); tag.rotation.y = .5; can.add(tag);
  var soil = new THREE.Mesh(new THREE.CylinderGeometry(.97, .97, .06, 64), std(0x2a1a10, .95)); soil.position.y = .86; can.add(soil);

  var crumbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035, 0), std(0x3d2414, .9), 180);
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (i = 0; i < 180; i++) {
    var a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * .92, s = .6 + Math.random() * .9;
    e.set(Math.random() * 3, Math.random() * 3, 0); q.setFromEuler(e); sc.set(s, s, s);
    v.set(Math.cos(a) * rr, .9 + Math.random() * .04, Math.sin(a) * rr); m4.compose(v, q, sc); crumbs.setMatrixAt(i, m4);
  }
  can.add(crumbs);

  var stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .88, 0), new THREE.Vector3(.05, 1.4, .02), new THREE.Vector3(-.06, 1.95, -.03), new THREE.Vector3(.04, 2.45, 0)]);
  var stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 48, .045, 10, false), std(0x4FA35C, .55));
  stem.castShadow = true; root.add(stem);
  var leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.bezierCurveTo(.22, .12, .3, .45, 0, .78); leafShape.bezierCurveTo(-.3, .45, -.22, .12, 0, 0);
  var leafGeo = new THREE.ShapeGeometry(leafShape, 24), leaves = [];
  var spots = [[.3, .2, 1.05], [.52, 2.9, .95], [.74, .9, 1.15], [.92, 3.8, 1.25], [1, 5.6, .9]];
  spots.forEach(function (sp, k) {
    var pivot = new THREE.Group(); pivot.position.copy(stemCurve.getPoint(sp[0])); pivot.rotation.y = sp[1];
    var leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: k % 2 ? 0x58B061 : 0x4FA35C, roughness: .5, side: THREE.DoubleSide }));
    leaf.rotation.z = -1.05; leaf.castShadow = true;
    pivot.add(leaf); root.add(pivot); leaves.push({ pivot: pivot, leaf: leaf, at: sp[0], size: sp[2] });
  });
  var beans = [];
  for (i = 0; i < 7; i++) { var b = bean(); b.userData = { a: i / 7 * Math.PI * 2, r: 1.75 + (i % 3) * .22, y: -.3 + (i % 4) * .45, s: .8 + (i % 3) * .2 }; root.add(b); beans.push(b); }
  root.scale.setScalar(.6); root.position.y = -.42;

  function label(txt, bg, fg) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = fg; x.globalAlpha = .35; x.lineWidth = 6; x.strokeRect(28, 28, 200, 200); x.globalAlpha = 1;
    x.fillStyle = fg; x.font = 'bold 110px Menlo, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 136);
    return new THREE.CanvasTexture(c);
  }

  /* badminton: leather-capped cork, green tape, 16 overlapping feathers held by two thread rings */
  var shuttle = new THREE.Group();
  var cork = new THREE.Mesh(new THREE.SphereGeometry(.15, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xFFFDF8, .45));
  shuttle.add(cork);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .09, 32), std(0xFFFDF8, .45)); base.position.y = .045; shuttle.add(base);
  var tape = new THREE.Mesh(new THREE.CylinderGeometry(.153, .153, .035, 32), std(0x2E7D3E, .5)); tape.position.y = .07; shuttle.add(tape);
  var vane = new THREE.Shape();
  vane.moveTo(-.02, 0); vane.lineTo(-.068, .4); vane.quadraticCurveTo(-.07, .52, 0, .54); vane.quadraticCurveTo(.07, .52, .068, .4); vane.lineTo(.02, 0);
  var vaneGeo = new THREE.ShapeGeometry(vane, 12), tilt = .34, R0 = .12, Y0 = .08;
  var featherM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2a2a2a, roughness: .55, side: THREE.DoubleSide });
  var shaftM = std(0xd9cfc2, .5), shaftGeo = new THREE.CylinderGeometry(.004, .006, .44, 6);
  for (i = 0; i < 16; i++) {
    var arm = new THREE.Group(); arm.rotation.y = i / 16 * Math.PI * 2; arm.position.y = Y0;
    var f = new THREE.Group(); f.position.z = R0 + (i % 2) * .006; f.rotation.x = tilt;
    f.add(new THREE.Mesh(vaneGeo, featherM));
    var shaft = new THREE.Mesh(shaftGeo, shaftM); shaft.position.set(0, .22, .003); f.add(shaft);
    arm.add(f); shuttle.add(arm);
  }
  [.17, .29].forEach(function (h) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(R0 + h * Math.sin(tilt) + .008, .009, 6, 48), std(0x24543a, .6));
    ring.rotation.x = Math.PI / 2; ring.position.y = Y0 + h * Math.cos(tilt); shuttle.add(ring);
  });
  shuttle.scale.setScalar(1.1);

  /* AI: a chip with pins and an "AI" die */
  var chip = new THREE.Group(), side = std(0x174f5c, .4, .2);
  var die = new THREE.Mesh(new THREE.BoxGeometry(.66, .12, .66), [side, side, new THREE.MeshStandardMaterial({ map: label('AI', '#1F6E80', '#FFF6E8'), roughness: .45 }), side, side, side]);
  chip.add(die);
  var pin = new THREE.BoxGeometry(.06, .03, .14), pinM = std(0xc5d3d6, .25, .9);
  for (i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
    var p = new THREE.Mesh(pin, pinM), off = (j - 1.5) * .15;
    if (i < 2) p.position.set(off, -.02, (i ? 1 : -1) * .39); else { p.rotation.y = Math.PI / 2; p.position.set((i === 3 ? 1 : -1) * .39, -.02, off); }
    chip.add(p);
  }

  /* Project Wish: a heart with a little wishing star */
  var wish = new THREE.Group();
  var hs = new THREE.Shape(); hs.moveTo(0, -.35); hs.bezierCurveTo(-.55, .05, -.3, .48, 0, .2); hs.bezierCurveTo(.3, .48, .55, .05, 0, -.35);
  var heartGeo = new THREE.ExtrudeGeometry(hs, { depth: .14, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 3 }); heartGeo.center();
  var heart = new THREE.Mesh(heartGeo, std(0xB04A22, .45)); heart.scale.setScalar(1.15); wish.add(heart);
  var ss = new THREE.Shape();
  for (i = 0; i < 10; i++) { var sa = i / 10 * Math.PI * 2 - Math.PI / 2, sr = i % 2 ? .07 : .16; if (i) ss.lineTo(Math.cos(sa) * sr, Math.sin(sa) * sr); else ss.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr); }
  var starGeo = new THREE.ExtrudeGeometry(ss, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1 }); starGeo.center();
  var star = new THREE.Mesh(starGeo, std(0xE2A93B, .4, .2)); star.position.set(.34, .32, .05); wish.add(star);

  var orbit = [shuttle, chip, wish];
  orbit.forEach(function (o, k) { o.userData = { a: k / 3 * Math.PI * 2 + .5, y: .15 + (k % 2) * .35 }; world.add(o); });

  var grow = 0, spin = 1, total = stem.geometry.index.count;
  stage.addEventListener('click', function () { grow = 0; spin = 6; });

  function size() { var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); new ResizeObserver(size).observe(stage);

  var ptr = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
  stage.addEventListener('pointermove', function (ev) { var r = stage.getBoundingClientRect(); tgt.x = (ev.clientX - r.left) / r.width * 2 - 1; tgt.y = (ev.clientY - r.top) / r.height * 2 - 1; });
  stage.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; });

  var visible = true, running = false, t = 0, last = performance.now();
  new IntersectionObserver(function (l) { visible = l[0].isIntersecting; if (visible && !running) { last = performance.now(); loop(); } }).observe(stage);
  function loop() {
    if (!visible) { running = false; return; }
    running = true;
    var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    ptr.x += (tgt.x - ptr.x) * .06; ptr.y += (tgt.y - ptr.y) * .06;
    grow = Math.min(1, grow + dt * .45);
    var g = 1 - Math.pow(1 - grow, 3);
    stem.geometry.setDrawRange(0, Math.floor(total * g / 6) * 6);
    leaves.forEach(function (L, k) {
      var on = Math.max(0, Math.min(1, (g - L.at + .12) / .2));
      L.leaf.scale.setScalar(L.size * (1 - Math.pow(1 - on, 3)) + .0001);
      L.pivot.rotation.x = Math.sin(t * 1.3 + k) * .08 + ptr.y * .12;
      L.pivot.rotation.z = Math.cos(t * 1.1 + k * .7) * .06;
    });
    beans.forEach(function (bn) {
      var u = bn.userData; u.a += dt * .35;
      bn.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 1.4 + u.a * 2) * .14, Math.sin(u.a) * u.r);
      bn.rotation.set(t * .7 + u.a, t * .5, u.a); bn.scale.setScalar(u.s);
    });
    spin += (1 - spin) * dt * 1.2;
    orbit.forEach(function (o, k) {
      var u = o.userData; u.a += dt * .38 * spin;
      o.position.set(Math.cos(u.a) * 1.75, u.y + Math.sin(t * 1.3 + k * 2) * .14, Math.sin(u.a) * 1.4);
    });
    shuttle.rotation.set(.45 + Math.sin(t * .9) * .15, t * .8, .35);
    chip.rotation.set(.95 + Math.sin(t * 1.1) * .12, t * .6, 0);
    wish.rotation.set(Math.sin(t * .8) * .15, Math.sin(t * .7) * .7, Math.sin(t * 1.2) * .1);
    root.rotation.y += (t * .12 - root.rotation.y) * .04;
    world.rotation.y += (ptr.x * .45 - world.rotation.y) * .04;
    world.rotation.x += (ptr.y * .12 - world.rotation.x) * .05;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
})();


/* 3D research hero: the coffee-ground fertilizer flask (current research) circled by the four past papers; drag to spin, tap an object to see its paper, tap the flask to make it erupt */
(function () {
  var THREE = window.THREE, stage = document.querySelector('.stage[data-scene="flask"]');
  if (!THREE || !stage) return;
  function std(color, rough, metal) { return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? .6 : rough, metalness: metal || 0 }); }

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.className = 'gl';
  stage.appendChild(renderer.domElement);
  stage.classList.add('has-gl');

  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, .1, 60);
  cam.position.set(0, 1.5, 7); cam.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x8a6a4a, 1.05));
  var key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 5); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffd9b0, .5); rim.position.set(-5, 3, -4); scene.add(rim);

  var world = new THREE.Group(); scene.add(world);
  var root = new THREE.Group(); world.add(root);

  /* glass Erlenmeyer flask and the coffee liquid inside it */
  function wall(y) { return y < .2 ? .98 : y > 1.25 ? .3 : .98 - (y - .2) / 1.05 * .68; }
  var glassPts = [[0, 0], [.86, 0], [.96, .07], [.98, .2], [.3, 1.25], [.3, 1.9], [.37, 1.95], [.37, 2]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var glass = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 48), new THREE.MeshStandardMaterial({ color: 0xe8f4f0, roughness: .08, metalness: .1, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false }));
  var LEVEL = .8;
  var liquidPts = [[0, .04], [.82, .04], [.91, .1], [.93, .2], [wall(LEVEL) - .05, LEVEL]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidPts, 48), new THREE.MeshStandardMaterial({ color: 0x6b3f22, roughness: .25, transparent: true, opacity: .9 }));
  var surface = new THREE.Mesh(new THREE.CircleGeometry(wall(LEVEL) - .05, 48), new THREE.MeshStandardMaterial({ color: 0x8a5631, roughness: .2 }));
  surface.rotation.x = -Math.PI / 2; surface.position.y = LEVEL;
  root.add(liquid, surface, glass);
  var lip = new THREE.Mesh(new THREE.TorusGeometry(.36, .03, 10, 40), new THREE.MeshStandardMaterial({ color: 0xe8f4f0, transparent: true, opacity: .55, roughness: .1 }));
  lip.rotation.x = Math.PI / 2; lip.position.y = 2; root.add(lip);
  var label = new THREE.Mesh(new THREE.CylinderGeometry(.62, .78, .32, 40, 1, true), std(0xFFFDF8, .7));
  label.material.side = THREE.DoubleSide; label.position.y = .58; root.add(label);

  /* seedling growing out of the neck */
  var stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(.04, 1.9, .02), new THREE.Vector3(-.05, 2.35, 0), new THREE.Vector3(.02, 2.7, 0)]);
  var stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 40, .035, 8, false), std(0x4FA35C, .55)); root.add(stem);
  var leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.bezierCurveTo(.22, .12, .3, .45, 0, .78); leafShape.bezierCurveTo(-.3, .45, -.22, .12, 0, 0);
  var leafGeo = new THREE.ShapeGeometry(leafShape, 20), leaves = [];
  [[.8, 0, .75, 0x58B061], [.97, Math.PI, .9, 0x4FA35C], [.62, 1.7, .55, 0x58B061]].forEach(function (L) {
    var pivot = new THREE.Group(); pivot.position.copy(stemCurve.getPoint(L[0])); pivot.rotation.y = L[1];
    var leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: L[3], roughness: .5, side: THREE.DoubleSide }));
    leaf.rotation.z = -1.05; leaf.scale.setScalar(L[2]); pivot.add(leaf); root.add(pivot); leaves.push(pivot);
  });

  /* bubbles rising through the liquid */
  var bubbleM = new THREE.MeshStandardMaterial({ color: 0xf3d9b8, roughness: .15, transparent: true, opacity: .75 }), bubbles = [];
  for (var i = 0; i < 26; i++) {
    var b = new THREE.Mesh(new THREE.SphereGeometry(.035 + Math.random() * .03, 10, 8), bubbleM);
    b.userData = { a: Math.random() * Math.PI * 2, r: Math.random(), y: Math.random() * LEVEL, sp: .25 + Math.random() * .35 };
    root.add(b); bubbles.push(b);
  }

  /* past papers orbiting the flask: card and coins (cashless society), a marked-down price tag (price anchoring), a tipped scale (AI bias) */
  function textTex(draw, w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }

  var cash = new THREE.Group();
  var cardTex = textTex(function (x, w, h) {
    x.fillStyle = '#1F6E80'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#E2A93B'; x.fillRect(34, 62, 62, 48);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 30px Menlo, monospace'; x.fillText('•••• 2026', 34, 178);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(w - 70, 60, 26, 0, 7); x.fill(); x.beginPath(); x.arc(w - 46, 60, 26, 0, 7); x.fill();
  }, 384, 240);
  var cardEdge = std(0x17596a, .4);
  var card = new THREE.Mesh(new THREE.BoxGeometry(.9, .56, .025), [cardEdge, cardEdge, cardEdge, cardEdge, new THREE.MeshStandardMaterial({ map: cardTex, roughness: .35 }), cardEdge]);
  card.rotation.z = .18; cash.add(card);
  var coinM = std(0xE2A93B, .3, .55), coinGeo = new THREE.CylinderGeometry(.17, .17, .045, 32);
  for (i = 0; i < 3; i++) { var coin = new THREE.Mesh(coinGeo, coinM); coin.rotation.x = Math.PI / 2; coin.position.set(.42, -.3, .06 + i * .05); cash.add(coin); }

  var tag = new THREE.Group();
  var ts = new THREE.Shape();
  ts.moveTo(-.38, -.22); ts.lineTo(.22, -.22); ts.lineTo(.42, 0); ts.lineTo(.22, .22); ts.lineTo(-.38, .22); ts.closePath();
  var hole = new THREE.Path(); hole.absarc(.26, 0, .045, 0, Math.PI * 2, true); ts.holes.push(hole);
  var tagBody = new THREE.Mesh(new THREE.ExtrudeGeometry(ts, { depth: .04, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1 }), std(0xB04A22, .5));
  tagBody.position.z = -.02; tag.add(tagBody);
  var priceTex = textTex(function (x, w, h) {
    x.fillStyle = '#B04A22'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,253,248,.75)'; x.font = 'bold 54px Georgia'; x.fillText('$40', 20, 78);
    x.strokeStyle = '#FFFDF8'; x.lineWidth = 6; x.beginPath(); x.moveTo(14, 60); x.lineTo(132, 46); x.stroke();
    x.fillStyle = '#FFFDF8'; x.font = 'bold 80px Georgia'; x.fillText('$20', 20, 176);
  }, 256, 200);
  var priceFace = new THREE.Mesh(new THREE.PlaneGeometry(.5, .4), new THREE.MeshStandardMaterial({ map: priceTex, roughness: .5 }));
  priceFace.position.set(-.1, 0, .035); tag.add(priceFace);
  var string = new THREE.Mesh(new THREE.TorusGeometry(.12, .008, 6, 24, Math.PI * 1.4), std(0xFFFDF8, .6));
  string.position.set(.36, .06, 0); string.rotation.z = -.9; tag.add(string);

  var scale = new THREE.Group(), brass = std(0xE2A93B, .3, .5), wood = std(0x523624, .6);
  var foot = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, .06, 28), wood); foot.position.y = -.5; scale.add(foot);
  var post = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .78, 10), brass); post.position.y = -.1; scale.add(post);
  var beam = new THREE.Group(); beam.position.y = .28; beam.rotation.z = -.22; scale.add(beam);
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(.9, .035, .035), brass));
  [-1, 1].forEach(function (side) {
    var hang = new THREE.Group(); hang.position.x = side * .43; beam.add(hang);
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .28, 6), brass); rod.position.y = -.14; hang.add(rod);
    var pan = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .04, 24), brass); pan.position.y = -.3; hang.add(pan);
    hang.rotation.z = .22;
    if (side > 0) { var weight = new THREE.Mesh(new THREE.BoxGeometry(.14, .14, .14), std(0x1F6E80, .4)); weight.position.y = -.21; hang.add(weight); }
  });

  /* air conditioner with cool airflow (AI and cooling article) */
  var ac = new THREE.Group(), white = std(0xFFFDF8, .45), slatM = std(0xd9cfc2, .5);
  var acBody = new THREE.Mesh(new THREE.BoxGeometry(1, .34, .28), white); ac.add(acBody);
  for (i = 0; i < 4; i++) { var slat = new THREE.Mesh(new THREE.BoxGeometry(.86, .012, .02), slatM); slat.position.set(0, -.1 + i * .025, .145); ac.add(slat); }
  var led = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 10), new THREE.MeshStandardMaterial({ color: 0x4FA3D8, emissive: 0x4FA3D8, emissiveIntensity: .8 })); led.position.set(.4, .08, .145); ac.add(led);
  var airM = new THREE.MeshStandardMaterial({ color: 0xBFE3F2, transparent: true, opacity: .7, roughness: .3 }), airs = [];
  for (i = 0; i < 3; i++) { var air = new THREE.Mesh(new THREE.TorusGeometry(.16 + i * .02, .012, 6, 24, Math.PI), airM); air.rotation.z = Math.PI; air.position.set(-.28 + i * .28, -.3, .1); ac.add(air); airs.push(air); }

  var papers = [cash, tag, scale, ac];
  var PAPERS = [
    { title: 'Should we fear a cashless society?', kind: 'John Locke essay', doc: 'docs/cashless-society-essay.pdf' },
    { title: 'Why price tags trick us', kind: 'Price anchoring paper', doc: 'docs/price-anchoring-paper.pdf' },
    { title: 'How do biases get into AI?', kind: 'AI bias research', doc: 'docs/ai-bias-project.pdf' },
    { title: 'Can AI save more energy than it consumes?', kind: 'AI and cooling article', doc: 'docs/ai-cooling-article.pdf' }
  ];
  papers.forEach(function (m, k) { m.userData = { a: k / 4 * Math.PI * 2 + .4, y: .4 + k * .42, base: k === 2 ? 1.25 : 1.1, pop: 0 }; m.scale.setScalar(m.userData.base); world.add(m); });

  /* bubbles that spray out of the neck when the flask is tapped */
  var sprayM = new THREE.MeshStandardMaterial({ color: 0xf3d9b8, roughness: .15, transparent: true, opacity: .85 }), spray = [];
  for (i = 0; i < 22; i++) { var sp = new THREE.Mesh(new THREE.SphereGeometry(.04 + Math.random() * .04, 10, 8), sprayM); sp.visible = false; sp.userData = { v: new THREE.Vector3(), life: 0 }; root.add(sp); spray.push(sp); }
  function erupt() {
    spray.forEach(function (sp) {
      var a = Math.random() * Math.PI * 2, out = .4 + Math.random() * .9;
      sp.position.set(0, 2, 0); sp.userData.v.set(Math.cos(a) * out, 2.2 + Math.random() * 1.6, Math.sin(a) * out); sp.userData.life = 1; sp.visible = true;
    });
  }

  /* caption that names the paper an object stands for */
  var cap = document.createElement('div'); cap.className = 'scene-cap'; cap.hidden = true;
  cap.innerHTML = '<small></small><b></b><a href="#">Read it →</a>';
  stage.parentNode.appendChild(cap);
  var capTimer = null;
  function showCap(k) {
    var p = PAPERS[k], link = document.querySelector('a[data-doc][href="' + p.doc + '"]');
    cap.querySelector('small').textContent = p.kind; cap.querySelector('b').textContent = p.title;
    cap.querySelector('a').onclick = function (e) { e.preventDefault(); if (link) link.click(); };
    cap.hidden = false; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    clearTimeout(capTimer); capTimer = setTimeout(function () { cap.classList.remove('in'); setTimeout(function () { cap.hidden = true; }, 300); }, 4500);
  }

  var fizz = 1;
  function size() { var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); new ResizeObserver(size).observe(stage);

  /* hover tilt, drag to spin with momentum, tap to pick */
  var ptr = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, spin = 0, tilt = 0, vel = 0, drag = null;
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  stage.style.touchAction = 'pan-y';
  stage.addEventListener('pointerdown', function (ev) { drag = { x: ev.clientX, y: ev.clientY, moved: 0, lastX: ev.clientX }; stage.setPointerCapture(ev.pointerId); stage.classList.add('dragging'); });
  stage.addEventListener('pointermove', function (ev) {
    var r = stage.getBoundingClientRect(); tgt.x = (ev.clientX - r.left) / r.width * 2 - 1; tgt.y = (ev.clientY - r.top) / r.height * 2 - 1;
    if (!drag) return;
    var dx = ev.clientX - drag.lastX; drag.lastX = ev.clientX;
    drag.moved += Math.abs(dx) + Math.abs(ev.clientY - drag.y) * .1;
    spin += dx * .012; vel = dx * .012;
    tilt = Math.max(-.35, Math.min(.35, (ev.clientY - drag.y) * .004));
  });
  function release(ev) {
    if (!drag) return;
    var tap = drag.moved < 6; drag = null; stage.classList.remove('dragging');
    if (!tap) return;
    vel = 0;
    var r = stage.getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height * 2 - 1));
    ray.setFromCamera(ndc, cam);
    var hits = ray.intersectObjects(papers.concat([glass, liquid, surface, label, stem]), true);
    if (!hits.length) { fizz = 4; return; }
    var o = hits[0].object;
    while (o && papers.indexOf(o) < 0 && o !== root && o.parent) o = o.parent;
    var k = papers.indexOf(o);
    if (k >= 0) { papers[k].userData.pop = 1; showCap(k); }
    else { fizz = 5; erupt(); }
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', function () { drag = null; stage.classList.remove('dragging'); });
  stage.addEventListener('pointerleave', function () { if (!drag) { tgt.x = 0; tgt.y = 0; } });

  var visible = true, running = false, t = 0, last = performance.now();
  new IntersectionObserver(function (l) { visible = l[0].isIntersecting; if (visible && !running) { last = performance.now(); loop(); } }).observe(stage);
  function loop() {
    if (!visible) { running = false; return; }
    running = true;
    var now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    ptr.x += (tgt.x - ptr.x) * .06; ptr.y += (tgt.y - ptr.y) * .06;
    fizz += (1 - fizz) * dt * .8;
    if (!drag) { spin += vel; vel *= .94; tilt *= .95; }
    bubbles.forEach(function (b) {
      var u = b.userData; u.y += dt * u.sp * fizz;
      if (u.y > LEVEL - .03) { u.y = .06; u.a = Math.random() * Math.PI * 2; u.r = Math.random(); }
      var rr = (wall(u.y) - .14) * Math.sqrt(u.r);
      b.position.set(Math.cos(u.a) * rr + Math.sin(t * 3 + u.a) * .02, u.y, Math.sin(u.a) * rr);
    });
    spray.forEach(function (sp) {
      var u = sp.userData; if (u.life <= 0) { sp.visible = false; return; }
      u.v.y -= dt * 4.5; sp.position.addScaledVector(u.v, dt); u.life -= dt * .8; sp.scale.setScalar(Math.max(.01, u.life));
    });
    leaves.forEach(function (p, k) { p.rotation.x = Math.sin(t * 1.3 + k) * .1 + (fizz - 1) * .04; p.rotation.z = Math.cos(t * 1.1 + k) * .06; });
    airs.forEach(function (a, k) { var f = (t * .8 + k / 3) % 1; a.position.y = -.25 - f * .35; a.material.opacity = .75 * (1 - f); });
    papers.forEach(function (m, k) {
      var u = m.userData; u.a += dt * .3 * (1 + (fizz - 1) * .4);
      u.pop = Math.max(0, u.pop - dt * .7);
      var p = Math.sin(u.pop * Math.PI);
      m.position.set(Math.cos(u.a) * 1.55 * (1 - p * .45), u.y + Math.sin(t * 1.2 + k * 2) * .12 + p * .2, Math.sin(u.a) * 1.15 + p * .9);
      m.scale.setScalar(u.base * (1 + p * .35));
      m.rotation.set(Math.sin(t * .8 + k) * .15, Math.sin(t * .6 + k) * .45 - world.rotation.y + (1 - u.pop) * (u.pop > 0 ? Math.PI * 2 : 0), Math.sin(t * .7 + k) * .08);
    });
    root.rotation.y = t * .25;
    world.rotation.y += (ptr.x * .3 + spin - world.rotation.y) * .08;
    world.rotation.x += (ptr.y * .1 + tilt - world.rotation.x) * .06;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
})();

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
