import fs from 'fs';
import path from 'path';

/**
 * 제목 기반 로고 매칭 유틸리티
 */
export function getLogoByTitle(title: string): string | null {
    const t = title.toLowerCase();
    const publicLogosDir = path.join(process.cwd(), 'public', 'logos');

    const getLocalOrExternal = (fileName: string, externalUrl: string) => {
        const localPath = path.join(publicLogosDir, fileName);
        if (fileName && fs.existsSync(localPath)) {
            return `/logos/${fileName}`;
        }
        return externalUrl;
    };
    
    // [중기부/MSS] 우선순위 로고
    if (t.includes('중기부') || t.includes('중소벤처기업부') || t.includes('mss')) {
        console.log(`[Logo Match] ✅ Matched MSS/중기부 for title: ${title}`);
        return getLocalOrExternal('mss_logo.png', 'https://www.mss.go.kr/images/common/logo.png');
    }

    // [서울시/서울창업허브] 우선순위 로고
    if (t.includes('서울시') || t.includes('서울창업허브') || t.includes('서울경제진흥원') || t.includes('sba')) {
        console.log(`[Logo Match] ✅ Matched Seoul for title: ${title}`);
        return getLocalOrExternal('seoul_logo.png', 'https://www.seoul.go.kr/res_newseoul/images/header/logo.png');
    }

    // [K-Startup / 창업진흥원]
    if (t.includes('k-startup') || t.includes('k스타트업') || t.includes('창업진흥원')) {
        console.log(`[Logo Match] ✅ Matched K-Startup for title: ${title}`);
        return getLocalOrExternal('kstartup_logo.png', 'https://www.k-startup.go.kr/static/portal/img/logo_kstartup.png');
    }

    // [특정 공고 기관 - 신한금융]
    if (t.includes('신한금융') || t.includes('신한스퀘어') || t.includes('신한은행')) {
        console.log(`[Logo Match] ✅ Matched Shinhan for title: ${title}`);
        return 'https://www.shinhan.com/static/images/common/logo.png';
    }

    // [특정 공고 기관 - 기술보증기금]
    if (t.includes('기보') || t.includes('기술보증기금') || t.includes('kibo')) {
        console.log(`[Logo Match] ✅ Matched KIBO for title: ${title}`);
        return 'https://www.kibo.or.kr/src/images/common/logo.png';
    }

    console.log(`[Logo Match] No local logo match for title: ${title}`);
    return null;
}
