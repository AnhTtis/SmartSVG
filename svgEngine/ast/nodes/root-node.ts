// svgEngine/ast/nodes/root-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';
import { BaseGradientPaint } from '../../core/paint/gradient/base-gradient';

export type SVGDefItem = BaseGradientPaint | ASTNode;

export class RootNode extends ASTNode {
  readonly type: ASTNodeType = 'svg';
  public width: SVGLength;
  public height: SVGLength;
  public viewBox: BoundingBox;
  public preserveAspectRatio: string = 'xMidYMid meet';
  public defs: Map<string, SVGDefItem> = new Map();

  constructor(
    width: number | string = 800,
    height: number | string = 600,
    viewBox?: BoundingBox
  ) {
    super('svg_root');
    this.width = SVGLength.parse(width);
    this.height = SVGLength.parse(height);
    this.viewBox = viewBox || new BoundingBox(0, 0, this.width.value, this.height.value);
  }

  addDef(def: SVGDefItem): void {
    this.defs.set(def.id, def);
  }

  getLocalBBox(): BoundingBox {
    return this.viewBox.clone();
  }

  renderDOM(): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = this.id;
    svg.setAttribute('width', this.width.toSVGString());
    svg.setAttribute('height', this.height.toSVGString());
    svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    svg.setAttribute('preserveAspectRatio', this.preserveAspectRatio);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Render <defs> nếu có
    if (this.defs.size > 0) {
      const defsEl = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      for (const def of this.defs.values()) {
        if ('renderDefDOM' in def && typeof def.renderDefDOM === 'function') {
          defsEl.appendChild(def.renderDefDOM());
        } else if ('renderDOM' in def && typeof def.renderDOM === 'function') {
          defsEl.appendChild(def.renderDOM());
        }
      }
      svg.appendChild(defsEl);
    }

    for (const child of this.children) {
      if (child.metadata.visible) {
        svg.appendChild(child.renderDOM());
      }
    }
    return svg;
  }

  clone(): RootNode {
    const copy = new RootNode(this.width.toSVGString(), this.height.toSVGString(), this.viewBox.clone());
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.preserveAspectRatio = this.preserveAspectRatio;
    for (const [k, v] of this.defs) {
      copy.defs.set(k, v.clone());
    }
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
