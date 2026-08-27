// svgEngine/ast/nodes/anchor-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export class AnchorNode extends ASTNode {
  readonly type: ASTNodeType = 'a';
  public href: string = '';
  public target: string = '';
  public download?: string;
  public rel?: string;

  constructor(href: string = '', id?: string) {
    super(id);
    this.href = href;
  }

  getLocalBBox(): BoundingBox {
    let bbox = BoundingBox.empty();
    for (const child of this.children) {
      bbox = bbox.union(child.getGlobalBBox());
    }
    return bbox;
  }

  renderDOM(): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    this.applyCommonAttributes(el);

    if (this.href) {
      el.setAttribute('href', this.href);
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.href);
    }
    if (this.target) el.setAttribute('target', this.target);
    if (this.download) el.setAttribute('download', this.download);
    if (this.rel) el.setAttribute('rel', this.rel);

    for (const child of this.children) {
      el.appendChild(child.renderDOM());
    }
    return el;
  }

  clone(): AnchorNode {
    const copy = new AnchorNode(this.href, this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.target = this.target;
    copy.download = this.download;
    copy.rel = this.rel;
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
