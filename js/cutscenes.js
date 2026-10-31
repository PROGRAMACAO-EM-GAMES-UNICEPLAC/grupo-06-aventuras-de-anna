// Project Anna — js/cutscenes.js
// Sistema narrativo de Cutscenes e Finais Normal e Secreto (Marco 7 — Project Anna 2.0).
// - Cutscene Normal -> Final Normal: quando Anna conclui o Quiz com menos de 3 coxinhas (< 3/3).
// - Cutscene Secreta -> Final Secreto: quando Anna conclui o Quiz tendo coletado as 3 coxinhas (3/3) na mesma tentativa.
//
// Nota sobre recursos gráficos:
// As ilustrações dedicadas finais ("tela de vitória" e "tela da coxinha" listadas em OQ FALTA.docx)
// ainda estão pendentes de entrega artística externa. Este módulo utiliza composições visuais
// provisórias construídas exclusivamente com os sprites e pisos pixel art já aprovados no projeto.

import { GAME_WIDTH, GAME_HEIGHT, PALETTE, CUTSCENES } from "./config.js";
import { audio } from "./audio.js";
import { campaign, getCollectedCoxinhaCount, hasAllCoxinhas } from "./state.js";
import { levelDebug } from "./level.js";

// Intervalo mínimo (ms) entre avanços de fala para evitar que entradas repetidas pulem múltiplos diálogos.
export const CUTSCENE_ADVANCE_COOLDOWN_MS = 220;

function registerCutsceneScene(k, def) {
  k.scene(def.id, (data = { score: 3 }) => {
    const isSecret = def.endingType === "secret";
    let stepIndex = 0;
    let lastAdvanceAt = performance.now();

    // Mantém a trilha sonora contínua sem duplicar instâncias
    audio.playMusic();

    // 1. Fundo e moldura temática da Cutscene
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(...(isSecret ? [20, 16, 38] : PALETTE.bg))]);

    // Cabeçalho superior
    k.add([
      k.rect(GAME_WIDTH, 64),
      k.pos(0, 0),
      k.color(...(isSecret ? [72, 34, 116] : PALETTE.safeZoneGoal)),
    ]);
    k.add([
      k.text(def.title, { size: 22 }),
      k.pos(30, 21),
      k.color(...(isSecret ? [255, 224, 130] : PALETTE.textLight)),
    ]);

    const stepBadge = k.add([
      k.text("", { size: 18 }),
      k.pos(GAME_WIDTH - 210, 23),
      k.color(...PALETTE.accentSuccess),
    ]);

    // 2. Painel visual provisório da cena (aguardando ilustrações finais "tela de vitória" / "tela da coxinha")
    k.add([
      k.rect(GAME_WIDTH - 160, 290, { radius: 12 }),
      k.pos(80, 90),
      k.color(...(isSecret ? [34, 24, 58] : [20, 28, 46])),
      k.outline(3, isSecret ? [245, 170, 50] : PALETTE.annaBody),
    ]);

    if (isSecret) {
      // Composição provisória: Restaurante Temático de Coxinhas
      k.add([
        k.rect(GAME_WIDTH - 200, 48, { radius: 8 }),
        k.pos(100, 110),
        k.color(92, 42, 132),
        k.outline(2, [255, 224, 130]),
      ]);
      k.add([
        k.text("★ RESTAURANTE TEMÁTICO DE COXINHAS ★", { size: 20, align: "center" }),
        k.pos(k.center().x, 134),
        k.anchor("center"),
        k.color(255, 224, 130),
      ]);

      // Mesa/balcão estilizado com as 3 coxinhas douradas e Anna comemorando
      k.add([
        k.rect(520, 18, { radius: 4 }),
        k.pos(k.center().x, 310),
        k.anchor("center"),
        k.color(140, 82, 48),
      ]);
      const annaSprite = k.add([
        k.sprite("anna_direita", { width: 78, height: 78 }),
        k.pos(k.center().x - 140, 255),
        k.anchor("center"),
      ]);
      const coxSprites = [-20, 60, 140].map((offsetX, i) =>
        k.add([
          k.sprite("coxinha", { width: 48, height: 48 }),
          k.pos(k.center().x + offsetX, 272),
          k.anchor("center"),
          { phaseOffset: i * 1.1 },
        ])
      );
      let animT = 0;
      annaSprite.onUpdate(() => {
        animT += k.dt();
        annaSprite.pos.y = 255 + Math.sin(animT * 4) * 4;
        coxSprites.forEach((c) => {
          c.pos.y = 272 + Math.sin(animT * 3.5 + c.phaseOffset) * 5;
        });
      });
    } else {
      // Composição provisória: Pátio da Faculdade (Final Normal)
      k.add([
        k.sprite("bg_faculdade", { quad: k.quad(0, 0.5, 1, 0.5), width: GAME_WIDTH - 200, height: 80 }),
        k.pos(100, 280),
      ]);
      const annaNormal = k.add([
        k.sprite("anna_costas", { width: 78, height: 78 }),
        k.pos(k.center().x, 225),
        k.anchor("center"),
      ]);
      let animT = 0;
      annaNormal.onUpdate(() => {
        animT += k.dt();
        annaNormal.pos.y = 225 + Math.sin(animT * 3) * 4;
      });
      k.add([
        k.sprite("relogio_hud", { width: 40, height: 40 }),
        k.pos(k.center().x - 140, 205),
      ]);
      k.add([
        k.sprite("coxinha", { width: 38, height: 38 }),
        k.pos(k.center().x + 110, 205),
      ]);
    }

    // 3. Caixa de Diálogo Narrativo
    k.add([
      k.rect(GAME_WIDTH - 160, 210, { radius: 12 }),
      k.pos(80, 405),
      k.color(...PALETTE.quizBox),
      k.outline(3, isSecret ? [245, 170, 50] : PALETTE.annaBody),
    ]);

    const locationText = k.add([
      k.text("", { size: 15 }),
      k.pos(115, 428),
      k.color(...PALETTE.timerWarning),
    ]);

    const speakerText = k.add([
      k.text("", { size: 20 }),
      k.pos(115, 456),
      k.color(...(isSecret ? [255, 224, 130] : PALETTE.accentSuccess)),
    ]);

    const dialogueBody = k.add([
      k.text("", { size: 22, width: GAME_WIDTH - 230, lineSpacing: 8 }),
      k.pos(115, 492),
      k.color(255, 255, 255),
    ]);

    // Botão interativo de avanço
    const nextBtn = k.add([
      k.rect(280, 48, { radius: 8 }),
      k.pos(GAME_WIDTH - 220, 655),
      k.anchor("center"),
      k.color(...(isSecret ? [184, 112, 24] : PALETTE.annaBody)),
      k.outline(2, [224, 215, 247]),
      k.area(),
      "nextSlideBtn",
    ]);

    const nextBtnLabel = k.add([
      k.text("AVANÇAR [ENTER / ESPAÇO] ▶", { size: 16 }),
      k.pos(GAME_WIDTH - 220, 655),
      k.anchor("center"),
      k.color(...PALETTE.textLight),
    ]);

    k.add([
      k.text("Controles: [ENTER], [ESPAÇO], [SETA DIREITA] ou clique em AVANÇAR  |  [M] Áudio", { size: 15 }),
      k.pos(80, 648),
      k.color(150, 160, 190),
    ]);

    function syncDebugState() {
      Object.assign(levelDebug, {
        scene: def.id,
        levelId: def.id,
        cutsceneId: def.id,
        active: false,
        endingType: def.endingType,
        endingPhase: "cutscene",
        cutsceneStep: stepIndex,
        slideIndex: stepIndex,
        totalSlides: def.slides.length,
        slideTotal: def.slides.length,
        coxinhasCollected: getCollectedCoxinhaCount(),
        allCoxinhas: hasAllCoxinhas(),
      });
    }

    function renderSlide() {
      const slide = def.slides[stepIndex];
      stepBadge.text = `CENA ${stepIndex + 1} DE ${def.slides.length}`;
      locationText.text = `LOCAL: ${slide.location}`;
      speakerText.text = `${slide.speaker}:`;
      dialogueBody.text = slide.text;
      if (stepIndex === def.slides.length - 1) {
        nextBtnLabel.text = "CONCLUIR [ENTER / ESPAÇO] ▶";
      } else {
        nextBtnLabel.text = "AVANÇAR [ENTER / ESPAÇO] ▶";
      }
      syncDebugState();
    }

    function advanceSlide() {
      const now = performance.now();
      if (now - lastAdvanceAt < CUTSCENE_ADVANCE_COOLDOWN_MS) {
        return false; // Bloqueia avanço múltiplo acidental por repetição rápida
      }
      lastAdvanceAt = now;

      if (stepIndex < def.slides.length - 1) {
        stepIndex += 1;
        renderSlide();
        return true;
      }

      k.go(def.endingScene, data);
      return true;
    }

    nextBtn.onClick(advanceSlide);
    k.onKeyPress("enter", advanceSlide);
    k.onKeyPress("space", advanceSlide);
    k.onKeyPress("right", advanceSlide);

    renderSlide();
  });
}

export function registerCutscenesAndEndings(k, { startCampaign }) {
  registerCutsceneScene(k, CUTSCENES.normal);
  registerCutsceneScene(k, CUTSCENES.secreta);

  // -------------------------------------------------------------
  // FINAL NORMAL ("ending_normal"): < 3 coxinhas coletadas
  // -------------------------------------------------------------
  k.scene("ending_normal", (data = { score: 3 }) => {
    const collected = getCollectedCoxinhaCount();
    const restartReadyAt = performance.now() + CUTSCENE_ADVANCE_COOLDOWN_MS;
    audio.playMusic();

    Object.assign(levelDebug, {
      scene: "ending_normal",
      levelId: "ending_normal",
      active: false,
      endingType: "normal",
      endingPhase: "final",
      coxinhasCollected: collected,
      allCoxinhas: hasAllCoxinhas(),
    });

    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(15, 28, 48)]);

    // Moldura institucional de encerramento normal
    k.add([
      k.rect(GAME_WIDTH - 160, 560, { radius: 14 }),
      k.pos(80, 80),
      k.color(20, 32, 54),
      k.outline(3, PALETTE.annaBody),
    ]);

    k.add([
      k.sprite("anna_costas", { width: 84, height: 84 }),
      k.pos(k.center().x, 165),
      k.anchor("center"),
    ]);

    k.add([
      k.text("FINAL NORMAL — APROVADA NO SEMESTRE!", { size: 40, align: "center" }),
      k.pos(k.center().x, 255),
      k.anchor("center"),
      k.color(...PALETTE.accentSuccess),
    ]);

    k.add([
      k.text(
        `Anna venceu o trânsito e acertou as ${data.score ?? 3} questões da Prova Final com ${Math.ceil(campaign.timeLeft)}s restantes!`,
        { size: 22, align: "center", width: GAME_WIDTH - 240 }
      ),
      k.pos(k.center().x, 325),
      k.anchor("center"),
      k.color(...PALETTE.textLight),
    ]);

    // Painel de status das coxinhas (mostrando que o Final Secreto ainda pode ser desbloqueado)
    k.add([
      k.rect(780, 122, { radius: 10 }),
      k.pos(k.center().x, 426),
      k.anchor("center"),
      k.color(28, 38, 64),
      k.outline(2, [92, 53, 138]),
      "coxinhaHintBox",
    ]);
    k.add([
      k.sprite("coxinha", { width: 34, height: 34 }),
      k.pos(k.center().x - 278, 394),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`COXINHAS COLETADAS NESTA TENTATIVA: ${collected}/3`, { size: 22 }),
      k.pos(k.center().x + 22, 394),
      k.anchor("center"),
      k.color(255, 224, 130),
    ]);
    k.add([
      k.text("Dica: colete as 3 coxinhas (Casa, Rua e Rua Final) na mesma partida para desbloquear o Final Secreto!", {
        size: 16,
        align: "center",
        width: 620,
        lineSpacing: 6,
      }),
      k.pos(k.center().x, 450),
      k.anchor("center"),
      k.color(180, 195, 225),
      "coxinhaHintText",
    ]);

    // Botão Jogar Novamente
    const replayBtn = k.add([
      k.rect(420, 60, { radius: 10 }),
      k.pos(k.center().x, 545),
      k.anchor("center"),
      k.color(...PALETTE.annaBody),
      k.outline(3, [224, 215, 247]),
      k.area(),
      "replayNormalBtn",
    ]);
    k.add([
      k.text("JOGAR NOVAMENTE [ENTER / ESPAÇO]", { size: 20 }),
      k.pos(k.center().x, 545),
      k.anchor("center"),
      k.color(...PALETTE.textLight),
    ]);

    function triggerReplay() {
      if (performance.now() < restartReadyAt) return;
      startCampaign();
    }

    replayBtn.onClick(triggerReplay);
    k.onKeyPress("space", triggerReplay);
    k.onKeyPress("enter", triggerReplay);
  });

  // -------------------------------------------------------------
  // FINAL SECRETO ("ending_secreto"): 3/3 coxinhas na mesma tentativa
  // -------------------------------------------------------------
  k.scene("ending_secreto", (data = { score: 3 }) => {
    const collected = getCollectedCoxinhaCount();
    const restartReadyAt = performance.now() + CUTSCENE_ADVANCE_COOLDOWN_MS;
    audio.playMusic();

    Object.assign(levelDebug, {
      scene: "ending_secreto",
      levelId: "ending_secreto",
      active: false,
      endingType: "secreto",
      endingPhase: "final",
      coxinhasCollected: collected,
      allCoxinhas: hasAllCoxinhas(),
    });

    // Fundo especial violeta-dourado do Restaurante Temático de Coxinhas
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(24, 14, 42)]);

    k.add([
      k.rect(GAME_WIDTH - 140, 580, { radius: 16 }),
      k.pos(70, 70),
      k.color(38, 22, 66),
      k.outline(4, [245, 170, 50]),
    ]);

    // Faixa dourada superior de recompensa secreta
    k.add([
      k.rect(680, 44, { radius: 8 }),
      k.pos(k.center().x, 118),
      k.anchor("center"),
      k.color(96, 44, 140),
      k.outline(2, [255, 224, 130]),
    ]);
    k.add([
      k.text("★ FINAL SECRETO DESBLOQUEADO — MESTRA DAS COXINHAS ★", { size: 20, align: "center" }),
      k.pos(k.center().x, 118),
      k.anchor("center"),
      k.color(255, 224, 130),
    ]);

    // Composição central: Anna + 3 coxinhas douradas animadas
    k.add([
      k.sprite("anna_direita", { width: 84, height: 84 }),
      k.pos(k.center().x - 120, 210),
      k.anchor("center"),
    ]);
    [-20, 45, 110].forEach((dx, idx) => {
      const c = k.add([
        k.sprite("coxinha", { width: 52, height: 52 }),
        k.pos(k.center().x + dx, 215),
        k.anchor("center"),
      ]);
      let t = idx * 0.9;
      c.onUpdate(() => {
        t += k.dt();
        c.pos.y = 215 + Math.sin(t * 4) * 5;
      });
    });

    k.add([
      k.text("BANQUETE NO RESTAURANTE TEMÁTICO DE COXINHAS!", { size: 34, align: "center" }),
      k.pos(k.center().x, 295),
      k.anchor("center"),
      k.color(255, 224, 130),
    ]);

    k.add([
      k.text(
        `Jornada 100% perfeita! Anna coletou todas as 3 coxinhas na mesma tentativa, venceu o relógio (${Math.ceil(campaign.timeLeft)}s restantes) e gabaritou as ${data.score ?? 3} questões da Prova Final!`,
        { size: 21, align: "center", width: GAME_WIDTH - 240 }
      ),
      k.pos(k.center().x, 360),
      k.anchor("center"),
      k.color(...PALETTE.textLight),
    ]);

    // Card de conquistas desbloqueadas
    k.add([
      k.rect(960, 96, { radius: 10 }),
      k.pos(k.center().x, 448),
      k.anchor("center"),
      k.color(26, 16, 48),
      k.outline(2, [76, 201, 144]),
    ]);
    k.add([
      k.text("CONQUISTA ESPECIAL: [✓] Casa   [✓] Rua   [✓] Rua Final   —   3/3 COXINHAS DOURADAS", {
        size: 18,
        align: "center",
        width: 920,
      }),
      k.pos(k.center().x, 432),
      k.anchor("center"),
      k.color(...PALETTE.accentSuccess),
    ]);
    k.add([
      k.text("Anna celebra o fim do semestre com rodízio livre de coxinhas douradas!", {
        size: 17,
        align: "center",
      }),
      k.pos(k.center().x, 466),
      k.anchor("center"),
      k.color(255, 224, 130),
    ]);

    // Botão Jogar Novamente
    const replaySecretBtn = k.add([
      k.rect(440, 60, { radius: 10 }),
      k.pos(k.center().x, 555),
      k.anchor("center"),
      k.color(196, 122, 24),
      k.outline(3, [255, 243, 218]),
      k.area(),
      "replaySecretBtn",
    ]);
    k.add([
      k.text("JOGAR NOVAMENTE [ENTER / ESPAÇO]", { size: 20 }),
      k.pos(k.center().x, 555),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    function triggerSecretReplay() {
      if (performance.now() < restartReadyAt) return;
      startCampaign();
    }

    replaySecretBtn.onClick(triggerSecretReplay);
    k.onKeyPress("space", triggerSecretReplay);
    k.onKeyPress("enter", triggerSecretReplay);
  });
}
