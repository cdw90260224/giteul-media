import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
let openBraces = 0;
let closeBraces = 0;
let openJSX = 0;
let closeJSX = 0;

for (let char of content) {
    if (char === '{') openBraces++;
    if (char === '}') closeBraces++;
}

console.log(`Braces: { = ${openBraces}, } = ${closeBraces}`);
if (openBraces !== closeBraces) {
    console.log(`Mismatch: ${openBraces - closeBraces}`);
}
