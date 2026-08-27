// svgEngine/core/transforms/scale-transform.ts
import { ITransform, TransformType } from './itransform';
import { Matrix2D } from '../math/matrix2d';

export class ScaleTransform implements ITransform {
  readonly type: TransformType = 'scale';

  constructor(public sx: number = 1, public sy: number = sx) {}

  toMatrix(): Matrix2D {
    return Matrix2D.scaling(this.sx, this.sy);
  }

  toSVGString(): string {
    return this.sx === this.sy ? `scale(${this.sx})` : `scale(${this.sx} ${this.sy})`;
  }

  clone(): ScaleTransform {
    return new ScaleTransform(this.sx, this.sy);
  }
}
