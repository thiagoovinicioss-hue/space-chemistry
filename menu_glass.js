/* ============================================================
   MenuGlass — Liquid Glass interativo dos botões do menu
   - Inclinação 3D contínua seguindo o ponteiro (efeito vidro vivo)
   - Salto de entrada por zona: meio = pulo reto para frente;
     lado direito = bloco gira revelando a PAREDE ESQUERDA;
     lado esquerdo = revela a PAREDE DIREITA (vice versa)
   - Retorno extremamente suave ao tirar o mouse/dedo
   - Responsivo ao toque (pointerdown/up) e respeita reduced-motion
============================================================ */
(function () {
  'use strict';
  if (window.MenuGlass) return;

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) return;

  var MAX_RY = 5;    /* giro horizontal máximo acompanhando o ponteiro */
  var MAX_RX = 3;    /* giro vertical máximo */
  var REST_Z = 13;   /* profundidade em repouso sob o ponteiro */
  var JUMP_Z = 23;   /* profundidade do ápice do salto */

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function bind(btn) {
    if (btn._mgBound) return;
    btn._mgBound = true;
    var leaveTimer = null;
    var pendingEv = null;
    var rafPending = false;

    function setVars(map) {
      for (var k in map) btn.style.setProperty(k, map[k]);
    }

    function relPoint(e) {
      var r = btn.getBoundingClientRect();
      return {
        nx: clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5),
        ny: clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5)
      };
    }

    /* pose contínua: girar para revelar a parede OPSTA ao lado tocado */
    function liveVars(p, lift) {
      var ry = p.nx * 2 * MAX_RY;          /* ponteiro à direita => ry>0 => parede esquerda */
      var rx = -p.ny * 2 * MAX_RX;         /* ponteiro acima  => topo recua */
      var wl = clamp(ry / MAX_RY, 0, 1);
      var wr = clamp(-ry / MAX_RY, 0, 1);
      var mx = Math.abs(p.nx) > 0.12 ? (p.nx > 0 ? 2.5 : -2.5) : 0;
      var my = p.ny * 4;
      return {
        '--mg-ry': ry.toFixed(2) + 'deg',
        '--mg-rx': rx.toFixed(2) + 'deg',
        '--mg-z': Math.round(lift) + 'px',
        '--mg-x': mx.toFixed(1) + 'px',
        '--mg-y': my.toFixed(1) + 'px',
        '--mg-wl': wl.toFixed(2),
        '--mg-wr': wr.toFixed(2)
      };
    }

    function enter(e) {
      clearTimeout(leaveTimer);
      btn.classList.remove('is-returning');
      var r = btn.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var jv = { '--jz': JUMP_Z + 'px', '--jx': '0px', '--jry': '0deg', '--jrx': '1.1deg' };
      if (nx >= 0.33) {           /* entrada pela DIREITA: revela parede esquerda */
        jv['--jry'] = '7deg';   jv['--jx'] = '3px';  jv['--jrx'] = '1.6deg';
      } else if (nx <= -0.33) {   /* entrada pela ESQUERDA: revela parede direita */
        jv['--jry'] = '-7deg';  jv['--jx'] = '-3px'; jv['--jrx'] = '1.6deg';
      }
      setVars(jv);
      setVars(liveVars({
        nx: Math.abs(nx) >= 0.33 ? clamp(nx, -0.28, 0.28) : 0,
        ny: 0
      }, REST_Z));
      btn.classList.add('is-hover', 'is-lit', 'is-jumping');
    }

    function scheduleMove(e) {
      if (!btn.classList.contains('is-hover') || btn.classList.contains('is-jumping')) return;
      pendingEv = e;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        if (pendingEv && btn.classList.contains('is-hover')) {
          setVars(liveVars(relPoint(pendingEv), REST_Z));
        }
      });
    }

    function leave() {
      btn.classList.remove('is-jumping', 'is-hover', 'is-lit');
      btn.classList.add('is-returning');
      setVars({
        '--mg-ry': '0deg', '--mg-rx': '0deg', '--mg-z': '0px',
        '--mg-x': '0px', '--mg-y': '0px', '--mg-wl': '0', '--mg-wr': '0'
      });
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () {
        btn.classList.remove('is-returning');
      }, 1100);
    }

    btn.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'touch') enter(e);
    });
    btn.addEventListener('pointermove', scheduleMove);
    btn.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'touch') leave();
    });

    /* toque: mesmo comportamento, guiado pelo ponto de toque */
    btn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') enter(e);
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      btn.addEventListener(t, function (e) {
        if (e.pointerType === 'touch') setTimeout(leave, 160);
      });
    });

    /* teclado: foco ganha o pulo central suave */
    btn.addEventListener('focus', function () {
      enter({ clientX: 0, clientY: 0, pointerType: 'mouse' });
    });
    btn.addEventListener('blur', leave);

    btn.addEventListener('animationend', function (ev) {
      if (ev.animationName === 'menu-glass-jump') btn.classList.remove('is-jumping');
    });
  }

  function init(root) {
    var buttons = (root || document).querySelectorAll('.menu-buttons .btn');
    Array.prototype.forEach.call(buttons, bind);
    initGlassNav();
  }

  /* ============================================================
     GLASS NAV — pressionar => recuar => cortina branca => trocar tela
     Aplica-se a todos os botões que mudam de tela (data-nav, cartões
     de conteúdo, práticas e voltar). Exceções: som, tela cheia e
     efeitos 3D (toggles que não navegam).
  ============================================================ */
  var NAV_SEL = 'button[data-nav], .bond-card, #btn-open-lewis, #btn-open-structural,' +
    ' #btn-cls-back, #btn-lewis-back, #btn-structural-back';
  var NAV_EXCLUDE = { 'btn-sound': 1, 'btn-fullscreen-menu': 1, 'btn-effects3d': 1 };
  var PRESS_MS = 210;
  var FADE_IN_MS = 250;
  var HOLD_MS = 90;
  var fadeEl = null;

  function ensureFadeEl() {
    if (fadeEl) return fadeEl;
    fadeEl = document.getElementById('glass-fade');
    if (!fadeEl) {
      fadeEl = document.createElement('div');
      fadeEl.id = 'glass-fade';
      document.body.appendChild(fadeEl);
    }
    return fadeEl;
  }

  function replayClick(el) {
    var ev;
    try {
      ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    } catch (err) {
      ev = document.createEvent('MouseEvents');
      ev.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }
    ev._glassReplay = true;
    el.dispatchEvent(ev);
  }

  function initGlassNav() {
    ensureFadeEl();
    document.addEventListener('click', function (e) {
      if (e._glassReplay) return;                 /* segundo passe: deixa passar */
      var el = e.target && e.target.closest ? e.target.closest(NAV_SEL) : null;
      if (!el || el.disabled) return;
      var id = el.id || '';
      if (NAV_EXCLUDE[id]) return;                /* som / tela cheia / efeitos 3D */

      e.preventDefault();
      e.stopPropagation();

      el.classList.remove('is-pressed');
      void el.offsetWidth;                        /* reinicia a animação */
      el.classList.add('is-pressed');
      setTimeout(function () { el.classList.remove('is-pressed'); }, PRESS_MS + 320);

      setTimeout(function () {
        ensureFadeEl().classList.add('show');     /* cortina entra */
        setTimeout(function () {
          replayClick(el);                        /* troca de tela em branco */
          setTimeout(function () {
            ensureFadeEl().classList.remove('show'); /* cortina sai suave */
          }, HOLD_MS);
        }, FADE_IN_MS);
      }, PRESS_MS);
    }, true);

    /* segurança: a cortina nunca fica presa na tela */
    document.addEventListener('glassfade:release', function () {
      if (fadeEl) fadeEl.classList.remove('show');
    });
  }

  window.MenuGlass = {
    init: init,
    version: '1.1.0'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
