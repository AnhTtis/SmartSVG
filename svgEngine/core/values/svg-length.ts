// svgEngine/core/values/svg-length.ts
import { SVGUnitType, ViewportContext, DEFAULT_VIEWPORT_CONTEXT } from '../types/common.types';

export class SVGLength {
  constructor(
    public value: number = 0,
    public unit: SVGUnitType = 'px'
  ) {}

  static parse(input: string | number): SVGLength {
    if (typeof input === 'number') {
      return new SVGLength(input, 'number');
    }

    const str = input.trim();
    if (!str) return new SVGLength(0, 'px');

    const regex = /^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*(px|%|em|rem|pt|pc|mm|cm|in)?$/;
    const match = str.match(regex);

    if (!match) {
      const parsedNum = parseFloat(str);
      return isNaN(parsedNum) ? new SVGLength(0, 'px') : new SVGLength(parsedNum, 'px');
    }

    const val = parseFloat(match[1]);
    const unit = (match[2] as SVGUnitType) || 'number';
    return new SVGLength(val, unit);
  }

  /**
   * Chuyển đổi giá trị sang Pixel thực tế dựa theo Viewport / Context
   * @param axis 'x' hoặc 'y' hoặc 'other' khi tính toán tỉ lệ phần trăm (%)
   */
  resolvePx(context: ViewportContext = DEFAULT_VIEWPORT_CONTEXT, axis: 'x' | 'y' | 'other' = 'x'): number {
    switch (this.unit) {
      case 'px':
      case 'number':
        return this.value;
      case '%': {
        const base = axis === 'x' ? context.viewBoxWidth : axis === 'y' ? context.viewBoxHeight : Math.sqrt(context.viewBoxWidth ** 2 + context.viewBoxHeight ** 2) / Math.SQRT2;
        return (this.value / 100) * base;
      }
      case 'em':
        return this.value * context.fontSize;
      case 'rem':
        return this.value * context.rootFontSize;
      case 'pt': // 1pt = 1.333px (96/72)
        return this.value * (96 / 72);
      case 'pc': // 1pc = 16px (12pt)
        return this.value * 16;
      case 'in': // 1in = 96px
        return this.value * 96;
      case 'cm': // 1cm = 96/2.54 px
        return this.value * (96 / 2.54);
      case 'mm': // 1mm = 96/25.4 px
        return this.value * (96 / 25.4);
      default:
        return this.value;
    }
  }

  toSVGString(): string {
    return this.unit === 'number' || this.unit === 'px' ? `${this.value}` : `${this.value}${this.unit}`;
  }

  clone(): SVGLength {
    return new SVGLength(this.value, this.unit);
  }
}
