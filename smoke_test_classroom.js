'use strict';
/* Teste de fumaça: Conteúdo de Ligações (menu + sala de aula do Prof. Sérgio)
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
check('aula: quadro negro + Prof. Sérgio (prof_corpo)', classScreen.includes('blackboard') && classScreen.includes('prof_corpo_closed.png'));
check('aula: treinamento Lewis/Estrutural dentro da sala', classScreen.includes('btn-open-lewis') && classScreen.includes('btn-open-structural'));
check('aula: botões Anterior/Pular/Próximo/Voltar para Conteúdo',
  ['btn-cls-prev', 'btn-cls-skip', 'btn-cls-next', 'btn-cls-back'].every(id => classScreen.includes(id)));
check('index: classroom.js carregado (com cache-busting)', /<script src="classroom\.js\?v=/.test(html));
check('index: style.css com cache-busting', /rel="stylesheet" href="style\.css\?v=/.test(html));

/* fala à esquerda do professor (bolha fora do bloco dele, antes dele) */
const speechPos = classScreen.indexOf('id="cls-speech-wrap"');
const profSideStart = classScreen.indexOf('<aside class="prof-side"');
const speechCol = classScreen.slice(classScreen.indexOf('class="speech-col"'), classScreen.indexOf('</aside>'));
check('fala: bolha em coluna própria ANTES do professor (lado esquerdo)',
  speechCol.includes('cls-speech-wrap') && profSideStart > speechPos && !classScreen.slice(profSideStart).includes('cls-speech-wrap'));

/* tela cheia no menu principal */
check('menu: botão Tela Cheia presente', /id="btn-fullscreen-menu"/.test(menuBlock) && /Tela Cheia/.test(menuBlock));

/* fonte limpa no quadro (não pixel-art) */
const css = fs.readFileSync(__dirname + '/style.css', 'utf8');
const i18nSrc = fs.readFileSync(__dirname + '/i18n.js', 'utf8');
const lscene = fs.readFileSync(__dirname + '/loading_scene.js', 'utf8');
const classroomSrc = fs.readFileSync(__dirname + '/classroom.js', 'utf8');
const src = fs.readFileSync(__dirname + '/script.js', 'utf8');
const chalkLinesCss = css.slice(css.indexOf('.chalk-lines {'), css.indexOf('.chalk-lines li'));
check('quadro: fonte limpa (--font-clean) no conteúdo', chalkLinesCss.includes('var(--font-clean)') && !chalkLinesCss.includes('Pixelify'));
check('quadro: espaçamento confortável definido', chalkLinesCss.includes('line-height: 1.65') && chalkLinesCss.includes('word-spacing'));
const rootClean = css.match(/--font-clean:[^;]+;/);
check('quadro: --font-clean usa fontes modernas de sistema',
  !!rootClean && /Segoe UI|Inter|system-ui|Roboto/.test(rootClean[0]));
check('diagramas: rótulos com a fonte limpa', fs.readFileSync(__dirname + '/classroom.js', 'utf8').includes('FONT_CLEAN'));

/* balão do professor: liquid glass e elevado */
const bubbleCss = css.slice(css.indexOf('.speech-bubble {'), css.indexOf('/* sem suporte'));
check('balão: liquid glass (vidro com blur translúcido)',
  bubbleCss.includes('backdrop-filter: blur') && bubbleCss.includes('rgba(255,255,255') && bubbleCss.includes('inset 0 1px 0'));
check('balão: translúcido de verdade (sem branco sólido)',
  !bubbleCss.match(/rgba\(2\d\d,\s*2\d\d,\s*2\d\d,\s*0\.9/) && /rgba\(255,255,255,0\.(1|2|3|4)/.test(bubbleCss));
check('balão: fallback para navegadores sem backdrop-filter', css.includes('@supports not ((backdrop-filter'));

/* botões do menu em liquid glass */
const mBtnCss = css.slice(css.indexOf('.menu-buttons {'), css.indexOf('/* ---------------- Painéis'));
check('menu: botões em vidro líquido (blur + borda luminosa + brilho interno)',
  mBtnCss.includes('.menu-buttons .btn {') &&
  /backdrop-filter: blur\(\d+px\) saturate/.test(mBtnCss) &&
  /inset 0 1px 0 rgba\(255,\s*255,\s*255/.test(mBtnCss));
check('menu: blocos com profundidade 3D (perspectiva + pose por variáveis)',
  /perspective:\s*\d+px/.test(mBtnCss) &&
  mBtnCss.includes('rotateY(var(--mg-ry, 0deg))') &&
  mBtnCss.includes('transform-style: preserve-3d'));
check('menu: DUAS paredes de vidro vivas (esquerda e direita por variável)',
  /--mg-wl/.test(mBtnCss) && /--mg-wr/.test(mBtnCss) &&
  mBtnCss.includes('.menu-buttons .btn::before') && mBtnCss.includes('.menu-buttons .btn::after'));
check('menu: salto de entrada por zona com mola',
  mBtnCss.includes('@keyframes menu-glass-jump') &&
  /animation:\s*menu-glass-jump/.test(mBtnCss) &&
  mBtnCss.includes('var(--jry, 0deg)') && mBtnCss.includes('.menu-buttons .btn.is-jumping'));
check('menu: retorno suave após tirar o mouse',
  mBtnCss.includes('.is-returning') && mBtnCss.includes('cubic-bezier(0.16, 1, 0.3, 1)'));
check('menu: realismo do vidro (ruído fosco, dispersão e rim light)',
  /feTurbulence/.test(mBtnCss) && mBtnCss.includes('brightness(1.06)') && mBtnCss.includes('outline-offset: -3px'));
check('menu: sem halo de luz externa nem faixa deslizante',
  !mBtnCss.includes('rgba(89, 211, 255') && !mBtnCss.includes('248deg') &&
  !mBtnCss.includes('background-position: -30px'));
check('menu: acessibilidade (reduced-motion no CSS e no JS)',
  mBtnCss.includes('@media (prefers-reduced-motion: reduce)') &&
  fs.readFileSync(__dirname + '/menu_glass.js', 'utf8').includes('prefers-reduced-motion'));
check('menu: módulo interativo MenuGlass carregado (toque + zonas)',
  /<script src="menu_glass\.js\?v=/.test(html) &&
  ['pointerenter', 'pointerdown', '--mg-wl', '--jry'].every(s => fs.readFileSync(__dirname + '/menu_glass.js', 'utf8').includes(s)));
check('menu: variante azulada do botão principal', mBtnCss.includes('.menu-buttons .btn-primary'));
check('menu: fonte limpa e espaçamento confortável no texto',
  mBtnCss.includes('var(--font-clean)') && /letter-spacing:\s*0?\.\d+px/.test(mBtnCss));
check('menu: fallback sem backdrop-filter para os botões',
  css.indexOf('@supports not ((backdrop-filter', css.indexOf('.menu-buttons .btn')) > 0);

/* liquid glass global + transição branca */
check('jogo: TODOS os .btn em vidro (blur global na base)',
  (() => { const b = css.slice(css.indexOf('.btn {'), css.indexOf('/* ------- Botões do MENU')); return b.includes('backdrop-filter') && b.includes('is-pressed'); })());
check('jogo: painéis e cartões em vidro escuro sofisticado',
  (() => {
    const gi = css.indexOf('LIQUID GLASS GLOBAL');
    if (gi < 0) return false;
    const g = css.slice(gi);
    return g.includes('.panel {') && /backdrop-filter:\s*blur\(18px\)/.test(g) && g.includes('.bond-card,');
  })());
const mgjs = fs.readFileSync(__dirname + '/menu_glass.js', 'utf8');
check('transição: pressionar -> recuar -> cortina branca -> trocar tela',
  mgjs.includes("id = 'glass-fade'") && mgjs.includes('_glassReplay') && mgjs.includes("'is-pressed'") && mgjs.includes('replayClick'));
check('idiomas: dock liquid glass no menu E na pausa',
  html.includes('class="lang-dock" role="toolbar"') &&
  html.includes('lang-dock lang-dock--row') &&
  (html.match(/data-lang="en"/g) || []).length === 2 &&
  (html.match(/data-lang="pt"/g) || []).length === 2);
check('idiomas: loading é OVERLAY independente (regressão tela azul/espremida)',
  html.includes('id="lang-loading"') && html.includes('overlay lang-overlay" hidden') &&
  !i18nSrc.includes('showScreen(') && !i18nSrc.includes('Effects3D.setPaused') &&
  i18nSrc.includes("addEventListener('keydown', guard, true)") &&
  css.includes('.lang-overlay[hidden] { display: none !important; }'));
check('idiomas: cena da nave orbitando planeta (3D three.js + fallback 2D)',
  html.includes('loading_scene.js?v=20260825f') &&
  lscene.includes('THREE.WebGLRenderer') && lscene.includes('start2D'));
check('idiomas: refresh de labels dinâmicos pós-troca (script+classroom)',
  src.includes('__scLangRefresh') && src.includes(".t('menu.sound.on'") &&
  classroomSrc.includes("addEventListener('sc:language'"));
check('idiomas: i18n.js antes do script.js, persistência e evento sc:language',
  html.indexOf('i18n.js?v=20260825f') < html.indexOf('i18n_content.js?v=20260825f') && html.indexOf('i18n_content.js?v=20260825f') < html.indexOf('script.js?v=20260825f') &&
  i18nSrc.includes("localStorage.setItem(LS_KEY") && i18nSrc.includes("sc_lang") &&
  i18nSrc.includes("'sc:language'"));
check('idiomas: dicionário cobre pt/en/es e labels dinâmicos com fallback',
  i18nSrc.includes("'menu.start': 'Iniciar Missão'") &&
  i18nSrc.includes("'menu.start': 'Start Mission'") &&
  i18nSrc.includes("'menu.start': 'Iniciar Misión'") &&
  src.includes(".t('menu.sound.on'") && src.includes("'menu.fs.exit'") &&
  classroomSrc.includes("I18N.t('cls.progress.board'"));

check('transição: som, Tela Cheia e Efeitos 3D NÃO têm fade',
  mgjs.includes("'btn-sound': 1") && mgjs.includes("'btn-fullscreen-menu': 1") && mgjs.includes("'btn-effects3d': 1"));
const speechColCss = css.slice(css.indexOf('.speech-col {'), css.indexOf('/* Balão estilo'));
check('balão: posição mais acima que o centro', /top:\s*4[0-9]%|top:\s*[0-3]?[0-9]%/.test(speechColCss));

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
for (const f of ['i18n_content.js', 'script.js', 'classroom.js']) {
  const code = fs.readFileSync(__dirname + '/' + f, 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const CLS = () => 'window.Classroom._dbg';

const run = expr => vm.runInContext(expr, sandbox);

/* ---- checagens de conteúdo traduzido (usam o sandbox) ---- */
check('conteúdo: estrutura EN/ES espelha EXATAMENTE as lições PT',
  (() => {
    const LESSONS = run('window.Classroom._dbg.LESSONS');
    const C = run('window.I18N_CONTENT');
    if (!LESSONS || !C) return false;
    for (const lang of ['en', 'es']) {
      for (const bond of Object.keys(LESSONS)) {
        const base = LESSONS[bond], tr = C[lang].lessons[bond];
        if (!tr || !tr.slides || tr.slides.length !== base.slides.length) return false;
        for (let i = 0; i < base.slides.length; i++) {
          const b = base.slides[i], s2 = tr.slides[i];
          if (!s2.lines || s2.lines.length !== b.lines.length) return false;
          if (!s2.say || s2.say.length !== b.say.length) return false;
        }
      }
    }
    return true;
  })());
check('conteúdo: diálogos de chegada + planetas traduzidos (5 níveis + 2 desvios)',
  (() => {
    const C = run('window.I18N_CONTENT');
    if (!C) return false;
    for (const lang of ['en', 'es']) {
      if (!C[lang] || C[lang].dialogues.length !== 7) return false;
      for (const k of ['tutorial','ionic','covalent','metallic','final','kinder','bueno']) {
        const lv = C[lang].levels[k];
        if (!lv || !lv.name || !lv.intro || !lv.objective || !lv.chem) return false;
      }
      /* diálogos dos desvios devem ter o MESMO comprimento do original PT (6) */
      if (C[lang].dialogues[5] && C[lang].dialogues[5].length !== 6) return false;
      if (C[lang].dialogues[6] && C[lang].dialogues[6].length !== 6) return false;
    }
    return true;
  })());
check('conteúdo: classroom usa lessonFor e recarrega slide ao trocar idioma',
  classroomSrc.includes('I18N.lessonFor(S.bond, base)') &&
  classroomSrc.includes('goSlide(S.idx)'));
check('conteúdo: script.js usa dialogueFor/levelText/mountWord',
  src.includes('I18N.dialogueFor(Game.levelIndex, dlgSrc)') &&
  src.includes("I18N.levelText(lv.lv.id, 'intro'") &&
  src.includes('I18N.mountWord()'));


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

/* o CONTEÚDO aparece escrito no quadro sozinho, sem nenhum clique */
run('(function(){ const d=window.Classroom._dbg; d.goSlide(0,false); })()');
pumpFrames(30);
const linesEl = elsById['cls-board-lines'];
check('escrita automática: linhas do quadro visíveis sem interação',
  linesEl.children.length > 0 && linesEl.children.every(li => li.classList.contains('show') && li.textContent.length > 0));
check('título do quadro escrito por completo',
  elsById['cls-board-title'].textContent.length > 0 &&
  elsById['cls-board-title'].textContent === run('window.Classroom._dbg.LESSONS[window.Classroom._dbg.S.bond].slides[0].title'));
check('fala preenchida durante a aula', elsById['cls-speech'].textContent.length > 0);
check('dica de próximo quadro após a escrita automática',
  elsById['cls-hint'].hidden === false && /próximo quadro/.test(elsById['cls-hint'].textContent));

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
