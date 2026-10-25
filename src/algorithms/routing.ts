import { NetworkNode, NetworkLink, AlgorithmType, PathEvaluation } from '../types/network';

export const ALGORITHM_DETAILS: Record<AlgorithmType, {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  color: string;
}> = {
  dijkstra: {
    name: "Dijkstra (Static Shortest Path)",
    shortName: "Dijkstra",
    tagline: "Static link latency optimization",
    description: "Computes the shortest path strictly based on static base latencies, ignoring dynamic traffic loads, congestion, and link failures.",
    color: "#3b82f6" // blue-500
  },
  alternate_path: {
    name: "Alternate Path (Congestion-Aware)",
    shortName: "Alternate Path",
    tagline: "Dynamic detour around links exceeding 70% load",
    description: "Actively detects links with load > 70% and computes alternate detours to bypass congested network bottlenecks.",
    color: "#f59e0b" // amber-500
  },
  load_balancing: {
    name: "Load Balancing (Throughput-Optimized)",
    shortName: "Load Balancing",
    tagline: "Traffic distribution to underutilized channels",
    description: "Penalizes heavily utilized links and routes packets through lightly loaded paths to maximize network throughput.",
    color: "#10b981" // emerald-500
  },
  fault_tolerant: {
    name: "Fault Tolerant (Failure-Isolated)",
    shortName: "Fault Tolerant",
    tagline: "Complete isolation of failed links & loss minimization",
    description: "Strictly isolates disabled/broken links and computes paths balancing effective queueing delay and packet loss probability.",
    color: "#ef4444" // red-500
  }
};

// Helper: Find link between two node IDs
export function getLink(u: string, v: string, links: NetworkLink[]): NetworkLink | undefined {
  return links.find(
    (l) => (l.source === u && l.target === v) || (l.source === v && l.target === u)
  );
}

// Calculate effective latency using the exact formula from the user's specification:
// Effective Latency = Base Latency * (1 + 3 * (Load / 100)^2)
export function calculateEffectiveLatency(baseLatency: number, trafficLoad: number): number {
  const loadFactor = trafficLoad / 100;
  return baseLatency * (1 + 3 * Math.pow(loadFactor, 2));
}

// Score formula from specification:
// Score = Latency + 10 * Loss + 3 * max(0, MaxLoad - 60) + 1000 * FailedLinks
export function scorePath(
  path: string[],
  links: NetworkLink[]
): PathEvaluation {
  if (path.length <= 1) {
    return {
      algorithm: 'dijkstra',
      path: [],
      effectiveLatency: 9999,
      packetLoss: 100,
      maxLoad: 100,
      hopCount: 0,
      failedLinksTraversed: 99,
      compositeScore: 99999,
      isFeasible: false
    };
  }

  let totalEffectiveLatency = 0;
  let totalLoss = 0;
  let maxLoad = 0;
  let failedLinksTraversed = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const link = getLink(path[i], path[i + 1], links);
    if (!link) continue;

    if (link.isFailed) {
      failedLinksTraversed += 1;
    }

    const effLatency = calculateEffectiveLatency(link.baseLatency, link.trafficLoad);
    totalEffectiveLatency += effLatency;
    totalLoss += link.packetLoss;
    maxLoad = Math.max(maxLoad, link.trafficLoad);
  }

  const hopCount = path.length - 1;
  const loadPenalty = 3 * Math.max(0, maxLoad - 60);
  const failurePenalty = 1000 * failedLinksTraversed;
  const compositeScore = Math.round((totalEffectiveLatency + 10 * totalLoss + loadPenalty + failurePenalty) * 10) / 10;

  return {
    algorithm: 'dijkstra', // will be overwritten by caller
    path,
    effectiveLatency: Math.round(totalEffectiveLatency * 10) / 10,
    packetLoss: Math.round(totalLoss * 10) / 10,
    maxLoad: Math.round(maxLoad),
    hopCount,
    failedLinksTraversed,
    compositeScore,
    isFeasible: failedLinksTraversed === 0
  };
}

// Dijkstra Graph Solver with custom edge weight function
function solveDijkstra(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[],
  costFunction: (link: NetworkLink) => number
): string[] {
  if (source === target) return [source];

  const adj = new Map<string, { neighbor: string; cost: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  links.forEach((link) => {
    const cost = costFunction(link);
    if (cost < Infinity) {
      adj.get(link.source)?.push({ neighbor: link.target, cost });
      adj.get(link.target)?.push({ neighbor: link.source, cost });
    }
  });

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const unvisited = new Set<string>();

  nodes.forEach((n) => {
    dist.set(n.id, Infinity);
    unvisited.add(n.id);
  });
  dist.set(source, 0);

  while (unvisited.size > 0) {
    let currNode: string | null = null;
    let minD = Infinity;

    for (const node of unvisited) {
      const d = dist.get(node) ?? Infinity;
      if (d < minD) {
        minD = d;
        currNode = node;
      }
    }

    if (!currNode || minD === Infinity) break;
    if (currNode === target) break;

    unvisited.delete(currNode);
    const edges = adj.get(currNode) || [];

    for (const edge of edges) {
      if (!unvisited.has(edge.neighbor)) continue;
      const alt = minD + edge.cost;
      if (alt < (dist.get(edge.neighbor) ?? Infinity)) {
        dist.set(edge.neighbor, alt);
        prev.set(edge.neighbor, currNode);
      }
    }
  }

  if ((dist.get(target) ?? Infinity) === Infinity) {
    return [];
  }

  const path: string[] = [];
  let curr: string | undefined = target;
  while (curr) {
    path.unshift(curr);
    curr = prev.get(curr);
  }

  return path;
}

// 1. Dijkstra: Classic shortest-path routing based on static link latencies (unaware of live traffic/link states)
export function runDijkstra(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[]
): PathEvaluation {
  // Routes strictly using static baseLatency
  const path = solveDijkstra(source, target, nodes, links, (l) => l.baseLatency);
  const evalResult = scorePath(path, links);
  evalResult.algorithm = 'dijkstra';
  return evalResult;
}

// 2. Alternate Path: Shortest path with live congestion detection; reroutes around links exceeding congestion limits (>70%)
export function runAlternatePath(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[]
): PathEvaluation {
  // Links with load > 70% get a heavy penalty
  const path = solveDijkstra(source, target, nodes, links, (l) => {
    let cost = l.baseLatency;
    if (l.isCongested || l.trafficLoad > 70) {
      cost += 300 + (l.trafficLoad - 70) * 10;
    }
    // Moderate penalty for failed link if alternate route is possible
    if (l.isFailed) {
      cost += 2000;
    }
    return cost;
  });

  const evalResult = scorePath(path, links);
  evalResult.algorithm = 'alternate_path';
  return evalResult;
}

// 3. Load Balancing: Optimizes network throughput by preferring lightly loaded links and avoiding bottlenecks
export function runLoadBalancing(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[]
): PathEvaluation {
  // Cost scaled quadratically with load to drive packets to underutilized links
  const path = solveDijkstra(source, target, nodes, links, (l) => {
    const loadFactor = l.trafficLoad / 100;
    let cost = l.baseLatency * (1 + 5 * Math.pow(loadFactor, 2));
    if (l.isFailed) cost += 5000;
    return cost;
  });

  const evalResult = scorePath(path, links);
  evalResult.algorithm = 'load_balancing';
  return evalResult;
}

// 4. Fault Tolerant: Isolates failed links and computes paths balancing effective latency and packet loss
export function runFaultTolerant(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[]
): PathEvaluation {
  // Completely exclude failed links (Infinity)
  let path = solveDijkstra(source, target, nodes, links, (l) => {
    if (l.isFailed) return Infinity;
    const effLatency = calculateEffectiveLatency(l.baseLatency, l.trafficLoad);
    return effLatency + 10 * l.packetLoss;
  });

  // If network is completely partitioned, fallback to path with minimal failed links
  if (path.length === 0) {
    path = solveDijkstra(source, target, nodes, links, (l) => {
      const effLatency = calculateEffectiveLatency(l.baseLatency, l.trafficLoad);
      return effLatency + 10 * l.packetLoss + (l.isFailed ? 10000 : 0);
    });
  }

  const evalResult = scorePath(path, links);
  evalResult.algorithm = 'fault_tolerant';
  return evalResult;
}

// Evaluate all 4 algorithms on current network state
export function evaluateAllAlgorithms(
  source: string,
  target: string,
  nodes: NetworkNode[],
  links: NetworkLink[]
): Record<AlgorithmType, PathEvaluation> {
  return {
    dijkstra: runDijkstra(source, target, nodes, links),
    alternate_path: runAlternatePath(source, target, nodes, links),
    load_balancing: runLoadBalancing(source, target, nodes, links),
    fault_tolerant: runFaultTolerant(source, target, nodes, links)
  };
}
