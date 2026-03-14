import { dist, normSeg, segsCross, pointInPoly } from '../geometry.js';
import { Projectile } from './Projectile.js';

/**
 * Base Boss class. Each level has a unique boss subclass.
 * Bosses have:
 * - Unique movement patterns
 * - Timed attack patterns with telegraph
 * - HP (only damaged by boss weapon)
 * - Large hitbox
 */
export class Boss {
  constructor(config) {
    this.x = config.x || 380;
    this.y = config.y || 200;
    this.radius = config.radius || 25;
    this.hp = config.hp || 3;
    this.maxHp = this.hp;
    this.speed = config.speed || 1.5;
    this.name = config.name || 'Boss';
    this.color = config.color || '#ff2266';
    this.alive = true;

    // Attack system
    this.attackTimer = config.attackInterval || 3.0;
    this.attackInterval = config.attackInterval || 3.0;
    this.telegraphTime = 0.7; // seconds of telegraph before attack
    this.telegraphing = false;
    this.telegraphTimer = 0;

    // Movement
    this.vx = 0;
    this.vy = 0;
    this.moveTimer = 0;
    this.phase = 0; // for complex movement patterns

    // Visual
    this.hitFlash = 0;
    this.deathTimer = 0;

    // Projectile config
    this.projectileSpeed = config.projectileSpeed || 3.5;
    this.projectileCount = config.projectileCount || 2;
  }

  update(dt, contour, playerX, playerY, frozen) {
    if (!this.alive) return [];
    if (frozen) return [];

    this.hitFlash = Math.max(0, this.hitFlash - dt);

    // Movement
    this.movePattern(dt, contour, playerX, playerY);

    // Attack timing
    this.attackTimer -= dt;
    if (this.attackTimer <= this.telegraphTime && !this.telegraphing) {
      this.telegraphing = true;
      this.telegraphTimer = this.telegraphTime;
    }
    if (this.telegraphing) {
      this.telegraphTimer -= dt;
    }
    if (this.attackTimer <= 0) {
      this.telegraphing = false;
      this.attackTimer = this.attackInterval;
      return this.attack(playerX, playerY);
    }

    return [];
  }

  // Override in subclasses
  movePattern(dt, contour, playerX, playerY) {
    // Default: drift randomly, bounce off contour
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.moveTimer = 1.5 + Math.random() * 2;
    }

    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) {
      this.x = nx;
      this.y = ny;
    } else {
      this.vx = -this.vx;
      this.vy = -this.vy;
      this.moveTimer = 0.1;
    }
  }

  // Override in subclasses for unique attack patterns
  attack(playerX, playerY) {
    const projectiles = [];
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    projectiles.push(new Projectile(this.x, this.y, dx / d, dy / d, this.projectileSpeed, true));
    return projectiles;
  }

  takeDamage() {
    this.hp--;
    this.hitFlash = 0.3;
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 1.0;
    }
  }

  hitsPoint(px, py) {
    return dist([this.x, this.y], [px, py]) <= this.radius + 4;
  }

  isInsideContour(contour) {
    return pointInPoly([this.x, this.y], contour);
  }
}

// ═══════════════════════════════════════════════════
//  BOSS IMPLEMENTATIONS FOR ALL 16 LEVELS
// ═══════════════════════════════════════════════════

export class CrabBoss extends Boss {
  constructor() {
    super({ name: 'Giant Crab', color: '#ff4422', radius: 28, hp: 3, speed: 1.0, attackInterval: 3.0, projectileSpeed: 3.0, projectileCount: 2 });
    this.swingAngle = 0;
  }

  movePattern(dt, contour, px, py) {
    // Slow arcing movement
    this.swingAngle += dt * 0.8;
    this.vx = Math.cos(this.swingAngle) * this.speed;
    this.vy = Math.sin(this.swingAngle * 0.6) * this.speed * 0.7;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.swingAngle += Math.PI * 0.5; }
  }

  attack(px, py) {
    // V-pattern: 2 projectiles spread
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const spread = 0.3;
    return [
      new Projectile(this.x, this.y, Math.cos(baseAngle - spread), Math.sin(baseAngle - spread), 3.0, true),
      new Projectile(this.x, this.y, Math.cos(baseAngle + spread), Math.sin(baseAngle + spread), 3.0, true),
    ];
  }
}

export class FlyBoss extends Boss {
  constructor() {
    super({ name: 'Giant Fly', color: '#44bb44', radius: 22, hp: 3, speed: 2.5, attackInterval: 2.5, projectileSpeed: 3.5 });
    this.dartTimer = 0;
    this.dartDir = [0, 0];
  }

  movePattern(dt, contour, px, py) {
    // Erratic darting
    this.dartTimer -= dt;
    if (this.dartTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      this.dartDir = [Math.cos(angle) * this.speed * 1.5, Math.sin(angle) * this.speed * 1.5];
      this.dartTimer = 0.3 + Math.random() * 0.5;
    }
    const nx = this.x + this.dartDir[0];
    const ny = this.y + this.dartDir[1];
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.dartDir = [-this.dartDir[0], -this.dartDir[1]]; this.dartTimer = 0.1; }
  }

  attack(px, py) {
    // Drop projectile downward toward player X
    return [new Projectile(this.x, this.y, 0, 1, 3.5, true)];
  }
}

export class SpiderBoss extends Boss {
  constructor() {
    super({ name: 'Spider', color: '#885522', radius: 24, hp: 3, speed: 1.2, attackInterval: 4.0, projectileSpeed: 2.5 });
  }

  movePattern(dt, contour, px, py) {
    // Attracted to player when they are cutting (move toward player's position)
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / d) * this.speed * 0.6;
    this.vy = (dy / d) * this.speed * 0.6;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
  }

  attack(px, py) {
    // Web projectile: slower but wider
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const p = new Projectile(this.x, this.y, dx / d, dy / d, 2.5, true);
    p.radius = 10; // wider hitbox
    return [p];
  }
}

export class CentipedeBoss extends Boss {
  constructor() {
    super({ name: 'Centipede', color: '#66aa33', radius: 18, hp: 4, speed: 1.8, attackInterval: 2.5, projectileSpeed: 3.5 });
    this.segments = [];
    this.wavePhase = 0;
    // Initialize segments behind the head
    for (let i = 0; i < 8; i++) {
      this.segments.push({ x: this.x - i * 14, y: this.y });
    }
  }

  movePattern(dt, contour, px, py) {
    this.wavePhase += dt * 2.5;
    // Sine-wave movement
    const baseAngle = Math.atan2(py - this.y, px - this.x);
    this.vx = Math.cos(baseAngle) * this.speed;
    this.vy = Math.sin(baseAngle + Math.sin(this.wavePhase) * 0.8) * this.speed;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) {
      // Update segments to follow head
      for (let i = this.segments.length - 1; i > 0; i--) {
        this.segments[i].x = this.segments[i - 1].x;
        this.segments[i].y = this.segments[i - 1].y;
      }
      if (this.segments.length > 0) {
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
      }
      this.x = nx;
      this.y = ny;
    } else {
      this.wavePhase += Math.PI;
    }
  }

  attack(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [new Projectile(this.x, this.y, dx / d, dy / d, 3.5, true)];
  }

  hitsPoint(px, py) {
    if (super.hitsPoint(px, py)) return true;
    // Check segments too
    for (const seg of this.segments) {
      if (dist([seg.x, seg.y], [px, py]) <= 12) return true;
    }
    return false;
  }
}

export class NautilusBoss extends Boss {
  constructor() {
    super({ name: 'Nautilus', color: '#4488cc', radius: 26, hp: 4, speed: 1.3, attackInterval: 3.0, projectileSpeed: 3.0 });
    this.spiralAngle = 0;
    this.spiralRadius = 50;
    this.centerX = 380;
    this.centerY = 200;
    this.expanding = true;
  }

  movePattern(dt, contour, px, py) {
    this.spiralAngle += dt * 1.5;
    if (this.expanding) {
      this.spiralRadius += dt * 20;
      if (this.spiralRadius > 150) this.expanding = false;
    } else {
      this.spiralRadius -= dt * 20;
      if (this.spiralRadius < 30) this.expanding = true;
    }
    const nx = this.centerX + Math.cos(this.spiralAngle) * this.spiralRadius;
    const ny = this.centerY + Math.sin(this.spiralAngle) * this.spiralRadius;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.centerX = this.x; this.centerY = this.y; this.spiralRadius = 30; }
  }

  attack(px, py) {
    // 4-directional
    return [
      new Projectile(this.x, this.y, 1, 0, 3.0, true),
      new Projectile(this.x, this.y, -1, 0, 3.0, true),
      new Projectile(this.x, this.y, 0, 1, 3.0, true),
      new Projectile(this.x, this.y, 0, -1, 3.0, true),
    ];
  }
}

export class TwinFacesBoss extends Boss {
  constructor() {
    super({ name: 'Twin Faces', color: '#cc44cc', radius: 20, hp: 4, speed: 1.5, attackInterval: 3.0 });
    // Second face
    this.x2 = 500;
    this.y2 = 280;
    this.vx2 = 0;
    this.vy2 = 0;
    this.moveTimer2 = 0;
    this.separated = false;
  }

  movePattern(dt, contour, px, py) {
    // First face
    super.movePattern(dt, contour, px, py);

    // Second face - tries to stay near first face
    this.moveTimer2 -= dt;
    if (this.moveTimer2 <= 0) {
      const dx = this.x - this.x2, dy = this.y - this.y2;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx2 = (dx / d) * this.speed + (Math.random() - 0.5) * this.speed;
      this.vy2 = (dy / d) * this.speed + (Math.random() - 0.5) * this.speed;
      this.moveTimer2 = 1 + Math.random() * 1.5;
    }
    const nx = this.x2 + this.vx2;
    const ny = this.y2 + this.vy2;
    if (pointInPoly([nx, ny], contour)) { this.x2 = nx; this.y2 = ny; }
    else { this.vx2 = -this.vx2; this.vy2 = -this.vy2; this.moveTimer2 = 0.1; }
  }

  attack(px, py) {
    const projs = [];
    // Both faces shoot
    for (const [fx, fy] of [[this.x, this.y], [this.x2, this.y2]]) {
      const dx = px - fx, dy = py - fy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      projs.push(new Projectile(fx, fy, dx / d, dy / d, 3.0, true));
    }
    return projs;
  }

  hitsPoint(px, py) {
    return dist([this.x, this.y], [px, py]) <= this.radius + 4 ||
           dist([this.x2, this.y2], [px, py]) <= this.radius + 4;
  }

  // Special: check if the two faces are in different regions after a territory claim
  checkSeparation(contour) {
    const face1In = pointInPoly([this.x, this.y], contour);
    const face2In = pointInPoly([this.x2, this.y2], contour);
    if (face1In !== face2In) {
      this.separated = true;
      this.alive = false;
      return true;
    }
    return false;
  }

  isInsideContour(contour) {
    return pointInPoly([this.x, this.y], contour) || pointInPoly([this.x2, this.y2], contour);
  }
}

export class HandBoss extends Boss {
  constructor() {
    super({ name: 'Giant Hand', color: '#ddaa77', radius: 30, hp: 4, speed: 0.8, attackInterval: 2.0, projectileSpeed: 5.0 });
    this.fingerExtend = 0;
    this.extending = false;
  }

  movePattern(dt, contour, px, py) {
    // Slow movement, fingers extend toward player
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = this.x + (dx / d) * this.speed * 0.3;
    const ny = this.y + (dy / d) * this.speed * 0.3;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }

    // Finger extension animation
    if (this.extending) { this.fingerExtend += dt * 40; if (this.fingerExtend > 30) this.extending = false; }
    else { this.fingerExtend -= dt * 20; if (this.fingerExtend < 0) { this.fingerExtend = 0; this.extending = true; } }
  }

  attack(px, py) {
    // Fast narrow projectile
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [new Projectile(this.x, this.y, dx / d, dy / d, 5.0, true)];
  }
}

export class LadybugBoss extends Boss {
  constructor() {
    super({ name: 'Killer Ladybug', color: '#ff2222', radius: 22, hp: 5, speed: 2.8, attackInterval: 2.5, projectileSpeed: 3.5 });
  }

  movePattern(dt, contour, px, py) {
    // Actively chases player
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / d) * this.speed;
    this.vy = (dy / d) * this.speed;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
  }

  attack(px, py) {
    // 5-spread projectiles
    const baseAngle = Math.atan2(py - this.y, px - this.x);
    const projs = [];
    for (let i = -2; i <= 2; i++) {
      const angle = baseAngle + i * 0.25;
      projs.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 3.5, true));
    }
    return projs;
  }
}

export class JellyfishBoss extends Boss {
  constructor() {
    super({ name: 'Jellyfish', color: '#88aaff', radius: 28, hp: 4, speed: 0.7, attackInterval: 3.0, projectileSpeed: 3.0 });
    this.driftAngle = 0;
  }

  movePattern(dt, contour) {
    this.driftAngle += dt * 0.4;
    this.vx = Math.cos(this.driftAngle) * this.speed;
    this.vy = Math.sin(this.driftAngle * 0.7) * this.speed * 0.5;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.driftAngle += Math.PI; }
  }

  attack(px, py) {
    // 3 downward projectiles
    return [
      new Projectile(this.x - 15, this.y, 0, 1, 3.0, true),
      new Projectile(this.x, this.y, 0, 1, 3.0, true),
      new Projectile(this.x + 15, this.y, 0, 1, 3.0, true),
    ];
  }
}

export class ScorpionBoss extends Boss {
  constructor() {
    super({ name: 'Scorpion', color: '#cc8833', radius: 26, hp: 4, speed: 1.5, attackInterval: 2.0, projectileSpeed: 4.5 });
    this.striking = false;
    this.strikeTimer = 0;
  }

  movePattern(dt, contour, px, py) {
    if (this.striking) {
      this.strikeTimer -= dt;
      if (this.strikeTimer <= 0) this.striking = false;
      return;
    }
    // Move in straight lines, pause, then strike
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.moveTimer = 1 + Math.random() * 2;
    }
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.vx = -this.vx; this.vy = -this.vy; this.moveTimer = 0.1; }
  }

  attack(px, py) {
    this.striking = true;
    this.strikeTimer = 0.5;
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [
      new Projectile(this.x, this.y, dx / d, dy / d, 4.5, true),
      new Projectile(this.x, this.y, dx / d + 0.1, dy / d - 0.1, 4.5, true),
    ];
  }
}

export class WaspBoss extends Boss {
  constructor() {
    super({ name: 'Wasp', color: '#dddd22', radius: 20, hp: 4, speed: 3.0, attackInterval: 2.0, projectileSpeed: 4.0 });
    this.circleAngle = 0;
    this.diving = false;
    this.diveTimer = 0;
  }

  movePattern(dt, contour, px, py) {
    if (this.diving) {
      this.diveTimer -= dt;
      const dx = px - this.x, dy = py - this.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = this.x + (dx / d) * this.speed * 2;
      const ny = this.y + (dy / d) * this.speed * 2;
      if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
      if (this.diveTimer <= 0) this.diving = false;
      return;
    }

    this.circleAngle += dt * 2;
    this.vx = Math.cos(this.circleAngle) * this.speed;
    this.vy = Math.sin(this.circleAngle) * this.speed;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.circleAngle += Math.PI; }

    // Occasionally dive toward player
    if (Math.random() < 0.005) { this.diving = true; this.diveTimer = 0.5; }
  }

  attack(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [new Projectile(this.x, this.y, dx / d, dy / d, 4.0, true)];
  }
}

export class SnakeBoss extends Boss {
  constructor() {
    super({ name: 'Snake', color: '#33aa55', radius: 16, hp: 5, speed: 2.0, attackInterval: 2.5, projectileSpeed: 3.5 });
    this.segments = [];
    this.coilAngle = 0;
    this.lunging = false;
    this.lungeTimer = 0;
    for (let i = 0; i < 12; i++) {
      this.segments.push({ x: this.x - i * 12, y: this.y });
    }
  }

  movePattern(dt, contour, px, py) {
    this.coilAngle += dt * 2;

    if (this.lunging) {
      this.lungeTimer -= dt;
      const dx = px - this.x, dy = py - this.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = this.x + (dx / d) * this.speed * 2;
      const ny = this.y + (dy / d) * this.speed * 2;
      if (pointInPoly([nx, ny], contour)) {
        this._updateSegments();
        this.x = nx; this.y = ny;
      }
      if (this.lungeTimer <= 0) this.lunging = false;
      return;
    }

    // Coiling
    this.vx = Math.cos(this.coilAngle) * this.speed;
    this.vy = Math.sin(this.coilAngle) * this.speed * 0.6;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) {
      this._updateSegments();
      this.x = nx; this.y = ny;
    }

    if (Math.random() < 0.008) { this.lunging = true; this.lungeTimer = 0.6; }
  }

  _updateSegments() {
    for (let i = this.segments.length - 1; i > 0; i--) {
      this.segments[i].x = this.segments[i - 1].x;
      this.segments[i].y = this.segments[i - 1].y;
    }
    if (this.segments.length > 0) {
      this.segments[0].x = this.x;
      this.segments[0].y = this.y;
    }
  }

  attack(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [
      new Projectile(this.x, this.y, dx / d, dy / d, 3.5, true),
      new Projectile(this.x, this.y, dx / d + 0.15, dy / d + 0.15, 3.5, true),
    ];
  }

  hitsPoint(px, py) {
    if (super.hitsPoint(px, py)) return true;
    for (const seg of this.segments) {
      if (dist([seg.x, seg.y], [px, py]) <= 10) return true;
    }
    return false;
  }
}

export class BatBoss extends Boss {
  constructor() {
    super({ name: 'Giant Bat', color: '#6644aa', radius: 24, hp: 5, speed: 2.5, attackInterval: 2.0, projectileSpeed: 3.5 });
    this.swoopPhase = 0;
  }

  movePattern(dt, contour) {
    this.swoopPhase += dt * 3;
    this.vx = Math.cos(this.swoopPhase) * this.speed * 1.5;
    this.vy = Math.sin(this.swoopPhase * 0.5) * this.speed;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.swoopPhase += Math.PI * 0.7; }
  }

  attack(px, py) {
    const baseAngle = Math.atan2(py - this.y, px - this.x);
    return [
      new Projectile(this.x, this.y, Math.cos(baseAngle - 0.3), Math.sin(baseAngle - 0.3), 3.5, true),
      new Projectile(this.x, this.y, Math.cos(baseAngle), Math.sin(baseAngle), 3.5, true),
      new Projectile(this.x, this.y, Math.cos(baseAngle + 0.3), Math.sin(baseAngle + 0.3), 3.5, true),
    ];
  }
}

export class AlienBoss extends Boss {
  constructor() {
    super({ name: 'Alien', color: '#22ddaa', radius: 22, hp: 5, speed: 1.0, attackInterval: 3.0, projectileSpeed: 3.0 });
    this.teleportTimer = 4;
  }

  movePattern(dt, contour) {
    this.teleportTimer -= dt;
    if (this.teleportTimer <= 0) {
      // Teleport to random position inside contour
      for (let attempt = 0; attempt < 30; attempt++) {
        const nx = 50 + Math.random() * 660;
        const ny = 50 + Math.random() * 380;
        if (pointInPoly([nx, ny], contour)) {
          this.x = nx;
          this.y = ny;
          break;
        }
      }
      this.teleportTimer = 3 + Math.random() * 2;
    }
    // Slow drift between teleports
    this.vx = Math.sin(performance.now() / 500) * this.speed * 0.5;
    this.vy = Math.cos(performance.now() / 700) * this.speed * 0.5;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
  }

  attack() {
    // 8-directional radial
    const projs = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      projs.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 3.0, true));
    }
    return projs;
  }
}

export class DragonBoss extends Boss {
  constructor() {
    super({ name: 'Dragon', color: '#ff6622', radius: 28, hp: 5, speed: 2.0, attackInterval: 3.0, projectileSpeed: 4.0 });
    this.fig8Phase = 0;
    this.charging = false;
    this.chargeTimer = 0;
  }

  movePattern(dt, contour, px, py) {
    if (this.charging) {
      this.chargeTimer -= dt;
      const dx = px - this.x, dy = py - this.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = this.x + (dx / d) * this.speed * 2;
      const ny = this.y + (dy / d) * this.speed * 2;
      if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
      if (this.chargeTimer <= 0) this.charging = false;
      return;
    }

    // Figure-8 pattern
    this.fig8Phase += dt * 1.5;
    this.vx = Math.cos(this.fig8Phase) * this.speed * 1.5;
    this.vy = Math.sin(this.fig8Phase * 2) * this.speed;
    const nx = this.x + this.vx;
    const ny = this.y + this.vy;
    if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
    else { this.fig8Phase += Math.PI; }

    if (Math.random() < 0.005) { this.charging = true; this.chargeTimer = 0.8; }
  }

  attack(px, py) {
    // Fire breath: 4 rapid projectiles
    const dx = px - this.x, dy = py - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const projs = [];
    for (let i = 0; i < 4; i++) {
      const angle = baseAngle + (i - 1.5) * 0.12;
      projs.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 4.0 + i * 0.3, true));
    }
    return projs;
  }
}

export class FinalBoss extends Boss {
  constructor() {
    super({ name: 'The Overlord', color: '#ff00ff', radius: 30, hp: 6, speed: 1.5, attackInterval: 2.5, projectileSpeed: 4.0 });
    this.phaseIdx = 0; // 0=patrol, 1=chase, 2=teleport
    this.phaseTimer = 5;
    this.teleportFlash = 0;
  }

  movePattern(dt, contour, px, py) {
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.phaseIdx = (this.phaseIdx + 1) % 3;
      this.phaseTimer = this.phaseIdx === 2 ? 2 : 4;
    }

    switch (this.phaseIdx) {
      case 0: // Patrol
        super.movePattern(dt, contour, px, py);
        break;
      case 1: { // Chase
        const dx = px - this.x, dy = py - this.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = this.x + (dx / d) * this.speed * 1.8;
        const ny = this.y + (dy / d) * this.speed * 1.8;
        if (pointInPoly([nx, ny], contour)) { this.x = nx; this.y = ny; }
        break;
      }
      case 2: { // Teleport
        this.teleportFlash = 0.3;
        for (let attempt = 0; attempt < 30; attempt++) {
          const nx = 50 + Math.random() * 660;
          const ny = 50 + Math.random() * 380;
          if (pointInPoly([nx, ny], contour)) {
            this.x = nx; this.y = ny; break;
          }
        }
        this.phaseTimer = 0.5; // Short teleport phase
        this.phaseIdx = 0;
        break;
      }
    }
    this.teleportFlash = Math.max(0, this.teleportFlash - dt);
  }

  attack(px, py) {
    switch (this.phaseIdx) {
      case 0: { // 2 projectiles
        const dx = px - this.x, dy = py - this.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const baseAngle = Math.atan2(dy, dx);
        return [
          new Projectile(this.x, this.y, Math.cos(baseAngle - 0.2), Math.sin(baseAngle - 0.2), 4.0, true),
          new Projectile(this.x, this.y, Math.cos(baseAngle + 0.2), Math.sin(baseAngle + 0.2), 4.0, true),
        ];
      }
      case 1: { // 4 spread
        const baseAngle = Math.atan2(py - this.y, px - this.x);
        const projs = [];
        for (let i = -2; i <= 1; i++) {
          const angle = baseAngle + i * 0.3;
          projs.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 4.0, true));
        }
        return projs;
      }
      default: { // 8 radial after teleport
        const projs = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          projs.push(new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), 4.0, true));
        }
        return projs;
      }
    }
  }
}

// Factory function
export function createBoss(level) {
  const bosses = [
    CrabBoss, FlyBoss, SpiderBoss, CentipedeBoss, NautilusBoss,
    TwinFacesBoss, HandBoss, LadybugBoss, JellyfishBoss, ScorpionBoss,
    WaspBoss, SnakeBoss, BatBoss, AlienBoss, DragonBoss, FinalBoss,
  ];
  const BossClass = bosses[Math.min(level - 1, bosses.length - 1)];
  return new BossClass();
}
