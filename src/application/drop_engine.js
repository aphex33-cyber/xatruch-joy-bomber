import { BallisticsEngine } from '../domain/physics.js';
import { JoyScorer } from '../domain/score.js';
import { GAME_MODES, ITEMS_CATALOG, ITEM_TYPES, BIOME_TYPES } from '../domain/types.js';

export class DropEngine {
  constructor() {
    this.physics = new BallisticsEngine(480);
    this.scorer = new JoyScorer();
    this.activeDrops = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
  }

  drop(itemId, plane) {
    const itemConfig = ITEMS_CATALOG[itemId];
    if (!itemConfig) return null;

    const projectile = this.physics.spawnDrop(
      itemConfig,
      plane.x + plane.width * 0.5,
      plane.y + plane.height,
      plane.speed,
      0
    );

    this.activeDrops.push(projectile);
    return projectile;
  }

  update(dt, gameState) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 1. Actualizar proyectiles
    for (let i = this.activeDrops.length - 1; i >= 0; i--) {
      const p = this.activeDrops[i];
      p.timeInAir += dt;
      this.physics.updateProjectile(p, dt);

      const groundY = gameState.getGroundHeightAtX(p.x);

      // Colisión con el terreno
      if (p.y >= groundY) {
        p.active = false;

        if (gameState.mode === GAME_MODES.GEOMETRY) {
          this.handleGeometryImpact(p, groundY, gameState);
        } else {
          this.handleCityImpact(p, groundY, gameState);
        }

        this.activeDrops.splice(i, 1);
      } else if (p.x < -100 || p.x > 5000) {
        this.activeDrops.splice(i, 1);
      }
    }

    // 2. Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += (part.gravity ?? 300) * dt;
      part.life -= dt;
      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Actualizar textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 4. Decaimiento leve de alegría
    this.scorer.decayJoy(dt);
  }

  handleCityImpact(p, groundY, gameState) {
    const biome = gameState.getBiomeAtX(p.x);
    const result = this.scorer.evaluateImpact(p.item, biome);

    // Interacción directa con ciudadanos cercanos
    if (result.matched) {
      for (const c of gameState.citizens) {
        if (Math.abs(c.x - p.x) < 90) {
          c.isHappy = true;
          c.happyTimer = 3.5;
        }
      }

      // Si es agua sobre un edificio en llamas, apagar el fuego
      if (p.item.id === ITEM_TYPES.WATER && biome.id === BIOME_TYPES.FIRE_EMERGENCY) {
        for (const chunk of gameState.biomeChunks) {
          for (const b of chunk.buildings) {
            if (b.type === BIOME_TYPES.FIRE_EMERGENCY && !b.extinguished) {
              if (p.x >= b.x - 25 && p.x <= b.x + b.width + 25) {
                b.extinguished = true;
                this.spawnSteamParticles(b.x + b.width / 2, b.y);
              }
            }
          }
        }
      }

      if (result.combo >= 3) {
        this.screenShake = 5;
      }
    }

    this.spawnImpactParticles(p.x, groundY, p.item, result.matched, false);

    this.floatingTexts.push({
      x: p.x,
      y: groundY - 20,
      text: result.matched ? `+${result.points} JOY!` : '¡ERROR! -JOY',
      subtext: result.message,
      color: result.matched ? '#4ade80' : '#f87171',
      life: 2.0,
      maxLife: 2.0,
      vy: -35
    });
  }

  handleGeometryImpact(p, groundY, gameState) {
    // Buscar la base geométrica más cercana
    let closestSlot = null;
    let minDist = Infinity;

    for (const slot of gameState.geometrySlots) {
      const dist = Math.abs(slot.x - p.x);
      if (dist < minDist) {
        minDist = dist;
        closestSlot = slot;
      }
    }

    const result = this.scorer.evaluateGeometryImpact(p.item, closestSlot, minDist);

    if (result.matched && closestSlot) {
      closestSlot.filled = true;
      closestSlot.tier = result.tier;
      closestSlot.snapAnim = 1.0;

      if (result.tier === 'PERFECT') {
        this.screenShake = 8;
      }
    }

    this.spawnImpactParticles(p.x, groundY, p.item, result.matched, result.tier === 'PERFECT');

    const titleText =
      result.tier === 'PERFECT'
        ? `🎯 PERFECT! +${result.points}`
        : result.tier === 'GOOD'
          ? `👍 BIEN! +${result.points}`
          : '💥 MISS!';

    const titleColor =
      result.tier === 'PERFECT'
        ? '#facc15'
        : result.tier === 'GOOD'
          ? '#4ade80'
          : '#f87171';

    this.floatingTexts.push({
      x: p.x,
      y: groundY - 26,
      text: titleText,
      subtext: result.message,
      color: titleColor,
      life: 1.9,
      maxLife: 1.9,
      vy: -40
    });
  }

  spawnImpactParticles(x, y, item, isSuccess, isPerfect) {
    const count = isPerfect ? 36 : isSuccess ? 22 : 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = isPerfect
        ? 90 + Math.random() * 170
        : isSuccess
          ? 60 + Math.random() * 130
          : 30 + Math.random() * 60;
      this.particles.push({
        x,
        y: y - 5,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed) - 35,
        color: isPerfect && i % 2 === 0 ? '#facc15' : isSuccess ? item.color : '#94a3b8',
        size: isPerfect ? 5 + Math.random() * 4 : isSuccess ? 4 + Math.random() * 3 : 3,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        gravity: 300
      });
    }
  }

  spawnSteamParticles(x, y) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vx: (Math.random() - 0.5) * 35,
        vy: -40 - Math.random() * 50,
        color: '#e2e8f0',
        size: 6 + Math.random() * 6,
        life: 0.9 + Math.random() * 0.4,
        maxLife: 1.3,
        gravity: -20 // El vapor sube
      });
    }
  }
}
