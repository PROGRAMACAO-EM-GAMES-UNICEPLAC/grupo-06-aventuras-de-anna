// Project Anna — main.js
// Ponto de entrada principal da campanha Project Anna 2.0:
// - Importa configurações e dados de js/config.js
// - Importa o gerenciador centralizado de áudio de js/audio.js
// - Importa o motor reutilizável de fases de js/level.js e as cutscenes/finais de js/cutscenes.js
// - Inicializa o motor Kaboom.js no canvas 1280x720 (proporção 16:9)
// - Fluxo da campanha: "menu" -> "casa" -> "rua" -> "rua_final" -> "quiz" ->
//   ("cutscene_normal" -> "ending_normal") ou ("cutscene_secreta" -> "ending_secreto") / "gameover"
//
// Kaboom.js versão: 3000.1.17
// CDN: https://cdn.jsdelivr.net/npm/kaboom@3000.1.17/dist/kaboom.mjs

import kaboom from "https://cdn.jsdelivr.net/npm/kaboom@3000.1.17/dist/kaboom.mjs";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PALETTE,
  QUIZ_QUESTIONS,
  LEVELS,
} from "./config.js";
import { audio } from "./audio.js";
import { registerLevel, levelDebug } from "./level.js";
import { registerCutscenesAndEndings } from "./cutscenes.js";
import {
  campaign,
  resetCampaign,
  LEVEL_ORDER,
  collectCoxinha,
  isCoxinhaCollected,
  getCollectedCoxinhaCount,
  hasAllCoxinhas,
} from "./state.js";

const canvas = document.getElementById("game-canvas");

// Inicialização do motor Kaboom.js
const k = kaboom({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  canvas: canvas,
  scale: 1,
  letterbox: true,
  background: PALETTE.bg,
});

// Inicializa o sistema centralizado de áudio com a instância do Kaboom
audio.init(k);

// Helpers de teste e automação expostos no window de forma controlada
window.__triggerTimeout = () => k.go("gameover", { reason: "timeout" });
window.__triggerQuiz = (remaining = 40) => k.go("quiz", { remainingTime: remaining });
window.__triggerWin = (score = 3) => k.go("victory", { score: score });
window.__triggerCollision = (type = "onibus") => {
  audio.playHit(type);
  k.go("gameover", { reason: "collision" });
};
window.__audioManager = audio;
window.__campaign = campaign;
window.__campaignHelpers = {
  resetCampaign,
  collectCoxinha,
  isCoxinhaCollected,
  getCollectedCoxinhaCount,
  hasAllCoxinhas,
};
window.__levelDebug = levelDebug;
window.__go = (scene, data) => k.go(scene, data);

// Nova tentativa: cronômetro cheio e volta sempre para a primeira fase (Casa).
function startCampaign() {
  audio.onPlayerRespawn();
  resetCampaign();
  k.go(LEVEL_ORDER[0]);
}

// Nota: a tecla global 'M' (Mute/Unmute) é gerenciada centralmente por audio.setupGlobalKeyListener()
// em js/audio.js, funcionando em todas as cenas sem duplicação de listeners.

// -------------------------------------------------------------
// 1. CARREGAMENTO DOS ASSETS GRÁFICOS
// -------------------------------------------------------------
function loadGameAssets() {
  // Sprites de Anna
  k.loadSprite("anna_costas", "assets/sprites/anna_costas.png");
  k.loadSprite("anna_esquerda", "assets/sprites/anna_esquerda.png");
  k.loadSprite("anna_direita", "assets/sprites/anna_direita.png");

  // Sprites de Obstáculos (Ônibus e Sono)
  k.loadSprite("onibus_azul_dir", "assets/sprites/onibus_azul_direita.png");
  k.loadSprite("onibus_azul_esq", "assets/sprites/onibus_azul_esquerda.png");
  k.loadSprite("onibus_amarelo_dir", "assets/sprites/onibus_amarelo_direita.png");
  k.loadSprite("onibus_amarelo_esq", "assets/sprites/onibus_amarelo_esquerda.png");
  k.loadSprite("onibus_creme_dir", "assets/sprites/onibus_creme_direita.png");
  k.loadSprite("onibus_creme_esq", "assets/sprites/onibus_creme_esquerda.png");
  k.loadSprite("sono_nuvem", "assets/sprites/sono_nuvem.png");

  // HUD, Colecionáveis e Cenários
  k.loadSprite("relogio_hud", "assets/sprites/relogio_hud.png");
  k.loadSprite("coxinha", "assets/sprites/coxinha.png");
  k.loadSprite("bg_asfalto", "assets/backgrounds/pista_asfalto_320.png");
  k.loadSprite("bg_faculdade", "assets/backgrounds/calcada_faculdade.png");

  // Piso da casa (Kit_piso_casa_lilas): ladrilhos A/B 80x80
  k.loadSprite("casa_piso_a", "assets/backgrounds/casa_piso_ladrilho_a.png");
  k.loadSprite("casa_piso_b", "assets/backgrounds/casa_piso_ladrilho_b.png");

  // Piso da rua e calçadas (Kit_pista_pixel e Kit_calcada_rio_asfalto)
  k.loadSprite("rua_asfalto_base", "assets/backgrounds/rua_asfalto_base_320.png");
  k.loadSprite("rua_tracejado", "assets/backgrounds/rua_tracejado_80x6.png");
  k.loadSprite("calcada_borda_sup", "assets/backgrounds/calcada_borda_sup_1280x12.png");
  k.loadSprite("calcada_borda_inf", "assets/backgrounds/calcada_borda_inf_1280x12.png");
  k.loadSprite("calcada_rio_piso", "assets/backgrounds/calcada_rio_piso_1280x136.png");
}

loadGameAssets();

// -------------------------------------------------------------
// 2. CENA: MENU INICIAL ("menu")
// -------------------------------------------------------------
k.scene("menu", () => {
  levelDebug.scene = "menu";
  audio.stopMusic();

  // Fundo com visual urbano e institucional
  k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(...PALETTE.bg)]);

  // Faixa de asfalto decorativa no fundo
  k.add([
    k.sprite("bg_asfalto", { width: GAME_WIDTH, height: 240 }),
    k.pos(0, 480),
    k.opacity(0.4),
    k.z(0),
  ]);

  // Decoração de ônibus cruzando no menu
  const menuBus = k.add([
    k.sprite("onibus_azul_dir", { width: 120, height: 40 }),
    k.pos(-150, 580),
    k.z(1),
  ]);
  menuBus.onUpdate(() => {
    menuBus.pos.x += 120 * k.dt();
    if (menuBus.pos.x > GAME_WIDTH + 60) {
      menuBus.pos.x = -150;
    }
  });

  // Sprite de Anna com animação suave de respiração (bounce vertical)
  const annaMenu = k.add([
    k.sprite("anna_costas", { width: 90, height: 90 }),
    k.pos(k.center().x, 220),
    k.anchor("center"),
    k.z(2),
  ]);
  let timePassed = 0;
  annaMenu.onUpdate(() => {
    timePassed += k.dt();
    annaMenu.pos.y = 220 + Math.sin(timePassed * 3) * 6;
  });

  // Título Principal
  k.add([
    k.text("PROJECT ANNA", { size: 68 }),
    k.pos(k.center().x, 110),
    k.anchor("center"),
    k.color(...PALETTE.textLight),
    k.z(2),
  ]);

  // Subtítulo
  k.add([
    k.text("A jornada universitária contra o relógio!", { size: 22 }),
    k.pos(k.center().x, 300),
    k.anchor("center"),
    k.color(180, 190, 220),
    k.z(2),
  ]);

  // Botão INICIAR JOGO
  const startBtn = k.add([
    k.rect(340, 70, { radius: 10 }),
    k.pos(k.center().x, 390),
    k.anchor("center"),
    k.color(...PALETTE.annaBody),
    k.outline(3, [224, 215, 247]),
    k.area(),
    k.z(3),
    "startButton",
  ]);

  const startBtnText = k.add([
    k.text("INICIAR JOGO", { size: 28 }),
    k.pos(k.center().x, 390),
    k.anchor("center"),
    k.color(...PALETTE.textLight),
    k.z(4),
  ]);

  // Interatividade do botão (hover e clique)
  startBtn.onHoverUpdate(() => {
    startBtn.color = k.rgb(130, 80, 190);
    startBtn.scale = k.vec2(1.05);
    startBtnText.scale = k.vec2(1.05);
  });
  startBtn.onHoverEnd(() => {
    startBtn.color = k.rgb(...PALETTE.annaBody);
    startBtn.scale = k.vec2(1);
    startBtnText.scale = k.vec2(1);
  });

  function startGame() {
    audio.playMusic(); // Primeira interação do usuário desbloqueia o áudio
    startCampaign();
  }

  startBtn.onClick(startGame);
  k.onKeyPress("enter", startGame);
  k.onKeyPress("space", startGame);

  // Instruções de controle no rodapé
  k.add([
    k.text("Controles: [W/A/D] ou [SETAS] para mover  |  [M] para Silenciar/Reativar Áudio", {
      size: 16,
      align: "center",
    }),
    k.pos(k.center().x, 670),
    k.anchor("center"),
    k.color(140, 150, 180),
    k.z(2),
  ]);
});

// -------------------------------------------------------------
// 3. FASES DA CAMPANHA E CUTSCENES (js/level.js e js/cutscenes.js)
// -------------------------------------------------------------
registerLevel(k, LEVELS.casa);
registerLevel(k, LEVELS.rua);
registerLevel(k, LEVELS.rua_final);
registerCutscenesAndEndings(k, { startCampaign });

// -------------------------------------------------------------
// 4. CENA: PROVA FINAL ("quiz")
// -------------------------------------------------------------
k.scene("quiz", (data = {}) => {
  const remainingTime = data.remainingTime ?? Math.ceil(campaign.timeLeft);
  let currentQuestionIndex = 0;
  let selectedOption = 0;
  let quizActive = true;
  Object.assign(levelDebug, {
    scene: "quiz",
    levelId: "quiz",
    active: true,
    coxinhasCollected: getCollectedCoxinhaCount(),
    allCoxinhas: hasAllCoxinhas(),
  });

  // Mantém a trilha sonora ativa durante a prova
  audio.playMusic();

  // Fundo e Cabeçalho
  k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(18, 22, 36)]);
  k.add([k.rect(GAME_WIDTH, 70), k.pos(0, 0), k.color(...PALETTE.safeZoneGoal)]);
  k.add([k.sprite("anna_costas", { width: 44, height: 44 }), k.pos(30, 13), k.z(2)]);
  k.add([k.text("FACULDADE — PROVA FINAL DECISIVA", { size: 24 }), k.pos(85, 24), k.color(...PALETTE.textLight)]);
  k.add([k.sprite("coxinha", { width: 24, height: 24 }), k.pos(GAME_WIDTH - 530, 23), k.z(2)]);
  k.add([
    k.text(`COXINHAS: ${getCollectedCoxinhaCount()}/3`, { size: 18 }),
    k.pos(GAME_WIDTH - 498, 26),
    k.color(...(hasAllCoxinhas() ? PALETTE.accentSuccess : PALETTE.textLight)),
  ]);
  k.add([k.sprite("relogio_hud", { width: 28, height: 28 }), k.pos(GAME_WIDTH - 330, 21), k.z(2)]);
  k.add([
    k.text(`TEMPO DA TRAVESSIA: ${remainingTime}s`, { size: 18 }),
    k.pos(GAME_WIDTH - 290, 26),
    k.color(...PALETTE.accentSuccess),
  ]);

  // Card da Questão
  k.add([
    k.rect(GAME_WIDTH - 120, 560, { radius: 12 }),
    k.pos(60, 100),
    k.color(...PALETTE.quizBox),
    k.outline(3, PALETTE.annaBody),
  ]);

  const progressText = k.add([k.text("", { size: 18 }), k.pos(90, 125), k.color(160, 170, 210)]);
  const topicText = k.add([k.text("", { size: 14 }), k.pos(GAME_WIDTH - 420, 125), k.color(...PALETTE.timerWarning)]);
  const questionTitle = k.add([k.text("", { size: 24, width: GAME_WIDTH - 200 }), k.pos(90, 165), k.color(255, 255, 255)]);

  const optionBoxes = [];
  const optionTexts = [];

  for (let i = 0; i < 3; i++) {
    const boxY = 270 + i * 100;

    const box = k.add([
      k.rect(GAME_WIDTH - 180, 80, { radius: 8 }),
      k.pos(90, boxY),
      k.color(...PALETTE.quizOptionBg),
      k.outline(2, [60, 70, 100]),
    ]);

    const txt = k.add([
      k.text("", { size: 20, width: GAME_WIDTH - 220 }),
      k.pos(120, boxY + 28),
      k.color(...PALETTE.textLight),
    ]);

    optionBoxes.push(box);
    optionTexts.push(txt);
  }

  k.add([
    k.text("Controles: [1], [2], [3] para responder direto  |  [SETAS] para navegar + [ENTER] para confirmar", {
      size: 16,
      align: "center",
    }),
    k.pos(k.center().x, 615),
    k.anchor("center"),
    k.color(140, 150, 180),
  ]);

  function renderCurrentQuestion() {
    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    progressText.text = `QUESTÃO ${currentQuestionIndex + 1} DE ${QUIZ_QUESTIONS.length}`;
    topicText.text = `TÓPICO: ${q.topic}`;
    questionTitle.text = q.question;

    for (let i = 0; i < 3; i++) {
      optionTexts[i].text = q.options[i].text;
    }
    updateSelectionHighlight();
  }

  function updateSelectionHighlight() {
    for (let i = 0; i < 3; i++) {
      if (i === selectedOption) {
        optionBoxes[i].color = k.rgb(...PALETTE.quizOptionSelected);
        optionBoxes[i].outline.color = k.rgb(224, 215, 247);
        optionBoxes[i].outline.width = 3;
      } else {
        optionBoxes[i].color = k.rgb(...PALETTE.quizOptionBg);
        optionBoxes[i].outline.color = k.rgb(60, 70, 100);
        optionBoxes[i].outline.width = 2;
      }
    }
  }

  function submitAnswer(chosenIndex) {
    if (!quizActive) return;
    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    const isCorrect = q.options[chosenIndex].isCorrect;

    if (!isCorrect) {
      quizActive = false;
      levelDebug.active = false;
      k.go("gameover", { reason: "quiz_failed" });
      return;
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < QUIZ_QUESTIONS.length) {
      selectedOption = 0;
      renderCurrentQuestion();
    } else {
      quizActive = false;
      levelDebug.active = false;
      audio.playSfx("sfx_vitoria");
      const targetCutscene = hasAllCoxinhas() ? "cutscene_secreta" : "cutscene_normal";
      k.go(targetCutscene, { score: QUIZ_QUESTIONS.length });
    }
  }

  k.onKeyPress("up", () => {
    if (!quizActive) return;
    selectedOption = (selectedOption + 2) % 3;
    updateSelectionHighlight();
  });

  k.onKeyPress("down", () => {
    if (!quizActive) return;
    selectedOption = (selectedOption + 1) % 3;
    updateSelectionHighlight();
  });

  k.onKeyPress("enter", () => submitAnswer(selectedOption));
  k.onKeyPress("space", () => submitAnswer(selectedOption));
  k.onKeyPress("1", () => submitAnswer(0));
  k.onKeyPress("2", () => submitAnswer(1));
  k.onKeyPress("3", () => submitAnswer(2));

  renderCurrentQuestion();
});

// -------------------------------------------------------------
// 5. CENA: VITÓRIA DEFINITIVA ("victory")
// -------------------------------------------------------------
k.scene("victory", (data = { score: 3 }) => {
  levelDebug.scene = "victory";
  // Pausa a trilha e dispara o som triunfante oficial da vitória
  audio.pauseMusic();
  audio.playSfx("sfx_vitoria");

  k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(15, 28, 48)]);
  k.add([k.sprite("anna_costas", { width: 80, height: 80 }), k.pos(k.center().x, k.center().y - 180), k.anchor("center"), k.z(2)]);
  k.add([k.text("PARABÉNS! ANNA PASSOU NO SEMESTRE!", { size: 48, align: "center" }), k.pos(k.center().x, k.center().y - 80), k.anchor("center"), k.color(...PALETTE.accentSuccess)]);
  k.add([k.text("VITÓRIA COMPLETA!", { size: 36, align: "center" }), k.pos(k.center().x, k.center().y - 20), k.anchor("center"), k.color(...PALETTE.annaBody)]);
  k.add([k.text(`Anna cruzou o trânsito da cidade e gabaritou as ${data.score} questões da prova!`, { size: 24, align: "center" }), k.pos(k.center().x, k.center().y + 40), k.anchor("center"), k.color(...PALETTE.textLight)]);
  k.add([k.text("Pressione [ESPAÇO] ou [ENTER] para reiniciar a jornada", { size: 20, align: "center" }), k.pos(k.center().x, k.center().y + 120), k.anchor("center"), k.color(200, 200, 220)]);

  k.onKeyPress("space", startCampaign);
  k.onKeyPress("enter", startCampaign);
});

// -------------------------------------------------------------
// 6. CENA: GAME OVER ("gameover")
// -------------------------------------------------------------
k.scene("gameover", (data = { reason: "collision" }) => {
  levelDebug.scene = "gameover";
  levelDebug.lastGameOverReason = data.reason;
  // Pausa a música de fundo durante a tela de Game Over
  audio.pauseMusic();
  // Nota: Não reproduz sons genéricos de Game Over (removidos no Marco 3.1)

  k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(...PALETTE.bg)]);
  k.add([k.text("GAME OVER", { size: 64, align: "center" }), k.pos(k.center().x, k.center().y - 100), k.anchor("center"), k.color(...PALETTE.accentFail)]);

  let message = "Anna colidiu no trânsito e não conseguiu chegar a tempo!";
  if (data.reason === "timeout") {
    message = "O tempo esgotou! Anna se atrasou e perdeu a prova!";
  } else if (data.reason === "quiz_failed") {
    message = "Anna errou uma resposta e REPROVOU na prova final!";
  }

  k.add([k.text(message, { size: 24, align: "center" }), k.pos(k.center().x, k.center().y - 10), k.anchor("center"), k.color(...PALETTE.textLight)]);
  k.add([k.text("Pressione [ESPAÇO] ou [ENTER] para reiniciar a partida", { size: 20, align: "center" }), k.pos(k.center().x, k.center().y + 80), k.anchor("center"), k.color(200, 200, 220)]);

  k.onKeyPress("space", startCampaign);
  k.onKeyPress("enter", startCampaign);
});

// Inicialização: abre primeiramente na cena MENU
k.go("menu");

