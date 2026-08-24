'use strict';
/* =====================================================================
   SMOKE TEST · SIDE QUESTS (Planetas Kinder e Bueno)
   Verifica a estrutura e as regras dos desvios opcionais:
   - 7 planetas com ordem preservada + constantes/temas/recompensas
   - Regras de desbloqueio e escolha de rota (travelOptionsFor)
   - Migração de saves antigos (5 planetas -> 7)
   - Recompensas exclusivas NÃO travam o jogo nem a conquista Colecionador
   - Questões, exercícios, receitas, diálogos e traduções consistentes
   ===================================================================== */
const fs = require('fs');
const vm = require('vm');

let failures = 0;
function check(label, ok) {
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + label);
  if (!ok) failures++;
}

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
  const children = [];
  const el = {
    id,
    hidden: false,
    style: new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => { t[k] = v; return true; }
    }),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    _listeners: {},
    addEventListener(ev, fn) { (el._listeners[ev] = el._listeners[ev] || []).push(fn); },
    removeEventListener() {},
    appendChild(c) { children.push(c); return c; },
    append() {}, setAttribute() {},
    getBoundingClientRect() { return { width: 0, height: 0, left: 0, top: 0 }; },
    focus() {}, blur() {},
    querySelector(sel) { return makeEl(id + '_q'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    get clientWidth() { return 0; },
    get clientHeight() { return 0; },
    textContent: '', innerHTML: '', value: '', checked: false, dataset: {},
    children, firstChild: null
  };
  return el;
}
/* getElementById estável por id (para testar #route) */
const elCache = {};
const document = {
  getElementById(id) { return elCache[id] || (elCache[id] = makeEl(id)); },
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

let store = {};
class FakeImage {
  constructor() { this.src = ''; this.onload = null; }
}
const sandbox = {
  console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
  document, navigator,
  Image: FakeImage,
  Audio: function () { return { play() {}, pause() {}, addEventListener() {} }; },
  addEventListener() {}, requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  performance: { now: () => 0 },
  devicePixelRatio: 1,
  visualViewport: null,
  innerWidth: 800, innerHeight: 600,
  localStorage: {
    getItem(k) { return store[k] != null ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  },
  setTimeout, clearTimeout, setInterval, clearInterval
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const load = file => vm.runInContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), sandbox, { filename: file });
load('script.js');
load('questions.js');
load('exercises.js');
load('i18n_content.js');
const run = expr => vm.runInContext(expr, sandbox);

/* ---------- 1. Estrutura dos planetas ---------- */
check('7 planetas na ordem correta (principal intacta + desvios no fim)',
  run('JSON.stringify(LEVELS.map(l => l.id))') === JSON.stringify(
    ['tutorial', 'ionic', 'covalent', 'metallic', 'final', 'kinder', 'bueno']));
check('constantes KINDER_INDEX=5 e BUENO_INDEX=6',
  run('KINDER_INDEX') === 5 && run('BUENO_INDEX') === 6);
check('SIDE_QUESTS mapeia desvios entre os planetas certos',
  run('JSON.stringify(SIDE_QUESTS[5])') === '{"from":0,"next":1}' &&
  run('JSON.stringify(SIDE_QUESTS[6])') === '{"from":2,"next":3}');
check('temas kinder/bueno definidos com cores de planeta',
  run('THEMES.kinder && THEMES.kinder.planet === "#b388ff" && THEMES.bueno && THEMES.bueno.planet === "#2ee89a"'));
check('buildLevel constrói os desvios sem erro (máquinas e receitas corretas)',
  (() => {
    run(`
      var lk = buildLevel(KINDER_INDEX);
      var lb = buildLevel(BUENO_INDEX);
      window.__sqOk = !!lk && !!lb &&
        lk.lv.id === 'kinder' && lk.lv.machine.type === 'furnace' &&
        JSON.stringify(lk.lv.recipes) === '["NA2S","CAF2","ALCL3"]' &&
        lb.lv.id === 'bueno' && lb.lv.machine.type === 'assembler' &&
        JSON.stringify(lb.lv.recipes) === '["CH4","N2","HCL"]' &&
        lk.npcs.length === 1 && lk.npcs[0].type === 'keeper' &&
        lb.npcs.length === 1 && lb.npcs[0].type === 'alchemist';
      Game.level = null;
    `);
    return run('window.__sqOk === true');
  })());

/* ---------- 2. Elementos, receitas e diálogos ---------- */
check('novos elementos S, F e Ca registrados',
  run('ELEMENTS.S && ELEMENTS.F && ELEMENTS.Ca && ELEMENTS.S.valence === 2 && ELEMENTS.F.valence === 1 && ELEMENTS.Ca.ion === "Ca²⁺"'));
check('receitas dos desvios presentes com kind correto',
  ['NA2S|ionic', 'CAF2|ionic', 'ALCL3|ionic', 'CH4|covalent', 'N2|covalent', 'HCL|covalent']
    .every(pair => {
      const [id, kind] = pair.split('|');
      const r = run('RECIPES["' + id + '"]');
      return r && r.kind === kind;
    }));
check('átomos das novas receitas existem em ELEMENTS',
  ['NA2S', 'CAF2', 'ALCL3', 'CH4', 'N2', 'HCL'].every(id => {
    const atoms = run('JSON.stringify(RECIPES["' + id + '"].atoms)');
    const syms = Object.keys(JSON.parse(atoms));
    return syms.every(s => run('!!ELEMENTS["' + s + '"]'));
  }));
check('diálogos dos desvios têm 6 falas (base PT)',
  run('DIALOGUES[5].length === 6 && DIALOGUES[6].length === 6'));

/* ---------- 3. Desbloqueio e regras de rota ---------- */
check('side quest desbloqueia após o planeta âncora (e só depois)',
  (() => {
    /* save novo: nada completado */
    run('Save.data = Save.defaults(); Save.save();');
    if (!run('!sideQuestUnlocked(KINDER_INDEX) && !sideQuestUnlocked(BUENO_INDEX)')) return false;
    run('Save.data.completed[0] = true;');           /* tutorial feito */
    if (!run('sideQuestUnlocked(KINDER_INDEX)')) return false;
    if (!run('!sideQuestUnlocked(BUENO_INDEX)')) return false;  /* ainda não */
    run('Save.data.completed[2] = true;');           /* covalente feito */
    return run('sideQuestUnlocked(BUENO_INDEX)');
  })());
check('rota pós-tutorial oferece principal + desvio (quando liberado)',
  run('JSON.stringify(travelOptionsFor(0))') === '[1,5]');
check('rota pós-covalente oferece principal + desvio Bueno',
  run('JSON.stringify(travelOptionsFor(2))') === '[3,6]');
check('saindo do desvio volta ao fluxo principal (nunca trava)',
  run('JSON.stringify(travelOptionsFor(5))') === '[1]' &&
  run('JSON.stringify(travelOptionsFor(6))') === '[3]');
check('planetas sem desvio seguem direto ao próximo',
  run('JSON.stringify(travelOptionsFor(1))') === '[2]' &&
  run('JSON.stringify(travelOptionsFor(3))') === '[4]');
check('desvio bloqueado não aparece na rota',
  (() => {
    run('Save.data = Save.defaults();');             /* nada completado */
    const opts = JSON.parse(run('JSON.stringify(travelOptionsFor(0))'));
    return opts.length === 1 && opts[0] === 1;
  })());

/* ---------- 4. Viagem respeita a rota escolhida ---------- */
check('startTravel usa o destino da rota e limpa a escolha',
  (() => {
    run(`
      Game.screen = 'game';
      Game.levelIndex = 0;
      Game.level = buildLevel(0);
      Game.routeDest = KINDER_INDEX;
      startTravel();
    `);
    const ok = run('Game.travel && Game.travel.nextIdx === KINDER_INDEX && Game.routeDest === null');
    run('Game.travel = null;');
    return !!ok;
  })());

/* ---------- 5. Save antigo migra sem perder progresso ---------- */
check('save antigo (5 planetas) migra para 7 posições',
  (() => {
    run(`
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: 1,
        completed: [true, true, false, false, false],
        exerciseBest: [100, 90, 0, 0, 0],
        bestScore: 1234,
        unlocks: ['h_classic', 's_classic'],
        equipped: { helmet: 'h_classic', suit: 's_classic', ship: 'ship_default', trail: 't_none' },
        achievements: [],
        musicOn: true, sfxOn: true
      }));
      Save.load();
    `);
    const cLen = run('Save.data.completed.length');
    const bLen = run('Save.data.exerciseBest.length');
    const kept = run('Save.data.completed[0] === true && Save.data.bestScore === 1234');
    return cLen === 7 && bLen === 7 && kept;
  })());

/* ---------- 6. Recompensas exclusivas ---------- */
check('recompensas exclusivas ligadas aos desvios',
  run('LEVEL_REWARDS[KINDER_INDEX] === "s_prisma" && LEVEL_REWARDS[BUENO_INDEX] === "h_esmeralda"'));
check('itens exclusivos existem no vestiário e usam unlock level:N',
  run(`
    var sp = getItemById('s_prisma'), he = getItemById('h_esmeralda');
    sp && he && sp.unlock === 'level:' + KINDER_INDEX && he.unlock === 'level:' + BUENO_INDEX &&
    COSMETICS.suits.indexOf(sp) >= 0 && COSMETICS.helmets.indexOf(he) >= 0 &&
    typeof sp.maxHearts === 'number'
  `));
check('item exclusivo só desbloqueia com o desvio completo',
  (() => {
    run('Save.data = Save.defaults(); Save.save();');
    if (!run('unlockReason("s_prisma") !== null || !isUnlocked("s_prisma")')) return false;
    if (!run('isUnlocked("s_prisma") === false')) return false;
    run('Save.data.completed[KINDER_INDEX] = true; Save.save();');
    return run('isUnlocked("s_prisma") === true');
  })());
check('Colecionador NÃO exige itens de side quest',
  (() => {
    run(`
      Save.data = Save.defaults();
      /* desbloqueia TUDO da campanha principal */
      Object.keys(COSMETICS).forEach(cat => {
        COSMETICS[cat].forEach(item => {
          if (item.unlock !== 'ach:collector' && !meetsCollectorConditionIsSide(item)) {
            Save.data.unlocks.push(item.id);
          }
        });
      });
      function meetsCollectorConditionIsSide(item) {
        return item.unlock.indexOf('level:') === 0 &&
          (parseInt(item.unlock.split(':')[1], 10) === KINDER_INDEX ||
           parseInt(item.unlock.split(':')[1], 10) === BUENO_INDEX);
      }
    `);
    return run('meetsCollectorCondition() === true');
  })());

/* ---------- 7. Quiz e exercícios dos desvios ---------- */
check('LEVEL_QUIZ aponta para categorias kinder/bueno',
  run('LEVEL_QUIZ[KINDER_INDEX] === "kinder" && LEVEL_QUIZ[BUENO_INDEX] === "bueno"'));
check('6 questões novas por categoria, com gabarito válido',
  (() => {
    for (const cat of ['kinder', 'bueno']) {
      const list = JSON.parse(run('JSON.stringify(QUESTIONS.filter(q => q.cat === "' + cat + '"))'));
      if (list.length < 6) return false;
      for (const q of list) {
        if (!Array.isArray(q.opts) || q.opts.length !== 4) return false;
        if (!(q.ans >= 0 && q.ans <= 3)) return false;
        if (!q.why) return false;
      }
    }
    return true;
  })());
check('EXERCISE_LEVELS[5] e [6] com 6 desafios cada e estruturas válidas',
  (() => {
    const lists = JSON.parse(run('JSON.stringify([EXERCISE_LEVELS[KINDER_INDEX], EXERCISE_LEVELS[BUENO_INDEX]])'));
    for (const list of lists) {
      if (!list || list.length !== 6) return false;
      for (const it of list) {
        if (!it.instruction || !it.explain || !it.pts) return false;
        if (it.type === 'choice') {
          if (!Array.isArray(it.opts) || !(it.ans >= 0 && it.ans < it.opts.length)) return false;
        } else if (it.type === 'lewis') {
          const sum = it.answerKey.reduce((a, b) => a + b, 0);
          if (sum !== it.valence || it.answerKey.length !== 4) return false;
          if (it.answerKey.some(v => v < 0 || v > 2)) return false;
        } else if (it.type === 'electrons') {
          const tot = it.shells.reduce((a, sh) => a + sh.answer, 0);
          if (tot !== it.z) return false;
          if (it.shells.some(sh => sh.answer > sh.max)) return false;
        } else if (it.type === 'transfer') {
          const cap = (it.acceptors || [it.acceptor])
            .reduce((a, acc) => a + (acc.accepts || 1), 0);
          if (cap < it.need || it.donor.valence < it.need) return false;
        } else if (it.type === 'drag') {
          const ids = it.items.map(x => x.id);
          if (Object.keys(it.answerKey).sort().join() !== ids.slice().sort().join()) return false;
          if (!ids.every(id => it.answerKey[id] >= 0 && it.answerKey[id] < it.slots.length)) return false;
        } else if (it.type === 'structure') {
          if (!it.anchors.every(a => it.tray.indexOf(a.el) >= 0)) return false;
          if (!(it.bonds || []).every(b => b.a < it.anchors.length && b.b < it.anchors.length)) return false;
        } else if (it.type === 'text-input') {
          if (typeof it.answer !== 'string') return false;
        } else {
          return false; /* tipo desconhecido nos desvios */
        }
      }
    }
    return true;
  })());

/* ---------- 8. Traduções cobrem os desvios ---------- */
check('EN/ES traduzem níveis e diálogos dos desvios (mesmos comprimentos)',
  (() => {
    const C = run('window.I18N_CONTENT');
    for (const lang of ['en', 'es']) {
      if (!C[lang]) return false;
      if (C[lang].dialogues.length !== 7) return false;
      for (const i of [0, 1, 2, 3, 4, 5, 6]) {
        if (C[lang].dialogues[i].length !== run('DIALOGUES[' + i + '].length')) return false;
      }
      for (const k of ['kinder', 'bueno']) {
        const lv = C[lang].levels[k];
        if (!lv || !lv.name || !lv.intro || !lv.objective || !lv.chem) return false;
      }
    }
    return true;
  })());

/* ---------- 9. HTML/CSS: overlay de rota e cache novo ---------- */
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/style.css', 'utf8');
const src = fs.readFileSync(__dirname + '/script.js', 'utf8');
check('#route presente no HTML com opções e título',
  html.includes('id="route"') && html.includes('id="route-options"') && html.includes('id="route-title-text"'));
check('cache bumpado para 20260824a em todos os assets',
  html.includes('?v=20260824a') && !html.includes('?v=20260823'));
check('CSS estiliza painel de rota e cartões de planeta opcional',
  css.includes('.route-panel') && css.includes('.route-btn.route-side') && css.includes('.planet-btn.side'));
check('overlay route é escondido nas trocas de tela (hideOverhaulOverlays)',
  src.includes("'periodic-table', 'route']"));

/* ---------- resultado ---------- */
if (failures) {
  console.error('\nSMOKE_FAIL (' + failures + ' falha(s))');
  process.exit(1);
}
console.log('\nSMOKE_OK');
