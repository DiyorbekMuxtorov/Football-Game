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

export interface MatchEngineOptions {
  staminaEnabled?: boolean;
  isTraining?: boolean;
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
  trainingElapsed: number;
  isTraining: boolean;
  staminaEnabled: boolean;
  halfwayAlertFired: boolean;
  finalFiveFired: boolean;
  lastFinalTickSec: number;
  isOvertime: boolean;
  countdownTimer: number;
  lastCountdownInt: number;
  goalResetTimer: number;
  goalSkipReady: boolean;
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
    feintTimer: 0,
    headNodTimer: 0,
    jumpCutDone: false,
    dribbleCooldown: 0,
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
    timedBlockTimer: 0,
    tackleTimer: 0,
    tackleCooldown: 0,
    recoverTimer: 0,
    energy: 35,
    stamina: PLAYER_STATS.staminaMax,
    isSprinting: false,
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
      shotsOnTarget: 0,
      kicks: 0,
      headers: 0,
      blocks: 0,
      saves: 0,
      tackles: 0,
      specialsUsed: 0,
      perfectShots: 0,
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
    isCurved: false,
  };
}

export function createMatchState(
  p1Char: CharacterDef,
  p2Char: CharacterDef,
  matchDuration: 60 | 90 | 120 = 60,
  skipVsIntro = false,
  options: MatchEngineOptions = {}
): MatchEngineState {
  const isTraining = Boolean(options.isTraining);
  const staminaEnabled = options.staminaEnabled ?? true;

  return {
    players: [createPlayerState(1, p1Char), createPlayerState(2, p2Char)],
    ball: createBallState(),
    ballTrail: [],
    particles: [],
    banner: isTraining
      ? {
          text: 'TRAINING',
          subtext: 'PRACTICE SHOTS, VOLLEYS & BLOCKS!',
          color: '#38bdf8',
          timer: 1.25,
          maxTimer: 1.25,
          scale: 0.9,
        }
      : skipVsIntro
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
    phase: isTraining ? 'playing' : skipVsIntro ? 'countdown' : 'vs_intro',
    vsTimer: isTraining || skipVsIntro ? 0 : 1.5,
    matchDuration,
    timeRemaining: matchDuration,
    trainingElapsed: 0,
    isTraining,
    staminaEnabled,
    halfwayAlertFired: false,
    finalFiveFired: false,
    lastFinalTickSec: 6,
    isOvertime: false,
    countdownTimer: 2.55,
    lastCountdownInt: 3,
    goalResetTimer: 0,
    goalSkipReady: false,
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

export function resetTrainingBall(state: MatchEngineState) {
  resetPositionsForKickoff(state);
  state.phase = 'playing';
  state.banner = {
    text: 'BALL RESET',
    color: '#38bdf8',
    timer: 0.55,
    maxTimer: 0.55,
    scale: 0.8,
  };
}

export function skipGoalCelebration(state: MatchEngineState) {
  if (state.phase === 'goal' && state.goalSkipReady) {
    state.goalResetTimer = 0;
  }
}

function resetPositionsForKickoff(state: MatchEngineState) {
  const [p1, p2] = state.players;
  p1.x = 320;
  p1.y = ARENA.groundY;
  p1.vx = 0;
  p1.vy = 0;
  p1.facing = 1;
  p1.turnTimer = 0;
  p1.feintTimer = 0;
  p1.headNodTimer = 0;
  p1.jumpCutDone = false;
  p1.dribbleCooldown = 0;
  p1.onGround = true;
  p1.actionState = 'idle';
  p1.landTimer = 0;
  p1.tackleTimer = 0;
  p1.recoverTimer = 0;
  p1.timedBlockTimer = 0;
  p1.fallTimer = 0;
  p1.frozenTimer = 0;
  p1.stunTimer = 0;
  p1.stamina = PLAYER_STATS.staminaMax;
  p1.isSprinting = false;
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
  p2.turnTimer = 0;
  p2.feintTimer = 0;
  p2.headNodTimer = 0;
  p2.jumpCutDone = false;
  p2.dribbleCooldown = 0;
  p2.onGround = true;
  p2.actionState = 'idle';
  p2.landTimer = 0;
  p2.tackleTimer = 0;
  p2.recoverTimer = 0;
  p2.timedBlockTimer = 0;
  p2.fallTimer = 0;
  p2.frozenTimer = 0;
  p2.stunTimer = 0;
  p2.stamina = PLAYER_STATS.staminaMax;
  p2.isSprinting = false;
  p2.expression = 'normal';
  p2.isChargingSpecial = false;
  p2.isChargingPower = false;
  p2.specialPrimedTimer = 0;
  p2.holdTimer = 0;

  state.goalSkipReady = false;
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
  const inFinalFive = !state.isTraining && !state.isOvertime && state.timeRemaining <= 5 && state.timeRemaining > 0;
  state.tensionLevel = state.isTraining
    ? 0.2
    : state.isOvertime
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

  // Smooth clamped camera tracking (keeps both goalposts inside frame)
  const targetZoom = state.phase === 'goal' ? 1.045 : state.ball.activePower ? 1.024 : inDangerZone ? 1.01 : 1.0;
  state.cameraZoom += (targetZoom - state.cameraZoom) * Math.min(1, dt * 6);
  const halfVisibleW = ARENA.width / (2 * state.cameraZoom);
  const rawFocusX = ARENA.width / 2 + (state.ball.x - ARENA.width / 2) * 0.14;
  const targetFocusX = Math.max(halfVisibleW, Math.min(ARENA.width - halfVisibleW, rawFocusX));
  state.cameraFocusX += (targetFocusX - state.cameraFocusX) * Math.min(1, dt * 5);
  state.cameraFocusX = Math.max(halfVisibleW, Math.min(ARENA.width - halfVisibleW, state.cameraFocusX));

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

    const goalDuration = state.isTraining ? 1.05 : state.isOvertime ? 1.55 : 1.9;
    const elapsedGoalTime = goalDuration - state.goalResetTimer;
    state.goalSkipReady = (!state.isOvertime || state.isTraining) && elapsedGoalTime >= 0.45;

    const p1SkipKick = input.p1Kick && !state.prevKickPressed[0];
    const p2SkipKick = input.p2Kick && !state.prevKickPressed[1];
    state.prevKickPressed[0] = input.p1Kick;
    state.prevKickPressed[1] = input.p2Kick;

    if (state.goalSkipReady && (p1SkipKick || p2SkipKick)) {
      state.goalResetTimer = 0;
    }

    if (state.goalResetTimer <= 0) {
      state.goalSkipReady = false;
      if (state.isOvertime && !state.isTraining) {
        state.phase = 'ended';
        state.winner = state.players[0].score > state.players[1].score ? 1 : 2;
        soundEngine.playVictoryFanfare();
        return;
      }
      resetPositionsForKickoff(state);
      state.phase = 'playing';
      soundEngine.playWhistle(false);
      state.banner = {
        text: state.isTraining ? 'PRACTICE!' : 'KICK OFF!',
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

  // Match Clock (or elapsed practice timer in Training Arena)
  if (state.isTraining) {
    state.trainingElapsed += dt;
  } else if (!state.isOvertime) {
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

  // Speed, Curved Spin & Special trail points for visual velocity feedback
  const ballSpeed = Math.hypot(state.ball.vx, state.ball.vy);
  if ((state.ball.activePower || state.ball.isCurved || ballSpeed > 620) && Math.floor(state.time * 120) % 2 === 0) {
    const pInfo = state.ball.activePower ? POWER_INFO[state.ball.activePower] : null;
    state.ballTrail.push({
      x: state.ball.x,
      y: state.ball.y,
      alpha: pInfo ? 0.75 : state.ball.isCurved ? 0.62 : 0.45,
      color: pInfo ? pInfo.secondary : state.ball.isCurved ? '#34d399' : ballSpeed > 820 ? '#fde047' : '#e2e8f0',
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
    p.feintTimer = Math.max(0, p.feintTimer - dt);
    p.headNodTimer = Math.max(0, p.headNodTimer - dt);
    p.dribbleCooldown = Math.max(0, p.dribbleCooldown - dt);
    p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
    p.timedBlockTimer = Math.max(0, p.timedBlockTimer - dt);
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

    // Defend / Timed Block / Slide Tackle Input (S for P1, Down Arrow for P2)
    // Never trigger a slide tackle while pressing Kick so S+F / Down+L reliably executes a Low Shot.
    const wasDefPressed = state.prevDefendPressed[idx];
    const isDefPressed = ctrl.defend;
    const canAct = p.stunTimer <= 0 && p.fallTimer <= 0;

    if (canAct && p.tackleTimer <= 0 && p.recoverTimer <= 0) {
      const moveInputDir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
      if (isDefPressed && !wasDefPressed && p.onGround && moveInputDir !== 0 && !ctrl.kick && p.tackleCooldown <= 0) {
        // Trigger Timed Slide Tackle!
        p.facing = moveInputDir > 0 ? 1 : -1;
        p.tackleTimer = PLAYER_STATS.tackleDuration;
        p.tackleCooldown = PLAYER_STATS.tackleCooldown;
        p.vx = p.facing * PLAYER_STATS.tackleSpeed * (p.frozenTimer > 0 ? 0.65 : 1);
        p.isDefending = false;
        p.timedBlockTimer = PLAYER_STATS.timedBlockWindow * 0.7;
        p.stats.tackles += 1;
        if (state.staminaEnabled) {
          p.stamina = Math.max(0, p.stamina - PLAYER_STATS.staminaTackleCost);
        }
        soundEngine.playTackle();
        spawnParticles(state, p.x, ARENA.groundY, 6, '#86efac', 'turf', 150);
      } else {
        if (isDefPressed && !wasDefPressed && !ctrl.kick) {
          p.timedBlockTimer = PLAYER_STATS.timedBlockWindow;
        }
        p.isDefending = isDefPressed && !ctrl.kick;
      }
    } else {
      p.isDefending = false;
    }
    state.prevDefendPressed[idx] = isDefPressed;

    // Stamina & Sprint Burst Logic
    const moveDirRaw = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
    if (state.staminaEnabled) {
      const isSustainedRun =
        canAct &&
        p.onGround &&
        moveDirRaw !== 0 &&
        !p.isDefending &&
        p.tackleTimer <= 0 &&
        p.recoverTimer <= 0 &&
        Math.abs(p.vx) > 250;

      if (isSustainedRun && p.stamina > 18) {
        p.isSprinting = true;
        p.stamina = Math.max(0, p.stamina - PLAYER_STATS.staminaDrainPerSec * dt);
      } else {
        p.isSprinting = false;
        const regenRate =
          moveDirRaw === 0 || p.isDefending ? PLAYER_STATS.staminaRegenIdle : PLAYER_STATS.staminaRegenWalk;
        p.stamina = Math.min(PLAYER_STATS.staminaMax, p.stamina + regenRate * dt);
      }
    } else {
      p.stamina = PLAYER_STATS.staminaMax;
      p.isSprinting = false;
    }

    const staminaFactor = !state.staminaEnabled
      ? 1.0
      : p.isSprinting
      ? PLAYER_STATS.sprintMultiplier
      : p.stamina < 12
      ? PLAYER_STATS.exhaustedFactor
      : 1.0;

    // Movement & Weight Physics
    const speedMult =
      (p.frozenTimer > 0 ? 0.5 : 1.0) *
      (p.isDefending ? PLAYER_STATS.defendMoveFactor : 1.0) *
      (p.recoverTimer > 0 ? 0.45 : 1.0) *
      staminaFactor;

    if (p.tackleTimer > 0) {
      // Slide tackle friction
      p.vx *= 1 - 3.2 * dt;
      if (Math.floor(state.time * 120) % 4 === 0) {
        spawnParticles(state, p.x - p.facing * 14, ARENA.groundY, 1, '#4ade80', 'turf', 90);
      }
    } else if (canAct && p.fallTimer <= 0) {
      const moveDir = moveDirRaw;

      if (moveDir !== 0) {
        const newFacing = moveDir > 0 ? 1 : -1;
        if (newFacing !== p.facing) {
          p.facing = newFacing;
          p.turnTimer = 0.14;
        }
        const isReversing = p.vx !== 0 && Math.sign(p.vx) !== moveDir;
        if (isReversing && p.onGround && Math.abs(p.vx) > 200 && p.feintTimer <= 0.04) {
          p.feintTimer = 0.22;
          spawnParticles(state, p.x, ARENA.groundY, 4, '#bbf7d0', 'turf', 110);
        }
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
        p.jumpCutDone = false;
        if (state.staminaEnabled) {
          p.stamina = Math.max(0, p.stamina - PLAYER_STATS.staminaJumpCost);
        }
        soundEngine.playJump();
      } else if (!p.onGround && !ctrl.jump && !p.jumpCutDone && p.vy < -220) {
        // Variable jump height cut on early key release for crisp aerial control
        p.vy *= 0.52;
        p.jumpCutDone = true;
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
      p.jumpCutDone = false;
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
    if (p.kickTimer > 0) {
      p.actionState =
        p.kickType === 'emergency'
          ? 'kick_emergency'
          : p.kickType === 'curved'
          ? 'kick_curved'
          : p.kickType === 'power'
          ? 'kick_power'
          : p.kickType === 'low'
          ? 'kick_low'
          : p.kickType === 'high'
          ? 'kick_high'
          : p.kickType === 'volley' || p.kickType === 'jump'
          ? 'kick_volley'
          : 'kick_normal';
    } else if (p.fallTimer > 0 || p.stunTimer > 0) p.actionState = 'stumble';
    else if (p.tackleTimer > 0) p.actionState = 'tackle';
    else if (p.recoverTimer > 0) p.actionState = 'recover';
    else if (p.isDefending) p.actionState = 'defend';
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
    const canEmergencyKick = !canAct || p.recoverTimer > 0 || p.fallTimer > 0;

    if (canEmergencyKick) {
      p.isChargingSpecial = false;
      p.isChargingPower = false;
      p.holdTimer = 0;
      // Last-gasp Emergency Kick while recovering or stumbling!
      if (isKickPressed && !wasKickPressed && p.stunTimer <= 0.2 && p.kickCooldown <= 0) {
        triggerEmergencyKick(state, p);
      }
    } else if (p.tackleTimer <= 0) {
      if (isKickPressed && !wasKickPressed) {
        p.holdTimer = 0;
        if (canUseSpecial) {
          p.isChargingSpecial = true;
          p.isChargingPower = false;
        } else {
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
              triggerTacticalKick(state, p, ctrl, true, false);
            }
          }
        } else if (p.isChargingPower) {
          p.holdTimer += dt;
          if (p.holdTimer >= PLAYER_STATS.powerAutoFireThreshold) {
            p.isChargingPower = false;
            triggerTacticalKick(state, p, ctrl, true, false);
          }
        }
      } else if (!isKickPressed && wasKickPressed) {
        if (p.isChargingSpecial) {
          p.isChargingSpecial = false;
          // Quick taps (< 0.14s) still let players take tactical shots even at 100 energy!
          if (p.holdTimer < PLAYER_STATS.specialHoldThreshold) {
            const isPerfectWindow =
              p.holdTimer >= PLAYER_STATS.perfectTimingMin && p.holdTimer <= PLAYER_STATS.perfectTimingMax;
            triggerTacticalKick(
              state,
              p,
              ctrl,
              p.holdTimer >= PLAYER_STATS.powerHoldThreshold,
              isPerfectWindow
            );
          }
        } else if (p.isChargingPower) {
          p.isChargingPower = false;
          const isPerfectWindow =
            p.holdTimer >= PLAYER_STATS.perfectTimingMin && p.holdTimer <= PLAYER_STATS.perfectTimingMax;
          triggerTacticalKick(
            state,
            p,
            ctrl,
            p.holdTimer >= PLAYER_STATS.powerHoldThreshold,
            isPerfectWindow
          );
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

function isShotOnTarget(ball: BallState, shooterId: 1 | 2): boolean {
  const dirToGoal = shooterId === 1 ? 1 : -1;
  if (ball.vx * dirToGoal < 240) return false;
  const targetGoalX = shooterId === 1 ? ARENA.rightGoalLineX : ARENA.leftGoalLineX;
  const distToGoal = (targetGoalX - ball.x) * dirToGoal;
  if (distToGoal <= 0) return false;

  const grav = 1260 * (ball.activePower === 'lightning' ? 0.56 : ball.activePower === 'super' ? 0.8 : 1);
  let simX = ball.x;
  let simY = ball.y;
  let simVx = ball.vx;
  let simVy = ball.vy;
  const step = 0.04;
  const maxSteps = 60; // up to 2.4s

  for (let i = 0; i < maxSteps; i++) {
    simVy += grav * step;
    simX += simVx * step;
    simY += simVy * step;

    if (simY + ball.radius >= ARENA.groundY) {
      simY = ARENA.groundY - ball.radius;
      if (Math.abs(simVy) > 95) {
        simVy = -simVy * 0.73;
      } else {
        simVy = 0;
      }
      simVx *= 1 - 1.45 * step;
    }

    if ((shooterId === 1 && simX >= targetGoalX) || (shooterId === 2 && simX <= targetGoalX)) {
      return simY >= ARENA.goalTopY - 26 && simY <= ARENA.groundY;
    }
  }
  return false;
}

function triggerEmergencyKick(state: MatchEngineState, p: PlayerState) {
  const ball = state.ball;
  const dirToGoal = p.id === 1 ? 1 : -1;
  const footX = p.x + p.facing * 24;
  const footY = p.y - 24;
  const dx = ball.x - footX;
  const dy = ball.y - footY;
  const dist = Math.hypot(dx, dy);

  p.kickType = 'emergency';
  p.kickDuration = 0.2;
  p.kickTimer = 0.2;
  p.kickCooldown = 0.34;
  p.expression = 'focused';
  p.expressionTimer = 0.22;
  p.stats.kicks += 1;

  if (dist <= PLAYER_STATS.kickRange * 0.85) {
    const kickDir = p.facing === dirToGoal ? dirToGoal : p.facing;
    ball.vx = kickDir * 535 + p.vx * 0.15;
    ball.vy = -195;
    ball.angularVelocity = kickDir * 10;
    ball.isCurved = false;
    ball.lastTouchPlayer = p.id;
    ball.squashX = 1.14;
    ball.squashY = 0.88;
    p.dribbleCooldown = 0.16;
    p.stats.shots += 1;
    if (isShotOnTarget(ball, p.id)) p.stats.shotsOnTarget += 1;
    soundEngine.playKick(false, false, 'emergency');
    spawnParticles(state, ball.x, ball.y, 5, '#cbd5e1', 'circle', 135);
  } else {
    soundEngine.playKick(false, false, 'emergency');
  }
}

function triggerTacticalKick(
  state: MatchEngineState,
  p: PlayerState,
  ctrl: { left: boolean; right: boolean; jump: boolean; defend: boolean },
  isPowerHold: boolean,
  isPerfectHold: boolean
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
  const dirToGoal = p.id === 1 ? 1 : -1;
  const inAttackHalf = p.id === 1 ? p.x > ARENA.width * 0.42 : p.x < ARENA.width * 0.58;
  const holdingAwayFromGoal = (p.id === 1 && ctrl.left) || (p.id === 2 && ctrl.right);
  const isCurvedInput = (p.turnTimer > 0 || p.feintTimer > 0 || (holdingAwayFromGoal && inAttackHalf)) && !ctrl.defend;

  let shotType: ShotType = 'normal';
  if (ctrl.defend) shotType = 'low';
  else if (isPowerHold) shotType = 'power';
  else if (isBallAirborne && dist <= PLAYER_STATS.kickRange + 14) shotType = 'volley';
  else if (!p.onGround && (p.y < ARENA.groundY - 58 || !ctrl.jump || p.vy >= 0)) shotType = 'jump';
  else if (ctrl.jump) shotType = 'high';
  else if (isCurvedInput) shotType = 'curved';
  else if (isSprinting) shotType = 'running';

  p.kickType = shotType;
  p.kickDuration = shotType === 'power' || shotType === 'volley' || shotType === 'curved' ? 0.28 : 0.22;
  p.kickTimer = p.kickDuration;
  p.kickCooldown = PLAYER_STATS.kickCooldown;
  p.expression = 'kick';
  p.expressionTimer = 0.28;
  p.stats.kicks += 1;

  const reach =
    shotType === 'volley' || shotType === 'power' || shotType === 'curved'
      ? PLAYER_STATS.kickRange + 12
      : PLAYER_STATS.kickRange;

  if (dist <= reach) {
    const kickDir = shotType === 'curved' ? dirToGoal : p.facing === dirToGoal ? dirToGoal : p.facing;
    if (shotType === 'curved') p.facing = dirToGoal;

    const curveModifier = (ctrl.jump ? -8 : 0) + (ctrl.defend ? 8 : 0) + ((ctrl.left || ctrl.right) ? 5 : 0);
    const isVolleySweetSpot = shotType === 'volley' && dist <= PLAYER_STATS.kickRange * 0.68;
    const isPerfectTiming = isPerfectHold || isVolleySweetSpot;
    const isSweetSpot =
      isPerfectTiming || shotType === 'power' || (!p.onGround && p.vy > 110);
    const powerScale = isPerfectTiming ? 1.12 : 1.0;

    ball.isCurved = shotType === 'curved';

    switch (shotType) {
      case 'power':
        ball.vx = (kickDir * 935 + p.vx * 0.22) * powerScale;
        ball.vy = -345 + Math.max(-100, Math.min(80, dy * 1.5));
        ball.angularVelocity = kickDir * (22 + curveModifier);
        state.screenShake = Math.max(state.screenShake, isPerfectTiming ? 8 : 6.5);
        state.hitstopTimer = Math.max(state.hitstopTimer, isPerfectTiming ? 0.038 : 0.032);
        break;
      case 'curved':
        ball.vx = kickDir * 785 + p.vx * 0.16;
        ball.vy = -515;
        ball.angularVelocity = kickDir * 44; // Strong topspin whip that dips over defenders!
        state.screenShake = Math.max(state.screenShake, 4);
        break;
      case 'low': {
        const lowBoost = isPowerHold ? (isPerfectTiming ? 1.12 : 1.06) : 1.0;
        ball.vx = (kickDir * 855 + p.vx * 0.2) * lowBoost;
        ball.vy = -112;
        ball.angularVelocity = -kickDir * 14;
        if (isPowerHold) state.screenShake = Math.max(state.screenShake, 4.5);
        break;
      }
      case 'high':
        ball.vx = kickDir * 565 + p.vx * 0.2;
        ball.vy = -730;
        ball.angularVelocity = -kickDir * (18 + Math.abs(curveModifier));
        break;
      case 'volley':
        ball.vx = (kickDir * (isSweetSpot ? 920 : 870) + p.vx * 0.25) * (isPerfectTiming ? 1.08 : 1);
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

    p.dribbleCooldown = 0.16;
    ball.lastTouchPlayer = p.id;
    ball.squashX = isPerfectTiming ? 1.38 : isSweetSpot ? 1.34 : 1.22;
    ball.squashY = isPerfectTiming ? 0.68 : isSweetSpot ? 0.72 : 0.82;
    p.energy = Math.min(100, p.energy + (isPerfectTiming ? 26 : isSweetSpot ? 23 : 17));
    p.stats.shots += 1;
    if (isShotOnTarget(ball, p.id)) p.stats.shotsOnTarget += 1;
    if (isPerfectTiming) p.stats.perfectShots += 1;

    state.crowdBounce = Math.max(state.crowdBounce, isPerfectTiming ? 0.68 : isSweetSpot ? 0.58 : 0.3);

    const soundStyle = isPerfectTiming ? 'perfect' : shotType === 'curved' ? 'curved' : 'normal';
    soundEngine.playKick(shotType === 'power' || shotType === 'volley' || shotType === 'curved', isSweetSpot, soundStyle);

    if (isSweetSpot || shotType === 'curved') {
      spawnParticles(state, ball.x, ball.y, 1, shotType === 'curved' ? '#34d399' : '#fde047', 'ring', 0);
    }
    spawnParticles(
      state,
      ball.x,
      ball.y,
      isPerfectTiming ? 16 : isSweetSpot ? 14 : 7,
      isPerfectTiming ? '#fde047' : shotType === 'curved' ? '#34d399' : '#ffffff',
      isSweetSpot ? 'spark' : 'circle',
      isPerfectTiming ? 275 : isSweetSpot ? 250 : 200
    );

    if (isPerfectTiming && !state.banner) {
      state.banner = {
        text: 'PERFECT!',
        subtext: `${p.character.shortName} SWEET SPOT!`,
        color: '#fde047',
        timer: 0.62,
        maxTimer: 0.62,
        scale: 0.68,
      };
    }
  } else {
    soundEngine.playKick(false, false, 'normal');
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
  p.dribbleCooldown = 0.18;
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
  ball.isCurved = false;
  ball.squashX = 1.38;
  ball.squashY = 0.7;
  state.screenShake = power === 'super' ? 13 : 10;
  state.crowdBounce = Math.max(state.crowdBounce, 0.7);

  const pInfo = POWER_INFO[power];
  soundEngine.playSpecial(power);
  soundEngine.playKick(true, true, 'perfect');
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

  if (isShotOnTarget(ball, p.id)) p.stats.shotsOnTarget += 1;

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

  // Air drag + Magnus spin curve (curved shots dip cleanly over defenders!)
  ball.vx *= 1 - 0.14 * dt;
  ball.vy *= 1 - 0.08 * dt;
  const spinDirection = Math.sign(ball.vx) || 1;
  const magnusCoeff = ball.isCurved ? 2.85 : 1.55;
  ball.vy += ball.angularVelocity * spinDirection * magnusCoeff * dt;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rotation += ball.angularVelocity * dt;

  // Ground bounce & turf spin interaction
  if (ball.y + ball.radius >= ARENA.groundY) {
    ball.y = ARENA.groundY - ball.radius;
    ball.isCurved = false;
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

  // Outer side walls above goal roof
  if (ball.y < ARENA.goalTopY + 14) {
    if (ball.x - ball.radius <= ARENA.leftWallX) {
      ball.x = ARENA.leftWallX + ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.8;
    }
    if (ball.x + ball.radius >= ARENA.rightWallX) {
      ball.x = ARENA.rightWallX - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.8;
    }
  }

  // Continuous normal-based reflection on sloped goal roofs (no snapping/teleport)
  collideBallWithSegment(
    state,
    ball,
    ARENA.leftGoalLineX,
    ARENA.goalTopY,
    ARENA.leftWallX,
    ARENA.goalTopY + 14,
    0.68
  );
  collideBallWithSegment(
    state,
    ball,
    ARENA.rightGoalLineX,
    ARENA.goalTopY,
    ARENA.rightWallX,
    ARENA.goalTopY + 14,
    0.68
  );

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
        ball.isCurved = false;
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

  // Player-Ball collisions (Head, Torso, and Slide Tackle Poke!)
  for (const p of state.players) {
    // Let a kicker's own shot leave cleanly without their chest/head clipping it on the next sub-tick
    if (ball.lastTouchPlayer === p.id && p.dribbleCooldown > 0.04) {
      continue;
    }

    if (p.tackleTimer > 0) {
      const tackleX = p.x + p.facing * 26;
      const tackleY = p.y - 16;
      collideBallWithCircle(state, ball, p, tackleX, tackleY, 22, false, true);
    }

    const headX = p.x;
    const headY = p.y - 98;
    collideBallWithCircle(state, ball, p, headX, headY, PLAYER_STATS.headRadius + 2, true, false);

    const bodyX = p.x;
    const bodyY = p.y - 48;
    collideBallWithCircle(state, ball, p, bodyX, bodyY, p.isDefending ? 28 : 22, false, false);
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

    const isTimedParry = p.isDefending && p.timedBlockTimer > 0 && ball.lastTouchPlayer !== p.id;

    // Handle Special Power Impact vs Active Defense!
    if (ball.activePower && ball.powerOwner && ball.powerOwner !== p.id) {
      const blockedCleanly = p.isDefending || isTackleHit;
      if (blockedCleanly) {
        p.stats.blocks += 1;
        p.stats.saves += 1;
        p.energy = Math.min(100, p.energy + (isTimedParry ? 30 : 25));
        p.vx = (p.id === 1 ? -1 : 1) * (isTimedParry ? 70 : 120);
        p.expression = 'happy';
        p.expressionTimer = 0.45;
        ball.activePower = null;
        ball.powerOwner = null;
        ball.isCurved = false;
        ball.vx = (p.id === 1 ? 1 : -1) * (isTimedParry ? 520 : 430);
        ball.vy = -310;
        ball.lastTouchPlayer = p.id;
        state.hitstopTimer = Math.max(state.hitstopTimer, 0.042);
        state.screenShake = Math.max(state.screenShake, 8);
        state.crowdBounce = Math.max(state.crowdBounce, 0.85);
        soundEngine.playBlock(true, isTimedParry);
        spawnParticles(state, ball.x, ball.y, 1, isTimedParry ? '#fde047' : '#38bdf8', 'ring', 0);
        spawnParticles(state, ball.x, ball.y, 14, isTimedParry ? '#fde047' : '#38bdf8', 'spark', 240);
        state.banner = {
          text: isTimedParry ? 'PERFECT PARRY!' : 'DENIED!',
          subtext: `${p.character.shortName} SAVES IT!`,
          color: isTimedParry ? '#fde047' : '#38bdf8',
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
        ball.vx = p.facing * 560 + p.vx * 0.4;
        ball.vy = -240;
        ball.angularVelocity = p.facing * 12;
        ball.isCurved = false;
        p.stats.blocks += 1;
        if (threateningOwnGoal) p.stats.saves += 1;
        ball.lastTouchPlayer = p.id;
        soundEngine.playBlock(threateningOwnGoal, false);
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

      ball.isCurved = false;

      if (isIncredibleSave || (isTimedParry && isHardIncoming)) {
        // Directional safe deflection away from goal mouth + Rivalry Save / Timed Parry moment!
        const dirOut = p.id === 1 ? 1 : -1;
        ball.vx = dirOut * ((isTimedParry ? 450 : 380) + incomingSpeed * 0.25);
        ball.vy = ny < -0.15 ? -390 : -290;
        p.stats.blocks += 1;
        p.stats.saves += 1;
        p.energy = Math.min(100, p.energy + (isTimedParry ? 26 : 22));
        p.expression = 'happy';
        p.expressionTimer = 0.42;
        state.hitstopTimer = Math.max(state.hitstopTimer, 0.036);
        state.screenShake = Math.max(state.screenShake, 7);
        state.crowdBounce = Math.max(state.crowdBounce, 0.82);
        soundEngine.playBlock(true, isTimedParry);
        spawnParticles(state, ball.x, ball.y, 1, isTimedParry ? '#fde047' : '#38bdf8', 'ring', 0);
        spawnParticles(state, ball.x, ball.y, 12, isTimedParry ? '#fde047' : '#93c5fd', 'spark', 220);
        state.banner = {
          text: isTimedParry ? 'TIMED BLOCK!' : 'WHAT A SAVE!',
          subtext: `${p.character.shortName} WITH THE STOP!`,
          color: isTimedParry ? '#fde047' : '#38bdf8',
          timer: 0.75,
          maxTimer: 0.75,
          scale: 0.7,
        };
      } else {
        // Soft Dribble Cushion / Body Shielding when running with a low ball (prevents pinball bounces!)
        const isLowBall = ball.y >= ARENA.groundY - ball.radius - 32;
        const canDribble =
          !isHead &&
          !isTackleHit &&
          isLowBall &&
          p.onGround &&
          p.dribbleCooldown <= 0 &&
          p.kickTimer <= 0 &&
          p.stunTimer <= 0 &&
          p.fallTimer <= 0 &&
          p.recoverTimer <= 0 &&
          incomingSpeed <= 480 &&
          -relDot < 390 &&
          (ball.x - p.x) * p.facing >= -12;

        if (canDribble) {
          if (p.isDefending) {
            // Body shield / close ball trap
            const trapX = p.x + p.facing * 26;
            ball.x = ball.x * 0.35 + trapX * 0.65;
            ball.vx = p.vx * 0.92;
            ball.vy = Math.min(ball.vy * 0.35, 0);
          } else {
            // Smooth dribble carry ahead of lead foot
            const leadX = p.x + p.facing * (28 + Math.min(8, Math.abs(p.vx) * 0.015));
            ball.x = Math.max(ARENA.leftWallX + ball.radius, Math.min(ARENA.rightWallX - ball.radius, leadX));
            ball.vx = p.vx * 1.05 + p.facing * 72;
            ball.vy = Math.max(-75, Math.min(ball.vy * 0.35, -18));
          }
          ball.angularVelocity = ball.vx / ball.radius;
          ball.squashX = 1.06;
          ball.squashY = 0.94;
          ball.lastTouchPlayer = p.id;
          soundEngine.playDribbleTouch();
          return;
        }

        // Standard deflection or Jump Interception / Header
        const restitution = p.isDefending ? 0.42 : isHead ? 0.94 : 0.72;
        ball.vx -= (1 + restitution) * relDot * nx;
        ball.vy -= (1 + restitution) * relDot * ny;

        if (p.isDefending && isHardIncoming && ball.lastTouchPlayer !== p.id) {
          p.stats.blocks += 1;
          p.energy = Math.min(100, p.energy + 16);
          soundEngine.playBlock(false, isTimedParry);
          spawnParticles(state, ball.x, ball.y, 8, '#93c5fd', 'spark', 180);
        } else if (isHead) {
          ball.vx += p.vx * 0.54;
          if (ny < -0.1) {
            ball.vy -= 120;
          }
          p.headNodTimer = 0.18;
          p.stats.headers += 1;
          if (isShotOnTarget(ball, p.id)) p.stats.shotsOnTarget += 1;
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

function collideBallWithSegment(
  state: MatchEngineState,
  ball: BallState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  restitution: number
) {
  const segDx = x2 - x1;
  const segDy = y2 - y1;
  const segLenSq = segDx * segDx + segDy * segDy;
  if (segLenSq < 0.0001) return;

  const t = Math.max(0, Math.min(1, ((ball.x - x1) * segDx + (ball.y - y1) * segDy) / segLenSq));
  const closestX = x1 + t * segDx;
  const closestY = y1 + t * segDy;

  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const dist = Math.hypot(dx, dy);
  const barRadius = 5;
  const minDist = ball.radius + barRadius;

  if (dist < minDist && dist > 0.0001) {
    const nx = dx / dist;
    const ny = dy / dist;
    ball.x = closestX + nx * minDist;
    ball.y = closestY + ny * minDist;

    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      const impactSpeed = Math.abs(dot);
      ball.vx -= (1 + restitution) * dot * nx;
      ball.vy -= (1 + restitution) * dot * ny;
      ball.isCurved = false;
      if (impactSpeed > 220) {
        soundEngine.playPostClang();
        spawnParticles(state, closestX, closestY, 6, '#e2e8f0', 'spark', 150);
      } else {
        soundEngine.playBounce();
      }
    }
  }
}

function updateBallAndGoalNetOnly(state: MatchEngineState, dt: number) {
  const ball = state.ball;
  ball.vy += 1100 * dt;
  ball.vx *= 1 - 4.2 * dt; // Soft net air resistance inside goal
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rotation += ball.angularVelocity * dt;
  ball.angularVelocity *= 1 - 3.5 * dt;

  if (ball.y + ball.radius >= ARENA.groundY) {
    ball.y = ARENA.groundY - ball.radius;
    ball.vy = -ball.vy * 0.42;
    ball.vx *= 0.82;
  }
  if (ball.y - ball.radius < ARENA.goalTopY + 12) {
    ball.y = ARENA.goalTopY + 12 + ball.radius;
    ball.vy = Math.abs(ball.vy) * 0.35;
  }
  if (ball.x - ball.radius <= ARENA.leftWallX + 8) {
    ball.x = ARENA.leftWallX + 8 + ball.radius;
    if (Math.abs(ball.vx) > 90) {
      state.netImpulse.leftRipple = Math.max(state.netImpulse.leftRipple, 0.55);
      state.netImpulse.leftY = ball.y;
    }
    ball.vx = Math.abs(ball.vx) * 0.28;
  }
  if (ball.x + ball.radius >= ARENA.rightWallX - 8) {
    ball.x = ARENA.rightWallX - 8 - ball.radius;
    if (Math.abs(ball.vx) > 90) {
      state.netImpulse.rightRipple = Math.max(state.netImpulse.rightRipple, 0.55);
      state.netImpulse.rightY = ball.y;
    }
    ball.vx = -Math.abs(ball.vx) * 0.28;
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

  const wasCurvedGoal = state.ball.isCurved;
  state.ball.activePower = null;
  state.ball.powerOwner = null;
  state.ball.isCurved = false;
  state.phase = 'goal';
  state.goalSkipReady = false;
  state.goalResetTimer = state.isTraining ? 1.05 : state.isOvertime ? 1.55 : 1.9;
  state.screenShake = state.isTraining ? 10 : 15;
  state.crowdBounce = 1.0;

  soundEngine.playNetSwish();
  soundEngine.playGoalCelebration();

  const confettiColors = ['#facc15', '#38bdf8', '#ef4444', '#4ade80', '#f472b6', '#ffffff'];
  for (let i = 0; i < (state.isTraining ? 28 : 52); i++) {
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

  const isLastSecond = !state.isTraining && !state.isOvertime && state.timeRemaining <= 5;
  const isTied = scorer.score === conceded.score;
  const isHighTie = !state.isTraining && isTied && scorer.score >= 3;

  let bannerText = 'GOAL!';
  let bannerSub = `${scorer.character.shortName} SCORES!`;
  let bannerColor = '#facc15';

  if (state.isTraining) {
    bannerText = wasCurvedGoal ? 'CURVED GOAL!' : 'NICE FINISH!';
    bannerSub = 'TRAINING RESET...';
    bannerColor = '#4ade80';
  } else if (state.isOvertime) {
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
  } else if (wasCurvedGoal) {
    bannerText = 'TOP CORNER!';
    bannerSub = `${scorer.character.shortName} CURLS IT IN!`;
    bannerColor = '#34d399';
  }

  state.banner = {
    text: bannerText,
    subtext: bannerSub,
    color: bannerColor,
    timer: state.isTraining ? 1.0 : 1.8,
    maxTimer: state.isTraining ? 1.0 : 1.8,
    scale: isLastSecond || state.isOvertime ? 0.98 : 1.12,
  };
}
