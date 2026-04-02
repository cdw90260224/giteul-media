'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// MSN Portal Style Fallback Items
const FALLBACK_ITEMS = [
  { 
    id: 1, 
    title: '글로벌 B2B SaaS 가치 평가, ARR 10배 규칙은 깨졌는가', 
    summary: '벤처 캐피탈의 평가 기준 업데이트와 실시간 Revenue Multiples 변화를 통해 적정 가치를 도출하는 전문 리포트입니다.', 
    category: '시장 분석', 
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 2, 
    title: 'AI 솔루션 도입률 1위 산업군은? 금융 데이터 전격 리뷰', 
    summary: '가장 보수적인 금융권에서 생성형 AI가 도입되는 속도와 규모를 분석했습니다. B2B 솔루션 기업들이 주목해야 할 시장입니다.', 
    category: '리서치', 
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', 
    created_at: new Date().toISOString() 
  },
];

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          setNewsItems(data);
        }
      } catch (e) {
        console.error('Supabase fetch error:', e);
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
        alert('발행 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const heroItem = newsItems[0] || FALLBACK_ITEMS[0];
  const listItems = newsItems.length > 1 ? newsItems.slice(1, 5) : FALLBACK_ITEMS;

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Navigation Header */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-3xl font-black text-deep-navy tracking-tight">기틀</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-8 mt-1 text-sm font-bold text-gray-500">
              <span className="text-deep-navy border-b-2 border-deep-navy pb-1 cursor-default">홈 (오늘의 지표)</span>
              <span className="hover:text-deep-navy cursor-pointer transition-colors">스타트업 M&A</span>
              <span className="hover:text-deep-navy cursor-pointer transition-colors">리서치 랩</span>
              <Link href="/admin" className="hover:text-deep-navy transition-colors opacity-30">Admin</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <input 
                type="text" 
                placeholder="검색어를 입력하세요..." 
                className="w-56 bg-[#F0F2F5] border border-transparent text-xs rounded-lg py-2.5 px-4 focus:outline-none focus:bg-white focus:border-gray-300 transition-all font-medium"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`bg-deep-navy text-white text-[11px] font-black px-5 py-2.5 rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                generating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#003d82] hover:scale-105 active:scale-95'
              }`}
            >
              {generating ? '⚙️ AI 집필 중...' : '🔥 AI 기사 생성'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 space-y-12">
        
        {/* Split Hero Section (MSN Inspired Layout) */}
        <section className="bg-deep-navy rounded-[30px] overflow-hidden flex flex-col md:flex-row items-stretch shadow-2xl border border-white/5 min-h-[500px]">
          <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-deep-navy">
            <div className="mb-6">
                <span className="bg-yellow-400 text-deep-navy text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-tighter shadow-xl">⭐️ 헤드라인 속보</span>
            </div>
            <Link href={`/article/${heroItem.id}`}>
              <h2 className="text-3xl md:text-[44px] font-black text-white leading-[1.15] mb-6 hover:underline decoration-white/30 decoration-2 underline-offset-8 cursor-pointer">
                {heroItem.title}
              </h2>
            </Link>
            <p className="text-white/70 text-base md:text-lg font-medium line-clamp-3 leading-relaxed mb-8 max-w-xl">
              {heroItem.summary}
            </p>
          </div>
          <div className="flex-1 w-full relative p-4 md:p-8 bg-deep-navy flex items-center justify-center">
            <div className="relative w-full h-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform rotate-0 md:rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src={heroItem.image_url} 
                className="w-full h-full object-cover"
                alt="Headline"
                onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
          </div>
        </section>

        {/* Card Grid Section */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">최신 업데이트</h3>
            <span className="text-xs font-bold text-gray-400 cursor-pointer hover:text-deep-navy transition-colors">전체보기 →</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {listItems.map((item: any) => (
              <Link href={`/article/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={item.image_url} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={item.title}
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-6 flex flex-col flex-1 min-h-[180px]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-deep-navy bg-blue-50 px-2 py-0.5 rounded-sm uppercase tracking-widest border border-blue-100">
                      {item.category || 'ANALYSIS'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[#1a1a1a] leading-snug group-hover:text-deep-navy transition-colors line-clamp-2 md:line-clamp-3 mb-4 text-[17px] min-h-[52px]">
                    {item.title}
                  </h4>
                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-5 h-5 rounded bg-deep-navy flex items-center justify-center text-[10px] text-white font-bold shrink-0">기</div>
                        <span className="text-[11px] font-bold text-gray-500 truncate">기틀 미디어</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">
                      {new Date(item.created_at || Date.now()).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      
      {/* Branding Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24 py-16">
        <div className="max-w-[1400px] mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-black text-deep-navy tracking-tighter uppercase italic">Giteul Media</h2>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.3em]">Precision B2B Intelligence</p>
          <div className="pt-8 flex items-center justify-center gap-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Careers</span>
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-deep-navy cursor-pointer transition-colors">Inquiry</span>
          </div>
          <p className="pt-8 text-[11px] text-gray-300 font-medium">© 2026 Giteul Media. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
