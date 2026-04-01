import Link from 'next/link';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <main className="flex-1 flex flex-col bg-ivory">
      {/* Newspaper Header Mini */}
      <header className="w-full border-b-[1px] border-border-line py-6 text-center sticky top-0 bg-ivory z-10 transition-colors">
        <Link href="/">
          <h1 className="text-3xl font-black text-deep-navy tracking-[-0.05em] hover:opacity-80 transition-opacity font-serif">기틀</h1>
        </Link>
      </header>

      <article className="w-full max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12 border-b-[1px] border-border-line pb-8">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-deep-navy font-bold font-sans text-sm tracking-widest uppercase border-[1px] border-border-line px-3 py-1">
              Data Chart #{id}
            </span>
            <span className="text-border-line/70 font-semibold font-sans text-xs tracking-wider uppercase">
              04.01.2026
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-[1.25] tracking-tight text-deep-navy font-serif">
            B2B SaaS 기업의 가치 평가는 어떻게 달라지고 있는가
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-normal font-sans">
            데이터에 기반한 ARR 배수 모델의 변화와 글로벌 벤처 캐피탈의 평가 기준 업데이트를 여러 각도에서 심층 살펴봅니다. 시장의 객관적인 지표를 통해 적정 기업가치를 산출하는 새로운 기준을 제시합니다.
          </p>
        </div>

        <div className="prose prose-lg prose-neutral max-w-none font-sans leading-[1.8] text-foreground/90">
          <p className="text-lg">
            최근 3년간 누적된 B2B 스타트업 M&A 데이터를 바탕으로, 성공적인 엑시트를 위한 핵심 지표(KPI)와 글로벌 투자자들의 최신 평가 시각을 분석했습니다. 거시경제의 흐름이 스타트업 생태계에 미치는 실질적 영향을 숫자로 조명합니다.
          </p>
          <p className="text-lg mt-6">
            이 기사는 계속해서 차트와 데이터 표를 통해 시장의 객관적 흐름을 산세리프 폰트로 정확하고 명료하게 전달합니다. 폰트의 가독성을 극대화하여 독자가 수치와 지표에 온전히 집중할 수 있도록 돕습니다.
          </p>
        </div>
      </article>
      
      <footer className="w-full border-t-[1px] border-border-line mt-auto pt-8 pb-16 text-center text-xs font-bold font-sans text-deep-navy">
        <p className="tracking-[0.2em]">&copy; 2026 GITEUL DATA MEDIA. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
