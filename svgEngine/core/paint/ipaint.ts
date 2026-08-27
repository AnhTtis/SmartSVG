// svgEngine/core/paint/ipaint.ts

export type PaintKind =
  | 'none'
  | 'current-color'
  | 'solid'
  | 'linear-gradient'
  | 'radial-gradient'
  | 'pattern';

export interface IPaint {
  readonly kind: PaintKind;
  toSVGValue(): string;
  clone(): IPaint;
  isVisible(): boolean;
}
