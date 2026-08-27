# SmartSVG Engine & Vector Graphics Studio

> Thư viện SVG Engine chuẩn W3C SVG 1.1 và SVG 2 viết bằng TypeScript từ con số 0, tích hợp công cụ đồ hoạ vector tương tác thời gian thực.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-729B1B.svg)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen.svg)]()
[![W3C Spec](https://img.shields.io/badge/W3C-SVG%201.1%20%2F%20SVG%202-orange.svg)](https://www.w3.org/TR/SVG2/)

---

## Mục lục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Cơ sở toán học và giải thuật hình học](#2-cơ-sở-toán-học-và-giải-thuật-hình-học)
   - [2.1. Phân rã elliptical arc sang cubic Bézier (chuẩn W3C F.6)](#21-phân-rã-elliptical-arc-sang-cubic-bézier-chuẩn-w3c-f6)
   - [2.2. Tính toán tight bounding box bằng nghiệm đạo hàm giải tích](#22-tính-toán-tight-bounding-box-bằng-nghiệm-đạo-hàm-giải-tích)
   - [2.3. Nâng bậc đường cong quadratic sang cubic Bézier](#23-nâng-bậc-đường-cong-quadratic-sang-cubic-bézier)
   - [2.4. Đối xứng điểm điều khiển cho lệnh mượt (S/s và T/t)](#24-đối-xứng-điểm-điều-khiển-cho-lệnh-mượt-ss-và-tt)
   - [2.5. Ma trận biến đổi affine 2D và phép nghịch đảo](#25-ma-trận-biến-đổi-affine-2d-và-phép-nghịch-đảo)
3. [Kiến trúc hướng đối tượng (OOP) và các mẫu thiết kế (design patterns)](#3-kiến-trúc-hướng-đối-tượng-oop-và-các-mẫu-thiết-kế-design-patterns)
   - [3.1. Hiện thực bốn trụ cột OOP](#31-hiện-thực-bốn-trụ-cột-oop)
   - [3.2. Các mẫu thiết kế (design patterns) áp dụng trong hệ thống](#32-các-mẫu-thiết-kế-design-patterns-áp-dụng-trong-hệ-thống)
4. [Hướng dẫn cài đặt và chạy dự án](#4-hướng-dẫn-cài-đặt-và-chạy-dự-án)
5. [Cấu trúc thư mục dự án](#5-cấu-trúc-thư-mục-dự-án)
6. [Bộ kiểm thử tự động (unit testing)](#6-bộ-kiểm-thử-tự-động-unit-testing)
7. [Bản quyền (license)](#7-bản-quyền-license)

---

## 1. Giới thiệu tổng quan

SmartSVG là một hệ thống SVG Engine thuần TypeScript hoàn chỉnh, được xây dựng theo kiến trúc **trình biên dịch và cây cú pháp trừu tượng (Compiler & AST Scene Graph)**. Engine xử lý toàn diện các thành phần hình học, ma trận biến đổi, màu sắc, gradient kế thừa đa tầng và tầng cascading CSS của chuẩn W3C SVG 1.1 và SVG 2.

```text
========================================================================================
                         LUỒNG BIÊN DỊCH VÀ XỬ LÝ SVG (PIPELINE)
========================================================================================

                                  [ Chuỗi / File SVG ]
                                           │
                                           ▼
                                      DOMParser
                                  (Cây XML/SVG DOM)
                                           │
                                           ▼
                                      SVGParser
                               (Chuẩn hoá và phân giải)
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
                 [ Hình học ]         [ Kiểu dáng ]         [ Siêu dữ liệu ]
            • 10 nhóm lệnh path    • Kiểu dáng tính toán • ID, class, layer
            • Bounding box cực trị • Kế thừa gradient    • Cây phân cấp DOM
            • Ma trận affine 3x3   • Phân cấp CSS        • Đăng ký defs
                      │                    │                    │
                      └────────────────────┼────────────────────┘
                                           ▼
                                      [ SVG AST ]
                             (Cây cú pháp / Scene Graph)
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
                [ Analyzer ]                               [ Renderer ]
                      │                                         │
                      ▼                                         ▼
               [ Thống kê ]                              [ SVG chỉnh sửa ]
          • Đếm số lượng node                        • Canvas tương tác DOM
          • Bảng màu và gradient                     • Điều khiển zoom/pan/fit
          • Độ phức tạp đường cong                   • Khung gizmo 8 điểm neo
          • Diện tích và hộp bao                     • Xuất XML SVG chuẩn hoá
          • Mật độ phần tử đồ hoạ                    • Xuất ảnh PNG độ nét cao
```

---

## 2. Cơ sở toán học và giải thuật hình học

### 2.1. Phân rã elliptical arc sang cubic Bézier (chuẩn W3C F.6)

Một cung elip trong SVG được định nghĩa bằng toạ độ điểm đầu $(x_1, y_1)$, điểm cuối $(x_2, y_2)$, hai bán kính $(r_x, r_y)$, góc nghiêng trục $\phi$, cờ cung lớn $f_A \in \{0, 1\}$ và cờ quét $f_S \in \{0, 1\}$. 

Giải thuật W3C chuyển đổi từ tham số điểm cuối sang tham số tâm $(c_x, c_y, \theta_1, \Delta\theta)$ và phân rã thành chuỗi đường cong cubic Bézier:

1. **Chuyển đổi toạ độ sang hệ trục elip quay:**
   $$\begin{bmatrix} x_1' \\ y_1' \end{bmatrix} = \begin{bmatrix} \cos\phi & \sin\phi \\ -\sin\phi & \cos\phi \end{bmatrix} \begin{bmatrix} \frac{x_1 - x_2}{2} \\ \frac{y_1 - y_2}{2} \end{bmatrix}$$

2. **Kiểm tra và tự động hiệu chỉnh tỉ lệ bán kính:**
   $$\Lambda = \frac{{x_1'}^2}{r_x^2} + \frac{{y_1'}^2}{r_y^2}$$
   Nếu $\Lambda > 1$, bán kính được co giãn để đi qua hai điểm:
   $$r_x \leftarrow \sqrt{\Lambda} \, r_x, \quad r_y \leftarrow \sqrt{\Lambda} \, r_y$$

3. **Tính toạ độ tâm trong hệ trục quay $(c_x', c_y')$:**
   $$\begin{bmatrix} c_x' \\ c_y' \end{bmatrix} = \pm \sqrt{\max\left(0, \frac{r_x^2 r_y^2 - r_x^2 {y_1'}^2 - r_y^2 {x_1'}^2}{r_x^2 {y_1'}^2 + r_y^2 {x_1'}^2}\right)} \begin{bmatrix} \frac{r_x y_1'}{r_y} \\ -\frac{r_y x_1'}{r_x} \end{bmatrix}$$
   Dấu chọn là $+$ nếu $f_A \neq f_S$, và dấu $-$ nếu $f_A = f_S$.

4. **Chuyển tâm về hệ toạ độ thế giới ban đầu $(c_x, c_y)$:**
   $$\begin{bmatrix} c_x \\ c_y \end{bmatrix} = \begin{bmatrix} \cos\phi & -\sin\phi \\ \sin\phi & \cos\phi \end{bmatrix} \begin{bmatrix} c_x' \\ c_y' \end{bmatrix} + \begin{bmatrix} \frac{x_1 + x_2}{2} \\ \frac{y_1 + y_2}{2} \end{bmatrix}$$

5. **Xác định góc bắt đầu $\theta_1$ và góc quét $\Delta\theta$:**
   $$\theta_1 = \text{angle}\left(\begin{bmatrix} 1 \\ 0 \end{bmatrix}, \begin{bmatrix} \frac{x_1' - c_x'}{r_x} \\ \frac{y_1' - c_y'}{r_y} \end{bmatrix}\right), \quad \Delta\theta = \text{angle}\left(\begin{bmatrix} \frac{x_1' - c_x'}{r_x} \\ \frac{y_1' - c_y'}{r_y} \end{bmatrix}, \begin{bmatrix} \frac{-x_1' - c_x'}{r_x} \\ \frac{-y_1' - c_y'}{r_y} \end{bmatrix}\right) \pmod{2\pi}$$
   Nếu $f_S = 0$ và $\Delta\theta > 0$ thì $\Delta\theta \leftarrow \Delta\theta - 2\pi$. Nếu $f_S = 1$ và $\Delta\theta < 0$ thì $\Delta\theta \leftarrow \Delta\theta + 2\pi$.

6. **Phân đoạn và xấp xỉ bằng cubic Bézier:**
   Cung được chia thành $N = \lceil |\Delta\theta| / (\pi/2) \rceil$ phân đoạn góc $\delta = \Delta\theta / N$. Hệ số khoảng cách điểm điều khiển tối ưu:
   $$\alpha = \frac{4}{3} \tan\left(\frac{\delta}{4}\right)$$
   Với mỗi phân đoạn bắt đầu từ góc $\theta$, điểm trên elip và vector đạo hàm tiếp tuyến:
   $$\mathbf{P}(t) = \begin{bmatrix} c_x + r_x \cos t \cos\phi - r_y \sin t \sin\phi \\ c_y + r_x \cos t \sin\phi + r_y \sin t \cos\phi \end{bmatrix}, \quad \mathbf{P}'(t) = \begin{bmatrix} -r_x \sin t \cos\phi - r_y \cos t \sin\phi \\ -r_x \sin t \sin\phi + r_y \cos t \cos\phi \end{bmatrix}$$
   Hai điểm điều khiển của đoạn cubic Bézier tương ứng là:
   $$\mathbf{CP}_1 = \mathbf{P}(\theta) + \alpha \mathbf{P}'(\theta), \quad \mathbf{CP}_2 = \mathbf{P}(\theta + \delta) - \alpha \mathbf{P}'(\theta + \delta)$$

---

### 2.2. Tính toán tight bounding box bằng nghiệm đạo hàm giải tích

Hộp bao chính xác của đường cong không thể lấy đơn thuần từ các điểm điều khiển (control point hull) vì sẽ bị dư thừa diện tích. Hệ thống tìm cực trị cục bộ bằng nghiệm của đạo hàm bậc nhất trên khoảng $t \in (0, 1)$:

#### Quadratic Bézier:
Phương trình tham số:
$$\mathbf{B}(t) = (1-t)^2 \mathbf{P}_0 + 2(1-t)t \mathbf{P}_1 + t^2 \mathbf{P}_2, \quad t \in [0, 1]$$
Đạo hàm bậc nhất theo $t$:
$$\mathbf{B}'(t) = 2(1-t)(\mathbf{P}_1 - \mathbf{P}_0) + 2t(\mathbf{P}_2 - \mathbf{P}_1) = 2(\mathbf{P}_0 - 2\mathbf{P}_1 + \mathbf{P}_2)t + 2(\mathbf{P}_1 - \mathbf{P}_0)$$
Nghiệm cực trị cho từng trục $x$ và $y$:
$$t^* = \frac{P_0 - P_1}{P_0 - 2P_1 + P_2}$$
Nếu $t^* \in (0, 1)$, tập giá trị kiểm tra là $\{B(0), B(1), B(t^*)\}$.

#### Cubic Bézier:
Phương trình tham số:
$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t)t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3, \quad t \in [0, 1]$$
Đạo hàm bậc nhất theo $t$ là phương trình bậc hai:
$$\mathbf{B}'(t) = 3(-\mathbf{P}_0 + 3\mathbf{P}_1 - 3\mathbf{P}_2 + \mathbf{P}_3)t^2 + 6(\mathbf{P}_0 - 2\mathbf{P}_1 + \mathbf{P}_2)t + 3(\mathbf{P}_1 - \mathbf{P}_0) = 0$$
Đặt:
$$a = 3(-P_0 + 3P_1 - 3P_2 + P_3), \quad b = 6(P_0 - 2P_1 + P_2), \quad c = 3(P_1 - P_0)$$
Các nghiệm thực $t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ nằm trong khoảng $(0, 1)$ được đưa vào tập kiểm tra cùng với $B(0)$ và $B(1)$ để xác định chính xác $\min$ và $\max$.

---

### 2.3. Nâng bậc đường cong quadratic sang cubic Bézier

Để đồng nhất xử lý hình học và render, đường cong bậc hai (quadratic) với điểm đầu $\mathbf{P}_0$, điểm điều khiển $\mathbf{P}_1$, điểm cuối $\mathbf{P}_2$ được nâng lên đường cong bậc ba (cubic) tương đương chính xác về mặt hình học:
$$\mathbf{CP}_1 = \mathbf{P}_0 + \frac{2}{3}(\mathbf{P}_1 - \mathbf{P}_0), \quad \mathbf{CP}_2 = \mathbf{P}_2 + \frac{2}{3}(\mathbf{P}_1 - \mathbf{P}_2)$$

---

### 2.4. Đối xứng điểm điều khiển cho lệnh mượt (S/s và T/t)

Chuẩn W3C quy định lệnh tiếp tuyến mượt `S`/`s` (cubic) và `T`/`t` (quadratic) tự động phản chiếu điểm điều khiển cuối cùng của lệnh trước đó qua điểm hiện tại $\mathbf{P}_0$:
$$\mathbf{CP}_{\text{reflected}} = 2 \mathbf{P}_0 - \mathbf{CP}_{\text{last}}$$
Nếu lệnh đứng liền trước không phải là lệnh cong cùng bậc, điểm điều khiển phản chiếu sẽ suy biến trùng với điểm hiện tại $\mathbf{P}_0$.

---

### 2.5. Ma trận biến đổi affine 2D và phép nghịch đảo

Mọi phép biến đổi trong không gian 2D được biểu diễn qua ma trận thuần nhất $3 \times 3$:
$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & c & e \\ b & d & f \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} \implies \begin{cases} x' = ax + cy + e \\ y' = bx + dy + f \end{cases}$$

Định thức ma trận $\det(M) = ad - bc$. Khi $\det(M) \neq 0$, ma trận nghịch đảo $M^{-1}$ được tính bởi:
$$M^{-1} = \frac{1}{ad - bc} \begin{bmatrix} d & -c & cf - de \\ -b & a & be - af \\ 0 & 0 & ad - bc \end{bmatrix}$$

---

## 3. Kiến trúc hướng đối tượng (OOP) và các mẫu thiết kế (design patterns)

Hệ thống được thiết kế theo chuẩn module hoá, tuân thủ nguyên lý thiết kế SOLID và vận dụng chặt chẽ các đặc tính của lập trình hướng đối tượng:

```text
svgEngine/
├── core/         ──> [Toán học 2D, Path Commands, Style, Transforms, Paints]
├── ast/          ──> [Cây cú pháp trừu tượng AST, 22+ class node theo chuẩn W3C]
├── parser/       ──> [Lexer, Tokenizer, Multi-hop Resolver, CSS Cascader]
├── analyzer/     ──> [Visitor/Metrics Engine: Bảng màu, độ phức tạp, diện tích]
├── serializer/   ──> [Biên dịch AST sang XML SVG và vẽ lên canvas xuất PNG]
└── viewer/       ──> [Quản lý viewport matrix, infinite canvas, artboard mode]
```

---

### 3.1. Hiện thực bốn trụ cột OOP

#### 1. Tính đóng gói (Encapsulation)
- Mỗi đối tượng hình học (`Vector2D`, `Matrix2D`, `BoundingBox`, `Color`, `SVGLength`) tự đóng gói trạng thái nội tại và bảo vệ tính bất biến (immutability) ở các thao tác toán học cơ bản.
- Thuật toán giải nghiệm đạo hàm tìm hộp bao và thuật toán lượng giác W3C F.6 được đóng gói hoàn toàn bên trong các phương thức `getBounds()` và `toCubicBeziers()`, che giấu độ phức tạp khỏi người dùng thư viện.
- Trạng thái của một node được chia thành ba khối độc lập có phạm vi rõ ràng: `Geometry`, `Style` và `Metadata`.

#### 2. Tính kế thừa (Inheritance)
- **Hệ thống node AST:** Lớp trừu tượng cơ sở `ASTNode` (`ast/ast-node.ts`) định nghĩa các thuộc tính và phương thức chung (quản lý quan hệ cha-con, ma trận thế giới, biến đổi, clone, duyệt cây). Các lớp cụ thể kế thừa trực tiếp:
  - Nhóm chứa: `RootNode`, `GroupNode`, `SymbolNode`, `AnchorNode`.
  - Nhóm hình học cơ bản: `RectNode`, `CircleNode`, `EllipseNode`, `LineNode`, `PolylineNode`, `PolygonNode`.
  - Nhóm đường cong tự do: `PathNode`.
  - Nhóm văn bản: `TextNode`, `TSpanNode`, `TextPathNode`.
  - Nhóm tài nguyên và định nghĩa: `ClipPathNode`, `MaskNode`, `FilterNode`, `MarkerNode`, `PatternNode`, `UseNode`, `ForeignObjectNode`.
- **Hệ thống lệnh path:** Lớp trừu tượng `PathCommand` (`core/path/path-command.ts`) làm lớp cha cho 10 class lệnh: `MoveToCommand`, `LineToCommand`, `CubicBezierCommand`, `QuadBezierCommand`, `ArcCommand`, `ClosePathCommand`.
- **Hệ thống gradient:** Lớp trừu tượng `BaseGradientPaint` làm lớp cha quản lý stops, units, spread method và transform cho hai lớp con `LinearGradientPaint` và `RadialGradientPaint`.

#### 3. Tính đa hình (Polymorphism)
- Phương thức `getBounds(currentPoint: Vector2D): BoundingBox` được định nghĩa trừu tượng ở `PathCommand` và được từng class lệnh (`CubicBezierCommand`, `QuadBezierCommand`, `ArcCommand`, `LineToCommand`) ghi đè (override) để thực thi giải thuật toán học riêng biệt của từng loại đường cong.
- Phương thức `toSVGString(): string` và `toMatrix(): Matrix2D` được đa hình hoá qua toàn bộ hệ thống lệnh transform (`TranslateTransform`, `ScaleTransform`, `RotateTransform`, `SkewTransform`, `MatrixTransform`).
- Giao diện `IPaint` cho phép các đối tượng `SolidPaint`, `NonePaint`, `CurrentColorPaint`, `LinearGradientPaint`, `RadialGradientPaint` được truyền và xử lý đồng nhất ở thuộc tính `fill` và `stroke` của mọi node.

#### 4. Tính trừu tượng (Abstraction)
- Tách biệt hoàn toàn giữa biểu diễn dữ liệu trừu tượng (cây `ASTNode`) với cách thức hiển thị ra DOM (`DOMRenderer`), cách thức phân tích dữ liệu (`SVGAnalyzer`), và cách thức xuất file (`SVGSerializer`).
- Các giao diện `IPaint`, `ITransform`, `SVGDefItem` thiết lập các hợp đồng giao tiếp (contracts) mức cao, giúp hệ thống dễ dàng mở rộng thêm các loại paint hoặc filter mới mà không ảnh hưởng tới core engine.

---

### 3.2. Các mẫu thiết kế (design patterns) áp dụng trong hệ thống

1. **Composite Pattern (Cây Scene Graph & Transform List):**
   - Cây AST tổ chức theo dạng cây đệ quy: `GroupNode` và `RootNode` có thể chứa các `ASTNode` con (bao gồm cả các `GroupNode` lồng nhau). Thao tác duyệt cây `traverse()` hoặc tính ma trận toàn cục `getWorldTransform()` được thực thi đồng nhất từ gốc đến mọi lá.
   - `TransformList` gom nhóm danh sách các phép biến đổi đơn lẻ (`ITransform`) và tổng hợp thành một ma trận duy nhất theo thứ tự nhân từ phải sang trái.

2. **Command Pattern (Lệnh Path & Quản lý Undo/Redo):**
   - Từng phân đoạn đường cong trong thuộc tính `d` của thẻ `<path>` được trừu tượng hoá thành một đối tượng Command thực thi.
   - Hệ thống lịch sử thao tác (`HistoryManager`) lưu trữ ngăn xếp các đối tượng lệnh chỉnh sửa để hỗ trợ hoàn tác và làm lại (`Ctrl + Z`, `Ctrl + Y`).

3. **Strategy & Factory Pattern (Hệ thống màu vẽ Paint):**
   - `IPaint` đóng vai trò Strategy định nghĩa chiến lược tô màu và sinh mã SVG.
   - `PaintFactory` đóng vai trò Factory method phân tích chuỗi màu bất kỳ (`hex`, `rgb`, `hsl`, `url(#id)`, `named color`, `none`, `currentColor`) để khởi tạo đối tượng Paint tương ứng.

4. **Visitor Pattern (Bộ phân tích số liệu Analyzer):**
   - `ComplexityAnalyzer` và `ColorExtractor` đóng vai trò Visitor duyệt qua toàn bộ cây AST thông qua hàm `traverse()`, thu thập các số liệu thống kê (đếm đỉnh, đếm đoạn cong, tính diện tích bao phủ, trích xuất palette màu) mà không làm biến đổi cấu trúc các node.

5. **Façade Pattern (Điểm truy cập đơn giản hoá):**
   - `SVGParser` cung cấp phương thức duy nhất `SVGParser.parse(svgString)` che giấu toàn bộ quy trình phức tạp bên dưới: gọi `DOMParser`, phân tích bảng mã màu, bóc tách `<defs>`, giải quyết kế thừa gradient đa tầng, phân tích CSS cascade và dựng cây `ASTNode`.
   - `SVGSerializer` cung cấp phương thức `SVGSerializer.serialize(rootNode)` che giấu quá trình duyệt cây và định dạng XML.

6. **Registry / Cache Pattern (Kho lưu trữ Defs):**
   - Quản lý các định nghĩa dùng lại trong thẻ `<defs>` (gradient, clipPath, mask, marker, pattern, filter) theo bảng ánh xạ mã định danh ID, hỗ trợ truy xuất nhanh khi các node hình học tham chiếu bằng `url(#id)`.

---

## 4. Hướng dẫn cài đặt và chạy dự án

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

Tại giao diện đồ hoạ, bạn có thể:
- Kéo thả file `.svg` từ máy tính vào vùng làm việc.
- Dùng chuột giữa hoặc giữ phím `Space` kết hợp kéo chuột để di chuyển canvas (Pan).
- Cuộn chuột để phóng to/thu nhỏ (Zoom có tâm tại vị trí con trỏ chuột).
- Nhấp chọn đối tượng để hiển thị khung **Gizmo 8 điểm neo** co giãn và di chuyển trực tiếp.
- Chỉnh sửa màu sắc `fill`, `stroke`, toạ độ và kích thước tại bảng **Property Inspector**.
- Xem báo cáo thống kê số lượng node, độ phức tạp đường cong và bảng màu tại **Statistics Panel**.
- Chuyển đổi 3 chế độ nền Artboard: Dark mode, Light paper, Transparent checkerboard.
- Xuất file `.svg` XML chuẩn hoặc ảnh raster `.png` độ phân giải cao.

### 3. Chạy bộ kiểm thử tự động (Unit Test Suite)
Chạy toàn bộ 18 test cases kiểm thử toán học, parser, gradient inheritance và serializer:
```bash
npm test
```
Hoặc mở giao diện đồ hoạ tương tác của Vitest:
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

## 5. Cấu trúc thư mục dự án

```text
SmartSVG/
├── .gitignore                      # Cấu hình bỏ qua file tạm và build artifacts
├── package.json                    # Khai báo dependencies và scripts
├── tsconfig.json                   # Cấu hình TypeScript chế độ nghiêm ngặt (Strict)
├── vite.config.ts                  # Cấu hình bundler Vite
├── vitest.config.ts                # Cấu hình môi trường kiểm thử Vitest (happy-dom)
├── README.md                       # Tài liệu hướng dẫn và kiến trúc chi tiết
│
├── svgEngine/                      # THƯ VIỆN CỐT LÕI (CORE ENGINE)
│   ├── spec/                       # Hằng số và định nghĩa chuẩn SVG
│   ├── core/                       # Toán học 2D, Path Commands, Style, Transforms, Paint
│   │   ├── math/                   # Vector2D, Matrix2D, BoundingBox
│   │   ├── values/                 # SVGLength, SVGAngle
│   │   ├── paint/                  # Color, IPaint, SolidPaint, Gradient, PaintFactory
│   │   ├── transforms/             # TransformList, Matrix, Translate, Rotate...
│   │   ├── style/                  # Style, Stroke, FontStyle
│   │   └── path/                   # PathData, PathCommand, Cubic, Quad, Arc, Line...
│   ├── ast/                        # Cây cú pháp trừu tượng AST (22+ node types)
│   │   ├── ast-node.ts             # Abstract base AST node
│   │   └── nodes/                  # RootNode, GroupNode, PathNode, ShapeNodes...
│   ├── parser/                     # Bộ phân tích cú pháp (Compiler)
│   │   ├── svg-parser.ts           # Phân giải DOM XML sang AST
│   │   ├── path-parser.ts          # Lexer và tokenizer chuỗi lệnh 'd'
│   │   ├── gradient-parser.ts      # Bộ kế thừa gradient đa tầng
│   │   ├── style-parser.ts         # Bộ phân tích style và CSS cascade
│   │   ├── css-stylesheet-parser.ts# Phân tích các quy tắc thẻ <style>
│   │   └── filter-parser.ts        # Phân tích bộ lọc <filter> primitives
│   ├── analyzer/                   # Bộ phân tích và thống kê số liệu
│   │   ├── svg-analyzer.ts         # Điều phối phân tích tổng
│   │   ├── complexity-analyzer.ts  # Phân tích độ phức tạp hình học
│   │   └── color-extractor.ts      # Bóc tách bảng màu đơn sắc và gradient
│   ├── serializer/                 # Xuất bản file
│   │   └── svg-serializer.ts       # Xuất chuỗi XML chuẩn và ảnh PNG
│   ├── viewer/                     # Điều khiển hiển thị Canvas và Artboard
│   │   └── viewport-controller.ts  # Quản lý Zoom, Pan, Fit, Artboard mode
│   ├── __tests__/                  # Bộ kiểm thử tự động (Unit Test Suite)
│   │   └── svg-engine.test.ts      # 18 test cases bao phủ toàn bộ engine
│   └── index.ts                    # Điểm xuất khẩu chính của svgEngine
│
└── playground/                     # GIAO DIỆN PHÒNG THÍ NGHIỆM ĐỒ HOẠ (Vite App)
    ├── index.html                  # Giao diện IDE: Toolbar, Canvas, Sidebar
    ├── style.css                   # Giao diện Dark Mode Studio
    └── main.ts                     # Điều phối toàn bộ sự kiện IDE tương tác
```

---

## 6. Bộ kiểm thử tự động (unit testing)

Dự án được bảo vệ bằng bộ kiểm thử tự động viết trên **Vitest** kết hợp môi trường giả lập DOM **happy-dom**, bao phủ các trường hợp biên quan trọng:

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

## 7. Bản quyền (license)

Dự án phát hành theo giấy phép **ISC License**. Tự do sử dụng và mở rộng cho mục đích học tập, nghiên cứu và phát triển thương mại.
