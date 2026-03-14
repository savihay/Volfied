import {
  FW, FH, BORDER_SPEED, CUTTING_SPEED, SPEED_BOOST_MULT,
  TARGET_AREA, CONTOUR_TOLERANCE, RESPAWN_INVULN,
  SCORE_PER_PCT, ENEMY_KILL_BASE, ENEMY_KILL_MULT,
  BOSS_KILL_SCORE, LEVEL_COMPLETE_BONUS, EXTRA_LIFE_THRESHOLD,
  STARTING_LIVES, STATE,
  POWERUP_SPEED_DUR, POWERUP_FREEZE_DUR, POWERUP_SHIELD_DUR,
  POWERUP_LASER_DUR, POWERUP_BOSS_WEAPON_DUR,
  LASER_FIRE_RATE, LASER_SPEED, BOSS_WEAPON_FIRE_RATE,
} from './constants.js';
import {
  dist, ptToSegDist, ptOnContour, snapToContour, pointInPoly,
  normSeg, segsCross, polyArea,
} from './geometry.js';
import { captureTerritory } from './territory.js';
import Input from './input.js';
import { createEnemy } from './entities/Enemy.js';
import { createBoss, TwinFacesBoss } from './entities/Boss.js';
import { Projectile, LaserBolt } from './entities/Projectile.js';
import { Flame } from './entities/Flame.js';
import { PowerUpBlock, placePowerUpBlocks } from './entities/PowerUpBlock.js';
import { LEVELS } from './levels/levelData.js';
import { Renderer } from './rendering/Renderer.js';
import { audio } from './audio.js';
import { addHighScore, getHighScores, isHighScore } from './highscores.js';

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.renderer = new Renderer(this.ctx);
    this.state = STATE.MENU;
    this.frameId = null;
    this.lastTime = 0;
    this.onStateChange = null; // callback for React

    // Game state
    this.level = 1;
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.nextExtraLife = EXTRA_LIFE_THRESHOLD;

    // Level state
    this.contour = [];
    this.playerX = 0;
    this.playerY = 0;
    this.playerDir = [0, -1]; // last direction faced
    this.trail = [];
    this.drawing = false;

    // Shield
    this.shieldTime = 0; // remaining shield seconds
    this.shieldMaxTime = 0;
    this.shieldPaused = false;

    // Entities
    this.boss = null;
    this.enemies = [];
    this.projectiles = [];
    this.flames = [];
    this.laserBolts = [];
    this.powerUpBlocks = [];

    // Power-up
    this.activePowerUp = null; // { type, timer }
    this.laserCooldown = 0;

    // Timers
    this.invulnTimer = 0;
    this.deathTimer = 0;
    this.introTimer = 0;
    this.completeTimer = 0;
    this.flashTimer = 0;
    this.shakeTimer = 0;

    // Progress
    this.progress = 0;
    this.fieldArea = FW * FH;

    // Score popups
    this.popups = [];

    // Pause toggle tracking
    this._pauseWasPressed = false;
  }

  start() {
    this.input.attach();
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  stop() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.input.detach();
  }

  _loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this._update(dt);
    this._render();
    this.frameId = requestAnimationFrame((t) => this._loop(t));
  }

  _setState(newState) {
    this.state = newState;
    if (this.onStateChange) this.onStateChange(this.getHUD());
  }

  // ═══════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════

  _update(dt) {
    // Handle mute toggle
    if (this.input.consumeKey('KeyM')) {
      this.toggleMute();
    }

    // Handle pause toggle
    const pausePressed = this.input.isPause();
    if (pausePressed && !this._pauseWasPressed) {
      if (this.state === STATE.PLAYING) { this._setState(STATE.PAUSED); }
      else if (this.state === STATE.PAUSED) { this._setState(STATE.PLAYING); }
    }
    this._pauseWasPressed = pausePressed;

    switch (this.state) {
      case STATE.MENU:
        if (this.input.consumeKey('Enter') || this.input.consumeKey('Space')) {
          audio.unlock();
          audio.menuSelect();
          this._startGame();
        }
        break;

      case STATE.INTRO:
        this.introTimer -= dt;
        if (this.introTimer <= 0) this._setState(STATE.PLAYING);
        break;

      case STATE.PLAYING:
        this._gameTick(dt);
        break;

      case STATE.PAUSED:
        // Do nothing, wait for unpause
        break;

      case STATE.DEATH:
        this.deathTimer -= dt;
        this.shakeTimer = Math.max(0, this.shakeTimer - dt);
        if (this.deathTimer <= 0) {
          if (this.lives <= 0) {
            audio.gameOver();
            this._saveHighScore();
            this._setState(STATE.GAMEOVER);
          } else {
            this._respawnPlayer();
            this._setState(STATE.PLAYING);
          }
        }
        break;

      case STATE.COMPLETE:
        this.completeTimer -= dt;
        if (this.completeTimer <= 0) {
          if (this.level >= 16) {
            this._saveHighScore();
            this._setState(STATE.VICTORY);
          } else {
            this.level++;
            this._initLevel();
            this.introTimer = 2.5;
            this._setState(STATE.INTRO);
          }
        }
        break;

      case STATE.GAMEOVER:
      case STATE.VICTORY:
        if (this.input.consumeKey('Enter') || this.input.consumeKey('Space')) {
          this._setState(STATE.MENU);
        }
        break;
    }

    // Update popups
    this.popups = this.popups.filter(p => {
      p.timer -= dt;
      p.y -= 30 * dt;
      return p.timer > 0;
    });

    // Decay timers
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    // Notify React
    if (this.onStateChange) this.onStateChange(this.getHUD());
  }

  _gameTick(dt) {
    const dir = this.input.getDir();
    if (dir) this.playerDir = dir;

    const frozen = this.activePowerUp?.type === 'T';

    // Shield countdown
    if (this.shieldTime > 0 && !this.shieldPaused) {
      this.shieldTime -= dt;
      if (this.shieldTime < 0) this.shieldTime = 0;
    }

    // Invulnerability countdown
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // Power-up countdown
    if (this.activePowerUp) {
      this.activePowerUp.timer -= dt;
      if (this.activePowerUp.timer <= 0) {
        if (this.activePowerUp.type === 'P') this.shieldPaused = false;
        this.activePowerUp = null;
      }
    }
    this.laserCooldown = Math.max(0, this.laserCooldown - dt);

    // Fire laser/boss weapon
    if (this.input.isSpace() && !this.drawing && this.laserCooldown <= 0) {
      if (this.activePowerUp?.type === 'L') {
        this._fireLaser(false);
      } else if (this.activePowerUp?.type === 'BOSS') {
        this._fireLaser(true);
      }
    }

    // Update boss
    if (this.boss?.alive) {
      const newProjs = this.boss.update(dt, this.contour, this.playerX, this.playerY, frozen);
      this.projectiles.push(...newProjs);
    }

    // Update enemies
    for (const e of this.enemies) {
      if (e.type === 'chaser') {
        e.update(dt, this.contour, frozen, this.playerX, this.playerY);
      } else {
        e.update(dt, this.contour, frozen);
      }
    }

    // Update projectiles
    for (const p of this.projectiles) {
      if (!frozen) p.update(dt);
    }
    this.projectiles = this.projectiles.filter(p => p.alive && p.isInsideContour(this.contour));

    // Update flames
    for (const f of this.flames) {
      f.update(dt);
      if (f.reachedPlayer) {
        this._killPlayer();
        return;
      }
    }
    this.flames = this.flames.filter(f => f.alive);

    // Update laser bolts
    for (const lb of this.laserBolts) {
      lb.update(dt);
    }
    this._checkLaserHits();
    this.laserBolts = this.laserBolts.filter(lb => lb.alive);

    // Update power-up blocks
    for (const b of this.powerUpBlocks) {
      b.update(dt);
    }

    // ── COLLISION DETECTION ──

    const isVulnerable = this.invulnTimer <= 0;

    // Trail collision detection (enemies/boss/projectiles → flame)
    if (this.drawing && this.trail.length >= 2) {
      const flameCountBefore = this.flames.length;

      // Minor enemies crossing trail → flame
      for (const e of this.enemies) {
        if (e.prevX !== undefined) {
          for (let t = 0; t < this.trail.length - 1; t++) {
            if (segsCross([[e.prevX, e.prevY], [e.x, e.y]], [this.trail[t], this.trail[t + 1]])) {
              this.flames.push(new Flame(this.trail, t));
              break;
            }
          }
        }
      }

      // Boss body near trail → flame
      if (this.boss?.alive) {
        for (let t = 0; t < this.trail.length - 1; t++) {
          const seg = [this.trail[t], this.trail[t + 1]];
          if (ptToSegDist([this.boss.x, this.boss.y], seg) <= this.boss.radius) {
            this.flames.push(new Flame(this.trail, t));
            break;
          }
        }
      }

      // Projectiles hitting trail → flame
      for (const p of this.projectiles) {
        for (let t = 0; t < this.trail.length - 1; t++) {
          if (p.crossesSegment([this.trail[t], this.trail[t + 1]])) {
            this.flames.push(new Flame(this.trail, t));
            p.alive = false;
            break;
          }
        }
      }

      if (this.flames.length > flameCountBefore) audio.flameTraveling();
    }

    // Enemy/boss direct hit on player
    if (isVulnerable) {
      // On border: only die if shield is depleted
      const playerOnBorder = ptOnContour([this.playerX, this.playerY], this.contour);
      const shieldProtects = playerOnBorder && this.shieldTime > 0;

      if (!shieldProtects) {
        // Check boss
        if (this.boss?.alive && this.boss.hitsPoint(this.playerX, this.playerY)) {
          this._killPlayer();
          return;
        }
        // Check enemies
        for (const e of this.enemies) {
          if (e.hitsPoint(this.playerX, this.playerY)) {
            this._killPlayer();
            return;
          }
        }
      }

      // Projectiles always kill (even on border with shield)
      for (const p of this.projectiles) {
        if (p.hitsPoint(this.playerX, this.playerY)) {
          this._killPlayer();
          return;
        }
      }
    }

    // ── PLAYER MOVEMENT ──
    if (this.deathTimer > 0) return;

    const onBorder = ptOnContour([this.playerX, this.playerY], this.contour);
    const speed = this._getPlayerSpeed();

    if (!this.drawing) {
      if (onBorder) {
        if (dir) {
          const cx = this.playerX + dir[0] * speed;
          const cy = this.playerY + dir[1] * speed;

          // Check if moving off-border to start cutting (requires Space held)
          const spaceHeld = this.input.isSpace();
          if (spaceHeld && !ptOnContour([cx, cy], this.contour) && pointInPoly([cx, cy], this.contour)) {
            // Start cutting
            this.drawing = true;
            this.trail = [[this.playerX, this.playerY], [cx, cy]];
            this.playerX = cx;
            this.playerY = cy;
            audio.cutStart();
          } else {
            this._moveOnBorder(dir, speed);
          }
        }
      } else {
        // Snap to border
        const snapped = snapToContour([this.playerX, this.playerY], this.contour);
        this.playerX = snapped[0];
        this.playerY = snapped[1];
      }
    } else {
      // ── CUTTING ──
      if (dir) {
        const cx = Math.max(1, Math.min(FW - 1, this.playerX + dir[0] * speed));
        const cy = Math.max(1, Math.min(FH - 1, this.playerY + dir[1] * speed));

        // Check for retracing (moving back along the trail)
        if (this.trail.length >= 2 && this._tryRetrace(dir, speed)) {
          return;
        }

        // Did we reach the border?
        if (ptOnContour([cx, cy], this.contour)) {
          const snapped = snapToContour([cx, cy], this.contour);
          this.trail.push([snapped[0], snapped[1]]);
          this.playerX = snapped[0];
          this.playerY = snapped[1];
          audio.cutComplete();
          this._doCapture();
          return;
        }

        // Self-intersection check
        if (this.trail.length >= 2) {
          const newSeg = [[this.playerX, this.playerY], [cx, cy]];
          for (let t = 0; t < this.trail.length - 2; t++) {
            if (segsCross(newSeg, [this.trail[t], this.trail[t + 1]])) {
              this._killPlayer();
              return;
            }
          }
        }

        // Extend trail (merge collinear segments)
        if (this.trail.length >= 2) {
          const prev = this.trail[this.trail.length - 2];
          const cur = this.trail[this.trail.length - 1];
          if ((Math.abs(prev[0] - cur[0]) < 0.1 && Math.abs(cx - cur[0]) < 0.5) ||
              (Math.abs(prev[1] - cur[1]) < 0.1 && Math.abs(cy - cur[1]) < 0.5)) {
            this.trail[this.trail.length - 1] = [cx, cy];
          } else {
            this.trail.push([cx, cy]);
          }
        } else {
          this.trail.push([cx, cy]);
        }
        this.playerX = cx;
        this.playerY = cy;
      }
    }
  }

  _getPlayerSpeed() {
    let speed = this.drawing ? CUTTING_SPEED : BORDER_SPEED;
    if (this.activePowerUp?.type === 'S') speed *= SPEED_BOOST_MULT;
    return speed;
  }

  _moveOnBorder(dir, speed) {
    if (!dir) return;
    const [dx, dy] = dir;

    for (let i = 0; i < this.contour.length; i++) {
      const seg = [this.contour[i], this.contour[(i + 1) % this.contour.length]];
      if (ptToSegDist([this.playerX, this.playerY], seg) <= CONTOUR_TOLERANCE) {
        const [[ax, ay], [bx, by]] = normSeg(seg);
        if (Math.abs(ax - bx) < 0.1 && dy !== 0) {
          this.playerY = Math.max(ay, Math.min(by, this.playerY + dy * speed));
          return;
        } else if (Math.abs(ay - by) < 0.1 && dx !== 0) {
          this.playerX = Math.max(ax, Math.min(bx, this.playerX + dx * speed));
          return;
        }
      }
    }
    // Fallback: try direct movement if on contour
    const candidate = [this.playerX + dx * speed, this.playerY + dy * speed];
    if (ptOnContour(candidate, this.contour)) {
      this.playerX = candidate[0];
      this.playerY = candidate[1];
    }
  }

  /**
   * Try to retrace (backtrack) along the trail. Returns true if movement was handled.
   * When the player moves in the opposite direction of the current trail segment,
   * they erase trail points instead of creating parallel lines.
   */
  _tryRetrace(dir, speed) {
    if (this.trail.length < 2) return false;

    const cur = this.trail[this.trail.length - 1];
    const prev = this.trail[this.trail.length - 2];

    // Determine direction of the last trail segment
    const segDx = cur[0] - prev[0];
    const segDy = cur[1] - prev[1];

    // Check if player direction is opposite to the trail segment direction
    // (moving backward along the segment)
    const isHorizontalSeg = Math.abs(segDy) < 0.5;
    const isVerticalSeg = Math.abs(segDx) < 0.5;

    let retracing = false;
    if (isHorizontalSeg && dir[0] !== 0 && dir[1] === 0) {
      // Horizontal segment, player moving horizontally
      retracing = (segDx > 0 && dir[0] < 0) || (segDx < 0 && dir[0] > 0);
    } else if (isVerticalSeg && dir[1] !== 0 && dir[0] === 0) {
      // Vertical segment, player moving vertically
      retracing = (segDy > 0 && dir[1] < 0) || (segDy < 0 && dir[1] > 0);
    }

    if (!retracing) return false;

    // Move backward along the trail
    const nx = this.playerX + dir[0] * speed;
    const ny = this.playerY + dir[1] * speed;

    // Calculate distances
    const segLen = dist(prev, cur);
    const distToPrev = dist([nx, ny], prev);

    if (distToPrev <= speed * 0.5 || distToPrev < 1) {
      // We've retraced back past the previous point
      this.playerX = prev[0];
      this.playerY = prev[1];
      this.trail.pop(); // Remove the current endpoint

      // If only 1 point left, we've fully retraced - cancel the cut
      if (this.trail.length <= 1) {
        this.drawing = false;
        this.trail = [];
        // Snap back to contour
        const snapped = snapToContour([this.playerX, this.playerY], this.contour);
        this.playerX = snapped[0];
        this.playerY = snapped[1];
      }
    } else {
      // Just move backward along the segment
      this.playerX = nx;
      this.playerY = ny;
      this.trail[this.trail.length - 1] = [nx, ny];
    }

    return true;
  }

  _doCapture() {
    if (this.trail.length < 2) {
      this.drawing = false;
      this.trail = [];
      return;
    }

    try {
      const bossPos = this.boss?.alive ? [this.boss.x, this.boss.y] : null;
      const result = captureTerritory(this.contour, this.trail, bossPos, this.enemies);

      if (result) {
        const { contour: newContour, area: newArea } = result;
        const oldProgress = this.progress;
        this.progress = Math.max(this.progress, 1 - newArea / this.fieldArea);
        const pctGained = this.progress - oldProgress;
        const areaScore = Math.floor(pctGained * SCORE_PER_PCT);
        this._addScore(areaScore, this.playerX, this.playerY - 20);

        // Kill enemies trapped in captured area
        let killCount = 0;
        this.enemies = this.enemies.filter(e => {
          if (!pointInPoly([e.x, e.y], newContour)) {
            killCount++;
            return false;
          }
          return true;
        });

        // Multi-kill exponential bonus
        if (killCount > 0) {
          let bonus = 0;
          let mult = ENEMY_KILL_BASE;
          for (let i = 0; i < killCount; i++) {
            bonus += mult;
            mult *= ENEMY_KILL_MULT;
          }
          this._addScore(bonus, this.playerX, this.playerY - 40);
        }

        // Collect power-up blocks in captured area
        for (const block of this.powerUpBlocks) {
          if (!block.collected && !pointInPoly([block.x, block.y], newContour)) {
            block.collected = true;
            this._activatePowerUp(block.type);
            this._addScore(100, block.x, block.y);
          }
        }
        this.powerUpBlocks = this.powerUpBlocks.filter(b => !b.collected);

        // Check twin faces separation (level 6 special)
        if (this.boss instanceof TwinFacesBoss && this.boss.alive) {
          if (this.boss.checkSeparation(newContour)) {
            this._addScore(BOSS_KILL_SCORE, this.boss.x, this.boss.y);
          }
        }

        this.contour = newContour;
        this.flashTimer = 0.5;
        audio.territoryClaim();
        if (killCount > 0) audio.enemyDeath();
      }
    } catch (e) {
      console.error('Capture failed:', e);
    }

    this.trail = [];
    this.drawing = false;
    this.flames = [];

    // Check win condition
    if (this.progress >= TARGET_AREA) {
      const excess = Math.max(0, this.progress - TARGET_AREA);
      this.score += LEVEL_COMPLETE_BONUS + Math.floor(excess * 10000);
      this.completeTimer = 3.0;
      audio.levelComplete();
      this._setState(STATE.COMPLETE);
    }
  }

  _killPlayer() {
    this.trail = [];
    this.drawing = false;
    this.flames = [];
    this.projectiles = [];
    this.lives--;
    this.shakeTimer = 0.5;
    this.deathTimer = 1.5;
    this.invulnTimer = 0;
    audio.playerDeath();
    this._setState(STATE.DEATH);
  }

  _respawnPlayer() {
    // Respawn at bottom-most horizontal edge
    let spawnPt = [...this.contour[0]];
    let bestY = -Infinity;
    for (let i = 0; i < this.contour.length; i++) {
      const seg = [this.contour[i], this.contour[(i + 1) % this.contour.length]];
      const [[ax, ay], [bx, by]] = normSeg(seg);
      if (Math.abs(ay - by) < 0.1 && ay > bestY) {
        bestY = ay;
        spawnPt = [(ax + bx) / 2, ay];
      }
    }
    this.playerX = spawnPt[0];
    this.playerY = spawnPt[1];
    this.invulnTimer = RESPAWN_INVULN;
  }

  _fireLaser(damagesBoss) {
    const dir = this.playerDir;
    const bolt = new LaserBolt(
      this.playerX + dir[0] * 12,
      this.playerY + dir[1] * 12,
      dir[0], dir[1], damagesBoss
    );
    this.laserBolts.push(bolt);
    this.laserCooldown = damagesBoss ? BOSS_WEAPON_FIRE_RATE : LASER_FIRE_RATE;
    audio.laserFire();
  }

  _checkLaserHits() {
    for (const lb of this.laserBolts) {
      if (!lb.alive) continue;

      // Hit enemies
      if (!lb.damagesBoss) {
        for (const e of this.enemies) {
          if (lb.hitsEnemy(e)) {
            e.alive = false;
            lb.alive = false;
            audio.enemyDeath();
            this._addScore(ENEMY_KILL_BASE, e.x, e.y);
            break;
          }
        }
      }

      // Hit boss
      if (lb.damagesBoss && this.boss?.alive && lb.hitsEnemy(this.boss)) {
        this.boss.takeDamage();
        lb.alive = false;
        audio.bossHit();
        this._addScore(2000, this.boss.x, this.boss.y);
        if (!this.boss.alive) {
          audio.bossDeath();
          this._addScore(BOSS_KILL_SCORE, this.boss.x, this.boss.y);
        }
      }

      // Remove if outside contour
      if (!pointInPoly([lb.x, lb.y], this.contour) && !ptOnContour([lb.x, lb.y], this.contour, 10)) {
        lb.alive = false;
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);
  }

  _activatePowerUp(type) {
    audio.powerUpCollect();
    // P stacks; others replace
    if (type === 'P') {
      this.shieldPaused = true;
      if (!this.activePowerUp || this.activePowerUp.type === 'P') {
        this.activePowerUp = { type: 'P', timer: POWERUP_SHIELD_DUR };
      }
      // If another power-up is active, just start the shield pause without replacing
      return;
    }

    if (type === 'C') {
      // Instant: clear all minor enemies
      for (const e of this.enemies) {
        this._addScore(ENEMY_KILL_BASE, e.x, e.y);
      }
      this.enemies = [];
      this.flashTimer = 0.3;
      return;
    }

    const durations = {
      S: POWERUP_SPEED_DUR,
      T: POWERUP_FREEZE_DUR,
      L: POWERUP_LASER_DUR,
      BOSS: POWERUP_BOSS_WEAPON_DUR,
    };

    this.activePowerUp = { type, timer: durations[type] || 10 };
  }

  _addScore(amount, x, y) {
    if (amount <= 0) return;
    this.score += amount;
    this.popups.push({ text: `+${amount}`, x, y, timer: 1.2 });

    // Check extra life
    if (this.score >= this.nextExtraLife) {
      this.lives++;
      this.nextExtraLife += EXTRA_LIFE_THRESHOLD;
      this.popups.push({ text: '1UP!', x: FW / 2, y: FH / 2, timer: 2.0 });
    }
  }

  // ═══════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════

  _startGame() {
    this.level = 1;
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.nextExtraLife = EXTRA_LIFE_THRESHOLD;
    this._initLevel();
    this.introTimer = 2.5;
    this._setState(STATE.INTRO);
  }

  _initLevel() {
    const lvlIdx = Math.min(this.level - 1, LEVELS.length - 1);
    const lvl = LEVELS[lvlIdx];

    this.contour = [[0, 0], [FW, 0], [FW, FH], [0, FH]];
    this.playerX = Math.round(FW / 2);
    this.playerY = FH;
    this.playerDir = [0, -1];
    this.trail = [];
    this.drawing = false;
    this.progress = 0;
    this.fieldArea = FW * FH;

    // Shield
    this.shieldTime = lvl.shieldTime;
    this.shieldMaxTime = lvl.shieldTime;
    this.shieldPaused = false;

    // Entities
    this.boss = createBoss(this.level);
    // Position boss in center of field
    this.boss.x = FW / 2;
    this.boss.y = FH / 2 - 40;

    this.enemies = lvl.enemies.map(cfg => createEnemy(cfg));
    this.projectiles = [];
    this.flames = [];
    this.laserBolts = [];

    // Power-up blocks
    this.powerUpBlocks = placePowerUpBlocks(this.contour, lvl.greyBlocks, lvl.redBlocks, FW, FH);

    // Active power-up
    this.activePowerUp = null;
    this.laserCooldown = 0;

    // Timers
    this.invulnTimer = RESPAWN_INVULN;
    this.deathTimer = 0;
    this.flashTimer = 0;
    this.shakeTimer = 0;
    this.popups = [];
  }

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════

  _render() {
    this.renderer.render(this);
  }

  // ═══════════════════════════════════════════════════
  //  HUD DATA
  // ═══════════════════════════════════════════════════

  _saveHighScore() {
    if (this.score > 0) {
      addHighScore(this.score, this.level);
    }
  }

  toggleMute() {
    return audio.toggle();
  }

  getHUD() {
    return {
      state: this.state,
      level: this.level,
      levelName: LEVELS[Math.min(this.level - 1, LEVELS.length - 1)]?.name || '',
      lives: this.lives,
      score: this.score,
      pct: Math.min(this.progress * 100, 100),
      shieldPct: this.shieldMaxTime > 0 ? this.shieldTime / this.shieldMaxTime : 0,
      shieldTime: this.shieldTime,
      activePowerUp: this.activePowerUp,
      bossHp: this.boss?.alive ? this.boss.hp : 0,
      bossMaxHp: this.boss?.maxHp || 0,
      bossName: this.boss?.name || '',
      muted: audio.muted,
      highScores: getHighScores(),
      isNewHighScore: (this.state === STATE.GAMEOVER || this.state === STATE.VICTORY) && isHighScore(this.score),
    };
  }
}
