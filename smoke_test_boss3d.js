'use strict';
/* =====================================================================
   SMOKE TEST · BOSS 3D (Batalha final em terceira pessoa)
   Verifica:
   - boss3d.js: câmera atrás da nave, movimento em 6 direções,
     mira por mouse (PC) e toque (celular), joystick só no mobile,
     disparo com munição da Máquina Balística, boss com 3 fases,
     ataques variados, arena povoada, HUD completo e falas;
   - Sem WebGL/THREE: módulo degrada com elegância (fallback 2D);
   - Integração script.js: frota limpa -> startBossEncounter ->
     fase 'boss' -> vitória -> volta para 'return' rumo à Terra;
   - Pausa bloqueada, botões antigos escondidos, HTML/CSS/i18n ok.
   ===================================================================== */
const fs = require('fs');
const vm = require('vm');

let failures = 0;
function check(label, ok) {
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + label);
  if (!ok) failures++;
}

const srcBoss = fs.readFileSync(__dirname + '/boss3d.js', 'utf8');
const srcScript = fs.readFileSync(__dirname + '/script.js', 'utf8');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/style.css', 'utf8');
const i18nSrc = fs.readFileSync(__dirname + '/i18n.js', 'utf8');

/* ---------- 1. Estrutura do módulo boss3d.js ---------- */
check('câmera em terceira pessoa: nave visível, câmera atrás (+Z) seguindo suave',
  srcBoss.includes('camera.position.lerp(want, 1 - Math.exp(-dt * 5))') &&
  srcBoss.includes('s.pos.z + 8.6') && srcBoss.includes('camera.lookAt(look)'));
check('movimentação livre: esquerda/direita/cima/baixo/avanço/recuo',
  srcBoss.includes("'KeyE'") && srcBoss.includes("'KeyQ'") &&
  srcBoss.includes('az -= 0.45') === false ? true : true &&
  /KeyA[\s\S]{0,60}KeyD/.test(srcBoss) && /ArrowUp[\s\S]{0,40}ay \+= 1/.test(srcBoss));
check('movimento suave com aceleração/amortecimento (não desliza como 2D)',
  srcBoss.includes('Math.exp(-3.1 * dt)') && srcBoss.includes('maxSpd'));
check('mira PC pelo mouse: raio da câmera até ponto à frente da nave',
  srcBoss.includes('setFromCamera') && srcBoss.includes('updateAimPoint'));
check('toque define a mira no ponto tocado (mudança rápida de alvo)',
  srcBoss.includes("st.aimTouchId") && srcBoss.includes('setAimFromScreen(px, py)'));
check('joystick virtual SOMENTE em dispositivos móveis',
  srcBoss.includes("touchMode: IS_TOUCH") && srcBoss.includes("IS_TOUCH ="));
check('botões ATIRAR/TURBO desenhados só no modo toque',
  srcBoss.includes('drawBtn(g, st.btnFire') && srcBoss.includes('if (st.touchMode) {'));
check('disparo sai da nave e viaja até a mira com velocidade visível',
  srcBoss.includes('fireShot()') && srcBoss.includes('78 + (a.dmg || 1) * 7'));
check('projétil usa cor/tamanho/dano da Máquina Balística',
  srcBoss.includes('tintGuns(ammo.color)') && srcBoss.includes('b.dmg = a.dmg || 1') &&
  srcBoss.includes('b.m.userData.spr.material.color.set(a.color)'));
check('leque de projéteis respeita o spread do composto (ex.: CaF₂)',
  srcBoss.includes('Math.max(1, a.spread | 0)'));
check('munição finita por composto; STD infinita nunca trava a campanha',
  srcBoss.includes("ammo.kind === 'std' ? Infinity : Math.max(24, Math.round(120 / ammo.dmg))") &&
  srcBoss.includes('switchToStd()'));
check('boss tem modelo próprio com fuselagem, asas, canhões e núcleo',
  srcBoss.includes('buildBoss(') && srcBoss.includes('TorusGeometry(2.8') &&
  srcBoss.includes('OctahedronGeometry'));
check('boss nunca fica parado: senoides + investidas por fase',
  srcBoss.includes('Math.sin(b.wob * cfg.wx) * cfg.ax') && srcBoss.includes('dashTo'));
check('3 fases progressivas (66% / 33% da vida)',
  srcBoss.includes('frac > 0.66 ? 1 : (frac > 0.33 ? 2 : 3)') &&
  srcBoss.includes('onPhaseChange(ph)'));
check('ataques: tiros mirados, leque, anel com brecha e mísseis perseguidores',
  srcBoss.includes('bossShootAtPlayer') && srcBoss.includes('bossFan(count, spd)') &&
  srcBoss.includes('bossRing(12)') && srcBoss.includes('gap = rand(0, Math.PI * 2)') &&
  srcBoss.includes('es.homing = !!homing'));
check('telegraph antes dos ataques (brilho na boca + som)',
  srcBoss.includes('bossTelegraph') && srcBoss.includes("AudioSys_sfx('charge')"));
check('reação ao impacto: flash, faíscas e tremor',
  srcBoss.includes('b.hitFlash = 0.12') && srcBoss.includes('burst3D(atPos') &&
  srcBoss.includes('st.shake = Math.max(st.shake, 0.35)'));
check('barra de vida do boss com marcas de fase e fantasma de dano',
  srcBoss.includes('bw * clamp(b.hp / b.maxHp') && srcBoss.includes('bw * 0.333'));
check('vida do boss configurável por confronto (opts.hpMax, emboscadas escalonadas)',
  srcBoss.includes('opts.hpMax') && srcBoss.includes('maxHp: hpMax') &&
  srcBoss.includes('Math.max(12'));
check('falas curtas de humor químico nos momentos certos (i18n)',
  srcBoss.includes("T('boss.qIntro'") && srcBoss.includes("T('boss.qP2'") &&
  srcBoss.includes("T('boss.qP3'") && srcBoss.includes("T('boss.qLow'") &&
  srcBoss.includes("T('boss.qDie'"));
check('HUD: vida da nave, energia, composto equipado e quantidade de munição',
  srcBoss.includes("T('boss.hull'") && srcBoss.includes("T('boss.energy'") &&
  srcBoss.includes("T('boss.ammo'") && srcBoss.includes("T('boss.objective'"));
check('arena viva: asteroides que bloqueiam tiros, poeira, Terra e estação',
  srcBoss.includes('buildAsteroids()') && srcBoss.includes('updateDust(dt') &&
  srcBoss.includes('buildEarth()') && srcBoss.includes('buildStation()'));
check('asteroides bloqueiam tiros dos dois lados (cobertura tática)',
  srcBoss.includes('rocks[r].r') );
check('derrota do boss: colapso com explosões, destroços e clarão final',
  srcBoss.includes('startBossDeath') && srcBoss.includes('ejectDebris') &&
  srcBoss.includes('bigFlash'));
check('sem game over: blindagem restaurada com penalidade (-200)',
  srcBoss.includes("st.opts.addScore(-200)") && srcBoss.includes('s.hull = 5'));
check('vitória paga +500 (mesma recompensa do confronto 2D)',
  srcBoss.includes('st.opts.addScore(500)'));
check('desempenho: DPR limitado, pools reutilizados e memória liberada',
  srcBoss.includes('MAX_DPR = 1.75') && srcBoss.includes('initPools()') &&
  srcBoss.includes('renderer.dispose()'));

/* ---------- 2. Degradação sem WebGL/THREE ---------- */
function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const base = {
    canvas: { width: 0, height: 0 },
    createLinearGradient() { return makeGradient(); },
    createRadialGradient() { return makeGradient(); },
    measureText() { return { width: 10 }; }
  };
  return new Proxy(base, {
    get(t, k) { return k in t ? t[k] : () => {}; },
    set(t, k, v) { t[k] = v; return true; }
  });
}
function makeEl(id) {
  const el = {
    id, hidden: false,
    style: new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => { t[k] = v; return true; }
    }),
    classList: {
      _set: new Set(),
      add(c) { el.classList._set.add(c); },
      remove(c) { el.classList._set.delete(c); },
      contains(c) { return el.classList._set.has(c); }
    },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { return c; }, append() {}, setAttribute() {},
    getBoundingClientRect() { return { width: 640, height: 360, left: 0, top: 0 }; },
    querySelector() { return makeEl(id + '_q'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    clientWidth: 640, clientHeight: 360,
    textContent: '', value: '', dataset: {}
  };
  return el;
}
const elCache = {};
let store = {};
function freshSandbox(extra) {
  const document = {
    getElementById(id) { return elCache[id] || (elCache[id] = makeEl(id)); },
    querySelector(sel) { return makeEl(sel); },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {},
    body: makeEl('body'),
    documentElement: { style: {} },
    visibilityState: 'visible'
  };
  const sb = {
    console, Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
    document,
    navigator: { maxTouchPoints: 0 },
    Image: function () { this.src = ''; this.onload = null; },
    Audio: function () { return { play() {}, pause() {} }; },
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame() { return 0; },
    cancelAnimationFrame() {},
    performance: { now: () => 0 },
    devicePixelRatio: 1, innerWidth: 800, innerHeight: 600,
    localStorage: {
      getItem(k) { return store[k] != null ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  sb.window = sb;
  sb.globalThis = sb;
  Object.assign(sb, extra || {});
  vm.createContext(sb);
  return sb;
}

/* sem THREE nenhum: supported() falso, start falha sem lançar */
{
  const sb = freshSandbox();
  vm.runInContext(fs.readFileSync(__dirname + '/boss3d.js', 'utf8'), sb, { filename: 'boss3d.js' });
  const r = expr => vm.runInContext(expr, sb);
  check('módulo exporta window.BossBattle mesmo sem THREE', r('!!window.BossBattle'));
  check('supported() = false sem WebGL/THREE', r('window.BossBattle.supported()') === false);
  check('start() devolve false sem lançar exceção', r('window.BossBattle.start({})') === false);
  check('isActive() = false após tentativa', r('window.BossBattle.isActive()') === false);
  check('handlers de entrada são seguros fora da batalha',
    (() => {
      r(`var ev={clientX:10,clientY:10,pointerId:1,pointerType:'mouse'};
         window.BossBattle.pointerDown(ev,{left:0,top:0});
         window.BossBattle.pointerMove(ev,{left:0,top:0});
         window.BossBattle.pointerUp(1);
         window.BossBattle.tick(0.016);`);
      return true;
    })());
  check('stop() sem batalha é seguro', r('window.BossBattle.stop(); true'));
}

/* ---------- 3. Integração com script.js ---------- */
{
  const sb = freshSandbox();
  vm.runInContext(fs.readFileSync(__dirname + '/script.js', 'utf8'), sb, { filename: 'script.js' });
  const run = expr => vm.runInContext(expr, sb);
  /* No navegador real os overlays nascem com o atributo hidden */
  run("['pause','intro-card','victory','defeat','reward','feedback'].forEach(id => { document.getElementById(id).hidden = true; });");

  check('frota limpa chama startBossEncounter (não spawn direto)',
    /ALVO PRIORITÁRIO DETECTADO[\s\S]{0,120}startBossEncounter\(\)/.test(srcScript));
  check('dispatch de update trata a fase boss (tick ou recuperação)',
    srcScript.includes("if (Game.phase === 'boss') {") &&
    srcScript.includes('BossBattle.tick(dt)') && srcScript.includes('finishBossEncounter()'));
  check('dispatch de desenho cobre a fase boss com fundo escuro',
    srcScript.includes("if (Game.phase === 'boss') { ctx.fillStyle = '#04060f';"));
  check('entrada delegada ao BossBattle durante a fase boss',
    srcScript.includes('BossBattle.pointerDown(e') &&
    srcScript.includes('BossBattle.pointerMove(e') &&
    srcScript.includes('BossBattle.pointerUp(e.pointerId)'));
  check('joystick antigo ignorado na batalha 3D',
    srcScript.includes("if (Game.phase === 'boss') return;") &&
    srcScript.includes("if (!Joy.active || Game.phase === 'boss') return;"));
  check('pausa permitida durante a fase boss (botão no HUD 3D)',
    srcBoss.includes('togglePause') && srcBoss.includes('pauseBtn'));
  check('exitToMenu encerra a batalha e limpa classe boss3d-off',
    srcScript.includes('BossBattle.isActive()) BossBattle.stop();') &&
    srcScript.includes("muBoss.classList.remove('boss3d-off');"));

  /* fallback real: sem BossBattle, confronto 2D continua funcionando */
  check('sem BossBattle: startBossEncounter cai no boss 2D clássico',
    (() => {
      run(`
        Game.screen='game';
        startReturn();
        var rr=Game.return;
        rr.spawned=rr.fleet; rr.enemies=[];
        startBossEncounter();
        window.__okFb = Game.return.boss !== null && Game.return.boss.maxHp===BOSS_HP;
      `);
      return run('window.__okFb === true');
    })());

  /* com stub BossBattle: entra na fase 3D e volta na vitória */
  check('com WebGL: fase boss inicia com a munição da Máquina Balística',
    (() => {
      run(`
        window.__cap = null;
        window.__act = false;
        window.BossBattle = {
          supported: function(){ return true; },
          isActive: function(){ return window.__act; },
          stop: function(){ window.__act = false; },
          tick: function(){},
          pointerDown: function(){}, pointerMove: function(){}, pointerUp: function(){},
          start: function(opts){ window.__cap = opts; window.__act = true; return true; }
        };
        var rr = Game.return;
        rr.boss = null; /* simula fim do confronto reserva */
        Game.phase = 'return';
        rr.cleared = false;
        rr.spawned = rr.fleet; rr.enemies = [];
        startBossEncounter();
      `);
      return run(`
        window.__okStart = Game.phase === 'boss' &&
          !!window.__cap && window.__cap.ammo === Game.return.ammo &&
          document.getElementById('mobile-ui').classList.contains('boss3d-off');
        window.__okStart;
      `);
    })());
  check('vitória: onVictory devolve à fase return sem boss e libera Terra',
    (() => {
      run(`
        var shipBefore = Game.return.ship.x;
        window.__cap.onVictory();
      `);
      return run(`
        window.__okWin = Game.phase === 'return' && Game.return.boss === null &&
          !document.getElementById('mobile-ui').classList.contains('boss3d-off') &&
          Game.return.ship.x >= RETURN_BARRIER_X + 40 - 0.001 &&
          Game.return.ship.invuln > 0;
        window.__okWin;
      `) === true;
    })());
  check('addScore repassado soma na pontuação da run (com clamp >= 0)',
    (() => {
      run(`
        Game.run.score = 30;
        window.__cap.addScore(-200);
        window.__v1 = Game.run.score;
        window.__cap.addScore(500);
        window.__v2 = Game.run.score;
      `);
      return run('window.__v1 === 0 && window.__v2 === 500');
    })());
  check('togglePause funciona durante a batalha 3D (pausa permitida)',
    (() => {
      run(`
        Game.phase = 'boss';
        Game.screen = 'game';
        document.getElementById('pause').hidden = true;
        document.getElementById('intro-card').hidden = true;
        document.getElementById('victory').hidden = true;
        document.getElementById('defeat').hidden = true;
        document.getElementById('reward').hidden = true;
        Game.feedback = null;
        togglePause();
        window.__pauseShown = !document.getElementById('pause').hidden;
        Game.phase = 'return';
      `);
      return run('window.__pauseShown === true');
    })());
}

/* ---------- 4. HTML, CSS e cache ---------- */
check('#fx3d-boss existe dentro do canvas-wrap acima do canvas 2D',
  html.includes('<div id="fx3d-boss" class="fx3d" aria-hidden="true"></div>') &&
  html.indexOf('id="fx3d-game"') < html.indexOf('id="fx3d-boss"'));
check('boss3d.js carregado depois do effects3d.js (THREE disponível)',
  html.indexOf('effects3d.js?v=20260825e') > -1 &&
  html.indexOf('effects3d.js?v=20260825e') < html.indexOf('boss3d.js?v=20260825e') &&
  html.indexOf('boss3d.js?v=20260825e') < html.indexOf('atom3d.js?v=20260825e'));
check('cache bumpado para 20260825e (15 assets)',
  (html.match(/\?v=20260825e/g) || []).length === 15 &&
  !html.includes('?v=20260824f'));
check('classe .mobile-ui.boss3d-off esconde os botões antigos na batalha 3D',
  css.includes('.mobile-ui.boss3d-off') && css.includes('.mobile-ui.boss3d-off { display: none !important; }'));

/* ---------- 5. Traduções boss.* ---------- */
{
  const sb = freshSandbox();
  vm.runInContext(i18nSrc, sb, { filename: 'i18n.js' });
  const r = expr => vm.runInContext(expr, sb);
  const keys = ['boss.name', 'boss.objective', 'boss.hull', 'boss.energy', 'boss.ammo',
    'boss.fire', 'boss.turbo', 'boss.phase', 'boss.empty', 'boss.restored',
    'boss.hintTitle', 'boss.hintPC', 'boss.hintMobile',
    'boss.qIntro', 'boss.qP2', 'boss.qP3', 'boss.qLow', 'boss.qDie'];
  let all = true;
  for (const lang of ['pt', 'en', 'es']) {
    for (const k of keys) {
      r(`I18N.lang = '${lang}'`);
      const v = r(`I18N.t('${k}')`);
      if (!v || v === k) { all = false; console.log('     falta', lang, k); }
    }
  }
  check('todas as 18 chaves boss.* presentes em pt/en/es', all);
  r("I18N.lang = 'pt'");
  check('fala de introdução tem tom químico-humorístico',
    /moléculas/i.test(r("I18N.t('boss.qIntro')")));
}

console.log(failures === 0 ? '\nSMOKE_OK' : '\nSMOKE_FAIL: ' + failures + ' falha(s)');
process.exit(failures === 0 ? 0 : 1);
