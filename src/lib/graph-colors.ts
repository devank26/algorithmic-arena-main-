/**
 * Graph Node & Edge Color Engine
 * Centralized, dark-mode-safe color constants for all SVG graph visualizers.
 * Uses explicit hex/rgb values — NO CSS variables or Tailwind classes,
 * because SVG fill/stroke attributes do NOT inherit Tailwind or hsl(var()) reliably.
 */

// ── Node state fill colors ────────────────────────────────────────────────────
// Rule: default fill must NEVER be transparent or pure black.
export const NODE_FILL = {
  default:   "#334155",   // slate-700 — visible gray on dark backgrounds
  current:   "#FBBF24",   // amber-400 — strong yellow pulse
  visited:   "#3B82F6",   // blue-500
  frontier:  "#8B5CF6",   // violet-500
  finalPath: "#22C55E",   // green-500 — neon
  active:    "#FBBF24",   // alias for current
  source:    "#22C55E",   // green source node
  target:    "#EF4444",   // red target node
  bridge:    "#EF4444",   // bridge-critical node
  scc:       "#06B6D4",   // cyan SCC group
  mst:       "#22C55E",   // MST included node
};

// ── Node state stroke colors ──────────────────────────────────────────────────
export const NODE_STROKE = {
  default:   "#64748B",   // slate-500
  current:   "#F59E0B",   // amber-500
  visited:   "#2563EB",   // blue-600
  frontier:  "#7C3AED",   // violet-600
  finalPath: "#16A34A",   // green-600
  active:    "#F59E0B",
  source:    "#16A34A",
  target:    "#DC2626",
  bridge:    "#DC2626",
  scc:       "#0891B2",
  mst:       "#16A34A",
};

// ── Node text colors — must contrast with fill ────────────────────────────────
export const NODE_TEXT = {
  default:   "#F1F5F9",   // near white — readable on gray fill
  current:   "#1C1917",   // stone-900 — dark text on yellow
  visited:   "#FFFFFF",
  frontier:  "#FFFFFF",
  finalPath: "#FFFFFF",
  active:    "#1C1917",
  source:    "#FFFFFF",
  target:    "#FFFFFF",
  bridge:    "#FFFFFF",
  scc:       "#FFFFFF",
  mst:       "#1C1917",
};

// ── Node glow / drop-shadow filter ───────────────────────────────────────────
export const NODE_GLOW = {
  default:   "none",
  current:   "drop-shadow(0 0 14px #FBBF24) drop-shadow(0 0 6px #F59E0B)",
  visited:   "none",
  frontier:  "drop-shadow(0 0 10px #8B5CF6)",
  finalPath: "drop-shadow(0 0 16px #22C55E) drop-shadow(0 0 6px #16A34A)",
  active:    "drop-shadow(0 0 14px #FBBF24)",
  source:    "drop-shadow(0 0 12px #22C55E)",
  target:    "drop-shadow(0 0 12px #EF4444)",
  bridge:    "drop-shadow(0 0 12px #EF4444)",
  scc:       "drop-shadow(0 0 10px #06B6D4)",
  mst:       "drop-shadow(0 0 10px #22C55E)",
};

// ── Edge state colors ─────────────────────────────────────────────────────────
export const EDGE_COLOR = {
  default:   "#475569",   // slate-600
  active:    "#FBBF24",   // yellow active
  current:   "#FBBF24",   // alias for active
  visited:   "#3B82F6",   // blue
  mst:       "#22C55E",   // green MST
  rejected:  "#EF4444",   // red rejected
  frontier:  "#8B5CF6",   // purple candidate
  conflict:  "#EF4444",   // red conflict
  trace:     "#22C55E",   // green final path
  finalPath: "#22C55E",   // alias for trace
  bridge:    "#EF4444",   // red critical bridge
  flow:      "#06B6D4",   // cyan network flow
  back:      "#F97316",   // orange back-edge
};


// ── Convenience: get node state styles in one call ────────────────────────────
export type NodeState =
  | "default" | "current" | "visited" | "frontier" | "finalPath"
  | "active" | "source" | "target" | "bridge" | "scc" | "mst";

export function nodeColors(state: NodeState) {
  return {
    fill:   NODE_FILL[state]   ?? NODE_FILL.default,
    stroke: NODE_STROKE[state] ?? NODE_STROKE.default,
    text:   NODE_TEXT[state]   ?? NODE_TEXT.default,
    glow:   NODE_GLOW[state]   ?? "none",
  };
}
