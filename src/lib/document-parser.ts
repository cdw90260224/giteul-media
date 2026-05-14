if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      // @ts-ignore
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  } as any;
}
const pdfParse = require('pdf-parse');
const hwp = require('hwp.js');

function extractHwpText(obj: any): string {
  let text = '';
  if (typeof obj === 'string') {
    return obj + ' ';
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      text += extractHwpText(item);
    }
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.text) {
      if (typeof obj.text === 'string') return obj.text + ' ';
      text += extractHwpText(obj.text);
    }
    // HWP.js often stores paragraph text in an array of char objects
    if (obj.chars && Array.isArray(obj.chars)) {
        for (const char of obj.chars) {
            if (typeof char.text === 'string') text += char.text;
            else if (typeof char === 'string') text += char;
        }
        text += ' ';
    }
    for (const key of Object.keys(obj)) {
      if (key !== 'text' && key !== 'chars' && key !== 'header' && key !== 'docInfo' && key !== 'controls') {
        text += extractHwpText(obj[key]);
      }
    }
  }
  return text;
}

export async function parseDocumentText(url: string, fileName: string): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    const referer = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer
      } 
    });
    if (!res.ok) return null;
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') {
      try {
        const { PDFParse } = require('pdf-parse');
        const uint8 = new Uint8Array(buffer);
        const pdf = new PDFParse(uint8);
        const data = await pdf.getText();
        return data.text.replace(/\s+/g, ' ').trim();
      } catch (e: any) {
        console.warn(`[DocumentParser] PDF Parse Error for ${fileName}:`, e.message);
        return null;
      }
    } else if (ext === 'hwp') {
      try {
        const doc = hwp.parse(buffer, { type: 'buffer' });
        const text = extractHwpText(doc.sections).replace(/\s+/g, ' ').trim();
        return text;
      } catch (e) {
        console.warn(`[DocumentParser] HWP Parse Error for ${fileName}:`, e);
        return null;
      }
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to parse ${fileName}: ${error.message}`);
    return null;
  }
}
