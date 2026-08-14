import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-3.5 py-2.5 rounded-md shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
      {icons[toast.type] || icons.info}
      <span className="font-medium tracking-wide">{toast.message}</span>
      <button 
        onClick={onClose}
        className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
