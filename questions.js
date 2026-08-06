/* =====================================================================
   SPACE CHEMISTRY: MISSION BONDS — BANCO DE QUESTÕES (questions.js)
   ---------------------------------------------------------------------
   Este arquivo concentra TODAS as perguntas do questionário do jogo.
   Fácil de estender: basta adicionar um novo objeto no array.

   Formato de cada questão:
     id     → identificador único (ex.: 'ion1')
     cat    → categoria: 'ionic' | 'covalent' | 'metallic' | 'general'
     q      → texto da pergunta (\n cria nova linha no overlay)
     opts   → 4 alternativas [A, B, C, D]
     ans    → índice da alternativa correta (0 a 3)
     why    → explicação curta mostrada APÓS responder (máx. ~2 frases)

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
    opts: ['7', '5', '6', '3'],
    ans: 0,
    why: 'As três afirmativas estão corretas: 1 + 2 + 4 = 7. Compostos iônicos conduzem fundidos ou dissolvidos.'
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
    opts: ['3', '5', '7', '15'],
    ans: 2,
    why: 'Corretas 1, 2 e 3 → 1 + 2 + 4 = 7. A afirmativa 4 descreve a ligação IÔNICA, não a metálica.'
  },

  /* ============================================================
     REVISÃO GERAL
  ============================================================ */
  {
    id: 'gen1',
    cat: 'general',
    q: 'Sobre os diferentes tipos de ligações químicas:\n1 - Ligações iônicas ocorrem, em geral, entre um metal e um ametal.\n2 - Ligações covalentes envolvem o compartilhamento de elétrons.\n3 - Metais conduzem bem eletricidade devido aos elétrons livres.\n4 - Compostos iônicos conduzem eletricidade no estado sólido.\nA soma das afirmativas corretas é:',
    opts: ['7', '15', '5', '3'],
    ans: 0,
    why: 'Corretas 1, 2 e 3 → 1 + 2 + 4 = 7. Compostos iônicos NÃO conduzem no estado sólido: só fundidos ou dissolvidos.'
  }
];

/* Categoria de questões usada em cada fase (índice do nível) */
const LEVEL_QUIZ = {
  0: 'general',   /* Estação Orbital (tutorial) */
  1: 'ionic',     /* Planeta Iônico */
  2: 'covalent',  /* Planeta Covalente */
  3: 'metallic',  /* Planeta Metálico */
  4: 'general'    /* Planeta Final (revisão de tudo) */
};
