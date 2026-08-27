// svgEngine/core/paint/none-paint.ts
import { IPaint, PaintKind } from './ipaint';

export class NonePaint implements IPaint {
  readonly kind: PaintKind = 'none';

  toSVGValue(): string {
    return 'none';
  }

  clone(): IPaint {
    return new NonePaint();
  }

  isVisible(): boolean {
    return false;
  }
}
