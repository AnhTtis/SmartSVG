// svgEngine/core/transforms/transform-list.ts
import { ITransform } from './itransform';
import { TranslateTransform } from './translate-transform';
import { ScaleTransform } from './scale-transform';
import { RotateTransform } from './rotate-transform';
import { SkewXTransform, SkewYTransform } from './skew-transform';
import { MatrixTransform } from './matrix-transform';
import { Matrix2D } from '../math/matrix2d';

export class TransformList {
  public items: ITransform[] = [];

  add(transform: ITransform): this {
    this.items.push(transform);
    return this;
  }

  toCombinedMatrix(): Matrix2D {
    let result = Matrix2D.identity();
    for (const t of this.items) {
      result = result.multiply(t.toMatrix());
    }
    return result;
  }

  toSVGString(): string {
    return this.items.map((t) => t.toSVGString()).join(' ');
  }

  /**
   * Parser chuỗi SVG transform:
   * Ví dụ: "translate(10, 20) rotate(45 100 100) scale(1.5)"
   */
  static parse(transformStr: string | null | undefined): TransformList {
    const list = new TransformList();
    if (!transformStr) return list;

    const regex = /([a-zA-Z]+)\s*\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(transformStr)) !== null) {
      const type = match[1];
      const args = match[2]
        .trim()
        .split(/[\s,]+/)
        .map((n) => parseFloat(n))
        .filter((n) => !isNaN(n));

      switch (type) {
        case 'translate':
          list.add(new TranslateTransform(args[0] || 0, args[1] || 0));
          break;
        case 'scale':
          list.add(new ScaleTransform(args[0] ?? 1, args[1] ?? args[0] ?? 1));
          break;
        case 'rotate':
          list.add(new RotateTransform(args[0] || 0, args[1] || 0, args[2] || 0));
          break;
        case 'skewX':
          list.add(new SkewXTransform(args[0] || 0));
          break;
        case 'skewY':
          list.add(new SkewYTransform(args[0] || 0));
          break;
        case 'matrix':
          if (args.length >= 6) {
            list.add(new MatrixTransform(new Matrix2D(args[0], args[1], args[2], args[3], args[4], args[5])));
          }
          break;
      }
    }

    return list;
  }

  clone(): TransformList {
    const copy = new TransformList();
    copy.items = this.items.map((t) => t.clone());
    return copy;
  }
}
