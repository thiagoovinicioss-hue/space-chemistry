/* ============================================================
   MODELO ATÔMICO 3D — Rutherford / Space Chemistry
   ------------------------------------------------------------
   Renderiza um átomo em Three.js ao clicar num elemento da
   tabela periódica. Núcleo com glow volumétrico, elétrons em
   órbitas concêntricas, zoom scroll/pinch, arrasto 360°.
   ============================================================ */
(function () {
  'use strict';

  var NUCLEUS_COLORS = [
    0xff1a1a, 0x00b4ff, 0xff6600, 0x00ff44, 0xaa00ff,
    0xffcc00, 0x00ffdd, 0xff0088, 0x66ff00, 0x3366ff
  ];

  var SHELL_COLORS = [
    0x00ccff, 0xff00aa, 0x00ff66, 0xffaa00,
    0xff2222, 0x00ffcc, 0x8800ff, 0xff6600
  ];

  /* ---------- helpers ---------- */

  function makeRadialGlowTexture(r, g, b, size) {
    var c = document.createElement('canvas');
    c.width = c.height = size || 256;
    var ctx = c.getContext('2d');
    var half = c.width / 2;
    var grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    var rs = 'rgb(' + r + ',' + g + ',' + b + ')';
    grad.addColorStop(0, rs);
    grad.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.85)');
    grad.addColorStop(0.4, 'rgba(' + r + ',' + g + ',' + b + ',0.35)');
    grad.addColorStop(0.7, 'rgba(' + r + ',' + g + ',' + b + ',0.08)');
    grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }

  function colorRGB(hex) {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255
    };
  }

  function disposeTree(obj) {
    if (!obj) return;
    if (obj.children) {
      while (obj.children.length) {
        disposeTree(obj.children[0]);
        obj.remove(obj.children[0]);
      }
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      if (obj.material.alphaMap) obj.material.alphaMap.dispose();
      obj.material.dispose();
    }
  }

  /* ============================================= */

  var atom3d = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    atomGroup: null,
    shells: [],
    animId: null,
    running: false,

    /* drag state */
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotVelX: 0.002,
    rotVelY: 0.004,

    /* zoom state */
    camDist: 5.0,
    camDistTarget: 5.0,
    camDistMin: 2.0,
    camDistMax: 14.0,

    /* touch pinch state */
    pinchDist: 0,

    /* ---------- lifecycle ---------- */

    init: function (containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container || !window.THREE) return;

      var w = this.container.clientWidth || 280;
      var h = this.container.clientHeight || 280;

      /* Scene */
      this.scene = new THREE.Scene();

      /* Camera */
      this.camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 500);
      this.camera.position.set(0, 0, this.camDist);

      /* Renderer — full phong/normal pipeline */
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.5;
      this.container.appendChild(this.renderer.domElement);

      /* Lights — multi-source for proper 3D shading */
      var hemi = new THREE.HemisphereLight(0x88bbff, 0x223344, 0.6);
      this.scene.add(hemi);

      var amb = new THREE.AmbientLight(0xffffff, 0.25);
      this.scene.add(amb);

      var key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(4, 5, 6);
      this.scene.add(key);

      var fill = new THREE.DirectionalLight(0x6688cc, 0.5);
      fill.position.set(-4, -2, 3);
      this.scene.add(fill);

      var rim = new THREE.DirectionalLight(0xffddaa, 0.35);
      rim.position.set(0, 2, -5);
      this.scene.add(rim);

      /* Environment map for metallic reflections */
      var pmremGen = new THREE.PMREMGenerator(this.renderer);
      pmremGen.compileEquirectangularShader();
      var envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x111122);
      /* Add colored lights to the env scene for reflections */
      var envLight1 = new THREE.PointLight(0x4488ff, 2, 50);
      envLight1.position.set(10, 5, 10);
      envScene.add(envLight1);
      var envLight2 = new THREE.PointLight(0xff4488, 1.5, 50);
      envLight2.position.set(-10, -3, -5);
      envScene.add(envLight2);
      var envLight3 = new THREE.PointLight(0x44ff88, 1, 50);
      envLight3.position.set(0, 10, -10);
      envScene.add(envLight3);
      this.envMap = pmremGen.fromScene(envScene, 0.04).texture;
      this.scene.environment = this.envMap;
      pmremGen.dispose();

      /* Atom group */
      this.atomGroup = new THREE.Group();
      this.scene.add(this.atomGroup);

      this._bindInput();
      this._bindResize();
    },

    /* ---------- input ---------- */

    _bindInput: function () {
      var self = this;
      var el = this.container;
      if (!el) return;

      /* --- Mouse drag --- */
      el.addEventListener('mousedown', function (e) {
        self.isDragging = true;
        self.prevX = e.clientX;
        self.prevY = e.clientY;
        self.rotVelX = 0;
        self.rotVelY = 0;
        e.preventDefault();
      });
      window.addEventListener('mousemove', function (e) {
        if (!self.isDragging) return;
        var dx = e.clientX - self.prevX;
        var dy = e.clientY - self.prevY;
        self.rotVelY = dx * 0.008;
        self.rotVelX = dy * 0.008;
        self.prevX = e.clientX;
        self.prevY = e.clientY;
      });
      window.addEventListener('mouseup', function () { self.isDragging = false; });

      /* --- Mouse wheel zoom --- */
      el.addEventListener('wheel', function (e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.35 : -0.35;
        self.camDistTarget = Math.max(self.camDistMin, Math.min(self.camDistMax, self.camDistTarget + delta));
      }, { passive: false });

      /* --- Touch: drag + pinch zoom --- */
      el.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          self.isDragging = true;
          self.prevX = e.touches[0].clientX;
          self.prevY = e.touches[0].clientY;
          self.rotVelX = 0;
          self.rotVelY = 0;
        } else if (e.touches.length === 2) {
          self.isDragging = false;
          var dx = e.touches[0].clientX - e.touches[1].clientX;
          var dy = e.touches[0].clientY - e.touches[1].clientY;
          self.pinchDist = Math.sqrt(dx * dx + dy * dy);
        }
        e.preventDefault();
      }, { passive: false });

      window.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1 && self.isDragging) {
          var dx = e.touches[0].clientX - self.prevX;
          var dy = e.touches[0].clientY - self.prevY;
          self.rotVelY = dx * 0.008;
          self.rotVelX = dy * 0.008;
          self.prevX = e.touches[0].clientX;
          self.prevY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          var dx2 = e.touches[0].clientX - e.touches[1].clientX;
          var dy2 = e.touches[0].clientY - e.touches[1].clientY;
          var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (self.pinchDist > 0) {
            var scale = self.pinchDist / dist;
            self.camDistTarget = Math.max(self.camDistMin, Math.min(self.camDistMax, self.camDistTarget * scale));
          }
          self.pinchDist = dist;
        }
        e.preventDefault();
      }, { passive: false });

      window.addEventListener('touchend', function (e) {
        if (e.touches.length < 2) self.pinchDist = 0;
        if (e.touches.length === 0) self.isDragging = false;
      });
    },

    _bindResize: function () {
      var self = this;
      window.addEventListener('resize', function () {
        if (!self.container || !self.renderer || !self.camera) return;
        var w = self.container.clientWidth;
        var h = self.container.clientHeight;
        self.camera.aspect = w / h;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(w, h);
      });
    },

    /* ---------- build ---------- */

    parseElectronConfig: function (configStr) {
      if (!configStr) return [];
      return configStr.split(',').map(function (s) { return parseInt(s.trim(), 10) || 0; });
    },

    buildAtom: function (z, electronConfig, categoryName) {
      this.clearAtom();

      var shells = this.parseElectronConfig(electronConfig);
      var numShells = shells.length;
      if (numShells === 0) return;

      /* --- Nucleus --- */
      var nucColor = NUCLEUS_COLORS[z % NUCLEUS_COLORS.length];
      var nucRGB = colorRGB(nucColor);
      var nucSize = Math.max(0.18, Math.min(0.45, 0.14 + numShells * 0.025));

      var nucGeo = new THREE.SphereGeometry(nucSize, 64, 64);
      var nucMat = new THREE.MeshStandardMaterial({
        color: nucColor,
        emissive: nucColor,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
      });
      this.atomGroup.add(new THREE.Mesh(nucGeo, nucMat));

      /* Nucleus inner glow sphere (volumetric, not sprite) */
      var innerGlowGeo = new THREE.SphereGeometry(nucSize * 1.8, 32, 32);
      var innerGlowMat = new THREE.MeshBasicMaterial({
        color: nucColor,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      });
      this.atomGroup.add(new THREE.Mesh(innerGlowGeo, innerGlowMat));

      /* Nucleus outer glow sprite (proper radial texture) */
      var glowTex = makeRadialGlowTexture(nucRGB.r, nucRGB.g, nucRGB.b, 512);
      var glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.95
      });
      var glow = new THREE.Sprite(glowMat);
      var glowScale = nucSize * 6;
      glow.scale.set(glowScale, glowScale, 1);
      this.atomGroup.add(glow);

      /* --- Electron shells --- */
      this.shells = [];
      var baseRadius = 1.0;
      var shellSpacing = numShells <= 2 ? 0.85 : Math.max(0.5, Math.min(0.85, 3.0 / numShells));

      for (var s = 0; s < numShells; s++) {
        var count = shells[s];
        if (count <= 0) continue;

        var radius = baseRadius + s * shellSpacing;
        var sCol = SHELL_COLORS[s % SHELL_COLORS.length];
        var sRGB = colorRGB(sCol);

        /* orbitContainer: precesses around the nucleus, carries ring + electrons */
        var orbitContainer = new THREE.Group();

        /* Orbit ring — metallic torus */
        var ringGeo = new THREE.TorusGeometry(radius, 0.015, 16, 200);
        var ringMat = new THREE.MeshStandardMaterial({
          color: sCol,
          emissive: sCol,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.35,
          metalness: 0.9,
          roughness: 0.15,
          depthWrite: false
        });
        orbitContainer.add(new THREE.Mesh(ringGeo, ringMat));

        var eSize = Math.max(0.05, Math.min(0.09, 0.1 - numShells * 0.004));

        /* Electron glow texture for this shell */
        var eGlowTex = makeRadialGlowTexture(sRGB.r, sRGB.g, sRGB.b, 256);
        var electronMeshes = [];

        for (var ei = 0; ei < count; ei++) {
          var angle = (ei / count) * Math.PI * 2;
          var ex = Math.cos(angle) * radius;
          var ey = Math.sin(angle) * radius;

          /* Electron sphere — metallic */
          var eGeo = new THREE.SphereGeometry(eSize, 24, 24);
          var eMat = new THREE.MeshStandardMaterial({
            color: sCol,
            emissive: sCol,
            emissiveIntensity: 0.7,
            metalness: 0.85,
            roughness: 0.15
          });
          var electron = new THREE.Mesh(eGeo, eMat);
          electron.position.set(ex, ey, 0);
          electron.userData.isElectron = true;
          electron.userData.baseAngle = angle;

          /* Inner glow sphere (volumetric) */
          var eInnerGeo = new THREE.SphereGeometry(eSize * 2.2, 16, 16);
          var eInnerMat = new THREE.MeshBasicMaterial({
            color: sCol,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
          });
          electron.add(new THREE.Mesh(eInnerGeo, eInnerMat));

          /* Outer glow sprite */
          var eSprMat = new THREE.SpriteMaterial({
            map: eGlowTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.6
          });
          var eSpr = new THREE.Sprite(eSprMat);
          eSpr.scale.set(eSize * 5, eSize * 5, 1);
          electron.add(eSpr);

          electronMeshes.push(electron);
          orbitContainer.add(electron);
        }

        this.atomGroup.add(orbitContainer);

        /* Orbital parameters — unique per shell */
        this.shells.push({
          container: orbitContainer,
          electronMeshes: electronMeshes,
          /* Precession: orbit plane wobbles around nucleus */
          precessSpeedX: (0.15 + s * 0.08) * [1, -1, 1, -1, 1, -1, 1, -1][s % 8],
          precessSpeedY: (0.1 + s * 0.06) * [1, 1, -1, -1, 1, 1, -1, -1][s % 8],
          /* Initial tilt angles */
          tiltA: [0.4, 1.1, 0.15, 1.6, 0.8, 1.35, 0.55, 1.9][s % 8],
          tiltB: [0.7, 0.25, 1.4, 0.9, 1.7, 0.45, 1.1, 0.35][s % 8],
          /* Electron spin within the orbital plane */
          spinSpeed: (0.6 + s * 0.3) * [1, -1, 1, -1, 1, -1, 1, -1][s % 8],
          /* Phase offset so orbits don't start synchronized */
          phase: s * 1.3,
          /* Electron rotation axis (Z for spin within plane, but we tilt the whole container) */
          radius: radius,
          count: count
        });
      }

      this.startAnimation();
    },

    clearAtom: function () {
      if (!this.atomGroup) return;
      disposeTree(this.atomGroup);
      this.shells = [];
      this.rotVelX = 0.002;
      this.rotVelY = 0.004;
      this.camDist = 5.0;
      this.camDistTarget = 5.0;
    },

    /* ---------- animation loop ---------- */

    startAnimation: function () {
      if (this.running) return;
      this.running = true;
      this._loop();
    },

    stopAnimation: function () {
      this.running = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    },

    _loop: function () {
      if (!this.running) return;
      this.animId = requestAnimationFrame(this._loop.bind(this));

      /* Smooth zoom */
      this.camDist += (this.camDistTarget - this.camDist) * 0.12;
      this.camera.position.z = this.camDist;

      /* Inertia decay when not dragging */
      if (!this.isDragging) {
        this.rotVelY += (0.003 - this.rotVelY) * 0.015;
        this.rotVelX += (0.001 - this.rotVelX) * 0.015;
      }

      /* Atom rotation (user drag + auto spin) */
      this.atomGroup.rotation.y += this.rotVelY;
      this.atomGroup.rotation.x += this.rotVelX;
      this.atomGroup.rotation.x = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, this.atomGroup.rotation.x));

      /* Orbital animation */
      var t = performance.now() * 0.001;
      for (var i = 0; i < this.shells.length; i++) {
        var sh = this.shells[i];

        /* Precession: orbit plane wobbles around nucleus via Lissajous */
        var px = sh.tiltA + Math.sin(t * sh.precessSpeedX + sh.phase) * 0.5;
        var py = Math.cos(t * sh.precessSpeedY + sh.phase) * 0.6;
        var pz = sh.tiltB + Math.sin(t * sh.precessSpeedX * 0.7 + sh.phase + 2.0) * 0.35;
        sh.container.rotation.set(px, py, pz);

        /* Electron spin: move each electron along its orbit path */
        var eMeshes = sh.electronMeshes;
        for (var e = 0; e < eMeshes.length; e++) {
          var orbitAngle = eMeshes[e].userData.baseAngle + t * sh.spinSpeed;
          eMeshes[e].position.x = Math.cos(orbitAngle) * sh.radius;
          eMeshes[e].position.y = Math.sin(orbitAngle) * sh.radius;
        }
      }

      this.renderer.render(this.scene, this.camera);
    },

    /* ---------- teardown ---------- */

    destroy: function () {
      this.stopAnimation();
      this.clearAtom();
      if (this.renderer) {
        this.renderer.dispose();
        if (this.container && this.renderer.domElement) {
          this.container.removeChild(this.renderer.domElement);
        }
        this.renderer = null;
      }
      this.scene = null;
      this.camera = null;
    }
  };

  window.Atom3D = atom3d;
})();
