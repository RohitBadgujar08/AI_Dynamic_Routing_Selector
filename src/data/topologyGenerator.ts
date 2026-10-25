import { NetworkNode, NetworkLink, TopologyFormatType } from '../types/network';

// Pseudo-random generator using a numeric seed
export function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate Watts-Strogatz small-world graph topology
export function generateWattsStrogatzTopology(
  nodeCount: number = 12,
  kNeighbors: number = 4,
  rewireProbability: number = 0.25,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 2,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];

  const centerX = 470;
  const centerY = 200;
  const radiusX = 360;
  const radiusY = 145;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    const jitterX = (rng() - 0.5) * 20;
    const jitterY = (rng() - 0.5) * 20;
    const x = Math.round(centerX + radiusX * Math.cos(angle) + jitterX);
    const y = Math.round(centerY + radiusY * Math.sin(angle) + jitterY);

    nodes.push({
      id: `R${i + 1}`,
      label: `Router ${i + 1}`,
      x,
      y,
      role: i % 3 === 0 ? 'core' : 'distribution'
    });
  }

  const edgeSet = new Set<string>();
  const rawEdges: [number, number][] = [];

  const addEdge = (u: number, v: number) => {
    if (u === v) return false;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    rawEdges.push([u, v]);
    return true;
  };

  const halfK = Math.max(1, Math.floor(kNeighbors / 2));
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 1; j <= halfK; j++) {
      const neighbor = (i + j) % nodeCount;
      addEdge(i, neighbor);
    }
  }

  const finalEdges: [number, number][] = [];
  for (const [u, v] of rawEdges) {
    if (rng() < rewireProbability) {
      let attempts = 0;
      let newV = Math.floor(rng() * nodeCount);
      const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

      while ((newV === u || edgeSet.has(edgeKey(u, newV))) && attempts < 15) {
        newV = Math.floor(rng() * nodeCount);
        attempts++;
      }

      if (attempts < 15) {
        edgeSet.delete(edgeKey(u, v));
        edgeSet.add(edgeKey(u, newV));
        finalEdges.push([u, newV]);
        continue;
      }
    }
    finalEdges.push([u, v]);
  }

  return buildLinksFromEdges(nodes, finalEdges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Generate Full Mesh topology (every node connected to every other)
export function generateFullMeshTopology(
  nodeCount: number = 8,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 1,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];
  const safeCount = Math.min(12, Math.max(4, nodeCount));

  const centerX = 470;
  const centerY = 200;
  const radiusX = 340;
  const radiusY = 140;

  for (let i = 0; i < safeCount; i++) {
    const angle = (2 * Math.PI * i) / safeCount - Math.PI / 2;
    nodes.push({
      id: `R${i + 1}`,
      label: `Router ${i + 1}`,
      x: Math.round(centerX + radiusX * Math.cos(angle)),
      y: Math.round(centerY + radiusY * Math.sin(angle)),
      role: 'core'
    });
  }

  const edges: [number, number][] = [];
  for (let i = 0; i < safeCount; i++) {
    for (let j = i + 1; j < safeCount; j++) {
      edges.push([i, j]);
    }
  }

  return buildLinksFromEdges(nodes, edges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Generate Ring Lattice with Cross-Chords
export function generateRingLatticeTopology(
  nodeCount: number = 10,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 1,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];

  const centerX = 470;
  const centerY = 200;
  const radiusX = 350;
  const radiusY = 145;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    nodes.push({
      id: `R${i + 1}`,
      label: `Router ${i + 1}`,
      x: Math.round(centerX + radiusX * Math.cos(angle)),
      y: Math.round(centerY + radiusY * Math.sin(angle)),
      role: 'distribution'
    });
  }

  const edges: [number, number][] = [];
  // Perimeter ring
  for (let i = 0; i < nodeCount; i++) {
    edges.push([i, (i + 1) % nodeCount]);
  }
  // Cross chords across diameter for every 3rd node
  for (let i = 0; i < Math.floor(nodeCount / 2); i += 2) {
    const opposite = (i + Math.floor(nodeCount / 2)) % nodeCount;
    edges.push([i, opposite]);
  }

  return buildLinksFromEdges(nodes, edges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Generate Star / Hub-and-Spoke Topology
export function generateStarTopology(
  nodeCount: number = 9,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 1,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];

  // R1 is the Core Central Hub
  nodes.push({
    id: 'R1',
    label: 'Core Switch R1',
    x: 470,
    y: 200,
    role: 'core'
  });

  const spokesCount = nodeCount - 1;
  const radiusX = 350;
  const radiusY = 145;

  for (let i = 0; i < spokesCount; i++) {
    const angle = (2 * Math.PI * i) / spokesCount - Math.PI / 2;
    nodes.push({
      id: `R${i + 2}`,
      label: `Edge R${i + 2}`,
      x: Math.round(470 + radiusX * Math.cos(angle)),
      y: Math.round(200 + radiusY * Math.sin(angle)),
      role: 'access'
    });
  }

  const edges: [number, number][] = [];
  // Connect all spokes to core hub (0)
  for (let i = 1; i <= spokesCount; i++) {
    edges.push([0, i]);
  }
  // Connect adjacent outer spokes to form redundant ring
  for (let i = 1; i <= spokesCount; i++) {
    const next = i === spokesCount ? 1 : i + 1;
    edges.push([i, next]);
  }

  return buildLinksFromEdges(nodes, edges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Generate 2D Grid / Mesh Matrix Topology
export function generateGridTopology(
  nodeCount: number = 12,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 2,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];

  // Determine rows & cols (e.g. 3x4 = 12, or 3x3 = 9)
  const cols = nodeCount >= 15 ? 5 : nodeCount >= 10 ? 4 : 3;
  const rows = Math.ceil(nodeCount / cols);

  const startX = 120;
  const endX = 820;
  const startY = 70;
  const endY = 330;

  const stepX = (endX - startX) / (cols - 1);
  const stepY = rows > 1 ? (endY - startY) / (rows - 1) : 0;

  let idIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idIdx >= nodeCount) break;
      nodes.push({
        id: `R${idIdx + 1}`,
        label: `Router ${idIdx + 1}`,
        x: Math.round(startX + c * stepX),
        y: Math.round(startY + r * stepY),
        role: r === 0 || r === rows - 1 ? 'distribution' : 'core'
      });
      idIdx++;
    }
  }

  const edges: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= nodeCount) continue;

      // Horizontal edge
      if (c + 1 < cols && idx + 1 < nodeCount) {
        edges.push([idx, idx + 1]);
      }
      // Vertical edge
      if (r + 1 < rows && idx + cols < nodeCount) {
        edges.push([idx, idx + cols]);
      }
    }
  }

  return buildLinksFromEdges(nodes, edges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Generate Data Center Spine-Leaf Architecture
export function generateSpineLeafTopology(
  nodeCount: number = 10,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 1,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const rng = createSeededRandom(seed);
  const nodes: NetworkNode[] = [];

  const spineCount = Math.max(2, Math.min(4, Math.floor(nodeCount / 3)));
  const leafCount = nodeCount - spineCount;

  // Spine routers on top tier
  const spineStartX = 260;
  const spineEndX = 680;
  const spineStepX = (spineEndX - spineStartX) / Math.max(1, spineCount - 1);

  for (let s = 0; s < spineCount; s++) {
    nodes.push({
      id: `R${s + 1}`,
      label: `Spine ${s + 1}`,
      x: Math.round(spineStartX + s * spineStepX),
      y: 90,
      role: 'spine'
    });
  }

  // Leaf routers on bottom tier
  const leafStartX = 100;
  const leafEndX = 840;
  const leafStepX = (leafEndX - leafStartX) / Math.max(1, leafCount - 1);

  for (let l = 0; l < leafCount; l++) {
    const idx = spineCount + l;
    nodes.push({
      id: `R${idx + 1}`,
      label: `Leaf ${l + 1}`,
      x: Math.round(leafStartX + l * leafStepX),
      y: 310,
      role: 'leaf'
    });
  }

  // Fully connect every spine to every leaf
  const edges: [number, number][] = [];
  for (let s = 0; s < spineCount; s++) {
    for (let l = 0; l < leafCount; l++) {
      edges.push([s, spineCount + l]);
    }
  }

  return buildLinksFromEdges(nodes, edges, rng, avgTrafficLoad, targetCongestedCount, targetFailedCount);
}

// Master Dispatcher for Topology Generation
export function generateTopologyByFormat(
  format: TopologyFormatType,
  nodeCount: number = 12,
  seed: number = 42,
  avgTrafficLoad: number = 40,
  targetCongestedCount: number = 2,
  targetFailedCount: number = 0
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  switch (format) {
    case 'full_mesh':
      return generateFullMeshTopology(nodeCount, seed, avgTrafficLoad, targetCongestedCount, targetFailedCount);
    case 'ring_lattice':
      return generateRingLatticeTopology(nodeCount, seed, avgTrafficLoad, targetCongestedCount, targetFailedCount);
    case 'star_hub':
      return generateStarTopology(nodeCount, seed, avgTrafficLoad, targetCongestedCount, targetFailedCount);
    case 'grid_matrix':
      return generateGridTopology(nodeCount, seed, avgTrafficLoad, targetCongestedCount, targetFailedCount);
    case 'spine_leaf':
      return generateSpineLeafTopology(nodeCount, seed, avgTrafficLoad, targetCongestedCount, targetFailedCount);
    case 'watts_strogatz':
    default:
      return generateWattsStrogatzTopology(
        nodeCount,
        4,
        0.25,
        seed,
        avgTrafficLoad,
        targetCongestedCount,
        targetFailedCount
      );
  }
}

// Internal link builder with realistic telemetry
function buildLinksFromEdges(
  nodes: NetworkNode[],
  rawEdges: [number, number][],
  rng: () => number,
  avgTrafficLoad: number,
  targetCongestedCount: number,
  targetFailedCount: number
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const links: NetworkLink[] = rawEdges.map(([uIdx, vIdx]) => {
    const u = nodes[uIdx];
    const v = nodes[vIdx];
    const dx = u.x - v.x;
    const dy = u.y - v.y;
    const geomDist = Math.sqrt(dx * dx + dy * dy);

    const baseLatency = Math.round(6 + (geomDist / 50) * 3 + rng() * 4);
    const bandwidth = [400, 600, 800, 1000, 2000][Math.floor(rng() * 5)];
    const packetLoss = Math.round((0.1 + rng() * 1.2) * 10) / 10;

    let load = Math.round(avgTrafficLoad + (rng() - 0.5) * 28);
    load = Math.max(10, Math.min(95, load));

    return {
      id: `L_${u.id}_${v.id}`,
      source: u.id,
      target: v.id,
      baseLatency,
      bandwidth,
      packetLoss,
      trafficLoad: load,
      isFailed: false,
      isCongested: load > 70
    };
  });

  // Apply congestion hotspots
  if (targetCongestedCount > 0 && links.length > 0) {
    const shuffled = [...links].sort(() => rng() - 0.5);
    for (let i = 0; i < Math.min(targetCongestedCount, links.length); i++) {
      shuffled[i].trafficLoad = Math.round(76 + rng() * 18);
      shuffled[i].isCongested = true;
      shuffled[i].packetLoss = Math.round((shuffled[i].packetLoss + 3 + rng() * 2) * 10) / 10;
    }
  }

  // Apply link failures
  if (targetFailedCount > 0 && links.length > 0) {
    const shuffled = [...links].sort(() => rng() - 0.5);
    for (let i = 0; i < Math.min(targetFailedCount, links.length); i++) {
      shuffled[i].isFailed = true;
      shuffled[i].packetLoss = 15;
    }
  }

  return { nodes, links };
}

// Convert links to human-readable Edge List / Connection syntax
export function exportEdgeListSyntax(links: NetworkLink[]): string {
  return links
    .map((l) => {
      const stateStr = l.isFailed ? ', FAILED' : l.isCongested ? ', CONGESTED' : '';
      return `${l.source} <---> ${l.target} [${l.baseLatency}ms, ${l.bandwidth}M, ${l.trafficLoad}% load, ${l.packetLoss}% loss${stateStr}]`;
    })
    .join('\n');
}

// Parse user-edited Edge List syntax back into links
export function parseEdgeListSyntax(text: string, currentNodes: NetworkNode[]): NetworkLink[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
  const nodeIds = new Set(currentNodes.map((n) => n.id));
  const links: NetworkLink[] = [];
  const linkKeySet = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match: R1 <---> R2 [12ms, 1000M, 40% load...] or R1 -> R2
    const match = line.match(/([A-Za-z0-9_]+)\s*(?:<--->|---|->|<--)\s*([A-Za-z0-9_]+)(?:\s*\[(.*?)\])?/);
    if (!match) continue;

    const source = match[1].trim();
    const target = match[2].trim();
    if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) continue;

    const key = source < target ? `${source}-${target}` : `${target}-${source}`;
    if (linkKeySet.has(key)) continue;
    linkKeySet.add(key);

    const propsStr = match[3] || '';
    let latency = 15;
    let bandwidth = 1000;
    let load = 35;
    let loss = 0.5;
    let isFailed = false;

    if (propsStr) {
      const latMatch = propsStr.match(/(\d+(?:\.\d+)?)\s*ms/i);
      if (latMatch) latency = parseFloat(latMatch[1]);

      const bwMatch = propsStr.match(/(\d+)\s*(?:M|Mbps)/i);
      if (bwMatch) bandwidth = parseInt(bwMatch[1], 10);

      const loadMatch = propsStr.match(/(\d+(?:\.\d+)?)\s*%/i);
      if (loadMatch) load = parseFloat(loadMatch[1]);

      if (propsStr.toUpperCase().includes('FAILED')) isFailed = true;
    }

    links.push({
      id: `L_${source}_${target}`,
      source,
      target,
      baseLatency: Math.max(1, Math.round(latency)),
      bandwidth,
      packetLoss: loss,
      trafficLoad: Math.max(0, Math.min(100, Math.round(load))),
      isFailed,
      isCongested: load > 70
    });
  }

  return links;
}

// Compute Graph Connection Diagnostics
export function computeGraphDiagnostics(nodes: NetworkNode[], links: NetworkLink[]) {
  const n = nodes.length;
  const m = links.length;
  const maxPossibleEdges = (n * (n - 1)) / 2;
  const density = maxPossibleEdges > 0 ? (m / maxPossibleEdges) : 0;

  // Degrees
  const degrees: Record<string, number> = {};
  nodes.forEach((node) => (degrees[node.id] = 0));
  links.forEach((l) => {
    if (degrees[l.source] !== undefined) degrees[l.source]++;
    if (degrees[l.target] !== undefined) degrees[l.target]++;
  });

  const degValues = Object.values(degrees);
  const avgDegree = degValues.length > 0 ? (degValues.reduce((a, b) => a + b, 0) / degValues.length) : 0;
  const maxDegree = Math.max(0, ...degValues);
  const minDegree = Math.min(0, ...degValues);

  return {
    nodeCount: n,
    linkCount: m,
    density: Math.round(density * 1000) / 1000,
    avgDegree: Math.round(avgDegree * 10) / 10,
    maxDegree,
    minDegree,
    activeLinksCount: links.filter((l) => !l.isFailed).length,
    congestedLinksCount: links.filter((l) => l.isCongested && !l.isFailed).length,
    failedLinksCount: links.filter((l) => l.isFailed).length
  };
}
