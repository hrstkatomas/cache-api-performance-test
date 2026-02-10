export interface Asset {
  url: string;
  content: Response;
  type: string;
  sizeBytes: number;
}

export class AssetGenerator {
  private assetCounter = 0;
  private readonly targetSizeMB: number;

  constructor(targetSizeMB: number = 5) {
    this.targetSizeMB = targetSizeMB;
  }

  /**
   * Generate a batch of large synthetic assets
   */
  generateAssets(count: number): Asset[] {
    const assets: Asset[] = [];

    for (let i = 0; i < count; i++) {
      const assetType = this.getRandomAssetType();
      const asset = this.generateAssetByType(assetType);
      assets.push(asset);
    }

    return assets;
  }

  private getRandomAssetType(): 'html' | 'css' | 'js' | 'json' {
    const types: Array<'html' | 'css' | 'js' | 'json'> = ['html', 'css', 'js', 'json'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateAssetByType(type: string): Asset {
    this.assetCounter++;
    const url = `https://test-cache.local/asset-${this.assetCounter}.${type}`;

    let content: string;
    let mimeType: string;

    switch (type) {
      case 'html':
        content = this.generateLargeHTML();
        mimeType = 'text/html';
        break;
      case 'css':
        content = this.generateLargeCSS();
        mimeType = 'text/css';
        break;
      case 'js':
        content = this.generateLargeJS();
        mimeType = 'application/javascript';
        break;
      case 'json':
        content = this.generateLargeJSON();
        mimeType = 'application/json';
        break;
      default:
        content = this.generateLargeHTML();
        mimeType = 'text/html';
    }

    const blob = new Blob([content], { type: mimeType });
    const response = new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': blob.size.toString()
      }
    });

    return {
      url,
      content: response,
      type,
      sizeBytes: blob.size
    };
  }

  private generateLargeHTML(): string {
    const targetBytes = this.targetSizeMB * 1024 * 1024;
    let html = '<!DOCTYPE html><html><head><title>Test Asset</title></head><body>';

    // Generate large tables with repeated data
    const rowTemplate = '<tr>' + '<td>Lorem ipsum dolor sit amet consectetur</td>'.repeat(10) + '</tr>';

    while (html.length < targetBytes) {
      html += '<table>' + rowTemplate.repeat(100) + '</table>';
    }

    html += '</body></html>';
    return html;
  }

  private generateLargeCSS(): string {
    const targetBytes = this.targetSizeMB * 1024 * 1024;
    let css = '/* Large CSS file for performance testing */\n';

    let counter = 0;
    while (css.length < targetBytes) {
      css += `.class-${counter} { color: #${Math.floor(Math.random() * 16777215).toString(16)}; margin: 10px; padding: 5px; }\n`;
      counter++;
    }

    return css;
  }

  private generateLargeJS(): string {
    const targetBytes = this.targetSizeMB * 1024 * 1024;
    let js = '// Large JavaScript file for performance testing\n';
    js += 'const data = [\n';

    while (js.length < targetBytes - 1000) {
      const obj = {
        id: Math.random(),
        name: `item-${Math.random().toString(36).substring(7)}`,
        data: Array(20).fill(0).map(() => Math.random().toString(36)),
        timestamp: Date.now()
      };
      js += '  ' + JSON.stringify(obj) + ',\n';
    }

    js += '];\nexport default data;';
    return js;
  }

  private generateLargeJSON(): string {
    const targetBytes = this.targetSizeMB * 1024 * 1024;
    const items = [];

    let currentSize = 0;
    while (currentSize < targetBytes) {
      const item = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        data: Array(50).fill(0).map(() => ({
          key: Math.random().toString(36),
          value: Math.random() * 1000,
          nested: {
            a: Math.random(),
            b: Math.random(),
            c: Math.random()
          }
        }))
      };
      items.push(item);
      currentSize = JSON.stringify(items).length;
    }

    return JSON.stringify({ items, count: items.length, generated: new Date().toISOString() });
  }

  /**
   * Get all generated URLs for testing
   */
  getGeneratedUrls(): string[] {
    const urls: string[] = [];
    for (let i = 1; i <= this.assetCounter; i++) {
      const types = ['html', 'css', 'js', 'json'];
      const type = types[i % types.length];
      urls.push(`https://test-cache.local/asset-${i}.${type}`);
    }
    return urls;
  }
}
