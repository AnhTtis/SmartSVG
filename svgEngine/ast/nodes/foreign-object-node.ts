// svgEngine/ast/nodes/foreign-object-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class ForeignObjectNode extends ASTNode {
  readonly type: ASTNodeType = 'foreignObject';
  public x: SVGLength;
  public y: SVGLength;
  public width: SVGLength;
  public height: SVGLength;
  public htmlContent: string;

  constructor(
    htmlContent: string = '',
    x: number | string = 0,
    y: number | string = 0,
    width: number | string = 100,
    height: number | string = 100,
    id?: string
  ) {
    super(id);
    this.htmlContent = htmlContent;
    this.x = SVGLength.parse(x);
    this.y = SVGLength.parse(y);
    this.width = SVGLength.parse(width);
    this.height = SVGLength.parse(height);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(this.x.value, this.y.value, this.width.value, this.height.value);
  }

  renderDOM(): SVGElement {
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    this.applyCommonAttributes(fo);

    fo.setAttribute('x', this.x.toSVGString());
    fo.setAttribute('y', this.y.toSVGString());
    fo.setAttribute('width', this.width.toSVGString());
    fo.setAttribute('height', this.height.toSVGString());

    fo.innerHTML = this.htmlContent;
    return fo;
  }

  clone(): ForeignObjectNode {
    const copy = new ForeignObjectNode(
      this.htmlContent,
      this.x.toSVGString(),
      this.y.toSVGString(),
      this.width.toSVGString(),
      this.height.toSVGString(),
      this.id
    );
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
