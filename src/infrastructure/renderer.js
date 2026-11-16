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
    this.canvas.width = Math.min(960, rect.width || 800);
    this.canvas.height = Math.min(540, window.innerHeight * 0.72 || 480);
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

    if (gameState.mode === GAME_MODES.HIGHWAY) {
      this.renderHighwayWorld(ctx, w, h, gameState);
      this.renderSpeedLines(ctx, w, h, gameState.plane.speed);
      this.renderParticles(ctx, gameState.dropEngine.particles);
      this.renderFloatingTexts(ctx, gameState.dropEngine.floatingTexts);
    } else {
      const currentBiome = gameState.getBiomeAtX(gameState.plane.x);
      this.renderSky(ctx, w, h, currentBiome, gameState.mode);
      this.renderFarMountains(ctx, w, h, gameState.mode);
      this.renderClouds(ctx, w, h, gameState.mode);

      // Suelo, Landmarks de Honduras y Edificios
      this.renderWorldChunks(ctx, gameState);

      this.renderSpeedLines(ctx, w, h, gameState.plane.speed);

      if (gameState.status === GAME_STATUS.PLAYING) {
        this.renderPredictiveReticle(ctx, gameState);
      }

      if (gameState.mode === GAME_MODES.GEOMETRY) {
        this.renderGeometrySlots(ctx, gameState);
      } else {
        this.renderCitizens(ctx, gameState);
      }

      // Objetos rodando en el suelo
      this.renderRollingItems(ctx, gameState.dropEngine.rollingItems, gameState.mode);

      // Partículas de impacto
      this.renderParticles(ctx, gameState.dropEngine.particles);

      // Objetos cayendo
      this.renderActiveDrops(ctx, gameState.dropEngine.activeDrops, gameState.mode);

      // Humo del avión
      this.renderSmoke(ctx, gameState.smokeTrail);

      // El Avión con General Xatruch
      this.sprites.drawPlane(ctx, gameState.plane, this.propellerAngle, this.elapsedTime);

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

    // Estrellas coleccionables
    for (const st of hw.stars) {
      const bob = Math.sin(this.elapsedTime * 7 + st.x * 0.05) * 4;
      this.sprites.drawGeoShape(ctx, 'STAR', st.x, st.y + bob, st.radius, '#facc15', false);
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
      }
    }

    // Corredor saltando por la ventana
    const r = hw.runner;
    const blink = r.invulnTimer > 0 && Math.floor(this.elapsedTime * 16) % 2 === 0;
    if (!blink) {
      ctx.save();
      ctx.translate(r.x, r.y);
      // Sombra en el suelo
      const shadowScale = Math.max(0.3, 1 - (groundY - r.y) / 140);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, groundY - r.y + 2, 12 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Piernas animadas
      const legSwing = r.grounded ? Math.sin(r.runPhase) * 6 : 5;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5 + legSwing, -12, 4, 12);
      ctx.fillRect(1 - legSwing, -12, 4, 12);
      // Torso (camiseta neón cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-7, -25, 14, 14);
      // Capa / bufanda al viento
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-16, -24 + Math.sin(this.elapsedTime * 15) * 2, 10, 4);
      // Cabeza
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-5, -35, 10, 10);
      // Gorra retro
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-6, -37, 12, 4);
      ctx.fillRect(2, -35, 6, 2);
      ctx.restore();
    }
  }

  renderSky(ctx, w, h, biome, mode) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, biome.skyGradient[0]);
    grad.addColorStop(0.75, biome.skyGradient[1]);
    grad.addColorStop(1, mode === GAME_MODES.GEOMETRY ? '#312e81' : '#ffffff22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

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

      // Franja superior de relieve
      ctx.fillStyle = chunk.biome.secondaryColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 7);

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
      // Cerro Juana Laínez con Monumento a la Paz
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(x - 105, y);
      ctx.quadraticCurveTo(x, y - 145, x + 105, y);
      ctx.fill();

      // Monumento a la Paz (obelisco/torre blanca con bandera)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 12, y - 125, 24, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 5, y - 165, 10, 40);
      ctx.fillStyle = '#0284c7'; // Bandera azul
      ctx.fillRect(x + 5, y - 164, 12, 7);

      this.drawLandmarkLabel(ctx, x, y - 174, 'CERRO JUANA LAÍNEZ');
    } else if (lm.type === 'ESTADIO_TGU') {
      // Estadio Nacional Chelato Uclés
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 75, y - 55, 150, 55);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 80, y - 62, 160, 10);
      // Torres de iluminación
      for (const tx of [x - 68, x - 24, x + 24, x + 68]) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 2, y - 92, 4, 30);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx - 6, y - 96, 12, 6);
      }
      this.drawLandmarkLabel(ctx, x, y - 104, 'ESTADIO NACIONAL');
    } else if (lm.type === 'CENTRO_CIVICO') {
      // Centro Cívico Gubernamental (torres gemelas modernas)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 55, y - 165, 42, 165);
      ctx.fillRect(x + 12, y - 150, 42, 150);
      ctx.fillStyle = '#38bdf8';
      for (let r = 10; r < 155; r += 12) {
        ctx.fillRect(x - 49, y - r, 30, 4);
        if (r < 140) ctx.fillRect(x + 18, y - r, 30, 4);
      }
      this.drawLandmarkLabel(ctx, x, y - 175, 'CENTRO CÍVICO');
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(b.x + 5, b.y + 5, b.width, b.height);

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
    } else if (b.type === BIOME_TYPES.FAVELA) {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(b.x + b.width * 0.7, b.y, b.width * 0.3, b.height);
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(b.x - 2, b.y, b.width + 4, 5);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(b.x + 8, b.y - 10, 12, 10);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x + 8, b.y + b.height - 20, 11, 20);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(b.x + b.width - 22, b.y + 12, 10, 10);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(b.x, b.y + 12, b.width * 0.6, b.height - 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x + 6, b.y + b.height - 16, 10, 16);

      const cx = b.x + b.width * 0.8;
      const cy = b.y + b.height;
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx - 3, cy - 34, 6, 34);
      ctx.fillRect(cx - 11, cy - 24, 22, 5);
      ctx.fillRect(cx - 11, cy - 30, 4, 8);
      ctx.fillRect(cx + 7, cy - 32, 4, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx - 1, cy - 32, 2, 30);
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
      groundY
    );

    let isTargetLocked = false;
    let isPerfectLock = false;

    if (gameState.mode === GAME_MODES.GEOMETRY) {
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
    const scorer = gameState.dropEngine.scorer;
    const levelCfg = gameState.getCurrentLevelConfig();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 46);

    if (gameState.mode === GAME_MODES.HIGHWAY) {
      const hw = gameState.highwayEngine;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'left';
      const hearts = '❤️'.repeat(Math.max(0, hw.lives)) + '🖤'.repeat(Math.max(0, hw.maxLives - hw.lives));
      ctx.fillText(`VIDAS: ${hearts}`, 16, 27);

      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('🏃 SALTO EN CARRETERA • [ESPACIO] SALTAR / DOBLE SALTO', w / 2, 18);

      const spd = Math.round(gameState.plane.speed);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = spd > 320 ? '#ef4444' : spd > 240 ? '#facc15' : '#94a3b8';
      ctx.fillText(`VELOCIDAD: ${spd} KM/H  |  RÉCORD: ${Math.max(gameState.highScore, scorer.score)}`, w / 2, 35);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`SCORE: ${scorer.score}`, w - 16, 22);
      if (scorer.combo > 1) {
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`COMBO x${scorer.combo}! 🔥`, w - 16, 37);
      }
      return;
    }

    // JOY-O-METER (Izquierda)
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText('💖 JOY-O-METER:', 16, 17);

    const barWidth = 128;
    const barHeight = 11;
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 24, barWidth, barHeight);

    const joyPct = scorer.joy / 100;
    const joyColor = joyPct > 0.6 ? '#22c55e' : joyPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = joyColor;
    ctx.fillRect(16, 24, barWidth * joyPct, barHeight);

    const minJoyX = 16 + barWidth * (levelCfg.minJoy / 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(minJoyX - 1, 22, 2, 15);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(scorer.joy)}%`, 150, 33);

    // NIVEL & ZONA ACTUAL (Centro)
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`${levelCfg.title.toUpperCase()} • ${currentBiome.accentEmoji} ${currentBiome.name.toUpperCase()}`, w / 2, 18);

    const spd = Math.round(gameState.plane.speed);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = spd > 280 ? '#ef4444' : spd > 195 ? '#facc15' : '#94a3b8';
    ctx.fillText(`VELOCIDAD: ${spd} KT  |  META: ${scorer.score}/${levelCfg.targetScore} (JOY ≥ ${levelCfg.minJoy}%)`, w / 2, 35);

    // PUNTUACIÓN Y COMBO (Derecha)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE: ${scorer.score}`, w - 16, 20);

    if (scorer.combo > 1) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`COMBO x${scorer.combo}! 🔥`, w - 16, 35);
    }

    this.renderCarouselHUD(ctx, gameState, w);
  }

  renderCarouselHUD(ctx, gameState, w) {
    const items = gameState.carouselItems;
    const selectedIdx = gameState.selectedItemIndex;
    const slotSize = 48;
    const gap = 10;
    const totalW = items.length * slotSize + (items.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const startY = this.canvas.height - 54;

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

      if (gameState.mode === GAME_MODES.GEOMETRY) {
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

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✈️ XATRUCH JOY BOMBER ARCADE', w / 2, h / 2 - 135);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillText('Elige un modo de juego para comenzar:', w / 2, h / 2 - 102);

    const cardW = 240;
    const cardH = 160;
    const gap = 18;
    const startX = (w - (cardW * 3 + gap * 2)) / 2;
    const cardY = h / 2 - 72;

    this.startModeButtons = [
      { mode: GAME_MODES.CITY, x: startX, y: cardY, w: cardW, h: cardH },
      { mode: GAME_MODES.GEOMETRY, x: startX + cardW + gap, y: cardY, w: cardW, h: cardH },
      { mode: GAME_MODES.HIGHWAY, x: startX + (cardW + gap) * 2, y: cardY, w: cardW, h: cardH }
    ];

    this.drawModeCard(
      ctx,
      this.startModeButtons[0],
      '🏙️ MODO CIUDAD',
      'Tegucigalpa & SPS',
      'Apunta a la gente y fuegos.',
      'Meta: 8,500 pts + Joy ≥ 65%',
      '[1] JUGAR CIUDAD',
      '#38bdf8'
    );

    this.drawModeCard(
      ctx,
      this.startModeButtons[1],
      '📐 GEOMETRÍA',
      'Básicas & Complejas',
      'Encaja figuras con precisión.',
      'Meta: 5,500 pts + Joy ≥ 55%',
      '[2] JUGAR FIGURAS',
      '#a855f7'
    );

    this.drawModeCard(
      ctx,
      this.startModeButtons[2],
      '🏃 EN CARRETERA',
      'Vista de Ventana',
      'Salta postes y carros con',
      '[ESPACIO] (Doble Salto!).',
      '[3] JUGAR CARRETERA',
      '#f97316'
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Presiona [1], [2], [3] o haz clic en una tarjeta para iniciar', w / 2, cardY + cardH + 40);
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

  renderLevelCompleteScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    const nextCfg = gameState.mode === GAME_MODES.CITY
      ? 'San Pedro Sula (Merendón, Olímpico, Los Bordos)'
      : 'Figuras Complejas (Hexágono, Rombo, Cruz, Luna)';

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ¡NIVEL 1 COMPLETADO!', w / 2, h / 2 - 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText(`Siguiente destino: ${nextCfg}`, w / 2, h / 2 - 20);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE ACTUAL: ${gameState.dropEngine.scorer.score}`, w / 2, h / 2 + 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('▶ PRESIONA [ESPACIO] O TOCA PARA DESPEGAR AL NIVEL 2', w / 2, h / 2 + 75);
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
