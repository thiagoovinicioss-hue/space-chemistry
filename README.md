<<<<<<< HEAD
# Space Chemistry: Mission Bonds

Jogo educativo de **Ciências** sobre os **três tipos de ligações químicas**
(iônica, covalente e metálica), desenvolvido com HTML5, CSS3 e JavaScript
puro — sem nenhuma biblioteca ou framework externo.

## Como executar

Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome,
Edge, Firefox ou Safari). Não é necessário instalar nada nem ter internet.

## Controles

| Ação                 | Tecla / Toque                     |
|----------------------|-----------------------------------|
| Mover                | `W A S D` ou setas `↑ ← ↓ →`      |
| Interagir / montar   | `ESPAÇO`                          |
| Pausar               | `ESC`                             |
| Controles de toque   | Botões na tela (mobile/tablet)    |

## História

A galáxia perdeu suas ligações químicas e as estrelas estão apagando. Você é
o(a) astronauta responsável por viajar até cinco mundos, coletar cristais de
elementos químicos e usar o que aprendeu para restaurar a energia do núcleo
cósmico.

## Conteúdo pedagógico (o que você aprende jogando)

Cada planeta ensina um tipo de ligação e exige que o jogador **aplique** o
conceito para avançar:

- **Estação Orbital (tutorial)** — como jogar, coletar e montar compostos.
- **Planeta Iônico** — metal + ametal **transferem** elétrons e formam íons
  (NaCl, MgO, KBr). Se errar, uma dica explica o conceito.
- **Planeta Covalente** — ametais **compartilham** elétrons (H₂O, CO₂, NH₃).
- **Planeta Metálico** — metais puros com "mar de elétrons" livres (Cu, Fe, Au).
- **Planeta Final** — classificadores (portais) exigem identificar a ligação
  de cada composto e reativar o reator da galáxia.

Mecânicas de ensino embutidas na jogabilidade:

- **Erros ensinam**: cada resposta errada mostra a explicação da ligação
  correta em vez de só punir.
- **Regras visíveis**: a "Central de Regras" no menu resume os três tipos de
  ligação com exemplos; o HUD exibe o objetivo da fase o tempo todo.
- **Progresso** (barra de objetivo) mostra quantos compostos faltam montar.

## Recursos do jogo

- 5 fases sequenciais com temas visuais únicos (pixel art gerada por código).
- Sistema de **vidas (3)**, pontuação, cronômetro e bônus de tempo.
- **10 conquistas** com recompensas cosméticas.
- **Vestiário** para personalizar capacete, traje, nave e rastro (só visual,
  nunca dá vantagem).
- **Salvamento automático** no navegador (localStorage).
- **Áudio 100% sintetizado** em tempo real com a Web Audio API (música,
  efeitos e voz de "composto montado").
- Modo tela cheia, responsivo e com controles de toque.

## Estrutura do código

```
index.html   → todas as telas (menu, regras, galáxia, vestiário, jogo…)
style.css    → visual espacial, animações, responsividade
script.js    → motor do jogo completo (organizado em seções comentadas)
assets/icons → ícone do jogo
```

`script.js` é organizado em seções numeradas:

1. Dados (elementos, receitas, fases, conquistas, cosméticos)
2. Salvamento (localStorage)
3. Áudio sintetizado (Web Audio API)
4. Sprites de pixel art
5. Construção dos mapas por tile
6. Lógica do jogador, colisão, interações
7. Mecânicas educacionais (montagem, classificação, reator)
8. Renderização em canvas
9. HUD e menus

## Critérios atendidos (checklist)

- **Roteiro educacional claro**: cada fase ensina um tipo de ligação e o
  jogador precisa usá-lo para avançar.
- **Aprendizado durante o jogo**: feedback pedagógico em cada acerto e erro.
- **Regras apresentadas e visíveis**: tela de regras + dicas durante o jogo.
- **Duração de 15–20 minutos**: campanha de 5 fases com dificuldade crescente.
- **Originalidade**: pixel art e áudio gerados por código, sem assets externos.
- **Código organizado e comentado**: seções claras e legíveis.
