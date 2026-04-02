'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ArticleDetail() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Logic
  useEffect(() => {
    async function fetchPost() {
      if (!params?.id) return;
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', params.id)
          .maybeSingle();
        
        if (!error && data) {
          setPost(data);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params?.id]);

  // Handle Deletion (Actual Database Call)
  const handleDelete = async () => {
    if (!confirm('이 기사를 데이터베이스에서 영구히 삭제하시겠습니까?')) return;
    
    try {
      // 1. Supabase Delete Call
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      if (error) {
        alert('삭제 실패: ' + error.message + '\n\n힌트: Supabase SQL Editor에서 ALTER TABLE posts DISABLE ROW LEVEL SECURITY; 를 실행해 보세요!');
      } else {
        alert('완벽하게 삭제되었습니다.');
        window.location.href = '/'; // Redirect to Home
      }
    } catch (e: any) {
      alert('삭제 도중 예상치 못한 오류 발생: ' + e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans text-xs font-bold text-slate-300 uppercase tracking-widest animate-pulse">Loading...</div>
  );

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100">
            <h1 className="text-xl font-black text-slate-900 mb-6">존재하지 않는 기사입니다.</h1>
            <Link href="/" className="bg-deep-navy text-white px-8 py-3 rounded-full font-bold text-xs ring-4 ring-slate-100 italic transition-transform hover:scale-105 active:scale-95 inline-block uppercase">Giteul Home</Link>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-deep-navy selection:text-white">
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-50 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-deep-navy tracking-tight italic">기틀</Link>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 tracking-tighter uppercase">
                <span className="text-deep-navy bg-blue-50 px-2 py-0.5 rounded-sm">{post.category || 'ANALYSIS'}</span>
                <span className="w-1 h-3 border-l border-slate-100"></span>
                <span>Ref. 00{post.id}</span>
            </div>
            <button 
                onClick={handleDelete}
                className="text-[10px] font-black text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg border border-red-100 transition-all active:scale-95"
            >
                DELETE REPORT
            </button>
          </div>
        </div>
      </nav>

      <header className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl md:text-5xl font-black text-[#0f172a] leading-[1.1] tracking-tighter">{post.title}</h1>
            <div className="py-8 border-l-8 border-deep-navy pl-8 bg-slate-50/50 rounded-r-3xl">
                <p className="text-xl text-slate-600 font-bold leading-relaxed italic opacity-80">{post.summary}</p>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mb-16">
        <div className="relative aspect-[21/9] w-full rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-white bg-slate-50 shadow-blue-900/5">
          <img 
            src={post.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'} 
            className="w-full h-full object-cover"
            alt="Hero"
            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'; }}
          />
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 pb-40">
        <div 
          className="prose prose-slate max-w-none 
          prose-headings:text-deep-navy prose-headings:font-black
          prose-h3:text-2xl prose-h3:mt-20 prose-h3:mb-8 prose-h3:tracking-tighter
          prose-p:text-[18px] prose-p:leading-[1.8] prose-p:text-slate-700 prose-p:mb-10
          prose-ul:my-10 prose-li:text-slate-700 prose-li:mb-4
          article-content"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
        
        <style jsx global>{`
          .article-content table {
            width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            margin: 60px 0 !important;
            font-size: 14px !important;
            background: white !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #f1f5f9 !important;
            overflow: hidden !important;
          }
          .article-content th {
            background-color: #f8fafc !important;
            border-bottom: 2px solid #f1f5f9 !important;
            padding: 20px !important;
            color: #002B5B !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
          }
          .article-content td {
            border-bottom: 1px solid #f8fafc !important;
            padding: 20px !important;
            color: #475569 !important;
          }
          .article-content tr:nth-child(even) { background-color: #fafbfc !important; }
          .article-content div[style*="background-color"] {
            border-radius: 24px !important;
            padding: 40px !important;
            border: 1px solid #e2e8f0 !important;
            border-left: 12px solid #002B5B !important;
            background: #f8fafc !important;
            margin: 40px 0 !important;
          }
        `}</style>
      </article>

      <footer className="w-full bg-slate-900 py-32 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-4xl font-black italic tracking-tighter">Giteul.</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">Precision-engineered B2B intelligence reporting for the modern era.</p>
            <Link href="/" className="inline-block border border-white/20 px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-deep-navy transition-all">Back to Portal</Link>
        </div>
      </footer>
    </div>
  );
}
