// svgEngine/ast/nodes/text-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { SVGLength } from '../../core/values/svg-length';

export class TextNode extends ASTNode {
  readonly type: ASTNodeType = 'text';
  public x: SVGLength;
  public y: SVGLength;
  public dx: SVGLength = new SVGLength(0, 'px');
  public dy: SVGLength = new SVGLength(0, 'px');
  public textContent: string;

  constructor(
    textContent: string = '',
    x: number | string = 0,
    y: number | string = 0,
    id?: string
  ) {
    super(id);
    this.textContent = textContent;
    this.x = SVGLength.parse(x);
    this.y = SVGLength.parse(y);
  }

  getLocalBBox(): BoundingBox {
    if (this.children.length > 0) {
      let bbox = new BoundingBox(this.x.value, this.y.value, 0, 0);
      let first = true;
      for (const child of this.children) {
        const childBBox = child.getLocalBBox();
        if (first) {
          bbox = childBBox;
          first = false;
        } else {
          bbox = bbox.union(childBBox);
        }
      }
      return bbox;
    }

    const approxWidth = this.textContent.length * (this.style.font.fontSize * 0.6);
    const approxHeight = this.style.font.fontSize * 1.2;
    return new BoundingBox(
      this.x.value + this.dx.value,
      this.y.value + this.dy.value - approxHeight * 0.8,
      approxWidth,
      approxHeight
    );
  }

  renderDOM(): SVGElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.applyCommonAttributes(text);

    text.setAttribute('x', this.x.toSVGString());
    text.setAttribute('y', this.y.toSVGString());
    if (this.dx.value !== 0) text.setAttribute('dx', this.dx.toSVGString());
    if (this.dy.value !== 0) text.setAttribute('dy', this.dy.toSVGString());

    // Font styles
    if (this.style.font.fontFamily) text.setAttribute('font-family', this.style.font.fontFamily);
    if (this.style.font.fontSize) text.setAttribute('font-size', `${this.style.font.fontSize}px`);
    if (this.style.font.fontWeight) text.setAttribute('font-weight', this.style.font.fontWeight.toString());
    if (this.style.font.fontStyle) text.setAttribute('font-style', this.style.font.fontStyle);
    if (this.style.font.textAnchor) text.setAttribute('text-anchor', this.style.font.textAnchor);
    if (this.style.font.dominantBaseline) text.setAttribute('dominant-baseline', this.style.font.dominantBaseline);
    if (this.style.font.letterSpacing) text.setAttribute('letter-spacing', `${this.style.font.letterSpacing}px`);
    if (this.style.font.wordSpacing) text.setAttribute('word-spacing', `${this.style.font.wordSpacing}px`);
    if (this.style.font.textDecoration) text.setAttribute('text-decoration', this.style.font.textDecoration);

    if (this.children.length > 0) {
      for (const child of this.children) {
        if (child.metadata.visible) {
          text.appendChild(child.renderDOM());
        }
      }
    } else {
      text.textContent = this.textContent;
    }

    return text;
  }

  clone(): TextNode {
    const copy = new TextNode(this.textContent, this.x.toSVGString(), this.y.toSVGString(), this.id);
    copy.dx = this.dx.clone();
    copy.dy = this.dy.clone();
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
