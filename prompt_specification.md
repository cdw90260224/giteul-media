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
1. 제목(title): 첫 줄은 반드시 단 하나의 마크다운 H1 (# ) 태그를 사용하고 핵심 키워드([${item.agency}] 등)를 전진 배치할 것.
2. 요약(summary): 도입부에 핵심 키워드를 포함해 150자 이내로 요약문 작성.
3. 목차: 본문 단락(H2)으로 연결되는 목차 리스트를 반드시 상단 요약문 바로 아래에 배치할 것.
4. H2/H3 섹션: 정보 위계를 위해 모든 소제목은 H2 태그(## )를 사용하고, 하위 정보는 H3(### )를 사용할 것.
5. 데이터 시각화 (절대 규칙): 수집된 '상세 데이터'(상세 일정, 배점 기준표, 커리큘럼, 지원 자격, 사업비 규모, 교육 시간, 선발 인원수 등 숫자 데이터)는 단 한 줄도 누락시키지 말고 무조건 마크다운 "표(Table)" 형식으로 변환하여 기재할 것! (단순 텍스트 나열 무조건 금지)
6. 키워드 밀도: 자연스러운 문맥 안에서 핵심 키워드("${keyword}")를 본문 전체에 5~7회 반복 노출할 것.
7. 이미지 Alt Text: 기사 내 이미지를 삽입할 경우 반드시 [![${keyword}_관련설명](이미지주소)] 형태로 Alt Text를 꼼꼼히 작성. (가상의 이미지 주소 https://example.com/image.png 사용 가능)
8. 내부 링크: 기사 하단에 '관련 뉴스' 섹션(H2)을 추가하여 가상의 추천 기사 2개 링크를 넣을 것.

[특별 추가 지시사항 - 배점 및 기자 코멘트 (필수)]
- 데이터 내에 '배점' 관련 표나 수치가 전혀 없다면, 배점 기준표 내부에 반드시 "배점 정보 미확인" 이라고 명시할 것.
- "배점 정보 미확인" 상태일 경우, 해당 표 바로 밑에 반드시 [H3] 섹션으로 '### 기자 코멘트' 를 추가하여, "배점표는 공개되지 않았으나, 사업 명칭에 '관광'이 명시된 만큼 특성에 맞는 요소가 합격의 변수가 될 것으로 보입니다." 와 같이 해당 공고의 제목과 성격에 맞는 구체적이고 전문적인 통찰력(인사이트)을 담아 평가 변수를 예측하는 한 줄 코멘트를 작성할 것.

[데이터 소스 (주관기관: ${item.agency})]:
${item.title}
${deepContext}

출력 포맷: 반드시 JSON {title, summary, category, content, notice_url} 형태로만 응답하라. 마크다운 백틱(```) 금지. JSON 외 어떠한 텍스트도 출력하지 말 것. 작성한 기사 전체는 content 필드 내부에 HTML/Markdown 텍스트로 전부 포함할 것.
```
