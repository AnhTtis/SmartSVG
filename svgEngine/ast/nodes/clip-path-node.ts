// svgEngine/ast/nodes/clip-path-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export type ClipPathUnits = 'userSpaceOnUse' | 'objectBoundingBox';

export class ClipPathNode extends ASTNode {
  readonly type: ASTNodeType = 'clipPath';
  public clipPathUnits: ClipPathUnits = 'userSpaceOnUse';

  constructor(id?: string, clipPathUnits: ClipPathUnits = 'userSpaceOnUse') {
    super(id);
    this.clipPathUnits = clipPathUnits;
  }

  getLocalBBox(): BoundingBox {
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
    const clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clip.id = this.id;
    if (this.clipPathUnits !== 'userSpaceOnUse') {
      clip.setAttribute('clipPathUnits', this.clipPathUnits);
    }

    for (const child of this.children) {
      clip.appendChild(child.renderDOM());
    }
    return clip;
  }

  clone(): ClipPathNode {
    const copy = new ClipPathNode(this.id, this.clipPathUnits);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
