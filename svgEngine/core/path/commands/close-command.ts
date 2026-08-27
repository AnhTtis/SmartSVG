// svgEngine/core/path/commands/close-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';

export class ClosePathCommand extends PathCommand {
  readonly type: PathCommandType = 'Z';
  public isRelative: boolean = false;

  constructor(isRelative: boolean = false) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'z' : 'Z';
  }

  toAbsolute(_currentPoint: Vector2D): ClosePathCommand {
    return new ClosePathCommand(false);
  }

  toSVGString(): string {
    return this.type;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return currentPoint.clone();
  }

  getBounds(currentPoint: Vector2D): BoundingBox {
    return new BoundingBox(currentPoint.x, currentPoint.y, 0, 0);
  }

  transform(_matrix: Matrix2D): ClosePathCommand {
    return new ClosePathCommand(this.isRelative);
  }

  clone(): ClosePathCommand {
    return new ClosePathCommand(this.isRelative);
  }
}
