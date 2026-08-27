// svgEngine/core/paint/gradient/linear-gradient.ts
import { BaseGradientPaint } from './base-gradient';
import { PaintKind } from '../ipaint';

export class LinearGradientPaint extends BaseGradientPaint {
  readonly kind: PaintKind = 'linear-gradient';

  constructor(
    public x1: number = 0,
    public y1: number = 0,
    public x2: number = 1,
    public y2: number = 0,
    id?: string
  ) {
    super(id);
  }

  renderDefDOM(): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    el.id = this.id;
    el.setAttribute('x1', `${this.x1 * 100}%`);
    el.setAttribute('y1', `${this.y1 * 100}%`);
    el.setAttribute('x2', `${this.x2 * 100}%`);
    el.setAttribute('y2', `${this.y2 * 100}%`);
    el.setAttribute('gradientUnits', this.gradientUnits);
    el.setAttribute('spreadMethod', this.spreadMethod);

    if (this.gradientTransform) {
      el.setAttribute('gradientTransform', this.gradientTransform);
    }

    for (const stop of this.stops) {
      el.appendChild(stop.renderDOM());
    }
    return el;
  }

  clone(): LinearGradientPaint {
    const copy = new LinearGradientPaint(this.x1, this.y1, this.x2, this.y2, this.id);
    copy.stops = this.stops.map((s) => s.clone());
    copy.gradientUnits = this.gradientUnits;
    copy.spreadMethod = this.spreadMethod;
    copy.gradientTransform = this.gradientTransform;
    return copy;
  }
}
