// svgEngine/ast/nodes/tspan-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class TSpanNode extends ASTNode {
  readonly type: ASTNodeType = 'tspan';
  public textContent: string;
  public x?: SVGLength;
  public y?: SVGLength;
  public dx?: SVGLength;
  public dy?: SVGLength;

  constructor(
    textContent: string = '',
    x?: number | string,
    y?: number | string,
    dx?: number | string,
    dy?: number | string,
    id?: string
  ) {
    super(id);
    this.textContent = textContent;
    if (x !== undefined) this.x = SVGLength.parse(x);
    if (y !== undefined) this.y = SVGLength.parse(y);
    if (dx !== undefined) this.dx = SVGLength.parse(dx);
    if (dy !== undefined) this.dy = SVGLength.parse(dy);
  }

  getLocalBBox(): BoundingBox {
    const approxWidth = this.textContent.length * (this.style.font.fontSize * 0.6);
    const approxHeight = this.style.font.fontSize * 1.2;
    const startX = (this.x ? this.x.value : 0) + (this.dx ? this.dx.value : 0);
    const startY = (this.y ? this.y.value : 0) + (this.dy ? this.dy.value : 0);
    return new BoundingBox(startX, startY - approxHeight * 0.8, approxWidth, approxHeight);
  }

  renderDOM(): SVGElement {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    this.applyCommonAttributes(tspan);

    if (this.x) tspan.setAttribute('x', this.x.toSVGString());
    if (this.y) tspan.setAttribute('y', this.y.toSVGString());
    if (this.dx) tspan.setAttribute('dx', this.dx.toSVGString());
    if (this.dy) tspan.setAttribute('dy', this.dy.toSVGString());

    // Font styles
    if (this.style.font.fontFamily) tspan.setAttribute('font-family', this.style.font.fontFamily);
    if (this.style.font.fontSize) tspan.setAttribute('font-size', `${this.style.font.fontSize}px`);
    if (this.style.font.fontWeight) tspan.setAttribute('font-weight', this.style.font.fontWeight.toString());
    if (this.style.font.fontStyle) tspan.setAttribute('font-style', this.style.font.fontStyle);
    if (this.style.font.textAnchor) tspan.setAttribute('text-anchor', this.style.font.textAnchor);

    tspan.textContent = this.textContent;
    return tspan;
  }

  clone(): TSpanNode {
    const copy = new TSpanNode(
      this.textContent,
      this.x?.toSVGString(),
      this.y?.toSVGString(),
      this.dx?.toSVGString(),
      this.dy?.toSVGString(),
      this.id
    );
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
