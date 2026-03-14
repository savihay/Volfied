# Volfied - Full Implementation Plan

## Table of Contents

1. [Original Game Overview](#1-original-game-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Gap Analysis](#3-gap-analysis)
4. [Game Core Specification](#4-game-core-specification)
5. [Level Design Specification](#5-level-design-specification)
6. [Enemy & Boss Specification](#6-enemy--boss-specification)
7. [Power-Up System Specification](#7-power-up-system-specification)
8. [Architecture Plan](#8-architecture-plan)
9. [Implementation Tasks](#9-implementation-tasks)

---

## 1. Original Game Overview

**Volfied** (1989, Taito) is a territory-claiming arcade game and spiritual successor to Qix. The player pilots a ship called **"Monotros"** across a rectangular playfield, drawing lines to claim territory while avoiding enemies. Each of the **16 levels** features a unique boss creature, minor enemies, and a background image that is progressively revealed as territory is claimed.

### Core Loop

1. Player moves along the safe border of claimed territory
2. Player initiates a "cut" by moving off the border into unclaimed territory
3. A trail/fuse line is drawn behind the player as they move
4. When the trail reconnects to any safe border, the area is claimed
5. The side of the cut containing the **main boss** remains unclaimed; the opposite side is filled
6. Enemies enclosed in the claimed side are destroyed for bonus points
7. Level is complete when **80%** of the playfield is claimed

---

## 2. Current State Analysis

### What Exists (src/volfied.jsx - ~788 lines)

**Working:**
- Single-file React + Canvas 2D implementation (760x480)
- Player movement along polygon contour borders
- Trail drawing when moving off-border (Space + direction)
- Territory capture via polygon splitting (shoelace formula)
- 3 enemy types: Normal (bouncing), Speeder (oscillating speed), Shapeshifter (oscillating radius)
- Bomb/spark system (enemies shoot bombs that become sparks on trail)
- Shield system (4-second post-respawn)
- 5 hardcoded levels with increasing enemy counts
- HUD displaying level, score, area %, lives
- Game states: menu, intro, playing, complete, gameover
- Visual effects: screen shake, capture flash, gradient backgrounds, particle grid

**Not Working / Missing:**
- No boss enemies (the defining feature of Volfied)
- No power-up system
- No power-up blocks on the playfield
- No fuse/flame mechanic (flame racing along trail when enemy hits it)
- No depleting shield timer (current shield is just post-respawn invulnerability)
- No progressive background image reveal
- No boss-side determination for territory claiming
- Only 5 levels instead of 16
- No unique level backgrounds
- No sound effects or music
- No pause functionality
- No speed difference between border movement and cutting movement
- No laser weapon mechanic
- Trail can go diagonal (original is strictly 4-directional / orthogonal only)
- No grey blocks / red-light blocks on playfield
- Enemies don't have proper attack patterns
- No multi-kill exponential bonus scoring

---

## 3. Gap Analysis

### Critical Gaps (must fix - these define Volfied vs generic Qix clone)

| # | Feature | Current | Required |
|---|---------|---------|----------|
| 1 | Boss enemies | None | 1 unique boss per level with attack patterns |
| 2 | Boss-side territory claiming | Keeps larger polygon | Must keep the side NOT containing the boss |
| 3 | Power-up system | None | 6 power-up types in collectible blocks |
| 4 | Fuse/flame mechanic | Sparks travel along trail | Flame races toward player when trail is hit |
| 5 | Shield timer | 4s post-respawn only | Continuously depleting timer; border unsafe when empty |
| 6 | Movement model | Free diagonal movement | Strictly 4-directional (up/down/left/right only) |
| 7 | Speed differential | Same speed everywhere | Slower when cutting, faster on border |
| 8 | Background reveal | Gradient + grid | Level-specific image revealed as territory is claimed |
| 9 | Level count | 5 levels | 16 levels with unique bosses and backgrounds |
| 10 | Power-up blocks | None | Grey blocks and red-light blocks on playfield |

### Important Gaps (high impact on feel)

| # | Feature | Current | Required |
|---|---------|---------|----------|
| 11 | Sound effects | None | Cut start, capture, enemy hit, death, boss attack, power-up |
| 12 | Music | None | Level background music |
| 13 | Pause | None | Pause/resume functionality |
| 14 | Scoring system | Basic area + kill points | Area bonus, speed bonus, multi-kill exponential bonus |
| 15 | Enemy enclosure kills | Enemies outside new contour die | Enemies on claimed side destroyed with visual feedback |
| 16 | Laser weapon | None | Shoot enemies while on border (L power-up) |
| 17 | Player ship visual | Simple triangle | Proper ship sprite with directional rotation |

### Nice-to-Have Gaps

| # | Feature | Current | Required |
|---|---------|---------|----------|
| 18 | High score persistence | None | LocalStorage high scores |
| 19 | Two-player alternating | None | Players take turns |
| 20 | Difficulty settings | None | 4 difficulty ranks (A-D) |
| 21 | Mobile/touch support | None | Touch controls for mobile |

---

## 4. Game Core Specification

### 4.1 Playfield

- **Dimensions:** 760x480 pixels (logical game area, exclude HUD)
- **HUD area:** Top bar (40px height) showing: Level, Score, Shield Timer, Area %, Lives, Active Power-up
- **Game area:** 760x440 pixels below HUD
- **Coordinate system:** (0,0) at top-left of game area
- **Initial border:** Thin rectangular border around the full game area (the starting "safe zone")
- **Claimed territory:** Filled with the level's background image (masked/clipped to claimed polygon)
- **Unclaimed territory:** Dark area where enemies roam

### 4.2 Player (Monotros Ship)

**States:**
- `ON_BORDER` - Moving along any safe border edge. Protected by shield (if active).
- `CUTTING` - Moving through unclaimed territory, drawing a trail. Fully vulnerable.
- `DEAD` - Death animation playing, awaiting respawn.

**Movement:**
- **4-directional only** - up, down, left, right. No diagonals.
- **Border speed:** 4 px/frame
- **Cutting speed:** 2.5 px/frame (noticeably slower)
- **Speed power-up bonus:** +50% to both speeds
- **Input:** Arrow keys or WASD for direction. A dedicated key (Space or auto-detect) to initiate cutting when moving off-border.

**Border Movement Rules:**
- Player can move freely along any segment of the claimed territory border
- Player cannot move through unclaimed territory unless initiating a cut
- Player "snaps" to the nearest border point when approaching from a cut

**Cutting Rules:**
- Cut begins when the player moves off the border into unclaimed territory
- A trail of points is recorded behind the player (orthogonal segments only)
- The trail is rendered as a visible line (green/cyan glow)
- Cut completes when the trail reconnects to ANY safe border segment
- If the player reverses direction along their own trail, they retrace (don't create a parallel line)
- **Self-intersection: instant death**

**Death Conditions:**
1. Enemy (boss or minor) touches the player while cutting
2. Enemy touches the player on the border AND shield is depleted
3. Flame/fuse reaches the player along the trail
4. Player's trail self-intersects
5. Shield timer reaches zero while an enemy is adjacent on the border

**Respawn:**
- Player respawns at a safe position on the border (bottom-left corner or a random border edge)
- Brief invulnerability period (2 seconds)
- Trail is cleared on death
- No territory is lost on death

### 4.3 Shield System

- **Initial value:** ~30 seconds per level (displayed as a countdown bar or number)
- **Depletion:** Continuously counts down at 1 unit/second regardless of player state
- **Effect:** While shield > 0 and player is ON_BORDER, enemies cannot kill the player on contact
- **When depleted:** Player becomes vulnerable even on the border - any enemy contact kills
- **P power-up:** Pauses the shield countdown for ~10 seconds
- **Visual:** Shield bar in HUD + glowing aura around ship when active

### 4.4 Territory Claiming Algorithm

**Current approach (polygon splitting) needs modification:**

1. Player completes a cut (trail reconnects to border)
2. The trail + existing border segments form two potential regions
3. **Determine which region contains the boss enemy**
4. **Keep the boss's region as unclaimed** (this is the opposite of current "keep larger" logic)
5. The other region becomes newly claimed territory
6. All minor enemies in the newly claimed region are destroyed (bonus points)
7. Power-up blocks in the newly claimed region are collected
8. Update the border: newly claimed edges become safe border segments
9. Recalculate area percentage

**Area calculation:**
- `progress = claimed_area / total_playfield_area`
- Display as percentage in HUD
- Level complete when `progress >= 0.80` (80%)

### 4.5 Fuse/Flame Mechanic

This is a key Volfied mechanic that differs from simple "trail destroyed" behavior:

1. An enemy (boss or minor) touches the player's active trail line
2. A **flame/fireball** spawns at the point of contact
3. The flame travels along the trail **toward the player** at high speed (~6 px/frame)
4. The trail segments behind the flame are destroyed/burned away
5. If the flame reaches the player → **death**
6. The player can survive by reaching the border before the flame catches up
7. This creates dramatic "racing back to safety" moments

**Visual:** Bright orange/red fireball with particle trail, burning/dissolving the trail line behind it.

### 4.6 Scoring System

| Action | Points |
|--------|--------|
| Territory claimed | `percentage_claimed * 1000` per cut |
| Minor enemy enclosed | 500 per enemy |
| Multi-kill bonus | Exponential: 500, 1500, 4500, 13500... (×3 per additional enemy) |
| Boss damaged | 2000 per hit |
| Boss killed | 10000 |
| Level completion | 5000 base + bonus for excess area over 80% |
| Speed bonus | Faster cuts earn multiplier (1.0x to 2.0x) |
| Power-up collected | 100 per block |

### 4.7 Lives System

- **Starting lives:** 3
- **Extra life:** Every 50,000 points
- **Max lives display:** 5 (heart icons)
- **Game over:** When lives reach 0 and player dies

### 4.8 Input Controls

| Key | Action |
|-----|--------|
| Arrow Up / W | Move up |
| Arrow Down / S | Move down |
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire laser (when on border with L power-up) |
| P / Escape | Pause/Resume |
| Enter | Start game / Confirm |

**Movement priority:** Vertical input takes priority over horizontal (if both pressed, vertical wins). This matches the original arcade behavior.

---

## 5. Level Design Specification

### 5.1 Level Structure

Each level consists of:
- **Background image:** Unique artwork revealed as territory is claimed
- **Boss enemy:** One main boss with specific attack patterns and movement
- **Minor enemies:** 2-6 smaller enemies that bounce and attack
- **Power-up blocks:** 3-8 grey blocks placed strategically in the playfield
- **Red-light block:** 0-1 special block containing the boss-killing weapon
- **Shield time:** Starting shield duration (decreases in later levels)
- **Area requirement:** 80% for all levels

### 5.2 Level Definitions

#### Level 1 - "The Crab"
- **Boss:** Giant crab/lobster - slow movement, sweeping claw attacks
- **Boss behavior:** Moves in wide arcs, periodically lunges toward nearest border
- **Boss attacks:** Shoots 2 projectiles in a V-pattern every 3 seconds
- **Minor enemies:** 2x basic bouncers (slow, small radius)
- **Power-up blocks:** 4 grey blocks (corners), 0 red blocks
- **Shield time:** 45 seconds
- **Background:** Ocean/underwater scene

#### Level 2 - "The Fly"
- **Boss:** Giant fly - faster movement, erratic patterns
- **Boss behavior:** Quick darting movements with sudden direction changes
- **Boss attacks:** Drops 1 projectile downward every 2 seconds
- **Minor enemies:** 3x basic bouncers (medium speed)
- **Power-up blocks:** 4 grey blocks, 0 red blocks
- **Shield time:** 40 seconds
- **Background:** Garden/nature scene

#### Level 3 - "The Spider"
- **Boss:** Spider - weaves toward player's trail
- **Boss behavior:** Attracted to the player's active trail; moves toward it when cutting
- **Boss attacks:** Shoots web projectiles (slower but wider hitbox) every 4 seconds
- **Minor enemies:** 3x bouncers + 1x speeder
- **Power-up blocks:** 5 grey blocks, 1 red block
- **Shield time:** 40 seconds
- **Background:** Cave/dungeon scene

#### Level 4 - "The Centipede"
- **Boss:** Centipede - long segmented body, follows curved paths
- **Boss behavior:** Moves in sine-wave patterns; body segments follow head path
- **Boss attacks:** Head segment fires 1 projectile toward player every 2.5 seconds
- **Minor enemies:** 3x bouncers + 1x speeder
- **Power-up blocks:** 5 grey blocks, 1 red block
- **Shield time:** 35 seconds
- **Background:** Forest scene

#### Level 5 - "The Nautilus"
- **Boss:** Nautilus/shell creature - spiral movement patterns
- **Boss behavior:** Moves in expanding/contracting spiral patterns
- **Boss attacks:** Fires projectiles outward in 4 cardinal directions every 3 seconds
- **Minor enemies:** 3x bouncers + 2x speeders
- **Power-up blocks:** 5 grey blocks, 1 red block
- **Shield time:** 35 seconds
- **Background:** Deep sea scene

#### Level 6 - "The Twin Faces" (Special level)
- **Boss:** TWO separate face entities
- **Boss behavior:** Each moves independently; they try to stay near each other
- **Boss attacks:** Each fires 1 projectile toward player every 3 seconds
- **Special mechanic:** If both bosses are separated into different regions by a territory claim, both are instantly killed and the level is complete regardless of area percentage
- **Minor enemies:** 4x bouncers
- **Power-up blocks:** 6 grey blocks, 1 red block
- **Shield time:** 35 seconds
- **Background:** Abstract/surreal scene

#### Level 7 - "The Hand"
- **Boss:** Giant hand - reaches and grabs toward player
- **Boss behavior:** Fingers extend toward the player's position; palm moves slowly
- **Boss attacks:** "Finger flick" - shoots fast narrow projectiles every 2 seconds
- **Minor enemies:** 3x bouncers + 1x speeder + 1x shapeshifter
- **Power-up blocks:** 5 grey blocks, 1 red block
- **Shield time:** 30 seconds
- **Background:** Mechanical/industrial scene

#### Level 8 - "The Ladybug"
- **Boss:** Killer ladybug - fast, aggressive, spreadshot attacks
- **Boss behavior:** Very fast movement; actively chases the player
- **Boss attacks:** Fires 5 projectiles in a spread pattern every 2.5 seconds
- **Minor enemies:** 4x bouncers + 1x speeder
- **Power-up blocks:** 6 grey blocks, 1 red block
- **Shield time:** 30 seconds
- **Background:** Flower garden scene

#### Level 9 - "The Jellyfish"
- **Boss:** Giant jellyfish - drifting movement with tentacle attacks
- **Boss behavior:** Slow drifting movement; tentacles extend downward
- **Boss attacks:** Tentacle lash - fires 3 projectiles downward in a line every 3 seconds
- **Minor enemies:** 4x bouncers + 2x speeders
- **Power-up blocks:** 6 grey blocks, 1 red block
- **Shield time:** 28 seconds
- **Background:** Abyss/deep water scene

#### Level 10 - "The Scorpion"
- **Boss:** Scorpion - tail strikes and pincer movements
- **Boss behavior:** Moves in straight lines, pauses, then strikes with tail
- **Boss attacks:** Tail strike fires 2 fast projectiles toward player every 2 seconds
- **Minor enemies:** 4x bouncers + 2x speeders + 1x shapeshifter
- **Power-up blocks:** 6 grey blocks, 1 red block
- **Shield time:** 25 seconds
- **Background:** Desert scene

#### Level 11 - "The Wasp"
- **Boss:** Giant wasp - very fast, dive-bomb attacks
- **Boss behavior:** Circles around the unclaimed area, periodically dive-bombs toward the player
- **Boss attacks:** Stinger shot - 1 fast projectile during dive every 2 seconds
- **Minor enemies:** 4x bouncers + 2x speeders + 1x shapeshifter
- **Power-up blocks:** 7 grey blocks, 1 red block
- **Shield time:** 25 seconds
- **Background:** Hive/colony scene

#### Level 12 - "The Snake"
- **Boss:** Long snake - coils and strikes
- **Boss behavior:** Coils in circular patterns; lunges toward player periodically
- **Boss attacks:** Lunges + spits 2 projectiles mid-lunge
- **Minor enemies:** 5x bouncers + 2x speeders
- **Power-up blocks:** 7 grey blocks, 1 red block
- **Shield time:** 22 seconds
- **Background:** Jungle scene

#### Level 13 - "The Bat"
- **Boss:** Giant bat - swooping attacks from edges
- **Boss behavior:** Rapidly moves across the playfield in sweeping arcs
- **Boss attacks:** Sonic wave - 3 projectiles in an arc every 2 seconds
- **Minor enemies:** 4x bouncers + 2x speeders + 2x shapeshifters
- **Power-up blocks:** 7 grey blocks, 1 red block
- **Shield time:** 20 seconds
- **Background:** Night sky scene

#### Level 14 - "The Alien"
- **Boss:** Alien creature - teleportation and multi-directional attacks
- **Boss behavior:** Periodically teleports to a random location in unclaimed area
- **Boss attacks:** After teleporting, fires 8 projectiles radially (all directions)
- **Minor enemies:** 5x bouncers + 2x speeders + 1x shapeshifter
- **Power-up blocks:** 8 grey blocks, 1 red block
- **Shield time:** 20 seconds
- **Background:** Space/alien landscape

#### Level 15 - "The Dragon"
- **Boss:** Dragon - fire breath and flying patterns
- **Boss behavior:** Flies in figure-8 patterns; charges when player is cutting
- **Boss attacks:** Fire breath - stream of 4 projectiles in rapid succession every 3 seconds
- **Minor enemies:** 5x bouncers + 2x speeders + 2x shapeshifters
- **Power-up blocks:** 8 grey blocks, 1 red block
- **Shield time:** 18 seconds
- **Background:** Volcanic scene

#### Level 16 - "The Final Form"
- **Boss:** Ultimate alien/demon - combines multiple attack patterns
- **Boss behavior:** Phases: slow patrol → aggressive chase → teleport → repeat
- **Boss attacks:** Phase 1: 2 projectiles every 3s. Phase 2: 4 projectiles spread every 2s. Phase 3: 8 radial projectiles after teleport.
- **Minor enemies:** 5x bouncers + 3x speeders + 2x shapeshifters
- **Power-up blocks:** 8 grey blocks, 1 red block
- **Shield time:** 15 seconds
- **Background:** Final abstract/cosmic scene

### 5.3 Difficulty Scaling Across Levels

| Parameter | Level 1 | Level 8 | Level 16 |
|-----------|---------|---------|----------|
| Minor enemies | 2 | 5 | 10 |
| Enemy base speed | 1.5 | 2.5 | 3.5 |
| Boss speed | 1.0 | 2.0 | 3.0 |
| Boss attack interval | 3.0s | 2.5s | 2.0s |
| Boss projectile count | 2 | 5 | 4-8 (varies by phase) |
| Shield duration | 45s | 30s | 15s |
| Power-up blocks | 4 | 6 | 8 |

---

## 6. Enemy & Boss Specification

### 6.1 Minor Enemy Types

#### Type A: Bouncer (Basic)
- **Visual:** Small colored circle (red/orange), radius 8px
- **Movement:** Linear movement with random initial velocity; bounces off borders (reflect velocity component)
- **Speed:** 1.5 - 3.0 px/frame (increases with level)
- **Direction changes:** ~2% chance per frame to slightly adjust angle
- **Collision:** Kills player on contact (if player is vulnerable)
- **Trail interaction:** Contact with player's trail triggers flame mechanic

#### Type B: Speeder
- **Visual:** Small gold/yellow circle, radius 7px, speed lines when fast
- **Movement:** Same as Bouncer but speed oscillates between baseSpeed and baseSpeed×2
- **Speed oscillation:** Accelerates by 0.04/frame up to max, then decelerates back
- **Collision:** Same as Bouncer
- **Trail interaction:** Same as Bouncer (more dangerous due to unpredictable speed)

#### Type C: Shapeshifter
- **Visual:** Purple circle, radius oscillates between 3px and 12px
- **Movement:** Same as Bouncer at base speed
- **Size oscillation:** Grows/shrinks by 0.12px per frame
- **Collision:** Same as Bouncer (harder to dodge due to size changes)
- **Trail interaction:** Same as Bouncer

#### Type D: Chaser (new type for later levels)
- **Visual:** Red-orange circle with arrow indicator, radius 9px
- **Movement:** Actively steers toward player position (not direct line - gradual turn)
- **Speed:** 1.2 - 2.0 px/frame
- **Turn rate:** 2-3 degrees per frame toward player
- **Collision:** Same as Bouncer
- **Trail interaction:** Same as Bouncer

### 6.2 Boss Enemy Architecture

Each boss has:
- **Position:** {x, y} in the unclaimed area
- **Hitbox:** Defined polygon or circle (larger than minor enemies: 20-40px radius)
- **Health:** Only damaged by the boss weapon (red-light block power-up); 3-5 hits to kill
- **Movement pattern:** Unique per boss (defined in level spec)
- **Attack pattern:** Fires projectiles on a timer with specific patterns
- **Attack telegraph:** Visual cue 0.5-1.0 seconds before attacking (flash, wind-up animation)
- **Vulnerability:** Can be enclosed by territory claims (but usually hard due to size/movement)
- **Death:** Explodes with visual effect when health reaches 0 OR when enclosed by territory claim

### 6.3 Boss Attack Projectiles

- **Speed:** 3-5 px/frame (varies by boss)
- **Size:** 4-6px radius
- **Lifetime:** 3-5 seconds or until hitting a border
- **Trail interaction:** Hitting the player's trail triggers the flame mechanic
- **Player interaction:** Direct hit kills the player
- **Visual:** Colored energy ball matching boss theme color with glow effect

### 6.4 Enemy Spawning

- Minor enemies spawn at random positions within the unclaimed area at level start
- Minimum distance from player: 100px
- Minimum distance from borders: 30px
- Enemies must be inside the unclaimed contour
- Boss spawns at center of the playfield

---

## 7. Power-Up System Specification

### 7.1 Power-Up Blocks

**Grey Blocks:**
- **Appearance:** Small grey square (16x16px) with a letter icon indicating the power-up type
- **Placement:** Scattered across the unclaimed playfield at level start
- **Collection:** When territory is claimed around a block (block ends up in claimed area), the power-up activates
- **Power-up type:** Randomized from the pool (S, T, P, L, C) at level start
- **Visual:** Pulsing glow effect to attract attention; letter visible on block

**Red-Light Blocks:**
- **Appearance:** Red glowing square (16x16px) with a special icon
- **Placement:** Usually 1 per level (starting from level 3), positioned in a risky area
- **Collection:** Same as grey blocks (claim territory around it)
- **Power-up:** Always the Boss Weapon
- **Visual:** Bright red pulsing glow, more prominent than grey blocks

### 7.2 Power-Up Types

#### S - Speed Boost
- **Duration:** 8 seconds
- **Effect:** Player movement speed increased by 50% (both border and cutting)
- **Visual:** Blue speed lines emanating from player ship
- **HUD:** "SPEED" indicator with countdown bar
- **Strategy:** Allows faster cuts and safer escapes from flames

#### T - Time Freeze
- **Duration:** 5 seconds
- **Effect:** All enemies (boss + minors) freeze in place; projectiles also freeze
- **Visual:** Blue/white tint over entire playfield; frozen enemies have ice crystal overlay
- **HUD:** "FREEZE" indicator with countdown bar
- **Strategy:** Create safe windows for large territory claims

#### P - Shield Pause
- **Duration:** 10 seconds
- **Effect:** Shield timer stops counting down
- **Visual:** Golden shield around HUD shield bar
- **HUD:** Shield bar turns gold; "PAUSE" text
- **Strategy:** Extends the safe period for border movement

#### L - Laser Weapon
- **Duration:** 10 seconds
- **Effect:** Player can fire a laser projectile while on the border (Space key)
- **Laser properties:** Travels in the direction player is facing, speed 8 px/frame, destroys minor enemies on contact
- **Fire rate:** 1 shot per 0.5 seconds
- **Visual:** Cyan/white laser bolt; destroyed enemies explode in particles
- **HUD:** "LASER" indicator with countdown bar
- **Strategy:** Clear minor enemies without risking cuts; does NOT damage boss

#### C - Clear Screen
- **Duration:** Instant
- **Effect:** All minor enemies currently on screen are instantly destroyed
- **Visual:** White flash across unclaimed area; all minor enemies explode simultaneously
- **HUD:** Brief "CLEAR!" text flash
- **Note:** Does NOT affect the boss; does NOT affect enemies that spawn in later waves
- **Strategy:** Use when many enemies make cutting too dangerous

#### Boss Weapon (Red Block)
- **Duration:** 15 seconds
- **Effect:** Player's laser is replaced with a boss-damaging weapon
- **Weapon properties:** Fires while on border; projectile damages boss for 1 HP per hit
- **Fire rate:** 1 shot per 1.0 seconds
- **Boss HP:** 3-5 depending on level
- **Visual:** Red/orange energy bolt; boss flashes white when hit
- **HUD:** "BOSS WEAPON" indicator with countdown bar
- **Strategy:** The only way to directly kill the boss (alternative: enclose boss in claimed territory)

### 7.3 Power-Up Interaction Rules

- Only one active power-up at a time (collecting a new one replaces the current)
- Exception: Shield Pause (P) can stack with any other power-up since it affects a different system
- Power-up blocks are visible from the start of the level
- Uncollected blocks persist until the area around them is claimed
- Blocks that end up in the boss's side of a cut are NOT collected (they remain unclaimed)

---

## 8. Architecture Plan

### 8.1 File Structure

```
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Top-level component with game canvas
├── game/
│   ├── Game.js                 # Main game class (state machine, game loop)
│   ├── constants.js            # All game constants and configuration
│   ├── input.js                # Keyboard input handler
│   ├── entities/
│   │   ├── Player.js           # Player ship (movement, state, trail)
│   │   ├── Enemy.js            # Base minor enemy class
│   │   ├── Bouncer.js          # Basic bouncing enemy
│   │   ├── Speeder.js          # Speed-oscillating enemy
│   │   ├── Shapeshifter.js     # Size-oscillating enemy
│   │   ├── Chaser.js           # Player-tracking enemy
│   │   ├── Boss.js             # Base boss class
│   │   ├── Projectile.js       # Enemy/boss projectiles
│   │   ├── Flame.js            # Fuse flame that travels along trail
│   │   └── PowerUpBlock.js     # Grey/red power-up block entity
│   ├── systems/
│   │   ├── Territory.js        # Territory claiming, contour management, area calc
│   │   ├── Collision.js        # All collision detection
│   │   ├── Shield.js           # Shield timer system
│   │   ├── PowerUp.js          # Active power-up management
│   │   ├── Scoring.js          # Score tracking and bonus calculations
│   │   └── Camera.js           # Screen shake and effects
│   ├── levels/
│   │   ├── LevelManager.js     # Level loading and progression
│   │   ├── levelData.js        # All 16 level configurations
│   │   └── bosses/
│   │       ├── CrabBoss.js     # Level 1 boss
│   │       ├── FlyBoss.js      # Level 2 boss
│   │       ├── SpiderBoss.js   # Level 3 boss
│   │       ├── ...             # Levels 4-16 bosses
│   │       └── FinalBoss.js    # Level 16 boss
│   ├── rendering/
│   │   ├── Renderer.js         # Main canvas renderer
│   │   ├── HUD.js              # Score, lives, shield, power-up display
│   │   ├── Background.js       # Level background image reveal
│   │   ├── Effects.js          # Particles, flash, explosions
│   │   └── Screens.js          # Menu, pause, game over, level complete
│   └── geometry/
│       ├── polygon.js          # Polygon operations (area, split, contains)
│       ├── intersection.js     # Line/segment intersection tests
│       └── snap.js             # Point-to-contour snapping
├── assets/
│   ├── backgrounds/            # 16 level background images
│   ├── sprites/                # Player, enemy, boss sprites (or generated)
│   └── sounds/                 # Sound effects and music
└── hooks/
    └── useGame.js              # React hook connecting Game to Canvas
```

### 8.2 Game Loop Architecture

```
┌─────────────────────────────────────────┐
│              Game.tick(dt)               │
├─────────────────────────────────────────┤
│ 1. Input.read()                         │
│ 2. Shield.update(dt)                    │
│ 3. PowerUp.update(dt)                   │
│ 4. Player.update(dt, input)             │
│    ├── Move on border OR                │
│    ├── Move while cutting (extend trail)│
│    └── Check trail self-intersection    │
│ 5. Boss.update(dt, playerPos)           │
│    ├── Movement pattern                 │
│    └── Attack pattern (spawn projectiles│
│ 6. Enemies[].update(dt)                 │
│    ├── Movement (bounce/speed/shape)    │
│    └── Trail proximity check            │
│ 7. Projectiles[].update(dt)             │
│    └── Movement toward target           │
│ 8. Flames[].update(dt)                  │
│    └── Travel along trail toward player │
│ 9. Collision.check()                    │
│    ├── Player vs enemies                │
│    ├── Player vs projectiles            │
│    ├── Player vs flame                  │
│    ├── Trail vs enemies                 │
│    ├── Trail vs projectiles             │
│    ├── Laser vs enemies                 │
│    └── Laser vs boss                    │
│ 10. Territory.checkCapture()            │
│     ├── Split contour if trail complete │
│     ├── Determine boss side             │
│     ├── Claim opposite side             │
│     ├── Kill enclosed enemies           │
│     ├── Collect enclosed power-ups      │
│     └── Check win condition (≥80%)      │
│ 11. Scoring.update()                    │
│ 12. Renderer.draw(gameState)            │
└─────────────────────────────────────────┘
```

### 8.3 State Machine

```
MENU ──[Enter]──> LEVEL_INTRO ──[2.5s]──> PLAYING
                                              │
                            ┌─────────────────┤
                            │                 │
                      [lives > 0]        [lives == 0]
                            │                 │
                         DEATH ──[2s]──> GAME_OVER ──[Enter]──> MENU
                            │
                      [respawn]──> PLAYING

PLAYING ──[area >= 80%]──> LEVEL_COMPLETE ──[3s]──> LEVEL_INTRO (next)
                                                        │
PLAYING ──[Esc/P]──> PAUSED ──[Esc/P]──> PLAYING  [level 16 done]
                                                        │
                                                   VICTORY ──[Enter]──> MENU
```

---

## 9. Implementation Tasks

### Phase 0: Project Setup & Refactoring
> Break the monolithic volfied.jsx into a clean architecture

- [x] **T0.1** Create the directory structure (`game/`, `game/entities/`, `game/systems/`, `game/levels/`, `game/rendering/`, `game/geometry/`)
- [x] **T0.2** Extract geometry utilities into `game/geometry.js`
- [x] **T0.3** Extract constants into `game/constants.js` (FW, FH, speeds, colors, tolerances, etc.)
- [x] **T0.4** Create `game/input.js` - keyboard + touch input handler
- [x] **T0.5** Create `game/Game.js` - main game class with state machine and game loop
- [x] **T0.6** Game instantiated directly in `App.jsx` (no separate hook needed)
- [x] **T0.7** Create `App.jsx` - replace volfied.jsx with clean component
- [x] **T0.8** Verified refactored code runs and builds

### Phase 1: Core Mechanics Fixes
> Fix fundamental gameplay to match original Volfied

- [x] **T1.1** **4-directional movement only** - Strict up/down/left/right with vertical priority
- [x] **T1.2** **Speed differential** - Border 3.5px/frame, cutting 2.2px/frame
- [x] **T1.3** **Shield timer system** - Continuously depleting timer per level, shown in HUD
- [x] **T1.4** **Boss-side territory claiming** - Uses robust multi-point boss containment check + enemy proximity fallback
- [x] **T1.5** **Fuse/flame mechanic** - Flame races along trail toward player, burning trail behind it
- [x] **T1.6** **Trail retrace** - Player can backtrack along their own trail to undo segments
- [x] **T1.7** **Pause functionality** - Escape/P toggles pause with overlay
- [x] **T1.8** **Improved respawn** - Bottom-most border position with 2-second invulnerability

### Phase 2: Entity System
> Build proper entity classes

- [x] **T2.1** Player state managed in Game.js (ON_BORDER, CUTTING, DEAD)
- [x] **T2.2** `Enemy.js` base class with bouncing, trail collision
- [x] **T2.3** `Bouncer` (Enemy subclass) - random direction changes
- [x] **T2.4** `Speeder` (Enemy subclass) - oscillating speed
- [x] **T2.5** `Shapeshifter` (Enemy subclass) - oscillating radius
- [x] **T2.6** `Chaser` (Enemy subclass) - gradual steering toward player
- [x] **T2.7** `Projectile.js` + `LaserBolt` - projectiles with velocity, lifetime
- [x] **T2.8** `Flame.js` - travels along trail points with burn tracking
- [x] **T2.9** `PowerUpBlock.js` - grey/red blocks with pulsing animation

### Phase 3: Boss System
> Implement boss enemies - the defining feature of Volfied

- [x] **T3.1** `Boss.js` base class with HP, telegraph, attack timer, movement interface
- [x] **T3.2** Boss movement pattern system (override `movePattern()`)
- [x] **T3.3** Boss attack pattern system with telegraph cue (0.7s warning flash)
- [x] **T3.4** Boss damage: hit flash, death on HP=0
- [x] **T3.5** Boss containment via territory claim (pointInPoly check)
- [x] **T3.6** `CrabBoss` (Level 1) - arcing movement, V-pattern shots
- [x] **T3.7** `FlyBoss` (Level 2) - erratic darting, downward drops
- [x] **T3.8** `SpiderBoss` (Level 3) - trail-attracted, wide web projectiles
- [x] **T3.9** `CentipedeBoss` (Level 4) - segmented body, sine-wave path
- [x] **T3.10** `NautilusBoss` (Level 5) - spiral movement, 4-directional shots
- [x] **T3.11** `TwinFacesBoss` (Level 6) - dual entities, separation kill mechanic
- [x] **T3.12** `HandBoss` (Level 7) - finger extension, fast narrow projectiles
- [x] **T3.13** `LadybugBoss` (Level 8) - fast chase, 5-spread shots
- [x] **T3.14** `JellyfishBoss` (Level 9) - drifting, 3 downward tentacle shots
- [x] **T3.15** `ScorpionBoss` (Level 10) - strike pause, fast dual projectiles
- [x] **T3.16** `WaspBoss` (Level 11) - circling + dive-bombs
- [x] **T3.17** `SnakeBoss` (Level 12) - coiling + lunging, segmented body
- [x] **T3.18** `BatBoss` (Level 13) - sweeping arcs, 3-arc shots
- [x] **T3.19** `AlienBoss` (Level 14) - teleportation, 8-directional radial
- [x] **T3.20** `DragonBoss` (Level 15) - figure-8, fire breath stream
- [x] **T3.21** `FinalBoss` (Level 16) - multi-phase patrol/chase/teleport

### Phase 4: Power-Up System
> Add collectible power-ups in blocks

- [x] **T4.1** Power-up state management in Game.js (active type, timer, activation/deactivation)
- [x] **T4.2** Power-up block placement per level (random positions with margin)
- [x] **T4.3** Power-up collection on territory claim (blocks in captured area → activate)
- [x] **T4.4** **Speed Boost (S)** - 8s, +50% movement speed
- [x] **T4.5** **Time Freeze (T)** - 5s, freeze all enemies and projectiles
- [x] **T4.6** **Shield Pause (P)** - 10s, pause shield countdown
- [x] **T4.7** **Laser Weapon (L)** - 10s, fire laser from border
- [x] **T4.8** **Clear Screen (C)** - instant kill all minor enemies
- [x] **T4.9** **Boss Weapon (red block)** - 15s, fire boss-damaging projectile
- [x] **T4.10** Power-up HUD indicator with countdown in React overlay
- [x] **T4.11** Stacking rules: P stacks with any, others replace current

### Phase 5: Territory & Rendering System
> Proper territory visualization with background reveal

- [x] **T5.1** Procedural background generation (cached offscreen canvas per level)
- [x] **T5.2** Progressive background reveal via canvas clipping (claimed area shows background)
- [x] **T5.3** Unclaimed territory: dark fill with subtle dot grid
- [x] **T5.4** 16 unique procedural backgrounds (circles, diamonds, stars, rings per level theme)
- [x] **T5.5** Territory capture flash effect
- [x] **T5.6** Enemy enclosure kill (enemies outside new contour removed with score popup)
- [x] **T5.7** Power-up blocks: pulsing glow + letter icons
- [x] **T5.8** Red-light blocks: distinct red glow appearance

### Phase 6: Level System
> Complete 16-level progression

- [x] **T6.1** `levelData.js` with all 16 level configurations
- [x] **T6.2** Level loading, initialization, and progression in Game.js
- [x] **T6.3** Level intro screen with level number, boss name
- [x] **T6.4** Level complete screen with territory % and score
- [x] **T6.5** Victory screen after level 16
- [x] **T6.6** Difficulty scaling: enemy speeds, shield time, boss attack intervals scale with level

### Phase 7: Scoring & HUD
> Complete scoring system and heads-up display

- [x] **T7.1** Score tracking in Game.js
- [x] **T7.2** Area claim scoring: proportional to percentage gained
- [x] **T7.3** Multi-kill exponential bonus: 500 × 3^n
- [x] **T7.4** *(Deferred)* Speed bonus
- [x] **T7.5** Level completion bonus: 5000 + excess area bonus
- [x] **T7.6** Extra life every 50,000 points
- [x] **T7.7** HUD in React: level, score, area %, lives, shield bar, power-up indicator, boss HP
- [x] **T7.8** Floating score popups (+500, 1UP!, etc.)
- [x] **T7.9** High score persistence with localStorage (top 10, shown on menu)

### Phase 8: Visual Polish
> Updated graphics while keeping the Volfied feel

- [x] **T8.1** Player ship with directional rotation
- [x] **T8.2** Enemy types: gradient circles with type-specific effects (speed lines, size pulse, arrow)
- [x] **T8.3** Boss visuals: radial gradient bodies, aura, telegraph flash, HP bar, segment rendering
- [x] **T8.4** Particle effects: flash on capture, shake on death
- [x] **T8.5** Screen shake on death
- [x] **T8.6** Boss telegraph: flashing white ring before attack
- [x] **T8.7** Trail rendering: glowing green line with endpoint marker
- [x] **T8.8** Flame visual: orange/yellow/white layered fire effect with trail burn
- [x] **T8.9** Contour border: cyan glow with shadow blur

### Phase 9: Audio
> Sound effects and music

- [x] **T9.1** AudioManager with Web Audio API synthesis, volume control, mute toggle (M key + button)
- [x] **T9.2** Sound effects: cutStart, cutComplete, territoryClaim, enemyDeath, playerDeath, bossHit, bossDeath, powerUpCollect, flameTraveling, laserFire, levelComplete, gameOver, menuSelect, bossTelegraph
- [ ] **T9.3** Background music (deferred - procedural music generation is complex)
- [x] **T9.4** All sounds generated via Web Audio API oscillators and buffers
- [x] **T9.5** Mute button in footer + M keyboard shortcut

### Phase 10: UI & Screens
> Menu, pause, and transition screens

- [x] **T10.1** Main menu with title, start prompt, controls reference, high scores
- [x] **T10.2** High scores displayed on menu screen (top 3)
- [x] **T10.3** Pause overlay with resume instructions
- [ ] **T10.4** Smooth screen transitions (fade in/out)
- [x] **T10.5** Controls shown on menu screen
- [x] **T10.6** Game over screen with score and level reached

---

## Summary

**Total tasks: ~105 | Completed: ~90 | Remaining: ~15**

| Phase | Description | Tasks | Status |
|-------|-------------|-------|--------|
| 0 | Project Setup & Refactoring | 8 | DONE |
| 1 | Core Mechanics Fixes | 8 | DONE |
| 2 | Entity System | 9 | DONE |
| 3 | Boss System | 21 | DONE |
| 4 | Power-Up System | 11 | DONE |
| 5 | Territory & Rendering | 8 | DONE |
| 6 | Level System | 6 | DONE |
| 7 | Scoring & HUD | 9 | DONE |
| 8 | Visual Polish | 9 | DONE |
| 9 | Audio | 5 | 4/5 DONE (music deferred) |
| 10 | UI & Screens | 6 | 5/6 DONE |
| 11 | Polish & Balance | 8 | 2/8 DONE |

**Remaining work:** Background music, screen transitions, playtesting/balancing, deployment
