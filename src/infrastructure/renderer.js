import { BIOME_TYPES, ITEMS_CATALOG } from '../domain/types.js';
import { GAME_STATUS } from '../application/game_state.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.propellerAngle = 0;
    this.cloudOffset = 0;
    this.mountainOffset = 0;
  }

  resize() {
    // Mantener relación de aspecto o ajustar a contenedor
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.min(960, rect.width || 800);
    this.canvas.height = Math.min(540, window.innerHeight * 0.75 || 480);
    this.ctx.imageSmoothingEnabled = false; // Modo pixel-art nítido
  }

  render(gameState, dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.propellerAngle += dt * 35;
    this.cloudOffset = (this.cloudOffset + gameState.plane.speed * 0.2 * dt) % w;
    this.mountainOffset = (this.mountainOffset + gameState.plane.speed * 0.08 * dt) % w;

    // 1. Limpiar pantalla
    ctx.clearRect(0, 0, w, h);

    // 2. Fondo según bioma predominante
    const currentBiome = gameState.getBiomeAtX(gameState.plane.x);
    this.renderSky(ctx, w, h, currentBiome);

    // 3. Montañas lejanas con parallax
    this.renderFarMountains(ctx, w, h);

    // 4. Nubes retro flotantes
    this.renderClouds(ctx, w, h);

    // 5. Suelo y Edificios de cada Chunk
    this.renderWorldChunks(ctx, gameState);

    // 6. Ciudadanos y sus burbujas de necesidad
    this.renderCitizens(ctx, gameState);

    // 7. Partículas de impacto
    this.renderParticles(ctx, gameState.dropEngine.particles);

    // 8. Objetos cayendo (Drops)
    this.renderActiveDrops(ctx, gameState.dropEngine.activeDrops);

    // 9. Humo del avión
    this.renderSmoke(ctx, gameState.smokeTrail);

    // 10. El Avión
    this.renderAirplane(ctx, gameState.plane);

    // 11. Textos flotantes (+100 JOY!)
    this.renderFloatingTexts(ctx, gameState.dropEngine.floatingTexts);

    // 12. Interfaz HUD (Joy-O-Meter, Combo, Score, Carrusel)
    this.renderHUD(ctx, gameState, currentBiome);

    // 13. Pantallas de Inicio / Game Over
    if (gameState.status === GAME_STATUS.START) {
      this.renderStartScreen(ctx, w, h);
    } else if (gameState.status === GAME_STATUS.GAMEOVER) {
      this.renderGameOverScreen(ctx, w, h, gameState);
    }
  }

  renderSky(ctx, w, h, biome) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, biome.skyGradient[0]);
    grad.addColorStop(0.7, biome.skyGradient[1]);
    grad.addColorStop(1, '#ffffff22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  renderFarMountains(ctx, w, h) {
    ctx.fillStyle = '#64748b44';
    ctx.beginPath();
    ctx.moveTo(0, h - 60);

    const baseLine = h - 60;
    const step = 80;
    for (let x = -this.mountainOffset; x < w + step; x += step) {
      const peakY = baseLine - 50 - Math.sin((x + this.mountainOffset) * 0.015) * 40;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(w, baseLine);
    ctx.lineTo(0, baseLine);
    ctx.fill();
  }

  renderClouds(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    const clouds = [
      { x: 100, y: 40, size: 35 },
      { x: 380, y: 70, size: 28 },
      { x: 650, y: 30, size: 42 }
    ];

    clouds.forEach(c => {
      const cx = (c.x - this.cloudOffset + w * 2) % (w + 100) - 50;
      this.drawPixelCloud(ctx, cx, c.y, c.size);
    });
  }

  drawPixelCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  renderWorldChunks(ctx, gameState) {
    const groundY = gameState.canvasHeight - 60;

    for (const chunk of gameState.biomeChunks) {
      if (chunk.endX < 0 || chunk.startX > gameState.canvasWidth) continue;

      // Color base del suelo
      ctx.fillStyle = chunk.biome.groundColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 60);

      // Franja superior de relieve
      ctx.fillStyle = chunk.biome.secondaryColor;
      ctx.fillRect(chunk.startX, groundY, chunk.chunkWidth + 2, 6);

      // Renderizar edificios
      for (const b of chunk.buildings) {
        if (b.x + b.width < 0 || b.x > gameState.canvasWidth) continue;
        this.renderBuilding(ctx, b, chunk.biome);
      }
    }
  }

  renderBuilding(ctx, b, biome) {
    // Sombra edificio
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(b.x + 4, b.y + 4, b.width, b.height);

    // Cuerpo del edificio
    if (b.type === BIOME_TYPES.RICH_DISTRICT) {
      // Rascacielos moderno con ventanas iluminadas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Antena dorada en techo
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(b.x + b.width / 2 - 2, b.y - 14, 4, 14);

      // Ventanales
      ctx.fillStyle = '#38bdf888';
      for (let r = 8; r < b.height - 10; r += 16) {
        for (let c = 8; c < b.width - 8; c += 14) {
          ctx.fillRect(b.x + c, b.y + r, 8, 8);
        }
      }
    } else if (b.type === BIOME_TYPES.FIRE_EMERGENCY) {
      // Edificio quemado con fuego en el techo
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Llamas animadas
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < b.width; i += 12) {
        const flameH = 10 + Math.sin(Date.now() * 0.01 + i) * 6;
        ctx.fillRect(b.x + i, b.y - flameH, 8, flameH);
      }
    } else if (b.type === BIOME_TYPES.FAVELA) {
      // Casas apiladas con ladrillos
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(b.x + 4, b.y + 6, b.width - 8, b.height - 12);

      // Puerta y ventana
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x + 8, b.y + b.height - 20, 12, 20);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(b.x + b.width - 20, b.y + 10, 10, 10);
    } else {
      // Desierto: Cactus o tiendas sencillas
      ctx.fillStyle = '#15803d'; // Cactus
      const cx = b.x + b.width * 0.5;
      ctx.fillRect(cx - 3, b.y + b.height - 35, 6, 35);
      ctx.fillRect(cx - 10, b.y + b.height - 25, 20, 5);
      ctx.fillRect(cx - 10, b.y + b.height - 30, 4, 8);
      ctx.fillRect(cx + 6, b.y + b.height - 32, 4, 10);
    }
  }

  renderCitizens(ctx, gameState) {
    const now = Date.now() * 0.005;

    for (const c of gameState.citizens) {
      if (c.x < -30 || c.x > gameState.canvasWidth + 30) continue;

      const bobY = Math.sin(now + c.animationOffset) * 3;

      // Cuerpo del ciudadano (Pixel character retro)
      ctx.fillStyle = '#1e293b';
      // Cabeza
      ctx.fillRect(c.x, c.y - 16 + bobY, 6, 6);
      // Torso
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(c.x - 1, c.y - 10 + bobY, 8, 8);
      // Piernas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(c.x, c.y - 2 + bobY, 2, 6);
      ctx.fillRect(c.x + 4, c.y - 2 + bobY, 2, 6);

      // Globo de diálogo retro con lo que pide
      const bubbleY = c.y - 32 + bobY;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(c.x - 12, bubbleY, 28, 16, 4);
      ctx.fill();

      // Flecha del globo
      ctx.beginPath();
      ctx.moveTo(c.x, bubbleY + 16);
      ctx.lineTo(c.x + 4, bubbleY + 16);
      ctx.lineTo(c.x + 2, bubbleY + 20);
      ctx.fill();

      // Emoji de lo que necesita
      ctx.font = '12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.needIcon, c.x + 2, bubbleY + 12);
    }
  }

  renderActiveDrops(ctx, drops) {
    for (const d of drops) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);

      // Pequeño paracaídas pixelado
      ctx.fillStyle = '#ffffffdd';
      ctx.beginPath();
      ctx.arc(0, -12, 10, Math.PI, 0);
      ctx.fill();

      // Cuerdas del paracaídas
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(0, 0);
      ctx.moveTo(10, -12);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Contenedor del ítem
      ctx.fillStyle = d.item.color;
      ctx.fillRect(-6, -6, 12, 12);

      // Icono
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.item.icon, 0, 0);

      ctx.restore();
    }
  }

  renderSmoke(ctx, smokeTrail) {
    for (const s of smokeTrail) {
      const alpha = (s.life / s.maxLife) * 0.5;
      ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderAirplane(ctx, plane) {
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.tilt);

    // Fuselaje retro (Blanco y Rojo benévolo)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 4, plane.width, 16);

    // Cabina de mando (vidrio azul cielo)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(plane.width - 16, 6, 10, 8);

    // Franja roja distintiva de ayuda humanitaria
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 9, plane.width - 24, 6);

    // Cruz blanca en la franja roja
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 10, 6, 4);
    ctx.fillRect(25, 9, 4, 6);

    // Cola / alerón trasero
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(8, -8);
    ctx.lineTo(16, 4);
    ctx.fill();

    // Alas principales (doble ala estilo biplano retro)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(18, -4, 28, 4);
    ctx.fillRect(18, 20, 28, 4);

    // Soportes de las alas
    ctx.fillStyle = '#64748b';
    ctx.fillRect(24, 0, 2, 20);
    ctx.fillRect(40, 0, 2, 20);

    // Hélice frontal animada
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(plane.width, 10, 3, 4); // Eje
    ctx.fillStyle = '#94a3b8';
    const propSpan = Math.sin(this.propellerAngle) * 14;
    ctx.fillRect(plane.width + 3, 12 - propSpan, 2, propSpan * 2);

    ctx.restore();
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
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);

      if (ft.subtext) {
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.subtext, ft.x, ft.y + 14);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  renderHUD(ctx, gameState, currentBiome) {
    const w = this.canvas.width;
    const scorer = gameState.dropEngine.scorer;

    // --- 1. BARRA SUPERIOR HUD ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 44);

    // JOY-O-METER
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText('💖 JOY-O-METER:', 16, 18);

    // Barra de Alegría
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

    // ZONA ACTUAL (Centro)
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

    // --- 2. CARRUSEL INFERIOR DE OBJETOS ---
    this.renderCarouselHUD(ctx, gameState, w);
  }

  renderCarouselHUD(ctx, gameState, w) {
    const items = gameState.carouselItems;
    const selectedIdx = gameState.selectedItemIndex;
    const slotSize = 46;
    const gap = 10;
    const totalW = items.length * slotSize + (items.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const startY = this.canvas.height - 52;

    // Fondo del dock
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(startX - 14, startY - 6, totalW + 28, slotSize + 12, 10);
    ctx.fill();

    items.forEach((itemId, idx) => {
      const x = startX + idx * (slotSize + gap);
      const y = startY;
      const itemConfig = ITEMS_CATALOG[itemId];
      const isSelected = idx === selectedIdx;

      // Marco del slot
      ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
      ctx.fillRect(x - 2, y - 2, slotSize + 4, slotSize + 4);

      ctx.fillStyle = isSelected ? '#0f172a' : '#334155';
      ctx.fillRect(x, y, slotSize, slotSize);

      // Icono
      ctx.font = isSelected ? '20px sans-serif' : '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemConfig.icon, x + slotSize / 2, y + slotSize / 2 - 4);

      // Atajo de teclado (1, 2, 3, 4)
      ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`[${idx + 1}]`, x + slotSize / 2, y + slotSize - 6);
    });
  }

  renderStartScreen(ctx, w, h) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✈️ JOY BOMBER RETRO', w / 2, h / 2 - 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('Lanza ayuda desde el avión y alegra a la gente según su necesidad:', w / 2, h / 2 - 20);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText('🏜️ Desierto ➔ 💧 Agua | 🏙️ Barrio Rico ➔ 📖 Biblia / Sabiduría', w / 2, h / 2 + 10);
    ctx.fillText('🏘️ Favela ➔ 🥖 Comida / 🎁 Juguetes | 🔥 Incendio ➔ 💧 Agua', w / 2, h / 2 + 30);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('▶ PRESIONA [ESPACIO] O TOCA LA PANTALLA PARA VOLAR', w / 2, h / 2 + 75);
  }

  renderGameOverScreen(ctx, w, h, gameState) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💔 MISIÓN TERMINADA', w / 2, h / 2 - 50);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('La alegría de la ciudad cayó a 0% por falta de sonrisas.', w / 2, h / 2 - 15);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`SCORE FINAL: ${gameState.dropEngine.scorer.score}`, w / 2, h / 2 + 25);
    ctx.fillText(`MÁXIMO COMBO: x${gameState.dropEngine.scorer.maxCombo}`, w / 2, h / 2 + 55);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('🔄 PRESIONA [ESPACIO] O TOCA PARA REINTENTAR', w / 2, h / 2 + 100);
  }
}
