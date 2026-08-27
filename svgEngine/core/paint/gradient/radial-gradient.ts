// svgEngine/core/paint/gradient/radial-gradient.ts
import { BaseGradientPaint } from './base-gradient';
import { PaintKind } from '../ipaint';

export class RadialGradientPaint extends BaseGradientPaint {
  readonly kind: PaintKind = 'radial-gradient';
  public fr?: number;

  constructor(
    public cx: number = 0.5,
    public cy: number = 0.5,
    public r: number = 0.5,
    public fx: number = 0.5,
    public fy: number = 0.5,
    id?: string
  ) {
    super(id);
  }

  renderDefDOM(): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    el.id = this.id;
    el.setAttribute('cx', `${this.cx * 100}%`);
    el.setAttribute('cy', `${this.cy * 100}%`);
    el.setAttribute('r', `${this.r * 100}%`);
    el.setAttribute('fx', `${this.fx * 100}%`);
    el.setAttribute('fy', `${this.fy * 100}%`);
    if (this.fr !== undefined) el.setAttribute('fr', `${this.fr * 100}%`);
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

  clone(): RadialGradientPaint {
    const copy = new RadialGradientPaint(this.cx, this.cy, this.r, this.fx, this.fy, this.id);
    copy.fr = this.fr;
    copy.stops = this.stops.map((s) => s.clone());
    copy.gradientUnits = this.gradientUnits;
    copy.spreadMethod = this.spreadMethod;
    copy.gradientTransform = this.gradientTransform;
    return copy;
  }
}
