import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Stage } from './components/Canvas/Stage';
import { TimelineBar } from './components/Canvas/TimelineBar';
import { Inspector } from './components/Inspector';
import { ExportModal } from './components/ExportModal';
import { useEngineStore } from './store/useEngineStore';

export const App: React.FC = () => {
  const { isPlaying, setIsPlaying } = useEngineStore();

  // Spacebar hotkey to toggle Play / Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying]);

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header />

      {/* Main Workspace Area: Stage & Inspector */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left / Center: Interactive Stage Canvas */}
        <Stage />

        {/* Right: CapCut-Style Tabbed Inspector */}
        <Inspector />
      </div>

      {/* Bottom: Playhead & Motion Timeline Bar */}
      <TimelineBar />

      {/* Modals & Overlays */}
      <ExportModal />
    </div>
  );
};

export default App;
