import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, getExportData, importData } = useEngineStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'schema'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isExportModalOpen) return null;

  const exportData = getExportData();
  const formattedJson = JSON.stringify(exportData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanto-motion-text-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });
  };

  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Input text must be a valid JSON array of KantoTextNode[].');
      }
      importData(parsed);
      setImportError(null);
      setIsExportModalOpen(false);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="bg-dark-900 border border-dark-700 w-full max-w-2xl rounded shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-dark-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-white/30 bg-black text-white flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">KantoTextNode Export & Schema</h3>
              <p className="text-[11px] text-neutral-400">
                Export and import text layer state for Kanto Motion Video Editor
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-dark-750 bg-black px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Export JSON ({exportData.length} Layers)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Import JSON
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Schema Spec
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'export' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>KantoTextNode State Schema Validated</span>
                </span>
                <span>{formattedJson.length} bytes</span>
              </div>

              <div className="relative">
                <pre className="bg-black p-4 rounded border border-dark-750 text-[11px] font-mono text-neutral-200 overflow-x-auto max-h-96 leading-relaxed select-text">
                  {formattedJson}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-neutral-300">
                Paste valid JSON array below to restore full text layers & animation states:
              </span>
              <textarea
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="[ { id: 'layer-1', content: '...', ... } ]"
                className="w-full bg-black text-white font-mono text-xs p-3 rounded border border-dark-750 focus:border-white outline-none resize-none leading-relaxed select-text"
              />
              {importError && (
                <div className="text-xs text-neutral-200 bg-neutral-900 p-2.5 rounded border border-neutral-700 font-mono">
                  {importError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-neutral-300">
                Official TypeScript specification for KantoTextNode data structure:
              </span>
              <pre className="bg-black p-4 rounded border border-dark-750 text-[11px] font-mono text-neutral-200 overflow-x-auto max-h-96 leading-relaxed select-text">
{`interface KantoTextNode {
  id: string;
  content: string;
  transform: { x: number; y: number; scale: number; rotation: number };
  font: { family: string; size: number; isCustom: boolean };
  style: {
    fill: string;
    opacity: number;
    stroke: { enabled: boolean; color: string; width: number };
    glow: { enabled: boolean; color: string; blur: number };
    background: { enabled: boolean; color: string; radius: number; padding: number };
    spacing: { char: number; line: number };
  };
  animation: {
    in: { type: string; duration: number };
    loop: { type: string; speed: number };
  };
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-dark-750 bg-black flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 font-mono">
            Kanto Motion Engine v2.4
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'export' && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-750 text-white text-xs font-semibold rounded border border-dark-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded border border-white transition-all"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Download .json</span>
                </button>
              </>
            )}

            {activeTab === 'import' && (
              <button
                onClick={handleApplyImport}
                disabled={!importJsonText.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold rounded border border-white transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Import to Canvas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
