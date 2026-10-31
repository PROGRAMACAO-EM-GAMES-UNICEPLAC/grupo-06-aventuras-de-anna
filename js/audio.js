// Project Anna — js/audio.js
// Sistema Centralizado de Áudio (Marco 3.1 / Project Anna 2.0)
// Gerencia carregamento, música de fundo, efeitos sonoros (SFX),
// controle de volume separado, silenciamento (mute) global resiliente,
// e interrupção imediata de todos os SFX no renascimento.

class AudioManager {
  constructor() {
    this.k = null;
    this.bgmHandle = null;
    this.activeSfxHandles = []; // Rastreia todos os SFX em reprodução
    this.isMuted = false;
    this.musicVolume = 0.5; // 0.0 a 1.0
    this.sfxVolume = 0.8;   // 0.0 a 1.0
    this.lastSfxTime = {};  // Cooldown para evitar disparos repetidos
  }

  // Inicializa com a instância ativa do Kaboom.js
  init(kaboomInstance) {
    this.k = kaboomInstance;
    this.loadAssets();
    this.setupGlobalKeyListener();
  }

  // Listener nativo do window para a tecla M:
  // Funciona independentemente do canvas ter foco ou de troca de cenas do Kaboom.
  setupGlobalKeyListener() {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.key === "m" || e.key === "M") {
        this.toggleMute();
      }
    });
  }

  // Registra os arquivos de áudio
  loadAssets() {
    if (!this.k) return;
    this.k.loadSound("bgm_jogo", "assets/audio/musica_jogo.mp3");
    this.k.loadSound("sfx_onibus", "assets/audio/sfx_onibus.mp3");
    this.k.loadSound("sfx_sono", "assets/audio/sfx_sono.mp3");
    this.k.loadSound("sfx_relogio", "assets/audio/sfx_relogio.mp3");
    this.k.loadSound("sfx_vitoria", "assets/audio/sfx_vitoria.mp3");
  }

  // Inicia ou retoma a música de fundo com loop
  playMusic() {
    if (!this.k) return;
    if (this.bgmHandle) {
      if (this.bgmHandle.paused) {
        this.bgmHandle.play();
      }
      this.bgmHandle.volume = this.isMuted ? 0 : this.musicVolume;
      return;
    }

    try {
      this.bgmHandle = this.k.play("bgm_jogo", {
        loop: true,
        volume: this.isMuted ? 0 : this.musicVolume,
      });
    } catch (err) {
      console.warn("Aviso: Áudio bloqueado pelo navegador até primeira interação.", err);
    }
  }

  // Pausa a música de fundo
  pauseMusic() {
    if (this.bgmHandle) {
      this.bgmHandle.paused = true;
    }
  }

  // Para completamente a música de fundo
  stopMusic() {
    if (this.bgmHandle) {
      try {
        this.bgmHandle.stop();
      } catch (e) {}
      this.bgmHandle = null;
    }
  }

  // Reproduz efeito sonoro com controle de volume, debounce e rastreamento de handle
  playSfx(name, cooldownMs = 250) {
    if (!this.k) return;

    const now = Date.now();
    const lastPlayed = this.lastSfxTime[name] || 0;
    if (now - lastPlayed < cooldownMs) {
      return; // Ignora reprodução repetida na mesma colisão
    }
    this.lastSfxTime[name] = now;

    try {
      const handle = this.k.play(name, {
        loop: false,
        volume: this.isMuted ? 0 : this.sfxVolume,
      });

      if (handle) {
        this.activeSfxHandles = this.activeSfxHandles.filter((h) => h && !h.paused);
        this.activeSfxHandles.push(handle);
      }
    } catch (err) {
      console.warn(`Erro ao reproduzir SFX '${name}':`, err);
    }
  }

  // Interrompe imediatamente todos os efeitos sonoros ativos (ex: no renascimento)
  stopAllSfx() {
    for (const handle of this.activeSfxHandles) {
      try {
        if (handle) {
          handle.stop();
        }
      } catch (e) {}
    }
    this.activeSfxHandles = [];
    this.lastSfxTime = {};
  }

  // Efeito específico do obstáculo atingido (apenas o som correspondente)
  playHit(enemyType) {
    const sfx = { onibus: "sfx_onibus", sono: "sfx_sono", relogio: "sfx_relogio" }[enemyType];
    if (sfx) this.playSfx(sfx);
  }

  // Alterna silenciamento (Mute / Unmute) de todo o áudio do jogo
  toggleMute() {
    this.isMuted = !this.isMuted;

    // Atualiza música de fundo
    if (this.bgmHandle) {
      this.bgmHandle.volume = this.isMuted ? 0 : this.musicVolume;
    }

    // Se mutou, silencia imediatamente efeitos em andamento
    if (this.isMuted) {
      for (const handle of this.activeSfxHandles) {
        try {
          if (handle) handle.volume = 0;
        } catch (e) {}
      }
    } else {
      for (const handle of this.activeSfxHandles) {
        try {
          if (handle) handle.volume = this.sfxVolume;
        } catch (e) {}
      }
    }

    console.log(`[Áudio] Silenciamento: ${this.isMuted ? "ATIVADO (Mudo)" : "DESATIVADO (Com som)"}`);
    return this.isMuted;
  }

  // Limpeza de estado e retorno ao jogo no renascimento
  onPlayerRespawn() {
    this.stopAllSfx();
    this.playMusic(); // Garante que a música de fundo continue/retome normalmente
  }

  // Define volume da música (0.0 a 1.0)
  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmHandle && !this.isMuted) {
      this.bgmHandle.volume = this.musicVolume;
    }
  }

  // Define volume dos efeitos (0.0 a 1.0)
  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }
}

// Exporta instância única (Singleton)
export const audio = new AudioManager();
