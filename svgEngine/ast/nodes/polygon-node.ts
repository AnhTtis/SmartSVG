// svgEngine/ast/nodes/polygon-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { Vector2D } from '../../core/math/vector2d';

export class PolygonNode extends ASTNode {
  readonly type: ASTNodeType = 'polygon';
  public points: Vector2D[] = [];

  constructor(points: Vector2D[] = [], id?: string) {
    super(id);
    this.points = points;
  }

  static parsePoints(pointsStr: string): Vector2D[] {
    const coords = pointsStr
      .trim()
      .split(/[\s,]+/)
      .map((n) => parseFloat(n))
      .filter((n) => !isNaN(n));

    const result: Vector2D[] = [];
    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
        result.push(new Vector2D(coords[i], coords[i + 1]));
      }
    }
    return result;
  }

  getLocalBBox(): BoundingBox {
    if (this.points.length === 0) return new BoundingBox(0, 0, 0, 0);

    let minX = this.points[0].x, maxX = this.points[0].x;
    let minY = this.points[0].y, maxY = this.points[0].y;

    for (const p of this.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  renderDOM(): SVGElement {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    this.applyCommonAttributes(polygon);

    const pts = this.points.map((p) => `${p.x},${p.y}`).join(' ');
    polygon.setAttribute('points', pts);

    return polygon;
  }

  clone(): PolygonNode {
    const copy = new PolygonNode(this.points.map((p) => p.clone()), this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
