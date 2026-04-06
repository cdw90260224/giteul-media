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
        const { data, error } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle();
        if (!error && data) {
          setPost(data);
          const { data: relatedData } = await supabase.from('posts').select('*').neq('id', data.id).eq('category', data.category).limit(3);
          if (relatedData) setRelatedPosts(relatedData);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchPostData();
  }, [params?.id]);

  const handleDelete = async () => {
    if (!confirm('이 기사를 영구히 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) window.location.href = '/';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-slate-200">Loading Report...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Post missing.</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      {/* Navigation */}
      <nav className="w-full bg-white/90 backdrop-blur-xl border-b border-slate-50 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-deep-navy tracking-tighter italic">기틀.</Link>
          <div className="flex items-center gap-6">
            <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest">{post.category}</span>
            <button onClick={handleDelete} className="text-red-400 font-bold text-xs uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">Delete</button>
          </div>
        </div>
      </nav>

      {/* Title Section (10 style) */}
      <header className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-[42px] font-black text-[#0f172a] leading-[1.2] tracking-tighter">
                {post.title}
            </h1>
            <div className="py-8 border-l-[4px] border-[#0F172A] pl-8">
                <p className="text-lg md:text-xl text-slate-500 font-semibold leading-relaxed tracking-tight">
                    {post.summary}
                </p>
            </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <div className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-100 bg-slate-50">
          <img 
            src={post.image_url} 
            className="w-full h-full object-cover" 
            alt="Hero" 
            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200'; }}
          />
        </div>
      </div>

      {/* Article Content (10 style: Frameless AI INSIGHT) */}
      <article className="max-w-4xl mx-auto px-6 pb-40">
        <div 
          className="prose prose-slate max-w-none article-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .article-content h2 {
            font-size: 2.2rem !important; margin-top: 100px !important; margin-bottom: 40px !important;
            color: #0f172a !important; border-top: 1.5px solid #F1F5F9 !important; padding-top: 50px !important;
            font-weight: 1000 !important; letter-spacing: -0.03em !important;
          }
          .article-content h3 {
            font-size: 1.6rem !important; margin-top: 60px !important; margin-bottom: 24px !important;
            color: #1e293b !important; font-weight: 900 !important;
          }
          .article-content p {
            font-size: 1.15rem !important; line-height: 1.95 !important; color: #334155 !important;
            margin-bottom: 35px !important;
          }
          .article-content strong { color: #002B5B !important; font-weight: 900 !important; }

          /* [AI INSIGHT RE-MAP - 10번 프레임리스 스타일] */
          .article-content .summary-box {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin: 80px 0 !important;
            position: relative !important;
          }
          
          /* 10번 스타일 헤더 보정 (Rocket Emoji 등) */
          .article-content .summary-box h2,
          .article-content .summary-box h3 {
            font-size: 2rem !important;
            color: #0F172A !important;
            border-top: 1px solid #F1F5F9 !important;
            border-bottom: none !important;
            padding-top: 40px !important;
            padding-bottom: 0 !important;
            margin-bottom: 30px !important;
            letter-spacing: -0.03em !important;
          }

          /* CTA 버튼 (그린 솔리드 스타일) */
          .article-content .cta-button {
            display: flex !important; width: fit-content !important; min-width: 280px !important;
            margin: 100px auto 40px auto !important; justify-content: center !important;
            background: #22C55E !important; color: white !important;
            padding: 22px 40px !important; border-radius: 12px !important;
            font-size: 14px !important; font-weight: 900 !important;
            text-transform: uppercase !important; letter-spacing: 0.15em !important;
            text-decoration: none !important; transition: all 0.3s ease !important;
            box-shadow: 0 20px 40px -10px rgba(34, 197, 94, 0.4) !important;
          }
          .article-content .cta-button:hover { 
            transform: translateY(-5px) !important;
            filter: brightness(1.1) !important;
          }

          .body-logo { display: block !important; max-width: 250px !important; margin: 80px auto !important; }
        ` }} />
      </article>

      {/* Footer */}
      <footer className="w-full bg-slate-900 py-32 text-white text-center">
          <h2 className="text-4xl font-black italic tracking-tighter mb-8">Giteul Media.</h2>
          <Link href="/" className="inline-block border border-white/20 px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-deep-navy transition-all">Back to Portal</Link>
      </footer>
    </div>
  );
}
