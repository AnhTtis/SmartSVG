// svgEngine/ast/nodes/symbol-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export class SymbolNode extends ASTNode {
  readonly type: ASTNodeType = 'symbol';
  public viewBox?: BoundingBox;
  public preserveAspectRatio: string = 'xMidYMid meet';

  constructor(id?: string, viewBox?: BoundingBox) {
    super(id);
    this.viewBox = viewBox;
  }

  getLocalBBox(): BoundingBox {
    if (this.viewBox) return this.viewBox.clone();
    let bbox = new BoundingBox(0, 0, 0, 0);
    let first = true;
    for (const child of this.children) {
      const childBBox = child.getGlobalBBox();
      if (first) {
        bbox = childBBox;
        first = false;
      } else {
        bbox = bbox.union(childBBox);
      }
    }
    return bbox;
  }

  renderDOM(): SVGElement {
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.id = this.id;
    if (this.viewBox) {
      symbol.setAttribute(
        'viewBox',
        `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
      );
    }
    if (this.preserveAspectRatio !== 'xMidYMid meet') {
      symbol.setAttribute('preserveAspectRatio', this.preserveAspectRatio);
    }

    for (const child of this.children) {
      if (child.metadata.visible) {
        symbol.appendChild(child.renderDOM());
      }
    }
    return symbol;
  }

  clone(): SymbolNode {
    const copy = new SymbolNode(this.id, this.viewBox?.clone());
    copy.preserveAspectRatio = this.preserveAspectRatio;
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
