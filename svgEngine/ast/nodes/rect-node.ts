// svgEngine/ast/nodes/rect-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class RectNode extends ASTNode {
  readonly type: ASTNodeType = 'rect';
  public x: SVGLength;
  public y: SVGLength;
  public width: SVGLength;
  public height: SVGLength;
  public rx: SVGLength = new SVGLength(0, 'px');
  public ry: SVGLength = new SVGLength(0, 'px');

  constructor(
    x: number | string = 0,
    y: number | string = 0,
    width: number | string = 100,
    height: number | string = 100,
    id?: string
  ) {
    super(id);
    this.x = SVGLength.parse(x);
    this.y = SVGLength.parse(y);
    this.width = SVGLength.parse(width);
    this.height = SVGLength.parse(height);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(this.x.value, this.y.value, this.width.value, this.height.value);
  }

  renderDOM(): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.applyCommonAttributes(rect);

    rect.setAttribute('x', this.x.toSVGString());
    rect.setAttribute('y', this.y.toSVGString());
    rect.setAttribute('width', this.width.toSVGString());
    rect.setAttribute('height', this.height.toSVGString());

    if (this.rx.value > 0) rect.setAttribute('rx', this.rx.toSVGString());
    if (this.ry.value > 0) rect.setAttribute('ry', this.ry.toSVGString());

    return rect;
  }

  clone(): RectNode {
    const copy = new RectNode(this.x.toSVGString(), this.y.toSVGString(), this.width.toSVGString(), this.height.toSVGString(), this.id);
    copy.rx = this.rx.clone();
    copy.ry = this.ry.clone();
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
