import { useState, useMemo } from 'react';
import { NetworkNode, NetworkLink, AlgorithmType, TopologyFormatType } from './types/network';
import { generateTopologyByFormat } from './data/topologyGenerator';
import { evaluateAllAlgorithms, ALGORITHM_DETAILS } from './algorithms/routing';
import { predictAlgorithmWithRandomForest, generateSyntheticDataset } from './ml/modelEngine';
import { NetworkCanvas } from './components/NetworkCanvas';
import { ScenarioControls } from './components/ScenarioControls';
import { AISelectorEngine } from './components/AISelectorEngine';
import { AlgorithmSelectorHub } from './components/AlgorithmSelectorHub';
import { NodeConnectionStudio } from './components/NodeConnectionStudio';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { ModelDatasetInspector } from './components/ModelDatasetInspector';
import { PythonSourceViewer } from './components/PythonSourceViewer';
import {
  Zap,
  Activity,
  Layers,
  Network,
  Cpu,
  BarChart2,
  FileCode2,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'canvas_lab' | 'algorithm_selector' | 'node_connections' | 'benchmark' | 'model_dataset' | 'python_code'
  >('canvas_lab');

  // Topology simulation parameters
  const [nodeCount, setNodeCount] = useState<number>(12);
  const [topologySeed, setTopologySeed] = useState<number>(42);
  const [topologyFormat, setTopologyFormat] = useState<TopologyFormatType>('watts_strogatz');
  const [avgTrafficLoad, setAvgTrafficLoad] = useState<number>(40);
  const [congestedCount, setCongestedCount] = useState<number>(2);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Generate topology based on chosen format & parameters
  const generated = useMemo(() => {
    return generateTopologyByFormat(
      topologyFormat,
      nodeCount,
      topologySeed,
      avgTrafficLoad,
      congestedCount,
      failedCount
    );
  }, [topologyFormat, nodeCount, topologySeed, avgTrafficLoad, congestedCount, failedCount]);

  // Nodes & Links state (with local overrides for user drag, wires, & clicks)
  const [nodes, setNodes] = useState<NetworkNode[]>(generated.nodes);
  const [links, setLinks] = useState<NetworkLink[]>(generated.links);
  const [sourceId, setSourceId] = useState<string>('R1');
  const [targetId, setTargetId] = useState<string>('R7');

  // Synchronize when generator params change
  useMemo(() => {
    setNodes(generated.nodes);
    setLinks(generated.links);
    if (!generated.nodes.some((n) => n.id === sourceId)) {
      setSourceId(generated.nodes[0]?.id || 'R1');
    }
    if (!generated.nodes.some((n) => n.id === targetId)) {
      setTargetId(generated.nodes[Math.min(6, generated.nodes.length - 1)]?.id || 'R2');
    }
  }, [generated]);

  // AI Autonomous mode vs Manual override
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [manualAlgorithm, setManualAlgorithm] = useState<AlgorithmType>('dijkstra');

  // Synthetic Dataset (1,000 samples)
  const [dataset, setDataset] = useState(() => generateSyntheticDataset());

  // Drag node handler
  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
  };

  // Toggle link fail state on graph
  const handleToggleLinkFail = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, isFailed: !l.isFailed } : l))
    );
  };

  // Toggle link congestion state on graph
  const handleToggleLinkCongest = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId
          ? {
              ...l,
              isCongested: !l.isCongested,
              trafficLoad: !l.isCongested ? 92 : 30,
            }
          : l
      )
    );
  };

  // Toggle wire connection between two nodes (from canvas click or studio)
  const handleToggleConnectNodes = (uId: string, vId: string) => {
    if (uId === vId) return;
    const existingIndex = links.findIndex(
      (l) => (l.source === uId && l.target === vId) || (l.source === vId && l.target === uId)
    );

    if (existingIndex >= 0) {
      setLinks((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      const u = nodes.find((n) => n.id === uId);
      const v = nodes.find((n) => n.id === vId);
      const dist = u && v ? Math.sqrt((u.x - v.x) ** 2 + (u.y - v.y) ** 2) : 100;
      const baseLatency = Math.max(6, Math.round(dist / 35));

      const newLink: NetworkLink = {
        id: `L_${uId}_${vId}`,
        source: uId,
        target: vId,
        baseLatency,
        bandwidth: 1000,
        packetLoss: 0.3,
        trafficLoad: Math.round(avgTrafficLoad),
        isFailed: false,
        isCongested: avgTrafficLoad > 70
      };
      setLinks((prev) => [...prev, newLink]);
    }
  };

  // Reset topology overrides
  const handleResetTopology = () => {
    setNodes(generated.nodes);
    setLinks(generated.links);
  };

  // Quick Presets
  const handleApplyPreset = (preset: 'nominal' | 'heavy_load' | 'congestion_hotspot' | 'link_failure') => {
    if (preset === 'nominal') {
      setAvgTrafficLoad(25);
      setCongestedCount(0);
      setFailedCount(0);
    } else if (preset === 'heavy_load') {
      setAvgTrafficLoad(85);
      setCongestedCount(1);
      setFailedCount(0);
    } else if (preset === 'congestion_hotspot') {
      setAvgTrafficLoad(55);
      setCongestedCount(4);
      setFailedCount(0);
    } else if (preset === 'link_failure') {
      setAvgTrafficLoad(45);
      setCongestedCount(1);
      setFailedCount(2);
    }
  };

  // Evaluate all 4 algorithms on current network state
  const evaluations = useMemo(() => {
    return evaluateAllAlgorithms(sourceId, targetId, nodes, links);
  }, [sourceId, targetId, nodes, links]);

  // Run Random Forest Classifier
  const prediction = useMemo(() => {
    return predictAlgorithmWithRandomForest(sourceId, targetId, nodes, links, evaluations);
  }, [sourceId, targetId, nodes, links, evaluations]);

  // Determine active algorithm for graph path visualization
  const activeAlgorithm = isAutoMode ? prediction.recommendedAlgorithm : manualAlgorithm;
  const activePathEvaluation = evaluations[activeAlgorithm];

  // Global telemetry calculations
  const operationalLinksCount = links.filter((l) => !l.isFailed).length;
  const congestedLinksCount = links.filter((l) => l.isCongested && !l.isFailed).length;
  const failedLinksCount = links.filter((l) => l.isFailed).length;
  const avgLatencyAcrossLinks = Math.round(
    links.reduce((acc, l) => acc + l.baseLatency, 0) / Math.max(1, links.length)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Engineering App Bar */}
      <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-6">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white uppercase font-mono">
                  NEXUS ROUTE
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ENGINE v3.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI Dynamic Routing Selector & Topology Studio
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('canvas_lab')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'canvas_lab'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Canvas Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('algorithm_selector')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'algorithm_selector'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Algorithm Selector</span>
            </button>

            <button
              onClick={() => setActiveTab('node_connections')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'node_connections'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Node Connections</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Benchmarks</span>
            </button>

            <button
              onClick={() => setActiveTab('model_dataset')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'model_dataset'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Model & Data</span>
            </button>

            <button
              onClick={() => setActiveTab('python_code')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'python_code'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Python Source</span>
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                handleApplyPreset(avgTrafficLoad > 70 ? 'nominal' : 'heavy_load');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-300 hover:to-cyan-200 rounded-lg shadow-sm transition-all whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{avgTrafficLoad > 70 ? 'Reset Normal Load' : 'Spike Peak Traffic'}</span>
            </button>
          </div>
        </div>

        {/* Global Live Telemetry Sub-Bar */}
        <div className="bg-slate-950 border-t border-slate-900 py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE:</span>
                <strong className="text-slate-200">{operationalLinksCount}/{links.length} cables</strong>
              </span>

              <span>·</span>

              <span>
                AVG LATENCY: <strong className="text-blue-400">{avgLatencyAcrossLinks} ms</strong>
              </span>

              <span>·</span>

              <span>
                CHOKES: <strong className={congestedLinksCount > 0 ? 'text-amber-400' : 'text-slate-300'}>{congestedLinksCount}</strong>
              </span>

              <span>·</span>

              <span>
                CUTS: <strong className={failedLinksCount > 0 ? 'text-rose-400' : 'text-slate-300'}>{failedLinksCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">STRATEGY:</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                  style={{ backgroundColor: ALGORITHM_DETAILS[activeAlgorithm].color }}
                >
                  {ALGORITHM_DETAILS[activeAlgorithm].shortName}
                </span>
                {isAutoMode && (
                  <span className="text-[10px] text-blue-400 font-semibold">(AI AUTO)</span>
                )}
              </div>

              <span>·</span>

              <div className="flex items-center gap-1">
                <span className="text-slate-400">SCORE:</span>
                <span className="font-bold text-emerald-400">{activePathEvaluation.compositeScore}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Mobile Navigation Scrollbar */}
        <div className="flex lg:hidden items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs overflow-x-auto pb-1.5">
          <button
            onClick={() => setActiveTab('canvas_lab')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'canvas_lab' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Canvas Lab
          </button>
          <button
            onClick={() => setActiveTab('algorithm_selector')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'algorithm_selector' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Algorithm Selector
          </button>
          <button
            onClick={() => setActiveTab('node_connections')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'node_connections' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Node Connections
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'benchmark' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('model_dataset')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'model_dataset' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Model & Data
          </button>
          <button
            onClick={() => setActiveTab('python_code')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'python_code' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Python
          </button>
        </div>

        {/* Tab 1: Interactive Canvas Lab */}
        {activeTab === 'canvas_lab' && (
          <div className="flex flex-col gap-6">
            <NetworkCanvas
              nodes={nodes}
              links={links}
              sourceId={sourceId}
              targetId={targetId}
              selectedAlgorithm={activeAlgorithm}
              pathEvaluation={activePathEvaluation}
              isAutoMode={isAutoMode}
              onSelectSource={setSourceId}
              onSelectTarget={setTargetId}
              onSelectAlgorithm={(algo) => {
                setIsAutoMode(false);
                setManualAlgorithm(algo);
              }}
              onToggleLinkFail={handleToggleLinkFail}
              onToggleLinkCongest={handleToggleLinkCongest}
              onNodeDrag={handleNodeDrag}
              onResetTopology={handleResetTopology}
              onToggleConnectNodes={handleToggleConnectNodes}
            />

            {/* AI Decision Engine Card & 10-Feature Vector */}
            <AISelectorEngine
              prediction={prediction}
              activeAlgorithm={activeAlgorithm}
              isAutoMode={isAutoMode}
              onToggleAutoMode={setIsAutoMode}
              onSelectManualAlgorithm={setManualAlgorithm}
            />

            {/* Scenario and Parameter Simulation Controls */}
            <ScenarioControls
              nodeCount={nodeCount}
              topologySeed={topologySeed}
              avgTrafficLoad={avgTrafficLoad}
              congestedCount={congestedCount}
              failedCount={failedCount}
              onChangeNodeCount={setNodeCount}
              onChangeSeed={setTopologySeed}
              onChangeAvgLoad={setAvgTrafficLoad}
              onChangeCongestedCount={setCongestedCount}
              onChangeFailedCount={setFailedCount}
              onApplyPreset={handleApplyPreset}
            />
          </div>
        )}

        {/* Tab 2: Dedicated Algorithm Selector Hub */}
        {activeTab === 'algorithm_selector' && (
          <AlgorithmSelectorHub
            activeAlgorithm={activeAlgorithm}
            isAutoMode={isAutoMode}
            prediction={prediction}
            evaluations={evaluations}
            nodes={nodes}
            links={links}
            sourceId={sourceId}
            targetId={targetId}
            onSelectAlgorithm={(algo) => {
              setIsAutoMode(false);
              setManualAlgorithm(algo);
            }}
            onToggleAutoMode={setIsAutoMode}
            onNavigateToCanvas={() => setActiveTab('canvas_lab')}
          />
        )}

        {/* Tab 3: Dedicated Node Connection & Topology Format Studio */}
        {activeTab === 'node_connections' && (
          <NodeConnectionStudio
            nodes={nodes}
            links={links}
            currentFormat={topologyFormat}
            avgTrafficLoad={avgTrafficLoad}
            congestedCount={congestedCount}
            failedCount={failedCount}
            onUpdateTopology={(updatedNodes, updatedLinks, format) => {
              setNodes(updatedNodes);
              setLinks(updatedLinks);
              if (format) setTopologyFormat(format);
            }}
            onNavigateToCanvas={() => setActiveTab('canvas_lab')}
          />
        )}

        {/* Tab 4: Performance Comparison */}
        {activeTab === 'benchmark' && (
          <div className="flex flex-col gap-6">
            <PerformanceDashboard
              evaluations={evaluations}
              activeAlgorithm={activeAlgorithm}
              aiRecommendedAlgorithm={prediction.recommendedAlgorithm}
              onSelectAlgorithm={(algo) => {
                setIsAutoMode(false);
                setManualAlgorithm(algo);
                setActiveTab('canvas_lab');
              }}
            />

            {/* Quick Scenario Controls to test benchmark shifts */}
            <ScenarioControls
              nodeCount={nodeCount}
              topologySeed={topologySeed}
              avgTrafficLoad={avgTrafficLoad}
              congestedCount={congestedCount}
              failedCount={failedCount}
              onChangeNodeCount={setNodeCount}
              onChangeSeed={setTopologySeed}
              onChangeAvgLoad={setAvgTrafficLoad}
              onChangeCongestedCount={setCongestedCount}
              onChangeFailedCount={setFailedCount}
              onApplyPreset={handleApplyPreset}
            />
          </div>
        )}

        {/* Tab 5: Model & Dataset */}
        {activeTab === 'model_dataset' && (
          <div className="flex flex-col gap-6">
            <ModelDatasetInspector
              dataset={dataset}
              onRegenerateDataset={() => setDataset(generateSyntheticDataset())}
            />
          </div>
        )}

        {/* Tab 6: Python Source Files */}
        {activeTab === 'python_code' && (
          <div className="flex flex-col gap-6">
            <PythonSourceViewer />
          </div>
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400 font-medium">
              NEXUS ROUTE // Dynamic AI Routing Algorithm Selector & Interconnect Studio
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Dijkstra</span>
            <span>·</span>
            <span>Alternate Path</span>
            <span>·</span>
            <span>Load Balancing</span>
            <span>·</span>
            <span>Fault Tolerant</span>
            <span>·</span>
            <span className="text-blue-400">Random Forest Classifier</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
