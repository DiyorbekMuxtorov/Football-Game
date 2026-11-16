import React from 'react';
import {
  ArrowLeft,
  Home,
  Maximize2,
  Minimize2,
  Music,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  Zap,
} from 'lucide-react';
import { DEFAULT_SETTINGS, STADIUM_META } from '../game/characters';
import { BallDesign, GameSettings, GraphicsQuality, StadiumTheme } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  inMatch: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUpdateSettings: (next: GameSettings) => void;
  onBack: () => void;
  onRestartMatch: () => void;
  onMainMenu: () => void;
}

const STADIUM_THEMES: StadiumTheme[] = ['international', 'night', 'indoor', 'futuristic'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  inMatch,
  isFullscreen,
  onToggleFullscreen,
  onUpdateSettings,
  onBack,
  onRestartMatch,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border-[4px] border-[#0b1633] bg-gradient-to-b from-[#16367a] via-[#10275c] to-[#0a193d] shadow-[0_20px_60px_rgba(0,0,0,0.68)] p-5 sm:p-7 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <button
            type="button"
            onClick={onBack}
            aria-label={inMatch ? 'Resume Match' : 'Back'}
            className="arcade-btn w-11 h-11 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-[#0b1633] stroke-[3]" />
          </button>

          <div className="ribbon-banner px-8 sm:px-12 py-1.5 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-600 to-blue-800">
            <h2 className="font-arcade text-xl sm:text-3xl text-white text-stroke-dark whitespace-nowrap">
              {inMatch ? 'PAUSED · SETTINGS' : 'SETTINGS'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="arcade-btn w-11 h-11 rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 flex items-center justify-center cursor-pointer shrink-0"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 border-2 border-sky-400/25 rounded-2xl p-4 sm:p-5 mb-4">
          {/* Audio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-sky-300 shrink-0" />
                <span className="font-arcade text-base text-white text-stroke-dark">Music</span>
              </div>
              <div className="flex items-center rounded-xl overflow-hidden border-2 border-[#0b1633] bg-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, musicEnabled: true })}
                  className={`px-3.5 py-1 font-arcade text-xs cursor-pointer ${
                    settings.musicEnabled
                      ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, musicEnabled: false })}
                  className={`px-3.5 py-1 font-arcade text-xs cursor-pointer ${
                    !settings.musicEnabled
                      ? 'bg-gradient-to-b from-rose-500 to-red-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-300 w-16 shrink-0">Music Vol</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.musicVolume * 100)}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, musicVolume: Number(e.target.value) / 100 })
                }
                aria-label="Music Volume"
                className="w-full h-2.5 rounded-full appearance-none bg-slate-900 border border-[#0b1633] accent-sky-400 cursor-pointer"
              />
              <span className="font-arcade text-xs text-sky-300 tabular-nums w-9 text-right">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="font-arcade text-base text-white text-stroke-dark">Sound FX</span>
              </div>
              <div className="flex items-center rounded-xl overflow-hidden border-2 border-[#0b1633] bg-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, soundEnabled: true })}
                  className={`px-3.5 py-1 font-arcade text-xs cursor-pointer ${
                    settings.soundEnabled
                      ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, soundEnabled: false })}
                  className={`px-3.5 py-1 font-arcade text-xs cursor-pointer ${
                    !settings.soundEnabled
                      ? 'bg-gradient-to-b from-rose-500 to-red-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-300 w-16 shrink-0">SFX Vol</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.sfxVolume * 100)}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sfxVolume: Number(e.target.value) / 100 })
                }
                aria-label="Sound Effects Volume"
                className="w-full h-2.5 rounded-full appearance-none bg-slate-900 border border-[#0b1633] accent-amber-400 cursor-pointer"
              />
              <span className="font-arcade text-xs text-amber-300 tabular-nums w-9 text-right">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>

            {/* Stamina & Sprint System Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-sky-200">Stamina & Burst</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, staminaEnabled: val })}
                    className={`py-1 px-2.5 rounded-lg border-2 border-[#0b1633] font-arcade text-[11px] cursor-pointer ${
                      settings.staminaEnabled === val
                        ? 'bg-gradient-to-b from-emerald-400 to-green-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {val ? 'ON' : 'OFF'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Match & Visual Options */}
          <div className="space-y-2.5">
            <div>
              <div className="text-xs font-bold text-sky-200 mb-1">Match Duration</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([60, 90, 120] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, matchDuration: dur })}
                    className={`py-1 px-2 rounded-lg border-2 border-[#0b1633] font-arcade text-xs cursor-pointer ${
                      settings.matchDuration === dur
                        ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-sky-200 mb-1">Stadium Arena</div>
              <div className="grid grid-cols-2 gap-1.5">
                {STADIUM_THEMES.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, stadiumTheme: theme })}
                    className={`py-1 px-2 rounded-lg border-2 border-[#0b1633] font-arcade text-[11px] cursor-pointer ${
                      settings.stadiumTheme === theme
                        ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {STADIUM_META[theme].shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-sky-200 mb-1">Football Design</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'classic', label: 'Classic' },
                    { id: 'gold', label: 'Pro Gold' },
                    { id: 'neon', label: 'Neon' },
                  ] as { id: BallDesign; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, ballDesign: item.id })}
                    className={`py-1 px-2 rounded-lg border-2 border-[#0b1633] font-arcade text-xs cursor-pointer ${
                      settings.ballDesign === item.id
                        ? 'bg-gradient-to-b from-amber-300 to-orange-500 text-[#0b1633]'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-300" />
                <span className="text-xs font-bold text-sky-200">Graphics</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['high', 'medium'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                    className={`py-1 px-3 rounded-lg border-2 border-[#0b1633] font-arcade text-xs uppercase cursor-pointer ${
                      settings.graphicsQuality === q
                        ? 'bg-gradient-to-b from-lime-400 to-green-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Tactical Controls Instructions */}
        <div className="bg-slate-950/50 border border-sky-400/20 rounded-xl px-4 py-2.5 mb-5 text-xs text-slate-200 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-arcade text-sky-300 mr-1.5">1P:</span>
              <span>A/D Move · W Jump · S Block/Tackle · F Shoot</span>
            </div>
            <div>
              <span className="font-arcade text-rose-400 mr-1.5">2P:</span>
              <span>←/→ Move · ↑ Jump · ↓ Block/Tackle · L Shoot</span>
            </div>
          </div>
          <div className="text-[11px] text-amber-200/90">
            Tips: Hold Shoot for Power / Perfect Timing · Feint or Turn+Shoot = Curved Spin · Defend+Shoot = Low · Jump+Shoot = Lob · Tap S/↓ = Timed Parry · S/↓+Move = Slide Tackle!
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {inMatch && (
            <button
              type="button"
              onClick={onBack}
              className="arcade-btn px-5 py-2.5 rounded-2xl bg-gradient-to-b from-lime-400 via-green-500 to-green-600 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white text-white shrink-0" />
              <span className="font-arcade text-base text-white text-stroke-dark whitespace-nowrap">
                Resume
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestartMatch}
            className="arcade-btn px-5 py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-white shrink-0" />
            <span className="font-arcade text-base text-white text-stroke-dark whitespace-nowrap">
              Restart Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ ...DEFAULT_SETTINGS })}
            className="arcade-btn px-4 py-2.5 rounded-2xl bg-gradient-to-b from-slate-600 to-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <span className="font-arcade text-sm text-white text-stroke-dark whitespace-nowrap">
              Reset Defaults
            </span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="arcade-btn px-5 py-2.5 rounded-2xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-600 flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5 text-white shrink-0" />
            <span className="font-arcade text-base text-white text-stroke-dark whitespace-nowrap">
              Main Menu
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
