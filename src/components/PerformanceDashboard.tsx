import React from 'react';
import { AlgorithmType, PathEvaluation } from '../types/network';
import { ALGORITHM_DETAILS } from '../algorithms/routing';
import { BarChart2, Award, CheckCircle, AlertTriangle } from 'lucide-react';

interface PerformanceDashboardProps {
  evaluations: Record<AlgorithmType, PathEvaluation>;
  activeAlgorithm: AlgorithmType;
  aiRecommendedAlgorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  evaluations,
  activeAlgorithm,
  aiRecommendedAlgorithm,
  onSelectAlgorithm,
}) => {
  const algos: AlgorithmType[] = ['dijkstra', 'alternate_path', 'load_balancing', 'fault_tolerant'];

  // Best algorithm based on minimum score
  const actualBestAlgo = algos.reduce((best, curr) => {
    return evaluations[curr].compositeScore < evaluations[best].compositeScore ? curr : best;
  }, algos[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Comprehensive Routing Benchmark Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side evaluation using: Score = Latency + 10×Loss + 3×max(0, MaxLoad - 60) + 1000×FailedLinks
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">AI Choice:</span>
            <strong className="text-blue-400">{ALGORITHM_DETAILS[aiRecommendedAlgorithm].shortName}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Actual Optimal:</span>
            <strong className="text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {ALGORITHM_DETAILS[actualBestAlgo].shortName}
            </strong>
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Routing Strategy</th>
              <th className="py-3 px-4">Effective Latency</th>
              <th className="py-3 px-4">Packet Loss</th>
              <th className="py-3 px-4">Max Link Load</th>
              <th className="py-3 px-4">Hop Count</th>
              <th className="py-3 px-4">Failed Links</th>
              <th className="py-3 px-4">Composite Score</th>
              <th className="py-3 px-4 text-right">Inspect on Graph</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
            {algos.map((algo) => {
              const res = evaluations[algo];
              const details = ALGORITHM_DETAILS[algo];
              const isActive = activeAlgorithm === algo;
              const isBest = actualBestAlgo === algo;
              const isAiPick = aiRecommendedAlgorithm === algo;

              return (
                <tr
                  key={algo}
                  className={`transition-colors ${
                    isActive ? 'bg-blue-950/30' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Strategy Name */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: details.color }}
                      />
                      <div>
                        <span className="font-semibold text-slate-100 block">
                          {details.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-normal">
                          {isBest && (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" /> Best Score
                            </span>
                          )}
                          {isBest && isAiPick && <span>·</span>}
                          {isAiPick && <span className="text-blue-400 font-semibold">[AI Pick]</span>}
                          {(isBest || isAiPick) && isActive && <span>·</span>}
                          {isActive && <span className="text-slate-300">Active View</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Effective Latency */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <span className="text-slate-200 font-medium">
                      {res.effectiveLatency < 9000 ? `${res.effectiveLatency} ms` : '∞'}
                    </span>
                  </td>

                  {/* Loss */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <span className={res.packetLoss > 5 ? 'text-rose-400' : 'text-slate-200'}>
                      {res.packetLoss}%
                    </span>
                  </td>

                  {/* Max Load */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <span className={res.maxLoad > 70 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {res.maxLoad}%
                    </span>
                  </td>

                  {/* Hop Count */}
                  <td className="py-3.5 px-4 tabular-nums text-slate-300">
                    {res.hopCount > 0 ? `${res.hopCount} hops` : '—'}
                  </td>

                  {/* Failed Links Traversed */}
                  <td className="py-3.5 px-4 font-sans text-xs">
                    {res.failedLinksTraversed > 0 ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {res.failedLinksTraversed} (Black-holed)
                      </span>
                    ) : (
                      <span className="text-emerald-400">0 (Safe)</span>
                    )}
                  </td>

                  {/* Composite Score (Lower is better) */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <span
                      className={`font-bold text-sm ${
                        isBest ? 'text-emerald-400' : res.compositeScore > 1000 ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {res.compositeScore}
                    </span>
                  </td>

                  {/* Graph Inspection Action */}
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => onSelectAlgorithm(algo)}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isActive ? 'Showing on Graph' : 'View Path'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Latency and Max Load Comparative Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Effective Latency Bar Chart */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-200 font-bold uppercase tracking-wider">
              Effective Latency (ms)
            </span>
            <span className="text-[11px] text-slate-500">Lower is better</span>
          </div>

          <div className="space-y-3">
            {algos.map((algo) => {
              const res = evaluations[algo];
              const maxVal = Math.max(...algos.map((a) => (evaluations[a].effectiveLatency < 9000 ? evaluations[a].effectiveLatency : 100)), 10);
              const widthPct = Math.min((res.effectiveLatency / maxVal) * 100, 100);

              return (
                <div key={algo} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {ALGORITHM_DETAILS[algo].shortName}
                    </span>
                    <span className="font-mono text-slate-200 font-bold">
                      {res.effectiveLatency < 9000 ? `${res.effectiveLatency} ms` : '∞'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${res.effectiveLatency < 9000 ? widthPct : 100}%`,
                        backgroundColor: res.effectiveLatency < 9000 ? ALGORITHM_DETAILS[algo].color : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Max Link Load Bar Chart */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-200 font-bold uppercase tracking-wider">
              Maximum Path Link Load (%)
            </span>
            <span className="text-[11px] text-slate-500">Threshold: &le;60% nominal</span>
          </div>

          <div className="space-y-3">
            {algos.map((algo) => {
              const res = evaluations[algo];

              return (
                <div key={algo} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {ALGORITHM_DETAILS[algo].shortName}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        res.maxLoad > 70 ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      {res.maxLoad}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(res.maxLoad, 100)}%`,
                        backgroundColor:
                          res.maxLoad > 70
                            ? '#ef4444'
                            : res.maxLoad > 55
                            ? '#f59e0b'
                            : ALGORITHM_DETAILS[algo].color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
