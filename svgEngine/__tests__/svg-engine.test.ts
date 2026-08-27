// svgEngine/__tests__/svg-engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  Color,
  SVGParser,
  PathParser,
  SVGSerializer,
  Vector2D,
  Matrix2D,
  CubicBezierCommand,
  QuadBezierCommand,
  ArcCommand,
  LinearGradientPaint,
  RadialGradientPaint,
  GradientParser,
} from '../index';

describe('SmartSVG Engine Core Test Suite', () => {
  describe('Color Parser (W3C Standard)', () => {
    it('parses Hex 3, 4, 6, 8 digits', () => {
      const c1 = Color.fromString('#f00');
      expect(c1.r).toBe(255);
      expect(c1.g).toBe(0);
      expect(c1.b).toBe(0);

      const c2 = Color.fromString('#00ff0080');
      expect(c2.r).toBe(0);
      expect(c2.g).toBe(255);
      expect(c2.b).toBe(0);
      expect(c2.a).toBeCloseTo(0.5, 1);
    });

    it('parses 148 W3C named colors', () => {
      const c = Color.fromString('tomato');
      expect(c.toHex()).toBe('#ff6347');
      const c2 = Color.fromString('rebeccapurple');
      expect(c2.toHex()).toBe('#663399');
    });

    it('parses RGB and HSL functional notations', () => {
      const rgb = Color.fromString('rgb(255, 100, 50)');
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(100);
      expect(rgb.b).toBe(50);

      const hsl = Color.fromString('hsl(0, 100%, 50%)');
      expect(hsl.r).toBe(255);
      expect(hsl.g).toBe(0);
      expect(hsl.b).toBe(0);
    });
  });

  describe('Affine Matrix 2D Transformations', () => {
    it('performs translation and rotation around center', () => {
      const p = new Vector2D(10, 0);
      const rot = Matrix2D.rotation(90);
      const transformed = rot.transformPoint(p);
      expect(transformed.x).toBeCloseTo(0, 5);
      expect(transformed.y).toBeCloseTo(10, 5);
    });

    it('inverts non-singular matrices', () => {
      const m = Matrix2D.translation(50, 100).multiply(Matrix2D.scaling(2, 2));
      const inv = m.invert()!;
      expect(inv).not.toBeNull();
      const combined = m.multiply(inv);
      expect(combined.isIdentity()).toBe(true);
    });
  });

  describe('Path Commands & W3C Geometry', () => {
    it('calculates tight bounding boxes for Cubic Béziers', () => {
      const cubic = new CubicBezierCommand(
        new Vector2D(0, 100),
        new Vector2D(100, 100),
        new Vector2D(100, 0),
        false
      );
      const bounds = cubic.getBounds(new Vector2D(0, 0));
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(75);
    });

    it('converts Quad Bézier to Cubic Bézier', () => {
      const quad = new QuadBezierCommand(new Vector2D(50, 100), new Vector2D(100, 0), false);
      const cubic = quad.toCubicBezier(new Vector2D(0, 0));
      expect(cubic.cp1.x).toBeCloseTo(33.33, 1);
      expect(cubic.cp1.y).toBeCloseTo(66.67, 1);
    });

    it('parses elliptical arcs and converts to smooth cubic beziers', () => {
      const arc = new ArcCommand(25, 25, 0, 0, 1, new Vector2D(50, 0), false);
      const beziers = arc.toCubicBeziers(new Vector2D(0, 0));
      expect(beziers.length).toBeGreaterThan(0);
    });

    it('handles degenerate arcs with rx=0 or ry=0 by collapsing to empty bezier chain', () => {
      const degenArc = new ArcCommand(0, 25, 0, 0, 1, new Vector2D(50, 0), false);
      const beziers = degenArc.toCubicBeziers(new Vector2D(0, 0));
      expect(beziers.length).toBe(0);
    });

    it('parses complex compressed SVG path string', () => {
      const d = 'M10 20L30 40H50V60C10 10 20 20 30 30S50 50 60 60Q70 70 80 80T90 90A25 25 0 0 1 100 100Z';
      const pathData = PathParser.parse(d);
      expect(pathData.commands.length).toBe(10);
    });

    it('parses scientific notations and contiguous arc flags', () => {
      const d = 'M 1e-2 2e+2 A 25 25 0 0150 25';
      const pathData = PathParser.parse(d);
      expect(pathData.commands.length).toBe(2);
      const moveCmd = pathData.commands[0];
      expect(moveCmd.getEndPoint(new Vector2D(0, 0)).x).toBe(0.01);
      expect(moveCmd.getEndPoint(new Vector2D(0, 0)).y).toBe(200);
    });

    it('handles implicit line commands after MoveTo', () => {
      const d = 'M 10 10 20 20 30 30';
      const pathData = PathParser.parse(d);
      expect(pathData.commands.length).toBe(3);
      expect(pathData.commands[0].type).toBe('M');
      expect(pathData.commands[1].type).toBe('L');
      expect(pathData.commands[2].type).toBe('L');
    });

    it('reflects control points for smooth cubic S command', () => {
      const d = 'M 0 0 C 10 20 30 40 50 50 S 90 80 100 100';
      const pathData = PathParser.parse(d);
      expect(pathData.commands.length).toBe(3);
      const sCmd = pathData.commands[2] as CubicBezierCommand;
      // Last cp was (30, 40), currentPoint is (50, 50) -> reflected cp1 is 2*(50,50) - (30,40) = (70, 60)
      expect(sCmd.cp1.x).toBe(70);
      expect(sCmd.cp1.y).toBe(60);
    });
  });

  describe('Gradients & Multi-Hop Inheritance', () => {
    it('constructs linear and radial gradient DOM elements', () => {
      const linear = new LinearGradientPaint(0, 0, 1, 1, 'linear-1');
      linear.addStop(0, '#ff0000').addStop(1, '#0000ff');
      const el = linear.renderDefDOM();
      expect(el.tagName.toLowerCase()).toBe('lineargradient');
      expect(el.children.length).toBe(2);

      const radial = new RadialGradientPaint(0.5, 0.5, 0.5, 0.5, 0.5, 'radial-1');
      radial.addStop(0, '#ffffff').addStop(1, '#000000');
      const radEl = radial.renderDefDOM();
      expect(radEl.tagName.toLowerCase()).toBe('radialgradient');
    });

    it('resolves multi-hop gradient inheritance chain with stops and coordinates', () => {
      const div = document.createElement('div');
      div.innerHTML = `
        <svg>
          <defs>
            <linearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ff0000"/>
              <stop offset="100%" stop-color="#0000ff"/>
            </linearGradient>
            <linearGradient id="midGrad" href="#baseGrad" y2="100%" />
            <linearGradient id="childGrad" href="#midGrad" x1="50%" />
          </defs>
        </svg>
      `;

      const defs = div.querySelector('defs')!;
      const baseEl = defs.querySelector('#baseGrad') as SVGElement;
      const midEl = defs.querySelector('#midGrad') as SVGElement;
      const childEl = defs.querySelector('#childGrad') as SVGElement;

      const gradMap = new Map();
      const baseGrad = GradientParser.parseGradient(baseEl, gradMap)!;
      gradMap.set('baseGrad', baseGrad);

      const midGrad = GradientParser.parseGradient(midEl, gradMap)!;
      gradMap.set('midGrad', midGrad);

      const childGrad = GradientParser.parseGradient(childEl, gradMap) as LinearGradientPaint;
      expect(childGrad).not.toBeNull();
      expect(childGrad.x1).toBe(0.5);
      expect(childGrad.y2).toBe(1);
      expect(childGrad.stops.length).toBe(2);
      expect(childGrad.stops[0].color.toHex()).toBe('#ff0000');
    });

    it('supports SVG 2 focal radius (fr) on radial gradients', () => {
      const div = document.createElement('div');
      div.innerHTML = `
        <svg>
          <defs>
            <radialGradient id="rad2" cx="50%" cy="50%" r="50%" fx="30%" fy="30%" fr="10%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#000000"/>
            </radialGradient>
          </defs>
        </svg>
      `;
      const radEl = div.querySelector('#rad2') as SVGElement;
      const grad = GradientParser.parseGradient(radEl) as RadialGradientPaint;
      expect(grad.fr).toBe(0.1);
    });
  });

  describe('SVG Parser & Serializer Roundtrip', () => {
    it('parses SVG document and serializes back to clean XML', () => {
      const svg = `<svg width="500" height="400" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="20" width="100" height="50" rx="5" ry="5" fill="#ff0000" stroke="#000000" stroke-width="2"/>
  <circle cx="200" cy="100" r="40" fill="#00ff00"/>
  <path d="M 10 10 L 50 50" stroke="#0000ff" stroke-width="3"/>
</svg>`;

      const root = SVGParser.parse(svg);
      expect(root.children.length).toBe(3);
      expect(root.viewBox.width).toBe(500);
      expect(root.viewBox.height).toBe(400);

      const xml = SVGSerializer.serialize(root, false);
      expect(xml).toContain('<rect');
      expect(xml).toContain('<circle');
      expect(xml).toContain('<path');
    });

    it('parses complete scene graph with groups, text, and styles', () => {
      const svg = `<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font-size: 24px; fill: #333333; }
    .box { fill: #f0f0f0; stroke: #cccccc; }
  </style>
  <g id="header">
    <rect class="box" x="0" y="0" width="800" height="80"/>
    <text class="title" x="20" y="50">Vector Canvas</text>
  </g>
</svg>`;

      const root = SVGParser.parse(svg);
      expect(root.children.length).toBe(1);
      const group = root.children[0];
      expect(group.id).toBe('header');
      expect(group.children.length).toBe(2);
    });
  });
});
