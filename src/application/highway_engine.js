import { ITEM_TYPES, ITEMS_CATALOG } from '../domain/types.js';

/**
 * APLICACIÓN: Motor del Modo "Salto en Carretera" (Vista de Ventana)
 * El General Xatruch corre por Tegucigalpa saltando obstáculos y recolectando suministros.
 */

const HIGHWAY_COLLECTIBLES = [
  ITEM_TYPES.WATER,
  ITEM_TYPES.FOOD,
  ITEM_TYPES.MONEY,
  ITEM_TYPES.BIBLE,
  ITEM_TYPES.TOY
];

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
    this.isRescueMode = false;
    this.rescueGoal = 8;
    this.rescueCollected = 0;
    this.obstacles = [];
    this.stars = [];
    this.landmarks = [];
    this.landmarkSeq = 0;
    this.spawnTimer = 1.2;
    this.poleOffset = 0;

    // Callbacks de audio opcionales
    this.onStarCollected = null;
    this.onObstacleHit = null;
    this.onJump = null;
  }

  reset(canvasWidth, canvasHeight, isRescueMode = false) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - 64;
    this.isRescueMode = isRescueMode;
    this.rescueCollected = 0;

    this.runner.y = this.groundY;
    this.runner.vy = 0;
    this.runner.grounded = true;
    this.runner.jumpsLeft = 2;
    this.runner.invulnTimer = 0;
    this.runner.runPhase = 0;

    this.lives = 3;
    this.obstacles = [];
    this.stars = [];
    this.landmarks = [
      { type: 'JUANA_LAINEZ', x: 260 },
      { type: 'CENTRO_CIVICO', x: 680 },
      { type: 'CATEDRAL', x: 1120 }
    ];
    this.landmarkSeq = 3;
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
    const types = [
      'BUSH', 'SIGN', 'FENCE', 'CAR', 'POLE',
      'MACAW', 'DEER', 'GANGSTER', 'TRAFFIC_JAM',
      'STRAY_DOG', 'LA_SUCIA'
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = 30;
    let height = 34;
    let y = this.groundY - height;
    let cars = null;
    let honkText = '';

    if (type === 'BUSH') {
      width = 36;
      height = 28;
      y = this.groundY - height;
    } else if (type === 'SIGN') {
      width = 22;
      height = 46;
      y = this.groundY - height;
    } else if (type === 'FENCE') {
      width = 48;
      height = 36;
      y = this.groundY - height;
    } else if (type === 'CAR') {
      width = 66;
      height = 34;
      y = this.groundY - height;
    } else if (type === 'POLE') {
      width = 18;
      height = 84;
      y = this.groundY - height;
    } else if (type === 'MACAW') {
      width = 34;
      height = 24;
      y = this.groundY - (74 + Math.random() * 24);
    } else if (type === 'DEER') {
      width = 44;
      height = 36;
      y = this.groundY - height;
    } else if (type === 'GANGSTER') {
      width = 26;
      height = 40;
      y = this.groundY - height;
    } else if (type === 'STRAY_DOG') {
      width = 36;
      height = 24;
      y = this.groundY - height;
    } else if (type === 'LA_SUCIA') {
      width = 28;
      height = 46;
      y = this.groundY - height - 4; // Flota espeluznantemente sobre la carretera
    } else if (type === 'TRAFFIC_JAM') {
      const carCount = 3 + Math.floor(Math.random() * 3); // 3 a 5 carros pegados
      width = carCount * 62 - 6;
      height = 32;
      y = this.groundY - height;

      const palette = ['#ef4444', '#facc15', '#f8fafc', '#38bdf8', '#22c55e', '#94a3b8'];
      const quotes = [
        '¡PIIIP! 📢',
        'Anillo Periférico 🐢',
        'Bulevar Suyapa 2h',
        '¡Llegamos mañana!',
        '¡Mueve pues! 😤',
        'Tráfico TGU 🚗🚗'
      ];
      honkText = quotes[Math.floor(Math.random() * quotes.length)];
      cars = [];
      for (let i = 0; i < carCount; i++) {
        cars.push({
          offsetX: i * 62,
          color: palette[Math.floor(Math.random() * palette.length)],
          isBus: i === 1 && Math.random() < 0.55 // Rapidito / busito ocasional
        });
      }
    }

    const spawnX = this.canvasWidth + 60;
    this.obstacles.push({
      x: spawnX,
      y,
      width,
      height,
      type,
      cars,
      honkText,
      wingPhase: Math.random() * Math.PI * 2,
      passed: false
    });

    // Suministros coleccionables
    if (type === 'TRAFFIC_JAM') {
      // Fila de suministros sobre los techos de la cola de carros
      const itemCount = 2;
      for (let i = 0; i < itemCount; i++) {
        const itemId = HIGHWAY_COLLECTIBLES[Math.floor(Math.random() * HIGHWAY_COLLECTIBLES.length)];
        this.stars.push({
          x: spawnX + 50 + i * 95,
          y: this.groundY - height - 36,
          radius: 13,
          item: ITEMS_CATALOG[itemId],
          collected: false
        });
      }
      // Dar un poco más de respiro antes del siguiente obstáculo
      this.spawnTimer += 0.55;
    } else if (this.isRescueMode || Math.random() < 0.75) {
      const itemId = HIGHWAY_COLLECTIBLES[Math.floor(Math.random() * HIGHWAY_COLLECTIBLES.length)];
      const itemCfg = ITEMS_CATALOG[itemId];
      const itemY =
        type === 'MACAW'
          ? this.groundY - 26
          : this.groundY - height - (type === 'POLE' ? 42 : 48);
      this.stars.push({
        x: spawnX + width / 2,
        y: itemY,
        radius: 13,
        item: itemCfg,
        collected: false
      });
    }
  }

  update(dt, speed, scorer, dropEngine) {
    this.groundY = this.canvasHeight - 64;
    this.poleOffset = (this.poleOffset + speed * dt) % 240;

    // Desplazar paisajes de Tegucigalpa en el horizonte (parallax)
    const tguLandmarks = ['JUANA_LAINEZ', 'CENTRO_CIVICO', 'ESTADIO_TGU', 'CATEDRAL', 'PICACHO'];
    for (let i = this.landmarks.length - 1; i >= 0; i--) {
      this.landmarks[i].x -= speed * 0.45 * dt;
      if (this.landmarks[i].x < -220) {
        this.landmarks.splice(i, 1);
      }
    }
    const lastLm = this.landmarks[this.landmarks.length - 1];
    if (!lastLm || lastLm.x < this.canvasWidth + 240) {
      const nextX = (lastLm ? lastLm.x : 0) + 440;
      const lmType = tguLandmarks[this.landmarkSeq % tguLandmarks.length];
      this.landmarkSeq++;
      this.landmarks.push({ type: lmType, x: nextX });
    }

    // 1. Física del corredor
    this.runner.runPhase += dt * (speed * 0.06);
    if (this.runner.invulnTimer > 0) {
      this.runner.invulnTimer = Math.max(0, this.runner.invulnTimer - dt);
    }

    const prevY = this.runner.y;
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

    // 3. Mover obstáculos y detectar colisiones / plataformas de tráfico
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const obsSpeed = obs.type === 'MACAW' ? speed * 1.18 : speed;
      obs.x -= obsSpeed * dt;
      obs.wingPhase += dt * 14;

      // Puntos al superar obstáculo
      if (!obs.passed && obs.x + obs.width < this.runner.x) {
        obs.passed = true;
        scorer.score += obs.type === 'TRAFFIC_JAM' ? 120 : 50;
        scorer.successfulDrops++;
      }

      const rLeft = this.runner.x - this.runner.width * 0.35;
      const rRight = this.runner.x + this.runner.width * 0.35;
      const rTop = this.runner.y - this.runner.height + 4;
      const rBottom = this.runner.y;

      // En TRAFFIC_JAM el General puede aterrizar y correr sobre los techos de los carros
      if (
        obs.type === 'TRAFFIC_JAM' &&
        rRight > obs.x + 4 &&
        rLeft < obs.x + obs.width - 4 &&
        prevY <= obs.y + 12 &&
        rBottom >= obs.y &&
        this.runner.vy >= 0
      ) {
        this.runner.y = obs.y;
        this.runner.vy = 0;
        this.runner.grounded = true;
        this.runner.jumpsLeft = this.runner.maxJumps;
        continue;
      }

      // Colisión AABB (si choca de frente o con otros obstáculos)
      if (
        this.runner.invulnTimer <= 0 &&
        rLeft < obs.x + obs.width - 4 &&
        rRight > obs.x + 4 &&
        rTop < obs.y + obs.height - 2 &&
        rBottom - 2 > obs.y + 4
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

      if (obs.x + obs.width < -80) {
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
          if (this.isRescueMode) {
            this.rescueCollected++;
          }
          scorer.combo++;
          if (scorer.combo > scorer.maxCombo) scorer.maxCombo = scorer.combo;
          const pts = 100 + Math.min(scorer.combo * 15, 150);
          scorer.score += pts;

          if (this.onStarCollected) this.onStarCollected();

          const colColor = st.item ? st.item.color : '#facc15';
          const colIcon = st.item ? st.item.icon : '⭐';
          dropEngine.spawnImpactParticles(st.x, st.y, { color: colColor }, true, false);
          dropEngine.floatingTexts.push({
            x: st.x,
            y: st.y - 16,
            text: `${colIcon} +${pts}`,
            subtext: scorer.combo > 1 ? `Combo x${scorer.combo}` : (st.item ? st.item.shortName : ''),
            color: colColor,
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

    if (this.isRescueMode && this.rescueCollected >= this.rescueGoal) {
      return 'RESCUED';
    }
    return this.lives <= 0 ? 'DEAD' : 'ALIVE';
  }
}
