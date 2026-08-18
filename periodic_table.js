/* ============================================================
   TABELA PERIÓDICA INTERATIVA — Space Chemistry
   ------------------------------------------------------------
   118 elementos com dados completos, layout em grid CSS,
   painel ampliado do elemento selecionado.
   ============================================================ */
(function () {
  'use strict';

  var CLASSIFICATIONS = {
    'Hidrogênio':                { color: '#5a6a8a', label: 'Hidrogênio' },
    'Não metais':                { color: '#e8823a', label: 'Não metais' },
    'Gases nobres':              { color: '#9b6fd0', label: 'Gases nobres' },
    'Metais representativos':    { color: '#4caf78', label: 'Metais representativos' },
    'Metais de transição externos': { color: '#4a90c4', label: 'Metais de transição externos' },
    'Metais de transição internos': { color: '#c8a832', label: 'Metais de transição internos' }
  };

  /* row/col na tabela periódica (grid 18 colunas × 10 linhas) */
  var ELEMENTS = [
    { z:1,  s:'H',  n:'Hidrogênio',               e:'1',                                              c:'Hidrogênio',                    r:1, col:1 },
    { z:2,  s:'He', n:'Hélio',                     e:'2',                                              c:'Gases nobres',                  r:1, col:18 },
    { z:3,  s:'Li', n:'Lítio',                     e:'2, 1',                                          c:'Metais representativos',        r:2, col:1 },
    { z:4,  s:'Be', n:'Berílio',                   e:'2, 2',                                          c:'Metais representativos',        r:2, col:2 },
    { z:5,  s:'B',  n:'Boro',                      e:'2, 3',                                          c:'Não metais',                    r:2, col:13 },
    { z:6,  s:'C',  n:'Carbono',                   e:'2, 4',                                          c:'Não metais',                    r:2, col:14 },
    { z:7,  s:'N',  n:'Nitrogênio',                e:'2, 5',                                          c:'Não metais',                    r:2, col:15 },
    { z:8,  s:'O',  n:'Oxigênio',                  e:'2, 6',                                          c:'Não metais',                    r:2, col:16 },
    { z:9,  s:'F',  n:'Flúor',                     e:'2, 7',                                          c:'Não metais',                    r:2, col:17 },
    { z:10, s:'Ne', n:'Neônio',                    e:'2, 8',                                          c:'Gases nobres',                  r:2, col:18 },
    { z:11, s:'Na', n:'Sódio',                     e:'2, 8, 1',                                      c:'Metais representativos',        r:3, col:1 },
    { z:12, s:'Mg', n:'Magnésio',                  e:'2, 8, 2',                                      c:'Metais representativos',        r:3, col:2 },
    { z:13, s:'Al', n:'Alumínio',                  e:'2, 8, 3',                                      c:'Metais representativos',        r:3, col:13 },
    { z:14, s:'Si', n:'Silício',                   e:'2, 8, 4',                                      c:'Não metais',                    r:3, col:14 },
    { z:15, s:'P',  n:'Fósforo',                   e:'2, 8, 5',                                      c:'Não metais',                    r:3, col:15 },
    { z:16, s:'S',  n:'Enxofre',                   e:'2, 8, 6',                                      c:'Não metais',                    r:3, col:16 },
    { z:17, s:'Cl', n:'Cloro',                     e:'2, 8, 7',                                      c:'Não metais',                    r:3, col:17 },
    { z:18, s:'Ar', n:'Argônio',                   e:'2, 8, 8',                                      c:'Gases nobres',                  r:3, col:18 },
    { z:19, s:'K',  n:'Potássio',                  e:'2, 8, 8, 1',                                   c:'Metais representativos',        r:4, col:1 },
    { z:20, s:'Ca', n:'Cálcio',                    e:'2, 8, 8, 2',                                   c:'Metais representativos',        r:4, col:2 },
    { z:21, s:'Sc', n:'Escândio',                  e:'2, 8, 9, 2',                                   c:'Metais de transição externos',  r:4, col:3 },
    { z:22, s:'Ti', n:'Titânio',                   e:'2, 8, 10, 2',                                  c:'Metais de transição externos',  r:4, col:4 },
    { z:23, s:'V',  n:'Vanádio',                   e:'2, 8, 11, 2',                                  c:'Metais de transição externos',  r:4, col:5 },
    { z:24, s:'Cr', n:'Cromo',                     e:'2, 8, 13, 1',                                  c:'Metais de transição externos',  r:4, col:6 },
    { z:25, s:'Mn', n:'Manganês',                  e:'2, 8, 13, 2',                                  c:'Metais de transição externos',  r:4, col:7 },
    { z:26, s:'Fe', n:'Ferro',                     e:'2, 8, 14, 2',                                  c:'Metais de transição externos',  r:4, col:8 },
    { z:27, s:'Co', n:'Cobalto',                   e:'2, 8, 15, 2',                                  c:'Metais de transição externos',  r:4, col:9 },
    { z:28, s:'Ni', n:'Níquel',                    e:'2, 8, 16, 2',                                  c:'Metais de transição externos',  r:4, col:10 },
    { z:29, s:'Cu', n:'Cobre',                     e:'2, 8, 18, 1',                                  c:'Metais de transição externos',  r:4, col:11 },
    { z:30, s:'Zn', n:'Zinco',                     e:'2, 8, 18, 2',                                  c:'Metais de transição externos',  r:4, col:12 },
    { z:31, s:'Ga', n:'Gálio',                     e:'2, 8, 18, 3',                                  c:'Metais representativos',        r:4, col:13 },
    { z:32, s:'Ge', n:'Germânio',                  e:'2, 8, 18, 4',                                  c:'Não metais',                    r:4, col:14 },
    { z:33, s:'As', n:'Arsênio',                   e:'2, 8, 18, 5',                                  c:'Não metais',                    r:4, col:15 },
    { z:34, s:'Se', n:'Selênio',                   e:'2, 8, 18, 6',                                  c:'Não metais',                    r:4, col:16 },
    { z:35, s:'Br', n:'Bromo',                     e:'2, 8, 18, 7',                                  c:'Não metais',                    r:4, col:17 },
    { z:36, s:'Kr', n:'Criptônio',                 e:'2, 8, 18, 8',                                  c:'Gases nobres',                  r:4, col:18 },
    { z:37, s:'Rb', n:'Rubídio',                   e:'2, 8, 18, 8, 1',                               c:'Metais representativos',        r:5, col:1 },
    { z:38, s:'Sr', n:'Estrôncio',                 e:'2, 8, 18, 8, 2',                               c:'Metais representativos',        r:5, col:2 },
    { z:39, s:'Y',  n:'Ítrio',                     e:'2, 8, 18, 9, 2',                               c:'Metais de transição externos',  r:5, col:3 },
    { z:40, s:'Zr', n:'Zircônio',                  e:'2, 8, 18, 10, 2',                              c:'Metais de transição externos',  r:5, col:4 },
    { z:41, s:'Nb', n:'Nióbio',                    e:'2, 8, 18, 12, 1',                              c:'Metais de transição externos',  r:5, col:5 },
    { z:42, s:'Mo', n:'Molibdênio',                e:'2, 8, 18, 13, 1',                              c:'Metais de transição externos',  r:5, col:6 },
    { z:43, s:'Tc', n:'Tecnécio',                  e:'2, 8, 18, 13, 2',                              c:'Metais de transição externos',  r:5, col:7 },
    { z:44, s:'Ru', n:'Rutenio',                   e:'2, 8, 18, 15, 1',                              c:'Metais de transição externos',  r:5, col:8 },
    { z:45, s:'Rh', n:'Ródio',                     e:'2, 8, 18, 16, 1',                              c:'Metais de transição externos',  r:5, col:9 },
    { z:46, s:'Pd', n:'Paládio',                   e:'2, 8, 18, 18',                                 c:'Metais de transição externos',  r:5, col:10 },
    { z:47, s:'Ag', n:'Prata',                     e:'2, 8, 18, 18, 1',                              c:'Metais de transição externos',  r:5, col:11 },
    { z:48, s:'Cd', n:'Cádmio',                    e:'2, 8, 18, 18, 2',                              c:'Metais de transição externos',  r:5, col:12 },
    { z:49, s:'In', n:'Índio',                     e:'2, 8, 18, 18, 3',                              c:'Metais representativos',        r:5, col:13 },
    { z:50, s:'Sn', n:'Estanho',                   e:'2, 8, 18, 18, 4',                              c:'Metais representativos',        r:5, col:14 },
    { z:51, s:'Sb', n:'Antimônio',                 e:'2, 8, 18, 18, 5',                              c:'Não metais',                    r:5, col:15 },
    { z:52, s:'Te', n:'Telúrio',                   e:'2, 8, 18, 18, 6',                              c:'Não metais',                    r:5, col:16 },
    { z:53, s:'I',  n:'Iodo',                      e:'2, 8, 18, 18, 7',                              c:'Não metais',                    r:5, col:17 },
    { z:54, s:'Xe', n:'Xenônio',                   e:'2, 8, 18, 18, 8',                              c:'Gases nobres',                  r:5, col:18 },
    { z:55, s:'Cs', n:'Césio',                     e:'2, 8, 18, 18, 8, 1',                           c:'Metais representativos',        r:6, col:1 },
    { z:56, s:'Ba', n:'Bário',                     e:'2, 8, 18, 18, 8, 2',                           c:'Metais representativos',        r:6, col:2 },
    { z:57, s:'La', n:'Lantânio',                  e:'2, 8, 18, 18, 9, 2',                           c:'Metais de transição internos',  r:6, col:3 },
    { z:58, s:'Ce', n:'Cério',                     e:'2, 8, 18, 19, 9, 2',                           c:'Metais de transição internos',  r:9, col:4 },
    { z:59, s:'Pr', n:'Praseodímio',               e:'2, 8, 18, 21, 8, 2',                           c:'Metais de transição internos',  r:9, col:5 },
    { z:60, s:'Nd', n:'Neodímio',                  e:'2, 8, 18, 22, 8, 2',                           c:'Metais de transição internos',  r:9, col:6 },
    { z:61, s:'Pm', n:'Promécio',                  e:'2, 8, 18, 23, 8, 2',                           c:'Metais de transição internos',  r:9, col:7 },
    { z:62, s:'Sm', n:'Samário',                   e:'2, 8, 18, 24, 8, 2',                           c:'Metais de transição internos',  r:9, col:8 },
    { z:63, s:'Eu', n:'Európio',                   e:'2, 8, 18, 25, 8, 2',                           c:'Metais de transição internos',  r:9, col:9 },
    { z:64, s:'Gd', n:'Gadolínio',                 e:'2, 8, 18, 25, 9, 2',                           c:'Metais de transição internos',  r:9, col:10 },
    { z:65, s:'Tb', n:'Térbio',                    e:'2, 8, 18, 27, 8, 2',                           c:'Metais de transição internos',  r:9, col:11 },
    { z:66, s:'Dy', n:'Disprósio',                 e:'2, 8, 18, 28, 8, 2',                           c:'Metais de transição internos',  r:9, col:12 },
    { z:67, s:'Ho', n:'Holmium',                   e:'2, 8, 18, 29, 8, 2',                           c:'Metais de transição internos',  r:9, col:13 },
    { z:68, s:'Er', n:'Érbio',                     e:'2, 8, 18, 30, 8, 2',                           c:'Metais de transição internos',  r:9, col:14 },
    { z:69, s:'Tm', n:'Túlio',                     e:'2, 8, 18, 31, 8, 2',                           c:'Metais de transição internos',  r:9, col:15 },
    { z:70, s:'Yb', n:'Itérbio',                   e:'2, 8, 18, 32, 8, 2',                           c:'Metais de transição internos',  r:9, col:16 },
    { z:71, s:'Lu', n:'Lutécio',                   e:'2, 8, 18, 32, 9, 2',                           c:'Metais de transição internos',  r:9, col:17 },
    { z:72, s:'Hf', n:'Háfnio',                    e:'2, 8, 18, 32, 10, 2',                          c:'Metais de transição externos',  r:6, col:4 },
    { z:73, s:'Ta', n:'Tântalo',                   e:'2, 8, 18, 32, 11, 2',                          c:'Metais de transição externos',  r:6, col:5 },
    { z:74, s:'W',  n:'Tungstênio',                e:'2, 8, 18, 32, 12, 2',                          c:'Metais de transição externos',  r:6, col:6 },
    { z:75, s:'Re', n:'Rênio',                     e:'2, 8, 18, 32, 13, 2',                          c:'Metais de transição externos',  r:6, col:7 },
    { z:76, s:'Os', n:'Ósmio',                     e:'2, 8, 18, 32, 14, 2',                          c:'Metais de transição externos',  r:6, col:8 },
    { z:77, s:'Ir', n:'Irídio',                    e:'2, 8, 18, 32, 15, 2',                          c:'Metais de transição externos',  r:6, col:9 },
    { z:78, s:'Pt', n:'Platina',                   e:'2, 8, 18, 32, 17, 1',                          c:'Metais de transição externos',  r:6, col:10 },
    { z:79, s:'Au', n:'Ouro',                      e:'2, 8, 18, 32, 18, 1',                          c:'Metais de transição externos',  r:6, col:11 },
    { z:80, s:'Hg', n:'Mercúrio',                  e:'2, 8, 18, 32, 18, 2',                          c:'Metais de transição externos',  r:6, col:12 },
    { z:81, s:'Tl', n:'Tálio',                     e:'2, 8, 18, 32, 18, 3',                          c:'Metais representativos',        r:6, col:13 },
    { z:82, s:'Pb', n:'Chumbo',                    e:'2, 8, 18, 32, 18, 4',                          c:'Metais representativos',        r:6, col:14 },
    { z:83, s:'Bi', n:'Bismuto',                   e:'2, 8, 18, 32, 18, 5',                          c:'Metais representativos',        r:6, col:15 },
    { z:84, s:'Po', n:'Polônio',                   e:'2, 8, 18, 32, 18, 6',                          c:'Não metais',                    r:6, col:16 },
    { z:85, s:'At', n:'Astato',                    e:'2, 8, 18, 32, 18, 7',                          c:'Não metais',                    r:6, col:17 },
    { z:86, s:'Rn', n:'Radônio',                   e:'2, 8, 18, 32, 18, 8',                          c:'Gases nobres',                  r:6, col:18 },
    { z:87, s:'Fr', n:'Frâncio',                   e:'2, 8, 18, 32, 18, 8, 1',                       c:'Metais representativos',        r:7, col:1 },
    { z:88, s:'Ra', n:'Rádio',                     e:'2, 8, 18, 32, 18, 8, 2',                       c:'Metais representativos',        r:7, col:2 },
    { z:89, s:'Ac', n:'Actínio',                   e:'2, 8, 18, 32, 18, 9, 2',                       c:'Metais de transição internos',  r:7, col:3 },
    { z:90, s:'Th', n:'Tório',                     e:'2, 8, 18, 32, 18, 10, 2',                      c:'Metais de transição internos',  r:10, col:4 },
    { z:91, s:'Pa', n:'Protactínio',               e:'2, 8, 18, 32, 20, 9, 2',                       c:'Metais de transição internos',  r:10, col:5 },
    { z:92, s:'U',  n:'Urânio',                    e:'2, 8, 18, 32, 21, 9, 2',                       c:'Metais de transição internos',  r:10, col:6 },
    { z:93, s:'Np', n:'Netúnio',                   e:'2, 8, 18, 32, 22, 9, 2',                       c:'Metais de transição internos',  r:10, col:7 },
    { z:94, s:'Pu', n:'Plutônio',                  e:'2, 8, 18, 32, 24, 8, 2',                       c:'Metais de transição internos',  r:10, col:8 },
    { z:95, s:'Am', n:'Americium',                 e:'2, 8, 18, 32, 25, 8, 2',                       c:'Metais de transição internos',  r:10, col:9 },
    { z:96, s:'Cm', n:'Curium',                    e:'2, 8, 18, 32, 25, 9, 2',                       c:'Metais de transição internos',  r:10, col:10 },
    { z:97, s:'Bk', n:'Berkélio',                  e:'2, 8, 18, 32, 27, 8, 2',                       c:'Metais de transição internos',  r:10, col:11 },
    { z:98, s:'Cf', n:'Califórnio',                e:'2, 8, 18, 32, 28, 8, 2',                       c:'Metais de transição internos',  r:10, col:12 },
    { z:99, s:'Es', n:'Einstênio',                 e:'2, 8, 18, 32, 29, 8, 2',                       c:'Metais de transição internos',  r:10, col:13 },
    { z:100,s:'Fm', n:'Fermio',                    e:'2, 8, 18, 32, 30, 8, 2',                       c:'Metais de transição internos',  r:10, col:14 },
    { z:101,s:'Md', n:'Mendelevium',               e:'2, 8, 18, 32, 31, 8, 2',                       c:'Metais de transição internos',  r:10, col:15 },
    { z:102,s:'No', n:'Nobélium',                  e:'2, 8, 18, 32, 32, 8, 2',                       c:'Metais de transição internos',  r:10, col:16 },
    { z:103,s:'Lr', n:'Lawrencium',                e:'2, 8, 18, 32, 32, 8, 3',                       c:'Metais de transição internos',  r:10, col:17 },
    { z:104,s:'Rf', n:'Rutherfordium',             e:'2, 8, 18, 32, 32, 10, 2',                      c:'Metais de transição externos',  r:7, col:4 },
    { z:105,s:'Db', n:'Dubnium',                   e:'2, 8, 18, 32, 32, 11, 2',                      c:'Metais de transição externos',  r:7, col:5 },
    { z:106,s:'Sg', n:'Seaborgium',                e:'2, 8, 18, 32, 32, 12, 2',                      c:'Metais de transição externos',  r:7, col:6 },
    { z:107,s:'Bh', n:'Bohrium',                   e:'2, 8, 18, 32, 32, 13, 2',                      c:'Metais de transição externos',  r:7, col:7 },
    { z:108,s:'Hs', n:'Hássio',                    e:'2, 8, 18, 32, 32, 14, 2',                      c:'Metais de transição externos',  r:7, col:8 },
    { z:109,s:'Mt', n:'Meitnérium',                e:'2, 8, 18, 32, 32, 15, 2',                      c:'Metais de transição externos',  r:7, col:9 },
    { z:110,s:'Ds', n:'Darmstádio',                e:'2, 8, 18, 32, 32, 16, 2',                      c:'Metais de transição externos',  r:7, col:10 },
    { z:111,s:'Rg', n:'Roentgênio',                e:'2, 8, 18, 32, 32, 17, 2',                      c:'Metais de transição externos',  r:7, col:11 },
    { z:112,s:'Cn', n:'Copernício',                e:'2, 8, 18, 32, 32, 18, 2',                      c:'Metais de transição externos',  r:7, col:12 },
    { z:113,s:'Nh', n:'Nihônio',                   e:'2, 8, 18, 32, 32, 18, 3',                      c:'Metais representativos',        r:7, col:13 },
    { z:114,s:'Fl', n:'Fleróvio',                  e:'2, 8, 18, 32, 32, 18, 4',                      c:'Metais representativos',        r:7, col:14 },
    { z:115,s:'Mc', n:'Moscóvio',                  e:'2, 8, 18, 32, 32, 18, 5',                      c:'Metais representativos',        r:7, col:15 },
    { z:116,s:'Lv', n:'Livermório',                e:'2, 8, 18, 32, 32, 18, 6',                      c:'Não metais',                    r:7, col:16 },
    { z:117,s:'Ts', n:'Tennessine',                e:'2, 8, 18, 32, 32, 18, 7',                      c:'Não metais',                    r:7, col:17 },
    { z:118,s:'Og', n:'Oganessônio',               e:'2, 8, 18, 32, 32, 18, 8',                      c:'Gases nobres',                  r:7, col:18 }
  ];

  /* Mapa rápido: z → elemento */
  var BY_Z = {};
  ELEMENTS.forEach(function (el) { BY_Z[el.z] = el; });

  var PeriodicTable = {
    built: false,
    selectedZ: 1,

    open: function () {
      if (!this.built) { this.build(); this.built = true; }
      this.selectedZ = 1;

      /* Init 3D atom */
      if (window.Atom3D && !Atom3D.renderer) {
        Atom3D.init('pt-atom3d-container');
      }

      this.renderPanel(BY_Z[1]);
      this.highlightSelected();
      document.getElementById('periodic-table').hidden = false;
    },

    close: function () {
      document.getElementById('periodic-table').hidden = true;
      if (window.Atom3D) {
        Atom3D.destroy();
      }
    },

    build: function () {
      var self = this;
      var grid = document.getElementById('pt-grid');
      grid.innerHTML = '';

      ELEMENTS.forEach(function (el) {
        var cls = CLASSIFICATIONS[el.c];
        var tile = document.createElement('div');
        tile.className = 'pt-tile';
        tile.dataset.z = el.z;
        tile.style.gridColumn = el.col;
        tile.style.gridRow = el.r;
        tile.style.setProperty('--tile-color', cls ? cls.color : '#5a6a8a');

        tile.innerHTML =
          '<span class="pt-z">' + el.z + '</span>' +
          '<span class="pt-sym">' + el.s + '</span>' +
          '<span class="pt-name">' + el.n + '</span>';

        tile.addEventListener('click', function () {
          self.selectedZ = el.z;
          self.renderPanel(el);
          self.highlightSelected();
        });

        grid.appendChild(tile);
      });

      /* Legenda */
      var legend = document.getElementById('pt-legend');
      legend.innerHTML = '';
      var keys = ['Metais representativos', 'Metais de transição externos', 'Metais de transição internos', 'Não metais', 'Gases nobres', 'Hidrogênio'];
      keys.forEach(function (k) {
        var info = CLASSIFICATIONS[k];
        var item = document.createElement('span');
        item.className = 'pt-legend-item';
        item.innerHTML = '<span class="pt-legend-swatch" style="background:' + info.color + '"></span>' + info.label;
        legend.appendChild(item);
      });
    },

    highlightSelected: function () {
      var tiles = document.querySelectorAll('.pt-tile');
      for (var i = 0; i < tiles.length; i++) {
        tiles[i].classList.toggle('pt-tile--selected', parseInt(tiles[i].dataset.z) === this.selectedZ);
      }
    },

    renderPanel: function (el) {
      var cls = CLASSIFICATIONS[el.c];
      var color = cls ? cls.color : '#5a6a8a';
      var panel = document.getElementById('pt-panel');
      panel.style.setProperty('--panel-color', color);
      document.getElementById('pt-pz').textContent = el.z;
      document.getElementById('pt-psym').textContent = el.s;
      document.getElementById('pt-pname').textContent = el.n;
      document.getElementById('pt-peconfig').textContent = el.e;
      document.getElementById('pt-pclass').textContent = el.c;
      document.getElementById('pt-pclass').style.color = color;

      /* Build 3D atom model */
      if (window.Atom3D) {
        Atom3D.buildAtom(el.z, el.e, el.c);
      }
    }
  };

  window.PeriodicTable = PeriodicTable;
  window.PT_ELEMENTS = ELEMENTS;
})();
