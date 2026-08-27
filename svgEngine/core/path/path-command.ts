// svgEngine/core/path/path-command.ts
import { Vector2D } from '../math/vector2d';
import { Matrix2D } from '../math/matrix2d';
import { BoundingBox } from '../math/bbox';

export type PathCommandType =
  | 'M' | 'm'
  | 'L' | 'l'
  | 'H' | 'h'
  | 'V' | 'v'
  | 'C' | 'c'
  | 'S' | 's'
  | 'Q' | 'q'
  | 'T' | 't'
  | 'A' | 'a'
  | 'Z' | 'z';

export abstract class PathCommand {
  public abstract readonly type: PathCommandType;
  public abstract isRelative: boolean;

  abstract toAbsolute(currentPoint: Vector2D): PathCommand;
  abstract toSVGString(): string;
  abstract getEndPoint(currentPoint: Vector2D): Vector2D;
  abstract getBounds(currentPoint: Vector2D): BoundingBox;
  abstract transform(matrix: Matrix2D): PathCommand;
  abstract clone(): PathCommand;
}
