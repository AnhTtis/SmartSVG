// svgEngine/ast/nodes/ellipse-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class EllipseNode extends ASTNode {
  readonly type: ASTNodeType = 'ellipse';
  public cx: SVGLength;
  public cy: SVGLength;
  public rx: SVGLength;
  public ry: SVGLength;

  constructor(
    cx: number | string = 0,
    cy: number | string = 0,
    rx: number | string = 50,
    ry: number | string = 30,
    id?: string
  ) {
    super(id);
    this.cx = SVGLength.parse(cx);
    this.cy = SVGLength.parse(cy);
    this.rx = SVGLength.parse(rx);
    this.ry = SVGLength.parse(ry);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(
      this.cx.value - this.rx.value,
      this.cy.value - this.ry.value,
      this.rx.value * 2,
      this.ry.value * 2
    );
  }

  renderDOM(): SVGElement {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.applyCommonAttributes(ellipse);

    ellipse.setAttribute('cx', this.cx.toSVGString());
    ellipse.setAttribute('cy', this.cy.toSVGString());
    ellipse.setAttribute('rx', this.rx.toSVGString());
    ellipse.setAttribute('ry', this.ry.toSVGString());

    return ellipse;
  }

  clone(): EllipseNode {
    const copy = new EllipseNode(this.cx.toSVGString(), this.cy.toSVGString(), this.rx.toSVGString(), this.ry.toSVGString(), this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
