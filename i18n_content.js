/* ============================================================
   SPACE CHEMISTRY · i18n_content.js  v1.0
   Tradução do CONTEÚDO do jogo para EN/ES:
   - Aulas completas do Prof. Sérgio (títulos, linhas e falas)
   - Diálogos de chegada nos planetas
   - Nome/intro/objetivo/química de cada planeta
   Estruturas espelham EXATAMENTE as originais (mesmos comprimentos).
   ============================================================ */
(function () {
  'use strict';

  window.I18N_CONTENT = {

    /* ==================== INGLÊS ==================== */
    en: {
      dyn: { mount: 'Build' },

      levels: {
        tutorial: {
          name: 'Orbital Station',
          intro: 'Welcome, recruit! The neighboring planet has lost all its energy. Before departing, learn how to pilot your suit. Collect the crystals and assemble the water molecule on the computer.',
          objective: 'Assemble the water molecule (H₂O)',
          chem: 'Chemistry: how atoms bond and form molecules.'
        },
        ionic: {
          name: 'Ionic Planet',
          intro: 'Krystália is in flames! Here, METAL + NON-METAL exchange electrons and form ionic crystals. Collect the elements and assemble the compounds in the Ionic Furnace.',
          objective: 'Assemble the ionic compounds',
          chem: 'Chemistry: IONIC bond — the metal DONATES electrons to the non-metal.'
        },
        covalent: {
          name: 'Covalent Planet',
          intro: 'Nébula is made of gases. Here, NON-METAL + NON-METAL SHARE electrons. Assemble the molecules in the Molecular Assembler and clean up the atmosphere.',
          objective: 'Assemble the covalent molecules',
          chem: 'Chemistry: COVALENT bond — non-metals SHARE electrons.'
        },
        metallic: {
          name: 'Metallic Planet',
          intro: 'Ferravil has lost all its energy! Metals keep free electrons in an "electron sea" and conduct current. Collect the metals and feed the Energy Core.',
          objective: 'Feed the core with the right metals',
          chem: 'Chemistry: METALLIC bond — metals have a "sea of electrons".'
        },
        final: {
          name: 'Final Planet',
          intro: 'The Cosmic Core needs you to apply EVERYTHING you have learned. Sort the bonds in the portals and restore the galaxy!',
          objective: 'Sort the bonds and reactivate the reactor',
          chem: 'Chemistry: review of ionic, covalent and metallic bonds.'
        },
        kinder: {
          name: 'Kinder Planet',
          intro: 'Kinder is an OPTIONAL DETOUR between the Orbital Station and the Ionic Planet. Here the ionic challenge is elite: cross the charges and make the sum zero to assemble Na₂S, CaF₂ and AlCl₃.',
          objective: 'Ionic detour: assemble the advanced compounds',
          chem: 'Chemistry: advanced IONIC bond — ions, charges and the crossing that makes the total charge zero.'
        },
        bueno: {
          name: 'Bueno Planet',
          intro: 'Bueno is an OPTIONAL DETOUR between the Covalent Planet and the Metallic Planet. Master valence and simple, double and triple bonds to assemble CH₄, N₂ and HCl.',
          objective: 'Covalent detour: assemble CH₄, N₂ and HCl',
          chem: 'Chemistry: advanced COVALENT bond — valence, single/double/triple bonds and molecular formulas.'
        }
      },

      dialogues: [
        [
          'Welcome to the Orbital Station, recruit!',
          'I am Prof. Sérgio. The galaxy has lost all of its chemical energy.',
          'Your mission: explore each planet and restore the bonds between atoms.',
          'Collect the crystals (elements) around the map and assemble the compound in the Fusion Machine.',
          'Some blocks are breakable: get close and press SPACE (or strike them with the lightsaber, J).',
          'On the Final Planet, a quiz will test everything you have learned.',
          'Beware of asteroids and aliens — use your lightsaber to defend yourself!',
          'Now go! Start by collecting the hydrogen and oxygen crystals to make water.'
        ],
        [
          'Krystália is in flames, recruit!',
          'Here we learn the IONIC bond: metal + non-metal EXCHANGE electrons.',
          'Sodium (metal) donates 1 electron; chlorine (non-metal) receives it. The ions Na⁺ and Cl⁻ are formed.',
          'Collect the elements and assemble NaCl, MgO and KBr in the Ionic Furnace.',
          'The aliens guard secret passages. Defeat them to move forward!',
          'Good luck, astronaut!'
        ],
        [
          'Nébula is a gaseous world, recruit!',
          'Here we learn the COVALENT bond: non-metals SHARE electrons.',
          'Water (H₂O), carbon dioxide (CO₂) and ammonia (NH₃) are covalent bonds.',
          'Assemble those molecules in the Molecular Assembler to clean the atmosphere.',
          'Watch out for the energy rivers — and for the purple aliens that protect them!'
        ],
        [
          'Ferravil has lost all electricity, recruit!',
          'In metals, electrons are FREE — the famous "electron sea".',
          'That is why copper, iron and gold conduct electricity so well.',
          'Collect the metals and feed the Energy Core in the right order.',
          'The guardian robots protect the mines. Use your lightsaber to clear the way!'
        ],
        [
          'This is the Cosmic Core, recruit! The final test.',
          'Apply everything: IONIC = metal + non-metal exchange electrons.',
          'COVALENT = non-metals share electrons.',
          'METALLIC = metals with free "electron sea".',
          'Sort the bonds in the portals, assemble NaCl in the reactor...',
          '...and answer the final quiz to restore the galaxy!'
        ],
        [
          'Welcome to Kinder Planet, recruit!',
          'This world is an OPTIONAL DETOUR — here the ionic challenge is elite.',
          'Remember: the metal becomes a CATION (+) and the non-metal becomes an ANION (−).',
          'When crossing charges, the compound\'s total sum must be ZERO.',
          'Assemble Na₂S, CaF₂ and AlCl₃ in the Ion Forge — cross those charges carefully!',
          'If you prefer to skip, the route to Krystália stays open. Good luck!'
        ],
        [
          'This is Bueno Planet, recruit!',
          'An optional detour for masters of the COVALENT bond.',
          'Here you build molecules with single, double and triple bonds.',
          'Compare the representations: Lewis uses DOTS; the structural formula uses DASHES.',
          'Assemble CH₄, N₂ and HCl in the Molecular Synthesizer.',
          'Complete it and take the exclusive reward — or head straight to Ferravil!'
        ]
      ],

      lessons: {
        ionica: {
          label: 'IONIC BONDS',
          slides: [
            { title: 'LET\'S REVIEW?',
              lines: [
                'What is the name of the outermost shell? That\'s right: the valence shell!',
                'Electron distribution: how electrons are arranged in shells (energy levels) around the nucleus.',
                'Example — Chlorine: 2, 8, 7 electrons.'
              ],
              say: [
                'Before the new lesson, let\'s remember: what is the outermost shell called? That\'s right, the valence shell!',
                'Electron distribution shows where electrons live: in shells or energy levels around the nucleus.',
                'Look at chlorine on the board: 2 electrons in the first shell, 8 in the second and 7 in the last. Remember that 7!'
              ] },
            { title: 'WHAT IS A CHEMICAL BOND?',
              lines: [
                'It is the union of two or more atoms of equal or different elements.',
                'They seek to lose, gain or share electrons in order to become stable.',
                'Linus Pauling: American researcher regarded as the father of the Chemical Bond and one of the leading chemists of the 20th century.'
              ],
              say: [
                'A chemical bond is the union between atoms — they may be alike or different.',
                'Atoms join because they want to lose, gain or share electrons and thus become stable.',
                'The one who studied this deeply was Linus Pauling, the father of the chemical bond!'
              ] },
            { title: 'OCTET RULE',
              lines: [
                'Octet Rule',
                'Goal: make molecules stable.',
                'Having 2 or 8 electrons in the valence shell.',
                'Theory proposed by Newton Lewis: atomic interaction happens so that each element gains stability.'
              ],
              say: [
                'Now we\'re talking: the Octet Rule! It is the basis for understanding every bond.',
                'The goal is always the stability of molecules.',
                'An atom becomes stable with 2 or 8 electrons in its valence shell, just like the noble gases.',
                'This theory was proposed by Newton Lewis: atoms interact precisely to gain stability.'
              ] },
            { title: 'IONIC BOND',
              lines: [
                'A bond that DONATES and RECEIVES electrons (electron transfer).',
                'It occurs between atoms of the METALS and NON-METALS groups.',
                'The metal LOSES electrons and forms the CATION (+).',
                'The non-metal GAINS electrons and forms the ANION (−).'
              ],
              say: [
                'In the ionic bond there is no sharing: one atom donates and the other receives electrons. It is a transfer!',
                'It happens between metals and non-metals.',
                'When the metal loses electrons it becomes positive: that is the cation.',
                'When the non-metal gains electrons it becomes negative: the anion. Cation and anion attract each other and form the compound!'
              ] },
            { title: '2 WAYS TO SOLVE IT',
              lines: [
                'Orbital diagram:',
                'We draw the outermost shell of each atom with its respective electrons.',
                'We donate the electrons of the metal atoms to the non-metal atoms.',
                'At the end, we put it together and count the number of atoms used.'
              ],
              say: [
                'There are two ways to build an ionic bond. The first is the orbital diagram.',
                'We draw only the outermost shell of each atom, with its electron dots.',
                'The metal\'s electrons are donated to the non-metal until the octet is complete.',
                'In the end we put everything together and count how many atoms of each type were used. Look at NaCl on the board!'
              ] },
            { title: '2 WAYS TO SOLVE IT',
              lines: [
                'Ion slider:',
                'We place the atoms in their ionic form.',
                'We slide the ions across to the other side.',
                'We combine the atoms and count the amount used. E.g.: Ca²⁺ and Cl⁻ → CaCl₂'
              ],
              say: [
                'The second way is the ion slider — my favorite!',
                'First we write each atom already in ionic form, with its charge.',
                'Then the ions slide across, swapping positions.',
                'The charges become the little subscripts: Ca²⁺ with Cl⁻ gives CaCl₂. We count and we\'re done!'
              ] },
            { title: 'SUMMING UP THE LESSON',
              lines: [
                'Ionic bond = transfer of electrons.',
                'Metal loses → cation (+) · Non-metal gains → anion (−).',
                'Metals + non-metals form stable ionic compounds (octet rule!).'
              ],
              say: [
                'Let\'s review: the ionic bond is a transfer of electrons.',
                'The metal becomes a positive cation; the non-metal becomes a negative anion.',
                'All of that to fulfill the octet rule and form stable compounds. Great lesson, scientists!'
              ] }
          ]
        },

        covalente: {
          label: 'COVALENT BONDS',
          slides: [
            { title: 'COVALENT BOND',
              lines: [
                'Characterized by the SHARING of one or more pairs of electrons between atoms.',
                'Goal: form STABLE molecules.',
                'It usually occurs between NON-METALS and HYDROGEN.'
              ],
              say: [
                'Unlike the ionic bond, here nobody donates or steals an electron: atoms SHARE pairs of electrons.',
                'By sharing, everyone completes their valence and forms stable molecules.',
                'This bond usually happens between non-metals — and with hydrogen too.'
              ] },
            { title: 'EXAMPLE: METHANE GAS (CH₄)',
              lines: [
                'Carbon shares electrons with 4 hydrogens.',
                'Everyone reaches stability and forms the CH₄ molecule.'
              ],
              say: [
                'Look at methane gas, the one from cows! Carbon shares electrons with four hydrogens.',
                'That way everyone becomes stable: the CH₄ molecule is born.'
              ] },
            { title: 'COVALENT BOND FORMULAS',
              lines: [
                '1st) Molecular formula: shows the number of atoms of each element that form the molecule originating from covalent bonds.',
                'Example: H₂O'
              ],
              say: [
                'To represent molecules we use three formulas. The first is the molecular formula.',
                'It tells how many atoms of each element exist in the molecule: in water, H₂O, there are 2 hydrogens and 1 oxygen.'
              ] },
            { title: 'COVALENT BOND FORMULAS',
              lines: [
                '2nd) Structural formula: shows the organization of the molecule using DASHES that represent each atom\'s bond.',
                'Example: H–O–H'
              ],
              say: [
                'The second is the structural formula, made of dashes.',
                'Each dash represents a bond: look at water, H–O–H.'
              ] },
            { title: 'COVALENT BOND FORMULAS',
              lines: [
                '3rd) Lewis formula: uses the arrangement of the structural formula and replaces each bond dash with "two little dots", which represent the electrons.'
              ],
              say: [
                'And the third is the famous Lewis formula!',
                'We take the structural one and swap each dash for two little dots — the shared electrons.'
              ] },
            { title: 'TYPES OF COVALENT BOND',
              lines: [
                'SINGLE: the atom shared only 1 electron from its valence shell. E.g.: H–O–H',
                'DOUBLE: it shared 2 electrons. E.g.: O=C=O',
                'TRIPLE: it shared 3 electrons. E.g.: N≡N'
              ],
              say: [
                'Covalent bonds can be single: one shared electron, like between H and O in water.',
                'They can be double: two shared electrons, like in carbon dioxide, O=C=O — and in O₂ too!',
                'And they can be triple: three shared electrons, like in atmospheric nitrogen, N≡N.'
              ] },
            { title: 'RECAP',
              lines: [
                'Covalent = sharing of electrons (non-metals + hydrogen).',
                'Formulas: molecular (amounts), structural (dashes) and Lewis (dots).',
                'Types: single, double and triple.'
              ],
              say: [
                'Recapping: covalent is sharing between non-metals and hydrogen.',
                'We represent it with the molecular, structural and Lewis formulas.',
                'And bonds can be single, double or triple.'
              ] },
            { title: 'WANNA TRAIN?',
              lines: [
                'Now it\'s your turn, young scientist!',
                'Practice below what you have learned:'
              ],
              say: [
                'Training time has come! Pick a challenge below and good practice.',
                'In Lewis you use dots; in Structural, dashes. Come back here afterwards to continue!'
              ] }
          ]
        },

        metalica: {
          label: 'METALLIC BONDS',
          slides: [
            { title: 'A QUICK REVIEW...',
              lines: [
                'Ionic bond: loss or gain of electrons, forming the cation and the anion.',
                'Covalent bond: sharing of electrons, forming the molecule.'
              ],
              say: [
                'Let\'s quickly review the two bonds we have already mastered!',
                'Ionic: loss or gain of electrons — the cation and the anion appear. Covalent: sharing — the molecule is born.'
              ] },
            { title: 'LESSON GOALS',
              lines: [
                'Learn the characteristics of metals;',
                'Identify metals in the periodic table;',
                'Recognize different chemical bonding processes;',
                'Learn about metallic bonds.'
              ],
              say: [
                'In this lesson we will learn the characteristics of metals.',
                'We will locate them in the periodic table.',
                'Recognize yet another chemical bonding process…',
                '…and finally understand metallic bonds!'
              ] },
            { title: 'WHERE ARE THE METALS IN THE PERIODIC TABLE?',
              lines: [
                'Metals are elements characterized by SHINE, STRENGTH, THERMAL and ELECTRICAL CONDUCTIVITY.',
                'See on the table the region occupied by the metals.'
              ],
              say: [
                'Metals have striking characteristics: shine, strength and conducting heat and electricity.',
                'It\'s that huge golden region of the periodic table — iron, aluminum, copper, gold… all of them there!'
              ] },
            { title: 'METALLIC BOND',
              lines: [
                'In the metallic bond, neutral atoms and cations are IMMERSED in the electron cloud or SEA OF ELECTRONS.',
                'Formed only between METAL atoms — of the same chemical element or of different elements.',
                'Metal atoms tend to form CATIONS.'
              ],
              say: [
                'We reach the star of the lesson: imagine neutral atoms and cations immersed inside a cloud of electrons. That is the metallic bond!',
                'It only happens between metals — it can be the same element or different elements, as in alloys.',
                'And why does that happen? Because metals have few valence electrons and a tendency to lose them, becoming cations.'
              ] },
            { title: 'FORMATION OF THE ELECTRON SEA',
              lines: [
                'The electrons in the VALENCE SHELL leave that shell, turning the atom into a CATION.',
                'After leaving, the electrons start to SURROUND the cations, forming a true SEA OF ELECTRONS.'
              ],
              say: [
                'Watch the animation: the valence-shell electrons abandon the atom… and it becomes a cation!',
                'Those electrons, coming from all the metal atoms, start roaming around the cations — forming the famous sea of electrons. Nobody belongs to anybody: they are free!'
              ] },
            { title: 'ELECTRON CLOUD AND ATTRACTION',
              lines: [
                'Electrons move FREELY through the material, forming the "electron cloud".',
                'This "electron cloud" is responsible for the STRONG ATTRACTION BETWEEN THE CATIONS.',
                'Electrostatic attraction: (+) charge of cations ↔ (−) charge of free electrons.'
              ],
              say: [
                'Inside the metal these electrons move freely — that\'s why we call it the electron cloud or delocalized electrons.',
                'And that glue-like cloud is what holds the cations together, in a strong attraction.',
                'As the video that inspired this part explains: opposite charges attract — the positive cations stay trapped in the negative sea of electrons. Some books call these cations pseudo-cations!'
              ] },
            { title: 'GOING DEEPER: WHY DOES THIS HAPPEN?',
              lines: [
                'Metals have FEW valence electrons and a strong tendency to DONATE them.',
                'The donated electrons become FREE/DELOCALIZED — they do not belong to any single atom.',
                'Result: a sea of electrons that unites all the metal\'s cations.'
              ],
              say: [
                'An important detail from the video: the metal donates electrons easily because it has few in its outermost shell.',
                'Once free, they no longer belong to any atom — they circulate through the whole metal.',
                'It is this collective sea that acts as a "glue" keeping the entire metallic structure together.'
              ] },
            { title: 'FROM STRUCTURE TO PROPERTIES',
              lines: [
                'ELECTRICAL CONDUCTIVITY: free electrons move when we apply voltage.',
                'THERMAL CONDUCTIVITY: fast electrons carry energy through the material.',
                'SHINE: free electrons interact with light and re-emit it.',
                'MALLEABILITY AND DUCTILITY: cations slide in the sea without breaking the attraction.'
              ],
              say: [
                'Now the magic: the structure of the bond explains the properties of metals! Applying voltage, the free electrons flow — electric current!',
                'Heat also travels fast: fast electrons spread energy through the material.',
                'And the shine? Light hits the free electrons and they re-emit it back. Gleaming metal!',
                'Hammering without breaking? The cations slide among the electrons and the attraction holds — malleability and ductility!'
              ] },
            { title: 'LESSON SUMMARY',
              lines: [
                'BOND STRUCTURE → SEA OF ELECTRONS',
                'MOVEMENT OF THE ELECTRONS → PROPERTIES OF METALS',
                'Shine · Strength · Thermal and electrical conductivity'
              ],
              say: [
                'Let\'s cement this chain: the structure of the bond creates the sea of electrons.',
                'The movement of those electrons explains the properties of metals.',
                'Shine, strength and thermal/electrical conductivity — it all starts in the sea of electrons! To reinforce it, watch the video "Chemistry: Metals and Metallic Bonds". Excellent lesson!'
              ] }
          ]
        }
      }
    },

    /* ==================== ESPAÑOL ==================== */
    es: {
      dyn: { mount: 'Montar' },

      levels: {
        tutorial: {
          name: 'Estación Orbital',
          intro: '¡Bienvenido, recluta! El planeta vecino perdió toda su energía. Antes de partir, aprende a pilotar tu traje. Recoge los cristales y monta la molécula de agua en la computadora.',
          objective: 'Monta la molécula de agua (H₂O)',
          chem: 'Química: cómo los átomos se unen y forman moléculas.'
        },
        ionic: {
          name: 'Planeta Iónico',
          intro: '¡Krystália está en llamas! Aquí, METAL + NO METAL intercambian electrones y forman cristales iónicos. Recoge los elementos y monta los compuestos en el Horno Iónico.',
          objective: 'Monta los compuestos iónicos',
          chem: 'Química: enlace IÓNICO — el metal DONA electrones al no metal.'
        },
        covalent: {
          name: 'Planeta Covalente',
          intro: 'Nébula está hecha de gases. Aquí, NO METAL + NO METAL COMPARTEN electrones. Monta las moléculas en el Ensamblador Molecular y limpia la atmósfera.',
          objective: 'Monta las moléculas covalentes',
          chem: 'Química: enlace COVALENTE — los no metales COMPARTEN electrones.'
        },
        metallic: {
          name: 'Planeta Metálico',
          intro: '¡Ferravil perdió toda su energía! Los metales guardan electrones libres en el "mar de electrones" y conducen corriente. Recoge los metales y alimenta el Núcleo de Energía.',
          objective: 'Alimenta el núcleo con los metales correctos',
          chem: 'Química: enlace METÁLICO — los metales tienen un "mar de electrones".'
        },
        final: {
          name: 'Planeta Final',
          intro: 'El Núcleo Cósmico necesita que apliques TODO lo que aprendiste. Clasifica los enlaces en los portales ¡y restaura la galaxia!',
          objective: 'Clasifica los enlaces y reactiva el reactor',
          chem: 'Química: repaso de los enlaces iónico, covalente y metálico.'
        },
        kinder: {
          name: 'Planeta Kinder',
          intro: 'Kinder es un DESVÍO OPCIONAL entre la Estación Orbital y el Planeta Iónico. Aquí el desafío iónico es de élite: cruza las cargas y haz que la suma dé cero para montar Na₂S, CaF₂ y AlCl₃.',
          objective: 'Desvío iónico: monta los compuestos avanzados',
          chem: 'Química: enlace IÓNICO avanzado — iones, cargas y el cruzamiento que hace cero la carga total.'
        },
        bueno: {
          name: 'Planeta Bueno',
          intro: 'Bueno es un DESVÍO OPCIONAL entre el Planeta Covalente y el Planeta Metálico. Domina la valencia y los enlaces simples, dobles y triples para montar CH₄, N₂ y HCl.',
          objective: 'Desvío covalente: monta CH₄, N₂ y HCl',
          chem: 'Química: enlace COVALENTE avanzado — valencia, enlaces simples/dobles/triples y las fórmulas de la molécula.'
        }
      },

      dialogues: [
        [
          '¡Bienvenido a la Estación Orbital, recluta!',
          'Yo soy el Prof. Sérgio. La galaxia perdió toda su energía química.',
          'Tu misión: explorar cada planeta y restaurar los enlaces entre los átomos.',
          'Recoge los cristales (elementos) por el mapa y monta el compuesto en la Máquina de Fusión.',
          'Algunos bloques son rompibles: acércate y aprieta ESPACIO (o golpéalos con el sable, J).',
          'En el Planeta Final, un cuestionario pondrá a prueba todo lo que aprendiste.',
          '¡Cuidado con los asteroides y los alienígenas — usa tu sable de luz para defenderte!',
          '¡Ahora ve! Empieza recogiendo los cristales de hidrógeno y oxígeno para hacer agua.'
        ],
        [
          '¡Krystália está en llamas, recluta!',
          'Aquí aprendemos el enlace IÓNICO: metal + no metal INTERCAMBIAN electrones.',
          'El sodio (metal) dona 1 electrón; el cloro (no metal) lo recibe. Se forman los iones Na⁺ y Cl⁻.',
          'Recoge los elementos y monta NaCl, MgO y KBr en el Horno Iónico.',
          'Los alienígenas guardan pasajes secretos. ¡Derótalos para avanzar!',
          '¡Buena suerte, astronauta!'
        ],
        [
          '¡Nébula es un mundo de gases, recluta!',
          'Aquí aprendemos el enlace COVALENTE: los no metales COMPARTEN electrones.',
          'El agua (H₂O), el dióxido de carbono (CO₂) y el amoníaco (NH₃) son enlaces covalentes.',
          'Monta esas moléculas en el Ensamblador Molecular para limpiar la atmósfera.',
          '¡Atento a los ríos de energía — y a los alienígenas morados que los protegen!'
        ],
        [
          '¡Ferravil perdió toda la electricidad, recluta!',
          'En los metales, los electrones están LIBRES — el famoso "mar de electrones".',
          'Por eso el cobre, el hierro y el oro conducen tan bien la electricidad.',
          'Recoge los metales y alimenta el Núcleo de Energía en el orden correcto.',
          'Los robots-guardianes protegen las minas. ¡Usa el sable para abrirte camino!'
        ],
        [
          'Este es el Núcleo Cósmico, recluta. ¡La prueba final!',
          'Aplica todo: IÓNICO = metal + no metal intercambian electrones.',
          'COVALENTE = los no metales comparten electrones.',
          'METÁLICO = metales con "mar de electrones" libres.',
          'Clasifica los enlaces en los portales, monta el NaCl en el reactor...',
          '...y responde al cuestionario final para restaurar la galaxia.'
        ],
        [
          '¡Bienvenido al Planeta Kinder, recluta!',
          'Este mundo es un DESVÍO OPCIONAL — aquí el desafío iónico es de élite.',
          'Recuerda: el metal se vuelve CATIÓN (+) y el no metal se vuelve ANIÓN (−).',
          'Al cruzar las cargas, la suma total del compuesto debe dar CERO.',
          '¡Monta Na₂S, CaF₂ y AlCl₃ en la Forja de Iones — cruza las cargas con cuidado!',
          'Si prefieres saltarlo, la ruta hacia Krystália sigue abierta. ¡Buena suerte!'
        ],
        [
          '¡Este es el Planeta Bueno, recluta!',
          'Un desvío opcional para maestros del enlace COVALENTE.',
          'Aquí montas moléculas con enlaces simples, dobles y triples.',
          'Compara las representaciones: Lewis usa PUNTOS; la estructural usa RAYAS.',
          'Monta CH₄, N₂ y HCl en el Sintetizador Molecular.',
          '¡Complétalo y llévate la recompensa exclusiva — o ve directo a Ferravil!'
        ]
      ],

      lessons: {
        ionica: {
          label: 'ENLACES IÓNICOS',
          slides: [
            { title: '¿REPASEMOS?',
              lines: [
                '¿Cómo se llama la última capa? Eso es: ¡capa de valencia!',
                'Distribución electrónica: cómo están distribuidos los electrones en capas (niveles de energía) alrededor del núcleo.',
                'Ejemplo — Cloro: 2, 8, 7 electrones.'
              ],
              say: [
                'Antes de la clase nueva, recordemos: ¿cómo se llama la última capa? Eso es, ¡capa de valencia!',
                'La distribución electrónica muestra dónde quedan los electrones: en capas o niveles de energía alrededor del núcleo.',
                'Miren el cloro en la pizarra: 2 electrones en la primera capa, 8 en la segunda y 7 en la última. ¡Guarden ese 7!'
              ] },
            { title: '¿QUÉ ES UN ENLACE QUÍMICO?',
              lines: [
                'Es la unión de dos o más átomos de elementos iguales o diferentes.',
                'Buscan perder, ganar o compartir electrones para quedarse estables.',
                'Linus Pauling: investigador estadounidense considerado el padre del Enlace Químico y uno de los principales químicos del siglo XX.'
              ],
              say: [
                'El enlace químico es la unión entre átomos — pueden ser iguales o diferentes.',
                'Los átomos se unen porque quieren perder, ganar o compartir electrones y así quedarse estables.',
                '¡Quien estudió esto a fondo fue Linus Pauling, el padre del enlace químico!'
              ] },
            { title: 'TEORÍA DEL OCTETO',
              lines: [
                'Regla del Octeto',
                'Objetivo: volver estables las moléculas.',
                'Teniendo 2 u 8 electrones en la capa de valencia.',
                'Teoría propuesta por Newton Lewis: la interacción atómica ocurre para que cada elemento adquiera estabilidad.'
              ],
              say: [
                'Ahora sí: ¡la Regla del Octeto! Es la base para entender todos los enlaces.',
                'El objetivo siempre es la estabilidad de las moléculas.',
                'Un átomo queda estable con 2 u 8 electrones en la capa de valencia, igual que los gases nobres.',
                'Esta teoría fue propuesta por Newton Lewis: los átomos interactúan justamente para adquirir estabilidad.'
              ] },
            { title: 'ENLACE IÓNICO',
              lines: [
                'Enlace que DONA y RECIBE electrones (transferencia de electrones).',
                'Ocurre entre átomos del grupo de los METALES y los NO METALES.',
                'El metal PIERDE electrones y forma el CATIÓN (+).',
                'El no metal GANA electrones y forma el ANIÓN (−).'
              ],
              say: [
                'En el enlace iónico no hay compartición: un átomo dona y el otro recibe electrones. ¡Es una transferencia!',
                'Ocurre entre metales y no metales.',
                'Cuando el metal pierde electrones queda positivo: es el catión.',
                'Cuando el no metal gana electrones queda negativo: es el anión. ¡Catión y anión se atraen y forman el compuesto!'
              ] },
            { title: '2 MODOS PARA RESOLVERLO',
              lines: [
                'Esquema de orbitales:',
                'Dibujamos la última capa de cada átomo con sus respectivos electrones.',
                'Donamos los electrones de los átomos metálicos a los no metálicos.',
                'Al terminar, juntamos y contamos la cantidad de átomos utilizada.'
              ],
              say: [
                'Existen dos modos de montar un enlace iónico. El primero es el esquema de orbitales.',
                'Dibujamos solo la última capa de cada átomo, con sus puntos-electrones.',
                'Los electrones del metal se donan al no metal hasta completar el octeto.',
                'Al final juntamos todo y contamos cuántos átomos de cada tipo se usaron. ¡Miren el NaCl en la pizarra!'
              ] },
            { title: '2 MODOS PARA RESOLVERLO',
              lines: [
                'Deslizador de iones:',
                'Colocamos los átomos en su forma iónica.',
                'Deslizamos los iones hacia el otro lado.',
                'Juntamos los átomos y contamos la cantidad utilizada. Ej.: Ca²⁺ y Cl⁻ → CaCl₂'
              ],
              say: [
                'El segundo modo es el deslizador de iones — ¡mi favorito!',
                'Primero escribimos cada átomo ya en forma iónica, con su carga.',
                'Después los iones se deslizan al lado contrario, trocando de posición.',
                'Las cargas se vuelven los "piecitos": Ca²⁺ con Cl⁻ da CaCl₂. ¡Contamos y listo!'
              ] },
            { title: 'RESUMIENDO LA CLASE',
              lines: [
                'Enlace iónico = transferencia de electrones.',
                'Metal pierde → catión (+) · No metal gana → anión (−).',
                'Metales + no metales forman compuestos iónicos estables (¡regla del octeto!).'
              ],
              say: [
                'Repasemos: el enlace iónico es una transferencia de electrones.',
                'El metal se vuelve catión positivo; el no metal, anión negativo.',
                'Todo eso para cumplir la regla del octeto y formar compuestos estables. ¡Excelente clase, científicos!'
              ] }
          ]
        },

        covalente: {
          label: 'ENLACES COVALENTES',
          slides: [
            { title: 'ENLACE COVALENTE',
              lines: [
                'Caracterizado por la COMPARTICIÓN de uno o más pares de electrones entre átomos.',
                'Objetivo: formar moléculas ESTABLES.',
                'Generalmente ocurre entre los NO METALES y el HIDRÓGENO.'
              ],
              say: [
                'A diferencia del iónico, aquí nadie dona ni roba electrón: los átomos COMPARTEN pares de electrones.',
                'Compartiendo, todos completan la valencia y forman moléculas estables.',
                'Este enlace ocurre generalmente entre no metales — y también con el hidrógeno.'
              ] },
            { title: 'EJEMPLO: GAS METANO (CH₄)',
              lines: [
                'El carbono comparte electrones con 4 hidrógenos.',
                'Todos alcanzan la estabilidad y forman la molécula de CH₄.'
              ],
              say: [
                'Miren el gas metano, ¡el de las vacas! El carbono comparte electrones con cuatro hidrógenos.',
                'Así todos quedan estables: nace la molécula de CH₄.'
              ] },
            { title: 'FÓRMULAS DEL ENLACE COVALENTE',
              lines: [
                '1ª) Fórmula molecular: indica la cantidad de átomos de cada elemento que forma la molécula originada a partir de enlaces covalentes.',
                'Ejemplo: H₂O'
              ],
              say: [
                'Para representar las moléculas usamos tres fórmulas. La primera es la molecular.',
                'Dice cuántos átomos de cada elemento existen en la molécula: en el agua, H₂O, hay 2 hidrógenos y 1 oxígeno.'
              ] },
            { title: 'FÓRMULAS DEL ENLACE COVALENTE',
              lines: [
                '2ª) Fórmula estructural: muestra la organización de la molécula usando RAYAS que representan el enlace de cada átomo.',
                'Ejemplo: H–O–H'
              ],
              say: [
                'La segunda es la estructural, hecha de rayas.',
                'Cada raya representa un enlace: vean el agua, H–O–H.'
              ] },
            { title: 'FÓRMULAS DEL ENLACE COVALENTE',
              lines: [
                '3ª) Fórmula de Lewis: usa la organización de la fórmula estructural y sustituye cada raya de los enlaces por "dos bolitas", que representan los electrones.'
              ],
              say: [
                '¡Y la tercera es la famosa fórmula de Lewis!',
                'Tomamos la estructural y cambiamos cada raya por dos bolitas — los electrones compartidos.'
              ] },
            { title: 'TIPOS DE ENLACE COVALENTE',
              lines: [
                'SIMPLE: el átomo compartió solo 1 electrón de su capa de valencia. Ej.: H–O–H',
                'DOBLE: compartió 2 electrones. Ej.: O=C=O',
                'TRIPLE: compartió 3 electrones. Ej.: N≡N'
              ],
              say: [
                'Los enlaces covalentes pueden ser simples: un único electrón compartido, como entre H y O en el agua.',
                'Pueden ser dobles: dos electrones compartidos, como en el dióxido de carbono, O=C=O — ¡y también en el O₂!',
                'Y pueden ser triples: tres electrones compartidos, como en el nitrógeno del aire, N≡N.'
              ] },
            { title: 'RECAPITULANDO',
              lines: [
                'Covalente = compartición de electrones (no metales + hidrógeno).',
                'Fórmulas: molecular (cantidad), estructural (rayas) y Lewis (bolitas).',
                'Tipos: simple, doble y triple.'
              ],
              say: [
                'Recapitulando: covalente es compartición entre no metales e hidrógeno.',
                'Lo representamos con las fórmulas molecular, estructural y de Lewis.',
                'Y los enlaces pueden ser simples, dobles o triples.'
              ] },
            { title: '¿VAMOS A ENTRENAR?',
              lines: [
                'Ahora te toca a ti, joven científico.',
                'Entrena abajo lo que aprendiste:'
              ],
              say: [
                '¡Llegó la hora del entrenamiento! Elige un desafío abajo y buena práctica.',
                'En Lewis usas bolitas; en Estructural, rayas. ¡Después vuelve aquí para continuar!'
              ] }
          ]
        },

        metalica: {
          label: 'ENLACES METÁLICOS',
          slides: [
            { title: 'REPASO RÁPIDO...',
              lines: [
                'Enlace iónico: pérdida o ganancia de electrones, formando el catión y el anión.',
                'Enlace covalente: compartición de electrones, formando la molécula.'
              ],
              say: [
                '¡Repasemos rápidamente los dos enlaces que ya dominamos!',
                'Iónico: pérdida o ganancia de electrones — aparecen el catión y el anión. Covalente: compartición — nace la molécula.'
              ] },
            { title: 'OBJETIVOS DE LA CLASE',
              lines: [
                'Conocer las características de los metales;',
                'Identificar los metales en la tabla periódica;',
                'Reconocer diferentes procesos de enlaces químicos;',
                'Conocer los enlaces metálicos.'
              ],
              say: [
                'En esta clase vamos a conocer las características de los metales.',
                'Vamos a localizarlos en la tabla periódica.',
                'Reconocer un proceso más de enlace químico…',
                '…y ¡finalmente entender los enlaces metálicos!'
              ] },
            { title: '¿DÓNDE ESTÁN LOS METALES EN LA TABLA PERIÓDICA?',
              lines: [
                'Los metales son elementos caracterizados por el BRILLO, la RESISTENCIA y la CONDUCTIVIDAD TÉRMICA y ELÉCTRICA.',
                'Mira en la tabla la región ocupada por los metales.'
              ],
              say: [
                'Los metales tienen características muy marcadas: brillo, resistencia y conducir calor y electricidad.',
                'Es aquella enorme región dorada de la tabla periódica — hierro, aluminio, cobre, oro… ¡todos ahí!'
              ] },
            { title: 'ENLACE METÁLICO',
              lines: [
                'En el enlace metálico, los átomos neutros y los cationes quedan SUMERGIDOS en la nube electrónica o MAR DE ELECTRONES.',
                'Se forma solamente entre átomos de METALES — del mismo elemento químico o de elementos diferentes.',
                'Los átomos de metales tienden a formar CATIÓNES.'
              ],
              say: [
                'Llegamos a la estrella de la clase: imagina átomos neutros y cationes sumergidos dentro de una nube de electrones. ¡Es el enlace metálico!',
                'Solo ocurre entre metales — puede ser el mismo elemento o elementos diferentes, como en las aleaciones.',
                '¿Y por qué pasa eso? Porque los metales tienen pocos electrones de valencia y tendencia a perderlos, volviéndose cationes.'
              ] },
            { title: 'FORMACIÓN DEL MAR DE ELECTRONES',
              lines: [
                'Los electrones de la CAPA DE VALENCIA salen de esa capa haciendo que el átomo se vuelva un CATIÓN.',
                'Después de salir, los electrones pasan a RODEAR los cationes formando un verdadero MAR DE ELECTRONES.'
              ],
              say: [
                'Observen la animación: los electrones de la capa de valencia abandonan el átomo… ¡y él se vuelve un catión!',
                'Esos electrones, venidos de todos los átomos del metal, pasan a rondar los cationes — forman el famoso mar de electrones. Nadie es de nadie: ¡son libres!'
              ] },
            { title: 'NUBE ELECTRÓNICA Y ATRACCIÓN',
              lines: [
                'Los electrones se mueven LIBREMENTE por el material, formando la "nube electrónica".',
                'Esa "nube electrónica" es responsable de la FUERTE ATRACCIÓN ENTRE LOS CATIÓNES.',
                'Atracción electrostática: carga (+) de los cationes ↔ carga (−) de los electrones libres.'
              ],
              say: [
                'Dentro del metal estos electrones se mueven libremente — por eso lo llamamos nube electrónica o electrones deslocalizados.',
                'Y esa nube pegajosa es la que mantiene los cationes juntos, en una fuerte atracción.',
                'Como explica el video que inspiró esta parte: las cargas opuestas se atraen — los cationes positivos quedan presos en el mar negativo de electrones. ¡Algunos libros llaman a estos cationes pseudocationes!'
              ] },
            { title: 'PROFUNDIZANDO: ¿POR QUÉ PASA ESTO?',
              lines: [
                'Los metales tienen POCOS electrones de valencia y fuerte tendencia a DONARLOS.',
                'Los electrones donados quedan LIBRES/DESLOCALIZADOS — no pertenecen a un único átomo.',
                'Resultado: un mar de electrones que une todos los cationes del metal.'
              ],
              say: [
                'Un detalle importante del video: el metal dona electrones con facilidad porque tiene pocos en la última capa.',
                'Una vez libres, ya no pertenecen a átomo ninguno — circulan por todo el metal.',
                'Ese mar colectivo funciona como una "cola" que mantiene toda la estructura metálica unida.'
              ] },
            { title: 'DE LA ESTRUCTURA A LAS PROPIEDADES',
              lines: [
                'CONDUCTIVIDAD ELÉCTRICA: los electrones libres se mueven cuando aplicamos tensión.',
                'CONDUCTIVIDAD TÉRMICA: los electrones veloces llevan energía por el material.',
                'BRILLO: los electrones libres interactúan con la luz y la reemiten.',
                'MALEABILIDAD Y DUCTILIDAD: los cationes se deslizan en el mar sin romper la atracción.'
              ],
              say: [
                'Ahora la magia: ¡la estructura del enlace explica las propiedades de los metales! Aplicando tensión, los electrones libres fluyen — ¡corriente eléctrica!',
                'El calor también viaja rápido: los electrones velozes esparcen energía por el material.',
                '¿Y el brillo? La luz choca con los electrones libres y ellos la reemiten. ¡Metal reluciente!',
                '¿Martillar sin romper? Los cationes se escurren entre los electrones y la atracción sigue — ¡maleabilidad y ductilidad!'
              ] },
            { title: 'RESUMEN DE LA CLASE',
              lines: [
                'ESTRUCTURA DEL ENLACE → MAR DE ELECTRONES',
                'MOVIMIENTO DE LOS ELECTRONES → PROPIEDADES DE LOS METALES',
                'Brillo · Resistencia · Conductividad térmica y eléctrica'
              ],
              say: [
                'Fijemos esa cadena: la estructura del enlace crea el mar de electrones.',
                'El movimiento de esos electrones explica las propiedades de los metales.',
                'Brillo, resistencia y conductividades térmica y eléctrica — ¡todo empieza en el mar de electrones! Para reforzar, vean el video "Química: Metales y Enlaces Metálicos". ¡Excelente clase!'
              ] }
          ]
        }
      }
    }
  };
})();
