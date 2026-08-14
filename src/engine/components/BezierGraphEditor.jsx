import React, { useState, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { EASING_PRESETS } from '../utils/motionPathEngine';

export default function BezierGraphEditor({
  easingPreset = 'custom',
  customBezier = [1, 0, 0, 0.97],
  onPresetChange,
  onBezierChange
}) {
  const [draggingHandle, setDraggingHandle] = useState(null); // 'p1' | 'p2' | null
  const svgRef = useRef(null);

  // Normalize control points
  const p1 = {
    x: typeof customBezier[0] === 'number' && Number.isFinite(customBezier[0]) ? customBezier[0] : 0.42,
    y: typeof customBezier[1] === 'number' && Number.isFinite(customBezier[1]) ? customBezier[1] : 0.0
  };
  const p2 = {
    x: typeof customBezier[2] === 'number' && Number.isFinite(customBezier[2]) ? customBezier[2] : 0.58,
    y: typeof customBezier[3] === 'number' && Number.isFinite(customBezier[3]) ? customBezier[3] : 1.0
  };

  const PADDING = 20;
  const GRAPH_SIZE = 160;
  const CANVAS_SIZE = 200;

  const toSvgX = (xNorm) => PADDING + Math.max(0, Math.min(1, xNorm)) * GRAPH_SIZE;
  const toSvgY = (yNorm) => (CANVAS_SIZE - PADDING) - Math.max(-0.5, Math.min(1.5, yNorm)) * GRAPH_SIZE;

  const fromSvgX = (svgX) => Math.max(0, Math.min(1, (svgX - PADDING) / GRAPH_SIZE));
  const fromSvgY = (svgY) => Math.max(-0.5, Math.min(1.5, ((CANVAS_SIZE - PADDING) - svgY) / GRAPH_SIZE));

  const p1Svg = { x: toSvgX(p1.x), y: toSvgY(p1.y) };
  const p2Svg = { x: toSvgX(p2.x), y: toSvgY(p2.y) };
  const startSvg = { x: toSvgX(0), y: toSvgY(0) };
  const endSvg = { x: toSvgX(1), y: toSvgY(1) };

  const handlePointerDown = (e, handleKey) => {
    e.stopPropagation();
    setDraggingHandle(handleKey);
  };

  const handlePointerMove = (e) => {
    if (!draggingHandle || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normX = Math.round(fromSvgX(mouseX) * 100) / 100;
    const normY = Math.round(fromSvgY(mouseY) * 100) / 100;

    let nextP1 = { ...p1 };
    let nextP2 = { ...p2 };

    if (draggingHandle === 'p1') {
      nextP1 = { x: normX, y: normY };
    } else if (draggingHandle === 'p2') {
      nextP2 = { x: normX, y: normY };
    }

    if (onBezierChange) {
      onBezierChange([nextP1.x, nextP1.y, nextP2.x, nextP2.y]);
    }
  };

  const handlePointerUp = () => {
    setDraggingHandle(null);
  };

  return (
    <div className="space-y-2.5 p-3 bg-[#1D181B] border border-white/10 rounded-xl shadow-lg text-xs font-sans">
      {/* Header with Title and Dropdown */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span>Easing</span>
        </label>

        {/* Easing Preset Dropdown */}
        <select
          value={easingPreset}
          onChange={(e) => {
            const val = e.target.value;
            if (onPresetChange) onPresetChange(val);
            if (val !== 'custom' && EASING_PRESETS[val] && onBezierChange) {
              onBezierChange(EASING_PRESETS[val].points);
            }
          }}
          className="bg-[#2A2529] border border-white/15 text-zinc-200 text-[10px] font-mono rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="linear">Linear</option>
          <option value="easeIn">Ease In</option>
          <option value="easeOut">Ease Out</option>
          <option value="easeInOut">Ease In Out</option>
          <option value="custom">Custom bezier</option>
        </select>
      </div>

      {/* Interactive SVG Bezier Graph Editor (200x200px) */}
      <div
        className="relative w-full aspect-square bg-[#181416] border border-white/10 rounded-xl overflow-hidden select-none cursor-crosshair shadow-inner"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        >
          {/* Grid Lines (4x4) */}
          <line x1="60" y1="20" x2="60" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
          <line x1="140" y1="20" x2="140" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

          <line x1="20" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
          <line x1="20" y1="140" x2="180" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

          {/* Linear Diagonal Reference Line */}
          <line
            x1={startSvg.x}
            y1={startSvg.y}
            x2={endSvg.x}
            y2={endSvg.y}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="3 3"
          />

          {/* Control Point 1 Tangent Line (Purple) */}
          <line
            x1={startSvg.x}
            y1={startSvg.y}
            x2={p1Svg.x}
            y2={p1Svg.y}
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* Control Point 2 Tangent Line (Cyan) */}
          <line
            x1={endSvg.x}
            y1={endSvg.y}
            x2={p2Svg.x}
            y2={p2Svg.y}
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* Cubic Bezier Easing Curve */}
          <path
            d={`M ${startSvg.x} ${startSvg.y} C ${p1Svg.x} ${p1Svg.y}, ${p2Svg.x} ${p2Svg.y}, ${endSvg.x} ${endSvg.y}`}
            fill="none"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinecap="round"
            className="filter drop-shadow-md"
          />

          {/* Anchor Points */}
          <circle cx={startSvg.x} cy={startSvg.y} r="4" fill="#ffffff" />
          <circle cx={endSvg.x} cy={endSvg.y} r="4" fill="#ffffff" />

          {/* Control Handle P1 (Purple) */}
          <g
            className="cursor-grab active:cursor-grabbing group"
            onPointerDown={(e) => handlePointerDown(e, 'p1')}
          >
            <circle cx={p1Svg.x} cy={p1Svg.y} r="12" fill="rgba(168, 85, 247, 0.2)" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            <circle cx={p1Svg.x} cy={p1Svg.y} r="7" fill="#a855f7" stroke="#ffffff" strokeWidth="2" className="shadow-lg transition-transform group-hover:scale-125" />
          </g>

          {/* Control Handle P2 (Cyan) */}
          <g
            className="cursor-grab active:cursor-grabbing group"
            onPointerDown={(e) => handlePointerDown(e, 'p2')}
          >
            <circle cx={p2Svg.x} cy={p2Svg.y} r="12" fill="rgba(6, 182, 212, 0.2)" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            <circle cx={p2Svg.x} cy={p2Svg.y} r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" className="shadow-lg transition-transform group-hover:scale-125" />
          </g>
        </svg>
      </div>

      {/* Output Box */}
      <div className="p-2 bg-[#141012] border border-white/10 rounded-lg font-mono text-[10px] text-purple-300 flex items-center justify-between select-all shadow-xs">
        <span className="text-zinc-500 font-semibold">CSS:</span>
        <span className="font-bold text-zinc-100">{`cubic-bezier(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y})`}</span>
      </div>
    </div>
  );
}
