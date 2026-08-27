// svgEngine/ast/nodes/marker-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export class MarkerNode extends ASTNode {
  readonly type: ASTNodeType = 'marker';
  public markerWidth: number = 3;
  public markerHeight: number = 3;
  public refX: number = 0;
  public refY: number = 0;
  public orient: string = 'auto';
  public markerUnits: string = 'strokeWidth';
  public viewBox?: BoundingBox;

  constructor(id?: string) {
    super(id);
  }

  getLocalBBox(): BoundingBox {
    return new BoundingBox(0, 0, this.markerWidth, this.markerHeight);
  }

  renderDOM(): SVGElement {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.id = this.id;
    marker.setAttribute('markerWidth', this.markerWidth.toString());
    marker.setAttribute('markerHeight', this.markerHeight.toString());
    marker.setAttribute('refX', this.refX.toString());
    marker.setAttribute('refY', this.refY.toString());
    marker.setAttribute('orient', this.orient);
    marker.setAttribute('markerUnits', this.markerUnits);

    if (this.viewBox) {
      marker.setAttribute(
        'viewBox',
        `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
      );
    }

    for (const child of this.children) {
      if (child.metadata.visible) {
        marker.appendChild(child.renderDOM());
      }
    }
    return marker;
  }

  clone(): MarkerNode {
    const copy = new MarkerNode(this.id);
    copy.markerWidth = this.markerWidth;
    copy.markerHeight = this.markerHeight;
    copy.refX = this.refX;
    copy.refY = this.refY;
    copy.orient = this.orient;
    copy.markerUnits = this.markerUnits;
    copy.viewBox = this.viewBox?.clone();
    copy.style = this.style.clone();
    for (const child of this.children) {
      copy.addChild(child.clone());
    }
    return copy;
  }
}
