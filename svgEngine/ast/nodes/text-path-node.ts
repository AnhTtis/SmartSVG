// svgEngine/ast/nodes/text-path-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export type TextPathMethod = 'align' | 'stretch';
export type TextPathSpacing = 'auto' | 'exact';
export type TextPathSide = 'left' | 'right';

export class TextPathNode extends ASTNode {
  readonly type: ASTNodeType = 'textPath';
  public href: string;
  public startOffset: string | number = 0;
  public method: TextPathMethod = 'align';
  public spacing: TextPathSpacing = 'exact';
  public side: TextPathSide = 'left';
  public textContent: string = '';

  constructor(href: string = '', text: string = '', id?: string) {
    super(id);
    this.href = href;
    this.textContent = text;
  }

  getLocalBBox(): BoundingBox {
    const approxW = this.textContent.length * this.style.font.fontSize * 0.6;
    const approxH = this.style.font.fontSize * 1.2;
    return new BoundingBox(0, -approxH, approxW, approxH);
  }

  renderDOM(): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    this.applyCommonAttributes(el);

    if (this.href) {
      const formattedHref = this.href.startsWith('#') ? this.href : `#${this.href}`;
      el.setAttribute('href', formattedHref);
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', formattedHref);
    }

    if (this.startOffset !== 0) el.setAttribute('startOffset', this.startOffset.toString());
    if (this.method !== 'align') el.setAttribute('method', this.method);
    if (this.spacing !== 'exact') el.setAttribute('spacing', this.spacing);
    if (this.side !== 'left') el.setAttribute('side', this.side);

    if (this.children.length > 0) {
      for (const child of this.children) {
        el.appendChild(child.renderDOM());
      }
    } else {
      el.textContent = this.textContent;
    }

    return el;
  }

  clone(): TextPathNode {
    const copy = new TextPathNode(this.href, this.textContent, this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.startOffset = this.startOffset;
    copy.method = this.method;
    copy.spacing = this.spacing;
    copy.side = this.side;
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
