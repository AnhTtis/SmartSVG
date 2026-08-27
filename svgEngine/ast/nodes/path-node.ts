// svgEngine/ast/nodes/path-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';
import { PathData } from '../../core/path/path-data';

export class PathNode extends ASTNode {
  readonly type: ASTNodeType = 'path';
  public pathData: PathData;

  constructor(pathData?: PathData, id?: string) {
    super(id);
    this.pathData = pathData || new PathData();
  }

  getLocalBBox(): BoundingBox {
    return this.pathData.getBounds();
  }

  renderDOM(): SVGElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.applyCommonAttributes(path);

    path.setAttribute('d', this.pathData.toSVGString());
    if (this.style.fillRule !== 'nonzero') {
      path.setAttribute('fill-rule', this.style.fillRule);
    }

    return path;
  }

  clone(): PathNode {
    const copy = new PathNode(this.pathData.clone(), this.id);
    copy.transforms = this.transforms.clone();
    copy.style = this.style.clone();
    copy.metadata = { ...this.metadata, classes: [...this.metadata.classes] };
    return copy;
  }
}
