import { BallisticsEngine } from '../domain/physics.js';
import { JoyScorer } from '../domain/score.js';
import { ITEMS_CATALOG, ITEM_TYPES } from '../domain/types.js';

export class DropEngine {
  constructor() {
    this.physics = new BallisticsEngine(480);
    this.scorer = new JoyScorer();
    this.activeDrops = [];
    this.particles = [];
    this.floatingTexts = [];
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

  update(dt, groundHeightAtX, getBiomeAtX) {
    // 1. Actualizar proyectiles
    for (let i = this.activeDrops.length - 1; i >= 0; i--) {
      const p = this.activeDrops[i];
      p.timeInAir += dt;
      this.physics.updateProjectile(p, dt);

      const groundY = groundHeightAtX(p.x);

      // Colisión con el terreno
      if (p.y >= groundY) {
        p.active = false;
        const biome = getBiomeAtX(p.x);
        const result = this.scorer.evaluateImpact(p.item, biome);

        // Crear explosión de partículas de alegría o agua/confeti
        this.spawnImpactParticles(p.x, groundY, p.item, result.matched);

        // Texto flotante de puntuación / mensaje
        this.floatingTexts.push({
          x: p.x,
          y: groundY - 15,
          text: result.matched ? `+${result.points} JOY!` : '¡NO GRACIAS! -JOY',
          subtext: result.message,
          color: result.matched ? '#4ade80' : '#f87171',
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });

        this.activeDrops.splice(i, 1);
      } else if (p.x < -100 || p.x > 5000) {
        // Fuera de límites
        this.activeDrops.splice(i, 1);
      }
    }

    // 2. Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 300 * dt; // gravedad de partículas
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

  spawnImpactParticles(x, y, item, isSuccess) {
    const count = isSuccess ? 24 : 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = isSuccess ? 60 + Math.random() * 140 : 30 + Math.random() * 60;
      this.particles.push({
        x,
        y: y - 5,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed) - 30,
        color: isSuccess ? item.color : '#94a3b8',
        size: isSuccess ? 4 + Math.random() * 4 : 3,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2
      });
    }
  }
}
