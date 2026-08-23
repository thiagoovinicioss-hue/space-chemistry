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

  var MAX_RY = 8;    /* giro horizontal máximo acompanhando o ponteiro */
  var MAX_RX = 5;    /* giro vertical máximo */
  var REST_Z = 18;   /* profundidade em repouso sob o ponteiro */
  var JUMP_Z = 34;   /* profundidade do ápice do salto */

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
      var mx = Math.abs(p.nx) > 0.12 ? (p.nx > 0 ? 4 : -4) : 0;
      var my = p.ny * 6;
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
      var jv = { '--jz': JUMP_Z + 'px', '--jx': '0px', '--jry': '0deg', '--jrx': '1.4deg' };
      if (nx >= 0.33) {           /* entrada pela DIREITA: revela parede esquerda */
        jv['--jry'] = '13deg';  jv['--jx'] = '5px';  jv['--jrx'] = '2.2deg';
      } else if (nx <= -0.33) {   /* entrada pela ESQUERDA: revela parede direita */
        jv['--jry'] = '-13deg'; jv['--jx'] = '-5px'; jv['--jrx'] = '2.2deg';
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
      }, 950);
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
  }

  window.MenuGlass = {
    init: init,
    version: '1.0.0'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
