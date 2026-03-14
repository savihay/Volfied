/**
 * Level configurations for all 16 levels.
 * Each level defines: boss, minor enemies, power-up blocks, shield time, background colors.
 */

export const LEVELS = [
  // Level 1 - The Crab
  {
    name: 'The Crab',
    enemies: [
      { type: 'bouncer', r: 8, spd: 1.5 },
      { type: 'bouncer', r: 7, spd: 1.8 },
    ],
    greyBlocks: 4,
    redBlocks: 0,
    shieldTime: 45,
    bgColors: ['#0a2a4a', '#051530'], // ocean
  },
  // Level 2 - The Fly
  {
    name: 'The Fly',
    enemies: [
      { type: 'bouncer', r: 8, spd: 1.8 },
      { type: 'bouncer', r: 7, spd: 2.0 },
      { type: 'bouncer', r: 7, spd: 2.0 },
    ],
    greyBlocks: 4,
    redBlocks: 0,
    shieldTime: 40,
    bgColors: ['#1a3a1a', '#0a200a'], // garden
  },
  // Level 3 - The Spider
  {
    name: 'The Spider',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.0 },
      { type: 'bouncer', r: 7, spd: 2.0 },
      { type: 'speeder', r: 7, spd: 2.5 },
    ],
    greyBlocks: 5,
    redBlocks: 1,
    shieldTime: 40,
    bgColors: ['#2a1a0a', '#150d05'], // cave
  },
  // Level 4 - The Centipede
  {
    name: 'The Centipede',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.0 },
      { type: 'bouncer', r: 7, spd: 2.2 },
      { type: 'speeder', r: 7, spd: 2.5 },
    ],
    greyBlocks: 5,
    redBlocks: 1,
    shieldTime: 35,
    bgColors: ['#0a2a0a', '#051505'], // forest
  },
  // Level 5 - The Nautilus
  {
    name: 'The Nautilus',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.2 },
      { type: 'bouncer', r: 7, spd: 2.2 },
      { type: 'speeder', r: 7, spd: 2.8 },
      { type: 'speeder', r: 6, spd: 3.0 },
    ],
    greyBlocks: 5,
    redBlocks: 1,
    shieldTime: 35,
    bgColors: ['#0a1a3a', '#050d20'], // deep sea
  },
  // Level 6 - Twin Faces (special)
  {
    name: 'Twin Faces',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.2 },
      { type: 'bouncer', r: 7, spd: 2.5 },
      { type: 'bouncer', r: 7, spd: 2.5 },
      { type: 'shapeshifter', r: 10, spd: 1.8 },
    ],
    greyBlocks: 6,
    redBlocks: 1,
    shieldTime: 35,
    bgColors: ['#2a0a2a', '#150515'], // surreal
  },
  // Level 7 - The Hand
  {
    name: 'The Hand',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.5 },
      { type: 'bouncer', r: 7, spd: 2.5 },
      { type: 'speeder', r: 7, spd: 3.0 },
      { type: 'shapeshifter', r: 10, spd: 2.0 },
    ],
    greyBlocks: 5,
    redBlocks: 1,
    shieldTime: 30,
    bgColors: ['#2a2a1a', '#15150a'], // industrial
  },
  // Level 8 - The Ladybug
  {
    name: 'Killer Ladybug',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.5 },
      { type: 'bouncer', r: 7, spd: 2.8 },
      { type: 'speeder', r: 7, spd: 3.0 },
      { type: 'bouncer', r: 7, spd: 2.5 },
    ],
    greyBlocks: 6,
    redBlocks: 1,
    shieldTime: 30,
    bgColors: ['#3a1a1a', '#200a0a'], // garden
  },
  // Level 9 - The Jellyfish
  {
    name: 'The Jellyfish',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.5 },
      { type: 'bouncer', r: 7, spd: 2.5 },
      { type: 'speeder', r: 7, spd: 3.0 },
      { type: 'speeder', r: 6, spd: 3.2 },
    ],
    greyBlocks: 6,
    redBlocks: 1,
    shieldTime: 28,
    bgColors: ['#0a0a2a', '#050515'], // abyss
  },
  // Level 10 - The Scorpion
  {
    name: 'The Scorpion',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.8 },
      { type: 'bouncer', r: 7, spd: 2.8 },
      { type: 'speeder', r: 7, spd: 3.2 },
      { type: 'speeder', r: 6, spd: 3.0 },
      { type: 'shapeshifter', r: 10, spd: 2.2 },
    ],
    greyBlocks: 6,
    redBlocks: 1,
    shieldTime: 25,
    bgColors: ['#3a2a0a', '#201505'], // desert
  },
  // Level 11 - The Wasp
  {
    name: 'The Wasp',
    enemies: [
      { type: 'bouncer', r: 8, spd: 2.8 },
      { type: 'bouncer', r: 7, spd: 3.0 },
      { type: 'speeder', r: 7, spd: 3.2 },
      { type: 'speeder', r: 6, spd: 3.0 },
      { type: 'shapeshifter', r: 10, spd: 2.2 },
    ],
    greyBlocks: 7,
    redBlocks: 1,
    shieldTime: 25,
    bgColors: ['#3a3a0a', '#202005'], // hive
  },
  // Level 12 - The Snake
  {
    name: 'The Snake',
    enemies: [
      { type: 'bouncer', r: 8, spd: 3.0 },
      { type: 'bouncer', r: 7, spd: 3.0 },
      { type: 'speeder', r: 7, spd: 3.5 },
      { type: 'speeder', r: 6, spd: 3.2 },
      { type: 'bouncer', r: 7, spd: 2.8 },
    ],
    greyBlocks: 7,
    redBlocks: 1,
    shieldTime: 22,
    bgColors: ['#0a3a0a', '#051d05'], // jungle
  },
  // Level 13 - The Bat
  {
    name: 'Giant Bat',
    enemies: [
      { type: 'bouncer', r: 8, spd: 3.0 },
      { type: 'bouncer', r: 7, spd: 3.0 },
      { type: 'speeder', r: 7, spd: 3.5 },
      { type: 'speeder', r: 6, spd: 3.5 },
      { type: 'shapeshifter', r: 10, spd: 2.5 },
      { type: 'shapeshifter', r: 9, spd: 2.5 },
    ],
    greyBlocks: 7,
    redBlocks: 1,
    shieldTime: 20,
    bgColors: ['#1a0a2a', '#0d0515'], // night
  },
  // Level 14 - The Alien
  {
    name: 'The Alien',
    enemies: [
      { type: 'bouncer', r: 8, spd: 3.0 },
      { type: 'bouncer', r: 7, spd: 3.2 },
      { type: 'speeder', r: 7, spd: 3.5 },
      { type: 'speeder', r: 6, spd: 3.5 },
      { type: 'shapeshifter', r: 10, spd: 2.5 },
      { type: 'chaser', r: 8, spd: 2.0 },
    ],
    greyBlocks: 8,
    redBlocks: 1,
    shieldTime: 20,
    bgColors: ['#0a2a2a', '#051515'], // alien
  },
  // Level 15 - The Dragon
  {
    name: 'The Dragon',
    enemies: [
      { type: 'bouncer', r: 8, spd: 3.2 },
      { type: 'bouncer', r: 7, spd: 3.2 },
      { type: 'speeder', r: 7, spd: 3.5 },
      { type: 'speeder', r: 6, spd: 3.5 },
      { type: 'shapeshifter', r: 10, spd: 2.5 },
      { type: 'shapeshifter', r: 9, spd: 2.5 },
      { type: 'chaser', r: 8, spd: 2.2 },
    ],
    greyBlocks: 8,
    redBlocks: 1,
    shieldTime: 18,
    bgColors: ['#3a0a0a', '#200505'], // volcanic
  },
  // Level 16 - The Overlord
  {
    name: 'The Overlord',
    enemies: [
      { type: 'bouncer', r: 8, spd: 3.5 },
      { type: 'bouncer', r: 7, spd: 3.5 },
      { type: 'speeder', r: 7, spd: 4.0 },
      { type: 'speeder', r: 6, spd: 3.8 },
      { type: 'shapeshifter', r: 10, spd: 2.8 },
      { type: 'shapeshifter', r: 9, spd: 2.8 },
      { type: 'chaser', r: 8, spd: 2.5 },
      { type: 'chaser', r: 7, spd: 2.5 },
    ],
    greyBlocks: 8,
    redBlocks: 1,
    shieldTime: 15,
    bgColors: ['#1a0a1a', '#0d050d'], // cosmic
  },
];
