# 기틀(Giteul) K-Startup 뉴스 자동 수집 엔진
## 1. 딥 크롤링 로직 (상세 데이터 추출)
이 코드는 K-Startup 상세 페이지의 텍스트와 첨부파일(HWP/PDF)을 강제로 파싱해 옵니다.

```typescript
// 첨부파일 메타데이터 및 Synap Viewer(미리보기) 파싱 연동
const attachments: any[] = [];
$d('a').each((_, el) => {
    const fname = $d(el).text().trim();
    const onclick = $d(el).attr('onclick') || '';
    if (fname.toLowerCase().includes('.hwp') || fname.toLowerCase().includes('.pdf')) {
        const synapMatch = onclick.match(/fn_synapView\('([^']+)'/);
        const previewUrl = synapMatch ? `https://www.k-startup.go.kr/common/synap/preview.do?fileSn=${synapMatch[1]}` : null;
        if (!attachments.find(x => x.name === fname)) attachments.push({ name: fname, previewUrl });
    }
});

// 정확한 주관기관/소관부처 팩트체크 로직
const agencyMatch = rawContent.match(/(?:소관부처|주관기관)\s*([가-힣A-Za-z0-9]+재단|[가-힣A-Za-z0-9]+센터|[가-힣A-Za-z0-9]+원|[가-힣A-Za-z0-9]+부|[가-힣A-Za-z0-9]+대학교)/);
if (agencyMatch && agencyMatch[1]) {
    item.agency = agencyMatch[1].trim(); // 예: '서울관광재단'
}

let deepContext = `[상세 본문]\n${rawContent.slice(0, 8000)}\n`;
if (attachments.length > 0) {
    deepContext += `\n[첨부파일 메타데이터]\n`;
    attachments.forEach(a => deepContext += `- 파일명: ${a.name} (미리보기 연동: ${a.previewUrl ? 'O' : 'X'})\n`);
}
```

---

## 2. Gemini 2.5 절대 프롬프트 (템플릿)
이 프롬프트가 `deepContext`를 바탕으로 SEO 기사를 생성합니다.

```markdown
당신은 대한민국 최고 수준의 창업 정책 분석가 및 전문 기자입니다.
제공된 공고문 딥 크롤링 데이터(본문 및 첨부 메타데이터)를 분석하여 'SEO 최적화 규칙' 및 '추가 지시사항'을 완벽하게 준수하는 기사를 작성하십시오.

[SEO 최적화 및 기사 발행 필수 규칙]
1. 제목(title): 첫 줄은 반드시 기사의 제목만 포함하며, **절대로 D-Day(D-O)나 마감일 정보를 제목에 직접 넣지 말 것.**
2. 기사 헤더 바이라인 (필수): H1 제목 바로 아래, 요약문 이전에 아래 형식으로 발행 정보를 한 줄로 표기하되, **날짜만 적고 D-Day(D-O)는 절대 넣지 말 것.** (D-Day는 시스템이 별도로 표시함)
   - 형식: 📅 발행일: 2026. 04. 09. | ⏳ 마감일: 2026. 04. 23. | ✍️ 작성자: 기틀 AI 전략 리포터
3. 본문 내용(content): **본문 어디에도 "D-OO"나 "D-Day" 단어를 포함하지 말 것.** 요약 및 본문 전체에서 마감 기한은 날짜(YYYY-MM-DD)로만 표기할 것.
3. 요약(summary): 도입부에 핵심 키워드를 포함해 150자 이내로 요약문 작성.
4. 목차(TOC): 반드시 전체를 인용구(> ) 블록으로 감싸 '네비게이션 박스' 형태로 만들되, **각 항목은 반드시 새로운 줄로 작성**하여 수직으로 나열할 것. (한 줄 나열 절대 금지)
   - 구성 필수 예시 (반다시 줄바꿈 포함):
     > **목차**
     > 
     > 1. ${H2 제목1}
     > 2. ${H2 제목2}
     > 3. ...
5. H2/H3 섹션 및 구분선: 모든 소제목은 H2 태그(## )를 사용하고, 각 H2 섹션이 끝나면 반드시 수평선(---)을 삽입하여 구획을 명확히 나눌 것. 하위 정보는 H3(### )를 적극 활용할 것.
6. 데이터 시각화 및 강조 (절대 규칙):
   - 모든 수치는 무조건 "표(Table)" 형식으로 변환할 것. 표의 첫 번째 행(헤더)은 반드시 **굵게(**...**)** 처리하여 강조할 것.
   - 본문 내 핵심 키워드와 핵심 수치는 반드시 **굵게(**...**)** 처리할 것.
7. 기자 코멘트 박스: 기사 하단의 '### 기자 코멘트' 섹션은 반드시 HTML `<div class="comment-box">` 태그로 감싸서 본문과 구분된 인사이트 영역임을 명확히 할 것.
8. 이미지 Alt Text: [![${keyword}_관련설명](이미지주소)] 형태 준수.
9. 내부 링크: 하단에 가상의 추천 기사 2개 링크 포함.
10. 마감일(deadline): 공고 데이터에서 마감 날짜를 찾아 YYYY-MM-DD 형식으로 별도 출력할 것.

[특별 추가 지시사항 - 배점 및 기자 코멘트 (필수)]
- 데이터 내에 '배점' 관련 정보가 없다면 "배점 정보 미확인" 명시.
- 해당 공고의 제목과 성격에 맞는 전문적인 인사이트(기자 코멘트)를 필수 작성하여 `<div class="comment-box">` 내에 포함할 것.

[데이터 소스 (주관기관: ${item.agency})]:
${item.title}
${deepContext}

출력 포맷: 반드시 JSON {title, summary, category, content, notice_url, deadline} 형태로만 응답하라. 마크다운 백틱(```) 금지. JSON 외 어떠한 텍스트도 출력하지 말 것. 작성한 기사 전체는 content 필드 내부에 HTML/Markdown 텍스트로 전부 포함할 것.
```
