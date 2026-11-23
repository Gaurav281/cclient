/**
 * Fire Animation Utility
 * Spectacular high-performance canvas flame & ember burst for Firefly
 * Triggers when tournament scores are submitted!
 */

export function triggerFireAnimation(options = {}) {
  // Prevent duplicate canvases
  const existingCanvas = document.getElementById('firefly-fire-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'firefly-fire-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const flameTongues = [];

  // Color palette for Firefly flames & embers
  // Electric Light Blue, Cyan, Flame Orange, Amber, and Radiant White
  const fireColors = [
    '#38BDF8', // Firefly Light Blue
    '#0EA5E9', // Electric Cyan
    '#7DD3FC', // Bright Sky
    '#F97316', // Hot Flame Orange
    '#FBBF24', // Amber
    '#FFFFFF', // Core White
    '#EF4444', // Red Flame
  ];

  const originX = options.x || width / 2;
  const originY = options.y || height * 0.72;

  // 1. Spawn Flame Tongues (large organic flame shapes shooting up)
  for (let i = 0; i < 18; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 7 + Math.random() * 9;
    flameTongues.push({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 24 + Math.random() * 28,
      grow: 0.98,
      alpha: 0.95,
      decay: 0.02 + Math.random() * 0.015,
      color: fireColors[Math.floor(Math.random() * fireColors.length)],
      wobble: Math.random() * Math.PI * 2,
    });
  }

  // 2. Spawn Fiery Embers & Sparks (drifting and flickering)
  for (let i = 0; i < 90; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
    const speed = 4 + Math.random() * 12;
    particles.push({
      x: originX + (Math.random() - 0.5) * 60,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 6,
      alpha: 1,
      decay: 0.012 + Math.random() * 0.018,
      color: fireColors[Math.floor(Math.random() * fireColors.length)],
      buoyancy: -0.15 - Math.random() * 0.25, // upward heat lift
      drift: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // 3. Central Flash Blast
  let flashAlpha = 0.6;

  let animationFrameId;

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    // Draw Expanding Central Flash
    if (flashAlpha > 0.01) {
      const grad = ctx.createRadialGradient(originX, originY, 10, originX, originY, 140);
      grad.addColorStop(0, `rgba(56, 189, 248, ${flashAlpha * 0.8})`);
      grad.addColorStop(0.5, `rgba(249, 115, 22, ${flashAlpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(originX, originY, 140, 0, Math.PI * 2);
      ctx.fill();
      flashAlpha -= 0.05;
    }

    // Render & Update Flame Tongues
    for (let i = flameTongues.length - 1; i >= 0; i--) {
      const f = flameTongues[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += -0.1; // rise upward
      f.size *= f.grow;
      f.alpha -= f.decay;
      f.wobble += 0.15;
      f.x += Math.sin(f.wobble) * 1.2;

      if (f.alpha <= 0) {
        flameTongues.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, Math.max(1, f.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render & Update Embers
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx + Math.sin(p.phase) * 1.4;
      p.y += p.vy;
      p.vy += p.buoyancy; // accelerates upwards like hot air
      p.vx *= 0.96;
      p.phase += 0.12;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Continue loop until all particles extinguish
    if (particles.length > 0 || flameTongues.length > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);

  // Safety cleanup timeout (3.5 seconds)
  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentElement) {
      canvas.remove();
    }
  }, 3500);
}
