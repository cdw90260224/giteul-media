import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Newspaper Header */}
      <header className="w-full border-b-[0.5px] border-border-line py-12 text-center bg-ivory sticky top-0 z-10">
        <h1 className="text-5xl md:text-6xl font-black text-deep-navy mb-4 tracking-tighter">기틀</h1>
        <div className="flex items-center justify-center gap-4 w-full px-8">
          <div className="h-[0.5px] bg-border-line flex-1 max-w-xs"></div>
          <p className="text-sm md:text-base text-deep-navy uppercase tracking-[0.2em] font-bold">
            Data-driven B2B & Startup Exit Media
          </p>
          <div className="h-[0.5px] bg-border-line flex-1 max-w-xs"></div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl px-4 py-16 flex flex-col gap-16">
        
        {/* Featured Insight */}
        <section className="border-b-[0.5px] border-border-line pb-16">
          <Link href="/article/1" className="group block text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="text-deep-navy font-black text-sm tracking-widest uppercase border-[0.5px] border-border-line px-3 py-1">
                Featured Insight
              </span>
              <span className="text-border-line/70 font-semibold text-xs tracking-wider uppercase">04.01.2026</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 group-hover:text-deep-navy/70 transition-colors leading-[1.1] tracking-tight">
              스타트업 엑시트의 새로운 패러다임:<br/>
              M&A 시장 데이터 분석
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium md:flex-1">
                최근 3년간의 B2B 스타트업 M&A 데이터를 바탕으로, 성공적인 엑시트를 위한 핵심 지표와 투자자들의 시각을 분석했습니다. 거시경제의 흐름이 스타트업 생태계에 미치는 영향을 조명합니다.
              </p>
              <div className="text-sm font-bold text-deep-navy uppercase tracking-widest border-l-[0.5px] border-border-line pl-6 py-2">
                By 편집부
              </div>
            </div>
          </Link>
        </section>

        {/* Latest Articles Hairline Grid */}
        <section>
          <div className="flex justify-between items-end mb-8 border-b-[0.5px] border-border-line pb-4">
            <h3 className="text-2xl font-black text-deep-navy tracking-tight">최신 기사</h3>
            <span className="text-sm text-deep-navy font-black cursor-pointer hover:underline underline-offset-4 transition-colors uppercase tracking-[0.2em]">
              View All
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t-[0.5px] border-l-[0.5px] border-border-line">
            {[2, 3, 4, 5, 6, 7].map((id) => (
              <Link href={`/article/${id}`} key={id} className="group block border-b-[0.5px] border-r-[0.5px] border-border-line p-8 hover:bg-black/[0.02] transition-colors h-full flex flex-col">
                <article className="flex-1 flex flex-col">
                  <div className="text-xs text-border-line/70 font-bold tracking-widest uppercase mb-4 flex justify-between items-center">
                    <span>Data Chart #{id}</span>
                    <span>03.{30 - id}.2026</span>
                  </div>
                  <h4 className="text-2xl font-black mb-4 group-hover:text-deep-navy/70 transition-colors leading-snug tracking-tight">
                    B2B SaaS 기업의 가치 평가는 어떻게 달라지고 있는가
                  </h4>
                  <p className="text-base text-foreground/90 flex-1 mb-6 leading-relaxed font-medium">
                    데이터에 기반한 ARR 배수 모델의 변화와 글로벌 벤처 캐피탈의 평가 기준 업데이트를 여러 각도에서 심층 살펴봅니다.
                  </p>
                  <div className="w-12 h-[0.5px] bg-border-line mb-4"></div>
                  <span className="text-xs text-deep-navy font-bold tracking-widest uppercase">Read Article →</span>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="w-full border-t-[0.5px] border-border-line mt-auto pt-8 pb-16 text-center text-sm font-black text-deep-navy">
        <p className="tracking-[0.2em]">&copy; 2026 GITEUL MEDIA. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
