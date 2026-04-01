'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const FALLBACK_ITEMS = [
  {
    id: 101,
    title: "데이터 기반 B2B 리서치의 정석: 기틀 미디어의 지향점",
    summary: "샘플 데이터입니다. 위의 'AI 기사 자동 생성' 버튼을 누르면 이 자리에 실제 생성된 리포트가 채워집니다.",
    date: "2026.04.01",
    category: "안내",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
  },
  {
    id: 102,
    title: "수파베이스 연동 가이드: 환경 변수를 등록해 주세요",
    summary: "Vercel 설정에서 NEXT_PUBLIC_SUPABASE_URL 키를 등록하면 실제 데이터베이스의 글이 이곳에 나타납니다.",
    date: "2026.04.01",
    category: "가이드",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f"
  }
];

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        setNewsItems(data);
      } else {
        setNewsItems(FALLBACK_ITEMS); // 데이터 없을 때 샘플 노출
      }
    } catch (e) {
      setNewsItems(FALLBACK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/auto-post', { method: 'POST' });
      if (res.ok) {
        alert('AI가 새로운 기사를 성공적으로 집필하고 업로드했습니다! 🎉');
        await fetchPosts();
      }
    } catch (e) {
      alert('자동 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const displayItems = newsItems.length > 0 ? newsItems : FALLBACK_ITEMS;

  return (
    <main className="flex-1 flex flex-col items-center min-h-screen pb-20 font-sans bg-[#F0F2F5]">
      
      {/* Portal Top Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-3xl font-black text-[#002B5B] tracking-tight">기틀</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6 mt-1">
              <span className="text-sm font-bold text-[#002B5B] border-b-2 border-[#002B5B] pb-1 cursor-pointer">홈</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-[#002B5B] cursor-pointer transition-colors">스타트업 M&A</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-[#002B5B] cursor-pointer transition-colors">리서치 랩</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerate}
                disabled={generating}
                className={`flex items-center gap-2 px-4 py-2 bg-[#002B5B] text-white text-sm font-black rounded-lg hover:bg-opacity-90 transition-all ${generating ? 'animate-pulse' : 'hover:scale-105 active:scale-95'}`}
            >
                {generating ? '🤖 집필 중...' : '🔥 AI 기사 자동 생성'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
        
        {/* Top Featured Headline */}
        {displayItems.length > 0 && (
          <section className="mb-10 w-full bg-[#002B5B] rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row items-center cursor-pointer group hover:shadow-xl transition-shadow duration-300">
             <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
               <span className="text-xs font-bold tracking-widest uppercase mb-3 text-white/70 bg-white/10 w-fit px-3 py-1 rounded-sm font-sans">
                 🌟 헤드라인 속보
               </span>
               <h2 className="text-3xl md:text-5xl font-black mb-5 leading-[1.15] text-white font-sans group-hover:text-blue-100 transition-colors">
                 {displayItems[0].title}
               </h2>
               <p className="text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed font-sans">
                 {displayItems[0].summary}
               </p>
             </div>
             <div className="w-full md:w-1/2 md:h-full aspect-video md:aspect-auto bg-gray-800 relative overflow-hidden">
               <img 
                 src={displayItems[0].image_url || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf"} 
                 alt="Headline" 
                 className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
               />
             </div>
          </section>
        )}

        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight font-sans">최신 업데이트</h2>
          <div className="flex-1 h-[1px] bg-gray-300 ml-4"></div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayItems.slice(1).map((item) => (
            <Link href={`/article/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#002B5B]/30 transition-all duration-300 overflow-hidden">
              <div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71"} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center mb-3">
                  <span className="text-[11px] font-black text-[#002B5B] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded tracking-wide font-sans">
                    {item.category || '뉴스'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-snug group-hover:text-[#002B5B] transition-colors line-clamp-2 font-sans">
                  {item.title}
                </h3>
                <p className="text-[14px] text-gray-600 line-clamp-2 mb-6 flex-1 leading-[1.6] font-sans font-medium">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#002B5B] flex items-center justify-center rounded-sm">
                      <span className="text-[8px] font-black text-white">G</span>
                    </span>
                    <span className="text-xs font-black text-[#002B5B] tracking-tight font-sans">기틀 미디어</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 font-sans tracking-wide">
                    {item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : '')}
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
