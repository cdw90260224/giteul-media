'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

function SectorBadge({ sector }: { sector: string }) {
  if (!sector || sector === '일반') return null;
  const colors: Record<string, string> = {
    '농업': 'bg-green-50 text-green-700 border-green-200',
    '기술/IT': 'bg-blue-50 text-blue-700 border-blue-200',
    '소상공인': 'bg-orange-50 text-orange-700 border-orange-200'
  };
  const colorClass = colors[sector] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-black border ${colorClass} tracking-tight`}>
      {sector}
    </span>
  );
}

function UpgradeLoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Gemini가 공고문을 정밀 분석 중입니다...",
    "핵심 평가 지표를 추출하고 있습니다...",
    "합격 가능성을 높이는 차별화 전략을 도출 중입니다...",
    "경쟁 우위를 점할 수 있는 실전 시나리오를 구성하고 있습니다...",
    "심사위원의 관점에서 리포트를 다듬고 있습니다...",
    "거의 다 되었습니다. 잠시만 기다려 주세요!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-500">
      <div className="relative w-40 h-40 mb-16">
        <div className="absolute inset-0 rounded-full border-[6px] border-blue-500/10 border-t-blue-500 animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-6 rounded-full border-[6px] border-indigo-400/10 border-b-indigo-400 animate-spin-reverse" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black text-blue-500 italic animate-pulse drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">G</span>
        </div>
      </div>
      <div className="space-y-8 max-w-xl">
        <div className="h-20 flex items-center justify-center">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight animate-message-fade">
            {messages[messageIndex]}
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4">
          <p className="text-blue-400 font-black tracking-[0.4em] text-[11px] uppercase animate-pulse">
            Giteul Intelligence System Upgrading
          </p>
          <div className="w-72 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 animate-loading-bar shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArticleDetailClient({ id }: { id: string }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
      const savedBookmarks = localStorage.getItem('antigravity_bookmarks');
      if (savedBookmarks) {
        try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { }
      }
      const savedEmail = localStorage.getItem('giteul_user_email');
      if (savedEmail) setIsSubscribed(true);
    }
    async function fetchPostData() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
        if (!error && data) setPost(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchPostData();
  }, [id]);

  const handleUpgradeStrategy = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/upgrade-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`인텔리전스 업그레이드 실패: ${errData.error || 'AI 엔진 응답 처리 오류'}`);
      }
    } catch { 
      alert('네트워크 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.'); 
    } finally { 
      setUpgrading(false); 
    }
  };

  const handleLinkedInShare = async () => {
    const summaryText = `[기틀 핫이슈] ${post.title}\n\n"${post.summary}"\n\n자세한 인사이트 확인하기 👇\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(summaryText);
      alert('클립보드에 요약 문구가 복사되었습니다!\nLinkedIn 작성 창에 붙여넣기(Ctrl+V) 하시면 더 매력적인 공유가 가능합니다.');
    } catch { } // 무시
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAnalysis = () => {
    const text = `📌 [기틀 미디어 전략 리포트]\n\n제목: ${post.title}\n🔍 핵심 요약: ${post.summary}\n💡 상세 전략 분석: ${shareUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const toggleBookmark = () => {
    if (!post) return;
    if (!isSubscribed) {
      setShowEmailModal(true);
      return;
    }
    setBookmarks(prev => {
      const next = prev.includes(post.id) ? prev.filter(b => b !== post.id) : [...prev, post.id];
      localStorage.setItem('antigravity_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      localStorage.setItem('giteul_user_email', email);
      setIsSubscribed(true);
      setShowEmailModal(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Giteul Intelligence...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Post not found.</div>;

  const isGovSupport = post.category === '정부지원공고';
  const isStrategyPost = post.title.includes('[전략]');
  const isBookmarked = bookmarks.includes(post.id);

    const getDDay = () => {
      const isStrategy = post.title.includes('[전략]') || post.category?.toLowerCase() === 'strategy';
      const isTech = ['tech', 'Tech', 'AI/테크 트렌드', 'AI/Tech', 'ai/tech'].includes(post.category || '');
      const isMarket = post.category === '기업/마켓 뉴스';

      // [CRITICAL] D-Day Priority: title에서 날짜 추출 시도 (deadline이 없는 경우 대비)
      let effectiveDeadline = post.deadline_date;
      if (!effectiveDeadline && post.title && (post.category === '정부지원공고' || post.category === 'strategy')) {
        const dateMatch = post.title.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/) || 
                         post.title.match(/(\d{1,2})[.\/-](\d{1,2})/);
        if (dateMatch) {
          if (dateMatch[1].length === 4) {
            effectiveDeadline = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          } else {
            effectiveDeadline = `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
          }
        }
      }

      const getNoDeadlineInfo = () => {
        if (isStrategy) return { label: 'STRATEGY', color: 'bg-blue-600 text-white', text: 'AI 전략 리포트' };
        if (isTech) return { label: 'TECH', color: 'bg-purple-600 text-white', text: '테크 트렌드 리포트' };
        if (isMarket) return { label: 'MARKET', color: 'bg-teal-600 text-white', text: '기업/마켓 리포트' };
        if (post.category === '정부지원공고') return { label: 'D-상시/확인', color: 'bg-blue-600 text-white', text: '신규 지원공고' };
        return { label: 'NEWS', color: 'bg-slate-400 text-white', text: '최신 뉴스 업데이트' };
      };

      if (!effectiveDeadline) return getNoDeadlineInfo();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(effectiveDeadline);
      if (isNaN(deadline.getTime())) return getNoDeadlineInfo();
      deadline.setHours(0, 0, 0, 0);
    
    const diff = deadline.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (isStrategy) return { label: 'STRATEGY', color: 'bg-blue-600 text-white', text: 'AI 전략 리포트' };

    if (days === 0) return { label: 'D-DAY', color: 'bg-red-600 text-white', text: '실시간 마감 임박 알림' };
    if (days < 0) return { label: 'EXPIRED', color: 'bg-gray-200 text-gray-500', text: '종료된 공고입니다' };
    if (days <= 7) return { label: `D-${days}`, color: 'bg-red-600 text-white', text: '실시간 마감 임박 알림' };
    return { label: `D-${days}`, color: 'bg-slate-900 text-white', text: '안정적인 모집 중' };
  };

  const dDay = getDDay();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {upgrading && <UpgradeLoadingOverlay />}
      <nav className="print:hidden w-full bg-white/80 backdrop-blur-md border-b border-slate-50 sticky top-0 z-50 py-4 px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">기틀</span>
            <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:animate-ping" />
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs tracking-widest ${isBookmarked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}
            >
              <svg className={`w-4 h-4 ${isBookmarked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              {isBookmarked ? '관심 공고 취소' : '관심 공고 등록'}
            </button>
            <span className="bg-black text-white px-5 py-2 rounded-full text-[13px] font-black uppercase tracking-widest italic">{post.category}</span>
          </div>
        </div>
      </nav>

      {/* Print Only Header */}
      <div className="hidden print:block text-center pt-16 pb-8 border-b-4 border-slate-900 mb-12">
        <h1 className="text-4xl font-black tracking-tighter">GITEUL INTELLIGENCE REPORT</h1>
        <p className="text-lg font-bold text-slate-500 mt-2">Premium AI Curation Data Center</p>
      </div>

      <header className="max-w-3xl mx-auto px-6 pt-12 pb-12">
        <div className="space-y-8">
            {dDay && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 animate-bounce-subtle">
                  <span className={`${dDay.color} px-4 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-lg`}>
                    {dDay.label}
                  </span>
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{dDay.text}</span>
                </div>
                <button 
                  onClick={toggleBookmark}
                  className={`group flex items-center justify-center p-3 rounded-full border-2 transition-all ${isBookmarked ? 'bg-red-50 border-red-300 text-red-500 shadow-lg shadow-red-200 scale-110' : 'bg-white border-slate-100 text-slate-300 hover:border-red-400 hover:text-red-400'}`}
                >
                  <svg className={`w-8 h-8 ${isBookmarked ? 'fill-current animate-heart-pop' : 'fill-none group-hover:scale-110 transition-transform'}`} stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </button>
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-black text-[#0f172a] leading-[1.2] tracking-tighter flex items-center flex-wrap gap-4">
                {post.title
                  .replace(/D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+|마감\s*\~[\d-.]+/gi, '')
                  .replace(/조회\s*[\d,]+|조회수\s*[\d,]+|등록일\s*[\d-.]+|관리자|공공기관|조회|창업진흥원|[\d-]{10}/gi, '') // 더 강력한 노이즈 제거
                  .replace(/\[\s*전략\s*\]/gi, '[전략]')
                  .replace(/\s+/g, ' ')
                  .trim()}
                {post.summary?.match(/^\[(농업|기술\/IT|소상공인|바이오\/헬스케어|에너지\/ESG|제조\/하드웨어|문화\/콘텐츠|커머스\/서비스|글로벌\/수출)\]/) && (
                  <SectorBadge sector={post.summary.match(/^\[(.*?)\]/)[1]} />
                )}
            </h1>
            
            <div className="relative mt-12 p-10 md:p-14 bg-[#F8FAFC] rounded-[4rem] border border-slate-200/50 shadow-sm group hover:border-blue-200 transition-all duration-500 overflow-hidden">
                <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity select-none">
                    <span className="text-[12rem] font-black italic">REPORT</span>
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-px bg-blue-600" />
                    <span className="text-blue-600 text-[11px] font-black uppercase tracking-[0.5em] block">Executive Briefing</span>
                  </div>
                  <div className="text-lg md:text-xl text-slate-700 font-semibold leading-[1.9] tracking-tight summary-content prose prose-slate max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {post.summary?.replace(/^\[.*?\]\s*/, '')}
                    </ReactMarkdown>
                  </div>
                </div>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mb-16">
        <div className="relative aspect-[21/9] w-full rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-[16px] border-white ring-1 ring-slate-100 bg-white">
          <img 
            src={post.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
            alt="Hero" 
            onError={(e: any) => { 
              e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop';
            }} 
          />
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pb-60 text-[1.25rem] leading-[1.9] text-slate-600 font-medium">
        <div className="max-w-none article-content">
          <div className="relative">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h2: ({node, ...props}) => {
                  return (
                    <h2 className="group flex items-center gap-4 text-3xl font-black text-slate-900 mt-20 mb-8 pt-12 border-t border-slate-100" {...props}>
                      <span className="text-blue-600 opacity-20 group-hover:opacity-100 transition-opacity">/</span>
                      {props.children}
                    </h2>
                  );
                },
                h3: ({node, ...props}) => {
                  const headerText = Array.isArray(props.children) ? props.children.join('') : String(props.children);
                  const isReporterHeader = headerText.includes('기자의 시선');
                  if (isReporterHeader) {
                    return (
                      <div className="mt-24 mb-6 flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs italic border-2 border-blue-500 shadow-lg">G</div>
                          <span className="text-blue-600 text-[11px] font-black uppercase tracking-[0.4em]">Expert Opinion</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight" {...props}>
                          {props.children}
                        </h3>
                      </div>
                    );
                  }
                  return (
                    <h3 className="text-2xl font-black text-[#002B5B] mt-16 mb-6 flex items-center gap-3" {...props}>
                      <div className="w-2 h-6 bg-blue-500 rounded-full" />
                      {props.children}
                    </h3>
                  );
                },
                p: ({node, ...props}) => (
                  <p className="text-[1.15rem] leading-[1.8] text-slate-700 mb-8 font-medium tracking-tight font-sans" {...props} />
                ),
                ul: ({node, ...props}) => (
                  <ul className="space-y-4 mb-10 list-none pl-2" {...props} />
                ),
                li: ({node, ...props}) => (
                  <li className="flex gap-4 text-[1.2rem] text-slate-700 font-semibold" {...props}>
                    <span className="text-blue-500 mt-1">✦</span>
                    <div className="flex-1">{props.children}</div>
                  </li>
                ),
                table: ({node, ...props}) => (
                  <div className="my-16 overflow-x-auto rounded-[2rem] border-2 border-slate-50 shadow-2xl bg-white">
                    <table className="w-full border-collapse" {...props} />
                  </div>
                ),
                th: ({node, ...props}) => (
                  <th className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] p-6 text-left" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="p-6 text-[1.1rem] font-bold text-slate-800 border-b border-slate-50" {...props} />
                ),
                blockquote: ({node, ...props}) => (
                  <div className="my-12 p-10 md:p-14 bg-gradient-to-br from-slate-50 to-white rounded-[3.5rem] border-2 border-slate-100 shadow-xl relative overflow-hidden group hover:border-blue-100 transition-all duration-700">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="text-[1.2rem] md:text-[1.35rem] leading-[2] text-slate-700 font-bold tracking-tight">
                        {props.children}
                      </div>
                    </div>
                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                          <div className="text-white font-black italic text-sm">G</div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-black text-sm tracking-tight">안티그래비티 전문위원</span>
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Chief Strategy Reporter</span>
                        </div>
                      </div>
                      <div className="hidden md:block">
                         <span className="text-slate-100 text-6xl font-black italic select-none">ANALYSIS</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        {isGovSupport && (post.notice_url || post.url) && (
            <div className="mt-20 -mb-4 flex flex-col items-center">
               <a href={post.notice_url || post.url} target="_blank" rel="noreferrer" className="group flex items-center gap-4 px-12 py-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 font-black text-[16px] tracking-widest hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-lg hover:shadow-2xl">
                   <span>🌐 공식 웹사이트 원문 공고 확인하기</span>
                   <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
               </a>
               <p className="mt-4 text-[12px] font-bold text-slate-400 tracking-wider">이동 시 해당 웹사이트(K-Startup 등)의 새 창이 열립니다.</p>
            </div>
        )}

        {isGovSupport && !isStrategyPost && (
            <div className="print:hidden mt-24 p-12 bg-slate-900 rounded-[4rem] text-center space-y-10 shadow-2xl border-4 border-blue-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="space-y-4 relative z-10">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse italic">Professional Insight Upgrade</span>
                    <h4 className="text-white text-3xl font-black tracking-tighter leading-tight">이 공고의 '사업계획서 실전 전략' 정보가 아직 부족한가요?</h4>
                </div>
                <button 
                  onClick={handleUpgradeStrategy}
                  disabled={upgrading}
                  className={`inline-block px-12 py-7 rounded-2xl font-black text-xl tracking-widest transition-all shadow-2xl relative z-10
                    ${upgrading ? 'bg-slate-700 text-white animate-pulse cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95'}`}
                >
                    {upgrading ? '🚀 Gemini가 전략 리포트로 전면 개편 중...' : '[이 사업의 \'실시간 전략 리포트\' 생성하기 →]'}
                </button>
            </div>
        )}

        <div className="print:hidden mt-32 pt-20 border-t-2 border-slate-100 flex flex-col items-center gap-12 bg-slate-50 py-20 rounded-[4rem]">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
              {isGovSupport ? '합격을 부르는 인사이트를 공유하세요.' : '핵심 인사이트를 주변에 공유하세요.'}
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                {isGovSupport && (
                  <button onClick={handleCopyAnalysis} className={`flex items-center gap-4 px-8 py-6 rounded-2xl font-black text-[15px] tracking-widest transition-all shadow-xl ring-2 ${copied ? 'bg-green-500 text-white ring-green-200' : 'bg-white text-slate-800 ring-slate-100 hover:ring-blue-600'}`}>
                      {copied ? '✅ 복사 완료! 붙여넣으세요 ' : '🔍 전략 분석문 복사하기'}
                  </button>
                )}
                <button onClick={handlePrint} className="flex items-center gap-4 bg-slate-900 text-white px-8 py-6 rounded-2xl font-black text-[15px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                  🖨️ PDF 리포트 저장
                </button>
                <button onClick={handleLinkedInShare} className="flex items-center gap-4 bg-[#0077b5] text-white px-8 py-6 rounded-2xl font-black text-[15px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                  LinkedIn 공유하기
                </button>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
          
          @media print {
            body { font-size: 11pt !important; background: white !important; }
            article { max-width: 100% !important; padding: 0 !important; }
            .article-content { padding: 0px !important; }
            h2, h3 { page-break-after: avoid; }
            p, ul, li { page-break-inside: avoid; }
          }
        ` }} />
      </article>

      <footer className="print:hidden bg-white py-16 mt-16 border-t border-slate-100 text-center">
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

      {/* Floating Scroll to Top & Subscription FAB */}
      <div className="print:hidden fixed bottom-10 right-10 flex flex-col gap-4 z-40">
        {!isSubscribed && (
          <button 
            onClick={() => setShowEmailModal(true)}
            className="w-14 h-14 bg-blue-600 shadow-2xl rounded-2xl flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all group relative"
          >
            <svg className="w-7 h-7 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <div className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              매일 아침 전략 리포트 받기 🚀
            </div>
          </button>
        )}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 bg-white shadow-2xl rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all group"
        >
          <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>

      {/* Global Email Subscription Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEmailModal(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl animate-scale-in text-center space-y-8">
              <div className="flex justify-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-blue-500/20">G</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">기틀 지능형 뉴스레터</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  매일 아침 업데이트되는 핵심 전략 리포트와<br/>관심 공고 관리 기능을 무료로 만나보세요.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-4">
                 <input 
                  type="email" 
                  required 
                  placeholder="이메일 주소 입력" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-blue-600 outline-none transition-all" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                 <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all">뉴스레터 무료 구독하기 →</button>
              </form>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Coming Soon: Google One-tap Login</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes message-fade {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        .animate-heart-pop { animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-spin-reverse { animation: spin-reverse linear infinite; }
        .animate-message-fade { animation: message-fade 3.5s ease-in-out infinite; }
        .animate-loading-bar { animation: loading-bar 4s ease-in-out infinite; }

        .summary-content h3 {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .summary-content p {
          margin-bottom: 1rem;
          line-height: 1.8;
        }
        .summary-content p:last-child {
          margin-bottom: 0;
        }
      ` }} />
    </div>
  );
}
