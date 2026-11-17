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
  gameState.onResize(canvas.width, canvas.height);

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnDrop = document.getElementById('btnDrop');
  const btnMute = document.getElementById('btnMute');
  const btnMode = document.getElementById('btnMode');
  const btnDifficulty = document.getElementById('btnDifficulty');
  const btnHangar = document.getElementById('btnHangar');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const gameContainer = document.querySelector('.game-container');

  const isMobileDevice = () =>
    window.innerWidth <= 920 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const syncCanvasSize = () => {
    const applyResize = () => {
      renderer.resize();
      gameState.onResize(canvas.width, canvas.height);
    };
    setTimeout(applyResize, 120);
    setTimeout(applyResize, 350);
  };

  const isNativeFullscreen = () =>
    Boolean(document.fullscreenElement || document.webkitFullscreenElement);

  const requestRealFullscreen = async () => {
    try {
      if (!isNativeFullscreen()) {
        if (gameContainer.requestFullscreen) {
          await gameContainer.requestFullscreen({ navigationUI: 'hide' });
        } else if (gameContainer.webkitRequestFullscreen) {
          await gameContainer.webkitRequestFullscreen();
        }
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Ignorar si el navegador bloquea fullscreen
    }
    syncCanvasSize();
  };

  const exitRealFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    } catch {
      // Ignorar
    }
    syncCanvasSize();
  };

  const enterFullscreen = () => {
    if (isNativeFullscreen()) {
      exitRealFullscreen();
    } else {
      requestRealFullscreen();
    }
  };

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => enterFullscreen());
  }

  document.addEventListener('fullscreenchange', syncCanvasSize);
  document.addEventListener('webkitfullscreenchange', syncCanvasSize);
  window.addEventListener('orientationchange', syncCanvasSize);
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener('change', syncCanvasSize);
  }
  window.addEventListener('resize', syncCanvasSize);

  const syncModeButtonLabel = () => {
    if (btnMode) {
      if (gameState.mode === GAME_MODES.STORY) btnMode.textContent = '📖 Modo: Historia';
      else if (gameState.mode === GAME_MODES.CITY) btnMode.textContent = '🏙️ Modo: Ciudad';
      else if (gameState.mode === GAME_MODES.GEOMETRY) btnMode.textContent = '📐 Modo: Geometría';
      else btnMode.textContent = '🏃 Modo: Carretera';
    }
    if (btnDrop) {
      const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;
      btnDrop.textContent =
        effMode === GAME_MODES.HIGHWAY
          ? '⬆️ SALTAR [ESPACIO]'
          : '🚀 SOLTAR [ESPACIO]';
    }
    if (btnHangar) {
      const planeCfg = gameState.getSelectedPlaneConfig();
      btnHangar.textContent = `✈️ ${planeCfg.name.split(' ')[0]}`;
    }
    if (btnDifficulty) {
      const diffCfg = gameState.getDifficultyConfig();
      btnDifficulty.textContent = `🎚️ ${diffCfg.label}`;
    }
    const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;
    audio.setMusicForMode(effMode, gameState.levelIndex);
  };
  syncModeButtonLabel();

  let lastTime = performance.now();

  const triggerAction = () => {
    audio.ensureContext();
    if (isMobileDevice() && window.innerWidth > window.innerHeight && !isNativeFullscreen()) {
      requestRealFullscreen();
    }
    if (gameState.status === GAME_STATUS.START) {
      gameState.startGame(gameState.mode);
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.RESCUE_PROMPT) {
      gameState.startRescueMission();
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.LEVEL_COMPLETE) {
      gameState.advanceToNextLevel();
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.VICTORY) {
      if (!gameState.advanceToNextDifficulty()) {
        gameState.status = GAME_STATUS.START;
      }
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      gameState.restart();
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.PLAYING) {
      const actionDone = gameState.dropSelectedItem();
      const effMode = gameState.getEffectiveMode();
      if (actionDone && effMode !== GAME_MODES.HIGHWAY) {
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
        if (isMobileDevice() && window.innerWidth > window.innerHeight && !isNativeFullscreen()) {
          requestRealFullscreen();
        }
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
      const modes = [GAME_MODES.STORY, GAME_MODES.CITY, GAME_MODES.GEOMETRY, GAME_MODES.HIGHWAY];
      if (idx >= 0 && idx < modes.length) {
        gameState.startGame(modes[idx]);
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

  inputHandler.attachCanvasEvents(canvas, () => renderer.carouselHitboxes);

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

  // Audio de pirueta y Modo Salto en Carretera
  gameState.onStuntStart = () => audio.playLevelStuntFanfare();
  gameState.highwayEngine.onJump = (isDouble) => audio.playJump(isDouble);
  gameState.highwayEngine.onStarCollected = () => audio.playStar();
  gameState.highwayEngine.onObstacleHit = () => audio.playFail();

  if (btnDifficulty) {
    btnDifficulty.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      gameState.cycleDifficulty();
      if (gameState.status === GAME_STATUS.PLAYING) {
        gameState.restart();
      }
      syncModeButtonLabel();
    });
  }

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
  if (btnHangar) {
    btnHangar.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      gameState.cyclePlane();
      syncModeButtonLabel();
    });
  }
  if (btnMode) {
    btnMode.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      const order = [GAME_MODES.STORY, GAME_MODES.CITY, GAME_MODES.GEOMETRY, GAME_MODES.HIGHWAY];
      const nextMode = order[(order.indexOf(gameState.mode) + 1) % order.length];
      gameState.setMode(nextMode);
      gameState.status = GAME_STATUS.START;
      syncModeButtonLabel();
    });
  }

  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    const wasRescue = gameState.isRescueActive;
    gameState.update(dt, inputHandler.state);
    if (wasRescue && !gameState.isRescueActive) {
      syncModeButtonLabel();
    }
    renderer.render(gameState, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
