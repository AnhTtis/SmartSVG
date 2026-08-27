// svgEngine/core/transforms/translate-transform.ts
import { ITransform, TransformType } from './itransform';
import { Matrix2D } from '../math/matrix2d';

export class TranslateTransform implements ITransform {
  readonly type: TransformType = 'translate';

  constructor(public tx: number = 0, public ty: number = 0) {}

  toMatrix(): Matrix2D {
    return Matrix2D.translation(this.tx, this.ty);
  }

  toSVGString(): string {
    return this.ty === 0 ? `translate(${this.tx})` : `translate(${this.tx} ${this.ty})`;
  }

  clone(): TranslateTransform {
    return new TranslateTransform(this.tx, this.ty);
  }
}
