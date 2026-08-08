/* =====================================================================
   SPACE CHEMISTRY: MISSION BONDS — effects3d.js
   Camada 3D / 2.5D complementar (Three.js).

   O QUE É
   - Camada puramente VISUAL e opcional, sobreposta ao jogo 2D. NÃO toca
     no gameplay 2D: mapas, personagens, combate, controles, fases,
     viagem espacial, pontuação, questionário, customização e progressão
     continuam exatamente como estão.
   - Cenas cinematográficas:
       * menu (tela inicial)              → planeta 3D com anéis e atmosfera,
                                            galáxia de partículas, estrelas
                                            cadentes (2.5D).
       * galaxy (mapa da galáxia)         → espiral 3D de partículas girando.
       * rules / wardrobe / achievements  → parallax estelar com profundidade.
       * game (somente em cenas espaciais) → durante 'arrival', 'travel' e
            'return': estrelas com profundidade, nebulosa na cor do planeta
            de destino e estrelas cadentes (efeito aditivo e sutil).
   - Pode ser desligado pelo jogador (botão no menu) ou desativa sozinho
     se WebGL / Three.js não estiver disponível. Com o 3D desligado, o jogo
     funciona exatamente como antes.

   INTEGRAÇÃO (toda em script.js, 3 chamadas):
   - Effects3D.init()  → no init() do jogo.
   - Effects3D.tick(dt) → no loop principal (update + render).
   - Effects3D.toggle() → botão do menu (opcional).
   O restante é lido em tempo de execução de Game.screen / Game.phase /
   Game.level — nada do gameplay é alterado por este módulo.
===================================================================== */
(function () {
  'use strict';

  var PREF_KEY = 'spaceChemistryEffects3d';
  var FOV = 55;
  var CAM_DIST = 6.2;
  var MAX_DPR = 2;

  var supported = false;
  var enabled = false;
  var renderer = null;
  var scene = null;
  var camera = null;
  var colorTmp = null;

  var lastContent = '';
  var viewAspect = 16 / 9;
  var halfH = 3.2;
  var halfW = 5.7;
  var sceneTime = 0;

  var levelColor = '#7ff5ff';

  var dotTex = null;
  var planetTex = null;
  var ringTex = null;
  var glowTex = null;
  var streakTex = null;

  var starsFar = null;
  var starsNear = null;
  var nebula = null;
  var menuGroup = null;
  var galaxyGroup = null;
  var shootingStar = null;

  var shoot = { active: false, t: 0, dur: 0, vx: 0, vy: 0, sx: 0, sy: 0 };
  var shootTimer = 2.5;

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------------- preferência do jogador ---------------- */
  function loadPref() {
    try { var v = localStorage.getItem(PREF_KEY); return v === null ? true : v === '1'; }
    catch (e) { return true; }
  }
  function savePref(v) {
    try { localStorage.setItem(PREF_KEY, v ? '1' : '0'); } catch (e) {}
  }

  /* ---------------- suporte (Three.js + WebGL) ---------------- */
  function probeWebGL() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      return !!gl;
    } catch (e) { return false; }
  }

  /* ---------------- texturas geradas por código ---------------- */
  function makeDotTexture() {
    var s = 16, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  function makeGlowTexture() {
    var s = 128, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.6)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  function makeStreakTexture() {
    var w = 64, h = 8, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    var grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    return new THREE.CanvasTexture(cv);
  }

  /* Planeta gasoso: faixas onduladas com as cores das ligações químicas
     (iônica rosa, covalente ciano, metálica dourada). */
  function makePlanetTexture() {
    var w = 256, h = 128, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    var bands = [
      { top: 0.0,  color: '#3a2a6b' },
      { top: 0.15, color: '#ff9df2' },
      { top: 0.29, color: '#7ff5ff' },
      { top: 0.45, color: '#ffd166' },
      { top: 0.61, color: '#59d3ff' },
      { top: 0.77, color: '#c8a2ff' },
      { top: 0.93, color: '#ff9df2' }
    ];
    for (var i = 0; i < bands.length - 1; i++) {
      var y0 = Math.round(bands[i].top * h);
      var y1 = Math.round(bands[i + 1].top * h);
      var grad = g.createLinearGradient(0, y0, 0, y1);
      grad.addColorStop(0, bands[i].color);
      grad.addColorStop(1, bands[i + 1].color);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, y0);
      for (var x = 0; x <= w; x += 8) {
        g.lineTo(x, y0 + Math.sin(x * 0.12 + i * 1.7) * 2.2);
      }
      g.lineTo(w, y1 + Math.sin(w * 0.12 + i * 1.7) * 2.2);
      for (x = w; x >= 0; x -= 8) {
        g.lineTo(x, y1 + Math.sin(x * 0.16 + i * 2.3 + 1) * 2.2);
      }
      g.closePath();
      g.fill();
    }
    /* sombreamento lateral sutil (esfera) */
    var dark = g.createLinearGradient(0, 0, w, 0);
    dark.addColorStop(0, 'rgba(0,0,0,0.4)');
    dark.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    dark.addColorStop(1, 'rgba(0,0,0,0.4)');
    g.fillStyle = dark;
    g.fillRect(0, 0, w, h);
    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  /* Anéis tipo Saturno: círculos concêntricos finos */
  function makeRingTexture() {
    var s = 128, cx = s / 2, cy = s / 2, cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var g = cv.getContext('2d');
    for (var i = 0; i < 46; i++) {
      var r = s / 2 * (0.3 + i * 0.0125);
      var a = 0.08 + 0.8 * Math.abs(Math.sin(i * 0.7));
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(255,215,150,' + a + ')';
      g.lineWidth = 1.5;
      g.stroke();
    }
    return new THREE.CanvasTexture(cv);
  }

  /* ---------------- objetos da cena ---------------- */
  function makeStars(count, size, spread, zmin, zrange) {
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var palette = ['#ffffff', '#bfe8ff', '#ffd9f2', '#fff3c4', '#c8d6ff'];
    var pc = palette.map(function (c) { return new THREE.Color(c); });
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread.x;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      pos[i * 3 + 2] = -zmin - Math.random() * zrange;
      var c = pc[(Math.random() * pc.length) | 0];
      var b = 0.55 + Math.random() * 0.45;
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size: size, map: dotTex, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true, vertexColors: true
    });
    var pts = new THREE.Points(geo, mat);
    pts.userData.base = pos.slice();
    pts.userData.range = zrange + zmin;
    return pts;
  }

  function scrollStars(dt) {
    var speed = 2.1;
    var attrs = [starsFar.geometry.attributes.position, starsNear.geometry.attributes.position];
    var mults = [1, 1.55];
    for (var k = 0; k < attrs.length; k++) {
      var arr = attrs[k].array;
      var range = k === 0 ? starsFar.userData.range : starsNear.userData.range;
      for (var i = 0; i < arr.length; i += 3) {
        arr[i + 2] += speed * mults[k] * dt;
        if (arr[i + 2] > 2) arr[i + 2] -= range;
      }
      attrs[k].needsUpdate = true;
    }
  }

  function resetStars() {
    starsFar.geometry.attributes.position.array.set(starsFar.userData.base);
    starsNear.geometry.attributes.position.array.set(starsNear.userData.base);
    starsFar.geometry.attributes.position.needsUpdate = true;
    starsNear.geometry.attributes.position.needsUpdate = true;
  }

  function makeGalaxy() {
    var count = 2600;
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var palette = ['#7ff5ff', '#ff9df2', '#ffd166', '#c8a2ff', '#ffffff'];
    var pc = palette.map(function (c) { return new THREE.Color(c); });
    var R = 4.6;
    for (var i = 0; i < count; i++) {
      var t = Math.pow(i / count, 0.62);
      var a = i * 2.39996;
      var r = t * R;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.22 * (1 - t * 0.5);
      pos[i * 3 + 2] = Math.sin(a) * r;
      var c = pc[(Math.random() * pc.length) | 0];
      var b = (0.35 + Math.random() * 0.6) * (1 - t * 0.4);
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.14, map: dotTex, transparent: true, opacity: 0.7,
      depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true, vertexColors: true
    });
    var grp = new THREE.Group();
    var pts = new THREE.Points(geo, mat);
    grp.add(pts);
    grp.rotation.x = -Math.PI / 4.5;
    grp.rotation.y = 0.6;
    grp.rotation.z = 0.15;
    return grp;
  }

  function makeMenuPlanet() {
    var grp = new THREE.Group();
    var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 48, 32),
      new THREE.MeshBasicMaterial({ map: planetTex })
    );
    grp.add(sphere);
    var atm = new THREE.Mesh(
      new THREE.SphereGeometry(0.94, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x7ff5ff, transparent: true, opacity: 0.3,
        side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
      })
    );
    grp.add(atm);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(1.12, 1.9, 64),
      new THREE.MeshBasicMaterial({
        map: ringTex, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    ring.rotation.x = -Math.PI / 2.6;
    ring.rotation.z = 0.3;
    grp.add(ring);
    grp.visible = false;
    return grp;
  }

  function makeNebula() {
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    spr.scale.set(14, 9, 1);
    spr.position.set(0, 0, -7);
    return spr;
  }

  function makeShooting() {
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: streakTex, transparent: true, opacity: 0, color: 0xcfe9ff,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    spr.visible = false;
    return spr;
  }

  /* ---------------- renderer / cena ---------------- */
  function createRenderer() {
    var r = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    r.setClearColor(0x000000, 0);
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    r.domElement.style.width = '100%';
    r.domElement.style.height = '100%';
    r.domElement.style.display = 'block';
    r.domElement.style.pointerEvents = 'none';
    return r;
  }

  function fitToContainer(el) {
    var w = Math.max(1, el.clientWidth);
    var h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    viewAspect = w / h;
    camera.aspect = viewAspect;
    camera.updateProjectionMatrix();
    halfH = Math.tan(FOV * Math.PI / 360) * CAM_DIST;
    halfW = halfH * viewAspect;
    placeScene();
  }

  function placeScene() {
    if (menuGroup) {
      menuGroup.position.set(halfW * 0.6, halfH * 0.3, 0);
      menuGroup.scale.setScalar(clamp(halfH * 0.24, 0.5, 1.0));
    }
    if (galaxyGroup) {
      galaxyGroup.position.y = halfH * 0.32;
      galaxyGroup.scale.setScalar(clamp(halfH / 3.1, 0.7, 1.1));
    }
  }

  /* ---------------- leitura do estado do jogo (sem alterá-lo) ---------------- */
  function readScreen() {
    try { if (Game.screen) return Game.screen; } catch (e) {}
    return 'menu';
  }
  function readPhase() {
    try { if (Game.phase) return Game.phase; } catch (e) {}
    return '';
  }
  function readLevelColor() {
    try {
      if (!Game) return;
      var phase = readPhase();
      if (phase === 'travel') {
        var nextIdx = Math.min((Game.levelIndex || 0) + 1, 4);
        var lv = LEVELS[nextIdx];
        var th = lv && THEMES[lv.theme];
        if (th) { levelColor = th.planet || th.accent || levelColor; return; }
      }
      if (Game.level && Game.level.theme) {
        levelColor = Game.level.theme.planet || Game.level.theme.accent || levelColor;
      }
    } catch (e) {}
  }

  /* ---------------- seleção de conteúdo ---------------- */
  function contentFor(screen, phase) {
    if (screen === 'game') {
      return (phase === 'arrival' || phase === 'travel' || phase === 'return')
        ? 'game' : 'none';
    }
    if (screen === 'menu') return 'menu';
    if (screen === 'galaxy') return 'galaxy';
    return 'generic';
  }

  function containerFor(content, screen) {
    if (content === 'none' || content === '') return null;
    if (content === 'menu') return 'fx3d-menu';
    if (content === 'galaxy') return 'fx3d-galaxy';
    if (content === 'game') return 'fx3d-game';
    return 'fx3d-' + screen; /* rules / wardrobe / achievements */
  }

  function attachCanvas(id) {
    var c = document.getElementById(id);
    if (!c) { detachCanvas(); return; }
    if (renderer.domElement.parentNode !== c) {
      c.appendChild(renderer.domElement);
      fitToContainer(c);
    }
  }
  function detachCanvas() {
    var el = renderer.domElement;
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  function applyContent(content) {
    menuGroup.visible = content === 'menu';
    galaxyGroup.visible = content === 'galaxy';
    starsFar.visible = content !== 'none';
    starsNear.visible = content !== 'none';
  }

  function updateShooting(dt, content) {
    if (content !== 'menu' && content !== 'game') {
      shootingStar.visible = false;
      return;
    }
    shootTimer -= dt;
    if (!shoot.active && shootTimer <= 0) {
      shoot.active = true;
      shoot.dur = 1.4; shoot.t = 0;
      shoot.sx = halfW * (0.85 + Math.random() * 0.4);
      shoot.sy = halfH * (0.8 + Math.random() * 0.4);
      shoot.vx = -(halfW * 1.7) / shoot.dur;
      shoot.vy = -(halfH * (0.4 + Math.random() * 0.5)) / shoot.dur;
      shootTimer = 3 + Math.random() * 4;
      shootingStar.visible = true;
    }
    if (shoot.active) {
      shoot.t += dt;
      var k = shoot.t / shoot.dur;
      if (k >= 1) {
        shoot.active = false;
        shootingStar.visible = false;
      } else {
        shootingStar.position.set(shoot.sx + shoot.vx * shoot.t, shoot.sy + shoot.vy * shoot.t, -4);
        var alpha = Math.sin(Math.min(1, k * 3) * Math.PI) * 0.9;
        shootingStar.material.opacity = alpha;
        shootingStar.material.rotation = Math.atan2(shoot.vy, shoot.vx) + Math.PI / 2;
        shootingStar.scale.set(2.4, 0.26, 1);
      }
    }
  }

  function updateScene(dt, content) {
    sceneTime += dt;
    if (lastContent !== content) {
      if (content !== 'game') resetStars();
    }

    if (content === 'menu') {
      menuGroup.rotation.y += dt * 0.16;
      menuGroup.rotation.x = Math.sin(sceneTime * 0.1) * 0.06;
      menuGroup.position.y = halfH * 0.3 + Math.sin(sceneTime * 0.7) * 0.08;
      starsFar.rotation.y += dt * 0.006;
      starsNear.rotation.y -= dt * 0.01;
      starsFar.material.opacity = 0.75;
      starsNear.material.opacity = 0.9;
    } else if (content === 'galaxy') {
      galaxyGroup.rotation.y += dt * 0.07;
      starsFar.rotation.y += dt * 0.004;
      starsNear.rotation.y -= dt * 0.007;
      starsFar.material.opacity = 0.7;
      starsNear.material.opacity = 0.85;
    } else if (content === 'game') {
      scrollStars(dt);
      starsFar.material.opacity = 0.55;
      starsNear.material.opacity = 0.7;
      if (colorTmp) nebula.material.color.copy(colorTmp.set(levelColor));
      nebula.material.opacity = lerp(nebula.material.opacity, 0.25, dt * 2);
      nebula.scale.set(14 + Math.sin(sceneTime * 0.15) * 0.8, 9 + Math.cos(sceneTime * 0.2) * 0.6, 1);
    } else if (content === 'generic') {
      starsFar.rotation.y += dt * 0.004;
      starsNear.rotation.y -= dt * 0.007;
      starsFar.material.opacity = 0.7;
      starsNear.material.opacity = 0.85;
    }

    nebula.material.opacity = content === 'game'
      ? nebula.material.opacity
      : lerp(nebula.material.opacity, 0, dt * 3);

    updateShooting(dt, content);
    lastContent = content;
  }

  /* ---------------- API pública ---------------- */
  function tick(dt) {
    if (!enabled || !renderer) return;
    var screen = readScreen();
    var phase = readPhase();
    readLevelColor();
    var content = contentFor(screen, phase);
    var containerId = containerFor(content, screen);
    if (containerId) attachCanvas(containerId);
    else detachCanvas();
    if (content === 'none' || !renderer.domElement.parentNode) return;
    applyContent(content);
    updateScene(dt, content);
    renderer.render(scene, camera);
  }

  function buildScene() {
    colorTmp = new THREE.Color();
    dotTex = makeDotTexture();
    planetTex = makePlanetTexture();
    ringTex = makeRingTexture();
    glowTex = makeGlowTexture();
    streakTex = makeStreakTexture();

    renderer = createRenderer();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, viewAspect, 0.1, 100);
    camera.position.set(0, 0, CAM_DIST);
    camera.lookAt(0, 0, 0);

    starsFar = makeStars(700, 0.09, { x: 26, y: 16, z: 14 }, 1, 14);
    starsNear = makeStars(220, 0.16, { x: 20, y: 12, z: 10 }, 1, 10);
    scene.add(starsFar);
    scene.add(starsNear);

    nebula = makeNebula();
    scene.add(nebula);

    menuGroup = makeMenuPlanet();
    scene.add(menuGroup);

    galaxyGroup = makeGalaxy();
    scene.add(galaxyGroup);

    shootingStar = makeShooting();
    scene.add(shootingStar);

    window.addEventListener('resize', onResize);
    attachCanvas('fx3d-menu');
    fitToContainer(document.getElementById('fx3d-menu'));
  }

  function init() {
    supported = !!window.THREE && probeWebGL();
    enabled = supported && loadPref();
    if (!enabled) return;
    buildScene();
    lastContent = '';
  }

  function toggle() {
    if (!supported) return false;
    enabled = !enabled;
    savePref(enabled);
    if (enabled) {
      if (!renderer) buildScene();
      lastContent = '';
    } else {
      detachCanvas();
      lastContent = '';
    }
    return enabled;
  }

  function onResize() {
    if (!enabled || !renderer) return;
    var parent = renderer.domElement.parentNode;
    if (parent) fitToContainer(parent);
  }

  window.Effects3D = {
    init: init,
    tick: tick,
    toggle: toggle,
    isEnabled: function () { return enabled; },
    supported: function () { return supported; }
  };
})();
