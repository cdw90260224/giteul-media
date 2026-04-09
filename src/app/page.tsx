'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 카테고리별 컬러 시스템
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '정부지원공고':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  label: 'Gov Strategy' },
  'AI/테크 트렌드': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
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

function DDayBadge({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const today = new Date('2026-04-09'); // 시스템 기준 날짜
  const dDate = new Date(deadline);
  if (isNaN(dDate.getTime())) return null;

  const diff = dDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  let label = `D-${days}`;
  let color = 'bg-red-600';

  if (days === 0) label = 'D-DAY';
  else if (days < 0) { label = 'CLOSED'; color = 'bg-slate-400'; }
  else if (days > 7) { label = `D-${days}`; color = 'bg-blue-600'; }

  return (
    <span className={`${color} text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-widest animate-pulse`}>
      {label}
    </span>
  );
}

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const today = new Date('2026-04-09');
          const sorted = [...data].sort((a, b) => {
            const isAClosed = a.deadline_date && new Date(a.deadline_date) < today;
            const isBClosed = b.deadline_date && new Date(b.deadline_date) < today;
            if (isAClosed && !isBClosed) return 1;
            if (!isAClosed && isBClosed) return -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setNewsItems(sorted);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/auto-post', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCategory: activeCategory }) 
      });
      if (res.ok) window.location.reload();
      else alert('집필 실패. 다시 시도해 주세요.');
    } catch { alert('네트워크 오류'); } finally { setGenerating(false); }
  };

  // 1단계 서열 정리: 주인공(창업공고) vs 병풍(나머지)
  const startupPosts = newsItems.filter(i => i.category === '정부지원공고' && !i.title.startsWith('[전략]'));
  const otherPosts = newsItems.filter(i => i.category !== '정부지원공고' || i.title.startsWith('[전략]'));

  // 상단 히어로: 마감 임박 3개
  const today = new Date('2026-04-09');
  const dDayHeroItems = startupPosts
    .filter(i => i.deadline_date && new Date(i.deadline_date) >= today)
    .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Professional GNB */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-3xl font-black text-blue-600 tracking-tighter italic">기틀.</Link>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => setActiveCategory('전체')} className={`text-[15px] font-bold ${activeCategory === '전체' ? 'text-blue-600' : 'text-slate-500'}`}>창업지원공고</button>
              <button onClick={() => setActiveCategory('AI/테크 트렌드')} className={`text-[15px] font-bold ${activeCategory === 'AI/테크 트렌드' ? 'text-blue-600' : 'text-slate-500'}`}>기술/시장 분석</button>
            </nav>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {generating ? '생성 중...' : '🔥 실시간 새 공고 수집'}
          </button>
        </div>
      </header>

      {/* Hero Section: 마감 임박 (The D-Day Stage) */}
      <section className="bg-slate-50 py-16 border-b border-slate-100">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest animate-pulse">Critical</span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 italic">오늘 놓치면 끝나는 긴급 공고</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dDayHeroItems.length > 0 ? dDayHeroItems.map((item) => (
              <Link key={item.id} href={`/article/${item.id}`} className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-red-500/20 hover:shadow-2xl transition-all h-full flex flex-col justify-between">
                <div>
                  <DDayBadge deadline={item.deadline_date} />
                  <h3 className="text-xl font-black mt-6 leading-snug text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-3">
                    {item.title}
                  </h3>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-bold">
                   <span>{item.category}</span>
                   <span className="text-blue-500">자세히 보기 →</span>
                </div>
              </Link>
            )) : <div className="col-span-3 text-center py-10 bg-white rounded-3xl text-slate-400 font-bold italic">진행 중인 마감 임박 공고가 없습니다.</div>}
          </div>
        </div>
      </section>

      {/* Main Content: 80% List vs 20% Sub */}
      <main className="max-w-[1240px] mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16">
        
        {/* Left Side: 주인공 리스트 (Main Feed) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-black tracking-tighter italic text-slate-900 uppercase">Start-up Notice Feed.</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest italic">
               <span>Total {startupPosts.length}</span>
               <span className="opacity-20">|</span>
               <span>Live Status</span>
            </div>
          </div>

          <div className="space-y-1">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse mb-4" />)
            ) : startupPosts.map((item) => (
              <Link key={item.id} href={`/article/${item.id}`} 
                className="flex items-center gap-6 py-6 border-b border-slate-100 hover:bg-slate-50 px-4 -mx-4 rounded-2xl transition-all group overflow-hidden"
              >
                <div className="shrink-0">
                  <DDayBadge deadline={item.deadline_date} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[19px] font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate tracking-tighter">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[14px] text-slate-500 font-bold italic">
                    <span className="text-blue-500 opacity-60">정부지원</span>
                    <span className="text-slate-200">|</span>
                    <span className="text-slate-400">마감일: {item.deadline_date}</span>
                    <span className="text-slate-200">|</span>
                    <span className="text-slate-300">집필 AI 전략가</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <CategoryTag category={item.category} className="opacity-40" />
                </div>
              </Link>
            ))}
          </div>

          {!loading && startupPosts.length === 0 && (
             <div className="text-center py-40 border-4 border-dashed border-slate-50 rounded-[4rem]">
                 <p className="text-slate-300 text-2xl font-black italic">표시할 공고가 없습니다.</p>
                 <button onClick={handleGenerate} className="mt-8 text-blue-600 font-black hover:underline">공고 수집 시작하기</button>
             </div>
          )}
        </div>

        {/* Right Side: 병풍 (Strategies & Others) */}
        <aside className="w-full lg:w-[320px] shrink-0">
          <div className="bg-slate-50 rounded-[2.5rem] p-8 sticky top-32 border border-slate-100">
             <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 italic">Sub Intelligence.</h4>
             
             <div className="space-y-12">
               {otherPosts.slice(0, 6).map((other) => (
                 <Link key={other.id} href={`/article/${other.id}`} className="block group">
                   <CategoryTag category={other.category} className="!px-2 !py-0.5 !text-[8px] mb-3 block w-fit" />
                   <h5 className="text-[15px] font-black text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                     {other.title}
                   </h5>
                   <p className="text-[12px] text-slate-400 mt-2 font-bold italic">자세히 보기 →</p>
                 </Link>
               ))}
               
               {otherPosts.length === 0 && <p className="text-slate-300 text-xs font-bold italic py-10">보조 정보가 없습니다.</p>}
             </div>

             <div className="mt-16 pt-10 border-t border-slate-200">
               <div className="bg-[#002B5B] p-6 rounded-3xl text-center">
                  <p className="text-white text-xs font-black tracking-widest mb-4 italic">PREMIUM INSIGHT</p>
                  <p className="text-white/50 text-[10px] leading-relaxed font-bold">기틀 미디어는 AI를 통해<br/>가장 빠른 경영 전략을 제공합니다.</p>
               </div>
             </div>
          </div>
        </aside>

      </main>

      <footer className="w-full bg-white border-t border-slate-100 py-24 text-center">
        <span className="text-5xl font-black text-slate-50 tracking-tighter uppercase italic select-none">Giteul Media Hub.</span>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;400;700;900&display=swap');
        body { font-family: 'Pretendard', -apple-system, sans-serif; letter-spacing: -0.01em; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </div>
  );
}
