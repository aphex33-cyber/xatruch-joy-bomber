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

    // Screen shake sutil en impactos grandes / PERFECT
    if (gameState.dropEngine.screenShake > 0) {
      const shake = gameState.dropEngine.screenShake;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Cielo según bioma o modo
    const currentBiome = gameState.getBiomeAtX(gameState.plane.x);
    this.renderSky(ctx, w, h, currentBiome, gameState.mode);

    // 2. Montañas / Skyline lejano con parallax
    this.renderFarMountains(ctx, w, h, gameState.mode);

    // 3. Nubes retro estilizadas
    this.renderClouds(ctx, w, h, gameState.mode);

    // 4. Suelo y Edificios detallados
    this.renderWorldChunks(ctx, gameState);

    // 5. Mira de trayectoria predictiva (solo mientras juega)
    if (gameState.status === GAME_STATUS.PLAYING) {
      this.renderPredictiveReticle(ctx, gameState);
    }

    // 6. Objetivos en tierra (Ciudadanos o Bases Geométricas)
    if (gameState.mode === GAME_MODES.GEOMETRY) {
      this.renderGeometrySlots(ctx, gameState);
    } else {
      this.renderCitizens(ctx, gameState);
    }

    // 7. Partículas de impacto
    this.renderParticles(ctx, gameState.dropEngine.particles);

    // 8. Objetos cayendo (Drops)
    this.renderActiveDrops(ctx, gameState.dropEngine.activeDrops, gameState.mode);

    // 9. Humo del avión
    this.renderSmoke(ctx, gameState.smokeTrail);

    // 10. El Avión Sprite Arcade
    this.sprites.drawPlane(ctx, gameState.plane, this.propellerAngle, this.elapsedTime);

    // 11. Textos flotantes
    this.renderFloatingTexts(ctx, gameState.dropEngine.floatingTexts);

    ctx.restore();

    // 12. Interfaz HUD (fuera del screen shake)
    this.renderHUD(ctx, gameState, currentBiome);

    // 13. Pantallas de Inicio / Game Over
    if (gameState.status === GAME_STATUS.START) {
      this.renderStartScreen(ctx, w, h, gameState);
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      this.renderGameOverScreen(ctx, w, h, gameState);
    }
  }

  renderSky(ctx, w, h, biome, mode) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, biome.skyGradient[0]);
    grad.addColorStop(0.75, biome.skyGradient[1]);
    grad.addColorStop(1, mode === GAME_MODES.GEOMETRY ? '#312e81' : '#ffffff22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Estrellas sutiles en modo Geometría Neón
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
      // Nube pixel-art escalonada
      ctx.fillRect(cx, c.y, c.w, 12);
      ctx.fillRect(cx + 8, c.y - 8, c.w - 16, 8);
      ctx.fillRect(cx + 16, c.y - 14, c.w - 32, 6);
    });
  }

  renderWorldChunks(ctx, gameState) {
    const groundY = gameState.canvasHeight - 60;

    for (const chunk of gameState.biomeChunks) {
      if (chunk.endX < 0 || chunk.startX > gameState.canvasWidth) continue;

      // Suelo principal
      ctx.fillStyle = chunk.biome.groundColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 60);

      // Franja superior de relieve / acera
      ctx.fillStyle = chunk.biome.secondaryColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 7);

      // Detalle de cuadrícula neón en modo Geometría
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

      // Edificios detallados
      for (const b of chunk.buildings) {
        if (b.x + b.width < -20 || b.x > gameState.canvasWidth + 20) continue;
        this.renderBuilding(ctx, b);
      }
    }
  }

  renderBuilding(ctx, b) {
    // Sombra proyectada
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
      // Rascacielos cristal y acero con cornisa y antena
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#334155';
      ctx.fillRect(b.x, b.y, b.width, 6); // Cornisa
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x + b.width * 0.72, b.y, b.width * 0.28, b.height); // Sombra lateral

      // Antena con luz parpadeante
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(b.x + b.width / 2 - 2, b.y - 16, 4, 16);
      if (Math.sin(this.elapsedTime * 5) > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(b.x + b.width / 2 - 2, b.y - 18, 4, 4);
      }

      // Ventanales iluminados
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

      // Ventanas
      for (let r = 12; r < b.height - 12; r += 18) {
        for (let c = 8; c < b.width - 10; c += 16) {
          ctx.fillStyle = b.extinguished ? '#64748b' : '#f97316';
          ctx.fillRect(b.x + c, b.y + r, 8, 10);
        }
      }

      // Llamas animadas solo si no se ha apagado
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
      // Casas coloridas con techo y tinaco
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(b.x + b.width * 0.7, b.y, b.width * 0.3, b.height);
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(b.x - 2, b.y, b.width + 4, 5);

      // Tinaco azul en techo
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(b.x + 8, b.y - 10, 12, 10);

      // Puerta y ventanas
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x + 8, b.y + b.height - 20, 11, 20);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(b.x + b.width - 22, b.y + 12, 10, 10);
    } else {
      // Desierto: Choza de adobe y cactus detallado
      ctx.fillStyle = '#b45309';
      ctx.fillRect(b.x, b.y + 12, b.width * 0.6, b.height - 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x + 6, b.y + b.height - 16, 10, 16);

      // Cactus arcade
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

    // Arco punteado sutil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    for (let i = 0; i < points.length; i += 2) {
      ctx.fillRect(points[i].x - 1.5, points[i].y - 1.5, 3, 3);
    }

    // Mira en el suelo
    const pulse = 1 + Math.sin(this.elapsedTime * 10) * 0.15;
    ctx.strokeStyle = itemConfig ? itemConfig.color : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(landingX, groundY + 2, 16 * pulse, 5 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderCitizens(ctx, gameState) {
    for (const c of gameState.citizens) {
      if (c.x < -30 || c.x > gameState.canvasWidth + 30) continue;

      this.sprites.drawCitizen(ctx, c, this.elapsedTime);

      // Globo de diálogo si aún espera ayuda
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

      // Pedestal metálico en el suelo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(slot.x - 24, groundY - 6, 48, 10);
      ctx.fillStyle = slot.filled ? '#22c55e' : baseColor;
      ctx.fillRect(slot.x - 24, groundY - 6, 48, 3);

      // Silueta o pieza encajada
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

  renderActiveDrops(ctx, drops, mode) {
    for (const d of drops) {
      ctx.save();
      ctx.translate(d.x, d.y);

      if (mode === GAME_MODES.GEOMETRY) {
        ctx.rotate(d.rotation * 0.5);
        this.sprites.drawGeoShape(ctx, d.item.id, 0, 0, 14, d.item.color, false);
      } else {
        ctx.rotate(d.rotation);
        // Paracaídas retro
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

        // Caja de suministro
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

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, w, 44);

    // JOY-O-METER
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText('💖 JOY-O-METER:', 16, 18);

    const barWidth = 140;
    const barHeight = 12;
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 24, barWidth, barHeight);

    const joyPct = scorer.joy / 100;
    const joyColor = joyPct > 0.6 ? '#22c55e' : joyPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = joyColor;
    ctx.fillRect(16, 24, barWidth * joyPct, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(scorer.joy)}%`, 165, 33);

    // ZONA / MODO ACTUAL (Centro)
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentBiome.accentEmoji} ${currentBiome.name.toUpperCase()}`, w / 2, 26);

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
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✈️ JOY BOMBER ARCADE', w / 2, h / 2 - 75);

    const isCity = gameState.mode === GAME_MODES.CITY;

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText(
      isCity
        ? 'Modo 1: Lanza ayuda y alegría según la necesidad de cada barrio'
        : 'Modo 2: Encaja las figuras geométricas justo en su base de precisión',
      w / 2,
      h / 2 - 35
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Inter", sans-serif';
    if (isCity) {
      ctx.fillText('🏜️ Desierto ➔ 💧 Agua | 🏙️ Barrio Rico ➔ 📖 Biblia / Sabiduría', w / 2, h / 2 - 2);
      ctx.fillText('🏘️ Favela ➔ 🥖 Comida / 🎁 Regalos | 🔥 Incendio ➔ 💧 Agua', w / 2, h / 2 + 18);
    } else {
      ctx.fillText('🔺 Triángulo | 🟦 Cuadrado | 🟡 Círculo | ⭐ Estrella', w / 2, h / 2 - 2);
      ctx.fillText('🎯 Apunta con la mira en el suelo: PERFECT (+300) | BIEN (+120)', w / 2, h / 2 + 18);
    }

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('Usa el botón superior "Cambiar Modo" para alternar entre Ciudad y Geometría', w / 2, h / 2 + 52);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('▶ PRESIONA [ESPACIO] O TOCA LA PANTALLA PARA VOLAR', w / 2, h / 2 + 88);
  }

  renderGameOverScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💔 MISIÓN TERMINADA', w / 2, h / 2 - 55);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('El Joy-O-Meter cayó a 0%.', w / 2, h / 2 - 20);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE FINAL: ${gameState.dropEngine.scorer.score}`, w / 2, h / 2 + 20);
    ctx.fillText(`MÁXIMO COMBO: x${gameState.dropEngine.scorer.maxCombo}`, w / 2, h / 2 + 48);

    if (gameState.mode === GAME_MODES.GEOMETRY) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`TIROS PERFECTOS: ${gameState.dropEngine.scorer.perfectDrops}`, w / 2, h / 2 + 76);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('🔄 PRESIONA [ESPACIO] O TOCA PARA REINTENTAR', w / 2, h / 2 + 112);
  }
}
