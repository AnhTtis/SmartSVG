// svgEngine/core/path/commands/arc-command.ts
import { PathCommand, PathCommandType } from '../path-command';
import { Vector2D } from '../../math/vector2d';
import { Matrix2D } from '../../math/matrix2d';
import { BoundingBox } from '../../math/bbox';
import { CubicBezierCommand } from './cubic-command';

export class ArcCommand extends PathCommand {
  readonly type: PathCommandType;
  public isRelative: boolean;

  constructor(
    public rx: number,
    public ry: number,
    public xAxisRotation: number,
    public largeArcFlag: number,
    public sweepFlag: number,
    public end: Vector2D,
    isRelative: boolean = false
  ) {
    super();
    this.isRelative = isRelative;
    this.type = isRelative ? 'a' : 'A';
  }

  toAbsolute(currentPoint: Vector2D): ArcCommand {
    if (!this.isRelative) return this.clone();
    return new ArcCommand(
      this.rx,
      this.ry,
      this.xAxisRotation,
      this.largeArcFlag,
      this.sweepFlag,
      currentPoint.add(this.end),
      false
    );
  }

  toSVGString(): string {
    return `${this.type} ${this.rx} ${this.ry} ${this.xAxisRotation} ${this.largeArcFlag} ${this.sweepFlag} ${this.end.x} ${this.end.y}`;
  }

  getEndPoint(currentPoint: Vector2D): Vector2D {
    return this.isRelative ? currentPoint.add(this.end) : this.end.clone();
  }

  /**
   * Chuyển đổi Elliptical Arc thành chuỗi các Cubic Bézier Curves (W3C F.6 Spec)
   */
  toCubicBeziers(currentPoint: Vector2D): CubicBezierCommand[] {
    const endPoint = this.getEndPoint(currentPoint);
    let rx = Math.abs(this.rx);
    let ry = Math.abs(this.ry);

    // Nếu điểm đầu trùng điểm cuối hoặc bán kính = 0 -> không sinh đường cong
    if ((currentPoint.x === endPoint.x && currentPoint.y === endPoint.y) || rx === 0 || ry === 0) {
      return [];
    }

    const phi = (this.xAxisRotation * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // 1. Tính (x1', y1')
    const dx = (currentPoint.x - endPoint.x) / 2;
    const dy = (currentPoint.y - endPoint.y) / 2;
    const x1Prime = cosPhi * dx + sinPhi * dy;
    const y1Prime = -sinPhi * dx + cosPhi * dy;

    // 2. Kiểm tra tỉ lệ bán kính
    const lambda = (x1Prime * x1Prime) / (rx * rx) + (y1Prime * y1Prime) / (ry * ry);
    if (lambda > 1) {
      const sqrtLambda = Math.sqrt(lambda);
      rx *= sqrtLambda;
      ry *= sqrtLambda;
    }

    // 3. Tính tâm (cx', cy')
    const rxSq = rx * rx;
    const rySq = ry * ry;
    const x1PrimeSq = x1Prime * x1Prime;
    const y1PrimeSq = y1Prime * y1Prime;

    const num = rxSq * rySq - rxSq * y1PrimeSq - rySq * x1PrimeSq;
    const den = rxSq * y1PrimeSq + rySq * x1PrimeSq;
    const factor = (this.largeArcFlag !== this.sweepFlag ? 1 : -1) * Math.sqrt(Math.max(0, num / den));

    const cxPrime = factor * ((rx * y1Prime) / ry);
    const cyPrime = factor * ((-ry * x1Prime) / rx);

    // 4. Tính tâm (cx, cy)
    const cx = cosPhi * cxPrime - sinPhi * cyPrime + (currentPoint.x + endPoint.x) / 2;
    const cy = sinPhi * cxPrime + cosPhi * cyPrime + (currentPoint.y + endPoint.y) / 2;

    // 5. Tính góc bắt đầu và góc quét
    const vectorAngle = (u: Vector2D, v: Vector2D): number => {
      const dot = u.x * v.x + u.y * v.y;
      const len = Math.sqrt((u.x * u.x + u.y * u.y) * (v.x * v.x + v.y * v.y));
      let ang = Math.acos(Math.max(-1, Math.min(1, dot / len)));
      if (u.x * v.y - u.y * v.x < 0) ang = -ang;
      return ang;
    };

    const v1 = new Vector2D((x1Prime - cxPrime) / rx, (y1Prime - cyPrime) / ry);
    const v2 = new Vector2D((-x1Prime - cxPrime) / rx, (-y1Prime - cyPrime) / ry);

    let theta1 = vectorAngle(new Vector2D(1, 0), v1);
    let deltaTheta = vectorAngle(v1, v2);

    if (this.sweepFlag === 0 && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
    if (this.sweepFlag === 1 && deltaTheta < 0) deltaTheta += 2 * Math.PI;

    // 6. Chia arc thành các đoạn nhỏ (mỗi đoạn <= PI/2) và xấp xỉ bằng Cubic Bézier
    const segments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
    const delta = deltaTheta / segments;
    const alpha = (4 / 3) * Math.tan(delta / 4);

    const beziers: CubicBezierCommand[] = [];
    let currentTheta = theta1;
    let startP = currentPoint.clone();

    for (let i = 0; i < segments; i++) {
      const nextTheta = currentTheta + delta;
      const cosT1 = Math.cos(currentTheta), sinT1 = Math.sin(currentTheta);
      const cosT2 = Math.cos(nextTheta), sinT2 = Math.sin(nextTheta);

      // Điểm tiếp theo trên elip
      const nextP = i === segments - 1
        ? endPoint.clone()
        : new Vector2D(
            cx + rx * cosT2 * cosPhi - ry * sinT2 * sinPhi,
            cy + rx * cosT2 * sinPhi + ry * sinT2 * cosPhi
          );

      // Vector đạo hàm
      const dx1 = -rx * sinT1 * cosPhi - ry * cosT1 * sinPhi;
      const dy1 = -rx * sinT1 * sinPhi + ry * cosT1 * cosPhi;
      const dx2 = -rx * sinT2 * cosPhi - ry * cosT2 * sinPhi;
      const dy2 = -rx * sinT2 * sinPhi + ry * cosT2 * cosPhi;

      const cp1 = new Vector2D(startP.x + alpha * dx1, startP.y + alpha * dy1);
      const cp2 = new Vector2D(nextP.x - alpha * dx2, nextP.y - alpha * dy2);

      beziers.push(new CubicBezierCommand(cp1, cp2, nextP, false));
      startP = nextP;
      currentTheta = nextTheta;
    }

    return beziers;
  }

  /**
   * Tính Bounding Box chính xác bằng việc phân rã arc thành các Cubic Bézier
   */
  getBounds(currentPoint: Vector2D): BoundingBox {
    const beziers = this.toCubicBeziers(currentPoint);
    if (beziers.length === 0) {
      const end = this.getEndPoint(currentPoint);
      return BoundingBox.fromPoints([currentPoint, end]);
    }

    let bbox = beziers[0].getBounds(currentPoint);
    let cur = beziers[0].end;
    for (let i = 1; i < beziers.length; i++) {
      bbox = bbox.union(beziers[i].getBounds(cur));
      cur = beziers[i].end;
    }
    return bbox;
  }

  transform(matrix: Matrix2D): ArcCommand {
    const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
    const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);
    return new ArcCommand(
      this.rx * scaleX,
      this.ry * scaleY,
      this.xAxisRotation,
      this.largeArcFlag,
      this.sweepFlag,
      matrix.transformPoint(this.end),
      this.isRelative
    );
  }

  clone(): ArcCommand {
    return new ArcCommand(
      this.rx,
      this.ry,
      this.xAxisRotation,
      this.largeArcFlag,
      this.sweepFlag,
      this.end.clone(),
      this.isRelative
    );
  }
}
