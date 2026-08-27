// svgEngine/analyzer/complexity-analyzer.ts
import { ASTNode } from '../ast/ast-node';
import { RootNode } from '../ast/nodes/root-node';
import { PathNode } from '../ast/nodes/path-node';
import { PolylineNode } from '../ast/nodes/polyline-node';
import { PolygonNode } from '../ast/nodes/polygon-node';
import { LineNode } from '../ast/nodes/line-node';
import { RectNode } from '../ast/nodes/rect-node';
import { CircleNode } from '../ast/nodes/circle-node';
import { EllipseNode } from '../ast/nodes/ellipse-node';
import { ComplexityMetrics } from './types';

export class ComplexityAnalyzer {
  /**
   * Phân tích độ phức tạp hình học và chi tiết các phân đoạn đường cong
   */
  static analyze(root: RootNode): ComplexityMetrics {
    let totalVertices = 0;
    let linearSegments = 0;
    let cubicBeziers = 0;
    let quadBeziers = 0;
    let arcs = 0;
    let closeCommands = 0;
    let totalCommands = 0;
    let pathCount = 0;
    let estimatedPathLength = 0;

    const traverse = (node: ASTNode) => {
      if (node instanceof PathNode) {
        pathCount++;
        for (const cmd of node.pathData.commands) {
          totalCommands++;
          switch (cmd.type) {
            case 'M':
              totalVertices++;
              break;
            case 'L':
              totalVertices++;
              linearSegments++;
              break;
            case 'C':
            case 'S':
              totalVertices += 3;
              cubicBeziers++;
              break;
            case 'Q':
            case 'T':
              totalVertices += 2;
              quadBeziers++;
              break;
            case 'A':
              totalVertices++;
              arcs++;
              break;
            case 'Z':
              closeCommands++;
              break;
          }
        }
      } else if (node instanceof PolylineNode) {
        totalVertices += node.points.length;
        linearSegments += Math.max(0, node.points.length - 1);
      } else if (node instanceof PolygonNode) {
        totalVertices += node.points.length;
        linearSegments += node.points.length;
        closeCommands++;
      } else if (node instanceof LineNode) {
        totalVertices += 2;
        linearSegments += 1;
      } else if (node instanceof RectNode) {
        totalVertices += 4;
        linearSegments += 4;
        closeCommands++;
      } else if (node instanceof CircleNode || node instanceof EllipseNode) {
        // Đường tròn và Elip tương đương xấp xỉ 4 phân đoạn Cubic Bézier
        totalVertices += 8;
        cubicBeziers += 4;
        closeCommands++;
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    for (const child of root.children) {
      traverse(child);
    }

    const averagePointsPerPath = pathCount > 0 ? Math.round((totalVertices / pathCount) * 10) / 10 : 0;

    return {
      totalVertices,
      linearSegments,
      cubicBeziers,
      quadBeziers,
      arcs,
      closeCommands,
      totalCommands,
      averagePointsPerPath,
      estimatedPathLength,
    };
  }
}
