// svgEngine/ast/nodes/line-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class LineNode extends ASTNode {
  readonly type: ASTNodeType = 'line';
  public x1: SVGLength;
  public y1: SVGLength;
  public x2: SVGLength;
  public y2: SVGLength;

  constructor(
    x1: number | string = 0,
    y1: number | string = 0,
    x2: number | string = 100,
    y2: number | string = 100,
    id?: string
  ) {
    super(id);
    this.x1 = SVGLength.parse(x1);
    this.y1 = SVGLength.parse(y1);
    this.x2 = SVGLength.parse(x2);
    this.y2 = SVGLength.parse(y2);
  }

  getLocalBBox(): BoundingBox {
    const minX = Math.min(this.x1.value, this.x2.value);
    const minY = Math.min(this.y1.value, this.y2.value);
    const maxX = Math.max(this.x1.value, this.x2.value);
    const maxY = Math.max(this.y1.value, this.y2.value);
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  renderDOM(): SVGElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.applyCommonAttributes(line);

    line.setAttribute('x1', this.x1.toSVGString());
    line.setAttribute('y1', this.y1.toSVGString());
    line.setAttribute('x2', this.x2.toSVGString());
    line.setAttribute('y2', this.y2.toSVGString());

    return line;
  }

  clone(): LineNode {
    const copy = new LineNode(this.x1.toSVGString(), this.y1.toSVGString(), this.x2.toSVGString(), this.y2.toSVGString(), this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
