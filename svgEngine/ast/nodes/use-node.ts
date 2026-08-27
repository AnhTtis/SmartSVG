// svgEngine/ast/nodes/use-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class UseNode extends ASTNode {
  readonly type: ASTNodeType = 'use';
  public href: string;
  public x: SVGLength;
  public y: SVGLength;
  public width?: SVGLength;
  public height?: SVGLength;
  public referencedNode?: ASTNode;

  constructor(
    href: string = '',
    x: number | string = 0,
    y: number | string = 0,
    width?: number | string,
    height?: number | string,
    id?: string
  ) {
    super(id);
    this.href = href;
    this.x = SVGLength.parse(x);
    this.y = SVGLength.parse(y);
    if (width !== undefined) this.width = SVGLength.parse(width);
    if (height !== undefined) this.height = SVGLength.parse(height);
  }

  getLocalBBox(): BoundingBox {
    if (this.referencedNode) {
      const refBBox = this.referencedNode.getLocalBBox();
      return new BoundingBox(
        refBBox.x + this.x.value,
        refBBox.y + this.y.value,
        this.width ? this.width.value : refBBox.width,
        this.height ? this.height.value : refBBox.height
      );
    }
    return new BoundingBox(this.x.value, this.y.value, this.width?.value || 0, this.height?.value || 0);
  }

  renderDOM(): SVGElement {
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    this.applyCommonAttributes(use);

    const cleanHref = this.href.startsWith('#') ? this.href : `#${this.href}`;
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', cleanHref);
    use.setAttribute('href', cleanHref);

    if (this.x.value !== 0) use.setAttribute('x', this.x.toSVGString());
    if (this.y.value !== 0) use.setAttribute('y', this.y.toSVGString());
    if (this.width) use.setAttribute('width', this.width.toSVGString());
    if (this.height) use.setAttribute('height', this.height.toSVGString());

    return use;
  }

  clone(): UseNode {
    const copy = new UseNode(
      this.href,
      this.x.toSVGString(),
      this.y.toSVGString(),
      this.width?.toSVGString(),
      this.height?.toSVGString(),
      this.id
    );
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    if (this.referencedNode) copy.referencedNode = this.referencedNode.clone();
    return copy;
  }
}
