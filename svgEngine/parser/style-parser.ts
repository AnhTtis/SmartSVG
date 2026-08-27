// svgEngine/parser/style-parser.ts
import { Style, FillRule, ClipRule, VectorEffect } from '../core/style/style';
import { LineCap, LineJoin } from '../core/style/stroke';
import { TextAnchor, FontWeight, FontStyleType, DominantBaseline } from '../core/style/font-style';
import { PaintFactory } from '../core/paint/paint-factory';
import { BaseGradientPaint } from '../core/paint/gradient/base-gradient';
import { CSSStylesheetParser, CSSRuleMap } from './css-stylesheet-parser';

export class StyleParser {
  /**
   * Parse style của 1 phần tử SVG DOM chuẩn theo thứ tự ưu tiên W3C:
   * 1. Inherited Style từ Group cha
   * 2. CSS Stylesheet (<style> Tag/Class/ID)
   * 3. Presentation Attributes (fill, stroke, opacity...)
   * 4. Inline CSS Style (style="...")
   */
  static parse(
    el: SVGElement,
    inheritedStyle?: Style,
    defsMap?: Map<string, BaseGradientPaint>,
    ruleMap?: CSSRuleMap
  ): Style {
    const style = inheritedStyle ? inheritedStyle.clone() : new Style();

    // 1. Thu thập thuộc tính CSS từ thẻ <style> nếu có
    const styleProps: Record<string, string> = {};
    if (ruleMap) {
      const matchedCSS = CSSStylesheetParser.getMatchedRules(el, ruleMap);
      Object.assign(styleProps, matchedCSS);
    }

    // 2. Presentation Attributes (ghi đè CSS stylesheet chung)
    const attrs = [
      'fill',
      'fill-opacity',
      'fill-rule',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'stroke-dashoffset',
      'stroke-miterlimit',
      'stroke-opacity',
      'opacity',
      'clip-rule',
      'clip-path',
      'mask',
      'filter',
      'marker-start',
      'marker-mid',
      'marker-end',
      'vector-effect',
      'mix-blend-mode',
      'isolation',
      'color-interpolation',
      'color-interpolation-filters',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'text-anchor',
      'dominant-baseline',
      'alignment-baseline',
      'letter-spacing',
      'word-spacing',
      'text-decoration',
      'display',
      'visibility',
    ];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val !== null) styleProps[attr] = val;
    }

    // 3. Inline CSS style (ưu tiên cao nhất)
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle) {
      const rules = inlineStyle.split(';').map((r) => r.trim());
      for (const rule of rules) {
        if (!rule) continue;
        const [k, v] = rule.split(':').map((s) => s.trim());
        if (k && v) styleProps[k.toLowerCase()] = v;
      }
    }

    // 4. Phân tích Fill & Gradients
    if (styleProps['fill'] !== undefined) {
      const fillVal = styleProps['fill'].trim();
      const urlMatch = fillVal.match(/url\(#([^)]+)\)/);
      if (urlMatch && defsMap?.has(urlMatch[1])) {
        style.fill = defsMap.get(urlMatch[1])!;
      } else {
        style.fill = PaintFactory.parse(fillVal);
      }
    }

    if (styleProps['fill-opacity'] !== undefined) {
      style.fillOpacity = parseFloat(styleProps['fill-opacity']);
      if (isNaN(style.fillOpacity)) style.fillOpacity = 1;
    }

    if (styleProps['fill-rule']) {
      style.fillRule = styleProps['fill-rule'] as FillRule;
    }

    // 5. Phân tích Stroke
    if (styleProps['stroke'] !== undefined) {
      const strokeVal = styleProps['stroke'].trim();
      const urlMatch = strokeVal.match(/url\(#([^)]+)\)/);
      if (urlMatch && defsMap?.has(urlMatch[1])) {
        style.stroke.paint = defsMap.get(urlMatch[1])!;
      } else {
        style.stroke.paint = PaintFactory.parse(strokeVal);
      }
    }

    if (styleProps['stroke-width'] !== undefined) {
      style.stroke.width = parseFloat(styleProps['stroke-width']) || 0;
    }
    if (styleProps['stroke-linecap']) {
      style.stroke.lineCap = styleProps['stroke-linecap'] as LineCap;
    }
    if (styleProps['stroke-linejoin']) {
      style.stroke.lineJoin = styleProps['stroke-linejoin'] as LineJoin;
    }
    if (styleProps['stroke-miterlimit']) {
      style.stroke.miterLimit = parseFloat(styleProps['stroke-miterlimit']) || 4;
    }
    if (styleProps['stroke-dashoffset']) {
      style.stroke.dashOffset = parseFloat(styleProps['stroke-dashoffset']) || 0;
    }
    if (styleProps['stroke-dasharray']) {
      if (styleProps['stroke-dasharray'] === 'none') {
        style.stroke.dashArray = [];
      } else {
        style.stroke.dashArray = styleProps['stroke-dasharray']
          .split(/[\s,]+/)
          .map((n) => parseFloat(n))
          .filter((n) => !isNaN(n));
      }
    }
    if (styleProps['stroke-opacity'] !== undefined) {
      style.stroke.opacity = parseFloat(styleProps['stroke-opacity']);
      if (isNaN(style.stroke.opacity)) style.stroke.opacity = 1;
    }

    // 6. Phân tích Opacity tổng
    if (styleProps['opacity'] !== undefined) {
      style.opacity = parseFloat(styleProps['opacity']);
      if (isNaN(style.opacity)) style.opacity = 1;
    }

    // 7. Phân tích ClipPath, Mask, Filter, Markers URLs
    if (styleProps['clip-path']) {
      const clipMatch = styleProps['clip-path'].match(/url\(#([^)]+)\)/);
      if (clipMatch) style.clipPathUrl = clipMatch[1];
    }
    if (styleProps['clip-rule']) {
      style.clipRule = styleProps['clip-rule'] as ClipRule;
    }
    if (styleProps['mask']) {
      const maskMatch = styleProps['mask'].match(/url\(#([^)]+)\)/);
      if (maskMatch) style.maskUrl = maskMatch[1];
    }
    if (styleProps['filter']) {
      const filterMatch = styleProps['filter'].match(/url\(#([^)]+)\)/);
      if (filterMatch) style.filterUrl = filterMatch[1];
    }
    if (styleProps['marker-start']) {
      const match = styleProps['marker-start'].match(/url\(#([^)]+)\)/);
      if (match) style.markerStartUrl = match[1];
    }
    if (styleProps['marker-mid']) {
      const match = styleProps['marker-mid'].match(/url\(#([^)]+)\)/);
      if (match) style.markerMidUrl = match[1];
    }
    if (styleProps['marker-end']) {
      const match = styleProps['marker-end'].match(/url\(#([^)]+)\)/);
      if (match) style.markerEndUrl = match[1];
    }
    if (styleProps['vector-effect']) {
      style.vectorEffect = styleProps['vector-effect'] as VectorEffect;
    }
    if (styleProps['mix-blend-mode']) {
      style.mixBlendMode = styleProps['mix-blend-mode'];
    }
    if (styleProps['isolation']) {
      style.isolation = styleProps['isolation'];
    }
    if (styleProps['color-interpolation']) {
      style.colorInterpolation = styleProps['color-interpolation'];
    }
    if (styleProps['color-interpolation-filters']) {
      style.colorInterpolationFilters = styleProps['color-interpolation-filters'];
    }

    // 8. Phân tích Typography / Font
    if (styleProps['font-family']) style.font.fontFamily = styleProps['font-family'];
    if (styleProps['font-size']) style.font.fontSize = parseFloat(styleProps['font-size']) || 14;
    if (styleProps['font-weight']) style.font.fontWeight = styleProps['font-weight'] as FontWeight;
    if (styleProps['font-style']) style.font.fontStyle = styleProps['font-style'] as FontStyleType;
    if (styleProps['text-anchor']) style.font.textAnchor = styleProps['text-anchor'] as TextAnchor;
    if (styleProps['dominant-baseline']) style.font.dominantBaseline = styleProps['dominant-baseline'] as DominantBaseline;
    if (styleProps['alignment-baseline'] && !style.font.dominantBaseline) {
      style.font.dominantBaseline = styleProps['alignment-baseline'] as DominantBaseline;
    }
    if (styleProps['letter-spacing']) style.font.letterSpacing = parseFloat(styleProps['letter-spacing']) || 0;
    if (styleProps['word-spacing']) style.font.wordSpacing = parseFloat(styleProps['word-spacing']) || 0;
    if (styleProps['text-decoration']) style.font.textDecoration = styleProps['text-decoration'];

    return style;
  }

  /**
   * Kiểm tra xem phần tử có bị ẩn bởi display:none hoặc visibility:hidden không
   */
  static isVisible(el: SVGElement, ruleMap?: CSSRuleMap): boolean {
    const displayAttr = el.getAttribute('display');
    if (displayAttr === 'none') return false;

    const visAttr = el.getAttribute('visibility');
    if (visAttr === 'hidden' || visAttr === 'collapse') return false;

    const inlineStyle = el.getAttribute('style') || '';
    if (/display\s*:\s*none/i.test(inlineStyle)) return false;
    if (/visibility\s*:\s*(hidden|collapse)/i.test(inlineStyle)) return false;

    if (ruleMap) {
      const matched = CSSStylesheetParser.getMatchedRules(el, ruleMap);
      if (matched['display'] === 'none') return false;
      if (matched['visibility'] === 'hidden' || matched['visibility'] === 'collapse') return false;
    }

    return true;
  }
}
