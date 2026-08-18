/* ============================================================
   MODELO ATÔMICO 3D — Rutherford / Space Chemistry
   ------------------------------------------------------------
   Renderiza um átomo em Three.js ao clicar num elemento da
   tabela periódica. Núcleo com glow, elétrons em órbitas
   concêntricas, arrastável com o mouse em 360°.
   ============================================================ */
(function () {
  'use strict';

  /* Cores fixas por número atômico para variação visual */
  var NUCLEUS_COLORS = [
    0xff6b6b, 0x6bcfff, 0xffa06b, 0x6bffa0, 0xc06bff,
    0xffe06b, 0x6bffff, 0xff6bc0, 0xa0ff6b, 0x6ba0ff
  ];

  var ELECTRON_SHELL_COLORS = [
    0x00ffff, 0xff88ff, 0x88ff88, 0xffff88,
    0xff8888, 0x88ffcc, 0xcc88ff, 0xffcc88
  ];

  var atom3d = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    atomGroup: null,
    shells: [],
    animId: null,
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    rotationVel: { x: 0.003, y: 0.005 },
    running: false,

    init: function (containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container || !window.THREE) return;

      /* Scene */
      this.scene = new THREE.Scene();

      /* Camera */
      var w = this.container.clientWidth || 280;
      var h = this.container.clientHeight || 280;
      this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      this.camera.position.set(0, 0, 5);

      /* Renderer */
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);
      this.container.appendChild(this.renderer.domElement);

      /* Lights */
      var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambientLight);
      var pointLight = new THREE.PointLight(0xffffff, 1.2, 200);
      pointLight.position.set(3, 3, 5);
      this.scene.add(pointLight);

      /* Group for the whole atom */
      this.atomGroup = new THREE.Group();
      this.scene.add(this.atomGroup);

      /* Mouse interaction */
      this._bindMouse();
      this._bindResize();
    },

    _bindMouse: function () {
      var self = this;
      var el = this.container;
      if (!el) return;

      el.addEventListener('mousedown', function (e) {
        self.isDragging = true;
        self.prevMouse.x = e.clientX;
        self.prevMouse.y = e.clientY;
        e.preventDefault();
      });
      window.addEventListener('mousemove', function (e) {
        if (!self.isDragging) return;
        var dx = e.clientX - self.prevMouse.x;
        var dy = e.clientY - self.prevMouse.y;
        self.rotationVel.y = dx * 0.01;
        self.rotationVel.x = dy * 0.01;
        self.prevMouse.x = e.clientX;
        self.prevMouse.y = e.clientY;
      });
      window.addEventListener('mouseup', function () {
        self.isDragging = false;
      });

      /* Touch */
      el.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          self.isDragging = true;
          self.prevMouse.x = e.touches[0].clientX;
          self.prevMouse.y = e.touches[0].clientY;
          e.preventDefault();
        }
      }, { passive: false });
      window.addEventListener('touchmove', function (e) {
        if (!self.isDragging || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - self.prevMouse.x;
        var dy = e.touches[0].clientY - self.prevMouse.y;
        self.rotationVel.y = dx * 0.01;
        self.rotationVel.x = dy * 0.01;
        self.prevMouse.x = e.touches[0].clientX;
        self.prevMouse.y = e.touches[0].clientY;
      });
      window.addEventListener('touchend', function () {
        self.isDragging = false;
      });
    },

    _bindResize: function () {
      var self = this;
      window.addEventListener('resize', function () {
        if (!self.container || !self.renderer) return;
        var w = self.container.clientWidth;
        var h = self.container.clientHeight;
        self.camera.aspect = w / h;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(w, h);
      });
    },

    parseElectronConfig: function (configStr) {
      if (!configStr) return [];
      return configStr.split(',').map(function (s) { return parseInt(s.trim(), 10) || 0; });
    },

    buildAtom: function (z, electronConfig, categoryName) {
      /* Clear previous */
      this.clearAtom();

      var shells = this.parseElectronConfig(electronConfig);
      var numShells = shells.length;
      if (numShells === 0) return;

      /* Nucleus color based on atomic number */
      var nucleusColor = NUCLEUS_COLORS[z % NUCLEUS_COLORS.length];

      /* -- Nucleus with glow -- */
      var nucleusSize = Math.max(0.15, Math.min(0.4, 0.12 + numShells * 0.02));
      var nucleusGeo = new THREE.SphereGeometry(nucleusSize, 32, 32);
      var nucleusMat = new THREE.MeshPhongMaterial({
        color: nucleusColor,
        emissive: nucleusColor,
        emissiveIntensity: 0.8,
        shininess: 100
      });
      var nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      this.atomGroup.add(nucleus);

      /* Glow sprite */
      var glowCanvas = document.createElement('canvas');
      glowCanvas.width = 128;
      glowCanvas.height = 128;
      var ctx = glowCanvas.getContext('2d');
      var gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      var hex = '#' + nucleusColor.toString(16).padStart(6, '0');
      gradient.addColorStop(0, hex);
      gradient.addColorStop(0.3, hex + 'cc');
      gradient.addColorStop(0.7, hex + '44');
      gradient.addColorStop(1, hex + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      var glowTexture = new THREE.CanvasTexture(glowCanvas);
      var glowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.9
      });
      var glow = new THREE.Sprite(glowMat);
      glow.scale.set(nucleusSize * 5, nucleusSize * 5, 1);
      this.atomGroup.add(glow);

      /* -- Electron shells -- */
      this.shells = [];
      var maxElectrons = Math.max.apply(null, shells);
      var baseRadius = 0.7;
      var shellSpacing = Math.max(0.45, Math.min(0.7, 2.0 / numShells));
      var shellColors = ELECTRON_SHELL_COLORS;

      for (var s = 0; s < numShells; s++) {
        var count = shells[s];
        if (count <= 0) continue;

        var radius = baseRadius + s * shellSpacing;
        var shellColor = shellColors[s % shellColors.length];

        /* Orbit ring (torus) */
        var ringGeo = new THREE.TorusGeometry(radius, 0.008, 8, 128);
        var ringMat = new THREE.MeshBasicMaterial({
          color: shellColor,
          transparent: true,
          opacity: 0.25
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + (s * 0.3);
        ring.rotation.z = s * 0.15;
        this.atomGroup.add(ring);

        /* Shell group (tilted plane for each orbit) */
        var shellGroup = new THREE.Group();
        shellGroup.rotation.x = Math.PI / 2 + (s * 0.3);
        shellGroup.rotation.z = s * 0.15;

        /* Electrons */
        var electronSize = Math.max(0.03, 0.06 - numShells * 0.003);
        for (var e = 0; e < count; e++) {
          var angle = (e / count) * Math.PI * 2;
          var ex = Math.cos(angle) * radius;
          var ey = Math.sin(angle) * radius;

          var eGeo = new THREE.SphereGeometry(electronSize, 12, 12);
          var eMat = new THREE.MeshPhongMaterial({
            color: shellColor,
            emissive: shellColor,
            emissiveIntensity: 0.6,
            shininess: 80
          });
          var electron = new THREE.Mesh(eGeo, eMat);
          electron.position.set(ex, ey, 0);

          /* Small glow per electron */
          var eGlowMat = new THREE.SpriteMaterial({
            color: shellColor,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
          });
          var eGlow = new THREE.Sprite(eGlowMat);
          eGlow.scale.set(electronSize * 4, electronSize * 4, 1);
          electron.add(eGlow);

          shellGroup.add(electron);
        }

        this.atomGroup.add(shellGroup);
        this.shells.push({
          group: shellGroup,
          radius: radius,
          count: count,
          speed: (0.6 + s * 0.3) * (s % 2 === 0 ? 1 : -1),
          electrons: shellGroup.children.filter(function (c) { return c.type === 'Mesh'; })
        });
      }

      /* Start animation */
      this.startAnimation();
    },

    clearAtom: function () {
      if (!this.atomGroup) return;
      while (this.atomGroup.children.length > 0) {
        var child = this.atomGroup.children[0];
        this.atomGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
      this.shells = [];
      this.rotationVel = { x: 0.003, y: 0.005 };
    },

    startAnimation: function () {
      if (this.running) return;
      this.running = true;
      this._animate();
    },

    stopAnimation: function () {
      this.running = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    },

    _animate: function () {
      if (!this.running) return;
      this.animId = requestAnimationFrame(this._animate.bind(this));

      /* Slow natural spin + user drag */
      if (!this.isDragging) {
        this.rotationVel.y += (0.004 - this.rotationVel.y) * 0.02;
        this.rotationVel.x += (0.001 - this.rotationVel.x) * 0.02;
      }
      this.atomGroup.rotation.y += this.rotationVel.y;
      this.atomGroup.rotation.x += this.rotationVel.x;

      /* Rotate electrons in each shell */
      for (var i = 0; i < this.shells.length; i++) {
        var shell = this.shells[i];
        shell.group.rotation.z += shell.speed * 0.015;
      }

      this.renderer.render(this.scene, this.camera);
    },

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
