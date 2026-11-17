import { BIOME_TYPES, GAME_MODES, ITEMS_CATALOG } from '../domain/types.js';
import { GAME_STATUS } from '../application/game_state.js';
import { SpriteLibrary } from './sprites.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = new SpriteLibrary();
    this.propellerAngle = 0;
    this.cloudOffset = 0;
    this.mountainOffset = 0;
    this.elapsedTime = 0;
    this.startModeButtons = [];
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);

    if (isFullscreen) {
      const cw = this.canvas.clientWidth || rect.width || window.innerWidth;
      const ch = this.canvas.clientHeight || (window.innerHeight - 110);
      this.canvas.width = Math.min(960, Math.max(320, Math.floor(cw)));
      this.canvas.height = Math.max(240, Math.min(540, Math.floor(ch)));
    } else {
      this.canvas.width = Math.min(960, Math.max(320, Math.floor(rect.width || 800)));
      this.canvas.height = Math.max(420, Math.min(540, Math.floor(window.innerHeight * 0.68 || 480)));
    }
    this.ctx.imageSmoothingEnabled = false;
  }

  render(gameState, dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.elapsedTime += dt;
    this.propellerAngle += dt * 42;
    this.cloudOffset = (this.cloudOffset + gameState.plane.speed * 0.22 * dt) % w;
    this.mountainOffset = (this.mountainOffset + gameState.plane.speed * 0.08 * dt) % w;

    ctx.save();

    if (gameState.dropEngine.screenShake > 0) {
      const shake = gameState.dropEngine.screenShake;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    ctx.clearRect(0, 0, w, h);

    const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;

    if (effMode === GAME_MODES.HIGHWAY) {
      this.renderHighwayWorld(ctx, w, h, gameState);
      this.renderSpeedLines(ctx, w, h, gameState.plane.speed);
      this.renderParticles(ctx, gameState.dropEngine.particles);
      this.renderFloatingTexts(ctx, gameState.dropEngine.floatingTexts);
    } else {
      const currentBiome = gameState.getBiomeAtX(gameState.plane.x);
      this.renderSky(ctx, w, h, currentBiome, effMode);
      this.renderFarMountains(ctx, w, h, effMode);
      this.renderClouds(ctx, w, h, effMode);

      // Suelo, Landmarks de Honduras y Edificios
      this.renderWorldChunks(ctx, gameState);

      this.renderTurbulenceClouds(ctx, gameState.turbulenceClouds);
      this.renderSpeedLines(ctx, w, h, gameState.plane.speed);

      if (gameState.status === GAME_STATUS.PLAYING) {
        this.renderPredictiveReticle(ctx, gameState);
      }

      if (effMode === GAME_MODES.GEOMETRY) {
        this.renderGeometrySlots(ctx, gameState);
      } else {
        this.renderCitizens(ctx, gameState);
      }

      // Objetos rodando en el suelo
      this.renderRollingItems(ctx, gameState.dropEngine.rollingItems, effMode);

      // Partículas de impacto
      this.renderParticles(ctx, gameState.dropEngine.particles);

      // Objetos cayendo
      this.renderActiveDrops(ctx, gameState.dropEngine.activeDrops, effMode);

      // Humo del avión
      this.renderSmoke(ctx, gameState.smokeTrail);

      // El Avión con General Xatruch
      this.sprites.drawPlane(
        ctx,
        gameState.plane,
        this.propellerAngle,
        this.elapsedTime,
        gameState.selectedPlaneId
      );

      // Textos flotantes
      this.renderFloatingTexts(ctx, gameState.dropEngine.floatingTexts);
    }

    ctx.restore();

    // HUD
    const currentBiome = gameState.getBiomeAtX(gameState.plane.x);
    this.renderHUD(ctx, gameState, currentBiome);

    // Pantallas de Estado
    if (gameState.status === GAME_STATUS.START) {
      this.renderStartScreen(ctx, w, h, gameState);
    } else if (gameState.status === GAME_STATUS.RESCUE_PROMPT) {
      this.renderRescuePromptScreen(ctx, w, h, gameState);
    } else if (gameState.status === GAME_STATUS.LEVEL_COMPLETE) {
      this.renderLevelCompleteScreen(ctx, w, h, gameState);
    } else if (gameState.status === GAME_STATUS.VICTORY) {
      this.renderVictoryScreen(ctx, w, h, gameState);
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      this.renderGameOverScreen(ctx, w, h, gameState);
    }
  }

  renderSpeedLines(ctx, w, h, speed) {
    if (speed < 190) return;
    const intensity = Math.min(1, (speed - 190) / 220);
    const count = Math.floor(4 + intensity * 12);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + intensity * 0.22})`;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < count; i++) {
      const y = ((i * 73 + 55) % (h - 120)) + 50;
      const len = 35 + intensity * 85;
      const x = w - (((this.elapsedTime * speed * 1.9 + i * 190) % (w + len)) - len);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
  }

  renderHighwayWorld(ctx, w, h, gameState) {
    const hw = gameState.highwayEngine;
    const groundY = hw.groundY;

    // Cielo atardecer en carretera
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.55, '#1e3a8a');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, groundY);

    // Sol en el horizonte
    ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.beginPath();
    ctx.arc(w * 0.78, groundY - 40, 34, 0, Math.PI * 2);
    ctx.fill();

    // Montañas lejanas
    this.renderFarMountains(ctx, w, h, GAME_MODES.CITY);

    // Paisajes y monumentos de Tegucigalpa en el horizonte
    if (hw.landmarks) {
      for (const lm of hw.landmarks) {
        if (lm.x > -220 && lm.x < w + 220) {
          this.renderLandmark(ctx, { type: lm.type, x: lm.x, y: groundY });
        }
      }
    }

    // Cables y postes telefónicos de fondo (efecto ventana de carro)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1.5;
    const poleSpacing = 240;
    for (let px = -hw.poleOffset; px < w + poleSpacing; px += poleSpacing) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(px, groundY - 120, 4, 120);
      ctx.fillRect(px - 10, groundY - 115, 24, 3);
      // Cable curvo hacia el siguiente poste
      ctx.beginPath();
      ctx.moveTo(px + 2, groundY - 114);
      ctx.quadraticCurveTo(px + poleSpacing / 2, groundY - 90, px + poleSpacing + 2, groundY - 114);
      ctx.stroke();
    }

    // Carretera / Asfalto
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, groundY, w, 5);

    // Línea amarilla discontinua de carretera
    ctx.fillStyle = '#facc15';
    const dashOffset = (hw.poleOffset * 1.5) % 60;
    for (let dx = -dashOffset; dx < w; dx += 60) {
      ctx.fillRect(dx, groundY + 28, 32, 4);
    }

    // Suministros coleccionables del Modo Ciudad (Agua, Comida, Dinero, Biblia, Regalos)
    for (const st of hw.stars) {
      const bob = Math.sin(this.elapsedTime * 7 + st.x * 0.05) * 4;
      const itemCfg = st.item;
      if (itemCfg) {
        ctx.save();
        ctx.translate(st.x, st.y + bob);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, st.radius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = itemCfg.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(itemCfg.icon, 0, 1);
        ctx.restore();
      } else {
        this.sprites.drawGeoShape(ctx, 'STAR', st.x, st.y + bob, st.radius, '#facc15', false);
      }
    }

    // Obstáculos en el horizonte
    for (const obs of hw.obstacles) {
      if (obs.type === 'BUSH') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(obs.x + 10, obs.y + 18, 12, 0, Math.PI * 2);
        ctx.arc(obs.x + 22, obs.y + 14, 14, 0, Math.PI * 2);
        ctx.arc(obs.x + 30, obs.y + 20, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'SIGN') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(obs.x + 9, obs.y + 16, 4, obs.height - 16);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(obs.x + 11, obs.y);
        ctx.lineTo(obs.x + 22, obs.y + 11);
        ctx.lineTo(obs.x + 11, obs.y + 22);
        ctx.lineTo(obs.x, obs.y + 11);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'FENCE') {
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(obs.x + 4, obs.y, 6, obs.height);
        ctx.fillRect(obs.x + obs.width - 10, obs.y, 6, obs.height);
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(obs.x, obs.y + 8, obs.width, 6);
        ctx.fillRect(obs.x, obs.y + 22, obs.width, 6);
      } else if (obs.type === 'CAR') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x, obs.y + 12, obs.width, 16);
        ctx.fillRect(obs.x + 12, obs.y + 2, obs.width - 28, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(obs.x + 16, obs.y + 4, 14, 8);
        ctx.fillRect(obs.x + 34, obs.y + 4, 14, 8);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(obs.x + 14, obs.y + 28, 6, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.width - 14, obs.y + 28, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'POLE') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(obs.x + 5, obs.y, 8, obs.height);
        ctx.fillStyle = '#475569';
        ctx.fillRect(obs.x - 4, obs.y + 8, 26, 4);
      } else if (obs.type === 'MACAW') {
        this.sprites.drawMacaw(ctx, obs);
      } else if (obs.type === 'DEER') {
        this.sprites.drawDeer(ctx, obs);
      } else if (obs.type === 'GANGSTER') {
        this.sprites.drawGangster(ctx, obs);
      } else if (obs.type === 'TRAFFIC_JAM') {
        this.sprites.drawTrafficJam(ctx, obs, this.elapsedTime);
      }
    }

    // Corredor: General Florencio Xatruch saltando por Tegucigalpa
    const r = hw.runner;
    const blink = r.invulnTimer > 0 && Math.floor(this.elapsedTime * 16) % 2 === 0;
    if (!blink) {
      this.sprites.drawXatruchRunner(ctx, r, groundY, this.elapsedTime);
    }
  }

  renderSky(ctx, w, h, biome, mode) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, biome.skyGradient[0]);
    grad.addColorStop(0.75, biome.skyGradient[1]);
    grad.addColorStop(1, mode === GAME_MODES.GEOMETRY ? '#312e81' : '#ffffff22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Bandas de dithering 16-bit retro en el horizonte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 0; x < w; x += 8) {
      ctx.fillRect(x, h - 108, 4, 4);
      ctx.fillRect(x + 4, h - 104, 4, 4);
      ctx.fillRect(x, h - 96, 4, 4);
    }

    if (mode === GAME_MODES.GEOMETRY) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 97 + this.mountainOffset * 0.2) % w + w) % w;
        const sy = (i * 53) % (h - 140) + 50;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
  }

  renderFarMountains(ctx, w, h, mode) {
    ctx.fillStyle = mode === GAME_MODES.GEOMETRY ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.22)';
    ctx.beginPath();
    const baseLine = h - 60;
    ctx.moveTo(0, baseLine);

    const step = 60;
    for (let x = -this.mountainOffset; x < w + step; x += step) {
      const peakY = baseLine - 55 - Math.sin((x + this.mountainOffset) * 0.018) * 38;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(w, baseLine);
    ctx.closePath();
    ctx.fill();
  }

  renderClouds(ctx, w, h, mode) {
    ctx.fillStyle = mode === GAME_MODES.GEOMETRY ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.78)';
    const clouds = [
      { x: 110, y: 58, w: 54 },
      { x: 410, y: 84, w: 42 },
      { x: 720, y: 52, w: 62 }
    ];

    clouds.forEach(c => {
      const cx = ((c.x - this.cloudOffset + w * 2) % (w + 140)) - 70;
      ctx.fillRect(cx, c.y, c.w, 12);
      ctx.fillRect(cx + 8, c.y - 8, c.w - 16, 8);
      ctx.fillRect(cx + 16, c.y - 14, c.w - 32, 6);
    });
  }

  renderTurbulenceClouds(ctx, clouds) {
    if (!clouds || clouds.length === 0) return;
    for (const tc of clouds) {
      ctx.save();
      // Nube oscura de tormenta 16-bit con contorno
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tc.x - 2, tc.y + 8, tc.width + 4, tc.height - 8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(tc.x, tc.y + 10, tc.width, tc.height - 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(tc.x + 12, tc.y + 2, tc.width - 24, 10);
      ctx.fillRect(tc.x + 24, tc.y - 4, tc.width - 48, 8);

      // Rayo amarillo animado / ráfaga
      if (Math.sin(this.elapsedTime * 16 + tc.x) > 0.2) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(tc.x + tc.width / 2 - 2, tc.y + tc.height - 2, 5, 8);
        ctx.fillRect(tc.x + tc.width / 2 + 1, tc.y + tc.height + 5, 4, 7);
      }

      // Flecha indicando dirección de la ráfaga
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(tc.gust > 0 ? '💨 ➔' : '⬅ 💨', tc.x + tc.width / 2, tc.y + 22);
      ctx.restore();
    }
  }

  renderWorldChunks(ctx, gameState) {
    const groundY = gameState.canvasHeight - 60;

    for (const chunk of gameState.biomeChunks) {
      if (chunk.endX < -250 || chunk.startX > gameState.canvasWidth + 250) continue;

      // Renderizar Landmark icónico de Tegucigalpa / SPS en segundo plano
      if (chunk.landmark) {
        this.renderLandmark(ctx, chunk.landmark);
      }

      // Suelo principal
      ctx.fillStyle = chunk.biome.groundColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 60);

      // Franja superior de relieve + borde negro 16-bit estilo arcade
      ctx.fillStyle = chunk.biome.secondaryColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 2);
      ctx.fillRect(chunk.startX, groundY + 8, chunk.chunkWidth + 2, 2);

      if (chunk.type === BIOME_TYPES.GEOMETRY_ZONE) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        for (let gx = chunk.startX; gx < chunk.endX; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, groundY);
          ctx.lineTo(gx - 20, groundY + 60);
          ctx.stroke();
        }
      }

      for (const b of chunk.buildings) {
        if (b.x + b.width < -20 || b.x > gameState.canvasWidth + 20) continue;
        this.renderBuilding(ctx, b);
      }
    }
  }

  renderLandmark(ctx, lm) {
    const x = lm.x;
    const y = lm.y;

    ctx.save();
    if (lm.type === 'PICACHO') {
      // Cerro El Picacho con Cristo en la cima
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(x - 120, y);
      ctx.lineTo(x - 15, y - 165);
      ctx.lineTo(x + 15, y - 165);
      ctx.lineTo(x + 120, y);
      ctx.closePath();
      ctx.fill();

      // Base blanca y Cristo del Picacho con brazos extendidos
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 8, y - 172, 16, 8);
      ctx.fillRect(x - 3, y - 196, 6, 24); // Cuerpo
      ctx.fillRect(x - 14, y - 190, 28, 4); // Brazos extendidos
      ctx.fillRect(x - 2, y - 201, 4, 5); // Cabeza

      this.drawLandmarkLabel(ctx, x, y - 208, 'EL PICACHO');
    } else if (lm.type === 'JUANA_LAINEZ') {
      // Cerro Juana Laínez: Colina verde arbolada + rotonda circular + columnas + anillo + Bandera de Honduras
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(x - 135, y);
      ctx.quadraticCurveTo(x, y - 145, x + 135, y);
      ctx.fill();
      // Árboles en la ladera
      ctx.fillStyle = '#166534';
      for (let tx = -80; tx <= 80; tx += 28) {
        ctx.beginPath();
        ctx.arc(x + tx, y - 65 + Math.abs(tx) * 0.45, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      // Terraza circular de concreto (Monumento a la Paz)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 42, y - 122, 84, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 36, y - 126, 72, 4);
      // 4 pilares sosteniendo el anillo circular superior
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 16, y - 154, 5, 28);
      ctx.fillRect(x - 6, y - 154, 4, 28);
      ctx.fillRect(x + 3, y - 154, 4, 28);
      ctx.fillRect(x + 12, y - 154, 5, 28);
      // Corona / anillo superior
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 22, y - 160, 44, 7);
      // Asta y Bandera Azul-Blanco-Azul de Honduras ondeando
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 1, y - 196, 2, 36);
      const wave = Math.sin(this.elapsedTime * 6) * 1.5;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + 1, y - 195 + wave, 22, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 1, y - 191 + wave, 22, 4);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + 1, y - 187 + wave, 22, 4);

      this.drawLandmarkLabel(ctx, x, y - 205, 'CERRO JUANA LAÍNEZ');
    } else if (lm.type === 'ESTADIO_TGU') {
      // Estadio Nacional Chelato Uclés (fachada azul con letras blancas y gradas)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 95, y - 64, 190, 64);
      // Gradas superiores curvas
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 90, y - 76, 180, 12);
      // Techo parcial lateral
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + 42, y - 82, 52, 6);
      // Fachada azul central "ESTADIO NACIONAL"
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x - 64, y - 34, 128, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ESTADIO NACIONAL', x, y - 20);
      // Torres de iluminación
      for (const tx of [x - 82, x + 82]) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 2, y - 102, 4, 26);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx - 7, y - 106, 14, 6);
      }
      this.drawLandmarkLabel(ctx, x, y - 114, 'ESTADIO NACIONAL');
    } else if (lm.type === 'CENTRO_CIVICO') {
      // Centro Cívico Gubernamental (Torres de cristal celeste inclinadas + plaza verde)
      // Torre izquierda más alta con techo inclinado
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(x - 68, y);
      ctx.lineTo(x - 68, y - 178);
      ctx.lineTo(x - 20, y - 166);
      ctx.lineTo(x - 20, y);
      ctx.closePath();
      ctx.fill();
      // Franja lateral blanca de concreto
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 30, y - 168, 10, 168);

      // Torre derecha escalonada de cristal azul
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + 10, y - 142, 44, 142);
      ctx.fillStyle = '#bae6fd';
      for (let r = 12; r < 160; r += 10) {
        ctx.fillRect(x - 63, y - r, 28, 3);
        if (r < 136) ctx.fillRect(x + 15, y - r, 32, 3);
      }
      // Edificio bajo central + muro verde de plaza
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 20, y - 44, 30, 44);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x - 74, y - 10, 134, 10);

      this.drawLandmarkLabel(ctx, x, y - 186, 'CENTRO CÍVICO');
    } else if (lm.type === 'CATEDRAL') {
      // Catedral de San Miguel Arcángel (Tegucigalpa)
      // Cúpula trasera
      ctx.fillStyle = '#e7e5e4';
      ctx.beginPath();
      ctx.arc(x, y - 92, 22, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x - 2, y - 124, 4, 10);
      // Cuerpo central crema barroco
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(x - 58, y - 82, 116, 82);
      // Torres gemelas laterales
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(x - 68, y - 110, 24, 110);
      ctx.fillRect(x + 44, y - 110, 24, 110);
      // Techos piramidales rojos de las torres
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(x - 68, y - 110);
      ctx.lineTo(x - 56, y - 130);
      ctx.lineTo(x - 44, y - 110);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 44, y - 110);
      ctx.lineTo(x + 56, y - 130);
      ctx.lineTo(x + 68, y - 110);
      ctx.fill();
      // Tres relojes / medallones circulares centrales
      ctx.fillStyle = '#78350f';
      for (const mx of [x - 16, x, x + 16]) {
        ctx.beginPath();
        ctx.arc(mx, y - 66, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Puerta principal arqueada de madera
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(x, y - 24, 13, Math.PI, 0);
      ctx.lineTo(x + 13, y);
      ctx.lineTo(x - 13, y);
      ctx.closePath();
      ctx.fill();

      this.drawLandmarkLabel(ctx, x, y - 138, 'CATEDRAL DE TEGUCIGALPA');
    } else if (lm.type === 'MERENDON') {
      // Cordillera del Merendón (SPS) con letrero verde/blanco
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(x - 160, y);
      ctx.lineTo(x - 60, y - 140);
      ctx.lineTo(x + 10, y - 110);
      ctx.lineTo(x + 85, y - 155);
      ctx.lineTo(x + 170, y);
      ctx.closePath();
      ctx.fill();

      // Letrero icónico en la falda del Merendón
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 32, y - 92, 64, 14);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MERENDÓN', x, y - 82);

      this.drawLandmarkLabel(ctx, x, y - 164, 'CORDILLERA DEL MERENDÓN');
    } else if (lm.type === 'ESTADIO_OLIMPICO') {
      // Estadio Olímpico Metropolitano (techo curvo blanco)
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 85, y - 50, 170, 50);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(x, y - 50, 92, 22, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x - 85, y - 52, 170, 5);
      this.drawLandmarkLabel(ctx, x, y - 82, 'ESTADIO OLÍMPICO');
    } else if (lm.type === 'BORDOS') {
      // Los Bordos: talud de tierra, río azul y casitas humildes
      ctx.fillStyle = '#0284c7'; // Río
      ctx.fillRect(x - 95, y - 12, 190, 12);
      ctx.fillStyle = '#78350f'; // Bordo/dique
      ctx.beginPath();
      ctx.moveTo(x - 95, y - 12);
      ctx.lineTo(x - 75, y - 30);
      ctx.lineTo(x + 75, y - 30);
      ctx.lineTo(x + 95, y - 12);
      ctx.fill();
      // Casitas sobre el bordo
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x - 50, y - 54, 28, 24);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 15, y - 52, 30, 22);
      this.drawLandmarkLabel(ctx, x, y - 66, 'LOS BORDOS');
    } else if (lm.type === 'FUENTE_LUMINOSA') {
      // Fuente Luminosa + Palmeras tropicales de SPS
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 45, y - 14, 90, 14);
      ctx.fillStyle = '#38bdf8';
      for (let i = -2; i <= 2; i++) {
        const arcH = 26 + Math.sin(this.elapsedTime * 8 + i) * 8;
        ctx.fillRect(x + i * 12 - 2, y - 14 - arcH, 4, arcH);
      }
      this.drawLandmarkLabel(ctx, x, y - 58, 'FUENTE LUMINOSA');
    }
    ctx.restore();
  }

  drawLandmarkLabel(ctx, x, y, text) {
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    const w = ctx.measureText(text).width + 12;
    ctx.fillRect(x - w / 2, y - 11, w, 14);
    ctx.fillStyle = '#fde047';
    ctx.fillText(text, x, y);
  }

  renderBuilding(ctx, b) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(b.x + 5, b.y + 5, b.width, b.height);
    // Borde oscuro 16-bit estilo Moustache Protocol
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    if (b.type === BIOME_TYPES.GEOMETRY_ZONE) {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(b.x + 8, b.y + 12, b.width - 16, 4);
      ctx.fillRect(b.x + 8, b.y + 24, b.width - 16, 4);
      return;
    }

    if (b.type === BIOME_TYPES.RICH_DISTRICT) {
      if (b.variant === 0) {
        // Edificio comercial moderno (ladrillo + ventanales + alero inclinado + árbol ciprés)
        const shopH = Math.min(b.height, 74);
        const shopY = b.y + b.height - shopH;
        ctx.fillStyle = '#9a3412'; // Ladrillo cálido
        ctx.fillRect(b.x, shopY, b.width, shopH);
        // Grandes ventanales de cristal oscuro
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(b.x + 6, shopY + 14, b.width * 0.62, shopH - 18);
        ctx.fillStyle = '#38bdf844';
        ctx.fillRect(b.x + 8, shopY + 16, b.width * 0.58, shopH - 22);
        // Alero moderno horizontal crema
        ctx.fillStyle = '#f5f5f4';
        ctx.fillRect(b.x - 5, shopY + 4, b.width + 10, 7);
        ctx.fillRect(b.x - 3, shopY + shopH * 0.45, b.width + 6, 5);
        // Letrero verde circular
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(b.x + b.width - 10, shopY + 26, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Torre moderna de cristal y acero
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = '#334155';
        ctx.fillRect(b.x, b.y, b.width, 6);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(b.x + b.width * 0.72, b.y, b.width * 0.28, b.height);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(b.x + b.width / 2 - 2, b.y - 16, 4, 16);
        if (Math.sin(this.elapsedTime * 5) > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(b.x + b.width / 2 - 2, b.y - 18, 4, 4);
        }

        for (let r = 12; r < b.height - 14; r += 16) {
          for (let c = 8; c < b.width - 10; c += 14) {
            ctx.fillStyle = (r + c) % 28 === 0 ? '#fde047' : '#38bdf8';
            ctx.fillRect(b.x + c, b.y + r, 8, 9);
          }
        }
      }
    } else if (b.type === BIOME_TYPES.FIRE_EMERGENCY) {
      ctx.fillStyle = b.extinguished ? '#334155' : '#450a0a';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x, b.y, b.width, 5);

      for (let r = 12; r < b.height - 12; r += 18) {
        for (let c = 8; c < b.width - 10; c += 16) {
          ctx.fillStyle = b.extinguished ? '#64748b' : '#f97316';
          ctx.fillRect(b.x + c, b.y + r, 8, 10);
        }
      }

      if (!b.extinguished) {
        for (let i = 4; i < b.width - 8; i += 10) {
          const flameH = 12 + Math.sin(this.elapsedTime * 14 + i) * 6;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(b.x + i, b.y - flameH, 7, flameH);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(b.x + i + 2, b.y - flameH * 0.6, 3, flameH * 0.6);
        }
      } else {
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('✓ SALVO', b.x + b.width / 2, b.y - 6);
      }
    } else if (b.type === BIOME_TYPES.POVERTY_BELT || b.type === BIOME_TYPES.FAVELA) {
      // Casitas en ladera (bloque, ladrillo, lámina de zinc, tinacos y tendederos)
      const wallColors = ['#a8a29e', '#d97706', '#2dd4bf', '#cbd5e1', '#fb7185'];
      const baseColor = wallColors[(b.variant || 0) % wallColors.length];
      ctx.fillStyle = baseColor;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Segundo nivel apilado diferente (típico de laderas)
      if (b.height > 54) {
        ctx.fillStyle = wallColors[((b.variant || 0) + 2) % wallColors.length];
        ctx.fillRect(b.x + 4, b.y, b.width - 8, b.height * 0.48);
      }

      // Techo de lámina de zinc oxidada o gris
      ctx.fillStyle = '#64748b';
      ctx.fillRect(b.x - 2, b.y - 3, b.width + 4, 4);

      // Tinaco de agua en el techo
      ctx.fillStyle = b.variant % 2 === 0 ? '#0284c7' : '#1e293b';
      ctx.fillRect(b.x + 8, b.y - 12, 10, 9);

      // Puertas y ventanitas
      ctx.fillStyle = '#451a03';
      ctx.fillRect(b.x + 8, b.y + b.height - 18, 10, 18);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(b.x + b.width - 20, b.y + 12, 8, 8);
      if (b.height > 54) {
        ctx.fillRect(b.x + 12, b.y + 10, 8, 8);
      }
    }
  }

  renderPredictiveReticle(ctx, gameState) {
    const itemId = gameState.carouselItems[gameState.selectedItemIndex];
    const itemConfig = ITEMS_CATALOG[itemId];
    const groundY = gameState.getGroundHeightAtX(gameState.plane.x);

    const { landingX, points } = gameState.dropEngine.physics.predictTrajectory(
      itemConfig,
      gameState.plane.x + gameState.plane.width * 0.5,
      gameState.plane.y + gameState.plane.height,
      gameState.plane.speed,
      groundY,
      40,
      gameState.windX || 0
    );

    let isTargetLocked = false;
    let isPerfectLock = false;
    const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;

    if (effMode === GAME_MODES.GEOMETRY) {
      for (const slot of gameState.geometrySlots) {
        if (!slot.filled && slot.shapeType === itemId) {
          const dist = Math.abs(slot.x - landingX);
          if (dist <= 18) {
            isTargetLocked = true;
            isPerfectLock = true;
            break;
          } else if (dist <= 46) {
            isTargetLocked = true;
            break;
          }
        }
      }
    } else {
      for (const c of gameState.citizens) {
        if (Math.abs(c.x - landingX) < 75) {
          isTargetLocked = true;
          break;
        }
      }
    }

    ctx.fillStyle = isPerfectLock
      ? 'rgba(250, 204, 21, 0.55)'
      : isTargetLocked
        ? 'rgba(74, 222, 128, 0.45)'
        : 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < points.length; i += 2) {
      ctx.fillRect(points[i].x - 1.5, points[i].y - 1.5, 3, 3);
    }

    const pulse = 1 + Math.sin(this.elapsedTime * 10) * 0.15;
    ctx.strokeStyle = isPerfectLock
      ? '#facc15'
      : isTargetLocked
        ? '#4ade80'
        : itemConfig
          ? itemConfig.color
          : '#38bdf8';
    ctx.lineWidth = isTargetLocked ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(landingX, groundY + 2, 16 * pulse, 5 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (isPerfectLock) {
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 LISTO!', landingX, groundY - 46);
    }
  }

  renderCitizens(ctx, gameState) {
    for (const c of gameState.citizens) {
      if (c.x < -30 || c.x > gameState.canvasWidth + 30) continue;

      this.sprites.drawCitizen(ctx, c, this.elapsedTime);

      if (!c.isHappy) {
        const bobY = Math.sin(this.elapsedTime * 5 + c.animationOffset) * 2.5;
        const bubbleY = c.y - 52 + bobY;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(c.x - 13, bubbleY, 26, 17, 5);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.needIcon, c.x, bubbleY + 13);
      } else {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💖', c.x, c.y - 38);
      }
    }
  }

  renderGeometrySlots(ctx, gameState) {
    const groundY = gameState.canvasHeight - 60;

    for (const slot of gameState.geometrySlots) {
      if (slot.x < -50 || slot.x > gameState.canvasWidth + 50) continue;

      const cfg = ITEMS_CATALOG[slot.shapeType];
      const baseColor = cfg ? cfg.color : '#38bdf8';

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(slot.x - 24, groundY - 6, 48, 10);
      ctx.fillStyle = slot.filled ? '#22c55e' : baseColor;
      ctx.fillRect(slot.x - 24, groundY - 6, 48, 3);

      const scaleBoost = slot.snapAnim > 0 ? 1 + slot.snapAnim * 0.25 : 1;
      const shapeY = groundY - 24;

      if (slot.filled) {
        this.sprites.drawGeoShape(ctx, slot.shapeType, slot.x, shapeY, 16 * scaleBoost, baseColor, false);
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = slot.tier === 'PERFECT' ? '#facc15' : '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText(slot.tier === 'PERFECT' ? '★ PERFECT' : '✓ OK', slot.x, shapeY - 24);
      } else {
        this.sprites.drawGeoShape(ctx, slot.shapeType, slot.x, shapeY, 16, baseColor, true);
      }
    }
  }

  renderRollingItems(ctx, rollingItems, mode) {
    for (const r of rollingItems) {
      const alpha = Math.max(0, r.life / r.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rotation);

      if (mode === GAME_MODES.GEOMETRY) {
        this.sprites.drawGeoShape(ctx, r.item.id, 0, 0, 11, r.item.color, false);
      } else {
        ctx.fillStyle = r.item.color;
        ctx.fillRect(-7, -7, 14, 14);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, -7, 14, 14);
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.item.icon, 0, 0);
      }

      ctx.restore();
    }
  }

  renderActiveDrops(ctx, drops, mode) {
    for (const d of drops) {
      ctx.save();
      ctx.translate(d.x, d.y);

      if (mode === GAME_MODES.GEOMETRY) {
        ctx.rotate(d.rotation * 0.5);
        this.sprites.drawGeoShape(ctx, d.item.id, 0, 0, 14, d.item.color, false);
      } else {
        ctx.rotate(d.rotation);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -14, 11, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -14, 5, Math.PI, 0);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-10, -14);
        ctx.lineTo(0, -2);
        ctx.moveTo(10, -14);
        ctx.lineTo(0, -2);
        ctx.stroke();

        ctx.fillStyle = d.item.color;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-8, -8, 16, 16);

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.item.icon, 0, 0);
      }

      ctx.restore();
    }
  }

  renderSmoke(ctx, smokeTrail) {
    for (const s of smokeTrail) {
      const alpha = (s.life / s.maxLife) * 0.5;
      ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
  }

  renderParticles(ctx, particles) {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }

  renderFloatingTexts(ctx, texts) {
    for (const ft of texts) {
      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);

      if (ft.subtext) {
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.subtext, ft.x, ft.y + 14);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  renderHUD(ctx, gameState, currentBiome) {
    const w = this.canvas.width;
    const isMobile = w < 620;
    const scorer = gameState.dropEngine.scorer;
    const levelCfg = gameState.getCurrentLevelConfig();

    const hudHeight = isMobile ? 58 : 46;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, w, hudHeight);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, hudHeight - 2, w, 2);

    const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;

    if (effMode === GAME_MODES.HIGHWAY) {
      const hw = gameState.highwayEngine;
      ctx.font = `bold ${isMobile ? 11 : 13}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'left';
      const hearts = '❤️'.repeat(Math.max(0, hw.lives)) + '🖤'.repeat(Math.max(0, hw.maxLives - hw.lives));
      ctx.fillText(isMobile ? hearts : `VIDAS: ${hearts}`, 12, isMobile ? 20 : 27);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${isMobile ? 12 : 14}px "JetBrains Mono", monospace`;
      ctx.fillText(`SCORE: ${scorer.score}`, w - 12, 22);

      const spd = Math.round(gameState.plane.speed);
      ctx.textAlign = 'center';
      ctx.font = `bold ${isMobile ? 10 : 12}px "JetBrains Mono", monospace`;
      if (gameState.isRescueActive) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText(
          `🚑 RESCATE: ${hw.rescueCollected}/${hw.rescueGoal} SUMINISTROS`,
          w / 2,
          isMobile ? 38 : 18
        );
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(
          isMobile ? '🏃 SALTO EN CARRETERA' : '🏃 SALTO EN CARRETERA • [ESPACIO] SALTAR / DOBLE SALTO',
          w / 2,
          isMobile ? 38 : 18
        );
      }

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = spd > 320 ? '#ef4444' : spd > 240 ? '#facc15' : '#94a3b8';
      ctx.fillText(
        `VEL: ${spd} KM/H  |  RÉCORD: ${Math.max(gameState.highScore, scorer.score)}`,
        w / 2,
        isMobile ? 52 : 35
      );
      return;
    }

    // JOY-O-METER (Izquierda)
    ctx.font = `bold ${isMobile ? 10 : 11}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText(isMobile ? '💖 JOY:' : '💖 JOY-O-METER:', 12, 16);

    const barWidth = isMobile ? 86 : 128;
    const barHeight = 10;
    ctx.fillStyle = '#334155';
    ctx.fillRect(12, 21, barWidth, barHeight);

    const joyPct = scorer.joy / 100;
    const joyColor = joyPct > 0.6 ? '#22c55e' : joyPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = joyColor;
    ctx.fillRect(12, 21, barWidth * joyPct, barHeight);

    const minJoyX = 12 + barWidth * (levelCfg.minJoy / 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(minJoyX - 1, 19, 2, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(scorer.joy)}%`, 12 + barWidth + 5, 30);

    // PUNTUACIÓN Y COMBO (Derecha)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${isMobile ? 11 : 13}px "JetBrains Mono", monospace`;
    ctx.fillText(`SCORE: ${scorer.score}`, w - 12, 18);

    if (scorer.combo > 1) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`COMBO x${scorer.combo}! 🔥`, w - 12, 32);
    }

    // NIVEL & ZONA ACTUAL
    const spd = Math.round(gameState.plane.speed);
    ctx.textAlign = 'center';
    if (isMobile) {
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        `${currentBiome.accentEmoji} ${currentBiome.name.toUpperCase()} • META: ${scorer.score}/${levelCfg.targetScore}`,
        w / 2,
        49
      );
    } else {
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${levelCfg.title.toUpperCase()} • ${currentBiome.accentEmoji} ${currentBiome.name.toUpperCase()}`, w / 2, 18);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = spd > 280 ? '#ef4444' : spd > 195 ? '#facc15' : '#94a3b8';
      ctx.fillText(`VELOCIDAD: ${spd} KT  |  META: ${scorer.score}/${levelCfg.targetScore} (JOY ≥ ${levelCfg.minJoy}%)`, w / 2, 35);
    }

    if (Math.abs(gameState.windX || 0) > 5) {
      const windDir = gameState.windX > 0 ? '➔' : '⬅';
      const windStr = Math.round(Math.abs(gameState.windX));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(w / 2 - 74, hudHeight, 148, 18);
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`💨 VIENTO ${windDir} ${windStr} KT`, w / 2, hudHeight + 13);
    }

    this.renderCarouselHUD(ctx, gameState, w);
  }

  renderCarouselHUD(ctx, gameState, w) {
    const items = gameState.carouselItems;
    const selectedIdx = gameState.selectedItemIndex;
    const isNarrow = w < 440;
    const slotSize = isNarrow ? 38 : 48;
    const gap = isNarrow ? 6 : 10;
    const totalW = items.length * slotSize + (items.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const startY = this.canvas.height - (slotSize + 6);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(startX - 14, startY - 6, totalW + 28, slotSize + 12, 10);
    ctx.fill();

    items.forEach((itemId, idx) => {
      const x = startX + idx * (slotSize + gap);
      const y = startY;
      const itemConfig = ITEMS_CATALOG[itemId];
      const isSelected = idx === selectedIdx;

      ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
      ctx.fillRect(x - 2, y - 2, slotSize + 4, slotSize + 4);

      ctx.fillStyle = isSelected ? '#0f172a' : '#334155';
      ctx.fillRect(x, y, slotSize, slotSize);

      const effMode = gameState.getEffectiveMode ? gameState.getEffectiveMode() : gameState.mode;
      if (effMode === GAME_MODES.GEOMETRY) {
        this.sprites.drawGeoShape(ctx, itemId, x + slotSize / 2, y + slotSize / 2 - 5, 11, itemConfig.color, false);
      } else {
        ctx.font = isSelected ? '20px sans-serif' : '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(itemConfig.icon, x + slotSize / 2, y + slotSize / 2 - 4);
      }

      ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[${idx + 1}]`, x + slotSize / 2, y + slotSize - 6);
    });
  }

  renderStartScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    const isMobile = w < 680;
    const planeCfg = gameState.getSelectedPlaneConfig();

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${isMobile ? 18 : 25}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('✈️ XATRUCH JOY BOMBER', w / 2, isMobile ? 32 : h / 2 - 148);

    ctx.fillStyle = '#facc15';
    ctx.font = `bold ${isMobile ? 10 : 12}px "JetBrains Mono", monospace`;
    ctx.fillText(
      `⭐ ${gameState.totalStars}/12 ESTRELLAS  •  AVIÓN: ${planeCfg.name.toUpperCase()}`,
      w / 2,
      isMobile ? 50 : h / 2 - 122
    );

    if (isMobile) {
      const cardW = Math.min(340, w - 28);
      const topY = 62;
      const bottomPad = 14;
      const gap = 8;
      const availH = Math.max(220, h - topY - bottomPad);
      const cardH = Math.min(82, Math.floor((availH - gap * 3) / 4));
      const startX = (w - cardW) / 2;

      this.startModeButtons = [
        { mode: GAME_MODES.STORY, x: startX, y: topY, w: cardW, h: cardH },
        { mode: GAME_MODES.CITY, x: startX, y: topY + cardH + gap, w: cardW, h: cardH },
        { mode: GAME_MODES.GEOMETRY, x: startX, y: topY + (cardH + gap) * 2, w: cardW, h: cardH },
        { mode: GAME_MODES.HIGHWAY, x: startX, y: topY + (cardH + gap) * 3, w: cardW, h: cardH }
      ];

      this.drawModeCardCompact(ctx, this.startModeButtons[0], '📖 MODO HISTORIA', 'Ciudades → Geometría + Rescate', 'TOCA PARA CAMPAÑA', '#facc15');
      this.drawModeCardCompact(ctx, this.startModeButtons[1], '🏙️ CIUDAD LIBRE', 'Tegucigalpa & SPS • 5 cargas', 'TOCA PARA VOLAR', '#38bdf8');
      this.drawModeCardCompact(ctx, this.startModeButtons[2], '📐 GEOMETRÍA', 'Figuras de precisión arcade', 'TOCA PARA JUGAR', '#a855f7');
      this.drawModeCardCompact(ctx, this.startModeButtons[3], '🏃 EN CARRETERA', 'Guacamayas, Venados & Mareros', 'TOCA PARA CORRER', '#f97316');
      return;
    }

    const gap = 14;
    const cardW = Math.min(200, Math.floor((w - 60 - gap * 3) / 4));
    const cardH = 160;
    const startX = (w - (cardW * 4 + gap * 3)) / 2;
    const cardY = h / 2 - 86;

    this.startModeButtons = [
      { mode: GAME_MODES.STORY, x: startX, y: cardY, w: cardW, h: cardH },
      { mode: GAME_MODES.CITY, x: startX + cardW + gap, y: cardY, w: cardW, h: cardH },
      { mode: GAME_MODES.GEOMETRY, x: startX + (cardW + gap) * 2, y: cardY, w: cardW, h: cardH },
      { mode: GAME_MODES.HIGHWAY, x: startX + (cardW + gap) * 3, y: cardY, w: cardW, h: cardH }
    ];

    this.drawModeCard(ctx, this.startModeButtons[0], '📖 HISTORIA', '4 Capítulos', 'Ciudades → Geometría', '¡Incluye Rescate!', '[1] CAMPAÑA', '#facc15');
    this.drawModeCard(ctx, this.startModeButtons[1], '🏙️ CIUDAD', 'TGU & SPS', 'Apunta a la gente,', 'fuegos y laderas.', '[2] VOLAR', '#38bdf8');
    this.drawModeCard(ctx, this.startModeButtons[2], '📐 FIGURAS', 'Precisión', 'Encaja piezas en', 'bases neón.', '[3] JUGAR', '#a855f7');
    this.drawModeCard(ctx, this.startModeButtons[3], '🏃 CARRETERA', 'Tegucigalpa', 'Guacamayas, venados', 'y mareros.', '[4] CORRER', '#f97316');

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Presiona [1]-[4] o clic en tarjeta • Usa "✈️ Hangar" arriba para cambiar de avión', w / 2, cardY + cardH + 36);
  }

  drawModeCardCompact(ctx, box, title, subtitle, cta, accent) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 10);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    const cx = box.x + box.w / 2;
    ctx.textAlign = 'center';

    ctx.fillStyle = accent;
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(title, cx, box.y + box.h * 0.34);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText(subtitle, cx, box.y + box.h * 0.6);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(cta, cx, box.y + box.h * 0.84);
  }

  drawModeCard(ctx, box, title, subtitle, desc1, desc2, cta, accent) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 10);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    const cx = box.x + box.w / 2;
    ctx.textAlign = 'center';

    ctx.fillStyle = accent;
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(title, cx, box.y + 30);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText(subtitle, cx, box.y + 52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText(desc1, cx, box.y + 80);
    ctx.fillText(desc2, cx, box.y + 98);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(cta, cx, box.y + 136);
  }

  renderRescuePromptScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🆘 ¡ATERRIZAJE DE EMERGENCIA!', w / 2, h / 2 - 65);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillText('El Joy-O-Meter cayó a 0%, pero tienes una segunda oportunidad:', w / 2, h / 2 - 28);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('🏃 MISIÓN DE RESCATE EN CARRETERA', w / 2, h / 2 + 8);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText('Recoge 8 suministros esquivando guacamayas, venados y mareros', w / 2, h / 2 + 34);
    ctx.fillText('para recargar 50% de Joy y continuar donde quedaste.', w / 2, h / 2 + 52);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('▶ TOCA O PRESIONA [ESPACIO] PARA CORRER EL RESCATE', w / 2, h / 2 + 95);
  }

  renderLevelCompleteScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    const levelCfg = gameState.getCurrentLevelConfig();
    const starsStr = '⭐'.repeat(gameState.lastEarnedStars) + '☆'.repeat(Math.max(0, 3 - gameState.lastEarnedStars));

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🎉 ¡${levelCfg.title.toUpperCase()} COMPLETADO!`, w / 2, h / 2 - 70);

    ctx.font = '26px sans-serif';
    ctx.fillText(starsStr, w / 2, h / 2 - 28);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE: ${gameState.dropEngine.scorer.score}  |  ESTRELLAS TOTALES: ⭐ ${gameState.totalStars}`, w / 2, h / 2 + 16);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('▶ PRESIONA [ESPACIO] O TOCA PARA EL SIGUIENTE CAPÍTULO', w / 2, h / 2 + 72);
  }

  renderVictoryScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 ¡MISIÓN CUMPLIDA, GENERAL!', w / 2, h / 2 - 75);

    if (gameState.isNewRecord) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('🌟 ¡NUEVO RÉCORD HISTÓRICO! 🌟', w / 2, h / 2 - 42);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('Llevaste alegría máxima a todo el territorio.', w / 2, h / 2 - 16);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE FINAL: ${gameState.dropEngine.scorer.score}`, w / 2, h / 2 + 20);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`🏆 HIGH SCORE: ${gameState.highScore}`, w / 2, h / 2 + 48);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`MÁXIMO COMBO: x${gameState.dropEngine.scorer.maxCombo}`, w / 2, h / 2 + 74);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('🔄 PRESIONA [ESPACIO] O TOCA PARA VOLVER AL MENÚ', w / 2, h / 2 + 115);
  }

  renderGameOverScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💔 MISIÓN TERMINADA', w / 2, h / 2 - 75);

    if (gameState.isNewRecord) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('🌟 ¡NUEVO RÉCORD EN ESTE MODO! 🌟', w / 2, h / 2 - 44);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText(
      gameState.mode === GAME_MODES.HIGHWAY
        ? 'Te quedaste sin vidas en la carretera.'
        : 'El Joy-O-Meter cayó a 0%.',
      w / 2,
      h / 2 - 18
    );

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE FINAL: ${gameState.dropEngine.scorer.score}`, w / 2, h / 2 + 18);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`🏆 HIGH SCORE: ${gameState.highScore}`, w / 2, h / 2 + 46);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`MÁXIMO COMBO: x${gameState.dropEngine.scorer.maxCombo}`, w / 2, h / 2 + 72);

    if (gameState.mode === GAME_MODES.GEOMETRY) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`TIROS PERFECTOS: ${gameState.dropEngine.scorer.perfectDrops}`, w / 2, h / 2 + 94);
    }

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('🔄 PRESIONA [ESPACIO] O TOCA PARA REINTENTAR', w / 2, h / 2 + 126);
  }
}
