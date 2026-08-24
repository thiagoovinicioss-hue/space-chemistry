/* ============================================================
   SPACE CHEMISTRY · loading_scene.js  v2.0
   Cena da tela de loading de idioma — visual fiel ao jogo:
   · Planeta IGUAL ao do menu (tema "bond" do effects3d.js):
     faixas rosa/ciano/dourado com costuras, atmosfera ciano,
     anel listrado dourado e anel de poeira brilhante
   · Nave IGUAL à das transições de chegada entre planetas
     (makeCinematicShip): fuselagem branca, nariz laranja,
     asas finas e chama aditiva
   Fallback em canvas 2D puro quando não há WebGL.
   start() inicia · stop() encerra e libera GPU/memória.
   ============================================================ */
(function () {
  'use strict';

  var running = false;
  var rafId = null;
  var renderer = null;

  /* ---------------- helpers de textura (estilo effects3d) ---------------- */
  function mkCanvas(w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { cv: cv, g: g };
  }

  function shadeVignette(g, W, H) {
    var v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, W * 0.72);
    v.addColorStop(0, 'rgba(10,10,30,0)');
    v.addColorStop(1, 'rgba(10,10,30,0.55)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }

  /* Textura do planeta "bond" — mesmas faixas/costuras do menu */
  function makeBondTextures(THREE) {
    var W = 256, H = 128, i, n;
    var base = mkCanvas(W, H);
    var bands = [
      { y0: 0,    y1: 0.14, c: '#3a2a6b' },
      { y0: 0.14, y1: 0.3,  c: '#ff9df2' },
      { y0: 0.3,  y1: 0.45, c: '#7ff5ff' },
      { y0: 0.45, y1: 0.6,  c: '#ffd166' },
      { y0: 0.6,  y1: 0.76, c: '#59d3ff' },
      { y0: 0.76, y1: 0.92, c: '#c8a2ff' },
      { y0: 0.92, y1: 1,    c: '#3a2a6b' }
    ];
    bands.forEach(function (b) {
      base.g.fillStyle = b.c;
      base.g.fillRect(0, Math.floor(b.y0 * H), W, Math.ceil((b.y1 - b.y0) * H));
    });
    base.g.fillStyle = '#241e4a';
    for (n = 0; n < bands.length - 1; n++) {
      var yy = Math.round(bands[n].y1 * H);
      for (i = 0; i < W; i += 8) {
        base.g.fillRect(i, yy + ((i * 0.13 + n * 3) | 0) % 3 - 1, 8, 2);
      }
    }
    for (n = 0; n < 50; n++) {
      base.g.fillStyle = 'rgba(255,255,255,0.06)';
      base.g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    }
    var em = mkCanvas(W, H);
    for (n = 0; n < 18; n++) {
      em.g.fillStyle = '#ffd9f2';
      em.g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 2, 2);
    }
    shadeVignette(base.g, W, H);
    shadeVignette(em.g, W, H);
    return {
      map: new THREE.CanvasTexture(base.cv),
      emissive: new THREE.CanvasTexture(em.cv)
    };
  }

  function makeRingTexture(THREE) {
    var s = 128, cx = s / 2, cy = s / 2, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    for (var i = 0; i < 46; i++) {
      var r = s / 2 * (0.3 + i * 0.0125);
      var a = 0.08 + 0.8 * Math.abs(Math.sin(i * 0.7));
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(255,215,150,' + a.toFixed(3) + ')';
      g.lineWidth = 1.5;
      g.stroke();
    }
    return new THREE.CanvasTexture(cv);
  }

  function makeGlowTexture(THREE) {
    var s = 64, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  function makeDotTexture(THREE) {
    var s = 32, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(cv);
  }

  function makeNoiseCanvas(W, H) {
    var nc = mkCanvas(W, H);
    for (var i = 0; i < 1400; i++) {
      var v = 118 + ((Math.random() * 60) | 0);
      nc.g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      nc.g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    }
    return nc.cv;
  }

  /* ---------------- Fallback 2D ---------------- */
  function start2D(canvas) {
    var W = canvas.width, H = canvas.height;
    var ctx = canvas.getContext('2d');
    var stars = [];
    for (var i = 0; i < 90; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.4 });
    }
    var BANDS = ['#3a2a6b', '#ff9df2', '#7ff5ff', '#ffd166', '#59d3ff', '#c8a2ff', '#3a2a6b'];
    function frame(t) {
      if (!running) return;
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, W, H);
      for (var k = 0; k < stars.length; k++) {
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(t / 700 + stars[k].x)) * 0.6;
        ctx.fillStyle = '#cfe3ff';
        ctx.beginPath(); ctx.arc(stars[k].x, stars[k].y, stars[k].r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      /* planeta com as faixas do menu */
      var px = W * 0.62, py = H * 0.52, pr = H * 0.27;
      ctx.save();
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.clip();
      for (var b = 0; b < BANDS.length; b++) {
        ctx.fillStyle = BANDS[b];
        var y0 = py - pr + (2 * pr) * (b / BANDS.length) + ((t / 90) % ((2 * pr) / BANDS.length));
        ctx.fillRect(px - pr, y0 - (2 * pr) / BANDS.length, pr * 2, (2 * pr) / BANDS.length + 1);
      }
      ctx.restore();
      /* anel */
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-Math.PI / 2.6 + 1.57);
      for (var ri = 0; ri < 14; ri++) {
        ctx.beginPath();
        ctx.arc(0, 0, pr * (1.35 + ri * 0.05), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,215,150,' + (0.06 + 0.35 * Math.abs(Math.sin(ri * 0.7))).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      /* nave cinematográfica (silhueta fiel: corpo + nariz + asas + chama) */
      var ang = t / 1500;
      var ox = Math.cos(ang) * pr * 2.1, oy = Math.sin(ang) * pr * 0.9;
      var sx = px + ox, sy = py + oy * 0.7 - pr * 0.1;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(oy * 0.7, ox));
      ctx.scale(2.4, 2.4);
      ctx.fillStyle = '#ffb05a';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(-0.95 * 18, -3); ctx.lineTo(-0.95 * 18 - 9 - Math.abs(Math.sin(t / 110)) * 4, 0);
      ctx.lineTo(-0.95 * 18, 3); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e8f0ff';
      ctx.fillRect(-6, -5, 19, 10);
      ctx.fillStyle = '#ff6a3d';
      ctx.beginPath();
      ctx.moveTo(13, -4); ctx.lineTo(22, 0); ctx.lineTo(13, 4); ctx.closePath(); ctx.fill();
      ctx.fillRect(-11, -6, 9, 3); ctx.fillRect(-11, 3, 9, 3);
      ctx.restore();
      rafId = requestAnimationFrame(frame);
    }
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  /* ---------------- Cena 3D (three.js) ---------------- */
  function start3D(container) {
    var THREE = window.THREE;
    var W = container.clientWidth || window.innerWidth;
    var H = container.clientHeight || window.innerHeight;
    var disposables = [];

    function track(res) { disposables.push(res); return res; }

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050914);
    var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
    camera.position.set(0, 7, 44);

    scene.add(new THREE.AmbientLight(0x8899bb, 0.75));
    var sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
    sun.position.set(-40, 30, 30);
    scene.add(sun);

    /* estrelas */
    var starGeo = track(new THREE.BufferGeometry());
    var starPos = new Float32Array(600 * 3);
    for (var i = 0; i < 600; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 340;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 210;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 240 - 60;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, track(new THREE.PointsMaterial({
      color: 0xcfe3ff, size: 0.7, transparent: true, opacity: 0.85
    }))));

    /* ===== PLANETA DO MENU ("bond") ===== */
    var R = 10;
    var planet = new THREE.Group();
    var tex = makeBondTextures(THREE);
    track(tex.map); track(tex.emissive);
    var sphere = track(new THREE.Mesh(
      track(new THREE.SphereGeometry(R, 64, 48)),
      track(new THREE.MeshPhongMaterial({
        map: tex.map,
        emissive: 0x8a3aa0,
        emissiveMap: tex.emissive,
        bumpMap: track(new THREE.CanvasTexture(makeNoiseCanvas(256, 128))),
        bumpScale: 0.3 * R * 0.1,
        specular: 0xffffff,
        shininess: 28
      }))
    ));
    planet.add(sphere);

    var atm = track(new THREE.Mesh(
      track(new THREE.SphereGeometry(R * 1.07, 32, 24)),
      track(new THREE.MeshBasicMaterial({
        color: 0x7ff5ff, transparent: true, opacity: 0.22,
        side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
      }))
    ));
    planet.add(atm);

    var ringTex = track(makeRingTexture(THREE));
    var ring = track(new THREE.Mesh(
      track(new THREE.RingGeometry(R * 1.35, R * 2.05, 96)),
      track(new THREE.MeshBasicMaterial({
        map: ringTex, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false
      }))
    ));
    ring.rotation.x = -Math.PI / 2.6;
    ring.rotation.z = 0.3;
    planet.add(ring);

    /* poeira brilhante (mesmos passos do makeDustRing) */
    var dustColors = [0xff9df2, 0x7ff5ff, 0xffd166];
    var count = 90;
    var dpos = new Float32Array(count * 3);
    var dcol = new Float32Array(count * 3);
    var pc = dustColors.map(function (c) { return new THREE.Color(c); });
    for (var d = 0; d < count; d++) {
      var a = Math.random() * Math.PI * 2;
      var rr = (1.25 + Math.random() * 0.75) * R;
      dpos[d * 3] = Math.cos(a) * rr;
      dpos[d * 3 + 1] = (Math.random() - 0.5) * 0.12 * R;
      dpos[d * 3 + 2] = Math.sin(a) * rr;
      var cc = pc[(Math.random() * pc.length) | 0];
      var bb = 0.6 + Math.random() * 0.4;
      dcol[d * 3] = cc.r * bb; dcol[d * 3 + 1] = cc.g * bb; dcol[d * 3 + 2] = cc.b * bb;
    }
    var dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dcol, 3));
    var dust = track(new THREE.Points(dustGeo, track(new THREE.PointsMaterial({
      size: 0.05 * R, map: track(makeDotTexture(THREE)), transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, vertexColors: true
    }))));
    dust.rotation.x = -0.5;
    planet.add(dust);
    scene.add(planet);

    /* ===== NAVE CINEMATOGRÁFICA (transições de chegada) ===== */
    var bodyMat = track(new THREE.MeshPhongMaterial({ color: 0xe8f0ff, emissive: 0x223344 }));
    var accentMat = track(new THREE.MeshPhongMaterial({ color: 0xff6a3d, emissive: 0x772200 }));
    var glowTex = track(makeGlowTexture(THREE));
    var ship = new THREE.Group();
    var hull = track(new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.3, 1.0)), bodyMat));
    ship.add(hull);
    var nose = track(new THREE.Mesh(track(new THREE.ConeGeometry(0.2, 0.5, 4)), accentMat));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 0.75);
    ship.add(nose);
    var wingL = track(new THREE.Mesh(track(new THREE.BoxGeometry(0.5, 0.05, 0.42)), accentMat));
    wingL.position.set(-0.36, 0, -0.22); wingL.rotation.z = 0.25;
    var wingR = track(new THREE.Mesh(track(new THREE.BoxGeometry(0.5, 0.05, 0.42)), accentMat.clone()));
    wingR.position.set(0.36, 0, -0.22); wingR.rotation.z = -0.25;
    ship.add(wingL); ship.add(wingR);
    var flame = new THREE.Sprite(track(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffb05a, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending
    })));
    flame.position.set(0, 0, -0.95);
    flame.scale.set(0.6, 0.6, 1);
    ship.add(flame);
    ship.scale.set(2.6, 2.6, 2.6);
    scene.add(ship);

    /* órbita inclinada em torno do planeta */
    var ORBIT_RX = R * 2.15, ORBIT_RZ = R * 1.25, TILT_Y = 1.6, TILT_Z = -0.16;
    var t0 = performance.now();

    function frame() {
      if (!running) return;
      var t = (performance.now() - t0) / 1000;
      planet.rotation.y = t * 0.12;

      var ang = t * 0.5;
      var px = Math.cos(ang) * ORBIT_RX;
      var py = Math.sin(ang * 0.9) * 2.6 + TILT_Y;
      var pz = Math.sin(ang) * ORBIT_RZ;
      ship.position.set(px, py, pz);
      /* rotação da órbita no plano inclinado */
      ship.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), TILT_Z);

      var ahead = ang + 0.07;
      var ax = Math.cos(ahead) * ORBIT_RX;
      var ay = Math.sin(ahead * 0.9) * 2.6 + TILT_Y;
      var az = Math.sin(ahead) * ORBIT_RZ;
      var aheadV = new THREE.Vector3(ax, ay, az).applyAxisAngle(new THREE.Vector3(0, 0, 1), TILT_Z);
      ship.lookAt(aheadV);   /* o nariz (+z) aponta para onde vai */

      flame.material.opacity = 0.75 + Math.abs(Math.sin(t * 7)) * 0.25;

      camera.position.x = Math.sin(t * 0.08) * 4;
      camera.lookAt(0, 1, 0);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }
    running = true;
    frame();

    return { disposables: disposables };
  }

  window.LoadingScene = {
    version: '2.0.0',
    start: function () {
      this.stop();
      var el = document.getElementById('loading-scene');
      if (!el) return null;
      running = true;
      if (window.THREE && window.THREE.WebGLRenderer) {
        try {
          this._handle = start3D(el);
          return { is3D: true };
        } catch (e) { /* WebGL indisponível -> fallback */ }
      }
      var canvas = document.getElementById('loading-canvas-2d');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'loading-canvas-2d';
        canvas.width = 900; canvas.height = 560;
        el.appendChild(canvas);
      }
      start2D(canvas);
      return { is3D: false };
    },
    stop: function () {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (renderer) {
        var cv = renderer.domElement;
        renderer.dispose();
        if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
        renderer = null;
      }
      if (this._handle && this._handle.disposables) {
        this._handle.disposables.forEach(function (r) {
          try {
            if (r.dispose) r.dispose();
            if (r.geometry) r.geometry.dispose();
            if (r.material) {
              (Array.isArray(r.material) ? r.material : [r.material]).forEach(function (m) {
                if (m.map && m.map.dispose) m.map.dispose();
                m.dispose();
              });
            }
          } catch (e) {}
        });
        this._handle = null;
      }
      var c = document.getElementById('loading-canvas-2d');
      if (c && c.parentNode) c.parentNode.removeChild(c);
    }
  };
})();
