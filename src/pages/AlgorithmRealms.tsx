import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Search, GitBranch, Lock, Compass, Layers, Binary, TreeDeciduous,
  Hash, Cpu, Braces, Workflow, Boxes, Network, Dna, Trophy, Star, ChevronRight,
  Flame, Users, Clock, Zap, BookOpen, Swords
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Realm {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: any;
  algorithms: string[];
  color: "cyan" | "purple" | "green" | "pink" | "orange" | "yellow";
  available: boolean;
  path?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  challengeCount: number;
  estimatedTime: string;
  popularity: number; // out of 100
}

const realms: Realm[] = [
  {
    id: "sorting",
    title: "Sorting Realm",
    description: "Master the art of ordering — from Bubble to Heap",
    longDescription: "Dive into the foundational algorithms that power data organization. Learn comparison-based and non-comparison sorts, understand stability, and master time-space tradeoffs.",
    icon: BarChart3,
    algorithms: ["Bubble Sort", "Quick Sort", "Merge Sort", "Heap Sort", "Insertion Sort", "Selection Sort", "Radix Sort", "Counting Sort"],
    color: "cyan",
    available: true,
    path: "/battle",
    difficulty: "Beginner",
    challengeCount: 24,
    estimatedTime: "~8 hrs",
    popularity: 95,
  },
  {
    id: "searching",
    title: "Searching Zone",
    description: "Find the needle in the haystack — fast",
    longDescription: "From brute-force linear scans to elegant binary divisions. Master search techniques that form the backbone of every real-world application.",
    icon: Search,
    algorithms: ["Linear Search", "Binary Search", "Jump Search", "Interpolation Search", "Exponential Search", "Ternary Search"],
    color: "purple",
    available: true,
    path: "/searching",
    difficulty: "Beginner",
    challengeCount: 18,
    estimatedTime: "~5 hrs",
    popularity: 88,
  },
  {
    id: "graph",
    title: "Graph City",
    description: "Navigate complex networks and find optimal paths",
    longDescription: "Explore the world of interconnected nodes. From shortest paths to minimum spanning trees, conquer the algorithms that power maps, social networks, and routing systems.",
    icon: GitBranch,
    algorithms: ["Dijkstra", "A*", "BFS", "DFS", "Floyd-Warshall", "Bellman-Ford", "Kruskal", "Prim", "Topological Sort"],
    color: "green",
    available: true,
    path: "/graph",
    difficulty: "Advanced",
    challengeCount: 32,
    estimatedTime: "~14 hrs",
    popularity: 92,
  },
  {
    id: "dynamic-programming",
    title: "DP Dimension",
    description: "Break problems into optimal subproblems",
    longDescription: "Enter the dimension where complex problems are decomposed into overlapping subproblems. Master memoization, tabulation, and the art of state transition — the ultimate interview weapon.",
    icon: Layers,
    algorithms: ["Fibonacci", "Knapsack 0/1", "Longest Common Subsequence", "Coin Change", "Matrix Chain Multiply", "Edit Distance", "Longest Increasing Subsequence"],
    color: "pink",
    available: false,
    difficulty: "Advanced",
    challengeCount: 40,
    estimatedTime: "~20 hrs",
    popularity: 97,
  },
  {
    id: "trees",
    title: "Tree Canopy",
    description: "Traverse hierarchical structures with precision",
    longDescription: "From binary search trees to AVL and Red-Black trees. Master the data structures that enable O(log n) operations and power databases and file systems worldwide.",
    icon: TreeDeciduous,
    algorithms: ["Inorder", "Preorder", "Postorder", "Level Order", "BST Insert/Delete", "AVL Rotations", "Segment Tree", "Trie"],
    color: "green",
    available: false,
    difficulty: "Intermediate",
    challengeCount: 28,
    estimatedTime: "~12 hrs",
    popularity: 85,
  },
  {
    id: "hashing",
    title: "Hash Forge",
    description: "Map keys to values at lightning speed",
    longDescription: "Understand hash functions, collision resolution, and the magic behind O(1) lookups. Build hash tables from scratch and see how they power modern computing.",
    icon: Hash,
    algorithms: ["Chaining", "Open Addressing", "Linear Probing", "Double Hashing", "Cuckoo Hashing", "Robin Hood Hashing"],
    color: "orange",
    available: false,
    difficulty: "Intermediate",
    challengeCount: 16,
    estimatedTime: "~6 hrs",
    popularity: 72,
  },
  {
    id: "bit-manipulation",
    title: "Bit Bunker",
    description: "Harness the raw power of binary operations",
    longDescription: "Think at the hardware level. XOR tricks, bitmasks, and bit-parallel algorithms that squeeze maximum performance from every CPU cycle.",
    icon: Binary,
    algorithms: ["Bit Counting", "Power of 2", "Single Number", "Subset Generation", "Gray Code", "Hamming Distance"],
    color: "yellow",
    available: false,
    difficulty: "Intermediate",
    challengeCount: 20,
    estimatedTime: "~7 hrs",
    popularity: 65,
  },
  {
    id: "strings",
    title: "String Nexus",
    description: "Pattern match and manipulate text like a pro",
    longDescription: "Master the algorithms behind search engines, compilers, and bioinformatics. From KMP to suffix arrays, string algorithms are everywhere.",
    icon: Braces,
    algorithms: ["KMP", "Rabin-Karp", "Z-Algorithm", "Aho-Corasick", "Manacher's", "Suffix Array", "Rolling Hash"],
    color: "cyan",
    available: false,
    difficulty: "Advanced",
    challengeCount: 22,
    estimatedTime: "~10 hrs",
    popularity: 78,
  },
  {
    id: "greedy",
    title: "Greedy Gauntlet",
    description: "Make the locally optimal choice every time",
    longDescription: "Not all problems need DP. Learn when greedy works, prove correctness, and solve scheduling, compression, and optimization problems elegantly.",
    icon: Flame,
    algorithms: ["Activity Selection", "Huffman Coding", "Fractional Knapsack", "Job Scheduling", "Minimum Platforms", "Gas Station"],
    color: "orange",
    available: false,
    difficulty: "Intermediate",
    challengeCount: 18,
    estimatedTime: "~8 hrs",
    popularity: 80,
  },
  {
    id: "backtracking",
    title: "Backtrack Maze",
    description: "Explore all possibilities, prune the rest",
    longDescription: "Navigate decision trees, solve constraint satisfaction problems, and generate permutations. The brute-force strategy made smart through pruning.",
    icon: Workflow,
    algorithms: ["N-Queens", "Sudoku Solver", "Rat in Maze", "Word Search", "Subset Sum", "Graph Coloring", "Hamiltonian Cycle"],
    color: "purple",
    available: false,
    difficulty: "Advanced",
    challengeCount: 24,
    estimatedTime: "~12 hrs",
    popularity: 83,
  },
  {
    id: "divide-conquer",
    title: "Divide & Conquer",
    description: "Split, solve, and merge for logarithmic power",
    longDescription: "The paradigm that gave us Merge Sort, FFT, and Strassen's matrix multiplication. Learn to break problems in half and conquer them recursively.",
    icon: Boxes,
    algorithms: ["Merge Sort", "Binary Search", "Closest Pair", "Strassen's", "Karatsuba", "FFT", "Quick Select"],
    color: "cyan",
    available: false,
    difficulty: "Advanced",
    challengeCount: 16,
    estimatedTime: "~9 hrs",
    popularity: 70,
  },
  {
    id: "network-flow",
    title: "Flow Networks",
    description: "Maximize throughput in connected systems",
    longDescription: "From Ford-Fulkerson to push-relabel, master the algorithms that optimize logistics, matchings, and resource allocation across networks.",
    icon: Network,
    algorithms: ["Ford-Fulkerson", "Edmonds-Karp", "Dinic's", "Min-Cut", "Bipartite Matching", "Hungarian Algorithm"],
    color: "pink",
    available: false,
    difficulty: "Expert",
    challengeCount: 14,
    estimatedTime: "~15 hrs",
    popularity: 55,
  },
];

const colorClasses = {
  cyan: {
    border: "border-neon-cyan/30",
    bg: "bg-neon-cyan/5",
    bgStrong: "bg-neon-cyan/10",
    icon: "text-neon-cyan",
    glow: "neon-glow-cyan",
    text: "neon-text-cyan",
    gradient: "from-neon-cyan/20 to-transparent",
    bar: "bg-neon-cyan",
    badge: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30",
  },
  purple: {
    border: "border-neon-purple/30",
    bg: "bg-neon-purple/5",
    bgStrong: "bg-neon-purple/10",
    icon: "text-neon-purple",
    glow: "neon-glow-purple",
    text: "neon-text-purple",
    gradient: "from-neon-purple/20 to-transparent",
    bar: "bg-neon-purple",
    badge: "bg-neon-purple/15 text-neon-purple border-neon-purple/30",
  },
  green: {
    border: "border-neon-green/30",
    bg: "bg-neon-green/5",
    bgStrong: "bg-neon-green/10",
    icon: "text-neon-green",
    glow: "neon-glow-green",
    text: "neon-text-green",
    gradient: "from-neon-green/20 to-transparent",
    bar: "bg-neon-green",
    badge: "bg-neon-green/15 text-neon-green border-neon-green/30",
  },
  pink: {
    border: "border-neon-pink/30",
    bg: "bg-neon-pink/5",
    bgStrong: "bg-neon-pink/10",
    icon: "text-neon-pink",
    glow: "neon-glow-pink",
    text: "text-neon-pink",
    gradient: "from-neon-pink/20 to-transparent",
    bar: "bg-neon-pink",
    badge: "bg-neon-pink/15 text-neon-pink border-neon-pink/30",
  },
  orange: {
    border: "border-neon-orange/30",
    bg: "bg-neon-orange/5",
    bgStrong: "bg-neon-orange/10",
    icon: "text-neon-orange",
    glow: "shadow-[0_0_8px_hsl(25_100%_55%/0.3)]",
    text: "text-neon-orange",
    gradient: "from-neon-orange/20 to-transparent",
    bar: "bg-neon-orange",
    badge: "bg-neon-orange/15 text-neon-orange border-neon-orange/30",
  },
  yellow: {
    border: "border-neon-yellow/30",
    bg: "bg-neon-yellow/5",
    bgStrong: "bg-neon-yellow/10",
    icon: "text-neon-yellow",
    glow: "shadow-[0_0_8px_hsl(50_100%_55%/0.3)]",
    text: "text-neon-yellow",
    gradient: "from-neon-yellow/20 to-transparent",
    bar: "bg-neon-yellow",
    badge: "bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30",
  },
};

const difficultyConfig = {
  Beginner: { color: "text-neon-green", bg: "bg-neon-green/10 border-neon-green/20", icon: BookOpen },
  Intermediate: { color: "text-neon-yellow", bg: "bg-neon-yellow/10 border-neon-yellow/20", icon: Zap },
  Advanced: { color: "text-neon-orange", bg: "bg-neon-orange/10 border-neon-orange/20", icon: Flame },
  Expert: { color: "text-neon-pink", bg: "bg-neon-pink/10 border-neon-pink/20", icon: Swords },
};

type FilterType = "all" | "Beginner" | "Intermediate" | "Advanced" | "Expert" | "available";

export default function AlgorithmRealms() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [hoveredRealm, setHoveredRealm] = useState<string | null>(null);

  const filteredRealms = realms.filter((realm) => {
    if (filter === "all") return true;
    if (filter === "available") return realm.available;
    return realm.difficulty === filter;
  });

  const totalAlgorithms = realms.reduce((sum, r) => sum + r.algorithms.length, 0);
  const totalChallenges = realms.reduce((sum, r) => sum + r.challengeCount, 0);
  const availableCount = realms.filter((r) => r.available).length;

  const filters: { label: string; value: FilterType; icon: any }[] = [
    { label: "All Realms", value: "all", icon: Compass },
    { label: "Available", value: "available", icon: Zap },
    { label: "Beginner", value: "Beginner", icon: BookOpen },
    { label: "Intermediate", value: "Intermediate", icon: Flame },
    { label: "Advanced", value: "Advanced", icon: Swords },
    { label: "Expert", value: "Expert", icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/30 neon-glow-green">
            <Compass className="h-5 w-5 text-neon-green" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight neon-text-green leading-none">
              Algorithm Realms
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose your domain of mastery
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Realms", value: realms.length, icon: Compass, color: "text-neon-cyan" },
            { label: "Algorithms", value: totalAlgorithms, icon: Cpu, color: "text-neon-purple" },
            { label: "Challenges", value: totalChallenges, icon: Trophy, color: "text-neon-green" },
            { label: "Available Now", value: availableCount, icon: Zap, color: "text-neon-yellow" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className={`font-display text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {filters.map(({ label, value, icon: FilterIcon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
              filter === value
                ? "bg-primary/15 border border-primary/40 neon-text-cyan shadow-[0_0_10px_hsl(195_100%_50%/0.15)]"
                : "bg-muted/20 border border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <FilterIcon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Realms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredRealms.map((realm, i) => {
            const c = colorClasses[realm.color];
            const diff = difficultyConfig[realm.difficulty];
            const isHovered = hoveredRealm === realm.id;

            return (
              <motion.div
                key={realm.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => realm.available && realm.path && navigate(realm.path)}
                onMouseEnter={() => setHoveredRealm(realm.id)}
                onMouseLeave={() => setHoveredRealm(null)}
                className={`
                  glass-panel relative overflow-hidden group
                  ${realm.available ? "cursor-pointer" : "opacity-60"}
                  transition-all duration-300
                `}
                whileHover={realm.available ? { scale: 1.02, y: -2 } : {}}
                whileTap={realm.available ? { scale: 0.98 } : {}}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Lock badge for unavailable */}
                {!realm.available && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 border border-border/40">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">Coming Soon</span>
                  </div>
                )}

                {/* Content */}
                <div className="relative p-5 space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-lg ${c.bg} ${c.border} border ${realm.available ? c.glow : ""}`}>
                      <realm.icon className={`h-5 w-5 ${c.icon}`} />
                    </div>
                    {/* Difficulty badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider border ${diff.bg}`}>
                      <diff.icon className={`h-2.5 w-2.5 ${diff.color}`} />
                      <span className={diff.color}>{realm.difficulty}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h2 className={`font-display text-lg font-bold ${c.text} mb-1`}>{realm.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isHovered && realm.available ? realm.longDescription : realm.description}
                    </p>
                  </div>

                  {/* Algorithm Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {realm.algorithms.slice(0, isHovered ? realm.algorithms.length : 4).map((algo) => (
                      <motion.span
                        key={algo}
                        layout
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.badge}`}
                      >
                        {algo}
                      </motion.span>
                    ))}
                    {!isHovered && realm.algorithms.length > 4 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground">
                        +{realm.algorithms.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <Swords className="h-3 w-3" />
                      <span>{realm.challengeCount} challenges</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{realm.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground ml-auto">
                      <Users className="h-3 w-3" />
                      <span>{realm.popularity}%</span>
                    </div>
                  </div>

                  {/* Popularity bar */}
                  <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${c.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${realm.popularity}%` }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                {/* Bottom hover bar */}
                {realm.available && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
                    <motion.div
                      className={`h-full ${c.bar}`}
                      initial={{ width: "0%", left: "50%" }}
                      whileHover={{ width: "100%", left: "0%" }}
                      transition={{ duration: 0.3 }}
                      style={{ position: "absolute" }}
                    />
                  </div>
                )}

                {/* Enter arrow for available */}
                {realm.available && (
                  <motion.div
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={isHovered ? { x: [0, 4, 0] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className={`h-5 w-5 ${c.icon}`} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-panel p-4"
      >
        <h3 className="font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
          Difficulty Legend
        </h3>
        <div className="flex flex-wrap gap-4">
          {(Object.entries(difficultyConfig) as [string, typeof difficultyConfig.Beginner][]).map(([level, config]) => (
            <div key={level} className="flex items-center gap-1.5">
              <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
              <span className={`text-xs font-mono ${config.color}`}>{level}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
