import Link from 'next/link';

const NEWS_ITEMS = [
  {
    id: 1,
    title: "글로벌 B2B SaaS 가치 평가, ARR 10배 규칙은 깨졌는가",
    summary: "벤처 캐피탈의 평가 기준 업데이트와 실시간 Revenue Multiples 변화를 통해 적정 기업가치를 산출하는 새로운 기준을 제시합니다.",
    date: "04.01.2026",
    category: "시장 분석",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    title: "AI 솔루션 도입률 1위 산업군은? 금융 데이터 전격 리뷰",
    summary: "가장 보수적인 금융권에서 생성형 AI가 도입되는 속도와 규모를 분석했습니다. B2B 솔루션 기업들이 주목해야 할 거대 시장입니다.",
    date: "03.31.2026",
    category: "리서치",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    title: "유니콘 도약을 위한 Next Step: 현금흐름 생존 맵",
    summary: "시리즈 C 이상 스타트업의 공통적인 현금흐름 위기 구간과 이를 방어한 기업들의 전략적 특징을 비교 분석합니다.",
    date: "03.30.2026",
    category: "재무 전략",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    title: "국내 벤처캐피탈(VC)의 올해 하반기 드라이파우더 현황",
    summary: "국내 톱 15개 VC들이 보유한 드라이파우더(투자 목적으로 모금되었으나 아직 집행되지 않은 자금)의 배분 전망을 단독 공개합니다.",
    date: "03.29.2026",
    category: "VC 데이터",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    title: "엑시트 딜레마: IPO vs M&A, 데이터로 본 최근 5년",
    summary: "상장과 인수합병 중 창업자에게 돌아가는 실익을 데이터 팩트로 짚어봅니다. 가장 현실적인 엑시트 모델은 무엇일까요?",
    date: "03.28.2026",
    category: "엑시트(Exit)",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    title: "성장판이 닫히기 전 알아야 할 글로벌 진출 성공 방정식",
    summary: "국내를 넘어 미국, 일본으로 진출한 B2B 스타트업들의 초기 로컬라이제이션 마케팅 비용 구조와 그 효율을 파헤칩니다.",
    date: "03.27.2026",
    category: "글로벌 진출",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 7,
    title: "클라우드 비용 한 달 1억? 인프라 최적화 비결",
    summary: "매년 기하급수적으로 증가하는 클라우드 비용을 효과적으로 깎아낸 기업들의 아키텍처 공통점과 생태계를 분석했습니다.",
    date: "03.25.2026",
    category: "운영/인프라",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 8,
    title: "스타트업 인재의 이동: C레벨이 주목하는 보상 스키마",
    summary: "업계 내 톱 레벨 핵심 인재들이 이직을 고려할 때 가장 깐깐하게 평가하는 스톡옵션 등 보상 패키지 트렌드를 공개합니다.",
    date: "03.24.2026",
    category: "인재/조직",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
  }
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center min-h-screen pb-20 font-sans">
      
      {/* Portal Top Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/">
              <h1 className="text-3xl font-black text-deep-navy tracking-tight shadow-none">기틀</h1>
            </Link>
            
            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-6 mt-1">
              <span className="text-sm font-bold text-deep-navy border-b-2 border-deep-navy pb-1 cursor-pointer">홈 (오늘의 지표)</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">스타트업 M&A</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">리서치 랩</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">기틀 오리지널</span>
            </nav>
          </div>
          
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="기업명이나 데이터 검색..." 
                className="w-64 bg-portal-bg border border-gray-200 text-sm rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-deep-navy/30 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
        
        {/* Top Featured Headline (Hero Banner style) */}
        <section className="mb-10 w-full bg-deep-navy rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row items-center cursor-pointer group hover:shadow-xl transition-shadow duration-300">
           <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
             <span className="text-xs font-bold tracking-widest uppercase mb-3 text-white/70 bg-white/10 w-fit px-3 py-1 rounded-sm">
               🌟 헤드라인 속보
             </span>
             <h2 className="text-3xl md:text-5xl font-black mb-5 leading-[1.15] text-white group-hover:text-blue-100 transition-colors">
               스케일업을 가로막는 병목 현상: 데이터로 본 돌파구
             </h2>
             <p className="text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed">
               시리즈 B 이상을 달성한 B2B 스타트업들이 공통적으로 경험하는 매출 정체의 원인과, 이를 극복한 데이터 기반의 조직 개편 사례들을 4부작 리포트로 다룹니다.
             </p>
           </div>
           <div className="w-full md:w-1/2 md:h-full aspect-video md:aspect-auto bg-gray-800 relative overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80" 
               alt="Top Headline Image" 
               className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
             />
           </div>
        </section>

        {/* MSN Portal Style Masonry/Grid Layout */}
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">최신 업데이트</h2>
          <div className="flex-1 h-[1px] bg-gray-200 ml-4"></div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {NEWS_ITEMS.map((item) => (
            <Link href={`/article/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-deep-navy/30 transition-all duration-300 overflow-hidden">
              
              {/* Thumbnail Image */}
              <div className="w-full aspect-video bg-gray-100 overflow-hidden border-b border-gray-100 relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 block" 
                />
              </div>
              
              {/* Card Content Box */}
              <div className="p-5 flex flex-col flex-1">
                
                {/* Taxonomy Label */}
                <div className="flex items-center mb-3">
                  <span className="text-[11px] font-black text-deep-navy bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-[4px] tracking-wide">
                    {item.category}
                  </span>
                </div>
                
                {/* Thick Bold Gothic Title */}
                <h3 className="text-xl md:text-[22px] font-black text-gray-900 mb-3 leading-snug group-hover:text-deep-navy transition-colors line-clamp-2">
                  {item.title}
                </h3>
                
                {/* Short 2-line Summary */}
                <p className="text-[15px] text-gray-600 line-clamp-2 mb-6 flex-1 leading-[1.6]">
                  {item.summary}
                </p>
                
                {/* Portal Footer (Logo & Date) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {/* Tiny Square Logo Accent */}
                    <span className="w-3.5 h-3.5 bg-deep-navy flex items-center justify-center rounded-sm">
                      <span className="text-[8px] font-black text-white shrink-0">G</span>
                    </span>
                    <span className="text-xs font-black text-deep-navy tracking-tight">기틀 미디어</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 font-sans tracking-wide">
                    {item.date}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </main>
  );
}
