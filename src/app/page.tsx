'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 카테고리별 컬러 시스템
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '정부지원공고':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  label: '정부지원' },
  'AI/테크 트렌드': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/테크' },
  '기업/마켓 뉴스': { bg: 'bg-teal-50',  text: 'text-teal-700',  border: 'border-teal-200',  label: '마켓' },
  '글로벌 뉴스':   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: '글로벌' },
};
const DEFAULT_CAT = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'REPORT' };

function CategoryTag({ category, className = '' }: { category: string; className?: string }) {
  const c = CAT_CONFIG[category] ?? DEFAULT_CAT;
  return (
    <span className={`text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest border 
      ${c.bg} ${c.text} ${c.border} ${className}`}>
      {c.label}
    </span>
  );
}

const FALLBACK_ITEMS = [
  { id: 1, title: '창업지원사업 AI 분석 리포트를 무인 발행합니다', summary: '기틀 미디어의 Auto-Pilot 엔진이 가동되었습니다.', category: '정부지원공고', image_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85', created_at: new Date().toISOString() },
  { id: 2, title: 'K-Startup 합격 전략 가이드', summary: '제미나이 2.5가 분석하는 팁스 및 예창패 필승 키워드를 확인하세요.', category: 'AI/테크 트렌드', image_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01', created_at: new Date().toISOString() },
];

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 우선순위 정렬 로직: 마감 전이거나 마감 기한이 없는 뉴스(테크 등)를 위로, 마감된 뉴스를 뒤로
            const sorted = [...data].sort((a, b) => {
                const aExpired = a.deadline_date && new Date(a.deadline_date) < today;
                const bExpired = b.deadline_date && new Date(b.deadline_date) < today;

                if (aExpired && !bExpired) return 1;
                if (!aExpired && bExpired) return -1;
                
                // 둘 다 마감 전이거나 둘 다 마감 후라면 최신순으로 정렬
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setNewsItems(sorted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/auto-post', { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        alert('발행 실패: ' + result.error);
      }
    } catch {
      alert('네트워크 오류');
    } finally {
      setGenerating(false);
    }
  };

  const filteredItems = activeCategory === '전체'
    ? newsItems
    : newsItems.filter(i => i.category === activeCategory);

  // 멀티 슬롯 데이터 분리
  const heroMain = filteredItems.find(i => i.category === '정부지원공고') || filteredItems[0] || FALLBACK_ITEMS[0];
  const heroSide = filteredItems.filter(i => i.id !== heroMain.id).slice(0, 4);
  const remainingItems = filteredItems.filter(i => i.id !== heroMain.id && !heroSide.find(s => s.id === i.id));

  // 실시간 여부 판단 (1시간 이내)
  const isLive = (dateStr: string) => {
    const postDate = new Date(dateStr);
    const now = new Date();
    return (now.getTime() - postDate.getTime()) < 3600000;
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Header & Navigation */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm font-sans">
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-16">
            <Link href="/" onClick={() => setActiveCategory('전체')}>
              <h1 className="text-4xl font-black text-deep-navy italic tracking-tighter">기틀.</h1>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-10">
              <div className="relative group h-20 flex items-center">
                <button className={`text-[17px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeCategory === '전체' ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}>
                  INTELLIGENCE PORTAL
                  <svg className="w-5 h-5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className="absolute top-20 left-0 w-72 bg-deep-navy shadow-2xl rounded-b-3xl py-8 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 border-t border-white/10">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setActiveCategory('전체')} className="text-left px-6 py-4 rounded-2xl text-[14px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">All Reports</button>
                    <button onClick={() => setActiveCategory('정부지원공고')} className="text-left px-6 py-4 rounded-2xl text-[14px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">Gov Support</button>
                    <button onClick={() => setActiveCategory('AI/테크 트렌드')} className="text-left px-6 py-4 rounded-2xl text-[14px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">AI & Tech</button>
                    <button onClick={() => setActiveCategory('기업/마켓 뉴스')} className="text-left px-6 py-4 rounded-2xl text-[14px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">Market/Corp</button>
                    <button onClick={() => setActiveCategory('글로벌 뉴스')} className="text-left px-6 py-4 rounded-2xl text-[14px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">Global News</button>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveCategory('정부지원공고')} className={`text-[17px] font-black uppercase tracking-widest transition-colors ${activeCategory === '정부지원공고' ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}>SUPPORT STRATEGY</button>
              <button onClick={() => setActiveCategory('AI/테크 트렌드')} className={`text-[17px] font-black uppercase tracking-widest transition-colors ${activeCategory === 'AI/테크 트렌드' ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}>STARTUP TRENDS</button>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleGenerate} disabled={generating} className={`bg-deep-navy text-white text-[14px] font-black px-10 py-4 rounded-full shadow-xl transition-all tracking-[0.15em] border-2 border-transparent hover:border-white/20 ${generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'}`}>
              {generating ? '집필 중...' : '🔥 새 기사 집필'}
            </button>
          </div>
        </div>
      </header>

      {/* Breaking News Ticker */}
      <div className="w-full bg-deep-navy text-white py-4 overflow-hidden border-b border-white/10 relative z-40">
        <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-8">
            <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1.5 rounded select-none shrink-0 animate-pulse uppercase tracking-[0.2em] italic">Breaking</span>
            <div className="relative flex-1 overflow-hidden h-10 flex items-center">
                <div className="animate-marquee whitespace-nowrap flex gap-24 items-center">
                    {newsItems.slice(0, 10).map((n, idx) => (
                        <Link key={idx} href={`/article/${n.id}`} className="text-[15.5px] font-black hover:text-blue-200 transition-colors flex items-center gap-4">
                            <span className="opacity-20 font-black text-xl">|</span>
                            <span>{n.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">
        {/* Multi-Slot Hero Section (Reverted to Vibrant Cover Style) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 bg-deep-navy rounded-[3rem] overflow-hidden flex flex-col relative shadow-[0_50px_100px_-30px_rgba(0,43,91,0.3)] border border-white/5 min-h-[550px] group">
            <div className="absolute inset-0 z-0">
                <img
                    src={heroMain.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                    className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[3s]"
                    alt="Headline"
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/40 to-transparent" />
            </div>
            <div className="relative z-10 p-10 lg:p-20 flex flex-col justify-end h-full flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <CategoryTag category={heroMain.category} className="!bg-white/10 !text-white/80 !border-white/20 !px-5 !py-2 !text-[13px]" />
              </div>
              <Link href={`/article/${heroMain.id}`}>
                <h2 className="text-4xl lg:text-[46px] font-black text-white leading-[1.1] tracking-tighter hover:underline decoration-white/20 underline-offset-8 transition-all">
                  {heroMain.title}
                </h2>
              </Link>
              <p className="text-white/60 text-xl font-medium line-clamp-2 leading-relaxed max-w-2xl italic">
                {heroMain.summary}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {heroSide.map((side, idx) => (
                <Link key={idx} href={`/article/${side.id}`} 
                    className="flex-1 bg-white rounded-[2.5rem] p-6 border border-slate-100 flex items-center gap-4 hover:shadow-2xl transition-all duration-500 hover:-translate-x-2 group">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border-2 border-slate-50 bg-white">
                        <img 
                          src={side.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          alt="side" 
                          onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                        />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <CategoryTag category={side.category} className="!px-2 !py-0.5 !text-[9px]" />
                        <h3 className="font-extrabold text-slate-800 text-[17px] leading-tight line-clamp-2 tracking-tighter group-hover:text-deep-navy transition-colors">{side.title}</h3>
                    </div>
                </Link>
            ))}
          </div>
        </section>

        {/* Latest Reports Grid (Reverted to Vibrant Item Style) */}
        <section>
          <div className="flex items-end justify-between mb-12 border-b border-gray-100 pb-6 italic text-slate-900">
            <h3 className="text-3xl font-black tracking-tighter">Latest Intelligence.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {remainingItems.map((item: any) => (
                <Link href={`/article/${item.id}`} key={item.id}
                  className="group bg-white rounded-[3rem] p-6 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-4 border border-slate-50 hover:border-white"
                >
                  <div className="relative aspect-[16/10] rounded-[30px] overflow-hidden mb-6 border-2 border-slate-50 bg-white">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      alt={item.title} 
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                    />
                  </div>
                  <div className="space-y-4 px-2">
                    <CategoryTag category={item.category} />
                    <h4 className="font-extrabold text-slate-800 text-[21px] leading-snug group-hover:text-deep-navy transition-colors tracking-tight line-clamp-2 min-h-[60px]">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-40 py-24 text-center">
        <h2 className="text-4xl font-black text-deep-navy tracking-tighter uppercase italic">Giteul Media.</h2>
      </footer>
    </div>
  );
}
