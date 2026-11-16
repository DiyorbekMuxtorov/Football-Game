import React, { useEffect, useRef } from 'react';
import {
  Dumbbell,
  Maximize2,
  Minimize2,
  Play,
  Settings,
  Shirt,
  SlidersHorizontal,
  Swords,
  Trophy,
} from 'lucide-react';
import { ARENA } from '../game/characters';
import { drawStadiumBackground } from '../game/renderer';
import {
  CharacterDef,
  GraphicsQuality,
  HeadToHeadRecord,
  MatchHistoryEntry,
  MatchMode,
  StadiumTheme,
} from '../game/types';
import { AnimatedCharacterCanvas } from './CharacterAvatar';

interface MainMenuProps {
  p1Character: CharacterDef;
  p2Character: CharacterDef;
  stadiumTheme: StadiumTheme;
  graphicsQuality: GraphicsQuality;
  headToHead: HeadToHeadRecord;
  recentMatches: MatchHistoryEntry[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onStartMode: (mode: MatchMode) => void;
  onOpenSettings: () => void;
  onOpenSelect: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  p1Character,
  p2Character,
  stadiumTheme,
  graphicsQuality,
  headToHead,
  recentMatches,
  isFullscreen,
  onToggleFullscreen,
  onStartMode,
  onOpenSettings,
  onOpenSelect,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    canvas.width = ARENA.width;
    canvas.height = ARENA.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, ARENA.width, ARENA.height);
      drawStadiumBackground(
        ctx,
        t,
        0.16,
        {
          leftRipple: 0,
          rightRipple: 0,
          leftY: 490,
          rightY: 490,
        },
        stadiumTheme,
        graphicsQuality,
        false,
        0,
        {
          p1Score: headToHead.p1Wins,
          p2Score: headToHead.p2Wins,
          clockText: '1V1',
          label: 'ALL-TIME 1P vs 2P WINS',
        }
      );
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [stadiumTheme, graphicsQuality, headToHead.p1Wins, headToHead.p2Wins]);

  const latestMatch = recentMatches[0];
  const totalGoals = headToHead.p1Goals + headToHead.p2Goals;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Live Animated Stadium Background */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/55 pointer-events-none" />

      {/* Top-Right Fullscreen Button */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        className="arcade-btn absolute top-4 right-4 z-20 w-11 h-11 rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 flex items-center justify-center cursor-pointer"
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-white" />
        ) : (
          <Maximize2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl h-full flex items-center justify-between px-4 sm:px-8 py-3">
        {/* Left Flanking Player */}
        <div className="hidden md:flex flex-col items-center justify-end h-full pb-8 shrink-0">
          <div className="animate-float-slow">
            <AnimatedCharacterCanvas
              character={p1Character}
              facing={1}
              scale={1.9}
              width={240}
              height={315}
            />
          </div>
          <div className="mt-1 px-4 py-1 rounded-xl bg-gradient-to-b from-sky-500 to-blue-700 border-2 border-[#0b1633] shadow-lg font-arcade text-sm tracking-wide text-white">
            1P · {p1Character.shortName}
          </div>
        </div>

        {/* Center Title & Competitive 1v1 Modes */}
        <div className="flex flex-col items-center justify-center mx-auto max-w-md w-full">
          <div className="relative flex flex-col items-center mb-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className="font-arcade text-5xl sm:text-6xl font-black tracking-tight text-stroke-heavy"
                style={{
                  background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 55%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SUPER
              </span>
              <svg
                width="58"
                height="46"
                viewBox="0 0 72 58"
                className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] -ml-1"
              >
                <path
                  d="M28 16C42 8 60 12 68 8C62 18 68 22 60 28C66 32 54 40 44 38Z"
                  fill="#f97316"
                  stroke="#0b1633"
                  strokeWidth="2.5"
                />
                <path d="M30 20C42 15 54 18 58 15C54 22 57 25 50 29Z" fill="#fde047" />
                <circle cx="24" cy="28" r="18" fill="#ffffff" stroke="#0b1633" strokeWidth="3.5" />
                <polygon points="24,18 31,23 28,32 20,32 17,23" fill="#0f172a" />
                <line x1="24" y1="18" x2="24" y2="10" stroke="#334155" strokeWidth="2.2" />
                <line x1="31" y1="23" x2="40" y2="20" stroke="#334155" strokeWidth="2.2" />
                <line x1="17" y1="23" x2="8" y2="20" stroke="#334155" strokeWidth="2.2" />
                <line x1="28" y1="32" x2="34" y2="42" stroke="#334155" strokeWidth="2.2" />
                <line x1="20" y1="32" x2="14" y2="42" stroke="#334155" strokeWidth="2.2" />
              </svg>
            </div>
            <h1 className="font-arcade text-4xl sm:text-5xl font-black tracking-tight text-white text-stroke-heavy -mt-2 whitespace-nowrap">
              HEAD FOOTBALL
            </h1>
            <div className="mt-1 text-[11px] font-arcade tracking-widest text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]">
              LOCAL 1V1 · SHARED KEYBOARD EVOLUTION
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full max-w-[350px]">
            {/* Primary Quick Duel */}
            <button
              type="button"
              onClick={() => onStartMode('quick')}
              className="arcade-btn w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-lime-400 via-green-500 to-green-600 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-2xl text-white text-stroke-dark whitespace-nowrap">
                QUICK DUEL
              </span>
            </button>

            {/* Competitive 1v1 Modes Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onStartMode('best_of_3')}
                className="arcade-btn py-2.5 px-3 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Swords className="w-5 h-5 text-amber-300 shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
                <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
                  BEST OF 3
                </span>
              </button>

              <button
                type="button"
                onClick={() => onStartMode('custom')}
                className="arcade-btn py-2.5 px-3 rounded-2xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
                <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
                  CUSTOM DUEL
                </span>
              </button>
            </div>

            {/* Training Arena & Squad Selection Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onStartMode('training')}
                className="arcade-btn py-2.5 px-3 rounded-2xl bg-gradient-to-b from-teal-400 via-emerald-500 to-emerald-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Dumbbell className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
                <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
                  TRAINING
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenSelect}
                className="arcade-btn py-2.5 px-3 rounded-2xl bg-gradient-to-b from-indigo-400 via-indigo-600 to-indigo-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shirt className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
                <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
                  PLAYERS
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="arcade-btn w-full py-2.5 px-6 rounded-2xl bg-gradient-to-b from-fuchsia-400 via-purple-500 to-purple-700 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Settings className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-lg text-white text-stroke-dark whitespace-nowrap">
                SETTINGS & CONTROLS
              </span>
            </button>
          </div>

          {/* Persistent 1v1 Head-to-Head Record Bar */}
          <div className="mt-3.5 w-full max-w-[350px] px-3.5 py-2 rounded-2xl bg-slate-950/82 border-2 border-[#0b1633] text-xs text-slate-200 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-arcade text-amber-300">
                <Trophy className="w-4 h-4 shrink-0" />
                <span>HEAD-TO-HEAD</span>
              </div>
              <div className="font-arcade text-sm tabular-nums">
                <span className="text-sky-300">1P {headToHead.p1Wins}</span>
                <span className="text-slate-500 mx-1.5">-</span>
                <span className="text-rose-400">{headToHead.p2Wins} 2P</span>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 text-[11px] text-slate-300">
              <span>
                Matches: <strong className="text-white tabular-nums">{headToHead.totalMatches}</strong>
              </span>
              <span>
                Goals: <strong className="text-sky-300 tabular-nums">{totalGoals}</strong>
              </span>
              <span>
                Best: <strong className="text-amber-300 tabular-nums">{headToHead.bestSingleScore}</strong>
              </span>
            </div>
            {latestMatch && (
              <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400 text-center truncate">
                Last: <span className="text-slate-200">{latestMatch.p1Name} {latestMatch.p1Score}-{latestMatch.p2Score} {latestMatch.p2Name}</span>
                {latestMatch.wasOvertime ? ' (OT)' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Right Flanking Player */}
        <div className="hidden md:flex flex-col items-center justify-end h-full pb-8 shrink-0">
          <div className="animate-float-slow" style={{ animationDelay: '0.6s' }}>
            <AnimatedCharacterCanvas
              character={p2Character}
              facing={-1}
              scale={1.9}
              width={240}
              height={315}
            />
          </div>
          <div className="mt-1 px-4 py-1 rounded-xl bg-gradient-to-b from-rose-500 to-red-700 border-2 border-[#0b1633] shadow-lg font-arcade text-sm tracking-wide text-white">
            2P · {p2Character.shortName}
          </div>
        </div>
      </div>
    </div>
  );
};
