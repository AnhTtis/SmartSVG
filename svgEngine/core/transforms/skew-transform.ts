// svgEngine/core/transforms/skew-transform.ts
import { ITransform, TransformType } from './itransform';
import { Matrix2D } from '../math/matrix2d';

export class SkewXTransform implements ITransform {
  readonly type: TransformType = 'skewX';

  constructor(public angle: number = 0) {}

  toMatrix(): Matrix2D {
    return Matrix2D.skewX(this.angle);
  }

  toSVGString(): string {
    return `skewX(${this.angle})`;
  }

  clone(): SkewXTransform {
    return new SkewXTransform(this.angle);
  }
}

export class SkewYTransform implements ITransform {
  readonly type: TransformType = 'skewY';

  constructor(public angle: number = 0) {}

  toMatrix(): Matrix2D {
    return Matrix2D.skewY(this.angle);
  }

  toSVGString(): string {
    return `skewY(${this.angle})`;
  }

  clone(): SkewYTransform {
    return new SkewYTransform(this.angle);
  }
}
