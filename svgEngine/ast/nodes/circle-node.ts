// svgEngine/ast/nodes/circle-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class CircleNode extends ASTNode {
  readonly type: ASTNodeType = 'circle';
  public cx: SVGLength;
  public cy: SVGLength;
  public r: SVGLength;

  constructor(
    cx: number | string = 0,
    cy: number | string = 0,
    r: number | string = 50,
    id?: string
  ) {
    super(id);
    this.cx = SVGLength.parse(cx);
    this.cy = SVGLength.parse(cy);
    this.r = SVGLength.parse(r);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(
      this.cx.value - this.r.value,
      this.cy.value - this.r.value,
      this.r.value * 2,
      this.r.value * 2
    );
  }

  renderDOM(): SVGElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.applyCommonAttributes(circle);

    circle.setAttribute('cx', this.cx.toSVGString());
    circle.setAttribute('cy', this.cy.toSVGString());
    circle.setAttribute('r', this.r.toSVGString());

    return circle;
  }

  clone(): CircleNode {
    const copy = new CircleNode(this.cx.toSVGString(), this.cy.toSVGString(), this.r.toSVGString(), this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
