'use client';
import { useState, useEffect } from 'react';
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
  '창업 뉴스': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Startup' },
  '글로벌 뉴스': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Global' },
};
const DEFAULT_CAT = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'REPORT' };

const FILTER_KEYWORDS: Record<string, Record<string, string[]>> = {
  stages: {
    '예비창업': ['예비', '예비창업'],
    '초기(3년 미만)': ['초기', '3년', '창업초기'],
    '도약(7년 미만)': ['도약', '7년', '3년 이상', '창업도약'],
    '성장(7년 이상)': ['성장', '스케일업', '투자'],
  },
  benefits: {
    '자금지원': ['자금', '지원금', '융자', '보증', '투자', '바우처', '상금', '펀드', '지원사업', '창업지원'],
    'R&D': ['r&d', '기술개발', '연구', '개발비', '기술'],
    '공간지원': ['공간', '입주', '보육', '오피스', '창업센터', '센터'],
    '교육·멘토링': ['교육', '멘토링', '컨설팅', '코칭', '네트워킹', '캠프', '세미나', '아카데미'],
    '수출·마케팅': ['수출', '마케팅', '판로', '전시회', '홍보', '글로벌', '해외'],
  }
};
const ALL_TIMELINES = ['전체', '오늘 등록', '마감 임박(D-3)', '상시 모집'];
const ALL_STAGES = ['예비창업', '초기(3년 미만)', '도약(7년 미만)', '성장(7년 이상)'];
const ALL_BENEFITS = ['자금지원', 'R&D', '공간지원', '교육·멘토링', '수출·마케팅'];
const ALL_SECTORS = ['전체', '농업', '기술/IT', '소상공인'];
const INTEREST_SECTORS_KEY = 'giteul_interest_sectors';

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

function SectorBadge({ sector }: { sector: string }) {
  if (!sector || sector === '일반') return null;
  const colors: Record<string, string> = {
    '농업': 'bg-green-50 text-green-700 border-green-200',
    '기술/IT': 'bg-blue-50 text-blue-700 border-blue-200',
    '소상공인': 'bg-orange-50 text-orange-700 border-orange-200'
  };
  const colorClass = colors[sector] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${colorClass} tracking-tight ml-2`}>
      {sector}
    </span>
  );
}

function DDayBadge({ deadline, category, className = "" }: { deadline?: string, category?: string, className?: string }) {
  const isGov = category === '정부지원공고' || category === 'Strategy' || category?.toLowerCase() === 'strategy';
  const isTech = ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(category || '');
  const isMarket = category === '기업/마켓 뉴스';

  const renderNoDeadline = () => {
    if (isGov) return <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border-blue-100 border ${className}`}>[상시]</span>;
    if (isTech) return <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border-purple-100 border ${className}`}>TECH</span>;
    if (isMarket) return <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border-teal-100 border ${className}`}>마켓</span>;
    if (category === '창업 뉴스') return <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold bg-red-600 text-white border-red-600 border shadow-sm ${className}`}>창업</span>;
    return <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border-slate-200 border ${className}`}>뉴스</span>;
  };

  if (!deadline) return renderNoDeadline();
  
  const today = new Date(); 
  today.setHours(0,0,0,0);
  const dDate = new Date(deadline);
  if (isNaN(dDate.getTime())) return renderNoDeadline();
  dDate.setHours(0,0,0,0);

  const diff = dDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  let label = `D-${days}`;
  let color = 'bg-slate-900 text-white';

  if (days === 0) { label = 'D-DAY'; color = 'bg-red-600 text-white'; }
  else if (days < 0) { label = '마감완료'; color = 'bg-slate-300 text-slate-600'; }
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
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ timeline: string; stages: string[]; benefits: string[]; sector: string; }>({ timeline: '전체', stages: [], benefits: [], sector: '전체' });
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat && ['전체', 'strategy', 'news'].includes(cat)) {
        setActiveCategory(cat);
      }
      const t = params.get('timeline');
      const s = params.get('stages');
      const b = params.get('benefits');
      const sec = params.get('sector');
      setFilters({
        timeline: t || '전체',
        stages: s ? s.split(',') : [],
        benefits: b ? b.split(',') : [],
        sector: sec || '전체'
      });
      // 관심분야 로컬스토리지 복구
      const saved = localStorage.getItem(INTEREST_SECTORS_KEY);
      if (saved) setInterestSectors(JSON.parse(saved));
    }
  }, []);

  const updateURLFilters = (newFilters: any) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (newFilters.timeline === '전체') params.delete('timeline');
      else params.set('timeline', newFilters.timeline);
      if (newFilters.stages.length === 0) params.delete('stages');
      else params.set('stages', newFilters.stages.join(','));
      if (newFilters.benefits.length === 0) params.delete('benefits');
      else params.set('benefits', newFilters.benefits.join(','));
      if (newFilters.sector === '전체') params.delete('sector');
      else params.set('sector', newFilters.sector);
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleFilterToggle = (type: 'stages' | 'benefits', value: string) => {
    setFilters(prev => {
      const list = prev[type];
      const newList = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      const newFilters = { ...prev, [type]: newList };
      updateURLFilters(newFilters);
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleTimelineChange = (val: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, timeline: val };
      updateURLFilters(newFilters);
      return newFilters;
    });
    setCurrentPage(1);
  };
  
  const removeFilter = (type: 'timeline' | 'stages' | 'benefits', value?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (type === 'timeline') newFilters.timeline = '전체';
      else if (value) newFilters[type] = (newFilters[type] as string[]).filter(v => v !== value);
      updateURLFilters(newFilters);
      return newFilters;
    });
    setCurrentPage(1);
  };

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

  // 데이터 가공 로직
  const govSupportPosts = newsItems.filter(i => (i.category === '정부지원공고' || i.category?.toLowerCase() === 'strategy') && !i.title.startsWith('[전략]'));
  const strategyPosts = newsItems.filter(i => i.title.startsWith('[전략]'));
  const techPosts = newsItems.filter(i => ['AI/테크 트렌드', 'AI/Tech', 'ai/tech', 'tech', 'Tech'].includes(i.category));
  
  const heroMain = govSupportPosts[0] || newsItems[0] || { id: 0, title: '기틀 미디어가 최신 소식을 준비 중입니다.', summary: '잠시만 기다려 주세요.', category: 'NOTICE' };
  
  // 조회수 기반 인기 기사 정렬 (조회수 데이터가 없다면 고유 ID 등을 활용한 결정론적 랜덤값으로 대체하여 인기 기사 시뮬레이션)
  const getSimulatedViews = (item: any) => item.views !== undefined ? item.views : (item.id * 37) % 500;
  const latestList = [...newsItems]
    .filter(i => i.id !== heroMain.id)
    .sort((a, b) => getSimulatedViews(b) - getSimulatedViews(a))
    .slice(0, 5);

  const magazineList = [...strategyPosts, ...govSupportPosts.slice(0, 2), ...techPosts.slice(0, 2)].slice(0, 4);
  const filteredItems = activeCategory === '전체' 
    ? newsItems 
    : newsItems.filter(i => {
        if (activeCategory === 'strategy') return i.category?.toLowerCase() === 'strategy' || i.category === '정부지원공고';
        if (activeCategory === 'news') return ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech', '기업/마켓 뉴스', '창업 뉴스'].includes(i.category);
        return i.category === activeCategory;
      });
    
  const baseInfinityList = activeCategory === '전체' 
    ? filteredItems.filter(i => ![heroMain.id, ...latestList.map(l => l.id), ...magazineList.map(m => m.id)].includes(i.id))
    : filteredItems;

  // Autonomous Feed D-Day 스마트 정렬
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allInfinityList = [...baseInfinityList].sort((a, b) => {
    const getRank = (item: any) => {
      // 0순위: 사용자 설정 관심분야 매칭 (가장 최상단)
      const isInterest = interestSectors.some(sec => item.summary?.includes(`[${sec}]`));
      
      if (item.deadline_date) {
        const dDate = new Date(item.deadline_date);
        if (!isNaN(dDate.getTime())) {
          dDate.setHours(0,0,0,0);
          const diffDays = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          // 마감 임박 공고 (관심분야면 group 0, 아니면 group 1)
          if (diffDays >= 0) return { group: isInterest ? 0 : 1, val: diffDays };
          // 마감 완료 공고 (가장 마지막)
          if (diffDays < 0) return { group: 3, val: new Date(item.created_at).getTime() * -1 };
        }
      }
      // 일반 뉴스 및 상시 공고 (관심분야면 group 0, 아니면 group 2)
      return { group: isInterest ? 0 : 2, val: new Date(item.created_at).getTime() * -1 };
    };
    const rankA = getRank(a);
    const rankB = getRank(b);
    if (rankA.group !== rankB.group) return rankA.group - rankB.group;
    return rankA.val - rankB.val;
  });
  
  const searchedList = searchQuery.trim() 
    ? allInfinityList.filter(item => item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) 
    : allInfinityList;

  let finalFilteredList = searchedList;

  if (filters.timeline !== '전체') {
    finalFilteredList = finalFilteredList.filter(item => {
      if (filters.timeline === '오늘 등록') {
        const itemDate = new Date(item.created_at);
        const today = new Date();
        return itemDate.getFullYear() === today.getFullYear() && 
               itemDate.getMonth() === today.getMonth() && 
               itemDate.getDate() === today.getDate();
      }
      if (filters.timeline === '마감 임박(D-3)') {
        if (!item.deadline_date) return false;
        const dDate = new Date(item.deadline_date);
        if (isNaN(dDate.getTime())) return false;
        dDate.setHours(0,0,0,0);
        const todayD = new Date();
        todayD.setHours(0,0,0,0);
        const diffDays = Math.ceil((dDate.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      }
      if (filters.timeline === '상시 모집') {
        const isGov = item.category === '정부지원공고' || item.category === 'Strategy' || item.category?.toLowerCase() === 'strategy';
        return (!item.deadline_date || isNaN(new Date(item.deadline_date).getTime())) && isGov;
      }
      return true;
    });
  }

  if (filters.stages.length > 0) {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      return filters.stages.some(stage => 
        FILTER_KEYWORDS.stages[stage]?.some(kw => text.includes(kw.toLowerCase()))
      );
    });
  }

  if (filters.benefits.length > 0) {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      return filters.benefits.some(benefit => 
        FILTER_KEYWORDS.benefits[benefit]?.some(kw => text.includes(kw.toLowerCase()))
      );
    });
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(finalFilteredList.length / POSTS_PER_PAGE);
  const infinityList = finalFilteredList.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <LinkNext href="/" onClick={() => setActiveCategory('전체')} className="group flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">기틀</span>
              <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:animate-ping" />
            </LinkNext>
            <nav className="hidden lg:flex items-center gap-8">
              {['전체', 'strategy', 'news'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`text-[15px] tracking-wider transition-all px-2 py-1 ${
                    activeCategory === cat 
                    ? 'text-blue-600 font-extrabold border-b-[3px] border-blue-600' 
                    : 'text-slate-500 font-bold hover:text-slate-900 hover:translate-y-[-1px]'
                  }`}
                >
                  {cat === 'strategy' ? '인사이트' : cat === 'news' ? '뉴스' : cat}
                </button>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Premium Intelligence Portal</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 섹션 1: 메인 히어로 (MSN 스타일 7:3 분할) */}
        <section className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-12 animate-fade-in">
          {/* 좌측: Hero (7) */}
          <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/5 border border-gray-100 group transition-all duration-500 hover:shadow-blue-900/10">
            <LinkNext href={`/article/${heroMain.id}`}>
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src={heroMain.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'} 
                  alt="Hero" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
                />
              </div>
              <div className="p-10 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                   <DDayBadge deadline={heroMain.deadline_date} category={heroMain.category} className="!text-sm !px-4 !py-1.5" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{heroMain.category}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-6 tracking-wide truncate">
                  {parseTitle(heroMain.title).title}
                </h2>
                <p className="text-base text-slate-600 line-clamp-2 leading-loose tracking-wide font-medium">
                  {heroMain.summary}
                </p>
                <div className="mt-8 text-xs font-bold text-slate-400 tracking-widest">{parseTitle(heroMain.title).institution} · 기틀 AI 미디어</div>
              </div>
            </LinkNext>
          </div>

          <div className="lg:col-span-12 xl:col-span-3 flex flex-col min-w-0 animate-slide-in-right delay-100">
            <h3 className="font-black text-xl mb-8 text-slate-900 tracking-wider border-b-4 border-slate-900 pb-3 flex justify-between items-end group">
              <span>지금 뜨는 기사</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-black animate-pulse uppercase tracking-widest">Hot</span>
            </h3>
            <div className="flex flex-col divide-y-2 divide-slate-900/10 border-b-2 border-slate-900/10 min-w-0">
              {latestList.map((item) => {
                const { title, institution } = parseTitle(item.title);
                return (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="block py-6 group hover:bg-white transition-all px-2 -mx-2 hover:shadow-[20px_0_40px_-10px_rgba(0,0,0,0.05)] border-l-0 hover:border-l-4 hover:border-slate-900 pl-2 hover:pl-6 min-w-0">
                    <div className="flex flex-col gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                         <DDayBadge deadline={item.deadline_date} category={item.category} className="!scale-100 !rounded-none !py-0.5" />
                         <span className={`text-[10px] font-black tracking-widest transition-colors ${['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(item.category || '') ? 'text-purple-400 group-hover:text-purple-600' : item.category === '창업 뉴스' ? 'text-red-500 group-hover:text-red-700' : item.category === '기업/마켓 뉴스' ? 'text-teal-400 group-hover:text-teal-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                           {['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(item.category || '') ? 'TECH' : item.category === '창업 뉴스' ? '창업' : item.category === '기업/마켓 뉴스' ? '마켓' : item.category}
                         </span>
                      </div>
                      <h4 className="text-[18px] font-black text-slate-800 truncate tracking-wide group-hover:text-slate-900 transition-colors">
                        {title}
                        {item.summary?.match(/^\[(농업|기술\/IT|소상공인)\]/) && (
                          <SectorBadge sector={item.summary.match(/^\[(.*?)\]/)[1]} />
                        )}
                      </h4>
                      <p className="text-[14px] text-slate-500 font-bold tracking-wider">{institution}</p>
                    </div>
                  </LinkNext>
                );
              })}
            </div>
          </div>
        </section>

        {/* 섹션 2: 매거진형 격자 (딱 한 줄만!) */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-wide">지원 전략 및 트렌드</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(magazineList.length > 0 ? magazineList : techPosts.slice(0, 4)).map((item) => {
              const isGov = item.category === '정부지원공고' || item.category?.toLowerCase() === 'strategy' || item.title.includes('[전략]');
              const govLogo = 'https://www.mss.go.kr/images/common/logo.png'; // Stable MSS Logo
              const techImg = 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?auto=format&fit=crop&q=80&w=600';
              const defaultImg = isGov ? govLogo : techImg;
              return (
                <LinkNext key={item.id} href={`/article/${item.id}`} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col min-w-0">
                  <div className="aspect-[3/2] bg-slate-50 rounded-2xl mb-5 overflow-hidden">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => { 
                        e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <h4 className="text-[18px] font-black text-slate-900 truncate tracking-wide mb-3 group-hover:text-blue-600 w-full inline-block">
                    {parseTitle(item.title).title}
                    {item.summary?.match(/^\[(농업|기술\/IT|소상공인)\]/) && (
                      <SectorBadge sector={item.summary.match(/^\[(.*?)\]/)[1]} />
                    )}
                  </h4>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <span className="text-[12px] font-black text-slate-400">#인사이트</span>
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-slate-900 pb-3">
              <h3 className="font-black text-xl text-slate-900 tracking-wider mb-2 md:mb-0">실시간 지원사업 공고</h3>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="기사 제목 검색..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-full px-4 py-2.5 text-xs md:text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all border ${showFilters || filters.timeline !== '전체' || filters.stages.length > 0 || filters.benefits.length > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  <span>필터 옵션</span>
                </button>
              </div>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
              <div className="w-full bg-white border border-slate-200 rounded-3xl p-10 mb-10 shadow-xl text-left animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {/* 분야 (Sector) */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>분야별 필터 (Sector)</h4>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SECTORS.map(sec => (
                        <button
                          key={sec}
                          onClick={() => {
                            const next = { ...filters, sector: sec };
                            setFilters(next);
                            updateURLFilters(next);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${filters.sector === sec ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 시기 */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>시기 (Timeline)</h4>
                    <div className="flex flex-wrap gap-2">
                      {ALL_TIMELINES.map(t => (
                        <button
                          key={t}
                          onClick={() => handleTimelineChange(t)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${filters.timeline === t ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 대상 */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>대상 (Stage)</h4>
                    <div className="flex flex-wrap gap-2">
                      {ALL_STAGES.map(s => {
                        const isSelected = filters.stages.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => handleFilterToggle('stages', s)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* 유형 */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>유형 (Benefit)</h4>
                    <div className="flex flex-wrap gap-2">
                      {ALL_BENEFITS.map(b => {
                        const isSelected = filters.benefits.includes(b);
                        return (
                          <button
                            key={b}
                            onClick={() => handleFilterToggle('benefits', b)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${isSelected ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-200' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-100">
                   <div className="flex items-center gap-3 mb-6">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Personalized Interest Center</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex-1">
                      <h5 className="text-[17px] font-black text-slate-900 tracking-tight mb-2">당신의 관심 분야를 알려주세요. ★</h5>
                      <p className="text-[12px] text-slate-500 font-bold tracking-tight italic">설정하신 분야의 공고와 뉴스가 최상단에 우선 배치됩니다.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {ALL_SECTORS.filter(s => s !== '전체').map(sec => (
                        <button
                          key={sec}
                          onClick={() => toggleInterestSector(sec)}
                          className={`px-6 py-3 rounded-2xl text-[13px] font-black transition-all border flex items-center gap-2 ${
                            interestSectors.includes(sec)
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100 scale-105'
                              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {sec}
                          {interestSectors.includes(sec) && <span className="text-yellow-300">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 필터 칩 영역 */}
            {(filters.timeline !== '전체' || filters.stages.length > 0 || filters.benefits.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6 items-center justify-start">
                <span className="text-[11px] font-black text-slate-500 mr-2 tracking-wide">적용된 필터:</span>
                {filters.timeline !== '전체' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold">
                    {filters.timeline}
                    <button onClick={() => removeFilter('timeline')} className="hover:text-blue-900 rounded-full focus:outline-none"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                {filters.stages.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[11px] font-bold">
                    {s}
                    <button onClick={() => removeFilter('stages', s)} className="hover:text-purple-900 rounded-full focus:outline-none"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                ))}
                {filters.benefits.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[11px] font-bold">
                    {b}
                    <button onClick={() => removeFilter('benefits', b)} className="hover:text-teal-900 rounded-full focus:outline-none"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                ))}
                
                {filters.sector !== '전체' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-[11px] font-bold">
                    {filters.sector}
                    <button onClick={() => { const next = { ...filters, sector: '전체' }; setFilters(next); updateURLFilters(next); }} className="hover:text-slate-300 rounded-full focus:outline-none"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                
                <button 
                  onClick={() => { setFilters({ timeline: '전체', stages: [], benefits: [], sector: '전체' }); updateURLFilters({ timeline: '전체', stages: [], benefits: [], sector: '전체' }); setCurrentPage(1); }} 
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-800 underline underline-offset-2 ml-2"
                >
                  초기화
                </button>
              </div>
            )}

          <div className="h-0.5 bg-slate-100 w-full mb-12" />
        </div>
        
        {finalFilteredList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <span className="text-5xl block mb-4 opacity-20">🍃</span>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {infinityList.map((item, idx) => {
              const { title, institution } = parseTitle(item.title);
              return (
                <LinkNext 
                  key={item.id} 
                  href={`/article/${item.id}`} 
                  className="p-8 hover:bg-slate-50 flex items-center justify-between group transition-colors min-w-0 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-8 min-w-0 flex-1">
                    <div className="hidden sm:block shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&auto=format&fit=crop'} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover"
                        onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200&auto=format&fit=crop'; }}
                      />
                    </div>
                    <DDayBadge deadline={item.deadline_date} category={item.category} className="shrink-0 w-16 text-center py-1.5 !text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h4 className="text-[18px] font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate tracking-wide">
                        {title}
                        {item.summary?.match(/^\[(농업|기술\/IT|소상공인)\]/) && (
                          <SectorBadge sector={item.summary.match(/^\[(.*?)\]/)[1]} />
                        )}
                      </h4>
                      <p className="text-[13px] text-slate-500 mt-2 font-medium flex items-center gap-3">
                          <span className={`font-bold ${['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(item.category || '') ? 'text-purple-600' : item.category === '창업 뉴스' ? 'text-red-600' : item.category === '기업/마켓 뉴스' ? 'text-teal-600' : 'text-blue-600'}`}>
                            {['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(item.category || '') ? 'TECH' : item.category === '창업 뉴스' ? '창업' : item.category === '기업/마켓 뉴스' ? '마켓' : item.category}
                          </span>
                         <span className="opacity-20 text-slate-900">|</span>
                         <span>주관: {institution}</span>
                         <span className="opacity-20 text-slate-900">|</span>
                         <span>{item.deadline_date ? `마감: ${new Date(item.deadline_date).toLocaleDateString('ko-KR')}` : (item.category === '정부지원공고' || item.category?.toLowerCase() === 'strategy' ? '마감: 상시 접수' : '마감: NEWS')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xl shadow-blue-600/20">→</span>
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

      <footer className="bg-white py-16 mt-16 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">기틀</span>
            <div className="w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <p className="text-slate-500 text-xs font-bold tracking-widest max-w-md mx-auto leading-relaxed">
            기틀 AI 미디어는 정부지원사업과 테크 트렌드를 분석하여 창업가에게 최적의 인사이트를 제공합니다.
          </p>
          <div className="flex gap-6">
            <span className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">Intelligence</span>
            <span className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">Strategy</span>
            <span className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">Growth</span>
          </div>
          <div className="h-px w-16 bg-slate-100" />
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">© 2026 Giteul AI Media Portal.</p>
        </div>
      </footer>

      {/* Floating Scroll to Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-10 right-10 w-14 h-14 bg-white shadow-2xl rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all group z-40"
      >
        <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
      </button>
    </div>
  );
}
