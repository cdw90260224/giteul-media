
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSectors() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('summary, category, title');

  if (error) return console.error(error);

  const stats = {};
  posts.forEach(p => {
    const match = p.summary?.match(/^\[(.*?)\]/);
    const sector = match ? match[1] : '분류 미정';
    stats[sector] = (stats[sector] || 0) + 1;
  });

  console.log('📊 현재 분야별 기사 분포 현황:');
  console.log(JSON.stringify(stats, null, 2));
}

checkSectors();
