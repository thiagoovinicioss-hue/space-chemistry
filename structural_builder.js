/* ============================================================
   SPACE CHEMISTRY — FÓRMULA ESTRUTURAL
   ------------------------------------------------------------
   Construtor de FÓRMULAS ESTRUTURAIS (ligações covalentes).

   PRINCÍPIO PEDAGÓGICO (NÃO quebrar):
   - A Fórmula Estrutural NÃO mostra elétrons individualmente:
     nada de pontos, elétrons livres ou pares isolados.
   - Ligações covalentes = TRAÇOS:
        simples:  —        dupla:   =        tripla:   ≡
   - Mostra apenas símbolos dos elementos + traços das ligações.
   - Posicionamento automático por SLOTS (alvos) pré-definidos:
     átomos alinham, mantêm espaçamento uniforme, não se sobrepõem
     e ficam centralizados. Arrastar oferece "snap" para os alvos.
   - Validação química por molécula (átomos, elementos, posições,
     conexões, quantidade e tipo de ligação).

   USO
   - Tela standalone: StructuralBuilder.enter() / exit()
   - Dentro do motor de exercícios: o tipo 'structural' é
     registrado em EXERCISE_TYPES automaticamente.
   ============================================================ */

(function () {
  'use strict';

  var W = 760, H = 480;             /* coordenadas lógicas do canvas */
  var SNAP_R = 58;                  /* raio de "snap" ao arrastar */

  var C_BOND = '#7ff5ff';           /* ligações (traços) */
  var C_BOND_DIM = 'rgba(127,245,255,0.45)';
  var C_TARGET = 'rgba(255,241,205,0.9)';
  var C_SYMBOL = '#f2f0e6';
  var C_GOOD = '#5dffa6';
  var C_BAD = '#ff5d6c';

  /* ------------------------------------------------------------------
     MOLÉCULAS (posições normalizadas 0..1, centradas)
     slots[] = { el, x, y } — alvos fixos e organizados.
     bonds[] = [ slotA, slotB, ordem ] — ordem: 1 simples, 2 dupla, 3 tripla.
  ------------------------------------------------------------------ */
  var STRUCT_MOLECULES = {
    H2: {
      id: 'H2', formula: 'H₂', name: 'Gás Hidrogênio',
      slots: [ { el: 'H', x: 0.40, y: 0.5 }, { el: 'H', x: 0.60, y: 0.5 } ],
      bonds: [ [0, 1, 1] ],
      tip: 'Ligação simples H — H: os dois H compartilham 1 par de elétrons.'
    },
    Cl2: {
      id: 'Cl2', formula: 'Cl₂', name: 'Gás Cloro',
      slots: [ { el: 'Cl', x: 0.40, y: 0.5 }, { el: 'Cl', x: 0.60, y: 0.5 } ],
      bonds: [ [0, 1, 1] ],
      tip: 'Ligação simples Cl — Cl: cada Cl compartilha 1 elétron.'
    },
    H2O: {
      id: 'H2O', formula: 'H₂O', name: 'Água',
      slots: [ { el: 'O', x: 0.5, y: 0.5 }, { el: 'H', x: 0.26, y: 0.5 }, { el: 'H', x: 0.74, y: 0.5 } ],
      bonds: [ [0, 1, 1], [0, 2, 1] ],
      tip: 'H — O — H: o oxigênio no centro com ligações simples para os dois H.'
    },
    NH3: {
      id: 'NH3', formula: 'NH₃', name: 'Amônia',
      slots: [
        { el: 'N', x: 0.5, y: 0.5 },
        { el: 'H', x: 0.5, y: 0.22 },
        { el: 'H', x: 0.28, y: 0.5 },
        { el: 'H', x: 0.72, y: 0.5 }
      ],
      bonds: [ [0, 1, 1], [0, 2, 1], [0, 3, 1] ],
      tip: 'O N no centro com 3 ligações simples: H em cima, à esquerda e à direita.'
    },
    CH4: {
      id: 'CH4', formula: 'CH₄', name: 'Metano',
      slots: [
        { el: 'C', x: 0.5, y: 0.5 },
        { el: 'H', x: 0.5, y: 0.22 },
        { el: 'H', x: 0.5, y: 0.78 },
        { el: 'H', x: 0.28, y: 0.5 },
        { el: 'H', x: 0.72, y: 0.5 }
      ],
      bonds: [ [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1] ],
      tip: 'O C no centro com 4 ligações simples: os H formam uma cruz (CH₄).'
    },
    CO2: {
      id: 'CO2', formula: 'CO₂', name: 'Gás Carbônico',
      slots: [ { el: 'C', x: 0.5, y: 0.5 }, { el: 'O', x: 0.26, y: 0.5 }, { el: 'O', x: 0.74, y: 0.5 } ],
      bonds: [ [0, 1, 2], [0, 2, 2] ],
      tip: 'O = C = O: o carbono no centro com duas LIGAÇÕES DUPLAS.'
    }
  };

  var MOL_ORDER = ['H2', 'Cl2', 'H2O', 'NH3', 'CH4', 'CO2'];

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  function shade(hex, f) {
    var c = hexToRgb(hex); if (!c) return hex;
    return 'rgb(' + Math.round(c.r * f) + ',' + Math.round(c.g * f) + ',' + Math.round(c.b * f) + ')';
  }
  function atomRadius(el) { return el === 'H' ? 18 : 26; }

  /* ------------------------------------------------------------------
     GEOMETRIA — posições dos alvos (sempre centralizadas e uniformes)
  ------------------------------------------------------------------ */
  function slotPos(mol, i) {
    return { x: mol.slots[i].x * W, y: mol.slots[i].y * H };
  }
  function slotBox(p) {
    return { x1: p.x - 28, y1: p.y - 28, x2: p.x + 28, y2: p.y + 28 };
  }
  function inBox(p, b) { return p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2; }

  /* Região clicável de uma ligação (entre os dois átomos, sem contar os discos) */
  function bondBox(mol, b) {
    var pa = slotPos(mol, b[0]), pb = slotPos(mol, b[1]);
    var r = 18;
    var x1 = Math.min(pa.x, pb.x), x2 = Math.max(pa.x, pb.x);
    var y1 = Math.min(pa.y, pb.y), y2 = Math.max(pa.y, pb.y);
    var pad = 22;
    if (Math.abs(pa.y - pb.y) < 2) { x1 += r; x2 -= r; }
    else { y1 += r; y2 -= r; }
    return { x1: x1 - pad, y1: y1 - pad, x2: x2 + pad, y2: y2 + pad };
  }

  /* Linhas paralelas de uma ligação (simples/dupla/tripla) */
  function bondLines(mol, b, order) {
    var a = slotPos(mol, b[0]), c = slotPos(mol, b[1]);
    var dx = c.x - a.x, dy = c.y - a.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / d, uy = dy / d;
    var px = -uy, py = ux;
    var r1 = atomRadius(mol.slots[b[0]].el) + 4;
    var r2 = atomRadius(mol.slots[b[1]].el) + 4;
    var gap = 7, lines = [];
    for (var i = 0; i < order; i++) {
      var off = (i - (order - 1) / 2) * gap;
      lines.push({
        x1: a.x + ux * r1 + px * off,
        y1: a.y + uy * r1 + py * off,
        x2: c.x - ux * r2 + px * off,
        y2: c.y - uy * r2 + py * off
      });
    }
    return lines;
  }

  /* ------------------------------------------------------------------
     ESTADO (modelo puro — testável sem DOM)
  ------------------------------------------------------------------ */
  function newState(mol) {
    return {
      molId: mol.id || '',
      slots: mol.slots.map(function () { return null; }),
      orders: mol.bonds.map(function () { return 1; }),
      picked: null,       /* elemento selecionado na bandeja */
      drag: null,         /* { from, x, y } durante o arrasto */
      complete: false
    };
  }

  function trayElements(mol) {
    var seen = [], list = [];
    mol.slots.forEach(function (s) {
      if (seen.indexOf(s.el) < 0) { seen.push(s.el); list.push(s.el); }
    });
    return list;
  }
  function elementLeft(mol, S, el) {
    var need = mol.slots.filter(function (s) { return s.el === el; }).length;
    var placed = S.slots.filter(function (v) { return v === el; }).length;
    return need - placed;
  }

  function placeEl(mol, S, i, el) {
    if (S.slots[i]) return false;
    if (mol.slots[i].el !== el) return false;
    S.slots[i] = el;
    return true;
  }
  function pickupEl(S, i) {
    if (!S.slots[i]) return false;
    S.picked = S.slots[i];
    S.slots[i] = null;
    return true;
  }
  function moveEl(mol, S, from, to) {
    if (from === to) return false;
    if (!S.slots[from] || S.slots[to]) return false;
    if (mol.slots[to].el !== S.slots[from]) return false;
    S.slots[to] = S.slots[from];
    S.slots[from] = null;
    return true;
  }
  function cycleBond(S, bondIdx) {
    var n = (S.orders[bondIdx] || 1);
    S.orders[bondIdx] = n >= 3 ? 1 : n + 1;
    return S.orders[bondIdx];
  }

  /* Validação completa: átomos, elementos, posições, conexões,
     quantidade e tipo de ligações. */
  function validate(mol, S) {
    var i;
    for (i = 0; i < mol.slots.length; i++) {
      if (S.slots[i] !== mol.slots[i].el) return false;
    }
    for (i = 0; i < mol.bonds.length; i++) {
      if (S.orders[i] !== mol.bonds[i][2]) return false;
    }
    return true;
  }
  function allPlaced(mol, S) {
    return mol.slots.every(function (s, i) { return !!S.slots[i]; });
  }

  /* ------------------------------------------------------------------
     INSTRUÇÕES / FEEDBACK
  ------------------------------------------------------------------ */
  function instruction(mol, S) {
    if (mol.slots.length === 2) {
      return 'Posicione os dois átomos de ' + mol.formula +
        ' nos alvos e ajuste a ligação com um toque sobre o traço.';
    }
    return 'Posicione os átomos da ' + mol.formula + ' nos alvos (o ' +
      mol.slots[0].el + ' fica no centro) e ajuste cada ligação com um toque sobre o traço.';
  }
  function hint(mol, S) {
    return 'Toque em um elemento da bandeja e depois no alvo. Toque na ligação para trocar: — (simples), = (dupla), ≡ (tripla). Arraste um átomo para movê-lo com encaixe.';
  }

  /* ------------------------------------------------------------------
     RENDERIZAÇÃO
  ------------------------------------------------------------------ */
  function drawBoard(ctx, mol, t) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#27493c');
    g.addColorStop(0.45, '#1d3a30');
    g.addColorStop(1, '#142720');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = C_SYMBOL;
    ctx.fillText('FÓRMULA ESTRUTURAL — ' + mol.formula, W / 2, 30);
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(240,238,230,0.55)';
    ctx.fillText('ligações = TRAÇOS  ·  símbolos dos elementos  (nunca pontos de elétrons)', W / 2, 52);
    ctx.textAlign = 'left';
  }

  function drawAtom(ctx, el, x, y, opts) {
    var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
    var info = E[el] || { color: '#9fb0d8' };
    var R = atomRadius(el);
    ctx.save();
    ctx.globalAlpha = opts && opts.dim ? 0.45 : 1;
    ctx.fillStyle = shade(info.color, 0.32);
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C_SYMBOL;
    ctx.font = 'bold ' + (el === 'H' ? 14 : 18) + 'px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el, x, y + 1);
    ctx.restore();
  }

  function drawTarget(ctx, x, y, r, t, color, label) {
    ctx.save();
    ctx.strokeStyle = color || C_TARGET;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 3 + (x + y) * 0.01);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(240,238,230,0.4)';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (label) ctx.fillText(label, x, y + 1);
    ctx.restore();
  }

  function drawBond(ctx, mol, b, order, t, active) {
    var lines = bondLines(mol, b, order);
    ctx.save();
    ctx.strokeStyle = C_BOND;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3.5;
    if (active) ctx.globalAlpha = 0.6 + 0.35 * Math.sin(t * 4);
    lines.forEach(function (l) {
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });
    ctx.restore();
    /* ordem como indicação discreta: 1, 2 ou 3 linhas */
  }

  function render(ctx, mol, S, t) {
    ctx.clearRect(0, 0, W, H);
    drawBoard(ctx, mol, t);

    var i;
    var pos = mol.slots.map(function (s, k) { return slotPos(mol, k); });

    /* Ligação sob os átomos (só quando os dois lados estão preenchidos) */
    mol.bonds.forEach(function (b, j) {
      if (S.slots[b[0]] && S.slots[b[1]]) {
        drawBond(ctx, mol, b, S.orders[j], t, S.drag === null);
      }
    });

    /* Alvos vazios + átomos posicionados */
    mol.slots.forEach(function (s, k) {
      var p = pos[k];
      if (S.slots[k]) {
        drawAtom(ctx, S.slots[k], p.x, p.y, {});
      } else {
        drawTarget(ctx, p.x, p.y, 24, t, C_TARGET, s.el);
      }
    });

    /* Fantasma do arrasto */
    if (S.drag) {
      drawAtom(ctx, S.slots[S.drag.from], S.drag.x, S.drag.y, { dim: true });
      /* destaca o alvo mais próximo para o snap */
      var near = nearestEmptySlot(mol, S, S.drag.x, S.drag.y);
      if (near >= 0) {
        var pn = pos[near];
        ctx.save();
        ctx.strokeStyle = C_GOOD;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(pn.x, pn.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  function nearestEmptySlot(mol, S, x, y) {
    var best = -1, bestD = SNAP_R;
    for (var i = 0; i < mol.slots.length; i++) {
      if (S.slots[i]) continue;
      var p = slotPos(mol, i);
      var d = dist(x, y, p.x, p.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  /* ------------------------------------------------------------------
     INTERAÇÃO (modelo puro sobre o estado)
  ------------------------------------------------------------------ */
  function tapBond(builder, mol, S, p) {
    for (var j = 0; j < mol.bonds.length; j++) {
      var b = mol.bonds[j];
      if (!S.slots[b[0]] || !S.slots[b[1]]) continue;
      if (inBox(p, bondBox(mol, b))) {
        var n = cycleBond(S, j);
        sfx('click');
        var nomes = ['', 'Ligação SIMPLES (—)', 'Ligação DUPLA (=)', 'Ligação TRIPLA (≡)'];
        setMsg(builder, nomes[n] + ' selecionada nesta ligação.', false, 'good');
        engineRefresh(builder);
        return true;
      }
    }
    return false;
  }

  function tapSlot(builder, mol, S, p) {
    for (var i = 0; i < mol.slots.length; i++) {
      var q = slotPos(mol, i);
      if (!inBox(p, slotBox(q))) continue;
      if (S.slots[i]) {
        /* ocupado: se nada selecionado, "pega" o átomo (permite mover) */
        if (!S.picked) {
          pickupEl(S, i);
          sfx('click');
          setMsg(builder, 'Átomo ' + S.picked + ' selecionado: toque em outro alvo vazio para movê-lo.', false, 'hint');
          renderTray(builder);
          engineRefresh(builder);
        } else {
          sfx('error');
          flash(builder, 'Esse lugar já está ocupado.');
        }
        return true;
      }
      /* vazio */
      if (!S.picked) {
        sfx('error');
        flash(builder, 'Toque primeiro em um elemento da bandeja.');
        return true;
      }
      if (mol.slots[i].el === S.picked) {
        placeEl(mol, S, i, S.picked);
        if (elementLeft(mol, S, S.picked) <= 0) S.picked = null;
        sfx('gate');
        setMsg(builder, null, false);
        renderTray(builder);
        engineRefresh(builder);
      } else {
        sfx('error');
        flash(builder, 'O ' + S.picked + ' não fica nessa posição. Confira a fórmula.');
      }
      return true;
    }
    return false;
  }

  function handleTap(builder, p) {
    var mol = builder.mol, S = builder.S;
    if (builder.locked || S.complete) return;
    if (tapBond(builder, mol, S, p)) return;
    if (tapSlot(builder, mol, S, p)) return;
    sfx('error');
    flash(builder, 'Toque em um alvo vazio, em um átomo ou em uma ligação.');
  }

  /* --- arrasto com snap (mover átomos) --- */
  function dragStart(builder, p) {
    var mol = builder.mol, S = builder.S;
    if (builder.locked || S.complete || S.drag) return;
    if (S.picked) return;
    for (var i = 0; i < mol.slots.length; i++) {
      if (!S.slots[i]) continue;
      var q = slotPos(mol, i);
      if (inBox(p, slotBox(q))) {
        S.drag = { from: i, x: p.x, y: p.y, x0: p.x, y0: p.y };
        engineRefresh(builder);
        return;
      }
    }
  }
  function dragMove(builder, p) {
    var S = builder.S;
    if (!S.drag) return;
    S.drag.x = p.x;
    S.drag.y = p.y;
    engineRefresh(builder);
  }
  function dragEnd(builder, p) {
    var mol = builder.mol, S = builder.S;
    if (!S.drag) return;
    var from = S.drag.from;
    var wasTap = dist(S.drag.x0, S.drag.y0, p.x, p.y) < 10;
    S.drag = null;
    if (wasTap) {
      handleTap(builder, p);
      return;
    }
    var to = nearestEmptySlot(mol, S, p.x, p.y);
    if (to >= 0 && moveEl(mol, S, from, to)) {
      sfx('gate');
      setMsg(builder, null, false);
      renderTray(builder);
      engineRefresh(builder);
      return;
    }
    /* soltou fora: volta ao lugar */
    engineRefresh(builder);
  }

  function sfx(name) {
    if (typeof AudioSys !== 'undefined' && AudioSys && AudioSys.sfx) AudioSys.sfx(name);
  }

  function engineRefresh(builder) {
    if (builder && builder.mode === 'screen') return;
    if (typeof Exercise !== 'undefined' && Exercise && typeof Exercise.refresh === 'function') Exercise.refresh();
  }
  function engineError(builder, amt) {
    if (builder && builder.mode === 'screen') return;
    if (typeof Exercise !== 'undefined' && Exercise) {
      Exercise.errorFlash = Math.max(Exercise.errorFlash || 0, amt);
      Exercise.refresh();
    }
  }

  function setMsg(builder, text, isErr, cls) {
    if (!builder.msgEl) return;
    builder.msgEl.hidden = !text;
    builder.msgEl.className = 'lewis-msg ' + (isErr ? 'bad' : (cls || 'good'));
    builder.msgEl.textContent = text || '';
  }
  function flash(builder, msg) {
    if (msg) setMsg(builder, msg, true);
    engineError(builder, 0.5);
  }

  /* ------------------------------------------------------------------
     BANDEJA DE ELEMENTOS
  ------------------------------------------------------------------ */
  function renderTray(builder) {
    var tray = builder.trayEl;
    if (!tray) return;
    tray.innerHTML = '';
    var mol = builder.mol, S = builder.S;
    trayElements(mol).forEach(function (el) {
      tray.appendChild(makeChip(builder, el));
    });
  }
  function makeChip(builder, el) {
    var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
    var info = E[el] || { color: '#2b3554' };
    var c = document.createElement('button');
    c.className = 'lewis-chip' + (builder.S.picked === el ? ' picked' : '');
    c.style.background = shade(info.color, 0.32);
    c.style.borderColor = info.color;
    c.setAttribute('type', 'button');
    c.disabled = elementLeft(builder.mol, builder.S, el) <= 0;
    c.innerHTML = '<span class="lewis-chip-sym">' + el + '</span>' +
      (c.disabled ? '<span style="font-size:9px;opacity:.7"> · ok</span>' : '');
    c.addEventListener('click', function (e) {
      e.preventDefault();
      if (builder.S.complete || builder.locked) return;
      sfx('click');
      builder.S.picked = (builder.S.picked === el) ? null : el;
      setMsg(builder, null, false);
      renderTray(builder);
      engineRefresh(builder);
    });
    return c;
  }

  /* ------------------------------------------------------------------
     CONTAINER (UI standalone + dentro do motor de exercícios)
  ------------------------------------------------------------------ */
  function bindCanvas(builder) {
    var cv = builder.canvas;
    var startP = null;
    var onDown = function (e) {
      e.preventDefault();
      var p = evtPoint(cv, e);
      startP = p;
      builder.S.drag = null;
      dragStart(builder, p);
    };
    var onMove = function (e) {
      e.preventDefault();
      var p = evtPoint(cv, e);
      if (builder.S.drag) dragMove(builder, p);
    };
    var onUp = function (e) {
      var p = evtPoint(cv, e);
      if (builder.S.drag) {
        dragEnd(builder, p);
      } else if (startP && dist(startP.x, startP.y, p.x, p.y) < 8) {
        handleTap(builder, p);
      }
      startP = null;
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    builder._cleanup = function () {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
    };
  }
  function evtPoint(cv, e) {
    var r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / (r.width || 1) * W,
      y: (e.clientY - r.top) / (r.height || 1) * H
    };
  }

  function resetBuilder(builder) {
    builder.S = newState(builder.mol);
    builder.locked = false;
    setMsg(builder, null, false);
    renderTray(builder);
    renderStepUI(builder);
    engineRefresh(builder);
  }
  function renderStepUI(builder) {
    if (builder.instrEl) builder.instrEl.textContent = instruction(builder.mol, builder.S);
    if (builder.tipEl) builder.tipEl.textContent = 'Dica: ' + hint(builder.mol, builder.S);
  }

  /* ------------------------------------------------------------------
     API PÚBLICA
  ------------------------------------------------------------------ */
  var StructuralBuilder = {
    W: W, H: H,
    MOLECULES: STRUCT_MOLECULES,
    MOL_ORDER: MOL_ORDER,
    newState: newState,
    placeEl: placeEl,
    moveEl: moveEl,
    pickupEl: pickupEl,
    cycleBond: cycleBond,
    validate: validate,
    instruction: instruction,
    hint: hint,
    current: null,

    /* ---- Modo tela standalone ---- */
    enter: function () {
      var container = document.getElementById('structural-stage');
      var chips = document.getElementById('structural-mol-chips');
      if (!container) return;
      var builder = {
        mode: 'screen',
        mol: STRUCT_MOLECULES.H2, molId: 'H2', S: newState(STRUCT_MOLECULES.H2),
        container: container, trayEl: document.getElementById('structural-tray'),
        instrEl: document.getElementById('structural-instruction'),
        tipEl: document.getElementById('structural-dica'),
        msgEl: document.getElementById('structural-msg'),
        chipsEl: chips,
        checkBtn: document.getElementById('btn-structural-check'),
        resetBtn: document.getElementById('btn-structural-reset'),
        canvas: document.getElementById('structural-canvas'),
        locked: false, msgFlash: 0
      };
      this.current = builder;
      this._mountChips(builder, chips);
      this._bindUI(builder);
      this._bindCanvas(builder);
      this._resizeCanvas(builder);
      renderTray(builder);
      renderStepUI(builder);
      this._loop = startLoop(builder);
    },

    exit: function () {
      if (this._loop) stopLoop(this._loop);
      this._loop = null;
      if (this.current) { if (this.current._cleanup) this.current._cleanup(); }
      this.current = null;
    },

    _mountChips: function (builder, chips) {
      if (!chips) return;
      chips.innerHTML = '';
      MOL_ORDER.forEach(function (id) {
        var m = STRUCT_MOLECULES[id];
        var b = document.createElement('button');
        b.className = 'lewis-mol' + (id === builder.molId ? ' active' : '');
        b.type = 'button';
        b.innerHTML = '<span class="lewis-chip-sym">' + m.formula + '</span>';
        b.addEventListener('click', function () {
          sfx('click');
          Array.prototype.forEach.call(chips.querySelectorAll('.lewis-mol'), function (x) {
            x.classList.toggle('active', x === b);
          });
          builder.mol = m;
          builder.molId = id;
          resetBuilder(builder);
        });
        chips.appendChild(b);
      });
    },

    _bindUI: function (builder) {
      if (builder.resetBtn) builder.resetBtn.onclick = function () { sfx('click'); resetBuilder(builder); };
      if (builder.checkBtn) builder.checkBtn.onclick = function () {
        sfx('click');
        var ok = validate(builder.mol, builder.S);
        if (ok) {
          builder.S.complete = true;
          setMsg(builder, 'Fórmula estrutural do ' + builder.mol.formula + ' CORRETA! ' +
            '<span class="lewis-tip">' + builder.mol.tip + '</span>', false, 'good');
          sfx('fusion');
        } else {
          setMsg(builder, 'Ainda não está certo. Confira: todos os átomos posicionados, ' +
            'posições (o ' + builder.mol.slots[0].el + ' no centro) e o TIPO de cada ligação.', true);
        }
      };
    },

    _resizeCanvas: function (builder) {
      var c = builder.canvas;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      builder.dpr = dpr;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.aspectRatio = W + ' / ' + H;
      builder.ctx = c.getContext('2d');
      builder.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    _bindCanvas: function (builder) {
      bindCanvas(builder);
    },

    /* ---- Modo exercício (motor de exercícios) ---- */
    buildExercise: function (x, item) {
      var wrap = document.createElement('div');
      wrap.className = 'lewis-exercise';
      var stage = document.createElement('div');
      stage.className = 'lewis-stage lewis-stage-ex';
      var canvas = document.createElement('canvas');
      canvas.className = 'exercise-canvas';
      stage.appendChild(canvas);
      wrap.appendChild(stage);

      var tray = document.createElement('div');
      tray.className = 'exercise-tray';
      wrap.appendChild(tray);

      var msg = document.createElement('p');
      msg.className = 'lewis-msg';
      msg.hidden = true;
      wrap.appendChild(msg);

      x.body.appendChild(wrap);

      var mol = STRUCT_MOLECULES[item.molecule] || STRUCT_MOLECULES.H2O;
      var builder = {
        mode: 'exercise',
        mol: mol, molId: mol.id, S: newState(mol),
        container: wrap, trayEl: tray, msgEl: msg,
        instrEl: null, tipEl: null,
        checkBtn: null, resetBtn: null,
        canvas: canvas, locked: false, msgFlash: 0
      };
      x.state.structuralBuilder = builder;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      builder.dpr = dpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.aspectRatio = W + ' / ' + H;
      builder.ctx = canvas.getContext('2d');
      builder.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.ctx = builder.ctx;
      x.W = W;
      x.H = H;
      bindCanvas(builder);
      renderTray(builder);
      render(builder.ctx, mol, builder.S, 0);
      return builder;
    },

    destroyExercise: function (x) {
      var b = x && x.state && x.state.structuralBuilder;
      if (b && b._cleanup) b._cleanup();
    },

    resetExercise: function (x) {
      var b = x && x.state && x.state.structuralBuilder;
      if (!b) return;
      b.S = newState(b.mol);
      b.locked = false;
      setMsg(b, null, false);
      renderTray(b);
      engineRefresh(b);
    }
  };

  /* ---------- loop de animação do modo standalone ---------- */
  function startLoop(builder) {
    var running = true, raf = 0;
    (function tick() {
      if (!running) return;
      var t = (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : 0;
      if (builder.ctx) render(builder.ctx, builder.mol, builder.S, t);
      raf = requestAnimationFrame(tick);
    })();
    return {
      stop: function () { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
  }
  function stopLoop(loop) { if (loop && loop.stop) loop.stop(); }

  /* ---------- registrar no motor de exercícios ---------- */
  function exerciseTypes() {
    if (typeof window !== 'undefined' && window.EXERCISE_TYPES) return window.EXERCISE_TYPES;
    if (typeof EXERCISE_TYPES !== 'undefined') return EXERCISE_TYPES;
    return null;
  }
  function exerciseLevels() {
    if (typeof window !== 'undefined' && window.EXERCISE_LEVELS) return window.EXERCISE_LEVELS;
    if (typeof EXERCISE_LEVELS !== 'undefined') return EXERCISE_LEVELS;
    return null;
  }
  function registerExerciseType() {
    var T = exerciseTypes();
    if (!T) return;
    T.structural = {
      name: 'Fórmula Estrutural',
      icon: 'flask',
      build: function (x, item) {
        x.state.structuralBuilder = StructuralBuilder.buildExercise(x, item);
        x.state.structuralReset = function () { StructuralBuilder.resetExercise(x); };
      },
      render: function (x, item) {
        var b = x.state && x.state.structuralBuilder;
        if (b && b.ctx) render(b.ctx, b.mol, b.S, 0);
      },
      collect: function (x) {
        var b = x.state && x.state.structuralBuilder;
        if (!b) return null;
        return { complete: validate(b.mol, b.S) };
      },
      grade: function (item, ans) {
        return !!(ans && ans.complete);
      },
      clear: function (x) {
        StructuralBuilder.resetExercise(x);
      },
      hint: function () {
        return 'Posicione os átomos nos alvos (elemento central no meio) e toque em cada ligação para acertar o tipo: — simples, = dupla, ≡ tripla.';
      }
    };

    var levels = exerciseLevels();
    if (levels && levels[2]) {
      var pushItem = function (def) {
        var already = levels[2].some(function (i) {
          return i.type === 'structural' && i.molecule === def.molecule;
        });
        if (!already) levels[2].push(def);
      };
      pushItem({
        type: 'structural',
        molecule: 'H2O',
        instruction: 'Construa a FÓRMULA ESTRUTURAL da ÁGUA (H₂O): H — O — H, com o oxigênio no centro e ligações SIMPLES (traço).',
        explain: 'Na estrutural usamos TRAÇOS para as ligações (diferente da de Lewis, que usa pontos). O O fica centralizado: H — O — H.',
        pts: 150
      });
      pushItem({
        type: 'structural',
        molecule: 'NH3',
        instruction: 'Construa a FÓRMULA ESTRUTURAL da AMÔNIA (NH₃): o nitrogênio no centro com 3 ligações simples (H em cima, à esquerda e à direita).',
        explain: 'O N faz 3 ligações simples com H. Cada traço representa 1 par de elétrons compartilhado.',
        pts: 150
      });
      pushItem({
        type: 'structural',
        molecule: 'CH4',
        instruction: 'Construa a FÓRMULA ESTRUTURAL do METANO (CH₄): o carbono no centro com 4 ligações simples (os H formam uma cruz).',
        explain: 'O C compartilha 4 elétrons: forma 4 ligações simples, uma com cada H. Estrutural: traços saindo do carbono central.',
        pts: 150
      });
      pushItem({
        type: 'structural',
        molecule: 'CO2',
        instruction: 'Construa a FÓRMULA ESTRUTURAL do GÁS CARBÔNICO (CO₂): O = C = O, com duas LIGAÇÕES DUPLAS (=).',
        explain: 'O C compartilha 2 pares de elétrons com cada O → ligação DUPLA, representada por DOIS traços (=).',
        pts: 150
      });
    }
  }

  /* registrar após o motor de exercícios carregar */
  if (exerciseTypes()) {
    registerExerciseType();
  } else if (typeof window !== 'undefined') {
    setTimeout(registerExerciseType, 0);
  }

  window.StructuralBuilder = StructuralBuilder;
  window.StructuralMolecules = STRUCT_MOLECULES;
})();
