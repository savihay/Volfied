import { dist, normSeg, segsCross, pointInPoly } from '../geometry.js';
import { COLORS } from '../constants.js';

export class Enemy {
  constructor(x, y, radius, speed, type = 'bouncer') {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.speed = speed;
    this.baseSpeed = speed;
    this.type = type;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle);
    this.alive = true;
  }

  get color() {
    return COLORS.enemy[this.type] || COLORS.enemy.bouncer;
  }

  update(dt, contour, frozen) {
    if (!this.alive || frozen) return;
    this.prevX = this.x;
    this.prevY = this.y;

    // Random direction changes ~1.5% per frame
    if (Math.random() < 0.015) {
      const theta = Math.random() * Math.PI * 2;
      this.vx = Math.cos(theta);
      this.vy = Math.sin(theta);
    }

    this._move(contour);
  }

  _move(contour) {
    const extLen = this.speed + this.radius;
    const testLine = [
      [this.x, this.y],
      [this.x + this.vx * extLen, this.y + this.vy * extLen],
    ];

    let bounced = false;
    for (let j = 0; j < contour.length; j++) {
      const seg = [contour[j], contour[(j + 1) % contour.length]];
      if (segsCross(testLine, seg)) {
        const [[x1, y1], [x2, y2]] = normSeg(seg);
        if (Math.abs(x1 - x2) < 0.1) this.vx = -this.vx;
        else this.vy = -this.vy;
        bounced = true;
        break;
      }
    }
    if (!bounced) {
      this.x += this.vx * this.speed;
      this.y += this.vy * this.speed;
    }
  }

  hitsPoint(px, py, extraRadius = 4) {
    return dist([this.x, this.y], [px, py]) <= this.radius + extraRadius;
  }

  crossesSegment(seg) {
    return segsCross([[this.prevX, this.prevY], [this.x, this.y]], seg);
  }

  isInsideContour(contour) {
    return pointInPoly([this.x, this.y], contour);
  }
}

export class Speeder extends Enemy {
  constructor(x, y, radius, speed) {
    super(x, y, radius, speed, 'speeder');
    this.accel = true;
  }

  update(dt, contour, frozen) {
    if (!this.alive || frozen) return;
    if (this.accel) {
      this.speed += 0.04;
      if (this.speed >= this.baseSpeed * 2) this.accel = false;
    } else {
      this.speed -= 0.04;
      if (this.speed <= this.baseSpeed * 0.3) this.accel = true;
    }
    super.update(dt, contour, frozen);
  }
}

export class Shapeshifter extends Enemy {
  constructor(x, y, radius, speed) {
    super(x, y, radius, speed, 'shapeshifter');
    this.growing = false;
  }

  update(dt, contour, frozen) {
    if (!this.alive || frozen) return;
    if (this.growing) {
      this.radius += 0.12;
      if (this.radius >= this.baseRadius) this.growing = false;
    } else {
      this.radius -= 0.12;
      if (this.radius <= 3) this.growing = true;
    }
    super.update(dt, contour, frozen);
  }
}

export class Chaser extends Enemy {
  constructor(x, y, radius, speed) {
    super(x, y, radius, speed, 'chaser');
    this.turnRate = 0.05; // radians per frame
  }

  update(dt, contour, frozen, playerX, playerY) {
    if (!this.alive || frozen) return;
    this.prevX = this.x;
    this.prevY = this.y;

    // Gradually steer toward player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const targetAngle = Math.atan2(dy, dx);
    const currentAngle = Math.atan2(this.vy, this.vx);
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turn = Math.sign(diff) * Math.min(Math.abs(diff), this.turnRate);
    const newAngle = currentAngle + turn;
    this.vx = Math.cos(newAngle);
    this.vy = Math.sin(newAngle);

    this._move(contour);
  }
}

export function createEnemy(config) {
  const x = config.x ?? 60 + Math.random() * 640;
  const y = config.y ?? 60 + Math.random() * 360;
  switch (config.type) {
    case 'speeder': return new Speeder(x, y, config.r || 7, config.spd || 2);
    case 'shapeshifter': return new Shapeshifter(x, y, config.r || 12, config.spd || 1.8);
    case 'chaser': return new Chaser(x, y, config.r || 9, config.spd || 1.5);
    default: return new Enemy(x, y, config.r || 8, config.spd || 1.5, 'bouncer');
  }
}
