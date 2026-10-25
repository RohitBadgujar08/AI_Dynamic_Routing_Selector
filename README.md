# NEXUS ROUTE // AI Dynamic Routing Algorithm Selector

An interactive, laboratory-grade web platform and telemetry simulator for modern computer networking. It evaluates real-time network conditions across 10 telemetry features and dynamically chooses the optimal routing algorithm using a trained Random Forest classifier.

---

## Key Features

- **Interactive Topology Canvas**: Real-time SVG network visualizer with animated packet flows, draggable router nodes, live latency/load pills, and an interactive **Wire/Connect Tool**.
- **Dedicated Algorithm Selector Hub**: Directly test, compare, and deploy 4 classic & dynamic routing strategies (Dijkstra, Alternate Path, Load Balancing, Fault-Tolerant) alongside the AI Autonomous Random Forest selector.
- **Node Connection & Architecture Studio**: Switch between 6 industry topology formats (Watts-Strogatz Small World, Full Mesh, Ring Lattice, Star, 2D Grid Matrix, Data Center Spine-Leaf), edit live **Connection Syntax / Edge Lists**, or click-to-connect via an **Interactive $N \times N$ Adjacency Matrix**.
- **Per-Hop Telemetry & Cost Functions**: Hop-by-hop route inspection detailing per-link effective queue delay, packet loss rates, bandwidth, and cost function formulas.
- **Machine Learning Engine**: 10-feature real-time classifier with feature importance rankings and 1,000 synthetic training scenarios.

---

## Supported Routing Strategies

| Algorithm | Routing Strategy | Ideal Network Condition | Mathematical Cost Formulation |
| :--- | :--- | :--- | :--- |
| **Dijkstra** | Static Shortest Path | Low traffic, minimal link congestion | $\text{Cost}(e) = \text{BaseLatency}(e)$ |
| **Alternate Path** | Congestion Detour ($K$-Shortest) | Localized choke points ($>70\%$ load) | $\text{Cost}(e) = \text{BaseLatency} + (\text{Load} > 70 ? 300 + 10 \cdot (\text{Load} - 70) : 0)$ |
| **Load Balancing** | Throughput & Capacity Distribution | High global traffic across all lines | $\text{Cost}(e) = \text{BaseLatency} \cdot (1 + 5 \cdot (\frac{\text{Load}}{100})^2)$ |
| **Fault Tolerant** | Resilient Failure Isolation | Physical link cuts & packet loss | $\text{Cost}(e) = \text{isFailed} ? \infty : \text{EffLatency} + 10 \cdot \text{Loss}$ |
| **AI Autonomous** | Random Forest Classifier | Dynamic, unpredictable real-world traffic | Evaluates 10 network features to auto-select the winning strategy |

---

## How to Run Locally

### Prerequisites
- Node.js (v18+) & npm

### Installation & Launch
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run the Vite development server
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Use Case

### What is the Core Purpose?
In traditional computer networks (like standard OSPF or static shortest-path protocols), routing decisions are made using **static link metrics** (such as geographic distance or rated port speed). 

However, real networks are **dynamic and non-linear**:
- A path with the lowest physical distance might be congested with buffer queues at $90\%$ capacity, causing severe latency spikes (bufferbloat) and dropped packets.
- Meanwhile, an alternative cable with only $2\text{ms}$ higher base latency sits completely idle ($10\%$ load).
- Static routing fails to adapt, continuing to pump packets into the congested bottleneck until sessions time out.

**The purpose of this project** is to solve this inefficiency by replacing static routing with an **adaptive, AI-driven routing selector**. It monitors real-time telemetry (link load, queue latency, packet loss, cut cables) and dynamically assigns the right algorithm for the right moment.

---

### How It Solves Real-Life Problems

#### 1. Internet Service Providers (ISPs) & Content Delivery Networks (CDNs)
- **Problem**: Peak-hour surges (e.g., live sports streaming or large game downloads) saturate primary backbone fiber routes, causing video buffering and high ping.
- **Solution**: The system detects link utilization climbing above $70\%$ and switches to **Alternate Path** or **Load Balancing**, diverting non-priority packets across underutilized regional links to eliminate packet loss and keep latency steady.

#### 2. Hyperscale Cloud Data Centers (AWS, Google Cloud, Azure)
- **Problem**: Thousands of microservices communicate over tiered Spine-Leaf (Clos) networks. Hash collisions or sudden burst transfers create "microbursts" that choke specific top-of-rack switches.
- **Solution**: Dynamic load balancing continuously shifts traffic flows, keeping max link loads below critical thresholds and preventing high 99th-percentile (tail) latencies.

#### 3. Mission-Critical & Emergency Telemetry (5G, Autonomous Driving, Remote Surgery)
- **Problem**: Terrestrial fiber cuts, equipment failure, or RF interference can instantly drop connections, leading to catastrophic outages.
- **Solution**: The **Fault-Tolerant** module detects severed links instantly, isolates them with infinite penalty ($\infty$), and re-routes packets along redundant biconnected paths without waiting for slow protocol re-convergence.

#### 4. Financial Trading & High-Frequency Networks (HFT)
- **Problem**: Queue delays in saturated switches add microsecond jitter, resulting in trade execution slippage and failed orders.
- **Solution**: By routing based on **Effective Latency** ($L_{\text{eff}} = L_{\text{base}} \cdot (1 + 3(\frac{\text{load}}{100})^2)$), the network proactively steers packets around queuing switches before bufferbloat occurs.
