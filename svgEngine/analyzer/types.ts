// svgEngine/analyzer/types.ts

export interface NodeStatistics {
  totalNodes: number;
  groups: number;
  paths: number;
  shapes: {
    rects: number;
    circles: number;
    ellipses: number;
    lines: number;
    polylines: number;
    polygons: number;
    texts: number;
    total: number;
  };
  defs: {
    linearGradients: number;
    radialGradients: number;
    total: number;
  };
  maxDepth: number;
}

export interface ColorUsage {
  color: string;
  count: number;
  type: 'solid' | 'gradient' | 'none' | 'currentColor';
  hex: string;
  rgb: { r: number; g: number; b: number; a: number };
}

export interface ComplexityMetrics {
  totalVertices: number;
  linearSegments: number;
  cubicBeziers: number;
  quadBeziers: number;
  arcs: number;
  closeCommands: number;
  totalCommands: number;
  averagePointsPerPath: number;
  estimatedPathLength: number;
}

export interface GeometryMetrics {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: number;
  };
  hasViewBox: boolean;
  viewBox: { x: number; y: number; width: number; height: number };
}

export interface OptimizationSuggestion {
  severity: 'info' | 'warning' | 'tip';
  message: string;
  count?: number;
}

export interface SVGAnalysisReport {
  nodes: NodeStatistics;
  colors: ColorUsage[];
  palette: string[];
  complexity: ComplexityMetrics;
  geometry: GeometryMetrics;
  suggestions: OptimizationSuggestion[];
}
