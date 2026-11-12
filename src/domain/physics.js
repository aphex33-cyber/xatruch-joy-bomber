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
    proj.rotation += (proj.vx * 0.05 + 1.2) * dt;

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
}
