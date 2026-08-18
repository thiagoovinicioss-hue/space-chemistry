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
    0xff6b6b, 0x6bcfff, 0xffa06b, 0x6bffa0, 0xc06bff,
    0xffe06b, 0x6bffff, 0xff6bc0, 0xa0ff6b, 0x6ba0ff
  ];

  var SHELL_COLORS = [
    0x00e5ff, 0xff80d5, 0x69f0ae, 0xffd740,
    0xff5252, 0x64ffda, 0xb388ff, 0xffab40
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
      this.renderer.toneMappingExposure = 1.2;
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
      var nucMat = new THREE.MeshPhongMaterial({
        color: nucColor,
        emissive: nucColor,
        emissiveIntensity: 0.9,
        shininess: 120,
        specular: 0x444444
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
      var baseRadius = 0.8;
      var shellSpacing = numShells <= 2 ? 0.7 : Math.max(0.38, Math.min(0.65, 2.2 / numShells));

      for (var s = 0; s < numShells; s++) {
        var count = shells[s];
        if (count <= 0) continue;

        var radius = baseRadius + s * shellSpacing;
        var sCol = SHELL_COLORS[s % SHELL_COLORS.length];
        var sRGB = colorRGB(sCol);

        /* Orbit ring — tube for thickness */
        var ringGeo = new THREE.TorusGeometry(radius, 0.012, 16, 200);
        var ringMat = new THREE.MeshPhongMaterial({
          color: sCol,
          emissive: sCol,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.3,
          shininess: 40,
          depthWrite: false
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + s * 0.32;
        ring.rotation.z = s * 0.18;
        this.atomGroup.add(ring);

        /* Shell group */
        var shellGroup = new THREE.Group();
        shellGroup.rotation.x = Math.PI / 2 + s * 0.32;
        shellGroup.rotation.z = s * 0.18;

        var eSize = Math.max(0.04, Math.min(0.08, 0.09 - numShells * 0.004));

        /* Electron glow texture for this shell */
        var eGlowTex = makeRadialGlowTexture(sRGB.r, sRGB.g, sRGB.b, 256);

        for (var ei = 0; ei < count; ei++) {
          var angle = (ei / count) * Math.PI * 2;
          var ex = Math.cos(angle) * radius;
          var ey = Math.sin(angle) * radius;

          /* Electron sphere — high segment count */
          var eGeo = new THREE.SphereGeometry(eSize, 24, 24);
          var eMat = new THREE.MeshPhongMaterial({
            color: sCol,
            emissive: sCol,
            emissiveIntensity: 0.75,
            shininess: 100,
            specular: 0x666666
          });
          var electron = new THREE.Mesh(eGeo, eMat);
          electron.position.set(ex, ey, 0);

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

          /* Outer glow sprite with proper radial texture */
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

          shellGroup.add(electron);
        }

        this.atomGroup.add(shellGroup);
        this.shells.push({
          group: shellGroup,
          speed: (0.5 + s * 0.25) * (s % 2 === 0 ? 1 : -1)
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

      /* Atom rotation */
      this.atomGroup.rotation.y += this.rotVelY;
      this.atomGroup.rotation.x += this.rotVelX;

      /* Clamp X rotation */
      this.atomGroup.rotation.x = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, this.atomGroup.rotation.x));

      /* Electron orbit rotation */
      for (var i = 0; i < this.shells.length; i++) {
        var shell = this.shells[i];
        shell.group.rotation.z += shell.speed * 0.012;
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
