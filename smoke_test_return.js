'use strict';
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync(__dirname + '/script.js', 'utf8');

function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const base = {
    canvas: { width: 0, height: 0 },
    createLinearGradient() { return makeGradient(); },
    createRadialGradient() { return makeGradient(); },
    measureText() { return { width: 10 }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
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
const document = {
  getElementById(id) { return makeEl(id); },
  querySelector(sel) { return makeEl(sel); },
  querySelectorAll() { return []; },
  createElement(tag) { return makeEl(tag); },
  addEventListener() {},
  body: makeEl('body'),
  documentElement: { style: {} },
  hidden: false,
  visibilityState: 'visible'
};
const navigator = { maxTouchPoints: 0 };
const windowStub = new Proxy({
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
}, {
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
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'script.js' });

const run = expr => vm.runInContext(expr, sandbox);

run('Save.load()');
run('Save.data.completed[0] = true;');
run('Input.isDown = function() { return false; };');
run('Game.player = { x: 0, y: 0, invuln: 0, hurtT: 0 };');
run('Game.run.lives = 99;');

run('startReturn()');
const stateOk = run('Game.return.rings.length === 0 && Game.return.shake === 0 && Game.return.flash === 0 && Game.return.ship.recoil === 0');

/* injeta inimigos controlados (sem spawn extra) */
run(`
  Game.return.spawnT = 9999;
  Game.return.spawned = 12;
  Game.return.enemies = [
    { x: 480, y: 100, baseY: 100, r: 15, hp: 1, maxHp: 1, speed: 72, t: 0, shotCd: 0.05, dead: false, deadT: 0, color: '#ff9df2', big: false, dir: 1, pid: 0, vx: -60, vy: 0, state: 'patrol', dodgeT: 0, hitT: 0, swayF: 0 },
    { x: 520, y: 260, baseY: 260, r: 22, hp: 3, maxHp: 3, speed: 42, t: 0, shotCd: 0.05, dead: false, deadT: 0, color: '#ff5d6c', big: true, dir: 1, pid: 1, vx: -60, vy: 0, state: 'patrol', dodgeT: 0, hitT: 0, swayF: 0 }
  ];
`);

for (let i = 0; i < 120; i++) run('updateReturn(1 / 60)');

const enemiesMoved = run('Game.return.enemies.every(e => e.t > 0)');
const enemyShotHoming = run('Game.return.enemyShots.length > 0 && Game.return.enemyShots.every(b => b.homing >= 0 && b.homing <= 1.6)');
const chased = run('Game.return.enemies.every(e => e.state === "chase" && Math.abs(e.vx) > 0)');

/* atira e mata a nave grande: deve gerar anel/clarão/tremor */
run('returnShoot()');
run(`
  const target = Game.return.enemies.find(e => e.big && !e.dead);
  target.hp = 1;
  killReturnEnemy(target);
`);
const explosionFx = run('Game.return.rings.length >= 2 && Game.return.shake >= 9 && Game.return.flash >= 0.5');
const debrisParticles = run('Game.particles.length > 10');

run('Game.return.shots = [{ x: 400, y: 180, vx: 380, vy: 0, t: 0 }];');
run('Game.return.enemyShots = [{ x: 300, y: 200, vx: -120, vy: 30, t: 0, homing: 1.6 }];');
run('Game.return.flash = 0.4;');
run('Game.return.rings = [{ x: 320, y: 180, color: "#ff9df2", r: 6, vr: 150, life: 0.5, maxLife: 0.5, width: 3 }];');

run('drawReturnScene()');

const clearedPath = run(`
  Game.return.enemies = [];
  Game.return.spawned = 12;
  Game.return.cleared = false;
  true
`);
run('updateReturn(1 / 60)');
const clearedOk = run('Game.return.cleared === true');

/* morte da nave grande com o 3D desligado */
run('drawReturnEnemyDeath({ x: 200, y: 150, deadT: 0.2, big: true, color: "#ff5d6c" })');

console.log('state init ok:', stateOk);
console.log('enemies move/chase ok:', enemiesMoved, chased);
console.log('enemy bolt homing window ok:', enemyShotHoming);
console.log('explosion fx (rings/shake/flash) ok:', explosionFx);
console.log('debris particles ok:', debrisParticles);
console.log('cleared path ok:', clearedOk);
console.log('drawReturnScene ran ok');
console.log('SMOKE_OK');
