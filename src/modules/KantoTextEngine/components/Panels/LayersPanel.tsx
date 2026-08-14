import React, { useState } from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus,
  Edit2,
  Check
} from 'lucide-react';

export const LayersPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    selectLayer,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    updateLayerById,
    addLayer,
  } = useEngineStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updateLayerById(id, { meta: { name: editingName.trim() } });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3 select-none">
      {/* Header and Add button */}
      <div className="flex items-center justify-between pb-2 border-b border-dark-750">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-neutral-400" />
          <span>Layer Stack ({layers.length})</span>
        </div>
        <button
          onClick={() => addLayer('New Text Layer', false)}
          className="flex items-center gap-1 px-2.5 py-1 bg-white text-black hover:bg-neutral-200 rounded text-[11px] font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Layer</span>
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {layers.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            No layers found. Click "Add Layer" to begin.
          </div>
        ) : (
          [...layers].reverse().map((layer, reverseIndex) => {
            const actualIndex = layers.length - 1 - reverseIndex;
            const isSelected = layer.id === activeLayerId;
            const isHidden = !!layer.meta?.hidden;
            const isLocked = !!layer.meta?.locked;
            const isEditing = editingId === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => selectLayer(layer.id)}
                className={`p-2.5 rounded border flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-white shadow-sm'
                    : 'bg-dark-900 border-dark-750 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Layer Name & Text Snippet */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(layer.id)}
                          className="bg-black text-white text-xs px-2 py-0.5 rounded border border-white outline-none flex-1 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(layer.id)}
                          className="p-1 text-white hover:text-neutral-300"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          {layer.meta?.name || layer.content || 'Layer'}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(layer.id, layer.meta?.name || layer.content || 'Layer');
                            }}
                            className="opacity-0 hover:opacity-100 p-0.5 text-neutral-400 hover:text-white"
                            title="Rename Layer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate font-mono">
                          {layer.content} ({layer.font.family})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Hide/Show */}
                    <button
                      onClick={() =>
                        updateLayerById(layer.id, {
                          meta: { ...layer.meta, hidden: !isHidden },
                        })
                      }
                      className={`p-1.5 rounded transition-colors ${
                        isHidden ? 'text-neutral-600 bg-dark-800' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={isHidden ? 'Show Layer' : 'Hide Layer'}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock/Unlock */}
                    <button
                      onClick={() =>
                        updateLayerById(layer.id, {
                          meta: { ...layer.meta, locked: !isLocked },
                        })
                      }
                      className={`p-1.5 rounded transition-colors ${
                        isLocked ? 'text-white bg-dark-800' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={isLocked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => duplicateLayer(layer.id)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-dark-800 transition-colors"
                      title="Duplicate Layer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => removeLayer(layer.id)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-dark-800 transition-colors"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Z-Index Order Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-dark-750 text-[10px] text-neutral-400 font-mono">
                  <span>Z-Index: {actualIndex + 1}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={actualIndex === layers.length - 1}
                      onClick={() => reorderLayers(actualIndex, actualIndex + 1)}
                      className="p-1 hover:bg-dark-800 text-white disabled:opacity-30 rounded transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={actualIndex === 0}
                      onClick={() => reorderLayers(actualIndex, actualIndex - 1)}
                      className="p-1 hover:bg-dark-800 text-white disabled:opacity-30 rounded transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
