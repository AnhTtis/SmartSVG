// svgEngine/core/style/stroke.ts
import { IPaint } from '../paint/ipaint';
import { NonePaint } from '../paint/none-paint';

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

export class Stroke {
  constructor(
    public paint: IPaint = new NonePaint(),
    public width: number = 1,
    public lineCap: LineCap = 'butt',
    public lineJoin: LineJoin = 'miter',
    public miterLimit: number = 4,
    public dashArray?: number[],
    public dashOffset: number = 0,
    public opacity: number = 1
  ) {}

  clone(): Stroke {
    return new Stroke(
      this.paint.clone(),
      this.width,
      this.lineCap,
      this.lineJoin,
      this.miterLimit,
      this.dashArray ? [...this.dashArray] : undefined,
      this.dashOffset,
      this.opacity
    );
  }
}
