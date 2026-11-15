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

  let lastTime = performance.now();

  const triggerAction = () => {
    audio.ensureContext();
    if (gameState.status === GAME_STATUS.START) {
      gameState.status = GAME_STATUS.PLAYING;
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      gameState.restart();
    } else if (gameState.status === GAME_STATUS.PLAYING) {
      const dropped = gameState.dropSelectedItem();
      if (dropped) {
        audio.playDrop();
      }
    }
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
    (idx) => {
      gameState.selectItemByIndex(idx);
      audio.playCarouselClick();
    },
    () => triggerAction()
  );

  inputHandler.attachCanvasEvents(canvas);

  // Escuchar impactos de Modo Ciudad
  const originalEvaluateImpact = gameState.dropEngine.scorer.evaluateImpact.bind(gameState.dropEngine.scorer);
  gameState.dropEngine.scorer.evaluateImpact = function(item, biome) {
    const result = originalEvaluateImpact(item, biome);
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

  // Controles en pantalla táctiles / botones auxiliares
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnDrop = document.getElementById('btnDrop');
  const btnMute = document.getElementById('btnMute');
  const btnMode = document.getElementById('btnMode');

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
      const nextMode =
        gameState.mode === GAME_MODES.CITY ? GAME_MODES.GEOMETRY : GAME_MODES.CITY;
      gameState.setMode(nextMode);
      gameState.status = GAME_STATUS.START;
      btnMode.textContent =
        nextMode === GAME_MODES.CITY ? '🎮 Modo: Ciudad' : '📐 Modo: Geometría';
    });
  }

  // Redimensionar pantalla
  window.addEventListener('resize', () => {
    renderer.resize();
    gameState.canvasWidth = canvas.width;
    gameState.canvasHeight = canvas.height;
  });

  // Bucle principal de juego (Game Loop a 60 FPS)
  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    gameState.update(dt, inputHandler.state);
    renderer.render(gameState, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
