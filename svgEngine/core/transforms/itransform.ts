// svgEngine/core/transforms/itransform.ts
import { Matrix2D } from '../math/matrix2d';

export type TransformType = 'matrix' | 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';

export interface ITransform {
  readonly type: TransformType;
  toMatrix(): Matrix2D;
  toSVGString(): string;
  clone(): ITransform;
}
