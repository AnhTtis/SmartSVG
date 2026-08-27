// svgEngine/analyzer/color-extractor.ts
import { ASTNode } from '../ast/ast-node';
import { RootNode } from '../ast/nodes/root-node';
import { SolidColorPaint } from '../core/paint/solid-paint';
import { BaseGradientPaint } from '../core/paint/gradient/base-gradient';
import { Color } from '../core/paint/color';
import { ColorUsage } from './types';

export class ColorExtractor {
  /**
   * Trích xuất toàn bộ bảng màu và tần suất sử dụng màu sắc trong cây AST
   */
  static extract(root: RootNode): ColorUsage[] {
    const colorMap = new Map<string, ColorUsage>();

    const recordColor = (
      paintValue: string,
      type: 'solid' | 'gradient' | 'none' | 'currentColor',
      colorObj?: Color
    ) => {
      if (!paintValue || paintValue === 'none' || paintValue === 'transparent') {
        return;
      }

      if (colorMap.has(paintValue)) {
        colorMap.get(paintValue)!.count++;
        return;
      }

      let hex = paintValue;
      let rgb = { r: 0, g: 0, b: 0, a: 1 };

      if (colorObj) {
        hex = colorObj.toHex();
        rgb = { r: colorObj.r, g: colorObj.g, b: colorObj.b, a: colorObj.a };
      } else {
        try {
          const parsed = Color.fromString(paintValue);
          hex = parsed.toHex();
          rgb = { r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a };
        } catch {
          // Gradient URL hoặc giá trị đặc biệt
        }
      }

      colorMap.set(paintValue, {
        color: paintValue,
        count: 1,
        type,
        hex,
        rgb,
      });
    };

    // 1. Quét kho Gradients trong <defs>
    for (const def of root.defs.values()) {
      if (def instanceof BaseGradientPaint) {
        for (const stop of def.stops) {
          recordColor(stop.color.toHex(), 'gradient', stop.color);
        }
      }
    }

    // 2. Quét đệ quy toàn bộ các Node trong cây AST
    const traverse = (node: ASTNode) => {
      // Phân tích Fill
      const fill = node.style.fill;
      if (fill instanceof SolidColorPaint) {
        recordColor(fill.color.toHex(), 'solid', fill.color);
      } else if (fill instanceof BaseGradientPaint) {
        recordColor(`url(#${fill.id})`, 'gradient');
        for (const stop of fill.stops) {
          recordColor(stop.color.toHex(), 'gradient', stop.color);
        }
      }

      // Phân tích Stroke
      const strokePaint = node.style.stroke.paint;
      if (node.style.stroke.width > 0 && strokePaint.isVisible()) {
        if (strokePaint instanceof SolidColorPaint) {
          recordColor(strokePaint.color.toHex(), 'solid', strokePaint.color);
        } else if (strokePaint instanceof BaseGradientPaint) {
          recordColor(`url(#${strokePaint.id})`, 'gradient');
          for (const stop of strokePaint.stops) {
            recordColor(stop.color.toHex(), 'gradient', stop.color);
          }
        }
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    for (const child of root.children) {
      traverse(child);
    }

    // Sắp xếp theo tần suất xuất hiện nhiều nhất
    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }
}
