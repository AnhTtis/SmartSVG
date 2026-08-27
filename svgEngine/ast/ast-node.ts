// svgEngine/ast/ast-node.ts
import { Matrix2D } from '../core/math/matrix2d';
import { BoundingBox } from '../core/math/bbox';
import { TransformList } from '../core/transforms/transform-list';
import { Style } from '../core/style/style';

export type ASTNodeType =
  | 'svg'
  | 'g'
  | 'defs'
  | 'use'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'path'
  | 'text'
  | 'tspan'
  | 'textPath'
  | 'image'
  | 'symbol'
  | 'clipPath'
  | 'mask'
  | 'pattern'
  | 'marker'
  | 'foreignObject'
  | 'filter'
  | 'a';

export interface NodeMetadata {
  name: string;
  classes: string[];
  customAttributes: Record<string, string>;
  visible: boolean;
  locked: boolean;
}

export abstract class ASTNode {
  public id: string;
  public abstract readonly type: ASTNodeType;
  public transforms: TransformList = new TransformList();
  public style: Style = new Style();
  public metadata: NodeMetadata;
  public parent: ASTNode | null = null;
  public children: ASTNode[] = [];

  constructor(id?: string) {
    this.id = id || `node_${Math.random().toString(36).substring(2, 9)}`;
    this.metadata = {
      name: this.id,
      classes: [],
      customAttributes: {},
      visible: true,
      locked: false,
    };
  }

  get localMatrix(): Matrix2D {
    return this.transforms.toCombinedMatrix();
  }

  getGlobalTransform(): Matrix2D {
    if (this.parent) {
      return this.parent.getGlobalTransform().multiply(this.localMatrix);
    }
    return this.localMatrix;
  }

  addChild(child: ASTNode): void {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: ASTNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }

  abstract getLocalBBox(): BoundingBox;

  getGlobalBBox(): BoundingBox {
    return this.getLocalBBox().transform(this.getGlobalTransform());
  }

  abstract renderDOM(): SVGElement;
  abstract clone(): ASTNode;

  /** Helper gán các thuộc tính chung vào SVGElement */
  protected applyCommonAttributes(el: SVGElement): void {
    el.id = this.id;
    if (this.metadata.classes.length > 0) {
      el.setAttribute('class', this.metadata.classes.join(' '));
    }

    if (this.transforms.items.length > 0) {
      el.setAttribute('transform', this.transforms.toSVGString());
    }

    // Styles - Fill
    if (this.style.fill.isVisible()) {
      el.setAttribute('fill', this.style.fill.toSVGValue());
      if (this.style.fillOpacity < 1) {
        el.setAttribute('fill-opacity', this.style.fillOpacity.toString());
      }
    } else {
      el.setAttribute('fill', 'none');
    }

    if (this.style.fillRule !== 'nonzero') {
      el.setAttribute('fill-rule', this.style.fillRule);
    }

    // Styles - Stroke
    if (this.style.stroke.paint.isVisible()) {
      el.setAttribute('stroke', this.style.stroke.paint.toSVGValue());
      el.setAttribute('stroke-width', this.style.stroke.width.toString());
      if (this.style.stroke.lineCap !== 'butt') el.setAttribute('stroke-linecap', this.style.stroke.lineCap);
      if (this.style.stroke.lineJoin !== 'miter') el.setAttribute('stroke-linejoin', this.style.stroke.lineJoin);
      if (this.style.stroke.miterLimit !== 4) el.setAttribute('stroke-miterlimit', this.style.stroke.miterLimit.toString());
      if (this.style.stroke.dashArray && this.style.stroke.dashArray.length > 0) {
        el.setAttribute('stroke-dasharray', this.style.stroke.dashArray.join(','));
      }
      if (this.style.stroke.dashOffset !== 0) {
        el.setAttribute('stroke-dashoffset', this.style.stroke.dashOffset.toString());
      }
      if (this.style.stroke.opacity < 1) el.setAttribute('stroke-opacity', this.style.stroke.opacity.toString());
    } else {
      el.setAttribute('stroke', 'none');
    }

    // Opacity
    if (this.style.opacity < 1) {
      el.setAttribute('opacity', this.style.opacity.toString());
    }

    // Clip & Mask
    if (this.style.clipPathUrl) {
      el.setAttribute('clip-path', `url(#${this.style.clipPathUrl})`);
    }
    if (this.style.clipRule !== 'nonzero') {
      el.setAttribute('clip-rule', this.style.clipRule);
    }
    if (this.style.maskUrl) {
      el.setAttribute('mask', `url(#${this.style.maskUrl})`);
    }

    // Filter
    if (this.style.filterUrl) {
      el.setAttribute('filter', `url(#${this.style.filterUrl})`);
    }

    // Markers
    if (this.style.markerStartUrl) el.setAttribute('marker-start', `url(#${this.style.markerStartUrl})`);
    if (this.style.markerMidUrl) el.setAttribute('marker-mid', `url(#${this.style.markerMidUrl})`);
    if (this.style.markerEndUrl) el.setAttribute('marker-end', `url(#${this.style.markerEndUrl})`);

    // Vector effect & Effects
    if (this.style.vectorEffect && this.style.vectorEffect !== 'none') {
      el.setAttribute('vector-effect', this.style.vectorEffect);
    }
    if (this.style.mixBlendMode) {
      el.setAttribute('style', `${el.getAttribute('style') || ''}; mix-blend-mode: ${this.style.mixBlendMode}`);
    }
    if (this.style.isolation) {
      el.setAttribute('style', `${el.getAttribute('style') || ''}; isolation: ${this.style.isolation}`);
    }

    // Custom attributes
    for (const [k, v] of Object.entries(this.metadata.customAttributes)) {
      el.setAttribute(k, v);
    }
  }
}
