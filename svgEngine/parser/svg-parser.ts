// svgEngine/parser/svg-parser.ts
import { RootNode } from '../ast/nodes/root-node';
import { GroupNode } from '../ast/nodes/group-node';
import { RectNode } from '../ast/nodes/rect-node';
import { CircleNode } from '../ast/nodes/circle-node';
import { EllipseNode } from '../ast/nodes/ellipse-node';
import { LineNode } from '../ast/nodes/line-node';
import { PolylineNode } from '../ast/nodes/polyline-node';
import { PolygonNode } from '../ast/nodes/polygon-node';
import { PathNode } from '../ast/nodes/path-node';
import { TextNode } from '../ast/nodes/text-node';
import { TSpanNode } from '../ast/nodes/tspan-node';
import { TextPathNode, TextPathMethod, TextPathSpacing, TextPathSide } from '../ast/nodes/text-path-node';
import { UseNode } from '../ast/nodes/use-node';
import { ImageNode } from '../ast/nodes/image-node';
import { SymbolNode } from '../ast/nodes/symbol-node';
import { ClipPathNode, ClipPathUnits } from '../ast/nodes/clip-path-node';
import { MaskNode } from '../ast/nodes/mask-node';
import { PatternNode } from '../ast/nodes/pattern-node';
import { MarkerNode } from '../ast/nodes/marker-node';
import { ForeignObjectNode } from '../ast/nodes/foreign-object-node';
import { AnchorNode } from '../ast/nodes/anchor-node';
import { ASTNode } from '../ast/ast-node';
import { BoundingBox } from '../core/math/bbox';
import { TransformList } from '../core/transforms/transform-list';
import { StyleParser } from './style-parser';
import { PathParser } from './path-parser';
import { GradientParser } from './gradient-parser';
import { FilterParser } from './filter-parser';
import { CSSStylesheetParser, CSSRuleMap } from './css-stylesheet-parser';
import { BaseGradientPaint } from '../core/paint/gradient/base-gradient';
import { Style } from '../core/style/style';

export class SVGParser {
  /**
   * Phân tích toàn diện chuỗi XML SVG thành cây AST RootNode theo chuẩn W3C SVG 1.1 / SVG 2
   */
  static parse(svgString: string): RootNode {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(svgString, 'image/svg+xml');

    // Kiểm tra lỗi cú pháp XML
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`XML Syntax Error: ${parserError.textContent}`);
    }

    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      throw new Error('No root <svg> element found in the document.');
    }

    // 1. Phân tích Stylesheet từ toàn bộ thẻ <style>
    const ruleMap: CSSRuleMap = CSSStylesheetParser.parse(doc);

    // 2. Phân tích thuộc tính kích thước và viewBox của thẻ <svg> gốc
    const widthAttr = svgEl.getAttribute('width') || '800';
    const heightAttr = svgEl.getAttribute('height') || '600';
    let viewBox: BoundingBox | undefined;

    const viewBoxAttr = svgEl.getAttribute('viewBox');
    if (viewBoxAttr) {
      const [vx, vy, vw, vh] = viewBoxAttr.split(/[\s,]+/).map((n) => parseFloat(n));
      if (!isNaN(vx) && !isNaN(vy) && !isNaN(vw) && !isNaN(vh)) {
        viewBox = new BoundingBox(vx, vy, vw, vh);
      }
    }

    const rootNode = new RootNode(widthAttr, heightAttr, viewBox);
    const par = svgEl.getAttribute('preserveAspectRatio');
    if (par) rootNode.preserveAspectRatio = par;

    // 3. Quét kho <defs> để trích xuất Gradients, Filters, ClipPaths, Masks, Patterns, Markers, Symbols
    const defsMap = new Map<string, BaseGradientPaint>();
    const nodeRegistry = new Map<string, ASTNode>();

    // 3.1 Gradients
    const gradEls = svgEl.querySelectorAll('linearGradient, radialGradient');
    gradEls.forEach((el) => {
      const grad = GradientParser.parseGradient(el as SVGElement, defsMap);
      if (grad) {
        defsMap.set(grad.id, grad);
        rootNode.addDef(grad);
      }
    });

    // 3.2 Filters
    const filterEls = svgEl.querySelectorAll('filter');
    filterEls.forEach((el) => {
      const filter = FilterParser.parseFilter(el as SVGElement);
      if (filter) {
        rootNode.addDef(filter);
        nodeRegistry.set(filter.id, filter);
      }
    });

    // 3.3 ClipPaths, Masks, Patterns, Markers, Symbols inside <defs>
    const defsContainerEls = svgEl.querySelectorAll('defs');
    defsContainerEls.forEach((defsEl) => {
      for (const childEl of Array.from(defsEl.children)) {
        const tag = childEl.tagName.toLowerCase();
        if (
          tag === 'clippath' ||
          tag === 'mask' ||
          tag === 'pattern' ||
          tag === 'marker' ||
          tag === 'symbol'
        ) {
          const defNode = SVGParser.parseElement(childEl as SVGElement, rootNode.style, defsMap, ruleMap);
          if (defNode) {
            rootNode.addDef(defNode);
            if (defNode.id) nodeRegistry.set(defNode.id, defNode);
          }
        }
      }
    });

    // 4. Duyệt đệ quy toàn bộ cây phần tử SVG
    const parseChildren = (parentEl: Element, parentNode: ASTNode) => {
      for (const childEl of Array.from(parentEl.children)) {
        const tagName = childEl.tagName.toLowerCase();

        // Bỏ qua các thẻ định nghĩa riêng biệt hoặc metadata/script
        if (
          tagName === 'defs' ||
          tagName === 'script' ||
          tagName === 'style' ||
          tagName === 'lineargradient' ||
          tagName === 'radialgradient' ||
          tagName === 'filter' ||
          tagName === 'metadata' ||
          tagName === 'title' ||
          tagName === 'desc'
        ) {
          continue;
        }

        const node = SVGParser.parseElement(childEl as SVGElement, parentNode.style, defsMap, ruleMap);
        if (node) {
          parentNode.addChild(node);
          if (node.id) {
            nodeRegistry.set(node.id, node);
          }

          // Duyệt sâu các thẻ container & text sub-elements
          if (
            node instanceof GroupNode ||
            node instanceof SymbolNode ||
            node instanceof ClipPathNode ||
            node instanceof MaskNode ||
            node instanceof PatternNode ||
            node instanceof MarkerNode ||
            node instanceof AnchorNode ||
            node instanceof TextNode ||
            node instanceof TextPathNode
          ) {
            parseChildren(childEl, node);
          }
        }
      }
    };

    parseChildren(svgEl, rootNode);

    // 5. Liên kết các tham chiếu của thẻ <use> với node trong registry
    const resolveUseReferences = (node: ASTNode) => {
      if (node instanceof UseNode) {
        const targetId = node.href.replace(/^#/, '');
        if (nodeRegistry.has(targetId)) {
          node.referencedNode = nodeRegistry.get(targetId);
        }
      }
      for (const child of node.children) {
        resolveUseReferences(child);
      }
    };

    resolveUseReferences(rootNode);

    return rootNode;
  }

  /**
   * Phân tích từng phần tử SVG riêng lẻ thành Node AST tương ứng
   */
  static parseElement(
    el: SVGElement,
    inheritedStyle?: Style,
    defsMap?: Map<string, BaseGradientPaint>,
    ruleMap?: CSSRuleMap
  ): ASTNode | null {
    const tagName = el.tagName.toLowerCase();
    const id = el.id || el.getAttribute('id') || undefined;
    let node: ASTNode | null = null;

    switch (tagName) {
      case 'g': {
        node = new GroupNode(id);
        break;
      }

      case 'rect': {
        const x = el.getAttribute('x') || 0;
        const y = el.getAttribute('y') || 0;
        const w = el.getAttribute('width') || 0;
        const h = el.getAttribute('height') || 0;
        const rectNode = new RectNode(x, y, w, h, id);
        const rx = el.getAttribute('rx');
        const ry = el.getAttribute('ry');
        if (rx) rectNode.rx.value = parseFloat(rx);
        if (ry) rectNode.ry.value = parseFloat(ry);
        // Nếu chỉ có rx hoặc chỉ có ry -> gán giá trị cho cả hai theo chuẩn W3C
        if (rx && !ry) rectNode.ry.value = parseFloat(rx);
        if (ry && !rx) rectNode.rx.value = parseFloat(ry);
        node = rectNode;
        break;
      }

      case 'circle': {
        const cx = el.getAttribute('cx') || 0;
        const cy = el.getAttribute('cy') || 0;
        const r = el.getAttribute('r') || 0;
        node = new CircleNode(cx, cy, r, id);
        break;
      }

      case 'ellipse': {
        const cx = el.getAttribute('cx') || 0;
        const cy = el.getAttribute('cy') || 0;
        const rx = el.getAttribute('rx') || 0;
        const ry = el.getAttribute('ry') || 0;
        node = new EllipseNode(cx, cy, rx, ry, id);
        break;
      }

      case 'line': {
        const x1 = el.getAttribute('x1') || 0;
        const y1 = el.getAttribute('y1') || 0;
        const x2 = el.getAttribute('x2') || 0;
        const y2 = el.getAttribute('y2') || 0;
        node = new LineNode(x1, y1, x2, y2, id);
        break;
      }

      case 'polyline': {
        const pointsStr = el.getAttribute('points') || '';
        node = new PolylineNode(PolylineNode.parsePoints(pointsStr), id);
        break;
      }

      case 'polygon': {
        const pointsStr = el.getAttribute('points') || '';
        node = new PolygonNode(PolygonNode.parsePoints(pointsStr), id);
        break;
      }

      case 'path': {
        const d = el.getAttribute('d') || '';
        const pathData = PathParser.parse(d);
        node = new PathNode(pathData, id);
        break;
      }

      case 'text': {
        const x = el.getAttribute('x') || 0;
        const y = el.getAttribute('y') || 0;
        const textContent = el.children.length === 0 ? (el.textContent || '') : '';
        const textNode = new TextNode(textContent, x, y, id);
        const dx = el.getAttribute('dx');
        const dy = el.getAttribute('dy');
        if (dx) textNode.dx.value = parseFloat(dx);
        if (dy) textNode.dy.value = parseFloat(dy);
        node = textNode;
        break;
      }

      case 'tspan': {
        const x = el.getAttribute('x') || undefined;
        const y = el.getAttribute('y') || undefined;
        const dx = el.getAttribute('dx') || undefined;
        const dy = el.getAttribute('dy') || undefined;
        const textContent = el.textContent || '';
        node = new TSpanNode(textContent, x, y, dx, dy, id);
        break;
      }

      case 'textpath': {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        const textContent = el.textContent || '';
        const tpNode = new TextPathNode(href, textContent, id);
        const startOffset = el.getAttribute('startOffset');
        if (startOffset) tpNode.startOffset = startOffset;
        const method = el.getAttribute('method');
        if (method === 'align' || method === 'stretch') tpNode.method = method as TextPathMethod;
        const spacing = el.getAttribute('spacing');
        if (spacing === 'auto' || spacing === 'exact') tpNode.spacing = spacing as TextPathSpacing;
        const side = el.getAttribute('side');
        if (side === 'left' || side === 'right') tpNode.side = side as TextPathSide;
        node = tpNode;
        break;
      }

      case 'use': {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        const x = el.getAttribute('x') || 0;
        const y = el.getAttribute('y') || 0;
        const width = el.getAttribute('width') || undefined;
        const height = el.getAttribute('height') || undefined;
        node = new UseNode(href, x, y, width, height, id);
        break;
      }

      case 'image': {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        const x = el.getAttribute('x') || 0;
        const y = el.getAttribute('y') || 0;
        const width = el.getAttribute('width') || 0;
        const height = el.getAttribute('height') || 0;
        const imgNode = new ImageNode(href, x, y, width, height, id);
        const par = el.getAttribute('preserveAspectRatio');
        if (par) imgNode.preserveAspectRatio = par;
        node = imgNode;
        break;
      }

      case 'symbol': {
        let symbolViewBox: BoundingBox | undefined;
        const vbAttr = el.getAttribute('viewBox');
        if (vbAttr) {
          const [vx, vy, vw, vh] = vbAttr.split(/[\s,]+/).map((n) => parseFloat(n));
          if (!isNaN(vx) && !isNaN(vy) && !isNaN(vw) && !isNaN(vh)) {
            symbolViewBox = new BoundingBox(vx, vy, vw, vh);
          }
        }
        const symNode = new SymbolNode(id, symbolViewBox);
        const par = el.getAttribute('preserveAspectRatio');
        if (par) symNode.preserveAspectRatio = par;
        node = symNode;
        break;
      }

      case 'clippath': {
        const units = (el.getAttribute('clipPathUnits') as ClipPathUnits) || 'userSpaceOnUse';
        node = new ClipPathNode(id, units);
        break;
      }

      case 'mask': {
        const maskNode = new MaskNode(id);
        const mUnits = el.getAttribute('maskUnits');
        if (mUnits) maskNode.maskUnits = mUnits;
        const mcUnits = el.getAttribute('maskContentUnits');
        if (mcUnits) maskNode.maskContentUnits = mcUnits;
        const x = el.getAttribute('x');
        const y = el.getAttribute('y');
        const w = el.getAttribute('width');
        const h = el.getAttribute('height');
        if (x) maskNode.x.value = parseFloat(x);
        if (y) maskNode.y.value = parseFloat(y);
        if (w) maskNode.width.value = parseFloat(w);
        if (h) maskNode.height.value = parseFloat(h);
        node = maskNode;
        break;
      }

      case 'pattern': {
        const patNode = new PatternNode(id);
        const pUnits = el.getAttribute('patternUnits');
        if (pUnits) patNode.patternUnits = pUnits;
        const pcUnits = el.getAttribute('patternContentUnits');
        if (pcUnits) patNode.patternContentUnits = pcUnits;
        const pTrans = el.getAttribute('patternTransform');
        if (pTrans) patNode.patternTransform = pTrans;
        const vbAttr = el.getAttribute('viewBox');
        if (vbAttr) {
          const [vx, vy, vw, vh] = vbAttr.split(/[\s,]+/).map((n) => parseFloat(n));
          if (!isNaN(vx) && !isNaN(vy) && !isNaN(vw) && !isNaN(vh)) {
            patNode.viewBox = new BoundingBox(vx, vy, vw, vh);
          }
        }
        const x = el.getAttribute('x');
        const y = el.getAttribute('y');
        const w = el.getAttribute('width');
        const h = el.getAttribute('height');
        if (x) patNode.x.value = parseFloat(x);
        if (y) patNode.y.value = parseFloat(y);
        if (w) patNode.width.value = parseFloat(w);
        if (h) patNode.height.value = parseFloat(h);
        node = patNode;
        break;
      }

      case 'marker': {
        const markerNode = new MarkerNode(id);
        const mw = el.getAttribute('markerWidth');
        const mh = el.getAttribute('markerHeight');
        const rx = el.getAttribute('refX');
        const ry = el.getAttribute('refY');
        const orient = el.getAttribute('orient');
        const mUnits = el.getAttribute('markerUnits');
        if (mw) markerNode.markerWidth = parseFloat(mw);
        if (mh) markerNode.markerHeight = parseFloat(mh);
        if (rx) markerNode.refX = parseFloat(rx);
        if (ry) markerNode.refY = parseFloat(ry);
        if (orient) markerNode.orient = orient;
        if (mUnits) markerNode.markerUnits = mUnits;
        const vbAttr = el.getAttribute('viewBox');
        if (vbAttr) {
          const [vx, vy, vw, vh] = vbAttr.split(/[\s,]+/).map((n) => parseFloat(n));
          if (!isNaN(vx) && !isNaN(vy) && !isNaN(vw) && !isNaN(vh)) {
            markerNode.viewBox = new BoundingBox(vx, vy, vw, vh);
          }
        }
        node = markerNode;
        break;
      }

      case 'foreignobject': {
        const x = el.getAttribute('x') || 0;
        const y = el.getAttribute('y') || 0;
        const w = el.getAttribute('width') || 100;
        const h = el.getAttribute('height') || 100;
        node = new ForeignObjectNode(el.innerHTML, x, y, w, h, id);
        break;
      }

      case 'a': {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        const aNode = new AnchorNode(href, id);
        const target = el.getAttribute('target');
        const download = el.getAttribute('download');
        const rel = el.getAttribute('rel');
        if (target) aNode.target = target;
        if (download) aNode.download = download;
        if (rel) aNode.rel = rel;
        node = aNode;
        break;
      }

      default:
        return null;
    }

    if (node) {
      // 1. Áp dụng Transforms
      const transformAttr = el.getAttribute('transform');
      if (transformAttr) {
        node.transforms = TransformList.parse(transformAttr);
      }

      // 2. Áp dụng Style & CSS Cascading
      node.style = StyleParser.parse(el, inheritedStyle, defsMap, ruleMap);

      // 3. Classes
      const classAttr = el.getAttribute('class');
      if (classAttr) {
        node.metadata.classes = classAttr.split(/\s+/).filter(Boolean);
      }

      // 4. Custom data-* / aria-* attributes
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          node.metadata.customAttributes[attr.name] = attr.value;
        }
      }

      // 5. Kiểm tra Visibility / Display
      node.metadata.visible = StyleParser.isVisible(el, ruleMap);
    }

    return node;
  }
}
