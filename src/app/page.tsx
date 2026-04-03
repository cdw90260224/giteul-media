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
        if (!error && data && data.length > 0) setNewsItems(data);
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

  const categories = ['전체', '정부지원공고', 'AI/테크 트렌드', '기업/마켓 뉴스', '글로벌 뉴스'];
  const filteredItems = activeCategory === '전체'
    ? newsItems
    : newsItems.filter(i => i.category === activeCategory);

  const heroItem = filteredItems[0] ?? FALLBACK_ITEMS[0];
  const listItems = filteredItems.slice(1);

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
              {/* Dropdown: INTELLIGENCE PORTAL */}
              <div className="relative group h-20 flex items-center">
                <button 
                  className={`text-[17px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${
                    activeCategory === '전체' || Object.keys(CAT_CONFIG).includes(activeCategory) 
                    ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'
                  }`}
                >
                  INTELLIGENCE PORTAL
                  <svg className="w-5 h-5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {/* Dropdown Menu */}
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

              <button 
                onClick={() => setActiveCategory('정부지원공고')}
                className={`text-[17px] font-black uppercase tracking-widest transition-colors ${activeCategory === '정부지원공고' ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}
              >
                SUPPORT STRATEGY
              </button>
              
              <button 
                onClick={() => setActiveCategory('AI/테크 트렌드')}
                className={`text-[17px] font-black uppercase tracking-widest transition-colors ${activeCategory === 'AI/테크 트렌드' ? 'text-deep-navy' : 'text-slate-400 hover:text-deep-navy'}`}
              >
                STARTUP TRENDS
              </button>
              
              <Link href="/admin" className="text-[17px] font-black text-slate-200 hover:text-deep-navy transition-colors uppercase tracking-widest opacity-30 hover:opacity-100">Mgt</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`bg-deep-navy text-white text-[14px] font-black px-10 py-4 rounded-full shadow-xl transition-all tracking-[0.15em] border-2 border-transparent hover:border-white/20 ${
                generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {generating ? '집필 중...' : '🔥 새 기사 집필'}
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb / Status Bar */}
      <div className="bg-slate-50 border-b border-slate-100 py-4 px-8 italic">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[13px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-3">
             <span className="text-deep-navy">GITEUL</span>
             <span>/</span>
             <span className="text-slate-900">{activeCategory === '전체' ? 'PORTAL HOME' : activeCategory}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            LIVE INTELLIGENCE: {filteredItems.length} REPORTS LOADED
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">

        {/* Hero Section */}
        <section className="bg-deep-navy rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-stretch shadow-[0_50px_100px_-30px_rgba(0,43,91,0.3)] border border-white/5 min-h-[550px]">
          <div className="flex-1 p-10 lg:p-20 flex flex-col justify-center space-y-8 relative z-10">
            <div className="flex items-center gap-4">
              <span className="bg-yellow-400 text-deep-navy text-[12px] font-black px-4 py-2 rounded-lg uppercase tracking-tighter shadow-xl">HOT Intelligence</span>
              <CategoryTag category={heroItem.category} className="!bg-white/10 !text-white/80 !border-white/20 !px-5 !py-2 !text-[13px]" />
            </div>
            <Link href={`/article/${heroItem.id}`}>
              <h2 className="text-4xl lg:text-[46px] font-black text-white leading-[1.1] tracking-tighter hover:underline decoration-white/20 underline-offset-8 transition-all">
                {heroItem.title}
              </h2>
            </Link>
            <p className="text-white/60 text-xl font-medium line-clamp-3 leading-relaxed max-w-2xl italic">
              {heroItem.summary}
            </p>
            {heroItem.deadline_date && (
              <div className="flex items-center gap-3 text-yellow-300 text-[14px] font-black uppercase tracking-widest">
                <span>⏰</span>
                <span>마감 {heroItem.deadline_date}</span>
              </div>
            )}
            <div className="pt-4">
              <Link href={`/article/${heroItem.id}`} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all inline-block hover:scale-105 active:scale-95">Open Report →</Link>
            </div>
          </div>
          <div className="flex-1 w-full p-6 lg:p-12 bg-deep-navy">
            <div className="relative w-full h-full aspect-[4/3] lg:aspect-auto rounded-[2.5rem] overflow-hidden shadow-2xl rotate-0 lg:rotate-2 hover:rotate-0 transition-transform duration-700">
              <img
                src={heroItem.image_url}
                className="w-full h-full object-cover"
                alt="Headline"
                onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/40 to-transparent" />
            </div>
          </div>
        </section>

        {/* Latest Reports Grid */}
        <section>
          <div className="flex items-end justify-between mb-12 border-b border-gray-100 pb-6 italic">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Latest Intelligence.</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">AI가 실시간 수집·분류·집필한 창업 인텔리전스 리포트</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[1,2,3,4].map(i => <div key={i} className="h-80 bg-white rounded-[40px] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {listItems.map((item: any) => (
                <Link
                  href={`/article/${item.id}`}
                  key={item.id}
                  className="group bg-white rounded-[40px] p-6 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-4 border border-slate-50 hover:border-white"
                >
                  <div className="relative aspect-[16/10] rounded-[30px] overflow-hidden mb-6 border-2 border-slate-50">
                    <img
                      src={item.image_url}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt={item.title}
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                    />
                  </div>
                  <div className="space-y-4 px-2">
                    <CategoryTag category={item.category} />
                    <h4 className="font-extrabold text-slate-800 text-[22px] leading-snug group-hover:text-deep-navy transition-colors tracking-tight line-clamp-2 min-h-[60px]">
                      {item.title}
                    </h4>
                    {item.deadline_date && (
                      <p className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        new Date(item.deadline_date) < new Date() ? 'text-slate-300' : 'text-red-500'
                      }`}>
                        {new Date(item.deadline_date) < new Date() ? (
                          <>
                            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px]">CLOSED</span>
                            <span className="line-through">마감 {item.deadline_date}</span>
                          </>
                        ) : (
                          <>
                            <span>⏰</span>
                            <span>마감 {item.deadline_date}</span>
                          </>
                        )}
                      </p>
                    )}
                    <div className="pt-5 border-t border-slate-50 flex items-center justify-between text-[12px] font-bold text-slate-300 uppercase tracking-widest">
                      <span>기틀 분석팀</span>
                      <span>{new Date(item.created_at || Date.now()).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {listItems.length === 0 && (
                <div className="col-span-4 text-center py-24 opacity-50 font-medium text-slate-400">
                  {activeCategory !== '전체' ? `'${activeCategory}' 카테고리 기사가 아직 없습니다.` : '아직 기사가 없습니다. 새 기사를 집필해 주세요!'}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-40 py-24">
        <div className="max-w-[1400px] mx-auto px-10 text-center space-y-8 italic">
          <h2 className="text-4xl font-black text-deep-navy tracking-tighter uppercase italic">Giteul Media.</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.4em]">Integrated Intelligence for K-Startups & B2B Analysis</p>
          <div className="pt-10 flex items-center justify-center gap-10 text-[10px] text-gray-300 font-black uppercase tracking-widest">
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Governance</span>
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Intelligence Privacy</span>
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Contact Intelligence</span>
          </div>
          <p className="pt-10 text-[10px] text-slate-200 font-bold uppercase tracking-widest">© 2026 Giteul Media Intelligence Lab. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
