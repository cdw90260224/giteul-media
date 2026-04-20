'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LinkNext from 'next/link';
import { supabase } from '@/lib/supabase';

// 카테고리별 컬러 시스템
const CAT_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; accent: string }> = {
  '정부지원공고': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'STRATEGY', accent: 'bg-blue-600' },
  'AI/테크 트렌드': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'AI/TECH', accent: 'bg-purple-600' },
  'AI/Tech': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'AI/TECH', accent: 'bg-purple-600' },
  'ai/tech': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'AI/TECH', accent: 'bg-purple-600' },
  '기업/마켓 뉴스': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'MARKET', accent: 'bg-teal-600' },
  '창업 뉴스': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'STARTUP', accent: 'bg-red-600' },
  '글로벌 뉴스': { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', label: 'GLOBAL', accent: 'bg-amber-600' },
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
const ALL_REGIONS = ['전체', '전국', '서울', '경기', '인천', '부울경', '해외'];
const ALL_TARGETS = ['전체', '개인', '법인', '관계없이'];
const ALL_SCALES = ['전체', '~1천만원', '~5천만원', '1억원 이상', '미정/문의'];
const ALL_OPERATORS = ['전체', '정부/지자체', '민간/기타'];
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
    if (isGov) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-blue-600 text-white tracking-widest ${className}`}>STRATEGY</span>;
    if (isTech) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-purple-600 text-white tracking-widest ${className}`}>TECH</span>;
    if (isMarket) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-teal-600 text-white tracking-widest ${className}`}>MARKET</span>;
    if (category === '창업 뉴스') return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-red-600 text-white tracking-widest ${className}`}>STARTUP</span>;
    return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-slate-400 text-white tracking-widest ${className}`}>NEWS</span>;
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
  else if (days < 0) { label = 'EXPIRED'; color = 'bg-slate-300 text-slate-500'; }
  else if (days <= 3) { label = `D-${days}`; color = 'bg-red-600 text-white'; }
  else if (days > 3) { label = `D-${days}`; color = 'bg-slate-100 text-slate-800 border border-slate-200'; }

  return (
    <span className={`inline-block px-2 py-1 rounded-sm text-[10px] font-black tracking-tighter ${color} ${className}`}>
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
  const [filters, setFilters] = useState<{ 
    timeline: string; 
    stages: string[]; 
    benefits: string[]; 
    sector: string; 
    region: string;
    target: string;
    scale: string;
    operator: string;
  }>({ 
    timeline: '전체', 
    stages: [], 
    benefits: [], 
    sector: '전체', 
    region: '전체',
    target: '전체',
    scale: '전체',
    operator: '전체'
  });
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'closing' | 'new' | 'interest'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
        sector: sec || '전체',
        region: params.get('region') || '전체',
        target: params.get('target') || '전체',
        scale: params.get('scale') || '전체',
        operator: params.get('operator') || '전체'
      });
      // 관심분야 로컬스토리지 복구
      const saved = localStorage.getItem(INTEREST_SECTORS_KEY);
      if (saved) {
        setInterestSectors(JSON.parse(saved));
      } else {
        // 기본 관심 분야 설정 (데이터가 없을 경우를 대비)
        const defaultInterests = ['농업', '기술/IT', '소상공인'];
        setInterestSectors(defaultInterests);
        localStorage.setItem(INTEREST_SECTORS_KEY, JSON.stringify(defaultInterests));
      }
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
      if (newFilters.region === '전체') params.delete('region');
      else params.set('region', newFilters.region);
      if (newFilters.target === '전체') params.delete('target');
      else params.set('target', newFilters.target);
      if (newFilters.scale === '전체') params.delete('scale');
      else params.set('scale', newFilters.scale);
      if (newFilters.operator === '전체') params.delete('operator');
      else params.set('operator', newFilters.operator);
      
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
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  
  let allInfinityList = [...baseInfinityList].sort((a, b) => {
    const getRank = (item: any) => {
      // 0순위: 사용자 설정 관심분야 매칭 (가장 최상단)
      const isInterest = interestSectors.some(sec => item.summary?.includes(`[${sec}]`));
      
      if (item.deadline_date) {
        const dDate = new Date(item.deadline_date);
        if (!isNaN(dDate.getTime())) {
          dDate.setHours(0,0,0,0);
          const diffDays = Math.ceil((dDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
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

  // 통계 계산
  const stats = {
    total: allInfinityList.length,
    closing: allInfinityList.filter(i => {
      if (!i.deadline_date) return false;
      const d = new Date(i.deadline_date);
      d.setHours(0,0,0,0);
      const diff = Math.ceil((d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    }).length,
    newToday: allInfinityList.filter(i => {
      const d = new Date(i.created_at);
      return d.toDateString() === new Date().toDateString();
    }).length,
    interest: allInfinityList.filter(i => interestSectors.some(sec => i.summary?.includes(`[${sec}]`))).length
  };
  
  if (filters.sector !== '전체') {
    allInfinityList = allInfinityList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      return text.includes(filters.sector.toLowerCase());
    });
  }

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

  if (filters.region !== '전체') {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      return text.includes(filters.region.toLowerCase());
    });
  }

  if (filters.target !== '전체') {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      if (filters.target === '개인') return text.includes('개인') || text.includes('소상공인') || text.includes('예비');
      if (filters.target === '법인') return text.includes('법인') || text.includes('중소기업') || text.includes('벤처');
      return true;
    });
  }

  if (filters.scale !== '전체') {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      if (filters.scale === '~1천만원') return text.includes('1천') || text.includes('1000') || text.includes('백만원');
      if (filters.scale === '~5천만원') return text.includes('5천') || text.includes('5000') || text.includes('천만원');
      if (filters.scale === '1억원 이상') return text.includes('억') || text.includes('1억') || text.includes('자산');
      return true;
    });
  }

  if (filters.operator !== '전체') {
    finalFilteredList = finalFilteredList.filter(item => {
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
      if (filters.operator === '정부/지자체') return text.includes('정부') || text.includes('시청') || text.includes('도청') || text.includes('진흥원') || text.includes('기보') || text.includes('신보');
      if (filters.operator === '민간/기타') return text.includes('민간') || text.includes('재단') || text.includes('협회') || text.includes('은행') || text.includes('센터');
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

  // 탭 필터링 적용 (중복 제로: 상호 배타적 버킷 방식)
  if (activeTab === 'new') {
    // 1. NEW TODAY: 오직 오늘 등록된 최신 데이터만
    finalFilteredList = searchedList
      .filter(i => {
        const d = new Date(i.created_at);
        return d.toDateString() === new Date().toDateString();
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (activeTab === 'closing') {
    // 2. CLOSING SOON: 오늘 등록된 기사는 제외하고, 마감이 3일 이내인 기사만
    finalFilteredList = searchedList
      .filter(i => {
        const isNewToday = new Date(i.created_at).toDateString() === new Date().toDateString();
        if (isNewToday || !i.deadline_date) return false;
        
        const d = new Date(i.deadline_date);
        d.setHours(0,0,0,0);
        const diff = Math.ceil((d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 3;
      })
      .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime());
  } else if (activeTab === 'interest') {
    // 3. PERSONALIZED: 관심 분야 (중복 허용 가능하지만 일단 관심사 위주로만)
    finalFilteredList = searchedList
      .filter(i => interestSectors.some(sec => (i.title + i.summary).includes(sec)))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    // 4. ALL UPDATES: 전체 데이터베이스 (최신 등록순 - 중점적인 필터링 공간)
    finalFilteredList = searchedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

        {/* 섹션 3: 프리미엄 인텔리전스 대시보드 */}
        <section id="feed-start" className="pt-24 border-t-4 border-slate-900">
          <div className="flex flex-col gap-2 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
              <span className="text-[12px] font-black text-red-600 uppercase tracking-[0.5em]">Live intelligence Pulse</span>
            </div>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2">실시간 비즈니스 데이터 센터</h3>
            <p className="text-slate-500 font-bold text-base max-w-2xl">기틀 AI가 수집한 미가공 데이터를 정제하여 핵심 인사이트를 도출합니다. 사업 성장을 위한 데이터 기반 의사결정을 시작하세요.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Mosaic Intelligence Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-2 bg-slate-900 w-fit p-1 rounded-xl shadow-2xl">
                {[
                  { id: 'all', label: 'ALL UPDATES' },
                  { id: 'new', label: 'NEW TODAY' },
                  { id: 'closing', label: 'CLOSING SOON' },
                  { id: 'interest', label: 'FOR YOU' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all tracking-widest ${activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-900 transition-all shadow-lg whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                  {isSidebarOpen ? '필터 닫기' : '필터 열기'}
                </button>
              </div>

              {finalFilteredList.length === 0 ? (
                <div className="py-48 text-center bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm">
                   <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">Waiting for incoming data stream...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border-2 border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-900/10">
                  {infinityList.map((item, idx) => {
                    const { title, institution } = parseTitle(item.title);
                    const isNew = new Date(item.created_at).toDateString() === new Date().toDateString();
                    const isInterest = interestSectors.some(sec => item.summary?.includes(`[${sec}]`));
                    const isSpotlight = idx === 0 && currentPage === 1;

                    return (
                      <LinkNext 
                        key={item.id} 
                        href={`/article/${item.id}`}
                        className={`group bg-white p-12 transition-all hover:bg-slate-50 relative flex flex-col min-h-[360px] ${isSpotlight ? 'md:col-span-2' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-8">
                           <DDayBadge deadline={item.deadline_date} category={item.category} className="scale-110" />
                           <div className="flex gap-2">
                             {isInterest && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 border border-amber-100 uppercase tracking-tighter">Recommended</span>}
                             {isNew && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 border border-blue-100 uppercase tracking-widest">New Entry</span>}
                           </div>
                        </div>
                        
                        <div className="flex flex-col gap-6 flex-1">
                          <div className="flex items-center gap-3">
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.category}</span>
                             <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{institution}</span>
                          </div>
                          
                          <h4 className={`${isSpotlight ? 'text-4xl' : 'text-2xl'} font-black text-slate-900 tracking-tighter leading-[1.15] group-hover:text-blue-700 transition-colors`}>
                            {title}
                          </h4>
                          
                          <p className="text-[14px] text-slate-500 font-bold line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                            {item.summary?.replace(/^\[.*?\]\s*/, '')}
                          </p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                           <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Proprietary Analysis Complete</span>
                           <span className="text-slate-900 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all font-black text-sm">ANALYSIS REPORT →</span>
                        </div>
                      </LinkNext>
                    );
                  })}
                </div>
              )}

              {/* Advanced Pagination UI */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                  <button 
                    onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 80 : 0, behavior: 'smooth' }); }}
                    disabled={currentPage === 1}
                    className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-0"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 80 : 0, behavior: 'smooth' }); }}
                        className={`w-12 h-12 rounded-full text-xs font-black transition-all ${currentPage === pageNum ? 'bg-slate-900 text-white shadow-2xl scale-110' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: document.getElementById('feed-start')?.offsetTop ? document.getElementById('feed-start')!.offsetTop - 80 : 0, behavior: 'smooth' }); }}
                    disabled={currentPage === totalPages}
                    className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-0"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Sliding Drawer Sidebar */}
            <aside className={`lg:w-80 shrink-0 relative transition-all duration-500 ease-in-out overflow-hidden ${isSidebarOpen ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 w-0'}`}>
               <div className="bg-white border-2 border-slate-900 rounded-[2.5rem] sticky top-28 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[80vh] w-80">
                  <div className="p-7 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between shrink-0">
                     <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">데이터 필터 센터</h5>
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  
                  {/* Scrollable Content Area */}
                  <div className="p-7 overflow-y-auto custom-scrollbar flex-1 space-y-10 group/scroll">
                     {/* 1. Timeline */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 타임라인
                        </p>
                        <div className="flex flex-col gap-2.5">
                           {ALL_TIMELINES.map(t => (
                              <button 
                                key={t} 
                                onClick={() => handleTimelineChange(t)}
                                className={`text-left text-[13px] font-bold transition-all hover:translate-x-1 ${filters.timeline === t ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                {t} {filters.timeline === t && '◦'}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 2. Target (개인/법인) */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 지원대상
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                           {ALL_TARGETS.map(tar => (
                              <button 
                                key={tar} 
                                onClick={() => { const next = { ...filters, target: tar }; setFilters(next); updateURLFilters(next); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition-all ${filters.target === tar ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
                              >
                                {tar}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 3. Scale (지원규모) */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 지원규모
                        </p>
                        <div className="flex flex-col gap-2.5">
                           {ALL_SCALES.map(s => (
                              <button 
                                key={s} 
                                onClick={() => { const next = { ...filters, scale: s }; setFilters(next); updateURLFilters(next); setCurrentPage(1); }}
                                className={`text-left text-[13px] font-bold transition-all hover:translate-x-1 ${filters.scale === s ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                {s} {filters.scale === s && '◦'}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 4. Operator (운영주체) */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 운영주체
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                           {ALL_OPERATORS.map(op => (
                              <button 
                                key={op} 
                                onClick={() => { const next = { ...filters, operator: op }; setFilters(next); updateURLFilters(next); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition-all ${filters.operator === op ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
                              >
                                {op}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 5. Scale / Stage */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 기업성장단계
                        </p>
                        <div className="flex flex-col gap-2.5">
                           {ALL_STAGES.map(s => (
                              <button 
                                key={s} 
                                onClick={() => handleFilterToggle('stages', s)}
                                className={`flex items-center gap-2 text-left text-[13px] font-bold transition-all hover:translate-x-1 ${filters.stages.includes(s) ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                <div className={`w-2.5 h-2.5 rounded-sm border ${filters.stages.includes(s) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                                {s}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 6. Benefit Types */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 지원혜택유형
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                           {ALL_BENEFITS.map(b => (
                              <button 
                                key={b} 
                                onClick={() => handleFilterToggle('benefits', b)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition-all ${filters.benefits.includes(b) ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
                              >
                                {b}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 7. Sector focus */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 산업분야
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                           {ALL_SECTORS.map(sec => (
                              <button 
                                key={sec} 
                                onClick={() => { const next = { ...filters, sector: sec }; setFilters(next); updateURLFilters(next); setCurrentPage(1); }}
                                className={`text-left text-[13px] font-bold transition-all hover:translate-x-1 ${filters.sector === sec ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                {sec}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 8. Region */}
                     <div className="group">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 지역구분
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                           {ALL_REGIONS.map(reg => (
                              <button 
                                key={reg} 
                                onClick={() => { const next = { ...filters, region: reg }; setFilters(next); updateURLFilters(next); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition-all ${filters.region === reg ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
                              >
                                {reg}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* 9. Scan Intelligence */}
                     <div className="pt-8 border-t border-slate-100">
                        <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                           <span className="w-3 h-[1px] bg-slate-200" /> 키워드 검색
                        </p>
                        <div className="relative">
                           <input
                             type="text"
                             placeholder="키워드 입력..."
                             value={searchQuery}
                             onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold placeholder:text-slate-300 focus:border-slate-900 transition-all focus:outline-none"
                           />
                        </div>
                     </div>
                  </div>
                  
                  {/* Static Footer Button */}
                  <div className="p-7 bg-white border-t-2 border-slate-900 shrink-0">
                     <button 
                        onClick={() => { 
                          const reset = { timeline: '전체', stages: [], benefits: [], sector: '전체', region: '전체', target: '전체', scale: '전체', operator: '전체' };
                          setFilters(reset); setSearchQuery(''); updateURLFilters(reset); 
                        }}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                      >
                        필터 초기화
                      </button>
                  </div>
               </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="bg-white py-24 mt-24 border-t-2 border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
          <LinkNext href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">기틀</span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
          </LinkNext>
          <p className="text-slate-500 text-sm font-bold tracking-tight max-w-xl mx-auto leading-relaxed">
            기틀 AI 미디어는 데이터 기반의 의사결정을 돕는 비즈니스 인텔리전스 플랫폼입니다. <br/>
            초기 창업부터 글로벌 진출까지, 당신의 성장을 위한 전략적 파트너가 되겠습니다.
          </p>
          <div className="flex gap-8">
            {['Intelligence', 'Strategy', 'Growth', 'Data'].map(word => (
              <span key={word} className="text-slate-300 text-[11px] font-black tracking-[0.3em] uppercase">{word}</span>
            ))}
          </div>
          <div className="h-px w-24 bg-slate-200" />
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">© 2026 Giteul AI Media Portal. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
