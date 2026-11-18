import { BOSS_CONFIGS, BOSS_WEAPONS } from '../domain/types.js';

const BOSS_DIFF_SETTINGS = {
  EASY: { hpMult: 0.65, bossSpeed: 55, minCd: 2.1, cdRange: 0.7, projSpeed: 165, lives: 5 },
  NORMAL: { hpMult: 1.0, bossSpeed: 85, minCd: 1.35, cdRange: 0.6, projSpeed: 215, lives: 4 },
  HARD: { hpMult: 1.3, bossSpeed: 115, minCd: 0.85, cdRange: 0.5, projSpeed: 265, lives: 3 }
};

/**
 * APLICACIÓN: Motor de Batalla contra Jefes (Boss Fight Shooter)
 * Escalado por dificultad y ataques alternados entre gritos y proyectiles animados 16-bit.
 */
export class BossEngine {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = BOSS_CONFIGS.TEGUCIGALPA;
    this.diffSettings = BOSS_DIFF_SETTINGS.EASY;

    this.boss = {
      id: 'TEGUCIGALPA',
      x: canvasWidth - 140,
      y: canvasHeight * 0.5,
      width: 96,
      height: 118,
      hp: 145,
      maxHp: 145,
      vy: 55,
      hitFlash: 0,
      enrageFlash: 0,
      chillTimer: 0,
      attackTimer: 1.8,
      attackSeq: 0
    };

    this.lives = 5;
    this.maxLives = 5;
    this.invulnTimer = 0;
    this.fireCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.selectedWeaponIndex = 0;

    this.playerShots = [];
    this.bossAttacks = [];
    this.heatBeams = [];

    this.onBossHit = null;
    this.onBossEnrage = null;
    this.onPlayerHit = null;
    this.onShoot = null;
  }

  start(bossId, canvasWidth, canvasHeight, difficulty = 'EASY') {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = BOSS_CONFIGS[bossId] || BOSS_CONFIGS.TEGUCIGALPA;
    this.diffSettings = BOSS_DIFF_SETTINGS[difficulty] || BOSS_DIFF_SETTINGS.EASY;

    const scaledHp = Math.round(this.config.maxHp * this.diffSettings.hpMult);

    this.boss = {
      id: this.config.id,
      x: Math.max(260, canvasWidth - 135),
      y: Math.max(120, canvasHeight * 0.45),
      width: Math.min(96, canvasWidth * 0.18),
      height: Math.min(118, canvasHeight * 0.34),
      hp: scaledHp,
      maxHp: scaledHp,
      vy: this.diffSettings.bossSpeed,
      hitFlash: 0,
      enrageFlash: 0,
      chillTimer: 0,
      attackTimer: 1.6,
      attackSeq: 0
    };

    this.lives = this.diffSettings.lives;
    this.maxLives = this.diffSettings.lives;
    this.invulnTimer = 0;
    this.fireCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.selectedWeaponIndex = 0;
    this.playerShots = [];
    this.bossAttacks = [];
    this.heatBeams = [];
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
    this.fireCooldown = 0.23;
    this.muzzleFlashTimer = 0.08;

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

  spawnBossAttack(plane) {
    const seq = this.boss.attackSeq++;
    const spawnY = this.boss.y + this.boss.height * (0.25 + Math.random() * 0.5);
    const aimAngle = Math.atan2(plane.y + 12 - spawnY, plane.x + 30 - this.boss.x);
    const spd = this.diffSettings.projSpeed + Math.random() * 45;

    if (this.boss.id === 'SPS') {
      // SPS alterna entre Bola de Fuego animada, Rayo de Calor horizontal y Grito de furia
      const kindIdx = seq % 3;
      if (kindIdx === 0) {
        this.bossAttacks.push({
          kind: 'FIREBALL',
          x: this.boss.x - 10,
          y: spawnY,
          vx: Math.cos(aimAngle) * spd,
          vy: Math.sin(aimAngle) * spd,
          rotation: 0,
          radius: 13
        });
      } else if (kindIdx === 1) {
        // Rayo horizontal con telegrafiado previo de 0.65s
        this.heatBeams.push({
          y: this.boss.y + this.boss.height * 0.48,
          warnTimer: 0.65,
          activeTimer: 0.42,
          hitDone: false
        });
      } else {
        const quote = this.config.attacks[Math.floor(Math.random() * this.config.attacks.length)];
        this.bossAttacks.push({
          kind: 'TEXT',
          x: this.boss.x - 10,
          y: spawnY,
          vx: Math.cos(aimAngle) * spd,
          vy: Math.sin(aimAngle) * spd,
          text: quote,
          isHeat: true
        });
      }
    } else {
      // Tegucigalpa alterna entre Grito/Bocinazo, Llanta giratoria y Nube de humo tóxico
      const kindIdx = seq % 3;
      if (kindIdx === 0) {
        const quote = this.config.attacks[Math.floor(Math.random() * this.config.attacks.length)];
        this.bossAttacks.push({
          kind: 'TEXT',
          x: this.boss.x - 10,
          y: spawnY,
          vx: Math.cos(aimAngle) * spd,
          vy: Math.sin(aimAngle) * spd,
          text: quote,
          isHeat: false
        });
      } else if (kindIdx === 1) {
        this.bossAttacks.push({
          kind: 'TIRE',
          x: this.boss.x - 10,
          y: spawnY,
          vx: Math.cos(aimAngle) * (spd * 1.05),
          vy: Math.sin(aimAngle) * (spd * 1.05),
          rotation: 0,
          radius: 13
        });
      } else {
        this.bossAttacks.push({
          kind: 'SMOKE',
          x: this.boss.x - 10,
          y: spawnY,
          vx: Math.cos(aimAngle) * (spd * 0.9),
          vy: Math.sin(aimAngle) * (spd * 0.9),
          rotation: 0,
          radius: 14
        });
      }
    }
  }

  update(dt, plane, inputState, dropEngine, scorer) {
    if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.boss.hitFlash > 0) this.boss.hitFlash = Math.max(0, this.boss.hitFlash - dt);
    if (this.boss.enrageFlash > 0) this.boss.enrageFlash = Math.max(0, this.boss.enrageFlash - dt);
    if (this.boss.chillTimer > 0) this.boss.chillTimer = Math.max(0, this.boss.chillTimer - dt);

    // 1. Movimiento vertical del avión
    const hudTop = this.canvasWidth < 620 ? 78 : 68;
    const maxY = this.canvasHeight - plane.height - 20;
    const moveSpeed = 245;

    if (inputState.moveUp || inputState.speedUp) {
      plane.y = Math.max(hudTop, plane.y - moveSpeed * dt);
      plane.tilt = -0.12;
    } else if (inputState.moveDown || inputState.slowDown) {
      plane.y = Math.min(maxY, plane.y + moveSpeed * dt);
      plane.tilt = 0.12;
    } else {
      plane.tilt *= 0.85;
    }

    // 2. Movimiento vertical del Boss (se ralentiza si fue golpeado con Hielo)
    const chillFactor = this.boss.chillTimer > 0 ? 0.45 : 1.0;
    this.boss.y += this.boss.vy * chillFactor * dt;
    const bossMinY = hudTop + 6;
    const bossMaxY = this.canvasHeight - this.boss.height - 22;
    if (this.boss.y <= bossMinY) {
      this.boss.y = bossMinY;
      this.boss.vy = Math.abs(this.boss.vy);
    } else if (this.boss.y >= bossMaxY) {
      this.boss.y = bossMaxY;
      this.boss.vy = -Math.abs(this.boss.vy);
    }

    // 3. Ataques del Boss
    this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      const isFuryHard = this.diffSettings.lives === 3 && this.boss.hp < this.boss.maxHp * 0.4;
      this.boss.attackTimer =
        (this.diffSettings.minCd + Math.random() * this.diffSettings.cdRange) *
        (isFuryHard ? 0.78 : 1.0);
      this.spawnBossAttack(plane);
    }

    // 4. Disparos del jugador contra el Boss
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
          if (s.weaponId === 'ICE') {
            this.boss.chillTimer = 1.6;
          }
          if (s.weaponId === 'WATER' && this.boss.id === 'SPS') {
            dropEngine.spawnSteamParticles(s.x, s.y);
          }
          scorer.score += isEffective ? 60 : 25;
          if (this.onBossHit) this.onBossHit();
          dropEngine.spawnImpactParticles(s.x, s.y, { color: s.color }, true, isEffective);
          dropEngine.floatingTexts.push({
            x: s.x,
            y: s.y - 12,
            text: s.weaponId === 'ICE' ? `❄️ -${dmg}` : `-${dmg}`,
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

    // 5. Ataques de proyectiles/gritos del Boss
    for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
      const atk = this.bossAttacks[i];
      atk.x += atk.vx * dt;
      atk.y += atk.vy * dt;
      if (atk.rotation !== undefined) atk.rotation += dt * 10;

      if (
        this.invulnTimer <= 0 &&
        atk.x >= plane.x + 6 &&
        atk.x <= plane.x + plane.width - 4 &&
        atk.y >= plane.y - 6 &&
        atk.y <= plane.y + plane.height + 4
      ) {
        this.applyPlayerHit(plane, dropEngine);
        this.bossAttacks.splice(i, 1);
        continue;
      }

      if (atk.x < -160 || atk.y < -40 || atk.y > this.canvasHeight + 40) {
        this.bossAttacks.splice(i, 1);
      }
    }

    // 6. Rayos horizontales de calor (Boss SPS)
    for (let i = this.heatBeams.length - 1; i >= 0; i--) {
      const bm = this.heatBeams[i];
      if (bm.warnTimer > 0) {
        bm.warnTimer -= dt;
      } else {
        bm.activeTimer -= dt;
        if (
          !bm.hitDone &&
          this.invulnTimer <= 0 &&
          bm.y >= plane.y - 6 &&
          bm.y <= plane.y + plane.height + 6
        ) {
          bm.hitDone = true;
          this.applyPlayerHit(plane, dropEngine);
        }
        if (bm.activeTimer <= 0) {
          this.heatBeams.splice(i, 1);
        }
      }
    }

    if (this.boss.hp <= 0) return 'VICTORY';
    if (this.lives <= 0) return 'DEAD';
    return 'ALIVE';
  }

  applyPlayerHit(plane, dropEngine) {
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
  }
}
