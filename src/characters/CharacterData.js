export const CHARACTERS = {
  arctic: {
    name: 'Tempête Arctique',
    color: 0x7ecef4,
    hp: 100,
    maxShield: 75,
    speed: 5.5,
    shieldRegen: true,
    abCD: 20,
    ability: 'Blizzard',
    desc: 'Ralentit les ennemis proches avec une tempête de glace'
  },
  desert: {
    name: 'Fils du Désert',
    color: 0xd4a547,
    hp: 90,
    maxShield: 0,
    speed: 7.5,
    shieldRegen: false,
    abCD: 25,
    ability: 'Radar Pulse',
    desc: 'Révèle tous les ennemis sur la minimap pendant 5s'
  },
  cyber: {
    name: 'Tech Striker',
    color: 0x00cfff,
    hp: 100,
    maxShield: 25,
    speed: 6.2,
    shieldRegen: false,
    abCD: 30,
    ability: 'Overclock',
    desc: 'Double la cadence de tir pendant 5s'
  },
  crystal: {
    name: 'Sentinelle',
    color: 0xb799ff,
    hp: 150,
    maxShield: 50,
    speed: 5.0,
    shieldRegen: true,
    abCD: 40,
    ability: 'Bouclier Cristal',
    desc: 'Invincible pendant 3s'
  }
};
