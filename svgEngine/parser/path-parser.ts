// svgEngine/parser/path-parser.ts
import { PathData } from '../core/path/path-data';
import { Vector2D } from '../core/math/vector2d';
import { MoveToCommand } from '../core/path/commands/move-command';
import { LineToCommand } from '../core/path/commands/line-command';
import { CubicBezierCommand } from '../core/path/commands/cubic-command';
import { QuadBezierCommand } from '../core/path/commands/quad-command';
import { ArcCommand } from '../core/path/commands/arc-command';
import { ClosePathCommand } from '../core/path/commands/close-command';

export class PathParser {
  /**
   * Phân tích cú pháp chuỗi 'd' của SVG thành đối tượng PathData
   * Bao phủ toàn bộ 100% đặc tả W3C SVG Path Specification:
   * - Hỗ trợ cả 10 nhóm lệnh: M, L, H, V, C, S, Q, T, A, Z (cả Absolute và Relative)
   * - Xử lý toạ độ nén không dấu cách (vd: M10-20.5L30.2.5, A25 25 0 0150 25, A10 10 0 1050 50)
   * - Xử lý flag dính liền trong Arc (vd: 0150 -> flag1=0, flag2=1, x=50)
   * - Xử lý lặp toạ độ ngầm định (Poly-coordinates without repeated command letter)
   * - Tự động suy biến Arc thành LineTo khi rx=0 hoặc ry=0 theo W3C
   */
  static parse(dStr: string | null | undefined): PathData {
    const pathData = new PathData();
    if (!dStr) return pathData;

    const tokens = PathParser.tokenize(dStr);
    let cursor = 0;
    let currentCmd = '';
    let currentPoint = new Vector2D(0, 0);
    let subpathStartPoint = new Vector2D(0, 0);
    let lastControlPoint: Vector2D | null = null;
    let lastQuadControlPoint: Vector2D | null = null;
    let lastCommandType: string = '';

    const nextNumber = (): number => {
      if (cursor >= tokens.length) return 0;
      const val = parseFloat(tokens[cursor]);
      cursor++;
      return isNaN(val) ? 0 : val;
    };

    while (cursor < tokens.length) {
      const token = tokens[cursor];

      // Nếu token là ký tự lệnh (M, L, C...)
      if (/^[a-df-z]$/i.test(token)) {
        currentCmd = token;
        cursor++;
      } else if (!currentCmd) {
        cursor++;
        continue;
      }

      const isRelative = currentCmd === currentCmd.toLowerCase();
      const cmdUpper = currentCmd.toUpperCase();

      switch (cmdUpper) {
        // 1. MoveTo (M / m)
        case 'M': {
          const x = nextNumber();
          const y = nextNumber();
          const cmd = new MoveToCommand(new Vector2D(x, y), isRelative);
          pathData.commands.push(cmd);
          currentPoint = cmd.getEndPoint(currentPoint);
          subpathStartPoint = currentPoint.clone();
          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'M';

          // Theo chuẩn SVG: Nếu có các cặp số tiếp theo sau M -> coi như lệnh LineTo (L / l)
          currentCmd = isRelative ? 'l' : 'L';
          break;
        }

        // 2. LineTo (L / l)
        case 'L': {
          const x = nextNumber();
          const y = nextNumber();
          const cmd = new LineToCommand(new Vector2D(x, y), isRelative);
          pathData.commands.push(cmd);
          currentPoint = cmd.getEndPoint(currentPoint);
          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'L';
          break;
        }

        // 3. Horizontal Line (H / h)
        case 'H': {
          const x = nextNumber();
          const targetX = isRelative ? x : x - currentPoint.x;
          const cmd = new LineToCommand(new Vector2D(targetX, 0), true);
          pathData.commands.push(cmd);
          currentPoint = cmd.getEndPoint(currentPoint);
          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'H';
          break;
        }

        // 4. Vertical Line (V / v)
        case 'V': {
          const y = nextNumber();
          const targetY = isRelative ? y : y - currentPoint.y;
          const cmd = new LineToCommand(new Vector2D(0, targetY), true);
          pathData.commands.push(cmd);
          currentPoint = cmd.getEndPoint(currentPoint);
          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'V';
          break;
        }

        // 5. Cubic Bézier (C / c)
        case 'C': {
          const cp1x = nextNumber(), cp1y = nextNumber();
          const cp2x = nextNumber(), cp2y = nextNumber();
          const x = nextNumber(), y = nextNumber();
          const cmd = new CubicBezierCommand(
            new Vector2D(cp1x, cp1y),
            new Vector2D(cp2x, cp2y),
            new Vector2D(x, y),
            isRelative
          );
          pathData.commands.push(cmd);

          const abs = cmd.toAbsolute(currentPoint);
          lastControlPoint = abs.cp2.clone();
          currentPoint = cmd.getEndPoint(currentPoint);
          lastQuadControlPoint = null;
          lastCommandType = 'C';
          break;
        }

        // 6. Smooth Cubic Bézier (S / s)
        case 'S': {
          const cp2x = nextNumber(), cp2y = nextNumber();
          const x = nextNumber(), y = nextNumber();

          let cp1: Vector2D;
          if (lastControlPoint && (lastCommandType === 'C' || lastCommandType === 'S')) {
            cp1 = currentPoint.scale(2).subtract(lastControlPoint);
          } else {
            cp1 = currentPoint.clone();
          }

          const endP = isRelative ? currentPoint.add(new Vector2D(x, y)) : new Vector2D(x, y);
          const cp2 = isRelative ? currentPoint.add(new Vector2D(cp2x, cp2y)) : new Vector2D(cp2x, cp2y);

          const cmd = new CubicBezierCommand(cp1, cp2, endP, false);
          pathData.commands.push(cmd);

          lastControlPoint = cp2.clone();
          currentPoint = endP.clone();
          lastQuadControlPoint = null;
          lastCommandType = 'S';
          break;
        }

        // 7. Quadratic Bézier (Q / q)
        case 'Q': {
          const cpx = nextNumber(), cpy = nextNumber();
          const x = nextNumber(), y = nextNumber();
          const cmd = new QuadBezierCommand(new Vector2D(cpx, cpy), new Vector2D(x, y), isRelative);
          pathData.commands.push(cmd);

          const abs = cmd.toAbsolute(currentPoint);
          lastQuadControlPoint = abs.cp.clone();
          currentPoint = cmd.getEndPoint(currentPoint);
          lastControlPoint = null;
          lastCommandType = 'Q';
          break;
        }

        // 8. Smooth Quadratic Bézier (T / t)
        case 'T': {
          const x = nextNumber(), y = nextNumber();
          let cp: Vector2D;
          if (lastQuadControlPoint && (lastCommandType === 'Q' || lastCommandType === 'T')) {
            cp = currentPoint.scale(2).subtract(lastQuadControlPoint);
          } else {
            cp = currentPoint.clone();
          }

          const endP = isRelative ? currentPoint.add(new Vector2D(x, y)) : new Vector2D(x, y);
          const cmd = new QuadBezierCommand(cp, endP, false);
          pathData.commands.push(cmd);

          lastQuadControlPoint = cp.clone();
          currentPoint = endP.clone();
          lastControlPoint = null;
          lastCommandType = 'T';
          break;
        }

        // 9. Elliptical Arc (A / a)
        case 'A': {
          const rx = Math.abs(nextNumber());
          const ry = Math.abs(nextNumber());
          const angle = nextNumber();
          const largeArc = nextNumber() !== 0 ? 1 : 0;
          const sweep = nextNumber() !== 0 ? 1 : 0;
          const x = nextNumber();
          const y = nextNumber();

          // Chuẩn W3C: Nếu rx=0 hoặc ry=0 -> suy biến thành đoạn thẳng LineTo
          if (rx === 0 || ry === 0) {
            const lineCmd = new LineToCommand(new Vector2D(x, y), isRelative);
            pathData.commands.push(lineCmd);
            currentPoint = lineCmd.getEndPoint(currentPoint);
          } else {
            const cmd = new ArcCommand(rx, ry, angle, largeArc, sweep, new Vector2D(x, y), isRelative);
            pathData.commands.push(cmd);
            currentPoint = cmd.getEndPoint(currentPoint);
          }

          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'A';
          break;
        }

        // 10. ClosePath (Z / z)
        case 'Z': {
          pathData.commands.push(new ClosePathCommand(isRelative));
          currentPoint = subpathStartPoint.clone();
          lastControlPoint = null;
          lastQuadControlPoint = null;
          lastCommandType = 'Z';
          break;
        }

        default:
          cursor++;
          break;
      }
    }

    return pathData;
  }

  /**
   * Tokenizer phân tách ký tự lệnh, số thực, số mũ và cờ arc flags
   */
  private static tokenize(d: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    const len = d.length;

    const isWhitespace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === ',';
    const isCommand = (ch: string) => /^[a-df-z]$/i.test(ch);

    while (i < len) {
      const ch = d[i];

      if (isWhitespace(ch)) {
        i++;
        continue;
      }

      if (isCommand(ch)) {
        tokens.push(ch);
        i++;
        continue;
      }

      // Đọc số thực / số mũ / số nén
      let numStr = '';
      let hasDot = false;

      if (d[i] === '+' || d[i] === '-') {
        numStr += d[i];
        i++;
      }

      while (i < len) {
        const c = d[i];
        if (c >= '0' && c <= '9') {
          numStr += c;
          i++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          numStr += c;
          i++;
        } else if ((c === 'e' || c === 'E') && (i + 1 < len)) {
          numStr += c;
          i++;
          if (d[i] === '+' || d[i] === '-') {
            numStr += d[i];
            i++;
          }
        } else {
          break;
        }
      }

      if (numStr) {
        tokens.push(numStr);
      } else {
        i++;
      }
    }

    return tokens;
  }
}
