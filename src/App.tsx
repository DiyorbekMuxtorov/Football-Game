import { useCallback, useEffect, useState } from 'react';
import { CharacterSelect } from './components/CharacterSelect';
import { GameArena } from './components/GameArena';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { VictoryScreen } from './components/VictoryScreen';
import { soundEngine } from './game/audio';
import { CHARACTERS, DEFAULT_SETTINGS, normalizeStadiumTheme } from './game/characters';
import {
  CharacterDef,
  GameScreen,
  GameSettings,
  HeadToHeadRecord,
  MatchHistoryEntry,
  MatchMode,
  MatchResult,
  PlayerCareerStats,
  RivalrySeries,
} from './game/types';

const SETTINGS_STORAGE_KEY = 'super_head_football_settings_v2';
const HISTORY_STORAGE_KEY = 'super_head_football_history_v1';
const CAREER_STORAGE_KEY = 'super_head_football_career_v1';
const H2H_STORAGE_KEY = 'super_head_football_h2h_v1';

function loadInitialSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        musicEnabled: parsed.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled,
        soundEnabled: parsed.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
        musicVolume:
          typeof parsed.musicVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.musicVolume))
            : DEFAULT_SETTINGS.musicVolume,
        sfxVolume:
          typeof parsed.sfxVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.sfxVolume))
            : DEFAULT_SETTINGS.sfxVolume,
        graphicsQuality: parsed.graphicsQuality === 'medium' ? 'medium' : 'high',
        stadiumTheme: normalizeStadiumTheme(parsed.stadiumTheme),
        ballDesign:
          parsed.ballDesign === 'gold' || parsed.ballDesign === 'neon'
            ? parsed.ballDesign
            : 'classic',
        matchDuration:
          parsed.matchDuration === 90 || parsed.matchDuration === 120
            ? parsed.matchDuration
            : DEFAULT_SETTINGS.matchDuration,
        staminaEnabled:
          typeof parsed.staminaEnabled === 'boolean'
            ? parsed.staminaEnabled
            : DEFAULT_SETTINGS.staminaEnabled,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return { ...DEFAULT_SETTINGS };
}

function loadMatchHistory(): MatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 15);
    }
  } catch {
    // Ignore storage read errors
  }
  return [];
}

function loadCareerStats(): Record<string, PlayerCareerStats> {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, PlayerCareerStats>;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

function loadHeadToHead(fallbackHistory: MatchHistoryEntry[]): HeadToHeadRecord {
  try {
    const raw = localStorage.getItem(H2H_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HeadToHeadRecord>;
      return {
        p1Wins: Number(parsed.p1Wins) || 0,
        p2Wins: Number(parsed.p2Wins) || 0,
        totalMatches: Number(parsed.totalMatches) || 0,
        p1Goals: Number(parsed.p1Goals) || 0,
        p2Goals: Number(parsed.p2Goals) || 0,
        overtimeMatches: Number(parsed.overtimeMatches) || 0,
        bestSingleScore: Number(parsed.bestSingleScore) || 0,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  // Seed cleanly from existing history if migrating
  return fallbackHistory.reduce<HeadToHeadRecord>(
    (acc, m) => ({
      p1Wins: acc.p1Wins + (m.winner === 1 ? 1 : 0),
      p2Wins: acc.p2Wins + (m.winner === 2 ? 1 : 0),
      totalMatches: acc.totalMatches + 1,
      p1Goals: acc.p1Goals + m.p1Score,
      p2Goals: acc.p2Goals + m.p2Score,
      overtimeMatches: acc.overtimeMatches + (m.wasOvertime ? 1 : 0),
      bestSingleScore: Math.max(acc.bestSingleScore, m.p1Score, m.p2Score),
    }),
    {
      p1Wins: 0,
      p2Wins: 0,
      totalMatches: 0,
      p1Goals: 0,
      p2Goals: 0,
      overtimeMatches: 0,
      bestSingleScore: 0,
    }
  );
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
  const [history, setHistory] = useState<MatchHistoryEntry[]>(loadMatchHistory);
  const [, setCareerStats] = useState<Record<string, PlayerCareerStats>>(loadCareerStats);
  const [headToHead, setHeadToHead] = useState<HeadToHeadRecord>(() => loadHeadToHead(loadMatchHistory()));
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [matchMode, setMatchMode] = useState<MatchMode>('quick');
  const [p1Character, setP1Character] = useState<CharacterDef>(CHARACTERS[0]);
  const [p2Character, setP2Character] = useState<CharacterDef>(CHARACTERS[1]);

  const [matchKey, setMatchKey] = useState(1);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [rivalrySeries, setRivalrySeries] = useState<RivalrySeries>({
    p1Wins: 0,
    p2Wins: 0,
    matchesPlayed: 0,
    bestOfThreeActive: false,
  });

  const bestScoreRecord = Math.max(
    headToHead.bestSingleScore,
    matchResult ? Math.max(matchResult.p1Score, matchResult.p2Score) : 0
  );
  const totalGoals = headToHead.p1Goals + headToHead.p2Goals;

  // Sync fullscreen state listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Persist settings locally & sync Web Audio
  useEffect(() => {
    soundEngine.updateSettings(settings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage write errors
    }
  }, [settings]);

  // Background music lifecycle
  useEffect(() => {
    if (screen === 'playing' && !settingsOpen && settings.musicEnabled) {
      soundEngine.startMusic();
    } else {
      soundEngine.stopMusic();
    }
  }, [screen, settingsOpen, settings.musicEnabled]);

  const launchMatch = useCallback((mode: MatchMode, resetBo3: boolean) => {
    soundEngine.unlock();
    soundEngine.playClick();
    setSettingsOpen(false);
    setMatchResult(null);
    setMatchMode(mode);
    if (mode === 'best_of_3') {
      if (resetBo3) {
        setRivalrySeries({
          p1Wins: 0,
          p2Wins: 0,
          matchesPlayed: 0,
          bestOfThreeActive: true,
        });
      }
    } else {
      setRivalrySeries((prev) => ({ ...prev, bestOfThreeActive: false }));
    }
    setMatchKey((k) => k + 1);
    setScreen('playing');
  }, []);

  const handleStartModeFromMenu = useCallback(
    (mode: MatchMode) => {
      if (mode === 'custom') {
        soundEngine.unlock();
        soundEngine.playClick();
        setMatchMode('custom');
        setSettingsOpen(false);
        setScreen('select');
        return;
      }
      launchMatch(mode, mode === 'best_of_3');
    },
    [launchMatch]
  );

  const startCurrentModeMatch = useCallback(() => {
    launchMatch(matchMode, matchMode === 'best_of_3');
  }, [launchMatch, matchMode]);

  const handleVictoryPlayAgain = useCallback(() => {
    if (matchMode === 'best_of_3') {
      const seriesEnded = rivalrySeries.p1Wins >= 2 || rivalrySeries.p2Wins >= 2;
      launchMatch('best_of_3', seriesEnded);
    } else {
      launchMatch(matchMode, false);
    }
  }, [launchMatch, matchMode, rivalrySeries.p1Wins, rivalrySeries.p2Wins]);

  const handleOpenSelect = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    setSettingsOpen(false);
    setScreen('select');
  }, []);

  const handleOpenSettings = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    setSettingsOpen(true);
  }, []);

  const handlePauseToggle = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    setSettingsOpen((open) => !open);
  }, []);

  const handleReturnMainMenu = useCallback(() => {
    soundEngine.playClick();
    setSettingsOpen(false);
    setScreen('menu');
  }, []);

  const handleMatchEnd = useCallback(
    (result: MatchResult) => {
      if (result.mode === 'training') return;

      setMatchResult(result);
      setSettingsOpen(false);
      setScreen('victory');

      const entry: MatchHistoryEntry = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        p1Name: p1Character.shortName,
        p2Name: p2Character.shortName,
        p1Score: result.p1Score,
        p2Score: result.p2Score,
        winner: result.winner,
        wasOvertime: result.wasOvertime,
        mode: result.mode,
      };

      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 15);
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage write errors
        }
        return next;
      });

      setHeadToHead((prev) => {
        const next: HeadToHeadRecord = {
          p1Wins: prev.p1Wins + (result.winner === 1 ? 1 : 0),
          p2Wins: prev.p2Wins + (result.winner === 2 ? 1 : 0),
          totalMatches: prev.totalMatches + 1,
          p1Goals: prev.p1Goals + result.p1Score,
          p2Goals: prev.p2Goals + result.p2Score,
          overtimeMatches: prev.overtimeMatches + (result.wasOvertime ? 1 : 0),
          bestSingleScore: Math.max(prev.bestSingleScore, result.p1Score, result.p2Score),
        };
        try {
          localStorage.setItem(H2H_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage write errors
        }
        return next;
      });

      setCareerStats((prev) => {
        const p1Prev = prev[p1Character.id] ?? { matches: 0, wins: 0, goals: 0 };
        const p2Prev = prev[p2Character.id] ?? { matches: 0, wins: 0, goals: 0 };
        const next: Record<string, PlayerCareerStats> = {
          ...prev,
          [p1Character.id]: {
            matches: p1Prev.matches + 1,
            wins: p1Prev.wins + (result.winner === 1 ? 1 : 0),
            goals: p1Prev.goals + result.p1Score,
          },
          [p2Character.id]: {
            matches: p2Prev.matches + 1,
            wins: p2Prev.wins + (result.winner === 2 ? 1 : 0),
            goals: p2Prev.goals + result.p2Score,
          },
        };
        try {
          localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage write errors
        }
        return next;
      });

      setRivalrySeries((prev) => ({
        p1Wins: prev.p1Wins + (result.winner === 1 ? 1 : 0),
        p2Wins: prev.p2Wins + (result.winner === 2 ? 1 : 0),
        matchesPlayed: prev.matchesPlayed + 1,
        bestOfThreeActive: result.mode === 'best_of_3',
      }));
    },
    [p1Character.id, p1Character.shortName, p2Character.id, p2Character.shortName]
  );

  return (
    <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {screen === 'menu' && (
        <MainMenu
          p1Character={p1Character}
          p2Character={p2Character}
          stadiumTheme={settings.stadiumTheme}
          graphicsQuality={settings.graphicsQuality}
          headToHead={headToHead}
          recentMatches={history}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onStartMode={handleStartModeFromMenu}
          onOpenSettings={handleOpenSettings}
          onOpenSelect={handleOpenSelect}
        />
      )}

      {screen === 'select' && (
        <CharacterSelect
          p1Character={p1Character}
          p2Character={p2Character}
          settings={settings}
          matchMode={matchMode}
          onChangeMode={(m) => {
            soundEngine.unlock();
            soundEngine.playClick();
            setMatchMode(m);
          }}
          onUpdateSettings={(next) => {
            soundEngine.unlock();
            soundEngine.playClick();
            setSettings(next);
          }}
          onSelectP1={(char) => {
            soundEngine.unlock();
            soundEngine.playClick();
            setP1Character(char);
          }}
          onSelectP2={(char) => {
            soundEngine.unlock();
            soundEngine.playClick();
            setP2Character(char);
          }}
          onStartMatch={startCurrentModeMatch}
          onBack={handleReturnMainMenu}
        />
      )}

      {screen === 'playing' && (
        <GameArena
          p1Character={p1Character}
          p2Character={p2Character}
          settings={settings}
          matchMode={matchMode}
          rivalrySeries={rivalrySeries}
          paused={settingsOpen}
          matchKey={matchKey}
          onPauseToggle={handlePauseToggle}
          onMatchEnd={handleMatchEnd}
        />
      )}

      {screen === 'victory' && matchResult && (
        <VictoryScreen
          result={matchResult}
          p1Character={p1Character}
          p2Character={p2Character}
          stadiumTheme={settings.stadiumTheme}
          graphicsQuality={settings.graphicsQuality}
          bestScoreRecord={bestScoreRecord}
          totalGoals={totalGoals}
          rivalrySeries={rivalrySeries}
          onPlayAgain={handleVictoryPlayAgain}
          onSelectPlayers={handleOpenSelect}
          onMainMenu={handleReturnMainMenu}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          inMatch={screen === 'playing'}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onUpdateSettings={(next) => {
            soundEngine.unlock();
            setSettings(next);
          }}
          onBack={() => {
            soundEngine.playClick();
            setSettingsOpen(false);
          }}
          onRestartMatch={() => launchMatch(matchMode, false)}
          onMainMenu={handleReturnMainMenu}
        />
      )}
    </main>
  );
}
