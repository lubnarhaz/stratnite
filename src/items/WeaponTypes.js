export const WEAPONS = {
  laser: {
    name: 'Laser Pistol', icon: '🔫', dmg: 35, rate: 3.5, range: 80,
    ammo: 20, speed: 60, color: 0x00ff88, rar: 'common'
  },
  plasma: {
    name: 'Plasma Rifle', icon: '⚡', dmg: 65, rate: 1.2, range: 120,
    ammo: 20, speed: 55, color: 0x4488ff, rar: 'uncommon'
  },
  pulse: {
    name: 'Pulse SMG', icon: '💫', dmg: 18, rate: 9, range: 50,
    ammo: 45, speed: 65, color: 0xff44aa, rar: 'uncommon'
  },
  rail: {
    name: 'Rail Gun', icon: '🎯', dmg: 145, rate: 0.28, range: 200,
    ammo: 6, speed: 100, color: 0xffaa00, rar: 'rare', pierce: true
  },
  quantum: {
    name: 'Quantum Cannon', icon: '💥', dmg: 100, rate: 0.4, range: 90,
    ammo: 6, speed: 40, color: 0xff44ff, rar: 'legendary', aoe: 8
  },
  shotgun: {
    name: 'Energy Shotgun', icon: '🔥', dmg: 22, rate: 0.7, range: 20,
    ammo: 8, speed: 50, color: 0xff8800, rar: 'uncommon', pellets: 6
  },
  blade: {
    name: 'Plasma Blade', icon: '⚔️', dmg: 90, rate: 2.0, range: 3,
    ammo: -1, speed: 0, color: 0x00ffff, rar: 'rare', melee: true
  },
  grapple: {
    name: 'Gravity Hook', icon: '🌀', dmg: 0, rate: 0.5, range: 200,
    ammo: 5, speed: 80, color: 0x8844ff, rar: 'rare', utility: true
  }
};

const RARITY_WEIGHTS = {
  common: 40,
  uncommon: 30,
  rare: 20,
  legendary: 10
};

export function getRandomWeapon() {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let targetRar = 'common';
  for (const [rar, weight] of Object.entries(RARITY_WEIGHTS)) {
    r -= weight;
    if (r <= 0) { targetRar = rar; break; }
  }
  const candidates = Object.entries(WEAPONS).filter(([, w]) => w.rar === targetRar);
  if (candidates.length === 0) return { id: 'laser', ...WEAPONS.laser };
  const [id, data] = candidates[Math.floor(Math.random() * candidates.length)];
  return { id, ...data, currentAmmo: data.ammo };
}

export const RARITY_COLORS = {
  common: '#aaaaaa',
  uncommon: '#44ff88',
  rare: '#4488ff',
  legendary: '#ff44ff'
};
