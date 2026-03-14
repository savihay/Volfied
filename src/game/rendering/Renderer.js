import { FW, FH, COLORS, STATE, TARGET_AREA } from '../constants.js';
import { LEVELS } from '../levels/levelData.js';
import { CentipedeBoss, SnakeBoss, TwinFacesBoss } from '../entities/Boss.js';
import { getHighScores } from '../highscores.js';
import { generateBackground } from './backgrounds.js';
import { getBossSprite, getEnemySprite, getPlayerSprite, getPowerUpBlockSprite } from './sprites.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(game) {
    const ctx = this.ctx;
    const now = performance.now() / 1000;

    ctx.save();

    // Screen shake
    if (game.shakeTimer > 0) {
      const s = game.shakeTimer * 12;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    // Background (claimed territory)
    this._drawBackground(ctx, game);

    // Unclaimed area
    this._drawUnclaimed(ctx, game, now);

    // Flash effect
    if (game.flashTimer > 0) {
      ctx.fillStyle = `rgba(80, 200, 180, ${(game.flashTimer / 0.5) * 0.3})`;
      ctx.fillRect(0, 0, FW, FH);
    }

    // Contour border
    this._drawContour(ctx, game);

    // Power-up blocks
    this._drawPowerUpBlocks(ctx, game, now);

    // Trail
    this._drawTrail(ctx, game);

    // Flames
    this._drawFlames(ctx, game, now);

    // Projectiles
    this._drawProjectiles(ctx, game);

    // Laser bolts
    this._drawLaserBolts(ctx, game);

    // Enemies
    this._drawEnemies(ctx, game, now);

    // Boss
    this._drawBoss(ctx, game, now);

    // Player
    this._drawPlayer(ctx, game, now);

    // Score popups
    this._drawPopups(ctx, game);

    // Overlays
    this._drawOverlays(ctx, game);

    ctx.restore();
  }

  _getBackgroundCanvas(level) {
    return generateBackground(level);
  }

  _drawBackground(ctx, game) {
    // Dark base
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, FW, FH);

    if (!game.contour || game.contour.length < 3) return;

    // Clip to CLAIMED area (everything outside the unclaimed contour)
    // We do this by creating a path that covers the whole canvas, then subtracts the contour
    ctx.save();
    ctx.beginPath();
    // Outer rectangle (full canvas)
    ctx.moveTo(0, 0);
    ctx.lineTo(FW, 0);
    ctx.lineTo(FW, FH);
    ctx.lineTo(0, FH);
    ctx.closePath();
    // Inner hole (unclaimed contour) - wound opposite direction for clipping
    ctx.moveTo(game.contour[0][0], game.contour[0][1]);
    for (let i = game.contour.length - 1; i >= 0; i--) {
      ctx.lineTo(game.contour[i][0], game.contour[i][1]);
    }
    ctx.closePath();
    ctx.clip();

    // Draw the level background image within the claimed area
    const bgCanvas = this._getBackgroundCanvas(game.level);
    ctx.drawImage(bgCanvas, 0, 0);

    ctx.restore();
  }

  _drawUnclaimed(ctx, game, now) {
    if (!game.contour || game.contour.length < 3) return;

    ctx.save();
    ctx.fillStyle = COLORS.unclaimed;
    ctx.beginPath();
    ctx.moveTo(game.contour[0][0], game.contour[0][1]);
    for (let i = 1; i < game.contour.length; i++) {
      ctx.lineTo(game.contour[i][0], game.contour[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Subtle dot grid in unclaimed area
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 10; x < FW; x += 20) {
      for (let y = 10; y < FH; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawContour(ctx, game) {
    if (!game.contour || game.contour.length < 3) return;
    ctx.shadowColor = COLORS.border;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(game.contour[0][0], game.contour[0][1]);
    for (let i = 1; i < game.contour.length; i++) {
      ctx.lineTo(game.contour[i][0], game.contour[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  _drawPowerUpBlocks(ctx, game, now) {
    for (const block of game.powerUpBlocks) {
      const pulse = block.getPulse();
      const sprite = getPowerUpBlockSprite(block.type, block.isRedBlock, pulse);
      const s = sprite.width;

      // Glow effect
      if (block.isRedBlock) {
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowColor = '#88ffaa';
        ctx.shadowBlur = 8;
      }

      ctx.drawImage(sprite, block.x - s / 2, block.y - s / 2);
      ctx.shadowBlur = 0;
    }
  }

  _drawTrail(ctx, game) {
    if (game.trail.length < 2) return;

    // Find where flame has burned
    let burnedIdx = -1;
    for (const flame of game.flames) {
      burnedIdx = Math.max(burnedIdx, flame.getBurnedIndex());
    }

    // Draw unburned portion
    const startIdx = Math.max(0, burnedIdx);
    if (startIdx < game.trail.length - 1) {
      ctx.shadowColor = COLORS.trail;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = COLORS.trail;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(game.trail[startIdx][0], game.trail[startIdx][1]);
      for (let i = startIdx + 1; i < game.trail.length; i++) {
        ctx.lineTo(game.trail[i][0], game.trail[i][1]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Endpoint marker
    const last = game.trail[game.trail.length - 1];
    ctx.fillStyle = COLORS.trail;
    ctx.beginPath();
    ctx.arc(last[0], last[1], 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFlames(ctx, game, now) {
    for (const flame of game.flames) {
      // Fire effect
      const flicker = Math.sin(now * 20) * 3;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 15;

      // Orange core
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, 7 + flicker, 0, Math.PI * 2);
      ctx.fill();

      // Yellow center
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // White hot center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawProjectiles(ctx, game) {
    for (const p of game.projectiles) {
      ctx.shadowColor = p.fromBoss ? '#ff2266' : '#ff2222';
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.fromBoss ? '#ff4488' : '#ff4444';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawLaserBolts(ctx, game) {
    for (const lb of game.laserBolts) {
      ctx.shadowColor = lb.damagesBoss ? '#ff8800' : '#00ffff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = lb.damagesBoss ? '#ff6600' : '#88ffff';
      ctx.beginPath();
      ctx.arc(lb.x, lb.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lb.x, lb.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawEnemies(ctx, game, now) {
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const r = e.radius;
      const sprite = getEnemySprite(e.type, r);
      const spriteSize = sprite.width;

      ctx.save();
      // Subtle pulsing
      const pulse = 0.9 + Math.sin(now * 5 + e.x * 0.1) * 0.1;
      ctx.translate(e.x, e.y);
      ctx.scale(pulse, pulse);
      ctx.drawImage(sprite, -spriteSize / 2, -spriteSize / 2);
      ctx.restore();
    }
  }

  _drawBoss(ctx, game, now) {
    const boss = game.boss;
    if (!boss || !boss.alive) return;

    const r = boss.radius;
    const spriteSize = r * 2.5;

    // Telegraph warning
    if (boss.telegraphing) {
      const flash = Math.sin(now * 15) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(255,255,255,${flash * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, r + 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Boss aura
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    const pulse = Math.sin(now * 3) * 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, r + 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw segments for centipede/snake bosses
    if (boss instanceof CentipedeBoss || boss instanceof SnakeBoss) {
      for (let i = boss.segments.length - 1; i >= 0; i--) {
        const seg = boss.segments[i];
        const segR = (boss instanceof CentipedeBoss ? 10 : 8) * (1 - i * 0.04);
        const segColor = boss.hitFlash > 0 ? '#ffffff' : boss.color;
        ctx.fillStyle = segColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, segR, 0, Math.PI * 2);
        ctx.fill();
        // Segment detail
        ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#000000';
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, segR * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Boss sprite
    const sprite = getBossSprite(boss.name, Math.round(spriteSize), boss.hitFlash > 0);
    ctx.drawImage(sprite, boss.x - spriteSize / 2, boss.y - spriteSize / 2);

    // Draw second face for twin faces
    if (boss instanceof TwinFacesBoss) {
      const sprite2 = getBossSprite(boss.name, Math.round(spriteSize), boss.hitFlash > 0);
      ctx.drawImage(sprite2, boss.x2 - spriteSize / 2, boss.y2 - spriteSize / 2);
    }

    // HP bar above boss
    if (boss.hp < boss.maxHp) {
      const barW = 40;
      const barH = 4;
      const bx = boss.x - barW / 2;
      const by = boss.y - r - 18;
      ctx.fillStyle = '#330000';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(bx, by, barW * (boss.hp / boss.maxHp), barH);
    }
  }

  _drawPlayer(ctx, game, now) {
    if (game.state === STATE.DEATH && game.deathTimer > 1.0) return; // hide during death flash

    const px = game.playerX;
    const py = game.playerY;

    // Invulnerability flash
    if (game.invulnTimer > 0 && Math.sin(now * 20) > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Shield aura
    if (game.shieldTime > 0) {
      const shieldAlpha = 0.2 + Math.sin(now * 8) * 0.15;
      ctx.strokeStyle = `rgba(255,217,61,${shieldAlpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.playerShield;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Player sprite (already pre-rotated based on direction)
    const dir = game.playerDir;
    const sprite = getPlayerSprite(dir, game.shieldTime > 0, game.drawing);
    const spriteSize = sprite.width;

    ctx.save();
    ctx.translate(px, py);
    // Glow behind ship
    ctx.shadowColor = game.drawing ? COLORS.trail : COLORS.border;
    ctx.shadowBlur = 14;
    ctx.drawImage(sprite, -spriteSize / 2, -spriteSize / 2);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.globalAlpha = 1;
  }

  _drawPopups(ctx, game) {
    for (const p of game.popups) {
      ctx.globalAlpha = Math.min(1, p.timer * 2);
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.text === '1UP!' ? '#44ff44' : '#ffd93d';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  _drawOverlays(ctx, game) {
    switch (game.state) {
      case STATE.MENU:
        this._drawMenu(ctx);
        break;
      case STATE.INTRO:
        this._drawIntro(ctx, game);
        break;
      case STATE.PAUSED:
        this._drawPaused(ctx);
        break;
      case STATE.COMPLETE:
        this._drawComplete(ctx, game);
        break;
      case STATE.GAMEOVER:
        this._drawGameOver(ctx, game);
        break;
      case STATE.VICTORY:
        this._drawVictory(ctx, game);
        break;
    }
  }

  _drawMenu(ctx) {
    ctx.fillStyle = 'rgba(4,4,16,0.96)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';

    // Title
    ctx.font = "bold 64px 'Segoe UI', monospace";
    ctx.fillStyle = COLORS.border;
    ctx.shadowColor = COLORS.border;
    ctx.shadowBlur = 40;
    ctx.fillText('VOLFIED', FW / 2, FH / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.font = "12px monospace";
    ctx.fillStyle = '#1e5060';
    ctx.letterSpacing = '8px';
    ctx.fillText('TERRITORY CONQUEST', FW / 2, FH / 2 - 30);

    // Start prompt
    ctx.font = "18px monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.fillText('PRESS ENTER OR SPACE TO START', FW / 2, FH / 2 + 30);

    // Controls
    ctx.font = "12px monospace";
    ctx.fillStyle = '#2a5060';
    ctx.fillText('Arrow keys to move  |  SPACE + Arrow to cut territory', FW / 2, FH / 2 + 80);
    ctx.fillText('Space: fire laser (with power-up)  |  P/Esc: pause', FW / 2, FH / 2 + 100);

    // High scores
    const scores = getHighScores();
    if (scores.length > 0) {
      ctx.font = "11px monospace";
      ctx.fillStyle = '#1e4050';
      ctx.fillText('HIGH SCORES', FW / 2, FH / 2 + 135);
      ctx.fillStyle = '#2a5060';
      const top3 = scores.slice(0, 3);
      top3.forEach((s, i) => {
        ctx.fillText(`${i + 1}. ${s.score} (Lvl ${s.level})`, FW / 2, FH / 2 + 152 + i * 15);
      });
    }
  }

  _drawIntro(ctx, game) {
    ctx.fillStyle = 'rgba(6,6,15,0.88)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';
    ctx.font = "bold 52px 'Segoe UI', monospace";
    ctx.fillStyle = COLORS.border;
    ctx.shadowColor = COLORS.border;
    ctx.shadowBlur = 24;
    ctx.fillText(`LEVEL ${game.level}`, FW / 2, FH / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.font = "22px monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.fillText(game.boss?.name || '', FW / 2, FH / 2 + 10);

    ctx.font = "14px monospace";
    ctx.fillStyle = '#3a7080';
    ctx.fillText(`Capture ${Math.round(TARGET_AREA * 100)}% to advance`, FW / 2, FH / 2 + 45);

    ctx.font = "12px monospace";
    ctx.fillStyle = '#254050';
    ctx.fillText('SPACE + Arrow to cut  |  Collect blocks by claiming around them', FW / 2, FH / 2 + 70);
  }

  _drawPaused(ctx) {
    ctx.fillStyle = 'rgba(4,4,16,0.7)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';
    ctx.font = "bold 42px 'Segoe UI', monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.shadowColor = COLORS.hudGold;
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', FW / 2, FH / 2 - 10);
    ctx.shadowBlur = 0;

    ctx.font = "14px monospace";
    ctx.fillStyle = '#3a7080';
    ctx.fillText('Press P or Escape to resume', FW / 2, FH / 2 + 25);
  }

  _drawComplete(ctx, game) {
    ctx.fillStyle = 'rgba(6,6,15,0.88)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';
    ctx.font = "bold 42px 'Segoe UI', monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.shadowColor = COLORS.hudGold;
    ctx.shadowBlur = 20;
    ctx.fillText('LEVEL COMPLETE!', FW / 2, FH / 2 - 22);
    ctx.shadowBlur = 0;

    ctx.font = "18px monospace";
    ctx.fillStyle = COLORS.border;
    ctx.fillText(
      `Territory: ${Math.min(game.progress * 100, 100).toFixed(1)}%   Score: ${game.score}`,
      FW / 2, FH / 2 + 18
    );
  }

  _drawGameOver(ctx, game) {
    ctx.fillStyle = 'rgba(4,4,16,0.96)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';
    ctx.font = "bold 56px 'Segoe UI', monospace";
    ctx.fillStyle = '#ff4455';
    ctx.shadowColor = '#ff4455';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', FW / 2, FH / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.font = "22px monospace";
    ctx.fillStyle = COLORS.border;
    ctx.fillText(`Score: ${game.score}`, FW / 2, FH / 2 + 20);

    ctx.font = "14px monospace";
    ctx.fillStyle = '#3a7080';
    ctx.fillText(`Reached Level ${game.level}`, FW / 2, FH / 2 + 50);

    ctx.font = "16px monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.fillText('PRESS ENTER TO CONTINUE', FW / 2, FH / 2 + 90);
  }

  _drawVictory(ctx, game) {
    ctx.fillStyle = 'rgba(4,4,16,0.96)';
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = 'center';
    ctx.font = "bold 48px 'Segoe UI', monospace";
    ctx.fillStyle = COLORS.hudGold;
    ctx.shadowColor = COLORS.hudGold;
    ctx.shadowBlur = 30;
    ctx.fillText('VICTORY!', FW / 2, FH / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.font = "20px monospace";
    ctx.fillStyle = COLORS.border;
    ctx.fillText('All 16 levels completed!', FW / 2, FH / 2);

    ctx.font = "24px monospace";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${game.score}`, FW / 2, FH / 2 + 40);

    ctx.font = "14px monospace";
    ctx.fillStyle = '#3a7080';
    ctx.fillText('PRESS ENTER TO RETURN TO MENU', FW / 2, FH / 2 + 80);
  }
}
