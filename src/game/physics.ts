import { ARENA, PLAYER_STATS, POWER_INFO, POWER_ORDER } from './characters';
import { soundEngine } from './audio';
import {
  BallState,
  CharacterDef,
  FloatingBanner,
  GoalNetImpulse,
  MatchPhase,
  Particle,
  PlayerState,
  PowerType,
  ShotType,
} from './types';

export interface InputState {
  p1Left: boolean;
  p1Right: boolean;
  p1Jump: boolean;
  p1Defend: boolean;
  p1Kick: boolean;
  p2Left: boolean;
  p2Right: boolean;
  p2Jump: boolean;
  p2Defend: boolean;
  p2Kick: boolean;
}

export interface BallTrailPoint {
  x: number;
  y: number;
  alpha: number;
  color: string;
}

export interface MatchEngineState {
  players: [PlayerState, PlayerState];
  ball: BallState;
  ballTrail: BallTrailPoint[];
  particles: Particle[];
  banner: FloatingBanner | null;
  netImpulse: GoalNetImpulse;
  phase: MatchPhase;
  vsTimer: number;
  matchDuration: number;
  timeRemaining: number;
  halfwayAlertFired: boolean;
  finalFiveFired: boolean;
  lastFinalTickSec: number;
  isOvertime: boolean;
  countdownTimer: number;
  lastCountdownInt: number;
  goalResetTimer: number;
  overtimeIntroTimer: number;
  powerRotationIndex: number;
  nextPower: PowerType;
  screenShake: number;
  hitstopTimer: number;
  crowdBounce: number;
  tensionLevel: number;
  cameraZoom: number;
  cameraFocusX: number;
  time: number;
  accumulator: number;
  winner: 1 | 2 | null;
  prevKickPressed: [boolean, boolean];
  prevDefendPressed: [boolean, boolean];
}

const FIXED_DT = 1 / 120;

export function createPlayerState(id: 1 | 2, char: CharacterDef): PlayerState {
  return {
    id,
    character: char,
    x: id === 1 ? 320 : ARENA.width - 320,
    y: ARENA.groundY,
    vx: 0,
    vy: 0,
    facing: id === 1 ? 1 : -1,
    turnTimer: 0,
    onGround: true,
    runPhase: 0,
    lastStrideHalf: 0,
    actionState: 'idle',
    kickTimer: 0,
    kickDuration: 0.23,
    kickType: 'normal',
    kickCooldown: 0,
    landTimer: 0,
    isDefending: false,
    tackleTimer: 0,
    tackleCooldown: 0,
    recoverTimer: 0,
    energy: 35,
    specialCooldown: 0,
    holdTimer: 0,
    isChargingSpecial: false,
    isChargingPower: false,
    specialPrimedTimer: 0,
    frozenTimer: 0,
    stunTimer: 0,
    fallTimer: 0,
    expression: 'normal',
    expressionTimer: 0,
    score: 0,
    stats: {
      shots: 0,
      kicks: 0,
      headers: 0,
      blocks: 0,
      saves: 0,
      tackles: 0,
      specialsUsed: 0,
    },
  };
}

export function createBallState(): BallState {
  return {
    x: ARENA.width / 2,
    y: 250,
    vx: 0,
    vy: 0,
    radius: 21,
    rotation: 0,
    angularVelocity: 0,
    activePower: null,
    powerOwner: null,
    powerTimer: 0,
    squashX: 1,
    squashY: 1,
    lastTouchPlayer: null,
  };
}

export function createMatchState(
  p1Char: CharacterDef,
  p2Char: CharacterDef,
  matchDuration: 60 | 90 | 120 = 60,
  skipVsIntro = false
): MatchEngineState {
  return {
    players: [createPlayerState(1, p1Char), createPlayerState(2, p2Char)],
    ball: createBallState(),
    ballTrail: [],
    particles: [],
    banner: skipVsIntro
      ? {
          text: '3',
          color: '#facc15',
          timer: 0.85,
          maxTimer: 0.85,
          scale: 1.1,
        }
      : null,
    netImpulse: {
      leftRipple: 0,
      rightRipple: 0,
      leftY: 490,
      rightY: 490,
    },
    phase: skipVsIntro ? 'countdown' : 'vs_intro',
    vsTimer: skipVsIntro ? 0 : 1.5,
    matchDuration,
    timeRemaining: matchDuration,
    halfwayAlertFired: false,
    finalFiveFired: false,
    lastFinalTickSec: 6,
    isOvertime: false,
    countdownTimer: 2.55,
    lastCountdownInt: 3,
    goalResetTimer: 0,
    overtimeIntroTimer: 0,
    powerRotationIndex: 0,
    nextPower: POWER_ORDER[0],
    screenShake: 0,
    hitstopTimer: 0,
    crowdBounce: 0.12,
    tensionLevel: 0,
    cameraZoom: 1,
    cameraFocusX: ARENA.width / 2,
    time: 0,
    accumulator: 0,
    winner: null,
    prevKickPressed: [false, false],
    prevDefendPressed: [false, false],
  };
}

function resetPositionsForKickoff(state: MatchEngineState) {
  const [p1, p2] = state.players;
  p1.x = 320;
  p1.y = ARENA.groundY;
  p1.vx = 0;
  p1.vy = 0;
  p1.facing = 1;
  p1.onGround = true;
  p1.actionState = 'idle';
  p1.landTimer = 0;
  p1.tackleTimer = 0;
  p1.recoverTimer = 0;
  p1.fallTimer = 0;
  p1.frozenTimer = 0;
  p1.stunTimer = 0;
  p1.expression = 'normal';
  p1.isChargingSpecial = false;
  p1.isChargingPower = false;
  p1.specialPrimedTimer = 0;
  p1.holdTimer = 0;

  p2.x = ARENA.width - 320;
  p2.y = ARENA.groundY;
  p2.vx = 0;
  p2.vy = 0;
  p2.facing = -1;
  p2.onGround = true;
  p2.actionState = 'idle';
  p2.landTimer = 0;
  p2.tackleTimer = 0;
  p2.recoverTimer = 0;
  p2.fallTimer = 0;
  p2.frozenTimer = 0;
  p2.stunTimer = 0;
  p2.expression = 'normal';
  p2.isChargingSpecial = false;
  p2.isChargingPower = false;
  p2.specialPrimedTimer = 0;
  p2.holdTimer = 0;

  state.ballTrail = [];
  state.ball = createBallState();
  state.ball.vy = -125;
}

export function spawnParticles(
  state: MatchEngineState,
  x: number,
  y: number,
  count: number,
  color: string,
  kind: Particle['kind'] = 'circle',
  speed = 240
) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (0.35 + Math.random() * 0.75) * speed;
    state.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 40,
      size: kind === 'confetti' ? 6 + Math.random() * 4 : 2.5 + Math.random() * 4.5,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.32 + Math.random() * 0.42,
      kind,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 10,
    });
  }
}

export function stepMatchPhysics(state: MatchEngineState, frameDt: number, input: InputState) {
  const clampedFrameDt = Math.min(frameDt, 0.05);
  state.accumulator += clampedFrameDt;

  // Step fixed 120Hz physics ticks for framerate-independent determinism
  let steps = 0;
  while (state.accumulator >= FIXED_DT && steps < 8) {
    stepFixedTick(state, FIXED_DT, input);
    state.accumulator -= FIXED_DT;
    steps++;
  }
}

function stepFixedTick(state: MatchEngineState, dt: number, input: InputState) {
  state.time += dt;
  state.screenShake = Math.max(0, state.screenShake - dt * 28);
  state.crowdBounce = Math.max(0.08, state.crowdBounce - dt * 0.52);
  state.netImpulse.leftRipple = Math.max(0, state.netImpulse.leftRipple - dt * 1.4);
  state.netImpulse.rightRipple = Math.max(0, state.netImpulse.rightRipple - dt * 1.4);

  for (let i = state.ballTrail.length - 1; i >= 0; i--) {
    state.ballTrail[i].alpha -= dt * 3.8;
    if (state.ballTrail[i].alpha <= 0) state.ballTrail.splice(i, 1);
  }

  // Micro-hitstop for heavy impact punch without stealing control
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return;
  }

  // Dynamic crowd excitement & rivalry tension
  const inDangerZone = state.ball.x < 330 || state.ball.x > ARENA.width - 330;
  const closeGame = Math.abs(state.players[0].score - state.players[1].score) <= 1;
  const inFinalFive = !state.isOvertime && state.timeRemaining <= 5 && state.timeRemaining > 0;
  state.tensionLevel = state.isOvertime
    ? 1.0
    : inFinalFive && closeGame
    ? 0.92
    : inDangerZone
    ? 0.55
    : 0.16;

  const targetExcitement =
    state.phase === 'goal'
      ? 1.0
      : state.isOvertime
      ? 0.85
      : state.ball.activePower || (inFinalFive && closeGame)
      ? 0.78
      : inDangerZone
      ? 0.52
      : 0.16;
  soundEngine.setCrowdExcitement(targetExcitement);

  // Smooth camera tracking
  const targetZoom = state.phase === 'goal' ? 1.055 : state.ball.activePower ? 1.028 : inDangerZone ? 1.012 : 1.0;
  state.cameraZoom += (targetZoom - state.cameraZoom) * Math.min(1, dt * 6);
  const targetFocusX = ARENA.width / 2 + (state.ball.x - ARENA.width / 2) * 0.15;
  state.cameraFocusX += (targetFocusX - state.cameraFocusX) * Math.min(1, dt * 5);

  if (state.banner) {
    state.banner.timer -= dt;
    if (state.banner.timer <= 0) {
      state.banner = null;
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life += dt;
    if (pt.life >= pt.maxLife) {
      state.particles.splice(i, 1);
      continue;
    }
    if (pt.kind === 'ring') {
      pt.size += dt * 280;
    } else {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'confetti') {
        pt.vy += 320 * dt;
        pt.vx *= 0.99;
      } else {
        pt.vy += 280 * dt;
      }
      if (pt.rotation !== undefined && pt.vRot !== undefined) {
        pt.rotation += pt.vRot * dt;
      }
    }
    pt.alpha = 1 - pt.life / pt.maxLife;
  }

  if (state.phase === 'vs_intro') {
    state.vsTimer -= dt;
    if (state.vsTimer <= 0) {
      state.phase = 'countdown';
      state.countdownTimer = 2.55;
      state.lastCountdownInt = 3;
      soundEngine.playCountdownBeep(false);
      state.banner = {
        text: '3',
        color: '#facc15',
        timer: 0.85,
        maxTimer: 0.85,
        scale: 1.1,
      };
    }
    return;
  }

  if (state.phase === 'countdown') {
    state.countdownTimer -= dt;
    const sec = Math.ceil(state.countdownTimer / 0.85);
    if (sec !== state.lastCountdownInt && sec >= 1 && sec <= 3) {
      state.lastCountdownInt = sec;
      soundEngine.playCountdownBeep(false);
      state.banner = {
        text: String(sec),
        color: '#facc15',
        timer: 0.8,
        maxTimer: 0.8,
        scale: 1.1,
      };
    }
    if (state.countdownTimer <= 0) {
      state.phase = 'playing';
      soundEngine.playCountdownBeep(true);
      soundEngine.playWhistle(false);
      state.banner = {
        text: 'GO!',
        color: '#4ade80',
        timer: 0.75,
        maxTimer: 0.75,
        scale: 1.2,
      };
    }
    return;
  }

  if (state.phase === 'overtime_intro') {
    state.overtimeIntroTimer -= dt;
    if (state.overtimeIntroTimer <= 0) {
      state.phase = 'playing';
      soundEngine.playWhistle(false);
    }
    return;
  }

  if (state.phase === 'goal') {
    state.goalResetTimer -= dt;
    updateBallAndGoalNetOnly(state, dt);
    if (state.goalResetTimer <= 0) {
      if (state.isOvertime) {
        state.phase = 'ended';
        state.winner = state.players[0].score > state.players[1].score ? 1 : 2;
        soundEngine.playVictoryFanfare();
        return;
      }
      resetPositionsForKickoff(state);
      state.phase = 'playing';
      soundEngine.playWhistle(false);
      state.banner = {
        text: 'KICK OFF!',
        color: '#38bdf8',
        timer: 0.65,
        maxTimer: 0.65,
        scale: 0.9,
      };
    }
    return;
  }

  if (state.phase === 'ended') {
    return;
  }

  // Match Clock
  if (!state.isOvertime) {
    state.timeRemaining = Math.max(0, state.timeRemaining - dt);
    const halfMark = state.matchDuration / 2;
    if (!state.halfwayAlertFired && state.timeRemaining <= halfMark && state.timeRemaining > halfMark - 1) {
      state.halfwayAlertFired = true;
      state.banner = {
        text: `${Math.round(halfMark)}s LEFT!`,
        subtext: 'HALFWAY MARK',
        color: '#38bdf8',
        timer: 1.1,
        maxTimer: 1.1,
        scale: 0.8,
      };
    }

    if (!state.finalFiveFired && state.timeRemaining <= 5 && state.timeRemaining > 4.2) {
      state.finalFiveFired = true;
      const isClose = Math.abs(state.players[0].score - state.players[1].score) <= 1;
      state.crowdBounce = Math.max(state.crowdBounce, 0.72);
      state.banner = {
        text: isClose ? 'FINAL ATTACK!' : 'LAST 5 SECONDS!',
        subtext: isClose ? 'EVERY TOUCH COUNTS!' : 'CLOCK WINDING DOWN!',
        color: '#f87171',
        timer: 1.05,
        maxTimer: 1.05,
        scale: 0.78,
      };
    }

    if (state.timeRemaining <= 5 && state.timeRemaining > 0) {
      const sec = Math.ceil(state.timeRemaining);
      if (sec !== state.lastFinalTickSec && sec >= 1 && sec <= 5) {
        state.lastFinalTickSec = sec;
        soundEngine.playFinalTick();
      }
    }

    if (state.timeRemaining <= 0) {
      const [p1, p2] = state.players;
      if (p1.score !== p2.score) {
        state.phase = 'ended';
        state.winner = p1.score > p2.score ? 1 : 2;
        soundEngine.playWhistle(true);
        soundEngine.playVictoryFanfare();
        return;
      } else {
        state.isOvertime = true;
        state.tensionLevel = 1.0;
        state.phase = 'overtime_intro';
        state.overtimeIntroTimer = 1.65;
        resetPositionsForKickoff(state);
        soundEngine.playWhistle(true);
        soundEngine.playOvertimeHorn();
        state.banner = {
          text: 'GOLDEN GOAL!',
          subtext: 'SUDDEN DEATH · NEXT GOAL WINS!',
          color: '#facc15',
          timer: 1.6,
          maxTimer: 1.6,
          scale: 0.92,
        };
        return;
      }
    }
  }

  updatePlayers(state, dt, input);
  updateBallPhysics(state, dt);

  // Speed & Special trail points for visual velocity feedback
  const ballSpeed = Math.hypot(state.ball.vx, state.ball.vy);
  if ((state.ball.activePower || ballSpeed > 620) && Math.floor(state.time * 120) % 2 === 0) {
    const pInfo = state.ball.activePower ? POWER_INFO[state.ball.activePower] : null;
    state.ballTrail.push({
      x: state.ball.x,
      y: state.ball.y,
      alpha: pInfo ? 0.75 : 0.45,
      color: pInfo ? pInfo.secondary : ballSpeed > 820 ? '#fde047' : '#e2e8f0',
    });
    if (state.ballTrail.length > 16) state.ballTrail.shift();
  }

  // Trail particles for active special ball
  if (state.ball.activePower && Math.floor(state.time * 120) % 2 === 0) {
    const pInfo = POWER_INFO[state.ball.activePower];
    if (state.ball.activePower === 'fire') {
      spawnParticles(state, state.ball.x, state.ball.y, 2, '#f97316', 'circle', 95);
      spawnParticles(state, state.ball.x, state.ball.y, 1, '#fde047', 'circle', 65);
    } else if (state.ball.activePower === 'ice') {
      spawnParticles(state, state.ball.x, state.ball.y, 2, '#7dd3fc', 'shard', 78);
    } else if (state.ball.activePower === 'lightning') {
      spawnParticles(state, state.ball.x, state.ball.y, 2, '#facc15', 'spark', 190);
    } else if (state.ball.activePower === 'super') {
      spawnParticles(state, state.ball.x, state.ball.y, 2, pInfo.color, 'circle', 115);
      spawnParticles(state, state.ball.x, state.ball.y, 1, '#fde047', 'shard', 105);
    }
  }
}

function updatePlayers(state: MatchEngineState, dt: number, input: InputState) {
  const inputs = [
    {
      left: input.p1Left,
      right: input.p1Right,
      jump: input.p1Jump,
      defend: input.p1Defend,
      kick: input.p1Kick,
    },
    {
      left: input.p2Left,
      right: input.p2Right,
      jump: input.p2Jump,
      defend: input.p2Defend,
      kick: input.p2Kick,
    },
  ];

  for (let idx = 0; idx < 2; idx++) {
    const p = state.players[idx];
    const ctrl = inputs[idx];

    p.energy = Math.min(100, p.energy + 8.5 * dt);
    p.specialCooldown = Math.max(0, p.specialCooldown - dt);
    p.kickCooldown = Math.max(0, p.kickCooldown - dt);
    p.kickTimer = Math.max(0, p.kickTimer - dt);
    p.landTimer = Math.max(0, p.landTimer - dt);
    p.turnTimer = Math.max(0, p.turnTimer - dt);
    p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
    p.frozenTimer = Math.max(0, p.frozenTimer - dt);
    p.stunTimer = Math.max(0, p.stunTimer - dt);
    p.fallTimer = Math.max(0, p.fallTimer - dt);
    p.specialPrimedTimer = Math.max(0, p.specialPrimedTimer - dt);
    p.expressionTimer = Math.max(0, p.expressionTimer - dt);

    const wasTackling = p.tackleTimer > 0;
    p.tackleTimer = Math.max(0, p.tackleTimer - dt);
    if (wasTackling && p.tackleTimer === 0) {
      // Natural recovery after slide tackle
      p.recoverTimer = PLAYER_STATS.tackleRecoverPenalty;
    }
    p.recoverTimer = Math.max(0, p.recoverTimer - dt);

    if (p.expressionTimer <= 0) {
      p.expression =
        p.frozenTimer > 0
          ? 'frozen'
          : p.stunTimer > 0 || p.fallTimer > 0
          ? 'shocked'
          : p.isDefending || p.isChargingPower
          ? 'focused'
          : 'normal';
    }

    // Defend / Timed Tackle Input (S for P1, Down Arrow for P2)
    const wasDefPressed = state.prevDefendPressed[idx];
    const isDefPressed = ctrl.defend;
    const canAct = p.stunTimer <= 0 && p.fallTimer <= 0;

    if (canAct && p.tackleTimer <= 0 && p.recoverTimer <= 0) {
      const moveInputDir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
      if (isDefPressed && !wasDefPressed && p.onGround && moveInputDir !== 0 && p.tackleCooldown <= 0) {
        // Trigger Timed Slide Tackle!
        p.facing = moveInputDir > 0 ? 1 : -1;
        p.tackleTimer = PLAYER_STATS.tackleDuration;
        p.tackleCooldown = PLAYER_STATS.tackleCooldown;
        p.vx = p.facing * PLAYER_STATS.tackleSpeed * (p.frozenTimer > 0 ? 0.65 : 1);
        p.isDefending = false;
        p.stats.tackles += 1;
        soundEngine.playTackle();
        spawnParticles(state, p.x, ARENA.groundY, 6, '#86efac', 'turf', 150);
      } else {
        p.isDefending = isDefPressed;
      }
    } else {
      p.isDefending = false;
    }
    state.prevDefendPressed[idx] = isDefPressed;

    // Movement & Weight Physics
    const speedMult =
      (p.frozenTimer > 0 ? 0.5 : 1.0) *
      (p.isDefending ? PLAYER_STATS.defendMoveFactor : 1.0) *
      (p.recoverTimer > 0 ? 0.45 : 1.0);

    if (p.tackleTimer > 0) {
      // Slide tackle friction
      p.vx *= 1 - 3.2 * dt;
      if (Math.floor(state.time * 120) % 4 === 0) {
        spawnParticles(state, p.x - p.facing * 14, ARENA.groundY, 1, '#4ade80', 'turf', 90);
      }
    } else if (canAct && p.fallTimer <= 0) {
      let moveDir = 0;
      if (ctrl.left) moveDir -= 1;
      if (ctrl.right) moveDir += 1;

      if (moveDir !== 0) {
        const newFacing = moveDir > 0 ? 1 : -1;
        if (newFacing !== p.facing) {
          p.facing = newFacing;
          p.turnTimer = 0.1;
        }
        const isReversing = p.vx !== 0 && Math.sign(p.vx) !== moveDir;
        const accel = p.onGround
          ? isReversing
            ? PLAYER_STATS.brakeFriction
            : PLAYER_STATS.acceleration
          : PLAYER_STATS.airAcceleration;

        p.vx += moveDir * accel * speedMult * dt;
        const maxSpd = PLAYER_STATS.moveSpeed * speedMult;
        if (Math.abs(p.vx) > maxSpd) {
          p.vx = Math.sign(p.vx) * maxSpd;
        }
      } else {
        const decel = (p.onGround ? PLAYER_STATS.groundFriction : 650) * dt;
        if (Math.abs(p.vx) <= decel) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * decel;
      }

      if (ctrl.jump && p.onGround && p.recoverTimer <= 0) {
        p.vy = PLAYER_STATS.jumpVelocity * (p.frozenTimer > 0 ? 0.8 : 1);
        p.onGround = false;
        soundEngine.playJump();
      }
    } else {
      // Falling / stunned ground drag
      if (p.onGround) {
        p.vx *= 1 - 6 * dt;
      }
    }

    const wasInAir = !p.onGround;
    p.vy += PLAYER_STATS.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.y >= ARENA.groundY) {
      p.y = ARENA.groundY;
      if (wasInAir && p.vy > 180) {
        p.landTimer = 0.14;
        soundEngine.playLand();
        spawnParticles(state, p.x, ARENA.groundY, 4, '#bbf7d0', 'turf', 85);
      }
      p.vy = 0;
      p.onGround = true;
    }

    const minX = ARENA.leftGoalLineX - 18;
    const maxX = ARENA.rightGoalLineX + 18;
    if (p.x < minX) {
      p.x = minX;
      p.vx = Math.max(0, p.vx);
    } else if (p.x > maxX) {
      p.x = maxX;
      p.vx = Math.min(0, p.vx);
    }

    // Running stride & footstep SFX
    if (p.onGround && p.tackleTimer <= 0 && Math.abs(p.vx) > 25) {
      p.runPhase += (Math.abs(p.vx) / PLAYER_STATS.moveSpeed) * 14 * dt;
      const strideHalf = Math.floor(p.runPhase / Math.PI);
      if (strideHalf !== p.lastStrideHalf) {
        p.lastStrideHalf = strideHalf;
        if (Math.abs(p.vx) > 220) {
          soundEngine.playFootstep();
        }
      }
    }

    // Determine explicit player animation state
    if (p.fallTimer > 0 || p.stunTimer > 0) p.actionState = 'stumble';
    else if (p.tackleTimer > 0) p.actionState = 'tackle';
    else if (p.recoverTimer > 0) p.actionState = 'recover';
    else if (p.kickTimer > 0) {
      p.actionState =
        p.kickType === 'power'
          ? 'kick_power'
          : p.kickType === 'low'
          ? 'kick_low'
          : p.kickType === 'high'
          ? 'kick_high'
          : p.kickType === 'volley' || p.kickType === 'jump'
          ? 'kick_volley'
          : 'kick_normal';
    } else if (p.isDefending) p.actionState = 'defend';
    else if (!p.onGround) p.actionState = p.vy < 0 ? 'jump' : 'fall';
    else if (p.landTimer > 0) p.actionState = 'land';
    else if (Math.abs(p.vx) > 260 && ((ctrl.left && p.vx > 0) || (ctrl.right && p.vx < 0) || (!ctrl.left && !ctrl.right)))
      p.actionState = 'brake';
    else if (Math.abs(p.vx) > 210) p.actionState = 'run';
    else if (Math.abs(p.vx) > 25) p.actionState = 'walk';
    else p.actionState = 'idle';

    // Shooting & Special Shot Input (F for P1, L for P2)
    const wasKickPressed = state.prevKickPressed[idx];
    const isKickPressed = ctrl.kick;
    const canUseSpecial = p.energy >= 100 && p.specialCooldown <= 0;

    if (canAct && p.tackleTimer <= 0 && p.recoverTimer <= 0) {
      if (isKickPressed && !wasKickPressed) {
        p.holdTimer = 0;
        if (canUseSpecial) {
          p.isChargingSpecial = true;
          p.isChargingPower = false;
        } else {
          // Allow holding briefly for Power Shot, or releasing quickly for tactical shots
          p.isChargingPower = true;
        }
      } else if (isKickPressed && wasKickPressed) {
        if (p.isChargingSpecial && canUseSpecial) {
          p.holdTimer += dt;
          if (p.holdTimer >= PLAYER_STATS.specialHoldThreshold) {
            p.isChargingSpecial = false;
            const fired = tryExecuteSpecialShot(state, p);
            if (!fired) {
              p.specialPrimedTimer = 1.3;
              triggerTacticalKick(state, p, ctrl, false);
            }
          }
        } else if (p.isChargingPower) {
          p.holdTimer += dt;
          if (p.holdTimer >= PLAYER_STATS.powerHoldThreshold + 0.04) {
            p.isChargingPower = false;
            triggerTacticalKick(state, p, ctrl, true);
          }
        }
      } else if (!isKickPressed && wasKickPressed) {
        if (p.isChargingSpecial) {
          p.isChargingSpecial = false;
          if (p.holdTimer < PLAYER_STATS.specialHoldThreshold) {
            triggerTacticalKick(state, p, ctrl, false);
          }
        } else if (p.isChargingPower) {
          p.isChargingPower = false;
          triggerTacticalKick(state, p, ctrl, p.holdTimer >= PLAYER_STATS.powerHoldThreshold);
        }
        p.holdTimer = 0;
      }

      if (p.specialPrimedTimer > 0 && canUseSpecial) {
        tryExecuteSpecialShot(state, p);
      }
    } else {
      p.isChargingSpecial = false;
      p.isChargingPower = false;
    }

    state.prevKickPressed[idx] = isKickPressed;
  }

  // Player-vs-Player physical collision
  const [p1, p2] = state.players;
  const dx = p2.x - p1.x;
  const dy = Math.abs(p2.y - p1.y);
  const minDist = 46;
  if (Math.abs(dx) < minDist && dy < 76) {
    const push = (minDist - Math.abs(dx)) * 0.5;
    const dir = dx >= 0 ? 1 : -1;
    p1.x -= dir * push;
    p2.x += dir * push;

    // Tackle collision knockdown check
    if (p1.tackleTimer > 0 && p2.tackleTimer <= 0 && p2.fallTimer <= 0 && !p2.isDefending) {
      p2.fallTimer = 0.45;
      p2.vx = dir * 210;
      p2.vy = -190;
      p2.onGround = false;
      p2.recoverTimer = 0.35;
    } else if (p2.tackleTimer > 0 && p1.tackleTimer <= 0 && p1.fallTimer <= 0 && !p1.isDefending) {
      p1.fallTimer = 0.45;
      p1.vx = -dir * 210;
      p1.vy = -190;
      p1.onGround = false;
      p1.recoverTimer = 0.35;
    }

    p1.x = Math.max(ARENA.leftGoalLineX - 18, Math.min(ARENA.rightGoalLineX + 18, p1.x));
    p2.x = Math.max(ARENA.leftGoalLineX - 18, Math.min(ARENA.rightGoalLineX + 18, p2.x));
  }
}

function triggerTacticalKick(
  state: MatchEngineState,
  p: PlayerState,
  ctrl: { left: boolean; right: boolean; jump: boolean; defend: boolean },
  isPowerHold: boolean
) {
  if (p.kickCooldown > 0) return;

  const ball = state.ball;
  const footX = p.x + p.facing * 24;
  const footY = p.y - 26;
  const dx = ball.x - footX;
  const dy = ball.y - footY;
  const dist = Math.hypot(dx, dy);

  const isBallAirborne = ball.y < ARENA.groundY - ball.radius - 28;
  const isSprinting = Math.abs(p.vx) > 210;

  let shotType: ShotType = 'normal';
  if (isPowerHold) shotType = 'power';
  else if (ctrl.defend) shotType = 'low';
  else if (isBallAirborne && dist <= PLAYER_STATS.kickRange + 14) shotType = 'volley';
  else if (!p.onGround && (p.y < ARENA.groundY - 58 || !ctrl.jump || p.vy >= 0)) shotType = 'jump';
  else if (ctrl.jump) shotType = 'high';
  else if (isSprinting) shotType = 'running';

  p.kickType = shotType;
  p.kickDuration = shotType === 'power' || shotType === 'volley' ? 0.28 : 0.22;
  p.kickTimer = p.kickDuration;
  p.kickCooldown = PLAYER_STATS.kickCooldown;
  p.expression = 'kick';
  p.expressionTimer = 0.28;
  p.stats.kicks += 1;

  const reach = shotType === 'volley' || shotType === 'power' ? PLAYER_STATS.kickRange + 12 : PLAYER_STATS.kickRange;
  if (dist <= reach) {
    const dirToGoal = p.id === 1 ? 1 : -1;
    const kickDir = p.facing === dirToGoal ? dirToGoal : p.facing;
    // Controllable spin modifier based on directional control during strike
    const curveModifier = (ctrl.jump ? -8 : 0) + (ctrl.defend ? 8 : 0) + ((ctrl.left || ctrl.right) ? 5 : 0);
    const isSweetSpot =
      shotType === 'power' ||
      (shotType === 'volley' && dist <= PLAYER_STATS.kickRange * 0.72) ||
      (!p.onGround && p.vy > 110); // falling last-second shot!

    switch (shotType) {
      case 'power':
        ball.vx = kickDir * 935 + p.vx * 0.22;
        ball.vy = -345 + Math.max(-100, Math.min(80, dy * 1.5));
        ball.angularVelocity = kickDir * (22 + curveModifier);
        state.screenShake = Math.max(state.screenShake, 6.5);
        state.hitstopTimer = Math.max(state.hitstopTimer, 0.032);
        break;
      case 'low':
        ball.vx = kickDir * 845 + p.vx * 0.2;
        ball.vy = -115;
        ball.angularVelocity = -kickDir * 14;
        break;
      case 'high':
        ball.vx = kickDir * 565 + p.vx * 0.2;
        ball.vy = -730;
        ball.angularVelocity = -kickDir * (18 + Math.abs(curveModifier));
        break;
      case 'volley':
        ball.vx = kickDir * (isSweetSpot ? 920 : 870) + p.vx * 0.25;
        ball.vy = -255 + dy * 1.2;
        ball.angularVelocity = kickDir * (24 + curveModifier);
        state.screenShake = Math.max(state.screenShake, isSweetSpot ? 6.5 : 4.5);
        if (isSweetSpot) state.hitstopTimer = Math.max(state.hitstopTimer, 0.032);
        break;
      case 'jump':
        ball.vx = kickDir * 760 + p.vx * 0.25;
        ball.vy = -190 + Math.max(-120, dy * 1.8);
        ball.angularVelocity = kickDir * (18 + curveModifier);
        if (isSweetSpot) state.hitstopTimer = Math.max(state.hitstopTimer, 0.022);
        break;
      case 'running':
        ball.vx = kickDir * 795 + p.vx * 0.35;
        ball.vy = -335;
        ball.angularVelocity = kickDir * (19 + curveModifier);
        break;
      default:
        ball.vx = kickDir * PLAYER_STATS.kickPowerX + p.vx * 0.2;
        ball.vy = PLAYER_STATS.kickPowerY + Math.max(-120, Math.min(80, dy * 1.8));
        ball.angularVelocity = kickDir * (14 + curveModifier);
        break;
    }

    ball.lastTouchPlayer = p.id;
    ball.squashX = isSweetSpot ? 1.34 : 1.22;
    ball.squashY = isSweetSpot ? 0.72 : 0.82;
    p.energy = Math.min(100, p.energy + (isSweetSpot ? 23 : 17));
    p.stats.shots += 1;
    state.crowdBounce = Math.max(state.crowdBounce, isSweetSpot ? 0.58 : 0.3);
    soundEngine.playKick(shotType === 'power' || shotType === 'volley', isSweetSpot);
    if (isSweetSpot) {
      spawnParticles(state, ball.x, ball.y, 1, '#fde047', 'ring', 0);
    }
    spawnParticles(
      state,
      ball.x,
      ball.y,
      isSweetSpot ? 14 : 7,
      isSweetSpot ? '#fde047' : '#ffffff',
      isSweetSpot ? 'spark' : 'circle',
      isSweetSpot ? 250 : 200
    );
  } else {
    soundEngine.playKick(false, false);
  }
}

function tryExecuteSpecialShot(state: MatchEngineState, p: PlayerState): boolean {
  const ball = state.ball;
  const centerX = p.x + p.facing * 22;
  const centerY = p.y - 48;
  const dist = Math.hypot(ball.x - centerX, ball.y - centerY);

  if (dist > PLAYER_STATS.specialKickRange) {
    return false;
  }

  const power = state.nextPower;
  const targetDir = p.id === 1 ? 1 : -1;
  p.facing = targetDir;
  p.kickType = 'power';
  p.kickDuration = 0.3;
  p.kickTimer = 0.3;
  p.kickCooldown = PLAYER_STATS.kickCooldown;
  p.energy = 0;
  p.specialCooldown = PLAYER_STATS.specialCooldown;
  p.specialPrimedTimer = 0;
  p.expression = 'kick';
  p.expressionTimer = 0.45;
  p.stats.shots += 1;
  p.stats.specialsUsed += 1;

  state.powerRotationIndex = (state.powerRotationIndex + 1) % POWER_ORDER.length;
  state.nextPower = POWER_ORDER[state.powerRotationIndex];

  ball.activePower = power;
  ball.powerOwner = p.id;
  ball.powerTimer = 2.5;
  ball.lastTouchPlayer = p.id;
  ball.squashX = 1.38;
  ball.squashY = 0.7;
  state.screenShake = power === 'super' ? 13 : 10;
  state.crowdBounce = Math.max(state.crowdBounce, 0.7);

  const pInfo = POWER_INFO[power];
  soundEngine.playSpecial(power);
  soundEngine.playKick(true, true);
  state.hitstopTimer = Math.max(state.hitstopTimer, 0.04);
  spawnParticles(state, ball.x, ball.y, 1, pInfo.secondary, 'ring', 0);
  spawnParticles(state, ball.x, ball.y, 18, pInfo.color, power === 'ice' ? 'shard' : 'spark', 320);

  if (power === 'fire') {
    ball.vx = targetDir * 990;
    ball.vy = -215;
    ball.angularVelocity = targetDir * 24;
  } else if (power === 'ice') {
    ball.vx = targetDir * 920;
    ball.vy = -175;
    ball.angularVelocity = targetDir * 18;
  } else if (power === 'lightning') {
    ball.vx = targetDir * 1140;
    ball.vy = -115;
    ball.angularVelocity = targetDir * 28;
  } else {
    ball.vx = targetDir * 1080;
    ball.vy = -255;
    ball.angularVelocity = targetDir * 26;
  }

  state.banner = {
    text: pInfo.label,
    color: pInfo.secondary,
    timer: 0.75,
    maxTimer: 0.75,
    scale: 0.72,
  };

  return true;
}

function updateBallPhysics(state: MatchEngineState, dt: number) {
  const ball = state.ball;

  ball.squashX += (1 - ball.squashX) * Math.min(1, dt * 16);
  ball.squashY += (1 - ball.squashY) * Math.min(1, dt * 16);

  if (ball.powerTimer > 0) {
    ball.powerTimer -= dt;
    if (ball.powerTimer <= 0) {
      ball.activePower = null;
      ball.powerOwner = null;
    }
  }

  const gravMult = ball.activePower === 'lightning' ? 0.56 : ball.activePower === 'super' ? 0.8 : 1;
  ball.vy += 1260 * gravMult * dt;

  // Air drag + Magnus spin curve (topspin dips ball, backspin gives floaty loft)
  ball.vx *= 1 - 0.14 * dt;
  ball.vy *= 1 - 0.08 * dt;
  const spinDirection = Math.sign(ball.vx) || 1;
  ball.vy += ball.angularVelocity * spinDirection * 1.55 * dt;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rotation += ball.angularVelocity * dt;

  // Ground bounce & turf spin interaction
  if (ball.y + ball.radius >= ARENA.groundY) {
    ball.y = ARENA.groundY - ball.radius;
    if (Math.abs(ball.vy) > 95) {
      ball.vy = -ball.vy * 0.73;
      ball.vx += ball.angularVelocity * 1.5;
      ball.squashX = 1.18;
      ball.squashY = 0.84;
      soundEngine.playBounce();
    } else {
      ball.vy = 0;
    }
    ball.vx *= 1 - 1.45 * dt;
    ball.angularVelocity = ball.vx / ball.radius;
  }

  // Ceiling
  if (ball.y - ball.radius <= ARENA.ceilingY) {
    ball.y = ARENA.ceilingY + ball.radius;
    ball.vy = Math.abs(ball.vy) * 0.75;
  }

  // Outer side walls & sloped goal roof
  if (ball.y < ARENA.goalTopY) {
    if (ball.x < ARENA.leftGoalLineX && ball.y + ball.radius >= ARENA.goalTopY - 18) {
      ball.y = ARENA.goalTopY - 18 - ball.radius;
      ball.vy = -Math.abs(ball.vy) * 0.65 - 120;
      ball.vx = Math.max(160, Math.abs(ball.vx) * 0.7);
    }
    if (ball.x > ARENA.rightGoalLineX && ball.y + ball.radius >= ARENA.goalTopY - 18) {
      ball.y = ARENA.goalTopY - 18 - ball.radius;
      ball.vy = -Math.abs(ball.vy) * 0.65 - 120;
      ball.vx = -Math.max(160, Math.abs(ball.vx) * 0.7);
    }
    if (ball.x - ball.radius <= ARENA.leftWallX) {
      ball.x = ARENA.leftWallX + ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.82;
    }
    if (ball.x + ball.radius >= ARENA.rightWallX) {
      ball.x = ARENA.rightWallX - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.82;
    }
  }

  // Crossbar front posts (Rivalry Moment: Off the Woodwork!)
  const posts = [
    { x: ARENA.leftGoalLineX, y: ARENA.goalTopY },
    { x: ARENA.rightGoalLineX, y: ARENA.goalTopY },
  ];
  for (const post of posts) {
    const dx = ball.x - post.x;
    const dy = ball.y - post.y;
    const dist = Math.hypot(dx, dy);
    const minDist = ball.radius + ARENA.goalCrossbarRadius;
    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x = post.x + nx * minDist;
      ball.y = post.y + ny * minDist;
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        const impactSpeed = Math.abs(dot);
        ball.vx -= 1.82 * dot * nx;
        ball.vy -= 1.82 * dot * ny;
        soundEngine.playPostClang();
        state.screenShake = Math.max(state.screenShake, 7.5);
        state.crowdBounce = Math.max(state.crowdBounce, 0.82);
        spawnParticles(state, post.x, post.y, 12, '#fef08a', 'spark', 220);
        if (impactSpeed > 260) {
          state.hitstopTimer = Math.max(state.hitstopTimer, 0.028);
          state.banner = {
            text: 'OFF THE POST!',
            subtext: 'SO CLOSE!',
            color: '#fbbf24',
            timer: 0.72,
            maxTimer: 0.72,
            scale: 0.72,
          };
        }
      }
    }
  }

  // Goal roof barrier
  if (ball.x < ARENA.leftGoalLineX && ball.y < ARENA.goalTopY && ball.y + ball.radius > ARENA.goalTopY - 6) {
    ball.y = ARENA.goalTopY - 6 - ball.radius;
    ball.vy = -Math.abs(ball.vy) * 0.65;
    ball.vx = Math.max(ball.vx, 120);
  }
  if (ball.x > ARENA.rightGoalLineX && ball.y < ARENA.goalTopY && ball.y + ball.radius > ARENA.goalTopY - 6) {
    ball.y = ARENA.goalTopY - 6 - ball.radius;
    ball.vy = -Math.abs(ball.vy) * 0.65;
    ball.vx = Math.min(ball.vx, -120);
  }

  // Player-Ball collisions (Head, Torso, and Slide Tackle Poke!)
  for (const p of state.players) {
    if (p.tackleTimer > 0) {
      // Extended tackle boot hitbox near turf
      const tackleX = p.x + p.facing * 26;
      const tackleY = p.y - 16;
      collideBallWithCircle(state, ball, p, tackleX, tackleY, 22, false, true);
    }

    const headX = p.x;
    const headY = p.y - 98;
    collideBallWithCircle(state, ball, p, headX, headY, PLAYER_STATS.headRadius + 2, true, false);

    const bodyX = p.x;
    const bodyY = p.y - 48;
    collideBallWithCircle(state, ball, p, bodyX, bodyY, p.isDefending ? 27 : 22, false, false);
  }

  // Goal Detection
  if (ball.x + ball.radius * 0.45 < ARENA.leftGoalLineX && ball.y > ARENA.goalTopY + 4) {
    scoreGoal(state, 2);
    return;
  }
  if (ball.x - ball.radius * 0.45 > ARENA.rightGoalLineX && ball.y > ARENA.goalTopY + 4) {
    scoreGoal(state, 1);
    return;
  }
}

function collideBallWithCircle(
  state: MatchEngineState,
  ball: BallState,
  p: PlayerState,
  cx: number,
  cy: number,
  cr: number,
  isHead: boolean,
  isTackleHit: boolean
) {
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const dist = Math.hypot(dx, dy);
  const minDist = ball.radius + cr;

  if (dist < minDist && dist > 0.0001) {
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const threateningOwnGoal =
      (p.id === 1 && ball.vx < -300 && p.x < ARENA.leftGoalLineX + 240) ||
      (p.id === 2 && ball.vx > 300 && p.x > ARENA.rightGoalLineX - 240);

    // Handle Special Power Impact vs Active Defense!
    if (ball.activePower && ball.powerOwner && ball.powerOwner !== p.id) {
      const blockedCleanly = p.isDefending || isTackleHit;
      if (blockedCleanly) {
        // Skilled defensive block tames the special shot cleanly!
        p.stats.blocks += 1;
        p.stats.saves += 1;
        p.energy = Math.min(100, p.energy + 25);
        p.vx = (p.id === 1 ? -1 : 1) * 120;
        p.expression = 'happy';
        p.expressionTimer = 0.45;
        ball.activePower = null;
        ball.powerOwner = null;
        ball.vx = (p.id === 1 ? 1 : -1) * 430;
        ball.vy = -310;
        ball.lastTouchPlayer = p.id;
        state.hitstopTimer = Math.max(state.hitstopTimer, 0.042);
        state.screenShake = Math.max(state.screenShake, 8);
        state.crowdBounce = Math.max(state.crowdBounce, 0.85);
        soundEngine.playBlock(true);
        spawnParticles(state, ball.x, ball.y, 1, '#38bdf8', 'ring', 0);
        spawnParticles(state, ball.x, ball.y, 14, '#38bdf8', 'spark', 240);
        state.banner = {
          text: 'DENIED!',
          subtext: `${p.character.shortName} SAVES IT!`,
          color: '#38bdf8',
          timer: 0.78,
          maxTimer: 0.78,
          scale: 0.72,
        };
        return;
      }

      if (ball.activePower === 'ice') {
        p.frozenTimer = 2.4;
        p.expression = 'frozen';
        p.expressionTimer = 2.4;
        spawnParticles(state, p.x, p.y - 68, 14, '#bae6fd', 'shard', 210);
      } else if (ball.activePower === 'fire') {
        p.stunTimer = 0.5;
        p.fallTimer = 0.4;
        p.vx = (p.id === 1 ? -1 : 1) * 300;
        p.vy = -220;
        p.onGround = false;
        p.expression = 'shocked';
        p.expressionTimer = 0.55;
        spawnParticles(state, p.x, p.y - 68, 14, '#f97316', 'circle', 220);
      } else if (ball.activePower === 'lightning') {
        p.stunTimer = 0.6;
        p.expression = 'shocked';
        p.expressionTimer = 0.6;
        spawnParticles(state, p.x, p.y - 68, 14, '#fde047', 'spark', 260);
      } else if (ball.activePower === 'super') {
        p.stunTimer = 0.45;
        p.fallTimer = 0.4;
        p.vx = (p.id === 1 ? -1 : 1) * 340;
        p.vy = -210;
        p.onGround = false;
      }

      ball.activePower = null;
      ball.powerOwner = null;
    }

    const relVx = ball.vx - p.vx;
    const relVy = ball.vy - p.vy;
    const relDot = relVx * nx + relVy * ny;

    if (relDot < 0) {
      if (isTackleHit) {
        // Decisive tackle clearance!
        ball.vx = p.facing * 560 + p.vx * 0.4;
        ball.vy = -240;
        ball.angularVelocity = p.facing * 12;
        p.stats.blocks += 1;
        if (threateningOwnGoal) p.stats.saves += 1;
        ball.lastTouchPlayer = p.id;
        soundEngine.playBlock(threateningOwnGoal);
        spawnParticles(state, ball.x, ball.y, 10, '#bbf7d0', 'circle', 180);
        return;
      }

      const incomingSpeed = Math.hypot(ball.vx, ball.vy);
      const isHardIncoming = incomingSpeed > 520;
      const isIncredibleSave =
        (p.isDefending || !p.onGround) &&
        threateningOwnGoal &&
        isHardIncoming &&
        ball.lastTouchPlayer !== p.id;

      if (isIncredibleSave) {
        // Directional safe deflection away from goal mouth + Rivalry Save moment!
        const dirOut = p.id === 1 ? 1 : -1;
        ball.vx = dirOut * (380 + incomingSpeed * 0.25);
        ball.vy = ny < -0.15 ? -390 : -290;
        p.stats.blocks += 1;
        p.stats.saves += 1;
        p.energy = Math.min(100, p.energy + 22);
        p.expression = 'happy';
        p.expressionTimer = 0.42;
        state.hitstopTimer = Math.max(state.hitstopTimer, 0.036);
        state.screenShake = Math.max(state.screenShake, 7);
        state.crowdBounce = Math.max(state.crowdBounce, 0.82);
        soundEngine.playBlock(true);
        spawnParticles(state, ball.x, ball.y, 1, '#38bdf8', 'ring', 0);
        spawnParticles(state, ball.x, ball.y, 12, '#93c5fd', 'spark', 220);
        state.banner = {
          text: 'WHAT A SAVE!',
          subtext: `${p.character.shortName} WITH THE STOP!`,
          color: '#38bdf8',
          timer: 0.75,
          maxTimer: 0.75,
          scale: 0.7,
        };
      } else {
        // Standard deflection or Jump Interception
        const restitution = p.isDefending ? 0.42 : isHead ? 0.94 : 0.78;
        ball.vx -= (1 + restitution) * relDot * nx;
        ball.vy -= (1 + restitution) * relDot * ny;

        if (p.isDefending && isHardIncoming && ball.lastTouchPlayer !== p.id) {
          p.stats.blocks += 1;
          p.energy = Math.min(100, p.energy + 16);
          soundEngine.playBlock(false);
          spawnParticles(state, ball.x, ball.y, 8, '#93c5fd', 'spark', 180);
        } else if (isHead) {
          ball.vx += p.vx * 0.54;
          if (ny < -0.1) {
            ball.vy -= 120;
          }
          p.stats.headers += 1;
          p.expression = 'kick';
          p.expressionTimer = 0.22;
          soundEngine.playHeader();
        } else {
          ball.vx += p.vx * 0.4;
          soundEngine.playBounce();
        }
      }

      ball.angularVelocity = (ball.vx / ball.radius) * 0.72;
      ball.squashX = 1.15;
      ball.squashY = 0.86;
      ball.lastTouchPlayer = p.id;
      p.energy = Math.min(100, p.energy + (isHead ? 12 : 5));
    }
  }
}

function updateBallAndGoalNetOnly(state: MatchEngineState, dt: number) {
  const ball = state.ball;
  ball.vy += 1100 * dt;
  ball.vx *= 1 - 2.2 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rotation += ball.angularVelocity * dt;

  if (ball.y + ball.radius >= ARENA.groundY) {
    ball.y = ARENA.groundY - ball.radius;
    ball.vy = -ball.vy * 0.55;
    ball.vx *= 0.88;
  }
  if (ball.y - ball.radius < ARENA.goalTopY + 10) {
    ball.y = ARENA.goalTopY + 10 + ball.radius;
    ball.vy = Math.abs(ball.vy) * 0.5;
  }
  if (ball.x - ball.radius <= ARENA.leftWallX + 8) {
    ball.x = ARENA.leftWallX + 8 + ball.radius;
    ball.vx = Math.abs(ball.vx) * 0.45;
  }
  if (ball.x + ball.radius >= ARENA.rightWallX - 8) {
    ball.x = ARENA.rightWallX - 8 - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 0.45;
  }
}

function scoreGoal(state: MatchEngineState, scoringPlayer: 1 | 2) {
  const scorer = state.players[scoringPlayer - 1];
  const conceded = state.players[scoringPlayer === 1 ? 1 : 0];
  scorer.score += 1;

  scorer.expression = 'happy';
  scorer.expressionTimer = 2.0;
  conceded.expression = 'sad';
  conceded.expressionTimer = 2.0;

  conceded.energy = Math.min(100, conceded.energy + 30);

  if (scoringPlayer === 2) {
    state.netImpulse.leftRipple = 1;
    state.netImpulse.leftY = state.ball.y;
  } else {
    state.netImpulse.rightRipple = 1;
    state.netImpulse.rightY = state.ball.y;
  }

  state.ball.activePower = null;
  state.ball.powerOwner = null;
  state.phase = 'goal';
  state.goalResetTimer = state.isOvertime ? 1.55 : 1.9;
  state.screenShake = 15;
  state.crowdBounce = 1.0;

  soundEngine.playGoalCelebration();

  const confettiColors = ['#facc15', '#38bdf8', '#ef4444', '#4ade80', '#f472b6', '#ffffff'];
  for (let i = 0; i < 52; i++) {
    spawnParticles(
      state,
      scoringPlayer === 1 ? ARENA.rightGoalLineX : ARENA.leftGoalLineX,
      ARENA.goalTopY + 60,
      1,
      confettiColors[i % confettiColors.length],
      'confetti',
      400
    );
  }

  const isLastSecond = !state.isOvertime && state.timeRemaining <= 5;
  const isTied = scorer.score === conceded.score;
  const isHighTie = isTied && scorer.score >= 3;

  let bannerText = 'GOAL!';
  let bannerSub = `${scorer.character.shortName} SCORES!`;
  let bannerColor = '#facc15';

  if (state.isOvertime) {
    bannerText = 'GOLDEN GOAL!';
    bannerSub = `${scorer.character.shortName} WINS IT!`;
  } else if (isLastSecond) {
    bannerText = isTied ? 'CLUTCH EQUALIZER!' : scorer.score > conceded.score ? 'LAST-SECOND GOAL!' : 'BUZZER BEATER!';
    bannerSub = `${scorer.character.shortName} WITH ${Math.ceil(state.timeRemaining)}s LEFT!`;
    bannerColor = '#fde047';
  } else if (isHighTie) {
    bannerText = `${scorer.score}-${conceded.score} EQUALIZER!`;
    bannerSub = 'RIVALRY ON FIRE!';
    bannerColor = '#fb923c';
  }

  state.banner = {
    text: bannerText,
    subtext: bannerSub,
    color: bannerColor,
    timer: 1.8,
    maxTimer: 1.8,
    scale: isLastSecond || state.isOvertime ? 0.98 : 1.12,
  };
}
