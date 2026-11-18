/**
 * INFRAESTRUCTURA: Adaptador seguro para CrazyGames SDK v3.
 * Cuando el juego corre fuera de CrazyGames (ej. xatruchgames.com), todas las llamadas son no-op.
 */
class CrazyGamesAdapter {
  constructor() {
    this.initialized = false;
    this.isGameplayActive = false;
    this.adInProgress = false;
  }

  get sdk() {
    return typeof window !== 'undefined' && window.CrazyGames ? window.CrazyGames.SDK : null;
  }

  async init() {
    if (this.initialized || !this.sdk) return;
    try {
      await this.sdk.init();
      this.initialized = true;
    } catch {
      // Ignorar si corre fuera de entorno CrazyGames o en local
    }
  }

  gameplayStart() {
    if (this.isGameplayActive) return;
    this.isGameplayActive = true;
    try {
      this.sdk?.game?.gameplayStart();
    } catch {
      // No-op
    }
  }

  gameplayStop() {
    if (!this.isGameplayActive) return;
    this.isGameplayActive = false;
    try {
      this.sdk?.game?.gameplayStop();
    } catch {
      // No-op
    }
  }

  happytime() {
    try {
      this.sdk?.game?.happytime();
    } catch {
      // No-op
    }
  }

  requestMidgameAd({ onPause, onResume } = {}) {
    if (!this.sdk?.ad || this.adInProgress) {
      if (onResume) onResume();
      return;
    }
    this.adInProgress = true;
    this.gameplayStop();
    try {
      this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          if (onPause) onPause();
        },
        adFinished: () => {
          this.adInProgress = false;
          if (onResume) onResume();
        },
        adError: () => {
          this.adInProgress = false;
          if (onResume) onResume();
        }
      });
    } catch {
      this.adInProgress = false;
      if (onResume) onResume();
    }
  }
}

export const crazyGames = new CrazyGamesAdapter();
