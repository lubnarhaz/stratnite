export class Minimap {
  constructor() {
    this.size = 160;
    this.scale = this.size / 512;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cssText = `
      position: absolute; top: 12px; right: 12px;
      width: ${this.size}px; height: ${this.size}px;
      border: 1px solid rgba(0,255,204,0.3);
      border-radius: 4px;
      background: rgba(10,10,26,0.8);
      pointer-events: none;
    `;
    this.ctx = this.canvas.getContext('2d');
  }

  update(player, bots, chests, storm, radarActive) {
    const ctx = this.ctx;
    const s = this.size;
    const half = s / 2;
    const scale = this.scale;

    ctx.clearRect(0, 0, s, s);

    // Background
    ctx.fillStyle = 'rgba(10,10,26,0.9)';
    ctx.fillRect(0, 0, s, s);

    // Storm circle
    if (storm) {
      ctx.beginPath();
      ctx.arc(
        half + storm.center.x * scale,
        half + storm.center.z * scale,
        storm.radius * scale,
        0, Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(68,102,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill outside storm
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, s, s);
      ctx.arc(
        half + storm.center.x * scale,
        half + storm.center.z * scale,
        storm.radius * scale,
        0, Math.PI * 2, true
      );
      ctx.fillStyle = 'rgba(68,102,255,0.15)';
      ctx.fill();
      ctx.restore();
    }

    // Chests
    if (chests) {
      for (const chest of chests) {
        if (chest.opened) continue;
        const cx = half + chest.getPosition().x * scale;
        const cz = half + chest.getPosition().z * scale;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 1.5, cz - 1.5, 3, 3);
      }
    }

    // Bots
    if (bots) {
      for (const bot of bots) {
        if (!bot.alive) continue;
        const bx = half + bot.body.position.x * scale;
        const bz = half + bot.body.position.z * scale;
        if (radarActive) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(bx, bz, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Only show nearby bots
          if (player) {
            const dx = bot.body.position.x - player.body.position.x;
            const dz = bot.body.position.z - player.body.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < 30) {
              ctx.fillStyle = '#ff4444';
              ctx.beginPath();
              ctx.arc(bx, bz, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // Player
    if (player && player.alive) {
      const px = half + player.body.position.x * scale;
      const pz = half + player.body.position.z * scale;

      // Direction arrow
      const angle = player.theta || 0;
      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(-angle);
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-3, 3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  getElement() {
    return this.canvas;
  }
}
