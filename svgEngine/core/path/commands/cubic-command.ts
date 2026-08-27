// svgEngine/core/path/commands/cubic-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';

export class CubicBezierCommand extends PathCommand {
  readonly type: PathCommandType;
  public isRelative: boolean;

  constructor(
    public cp1: Vector2D,
    public cp2: Vector2D,
    public end: Vector2D,
    isRelative: boolean = false
  ) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'c' : 'C';
  }

  toAbsolute(currentPoint: Vector2D): CubicBezierCommand {
    if (!this.isRelative) return this.clone();
    return new CubicBezierCommand(
      currentPoint.add(this.cp1),
      currentPoint.add(this.cp2),
      currentPoint.add(this.end),
      false
    );
  }

  toSVGString(): string {
    return `${this.type} ${this.cp1.x} ${this.cp1.y}, ${this.cp2.x} ${this.cp2.y}, ${this.end.x} ${this.end.y}`;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return this.isRelative ? currentPoint.add(this.end) : this.end.clone();
  }

  /**
   * Tính toán Bounding Box chính xác tuyệt đối (Tight Bounding Box)
   * Bằng cách giải đạo hàm B'(t) = 0 để tìm cực trị trên đoạn t in [0, 1]
   */
  getBounds(currentPoint: Vector2D): BoundingBox {
    const abs = this.toAbsolute(currentPoint);
    const p0 = currentPoint;
    const p1 = abs.cp1;
    const p2 = abs.cp2;
    const p3 = abs.end;

    const computeExtrema = (v0: number, v1: number, v2: number, v3: number): number[] => {
      const vals = [v0, v3];
      const a = 3 * (-v0 + 3 * v1 - 3 * v2 + v3);
      const b = 6 * (v0 - 2 * v1 + v2);
      const c = 3 * (v1 - v0);

      if (Math.abs(a) < 1e-9) {
        if (Math.abs(b) > 1e-9) {
          const t = -c / b;
          if (t > 0 && t < 1) {
            vals.push(this.sampleCubic(v0, v1, v2, v3, t));
          }
        }
      } else {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          const sqrtD = Math.sqrt(disc);
          const t1 = (-b + sqrtD) / (2 * a);
          const t2 = (-b - sqrtD) / (2 * a);
          if (t1 > 0 && t1 < 1) vals.push(this.sampleCubic(v0, v1, v2, v3, t1));
          if (t2 > 0 && t2 < 1) vals.push(this.sampleCubic(v0, v1, v2, v3, t2));
        }
      }
      return vals;
    };

    const xVals = computeExtrema(p0.x, p1.x, p2.x, p3.x);
    const yVals = computeExtrema(p0.y, p1.y, p2.y, p3.y);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  private sampleCubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  transform(matrix: Matrix2D): CubicBezierCommand {
    return new CubicBezierCommand(
      matrix.transformPoint(this.cp1),
      matrix.transformPoint(this.cp2),
      matrix.transformPoint(this.end),
      this.isRelative
    );
  }

  clone(): CubicBezierCommand {
    return new CubicBezierCommand(this.cp1.clone(), this.cp2.clone(), this.end.clone(), this.isRelative);
  }
}
