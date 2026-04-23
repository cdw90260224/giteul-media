import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('./src/app/page.tsx', 'utf8');

// 1. 배지 영역: items-center → items-start, flex gap-2 → flex flex-col items-end gap-1.5
content = content.replace(
  `flex justify-between items-center mb-8`,
  `flex justify-between items-start mb-8`
);
content = content.replace(
  `<div className="flex gap-2">\n                              {isInterest && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 border border-amber-100 uppercase tracking-tighter">Recommended</span>}\n                              {isNew && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 border border-blue-100 uppercase tracking-widest">New Entry</span>}\n                            </div>`,
  `<div className="flex flex-col items-end gap-1.5">\n                              {isInterest && <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">\u2b50\ucd94\uccb4</span>}\n                              {isNew && <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">\ud83c\udd95 NEW</span>}\n                            </div>`
);

// 2. 카드 하단 분석 섹션: 영문 → 한글 + 그린 펄스 도트
content = content.replace(
  `<div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">\n                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Proprietary Analysis Complete</span>\n                            <span className="text-slate-900 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all font-black text-sm">ANALYSIS REPORT \u2192</span>\n                         </div>`,
  `<div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">\n                            <div className="flex items-center gap-2">\n                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />\n                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">AI \ubd84\uc11d \uc644\ub8cc</span>\n                            </div>\n                            <span className="text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all font-black text-xs">\uc804\ubb38 \ubcf4\uae30 \u2192</span>\n                         </div>`
);

writeFileSync('./src/app/page.tsx', content, 'utf8');
console.log('Done! Replacements applied successfully.');
