// svgEngine/core/paint/gradient/gradient-stop.ts
import { Color } from '../color';

export class GradientStop {
  constructor(
    public offset: number, // 0.0 -> 1.0 (hoặc 0% -> 100%)
    public color: Color,
    public opacity: number = 1
  ) {}

  renderDOM(): SVGElement {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', `${this.offset * 100}%`);
    stop.setAttribute('stop-color', this.color.toHex());
    if (this.opacity < 1) {
      stop.setAttribute('stop-opacity', this.opacity.toString());
    }
    return stop;
  }

  clone(): GradientStop {
    return new GradientStop(this.offset, this.color.clone(), this.opacity);
  }
}
