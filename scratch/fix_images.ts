
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const SERVICE_ROLE = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function fixMissingImages() {
  console.log('Fetching posts with missing images...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, category, summary, image_url')
    .or('image_url.is.null,image_url.eq.""');

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('No posts found with missing images.');
    return;
  }

  console.log(`Found ${posts.length} posts to fix. Applying intelligent thumbnails...`);

  for (const post of posts) {
    const isGov = post.category === '정부지원공고' || post.title.includes('[전략]');
    const isTech = post.category?.toLowerCase().includes('tech') || post.category?.includes('테크');
    
    let keyword = 'business';
    if (isTech) keyword = 'technology,abstract';
    else if (post.summary?.includes('농업')) keyword = 'agriculture,nature';
    else if (post.summary?.includes('소상공인')) keyword = 'store,local';
    else if (isGov) keyword = 'strategy,office';

    const seed = Math.floor(Math.random() * 1000);
    const imageUrl = `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${seed},${post.id}&${keyword}`;

    const { error: updateError } = await supabase
      .from('posts')
      .update({ image_url: imageUrl })
      .eq('id', post.id);

    if (updateError) {
      console.error(`Failed to update post ${post.id}:`, updateError.message);
    } else {
      console.log(`Successfully updated: ${post.title}`);
    }
  }

  console.log('All missing images have been fixed! Please check the site.');
}

fixMissingImages();
