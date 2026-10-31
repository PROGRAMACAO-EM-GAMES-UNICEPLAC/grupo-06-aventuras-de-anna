// Project Anna — config.js
// Configurações gerais, constantes de grade, paleta de cores e banco de questões da prova.
// Arquivo puramente declarativo em JavaScript ES Modules, sem dependências externas.

// Dimensões internas da tela (proporção 16:9)
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Configuração da grade arcade
export const GRID_SIZE = 80;
export const COLS = 16;
export const ROWS = 9;

// ---------------------------------------------------------------
// CAMPANHA 2.0 — cronômetro global, bônus de fase e penalidade (Balanceamento Definitivo — Marco 8)
// - CAMPAIGN_TIME_LIMIT: 75s iniciais para atravessar as três fases de obstáculos.
// - LEVEL_COMPLETE_BONUS: +8s concedidos ao concluir cada fase (recompensa de progressão).
// - CLOCK_TIME_PENALTY: -7s subtraídos ao colidir com um relógio inimigo na Rua ou Rua Final.
// ---------------------------------------------------------------
export const CAMPAIGN_TIME_LIMIT = 75;
export const LEVEL_COMPLETE_BONUS = 8;
export const CLOCK_TIME_PENALTY = 7;

// Dimensões do sprite de Anna
export const ANNA_SPRITE_SIZE = 52;
export const ANNA_CELL_OFFSET = (GRID_SIZE - ANNA_SPRITE_SIZE) / 2; // 14px

// Paleta de cores temática do projeto (R, G, B)
export const PALETTE = {
  bg: [13, 27, 42],
  safeZoneStart: [27, 38, 59],
  safeZoneMiddle: [35, 45, 68],
  safeZoneGoal: [48, 25, 82],
  roadLaneEven: [18, 22, 34],
  roadLaneOdd: [22, 28, 42],
  annaBody: [107, 63, 160],
  textLight: [224, 215, 247],
  accentSuccess: [76, 201, 144],
  accentFail: [230, 57, 70],
  timerNormal: [224, 215, 247],
  timerWarning: [244, 162, 97],
  timerCritical: [230, 57, 70],
  quizBox: [22, 28, 46],
  quizOptionBg: [32, 40, 64],
  quizOptionSelected: [92, 53, 138],
};

// Banco de perguntas da Prova Final (Quiz Hardcore)
export const QUIZ_QUESTIONS = [
  {
    topic: "ALGORITMOS E ESTRUTURAS",
    question: "1. Qual é a complexidade de tempo média de busca em uma Hash Table eficiente?",
    options: [
      { text: "A) O(n) — Linear proporcional aos dados", isCorrect: false },
      { text: "B) O(1) — Constante independente do volume", isCorrect: true },
      { text: "C) O(n²) — Quadrática dependente da tabela", isCorrect: false },
    ],
  },
  {
    topic: "ENGENHARIA DE SOFTWARE",
    question: "2. No ciclo TDD (Test-Driven Development), qual é a ordem correta das etapas?",
    options: [
      { text: "A) Escrever teste falho -> Fazer passar -> Refatorar", isCorrect: true },
      { text: "B) Implementar código -> Criar testes -> Documentar", isCorrect: false },
      { text: "C) Escrever requisitos -> Refatorar -> Criar teste", isCorrect: false },
    ],
  },
  {
    topic: "ARQUITETURA DE COMPUTADORES",
    question: "3. Qual memória do computador oferece a menor latência de acesso para a CPU?",
    options: [
      { text: "A) Memória RAM (DDR5)", isCorrect: false },
      { text: "B) Armazenamento SSD NVMe", isCorrect: false },
      { text: "C) Registradores e Memória Cache L1", isCorrect: true },
    ],
  },
];

// ---------------------------------------------------------------
// FASES DA CAMPANHA 2.0
// Cada fase ocupa uma tela inteira (16x9 células). Anna começa em startRow
// (zona segura) e vence ao pisar em goalRow. Obstáculos andam em "anéis":
// posição = (phase + i * espaçamento + speed * t) mod LANE_RING, o que torna
// o padrão determinístico e verificável por simulação.
// ---------------------------------------------------------------
export const LANE_MARGIN = 80;                          // área fora da tela onde o obstáculo reaparece
export const LANE_RING = GAME_WIDTH + 2 * LANE_MARGIN;  // comprimento do anel de cada faixa

export const LEVELS = {
  casa: {
    id: "casa",
    name: "FASE 1 — CASA",
    floor: "casa",
    startCol: 8,
    startRow: 8,
    goalRow: 0,
    startLabel: "QUARTO (INÍCIO)",
    goalLabel: "SAÍDA DA CASA",
    // Somente bolhas de sono. Dificuldade moderada (Marco 3.1):
    // Velocidades reduzidas (130-220 px/s) e densidade equilibrada (3-4 por faixa)
    lanes: [
      { row: 7, speed: 140, count: 3, phase: 0, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 6, speed: -160, count: 3, phase: 150, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 5, speed: 190, count: 4, phase: 80, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 4, speed: -210, count: 4, phase: 200, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 3, speed: 200, count: 4, phase: 40, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 2, speed: -220, count: 4, phase: 120, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 1, speed: 180, count: 3, phase: 100, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
    ],
  },
  rua: {
    id: "rua",
    name: "FASE 2 — RUA",
    floor: "rua",
    startCol: 8,
    startRow: 8,
    middleSafeRow: 4,
    goalRow: 0,
    safeRows: [0, 4, 8],
    startLabel: "CALÇADA INICIAL",
    middleLabel: "CALÇADA SEGURA",
    goalLabel: "CALÇADA FINAL",
    // Fase 2 (Marco 4): consideravelmente mais difícil que a Casa.
    // Ônibus letais em sentidos opostos (120x40) e relógios penalizadores de tempo (40x40)
    // circulando exclusivamente nas faixas de asfalto (linhas 7, 6, 5 e 3, 2, 1).
    lanes: [
      // Primeira pista de asfalto (linhas 7, 6 e 5)
      { row: 7, speed: 230, count: 3, phase: 0, sprite: "onibus_azul_dir", type: "onibus", width: 120, height: 40 },
      { row: 6, speed: -260, count: 3, phase: 160, sprite: "onibus_amarelo_esq", type: "onibus", width: 120, height: 40 },
      { row: 5, speed: 280, count: 3, phase: 90, sprite: "onibus_creme_dir", type: "onibus", width: 120, height: 40 },
      // Linha 4: calçada segura intermediária (sem inimigos)
      // Segunda pista de asfalto (linhas 3, 2 e 1)
      { row: 3, speed: -250, count: 3, phase: 60, sprite: "onibus_azul_esq", type: "onibus", width: 120, height: 40 },
      { row: 2, speed: 300, count: 3, phase: 210, sprite: "onibus_amarelo_dir", type: "onibus", width: 120, height: 40 },
      { row: 1, speed: -310, count: 3, phase: 130, sprite: "onibus_creme_esq", type: "onibus", width: 120, height: 40 },
      // Relógios inimigos não-letais (subtraem CLOCK_TIME_PENALTY do cronômetro global)
      { row: 7, speed: -180, count: 2, phase: 220, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },
      { row: 5, speed: -200, count: 2, phase: 360, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },
      { row: 3, speed: 190, count: 2, phase: 140, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },
      { row: 1, speed: 210, count: 2, phase: 280, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },
    ],
  },
  rua_final: {
    id: "rua_final",
    name: "FASE 3 — RUA FINAL",
    floor: "rua_final",
    startCol: 8,
    startRow: 8,
    goalRow: 0,
    safeRows: [0, 2, 5, 8],
    middleSafeRows: [
      { row: 5, label: "CALÇADA SEGURA 1" },
      { row: 2, label: "CALÇADA SEGURA 2" },
    ],
    startLabel: "CALÇADA INICIAL",
    goalLabel: "FACULDADE (PROVA FINAL)",
    // Fase 3 (Marco 6): dificuldade significativamente elevada, mantendo justiça e rotas viáveis.
    // Estrutura: Calçada inicial (8) -> Asfalto (7,6) -> Calçada 1 (5) -> Asfalto (4,3) -> Calçada 2 (2) -> Asfalto expresso (1) -> Calçada final (0).
    // Combina simultaneamente ônibus letais (4 por faixa), nuvens de sono letais (3-4 por faixa) e relógios penalizadores (3 por faixa).
    lanes: [
      // 1º trecho de asfalto (linhas 7 e 6)
      { row: 7, speed: 300, count: 3, phase: 0, sprite: "onibus_azul_dir", type: "onibus", width: 120, height: 40 },
      { row: 7, speed: -240, count: 2, phase: 200, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 7, speed: 220, count: 2, phase: 340, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },

      { row: 6, speed: -330, count: 3, phase: 110, sprite: "onibus_amarelo_esq", type: "onibus", width: 120, height: 40 },
      { row: 6, speed: 265, count: 3, phase: 40, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 6, speed: -230, count: 2, phase: 380, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },

      // Linha 5: 1ª calçada intermediária segura (sem inimigos)

      // 2º trecho de asfalto (linhas 4 e 3)
      { row: 4, speed: 350, count: 4, phase: 80, sprite: "onibus_creme_dir", type: "onibus", width: 120, height: 40 },
      { row: 4, speed: -280, count: 3, phase: 260, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 4, speed: 245, count: 3, phase: 120, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },

      { row: 3, speed: -375, count: 4, phase: 220, sprite: "onibus_azul_esq", type: "onibus", width: 120, height: 40 },
      { row: 3, speed: 300, count: 3, phase: 110, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 3, speed: -245, count: 3, phase: 350, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },

      // Linha 2: 2ª calçada intermediária segura (sem inimigos)

      // 3º trecho de asfalto — faixa expressa final (linha 1)
      { row: 1, speed: 400, count: 4, phase: 40, sprite: "onibus_amarelo_dir", type: "onibus", width: 120, height: 40 },
      { row: 1, speed: -320, count: 3, phase: 190, sprite: "sono_nuvem", type: "sono", width: 60, height: 40 },
      { row: 1, speed: -270, count: 3, phase: 90, sprite: "relogio_hud", type: "relogio", width: 40, height: 40 },
    ],
  },
};

// ---------------------------------------------------------------
// CUTSCENES E ENCERRAMENTOS NARRATIVOS (Marco 7)
// Roteiros mínimos alinhados ao planejamento original (Marco 1 e OQ FALTA.docx):
// - Final Normal: aprovação na faculdade quando Anna conclui o Quiz com < 3 coxinhas.
// - Final Secreto: comemoração especial no restaurante temático de coxinhas quando
//   Anna conclui o Quiz tendo coletado as 3 coxinhas na mesma tentativa.
// ---------------------------------------------------------------
export const CUTSCENES = {
  normal: {
    id: "cutscene_normal",
    endingScene: "ending_normal",
    endingType: "normal",
    title: "ENCERRAMENTO — CAMINHO NORMAL",
    slides: [
      {
        location: "SALA DA PROVA — FACULDADE",
        speaker: "NARRADOR",
        text: "Anna entrega a folha de respostas no último instante e respira aliviada. As três questões da prova final foram respondidas corretamente!",
      },
      {
        location: "CORREDOR DO CAMPUS",
        speaker: "ANNA",
        text: "Depois de desviar das bolhas de sono e atravessar o trânsito caótico da cidade, o resultado sai no mural: APROVADA NO SEMESTRE!",
      },
      {
        location: "SAÍDA DA FACULDADE",
        speaker: "NARRADOR",
        text: "O semestre está salvo! Mas Anna lembra que ainda ficaram algumas coxinhas pelo caminho... Será possível coletar todas as três na mesma jornada?",
      },
    ],
  },
  secreta: {
    id: "cutscene_secreta",
    endingScene: "ending_secreto",
    endingType: "secret",
    title: "ENCERRAMENTO SECRETO — 3/3 COXINHAS",
    slides: [
      {
        location: "SALA DA PROVA — GABARITO PERFEITO",
        speaker: "NARRADOR",
        text: "Anna entrega a prova final com confiança máxima! Além de gabaritar o exame, ela resgatou as três coxinhas douradas na mesma jornada!",
      },
      {
        location: "RUMO À COMEMORAÇÃO ESPECIAL",
        speaker: "ANNA",
        text: "Com a aprovação garantida e as 3 coxinhas lendárias reunidas, só existe um lugar digno para celebrar essa façanha histórica...",
      },
      {
        location: "RESTAURANTE TEMÁTICO DE COXINHAS",
        speaker: "NARRADOR",
        text: "As portas do Restaurante Temático de Coxinhas se abrem para Anna! Hora de comemorar o semestre vencido com o banquete secreto!",
      },
    ],
  },
};
