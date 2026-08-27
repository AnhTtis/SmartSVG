// svgEngine/core/style/style.ts
import { IPaint } from '../paint/ipaint';
import { SolidColorPaint } from '../paint/solid-paint';
import { Stroke } from './stroke';
import { FontStyle } from './font-style';

export type FillRule = 'nonzero' | 'evenodd';
export type ClipRule = 'nonzero' | 'evenodd';
export type VectorEffect = 'none' | 'non-scaling-stroke' | 'non-scaling-size' | 'non-rotation' | 'fixed-position';

export class Style {
  public fill: IPaint;
  public fillOpacity: number = 1;
  public fillRule: FillRule = 'nonzero';
  public clipRule: ClipRule = 'nonzero';
  public stroke: Stroke;
  public opacity: number = 1;
  public font: FontStyle;
  public clipPathUrl?: string;
  public maskUrl?: string;
  public filterUrl?: string;
  public markerStartUrl?: string;
  public markerMidUrl?: string;
  public markerEndUrl?: string;
  public vectorEffect?: VectorEffect;
  public mixBlendMode?: string;
  public isolation?: string;
  public colorInterpolation?: string;
  public colorInterpolationFilters?: string;

  constructor(
    fill?: IPaint,
    stroke?: Stroke,
    opacity: number = 1,
    font?: FontStyle
  ) {
    this.fill = fill || new SolidColorPaint('#000000');
    this.stroke = stroke || new Stroke();
    this.opacity = opacity;
    this.font = font || new FontStyle();
  }

  clone(): Style {
    const copy = new Style(this.fill.clone(), this.stroke.clone(), this.opacity, this.font.clone());
    copy.fillOpacity = this.fillOpacity;
    copy.fillRule = this.fillRule;
    copy.clipRule = this.clipRule;
    copy.clipPathUrl = this.clipPathUrl;
    copy.maskUrl = this.maskUrl;
    copy.filterUrl = this.filterUrl;
    copy.markerStartUrl = this.markerStartUrl;
    copy.markerMidUrl = this.markerMidUrl;
    copy.markerEndUrl = this.markerEndUrl;
    copy.vectorEffect = this.vectorEffect;
    copy.mixBlendMode = this.mixBlendMode;
    copy.isolation = this.isolation;
    copy.colorInterpolation = this.colorInterpolation;
    copy.colorInterpolationFilters = this.colorInterpolationFilters;
    return copy;
  }
}
