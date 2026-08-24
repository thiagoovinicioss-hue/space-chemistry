/* ============================================================
   SPACE CHEMISTRY · i18n.js  v1.0
   Sistema de idiomas: Português (padrão), Inglês e Espanhol.
   - Traduz textos estáticos via [data-i18n] no HTML
   - Traduz labels dinâmicos do script.js/classroom.js via I18N.t()
   - Dock de idioma (menu + pausa) com tela de loading 3D na troca
   Lições do quadro negro permanecem em PT (material de estudo).
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Dicionário ---------------- */
  var DICT = {
    pt: {
      'menu.start': 'Iniciar Missão',
      'menu.rules': 'Regras',
      'menu.wardrobe': 'Vestiário',
      'menu.achievements': 'Conquistas',
      'menu.bonds': 'Conteúdo de Ligações',
      'menu.sound.on': 'Som: Ligado',
      'menu.sound.off': 'Som: Desligado',
      'menu.fx3d.on': 'Efeitos 3D: Ligado',
      'menu.fx3d.off': 'Efeitos 3D: Desligado',
      'menu.fs.enter': 'Tela Cheia',
      'menu.fs.exit': 'Sair da Tela Cheia',
      'menu.hint': 'Use as setas ou WASD e ENTER para navegar · ESC volta',

      'rules.title': 'Como Jogar',
      'rules.goal.title': 'Objetivo',
      'rules.goal.body': 'Explore a galáxia e restaure os 5 planetas aprendendo os <strong>3 tipos de ligações químicas</strong>: iônica, covalente e metálica.',
      'rules.controls.title': 'Controles',
      'rules.controls.m1': '— mover',
      'rules.controls.m2': '— atacar com o sabre de luz',
      'rules.controls.m3': '— interagir com máquinas',
      'rules.controls.m4': '— avançar diálogos e questionário',
      'rules.controls.m5': '— pausar',
      'rules.win.title': 'Como vencer',
      'rules.win.body': 'Em cada planeta: converse com o <strong>cientista</strong>, explore o mapa, derrote os <strong>alienígenas</strong> com seu sabre, monte os compostos na <strong>Máquina de Fusão</strong>, responda ao <strong>questionário</strong> e viaje de nave até o próximo planeta.',
      'rules.lose.title': 'Como perder',
      'rules.lose.body': 'Você tem <strong>3 vidas</strong>. Atingir asteroides, armadilhas, alienígenas ou detritos espaciais custa 1 vida. Erros em exercícios e questionários também custam vida. Alguns trajes desbloqueados concedem <strong>corações extras</strong> para te ajudar. Sem vidas = missão falhou.',
      'rules.score.title': 'Pontuação',
      'rules.score.l1': 'Coletar átomo: <strong>+10</strong>',
      'rules.score.l2': 'Composto correto na fusão: <strong>+100</strong>',
      'rules.score.l3': 'Derrotar alienígena: <strong>+50</strong>',
      'rules.score.l4': 'Resposta certa no questionário: <strong>+150</strong>',
      'rules.score.l5': 'Erro: <strong>−20</strong>',
      'rules.score.bonus': 'Bônus de tempo ao terminar a fase',
      'rules.unlock.title': 'Desbloqueios',
      'rules.unlock.body': 'Ao concluir cada planeta você desbloqueia <strong>itens cosméticos</strong> (capacetes, trajes, naves e rastros). Troque-os no <strong>Vestiário</strong>. Alguns trajes oferecem <strong>corações extras</strong> que aumentam suas vidas!',

      'galaxy.title': 'Mapa da Galáxia',
      'galaxy.sub': 'Complete os planetas para restaurar a galáxia.',
      'galaxy.myship': 'Minha nave',
      'galaxy.launch': 'Lançar Missão',

      'wardrobe.title': 'Vestiário',
      'wardrobe.tab.helmets': 'Capacetes',
      'wardrobe.tab.suits': 'Trajes',
      'wardrobe.tab.ships': 'Naves',
      'wardrobe.tab.trails': 'Rastros',

      'ach.title': 'Conquistas',
      'ach.count': 'conquistas desbloqueadas',

      'lewis.title': 'Praticar Fórmula de Lewis',
      'lewis.sub': 'Monte a estrutura completa em 6 etapas: elétrons são PONTOS, nunca traços.',
      'lewis.reset': 'Recomeçar',
      'lewis.refresh': '↻ Refazer etapa',
      'lewis.confirm': 'Confirmar etapa',
      'structural.title': 'Praticar Fórmula Estrutural',
      'structural.sub': 'Ligações covalentes são TRAÇOS: — simples, = dupla, ≡ tripla. Nunca pontos de elétrons.',
      'structural.reset': 'Recomeçar',
      'structural.check': 'Conferir resposta',

      'bonds.title': 'Conteúdo de Ligações',
      'bonds.sub': 'Estude com o Prof. Sérgio antes ou depois das missões.',
      'bonds.ionic.title': 'Ligações Iônicas',
      'bonds.ionic.sub': 'Transferência de elétrons · cátions e ânions',
      'bonds.covalent.title': 'Ligações Covalentes',
      'bonds.covalent.sub': 'Compartilhamento de elétrons · moléculas',
      'bonds.metallic.title': 'Ligações Metálicas',
      'bonds.metallic.sub': 'Mar de elétrons · propriedades dos metais',

      'cls.badge': 'AULA',
      'cls.progress.board': 'QUADRO',
      'cls.hint.next': '[ESPAÇO] continuar ▸',
      'cls.hint.nextBoard': '[ESPAÇO] ▸ próximo quadro',
      'cls.hint.done': 'aula concluída ✔ volte ao conteúdo quando quiser',
      'training.label': 'TREINAMENTO',
      'training.lewis': 'Praticar Lewis',
      'training.structural': 'Praticar Estrutural',
      'cls.prev': '◀ Anterior',
      'cls.skip': 'Pular aula ⏭',
      'cls.back': 'Voltar para Conteúdo',
      'cls.next': 'Próximo ▶',

      'pause.title': '⏸ Pausa',
      'pause.resume': 'Continuar',
      'pause.ptable': '🔬 Tabela Periódica',
      'pause.restart': '↻ Recomeçar Fase',
      'pause.exit': 'Sair',
      'ptable.close': 'Fechar',

      'back.menu': '← Menu',
      'back.voltar': '← Voltar',
      'back.content': '← Conteúdo de Ligações',

      'dyn.touch.continue': 'Toque para continuar',
      'dyn.kbd.continue': 'ESPAÇO para continuar',
      'dyn.touch.start': 'Toque para começar',
      'dyn.kbd.start': 'Aperte <kbd>ESPAÇO</kbd> para começar',
      'loading.caption': 'Aplicando novo idioma…',
      'loading.sub': 'Preparando a galáxia no seu idioma'
    },

    en: {
      'menu.start': 'Start Mission',
      'menu.rules': 'Rules',
      'menu.wardrobe': 'Wardrobe',
      'menu.achievements': 'Achievements',
      'menu.bonds': 'Bonds Content',
      'menu.sound.on': 'Sound: On',
      'menu.sound.off': 'Sound: Off',
      'menu.fx3d.on': '3D Effects: On',
      'menu.fx3d.off': '3D Effects: Off',
      'menu.fs.enter': 'Fullscreen',
      'menu.fs.exit': 'Exit Fullscreen',
      'menu.hint': 'Use arrows or WASD and ENTER to navigate · ESC goes back',

      'rules.title': 'How to Play',
      'rules.goal.title': 'Goal',
      'rules.goal.body': 'Explore the galaxy and restore the 5 planets while learning the <strong>3 types of chemical bonds</strong>: ionic, covalent and metallic.',
      'rules.controls.title': 'Controls',
      'rules.controls.m1': '— move',
      'rules.controls.m2': '— attack with the lightsaber',
      'rules.controls.m3': '— interact with machines',
      'rules.controls.m4': '— advance dialogs and quiz',
      'rules.controls.m5': '— pause',
      'rules.win.title': 'How to win',
      'rules.win.body': 'On each planet: talk to the <strong>scientist</strong>, explore the map, defeat the <strong>aliens</strong> with your lightsaber, assemble compounds in the <strong>Fusion Machine</strong>, answer the <strong>quiz</strong> and fly your ship to the next planet.',
      'rules.lose.title': 'How to lose',
      'rules.lose.body': 'You have <strong>3 lives</strong>. Hitting asteroids, traps, aliens or space debris costs 1 life. Mistakes in exercises and quizzes also cost lives. Some unlocked suits grant <strong>extra hearts</strong> to help you. No lives = mission failed.',
      'rules.score.title': 'Scoring',
      'rules.score.l1': 'Collect atom: <strong>+10</strong>',
      'rules.score.l2': 'Correct compound in fusion: <strong>+100</strong>',
      'rules.score.l3': 'Defeat alien: <strong>+50</strong>',
      'rules.score.l4': 'Correct quiz answer: <strong>+150</strong>',
      'rules.score.l5': 'Mistake: <strong>−20</strong>',
      'rules.score.bonus': 'Time bonus when finishing the level',
      'rules.unlock.title': 'Unlocks',
      'rules.unlock.body': 'Completing each planet unlocks <strong>cosmetic items</strong> (helmets, suits, ships and trails). Swap them in the <strong>Wardrobe</strong>. Some suits offer <strong>extra hearts</strong> that increase your lives!',

      'galaxy.title': 'Galaxy Map',
      'galaxy.sub': 'Complete the planets to restore the galaxy.',
      'galaxy.myship': 'My ship',
      'galaxy.launch': 'Launch Mission',

      'wardrobe.title': 'Wardrobe',
      'wardrobe.tab.helmets': 'Helmets',
      'wardrobe.tab.suits': 'Suits',
      'wardrobe.tab.ships': 'Ships',
      'wardrobe.tab.trails': 'Trails',

      'ach.title': 'Achievements',
      'ach.count': 'achievements unlocked',

      'lewis.title': 'Practice Lewis Formulas',
      'lewis.sub': 'Build the complete structure in 6 steps: electrons are DOTS, never dashes.',
      'lewis.reset': 'Restart',
      'lewis.refresh': '↻ Redo step',
      'lewis.confirm': 'Confirm step',
      'structural.title': 'Practice Structural Formula',
      'structural.sub': 'Covalent bonds are DASHES: — single, = double, ≡ triple. Never electron dots.',
      'structural.reset': 'Restart',
      'structural.check': 'Check answer',

      'bonds.title': 'Bonds Content',
      'bonds.sub': 'Study with Prof. Sérgio before or after the missions.',
      'bonds.ionic.title': 'Ionic Bonds',
      'bonds.ionic.sub': 'Electron transfer · cations and anions',
      'bonds.covalent.title': 'Covalent Bonds',
      'bonds.covalent.sub': 'Electron sharing · molecules',
      'bonds.metallic.title': 'Metallic Bonds',
      'bonds.metallic.sub': 'Sea of electrons · properties of metals',

      'cls.badge': 'LESSON',
      'cls.progress.board': 'BOARD',
      'cls.hint.next': '[SPACE] continue ▸',
      'cls.hint.nextBoard': '[SPACE] ▸ next board',
      'cls.hint.done': 'lesson finished ✔ return to the content whenever you like',
      'training.label': 'TRAINING',
      'training.lewis': 'Practice Lewis',
      'training.structural': 'Practice Structural',
      'cls.prev': '◀ Previous',
      'cls.skip': 'Skip lesson ⏭',
      'cls.back': 'Back to Content',
      'cls.next': 'Next ▶',

      'pause.title': '⏸ Paused',
      'pause.resume': 'Resume',
      'pause.ptable': '🔬 Periodic Table',
      'pause.restart': '↻ Restart Level',
      'pause.exit': 'Exit',
      'ptable.close': 'Close',

      'back.menu': '← Menu',
      'back.voltar': '← Back',
      'back.content': '← Bonds Content',

      'dyn.touch.continue': 'Tap to continue',
      'dyn.kbd.continue': 'SPACE to continue',
      'dyn.touch.start': 'Tap to start',
      'dyn.kbd.start': 'Press <kbd>SPACE</kbd> to start',
      'loading.caption': 'Applying new language…',
      'loading.sub': 'Preparing the galaxy in your language'
    },

    es: {
      'menu.start': 'Iniciar Misión',
      'menu.rules': 'Reglas',
      'menu.wardrobe': 'Vestuario',
      'menu.achievements': 'Logros',
      'menu.bonds': 'Contenido de Enlaces',
      'menu.sound.on': 'Sonido: Activado',
      'menu.sound.off': 'Sonido: Desactivado',
      'menu.fx3d.on': 'Efectos 3D: Activado',
      'menu.fx3d.off': 'Efectos 3D: Desactivado',
      'menu.fs.enter': 'Pantalla Completa',
      'menu.fs.exit': 'Salir de Pantalla Completa',
      'menu.hint': 'Usa las flechas o WASD y ENTER para navegar · ESC vuelve',

      'rules.title': 'Cómo Jugar',
      'rules.goal.title': 'Objetivo',
      'rules.goal.body': 'Explora la galaxia y restaura los 5 planetas aprendiendo los <strong>3 tipos de enlaces químicos</strong>: iónico, covalente y metálico.',
      'rules.controls.title': 'Controles',
      'rules.controls.m1': '— moverse',
      'rules.controls.m2': '— atacar con el sable de luz',
      'rules.controls.m3': '— interactuar con máquinas',
      'rules.controls.m4': '— avanzar diálogos y cuestionario',
      'rules.controls.m5': '— pausar',
      'rules.win.title': 'Cómo ganar',
      'rules.win.body': 'En cada planeta: habla con el <strong>científico</strong>, explora el mapa, derrota a los <strong>alienígenas</strong> con tu sable, monta los compuestos en la <strong>Máquina de Fusión</strong>, responde al <strong>cuestionario</strong> y viaja en nave hasta el próximo planeta.',
      'rules.lose.title': 'Cómo perder',
      'rules.lose.body': 'Tienes <strong>3 vidas</strong>. Chocar contra asteroides, trampas, alienígenas o residuos espaciales cuesta 1 vida. Los errores en ejercicios y cuestionarios también quitan vidas. Algunos trajes desbloqueados dan <strong>corazones extra</strong> para ayudarte. Sin vidas = misión fallida.',
      'rules.score.title': 'Puntuación',
      'rules.score.l1': 'Recoger átomo: <strong>+10</strong>',
      'rules.score.l2': 'Compuesto correcto en la fusión: <strong>+100</strong>',
      'rules.score.l3': 'Derrotar alienígena: <strong>+50</strong>',
      'rules.score.l4': 'Respuesta correcta en el cuestionario: <strong>+150</strong>',
      'rules.score.l5': 'Error: <strong>−20</strong>',
      'rules.score.bonus': 'Bonus de tiempo al terminar el nivel',
      'rules.unlock.title': 'Desbloqueos',
      'rules.unlock.body': 'Al completar cada planeta desbloqueas <strong>objetos cosméticos</strong> (casco, trajes, naves y estelas). Cámbialos en el <strong>Vestuario</strong>. ¡Algunos trajes ofrecen <strong>corazones extra</strong> que aumentan tus vidas!',

      'galaxy.title': 'Mapa de la Galaxia',
      'galaxy.sub': 'Completa los planetas para restaurar la galaxia.',
      'galaxy.myship': 'Mi nave',
      'galaxy.launch': 'Lanzar Misión',

      'wardrobe.title': 'Vestuario',
      'wardrobe.tab.helmets': 'Cascos',
      'wardrobe.tab.suits': 'Trajes',
      'wardrobe.tab.ships': 'Naves',
      'wardrobe.tab.trails': 'Estelas',

      'ach.title': 'Logros',
      'ach.count': 'logros desbloqueados',

      'lewis.title': 'Practicar Fórmula de Lewis',
      'lewis.sub': 'Monta la estructura completa en 6 pasos: los electrones son PUNTOS, nunca rayas.',
      'lewis.reset': 'Reiniciar',
      'lewis.refresh': '↻ Rehacer paso',
      'lewis.confirm': 'Confirmar paso',
      'structural.title': 'Practicar Fórmula Estructural',
      'structural.sub': 'Los enlaces covalentes son RAYAS: — simple, = doble, ≡ triple. Nunca puntos de electrones.',
      'structural.reset': 'Reiniciar',
      'structural.check': 'Comprobar respuesta',

      'bonds.title': 'Contenido de Enlaces',
      'bonds.sub': 'Estudia con el Prof. Sérgio antes o después de las misiones.',
      'bonds.ionic.title': 'Enlaces Iónicos',
      'bonds.ionic.sub': 'Transferencia de electrones · cationes y aniones',
      'bonds.covalent.title': 'Enlaces Covalentes',
      'bonds.covalent.sub': 'Compartición de electrones · moléculas',
      'bonds.metallic.title': 'Enlaces Metálicos',
      'bonds.metallic.sub': 'Mar de electrones · propiedades de los metales',

      'cls.badge': 'CLASE',
      'cls.progress.board': 'PIZARRA',
      'cls.hint.next': '[ESPACIO] continuar ▸',
      'cls.hint.nextBoard': '[ESPACIO] ▸ próxima pizarra',
      'cls.hint.done': 'clase terminada ✔ vuelve al contenido cuando quieras',
      'training.label': 'ENTRENAMIENTO',
      'training.lewis': 'Practicar Lewis',
      'training.structural': 'Practicar Estructural',
      'cls.prev': '◀ Anterior',
      'cls.skip': 'Saltar clase ⏭',
      'cls.back': 'Volver al Contenido',
      'cls.next': 'Siguiente ▶',

      'pause.title': '⏸ Pausa',
      'pause.resume': 'Continuar',
      'pause.ptable': '🔬 Tabla Periódica',
      'pause.restart': '↻ Reiniciar Nivel',
      'pause.exit': 'Salir',
      'ptable.close': 'Cerrar',

      'back.menu': '← Menú',
      'back.voltar': '← Volver',
      'back.content': '← Contenido de Enlaces',

      'dyn.touch.continue': 'Toca para continuar',
      'dyn.kbd.continue': 'ESPACIO para continuar',
      'dyn.touch.start': 'Toca para empezar',
      'dyn.kbd.start': 'Pulsa <kbd>ESPACIO</kbd> para empezar',
      'loading.caption': 'Aplicando nuevo idioma…',
      'loading.sub': 'Preparando la galaxia en tu idioma'
    }
  };

  var LANGS = ['pt', 'en', 'es'];
  var LS_KEY = 'sc_lang';
  var MIN_LOADING_MS = 1700;

  var I18N = {
    lang: 'pt',
    version: '1.0.0',

    t: function (key, fallback) {
      var d = DICT[this.lang];
      if (d && d[key]) return d[key];
      if (DICT.pt[key]) return DICT.pt[key];
      return fallback !== undefined ? fallback : key;
    },

    apply: function (root) {
      root = root || document;
      var nodes = root.querySelectorAll('[data-i18n]');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var htmlKey = el.getAttribute('data-i18n-html');
        if (htmlKey) { el.innerHTML = this.t(htmlKey); continue; }
        el.textContent = this.t(el.getAttribute('data-i18n'));
      }
      this.syncDock();
      document.documentElement.lang = this.lang === 'pt' ? 'pt-BR' : this.lang;
    },

    setLanguage: function (lang) {
      if (LANGS.indexOf(lang) < 0) return false;
      this.lang = lang;
      try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
      this.apply(document);
      document.dispatchEvent(new CustomEvent('sc:language', { detail: { lang: lang } }));
      return true;
    },

    getLanguage: function () { return this.lang; },
    isDefault: function () { return this.lang === 'pt'; },

    /* ---------- Dock de idiomas (menu + pausa) ---------- */
    syncDock: function () {
      var docks = document.querySelectorAll('.lang-dock');
      for (var i = 0; i < docks.length; i++) {
        var btns = docks[i].querySelectorAll('.lang-btn');
        for (var j = 0; j < btns.length; j++) {
          var b = btns[j];
          b.classList.toggle('active', b.getAttribute('data-lang') === this.lang);
        }
      }
    },

    shakeDock: function (btn) {
      btn.classList.remove('is-shaking');
      void btn.offsetWidth;
      btn.classList.add('is-shaking');
      setTimeout(function () { btn.classList.remove('is-shaking'); }, 420);
    },

    initDock: function () {
      var self = this;
      document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.lang-btn') : null;
        if (!btn || btn.disabled) return;
        var target = btn.getAttribute('data-lang');
        if (!target || LANGS.indexOf(target) < 0) return;
        if (target === self.lang) { self.shakeDock(btn); return; }
        self.openLoading(target);
      });
    },

    /* ---------- Tela de loading + troca de idioma ---------- */
    openLoading: function (targetLang) {
      if (this._switching) return;
      this._switching = true;

      var Game = window.Game || {};
      var prevScreen = Game.screen || null;
      var wasPaused = false;
      var pauseEl = document.getElementById('pause');
      if (prevScreen === 'game' && pauseEl && !pauseEl.hidden) wasPaused = true;

      /* Congela o estado atual e mostra a tela de loading */
      if (window.Effects3D && Effects3D.setPaused) Effects3D.setPaused(true);
      if (pauseEl) pauseEl.hidden = true;
      if (window.showScreen) showScreen('loading');
      else {
        var secs = document.querySelectorAll('.screen');
        for (var i = 0; i < secs.length; i++) secs[i].classList.toggle('active', secs[i].id === 'screen-loading');
        Game.screen = 'loading';
      }

      var caption = document.getElementById('loading-caption');
      if (caption) caption.textContent = this.t('loading.caption');
      var sub = document.getElementById('loading-sub');
      if (sub) sub.textContent = this.t('loading.sub');

      var scene = window.LoadingScene && LoadingScene.start ? LoadingScene.start() : null;
      var self = this;

      /* Otimização: aplica o idioma uma única vez durante o voo,
         garante tempo mínimo de exibição e sai com fade suave */
      var applied = false;
      var applyNow = function () {
        if (applied) return;
        applied = true;
        self.setLanguage(targetLang);
      };
      setTimeout(applyNow, Math.min(MIN_LOADING_MS * 0.55, 950));

      setTimeout(function () {
        applyNow();
        requestAnimationFrame(function () {
          var fade = document.getElementById('loading-fade');
          var done = function () {
            if (scene && LoadingScene.stop) LoadingScene.stop();
            if (fade) fade.classList.remove('show');
            self._switching = false;
            /* Devolve o jogador exatamente onde estava */
            if (prevScreen && window.showScreen) {
              showScreen(prevScreen);
              if (wasPaused && pauseEl) {
                pauseEl.hidden = false;
                if (window.Effects3D && Effects3D.setPaused) Effects3D.setPaused(true);
              }
            } else {
              if (window.Effects3D && Effects3D.setPaused) Effects3D.setPaused(false);
            }
          };
          if (fade) {
            fade.classList.add('show');
            setTimeout(done, 520);
          } else done();
        });
      }, MIN_LOADING_MS);
    },

    boot: function () {
      var saved = null;
      try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
      if (saved && LANGS.indexOf(saved) >= 0 && saved !== 'pt') {
        this.lang = saved;
      }
      this.initDock();
      this.apply(document);
    }
  };

  window.I18N = I18N;
  I18N.boot();
})();
