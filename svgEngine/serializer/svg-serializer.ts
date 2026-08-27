// svgEngine/serializer/svg-serializer.ts
import { RootNode } from '../ast/nodes/root-node';

export class SVGSerializer {
  /**
   * Chuyển đổi AST RootNode thành chuỗi XML SVG chuẩn
   */
  static serialize(root: RootNode, pretty: boolean = true): string {
    const domEl = root.renderDOM();
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(domEl);

    if (pretty) {
      xml = this.formatXML(xml);
    }

    return xml;
  }

  /**
   * Xuất SVG thành file blob để tải về (.svg)
   */
  static exportSVGFile(root: RootNode, filename: string = 'graphic.svg'): void {
    const xml = this.serialize(root, true);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Xuất SVG thành ảnh raster PNG với độ phân giải tùy chọn (scale/DPI)
   */
  static async exportPNG(
    root: RootNode,
    filename: string = 'graphic.png',
    scale: number = 2
  ): Promise<void> {
    const xml = this.serialize(root, false);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const width = (root.viewBox.width || root.width.value) * scale;
        const height = (root.viewBox.height || root.height.value) * scale;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Cannot create 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('PNG conversion failed'));
            return;
          }
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, 'image/png');
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  }

  /**
   * Helper format XML thụt đầu dòng đẹp mắt
   */
  private static formatXML(xml: string): string {
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;

    xml = xml.replace(reg, '$1\r\n$2$3');
    const lines = xml.split('\r\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      formatted += PADDING.repeat(pad) + line + '\n';
      pad += indent;
    }

    return formatted.trim();
  }
}
