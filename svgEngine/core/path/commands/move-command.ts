// svgEngine/core/path/commands/move-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';

export class MoveToCommand extends PathCommand {
  readonly type: PathCommandType;
  public isRelative: boolean;

  constructor(public p: Vector2D, isRelative: boolean = false) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'm' : 'M';
  }

  toAbsolute(currentPoint: Vector2D): MoveToCommand {
    if (!this.isRelative) return this.clone();
    return new MoveToCommand(currentPoint.add(this.p), false);
  }

  toSVGString(): string {
    return `${this.type} ${this.p.x} ${this.p.y}`;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return this.isRelative ? currentPoint.add(this.p) : this.p.clone();
  }

  getBounds(currentPoint: Vector2D): BoundingBox {
    const end = this.getEndPoint(currentPoint);
    return new BoundingBox(end.x, end.y, 0, 0);
  }

  transform(matrix: Matrix2D): MoveToCommand {
    return new MoveToCommand(matrix.transformPoint(this.p), this.isRelative);
  }

  clone(): MoveToCommand {
    return new MoveToCommand(this.p.clone(), this.isRelative);
  }
}
