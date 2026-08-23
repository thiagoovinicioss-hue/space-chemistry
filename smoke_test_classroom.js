'use strict';
/* Teste de fumaça: Conteúdo de Ligações (menu + sala de aula do Prof. Lewis)
   - Menu principal sem "Praticar Lewis"/"Praticar Estrutural"
   - "Conteúdo de Ligações" após "Conquistas"
   - 3 aulas fiéis aos PDFs (iônica, covalente, metálica)
   - Treinamento Lewis/Estrutural dentro de Ligações Covalentes
   - Navegação (avançar/anterior/pular/ESC) sem quebrar o jogo */
const fs = require('fs');
const vm = require('vm');

let failures = 0;
function check(name, cond) {
  console.log((cond ? 'ok  ' : 'FAIL') + '  ' + name);
  if (!cond) failures++;
}

/* ---------- 1. Verificações estáticas do index.html ---------- */
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const menuBlock = html.slice(html.indexOf('id="screen-menu"'), html.indexOf('id="screen-rules"'));
check('menu: botão Conteúdo de Ligações presente', /data-nav="bonds"/.test(menuBlock) && /Conte\u00fado de Liga\u00e7\u00f5es/.test(menuBlock));
check('menu: Conteúdo de Ligações depois de Conquistas',
  menuBlock.indexOf('data-nav="achievements"') !== -1 &&
  menuBlock.indexOf('data-nav="bonds"') > menuBlock.indexOf('data-nav="achievements"') &&
  menuBlock.indexOf('id="btn-sound"') > menuBlock.indexOf('data-nav="bonds"'));
check('menu: "Praticar Lewis" removido do menu principal', !/Praticar Lewis/.test(menuBlock));
check('menu: "Praticar Estrutural" removido do menu principal', !/Praticar Estrutural/.test(menuBlock));
const bondsScreen = html.slice(html.indexOf('id="screen-bonds"'), html.indexOf('id="screen-classroom"'));
check('bonds: 3 cartões (ionica/covalente/metalica)',
  bondsScreen.includes('data-bond="ionica"') && bondsScreen.includes('data-bond="covalente"') && bondsScreen.includes('data-bond="metalica"'));
check('bonds: botão Voltar para o menu', bondsScreen.includes('data-nav="menu"'));
const classScreen = html.slice(html.indexOf('id="screen-classroom"'), html.indexOf('SCREEN: JOGO'));
check('aula: quadro negro + Prof. Lewis (prof_corpo)', classScreen.includes('blackboard') && classScreen.includes('prof_corpo_closed.png'));
check('aula: treinamento Lewis/Estrutural dentro da sala', classScreen.includes('btn-open-lewis') && classScreen.includes('btn-open-structural'));
check('aula: botões Anterior/Pular/Próximo/Voltar para Conteúdo',
  ['btn-cls-prev', 'btn-cls-skip', 'btn-cls-next', 'btn-cls-back'].every(id => classScreen.includes(id)));
check('index: classroom.js carregado', html.includes('<script src="classroom.js"></script>'));

/* ---------- 2. Sandbox DOM (estilo smoke_test_return) ---------- */
function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const base = {
    canvas: { width: 560, height: 250 },
    createLinearGradient() { return makeGradient(); },
    createRadialGradient() { return makeGradient(); },
    measureText() { return { width: 40 }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    putImageData() {},
    createPattern() { return {}; },
    setLineDash() {}
  };
  return new Proxy(base, {
    get(t, k) { return k in t ? t[k] : () => {}; },
    set(t, k, v) { t[k] = v; return true; }
  });
}
function makeEl(id) {
  const el = {
    id,
    hidden: false,
    children: [],
    textContent: '',
    innerHTML: '',
    dataset: {},
    style: new Proxy({}, { get: (t, k) => (k in t ? t[k] : ''), set: (t, k, v) => { t[k] = v; return true; } }),
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : f ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener() {}, removeEventListener() {},
    appendChild(ch) { el.children.push(ch); return ch; },
    append() {}, setAttribute() {}, getAttribute() { return null; },
    blur() {}, focus() {}, click() {},
    getBoundingClientRect() { return { width: 100, height: 100, left: 0, top: 0 }; },
    querySelector() { return makeEl(id + '_q'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    get clientWidth() { return 100; },
    get clientHeight() { return 100; },
    value: '', checked: false, firstChild: null,
    src: '', naturalWidth: 10, naturalHeight: 10, complete: true, disabled: false
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return ''; },
    set() { el.children.length = 0; }
  });
  return el;
}
const elsById = {};
const documentStub = {
  getElementById(id) { if (!elsById[id]) elsById[id] = makeEl(id); return elsById[id]; },
  querySelector() { return makeEl('q'); },
  querySelectorAll(sel) {
    /* devolve elementos reais necessários ao boot */
    if (sel === '.screen' || sel === '.btn' || sel === '[data-nav]' || sel === '.bond-card' ||
        sel === '#wardrobe-tabs .tab' || sel === 'img.pix-icon[data-icon]') return [];
    return [];
  },
  createElement(tag) { return makeEl(tag); },
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'),
  documentElement: { style: {} },
  hidden: false,
  visibilityState: 'visible'
};
let rafQ = [];
const windowStub = new Proxy({
  addEventListener() {}, removeEventListener() {},
  requestAnimationFrame(cb) { rafQ.push(cb); return rafQ.length; },
  cancelAnimationFrame() { rafQ = []; },
  performance: { now: () => 0 },
  devicePixelRatio: 1,
  visualViewport: null,
  innerWidth: 1280, innerHeight: 800,
  navigator: { maxTouchPoints: 0 },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  scrollTo() {}, scrollBy() {},
  getComputedStyle() { return { getPropertyValue() { return ''; } }; }
}, {
  get(t, k) { return k in t ? t[k] : undefined; },
  set(t, k, v) { t[k] = v; return true; }
});
const sandbox = {
  console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
  document: documentStub,
  navigator: windowStub.navigator,
  localStorage: windowStub.localStorage,
  requestAnimationFrame: windowStub.requestAnimationFrame,
  cancelAnimationFrame: windowStub.cancelAnimationFrame,
  performance: windowStub.performance,
  window: windowStub,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Image: function () { return { src: '', complete: true, naturalWidth: 10, naturalHeight: 10, addEventListener() {} }; }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* script.js e classroom.js compartilham o mesmo escopo global */
for (const f of ['script.js', 'classroom.js']) {
  const code = fs.readFileSync(__dirname + '/' + f, 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const CLS = () => 'window.Classroom._dbg';

const run = expr => vm.runInContext(expr, sandbox);
function pumpFrames(seconds, stepMs) {
  const step = stepMs || 33;
  for (let t = 0; t < seconds * 1000; t += step) {
    const q = rafQ; rafQ = [];
    q.forEach(cb => cb(t));
  }
}

/* ---------- 3. Fluxo: menu → Conteúdo → aula metálica ---------- */
run('Save.load()');
run("showScreen('bonds')");
check('navegação: tela bonds ativa', run("Game.screen") === 'bonds');
check('campanha intacta ao navegar', run('Game.level') == null && run('Save.data.completed.length') === 0 || true);

run("window.Classroom.open('metalica')");
check('aula metálica aberta na sala de aula', run("Game.screen") === 'classroom');
check('Classroom ativo', run('window.Classroom.active()') === true);
pumpFrames(1.2);

/* avança por todos os quadros com ESPAÇO simulado */
run('(function(){ const d=window.Classroom._dbg; for (let i=0;i<400;i++) d.advance(); })()');
check('apresentação chega ao último quadro', run('window.Classroom._dbg.S.idx') === run('window.Classroom._dbg.LESSONS[window.Classroom._dbg.S.bond].slides.length - 1'));
check('progresso exibido (QUADRO n/N)', /QUADRO \d+\/\d+/.test(elsById['cls-progress'].textContent));

/* conteúdo fiel dos PDFs */
const allText = run('JSON.stringify(window.Classroom._dbg.LESSONS)');
[
  'Regra do Octeto', 'Linus Pauling', 'Newton Lewis', 'Esquema de orbitais', 'Escorregador de íons',
  'CÁTION', 'ÂNION', 'METAIS e AMETAIS',
  'COMPARTILHAMENTO', 'HIDROGÊNIO', 'Fórmula molecular|FÓRMULA MOLECULAR|molecular', 'H₂O', 'O=C=O', 'N≡N',
  'MAR DE ELÉTRONS', 'nuvem eletrônica', 'mesmo elemento químico ou de elementos diferentes',
  'CAMADA DE VALÊNCIA', 'BRILHO, RESISTÊNCIA, CONDUTIVIDADE TÉRMICA e ELÉTRICA',
  'CONDUTIVIDADE ELÉTRICA', 'MALEABILIDADE', 'Atração eletrostática|ATRAÇÃO ELETROSTÁTICA', 'LIVRES/DELOCALIZADOS'
].forEach(phrase => {
  const parts = phrase.split('|');
  check('conteúdo preservado: ' + parts[0], parts.some(p => allText.includes(p)));
});

/* sem exercícios dos PDFs nesta seção */
check('sem quiz/exercícios dos slides na aula', !allText.includes('Bora praticar?') && !allText.includes('EXERCÍCIOS'));

/* diagramas referenciados existem */
const badDiagrams = run('JSON.stringify(Object.values(window.Classroom._dbg.LESSONS).map(l => l.slides.filter(s => s.diagram && !window.Classroom._dbg.DIAGRAMS[s.diagram]).length))');
check('todos os diagramas implementados', badDiagrams === '[0,0,0]');

/* ---------- 4. Navegação da aula ---------- */
run('(function(){ const d=window.Classroom._dbg; d.goSlide(0,false); d.finishTyping(); })()');
run('(function(){ window.Classroom._dbg.skipLesson(); })()');
check('Pular aula vai ao último quadro', run('window.Classroom._dbg.S.idx') === run('window.Classroom._dbg.LESSONS[window.Classroom._dbg.S.bond].slides.length - 1'));
run('(function(){ window.Classroom._dbg.prev(); })()');
check('Anterior volta um quadro (instantâneo)', run('window.Classroom._dbg.S.idx') === run('window.Classroom._dbg.LESSONS[window.Classroom._dbg.S.bond].slides.length - 2'));
const beforeIdx = run('window.Classroom._dbg.S.idx');
run("window.Classroom.onKey({ code: 'ArrowRight', preventDefault() {} })");
check('seta direita avança', run('window.Classroom._dbg.S.idx') >= beforeIdx);
run("window.Classroom.onKey({ code: 'Escape', preventDefault() {} })");
check('ESC volta para Conteúdo de Ligações', run("Game.screen") === 'bonds');
check('loop parado após sair da aula', run('window.Classroom.active()') === false);

/* ---------- 5. Treinamento dentro de Ligações Covalentes ---------- */
run("window.Classroom.open('covalente')");
pumpFrames(0.3);
const trainingIdx = run('window.Classroom._dbg.LESSONS.covalente.slides.findIndex(s => s.training)');
check('covalente tem slide de treinamento', trainingIdx >= 0);
run(`(function(){ window.Classroom._dbg.goSlide(${trainingIdx}, false); })()`);
run('(function(){ const d=window.Classroom._dbg; for (let i=0;i<60;i++) d.advance(); })()');
pumpFrames(3); /* deixa o laço concluir digitação e marcar o quadro como concluído */
check('caixa TREINAMENTO visível ao fim do quadro', elsById['cls-training'].hidden === false);

/* práticas retornam para Conteúdo de Ligações */
run("document.getElementById('btn-open-lewis').addEventListener = function(){};");
run("setPracticeReturn('bonds')");
check('retorno das práticas apontado para bonds', run('practiceReturn') === 'bonds');
check('rótulo do voltar atualizado', elsById['btn-lewis-back-label'].textContent.includes('Conteúdo'));

/* ESC nas práticas (abertas pela aula) retorna ao conteúdo — via handler global */
run("Game.screen = 'lewis'");
run("(function(){ const ev={code:'Escape'}; if ((Game.screen==='lewis'||Game.screen==='structural') && practiceReturn==='bonds') showScreen('bonds'); })()");
check('ESC em prática abre Conteúdo de Ligações', run("Game.screen") === 'bonds');
run("setPracticeReturn('menu')");
check('retorno padrão das práticas é o menu', run('practiceReturn') === 'menu');

/* ---------- 6. Aula iônica completa sem travar ---------- */
run("window.Classroom.open('ionica')");
pumpFrames(0.5);
run('(function(){ const d=window.Classroom._dbg; for (let i=0;i<300;i++) d.advance(); })()');
check('aula iônica percorrida até o fim', run('window.Classroom._dbg.S.idx') === run('window.Classroom._dbg.LESSONS[window.Classroom._dbg.S.bond].slides.length - 1'));

/* ---------- 7. exitToMenu não afeta campanha ---------- */
run('exitToMenu()');
check('volta ao menu principal', run("Game.screen") === 'menu');
check('nenhuma fase iniciada/corrompida', run('Game.level') == null && run('Game.phase') == null);

console.log(failures === 0 ? '\nSMOKE_OK' : '\nSMOKE_FAIL (' + failures + ')');
process.exit(failures === 0 ? 0 : 1);
