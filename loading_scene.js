/* ============================================================
   SPACE CHEMISTRY · loading_scene.js  v1.0
   Cena da tela de loading: nave navegando ao redor de um
   planeta em 3D (three.js) com fallback em canvas 2D puro.
   start() -> inicia o loop; stop() -> encerra e libera GPU.
   ============================================================ */
(function () {
  'use strict';

  var running = false;
  var rafId = null;
  var renderer = null, scene3 = null, camera = null, ship = null, planet = null;
  var ctx2d = null, stars2d = null;

  /* ---------------- Fallback 2D ---------------- */
  function start2D(canvas) {
    var W = canvas.width, H = canvas.height;
    ctx2d = canvas.getContext('2d');
    var i;
    stars2d = [];
    for (i = 0; i < 90; i++) {
      stars2d.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.4, a: Math.random() });
    }
    function frame(t) {
      if (!running) return;
      var g = ctx2d.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#050914');
      g.addColorStop(1, '#0a1230');
      ctx2d.fillStyle = g;
      ctx2d.fillRect(0, 0, W, H);
      for (i = 0; i < stars2d.length; i++) {
        var s = stars2d[i];
        ctx2d.globalAlpha = 0.4 + Math.abs(Math.sin(t / 700 + s.x)) * 0.6;
        ctx2d.fillStyle = '#cfe3ff';
        ctx2d.beginPath();
        ctx2d.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
      /* planeta */
      var px = W * 0.62, py = H * 0.55, pr = H * 0.26;
      var pg = ctx2d.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.15, px, py, pr);
      pg.addColorStop(0, '#7fd4ff');
      pg.addColorStop(0.55, '#2b6fd8');
      pg.addColorStop(1, '#101f4e');
      ctx2d.fillStyle = pg;
      ctx2d.beginPath(); ctx2d.arc(px, py, pr, 0, Math.PI * 2); ctx2d.fill();
      /* anel do planeta */
      ctx2d.strokeStyle = 'rgba(160,200,255,0.5)';
      ctx2d.lineWidth = 3;
      ctx2d.beginPath();
      ctx2d.ellipse(px, py, pr * 1.55, pr * 0.42, -0.42, 0, Math.PI * 2);
      ctx2d.stroke();
      /* nave orbitando */
      var ang = t / 1400;
      var ox = Math.cos(ang) * pr * 1.9, oy = Math.sin(ang) * pr * 0.85;
      var sx = px + ox, sy = py + oy * 0.75 - pr * 0.15;
      ctx2d.save();
      ctx2d.translate(sx, sy);
      ctx2d.rotate(Math.atan2(oy * 0.75, ox));
      ctx2d.fillStyle = '#eaf4ff';
      ctx2d.beginPath();
      ctx2d.moveTo(14, 0); ctx2d.lineTo(-9, 8); ctx2d.lineTo(-5, 0); ctx2d.lineTo(-9, -8);
      ctx2d.closePath(); ctx2d.fill();
      ctx2d.fillStyle = '#59d3ff';
      ctx2d.beginPath();
      ctx2d.moveTo(-5, 0); ctx2d.lineTo(-16 - Math.abs(Math.sin(t / 120)) * 7, 3);
      ctx2d.lineTo(-16 - Math.abs(Math.sin(t / 120)) * 7, -3);
      ctx2d.closePath(); ctx2d.fill();
      ctx2d.restore();
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

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    scene3 = new THREE.Scene();
    scene3.background = new THREE.Color(0x050914);
    camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 400);
    camera.position.set(0, 10, 46);
    camera.lookAt(0, 0, 0);

    /* luzes */
    scene3.add(new THREE.AmbientLight(0x334466, 0.9));
    var sun = new THREE.DirectionalLight(0xfff3d6, 1.25);
    sun.position.set(-40, 30, 25);
    scene3.add(sun);

    /* campo de estrelas */
    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(600 * 3);
    for (var i = 0; i < 600; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 320;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 240 - 60;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene3.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xcfe3ff, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.85
    })));

    /* planeta */
    planet = new THREE.Group();
    var globeMat = new THREE.MeshStandardMaterial({
      color: 0x2b6fd8, roughness: 0.65, metalness: 0.05,
      emissive: 0x0a1a44, emissiveIntensity: 0.55
    });
    var globe = new THREE.Mesh(new THREE.SphereGeometry(11, 48, 48), globeMat);
    planet.add(globe);

    /* continentes simples (manchas escuras) */
    for (var c = 0; c < 7; c++) {
      var blob = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random() * 2.6, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x1d4fa8, roughness: 0.8 })
      );
      var th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
      blob.position.set(
        10.4 * Math.sin(ph) * Math.cos(th),
        10.4 * Math.cos(ph),
        10.4 * Math.sin(ph) * Math.sin(th)
      );
      planet.add(blob);
    }

    /* atmosfera (halo) */
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(12.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x59d3ff, transparent: true, opacity: 0.12, side: THREE.BackSide })
    );
    planet.add(halo);

    /* anel */
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(16, 21, 64),
      new THREE.MeshBasicMaterial({ color: 0xa0c8ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.35;
    planet.add(ring);
    scene3.add(planet);

    /* nave low-poly */
    ship = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xeaf4ff, roughness: 0.35, metalness: 0.55 });
    var accMat = new THREE.MeshStandardMaterial({ color: 0x59d3ff, roughness: 0.3, metalness: 0.4, emissive: 0x114466, emissiveIntensity: 0.8 });
    var body = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.6, 10), bodyMat);
    body.rotation.x = Math.PI / 2;
    ship.add(body);
    var wingGeo = new THREE.BoxGeometry(3.4, 0.18, 1.1);
    var wingL = new THREE.Mesh(wingGeo, accMat); wingL.position.set(-1.1, 0, -1.1);
    var wingR = new THREE.Mesh(wingGeo.clone(), accMat.clone()); wingR.position.set(1.1, 0, -1.1);
    ship.add(wingL); ship.add(wingR);
    var flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.9 })
    );
    flame.rotation.x = -Math.PI / 2;
    flame.position.z = -3.1;
    ship.userData.flame = flame;
    ship.add(flame);
    scene3.add(ship);

    /* órbita inclinada */
    var ORBIT_RX = 24, ORBIT_RZ = 13, TILT = -0.28;
    var t0 = performance.now();

    function frame() {
      if (!running) return;
      var t = (performance.now() - t0) / 1000;
      planet.rotation.y = t * 0.12;
      var ang = t * 0.55;
      ship.position.set(Math.cos(ang) * ORBIT_RX, Math.sin(ang * 0.9) * 3.4 + 1.5, Math.sin(ang) * ORBIT_RZ);
      /* olha levemente à frente na trajetória */
      var ahead = ang + 0.06;
      ship.lookAt(Math.cos(ahead) * ORBIT_RX, Math.sin(ahead * 0.9) * 3.4 + 1.5, Math.sin(ahead) * ORBIT_RZ);
      ship.rotateY(Math.PI / 2);
      var f = ship.userData.flame;
      if (f) f.scale.y = 1 + Math.abs(Math.sin(t * 7)) * 0.5;
      camera.position.x = Math.sin(t * 0.08) * 4;
      camera.lookAt(0, 1, 0);
      renderer.render(scene3, camera);
      rafId = requestAnimationFrame(frame);
    }
    running = true;
    frame();

    return { renderer: renderer };
  }

  window.LoadingScene = {
    version: '1.0.0',
    start: function () {
      this.stop();
      var el = document.getElementById('loading-scene');
      if (!el) return null;
      running = true;
      if (window.THREE && window.THREE.WebGLRenderer) {
        try {
          var handle = start3D(el);
          return {
            is3D: true,
            stop: function () { if (window.LoadingScene) LoadingScene.stop(); }
          };
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
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
      }
      scene3 = null; camera = null; ship = null; planet = null;
      if (ctx2d) {
        var c = document.getElementById('loading-canvas-2d');
        if (c && c.parentNode) c.parentNode.removeChild(c);
        ctx2d = null; stars2d = null;
      }
    }
  };
})();
