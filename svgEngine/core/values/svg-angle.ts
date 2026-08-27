// svgEngine/core/values/svg-angle.ts

export type SVGAngleUnit = 'deg' | 'rad' | 'grad' | 'turn' | 'number';

export class SVGAngle {
  constructor(
    public value: number = 0,
    public unit: SVGAngleUnit = 'deg'
  ) {}

  static parse(input: string | number): SVGAngle {
    if (typeof input === 'number') {
      return new SVGAngle(input, 'deg');
    }

    const str = input.trim();
    const regex = /^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*(deg|rad|grad|turn)?$/;
    const match = str.match(regex);

    if (!match) return new SVGAngle(0, 'deg');

    const val = parseFloat(match[1]);
    const unit = (match[2] as SVGAngleUnit) || 'deg';
    return new SVGAngle(val, unit);
  }

  toDegrees(): number {
    switch (this.unit) {
      case 'deg':
      case 'number':
        return this.value;
      case 'rad':
        return (this.value * 180) / Math.PI;
      case 'grad':
        return (this.value * 360) / 400;
      case 'turn':
        return this.value * 360;
      default:
        return this.value;
    }
  }

  toRadians(): number {
    return (this.toDegrees() * Math.PI) / 180;
  }

  toSVGString(): string {
    return `${this.value}${this.unit === 'number' ? 'deg' : this.unit}`;
  }

  clone(): SVGAngle {
    return new SVGAngle(this.value, this.unit);
  }
}
