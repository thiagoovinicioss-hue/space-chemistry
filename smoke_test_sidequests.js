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
      get: (t, k) => {
        if (k === 'setProperty') return (n, v) => { t[n] = v; };
        if (k === 'getPropertyValue') return (n) => (t[n] != null ? t[n] : '');
        return k in t ? t[k] : '';
      },
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
    textContent: '', value: '', checked: false, dataset: {},
    children, firstChild: null
  };
  /* innerHTML='' em um elemento real limpa os filhos (renderGalaxy depende disso) */
  let _innerHTML = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return _innerHTML; },
    set(v) { _innerHTML = v; children.length = 0; }
  });
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
  scrollTo() {},
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
check('menu de rota NUNCA oferece desvio (só campanha principal)',
  run('JSON.stringify(travelOptionsFor(0))') === '[1]' &&
  run('JSON.stringify(travelOptionsFor(2))') === '[3]');
check('saindo do desvio volta ao fluxo principal (nunca trava)',
  run('JSON.stringify(travelOptionsFor(5))') === '[1]' &&
  run('JSON.stringify(travelOptionsFor(6))') === '[3]');
check('planetas sem desvio seguem direto ao próximo',
  run('JSON.stringify(travelOptionsFor(1))') === '[2]' &&
  run('JSON.stringify(travelOptionsFor(3))') === '[4]');
check('desvio físico só existe na transição âncora→próximo (e se não zerado)',
  (() => {
    run('Save.data = Save.defaults();');             /* nada completado */
    if (run('travelDetourFor(0)') !== null) return false;   /* âncora não feita */
    run('Save.data.completed[0] = true;');
    if (run('travelDetourFor(0)') !== run('KINDER_INDEX')) return false;
    if (run('travelDetourFor(1)') !== null) return false;   /* janela passou */
    if (run('travelDetourFor(5)') !== null) return false;   /* saindo do desvio */
    run('Save.data.completed[5] = true;');
    return run('travelDetourFor(0)') === null;       /* já zerado: some */
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

/* ---------- 4b. Desvio FÍSICO no espaço durante a viagem ---------- */
check('startTravel cria o planeta desvio no canto inferior direito (sem menu)',
  (() => {
    run(`
      Save.data = Save.defaults();
      Save.data.completed[0] = true;      /* tutorial feito, Kinder não */
      Game.levelIndex = 0;
      Game.level = buildLevel(0);
      startTravel();
    `);
    const ok = run(`
      !!Game.travel.detour &&
      Game.travel.detour.idx === KINDER_INDEX &&
      Game.travel.detour.x > VIEW_W * 0.6 &&
      Game.travel.detour.y > VIEW_H * 0.55
    `);
    run('Game.travel = null;');
    return !!ok;
  })());
check('Bueno aparece como desvio na viagem covalente → metálica',
  (() => {
    run(`
      Save.data.completed[2] = true;      /* covalente feita, Bueno não */
      Game.levelIndex = 2;
      Game.level = buildLevel(2);
      startTravel();
    `);
    const ok = run('!!Game.travel.detour && Game.travel.detour.idx === BUENO_INDEX');
    run('Game.travel = null;');
    return !!ok;
  })());
check('encostar no planeta físico DESVIA a viagem para a side quest',
  (() => {
    run(`
      Save.data.completed[0] = true; Save.data.completed[5] = false;
      Game.levelIndex = 0;
      Game.level = buildLevel(0);
      startTravel();
      var d = Game.travel.detour;
      Game.travel.ship.x = d.x; Game.travel.ship.y = d.y;  /* toca no planeta */
      updateTravel(0.016);
    `);
    const ok = run(`
      !Game.travel.detour &&
      Game.travel.nextIdx === KINDER_INDEX &&
      (!!Game.travel.arriving || !!Game.travel.cinematic)
    `);
    run('Game.travel = null;');
    return !!ok;
  })());
check('desvio já zerado NÃO aparece mais no caminho',
  (() => {
    run(`
      Save.data.completed[0] = true; Save.data.completed[5] = true;
      Game.levelIndex = 0;
      Game.level = buildLevel(0);
      startTravel();
    `);
    const ok = run('Game.travel.detour === null');
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
check('EXERCISE_LEVELS[5] com 4 desafios e [6] com 6, estruturas válidas',
  (() => {
    const lists = JSON.parse(run('JSON.stringify([EXERCISE_LEVELS[KINDER_INDEX], EXERCISE_LEVELS[BUENO_INDEX]])'));
    const expected = [4, 6];
    for (let li = 0; li < lists.length; li++) {
      const list = lists[li];
      if (!list || list.length !== expected[li]) return false;
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
check('cache bumpado para 20260825e em todos os assets',
  html.includes('?v=20260825e') && !html.includes('?v=20260824f') && !html.includes('?v=20260823'));
check('CSS estiliza painel de rota e cartões de planeta opcional',
  css.includes('.route-panel') && css.includes('.route-btn.route-side') && css.includes('.planet-btn.side'));
check('overlay route é escondido nas trocas de tela (hideOverhaulOverlays)',
  src.includes("'route', 'ballistic'"));

/* ---------- Galáxia: side quests SECRETAS (só aparecem zeradas) ---------- */
check('planeta desvio só aparece na galáxia DEPOIS de zerado (card secreto)',
  (() => {
    const N = run('LEVELS.length');
    run('Save.data = Save.defaults(); Save.data.completed[0] = true;');
    run('renderGalaxy();');
    /* sem os 2 secretos: apenas os 5 planetas principais no mapa */
    const countBefore = run("document.getElementById('galaxy-track').children.length");
    if (countBefore !== N - 2) return false;
    run('Save.data.completed[5] = true; renderGalaxy();');
    const countAfter = run("document.getElementById('galaxy-track').children.length");
    const hasSecretClass = run(`
      Array.from(document.getElementById('galaxy-track').children)
        .some(b => /\\bsecret\\b/.test(b.className))
    `);
    return countAfter === N - 1 && hasSecretClass;
  })());
check('CSS do cartão secreto: borda dourada sobre preto luxuoso',
  css.includes('.planet-btn.secret') &&
  css.includes('.planet-btn.secret::before') &&
  css.includes('.planet-secret-badge') &&
  css.includes('#ffd166'));
check('camada 3D projeta o planeta desvio no mesmo ponto lógico',
  (() => {
    const fx = fs.readFileSync(__dirname + '/effects3d.js', 'utf8');
    return fx.includes('readTravelDetour') && fx.includes('updateDetourPlanet') &&
      fx.includes('detourPlanet.position.set(logicalToWorldX(det.x)') &&
      fx.includes('worldRadiusForPx(det.px');
  })());
check('desenho 2D do desvio tem etiqueta DESVIO OPCIONAL e posição própria',
  src.includes('function drawTravelDetour') &&
  src.includes('TR_DETOUR = { x: VIEW_W * 0.78') &&
  src.includes("'travel.detour'"));

/* ---------- Máquina Balística (compostos → projéteis + boss) ---------- */
const i18nSrc = fs.readFileSync(__dirname + '/i18n.js', 'utf8');
check('save tem registro de compostos e migra saves antigos (compounds = {})',
  run('JSON.stringify(Save.data.compounds)') === '{}');
check('storeCompound grava composto sintetizado e persiste no save',
  run(`
    storeCompound('NA2S');
    Save.data.compounds.NA2S === true &&
    JSON.parse(localStorage.getItem(SAVE_KEY)).compounds.NA2S === true
  `));
check('getAmmoOptions: STD sempre primeiro + só o que foi formado',
  run('JSON.stringify(getAmmoOptions())') === '["STD","NA2S"]');
check('munição desconhecida é rejeitada (química só de receitas reais)',
  run("!storeCompound('XX') && !storeCompound()"));
check('AMMO_TYPES cobre TODAS as receitas + STD, com stats completos',
  run(`
    Object.keys(RECIPES).every(id => AMMO_TYPES[id] &&
      AMMO_TYPES[id].dmg > 0 && AMMO_TYPES[id].cd > 0 &&
      AMMO_TYPES[id].color && AMMO_TYPES[id].formula === RECIPES[id].formula) &&
    AMMO_TYPES.STD.dmg === 1 && AMMO_TYPES.STD.cd > 0
  `));
check('munições dos desvios têm personalidades distintas (leque/perfurante/rajada)',
  run(`
    AMMO_TYPES.CAF2.spread > 1 && AMMO_TYPES.H2O.pierce === true &&
    AMMO_TYPES.N2.pierce === true && AMMO_TYPES.N2.dmg > AMMO_TYPES.STD.dmg &&
    AMMO_TYPES.CH4.cd < AMMO_TYPES.STD.cd
  `));
check('síntese registra o composto na nave (hook na Fusion.complete)',
  src.includes('consumeAtoms(recipe.atoms);') &&
  src.includes('storeCompound(recipe.id);'));
check('completeLevel final abre a Máquina Balística antes da batalha',
  /applyFinalRewards\(\);[\s\S]{0,60}showBallistic\(\);/.test(src));
check('showBallistic prepara overlay e pré-seleciona a melhor munição',
  run(`
    showBallistic();
    Game.phase === 'ballistic' && Game.locked === true &&
    Game.ballistic.sel === 'NA2S'
  `));
check('ballisticFire carrega a munição escolhida e chama a batalha final',
  run("Game.ballistic = { sel: 'N2', token: 1 }; ballisticFire(); Game.ammo.id !== undefined || true") &&
  run('Game.ammo === AMMO_TYPES.N2 && Game.return.ammo === AMMO_TYPES.N2'));
check('boss entra após a frota cair e bloqueia a Terra até ser destruído',
  src.includes('spawnReturnBoss();') &&
  src.includes('function updateReturnBoss') &&
  src.includes('(bo && !bo.dead)') &&
  /bo\.dead\) && !r\.earthReach/.test(src));
check('tiros do herói usam dano/cor/piercing da munição escolhida',
  src.includes('e.hp -= (b.dmg || 1);') &&
  src.includes("b.vx: Math.cos(sa)") === false &&
  /dmg: a\.dmg, pierce: !!a\.pierce, color: a\.color, size: a\.size \|\| 1/.test(src));
check('overlay #ballistic no HTML com slots, estágio e botão',
  html.includes('id="ballistic"') && html.includes('id="ballistic-slots"') &&
  html.includes('id="ballistic-core"') && html.includes('id="ballistic-fire"'));
check('CSS estiliza painel balístico e animação de conversão',
  css.includes('.ballistic-panel') &&
  css.includes('.ballistic-core.charging .ballistic-fill') &&
  css.includes('@keyframes ball-proj-pop'));
check('i18n traduz a Máquina Balística em PT/EN/ES',
  (i18nSrc.match(/'ballistic\.title'/g) || []).length >= 3 &&
  i18nSrc.includes("'Ballistic Machine'") && i18nSrc.includes("'Máquina Balística'"));
check('simulação: frota limpa → boss surge → cai → Terra liberada',
  run(`
    (function () {
      Game.replay = true;                 /* não suja score dos outros checks */
      startReturn();
      var r = Game.return;
      r.spawned = r.fleet; r.enemies = [];   /* frota destruída */
      updateReturn(0.016);
      if (!r.boss || r.boss.dead) return false;
      var guard = 300;
      while (r.boss && !r.boss.dead && guard-- > 0) damageBoss(1);
      if (!r.boss || !r.boss.dead) return false;
      for (var i = 0; i < 160; i++) updateReturn(0.05);   /* colapso ~8s */
      return r.boss === null;
    })()
  `));

/* ---------- 9. Emboscada do boss ao sair dos planetas secretos ---------- */
check('missionDone de desvio inédito abre a Máquina Balística (emboscada)',
  run(`
    (function () {
      Game.replay = false;
      Save.data = Save.defaults();
      Save.save();
      Game.run.score = 0;
      Game.levelTime = 60;
      Game.levelIndex = KINDER_INDEX;
      Game.run.completed = [false, false, false, false, false, false, false];
      missionDone(false);
      return Game.phase === 'ballistic' && Game.ballisticDetour === KINDER_INDEX &&
        document.getElementById('ballistic').hidden === false;
    })()
  `));
check('ballisticFire no desvio inicia a batalha 3D do boss com a munição escolhida',
  run(`
    (function () {
      window.__detourVictory = null;
      window.__detourAmmo = null;
      window.__bossActive = false;
      window.BossBattle = {
        supported: function () { return true; },
        start: function (opts) {
          /* como no módulo real: stop() acontece antes do onVictory */
          window.__detourVictory = function () {
            window.__bossActive = false;
            opts.onVictory();
          };
          window.__detourAmmo = opts.ammo;
          window.__bossVariant = opts.variant;
          window.__bossActive = true;
          return true;
        },
        isActive: function () { return !!window.__bossActive; },
        stop: function () { window.__bossActive = false; }
      };
      Game.ballistic = { sel: 'NA2S', token: 1 };
      ballisticFire();
      return Game.phase === 'boss' && Game.ballisticDetour === null &&
        Game.detourBossIdx === KINDER_INDEX && Game.bossCtx === 'detour' &&
        window.__detourAmmo === AMMO_TYPES.NA2S && Game.ammo === AMMO_TYPES.NA2S &&
        window.__bossVariant === 'kinder';
    })()
  `));
check('vitória na emboscada devolve o fluxo normal do desvio (recompensa + galáxia)',
  run(`
    (function () {
      var rewardEl = document.getElementById('reward');
      window.__detourVictory();
      var ctxClean = Game.bossCtx === null && Game.phase !== 'boss' &&
        Game.detourBossIdx === null && !window.__bossActive;
      return ctxClean && selectedPlanet === SIDE_QUESTS[KINDER_INDEX].next &&
        ((!rewardEl.hidden && pendingLevelComplete === true) || Game.screen === 'galaxy');
    })()
  `));
check('REJOGO do desvio TAMBÉM embosca (todo passe pelo planeta tem boss)',
  run(`
    (function () {
      pendingLevelComplete = false;
      document.getElementById('reward').hidden = true;
      document.getElementById('ballistic').hidden = true;
      Game.replay = true;
      Save.data.completed[KINDER_INDEX] = true;
      Game.run.completed[KINDER_INDEX] = true;
      Game.levelIndex = KINDER_INDEX;
      missionDone(false);
      var ambushedAgain = Game.phase === 'ballistic' &&
        Game.ballisticDetour === KINDER_INDEX &&
        document.getElementById('ballistic').hidden === false;
      /* dispara e vence o boss do rejogo para limpar o estado */
      window.__bossVariant = null;
      Game.level = buildLevel(KINDER_INDEX);
      Game.screen = 'game';
      Game.ballistic = { sel: 'STD', token: 1 };
      ballisticFire();
      var variantOk = window.__bossVariant === 'kinder';
      window.__detourVictory();
      return ambushedAgain && variantOk &&
        Game.screen === 'galaxy' && Game.detourBossIdx === null;
    })()
  `));
check('sem WebGL a emboscada é pulada sem travar (conclusão normal)',
  run(`
    (function () {
      window.BossBattle = undefined;
      Game.replay = true;
      Game.levelIndex = BUENO_INDEX;
      missionDone(false);
      var openedBallistic = Game.ballisticDetour === BUENO_INDEX;
      Game.ballistic = { sel: 'STD', token: 1 };
      ballisticFire();
      return openedBallistic && Game.screen === 'galaxy' &&
        Game.detourBossIdx === null && selectedPlanet === SIDE_QUESTS[BUENO_INDEX].next;
    })()
  `));
check('exitToMenu limpa o estado da emboscada',
  run(`
    (function () {
      Game.ballisticDetour = KINDER_INDEX;
      Game.detourBossIdx = KINDER_INDEX;
      Game.bossCtx = 'detour';
      exitToMenu();
      return Game.ballisticDetour === null && Game.detourBossIdx === null &&
        Game.bossCtx === null;
    })()
  `));

/* ---------- 10. Fases principais NÃO têm boss + bosses diferentes ---------- */
check('missionDone de fase PRINCIPAL parte direto, SEM emboscada',
  run(`
    (function () {
      window.BossBattle = undefined;
      Save.data = Save.defaults();
      Game.replay = false;
      Game.run.completed = [false, false, false, false, false, false, false];
      Game.run.score = 0;
      Game.levelTime = 60;
      Game.levelIndex = IONIC_INDEX;
      Game.level = buildLevel(IONIC_INDEX);
      Game.screen = 'game';
      pendingLevelComplete = false;
      missionDone(false);
      return Game.phase !== 'ballistic' && Game.ballisticDetour === null &&
        (!!Game.departure || !!Game.travel || Game.screen === 'galaxy');
    })()
  `));
check('cada desvio enfrenta uma variação DIFERENTE do Devorador (iônica × covalente)',
  run(`
    (function () {
      window.__seenVariants = [];
      window.__bossActive = false;
      window.BossBattle = {
        supported: function () { return true; },
        start: function (opts) {
          window.__seenVariants.push(opts.variant);
          window.__detourVictory = opts.onVictory;
          window.__bossActive = true;
          return true;
        },
        isActive: function () { return !!window.__bossActive; },
        stop: function () { window.__bossActive = false; }
      };
      /* pré-desbloqueia itens de recompensa para evitar popup */
      Save.data = Save.defaults();
      if (!Save.hasItem('h_esmeralda')) Save.unlockItem('h_esmeralda');
      if (!Save.hasItem('s_prisma'))    Save.unlockItem('s_prisma');
      /* Bueno */
      Game.replay = true;
      Save.data.completed[BUENO_INDEX] = true;
      Game.run.completed[BUENO_INDEX] = true;
      Game.levelIndex = BUENO_INDEX;
      Game.level = buildLevel(BUENO_INDEX);
      Game.screen = 'game';
      missionDone(false);
      Game.ballistic = { sel: 'STD', token: 1 };
      ballisticFire();
      if (Game.phase !== 'boss') return false;
      window.__detourVictory();
      /* Kinder */
      Game.levelIndex = KINDER_INDEX;
      Game.level = buildLevel(KINDER_INDEX);
      missionDone(false);
      Game.ballistic = { sel: 'STD', token: 1 };
      ballisticFire();
      if (Game.phase !== 'boss') return false;
      window.__detourVictory();
      window.__bossActive = false;
      var v = window.__seenVariants;
      return v.length === 2 && v[0] === 'bueno' && v[1] === 'kinder' &&
        v[0] !== v[1] && Game.screen === 'galaxy';
    })()
  `));
check('batalha FINAL não recebe variação (Devorador Estelar clássico)',
  (() => {
    const srcMain = fs.readFileSync(__dirname + '/script.js', 'utf8');
    return srcMain.includes("variant:") && srcMain.includes("ctx === 'detour'") &&
      srcMain.includes("KINDER_INDEX ? 'kinder'") &&
      srcMain.includes("BUENO_INDEX ? 'bueno'") &&
      srcMain.includes(": undefined");
  })());
check('boss3d define variações com paletas, falas e ajustes de ataque próprios',
  (() => {
    const src = fs.readFileSync(__dirname + '/boss3d.js', 'utf8');
    return src.includes('var VARIANTS =') &&
      src.includes("objKey: 'boss.objective.kinder'") &&
      src.includes("objKey: 'boss.objective.bueno'") &&
      src.includes('introKey:') && src.includes('tweak:') &&
      src.includes('buildPhases(vr)') &&
      src.includes('st.phases[b.phase]') &&
      src.includes('buildBoss(vr)') &&
      src.includes('st.vr ? st.vr.rageA : 0x5a1020');
  })());

/* ---------- resultado ---------- */
if (failures) {
  console.error('\nSMOKE_FAIL (' + failures + ' falha(s))');
  process.exit(1);
}
console.log('\nSMOKE_OK');
