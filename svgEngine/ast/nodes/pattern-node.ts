// svgEngine/ast/nodes/pattern-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class PatternNode extends ASTNode {
  readonly type: ASTNodeType = 'pattern';
  public x: SVGLength = new SVGLength(0, 'px');
  public y: SVGLength = new SVGLength(0, 'px');
  public width: SVGLength = new SVGLength(0, 'px');
  public height: SVGLength = new SVGLength(0, 'px');
  public patternUnits: string = 'objectBoundingBox';
  public patternContentUnits: string = 'userSpaceOnUse';
  public patternTransform?: string;
  public viewBox?: BoundingBox;

  constructor(id?: string) {
    super(id);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(this.x.value, this.y.value, this.width.value, this.height.value);
  }

  renderDOM(): SVGElement {
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.id = this.id;
    pattern.setAttribute('x', this.x.toSVGString());
    pattern.setAttribute('y', this.y.toSVGString());
    pattern.setAttribute('width', this.width.toSVGString());
    pattern.setAttribute('height', this.height.toSVGString());
    pattern.setAttribute('patternUnits', this.patternUnits);
    pattern.setAttribute('patternContentUnits', this.patternContentUnits);

    if (this.patternTransform) {
      pattern.setAttribute('patternTransform', this.patternTransform);
    }

    if (this.viewBox) {
      pattern.setAttribute(
        'viewBox',
        `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
      );
    }

    for (const child of this.children) {
      if (child.metadata.visible) {
        pattern.appendChild(child.renderDOM());
      }
    }
    return pattern;
  }

  clone(): PatternNode {
    const copy = new PatternNode(this.id);
    copy.x = this.x.clone();
    copy.y = this.y.clone();
    copy.width = this.width.clone();
    copy.height = this.height.clone();
    copy.patternUnits = this.patternUnits;
    copy.patternContentUnits = this.patternContentUnits;
    copy.patternTransform = this.patternTransform;
    copy.viewBox = this.viewBox?.clone();
    copy.style = this.style.clone();
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
