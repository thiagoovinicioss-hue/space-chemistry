'use strict';
const fs = require('fs');
const vm = require('vm');

function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const base = {
    canvas: { width: 0, height: 0 },
    createLinearGradient() { return makeGradient(); },
    createRadialGradient() { return makeGradient(); },
    measureText() { return { width: 10 }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData() {},
    createPattern() { return {}; },
    drawImage() {},
    setLineDash() {}
  };
  return new Proxy(base, {
    get(t, k) { return k in t ? t[k] : () => {}; },
    set(t, k, v) { t[k] = v; return true; }
  });
}
function makeEl(id) {
  return {
    id,
    hidden: false,
    style: new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => { t[k] = v; return true; }
    }),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, append() {}, setAttribute() {},
    getBoundingClientRect() { return { width: 0, height: 0, left: 0, top: 0 }; },
    querySelector() { return makeEl(id + '_q'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    get clientWidth() { return 0; },
    get clientHeight() { return 0; },
    textContent: '', value: '', checked: false, dataset: {}, children: [], firstChild: null
  };
}

function buildSandbox(extra) {
  const document = {
    getElementById(id) { return makeEl(id); },
    querySelector(s) { return makeEl(s); },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {},
    body: makeEl('body'),
    documentElement: { style: {} },
    hidden: false,
    visibilityState: 'visible'
  };
  const navigator = { maxTouchPoints: 0 };
  const windowStub = new Proxy(Object.assign({
    addEventListener() {}, requestAnimationFrame() { return 0; },
    cancelAnimationFrame() {},
    performance: { now: () => 0 },
    devicePixelRatio: 1,
    visualViewport: null,
    innerWidth: 800, innerHeight: 600,
    navigator,
    localStorage: {
      getItem() { return null; }, setItem() {}, removeItem() {}
    }
  }, extra), {
    get(t, k) { return k in t ? t[k] : undefined; },
    set(t, k, v) { t[k] = v; return true; }
  });
  const sandbox = {
    console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
    document, navigator, localStorage: windowStub.localStorage,
    requestAnimationFrame: windowStub.requestAnimationFrame,
    cancelAnimationFrame: windowStub.cancelAnimationFrame,
    performance: windowStub.performance,
    window: windowStub,
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  if (extra && extra.THREE) sandbox.THREE = extra.THREE;
  sandbox.globalThis = sandbox;
  return { sandbox, windowStub };
}

/* ---------------- stub mínimo de Three.js ---------------- */
function soft(init) {
  const t = Object.assign({}, init);
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      const fn = function () { return fn; };
      return fn;
    },
    set(o, k, v) { o[k] = v; return true; }
  });
}
function makeVector3() {
  const v = { x: 0, y: 0, z: 0 };
  v.clone = () => makeVector3();
  v.set = (x, y, z) => { v.x = x; v.y = y; v.z = z; return v; };
  v.setScalar = (s) => s;
  v.copy = (o) => o;
  v.normalize = () => v;
  return soft(v);
}
function makeObj() {
  const o = {
    children: [],
    userData: {},
    visible: true,
    name: '',
    position: makeVector3(),
    scale: makeVector3(),
    rotation: soft({ x: 0, y: 0, z: 0 }),
    quaternion: soft({ x: 0, y: 0, z: 0, w: 1 }),
    material: soft({ opacity: 1, transparent: false, depthWrite: true, blending: 0, map: null, emissive: null, size: 1 }),
    geometry: soft({ attributes: {} }),
    matrixAutoUpdate: true,
    domElement: soft({ style: {}, parentNode: null, appendChild() {}, removeChild() {} }),
    addEventListener() {}, removeEventListener() {},
    updateMatrix() {}, updateMatrixWorld() {},
    setAttribute() {},
    lookAt() {},
    clone: () => makeObj(),
    copy: () => o,
    add(...c) { for (const x of c) if (x && typeof x === 'object') o.children.push(x); return o; },
    remove() { return o; },
    traverse() {},
    render() {}
  };
  return soft(o);
}

function makeTHREE(registry) {
  const constructors = [
    'Group', 'Mesh', 'Points', 'Sprite', 'Scene', 'PerspectiveCamera',
    'HemisphereLight', 'DirectionalLight', 'CanvasTexture', 'Color',
    'MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial',
    'SpriteMaterial', 'PointsMaterial',
    'SphereGeometry', 'ConeGeometry', 'BoxGeometry', 'RingGeometry',
    'OctahedronGeometry', 'BufferGeometry', 'BufferAttribute',
    'WebGLRenderer', 'Vector'
  ];
  const THREE = {};
  for (const name of constructors) {
    THREE[name] = function () {
      const o = name === 'WebGLRenderer' || name === 'Scene' ? makeObj() : makeObj();
      if (registry) {
        registry.push(name);
        if (name === 'Group' || name === 'Mesh' || name === 'Points' || name === 'Sprite') {
          const tag = registry[registry.length - 1];
          o._fx3dType = name;
        }
      }
      return o;
    };
  }
  THREE.Vector3 = function () { return makeVector3(); };
  THREE.Color = function () { return soft({}); };
  THREE.AdditiveBlending = 2;
  THREE.NormalBlending = 1;
  THREE.DoubleSide = 2;
  THREE.BackSide = 1;
  THREE.FrontSide = 0;
  THREE.ClampToEdgeWrapping = 1001;
  THREE.RepeatWrapping = 1000;
  THREE.NearestFilter = 1003;
  return THREE;
}

function runEffects3dTest() {
  const { sandbox, windowStub } = buildSandbox({ THREE: makeTHREE(null) });

  /* script.js carrega primeiro (fornece Game/LEVELS/THEMES no mesmo escopo) */
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(__dirname + '/script.js', 'utf8'), sandbox, { filename: 'script.js' });
  vm.runInContext(fs.readFileSync(__dirname + '/effects3d.js', 'utf8'), sandbox, { filename: 'effects3d.js' });

  const run = e => vm.runInContext(e, sandbox);

  run('window.Effects3D.init()');
  const supported = run('window.Effects3D.supported() === true');
  const enabled = run('window.Effects3D.isEnabled() === true');

  run('Game.screen = "game"');
  run('Game.phase = "return"');
  run(`
    Game.return = {
      t: 0, shotCd: 0, ship: { x: 300, y: 200, invuln: 0, recoil: 0, flame: 0 },
      rings: [], shots: [], enemyShots: [],
      enemies: [
        { x: 480, y: 120, baseY: 120, r: 15, vx: -60, vy: 0, t: 1, dead: false, big: false, color: "#ff9df2" },
        { x: 510, y: 260, baseY: 260, r: 22, vx: -60, vy: 0, t: 2, dead: false, big: true, color: "#ff5d6c" },
        { x: 460, y: 340, baseY: 340, r: 15, vx: -60, vy: 0, t: 3, dead: true, big: false, color: "#ff9df2" }
      ]
    };
  `);

  let returnTickOk = true;
  try {
    for (let i = 0; i < 30; i++) run('window.Effects3D.tick(1 / 60)');
  } catch (e) { returnTickOk = false; console.log('tick(return) THREW:', e.message); }

  run('Game.phase = "travel"');
  run('Game.level = { theme: { planet: "#4a7dff" } }');
  let travelTickOk = true;
  try { for (let i = 0; i < 10; i++) run('window.Effects3D.tick(1 / 60)'); }
  catch (e) { travelTickOk = false; console.log('tick(travel) THREW:', e.message); }

  /* volta para return (re-mostrar frota) e depois menu */
  run('Game.phase = "return"');
  let returnAgainOk = true;
  try { run('window.Effects3D.tick(1 / 60)'); }
  catch (e) { returnAgainOk = false; console.log('tick(return again) THREW:', e.message); }
  run('Game.screen = "menu"; Game.phase = ""');
  let menuTickOk = true;
  try { for (let i = 0; i < 10; i++) run('window.Effects3D.tick(1 / 60)'); }
  catch (e) { menuTickOk = false; console.log('tick(menu) THREW:', e.message); }

  /* toggle desliga (detach) e religa */
  const toggledOff = run('(window.Effects3D.toggle() === false) && window.Effects3D.isEnabled() === false');
  const toggledOn = run('window.Effects3D.toggle() === true');

  console.log('supported/enabled:', supported, enabled);
  console.log('tick return ok:', returnTickOk);
  console.log('tick travel ok:', travelTickOk);
  console.log('tick return(again) ok:', returnAgainOk);
  console.log('tick menu ok:', menuTickOk);
  console.log('toggle off/on ok:', toggledOff, toggledOn);
}

function runNoThreeTest() {
  const { sandbox, windowStub } = buildSandbox({});
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(__dirname + '/effects3d.js', 'utf8'), sandbox, { filename: 'effects3d.js' });
  const run = e => vm.runInContext(e, sandbox);
  run('window.Effects3D.init()');
  const supported = run('window.Effects3D.supported() === false');
  const toggled = run('window.Effects3D.toggle() === false');
  let cbCalled = false;
  windowStub.__cb = () => { cbCalled = true; };
  run('window.Effects3D.cinematic("departure", "bond", window.__cb)');
  console.log('no-THREE: init safe / toggle false / cinematic calls cb:', supported, toggled, cbCalled);
}

runEffects3dTest();
runNoThreeTest();
console.log('FX3D_SMOKE_OK');
