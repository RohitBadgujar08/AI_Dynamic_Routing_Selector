import React from 'react';
import { Sliders, RefreshCw, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface ScenarioControlsProps {
  nodeCount: number;
  topologySeed: number;
  avgTrafficLoad: number;
  congestedCount: number;
  failedCount: number;
  onChangeNodeCount: (count: number) => void;
  onChangeSeed: (seed: number) => void;
  onChangeAvgLoad: (load: number) => void;
  onChangeCongestedCount: (count: number) => void;
  onChangeFailedCount: (count: number) => void;
  onApplyPreset: (preset: 'nominal' | 'heavy_load' | 'congestion_hotspot' | 'link_failure') => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  nodeCount,
  topologySeed,
  avgTrafficLoad,
  congestedCount,
  failedCount,
  onChangeNodeCount,
  onChangeSeed,
  onChangeAvgLoad,
  onChangeCongestedCount,
  onChangeFailedCount,
  onApplyPreset,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header and Quick Presets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Network Topology & Scenario Simulation Controls
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Parametrize Watts-Strogatz graph generation, traffic loads, and link disruptions
          </p>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onApplyPreset('nominal')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Nominal (Dijkstra)</span>
          </button>

          <button
            onClick={() => onApplyPreset('heavy_load')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/70 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Heavy Load</span>
          </button>

          <button
            onClick={() => onApplyPreset('congestion_hotspot')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-800/70 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Congestion (&gt;70%)</span>
          </button>

          <button
            onClick={() => onApplyPreset('link_failure')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/70 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Link Failure Cut</span>
          </button>
        </div>
      </div>

      {/* Grid of Simulation Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Node Count Slider */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Node Count (N)</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">{nodeCount} routers</span>
          </div>
          <input
            type="range"
            min="8"
            max="20"
            step="1"
            value={nodeCount}
            onChange={(e) => onChangeNodeCount(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>8</span>
            <span>14</span>
            <span>20</span>
          </div>
        </div>

        {/* Topology Seed */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Graph Seed</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">#{topologySeed}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={topologySeed}
              onChange={(e) => onChangeSeed(Number(e.target.value) || 1)}
              className="w-full bg-slate-800 text-slate-100 text-xs px-2 py-1 rounded border border-slate-700 font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onChangeSeed(Math.floor(Math.random() * 9999) + 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Randomize Seed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500">Watts-Strogatz PRNG</div>
        </div>

        {/* Average Traffic Load */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Average Traffic Load</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{avgTrafficLoad}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            step="5"
            value={avgTrafficLoad}
            onChange={(e) => onChangeAvgLoad(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Low (10%)</span>
            <span>Balanced</span>
            <span>Heavy (95%)</span>
          </div>
        </div>

        {/* Congested Links Count (>70%) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Congested Links (&gt;70%)</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">{congestedCount} links</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={congestedCount}
            onChange={(e) => onChangeCongestedCount(Number(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0</span>
            <span>3</span>
            <span>6</span>
          </div>
        </div>

        {/* Failed Links Count */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Failed Links (Cuts)</span>
            <span className="font-mono font-bold text-rose-400 tabular-nums">{failedCount} cuts</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={failedCount}
            onChange={(e) => onChangeFailedCount(Number(e.target.value))}
            className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0 (None)</span>
            <span>2</span>
            <span>4 (Severe)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
