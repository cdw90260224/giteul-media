const hwp = require('hwp.js');
const fs = require('fs');

function extractText(obj) {
  let text = '';
  if (typeof obj === 'string') {
    // Only return strings that look like actual text, avoid very short ones or mostly symbols if possible,
    // but for now let's just return all strings
    return obj + ' ';
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      text += extractText(item);
    }
  } else if (obj !== null && typeof obj === 'object') {
    // some common text keys in hwp.js
    if (obj.text) {
        if (typeof obj.text === 'string') return obj.text + ' ';
        text += extractText(obj.text);
    }
    for (const key of Object.keys(obj)) {
      if (key !== 'text' && key !== 'header' && key !== 'docInfo') { // skip some metadata to reduce noise
         text += extractText(obj[key]);
      }
    }
  }
  return text;
}

const file = fs.readFileSync(process.argv[2]);
try {
  const doc = hwp.parse(file, { type: 'buffer' });
  const docText = extractText(doc.sections).replace(/\s+/g, ' ').trim();
  console.log(docText.substring(0, 500));
} catch (e) {
  console.error("hwp error:", e.message);
}
