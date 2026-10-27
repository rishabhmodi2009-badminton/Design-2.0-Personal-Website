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
    var strip = b.closest('.strip-wrap').querySelector('.strip');
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
