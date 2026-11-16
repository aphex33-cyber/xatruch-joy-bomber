/**
 * APLICACIÓN: Motor del Modo "Salto en Carretera" (Vista de Ventana)
 * El corredor imaginario salta postes, carros, cercas y arbustos en el horizonte.
 */

export class HighwayEngine {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - 64;
    this.gravity = 1420;

    this.runner = {
      x: 120,
      y: this.groundY,
      vy: 0,
      width: 24,
      height: 36,
      grounded: true,
      jumpsLeft: 2,
      maxJumps: 2,
      invulnTimer: 0,
      runPhase: 0
    };

    this.lives = 3;
    this.maxLives = 3;
    this.obstacles = [];
    this.stars = [];
    this.spawnTimer = 1.2;
    this.poleOffset = 0;

    // Callbacks de audio opcionales
    this.onStarCollected = null;
    this.onObstacleHit = null;
    this.onJump = null;
  }

  reset(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - 64;

    this.runner.y = this.groundY;
    this.runner.vy = 0;
    this.runner.grounded = true;
    this.runner.jumpsLeft = 2;
    this.runner.invulnTimer = 0;
    this.runner.runPhase = 0;

    this.lives = 3;
    this.obstacles = [];
    this.stars = [];
    this.spawnTimer = 1.0;
  }

  jump() {
    if (this.runner.jumpsLeft > 0) {
      const isDouble = !this.runner.grounded;
      this.runner.vy = isDouble ? -470 : -540;
      this.runner.grounded = false;
      this.runner.jumpsLeft--;
      if (this.onJump) this.onJump(isDouble);
      return true;
    }
    return false;
  }

  spawnObstaclePattern(speed) {
    const types = ['BUSH', 'SIGN', 'FENCE', 'CAR', 'POLE'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = 30;
    let height = 34;

    if (type === 'BUSH') {
      width = 36;
      height = 28;
    } else if (type === 'SIGN') {
      width = 22;
      height = 46;
    } else if (type === 'FENCE') {
      width = 48;
      height = 36;
    } else if (type === 'CAR') {
      width = 66;
      height = 34;
    } else if (type === 'POLE') {
      width = 18;
      height = 84; // Alto: ideal para doble salto
    }

    const spawnX = this.canvasWidth + 60;
    this.obstacles.push({
      x: spawnX,
      y: this.groundY - height,
      width,
      height,
      type,
      passed: false
    });

    // 65% de probabilidad de generar estrella de alegría sobre el obstáculo
    if (Math.random() < 0.65) {
      this.stars.push({
        x: spawnX + width / 2,
        y: this.groundY - height - (type === 'POLE' ? 42 : 48),
        radius: 11,
        collected: false
      });
    }
  }

  update(dt, speed, scorer, dropEngine) {
    this.groundY = this.canvasHeight - 64;
    this.poleOffset = (this.poleOffset + speed * dt) % 240;

    // 1. Física del corredor
    this.runner.runPhase += dt * (speed * 0.06);
    if (this.runner.invulnTimer > 0) {
      this.runner.invulnTimer = Math.max(0, this.runner.invulnTimer - dt);
    }

    this.runner.vy += this.gravity * dt;
    this.runner.y += this.runner.vy * dt;

    if (this.runner.y >= this.groundY) {
      this.runner.y = this.groundY;
      this.runner.vy = 0;
      this.runner.grounded = true;
      this.runner.jumpsLeft = this.runner.maxJumps;
    }

    // 2. Generación de obstáculos (tiempo inverso a la velocidad)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstaclePattern(speed);
      const minGap = Math.max(0.75, 1.85 - (speed - 160) * 0.0025);
      this.spawnTimer = minGap + Math.random() * 0.7;
    }

    // 3. Mover obstáculos y detectar colisiones
    const rBox = {
      x: this.runner.x - this.runner.width * 0.35,
      y: this.runner.y - this.runner.height + 4,
      w: this.runner.width * 0.7,
      h: this.runner.height - 6
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= speed * dt;

      // Puntos al superar obstáculo
      if (!obs.passed && obs.x + obs.width < this.runner.x) {
        obs.passed = true;
        scorer.score += 50;
        scorer.successfulDrops++;
      }

      // Colisión AABB
      if (
        this.runner.invulnTimer <= 0 &&
        rBox.x < obs.x + obs.width - 4 &&
        rBox.x + rBox.w > obs.x + 4 &&
        rBox.y < obs.y + obs.height - 2 &&
        rBox.y + rBox.h > obs.y + 4
      ) {
        this.lives--;
        this.runner.invulnTimer = 1.4;
        scorer.combo = 0;
        scorer.joy = Math.max(0, Math.round((this.lives / this.maxLives) * 100));
        dropEngine.screenShake = 9;

        if (this.onObstacleHit) this.onObstacleHit();

        dropEngine.floatingTexts.push({
          x: this.runner.x,
          y: this.runner.y - 50,
          text: '💥 ¡CHOCASTE!',
          subtext: `Te quedan ${this.lives} vidas`,
          color: '#f87171',
          life: 1.4,
          maxLife: 1.4,
          vy: -40
        });
      }

      if (obs.x + obs.width < -60) {
        this.obstacles.splice(i, 1);
      }
    }

    // 4. Estrellas coleccionables
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const st = this.stars[i];
      st.x -= speed * dt;

      if (!st.collected) {
        const dx = this.runner.x - st.x;
        const dy = (this.runner.y - this.runner.height / 2) - st.y;
        if (Math.hypot(dx, dy) < 28) {
          st.collected = true;
          scorer.combo++;
          if (scorer.combo > scorer.maxCombo) scorer.maxCombo = scorer.combo;
          const pts = 100 + Math.min(scorer.combo * 15, 150);
          scorer.score += pts;

          if (this.onStarCollected) this.onStarCollected();

          dropEngine.spawnImpactParticles(st.x, st.y, { color: '#facc15' }, true, false);
          dropEngine.floatingTexts.push({
            x: st.x,
            y: st.y - 16,
            text: `⭐ +${pts}`,
            subtext: scorer.combo > 1 ? `Combo x${scorer.combo}` : '',
            color: '#facc15',
            life: 1.2,
            maxLife: 1.2,
            vy: -40
          });
        }
      }

      if (st.collected || st.x < -40) {
        this.stars.splice(i, 1);
      }
    }

    // Sumar puntos pasivos por distancia recorrida
    scorer.score += Math.round(speed * dt * 0.08);
    scorer.joy = Math.max(0, Math.round((this.lives / this.maxLives) * 100));

    return this.lives <= 0;
  }
}
