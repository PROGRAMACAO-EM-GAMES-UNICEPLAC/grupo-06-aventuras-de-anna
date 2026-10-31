// Project Anna — js/state.js
// Estado da campanha (Project Anna 2.0). Módulo puro: não depende do Kaboom.js.
// Guarda o que precisa sobreviver à troca de cenas: fase atual, cronômetro GLOBAL e coxinhas coletadas.

import { CAMPAIGN_TIME_LIMIT } from "./config.js";

// Ordem das fases de obstáculos da campanha (Casa -> Rua -> Rua Final).
export const LEVEL_ORDER = ["casa", "rua", "rua_final"];

// Cena exibida depois da última fase da lista (Prova Final / Quiz).
export const AFTER_LAST_LEVEL_SCENE = "quiz";

// Colunas e linhas válidas e alcançáveis para posicionamento aleatório da coxinha em cada fase.
export const COXINHA_VALID_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const COXINHA_VALID_ROWS = {
  casa: [2, 3, 4, 5, 6],
  rua: [2, 3, 4, 5, 6],
  rua_final: [2, 3, 4, 5, 6],
};

// Sorteia uma posição válida { col, row } para a coxinha da fase informada.
// Se houver uma posição anterior (prevPos), garante que a nova campanha sorteie uma célula diferente.
export function generateCoxinhaPosition(levelId, prevPos = null) {
  const rows = COXINHA_VALID_ROWS[levelId] || [2, 3, 4, 5, 6];
  const candidates = [];
  for (const r of rows) {
    for (const c of COXINHA_VALID_COLS) {
      if (prevPos && prevPos.col === c && prevPos.row === r) continue;
      candidates.push({ col: c, row: r });
    }
  }
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

export const campaign = {
  attemptId: 1,
  levelId: LEVEL_ORDER[0],
  timeLeft: CAMPAIGN_TIME_LIMIT,
  coxinhas: {
    casa: false,
    rua: false,
    rua_final: false,
  },
  coxinhaAttemptIds: {
    casa: 0,
    rua: 0,
    rua_final: 0,
  },
  coxinhaPositions: {
    casa: generateCoxinhaPosition("casa"),
    rua: generateCoxinhaPosition("rua"),
    rua_final: generateCoxinhaPosition("rua_final"),
  },
};

// Registra a coleta da coxinha da fase atual na tentativa em andamento.
export function collectCoxinha(levelId) {
  if (!(levelId in campaign.coxinhas)) return false;
  if (campaign.coxinhas[levelId] && campaign.coxinhaAttemptIds[levelId] === campaign.attemptId) {
    return false;
  }
  campaign.coxinhas[levelId] = true;
  campaign.coxinhaAttemptIds[levelId] = campaign.attemptId;
  return true;
}

// Verifica se a coxinha de determinada fase já foi coletada nesta tentativa.
export function isCoxinhaCollected(levelId) {
  return Boolean(
    campaign.coxinhas[levelId] &&
      (campaign.coxinhaAttemptIds[levelId] === campaign.attemptId || campaign.coxinhaAttemptIds[levelId] === 0)
  );
}

// Retorna quantas coxinhas (0 a 3) foram coletadas na tentativa atual.
export function getCollectedCoxinhaCount() {
  return LEVEL_ORDER.filter((id) => Boolean(campaign.coxinhas[id])).length;
}

// Retorna true se todas as 3 coxinhas tiverem sido coletadas na mesma tentativa atual.
export function hasAllCoxinhas() {
  return LEVEL_ORDER.every(
    (id) =>
      Boolean(campaign.coxinhas[id]) &&
      (campaign.coxinhaAttemptIds[id] === campaign.attemptId || campaign.coxinhaAttemptIds[id] === 0)
  );
}

// Nova tentativa: sempre recomeça em Casa com o cronômetro cheio, zera as coletas e sorteia novas posições.
export function resetCampaign() {
  campaign.attemptId += 1;
  campaign.levelId = LEVEL_ORDER[0];
  campaign.timeLeft = CAMPAIGN_TIME_LIMIT;
  campaign.coxinhas = {
    casa: false,
    rua: false,
    rua_final: false,
  };
  campaign.coxinhaAttemptIds = {
    casa: 0,
    rua: 0,
    rua_final: 0,
  };
  campaign.coxinhaPositions = {
    casa: generateCoxinhaPosition("casa", campaign.coxinhaPositions?.casa),
    rua: generateCoxinhaPosition("rua", campaign.coxinhaPositions?.rua),
    rua_final: generateCoxinhaPosition("rua_final", campaign.coxinhaPositions?.rua_final),
  };
}

// Nome da cena que vem depois da fase informada.
export function sceneAfter(levelId) {
  const next = LEVEL_ORDER[LEVEL_ORDER.indexOf(levelId) + 1];
  return next ?? AFTER_LAST_LEVEL_SCENE;
}
