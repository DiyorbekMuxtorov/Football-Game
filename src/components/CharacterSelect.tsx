import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lock, Play } from 'lucide-react';
import { ARENA, CHARACTERS } from '../game/characters';
import { drawStadiumBackground } from '../game/renderer';
import { CharacterDef, GameSettings, StadiumTheme } from '../game/types';
import { AnimatedCharacterCanvas, CharacterAvatar } from './CharacterAvatar';

interface CharacterSelectProps {
  p1Character: CharacterDef;
  p2Character: CharacterDef;
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onSelectP1: (char: CharacterDef) => void;
  onSelectP2: (char: CharacterDef) => void;
  onStartMatch: () => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  p1Character,
  p2Character,
  settings,
  onUpdateSettings,
  onSelectP1,
  onSelectP2,
  onStartMatch,
  onBack,
}) => {
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
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
    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, ARENA.width, ARENA.height);
      drawStadiumBackground(
        ctx,
        t,
        0.12,
        {
          leftRipple: 0,
          rightRipple: 0,
          leftY: 490,
          rightY: 490,
        },
        settings.stadiumTheme,
        settings.graphicsQuality
      );
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [settings.stadiumTheme, settings.graphicsQuality]);

  const handleCardClick = (char: CharacterDef) => {
    if (activeSlot === 1) {
      if (char.id === p2Character.id) return;
      onSelectP1(char);
      setActiveSlot(2);
    } else {
      if (char.id === p1Character.id) return;
      onSelectP2(char);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between py-3 sm:py-4 px-3 sm:px-6">
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Main Menu"
          className="arcade-btn w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 flex items-center justify-center cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-6 h-6 text-[#0b1633] stroke-[3]" />
        </button>

        <div className="ribbon-banner px-6 sm:px-12 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-600 to-blue-800">
          <h2 className="font-arcade text-lg sm:text-3xl text-white text-stroke-dark whitespace-nowrap">
            SELECT YOUR PLAYER
          </h2>
        </div>

        {/* Custom Match Duration & Theme Quick Selector */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-sky-400/30 rounded-xl p-1.5">
          {([60, 90, 120] as const).map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => onUpdateSettings({ ...settings, matchDuration: dur })}
              className={`px-2.5 py-1 rounded-lg font-arcade text-xs cursor-pointer ${
                settings.matchDuration === dur
                  ? 'bg-amber-400 text-[#0b1633]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {dur}s
            </button>
          ))}
          <span className="text-slate-600">|</span>
          {(['night', 'sunset', 'daylight'] as StadiumTheme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onUpdateSettings({ ...settings, stadiumTheme: theme })}
              className={`px-2 py-1 rounded-lg font-arcade text-[10px] uppercase cursor-pointer ${
                settings.stadiumTheme === theme
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* Main Selection Layout: 1P Live Preview | 5x2 Roster Grid | 2P Live Preview */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-center gap-4 my-auto py-1">
        {/* 1P Live Preview */}
        <div
          onClick={() => setActiveSlot(1)}
          className={`hidden lg:flex flex-col items-center p-3 rounded-3xl border-[3px] cursor-pointer transition-all w-[210px] shrink-0 ${
            activeSlot === 1
              ? 'border-yellow-400 bg-slate-900/85 shadow-[0_0_24px_rgba(250,204,21,0.45)]'
              : 'border-sky-400/40 bg-slate-900/65 hover:border-sky-300'
          }`}
        >
          <span className="px-3 py-0.5 rounded-lg bg-gradient-to-b from-sky-400 to-blue-700 border-2 border-[#0b1633] font-arcade text-xs text-white mb-1">
            PLAYER 1
          </span>
          <AnimatedCharacterCanvas
            character={p1Character}
            facing={1}
            scale={1.4}
            width={170}
            height={210}
          />
          <div className="text-center mt-1">
            <div className="font-arcade text-base text-white truncate max-w-[180px]">
              {p1Character.name}
            </div>
            <div className="text-xs text-sky-300 font-medium">
              #{p1Character.number} · {p1Character.nationality} · {p1Character.signatureTag}
            </div>
          </div>
        </div>

        {/* 5 x 2 Character Cards Grid */}
        <div className="flex-1 max-w-3xl grid grid-cols-5 gap-2 sm:gap-3">
          {CHARACTERS.map((char) => {
            const isP1 = char.id === p1Character.id;
            const isP2 = char.id === p2Character.id;
            const isTakenByOther = (activeSlot === 1 && isP2) || (activeSlot === 2 && isP1);

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleCardClick(char)}
                disabled={isTakenByOther}
                className={`group relative rounded-2xl overflow-hidden border-[3px] transition-all duration-150 flex flex-col items-stretch text-center ${
                  isP1
                    ? 'border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.75)] scale-[1.03] bg-slate-900'
                    : isP2
                    ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.75)] scale-[1.03] bg-slate-900'
                    : 'border-sky-300/70 bg-slate-900/90 hover:border-white hover:-translate-y-1'
                } ${isTakenByOther ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
              >
                {isP1 && (
                  <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded-md bg-gradient-to-b from-sky-400 to-blue-700 border-2 border-[#0b1633] font-arcade text-[10px] text-white shadow">
                    1P
                  </div>
                )}
                {isP2 && (
                  <div className="absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded-md bg-gradient-to-b from-rose-400 to-red-700 border-2 border-[#0b1633] font-arcade text-[10px] text-white shadow">
                    2P
                  </div>
                )}
                {isTakenByOther && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] font-bold text-slate-200 flex items-center gap-1 whitespace-nowrap">
                    <Lock className="w-3 h-3" /> Taken
                  </div>
                )}

                <div className="relative w-full aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                  <CharacterAvatar
                    character={char}
                    size={130}
                    expression={isP1 || isP2 ? 'happy' : 'normal'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div
                  className={`py-1 px-1 font-arcade text-[10px] sm:text-xs tracking-tight border-t-2 border-[#0b1633] truncate ${
                    isP1
                      ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-[#0b1633]'
                      : isP2
                      ? 'bg-gradient-to-b from-red-500 to-red-700 text-white'
                      : 'bg-gradient-to-b from-slate-800 to-slate-950 text-white'
                  }`}
                >
                  {char.shortName}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2P Live Preview */}
        <div
          onClick={() => setActiveSlot(2)}
          className={`hidden lg:flex flex-col items-center p-3 rounded-3xl border-[3px] cursor-pointer transition-all w-[210px] shrink-0 ${
            activeSlot === 2
              ? 'border-yellow-400 bg-slate-900/85 shadow-[0_0_24px_rgba(239,68,68,0.45)]'
              : 'border-rose-400/40 bg-slate-900/65 hover:border-rose-300'
          }`}
        >
          <span className="px-3 py-0.5 rounded-lg bg-gradient-to-b from-rose-400 to-red-700 border-2 border-[#0b1633] font-arcade text-xs text-white mb-1">
            PLAYER 2
          </span>
          <AnimatedCharacterCanvas
            character={p2Character}
            facing={-1}
            scale={1.4}
            width={170}
            height={210}
          />
          <div className="text-center mt-1">
            <div className="font-arcade text-base text-white truncate max-w-[180px]">
              {p2Character.name}
            </div>
            <div className="text-xs text-rose-300 font-medium">
              #{p2Character.number} · {p2Character.nationality} · {p2Character.signatureTag}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 1P/2P Selector + Kick Off CTA */}
      <div className="relative z-10 w-full max-w-5xl flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={() => setActiveSlot(1)}
          className={`arcade-btn px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer ${
            activeSlot === 1
              ? 'bg-gradient-to-b from-sky-400 to-blue-600 ring-4 ring-yellow-300'
              : 'bg-gradient-to-b from-slate-700 to-slate-800 opacity-85 hover:opacity-100'
          }`}
        >
          <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
            1P: {p1Character.shortName}
          </span>
        </button>

        <button
          type="button"
          onClick={onStartMatch}
          className="arcade-btn px-8 py-2.5 rounded-2xl bg-gradient-to-b from-lime-400 via-green-500 to-green-600 flex items-center gap-2.5 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white text-white shrink-0" />
          <span className="font-arcade text-lg sm:text-2xl text-white text-stroke-dark whitespace-nowrap">
            KICK OFF ({settings.matchDuration}s)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSlot(2)}
          className={`arcade-btn px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer ${
            activeSlot === 2
              ? 'bg-gradient-to-b from-rose-400 to-red-600 ring-4 ring-yellow-300'
              : 'bg-gradient-to-b from-slate-700 to-slate-800 opacity-85 hover:opacity-100'
          }`}
        >
          <span className="font-arcade text-sm sm:text-base text-white text-stroke-dark whitespace-nowrap">
            2P: {p2Character.shortName}
          </span>
        </button>
      </div>
    </div>
  );
};
