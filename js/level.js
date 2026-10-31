// Project Anna — js/level.js
// Motor das fases de obstáculos da campanha 2.0 (Casa agora; Rua e Rua Final nos próximos marcos).
// Uma fase = uma cena Kaboom de tela cheia, descrita por um objeto em LEVELS (config.js).
// Mecânica compartilhada: movimento em grade, cronômetro GLOBAL (state.js), colisão fatal.

import {
  GAME_WIDTH,
  GRID_SIZE,
  COLS,
  ROWS,
  ANNA_SPRITE_SIZE,
  ANNA_CELL_OFFSET,
  PALETTE,
  LANE_MARGIN,
  LANE_RING,
  LEVEL_COMPLETE_BONUS,
  CLOCK_TIME_PENALTY,
} from "./config.js";
import { audio } from "./audio.js";
import {
  campaign,
  sceneAfter,
  collectCoxinha,
  isCoxinhaCollected,
  getCollectedCoxinhaCount,
  hasAllCoxinhas,
} from "./state.js";

// Posição X (canto esquerdo) do obstáculo `index` da faixa `lane` no instante `t` (segundos).
// Função pura: também é usada pelo verificador de justiça das fases.
export function obstacleX(lane, index, t) {
  const spacing = LANE_RING / lane.count;
  const raw = lane.phase + index * spacing + lane.speed * t;
  return (((raw % LANE_RING) + LANE_RING) % LANE_RING) - LANE_MARGIN;
}

// Leitura do estado da fase em andamento (usado apenas por testes automatizados).
export const levelDebug = {
  scene: null,
  levelId: null,
  time: 0,
  col: 0,
  row: 0,
  active: false,
  clocksHit: 0,
  coxinhasCollected: 0,
  allCoxinhas: false,
};

// Piso de cada ambiente. Cada fase usa os recursos do seu próprio kit visual, sem esticar texturas.
function drawFloor(k, floor) {
  if (floor === "casa") {
    // Kit_piso_casa_lilas: ladrilhos A/B 80x80 em xadrez, sem margem nem escala.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        k.add([
          k.sprite((c + r) % 2 === 0 ? "casa_piso_a" : "casa_piso_b"),
          k.pos(c * GRID_SIZE, r * GRID_SIZE),
          k.z(0),
        ]);
      }
    }
  } else if (floor === "rua") {
    // Kit_calcada_rio_asfalto: calçada de 80px composta por borda superior (12px),
    // recorte 1:1 do piso de pedra (56px) e borda inferior contínua (12px), sem distorção.
    const drawSidewalk80 = (y) => {
      k.add([k.sprite("calcada_borda_sup"), k.pos(0, y), k.z(0)]);
      k.add([
        k.sprite("calcada_rio_piso", { quad: k.quad(0, 0, 1, 56 / 136) }),
        k.pos(0, y + 12),
        k.z(0),
      ]);
      k.add([k.sprite("calcada_borda_inf"), k.pos(0, y + 68), k.z(0)]);
    };

    // Kit_pista_pixel: pista de 3 faixas (240px) usando recorte 1:1 de asfalto_1280x320
    // e separadores tracejados (80x6) somente entre as faixas internas (+78 e +158).
    const drawRoad240 = (y) => {
      k.add([
        k.sprite("rua_asfalto_base", { quad: k.quad(0, 0, 1, 240 / 320) }),
        k.pos(0, y),
        k.z(0),
      ]);
      for (let c = 0; c < COLS; c++) {
        k.add([k.sprite("rua_tracejado"), k.pos(c * GRID_SIZE, y + 78), k.z(1)]);
        k.add([k.sprite("rua_tracejado"), k.pos(c * GRID_SIZE, y + 158), k.z(1)]);
      }
    };

    // Calçadas seguras (linhas 0, 4 e 8) e pistas perigosas (linhas 1..3 e 5..7)
    drawSidewalk80(0 * GRID_SIZE);
    drawRoad240(1 * GRID_SIZE);
    drawSidewalk80(4 * GRID_SIZE);
    drawRoad240(5 * GRID_SIZE);
    drawSidewalk80(8 * GRID_SIZE);
  } else if (floor === "rua_final") {
    // Kit_calcada_rio_asfalto: calçada de 80px (12px borda sup + 56px piso 1:1 + 12px borda inf)
    const drawSidewalk80 = (y) => {
      k.add([k.sprite("calcada_borda_sup"), k.pos(0, y), k.z(0)]);
      k.add([
        k.sprite("calcada_rio_piso", { quad: k.quad(0, 0, 1, 56 / 136) }),
        k.pos(0, y + 12),
        k.z(0),
      ]);
      k.add([k.sprite("calcada_borda_inf"), k.pos(0, y + 68), k.z(0)]);
    };

    // Kit_calcada_faculdade: calçada final da faculdade (linha 0) em recorte 1:1 (metade inferior 1280x80)
    // preservando canteiros laterais, entrada central da faculdade e meio-fio inferior.
    k.add([
      k.sprite("bg_faculdade", { quad: k.quad(0, 0.5, 1, 0.5) }),
      k.pos(0, 0),
      k.z(0),
    ]);

    // Kit_pista_pixel: pistas de 2 faixas (160px) com separador tracejado interno (+78)
    const drawRoad160 = (y) => {
      k.add([
        k.sprite("rua_asfalto_base", { quad: k.quad(0, 0, 1, 160 / 320) }),
        k.pos(0, y),
        k.z(0),
      ]);
      for (let c = 0; c < COLS; c++) {
        k.add([k.sprite("rua_tracejado"), k.pos(c * GRID_SIZE, y + 78), k.z(1)]);
      }
    };

    // Kit_pista_pixel: faixa expressa final de 1 faixa (80px) em recorte 1:1
    const drawRoad80 = (y) => {
      k.add([
        k.sprite("rua_asfalto_base", { quad: k.quad(0, 0, 1, 80 / 320) }),
        k.pos(0, y),
        k.z(0),
      ]);
    };

    // Estrutura: Calçada final (0) <- Asfalto (1) <- Calçada 2 (2) <- Asfalto (3,4) <- Calçada 1 (5) <- Asfalto (6,7) <- Calçada inicial (8)
    drawRoad80(1 * GRID_SIZE);
    drawSidewalk80(2 * GRID_SIZE);
    drawRoad160(3 * GRID_SIZE);
    drawSidewalk80(5 * GRID_SIZE);
    drawRoad160(6 * GRID_SIZE);
    drawSidewalk80(8 * GRID_SIZE);
  }
}

// Rótulo com fundo escuro (o piso é claro e o texto claro sumiria).
function addLabel(k, text, x, y, size = 16) {
  const width = k.formatText({ text, size }).width + 24;
  k.add([k.rect(width, size + 14, { radius: 6 }), k.pos(x, y), k.color(18, 24, 38), k.opacity(0.85), k.z(15)]);
  k.add([k.text(text, { size }), k.pos(x + 12, y + 7), k.color(...PALETTE.textLight), k.z(16)]);
}

export function registerLevel(k, def) {
  k.scene(def.id, () => {
    let active = true;
    let levelTime = 0;
    let col = def.startCol;
    let row = def.startRow;
    const safeRows = new Set(def.safeRows || [def.startRow, def.goalRow]);
    const coxPos = campaign.coxinhaPositions[def.id];
    Object.assign(levelDebug, {
      scene: def.id,
      levelId: def.id,
      time: 0,
      col,
      row,
      playerGridX: col,
      playerGridY: row,
      active: true,
      clocksHit: 0,
      coxinhasCollected: getCollectedCoxinhaCount(),
      allCoxinhas: hasAllCoxinhas(),
      coxinha: coxPos ? { col: coxPos.col, row: coxPos.row, collected: isCoxinhaCollected(def.id) } : null,
    });

    campaign.levelId = def.id;
    audio.playMusic();

    // 1. Cenário
    drawFloor(k, def.floor);

    // Zona de chegada (pulsa suavemente), calçada intermediária (se houver) e zona de início
    const goalZone = k.add([
      k.rect(GAME_WIDTH, GRID_SIZE),
      k.pos(0, def.goalRow * GRID_SIZE),
      k.color(...PALETTE.accentSuccess),
      k.opacity(0.3),
      k.z(1),
    ]);
    goalZone.onUpdate(() => {
      goalZone.opacity = 0.24 + 0.1 * Math.sin(k.time() * 4);
    });
    if (typeof def.middleSafeRow === "number") {
      k.add([
        k.rect(GAME_WIDTH, GRID_SIZE),
        k.pos(0, def.middleSafeRow * GRID_SIZE),
        k.color(...PALETTE.safeZoneMiddle),
        k.opacity(0.14),
        k.z(1),
      ]);
      if (def.middleLabel) {
        addLabel(k, def.middleLabel, 20, def.middleSafeRow * GRID_SIZE + 24, 14);
      }
    }
    if (Array.isArray(def.middleSafeRows)) {
      def.middleSafeRows.forEach((ms) => {
        k.add([
          k.rect(GAME_WIDTH, GRID_SIZE),
          k.pos(0, ms.row * GRID_SIZE),
          k.color(...PALETTE.safeZoneMiddle),
          k.opacity(0.14),
          k.z(1),
        ]);
        if (ms.label) {
          addLabel(k, ms.label, 20, ms.row * GRID_SIZE + 24, 14);
        }
      });
    }
    k.add([
      k.rect(GAME_WIDTH, GRID_SIZE),
      k.pos(0, def.startRow * GRID_SIZE),
      k.color(...PALETTE.annaBody),
      k.opacity(0.18),
      k.z(1),
    ]);
    addLabel(k, def.goalLabel, 20, def.goalRow * GRID_SIZE + 24, 18);
    addLabel(k, def.startLabel, 20, def.startRow * GRID_SIZE + 24, 14);

    // 2. HUD: cronômetro global + nome da fase
    k.add([
      k.rect(340, 50, { radius: 8 }),
      k.pos(GAME_WIDTH - 360, 15),
      k.color(18, 24, 38),
      k.outline(2, PALETTE.annaBody),
      k.z(20),
    ]);
    k.add([k.sprite("relogio_hud", { width: 32, height: 32 }), k.pos(GAME_WIDTH - 350, 24), k.z(21)]);
    const timerText = k.add([
      k.text(`TEMPO: ${Math.ceil(campaign.timeLeft)}s`, { size: 22 }),
      k.pos(GAME_WIDTH - 305, 28),
      k.color(...PALETTE.timerNormal),
      k.z(21),
    ]);
    // Rótulos ficam na linha da saída (sem obstáculos) para nunca esconder uma bolha.
    addLabel(k, def.name, GAME_WIDTH - 560, 14, 14);
    addLabel(k, "[M] Áudio", GAME_WIDTH - 560, 46, 12);

    // Indicador discreto de coxinhas coletadas no HUD (Marco 6)
    k.add([
      k.rect(185, 32, { radius: 6 }),
      k.pos(GAME_WIDTH - 758, 14),
      k.color(18, 24, 38),
      k.opacity(0.88),
      k.z(15),
    ]);
    k.add([
      k.sprite("coxinha", { width: 22, height: 22 }),
      k.pos(GAME_WIDTH - 750, 19),
      k.z(16),
    ]);
    const coxinhaHudText = k.add([
      k.text(`COXINHAS: ${getCollectedCoxinhaCount()}/3`, { size: 14 }),
      k.pos(GAME_WIDTH - 722, 23),
      k.color(...(getCollectedCoxinhaCount() > 0 ? PALETTE.accentSuccess : PALETTE.textLight)),
      k.z(16),
    ]);

    // 2b. Coxinha colecionável da fase (1 por fase, posição aleatória válida e alcançável).
    // Ignorada completamente pelos inimigos; apenas Anna interage com ela.
    let coxinhaObj = null;
    if (coxPos && !isCoxinhaCollected(def.id)) {
      coxinhaObj = k.add([
        k.sprite("coxinha", { width: 36, height: 36 }),
        k.pos(coxPos.col * GRID_SIZE + 22, coxPos.row * GRID_SIZE + 22),
        k.area({ scale: 0.85 }),
        k.z(4),
        "coxinha",
        { levelId: def.id, col: coxPos.col, row: coxPos.row, collected: false },
      ]);
    }

    function handleCollectCoxinha(cox) {
      if (
        !active ||
        !cox ||
        cox.collected ||
        (typeof cox.exists === "function" && !cox.exists()) ||
        isCoxinhaCollected(def.id)
      ) {
        if (cox && typeof cox.exists === "function" && !cox.exists() && coxinhaObj === cox) {
          coxinhaObj = null;
        }
        return;
      }
      cox.collected = true;
      const collectX = cox.pos.x;
      const collectY = cox.pos.y;
      collectCoxinha(def.id);
      k.destroy(cox);
      coxinhaObj = null;

      const count = getCollectedCoxinhaCount();
      levelDebug.coxinhasCollected = count;
      levelDebug.allCoxinhas = hasAllCoxinhas();
      if (levelDebug.coxinha) levelDebug.coxinha.collected = true;
      coxinhaHudText.text = `COXINHAS: ${count}/3`;
      coxinhaHudText.color = k.rgb(...PALETTE.accentSuccess);

      // Breve indicação visual discreta no local da coleta
      const pop = k.add([
        k.text(`+1 COXINHA (${count}/3)`, { size: 14 }),
        k.pos(Math.max(10, Math.min(GAME_WIDTH - 160, collectX - 30)), Math.max(10, collectY - 8)),
        k.color(255, 224, 130),
        k.z(25),
      ]);
      let elapsed = 0;
      pop.onUpdate(() => {
        elapsed += k.dt();
        pop.pos.y -= 28 * k.dt();
        if (elapsed >= 0.65) k.destroy(pop);
      });
    }

    // 3. Anna
    const player = k.add([
      k.sprite("anna_costas", { width: ANNA_SPRITE_SIZE, height: ANNA_SPRITE_SIZE }),
      k.pos(col * GRID_SIZE + ANNA_CELL_OFFSET, row * GRID_SIZE + ANNA_CELL_OFFSET),
      k.area({ scale: 0.75 }),
      k.z(10),
      "player",
    ]);

    function updatePlayerVisual(direction) {
      const sprite = { up: "anna_costas", left: "anna_esquerda", right: "anna_direita" }[direction];
      player.use(k.sprite(sprite, { width: ANNA_SPRITE_SIZE, height: ANNA_SPRITE_SIZE }));
      player.pos.x = col * GRID_SIZE + ANNA_CELL_OFFSET;
      player.pos.y = row * GRID_SIZE + ANNA_CELL_OFFSET;
    }

    // 4. Movimento em grade: esquerda, direita e frente (sem recuo)
    function movePlayer(dx, dy, dir) {
      if (!active) return;
      if (dy > 0) return;
      const newCol = col + dx;
      const newRow = row + dy;
      if (newCol < 0 || newCol >= COLS) return;
      if (newRow < 0 || newRow >= ROWS) return;

      col = newCol;
      row = newRow;
      levelDebug.col = col;
      levelDebug.row = row;
      levelDebug.playerGridX = col;
      levelDebug.playerGridY = row;
      updatePlayerVisual(dir);

      if (coxinhaObj && !coxinhaObj.collected && col === coxinhaObj.col && row === coxinhaObj.row) {
        handleCollectCoxinha(coxinhaObj);
      }

      if (row === def.goalRow) {
        active = false;
        levelDebug.active = false;
        campaign.timeLeft += LEVEL_COMPLETE_BONUS; // provisório: bônus ainda é 0
        const nextScene = sceneAfter(def.id);
        if (nextScene === "quiz") {
          k.go("quiz", { remainingTime: Math.ceil(campaign.timeLeft) });
        } else {
          k.go(nextScene);
        }
      }
    }
    k.onKeyPress("left", () => movePlayer(-1, 0, "left"));
    k.onKeyPress("a", () => movePlayer(-1, 0, "left"));
    k.onKeyPress("right", () => movePlayer(1, 0, "right"));
    k.onKeyPress("d", () => movePlayer(1, 0, "right"));
    k.onKeyPress("up", () => movePlayer(0, -1, "up"));
    k.onKeyPress("w", () => movePlayer(0, -1, "up"));

    // 5. Obstáculos e relógios inimigos (posição calculada a partir do tempo da fase).
    // Nunca são gerados em linhas seguras (safeRows) e nunca interagem entre si.
    const obstacles = [];
    def.lanes.forEach((lane) => {
      if (safeRows.has(lane.row)) return;
      for (let i = 0; i < lane.count; i++) {
        const isClock = lane.type === "relogio";
        const obs = k.add([
          k.sprite(lane.sprite, { width: lane.width, height: lane.height }),
          k.pos(obstacleX(lane, i, 0), lane.row * GRID_SIZE + (GRID_SIZE - lane.height) / 2),
          k.area({ scale: 0.85 }),
          k.z(isClock ? 6 : 5),
          "obstacle",
          { lane, index: i, enemyType: lane.type, collected: false },
        ]);
        obstacles.push(obs);
      }
    });

    function updateTimerHud() {
      timerText.text = `TEMPO: ${Math.ceil(campaign.timeLeft)}s`;
      if (campaign.timeLeft <= 10) timerText.color = k.rgb(...PALETTE.timerCritical);
      else if (campaign.timeLeft <= 25) timerText.color = k.rgb(...PALETTE.timerWarning);
      else timerText.color = k.rgb(...PALETTE.timerNormal);
    }

    // 6. Atualização: cronômetro global e obstáculos
    k.onUpdate(() => {
      if (!active) return;
      const dt = k.dt();
      levelTime += dt;
      campaign.timeLeft -= dt;

      if (campaign.timeLeft <= 0) {
        campaign.timeLeft = 0;
        active = false;
        levelDebug.active = false;
        k.go("gameover", { reason: "timeout" });
        return;
      }

      updateTimerHud();

      obstacles.forEach((o) => {
        if (!o.collected) {
          o.pos.x = obstacleX(o.lane, o.index, levelTime);
        }
      });

      Object.assign(levelDebug, {
        scene: def.id,
        levelId: def.id,
        time: levelTime,
        col,
        row,
        playerGridX: col,
        playerGridY: row,
        active,
        coxinhasCollected: getCollectedCoxinhaCount(),
        allCoxinhas: hasAllCoxinhas(),
      });
    });

    // 7a. Coleta da coxinha por contato com Anna (sem alterar cronômetro ou inimigos)
    player.onCollide("coxinha", (cox) => {
      handleCollectCoxinha(cox);
    });

    // 7. Colisão com Anna:
    // - Zonas seguras (safeRows) garantem imunidade total.
    // - Relógio ("relogio"): não é letal; toca sfx_relogio, subtrai CLOCK_TIME_PENALTY,
    //   destrói apenas aquele relógio e só causa derrota se zerar o cronômetro global.
    // - Obstáculo letal ("onibus" ou "sono"): toca o som específico e vai para Game Over.
    player.onCollide("obstacle", (obs) => {
      if (!active) return;
      if (safeRows.has(row)) return;

      if (obs.enemyType === "relogio") {
        if (obs.collected) return;
        obs.collected = true;
        const idx = obstacles.indexOf(obs);
        if (idx !== -1) obstacles.splice(idx, 1);
        k.destroy(obs);

        audio.playHit("relogio");
        levelDebug.clocksHit = (levelDebug.clocksHit || 0) + 1;
        campaign.timeLeft = Math.max(0, campaign.timeLeft - CLOCK_TIME_PENALTY);
        updateTimerHud();

        if (campaign.timeLeft <= 0) {
          active = false;
          levelDebug.active = false;
          k.go("gameover", { reason: "timeout" });
        }
        return;
      }

      active = false;
      levelDebug.active = false;
      audio.playHit(obs.enemyType);
      k.go("gameover", { reason: "collision" });
    });
  });
}
