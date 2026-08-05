/* =====================================================================
   SPACE CHEMISTRY: MISSION BONDS
   Trabalho de Ciências — Ligações Químicas
   ---------------------------------------------------------------------
   Jogo 100% HTML5 + CSS3 + JavaScript Vanilla (sem frameworks).
   Arte e áudio gerados por código (Canvas API + Web Audio API).

   ÍNDICE DAS SEÇÕES
   01. Configurações e constantes
   02. Utilitários
   03. Motor de áudio (Web Audio API)
   04. Sprites pixel-art (matrizes de caracteres)
   05. Dados do jogo (elementos, cosméticos, conquistas, fases)
   06. Sistema de salvamento (localStorage)
   07. Gerenciador de estado e telas
   08. Construção das fases (mapas)
   09. Jogador (movimento, colisão, interação)
   10. Mecânicas educacionais (ligações iônica, covalente e metálica)
   11. Atualização do jogo (loop)
   12. Renderização (canvas)
   13. Interface (menus, HUD, overlays)
   14. Loop principal e inicialização
   ===================================================================== */

'use strict';

/* =====================================================================
   01. CONFIGURAÇÕES E CONSTANTES
===================================================================== */
const TILE = 32;
const VIEW_W = 640;
const VIEW_H = 360;
const PLAYER_R = 12;
const MAX_LIVES = 3;
const TUTORIAL_INDEX = 0;
const IONIC_INDEX = 1;
const COVALENT_INDEX = 2;
const METALLIC_INDEX = 3;
const FINAL_INDEX = 4;

const COL_BOND = {
  ionic: '#ff9df2',
  covalent: '#7ff5ff',
  metallic: '#ffd166'
};
const BOND_NAME = { ionic: 'Iônica', covalent: 'Covalente', metallic: 'Metálica' };

/* =====================================================================
   02. UTILITÁRIOS
===================================================================== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const chance = p => Math.random() < p;

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/* Subscrito químico */
function chem(formula) {
  return String(formula)
    .replace(/₂/g, '\u2082')
    .replace(/₃/g, '\u2083')
    .replace(/₄/g, '\u2084');
}

/* =====================================================================
   03. MOTOR DE ÁUDIO (Web Audio API)
   Toda a música e os efeitos sonoros são gerados por código.
===================================================================== */
const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicOn: true,
  sfxOn: true,
  musicTimer: null,
  nextNoteTime: 0,
  step: 0,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicOn ? 0.5 : 0;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxOn ? 1 : 0;
    this.sfxGain.connect(this.master);
  },

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.ctx && this.ctx.state === 'running') this.startMusic();
  },

  /* --- Gera um tom com envelope simples --- */
  tone({ freq = 440, type = 'sine', dur = 0.2, vol = 0.2, slideTo = null, delay = 0, dest = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest || this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  noise({ dur = 0.2, vol = 0.2, delay = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const n = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1200;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  },

  /* --- Efeitos sonoros --- */
  sfx(name) {
    if (!this.ctx || !this.sfxOn) return;
    switch (name) {
      case 'click': this.tone({ freq: 600, type: 'triangle', dur: 0.08, vol: 0.15 }); break;
      case 'collect': this.tone({ freq: 660, slideTo: 990, type: 'sine', dur: 0.14, vol: 0.2 }); break;
      case 'correct': [523, 659, 784, 1047].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.22, delay: i * 0.09 })); break;
      case 'error': this.tone({ freq: 240, slideTo: 130, type: 'sawtooth', dur: 0.28, vol: 0.18 }); break;
      case 'hurt': this.noise({ dur: 0.25, vol: 0.3 }); this.tone({ freq: 160, slideTo: 60, type: 'square', dur: 0.3, vol: 0.15 }); break;
      case 'build': this.tone({ freq: 90, type: 'square', dur: 0.12, vol: 0.2 }); this.tone({ freq: 1318, type: 'sine', dur: 0.3, vol: 0.15, delay: 0.12 }); break;
      case 'victory': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.22, delay: i * 0.12 })); break;
      case 'unlock': [1047, 1319, 1568, 2093].forEach((f, i) => this.tone({ freq: f, type: 'sine', dur: 0.18, vol: 0.16, delay: i * 0.07 })); break;
      case 'portal': this.tone({ freq: 300, slideTo: 900, type: 'sine', dur: 0.5, vol: 0.18 }); break;
      case 'gate': this.tone({ freq: 880, slideTo: 1320, type: 'triangle', dur: 0.2, vol: 0.18 }); break;
      case 'damage': this.tone({ freq: 400, slideTo: 200, type: 'square', dur: 0.2, vol: 0.15 }); break;
    }
  },

  /* --- Música ambiente espacial (sequenciador) --- */
  startMusic() {
    if (!this.ctx || this.musicTimer || !this.musicOn) return;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 60);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },

  /* Progressão de acordes: Am - F - C - G */
  CHORDS: [
    [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]
  ],
  BASS: [45, 41, 36, 43],

  schedule() {
    if (!this.ctx) return;
    const spb = 0.55; /* segundos por batida */
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      const bar = Math.floor(this.step / 4) % this.CHORDS.length;
      const beat = this.step % 4;
      const t = this.nextNoteTime - this.ctx.currentTime;
      const chord = this.CHORDS[bar];

      /* Pad suave em cada batida */
      chord.forEach((note, i) => {
        this.tone({ freq: midi(note), type: 'triangle', dur: spb * 0.9, vol: 0.04, delay: t, dest: this.musicGain });
      });
      /* Baixo na primeira batida do compasso */
      if (beat === 0) {
        this.tone({ freq: midi(this.BASS[bar]), type: 'sine', dur: spb * 1.6, vol: 0.07, delay: t, dest: this.musicGain });
      }
      /* Brilhos esporádicos */
      if (chance(0.35)) {
        const sparkle = [76, 79, 83, 88][randInt(0, 3)];
        this.tone({ freq: midi(sparkle), type: 'sine', dur: 0.25, vol: 0.03, delay: t + 0.1, dest: this.musicGain });
      }
      this.step++;
      this.nextNoteTime += spb / 2;
    }
  },

  setMusic(on) {
    this.musicOn = on;
    if (this.ctx && this.musicGain) this.musicGain.gain.value = on ? 0.5 : 0;
    if (on) this.startMusic(); else this.stopMusic();
  },

  setSfx(on) {
    this.sfxOn = on;
    if (this.ctx && this.sfxGain) this.sfxGain.gain.value = on ? 1 : 0;
  }
};

function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

/* =====================================================================
   04. SPRITES PIXEL-ART (matrizes de caracteres)
   Cada caractere é um pixel; a cor vem do paleta do sprite.
===================================================================== */
const SPRITES = {

  /* Astronauta de cima (12 x 16 px) */
  astronaut: {
    grid: [
      '....HHHH....',
      '...HHHHHH...',
      '..HHDDDDHH..',
      '..HDVVVVDH..',
      '..HDVVVVDH..',
      '..HHDDDDHH..',
      '...HHHHHH...',
      '....HHHH....',
      '....SSSS....',
      '...SSSSSS...',
      '..SSSSSSSS..',
      '..SSWSSWSS..',
      '...SSSSSS...',
      '....SSSS....',
      '...DD..DD...',
      '...DD..DD...'
    ]
  },

  /* Nave espacial (14 x 10 px) */
  ship: {
    grid: [
      '.....GGGGG.....',
      '....GGVVVGG....',
      '....GVVVVVG....',
      '...GGVVVVVGG...',
      '.GGGGGGGGGGGG..',
      '.WWWWWGGWWWWW..',
      '.WWWGGGGGGWWW..',
      '..WWGGGGGGWW...',
      '...WWWGGWWW....',
      '.....FFFFF.....'
    ]
  },

  /* Cristal coletável (10 x 12 px) */
  crystal: {
    grid: [
      '....CC....',
      '...CCCC...',
      '..CCCCCC..',
      '..CWWWWC..',
      '.CCWWWWCC.',
      '.CWWWWWWC.',
      '.CCWWWWCC.',
      '..CWWWWC..',
      '..CCCCCC..',
      '...CCCC...',
      '....CC....',
      '....CC....'
    ]
  }
};

/* Cores do astronauta dependentes dos cosméticos equipados */
function astronautPalette(helmet, suit) {
  return {
    H: helmet.main,
    V: helmet.visor,
    D: '#0c1226',
    S: suit.main,
    W: '#ffffff'
  };
}

/* Desenha uma matriz pixel-art */
function drawSprite(ctx, sprite, x, y, scale, palette) {
  const grid = sprite.grid;
  const px = scale;
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}

function spriteSize(sprite, scale) {
  return { w: sprite.grid[0].length * scale, h: sprite.grid.length * scale };
}

/* =====================================================================
   05. DADOS DO JOGO
===================================================================== */

/* --- Tabela periódica reduzida (elementos usados no jogo) --- */
const ELEMENTS = {
  Na: { symbol: 'Na', name: 'Sódio', color: '#ffd166', type: 'metal', valence: 1, ion: 'Na⁺' },
  Mg: { symbol: 'Mg', name: 'Magnésio', color: '#d3f2ff', type: 'metal', valence: 2, ion: 'Mg²⁺' },
  K:  { symbol: 'K',  name: 'Potássio', color: '#c77bff', type: 'metal', valence: 1, ion: 'K⁺' },
  Cl: { symbol: 'Cl', name: 'Cloro', color: '#5dffa6', type: 'ametal', valence: 1, ion: 'Cl⁻' },
  O:  { symbol: 'O',  name: 'Oxigênio', color: '#59d3ff', type: 'ametal', valence: 2, ion: 'O²⁻' },
  Br: { symbol: 'Br', name: 'Bromo', color: '#ff8a5d', type: 'ametal', valence: 1, ion: 'Br⁻' },
  H:  { symbol: 'H',  name: 'Hidrogênio', color: '#eef2ff', type: 'ametal', valence: 1, ion: 'H⁺' },
  C:  { symbol: 'C',  name: 'Carbono', color: '#9aa5b8', type: 'ametal', valence: 4, ion: 'C⁴⁻' },
  N:  { symbol: 'N',  name: 'Nitrogênio', color: '#7f8fff', type: 'ametal', valence: 3, ion: 'N³⁻' },
  Cu: { symbol: 'Cu', name: 'Cobre', color: '#ff9d5d', type: 'metal', valence: 1, ion: 'Cu⁺' },
  Fe: { symbol: 'Fe', name: 'Ferro', color: '#b0b6c4', type: 'metal', valence: 2, ion: 'Fe²⁺' },
  Au: { symbol: 'Au', name: 'Ouro', color: '#ffd166', type: 'metal', valence: 1, ion: 'Au⁺' },
  Al: { symbol: 'Al', name: 'Alumínio', color: '#c8f0ff', type: 'metal', valence: 3, ion: 'Al³⁺' }
};

/* --- Temas visuais por planeta --- */
const THEMES = {
  tutorial: { sky1: '#05070f', sky2: '#0b1030', wall: '#2b3554', wallTop: '#3d4a73', floor: '#151c3d', floorAlt: '#182147', accent: '#59d3ff', planet: '#59d3ff' },
  ionic:    { sky1: '#1a0516', sky2: '#2b0a2e', wall: '#4a2a55', wallTop: '#6b3d78', floor: '#241333', floorAlt: '#2a173c', accent: '#ff9df2', planet: '#ff9df2' },
  covalent: { sky1: '#03141f', sky2: '#0a2a44', wall: '#1f4a6b', wallTop: '#2f6a96', floor: '#0e2333', floorAlt: '#122b40', accent: '#7ff5ff', planet: '#7ff5ff' },
  metallic: { sky1: '#1c1203', sky2: '#3a2a10', wall: '#5a4630', wallTop: '#7a5f40', floor: '#2a2010', floorAlt: '#332714', accent: '#ffd166', planet: '#ffd166' },
  final:    { sky1: '#0a061e', sky2: '#1d1040', wall: '#3a2a6b', wallTop: '#5440a0', floor: '#1c1433', floorAlt: '#231a40', accent: '#c8a2ff', planet: '#c8a2ff' }
};

/* --- Cosmeticos (somente visuais, nunca vantagens) --- */
const COSMETICS = {
  helmets: [
    { id: 'h_classic', name: 'Capacete Clássico', unlock: 'start', main: '#2b6f9e', visor: '#7ff5ff', cat: 'Capacete' },
    { id: 'h_blue', name: 'Capacete Azul', unlock: 'level:0', main: '#3aa0ff', visor: '#cff3ff', cat: 'Capacete' },
    { id: 'h_red', name: 'Capacete Vermelho', unlock: 'ach:flawless', main: '#ff5252', visor: '#ffd9d9', cat: 'Capacete' },
    { id: 'h_gold', name: 'Capacete Dourado', unlock: 'level:4', main: '#ffd166', visor: '#fff3c4', cat: 'Capacete' },
    { id: 'h_neon', name: 'Capacete Neon', unlock: 'ach:perfect', main: '#39ff8b', visor: '#d6ffec', cat: 'Capacete' }
  ],
  suits: [
    { id: 's_classic', name: 'Traje Clássico', unlock: 'start', main: '#9bd0ff', cat: 'Traje' },
    { id: 's_ionic', name: 'Traje Iônico', unlock: 'level:1', main: '#ff9df2', cat: 'Traje' },
    { id: 's_covalent', name: 'Traje Covalente', unlock: 'ach:covalent_expert', main: '#7ff5ff', cat: 'Traje' },
    { id: 's_metallic', name: 'Traje Metálico', unlock: 'ach:metallic_expert', main: '#ffb547', cat: 'Traje' },
    { id: 's_galaxy', name: 'Traje Galáctico', unlock: 'level:4', main: '#c8a2ff', cat: 'Traje' }
  ],
  ships: [
    { id: 'ship_default', name: 'Nave Padrão', unlock: 'start', main: '#2b6f9e', cat: 'Nave' },
    { id: 'ship_ion', name: 'Nave Íon', unlock: 'level:1', main: '#e356c8', cat: 'Nave' },
    { id: 'ship_comet', name: 'Nave Cometa', unlock: 'ach:covalent_expert', main: '#29b8d8', cat: 'Nave' },
    { id: 'ship_meteor', name: 'Nave Meteoro', unlock: 'level:3', main: '#e88b2e', cat: 'Nave' },
    { id: 'ship_cosmic', name: 'Nave Cósmica', unlock: 'ach:collector', main: '#8f5bff', cat: 'Nave' }
  ],
  trails: [
    { id: 't_none', name: 'Sem Rastro', unlock: 'start', cat: 'Rastro', color: null },
    { id: 't_star', name: 'Rastro de Estrelas', unlock: 'level:2', cat: 'Rastro', color: '#7ff5ff' },
    { id: 't_elec', name: 'Rastro Elétrico', unlock: 'ach:speedrun', cat: 'Rastro', color: '#ffe14d' },
    { id: 't_flame', name: 'Rastro de Fogo', unlock: 'ach:perfect', cat: 'Rastro', color: '#ff7a3d' }
  ]
};

const CATS = ['helmets', 'suits', 'ships', 'trails'];
function allCosmetics() {
  return CATS.flatMap(c => COSMETICS[c].map(it => ({ ...it, catName: c })));
}

/* --- Conquistas --- */
const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'Primeiros Passos', desc: 'Complete o tutorial (Estação Orbital).', reward: null },
  { id: 'first_planet', name: 'Primeiro Planeta', desc: 'Complete o Planeta Iônico.', reward: null },
  { id: 'ionic_expert', name: 'Especialista em Ligações Iônicas', desc: 'Monte NaCl, MgO e KBr.', reward: 's_ionic' },
  { id: 'covalent_expert', name: 'Especialista em Ligações Covalentes', desc: 'Monte H₂O, CO₂ e NH₃.', reward: 's_covalent' },
  { id: 'metallic_expert', name: 'Especialista em Ligações Metálicas', desc: 'Ative as máquinas com os metais certos.', reward: 's_metallic' },
  { id: 'game_complete', name: 'Terminou o Jogo', desc: 'Restaure a galáxia completa.', reward: null },
  { id: 'flawless', name: 'Terminou sem morrer', desc: 'Complete a missão sem ser atingido por nenhum perigo.', reward: 'h_red' },
  { id: 'perfect', name: '100% de Acertos', desc: 'Complete a missão sem nenhum erro.', reward: 'h_neon' },
  { id: 'speedrun', name: 'Menos de 15 minutos', desc: 'Restaure a galáxia em menos de 15 minutos.', reward: 't_elec' },
  { id: 'collector', name: 'Colecionador', desc: 'Desbloqueie todos os itens cosméticos.', reward: 'ship_cosmic' }
];

/* --- Receitas / compostos e explicações curtas (máx. 2 frases) --- */
const RECIPES = {
  NaCl: {
    formula: 'NaCl', name: 'Cloreto de Sódio', kind: 'ionic', atoms: { Na: 1, Cl: 1 },
    learn: 'Correto! O sódio (Na), um METAL, doa 1 elétron ao cloro (Cl), um AMETAL. Formam-se os íons Na⁺ e Cl⁻, que se atraem — ligação IÔNICA.'
  },
  MgO: {
    formula: 'MgO', name: 'Óxido de Magnésio', kind: 'ionic', atoms: { Mg: 1, O: 1 },
    learn: 'Correto! O magnésio (Mg), metal, doa 2 elétrons ao oxigênio (O), ametal. Formam-se Mg²⁺ e O²⁻, que se atraem — ligação IÔNICA.'
  },
  KBr: {
    formula: 'KBr', name: 'Brometo de Potássio', kind: 'ionic', atoms: { K: 1, Br: 1 },
    learn: 'Correto! O potássio (K), metal, doa 1 elétron ao bromo (Br), ametal. Íons K⁺ e Br⁻ se unem — ligação IÔNICA.'
  },
  H2O: {
    formula: 'H₂O', name: 'Água', kind: 'covalent', atoms: { H: 2, O: 1 },
    learn: 'Correto! Hidrogênio e oxigênio são AMETAIS que COMPARTILHAM elétrons. Assim se forma a ligação COVALENTE da água.'
  },
  CO2: {
    formula: 'CO₂', name: 'Dióxido de Carbono', kind: 'covalent', atoms: { C: 1, O: 2 },
    learn: 'Correto! Carbono e oxigênio (ametais) compartilham pares de elétrons. CO₂ tem ligação COVALENTE.'
  },
  NH3: {
    formula: 'NH₃', name: 'Amônia', kind: 'covalent', atoms: { N: 1, H: 3 },
    learn: 'Correto! O nitrogênio compartilha elétrons com 3 hidrogênios, todos ametais. NH₃ tem ligação COVALENTE.'
  },
  CU: {
    formula: 'Cu', name: 'Cobre', kind: 'metallic', atoms: { Cu: 1 },
    learn: 'Correto! O cobre é um METAL com elétrons livres — o "mar de elétrons". Por isso conduz eletricidade perfeitamente!'
  },
  FE: {
    formula: 'Fe', name: 'Ferro', kind: 'metallic', atoms: { Fe: 1 },
    learn: 'Correto! O ferro, metal, tem elétrons livres no "mar de elétrons". Isso o torna maleável e ótimo condutor para estruturas.'
  },
  AU: {
    formula: 'Au', name: 'Ouro', kind: 'metallic', atoms: { Au: 1 },
    learn: 'Correto! O ouro, metal nobre, conduz eletricidade pelos elétrons livres do seu "mar de elétrons". Por isso é usado em eletrônicos.'
  }
};

/* --- Fases (planetas) ---
   Representação:
   - walls: [x0, y0, x1, y1] retângulos de parede
   - crystals: { Elemento: [[x,y], ...] } posições em tiles
   - hazards: [ [x,y] ] asteroides
   - traps: [ {x, y, w, h} ] armadilhas elétricas
   - gates: [ {x, y, w, h, type} ] portais de classificação
   - machine: {x, y, label, type}
   - recipes: id das receitas a montar em ordem
*/
const LEVELS = [

  /* ---------- 0 · TUTORIAL: Estação Orbital ---------- */
  {
    id: 'tutorial', name: 'Estação Orbital', theme: 'tutorial',
    intro: 'Bem-vindo, recruta! O planeta vizinho perdeu sua energia. Antes de partir, aprenda a pilotar seu traje. Colete os cristais e monte a molécula de água no computador.',
    spawn: { x: 4, y: 8 }, w: 28, h: 17,
    machine: { x: 22, y: 8, label: 'Computador de Bordo', type: 'assembler' },
    portal: { x: 26, y: 8 },
    walls: [
      [11, 2, 11, 5], [6, 10, 8, 10], [17, 12, 19, 12], [21, 3, 23, 3], [14, 6, 16, 6], [3, 12, 4, 12]
    ],
    crystals: { H: [[7, 5], [13, 4]], O: [[10, 12]] },
    hazards: [[5, 3], [18, 10]],
    recipes: ['H2O'],
    objective: 'Monte a molécula de água (H₂O)',
    planetColor: '#59d3ff'
  },

  /* ---------- 1 · PLANETA IÔNICO: Krystália ---------- */
  {
    id: 'ionic', name: 'Planeta Iônico', theme: 'ionic',
    intro: 'Krystália está em chamas! Aqui, METAL + AMETAL trocam elétrons e formam cristais iônicos. Colete os elementos e monte os compostos na Fornalha Iônica.',
    spawn: { x: 3, y: 14 }, w: 30, h: 17,
    machine: { x: 14, y: 8, label: 'Fornalha Iônica', type: 'furnace' },
    portal: { x: 27, y: 8 },
    walls: [
      [8, 7, 10, 7], [18, 7, 20, 7], [8, 9, 10, 9], [18, 9, 20, 9],
      [13, 3, 15, 3], [25, 10, 26, 12], [5, 8, 6, 9], [22, 4, 23, 4], [4, 2, 5, 2]
    ],
    crystals: {
      Na: [[4, 4], [10, 12]],
      Cl: [[6, 13], [22, 3]],
      Mg: [[18, 4]],
      O: [[8, 3], [20, 13]],
      K: [[24, 5]],
      Br: [[12, 13]]
    },
    hazards: [[12, 3], [21, 10], [16, 13], [3, 8], [26, 5], [7, 15]],
    recipes: ['NaCl', 'MgO', 'KBr'],
    objective: 'Monte os compostos iônicos',
    planetColor: '#ff9df2'
  },

  /* ---------- 2 · PLANETA COVALENTE: Nébula ---------- */
  {
    id: 'covalent', name: 'Planeta Covalente', theme: 'covalent',
    intro: 'Nébula é feita de gases. Aqui, AMETAL + AMETAL COMPARTILHAM elétrons. Monte as moléculas no Montador Molecular e limpe a atmosfera.',
    spawn: { x: 2, y: 8 }, w: 30, h: 17,
    machine: { x: 14, y: 8, label: 'Montador Molecular', type: 'assembler' },
    portal: { x: 27, y: 8 },
    walls: [
      [8, 5, 10, 5], [18, 5, 20, 5], [8, 11, 10, 11], [18, 11, 20, 11],
      [5, 7, 6, 7], [22, 7, 23, 7], [12, 13, 13, 13], [16, 3, 17, 3], [24, 4, 25, 4]
    ],
    crystals: {
      H: [[5, 3], [9, 6], [21, 6], [10, 14], [20, 13]],
      O: [[7, 12], [13, 5], [23, 6]],
      C: [[19, 4]],
      N: [[6, 9]]
    },
    hazards: [[4, 13], [21, 3], [10, 9], [25, 12], [15, 14]],
    recipes: ['H2O', 'CO2', 'NH3'],
    objective: 'Monte as moléculas covalentes',
    planetColor: '#7ff5ff'
  },

  /* ---------- 3 · PLANETA METÁLICO: Ferravil ---------- */
  {
    id: 'metallic', name: 'Planeta Metálico', theme: 'metallic',
    intro: 'Ferravil perdeu toda a energia! Os metais guardam elétrons livres no "mar de elétrons" e conduzem corrente. Colete os metais e alimente o Núcleo de Energia.',
    spawn: { x: 2, y: 8 }, w: 30, h: 17,
    machine: { x: 14, y: 8, label: 'Núcleo de Energia', type: 'core' },
    portal: { x: 27, y: 8 },
    walls: [
      [8, 4, 10, 4], [18, 4, 20, 4], [8, 12, 10, 12], [18, 12, 20, 12],
      [5, 6, 6, 6], [22, 6, 23, 6], [13, 3, 15, 3], [24, 13, 25, 13]
    ],
    crystals: {
      Cu: [[5, 4]],
      Fe: [[6, 12]],
      Au: [[23, 5]],
      Al: [[24, 12]]
    },
    hazards: [[12, 3], [21, 3], [15, 14], [3, 10]],
    traps: [{ x: 10, y: 10, w: 5, h: 1 }],
    wires: [[14, 3, 22, 3], [14, 13, 22, 13], [5, 10, 13, 10], [16, 10, 24, 10]],
    recipes: ['CU', 'FE', 'AU'],
    objective: 'Alimente o núcleo com os metais certos',
    planetColor: '#ffd166'
  },

  /* ---------- 4 · PLANETA FINAL: Núcleo Cósmico ---------- */
  {
    id: 'final', name: 'Planeta Final', theme: 'final',
    intro: 'O Núcleo Cósmico precisa que você aplique TUDO que aprendeu. Classifique as ligações nos portais e restaure a galáxia!',
    spawn: { x: 2, y: 14 }, w: 30, h: 18,
    machine: { x: 24, y: 8, label: 'Reator da Galáxia', type: 'reactor' },
    portal: { x: 28, y: 8 },
    walls: [
      [2, 3, 3, 3], [2, 9, 3, 10], [11, 2, 12, 3], [18, 2, 19, 3],
      [22, 3, 23, 5], [27, 3, 27, 5], [26, 11, 27, 12], [15, 8, 16, 9]
    ],
    gates: [
      { x: 5, y: 5, w: 2, h: 2, type: 'ionic' },
      { x: 9, y: 5, w: 2, h: 2, type: 'covalent' },
      { x: 13, y: 5, w: 2, h: 2, type: 'metallic' },
      { x: 17, y: 5, w: 2, h: 2, type: 'covalent' }
    ],
    crystals: {
      Na: [[4, 4]],
      Cl: [[6, 3]],
      O: [[3, 11]],
      H: [[5, 13]]
    },
    hazards: [[8, 10], [11, 14], [21, 11], [25, 12], [17, 15]],
    traps: [{ x: 10, y: 12, w: 6, h: 1 }],
    recipes: ['NaCl'],
    objective: 'Classifique as ligações e reative o reator',
    planetColor: '#c8a2ff',
    gateSequence: [
      { formula: 'NaCl', bond: 'ionic', learn: 'NaCl é feito de metal (Na) + ametal (Cl), que TROCAM elétrons. Isso é ligação IÔNICA.' },
      { formula: 'CO₂', bond: 'covalent', learn: 'C e O são ametais que COMPARTILHAM elétrons. CO₂ é ligação COVALENTE.' },
      { formula: 'Au', bond: 'metallic', learn: 'O ouro é um metal puro com "mar de elétrons" livres. Isso é ligação METÁLICA.' },
      { formula: 'NH₃', bond: 'covalent', learn: 'N e H são ametais que compartilham elétrons. NH₃ é ligação COVALENTE.' }
    ]
  }
];

/* Recompensas por completar cada planeta */
const LEVEL_REWARDS = {
  0: 'h_blue',
  1: 's_ionic',
  2: 't_star',
  3: 'ship_meteor',
  4: 'h_gold'
};

const ACHIEVEMENT_PER_LEVEL = {
  0: 'first_steps',
  1: 'first_planet',
  2: 'covalent_expert',
  3: 'metallic_expert',
  4: 'game_complete'
};

const ACH_BONUS = { ionic_expert: 200, covalent_expert: 200, metallic_expert: 200, game_complete: 300, collector: 500 };

/* =====================================================================
   06. SISTEMA DE SALVAMENTO (localStorage)
===================================================================== */
const SAVE_KEY = 'spaceChemistryMissionBonds';
const Save = {
  data: null,

  defaults() {
    return {
      version: 1,
      completed: [false, false, false, false, false],
      bestScore: 0,
      unlocks: ['h_classic', 's_classic', 'ship_default', 't_none'],
      equipped: { helmet: 'h_classic', suit: 's_classic', ship: 'ship_default', trail: 't_none' },
      achievements: [],
      musicOn: true,
      sfxOn: true
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this.data = Object.assign(this.defaults(), JSON.parse(raw));
        return;
      }
    } catch (e) { /* armazenamento indisponível */ }
    this.data = this.defaults();
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  hasItem(id) { return this.data.unlocks.indexOf(id) >= 0; },
  hasAch(id) { return this.data.achievements.indexOf(id) >= 0; },

  unlockItem(id) {
    if (!id || this.hasItem(id)) return;
    this.data.unlocks.push(id);
    this.save();
  },

  unlockAch(id) {
    if (!id || this.hasAch(id)) return;
    this.data.achievements.push(id);
    this.save();
  }
};

/* =====================================================================
   07. GERENCIADOR DE ESTADO E TELAS
===================================================================== */
const Game = {
  screen: 'menu',
  levelIndex: 0,
  level: null,           /* dados da fase atual (buildLevel) */
  player: null,
  particles: [],
  floaters: [],
  buildAnim: null,
  feedback: null,        /* popup educativo */
  inventory: {},         /* átomos coletados na fase */
  recipeIndex: 0,
  gateIndex: 0,
  levelTime: 0,
  locked: false,         /* jogador congelado (feedback/build/intro) */

  /* Estado da campanha (uma tentativa) */
  run: {
    active: false,
    score: 0,
    lives: MAX_LIVES,
    wrong: 0,
    deaths: 0,
    time: 0,
    completed: [false, false, false, false, false]
  },

  resetRun() {
    this.run = {
      active: false, score: 0, lives: MAX_LIVES, wrong: 0, deaths: 0, time: 0,
      completed: [false, false, false, false, false]
    };
  }
};

const Input = {
  keys: {},
  touched: {},
  isDown(code) { return !!this.keys[code] || !!this.touched[code]; }
};

/* --- Acesso rápido ao canvas --- */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* --- Detecção de dispositivo com toque --- */
const IS_TOUCH = !!(window.navigator && (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0));

/* Escala de renderização para telas de alta densidade (retina) */
let DEVICE_SCALE = 1;
function fitCanvasScale() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  DEVICE_SCALE = dpr;
  canvas.width = Math.round(VIEW_W * dpr);
  canvas.height = Math.round(VIEW_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

/* Mostra/oculta controles de toque conforme o dispositivo */
function updateTouchUI() {
  const tc = document.getElementById('touch-controls');
  if (IS_TOUCH) {
    tc.hidden = false;
    tc.removeAttribute('aria-hidden');
  } else {
    tc.hidden = true;
  }
}

/* Aviso de orientação: pede para girar em retrato apenas em telas pequenas */
function updateRotateHint() {
  const el = document.getElementById('rotate-hint');
  if (!el) return;
  const small = window.innerWidth < 480 && window.innerHeight > window.innerWidth;
  el.hidden = !(IS_TOUCH && small && Game.screen === 'game');
}

/* Fullscreen (botão e toque) */
function toggleFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

/* =====================================================================
   08. CONSTRUÇÃO DAS FASES (mapas)
===================================================================== */
function Grid(w, h) {
  this.w = w;
  this.h = h;
  this.cells = [];
  for (let i = 0; i < w * h; i++) this.cells.push('.');
  this.set = (x, y, v) => {
    if (x >= 0 && x < w && y >= 0 && y < h) this.cells[y * w + x] = v;
  };
  this.get = (x, y) => (x >= 0 && x < w && y >= 0 && y < h) ? this.cells[y * w + x] : '#';
  this.rect = (x0, y0, x1, y1, v) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, v);
  };
}

function buildLevel(idx) {
  const lv = LEVELS[idx];
  const theme = THEMES[lv.theme];

  /* Grade com bordas sólidas */
  const g = new Grid(lv.w, lv.h);
  for (let y = 0; y < lv.h; y++) {
    for (let x = 0; x < lv.w; x++) {
      g.set(x, y, (x === 0 || y === 0 || x === lv.w - 1 || y === lv.h - 1) ? '#' : '.');
    }
  }
  lv.walls.forEach(([x0, y0, x1, y1]) => g.rect(x0, y0, x1, y1, '#'));

  /* Cristais de elementos */
  const crystals = [];
  Object.keys(lv.crystals || {}).forEach(el => {
    lv.crystals[el].forEach(([x, y]) => {
      crystals.push({ el, x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, taken: false, t: rand(0, 6.28), fly: false });
    });
  });

  const hazards = (lv.hazards || []).map(([x, y]) => ({
    x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, r: 11, rot: rand(0, 6.28), vr: rand(-1.5, 1.5), t: rand(0, 6.28)
  }));

  const traps = (lv.traps || []).map(t => ({
    x: t.x * TILE, y: t.y * TILE, w: t.w * TILE, h: t.h * TILE,
    cycle: 2.4, activeDur: 1.4, t: rand(0, 2.4)
  }));

  const gates = (lv.gates || []).map(gd => ({
    x: gd.x * TILE, y: gd.y * TILE, w: gd.w * TILE, h: gd.h * TILE,
    type: gd.type, done: false, glow: 0
  }));

  const machine = { x: lv.machine.x * TILE + TILE / 2, y: lv.machine.y * TILE + TILE / 2 };
  const portal = { x: lv.portal.x * TILE + TILE / 2, y: lv.portal.y * TILE + TILE / 2, open: false };

  return {
    idx, lv, theme, g, crystals, hazards, traps, gates, machine, portal,
    gatesDone: false,
    particlesSeed: (g.w * g.h * (idx + 7)) % 1000
  };
}

/* =====================================================================
   09. JOGADOR
===================================================================== */
function createPlayer(x, y) {
  return {
    x, y, w: 20, h: 26,
    vx: 0, vy: 0,
    speed: 150,
    invuln: 0,
    moveX: 0, moveY: 0,
    trailT: 0
  };
}

function playerRect(p) {
  return { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
}

function isSolid(level, tx, ty) {
  return level.g.get(tx, ty) === '#';
}

/* Movimenta com colisão por eixo contra os tiles */
function moveEntity(level, p, ax, amt) {
  p[ax] += amt;
  const r = playerRect(p);
  const x0 = Math.floor(r.x / TILE), x1 = Math.floor((r.x + r.w - 0.01) / TILE);
  const y0 = Math.floor(r.y / TILE), y1 = Math.floor((r.y + r.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolid(level, tx, ty)) {
        if (ax === 'x') {
          if (amt > 0) p.x = tx * TILE - p.w / 2 - 0.01;
          else p.x = (tx + 1) * TILE + p.w / 2 + 0.01;
        } else {
          if (amt > 0) p.y = ty * TILE - p.h / 2 - 0.01;
          else p.y = (ty + 1) * TILE + p.h / 2 + 0.01;
        }
        return true;
      }
    }
  }
  return false;
}

/* =====================================================================
   10. MECÂNICAS EDUCACIONAIS
===================================================================== */
function hasAll(inv, atoms) {
  return Object.keys(atoms).every(el => (inv[el] || 0) >= atoms[el]);
}

function missingList(atoms) {
  const parts = [];
  Object.keys(atoms).forEach(el => {
    const have = Game.inventory[el] || 0;
    const need = atoms[el];
    parts.push(need + ' ' + ELEMENTS[el].name + ' (' + ELEMENTS[el].symbol + ')');
  });
  return parts.join(', ');
}

/* Mostra o popup educativo e congela o jogador até fechar */
function showFeedback(cls, title, text, onClose) {
  Game.feedback = { cls, title, text, onClose: onClose || null };
  Game.locked = true;
  const box = document.getElementById('feedback-box');
  box.className = 'feedback-box ' + cls;
  document.getElementById('feedback-title').textContent = title;
  document.getElementById('feedback-text').textContent = text;
  document.getElementById('feedback-continue').textContent = IS_TOUCH ? 'Toque para continuar' : 'ESPAÇO para continuar';
  document.getElementById('feedback').hidden = false;
}

function closeFeedback() {
  if (!Game.feedback) return;
  const cb = Game.feedback.onClose;
  Game.feedback = null;
  document.getElementById('feedback').hidden = true;
  if (cb) cb();
  else Game.locked = false;
}

/* Caminho do desafio atual */
function currentRecipe() {
  return RECIPES[Game.level.lv.recipes[Game.recipeIndex]];
}

/* Interação: pressionar ESPAÇO perto de uma máquina */
function tryInteract() {
  const lv = Game.level;
  if (!lv) return;

  /* No Planeta Final os portais bloqueiam o reator */
  if (lv.idx === FINAL_INDEX && !lv.gatesDone) {
    showFeedback('info', 'Os portais bloqueiam o caminho!',
      'Classifique as ligações nos portais para liberar o reator.');
    return;
  }

  const recipe = currentRecipe();
  if (!recipe) {
    showFeedback('info', 'Tudo pronto!', 'Atravesse o portal para continuar a missão.');
    return;
  }

  if (hasAll(Game.inventory, recipe.atoms)) {
    /* --- SUCESSO: monta o composto com animação --- */
    AudioSys.sfx('build');
    consumeAtoms(recipe.atoms);
    const kind = lv.idx === FINAL_INDEX ? 'reactor' : recipe.kind;
    Game.buildAnim = {
      kind, recipe, t: 0, dur: 2.6,
      onDone: () => {
        AudioSys.sfx('correct');
        if (!Game.replay) Game.run.score += 100;
        updateHudScore();
        showFeedback('good', recipe.formula + ' montado! (+100)', recipe.learn, () => {
          Game.recipeIndex++;
          updateObjectiveHud();
          checkRecipeDone();
          Game.locked = false;
        });
      }
    };
    Game.locked = true;
    return;
  }

  /* --- ERRO: combinação errada (ensina a regra) --- */
  if (recipe.kind === 'ionic' || lv.lv.idx === FINAL_INDEX) {
    const hasMetal = Object.keys(Game.inventory).some(e => ELEMENTS[e].type === 'metal');
    const hasAmetal = Object.keys(Game.inventory).some(e => ELEMENTS[e].type === 'ametal');
    if (hasMetal && hasAmetal) {
      Game.run.wrong++;
      Game.run.score = Math.max(0, Game.run.score - 20);
      AudioSys.sfx('error');
      shake(8);
      showFeedback('bad', 'Combinação errada (−20)',
        'Preciso de ' + recipe.formula + ': ' + missingList(recipe.atoms) +
        '. Lembre: METAL doa elétrons e AMETAL recebe. Junte os átomos certos!');
      updateHudScore();
      updateObjectiveHud();
      return;
    }
  }
  if (recipe.kind === 'metallic') {
    const need = Object.keys(recipe.atoms)[0];
    const haveMetal = Object.keys(Game.inventory).some(e => ELEMENTS[e].type === 'metal');
    if (haveMetal && !(Game.inventory[need] || 0)) {
      Game.run.wrong++;
      Game.run.score = Math.max(0, Game.run.score - 20);
      AudioSys.sfx('error');
      shake(8);
      showFeedback('bad', 'Metal errado (−20)',
        'A máquina precisa de ' + ELEMENTS[need].name + ' (' + need + '). Metais têm "mar de elétrons" e conduzem corrente — use o metal certo!');
      updateHudScore();
      updateObjectiveHud();
      return;
    }
  }

  /* --- FALTAM ÁTOMOS: orienta o jogador --- */
  const missing = missingList(recipe.atoms);
  showFeedback('info', 'Faltam átomos!',
    'Para montar ' + recipe.formula + ' preciso de: ' + missing + '. Colete os cristais espalhados pelo mapa.');
}

function consumeAtoms(atoms) {
  Object.keys(atoms).forEach(el => { Game.inventory[el] = (Game.inventory[el] || 0) - atoms[el]; });
  updateObjectiveHud();
}

function checkRecipeDone() {
  const lv = Game.level;
  if (Game.recipeIndex >= lv.lv.recipes.length) {
    if (lv.lv.gateSequence) {
      if (lv.gatesDone) unlockPortal();
    } else {
      unlockPortal();
    }
  }
}

function unlockPortal() {
  const lv = Game.level;
  if (lv.portal.open) return;
  lv.portal.open = true;
  AudioSys.sfx('portal');
  showFeedback('good', 'Portal ativado!',
    lv.idx === FINAL_INDEX
      ? 'A galáxia está pronta para ser restaurada. Atravesse o portal!'
      : 'A energia do planeta foi restaurada. Atravesse o portal para continuar!', () => { Game.locked = false; });
  burst(lv.portal.x, lv.portal.y, COL_BOND[lv.lv.theme === 'tutorial' ? 'covalent' : lv.lv.id === 'ionic' ? 'ionic' : lv.lv.id === 'metallic' ? 'metallic' : 'covalent']);
}

/* Portais de classificação (Planeta Final) */
function checkGates() {
  const lv = Game.level;
  if (!lv.gates || !lv.gates.length || lv.gatesDone) return;
  const seq = lv.lv.gateSequence;
  if (Game.gateIndex >= seq.length) {
    lv.gatesDone = true;
    if (Game.recipeIndex >= lv.lv.recipes.length) unlockPortal();
    return;
  }
  const cur = seq[Game.gateIndex];
  const pr = playerRect(Game.player);
  for (const gate of lv.gates) {
    if (gate.done) continue;
    const overlap = pr.x < gate.x + gate.w && pr.x + pr.w > gate.x && pr.y < gate.y + gate.h && pr.y + pr.h > gate.y;
    if (overlap) {
      if (gate.type === cur.bond) {
        gate.done = true;
        AudioSys.sfx('gate');
        burst(gate.x + gate.w / 2, gate.y + gate.h / 2, COL_BOND[cur.bond]);
        if (!Game.replay) Game.run.score += 150;
        updateHudScore();
        Game.gateIndex++;
        teleportToStandby();
        if (Game.gateIndex >= seq.length) {
          Game.level.gatesDone = true;
          if (Game.recipeIndex >= lv.lv.recipes.length) unlockPortal();
          else showFeedback('good', 'Portais liberados!', 'Agora monte NaCl no reator para restaurar a galáxia.', () => { Game.locked = false; });
        } else {
          showFeedback('good', 'Resposta certa! (+150)', cur.learn, () => { Game.locked = false; });
        }
        updateObjectiveHud();
      } else {
        Game.run.wrong++;
        if (!Game.replay) Game.run.score = Math.max(0, Game.run.score - 20);
        AudioSys.sfx('error');
        shake(10);
        teleportToStandby();
        showFeedback('bad', 'Ligação errada! (−20)',
          'Metal + ametal = IÔNICA · ametal + ametal = COVALENTE · metais puros = METÁLICA. ' + cur.formula + ' é qual?',
          () => { Game.locked = false; });
        updateHudScore();
        updateObjectiveHud();
      }
      return;
    }
  }
}

function teleportToStandby() {
  const lv = Game.level;
  Game.player.x = 2 * TILE + TILE / 2;
  Game.player.y = 12 * TILE + TILE / 2;
}

/* =====================================================================
   11. ATUALIZAÇÃO DO JOGO
===================================================================== */
let shakeAmt = 0;
let shakeTime = 0;
function shake(amt) { shakeAmt = amt; shakeTime = 0.3; }

function update(dt) {
  const lv = Game.level;
  if (!lv || Game.screen !== 'game') return;

  /* Pausa */
  if (pauseShown) return;

  /* Animação de montagem do composto (ensina pela mecânica) */
  if (Game.buildAnim) {
    const a = Game.buildAnim;
    a.t += dt;
    if (a.t >= a.dur) {
      const cb = a.onDone;
      Game.buildAnim = null;
      Game.locked = false;
      if (cb) cb();
    }
    return;
  }

  /* Jogador congelado (feedback/intro) */
  if (Game.locked) {
    updateParticles(dt);
    return;
  }

  /* Tempo da fase (somente em jogo ativo) */
  Game.levelTime += dt;
  Game.run.time += dt;
  updateHudTime();

  const p = Game.player;

  /* --- Movimento --- */
  let mx = 0, my = 0;
  if (Input.isDown('KeyW') || Input.isDown('ArrowUp')) my -= 1;
  if (Input.isDown('KeyS') || Input.isDown('ArrowDown')) my += 1;
  if (Input.isDown('KeyA') || Input.isDown('ArrowLeft')) mx -= 1;
  if (Input.isDown('KeyD') || Input.isDown('ArrowRight')) mx += 1;

  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    p.moveX = mx / len;
    p.moveY = my / len;
  } else {
    p.moveX = p.moveY = 0;
  }

  const spd = p.speed;
  moveEntity(lv, p, 'x', p.moveX * spd * dt);
  moveEntity(lv, p, 'y', p.moveY * spd * dt);

  /* --- Invulnerabilidade --- */
  if (p.invuln > 0) p.invuln -= dt;

  /* --- Rastro cosmético --- */
  p.trailT += dt;
  const trail = getEquippedItem('trail');
  if (trail.color && (p.moveX !== 0 || p.moveY !== 0) && p.trailT > 0.05) {
    p.trailT = 0;
    emitParticle(p.x - p.moveX * 10 + rand(-3, 3), p.y - p.moveY * 10 + rand(-3, 3), rand(-8, 8), rand(-8, 8), trail.color, 0.4 + rand(0, 0.3), 2);
  }

  /* --- Coleta de cristais --- */
  for (const c of lv.crystals) {
    if (c.taken) continue;
    if (dist(p.x, p.y, c.x, c.y) < 26) {
      c.taken = true;
      Game.inventory[c.el] = (Game.inventory[c.el] || 0) + 1;
      if (!Game.replay) {
        Game.run.score += 10;
        spawnFloater(c.x, c.y - 18, '+10 ' + ELEMENTS[c.el].symbol);
        updateHudScore();
      }
      AudioSys.sfx('collect');
      burst(c.x, c.y, ELEMENTS[c.el].color);
      updateObjectiveHud();
      updateObjectiveHud();
    }
  }

  /* --- Asteroides --- */
  for (const h of lv.hazards) {
    h.rot += h.vr * dt;
    if (dist(p.x, p.y, h.x, h.y) < PLAYER_R + h.r && p.invuln <= 0) {
      damagePlayer();
      break;
    }
  }

  /* --- Armadilhas elétricas --- */
  for (const t of lv.traps) {
    t.t += dt;
    if (t.t > t.cycle) t.t -= t.cycle;
    const active = t.t < t.activeDur;
    if (active && p.invuln <= 0) {
      const pr = playerRect(p);
      const overlap = pr.x < t.x + t.w && pr.x + pr.w > t.x && pr.y < t.y + t.h && pr.y + pr.h > t.y;
      if (overlap) { damagePlayer(); break; }
    }
  }

  /* --- Portais de classificação (final) --- */
  checkGates();

  /* --- Portal de saída --- */
  if (lv.portal.open && !Game.completedOnce && dist(p.x, p.y, lv.portal.x, lv.portal.y) < 28) {
    Game.completedOnce = true;
    completeLevel();
    return;
  }

  /* --- Partículas --- */
  updateParticles(dt);

  if (shakeTime > 0) { shakeTime -= dt; if (shakeTime <= 0) shakeAmt = 0; }
}

function damagePlayer() {
  const p = Game.player;
  Game.run.lives--;
  Game.run.deaths++;
  p.invuln = 2.5;
  AudioSys.sfx('hurt');
  shake(12);
  burst(p.x, p.y, '#ff5d6c');
  spawnFloater(p.x, p.y - 20, '-1 vida');
  updateHudLives();
  if (Game.run.lives <= 0) {
    gameOver();
  }
}

function updateParticles(dt) {
  for (let i = Game.particles.length - 1; i >= 0; i--) {
    const pt = Game.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += (pt.g || 0) * dt;
    pt.life -= dt;
    if (pt.life <= 0) Game.particles.splice(i, 1);
  }
  for (let i = Game.floaters.length - 1; i >= 0; i--) {
    const f = Game.floaters[i];
    f.y -= 40 * dt;
    f.life -= dt;
    if (f.life <= 0) Game.floaters.splice(i, 1);
  }
}

function emitParticle(x, y, vx, vy, color, life, size) {
  Game.particles.push({ x, y, vx, vy, color, life, maxLife: life, size: size || 2, g: 0 });
}

function burst(x, y, color, n) {
  const count = n || 14;
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(20, 90);
    emitParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, color, rand(0.3, 0.8), rand(2, 4));
  }
}

function spawnFloater(x, y, text) {
  Game.floaters.push({ x, y, text, life: 1.2 });
}

/* =====================================================================
   12. RENDERIZAÇÃO (CANVAS)
===================================================================== */
let camX = 0, camY = 0;

function computeCamera() {
  const lv = Game.level;
  if (!lv) return;
  const worldW = lv.g.w * TILE;
  const worldH = lv.g.h * TILE;
  camX = clamp(Game.player.x - VIEW_W / 2, 0, worldW - VIEW_W);
  camY = clamp(Game.player.y - VIEW_H / 2, 0, worldH - VIEW_H);
}

function drawBackground() {
  const lv = Game.level;
  const th = lv.theme;
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, th.sky1);
  grad.addColorStop(1, th.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  /* Estrelas com parallax */
  const seed = lv.particlesSeed;
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 137 + seed) % VIEW_W);
    const sy = ((i * 89 + seed * 3) % VIEW_H);
    const px = ((sx - camX * 0.2) % VIEW_W + VIEW_W) % VIEW_W;
    const py = ((sy - camY * 0.2) % VIEW_H + VIEW_H) % VIEW_H;
    ctx.fillStyle = i % 7 === 0 ? '#ffd166' : '#ffffff';
    ctx.globalAlpha = 0.3 + (i % 5) * 0.12;
    ctx.fillRect(px, py, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;

  /* Planeta de fundo */
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = th.planet;
  ctx.beginPath();
  ctx.arc(VIEW_W - 80, 50, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(VIEW_W - 96, 38, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawTiles() {
  const lv = Game.level;
  const th = lv.theme;
  const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + VIEW_W) / TILE);
  const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + VIEW_H) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const cell = lv.g.get(tx, ty);
      const dx = tx * TILE - camX;
      const dy = ty * TILE - camY;
      if (cell === '.') {
        ctx.fillStyle = ((tx + ty) % 2 === 0) ? th.floor : th.floorAlt;
        ctx.fillRect(dx, dy, TILE, TILE);
      } else if (cell === '#') {
        ctx.fillStyle = th.wall;
        ctx.fillRect(dx, dy, TILE, TILE);
        ctx.fillStyle = th.wallTop;
        ctx.fillRect(dx, dy, TILE, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(dx, dy + TILE - 4, TILE, 4);
      }
    }
  }
}

function drawWires() {
  const lv = Game.level;
  if (!lv.lv.wires) return;
  ctx.strokeStyle = '#8a6a33';
  ctx.lineWidth = 4;
  for (const [x0, y0, x1, y1] of lv.lv.wires) {
    ctx.beginPath();
    ctx.moveTo(x0 * TILE - camX, y0 * TILE - camY);
    ctx.lineTo(x1 * TILE - camX, y1 * TILE - camY);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

function drawElementOrb(el, x, y, t, alpha) {
  const e = ELEMENTS[el];
  ctx.save();
  ctx.globalAlpha = alpha || 1;

  /* Glow */
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 14;

  /* Núcleo */
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x - 3, y - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  /* Anel orbital */
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 17, 6, t * 1.4, 0, Math.PI * 2);
  ctx.stroke();

  /* Elétrons no anel */
  const nEl = Math.max(1, e.valence);
  for (let i = 0; i < nEl; i++) {
    const a = t * 1.4 + (i / nEl) * Math.PI * 2;
    const ex = x + Math.cos(a) * 17;
    const ey = y + Math.sin(a) * 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Símbolo */
  ctx.fillStyle = '#0c1226';
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e.symbol, x, y + 0.5);

  ctx.restore();
}

function drawCrystals() {
  const lv = Game.level;
  const t = performance.now() / 1000;
  for (const c of lv.crystals) {
    if (c.taken) continue;
    const bob = Math.sin(t * 2 + c.t) * 3;
    drawElementOrb(c.el, c.x - camX, c.y - camY + bob, t + c.t);
  }
}

function drawHazards() {
  const lv = Game.level;
  const t = performance.now() / 1000;
  for (const h of lv.hazards) {
    const dx = h.x - camX;
    const dy = h.y - camY;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(h.rot);
    ctx.fillStyle = '#8a7f74';
    ctx.strokeStyle = '#5f574e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = h.r * (0.85 + Math.abs(Math.sin(i * 2.7 + h.rot)) * 0.3);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Armadilhas elétricas */
  for (const tr of lv.traps) {
    const active = tr.t < tr.activeDur;
    const warn = !active && tr.t > tr.cycle - 0.5;
    const dx = tr.x - camX;
    const dy = tr.y - camY;
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(dx, dy, tr.w, tr.h);
    ctx.fillStyle = warn ? '#fff3a0' : (active ? '#ffe14d' : '#6b5a20');
    ctx.fillRect(dx + 2, dy + 2, tr.w - 4, tr.h - 4);
    if (active) {
      ctx.shadowColor = '#ffe14d';
      ctx.shadowBlur = 8;
      const fl = Math.sin(t * 20) * 2;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      for (let z = 6; z < tr.w - 4; z += 12) {
        ctx.beginPath();
        ctx.moveTo(dx + z, dy + 2);
        ctx.lineTo(dx + z + 4 + fl, dy + tr.h - 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  }
}

function drawMachines() {
  const lv = Game.level;
  const m = lv.machine;
  const dx = m.x - camX;
  const dy = m.y - camY;
  const recipe = currentRecipe();
  const type = lv.lv.machine.type;

  ctx.save();
  ctx.translate(dx, dy);

  if (type === 'furnace') {
    ctx.fillStyle = '#3d2a44';
    ctx.fillRect(-22, -20, 44, 40);
    ctx.fillStyle = '#2a1c30';
    ctx.fillRect(-16, -12, 32, 32);
    ctx.fillStyle = lv.portal.open ? '#ff9df2' : '#ff6b6b';
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#6b3d78';
    ctx.fillRect(-24, -26, 48, 8);
    /* Chaminé */
    ctx.fillStyle = '#3d2a44';
    ctx.fillRect(14, -34, 10, 14);
  } else if (type === 'assembler') {
    ctx.fillStyle = '#1f4a6b';
    ctx.fillRect(-24, -18, 48, 36);
    ctx.fillStyle = '#2f6a96';
    ctx.fillRect(-18, -12, 36, 24);
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = '#7ff5ff';
      ctx.fillRect(i * 14 - 4, -6, 8, 8);
    }
    ctx.fillStyle = '#1f4a6b';
    ctx.fillRect(-8, -28, 16, 8);
  } else if (type === 'core') {
    ctx.fillStyle = '#5a4630';
    ctx.fillRect(-18, -26, 36, 52);
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(-12, -20, 24, 40);
    const lit = Math.min(lv.lv.recipes.length, Game.recipeIndex);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lit ? '#5dffa6' : '#2a2010';
      ctx.shadowColor = '#5dffa6';
      ctx.shadowBlur = i < lit ? 8 : 0;
      ctx.fillRect(-8, -14 + i * 14, 16, 6);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7a5f40';
    ctx.fillRect(-20, 26, 40, 6);
  } else if (type === 'reactor') {
    ctx.fillStyle = '#3a2a6b';
    ctx.fillRect(-22, -22, 44, 44);
    ctx.fillStyle = '#1c1433';
    ctx.fillRect(-16, -16, 32, 32);
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    ctx.shadowColor = '#c8a2ff';
    ctx.shadowBlur = 16 * pulse;
    ctx.fillStyle = '#c8a2ff';
    ctx.beginPath();
    ctx.arc(0, 0, 9 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5440a0';
    ctx.fillRect(-26, -28, 52, 6);
  }

  /* Painel do desafio atual */
  ctx.fillStyle = 'rgba(4,8,22,0.9)';
  ctx.fillRect(-38, 30, 76, 24);
  ctx.strokeStyle = lv.theme.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(-38, 30, 76, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (recipe) {
    ctx.fillText(recipe.formula, 0, 38);
    ctx.fillStyle = '#9fb0d8';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('montar', 0, 49);
  } else {
    ctx.fillText('✓ CONCLUÍDO', 0, 42);
  }
  ctx.restore();

  /* Indicador de interação (pisca) */
  const hint = document.getElementById('interact-hint');
  if (dist(Game.player.x, Game.player.y, m.x, m.y) < 64 && !Game.locked) {
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }
}

function drawGates() {
  const lv = Game.level;
  if (!lv.gates) return;
  const t = performance.now() / 1000;
  for (const g of lv.gates) {
    const dx = g.x - camX;
    const dy = g.y - camY;
    const color = g.done ? '#5dffa6' : COL_BOND[g.type];
    ctx.globalAlpha = g.done ? 0.75 : 1;

    /* Arco */
    ctx.fillStyle = 'rgba(10,14,40,0.9)';
    ctx.fillRect(dx, dy + g.h - 16, g.w, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dx + 3, dy + g.h);
    ctx.lineTo(dx + 3, dy + 14);
    ctx.arc(dx + g.w / 2, dy + 14, g.w / 2 - 3, Math.PI, 0);
    ctx.lineTo(dx + g.w - 3, dy + g.h);
    ctx.stroke();

    /* Portal interior */
    if (!g.done) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 + Math.sin(t * 4) * 4;
    }
    ctx.fillStyle = g.done ? 'rgba(93,255,166,0.35)' : color;
    ctx.globalAlpha = g.done ? 0.5 : 0.45 + 0.2 * Math.sin(t * 4);
    ctx.beginPath();
    ctx.ellipse(dx + g.w / 2, dy + g.h - 8, g.w / 2 - 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Rótulo */
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BOND_NAME[g.type], dx + g.w / 2, dy + 8);
    ctx.fillStyle = '#9fb0d8';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('Ligação', dx + g.w / 2, dy + 19);
  }
  ctx.globalAlpha = 1;
}

function drawPortal() {
  const lv = Game.level;
  const t = performance.now() / 1000;
  const dx = lv.portal.x - camX;
  const dy = lv.portal.y - camY;
  const open = lv.portal.open;

  ctx.fillStyle = '#0c1226';
  ctx.fillRect(dx - 26, dy - 30, 52, 60);
  ctx.strokeStyle = '#2d3a75';
  ctx.lineWidth = 4;
  ctx.strokeRect(dx - 26, dy - 30, 52, 60);

  if (open) {
    ctx.shadowColor = '#7ff5ff';
    ctx.shadowBlur = 16;
    const grad = ctx.createLinearGradient(dx - 18, 0, dx + 18, 0);
    grad.addColorStop(0, '#59d3ff');
    grad.addColorStop(1, '#7ff5ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dx, dy, 16 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    /* Anel giratório */
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 20, 8, t, 0, Math.PI * 2);
    ctx.stroke();
    if (chance(0.25)) emitParticle(dx + rand(-14, 14), dy + rand(-14, 14), rand(-20, 20), rand(-30, 0), '#7ff5ff', 0.6, 2);
  } else {
    ctx.fillStyle = '#2d3a75';
    ctx.fillRect(dx - 18, dy - 18, 36, 36);
    ctx.fillStyle = '#1a2248';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', dx, dy + 1);
  }
}

function drawPlayer() {
  const p = Game.player;
  const eqH = getEquippedItem('helmet');
  const eqS = getEquippedItem('suit');
  const pal = astronautPalette(eqH, eqS);
  const sc = 2;
  const sz = spriteSize(SPRITES.astronaut, sc);

  ctx.save();
  if (p.invuln > 0 && Math.floor(performance.now() / 100) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  drawSprite(ctx, SPRITES.astronaut, Math.round(p.x - camX) - sz.w / 2, Math.round(p.y - camY) - sz.h / 2 + 2, sc, pal);
  ctx.restore();
}

function drawParticles() {
  for (const pt of Game.particles) {
    ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x - camX - pt.size / 2), Math.round(pt.y - camY - pt.size / 2), pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloaters() {
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of Game.floaters) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(f.text, f.x - camX, f.y - camY);
  }
  ctx.globalAlpha = 1;
}

function drawGatePanel() {
  const lv = Game.level;
  if (!lv.gates || !lv.gates.length || !lv.lv.gateSequence) return;
  const seq = lv.lv.gateSequence;
  const panel = document.getElementById('gate-panel');
  if (Game.gateIndex < seq.length) {
    const cur = seq[Game.gateIndex];
    panel.hidden = false;
    panel.innerHTML = '<div class="gp-q">Qual ligação é <strong>' + cur.formula + '</strong>?</div>' +
      '<div class="gp-label">Atravesse o portal correto (porta ' + (Game.gateIndex + 1) + ' de ' + seq.length + ')</div>';
  } else {
    panel.hidden = true;
  }
}

/* --- Animação de montagem de composto (ensina pela mecânica) --- */
function drawBuildAnim() {
  const a = Game.buildAnim;
  if (!a) return;
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2 + 10;
  const prog = clamp(a.t / a.dur, 0, 1);
  const r = a.recipe;

  ctx.fillStyle = 'rgba(3,5,15,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const elements = Object.keys(r.atoms);

  if (a.kind === 'ionic' || a.kind === 'reactor') {
    const metal = elements.find(e => ELEMENTS[e].type === 'metal');
    const ametal = elements.find(e => ELEMENTS[e].type === 'ametal');
    const sep = lerp(70, 6, easeInOut(prog));
    const mX = cx - sep, aX = cx + sep;

    drawElementOrb(metal, mX, cy, a.t, 1);
    drawElementOrb(ametal, aX, cy, a.t + 1, 1);

    /* Elétron sendo transferido (metal → ametal) */
    if (prog > 0.25 && prog < 0.8) {
      const tp = easeInOut((prog - 0.25) / 0.55);
      const ex = lerp(mX + 12, aX - 12, tp);
      ctx.shadowColor = '#ffe14d';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath();
      ctx.arc(ex, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* Íons e retículo */
    if (prog > 0.7) {
      ctx.fillStyle = '#ff5d6c';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ELEMENTS[metal].ion, mX - 16, cy - 16);
      ctx.fillStyle = '#59d3ff';
      ctx.fillText(ELEMENTS[ametal].ion, aX + 16, cy - 16);
    }
    if (prog > 0.85) {
      drawCrystal(cx, cy + 30, r.formula);
    }
  } else if (a.kind === 'covalent') {
    /* Átomos se aproximam e compartilham elétrons */
    const spread = elements.length === 3 ? 52 : 64;
    elements.forEach((el, i) => {
      const ang = (i / elements.length) * Math.PI * 2;
      const targetX = cx + Math.cos(ang) * spread;
      const targetY = cy + Math.sin(ang) * spread * 0.5;
      const sep = 90;
      const x = lerp(cx + Math.cos(ang) * sep, targetX, easeInOut(prog));
      const y = lerp(cy + Math.sin(ang) * sep * 0.5, targetY, easeInOut(prog));
      drawElementOrb(el, x, y, a.t + i, 1);
    });

    /* Elétrons compartilhados (luz central) */
    if (prog > 0.6) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + (prog - 0.6) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (prog > 0.85) {
      drawCrystal(cx, cy + 44, r.formula);
    }
  } else if (a.kind === 'metallic') {
    const metal = elements[0];
    /* Lingote desliza para dentro da máquina */
    const ingotX = lerp(cx - 90, cx, easeInOut(prog));
    ctx.fillStyle = ELEMENTS[metal].color;
    ctx.fillRect(ingotX - 12, cy - 10, 24, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ingotX - 12, cy - 10, 24, 20);

    /* Mar de elétrons fluindo */
    if (prog > 0.4) {
      for (let i = 0; i < 8; i++) {
        const tx = ((i / 8 + prog * 2) % 1);
        const ex = cx - 100 + tx * 200;
        const ey = cy + 26;
        ctx.shadowColor = '#ffe14d';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    if (prog > 0.85) {
      drawCrystal(cx, cy - 40, r.formula);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(chem(r.formula), cx, cy - 66);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = '#9fb0d8';
  ctx.fillText('Montando ' + r.name + '...', cx, cy + 70);
}

/* Cristal formado (produto da reação) */
function drawCrystal(dx, dy, formula) {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#8fd9ff';
  ctx.fillRect(-10, -10, 20, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-10, -10, 20, 6);
  ctx.strokeStyle = '#2b6f9e';
  ctx.lineWidth = 2;
  ctx.strokeRect(-10, -10, 20, 20);
  ctx.restore();
  ctx.fillStyle = '#0c1226';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(chem(formula), dx, dy + 1);
}

function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function render() {
  const lv = Game.level;
  if (!lv) return;
  computeCamera();
  ctx.save();
  if (shakeAmt > 0) {
    ctx.translate(rand(-shakeAmt, shakeAmt), rand(-shakeAmt, shakeAmt));
  }
  drawBackground();
  drawTiles();
  drawWires();
  drawCrystals();
  drawGates();
  drawMachines();
  drawPortal();
  drawHazards();
  drawPlayer();
  drawParticles();
  drawFloaters();
  if (Game.buildAnim) drawBuildAnim();
  ctx.restore();
  drawGatePanel();
}

/* =====================================================================
   13. INTERFACE (MENUS, HUD, OVERLAYS)
===================================================================== */
const screens = {};
document.querySelectorAll('.screen').forEach(s => { screens[s.id.replace('screen-', '')] = s; });

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = screens[name];
  if (el) el.classList.add('active');
  Game.screen = name;

  if (name === 'galaxy') renderGalaxy();
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'achievements') renderAchievements();
  if (name === 'menu') updateSoundButton();

  updateTouchUI();
  updateRotateHint();

  document.getElementById('pause').hidden = true;
  document.getElementById('feedback').hidden = true;
  document.getElementById('reward').hidden = true;
  document.getElementById('intro-card').hidden = true;

  window.scrollTo(0, 0);
}

function navTo(nav) {
  AudioSys.sfx('click');
  if (nav === 'menu' && Game.screen === 'game') {
    exitToMenu();
    return;
  }
  showScreen(nav);
}

function exitToMenu() {
  Game.level = null;
  Game.buildAnim = null;
  Game.feedback = null;
  Game.locked = false;
  pauseShown = false;
  document.getElementById('pause').hidden = true;
  document.getElementById('feedback').hidden = true;
  document.getElementById('reward').hidden = true;
  document.getElementById('victory').hidden = true;
  document.getElementById('defeat').hidden = true;
  showScreen('menu');
}

function getItemById(id) {
  for (const c of CATS) {
    const it = COSMETICS[c].find(i => i.id === id);
    if (it) return it;
  }
  return null;
}

function getEquippedItem(catKey) {
  const id = Save.data.equipped[catKey];
  const item = getItemById(id);
  return item || COSMETICS[catKey][0];
}

function isUnlocked(id) {
  const item = getItemById(id);
  if (!item) return false;
  if (Save.hasItem(id)) return true;
  if (item.unlock === 'start') return true;
  if (item.unlock.startsWith('level:')) {
    const idx = parseInt(item.unlock.split(':')[1], 10);
    return Save.data.completed[idx];
  }
  if (item.unlock.startsWith('ach:')) {
    return Save.hasAch(item.unlock.split(':')[1]);
  }
  return false;
}

function unlockReason(id) {
  const item = getItemById(id);
  if (item.unlock === 'start') return 'Inicial';
  if (item.unlock.startsWith('level:')) {
    const idx = parseInt(item.unlock.split(':')[1], 10);
    return 'Complete: ' + LEVELS[idx].name;
  }
  if (item.unlock.startsWith('ach:')) {
    const a = ACHIEVEMENTS.find(x => x.id === item.unlock.split(':')[1]);
    return a ? 'Conquista: ' + a.name : '';
  }
  return '';
}

function unlockItemWithPopup(id) {
  if (!id || Save.hasItem(id)) return false;
  Save.unlockItem(id);
  AudioSys.sfx('unlock');
  const item = getItemById(id);
  showReward(item);
  return true;
}

function showReward(item) {
  document.getElementById('reward-title').textContent = 'Item Desbloqueado!';
  document.getElementById('reward-name').textContent = item.name;
  document.getElementById('reward-type').textContent = item.cat + ' · Vestiário';
  const icon = document.getElementById('reward-icon');
  icon.innerHTML = '';
  const c = document.createElement('canvas');
  c.width = 48; c.height = 48;
  const g = c.getContext('2d');
  drawItemIcon(g, item);
  icon.appendChild(c);
  document.getElementById('reward').hidden = false;
  pendingRewardItem = item;
}

/* --- HUD --- */
function updateHudScore() { document.getElementById('hud-score').textContent = Game.run.score; }
function updateHudLives() {
  const el = document.getElementById('hud-lives');
  el.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const s = document.createElement('span');
    s.textContent = '❤';
    if (i >= Game.run.lives) s.className = 'life-off';
    el.appendChild(s);
  }
}
function updateHudTime() {
  document.getElementById('hud-time').textContent = fmtTime(Game.levelTime);
}
function updateHudProgress() {
  const done = Game.run.completed.filter(Boolean).length;
  document.getElementById('hud-progress').style.width = (done / LEVELS.length * 100) + '%';
}

function updateObjectiveHud() {
  const lv = Game.level;
  if (!lv) return;
  const el = document.getElementById('hud-objective');
  const recipes = lv.lv.recipes;
  let html = '';
  recipes.forEach((rid, i) => {
    const ok = i < Game.recipeIndex;
    html += '<span class="' + (ok ? 'ok' : 'todo') + '">' + (ok ? '✓ ' : '') + chem(RECIPES[rid].formula) + '</span> ';
  });
  if (lv.lv.gateSequence) {
    const total = lv.lv.gateSequence.length;
    html += '· portais ' + Math.min(Game.gateIndex, total) + '/' + total;
  }
  el.innerHTML = 'Objetivo: ' + html.trim();

  /* Inventário de átomos */
  const invEl = document.getElementById('hud-inventory');
  if (invEl) {
    const keys = Object.keys(Game.inventory).filter(k => Game.inventory[k] > 0);
    invEl.textContent = keys.length ? 'Cristais: ' + keys.map(k => ELEMENTS[k].symbol + '×' + Game.inventory[k]).join(' ') : '';
  }
}

/* --- Mapa da galáxia --- */
let selectedPlanet = 0;
function renderGalaxy() {
  const track = document.getElementById('galaxy-track');
  track.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const done = Save.data.completed[i];
    const unlocked = i === 0 || Save.data.completed[i - 1];
    const btn = document.createElement('button');
    btn.className = 'planet-btn' + (i === selectedPlanet ? ' selected' : '');
    btn.disabled = !unlocked;
    btn.setAttribute('role', 'option');
    btn.innerHTML =
      '<div class="planet-dot" style="background:radial-gradient(circle at 35% 35%, ' + lv.planetColor + ', #1a1030);"></div>' +
      '<div class="planet-name">' + lv.name + '</div>' +
      '<div class="planet-status' + (done ? ' done' : '') + '">' + (done ? '★ Restaurado' : (unlocked ? 'Disponível' : 'Bloqueado')) + '</div>' +
      (unlocked ? '' : '<div class="lock">🔒</div>');
    btn.addEventListener('click', () => {
      selectedPlanet = i;
      renderGalaxy();
      AudioSys.sfx('click');
    });
    track.appendChild(btn);
  });

  /* Preview da nave equipada */
  const c = document.getElementById('ship-preview-canvas');
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  const ship = getEquippedItem('ship');
  const pal = { G: ship.main, V: '#7ff5ff', W: '#0c1226', F: '#ff7a3d' };
  drawSprite(g, SPRITES.ship, (c.width - 42) / 2, 22, 3, pal);
}

function startSelectedLevel() {
  startLevel(selectedPlanet);
}

/* --- Vestiário --- */
let wardrobeCat = 'helmets';
function renderWardrobe() {
  const grid = document.getElementById('wardrobe-grid');
  grid.innerHTML = '';
  COSMETICS[wardrobeCat].forEach(item => {
    const unlocked = isUnlocked(item.id);
    const equipped = Save.data.equipped[wardrobeCat] === item.id;
    const card = document.createElement('button');
    card.className = 'item-card' + (equipped ? ' equipped' : '') + (unlocked ? '' : ' locked');
    card.disabled = !unlocked;
    const icon = document.createElement('div');
    icon.className = 'item-icon';
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    drawItemIcon(c.getContext('2d'), item);
    icon.appendChild(c);
    card.appendChild(icon);
    card.appendChild(document.createElement('div'));
    card.lastChild.className = 'item-name';
    card.lastChild.textContent = item.name;
    const sub = document.createElement('div');
    sub.className = unlocked ? (equipped ? 'item-owner' : 'item-sub') : 'item-locked-hint';
    sub.textContent = equipped ? '✓ Equipado' : (unlocked ? item.cat : '🔒 ' + unlockReason(item.id));
    card.appendChild(sub);
    if (unlocked) {
      card.addEventListener('click', () => {
        Save.data.equipped[wardrobeCat] = item.id;
        Save.save();
        AudioSys.sfx('click');
        renderWardrobe();
        drawWardrobePreview();
      });
    }
    grid.appendChild(card);
  });
  drawWardrobePreview();
}

function drawWardrobePreview() {
  const c = document.getElementById('wardrobe-canvas');
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  const eqH = getEquippedItem('helmet');
  const eqS = getEquippedItem('suit');
  const pal = astronautPalette(eqH, eqS);
  drawSprite(g, SPRITES.astronaut, (c.width - 48) / 2, 16, 4, pal);
  const info = document.getElementById('wardrobe-info');
  info.innerHTML = '<strong>' + eqS.name + '</strong><br>Capacete: ' + eqH.name +
    '<br>Nave: ' + getEquippedItem('ship').name + '<br>Rastro: ' + getEquippedItem('trail').name;
}

/* Ícone do item (usado no vestiário e no popup de recompensa) */
function drawItemIcon(g, item) {
  const cat = item.catName || CATS.find(c => COSMETICS[c].some(i => i.id === item.id)) || 'helmets';
  if (cat === 'helmets') {
    drawSprite(g, SPRITES.astronaut, 8, 8, 2, { H: item.main, V: item.visor, D: '#0c1226', S: '#3a4a72', W: '#fff' });
  } else if (cat === 'suits') {
    drawSprite(g, SPRITES.astronaut, 8, 8, 2, { H: '#2b6f9e', V: '#7ff5ff', D: '#0c1226', S: item.main, W: '#fff' });
  } else if (cat === 'ships') {
    drawSprite(g, SPRITES.ship, 7, 8, 2, { G: item.main, V: '#7ff5ff', W: '#0c1226', F: '#ff7a3d' });
  } else if (cat === 'trails') {
    const color = item.color || '#9fb0d8';
    g.fillStyle = '#0c1226';
    g.fillRect(0, 0, 40, 40);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = color;
      g.globalAlpha = 1 - i / 8;
      g.fillRect(6 + i * 5, 14 + (i % 3) * 3, 4, 4);
    }
    g.globalAlpha = 1;
  }
}

/* --- Conquistas --- */
function renderAchievements() {
  const grid = document.getElementById('achieve-grid');
  grid.innerHTML = '';
  let unlocked = 0;
  ACHIEVEMENTS.forEach(a => {
    const got = Save.hasAch(a.id);
    if (got) unlocked++;
    const card = document.createElement('div');
    card.className = 'achieve-card' + (got ? '' : ' locked');
    card.innerHTML =
      '<div class="achieve-icon">' + (got ? '★' : '·') + '</div>' +
      '<div><div class="achieve-name">' + a.name + '</div><div class="achieve-desc">' + a.desc + '</div></div>';
    grid.appendChild(card);
  });
  document.getElementById('achievement-count').textContent =
    unlocked + ' de ' + ACHIEVEMENTS.length + ' conquistas desbloqueadas';
}

/* --- Toast de conquista --- */
let toastTimer = null;
function showToast(title, desc) {
  const t = document.getElementById('toast');
  t.innerHTML = '<strong>★ ' + title + '</strong>' + (desc ? '<br>' + desc : '');
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.hidden = true; }, 400);
  }, 3200);
}

function unlockAchievement(id, silent) {
  if (Save.hasAch(id)) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  Save.unlockAch(id);
  Game.run.score += ACH_BONUS[id] || 0;
  if (silent) {
    if (a.reward) Save.unlockItem(a.reward);
  } else {
    showToast(a.name, a.desc);
  }
  updateHudScore();
}

/* --- Início de fase --- */
function startLevel(idx) {
  Game.levelIndex = idx;
  Game.replay = !!(Game.run.active && Game.run.completed[idx]);
  Game.level = buildLevel(idx);
  Game.player = createPlayer(Game.level.lv.spawn.x * TILE + TILE / 2, Game.level.lv.spawn.y * TILE + TILE / 2);
  Game.inventory = {};
  Game.recipeIndex = 0;
  Game.gateIndex = 0;
  Game.levelTime = 0;
  Game.buildAnim = null;
  Game.feedback = null;
  Game.locked = true;
  Game.completedOnce = false;
  Game.particles = [];
  Game.floaters = [];

  if (!Game.run.active) {
    Game.resetRun();
    Game.run.active = true;
  }

  showScreen('game');
  updateHudScore();
  updateHudLives();
  updateHudTime();
  updateHudProgress();
  updateObjectiveHud();

  /* Cartão de introdução */
  const lv = Game.level;
  document.getElementById('intro-title').textContent = lv.lv.name;
  document.getElementById('intro-text').textContent = lv.lv.intro;
  document.getElementById('intro-hint').innerHTML = IS_TOUCH ? 'Toque para começar' : 'Aperte <kbd>ESPAÇO</kbd> para começar';
  document.getElementById('intro-planet').style.background =
    'radial-gradient(circle at 35% 35%, ' + lv.lv.planetColor + ', #1a1030)';
  const obj = document.getElementById('intro-objective');
  obj.innerHTML = '';
  lv.lv.recipes.forEach(rid => {
    const chip = document.createElement('span');
    chip.className = 'obj-chip';
    chip.innerHTML = 'Montar <span class="formula">' + chem(RECIPES[rid].formula) + '</span>';
    obj.appendChild(chip);
  });
  if (lv.lv.gateSequence) {
    const chip = document.createElement('span');
    chip.className = 'obj-chip';
    chip.textContent = 'Classificar ' + lv.lv.gateSequence.length + ' ligações';
    obj.appendChild(chip);
  }
  document.getElementById('intro-card').hidden = false;
}

function dismissIntro() {
  document.getElementById('intro-card').hidden = true;
  Game.locked = false;
}

/* --- Conclusão de fase --- */
function completeLevel() {
  const idx = Game.levelIndex;
  const lv = LEVELS[idx];
  const firstTime = !Game.run.completed[idx];

  if (firstTime) {
    /* Bônus de tempo: até +600 (fase < 2 min) */
    const timeBonus = Math.max(0, Math.floor(120 - Game.levelTime)) * 5;
    Game.run.score += 200 + timeBonus;
    updateHudScore();

    Game.run.completed[idx] = true;
    Save.data.completed[idx] = true;
    unlockAchievement(ACHIEVEMENT_PER_LEVEL[idx], true);
    if (idx === IONIC_INDEX) unlockAchievement('ionic_expert', true);
  }

  if (Game.run.score > Save.data.bestScore) Save.data.bestScore = Game.run.score;
  Save.save();
  updateHudProgress();

  if (idx === FINAL_INDEX) {
    finishGame();
    return;
  }

  if (!firstTime) {
    showScreen('galaxy');
    return;
  }

  /* Recompensa do planeta */
  selectedPlanet = Math.min(idx + 1, LEVELS.length - 1);
  if (unlockItemWithPopup(LEVEL_REWARDS[idx])) {
    pendingLevelComplete = true;
  } else {
    showScreen('galaxy');
  }
}

/* --- Fim do jogo (vitória) --- */
function finishGame() {
  AudioSys.sfx('victory');

  /* Conquistas finais */
  if (Game.run.deaths === 0) unlockAchievement('flawless', true);
  if (Game.run.wrong === 0) unlockAchievement('perfect', true);
  if (Game.run.time < 15 * 60) unlockAchievement('speedrun', true);
  if (allCosmetics().every(c => c.unlock === 'ach:collector' || isUnlocked(c.id))) unlockAchievement('collector', true);

  /* Recompensa final (Capacete Dourado) */
  if (!Save.hasItem('h_gold')) {
    Save.unlockItem('h_gold');
    showToast('Item Desbloqueado', 'Capacete Dourado adicionado ao Vestiário!');
  }

  Save.data.bestScore = Math.max(Save.data.bestScore, Game.run.score);
  Save.save();

  const title = document.getElementById('victory-title');
  title.textContent = '🌌 Galáxia Restaurada!';

  const stats = document.getElementById('victory-stats');
  stats.innerHTML =
    'Pontuação final: <strong>' + Game.run.score + '</strong><br>' +
    'Tempo total: <strong>' + fmtTime(Game.run.time) + '</strong><br>' +
    'Compostos montados: <strong>10</strong> · Erros: <strong>' + Game.run.wrong + '</strong> · Vidas perdidas: <strong>' + Game.run.deaths + '</strong>';

  const achEl = document.getElementById('victory-achievements');
  achEl.innerHTML = '';
  ['flawless', 'perfect', 'speedrun', 'collector'].forEach(id => {
    if (Save.hasAch(id)) {
      const tag = document.createElement('span');
      tag.className = 'ach-tag';
      tag.textContent = '★ ' + ACHIEVEMENTS.find(a => a.id === id).name;
      achEl.appendChild(tag);
    }
  });

  document.getElementById('victory').hidden = false;
}

/* --- Derrota --- */
function gameOver() {
  AudioSys.sfx('error');
  Game.locked = true;
  document.getElementById('defeat-stats').textContent =
    'Pontuação: ' + Game.run.score + ' · Tempo: ' + fmtTime(Game.levelTime);
  document.getElementById('defeat').hidden = false;
}

/* --- Pausa --- */
let pauseShown = false;
function togglePause() {
  if (Game.screen !== 'game') return;
  if (Game.feedback) return;
  if (document.getElementById('intro-card').hidden === false) return;
  if (document.getElementById('victory').hidden === false) return;
  if (document.getElementById('defeat').hidden === false) return;
  if (document.getElementById('reward').hidden === false) return;

  pauseShown = !pauseShown;
  document.getElementById('pause').hidden = !pauseShown;
  if (pauseShown) {
    document.getElementById('pause-stats').innerHTML =
      'Pontuação: <strong>' + Game.run.score + '</strong><br>' +
      'Tempo da fase: <strong>' + fmtTime(Game.levelTime) + '</strong><br>' +
      'Vidas: <strong>' + Game.run.lives + '</strong>';
  }
}

/* =====================================================================
   14. LOOP PRINCIPAL E INICIALIZAÇÃO
===================================================================== */
let lastTime = 0;
let pendingRewardItem = null;
let pendingLevelComplete = false;

function loop(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0);
  lastTime = t;
  update(dt);
  if (Game.screen === 'game' && Game.level) render();
  requestAnimationFrame(loop);
}

/* ---------- Inicialização de eventos ---------- */

/* Teclado */
window.addEventListener('keydown', e => {
  Input.keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();

  /* Bloqueio inicial do áudio (requisito do navegador) */
  AudioSys.unlock();

  /* Navegação de menus com teclado */
  if (Game.screen !== 'game') {
    if (e.code === 'Escape' && Game.screen !== 'menu') {
      showScreen('menu');
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
      const btns = Array.from(document.querySelectorAll('.screen.active .btn:not(:disabled)'));
      if (btns.length) {
        const cur = document.activeElement;
        const idx = btns.indexOf(cur);
        const dir = (e.code === 'ArrowDown' || e.code === 'ArrowRight') ? 1 : -1;
        const next = btns[(idx === -1 ? 0 : (idx + dir + btns.length) % btns.length)];
        next.focus();
      }
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      const cur = document.activeElement;
      if (cur && cur.tagName === 'BUTTON') { e.preventDefault(); cur.click(); }
    }
    return;
  }

  /* Em jogo */
  if (Game.screen === 'game') {
    if (e.code === 'Escape') { togglePause(); return; }

    if (Game.feedback) {
      if (e.code === 'Space' || e.code === 'Enter') closeFeedback();
      return;
    }
    if (document.getElementById('intro-card').hidden === false) {
      if (e.code === 'Space' || e.code === 'Enter') dismissIntro();
      return;
    }
    if (document.getElementById('pause').hidden === false) {
      if (e.code === 'Escape' || e.code === 'Space') togglePause();
      return;
    }
    if (Game.buildAnim) return;

    if (e.code === 'Space') {
      const lv = Game.level;
      if (lv && dist(Game.player.x, Game.player.y, lv.machine.x, lv.machine.y) < 64) {
        tryInteract();
      }
    }
  }
});

window.addEventListener('keyup', e => { Input.keys[e.code] = false; });

/* Mouse: interagir ao clicar perto da máquina */
canvas.addEventListener('pointerdown', e => {
  AudioSys.unlock();
  const lv = Game.level;
  if (!lv || Game.locked || Game.buildAnim || Game.feedback || Game.screen !== 'game') return;
  const rect = canvas.getBoundingClientRect();
  const wx = (e.clientX - rect.left) / rect.width * VIEW_W + camX;
  const wy = (e.clientY - rect.top) / rect.height * VIEW_H + camY;
  if (dist(wx, wy, lv.machine.x, lv.machine.y) < 64) {
    tryInteract();
  }
});

/* Toque: botões virtuais (mapeados para os mesmos códigos do teclado) */
const TOUCH_KEYMAP = {
  up: ['KeyW', 'ArrowUp'],
  left: ['KeyA', 'ArrowLeft'],
  down: ['KeyS', 'ArrowDown'],
  right: ['KeyD', 'ArrowRight']
};
document.querySelectorAll('.touch-controls button').forEach(b => {
  const t = b.dataset.t;
  const set = down => {
    AudioSys.unlock();
    const codes = TOUCH_KEYMAP[t] || [];
    for (const c of codes) {
      if (down) Input.touched[c] = true;
      else delete Input.touched[c];
    }
    if (t === 'interact' && down) {
      const lv = Game.level;
      if (lv && !Game.locked && dist(Game.player.x, Game.player.y, lv.machine.x, lv.machine.y) < 64) tryInteract();
    }
  };
  b.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
  b.addEventListener('pointerup', e => set(false));
  b.addEventListener('pointerleave', () => set(false));
  b.addEventListener('pointercancel', () => set(false));
  /* Fallback para navegadores antigos sem Pointer Events */
  b.addEventListener('touchstart', e => { e.preventDefault(); set(true); }, { passive: false });
  b.addEventListener('touchend', e => { e.preventDefault(); set(false); }, { passive: false });
  b.addEventListener('touchcancel', () => set(false));
});

/* ---------- Navegação dos botões do DOM ---------- */
document.querySelectorAll('[data-nav]').forEach(b => {
  b.addEventListener('click', () => navTo(b.dataset.nav));
});

/* Som */
function updateSoundButton() {
  const b = document.getElementById('btn-sound');
  if (AudioSys.sfxOn) b.textContent = '🔊 Som: Ligado';
  else b.textContent = '🔇 Som: Desligado';
}
document.getElementById('btn-sound').addEventListener('click', () => {
  AudioSys.init();
  AudioSys.setMusic(!AudioSys.musicOn);
  AudioSys.setSfx(!AudioSys.sfxOn);
  Save.data.musicOn = AudioSys.musicOn;
  Save.data.sfxOn = AudioSys.sfxOn;
  Save.save();
  updateSoundButton();
  AudioSys.sfx('click');
});

/* Vestiário: abas */
document.querySelectorAll('#wardrobe-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#wardrobe-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    wardrobeCat = tab.dataset.cat;
    renderWardrobe();
    AudioSys.sfx('click');
  });
});

/* Iniciar fase */
document.getElementById('btn-start-level').addEventListener('click', startSelectedLevel);

/* Overlays de jogo */
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
document.getElementById('btn-resume').addEventListener('click', () => { pauseShown = false; document.getElementById('pause').hidden = true; });
document.getElementById('btn-restart').addEventListener('click', () => {
  pauseShown = false;
  document.getElementById('pause').hidden = true;
  startLevel(Game.levelIndex);
});
document.getElementById('btn-exit-level').addEventListener('click', () => {
  pauseShown = false;
  exitToMenu();
});

/* Feedback: clicar fecha */
document.getElementById('feedback').addEventListener('click', () => { if (Game.feedback) closeFeedback(); });

/* Introdução: clicar dispensa */
document.getElementById('intro-card').addEventListener('click', () => {
  if (document.getElementById('intro-card').hidden === false && Game.locked) dismissIntro();
});

/* Recompensa */
document.getElementById('btn-equip-now').addEventListener('click', () => {
  if (pendingRewardItem) {
    const cat = pendingRewardItem.catName || CATS.find(c => COSMETICS[c].some(i => i.id === pendingRewardItem.id));
    Save.data.equipped[cat] = pendingRewardItem.id;
    Save.save();
  }
  document.getElementById('reward').hidden = true;
  AudioSys.sfx('click');
  if (pendingLevelComplete) {
    pendingLevelComplete = false;
    showScreen('galaxy');
  }
});
document.getElementById('btn-reward-continue').addEventListener('click', () => {
  document.getElementById('reward').hidden = true;
  AudioSys.sfx('click');
  if (pendingLevelComplete) {
    pendingLevelComplete = false;
    showScreen('galaxy');
  }
});

/* Vitória */
document.getElementById('btn-victory-menu').addEventListener('click', () => {
  document.getElementById('victory').hidden = true;
  Game.resetRun();
  exitToMenu();
});
document.getElementById('btn-victory-replay').addEventListener('click', () => {
  document.getElementById('victory').hidden = true;
  Game.resetRun();
  selectedPlanet = 0;
  startLevel(0);
});

/* Derrota */
document.getElementById('btn-defeat-retry').addEventListener('click', () => {
  document.getElementById('defeat').hidden = true;
  Game.run.lives = MAX_LIVES;
  startLevel(Game.levelIndex);
});
document.getElementById('btn-defeat-menu').addEventListener('click', () => {
  document.getElementById('defeat').hidden = true;
  Game.resetRun();
  exitToMenu();
});

/* ---------- Inicialização ---------- */
function init() {
  Save.load();
  AudioSys.musicOn = Save.data.musicOn;
  AudioSys.sfxOn = Save.data.sfxOn;
  updateSoundButton();
  fitCanvasScale();
  updateTouchUI();
  updateRotateHint();
  showScreen('menu');
  renderGalaxy();
  renderAchievements();
  selectedPlanet = Math.min(Math.max(Save.data.completed.indexOf(false), 0), LEVELS.length - 1);
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', init);

/* Redimensionamento / rotação de tela */
window.addEventListener('resize', () => {
  fitCanvasScale();
  updateRotateHint();
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    fitCanvasScale();
    updateRotateHint();
  });
}
window.addEventListener('orientationchange', () => {
  setTimeout(() => { fitCanvasScale(); updateRotateHint(); }, 200);
});

/* Evita zoom por duplo-toque e menu de contexto no canvas em mobile */
document.addEventListener('dblclick', e => {
  if (e.target && e.target.tagName === 'CANVAS') e.preventDefault();
});
document.addEventListener('contextmenu', e => {
  if (e.target && e.target.tagName === 'CANVAS') e.preventDefault();
});
