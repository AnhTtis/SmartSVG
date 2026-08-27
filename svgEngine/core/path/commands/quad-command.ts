// svgEngine/core/path/commands/quad-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';
import { CubicBezierCommand } from './cubic-command';

export class QuadBezierCommand extends PathCommand {
  readonly type: PathCommandType;
  public isRelative: boolean;

  constructor(
    public cp: Vector2D, // Control Point
    public end: Vector2D, // End Point
    isRelative: boolean = false
  ) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'q' : 'Q';
  }

  toAbsolute(currentPoint: Vector2D): QuadBezierCommand {
    if (!this.isRelative) return this.clone();
    return new QuadBezierCommand(
      currentPoint.add(this.cp),
      currentPoint.add(this.end),
      false
    );
  }

  toSVGString(): string {
    return `${this.type} ${this.cp.x} ${this.cp.y}, ${this.end.x} ${this.end.y}`;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return this.isRelative ? currentPoint.add(this.end) : this.end.clone();
  }

  /**
   * Chuyển đổi Quadratic Bézier sang Cubic Bézier bậc 3 chuẩn W3C
   * CP1 = P0 + 2/3 * (P1 - P0)
   * CP2 = P2 + 2/3 * (P1 - P2)
   */
  toCubicBezier(currentPoint: Vector2D): CubicBezierCommand {
    const abs = this.toAbsolute(currentPoint);
    const cp1 = currentPoint.add(abs.cp.subtract(currentPoint).scale(2 / 3));
    const cp2 = abs.end.add(abs.cp.subtract(abs.end).scale(2 / 3));
    return new CubicBezierCommand(cp1, cp2, abs.end, false);
  }

  /**
   * Tính Bounding Box chính xác tuyệt đối bằng cực trị đạo hàm bậc 1
   */
  getBounds(currentPoint: Vector2D): BoundingBox {
    const abs = this.toAbsolute(currentPoint);
    const p0 = currentPoint;
    const p1 = abs.cp;
    const p2 = abs.end;

    const computeExtrema = (v0: number, v1: number, v2: number): number[] => {
      const vals = [v0, v2];
      const denom = v0 - 2 * v1 + v2;
      if (Math.abs(denom) > 1e-9) {
        const t = (v0 - v1) / denom;
        if (t > 0 && t < 1) {
          const val = (1 - t) * (1 - t) * v0 + 2 * (1 - t) * t * v1 + t * t * v2;
          vals.push(val);
        }
      }
      return vals;
    };

    const xVals = computeExtrema(p0.x, p1.x, p2.x);
    const yVals = computeExtrema(p0.y, p1.y, p2.y);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  transform(matrix: Matrix2D): QuadBezierCommand {
    return new QuadBezierCommand(
      matrix.transformPoint(this.cp),
      matrix.transformPoint(this.end),
      this.isRelative
    );
  }

  clone(): QuadBezierCommand {
    return new QuadBezierCommand(this.cp.clone(), this.end.clone(), this.isRelative);
  }
}
