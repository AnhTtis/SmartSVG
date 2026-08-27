// svgEngine/core/transforms/matrix-transform.ts
import { ITransform, TransformType } from './itransform';
import { Matrix2D } from '../math/matrix2d';

export class MatrixTransform implements ITransform {
  readonly type: TransformType = 'matrix';

  constructor(public matrix: Matrix2D = Matrix2D.identity()) {}

  toMatrix(): Matrix2D {
    return this.matrix.clone();
  }

  toSVGString(): string {
    return this.matrix.toSVGString();
  }

  clone(): MatrixTransform {
    return new MatrixTransform(this.matrix.clone());
  }
}
