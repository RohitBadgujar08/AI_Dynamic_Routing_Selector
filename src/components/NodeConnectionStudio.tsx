import React, { useState } from 'react';
import { NetworkNode, NetworkLink, TopologyFormatType } from '../types/network';
import {
  exportEdgeListSyntax,
  parseEdgeListSyntax,
  computeGraphDiagnostics,
  generateTopologyByFormat
} from '../data/topologyGenerator';
import {
  Network,
  Share2,
  Grid,
  CircleDot,
  Radio,
  Server,
  Code,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface NodeConnectionStudioProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  currentFormat: TopologyFormatType;
  avgTrafficLoad: number;
  congestedCount: number;
  failedCount: number;
  onUpdateTopology: (nodes: NetworkNode[], links: NetworkLink[], format?: TopologyFormatType) => void;
  onNavigateToCanvas?: () => void;
}

export const NodeConnectionStudio: React.FC<NodeConnectionStudioProps> = ({
  nodes,
  links,
  currentFormat,
  avgTrafficLoad,
  congestedCount,
  failedCount,
  onUpdateTopology,
  onNavigateToCanvas
}) => {
  const [activeFormatTab, setActiveFormatTab] = useState<'topology_patterns' | 'syntax_editor' | 'adjacency_matrix'>(
    'topology_patterns'
  );
  const [edgeListText, setEdgeListText] = useState(() => exportEdgeListSyntax(links));
  const [copied, setCopied] = useState(false);
  const [parseStatus, setParseStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const diagnostics = computeGraphDiagnostics(nodes, links);

  // Sync edge list text when links change
  React.useEffect(() => {
    setEdgeListText(exportEdgeListSyntax(links));
  }, [links]);

  const topologyOptions: {
    format: TopologyFormatType;
    title: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }[] = [
    {
      format: 'watts_strogatz',
      title: 'Watts-Strogatz Small World',
      description: 'Clustered regular ring lattice with random shortcut rewiring. Standard model for WAN & Internet core backbones.',
      icon: Network,
      badge: 'ISP Backbone'
    },
    {
      format: 'full_mesh',
      title: 'Full Mesh (All-to-All)',
      description: 'Every router connects to all other routers. Maximizes path redundancy and fault resilience with high link density.',
      icon: Share2,
      badge: 'High Redundancy'
    },
    {
      format: 'ring_lattice',
      title: 'Ring Lattice with Chords',
      description: 'Circular ring network with diameter chords. Common in Metro Ethernet rings and SONET/SDH self-healing architectures.',
      icon: CircleDot,
      badge: 'Metro Ring'
    },
    {
      format: 'star_hub',
      title: 'Star / Hub-and-Spoke',
      description: 'Central core switch connected to branch access routers. Typical of enterprise campus LANs and satellite edge nodes.',
      icon: Radio,
      badge: 'Enterprise Hub'
    },
    {
      format: 'grid_matrix',
      title: '2D Grid / Mesh Matrix',
      description: 'Orthogonal coordinate grid with horizontal and vertical lines. Standard in High-Performance Computing (HPC) & Torus clusters.',
      icon: Grid,
      badge: 'HPC / Torus'
    },
    {
      format: 'spine_leaf',
      title: 'Data Center Spine-Leaf',
      description: 'Two-tier Clos architecture: top spine switches fully meshed with bottom leaf server-rack switches.',
      icon: Server,
      badge: 'Data Center Clos'
    }
  ];

  // Apply a topology pattern
  const handleSelectFormat = (format: TopologyFormatType) => {
    const generated = generateTopologyByFormat(
      format,
      nodes.length,
      Math.floor(Math.random() * 9999) + 1,
      avgTrafficLoad,
      congestedCount,
      failedCount
    );
    onUpdateTopology(generated.nodes, generated.links, format);
  };

  // Parse and apply text syntax
  const handleApplySyntax = () => {
    try {
      const parsedLinks = parseEdgeListSyntax(edgeListText, nodes);
      if (parsedLinks.length === 0) {
        setParseStatus({
          type: 'error',
          message: 'No valid connections found. Check format: R1 <---> R2 [12ms, 1000M, 40% load]'
        });
        return;
      }
      onUpdateTopology(nodes, parsedLinks, 'custom');
      setParseStatus({
        type: 'success',
        message: `Successfully loaded ${parsedLinks.length} connections across ${nodes.length} nodes!`
      });
      setTimeout(() => setParseStatus({ type: 'idle', message: '' }), 4000);
    } catch (e: any) {
      setParseStatus({
        type: 'error',
        message: e.message || 'Failed to parse connection syntax.'
      });
    }
  };

  // Copy text to clipboard
  const handleCopySyntax = () => {
    navigator.clipboard.writeText(edgeListText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle link in Adjacency Matrix
  const handleToggleMatrixCell = (uId: string, vId: string) => {
    if (uId === vId) return;
    const existingIndex = links.findIndex(
      (l) => (l.source === uId && l.target === vId) || (l.source === vId && l.target === uId)
    );

    let updatedLinks: NetworkLink[];
    if (existingIndex >= 0) {
      // Remove link
      updatedLinks = links.filter((_, i) => i !== existingIndex);
    } else {
      // Add link with nominal properties
      const newLink: NetworkLink = {
        id: `L_${uId}_${vId}`,
        source: uId,
        target: vId,
        baseLatency: 14,
        bandwidth: 1000,
        packetLoss: 0.3,
        trafficLoad: 35,
        isFailed: false,
        isCongested: false
      };
      updatedLinks = [...links, newLink];
    }
    onUpdateTopology(nodes, updatedLinks, 'custom');
  };

  // Add a new node
  const handleAddNode = () => {
    const nextIdNum = nodes.length + 1;
    const newId = `R${nextIdNum}`;
    const newNode: NetworkNode = {
      id: newId,
      label: `Router ${nextIdNum}`,
      x: Math.round(150 + Math.random() * 640),
      y: Math.round(100 + Math.random() * 200),
      role: 'distribution'
    };
    // Connect to at least 2 existing nodes
    const connectTo1 = nodes[0]?.id;
    const connectTo2 = nodes[Math.min(nodes.length - 1, 2)]?.id;

    const newLinks: NetworkLink[] = [...links];
    if (connectTo1) {
      newLinks.push({
        id: `L_${newId}_${connectTo1}`,
        source: newId,
        target: connectTo1,
        baseLatency: 15,
        bandwidth: 1000,
        packetLoss: 0.2,
        trafficLoad: 30,
        isFailed: false,
        isCongested: false
      });
    }
    if (connectTo2 && connectTo2 !== connectTo1) {
      newLinks.push({
        id: `L_${newId}_${connectTo2}`,
        source: newId,
        target: connectTo2,
        baseLatency: 18,
        bandwidth: 800,
        packetLoss: 0.4,
        trafficLoad: 40,
        isFailed: false,
        isCongested: false
      });
    }
    onUpdateTopology([...nodes, newNode], newLinks, 'custom');
  };

  // Remove last node
  const handleRemoveNode = () => {
    if (nodes.length <= 4) return;
    const lastNode = nodes[nodes.length - 1];
    const updatedNodes = nodes.slice(0, -1);
    const updatedLinks = links.filter((l) => l.source !== lastNode.id && l.target !== lastNode.id);
    onUpdateTopology(updatedNodes, updatedLinks, 'custom');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Studio Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              Topology Studio
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              Node Connections & Interconnect Formats
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Configure Topology Architecture & Connection Formats
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Format how network nodes connect together. Switch between standard architectures (Small-World, Full Mesh, Ring, Star, Grid, Spine-Leaf),
            directly edit the connection syntax/edge list, or toggle cables in the interactive Adjacency Matrix.
          </p>
        </div>

        {/* Node Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddNode}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Add a new Router to the topology"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Router</span>
          </button>

          <button
            onClick={handleRemoveNode}
            disabled={nodes.length <= 4}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-300 bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700/60 rounded-lg transition-colors disabled:opacity-40"
            title="Remove highest numbered router"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          {onNavigateToCanvas && (
            <button
              onClick={onNavigateToCanvas}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors"
            >
              <span>View Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Total Routers</span>
          <span className="text-lg font-mono font-bold text-slate-100">{diagnostics.nodeCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Total Cables (Links)</span>
          <span className="text-lg font-mono font-bold text-blue-400">{diagnostics.linkCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Graph Density</span>
          <span className="text-lg font-mono font-bold text-cyan-400">{diagnostics.density}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Avg Node Degree</span>
          <span className="text-lg font-mono font-bold text-emerald-400">{diagnostics.avgDegree}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Active Operational</span>
          <span className="text-lg font-mono font-bold text-emerald-300">{diagnostics.activeLinksCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">Failed / Congested</span>
          <span className="text-lg font-mono font-bold text-rose-400">
            {diagnostics.failedLinksCount} / {diagnostics.congestedLinksCount}
          </span>
        </div>
      </div>

      {/* Format Mode Navigation Pills */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 max-w-fit">
        <button
          onClick={() => setActiveFormatTab('topology_patterns')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeFormatTab === 'topology_patterns'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Topology Architecture Patterns</span>
        </button>

        <button
          onClick={() => setActiveFormatTab('syntax_editor')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeFormatTab === 'syntax_editor'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Connection Syntax / Edge List</span>
        </button>

        <button
          onClick={() => setActiveFormatTab('adjacency_matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeFormatTab === 'adjacency_matrix'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Interactive Adjacency Matrix</span>
        </button>
      </div>

      {/* Tab 1: Topology Architecture Patterns */}
      {activeFormatTab === 'topology_patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topologyOptions.map((opt) => {
            const { format, title, description, icon: Icon, badge } = opt;
            const isCurrent = currentFormat === format;

            return (
              <div
                key={format}
                onClick={() => handleSelectFormat(format)}
                className={`relative flex flex-col justify-between p-5 rounded-2xl cursor-pointer transition-all border ${
                  isCurrent
                    ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                      {badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mb-1">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {isCurrent ? 'Current Active Format' : 'Click to generate'}
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      isCurrent ? 'text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    {isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{isCurrent ? 'Active' : 'Apply'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Connection Syntax / Edge List Editor */}
      {activeFormatTab === 'syntax_editor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Network Connection Syntax / Edge List Representation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format: <code className="text-blue-300 font-mono">RouterA &lt;---&gt; RouterB [Latency_ms, Bandwidth_M, Load_%, Loss_%]</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySyntax}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Syntax'}</span>
              </button>

              <button
                onClick={() => setEdgeListText(exportEdgeListSyntax(links))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                title="Reload current links from active topology"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Canvas</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={edgeListText}
              onChange={(e) => setEdgeListText(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 font-mono text-xs text-blue-200 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed resize-y selection:bg-blue-600 selection:text-white"
              placeholder="R1 <---> R2 [12ms, 1000M, 35% load]&#10;R1 <---> R4 [18ms, 800M, 42% load]"
            />
          </div>

          {parseStatus.message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                parseStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
              }`}
            >
              {parseStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{parseStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Lines starting with '#' are ignored. Routers must match existing IDs (R1 .. R{nodes.length}).
            </span>

            <button
              onClick={handleApplySyntax}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>Apply Connection Syntax to Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Adjacency Matrix */}
      {activeFormatTab === 'adjacency_matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                N × N Interconnect Adjacency Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any cell to immediately connect or disconnect the cable between two router nodes.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded bg-blue-600/80 border border-blue-400" />
                <span>Connected</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>Disconnected</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full pb-2">
            <table className="border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-800 bg-slate-950 text-slate-500 text-[10px]">
                    src \ dst
                  </th>
                  {nodes.map((n) => (
                    <th
                      key={n.id}
                      className="p-2 border border-slate-800 bg-slate-950 text-slate-300 font-bold min-w-[42px] text-center"
                    >
                      {n.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map((rowNode) => (
                  <tr key={rowNode.id}>
                    <th className="p-2 border border-slate-800 bg-slate-950 text-slate-300 font-bold text-center">
                      {rowNode.id}
                    </th>
                    {nodes.map((colNode) => {
                      const isSelf = rowNode.id === colNode.id;
                      const link = links.find(
                        (l) =>
                          (l.source === rowNode.id && l.target === colNode.id) ||
                          (l.source === colNode.id && l.target === rowNode.id)
                      );
                      const isConnected = !!link;

                      return (
                        <td
                          key={colNode.id}
                          onClick={() => !isSelf && handleToggleMatrixCell(rowNode.id, colNode.id)}
                          className={`p-2 border border-slate-800/80 text-center transition-all ${
                            isSelf
                              ? 'bg-slate-950/40 text-slate-700 cursor-not-allowed'
                              : isConnected
                              ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 cursor-pointer font-bold'
                              : 'bg-slate-950/60 hover:bg-slate-800/50 text-slate-600 cursor-pointer'
                          }`}
                          title={
                            isSelf
                              ? 'Same node'
                              : isConnected
                              ? `${rowNode.id} ↔ ${colNode.id}: ${link?.baseLatency}ms (${link?.trafficLoad}% load)`
                              : `Click to connect ${rowNode.id} and ${colNode.id}`
                          }
                        >
                          {isSelf ? '—' : isConnected ? `${link?.baseLatency}ms` : '0'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
