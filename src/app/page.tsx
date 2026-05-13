'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LinkNext from 'next/link';
import { supabase } from '@/lib/supabase';

// --- Components ---

function DDayBadge({ deadline, category, title, summary, className = "" }: { deadline?: string | null, category?: string, title?: string, summary?: string, className?: string }) {
  const isStrategy = title?.includes('[전략]') || category?.toLowerCase() === 'strategy';
  
  if (category && category !== '정부지원공고' && category !== 'strategy') {
    if (isStrategy) return <span className={`px-2 py-1 bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>STRATEGY</span>;
    return <span className={`px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>NEWS</span>;
  }

  let finalDeadline = deadline;
  if (!finalDeadline || finalDeadline === '상시모집' || finalDeadline === '미정') {
    // [CRITICAL] Expand search to title and summary for hidden dates
    const combined = (title || '') + ' ' + (summary || '');
    const datePattern = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})|(\d{1,2})[.\-/](\d{1,2})|(\d{1,2})월\s*(\d{1,2})일/;
    const match = combined.match(datePattern);
    
    if (match) {
      if (match[1]) finalDeadline = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      else if (match[4]) finalDeadline = `2026-${match[4].padStart(2, '0')}-${match[5].padStart(2, '0')}`;
      else if (match[6]) finalDeadline = `2026-${match[6].padStart(2, '0')}-${match[7].padStart(2, '0')}`;
    }
  }

  const today = new Date('2026-05-08'); 
  today.setHours(0,0,0,0);

  if (!finalDeadline || finalDeadline === '미정') {
     return <span className={`px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>D-확인</span>;
  }
  
  const target = new Date(finalDeadline);
  target.setHours(0,0,0,0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (isNaN(diff)) {
      let text = "상시/확인";
      if (finalDeadline.includes('확인')) text = "상시/확인";
      else if (finalDeadline.includes('소진')) text = "예산소진시";
      else if (finalDeadline !== '상시모집' && finalDeadline.length <= 6) text = finalDeadline;
      
      return <span className={`px-2 py-1 bg-teal-50 text-teal-600 border border-teal-100/50 text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>{text}</span>;
  }
  
  if (diff < 0) return <span className={`px-2 py-1 bg-slate-200 text-slate-400 text-[10px] font-black uppercase rounded-md ${className}`}>마감</span>;
  if (diff === 0) return <span className={`px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black animate-pulse uppercase rounded-md shadow-lg shadow-orange-500/20 ${className}`}>D-DAY</span>;
  if (diff <= 3) return <span className={`px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black uppercase rounded-md shadow-lg shadow-orange-500/20 ${className}`}>D-{diff}</span>;
  return <span className={`px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-md ${className}`}>D-{diff}</span>;
}

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("데이터 인텔리전스 동기화 중...");
  
  const [activeTab, setActiveTab] = useState<'전체' | '지원 사업' | '뉴스·테크'>('전체');
  const [activePill, setActivePill] = useState('전체');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmailGateOpen, setIsEmailGateOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['strategy', 'newsletter', 'bookmarks']);
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    // Restore state from sessionStorage
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('giteul_active_tab');
      if (savedTab && ['전체', '지원 사업', '뉴스·테크'].includes(savedTab)) {
        setActiveTab(savedTab as any);
      }
      
      const savedPill = sessionStorage.getItem('giteul_active_pill');
      if (savedPill) setActivePill(savedPill);
      
      const savedChips = sessionStorage.getItem('giteul_selected_chips');
      if (savedChips) {
        try { setSelectedChips(JSON.parse(savedChips)); } catch (e) { }
      }
      
      const savedSearch = sessionStorage.getItem('giteul_search_query');
      if (savedSearch) setSearchQuery(savedSearch);
      
      const savedVisible = sessionStorage.getItem('giteul_visible_items');
      if (savedVisible) setVisibleItems(parseInt(savedVisible, 10));

      const savedBookmarks = localStorage.getItem('antigravity_bookmarks');
      if (savedBookmarks) {
        try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { }
      }
    }

    fetchData();
    const msgs = ["포털 초기화 중...", "산업별 데이터 정리 중...", "최신 전략 리포트 동기화 중..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(msgs[i % msgs.length]);
      i++;
    }, 1200);
    
    return () => clearInterval(interval);
  }, []);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('giteul_active_tab', activeTab);
      sessionStorage.setItem('giteul_active_pill', activePill);
      sessionStorage.setItem('giteul_selected_chips', JSON.stringify(selectedChips));
      sessionStorage.setItem('giteul_search_query', searchQuery);
      sessionStorage.setItem('giteul_visible_items', visibleItems.toString());
    }
  }, [activeTab, activePill, selectedChips, searchQuery, visibleItems]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setNewsItems(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const parseTitle = (fullTitle: string) => {
    const parts = fullTitle.split(']');
    if (parts.length > 1) return { institution: parts[0].replace('[', ''), title: parts.slice(1).join(']').trim() };
    return { institution: 'GITEUL', title: fullTitle };
  };

  const filteredItems = useMemo(() => {
    let list = [...newsItems];
    
    // 1. Tab filter (Only active if not "전체")
    if (activeTab === '지원 사업') list = list.filter(i => i.category === '정부지원공고');
    if (activeTab === '뉴스·테크') list = list.filter(i => i.category !== '정부지원공고');

    // 2. Pill filter
    if (activePill === '오늘 등록') {
       const todayStart = new Date('2026-05-07T00:00:00Z');
       list = list.filter(i => new Date(i.created_at) >= todayStart);
    }
    if (activePill === '마감 임박') {
       const today = new Date('2026-05-07');
       today.setHours(0,0,0,0);
       list = list.filter(i => {
          if (i.category !== '정부지원공고') return false;
          let d = i.deadline_date;
          if (!d || d === '상시모집') {
             const datePattern = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})|(\d{1,2})[.\-/](\d{1,2})/;
             const match = (i.title + ' ' + (i.summary || '')).match(datePattern);
             if (match) d = match[1] ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : `2026-${match[4].padStart(2, '0')}-${match[5].padStart(2, '0')}`;
          }
          if (!d || d === '상시모집') return false;
          const target = new Date(d);
          target.setHours(0,0,0,0);
          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 3;
       });
    }
    if (activePill === '관심 분야') {
       if (selectedChips.length === 0) {
          list = [];
       }
    }
    if (activePill === '찜하기') {
       if (bookmarks.length === 0) return [];
       list = list.filter(i => bookmarks.includes(i.id));
    }

    if (selectedChips.length > 0) {
      const CHIP_KEYWORDS: Record<string, string[]> = {
        'AI/빅데이터': ['ai', '인공지능', '빅데이터', '데이터', '머신러닝', 'llm', '딥러닝'],
        'SaaS/플랫폼': ['saas', '플랫폼', '클라우드', '소프트웨어', '앱', '웹', 'b2b'],
        '바이오/헬스케어': ['바이오', '헬스케어', '의료', '신약', '제약', '의료기기', '의생명'],
        '친환경/에너지': ['친환경', '에너지', 'esg', '탄소', '그린', '배터리', '재생', '에코'],
        '로봇/모빌리티': ['로봇', '모빌리티', '드론', '자율주행', '자동차', '항공', '이동체'],
        '소부장/제조': ['소부장', '제조', '소재', '부품', '장비', '하드웨어', '공장', '양산'],
        '핀테크/블록체인': ['핀테크', '블록체인', '금융', '코인', '결제', '토큰', '페이'],
        '콘텐츠/게임': ['콘텐츠', '게임', '웹툰', '애니', '미디어', '엔터', '크리에이터', '방송'],
        '푸드/애그테크': ['푸드', '애그', '농업', '스마트팜', '식품', '외식', '푸드테크'],
        'R&D 지원': ['r&d', '연구', '기술개발'],
        '사업화 자금': ['사업화', '창업', '자금', '지원금', '바우처'],
        '마케팅 바우처': ['마케팅', '수출바우처', '홍보'],
        '공간/인프라': ['공간', '입주', '보육', '인프라', '센터', '오피스'],
        '멘토링/컨설팅': ['멘토링', '컨설팅', '엑셀러레이팅', '교육', 'ir'],
        '글로벌/수출': ['글로벌', '수출', '해외', '현지화', '글로벌진출'],
        '예비창업자': ['예비', '초기'],
        '초기스타트업': ['초기', '스타트업', '3년'],
        '도약/스케일업': ['도약', '스케일업', '7년', '창업도약'],
        '소상공인': ['소상공인', '전통시장'],
        '중소기업': ['중소기업', '벤처기업', '중소']
      };

      list = list.filter(i => {
        const text = (i.title + ' ' + (i.summary || '') + ' ' + (i.category || '')).toLowerCase();
        return selectedChips.some(chip => {
          const keywords = CHIP_KEYWORDS[chip] || [chip.toLowerCase()];
          return keywords.some(kw => text.includes(kw));
        });
      });
    }
    if (searchQuery.trim()) {
      list = list.filter(i => i.title.includes(searchQuery));
    }
    return list;
  }, [newsItems, activeTab, activePill, selectedChips, searchQuery]);

  const trendingList = useMemo(() => {
    return [...newsItems]
      .filter(i => i.category === '정부지원공고') // 플랫폼의 본질인 정부지원공고만 엄선
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // 1. K-Startup 메인 인기 사업(핫 키워드) 압도적 가중치
        const hotKeywords = ['TIPS', '팁스', '바우처', 'R&D', '초격차', '패키지', '창업사관학교', '지원사업'];
        hotKeywords.forEach(kw => {
            if (a.title.includes(kw)) scoreA += 500;
            if (b.title.includes(kw)) scoreB += 500;
        });
        
        // 2. 유저 지적사항 반영: 단순 '수정/변경/결과' 공고는 랭킹에서 대폭 강등 (패널티)
        const penaltyKeywords = ['수정', '변경', '결과', '발표', '안내', '취소', '연장', '모집안내'];
        penaltyKeywords.forEach(kw => {
            if (a.title.includes(kw)) scoreA -= 1000;
            if (b.title.includes(kw)) scoreB -= 1000;
        });

        // 3. 최신 데이터 어드밴티지 (기본 점수)
        scoreA += (a.id % 100);
        scoreB += (b.id % 100);

        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [newsItems]);
  const heroItem = newsItems[0];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase italic animate-pulse">{loadingMsg}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#FF5C00] selection:text-white">
      {/* HEADER: Zero-Blue & Minimal */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-8 py-5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <LinkNext href="/" className="text-3xl font-black tracking-tighter italic">GITEUL<span className="text-[#FF5C00]">.</span></LinkNext>
            <nav className="flex items-center gap-8">
              {['전체', '지원 사업', '뉴스·테크'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => { setActiveTab(tab as any); setVisibleItems(15); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`text-[14px] font-black tracking-widest transition-all relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute -bottom-6 left-0 w-full h-0.5 bg-slate-900" />}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative w-72 hidden md:block">
                <input type="text" placeholder="검색어 입력..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 text-[12px] font-bold outline-none focus:bg-white focus:border-slate-300 transition-all shadow-sm" />
             </div>
             <button onClick={() => setShowFilter(!showFilter)} className={`px-5 py-2.5 rounded-2xl font-black text-[12px] tracking-widest transition-all ${showFilter ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                필터 옵션
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        
        {/* HERO AREA (Conditional by Tab) */}
        {activeTab === '전체' && (
          <section className="grid gap-8 grid-cols-1 lg:grid-cols-10 h-[640px]">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 border border-slate-100 group lg:col-span-7 h-[640px]">
               <LinkNext href={`/article/${heroItem?.id || '#'}`} className="flex flex-col w-full h-full">
                  <div className="overflow-hidden bg-slate-100 shrink-0 relative h-[55%] w-full">
                    <img 
                      src={heroItem?.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
                      alt="Hero" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center bg-white z-10 p-12">
                    <div className="flex items-center gap-3 mb-6">
                       <DDayBadge deadline={heroItem?.deadline_date} category={heroItem?.category} title={heroItem?.title} summary={heroItem?.summary} />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{heroItem?.category}</span>
                    </div>
                    <h2 className="font-black text-slate-900 tracking-tighter line-clamp-2 text-4xl mb-4 leading-tight">{parseTitle(heroItem?.title || '').title}</h2>
                    <p className="text-[15px] text-slate-500 font-medium leading-relaxed line-clamp-2">{heroItem?.summary?.replace(/<[^>]*>/g, '')}</p>
                  </div>
               </LinkNext>
            </div>

            <div className="bg-white text-slate-900 border border-slate-100 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl shadow-slate-200/40 relative overflow-hidden lg:col-span-3 h-[640px]">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
               </div>
               <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 shrink-0 z-10">
                  <h3 className="font-black text-2xl tracking-tighter text-slate-900 italic">지금 뜨는 공고</h3>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full italic">HOT</span>
               </div>
               <div className="flex-1 flex flex-col justify-between mt-6 z-10">
                  {trendingList.map((item, idx) => (
                    <LinkNext key={item.id} href={`/article/${item.id}`} className="group relative flex items-start border-b border-slate-50 last:border-0 py-3">
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                             <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-[#FF5C00]" />
                          </div>
                          <h4 className="text-[15px] font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[#FF5C00] transition-colors tracking-tight">
                             {parseTitle(item.title).title}
                          </h4>
                       </div>
                    </LinkNext>
                  ))}
               </div>
            </div>
          </section>
        )}



        {activeTab === '뉴스·테크' && (
          <section className="-mx-8 px-12 py-14 mb-12 bg-[#FBF8FF] rounded-[2.5rem] relative overflow-hidden">
             <div className="relative z-10 max-w-4xl">
                <h2 className="text-3xl font-black text-slate-900 mb-2">오늘의 테크 헤드라인</h2>
                <p className="text-[11px] font-black text-[#a855f7] uppercase tracking-widest mb-10">GLOBAL AI & TECH INTELLIGENCE HUB</p>
                
                <div className="flex flex-col gap-8">
                   {filteredItems.filter(i => i.category !== '정부지원공고').slice(0, 2).map((item, idx) => (
                      <LinkNext key={item.id} href={`/article/${item.id}`} className="flex gap-6 group cursor-pointer items-start">
                         <span className="text-3xl font-black text-[#d8b4fe] italic mt-1">{idx + 1}</span>
                         <div className="flex-1">
                            <h4 className="text-[18px] font-black text-slate-900 group-hover:text-[#a855f7] transition-colors leading-relaxed line-clamp-1 mb-1.5">{parseTitle(item.title).title}</h4>
                            <p className="text-[13px] text-slate-500 line-clamp-1">[{item.category}] {item.summary?.replace(/<[^>]*>/g, '')}</p>
                         </div>
                      </LinkNext>
                   ))}
                </div>
             </div>
             <div className="absolute top-12 right-12 text-[#a855f7] opacity-20 pointer-events-none">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L22 22L12 18L2 22L12 2Z"/></svg>
             </div>
          </section>
        )}

        {/* PILL FILTERS */}
        <div className="flex gap-3 mb-10 border-b border-slate-100 pb-8">
          {['전체', '오늘 등록', '마감 임박', '관심 분야', '찜하기'].map((pill, idx) => (
            <button 
               key={pill} 
               onClick={() => {
                  setActivePill(pill);
                  if (pill === '관심 분야' && selectedChips.length === 0) setShowFilter(true);
               }}
               className={`px-6 py-2.5 rounded-full text-[13px] font-bold border transition-colors ${activePill === pill ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900'}`}>
              {pill}
            </button>
          ))}
        </div>

        {/* ACTIVE FILTERS CHIPS */}
        {selectedChips.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in mb-8">
             {selectedChips.map(chip => (
               <button key={chip} onClick={() => setSelectedChips(c => c.filter(x => x !== chip))} className="px-5 py-2 bg-slate-900 text-white text-[12px] font-bold rounded-2xl flex items-center gap-3 shadow-md hover:bg-slate-800 transition-colors">
                 # {chip} <span className="opacity-50 text-xs">×</span>
               </button>
             ))}
          </div>
        )}

        {/* FEED SECTION */}
        {activeTab === '지원 사업' ? (
          /* 지원사업 탭: K-Startup 스타일 4칼럼 썸네일 카드 그리드 */
          <section className="space-y-8 pb-32">
            {/* 검색 엔진 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="공고명, 키워드로 검색하세요" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-5 py-3.5 text-[14px] font-bold outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 transition-all" 
                  />
                </div>
                <button 
                  onClick={() => setShowFilter(!showFilter)} 
                  className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[13px] tracking-wider hover:bg-slate-800 transition-colors shadow-sm shrink-0 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  필터
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">전체 지원사업 공고</h2>
                <p className="text-[12px] font-bold text-slate-400 mt-1">총 {filteredItems.filter(i => i.category === '정부지원공고').length}건</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredItems.filter(i => i.category === '정부지원공고').slice(0, visibleItems).map((item) => {
                const { title } = parseTitle(item.title);
                const sectorMatch = item.summary?.match(/^\[(.*?)\]/);
                const sector = sectorMatch ? sectorMatch[1] : '일반';
                const sourceUrl = item.notice_url || '';
                let sourceName = 'K-Startup';
                try {
                  if (sourceUrl.includes('k-startup')) sourceName = 'K-Startup';
                  else if (sourceUrl.includes('mss.go.kr')) sourceName = '중소벤처기업부';
                  else if (sourceUrl.includes('sbiz.or.kr')) sourceName = '소상공인시장진흥공단';
                  else if (sourceUrl.includes('kised.or.kr')) sourceName = '창업진흥원';
                  else if (sourceUrl.includes('innopolis')) sourceName = '연구개발특구';
                  else if (sourceUrl && sourceUrl.startsWith('http')) sourceName = new URL(sourceUrl).hostname.replace('www.', '');
                } catch { /* keep default */ }
                return (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all">
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=600&auto=format&fit=crop'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=600&auto=format&fit=crop'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute top-2.5 left-2.5">
                        <DDayBadge deadline={item.deadline_date} category={item.category} title={item.title} summary={item.summary} className="shadow-lg" />
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black rounded tracking-wider">{sector}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <h4 className="text-[14px] font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#FF5C00] transition-colors">{title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                        <span className="text-[#FF5C00] font-black">{sourceName}</span>
                        <span className="text-slate-200">|</span>
                        <span>{new Date(item.created_at).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'})}</span>
                      </div>
                    </div>
                  </LinkNext>
                );
              })}
            </div>

            {filteredItems.filter(i => i.category === '정부지원공고').length === 0 && (
              <div className="py-20 text-center text-slate-400 font-medium text-sm">
                {activePill === '관심 분야' && selectedChips.length === 0 ? '우측 상단의 필터 옵션에서 관심 분야를 설정해주세요.' : 
                 activePill === '찜하기' ? '아직 찜한 공고가 없습니다.' : 
                 activePill === '오늘 등록' ? '오늘 새롭게 등록된 지원사업 공고가 없습니다.' : 
                 '해당 조건의 공고가 없습니다.'}
              </div>
            )}

            {filteredItems.filter(i => i.category === '정부지원공고').length > visibleItems && (
              <div className="pt-16 flex justify-center">
                <button onClick={() => setVisibleItems(v => v + 20)} className="px-12 py-5 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                   더 보기 +
                </button>
              </div>
            )}
          </section>
        ) : (
          /* 전체 / 뉴스테크 탭: 기존 2칼럼 리스트 피드 */
          <section className="space-y-8 pb-32">
           <h2 className="text-3xl font-black tracking-tighter mb-8">
             {activeTab === '뉴스·테크' ? '테크 & 인사이트 브리핑' : '전체 브리핑'}
           </h2>
           
           <div className={`grid gap-16 ${activeTab === '뉴스·테크' ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-1 lg:grid-cols-2'}`}>
             {/* LEFT COLUMN: 정부지원공고 (전체 탭에서만 노출) */}
             {activeTab === '전체' && (
               <div className="flex flex-col">
                 <div className="flex items-end justify-between mb-4 px-2">
                   <div className="flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-[#FF5C00]" />
                     <h3 className="text-2xl font-black italic tracking-tighter">정부지원공고</h3>
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">LIVE FEED</span>
                 </div>
                 <div className="h-[2px] bg-slate-900 mb-2" />
                 
                 <div className="flex flex-col">
                   {filteredItems.filter(i => i.category === '정부지원공고').slice(0, visibleItems).map((item, idx) => {
                      const { title, institution } = parseTitle(item.title);
                      return (
                      <LinkNext key={item.id} href={`/article/${item.id}`} className="flex items-center gap-4 py-6 px-4 -mx-4 border-b border-slate-200 hover:bg-slate-50 transition-all group rounded-xl">
                         <span className="text-xs font-black text-slate-300 italic w-5 shrink-0 text-center">{idx + 1}</span>
                         <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                            <h4 className="text-[16px] font-black text-slate-900 group-hover:text-[#FF5C00] transition-colors leading-relaxed line-clamp-2">{title}</h4>
                            <div className="flex items-center gap-2">
                               <p className="text-[12px] font-bold text-slate-400">{institution}</p>
                               <span className="text-[10px] text-slate-200">|</span>
                               <span className="text-[11px] font-medium text-slate-400">{new Date(item.created_at).toLocaleDateString('ko-KR', {month:'2-digit', day:'2-digit'})} 등록</span>
                            </div>
                         </div>
                         <DDayBadge deadline={item.deadline_date} category={item.category} title={item.title} summary={item.summary} className="shadow-md shrink-0 scale-110 origin-right" />
                      </LinkNext>
                      );
                   })}
                   {filteredItems.filter(i => i.category === '정부지원공고').length === 0 && (
                      <div className="py-12 text-center text-slate-400 font-medium text-sm">
                         {activePill === '관심 분야' && selectedChips.length === 0 ? '우측 상단의 필터 옵션에서 관심 분야를 설정해주세요.' : 
                          activePill === '찜하기' ? '아직 찜한 공고가 없습니다.' : 
                          activePill === '오늘 등록' ? '오늘 새롭게 등록된 지원사업 공고가 없습니다.' : 
                          '해당 조건의 공고가 없습니다.'}
                      </div>
                   )}
                 </div>
               </div>
             )}

             {/* RIGHT COLUMN: 인사이트&뉴스 */}
             <div className="flex flex-col">
               <div className="flex items-end justify-between mb-4 px-2">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-slate-900" />
                   <h3 className="text-2xl font-black italic tracking-tighter">
                     {activeTab === '뉴스·테크' ? '글로벌 테크 & 비즈니스 인사이트' : '인사이트&뉴스'}
                   </h3>
                 </div>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GLOBAL ANALYSIS</span>
               </div>
               <div className="h-[2px] bg-slate-900 mb-2" />
               
               <div className="flex flex-col">
                 {filteredItems.filter(i => i.category !== '정부지원공고').slice(0, visibleItems).map((item, idx) => {
                    const { title } = parseTitle(item.title);
                    return (
                    <LinkNext key={item.id} href={`/article/${item.id}`} className="flex items-center gap-5 py-6 px-4 -mx-4 border-b border-slate-200 hover:bg-slate-50 transition-all group rounded-xl">
                       <span className="text-xs font-black text-slate-300 italic w-5 shrink-0 text-center">{idx + 1}</span>
                       <div className="w-14 h-14 bg-slate-100 shrink-0 overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                          <img src={item.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=100&auto=format&fit=crop'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=100&auto=format&fit=crop'; }} />
                       </div>
                       <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                          <div className="flex items-center gap-2 mb-0.5">
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{item.category}</span>
                             <span className="text-[10px] text-slate-200">|</span>
                             <span className="text-[11px] font-medium text-slate-400">{new Date(item.created_at).toLocaleDateString('ko-KR', {month:'2-digit', day:'2-digit'})} 발행</span>
                          </div>
                          <h4 className="text-[16px] font-black text-slate-900 group-hover:text-slate-600 transition-colors leading-relaxed line-clamp-2">{title}</h4>
                       </div>
                       <svg className="w-5 h-5 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </LinkNext>
                    );
                 })}
                 {filteredItems.filter(i => i.category !== '정부지원공고').length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-medium text-sm">
                       {activePill === '관심 분야' && selectedChips.length === 0 ? '우측 상단의 필터 옵션에서 관심 분야를 설정해주세요.' : 
                        activePill === '찜하기' ? '아직 찜한 뉴스가 없습니다.' : 
                        activePill === '마감 임박' ? '뉴스 기사에는 마감 기한이 존재하지 않습니다.' : 
                        activePill === '오늘 등록' ? '오늘 새롭게 발행된 테크 뉴스가 없습니다.' : 
                        '해당 조건의 뉴스가 없습니다.'}
                    </div>
                 )}
               </div>
             </div>
           </div>

           {(filteredItems.filter(i => i.category === '정부지원공고').length > visibleItems || filteredItems.filter(i => i.category !== '정부지원공고').length > visibleItems) && (
             <div className="pt-16 flex justify-center">
                <button onClick={() => setVisibleItems(v => v + 15)} className="px-12 py-5 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                   LOAD MORE INTELLIGENCE +
                </button>
             </div>
           )}
          </section>
        )}
      </main>

      {/* RIGHT SLIDING DRAWER: FILTER */}
      {showFilter && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-12 space-y-12 animate-drawer-in rounded-l-[2.5rem] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 shrink-0">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter">인텔리전스 필터</h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">선택된 태그를 다시 클릭(더블클릭)하면 취소됩니다.</p>
                 </div>
                 <button onClick={() => setShowFilter(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="space-y-10 flex-1 overflow-y-auto pr-2">
                 {[
                   { title: '산업 분야', tags: ['AI/빅데이터', 'SaaS/플랫폼', '바이오/헬스케어', '친환경/에너지', '로봇/모빌리티', '소부장/제조', '핀테크/블록체인', '콘텐츠/게임', '푸드/애그테크'] },
                   { title: '지원 형태', tags: ['R&D 지원', '사업화 자금', '마케팅 바우처', '공간/인프라', '멘토링/컨설팅', '글로벌/수출'] },
                   { title: '기업 규모', tags: ['예비창업자', '초기스타트업', '도약/스케일업', '소상공인', '중소기업'] }
                 ].map(category => (
                   <div key={category.title} className="space-y-4">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{category.title}</p>
                      <div className="flex flex-wrap gap-2">
                         {category.tags.map(tag => (
                           <button 
                            key={tag} 
                            onClick={() => setSelectedChips(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag])}
                            className={`px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${selectedChips.includes(tag) ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900'}`}
                           >
                             {tag}
                           </button>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
              <div className="pt-6 border-t border-slate-100 space-y-3 shrink-0">
                 <button onClick={() => setShowFilter(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[14px] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors">필터 적용하기</button>
                 <button onClick={() => setSelectedChips([])} className="w-full py-4 text-slate-400 text-[12px] font-bold hover:text-slate-900 transition-colors">선택 초기화</button>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white py-16 mt-16 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">기틀</span>
            <div className="w-2 h-2 rounded-full bg-[#FF5C00]" />
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

      {/* Floating Subscription FAB */}
      {!isSubscribed && (
        <div className="fixed bottom-10 right-10 z-50">
          <button 
            onClick={() => {
              // 필터 드로어에서 선택한 태그가 있다면 모달의 관심 분야에 기본으로 셋팅
              if (selectedChips.length > 0) {
                 setInterestSectors([...selectedChips]);
              }
              setIsEmailGateOpen(true);
            }}
            className="w-16 h-16 bg-slate-900 shadow-2xl rounded-2xl flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 transition-all group relative"
          >
            <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <div className="absolute right-full mr-4 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[12px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl border border-white/10">
              뉴스레터 구독하기 <span className="text-[#FF5C00] ml-1">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Subscription Modal (Zero-Blue) */}
      {isEmailGateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEmailGateOpen(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl animate-scale-in text-center space-y-8 max-h-[90vh] overflow-y-auto hide-scrollbar">
              <div className="flex justify-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-slate-900/20">G</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">기틀 지능형 뉴스레터</h3>
                <p className="text-[14px] text-slate-500 font-bold leading-relaxed">상위 1% 비즈니스 리더를 위한<br/>맞춤형 지원사업 및 전략 리포트</p>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 text-left space-y-4 border border-slate-100 shadow-inner">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">이메일 구독 시 즉시 제공되는 4가지 프리미엄 혜택</p>
                 {[
                   { id: 'intelligence', title: "경쟁사보다 빠른 '아침 인텔리전스' ☕", desc: '남들이 공고 사이트를 뒤적일 때, 매일 아침 메일함에 꽂힌 심층 리포트로 하루를 시작하세요.' },
                   { id: 'scanner', title: 'AI 맞춤형 지원금 스캐너 💡', desc: '수만 개의 공고 중 내 산업 분야에 숨어있는 눈먼 정부지원금을 AI가 싹 다 찾아드립니다.' },
                   { id: 'reading', title: '첨부파일 딥 리딩 (Deep-Reading) 📑', desc: '귀찮은 한글/PDF 공고문 확인 끝. 숨겨진 합격 가점과 우대사항만 1분 만에 짚어냅니다.' },
                   { id: 'deadline', title: '놓칠 수 없는 마감일 철통 방어 🛡️', desc: '바빠서 아까운 지원금을 날리는 일이 없도록, 가장 중요한 데드라인 타이밍을 관리해 드립니다.' }
                 ].map(benefit => (
                    <div key={benefit.id} className="w-full flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 mb-1.5">
                           <div className="w-5 h-5 rounded-full bg-slate-900 text-[#FF5C00] flex items-center justify-center text-[10px] font-black">✓</div>
                           <p className="text-[14px] font-black tracking-tight text-slate-900">{benefit.title}</p>
                        </div>
                        <p className="text-[12.5px] text-slate-500 font-bold leading-relaxed pl-8 tracking-tight">{benefit.desc}</p>
                    </div>
                 ))}
              </div>

              <div className="text-left space-y-6">
                 {[
                   { title: '산업 분야', tags: ['AI/빅데이터', 'SaaS/플랫폼', '바이오/헬스케어', '친환경/에너지', '로봇/모빌리티', '소부장/제조', '핀테크/블록체인', '콘텐츠/게임', '푸드/애그테크'] },
                   { title: '지원 형태', tags: ['R&D 지원', '사업화 자금', '마케팅 바우처', '공간/인프라', '멘토링/컨설팅', '글로벌/수출'] },
                   { title: '기업 규모', tags: ['예비창업자', '초기스타트업', '도약/스케일업', '소상공인', '중소기업'] }
                 ].map(category => (
                   <div key={category.title} className="space-y-3">
                     <p className="text-[12px] font-black text-slate-900 ml-2">
                       {category.title} {category.title === '산업 분야' && <span className="text-slate-400 font-normal">(다중 선택 가능)</span>}
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {category.tags.map(tag => (
                          <button
                            key={tag} type="button"
                            onClick={() => setInterestSectors(prev => prev.includes(tag) ? prev.filter(s => s !== tag) : [...prev, tag])}
                            className={`px-3 py-2.5 rounded-xl text-[11.5px] font-black transition-all border-2 ${interestSectors.includes(tag) ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900'}`}
                          >
                            {tag}
                          </button>
                        ))}
                     </div>
                   </div>
                 ))}
              </div>

              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                if(userEmail.includes('@')) { 
                  try {
                    await supabase.from('subscribers').insert([{ email: userEmail, interests: interestSectors }]);
                    setIsSubscribed(true); 
                    setIsEmailGateOpen(false); 
                  } catch (err) { console.error(err); }
                } 
              }} className="space-y-4">
                <input 
                  type="email" 
                  required 
                  placeholder="뉴스레터를 받을 이메일 주소" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-slate-900 outline-none transition-all shadow-sm text-slate-900" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                />
                 <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">프리미엄 혜택 시작하기 →</button>
              </form>
              <div className="pt-2 border-t border-slate-50">
                <button onClick={() => setIsEmailGateOpen(false)} className="text-slate-400 text-sm font-bold hover:text-slate-900 transition-colors mt-4">다음에 할게요</button>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-drawer-in { animation: drawer-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes scale-in { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
