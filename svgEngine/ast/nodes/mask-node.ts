// svgEngine/ast/nodes/mask-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class MaskNode extends ASTNode {
  readonly type: ASTNodeType = 'mask';
  public x: SVGLength = new SVGLength(-10, '%');
  public y: SVGLength = new SVGLength(-10, '%');
  public width: SVGLength = new SVGLength(120, '%');
  public height: SVGLength = new SVGLength(120, '%');
  public maskUnits: string = 'objectBoundingBox';
  public maskContentUnits: string = 'userSpaceOnUse';

  constructor(id?: string) {
    super(id);
  }

  getLocalBBox(): BoundingBox {
    let bbox = new BoundingBox(0, 0, 0, 0);
    let first = true;
    for (const child of this.children) {
      const childBBox = child.getGlobalBBox();
      if (first) {
        bbox = childBBox;
        first = false;
      } else {
        bbox = bbox.union(childBBox);
      }
    }
    return bbox;
  }

  renderDOM(): SVGElement {
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.id = this.id;
    mask.setAttribute('x', this.x.toSVGString());
    mask.setAttribute('y', this.y.toSVGString());
    mask.setAttribute('width', this.width.toSVGString());
    mask.setAttribute('height', this.height.toSVGString());
    mask.setAttribute('maskUnits', this.maskUnits);
    mask.setAttribute('maskContentUnits', this.maskContentUnits);

    for (const child of this.children) {
      if (child.metadata.visible) {
        mask.appendChild(child.renderDOM());
      }
    }
    return mask;
  }

  clone(): MaskNode {
    const copy = new MaskNode(this.id);
    copy.x = this.x.clone();
    copy.y = this.y.clone();
    copy.width = this.width.clone();
    copy.height = this.height.clone();
    copy.maskUnits = this.maskUnits;
    copy.maskContentUnits = this.maskContentUnits;
    copy.style = this.style.clone();
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
