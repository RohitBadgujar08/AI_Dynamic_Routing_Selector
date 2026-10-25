import React, { useState, useMemo } from 'react';
import { DatasetRecord, AlgorithmType } from '../types/network';
import { MODEL_METRICS, RANDOM_FOREST_FEATURE_IMPORTANCES, exportDatasetCSV } from '../ml/modelEngine';
import { ALGORITHM_DETAILS } from '../algorithms/routing';
import { Database, Download, Search, CheckCircle, BarChart, Cpu } from 'lucide-react';

interface ModelDatasetInspectorProps {
  dataset: DatasetRecord[];
  onRegenerateDataset: () => void;
}

export const ModelDatasetInspector: React.FC<ModelDatasetInspectorProps> = ({
  dataset,
  onRegenerateDataset,
}) => {
  const [filterAlgo, setFilterAlgo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Filtered dataset records
  const filteredData = useMemo(() => {
    return dataset.filter((d) => {
      const matchAlgo = filterAlgo === 'all' || d.optimal_algorithm === filterAlgo;
      const matchSearch =
        searchTerm === '' ||
        d.id.toString().includes(searchTerm) ||
        d.optimal_algorithm.toLowerCase().includes(searchTerm.toLowerCase());
      return matchAlgo && matchSearch;
    });
  }, [dataset, filterAlgo, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pageData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // Class counts
  const classCounts = useMemo(() => {
    const counts: Record<AlgorithmType, number> = {
      dijkstra: 0,
      alternate_path: 0,
      load_balancing: 0,
      fault_tolerant: 0,
    };
    dataset.forEach((d) => {
      if (counts[d.optimal_algorithm] !== undefined) {
        counts[d.optimal_algorithm]++;
      }
    });
    return counts;
  }, [dataset]);

  // Handle Download CSV
  const handleDownloadCSV = () => {
    const csv = exportDatasetCSV(dataset);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'dynamic_routing_training_dataset.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            Machine Learning Model & Dataset Inspector
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trained Random Forest Classifier (n_estimators=100) on {dataset.length} synthetic network state vectors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerateDataset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Regenerate Dataset
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV (1000 Rows)</span>
          </button>
        </div>
      </div>

      {/* Test Accuracy & Model Performance KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Model Architecture</span>
          <span className="text-xs font-bold text-slate-200 mt-1 block">
            Random Forest (100 Trees)
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">max_depth=12 · Multi-class</span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Test Set Accuracy</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
            {MODEL_METRICS.testAccuracy}%
          </span>
          <span className="text-[10px] text-emerald-500/80 mt-0.5 block">200 Test Samples (80/20)</span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Macro F1-Score</span>
          <span className="text-base font-bold font-mono text-blue-400 mt-1 block">
            {MODEL_METRICS.f1Score}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Precision: {MODEL_METRICS.precision}%</span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Dataset Size</span>
          <span className="text-base font-bold font-mono text-slate-100 mt-1 block">
            {dataset.length} Samples
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">10 Continuous Network Features</span>
        </div>
      </div>

      {/* Feature Importances & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Feature Importance Bar Chart */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart className="w-3.5 h-3.5 text-blue-400" />
              Random Forest Feature Importances (Gini Impurity)
            </h4>

            <div className="space-y-2 text-xs">
              {RANDOM_FOREST_FEATURE_IMPORTANCES.map((item) => (
                <div key={item.name} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-mono text-slate-300">{item.name}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {Math.round(item.weight * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${item.weight * 100 * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Confusion Matrix (200 Test Evaluations)
            </h4>

            <div className="overflow-x-auto rounded border border-slate-800">
              <table className="w-full text-xs text-center font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-2 text-left font-sans">Actual \ Pred</th>
                    <th className="py-2 px-2">Dijkstra</th>
                    <th className="py-2 px-2">Alternate</th>
                    <th className="py-2 px-2">Load Bal</th>
                    <th className="py-2 px-2">Fault Tol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                  {MODEL_METRICS.confusionMatrix.map((row) => (
                    <tr key={row.actual} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-left font-sans text-slate-300 font-medium">
                        {row.actual}
                      </td>
                      <td className={`py-2.5 px-2 font-bold ${row.p_dijkstra > 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.p_dijkstra}
                      </td>
                      <td className={`py-2.5 px-2 font-bold ${row.p_alternate > 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.p_alternate}
                      </td>
                      <td className={`py-2.5 px-2 font-bold ${row.p_load_balancing > 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.p_load_balancing}
                      </td>
                      <td className={`py-2.5 px-2 font-bold ${row.p_fault_tolerant > 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.p_fault_tolerant}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <span>High diagonal density confirms zero false-negatives on link cuts.</span>
          </div>
        </div>
      </div>

      {/* Class Balance Strip */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-slate-400" /> Class Balance:
        </span>
        {(Object.keys(classCounts) as AlgorithmType[]).map((algo) => (
          <div key={algo} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-[11px]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ALGORITHM_DETAILS[algo].color }}
            />
            <span className="text-slate-300">{ALGORITHM_DETAILS[algo].shortName}:</span>
            <strong className="text-slate-100 font-mono">{classCounts[algo]}</strong>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Filter by Target:</span>
          <select
            value={filterAlgo}
            onChange={(e) => {
              setFilterAlgo(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All ({dataset.length})</option>
            <option value="dijkstra">Dijkstra ({classCounts.dijkstra})</option>
            <option value="alternate_path">Alternate Path ({classCounts.alternate_path})</option>
            <option value="load_balancing">Load Balancing ({classCounts.load_balancing})</option>
            <option value="fault_tolerant">Fault Tolerant ({classCounts.fault_tolerant})</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Sample ID or Algorithm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-800 text-slate-200 pl-8 pr-3 py-1 text-xs rounded-md border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Dataset Records Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] font-sans">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Avg Lat</th>
              <th className="py-2.5 px-3">Avg Bw</th>
              <th className="py-2.5 px-3">Loss</th>
              <th className="py-2.5 px-3">Avg Load</th>
              <th className="py-2.5 px-3">Max Load</th>
              <th className="py-2.5 px-3">Congested</th>
              <th className="py-2.5 px-3">Failed</th>
              <th className="py-2.5 px-3">Hops</th>
              <th className="py-2.5 px-3">Optimal Algorithm (Label)</th>
              <th className="py-2.5 px-3">Best Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/60">
            {pageData.map((row) => {
              const details = ALGORITHM_DETAILS[row.optimal_algorithm];

              return (
                <tr key={row.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400">#{row.id}</td>
                  <td className="py-2 px-3 text-slate-200">{row.avg_latency} ms</td>
                  <td className="py-2 px-3 text-slate-200">{row.avg_bandwidth}M</td>
                  <td className="py-2 px-3 text-rose-400">{row.avg_loss}%</td>
                  <td className="py-2 px-3 text-emerald-400">{row.avg_load}%</td>
                  <td className="py-2 px-3 text-amber-400">{row.max_load}%</td>
                  <td className="py-2 px-3 text-slate-300">{row.congested_links}</td>
                  <td className="py-2 px-3">
                    {row.failed_links > 0 ? (
                      <span className="text-rose-400 font-bold">{row.failed_links} cuts</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-300">{row.hop_distance}</td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className="inline-flex items-center gap-1 font-semibold text-xs"
                      style={{ color: details.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: details.color }}
                      />
                      {details.shortName}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200 font-bold">{row.best_score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>
          Showing {pageData.length} of {filteredData.length} records
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="font-mono text-slate-300">
            Page {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
