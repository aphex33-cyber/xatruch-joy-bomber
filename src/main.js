import { GameState, GAME_STATUS } from './application/game_state.js';
import { GAME_MODES } from './domain/types.js';
import { t, getLang, toggleLang } from './domain/i18n.js';
import { CanvasRenderer } from './infrastructure/renderer.js';
import { RetroAudioSynth } from './infrastructure/audio_synth.js';
import { InputHandler } from './infrastructure/input.js';
import { crazyGames } from './infrastructure/crazygames_sdk.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const renderer = new CanvasRenderer(canvas);
  renderer.resize();

  const audio = new RetroAudioSynth();
  crazyGames.init();
  const gameState = new GameState(canvas.width, canvas.height);
  gameState.onResize(canvas.width, canvas.height);

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnDrop = document.getElementById('btnDrop');
  const btnMute = document.getElementById('btnMute');
  const btnMenu = document.getElementById('btnMenu');
  const btnPause = document.getElementById('btnPause');
  const btnMode = document.getElementById('btnMode');
  const btnDifficulty = document.getElementById('btnDifficulty');
  const btnHangar = document.getElementById('btnHangar');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnLang = document.getElementById('btnLang');
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
    if (btnMenu) btnMenu.textContent = t('ui.menu');
    if (btnPause) btnPause.textContent = gameState.status === GAME_STATUS.PAUSED ? t('ui.resume') : t('ui.pause');
    if (btnFullscreen) btnFullscreen.textContent = t('ui.fullscreen');
    if (btnMute) btnMute.textContent = audio.muted ? t('ui.audioOff') : t('ui.audioOn');
    if (btnPrev) btnPrev.textContent = t('ui.prev');
    if (btnNext) btnNext.textContent = t('ui.next');
    if (btnLang) btnLang.textContent = getLang() === 'en' ? '🌐 EN' : '🌐 ES';
    if (btnMode) {
      if (gameState.mode === GAME_MODES.STORY) btnMode.textContent = t('ui.modeStory');
      else if (gameState.mode === GAME_MODES.CITY) btnMode.textContent = t('ui.modeCity');
      else if (gameState.mode === GAME_MODES.GEOMETRY) btnMode.textContent = t('ui.modeGeometry');
      else btnMode.textContent = t('ui.modeHighway');
    }
    if (btnDrop) {
      const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;
      btnDrop.textContent =
        effMode === GAME_MODES.HIGHWAY
          ? t('ui.jump')
          : t('ui.drop');
    }
    if (btnHangar) {
      const planeCfg = gameState.getSelectedPlaneConfig();
      const planeName = t(`plane.${planeCfg.id}`);
      btnHangar.textContent = `✈️ ${planeName.split(' ')[0]}`;
    }
    if (btnDifficulty) {
      const diffCfg = gameState.getDifficultyConfig();
      btnDifficulty.textContent = `🎚️ ${t(`diff.${diffCfg.id}`)}`;
    }
    const isEn = getLang() === 'en';
    document.documentElement.lang = isEn ? 'en' : 'es';
    const instCol1 = document.getElementById('instCol1');
    const instCol2 = document.getElementById('instCol2');
    const instCol3 = document.getElementById('instCol3');
    const btnDonate = document.getElementById('btnDonate');
    const linkPrivacy = document.getElementById('linkPrivacy');
    if (instCol1) {
      instCol1.innerHTML = isEn
        ? `<h4>🕹️ Controls</h4>
      <ul>
        <li><span class="kbd">SPACE</span> or click: Drop / Jump (Double jump on Highway)</li>
        <li><span class="kbd">1</span> <span class="kbd">2</span> <span class="kbd">3</span> <span class="kbd">4</span> <span class="kbd">5</span>: Direct supply selection</li>
        <li><span class="kbd">Q</span> / <span class="kbd">E</span>: Cycle carousel</li>
        <li><span class="kbd">A</span> / <span class="kbd">D</span>: Adjust speed</li>
      </ul>`
        : `<h4>🕹️ Controles</h4>
      <ul>
        <li><span class="kbd">ESPACIO</span> o clic: Soltar / Saltar (Doble salto en Carretera)</li>
        <li><span class="kbd">1</span> <span class="kbd">2</span> <span class="kbd">3</span> <span class="kbd">4</span> <span class="kbd">5</span>: Selección directa de carga</li>
        <li><span class="kbd">Q</span> / <span class="kbd">E</span>: Girar carrusel</li>
        <li><span class="kbd">A</span> / <span class="kbd">D</span>: Regular velocidad</li>
      </ul>`;
    }
    if (instCol2) {
      instCol2.innerHTML = isEn
        ? `<h4>🎯 Compatibility</h4>
      <ul>
        <li>🏘️ <strong>Low-Income Belt</strong> ➔ 💵 Money, 💧 Water or 🥖 Food</li>
        <li>🏙️ <strong>Civic Center / Modern</strong> ➔ 📖 Bible / Wisdom</li>
        <li>🏡 <strong>Hillside Neighborhood</strong> ➔ 🎁 Gifts, 🥖 Food or 💵 Money</li>
        <li>🔥 <strong>Active Wildfire</strong> ➔ 💧 Water Bomb</li>
      </ul>`
        : `<h4>🎯 Compatibilidad</h4>
      <ul>
        <li>🏘️ <strong>Cinturón de Pobreza</strong> ➔ 💵 Dinero, 💧 Agua o 🥖 Comida</li>
        <li>🏙️ <strong>Centro Cívico / Moderna</strong> ➔ 📖 Biblia / Sabiduría</li>
        <li>🏡 <strong>Barrio Popular</strong> ➔ 🎁 Regalos, 🥖 Comida o 💵 Dinero</li>
        <li>🔥 <strong>Incendio</strong> ➔ 💧 Bomba de Agua</li>
      </ul>`;
    }
    if (instCol3) {
      instCol3.innerHTML = isEn
        ? `<h4>💖 Mission of Joy</h4>
      <p>Calculate the plane's parabolic inertia when dropping supplies. Keep the <strong>Joy-O-Meter</strong> high and chain hits to multiply combos (2x, 3x, 4x).</p>`
        : `<h4>💖 Misión de Alegría</h4>
      <p>Calcula la inercia parabólica del avión al soltar la carga. Mantén el <strong>Joy-O-Meter</strong> elevado y encadena aciertos para multiplicar combos (2x, 3x, 4x).</p>`;
    }
    if (btnDonate) {
      btnDonate.textContent = isEn
        ? '☕ Support Xatruch Games (Donate with PayPal)'
        : '☕ Apoya a Xatruch Games (Donar con PayPal)';
    }
    if (linkPrivacy) {
      linkPrivacy.textContent = isEn ? 'Privacy Policy' : 'Política de Privacidad';
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
    if (gameState.status === GAME_STATUS.PAUSED) {
      gameState.togglePause();
      return;
    }
    if (gameState.status === GAME_STATUS.INTRO) {
      audio.playCarouselClick();
      gameState.advanceIntro();
    } else if (gameState.status === GAME_STATUS.START) {
      if (gameState.mode === GAME_MODES.STORY) {
        gameState.openStoryMap();
      } else {
        gameState.startGame(gameState.mode);
      }
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.STORY_MAP) {
      // Despegar en la última ciudad jugable desbloqueada
      const unlocked = gameState.unlockedCities || ['TEGUCIGALPA'];
      const stageIdx = unlocked.includes('COPAN') ? 2 : unlocked.includes('SPS') ? 1 : 0;
      gameState.startStoryStage(stageIdx);
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.BOSS_FIGHT) {
      gameState.bossEngine.fireWeapon(gameState.plane);
    } else if (gameState.status === GAME_STATUS.BOSS_VICTORY) {
      gameState.finishBossVictory();
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.RESCUE_PROMPT) {
      gameState.startRescueMission();
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.LEVEL_COMPLETE) {
      const wasMuted = audio.muted;
      crazyGames.requestMidgameAd({
        onPause: () => {
          if (!wasMuted) audio.toggleMute();
        },
        onResume: () => {
          if (!wasMuted && audio.muted) audio.toggleMute();
          gameState.advanceToNextLevel();
          syncModeButtonLabel();
        }
      });
    } else if (gameState.status === GAME_STATUS.VICTORY) {
      if (!gameState.advanceToNextDifficulty()) {
        gameState.status = GAME_STATUS.START;
      }
      syncModeButtonLabel();
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      const wasMuted = audio.muted;
      crazyGames.requestMidgameAd({
        onPause: () => {
          if (!wasMuted) audio.toggleMute();
        },
        onResume: () => {
          if (!wasMuted && audio.muted) audio.toggleMute();
          gameState.restart();
          syncModeButtonLabel();
        }
      });
    } else if (gameState.status === GAME_STATUS.PLAYING) {
      const actionDone = gameState.dropSelectedItem();
      const effMode = gameState.getEffectiveMode();
      if (actionDone && effMode !== GAME_MODES.HIGHWAY) {
        audio.playDrop();
      }
    }
  };

  const handleCanvasClick = (clickX, clickY) => {
    if (gameState.status === GAME_STATUS.STORY_MAP) {
      for (const btn of renderer.mapCityButtons) {
        if (
          clickX >= btn.x &&
          clickX <= btn.x + btn.w &&
          clickY >= btn.y &&
          clickY <= btn.y + btn.h
        ) {
          audio.ensureContext();
          if (btn.isUnlocked && btn.city.playable) {
            audio.playCarouselClick();
            gameState.startStoryStage(btn.city.stageIndex);
            syncModeButtonLabel();
          } else if (btn.isUnlocked && !btn.city.playable) {
            audio.playCarouselClick();
            gameState.showMapNotice(t('map.comingSoon', { city: btn.city.name }));
          } else {
            audio.playFail();
            gameState.showMapNotice(t('map.locked', { city: btn.city.name }));
          }
          return true;
        }
      }
      return false;
    }

    if (gameState.status === GAME_STATUS.BOSS_FIGHT) {
      audio.ensureContext();
      for (const b of renderer.bossMoveButtons) {
        if (clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h) {
          if (b.dir === -1) inputHandler.state.moveUp = true;
          else inputHandler.state.moveDown = true;
          return true;
        }
      }
      for (const wb of renderer.bossWeaponButtons) {
        if (clickX >= wb.x && clickX <= wb.x + wb.w && clickY >= wb.y && clickY <= wb.y + wb.h) {
          gameState.bossEngine.fireWeapon(gameState.plane, wb.idx);
          return true;
        }
      }
      return false;
    }

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
        if (btn.mode === GAME_MODES.STORY) {
          gameState.openStoryMap();
        } else {
          gameState.startGame(btn.mode);
        }
        syncModeButtonLabel();
        return true;
      }
    }
    return false;
  };

  const handleSelectIndex = (idx) => {
    audio.ensureContext();
    if (gameState.status === GAME_STATUS.BOSS_FIGHT) {
      if (idx >= 0 && idx < 4) {
        gameState.bossEngine.fireWeapon(gameState.plane, idx);
      }
      return;
    }
    if (gameState.status === GAME_STATUS.START) {
      const modes = [GAME_MODES.STORY, GAME_MODES.CITY, GAME_MODES.GEOMETRY, GAME_MODES.HIGHWAY];
      if (idx >= 0 && idx < modes.length) {
        if (modes[idx] === GAME_MODES.STORY) {
          gameState.openStoryMap();
        } else {
          gameState.startGame(modes[idx]);
        }
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
    handleCanvasClick,
    () => gameState.togglePause()
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

  // Audio de pirueta, Boss y Modo Salto en Carretera
  gameState.onStuntStart = () => audio.playLevelStuntFanfare();
  gameState.bossEngine.onShoot = () => audio.playCarouselClick();
  gameState.bossEngine.onBossHit = () => audio.playSuccessJoy(2);
  gameState.bossEngine.onBossEnrage = () => audio.playFail();
  gameState.bossEngine.onPlayerHit = () => audio.playFail();
  gameState.highwayEngine.onJump = (isDouble) => audio.playJump(isDouble);
  gameState.highwayEngine.onStarCollected = () => audio.playStar();
  gameState.highwayEngine.onObstacleHit = () => audio.playFail();

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      gameState.returnToMenu();
      syncModeButtonLabel();
    });
  }
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      gameState.togglePause();
    });
  }
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
      btnMute.textContent = isMuted ? t('ui.audioOff') : t('ui.audioOn');
    });
  }
  if (btnLang) {
    btnLang.addEventListener('click', () => {
      audio.ensureContext();
      audio.playCarouselClick();
      toggleLang();
      syncModeButtonLabel();
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

  let prevStatus = gameState.status;

  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    const wasRescue = gameState.isRescueActive;
    gameState.update(dt, inputHandler.state);
    if (wasRescue && !gameState.isRescueActive) {
      syncModeButtonLabel();
    }
    if (gameState.status !== prevStatus) {
      const playingStates = [GAME_STATUS.PLAYING, GAME_STATUS.BOSS_FIGHT];
      if (playingStates.includes(gameState.status)) {
        crazyGames.gameplayStart();
      } else {
        crazyGames.gameplayStop();
      }
      if (
        gameState.status === GAME_STATUS.BOSS_VICTORY ||
        gameState.status === GAME_STATUS.LEVEL_COMPLETE ||
        gameState.status === GAME_STATUS.VICTORY
      ) {
        crazyGames.happytime();
      }
      prevStatus = gameState.status;
    }
    renderer.render(gameState, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
