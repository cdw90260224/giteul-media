const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanContent(postId) {
  const { data: post } = await supabase.from('posts').select('content').eq('id', postId).single();
  if (!post) { console.error('Not found'); return; }

  console.log('=== 전체 content ===');
  console.log(post.content);
  console.log('\n\n=== 줄 단위 분석 ===');
  const lines = post.content.split('\n');
  lines.forEach((l, i) => console.log(`${i}: [${l}]`));
}

cleanContent(212);
