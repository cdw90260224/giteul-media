const fs = require('fs');
const pdfParse = require('pdf-parse');
const hwp = require('hwp.js');

function extractHwpText(obj) {
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

async function testHwp(url, name) {
    const res = await fetch(url, { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do'
        } 
    });
    if (!res.ok) throw new Error('Fetch failed');
    const buf = Buffer.from(await res.arrayBuffer());
    const doc = hwp.parse(buf, { type: 'buffer' });
    const text = extractHwpText(doc.sections).replace(/\s+/g, ' ').trim();
    console.log(`[${name}] TEXT LENGTH:`, text.length);
    console.log(`[${name}] TEXT PREVIEW:`, text.substring(0, 500));
}

testHwp('https://www.k-startup.go.kr/afile/fileDownload/lYwHh', 'test.hwp').catch(console.error);
