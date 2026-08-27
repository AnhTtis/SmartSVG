// svgEngine/ast/nodes/image-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class ImageNode extends ASTNode {
  readonly type: ASTNodeType = 'image';
  public href: string;
  public x: SVGLength;
  public y: SVGLength;
  public width: SVGLength;
  public height: SVGLength;
  public preserveAspectRatio: string = 'xMidYMid meet';

  constructor(
    href: string = '',
    x: number | string = 0,
    y: number | string = 0,
    width: number | string = 0,
    height: number | string = 0,
    id?: string
  ) {
    super(id);
    this.href = href;
    this.x = SVGLength.parse(x);
    this.y = SVGLength.parse(y);
    this.width = SVGLength.parse(width);
    this.height = SVGLength.parse(height);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(this.x.value, this.y.value, this.width.value, this.height.value);
  }

  renderDOM(): SVGElement {
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    this.applyCommonAttributes(img);

    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.href);
    img.setAttribute('href', this.href);
    img.setAttribute('x', this.x.toSVGString());
    img.setAttribute('y', this.y.toSVGString());
    img.setAttribute('width', this.width.toSVGString());
    img.setAttribute('height', this.height.toSVGString());
    if (this.preserveAspectRatio !== 'xMidYMid meet') {
      img.setAttribute('preserveAspectRatio', this.preserveAspectRatio);
    }

    return img;
  }

  clone(): ImageNode {
    const copy = new ImageNode(
      this.href,
      this.x.toSVGString(),
      this.y.toSVGString(),
      this.width.toSVGString(),
      this.height.toSVGString(),
      this.id
    );
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.preserveAspectRatio = this.preserveAspectRatio;
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
