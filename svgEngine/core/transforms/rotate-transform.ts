// svgEngine/core/transforms/rotate-transform.ts
import { ITransform, TransformType } from './itransform';
import { Matrix2D } from '../math/matrix2d';

export class RotateTransform implements ITransform {
  readonly type: TransformType = 'rotate';

  constructor(
    public angle: number = 0, // Degrees
    public cx: number = 0,
    public cy: number = 0
  ) {}

  toMatrix(): Matrix2D {
    return Matrix2D.rotation(this.angle, this.cx, this.cy);
  }

  toSVGString(): string {
    return this.cx === 0 && this.cy === 0
      ? `rotate(${this.angle})`
      : `rotate(${this.angle} ${this.cx} ${this.cy})`;
  }

  clone(): RotateTransform {
    return new RotateTransform(this.angle, this.cx, this.cy);
  }
}
