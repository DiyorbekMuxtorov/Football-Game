import React, { useEffect, useRef } from 'react';
import { Home, Play, Shirt, Trophy } from 'lucide-react';
import { ARENA } from '../game/characters';
import { drawStadiumBackground } from '../game/renderer';
import { CharacterDef, GraphicsQuality, MatchResult, RivalrySeries, StadiumTheme } from '../game/types';
import { AnimatedCharacterCanvas } from './CharacterAvatar';

interface VictoryScreenProps {
  result: MatchResult;
  p1Character: CharacterDef;
  p2Character: CharacterDef;
  stadiumTheme: StadiumTheme;
  graphicsQuality: GraphicsQuality;
  bestScoreRecord: number;
  totalGoals?: number;
  rivalrySeries?: RivalrySeries;
  onPlayAgain: () => void;
  onSelectPlayers?: () => void;
  onMainMenu: () => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vRot: number;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  result,
  p1Character,
  p2Character,
  stadiumTheme,
  graphicsQuality,
  bestScoreRecord,
  totalGoals = 0,
  rivalrySeries,
  onPlayAgain,
  onSelectPlayers,
  onMainMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { winner, p1Score, p2Score, wasOvertime, durationSeconds, p1Stats, p2Stats } = result;
  const winnerChar = winner === 1 ? p1Character : p2Character;
  const loserChar = winner === 1 ? p2Character : p1Character;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = ARENA.width;
    canvas.height = ARENA.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#facc15', '#38bdf8', '#ef4444', '#4ade80', '#f472b6', '#ffffff'];
    const confetti: ConfettiPiece[] = Array.from({ length: 85 }, (_, i) => ({
      x: Math.random() * ARENA.width,
      y: Math.random() * ARENA.height - ARENA.height,
      vx: (Math.random() - 0.5) * 90,
      vy: 110 + Math.random() * 140,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 8,
    }));

    let rafId = 0;
    let last = performance.now();
    const start = last;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const t = (now - start) / 1000;

      ctx.clearRect(0, 0, ARENA.width, ARENA.height);
      drawStadiumBackground(
        ctx,
        t,
        0.55,
        {
          leftRipple: 0,
          rightRipple: 0,
          leftY: 490,
          rightY: 490,
        },
        stadiumTheme,
        graphicsQuality
      );

      for (const c of confetti) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vRot * dt;
        if (c.y > ARENA.height + 20) {
          c.y = -20;
          c.x = Math.random() * ARENA.width;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size, -c.size * 0.45, c.size * 2, c.size * 0.9);
        ctx.restore();
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [stadiumTheme, graphicsQuality]);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between py-4 sm:py-6 px-4 sm:px-8">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/42 pointer-events-none" />

      {/* Top Winner Banner */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="font-arcade text-4xl sm:text-6xl font-black tracking-tight text-stroke-heavy text-center"
          style={{
            background: 'linear-gradient(180deg, #fef08a 0%, #facc15 55%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PLAYER {winner} WINS!
        </div>
        {wasOvertime ? (
          <div className="mt-1 px-4 py-0.5 rounded-xl bg-amber-500 border-2 border-[#0b1633] font-arcade text-xs sm:text-sm text-[#0b1633]">
            GOLDEN GOAL OVERTIME VICTORY · {durationSeconds}s
          </div>
        ) : (
          <div className="mt-1 px-3 py-0.5 rounded-lg bg-slate-950/75 border border-sky-400/35 font-arcade text-[11px] text-sky-200">
            FULL TIME · {durationSeconds}s MATCH
          </div>
        )}
      </div>

      {/* Center Stage: Winner | Score & Match Stats | Loser */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-around gap-3 my-auto">
        <div className="hidden sm:flex flex-col items-center">
          <AnimatedCharacterCanvas
            character={winnerChar}
            facing={1}
            expression="happy"
            scale={1.85}
            width={220}
            height={270}
          />
          <div className="px-4 py-1 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-[#0b1633] font-arcade text-sm text-[#0b1633] shadow-lg">
            {winnerChar.shortName} · WINNER
          </div>
        </div>

          {/* Score + Stats Card */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="px-10 sm:px-14 py-3.5 rounded-3xl bg-slate-950/88 border-[4px] border-sky-300/60 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-center">
            <div className="text-xs font-arcade text-sky-300 mb-1">
              {p1Character.shortName} vs {p2Character.shortName}
            </div>
            <div className="font-arcade text-5xl sm:text-7xl text-white text-stroke-dark tabular-nums whitespace-nowrap">
              {p1Score} - {p2Score}
            </div>
            {rivalrySeries && rivalrySeries.matchesPlayed > 0 && (
              <div className="mt-1.5 inline-block px-3 py-0.5 rounded-lg bg-slate-900 border border-amber-400/40 font-arcade text-[11px] text-amber-300">
                SERIES: 1P {rivalrySeries.p1Wins} - {rivalrySeries.p2Wins} 2P
              </div>
            )}
          </div>

          {/* Match Statistics Breakdown */}
          <div className="w-full min-w-[270px] sm:min-w-[330px] rounded-2xl bg-slate-950/85 border-2 border-sky-400/35 px-4 py-3 text-xs sm:text-sm shadow-xl">
            <div className="flex items-center justify-between font-arcade text-slate-400 text-[11px] pb-1.5 border-b border-slate-800">
              <span className="text-sky-300">1P</span>
              <span>MATCH STATS</span>
              <span className="text-rose-400">2P</span>
            </div>
            <div className="space-y-1 pt-2 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.shots}</span>
                <span className="text-slate-300 font-medium">Shots</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.shots}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.headers}</span>
                <span className="text-slate-300 font-medium">Headers</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.headers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.saves}</span>
                <span className="text-sky-300 font-medium">Saves</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.saves}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.blocks}</span>
                <span className="text-slate-300 font-medium">Blocks</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.blocks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.tackles}</span>
                <span className="text-slate-300 font-medium">Tackles</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.tackles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-arcade text-white w-10">{p1Stats.specialsUsed}</span>
                <span className="text-slate-300 font-medium">Special Shots</span>
                <span className="font-arcade text-white w-10 text-right">{p2Stats.specialsUsed}</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-center gap-3 text-xs text-amber-300">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Best: {bestScoreRecord}
              </span>
              {totalGoals > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-sky-300">Total Goals: {totalGoals}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-center">
          <AnimatedCharacterCanvas
            character={loserChar}
            facing={-1}
            expression="sad"
            scale={1.75}
            width={220}
            height={270}
          />
          <div className="px-4 py-1 rounded-xl bg-slate-800/90 border-2 border-[#0b1633] font-arcade text-sm text-slate-300 shadow-lg">
            {loserChar.shortName}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onPlayAgain}
          className="arcade-btn px-7 py-3 rounded-2xl bg-gradient-to-b from-lime-400 via-green-500 to-green-600 flex items-center gap-2.5 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white text-white shrink-0" />
          <span className="font-arcade text-lg sm:text-2xl text-white text-stroke-dark whitespace-nowrap">
            Rematch
          </span>
        </button>

        {onSelectPlayers && (
          <button
            type="button"
            onClick={onSelectPlayers}
            className="arcade-btn px-6 py-3 rounded-2xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-600 flex items-center gap-2.5 cursor-pointer"
          >
            <Shirt className="w-5 h-5 text-white shrink-0" />
            <span className="font-arcade text-lg sm:text-xl text-white text-stroke-dark whitespace-nowrap">
              Change Players
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onMainMenu}
          className="arcade-btn px-7 py-3 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 flex items-center gap-2.5 cursor-pointer"
        >
          <Home className="w-5 h-5 text-white shrink-0" />
          <span className="font-arcade text-lg sm:text-xl text-white text-stroke-dark whitespace-nowrap">
            Main Menu
          </span>
        </button>
      </div>
    </div>
  );
};
