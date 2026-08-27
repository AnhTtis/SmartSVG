// svgEngine/core/paint/paint-factory.ts
import { IPaint } from './ipaint';
import { NonePaint } from './none-paint';
import { CurrentColorPaint } from './current-color-paint';
import { SolidColorPaint } from './solid-paint';

export class PaintFactory {
  /**
   * Factory parser nhận vào chuỗi thuộc tính fill hoặc stroke của SVG
   * và trả về đối tượng IPaint tương ứng
   */
  static parse(value: string | null | undefined): IPaint {
    if (!value) return new NonePaint();

    const str = value.trim();
    if (str === 'none' || str === '') {
      return new NonePaint();
    }

    if (str === 'currentColor') {
      return new CurrentColorPaint();
    }

    // Nếu là Solid Color, Hex, RGB, HSL hoặc Named Color
    return new SolidColorPaint(str);
  }
}
