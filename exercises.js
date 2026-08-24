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
     esperada estiver perto. Compartilhado por 'draw'. */
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

    /* ============ 1B. RESPOSTA DIGITADA ============ */
    'text-input': {
      name: 'Resposta digitada',
      icon: 'brain',
      build: function (x, item) {
        var wrap = document.createElement('div');
        wrap.style.textAlign = 'center';
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'exercise-text-input';
        inp.placeholder = item.placeholder || 'Digite sua resposta aqui...';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        inp.addEventListener('input', function () {
          x.state.text = inp.value;
          Exercise.clearFeedback();
        });
        inp.addEventListener('keydown', function (e) { e.stopPropagation(); });
        wrap.appendChild(inp);
        x.body.appendChild(wrap);
        x.state.text = '';
        x.state.inputEl = inp;
        setTimeout(function () { inp.focus(); }, 60);
      },
      collect: function (x) { return x.state.text || ''; },
      grade: function (item, ans) {
        var norm = (ans || '').trim().toLowerCase().replace(/\s+/g, ' ');
        return norm === item.answer;
      },
      clear: function (x) {
        x.state.text = '';
        if (x.state.inputEl) x.state.inputEl.value = '';
      },
      hint: function () { return 'Digite sua resposta no campo de texto e toque em CONFIRMAR.'; }
    },

    /* ============ 1C. SELEÇÃO NA TABELA PERIÓDICA ============ */
    'periodic-select': {
      name: 'Tabela Periódica',
      icon: 'flask',
      build: function (x, item) {
        var allEl = (typeof PT_ELEMENTS !== 'undefined') ? PT_ELEMENTS : [];
        x.state.selected = {};
        x.state.countEl = null;

        var counter = document.createElement('p');
        counter.className = 'ptsel-counter';
        counter.textContent = 'Selecionados: 0/' + item.need;
        x.state.countEl = counter;
        x.body.appendChild(counter);

        var grid = document.createElement('div');
        grid.className = 'ptsel-grid';
        allEl.forEach(function (el) {
          var tile = document.createElement('div');
          tile.className = 'ptsel-tile';
          tile.dataset.sym = el.s;
          tile.innerHTML = '<span class="ptsel-sym">' + el.s + '</span><span class="ptsel-nm">' + el.n + '</span>';
          tile.addEventListener('click', function () {
            if (x.state.selected[el.s]) {
              delete x.state.selected[el.s];
              tile.classList.remove('ptsel-tile--on');
            } else {
              x.state.selected[el.s] = true;
              tile.classList.add('ptsel-tile--on');
            }
            var n = Object.keys(x.state.selected).length;
            counter.textContent = 'Selecionados: ' + n + '/' + item.need;
            Exercise.clearFeedback();
          });
          grid.appendChild(tile);
        });
        x.body.appendChild(grid);
        Exercise.refresh();
      },
      collect: function (x) { return Object.keys(x.state.selected).sort(); },
      grade: function (item, ans) {
        if (!ans || ans.length !== item.answer.length) return false;
        var sorted = item.answer.slice().sort();
        for (var i = 0; i < sorted.length; i++) {
          if (ans[i] !== sorted[i]) return false;
        }
        return true;
      },
      clear: function (x) {
        x.state.selected = {};
        var tiles = x.body.querySelectorAll('.ptsel-tile--on');
        for (var i = 0; i < tiles.length; i++) tiles[i].classList.remove('ptsel-tile--on');
        if (x.state.countEl) x.state.countEl.textContent = 'Selecionados: 0/' + (x.body.closest('.exercise-body') ? 5 : 5);
      },
      hint: function () { return 'Selecione os elementos na tabela e toque em CONFIRMAR.'; }
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

        var d = item.donor;
        var accs = item.acceptors || [item.acceptor];
        var dx = W * 0.3, dy = H * 0.52;
        var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
        var s = x.state;
        var dragging = s.dragging !== null && s.dragging !== undefined;
        var isMulti = accs.length > 1;

        /* doador */
        drawElemDot(ctx, d.el, dx, dy, 26);
        ctx.save();
        ctx.fillStyle = '#9fb0d8';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label || (E[d.el] ? E[d.el].name : d.el) + ' (metal)', dx, dy + 52);
        ctx.restore();

        /* seta de direção: do elétron selecionado/arrastado até o ametal mais próximo */
        var arrowFrom = null;
        if (dragging && s.dragPos) {
          arrowFrom = s.dragPos;
        } else if (s.selected !== null && s.selected !== undefined && s.donorDots && s.donorDots[s.selected]) {
          arrowFrom = { x: s.donorDots[s.selected].x, y: s.donorDots[s.selected].y };
        }
        if (arrowFrom && s.moved.indexOf(s.selected) < 0) {
          var arrowTarget = isMulti ? s.nearestAccept : { x: W * 0.7, y: H * 0.52 };
          if (arrowTarget) drawTransferArrow(ctx, arrowFrom.x, arrowFrom.y, arrowTarget.x, arrowTarget.y);
        }
        /* anel no ametal indicando onde soltar */
        if (dragging || (s.selected !== null && s.selected !== undefined)) {
          var ringTarget = isMulti ? s.nearestAccept : { x: W * 0.7, y: H * 0.52 };
          if (ringTarget) {
            ctx.save();
            ctx.strokeStyle = dragging ? 'rgba(93,255,166,0.7)' : 'rgba(255,209,102,0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.beginPath(); ctx.arc(ringTarget.x, ringTarget.y, TRANSFER_DROP_R - 4, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          }
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

        /* aceitador(es) */
        var accPositions = [];
        if (isMulti) {
          var gap = Math.min(80, (H - 60) / (accs.length - 1 || 1));
          var startY = H / 2 - ((accs.length - 1) * gap) / 2;
          accs.forEach(function (a, idx) {
            var ax2 = W * 0.7, ay2 = startY + idx * gap;
            accPositions.push({ x: ax2, y: ay2 });
            drawElemDot(ctx, a.el, ax2, ay2, 22);
            ctx.save();
            ctx.fillStyle = '#9fb0d8';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.label || (E[a.el] ? E[a.el].name : a.el) + ' (ametal)', ax2, ay2 + 38);
            ctx.restore();
            var accN = (a.valence || 7) + (a.accepts || 1);
            for (var j = 0; j < accN; j++) {
              var ang = -Math.PI / 2 + (Math.PI * 2 * j) / accN;
              var extra = j >= (a.valence || 7);
              var px2 = ax2 + Math.cos(ang) * 32, py2 = ay2 + Math.sin(ang) * 32;
              ctx.save();
              ctx.fillStyle = extra ? '#5dffa6' : '#7f8fff';
              ctx.strokeStyle = 'rgba(255,255,255,0.6)';
              ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.arc(px2, py2, extra ? 8 : 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
              if (extra) {
                ctx.fillStyle = '#0a1030';
                ctx.font = '7px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('e−', px2, py2 + 1);
              }
              ctx.restore();
            }
          });
        } else {
          var a = accs[0];
          var ax2 = W * 0.7, ay2 = H * 0.52;
          accPositions.push({ x: ax2, y: ay2 });
          drawElemDot(ctx, a.el, ax2, ay2, 26);
          ctx.save();
          ctx.fillStyle = '#9fb0d8';
          ctx.font = '11px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(a.label || (E[a.el] ? E[a.el].name : a.el) + ' (ametal)', ax2, ay2 + 52);
          ctx.restore();
          var accN2 = (a.valence || 7) + item.need;
          for (var j2 = 0; j2 < accN2; j2++) {
            var ang2 = -Math.PI / 2 + (Math.PI * 2 * j2) / accN2;
            var extra2 = j2 >= (a.valence || 7);
            var px3 = ax2 + Math.cos(ang2) * 40, py3 = ay2 + Math.sin(ang2) * 40;
            ctx.save();
            ctx.fillStyle = extra2 ? '#5dffa6' : '#7f8fff';
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(px3, py3, extra2 ? 9 : 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (extra2) {
              ctx.fillStyle = '#0a1030';
              ctx.font = '8px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('e−', px3, py3 + 1);
            }
            ctx.restore();
          }
        }
        x.state.accPositions = accPositions;

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
        if (!Array.isArray(ans)) return false;
        if (item.acceptors) {
          return ans.length === item.need;
        }
        return ans.length === item.need;
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
    /* ===== Fase 0 — Estação Orbital (introdução às ligações químicas) ===== */
    [
      {
        type: 'text-input',
        instruction: 'Primeiramente, quem é o químico do século XX considerado o pai da Ligação Química?',
        placeholder: 'Digite o nome do cientista...',
        answer: 'linus pauling',
        explain: 'Linus Pauling foi um dos grandes nomes do estudo das ligações químicas.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Além disso, um cientista chamado Gilbert Newton Lewis fez uma teoria que determina quantos elétrons um átomo deve ter na camada de valência para ficar estável. Qual o nome da teoria? Quantos elétrons o átomo deve ter?',
        opts: [
          'Teoria do Octeto. Deve ter 8 elétrons ou 2 (para o Hidrogênio) para ficar estável.',
          'Teoria da Relatividade. A quantidade é relativa, varia entre cada elemento.',
          'Teoria do Octeto. Deve ter 80 elétrons.',
          'Teoria da Evolução Química. A quantidade de elétrons evolui de acordo com o elemento.'
        ],
        ans: 0,
        explain: 'A Teoria do Octeto explica a busca por uma configuração estável na camada de valência. Para muitos átomos, isso corresponde a 8 elétrons; o hidrogênio é uma exceção importante e busca 2.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Além disso, existem 3 tipos diferentes de ligações químicas, que ocorrem entre grupos distintos de elementos. Ametal com Ametal ou Hidrogênio:',
        opts: ['Iônica', 'Covalente', 'Metálica'],
        ans: 1,
        explain: 'Ligações covalentes geralmente ocorrem entre ametais, envolvendo o compartilhamento de elétrons.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Metal com Ametal:',
        opts: ['Iônica', 'Covalente', 'Metálica'],
        ans: 0,
        explain: 'Ligações iônicas geralmente ocorrem entre metais e ametais, envolvendo transferência de elétrons.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Entre metais:',
        opts: ['Iônica', 'Covalente', 'Metálica'],
        ans: 2,
        explain: 'A ligação metálica ocorre entre átomos de metais, com elétrons deslocalizados que podem se movimentar pelo material.',
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
        type: 'transfer',
        instruction: 'Transfira os elétrons que o ALUMÍNIO (metal) dá para os átomos de BROMO (ametais) na ligação iônica.',
        donor: { el: 'Al', valence: 3, label: 'Alumínio (metal)' },
        acceptors: [
          { el: 'Br', valence: 7, label: 'Bromo (ametal)' },
          { el: 'Br', valence: 7, label: 'Bromo (ametal)' },
          { el: 'Br', valence: 7, label: 'Bromo (ametal)' }
        ],
        need: 3,
        explain: 'Correto! O alumínio perde três elétrons e forma Al³⁺, enquanto cada átomo de bromo recebe um elétron e forma Br⁻. Assim, eles formam o composto iônico AlBr₃.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Analise as afirmações abaixo e assinale a alternativa que apresenta a sequência correta de verdadeiro (V) e falso (F).\n\nI. A ligação iônica ocorre pela transferência de elétrons entre um metal e um ametal.\n\nII. Na ligação iônica, o metal perde elétrons e se transforma em cátion, enquanto o ametal ganha elétrons e se transforma em ânion.\n\nIII. O composto H₂O é um exemplo de ligação iônica.',
        opts: ['V, V, F', 'V, F, V', 'F, V, F', 'V, V, V'],
        ans: 0,
        explain: 'Correto! Na ligação iônica, ocorre transferência de elétrons: o metal forma um cátion e o ametal forma um ânion. H₂O possui ligações covalentes.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Analise as afirmações e assinale a sequência correta:\n\nI. O NaCl é formado por ligação iônica.\n\nII. Na ligação iônica os átomos compartilham elétrons para ficarem estáveis.\n\nIII. A ligação iônica acontece entre átomos do grupo dos metais e dos ametais.',
        opts: ['V, F, V', 'V, V, F', 'F, V, V', 'V, V, V'],
        ans: 0,
        explain: 'Correto! O NaCl possui ligação iônica, formada pela transferência de elétrons entre um metal e um ametal.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'A ligação iônica é caracterizada por:',
        opts: [
          'Compartilhamento de elétrons entre dois ametais.',
          'Transferência de elétrons entre metal e ametal, formando cátions e ânions.',
          'Formação de um mar de elétrons livres.',
          'Atração entre átomos neutros sem perda ou ganho de elétrons.'
        ],
        ans: 1,
        explain: 'Correto! Na ligação iônica, ocorre transferência de elétrons entre um metal e um ametal, formando cátions e ânions.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Qual dos compostos abaixo é formado por ligação iônica?',
        opts: ['CO₂', 'H₂O', 'NaCl', 'O₂'],
        ans: 2,
        explain: 'Correto! O NaCl é formado por sódio, um metal, e cloro, um ametal, formando uma ligação iônica.',
        pts: 100
      }
    ],

    /* ===== Fase 2 — Planeta Covalente ===== */
    [
      {
        type: 'choice',
        instruction: 'Sobre ligações covalentes:\nI. Ocorrem geralmente entre átomos de ametais.\nII. Envolvem o compartilhamento de elétrons.\nIII. Formam compostos que podem ser representados por fórmulas de Lewis.\nIV. Sempre envolvem a transferência completa de elétrons.\n\nAssinale a alternativa correta:',
        opts: ['Apenas I e II', 'Apenas I, II e III', 'Apenas II e IV', 'I, II, III e IV'],
        ans: 1,
        explain: 'Correto! As ligações covalentes geralmente ocorrem entre ametais e envolvem o compartilhamento de elétrons, podendo ser representadas por estruturas de Lewis.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Sobre os elétrons nas ligações covalentes:\nI. Os elétrons compartilhados são chamados de elétrons ligantes.\nII. Os átomos compartilham elétrons para alcançar maior estabilidade.\nIII. A camada de valência participa da formação das ligações.\nIV. Na ligação covalente, os elétrons são sempre totalmente transferidos de um átomo para outro.\n\nAssinale a alternativa correta:',
        opts: ['I, II e III', 'I e IV', 'II e IV', 'Apenas III'],
        ans: 0,
        explain: 'Correto! Os elétrons compartilhados são elétrons ligantes, e a camada de valência participa das ligações. O compartilhamento ajuda os átomos a alcançar maior estabilidade.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Sobre ligações simples, duplas e triplas:\nI. Uma ligação simples possui um par de elétrons compartilhado.\nII. Uma ligação dupla possui dois pares de elétrons compartilhados.\nIII. Uma ligação tripla possui três pares de elétrons compartilhados.\nIV. A molécula de O₂ apresenta uma ligação dupla.\n\nAssinale a alternativa correta:',
        opts: ['Apenas I e II', 'Apenas II e III', 'I, II, III e IV', 'Apenas I e IV'],
        ans: 2,
        explain: 'Correto! Ligações simples, duplas e triplas envolvem, respectivamente, um, dois e três pares de elétrons compartilhados. O₂ apresenta uma ligação dupla.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Sobre as fórmulas de Lewis:\nI. As estruturas de Lewis representam os elétrons da camada de valência.\nII. Os pares compartilhados podem ser representados por traços.\nIII. Um traço entre dois átomos representa um par de elétrons compartilhado.\nIV. A fórmula de Lewis não permite identificar elétrons que não participam das ligações.\n\nAssinale a alternativa correta:',
        opts: ['I e II', 'I, II e III', 'II, III e IV', 'Todas estão corretas'],
        ans: 1,
        explain: 'Correto! As estruturas de Lewis representam os elétrons de valência, e um traço pode representar um par de elétrons compartilhado. Elas também permitem visualizar pares de elétrons que não participam das ligações.',
        pts: 100
      }
    ],

    /* ===== Fase 3 — Planeta Metálico ===== */
    [
      {
        type: 'periodic-select',
        instruction: 'Alguns metais possuem pontos de fusão muito próximos da temperatura ambiente. Selecione os 5 metais que podem se apresentar líquidos em temperaturas próximas da temperatura ambiente.',
        need: 5,
        answer: ['Cs', 'Ga', 'Rb', 'Fr', 'Hg'],
        explain: 'Correto! Césio, gálio, rubídio, frâncio e mercúrio possuem pontos de fusão muito baixos quando comparados à maioria dos metais, ficando próximos da temperatura ambiente.',
        explainWrong: 'Quase! Os elementos procurados eram Césio, Gálio, Rubídio, Frâncio e Mercúrio.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Se um metal for colocado em um trefilador, o que acontecerá com ele?',
        opts: [
          'Ele se transformará em um líquido, pois a pressão do trefilador diminui o ponto de fusão do metal.',
          'Ele se tornará um fio, devido à característica da ductilidade, devido ao seu mar de elétrons que realinha os cátions e os protege.',
          'Ele se quebrará imediatamente, pois os cátions metálicos não conseguem mudar de posição quando recebem uma força externa.',
          'Ele se tornará um fio porque os elétrons livres abandonam completamente o metal durante a deformação.'
        ],
        ans: 1,
        explain: 'Correto! A ductilidade é a capacidade de um metal sofrer deformação e ser transformado em fios sem se romper facilmente.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Suponhamos que alguém coloque um pedaço de metal sobre uma vela para aquecê-lo. Analisando cientificamente, o que estaria ocorrendo na estrutura do metal?',
        opts: [
          'Os cátions desapareceriam progressivamente, pois o calor transforma os prótons em elétrons.',
          'Os elétrons livres estariam se movendo mais rapidamente, assim, com o aumento da energia cinética, ocorre o aumento da energia térmica.',
          'O metal perderia todos os seus elétrons livres imediatamente, interrompendo completamente a ligação metálica.',
          'Os elétrons livres deixariam completamente o metal, fazendo com que os átomos perdessem sua estrutura metálica.'
        ],
        ans: 1,
        explain: 'Correto! Ao receber energia térmica, aumenta a energia cinética das partículas, fazendo com que os elétrons e a estrutura do metal apresentem maior agitação.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Analise as afirmativas e selecione a sequência correta de verdadeiro e falso:\n\nI) Os metais são maleáveis pois o mar de elétrons protege os cátions uns dos outros, não permitindo que eles se afastem, como normalmente ocorre em cristais iônicos.\n\nII) Os metais são brilhantes pois seus elétrons livres absorvem a luz, saltam para camadas exteriores e se mantêm lá, sem descer de nível energético novamente.\n\nIII) Os metais costumam conduzir corrente elétrica pois os elétrons livres são deslocados pelos elétrons que estão entrando, assim se movendo por meio do metal. A quantidade de elétrons que sai e que entra é a mesma.',
        opts: [
          'F – F – V',
          'V – V – F',
          'V – F – V',
          'F – V – V'
        ],
        ans: 2,
        explain: 'Correto! O mar de elétrons ajuda a manter a estrutura metálica mesmo quando os cátions mudam de posição. A afirmação II está incorreta, enquanto a III relaciona os elétrons livres à condução elétrica.',
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
        type: 'transfer',
        instruction: 'Transfira o elétron que o POTÁSSIO (metal) doa ao CLORO (ametal).',
        donor: { el: 'K', valence: 1, label: 'Potássio (metal)' },
        acceptor: { el: 'Cl', valence: 7, label: 'Cloro (ametal)' },
        need: 1,
        explain: 'O K doa 1 elétron ao Cl: formam-se K⁺ e Cl⁻, uma ligação iônica como o NaCl.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Respectivamente, qual o metal mais maleável e o metal mais dúctil?',
        opts: ['Prata e Cobre.', 'Cobre e Ouro.', 'Alumínio e Prata.', 'Ouro e Platina.'],
        ans: 3,
        explain: 'Correto! O ouro se destaca por sua maleabilidade, enquanto a platina apresenta grande ductilidade.',
        explainWrong: 'Maleabilidade é a capacidade de formar lâminas (ouro é o mais maleável), e ductilidade é a capacidade de formar fios (platina é a mais dúctil).',
        pts: 100
      },
      {
        type: 'transfer',
        instruction: 'Transfira os elétrons do CROMO (metal) para os dois átomos de OXIGÊNIO (ametal) para formar CrO₂.',
        donor: { el: 'Cr', valence: 4, label: 'Cromo (metal)' },
        acceptors: [
          { el: 'O', valence: 6, label: 'Oxigênio (ametal)', accepts: 2 },
          { el: 'O', valence: 6, label: 'Oxigênio (ametal)', accepts: 2 }
        ],
        need: 4,
        explain: 'Correto! O cromo fornece quatro elétrons, enquanto os dois átomos de oxigênio recebem dois elétrons cada, formando CrO₂.',
        pts: 100
      },
      {
        type: 'choice',
        instruction: 'Para formar uma molécula de dióxido de silício (SiO₂), sabendo que o Si e o O são ametais e, portanto, realizam ligação covalente, quantos átomos de cada elemento são necessários?',
        opts: ['Precisaria de dois Si e um O.', 'Precisaria de um Si e dois O.', 'Precisaria de dois Si e dois O.', 'Precisaria de um Si e um O.'],
        ans: 1,
        explain: 'Correto! O silício e o oxigênio são ametais e formam uma ligação covalente. A proporção é de 1 átomo de Si para 2 átomos de O, formando SiO₂.',
        explainWrong: 'Quase! Si e O são ametais, portanto formam uma ligação covalente. A proporção em SiO₂ é de 1 átomo de Si para 2 átomos de O.',
        pts: 100
      }
    ],

    /* ===== Fase 5 · SIDE QUEST — Planeta Kinder (iônica avançada) ===== */
    [
      {
        type: 'transfer',
        instruction: 'Desvio avançado: transfira os elétrons que o CÁLCIO (metal) doa para os átomos de FLÚOR (ametais) na ligação iônica.',
        donor: { el: 'Ca', valence: 2, label: 'Cálcio (metal)' },
        acceptors: [
          { el: 'F', valence: 7, label: 'Flúor (ametal)' },
          { el: 'F', valence: 7, label: 'Flúor (ametal)' }
        ],
        need: 2,
        explain: 'Correto! O cálcio perde 2 elétrons e vira Ca²⁺; cada flúor recebe 1 e vira F⁻. Formam-se Ca²⁺ + 2 F⁻ → o fluoreto de cálcio, CaF₂.',
        pts: 150
      },
      {
        type: 'electrons',
        instruction: 'Distribua os 16 elétrons do ENXOFRE (Z = 16) nas camadas K, L e M.',
        symbol: 'S',
        z: 16,
        shells: [
          { label: 'K', max: 2, answer: 2 },
          { label: 'L', max: 8, answer: 8 },
          { label: 'M', max: 8, answer: 6 }
        ],
        explain: 'Correto! S: 2-8-6. Com 6 elétrons na camada de valência, o enxofre RECEBE 2 elétrons para completar o octeto e vira S²⁻.',
        pts: 150
      },
      {
        type: 'choice',
        instruction: 'Na Forja de Íons, você combina Al³⁺ com S²⁻. Qual a fórmula do composto formado?',
        opts: ['AlS', 'Al₂S₃', 'Al₃S₂', 'AlS₂'],
        ans: 1,
        explain: 'Correto! Cruzando as cargas: o índice de cada carga vira a quantidade do outro íon → 2 Al³⁺ (+6) com 3 S²⁻ (−6). Soma zero: Al₂S₃!',
        explainWrong: 'Quase! Cruze as cargas: o 3 do Al³⁺ vai como índice do S, e o 2 do S²⁻ vai como índice do Al → Al₂S₃.',
        pts: 150
      },
      {
        type: 'choice',
        instruction: 'Uma barra de NaCl sólida não acende uma lâmpada, mas o NaCl FUNDIDO acende. Por quê?',
        opts: [
          'Porque no sólido os elétrons livres do metal circulam melhor.',
          'Porque fundido os íons Na⁺ e Cl⁻ ficam LIVRES e podem conduzir corrente.',
          'Porque o calor transforma o NaCl em metal condutor.',
          'Porque a lâmpada só funciona com compostos covalentes.'
        ],
        ans: 1,
        explain: 'Correto! Compostos iônicos conduzem apenas quando fundidos ou dissolvidos: os íons precisam estar livres para migrar. No sólido, ficam presos na rede cristalina.',
        pts: 150
      }
    ],

    /* ===== Fase 6 · SIDE QUEST — Planeta Bueno (covalente avançada) ===== */
    [
      {
        type: 'structure',
        instruction: 'Monte a estrutura do GÁS CARBÔNICO (CO₂): toque num átomo da bandeja e depois no círculo correspondente. As duas ligações já estão desenhadas.',
        anchors: [
          { x: 0.18, y: 0.5, el: 'O' },
          { x: 0.5, y: 0.5, el: 'C' },
          { x: 0.82, y: 0.5, el: 'O' }
        ],
        bonds: [{ a: 0, b: 1 }, { a: 1, b: 2 }],
        tray: ['C', 'O', 'H', 'N'],
        explain: 'Correto! O=C=O: o carbono no centro compartilha 2 pares com cada oxigênio — DUAS ligações duplas, e todos completam o octeto.',
        pts: 150
      },
      {
        type: 'lewis',
        instruction: 'Monte a Fórmula de Lewis do NITROGÊNIO (N): distribua os 5 elétrons de valência ao redor do símbolo.',
        symbol: 'N',
        valence: 5,
        answerKey: [2, 1, 1, 1],
        explain: 'Correto! N tem 5 elétrons de valência (um par + 3 solitários). São esses 3 solitários que formam a LIGAÇÃO TRIPLA do N₂.',
        pts: 150
      },
      {
        type: 'electrons',
        instruction: 'Distribua os 8 elétrons do OXIGÊNIO (Z = 8) nas camadas K e L.',
        symbol: 'O',
        z: 8,
        shells: [
          { label: 'K', max: 2, answer: 2 },
          { label: 'L', max: 8, answer: 6 }
        ],
        explain: 'Correto! O: 2-6. Com 6 elétrons de valência, o oxigênio precisa COMPARTILHAR 2 pares (ou receber 2 elétrons) para completar o octeto.',
        pts: 150
      },
      {
        type: 'drag',
        instruction: 'Combine cada representação de molécula ao seu tipo arrastando os cartões.',
        slots: [
          { label: 'Elétrons como PONTOS' },
          { label: 'Pares compartilhados como TRAÇOS' },
          { label: 'Contagem dos átomos' }
        ],
        items: [
          { id: 'lewis', label: 'FÓRMULA DE LEWIS', color: '#ffd166' },
          { id: 'structural', label: 'FÓRMULA ESTRUTURAL', color: '#59d3ff' },
          { id: 'molecular', label: 'FÓRMULA MOLECULAR', color: '#ff9df2' }
        ],
        answerKey: { lewis: 0, structural: 1, molecular: 2 },
        explain: 'Correto! Lewis desenha PONTOS (elétrons), a estrutural desenha TRAÇOS (pares compartilhados) e a molecular resume a CONTAGEM (ex.: H₂O).',
        pts: 150
      },
      {
        type: 'text-input',
        instruction: 'Na molécula de N₂, quantos pares de elétrons são COMPARTILHADOS entre os dois nitrogênios? Digite o número.',
        placeholder: 'Digite um número...',
        answer: '3',
        explain: 'Correto! N≡N: a ligação tripla do nitrogênio gasoso compartilha 3 pares (6 elétrons) — uma das ligações mais fortes da química!',
        pts: 150
      },
      {
        type: 'choice',
        instruction: 'Comparando CH₄, H₂O e HCl, todas essas moléculas se formam porque:',
        opts: [
          'metais doam elétrons definitivamente aos ametais.',
          'ametais COMPARTILHAM pares de elétrons entre si (ligação covalente).',
          'cátions flutuam num mar de elétrons.',
          'os átomos trocam prótons até ficarem estáveis.'
        ],
        ans: 1,
        explain: 'Correto! C, H, O, N e Cl são ametais: todas essas ligações são COVALENTES — pares de elétrons compartilhados (simples nas três moléculas).',
        pts: 150
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
        if (typeof damagePlayer === 'function' && Game.run.lives > 0) {
          damagePlayer();
        }
        AudioSys.sfx('quizWrong');
        shake(8);
        this.errorFlash = 0.8;
        this.markError(item, type);
        var empty = this.isEmptyAnswer(type, ans);
        var wrongText = item.explainWrong || ('Não é bem isso.<br><span class="explain-text">Relembre o conceito: ' + item.explain + '</span>');
        this.setFeedback(false, empty
          ? 'Ainda não respondeu!<br><span class="explain-text">' + type.hint(this.x) + '</span>'
          : wrongText);
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
      /* Sincroniza stats dos exercícios para o painel de missão */
      Game.quizStats = { correct: Game.exerciseStats.correct, total: Game.exerciseStats.total };
      /* Fase 0: mostra diálogo de encerramento do Sérgio antes da missão */
      if (idx === 0 && typeof openDialog === 'function') {
        openDialog({
          lines: [
            'Ótimo! Agora posso deixar você começar a explorar a galáxia com esse conhecimento básico! Boa sorte, recruta!'
          ],
          onEnd: function () {
            if (typeof showMission === 'function') showMission();
          }
        });
      } else {
        if (typeof showMission === 'function') showMission();
      }
    },

    /* --- teclado --- */
    onKey: function (e) {
      if (!this.session || this.answered && document.getElementById('btn-ex-next').hidden) return;
      var item = this.session[this.idx];
      /* Questões de texto digitado: não interceptar teclas (input próprio) */
      if (item && item.type === 'text-input') {
        var nextBtn2 = document.getElementById('btn-ex-next');
        if ((e.code === 'Enter' || e.code === 'Space') && !nextBtn2.hidden) {
          e.preventDefault();
          nextBtn2.click();
        }
        return;
      }
      var nextBtn = document.getElementById('btn-ex-next');
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (!nextBtn.hidden) { nextBtn.click(); return; }
        this.confirm();
        return;
      }
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
      var accs = item.acceptors || [item.acceptor];
      if (accs.length > 1 && s.accPositions) {
        var best = null, bestD = Infinity;
        for (var k = 0; k < s.accPositions.length; k++) {
          var dd = dist(p.x, p.y, s.accPositions[k].x, s.accPositions[k].y);
          if (dd < bestD) { bestD = dd; best = s.accPositions[k]; }
        }
        s.nearestAccept = best;
      }
      this.refresh();
    },

    transferUp: function (item, p) {
      if (this.answered || !this.x) return;
      var s = this.x.state;
      if (s.dragging !== null && s.dragging !== undefined) {
        var i = s.dragging;
        var home = (s.donorDots || [])[i];
        var accs = item.acceptors || [item.acceptor];
        var onDrop = false;
        if (accs.length > 1 && s.accPositions) {
          for (var k = 0; k < s.accPositions.length; k++) {
            if (dist(p.x, p.y, s.accPositions[k].x, s.accPositions[k].y) < TRANSFER_DROP_R) { onDrop = true; break; }
          }
        } else {
          var ax = this.x.W * 0.7, ay = this.x.H * 0.52;
          onDrop = dist(p.x, p.y, ax, ay) < TRANSFER_DROP_R;
        }
        var onHome = home && dist(p.x, p.y, home.x, home.y) < TRANSFER_HIT_R;
        s.dragging = null;
        s.dragPos = null;
        s.nearestAccept = null;
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
