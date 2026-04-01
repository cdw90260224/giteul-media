import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Newspaper Header */}
      <header className="w-full border-b-[1px] border-border-line py-12 text-center bg-ivory sticky top-0 z-10 transition-colors">
        <h1 className="text-5xl md:text-7xl font-black text-deep-navy mb-4 tracking-[-0.05em] font-serif">기틀</h1>
        <div className="flex items-center justify-center gap-4 w-full px-8">
          <div className="h-[1px] bg-border-line flex-1 max-w-xs"></div>
          <p className="text-sm md:text-base text-deep-navy uppercase tracking-[0.2em] font-bold font-sans">
            Data-driven B2B & Startup Exit Media
          </p>
          <div className="h-[1px] bg-border-line flex-1 max-w-xs"></div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl px-4 py-16 flex flex-col gap-16">
        
        {/* Featured Insight */}
        <section className="border-b-[1px] border-border-line pb-16">
          <Link href="/article/1" className="group block text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="text-deep-navy font-bold font-sans text-xs tracking-widest uppercase border-[1px] border-border-line px-3 py-1">
                Featured Insight
              </span>
              <span className="text-border-line/70 font-semibold font-sans text-xs tracking-wider uppercase">04.01.2026</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 group-hover:text-deep-navy/70 transition-colors leading-[1.15] tracking-tight font-serif text-deep-navy">
              스타트업 엑시트의 새로운 패러다임:<br/>
              M&A 시장 데이터 정밀 분석
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-normal font-sans md:flex-1">
                최근 3년간 누적된 B2B 스타트업 M&A 데이터를 바탕으로, 성공적인 엑시트를 위한 핵심 지표(KPI)와 글로벌 투자자들의 최신 평가 시각을 분석했습니다. 거시경제의 흐름이 스타트업 생태계에 미치는 실질적 영향을 숫자로 조명합니다.
              </p>
              <div className="text-sm font-bold font-sans text-deep-navy uppercase tracking-widest border-l-[1px] border-border-line pl-6 py-2">
                By 데이터랩스
              </div>
            </div>
          </Link>
        </section>

        {/* Latest Articles Grid */}
        <section>
          <div className="flex justify-between items-end mb-8 border-b-[1px] border-border-line pb-4">
            <h3 className="text-2xl font-black text-deep-navy tracking-tight font-serif">최신 시장 지표</h3>
            <span className="text-sm text-deep-navy font-bold font-sans cursor-pointer hover:underline underline-offset-4 transition-colors uppercase tracking-[0.2em]">
              View All
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t-[1px] border-l-[1px] border-border-line">
            {[2, 3, 4, 5, 6, 7].map((id) => (
              <Link href={`/article/${id}`} key={id} className="group block border-b-[1px] border-r-[1px] border-border-line p-8 hover:bg-deep-navy/[0.03] transition-colors h-full flex flex-col">
                <article className="flex-1 flex flex-col">
                  <div className="text-xs text-border-line/70 font-bold font-sans tracking-widest uppercase mb-4 flex justify-between items-center">
                    <span>Data Report #{id}</span>
                    <span>03.{30 - id}.2026</span>
                  </div>
                  <h4 className="text-2xl font-bold mb-4 group-hover:text-deep-navy/70 transition-colors leading-snug tracking-tight font-serif text-deep-navy">
                    B2B SaaS 기업의 가치 평가, ARR 10배 규칙은 깨졌는가
                  </h4>
                  <p className="text-sm md:text-base text-foreground/80 flex-1 mb-6 leading-relaxed font-normal font-sans">
                    글로벌 벤처 캐피탈의 평가 기준 업데이트와 실시간 Revenue Multiples 변화를 통해 적정 기업가치를 산출하는 새로운 기준을 제시합니다.
                  </p>
                  <div className="w-12 h-[1px] bg-border-line mb-4"></div>
                  <span className="text-xs text-deep-navy font-bold font-sans tracking-widest uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Report <span aria-hidden="true">&rarr;</span>
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="w-full border-t-[1px] border-border-line mt-auto pt-8 pb-16 text-center text-xs font-bold font-sans text-deep-navy">
        <p className="tracking-[0.2em]">&copy; 2026 GITEUL DATA MEDIA. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
