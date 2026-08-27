# SmartSVG Engine & Vector Graphics Studio

> **Thư viện SVG Engine chuẩn W3C SVG 1.1 & SVG 2 viết bằng TypeScript từ con số 0, tích hợp Vector Graphics Studio IDE tương tác thời gian thực.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-729B1B.svg)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen.svg)]()
[![W3C Spec](https://img.shields.io/badge/W3C-SVG%201.1%20%2F%20SVG%202-orange.svg)](https://www.w3.org/TR/SVG2/)

---

## Mục Lục (Table of Contents)
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Tính Năng Nổi Bật](#2-tính-năng-nổi-bật)
3. [Hướng Dẫn Cài Đặt & Chạy Dự Án](#3-hướng-dẫn-cài-đặt--chạy-dự-án)
4. [Kiến Trúc OOP & Design Patterns Chuyên Sâu](#4-kiến-trúc-oop--design-patterns-chuyên-sâu)
   - [4.1. Tầng Toán Học & Nền Tảng (Core Layer)](#41-tầng-toán-học--nền-tảng-core-layer)
   - [4.2. Tầng Cây Cú Pháp Trừu Tượng (AST Scene Graph Layer)](#42-tầng-cây-cú-pháp-trừu-tượng-ast-scene-graph-layer)
   - [4.3. Tầng Phân Tích Cú Pháp (Parser & Compiler Layer)](#43-tầng-phân-tích-cú-pháp-parser--compiler-layer)
   - [4.4. Tầng Phân Tích & Thống Kê (Analyzer Layer)](#44-tầng-phân-tích--thống-kê-analyzer-layer)
   - [4.5. Tầng Xuất Bản & Serializer (Serializer Layer)](#45-tầng-xuất-bản--serializer-serializer-layer)
   - [4.6. Tầng Viewport & Interactive IDE (Editor Layer)](#46-tầng-viewport--interactive-ide-editor-layer)
5. [Cấu Trúc Thư Mục Dự Án](#5-cấu-trúc-thư-mục-dự-án)
6. [Bộ Kiểm Thử Tự Động (Unit Testing)](#6-bộ-kiểm-thử-tự-động-unit-testing)
7. [Bản Quyền (License)](#7-bản-quyền-license)

---

## 1. Giới Thiệu Tổng Quan

**SmartSVG** là một hệ thống SVG Engine thuần TypeScript hoàn chỉnh, được xây dựng theo kiến trúc **Compiler & AST Scene Graph**. Engine hỗ trợ 100% đặc tả hình học và kiểu dáng của chuẩn **W3C SVG 1.1** và **SVG 2**, kết hợp cùng bộ giao diện phòng thí nghiệm đồ hoạ vector tương tác thời gian thực (**Vector Graphics Studio IDE**).

```text
========================================================================================
                               SVG COMPILATION & PROCESSING PIPELINE
========================================================================================

                                  [ SVG File / String ]
                                           │
                                           ▼
                                      DOMParser
                                (XML / SVG DOM Tree)
                                           │
                                           ▼
                                      SVG Parser
                                (Normalizer & Resolver)
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
                 [ Geometry ]           [ Style ]          [ Metadata ]
            • 10 Path Command Groups • Computed Styles   • Node IDs / Classes
            • Analytic Bounding Box  • Gradients/Paints  • Hierarchy / Layers
            • Affine 3x3 Matrix      • CSS Cascading     • Defs Registration
                      │                    │                    │
                      └────────────────────┼────────────────────┘
                                           ▼
                                      [ SVG AST ]
                         (Abstract Syntax Tree / Scene Graph)
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
                [ Analyzer ]                               [ Renderer ]
                      │                                         │
                      ▼                                         ▼
               [ Statistics ]                            [ Modified SVG ]
          • Element & Node Counts                    • Real-time Canvas (DOM)
          • Color Palette & Gradients                • Viewport (Zoom / Pan / Fit)
          • Path Complexity & Curves                 • Interactive 8-Handle Gizmo
          • Geometric Bounds & Area                  • Clean XML Serialization
          • Coverage Density                         • High-Res Export (SVG / PNG)
```

---

## 2. Tính Năng Nổi Bật

- **Độ chính xác hình học W3C F.6 Arc**: Chuyển đổi chính xác tham số Arc tâm $(cx, cy, \theta_1, \Delta\theta)$, tự động scale bán kính $\Lambda > 1$ và phân rã thành chuỗi Cubic Bézier mượt mà ($\alpha = \frac{4}{3}\tan(\Delta\theta/4)$).
- **Bounding Box giải tích chính xác tuyệt đối (Tight AABB)**: Tìm nghiệm đạo hàm $B'(t) = 0$ trên $(0, 1)$ cho Cubic và Quadratic Bézier thay vì lấy bao các điểm điều khiển (loose hull).
- **Hệ thống kế thừa Gradient đa tầng (Multi-hop Inheritance)**: Tự động resolve chuỗi kế thừa `href`/`xlink:href` lồng nhau, kế thừa stops, toạ độ, `spreadMethod`, `gradientUnits`, `gradientTransform`, hỗ trợ bán kính tiêu cự $fr$ của SVG 2.
- **CSS Cascading Engine đầy đủ**: Phân cấp ưu tiên `Inherited Style < <style> Rules < Presentation Attributes < Inline CSS`. Hỗ trợ 148 màu chuẩn W3C, Hex (3/4/6/8 số), RGB, HSL và kênh Alpha.
- **W3C Path Lexer nén**: Đọc chính xác toạ độ âm dính liền (`M10-20.5-30`), cờ Arc dính liền (`0150`), số mũ (`1e-4`), toạ độ lặp ngầm định.
- **Giao diện IDE Vector Graphics Studio**:
  - Infinite Canvas với Zoom tại vị trí chuột, Pan, Fit to Screen.
  - Artboard Paper chuyển đổi 3 chế độ nền: Dark, Light, Transparent Checkerboard.
  - Gizmo 8 handles tương tác co giãn và di chuyển trực tiếp trên canvas.
  - Cây phân cấp Layer/Scene Graph.
  - Bảng thống kê Complexity Analyzer & Color Palette.
  - Bảng thuộc tính Property Inspector chỉnh sửa toạ độ, kích thước, màu sắc real-time.
  - Quản lý lịch sử Undo / Redo.
  - Xuất file `.svg` XML chuẩn hoá hoặc ảnh raster `.png` sắc nét.

---

## 3. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu môi trường
- **Node.js**: Phiên bản `>= 18.0.0`
- **npm**: Phiên bản `>= 9.0.0`

### 1. Cài đặt dependencies
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### 2. Khởi động môi trường phát triển (Dev Server)
Khởi chạy Vite dev server để mở giao diện IDE Studio:
```bash
npm run dev
```
Truy cập vào đường dẫn hiển thị trên terminal (mặc định: `http://localhost:5173`).

### 3. Chạy bộ kiểm thử tự động (Unit Test Suite)
Chạy toàn bộ 18 test cases kiểm thử toán học, parser, gradient inheritance và serializer:
```bash
npm test
```
Hoặc chạy chế độ UI tương tác của Vitest:
```bash
npx vitest --ui
```

### 4. Đóng gói sản phẩm (Production Build)
Kiểm tra type-check TypeScript và build production bundle:
```bash
npm run build
```
Kết quả đóng gói sẽ nằm trong thư mục `dist/`.

---

## 4. Kiến Trúc OOP & Design Patterns Chuyên Sâu

Hệ thống được thiết kế theo các nguyên lý **SOLID**, phân chia ranh giới module rõ ràng (Separation of Concerns) và áp dụng các **Design Patterns** kinh điển:

```text
svgEngine/
├── core/         ──> [Toán học 2D, Path Commands, Style, Transforms, Colors, Paints]
├── ast/          ──> [Cây cú pháp trừu tượng AST, 22+ Node Classes theo chuẩn W3C]
├── parser/       ──> [Lexer, Tokenizer, Multi-hop Resolver, CSS Cascader]
├── analyzer/     ──> [Visitor/Metrics Engine: Color Palette, Complexity, Bounding Area]
├── serializer/   ──> [Biên dịch AST sang XML SVG chuẩn & Raster PNG Canvas]
└── viewer/       ──> [Viewport Matrix, Infinite Canvas Controller, Artboard Paper]
```

---

### 4.1. Tầng Toán Học & Nền Tảng (Core Layer)

#### A. Toán học Vector & Ma trận Affine 2D (`core/math/`)
- **`Vector2D`**: Đại diện điểm và vector trong không gian 2D với đầy đủ các phép tính: cộng, trừ, nhân vô hướng (dot product), tích có hướng (cross product), chuẩn hoá (normalize), tính góc (angleTo).
- **`Matrix2D`**: Ma trận biến đổi Affine $3 \times 3$:
  $$\begin{bmatrix} a & c & e \\ b & d & f \\ 0 & 0 & 1 \end{bmatrix}$$
  Hỗ trợ các phép nhân ma trận kết hợp (`multiply`), nghịch đảo ma trận phi suy biến (`invert`), tạo ma trận biến đổi tịnh tiến (`translation`), quay quanh tâm (`rotation`), co giãn (`scaling`), xiên trục (`skewX`, `skewY`).
- **`BoundingBox`**: Đại diện hộp bao chữ nhật (AABB). Cung cấp phương thức hợp nhất (`union`), mở rộng (`expand`), kiểm tra chứa điểm (`containsPoint`), biến đổi qua ma trận (`transform`).

#### B. Hệ thống Tô Màu & Gradient (`core/paint/`) — Strategy & Factory Pattern
- **`IPaint`** *(Interface)*: Định nghĩa giao diện chung cho mọi kiểu màu vẽ:
  - `toSVGString()`: Chuỗi biểu diễn SVG (`#ff0000`, `url(#grad1)`, `none`, `currentColor`).
  - `isTransparent()`: Kiểm tra tính trong suốt.
- **`SolidPaint`**: Đại diện màu đơn sắc kết hợp với `Color` (hỗ trợ chuyển đổi giữa RGB, HSL, Hex, và 148 màu định danh W3C).
- **`BaseGradientPaint`** *(Abstract Class)*: Lớp cơ sở cho Gradient, quản lý danh sách `GradientStop`, `spreadMethod` (`pad`, `reflect`, `repeat`), `gradientUnits` (`userSpaceOnUse`, `objectBoundingBox`), `gradientTransform`.
- **`LinearGradientPaint`**: Quản lý toạ độ vector hướng gradient $(x_1, y_1) \rightarrow (x_2, y_2)$.
- **`RadialGradientPaint`**: Quản lý tâm $(cx, cy)$, bán kính $r$, tiêu điểm $(fx, fy)$ và bán kính tiêu cự $fr$ (chuẩn SVG 2).
- **`PaintFactory`** *(Factory Pattern)*: Phân tích chuỗi đầu vào bất kỳ thành đối tượng `IPaint` tương ứng.

#### C. Hệ thống Biến Đổi Tương Tác (`core/transforms/`) — Composite Pattern
- **`ITransform`** *(Interface)*: Định nghĩa phương thức `toMatrix(): Matrix2D` và `toSVGString(): string`.
- **`TranslateTransform`**, **`ScaleTransform`**, **`RotateTransform`**, **`SkewTransform`**, **`MatrixTransform`**: Hiện thực từng loại phép biến đổi đơn lẻ.
- **`TransformList`** *(Composite Pattern)*: Danh sách chuỗi các phép biến đổi được gom nhóm và nhân ma trận tuần tự từ phải sang trái theo đúng chuẩn đồ hoạ vector.

#### D. Hệ thống Lệnh Path Đa Hình (`core/path/`) — Polymorphic Command Pattern
- **`PathCommand`** *(Abstract Class)*: Lớp cha của toàn bộ 10 nhóm lệnh đường cong W3C:
  - `toAbsolute(currentPoint: Vector2D): PathCommand`: Chuẩn hoá lệnh relative (`m`, `l`, `c`...) thành absolute (`M`, `L`, `C`...).
  - `getEndPoint(currentPoint: Vector2D): Vector2D`: Tính điểm kết thúc của lệnh.
  - `getBounds(currentPoint: Vector2D): BoundingBox`: Tính Bounding Box chính xác của phân đoạn.
  - `transform(matrix: Matrix2D): PathCommand`: Áp dụng ma trận biến đổi lên toạ độ phân đoạn.
- **`MoveToCommand`** (`M`/`m`), **`LineToCommand`** (`L`/`l`, `H`/`h`, `V`/`v`), **`ClosePathCommand`** (`Z`/`z`).
- **`CubicBezierCommand`** (`C`/`c`, `S`/`s`): Tính toán hộp bao chính xác tuyệt đối bằng cực trị nghiệm đạo hàm $B'(t) = 0$.
- **`QuadBezierCommand`** (`Q`/`q`, `T`/`t`): Hỗ trợ tính cực trị bậc 1 và nâng bậc đường cong lên bậc 3 (`toCubicBezier()`).
- **`ArcCommand`** (`A`/`a`): Thực thi thuật toán W3C F.6 chuyển đổi sang dạng tâm và phân rã thành chuỗi Cubic Bézier.
- **`PathData`**: Quản lý toàn bộ danh sách lệnh của một đường Path, cung cấp phương thức `toSVGString()`, `getBounds()`, `transform()`.

---

### 4.2. Tầng Cây Cú Pháp Trừu Tượng (AST Scene Graph Layer)

Áp dụng **Composite Pattern** để xây dựng cây Scene Graph phân cấp đa tầng:

```text
ASTNode (Abstract Base)
├── GroupNode (<g>)
│   └── (Children ASTNodes...)
├── RootNode (<svg>)
├── Shape Nodes:
│   ├── RectNode (<rect>)
│   ├── CircleNode (<circle>)
│   ├── EllipseNode (<ellipse>)
│   ├── LineNode (<line>)
│   ├── PolylineNode (<polyline>)
│   └── PolygonNode (<polygon>)
├── PathNode (<path>)
├── Text Nodes:
│   ├── TextNode (<text>)
│   ├── TSpanNode (<tspan>)
│   └── TextPathNode (<textPath>)
├── Resource & Defs Nodes:
│   ├── ClipPathNode (<clipPath>)
│   ├── MaskNode (<mask>)
│   ├── FilterNode (<filter>)
│   ├── MarkerNode (<marker>)
│   ├── PatternNode (<pattern>)
│   ├── SymbolNode (<symbol>)
│   └── UseNode (<use>)
└── AnchorNode (<a>) & ForeignObjectNode (<foreignObject>)
```

Mỗi `ASTNode` đóng gói 3 khối dữ liệu độc lập:
1. **Geometry Layer**: Chứa toạ độ hình học gốc, danh sách `PathCommand`, ma trận `transform` và `BoundingBox`.
2. **Style Layer**: Chứa `Style` (Fill, Stroke, StrokeWidth, Opacity, FontStyle) đã qua tính toán kế thừa.
3. **Metadata Layer**: Chứa `id`, `classNames`, `attributes` mở rộng và trạng thái tương tác (`visible`, `locked`).

Cung cấp các phương thức duyệt cây và quản lý quan hệ:
- `addChild(child: ASTNode)`, `removeChild(child: ASTNode)`, `traverse(callback: (node: ASTNode) => void)`.
- `clone()`: Deep clone toàn bộ cấu trúc node con và thuộc tính.
- `getWorldTransform()`: Nhân ma trận dồn từ Root đến Node hiện tại.
- `getWorldBounds()`: Tính toạ độ bao ngoài toàn cục trong không gian Scene.

---

### 4.3. Tầng Phân Tích Cú Pháp (Parser & Compiler Layer)

- **`SVGParser`** *(Façade Pattern)*: Điểm tiếp nhận chuỗi SVG thô, khởi tạo DOMParser, bóc tách thẻ `<defs>`, duyệt cây DOM đệ quy và khởi tạo cây `SVGAST`.
- **`PathParser`** *(Lexer & Tokenizer)*:
  - Tách token thông minh không phụ thuộc khoảng trắng (`M10-20.5.5L30e2-40`).
  - Phân tích cờ Arc flags dính liền (`0150`).
  - Xử lý đối xứng điểm điều khiển tự động cho `S`/`s` và `T`/`t`.
  - Tự động chuyển toạ độ ngầm định sau `M` thành lệnh `L`.
- **`GradientParser`** *(DAG Multi-hop Resolver)*:
  - Phân giải chuỗi kế thừa `href`/`xlink:href` nhiều tầng (`#child` $\rightarrow$ `#mid` $\rightarrow$ `#base`).
  - Kế thừa tự động stops, thuộc tính toạ độ, `spreadMethod`, `gradientUnits`, `gradientTransform`.
  - Hỗ trợ đầy đủ bán kính tiêu cự $fr$ của SVG 2.
- **`CSSStylesheetParser` & `StyleParser`**:
  - Đọc thẻ `<style>` nội bộ và phân tách các bộ chọn CSS (class, id, element type).
  - Áp dụng thứ tự ưu tiên chuẩn W3C: `Inherited Style < <style> Rules < Presentation Attributes < Inline Style`.
- **`FilterParser`**: Bóc tách các bộ lọc hiệu ứng phức tạp (`feGaussianBlur`, `feDropShadow`, `feColorMatrix`, `feBlend`...).

---

### 4.4. Tầng Phân Tích & Thống Kê (Analyzer Layer)

Áp dụng **Visitor Pattern** để duyệt toàn bộ cây AST và trích xuất số liệu:
- **`SVGAnalyzer`**: Bộ điều phối tổng, xuất báo cáo `SVGStatisticsReport`.
- **`ComplexityAnalyzer`**:
  - Đếm chi tiết số lượng từng loại thẻ (`rectCount`, `pathCount`, `textCount`...).
  - Thống kê tổng số điểm nút (nodes/vertices), tổng số đoạn cong Bézier.
  - Tính tổng diện tích phủ (Coverage area) và độ sâu lớn nhất của cây phân cấp.
- **`ColorExtractor`**:
  - Trích xuất toàn bộ bảng màu đơn sắc (`Solid Colors`) và tần suất xuất hiện.
  - Trích xuất toàn bộ bảng màu Gradient (Linear / Radial) và các điểm stop màu.

---

### 4.5. Tầng Xuất Bản & Serializer (Serializer Layer)

- **`SVGSerializer`**:
  - **AST to XML Stringifier**: Duyệt cây AST và xuất ra chuỗi XML SVG sạch sẽ, định dạng chuẩn (pretty-printed), giữ lại đầy đủ `<defs>`, gradient, clipPath, style và metadata.
  - **Canvas Raster Exporter**: Vẽ cây SVG lên HTML5 Canvas 2D ảo để xuất ra ảnh raster định dạng `.png` với độ phân giải tuỳ chỉnh sắc nét.

---

### 4.6. Tầng Viewport & Interactive IDE (Editor Layer)

- **`ViewportController`**:
  - Điều khiển không gian làm việc với ma trận Zoom & Pan.
  - Zoom hướng tâm theo vị trí trỏ chuột (`mouse-centered zoom`).
  - Fit to Screen: Tự động căn giữa và co giãn viewBox của SVG vừa vặn với kích thước màn hình.
  - Artboard Paper: Hiển thị giấy vẽ đồ hoạ với 3 chế độ nền (`Dark Mode`, `Light Paper`, `Transparent Checkerboard`).
- **Interactive Gizmo**:
  - Khung bao 8 handles co giãn 8 hướng (Top-Left, Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left).
  - Tự động cập nhật toạ độ và kích thước ngược lại AST Node khi kéo thả trên canvas.
- **Command History Manager** *(Command Pattern)*:
  - Lưu trữ ngăn xếp thao tác (Undo / Redo Stack).
  - Hỗ trợ phím tắt `Ctrl + Z` và `Ctrl + Y`.

---

## 5. Cấu Trúc Thư Mục Dự Án

```text
SmartSVG/
├── .gitignore                      # Cấu hình bỏ qua file rác git
├── package.json                    # Khai báo dependencies & scripts
├── tsconfig.json                   # Cấu hình TypeScript nghiêm ngặt (Strict)
├── vite.config.ts                  # Cấu hình Vite bundler
├── vitest.config.ts                # Cấu hình môi trường kiểm thử Vitest (happy-dom)
├── README.md                       # Tài liệu hướng dẫn & Kiến trúc chi tiết
│
├── svgEngine/                      # THƯ VIỆN CỐT LÕI (CORE ENGINE)
│   ├── spec/                       # Hằng số và định nghĩa chuẩn SVG
│   ├── core/                       # Toán học, Path Commands, Style, Transforms, Paint
│   │   ├── math/                   # Vector2D, Matrix2D, BoundingBox
│   │   ├── values/                 # SVGLength, SVGAngle
│   │   ├── paint/                  # Color, IPaint, SolidPaint, Gradient, PaintFactory
│   │   ├── transforms/             # TransformList, Matrix, Translate, Rotate...
│   │   ├── style/                  # Style, Stroke, FontStyle
│   │   └── path/                   # PathData, PathCommand, Cubic, Quad, Arc, Line...
│   ├── ast/                        # Cây cú pháp trừu tượng AST (22+ Node types)
│   │   ├── ast-node.ts             # Abstract Base AST Node
│   │   └── nodes/                  # RootNode, GroupNode, PathNode, ShapeNodes...
│   ├── parser/                     # Bộ phân tích cú pháp (Compiler)
│   │   ├── svg-parser.ts           # Trình phân giải XML -> AST
│   │   ├── path-parser.ts          # Lexer & Tokenizer chuỗi 'd'
│   │   ├── gradient-parser.ts      # Bộ kế thừa gradient đa tầng
│   │   ├── style-parser.ts         # Bộ phân tích Style & CSS cascade
│   │   ├── css-stylesheet-parser.ts# Bộ phân tích <style> rules
│   │   └── filter-parser.ts        # Bộ phân tích <filter> primitives
│   ├── analyzer/                   # Bộ phân tích & thống kê số liệu
│   │   ├── svg-analyzer.ts         # Điều phối phân tích tổng
│   │   ├── complexity-analyzer.ts  # Phân tích độ phức tạp hình học
│   │   └── color-extractor.ts      # Bóc tách bảng màu & gradients
│   ├── serializer/                 # Xuất bản file
│   │   └── svg-serializer.ts       # Xuất chuỗi XML chuẩn & ảnh PNG
│   ├── viewer/                     # Điều khiển hiển thị Canvas & Artboard
│   │   └── viewport-controller.ts  # Quản lý Zoom, Pan, Fit, Artboard mode
│   ├── __tests__/                  # Bộ kiểm thử tự động (Unit Test Suite)
│   │   └── svg-engine.test.ts      # 18 test cases bao phủ toàn bộ engine
│   └── index.ts                    # Entry export chính của svgEngine
│
└── playground/                     # GIAO DIỆN PHÒNG THÍ NGHIỆM ĐỒ HOẠ (Vite App)
    ├── index.html                  # Giao diện IDE: Toolbar, Canvas, Sidebar
    ├── style.css                   # Theme Dark Mode Studio chuyên nghiệp
    └── main.ts                     # Điều phối toàn bộ sự kiện IDE tương tác
```

---

## 6. Bộ Kiểm Thử Tự Động (Unit Testing)

Dự án được bảo vệ bằng bộ unit test viết trên **Vitest** kết hợp môi trường giả lập DOM **happy-dom**, bao phủ các trường hợp biên quan trọng:

```bash
$ npm test

 ✓ svgEngine/__tests__/svg-engine.test.ts (18 tests) 30ms
   ✓ Color Parser (W3C Standard) (3 tests)
     ✓ parses Hex 3, 4, 6, 8 digits
     ✓ parses 148 W3C named colors
     ✓ parses RGB and HSL functional notations
   ✓ Affine Matrix 2D Transformations (2 tests)
     ✓ performs translation and rotation around center
     ✓ inverts non-singular matrices
   ✓ Path Commands & W3C Geometry (8 tests)
     ✓ calculates tight bounding boxes for Cubic Béziers
     ✓ converts Quad Bézier to Cubic Bézier
     ✓ parses elliptical arcs and converts to smooth cubic beziers
     ✓ handles degenerate arcs with rx=0 or ry=0 by collapsing to empty bezier chain
     ✓ parses complex compressed SVG path string
     ✓ parses scientific notations and contiguous arc flags
     ✓ handles implicit line commands after MoveTo
     ✓ reflects control points for smooth cubic S command
   ✓ Gradients & Multi-Hop Inheritance (3 tests)
     ✓ constructs linear and radial gradient DOM elements
     ✓ resolves multi-hop gradient inheritance chain with stops and coordinates
     ✓ supports SVG 2 focal radius (fr) on radial gradients
   ✓ SVG Parser & Serializer Roundtrip (2 tests)
     ✓ parses SVG document and serializes back to clean XML
     ✓ parses complete scene graph with groups, text, and styles

Test Files  1 passed (1)
     Tests  18 passed (18)
```

---

## 7. Bản Quyền (License)

Dự án phát hành theo giấy phép **ISC License**. Tự do sử dụng và mở rộng cho mục đích học tập, nghiên cứu và phát triển thương mại.
