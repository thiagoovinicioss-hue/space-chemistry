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
  return {
    id,
    hidden: false,
    style: new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => { t[k] = v; return true; }
    }),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { children.push(c); return c; },
    append() {}, setAttribute() {},
    getBoundingClientRect() { return { width: 0, height: 0, left: 0, top: 0 }; },
    querySelector() { return makeEl(id + '_q'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    get clientWidth() { return 0; },
    get clientHeight() { return 0; },
    textContent: '', innerHTML: '', value: '', checked: false, dataset: {},
    children, firstChild: null
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

const sandbox = {
  console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
  document, navigator,
  addEventListener() {}, requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  performance: { now: () => 0 },
  devicePixelRatio: 1,
  visualViewport: null,
  innerWidth: 800, innerHeight: 600,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  setTimeout, clearTimeout, setInterval, clearInterval
};
/* No navegador `window` É o objeto global; espelhar isso para que
   window.Exercise / window.EXERCISE_LEVELS fiquem acessíveis no teste. */
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const load = file => vm.runInContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), sandbox, { filename: file });
load('script.js');
load('questions.js');
load('exercises.js');
const run = expr => vm.runInContext(expr, sandbox);

/* --- 1. Módulo carregado e completo --- */
const levels = run('EXERCISE_LEVELS.length');
const types = run('Object.keys(EXERCISE_TYPES).length');
const hasApi = run('typeof Exercise === "object" && typeof Exercise.start === "function" && typeof Exercise.confirm === "function"');
console.log('niveis de exercicios (5 fases):', levels);
console.log('tipos de exercicio registrados:', types);
console.log('API Exercise presente:', hasApi);

/* --- 2. Fase 0 com exercícios deve abrir o desafio em vez do quiz --- */
run(`
Game.screen = 'game';
Game.levelIndex = 0;
Game.replay = false;
Game.level = { quizDone: false, exerciseDone: false, gatesDone: true,
               recipeIndex: 0, lv: { recipes: [{ id: 'r0' }], gateSequence: null } };
Game.recipeIndex = 1;
Game.run.score = 100;
Game.run.wrong = 0;
maybeEndLevel();
`);
const openedChallenge = run('Game.phase === "challenge" && Game.locked === true');
const overlayShown = run('document.getElementById("exercise").hidden === false');
const flagsSet = run('Game.level.quizDone === true && Game.level.exerciseDone === true');
const scoreUI = run('Game.exerciseStats.total === 4');
const hasChalk = run('typeof EXERCISE_TYPES.chalkboard === "object" && EXERCISE_TYPES.chalkboard.grade && ' +
  'EXERCISE_LEVELS[0].some(i => i.type === "chalkboard") && EXERCISE_LEVELS[1].some(i => i.type === "chalkboard") && ' +
  'EXERCISE_LEVELS[2].some(i => i.type === "chalkboard") && EXERCISE_LEVELS[3].some(i => i.type === "chalkboard") && ' +
  'EXERCISE_LEVELS[4].some(i => i.type === "chalkboard")');
console.log('abre desafio (phase challenge):', openedChallenge);
console.log('overlay #exercise visivel:', overlayShown);
console.log('flags quizDone/exerciseDone marcados:', flagsSet);
console.log('sessao com 4 desafios:', scoreUI);
console.log('tipo chalkboard + itens em todas as fases:', hasChalk);

/* --- 3. Responder errado (vazio) -> feedback de erro, sem pontos --- */
const beforeScore = run('Game.exerciseStats.score');
run('Exercise.confirm()');
const wrongFeedback = run('!document.getElementById("ex-explain").hidden && Game.exerciseStats.score === ' + beforeScore);
console.log('resposta vazia gera erro sem pontuar:', wrongFeedback);

/* --- 4. Acertar a múltipla escolha (item 1: octeto) ---
   Após 1 tentativa errada (vazia), o acerto vale metade (50). */
run('Exercise.selectChoice(1)');
run('Exercise.confirm()');
const gradedOk = run('Game.exerciseStats.correct === 1 && Game.exerciseStats.score === ' + (beforeScore + 50) + ' && Game.run.score === 150');
console.log('acerto pontua (meia apos erro) stats + run:', gradedOk);
const nextVisible = run('document.getElementById("btn-ex-next").hidden === true');
const answeredState = run('Exercise.answered === true');
console.log('estado answered apos confirmar:', answeredState);

/* --- 5. Concluir a sessão inteira (3 itens) via next() --- */
run('Exercise.next()');
const onItem2 = run('Exercise.idx === 1');
run('Exercise.clear()');                       /* sem crash em tipo electrons */
const clearedOk = run('Exercise.answered === false || Exercise.idx === 1');
console.log('avanca para o desafio 2:', onItem2, '| limpar funcionou:', clearedOk);

/* --- 5B. Quadro de Química: item 4 da fase 0 (chalkboard) ---
   Navega direto para o item chalkboard e desenha traços de giz azul
   cobrindo a região-alvo (camada de valência do O). */
run(`
Exercise.idx = 3;
Exercise.show();
`);
const isChalk = run('Exercise.session[3].type === "chalkboard" && Exercise.x.state.strokes.length === 0');
run(`
var s = Exercise.x.state;
var cx = 230, cy = 174, cr = 74;
for (var y = cy - cr; y <= cy + cr; y += 16) {
  s.strokes.push({ mode: 'chalk', color: '#4a9aff', r: 11, pts: [
    { x: cx - cr, y: y }, { x: cx + cr, y: y }
  ]});
}
Exercise.confirm();
`);
const chalkCorrect = run('Exercise.answered === true && Game.exerciseStats.correct === 2');
const chalkScoreUp = run('Game.exerciseStats.score > 0 && Game.run.score > 150');
console.log('item chalkboard presente:', isChalk);
console.log('desenho com giz correto pontua:', chalkCorrect, chalkScoreUp);

/* --- 5C. Cor errada no quadro não pontua --- */
run(`
Game.exerciseStats.correct = 0;
Game.exerciseStats.score = 0;
Game.run.score = 100;
Exercise.idx = 3;
Exercise.answered = false;
Exercise.show();
var s = Exercise.x.state;
var cx = 230, cy = 174, cr = 74;
for (var y = cy - cr; y <= cy + cr; y += 16) {
  s.strokes.push({ mode: 'chalk', color: '#ff5d6c', r: 11, pts: [
    { x: cx - cr, y: y }, { x: cx + cr, y: y }
  ]});
}
Exercise.confirm();
`);
const chalkWrongColor = run('Game.exerciseStats.correct === 0 && Game.run.wrong > 0');
console.log('giz de cor errada reprova:', chalkWrongColor);

/* --- 5D. Transferência de elétrons: clique e arrasto reconhecidos ---
   Bug corrigido: transferTap chamava dist com os argumentos trocados, então o
   clique/arrasto nunca acertava o elétron do metal. Agora existe seleção +
   arrasto (down/move/up). */
run(`
Game.exerciseStats = { correct: 0, total: 1, score: 0 };
Exercise.session = [{
  type: 'transfer',
  donor: { el: 'Na', valence: 1, label: 'Sódio (metal)' },
  acceptor: { el: 'Cl', valence: 7, label: 'Cloro (ametal)' },
  need: 1, explain: 'x', pts: 100
}];
Exercise.idx = 0;
Exercise.answered = false;
Exercise.show();
`);
const transferApi = run('typeof Exercise.transferDown === "function" && typeof Exercise.transferMove === "function" && typeof Exercise.transferUp === "function"');
run(`
var s = Exercise.x.state;
var d = s.donorDots[0];
Exercise.transferDown(Exercise.session[0], { x: d.x, y: d.y });
Exercise.transferUp(Exercise.session[0], { x: d.x, y: d.y });
`);
const transferClickOk = run('Exercise.x.state.moved.length === 1');
run(`
Exercise.x.state.moved = [];
Exercise.x.state.donorDots = [{ x: 138, y: 116, i: 0, moved: false }];
Exercise.transferDown(Exercise.session[0], { x: 138, y: 116 });
Exercise.transferMove(Exercise.session[0], { x: 220, y: 140 });
Exercise.transferUp(Exercise.session[0], { x: 322, y: 156 });
`);
const transferDragOk = run('Exercise.x.state.moved.length === 1');
const transferGraded = run('EXERCISE_TYPES.transfer.grade(Exercise.session[0], [0]) === true');
console.log('transfer: API de clique+arrasto presente:', transferApi);
console.log('transfer: clique no elétron transfere:', transferClickOk);
console.log('transfer: arrastar o elétron até o cloro transfere:', transferDragOk);
console.log('transfer: grade reconhece o elétron transferido:', transferGraded);

/* --- 5E. Estruturas: toque na âncora reconhecido (mesmo bug do dist) --- */
run(`
Game.exerciseStats = { correct: 0, total: 1, score: 0 };
Exercise.session = [{
  type: 'structure',
  anchors: [{ x: 0.5, y: 0.55, el: 'O', label: 'O' }],
  bonds: [], tray: ['H', 'O'], explain: 'x', pts: 100
}];
Exercise.idx = 0;
Exercise.answered = false;
Exercise.show();
Exercise.x.state.picked = 'O';
Exercise.structureTap(Exercise.session[0], { x: 230, y: 165 });
`);
const structureTapOk = run('Exercise.x.state.placements[0] === "O"');
console.log('structure: toque na âncora posiciona o elemento:', structureTapOk);

/* --- 6. Fase sem exercícios continua usando o quiz --- */
run(`
Game.levelIndex = 4;
Game.level = { quizDone: false, exerciseDone: false, gatesDone: true,
               lv: { recipes: [{ id: 'rX' }], gateSequence: null } };
Game.recipeIndex = 1;
EXERCISE_LEVELS[4] = [];
maybeEndLevel();
`);
const quizFallback = run('Game.phase === "quiz"');
console.log('fase sem exercicios cai no quiz:', quizFallback);

if (!(hasApi && openedChallenge && overlayShown && flagsSet && scoreUI &&
      wrongFeedback && gradedOk && onItem2 && clearedOk && quizFallback &&
      hasChalk && isChalk && chalkCorrect && chalkScoreUp && chalkWrongColor &&
      transferApi && transferClickOk && transferDragOk && transferGraded &&
      structureTapOk)) {
  console.error('SMOKE_FAIL');
  process.exit(1);
}
console.log('SMOKE_OK');
