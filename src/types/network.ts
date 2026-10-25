export type AlgorithmType = 'dijkstra' | 'alternate_path' | 'load_balancing' | 'fault_tolerant';

export type TopologyFormatType =
  | 'watts_strogatz'
  | 'full_mesh'
  | 'ring_lattice'
  | 'star_hub'
  | 'grid_matrix'
  | 'spine_leaf'
  | 'custom';

export interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  role?: 'core' | 'distribution' | 'access' | 'leaf' | 'spine';
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  baseLatency: number; // ms
  bandwidth: number; // Mbps
  packetLoss: number; // % (0-15)
  trafficLoad: number; // % (0-100)
  isFailed: boolean;
  isCongested: boolean; // load > 70%
}

export interface PathEvaluation {
  algorithm: AlgorithmType;
  path: string[];
  effectiveLatency: number;
  packetLoss: number;
  maxLoad: number;
  hopCount: number;
  failedLinksTraversed: number;
  compositeScore: number;
  isFeasible: boolean;
}

export interface NetworkFeatureVector {
  avg_latency: number;
  avg_bandwidth: number;
  avg_loss: number;
  avg_load: number;
  max_load: number;
  congested_link_count: number;
  failed_link_count: number;
  shortest_hop_distance: number;
  dijkstra_path_failed_links: number;
  dijkstra_path_congested_links: number;
}

export interface ModelPrediction {
  recommendedAlgorithm: AlgorithmType;
  confidenceScores: Record<AlgorithmType, number>;
  actualBestAlgorithm: AlgorithmType;
  featureVector: NetworkFeatureVector;
  featureImportances: { name: string; weight: number }[];
}

export interface DatasetRecord {
  id: number;
  avg_latency: number;
  avg_bandwidth: number;
  avg_loss: number;
  avg_load: number;
  max_load: number;
  congested_links: number;
  failed_links: number;
  hop_distance: number;
  dijkstra_failed: number;
  dijkstra_congested: number;
  optimal_algorithm: AlgorithmType;
  best_score: number;
}

export interface ConnectionFormatEntry {
  source: string;
  target: string;
  latency: number;
  bandwidth: number;
  load: number;
  isFailed: boolean;
  isCongested: boolean;
}
