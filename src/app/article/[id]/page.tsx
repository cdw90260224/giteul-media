'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ArticleDetail() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPostData() {
      if (!params?.id) return;
      try {
        // 1. 메인 기사 데이터 로드
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', params.id)
          .maybeSingle();
        
        if (!error && data) {
          setPost(data);
          
          // 2. 관련 기사 추천 로드 (카테고리 매칭 3개)
          const { data: relatedData } = await supabase
            .from('posts')
            .select('*')
            .neq('id', data.id)
            .eq('category', data.category)
            .limit(3);
          
          if (relatedData) setRelatedPosts(relatedData);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPostData();
  }, [params?.id]);

  // Handle Deletion (Actual Database Call)
  const handleDelete = async () => {
    if (!confirm('이 기사를 데이터베이스에서 영구히 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) {
        alert('삭제 실패: ' + error.message);
      } else {
        alert('완벽하게 삭제되었습니다.');
        window.location.href = '/'; 
      }
    } catch (e: any) {
      alert('삭제 도중 오류 발생');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        System Loading...
    </div>
  );

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-2xl border border-slate-100 max-w-md mx-6">
            <h1 className="text-2xl font-black text-deep-navy mb-4 tracking-tighter">Report Missing.</h1>
            <p className="text-slate-400 text-sm mb-10 font-medium leading-relaxed uppercase tracking-tight">기사가 삭제되었거나 잘못된 경로입니다.</p>
            <Link href="/" className="bg-deep-navy text-white px-10 py-4 rounded-full font-black text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-transform inline-block uppercase italic">Back to Portal</Link>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Article Header (Navigation) */}
      <nav className="w-full bg-white/90 backdrop-blur-xl border-b border-slate-50 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-deep-navy tracking-tighter italic">기틀.</Link>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-3 text-slate-300">
                <span className="text-deep-navy bg-blue-50 px-2 py-0.5 rounded-sm">{post.category || 'ANALYSIS'}</span>
                <span className="w-0.5 h-3 bg-slate-100"></span>
                <span>ID: {post.id}</span>
            </div>
            <button onClick={handleDelete} className="text-red-400 hover:text-red-600 transition-colors">DELETE</button>
          </div>
        </div>
      </nav>

      {/* Main Title Section */}
      <header className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '2026.04.02'}</span>
                <span className="h-[1px] w-12 bg-slate-100"></span>
                <span className="text-[10px] font-black text-deep-navy uppercase tracking-widest">Intelligence Report</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#0f172a] leading-[1.05] tracking-tighter">
                {post.title}
            </h1>
            <div className="py-10 border-l-[12px] border-deep-navy pl-10 bg-slate-50 shadow-inner rounded-r-[40px]">
                <p className="text-xl md:text-2xl text-slate-600 font-bold leading-relaxed italic opacity-90 tracking-tight">
                    {post.summary}
                </p>
            </div>
        </div>
      </header>

      {/* Hero Image Section */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <div className="relative aspect-[21/9] w-full rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,43,91,0.15)] border-[16px] border-white bg-slate-50">
          <img 
            src={post.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'} 
            className="w-full h-full object-cover"
            alt="Hero"
            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <article className="max-w-4xl mx-auto px-6 pb-40">
        <div 
          className="prose prose-slate max-w-none 
          prose-headings:text-deep-navy prose-headings:font-black
          prose-h3:text-3xl prose-h3:mt-24 prose-h3:mb-10 prose-h3:tracking-tighter
          prose-p:text-[20px] prose-p:leading-[1.9] prose-p:text-slate-800 prose-p:mb-12 prose-p:tracking-tight
          prose-ul:my-12 prose-li:text-slate-800 prose-li:mb-5 prose-li:text-lg
          article-content"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .article-content table {
            width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important;
            margin: 80px 0 !important; font-size: 15px !important; background: white !important;
            border-radius: 24px !important; box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.08) !important;
            border: 2px solid #f1f5f9 !important; overflow: hidden !important;
          }
          .article-content th {
            background-color: #f8fafc !important; border-bottom: 2px solid #f1f5f9 !important;
            padding: 24px !important; color: #002B5B !important; font-weight: 900 !important;
            text-transform: uppercase !important; letter-spacing: 0.12em !important;
            text-align: left !important; font-size: 13px !important;
          }
          .article-content td {
            border-bottom: 1px solid #f8fafc !important; padding: 24px !important;
            color: #334155 !important; font-weight: 600 !important; line-height: 1.6 !important;
          }
          .article-content .summary-box {
            border-radius: 32px !important; padding: 40px 50px !important;
            border: 2px solid #e2e8f0 !important; border-left: 18px solid #002B5B !important;
            background: #fcfdfe !important; margin: 60px 0 !important;
            box-shadow: 0 25px 50px -12px rgba(0, 43, 91, 0.04) !important; position: relative !important;
          }
          .article-content .summary-box::before {
            content: "💡 AI INSIGHT RE-MAP"; position: absolute; top: -15px; left: 30px;
            background: #002B5B; color: white; font-size: 10px; font-weight: 900;
            padding: 4px 15px; border-radius: 5px; letter-spacing: 0.1em;
          }
          .article-content .summary-box li {
              font-size: 1.1rem !important; font-weight: 700 !important;
              color: #002B5B !important; margin-bottom: 15px !important;
          }
        ` }} />
      </article>

      {/* Recommended Reports (AI Based) - MSN Style */}
      <section className="bg-slate-50 py-32 border-t border-slate-100 italic">
        <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col gap-2 mb-16 border-l-4 border-deep-navy pl-8">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Recommended Reports.</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">AI가 실시간 매칭한 유사 지원사업 인텔리전스</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {relatedPosts.map((rPost: any) => (
                    <Link href={`/article/${rPost.id}`} key={rPost.id} className="group flex flex-col bg-white rounded-[40px] p-6 shadow-sm hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.1)] transition-all border border-slate-100 hover:border-white">
                        <div className="aspect-[16/10] rounded-[30px] overflow-hidden mb-6 border-2 border-slate-50">
                            <img 
                                src={rPost.image_url} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt="thumb"
                                onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                            />
                        </div>
                        <div className="space-y-4 px-2">
                            <span className="text-[9px] font-black text-deep-navy bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{rPost.category}</span>
                            <h4 className="font-extrabold text-slate-800 text-lg leading-snug line-clamp-2 group-hover:text-deep-navy transition-colors tracking-tight">{rPost.title}</h4>
                            <div className="pt-4 border-t border-slate-50 text-[10px] text-slate-300 font-bold uppercase tracking-widest flex justify-between items-center">
                                <span>기틀 리포터</span>
                                <span>{new Date(rPost.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Link>
                ))}
                {relatedPosts.length === 0 && (
                  <div className="col-span-3 text-center py-20 bg-white rounded-3xl opacity-30 italic font-medium text-slate-400 border-2 border-dashed border-slate-100">유사한 분석 리포트가 아직 준비되지 않았습니다.</div>
                )}
            </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="w-full bg-slate-900 py-32 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-4xl font-black italic tracking-tighter">Giteul.</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">Data-driven business media for entrepreneurs.</p>
            <Link href="/" className="inline-block border border-white/20 px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-deep-navy transition-all">Back to Portal</Link>
        </div>
      </footer>
    </div>
  );
}
