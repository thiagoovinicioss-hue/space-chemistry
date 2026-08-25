/* =====================================================================
   BOSS3D.JS — Batalha final do Devorador Estelar em 3D (terceira pessoa)

   Fase especial ('boss') com câmera atrás da nave do jogador:
     - Movimentação livre: esquerda/direita/cima/baixo/avanço/recuo;
     - Mira pelo mouse no PC e por toque no celular;
     - Joystick virtual SOMENTE em dispositivos móveis;
     - Disparos com a munição escolhida na Máquina Balística;
     - Boss com modelo próprio, 3 fases, ataques variados e falas;
     - Arena com asteroides, poeira, detritos e estruturas distantes.

   O módulo é autônomo: cria o próprio renderer/canvas dentro de
   #fx3d-boss e devolve o controle ao fluxo 2D quando a batalha acaba.
   Sem WebGL/THREE, script.js usa o confronto 2D clássico como reserva.
===================================================================== */
(function () {
  'use strict';

  /* ---------------- utilidades locais ---------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function T(key, fallback) {
    try {
      if (window.I18N && window.I18N.t) return window.I18N.t(key, fallback);
    } catch (e) {}
    return fallback;
  }

  var MAX_DPR = 1.75;

  /* Dimensões da arena (unidades Three.js). A nave olha para -Z. */
  var BOUND_X = 34, BOUND_Y = 20, SHIP_Z_MIN = -30, SHIP_Z_MAX = 52;
  var BOSS_Z = -88, BOSS_R = 7.6, BOSS_HP_MAX = 60;
  var SHOT_RANGE = 175;

  var moduleSupported = false;

  function probeWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }

  function supported() {
    if (!moduleSupported) moduleSupported = !!window.THREE && probeWebGL();
    return moduleSupported;
  }

  /* estado da batalha */
  var active = false;
  var lastStartError = null;
  var renderer = null, scene = null, camera = null;
  var glCanvas = null, hudCanvas = null, hudCtx = null, wrapEl = null;
  var cssW = 640, cssH = 360, uiS = 1;
  var st = null;
  var TEX = {};

  /* =====================================================================
     TEXTURAS PROCEDURAIS (brilho, anel, poeira) — leves, geradas uma vez
  ====================================================================== */
  function makeGlowTex() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function makeRingTex() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 9;
    g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 4;
    g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke();
    return new THREE.CanvasTexture(c);
  }
  function makeDotTex() {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(16, 16, 6, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  }

  /* =====================================================================
     CENA: luzes, estrelas, poeira, asteroides, Terra e destroços
  ====================================================================== */
  function buildLights() {
    scene.add(new THREE.HemisphereLight(0x8fb8ff, 0x140a26, 0.85));
    var d = new THREE.DirectionalLight(0xffffff, 1.15);
    d.position.set(6, 9, 8);
    scene.add(d);
    /* luz de recorte vinda do boss: clima de ameaça */
    var r = new THREE.DirectionalLight(0xff4d6d, 0.42);
    r.position.set(-4, -3, -8);
    scene.add(r);
  }

  function makeStarPoints(n, sx, sy, sz, size, op) {
    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      arr[i * 3] = rand(-sx, sx);
      arr[i * 3 + 1] = rand(-sy, sy);
      arr[i * 3 + 2] = rand(-sz, sz);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: size, map: TEX.dot, color: 0xffffff, transparent: true,
      opacity: op, depthWrite: false
    }));
  }

  function buildStars() {
    var far = makeStarPoints(650, 260, 150, 200, 1.6, 0.85);
    far.position.z = -80;
    scene.add(far);
    var near = makeStarPoints(180, 90, 60, 70, 2.4, 0.95);
    near.position.z = -30;
    scene.add(near);
    /* nebulosa distante */
    var neb = new THREE.Sprite(new THREE.SpriteMaterial({
      map: TEX.glow, color: 0x3a2a7a, transparent: true,
      opacity: 0.34, depthWrite: false
    }));
    neb.scale.set(240, 150, 1);
    neb.position.set(30, 20, -190);
    scene.add(neb);
  }

  /* Poeira espacial: dá sensação de velocidade mesmo parado */
  var dust = null;
  function buildDust() {
    var n = 240;
    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      arr[i * 3] = rand(-45, 45);
      arr[i * 3 + 1] = rand(-26, 26);
      arr[i * 3 + 2] = rand(-130, 40);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    dust = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.5, map: TEX.dot, color: 0x9fd8ff, transparent: true,
      opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(dust);
  }
  function updateDust(dt, boost) {
    if (!dust) return;
    var pos = dust.geometry.attributes.position;
    var spd = 13 + (boost ? 26 : 0);
    for (var i = 0; i < pos.count; i++) {
      var z = pos.getZ(i) + spd * dt;
      if (z > 46) z -= 176;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }
  /* Asteroides: bloqueiam tiros dos dois lados (cobertura tática) */
  var rocks = [];
  function buildAsteroids() {
    rocks = [];
    var geo = new THREE.DodecahedronGeometry(1, 0);
    var mat = new THREE.MeshLambertMaterial({ color: 0x6b7080 });
    var matDark = new THREE.MeshLambertMaterial({ color: 0x494e5e });
    for (var i = 0; i < 24; i++) {
      var s = rand(1.1, 3.4);
      var m = new THREE.Mesh(geo, i % 3 ? mat : matDark);
      m.scale.setScalar(s);
      /* deixa o corredor central inicial livre */
      var px = rand(-BOUND_X - 6, BOUND_X + 6);
      var py = rand(-BOUND_Y - 4, BOUND_Y + 4);
      if (Math.abs(px) < 9 && Math.abs(py) < 6) px += (px >= 0 ? 12 : -12);
      m.position.set(px, py, rand(-118, -14));
      m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      scene.add(m);
      rocks.push({
        mesh: m, r: s * 1.02,
        spin: { x: rand(-0.3, 0.3), y: rand(-0.3, 0.3) }
      });
    }
  }
  function updateRocks(dt) {
    for (var i = 0; i < rocks.length; i++) {
      var rk = rocks[i];
      rk.mesh.rotation.x += rk.spin.x * dt;
      rk.mesh.rotation.y += rk.spin.y * dt;
    }
  }

  /* Terra ao longe: o destino da viagem continua visível como farol */
  function buildEarth() {
    var g = new THREE.Group();
    var globe = new THREE.Mesh(
      new THREE.SphereGeometry(15, 18, 12),
      new THREE.MeshLambertMaterial({ color: 0x2f7fd4 })
    );
    g.add(globe);
    var land = new THREE.Mesh(
      new THREE.SphereGeometry(14.7, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x3fae6a })
    );
    land.scale.set(1, 0.55, 0.9);
    land.position.set(3, -2, 3);
    g.add(land);
    var atmo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: TEX.glow, color: 0x66baff, transparent: true,
      opacity: 0.55, depthWrite: false
    }));
    atmo.scale.set(42, 42, 1);
    g.add(atmo);
    g.position.set(-72, 26, -215);
    scene.add(g);
  }

  /* Estação alienígena abandonada ao fundo (profundidade) */
  function buildStation() {
    var g = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: 0x39405a });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(10, 1.3, 6, 16), mat);
    ring.rotation.x = Math.PI / 2.4;
    g.add(ring);
    var hub = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 6), mat);
    g.add(hub);
    for (var i = 0; i < 3; i++) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 9), mat);
      arm.rotation.y = i * Math.PI * 2 / 3;
      arm.position.set(Math.sin(i * 2.1) * 5, Math.cos(i * 1.7) * 2, 0);
      g.add(arm);
    }
    var light = new THREE.Sprite(new THREE.SpriteMaterial({
      map: TEX.glow, color: 0xff8844, transparent: true,
      opacity: 0.5, depthWrite: false
    }));
    light.scale.set(6, 6, 1);
    light.position.set(0, 2, 3);
    g.add(light);
    g.position.set(56, -10, -150);
    g.userData.spin = 0.03;
    stationGrp = g;
    scene.add(g);
  }
  var stationGrp = null;

  /* =====================================================================
     MODELO DO BOSS — Devorador Estelar (~20 malhas leves)
  ====================================================================== */
  function buildBoss() {
    var grp = new THREE.Group();
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x2a1740 });
    var trimMat = new THREE.MeshLambertMaterial({ color: 0x45246b });

    var hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), hullMat);
    hull.scale.set(9, 3.4, 5.6);
    grp.add(hull);

    var belly = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), trimMat);
    belly.scale.set(6.4, 1.6, 3.4);
    belly.position.y = -2.2;
    grp.add(belly);

    /* "Boca" devoradora na frente (+Z aponta para o jogador) */
    var mawMat = new THREE.MeshBasicMaterial({ color: 0x39ff6a });
    var maw = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.6, 8, 18), mawMat);
    maw.position.set(0, 0, 4.6);
    grp.add(maw);

    var coreMat = new THREE.MeshBasicMaterial({ color: 0xaaffc4 });
    var core = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 8), coreMat);
    core.position.set(0, 0, 3.6);
    grp.add(core);

    /* Espinhos ao redor da carapaça */
    var spikeGeo = new THREE.ConeGeometry(0.85, 3, 5);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      var sp = new THREE.Mesh(spikeGeo, trimMat);
      sp.position.set(Math.cos(a) * 7.4, Math.sin(a) * 2.6, rand(-1.5, 1.5));
      sp.rotation.z = a - Math.PI / 2;
      sp.rotation.x = Math.sin(a) * 0.5;
      grp.add(sp);
    }

    /* Células laterais + motores brilhantes */
    var podGeo = new THREE.CylinderGeometry(1.1, 1.4, 4.6, 8);
    var engines = [];
    for (var p = 0; p < 2; p++) {
      var pod = new THREE.Mesh(podGeo, hullMat);
      pod.rotation.z = Math.PI / 2;
      pod.position.set((p ? 6.6 : -6.6), -0.4, 0.6);
      grp.add(pod);
      var eng = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.glow, color: 0xff5548, transparent: true,
        opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      eng.scale.set(3.4, 3.4, 1);
      eng.position.set((p ? 8.6 : -8.6), -0.4, 3.2);
      grp.add(eng);
      engines.push(eng);
    }

    /* Barbatanas dorsal/ventral */
    var finGeo = new THREE.BoxGeometry(0.35, 3.4, 3.6);
    var finT = new THREE.Mesh(finGeo, trimMat);
    finT.position.set(0, 3.4, -1.4);
    grp.add(finT);
    var finB = new THREE.Mesh(finGeo, trimMat);
    finB.position.set(0, -3.6, -1.4);
    grp.add(finB);

    grp.position.set(0, 4, BOSS_Z);
    scene.add(grp);
    return {
      grp: grp, mawMat: mawMat, maw: maw, coreMat: coreMat, core: core,
      engines: engines, hullMats: [hullMat, trimMat],
      baseColors: [new THREE.Color(0x2a1740), new THREE.Color(0x45246b)]
    };
  }
  /* =====================================================================
     NAVE DO JOGADOR (herói) — mesma família visual da nave 2D
  ====================================================================== */
  function buildShip() {
    var grp = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xe8f2ff });
    var wingMat = new THREE.MeshLambertMaterial({ color: 0xcfd8ea });

    var body = new THREE.Mesh(new THREE.ConeGeometry(0.72, 3.4, 8), bodyMat);
    body.rotation.x = -Math.PI / 2;
    grp.add(body);

    var cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x59d3ff, transparent: true, opacity: 0.85 })
    );
    cockpit.position.set(0, 0.38, -0.5);
    grp.add(cockpit);

    for (var w = 0; w < 2; w++) {
      var wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.25), wingMat);
      wing.position.set((w ? 1.35 : -1.35), -0.05, 0.75);
      wing.rotation.y = (w ? -0.32 : 0.32);
      grp.add(wing);
      /* ponteiras dos canhões (tintadas com a cor da munição) */
      var gunMat = new THREE.MeshBasicMaterial({ color: 0x7ff5ff });
      var gun = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 6), gunMat);
      gun.rotation.x = Math.PI / 2;
      gun.position.set((w ? 0.62 : -0.62), 0, -1.45);
      grp.add(gun);
    }

    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.95), wingMat);
    fin.position.set(0, 0.55, 1.15);
    grp.add(fin);

    var engines = [];
    for (var e = 0; e < 2; e++) {
      var noz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.34, 0.8, 8),
        new THREE.MeshLambertMaterial({ color: 0x39405a })
      );
      noz.rotation.x = Math.PI / 2;
      noz.position.set((e ? 0.55 : -0.55), 0, 1.55);
      grp.add(noz);
      var fl = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.glow, color: 0x7fdcff, transparent: true,
        opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      fl.scale.set(1.4, 1.4, 1);
      fl.position.set((e ? 0.55 : -0.55), 0, 2.2);
      grp.add(fl);
      engines.push(fl);
    }

    scene.add(grp);
    return { grp: grp, engines: engines, gunMats: [] };
  }
  /* guarda as cores dos canhões para tingir conforme a munição */
  function tintGuns(color) {
    if (!st || !st.shipM || !st.shipM.grp) return;
    st.shipM.grp.traverse(function (o) {
      if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry' &&
          o.material && o.material.isMeshBasicMaterial) {
        o.material.color.set(color);
      }
    });
  }

  /* =====================================================================
     POOLS: tiros do jogador, tiros do boss, partículas, anéis e destroços
  ====================================================================== */
  function makeBoltMesh(colorHex, size) {
    var g = new THREE.Group();
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: TEX.glow, color: new THREE.Color(colorHex), transparent: true,
      opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    s.scale.set(size * 2.6, size * 2.6, 1);
    g.add(s);
    var c = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.42, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    g.add(c);
    g.userData.spr = s;
    return g;
  }

  function initPools() {
    st.shots = [];
    st.eshots = [];
    for (var i = 0; i < 30; i++) {
      var m = makeBoltMesh('#ffffff', 1);
      m.visible = false;
      scene.add(m);
      st.shots.push({ m: m, vel: new THREE.Vector3(), life: 0, dmg: 1 });
    }
    for (var j = 0; j < 40; j++) {
      var em = makeBoltMesh('#ff5566', 1.15);
      em.visible = false;
      scene.add(em);
      st.eshots.push({
        m: em, vel: new THREE.Vector3(), life: 0,
        homing: false, turn: 0, r: 1.1
      });
    }
    st.parts = [];
    for (var k = 0; k < 110; k++) {
      var spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.glow, color: 0xffffff, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      spr.visible = false;
      scene.add(spr);
      st.parts.push({ spr: spr, vel: new THREE.Vector3(), life: 0, max: 1, size: 1 });
    }
    st.rings = [];
    for (var r = 0; r < 8; r++) {
      var rs = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.ring, color: 0xffffff, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      rs.visible = false;
      scene.add(rs);
      st.rings.push({ spr: rs, life: 0, max: 1, size: 1 });
    }
    st.debris = [];
    var dGeo = new THREE.TetrahedronGeometry(0.9, 0);
    var dMat = new THREE.MeshLambertMaterial({ color: 0x45246b });
    for (var db = 0; db < 14; db++) {
      var dm = new THREE.Mesh(dGeo, dMat);
      dm.visible = false;
      scene.add(dm);
      st.debris.push({ m: dm, vel: new THREE.Vector3(), rot: new THREE.Vector3(), life: 0 });
    }
  }

  function spawnPart(pos, vel, colorHex, size, life) {
    for (var i = 0; i < st.parts.length; i++) {
      var p = st.parts[i];
      if (p.life <= 0) {
        p.spr.visible = true;
        p.spr.position.copy(pos);
        p.spr.material.color.set(colorHex);
        p.spr.material.opacity = 0.95;
        p.vel.copy(vel);
        p.life = p.max = life;
        p.size = size;
        p.spr.scale.set(size, size, 1);
        return;
      }
    }
  }
  function burst3D(pos, colorHex, n, spd, size) {
    for (var i = 0; i < n; i++) {
      var v = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(spd * 0.4, spd));
      spawnPart(pos, v, i % 3 === 0 ? '#ffd166' : colorHex, rand(size * 0.6, size * 1.5), rand(0.3, 0.75));
    }
  }
  function spawnRing(pos, colorHex, size) {
    for (var i = 0; i < st.rings.length; i++) {
      var r = st.rings[i];
      if (r.life <= 0) {
        r.spr.visible = true;
        r.spr.position.copy(pos);
        r.spr.material.color.set(colorHex);
        r.spr.material.rotation = rand(0, Math.PI * 2);
        r.life = r.max = 0.55;
        r.size = size;
        return;
      }
    }
  }
  function ejectDebris(pos) {
    for (var i = 0; i < st.debris.length; i++) {
      var d = st.debris[i];
      if (d.life > 0) continue;
      d.m.visible = true;
      d.m.position.copy(pos).add(new THREE.Vector3(rand(-3, 3), rand(-2, 2), rand(-2, 2)));
      d.vel.set(rand(-14, 14), rand(-10, 10), rand(-4, 18));
      d.rot.set(rand(-4, 4), rand(-4, 4), rand(-4, 4));
      d.life = 3.2;
      return;
    }
  }
  /* =====================================================================
     CICLO DE VIDA: start / stop / resize
  ====================================================================== */
  var IS_TOUCH = !!(window.navigator && (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0));

  function start(opts) {
    if (active || !supported()) return false;
    try {
      wrapEl = document.getElementById('fx3d-boss');
      if (!wrapEl) return false;

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x04060f, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      glCanvas = renderer.domElement;
      glCanvas.style.width = '100%';
      glCanvas.style.height = '100%';
      glCanvas.style.display = 'block';

      hudCanvas = document.createElement('canvas');
      hudCtx = hudCanvas.getContext('2d');

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x04060f, 95, 240);
      camera = new THREE.PerspectiveCamera(62, cssW / cssH, 0.1, 500);
      camera.position.set(0, 2.5, 43);

      TEX.glow = makeGlowTex();
      TEX.ring = makeRingTex();
      TEX.dot = makeDotTex();

      buildLights();
      buildStars();
      buildDust();
      buildAsteroids();
      buildEarth();
      buildStation();

      var ammo = opts.ammo || { dmg: 1, cd: 0.24, spread: 1, pierce: false, size: 1, color: '#7ff5ff' };
      /* Vida escalonada: confrontos pós-fase usam hpMax menor (dificuldade
         progressiva); o confronto final mantém a vida cheia (BOSS_HP_MAX). */
      var hpMax = Math.max(12, Math.round(opts.hpMax || BOSS_HP_MAX));
      st = {
        t: 0, timeScale: 1, over: false, dying: false, dieT: 0, fadeOut: 0,
        ammo: ammo,
        magMax: ammo.kind === 'std' ? Infinity : Math.max(24, Math.round(120 / ammo.dmg)),
        mag: 0, shotCd: 0.4, firing: false,
        shipM: buildShip(),
        ship: {
          pos: new THREE.Vector3(0, -2, 34), vel: new THREE.Vector3(),
          roll: 0, pitch: 0, invuln: 2.2, hull: 5
        },
        energy: 100,
        aimNdc: { x: 0, y: -0.12 }, aimPoint: new THREE.Vector3(0, 0, -30),
        reticlePulse: 0,
        boss: null, bossM: null,
        shake: 0, vignette: 0, flashW: 0,
        quote: null, quoteGap: 5, saidLow: false,
        notice: null,
        introT: 4.6,
        touchMode: IS_TOUCH,
        joy: { id: null, bx: 0, by: 0, x: 0, y: 0 },
        fireId: null, turboId: null, turboHold: false,
        btnFire: { x: 0, y: 0, r: 36 }, btnTurbo: { x: 0, y: 0, r: 26 },
        opts: opts
      };
      st.mag = st.magMax;
      st.bossM = buildBoss();
      st.boss = {
        hp: hpMax, dispHp: hpMax, maxHp: hpMax, phase: 1, wob: rand(0, 9),
        atkT: 3.4, fanT: PH[1].fan, homeT: 8, dashT: 6, ringT: 6,
        tele: 0, teleKind: '', hitFlash: 0, dashTo: null
      };
      initPools();
      tintGuns(ammo.color);

      wrapEl.appendChild(glCanvas);
      wrapEl.appendChild(hudCanvas);
      window.addEventListener('resize', onResize);
      onResize();

      active = true;
      sayQuote(T('boss.qIntro', 'Ligações químicas? Eu DEVORO moléculas no café da manhã!'));
      return true;
    } catch (err) {
      try { stop(); } catch (e2) {}
      lastStartError = (err && err.stack) ? String(err.stack).split('\n').slice(0, 4).join(' | ') : String(err);
      return false;
    }
  }

  function stop() {
    active = false;
    window.removeEventListener('resize', onResize);
    if (wrapEl && glCanvas && glCanvas.parentNode === wrapEl) wrapEl.removeChild(glCanvas);
    if (wrapEl && hudCanvas && hudCanvas.parentNode === wrapEl) wrapEl.removeChild(hudCanvas);
    /* libera memória de GPU e CPU */
    if (scene) {
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          for (var i = 0; i < mats.length; i++) {
            if (mats[i].map) mats[i].map.dispose();
            mats[i].dispose();
          }
        }
      });
    }
    if (renderer) renderer.dispose();
    renderer = null; scene = null; camera = null;
    glCanvas = null; hudCanvas = null; hudCtx = null;
    dust = null; stationGrp = null; rocks = [];
    TEX.glow = TEX.ring = TEX.dot = null;
    st = null;
  }

  function isActive() { return active; }

  function onResize() {
    if (!renderer || !wrapEl) return;
    cssW = Math.max(1, wrapEl.clientWidth);
    cssH = Math.max(1, wrapEl.clientHeight);
    uiS = clamp(cssW / 640, 0.85, 2.2);
    renderer.setSize(cssW, cssH, false);
    hudCanvas.width = Math.round(cssW * Math.min(window.devicePixelRatio || 1, MAX_DPR));
    hudCanvas.height = Math.round(cssH * Math.min(window.devicePixelRatio || 1, MAX_DPR));
    hudCanvas.style.width = '100%';
    hudCanvas.style.height = '100%';
    hudCtx.setTransform(hudCanvas.width / cssW, 0, 0, hudCanvas.height / cssH, 0, 0);
    camera.aspect = cssW / cssH;
    camera.updateProjectionMatrix();
    /* botões mobile no canto direito */
    st.btnFire.x = cssW - 62 * uiS; st.btnFire.y = cssH - 60 * uiS; st.btnFire.r = 36 * uiS;
    st.btnTurbo.x = cssW - 132 * uiS; st.btnTurbo.y = cssH - 84 * uiS; st.btnTurbo.r = 25 * uiS;
  }

  /* =====================================================================
     ATUALIZAÇÃO PRINCIPAL
  ====================================================================== */
  function tick(dtRaw) {
    if (!active || !st) return;
    var dt = dtRaw * st.timeScale;
    st.t += dt;

    if (st.introT > 0) st.introT -= dtRaw;

    if (st.boss) updateBoss(dt, dtRaw);
    if (!st.over) updateShip(dt, dtRaw);
    else parkShip(dt);
    updateShots(dt);
    updateEnemyShots(dt);
    updateRocks(dt);
    updateFx(dt);
    updateDust(dt, st.turboHold && st.energy > 1);
    if (stationGrp) stationGrp.rotation.y += 0.03 * dt;
    updateCamera(dt);

    /* decaimentos visuais */
    st.shake = Math.max(0, st.shake - dt * 3.2);
    st.vignette = Math.max(0, st.vignette - dtRaw * 2.2);
    st.flashW = Math.max(0, st.flashW - dtRaw * 2.6);
    st.reticlePulse = Math.max(0, st.reticlePulse - dtRaw * 4);
    if (st.quote) {
      st.quote.t += dtRaw;
      if (st.quote.t > st.quote.dur) st.quote = null;
    } else if (st.quoteGap > 0) st.quoteGap -= dtRaw;
    if (st.notice) {
      st.notice.t += dtRaw;
      if (st.notice.t > 2.6) st.notice = null;
    }

    /* sequência de morte do boss → vitória */
    if (st.dying) {
      st.dieT += dtRaw;
      deathSequence(dtRaw);
      if (st.fadeOut > 0) {
        st.fadeOut = Math.min(1, st.fadeOut + dtRaw * 1.4);
        if (st.fadeOut >= 1) {
          var done = st.opts.onVictory;
          stop();
          if (done) done();
          return;
        }
      }
    }

    renderer.render(scene, camera);
    drawHud();
  }

  /* ---------------- nave do jogador ---------------- */
  var raycaster = null;

  function readMoveAxes() {
    var ax = 0, ay = 0, az = 0;
    var I = window.Input;
    if (I) {
      if (I.isDown('KeyA') || I.isDown('ArrowLeft')) ax -= 1;
      if (I.isDown('KeyD') || I.isDown('ArrowRight')) ax += 1;
      if (I.isDown('KeyW') || I.isDown('ArrowUp')) ay += 1;
      if (I.isDown('KeyS') || I.isDown('ArrowDown')) ay -= 1;
      if (I.isDown('KeyE')) az -= 1;   /* avanço */
      if (I.isDown('KeyQ')) az += 1;   /* recuo  */
    }
    if (st.touchMode && st.joy.id !== null) {
      ax += st.joy.x;
      ay += -st.joy.y;
    }
    if (st.touchMode) az -= 0.45; /* cruzeiro automático suave */
    return { ax: clamp(ax, -1, 1), ay: clamp(ay, -1, 1), az: clamp(az, -1, 1) };
  }

  function updateShip(dt, dtRaw) {
    var s = st.ship;
    s.invuln = Math.max(0, s.invuln - dt);

    /* turbo consome energia; sem energia, volta ao normal */
    var wantTurbo = false;
    var I = window.Input;
    if ((I && (I.isDown('ShiftLeft') || I.isDown('ShiftRight'))) || st.turboHold) wantTurbo = true;
    var turbo = wantTurbo && st.energy > 1;
    if (turbo) st.energy = Math.max(0, st.energy - 34 * dt);
    else st.energy = Math.min(100, st.energy + 17 * dt);
    st.turboActive = turbo;

    var mv = readMoveAxes();
    var acc = 64 * (turbo ? 1.85 : 1);
    s.vel.x += mv.ax * acc * dt;
    s.vel.y += mv.ay * acc * dt;
    s.vel.z += mv.az * acc * dt;

    /* amortecimento: movimento espacial macio, nunca "deslizando" */
    var damp = Math.exp(-3.1 * dt);
    s.vel.multiplyScalar(damp);
    var maxSpd = 27 * (turbo ? 1.8 : 1);
    if (s.vel.length() > maxSpd) s.vel.setLength(maxSpd);

    s.pos.addScaledVector(s.vel, dt);
    /* limites com rebote suave */
    if (Math.abs(s.pos.x) > BOUND_X) { s.pos.x = clamp(s.pos.x, -BOUND_X, BOUND_X); s.vel.x *= -0.35; }
    if (s.pos.y > BOUND_Y || s.pos.y < -BOUND_Y) { s.pos.y = clamp(s.pos.y, -BOUND_Y, BOUND_Y); s.vel.y *= -0.35; }
    if (s.pos.z > SHIP_Z_MAX || s.pos.z < SHIP_Z_MIN) { s.pos.z = clamp(s.pos.z, SHIP_Z_MIN, SHIP_Z_MAX); s.vel.z *= -0.35; }

    /* colisão branda com asteroides: empurra para fora, sem dano */
    for (var i = 0; i < rocks.length; i++) {
      var rk = rocks[i];
      var d = s.pos.distanceTo(rk.mesh.position);
      var minD = rk.r + 1.3;
      if (d < minD && d > 0.001) {
        var push = new THREE.Vector3().subVectors(s.pos, rk.mesh.position).normalize();
        s.pos.copy(rk.mesh.position).addScaledVector(push, minD);
        s.vel.addScaledVector(push, 14);
      }
    }

    /* inclinações visuais: banking/pitch/yaw dão vida ao voo */
    s.roll = lerp(s.roll, -s.vel.x * 0.05, 1 - Math.exp(-dt * 7));
    s.pitch = lerp(s.pitch, s.vel.y * 0.028 + s.vel.z * 0.006, 1 - Math.exp(-dt * 7));
    var g = st.shipM.grp;
    g.position.copy(s.pos);
    g.rotation.z = s.roll;
    g.rotation.x = s.pitch;
    g.rotation.y = -s.vel.x * 0.012;

    /* chama dos motores */
    var fl = 0.9 + Math.random() * 0.5 + (turbo ? 1.3 : 0);
    for (var e2 = 0; e2 < st.shipM.engines.length; e2++) {
      var eng = st.shipM.engines[e2];
      eng.scale.set(fl * 1.15, fl * (turbo ? 1.7 : 1), 1);
      eng.material.opacity = turbo ? 1 : 0.75 + Math.random() * 0.25;
      eng.material.color.set(turbo ? 0xffc46b : 0x7fdcff);
    }
    /* rastro de partículas sob turbo */
    if (turbo && Math.random() < 0.55) {
      spawnPart(s.pos.clone().add(new THREE.Vector3(rand(-0.6, 0.6), 0, 2.4)),
        new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(16, 26)),
        '#7fdcff', rand(0.5, 1.1), 0.4);
    }

    /* mira: raio da câmera pelo ponteiro até um plano à frente da nave */
    updateAimPoint();

    /* disparo */
    st.shotCd -= dt;
    var wantFire = st.firing || (I && (I.isDown('Space') || I.isDown('KeyJ')));
    if (wantFire && st.shotCd <= 0) fireShot();
  }

  function parkShip(dt) {
    var s = st.ship;
    s.vel.multiplyScalar(Math.exp(-2 * dt));
    s.pos.lerp(new THREE.Vector3(0, -2, 36), 1 - Math.exp(-dt * 1.2));
    st.shipM.grp.position.copy(s.pos);
  }

  function updateAimPoint() {
    if (!raycaster) raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(st.aimNdc, camera);
    var o = raycaster.ray.origin, dir = raycaster.ray.direction;
    var targetZ = st.ship.pos.z - 58;
    if (Math.abs(dir.z) < 0.0001) dir.z = -0.0001;
    var tt = (targetZ - o.z) / dir.z;
    if (tt < 4) tt = 4;
    st.aimPoint.copy(o).addScaledVector(dir, tt);
  }
  /* ---------------- disparo do jogador ---------------- */
  function switchToStd(reason) {
    var STD = (window.AMMO_TYPES && AMMO_TYPES.STD) ||
      { formula: '⚡', name: 'Célula Padrão', kind: 'std', dmg: 1, cd: 0.24, spread: 1, pierce: false, size: 1, color: '#7ff5ff' };
    st.ammo = STD;
    st.magMax = Infinity;
    st.mag = Infinity;
    tintGuns(STD.color);
    st.notice = { txt: reason || T('boss.empty', 'MUNIÇÃO ESPECIAL ESGOTADA — CÉLULA PADRÃO'), t: 0 };
  }

  function fireShot() {
    var a = st.ammo;
    if (st.mag !== Infinity && st.mag <= 0) { switchToStd(); return; }
    st.shotCd = a.cd;
    if (st.mag !== Infinity) st.mag--;

    var nose = st.ship.pos.clone().add(new THREE.Vector3(0, -0.1, -1.8));
    var dir = new THREE.Vector3().subVectors(st.aimPoint, nose).normalize();
    /* base ortonormal para leque de projéteis */
    var up = new THREE.Vector3(0, 1, 0);
    var side = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (side.lengthSq() < 0.001) side.set(1, 0, 0);
    var vUp = new THREE.Vector3().crossVectors(side, dir).normalize();

    var n = Math.max(1, a.spread | 0);
    for (var i = 0; i < n; i++) {
      var ang = n > 1 ? (i / (n - 1) - 0.5) * 0.14 * (n - 1) * 0.9 : 0;
      var d2 = dir.clone()
        .addScaledVector(side, Math.sin(ang))
        .addScaledVector(vUp, -Math.cos(ang) + 1)
        .normalize();
      var b = grabShot();
      if (!b) break;
      b.m.visible = true;
      b.m.position.copy(nose);
      b.vel.copy(d2).multiplyScalar(78 + (a.dmg || 1) * 7);
      b.life = SHOT_RANGE / (78 + (a.dmg || 1) * 7);
      b.dmg = a.dmg || 1;
      var sz = (a.size || 1);
      b.m.userData.spr.material.color.set(a.color);
      b.m.userData.spr.scale.set(sz * 2.6, sz * 2.6, 1);
      b.hitBoss = false;
    }
    st.reticlePulse = 1;
    AudioSys_sfx('laser');
  }

  function grabShot() {
    for (var i = 0; i < st.shots.length; i++) {
      if (st.shots[i].life <= 0) return st.shots[i];
    }
    return null;
  }

  function updateShots(dt) {
    var bo = st.bossM ? st.bossM.grp : null;
    for (var i = 0; i < st.shots.length; i++) {
      var b = st.shots[i];
      if (b.life <= 0) continue;
      b.life -= dt;
      b.m.position.addScaledVector(b.vel, dt);
      if (Math.random() < 0.4) {
        spawnPart(b.m.position, new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(4, 9)),
          '#' + b.m.userData.spr.material.color.getHexString(), 0.55, 0.22);
      }
      var dead = b.life <= 0;

      /* acerto no boss */
      if (!dead && !b.hitBoss && bo && st.boss && !st.boss.hpDead &&
          b.m.position.distanceTo(bo.position) < BOSS_R) {
        damageBoss(b.dmg, b.m.position);
        b.hitBoss = true;
        dead = true;
      }
      /* destrói mísseis perseguidores */
      if (!dead) {
        for (var e = 0; e < st.eshots.length; e++) {
          var es = st.eshots[e];
          if (es.life > 0 && es.homing && b.m.position.distanceTo(es.m.position) < es.r + 0.8) {
            burst3D(es.m.position, '#ff8866', 10, 16, 1.2);
            spawnRing(es.m.position, '#ffaa88', 4);
            es.life = 0; es.m.visible = false;
            AudioSys_sfx('enemyHit');
            dead = true;
            break;
          }
        }
      }
      /* asteroides bloqueiam o tiro */
      if (!dead) {
        for (var r = 0; r < rocks.length; r++) {
          if (b.m.position.distanceTo(rocks[r].mesh.position) < rocks[r].r) {
            burst3D(b.m.position, '#cfd8ea', 6, 10, 0.9);
            dead = true;
            break;
          }
        }
      }
      if (dead) {
        b.life = 0;
        b.m.visible = false;
      }
    }
  }

  /* =====================================================================
     BOSS — Devorador Estelar: fases, ataques, falas e morte
  ====================================================================== */
  var PH = {
    1: { ax: 15, ay: 8, wx: 0.40, wy: 0.62, zr: 4, ease: 2.2,
         aimed: 2.0, aimedN: 1, boltSpd: 26, fan: 6.6, fanN: 3, fanSpd: 22,
         homing: 0, dash: 0, ring: 0 },
    2: { ax: 21, ay: 11, wx: 0.55, wy: 0.78, zr: 7, ease: 2.8,
         aimed: 1.25, aimedN: 1, boltSpd: 29, fan: 4.4, fanN: 5, fanSpd: 24,
         homing: 7.5, dash: 5.5, ring: 0 },
    3: { ax: 26, ay: 13, wx: 0.72, wy: 0.98, zr: 10, ease: 3.4,
         aimed: 0.95, aimedN: 2, boltSpd: 32, fan: 5.4, fanN: 10, fanSpd: 20,
         homing: 5.5, dash: 4.2, ring: 9.0 }
  };

  function sayQuote(txt, dur) {
    if (!txt) return;
    st.quote = { txt: txt, t: 0, dur: dur || 3.4 };
    st.quoteGap = 6.5;
    AudioSys_sfx('mumble');
  }

  function damageBoss(dmg, atPos) {
    var b = st.boss;
    if (!b || b.hp <= 0 || st.dying) return;
    b.hp = Math.max(0, b.hp - dmg);
    b.hitFlash = 0.12;
    st.shake = Math.max(st.shake, 0.35);
    if (atPos) burst3D(atPos, st.ammo.color, 8, 14, 1.1);
    AudioSys_sfx('enemyHit');
    if (b.hp <= 0) startBossDeath();
  }

  function onPhaseChange(ph) {
    AudioSys_sfx('warning');
    AudioSys_sfx('growl');
    st.flashW = Math.max(st.flashW, 0.35);
    if (ph === 2) {
      sayQuote(T('boss.qP2', 'Impressionante... conheçam meu leque de elétrons!'));
    } else if (ph === 3) {
      sayQuote(T('boss.qP3', 'Impossível! Minha eletronegatividade está no MÁXIMO!'));
    }
    /* tinta a carapaça para um tom mais agressivo */
    var bm = st.bossM;
    var mix = ph === 2 ? 0.45 : 1;
    bm.hullMats[0].color.copy(bm.baseColors[0]).lerp(new THREE.Color(0x5a1020), mix);
    bm.hullMats[1].color.copy(bm.baseColors[1]).lerp(new THREE.Color(0x7a1830), mix);
  }

  function bossTelegraph(kind) {
    st.boss.tele = 0.42;
    st.boss.teleKind = kind;
    AudioSys_sfx('charge');
  }

  function enemyFire(pos, dir, spd, homing) {
    for (var i = 0; i < st.eshots.length; i++) {
      var es = st.eshots[i];
      if (es.life > 0) continue;
      es.life = 9;
      es.m.visible = true;
      es.m.position.copy(pos);
      es.vel.copy(dir).multiplyScalar(spd);
      es.homing = !!homing;
      es.turn = 1.7;
      es.r = homing ? 1.0 : 1.15;
      es.m.userData.spr.material.color.set(homing ? 0xffa040 : 0xff4455);
      return es;
    }
    return null;
  }

  function bossShootAtPlayer(n) {
    var from = st.bossM.grp.position.clone().add(new THREE.Vector3(0, 0, 5));
    var target = st.ship.pos.clone().addScaledVector(st.ship.vel, 0.35);
    for (var i = 0; i < n; i++) {
      var off = new THREE.Vector3((i - (n - 1) / 2) * 2.2, 0, 0);
      var dir = new THREE.Vector3().subVectors(target.clone().add(off), from).normalize();
      enemyFire(from, dir, PH[st.boss.phase].boltSpd, false);
    }
    AudioSys_sfx('enemyShot');
  }

  function bossFan(count, spd) {
    var from = st.bossM.grp.position.clone().add(new THREE.Vector3(0, 0, 4));
    var toPlayer = Math.atan2(st.ship.pos.y - from.y, st.ship.pos.x - from.x);
    for (var i = 0; i < count; i++) {
      var a = toPlayer + (i / count - 0.5) * Math.PI * 1.15;
      enemyFire(from, new THREE.Vector3(Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0.5).normalize(), spd, false);
    }
    AudioSys_sfx('enemyShot');
  }

  function bossRing(count) {
    var from = st.bossM.grp.position.clone();
    var gap = rand(0, Math.PI * 2); /* sempre há uma brecha: esquiva é justa */
    for (var i = 0; i < count; i++) {
      var a = gap + (i + 0.5) / count * Math.PI * 2;
      enemyFire(from, new THREE.Vector3(Math.cos(a), Math.sin(a), 0.12).normalize(), 19, false);
    }
    AudioSys_sfx('warning');
  }

  function bossHoming() {
    var from = st.bossM.grp.position.clone().add(new THREE.Vector3(rand(-5, 5), -2, 4));
    var dir = new THREE.Vector3().subVectors(st.ship.pos, from).normalize();
    enemyFire(from, dir, 19, true);
    AudioSys_sfx('enemyShot');
  }

  function updateBoss(dt, dtRaw) {
    var b = st.boss;
    var bm = st.bossM;
    /* segurança: vida zerada sempre inicia a derrota (ex.: tiros no mesmo frame) */
    if (!st.dying && b.hp <= 0) { startBossDeath(); }
    b.dispHp = lerp(b.dispHp, b.hp, 1 - Math.exp(-dtRaw * 6));
    b.hitFlash = Math.max(0, b.hitFlash - dtRaw);

    /* brilho vivo: boca e núcleo pulsam; telegraph aumenta antes dos tiros */
    var pulse = 0.85 + Math.sin(st.t * (b.phase >= 3 ? 9 : 5)) * 0.18 + (b.tele > 0 ? 0.7 : 0);
    bm.core.scale.setScalar(pulse);
    bm.maw.scale.setScalar(1 + (b.tele > 0 ? 0.22 : 0));
    bm.coreMat.color.set(b.tele > 0 ? 0xffffaa : 0xaaffc4);
    bm.engines.forEach(function (eng, ix) {
      eng.material.opacity = 0.55 + Math.random() * 0.45;
      eng.scale.setScalar(3 + Math.sin(st.t * 7 + ix) * 0.5 + b.phase * 0.5);
    });

    if (st.dying) { deathMove(dt); return; }

    /* transição de fase pela vida restante */
    var frac = b.hp / b.maxHp;
    var ph = frac > 0.66 ? 1 : (frac > 0.33 ? 2 : 3);
    if (ph !== b.phase) { b.phase = ph; onPhaseChange(ph); }
    var cfg = PH[b.phase];
    b.wob += dt;

    /* movimento: senoide ampla + investidas periódicas (nunca parado) */
    var target = new THREE.Vector3(
      Math.sin(b.wob * cfg.wx) * cfg.ax,
      4 + Math.sin(b.wob * cfg.wy * 1.31) * cfg.ay,
      BOSS_Z + Math.sin(b.wob * 0.23) * cfg.zr +
        (b.phase === 3 ? Math.max(0, Math.sin(b.wob * 0.13) - 0.62) * 26 : 0)
    );
    if (cfg.dash) {
      b.dashT -= dt;
      if (b.dashT <= 0 && !b.dashTo) {
        b.dashTo = new THREE.Vector3(rand(-cfg.ax, cfg.ax), rand(-2, cfg.ay + 4), BOSS_Z + rand(-cfg.zr, cfg.zr));
        b.dashHold = 1.15;
      }
      if (b.dashTo) {
        target.copy(b.dashTo);
        b.dashHold -= dt;
        if (b.dashHold <= 0) { b.dashTo = null; b.dashT = cfg.dash; }
      }
    }
    bm.grp.position.lerp(target, 1 - Math.exp(-dt * cfg.ease));
    /* encara levemente o jogador; balanço dá peso à nave grande */
    var dx = st.ship.pos.x - bm.grp.position.x;
    bm.grp.rotation.y = lerp(bm.grp.rotation.y, clamp(dx * 0.006, -0.28, 0.28), 1 - Math.exp(-dt * 3));
    bm.grp.rotation.z = Math.sin(b.wob * 0.7) * 0.08;

    /* telegraph em andamento */
    if (b.tele > 0) {
      b.tele -= dtRaw;
      if (b.tele <= 0) {
        var k = b.teleKind;
        b.teleKind = '';
        if (k === 'aimed') bossShootAtPlayer(cfg.aimedN);
        else if (k === 'fan') bossFan(cfg.fanN, cfg.fanSpd);
        else if (k === 'ring') bossRing(12);
      }
      return;
    }

    /* temporizadores de ataque por fase */
    b.atkT -= dt;
    if (b.atkT <= 0) { bossTelegraph('aimed'); b.atkT = cfg.aimed * rand(0.85, 1.2); return; }

    b.fanT -= dt;
    if (b.fanT <= 0) { bossTelegraph('fan'); b.fanT = cfg.fan * rand(0.85, 1.2); return; }

    if (cfg.homing) {
      b.homeT -= dt;
      if (b.homeT <= 0) { bossHoming(); b.homeT = cfg.homing * rand(0.8, 1.25); }
    }
    if (cfg.ring) {
      b.ringT -= dt;
      if (b.ringT <= 0) { bossTelegraph('ring'); b.ringT = cfg.ring * rand(0.9, 1.15); return; }
    }

    /* aviso de vida baixa (uma vez) */
    if (!st.saidLow && frac < 0.2) {
      st.saidLow = true;
      sayQuote(T('boss.qLow', 'Esse composto seu... é estável DEMAIS!'));
    }
  }

  /* ---------------- derrota do boss ---------------- */
  function startBossDeath() {
    st.dying = true;
    st.over = true;
    st.dieT = 0;
    st.firing = false;
    st.timeScale = 0.5;
    st.flashW = 0.8;
    st.shake = 1.4;
    sayQuote(T('boss.qDie', 'Nããão... derrotado... por entalpia...'), 3.8);
    AudioSys_sfx('bigBoom');
    if (st.opts.addScore) st.opts.addScore(500);
  }

  function deathMove(dt) {
    /* tomba e afunda devagar enquanto explode */
    var bm = st.bossM;
    bm.grp.rotation.z += dt * 0.5;
    bm.grp.rotation.x += dt * 0.22;
    bm.grp.position.y -= dt * 1.1;
  }

  function deathSequence(dtRaw) {
    var b = st.boss, bm = st.bossM;
    if (!b || !bm) return;
    /* rajadas de explosões pelo casco */
    if (Math.random() < dtRaw * 7 && st.dieT < 2.3) {
      var p = bm.grp.position.clone().add(new THREE.Vector3(rand(-7, 7), rand(-2.5, 2.5), rand(-3, 3)));
      burst3D(p, '#ff8844', 12, 20, 1.6);
      spawnRing(p, '#ffd166', rand(4, 8));
      st.shake = Math.max(st.shake, 0.5);
      if (Math.random() < 0.4) AudioSys_sfx('boom');
    }
    if (st.dieT > 1.4 && !b.ejected) {
      b.ejected = true;
      for (var i = 0; i < 12; i++) ejectDebris(bm.grp.position);
    }
    if (st.dieT > 2.4 && !b.imploded) {
      b.imploded = true;
      bm.grp.visible = false;
      var big = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.glow, color: 0xffffff, transparent: true, opacity: 1,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      big.position.copy(bm.grp.position);
      big.scale.set(70, 70, 1);
      scene.add(big);
      st.bigFlash = big;
      spawnRing(bm.grp.position, '#ffffff', 30);
      AudioSys_sfx('bigBoom');
      st.flashW = 1;
      st.timeScale = 1;
    }
    if (st.bigFlash) {
      st.bigFlash.material.opacity = Math.max(0, 1 - (st.dieT - 2.4) * 1.4);
      st.bigFlash.scale.multiplyScalar(1 + dtRaw * 0.8);
    }
    if (st.dieT > 3.0) st.fadeOut = Math.max(st.fadeOut, 0.001);
  }

  /* ---------------- tiros do boss ---------------- */
  function hitShip() {
    var s = st.ship;
    if (s.invuln > 0) return;
    s.hull--;
    s.invuln = 1.5;
    st.vignette = 1;
    st.shake = 1.1;
    AudioSys_sfx('hurt');
    if (s.hull <= 0) {
      /* sem game over: penalidade + blindagem restaurada (campanha segue) */
      if (st.opts.addScore) st.opts.addScore(-200);
      s.hull = 5;
      s.invuln = 3;
      st.flashW = Math.max(st.flashW, 0.5);
      st.notice = { txt: T('boss.restored', 'BLINDAGEM RESTAURADA (-200)'), t: 0 };
      AudioSys_sfx('warning');
    }
  }

  function updateEnemyShots(dt) {
    var sp = st.ship.pos;
    for (var i = 0; i < st.eshots.length; i++) {
      var es = st.eshots[i];
      if (es.life <= 0) continue;
      es.life -= dt;
      if (es.homing) {
        /* perseguidor: gira em direção ao jogador com curva limitada */
        var want = new THREE.Vector3().subVectors(sp, es.m.position).normalize().multiplyScalar(es.vel.length());
        es.vel.lerp(want, 1 - Math.exp(-dt * es.turn));
      }
      es.m.position.addScaledVector(es.vel, dt);
      es.m.rotation.z += dt * 6;

      if (es.m.position.distanceTo(sp) < 1.45) {
        hitShip();
        burst3D(es.m.position, '#ff5566', 8, 12, 1);
        es.life = 0; es.m.visible = false;
        continue;
      }
      for (var r = 0; r < rocks.length; r++) {
        if (es.m.position.distanceTo(rocks[r].mesh.position) < rocks[r].r) {
          burst3D(es.m.position, '#ff9966', 5, 9, 0.8);
          es.life = 0; es.m.visible = false;
          break;
        }
      }
      if (es.life <= 0) {
        if (es.m.visible && es.homing) burst3D(es.m.position, '#ffaa66', 6, 8, 0.8);
        es.m.visible = false;
      }
    }
  }

  /* ---------------- efeitos e câmera ---------------- */
  function updateFx(dt) {
    for (var i = 0; i < st.parts.length; i++) {
      var p = st.parts[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.spr.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(Math.exp(-1.6 * dt));
      var k = Math.max(0, p.life / p.max);
      p.spr.material.opacity = k;
      p.spr.scale.setScalar(p.size * (0.5 + k * 0.7));
      if (p.life <= 0) p.spr.visible = false;
    }
    for (var j = 0; j < st.rings.length; j++) {
      var rg = st.rings[j];
      if (rg.life <= 0) continue;
      rg.life -= dt;
      var kk = 1 - Math.max(0, rg.life / rg.max);
      rg.spr.scale.setScalar(rg.size * (0.4 + kk * 3.2));
      rg.spr.material.opacity = (1 - kk) * 0.9;
      if (rg.life <= 0) rg.spr.visible = false;
    }
    for (var db = 0; db < st.debris.length; db++) {
      var d = st.debris[db];
      if (d.life <= 0) continue;
      d.life -= dt;
      d.m.position.addScaledVector(d.vel, dt);
      d.vel.multiplyScalar(Math.exp(-0.4 * dt));
      d.m.rotation.x += d.rot.x * dt;
      d.m.rotation.y += d.rot.y * dt;
      if (d.life <= 0) d.m.visible = false;
    }
  }

  function updateCamera(dt) {
    var s = st.ship;
    var want = new THREE.Vector3(s.pos.x * 0.92, s.pos.y * 0.9 + 2.5, s.pos.z + 8.6);
    camera.position.lerp(want, 1 - Math.exp(-dt * 5));
    var look = s.pos.clone().add(new THREE.Vector3(0, 0.4, -14));
    look.lerp(st.aimPoint, 0.18);
    camera.lookAt(look);
    camera.rotation.z += s.roll * 0.24;
    if (st.shake > 0.002) {
      camera.position.x += rand(-st.shake, st.shake);
      camera.position.y += rand(-st.shake, st.shake);
    }
    /* FOV abre no turbo: sensação de velocidade */
    var fovWant = st.turboActive ? 69 : 62;
    if (Math.abs(camera.fov - fovWant) > 0.05) {
      camera.fov = lerp(camera.fov, fovWant, 1 - Math.exp(-dt * 4));
      camera.updateProjectionMatrix();
    }
  }
  /* =====================================================================
     HUD DE COMBATE (canvas 2D sobreposto ao WebGL)
  ====================================================================== */
  function AudioSys_sfx(name) {
    try { if (window.AudioSys) window.AudioSys.sfx(name); } catch (e) {}
  }

  var v3tmp = null;
  function projectToScreen(pos) {
    if (!v3tmp) v3tmp = new THREE.Vector3();
    v3tmp.copy(pos).project(camera);
    return {
      x: (v3tmp.x * 0.5 + 0.5) * cssW,
      y: (-v3tmp.y * 0.5 + 0.5) * cssH,
      behind: v3tmp.z > 1
    };
  }

  function drawHud() {
    var g = hudCtx;
    if (!g) return;
    g.clearRect(0, 0, cssW, cssH);
    var u = uiS;

    /* ---- mira (retículo) ---- */
    var rp = projectToScreen(st.aimPoint);
    if (!rp.behind) {
      var col = st.ammo.color || '#7ff5ff';
      var rad = (13 + st.reticlePulse * 7) * u;
      g.save();
      g.translate(rp.x, rp.y);
      g.strokeStyle = col;
      g.lineWidth = 2 * u * 0.7;
      for (var q = 0; q < 2; q++) {
        g.save();
        g.rotate((q ? -1 : 1) * st.t * 1.5);
        g.beginPath();
        g.arc(0, 0, rad, q ? Math.PI * 0.6 : Math.PI * 0.1, q ? Math.PI * 1.4 : Math.PI * 0.9);
        g.stroke();
        g.restore();
      }
      g.fillStyle = col;
      g.beginPath();
      g.arc(0, 0, 2.4 * u, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 0.35;
      g.beginPath();
      g.arc(0, 0, rad + 5 * u, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }

    /* ---- barra do boss ---- */
    var b = st.boss;
    if (b) {
      var bw = Math.min(340 * u, cssW * 0.58), bh = 11 * u;
      var bx = (cssW - bw) / 2, by = 22 * u;
      var phColor = ['#39d98a', '#ffd166', '#ff5d6c'][b.phase - 1];
      g.textAlign = 'center';
      g.font = (8 * u) + 'px "Press Start 2P", monospace';
      g.fillStyle = '#ffb3c2';
      g.fillText(T('boss.name', 'DEVORADOR ESTELAR'), cssW / 2, by - 6 * u);
      g.fillStyle = 'rgba(10,4,12,0.8)';
      g.fillRect(bx, by, bw, bh);
      /* fantasma branco da vida perdida (escorrega até a vida atual) */
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(bx, by, bw * clamp(b.dispHp / b.maxHp, 0, 1), bh);
      g.fillStyle = phColor;
      g.fillRect(bx, by, bw * clamp(b.hp / b.maxHp, 0, 1), bh);
      g.strokeStyle = 'rgba(255,255,255,0.3)';
      g.lineWidth = 1;
      g.strokeRect(bx, by, bw, bh);
      /* marcas das fases (33% e 66%) */
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.fillRect(bx + bw * 0.333, by, 2, bh);
      g.fillRect(bx + bw * 0.667, by, 2, bh);
      g.font = (7 * u) + 'px "Press Start 2P", monospace';
      g.fillStyle = phColor;
      g.textAlign = 'left';
      g.fillText(T('boss.phase', 'FASE') + ' ' + b.phase, bx + bw + 10 * u, by + bh);

      /* ---- falas do boss ---- */
      if (st.quote) {
        var qt = st.quote.t;
        var alpha = qt < 0.25 ? qt / 0.25 : (qt > st.quote.dur - 0.4 ? (st.quote.dur - qt) / 0.4 : 1);
        var shown = st.quote.txt.slice(0, Math.floor(qt * 30));
        g.font = (7 * u) + 'px "Press Start 2P", monospace';
        var tw = g.measureText(shown).width;
        var qw = tw + 24 * u, qx = (cssW - qw) / 2, qy = by + bh + 8 * u, qh = 20 * u;
        g.globalAlpha = clamp(alpha, 0, 1);
        g.fillStyle = 'rgba(6,4,16,0.82)';
        g.fillRect(qx, qy, qw, qh);
        g.strokeStyle = '#ff5d6c';
        g.strokeRect(qx, qy, qw, qh);
        g.fillStyle = '#ffd9e0';
        g.textAlign = 'center';
        g.fillText(shown, cssW / 2, qy + 13.5 * u);
        g.globalAlpha = 1;
      }
    }

    /* ---- objetivo ---- */
    g.font = (7 * u) + 'px "Press Start 2P", monospace';
    g.textAlign = 'left';
    g.fillStyle = 'rgba(160,200,255,0.75)';
    g.fillText('▸ ' + T('boss.objective', 'Destrua o Devorador Estelar'), 12 * u, 18 * u);

    /* ---- blindagem + energia ---- */
    var hy = cssH - 40 * u;
    g.fillStyle = 'rgba(160,200,255,0.85)';
    g.fillText(T('boss.hull', 'BLINDAGEM'), 12 * u, hy - 6 * u);
    for (var i = 0; i < 5; i++) {
      var blink = st.ship.invuln > 0 && Math.floor(st.t * 12) % 2 === 0;
      g.fillStyle = i < st.ship.hull ? (blink ? '#ffffff' : '#59d3ff') : '#1b2b3a';
      g.fillRect(12 * u + i * 21 * u, hy, 17 * u, 9 * u);
      g.strokeStyle = 'rgba(120,180,255,0.4)';
      g.strokeRect(12 * u + i * 21 * u, hy, 17 * u, 9 * u);
    }
    g.fillStyle = 'rgba(160,200,255,0.85)';
    g.fillText(T('boss.energy', 'ENERGIA'), 12 * u, hy + 20 * u);
    g.fillStyle = '#12203a';
    g.fillRect(78 * u, hy + 12 * u, 110 * u, 7 * u);
    g.fillStyle = st.turboActive ? '#ffc46b' : '#7ff5ff';
    g.fillRect(78 * u, hy + 12 * u, 110 * u * (st.energy / 100), 7 * u);
    g.strokeStyle = 'rgba(120,200,255,0.45)';
    g.strokeRect(78 * u, hy + 12 * u, 110 * u, 7 * u);

    /* ---- munição equipada ---- */
    var cy = cssH - 52 * u - (st.touchMode ? 96 * u : 0);
    var cw = 168 * u, cx = cssW - cw - 12 * u;
    g.fillStyle = 'rgba(6,10,26,0.72)';
    g.fillRect(cx, cy, cw, 34 * u);
    g.strokeStyle = st.ammo.color || '#7ff5ff';
    g.lineWidth = 2;
    g.strokeRect(cx, cy, cw, 34 * u);
    g.fillStyle = st.ammo.color || '#7ff5ff';
    g.textAlign = 'left';
    g.font = (11 * u) + 'px "Press Start 2P", monospace';
    g.fillText(st.ammo.formula || '⚡', cx + 8 * u, cy + 14 * u);
    g.fillStyle = 'rgba(220,235,255,0.85)';
    g.font = (6 * u) + 'px "Press Start 2P", monospace';
    g.fillText((st.ammo.name || 'Célula Padrão').slice(0, 22), cx + 8 * u, cy + 26 * u);
    g.textAlign = 'right';
    g.font = (8 * u) + 'px "Press Start 2P", monospace';
    var lowAmmo = st.mag !== Infinity && st.mag / st.magMax < 0.25;
    g.fillStyle = lowAmmo ? (Math.floor(st.t * 6) % 2 ? '#ffd166' : '#ff8844') : '#cfe6ff';
    g.fillText(T('boss.ammo', 'MUNIÇÃO') + ': ' + (st.mag === Infinity ? '∞' : String(st.mag)), cx + cw - 8 * u, cy + 27 * u);

    /* aviso rápido (troca de munição etc.) */
    if (st.notice) {
      g.globalAlpha = clamp(1 - st.notice.t / 2.6, 0, 1);
      g.textAlign = 'center';
      g.fillStyle = '#ffd166';
      g.font = (7 * u) + 'px "Press Start 2P", monospace';
      g.fillText(st.notice.txt, cx + cw / 2, cy - 8 * u);
      g.globalAlpha = 1;
    }

    /* ---- dica inicial de controles ---- */
    if (st.introT > 0) {
      var ia = clamp(Math.min(st.introT, 4.6 - st.introT) / 0.6, 0, 1);
      var lines = (st.touchMode
        ? T('boss.hintMobile', 'JOYSTICK ESQUERDO: MOVER\nTOQUE: MIRAR\nBOTÃO VERMELHO: ATIRAR\nBOTÃO CIANO: TURBO')
        : T('boss.hintPC', 'WASD/SETAS: MOVER\nQ/E: RECUO/AVANÇO\nMOUSE: MIRAR · ESPAÇO OU CLIQUE: ATIRAR\nSHIFT: TURBO')).split('\n');
      g.globalAlpha = ia * 0.92;
      var lwMax = 0;
      g.font = (7 * u) + 'px "Press Start 2P", monospace';
      for (var li = 0; li < lines.length; li++) lwMax = Math.max(lwMax, g.measureText(lines[li]).width);
      var pw = lwMax + 36 * u, pxx = (cssW - pw) / 2, pyy = cssH * 0.32, phh = lines.length * 15 * u + 30 * u;
      g.fillStyle = 'rgba(4,8,22,0.88)';
      g.fillRect(pxx, pyy, pw, phh);
      g.strokeStyle = '#59d3ff';
      g.lineWidth = 2;
      g.strokeRect(pxx, pyy, pw, phh);
      g.textAlign = 'center';
      g.fillStyle = '#7ff5ff';
      g.fillText(T('boss.hintTitle', 'COMO PILOTAR'), cssW / 2, pyy + 18 * u);
      g.fillStyle = '#dfeaff';
      for (var ln = 0; ln < lines.length; ln++) {
        g.fillText(lines[ln], cssW / 2, pyy + 38 * u + ln * 15 * u);
      }
      g.globalAlpha = 1;
    }

    /* ---- controles mobile: joystick + botões (SÓ em toque) ---- */
    if (st.touchMode) {
      if (st.joy.id !== null) {
        g.strokeStyle = 'rgba(255,255,255,0.4)';
        g.fillStyle = 'rgba(90,140,220,0.14)';
        g.lineWidth = 2;
        g.beginPath(); g.arc(st.joy.bx, st.joy.by, 48, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = 'rgba(140,190,255,0.55)';
        g.beginPath(); g.arc(st.joy.bx + (st.joy.kx || 0), st.joy.by + (st.joy.ky || 0), 19, 0, Math.PI * 2); g.fill();
      }
      drawBtn(g, st.btnFire, '#ff5d6c', T('boss.fire', 'ATIRAR'), st.fireId !== null);
      drawBtn(g, st.btnTurbo, '#59d3ff', T('boss.turbo', 'TURBO'), st.turboHold);
    }

    /* ---- vinheta de dano ---- */
    var vig = st.vignette;
    if (st.ship.hull <= 1 && !st.over) vig = Math.max(vig, 0.28 + Math.sin(st.t * 5) * 0.12);
    if (vig > 0.01) {
      var grd = g.createRadialGradient(cssW / 2, cssH / 2, cssH * 0.32, cssW / 2, cssH / 2, cssH * 0.72);
      grd.addColorStop(0, 'rgba(255,40,60,0)');
      grd.addColorStop(1, 'rgba(255,30,50,' + (vig * 0.55).toFixed(3) + ')');
      g.fillStyle = grd;
      g.fillRect(0, 0, cssW, cssH);
    }
    if (st.flashW > 0.01) {
      g.fillStyle = 'rgba(255,255,255,' + clamp(st.flashW, 0, 1).toFixed(3) + ')';
      g.fillRect(0, 0, cssW, cssH);
    }
    if (st.fadeOut > 0) {
      g.fillStyle = 'rgba(2,3,8,' + clamp(st.fadeOut, 0, 1).toFixed(3) + ')';
      g.fillRect(0, 0, cssW, cssH);
    }
  }

  function drawBtn(g, btn, color, label, pressed) {
    g.beginPath();
    g.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
    g.fillStyle = pressed ? 'rgba(255,255,255,0.28)' : 'rgba(10,16,34,0.55)';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = color;
    g.stroke();
    g.fillStyle = color;
    g.font = Math.round(btn.r * 0.24) + 'px "Press Start 2P", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, btn.x, btn.y);
    g.textBaseline = 'alphabetic';
  }

  /* =====================================================================
     ENTRADA: mouse no PC; toque com papéis distintos no celular
  ====================================================================== */
  function setAimFromScreen(px, py) {
    st.aimNdc.x = clamp((px / cssW) * 2 - 1, -1, 1);
    st.aimNdc.y = clamp(-((py / cssH) * 2 - 1), -1, 1);
  }

  function pointerDown(e, rect) {
    if (!active || !st || st.over) return;
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    if (st.touchMode && e.pointerType === 'touch') {
      var df = Math.hypot(px - st.btnFire.x, py - st.btnFire.y);
      var dtb = Math.hypot(px - st.btnTurbo.x, py - st.btnTurbo.y);
      if (df <= st.btnFire.r * 1.25) { st.fireId = e.pointerId; st.firing = true; return; }
      if (dtb <= st.btnTurbo.r * 1.25) { st.turboId = e.pointerId; st.turboHold = true; return; }
      if (px < cssW * 0.5) {
        st.joy.id = e.pointerId;
        st.joy.bx = px; st.joy.by = py; st.joy.x = 0; st.joy.y = 0;
        return;
      }
      st.aimTouchId = e.pointerId;
      setAimFromScreen(px, py);
    } else {
      st.firing = true;
      setAimFromScreen(px, py);
    }
  }

  function pointerMove(e, rect) {
    if (!active || !st) return;
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    if (e.pointerType === 'touch') {
      if (e.pointerId === st.joy.id) {
        var dx = px - st.joy.bx, dy = py - st.joy.by;
        var len = Math.hypot(dx, dy);
        var maxR = 48;
        if (len > maxR) { dx = dx / len * maxR; dy = dy / len * maxR; }
        st.joy.x = Math.abs(dx) > 8 ? dx / maxR : 0;
        st.joy.y = Math.abs(dy) > 8 ? dy / maxR : 0;
        st.joy.kx = dx; st.joy.ky = dy;
        return;
      }
      if (e.pointerId === st.aimTouchId) setAimFromScreen(px, py);
    } else {
      setAimFromScreen(px, py);
    }
  }

  function pointerUp(pointerId) {
    if (!active || !st) return;
    if (pointerId === st.fireId) { st.fireId = null; st.firing = false; }
    if (pointerId === st.turboId) { st.turboId = null; st.turboHold = false; }
    if (pointerId === st.joy.id) {
      st.joy.id = null; st.joy.x = 0; st.joy.y = 0; st.joy.kx = 0; st.joy.ky = 0;
    }
    if (pointerId === st.aimTouchId) st.aimTouchId = null;
  }

  /* =====================================================================
     API PÚBLICA
  ====================================================================== */
  window.BossBattle = {
    supported: supported,
    start: start,
    stop: stop,
    tick: tick,
    isActive: isActive,
    pointerDown: pointerDown,
    pointerMove: pointerMove,
    pointerUp: pointerUp,
    /* diagnóstico: último erro de inicialização (se houve) */
    lastError: function () { return lastStartError; },
    /* expostos para testes automatizados */
    _debug: function () { return st; }
  };
})();
