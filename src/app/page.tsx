'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 카테고리별 컬러 시스템
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '정부지원공고':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  label: 'Gov Strategy' },
  'AI/테크 트렌드': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  'AI/Tech':      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  'ai/tech':      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  '기업/마켓 뉴스': { bg: 'bg-teal-50',  text: 'text-teal-700',  border: 'border-teal-200',  label: 'Market' },
  '글로벌 뉴스':   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'Global' },
};
const DEFAULT_CAT = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'REPORT' };

function CategoryTag({ category, className = '' }: { category: string; className?: string }) {
  const c = CAT_CONFIG[category] ?? DEFAULT_CAT;
  return (
    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border 
      ${c.bg} ${c.text} ${c.border} ${className} italic`}>
      {c.label}
    </span>
  );
}

const FALLBACK_ITEMS = [
  { id: 1, title: '[전략] 창업지원사업 AI 분석 리포트 무인 발행 가이드', summary: '기능별 자동 뉴스 취재 엔진이 가동되었습니다.', category: '정부지원공고', image_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85', created_at: new Date().toISOString() },
];

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) setNewsItems(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // [지능형 분기] 현재 활성 카테고리에 맞춰 AI 취재 지시
      const res = await fetch('/api/auto-post', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCategory: activeCategory }) 
      });
      if (res.ok) window.location.reload();
      else alert('집필 실패. 다시 시도해 주세요.');
    } catch { alert('네트워크 오류'); } finally { setGenerating(false); }
  };

  const filteredItems = activeCategory === '전체' 
    ? newsItems 
    : newsItems.filter(i => {
        // [Synonym Mapping] Unify AI/Tech variations in filter
        if (activeCategory === 'AI/테크 트렌드') {
            return ['AI/테크 트렌드', 'AI/Tech', 'ai/tech', 'AI/테크'].includes(i.category);
        }
        return i.category === activeCategory;
    });

  const heroMain = filteredItems.find(i => i.category === '정부지원공고') || filteredItems[0] || FALLBACK_ITEMS[0];
  const heroSide = filteredItems.filter(i => i.id !== heroMain.id).slice(0, 4);
  const remainingItems = filteredItems.filter(i => i.id !== heroMain.id && !heroSide.find(s => s.id === i.id));

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Header & Navigation (Standard High-Authority) */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm font-sans">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-16">
            <Link href="/" onClick={() => setActiveCategory('전체')} className="text-4xl font-black text-deep-navy italic tracking-tighter">기틀.</Link>
            <nav className="hidden lg:flex items-center gap-10">
              {['전체', '정부지원공고', 'AI/테크 트렌드', '기업/마켓 뉴스', '글로벌 뉴스'].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`text-[16px] font-black uppercase tracking-widest transition-colors ${activeCategory === cat ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}
                >
                  {cat === '전체' ? 'PORTAL HOME' : (cat === '정부지원공고' ? 'SUPPORT STRATEGY' : cat)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={handleGenerate} 
              disabled={generating} 
              className={`bg-deep-navy text-white text-[13px] font-black px-10 py-4 rounded-full shadow-2xl transition-all tracking-[0.1em] border-2 border-transparent hover:border-white/20 ${generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'}`}
            >
              {generating ? 'ANALYZING...' : `🔥 ${activeCategory === '정부지원공고' ? '전략 리포트 집필' : '새 뉴스 취재 시작'}`}
            </button>
          </div>
        </div>
      </header>

      {/* Breaking News Ticker */}
      <div className="w-full bg-deep-navy text-white py-4 overflow-hidden border-b border-white/10 relative z-40">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center gap-8">
            <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1.5 rounded select-none shrink-0 animate-pulse uppercase tracking-[0.2em] italic">Breaking News Focus</span>
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

      <main className="max-w-[1440px] mx-auto px-8 py-12 space-y-20">
        {/* Multi-Slot Hero Grid (The Approved 8:4 Grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-8 bg-deep-navy rounded-[3.5rem] overflow-hidden flex flex-col relative shadow-[0_50px_100px_-30px_rgba(0,43,91,0.3)] border border-white/5 min-h-[580px] group shadow-2xl">
            <div className="absolute inset-0 z-0">
                <img
                    src={heroMain.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[4s]"
                    alt="Headline"
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/40 to-transparent" />
            </div>
            <div className="relative z-10 p-12 lg:p-20 flex flex-col justify-end h-full flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <CategoryTag category={heroMain.category} className="!bg-white/10 !text-white/80 !border-white/20 !px-5 !py-2 !text-[13px]" />
                <span className="text-[11px] font-black text-blue-300 uppercase tracking-widest italic animate-pulse">Deep Strategy Analysis</span>
              </div>
              <Link href={`/article/${heroMain.id}`}>
                <h2 className="text-4xl lg:text-[52px] font-black text-white leading-[1.05] tracking-tighter hover:underline decoration-white/20 underline-offset-8 transition-all">
                  {heroMain.title}
                </h2>
              </Link>
              <p className="text-white/80 text-xl font-medium line-clamp-2 leading-[1.6] max-w-2xl tracking-[-0.015em] font-sans">
                {heroMain.summary}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {heroSide.map((side, idx) => (
                <Link key={idx} href={`/article/${side.id}`} 
                    className="flex-1 bg-white rounded-[2.5rem] p-7 border border-slate-100 flex items-center gap-6 hover:shadow-2xl transition-all duration-500 hover:-translate-x-2 group">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border-2 border-slate-50 bg-white">
                        <img 
                          src={side.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          alt="side" 
                          onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                        />
                    </div>
                    <div className="min-w-0 space-y-1.5 flex-1">
                        <CategoryTag category={side.category} className="!px-2 !py-0.5 !text-[9px]" />
                        <h3 className="font-extrabold text-slate-800 text-[18px] leading-tight line-clamp-2 tracking-tighter group-hover:text-deep-navy transition-colors">{side.title}</h3>
                    </div>
                </Link>
            ))}
          </div>
        </section>

        {/* Strategic Intelligence Grid */}
        <section>
          <div className="flex items-end justify-between mb-12 border-b border-gray-100 pb-8 italic text-slate-900 overflow-hidden">
            <h3 className="text-4xl font-black tracking-tighter uppercase italic">Latest Strategic Analysis.</h3>
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest hidden md:block">Real-time Giteul Intelligence</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {remainingItems.map((item: any) => (
                <Link href={`/article/${item.id}`} key={item.id}
                  className="group bg-white rounded-[3.5rem] p-7 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-4 border border-slate-50 hover:border-white"
                >
                  <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-8 border-2 border-slate-50 bg-white">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
                      alt={item.title} 
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                    />
                  </div>
                  <div className="space-y-4 px-2">
                    <CategoryTag category={item.category} />
                    <h4 className="font-extrabold text-[#0f172a] text-[23px] leading-snug group-hover:text-deep-navy transition-colors tracking-tighter line-clamp-2 min-h-[60px]">
                      {item.title}
                    </h4>
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest italic">
                       <span>기틀 매니저</span>
                       <span>{new Date(item.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-40 py-24 text-center">
        <h2 className="text-5xl font-black text-deep-navy tracking-tighter uppercase italic opacity-10">Giteul Media.</h2>
      </footer>
    </div>
  );
}
