// svgEngine/core/types/common.types.ts

export type SVGUnitType = 'px' | '%' | 'em' | 'rem' | 'pt' | 'pc' | 'mm' | 'cm' | 'in' | 'number';

export interface ViewportContext {
  viewBoxWidth: number;
  viewBoxHeight: number;
  fontSize: number;
  rootFontSize: number;
}

export const DEFAULT_VIEWPORT_CONTEXT: ViewportContext = {
  viewBoxWidth: 800,
  viewBoxHeight: 600,
  fontSize: 16,
  rootFontSize: 16,
};
