import React from 'react';
import { ModelPrediction, AlgorithmType } from '../types/network';
import { ALGORITHM_DETAILS } from '../algorithms/routing';
import { Sparkles, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface AISelectorEngineProps {
  prediction: ModelPrediction;
  activeAlgorithm: AlgorithmType;
  isAutoMode: boolean;
  onToggleAutoMode: (auto: boolean) => void;
  onSelectManualAlgorithm: (algo: AlgorithmType) => void;
}

export const AISelectorEngine: React.FC<AISelectorEngineProps> = ({
  prediction,
  activeAlgorithm,
  isAutoMode,
  onToggleAutoMode,
  onSelectManualAlgorithm,
}) => {
  const currentMeta = ALGORITHM_DETAILS[activeAlgorithm];
  const recommendedMeta = ALGORITHM_DETAILS[prediction.recommendedAlgorithm];
  const { featureVector } = prediction;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Engine Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Random Forest Routing Algorithm Selector
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates 10 real-time network parameters to dynamically select the optimal routing strategy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => onToggleAutoMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isAutoMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Autonomous</span>
          </button>

          <button
            onClick={() => onToggleAutoMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              !isAutoMode ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Manual Override</span>
          </button>
        </div>
      </div>

      {/* Recommended Algorithm & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recommendation Card */}
        <div className="lg:col-span-2 flex flex-col justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                {isAutoMode ? 'Random Forest Top Recommendation' : 'Active Routing Selection (Manual Override)'}
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">
                Confidence: {Math.round(prediction.confidenceScores[prediction.recommendedAlgorithm] * 100)}%
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isAutoMode ? recommendedMeta.color : currentMeta.color }}
              />
              {isAutoMode ? recommendedMeta.name : currentMeta.name}
            </h3>

            <p className="text-xs text-slate-300 font-medium mb-3">
              {isAutoMode ? recommendedMeta.tagline : currentMeta.tagline}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {isAutoMode ? recommendedMeta.description : currentMeta.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
            <span>Ground Truth Best Algorithm: <strong className="text-emerald-400 font-mono">{ALGORITHM_DETAILS[prediction.actualBestAlgorithm].shortName}</strong></span>
            <span>·</span>
            <span>Model Agreement: <strong className="text-slate-200 font-mono">{prediction.recommendedAlgorithm === prediction.actualBestAlgorithm ? '100% Match' : 'Alternative Viable'}</strong></span>
          </div>
        </div>

        {/* Confidence Scores */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              Algorithm Confidence Distribution
            </h4>

            <div className="space-y-3">
              {(Object.keys(ALGORITHM_DETAILS) as AlgorithmType[]).map((algoKey) => {
                const details = ALGORITHM_DETAILS[algoKey];
                const score = prediction.confidenceScores[algoKey] || 0;
                const isSelected = activeAlgorithm === algoKey;
                const isTopPick = prediction.recommendedAlgorithm === algoKey;

                return (
                  <div
                    key={algoKey}
                    onClick={() => {
                      if (!isAutoMode) onSelectManualAlgorithm(algoKey);
                    }}
                    className={`p-2.5 rounded-lg border transition-all ${
                      !isAutoMode ? 'cursor-pointer hover:border-slate-600' : 'cursor-default'
                    } ${
                      isSelected ? 'bg-slate-900 border-blue-500/80' : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: details.color }} />
                        {details.shortName}
                        {isTopPick && (
                          <span className="text-[10px] text-blue-400 font-bold ml-1">[AI Top]</span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-slate-300 tabular-nums">
                        {Math.round(score * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(score * 100)}%`,
                          backgroundColor: details.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isAutoMode && (
            <p className="text-[11px] text-amber-400/90 mt-3 italic flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              Manual mode active. Click an algorithm above to inspect its path on the graph.
            </p>
          )}
        </div>
      </div>

      {/* Real-time Feature Vector (10 Critical Network Metrics) */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            Real-Time Feature Vector (10 Extracted Network Metrics)
          </span>
          <span className="text-[11px] text-slate-500">
            Fed directly into Random Forest input tensor
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">1. Avg Latency</span>
            <span className="font-bold text-slate-200">{featureVector.avg_latency} ms</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">2. Avg Bandwidth</span>
            <span className="font-bold text-slate-200">{featureVector.avg_bandwidth} Mbps</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">3. Avg Packet Loss</span>
            <span className="font-bold text-rose-400">{featureVector.avg_loss}%</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">4. Avg Load</span>
            <span className="font-bold text-emerald-400">{featureVector.avg_load}%</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">5. Max Load</span>
            <span className="font-bold text-amber-400">{featureVector.max_load}%</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">6. Congested Links</span>
            <span className="font-bold text-amber-400">{featureVector.congested_link_count} links</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">7. Failed Links</span>
            <span className="font-bold text-rose-400">{featureVector.failed_link_count} cuts</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">8. Shortest Hops</span>
            <span className="font-bold text-slate-200">{featureVector.shortest_hop_distance} hops</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">9. Dijkstra Failed</span>
            <span className={`font-bold ${featureVector.dijkstra_path_failed_links > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {featureVector.dijkstra_path_failed_links}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans uppercase">10. Dijkstra Congested</span>
            <span className={`font-bold ${featureVector.dijkstra_path_congested_links > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {featureVector.dijkstra_path_congested_links}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
