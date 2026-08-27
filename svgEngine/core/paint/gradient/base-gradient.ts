// svgEngine/core/paint/gradient/base-gradient.ts
import { IPaint, PaintKind } from '../ipaint';
import { GradientStop } from './gradient-stop';
import { Color } from '../color';

export type GradientUnits = 'userSpaceOnUse' | 'objectBoundingBox';
export type SpreadMethod = 'pad' | 'reflect' | 'repeat';

export abstract class BaseGradientPaint implements IPaint {
  public abstract readonly kind: PaintKind;
  public id: string;
  public stops: GradientStop[] = [];
  public gradientUnits: GradientUnits = 'objectBoundingBox';
  public spreadMethod: SpreadMethod = 'pad';
  public gradientTransform?: string;

  constructor(id?: string) {
    this.id = id || `grad_${Math.random().toString(36).substring(2, 9)}`;
  }

  addStop(offset: number, color: string | Color, opacity: number = 1): this {
    const col = typeof color === 'string' ? Color.fromString(color) : color;
    this.stops.push(new GradientStop(offset, col, opacity));
    return this;
  }

  toSVGValue(): string {
    return `url(#${this.id})`;
  }

  isVisible(): boolean {
    return this.stops.length > 0;
  }

  abstract renderDefDOM(): SVGElement;
  abstract clone(): BaseGradientPaint;
}
