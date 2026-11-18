import { BOSS_CONFIGS, BOSS_WEAPONS } from '../domain/types.js';

/**
 * APLICACIÓN: Motor de Batalla contra Jefes (Boss Fight Shooter)
 * El avión se mueve verticalmente a la izquierda y dispara de frente.
 */
export class BossEngine {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = BOSS_CONFIGS.TEGUCIGALPA;

    this.boss = {
      id: 'TEGUCIGALPA',
      x: canvasWidth - 140,
      y: canvasHeight * 0.5,
      width: 96,
      height: 118,
      hp: 220,
      maxHp: 220,
      vy: 85,
      hitFlash: 0,
      enrageFlash: 0,
      attackTimer: 1.5
    };

    this.lives = 4;
    this.maxLives = 4;
    this.invulnTimer = 0;
    this.fireCooldown = 0;
    this.selectedWeaponIndex = 0;

    this.playerShots = [];
    this.bossAttacks = [];

    this.onBossHit = null;
    this.onBossEnrage = null;
    this.onPlayerHit = null;
    this.onShoot = null;
  }

  start(bossId, canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = BOSS_CONFIGS[bossId] || BOSS_CONFIGS.TEGUCIGALPA;

    this.boss = {
      id: this.config.id,
      x: Math.max(260, canvasWidth - 135),
      y: Math.max(120, canvasHeight * 0.45),
      width: Math.min(96, canvasWidth * 0.18),
      height: Math.min(118, canvasHeight * 0.34),
      hp: this.config.maxHp,
      maxHp: this.config.maxHp,
      vy: 85,
      hitFlash: 0,
      enrageFlash: 0,
      attackTimer: 1.4
    };

    this.lives = 4;
    this.invulnTimer = 0;
    this.fireCooldown = 0;
    this.selectedWeaponIndex = 0;
    this.playerShots = [];
    this.bossAttacks = [];
  }

  onResize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    if (this.boss) {
      this.boss.x = Math.max(240, canvasWidth - 135);
      this.boss.y = Math.min(this.boss.y, canvasHeight - this.boss.height - 30);
    }
  }

  fireWeapon(plane, weaponIdx = null) {
    if (this.fireCooldown > 0) return false;
    if (weaponIdx !== null && weaponIdx >= 0 && weaponIdx < BOSS_WEAPONS.length) {
      this.selectedWeaponIndex = weaponIdx;
    }
    const weapon = BOSS_WEAPONS[this.selectedWeaponIndex];
    this.fireCooldown = 0.24;

    this.playerShots.push({
      x: plane.x + plane.width + 6,
      y: plane.y + plane.height * 0.5,
      vx: weapon.speed,
      vy: 0,
      weaponId: weapon.id,
      icon: weapon.icon,
      color: weapon.color,
      radius: 10
    });

    if (this.onShoot) this.onShoot();
    return true;
  }

  update(dt, plane, inputState, dropEngine, scorer) {
    if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.boss.hitFlash > 0) this.boss.hitFlash = Math.max(0, this.boss.hitFlash - dt);
    if (this.boss.enrageFlash > 0) this.boss.enrageFlash = Math.max(0, this.boss.enrageFlash - dt);

    // 1. Movimiento vertical del avión (arriba / abajo)
    const hudTop = this.canvasWidth < 620 ? 78 : 68;
    const maxY = this.canvasHeight - plane.height - 20;
    const moveSpeed = 240;

    if (inputState.moveUp || inputState.speedUp) {
      plane.y = Math.max(hudTop, plane.y - moveSpeed * dt);
      plane.tilt = -0.12;
    } else if (inputState.moveDown || inputState.slowDown) {
      plane.y = Math.min(maxY, plane.y + moveSpeed * dt);
      plane.tilt = 0.12;
    } else {
      plane.tilt *= 0.85;
    }

    // 2. Movimiento vertical oscilante del Boss
    this.boss.y += this.boss.vy * dt;
    const bossMinY = hudTop + 6;
    const bossMaxY = this.canvasHeight - this.boss.height - 22;
    if (this.boss.y <= bossMinY) {
      this.boss.y = bossMinY;
      this.boss.vy = Math.abs(this.boss.vy);
    } else if (this.boss.y >= bossMaxY) {
      this.boss.y = bossMaxY;
      this.boss.vy = -Math.abs(this.boss.vy);
    }

    // 3. Ataques del Boss hacia el avión
    this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      this.boss.attackTimer = 1.05 + Math.random() * 0.75;
      const quote =
        this.config.attacks[Math.floor(Math.random() * this.config.attacks.length)];
      const spawnY = this.boss.y + this.boss.height * (0.2 + Math.random() * 0.6);
      const aimAngle = Math.atan2(plane.y + 12 - spawnY, plane.x + 30 - this.boss.x);
      const projSpeed = 230 + Math.random() * 65;

      this.bossAttacks.push({
        x: this.boss.x - 10,
        y: spawnY,
        vx: Math.cos(aimAngle) * projSpeed,
        vy: Math.sin(aimAngle) * projSpeed,
        text: quote,
        isHeat: this.boss.id === 'SPS',
        color: this.boss.id === 'SPS' ? '#f97316' : '#facc15'
      });
    }

    // 4. Actualizar disparos del jugador contra el Boss
    for (let i = this.playerShots.length - 1; i >= 0; i--) {
      const s = this.playerShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (
        s.x >= this.boss.x &&
        s.x <= this.boss.x + this.boss.width &&
        s.y >= this.boss.y &&
        s.y <= this.boss.y + this.boss.height
      ) {
        const isEnrage = this.config.enrageWeapons.includes(s.weaponId);
        const isEffective = this.config.effectiveWeapons.includes(s.weaponId);

        if (isEnrage) {
          this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + 12);
          this.boss.enrageFlash = 0.25;
          if (this.onBossEnrage) this.onBossEnrage();
          dropEngine.floatingTexts.push({
            x: this.boss.x + this.boss.width / 2,
            y: this.boss.y - 10,
            text: '🔥 ¡SE ENCIENDE MÁS! +HP',
            subtext: '¡Usa Agua o Hielo!',
            color: '#f97316',
            life: 1.3,
            maxLife: 1.3,
            vy: -30
          });
        } else {
          const dmg = isEffective ? 22 : 12;
          this.boss.hp = Math.max(0, this.boss.hp - dmg);
          this.boss.hitFlash = 0.16;
          scorer.score += isEffective ? 60 : 25;
          if (this.onBossHit) this.onBossHit();
          dropEngine.spawnImpactParticles(s.x, s.y, { color: s.color }, true, isEffective);
          dropEngine.floatingTexts.push({
            x: s.x,
            y: s.y - 12,
            text: `-${dmg}`,
            subtext: '',
            color: isEffective ? '#4ade80' : '#f8fafc',
            life: 0.7,
            maxLife: 0.7,
            vy: -35
          });
        }

        this.playerShots.splice(i, 1);
        continue;
      }

      if (s.x > this.canvasWidth + 50) {
        this.playerShots.splice(i, 1);
      }
    }

    // 5. Actualizar ataques del Boss contra el avión
    for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
      const atk = this.bossAttacks[i];
      atk.x += atk.vx * dt;
      atk.y += atk.vy * dt;

      if (
        this.invulnTimer <= 0 &&
        atk.x >= plane.x &&
        atk.x <= plane.x + plane.width &&
        atk.y >= plane.y - 10 &&
        atk.y <= plane.y + plane.height + 6
      ) {
        this.lives--;
        this.invulnTimer = 1.3;
        dropEngine.screenShake = 8;
        if (this.onPlayerHit) this.onPlayerHit();
        dropEngine.floatingTexts.push({
          x: plane.x + 30,
          y: plane.y - 20,
          text: '💥 ¡IMPACTO!',
          subtext: '',
          color: '#ef4444',
          life: 1.0,
          maxLife: 1.0,
          vy: -30
        });
        this.bossAttacks.splice(i, 1);
        continue;
      }

      if (atk.x < -160 || atk.y < -40 || atk.y > this.canvasHeight + 40) {
        this.bossAttacks.splice(i, 1);
      }
    }

    if (this.boss.hp <= 0) {
      return 'VICTORY';
    }
    if (this.lives <= 0) {
      return 'DEAD';
    }
    return 'ALIVE';
  }
}
