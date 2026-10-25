import React, { useState, useRef, useEffect } from 'react';
import { NetworkNode, NetworkLink, AlgorithmType, PathEvaluation } from '../types/network';
import { ALGORITHM_DETAILS, getLink } from '../algorithms/routing';
import {
  Play,
  Pause,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Cable,
  Activity,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  sourceId: string;
  targetId: string;
  selectedAlgorithm: AlgorithmType;
  pathEvaluation: PathEvaluation;
  isAutoMode?: boolean;
  onSelectSource: (id: string) => void;
  onSelectTarget: (id: string) => void;
  onSelectAlgorithm?: (algo: AlgorithmType) => void;
  onToggleLinkFail: (linkId: string) => void;
  onToggleLinkCongest: (linkId: string) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onResetTopology: () => void;
  onToggleConnectNodes?: (u: string, v: string) => void;
}

interface AnimatedPacket {
  id: number;
  segmentIndex: number;
  progress: number;
}

// Function to convert link traffic load into Green -> Yellow -> Red gradient
function getLoadColor(load: number): string {
  if (load < 40) return '#10b981'; // Green (light load)
  if (load < 60) return '#84cc16'; // Lime
  if (load < 75) return '#f59e0b'; // Amber / Yellow (moderate to congested)
  return '#ef4444'; // Red (>70% heavy congestion)
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  links,
  sourceId,
  targetId,
  selectedAlgorithm,
  pathEvaluation,
  isAutoMode = false,
  onSelectSource,
  onSelectTarget,
  onSelectAlgorithm,
  onToggleLinkFail,
  onToggleLinkCongest,
  onNodeDrag,
  onResetTopology,
  onToggleConnectNodes,
}) => {
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [packets, setPackets] = useState<AnimatedPacket[]>([]);
  const [wireMode, setWireMode] = useState<boolean>(false);
  const [wireSourceNode, setWireSourceNode] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const nextPacketId = useRef<number>(1);

  const activePath = pathEvaluation.path;

  // Packet animation loop
  useEffect(() => {
    if (!isPlaying || activePath.length < 2) {
      setPackets([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      setPackets((prev) => {
        if (prev.length > 18) return prev;
        return [
          ...prev,
          {
            id: nextPacketId.current++,
            segmentIndex: 0,
            progress: 0,
          },
        ];
      });
    }, 850 / simSpeed);

    const frameInterval = setInterval(() => {
      setPackets((prev) => {
        return prev
          .map((packet) => {
            const newProgress = packet.progress + 0.045 * simSpeed;
            if (newProgress >= 1) {
              const nextSegment = packet.segmentIndex + 1;
              if (nextSegment >= activePath.length - 1) {
                return null; // reached destination
              }
              return {
                ...packet,
                segmentIndex: nextSegment,
                progress: 0,
              };
            }
            return { ...packet, progress: newProgress };
          })
          .filter((p): p is AnimatedPacket => p !== null);
      });
    }, 30);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(frameInterval);
    };
  }, [isPlaying, simSpeed, activePath]);

  // Handle Dragging
  const handleMouseDownNode = (e: React.MouseEvent, node: NetworkNode) => {
    e.stopPropagation();

    // If Wire / Connect tool is active, handle connecting two nodes
    if (wireMode) {
      if (!wireSourceNode) {
        setWireSourceNode(node.id);
      } else if (wireSourceNode === node.id) {
        setWireSourceNode(null);
      } else {
        if (onToggleConnectNodes) {
          onToggleConnectNodes(wireSourceNode, node.id);
        }
        setWireSourceNode(null);
      }
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 940 / rect.width;
    const scaleY = 400 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setDraggingNode(node.id);
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 940 / rect.width;
    const scaleY = 400 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(30, Math.min(910, mouseX - dragOffset.x));
    const clampedY = Math.max(30, Math.min(370, mouseY - dragOffset.y));

    onNodeDrag(draggingNode, Math.round(clampedX), Math.round(clampedY));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // Determine active route link IDs
  const activeRouteLinkIds = new Set<string>();
  for (let i = 0; i < activePath.length - 1; i++) {
    const link = getLink(activePath[i], activePath[i + 1], links);
    if (link) activeRouteLinkIds.add(link.id);
  }

  // Get current packet coordinates
  const getPacketCoordinates = (packet: AnimatedPacket) => {
    const uId = activePath[packet.segmentIndex];
    const vId = activePath[packet.segmentIndex + 1];
    const u = nodes.find((n) => n.id === uId);
    const v = nodes.find((n) => n.id === vId);
    if (!u || !v) return null;

    const x = u.x + (v.x - u.x) * packet.progress;
    const y = u.y + (v.y - u.y) * packet.progress;
    return { x, y };
  };

  const wireSourceNodeObj = wireSourceNode ? nodes.find((n) => n.id === wireSourceNode) : null;

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Topology Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-slate-950/80">
        {/* Left: Quick Algorithm Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Active Strategy:
          </span>

          {(['dijkstra', 'alternate_path', 'load_balancing', 'fault_tolerant'] as AlgorithmType[]).map((algoKey) => {
            const meta = ALGORITHM_DETAILS[algoKey];
            const isSelected = selectedAlgorithm === algoKey;

            return (
              <button
                key={algoKey}
                onClick={() => onSelectAlgorithm && onSelectAlgorithm(algoKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <span>{meta.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Wiring Tool & Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Wire / Connect Tool */}
          <button
            onClick={() => {
              setWireMode(!wireMode);
              setWireSourceNode(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
              wireMode
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
            title="Click node A then node B to create or remove an edge"
          >
            <Cable className="w-3.5 h-3.5" />
            <span>{wireMode ? (wireSourceNode ? `Click Target for ${wireSourceNode}` : 'Wiring Mode Active') : 'Wire / Connect'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Sim Speed */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  simSpeed === speed ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={onResetTopology}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700 rounded-lg transition-colors"
            title="Reset link failure and load overrides"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ minHeight: '410px' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 940 400"
          className={`w-full h-full select-none ${wireMode ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <filter id="route-blue-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <pattern id="grid-subtle-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid-subtle-pattern)" />

          {/* Render Graph Links */}
          {links.map((link) => {
            const u = nodes.find((n) => n.id === link.source);
            const v = nodes.find((n) => n.id === link.target);
            if (!u || !v) return null;

            const isRouteEdge = activeRouteLinkIds.has(link.id);
            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;

            let strokeColor = getLoadColor(link.trafficLoad);
            let strokeDasharray = 'none';
            let strokeWidth = 2.5;

            if (link.isFailed) {
              strokeColor = '#ef4444';
              strokeDasharray = '6 6';
              strokeWidth = 2.5;
            } else if (isRouteEdge) {
              strokeColor = '#3b82f6';
              strokeWidth = 5;
            }

            return (
              <g
                key={link.id}
                className="cursor-pointer group"
                onClick={() => setSelectedLink(link)}
              >
                {/* Wide invisible click zone */}
                <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} stroke="transparent" strokeWidth="18" />

                {/* Visible Link Line */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  filter={isRouteEdge ? 'url(#route-blue-glow)' : undefined}
                />

                {/* Red X Badge on Broken/Cut Link */}
                {link.isFailed && (
                  <g transform={`translate(${midX - 10}, ${midY - 10})`}>
                    <circle cx="10" cy="10" r="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="6" y1="6" x2="14" y2="14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="6" x2="6" y2="14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}

                {/* Link Telemetry Pill */}
                {!link.isFailed && (
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                    <rect
                      x="-34"
                      y="-10"
                      width="68"
                      height="20"
                      rx="5"
                      fill="#0f172a"
                      stroke={isRouteEdge ? '#3b82f6' : link.isCongested ? '#f59e0b' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="fill-slate-300 font-mono text-[10px] select-none"
                    >
                      {link.baseLatency}ms · {link.trafficLoad}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Wire Mode Anchor Connection Line (if node is selected) */}
          {wireMode && wireSourceNodeObj && (
            <circle
              cx={wireSourceNodeObj.x}
              cy={wireSourceNodeObj.y}
              r="28"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-spin"
            />
          )}

          {/* Animated Flow Packets along Chosen Route */}
          {isPlaying &&
            packets.map((packet) => {
              const coords = getPacketCoordinates(packet);
              if (!coords) return null;
              return (
                <g key={packet.id} className="pointer-events-none">
                  {/* Subtle packet halo */}
                  <circle cx={coords.x} cy={coords.y} r="8" fill="rgba(96,165,250,0.3)" />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="4.5"
                    fill="#60a5fa"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

          {/* Render Graph Nodes */}
          {nodes.map((node) => {
            const isSource = node.id === sourceId;
            const isTarget = node.id === targetId;
            const isPathNode = activePath.includes(node.id);
            const isWireAnchor = wireSourceNode === node.id;

            let nodeFill = '#0f172a';
            let nodeStroke = '#334155';
            let radius = 22;

            if (isSource) {
              nodeFill = '#064e3b';
              nodeStroke = '#10b981';
              radius = 25;
            } else if (isTarget) {
              nodeFill = '#1e3a8a';
              nodeStroke = '#3b82f6';
              radius = 25;
            } else if (isPathNode) {
              nodeFill = '#172554';
              nodeStroke = '#60a5fa';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-move select-none"
                onMouseDown={(e) => handleMouseDownNode(e, node)}
              >
                {/* Outer status ring */}
                <circle
                  cx="0"
                  cy="0"
                  r={radius}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={isSource || isTarget ? '3' : '2'}
                  filter={isPathNode ? 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' : undefined}
                />

                {/* Inner center core LED */}
                <circle
                  cx="0"
                  cy="0"
                  r="7"
                  fill={isSource ? '#10b981' : isTarget ? '#3b82f6' : isPathNode ? '#93c5fd' : '#475569'}
                />

                {/* Role or Source/Target Tag on Top */}
                {isSource && (
                  <text
                    x="0"
                    y="-32"
                    textAnchor="middle"
                    className="fill-emerald-400 font-bold text-[10px] tracking-wider uppercase font-mono"
                  >
                    Source (Tx)
                  </text>
                )}
                {isTarget && (
                  <text
                    x="0"
                    y="-32"
                    textAnchor="middle"
                    className="fill-blue-400 font-bold text-[10px] tracking-wider uppercase font-mono"
                  >
                    Target (Rx)
                  </text>
                )}

                {/* Node ID label below */}
                <text
                  x="0"
                  y="34"
                  textAnchor="middle"
                  className="fill-slate-200 font-bold text-[11px] drop-shadow-md select-none font-mono"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Link Click Inspector Popover */}
        {selectedLink && (
          <div className="absolute top-4 right-4 z-20 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 font-mono flex items-center gap-2">
                <Cable className="w-3.5 h-3.5 text-blue-400" />
                <span>Cable: {selectedLink.source} ↔ {selectedLink.target}</span>
              </span>
              <button
                onClick={() => setSelectedLink(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Base Latency</span>
                <span className="font-mono font-medium">{selectedLink.baseLatency} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Bandwidth</span>
                <span className="font-mono font-medium">{selectedLink.bandwidth} Mbps</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Traffic Load</span>
                <span className="font-mono font-medium">{selectedLink.trafficLoad}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Link Health</span>
                <span className={`font-mono font-medium ${selectedLink.isFailed ? 'text-rose-400' : selectedLink.isCongested ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedLink.isFailed ? 'Severed (Cut)' : selectedLink.isCongested ? 'Congested (>70%)' : 'Healthy'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  onToggleLinkFail(selectedLink.id);
                  setSelectedLink((prev) => (prev ? { ...prev, isFailed: !prev.isFailed } : null));
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-lg transition-colors ${
                  selectedLink.isFailed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-rose-950/80 text-rose-200 border border-rose-800/80 hover:bg-rose-900'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{selectedLink.isFailed ? 'Repair Link' : 'Cut Cable'}</span>
              </button>

              <button
                onClick={() => {
                  onToggleLinkCongest(selectedLink.id);
                  setSelectedLink((prev) =>
                    prev
                      ? {
                          ...prev,
                          isCongested: !prev.isCongested,
                          trafficLoad: !prev.isCongested ? 92 : 30,
                        }
                      : null
                  );
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-lg transition-colors ${
                  selectedLink.isCongested
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-amber-950/80 text-amber-200 border border-amber-800/80 hover:bg-amber-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{selectedLink.isCongested ? 'Clear Jam' : 'Force Jam'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Source / Target Selectors in Canvas Footer */}
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Source:</span>
            <select
              value={sourceId}
              onChange={(e) => onSelectSource(e.target.value)}
              className="bg-slate-800 text-emerald-400 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-medium focus:outline-none focus:border-emerald-500"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === targetId}>
                  {n.id} ({n.label})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-600">→</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Destination:</span>
            <select
              value={targetId}
              onChange={(e) => onSelectTarget(e.target.value)}
              className="bg-slate-800 text-blue-400 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-medium focus:outline-none focus:border-blue-500"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === sourceId}>
                  {n.id} ({n.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Route Path & Score Pill */}
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Route:</span>
          {activePath.length > 0 ? (
            <span className="font-mono text-[11px] text-blue-300 font-semibold">
              {activePath.join(' → ')}
            </span>
          ) : (
            <span className="text-rose-400 font-mono text-[11px]">Partitioned</span>
          )}
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Score:</span>
          <span className="font-mono font-bold text-emerald-400">{pathEvaluation.compositeScore}</span>
        </div>
      </div>
    </div>
  );
};
