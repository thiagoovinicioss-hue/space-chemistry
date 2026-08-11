/* ============================================================
   SPACE CHEMISTRY — FÓRMULA DE LEWIS
   ------------------------------------------------------------
   Sistema interativo de construção da ESTRUTURA DE LEWIS.

   PRINCÍPIO PEDAGÓGICO (NÃO quebrar):
   - A Fórmula de Lewis NUNCA é tratada como fórmula estrutural.
   - Elétrons de valência = PONTOS. Traços pertencem à fórmula
     estrutural e NÃO aparecem aqui.
   - A construção é guiada em 6 ETAPAS:
       1) Escolher o átomo central
       2) Mostrar os elétrons de valência como pontos individuais
       3) Organizar/emparelhar os elétrons (pares isolados)
       4) Adicionar os átomos externos
       5) Formar os pares compartilhados (ligações = PONTOS)
       6) Completar a camada de valência
   - Posicionamento 100% por COORDENADAS (simétrico e relativo),
     nunca aleatório.
   - Validação química por molécula (octeto/dueto, contagem de
     elétrons, pares compartilhados, pares isolados, geometria).
   - Mouse e toque (Pointer Events) + teclado.

   USO
   - Tela standalone: LewisBuilder.enter() / LewisBuilder.exit()
   - Dentro do motor de exercícios: o tipo 'lewisBuilder' é
     registrado em EXERCISE_TYPES automaticamente.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     DADOS DAS MOLÉCULAS (progredindo da mais simples para a complexa)
     step2[side]   = elétrons individuais que o átomo central mostra
                     na ETAPA 2 (1 por lado normalmente; 2/3 nos lados
                     de ligação múltipla).
     step3Pairs[]  = lados do central que recebem o 2º elétron (pares
                     isolados) na ETAPA 3.
     bonds[]       = { dir, order } ligações do central para o átomo
                     externo colocado na direção dir (order = nº de
                     pares compartilhados: 1 simples, 2 dupla, 3 tripla).
     outerLone     = pares isolados (contagem de elétrons por lado)
                     que cada átomo externo deve receber na ETAPA 6.
  ------------------------------------------------------------------ */
  var MOLECULES = {
    H2: {
      formula: 'H₂',
      name: 'Gás Hidrogênio',
      tip: 'Cada H precisa de 1 elétron: compartilham 1 par.',
      central: { el: 'H', valence: 1 },
      step2: { N: 0, S: 0, E: 1, W: 0 },
      step3Pairs: [],
      outer: [ { el: 'H', dir: 'E', valence: 1 } ],
      bonds: [ { dir: 'E', order: 1 } ],
      outerLone: { E: { N: 0, S: 0, E: 0, W: 0 } }
    },
    Cl2: {
      formula: 'Cl₂',
      name: 'Gás Cloro',
      tip: 'Cada Cl tem 7 elétrons de valência e compartilha 1.',
      central: { el: 'Cl', valence: 7 },
      step2: { N: 1, S: 1, E: 1, W: 1 },
      step3Pairs: ['N', 'S', 'W'],
      outer: [ { el: 'Cl', dir: 'E', valence: 7 } ],
      bonds: [ { dir: 'E', order: 1 } ],
      outerLone: { E: { N: 2, S: 2, E: 2, W: 0 } }
    },
    H2O: {
      formula: 'H₂O',
      name: 'Água',
      tip: 'O oxigênio tem 6 elétrons de valência e compartilha 2.',
      central: { el: 'O', valence: 6 },
      step2: { N: 1, S: 1, E: 1, W: 1 },
      step3Pairs: ['N', 'S'],
      outer: [ { el: 'H', dir: 'W', valence: 1 }, { el: 'H', dir: 'E', valence: 1 } ],
      bonds: [ { dir: 'W', order: 1 }, { dir: 'E', order: 1 } ],
      outerLone: {
        W: { N: 0, S: 0, E: 0, W: 0 },
        E: { N: 0, S: 0, E: 0, W: 0 }
      }
    },
    NH3: {
      formula: 'NH₃',
      name: 'Amônia',
      tip: 'O nitrogênio tem 5 elétrons de valência e compartilha 3.',
      central: { el: 'N', valence: 5 },
      step2: { N: 1, S: 1, E: 1, W: 1 },
      step3Pairs: ['N'],
      outer: [ { el: 'H', dir: 'S', valence: 1 }, { el: 'H', dir: 'E', valence: 1 }, { el: 'H', dir: 'W', valence: 1 } ],
      bonds: [ { dir: 'S', order: 1 }, { dir: 'E', order: 1 }, { dir: 'W', order: 1 } ],
      outerLone: {
        S: { N: 0, S: 0, E: 0, W: 0 },
        E: { N: 0, S: 0, E: 0, W: 0 },
        W: { N: 0, S: 0, E: 0, W: 0 }
      }
    },
    CH4: {
      formula: 'CH₄',
      name: 'Metano',
      tip: 'O carbono tem 4 elétrons de valência e compartilha 4.',
      central: { el: 'C', valence: 4 },
      step2: { N: 1, S: 1, E: 1, W: 1 },
      step3Pairs: [],
      outer: [
        { el: 'H', dir: 'N', valence: 1 }, { el: 'H', dir: 'S', valence: 1 },
        { el: 'H', dir: 'E', valence: 1 }, { el: 'H', dir: 'W', valence: 1 }
      ],
      bonds: [
        { dir: 'N', order: 1 }, { dir: 'S', order: 1 },
        { dir: 'E', order: 1 }, { dir: 'W', order: 1 }
      ],
      outerLone: {
        N: { N: 0, S: 0, E: 0, W: 0 }, S: { N: 0, S: 0, E: 0, W: 0 },
        E: { N: 0, S: 0, E: 0, W: 0 }, W: { N: 0, S: 0, E: 0, W: 0 }
      }
    },
    CO2: {
      formula: 'CO₂',
      name: 'Gás Carbônico',
      tip: 'Ligação dupla: o carbono compartilha 2 pares com cada oxigênio.',
      central: { el: 'C', valence: 4 },
      step2: { N: 0, S: 0, E: 2, W: 2 },
      step3Pairs: [],
      outer: [ { el: 'O', dir: 'E', valence: 6 }, { el: 'O', dir: 'W', valence: 6 } ],
      bonds: [ { dir: 'E', order: 2 }, { dir: 'W', order: 2 } ],
      outerLone: {
        E: { N: 2, S: 2, E: 0, W: 0 },
        W: { N: 2, S: 2, E: 0, W: 0 }
      }
    },
    O2: {
      formula: 'O₂',
      name: 'Gás Oxigênio',
      tip: 'Ligação dupla: cada O compartilha 2 elétrons e guarda 2 pares.',
      central: { el: 'O', valence: 6 },
      step2: { N: 1, S: 1, E: 2, W: 0 },
      step3Pairs: ['N', 'S'],
      outer: [ { el: 'O', dir: 'E', valence: 6 } ],
      bonds: [ { dir: 'E', order: 2 } ],
      outerLone: { E: { N: 2, S: 2, E: 0, W: 0 } }
    },
    N2: {
      formula: 'N₂',
      name: 'Gás Nitrogênio',
      tip: 'Ligação tripla: cada N compartilha 3 elétrons e guarda 1 par.',
      central: { el: 'N', valence: 5 },
      step2: { N: 1, S: 0, E: 3, W: 0 },
      step3Pairs: ['N'],
      outer: [ { el: 'N', dir: 'E', valence: 5 } ],
      bonds: [ { dir: 'E', order: 3 } ],
      outerLone: { E: { N: 0, S: 0, E: 2, W: 0 } }
    }
  };

  var MOL_ORDER = ['H2', 'Cl2', 'H2O', 'NH3', 'CH4', 'CO2', 'O2', 'N2'];
  var SIDES = ['N', 'S', 'E', 'W'];
  var OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

  /* Cores (estilo giz colorido sobre quadro verde) */
  var C_SYMBOL = '#f2f0e6';
  var C_SYMBOL_DIM = 'rgba(240,238,230,0.6)';
  var C_RING = 'rgba(240,238,230,0.85)';
  var C_VALENCE = '#ffd166';
  var C_SHARED = '#7ff5ff';
  var C_MARK = 'rgba(255,241,205,0.85)';
  var C_GOOD = '#5dffa6';
  var C_BAD = '#ff5d6c';

  var W = 760, H = 480;           /* coordenadas lógicas do canvas */
  var SP_SINGLE = 140;            /* distância centro a centro */
  var SP_MULTI = 180;             /* ligações duplas/triplas precisam de mais espaço */
  var RC = 26, RO = 24, RH = 20;  /* raios dos símbolos */

  var LEGEND = [
    { color: C_VALENCE, text: 'elétron de valência' },
    { color: C_SHARED, text: 'par compartilhado (ligação)' }
  ];

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sumArr(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  function shade(hex, f) {
    var c = hexToRgb(hex); if (!c) return hex;
    return 'rgb(' + Math.round(c.r * f) + ',' + Math.round(c.g * f) + ',' + Math.round(c.b * f) + ')';
  }

  /* ------------------------------------------------------------------
     GEOMETRIA (posicionamento por coordenadas — PRIORIDADE)
     Cada átomo tem posição própria; os pontos são posicionados
     relativamente ao átomo. Tudo permanece alinhado em qualquer
     tamanho de tela.
  ------------------------------------------------------------------ */
  function moleculeSpace(mol) {
    var multi = mol.bonds.some(function (b) { return b.order > 1; });
    var sp = multi ? SP_MULTI : SP_SINGLE;
    var pos = { center: { x: W / 2, y: H / 2 } };
    mol.outer.forEach(function (o) {
      var p = pos[o.dir] || { x: W / 2, y: H / 2 };
      if (o.dir === 'E') p = { x: W / 2 + sp, y: H / 2 };
      if (o.dir === 'W') p = { x: W / 2 - sp, y: H / 2 };
      if (o.dir === 'N') p = { x: W / 2, y: H / 2 - sp };
      if (o.dir === 'S') p = { x: W / 2, y: H / 2 + sp };
      pos[o.dir] = p;
    });
    pos.sp = sp;
    return pos;
  }

  function atomRadius(el) { return el === 'H' ? RH : (el === 'C' || el === 'N' || el === 'O' || el === 'Cl' ? RC : RO); }

  /* Posições dos pontos de um lado de um átomo (depende da contagem) */
  function sideDotPos(x, y, R, side, count) {
    var D = R + 26, pts = [];
    if (count >= 1) {
      if (side === 'N') pts.push({ x: x, y: y - D });
      if (side === 'S') pts.push({ x: x, y: y + D });
      if (side === 'E') pts.push({ x: x + D, y: y });
      if (side === 'W') pts.push({ x: x - D, y: y });
    }
    if (count >= 2) {
      if (side === 'N') { pts[0] = { x: x - 7, y: y - D }; pts.push({ x: x + 7, y: y - D }); }
      if (side === 'S') { pts[0] = { x: x - 7, y: y + D }; pts.push({ x: x + 7, y: y + D }); }
      if (side === 'E') { pts[0] = { x: x + D, y: y - 7 }; pts.push({ x: x + D, y: y + 7 }); }
      if (side === 'W') { pts[0] = { x: x - D, y: y - 7 }; pts.push({ x: x - D, y: y + 7 }); }
    }
    if (count >= 3) {
      if (side === 'N') pts.push({ x: x, y: y - D - 15 });
      if (side === 'S') pts.push({ x: x, y: y + D + 15 });
      if (side === 'E') pts.push({ x: x + D + 15, y: y });
      if (side === 'W') pts.push({ x: x - D - 15, y: y });
    }
    return pts;
  }

  /* Região de toque de um lado do átomo (generosa para mouse E toque) */
  function sideBox(x, y, R, side) {
    var D = R + 26;
    if (side === 'N') return { x1: x - 22, y1: y - D - 24, x2: x + 22, y2: y - D + 18 };
    if (side === 'S') return { x1: x - 22, y1: y + D - 18, x2: x + 22, y2: y + D + 24 };
    if (side === 'E') return { x1: x + D - 18, y1: y - 22, x2: x + D + 24, y2: y + 22 };
    return { x1: x - D - 24, y1: y - 22, x2: x - D + 18, y2: y + 22 };
  }
  function inBox(p, b) { return p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2; }

  /* Colunas dos pares compartilhados entre dois átomos (o "meio da ligação") */
  function bondColumns(mol, pos, dir, order) {
    var a = pos.center, b = pos[dir];
    var cols = [];
    var i, t;
    for (i = 0; i < order; i++) {
      var off = (i - (order - 1) / 2) * 22;
      var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (dir === 'E' || dir === 'W') cols.push({ x: mid.x + off, y: mid.y });
      else cols.push({ x: mid.x, y: mid.y + off });
    }
    return cols;
  }
  function bondBox(mol, pos, dir, order) {
    var a = pos.center, b = pos[dir];
    var def = outerDefFor(mol, dir);
    var R = def ? atomRadius(def.el) : RO;
    var pad = 26 + order * 8;
    if (dir === 'E' || dir === 'W') {
      var x1 = Math.min(a.x, b.x) + atomRadius(mol.central.el) + 18;
      var x2 = Math.max(a.x, b.x) - R - 18;
      return { x1: x1, y1: (a.y + b.y) / 2 - pad, x2: x2, y2: (a.y + b.y) / 2 + pad };
    }
    return { x1: (a.x + b.x) / 2 - pad, y1: Math.min(a.y, b.y) + R + 18, x2: (a.x + b.x) / 2 + pad, y2: Math.max(a.y, b.y) - R - 18 };
  }

  /* ------------------------------------------------------------------
     ESTADO da construção (modelo puro — testável sem DOM)
  ------------------------------------------------------------------ */
  function newState(mol) {
    var sides = {};
    SIDES.forEach(function (s) { sides[s] = 0; });
    var shared = {};
    SIDES.forEach(function (s) { shared[s] = 0; });
    var outer = {};
    mol.outer.forEach(function (o) { outer[o.dir] = null; });
    return {
      molId: mol.id || '',
      central: null,
      step: 0,                    /* 0..5  (etapas 1..6) */
      centralSlots: sides,        /* contagem por lado do central */
      shared: shared,             /* nº de pares compartilhados por lado */
      outer: outer,               /* { dir: { el, lone: {lado: contagem} } | null } */
      picked: null,               /* chip selecionado (etapa 4) */
      complete: false
    };
  }

  function orderFor(mol, dir) {
    var i;
    for (i = 0; i < mol.bonds.length; i++) if (mol.bonds[i].dir === dir) return mol.bonds[i].order;
    return 0;
  }
  function outerDefFor(mol, dir) {
    var i;
    for (i = 0; i < mol.outer.length; i++) if (mol.outer[i].dir === dir) return mol.outer[i];
    return null;
  }

  function centralCount(S) {
    return SIDES.reduce(function (s, d) { return s + S.centralSlots[d]; }, 0);
  }
  function sharedTotal(S) {
    return SIDES.reduce(function (s, d) { return s + S.shared[d]; }, 0);
  }
  function outerLoneSum(S, dir) {
    var o = S.outer[dir];
    if (!o) return 0;
    return SIDES.reduce(function (s, d) { return s + (o.lone[d] || 0); }, 0);
  }

  /* --- validação por ETAPA --- */
  function stepOk(mol, S) {
    var i, side, o;
    if (S.step === 0) return !!S.central && S.central === mol.central.el;
    if (S.step === 1) {
      for (i = 0; i < SIDES.length; i++) {
        side = SIDES[i];
        if (S.centralSlots[side] !== (mol.step2[side] || 0)) return false;
      }
      return true;
    }
    if (S.step === 2) {
      for (i = 0; i < SIDES.length; i++) {
        side = SIDES[i];
        var want = mol.step3Pairs.indexOf(side) >= 0 ? 2 : (mol.step2[side] || 0);
        if (S.centralSlots[side] !== want) return false;
      }
      return true;
    }
    if (S.step === 3) {
      for (i = 0; i < mol.outer.length; i++) {
        o = S.outer[mol.outer[i].dir];
        if (!o || o.el !== mol.outer[i].el) return false;
      }
      return true;
    }
    if (S.step === 4) {
      for (i = 0; i < mol.bonds.length; i++) {
        if (S.shared[mol.bonds[i].dir] !== mol.bonds[i].order) return false;
      }
      return true;
    }
    if (S.step === 5) {
      var ok = true;
      for (i = 0; i < mol.outer.length; i++) {
        var def = mol.outer[i];
        o = S.outer[def.dir];
        if (!o) { ok = false; break; }
        var target = mol.outerLone[def.dir];
        for (var j = 0; j < SIDES.length; j++) {
          if ((o.lone[SIDES[j]] || 0) !== (target[SIDES[j]] || 0)) { ok = false; break; }
        }
        if (!ok) break;
      }
      return ok;
    }
    return validateFinal(mol, S);
  }

  /* --- validação QUÍMICA final (octeto/dueto + contagem + geometria) --- */
  function validateFinal(mol, S) {
    if (S.central !== mol.central.el) return false;
    var i, side;
    for (i = 0; i < mol.bonds.length; i++) {
      if (S.shared[mol.bonds[i].dir] !== mol.bonds[i].order) return false;
    }
    /* átomo central: contagem de valência + octeto/dueto */
    var placedC = centralCount(S);
    if (placedC !== mol.central.valence) return false;
    var octetC = placedC + sharedTotal(S);
    if (mol.central.el === 'H') {
      if (octetC !== 2) return false;
    } else if (octetC !== 8) {
      return false;
    }
    /* átomos externos */
    for (i = 0; i < mol.outer.length; i++) {
      var def = mol.outer[i];
      var o = S.outer[def.dir];
      if (!o || o.el !== def.el) return false;
      var order = orderFor(mol, def.dir);
      var lone = outerLoneSum(S, def.dir);
      if (lone + order !== def.valence) return false;
      var octet = lone + 2 * order;
      if (def.el === 'H') {
        if (octet !== 2) return false;
      } else if (octet !== 8) {
        return false;
      }
      /* nada nos lados voltados para a ligação */
      var facing = OPPOSITE[def.dir];
      if (o.lone[facing]) return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------
     INSTRUÇÕES / FEEDBACK (pedagógicos, em português)
  ------------------------------------------------------------------ */
  function stepTitle(step) {
    return 'ETAPA ' + (step + 1) + ' / 6';
  }
  function stepInstruction(mol, S) {
    var el = mol.central.el;
    var f = mol.formula;
    switch (S.step) {
      case 0:
        return 'Escolha o ÁTOMO CENTRAL: toque no elemento que fica no centro da ' + f + '.';
      case 1:
        var parts = SIDES.filter(function (s) { return (mol.step2[s] || 0) > 0; })
          .map(function (s) { return (mol.step2[s] || 0) + ' no lado ' + s; });
        return 'ELÉTRONS DE VALÊNCIA do ' + el + ': toque ao redor do símbolo para colocar ' +
          mol.central.valence + ' ' + (mol.central.valence === 1 ? 'ponto' : 'pontos') + ' individuais (' + parts.join(', ') + ').';
      case 2:
        if (!mol.step3Pairs.length) {
          return 'O ' + el + ' da ' + f + ' não tem elétrons extras: NÃO há par isolado no centro. Confirme para continuar.';
        }
        return 'ORGANIZE OS ELÉTRONS: toque nos lados indicados para agrupar em PARES ISOLADOS ' +
          '(os lados ' + mol.step3Pairs.join(' e ') + ').';
      case 3:
        return 'ADICIONE OS ÁTOMOS EXTERNOS: toque em um elemento da bandeja e depois toque no alvo tracejado.';
      case 4:
        return 'FORME OS PARES COMPARTILHADOS: cada toque entre os átomos cria 1 par compartilhado (a LIGAÇÃO, sempre em pontos).';
      case 5:
        return 'COMPLETE A CAMADA DE VALÊNCIA: adicione os PARES ISOLADOS que faltam nos átomos externos (regra do octeto, dueto para o H).';
      default:
        return '';
    }
  }
  function stepHint(mol, S) {
    var el = mol.central.el;
    switch (S.step) {
      case 0: return 'O átomo central é aquele que se liga aos demais: o ' + el + ' da ' + mol.formula + '.';
      case 1: return 'Confira a posição dos pontos: ' + SIDES.filter(function (s) { return (mol.step2[s] || 0) > 0; })
          .map(function (s) { return (mol.step2[s] || 0) + ' no lado ' + s; }).join(', ') + '.';
      case 2: return 'Os pares isolados ficam nos lados que NÃO participam das ligações.';
      case 3: return 'Cada átomo externo tem um alvo próprio ao redor do ' + el + '.';
      case 4: return 'Cada par compartilhado = 2 pontos entre os átomos. O total por ligação é fixo para esta molécula.';
      case 5: return 'Complete os pares para que cada átomo fique com 8 elétrons (o H, com 2).';
      default: return '';
    }
  }

  /* ------------------------------------------------------------------
     INTERAÇÃO (modelo puro: ações sobre o estado)
  ------------------------------------------------------------------ */
  /* Regra de alternância: adiciona se abaixo do máximo, remove se no máximo */
  function toggleCount(current, max) {
    if (max <= 0) return current;
    if (current >= max) return current - 1;
    return current + 1;
  }

  /* Toque em um lado do átomo central (etapas 2 e 3) */
  function tapCentralSide(mol, S, side) {
    var max;
    if (S.step === 1) max = mol.step2[side] || 0;
    else if (S.step === 2) max = mol.step3Pairs.indexOf(side) >= 0 ? 2 : 0;
    else return false;
    if (max <= 0) return false;
    S.centralSlots[side] = toggleCount(S.centralSlots[side], max);
    return true;
  }

  /* Toque em um lado de um átomo externo (etapa 6) */
  function tapOuterSide(mol, S, dir, side) {
    if (S.step !== 5) return false;
    var o = S.outer[dir];
    if (!o) return false;
    var target = mol.outerLone[dir];
    if (!target || (target[side] || 0) < 2) return false;
    var max = 2;
    o.lone[side] = toggleCount(o.lone[side] || 0, max);
    return true;
  }

  /* Toque no espaço entre os átomos (etapa 5) */
  function tapBondGap(mol, S, dir) {
    if (S.step !== 4) return false;
    if (!S.outer[dir]) return false;
    var order = orderFor(mol, dir);
    if (order <= 0) return false;
    S.shared[dir] = toggleCount(S.shared[dir], order);
    return true;
  }

  /* Posicionar átomo externo (etapa 4) */
  function placeOuter(mol, S, dir, el) {
    if (S.step !== 3) return false;
    var def = outerDefFor(mol, dir);
    if (!def) return false;
    if (el !== def.el) return false;
    if (S.outer[dir]) return false;   /* já ocupado */
    var lone = {};
    SIDES.forEach(function (s) { lone[s] = 0; });
    S.outer[dir] = { el: el, lone: lone };
    return true;
  }
  function removeOuter(S, dir) {
    if (S.step !== 3) return false;
    if (!S.outer[dir]) return false;
    S.outer[dir] = null;
    return true;
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
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.85);
    v.addColorStop(0, 'rgba(255,255,255,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    /* poeirinhas de giz (determinísticas, alinhadas) */
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    for (var i = 0; i < 7; i++) {
      var sx = ((i * 53 + 17) % 100) / 100 * W;
      var sy = ((i * 31 + 43) % 100) / 100 * H;
      ctx.lineWidth = 2 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + ((i % 5) - 2) * 14, sy + 8);
      ctx.stroke();
    }
    ctx.restore();

    /* título + aviso didático */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = C_SYMBOL;
    ctx.fillText('FÓRMULA DE LEWIS — ' + mol.formula, W / 2, 30);
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(240,238,230,0.55)';
    ctx.fillText('elétrons = pontos  ·  NUNCA usar traços (fórmula estrutural)', W / 2, 52);
    ctx.textAlign = 'left';
  }

  function drawAtom(ctx, el, x, y, central, t, dim) {
    var R = atomRadius(el);
    ctx.save();
    ctx.globalAlpha = dim ? 0.5 : 1;
    ctx.strokeStyle = C_RING;
    ctx.lineWidth = central ? 2.5 : 2;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = C_SYMBOL;
    ctx.font = 'bold ' + (central ? 22 : 18) + 'px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el, x, y + 1);
    ctx.restore();
  }

  function drawDots(ctx, pts, color, r, dim) {
    ctx.save();
    ctx.globalAlpha = dim ? 0.35 : 1;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    pts.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawTarget(ctx, x, y, r, t, color, phase) {
    ctx.save();
    ctx.strokeStyle = color || C_MARK;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 3 + phase);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBondColumns(ctx, cols, count, t) {
    var i, j;
    for (i = 0; i < count; i++) {
      var c = cols[i];
      drawDots(ctx, [{ x: c.x, y: c.y - 7 }, { x: c.x, y: c.y + 7 }], C_SHARED, 6);
    }
  }

  function drawCounter(ctx, mol, S) {
    var label = '';
    var color = C_SYMBOL_DIM;
    var cx = W - 14, cy = H - 18;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (S.step === 0) label = 'escolha o átomo central';
    else if (S.step === 1) {
      var step2sum = SIDES.reduce(function (s, d) { return s + (mol.step2[d] || 0); }, 0);
      label = 'elétrons individuais: ' + centralCount(S) + ' / ' + step2sum;
      color = centralCount(S) === step2sum ? C_GOOD : C_VALENCE;
    }
    else if (S.step === 2) { label = 'pares isolados do centro: ' + SIDES.filter(function (s) { return S.centralSlots[s] === 2; }).length + ' formados'; color = C_VALENCE; }
    else if (S.step === 3) { label = 'átomos externos: ' + mol.outer.filter(function (o) { return !!S.outer[o.dir]; }).length + ' / ' + mol.outer.length; color = C_VALENCE; }
    else if (S.step === 4) { label = 'pares compartilhados: ' + sharedTotal(S) + ' formados'; color = C_SHARED; }
    else if (S.step === 5) {
      var placed = centralCount(S) + mol.outer.reduce(function (s, o) { return s + outerLoneSum(S, o.dir) + orderFor(mol, o.dir); }, 0);
      var totalE = mol.central.valence + mol.outer.reduce(function (s, o) { return s + o.valence; }, 0);
      label = 'elétrons de valência: ' + placed + ' / ' + totalE;
      color = placed === totalE ? C_GOOD : C_VALENCE;
    }
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = color;
    ctx.fillText(label, cx, cy);
    ctx.textAlign = 'left';
  }

  function render(ctx, mol, S, t) {
    ctx.clearRect(0, 0, W, H);
    drawBoard(ctx, mol, t);
    var pos = moleculeSpace(mol);
    var Rc = atomRadius(mol.central.el);
    var i, j, side;

    /* Marcadores da ETAPA em andamento */
    if (S.step === 1) {
      SIDES.forEach(function (s) {
        var n = mol.step2[s] || 0;
        var pts = sideDotPos(pos.center.x, pos.center.y, Rc, s, n);
        for (j = 0; j < pts.length; j++) {
          if (S.centralSlots[s] < n) drawTarget(ctx, pts[j].x, pts[j].y, 11, t, C_MARK, j + 1);
        }
      });
    } else if (S.step === 2) {
      mol.step3Pairs.forEach(function (s, k) {
        if (S.centralSlots[s] < 2) {
          var p1 = sideDotPos(pos.center.x, pos.center.y, Rc, s, S.centralSlots[s] + 1);
          drawTarget(ctx, p1[p1.length - 1].x, p1[p1.length - 1].y, 11, t, C_MARK, k);
        }
      });
    } else if (S.step === 3) {
      mol.outer.forEach(function (o) {
        if (!S.outer[o.dir]) drawTarget(ctx, pos[o.dir].x, pos[o.dir].y, 24, t, C_MARK, o.dir.charCodeAt(0));
      });
    } else if (S.step === 4) {
      mol.bonds.forEach(function (b) {
        if (S.outer[b.dir] && S.shared[b.dir] < b.order) {
          var cols = bondColumns(mol, pos, b.dir, b.order);
          for (j = S.shared[b.dir]; j < b.order; j++) drawTarget(ctx, cols[j].x, cols[j].y - 0, 9, t, C_SHARED, j);
        }
      });
    } else if (S.step === 5) {
      mol.outer.forEach(function (o) {
        var O = S.outer[o.dir];
        if (!O) return;
        var R = atomRadius(o.el);
        var op = pos[o.dir];
        SIDES.forEach(function (s) {
          var target = mol.outerLone[o.dir];
          if (target && (target[s] || 0) >= 2 && (O.lone[s] || 0) < 2) {
            var pts = sideDotPos(op.x, op.y, R, s, (O.lone[s] || 0) + 1);
            drawTarget(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, 11, t, C_MARK, s.charCodeAt(0));
          }
        });
      });
    }

    /* Ligações (pares compartilhados) — desenha por baixo dos átomos */
    mol.bonds.forEach(function (b) {
      if (!S.outer[b.dir]) return;
      var cols = bondColumns(mol, pos, b.dir, b.order);
      drawBondColumns(ctx, cols, S.shared[b.dir], t);
    });

    /* Elétrons do átomo central */
    SIDES.forEach(function (s) {
      var bonded = S.shared[s];
      var show = S.centralSlots[s] - bonded;   /* singles consumidos pela ligação */
      if (show > 0) {
        drawDots(ctx, sideDotPos(pos.center.x, pos.center.y, Rc, s, show), C_VALENCE, 6);
      }
    });

    /* Elétrons dos átomos externos: pares isolados + singles voltados à ligação */
    mol.outer.forEach(function (o) {
      var O = S.outer[o.dir];
      if (!O) return;
      var op = pos[o.dir];
      var R = atomRadius(o.el);
      var order = orderFor(mol, o.dir);
      SIDES.forEach(function (s) {
        var lone = O.lone[s] || 0;
        if (lone > 0) drawDots(ctx, sideDotPos(op.x, op.y, R, s, lone), C_VALENCE, 6);
      });
      var facing = OPPOSITE[o.dir];
      var remain = order - S.shared[o.dir];
      if (remain > 0) drawDots(ctx, sideDotPos(op.x, op.y, R, facing, remain), C_VALENCE, 6);
    });

    /* Átomos */
    drawAtom(ctx, mol.central.el, pos.center.x, pos.center.y, true, t, S.central === null);
    mol.outer.forEach(function (o) {
      if (S.outer[o.dir]) drawAtom(ctx, o.el, pos[o.dir].x, pos[o.dir].y, false, t, false);
    });

    /* Legenda de cores */
    var ly = H - 46;
    for (i = 0; i < LEGEND.length; i++) {
      ctx.save();
      ctx.fillStyle = LEGEND[i].color;
      ctx.beginPath();
      ctx.arc(18 + i * 190, ly, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(240,238,230,0.8)';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(LEGEND[i].text, 30 + i * 190, ly);
      ctx.restore();
    }

    drawCounter(ctx, mol, S);
  }

  /* ------------------------------------------------------------------
     CONTAINER (UI do builder: canvas + bandeja + botões)
     Funciona na tela standalone E dentro do motor de exercícios.
  ------------------------------------------------------------------ */
  /* Bandeja de elementos: ETAPA 1 (escolher central) e ETAPA 4 (externos).
     Cada chip já sabe a ação certa da etapa atual. */
  function renderChips(builder) {
    var tray = builder.trayEl;
    if (!tray) return;
    tray.innerHTML = '';
    var list = [];
    if (builder.S.step === 0) {
      /* todos os elementos distintos da molécula */
      var seen = {};
      [builder.mol.central].concat(builder.mol.outer).forEach(function (def) {
        if (seen[def.el]) return;
        seen[def.el] = true;
        list.push(def.el);
      });
    } else if (builder.S.step === 3) {
      builder.mol.outer.forEach(function (o) {
        if (list.indexOf(o.el) < 0) list.push(o.el);
      });
    }
    list.forEach(function (el) {
      tray.appendChild(makeChip(builder, el));
    });
    tray.classList.toggle('hidden', list.length === 0);
  }
  function makeChip(builder, el) {
    var E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
    var info = E[el] || { color: '#2b3554' };
    var c = document.createElement('button');
    c.className = 'lewis-chip' + (builder.S.picked === el ? ' picked' : '');
    c.style.background = shade(info.color, 0.35);
    c.style.borderColor = info.color;
    c.setAttribute('type', 'button');
    c.dataset.el = el;
    c.innerHTML = '<span class="lewis-chip-sym">' + el + '</span>';
    c.addEventListener('click', function (e) {
      e.preventDefault();
      if (builder.S.complete || builder.locked) return;
      if (builder.S.step === 0) {
        if (el === builder.mol.central.el) {
          builder.S.central = el;
          sfx('gate');
          setMsg(builder, 'Ótimo! O ' + el + ' é o átomo central da ' + builder.mol.formula + '. Confirme para continuar.', false, 'good');
        } else {
          sfx('error');
          setMsg(builder, 'Esse elemento não fica no centro da ' + builder.mol.formula + '. Pense em qual átomo se liga aos demais.', true);
        }
      } else if (builder.S.step === 3) {
        sfx('click');
        builder.S.picked = (builder.S.picked === el) ? null : el;
        setMsg(builder, null, false);
      }
      renderChips(builder);
      engineRefresh(builder);
    });
    return c;
  }

  /* toque no canvas: roteia para a ação da etapa atual */
  function onCanvasTap(builder, p) {
    var mol = builder.mol, S = builder.S;
    if (builder.locked || S.complete) return;
    var pos = moleculeSpace(mol);
    var Rc = atomRadius(mol.central.el);
    var hit = null;

    if (S.step === 1 || S.step === 2) {
      for (var i = 0; i < SIDES.length; i++) {
        if (inBox(p, sideBox(pos.center.x, pos.center.y, Rc, SIDES[i]))) { hit = SIDES[i]; break; }
      }
      if (hit && tapCentralSide(mol, S, hit)) { sfx('click'); ok(builder); engineRefresh(builder); }
      else { sfx('error'); flash(builder); }
    } else if (S.step === 3) {
      /* toque num átomo já colocado remove */
      for (var d = 0; d < mol.outer.length; d++) {
        var od = mol.outer[d].dir;
        if (S.outer[od] && dist(p.x, p.y, pos[od].x, pos[od].y) < 30) {
          removeOuter(S, od);
          sfx('click'); ok(builder); engineRefresh(builder); return;
        }
      }
      /* toque num alvo vazio coloca o elemento selecionado */
      for (var k = 0; k < mol.outer.length; k++) {
        var dir = mol.outer[k].dir;
        if (!S.outer[dir] && dist(p.x, p.y, pos[dir].x, pos[dir].y) < 30) {
          if (!S.picked) { flash(builder, 'Toque primeiro em um elemento da bandeja.'); sfx('error'); return; }
          if (placeOuter(mol, S, dir, S.picked)) {
            S.picked = null;
            sfx('gate'); ok(builder); renderChips(builder); engineRefresh(builder);
            return;
          }
          sfx('error'); flash(builder, 'Esse elemento não vai nesse alvo.');
          return;
        }
      }
      sfx('error'); flash(builder, 'Toque em um alvo tracejado ao redor do átomo central.');
    } else if (S.step === 4) {
      for (var b = 0; b < mol.bonds.length; b++) {
        var bd = mol.bonds[b];
        if (inBox(p, bondBox(mol, pos, bd.dir, bd.order))) { hit = bd.dir; break; }
      }
      if (hit && tapBondGap(mol, S, hit)) { sfx('gate'); ok(builder); engineRefresh(builder); }
      else { sfx('error'); flash(builder); }
    } else if (S.step === 5) {
      for (var oi = 0; oi < mol.outer.length; oi++) {
        var od = mol.outer[oi].dir;
        var O = S.outer[od];
        if (!O) continue;
        var R = atomRadius(mol.outer[oi].el);
        var op = pos[od];
        for (var si = 0; si < SIDES.length; si++) {
          if (inBox(p, sideBox(op.x, op.y, R, SIDES[si]))) { hit = { dir: od, side: SIDES[si] }; break; }
        }
        if (hit) break;
      }
      if (hit && tapOuterSide(mol, S, hit.dir, hit.side)) { sfx('click'); ok(builder); engineRefresh(builder); }
      else { sfx('error'); flash(builder); }
    }
  }

  function sfx(name) {
    if (typeof AudioSys !== 'undefined' && AudioSys && AudioSys.sfx) AudioSys.sfx(name);
  }

  /* Sincroniza com o motor de exercícios (só quando estamos DENTRO dele) */
  function engineSync(builder, fn) {
    if (builder && builder.mode === 'screen') return;
    if (typeof Exercise !== 'undefined' && Exercise && fn) fn();
  }
  function engineRefresh(builder) {
    engineSync(builder, function () { Exercise.refresh(); });
  }
  function engineClearFeedback(builder) {
    engineSync(builder, function () { Exercise.clearFeedback(); });
  }
  function engineError(builder, amt) {
    engineSync(builder, function () {
      Exercise.errorFlash = Math.max(Exercise.errorFlash || 0, amt);
      Exercise.refresh();
    });
  }

  function ok(builder) {
    engineClearFeedback(builder);
  }
  var builderHook = null;
  var kbGuard = null;

  /* flash de erro leve (borda vermelha no painel) */
  function flash(builder, msg) {
    if (msg && builder.msgEl) {
      builder.msgEl.textContent = msg;
      builder.msgEl.className = 'lewis-msg bad';
      builder.msgEl.hidden = false;
      builder.msgFlash = 2;
    }
    engineError(builder, 0.5);
  }

  function confirmStep(builder) {
    var mol = builder.mol, S = builder.S;
    if (builder.locked) return;
    if (S.complete) return;
    if (!stepOk(mol, S)) {
      sfx('quizWrong');
      setMsg(builder, stepHint(mol, S), true);
      engineError(builder, 0.6);
      return;
    }
    sfx('quizRight');
    setMsg(builder, null, false);
    if (S.step >= 5) {
      complete(builder);
      return;
    }
    S.step++;
    S.picked = null;
    renderChips(builder);
    builder.bgDirty = true;
    builder.locked = false;
    engineRefresh(builder);
    renderStepUI(builder);
    setMsg(builder, 'Etapa ' + (S.step) + ' — ' + stepInstruction(mol, S), false, 'hint');
  }

  function setMsg(builder, text, isErr, cls) {
    if (!builder.msgEl) return;
    builder.msgEl.hidden = !text;
    builder.msgEl.className = 'lewis-msg ' + (isErr ? 'bad' : (cls || 'good'));
    builder.msgEl.textContent = text || '';
  }

  function complete(builder) {
    var mol = builder.mol, S = builder.S;
    S.complete = true;
    builder.locked = true;
    var pts = 100;
    var first = builder.doneSet.indexOf(builder.molId) < 0;
    if (first) builder.doneSet.push(builder.molId);
    var gain = first ? pts : Math.max(10, Math.round(pts / 2));
    builder.score += gain;
    if (!builder.exerciseMode && typeof Game !== 'undefined' && Game && Game.run) {
      if (!Game.replay) Game.run.score += gain;
      if (typeof updateHudScore === 'function') updateHudScore();
    }
    saveBest(builder.molId, builder.score);
    if (builder.scoreEl) builder.scoreEl.textContent = builder.score + ' pts';
    setMsg(builder, 'Estrutura de Lewis do ' + mol.formula + ' CORRETA! +' + gain + ' pontos. ' +
      '<span class="lewis-tip">' + mol.tip + '</span>', false, 'good');
    sfx('fusion');
    builder.confirmBtn.disabled = true;
    builder.refreshBtn.disabled = true;
    engineSync(builder, function () {
      if (typeof Exercise.confirm === 'function') Exercise.confirm();
    });
  }

  function resetStep(builder) {
    var mol = builder.mol, S = builder.S;
    if (S.complete) return;
    if (S.step === 0) { S.central = null; }
    else if (S.step === 1) {
      SIDES.forEach(function (s) { S.centralSlots[s] = 0; });
    } else if (S.step === 2) {
      mol.step3Pairs.forEach(function (s) { if (S.centralSlots[s] > (mol.step2[s] || 0)) S.centralSlots[s] = mol.step2[s] || 0; });
    } else if (S.step === 3) {
      mol.outer.forEach(function (o) { S.outer[o.dir] = null; });
    } else if (S.step === 4) {
      SIDES.forEach(function (s) { S.shared[s] = 0; });
    } else if (S.step === 5) {
      mol.outer.forEach(function (o) {
        var O = S.outer[o.dir];
        if (O) SIDES.forEach(function (s) { O.lone[s] = 0; });
      });
    }
    S.picked = null;
    renderChips(builder);
    setMsg(builder, 'Etapa refeita: ' + stepInstruction(mol, S), false, 'hint');
    sfx('click');
    engineRefresh(builder);
    renderStepUI(builder);
  }

  function resetMol(builder, molId) {
    var mol = molId ? MOLECULES[molId] : builder.mol;
    builder.mol = mol;
    builder.molId = mol.id;
    builder.S = newState(mol);
    builder.locked = false;
    builder.confirmBtn.disabled = false;
    builder.refreshBtn.disabled = false;
    renderChips(builder);
    renderStepUI(builder);
    setMsg(builder, null, false);
    engineRefresh(builder);
  }

  function renderStepUI(builder) {
    if (builder.stepEl) builder.stepEl.textContent = stepTitle(builder.S.step);
    if (builder.instrEl) builder.instrEl.textContent = stepInstruction(builder.mol, builder.S);
    if (builder.tipEl) builder.tipEl.textContent = 'Dica: ' + stepHint(builder.mol, builder.S);
  }

  function saveBest(molId, score) {
    try {
      var key = 'lewisBest';
      var data = JSON.parse(localStorage.getItem(key) || '{}');
      data[molId] = Math.max(data[molId] || 0, score);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  /* ---------- loop de animação (pulso dos marcadores) ---------- */
  var rafId = 0, loopActive = false, loopEl = null, loopCb = null;
  function startLoop() {
    if (loopActive) return;
    loopActive = true;
    (function tick() {
      if (!loopActive) return;
      if (loopCb) loopCb(performance.now() / 1000);
      rafId = requestAnimationFrame(tick);
    })();
  }
  function stopLoop() {
    loopActive = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ==================================================================
     API PÚBLICA
  ================================================================== */
  var LewisBuilder = {
    W: W, H: H,
    MOLECULES: MOLECULES,
    MOL_ORDER: MOL_ORDER,
    SIDES: SIDES,
    newState: newState,
    stepOk: stepOk,
    validateFinal: validateFinal,
    tapCentralSide: tapCentralSide,
    tapOuterSide: tapOuterSide,
    tapBondGap: tapBondGap,
    placeOuter: placeOuter,
    stepInstruction: stepInstruction,
    stepHint: stepHint,
    current: null,

    /* ---- Modo tela standalone ---- */
    enter: function () {
      var container = document.getElementById('lewis-stage');
      var chips = document.getElementById('lewis-mol-chips');
      if (!container) return;
      var scoreEl = document.getElementById('lewis-score');
      var builder = {
        mode: 'screen', exerciseMode: false,
        mol: MOLECULES.H2, molId: 'H2', S: newState(MOLECULES.H2),
        doneSet: [], score: 0,
        container: container, trayEl: document.getElementById('lewis-tray'),
        stepEl: document.getElementById('lewis-step'),
        instrEl: document.getElementById('lewis-instruction'),
        tipEl: document.getElementById('lewis-dica'),
        msgEl: document.getElementById('lewis-msg'),
        scoreEl: scoreEl, chipsEl: chips,
        confirmBtn: document.getElementById('btn-lewis-confirm'),
        refreshBtn: document.getElementById('btn-lewis-refresh'),
        canvas: document.getElementById('lewis-canvas'),
        locked: false, bgDirty: true, msgFlash: 0
      };
      this.current = builder;
      this._mountChips(builder, chips);
      this._buildUI(builder);
      this._bindButtons(builder);
      this._bindPointer(builder);
      this._bindKeyboard(builder);
      if (scoreEl) scoreEl.textContent = '0 pts';
      renderStepUI(builder);
      renderChips(builder);
      loopEl = builder;
      loopCb = function (t) { render(loopEl.canvas.getContext('2d'), loopEl.mol, loopEl.S, t); };
      startLoop();
      this._resize();
    },

    exit: function () {
      stopLoop();
      loopEl = null;
      loopCb = null;
      this.current = null;
    },

    _mountChips: function (builder, chips) {
      if (!chips) return;
      chips.innerHTML = '';
      MOL_ORDER.forEach(function (id) {
        var m = MOLECULES[id];
        var b = document.createElement('button');
        b.className = 'lewis-mol' + (id === builder.molId ? ' active' : '');
        b.setAttribute('type', 'button');
        b.innerHTML = '<span class="lewis-mol-f">' + m.formula + '</span><span class="lewis-mol-n">' + m.name + '</span>';
        b.addEventListener('click', function () {
          sfx('click');
          Array.prototype.forEach.call(chips.querySelectorAll('.lewis-mol'), function (x) {
            x.classList.toggle('active', x === b);
          });
          resetMol(builder, id);
        });
        chips.appendChild(b);
      });
    },

    _buildUI: function (builder) {
      var c = builder.canvas;
      if (!c) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      builder.dpr = dpr;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.aspectRatio = W + ' / ' + H;
      builder.ctx = c.getContext('2d');
    },

    _bindButtons: function (builder) {
      if (builder.confirmBtn) {
        builder.confirmBtn.onclick = function () { sfx('click'); confirmStep(builder); };
      }
      if (builder.refreshBtn) {
        builder.refreshBtn.onclick = function () { resetStep(builder); };
      }
      var resetAll = document.getElementById('btn-lewis-reset');
      if (resetAll) resetAll.onclick = function () { sfx('click'); resetMol(builder); };
    },

    _bindPointer: function (builder) {
      var cv = builder.canvas;
      if (!cv) return;
      var onDown = function (e) {
        e.preventDefault();
        var r = cv.getBoundingClientRect();
        var p = {
          x: (e.clientX - r.left) / (r.width || 1) * W,
          y: (e.clientY - r.top) / (r.height || 1) * H
        };
        onCanvasTap(builder, p);
      };
      cv.addEventListener('pointerdown', onDown);
      builder._cleanup = function () { cv.removeEventListener('pointerdown', onDown); };
    },

    _bindKeyboard: function (builder) {
      var onKey = function (e) {
        var scr = document.getElementById('screen-lewis');
        if (!scr || !scr.classList.contains('active')) return;
        if (e.code === 'Enter') {
          if (document.activeElement && document.activeElement === builder.canvas) { e.preventDefault(); confirmStep(builder); }
        }
      };
      document.addEventListener('keydown', onKey);
      builder._cleanupKb = function () { document.removeEventListener('keydown', onKey); };
    },

    _resize: function () {
      var stage = document.getElementById('lewis-stage');
      if (!stage) return;
      var c = document.getElementById('lewis-canvas');
      if (c && c.clientWidth) { /* redraw next frame */ }
    },

    /* ---- Modo exercício (motor de exercícios) ---- */
    buildExercise: function (x, item) {
      var wrap = document.createElement('div');
      wrap.className = 'lewis-exercise';
      var stage = document.createElement('div');
      stage.className = 'lewis-stage lewis-stage-ex';
      var canvas = document.createElement('canvas');
      canvas.id = 'lewis-canvas-ex';
      stage.appendChild(canvas);
      wrap.appendChild(stage);

      var side = document.createElement('div');
      side.className = 'lewis-side-ex';
      var stepEl = document.createElement('div');
      stepEl.className = 'lewis-step';
      var instr = document.createElement('p');
      instr.className = 'lewis-instruction';
      var dica = document.createElement('p');
      dica.className = 'lewis-dica';
      var tray = document.createElement('div');
      tray.className = 'lewis-tray';
      var msg = document.createElement('p');
      msg.className = 'lewis-msg';
      msg.hidden = true;
      var btns = document.createElement('div');
      btns.className = 'lewis-buttons';
      var confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn btn-primary';
      confirmBtn.type = 'button';
      confirmBtn.textContent = 'Confirmar etapa';
      var refreshBtn = document.createElement('button');
      refreshBtn.className = 'btn';
      refreshBtn.type = 'button';
      refreshBtn.textContent = 'Refazer etapa';
      btns.appendChild(refreshBtn);
      btns.appendChild(confirmBtn);
      side.appendChild(stepEl);
      side.appendChild(instr);
      side.appendChild(tray);
      side.appendChild(dica);
      side.appendChild(msg);
      side.appendChild(btns);
      wrap.appendChild(side);
      x.body.appendChild(wrap);

      var mol = MOLECULES[item.molecule] || MOLECULES.H2O;
      var builder = {
        mode: 'exercise', exerciseMode: true,
        mol: mol, molId: mol.id, S: newState(mol),
        doneSet: [], score: 0,
        container: wrap, trayEl: tray,
        stepEl: stepEl, instrEl: instr, tipEl: dica, msgEl: msg,
        scoreEl: null, chipsEl: null,
        confirmBtn: confirmBtn, refreshBtn: refreshBtn,
        canvas: canvas, locked: false, bgDirty: true, msgFlash: 0
      };
      x.state.lewisBuilder = builder;
      x.ctx = canvas.getContext('2d');
      x.W = W;
      x.H = H;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      builder.dpr = dpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.aspectRatio = W + ' / ' + H;
      builder.ctx = canvas.getContext('2d');
      confirmBtn.onclick = function () { sfx('click'); confirmStep(builder); };
      refreshBtn.onclick = function () { resetStep(builder); };
      var onDown = function (e) {
        e.preventDefault();
        var r = canvas.getBoundingClientRect();
        var p = {
          x: (e.clientX - r.left) / (r.width || 1) * W,
          y: (e.clientY - r.top) / (r.height || 1) * H
        };
        onCanvasTap(builder, p);
      };
      canvas.addEventListener('pointerdown', onDown);
      builder._cleanup = function () { canvas.removeEventListener('pointerdown', onDown); };

      /* o motor mostra o próprio Confirmar/Limpar para os outros tipos;
         aqui o builder controla as etapas internamente */
      var checkBtn = document.getElementById('btn-ex-check');
      var clearBtn = document.getElementById('btn-ex-clear');
      if (checkBtn) checkBtn.hidden = true;
      if (clearBtn) clearBtn.hidden = true;

      /* Enter/Espaço devem avançar a ETAPA (não "responder" no meio) */
      var onKey = function (e) {
        if (e.code !== 'Enter' && e.code !== 'Space') return;
        if (typeof Exercise === 'undefined' || !Exercise.session) return;
        var it = Exercise.session[Exercise.idx];
        if (!it || it.type !== 'lewisBuilder') return;
        var b = Exercise.x && Exercise.x.state && Exercise.x.state.lewisBuilder;
        if (!b || b.S.complete) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        confirmStep(b);
      };
      document.addEventListener('keydown', onKey, true);
      builder._cleanupKb = function () {
        document.removeEventListener('keydown', onKey, true);
        if (kbGuard === onKey) kbGuard = null;
      };
      if (kbGuard) document.removeEventListener('keydown', kbGuard, true);
      kbGuard = onKey;

      builderHook = builder;
      renderStepUI(builder);
      renderChips(builder);
      render(canvas.getContext('2d'), mol, builder.S, 0);
      return builder;
    },

    destroyExercise: function (x) {
      var b = x && x.state && x.state.lewisBuilder;
      if (b && b._cleanup) b._cleanup();
      if (b && b._cleanupKb) b._cleanupKb();
      builderHook = null;
    },

    /* reset completo (usado pelo motor de exercícios ao limpar) */
    resetExercise: function (x) {
      var b = x && x.state && x.state.lewisBuilder;
      if (!b) return;
      var mol = b.mol;
      b.S = newState(mol);
      b.locked = false;
      b.confirmBtn.disabled = false;
      b.refreshBtn.disabled = false;
      renderChips(b);
      renderStepUI(b);
      if (b.msgEl) b.msgEl.hidden = true;
    }
  };

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
    T.lewisBuilder = {
      name: 'Fórmula de Lewis',
      icon: 'board',
      build: function (x, item) {
        x.state.lewisBuilder = LewisBuilder.buildExercise(x, item);
        x.state.lewisReset = function () { LewisBuilder.resetExercise(x); };
      },
      render: function (x, item) {
        var b = x.state && x.state.lewisBuilder;
        if (b && b.ctx) render(b.ctx, b.mol, b.S, 0);
      },
      collect: function (x) {
        var b = x.state && x.state.lewisBuilder;
        if (!b) return null;
        return { mol: b.molId, complete: b.S.complete && validateFinal(b.mol, b.S) };
      },
      grade: function (item, ans) {
        return !!(ans && ans.complete);
      },
      clear: function (x) {
        LewisBuilder.resetExercise(x);
      },
      hint: function () {
        return 'Siga as 6 etapas para montar a estrutura de Lewis (pontos = elétrons).';
      }
    };
    /* itens do tipo lewisBuilder na Fase 2 (Planeta Covalente) */
    var levels = exerciseLevels();
    if (levels && levels[2]) {
      var already = levels[2].some(function (i) { return i.type === 'lewisBuilder'; });
      if (!already) {
        levels[2].push({
          type: 'lewisBuilder',
          molecule: 'H2O',
          instruction: 'Monte a Fórmula de Lewis da ÁGUA (H₂O) seguindo as 6 etapas: os elétrons de valência são pontos, nunca traços.',
          explain: 'No H₂O o oxigênio é o átomo central: tem 6 elétrons de valência, forma 2 pares compartilhados com os H e mantém 2 pares isolados (octeto).',
          pts: 150
        });
      }
    }
  }

  /* registrar após o motor de exercícios carregar */
  if (exerciseTypes()) {
    registerExerciseType();
  } else if (typeof window !== 'undefined') {
    /* pode carregar antes de exercises.js: tenta de novo em seguida */
    setTimeout(registerExerciseType, 0);
  }

  window.LewisBuilder = LewisBuilder;
  window.LewisMolecule = MOLECULES;
})();
