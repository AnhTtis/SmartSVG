// svgEngine/viewer/viewport-controller.ts
import { Vector2D } from '../core/math/vector2d';
import { Matrix2D } from '../core/math/matrix2d';
import { BoundingBox } from '../core/math/bbox';

export type BackgroundMode = 'white' | 'checkerboard' | 'dark' | 'transparent';

export interface ViewportState {
  zoom: number; // Tỉ lệ zoom (1.0 = 100%)
  pan: Vector2D; // Độ dời tX, tY
  bgMode: BackgroundMode;
}

export class ViewportController {
  private container: HTMLElement;
  public stageSvg: SVGSVGElement;
  private viewportRoot: SVGGElement;
  private artboardPaper!: SVGRectElement;
  private artboardBorder!: SVGRectElement;
  private zoomDisplay?: HTMLElement;

  public state: ViewportState = {
    zoom: 1.0,
    pan: new Vector2D(0, 0),
    bgMode: 'white',
  };

  public documentBounds: BoundingBox = new BoundingBox(0, 0, 800, 600);

  private isPanning: boolean = false;
  private startPanPoint: Vector2D = new Vector2D(0, 0);
  private initialPan: Vector2D = new Vector2D(0, 0);

  public isPanToolActive: boolean = false;
  public isSpacePressed: boolean = false;

  constructor(
    containerId: string = 'canvas-container',
    stageId: string = 'svg-stage',
    viewportRootId: string = 'viewport-root'
  ) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.stageSvg = document.getElementById(stageId) as unknown as SVGSVGElement;
    this.viewportRoot = document.getElementById(viewportRootId) as unknown as SVGGElement;
    this.zoomDisplay = document.getElementById('zoom-level') || undefined;

    // Khởi tạo Artboard Paper & Border nếu chưa có
    this.setupArtboardElements();
    this.bindEvents();
    this.updateTransform();
  }

  private setupArtboardElements() {
    let paper = this.viewportRoot.querySelector('#artboard-paper') as SVGRectElement;
    if (!paper) {
      paper = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      paper.id = 'artboard-paper';
      paper.setAttribute('fill', '#ffffff');
      paper.setAttribute('filter', 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.4))');
      this.viewportRoot.insertBefore(paper, this.viewportRoot.firstChild);
    }
    this.artboardPaper = paper;

    let border = this.viewportRoot.querySelector('#artboard-border') as SVGRectElement;
    if (!border) {
      border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      border.id = 'artboard-border';
      border.setAttribute('fill', 'none');
      border.setAttribute('stroke', '#6366f1');
      border.setAttribute('stroke-width', '1');
      border.setAttribute('stroke-opacity', '0.6');
      border.setAttribute('pointer-events', 'none');
      this.viewportRoot.appendChild(border);
    }
    this.artboardBorder = border;
  }

  public setDocumentBounds(viewBox: BoundingBox) {
    this.documentBounds = viewBox.clone();

    // Cập nhật kích thước khung Artboard Paper & Border
    this.artboardPaper.setAttribute('x', viewBox.x.toString());
    this.artboardPaper.setAttribute('y', viewBox.y.toString());
    this.artboardPaper.setAttribute('width', viewBox.width.toString());
    this.artboardPaper.setAttribute('height', viewBox.height.toString());

    this.artboardBorder.setAttribute('x', viewBox.x.toString());
    this.artboardBorder.setAttribute('y', viewBox.y.toString());
    this.artboardBorder.setAttribute('width', viewBox.width.toString());
    this.artboardBorder.setAttribute('height', viewBox.height.toString());

    this.fitToScreen();
  }

  public setBackgroundMode(mode: BackgroundMode) {
    this.state.bgMode = mode;
    switch (mode) {
      case 'white':
        this.artboardPaper.setAttribute('fill', '#ffffff');
        this.artboardPaper.style.display = 'block';
        break;
      case 'checkerboard':
        this.artboardPaper.setAttribute('fill', 'url(#checker-pattern)');
        this.artboardPaper.style.display = 'block';
        break;
      case 'dark':
        this.artboardPaper.setAttribute('fill', '#18181c');
        this.artboardPaper.style.display = 'block';
        break;
      case 'transparent':
        this.artboardPaper.style.display = 'none';
        break;
    }
  }

  public zoomAtPoint(factor: number, screenPoint: Vector2D) {
    const newZoom = Math.max(0.05, Math.min(32, this.state.zoom * factor));
    const containerRect = this.container.getBoundingClientRect();
    const cursor = screenPoint.subtract(new Vector2D(containerRect.left, containerRect.top));

    // Tính toán lại vị trí pan để điểm dưới con trỏ chuột đứng yên
    const currentWorld = cursor.subtract(this.state.pan).scale(1 / this.state.zoom);
    const newPan = cursor.subtract(currentWorld.scale(newZoom));

    this.state.zoom = newZoom;
    this.state.pan = newPan;
    this.updateTransform();
  }

  public zoomIn() {
    const rect = this.container.getBoundingClientRect();
    this.zoomAtPoint(1.2, new Vector2D(rect.left + rect.width / 2, rect.top + rect.height / 2));
  }

  public zoomOut() {
    const rect = this.container.getBoundingClientRect();
    this.zoomAtPoint(1 / 1.2, new Vector2D(rect.left + rect.width / 2, rect.top + rect.height / 2));
  }

  public fitToScreen() {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    const docWidth = this.documentBounds.width || 800;
    const docHeight = this.documentBounds.height || 600;

    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / docWidth;
    const scaleY = (containerHeight - padding * 2) / docHeight;
    const zoom = Math.min(scaleX, scaleY, 2.0);

    const panX = (containerWidth - docWidth * zoom) / 2 - this.documentBounds.x * zoom;
    const panY = (containerHeight - docHeight * zoom) / 2 - this.documentBounds.y * zoom;

    this.state.zoom = zoom;
    this.state.pan = new Vector2D(panX, panY);
    this.updateTransform();
  }

  public screenToWorld(clientX: number, clientY: number): Vector2D {
    const rect = this.container.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return new Vector2D(
      (screenX - this.state.pan.x) / this.state.zoom,
      (screenY - this.state.pan.y) / this.state.zoom
    );
  }

  public worldToScreen(worldX: number, worldY: number): Vector2D {
    return new Vector2D(
      worldX * this.state.zoom + this.state.pan.x,
      worldY * this.state.zoom + this.state.pan.y
    );
  }

  private updateTransform() {
    const matrix = Matrix2D.translation(this.state.pan.x, this.state.pan.y)
      .multiply(Matrix2D.scaling(this.state.zoom, this.state.zoom));

    this.viewportRoot.setAttribute('transform', matrix.toSVGString());

    if (this.zoomDisplay) {
      this.zoomDisplay.innerText = `${Math.round(this.state.zoom * 100)}%`;
    }
  }

  private bindEvents() {
    // 1. Phóng to thu nhỏ bằng con lăn chuột (Mouse Wheel Zoom)
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoomAtPoint(zoomFactor, new Vector2D(e.clientX, e.clientY));
    }, { passive: false });

    // 2. Kéo rê Canvas (Pan)
    this.container.addEventListener('mousedown', (e) => {
      if (e.button === 1 || this.isSpacePressed || this.isPanToolActive) {
        e.preventDefault();
        this.isPanning = true;
        this.startPanPoint = new Vector2D(e.clientX, e.clientY);
        this.initialPan = this.state.pan.clone();
        this.container.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const delta = new Vector2D(e.clientX, e.clientY).subtract(this.startPanPoint);
        this.state.pan = this.initialPan.add(delta);
        this.updateTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.container.style.cursor = this.isPanToolActive || this.isSpacePressed ? 'grab' : 'default';
      }
    });

    // 3. Phím Space để kích hoạt Pan tức thì
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isSpacePressed && (e.target as HTMLElement).tagName !== 'INPUT') {
        this.isSpacePressed = true;
        this.container.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        if (!this.isPanning) {
          this.container.style.cursor = this.isPanToolActive ? 'grab' : 'default';
        }
      }
    });
  }
}
