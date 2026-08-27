// svgEngine/ast/nodes/group-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export class GroupNode extends ASTNode {
  readonly type: ASTNodeType = 'g';

  getLocalBBox(): BoundingBox {
    if (this.children.length === 0) return new BoundingBox(0, 0, 0, 0);

    let bbox: BoundingBox | null = null;
    for (const child of this.children) {
      if (!child.metadata.visible) continue;
      const childBBox = child.getLocalBBox().transform(child.localMatrix);
      bbox = bbox ? bbox.union(childBBox) : childBBox;
    }
    return bbox || new BoundingBox(0, 0, 0, 0);
  }

  renderDOM(): SVGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.applyCommonAttributes(g);

    for (const child of this.children) {
      if (child.metadata.visible) {
        g.appendChild(child.renderDOM());
      }
    }
    return g;
  }

  clone(): GroupNode {
    const copy = new GroupNode(this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
