// Game dimensions
export const FW = 760;
export const FH = 480;
export const HUD_HEIGHT = 0; // HUD is rendered as React overlay, not on canvas

// Player
export const BORDER_SPEED = 3.5;
export const CUTTING_SPEED = 2.2;
export const SPEED_BOOST_MULT = 1.5;
export const RESPAWN_INVULN = 2.0; // seconds

// Territory
export const TARGET_AREA = 0.80;
export const CONTOUR_TOLERANCE = 4;

// Flame
export const FLAME_SPEED = 5.5;

// Shield
export const BASE_SHIELD_TIME = 45; // seconds, level 1

// Scoring
export const SCORE_PER_PCT = 10000;
export const ENEMY_KILL_BASE = 500;
export const ENEMY_KILL_MULT = 3; // exponential multiplier per additional enemy
export const BOSS_HIT_SCORE = 2000;
export const BOSS_KILL_SCORE = 10000;
export const LEVEL_COMPLETE_BONUS = 5000;
export const EXTRA_LIFE_THRESHOLD = 50000;

// Lives
export const STARTING_LIVES = 3;

// Power-up durations (seconds)
export const POWERUP_SPEED_DUR = 8;
export const POWERUP_FREEZE_DUR = 5;
export const POWERUP_SHIELD_DUR = 10;
export const POWERUP_LASER_DUR = 10;
export const POWERUP_BOSS_WEAPON_DUR = 15;
export const LASER_FIRE_RATE = 0.5; // seconds between shots
export const LASER_SPEED = 8;
export const BOSS_WEAPON_FIRE_RATE = 1.0;

// Colors
export const COLORS = {
  border: '#44ddcc',
  trail: '#00ff88',
  player: '#ffffff',
  playerShield: '#ffd93d',
  background: '#060614',
  claimed: '#0b2535',
  unclaimed: '#06060f',
  hud: '#44ddcc',
  hudGold: '#ffd93d',
  enemy: {
    bouncer: '#ff4433',
    speeder: '#ffcc00',
    shapeshifter: '#cc44ff',
    chaser: '#ff6622',
  },
  bomb: '#ff4444',
  flame: '#ff6600',
  powerup: '#88ffaa',
  powerupRed: '#ff4444',
};

// Game states
export const STATE = {
  MENU: 'menu',
  INTRO: 'intro',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DEATH: 'death',
  COMPLETE: 'complete',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
};
