// svgEngine/core/paint/solid-paint.ts
import { IPaint, PaintKind } from './ipaint';
import { Color } from './color';

export class SolidColorPaint implements IPaint {
  readonly kind: PaintKind = 'solid';
  public color: Color;

  constructor(color: Color | string) {
    this.color = typeof color === 'string' ? Color.fromString(color) : color;
  }

  toSVGValue(): string {
    return this.color.toSVGValue();
  }

  clone(): SolidColorPaint {
    return new SolidColorPaint(this.color.clone());
  }

  isVisible(): boolean {
    return this.color.a > 0;
  }
}
