// svgEngine/parser/gradient-parser.ts
import { BaseGradientPaint, SpreadMethod } from '../core/paint/gradient/base-gradient';
import { LinearGradientPaint } from '../core/paint/gradient/linear-gradient';
import { RadialGradientPaint } from '../core/paint/gradient/radial-gradient';
import { Color } from '../core/paint/color';

export class GradientParser {
  /**
   * Phân tích Gradient nâng cao chuẩn W3C SVG 1.1 / SVG 2:
   * - Hỗ trợ LinearGradient & RadialGradient
   * - Hỗ trợ chuỗi kế thừa đa tầng (multi-hop inheritance) qua href / xlink:href
   * - Kế thừa stops, spreadMethod, gradientUnits, gradientTransform và tọa độ
   * - Hỗ trợ focal radius fr (SVG 2)
   * - Hỗ trợ presentation attributes, style="..." và stop-color / stop-opacity
   */
  static parseGradient(
    el: SVGElement,
    existingGradients?: Map<string, BaseGradientPaint>
  ): BaseGradientPaint | null {
    const tagName = el.tagName.toLowerCase();
    const id = el.id || el.getAttribute('id');
    if (!id) return null;

    let gradient: BaseGradientPaint;

    // Kiểm tra kế thừa từ gradient cha (href / xlink:href)
    const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    const parentId = href ? href.replace(/^#/, '') : null;
    const parentGrad = parentId && existingGradients ? existingGradients.get(parentId) : null;

    const parseCoord = (val: string | null, def: number): number => {
      if (val === null || val === undefined) return def;
      val = val.trim();
      if (val.endsWith('%')) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? def : parsed / 100;
      }
      const parsed = parseFloat(val);
      return isNaN(parsed) ? def : parsed;
    };

    if (tagName === 'lineargradient') {
      const parentLinear = parentGrad instanceof LinearGradientPaint ? parentGrad : null;
      const x1 = el.hasAttribute('x1') ? parseCoord(el.getAttribute('x1'), 0) : (parentLinear ? parentLinear.x1 : 0);
      const y1 = el.hasAttribute('y1') ? parseCoord(el.getAttribute('y1'), 0) : (parentLinear ? parentLinear.y1 : 0);
      const x2 = el.hasAttribute('x2') ? parseCoord(el.getAttribute('x2'), 1) : (parentLinear ? parentLinear.x2 : 1);
      const y2 = el.hasAttribute('y2') ? parseCoord(el.getAttribute('y2'), 0) : (parentLinear ? parentLinear.y2 : 0);

      gradient = new LinearGradientPaint(x1, y1, x2, y2, id);
    } else if (tagName === 'radialgradient') {
      const parentRadial = parentGrad instanceof RadialGradientPaint ? parentGrad : null;
      const cx = el.hasAttribute('cx') ? parseCoord(el.getAttribute('cx'), 0.5) : (parentRadial ? parentRadial.cx : 0.5);
      const cy = el.hasAttribute('cy') ? parseCoord(el.getAttribute('cy'), 0.5) : (parentRadial ? parentRadial.cy : 0.5);
      const r = el.hasAttribute('r') ? parseCoord(el.getAttribute('r'), 0.5) : (parentRadial ? parentRadial.r : 0.5);
      const fx = el.hasAttribute('fx') ? parseCoord(el.getAttribute('fx'), cx) : (parentRadial ? parentRadial.fx : cx);
      const fy = el.hasAttribute('fy') ? parseCoord(el.getAttribute('fy'), cy) : (parentRadial ? parentRadial.fy : cy);

      const radGrad = new RadialGradientPaint(cx, cy, r, fx, fy, id);
      if (el.hasAttribute('fr')) {
        radGrad.fr = parseCoord(el.getAttribute('fr'), 0);
      } else if (parentRadial?.fr !== undefined) {
        radGrad.fr = parentRadial.fr;
      }
      gradient = radGrad;
    } else {
      return null;
    }

    // Gradient Units & Spread Method (kế thừa nếu không có)
    const units = el.getAttribute('gradientUnits');
    if (units === 'userSpaceOnUse' || units === 'objectBoundingBox') {
      gradient.gradientUnits = units;
    } else if (parentGrad) {
      gradient.gradientUnits = parentGrad.gradientUnits;
    }

    const spread = el.getAttribute('spreadMethod');
    if (spread === 'pad' || spread === 'reflect' || spread === 'repeat') {
      gradient.spreadMethod = spread as SpreadMethod;
    } else if (parentGrad) {
      gradient.spreadMethod = parentGrad.spreadMethod;
    }

    // Gradient Transform
    const gradTransform = el.getAttribute('gradientTransform');
    if (gradTransform) {
      gradient.gradientTransform = gradTransform;
    } else if (parentGrad?.gradientTransform) {
      gradient.gradientTransform = parentGrad.gradientTransform;
    }

    // Đọc các <stop> con
    const stopEls = el.querySelectorAll('stop');
    if (stopEls.length > 0) {
      stopEls.forEach((stopEl) => {
        const offsetAttr = stopEl.getAttribute('offset') || '0';
        const offset = offsetAttr.endsWith('%')
          ? parseFloat(offsetAttr) / 100
          : parseFloat(offsetAttr);

        let stopColor = stopEl.getAttribute('stop-color') || '#000000';
        let stopOpacity = parseFloat(stopEl.getAttribute('stop-opacity') || '1');

        const styleAttr = stopEl.getAttribute('style');
        if (styleAttr) {
          const styleRules = styleAttr.split(';').map((s) => s.trim());
          for (const rule of styleRules) {
            if (!rule) continue;
            const [k, v] = rule.split(':').map((s) => s.trim());
            if (k === 'stop-color') stopColor = v;
            if (k === 'stop-opacity') stopOpacity = parseFloat(v);
          }
        }

        gradient.addStop(
          isNaN(offset) ? 0 : Math.max(0, Math.min(1, offset)),
          Color.fromString(stopColor),
          isNaN(stopOpacity) ? 1 : Math.max(0, Math.min(1, stopOpacity))
        );
      });
    } else if (parentGrad) {
      // Kế thừa stops từ gradient cha
      for (const stop of parentGrad.stops) {
        gradient.addStop(stop.offset, stop.color.clone(), stop.opacity);
      }
    }

    return gradient;
  }
}
