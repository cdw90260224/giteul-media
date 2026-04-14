'use client';
import { useState, useEffect } from 'react';
import Link from 'react-router-dom'; // Next.js Link instead? Wait, project uses Next.js Link
import { useRouter } from 'next/navigation';
import LinkNext from 'next/link';
import { supabase } from '@/lib/supabase';

// 카테고리별 컬러 시스템
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '정부지원공고': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Gov Strategy' },
  'AI/테크 트렌드': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  'AI/Tech': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  'ai/tech': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'AI/Tech' },
  '기업/마켓 뉴스': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Market' },
  '글로벌 뉴스': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Global' },
};
const DEFAULT_CAT = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'REPORT' };

// 주관기관 파싱 헬퍼
function parseTitle(title: string) {
  let clean = title
    .replace(/^\[.*?\]\s*/, '')
    .replace(/^【.*?】\s*/, '')
    .replace(/D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const separators = [' | ', ' - ', ' : '];
  for (const sep of separators) {
    if (clean.includes(sep)) {
      const parts = clean.split(sep);
      return { title: parts[0].trim(), institution: parts[1].trim() };
    }
  }
  const bracketMatch = clean.match(/^(.*?)\((.*?)\)$/);
  if (bracketMatch) return { title: bracketMatch[1].trim(), institution: bracketMatch[2].trim() };
  
  return { title: clean, institution: '공공기관' };
}

function DDayBadge({ deadline, category, className = "" }: { deadline?: string, category?: string, className?: string }) {
  if (!deadline) {
    const isGov = category === '정부지원공고' || category === 'Strategy' || category?.toLowerCase() === 'strategy';
    return (
      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${isGov ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'} border ${className}`}>
        {isGov ? '[상시]' : 'NEWS'}
      </span>
    );
  }
  const today = new Date('2026-04-13'); 
  const dDate = new Date(deadline);
  if (isNaN(dDate.getTime())) {
    const isGov = category === '정부지원공고' || category === 'Strategy' || category?.toLowerCase() === 'strategy';
    return (
      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${isGov ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'} border ${className}`}>
        {isGov ? '[상시]' : 'NEWS'}
      </span>
    );
  }

  const diff = dDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  let label = `D-${days}`;
  let color = 'bg-slate-900 text-white';

  if (days === 0) { label = 'D-DAY'; color = 'bg-red-600 text-white'; }
  else if (days < 0) { label = 'CLOSED'; color = 'bg-slate-300 text-slate-600'; }
  else if (days <= 7) { label = `D-${days}`; color = 'bg-red-600 text-white'; }
  else if (days > 7) { label = `D-${days}`; color = 'bg-slate-100 text-slate-600 border border-slate-200'; }

  return (
    <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider ${color} ${className}`}>
      {label}
    </span>
  );
}

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat && ['전체', 'strategy', 'tech', '기업/마켓 뉴스'].includes(cat)) {
        setActiveCategory(cat);
      }
    }
  }, []);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    const newUrl = cat === '전체' ? window.location.pathname : `?category=${encodeURIComponent(cat)}`;
    window.history.pushState(null, '', newUrl);
  };

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setNewsItems(data);
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
        body: JSON.stringify({ targetCategory: (activeCategory === '전체' || activeCategory === 'strategy') ? '정부지원공고' : (activeCategory === 'tech' ? 'tech' : activeCategory) })
      });
      const data = await res.json();
      console.log('[Generate Output]', data);
      if (res.ok) {
        if (data.code === 'ALREADY_PUBLISHED') {
          alert('💡 현재 해당 분야의 모든 최신 뉴스가 이미 발행되었습니다. 잠시 후 새로운 소식이 검색되면 다시 시도해 주세요!');
        } else {
          window.location.reload();
        }
      } else {
        alert(`발행 실패: ${data.error || 'AI 엔진 응답 처리 오류'}`);
      }
    } catch { 
      alert('네트워크 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.'); 
    } finally { 
      setGenerating(false); 
    }
  };

  // 데이터 가공 로직
  const govSupportPosts = newsItems.filter(i => (i.category === '정부지원공고' || i.category?.toLowerCase() === 'strategy') && !i.title.startsWith('[전략]'));
  const strategyPosts = newsItems.filter(i => i.title.startsWith('[전략]'));
  const techPosts = newsItems.filter(i => ['AI/테크 트렌드', 'AI/Tech', 'ai/tech', 'tech', 'Tech'].includes(i.category));
  
  const heroMain = govSupportPosts[0] || newsItems[0] || { id: 0, title: '기틀 미디어가 최신 소식을 준비 중입니다.', summary: '잠시만 기다려 주세요.', category: 'NOTICE' };
  const latestList = newsItems.filter(i => i.id !== heroMain.id).slice(0, 5);
  const magazineList = strategyPosts.slice(0, 4);
  const filteredItems = activeCategory === '전체' 
    ? newsItems 
    : newsItems.filter(i => {
        if (activeCategory === 'strategy') return i.category?.toLowerCase() === 'strategy' || i.category === '정부지원공고';
        if (activeCategory === 'tech') return ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(i.category);
        return i.category === activeCategory;
      });
    
  const baseInfinityList = filteredItems.filter(i => ![heroMain.id, ...latestList.map(l => l.id), ...magazineList.map(m => m.id)].includes(i.id));

  // Autonomous Feed D-Day 스마트 정렬
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allInfinityList = [...baseInfinityList].sort((a, b) => {
    const getRank = (item: any) => {
      if (item.deadline_date) {
        const dDate = new Date(item.deadline_date);
        if (!isNaN(dDate.getTime())) {
          const diffDays = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          // 1순위: 마감 임박 공고 (D-Day 남은 순서대로)
          if (diffDays >= 0) return { group: 1, val: diffDays };
          // 3순위: 마감 완료 공고 (가장 마지막으로 밀어냄)
          if (diffDays < 0) return { group: 3, val: new Date(item.created_at).getTime() * -1 };
        }
      }
      // 2순위: 일반 뉴스 및 상시 공고 (최신 발행순)
      return { group: 2, val: new Date(item.created_at).getTime() * -1 };
    };
    const rankA = getRank(a);
    const rankB = getRank(b);
    if (rankA.group !== rankB.group) return rankA.group - rankB.group;
    return rankA.val - rankB.val;
  });
  
  const searchedList = searchQuery.trim() 
    ? allInfinityList.filter(item => item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) 
    : allInfinityList;

  // 페이지네이션 계산
  const totalPages = Math.ceil(searchedList.length / POSTS_PER_PAGE);
  const infinityList = searchedList.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <LinkNext href="/" onClick={() => setActiveCategory('전체')} className="text-3xl font-black text-slate-900 tracking-tighter">기틀</LinkNext>
            <nav className="hidden lg:flex items-center gap-8">
              {['전체', 'strategy', 'tech', '기업/마켓 뉴스'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`text-sm uppercase tracking-widest transition-all px-2 py-1 ${
                    activeCategory === cat 
                    ? 'text-blue-600 font-black border-b-[3px] border-blue-600 scale-105' 
                    : 'text-slate-400 font-bold hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`bg-slate-900 text-white text-xs font-black px-6 py-3 rounded-full shadow-lg transition-all ${generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'}`}
          >
            {generating ? ' 취재 중...' : `🔥 ${activeCategory === 'strategy' || activeCategory === '전체' ? '전략 리포트 집필' : '새 뉴스 취재 시작'}`}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 섹션 1: 메인 히어로 (MSN 스타일 7:3 분할) */}
        <section className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-20">
          {/* 좌측: Hero (7) */}
          <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
            <LinkNext href={`/article/${heroMain.id}`}>
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src={heroMain.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'} 
                  alt="Hero" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
                />
              </div>
              <div className="p-10">
                <div className="flex items-center gap-3 mb-4">
                   <DDayBadge deadline={heroMain.deadline_date} category={heroMain.category} className="!text-sm !px-4 !py-1.5" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{heroMain.category}</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tighter">
                  {parseTitle(heroMain.title).title}
                </h2>
                <p className="text-lg text-slate-600 line-clamp-2 leading-relaxed font-medium">
                  {heroMain.summary}
                </p>
                <div className="mt-8 text-xs font-bold text-slate-300 uppercase tracking-widest">{parseTitle(heroMain.title).institution} · 기틀 AI 미디어</div>
              </div>
            </LinkNext>
          </div>

          <div className="lg:col-span-12 xl:col-span-3 flex flex-col">
            <h3 className="font-black text-2xl mb-8 text-slate-900 uppercase tracking-tighter italic border-b-4 border-slate-900 pb-3 flex justify-between items-end">
              <span>Latest Highlights</span>
              <span className="text-[10px] font-black text-blue-600 animate-pulse underline select-none">LIVE</span>
            </h3>
            <div className="flex flex-col divide-y-2 divide-slate-900/10 border-b-2 border-slate-900/10">
              {latestList.map((item) => {
                const { title, institution } = parseTitle(item.title);
                return (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="block py-6 group hover:bg-white transition-all px-2 -mx-2 hover:shadow-[20px_0_40px_-10px_rgba(0,0,0,0.05)] border-l-0 hover:border-l-4 hover:border-slate-900 pl-2 hover:pl-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                         <DDayBadge deadline={item.deadline_date} category={item.category} className="!scale-100 !rounded-none !py-0.5" />
                         <span className="text-[10px] font-black text-slate-300 group-hover:text-blue-600 uppercase tracking-widest transition-colors">{item.category}</span>
                      </div>
                      <h4 className="text-[17px] font-extrabold text-slate-800 line-clamp-2 leading-snug group-hover:text-slate-900 transition-colors">{title}</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{institution}</p>
                    </div>
                  </LinkNext>
                );
              })}
            </div>
          </div>
        </section>

        {/* 섹션 2: 매거진형 격자 (딱 한 줄만!) */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Support Strategy & Trend.</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(magazineList.length > 0 ? magazineList : techPosts.slice(0, 4)).map((item) => {
              const isGov = item.category === '정부지원공고' || item.category?.toLowerCase() === 'strategy' || item.title.includes('[전략]');
              const govLogo = 'https://www.mss.go.kr/images/common/logo.png'; // Stable MSS Logo
              const techImg = 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?auto=format&fit=crop&q=80&w=600';
              const defaultImg = isGov ? govLogo : techImg;
              return (
                <LinkNext key={item.id} href={`/article/${item.id}`} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/5">
                  <div className="aspect-video bg-slate-50 rounded-2xl mb-5 overflow-hidden">
                    <div className={isGov ? "w-full h-full flex items-center justify-center p-6 bg-white" : "w-full h-full"}>
                      <img 
                        src={(isGov && !item.image_url?.includes('unsplash') && !item.image_url?.includes('wikimedia')) ? govLogo : (item.image_url || defaultImg)} 
                        alt="Thumbnail" 
                        className={isGov ? "max-w-[80%] max-h-[80%] object-contain" : "w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"}
                        onError={(e: any) => { 
                          if (isGov) e.target.src = 'https://www.k-startup.go.kr/static/portal/img/logo_kstartup.png';
                          else e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71';
                        }}
                      />
                    </div>
                  </div>
                  <h4 className="text-[17px] font-bold text-slate-900 line-clamp-2 mb-3 leading-snug tracking-tight group-hover:text-blue-600">{parseTitle(item.title).title}</h4>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <span className="text-[11px] font-black text-slate-300 uppercase italic">#Insight</span>
                    <span className="text-[11px] font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                  </div>
                </LinkNext>
              );
            })}
          </div>
        </section>

        {/* 섹션 3: 전체 리스트 (네이버 뉴스 스타일) */}
        <section id="feed-start">
          <div className="text-center mb-10">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.4em]">Autonomous Feed</h3>
              <div className="relative max-w-sm w-72 hidden md:block">
                <input
                  type="text"
                  placeholder="기사 제목 검색..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-full px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</div>
              </div>
            </div>
            {/* Mobile search bar */}
            <div className="relative w-full mb-6 md:hidden">
              <input
                type="text"
                placeholder="기사 제목 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-full px-5 py-3 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="h-px bg-slate-100 w-full" />
          </div>
          
          {searchedList.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <span className="text-5xl block mb-6 opacity-20">🍃</span>
              <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {infinityList.map((item) => {
              const { title, institution } = parseTitle(item.title);
              return (
                <LinkNext key={item.id} href={`/article/${item.id}`} className="p-8 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-8 min-w-0">
                    <DDayBadge deadline={item.deadline_date} category={item.category} className="shrink-0 w-16 text-center py-1.5 !text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm" />
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{title}</h4>
                      <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-3">
                         <span className="text-blue-500 font-bold uppercase">{item.category}</span>
                         <span className="opacity-20 text-slate-900">|</span>
                         <span>주관: {institution}</span>
                         <span className="opacity-20 text-slate-900">|</span>
                         <span>{item.deadline_date ? `마감: ${new Date(item.deadline_date).toLocaleDateString('ko-KR')}` : (item.category === '정부지원공고' || item.category?.toLowerCase() === 'strategy' ? '마감: 상시 접수' : '마감: NEWS')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">→</span>
                  </div>
                </LinkNext>
              );
            })}
          </div>
          )}

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button 
                onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 100 : 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all font-bold"
              >
                &lsaquo;
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 100 : 0, behavior: 'smooth' }); }}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${
                    currentPage === pageNum 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 100 : 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all font-bold"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </section>

      </main>

      <footer className="bg-white border-t border-slate-100 py-24 text-center">
        <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase italic tracking-[0.2em]">Giteul Media Portal.</h2>
      </footer>
    </div>
  );
}
