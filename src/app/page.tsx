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
const ALL_TIMELINES = ['전체', '마감 임박(D-3)', '30일 이내(D-30)', '상시 모집'];
const ALL_STAGES = ['예비창업', '초기(3년 미만)', '도약(7년 미만)', '성장(7년 이상)'];
const ALL_BENEFITS = ['자금지원', 'R&D', '공간지원', '교육·멘토링', '수출·마케팅'];
const ALL_SECTORS = ['전체', '기술/IT', '제조/하드웨어', '바이오/헬스케어', '에너지/ESG', '문화/콘텐츠', '커머스/서비스', '글로벌/수출', '농업', '소상공인'];
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
    '소상공인': 'bg-orange-50 text-orange-700 border-orange-200',
    '제조/하드웨어': 'bg-slate-100 text-slate-700 border-slate-300',
    '바이오/헬스케어': 'bg-rose-50 text-rose-700 border-rose-200',
    '에너지/ESG': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '문화/콘텐츠': 'bg-purple-50 text-purple-700 border-purple-200',
    '커머스/서비스': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    '글로벌/수출': 'bg-amber-50 text-amber-700 border-amber-200'
  };
  const colorClass = colors[sector] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${colorClass} tracking-tight ml-2`}>
      {sector}
    </span>
  );
}

function DDayBadge({ deadline, category, title, className = "" }: { deadline?: string, category?: string, title?: string, className?: string }) {
  const isStrategy = title?.startsWith('[전략]') || category?.toLowerCase() === 'strategy';
  const isTech = ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(category || '');
  const isMarket = category === '기업/마켓 뉴스';

  // [CRITICAL] D-Day Priority: title 또는 summary에서 날짜 추출 시도 (deadline이 없는 경우 대비)
  let effectiveDeadline = deadline;
  if (!effectiveDeadline && (category === '정부지원공고' || category === 'strategy')) {
    const textToSearch = `${title || ''} ${className.includes('summary') ? '' : (document.getElementById('article-summary')?.innerText || '')}`; 
    // Note: In client-side rendering, we might not have easy access to summary here if not passed.
    // Let's rely on what's passed.
    const dateMatch = (title || '').match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/) || 
                     (title || '').match(/(\d{1,2})[.\/-](\d{1,2})/);
    
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        effectiveDeadline = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
      } else {
        effectiveDeadline = `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
      }
    }
  }

  const renderNoDeadline = () => {
    if (isStrategy) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-blue-600 text-white tracking-widest ${className}`}>STRATEGY</span>;
    if (isTech) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-purple-600 text-white tracking-widest ${className}`}>TECH</span>;
    if (isMarket) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-teal-600 text-white tracking-widest ${className}`}>MARKET</span>;
    if (category === '창업 뉴스') return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-red-600 text-white tracking-widest ${className}`}>STARTUP</span>;
    if (category === '정부지원공고') return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-blue-600 text-white tracking-widest ${className}`}>상시확인</span>;
    return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-slate-400 text-white tracking-widest ${className}`}>NEWS</span>;
  };

  if (!effectiveDeadline) return renderNoDeadline();
  
  const today = new Date(); 
  today.setHours(0,0,0,0);
  const dDate = new Date(effectiveDeadline);
  if (isNaN(dDate.getTime())) return renderNoDeadline();
  dDate.setHours(0,0,0,0);

  const diff = dDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (isStrategy) return <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-black bg-blue-600 text-white tracking-widest ${className}`}>STRATEGY</span>;

  let label = `D-${days}`;
  let color = 'bg-slate-900 text-white';

  if (days === 0) { label = 'D-DAY'; color = 'bg-red-600 text-white'; }
  else if (days < 0) { label = 'EXPIRED'; color = 'bg-slate-300 text-slate-500'; }
  else if (days <= 3) { label = `D-${days}`; color = 'bg-red-600 text-white shadow-lg shadow-red-500/20'; }
  else if (days > 3) { label = `D-${days}`; color = 'bg-blue-50 text-blue-700 border-2 border-blue-100 font-black'; }

  return (
    <span className={`inline-block px-2 py-1 rounded-sm text-[10px] font-black tracking-tighter ${color} ${className}`}>
      {label}
    </span>
  );
}

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [visibleItems, setVisibleItems] = useState(10);
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
    articleType: string;
  }>({ 
    timeline: '전체', 
    stages: [], 
    benefits: [], 
    sector: '전체', 
    region: '전체',
    target: '전체',
    scale: '전체',
    operator: '전체',
    articleType: '전체'
  });
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['strategy', 'newsletter', 'bookmarks']);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'closing' | 'new' | 'interest' | 'favorites'>('all');
  const [isEmailGateOpen, setIsEmailGateOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const ALL_SUBSCRIPTION_SECTORS = ['농업', '기술/IT', '소상공인', '문화/관광', '바이오/헬스', '제조/뿌리', '청년/스타트업', '에너지/환경', '수출/해외'];
  const BENEFIT_LIST = [
    { id: 'strategy', label: "AI 기반 '합격 전략 리포트' 전체 공개" },
    { id: 'newsletter', label: "관심분야 맞춤 뉴스레터 발송 (3일 주기)" },
    { id: 'bookmarks', label: "공고 찜하기 및 관리 기능 활성화" }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('giteul_user_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
        setIsSubscribed(true);
      }

      const params = new URLSearchParams(window.location.search);
      setFilters({
        timeline: params.get('timeline') || '전체',
        stages: params.get('stages') ? params.get('stages')!.split(',') : [],
        benefits: params.get('benefits') ? params.get('benefits')!.split(',') : [],
        sector: params.get('sector') || '전체',
        region: params.get('region') || '전체',
        target: params.get('target') || '전체',
        scale: params.get('scale') || '전체',
        operator: params.get('operator') || '전체',
        articleType: params.get('articleType') || '전체'
      });
      const saved = localStorage.getItem(INTEREST_SECTORS_KEY);
      if (saved) setInterestSectors(JSON.parse(saved));
      else {
        const defaultInterests = ['농업', '기술/IT', '소상공인'];
        setInterestSectors(defaultInterests);
        localStorage.setItem(INTEREST_SECTORS_KEY, JSON.stringify(defaultInterests));
      }
    }
  }, []);

  const updateURLFilters = (newFilters: any) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, val]) => {
        if (Array.isArray(val)) { if (val.length > 0) params.set(key, val.join(',')); }
        else if (val !== '전체') params.set(key, val as string);
      });
      window.history.pushState(null, '', `?${params.toString()}`);
    }
  };

  const handleGateAction = (action: () => void) => {
    if (!userEmail) {
      setPendingAction(() => action);
      setIsEmailGateOpen(true);
    } else {
      action();
    }
  };

  const toggleBookmark = (id: number) => {
    handleGateAction(() => {
      setBookmarks(prev => {
        const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
        localStorage.setItem('antigravity_bookmarks', JSON.stringify(next));
        return next;
      });
    });
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail.includes('@')) {
      try {
        // [DB] 구독자 테이블에 이메일과 관심분야 저장
        const { error } = await supabase
          .from('subscribers')
          .upsert({ 
            email: userEmail, 
            interests: interestSectors,
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });

        if (error) throw error;

        localStorage.setItem('giteul_user_email', userEmail);
        setIsSubscribed(true);
        setIsEmailGateOpen(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        alert('뉴스레터 구독이 완료되었습니다! 🚀');
      } catch (err: any) {
        console.error('[Subscription] Failed:', err.message);
        alert('구독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleArticleTypeChange = (type: string) => {
    const next = { ...filters, articleType: type };
    setFilters(next);
    updateURLFilters(next);
    setVisibleItems(10);
    // [UX] Viewport 고정: 탭 전환 시 상단으로 부드럽게 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // [Data] Tab-specific Quick Insights
  const closingSoonTop3 = newsItems
    .filter(i => i.category === '정부지원공고' && i.deadline_date)
    .filter(i => {
       const d = new Date(i.deadline_date); d.setHours(0,0,0,0);
       return d.getTime() >= todayDate.getTime();
    })
    .sort((a,b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime())
    .slice(0, 3);

  const techHeadlines = newsItems
    .filter(i => ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(i.category))
    .slice(0, 3);

  useEffect(() => {
    const saved = localStorage.getItem('antigravity_bookmarks');
    if (saved) { try { setBookmarks(JSON.parse(saved)); } catch (e) {} }
    async function fetchPosts() {
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (!error && data) setNewsItems(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchPosts();
  }, []);

  let finalFilteredList = newsItems.filter(item => {
    if (filters.articleType !== '전체') {
      if (filters.articleType === '지원공고') {
        if (!(item.category === '정부지원공고' || item.category?.toLowerCase() === 'strategy')) return false;
      } else if (filters.articleType === '일반 뉴스') {
        if (!['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech', '기업/마켓 뉴스', '창업 뉴스'].includes(item.category)) return false;
      }
    }
    if (filters.timeline !== '전체' && item.deadline_date) {
      const dDate = new Date(item.deadline_date); dDate.setHours(0,0,0,0);
      const diff = Math.ceil((dDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filters.timeline === '마감 임박(D-3)') { if (diff < 0 || diff > 3) return false; }
      else if (filters.timeline === '30일 이내(D-30)') { if (diff < 0 || diff > 30) return false; }
    }
    const fullText = (item.title + ' ' + (item.summary || '')).toLowerCase();
    if (filters.sector !== '전체' && !fullText.includes(filters.sector.toLowerCase())) return false;
    if (filters.region !== '전체' && !fullText.includes(filters.region.toLowerCase())) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  if (activeTab === 'new') {
    finalFilteredList = finalFilteredList.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString());
  } else if (activeTab === 'closing') {
    finalFilteredList = finalFilteredList.filter(i => {
      if (!i.deadline_date) return false;
      const d = new Date(i.deadline_date); d.setHours(0,0,0,0);
      const diff = Math.ceil((d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    });
  } else if (activeTab === 'interest') {
    finalFilteredList = finalFilteredList.filter(i => interestSectors.some(sec => (i.title + (i.summary || '')).toLowerCase().includes(sec.toLowerCase())));
  } else if (activeTab === 'favorites') {
    finalFilteredList = finalFilteredList.filter(i => bookmarks.includes(i.id));
  }

  const finalItems = finalFilteredList.sort((a, b) => {
    const isAExpired = a.deadline_date && new Date(a.deadline_date).setHours(0,0,0,0) < todayDate.getTime();
    const isBExpired = b.deadline_date && new Date(b.deadline_date).setHours(0,0,0,0) < todayDate.getTime();
    if (isAExpired !== isBExpired) return isAExpired ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const infinityList = finalItems.slice(0, visibleItems);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
      <header className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-10 lg:gap-16">
            <LinkNext href="/" className="group flex items-center gap-2 shrink-0">
              <span className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">기틀</span>
              <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:animate-ping" />
            </LinkNext>
            <nav className="hidden md:flex items-center gap-8">
              {[{ id: '전체', label: '전체' }, { id: '지원공고', label: '지원사업' }, { id: '일반 뉴스', label: '뉴스·테크' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleArticleTypeChange(tab.id)}
                  className={`relative py-7 text-xs font-black tracking-widest uppercase transition-all ${filters.articleType === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {tab.label}
                  {filters.articleType === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6 flex-1 justify-end max-w-md">
             <div className="relative w-full hidden lg:block">
                <input 
                  type="text" 
                  placeholder="지능형 검색..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all pr-12 shadow-sm" 
                  value={searchQuery} 
                  onChange={(e) => {setSearchQuery(e.target.value); setVisibleItems(10);}} 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
             </div>
             <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 shadow-sm'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* [UX] Auto-Collapse: '전체' 탭일 때만 메인 배너와 전략 매거진 노출 */}
        {filters.articleType === '전체' && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-16 animate-scale-in">
              <div className="lg:col-span-7 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/5 border border-gray-100 group">
                 <LinkNext href={`/article/${newsItems[0]?.id || '#'}`}>
                    <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                      <img 
                        src={newsItems[0]?.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
                        alt="Hero" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-10">
                      <DDayBadge deadline={newsItems[0]?.deadline_date} category={newsItems[0]?.category} title={newsItems[0]?.title} className="mb-4" />
                      <h2 className="text-3xl font-black text-slate-900 mb-4 line-clamp-1">{newsItems[0]?.title ? parseTitle(newsItems[0].title).title : '로딩 중...'}</h2>
                      <p className="text-slate-500 font-medium line-clamp-2 leading-relaxed">{newsItems[0]?.summary?.replace(/<[^>]*>/g, '')}</p>
                    </div>
                 </LinkNext>
              </div>
              <div className="lg:col-span-3">
                 <div className="flex items-center justify-between mb-8 border-b-4 border-slate-900 pb-3">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">지금 뜨는 소식</h3>
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded italic animate-pulse">LIVE</span>
                 </div>
                 <div className="space-y-8">
                    {newsItems.slice(1, 6).map((item, idx) => (
                      <LinkNext key={item.id} href={`/article/${item.id}`} className="group relative flex gap-5 items-start">
                        <div className="flex-shrink-0 relative">
                           <span className="text-4xl font-black text-slate-200 group-hover:text-slate-900 transition-colors leading-none tracking-tighter italic">
                              {(idx + 1).toString().padStart(2, '0')}
                           </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                           <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                              {idx < 2 && <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />}
                           </div>
                           <h4 className="text-[15px] font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors tracking-tight">
                              {parseTitle(item.title).title}
                           </h4>
                        </div>
                        <div className="absolute -left-2 top-0 w-1 h-0 bg-blue-600 group-hover:h-full transition-all duration-300" />
                      </LinkNext>
                    ))}
                 </div>
              </div>
            </section>


          </>
        )}

        {/* [UX] Tab-specific 'Quick Section' 배치 */}
        {filters.articleType === '지원공고' && (
          <section className="mb-12 animate-slide-in-right bg-emerald-50 rounded-[2.5rem] p-10 text-emerald-900 shadow-2xl shadow-emerald-100">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-black tracking-tighter mb-2">마감 임박 공고 TOP 3</h3>
                   <p className="text-emerald-500 text-sm font-bold opacity-80 uppercase tracking-widest">실시간 기한 분석 시스템 가동 중</p>
                </div>
                <div className="w-12 h-12 bg-emerald-200/50 rounded-full flex items-center justify-center animate-pulse">
                   <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {closingSoonTop3.map((item, idx) => (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="bg-white rounded-2xl p-6 border border-emerald-100 hover:shadow-xl hover:shadow-emerald-200/20 transition-all group">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-black text-emerald-200 italic">{idx + 1}</span>
                        <DDayBadge deadline={item.deadline_date} className="!bg-emerald-600 !text-white" />
                     </div>
                     <h4 className="font-black text-[15px] leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">{parseTitle(item.title).title}</h4>
                  </LinkNext>
                ))}
             </div>
          </section>
        )}

        {filters.articleType === '일반 뉴스' && (
          <section className="mb-12 animate-slide-in-right bg-purple-50 rounded-[2.5rem] p-10 text-purple-900 shadow-2xl shadow-purple-100">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-black tracking-tighter mb-2">오늘의 테크 헤드라인</h3>
                   <p className="text-purple-400 text-sm font-bold opacity-80 uppercase tracking-widest">Global AI & Tech Intelligence Hub</p>
                </div>
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
             </div>
             <div className="space-y-4">
                {techHeadlines.map((item, idx) => (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="flex items-center gap-6 p-4 rounded-xl hover:bg-white transition-all group border-b border-purple-100 last:border-0">
                     <span className="text-purple-600 font-black text-xl italic w-4">{idx + 1}</span>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-black text-[16px] truncate group-hover:text-purple-600">{parseTitle(item.title).title}</h4>
                        <p className="text-[12px] text-purple-500/70 mt-1 truncate">{item.summary?.replace(/<[^>]*>/g, '')}</p>
                     </div>
                  </LinkNext>
                ))}
             </div>
          </section>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 py-6 border-y border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
            {[{ id: 'all', label: '전체' }, { id: 'new', label: '오늘 등록' }, { id: 'closing', label: '마감 임박' }, { id: 'interest', label: '관심 분야' }, { id: 'favorites', label: '찜하기' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setVisibleItems(10); }}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-2.5 rounded-xl font-black text-[11px] tracking-widest transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>상세 필터</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            {loading ? (
              <div className="py-32 flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">인텔리전스 로드 중...</p>
              </div>
            ) : infinityList.length === 0 ? (
              <div className="py-32 text-center text-slate-300 font-black">데이터가 없습니다</div>
            ) : (
              <div className="flex flex-col gap-[1px] bg-slate-100 border border-slate-100 rounded-[2rem] overflow-hidden shadow-lg">
                {infinityList.map((item) => {
                  const { title, institution } = parseTitle(item.title);
                  const isBookmarked = bookmarks.includes(item.id);
                  const isExpired = item.deadline_date && new Date(item.deadline_date).setHours(0,0,0,0) < todayDate.getTime();
                  return (
                    <div key={item.id} className={`group bg-white p-6 lg:p-8 transition-all hover:bg-slate-50 flex flex-col md:flex-row items-center gap-6 lg:gap-10 ${isExpired ? 'grayscale opacity-60' : ''}`}>
                       <div className="flex md:flex-col justify-between md:justify-start items-center md:items-start gap-4 w-full md:w-32 shrink-0">
                          <DDayBadge deadline={item.deadline_date} category={item.category} title={item.title} />
                          <button onClick={() => toggleBookmark(item.id)} className={`p-2.5 rounded-full border ${isBookmarked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-300'}`}>
                             <svg className={`w-5 h-5 ${isBookmarked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          </button>
                       </div>
                       

                       <LinkNext href={`/article/${item.id}`} className="flex-1 min-w-0 w-full space-y-3">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-widest">{item.category}</span>
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter opacity-60 italic">| {institution}</span>
                          </div>
                          <h4 className="text-xl lg:text-[24px] font-black text-slate-800 group-hover:text-blue-700 leading-tight tracking-tighter transition-colors">{title}</h4>
                          <p className="text-[14px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{item.summary?.replace(/<[^>]*>/g, '')}</p>
                       </LinkNext>
                       <div className="hidden md:flex w-10 shrink-0 justify-end">
                          <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
            {finalItems.length > visibleItems && (
              <div className="mt-16 text-center">
                <button onClick={() => setVisibleItems(prev => prev + 10)} className="px-12 py-6 bg-white border-2 border-slate-900 rounded-2xl font-black text-[14px] hover:bg-slate-900 hover:text-white transition-all">최신 소식 더보기 +</button>
              </div>
            )}
          </div>

          {showFilters && (
            <aside className="lg:w-80 shrink-0 animate-slide-in-right">
               <div className="sticky top-28 bg-white border-2 border-slate-900 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                  <h5 className="text-[11px] font-black uppercase border-b-2 border-slate-900 pb-2 w-fit">상세 필터</h5>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-4">타임라인</p>
                     <div className="flex flex-col gap-2">
                        {ALL_TIMELINES.map(t => (
                          <button key={t} onClick={() => { setFilters({...filters, timeline: t}); setVisibleItems(10); }} className={`text-left text-[13px] font-bold ${filters.timeline === t ? 'text-blue-600 font-black' : 'text-slate-500'}`}>{t}</button>
                        ))}
                     </div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-4">지역</p>
                     <div className="flex flex-wrap gap-1.5">
                        {ALL_REGIONS.map(r => (
                          <button key={r} onClick={() => { setFilters({...filters, region: r}); setVisibleItems(10); }} className={`px-2.5 py-1 rounded-md text-[11px] font-black border ${filters.region === r ? 'bg-blue-600 text-white' : 'text-slate-500 border-slate-200'}`}>{r}</button>
                        ))}
                     </div>
                  </div>
                  <button onClick={() => { setFilters({timeline:'전체',stages:[],benefits:[],sector:'전체',region:'전체',target:'전체',scale:'전체',operator:'전체',articleType:'전체'}); setVisibleItems(10); }} className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase">필터 초기화</button>
               </div>
            </aside>
          )}
        </div>
      </main>

      {/* Floating Subscription FAB */}
      {!isSubscribed && (
        <div className="fixed bottom-10 right-10 z-50">
          <button 
            onClick={() => setIsEmailGateOpen(true)}
            className="w-16 h-16 bg-blue-600 shadow-2xl rounded-2xl flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all group relative"
          >
            <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <div className="absolute right-full mr-4 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[12px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl border border-white/10">
              구독하고 '합격 전략' 뉴스레터 받기 🚀
            </div>
          </button>
        </div>
      )}

      {isEmailGateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEmailGateOpen(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl animate-scale-in text-center space-y-8">
              <div className="flex justify-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-blue-500/20">G</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">기틀 지능형 뉴스레터</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  구독 한 번으로 프리미엄 비즈니스 인사이트를<br/>매일 아침 무료로 받아보세요.
                </p>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 text-left space-y-4 border border-slate-100 shadow-inner">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">이용하실 혜택 선택</p>
                 {BENEFIT_LIST.map((benefit) => {
                   const isSelected = selectedBenefits.includes(benefit.id);
                   return (
                     <button 
                       key={benefit.id}
                       onClick={() => {
                         setSelectedBenefits(prev => 
                           prev.includes(benefit.id) ? prev.filter(b => b !== benefit.id) : [...prev, benefit.id]
                         );
                       }}
                       className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${isSelected ? 'bg-white border-blue-600 shadow-md' : 'bg-transparent border-transparent opacity-60'}`}
                     >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           {isSelected ? '✓' : ''}
                        </div>
                        <p className={`text-[13.5px] font-black tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{benefit.label}</p>
                     </button>
                   );
                 })}
              </div>

              <div className="space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ml-2">관심 분야 선택 (중복 가능)</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_SUBSCRIPTION_SECTORS.map(sector => (
                    <button 
                      key={sector}
                      type="button"
                      onClick={() => {
                        setInterestSectors(prev => 
                          prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
                        );
                      }}
                      className={`px-2 py-3 rounded-xl text-[11px] font-black transition-all border-2 ${interestSectors.includes(sector) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={submitEmail} className="mt-10 space-y-4">
                 <input 
                  type="email" 
                  required 
                  placeholder="뉴스레터를 받을 이메일 주소" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-blue-600 outline-none transition-all shadow-sm" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                />
                 <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all">프리미엄 혜택 시작하기 →</button>
              </form>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Coming Soon: Google One-tap Login</p>
              </div>
              <button onClick={() => setIsEmailGateOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>
      )}

      <footer className="bg-white py-24 mt-24 border-t-2 border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <span className="text-3xl font-black text-slate-900">기틀<span className="text-blue-600">.</span></span>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">© 2026 Giteul AI Media Portal. All rights reserved.</p>
        </div>
      </footer>
      
      <style jsx global>{`
        @keyframes slide-in-right { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}
