import React, { useState } from 'react';
import { AlgorithmType, PathEvaluation, ModelPrediction, NetworkNode, NetworkLink } from '../types/network';
import { ALGORITHM_DETAILS, getLink, calculateEffectiveLatency } from '../algorithms/routing';
import {
  Compass,
  Sparkles,
  Zap,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Activity,
  Award,
  AlertTriangle
} from 'lucide-react';

interface AlgorithmSelectorHubProps {
  activeAlgorithm: AlgorithmType;
  isAutoMode: boolean;
  prediction: ModelPrediction;
  evaluations: Record<AlgorithmType, PathEvaluation>;
  nodes: NetworkNode[];
  links: NetworkLink[];
  sourceId: string;
  targetId: string;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  onToggleAutoMode: (auto: boolean) => void;
  onNavigateToCanvas?: () => void;
}

export const AlgorithmSelectorHub: React.FC<AlgorithmSelectorHubProps> = ({
  activeAlgorithm,
  isAutoMode,
  prediction,
  evaluations,
  nodes,
  links,
  sourceId,
  targetId,
  onSelectAlgorithm,
  onToggleAutoMode,
  onNavigateToCanvas
}) => {
  const [inspectedAlgo, setInspectedAlgo] = useState<AlgorithmType>(activeAlgorithm);

  const algorithmsList: {
    key: AlgorithmType;
    icon: React.ElementType;
    badge: string;
    idealFor: string;
    formula: string;
    complexity: string;
  }[] = [
    {
      key: 'dijkstra',
      icon: Compass,
      badge: 'Static Latency Optimal',
      idealFor: 'Low traffic networks, unconstrained backbone lines, minimal load variation',
      formula: 'Cost(e) = BaseLatency(e)',
      complexity: 'O(E + V log V)'
    },
    {
      key: 'alternate_path',
      icon: Zap,
      badge: 'Congestion Detour',
      idealFor: 'Networks with localized choke-points (>70% load) needing dynamic bypass',
      formula: 'Cost(e) = BaseLatency + (Load > 70 ? 300 + 10·(Load - 70) : 0)',
      complexity: 'O(k · (E + V log V))'
    },
    {
      key: 'load_balancing',
      icon: TrendingUp,
      badge: 'Throughput & Capacity',
      idealFor: 'High concurrency environments where traffic must spread across underutilized links',
      formula: 'Cost(e) = BaseLatency · (1 + 5·(Load/100)²)',
      complexity: 'O(E + V log V)'
    },
    {
      key: 'fault_tolerant',
      icon: ShieldAlert,
      badge: 'Resilient Failure Isolation',
      idealFor: 'Hostile networks experiencing physical cable cuts, high packet loss, or link failures',
      formula: 'Cost(e) = isFailed ? ∞ : EffectiveLatency + 10·PacketLoss',
      complexity: 'O(E + V log V)'
    }
  ];

  // Best algorithm based on minimum composite score
  const actualOptimalAlgo = (Object.keys(evaluations) as AlgorithmType[]).reduce((best, curr) => {
    return evaluations[curr].compositeScore < evaluations[best].compositeScore ? curr : best;
  }, 'dijkstra' as AlgorithmType);

  const inspectedEval = evaluations[inspectedAlgo];
  const inspectedMeta = ALGORITHM_DETAILS[inspectedAlgo];
  const inspectedPath = inspectedEval.path;

  // Build hop-by-hop breakdown for the inspected algorithm
  const hopBreakdown = [];
  for (let i = 0; i < inspectedPath.length - 1; i++) {
    const u = inspectedPath[i];
    const v = inspectedPath[i + 1];
    const link = getLink(u, v, links);
    if (link) {
      const effLat = calculateEffectiveLatency(link.baseLatency, link.trafficLoad);
      hopBreakdown.push({
        hopIndex: i + 1,
        from: u,
        to: v,
        link,
        effectiveLatency: Math.round(effLat * 10) / 10
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-950/80 border border-blue-800/60 text-blue-400">
              Strategy Dispatcher
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              Active Path: <strong className="text-blue-400">{sourceId}</strong> → <strong className="text-cyan-400">{targetId}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Select Routing Algorithm & Deploy Strategy
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Choose which mathematical optimization algorithm to run on the network topology. Compare real-time performance metrics,
            inspect per-hop latencies, or delegate autonomous decision-making to the Random Forest AI model.
          </p>
        </div>

        {/* Global Strategy Mode: AI Autonomous vs Manual */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800/90 shrink-0">
          <button
            onClick={() => onToggleAutoMode(true)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              isAutoMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Autonomous Mode</span>
          </button>

          <button
            onClick={() => onToggleAutoMode(false)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isAutoMode
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Selection</span>
          </button>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/50 border border-blue-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Random Forest AI Recommendation:</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {ALGORITHM_DETAILS[prediction.recommendedAlgorithm].name}
              </span>
              <span className="text-xs font-mono text-blue-400">
                ({Math.round(prediction.confidenceScores[prediction.recommendedAlgorithm] * 100)}% confidence)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Top decision feature: <strong className="text-slate-300 font-mono">{prediction.featureImportances[0]?.name || 'congested_link_count'}</strong>.
              Actual lowest score algorithm: <strong className="text-emerald-400 font-mono">{ALGORITHM_DETAILS[actualOptimalAlgo].shortName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onToggleAutoMode(false);
            onSelectAlgorithm(prediction.recommendedAlgorithm);
            setInspectedAlgo(prediction.recommendedAlgorithm);
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>Take AI Recommendation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Grid of 4 Core Algorithms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {algorithmsList.map((algoItem) => {
          const { key, icon: Icon, badge, idealFor, formula, complexity } = algoItem;
          const meta = ALGORITHM_DETAILS[key];
          const evaluation = evaluations[key];
          const isActive = activeAlgorithm === key;
          const isInspected = inspectedAlgo === key;
          const isOptimal = actualOptimalAlgo === key;
          const isAiPick = prediction.recommendedAlgorithm === key;

          return (
            <div
              key={key}
              onClick={() => setInspectedAlgo(key)}
              className={`relative flex flex-col justify-between rounded-xl p-5 cursor-pointer transition-all border ${
                isInspected
                  ? 'bg-slate-900 border-blue-500/80 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Badges bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5">
                  {isOptimal && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Best Score
                    </span>
                  )}
                  {isAiPick && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      AI Pick
                    </span>
                  )}
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Algorithm Name & Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                  {meta.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {meta.tagline}
                </p>
              </div>

              {/* Metrics Summary Strip */}
              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 mb-4 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Eff. Latency:</span>
                  <span className="text-slate-200 font-bold">
                    {evaluation.effectiveLatency < 9000 ? `${evaluation.effectiveLatency} ms` : '∞'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Hop Count:</span>
                  <span className="text-slate-200">{evaluation.hopCount} hops</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Max Load:</span>
                  <span className={evaluation.maxLoad > 70 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {evaluation.maxLoad}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/60 pt-1">
                  <span>Composite Score:</span>
                  <span className="text-blue-400 font-bold">{evaluation.compositeScore}</span>
                </div>
              </div>

              {/* Action Button: "Take this Algorithm" */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoMode(false);
                  onSelectAlgorithm(key);
                  setInspectedAlgo(key);
                }}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600/90 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white'
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Currently Active Algorithm</span>
                  </>
                ) : (
                  <>
                    <span>Take this Algorithm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Deep Inspection Panel for Inspected Algorithm */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: inspectedMeta.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {inspectedMeta.name} — Detailed Hop-by-Hop Trace
                </h3>
                {inspectedAlgo === activeAlgorithm && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Active on Canvas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Path: {inspectedPath.length > 0 ? inspectedPath.join(' ──> ') : 'No valid path found (partitioned)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {inspectedAlgo !== activeAlgorithm && (
              <button
                onClick={() => {
                  onToggleAutoMode(false);
                  onSelectAlgorithm(inspectedAlgo);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <span>Deploy "{inspectedMeta.shortName}" to Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onNavigateToCanvas && (
              <button
                onClick={onNavigateToCanvas}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                View on Topology Canvas
              </button>
            )}
          </div>
        </div>

        {/* Hop by Hop Journey Visualizer */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Per-Hop Telemetry & Link Status Breakdown
          </h4>

          {hopBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
              No hops traversed. Network might be physically partitioned or source equals destination.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {hopBreakdown.map((hop) => {
                const { hopIndex, from, to, link, effectiveLatency } = hop;
                return (
                  <div
                    key={`${from}-${to}-${hopIndex}`}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono text-slate-400">
                          {hopIndex}
                        </span>
                        <span>{from} → {to}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          link.isFailed
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : link.isCongested
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {link.isFailed ? 'FAILED' : link.isCongested ? 'CONGESTED' : 'HEALTHY'}
                      </span>
                    </div>

                    <div className="font-mono text-xs space-y-1 text-slate-400 bg-slate-900/60 p-2 rounded-lg">
                      <div className="flex justify-between">
                        <span>Base / Eff Latency:</span>
                        <span className="text-slate-200">{link.baseLatency}ms / {effectiveLatency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Traffic Load:</span>
                        <span className={link.trafficLoad > 70 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                          {link.trafficLoad}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packet Loss:</span>
                        <span className="text-slate-200">{link.packetLoss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="text-slate-200">{link.bandwidth} Mbps</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mathematical Cost Function & Engineering Theory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Routing Cost Function Formulation
            </h5>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto mb-2">
              {algorithmsList.find((a) => a.key === inspectedAlgo)?.formula}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {inspectedMeta.description}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Operational Trade-Offs & Ideal Deployments
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              <strong className="text-slate-200">Recommended Scenario:</strong>{' '}
              {algorithmsList.find((a) => a.key === inspectedAlgo)?.idealFor}
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Time Complexity: <strong className="text-slate-200">{algorithmsList.find((a) => a.key === inspectedAlgo)?.complexity}</strong></span>
              <span>·</span>
              <span>Feasibility: <strong className={inspectedEval.isFeasible ? 'text-emerald-400' : 'text-rose-400'}>{inspectedEval.isFeasible ? 'Feasible (No Broken Links)' : 'Infeasible (Broken Link Traversed)'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
