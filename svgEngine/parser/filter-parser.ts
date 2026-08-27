// svgEngine/parser/filter-parser.ts
import { FilterNode, FilterPrimitive, FilterUnits, PrimitiveUnits } from '../ast/nodes/filter-node';

export class FilterParser {
  static parseFilter(el: SVGElement): FilterNode | null {
    const id = el.id || el.getAttribute('id');
    if (!id) return null;

    const filterNode = new FilterNode(id);
    const x = el.getAttribute('x');
    const y = el.getAttribute('y');
    const w = el.getAttribute('width');
    const h = el.getAttribute('height');
    const fUnits = el.getAttribute('filterUnits');
    const pUnits = el.getAttribute('primitiveUnits');

    if (x) filterNode.x = x;
    if (y) filterNode.y = y;
    if (w) filterNode.width = w;
    if (h) filterNode.height = h;
    if (fUnits === 'userSpaceOnUse' || fUnits === 'objectBoundingBox') {
      filterNode.filterUnits = fUnits as FilterUnits;
    }
    if (pUnits === 'userSpaceOnUse' || pUnits === 'objectBoundingBox') {
      filterNode.primitiveUnits = pUnits as PrimitiveUnits;
    }

    const parsePrimitiveElement = (child: Element): FilterPrimitive => {
      const tag = child.tagName.toLowerCase();
      const attributes: Record<string, string> = {};
      for (let i = 0; i < child.attributes.length; i++) {
        const attr = child.attributes[i];
        attributes[attr.name] = attr.value;
      }

      const primitive: FilterPrimitive = { tag, attributes };
      if (child.children.length > 0) {
        primitive.children = Array.from(child.children).map((c) => parsePrimitiveElement(c));
      }
      return primitive;
    };

    for (const child of Array.from(el.children)) {
      filterNode.primitives.push(parsePrimitiveElement(child));
    }

    return filterNode;
  }
}
