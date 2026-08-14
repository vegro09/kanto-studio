import React from 'react';
import { useEngineStore, type InspectorTab } from '../store/useEngineStore';
import { FontsPanel } from './Panels/FontsPanel';
import { StylesPanel } from './Panels/StylesPanel';
import { EffectsPanel } from './Panels/EffectsPanel';
import { AnimationsPanel } from './Panels/AnimationsPanel';
import { LayersPanel } from './Panels/LayersPanel';
import { 
  Type, 
  Palette, 
  Wand2, 
  Activity, 
  Layers 
} from 'lucide-react';

interface TabItem {
  id: InspectorTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'styles', label: 'Styles', icon: Palette },
  { id: 'effects', label: 'Effects', icon: Wand2 },
  { id: 'animations', label: 'Motion', icon: Activity },
  { id: 'layers', label: 'Layers', icon: Layers },
];

export const Inspector: React.FC = () => {
  const { activeTab, setActiveTab, layers } = useEngineStore();

  return (
    <div className="w-full flex flex-col h-full select-none overflow-hidden bg-transparent">
      {/* Black & White Tab Bar */}
      <div className="h-9 bg-[#1E191C] border-b border-white/10 flex items-center px-1.5 gap-1 overflow-x-auto scrollbar-none shrink-0 w-full">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'layers' && (
                <span className={`text-[9px] px-1 rounded font-mono ml-0.5 ${isSelected ? 'bg-black text-white' : 'bg-black/40 text-zinc-400'}`}>
                  {layers.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto relative bg-transparent custom-scrollbar w-full">
        {activeTab === 'fonts' && <FontsPanel />}
        {activeTab === 'styles' && <StylesPanel />}
        {activeTab === 'effects' && <EffectsPanel />}
        {activeTab === 'animations' && <AnimationsPanel />}
        {activeTab === 'layers' && <LayersPanel />}
      </div>
    </div>
  );
};
