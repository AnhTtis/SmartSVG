// svgEngine/core/math/bbox.ts
import { Vector2D } from './vector2d';
import { Matrix2D } from './matrix2d';

export class BoundingBox {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  static empty(): BoundingBox {
    return new BoundingBox(0, 0, 0, 0);
  }

  static fromPoints(points: Vector2D[]): BoundingBox {
    if (points.length === 0) return BoundingBox.empty();
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  get minX(): number { return this.x; }
  get minY(): number { return this.y; }
  get maxX(): number { return this.x + this.width; }
  get maxY(): number { return this.y + this.height; }
  get centerX(): number { return this.x + this.width / 2; }
  get centerY(): number { return this.y + this.height / 2; }

  contains(p: Vector2D): boolean {
    return p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY;
  }

  intersects(other: BoundingBox): boolean {
    return !(
      other.minX > this.maxX ||
      other.maxX < this.minX ||
      other.minY > this.maxY ||
      other.maxY < this.minY
    );
  }

  union(other: BoundingBox): BoundingBox {
    if (this.width === 0 && this.height === 0) return other.clone();
    if (other.width === 0 && other.height === 0) return this.clone();

    const minX = Math.min(this.minX, other.minX);
    const minY = Math.min(this.minY, other.minY);
    const maxX = Math.max(this.maxX, other.maxX);
    const maxY = Math.max(this.maxY, other.maxY);
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  transform(matrix: Matrix2D): BoundingBox {
    const p1 = matrix.transformPoint(new Vector2D(this.x, this.y));
    const p2 = matrix.transformPoint(new Vector2D(this.x + this.width, this.y));
    const p3 = matrix.transformPoint(new Vector2D(this.x + this.width, this.y + this.height));
    const p4 = matrix.transformPoint(new Vector2D(this.x, this.y + this.height));

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  clone(): BoundingBox {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }
}
