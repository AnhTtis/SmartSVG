# SmartSVG Engine & Vector Graphics Studio

> Thư viện SVG Engine chuẩn W3C SVG 1.1 và SVG 2 được viết hoàn toàn bằng TypeScript từ con số 0, tích hợp công cụ đồ hoạ vector tương tác thời gian thực.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-729B1B.svg)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen.svg)](#6-bộ-kiểm-thử-tự-động-unit-testing)
[![W3C Spec](https://img.shields.io/badge/W3C-SVG%201.1%20%2F%20SVG%202-orange.svg)](https://www.w3.org/TR/SVG2/)

---

## Mục lục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Cơ sở toán học và giải thuật hình học chuẩn xác](#2-cơ-sở-toán-học-và-giải-thuật-hình-học-chuẩn-xác)
   - [2.1. Phân rã elliptical arc sang cubic Bézier (chuẩn W3C F.6)](#21-phân-rã-elliptical-arc-sang-cubic-bézier-chuẩn-w3c-f6)
   - [2.2. Tính toán tight bounding box qua nghiệm đạo hàm giải tích](#22-tính-toán-tight-bounding-box-qua-nghiệm-đạo-hàm-giải-tích)
   - [2.3. Nâng bậc đường cong quadratic sang cubic Bézier](#23-nâng-bậc-đường-cong-quadratic-sang-cubic-bézier)
   - [2.4. Phản chiếu điểm điều khiển cho các lệnh mượt (S/s và T/t)](#24-phản-chiếu-điểm-điều-khiển-cho-các-lệnh-mượt-ss-và-tt)
   - [2.5. Đại số tuyến tính ma trận biến đổi affine 2D](#25-đại-số-tuyến-tính-ma-trận-biến-đổi-affine-2d)
3. [Kiến trúc hướng đối tượng (OOP) và mẫu thiết kế (design patterns)](#3-kiến-trúc-hướng-đối-tượng-oop-và-mẫu-thiết-kế-design-patterns)
   - [3.1. Bốn trụ cột lập trình hướng đối tượng](#31-bốn-trụ-cột-lập-trình-hướng-đối-tượng)
   - [3.2. Chi tiết các mẫu thiết kế (design patterns) trong hệ thống](#32-chi-tiết-các-mẫu-thiết-kế-design-patterns-trong-hệ-thống)
4. [Hướng dẫn cài đặt và chạy dự án](#4-hướng-dẫn-cài-đặt-và-chạy-dự-án)
5. [Cấu trúc thư mục dự án](#5-cấu-trúc-thư-mục-dự-án)
6. [Bộ kiểm thử tự động (unit testing)](#6-bộ-kiểm-thử-tự-động-unit-testing)
7. [Bản quyền (license)](#7-bản-quyền-license)

---

## 1. Giới thiệu tổng quan

SmartSVG là hệ thống SVG Engine thuần TypeScript, được xây dựng theo kiến trúc **trình biên dịch và cây cú pháp trừu tượng (Compiler & AST Scene Graph)**. Engine đảm bảo tính chuẩn xác về toán học giải tích, bao phủ toàn bộ các nhóm lệnh đường cong, các phép biến đổi ma trận 2D, cơ chế kế thừa màu gradient đa tầng và phân cấp ưu tiên CSS của chuẩn W3C SVG 1.1 và SVG 2.

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

## 2. Cơ sở toán học và giải thuật hình học chuẩn xác

### 2.1. Phân rã elliptical arc sang cubic Bézier (chuẩn W3C F.6)

Một cung elip trong SVG được xác định bởi điểm xuất phát $`\mathbf{P}_1 = (x_1, y_1)`$, điểm kết thúc $`\mathbf{P}_2 = (x_2, y_2)`$, bán kính trục $`(r_x, r_y)`$, góc nghiêng trục $`\phi`$, cờ cung lớn $`f_A \in \{0, 1\}`$ và cờ hướng quét $`f_S \in \{0, 1\}`$.

Giải thuật W3C Appendix F.6 chuyển đổi từ tham số điểm cuối sang tham số tâm $`(c_x, c_y, \theta_1, \Delta\theta)`$ và phân rã thành chuỗi đường cong cubic Bézier:

1. **Chuyển toạ độ sai phân sang hệ trục elip quay:**

   ```math
   \begin{bmatrix} x_1' \\ y_1' \end{bmatrix} = \begin{bmatrix} \cos\phi & \sin\phi \\ -\sin\phi & \cos\phi \end{bmatrix} \begin{bmatrix} \frac{x_1 - x_2}{2} \\ \frac{y_1 - y_2}{2} \end{bmatrix}
   ```

2. **Kiểm tra và tự động co giãn bán kính nếu không đủ lớn:**

   ```math
   \Lambda = \frac{(x_1')^2}{r_x^2} + \frac{(y_1')^2}{r_y^2}
   ```

   Nếu $`\Lambda > 1`$, cung elip không thể đi qua hai điểm với bán kính hiện tại. Chuẩn W3C quy định tự động co giãn:

   ```math
   r_x \leftarrow \sqrt{\Lambda} \, r_x, \quad r_y \leftarrow \sqrt{\Lambda} \, r_y
   ```

3. **Tính toạ độ tâm trong hệ trục quay $`(c_x', c_y')`$:**

   ```math
   \begin{bmatrix} c_x' \\ c_y' \end{bmatrix} = \pm \sqrt{\max\left(0, \frac{r_x^2 r_y^2 - r_x^2 (y_1')^2 - r_y^2 (x_1')^2}{r_x^2 (y_1')^2 + r_y^2 (x_1')^2}\right)} \begin{bmatrix} \frac{r_x y_1'}{r_y} \\ -\frac{r_y x_1'}{r_x} \end{bmatrix}
   ```

   Quy tắc dấu: Chọn dấu $`+`$ nếu $`f_A \neq f_S`$, chọn dấu $`-`$ nếu $`f_A = f_S`$.

4. **Chuyển tâm về hệ toạ độ thế giới ban đầu $`(c_x, c_y)`$:**

   ```math
   \begin{bmatrix} c_x \\ c_y \end{bmatrix} = \begin{bmatrix} \cos\phi & -\sin\phi \\ \sin\phi & \cos\phi \end{bmatrix} \begin{bmatrix} c_x' \\ c_y' \end{bmatrix} + \begin{bmatrix} \frac{x_1 + x_2}{2} \\ \frac{y_1 + y_2}{2} \end{bmatrix}
   ```

5. **Xác định góc bắt đầu $`\theta_1`$ và góc quét $`\Delta\theta`$:**

   Hàm tính góc có dấu giữa hai vector 2D $`\mathbf{u}`$ và $`\mathbf{v}`$:

   ```math
   \operatorname{angle}(\mathbf{u}, \mathbf{v}) = \operatorname{sign}(u_x v_y - u_y v_x) \cdot \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right)
   ```

   Từ đó tính góc bắt đầu và góc quét:

   ```math
   \theta_1 = \operatorname{angle}\left(\begin{bmatrix} 1 \\ 0 \end{bmatrix}, \begin{bmatrix} \frac{x_1' - c_x'}{r_x} \\ \frac{y_1' - c_y'}{r_y} \end{bmatrix}\right), \quad \Delta\theta = \operatorname{angle}\left(\begin{bmatrix} \frac{x_1' - c_x'}{r_x} \\ \frac{y_1' - c_y'}{r_y} \end{bmatrix}, \begin{bmatrix} \frac{-x_1' - c_x'}{r_x} \\ \frac{-y_1' - c_y'}{r_y} \end{bmatrix}\right)
   ```

   Hiệu chỉnh góc quét theo cờ $`f_S`$:
   - Nếu $`f_S = 0`$ và $`\Delta\theta > 0`$, thì $`\Delta\theta \leftarrow \Delta\theta - 2\pi`$.
   - Nếu $`f_S = 1`$ và $`\Delta\theta < 0`$, thì $`\Delta\theta \leftarrow \Delta\theta + 2\pi`$.

6. **Phân đoạn và xấp xỉ bằng cubic Bézier:**

   Cung được chia thành $`N = \lceil |\Delta\theta| / (\pi/2) \rceil`$ phân đoạn góc nhỏ $`\delta = \Delta\theta / N`$.

   Hệ số khoảng cách điểm điều khiển:

   ```math
   \alpha = \frac{4}{3} \tan\left(\frac{\delta}{4}\right)
   ```

   Với mỗi góc $`\theta`$, toạ độ điểm trên elip và đạo hàm tiếp tuyến:

   ```math
   \mathbf{P}(\theta) = \begin{bmatrix} c_x + r_x \cos\theta \cos\phi - r_y \sin\theta \sin\phi \\ c_y + r_x \cos\theta \sin\phi + r_y \sin\theta \cos\phi \end{bmatrix}, \quad \mathbf{P}'(\theta) = \begin{bmatrix} -r_x \sin\theta \cos\phi - r_y \cos\theta \sin\phi \\ -r_x \sin\theta \sin\phi + r_y \cos\theta \cos\phi \end{bmatrix}
   ```

   Hai điểm điều khiển cho từng phân đoạn từ $`\theta`$ đến $`\theta + \delta`$:

   ```math
   \mathbf{CP}_1 = \mathbf{P}(\theta) + \alpha \mathbf{P}'(\theta), \quad \mathbf{CP}_2 = \mathbf{P}(\theta + \delta) - \alpha \mathbf{P}'(\theta + \delta)
   ```

---

### 2.2. Tính toán tight bounding box qua nghiệm đạo hàm giải tích

Hộp bao chính xác (tight axis-aligned bounding box) của đường cong Bézier không thể lấy từ hộp bao của các điểm điều khiển (control hull) do phần lồi thực tế của đường cong thường nhỏ hơn đa giác điều khiển. Hệ thống tìm nghiệm giải tích của phương trình đạo hàm $`\mathbf{B}'(t) = \mathbf{0}`$ trên khoảng mở $`t \in (0, 1)`$:

#### Đối với Quadratic Bézier:

Phương trình tham số bậc hai:

```math
\mathbf{B}(t) = (1-t)^2 \mathbf{P}_0 + 2(1-t)t \mathbf{P}_1 + t^2 \mathbf{P}_2, \quad t \in [0, 1]
```

Đạo hàm bậc nhất theo $`t`$:

```math
\mathbf{B}'(t) = 2(1-t)(\mathbf{P}_1 - \mathbf{P}_0) + 2t(\mathbf{P}_2 - \mathbf{P}_1) = 2(\mathbf{P}_0 - 2\mathbf{P}_1 + \mathbf{P}_2)t + 2(\mathbf{P}_1 - \mathbf{P}_0)
```

Nghiệm cực trị trên từng trục độc lập:

```math
t^* = \frac{P_0 - P_1}{P_0 - 2P_1 + P_2}
```

Nếu mẫu số khác không và $`t^* \in (0, 1)`$, giá trị $`\mathbf{B}(t^*)`$ được đưa vào tập điểm ứng viên cùng với $`\mathbf{B}(0)`$ và $`\mathbf{B}(1)`$ để lấy $`\min`$ và $`\max`$.

#### Đối với Cubic Bézier:

Phương trình tham số bậc ba:

```math
\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t)t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3, \quad t \in [0, 1]
```

Đạo hàm bậc nhất theo $`t`$:

```math
\mathbf{B}'(t) = 3(1-t)^2(\mathbf{P}_1 - \mathbf{P}_0) + 6(1-t)t(\mathbf{P}_2 - \mathbf{P}_1) + 3t^2(\mathbf{P}_3 - \mathbf{P}_2) = \mathbf{A} t^2 + \mathbf{B} t + \mathbf{C} = \mathbf{0}
```

Trong đó các hệ số cho từng trục:

```math
\begin{cases} A = 3(-P_0 + 3P_1 - 3P_2 + P_3) \\ B = 6(P_0 - 2P_1 + P_2) \\ C = 3(P_1 - P_0) \end{cases}
```

1. Nếu $`A = 0`$ và $`B \neq 0`$: nghiệm suy biến phương trình bậc nhất $`t = -C / B`$.
2. Nếu $`A \neq 0`$: biệt thức $`\Delta = B^2 - 4AC`$. Nếu $`\Delta \ge 0`$, hai nghiệm là:

   ```math
   t_{1, 2} = \frac{-B \pm \sqrt{\Delta}}{2A}
   ```

Tất cả các nghiệm $`t_k \in (0, 1)`$ cùng với $`t = 0`$ và $`t = 1`$ tạo thành tập giá trị cực trị giải tích để tính chính xác biên $`[x_{\min}, x_{\max}] \times [y_{\min}, y_{\max}]`$.

---

### 2.3. Nâng bậc đường cong quadratic sang cubic Bézier

Để thống nhất biểu diễn hình học, đường cong bậc hai với các điểm $`(\mathbf{P}_0, \mathbf{P}_1, \mathbf{P}_2)`$ được nâng bậc chính xác thành đường cong bậc ba $`(\mathbf{C}_0, \mathbf{C}_1, \mathbf{C}_2, \mathbf{C}_3)`$ bằng cách nhân với đa thức đồng nhất $`(1-t) + t = 1`$:

```math
\mathbf{C}_0 = \mathbf{P}_0, \quad \mathbf{C}_1 = \mathbf{P}_0 + \frac{2}{3}(\mathbf{P}_1 - \mathbf{P}_0), \quad \mathbf{C}_2 = \mathbf{P}_2 + \frac{2}{3}(\mathbf{P}_1 - \mathbf{P}_2), \quad \mathbf{C}_3 = \mathbf{P}_2
```

---

### 2.4. Phản chiếu điểm điều khiển cho các lệnh mượt (S/s và T/t)

Đối với các lệnh cong tiếp tuyến mượt `S`/`s` (cubic) và `T`/`t` (quadratic), điểm điều khiển đầu tiên $`\mathbf{CP}_{\text{reflected}}`$ được lấy đối xứng qua điểm hiện tại $`\mathbf{P}_0`$ từ điểm điều khiển cuối cùng $`\mathbf{CP}_{\text{last}}`$ của lệnh liền trước:

```math
\mathbf{CP}_{\text{reflected}} = \mathbf{P}_0 + (\mathbf{P}_0 - \mathbf{CP}_{\text{last}}) = 2 \mathbf{P}_0 - \mathbf{CP}_{\text{last}}
```

Nếu lệnh liền trước không phải là lệnh cong cùng bậc, điểm phản chiếu suy biến thành chính $`\mathbf{P}_0`$.

---

### 2.5. Đại số tuyến tính ma trận biến đổi affine 2D

Mọi phép biến đổi phẳng 2D (tịnh tiến, quay, co giãn, xiên trục) được mô tả qua ma trận toạ độ thuần nhất $`3 \times 3`$:

```math
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & c & e \\ b & d & f \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} \iff \begin{cases} x' = ax + cy + e \\ y' = bx + dy + f \end{cases}
```

Định thức ma trận là $`\det(M) = ad - bc`$. Ma trận nghịch đảo $`M^{-1}`$ tồn tại khi và chỉ khi $`\det(M) \neq 0`$:

```math
M^{-1} = \begin{bmatrix} \frac{d}{ad - bc} & \frac{-c}{ad - bc} & \frac{cf - de}{ad - bc} \\ \frac{-b}{ad - bc} & \frac{a}{ad - bc} & \frac{be - af}{ad - bc} \\ 0 & 0 & 1 \end{bmatrix}
```

Phép nhân hai ma trận biến đổi $`M_1 \times M_2`$ tương ứng với việc áp dụng phép biến đổi $`M_2`$ trước, sau đó áp dụng phép biến đổi $`M_1`$.

---

## 3. Kiến trúc hướng đối tượng (OOP) và mẫu thiết kế (design patterns)

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

### 3.1. Bốn trụ cột lập trình hướng đối tượng

#### 1. Tính đóng gói (Encapsulation)
- **Quản lý trạng thái nội tại:** Các đối tượng value object như `Vector2D`, `Matrix2D`, `BoundingBox`, `Color`, `SVGLength` bảo vệ dữ liệu nội tại và trả về bản sao mới khi tính toán, đảm bảo tính bất biến (immutability).
- **Ẩn giấu giải thuật phức tạp:** Thuật toán W3C F.6 và nghiệm đạo hàm tìm hộp bao được đóng gói trọn vẹn trong các phương thức của `ArcCommand`, `CubicBezierCommand`, `QuadBezierCommand`. Người dùng chỉ cần gọi `.getBounds()` hoặc `.toCubicBeziers()` mà không cần can thiệp vào các biến trung gian.
- **Phân tách ba tầng dữ liệu trong ASTNode:** Mỗi node phân tách độc lập ba khối:
  - `Geometry`: Toạ độ, kích thước, danh sách lệnh path, ma trận cục bộ.
  - `Style`: Màu fill, stroke, strokeWidth, opacity, fontStyle.
  - `Metadata`: id, className, attributes mở rộng, trạng thái tương tác.

#### 2. Tính kế thừa (Inheritance)
- **Hệ thống phân cấp ASTNode:**
  - `ASTNode` (`ast/ast-node.ts`) là abstract base class định nghĩa toàn bộ giao diện chung: quản lý cây cha-con (`parent`, `children`, `addChild`, `removeChild`), nhân dồn ma trận toạ độ thế giới (`getWorldTransform()`), tính hộp bao thế giới (`getWorldBounds()`), clone sâu (`clone()`), và duyệt cây đệ quy (`traverse()`).
  - Các lớp kế thừa chuyên biệt hoá:
    - Nhóm chứa container: `RootNode` (`<svg>`), `GroupNode` (`<g>`), `SymbolNode` (`<symbol>`), `AnchorNode` (`<a>`).
    - Nhóm hình học cơ bản: `RectNode`, `CircleNode`, `EllipseNode`, `LineNode`, `PolylineNode`, `PolygonNode`.
    - Nhóm đường cong: `PathNode`.
    - Nhóm văn bản: `TextNode`, `TSpanNode`, `TextPathNode`.
    - Nhóm định nghĩa và hiệu ứng: `ClipPathNode`, `MaskNode`, `FilterNode`, `MarkerNode`, `PatternNode`, `UseNode`, `ForeignObjectNode`.
- **Hệ thống phân cấp PathCommand:**
  - `PathCommand` (`core/path/path-command.ts`) là abstract base class cho 10 class lệnh: `MoveToCommand`, `LineToCommand`, `CubicBezierCommand`, `QuadBezierCommand`, `ArcCommand`, `ClosePathCommand`.
- **Hệ thống phân cấp Gradient Paint:**
  - `BaseGradientPaint` là abstract class quản lý danh sách `GradientStop`, `spreadMethod`, `gradientUnits`, `gradientTransform` cho hai lớp con `LinearGradientPaint` và `RadialGradientPaint`.

#### 3. Tính đa hình (Polymorphism)
- **Đa hình phương thức hình học:** Phương thức `getBounds(currentPoint: Vector2D): BoundingBox` và `transform(matrix: Matrix2D)` được định nghĩa trừu tượng ở `PathCommand` và được ghi đè (override) riêng biệt trên từng lệnh `CubicBezierCommand` (nghiệm đạo hàm bậc 2), `QuadBezierCommand` (nghiệm đạo hàm bậc 1), `ArcCommand` (phân rã Bézier), và `LineToCommand` (đoạn thẳng).
- **Đa hình hệ thống màu vẽ (`IPaint`):** Các class `SolidPaint`, `NonePaint`, `CurrentColorPaint`, `LinearGradientPaint`, `RadialGradientPaint` cùng hiện thực giao diện `IPaint`. Tầng Renderer và Serializer gọi `.toSVGString()` hoặc `.isTransparent()` một cách đồng nhất mà không cần kiểm tra kiểu dữ liệu thủ công bằng `if/else`.
- **Đa hình hệ thống biến đổi (`ITransform`):** Các lớp `TranslateTransform`, `ScaleTransform`, `RotateTransform`, `SkewTransform`, `MatrixTransform` cùng hiện thực phương thức `toMatrix(): Matrix2D`.

#### 4. Tính trừu tượng (Abstraction)
- Tách rời hoàn toàn giữa cấu trúc biểu diễn hình học (`ASTNode`) với cơ chế render DOM (`DOMRenderer`), cơ chế phân tích thống kê (`SVGAnalyzer`), và cơ chế xuất file (`SVGSerializer`).
- Các interface `IPaint`, `ITransform`, `SVGDefItem` đóng vai trò bản giao ước trừu tượng (contracts), cho phép mở rộng thêm các loại bộ lọc filter hoặc kiểu màu mới mà không làm thay đổi lõi hệ thống.

---

### 3.2. Chi tiết các mẫu thiết kế (design patterns) trong hệ thống

#### 1. Composite Pattern (Cây Scene Graph và chuỗi biến đổi Transform)
- **Cây Scene Graph:** `RootNode` và `GroupNode` đóng vai trò Composite chứa mảng `children: ASTNode[]`. Các node lá như `PathNode`, `RectNode`, `CircleNode` đóng vai trò Leaf. Các phương thức như `traverse()`, `getWorldTransform()`, và `clone()` xử lý đệ quy trong suốt trên toàn bộ cấu trúc cây.
- **Chuỗi phép biến đổi:** `TransformList` đóng vai trò Composite chứa nhiều đối tượng đơn lẻ `ITransform`, cho phép gom nhóm và nhân ma trận dồn từ phải sang trái.

#### 2. Command Pattern (Đa hình phân đoạn Path và lịch sử Undo/Redo)
- **Lệnh hình học:** Mỗi phân đoạn trong thuộc tính `d` của thẻ `<path>` là một đối tượng Command độc lập (`MoveToCommand`, `LineToCommand`, `CubicBezierCommand`, `ArcCommand`...), tự chịu trách nhiệm biến đổi toạ độ và sinh chuỗi SVG.
- **Quản lý hoàn tác:** `HistoryManager` lưu trữ ngăn xếp các đối tượng lệnh thao tác chỉnh sửa, cho phép thực thi `undo()` và `redo()` thông qua các phím tắt `Ctrl + Z`, `Ctrl + Y`.

#### 3. Strategy & Factory Pattern (Hệ thống màu vẽ Paint)
- **Strategy:** `IPaint` là Strategy interface đại diện cho thuật toán tô màu và sinh mã SVG. Từng đối tượng màu (`SolidPaint`, `LinearGradientPaint`, `RadialGradientPaint`, `NonePaint`) đóng gói thuật toán tô màu tương ứng.
- **Factory:** `PaintFactory.create(value, defsRegistry)` đóng vai trò Factory method tiếp nhận chuỗi đầu vào bất kỳ (màu hex, rgb, hsl, tên màu W3C, `url(#id)`, `currentColor`) và trả về đúng đối tượng `IPaint` tương ứng.

#### 4. Visitor Pattern (Bộ phân tích số liệu Analyzer)
- `ComplexityAnalyzer` và `ColorExtractor` đóng vai trò Visitor duyệt qua toàn bộ cây AST thông qua phương thức `traverse(callback)`. Visitor bóc tách các chỉ số thống kê (tổng số đỉnh, số đoạn cong Bézier, diện tích bao phủ, bảng màu và gradient stops) mà không làm ô nhiễm hoặc thay đổi cấu trúc dữ liệu của các `ASTNode`.

#### 5. Façade Pattern (Giao diện đơn giản hoá của Parser và Serializer)
- `SVGParser` đóng vai trò Façade cung cấp một điểm gọi duy nhất `SVGParser.parse(svgString)`. Bên trong, Façade điều phối `DOMParser`, `PathParser` (lexer/tokenizer), `GradientParser` (giải quyết kế thừa DAG), `CSSStylesheetParser` (phân giải quy tắc CSS), và `StyleParser` (tính toán cascading).
- `SVGSerializer` cung cấp API đơn giản `SVGSerializer.serialize(rootNode)` che giấu toàn bộ quá trình duyệt cây và định dạng chuỗi XML.

#### 6. Registry Pattern (Kho quản lý định nghĩa Defs)
- Quản lý các định nghĩa dùng lại trong thẻ `<defs>` (gradient, clipPath, mask, marker, pattern, filter) theo bảng ánh xạ mã định danh ID, hỗ trợ các phần tử hình học liên kết nhanh thông qua cú pháp `url(#id)`.

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
