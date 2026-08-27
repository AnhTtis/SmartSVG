// svgEngine/core/paint/current-color-paint.ts
import { IPaint, PaintKind } from './ipaint';

export class CurrentColorPaint implements IPaint {
  readonly kind: PaintKind = 'current-color';

  toSVGValue(): string {
    return 'currentColor';
  }

  clone(): IPaint {
    return new CurrentColorPaint();
  }

  isVisible(): boolean {
    return true;
  }
}
