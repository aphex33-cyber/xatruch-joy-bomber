/**
 * DOMINIO: Motor físico balístico en 2D puro
 */

export class BallisticsEngine {
  constructor(gravity = 480) {
    this.gravity = gravity; // px/s^2
  }

  /**
   * Actualiza la posición y velocidad de un proyectil según dt (segundos) y viento cruzado
   */
  updateProjectile(proj, dt, windX = 0) {
    proj.vx += windX * dt;
    proj.vx *= Math.pow(proj.drag || 0.98, dt * 60);
    proj.vy += this.gravity * (proj.mass || 1.0) * dt;

    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    proj.rotation += (proj.vx * 0.03 + 0.8) * dt;

    return proj;
  }

  /**
   * Crea un proyectil saliendo del avión
   */
  spawnDrop(itemConfig, planeX, planeY, planeVx, planeVy = 0) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: itemConfig.id,
      item: itemConfig,
      x: planeX,
      y: planeY + 12,
      vx: planeVx * 0.95,
      vy: planeVy + 60,
      drag: itemConfig.drag,
      mass: itemConfig.mass,
      rotation: 0,
      active: true,
      timeInAir: 0
    };
  }

  /**
   * Crea un objeto que rebota y rueda por el suelo tras caer
   */
  spawnRollingItem(itemConfig, x, y, vx) {
    return {
      item: itemConfig,
      x,
      y: y - 7,
      vx: vx * 0.52, // conserva parte del impulso horizontal para rodar
      vy: -85,       // pequeño rebote inicial
      rotation: 0,
      life: 1.6,
      maxLife: 1.6
    };
  }

  /**
   * Actualiza el rebote y rodamiento en el suelo
   */
  updateRollingItem(r, dt, groundY) {
    r.vy += this.gravity * dt;
    r.x += r.vx * dt;
    r.y += r.vy * dt;

    const floorY = groundY - 7;
    if (r.y >= floorY) {
      r.y = floorY;
      // Rebote amortiguado si aún trae velocidad vertical
      if (r.vy > 45) {
        r.vy = -r.vy * 0.35;
      } else {
        r.vy = 0;
      }
      // Fricción de rodamiento en el suelo
      r.vx *= Math.pow(0.88, dt * 60);
    }

    // Giro proporcional a la velocidad horizontal (efecto de rodar)
    r.rotation += (r.vx / 12) * dt;
    r.life -= dt;
    return r;
  }

  /**
   * Simula la trayectoria en pasos discretos para predecir dónde caerá el objeto
   */
  predictTrajectory(itemConfig, startX, startY, planeVx, groundY, steps = 40, windX = 0) {
    const sim = {
      x: startX,
      y: startY + 12,
      vx: planeVx * 0.95,
      vy: 60,
      drag: itemConfig ? itemConfig.drag : 0.985,
      mass: itemConfig ? itemConfig.mass : 1.0
    };

    const points = [];
    const dt = 0.035;

    for (let i = 0; i < steps; i++) {
      sim.vx += windX * dt;
      sim.vx *= Math.pow(sim.drag, dt * 60);
      sim.vy += this.gravity * sim.mass * dt;
      sim.x += sim.vx * dt;
      sim.y += sim.vy * dt;

      if (sim.y >= groundY) {
        points.push({ x: sim.x, y: groundY });
        return { landingX: sim.x, points };
      }
      points.push({ x: sim.x, y: sim.y });
    }

    return { landingX: sim.x, points };
  }
}
