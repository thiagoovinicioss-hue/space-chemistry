/* =====================================================================
   SPACE CHEMISTRY: MISSION BONDS — BANCO DE QUESTÕES (questions.js)
   ---------------------------------------------------------------------
   Este arquivo concentra TODAS as perguntas do questionário do jogo.
   Fácil de estender: basta adicionar um novo objeto no array.

   Formato padrão de cada questão:
     id     → identificador único (ex.: 'ion1')
     cat    → categoria: 'ionic' | 'covalent' | 'metallic' | 'general'
     q      → texto da pergunta (\n cria nova linha no overlay)
     opts   → 4 alternativas [A, B, C, D]
     ans    → índice da alternativa correta (0 a 3)
     why    → explicação curta mostrada APÓS responder (máx. ~2 frases)

   Formato "soma das afirmativas" (questões de análise de sentenças):
     Em vez de opts/ans/why, informe APENAS:
       statements → [{ number: N, text: "...", correct: true|false }, ...]
       wrongOpts  → 3 valores incorretos e plausíveis (números)
       whyExtra   → explicação científica opcional (sem números)
     Ao carregar, prepareStatementQuestions() deriva automaticamente:
       corretas = números das afirmativas com correct: true
       soma     = corretas[0] + corretas[1] + ...
       opts     = wrongOpts + a soma correta (4 alternativas)
       ans      = índice da soma dentro de opts
       why      = feedback com a lista e a soma das afirmativas corretas
     Assim alternativa correta, soma e feedback NUNCA divergem entre si.

   Categorias por planeta (usado no jogo):
     Tutorial (Estação Orbital) → general
     Planeta Iônico             → ionic
     Planeta Covalente          → covalent
     Planeta Metálico           → metallic
     Planeta Final              → general (revisão)
   ===================================================================== */

const QUESTIONS = [

  /* ============================================================
     LIGAÇÕES IÔNICAS
  ============================================================ */
  {
    id: 'ion1',
    cat: 'ionic',
    q: 'Um composto apresenta alto ponto de fusão, é sólido à temperatura ambiente e conduz eletricidade apenas quando está fundido ou dissolvido em água. Qual tipo de ligação predomina nesse composto?',
    opts: ['Ligação covalente apolar', 'Ligação metálica', 'Ligação iônica', 'Ligação de hidrogênio'],
    ans: 2,
    why: 'Compostos iônicos têm altos pontos de fusão, são sólidos e só conduzem eletricidade quando fundidos ou dissolvidos (íons livres).'
  },
  {
    id: 'ion2',
    cat: 'ionic',
    q: 'A formação do cloreto de sódio (NaCl) ocorre porque:',
    opts: [
      'O sódio compartilha um elétron com o cloro.',
      'O cloro transfere um elétron para o sódio.',
      'O sódio doa um elétron ao cloro, formando íons de cargas opostas que se atraem.',
      'O sódio e o cloro unem seus núcleos.'
    ],
    ans: 2,
    why: 'O sódio (metal) doa 1 elétron e o cloro (ametal) recebe. Formam-se Na⁺ e Cl⁻, que se atraem — ligação iônica.'
  },
  {
    id: 'ion3',
    cat: 'ionic',
    q: 'Analise as afirmativas e selecione a sequência correta de verdadeiro (V) e falso (F):\nI - O pesquisador norte-americano considerado o pai da ligação química é o Newton Lewis.\nII - Um átomo atinge estabilidade quando possui 2 ou 8 elétrons na camada de valência.\nIII - Ligações iônicas ocorrem entre metais e ametais, com resolução por fórmula estrutural e esquema de orbitais.',
    opts: ['v, v, f', 'f, v, v', 'f, v, f', 'v, v, v'],
    ans: 1,
    why: 'I é FALSO (a afirmação sobre o nome é imprecisa); II é VERDADEIRO (regra do octeto); III é VERDADEIRO (metal + ametal).'
  },
  {
    id: 'ion4',
    cat: 'ionic',
    q: 'Analise as sentenças e indique a soma das afirmações corretas:\n1 - Na ligação iônica os átomos doam e recebem elétrons.\n2 - A substância AlBr₃ é formada por uma ligação iônica.\n4 - Compostos iônicos não são brilhantes nem maleáveis, mas conduzem eletricidade quando dissolvidos em água ou no estado líquido.',
    statements: [
      { number: 1, text: 'Na ligação iônica os átomos doam e recebem elétrons.', correct: true },
      { number: 2, text: 'A substância AlBr₃ é formada por uma ligação iônica.', correct: true },
      { number: 4, text: 'Compostos iônicos não são brilhantes nem maleáveis, mas conduzem eletricidade quando dissolvidos em água ou no estado líquido.', correct: true }
    ],
    wrongOpts: [5, 6, 3],
    whyExtra: 'Compostos iônicos conduzem eletricidade quando fundidos ou dissolvidos (íons livres).'
  },

  /* ============================================================
     LIGAÇÕES COVALENTES
  ============================================================ */
  {
    id: 'cov1',
    cat: 'covalent',
    q: 'Em qual das alternativas todos os compostos apresentam predominantemente ligações covalentes?',
    opts: ['H₂O, CO₂ e CH₄', 'NaCl, MgO e KBr', 'Fe, Cu e Al', 'CaO, Na₂O e LiF'],
    ans: 0,
    why: 'H₂O, CO₂ e CH₄ são formados por ametais que COMPARTILHAM elétrons (ligação covalente). As demais têm íons ou metais.'
  },
  {
    id: 'cov2',
    cat: 'covalent',
    q: 'A principal diferença entre uma ligação covalente e uma ligação iônica é que:',
    opts: [
      'Na covalente ocorre compartilhamento de elétrons; na iônica, transferência.',
      'Na covalente apenas metais participam da ligação.',
      'Na iônica os elétrons são compartilhados igualmente.',
      'Não existe diferença entre elas.'
    ],
    ans: 0,
    why: 'Ligação covalente = compartilha elétrons (ametais). Ligação iônica = transferência de elétrons (metal + ametal).'
  },
  {
    id: 'cov3',
    cat: 'covalent',
    q: 'Analise as afirmações e assinale a sequência correta de verdadeiro (V) e falso (F):\nI - A ligação covalente é caracterizada pelo compartilhamento de elétrons.\nII - A ligação covalente ocorre, geralmente, entre metais.\nIII - Na ligação tripla, os átomos compartilham três pares de elétrons.',
    opts: ['V, F, V', 'V, V, F', 'F, V, V', 'V, V, V'],
    ans: 0,
    why: 'I V (compartilhamento de elétrons); II F (ocorre entre ametais e hidrogênio); III V (três pares, como no N₂).'
  },
  {
    id: 'cov4',
    cat: 'covalent',
    q: 'Sobre as fórmulas utilizadas na ligação covalente, assinale a alternativa correta.',
    opts: [
      'A fórmula estrutural indica apenas a quantidade de átomos da molécula.',
      'A fórmula de Lewis representa as ligações com pares de elétrons; a estrutural usa traços.',
      'A fórmula molecular mostra como os átomos estão ligados entre si.',
      'A fórmula de Lewis é usada apenas para ligações iônicas.'
    ],
    ans: 1,
    why: 'Lewis usa pares de elétrons (pontos); a estrutural usa traços. A molecular indica a quantidade de átomos.'
  },

  /* ============================================================
     LIGAÇÕES METÁLICAS
  ============================================================ */
  {
    id: 'met1',
    cat: 'metallic',
    q: 'Sobre as ligações metálicas, analise as afirmativas:\n1 - A ligação metálica ocorre entre átomos de metais.\n2 - Os elétrons de valência ficam livres para se movimentar.\n3 - A mobilidade dos elétrons explica a boa condução de eletricidade.\n4 - Ligações metálicas são formadas por transferência de elétrons entre metal e ametal.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'A ligação metálica ocorre entre átomos de metais.', correct: true },
      { number: 2, text: 'Os elétrons de valência ficam livres para se movimentar.', correct: true },
      { number: 3, text: 'A mobilidade dos elétrons explica a boa condução de eletricidade.', correct: true },
      { number: 4, text: 'Ligações metálicas são formadas por transferência de elétrons entre metal e ametal.', correct: false }
    ],
    wrongOpts: [7, 10, 3],
    whyExtra: 'A afirmativa 4 é falsa: transferência de elétrons entre metal e ametal caracteriza a ligação IÔNICA, não a metálica.'
  },
  {
    id: 'met2',
    cat: 'metallic',
    q: 'Analise as afirmativas sobre as propriedades dos metais:\n1 - A ligação metálica ocorre entre átomos de metais.\n2 - Metais são maleáveis e dúcteis.\n3 - Metais são maus condutores de eletricidade.\n4 - A ligação metálica forma-se entre metal e ametal.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'A ligação metálica ocorre entre átomos de metais.', correct: true },
      { number: 2, text: 'Metais são maleáveis e dúcteis.', correct: true },
      { number: 3, text: 'Metais são maus condutores de eletricidade.', correct: false },
      { number: 4, text: 'A ligação metálica forma-se entre metal e ametal.', correct: false }
    ],
    wrongOpts: [6, 7, 10],
    whyExtra: 'As afirmativas 3 e 4 são falsas: metais são ótimos condutores e a ligação metálica ocorre entre metais (transferência entre metal e ametal é a ligação iônica).'
  },
  {
    id: 'met3',
    cat: 'metallic',
    q: 'Analise as afirmativas sobre o modelo do mar de elétrons:\n1 - Metais conduzem bem calor e eletricidade.\n2 - Na ligação metálica, os elétrons são compartilhados entre dois átomos específicos.\n3 - Metais sólidos são quebradiços como o vidro.\n4 - O "mar de elétrons" explica a boa condução elétrica dos metais.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Metais conduzem bem calor e eletricidade.', correct: true },
      { number: 2, text: 'Na ligação metálica, os elétrons são compartilhados entre dois átomos específicos.', correct: false },
      { number: 3, text: 'Metais sólidos são quebradiços como o vidro.', correct: false },
      { number: 4, text: 'O "mar de elétrons" explica a boa condução elétrica dos metais.', correct: true }
    ],
    wrongOpts: [6, 7, 10],
    whyExtra: 'As afirmativas 2 e 3 são falsas: na ligação metálica os elétrons ficam livres (não presos a átomos específicos) e os metais são maleáveis, não quebradiços.'
  },
  {
    id: 'met4',
    cat: 'metallic',
    q: 'Analise as afirmativas sobre a ligação metálica:\n1 - Ligações metálicas ocorrem entre átomos de metais.\n2 - Os elétrons de valência ficam livres para se movimentar.\n3 - Metais conduzem eletricidade apenas no estado líquido.\n4 - A maleabilidade dos metais está relacionada ao deslizamento das camadas de íons no mar de elétrons.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Ligações metálicas ocorrem entre átomos de metais.', correct: true },
      { number: 2, text: 'Os elétrons de valência ficam livres para se movimentar.', correct: true },
      { number: 3, text: 'Metais conduzem eletricidade apenas no estado líquido.', correct: false },
      { number: 4, text: 'A maleabilidade dos metais está relacionada ao deslizamento das camadas de íons no mar de elétrons.', correct: true }
    ],
    wrongOpts: [6, 8, 10],
    whyExtra: 'A afirmativa 3 é falsa: metais conduzem eletricidade no estado sólido e no líquido, pois os elétrons livres continuam se movimentando.'
  },

  /* ============================================================
     REVISÃO GERAL
  ============================================================ */
  {
    id: 'gen1',
    cat: 'general',
    q: 'Sobre os diferentes tipos de ligações químicas:\n1 - Ligações iônicas ocorrem, em geral, entre um metal e um ametal.\n2 - Ligações covalentes envolvem o compartilhamento de elétrons.\n3 - Metais conduzem bem eletricidade devido aos elétrons livres.\n4 - Compostos iônicos conduzem eletricidade no estado sólido.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Ligações iônicas ocorrem, em geral, entre um metal e um ametal.', correct: true },
      { number: 2, text: 'Ligações covalentes envolvem o compartilhamento de elétrons.', correct: true },
      { number: 3, text: 'Metais conduzem bem eletricidade devido aos elétrons livres.', correct: true },
      { number: 4, text: 'Compostos iônicos conduzem eletricidade no estado sólido.', correct: false }
    ],
    wrongOpts: [7, 10, 3],
    whyExtra: 'A afirmativa 4 é falsa: no estado sólido os íons ficam imóveis, por isso os compostos iônicos só conduzem eletricidade fundidos ou dissolvidos.'
  },
  {
    id: 'gen2',
    cat: 'general',
    q: 'Analise as afirmativas sobre os tipos de ligação química:\n1 - Elétrons de valência são os elétrons da camada mais externa do átomo.\n2 - A ligação covalente é caracterizada pelo compartilhamento de elétrons.\n3 - Na ligação iônica, os elétrons são compartilhados igualmente entre os átomos.\n4 - A ligação metálica ocorre entre um metal e um ametal.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Elétrons de valência são os elétrons da camada mais externa do átomo.', correct: true },
      { number: 2, text: 'A ligação covalente é caracterizada pelo compartilhamento de elétrons.', correct: true },
      { number: 3, text: 'Na ligação iônica, os elétrons são compartilhados igualmente entre os átomos.', correct: false },
      { number: 4, text: 'A ligação metálica ocorre entre um metal e um ametal.', correct: false }
    ],
    wrongOpts: [6, 7, 10],
    whyExtra: 'As afirmativas 3 e 4 são falsas: na ligação iônica há transferência de elétrons (não compartilhamento igual) e a ligação metálica ocorre entre metais, não entre metal e ametal.'
  },
  {
    id: 'gen3',
    cat: 'general',
    q: 'Analise as afirmativas sobre as propriedades dos materiais:\n1 - Metais são bons condutores de eletricidade e calor.\n2 - Compostos iônicos conduzem eletricidade no estado sólido.\n3 - A ligação covalente envolve transferência de elétrons.\n4 - Na ligação metálica, os elétrons de valência ficam livres para se movimentar.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Metais são bons condutores de eletricidade e calor.', correct: true },
      { number: 2, text: 'Compostos iônicos conduzem eletricidade no estado sólido.', correct: false },
      { number: 3, text: 'A ligação covalente envolve transferência de elétrons.', correct: false },
      { number: 4, text: 'Na ligação metálica, os elétrons de valência ficam livres para se movimentar.', correct: true }
    ],
    wrongOpts: [6, 7, 10],
    whyExtra: 'As afirmativas 2 e 3 são falsas: compostos iônicos não conduzem no estado sólido (íons imóveis) e a ligação covalente envolve compartilhamento, não transferência.'
  },
  {
    id: 'gen4',
    cat: 'general',
    q: 'Analise as afirmativas sobre a formação das ligações:\n1 - Ametais tendem a ganhar elétrons para atingir o octeto.\n2 - Metais tendem a perder elétrons formando cátions.\n3 - Na ligação covalente, um átomo transfere elétrons definitivamente ao outro.\n4 - Compostos iônicos são formados pela união de cátions e ânions.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'Ametais tendem a ganhar elétrons para atingir o octeto.', correct: true },
      { number: 2, text: 'Metais tendem a perder elétrons formando cátions.', correct: true },
      { number: 3, text: 'Na ligação covalente, um átomo transfere elétrons definitivamente ao outro.', correct: false },
      { number: 4, text: 'Compostos iônicos são formados pela união de cátions e ânions.', correct: true }
    ],
    wrongOpts: [6, 8, 10],
    whyExtra: 'A afirmativa 3 é falsa: na ligação covalente os elétrons são compartilhados, não transferidos definitivamente.'
  }
];

/* =====================================================================
   GERAÇÃO AUTOMÁTICA DAS QUESTÕES DE SOMA (campo `statements`)
   ---------------------------------------------------------------------
   Tudo é derivado dos dados — nunca de valores digitados à mão:
     corretas = números das afirmativas com correct: true
     soma     = soma desses números
     opts     = 3 distratores (wrongOpts) + a soma correta
     ans      = índice da soma dentro de opts
     why      = feedback com a lista e a soma das afirmativas corretas
   Assim alternativa correta, soma e feedback ficam SEMPRE sincronizados.
===================================================================== */

function ptJoinNumbers(nums) {
  if (!nums.length) return '';
  if (nums.length === 1) return String(nums[0]);
  return nums.slice(0, -1).join(', ') + ' e ' + nums[nums.length - 1];
}

function prepareStatementQuestions(list) {
  for (const q of list) {
    if (!Array.isArray(q.statements) || !q.statements.length) continue;
    const correct = q.statements.filter(s => s.correct).map(s => s.number);
    const sum = correct.reduce((a, b) => a + b, 0);
    const seen = new Set();
    const dist = (q.wrongOpts || [])
      .filter(v => v !== sum && !seen.has(v) && seen.add(v))
      .slice(0, 3);
    const values = dist.concat(sum);
    q.opts = values.map(String);
    q.ans = values.indexOf(sum);
    q.why = 'As afirmativas corretas são ' + ptJoinNumbers(correct) + '. ' +
      correct.join(' + ') + ' = ' + sum + '. ' + (q.whyExtra || '');
  }
  return list;
}

prepareStatementQuestions(QUESTIONS);

/* Categoria de questões usada em cada fase (índice do nível) */
const LEVEL_QUIZ = {
  0: 'general',   /* Estação Orbital (tutorial) */
  1: 'ionic',     /* Planeta Iônico */
  2: 'covalent',  /* Planeta Covalente */
  3: 'metallic',  /* Planeta Metálico */
  4: 'general'    /* Planeta Final (revisão de tudo) */
};
