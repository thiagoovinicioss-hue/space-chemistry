/* ============================================================
   SPACE CHEMISTRY — SISTEMA DE EXERCÍCIOS INTERATIVOS
   ------------------------------------------------------------
   Motor MODULAR de desafios para a Máquina de Fusão.

   COMO ADICIONAR UM NOVO TIPO DE EXERCÍCIO
   1. Registre o tipo em EXERCISE_TYPES com a interface:
        name   (string)    — nome exibido do tipo
        icon   (string)    — id de ícone (pixIcon) no cabeçalho
        build  (x, item)   — cria o DOM/canvas da área de resolução
        render (x)         — desenha o canvas (se houver)
        collect(x)         — lê a resposta atual (serializável)
        grade  (item, ans) — compara com item.answerKey (puro)
        clear  (x)         — limpa/recomeça a interação
        hint   (x)         — dica quando a resposta está vazia
   2. Adicione itens { type, instruction, explain, pts, ... } em
      EXERCISE_LEVELS[índice da fase].
   3. Pronto — o resto (confirmação, feedback, pontuação, animação,
      mouse/toque, teclado) é herdado do motor.

   CONTRATO PEDAGÓGICO
   - Cada exercício: instrução · área de resolução · Confirmar ·
     Limpar · feedback · pontuação · indicação de erro · explicação.
   - Erro nunca é só "errado": explica o conceito e permite refazer.
   - Acerto mostra explicação curta + animação de sucesso (confete).
   - Funciona com mouse E toque (Pointer Events) e por teclado.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Cores/ajuda compartilhadas (não colide com script.js)
  ------------------------------------------------------------------ */
  var EX_GOOD = '#5dffa6';
  var EX_BAD = '#ff5d6c';
  var EX_ACCENT = '#59d3ff';
  var LEWIS_ORDER = ['N', 'S', 'E', 'W'];

  /* Zonas de toque da transferência de elétrons (em unidades de canvas).
     Alvos generosos para funcionarem bem no mouse E no toque (celular). */
  var TRANSFER_HIT_R = 22;   /* pegar o elétron do metal */
  var TRANSFER_DROP_R = 52;  /* soltar sobre o ametal */

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  function colorClose(a, b, tol) {
    tol = tol || 90;
    var ra = hexToRgb(a), rb = hexToRgb(b);
    if (!ra || !rb) return true;
    return Math.abs(ra.r - rb.r) + Math.abs(ra.g - rb.g) + Math.abs(ra.b - rb.b) <= tol;
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawElemDot(ctx, el, x, y, r) {
    var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
    var info = E[el] || { color: '#9fb0d8', symbol: el };
    ctx.save();
    ctx.fillStyle = info.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a1030';
    ctx.font = 'bold ' + Math.round(r * 1.05) + 'px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.symbol || el, x, y + 1);
    ctx.restore();
  }
  function ringElectrons(ctx, cx, cy, radius, n, color, takenSet) {
    var i;
    for (i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.PI * 2 * i) / Math.max(1, n);
      var px = cx + Math.cos(a) * radius;
      var py = cy + Math.sin(a) * radius;
      var taken = takenSet ? takenSet.indexOf(i) >= 0 : false;
      ctx.save();
      ctx.fillStyle = taken ? 'rgba(93,255,166,0.55)' : (color || '#59d3ff');
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------
     Manipulação de ponteiro unificada (mouse + toque)
  ------------------------------------------------------------------ */
  function pointFor(x, e) {
    var r = x.cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / (r.width || 1) * x.W,
      y: (e.clientY - r.top) / (r.height || 1) * x.H
    };
  }
  function bindPointer(x, handlers) {
    var down = handlers.down, move = handlers.move, up = handlers.up;
    var onDown = function (e) {
      e.preventDefault();
      x.pointerActive = true;
      if (x.cv.setPointerCapture) { try { x.cv.setPointerCapture(e.pointerId); } catch (err) {} }
      if (down) down(pointFor(x, e), e);
    };
    var onMove = function (e) {
      if (x.pointerActive && move) move(pointFor(x, e), e);
    };
    var onUp = function (e) {
      if (up) up(pointFor(x, e), e);
      x.pointerActive = false;
    };
    var onCancel = function () { x.pointerActive = false; };
    x.cv.addEventListener('pointerdown', onDown);
    x.cv.addEventListener('pointermove', onMove);
    x.cv.addEventListener('pointerup', onUp);
    x.cv.addEventListener('pointercancel', onCancel);
    return function () {
      x.cv.removeEventListener('pointerdown', onDown);
      x.cv.removeEventListener('pointermove', onMove);
      x.cv.removeEventListener('pointerup', onUp);
      x.cv.removeEventListener('pointercancel', onCancel);
    };
  }
  function setupCanvas(x, W, H) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    x.W = W; x.H = H; x.dpr = dpr;
    x.cv = document.createElement('canvas');
    x.cv.className = 'exercise-canvas';
    x.cv.width = Math.round(W * dpr);
    x.cv.height = Math.round(H * dpr);
    x.cv.style.aspectRatio = W + ' / ' + H;
    x.ctx = x.cv.getContext('2d');
    return x.cv;
  }
  function renderStart(x) {
    x.ctx.setTransform(x.dpr, 0, 0, x.dpr, 0, 0);
    x.ctx.clearRect(0, 0, x.W, x.H);
  }

  /* Avalia cobertura por amostragem geométrica (independe de pixels):
     cada amostra dentro de uma região-alvo conta se um traço da COR
     esperada estiver perto. Compartilhado por 'draw' e 'chalkboard'. */
  function gradeRegions(item, ans) {
    if (!ans || !ans.length) return false;
    var regions = item.regions || [];
    if (!regions.length) return false;
    var total = 0, covered = 0, i, j, s, seg, k;
    var W = 460, H = 300;
    for (i = 0; i < regions.length; i++) {
      var rg = regions[i];
      var cx = rg.x * W, cy = rg.y * H, cr = rg.r * W;
      var SAMPLES = 110;
      for (j = 0; j < SAMPLES; j++) {
        var a = Math.random() * Math.PI * 2;
        var rr2 = Math.sqrt(Math.random());
        var px = cx + Math.cos(a) * cr * rr2;
        var py = cy + Math.sin(a) * cr * rr2;
        var hit = false;
        for (k = 0; k < ans.length && !hit; k++) {
          var s2 = ans[k];
          if (s2.mode === 'erase') continue;
          var brushR = (s2.r || 14) + 4;
          for (seg = 1; seg < s2.pts.length && !hit; seg++) {
            var A = s2.pts[seg - 1], B = s2.pts[seg];
            var abx = B.x - A.x, aby = B.y - A.y;
            var len2 = abx * abx + aby * aby;
            var t = len2 ? ((px - A.x) * abx + (py - A.y) * aby) / len2 : 0;
            t = Math.max(0, Math.min(1, t));
            var qx = A.x + abx * t, qy = A.y + aby * t;
            var dx = px - qx, dy = py - qy;
            if (dx * dx + dy * dy <= brushR * brushR && colorClose(s2.color, rg.color, rg.tol || 90)) { hit = true; }
          }
        }
        total++;
        if (hit) covered++;
      }
    }
    var th = item.threshold || 0.55;
    return total > 0 && covered / total >= th;
  }

  /* ---------------- QUADRO DE QUÍMICA (lousa com giz) ---------------- */
  var CHALK_COLORS = { white: '#f4f0e0', red: '#ff5d6c', blue: '#4a9aff' };
  var CHALK_ICONS = { white: 'chalkW', red: 'chalkR', blue: 'chalkB' };
  var CHALK_NAMES = { white: 'branco', red: 'vermelho', blue: 'azul' };

  function chalkText(ctx, text, x, y, color, size) {
    ctx.save();
    ctx.font = 'bold ' + size + 'px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + 1, y + 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function chalkSmudges(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var sx = ((i * 53 + 17) % 100) / 100 * W;
      var sy = ((i * 31 + 43) % 100) / 100 * H;
      var dx = ((i % 5) - 2) * 16;
      ctx.lineWidth = 3 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx, sy + 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function chalkAtomCore(ctx, cx, cy, label, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(235,233,222,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r || 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    chalkText(ctx, label, cx, cy + 1, '#e8e6da', 13);
  }

  function chalkValence(ctx, cx, cy, radius, n) {
    var i;
    ctx.save();
    ctx.strokeStyle = 'rgba(232,230,218,0.9)';
    ctx.lineWidth = 1.5;
    for (i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.PI * 2 * i) / Math.max(1, n);
      var px = cx + Math.cos(a) * radius;
      var py = cy + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function chalkLine(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(235,233,222,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function chalkCation(ctx, cx, cy, label) {
    ctx.save();
    ctx.strokeStyle = 'rgba(235,233,222,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 14, cy - 14, 28, 28);
    ctx.restore();
    chalkText(ctx, label, cx, cy + 1, '#e8e6da', 11);
  }

  function chalkSeaDots(ctx, x, n, x0, y0, xw, yh) {
    var i;
    for (i = 0; i < n; i++) {
      var px = (x0 + ((i * 37 + 11) % 100) / 100 * xw) * x.W;
      var py = (y0 + ((i * 29 + 17) % 100) / 100 * yh) * x.H;
      ctx.save();
      ctx.fillStyle = 'rgba(255,209,102,0.55)';
      ctx.fillRect(px, py, 2.5, 2.5);
      ctx.restore();
    }
  }

  var CHALK_SCENES = {
    atom: function (ctx, x, item) {
      var cx = x.W * 0.5, cy = x.H * 0.58;
      chalkAtomCore(ctx, cx, cy, item.atom || 'O');
      chalkValence(ctx, cx, cy, x.W * 0.13, item.valence || 6);
    },
    ionic: function (ctx, x, item) {
      var y = x.H * 0.56;
      chalkAtomCore(ctx, x.W * 0.3, y, 'Na');
      chalkValence(ctx, x.W * 0.3, y, 40, 1);
      chalkAtomCore(ctx, x.W * 0.7, y, 'Cl');
      chalkValence(ctx, x.W * 0.7, y, 40, 7);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,220,180,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x.W * 0.4, y);
      ctx.lineTo(x.W * 0.52, y);
      ctx.stroke();
      ctx.restore();
      chalkText(ctx, 'doa 1 e\u207B', x.W * 0.46, y - 20, 'rgba(255,220,180,0.9)', 9);
    },
    covalent: function (ctx, x, item) {
      var ox = x.W * 0.5, oy = x.H * 0.58;
      chalkLine(ctx, ox, oy, x.W * 0.32, x.H * 0.32);
      chalkLine(ctx, ox, oy, x.W * 0.68, x.H * 0.32);
      chalkAtomCore(ctx, ox, oy, 'O', 24);
      chalkAtomCore(ctx, x.W * 0.32, x.H * 0.32, 'H', 15);
      chalkAtomCore(ctx, x.W * 0.68, x.H * 0.32, 'H', 15);
      chalkValence(ctx, ox, oy, 40, 2);
      chalkText(ctx, 'compartilham e\u207B', x.W * 0.5, x.H * 0.8, 'rgba(255,230,200,0.9)', 9);
    },
    metal: function (ctx, x, item) {
      var xs = [0.22, 0.5, 0.78], ys = [0.3, 0.62], fx, fy;
      for (fx = 0; fx < xs.length; fx++) for (fy = 0; fy < ys.length; fy++) {
        chalkCation(ctx, xs[fx] * x.W, ys[fy] * x.H, 'Fe');
      }
      chalkSeaDots(ctx, x, 26, 0.18, 0.34, 0.64, 0.32);
      chalkText(ctx, 'c\u00E1tions Fe\u00B2\u207A + e\u207B livres', x.W * 0.5, x.H * 0.84, 'rgba(255,230,200,0.9)', 9);
    },
    revision: function (ctx, x, item) {
      chalkCation(ctx, x.W * 0.3, x.H * 0.42, 'Mg');
      chalkCation(ctx, x.W * 0.7, x.H * 0.42, 'Mg');
      chalkSeaDots(ctx, x, 20, 0.26, 0.56, 0.48, 0.32);
      chalkText(ctx, 'e\u207B livres (mar de el\u00E9trons)', x.W * 0.5, x.H * 0.86, 'rgba(255,230,200,0.9)', 9);
    }
  };

  function chalkBoard(ctx, x, item) {
    var W = x.W, H = x.H;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#244a3c');
    g.addColorStop(0.45, '#1c3a30');
    g.addColorStop(1, '#15281f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(255,255,255,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    chalkSmudges(ctx, W, H);
    if (item.title) chalkText(ctx, item.title, W / 2, 22, '#e8e6da', 11);
    if (item.scene && CHALK_SCENES[item.scene]) CHALK_SCENES[item.scene](ctx, x, item);
    (item.regions || []).forEach(function (rg) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,241,205,0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(rg.x * W, rg.y * H, rg.r * W, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  /* Traço de giz suave: curvas quadráticas pelos pontos médios */
  function drawChalkStroke(ctx, s, color, r) {
    var pts = s.pts, i;
    if (!pts.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = r * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2;
      var my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    var n = pts.length - 1;
    ctx.lineTo(pts[n].x, pts[n].y);
    ctx.stroke();
    ctx.restore();
  }

  /* Poeirinha de giz: grãos fixos ao longo do traço (determinístico) */
  function chalkDust(ctx, s, color) {
    var pts = s.pts, i;
    if (pts.length < 2) return;
    ctx.save();
    ctx.fillStyle = color;
    for (i = 1; i < pts.length; i += 2) {
      var p = pts[i];
      ctx.globalAlpha = 0.16 + 0.08 * (i % 3);
      ctx.fillRect(p.x + ((i * 7) % 5) - 2, p.y + ((i * 13) % 5) - 2, 1.5, 1.5);
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------
     REGISTRO DE TIPOS
  ------------------------------------------------------------------ */
  var EXERCISE_TYPES = {

    /* ============ 1. MÚLTIPLA ESCOLHA ============ */
    choice: {
      name: 'Múltipla escolha',
      icon: 'brain',
      build: function (x, item) {
        var wrap = document.createElement('div');
        wrap.className = 'exercise-opts';
        item.opts.forEach(function (opt, i) {
          var b = document.createElement('button');
          b.className = 'exercise-opt';
          b.innerHTML = '<span class="opt-letter">' + String.fromCharCode(65 + i) + '</span><span>' + opt + '</span>';
          b.addEventListener('click', function () { Exercise.selectChoice(i); });
          wrap.appendChild(b);
        });
        x.body.appendChild(wrap);
        x.state.selected = null;
        x.state.optEls = wrap.querySelectorAll ? Array.prototype.slice.call(wrap.querySelectorAll('.exercise-opt')) : [];
      },
      render: function (x) { Exercise.paintChoice(x); },
      collect: function (x) { return x.state.selected; },
      grade: function (item, ans) { return ans !== null && ans !== undefined && ans === item.ans; },
      clear: function (x) {
        x.state.selected = null;
        Exercise.paintChoice(x);
      },
      hint: function () { return 'Escolha uma alternativa e toque em CONFIRMAR.'; }
    },

    /* ============ 2. ARRASTAR E SOLTAR ============ */
    drag: {
      name: 'Arrastar e soltar',
      icon: 'rocket',
      build: function (x, item) {
        x.state.placed = {};   /* itemId -> slotId */
        x.state.picked = null;

        var slots = document.createElement('div');
        slots.className = 'exercise-slots';
        item.slots.forEach(function (s, i) {
          var d = document.createElement('div');
          d.className = 'exercise-slot';
          d.innerHTML = '<span class="slot-tag">' + s.label + '</span>';
          d.addEventListener('pointerup', function (e) { e.preventDefault(); Exercise.dragDrop(item, i); });
          d.addEventListener('touchend', function (e) { e.preventDefault(); Exercise.dragDrop(item, i); }, { passive: false });
          slots.appendChild(d);
        });
        x.body.appendChild(slots);

        var tray = document.createElement('div');
        tray.className = 'exercise-tray';
        item.items.forEach(function (it, i) {
          var c = document.createElement('div');
          c.className = 'exercise-chip';
          c.style.background = it.color || '#2b3554';
          c.style.borderColor = it.color || '#2b3554';
          var lab = document.createElement('span');
          lab.textContent = it.label;
          c.appendChild(lab);
          var start = function (e) {
            e.preventDefault();
            x.state.picked = it.id;
            AudioSys.sfx('click');
            Exercise.clearFeedback();
          };
          c.addEventListener('pointerdown', start);
          c.addEventListener('touchstart', start, { passive: false });
          tray.appendChild(c);
        });
        x.body.appendChild(tray);
        Exercise.refresh();
      },
      collect: function (x) { return x.state.placed; },
      grade: function (item, ans) {
        var keys = item.items.map(function (it) { return it.id; });
        if (!ans || Object.keys(ans).length !== keys.length) return false;
        return keys.every(function (k) { return ans[k] === item.answerKey[k]; });
      },
      clear: function (x) {
        x.state.placed = {};
        Exercise.refresh();
      },
      hint: function () { return 'Arraste cada cartão para a lacuna correta e confirme.'; }
    },

    /* ============ 3. DESENHO LIVRE ============ */
    draw: {
      name: 'Desenho livre',
      icon: 'sword',
      build: function (x, item) {
        x.cv = setupCanvas(x, 460, 300);
        x.body.appendChild(x.cv);
        x.state.strokes = [];          /* { color, r, pts:[{x,y}] } */
        x.state.color = item.color || '#ffd166';
        x.state.brushR = item.brushR || 14;
        x.state.current = null;
        x.cleanup.push(bindPointer(x, {
          down: function (p) {
            x.state.current = { color: x.state.color, r: x.state.brushR, pts: [p] };
            x.state.strokes.push(x.state.current);
            Exercise.refresh();
          },
          move: function (p) {
            if (x.state.current) { x.state.current.pts.push(p); Exercise.refresh(); }
          },
          up: function () {
            if (x.state.current && x.state.current.pts.length > 1) x.state.current.pts = x.state.current.pts;
            x.state.current = null;
            Exercise.clearFeedback();
          }
        }));
        var hint = document.createElement('p');
        hint.className = 'exercise-micro-hint';
        hint.textContent = 'Pinte com o dedo ou o mouse dentro das áreas destacadas.';
        x.body.appendChild(hint);
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);

        /* Fundo: cátions de um metal (mar de elétrons) */
        if (item.bg === 'sea') {
          var xs = [0.22, 0.5, 0.78], ys = [0.35, 0.65];
          xs.forEach(function (fx) { ys.forEach(function (fy) {
            ctx.save();
            ctx.fillStyle = '#b0b6c4';
            rr(ctx, fx * W - 22, fy * H - 22, 44, 44, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#1a1030';
            ctx.font = 'bold 13px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Fe', fx * W, fy * H + 1);
            ctx.restore();
          }); });
        }

        /* Contornos das regiões-alvo (o que pintar) */
        (item.regions || []).forEach(function (rg) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255,209,102,0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(rg.x * W, rg.y * H, rg.r * W, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        /* Pinceladas do jogador */
        x.state.strokes.forEach(function (s) {
          if (!s.pts.length) return;
          ctx.save();
          ctx.strokeStyle = s.color;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = s.r * 2;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(s.pts[0].x, s.pts[0].y);
          for (var i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
          ctx.stroke();
          ctx.restore();
        });
      },
      collect: function (x) { return x.state.strokes; },
      grade: function (item, ans) { return gradeRegions(item, ans); },
      clear: function (x) {
        x.state.strokes = [];
        x.state.current = null;
        Exercise.refresh();
      },
      hint: function () { return 'Desenhe cobrindo as áreas tracejadas com a cor indicada.'; }
    },

    /* ============ 3B. QUADRO DE QUÍMICA (lousa com giz) ============ */
    chalkboard: {
      name: 'Quadro de Química',
      icon: 'board',
      build: function (x, item) {
        var wrap = document.createElement('div');
        wrap.className = 'chalkboard';
        var frame = document.createElement('div');
        frame.className = 'chalkboard-frame';
        x.cv = setupCanvas(x, 460, 300);
        x.cv.className = 'exercise-canvas chalk-canvas';
        frame.appendChild(x.cv);
        wrap.appendChild(frame);

        x.state = {
          strokes: [], tool: item.defaultChalk || 'white', current: null, bg: null
        };
        var brushR = item.brushR || 11;
        var eraseR = item.eraseR || 18;

        var tray = document.createElement('div');
        tray.className = 'chalk-tray';
        var tools = document.createElement('div');
        tools.className = 'chalk-tools';

        var list = [];
        (item.chalk || ['white', 'red', 'blue']).forEach(function (id) {
          list.push({ id: id, label: 'Giz ' + CHALK_NAMES[id], icon: CHALK_ICONS[id], action: false });
        });
        list.push({ id: 'eraser', label: 'Borracha', icon: 'eraser', action: false });
        list.push({ id: 'clear', label: 'Limpar quadro', icon: 'board', action: true });

        list.forEach(function (t) {
          var b = document.createElement('button');
          b.className = 'chalk-tool' + (t.id === x.state.tool ? ' active' : '');
          b.dataset.tool = t.id;
          b.innerHTML = pixIcon(t.icon, 2) + '<span>' + t.label + '</span>';
          b.addEventListener('click', function () {
            AudioSys.sfx('click');
            if (t.action) {
              x.state.strokes = [];
              x.state.current = null;
              Exercise.refresh();
              return;
            }
            x.state.tool = t.id;
            Array.prototype.forEach.call(tools.querySelectorAll('.chalk-tool'), function (el) {
              el.classList.toggle('active', el.dataset.tool === x.state.tool);
            });
            Exercise.clearFeedback();
          });
          tools.appendChild(b);
        });
        tray.appendChild(tools);
        wrap.appendChild(tray);
        x.body.appendChild(wrap);

        x.cleanup.push(bindPointer(x, {
          down: function (p) {
            var t = x.state.tool;
            if (t === 'clear') return;
            x.state.current = t === 'eraser'
              ? { mode: 'erase', r: eraseR, pts: [p] }
              : { mode: 'chalk', color: CHALK_COLORS[t], r: brushR, pts: [p] };
            x.state.strokes.push(x.state.current);
            Exercise.refresh();
          },
          move: function (p) {
            var s = x.state;
            if (!s.current) return;
            var last = s.current.pts[s.current.pts.length - 1];
            var dx = p.x - last.x, dy = p.y - last.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var step = 5, n = Math.max(1, Math.floor(d / step)), i;
            for (i = 1; i <= n; i++) {
              s.current.pts.push({ x: last.x + dx * i / n, y: last.y + dy * i / n });
            }
            Exercise.refresh();
          },
          up: function () {
            x.state.current = null;
            Exercise.clearFeedback();
          }
        }));
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, i, s;
        if (!x.state.bg) {
          var bg = document.createElement('canvas');
          bg.width = x.cv.width;
          bg.height = x.cv.height;
          var bctx = bg.getContext('2d');
          bctx.setTransform(x.dpr, 0, 0, x.dpr, 0, 0);
          chalkBoard(bctx, x, item);
          x.state.bg = bg;
        }
        ctx.drawImage(x.state.bg, 0, 0, x.cv.width, x.cv.height);

        for (i = 0; i < x.state.strokes.length; i++) {
          s = x.state.strokes[i];
          if (s.mode === 'chalk') { drawChalkStroke(ctx, s, s.color, s.r); chalkDust(ctx, s, s.color); }
        }
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        for (i = 0; i < x.state.strokes.length; i++) {
          s = x.state.strokes[i];
          if (s.mode === 'erase') drawChalkStroke(ctx, s, '#000000', s.r);
        }
        ctx.restore();
      },
      collect: function (x) { return x.state.strokes; },
      grade: function (item, ans) { return gradeRegions(item, ans); },
      clear: function (x) {
        x.state.strokes = [];
        x.state.current = null;
        Exercise.refresh();
      },
      hint: function () {
        return 'Escolha um giz na bandeja, desenhe cobrindo as áreas tracejadas e confirme.';
      }
    },

    /* ============ 4. CONSTRUÇÃO DE ESTRUTURAS ============ */
    structure: {
      name: 'Construção de estruturas',
      icon: 'flask',
      build: function (x, item) {
        x.cv = setupCanvas(x, 460, 300);
        x.body.appendChild(x.cv);
        x.state.placements = {};   /* index do âncora -> el */
        x.state.picked = null;
        x.cleanup.push(bindPointer(x, {
          up: function (p) { Exercise.structureTap(item, p); }
        }));

        var tray = document.createElement('div');
        tray.className = 'exercise-tray';
        item.tray.forEach(function (el) {
          var c = document.createElement('div');
          c.className = 'exercise-chip';
          c.style.background = (typeof ELEMENTS !== 'undefined' && ELEMENTS[el]) ? ELEMENTS[el].color : '#2b3554';
          c.style.borderColor = c.style.background;
          var lab = document.createElement('span');
          lab.textContent = el;
          c.appendChild(lab);
          var start = function (e) {
            e.preventDefault();
            x.state.picked = el;
            AudioSys.sfx('click');
            Exercise.clearFeedback();
            Exercise.refresh();
          };
          c.addEventListener('pointerdown', start);
          c.addEventListener('touchstart', start, { passive: false });
          tray.appendChild(c);
        });
        x.body.appendChild(tray);
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);
        var pts = item.anchors.map(function (a) { return { x: a.x * W, y: a.y * H }; });

        /* Ligações (barras) entre âncoras */
        (item.bonds || []).forEach(function (b) {
          ctx.save();
          ctx.strokeStyle = 'rgba(89,211,255,0.6)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(pts[b.a].x, pts[b.a].y);
          ctx.lineTo(pts[b.b].x, pts[b.b].y);
          ctx.stroke();
          ctx.restore();
        });

        pts.forEach(function (p, i) {
          var el = x.state.placements[i];
          var bad = x.state.badAnchors && x.state.badAnchors[i];
          ctx.save();
          if (el) {
            drawElemDot(ctx, el, p.x, p.y, 26);
            if (bad) {
              ctx.strokeStyle = EX_BAD; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.arc(p.x, p.y, 34, 0, Math.PI * 2); ctx.stroke();
            }
          } else {
            ctx.strokeStyle = bad ? EX_BAD : 'rgba(159,176,216,0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(159,176,216,0.7)';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.anchors[i].label || '?', p.x, p.y + 1);
          }
          ctx.restore();
        });
      },
      collect: function (x) { return x.state.placements; },
      grade: function (item, ans) {
        if (!ans || Object.keys(ans).length !== item.anchors.length) return false;
        return item.anchors.every(function (a, i) { return ans[i] === a.el; });
      },
      clear: function (x) {
        x.state.placements = {};
        x.state.badAnchors = null;
        Exercise.refresh();
      },
      hint: function () { return 'Toque em um elemento da bandeja e depois toque em um círculo para posicionar.'; }
    },

    /* ============ 5. DISTRIBUIÇÃO DE ELÉTRONS ============ */
    electrons: {
      name: 'Distribuição de elétrons',
      icon: 'star',
      build: function (x, item) {
        x.cv = setupCanvas(x, 460, 300);
        x.body.appendChild(x.cv);
        x.state.shells = item.shells.map(function () { return 0; });

        var rows = document.createElement('div');
        rows.className = 'exercise-rows';
        item.shells.forEach(function (sh, i) {
          var row = document.createElement('div');
          row.className = 'exercise-row';
          var lab = document.createElement('span');
          lab.className = 'row-label';
          lab.textContent = 'Camada ' + sh.label + ' (máx ' + sh.max + ')';
          row.appendChild(lab);
          var minus = document.createElement('button');
          minus.className = 'btn btn-small step-btn';
          minus.textContent = '−';
          minus.addEventListener('click', function () { Exercise.stepShell(i, -1); });
          var val = document.createElement('span');
          val.className = 'row-val';
          row.appendChild(minus);
          row.appendChild(val);
          var plus = document.createElement('button');
          plus.className = 'btn btn-small step-btn';
          plus.textContent = '+';
          plus.addEventListener('click', function () { Exercise.stepShell(i, 1); });
          row.appendChild(plus);
          rows.appendChild(row);
          x.state.rowVals = x.state.rowVals || [];
          x.state.rowVals[i] = val;
        });
        x.body.appendChild(rows);
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        var cx = W / 2, cy = H / 2 - 6;
        var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
        var info = E[item.symbol] || { color: '#59d3ff' };

        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);

        item.shells.forEach(function (sh, i) {
          var r = 36 + i * 30;
          ctx.save();
          ctx.strokeStyle = 'rgba(159,176,216,0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          if (x.state.shells[i] > 0) ringElectrons(ctx, cx, cy, r, x.state.shells[i], info.color);
        });

        drawElemDot(ctx, item.symbol, cx, cy, 24);

        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var total = x.state.shells.reduce(function (s, v) { return s + v; }, 0);
        ctx.fillText(item.symbol + ' (Z = ' + item.z + ') · e⁻ totais: ' + total, cx, H - 18);
        ctx.restore();
      },
      collect: function (x) { return x.state.shells.slice(); },
      grade: function (item, ans) {
        if (!ans || ans.length !== item.shells.length) return false;
        return item.shells.every(function (sh, i) {
          return ans[i] === sh.answer && ans[i] <= sh.max;
        });
      },
      clear: function (x) {
        x.state.shells = x.state.shells.map(function () { return 0; });
        Exercise.refresh();
      },
      hint: function () { return 'Use + e − para distribuir os elétrons nas camadas.'; }
    },

    /* ============ 6. TRANSFERÊNCIA DE ELÉTRONS ============ */
    transfer: {
      name: 'Transferência de elétrons',
      icon: 'sword',
      build: function (x, item) {
        x.cv = setupCanvas(x, 460, 300);
        x.body.appendChild(x.cv);
        x.state.moved = [];      /* índices dos elétrons de valência doados */
        x.state.max = item.donor.valence;
        x.state.selected = null; /* elétron escolhido (selecionado/arrastando) */
        x.state.dragging = null;
        x.state.dragPos = null;  /* posição do elétron durante o arrasto */
        x.cleanup.push(bindPointer(x, {
          down: function (p) { Exercise.transferDown(item, p); },
          move: function (p) { Exercise.transferMove(item, p); },
          up: function (p) { Exercise.transferUp(item, p); }
        }));
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);

        var d = item.donor, a = item.acceptor;
        var dx = W * 0.3, dy = H * 0.52, ax = W * 0.7, ay = H * 0.52;
        var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
        var s = x.state;
        var dragging = s.dragging !== null && s.dragging !== undefined;

        /* doador */
        drawElemDot(ctx, d.el, dx, dy, 26);
        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label || (E[d.el] ? E[d.el].name : d.el) + ' (metal)', dx, dy + 52);
        ctx.restore();

        /* seta de direção: do elétron selecionado/arrastado até o ametal */
        var arrowFrom = null;
        if (dragging && s.dragPos) {
          arrowFrom = s.dragPos;
        } else if (s.selected !== null && s.selected !== undefined && s.donorDots && s.donorDots[s.selected]) {
          arrowFrom = { x: s.donorDots[s.selected].x, y: s.donorDots[s.selected].y };
        }
        if (arrowFrom && s.moved.indexOf(s.selected) < 0) {
          drawTransferArrow(ctx, arrowFrom.x, arrowFrom.y, ax, ay);
        }
        /* anel no ametal indicando onde soltar */
        if (dragging || (s.selected !== null && s.selected !== undefined)) {
          ctx.save();
          ctx.strokeStyle = dragging ? 'rgba(93,255,166,0.7)' : 'rgba(255,209,102,0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.arc(ax, ay, TRANSFER_DROP_R - 4, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }

        var donorN = x.state.max;
        var donorDots = [];
        for (var i = 0; i < donorN; i++) {
          var an = -Math.PI / 2 + (Math.PI * 2 * i) / donorN;
          var moved = x.state.moved.indexOf(i) >= 0;
          var hx = dx + Math.cos(an) * 40, hy = dy + Math.sin(an) * 40;
          var active = dragging && i === s.dragging;
          var selected = s.selected === i && !moved;
          donorDots.push({ x: hx, y: hy, i: i, moved: moved });
          var ex = active && s.dragPos ? s.dragPos.x : hx;
          var ey = active && s.dragPos ? s.dragPos.y : hy;
          ctx.save();
          if (moved && !active) {
            ctx.fillStyle = 'rgba(93,255,166,0.2)';
            ctx.strokeStyle = 'rgba(93,255,166,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          } else {
            ctx.fillStyle = '#ffd166';
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = active ? 2.5 : 1.5;
            if (selected) {
              ctx.shadowColor = '#ffd166';
              ctx.shadowBlur = 14;
            }
            ctx.beginPath(); ctx.arc(ex, ey, active ? 9 : 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a1030';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('e−', ex, ey + 1);
          }
          ctx.restore();
        }
        x.state.donorDots = donorDots;

        /* aceitador */
        drawElemDot(ctx, a.el, ax, ay, 26);
        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.label || (E[a.el] ? E[a.el].name : a.el) + ' (ametal)', ax, ay + 52);
        ctx.restore();
        var accN = (a.valence || 7) + item.need;
        for (var j = 0; j < accN; j++) {
          var ang = -Math.PI / 2 + (Math.PI * 2 * j) / accN;
          var extra = j >= (a.valence || 7);
          var px2 = ax + Math.cos(ang) * 40, py2 = ay + Math.sin(ang) * 40;
          ctx.save();
          ctx.fillStyle = extra ? '#5dffa6' : '#7f8fff';
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(px2, py2, extra ? 9 : 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (extra) {
            ctx.fillStyle = '#0a1030';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('e−', px2, py2 + 1);
          }
          ctx.restore();
        }

        /* rótulo de progresso */
        ctx.save();
        ctx.fillStyle = x.state.moved.length === item.need ? EX_GOOD : '#9fb0d8';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(x.state.moved.length + ' / ' + item.need + ' elétron(s) transferido(s)', W / 2, 26);
        ctx.restore();
      },
      collect: function (x) { return x.state.moved; },
      grade: function (item, ans) {
        return Array.isArray(ans) && ans.length === item.need;
      },
      clear: function (x) {
        x.state.moved = [];
        x.state.selected = null;
        x.state.dragging = null;
        x.state.dragPos = null;
        Exercise.refresh();
      },
      hint: function () {
        return 'Clique no elétron amarelo do metal e solte sobre o ametal — ou arraste o elétron até ele.';
      }
    },

    /* ============ 7. FÓRMULA DE LEWIS ============ */
    lewis: {
      name: 'Fórmula de Lewis',
      icon: 'star',
      build: function (x, item) {
        x.cv = setupCanvas(x, 360, 300);
        x.body.appendChild(x.cv);
        x.state.sides = [0, 0, 0, 0];   /* N, S, E, W */
        x.cleanup.push(bindPointer(x, {
          up: function (p) { Exercise.lewisTap(item, p); }
        }));
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        var cx = W / 2, cy = H / 2;
        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);

        /* zona central com o símbolo */
        ctx.save();
        ctx.fillStyle = 'rgba(19,28,66,0.9)';
        rr(ctx, cx - 34, cy - 34, 68, 68, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(89,211,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#eef2ff';
        ctx.font = 'bold 30px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.symbol, cx, cy + 2);
        ctx.restore();

        var gap = 58;
        LEWIS_ORDER.forEach(function (side, i) {
          var n = x.state.sides[i];
          var c = n > 0 ? '#ffd166' : 'rgba(159,176,216,0.35)';
          ctx.save();
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          var zone = {
            N: { x: cx, y: cy - gap, w: 70, h: 34 },
            S: { x: cx - 70, y: cy + gap, w: 70, h: 34 },
            E: { x: cx + gap, y: cy - 70, w: 34, h: 70 },
            W: { x: cx - gap - 34, y: cy - 70, w: 34, h: 70 }
          }[side];
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          ctx.restore();

          /* pontos (até 2 por lado) */
          var dots = [];
          if (side === 'N') dots = [[cx, cy - gap - 12], [cx, cy - gap - 28]];
          if (side === 'S') dots = [[cx, cy + gap + 12], [cx, cy + gap + 28]];
          if (side === 'E') dots = [[cx + gap + 12, cy], [cx + gap + 28, cy]];
          if (side === 'W') dots = [[cx - gap - 12, cy], [cx - gap - 28, cy]];
          for (var d = 0; d < n && d < 2; d++) {
            ctx.save();
            ctx.fillStyle = '#ffd166';
            ctx.beginPath(); ctx.arc(dots[d][0], dots[d][1], 6, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        });

        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var used = x.state.sides.reduce(function (s, v) { return s + v; }, 0);
        ctx.fillText('elétrons de valência: ' + used + ' / ' + item.valence, cx, H - 18);
        ctx.restore();
      },
      collect: function (x) { return x.state.sides.slice(); },
      grade: function (item, ans) {
        if (!ans || ans.length !== 4) return false;
        var total = ans.reduce(function (s, v) { return s + v; }, 0);
        if (total !== item.valence) return false;
        return LEWIS_ORDER.every(function (side, i) { return ans[i] === item.answerKey[i]; });
      },
      clear: function (x) {
        x.state.sides = [0, 0, 0, 0];
        Exercise.refresh();
      },
      hint: function () { return 'Toque nas 4 regiões ao redor do símbolo para adicionar elétrons (máx. 2 por região).'; }
    },

    /* ============ 8. ESQUEMA DE ORBITAIS ============ */
    orbitals: {
      name: 'Esquema de orbitais',
      icon: 'brain',
      build: function (x, item) {
        x.cv = setupCanvas(x, 460, 300);
        x.body.appendChild(x.cv);
        /* cells[orbital] = array de '↑'/'↓'/null, 2 por caixa */
        x.state.cells = item.orbitals.map(function (orb) {
          var arr = [];
          for (var b = 0; b < orb.boxes; b++) arr.push(null, null);
          return arr;
        });
        x.cleanup.push(bindPointer(x, {
          up: function (p) { Exercise.orbitalTap(item, p); }
        }));
        Exercise.refresh();
      },
      render: function (x, item) {
        renderStart(x);
        var ctx = x.ctx, W = x.W, H = x.H;
        var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
        ctx.fillStyle = 'rgba(10,16,48,0.9)';
        ctx.fillRect(0, 0, W, H);

        var y = 40;
        item.orbitals.forEach(function (orb, oi) {
          var x0 = W / 2 - (orb.boxes * 44 - 8) / 2;
          ctx.save();
          ctx.fillStyle = '#9fb0d8';
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(orb.label, x0 - 10, y + 22);
          ctx.restore();
          for (var b = 0; b < orb.boxes; b++) {
            var bx = x0 + b * 44;
            ctx.save();
            ctx.strokeStyle = 'rgba(159,176,216,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, y, 40, 44);
            ctx.beginPath();
            ctx.moveTo(bx, y + 22);
            ctx.lineTo(bx + 40, y + 22);
            ctx.stroke();
            ctx.restore();
            var cell0 = x.state.cells[oi][b * 2];
            var cell1 = x.state.cells[oi][b * 2 + 1];
            if (cell0 === '↑') drawArrow(ctx, bx + 10, y + 16, 'up', EX_GOOD);
            if (cell1 === '↓') drawArrow(ctx, bx + 10, y + 28, 'down', EX_ACCENT);
          }
          y += 56;
        });

        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var total = 0;
        x.state.cells.forEach(function (c) { c.forEach(function (v) { if (v) total++; }); });
        ctx.fillText(item.symbol + ' · elétrons: ' + total + ' / ' + item.z, W / 2, H - 20);
        ctx.restore();
      },
      collect: function (x) {
        return x.state.cells.map(function (c) {
          return c.slice();
        });
      },
      grade: function (item, ans) {
        if (!ans || ans.length !== item.orbitals.length) return false;
        return item.orbitals.every(function (orb, oi) {
          var cells = ans[oi];
          if (!cells) return false;
          var total = cells.reduce(function (s, v) { return s + (v ? 1 : 0); }, 0);
          if (total !== orb.answer) return false;
          var boxes = orb.boxes || 1;
          for (var b = 0; b < boxes; b++) {
            if (cells[b * 2 + 1] && !cells[b * 2]) return false;
          }
          return true;
        });
      },
      clear: function (x) {
        x.state.cells = x.state.cells.map(function (c) { return c.map(function () { return null; }); });
        Exercise.refresh();
      },
      hint: function () { return 'Toque na metade de cima da caixa para colocar ↑ e na de baixo para ↓.'; }
    }
  };

  function drawArrow(ctx, x, y, dir, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    var dy = dir === 'up' ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y - dy * 7);
    ctx.lineTo(x, y + dy * 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, y - dy * 3);
    ctx.lineTo(x, y - dy * 8);
    ctx.lineTo(x + 5, y - dy * 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Seta tracejada mostrando a direção da transferência do elétron */
  function drawTransferArrow(ctx, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 8) return;
    var ux = dx / len, uy = dy / len;
    var tx = x2 - ux * 32, ty = y2 - uy * 32;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,209,102,0.85)';
    ctx.fillStyle = 'rgba(255,209,102,0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x1 + ux * 12, y1 + uy * 12);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tx + ux * 10, ty + uy * 10);
    ctx.lineTo(tx - uy * 6, ty + ux * 6);
    ctx.lineTo(tx + uy * 6, ty - ux * 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------
     DADOS POR FASE (modular: edite estes arrays para novos desafios)
  ------------------------------------------------------------------ */
  var EXERCISE_LEVELS = [
    /* ===== Fase 0 — Estação Orbital (tutorial, geral) ===== */
    [
      {
        type: 'choice',
        instruction: 'Para ficar estável, um átomo geralmente busca quantos elétrons na camada de valência (regra do octeto)?',
        opts: ['2 elétrons', '8 elétrons', '18 elétrons', '32 elétrons'],
        ans: 1,
        explain: 'A regra do octeto: os átomos tendem a ficar com 8 elétrons na camada de valência (apenas 2 para o H). Por isso eles se ligam: doando, recebendo ou compartilhando elétrons.',
        pts: 100
      },
      {
        type: 'electrons',
        instruction: 'Distribua os elétrons do átomo de OXIGÊNIO (Z = 8) nas camadas corretas.',
        symbol: 'O', z: 8,
        shells: [
          { label: 'K', max: 2, answer: 2 },
          { label: 'L', max: 8, answer: 6 }
        ],
        explain: 'O oxigênio tem 8 elétrons: 2 na camada K e 6 na camada L. Faltam 2 elétrons para completar a L — por isso o oxigênio precisa de 2 elétrons para ficar estável.',
        pts: 100
      },
      {
        type: 'lewis',
        instruction: 'Monte a fórmula de Lewis do OXIGÊNIO distribuindo seus 6 elétrons de valência nos 4 lados.',
        symbol: 'O', valence: 6, answerKey: [2, 2, 1, 1],
        explain: 'Os 6 elétrons de valência do O: cada lado recebe 1 elétron primeiro; quando os lados acabam, eles formam pares. Ficam 2 pares e 2 elétrons livres.',
        pts: 100
      },
      {
        type: 'chalkboard',
        scene: 'atom',
        atom: 'O', valence: 6,
        title: 'Camada de valência — O',
        instruction: 'Contorne com o GIZ AZUL os elétrons da camada de valência do oxigênio (a área tracejada ao redor do átomo).',
        defaultChalk: 'blue',
        regions: [{ x: 0.5, y: 0.58, r: 0.16, color: '#4a9aff' }],
        explain: 'O oxigênio (Z = 8) tem 6 elétrons na camada de valência (2s² 2p⁴). Faltam 2 para completar o octeto — por isso ele se liga a outros átomos.',
        pts: 100
      }
    ],

    /* ===== Fase 1 — Planeta Iônico ===== */
    [
      {
        type: 'transfer',
        instruction: 'Transfira o elétron que o SÓDIO (metal) doa para o CLORO (ametal) na ligação iônica.',
        donor: { el: 'Na', valence: 1, label: 'Sódio (metal)' },
        acceptor: { el: 'Cl', valence: 7, label: 'Cloro (ametal)' },
        need: 1,
        explain: 'O Na doa 1 elétron e o Cl recebe: formam-se Na⁺ e Cl⁻, íons de cargas opostas que se atraem — a ligação iônica.',
        pts: 100
      },
      {
        type: 'electrons',
        instruction: 'Distribua os elétrons do SÓDIO (Z = 11) nas camadas corretas.',
        symbol: 'Na', z: 11,
        shells: [
          { label: 'K', max: 2, answer: 2 },
          { label: 'L', max: 8, answer: 8 },
          { label: 'M', max: 8, answer: 1 }
        ],
        explain: 'O sódio tem 11 elétrons: 2 (K), 8 (L) e 1 (M). O elétron isolado da camada M é o que ele doa na ligação iônica.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Na ligação iônica do cloreto de sódio (NaCl), o que acontece com os elétrons?',
        opts: [
          'São compartilhados igualmente entre os átomos',
          'O sódio doa 1 elétron e o cloro recebe',
          'Não há troca de elétrons',
          'O cloro doa 1 elétron ao sódio'
        ],
        ans: 1,
        explain: 'Metal (Na) doa elétrons; ametal (Cl) recebe. Com cargas opostas, Na⁺ e Cl⁻ se atraem fortemente.',
        pts: 100
      },
      {
        type: 'chalkboard',
        scene: 'ionic',
        title: 'Ligação iônica — Na e Cl',
        instruction: 'Pinte com o GIZ AZUL o metal (Na) que DOA elétrons e com o GIZ VERMELHO o ametal (Cl) que RECEBE.',
        defaultChalk: 'blue',
        regions: [
          { x: 0.3, y: 0.56, r: 0.12, color: '#4a9aff' },
          { x: 0.7, y: 0.56, r: 0.12, color: '#ff5d6c' }
        ],
        explain: 'O sódio (metal) doa 1 elétron; o cloro (ametal) recebe. Formam-se Na⁺ e Cl⁻, que se atraem: a ligação iônica.',
        pts: 100
      }
    ],

    /* ===== Fase 2 — Planeta Covalente ===== */
    [
      {
        type: 'choice',
        instruction: 'Na molécula de ÁGUA (H₂O), o oxigênio está no centro ligado a 2 hidrogênios. Que tipo de ligação mantém a molécula?',
        opts: ['Iônica', 'Covalente', 'Metálica', 'De hidrogênio'],
        ans: 1,
        explain: 'Na água, o O (central) compartilha elétrons com 2 hidrogênios. Ametal + ametal compartilham elétrons: ligação covalente.',
        pts: 100
      },
      {
        type: 'lewis',
        instruction: 'Monte a fórmula de Lewis do CARBONO distribuindo seus 4 elétrons de valência.',
        symbol: 'C', valence: 4, answerKey: [1, 1, 1, 1],
        explain: 'O carbono tem 4 elétrons de valência. Pela regra de Hund (aplicada aos lados), cada lado recebe 1 elétron antes de formar pares.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Dois ametais (por exemplo, O e H) se ligam compartilhando elétrons. Que tipo de ligação é essa?',
        opts: ['Iônica', 'Covalente', 'Metálica', 'De hidrogênio'],
        ans: 1,
        explain: 'Ametal + ametal compartilham elétrons → covalente. Metal + ametal → iônica. Metal + metal → metálica.',
        pts: 100
      },
      {
        type: 'chalkboard',
        scene: 'covalent',
        title: 'Ligação covalente — H₂O',
        instruction: 'Contorne com o GIZ BRANCO os pares de elétrons COMPARTILHADOS (as ligações entre o O e cada H, nas áreas tracejadas).',
        defaultChalk: 'white',
        regions: [
          { x: 0.41, y: 0.44, r: 0.06, color: '#f4f0e0' },
          { x: 0.59, y: 0.44, r: 0.06, color: '#f4f0e0' }
        ],
        explain: 'O e H são ametais e compartilham elétrons em pares: cada ligação O–H é um par de elétrons compartilhado — a ligação covalente.',
        pts: 100
      }
    ],

    /* ===== Fase 3 — Planeta Metálico ===== */
    [
      {
        type: 'choice',
        instruction: 'Classifique: NaCl é ligação ___, CO₂ é ligação ___ e Au (ouro puro) é ligação ___.',
        opts: [
          'Iônica, Covalente, Metálica',
          'Covalente, Iônica, Metálica',
          'Metálica, Covalente, Iônica',
          'Iônica, Metálica, Covalente'
        ],
        ans: 0,
        explain: 'NaCl: metal (Na) + ametal (Cl) = iônica. CO₂: ametal (C) + ametal (O) = covalente. Au: metal puro = metálica (mar de elétrons).',
        pts: 100
      },
      {
        type: 'draw',
        instruction: 'Pinte o MAR DE ELÉTRONS: cubra as áreas tracejadas entre os cátions de ferro.',
        bg: 'sea',
        color: '#ffd166',
        regions: [
          { x: 0.36, y: 0.5, r: 0.15, color: '#ffd166' },
          { x: 0.64, y: 0.5, r: 0.15, color: '#ffd166' },
          { x: 0.5, y: 0.28, r: 0.13, color: '#ffd166' },
          { x: 0.5, y: 0.72, r: 0.13, color: '#ffd166' }
        ],
        explain: 'Nos metais, os elétrons de valência ficam livres e deslocalizados entre os cátions — o "mar de elétrons". É isso que conduz eletricidade e calor.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Por que os metais conduzem eletricidade mesmo no estado sólido?',
        opts: [
          'Porque têm elétrons livres (mar de elétrons)',
          'Porque formam grandes moléculas',
          'Porque os átomos se movem livremente',
          'Na verdade, os metais não conduzem'
        ],
        ans: 0,
        explain: 'Os elétrons de valência dos metais estão livres e móveis (mar de elétrons), conduzindo corrente elétrica mesmo sólidos.',
        pts: 100
      },
      {
        type: 'chalkboard',
        scene: 'metal',
        title: 'Metais — mar de elétrons',
        instruction: 'Pinte com o GIZ VERMELHO o MAR DE ELÉTRONS: a região tracejada entre os cátions de ferro por onde os elétrons fluem.',
        defaultChalk: 'red',
        regions: [{ x: 0.5, y: 0.72, r: 0.16, color: '#ff5d6c' }],
        explain: 'Nos metais os elétrons de valência ficam deslocalizados entre os cátions — o "mar de elétrons" que conduz corrente e calor.',
        pts: 100
      }
    ],

    /* ===== Fase 4 — Planeta Final (revisão geral) ===== */
    [
      {
        type: 'choice',
        instruction: 'No cloreto de sódio (NaCl), os íons Na⁺ e Cl⁻ se alternam formando uma rede cristalina. Que tipo de ligação forma essa rede?',
        opts: ['Covalente', 'Metálica', 'Iônica', 'De hidrogênio'],
        ans: 2,
        explain: 'No retículo iônico, Na⁺ e Cl⁻ se alternam: cada cátion se rodeia de ânions e vice-versa, formando uma rede cristalina por atração eletrostática.',
        pts: 100
      },
      {
        type: 'orbitals',
        instruction: 'Preencha o esquema de orbitais do NITROGÊNIO (Z = 7) com ↑ e ↓.',
        symbol: 'N', z: 7,
        orbitals: [
          { label: '1s', boxes: 1, answer: 2 },
          { label: '2s', boxes: 1, answer: 2 },
          { label: '2p', boxes: 3, answer: 3 }
        ],
        explain: 'Nitrogênio (7 e⁻): 1s², 2s², 2p³. Pela regra de Hund, os 3 orbitais 2p recebem 1 elétron cada (todos ↑) antes de qualquer par.',
        pts: 100
      },
      {
        type: 'transfer',
        instruction: 'Transfira o elétron que o POTÁSSIO (metal) doa ao CLORO (ametal).',
        donor: { el: 'K', valence: 1, label: 'Potássio (metal)' },
        acceptor: { el: 'Cl', valence: 7, label: 'Cloro (ametal)' },
        need: 1,
        explain: 'O K doa 1 elétron ao Cl: formam-se K⁺ e Cl⁻, uma ligação iônica como o NaCl.',
        pts: 100
      },
      {
        type: 'chalkboard',
        scene: 'revision',
        title: 'Revisão — cátion e mar de elétrons',
        instruction: 'Pinte com o GIZ AZUL o cátion de magnésio e com o GIZ BRANCO o mar de elétrons ao redor dos cátions.',
        defaultChalk: 'blue',
        regions: [
          { x: 0.3, y: 0.42, r: 0.11, color: '#4a9aff' },
          { x: 0.5, y: 0.74, r: 0.14, color: '#f4f0e0' }
        ],
        explain: 'O Mg perde 2 elétrons e vira Mg²⁺; os elétrons perdidos ficam livres no mar de elétrons que mantém os cátions unidos.',
        pts: 100
      }
    ]
  ];

  /* ------------------------------------------------------------------
     MOTOR
  ------------------------------------------------------------------ */
  var Exercise = {
    session: null,     /* itens da fase */
    idx: 0,
    attempts: 0,
    answered: false,
    x: null,           /* contexto de interação do item atual */
    fx: [],            /* confetes */
    errorFlash: 0,

    /* --- controle de sessão --- */
    start: function () {
      var lv = Game.level;
      if (!lv || lv.exerciseDone) return;
      var list = (typeof EXERCISE_LEVELS !== 'undefined') ? (EXERCISE_LEVELS[Game.levelIndex] || []) : [];
      if (!list.length) return;
      lv.exerciseDone = true;
      lv.quizDone = true;
      this.session = list.slice();
      this.idx = 0;
      this.attempts = 0;
      this.answered = false;
      Game.exerciseStats = { correct: 0, total: this.session.length, score: 0 };
      Game.phase = 'challenge';
      Game.locked = true;
      document.getElementById('exercise').hidden = false;
      AudioSys.sfx('fusion');
      this.show();
    },

    show: function () {
      var item = this.session[this.idx];
      var type = EXERCISE_TYPES[item.type];
      this.attempts = 0;
      this.answered = false;
      this.errorFlash = 0;
      this.fx = [];
      if (this.x && this.x.cleanup) { this.x.cleanup.forEach(function (f) { f(); }); }
      this.x = { state: {}, cleanup: [], body: null, dirty: true };

      document.getElementById('ex-progress').textContent =
        'Desafio ' + (this.idx + 1) + ' de ' + this.session.length +
        ' · Acertos: ' + Game.exerciseStats.correct;
      var typeEl = document.getElementById('ex-type');
      typeEl.innerHTML = pixIcon(type.icon, 1) + ' ' + type.name;
      document.getElementById('ex-instruction').textContent = item.instruction;
      document.getElementById('ex-explain').hidden = true;
      document.getElementById('btn-ex-next').hidden = true;
      document.getElementById('btn-ex-check').hidden = false;
      document.getElementById('btn-ex-clear').hidden = false;
      this.updateScoreUI();

      var body = document.getElementById('ex-body');
      body.innerHTML = '';
      this.x.body = body;
      type.build(this.x, item);
      this.render();
    },

    /* --- desenho --- */
    render: function () {
      var item = this.session ? this.session[this.idx] : null;
      if (!item || !this.x) return;
      var type = EXERCISE_TYPES[item.type];
      if (type.render) type.render(this.x, item);
      this.drawFx();
      if (this.errorFlash > 0 && this.x.ctx) {
        this.x.ctx.save();
        this.x.ctx.globalAlpha = Math.min(0.5, this.errorFlash * 0.9);
        this.x.ctx.fillStyle = EX_BAD;
        this.x.ctx.fillRect(0, 0, this.x.W, this.x.H);
        this.x.ctx.restore();
      }
    },
    refresh: function () { this.render(); },

    /* --- confetes --- */
    drawFx: function () {
      var ctx = this.x && this.x.ctx;
      if (!ctx) return;
      var W = this.x.W, H = this.x.H;
      for (var i = 0; i < this.fx.length; i++) {
        var p = this.fx[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    },
    celebrate: function () {
      var colors = ['#59d3ff', '#ff9df2', '#ffd166', '#5dffa6', '#ff8a5d'];
      var W = this.x ? this.x.W : 460, H = this.x ? this.x.H : 300;
      for (var i = 0; i < 46; i++) {
        this.fx.push({
          x: W / 2, y: H / 2,
          vx: rand(-160, 160), vy: rand(-240, -40),
          rot: rand(0, 6.28), vr: rand(-9, 9),
          color: colors[randInt(0, colors.length - 1)],
          size: rand(5, 9), life: 1
        });
      }
    },

    /* --- atualização (animação de confete + flash de erro) --- */
    update: function (dt) {
      if (!this.x || !this.fx.length && !(this.errorFlash > 0)) return;
      var i;
      for (i = this.fx.length - 1; i >= 0; i--) {
        var p = this.fx[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt;
        p.rot += p.vr * dt;
        p.life -= dt * 1.4;
        if (p.life <= 0 || p.y > (this.x ? this.x.H + 30 : 330)) this.fx.splice(i, 1);
      }
      if (this.errorFlash > 0) this.errorFlash = Math.max(0, this.errorFlash - dt * 1.4);
      this.render();
    },

    /* --- feedback --- */
    clearFeedback: function () {
      var el = document.getElementById('ex-explain');
      if (el && el.hidden === false) el.hidden = true;
      if (this.x) this.x.errorFlash = 0;
    },
    setFeedback: function (good, text) {
      var el = document.getElementById('ex-explain');
      el.className = 'exercise-explain ' + (good ? 'good' : 'bad');
      el.innerHTML = (good
        ? pixIcon('check', 1) + ' ' + text
        : pixIcon('cross', 1) + ' ' + text);
      el.hidden = false;
    },

    /* --- pontuação --- */
    updateScoreUI: function () {
      var el = document.getElementById('ex-score');
      if (el) el.textContent = Game.exerciseStats.score + ' pts';
    },

    /* --- ações --- */
    confirm: function () {
      var item = this.session ? this.session[this.idx] : null;
      if (!item || this.answered || !this.x) return;
      var type = EXERCISE_TYPES[item.type];
      var ans = type.collect(this.x);
      var ok = type.grade(item, ans);

      this.attempts++;
      if (ok) {
        this.answered = true;
        Game.exerciseStats.correct++;
        var gain = this.attempts === 1 ? (item.pts || 100) : Math.max(10, Math.round((item.pts || 100) / 2));
        if (!Game.replay) Game.run.score += gain;
        Game.exerciseStats.score += gain;
        updateHudScore();
        this.updateScoreUI();
        AudioSys.sfx('quizRight');
        this.celebrate();
        this.setFeedback(true, 'Correto! +' + gain + ' pontos.<br><span class="explain-text">' + item.explain + '</span>');
        document.getElementById('btn-ex-check').hidden = true;
        document.getElementById('btn-ex-clear').hidden = true;
        document.getElementById('btn-ex-next').hidden = false;
        this.render();
      } else {
        Game.run.wrong++;
        AudioSys.sfx('quizWrong');
        shake(8);
        this.errorFlash = 0.8;
        this.markError(item, type);
        var empty = this.isEmptyAnswer(type, ans);
        this.setFeedback(false, empty
          ? 'Ainda não respondeu!<br><span class="explain-text">' + type.hint(this.x) + '</span>'
          : 'Não é bem isso.<br><span class="explain-text">Relembre o conceito: ' + item.explain + '</span>');
        this.render();
      }
    },

    isEmptyAnswer: function (type, ans) {
      if (type === EXERCISE_TYPES.choice) return ans === null || ans === undefined;
      if (Array.isArray(ans)) {
        if (type === EXERCISE_TYPES.draw) return !ans.length;
        return ans.every(function (v) { return v === 0 || v === null; });
      }
      if (ans && typeof ans === 'object') return Object.keys(ans).length === 0;
      return !ans;
    },

    markError: function (item, type) {
      if (type === EXERCISE_TYPES.structure && this.x.state.placements) {
        var bad = {};
        item.anchors.forEach(function (a, i) {
          if (this.x.state.placements[i] !== a.el) bad[i] = true;
        }, this);
        this.x.state.badAnchors = bad;
      }
    },

    clear: function () {
      var item = this.session ? this.session[this.idx] : null;
      if (!item || this.answered) return;
      var type = EXERCISE_TYPES[item.type];
      AudioSys.sfx('click');
      type.clear(this.x);
      this.clearFeedback();
      this.x.errorFlash = 0;
      this.x.dirty = true;
      this.render();
    },

    next: function () {
      if (!this.answered) return;
      AudioSys.sfx('click');
      this.idx++;
      if (this.idx >= this.session.length) { this.finish(); return; }
      this.show();
    },

    finish: function () {
      document.getElementById('exercise').hidden = true;
      Game.phase = 'explore';
      Game.locked = false;
      var idx = Game.levelIndex;
      if (Game.exerciseStats.score > (Save.data.exerciseBest[idx] || 0)) {
        Save.data.exerciseBest[idx] = Game.exerciseStats.score;
        Save.save();
      }
      if (typeof showMission === 'function') showMission();
    },

    /* --- teclado --- */
    onKey: function (e) {
      if (!this.session || this.answered && document.getElementById('btn-ex-next').hidden) return;
      var nextBtn = document.getElementById('btn-ex-next');
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (!nextBtn.hidden) { nextBtn.click(); return; }
        this.confirm();
        return;
      }
      var item = this.session[this.idx];
      if (item && item.type === 'choice') {
        var map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
        if (e.code in map) this.selectChoice(map[e.code]);
      }
    },

    /* --- interações específicas (chamadas pelos handlers dos tipos) --- */
    selectChoice: function (i) {
      if (!this.x || this.answered) return;
      var item = this.session[this.idx];
      if (i >= item.opts.length) return;
      this.x.state.selected = i;
      AudioSys.sfx('click');
      this.clearFeedback();
      this.paintChoice(this.x);
    },
    paintChoice: function (x) {
      if (!x || !x.state || !x.state.optEls || !x.state.optEls.length) return;
      var item = this.session ? this.session[this.idx] : null;
      x.state.optEls.forEach(function (el, i) {
        el.classList.remove('selected', 'correct', 'wrong');
        if (item && this.answered && i === item.ans) el.classList.add('correct');
        else if (x.state.selected === i) el.classList.add('selected');
      }, this);
    },

    dragDrop: function (item, slotIdx) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      if (!s.picked) return;
      var slotId = item.slots[slotIdx].id;
      var already = Object.keys(s.placed).filter(function (k) { return s.placed[k] === slotId; });
      already.forEach(function (k) { delete s.placed[k]; });
      s.placed[s.picked] = slotId;
      s.picked = null;
      AudioSys.sfx('gate');
      this.clearFeedback();
      this.refresh();
    },

    stepShell: function (i, delta) {
      if (this.answered || !this.x) return;
      var item = this.session[this.idx];
      var sh = item.shells[i];
      var v = clamp(this.x.state.shells[i] + delta, 0, sh.max);
      this.x.state.shells[i] = v;
      if (this.x.state.rowVals[i]) this.x.state.rowVals[i].textContent = String(v);
      AudioSys.sfx('click');
      this.clearFeedback();
      this.refresh();
    },

    structureTap: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      var best = -1, bd = 1e9;
      item.anchors.forEach(function (a, i) {
        var d = dist(p.x, p.y, a.x * this.x.W, a.y * this.x.H);
        if (d < 40 && d < bd) { bd = d; best = i; }
      }, this);
      if (best >= 0) {
        if (s.picked) {
          s.placements[best] = s.picked;
          s.picked = null;
          AudioSys.sfx('gate');
        } else if (s.placements[best]) {
          delete s.placements[best];
        }
        s.badAnchors = null;
        this.clearFeedback();
        this.refresh();
      }
    },

    /* Elétron do metal mais próximo do toque que ainda não foi transferido */
    transferHit: function (item, p) {
      var s = this.x.state;
      var best = -1, bd = 1e9;
      (s.donorDots || []).forEach(function (d) {
        if (d.moved) return;
        var dd = dist(p.x, p.y, d.x, d.y);
        if (dd < TRANSFER_HIT_R && dd < bd) { bd = dd; best = d.i; }
      });
      return best;
    },

    transferDown: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      var hit = this.transferHit(item, p);
      if (hit < 0) return;
      s.selected = hit;
      s.dragging = hit;
      s.dragPos = { x: p.x, y: p.y };
      AudioSys.sfx('click');
      this.clearFeedback();
      this.refresh();
    },

    transferMove: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      if (s.dragging === null || s.dragging === undefined) return;
      s.dragPos = { x: p.x, y: p.y };
      this.refresh();
    },

    transferUp: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      if (s.dragging !== null && s.dragging !== undefined) {
        var i = s.dragging;
        var home = (s.donorDots || [])[i];
        var ax = this.x.W * 0.7, ay = this.x.H * 0.52;
        var onDrop = dist(p.x, p.y, ax, ay) < TRANSFER_DROP_R;
        var onHome = home && dist(p.x, p.y, home.x, home.y) < TRANSFER_HIT_R;
        s.dragging = null;
        s.dragPos = null;
        if (onDrop || onHome) {
          if (s.moved.indexOf(i) < 0) s.moved.push(i);
          s.selected = null;
          AudioSys.sfx('gate');
          this.clearFeedback();
          this.refresh();
          return;
        }
        s.selected = null;
        this.clearFeedback();
        this.refresh();
        return;
      }
      /* tocar no ametal sem arrastar desfaz a última transferência */
      var aX = this.x.W * 0.7, aY = this.x.H * 0.52;
      if (dist(p.x, p.y, aX, aY) < TRANSFER_DROP_R && s.moved.length) {
        s.moved.pop();
        AudioSys.sfx('click');
        this.clearFeedback();
        this.refresh();
      }
    },

    lewisTap: function (item, p) {
      if (this.answered || !this.x) return;
      var cx = this.x.W / 2, cy = this.x.H / 2, gap = 58;
      var zones = {
        N: { x: cx - 35, y: cy - gap - 17, w: 70, h: 34 },
        S: { x: cx - 35, y: cy + gap - 17, w: 70, h: 34 },
        E: { x: cx + gap - 17, y: cy - 35, w: 34, h: 70 },
        W: { x: cx - gap - 17, y: cy - 35, w: 34, h: 70 }
      };
      var s = this.x.state;
      LEWIS_ORDER.forEach(function (side, i) {
        var z = zones[side];
        if (p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) {
          s.sides[i] = (s.sides[i] + 1) % 3;   /* 0 → 1 → 2 → 0 */
        }
      });
      AudioSys.sfx('click');
      this.clearFeedback();
      this.refresh();
    },

    orbitalTap: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      var y = 40, boxW = 40, boxH = 44;
      for (var oi = 0; oi < item.orbitals.length; oi++) {
        var orb = item.orbitals[oi];
        var x0 = this.x.W / 2 - (orb.boxes * 44 - 8) / 2;
        for (var b = 0; b < orb.boxes; b++) {
          var bx = x0 + b * 44;
          if (p.x >= bx && p.x <= bx + boxW && p.y >= y && p.y <= y + boxH) {
            var up = p.y < y + boxH / 2;
            var ci = b * 2 + (up ? 0 : 1);
            if (up) {
              s.cells[oi][ci] = s.cells[oi][ci] === '↑' ? null : '↑';
              s.cells[oi][ci + 1] = null;
            } else {
              if (!s.cells[oi][b * 2]) {
                /* 2º elétron precisa do 1º ↑ na mesma caixa */
                AudioSys.sfx('error');
                this.errorFlash = 0.5;
                this.refresh();
                return;
              }
              s.cells[oi][ci] = s.cells[oi][ci] === '↓' ? null : '↓';
            }
            AudioSys.sfx('click');
            this.clearFeedback();
            this.refresh();
            return;
          }
        }
        y += 56;
      }
    }
  };

  window.Exercise = Exercise;
  window.EXERCISE_TYPES = EXERCISE_TYPES;
  window.EXERCISE_LEVELS = EXERCISE_LEVELS;

  /* ------------------------------------------------------------------
     Botões do overlay (self-wired — funciona com mouse e toque)
  ------------------------------------------------------------------ */
  function wire(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }
  wire('btn-ex-check', function () { AudioSys.sfx('click'); Exercise.confirm(); });
  wire('btn-ex-clear', function () { Exercise.clear(); });
  wire('btn-ex-next', function () { AudioSys.sfx('click'); Exercise.next(); });
})();
