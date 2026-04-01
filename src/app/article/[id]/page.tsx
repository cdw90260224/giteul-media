import Link from 'next/link';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <main className="flex-1 flex flex-col bg-ivory">
      {/* Newspaper Header Mini */}
      <header className="w-full border-b-[0.5px] border-border-line py-6 text-center sticky top-0 bg-ivory z-10">
        <Link href="/">
          <h1 className="text-3xl font-black text-deep-navy tracking-tighter hover:opacity-80 transition-opacity">기틀</h1>
        </Link>
      </header>

      <article className="w-full max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12 border-b-[0.5px] border-border-line pb-8">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-deep-navy font-black text-sm tracking-widest uppercase border-[0.5px] border-border-line px-3 py-1">
              Data Chart #{id}
            </span>
            <span className="text-border-line/70 font-semibold text-xs tracking-wider uppercase">
              04.01.2026
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-[1.2] tracking-tight text-deep-navy">
            B2B SaaS 기업의 가치 평가는 어떻게 달라지고 있는가
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-medium">
            데이터에 기반한 ARR 배수 모델의 변화와 글로벌 벤처 캐피탈의 평가 기준 업데이트를 여러 각도에서 심층 살펴봅니다.
          </p>
        </div>

        <div className="prose prose-lg prose-neutral max-w-none font-serif leading-loose">
          <p className="text-lg">본문의 내용은 이곳에 들어갑니다. 기틀 미디어는 영국의 오래된 경제지나 학술 단행본의 무드를 지향합니다...</p>
        </div>
      </article>
      
      <footer className="w-full border-t-[0.5px] border-border-line mt-auto pt-8 pb-16 text-center text-sm font-black text-deep-navy">
        <p className="tracking-[0.2em]">&copy; 2026 GITEUL MEDIA. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
