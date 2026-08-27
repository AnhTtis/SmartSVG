// svgEngine/core/style/font-style.ts

export type TextAnchor = 'start' | 'middle' | 'end';
export type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | number;
export type FontStyleType = 'normal' | 'italic' | 'oblique';
export type DominantBaseline =
  | 'auto'
  | 'text-bottom'
  | 'alphabetic'
  | 'ideographic'
  | 'middle'
  | 'central'
  | 'mathematical'
  | 'hanging'
  | 'text-top';

export class FontStyle {
  constructor(
    public fontFamily: string = 'sans-serif',
    public fontSize: number = 14,
    public fontWeight: FontWeight = 'normal',
    public fontStyle: FontStyleType = 'normal',
    public textAnchor: TextAnchor = 'start',
    public letterSpacing: number = 0,
    public dominantBaseline?: DominantBaseline,
    public wordSpacing?: number,
    public textDecoration?: string
  ) {}

  clone(): FontStyle {
    return new FontStyle(
      this.fontFamily,
      this.fontSize,
      this.fontWeight,
      this.fontStyle,
      this.textAnchor,
      this.letterSpacing,
      this.dominantBaseline,
      this.wordSpacing,
      this.textDecoration
    );
  }
}
