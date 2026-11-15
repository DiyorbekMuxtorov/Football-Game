import React, { useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Play, Settings, Shirt, Trophy, Users } from 'lucide-react';
import { ARENA } from '../game/characters';
import { drawStadiumBackground } from '../game/renderer';
import { CharacterDef, GraphicsQuality, MatchHistoryEntry, StadiumTheme } from '../game/types';
import { AnimatedCharacterCanvas } from './CharacterAvatar';

interface MainMenuProps {
  p1Character: CharacterDef;
  p2Character: CharacterDef;
  stadiumTheme: StadiumTheme;
  graphicsQuality: GraphicsQuality;
  bestScoreRecord: number;
  totalGoals?: number;
  matchesPlayed?: number;
  recentMatches: MatchHistoryEntry[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onPlayQuick: () => void;
  onTwoPlayers: () => void;
  onOpenSettings: () => void;
  onOpenSelect: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  p1Character,
  p2Character,
  stadiumTheme,
  graphicsQuality,
  bestScoreRecord,
  totalGoals = 0,
  matchesPlayed = 0,
  recentMatches,
  isFullscreen,
  onToggleFullscreen,
  onPlayQuick,
  onTwoPlayers,
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
        graphicsQuality
      );
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [stadiumTheme, graphicsQuality]);

  const latestMatch = recentMatches[0];

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Live Animated Stadium Background */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/45 pointer-events-none" />

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
      <div className="relative z-10 w-full max-w-6xl h-full flex items-center justify-between px-4 sm:px-8 py-4">
        {/* Left Flanking Player */}
        <div className="hidden md:flex flex-col items-center justify-end h-full pb-9 shrink-0">
          <div className="animate-float-slow">
            <AnimatedCharacterCanvas
              character={p1Character}
              facing={1}
              scale={1.95}
              width={250}
              height={325}
            />
          </div>
          <div className="mt-1 px-4 py-1 rounded-xl bg-gradient-to-b from-sky-500 to-blue-700 border-2 border-[#0b1633] shadow-lg font-arcade text-sm tracking-wide text-white">
            1P · {p1Character.shortName}
          </div>
        </div>

        {/* Center Title & 4 Menu Buttons */}
        <div className="flex flex-col items-center justify-center mx-auto max-w-md w-full">
          <div className="relative flex flex-col items-center mb-4 text-center">
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
                width="62"
                height="50"
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
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[335px]">
            <button
              type="button"
              onClick={onPlayQuick}
              className="arcade-btn w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-lime-400 via-green-500 to-green-600 flex items-center justify-center gap-3.5 cursor-pointer"
            >
              <Play className="w-7 h-7 fill-white text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-2xl sm:text-3xl text-white text-stroke-dark whitespace-nowrap">
                PLAY
              </span>
            </button>

            <button
              type="button"
              onClick={onTwoPlayers}
              className="arcade-btn w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Users className="w-6 h-6 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-xl sm:text-2xl text-white text-stroke-dark whitespace-nowrap">
                2 PLAYERS
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="arcade-btn w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-fuchsia-400 via-purple-500 to-purple-700 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Settings className="w-6 h-6 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-xl sm:text-2xl text-white text-stroke-dark whitespace-nowrap">
                SETTINGS
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSelect}
              className="arcade-btn w-full py-3 px-5 rounded-2xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-600 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Shirt className="w-6 h-6 text-white shrink-0 drop-shadow-[0_2px_0_#0b1633]" />
              <span className="font-arcade text-lg sm:text-xl text-white text-stroke-dark whitespace-nowrap">
                CHARACTER SELECTION
              </span>
            </button>
          </div>

          {/* Local Best Record & Last Match Bar */}
          {(bestScoreRecord > 0 || totalGoals > 0 || latestMatch) && (
            <div className="mt-4 px-4 py-2 rounded-xl bg-slate-950/75 border-2 border-[#0b1633] text-xs text-slate-200 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 shadow-md">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">
                Best: <strong className="text-amber-300 tabular-nums">{bestScoreRecord}</strong>
              </span>
              {totalGoals > 0 && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="whitespace-nowrap">
                    Goals: <strong className="text-sky-300 tabular-nums">{totalGoals}</strong>
                    {matchesPlayed > 0 && <span className="text-slate-400"> ({matchesPlayed}G)</span>}
                  </span>
                </>
              )}
              {latestMatch && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="truncate max-w-[180px]">
                    Last: {latestMatch.p1Name} {latestMatch.p1Score}-{latestMatch.p2Score} {latestMatch.p2Name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Flanking Player */}
        <div className="hidden md:flex flex-col items-center justify-end h-full pb-9 shrink-0">
          <div className="animate-float-slow" style={{ animationDelay: '0.6s' }}>
            <AnimatedCharacterCanvas
              character={p2Character}
              facing={-1}
              scale={1.95}
              width={250}
              height={325}
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
