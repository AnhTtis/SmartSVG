// playground/main.ts
import {
  SVGParser,
  RootNode,
  ASTNode,
  SVGAnalyzer,
  SVGAnalysisReport,
  ViewportController,
  SVGSerializer,
  SolidColorPaint,
  Color,
} from '../svgEngine';

document.addEventListener('DOMContentLoaded', () => {
  console.log('SmartSVG Engine Studio ready.');

  let currentAstRoot: RootNode | null = null;
  let selectedNode: ASTNode | null = null;
  const undoStack: string[] = [];
  const redoStack: string[] = [];

  // 1. Khởi tạo Viewport Controller
  const viewport = new ViewportController('canvas-container', 'svg-stage', 'viewport-root');

  // 2. Chuyển đổi Tab (Statistics / Inspector)
  const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) {
        document.getElementById(targetTab)?.classList.add('active');
      }
    });
  });

  // 3. Toolbar Tools (Select vs Pan)
  const toolSelectBtn = document.getElementById('tool-select') as HTMLButtonElement;
  const toolPanBtn = document.getElementById('tool-pan') as HTMLButtonElement;

  toolSelectBtn?.addEventListener('click', () => {
    toolSelectBtn.classList.add('active');
    toolPanBtn.classList.remove('active');
    viewport.isPanToolActive = false;
  });

  toolPanBtn?.addEventListener('click', () => {
    toolPanBtn.classList.add('active');
    toolSelectBtn.classList.remove('active');
    viewport.isPanToolActive = true;
  });

  // 4. Background Paper Modes (White / Grid / Dark)
  const bgWhiteBtn = document.getElementById('bg-white') as HTMLButtonElement;
  const bgCheckerBtn = document.getElementById('bg-checker') as HTMLButtonElement;
  const bgDarkBtn = document.getElementById('bg-dark') as HTMLButtonElement;
  const bgBtns = [bgWhiteBtn, bgCheckerBtn, bgDarkBtn];

  bgWhiteBtn?.addEventListener('click', () => {
    bgBtns.forEach((b) => b.classList.remove('active'));
    bgWhiteBtn.classList.add('active');
    viewport.setBackgroundMode('white');
  });

  bgCheckerBtn?.addEventListener('click', () => {
    bgBtns.forEach((b) => b.classList.remove('active'));
    bgCheckerBtn.classList.add('active');
    viewport.setBackgroundMode('checkerboard');
  });

  bgDarkBtn?.addEventListener('click', () => {
    bgBtns.forEach((b) => b.classList.remove('active'));
    bgDarkBtn.classList.add('active');
    viewport.setBackgroundMode('dark');
  });

  // 5. Toolbar Zoom Controls
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    viewport.zoomIn();
    updateGizmo();
  });
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    viewport.zoomOut();
    updateGizmo();
  });
  document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
    viewport.fitToScreen();
    updateGizmo();
  });

  // 6. Coordinates Tracking in World Space
  const canvasContainer = document.getElementById('canvas-container');
  const statCoords = document.getElementById('stat-coords');

  canvasContainer?.addEventListener('mousemove', (e) => {
    const worldPoint = viewport.screenToWorld(e.clientX, e.clientY);
    if (statCoords) {
      statCoords.innerText = `X: ${Math.round(worldPoint.x)} | Y: ${Math.round(worldPoint.y)}`;
    }
  });

  // 7. Drag & Drop and File Input Handler
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer?.files.length) {
      loadSvgFile(e.dataTransfer.files[0]);
    }
  });

  dropZone?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) {
      loadSvgFile(fileInput.files[0]);
    }
  });

  // 8. Export Buttons
  document.getElementById('btn-export-svg')?.addEventListener('click', () => {
    if (currentAstRoot) {
      SVGSerializer.exportSVGFile(currentAstRoot, 'smartsvg_export.svg');
    } else {
      alert('No SVG document loaded.');
    }
  });

  document.getElementById('btn-export-png')?.addEventListener('click', async () => {
    if (currentAstRoot) {
      try {
        await SVGSerializer.exportPNG(currentAstRoot, 'smartsvg_export.png', 2);
      } catch (err: any) {
        alert(`Export PNG Error: ${err.message}`);
      }
    } else {
      alert('No SVG document loaded.');
    }
  });

  // 9. Undo / Redo
  const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
  const btnRedo = document.getElementById('btn-redo') as HTMLButtonElement;

  function pushUndoState() {
    if (currentAstRoot) {
      const xml = SVGSerializer.serialize(currentAstRoot, false);
      undoStack.push(xml);
      if (undoStack.length > 30) undoStack.shift();
      redoStack.length = 0;
    }
  }

  btnUndo?.addEventListener('click', () => {
    if (undoStack.length > 0 && currentAstRoot) {
      const currentXml = SVGSerializer.serialize(currentAstRoot, false);
      redoStack.push(currentXml);
      const prevXml = undoStack.pop()!;
      processSvgSource(prevXml, false);
    }
  });

  btnRedo?.addEventListener('click', () => {
    if (redoStack.length > 0 && currentAstRoot) {
      const currentXml = SVGSerializer.serialize(currentAstRoot, false);
      undoStack.push(currentXml);
      const nextXml = redoStack.pop()!;
      processSvgSource(nextXml, false);
    }
  });

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, V, H, 0, +, -)
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      btnUndo?.click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      btnRedo?.click();
    } else if (e.key === 'v' || e.key === 'V') {
      toolSelectBtn?.click();
    } else if (e.key === 'h' || e.key === 'H') {
      toolPanBtn?.click();
    } else if (e.key === '0') {
      viewport.fitToScreen();
      updateGizmo();
    } else if (e.key === '=' || e.key === '+') {
      viewport.zoomIn();
      updateGizmo();
    } else if (e.key === '-') {
      viewport.zoomOut();
      updateGizmo();
    }
  });

  function loadSvgFile(file: File) {
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Please select a valid .svg file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      processSvgSource(svgText, true);
    };
    reader.readAsText(file);
  }

  function processSvgSource(svgText: string, recordUndo: boolean = true) {
    try {
      // 1. Phân tích SVG thành cây AST hoàn chỉnh
      const astRoot = SVGParser.parse(svgText);
      currentAstRoot = astRoot;
      selectedNode = null;
      clearGizmo();
      updateInspector();

      if (recordUndo) {
        undoStack.length = 0;
        redoStack.length = 0;
      }

      // 2. Căn chỉnh Artboard Canvas
      viewport.setDocumentBounds(astRoot.viewBox);
      document.getElementById('stat-viewport')!.innerText = `${Math.round(astRoot.viewBox.width)} × ${Math.round(astRoot.viewBox.height)}`;

      // 3. Render các Node lên Canvas Scene Layer
      renderASTToWorkspace(astRoot);

      // 4. Phân tích chuyên sâu với SVGAnalyzer
      const report = SVGAnalyzer.analyze(astRoot);

      // 5. Cập nhật Báo cáo Thống kê lên UI
      renderStatistics(report);

      // 6. Cập nhật Cây Phân Cấp Scene Graph
      renderLayersTree(astRoot);
    } catch (err: any) {
      alert(`SVG Parse Error: ${err.message}`);
      console.error(err);
    }
  }

  function renderASTToWorkspace(root: RootNode) {
    const sceneLayer = document.getElementById('scene-layer') as unknown as SVGElement | null;
    if (!sceneLayer) return;

    sceneLayer.innerHTML = '';

    const svgStage = document.getElementById('svg-stage');
    if (svgStage) {
      let defsEl = svgStage.querySelector('defs');
      if (!defsEl) {
        defsEl = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgStage.insertBefore(defsEl, svgStage.firstChild);
      } else {
        const oldGradients = defsEl.querySelectorAll('linearGradient, radialGradient, clipPath, pattern, mask, marker, filter, symbol');
        oldGradients.forEach((g) => g.remove());
      }

      for (const def of root.defs.values()) {
        if ('renderDefDOM' in def && typeof (def as any).renderDefDOM === 'function') {
          defsEl.appendChild((def as any).renderDefDOM());
        } else if ('renderDOM' in def && typeof (def as any).renderDOM === 'function') {
          defsEl.appendChild((def as any).renderDOM());
        }
      }
    }

    const renderTreeNodes = (node: ASTNode, container: SVGElement) => {
      for (const child of node.children) {
        if (child.metadata.visible) {
          const el = child.renderDOM();
          // Gắn sự kiện click để select trên canvas
          el.addEventListener('click', (e) => {
            if (!viewport.isPanToolActive) {
              e.stopPropagation();
              selectNode(child);
            }
          });
          container.appendChild(el);
        }
      }
    };

    renderTreeNodes(root, sceneLayer);
  }

  function selectNode(node: ASTNode | null) {
    selectedNode = node;
    const statSelection = document.getElementById('stat-selection');
    if (statSelection) {
      statSelection.innerText = node ? `<${node.type}> #${node.id}` : 'None';
    }

    // Highlight trong scene tree
    document.querySelectorAll('.tree-item').forEach((item) => {
      if (item.getAttribute('data-node-id') === node?.id) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    updateGizmo();
    updateInspector();
  }

  // Click vào nền canvas để bỏ chọn
  canvasContainer?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'grid-background' || (e.target as HTMLElement).id === 'canvas-container' || (e.target as HTMLElement).id === 'artboard-paper') {
      selectNode(null);
    }
  });

  // 10. Selection Gizmo Overlay (Bounding Box + Handles)
  function clearGizmo() {
    const gizmoLayer = document.getElementById('gizmo-layer');
    if (gizmoLayer) gizmoLayer.innerHTML = '';
  }

  function updateGizmo() {
    const gizmoLayer = document.getElementById('gizmo-layer');
    if (!gizmoLayer) return;

    gizmoLayer.innerHTML = '';
    if (!selectedNode || !selectedNode.metadata.visible) return;

    try {
      const bbox = selectedNode.getGlobalBBox();
      if (bbox.width <= 0 && bbox.height <= 0) return;

      // Transform bbox to screen coordinates via viewport
      const p1 = viewport.worldToScreen(bbox.x, bbox.y);
      const p2 = viewport.worldToScreen(bbox.maxX, bbox.maxY);
      const w = p2.x - p1.x;
      const h = p2.y - p1.y;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.id = 'active-selection-gizmo';

      // Outline rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', p1.x.toString());
      rect.setAttribute('y', p1.y.toString());
      rect.setAttribute('width', w.toString());
      rect.setAttribute('height', h.toString());
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#6366f1');
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('stroke-dasharray', '4,4');
      group.appendChild(rect);

      // 8 Handles (NW, N, NE, E, SE, S, SW, W)
      const handleSize = 6;
      const handles = [
        { x: p1.x, y: p1.y },
        { x: p1.x + w / 2, y: p1.y },
        { x: p1.x + w, y: p1.y },
        { x: p1.x + w, y: p1.y + h / 2 },
        { x: p1.x + w, y: p1.y + h },
        { x: p1.x + w / 2, y: p1.y + h },
        { x: p1.x, y: p1.y + h },
        { x: p1.x, y: p1.y + h / 2 },
      ];

      for (const hPos of handles) {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        handle.setAttribute('x', (hPos.x - handleSize / 2).toString());
        handle.setAttribute('y', (hPos.y - handleSize / 2).toString());
        handle.setAttribute('width', handleSize.toString());
        handle.setAttribute('height', handleSize.toString());
        handle.setAttribute('fill', '#ffffff');
        handle.setAttribute('stroke', '#6366f1');
        handle.setAttribute('stroke-width', '1.5');
        group.appendChild(handle);
      }

      gizmoLayer.appendChild(group);
    } catch {
      // Ignore if bbox calculation not available
    }
  }

  // 11. Property Inspector Binding
  const propX = document.getElementById('prop-x') as HTMLInputElement;
  const propY = document.getElementById('prop-y') as HTMLInputElement;
  const propW = document.getElementById('prop-w') as HTMLInputElement;
  const propH = document.getElementById('prop-h') as HTMLInputElement;
  const propFill = document.getElementById('prop-fill') as HTMLInputElement;
  const propStroke = document.getElementById('prop-stroke') as HTMLInputElement;
  const propStrokeWidth = document.getElementById('prop-stroke-width') as HTMLInputElement;
  const propOpacity = document.getElementById('prop-opacity') as HTMLInputElement;

  function updateInspector() {
    if (!selectedNode) {
      [propX, propY, propW, propH, propFill, propStroke, propStrokeWidth, propOpacity].forEach((el) => {
        if (el) el.disabled = true;
      });
      return;
    }

    [propX, propY, propW, propH, propFill, propStroke, propStrokeWidth, propOpacity].forEach((el) => {
      if (el) el.disabled = false;
    });

    const bbox = selectedNode.getLocalBBox();
    if (propX) propX.value = Math.round(bbox.x).toString();
    if (propY) propY.value = Math.round(bbox.y).toString();
    if (propW) propW.value = Math.round(bbox.width).toString();
    if (propH) propH.value = Math.round(bbox.height).toString();

    // Fill
    if (propFill) {
      if (selectedNode.style.fill instanceof SolidColorPaint) {
        propFill.value = selectedNode.style.fill.color.toHex();
      }
    }

    // Stroke
    if (propStroke) {
      if (selectedNode.style.stroke.paint instanceof SolidColorPaint) {
        propStroke.value = selectedNode.style.stroke.paint.color.toHex();
      }
    }

    if (propStrokeWidth) propStrokeWidth.value = selectedNode.style.stroke.width.toString();
    if (propOpacity) propOpacity.value = selectedNode.style.opacity.toString();
  }

  // Inspector Input Event Listeners
  propFill?.addEventListener('input', () => {
    if (selectedNode && currentAstRoot) {
      pushUndoState();
      selectedNode.style.fill = new SolidColorPaint(Color.fromString(propFill.value));
      renderASTToWorkspace(currentAstRoot);
      updateGizmo();
    }
  });

  propStroke?.addEventListener('input', () => {
    if (selectedNode && currentAstRoot) {
      pushUndoState();
      selectedNode.style.stroke.paint = new SolidColorPaint(Color.fromString(propStroke.value));
      renderASTToWorkspace(currentAstRoot);
      updateGizmo();
    }
  });

  propStrokeWidth?.addEventListener('input', () => {
    if (selectedNode && currentAstRoot) {
      pushUndoState();
      selectedNode.style.stroke.width = parseFloat(propStrokeWidth.value) || 0;
      renderASTToWorkspace(currentAstRoot);
      updateGizmo();
    }
  });

  propOpacity?.addEventListener('input', () => {
    if (selectedNode && currentAstRoot) {
      pushUndoState();
      selectedNode.style.opacity = parseFloat(propOpacity.value) || 1;
      renderASTToWorkspace(currentAstRoot);
      updateGizmo();
    }
  });

  function renderStatistics(report: SVGAnalysisReport) {
    // 1. Node Distribution
    document.getElementById('val-total-nodes')!.innerText = report.nodes.totalNodes.toString();
    document.getElementById('val-paths')!.innerText = report.nodes.paths.toString();
    document.getElementById('val-groups')!.innerText = report.nodes.groups.toString();
    document.getElementById('val-shapes')!.innerText = report.nodes.shapes.total.toString();
    document.getElementById('val-gradients')!.innerText = report.nodes.defs.total.toString();
    document.getElementById('val-max-depth')!.innerText = report.nodes.maxDepth.toString();

    // 2. Palette
    document.getElementById('val-unique-colors')!.innerText = report.colors.length.toString();
    const paletteContainer = document.getElementById('stat-palette');
    if (paletteContainer) {
      paletteContainer.innerHTML = '';
      if (report.colors.length === 0) {
        paletteContainer.innerHTML = '<p class="empty-state">No color data</p>';
      } else {
        report.colors.forEach((colUsage) => {
          if (!colUsage.color.startsWith('url(')) {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = colUsage.hex;
            swatch.title = `${colUsage.color} (${colUsage.count} uses)`;
            paletteContainer.appendChild(swatch);
          }
        });
      }
    }

    // 3. Complexity & Geometry
    document.getElementById('val-vertices')!.innerText = report.complexity.totalVertices.toString();
    document.getElementById('val-linear-seg')!.innerText = report.complexity.linearSegments.toString();
    document.getElementById('val-cubic-beziers')!.innerText = report.complexity.cubicBeziers.toString();
    document.getElementById('val-quad-beziers')!.innerText = report.complexity.quadBeziers.toString();
    document.getElementById('val-arcs')!.innerText = report.complexity.arcs.toString();
    document.getElementById('val-bbox')!.innerText = `${Math.round(report.geometry.bounds.width)} × ${Math.round(report.geometry.bounds.height)}`;
    document.getElementById('val-aspect-ratio')!.innerText = report.geometry.bounds.aspectRatio.toString();

    // 4. Health & Optimization Suggestions
    const suggestionsContainer = document.getElementById('stat-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = '';
      if (report.suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<p class="empty-state" style="color: #10b981;">No optimization issues found.</p>';
      } else {
        report.suggestions.forEach((sug) => {
          const item = document.createElement('div');
          item.className = `suggestion-item ${sug.severity}`;
          item.innerText = sug.message;
          suggestionsContainer.appendChild(item);
        });
      }
    }
  }

  function renderLayersTree(root: RootNode) {
    const layersTree = document.getElementById('layers-tree');
    if (!layersTree) return;

    layersTree.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-list';

    const buildTree = (node: ASTNode, container: HTMLElement) => {
      const li = document.createElement('li');
      li.className = 'tree-item';
      li.setAttribute('data-node-id', node.id);
      li.innerHTML = `<span>&lt;${node.type}&gt; <small style="color: var(--text-muted); font-size: 11px;">#${node.id}</small></span>`;

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node);
      });

      container.appendChild(li);

      if (node.children.length > 0) {
        const subUl = document.createElement('ul');
        li.appendChild(subUl);
        for (const child of node.children) {
          buildTree(child, subUl);
        }
      }
    };

    for (const child of root.children) {
      buildTree(child, ul);
    }
    layersTree.appendChild(ul);
  }
});
