// svgEngine/core/path/commands/line-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';

export class LineToCommand extends PathCommand {
  readonly type: PathCommandType;
  public isRelative: boolean;

  constructor(public p: Vector2D, isRelative: boolean = false) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'l' : 'L';
  }

  toAbsolute(currentPoint: Vector2D): LineToCommand {
    if (!this.isRelative) return this.clone();
    return new LineToCommand(currentPoint.add(this.p), false);
  }

  toSVGString(): string {
    return `${this.type} ${this.p.x} ${this.p.y}`;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return this.isRelative ? currentPoint.add(this.p) : this.p.clone();
  }

  getBounds(currentPoint: Vector2D): BoundingBox {
    const end = this.getEndPoint(currentPoint);
    const minX = Math.min(currentPoint.x, end.x);
    const minY = Math.min(currentPoint.y, end.y);
    const maxX = Math.max(currentPoint.x, end.x);
    const maxY = Math.max(currentPoint.y, end.y);
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  transform(matrix: Matrix2D): LineToCommand {
    return new LineToCommand(matrix.transformPoint(this.p), this.isRelative);
  }

  clone(): LineToCommand {
    return new LineToCommand(this.p.clone(), this.isRelative);
  }
}
