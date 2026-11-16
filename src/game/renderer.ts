import { ARENA, PLAYER_STATS, POWER_INFO } from './characters';
import {
  BallDesign,
  BallState,
  CharacterDef,
  CharacterExpression,
  FloatingBanner,
  GoalNetImpulse,
  GraphicsQuality,
  Particle,
  PlayerActionState,
  PlayerState,
  PowerType,
  StadiumTheme,
} from './types';

const OUTLINE = '#0f172a';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export interface StadiumScoreboardInfo {
  p1Score: number;
  p2Score: number;
  clockText: string;
  label?: string;
}

export function drawStadiumBackground(
  ctx: CanvasRenderingContext2D,
  time: number,
  crowdBounce: number,
  netImpulse: GoalNetImpulse,
  theme: StadiumTheme = 'night',
  quality: GraphicsQuality = 'high',
  isOvertime = false,
  tensionLevel = 0,
  scoreboard?: StadiumScoreboardInfo
) {
  const W = ARENA.width;
  const H = ARENA.height;
  const groundY = ARENA.groundY;

  // 1. Sky / Dome Backdrop per Stadium Identity
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 340);
  if (isOvertime) {
    skyGrad.addColorStop(0, '#09090b');
    skyGrad.addColorStop(0.5, '#3b0764');
    skyGrad.addColorStop(1, '#7c2d12');
  } else if (theme === 'international') {
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.55, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
  } else if (theme === 'indoor') {
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.55, '#1e293b');
    skyGrad.addColorStop(1, '#334155');
  } else if (theme === 'futuristic') {
    skyGrad.addColorStop(0, '#050816');
    skyGrad.addColorStop(0.5, '#1e1b4b');
    skyGrad.addColorStop(0.85, '#0f766e');
    skyGrad.addColorStop(1, '#06b6d4');
  } else {
    // night stadium
    skyGrad.addColorStop(0, '#06102c');
    skyGrad.addColorStop(0.55, '#112e73');
    skyGrad.addColorStop(1, '#1d4ed8');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, 340);

  // Theme-specific upper architecture / atmosphere
  if (theme === 'international' && !isOvertime) {
    // Sunlit clouds & warm horizon glow
    const sunGrad = ctx.createRadialGradient(W * 0.78, 56, 8, W * 0.78, 56, 150);
    sunGrad.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
    sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.28)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(W * 0.55, 0, W * 0.45, 220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 360 + time * 10) % (W + 240)) - 120;
      const cy = 50 + (i % 2) * 28;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 8, 28, 0, Math.PI * 2);
      ctx.arc(cx + 48, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'indoor') {
    // Enclosed architectural dome roof ribs & spotlights
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 4;
    for (let r = 0; r < 9; r++) {
      const rx = 80 + r * 140;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.quadraticCurveTo(W / 2, 72, W - rx, 145);
      ctx.stroke();
    }
    if (quality === 'high') {
      for (const sx of [260, 640, 1020]) {
        const spot = ctx.createLinearGradient(sx, 20, sx, groundY);
        spot.addColorStop(0, 'rgba(254, 243, 199, 0.16)');
        spot.addColorStop(1, 'rgba(254, 243, 199, 0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.moveTo(sx - 28, 18);
        ctx.lineTo(sx + 28, 18);
        ctx.lineTo(sx + 175, groundY);
        ctx.lineTo(sx - 175, groundY);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (theme === 'futuristic') {
    // Cyber aurora beams & glowing geometric canopy grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
    ctx.lineWidth = 1.6;
    for (let x = 0; x <= W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(W / 2 + (x - W / 2) * 0.72, 145);
      ctx.stroke();
    }
    for (let y = 26; y <= 120; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  // Stadium floodlight volumetric beams (night, futuristic, or overtime)
  if (quality === 'high' && (theme === 'night' || theme === 'futuristic' || isOvertime)) {
    ctx.save();
    for (const fx of [108, 1172]) {
      const beamAlpha = isOvertime ? 0.34 : 0.22 + tensionLevel * 0.1;
      const beamColor = isOvertime
        ? `rgba(250, 204, 21, ${beamAlpha})`
        : theme === 'futuristic'
        ? `rgba(34, 211, 238, ${beamAlpha})`
        : `rgba(186, 230, 253, ${beamAlpha})`;
      const beamGrad = ctx.createLinearGradient(fx, 40, fx < 640 ? 520 : 760, groundY);
      beamGrad.addColorStop(0, beamColor);
      beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(fx - 38, 40);
      ctx.lineTo(fx + 38, 40);
      ctx.lineTo(fx < 640 ? 600 : 1245, groundY);
      ctx.lineTo(fx < 640 ? 35 : 680, groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Stadium roof arch
  ctx.fillStyle =
    theme === 'international'
      ? '#1e293b'
      : theme === 'indoor'
      ? '#0f172a'
      : theme === 'futuristic'
      ? '#090d24'
      : '#0c1b44';
  ctx.beginPath();
  ctx.moveTo(0, 122);
  ctx.quadraticCurveTo(W / 2, 46, W, 122);
  ctx.lineTo(W, 200);
  ctx.lineTo(0, 200);
  ctx.closePath();
  ctx.fill();

  if (theme === 'futuristic') {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 122);
    ctx.quadraticCurveTo(W / 2, 46, W, 122);
    ctx.stroke();
  }

  // Floodlight towers / Indoor Light Pods
  for (const fx of [92, 1188]) {
    ctx.fillStyle = theme === 'futuristic' ? '#0f172a' : '#1e293b';
    ctx.strokeStyle = theme === 'futuristic' ? '#22d3ee' : OUTLINE;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, fx - 44, 22, 88, 42, 8);
    ctx.fill();
    ctx.stroke();

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle =
          theme === 'international'
            ? '#cbd5e1'
            : theme === 'futuristic'
            ? '#67e8f9'
            : theme === 'indoor'
            ? '#fde68a'
            : '#fef9c3';
        ctx.beginPath();
        ctx.arc(fx - 27 + col * 18, 34 + row * 16, 5.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Stadium Stands & Animated Spectators
  const standGrad = ctx.createLinearGradient(0, 145, 0, 445);
  if (theme === 'international') {
    standGrad.addColorStop(0, '#1e3a5f');
    standGrad.addColorStop(1, '#334155');
  } else if (theme === 'indoor') {
    standGrad.addColorStop(0, '#18181b');
    standGrad.addColorStop(1, '#27272a');
  } else if (theme === 'futuristic') {
    standGrad.addColorStop(0, '#0f172a');
    standGrad.addColorStop(1, '#1e1b4b');
  } else {
    standGrad.addColorStop(0, '#0f204b');
    standGrad.addColorStop(1, '#1b3578');
  }
  ctx.fillStyle = standGrad;
  ctx.fillRect(0, 145, W, 300);

  ctx.fillStyle = theme === 'futuristic' ? '#06b6d4' : '#091433';
  ctx.globalAlpha = theme === 'futuristic' ? 0.32 : 1;
  ctx.fillRect(0, 255, W, 10);
  ctx.fillRect(0, 360, W, 10);
  ctx.globalAlpha = 1;

  const shirtColors =
    theme === 'futuristic'
      ? ['#22d3ee', '#a855f7', '#f472b6', '#38bdf8', '#facc15', '#e2e8f0']
      : ['#ef4444', '#38bdf8', '#facc15', '#22c55e', '#f97316', '#f8fafc', '#a855f7'];
  const skinColors = ['#f0bfa0', '#d49d74', '#9d6847', '#f6d2bc', '#7c4c33'];
  const colStep = quality === 'high' ? 26 : 36;
  const colCount = Math.ceil(W / colStep);

  for (let row = 0; row < 6; row++) {
    const baseY = row < 3 ? 172 + row * 22 : 284 + (row - 3) * 24;
    for (let col = 0; col < colCount; col++) {
      const seed = row * 73 + col * 31;
      const cx = 14 + col * colStep + (row % 2) * 11;
      // Leave clean space behind the central electronic stadium scoreboard
      if (row >= 1 && row <= 3 && cx > W / 2 - 140 && cx < W / 2 + 140) continue;
      const wave =
        Math.sin(time * (3.5 + crowdBounce * 6) + col * 0.35 + seed * 0.1) *
        (1.4 + crowdBounce * 6);
      const cy = baseY + wave;

      ctx.fillStyle = shirtColors[seed % shirtColors.length];
      ctx.beginPath();
      ctx.arc(cx, cy + 9, 8.5, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = skinColors[(seed * 3) % skinColors.length];
      ctx.beginPath();
      ctx.arc(cx, cy, 5.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Animated Electronic Stadium Scoreboard in center upper fascia
  {
    const sbW = 248;
    const sbH = 66;
    const sbX = W / 2 - sbW / 2;
    const sbY = 178;
    ctx.save();
    ctx.fillStyle = theme === 'futuristic' ? '#090d24' : '#0b132b';
    ctx.strokeStyle = theme === 'futuristic' ? '#22d3ee' : '#38bdf8';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, sbX, sbY, sbW, sbH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    drawRoundedRect(ctx, sbX + 6, sbY + 6, sbW - 12, sbH - 12, 6);
    ctx.fill();

    ctx.font = '900 10px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme === 'futuristic' ? '#67e8f9' : '#93c5fd';
    ctx.fillText(scoreboard?.label || 'SUPER HEAD ARENA · LIVE 1V1', W / 2, sbY + 18);

    const p1S = scoreboard ? scoreboard.p1Score : 0;
    const p2S = scoreboard ? scoreboard.p2Score : 0;
    const clk = scoreboard ? scoreboard.clockText : '1V1';
    ctx.font = '900 23px "Arial Black", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(String(p1S), W / 2 - 74, sbY + 46);
    ctx.fillStyle = '#facc15';
    ctx.font = '900 16px "Arial Black", sans-serif';
    ctx.fillText(clk, W / 2, sbY + 45);
    ctx.font = '900 23px "Arial Black", sans-serif';
    ctx.fillStyle = '#fb7185';
    ctx.fillText(String(p2S), W / 2 + 74, sbY + 46);
    ctx.restore();
  }

  // Stadium camera flashbulbs during intense moments, goals & sudden death
  if (quality === 'high' && (crowdBounce > 0.35 || tensionLevel > 0.55)) {
    const flashCount = crowdBounce > 0.7 ? 10 : 4;
    for (let f = 0; f < flashCount; f++) {
      const bucket = Math.floor(time * 7 + f * 3.1);
      if ((bucket + f) % 3 === 0) {
        const fx = ((bucket * 173 + f * 257) % (W - 80)) + 40;
        const fy = 165 + ((bucket * 89 + f * 43) % 210);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Stadium LED Advertising Boards
  const boardY = 420;
  ctx.fillStyle = theme === 'futuristic' ? '#020617' : '#0b132b';
  ctx.fillRect(0, boardY, W, 38);
  const ads =
    theme === 'futuristic'
      ? [
          { text: 'HYPER TURF', bg: '#0e7490', fg: '#ecfeff' },
          { text: 'CYBER CUP 1V1', bg: '#4c1d95', fg: '#f0abfc' },
          { text: 'NEON CLEATS', bg: '#047857', fg: '#a7f3d0' },
          { text: 'PULSE ARENA', bg: '#1d4ed8', fg: '#e0f2fe' },
          { text: 'AERO SPIN', bg: '#be185d', fg: '#fce7f3' },
          { text: 'VOLT TECH', bg: '#0f766e', fg: '#fef08a' },
          { text: 'HYPER TURF', bg: '#1e1b4b', fg: '#22d3ee' },
          { text: 'CYBER CUP 1V1', bg: '#0369a1', fg: '#ffffff' },
        ]
      : [
          { text: 'APEX SPORT', bg: '#1d4ed8', fg: '#ffffff' },
          { text: 'NOVA ENERGY', bg: '#dc2626', fg: '#fef08a' },
          { text: 'STRIKER PRO', bg: '#059669', fg: '#ffffff' },
          { text: 'VOLT CLEATS', bg: '#d97706', fg: '#0f172a' },
          { text: 'KICKOFF TV', bg: '#7c3aed', fg: '#ffffff' },
          { text: 'AERO BALL', bg: '#0284c7', fg: '#ffffff' },
          { text: 'APEX SPORT', bg: '#1e293b', fg: '#38bdf8' },
          { text: 'STRIKER PRO', bg: '#b91c1c', fg: '#ffffff' },
        ];
  for (let i = 0; i < ads.length; i++) {
    const ax = i * 160;
    const ad = ads[i];
    ctx.fillStyle = ad.bg;
    ctx.fillRect(ax + 3, boardY + 4, 154, 30);
    ctx.fillStyle = ad.fg;
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ad.text, ax + 80, boardY + 19);
  }

  // 3. Detailed Grass Turf
  const turfTop = 458;
  const turfGrad = ctx.createLinearGradient(0, turfTop, 0, H);
  if (theme === 'international') {
    turfGrad.addColorStop(0, '#16a34a');
    turfGrad.addColorStop(0.45, '#22c55e');
    turfGrad.addColorStop(1, '#15803d');
  } else if (theme === 'indoor') {
    turfGrad.addColorStop(0, '#15803d');
    turfGrad.addColorStop(0.5, '#16a34a');
    turfGrad.addColorStop(1, '#14532d');
  } else if (theme === 'futuristic') {
    turfGrad.addColorStop(0, '#047857');
    turfGrad.addColorStop(0.5, '#0d9488');
    turfGrad.addColorStop(1, '#064e3b');
  } else {
    turfGrad.addColorStop(0, '#16a34a');
    turfGrad.addColorStop(0.45, '#22c55e');
    turfGrad.addColorStop(1, '#15803d');
  }
  ctx.fillStyle = turfGrad;
  ctx.fillRect(0, turfTop, W, H - turfTop);

  const stripeCount = 12;
  const stripeW = W / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = theme === 'futuristic' ? 'rgba(34, 211, 238, 0.06)' : 'rgba(255, 255, 255, 0.065)';
      ctx.fillRect(i * stripeW, turfTop, stripeW, H - turfTop);
    }
  }

  if (theme === 'futuristic') {
    ctx.fillStyle = 'rgba(34, 211, 238, 0.48)';
    ctx.fillRect(0, turfTop, W, 3);
  }

  if (quality === 'high') {
    ctx.fillStyle = 'rgba(6, 78, 59, 0.14)';
    for (let gx = 12; gx < W; gx += 34) {
      for (let gy = turfTop + 10; gy < H - 10; gy += 22) {
        const offset = ((gx * 13 + gy * 7) % 15) - 7;
        ctx.fillRect(gx + offset, gy, 2, 5);
      }
    }
  }

  // Pitch Markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(ARENA.leftGoalLineX, turfTop + 18);
  ctx.lineTo(ARENA.rightGoalLineX, turfTop + 18);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(W, groundY + 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W / 2, turfTop + 18);
  ctx.lineTo(W / 2, groundY + 2);
  ctx.stroke();

  const centerY = (turfTop + 18 + groundY) / 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, centerY, 108, 35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W / 2, centerY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(ARENA.leftGoalLineX, turfTop + 24);
  ctx.lineTo(ARENA.leftGoalLineX + 140, turfTop + 24);
  ctx.lineTo(ARENA.leftGoalLineX + 195, groundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ARENA.leftGoalLineX, turfTop + 56);
  ctx.lineTo(ARENA.leftGoalLineX + 64, turfTop + 56);
  ctx.lineTo(ARENA.leftGoalLineX + 86, groundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ARENA.rightGoalLineX, turfTop + 24);
  ctx.lineTo(ARENA.rightGoalLineX - 140, turfTop + 24);
  ctx.lineTo(ARENA.rightGoalLineX - 195, groundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ARENA.rightGoalLineX, turfTop + 56);
  ctx.lineTo(ARENA.rightGoalLineX - 64, turfTop + 56);
  ctx.lineTo(ARENA.rightGoalLineX - 86, groundY);
  ctx.stroke();

  const apronGrad = ctx.createLinearGradient(0, groundY + 4, 0, H);
  apronGrad.addColorStop(0, 'rgba(6, 78, 59, 0.25)');
  apronGrad.addColorStop(1, 'rgba(6, 78, 59, 0.56)');
  ctx.fillStyle = apronGrad;
  ctx.fillRect(0, groundY + 4, W, H - groundY - 4);

  drawGoalBack(ctx, 'left', netImpulse.leftRipple, netImpulse.leftY);
  drawGoalBack(ctx, 'right', netImpulse.rightRipple, netImpulse.rightY);
}

function drawGoalBack(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  ripple: number,
  impactY: number
) {
  const isLeft = side === 'left';
  const frontX = isLeft ? ARENA.leftGoalLineX : ARENA.rightGoalLineX;
  const backX = isLeft ? ARENA.leftWallX : ARENA.rightWallX;
  const topY = ARENA.goalTopY;
  const botY = ARENA.groundY;
  const bulge = Math.sin(ripple * 24) * ripple * (isLeft ? -22 : 22);

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.beginPath();
  ctx.moveTo(frontX, topY);
  ctx.lineTo(backX, topY + 14);
  ctx.lineTo(backX, botY);
  ctx.lineTo(frontX, botY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.58)';
  ctx.lineWidth = 1.8;

  const cols = 8;
  for (let i = 0; i <= cols; i++) {
    const t = i / cols;
    const xPos = frontX + (backX - frontX) * t;
    ctx.beginPath();
    ctx.moveTo(xPos, topY + t * 14);
    ctx.quadraticCurveTo(xPos + bulge * t, impactY, xPos, botY);
    ctx.stroke();
  }

  const rows = 10;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const yFront = topY + (botY - topY) * t;
    const yBack = topY + 14 + (botY - topY - 14) * t;
    ctx.beginPath();
    ctx.moveTo(frontX, yFront);
    ctx.quadraticCurveTo((frontX + backX) / 2 + bulge, (yFront + yBack) / 2, backX + bulge * 0.5, yBack);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGoalPostsForeground(ctx: CanvasRenderingContext2D) {
  for (const side of ['left', 'right'] as const) {
    const isLeft = side === 'left';
    const frontX = isLeft ? ARENA.leftGoalLineX : ARENA.rightGoalLineX;
    const backX = isLeft ? ARENA.leftWallX : ARENA.rightWallX;
    const topY = ARENA.goalTopY;
    const botY = ARENA.groundY;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(backX, topY + 14);
    ctx.lineTo(backX, botY);
    ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(frontX, topY);
    ctx.lineTo(backX, topY + 14);
    ctx.stroke();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(frontX, topY);
    ctx.lineTo(frontX, botY);
    ctx.stroke();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 9;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(frontX, topY, ARENA.goalCrossbarRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  opts: {
    x: number;
    y: number;
    facing: 1 | -1;
    scale?: number;
    vx?: number;
    onGround?: boolean;
    runPhase?: number;
    actionState?: PlayerActionState;
    kickTimer?: number;
    kickDuration?: number;
    landTimer?: number;
    tackleTimer?: number;
    turnTimer?: number;
    fallTimer?: number;
    isDefending?: boolean;
    timedBlockTimer?: number;
    isChargingPower?: boolean;
    holdTimer?: number;
    headNodTimer?: number;
    feintTimer?: number;
    expression?: CharacterExpression;
    celebratePhase?: number;
    frozen?: boolean;
    stunned?: boolean;
    specialReadyPower?: PowerType | null;
    isChargingSpecial?: boolean;
    specialPrimed?: boolean;
    time?: number;
  }
) {
  const {
    x,
    y,
    facing,
    scale = 1,
    vx = 0,
    onGround = true,
    runPhase = 0,
    actionState = 'idle',
    kickTimer = 0,
    kickDuration = 0.23,
    landTimer = 0,
    tackleTimer = 0,
    turnTimer = 0,
    fallTimer = 0,
    isDefending = false,
    timedBlockTimer = 0,
    isChargingPower = false,
    holdTimer = 0,
    headNodTimer = 0,
    feintTimer = 0,
    expression = 'normal',
    celebratePhase = 0,
    frozen = false,
    stunned = false,
    specialReadyPower = null,
    isChargingSpecial = false,
    specialPrimed = false,
    time = 0,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const speedRatio = Math.min(1.12, Math.abs(vx) / PLAYER_STATS.moveSpeed);
  const isMoving = onGround && speedRatio > 0.06 && tackleTimer <= 0;
  const landSquash = landTimer > 0 ? Math.sin((landTimer / 0.14) * Math.PI) * 5.5 : 0;
  const breathScale = !isMoving && onGround && kickTimer <= 0 ? 1 + Math.sin(time * 2.8) * 0.014 : 1;

  let bob = 0;
  if (expression === 'happy') {
    const bounceRate = def.celebrationStyle === 'leap_pump' ? 7 : 5.5;
    bob = Math.abs(Math.sin(celebratePhase * bounceRate)) * -10;
  } else if (tackleTimer > 0) {
    bob = 16;
  } else if (isDefending) {
    bob = 6;
  } else if (isMoving) {
    bob = Math.abs(Math.sin(runPhase * 2)) * -4.2;
  } else if (onGround) {
    bob = Math.sin(time * 2.8) * 1.4 + landSquash;
  }

  // Special ready / charging aura
  if (specialReadyPower && (isChargingSpecial || specialPrimed)) {
    const pInfo = POWER_INFO[specialReadyPower];
    const pulse = 1 + Math.sin(time * 16) * 0.07;
    ctx.save();
    ctx.translate(0, -64);
    ctx.scale(pulse, pulse);
    const auraGrad = ctx.createRadialGradient(0, 0, 14, 0, 0, 74);
    auraGrad.addColorStop(0, pInfo.secondary + 'aa');
    auraGrad.addColorStop(0.6, pInfo.color + '55');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pInfo.secondary;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -time * 90;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Defensive shield ring feedback (gold-cyan gleam during Timed Block parry window!)
  if (isDefending) {
    const isParryActive = timedBlockTimer > 0;
    ctx.save();
    ctx.strokeStyle = isParryActive ? 'rgba(250, 204, 21, 0.92)' : 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = isParryActive ? 4.5 : 3.5;
    ctx.beginPath();
    ctx.arc(facing * 8, -54, isParryActive ? 47 : 44, -Math.PI * 0.44, Math.PI * 0.44, facing < 0);
    ctx.stroke();
    ctx.restore();
  }

  // Power Shot boot charge arc (highlights golden sweet-spot timing window!)
  if (isChargingPower || isChargingSpecial) {
    const chargeMax = isChargingSpecial
      ? PLAYER_STATS.specialHoldThreshold
      : PLAYER_STATS.powerAutoFireThreshold;
    const chargeRatio = Math.min(1, Math.max(0.08, holdTimer / Math.max(0.01, chargeMax)));
    const inPerfectWindow =
      holdTimer >= PLAYER_STATS.perfectTimingMin && holdTimer <= PLAYER_STATS.perfectTimingMax;
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, -14, 19, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = inPerfectWindow
      ? '#fde047'
      : isChargingSpecial
      ? '#38bdf8'
      : 'rgba(251, 191, 36, 0.9)';
    ctx.lineWidth = inPerfectWindow ? 4 : 3;
    ctx.beginPath();
    ctx.arc(0, -14, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
    ctx.stroke();
    ctx.restore();
  }

  // Facing flip + turn/feint squash + breathing
  const turnScale = feintTimer > 0 ? 0.84 : turnTimer > 0 ? 0.88 : 1;
  ctx.scale(facing * turnScale, breathScale);

  const kickProgress =
    kickTimer > 0 ? Math.max(0, Math.min(1, 1 - kickTimer / Math.max(0.01, kickDuration))) : 0;
  // Snap immediately into full impact extension on strike frame, then follow through cleanly
  const kickWave =
    kickTimer > 0
      ? kickProgress < 0.32
        ? 0.85 + (kickProgress / 0.32) * 0.15
        : Math.max(0, 1 - (kickProgress - 0.32) / 0.68)
      : 0;

  // Body lean based on athletic action state & power windup
  if (fallTimer > 0) {
    ctx.translate(0, -12);
    ctx.rotate(-0.62);
  } else if (tackleTimer > 0) {
    ctx.rotate(-0.52);
  } else if (actionState === 'kick_emergency') {
    ctx.rotate(0.28);
  } else if (stunned) {
    ctx.rotate(Math.sin(time * 32) * 0.12);
  } else if (expression === 'sad') {
    ctx.rotate(0.06);
  } else if (isChargingPower || isChargingSpecial) {
    ctx.rotate(-0.15);
  } else if (actionState === 'brake') {
    ctx.rotate(-0.12);
  } else if (actionState === 'kick_volley') {
    ctx.rotate(-0.28);
  } else if (actionState === 'kick_curved') {
    ctx.rotate(-0.16);
  } else if (kickTimer > 0) {
    ctx.rotate(-0.1 * kickWave);
  } else if (isMoving) {
    ctx.rotate(0.08 * speedRatio);
  }

  // Kinematic Joint Angles
  let backThigh = 0;
  let backKnee = 0;
  let frontThigh = 0;
  let frontKnee = 0;
  let backArm = 0.22;
  let frontArm = -0.22;

  if (tackleTimer > 0) {
    frontThigh = -1.15;
    frontKnee = 0.08;
    backThigh = 0.52;
    backKnee = 0.85;
    backArm = -0.9;
    frontArm = 0.65;
  } else if (kickTimer > 0) {
    const k = kickWave;
    if (actionState === 'kick_emergency') {
      frontThigh = -1.2 * k;
      frontKnee = 0.1;
      backThigh = 0.45 * k;
      backKnee = 0.4;
    } else if (actionState === 'kick_low') {
      frontThigh = -0.85 * k;
      frontKnee = 0.15;
      backThigh = 0.25 * k;
      backKnee = 0.25;
    } else if (actionState === 'kick_curved') {
      frontThigh = -1.42 * k;
      frontKnee = 0.22 * (1 - k);
      backThigh = 0.36 * k;
      backKnee = 0.34;
    } else if (actionState === 'kick_high' || actionState === 'kick_volley') {
      frontThigh = -1.65 * k;
      frontKnee = 0.2 * (1 - k);
      backThigh = 0.4 * k;
      backKnee = 0.3;
    } else {
      frontThigh = -1.35 * k;
      frontKnee = 0.35 * (1 - k);
      backThigh = 0.28 * k;
      backKnee = 0.2;
    }
    backArm = -0.8 * k;
    frontArm = 0.85 * k;
  } else if (isChargingPower || isChargingSpecial) {
    frontThigh = 0.72;
    frontKnee = 0.85;
    backThigh = -0.18;
    backKnee = 0.18;
    backArm = 0.55;
    frontArm = -0.75;
  } else if (isDefending) {
    frontThigh = -0.35;
    frontKnee = 0.6;
    backThigh = 0.32;
    backKnee = 0.55;
    backArm = -1.15;
    frontArm = -0.95;
  } else if (!onGround) {
    if (actionState === 'fall') {
      frontThigh = -0.28;
      frontKnee = 0.35;
      backThigh = 0.18;
      backKnee = 0.3;
      backArm = -1.25;
      frontArm = -1.05;
    } else {
      frontThigh = -0.58;
      frontKnee = 0.72;
      backThigh = 0.32;
      backKnee = 0.45;
      backArm = -0.95;
      frontArm = -0.65;
    }
  } else if (landTimer > 0) {
    const l = landSquash / 5.5;
    frontThigh = -0.28 * l;
    frontKnee = 0.48 * l;
    backThigh = 0.22 * l;
    backKnee = 0.38 * l;
  } else if (isMoving) {
    const s = Math.sin(runPhase);
    frontThigh = s * 0.7 * speedRatio;
    frontKnee = Math.max(0, -s * 0.65 * speedRatio) + 0.14;
    backThigh = -s * 0.7 * speedRatio;
    backKnee = Math.max(0, s * 0.65 * speedRatio) + 0.14;
    backArm = -s * 0.7 * speedRatio;
    frontArm = s * 0.7 * speedRatio;
  } else if (expression === 'happy') {
    const wave = Math.sin(celebratePhase * 9);
    if (def.celebrationStyle === 'cross_arms') {
      backArm = -0.92;
      frontArm = 0.92;
    } else if (def.celebrationStyle === 'dance_wave') {
      backArm = -2.1 + wave * 0.55;
      frontArm = -1.55 - wave * 0.55;
    } else if (def.celebrationStyle === 'fist_roar') {
      backArm = 0.35;
      frontArm = -2.55 + Math.sin(celebratePhase * 12) * 0.18;
    } else if (def.celebrationStyle === 'leap_pump') {
      backArm = -1.9 + wave * 0.25;
      frontArm = -2.35 - wave * 0.25;
      frontThigh = -0.35;
      backThigh = 0.35;
    } else {
      backArm = -2.35 + wave * 0.22;
      frontArm = -2.5 - wave * 0.22;
    }
  } else if (expression === 'sad') {
    backArm = 0.46;
    frontArm = 0.54;
  } else {
    // Subtle character-specific idle personality
    const sway = Math.sin(time * 2.8);
    if (def.celebrationStyle === 'cross_arms') {
      backArm = 0.14;
      frontArm = -0.36;
    } else if (def.celebrationStyle === 'dance_wave') {
      backArm = 0.28 + sway * 0.12;
      frontArm = -0.28 - sway * 0.12;
    } else if (def.celebrationStyle === 'fist_roar') {
      backArm = 0.32;
      frontArm = -0.42;
      frontThigh = -0.08;
      backThigh = 0.08;
    } else if (def.celebrationStyle === 'leap_pump') {
      frontThigh = -0.1;
      backThigh = 0.1;
      backArm = 0.26;
      frontArm = -0.26;
    }
  }

  // 1. Back Leg
  drawArticulatedLeg(ctx, -6, -30 + bob * 0.45, backThigh, backKnee, def, true);

  // 2. Back Arm
  drawArticulatedArm(ctx, -12, -64 + bob, backArm, def, true);

  // 3. Athletic Torso (Shorts + Jersey + Neck)
  ctx.save();
  ctx.translate(0, bob);

  // Shorts
  ctx.fillStyle = def.shortsColor;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.3;
  drawRoundedRect(ctx, -15, -38, 30, 18, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-14, -37, 8, 16);

  // Jersey Torso with 3D cylindrical folds & shading
  ctx.save();
  drawRoundedRect(ctx, -17, -70, 34, 36, 7);
  ctx.fillStyle = def.jerseyPrimary;
  ctx.fill();
  ctx.clip();

  if (def.kitPattern === 'stripes') {
    ctx.fillStyle = def.jerseySecondary;
    ctx.fillRect(-12, -70, 6.5, 36);
    ctx.fillRect(1.5, -70, 6.5, 36);
  } else if (def.kitPattern === 'split') {
    ctx.fillStyle = def.jerseySecondary;
    ctx.fillRect(0, -70, 18, 36);
  } else if (def.kitPattern === 'sash') {
    ctx.fillStyle = def.jerseySecondary;
    ctx.beginPath();
    ctx.moveTo(-18, -70);
    ctx.lineTo(-7, -70);
    ctx.lineTo(18, -34);
    ctx.lineTo(7, -34);
    ctx.closePath();
    ctx.fill();
  } else if (def.kitPattern === 'trim') {
    ctx.fillStyle = def.jerseySecondary;
    ctx.fillRect(-17, -70, 34, 6);
    ctx.fillStyle = def.jerseyAccent;
    ctx.fillRect(-17, -38, 34, 4);
  }

  // 3D fabric shadow + chest fold crease
  const jerseyShade = ctx.createLinearGradient(-17, 0, 17, 0);
  jerseyShade.addColorStop(0, 'rgba(0, 0, 0, 0.26)');
  jerseyShade.addColorStop(0.35, 'rgba(255, 255, 255, 0.08)');
  jerseyShade.addColorStop(0.7, 'rgba(255, 255, 255, 0.14)');
  jerseyShade.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = jerseyShade;
  ctx.fillRect(-17, -70, 34, 36);

  ctx.fillStyle = def.skinShadow;
  ctx.beginPath();
  ctx.moveTo(-6, -70);
  ctx.lineTo(6, -70);
  ctx.lineTo(1, -63);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.4;
  drawRoundedRect(ctx, -17, -70, 34, 36, 7);
  ctx.stroke();

  // Jersey number
  ctx.save();
  ctx.scale(facing, 1);
  const lightKit =
    def.kitPattern === 'stripes' ||
    def.jerseyPrimary === '#f8fafc' ||
    def.jerseyPrimary === '#f1f5f9' ||
    def.jerseyPrimary === '#facc15';
  ctx.fillStyle = lightKit ? '#0f172a' : '#ffffff';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.number, 0, -50);
  ctx.restore();

  // Athletic Neck
  ctx.fillStyle = def.skinShadow;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.1;
  drawRoundedRect(ctx, -5.5, -78, 11, 10, 3);
  ctx.fill();
  ctx.stroke();

  ctx.restore(); // end torso bob

  // 4. Front Leg
  drawArticulatedLeg(ctx, 6, -30 + bob * 0.45, frontThigh, frontKnee, def, false);

  // 5. Front Arm
  drawArticulatedArm(ctx, 12, -64 + bob, frontArm, def, false);

  // 6. Clean Anatomical Semi-Realistic Head (with header strike nod)
  const headNod = headNodTimer > 0 ? Math.sin((headNodTimer / 0.18) * Math.PI) : 0;
  const headCenterY = -98 + bob + (expression === 'sad' ? 4 : 0);
  ctx.save();
  ctx.translate(headNod * 5, headCenterY);
  ctx.rotate(headNod * 0.24);
  drawSemiRealisticHead(ctx, 0, 0, PLAYER_STATS.headRadius, def, expression, time);
  ctx.restore();

  if (frozen) {
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, headCenterY, PLAYER_STATS.headRadius + 3, PLAYER_STATS.headRadius * 1.15 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawArticulatedLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  thighAngle: number,
  kneeAngle: number,
  def: CharacterDef,
  isBack: boolean
) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAngle);

  ctx.fillStyle = isBack ? def.skinShadow : def.skin;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.1;
  drawRoundedRect(ctx, -4.5, -1, 9, 14, 4);
  ctx.fill();
  ctx.stroke();

  ctx.translate(0, 12);
  ctx.rotate(kneeAngle);

  ctx.fillStyle = def.socksColor;
  drawRoundedRect(ctx, -4.2, 0, 8.4, 13, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = def.cleatsColor;
  ctx.beginPath();
  ctx.moveTo(-5, 11);
  ctx.lineTo(12, 12);
  ctx.quadraticCurveTo(16, 12.5, 16, 16);
  ctx.lineTo(16, 18.5);
  ctx.lineTo(-5.5, 18.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, 16.5, 20.5, 2.2);

  ctx.restore();
}

function drawArticulatedArm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  angle: number,
  def: CharacterDef,
  isBack: boolean
) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);

  ctx.fillStyle = isBack ? def.jerseySecondary : def.jerseyPrimary;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.1;
  drawRoundedRect(ctx, -4.5, -2, 9, 13, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isBack ? def.skinShadow : def.skin;
  drawRoundedRect(ctx, -3.5, 10, 7, 13, 3.5);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 24, 4.1, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawSemiRealisticHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  def: CharacterDef,
  expression: CharacterExpression,
  time = 0
) {
  ctx.save();
  ctx.translate(cx, cy);

  const hw = r * 0.92;
  const hh = r * 1.14;

  // Haaland back ponytail
  if (def.hairStyle === 'haaland') {
    ctx.fillStyle = def.hairColor;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.72, -hh * 0.25);
    ctx.quadraticCurveTo(-hw * 1.24, -hh * 0.14, -hw * 1.1, hh * 0.34);
    ctx.quadraticCurveTo(-hw * 0.84, hh * 0.24, -hw * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const traceHeadPath = () => {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.86, -hh * 0.18);
    ctx.bezierCurveTo(-hw * 0.88, -hh * 0.88, -hw * 0.45, -hh, 0, -hh);
    ctx.bezierCurveTo(hw * 0.55, -hh, hw * 0.92, -hh * 0.84, hw * 0.92, -hh * 0.14);
    ctx.bezierCurveTo(hw * 0.92, hh * 0.38, hw * 0.64, hh * 0.85, hw * 0.16, hh * 0.96);
    ctx.bezierCurveTo(-hw * 0.35, hh * 0.96, -hw * 0.78, hh * 0.58, -hw * 0.86, -hh * 0.18);
    ctx.closePath();
  };

  traceHeadPath();
  const skinGrad = ctx.createRadialGradient(hw * 0.22, -hh * 0.25, r * 0.1, 0, 0, hh * 1.15);
  skinGrad.addColorStop(0, def.skinHighlight);
  skinGrad.addColorStop(0.55, def.skin);
  skinGrad.addColorStop(1, def.skinShadow);
  ctx.fillStyle = skinGrad;
  ctx.fill();

  ctx.save();
  traceHeadPath();
  ctx.clip();

  const jawShade = ctx.createLinearGradient(-hw, 0, hw * 0.4, 0);
  jawShade.addColorStop(0, 'rgba(0, 0, 0, 0.14)');
  jawShade.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = jawShade;
  ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

  drawCleanFacialHair(ctx, hw, hh, def);
  ctx.restore();

  traceHeadPath();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Proportional anatomical ear
  ctx.fillStyle = def.skinShadow;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.ellipse(-hw * 0.86, hh * 0.03, r * 0.1, r * 0.2, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawDetailedFaceFeatures(ctx, hw, hh, r, def, expression, time);
  drawSculptedHair(ctx, hw, hh, r, def);

  ctx.restore();
}

function drawCleanFacialHair(
  ctx: CanvasRenderingContext2D,
  hw: number,
  hh: number,
  def: CharacterDef
) {
  if (def.facialHair === 'none') return;

  ctx.save();
  if (def.facialHair === 'fullbeard' || def.facialHair === 'beard') {
    const isFull = def.facialHair === 'fullbeard';
    ctx.fillStyle = def.hairColor;
    ctx.globalAlpha = isFull ? 0.9 : 0.82;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.82, hh * 0.12);
    ctx.quadraticCurveTo(-hw * 0.45, hh * (isFull ? 0.36 : 0.48), hw * 0.12, hh * (isFull ? 0.34 : 0.44));
    ctx.quadraticCurveTo(hw * 0.62, hh * 0.36, hw * 0.88, hh * 0.22);
    ctx.lineTo(hw, hh * 1.08);
    ctx.lineTo(-hw, hh * 1.08);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = def.skin;
    ctx.beginPath();
    ctx.ellipse(hw * 0.28, hh * 0.56, hw * 0.32, hh * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (def.facialHair === 'goatee') {
    ctx.fillStyle = def.hairColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(hw * 0.26, hh * 0.8, hw * 0.22, hh * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw * 0.04, hh * 0.46);
    ctx.quadraticCurveTo(hw * 0.28, hh * 0.4, hw * 0.5, hh * 0.46);
    ctx.lineTo(hw * 0.46, hh * 0.5);
    ctx.quadraticCurveTo(hw * 0.28, hh * 0.46, hw * 0.06, hh * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (def.facialHair === 'stubble') {
    ctx.fillStyle = 'rgba(20, 20, 25, 0.17)';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.8, hh * 0.32);
    ctx.quadraticCurveTo(hw * 0.1, hh * 0.52, hw * 0.9, hh * 0.34);
    ctx.lineTo(hw, hh * 1.05);
    ctx.lineTo(-hw, hh * 1.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDetailedFaceFeatures(
  ctx: CanvasRenderingContext2D,
  hw: number,
  hh: number,
  r: number,
  def: CharacterDef,
  expression: CharacterExpression,
  time: number
) {
  const blinkCycle = time % 3.8;
  const isBlinking = expression === 'normal' && blinkCycle > 3.68;

  const eyes = [
    { ex: -hw * 0.08, ey: -hh * 0.1, rx: r * 0.17, ry: r * 0.12 },
    { ex: hw * 0.48, ey: -hh * 0.1, rx: r * 0.18, ry: r * 0.125 },
  ];

  for (const { ex, ey, rx, ry } of eyes) {
    if (expression === 'happy' || isBlinking) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (isBlinking) {
        ctx.moveTo(ex - rx, ey);
        ctx.lineTo(ex + rx, ey);
      } else {
        ctx.arc(ex, ey + 2, rx * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      }
      ctx.stroke();
    } else if (expression === 'sad') {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey - 1, rx * 0.85, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = def.eyeColor;
      ctx.beginPath();
      ctx.arc(ex + rx * 0.16, ey, ry * 0.78, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(ex + rx * 0.18, ey, ry * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + rx * 0.34, ey - ry * 0.25, ry * 0.24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
  }

  // Eyebrows
  ctx.strokeStyle = def.eyebrowColor;
  ctx.lineWidth = 2.9;
  ctx.lineCap = 'round';
  if (expression === 'sad') {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.28, -hh * 0.26);
    ctx.lineTo(hw * 0.06, -hh * 0.34);
    ctx.moveTo(hw * 0.32, -hh * 0.34);
    ctx.lineTo(hw * 0.68, -hh * 0.26);
    ctx.stroke();
  } else if (expression === 'happy') {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.28, -hh * 0.33);
    ctx.lineTo(hw * 0.06, -hh * 0.37);
    ctx.moveTo(hw * 0.32, -hh * 0.37);
    ctx.lineTo(hw * 0.68, -hh * 0.33);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.28, -hh * 0.32);
    ctx.lineTo(hw * 0.08, -hh * 0.25);
    ctx.moveTo(hw * 0.32, -hh * 0.25);
    ctx.lineTo(hw * 0.68, -hh * 0.32);
    ctx.stroke();
  }

  // Natural nose
  ctx.strokeStyle = def.skinShadow;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hw * 0.24, -hh * 0.06);
  ctx.quadraticCurveTo(hw * 0.38, hh * 0.14, hw * 0.32, hh * 0.22);
  ctx.quadraticCurveTo(hw * 0.22, hh * 0.26, hw * 0.16, hh * 0.21);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  if (expression === 'happy') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.02, hh * 0.44);
    ctx.lineTo(hw * 0.56, hh * 0.44);
    ctx.quadraticCurveTo(hw * 0.28, hh * 0.78, -hw * 0.02, hh * 0.44);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hw * 0.04, hh * 0.45, hw * 0.44, hh * 0.09);
  } else if (expression === 'sad') {
    ctx.beginPath();
    ctx.arc(hw * 0.26, hh * 0.66, r * 0.22, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();
  } else if (expression === 'kick' || expression === 'shocked') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(hw * 0.26, hh * 0.54, r * 0.17, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'frozen') {
    ctx.fillStyle = '#e0f2fe';
    const jiggle = Math.sin(time * 42) * 1.2;
    drawRoundedRect(ctx, hw * 0.02 + jiggle, hh * 0.47, hw * 0.46, hh * 0.14, 3);
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'focused') {
    ctx.beginPath();
    ctx.moveTo(hw * 0.06, hh * 0.54);
    ctx.lineTo(hw * 0.46, hh * 0.52);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(hw * 0.04, hh * 0.52);
    ctx.quadraticCurveTo(hw * 0.28, hh * 0.57, hw * 0.48, hh * 0.49);
    ctx.stroke();
  }
}

function drawSculptedHair(
  ctx: CanvasRenderingContext2D,
  hw: number,
  hh: number,
  r: number,
  def: CharacterDef
) {
  ctx.save();
  const hairGrad = ctx.createLinearGradient(0, -hh * 1.25, 0, -hh * 0.2);
  hairGrad.addColorStop(0, def.hairHighlight);
  hairGrad.addColorStop(0.45, def.hairColor);
  hairGrad.addColorStop(1, def.hairColor);

  ctx.fillStyle = hairGrad;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.1;
  ctx.lineJoin = 'round';

  switch (def.hairStyle) {
    case 'messi': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.88, -hh * 0.16);
      ctx.bezierCurveTo(-hw * 0.96, -hh * 0.98, -hw * 0.35, -hh * 1.15, hw * 0.12, -hh * 1.14);
      ctx.bezierCurveTo(hw * 0.58, -hh * 1.14, hw * 0.92, -hh * 0.86, hw * 0.88, -hh * 0.42);
      ctx.bezierCurveTo(hw * 0.42, -hh * 0.62, -hw * 0.28, -hh * 0.58, -hw * 0.64, -hh * 0.34);
      ctx.lineTo(-hw * 0.78, -hh * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'ronaldo': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.86, -hh * 0.2);
      ctx.lineTo(-hw * 0.88, -hh * 0.85);
      ctx.bezierCurveTo(-hw * 0.3, -hh * 1.22, hw * 0.42, -hh * 1.15, hw * 0.84, -hh * 0.66);
      ctx.lineTo(hw * 0.86, -hh * 0.45);
      ctx.bezierCurveTo(hw * 0.4, -hh * 0.64, -hw * 0.32, -hh * 0.62, -hw * 0.66, -hh * 0.34);
      ctx.lineTo(-hw * 0.76, -hh * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'mbappe': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.85, -hh * 0.22);
      ctx.bezierCurveTo(-hw * 0.85, -hh * 0.98, -hw * 0.25, -hh * 1.05, hw * 0.18, -hh * 1.04);
      ctx.bezierCurveTo(hw * 0.66, -hh * 1.02, hw * 0.9, -hh * 0.78, hw * 0.88, -hh * 0.46);
      ctx.bezierCurveTo(hw * 0.42, -hh * 0.68, -hw * 0.3, -hh * 0.66, -hw * 0.72, -hh * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'yamal': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.85, -hh * 0.2);
      ctx.bezierCurveTo(-hw * 0.94, -hh * 0.95, -hw * 0.4, -hh * 1.18, 0, -hh * 1.16);
      ctx.bezierCurveTo(hw * 0.45, -hh * 1.2, hw * 0.92, -hh * 0.9, hw * 0.86, -hh * 0.42);
      ctx.bezierCurveTo(hw * 0.45, -hh * 0.6, -hw * 0.25, -hh * 0.6, -hw * 0.68, -hh * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'neymar': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.86, -hh * 0.2);
      ctx.lineTo(-hw * 0.82, -hh * 0.88);
      ctx.lineTo(-hw * 0.3, -hh * 1.18);
      ctx.lineTo(0, -hh * 1.06);
      ctx.lineTo(hw * 0.28, -hh * 1.2);
      ctx.lineTo(hw * 0.78, -hh * 0.72);
      ctx.lineTo(hw * 0.84, -hh * 0.46);
      ctx.bezierCurveTo(hw * 0.4, -hh * 0.64, -hw * 0.3, -hh * 0.62, -hw * 0.7, -hh * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = def.hairHighlight;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.32, -hh * 1.15);
      ctx.lineTo(0, -hh * 1.02);
      ctx.lineTo(hw * 0.28, -hh * 1.17);
      ctx.lineTo(hw * 0.5, -hh * 0.92);
      ctx.lineTo(-hw * 0.2, -hh * 0.86);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'haaland': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.88, -hh * 0.18);
      ctx.bezierCurveTo(-hw * 0.9, -hh * 1.02, -hw * 0.25, -hh * 1.08, hw * 0.2, -hh * 1.06);
      ctx.bezierCurveTo(hw * 0.72, -hh * 1.02, hw * 0.9, -hh * 0.74, hw * 0.86, -hh * 0.48);
      ctx.bezierCurveTo(hw * 0.4, -hh * 0.66, -hw * 0.32, -hh * 0.66, -hw * 0.74, -hh * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'vini':
    case 'bellingham': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.86, -hh * 0.22);
      ctx.bezierCurveTo(-hw * 0.9, -hh * 1.04, -hw * 0.3, -hh * 1.12, hw * 0.14, -hh * 1.1);
      ctx.bezierCurveTo(hw * 0.68, -hh * 1.06, hw * 0.9, -hh * 0.78, hw * 0.86, -hh * 0.46);
      ctx.bezierCurveTo(hw * 0.4, -hh * 0.66, -hw * 0.32, -hh * 0.64, -hw * 0.7, -hh * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'salah': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.92, -hh * 0.12);
      ctx.bezierCurveTo(-hw * 1.08, -hh * 0.75, -hw * 0.7, -hh * 1.22, -hw * 0.1, -hh * 1.24);
      ctx.bezierCurveTo(hw * 0.45, -hh * 1.26, hw * 0.96, -hh * 0.94, hw * 0.88, -hh * 0.44);
      ctx.bezierCurveTo(hw * 0.45, -hh * 0.62, -hw * 0.26, -hh * 0.58, -hw * 0.68, -hh * 0.32);
      ctx.lineTo(-hw * 0.82, -hh * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'lewandowski': {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.86, -hh * 0.18);
      ctx.bezierCurveTo(-hw * 0.88, -hh * 1.0, -hw * 0.22, -hh * 1.14, hw * 0.24, -hh * 1.12);
      ctx.bezierCurveTo(hw * 0.76, -hh * 1.08, hw * 0.92, -hh * 0.78, hw * 0.86, -hh * 0.46);
      ctx.bezierCurveTo(hw * 0.42, -hh * 0.64, -hw * 0.3, -hh * 0.62, -hw * 0.68, -hh * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  ctx.strokeStyle = def.hairHighlight;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(hw * 0.08, -hh * 0.74, r * 0.42, Math.PI * 1.15, Math.PI * 1.68);
  ctx.stroke();

  ctx.restore();
}

export function drawCharacterPortrait(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  width: number,
  height: number,
  expression: CharacterExpression = 'normal'
) {
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createRadialGradient(width * 0.5, height * 0.38, 6, width * 0.5, height * 0.5, width * 0.72);
  bg.addColorStop(0, '#38bdf8');
  bg.addColorStop(0.55, '#1e40af');
  bg.addColorStop(1, '#0b1633');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.55);
  ctx.lineTo(0, 0);
  ctx.lineTo(width * 0.3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.55);
  ctx.lineTo(width * 0.72, 0);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.fill();

  const scale = width / 96;
  drawCharacter(ctx, def, {
    x: width * 0.5,
    y: height * 1.46,
    facing: 1,
    scale,
    expression,
  });
}

export function drawBallTrail(
  ctx: CanvasRenderingContext2D,
  trail: Array<{ x: number; y: number; alpha: number; color: string }>,
  radius: number
) {
  for (let i = 0; i < trail.length; i++) {
    const pt = trail[i];
    const ratio = (i + 1) / Math.max(1, trail.length);
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha * 0.45 * ratio);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius * (0.38 + ratio * 0.46), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: BallState,
  time: number,
  design: BallDesign = 'classic'
) {
  const groundY = ARENA.groundY;
  const heightAboveGround = Math.max(0, groundY - (ball.y + ball.radius));
  const shadowScale = Math.max(0.32, 1 - heightAboveGround / 360);

  ctx.save();
  ctx.fillStyle = `rgba(6, 40, 24, ${0.44 * shadowScale})`;
  ctx.beginPath();
  ctx.ellipse(ball.x, groundY + 4, ball.radius * 1.15 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!ball.activePower && ball.isCurved) {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 5, time * 16, time * 16 + Math.PI * 1.15);
    ctx.stroke();
    ctx.restore();
  }

  if (ball.activePower) {
    const pInfo = POWER_INFO[ball.activePower];
    ctx.save();
    ctx.translate(ball.x, ball.y);

    if (ball.activePower === 'fire') {
      const grad = ctx.createRadialGradient(0, 0, ball.radius * 0.5, 0, 0, ball.radius * 2.2);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.78)');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (ball.activePower === 'ice') {
      const grad = ctx.createRadialGradient(0, 0, ball.radius * 0.4, 0, 0, ball.radius * 2.1);
      grad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
      grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.75)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius * 2.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (ball.activePower === 'lightning') {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const ang = time * 18 + i * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * ball.radius * 0.8, Math.sin(ang) * ball.radius * 0.8);
        ctx.lineTo(Math.cos(ang + 0.3) * ball.radius * 1.5, Math.sin(ang + 0.3) * ball.radius * 1.5);
        ctx.lineTo(Math.cos(ang - 0.15) * ball.radius * 2.1, Math.sin(ang - 0.15) * ball.radius * 2.1);
        ctx.stroke();
      }
    } else if (ball.activePower === 'super') {
      const grad = ctx.createRadialGradient(0, 0, ball.radius * 0.5, 0, 0, ball.radius * 2.5);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.95)');
      grad.addColorStop(0.55, pInfo.color + 'aa');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.scale(ball.squashX, ball.squashY);
  ctx.rotate(ball.rotation);

  const r = ball.radius;
  const baseLight = design === 'neon' ? '#1e293b' : design === 'gold' ? '#fef9c3' : '#ffffff';
  const baseMid = design === 'neon' ? '#0f172a' : design === 'gold' ? '#fde047' : '#e2e8f0';
  const baseDark = design === 'neon' ? '#020617' : design === 'gold' ? '#ca8a04' : '#94a3b8';
  const panelColor = design === 'neon' ? '#22d3ee' : design === 'gold' ? '#1e3a8a' : '#0f172a';
  const seamColor = design === 'neon' ? '#4ade80' : design === 'gold' ? '#a16207' : '#334155';

  const ballGrad = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.15, 0, 0, r);
  ballGrad.addColorStop(0, baseLight);
  ballGrad.addColorStop(0.7, baseMid);
  ballGrad.addColorStop(1, baseDark);

  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = panelColor;
  drawPolygon(ctx, 0, 0, r * 0.37, 5, -Math.PI / 2);
  ctx.fill();

  ctx.strokeStyle = seamColor;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const px = Math.cos(ang) * r * 0.92;
    const py = Math.sin(ang) * r * 0.92;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.36, Math.sin(ang) * r * 0.36);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.fillStyle = panelColor;
    drawPolygon(ctx, px, py, r * 0.3, 5, ang);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.scale(ball.squashX, ball.squashY);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  startAngle: number
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * Math.PI * 2) / sides;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawPlayerShadows(ctx: CanvasRenderingContext2D, players: PlayerState[]) {
  const groundY = ARENA.groundY;
  for (const p of players) {
    const h = Math.max(0, groundY - p.y);
    const scale = Math.max(0.35, 1 - h / 320);
    ctx.save();
    ctx.fillStyle = `rgba(6, 40, 24, ${0.42 * scale})`;
    ctx.beginPath();
    ctx.ellipse(p.x, groundY + 4, 28 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'shard') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.7, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
    } else if (p.kind === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawFloatingBanner(
  ctx: CanvasRenderingContext2D,
  banner: FloatingBanner | null,
  showSkipHint = false
) {
  if (!banner) return;
  const progress = 1 - banner.timer / banner.maxTimer;
  const pop =
    progress < 0.18
      ? 0.6 + (progress / 0.18) * 0.5
      : progress > 0.8
      ? 1 - (progress - 0.8) * 1.2
      : 1;
  const alpha = progress > 0.82 ? Math.max(0, (1 - progress) / 0.18) : 1;

  ctx.save();
  ctx.translate(ARENA.width / 2, ARENA.height * 0.41);
  ctx.scale(pop * banner.scale, pop * banner.scale);
  ctx.globalAlpha = alpha;

  ctx.font = '900 72px "Arial Black", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 11;
  ctx.strokeStyle = '#0b1633';
  ctx.strokeText(banner.text, 0, 0);
  ctx.fillStyle = banner.color;
  ctx.fillText(banner.text, 0, 0);

  if (banner.subtext) {
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0b1633';
    ctx.strokeText(banner.subtext, 0, 54);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(banner.subtext, 0, 54);
  }

  if (showSkipHint) {
    ctx.font = '900 15px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0b1633';
    ctx.strokeText('PRESS SHOOT OR SPACE TO CONTINUE', 0, 88);
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('PRESS SHOOT OR SPACE TO CONTINUE', 0, 88);
  }
  ctx.restore();
}
