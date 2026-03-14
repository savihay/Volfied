import { dist, segsCross, pointInPoly } from '../geometry.js';

export class Projectile {
  constructor(x, y, vx, vy, speed = 4.5, fromBoss = false) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = speed;
    this.fromBoss = fromBoss;
    this.alive = true;
    this.lifetime = 5.0; // seconds
  }

  update(dt) {
    if (!this.alive) return;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * this.speed;
    this.y += this.vy * this.speed;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
  }

  isInsideContour(contour) {
    return pointInPoly([this.x, this.y], contour);
  }

  hitsPoint(px, py, radius = 6) {
    return dist([this.x, this.y], [px, py]) <= radius;
  }

  crossesSegment(seg) {
    return segsCross([[this.prevX, this.prevY], [this.x, this.y]], seg);
  }
}

export class LaserBolt {
  constructor(x, y, vx, vy, damagesBoss = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = 8;
    this.damagesBoss = damagesBoss;
    this.alive = true;
    this.lifetime = 2.0;
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this.vx * this.speed;
    this.y += this.vy * this.speed;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
  }

  hitsEnemy(enemy) {
    return dist([this.x, this.y], [enemy.x, enemy.y]) <= enemy.radius + 4;
  }
}
