# Project Anna

Um jogo arcade de travessia em pixel art com temática universitária, inspirado na mecânica clássica de *Frogger*.

<!-- Espaço reservado para captura de tela ou GIF de demonstração do jogo -->
<!-- Exemplo: ![Project Anna — Gameplay](assets/screenshots/gameplay.png) -->

---

## Sobre o jogo

Em **Project Anna**, você acompanha a corrida contra o relógio de **Anna**, uma estudante universitária que acorda atrasada no dia do exame mais decisivo do semestre. Para salvar o período letivo, ela precisa sair de casa desviando do sono, atravessar avenidas movimentadas da cidade, chegar a tempo à faculdade e gabaritar a Prova Final.

A campanha combina movimentação tática em grade (*grid-based*), gerenciamento de um **cronômetro global contínuo**, colecionáveis opcionais e desafio acadêmico sem sistema de vidas: qualquer colisão fatal ou resposta incorreta no exame reprova a estudante e reinicia toda a jornada desde a primeira fase.

---

## Objetivo e mecânicas

A campanha é dividida em **três fases de obstáculos** seguidas pela **Prova Final**:

1. **Fase 1 — Casa de Anna:** travessia residencial sem zonas seguras intermediárias, desviando exclusivamente das **nuvens de sono** (`ZzZ`).
2. **Fase 2 — Rua:** travessia urbana com calçada segura intermediária, **ônibus** em sentidos opostos e **relógios penalizadores**.
3. **Fase 3 — Rua Final:** travessia de alta intensidade rumo à entrada da faculdade, combinando simultaneamente **ônibus**, **nuvens de sono** e **relógios** entre duas calçadas intermediárias seguras.
4. **Prova Final (Quiz):** exame decisivo com 3 questões de múltipla escolha sobre Computação (Algoritmos, Engenharia de Software e Arquitetura de Computadores). O cronômetro permanece pausado durante a prova, mas errar qualquer questão resulta em reprovação imediata.

### Regras de tempo, obstáculos e finais

* **Cronômetro Global (`75s` iniciais):** compartilhado continuamente entre as três fases de travessia.
* **Bônus por Fase Concluída (`+8s`):** alcançar a saída de cada fase concede `+8` segundos ao cronômetro global.
* **Obstáculos Letais (Ônibus e Nuvens de Sono):** causam derrota imediata e reiniciam a campanha na Casa.
* **Inimigo Não-Letal (Relógio, `-7s`):** tocar em um relógio subtrai `7` segundos do cronômetro global e remove aquele relógio sem encerrar a tentativa (exceto se o tempo restante chegar a zero).
* **Coxinhas Colecionáveis e Dois Finais:**
  * Há **3 coxinhas douradas** na campanha (uma por fase, em posições sorteadas a cada tentativa).
  * **Final Normal:** alcançado ao gabaritar a Prova Final sem ter coletado todas as 3 coxinhas na mesma tentativa.
  * **Final Secreto:** desbloqueado ao coletar as **3 coxinhas na mesma tentativa** e gabaritar a Prova Final.

---

## Controles

### Movimentação (Fases de Travessia)

* **Avançar (Cima):** `W` ou `Seta para Cima`
* **Esquerda:** `A` ou `Seta para a Esquerda`
* **Direita:** `D` ou `Seta para a Direita`
* *Nota:* não é permitido recuar (`S` / `Seta para Baixo`).

### Prova Final (Quiz)

* **Resposta direta:** teclas `1`, `2` ou `3`
* **Navegação e confirmação:** `Setas para Cima/Baixo` para selecionar + `Enter` ou `Barra de Espaço` para confirmar

### Cutscenes, Telas Finais e Áudio

* **Avançar diálogos nas cutscenes:** `Enter`, `Barra de Espaço`, `Seta para a Direita` ou clique no botão `AVANÇAR`
* **Iniciar / Jogar novamente:** `Enter`, `Barra de Espaço` ou clique no botão da tela
* **Silenciar / Reativar áudio (Global):** tecla `M` em qualquer tela do jogo

---

## Tecnologias utilizadas

O projeto foi construído exclusivamente com tecnologias nativas da web, sem *frameworks*, *bundlers* ou etapas de compilação:

* **HTML5:** estrutura semântica e elemento `<canvas>` (`1280×720`).
* **CSS3:** layout responsivo com preservação estrita da proporção `16:9` (`aspect-ratio: 16 / 9`).
* **JavaScript (ES Modules):** arquitetura modular nativa (`js/main.js`, `js/config.js`, `js/state.js`, `js/level.js`, `js/cutscenes.js`, `js/audio.js`).
* **Kaboom.js (`v3000.1.17`):** biblioteca de renderização 2D, cenas, sprites, áudio e colisões carregada via CDN (`jsDelivr`).

---

## Instruções de execução local

Por utilizar módulos ES (`<script type="module">`) e carregamento de recursos estáticos, o jogo deve ser servido por um servidor HTTP estático (não abra o `index.html` diretamente via protocolo `file://`):

1. Abra um terminal na pasta raiz do projeto.
2. Inicie qualquer servidor HTTP estático. Por exemplo, com Python:
   ```bash
   python -m http.server 5500
   ```
   *(ou utilize `npx serve .` / extensão **Live Server** no VS Code)*.
3. Acesse no navegador:
   ```text
   http://127.0.0.1:5500
   ```
