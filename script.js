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
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
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

  /* badminton: cork, green band, feather skirt with quills */
  var shuttle = new THREE.Group();
  var cork = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xFFFDF8, .5));
  cork.rotation.x = Math.PI; shuttle.add(cork);
  var band = new THREE.Mesh(new THREE.CylinderGeometry(.155, .155, .06, 24), std(0x2E7D3E, .5)); band.position.y = .03; shuttle.add(band);
  var skirt = new THREE.Mesh(new THREE.CylinderGeometry(.4, .15, .58, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7, side: THREE.DoubleSide }));
  skirt.position.y = .35; shuttle.add(skirt);
  var quills = [];
  for (i = 0; i < 16; i++) { var qa = i / 16 * Math.PI * 2; quills.push(new THREE.Vector3(Math.cos(qa) * .155, .06, Math.sin(qa) * .155), new THREE.Vector3(Math.cos(qa) * .405, .64, Math.sin(qa) * .405)); }
  shuttle.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(quills), new THREE.LineBasicMaterial({ color: 0xb8aa98 })));
  var rim2 = new THREE.Mesh(new THREE.TorusGeometry(.4, .012, 6, 32), std(0xd8ccbc, .6)); rim2.rotation.x = Math.PI / 2; rim2.position.y = .64; shuttle.add(rim2);

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

