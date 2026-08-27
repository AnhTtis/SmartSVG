// svgEngine/core/paint/color.ts
import { SVG_NAMED_COLORS } from './named-colors';

export class Color {
  constructor(
    public r: number = 0,   // 0 - 255
    public g: number = 0,   // 0 - 255
    public b: number = 0,   // 0 - 255
    public a: number = 1    // 0 - 1
  ) {}

  /**
   * Parser màu sắc toàn diện W3C:
   * - 148 Named Colors
   * - Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
   * - RGB / RGBA functional notation và CSS Color 4 (rgb(r g b / a), percentages)
   * - HSL / HSLA functional notation
   * - transparent / currentColor
   */
  static fromString(input: string): Color {
    const str = input.trim().toLowerCase();
    if (!str || str === 'none') return new Color(0, 0, 0, 0);
    if (str === 'transparent') return new Color(0, 0, 0, 0);
    if (str === 'currentcolor') return new Color(0, 0, 0, 1);

    // 1. Kiểm tra màu theo tên (Named Colors)
    if (SVG_NAMED_COLORS[str]) {
      return Color.fromHex(SVG_NAMED_COLORS[str]);
    }

    // 2. Hex notation: #rgb, #rgba, #rrggbb, #rrggbbaa
    if (str.startsWith('#')) {
      return Color.fromHex(str);
    }

    // 3. RGB / RGBA functional notation
    if (str.startsWith('rgb')) {
      return Color.fromRgbString(str);
    }

    // 4. HSL / HSLA functional notation
    if (str.startsWith('hsl')) {
      return Color.fromHslString(str);
    }

    return new Color(0, 0, 0, 1);
  }

  static fromHex(hex: string): Color {
    let clean = hex.replace('#', '');
    let r = 0, g = 0, b = 0, a = 1;

    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 4) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
      a = parseInt(clean[3] + clean[3], 16) / 255;
    } else if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else if (clean.length === 8) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
      a = parseInt(clean.substring(6, 8), 16) / 255;
    }

    return new Color(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b, isNaN(a) ? 1 : a);
  }

  static fromRgbString(str: string): Color {
    const match = str.match(/rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
    if (!match) return new Color(0, 0, 0, 1);

    const parseVal = (v: string, max: number) => {
      if (v.endsWith('%')) return (parseFloat(v) / 100) * max;
      return parseFloat(v);
    };

    const r = Math.min(255, Math.max(0, parseVal(match[1], 255)));
    const g = Math.min(255, Math.max(0, parseVal(match[2], 255)));
    const b = Math.min(255, Math.max(0, parseVal(match[3], 255)));
    const a = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

    return new Color(r, g, b, Math.min(1, Math.max(0, a)));
  }

  static fromHslString(str: string): Color {
    const match = str.match(/hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
    if (!match) return new Color(0, 0, 0, 1);

    const h = parseFloat(match[1]) % 360;
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    const a = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rPrime = 0, gPrime = 0, bPrime = 0;
    if (h < 60) { rPrime = c; gPrime = x; }
    else if (h < 120) { rPrime = x; gPrime = c; }
    else if (h < 180) { gPrime = c; bPrime = x; }
    else if (h < 240) { gPrime = x; bPrime = c; }
    else if (h < 300) { rPrime = x; bPrime = c; }
    else { rPrime = c; bPrime = x; }

    return new Color(
      Math.round((rPrime + m) * 255),
      Math.round((gPrime + m) * 255),
      Math.round((bPrime + m) * 255),
      Math.min(1, Math.max(0, a))
    );
  }

  toHex(): string {
    const toH = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toH(this.r)}${toH(this.g)}${toH(this.b)}`;
  }

  toHex8(): string {
    const toH = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toH(this.r)}${toH(this.g)}${toH(this.b)}${toH(this.a * 255)}`;
  }

  toRGBA(): string {
    return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a})`;
  }

  toSVGValue(): string {
    return this.a < 1 ? this.toRGBA() : this.toHex();
  }

  lighten(percent: number): Color {
    const factor = 1 + percent / 100;
    return new Color(
      Math.min(255, this.r * factor),
      Math.min(255, this.g * factor),
      Math.min(255, this.b * factor),
      this.a
    );
  }

  darken(percent: number): Color {
    const factor = 1 - percent / 100;
    return new Color(
      Math.max(0, this.r * factor),
      Math.max(0, this.g * factor),
      Math.max(0, this.b * factor),
      this.a
    );
  }

  withAlpha(alpha: number): Color {
    return new Color(this.r, this.g, this.b, Math.min(1, Math.max(0, alpha)));
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }
}
