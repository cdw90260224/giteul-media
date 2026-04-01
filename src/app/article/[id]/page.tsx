import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch article data from Supabase
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    console.error('Error fetching post:', error);
    return notFound();
  }
  
  return (
    <main className="flex-1 flex flex-col bg-ivory font-sans">
      {/* Newspaper Header Mini */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-black text-deep-navy tracking-tight shadow-none">기틀</h1>
          </Link>
        </div>
      </header>

      <article className="w-full max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12 border-b-[1px] border-border-line pb-8">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-deep-navy font-bold font-sans text-sm tracking-widest uppercase border-[1px] border-border-line px-3 py-1">
              {post.category || '기사'}
            </span>
            <span className="text-border-line/70 font-semibold font-sans text-xs tracking-wider uppercase">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-[1.25] tracking-tight text-gray-900 font-sans">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-normal font-sans">
            {post.summary}
          </p>
        </div>

        {/* Thumbnail Image */}
        {post.image_url && (
          <div className="w-full aspect-video mb-12 rounded-xl overflow-hidden">
             <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg prose-neutral max-w-none font-sans leading-[1.8] text-gray-800">
           {/* Assuming 'content' or 'body' field exists in Supabase. Using summary as fallback */}
           <div dangerouslySetInnerHTML={{ __html: post.content || post.summary }} />
        </div>
      </article>
      
      <footer className="w-full border-t-[1px] border-border-line mt-auto pt-8 pb-16 text-center text-xs font-bold font-sans text-deep-navy">
        <p className="tracking-[0.2em]">&copy; 2026 GITEUL DATA MEDIA. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
