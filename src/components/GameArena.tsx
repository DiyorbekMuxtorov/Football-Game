import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, RotateCcw, Shield } from 'lucide-react';
import { ARENA, POWER_INFO, STADIUM_META } from '../game/characters';
import { soundEngine } from '../game/audio';
import {
  createMatchState,
  InputState,
  MatchEngineState,
  resetTrainingBall,
  skipGoalCelebration,
  stepMatchPhysics,
} from '../game/physics';
import {
  drawBall,
  drawBallTrail,
  drawCharacter,
  drawFloatingBanner,
  drawGoalPostsForeground,
  drawParticles,
  drawPlayerShadows,
  drawStadiumBackground,
} from '../game/renderer';
import {
  CharacterDef,
  GameSettings,
  HudSnapshot,
  MatchMode,
  MatchResult,
  RivalrySeries,
} from '../game/types';
import { CharacterAvatar } from './CharacterAvatar';
import { PowerIcon } from './PowerIcon';

interface GameArenaProps {
  p1Character: CharacterDef;
  p2Character: CharacterDef;
  settings: GameSettings;
  matchMode: MatchMode;
  rivalrySeries?: RivalrySeries;
  paused: boolean;
  matchKey: number;
  onPauseToggle: () => void;
  onMatchEnd: (result: MatchResult) => void;
}

function formatClock(seconds: number, isOvertime: boolean): string {
  if (isOvertime) return 'OT';
  const clamped = Math.max(0, seconds);
  const whole = Math.floor(clamped);
  const centis = Math.floor((clamped - whole) * 100);
  return `${String(whole).padStart(2, '0')}:${String(centis).padStart(2, '0')}`;
}

export const GameArena: React.FC<GameArenaProps> = ({
  p1Character,
  p2Character,
  settings,
  matchMode,
  rivalrySeries,
  paused,
  matchKey,
  onPauseToggle,
  onMatchEnd,
}) => {
  const isTraining = matchMode === 'training';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<MatchEngineState>(
    createMatchState(p1Character, p2Character, settings.matchDuration, false, {
      staminaEnabled: settings.staminaEnabled,
      isTraining,
    })
  );
  const keysRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef(paused);
  const settingsRef = useRef(settings);
  const matchModeRef = useRef(matchMode);
  const endedFiredRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    p1Score: 0,
    p2Score: 0,
    timeRemaining: settings.matchDuration,
    isOvertime: false,
    isTraining,
    staminaEnabled: settings.staminaEnabled,
    phase: isTraining ? 'playing' : 'vs_intro',
    goalSkipReady: false,
    vsTimer: isTraining ? 0 : 1.5,
    countdownText: '',
    p1Energy: 35,
    p2Energy: 35,
    p1Stamina: 100,
    p2Stamina: 100,
    p1SpecialCooldown: 0,
    p2SpecialCooldown: 0,
    p1Frozen: false,
    p2Frozen: false,
    p1Defending: false,
    p2Defending: false,
    nextPower: stateRef.current.nextPower,
    tensionLevel: 0,
    activeKeys: {
      p1Left: false,
      p1Right: false,
      p1Jump: false,
      p1Defend: false,
      p1Kick: false,
      p2Left: false,
      p2Right: false,
      p2Jump: false,
      p2Defend: false,
      p2Kick: false,
    },
  }));

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      soundEngine.stopCrowdAmbience();
    } else if (settings.soundEnabled) {
      soundEngine.startCrowdAmbience();
    }
  }, [paused, settings.soundEnabled]);

  useEffect(() => {
    settingsRef.current = settings;
    stateRef.current.staminaEnabled = settings.staminaEnabled;
  }, [settings]);

  useEffect(() => {
    matchModeRef.current = matchMode;
  }, [matchMode]);

  useEffect(() => {
    const trainingMode = matchMode === 'training';
    stateRef.current = createMatchState(
      p1Character,
      p2Character,
      settingsRef.current.matchDuration,
      false,
      {
        staminaEnabled: settingsRef.current.staminaEnabled,
        isTraining: trainingMode,
      }
    );
    endedFiredRef.current = false;
    keysRef.current.clear();
    if (settingsRef.current.soundEnabled) {
      soundEngine.startCrowdAmbience();
    }
    return () => {
      soundEngine.stopCrowdAmbience();
    };
  }, [p1Character, p2Character, matchKey, matchMode]);

  useEffect(() => {
    const blockedKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

    const onKeyDown = (e: KeyboardEvent) => {
      if (blockedKeys.has(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Escape' && !e.repeat) {
        e.preventDefault();
        onPauseToggle();
        return;
      }
      if (e.code === 'Space' && !e.repeat && !pausedRef.current) {
        if (stateRef.current.phase === 'goal' && stateRef.current.goalSkipReady) {
          skipGoalCelebration(stateRef.current);
          return;
        }
        if (stateRef.current.isTraining) {
          resetTrainingBall(stateRef.current);
          return;
        }
      }
      soundEngine.unlock();
      keysRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (blockedKeys.has(e.code)) {
        e.preventDefault();
      }
      keysRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [onPauseToggle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = ARENA.width;
    canvas.height = ARENA.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudTimer = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const engine = stateRef.current;
      const keys = keysRef.current;
      const curSettings = settingsRef.current;

      const input: InputState = {
        p1Left: keys.has('KeyA'),
        p1Right: keys.has('KeyD'),
        p1Jump: keys.has('KeyW'),
        p1Defend: keys.has('KeyS'),
        p1Kick: keys.has('KeyF'),
        p2Left: keys.has('ArrowLeft'),
        p2Right: keys.has('ArrowRight'),
        p2Jump: keys.has('ArrowUp'),
        p2Defend: keys.has('ArrowDown'),
        p2Kick: keys.has('KeyL'),
      };

      if (!pausedRef.current) {
        stepMatchPhysics(engine, dt, input);
      }

      if (engine.phase === 'ended' && engine.winner && !endedFiredRef.current) {
        endedFiredRef.current = true;
        soundEngine.stopCrowdAmbience();
        onMatchEnd({
          winner: engine.winner,
          p1Score: engine.players[0].score,
          p2Score: engine.players[1].score,
          wasOvertime: engine.isOvertime,
          durationSeconds: engine.matchDuration,
          mode: matchModeRef.current,
          p1Stats: { ...engine.players[0].stats },
          p2Stats: { ...engine.players[1].stats },
        });
      }

      ctx.save();
      ctx.clearRect(0, 0, ARENA.width, ARENA.height);

      const zoom = engine.cameraZoom;
      if (zoom !== 1) {
        const halfVisibleW = ARENA.width / (2 * zoom);
        const clampedFocusX = Math.max(
          halfVisibleW,
          Math.min(ARENA.width - halfVisibleW, engine.cameraFocusX)
        );
        ctx.translate(ARENA.width / 2, ARENA.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-clampedFocusX, -ARENA.height / 2);
      }

      if (engine.screenShake > 0.2) {
        const sx = (Math.random() - 0.5) * engine.screenShake;
        const sy = (Math.random() - 0.5) * engine.screenShake;
        ctx.translate(sx, sy);
      }

      const sbClock = engine.isTraining
        ? 'TRAIN'
        : engine.isOvertime
        ? 'OT'
        : `${Math.ceil(engine.timeRemaining)}s`;

      drawStadiumBackground(
        ctx,
        engine.time,
        engine.crowdBounce,
        engine.netImpulse,
        curSettings.stadiumTheme,
        curSettings.graphicsQuality,
        engine.isOvertime,
        engine.tensionLevel,
        {
          p1Score: engine.players[0].score,
          p2Score: engine.players[1].score,
          clockText: sbClock,
          label: STADIUM_META[curSettings.stadiumTheme].label.toUpperCase(),
        }
      );
      drawPlayerShadows(ctx, engine.players);

      for (const p of engine.players) {
        const specialReady = p.energy >= 100 && p.specialCooldown <= 0;
        drawCharacter(ctx, p.character, {
          x: p.x,
          y: p.y,
          facing: p.facing,
          vx: p.vx,
          onGround: p.onGround,
          runPhase: p.runPhase,
          actionState: p.actionState,
          kickTimer: p.kickTimer,
          kickDuration: p.kickDuration,
          landTimer: p.landTimer,
          tackleTimer: p.tackleTimer,
          turnTimer: p.turnTimer,
          fallTimer: p.fallTimer,
          isDefending: p.isDefending,
          timedBlockTimer: p.timedBlockTimer,
          isChargingPower: p.isChargingPower,
          holdTimer: p.holdTimer,
          headNodTimer: p.headNodTimer,
          feintTimer: p.feintTimer,
          expression: p.expression,
          celebratePhase: engine.time,
          frozen: p.frozenTimer > 0,
          stunned: p.stunTimer > 0,
          specialReadyPower: specialReady ? engine.nextPower : null,
          isChargingSpecial: p.isChargingSpecial,
          specialPrimed: p.specialPrimedTimer > 0,
          time: engine.time,
        });
      }

      drawBallTrail(ctx, engine.ballTrail, engine.ball.radius);
      drawBall(ctx, engine.ball, engine.time, curSettings.ballDesign);
      drawGoalPostsForeground(ctx);
      drawParticles(ctx, engine.particles);
      drawFloatingBanner(ctx, engine.banner, engine.goalSkipReady);

      ctx.restore();

      hudTimer += dt;
      if (hudTimer >= 0.045) {
        hudTimer = 0;
        const [p1, p2] = engine.players;
        setHud({
          p1Score: p1.score,
          p2Score: p2.score,
          timeRemaining: engine.timeRemaining,
          isOvertime: engine.isOvertime,
          isTraining: engine.isTraining,
          staminaEnabled: engine.staminaEnabled,
          phase: engine.phase,
          goalSkipReady: engine.goalSkipReady,
          vsTimer: engine.vsTimer,
          countdownText: engine.banner?.text || '',
          p1Energy: p1.energy,
          p2Energy: p2.energy,
          p1Stamina: p1.stamina,
          p2Stamina: p2.stamina,
          p1SpecialCooldown: p1.specialCooldown,
          p2SpecialCooldown: p2.specialCooldown,
          p1Frozen: p1.frozenTimer > 0,
          p2Frozen: p2.frozenTimer > 0,
          p1Defending: p1.isDefending,
          p2Defending: p2.isDefending,
          nextPower: engine.nextPower,
          tensionLevel: engine.tensionLevel,
          activeKeys: input,
        });
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [onMatchEnd]);

  const p1Ready = hud.p1Energy >= 100 && hud.p1SpecialCooldown <= 0;
  const p2Ready = hud.p2Energy >= 100 && hud.p2SpecialCooldown <= 0;
  const nextPowerInfo = POWER_INFO[hud.nextPower];
  const isFinalTen = !hud.isTraining && !hud.isOvertime && hud.timeRemaining <= 10 && hud.timeRemaining > 0;
  const bo3GameNumber = rivalrySeries?.bestOfThreeActive
    ? rivalrySeries.p1Wins + rivalrySeries.p2Wins + 1
    : 0;

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Dramatic Tension Edge Glow during Final 5s or Sudden Death */}
        {hud.tensionLevel >= 0.88 && (
          <div
            className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${
              hud.isOvertime
                ? 'shadow-[inset_0_0_55px_rgba(250,204,21,0.38)]'
                : 'shadow-[inset_0_0_50px_rgba(239,68,68,0.34)]'
            }`}
          />
        )}

        {/* Pre-Kickoff VS Splash */}
        {hud.phase === 'vs_intro' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] pointer-events-none">
            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-3xl bg-slate-950/88 border-[4px] border-sky-400/50 shadow-2xl">
              <div className="flex items-center gap-5 sm:gap-10">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-[3px] border-sky-400">
                    <CharacterAvatar character={p1Character} size={104} className="w-full h-full" />
                  </div>
                  <span className="font-arcade text-sm sm:text-lg text-sky-300">
                    {p1Character.shortName}
                  </span>
                </div>

                <div className="font-arcade text-4xl sm:text-6xl text-amber-400 text-stroke-heavy">
                  VS
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-[3px] border-rose-500">
                    <CharacterAvatar
                      character={p2Character}
                      size={104}
                      className="w-full h-full -scale-x-100"
                    />
                  </div>
                  <span className="font-arcade text-sm sm:text-lg text-rose-400">
                    {p2Character.shortName}
                  </span>
                </div>
              </div>
              {rivalrySeries?.bestOfThreeActive ? (
                <div className="px-4 py-1 rounded-xl bg-slate-900 border border-amber-400/55 font-arcade text-xs sm:text-sm text-amber-300">
                  BEST OF 3 · GAME {bo3GameNumber} · 1P {rivalrySeries.p1Wins} - {rivalrySeries.p2Wins} 2P
                </div>
              ) : (
                rivalrySeries &&
                rivalrySeries.matchesPlayed > 0 && (
                  <div className="px-4 py-1 rounded-xl bg-slate-900 border border-amber-400/45 font-arcade text-xs sm:text-sm text-amber-300">
                    RIVALRY SERIES: 1P {rivalrySeries.p1Wins} - {rivalrySeries.p2Wins} 2P
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Top Scoreboard HUD */}
        <div className="absolute top-0 left-0 right-0 px-3 sm:px-5 pt-2.5 flex items-start justify-between pointer-events-none">
          {/* Left: 1P Avatar + Name + Score + Energy + Stamina */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-[3px] border-sky-300 bg-slate-900 shadow-lg shrink-0">
              <CharacterAvatar
                character={p1Character}
                size={68}
                expression={hud.p1Frozen ? 'frozen' : hud.p1Defending ? 'focused' : 'normal'}
                className="w-full h-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-950/78 border-2 border-[#0b1633] rounded-2xl px-2.5 sm:px-3 py-1 shadow-lg">
                <div className="flex flex-col">
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-b from-sky-400 to-blue-700 border border-[#0b1633] font-arcade text-xs text-white w-fit">
                    1P
                  </span>
                  <span className="font-arcade text-[10px] sm:text-xs text-sky-200 leading-tight mt-0.5 whitespace-nowrap">
                    {p1Character.shortName}
                  </span>
                </div>
                <span className="font-arcade text-3xl sm:text-4xl text-white text-stroke-dark tabular-nums min-w-[26px] text-center">
                  {hud.p1Score}
                </span>
              </div>

              <div className="w-36 sm:w-44 h-3.5 rounded-full bg-slate-950/85 border-2 border-[#0b1633] overflow-hidden relative shadow">
                <div
                  className={`h-full transition-all duration-75 ${
                    p1Ready
                      ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500'
                      : 'bg-gradient-to-r from-sky-400 to-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(hud.p1Energy))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-arcade text-white drop-shadow-[0_1px_1px_#000]">
                  {hud.p1SpecialCooldown > 0
                    ? `COOLDOWN ${hud.p1SpecialCooldown.toFixed(1)}s`
                    : p1Ready
                    ? 'HOLD F · SPECIAL READY!'
                    : 'ENERGY'}
                </span>
              </div>

              {hud.staminaEnabled && (
                <div className="w-36 sm:w-44 h-2 rounded-full bg-slate-950/85 border border-[#0b1633] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      hud.p1Stamina < 20
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-400 to-lime-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(hud.p1Stamina))}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Center: Clock + Next Power + Mode/Training controls */}
          <div className="flex flex-col items-center">
            <div
              className={`px-5 sm:px-7 py-1.5 rounded-2xl border-[3px] border-[#0b1633] shadow-xl ${
                hud.isTraining
                  ? 'bg-gradient-to-b from-emerald-600 to-teal-900'
                  : hud.isOvertime
                  ? 'bg-gradient-to-b from-amber-500 to-red-700 animate-pulse'
                  : isFinalTen
                  ? 'bg-gradient-to-b from-red-700 to-slate-950'
                  : 'bg-slate-950/88'
              }`}
            >
              <span className="font-arcade text-2xl sm:text-4xl text-white text-stroke-dark tabular-nums">
                {hud.isTraining
                  ? 'TRAINING'
                  : hud.isOvertime
                  ? 'OVERTIME'
                  : formatClock(hud.timeRemaining, false)}
              </span>
            </div>

            <div className="mt-1 px-3 py-0.5 rounded-xl bg-slate-950/85 border-2 border-[#0b1633] flex items-center gap-1.5 shadow">
              <span className="font-arcade text-[10px] sm:text-xs text-amber-300 tracking-wide whitespace-nowrap">
                NEXT POWER:
              </span>
              <PowerIcon power={hud.nextPower} size={17} />
              <span
                className="font-arcade text-[10px] sm:text-xs whitespace-nowrap"
                style={{ color: nextPowerInfo.secondary }}
              >
                {nextPowerInfo.shortLabel}
              </span>
            </div>

            {rivalrySeries?.bestOfThreeActive && !hud.isTraining && (
              <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-950/85 border border-amber-400/40 font-arcade text-[10px] text-amber-300">
                BO3 GAME {bo3GameNumber} · 1P {rivalrySeries.p1Wins} - {rivalrySeries.p2Wins} 2P
              </div>
            )}

            {hud.isTraining && (
              <button
                type="button"
                onClick={() => resetTrainingBall(stateRef.current)}
                className="pointer-events-auto mt-1 px-3 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 border-2 border-[#0b1633] font-arcade text-[10px] text-white flex items-center gap-1 cursor-pointer shadow"
              >
                <RotateCcw className="w-3 h-3" />
                RESET BALL (SPACE)
              </button>
            )}
          </div>

          {/* Right: 2P Score + Name + Avatar + Pause */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-950/78 border-2 border-[#0b1633] rounded-2xl px-2.5 sm:px-3 py-1 shadow-lg">
                <span className="font-arcade text-3xl sm:text-4xl text-white text-stroke-dark tabular-nums min-w-[26px] text-center">
                  {hud.p2Score}
                </span>
                <div className="flex flex-col items-end">
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-b from-rose-400 to-red-700 border border-[#0b1633] font-arcade text-xs text-white w-fit">
                    2P
                  </span>
                  <span className="font-arcade text-[10px] sm:text-xs text-rose-200 leading-tight mt-0.5 whitespace-nowrap">
                    {p2Character.shortName}
                  </span>
                </div>
              </div>

              <div className="w-36 sm:w-44 h-3.5 rounded-full bg-slate-950/85 border-2 border-[#0b1633] overflow-hidden relative shadow">
                <div
                  className={`h-full transition-all duration-75 ${
                    p2Ready
                      ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500'
                      : 'bg-gradient-to-r from-rose-400 to-red-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(hud.p2Energy))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-arcade text-white drop-shadow-[0_1px_1px_#000]">
                  {hud.p2SpecialCooldown > 0
                    ? `COOLDOWN ${hud.p2SpecialCooldown.toFixed(1)}s`
                    : p2Ready
                    ? 'HOLD L · SPECIAL READY!'
                    : 'ENERGY'}
                </span>
              </div>

              {hud.staminaEnabled && (
                <div className="w-36 sm:w-44 h-2 rounded-full bg-slate-950/85 border border-[#0b1633] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      hud.p2Stamina < 20
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-400 to-lime-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(hud.p2Stamina))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-[3px] border-rose-400 bg-slate-900 shadow-lg shrink-0">
              <CharacterAvatar
                character={p2Character}
                size={68}
                expression={hud.p2Frozen ? 'frozen' : hud.p2Defending ? 'focused' : 'normal'}
                className="w-full h-full -scale-x-100"
              />
            </div>

            <button
              type="button"
              onClick={onPauseToggle}
              aria-label="Pause Game"
              className="pointer-events-auto arcade-btn w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 flex items-center justify-center cursor-pointer shrink-0"
            >
              <Pause className="w-6 h-6 fill-white text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Reactive Keycaps: P1 (A D W S F) | P2 (← → ↑ ↓ L) */}
        <div className="absolute bottom-2 left-0 right-0 px-3 sm:px-6 flex items-end justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <KeyBadge label="A" active={hud.activeKeys.p1Left} color="blue">
              <ArrowLeft className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="D" active={hud.activeKeys.p1Right} color="blue">
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="W" active={hud.activeKeys.p1Jump} color="blue">
              <ArrowUp className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="S" active={hud.activeKeys.p1Defend} color="cyan">
              <Shield className="w-4 h-4 stroke-[2.6]" />
            </KeyBadge>
            <KeyBadge
              label="F"
              active={hud.activeKeys.p1Kick}
              color={p1Ready ? 'gold' : 'blue'}
              glow={p1Ready}
            >
              <PowerIcon power={hud.nextPower} size={20} />
            </KeyBadge>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <KeyBadge label="←" active={hud.activeKeys.p2Left} color="blue">
              <ArrowLeft className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="→" active={hud.activeKeys.p2Right} color="blue">
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="↑" active={hud.activeKeys.p2Jump} color="blue">
              <ArrowUp className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge label="↓" active={hud.activeKeys.p2Defend} color="cyan">
              <ArrowDown className="w-5 h-5 stroke-[3]" />
            </KeyBadge>
            <KeyBadge
              label="L"
              active={hud.activeKeys.p2Kick}
              color={p2Ready ? 'gold' : 'red'}
              glow={p2Ready}
            >
              <PowerIcon power={hud.nextPower} size={20} />
            </KeyBadge>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KeyBadgeProps {
  label: string;
  active: boolean;
  color: 'blue' | 'red' | 'gold' | 'cyan';
  glow?: boolean;
  children: React.ReactNode;
}

const KeyBadge: React.FC<KeyBadgeProps> = ({ label, active, color, glow, children }) => {
  const palette =
    color === 'gold'
      ? 'from-amber-300 via-orange-400 to-orange-600'
      : color === 'red'
      ? 'from-rose-400 via-red-500 to-red-700'
      : color === 'cyan'
      ? 'from-teal-400 via-cyan-500 to-cyan-700'
      : 'from-sky-400 via-blue-500 to-blue-700';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-arcade text-[11px] sm:text-xs text-white text-stroke-dark leading-none">
        {label}
      </span>
      <div
        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border-[3px] border-[#0b1633] bg-gradient-to-b ${palette} flex items-center justify-center text-white shadow-md transition-transform duration-75 ${
          active ? 'translate-y-1 brightness-125 scale-95' : ''
        } ${glow ? 'animate-pulse-glow ring-2 ring-yellow-300' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};
