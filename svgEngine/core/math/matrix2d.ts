// svgEngine/core/math/matrix2d.ts
import { Vector2D } from './vector2d';

export class Matrix2D {
  constructor(
    public a: number = 1, // Scale X / Cos(θ)
    public b: number = 0, // Skew Y / Sin(θ)
    public c: number = 0, // Skew X / -Sin(θ)
    public d: number = 1, // Scale Y / Cos(θ)
    public e: number = 0, // Translate X
    public f: number = 0  // Translate Y
  ) {}

  static identity(): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, 0, 0);
  }

  static translation(tx: number, ty: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, tx, ty);
  }

  static scaling(sx: number, sy: number, cx: number = 0, cy: number = 0): Matrix2D {
    if (cx === 0 && cy === 0) {
      return new Matrix2D(sx, 0, 0, sy, 0, 0);
    }
    return Matrix2D.translation(cx, cy)
      .multiply(new Matrix2D(sx, 0, 0, sy, 0, 0))
      .multiply(Matrix2D.translation(-cx, -cy));
  }

  static rotation(deg: number, cx: number = 0, cy: number = 0): Matrix2D {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    if (cx === 0 && cy === 0) {
      return new Matrix2D(cos, sin, -sin, cos, 0, 0);
    }
    return Matrix2D.translation(cx, cy)
      .multiply(new Matrix2D(cos, sin, -sin, cos, 0, 0))
      .multiply(Matrix2D.translation(-cx, -cy));
  }

  static skewX(deg: number): Matrix2D {
    const rad = (deg * Math.PI) / 180;
    return new Matrix2D(1, 0, Math.tan(rad), 1, 0, 0);
  }

  static skewY(deg: number): Matrix2D {
    const rad = (deg * Math.PI) / 180;
    return new Matrix2D(1, Math.tan(rad), 0, 1, 0, 0);
  }

  multiply(m: Matrix2D): Matrix2D {
    return new Matrix2D(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f
    );
  }

  transformPoint(p: Vector2D): Vector2D {
    return new Vector2D(
      this.a * p.x + this.c * p.y + this.e,
      this.b * p.x + this.d * p.y + this.f
    );
  }

  determinant(): number {
    return this.a * this.d - this.b * this.c;
  }

  invert(): Matrix2D | null {
    const det = this.determinant();
    if (Math.abs(det) < 1e-12) return null;

    const invDet = 1 / det;
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.f - this.d * this.e) * invDet,
      (this.b * this.e - this.a * this.f) * invDet
    );
  }

  isIdentity(epsilon: number = 1e-6): boolean {
    return (
      Math.abs(this.a - 1) < epsilon &&
      Math.abs(this.b) < epsilon &&
      Math.abs(this.c) < epsilon &&
      Math.abs(this.d - 1) < epsilon &&
      Math.abs(this.e) < epsilon &&
      Math.abs(this.f) < epsilon
    );
  }

  toSVGString(): string {
    return `matrix(${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f})`;
  }

  clone(): Matrix2D {
    return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f);
  }
}
