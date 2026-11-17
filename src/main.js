import { GameState, GAME_STATUS } from './application/game_state.js';
import { GAME_MODES } from './domain/types.js';
import { CanvasRenderer } from './infrastructure/renderer.js';
import { RetroAudioSynth } from './infrastructure/audio_synth.js';
import { InputHandler } from './infrastructure/input.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const renderer = new CanvasRenderer(canvas);
  renderer.resize();

  const audio = new RetroAudioSynth();
  const gameState = new GameState(canvas.width, canvas.height);

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnDrop = document.getElementById('btnDrop');
  const btnMute = document.getElementById('btnMute');
  const btnMode = document.getElementById('btnMode');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const mobilePrompt = document.getElementById('mobileFullscreenPrompt');
  const btnAcceptFullscreen = document.getElementById('btnAcceptFullscreen');
  const btnDismissFullscreen = document.getElementById('btnDismissFullscreen');
  const gameContainer = document.querySelector('.game-container');

  const isMobileDevice = () =>
    window.innerWidth <= 820 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (gameContainer.requestFullscreen) {
        await gameContainer.requestFullscreen();
      } else if (gameContainer.webkitRequestFullscreen) {
        await gameContainer.webkitRequestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
      if (mobilePrompt) mobilePrompt.style.display = 'none';
    } catch {
      // Ignorar si el navegador bloquea fullscreen
    }
  };

  if (mobilePrompt && isMobileDevice() && !document.fullscreenElement) {
    mobilePrompt.style.display = 'flex';
  }
  if (btnAcceptFullscreen) {
    btnAcceptFullscreen.addEventListener('click', () => enterFullscreen());
  }
  if (btnDismissFullscreen && mobilePrompt) {
    btnDismissFullscreen.addEventListener('click', () => {
      mobilePrompt.style.display = 'none';
    });
  }
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => enterFullscreen());
  }
  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      renderer.resize();
      gameState.canvasWidth = canvas.width;
      gameState.canvasHeight = canvas.height;
    }, 100);
  });

  const syncModeButtonLabel = () => {
    if (btnMode) {
      if (gameState.mode === GAME_MODES.CITY) btnMode.textContent = '🎮 Modo: Ciudad';
      else if (gameState.mode === GAME_MODES.GEOMETRY) btnMode.textContent = '📐 Modo: Geometría';
      else btnMode.textContent = '🏃 Modo: Carretera';
    }
    if (btnDrop) {
      btnDrop.textContent =
        gameState.mode === GAME_MODES.HIGHWAY
          ? '⬆️ SALTAR [ESPACIO]'
          : '🚀 SOLTAR [ESPACIO]';
    }
  };

  let lastTime = performance.now();

  const triggerAction = () => {
    audio.ensureContext();
    if (gameState.status === GAME_STATUS.START) {
      gameState.startGame(gameState.mode);
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.LEVEL_COMPLETE) {
      gameState.advanceToNextLevel();
    } else if (gameState.status === GAME_STATUS.VICTORY) {
      gameState.status = GAME_STATUS.START;
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      gameState.restart();
    } else if (gameState.status === GAME_STATUS.PLAYING) {
      const actionDone = gameState.dropSelectedItem();
      if (actionDone && gameState.mode !== GAME_MODES.HIGHWAY) {
        audio.playDrop();
      }
    }
  };

  const handleCanvasClick = (clickX, clickY) => {
    if (gameState.status !== GAME_STATUS.START) return false;

    for (const btn of renderer.startModeButtons) {
      if (
        clickX >= btn.x &&
        clickX <= btn.x + btn.w &&
        clickY >= btn.y &&
        clickY <= btn.y + btn.h
      ) {
        audio.ensureContext();
        audio.playCarouselClick();
        gameState.startGame(btn.mode);
        syncModeButtonLabel();
        return true;
      }
    }
    return false;
  };

  const handleSelectIndex = (idx) => {
    audio.ensureContext();
    if (gameState.status === GAME_STATUS.START) {
      if (idx === 0) {
        gameState.startGame(GAME_MODES.CITY);
        syncModeButtonLabel();
        audio.playCarouselClick();
      } else if (idx === 1) {
        gameState.startGame(GAME_MODES.GEOMETRY);
        syncModeButtonLabel();
        audio.playCarouselClick();
      } else if (idx === 2) {
        gameState.startGame(GAME_MODES.HIGHWAY);
        syncModeButtonLabel();
        audio.playCarouselClick();
      }
      return;
    }
    gameState.selectItemByIndex(idx);
    audio.playCarouselClick();
  };

  const inputHandler = new InputHandler(
    () => triggerAction(),
    () => {
      gameState.selectNextItem();
      audio.playCarouselClick();
    },
    () => {
      gameState.selectPrevItem();
      audio.playCarouselClick();
    },
    handleSelectIndex,
    () => triggerAction(),
    handleCanvasClick
  );

  inputHandler.attachCanvasEvents(canvas, () => gameState.carouselItems.length);

  // Escuchar impactos de Modo Ciudad
  const originalEvaluateImpact = gameState.dropEngine.scorer.evaluateImpact.bind(gameState.dropEngine.scorer);
  gameState.dropEngine.scorer.evaluateImpact = function(item, biome, hitTarget, targetCitizen) {
    const result = originalEvaluateImpact(item, biome, hitTarget, targetCitizen);
    if (result.matched) {
      audio.playSuccessJoy(result.combo);
    } else {
      audio.playFail();
    }
    return result;
  };

  // Escuchar impactos de Modo Geometría
  const originalEvaluateGeo = gameState.dropEngine.scorer.evaluateGeometryImpact.bind(gameState.dropEngine.scorer);
  gameState.dropEngine.scorer.evaluateGeometryImpact = function(item, slot, dist) {
    const result = originalEvaluateGeo(item, slot, dist);
    if (result.tier === 'PERFECT') {
      audio.playPerfectSnap();
    } else if (result.matched) {
      audio.playSuccessJoy(result.combo);
    } else {
      audio.playFail();
    }
    return result;
  };

  // Audio del Modo Salto en Carretera
  gameState.highwayEngine.onJump = (isDouble) => audio.playJump(isDouble);
  gameState.highwayEngine.onStarCollected = () => audio.playStar();
  gameState.highwayEngine.onObstacleHit = () => audio.playFail();

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      gameState.selectPrevItem();
      audio.playCarouselClick();
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      gameState.selectNextItem();
      audio.playCarouselClick();
    });
  }
  if (btnDrop) {
    btnDrop.addEventListener('click', () => triggerAction());
  }
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      btnMute.textContent = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
    });
  }
  if (btnMode) {
    btnMode.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      const order = [GAME_MODES.CITY, GAME_MODES.GEOMETRY, GAME_MODES.HIGHWAY];
      const nextMode = order[(order.indexOf(gameState.mode) + 1) % order.length];
      gameState.setMode(nextMode);
      gameState.status = GAME_STATUS.START;
      syncModeButtonLabel();
    });
  }

  window.addEventListener('resize', () => {
    renderer.resize();
    gameState.canvasWidth = canvas.width;
    gameState.canvasHeight = canvas.height;
  });

  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    gameState.update(dt, inputHandler.state);
    renderer.render(gameState, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
