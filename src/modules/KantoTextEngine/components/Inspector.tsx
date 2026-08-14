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
    <aside className="w-80 md:w-96 bg-dark-900 border-l border-dark-750 flex flex-col h-full select-none z-20 shrink-0">
      {/* Black & White Tab Bar */}
      <div className="h-12 bg-black border-b border-dark-750 flex items-center px-2 gap-1 overflow-x-auto scrollbar-none shrink-0">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'layers' && (
                <span className={`text-[10px] px-1 rounded font-mono ml-0.5 ${isSelected ? 'bg-black text-white' : 'bg-dark-800 text-neutral-400'}`}>
                  {layers.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-hidden relative bg-dark-900">
        {activeTab === 'fonts' && <FontsPanel />}
        {activeTab === 'styles' && <StylesPanel />}
        {activeTab === 'effects' && <EffectsPanel />}
        {activeTab === 'animations' && <AnimationsPanel />}
        {activeTab === 'layers' && <LayersPanel />}
      </div>
    </aside>
  );
};
