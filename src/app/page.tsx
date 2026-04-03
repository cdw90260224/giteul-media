'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// MSN Portal Style Fallback Items
const FALLBACK_ITEMS = [
  { id: 1, title: '창업지원사업 AI 분석 리포트를 무인 발행합니다', summary: '기틀 미디어의 새로운 Auto-Pilot 엔진이 가동되었습니다. 이제 실시간으로...', category: '시스템 소식', image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71', created_at: new Date().toISOString() },
  { id: 2, title: 'K-Startup 합격 전략 가이드 업데이트 완료', summary: '제미나이 2.5가 분석하는 팁스(TIPS) 및 예창패 필승 키워드를 확인하세요.', category: '이용 안내', image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', created_at: new Date().toISOString() },
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
    } catch (e) {
      alert('네트워크 오류');
    } finally {
      setGenerating(false);
    }
  };

  const heroItem = newsItems[0] || FALLBACK_ITEMS[0];
  const listItems = newsItems.length > 1 ? newsItems.slice(1) : FALLBACK_ITEMS;

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Header Navigation */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 py-4 px-8 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/">
              <h1 className="text-3xl font-black text-deep-navy italic tracking-tighter">기틀.</h1>
            </Link>
            <nav className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span className="text-deep-navy border-b-2 border-deep-navy pb-1 cursor-default">Intelligence Portal</span>
              <span className="hover:text-deep-navy transition-colors cursor-pointer">Support Strategy</span>
              <span className="hover:text-deep-navy transition-colors cursor-pointer">Startup Trends</span>
              <Link href="/admin" className="opacity-20 hover:opacity-100 transition-opacity">Mgt Panel</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`bg-deep-navy text-white text-[11px] font-black px-6 py-2.5 rounded-full shadow-lg transition-all tracking-[0.1em] ${
                generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {generating ? '집필 중...' : '🔥 새 기사 집필'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">
        
        {/* Split Hero Section - MSN High End Style */}
        <section className="bg-deep-navy rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-stretch shadow-[0_50px_100px_-30px_rgba(0,43,91,0.3)] border border-white/5 min-h-[550px] relative">
          <div className="flex-1 p-10 lg:p-20 flex flex-col justify-center space-y-8 relative z-10 bg-deep-navy">
            <div className="flex items-center gap-4">
                <span className="bg-yellow-400 text-deep-navy text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tighter shadow-xl">HOT Intelligence</span>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{heroItem.category}</span>
            </div>
            <Link href={`/article/${heroItem.id}`}>
              <h2 className="text-4xl lg:text-[56px] font-black text-white leading-[1.05] tracking-tighter hover:underline decoration-white/20 underline-offset-8 transition-all">
                {heroItem.title}
              </h2>
            </Link>
            <p className="text-white/60 text-lg lg:text-xl font-medium line-clamp-3 leading-relaxed max-w-2xl italic">
              {heroItem.summary}
            </p>
            <div className="pt-4">
                <Link href={`/article/${heroItem.id}`} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all inline-block hover:scale-105 active:scale-95">Open Report →</Link>
            </div>
          </div>
          <div className="flex-1 w-full relative p-6 lg:p-12 bg-deep-navy">
            <div className="relative w-full h-full aspect-[4/3] lg:aspect-auto rounded-[2.5rem] overflow-hidden shadow-2xl transform rotate-0 lg:rotate-2 hover:rotate-0 transition-transform duration-700">
              <img 
                src={heroItem.image_url} 
                className="w-full h-full object-cover"
                alt="Headline"
                onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/40 to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Latest Reports Grid */}
        <section>
          <div className="flex items-end justify-between mb-12 border-b border-gray-100 pb-6 italic">
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Latest Intelligence.</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">실시간 수집 및 분석된 창업지원사업 리포트</p>
            </div>
            <span className="text-[10px] font-black text-gray-400 cursor-pointer hover:text-deep-navy transition-colors tracking-widest border border-slate-200 px-4 py-1.5 rounded-full uppercase">View All</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {listItems.map((item: any) => (
              <Link href={`/article/${item.id}`} key={item.id} className="group bg-white rounded-[40px] p-6 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-4 border border-slate-50 hover:border-white">
                <div className="relative aspect-[16/10] rounded-[30px] overflow-hidden mb-6 border-2 border-slate-50">
                  <img 
                    src={item.image_url} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt={item.title}
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'; }}
                  />
                </div>
                <div className="space-y-4 px-2">
                  <span className="text-[9px] font-black text-deep-navy bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                    {item.category || 'ANALYSIS'}
                  </span>
                  <h4 className="font-extrabold text-slate-800 text-[19px] leading-snug group-hover:text-deep-navy transition-colors tracking-tight line-clamp-2 min-h-[54px]">
                    {item.title}
                  </h4>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>기틀 분석 팀</span>
                    <span>{new Date(item.created_at || Date.now()).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      
      {/* Footer Branded */}
      <footer className="bg-white border-t border-gray-100 mt-40 py-24">
        <div className="max-w-[1400px] mx-auto px-10 text-center space-y-8 italic">
          <h2 className="text-4xl font-black text-deep-navy tracking-tighter uppercase italic">Giteul Media.</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.4em]">Integrated Intelligence for K-Starups & B2B Analysis</p>
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
