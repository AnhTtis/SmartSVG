// svgEngine/ast/nodes/filter-node.ts
import { ASTNode, ASTNodeType } from '../ast-node';
import { BoundingBox } from '../../core/math/bbox';

export interface FilterPrimitive {
  tag: string;
  attributes: Record<string, string>;
  children?: FilterPrimitive[];
}

export type FilterUnits = 'userSpaceOnUse' | 'objectBoundingBox';
export type PrimitiveUnits = 'userSpaceOnUse' | 'objectBoundingBox';

export class FilterNode extends ASTNode {
  readonly type: ASTNodeType = 'filter';
  public x: string = '-10%';
  public y: string = '-10%';
  public width: string = '120%';
  public height: string = '120%';
  public filterUnits: FilterUnits = 'objectBoundingBox';
  public primitiveUnits: PrimitiveUnits = 'userSpaceOnUse';
  public primitives: FilterPrimitive[] = [];

  constructor(id?: string) {
    super(id);
  }

  addPrimitive(tag: string, attributes: Record<string, string> = {}, children?: FilterPrimitive[]): this {
    this.primitives.push({ tag, attributes, children });
    return this;
  }

  getLocalBBox(): BoundingBox {
    return BoundingBox.empty();
  }

  renderDOM(): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    el.id = this.id;
    el.setAttribute('x', this.x);
    el.setAttribute('y', this.y);
    el.setAttribute('width', this.width);
    el.setAttribute('height', this.height);
    el.setAttribute('filterUnits', this.filterUnits);
    el.setAttribute('primitiveUnits', this.primitiveUnits);

    const renderPrimitive = (p: FilterPrimitive): SVGElement => {
      const primEl = document.createElementNS('http://www.w3.org/2000/svg', p.tag);
      for (const [k, v] of Object.entries(p.attributes)) {
        primEl.setAttribute(k, v);
      }
      if (p.children) {
        for (const child of p.children) {
          primEl.appendChild(renderPrimitive(child));
        }
      }
      return primEl;
    };

    for (const prim of this.primitives) {
      el.appendChild(renderPrimitive(prim));
    }

    return el;
  }

  clone(): FilterNode {
    const copy = new FilterNode(this.id);
    copy.x = this.x;
    copy.y = this.y;
    copy.width = this.width;
    copy.height = this.height;
    copy.filterUnits = this.filterUnits;
    copy.primitiveUnits = this.primitiveUnits;
    copy.primitives = JSON.parse(JSON.stringify(this.primitives));
    return copy;
  }
}
