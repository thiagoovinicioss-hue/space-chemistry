/* ============================================================
   SPACE CHEMISTRY: MISSION BONDS — classroom.js
   Sala de aula interativa: Prof. Lewis + quadro negro.

   Fonte do conteúdo (preservada fielmente):
   - "Aula 05-Ligações Quimicas-Iônica- 9 anos"
   - "Aula 06-Ligações Quimicas-covalentes- 9 anos"
   - "Aula 07-Ligacões Quimicas-Metálicas- 9 anos"
   - Vídeo "Química: Metais e Ligações Metálicas" (complemento
     didático da parte de ligações metálicas).
============================================================ */
(function () {
'use strict';

/* ---------------- Assets do professor (prof_corpo) ---------------- */
const PROF_CLOSED_SRC = 'assets/images/prof_corpo_closed.png';
const PROF_OPEN_SRC   = 'assets/images/prof_corpo_open.png';
const profImgs = { closed: new Image(), open: new Image() };
profImgs.closed.src = PROF_CLOSED_SRC;
profImgs.open.src = PROF_OPEN_SRC;

/* ============================================================
   DADOS DAS AULAS
   board.lines  -> texto do quadro (fiel aos slides dos PDFs)
   say[]        -> fala do Prof. Lewis para cada linha
   diagram      -> animação desenhada no quadro
============================================================ */

const LESSONS = {

  /* ------------------------------------------------------------
     LIGAÇÕES IÔNICAS — Aula 05
     (5 slides introdutórios pulados conforme solicitação)
  ------------------------------------------------------------ */
  ionica: {
    label: 'LIGAÇÕES IÔNICAS',
    accent: '#ff9df2',
    slides: [
      {
        title: 'BORA RELEMBRAR?',
        lines: [
          'Qual o nome dado à última camada? Isso mesmo: camada de valência!',
          'Distribuição eletrônica: modo como os elétrons estão distribuídos nas camadas (níveis de energia) ao redor do núcleo.',
          'Exemplo — Cloro: 2, 8, 7 elétrons.'
        ],
        hl: ['hl-p', '', 'hl-y'],
        say: [
          'Antes da aula nova, vamos lembrar: como se chama a última camada? Isso mesmo, camada de valência!',
          'A distribuição eletrônica mostra onde os elétrons ficam: em camadas ou níveis de energia ao redor do núcleo.',
          'Olhem o cloro no quadro: 2 elétrons na primeira camada, 8 na segunda e 7 na última. Guardem esse 7!'
        ],
        diagram: 'bohrCl'
      },
      {
        title: 'O QUE SERIA UMA LIGAÇÃO QUÍMICA?',
        lines: [
          'É a união de dois ou mais átomos de elementos iguais ou diferentes.',
          'Eles buscam perder, ganhar ou compartilhar elétrons para ficarem estáveis.',
          'Linus Pauling: pesquisador norte-americano considerado o pai da Ligação Química e um dos principais químicos do século XX.'
        ],
        hl: ['', 'hl-y', 'hl-c'],
        say: [
          'Ligação química é a união entre átomos — podem ser iguais ou diferentes.',
          'Os átomos se unem porque querem perder, ganhar ou compartilhar elétrons e assim ficarem estáveis.',
          'Quem estudou isso profundamente foi Linus Pauling, o pai da ligação química!'
        ],
        diagram: 'uniao'
      },
      {
        title: 'TEORIA DO OCTETO',
        lines: [
          'Regra do Octeto',
          'Objetivo: tornar as moléculas estáveis.',
          'Contendo 2 ou 8 elétrons na camada de valência.',
          'Teoria proposta por Newton Lewis: a interação atômica acontece para que cada elemento adquira a estabilidade.'
        ],
        hl: ['hl-y', '', '', 'hl-c'],
        say: [
          'Agora sim: a Regra do Octeto! É a base para entender todas as ligações.',
          'O objetivo é sempre a estabilidade das moléculas.',
          'Um átomo fica estável com 2 ou 8 elétrons na camada de valência, igual aos gases nobres.',
          'Essa teoria foi proposta por Newton Lewis: os átomos interagem justamente para adquirir estabilidade.'
        ],
        diagram: 'octet'
      },
      {
        title: 'LIGAÇÃO IÔNICA',
        lines: [
          'Ligação que DOA e RECEBE elétrons (transferência de elétrons).',
          'Ela ocorre entre átomos do grupo dos METAIS e AMETAIS.',
          'O metal PERDE elétrons e forma o CÁTION (+).',
          'O ametal GANHA elétrons e forma o ÂNION (−).'
        ],
        hl: ['hl-y', 'hl-p', 'hl-g', 'hl-c'],
        say: [
          'Na ligação iônica não há compartilhamento: um átomo doa e o outro recebe elétrons. É uma transferência!',
          'Ela acontece entre metais e ametais.',
          'Quando o metal perde elétrons, ele fica positivo: é o cátion.',
          'Quando o ametal ganha elétrons, fica negativo: é o ânion. Cátion e ânion se atraem e formam o composto!'
        ],
        diagram: 'transfer'
      },
      {
        title: '2 MODOS PARA RESOLVÊ-LA',
        lines: [
          'Esquema de orbitais:',
          'Desenhamos a última camada de cada átomo com seus respectivos elétrons.',
          'Doamos os elétrons dos átomos metálicos para os não metálicos.',
          'Ao término, juntamos e contamos a quantidade de átomos utilizada.'
        ],
        hl: ['hl-y', '', '', ''],
        say: [
          'Existem dois modos de montar uma ligação iônica. O primeiro é o esquema de orbitais.',
          'Desenhamos só a última camada de cada átomo, com seus pontos-elétrons.',
          'Os elétrons do metal são doados para o ametal até completar o octeto.',
          'No final juntamos tudo e contamos quantos átomos de cada tipo foram usados. Olhem o NaCl no quadro!'
        ],
        diagram: 'orbitais'
      },
      {
        title: '2 MODOS PARA RESOLVÊ-LA',
        lines: [
          'Escorregador de íons:',
          'Colocamos os átomos na sua forma iônica.',
          'Trocamos (escorregando) os íons de lado.',
          'Juntamos os átomos e contamos a quantidade utilizada. Ex.: Ca²⁺ e Cl⁻ → CaCl₂'
        ],
        hl: ['hl-y', '', '', 'hl-g'],
        say: [
          'O segundo modo é o escorregador de íons — o meu favorito!',
          'Primeiro escrevemos cada átomo já na forma iônica, com a carga.',
          'Depois os íons escorregam de lado, trocando de posição.',
          'As cargas viram os "pezinhos": Ca²⁺ com Cl⁻ dá CaCl₂. Contamos e pronto!'
        ],
        diagram: 'escorregador'
      },
      {
        title: 'RESUMINDO A AULA',
        lines: [
          'Ligação iônica = transferência de elétrons.',
          'Metal perde → cátion (+) · Ametal ganha → ânion (−).',
          'Metais + ametais formam compostos iônicos estáveis (regra do octeto!).'
        ],
        hl: ['hl-y', '', 'hl-g'],
        say: [
          'Vamos revisar: ligação iônica é transferência de elétrons.',
          'O metal vira cátion positivo; o ametal vira ânion negativo.',
          'Tudo isso para cumprir a regra do octeto e formar compostos estáveis. Excelente aula, cientistas!'
        ],
        diagram: null
      }
    ]
  },

  /* ------------------------------------------------------------
     LIGAÇÕES COVALENTES — Aula 06
     (2 primeiros slides pulados conforme solicitação)
  ------------------------------------------------------------ */
  covalente: {
    label: 'LIGAÇÕES COVALENTES',
    accent: '#7ff5ff',
    slides: [
      {
        title: 'LIGAÇÃO COVALENTE',
        lines: [
          'Caracterizada pelo COMPARTILHAMENTO de um ou mais pares de elétrons entre átomos.',
          'Objetivo: formar moléculas ESTÁVEIS.',
          'Geralmente ocorre entre os AMETAIS e o HIDROGÊNIO.'
        ],
        hl: ['hl-y', 'hl-g', 'hl-c'],
        say: [
          'Diferente da iônica, aqui ninguém doa nem rouba elétron: os átomos COMPARTILHAM pares de elétrons.',
          'Compartilhando, todos conseguem completar a valência e formam moléculas estáveis.',
          'Essa ligação acontece geralmente entre ametais — e também com o hidrogênio.'
        ],
        diagram: 'share'
      },
      {
        title: 'EXEMPLO: GÁS METANO (CH₄)',
        lines: [
          'O carbono compartilha elétrons com 4 hidrogênios.',
          'Todos atingem a estabilidade e formam a molécula de CH₄.'
        ],
        hl: ['', 'hl-g'],
        say: [
          'Vejam o gás metano, aquele das vacas! O carbono compartilha elétrons com quatro hidrogênios.',
          'Assim todos ficam estáveis: nasce a molécula de CH₄.'
        ],
        diagram: 'metano'
      },
      {
        title: 'FÓRMULAS DA LIGAÇÃO COVALENTE',
        lines: [
          '1ª) Fórmula molecular: indica a quantidade de átomos de cada elemento que forma a molécula originada a partir de ligações covalentes.',
          'Exemplo: H₂O'
        ],
        hl: ['hl-y', 'hl-c'],
        say: [
          'Para representar as moléculas usamos três fórmulas. A primeira é a molecular.',
          'Ela diz quantos átomos de cada elemento existem na molécula: na água, H₂O, temos 2 hidrogênios e 1 oxigênio.'
        ],
        diagram: 'molecular'
      },
      {
        title: 'FÓRMULAS DA LIGAÇÃO COVALENTE',
        lines: [
          '2ª) Fórmula estrutural: demonstra a organização da molécula utilizando TRAÇOS que representam a ligação de cada átomo.',
          'Exemplo: H–O–H'
        ],
        hl: ['hl-y', 'hl-c'],
        say: [
          'A segunda é a estrutural, feita de traços.',
          'Cada traço representa uma ligação: vejam a água, H–O–H.'
        ],
        diagram: 'estrutural'
      },
      {
        title: 'FÓRMULAS DA LIGAÇÃO COVALENTE',
        lines: [
          '3ª) Fórmula de Lewis: usa a organização da fórmula estrutural e substitui cada traço das ligações por "duas bolinhas", que representam os elétrons.'
        ],
        hl: ['hl-y'],
        say: [
          'E a terceira é a famosa fórmula de Lewis!',
          'Pegamos a estrutural e trocamos cada traço por duas bolinhas — os elétrons compartilhados.'
        ],
        diagram: 'lewis'
      },
      {
        title: 'TIPOS DE LIGAÇÃO COVALENTE',
        lines: [
          'SIMPLES: o átomo compartilhou apenas 1 elétron de sua camada de valência. Ex.: H–O–H',
          'DUPLA: compartilhou 2 elétrons. Ex.: O=C=O',
          'TRIPLA: compartilhou 3 elétrons. Ex.: N≡N'
        ],
        hl: ['hl-c', 'hl-y', 'hl-p'],
        say: [
          'As ligações covalentes podem ser simples: um único elétron compartilhado, como entre H e O na água.',
          'Podem ser duplas: dois elétrons compartilhados, como no gás carbônico, O=C=O — e também no O₂!',
          'E podem ser triplas: três elétrons compartilhados, como no nitrogênio do ar, N≡N.'
        ],
        diagram: 'tipos'
      },
      {
        title: 'RECAPITULANDO',
        lines: [
          'Covalente = compartilhamento de elétrons (ametais + hidrogênio).',
          'Fórmulas: molecular (quantidade), estrutural (traços) e Lewis (bolinhas).',
          'Tipos: simples, dupla e tripla.'
        ],
        hl: ['hl-y', 'hl-c', 'hl-p'],
        say: [
          'Recapitulando: covalente é compartilhamento entre ametais e hidrogênio.',
          'Representamos com as fórmulas molecular, estrutural e de Lewis.',
          'E as ligações podem ser simples, duplas ou triplas.'
        ],
        diagram: null
      },
      {
        title: 'BORA TREINAR?',
        lines: [
          'Agora é a sua vez, jovem cientista!',
          'Treine abaixo o que você aprendeu:'
        ],
        hl: ['hl-g', ''],
        say: [
          'Chegou a hora do treinamento! Escolha um desafio abaixo e boa prática.',
          'No Lewis você usa bolinhas; no Estrutural, traços. Depois volte aqui para continuar!'
        ],
        diagram: null,
        training: true
      }
    ]
  },

  /* ------------------------------------------------------------
     LIGAÇÕES METÁLICAS — Aula 07
     (2 primeiros slides pulados conforme solicitação)
     Conteúdo complementar baseado no vídeo
     "Química: Metais e Ligações Metálicas".
  ------------------------------------------------------------ */
  metalica: {
    label: 'LIGAÇÕES METÁLICAS',
    accent: '#ffd166',
    slides: [
      {
        title: 'RELEMBRANDO RAPIDINHO...',
        lines: [
          'Ligação iônica: perda ou ganho de elétrons, formando o cátion e o ânion.',
          'Ligação covalente: compartilhamento de elétrons, formando a molécula.'
        ],
        hl: ['hl-p', 'hl-c'],
        say: [
          'Bora relembrar rapidinho as duas ligações que já dominamos!',
          'Iônica: perda ou ganho de elétrons — aparece o cátion e o ânion. Covalente: compartilhamento — nasce a molécula.'
        ],
        diagram: null
      },
      {
        title: 'OBJETIVOS DA AULA',
        lines: [
          'Conhecer as características dos metais;',
          'Identificar os metais na tabela periódica;',
          'Reconhecer diferentes processos de ligações químicas;',
          'Conhecer as ligações metálicas.'
        ],
        hl: ['', '', '', 'hl-y'],
        say: [
          'Nesta aula vamos conhecer as características dos metais.',
          'Vamos localizá-los na tabela periódica.',
          'Reconhecer mais um processo de ligação química…',
          '…e finalmente entender as ligações metálicas!'
        ],
        diagram: null
      },
      {
        title: 'ONDE ESTÃO OS METAIS NA TABELA PERIÓDICA?',
        lines: [
          'Metais são elementos caracterizados pelo BRILHO, RESISTÊNCIA, CONDUTIVIDADE TÉRMICA e ELÉTRICA.',
          'Veja na tabela a região ocupada pelos metais.'
        ],
        hl: ['hl-y', ''],
        say: [
          'Os metais têm características bem marcantes: brilho, resistência e conduzir calor e eletricidade.',
          'É aquela enorme região dourada da tabela periódica — ferro, alumínio, cobre, ouro… todos ali!'
        ],
        diagram: 'ptable'
      },
      {
        title: 'LIGAÇÃO METÁLICA',
        lines: [
          'Na ligação metálica, os átomos neutros e cátions ficam MERGULHADOS na nuvem eletrônica ou MAR DE ELÉTRONS.',
          'Formada somente entre átomos de METAIS — do mesmo elemento químico ou de elementos diferentes.',
          'Os átomos de metais têm tendência a formar CÁTIONS.'
        ],
        hl: ['hl-y', 'hl-c', 'hl-p'],
        say: [
          'Chegamos à estrela da aula: imagine átomos neutros e cátions mergulhados dentro de uma nuvem de elétrons. É a ligação metálica!',
          'Ela só acontece entre metais — pode ser o mesmo elemento ou elementos diferentes, como nas ligas.',
          'E por que isso acontece? Porque metais têm poucos elétrons na valência e tendência a perdê-los, virando cátions.'
        ],
        diagram: 'seaIntro'
      },
      {
        title: 'FORMAÇÃO DO MAR DE ELÉTRONS',
        lines: [
          'Os elétrons presentes na CAMADA DE VALÊNCIA saem dessa camada fazendo com que o átomo se torne um CÁTION.',
          'Após saírem, os elétrons passam a RODEAR os cátions formando um verdadeiro MAR DE ELÉTRONS.'
        ],
        hl: ['hl-y', 'hl-c'],
        say: [
          'Observem a animação: os elétrons da camada de valência abandonam o átomo… e ele vira um cátion!',
          'Esses elétrons, vindos de todos os átomos do metal, passam a rondar os cátions — formam o famoso mar de elétrons. Ninguém é de ninguém: eles são livres!'
        ],
        diagram: 'seaFormation'
      },
      {
        title: 'NUVEM ELETRÔNICA E ATRAÇÃO',
        lines: [
          'Os elétrons se movimentam LIVREMENTE pelo material, formando a "nuvem eletrônica".',
          'Essa "nuvem eletrônica" é responsável pela FORTE ATRAÇÃO ENTRE OS CÁTIONS.',
          'Atração eletrostática: carga (+) dos cátions ↔ carga (−) dos elétrons livres.'
        ],
        hl: ['hl-c', 'hl-y', 'hl-p'],
        say: [
          'Dentro do metal esses elétrons se movem livremente — por isso chamamos de nuvem eletrônica ou elétrons deslocalizados.',
          'E essa nuvem colante é que segura os cátions juntos, numa forte atração.',
          'Como explica o vídeo que inspirou esta parte: cargas opostas se atraem — os cátions positivos ficam presos no mar negativo de elétrons. Alguns livros chamam esses cátions de pseudocátions!'
        ],
        diagram: 'attraction'
      },
      {
        title: 'APROFUNDANDO: POR QUE ISSO ACONTECE?',
        lines: [
          'Metais têm POUCOS elétrons de valência e forte tendência a DOÁ-LOS.',
          'Os elétrons doados ficam LIVRES/DELOCALIZADOS — não pertencem a um único átomo.',
          'Resultado: um mar de elétrons que une todos os cátions do metal.'
        ],
        hl: ['hl-y', 'hl-c', 'hl-g'],
        say: [
          'Um detalhe importante do vídeo: o metal doa elétrons com facilidade porque tem poucos na última camada.',
          'Uma vez livres, eles não pertencem mais a átomo nenhum — circulam pelo metal inteiro.',
          'É esse mar coletivo que funciona como uma "cola" mantendo toda a estrutura metálica unida.'
        ],
        diagram: 'sea'
      },
      {
        title: 'DA ESTRUTURA ÀS PROPRIEDADES',
        lines: [
          'CONDUTIVIDADE ELÉTRICA: os elétrons livres se movimentam quando aplicamos tensão.',
          'CONDUTIVIDADE TÉRMICA: elétrons velozes carregam energia pelo material.',
          'BRILHO: elétrons livres interagem com a luz e a reemitem.',
          'MALEABILIDADE E DUCTILIDADE: os cátions deslizam no mar sem quebrar a atração.'
        ],
        hl: ['hl-c', 'hl-y', 'hl-p', 'hl-g'],
        say: [
          'Agora a mágica: é a estrutura da ligação que explica as propriedades dos metais! Aplicando tensão, os elétrons livres fluem — corrente elétrica!',
          'Calor também viaja rápido: os elétrons velozes espalham energia pelo material.',
          'E o brilho? A luz choca os elétrons livres, que reemitem ela de volta. Metal reluzente!',
          'Martelar sem quebrar? Os cátions escorregam entre os elétrons e a atração continua — maleabilidade e ductilidade!'
        ],
        diagram: 'properties'
      },
      {
        title: 'RESUMO DA AULA',
        lines: [
          'ESTRUTURA DA LIGAÇÃO → MAR DE ELÉTRONS',
          'MOVIMENTO DOS ELÉTRONS → PROPRIEDADES DOS METAIS',
          'Brilho · Resistência · Condutividade térmica e elétrica'
        ],
        hl: ['hl-y', 'hl-c', 'hl-g'],
        say: [
          'Vamos fixar essa corrente: a estrutura da ligação cria o mar de elétrons.',
          'O movimento desses elétrons explica as propriedades dos metais.',
          'Brilho, resistência e condutividades térmica e elétrica — tudo começa no mar de elétrons! Para reforçar, assistam ao vídeo "Química: Metais e Ligações Metálicas". Excelente aula!'
        ],
        diagram: 'chain'
      }
    ]
  }
};

/* ============================================================
   MOTOR DE DIAGRAMAS (canvas do quadro)
============================================================ */
const DW = 560, DH = 250;

/* --- helpers de desenho estilo giz --- */
function chalkText(ctx, txt, x, y, size, color, align, font) {
  ctx.save();
  ctx.font = (size || 14) + 'px "' + (font || 'Pixelify Sans') + '", "Press Start 2P", monospace';
  ctx.fillStyle = color || '#eef6ef';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color || '#eef6ef';
  ctx.shadowBlur = 4;
  ctx.fillText(txt, x, y);
  ctx.restore();
}
function circleFill(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}
function chalkLine(ctx, x1, y1, x2, y2, color, lw, dash) {
  ctx.save();
  ctx.strokeStyle = color || '#eef6ef';
  ctx.lineWidth = lw || 2;
  ctx.setLineDash(dash || []);
  ctx.lineCap = 'round';
  ctx.shadowColor = color || '#eef6ef';
  ctx.shadowBlur = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
function chalkArrow(ctx, x1, y1, x2, y2, color, lw, dash) {
  chalkLine(ctx, x1, y1, x2, y2, color, lw, dash);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(x2, y2); ctx.rotate(ang);
  ctx.fillStyle = color || '#eef6ef';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* elétron (bolinha brilhante) */
function electronDot(ctx, x, y, color, r) {
  const rr = r || 4;
  ctx.save();
  ctx.shadowColor = color || '#7ff5ff';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color || '#7ff5ff';
  ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/* posição do k-ésimo elétron na órbita (com rotação temporal) */
function orbitPos(cx, cy, R, k, n, t, speed) {
  const a = (k / n) * Math.PI * 2 + t * (speed == null ? 0.6 : speed);
  return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
}
/* átomo de Bohr: núcleo + camadas com elétrons girando */
function bohrAtom(ctx, cx, cy, R, shells, opts) {
  opts = opts || {};
  const t = opts.t || 0;
  const nShells = shells.length;
  for (let s = 0; s < nShells; s++) {
    const r = R * ((s + 1) / nShells);
    const hl = opts.hlShell === s;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = hl ? 'rgba(255,209,102,' + (0.65 + 0.3 * Math.sin(t * 5)) + ')' : 'rgba(238,246,239,0.4)';
    ctx.lineWidth = hl ? 2.5 : 1.2;
    ctx.stroke();
    const n = shells[s];
    const speed = 0.9 / (s + 1);
    for (let k = 0; k < n; k++) {
      const p = orbitPos(cx, cy, r, k, n, t, speed);
      electronDot(ctx, p.x, p.y, hl ? '#ffd166' : '#7ff5ff', 3.2);
    }
  }
  /* núcleo */
  circleFill(ctx, cx, cy, R * 0.22, '#ff5d6c', 'rgba(255,255,255,0.5)', 1.5);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.6;
    ctx.fillRect(cx + Math.cos(a) * R * 0.09 - 1, cy + Math.sin(a) * R * 0.09 - 1, 2, 2);
  }
  if (opts.symbol) chalkText(ctx, opts.symbol, cx, cy + R * 0.42, 13, '#ffd166');
}

/* --- diagramas individuais --- */
const DIAGRAMS = {

  /* Iônicas: Bohr do cloro com camada de valência destacada */
  bohrCl: function (ctx, t) {
    bohrAtom(ctx, DW * 0.32, DH / 2, 88, [2, 8, 7], { t, hlShell: 2, symbol: 'Cloro' });
    chalkArrow(ctx, DW * 0.62, 46, DW * 0.32 + 84, DH / 2 - 62, '#ffd166', 2, [4, 4]);
    chalkText(ctx, 'Camada de valência (7 e⁻)', DW * 0.72, 40, 14, '#ffd166');
    chalkText(ctx, 'Órbitas / camadas de energia', DW * 0.74, 96, 13, '#eef6ef');
    chalkArrow(ctx, DW * 0.66, 108, DW * 0.44, DH / 2 + 40, 'rgba(238,246,239,0.7)', 1.5, [4, 4]);
    chalkText(ctx, 'Núcleo: prótons + nêutrons', DW * 0.74, 168, 13, '#ff9df2');
    chalkArrow(ctx, DW * 0.64, 176, DW * 0.36, DH / 2 + 8, '#ff9df2', 1.5, [4, 4]);
    chalkText(ctx, '● elétrons', DW * 0.76, 216, 13, '#7ff5ff');
  },

  /* Iônicas: dois átomos se unindo */
  uniao: function (ctx, t) {
    const cyc = (t % 4) / 4;
    const sep = 120 + Math.sin(Math.min(cyc, 0.5) * Math.PI * 2) * 40;
    const cy = DH / 2;
    const x1 = DW / 2 - sep / 2 - 26, x2 = DW / 2 + sep / 2 + 26;
    bohrAtom(ctx, x1, cy, 40, [2, 6], { t });
    bohrAtom(ctx, x2, cy, 40, [2, 8], { t: t + 1.3 });
    if (cyc > 0.55) {
      const glow = 0.4 + 0.3 * Math.sin(t * 6);
      ctx.save();
      ctx.globalAlpha = glow;
      circleFill(ctx, DW / 2, cy, 16, 'rgba(93,255,166,0.25)', '#5dffa6', 2);
      electronDot(ctx, DW / 2 - 6, cy, '#5dffa6', 3.4);
      electronDot(ctx, DW / 2 + 6, cy, '#5dffa6', 3.4);
      ctx.restore();
    }
    chalkText(ctx, 'união de átomos → molécula estável', DW / 2, DH - 18, 14, '#5dffa6');
  },

  /* Iônicas: octeto instável vs estável */
  octet: function (ctx, t) {
    const cy = DH / 2 - 10;
    bohrAtom(ctx, DW * 0.25, cy, 58, [2, 7], { t, hlShell: 1 });
    chalkText(ctx, 'INSTÁVEL', DW * 0.25, cy + 78, 13, '#ff5d6c');
    bohrAtom(ctx, DW * 0.75, cy, 58, [2, 8], { t, hlShell: 1 });
    chalkText(ctx, 'ESTÁVEL (octeto!)', DW * 0.75, cy + 78, 13, '#5dffa6');
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.save();
    ctx.globalAlpha = 0.25 + pulse * 0.25;
    circleFill(ctx, DW * 0.75, cy, 58, null, '#5dffa6', 3);
    ctx.restore();
    chalkText(ctx, '2 ou 8 e⁻ na camada de valência', DW / 2, DH - 16, 15, '#ffd166');
  },

  /* Iônicas: transferência Na → Cl */
  transfer: function (ctx, t) {
    const cyc = (t % 6) / 6;
    const cy = DH / 2;
    const x1 = DW * 0.24, x2 = DW * 0.76;
    const lost = cyc > 0.45;
    bohrAtom(ctx, x1, cy, 52, [2, 8, lost ? 0 : 1], { t, hlShell: lost ? -1 : 2, symbol: lost ? 'Na⁺' : 'Na' });
    bohrAtom(ctx, x2, cy, 52, [2, 8, cyc > 0.75 ? 8 : 7], { t: t + 2, hlShell: 2, symbol: cyc > 0.75 ? 'Cl⁻' : 'Cl' });
    if (!lost) {
      chalkText(ctx, 'doador (metal)', x1, cy + 82, 12, '#ff9df2');
      chalkText(ctx, 'receptor (ametal)', x2, cy + 82, 12, '#7ff5ff');
    } else {
      chalkText(ctx, 'CÁTION (+)', x1, cy + 82, 12, '#5dffa6');
      chalkText(ctx, 'ÂNION (−)', x2, cy + 82, 12, '#5dffa6');
    }
    if (cyc > 0.15 && cyc <= 0.45) {
      const p = (cyc - 0.15) / 0.3;
      const ex = x1 + (x2 - x1 - 60) * p;
      const ey = cy - 70 + Math.sin(p * Math.PI) * -18;
      chalkLine(ctx, x1 + 30, cy - 52, x2 - 30, cy - 52, 'rgba(255,209,102,0.5)', 1.5, [5, 5]);
      electronDot(ctx, ex, ey, '#ffd166', 5);
    }
    chalkText(ctx, 'TRANSFERÊNCIA DE ELÉTRONS', DW / 2, 24, 15, '#ffd166');
  },

  /* Iônicas: esquema de orbitais (Na + Cl → NaCl) */
  orbitais: function (ctx, t) {
    const cyc = (t % 5) / 5;
    const y = DH / 2 - 16;
    const x1 = DW * 0.28, x2 = DW * 0.72;
    circleFill(ctx, x1, y, 34, null, '#ff9df2', 2);
    chalkText(ctx, 'Na', x1, y, 17, '#ff9df2');
    electronDot(ctx, x1 + Math.cos(t) * 30, y + Math.sin(t) * 30, '#ffd166', 4);
    circleFill(ctx, x2, y, 34, null, '#7ff5ff', 2);
    chalkText(ctx, 'Cl', x2, y, 17, '#7ff5ff');
    for (let k = 0; k < 7; k++) {
      const p = orbitPos(x2, y, 27, k, 7, t * 0.5, 0.4);
      electronDot(ctx, p.x, p.y, '#7ff5ff', 3);
    }
    if (cyc > 0.2 && cyc <= 0.55) {
      const p = (cyc - 0.2) / 0.35;
      chalkArrow(ctx, x1 + 38, y - 30, x1 + 38 + (x2 - x1 - 90) * p, y - 44, '#ffd166', 2, [5, 4]);
      electronDot(ctx, x1 + 38 + (x2 - x1 - 90) * p, y - 44, '#ffd166', 4.5);
      chalkText(ctx, 'doação do elétron do metal', DW / 2, 26, 13, '#ffd166');
    }
    if (cyc > 0.62) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (cyc - 0.62) / 0.12);
      chalkText(ctx, 'Na⁺ + Cl⁻  →  NaCl', DW / 2, DH - 26, 19, '#5dffa6');
      ctx.restore();
    }
    chalkText(ctx, 'esquema de orbitais: desenhamos a ÚLTIMA camada', DW / 2, 24, 13, '#eef6ef');
  },

  /* Iônicas: escorregador de íons (Ca²⁺ + 2Cl⁻ → CaCl₂) */
  escorregador: function (ctx, t) {
    const cyc = (t % 6) / 6;
    const yTop = 62, yBot = DH - 52;
    const lx = DW * 0.3, rx = DW * 0.7;
    const box = function (x, y, txt, color) {
      ctx.save();
      ctx.font = '17px "Pixelify Sans", monospace';
      const w = Math.max(64, ctx.measureText(txt).width + 22);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const bx = x - w / 2, by = y - 17, bh = 34;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, w, bh, 8); else ctx.rect(bx, by, w, bh);
      ctx.fill(); ctx.stroke();
      chalkText(ctx, txt, x, y + 1, 17, color);
      ctx.restore();
    };
    chalkText(ctx, 'ESCORREGADOR DE ÍONS', DW / 2, 24, 15, '#ffd166');
    let caX = lx, clX = rx;
    if (cyc > 0.35 && cyc <= 0.65) {
      const p = (cyc - 0.35) / 0.3;
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      caX = lx + (rx - lx) * ease;
      clX = rx - (rx - lx) * ease;
      chalkLine(ctx, lx, yTop - 26, rx, yBot + 26, 'rgba(255,157,242,0.5)', 1.5, [5, 5]);
      chalkLine(ctx, rx, yTop - 26, lx, yBot + 26, 'rgba(127,245,255,0.5)', 1.5, [5, 5]);
    }
    box(caX, yTop, 'Ca²⁺', '#ff9df2');
    box(clX, yTop, 'Cl⁻', '#7ff5ff');
    box(cyc > 0.65 ? rx : lx, yBot, 'Cl⁻', '#7ff5ff');
    box(cyc > 0.65 ? lx : rx, yBot, cyc > 0.65 ? 'Ca²⁺' : 'Ca²⁺', '#ff9df2');
    if (cyc > 0.75) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (cyc - 0.75) / 0.12);
      chalkText(ctx, 'junta tudo:  CaCl₂', DW / 2, DH / 2 + 4, 20, '#5dffa6');
      ctx.restore();
    } else {
      chalkText(ctx, 'escorrega e troca de lado!', DW / 2, DH / 2 + 4, 14, '#eef6ef');
    }
  },

  /* Covalentes: par compartilhado (H₂) */
  share: function (ctx, t) {
    const cy = DH / 2 - 8;
    const x1 = DW / 2 - 52, x2 = DW / 2 + 52;
    const R = 44;
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.save();
    ctx.globalAlpha = 0.25 + pulse * 0.2;
    circleFill(ctx, (x1 + x2) / 2, cy, 20, 'rgba(127,245,255,0.3)', '#7ff5ff', 1.5);
    ctx.restore();
    circleFill(ctx, x1, cy, R, null, 'rgba(238,246,239,0.65)', 2);
    circleFill(ctx, x2, cy, R, null, 'rgba(238,246,239,0.65)', 2);
    chalkText(ctx, 'H', x1, cy, 20, '#eef6ef');
    chalkText(ctx, 'H', x2, cy, 20, '#eef6ef');
    electronDot(ctx, (x1 + x2) / 2 - 6, cy + Math.sin(t * 5) * 3, '#7ff5ff', 4.2);
    electronDot(ctx, (x1 + x2) / 2 + 6, cy - Math.sin(t * 5) * 3, '#7ff5ff', 4.2);
    chalkText(ctx, 'par de elétrons COMPARTILHADO', DW / 2, DH - 22, 14, '#7ff5ff');
    chalkText(ctx, 'H–H  (H₂)', DW / 2, 26, 16, '#ffd166');
  },

  /* Covalentes: metano CH₄ */
  metano: function (ctx, t) {
    const cy = DH / 2 - 6;
    const cx = DW / 2;
    const R = 62;
    circleFill(ctx, cx, cy, 30, 'rgba(255,157,242,0.15)', '#ff9df2', 2);
    chalkText(ctx, 'C', cx, cy, 21, '#ff9df2');
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    dirs.forEach((d, i) => {
      const hx = cx + d[0] * R, hy = cy + d[1] * R;
      const mx = cx + d[0] * (R / 2), my = cy + d[1] * (R / 2);
      const ph = (Math.sin(t * 3 - i * 1.57) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = 0.45 + ph * 0.55;
      chalkLine(ctx, cx + d[0] * 32, cy + d[1] * 32, hx - d[0] * 20, hy - d[1] * 20, '#7ff5ff', 2);
      ctx.restore();
      electronDot(ctx, mx - d[1] * 4, my + d[0] * 4, '#7ff5ff', 3.4);
      electronDot(ctx, mx + d[1] * 4, my - d[0] * 4, '#7ff5ff', 3.4);
      circleFill(ctx, hx, hy, 17, 'rgba(238,246,239,0.08)', '#eef6ef', 1.6);
      chalkText(ctx, 'H', hx, hy + 1, 15, '#eef6ef');
    });
    chalkText(ctx, 'CH₄ — gás metano', DW / 2, 24, 16, '#ffd166');
  },

  /* Covalentes: fórmula molecular H₂O */
  molecular: function (ctx, t) {
    const grow = Math.min(1, (t % 4) / 0.8);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '58px "Pixelify Sans", monospace';
    ctx.fillStyle = '#7ff5ff';
    ctx.shadowColor = '#7ff5ff'; ctx.shadowBlur = 10;
    ctx.fillText('H', DW / 2 - 52, DH / 2 - 4);
    ctx.fillText('O', DW / 2 + 40, DH / 2 - 4);
    ctx.font = '34px "Pixelify Sans", monospace';
    ctx.fillText('2', DW / 2 - 12, DH / 2 + 18);
    ctx.restore();
    if (grow >= 1) chalkText(ctx, '2 hidrogênios + 1 oxigênio', DW / 2, DH - 26, 14, '#eef6ef');
    chalkText(ctx, 'FÓRMULA MOLECULAR: quantidade de átomos', DW / 2, 26, 14, '#ffd166');
  },

  /* Covalentes: fórmula estrutural H–O–H */
  estrutural: function (ctx, t) {
    const cyc = (t % 4) / 4;
    const cy = DH / 2 - 6, cx = DW / 2;
    const seg = 46;
    chalkText(ctx, 'H', cx - seg * 2, cy + 1, 22, '#eef6ef');
    chalkText(ctx, 'O', cx, cy + 1, 24, '#ff9df2');
    chalkText(ctx, 'H', cx + seg * 2, cy + 1, 22, '#eef6ef');
    const nSeg = 2;
    const prog = Math.min(1, cyc * 3);
    for (let i = 0; i < nSeg; i++) {
      const side = i === 0 ? -1 : 1;
      const x1 = cx + side * 24, x2 = cx + side * (seg * 2 - 24);
      const p = Math.max(0, Math.min(1, prog * 2 - i));
      if (p > 0) chalkLine(ctx, x1, cy, x1 + (x2 - x1) * p, cy, '#7ff5ff', 3);
    }
    chalkText(ctx, 'FÓRMULA ESTRUTURAL: traços = ligações', DW / 2, 26, 14, '#ffd166');
    if (prog >= 1) chalkText(ctx, 'cada traço é um par compartilhado', DW / 2, DH - 26, 14, '#7ff5ff');
  },

  /* Covalentes: fórmula de Lewis H₂O */
  lewis: function (ctx, t) {
    const cyc = (t % 4) / 4;
    const cy = DH / 2 - 6, cx = DW / 2;
    const seg = 50;
    chalkText(ctx, 'H', cx - seg * 2, cy + 1, 22, '#eef6ef');
    chalkText(ctx, 'O', cx, cy + 1, 24, '#ff9df2');
    chalkText(ctx, 'H', cx + seg * 2, cy + 1, 22, '#eef6ef');
    const pairs = [
      [cx - seg, cy], [cx + seg, cy],
      [cx - 11, cy - 22], [cx + 11, cy - 22],
      [cx - 11, cy + 22], [cx + 11, cy + 22]
    ];
    pairs.forEach((p, i) => {
      const show = cyc * 8 > i;
      if (!show) return;
      electronDot(ctx, p[0] - 5, p[1], '#7ff5ff', 3.6);
      electronDot(ctx, p[0] + 5, p[1], '#7ff5ff', 3.6);
    });
    chalkText(ctx, 'FÓRMULA DE LEWIS: traços → "duas bolinhas"', DW / 2, 26, 14, '#ffd166');
    if (cyc > 0.8) chalkText(ctx, 'bolinhas = ELÉTRONS', DW / 2, DH - 26, 14, '#7ff5ff');
  },

  /* Covalentes: tipos simples/dupla/tripla */
  tipos: function (ctx, t) {
    const cyc = (t % 6) / 6;
    const rows = [
      { y: 56, label: 'SIMPLES', color: '#7ff5ff', bonds: 1, f: ['H', 'O', 'H'] },
      { y: 122, label: 'DUPLA', color: '#ffd166', bonds: 2, f: ['O', 'C', 'O'] },
      { y: 188, label: 'TRIPLA', color: '#ff9df2', bonds: 3, f: ['N', 'N', null] }
    ];
    rows.forEach((r, ri) => {
      const active = cyc * 3 >= ri && cyc * 3 < ri + 1;
      const alpha = active ? 1 : 0.45;
      ctx.save();
      ctx.globalAlpha = alpha;
      const tripla = r.f[2] === null;
      const ax = tripla ? DW / 2 - 60 : DW / 2 - 110;
      const bx = tripla ? DW / 2 + 60 : DW / 2;
      const cx2 = tripla ? null : DW / 2 + 110;
      chalkText(ctx, r.f[0], ax, r.y + 1, 21, r.color);
      chalkText(ctx, r.f[1], bx, r.y + 1, 21, r.color);
      if (cx2 !== null) chalkText(ctx, r.f[2], cx2, r.y + 1, 21, r.color);
      const spots = tripla ? [[ax, bx]] : [[ax, bx], [bx, cx2]];
      const prog = active ? Math.min(1, (cyc * 3 - ri) * 2.5) : 1;
      spots.forEach((sp, si) => {
        const p = Math.max(0, Math.min(1, prog * spots.length - si));
        const gap = 22;
        const x1 = sp[0] + gap, x2 = sp[1] - gap;
        for (let b = 0; b < r.bonds; b++) {
          const off = (b - (r.bonds - 1) / 2) * 7;
          if (p > 0) chalkLine(ctx, x1, r.y + off, x1 + (x2 - x1) * p, r.y + off, r.color, 2.4);
        }
      });
      chalkText(ctx, r.label, DW - 58, r.y + 1, 15, r.color);
      ctx.restore();
    });
  },

  /* Metálicas: região dos metais na tabela */
  ptable: function (ctx, t) {
    const cols = 18, rows = 7;
    const cw = Math.floor((DW - 130) / cols), ch = Math.min(24, Math.floor((DH - 70) / rows));
    const ox = 24, oy = 34;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isMetal = !(c === 17 || (c >= 12 && r === 0)) && !(c === 1 && r === 0);
        const x = ox + c * cw, y = oy + r * ch;
        if (isMetal) {
          ctx.fillStyle = 'rgba(255,209,102,' + (0.35 + pulse * 0.25) + ')';
        } else {
          ctx.fillStyle = 'rgba(127,245,255,0.3)';
        }
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      }
    }
    chalkText(ctx, 'METAIS', ox + cw * 6, oy + rows * ch + 22, 15, '#ffd166');
    chalkText(ctx, 'AMETAIS', ox + cw * 16.5, oy + rows * ch + 22, 15, '#7ff5ff');
    chalkText(ctx, 'TABELA PERIÓDICA — região dos metais', DW / 2, 20, 14, '#ffd166');
  },

  /* Metálicas: neutros + cátions mergulhados na nuvem */
  seaIntro: function (ctx, t) {
    const cyc = (t % 6) / 6;
    const cloud = Math.min(1, cyc / 0.4);
    const n = 5;
    const ys = [DH / 2 - 34, DH / 2 + 34];
    const xs = [DW * 0.18, DW * 0.34, DW * 0.5, DW * 0.66, DW * 0.82];
    /* nuvem eletrônica de fundo */
    for (let i = 0; i < 26; i++) {
      const px = 30 + ((i * 97 + t * 40) % (DW - 60));
      const py = 30 + ((i * 61 + t * 26) % (DH - 60));
      ctx.save();
      ctx.globalAlpha = cloud * 0.5;
      electronDot(ctx, px, py, '#7ff5ff', 2.4);
      ctx.restore();
    }
    for (let i = 0; i < n; i++) {
      const x = xs[i], y = ys[i % 2];
      const cat = cyc > 0.4 + (i % 3) * 0.06;
      circleFill(ctx, x, y, 22, 'rgba(255,209,102,0.12)', cat ? '#5dffa6' : '#ffd166', 2);
      chalkText(ctx, 'M', x, y - 2, 15, '#ffd166');
      if (cat) chalkText(ctx, '+', x + 14, y - 14, 15, '#5dffa6');
    }
    chalkText(ctx, cloud > 0.9 ? 'átomos neutros e cátions MERGULHADOS na nuvem eletrônica' : 'metais: tendência a formar cátions...', DW / 2, DH - 18, 14, cloud > 0.9 ? '#5dffa6' : '#ffd166');
    chalkText(ctx, 'MAR DE ELÉTRONS', DW / 2, 22, 15, '#7ff5ff');
  },

  /* Metálicas: formação do mar (valência sai → cátion → mar) */
  seaFormation: function (ctx, t) {
    const cyc = (t % 8) / 8;
    const atoms = [
      { x: DW * 0.2, y: DH / 2 - 30 }, { x: DW * 0.4, y: DH / 2 + 26 },
      { x: DW * 0.6, y: DH / 2 - 26 }, { x: DW * 0.8, y: DH / 2 + 30 }
    ];
    let phase = 0;
    if (cyc < 0.3) phase = 0;            // neutral atoms with valence electrons
    else if (cyc < 0.55) phase = 1;      // leaving
    else phase = 2;                      // sea formed
    const leave = phase === 1 ? (cyc - 0.3) / 0.25 : (phase === 2 ? 1 : 0);

    if (phase === 2) {
      for (let i = 0; i < 22; i++) {
        const px = DW / 2 + Math.cos(i * 2.4 + t * (0.6 + (i % 5) * 0.14)) * (95 + (i % 4) * 34);
        const py = DH / 2 + Math.sin(i * 1.7 + t * (0.5 + (i % 3) * 0.2)) * (62 + (i % 5) * 16);
        electronDot(ctx, px, py, '#7ff5ff', 2.6);
      }
    }

    atoms.forEach((a, ai) => {
      const isCat = phase >= 1;
      circleFill(ctx, a.x, a.y, 20, 'rgba(255,209,102,0.12)', isCat ? '#5dffa6' : '#ffd166', 2);
      chalkText(ctx, 'M', a.x, a.y - 2, 14, '#ffd166');
      if (isCat) chalkText(ctx, '+', a.x + 13, a.y - 13, 14, '#5dffa6');
      if (phase === 0) {
        for (let k = 0; k < 3; k++) {
          const p = orbitPos(a.x, a.y, 29, k, 3, t, 1.1);
          electronDot(ctx, p.x, p.y, '#7ff5ff', 3);
        }
      }
      if (phase === 1) {
        for (let k = 0; k < 3; k++) {
          const ang = (k / 3) * Math.PI * 2 + t;
          const rr = 29 + leave * 90;
          electronDot(ctx, a.x + Math.cos(ang) * rr, a.y + Math.sin(ang) * rr, '#7ff5ff', 3);
        }
      }
    });

    const caps = [
      'elétrons da CAMADA DE VALÊNCIA ainda no átomo...',
      'os elétrons SAEM → o átomo vira CÁTION (+)',
      'elétrons rodeiam os cátions: MAR DE ELÉTRONS!'
    ];
    chalkText(ctx, caps[phase], DW / 2, DH - 16, 14.5, phase === 2 ? '#5dffa6' : phase === 1 ? '#ffd166' : '#eef6ef');
    chalkText(ctx, 'FORMAÇÃO DO MAR DE ELÉTRONS', DW / 2, 20, 15, '#ffd166');
  },

  /* Metálicas: atração eletrostática segurando os cátions */
  attraction: function (ctx, t) {
    const pts = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 5; c++)
        pts.push({ x: DW * 0.16 + c * DW * 0.17, y: DH / 2 - 30 + r * 60 });
    /* elétrons vagando */
    for (let i = 0; i < 18; i++) {
      const px = DW / 2 + Math.cos(i * 2.1 + t * (0.7 + (i % 4) * 0.15)) * (110 + (i % 3) * 40);
      const py = DH / 2 + Math.sin(i * 1.3 + t * (0.6 + (i % 5) * 0.16)) * (70 + (i % 4) * 18);
      electronDot(ctx, px, py, '#7ff5ff', 2.6);
    }
    pts.forEach((p, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 4 - i);
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      const dir = [[0, -1], [0, 1], [-1, 0], [1, 0]][i % 4];
      chalkArrow(ctx, p.x + dir[0] * 34, p.y + dir[1] * 34, p.x + dir[0] * 24, p.y + dir[1] * 24, '#ff9df2', 1.8);
      ctx.restore();
      circleFill(ctx, p.x, p.y, 17, 'rgba(255,209,102,0.12)', '#ffd166', 2);
      chalkText(ctx, 'M⁺', p.x, p.y + 1, 13, '#ffd166');
    });
    chalkText(ctx, 'nuvem eletrônica = FORTE ATRAÇÃO entre os cátions', DW / 2, DH - 16, 14, '#ff9df2');
    chalkText(ctx, 'ATRAÇÃO ELETROSTÁTICA  (+) ↔ (−)', DW / 2, 22, 15, '#ff9df2');
  },

  /* Metálicas: mar contínuo de elétrons */
  sea: function (ctx, t) {
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 5; c++) {
        const x = DW * 0.16 + c * DW * 0.17 + Math.sin(t * 2 + c) * 2;
        const y = DH / 2 - 30 + r * 60 + Math.cos(t * 2 + r) * 2;
        circleFill(ctx, x, y, 17, 'rgba(255,209,102,0.12)', '#ffd166', 2);
        chalkText(ctx, 'M⁺', x, y + 1, 13, '#ffd166');
      }
    for (let i = 0; i < 26; i++) {
      const px = DW / 2 + Math.cos(i * 1.9 + t * (0.8 + (i % 5) * 0.13)) * (115 + (i % 4) * 38);
      const py = DH / 2 + Math.sin(i * 1.4 + t * (0.65 + (i % 3) * 0.18)) * (74 + (i % 5) * 15);
      electronDot(ctx, px, py, '#7ff5ff', 2.6);
    }
    chalkText(ctx, 'elétrons LIVRES / DESLOCALIZADOS — não pertencem a um único átomo', DW / 2, DH - 16, 13.5, '#7ff5ff');
  },

  /* Metálicas: estrutura → propriedades (demo reel do vídeo) */
  properties: function (ctx, t) {
    const SCENE_DUR = 3.4;
    const total = SCENE_DUR * 4;
    const tt = t % total;
    const si = Math.floor(tt / SCENE_DUR);
    const st = tt - si * SCENE_DUR;
    const names = ['CONDUTIVIDADE ELÉTRICA', 'CONDUTIVIDADE TÉRMICA', 'BRILHO', 'MALEABILIDADE'];
    const colors = ['#7ff5ff', '#ffd166', '#ff9df2', '#5dffa6'];

    chalkText(ctx, names[si], DW / 2, 22, 16, colors[si]);

    if (si === 0) {
      /* pilha + lâmpada: elétrons derivam */
      chalkText(ctx, '⊖', 40, DH / 2, 24, '#7ff5ff');
      chalkText(ctx, '⊕', DW - 40, DH / 2, 24, '#ff9df2');
      chalkLine(ctx, 60, DH / 2 - 40, 60, DH / 2 + 40, '#eef6ef', 2);
      chalkLine(ctx, DW - 60, DH / 2 - 40, DW - 60, DH / 2 + 40, '#eef6ef', 2);
      chalkLine(ctx, 60, DH / 2 - 40, DW - 60, DH / 2 - 40, '#eef6ef', 2);
      const lampOn = st > 0.8;
      circleFill(ctx, DW / 2, DH / 2 - 40, 13, lampOn ? 'rgba(255,209,102,' + (0.5 + 0.3 * Math.sin(t * 8)) + ')' : 'rgba(238,246,239,0.1)', '#ffd166', 2);
      for (let i = 0; i < 10; i++) {
        const px = ((i * 53 + st * 160) % (DW - 140)) + 70;
        electronDot(ctx, px, DH / 2 - 40 + Math.sin(px * 0.05 + t) * 4, '#7ff5ff', 3);
      }
      for (let r = 0; r < 1; r++)
        for (let c = 0; c < 6; c++) {
          const x = DW * 0.22 + c * DW * 0.115;
          circleFill(ctx, x, DH / 2 + 42, 11, 'rgba(255,209,102,0.12)', '#ffd166', 1.6);
          chalkText(ctx, '+', x, DH / 2 + 43, 12, '#ffd166');
        }
      chalkText(ctx, lampOn ? 'corrente elétrica!' : 'tensão aplicada...', DW / 2, DH - 14, 13, lampOn ? '#ffd166' : '#eef6ef');
    } else if (si === 1) {
      /* vibração + calor */
      const amp = Math.min(6, st * 4);
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 7; c++) {
          const x = DW * 0.16 + c * DW * 0.114 + Math.sin(t * 12 + c * 2) * amp;
          const y = DH / 2 - 8 + r * 46 + Math.cos(t * 12 + r * 2) * amp;
          circleFill(ctx, x, y, 11, 'rgba(255,209,102,0.14)', '#ffd166', 1.6);
          chalkText(ctx, '+', x, y + 1, 12, '#ffd166');
        }
      for (let i = 0; i < 4; i++) {
        const wx = DW * 0.2 + i * DW * 0.2;
        ctx.save();
        ctx.strokeStyle = '#ff9df2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let yy = 0; yy <= 26; yy += 2) {
          const wy = DH - 46 - yy + Math.sin(yy * 0.6 + t * 6 + i) * 3;
          if (yy === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx + Math.sin(yy * 0.4) * 4, wy);
        }
        ctx.stroke();
        ctx.restore();
      }
      chalkText(ctx, 'energia térmica se espalha rápido!', DW / 2, DH - 14, 13, '#ffd166');
    } else if (si === 2) {
      /* brilho: luz entra e volta */
      const surfY = DH / 2;
      chalkLine(ctx, 60, surfY, DW - 60, surfY, '#eef6ef', 2.5);
      for (let r = 0; r < 1; r++)
        for (let c = 0; c < 8; c++) {
          const x = 80 + c * DW * 0.105;
          circleFill(ctx, x, surfY + 26, 10, 'rgba(255,209,102,0.12)', '#ffd166', 1.6);
        }
      const beamX = 150 + ((st * 90) % (DW - 300));
      chalkLine(ctx, beamX, 60, beamX + 30, surfY - 2, '#ffffff', 2.5);
      chalkLine(ctx, beamX + 30, surfY - 2, beamX + 70, 54, '#ffd166', 2.5);
      for (let i = 0; i < 6; i++) {
        const sx = beamX + 30 + Math.cos(t * 9 + i * 1.05) * (10 + i);
        const sy = surfY - 8 - Math.abs(Math.sin(t * 9 + i * 1.05)) * (12 + i * 2);
        ctx.save();
        ctx.globalAlpha = 0.7;
        chalkText(ctx, '✦', sx, sy, 12, '#ffd166');
        ctx.restore();
      }
      chalkText(ctx, 'a luz bate nos elétrons livres e volta: BRILHO!', DW / 2, DH - 14, 13, '#ff9df2');
    } else {
      /* maleabilidade: camadas deslizam */
      const slide = Math.sin(st / SCENE_DUR * Math.PI) * 26;
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 7; c++) {
          const x = 90 + c * 62 + (r === 0 ? slide : -slide);
          const y = DH / 2 - 26 + r * 52;
          circleFill(ctx, x, y, 12, 'rgba(93,255,166,0.1)', '#5dffa6', 1.6);
          chalkText(ctx, '+', x, y + 1, 12, '#5dffa6');
        }
      for (let i = 0; i < 14; i++) {
        const px = 80 + ((i * 41 + t * 30) % (DW - 160));
        electronDot(ctx, px, DH / 2 - 4 + Math.sin(i + t * 3) * 22, '#7ff5ff', 2.2);
      }
      chalkArrow(ctx, DW - 70, DH / 2 - 26, DW - 40, DH / 2 - 26, '#5dffa6', 2);
      chalkText(ctx, 'camadas deslizam sem quebrar a ligação ✓', DW / 2, DH - 14, 13, '#5dffa6');
    }
  },

  /* Metálicas: cadeia resumo */
  chain: function (ctx, t) {
    const items = [
      'ESTRUTURA DA LIGAÇÃO', 'MAR DE ELÉTRONS', 'MOVIMENTO DOS ELÉTRONS', 'PROPRIEDADES DOS METAIS'
    ];
    const colors = ['#ffd166', '#7ff5ff', '#ff9df2', '#5dffa6'];
    const bh = 38, gapY = (DH - items.length * bh) / (items.length + 1);
    items.forEach((txt, i) => {
      const y = gapY + i * (bh + gapY) + bh / 2;
      ctx.save();
      ctx.font = '16px "Pixelify Sans", monospace';
      const w = ctx.measureText(txt).width + 30;
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(DW / 2 - w / 2, y - bh / 2, w, bh, 9); else ctx.rect(DW / 2 - w / 2, y - bh / 2, w, bh);
      ctx.fill(); ctx.stroke();
      chalkText(ctx, txt, DW / 2, y + 1, 16, colors[i]);
      if (i < items.length - 1) {
        const y1 = y + bh / 2 + 3, y2 = y + bh / 2 + gapY - 4;
        chalkLine(ctx, DW / 2, y1, DW / 2, y2, 'rgba(238,246,239,0.6)', 2);
        const pr = (t * 1.4 + i * 0.25) % 1;
        electronDot(ctx, DW / 2, y1 + (y2 - y1) * pr, '#7ff5ff', 3.4);
        chalkArrow(ctx, DW / 2, y1 + 4, DW / 2, y2, 'rgba(238,246,239,0.6)', 2);
      }
      ctx.restore();
    });
  }
};

/* ============================================================
   ESTADO + MÁQUINA DE APRESENTAÇÃO
============================================================ */
const S = {
  bond: null,
  idx: 0,
  reveal: -1,          /* -1 digitando título; 0..n-1 linha revelada */
  typing: null,        /* { el, full, pos, acc, cps } */
  speechQueue: '',
  running: false,
  raf: 0,
  lastT: 0,
  mouthT: 0,
  mouthOpen: false,
  diagT: 0,
  finished: {},
  resume: {}
};

const els = {};

function lesson() { return LESSONS[S.bond]; }
function slide() { return lesson().slides[S.idx]; }
function slideCount() { return lesson().slides.length; }

function $(id) { return document.getElementById(id); }

/* ---------- digitação progressiva ---------- */
function startTyping(el, text, cps) {
  S.typing = { el, full: text, pos: 0, acc: 0, cps: cps || 34 };
  el.textContent = '';
  el.classList.add('caret');
}
function finishTyping() {
  if (!S.typing) return;
  S.typing.el.textContent = S.typing.full;
  S.typing.el.classList.remove('caret');
  S.typing = null;
}
function updateTyping(dt) {
  if (!S.typing) return false;
  const tp = S.typing;
  tp.acc += dt * tp.cps;
  while (tp.acc >= 1 && tp.pos < tp.full.length) {
    tp.acc -= 1;
    tp.pos++;
  }
  tp.el.textContent = tp.full.slice(0, tp.pos);
  if (tp.pos >= tp.full.length) {
    tp.el.classList.remove('caret');
    S.typing = null;
    return false;
  }
  return true;
}

/* ---------- boca do professor ---------- */
function updateMouth(dt, speaking) {
  S.mouthT += dt;
  if (speaking) {
    if (S.mouthT > 0.14) {
      S.mouthT = 0;
      S.mouthOpen = !S.mouthOpen;
      if (els.profImg) els.profImg.src = S.mouthOpen ? PROF_OPEN_SRC : PROF_CLOSED_SRC;
    }
  } else if (!S.mouthOpen) {
    return;
  } else {
    S.mouthOpen = false;
    if (els.profImg) els.profImg.src = PROF_CLOSED_SRC;
  }
}

/* ---------- renderização do slide ---------- */
function renderSlide(instant) {
  const sl = slide();
  els.title.textContent = '';
  els.lines.innerHTML = '';
  els.hint.hidden = true;
  els.training.hidden = true;
  hideDiagram();

  sl.lines.forEach((ln, i) => {
    const li = document.createElement('li');
    li.textContent = ln.t;
    if (sl.hl && sl.hl[i]) li.classList.add(sl.hl[i]);
    li.dataset.i = String(i);
    els.lines.appendChild(li);
  });

  els.progress.textContent = 'QUADRO ' + (S.idx + 1) + '/' + slideCount();
  els.next.hidden = S.idx === slideCount() - 1;

  if (instant) {
    els.title.textContent = sl.title;
    Array.prototype.forEach.call(els.lines.children, li => li.classList.add('show'));
    const say = sl.say[sl.say.length - 1] || '';
    S.speechFull = say;
    S.speechPos = say.length;
    els.speech.textContent = say;
    S.reveal = sl.lines.length - 1;
    showDiagram(sl.diagram);
    sl._doneShown = true;
    onSlideFullyRevealed();
  } else {
    S.reveal = -1;
    startTyping(els.title, sl.title, 26);
    setSpeech('');
    if (typeof AudioSys !== 'undefined' && AudioSys.sfx) AudioSys.sfx('chalk');
  }
}

function revealNextLine() {
  const sl = slide();
  S.reveal++;
  const li = els.lines.children[S.reveal];
  li.classList.add('show');
  startTyping(li, sl.lines[S.reveal].t, 40);
  setSpeech(sl.say[S.reveal] || '');
  if (S.reveal === 0) showDiagram(sl.diagram);
  if (typeof AudioSys !== 'undefined' && AudioSys.sfx) AudioSys.sfx('chalk');
}

function onSlideFullyRevealed() {
  const sl = slide();
  els.hint.hidden = false;
  if (S.idx === slideCount() - 1) {
    els.hint.textContent = 'aula concluída ✔ volte ao conteúdo quando quiser';
  } else {
    els.hint.textContent = '[ESPAÇO] ▸ próximo quadro';
  }
  if (sl.training) els.training.hidden = false;
}

function setSpeech(text) {
  if (!text) { els.speech.textContent = ''; S.speechFull = ''; S.speechPos = 0; return; }
  startTypingSpeech(text);
}
function startTypingSpeech(text) {
  /* fala usa o mesmo motor de digitação secundário (via fila) */
  S.speechFull = text;
  S.speechPos = 0;
  S.speechAcc = 0;
  els.speech.textContent = '';
}
function updateSpeech(dt) {
  if (S.speechPos == null || !S.speechFull) return false;
  if (S.speechPos >= S.speechFull.length) return false;
  S.speechAcc += dt * 46;
  while (S.speechAcc >= 1 && S.speechPos < S.speechFull.length) {
    S.speechAcc -= 1;
    S.speechPos += 2;
  }
  els.speech.textContent = S.speechFull.slice(0, S.speechPos);
  return S.speechPos < S.speechFull.length;
}
function finishSpeech() {
  if (!S.speechFull) return;
  S.speechPos = S.speechFull.length;
  els.speech.textContent = S.speechFull;
}

/* ---------- diagrama ---------- */
function showDiagram(name) {
  if (!name || !DIAGRAMS[name]) { hideDiagram(); return; }
  S.diagName = name;
  S.diagT = 0;
  els.diagram.classList.add('show');
}
function hideDiagram() {
  S.diagName = null;
  els.diagram.classList.remove('show');
}

/* ---------- laço principal ---------- */
function loop(ts) {
  if (!S.running) return;
  if (!S.lastT) S.lastT = ts;
  let dt = (ts - S.lastT) / 1000;
  S.lastT = ts;
  if (dt > 0.1) dt = 0.1;

  const typingBoard = updateTyping(dt);
  const speeching = updateSpeech(dt);
  updateMouth(dt, typingBoard || speeching);

  if (S.diagName) {
    S.diagT += dt;
    const ctx = els.diagCtx;
    ctx.clearRect(0, 0, DW, DH);
    DIAGRAMS[S.diagName](ctx, S.diagT);
  }

  const sl = slide();

  /* título terminou e ainda há linhas a revelar? mostra dica */
  if (!typingBoard && S.reveal === -1 && !sl._introDone) {
    sl._introDone = true;
    els.hint.hidden = false;
    els.hint.textContent = '[ESPAÇO] ▸ começar';
  }

  /* todas as linhas do quadro reveladas? finaliza o quadro */
  if (!typingBoard && !speeching && S.reveal === sl.lines.length - 1 && !sl._doneShown) {
    sl._doneShown = true;
    onSlideFullyRevealed();
  }

  S.raf = requestAnimationFrame(loop);
}

/* ---------- navegação ---------- */
function advance() {
  const typing = !!S.typing || (S.speechFull && S.speechPos < S.speechFull.length);
  if (typing) {
    finishTyping();
    finishSpeech();
    return;
  }
  if (S.reveal === -1) {
    /* revela primeira linha */
    revealNextLine();
    return;
  }
  if (S.reveal < slide().lines.length - 1) {
    revealNextLine();
    return;
  }
  if (S.idx < slideCount() - 1) {
    goSlide(S.idx + 1);
  }
}

function goSlide(i, instant) {
  S.idx = i;
  S.resume[S.bond] = i;
  const sl = slide();
  delete sl._introDone;
  delete sl._doneShown;
  renderSlide(!!instant);
}

function prev() {
  if (S.typing || (S.speechFull && S.speechPos < S.speechFull.length)) {
    finishTyping(); finishSpeech();
    return;
  }
  if (S.idx > 0) goSlide(S.idx - 1, true);
}

function skipLesson() {
  goSlide(slideCount() - 1, true);
}

/* ============================================================
   API PÚBLICA
============================================================ */
const Classroom = {

  active: function () { return S.running; },

  /* abre uma aula específica (chamado pelos cartões de screen-bonds) */
  open: function (bond) {
    if (!LESSONS[bond]) return;
    S.bond = bond;
    const start = typeof S.resume[bond] === 'number' ? S.resume[bond] : 0;
    S.idx = start;
    if (window.showScreen) window.showScreen('classroom');
    else if (typeof showScreen === 'function') showScreen('classroom');
  },

  enter: function () {
    if (!els.root) bindDom();
    if (!S.bond) S.bond = 'ionica';
    S.running = true;
    S.lastT = 0;
    els.lessonTitle.textContent = lesson().label;
    renderSlide(false);
    if (!S.raf) S.raf = requestAnimationFrame(loop);
  },

  exit: function () {
    S.running = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    finishTyping();
  },

  /* teclado: retorna true se a tecla foi tratada */
  onKey: function (e) {
    if (!S.running) return false;
    switch (e.code) {
      case 'Escape':
        e.preventDefault();
        Classroom.backToContents();
        return true;
      case 'ArrowRight':
      case 'Space':
      case 'Enter':
        e.preventDefault();
        advance();
        return true;
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        return true;
    }
    return false;
  },

  backToContents: function () {
    if (typeof AudioSys !== 'undefined' && AudioSys.sfx) AudioSys.sfx('click');
    if (window.showScreen) window.showScreen('bonds');
    else if (typeof showScreen === 'function') showScreen('bonds');
  }
};

/* ============================================================
   DOM
============================================================ */
function bindDom() {
  els.root = $('screen-classroom');
  els.lessonTitle = $('cls-lesson-title');
  els.progress = $('cls-progress');
  els.title = $('cls-board-title');
  els.lines = $('cls-board-lines');
  els.hint = $('cls-hint');
  els.speech = $('cls-speech');
  els.profImg = $('cls-prof-img');
  els.diagram = $('cls-diagram');
  els.diagCtx = els.diagram.getContext('2d');
  els.training = $('cls-training');
  els.next = $('btn-cls-next');

  const prevBtn = $('btn-cls-prev');
  const nextBtn = $('btn-cls-next');
  const skipBtn = $('btn-cls-skip');
  const backBtn = $('btn-cls-back');

  prevBtn.addEventListener('click', () => { sfxClick(); prev(); prevBtn.blur(); });
  nextBtn.addEventListener('click', () => { sfxClick(); advance(); nextBtn.blur(); });
  skipBtn.addEventListener('click', () => { sfxClick(); skipLesson(); skipBtn.blur(); });
  backBtn.addEventListener('click', () => { /* data-nav cuida da navegação */ });

  els.blackboard = $('blackboard');
  els.blackboard.addEventListener('click', () => advance());

  /* Treinamento (dentro de Ligações Covalentes) */
  const openLewis = $('btn-open-lewis');
  const openStructural = $('btn-open-structural');
  openLewis.addEventListener('click', () => {
    sfxClick();
    if (typeof window.setPracticeReturn === 'function') window.setPracticeReturn('bonds');
    if (window.showScreen) window.showScreen('lewis');
  });
  openStructural.addEventListener('click', () => {
    sfxClick();
    if (typeof window.setPracticeReturn === 'function') window.setPracticeReturn('bonds');
    if (window.showScreen) window.showScreen('structural');
  });
}

function sfxClick() {
  if (typeof AudioSys !== 'undefined' && AudioSys.sfx) AudioSys.sfx('click');
}

/* cartões do menu Conteúdo de Ligações */
document.querySelectorAll('.bond-card').forEach(card => {
  card.addEventListener('click', () => {
    sfxClick();
    Classroom.open(card.dataset.bond);
  });
});

window.Classroom = Classroom;
/* acesso de depuração/testes (smoke_test_classroom.js) */
Classroom._dbg = { S, LESSONS, DIAGRAMS, advance, goSlide, prev, skipLesson, finishTyping };
})();
