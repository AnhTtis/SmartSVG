// svgEngine/analyzer/svg-analyzer.ts
import { RootNode } from '../ast/nodes/root-node';
import { ASTNode } from '../ast/ast-node';
import { GroupNode } from '../ast/nodes/group-node';
import { PathNode } from '../ast/nodes/path-node';
import { RectNode } from '../ast/nodes/rect-node';
import { CircleNode } from '../ast/nodes/circle-node';
import { EllipseNode } from '../ast/nodes/ellipse-node';
import { LineNode } from '../ast/nodes/line-node';
import { PolylineNode } from '../ast/nodes/polyline-node';
import { PolygonNode } from '../ast/nodes/polygon-node';
import { TextNode } from '../ast/nodes/text-node';
import { LinearGradientPaint } from '../core/paint/gradient/linear-gradient';
import { RadialGradientPaint } from '../core/paint/gradient/radial-gradient';
import { ColorExtractor } from './color-extractor';
import { ComplexityAnalyzer } from './complexity-analyzer';
import {
  SVGAnalysisReport,
  NodeStatistics,
  GeometryMetrics,
  OptimizationSuggestion,
} from './types';

export class SVGAnalyzer {
  /**
   * Phân tích chuyên sâu toàn diện cây SVG AST và trả về báo cáo chi tiết
   */
  static analyze(root: RootNode): SVGAnalysisReport {
    // 1. Thống kê cây Node & Phân loại cấu trúc
    let totalNodes = 0;
    let groups = 0;
    let paths = 0;
    let rects = 0;
    let circles = 0;
    let ellipses = 0;
    let lines = 0;
    let polylines = 0;
    let polygons = 0;
    let texts = 0;
    let maxDepth = 0;
    let emptyGroups = 0;

    const usedDefs = new Set<string>();

    const traverse = (node: ASTNode, currentDepth: number) => {
      totalNodes++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;

      if (node instanceof GroupNode) {
        groups++;
        if (node.children.length === 0) emptyGroups++;
      } else if (node instanceof PathNode) {
        paths++;
      } else if (node instanceof RectNode) {
        rects++;
      } else if (node instanceof CircleNode) {
        circles++;
      } else if (node instanceof EllipseNode) {
        ellipses++;
      } else if (node instanceof LineNode) {
        lines++;
      } else if (node instanceof PolylineNode) {
        polylines++;
      } else if (node instanceof PolygonNode) {
        polygons++;
      } else if (node instanceof TextNode) {
        texts++;
      }

      // Ghi nhận defs đang được sử dụng
      if (node.style.fill.toSVGValue().startsWith('url(#')) {
        const id = node.style.fill.toSVGValue().replace(/url\(#|\)/g, '');
        usedDefs.add(id);
      }
      if (node.style.stroke.paint.toSVGValue().startsWith('url(#')) {
        const id = node.style.stroke.paint.toSVGValue().replace(/url\(#|\)/g, '');
        usedDefs.add(id);
      }

      for (const child of node.children) {
        traverse(child, currentDepth + 1);
      }
    };

    for (const child of root.children) {
      traverse(child, 1);
    }

    let linearGradients = 0;
    let radialGradients = 0;
    for (const def of root.defs.values()) {
      if (def instanceof LinearGradientPaint) linearGradients++;
      else if (def instanceof RadialGradientPaint) radialGradients++;
    }

    const shapesTotal = rects + circles + ellipses + lines + polylines + polygons + texts;

    const nodeStats: NodeStatistics = {
      totalNodes,
      groups,
      paths,
      shapes: {
        rects,
        circles,
        ellipses,
        lines,
        polylines,
        polygons,
        texts,
        total: shapesTotal,
      },
      defs: {
        linearGradients,
        radialGradients,
        total: root.defs.size,
      },
      maxDepth,
    };

    // 2. Trích xuất màu sắc
    const colors = ColorExtractor.extract(root);
    const palette = colors.map((c) => c.hex);

    // 3. Phân tích độ phức tạp hình học
    const complexity = ComplexityAnalyzer.analyze(root);

    // 4. Phân tích hình học & Bounding Box
    const bounds = root.getGlobalBBox();
    const aspectRatio = bounds.height !== 0 ? Math.round((bounds.width / bounds.height) * 100) / 100 : 1;

    const geometry: GeometryMetrics = {
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        aspectRatio,
      },
      hasViewBox: root.viewBox.width > 0 && root.viewBox.height > 0,
      viewBox: {
        x: root.viewBox.x,
        y: root.viewBox.y,
        width: root.viewBox.width,
        height: root.viewBox.height,
      },
    };

    // 5. Đề xuất tối ưu hóa (Optimization Suggestions)
    const suggestions: OptimizationSuggestion[] = [];

    if (emptyGroups > 0) {
      suggestions.push({
        severity: 'warning',
        message: `Phát hiện ${emptyGroups} thẻ Group <g> rỗng không chứa phần tử con, có thể lược bỏ.`,
        count: emptyGroups,
      });
    }

    let unusedGradients = 0;
    for (const defId of root.defs.keys()) {
      if (!usedDefs.has(defId)) unusedGradients++;
    }
    if (unusedGradients > 0) {
      suggestions.push({
        severity: 'info',
        message: `Có ${unusedGradients} Gradients trong <defs> chưa được sử dụng trong bản vẽ.`,
        count: unusedGradients,
      });
    }

    if (complexity.totalVertices > 1000) {
      suggestions.push({
        severity: 'tip',
        message: `Số lượng đỉnh (${complexity.totalVertices} vertices) khá cao. Cân nhắc dùng thuật toán đơn giản hóa đường cong (Path Simplification/Douglas-Peucker).`,
      });
    }

    if (maxDepth > 8) {
      suggestions.push({
        severity: 'tip',
        message: `Cây phân cấp lồng nhau sâu (${maxDepth} cấp). Làm phẳng các group (Flatten Groups) sẽ tăng hiệu năng render.`,
      });
    }

    return {
      nodes: nodeStats,
      colors,
      palette,
      complexity,
      geometry,
      suggestions,
    };
  }
}
