'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleDetailClient({ id }: { id: string }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
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

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleCopyAnalysis = () => {
    const text = `📌 [기틀 미디어 전략 리포트]\n\n제목: ${post.title}\n🔍 핵심 요약: ${post.summary}\n💡 상세 전략 분석: ${shareUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('이 기사를 데이터베이스에서 영구 삭제할까요?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) window.location.href = '/';
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Giteul Intelligence...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Post not found.</div>;

  const isGovSupport = post.category === '정부지원공고';
  const isStrategyPost = post.title.includes('[전략]');

  const getDDay = () => {
    if (!post.deadline_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(post.deadline_date);
    deadline.setHours(0, 0, 0, 0);
    const diff = deadline.getTime() - today.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return { label: 'D-DAY', color: 'bg-red-600' };
    if (days < 0) return { label: '마감완료', color: 'bg-slate-400' };
    if (days <= 7) return { label: `D-${days}`, color: 'bg-orange-500' };
    return { label: `D-${days}`, color: 'bg-blue-600' };
  };

  const dDay = getDDay();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      <nav className="w-full bg-white/90 backdrop-blur-xl border-b border-slate-50 sticky top-0 z-50 py-4 px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link href="/" className="text-3xl font-black text-deep-navy tracking-tighter italic">기틀.</Link>
          <div className="flex items-center gap-6">
            <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-[13px] font-black uppercase tracking-widest border border-blue-100 italic">{post.category}</span>
            <button onClick={handleDelete} className="text-red-400 font-bold text-xs uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Delete</button>
          </div>
        </div>
      </nav>

      <header className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="space-y-8">
            {dDay && (
              <div className="flex items-center gap-3 animate-bounce-subtle">
                <span className={`${dDay.color} text-white px-4 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-lg`}>
                  {dDay.label}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">실시간 마감 임박 알림</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-[#0f172a] leading-[1.2] tracking-tighter italic">
                {post.title}
            </h1>
            
            <div className="relative mt-12 p-8 md:p-12 bg-slate-50/80 rounded-[2.5rem] border-2 border-slate-100 overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <span className="text-8xl font-black italic">SUMMARY</span>
                </div>
                <div className="relative z-10 space-y-4">
                  <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Executive Briefing</span>
                  <p className="text-xl md:text-2xl text-slate-700 font-bold leading-relaxed tracking-tight italic">
                      {post.summary}
                  </p>
                </div>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mb-32">
        <div className="relative aspect-[21/9] w-full rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-[16px] border-white ring-1 ring-slate-100 bg-slate-50">
          <img src={post.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000" alt="Hero" onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }} />
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pb-60">
        <div className="max-w-none article-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({node, ...props}) => {
                return (
                  <h2 className="group flex items-center gap-4 text-3xl font-black text-slate-900 mt-20 mb-8 pt-12 border-t border-slate-100 italic" {...props}>
                    <span className="text-blue-600 opacity-20 group-hover:opacity-100 transition-opacity font-serif">/</span>
                    {props.children}
                  </h2>
                );
              },
              h3: ({node, ...props}) => (
                <h3 className="text-xl font-extrabold text-[#002B5B] mt-12 mb-6 flex items-center gap-3" {...props}>
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  {props.children}
                </h3>
              ),
              p: ({node, ...props}) => (
                <p className="text-[1.25rem] leading-[1.9] text-slate-600 mb-8 font-medium tracking-tight" {...props} />
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
                <div className="my-16 p-12 bg-slate-50 rounded-[3rem] border-l-[12px] border-[#002B5B] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-6xl font-black text-slate-100 select-none italic uppercase">Insight</div>
                  <div className="relative z-10 italic text-2xl font-black text-[#002B5B] leading-relaxed">
                    {props.children}
                  </div>
                </div>
              )
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {isGovSupport && !isStrategyPost && (
            <div className="mt-24 p-12 bg-deep-navy rounded-[4rem] text-center space-y-10 shadow-2xl border-4 border-blue-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="space-y-4 relative z-10">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse italic">Professional Insight Upgrade</span>
                    <h4 className="text-white text-3xl font-black tracking-tighter leading-tight">이 공고의 '사업계획서 실전 전략' 정보가 아직 부족한가요?</h4>
                    <p className="text-white/60 text-xl font-medium italic">이미 탑재된 제미나이 2.5 엔진으로 실시간 전략 분석을 시작합니다.</p>
                </div>
                <button 
                  onClick={handleUpgradeStrategy}
                  disabled={upgrading}
                  className={`inline-block px-12 py-7 rounded-2xl font-black text-xl tracking-widest transition-all shadow-2xl relative z-10
                    ${upgrading ? 'bg-slate-700 text-white animate-pulse cursor-wait' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95'}`}
                >
                    {upgrading ? '🚀 제미나이가 전략 리포트로 전면 개편 중...' : '[이 사업의 \'실시간 전략 리포트\' 생성하기 →]'}
                </button>
            </div>
        )}

        <div className="mt-32 pt-20 border-t-2 border-slate-100 flex flex-col items-center gap-12 bg-slate-50 py-20 rounded-[4rem]">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">합격을 부르는 인사이트를 공유하세요.</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <button onClick={handleCopyAnalysis} className={`flex items-center gap-4 px-12 py-6 rounded-2xl font-black text-[15px] tracking-widest transition-all shadow-xl ring-2 ${copied ? 'bg-green-500 text-white ring-green-200' : 'bg-white text-slate-800 ring-slate-100 hover:ring-blue-600'}`}>
                    {copied ? '✅ 복사 완료! 붙여넣으세요 ' : '🔍 전략 분석문 복사하기'}
                </button>
                <button onClick={handleLinkedInShare} className="flex items-center gap-4 bg-[#0077b5] text-white px-12 py-6 rounded-2xl font-black text-[15px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">LinkedIn 공유하기</button>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        ` }} />
      </article>

      <footer className="bg-slate-900 py-32 text-center text-white/10 uppercase italic">
          <Link href="/" className="inline-block border border-white/10 px-12 py-5 rounded-full text-xs font-black tracking-[0.4em] hover:bg-white hover:text-deep-navy transition-all text-white/50">Back to Portal Home</Link>
      </footer>
    </div>
  );
}
