
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

async function forceResetImages() {
  console.log('Force resetting all image URLs to highly reliable sources...');
  
  const { data: posts, error } = await supabase.from('posts').select('id, title, category');
  if (error) return;

  // 광범위하게 검증된 고화질 이미지 셋
  const businessImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  ];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const imgUrl = businessImages[i % businessImages.length] + `&random=${post.id}`;
    
    await supabase.from('posts').update({ image_url: imgUrl }).eq('id', post.id);
    console.log(`Updated [${post.id}]: ${post.title}`);
  }
  
  console.log('Database Update Complete.');
}

forceResetImages();
