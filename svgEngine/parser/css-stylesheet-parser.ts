// svgEngine/parser/css-stylesheet-parser.ts

export interface CSSRuleMap {
  classes: Map<string, Record<string, string>>; // .class-name -> { fill: '#fff', ... }
  ids: Map<string, Record<string, string>>;     // #id-name -> { stroke: '#000', ... }
  tags: Map<string, Record<string, string>>;    // tag-name -> { opacity: '0.5', ... }
}

export class CSSStylesheetParser {
  /**
   * Phân tích tất cả các thẻ <style> bên trong tài liệu SVG
   */
  static parse(svgDoc: Document | Element): CSSRuleMap {
    const ruleMap: CSSRuleMap = {
      classes: new Map(),
      ids: new Map(),
      tags: new Map(),
    };

    const styleTags = svgDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      const cssText = styleTag.textContent || '';
      this.parseCSSText(cssText, ruleMap);
    });

    return ruleMap;
  }

  private static parseCSSText(cssText: string, ruleMap: CSSRuleMap) {
    // Loại bỏ comment /* ... */ và CDATA
    const cleanCSS = cssText
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .trim();

    // Tách các rule block: selector { declarations }
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(cleanCSS)) !== null) {
      const selectorGroup = match[1].trim();
      const declarationBlock = match[2].trim();

      const declarations = this.parseDeclarations(declarationBlock);
      if (Object.keys(declarations).length === 0) continue;

      // Xử lý nhóm selector phân tách bởi dấu phẩy
      const selectors = selectorGroup.split(',').map((s) => s.trim());
      for (const sel of selectors) {
        if (!sel) continue;

        if (sel.startsWith('.')) {
          // Class selector: .cls-1
          const className = sel.substring(1).trim();
          ruleMap.classes.set(className, {
            ...(ruleMap.classes.get(className) || {}),
            ...declarations,
          });
        } else if (sel.startsWith('#')) {
          // ID selector: #layer-1
          const idName = sel.substring(1).trim();
          ruleMap.ids.set(idName, {
            ...(ruleMap.ids.get(idName) || {}),
            ...declarations,
          });
        } else if (/^[a-z0-9_-]+$/i.test(sel)) {
          // Tag selector: path, rect, circle
          const tagName = sel.toLowerCase();
          ruleMap.tags.set(tagName, {
            ...(ruleMap.tags.get(tagName) || {}),
            ...declarations,
          });
        }
      }
    }
  }

  private static parseDeclarations(declarationBlock: string): Record<string, string> {
    const decls: Record<string, string> = {};
    const rules = declarationBlock.split(';').map((r) => r.trim());

    for (const rule of rules) {
      if (!rule) continue;
      const colonIndex = rule.indexOf(':');
      if (colonIndex === -1) continue;

      const prop = rule.substring(0, colonIndex).trim().toLowerCase();
      const val = rule.substring(colonIndex + 1).trim();
      if (prop && val) {
        decls[prop] = val;
      }
    }

    return decls;
  }

  /**
   * Lấy tất cả thuộc tính CSS khớp với một phần tử SVG DOM cụ thể theo thứ tự ưu tiên
   */
  static getMatchedRules(el: SVGElement, ruleMap: CSSRuleMap): Record<string, string> {
    const matched: Record<string, string> = {};

    // 1. Tag selector (độ ưu tiên thấp nhất)
    const tagName = el.tagName.toLowerCase();
    if (ruleMap.tags.has(tagName)) {
      Object.assign(matched, ruleMap.tags.get(tagName));
    }

    // 2. Class selectors (độ ưu tiên trung bình)
    const classAttr = el.getAttribute('class');
    if (classAttr) {
      const classes = classAttr.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (ruleMap.classes.has(cls)) {
          Object.assign(matched, ruleMap.classes.get(cls));
        }
      }
    }

    // 3. ID selector (độ ưu tiên cao nhất trong CSS)
    const id = el.id || el.getAttribute('id');
    if (id && ruleMap.ids.has(id)) {
      Object.assign(matched, ruleMap.ids.get(id));
    }

    return matched;
  }
}
