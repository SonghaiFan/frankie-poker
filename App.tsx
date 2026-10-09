import { GameSettingsProvider, useGameSettings, feltStyle } from "./services/gameSettings";
import { GameSettings } from "./components/GameSettings";
import React, { useState, useCallback } from 'react';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { PokerGame } from './components/PokerGame';
import { LanguageProvider } from './services/i18n';
import { TextureOverlay } from './components/TextureOverlay';
import { GameConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { STARTING_WEALTH, loadWealth, saveWealth } from './services/bankroll';

type ViewState = 'LOGIN' | 'SETUP' | 'GAME';

function AppContent() {
    const { settings } = useGameSettings();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const closeSettings = useCallback(() => setSettingsOpen(false), []);
    const [view, setView] = useState<ViewState>('LOGIN');
    const [isExiting, setIsExiting] = useState(false);
    
    const [user, setUser] = useState<string | null>(null);
    const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
    // The player's bankroll, persisted per name. Buy-ins come out, chips go back.
    const [wealth, setWealth] = useState<number>(0);

    const adjustWealth = useCallback((delta: number) => {
        setWealth(w => {
            const next = Math.max(0, Math.round(w + delta));
            if (user) saveWealth(user, next);
            return next;
        });
    }, [user]);

    // Helper to handle the exit-animation-then-switch flow
    const transitionTo = useCallback((nextView: ViewState, callback?: () => void) => {
        setIsExiting(true);
        // Wait for CSS animation to finish (600ms matches the duration in components)
        setTimeout(() => {
            if (callback) callback();
            setView(nextView);
            setIsExiting(false);
        }, 600);
    }, []);

    const handleLogin = (username: string) => {
        // Transition: Login -> Setup
        transitionTo('SETUP', () => {
            setUser(username);
            setWealth(loadWealth(username));
            setConfig(prev => ({ ...prev, playerName: username }));
        });
    };

    // Broke? The house stakes you back to the starting bankroll.
    const handleTopUp = () => adjustWealth(STARTING_WEALTH - wealth);

    const handleStartGame = (newConfig: GameConfig) => {
        if (newConfig.startingStackHuman > wealth) return; // the venue is locked
        // Transition: Setup -> Game; the buy-in leaves the bankroll now
        transitionTo('GAME', () => {
            setConfig(newConfig);
            adjustWealth(-newConfig.startingStackHuman);
        });
    };

    // Leaving the table: whatever chips are in front of the player go back to the bankroll
    const handleExitGame = (chipsOnTable: number) => {
        adjustWealth(chipsOnTable);
        setView('SETUP');
    };

    return (
        <main style={feltStyle(settings.color)} className="w-full h-[100svh] flex flex-col felt-background text-[#e0e0e0] font-sans overflow-hidden relative selection:bg-[#d4af37] selection:text-black">
            <TextureOverlay />
            {settingsOpen && <GameSettings name={view === "LOGIN" ? undefined : user ?? undefined} onClose={closeSettings} />}
            
            {/* View Container */}
            <div className="relative w-full h-full z-10">
                {view === 'LOGIN' && (
                    <LoginPage 
                        onOpenSettings={() => setSettingsOpen(true)}
                        onLogin={handleLogin} 
                        isExiting={isExiting} 
                    />
                )}

                {view === 'SETUP' && (
                    <LandingPage 
                        onOpenSettings={() => setSettingsOpen(true)}
                        onStartGame={handleStartGame} 
                        username={user} 
                        wealth={wealth}
                        onTopUp={handleTopUp}
                        isExiting={isExiting}
                    />
                )}

                {view === 'GAME' && (
                    <PokerGame 
                        config={config} 
                        wealth={wealth}
                        onWealthChange={adjustWealth}
                        onExit={handleExitGame} 
                    />
                )}
            </div>
        </main>
    );
}

function App() {
    return (
        <LanguageProvider>
            <GameSettingsProvider><AppContent /></GameSettingsProvider>
        </LanguageProvider>
    );
}

export default App;