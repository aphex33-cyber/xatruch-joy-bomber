/**
 * DOMINIO: Motor físico balístico en 2D puro
 */

export class BallisticsEngine {
  constructor(gravity = 480) {
    this.gravity = gravity; // px/s^2
  }

  /**
   * Actualiza la posición y velocidad de un proyectil según dt (segundos)
   */
  updateProjectile(proj, dt) {
    // Aplicar resistencia al aire
    proj.vx *= Math.pow(proj.drag || 0.98, dt * 60);
    // Aplicar gravedad
    proj.vy += this.gravity * (proj.mass || 1.0) * dt;

    // Actualizar coordenadas
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    // Rotación estética en vuelo
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
      vx: planeVx * 0.95, // hereda la inercia del avión
      vy: planeVy + 60,   // impulso inicial hacia abajo
      drag: itemConfig.drag,
      mass: itemConfig.mass,
      rotation: 0,
      active: true,
      timeInAir: 0
    };
  }

  /**
   * Simula la trayectoria en pasos discretos para predecir dónde caerá el objeto
   */
  predictTrajectory(itemConfig, startX, startY, planeVx, groundY, steps = 40) {
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
