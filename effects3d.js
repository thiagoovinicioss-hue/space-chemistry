/* =====================================================================
   SPACE CHEMISTRY: MISSION BONDS — effects3d.js
   Camada 3D / 2.5D complementar (Three.js).

   O QUE É
   - Camada puramente VISUAL e opcional, sobreposta ao jogo 2D. NÃO toca
     no gameplay 2D: mapas, personagens, combate, controles, fases,
     viagem espacial, pontuação, questionário, customização e progressão
     continuam exatamente como estão.
   - Cenas cinematográficas:
       * menu (tela inicial)            → planeta estilizado "ligações"
                                          (faixas pixel art rosa/ciano/ouro),
                                          anéis, atmosfera, poeira orbital.
       * galaxy (mapa da galáxia)       → espiral 3D de partículas girando.
       * rules / wardrobe / achievements→ parallax estelar com profundidade.
       * game (somente em cenas espaciais) → PLANETAS 3D ESTILIZADOS por
            tema (identidade visual própria), usados principalmente nas
            transições e cenas espaciais:
              - travel : planeta de DESTINO no mesmo ponto do mapa (TR_DEST);
              - arrival: planeta grande no céu, atrás da aterrissagem;
              - return : planeta que você está deixando, ao fundo.
            Cada planeta: rotação lenta, iluminação, atmosfera e pequenas
            partículas orbitando. Texturas 100% pixel art (geradas por
            código), sem modelos genéricos.
       * IA de identidade por tema:
              iônico   → azulado, cristais 3D, energia, rochas, brilhos;
              covalente→ vegetação, rios, áreas verdes, natureza;
              metálico → cinza industrial, painéis, rebitado, brilho
                         metálico (specular), dutos incandescentes;
              final    → cósmico, veios de energia, fragmentos flutuando.
   - Pode ser desligado pelo jogador (botão no menu) ou desativa sozinho
     se WebGL / Three.js não estiver disponível. Com o 3D desligado, o jogo
     funciona exatamente como antes (o desenho 2D do planeta de destino
     volta a aparecer na viagem).

   INTEGRAÇÃO (toda em script.js):
   - Effects3D.init()  → no init() do jogo.
   - Effects3D.tick(dt) → no loop principal (update + render).
   - Effects3D.toggle() → botão do menu (opcional).
   - Em script.js, drawTravelPlanet() omite o disco 2D quando o 3D está
     ligado (o restante — anel, nome e seta — continua sendo desenhado).
   O restante é lido em tempo de execução de Game.screen / Game.phase /
   Game.level / Game.levelIndex — nada do gameplay é alterado.
===================================================================== */
(function () {
  'use strict';

  var PREF_KEY = 'spaceChemistryEffects3d';
  var FOV = 55;
  var CAM_DIST = 6.2;
  var MAX_DPR = 2;
  var LOGICAL_W = 640;
  var LOGICAL_H = 360;

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
  var ringTex = null;
  var glowTex = null;
  var streakTex = null;

  var starsFar = null;
  var starsNear = null;
  var nebula = null;
  var menuGroup = null;
  var galaxyGroup = null;
  var shootingStar = null;

  var hemiLight = null;
  var dirLight = null;
  var rimLight = null;

  /* Planeta 3D ativo nas cenas espaciais */
  var planetCache = {};
  var activePlanet = null;
  var activeTheme = '';
  var activePhase = '';
  var phaseAge = 0;

  /* Frota inimiga 3D da batalha final (pool estático, sincronizado com a
     posição lógica 2D de Game.return.enemies — a colisão é sempre 2D). */
  var returnFleet = null;
  var RETURN_FLEET_POOL = 8;

  /* Cinemática das transições de viagem (decolagem / chegada) */
  var cin = null;
  var cinShip = null;
  var cinExhaust = null;
  var cinAtmo = null;
  var cinFlash = null;
  var blackTex = null;
  var blackScreen = null;
  var black = { a: 0, target: 0, speed: 1 };
  var cinPaused = false;
  var CIN_DEPART_DUR = 4.2;
  var CIN_ARRIVE_DUR = 4.6;
  var CIN_REVEAL = 0.45;
  var CIN_TAIL = 0.6;

  var YVEC = null;

  var shoot = { active: false, t: 0, dur: 0, vx: 0, vy: 0, sx: 0, sy: 0 };
  var shootTimer = 2.5;

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var easeOut = function (t) { return 1 - (1 - t) * (1 - t); };
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

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

  /* ---------------- texturas base geradas por código ---------------- */
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

  /* ---------------- helpers de textura pixel art ---------------- */
  function pixelCanvas(w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { cv: cv, g: g, w: w, h: h };
  }

  /* Preenche faixas horizontais com degraus duros (sem gradiente suave). */
  function bandFill(g, W, H, steps) {
    for (var i = 0; i < steps.length; i++) {
      var y0 = Math.round(steps[i].y0 * H);
      var y1 = Math.round(steps[i].y1 * H);
      g.fillStyle = steps[i].c;
      g.fillRect(0, y0, W, Math.max(1, y1 - y0));
    }
  }

  /* Vignette pixelado: escurece as bordas do mapa (dá volume à esfera). */
  function shadeVignette(g, W, H) {
    var alphas = [0.3, 0.2, 0.12, 0.06, 0.02];
    for (var i = 0; i < alphas.length; i++) {
      g.strokeStyle = 'rgba(6,8,26,' + alphas[i] + ')';
      g.lineWidth = 8;
      g.strokeRect(i * 9 + 4, i * 9 + 4, W - i * 18 - 8, H - i * 18 - 8);
    }
  }

  function texFromCanvas(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }

  /* Ruído simples (bump map): chunky, combina com o pixel art. */
  function makeNoiseCanvas(W, H) {
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var img = g.createImageData(W, H);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  /* ---------------- texturas de cada planeta ---------------- */

  /* PLANETA IÔNICO: azulado, rochoso, energia e brilhos ciano. */
  function makeIonicTextures() {
    var W = 256, H = 128;
    var base = pixelCanvas(W, H);
    var g = base.g, x, y, n;
    bandFill(g, W, H, [
      { y0: 0, y1: 0.28, c: '#0a1c5e' },
      { y0: 0.28, y1: 0.52, c: '#0d2a7a' },
      { y0: 0.52, y1: 0.74, c: '#123a92' },
      { y0: 0.74, y1: 0.9, c: '#0f3384' },
      { y0: 0.9, y1: 1, c: '#0a1f66' }
    ]);
    /* superfícies rochosas: blocos azuis */
    var rocks = ['#1f5cc8', '#1a4fb4', '#285fd0', '#163f96', '#0d2a7a'];
    for (n = 0; n < 110; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      g.fillStyle = rocks[(Math.random() * rocks.length) | 0];
      var bw = 2 + ((Math.random() * 4) | 0);
      g.fillRect(x, y, bw, bw);
      if (Math.random() < 0.45) g.fillRect(x + bw, y - 1, bw, 2);
    }
    /* pequenas áreas brilhantes (mapa + emissive) */
    var em = pixelCanvas(W, H);
    var brights = ['#59d3ff', '#7ff5ff', '#bdf0ff', '#ffffff'];
    for (n = 0; n < 34; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      g.fillStyle = brights[(Math.random() * brights.length) | 0];
      g.fillRect(x, y, 2, 2);
      em.g.fillStyle = '#7ff5ff';
      em.g.fillRect(x, y, 3, 3);
      em.g.globalAlpha = 0.4;
      em.g.fillRect(x - 2, y - 2, 7, 7);
      em.g.globalAlpha = 1;
    }
    shadeVignette(g, W, H);
    shadeVignette(em.g, W, H);
    return {
      map: texFromCanvas(base.cv),
      emissive: texFromCanvas(em.cv),
      bump: texFromCanvas(makeNoiseCanvas(W, H))
    };
  }

  /* PLANETA COVALENTE: água, continentes verdes, rios. */
  function makeCovalentTextures() {
    var W = 256, H = 128;
    var base = pixelCanvas(W, H);
    var g = base.g, i, n;
    bandFill(g, W, H, [
      { y0: 0, y1: 0.3, c: '#0a2a26' },
      { y0: 0.3, y1: 0.62, c: '#0d3832' },
      { y0: 0.62, y1: 0.85, c: '#123f35' },
      { y0: 0.85, y1: 1, c: '#0b2e2a' }
    ]);
    var land = ['#1d5a3e', '#2f9e5d', '#35d0a0', '#1a6b47', '#27805a'];
    function blob(cx, cy, r) {
      for (i = 0; i < r * 4; i++) {
        var a = Math.random() * 6.283, d = Math.random() * r;
        var bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d;
        if (bx < 0) bx += W; if (bx >= W) bx -= W;
        g.fillStyle = land[(Math.random() * land.length) | 0];
        g.fillRect(bx | 0, by | 0, 2 + ((Math.random() * 3) | 0), 2 + ((Math.random() * 3) | 0));
      }
    }
    for (n = 0; n < 12; n++) blob(Math.random() * W, Math.random() * H, 6 + Math.random() * 14);
    /* rios serpenteando */
    g.strokeStyle = '#3aa0ff';
    g.lineWidth = 2;
    for (n = 0; n < 5; n++) {
      var rx = Math.random() * W, ry = Math.random() * H;
      g.beginPath(); g.moveTo(rx, ry);
      for (i = 0; i < 12; i++) {
        rx += rand(-14, 14); ry += rand(-8, 8);
        if (rx < 0) rx += W; if (rx >= W) rx -= W;
        if (ry < 0) ry = 0; if (ry >= H) ry = H - 1;
        g.lineTo(rx, ry);
      }
      g.stroke();
    }
    var em = pixelCanvas(W, H);
    for (n = 0; n < 20; n++) {
      var ex = (Math.random() * W) | 0, ey = (Math.random() * H) | 0;
      em.g.fillStyle = '#2f9e5d';
      em.g.fillRect(ex, ey, 2, 2);
    }
    shadeVignette(g, W, H);
    shadeVignette(em.g, W, H);
    return {
      map: texFromCanvas(base.cv),
      emissive: texFromCanvas(em.cv),
      bump: texFromCanvas(makeNoiseCanvas(W, H))
    };
  }

  /* PLANETA METÁLICO: aço cinza, painéis, rebitado, dutos incandescentes. */
  function makeMetallicTextures() {
    var W = 256, H = 128;
    var base = pixelCanvas(W, H);
    var g = base.g, x, y, i, n;
    bandFill(g, W, H, [
      { y0: 0, y1: 0.3, c: '#2c303c' },
      { y0: 0.3, y1: 0.62, c: '#33384a' },
      { y0: 0.62, y1: 0.85, c: '#3a4052' },
      { y0: 0.85, y1: 1, c: '#2c303c' }
    ]);
    /* painéis de chapa */
    g.fillStyle = 'rgba(8,10,18,0.55)';
    for (x = 0; x < W; x += 16) g.fillRect(x, 0, 1, H);
    for (y = 0; y < H; y += 12) g.fillRect(0, y, W, 1);
    /* rebitado */
    g.fillStyle = '#1c202c';
    for (x = 4; x < W; x += 32) {
      for (y = 4; y < H; y += 24) g.fillRect(x, y, 2, 2);
    }
    /* arranhões e desgaste */
    for (n = 0; n < 40; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      g.fillStyle = Math.random() < 0.5 ? '#252a38' : '#565c70';
      g.fillRect(x, y, 3 + ((Math.random() * 6) | 0), 1);
    }
    /* emissive: dutos de calor + luzes de status */
    var em = pixelCanvas(W, H);
    for (n = 0; n < 12; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      em.g.fillStyle = '#ff7a3d';
      em.g.fillRect(x, y, 4 + ((Math.random() * 4) | 0), 2);
      em.g.fillStyle = '#ffd166';
      em.g.fillRect(x + 1, y - 1, 2, 2);
    }
    for (n = 0; n < 8; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      em.g.fillStyle = n % 2 ? '#59d34a' : '#ffd166';
      em.g.fillRect(x, y, 1, 1);
    }
    shadeVignette(g, W, H);
    shadeVignette(em.g, W, H);
    /* bump: relevo dos painéis */
    var bump = pixelCanvas(W, H);
    bump.g.fillStyle = '#333';
    for (x = 0; x < W; x += 16) bump.g.fillRect(x, 0, 1, H);
    for (y = 0; y < H; y += 12) bump.g.fillRect(0, y, W, 1);
    return {
      map: texFromCanvas(base.cv),
      emissive: texFromCanvas(em.cv),
      bump: texFromCanvas(bump.cv)
    };
  }

  /* PLANETA FINAL: cósmico roxo, veios de energia, estrelas na superfície. */
  function makeFinalTextures() {
    var W = 256, H = 128;
    var base = pixelCanvas(W, H);
    var g = base.g, i, n, x, y;
    bandFill(g, W, H, [
      { y0: 0, y1: 0.3, c: '#150f2b' },
      { y0: 0.3, y1: 0.62, c: '#1c1433' },
      { y0: 0.62, y1: 0.85, c: '#241a44' },
      { y0: 0.85, y1: 1, c: '#170f30' }
    ]);
    for (n = 0; n < 60; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      g.fillStyle = ['#2a204e', '#33285f', '#1c1433'][(Math.random() * 3) | 0];
      g.fillRect(x, y, 3, 3);
    }
    g.fillStyle = '#cfd8ff';
    for (n = 0; n < 30; n++) g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    var em = pixelCanvas(W, H);
    var veinCols = ['#c8a2ff', '#ff9df2', '#8f5bff', '#ffffff'];
    for (n = 0; n < 7; n++) {
      x = Math.random() * W; y = Math.random() * H;
      em.g.strokeStyle = veinCols[(Math.random() * veinCols.length) | 0];
      em.g.lineWidth = 2;
      em.g.beginPath(); em.g.moveTo(x, y);
      for (i = 0; i < 14; i++) {
        x += rand(-12, 12); y += rand(-10, 10);
        if (x < 0) x += W; if (x >= W) x -= W;
        if (y < 0) y = 0; if (y >= H) y = H - 1;
        em.g.lineTo(x, y);
      }
      em.g.stroke();
    }
    for (n = 0; n < 16; n++) {
      x = (Math.random() * W) | 0; y = (Math.random() * H) | 0;
      em.g.fillStyle = '#ff9df2';
      em.g.fillRect(x, y, 2, 2);
    }
    shadeVignette(g, W, H);
    shadeVignette(em.g, W, H);
    return {
      map: texFromCanvas(base.cv),
      emissive: texFromCanvas(em.cv),
      bump: texFromCanvas(makeNoiseCanvas(W, H))
    };
  }

  /* PLANETA DO MENU: faixas com as cores das ligações (pixel art). */
  function makeBondTextures() {
    var W = 256, H = 128;
    var base = pixelCanvas(W, H);
    var g = base.g, i, n;
    var bands = [
      { y0: 0, y1: 0.14, c: '#3a2a6b' },
      { y0: 0.14, y1: 0.3, c: '#ff9df2' },
      { y0: 0.3, y1: 0.45, c: '#7ff5ff' },
      { y0: 0.45, y1: 0.6, c: '#ffd166' },
      { y0: 0.6, y1: 0.76, c: '#59d3ff' },
      { y0: 0.76, y1: 0.92, c: '#c8a2ff' },
      { y0: 0.92, y1: 1, c: '#3a2a6b' }
    ];
    bandFill(g, W, H, bands);
    g.fillStyle = '#241e4a';
    for (n = 0; n < bands.length - 1; n++) {
      var yy = Math.round(bands[n].y1 * H);
      for (i = 0; i < W; i += 8) {
        g.fillRect(i, yy + ((i * 0.13 + n * 3) | 0) % 3 - 1, 8, 2);
      }
    }
    for (n = 0; n < 50; n++) {
      g.fillStyle = 'rgba(255,255,255,0.06)';
      g.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    }
    var em = pixelCanvas(W, H);
    for (n = 0; n < 18; n++) {
      var ex = (Math.random() * W) | 0, ey = (Math.random() * H) | 0;
      em.g.fillStyle = '#ffd9f2';
      em.g.fillRect(ex, ey, 2, 2);
    }
    shadeVignette(g, W, H);
    shadeVignette(em.g, W, H);
    return {
      map: texFromCanvas(base.cv),
      emissive: texFromCanvas(em.cv),
      bump: texFromCanvas(makeNoiseCanvas(W, H))
    };
  }

  /* ---------------- espalhadores de detalhes na superfície ---------------- */
  function unitVector() {
    var u = Math.random() * 2 - 1;
    var t = Math.random() * Math.PI * 2;
    var r = Math.sqrt(1 - u * u);
    return { x: r * Math.cos(t), y: u, z: r * Math.sin(t) };
  }
  function unitUp() {
    if (!YVEC) YVEC = new THREE.Vector3(0, 1, 0);
    return YVEC;
  }

  /* Cristais 3D (iônico) */
  function makeCrystalScatter() {
    return function (grp) {
      var mat = new THREE.MeshPhongMaterial({
        color: 0x59d3ff, emissive: 0x1f86c8, shininess: 40,
        transparent: true, opacity: 0.95
      });
      var i, n, m, sc;
      for (i = 0; i < 30; i++) {
        n = unitVector();
        if (Math.abs(n.y) > 0.82) { i--; continue; }
        sc = 1 + Math.random() * 2.6;
        m = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), mat);
        m.scale.set(0.8, sc, 0.8);
        m.position.set(n.x * (1.03 + 0.045 * sc), n.y * (1.03 + 0.045 * sc), n.z * (1.03 + 0.045 * sc));
        m.quaternion.setFromUnitVectors(unitUp(), new THREE.Vector3(n.x, n.y, n.z));
        grp.add(m);
      }
    };
  }

  /* Manchas de energia flutuando (iônico) */
  function makeEnergySprites() {
    return function (grp) {
      var list = [];
      for (var i = 0; i < 12; i++) {
        var n = unitVector();
        var s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, transparent: true, opacity: 0.75, color: 0x7ff5ff,
          depthWrite: false, blending: THREE.AdditiveBlending
        }));
        s.scale.set(0.22, 0.22, 1);
        s.position.set(n.x * 1.12, n.y * 1.12, n.z * 1.12);
        s.userData = { n: n, ph: Math.random() * 6.28 };
        grp.add(s);
        list.push(s);
      }
      grp.userData.sparkles = list;
    };
  }

  /* Árvores/vegetação 3D (covalente) */
  function makeTreeScatter() {
    return function (grp) {
      var mat = new THREE.MeshPhongMaterial({ color: 0x2f9e5d, emissive: 0x08301f, shininess: 10 });
      var i, n, m, h;
      for (i = 0; i < 46; i++) {
        n = unitVector();
        if (Math.abs(n.y) > 0.8) { i--; continue; }
        h = 0.1 + Math.random() * 0.08;
        m = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 6), mat);
        m.position.set(n.x * (1.02 + h / 2), n.y * (1.02 + h / 2), n.z * (1.02 + h / 2));
        m.quaternion.setFromUnitVectors(unitUp(), new THREE.Vector3(n.x, n.y, n.z));
        grp.add(m);
      }
    };
  }

  /* Vaga-lumes verdes (covalente) */
  function makeFireflySprites() {
    return function (grp) {
      var list = [];
      for (var i = 0; i < 14; i++) {
        var n = unitVector();
        var s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, transparent: true, opacity: 0.6, color: 0x35d0a0,
          depthWrite: false, blending: THREE.AdditiveBlending
        }));
        s.scale.set(0.16, 0.16, 1);
        s.position.set(n.x * 1.14, n.y * 1.14, n.z * 1.14);
        s.userData = { n: n, ph: Math.random() * 6.28 };
        grp.add(s);
        list.push(s);
      }
      grp.userData.sparkles = list;
    };
  }

  /* Torres industriais + faróis (metálico) */
  function makeTowerScatter() {
    return function (grp) {
      var mat = new THREE.MeshPhongMaterial({
        color: 0x8a8fa3, specular: 0xdfe7ff, shininess: 70, emissive: 0x11151f
      });
      var beacon = new THREE.MeshPhongMaterial({
        color: 0xffd166, emissive: 0xff7a3d, shininess: 20
      });
      var i, n, m, h;
      for (i = 0; i < 14; i++) {
        n = unitVector();
        if (Math.abs(n.y) > 0.8) { i--; continue; }
        h = 0.12 + Math.random() * 0.1;
        m = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, 0.03), mat);
        m.position.set(n.x * (1.03 + h / 2), n.y * (1.03 + h / 2), n.z * (1.03 + h / 2));
        m.quaternion.setFromUnitVectors(unitUp(), new THREE.Vector3(n.x, n.y, n.z));
        grp.add(m);
        var b = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), beacon);
        b.position.set(n.x * (1.06 + h), n.y * (1.06 + h), n.z * (1.06 + h));
        b.quaternion.setFromUnitVectors(unitUp(), new THREE.Vector3(n.x, n.y, n.z));
        grp.add(b);
      }
    };
  }

  /* Blocos industriais sobre a superfície (metálico) */
  function makeVentScatter() {
    return function (grp) {
      var mat = new THREE.MeshPhongMaterial({
        color: 0x6a7084, specular: 0xcfd6ea, shininess: 60
      });
      for (var i = 0; i < 10; i++) {
        var n = unitVector();
        if (Math.abs(n.y) > 0.84) { i--; continue; }
        var w = 0.05 + Math.random() * 0.06;
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, w * 0.6), mat);
        m.position.set(n.x * 1.05, n.y * 1.05, n.z * 1.05);
        m.quaternion.setFromUnitVectors(unitUp(), new THREE.Vector3(n.x, n.y, n.z));
        grp.add(m);
      }
    };
  }

  /* Fragmentos cósmicos orbitando (final) */
  function makeShardScatter() {
    return function (grp) {
      var mat = new THREE.MeshPhongMaterial({
        color: 0xc8a2ff, emissive: 0x5a2a9a, shininess: 40,
        transparent: true, opacity: 0.9
      });
      var list = [];
      for (var i = 0; i < 16; i++) {
        var m = new THREE.Mesh(new THREE.OctahedronGeometry(0.03 + Math.random() * 0.03, 0), mat);
        m.userData = {
          a: Math.random() * Math.PI * 2,
          b: (Math.random() - 0.5) * 1.4,
          r: 1.16 + Math.random() * 0.4,
          sp: 0.3 + Math.random() * 0.5
        };
        grp.add(m);
        list.push(m);
      }
      grp.userData.shards = list;
    };
  }

  /* ---------------- poeira orbital (partículas) ---------------- */
  function makeDustRing(colors) {
    var count = 90;
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var pc = colors.map(function (c) { return new THREE.Color(c); });
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = 1.25 + Math.random() * 0.75;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      pos[i * 3 + 2] = Math.sin(a) * r;
      var c = pc[(Math.random() * pc.length) | 0];
      var b = 0.6 + Math.random() * 0.4;
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.05, map: dotTex, transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true, vertexColors: true
    });
    var pts = new THREE.Points(geo, mat);
    pts.rotation.x = -0.5;
    return pts;
  }

  /* ---------------- fábrica de planetas ---------------- */
  var PLANET_SPECS = {
    ionic: {
      textures: makeIonicTextures,
      atmosphere: 0x59d3ff,
      emissiveTint: 0x2a86d0,
      specular: 0x7fb0ff, shininess: 26, bump: 1.0,
      dust: ['#59d3ff', '#7ff5ff'],
      scatter: [makeCrystalScatter(), makeEnergySprites()]
    },
    covalent: {
      textures: makeCovalentTextures,
      atmosphere: 0x7ff5ff,
      emissiveTint: 0x1a7a4a,
      specular: 0x35d0a0, shininess: 14, bump: 0.5,
      dust: ['#7ff5ff', '#35d0a0', '#bff5d0'],
      scatter: [makeTreeScatter(), makeFireflySprites()]
    },
    metallic: {
      textures: makeMetallicTextures,
      atmosphere: 0xffd166,
      emissiveTint: 0x9a5a10,
      specular: 0xdfe7ff, shininess: 90, bump: 0.6,
      dust: ['#9fb0d8', '#ffd166', '#6a7084'],
      scatter: [makeTowerScatter(), makeVentScatter()]
    },
    final: {
      textures: makeFinalTextures,
      atmosphere: 0xc8a2ff,
      emissiveTint: 0x8f5bff,
      specular: 0x8f5bff, shininess: 34, bump: 0.3,
      dust: ['#c8a2ff', '#ff9df2', '#ffffff'],
      scatter: [makeShardScatter()]
    },
    bond: {
      textures: makeBondTextures,
      atmosphere: 0x7ff5ff,
      emissiveTint: 0x8a3aa0,
      specular: 0xffffff, shininess: 28, bump: 0.3,
      ring: true,
      dust: ['#ff9df2', '#7ff5ff', '#ffd166'],
      scatter: []
    }
  };

  function makePlanetUpdate(grp) {
    return function (dt, t) {
      var u = grp.userData;
      if (u.dust) {
        u.dust.rotation.z += dt * 0.25;
        u.dust.material.opacity = 0.5 + Math.sin(t * 1.4) * 0.12;
      }
      if (u.sparkles) {
        u.sparkles.forEach(function (s) {
          var b = s.userData.n;
          var r = 1.1 + 0.05 * Math.sin(t * 2.2 + s.userData.ph);
          s.position.set(b.x * r, b.y * r, b.z * r);
          s.material.opacity = 0.45 + 0.3 * Math.sin(t * 3 + s.userData.ph);
        });
      }
      if (u.shards) {
        u.shards.forEach(function (m) {
          var d = m.userData;
          d.a += dt * d.sp;
          m.position.set(
            Math.cos(d.a) * Math.cos(d.b) * d.r,
            Math.sin(d.b) * d.r,
            Math.sin(d.a) * Math.cos(d.b) * d.r
          );
          m.rotation.set(t * 0.7, t * 0.5, 0);
        });
      }
    };
  }

  function makePlanetGroup(specId) {
    var spec = PLANET_SPECS[specId] || PLANET_SPECS.bond;
    var grp = new THREE.Group();
    grp.userData = {};

    var tex = spec.textures();
    var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 48),
      new THREE.MeshPhongMaterial({
        map: tex.map,
        emissive: spec.emissiveTint,
        emissiveMap: tex.emissive || null,
        bumpMap: tex.bump || null,
        bumpScale: spec.bump,
        specular: spec.specular,
        shininess: spec.shininess
      })
    );
    grp.add(sphere);

    /* atmosfera */
    var atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.07, 32, 24),
      new THREE.MeshBasicMaterial({
        color: spec.atmosphere, transparent: true, opacity: 0.22,
        side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
      })
    );
    grp.add(atm);

    /* anel (apenas o planeta do menu) */
    if (spec.ring) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(1.35, 2.05, 64),
        new THREE.MeshBasicMaterial({
          map: ringTex, transparent: true, opacity: 0.85,
          side: THREE.DoubleSide, depthWrite: false
        })
      );
      ring.rotation.x = -Math.PI / 2.6;
      ring.rotation.z = 0.3;
      grp.add(ring);
    }

    if (spec.dust) {
      var dust = makeDustRing(spec.dust);
      grp.add(dust);
      grp.userData.dust = dust;
    }

    if (spec.scatter) {
      spec.scatter.forEach(function (fn) { fn(grp); });
    }

    grp.userData.update = makePlanetUpdate(grp);
    grp.visible = false;
    return grp;
  }

  function ensurePlanet(theme) {
    if (planetCache[theme]) return planetCache[theme];
    var grp = makePlanetGroup(theme);
    planetCache[theme] = grp;
    scene.add(grp);
    return grp;
  }

  /* Posicionamento nas cenas espaciais (coordenadas lógicas 2D + raio em px) */
  var GAME_PLACEMENTS = {
    travel: { x: 520, y: 64, px: 46 },
    arrival: { x: 320, y: 40, px: 190 },
    return: { x: 720, y: 70, px: 130 }
  };

  /* ---------------- projeção (coords lógicas 2D -> mundo 3D) ---------------- */
  function logicalToWorldX(lx) {
    return (lx / LOGICAL_W - 0.5) * 2 * halfW;
  }
  function logicalToWorldY(ly) {
    return (0.5 - ly / LOGICAL_H) * 2 * halfH;
  }
  /* raio em mundo para um planeta cujo diâmetro projetado ≈ 2*px no view 360 */
  function worldRadiusForPx(px) {
    var s = (px / LOGICAL_H) * 2 * Math.tan(FOV * Math.PI / 360);
    return CAM_DIST * s / Math.sqrt(1 + s * s);
  }

  function placeGamePlanet(phase) {
    var pl = GAME_PLACEMENTS[phase];
    if (!pl || !activePlanet) return;
    var scale = worldRadiusForPx(pl.px);
    if (phase === 'arrival') {
      var k = clamp(phaseAge / 0.8, 0, 1);
      scale *= 0.6 + 0.4 * easeOut(k);
    }
    activePlanet.visible = true;
    activePlanet.position.set(logicalToWorldX(pl.x), logicalToWorldY(pl.y), 0);
    activePlanet.scale.setScalar(scale);
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

  /* Nave inimiga estilizada e barata (Low-poly, iluminada pelas luzes da
     cena): casco em caixa + nariz cônico, asas, cabine emissiva e motor. */
  function makeReturnEnemy(color, big) {
    var g = new THREE.Group();
    var hullMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), flatShading: true });
    var wingMat = new THREE.MeshLambertMaterial({ color: big ? 0xc0392b : 0x9fb0d8, flatShading: true });
    var cockpitMat = new THREE.MeshLambertMaterial({ color: 0xffe14d, emissive: 0xff9d00 });

    var bank = new THREE.Group();
    g.add(bank);

    var hull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.7), hullMat);
    bank.add(hull);

    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 6), hullMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 0.56);
    bank.add(nose);

    var wl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.3), wingMat);
    wl.position.set(-0.44, 0, -0.16);
    wl.rotation.z = 0.2;
    bank.add(wl);
    var wr = wl.clone();
    wr.position.set(0.44, 0, -0.16);
    wr.rotation.z = -0.2;
    bank.add(wr);

    var cock = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), cockpitMat);
    cock.position.set(0, 0.14, 0.1);
    bank.add(cock);

    var engine = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffa050, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    engine.position.set(0, 0, -0.6);
    engine.scale.set(0.55, 0.55, 1);
    g.add(engine);

    g.userData = { engine: engine, bank: bank, big: !!big };
    return g;
  }

  /* Aponta o nariz da nave (eixo +z) para a direção do movimento 2D */
  function faceReturnShip(obj, dx, dy) {
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    obj.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(dx / l, dy / l, 0)
    );
  }

  /* Sincroniza o pool 3D com as naves inimigas 2D vivas da batalha final.
     Nada aqui altera o gameplay: só projeta as posições para o mundo 3D. */
  function updateReturnFleet(dt) {
    var r = null;
    try { r = Game.return; } catch (e) {}
    if (!returnFleet || !r) { hideReturnFleet(); return; }
    var alive = [];
    for (var i = 0; i < r.enemies.length; i++) {
      if (!r.enemies[i].dead) alive.push(r.enemies[i]);
    }
    var ships = returnFleet.children;
    for (var j = 0; j < ships.length; j++) {
      var mesh = ships[j];
      var e = alive[j];
      if (!e) { mesh.visible = false; continue; }
      mesh.visible = true;
      mesh.position.set(logicalToWorldX(e.x), logicalToWorldY(e.y), 0);
      mesh.scale.setScalar(worldRadiusForPx(e.r * 1.05));
      faceReturnShip(mesh, -(e.vx || -60), -(e.vy || 0));
      var u = mesh.userData;
      if (u.bank) u.bank.rotation.z = Math.sin((e.t || 0) * 4) * 0.16;
      if (u.engine) u.engine.material.opacity = 0.55 + Math.random() * 0.4;
    }
  }

  function hideReturnFleet() {
    if (!returnFleet) return;
    for (var i = 0; i < returnFleet.children.length; i++) {
      returnFleet.children[i].visible = false;
    }
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
  function readLevelTheme() {
    try {
      if (!Game) return '';
      var phase = readPhase();
      if (phase === 'travel') {
        var idx = Math.min((Game.levelIndex || 0) + 1, LEVELS.length - 1);
        var lv = LEVELS[idx];
        if (lv && lv.theme) return lv.theme;
        return '';
      }
      if (Game.level) {
        if (Game.level.lv && Game.level.lv.id) return Game.level.lv.id;
        if (Game.level.lv && Game.level.lv.theme) return Game.level.lv.theme;
        if (typeof Game.level.theme === 'string' && THEMES[Game.level.theme]) return Game.level.theme;
      }
    } catch (e) {}
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

  /* ---------------- cinemática das transições (decolagem / chegada) ---------------- */
  function makeSolidTex() {
    var cv = document.createElement('canvas');
    cv.width = 4; cv.height = 4;
    var g = cv.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 4, 4);
    return new THREE.CanvasTexture(cv);
  }

  function makeCinematicShip() {
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0xe8f0ff, emissive: 0x223344 });
    var accentMat = new THREE.MeshPhongMaterial({ color: 0xff6a3d, emissive: 0x772200 });
    var hull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 1.0), bodyMat);
    g.add(hull);
    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), accentMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 0.75);
    g.add(nose);
    var wingL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.42), accentMat);
    wingL.position.set(-0.36, 0, -0.22);
    wingL.rotation.z = 0.25;
    g.add(wingL);
    var wingR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.42), accentMat);
    wingR.position.set(0.36, 0, -0.22);
    wingR.rotation.z = -0.25;
    g.add(wingR);
    var flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffb05a, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    flame.position.set(0, 0, -0.95);
    flame.scale.set(0.6, 0.6, 1);
    g.add(flame);
    g.userData.flame = flame;
    return g;
  }

  function makeExhaustPool() {
    var g = new THREE.Group();
    for (var i = 0; i < 16; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      s.visible = false;
      s.userData = { life: 0, max: 0.5, vx: 0, vy: 0, vz: 0, r: 0.1 };
      g.add(s);
    }
    return g;
  }

  function makeAtmoRing() {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ringTex, color: 0x9fe2ff, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    s.visible = false;
    s.scale.set(6, 6, 1);
    return s;
  }

  function makeCinFlash() {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    s.visible = false;
    s.scale.set(6, 6, 1);
    return s;
  }

  function makeBlackScreen() {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: blackTex, color: 0x000000, transparent: true, opacity: 0,
      depthWrite: false, depthTest: false
    }));
    s.scale.set(40, 22.5, 1);
    s.position.set(0, 0, CAM_DIST - 0.5);
    return s;
  }

  function setBlack(a, dur) {
    black.target = a;
    black.speed = dur > 0 ? 1 / dur : 1000;
  }

  function updateBlack(dt) {
    if (!blackScreen) return;
    if (black.a < black.target) black.a = Math.min(black.target, black.a + black.speed * dt);
    else if (black.a > black.target) black.a = Math.max(black.target, black.a - black.speed * dt);
    blackScreen.material.opacity = black.a;
  }

  function spawnExhaust(sx, sy, sz, vx, vy, vz, intensity) {
    if (!cinExhaust) return;
    var list = cinExhaust.children;
    if (!list.length) return;
    var s = list[cin.exhaustCursor % list.length];
    cin.exhaustCursor = (cin.exhaustCursor + 1) % list.length;
    s.visible = true;
    s.position.set(sx + rand(-0.04, 0.04), sy + rand(-0.04, 0.04), sz + rand(-0.04, 0.04));
    s.userData.life = 0;
    s.userData.max = 0.5;
    s.userData.vx = vx + rand(-0.25, 0.25);
    s.userData.vy = vy + rand(-0.25, 0.25);
    s.userData.vz = vz + rand(-0.25, 0.25);
    s.userData.r = (0.12 + Math.random() * 0.14) * intensity;
    s.scale.set(s.userData.r, s.userData.r, 1);
    s.material.opacity = 0.9;
  }

  function updateExhaust(dt) {
    var list = cinExhaust.children;
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s.visible) continue;
      var u = s.userData;
      u.life += dt;
      if (u.life >= u.max) { s.visible = false; continue; }
      s.position.x += u.vx * dt;
      s.position.y += u.vy * dt;
      s.position.z += u.vz * dt;
      var f = 1 - u.life / u.max;
      s.material.opacity = f * 0.9;
      var sc = u.r * (1 + u.life * 3.5);
      s.scale.set(sc, sc, 1);
    }
  }

  function alignShip(obj, dx, dy, dz) {
    var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    obj.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(dx / l, dy / l, dz / l)
    );
  }

  function playCinematic(type, theme, onBlack) {
    if (!enabled || !renderer) { if (onBlack) onBlack(); return false; }
    var planet = ensurePlanet(theme || 'bond');
    planet.visible = true;
    planet.position.set(0, 0, 0);
    planet.rotation.x = 0; planet.rotation.y = 0; planet.rotation.z = 0;
    menuGroup.visible = false;
    galaxyGroup.visible = false;
    if (activePlanet && activePlanet !== planet) activePlanet.visible = false;
    starsFar.visible = true;
    starsNear.visible = true;
    cinShip.visible = true;
    cinExhaust.visible = true;
    cinAtmo.visible = false;
    cinFlash.visible = false;
    cin = {
      type: type,
      theme: theme || 'bond',
      t: 0,
      dur: type === 'departure' ? CIN_DEPART_DUR : CIN_ARRIVE_DUR,
      planet: planet,
      onBlack: onBlack || null,
      exhaustCursor: 0,
      shake: 0
    };
    black.a = 1; black.target = 1; black.speed = 1000;
    blackScreen.material.opacity = 1;
    renderer.setClearColor(0x02040c, 1);
    attachCanvas('fx3d-game');
    var host = document.getElementById('fx3d-game');
    if (host) fitToContainer(host);
    return true;
  }

  function updateCinematic(dt) {
    cin.t += dt;
    var k = cin.t / cin.dur;
    if (cin.t < CIN_REVEAL) {
      setBlack(1 - cin.t / CIN_REVEAL, 1);
    }
    if (cin.type === 'departure') updateCinDeparture(dt, k);
    else updateCinArrival(dt, k);
    updateExhaust(dt);
    if (k >= 1 - CIN_TAIL / cin.dur) setBlack(1, CIN_TAIL);
    if (k >= 1 && black.a > 0.97) endCinematic();
  }

  function endCinematic() {
    if (!cin) return;
    cin.planet.visible = false;
    cinShip.visible = false;
    cinExhaust.visible = false;
    cinAtmo.visible = false;
    cinFlash.visible = false;
    camera.position.set(0, 0, CAM_DIST);
    camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0);
    /* Revela a cena seguinte: a tela preta se dissolve sozinha (0.5s).
       Chamadas explícitas a fadeBlack(0, ...) depois disso são inofensivas. */
    black.a = 1; black.target = 0; black.speed = 2;
    var cb = cin.onBlack;
    cin = null;
    if (cb) { try { cb(); } catch (e) {} }
  }

  function updateCinDeparture(dt, k) {
    var px;
    if (k < 0.13) px = 150;
    else if (k < 0.42) px = lerp(150, 130, easeOut((k - 0.13) / 0.29));
    else if (k < 0.72) px = lerp(130, 42, easeInOut((k - 0.42) / 0.3));
    else px = lerp(42, 30, easeInOut((k - 0.72) / 0.28));
    var R = worldRadiusForPx(px);
    cin.planet.scale.setScalar(R);
    cin.planet.rotation.y += dt * 0.25;
    cin.planet.rotation.z = Math.sin(cin.t * 0.4) * 0.02;
    if (cin.planet.userData.update) cin.planet.userData.update(dt, cin.t);

    var syp, szp, sscale;
    if (k < 0.13) { syp = R + 0.25; szp = 0.45; sscale = 1; }
    else if (k < 0.42) {
      var a = easeOut((k - 0.13) / 0.29);
      syp = lerp(R + 0.25, halfH * 0.55, a);
      szp = lerp(0.45, 0.9, a); sscale = 1;
    } else if (k < 0.72) {
      var b = easeInOut((k - 0.42) / 0.3);
      syp = lerp(halfH * 0.55, halfH * 0.9, b);
      szp = lerp(0.9, -1.2, b);
      sscale = lerp(1, 0.55, b);
    } else {
      var c = easeInOut((k - 0.72) / 0.28);
      syp = halfH * 0.9 + c * 0.35;
      szp = lerp(-1.2, -2.2, c);
      sscale = lerp(0.55, 0.4, c);
    }
    cinShip.position.set(0, syp, szp);
    cinShip.scale.set(sscale, sscale, sscale);
    alignShip(cinShip, 0, 1, 0);
    var flame = cinShip.userData.flame;
    flame.scale.set(0.55 + Math.sin(cin.t * 42) * 0.15, 0.55 + Math.sin(cin.t * 42) * 0.15, 1);
    spawnExhaust(0, syp - 0.95 * sscale, szp, 0, -2.2 * sscale, 0, k < 0.42 ? 1.2 : 0.9);

    starsFar.rotation.y += dt * 0.008;
    starsNear.rotation.y -= dt * 0.012;
  }

  function updateCinArrival(dt, k) {
    var px;
    if (k < 0.28) px = lerp(16, 34, easeOut(k / 0.28));
    else if (k < 0.57) px = lerp(34, 150, easeInOut((k - 0.28) / 0.29));
    else if (k < 0.78) px = lerp(150, 172, easeInOut((k - 0.57) / 0.21));
    else px = 172 + Math.sin((k - 0.78) * 8) * 3;
    var R = worldRadiusForPx(px);
    cin.planet.scale.setScalar(R);
    cin.planet.rotation.y += dt * 0.3;
    cin.planet.rotation.z = Math.sin(cin.t * 0.5) * 0.03;
    if (cin.planet.userData.update) cin.planet.userData.update(dt, cin.t);

    var prog = clamp(k / 0.85, 0, 1);
    var sx = lerp(-halfW * 0.72, 0, easeInOut(prog));
    var sy = lerp(-halfH * 0.55, 0, easeInOut(prog));
    var sz = lerp(2.3, R * 1.7 + 0.25, easeInOut(prog));
    var sc = lerp(0.8, 1.3, easeInOut(clamp(k / 0.7, 0, 1)));
    cinShip.position.set(sx, sy, sz);
    cinShip.scale.set(sc, sc, sc);
    alignShip(cinShip, -sx, -sy, -sz);
    var flame = cinShip.userData.flame;
    flame.scale.set(0.5 + Math.sin(cin.t * 30) * 0.1, 0.5 + Math.sin(cin.t * 30) * 0.1, 1);

    var dl = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    spawnExhaust(
      sx + (sx / dl) * 0.9, sy + (sy / dl) * 0.9, sz + (sz / dl) * 0.9,
      (sx / dl) * 1.3, (sy / dl) * 1.3, (sz / dl) * 1.3, 1.0
    );

    var atmoK = clamp((k - 0.57) / 0.21, 0, 1);
    if (atmoK > 0) {
      cinAtmo.visible = true;
      cinAtmo.position.set(0, 0, R * 0.15);
      cinAtmo.scale.set(R * 2.6, R * 2.6, 1);
      cinAtmo.material.opacity = Math.sin(atmoK * Math.PI) * 0.85;
      cinFlash.visible = true;
      cinFlash.position.set(0, 0, R * 0.05);
      cinFlash.scale.set(R * 3.2, R * 3.2, 1);
      cinFlash.material.opacity = Math.sin(atmoK * Math.PI) * 0.38;
      cin.shake = Math.sin(atmoK * Math.PI) * 0.055;
    } else {
      cinAtmo.visible = false;
      cinFlash.visible = false;
      cin.shake = 0;
    }
    if (cin.shake > 0.001) camera.position.set(rand(-cin.shake, cin.shake), rand(-cin.shake, cin.shake), CAM_DIST);
    else camera.position.set(0, 0, CAM_DIST);

    starsFar.rotation.y += dt * 0.01;
    starsNear.rotation.y -= dt * 0.015;
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
    if (activePlanet) activePlanet.visible = content === 'game';
    if (content !== 'game') { activePhase = ''; phaseAge = 0; }
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
      if (menuGroup.userData.update) menuGroup.userData.update(dt, sceneTime);
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
      if (activePlanet && activePlanet.visible) {
        activePlanet.rotation.y += dt * 0.12;
        activePlanet.rotation.z = Math.sin(sceneTime * 0.1) * 0.03;
        if (activePlanet.userData.update) activePlanet.userData.update(dt, sceneTime);
      }
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
    updateBlack(dt);
    if (cin) {
      if (cinPaused) return;
      updateCinematic(dt);
      if (cin) renderer.render(scene, camera);
      return;
    }
    var screen = readScreen();
    var phase = readPhase();
    readLevelColor();
    var content = contentFor(screen, phase);
    var containerId = containerFor(content, screen);
    if (containerId) attachCanvas(containerId);
    else detachCanvas();
    if (content === 'none' || !renderer.domElement.parentNode) return;
    applyContent(content);
    if (content === 'game') {
      var theme = readLevelTheme();
      if (theme) {
        if (activeTheme !== theme) {
          if (activePlanet) activePlanet.visible = false;
          activeTheme = theme;
          activePlanet = ensurePlanet(theme);
        }
        if (activePhase !== phase) { activePhase = phase; phaseAge = 0; }
        phaseAge += dt;
        placeGamePlanet(phase);
      } else if (activePlanet) {
        activePlanet.visible = false;
      }
      /* Frota inimiga 3D: só na batalha final (posições 2D projetadas) */
      if (phase === 'return') updateReturnFleet(dt);
      else hideReturnFleet();
    } else {
      hideReturnFleet();
    }
    updateScene(dt, content);
    renderer.render(scene, camera);
  }

  function buildScene() {
    colorTmp = new THREE.Color();
    dotTex = makeDotTexture();
    ringTex = makeRingTexture();
    glowTex = makeGlowTexture();
    streakTex = makeStreakTexture();

    renderer = createRenderer();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, viewAspect, 0.1, 100);
    camera.position.set(0, 0, CAM_DIST);
    camera.lookAt(0, 0, 0);

    /* Iluminação (afeta apenas os planetas Phong, não o fundo aditivo) */
    hemiLight = new THREE.HemisphereLight(0x9fc7ff, 0x120a2a, 0.8);
    scene.add(hemiLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(4, 3, 2);
    scene.add(dirLight);
    rimLight = new THREE.DirectionalLight(0x3366ff, 0.4);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    starsFar = makeStars(700, 0.09, { x: 26, y: 16, z: 14 }, 1, 14);
    starsNear = makeStars(220, 0.16, { x: 20, y: 12, z: 10 }, 1, 10);
    scene.add(starsFar);
    scene.add(starsNear);

    nebula = makeNebula();
    scene.add(nebula);

    menuGroup = makePlanetGroup('bond');
    scene.add(menuGroup);

    galaxyGroup = makeGalaxy();
    scene.add(galaxyGroup);

    shootingStar = makeShooting();
    scene.add(shootingStar);

    blackTex = makeSolidTex();
    blackScreen = makeBlackScreen();
    scene.add(blackScreen);

    cinShip = makeCinematicShip();
    cinShip.visible = false;
    scene.add(cinShip);
    cinExhaust = makeExhaustPool();
    cinExhaust.visible = false;
    scene.add(cinExhaust);
    cinAtmo = makeAtmoRing();
    scene.add(cinAtmo);
    cinFlash = makeCinFlash();
    scene.add(cinFlash);

    /* Frota inimiga 3D da batalha final (pool, visível só na fase 'return') */
    returnFleet = new THREE.Group();
    for (var fi = 0; fi < RETURN_FLEET_POOL; fi++) {
      var fShip = makeReturnEnemy(fi % 2 ? '#ff9df2' : '#ff5d6c', fi % 4 === 0);
      fShip.visible = false;
      returnFleet.add(fShip);
    }
    scene.add(returnFleet);

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
      if (cin) {
        endCinematic();
        black.a = 0; black.target = 0; black.speed = 1000;
        if (blackScreen) blackScreen.material.opacity = 0;
      }
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
    supported: function () { return supported; },
    cinematic: playCinematic,
    fadeBlack: function (a, dur) { setBlack(a, dur || 0.3); },
    isCinematic: function () { return !!cin; },
    setPaused: function (v) { cinPaused = !!v; },
    cancelCinematic: function () {
      if (!cin) return;
      cin.planet.visible = false;
      cinShip.visible = false;
      cinExhaust.visible = false;
      cinAtmo.visible = false;
      cinFlash.visible = false;
      cin = null;
      cinPaused = false;
      black.a = 0; black.target = 0; black.speed = 1000;
      if (blackScreen) blackScreen.material.opacity = 0;
      renderer.setClearColor(0x000000, 0);
    },
    detach: function () {
      if (cin) {
        cin.planet.visible = false;
        cinShip.visible = false;
        cinExhaust.visible = false;
        cinAtmo.visible = false;
        cinFlash.visible = false;
        cin = null;
        cinPaused = false;
      }
      if (activePlanet) activePlanet.visible = false;
      activePlanet = null;
      activeTheme = '';
      activePhase = '';
      phaseAge = 0;
      black.a = 0; black.target = 0; black.speed = 1000;
      if (blackScreen) blackScreen.material.opacity = 0;
      renderer.setClearColor(0x000000, 0);
      var keys = Object.keys(planetCache);
      for (var i = 0; i < keys.length; i++) planetCache[keys[i]].visible = false;
      hideReturnFleet();
      detachCanvas();
    }
  };
})();
