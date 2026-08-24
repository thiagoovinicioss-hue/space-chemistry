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
    ans: 2,
    why: 'I é FALSO (o pesquisador é Gilbert N. Lewis, não Newton Lewis); II é VERDADEIRO (regra do octeto/dueto); III é FALSO — embora iônica ocorra entre metal + ametal, fórmula estrutural e esquema de orbitais não representam ligações iônicas (são usados para covalentes).'
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
  },

  /* ================= SIDE QUEST · PLANETA KINDER (iônica avançada) ================= */
  {
    id: 'kin1',
    cat: 'kinder',
    q: 'O alumínio (Al) forma o íon Al³⁺ e o oxigênio (O) forma o íon O²⁻. Ao cruzar as cargas para formar o óxido de alumínio, a fórmula correta é:',
    opts: [
      'AlO₂, porque as cargas se somam.',
      'Al₂O₃, porque 2×(+3) + 3×(−2) = 0.',
      'Al₃O₂, porque o cátion sempre vem depois.',
      'Al₂O₂, porque o octeto exige pares iguais.'
    ],
    ans: 1,
    why: 'No cruzamento de cargas, o número de carga de um vira o índice do outro (e simplifica): Al³⁺ → índice 3 no O; O²⁻ → índice 2 no Al. Resultado: Al₂O₃, com carga total zero.'
  },
  {
    id: 'kin2',
    cat: 'kinder',
    q: 'Um astronauta precisa identificar íons em uma amostra marciana. Analise:\n1 - O magnésio (Z = 12) perde 2 elétrons da camada de valência e vira Mg²⁺.\n2 - O enxofre (Z = 16) recebe 2 elétrons e vira S²⁻.\n4 - Cátion é o íon POSITIVO, formado quando um átomo PERDE elétrons.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'O magnésio (Z = 12) perde 2 elétrons da camada de valência e vira Mg²⁺.', correct: true },
      { number: 2, text: 'O enxofre (Z = 16) recebe 2 elétrons e vira S²⁻.', correct: true },
      { number: 4, text: 'Cátion é o íon POSITIVO, formado quando um átomo PERDE elétrons.', correct: true }
    ],
    wrongOpts: [3, 5, 6],
    whyExtra: 'Mg (2-8-2) doa os 2 elétrons da valência; S (2-8-6) recebe 2 para fechar o octeto. Metal perde elétron → cátion; ametal ganha → ânion.'
  },
  {
    id: 'kin3',
    cat: 'kinder',
    q: 'O flúor (F) tem 7 elétrons de valência e o cálcio (Ca) tem 2. Quando eles se combinam, o composto formado e o motivo corretos são:',
    opts: [
      'CaF, porque cada átomo doa 1 elétron.',
      'Ca₂F, porque o cálcio precisa de dois fluoretos.',
      'CaF₂, porque cada F⁻ recebe 1 dos 2 elétrons que o Ca²⁺ doa.',
      'CaF₃, porque o flúor fica com carga −3.'
    ],
    ans: 2,
    why: 'Ca (metal) doa seus 2 elétrons de valência virando Ca²⁺; como cada F só recebe 1 elétron (fica F⁻), são necessários DOIS fluoretos. Carga total: +2 + 2×(−1) = 0.'
  },
  {
    id: 'kin4',
    cat: 'kinder',
    q: 'Analise as afirmativas sobre propriedades dos compostos iônicos:\n1 - No estado sólido, NÃO conduzem eletricidade porque os íons estão fixos na rede cristalina.\n2 - Fundidos ou dissolvidos em água, conduzem eletricidade porque os íons ficam livres.\n4 - Em geral apresentam alto ponto de fusão e são duros, porém quebradiços.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'No estado sólido, NÃO conduzem eletricidade porque os íons estão fixos na rede cristalina.', correct: true },
      { number: 2, text: 'Fundidos ou dissolvidos em água, conduzem eletricidade porque os íons ficam livres.', correct: true },
      { number: 4, text: 'Em geral apresentam alto ponto de fusão e são duros, porém quebradiços.', correct: true }
    ],
    wrongOpts: [5, 6, 2],
    whyExtra: 'Condução exige cargas livres: no sólido a rede prende os íons; ao fundir ou dissolver, eles se movem e conduzem.'
  },
  {
    id: 'kin5',
    cat: 'kinder',
    q: 'Na Forja de Íons de Kinder, sobrou uma dúvida: qual composto iônico está FORMADO CORRETAMENTE?',
    opts: [
      'NaS, com 1 sódio para 1 enxofre.',
      'Na₂S, com 2 Na⁺ para 1 S²⁻ — soma das cargas igual a zero.',
      'NaS₂, com 1 Na⁺ para 2 S²⁻.',
      'Na₃S₂, porque o enxofre doa 3 elétrons.'
    ],
    ans: 1,
    why: 'Cada Na doa 1 elétron (vira Na⁺); o S recebe 2 (vira S²⁻). Para zerar: 2×(+1) + 1×(−2) = 0 → Na₂S.'
  },
  {
    id: 'kin6',
    cat: 'kinder',
    q: 'Uma lâmpada ligada a um circuito com NaCl SÓLIDO não acende; ao dissolver o sal na água, ela acende. A explicação correta é:',
    opts: [
      'A água cria elétrons novos no sal.',
      'No sólido os íons estão presos na rede; na solução, os íons Na⁺ e Cl⁻ ficam livres e conduzem a corrente.',
      'O NaCl reage com a água e vira metal condutor.',
      'A lâmpada acende porque a água sozinha é ótima condutora.'
    ],
    ans: 1,
    why: 'Compostos iônicos só conduzem quando fundidos ou dissolvidos: é preciso que os íons (não elétrons!) estejam livres para migrar.'
  },

  /* ================= SIDE QUEST · PLANETA BUENO (covalente avançada) ================= */
  {
    id: 'bun1',
    cat: 'bueno',
    q: 'Cada nitrogênio tem 5 elétrons de valência. Na molécula de N₂, para ambos atingirem o octeto, os átomos compartilham:',
    opts: [
      '1 par de elétrons — ligação simples.',
      '2 pares de elétrons — ligação dupla.',
      '3 pares de elétrons — ligação tripla.',
      'Nenhum par: o N₂ é iônico.'
    ],
    ans: 2,
    why: '5 + 5 = 10 elétrons de valência; cada N precisa de 3 elétrons extras. Compartilhando 3 pares (6 elétrons), ambos completam o octeto → N≡N, ligação TRIPLA.'
  },
  {
    id: 'bun2',
    cat: 'bueno',
    q: 'Sobre as representações de uma molécula, analise:\n1 - A Fórmula de Lewis mostra os elétrons como PONTOS ao redor dos átomos.\n2 - A Fórmula Estrutural representa cada par compartilhado por um TRAÇO.\n4 - A Fórmula Molecular indica apenas a quantidade de átomos de cada elemento.\nA soma das afirmativas corretas é:',
    statements: [
      { number: 1, text: 'A Fórmula de Lewis mostra os elétrons como PONTOS ao redor dos átomos.', correct: true },
      { number: 2, text: 'A Fórmula Estrutural representa cada par compartilhado por um TRAÇO.', correct: true },
      { number: 4, text: 'A Fórmula Molecular indica apenas a quantidade de átomos de cada elemento.', correct: true }
    ],
    wrongOpts: [3, 5, 6],
    whyExtra: 'As três representam a MESMA molécula em níveis diferentes de detalhe: pontos (Lewis), traços (estrutural) e contagem (molecular).'
  },
  {
    id: 'bun3',
    cat: 'bueno',
    q: 'No CO₂, o carbono (4 elétrons de valência) liga-se a dois oxigênios (6 elétrons de valência cada). A estrutura correta é:',
    opts: [
      'O−C−O, com duas ligações simples e o carbono instável.',
      'O=C=O, com duas ligações duplas e todos os átomos com octeto completo.',
      'O≡C≡O, com duas ligações triplas.',
      'C₂O, com o oxigênio no centro.'
    ],
    ans: 1,
    why: 'C compartilha 2 pares com cada O (4 pares no total): duas ligações DUPLAS. Assim C fica com 8 elétrons e cada O também completa o octeto.'
  },
  {
    id: 'bun4',
    cat: 'bueno',
    q: 'Comparando CH₄, H₂O e HCl, todas essas moléculas têm em comum o fato de:',
    opts: [
      'serem formadas por transferência definitiva de elétrons.',
      'conterem pelo menos um metal ligado a um ametal.',
      'terem apenas ligações triplas entre os átomos.',
      'formarem-se por COMPARTILHAMENTO de pares de elétrons entre ametais (ligações covalentes).'
    ],
    ans: 3,
    why: 'C, H, O, N e Cl são ametais: todas as ligações dessas moléculas são covalentes — pares de elétrons compartilhados (simples, no caso).'
  },
  {
    id: 'bun5',
    cat: 'bueno',
    q: 'O carbono tem 4 elétrons de valência. Por isso, na molécula de metano (CH₄), cada átomo de carbono:',
    opts: [
      'doa 4 elétrons aos hidrogênios e vira C⁴⁺.',
      'recebe 4 elétrons dos hidrogênios e vira C⁴⁻.',
      'compartilha 4 pares de elétrons, formando 4 ligações simples.',
      'faz apenas 1 ligação, pois hidrogênio é gás nobre.'
    ],
    ans: 2,
    why: 'Covalente é COMPARTILHAR: cada H aporta 1 elétron para o par; com 4 hidrogênios, o carbono divide 4 pares — 4 ligações simples e octeto completo.'
  },
  {
    id: 'bun6',
    cat: 'bueno',
    q: 'Uma mesma molécula foi desenhada três vezes: “H·O·H” com pontos, “H−O−H” com traços e “H₂O”. As três representações:',
    opts: [
      'são moléculas diferentes, pois usam símbolos diferentes.',
      'representam a MESMA molécula (água), mudando apenas o nível de detalhe da representação.',
      'estão erradas, pois água não pode ser representada por traços.',
      'provam que a água tem ligação iônica.'
    ],
    ans: 1,
    why: 'Lewis (pontos), estrutural (traços) e molecular (contagem) são representações equivalentes da mesma substância: a água, com 2 ligações covalentes simples.'
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
  4: 'general',   /* Planeta Final (revisão de tudo) */
  [KINDER_INDEX]: 'kinder', /* SIDE QUEST · Planeta Kinder (iônica avançada) */
  [BUENO_INDEX]: 'bueno'    /* SIDE QUEST · Planeta Bueno (covalente avançada) */
};
