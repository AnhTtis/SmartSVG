// svgEngine/core/path/path-data.ts
import { PathCommand } from './path-command';
import { MoveToCommand } from './commands/move-command';
import { LineToCommand } from './commands/line-command';
import { CubicBezierCommand } from './commands/cubic-command';
import { QuadBezierCommand } from './commands/quad-command';
import { ArcCommand } from './commands/arc-command';
import { ClosePathCommand } from './commands/close-command';
import { Vector2D } from '../math/vector2d';
import { BoundingBox } from '../math/bbox';
import { Matrix2D } from '../math/matrix2d';

export class PathData {
  public commands: PathCommand[] = [];

  moveTo(x: number, y: number, isRelative: boolean = false): this {
    this.commands.push(new MoveToCommand(new Vector2D(x, y), isRelative));
    return this;
  }

  lineTo(x: number, y: number, isRelative: boolean = false): this {
    this.commands.push(new LineToCommand(new Vector2D(x, y), isRelative));
    return this;
  }

  cubicTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, isRelative: boolean = false): this {
    this.commands.push(
      new CubicBezierCommand(new Vector2D(cp1x, cp1y), new Vector2D(cp2x, cp2y), new Vector2D(x, y), isRelative)
    );
    return this;
  }

  quadTo(cpx: number, cpy: number, x: number, y: number, isRelative: boolean = false): this {
    this.commands.push(
      new QuadBezierCommand(new Vector2D(cpx, cpy), new Vector2D(x, y), isRelative)
    );
    return this;
  }

  arcTo(rx: number, ry: number, xAxisRotation: number, largeArc: number, sweep: number, x: number, y: number, isRelative: boolean = false): this {
    this.commands.push(
      new ArcCommand(rx, ry, xAxisRotation, largeArc, sweep, new Vector2D(x, y), isRelative)
    );
    return this;
  }

  closePath(isRelative: boolean = false): this {
    this.commands.push(new ClosePathCommand(isRelative));
    return this;
  }

  toSVGString(): string {
    return this.commands.map((cmd) => cmd.toSVGString()).join(' ');
  }

  getBounds(): BoundingBox {
    if (this.commands.length === 0) return new BoundingBox(0, 0, 0, 0);

    let currentPoint = new Vector2D(0, 0);
    let bbox: BoundingBox | null = null;

    for (const cmd of this.commands) {
      const cmdBounds = cmd.getBounds(currentPoint);
      bbox = bbox ? bbox.union(cmdBounds) : cmdBounds;
      currentPoint = cmd.getEndPoint(currentPoint);
    }
    return bbox || new BoundingBox(0, 0, 0, 0);
  }

  transform(matrix: Matrix2D): PathData {
    const newPath = new PathData();
    newPath.commands = this.commands.map((cmd) => cmd.transform(matrix));
    return newPath;
  }

  clone(): PathData {
    const copy = new PathData();
    copy.commands = this.commands.map((cmd) => cmd.clone());
    return copy;
  }
}
