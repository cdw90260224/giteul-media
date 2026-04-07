
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function fixCategories() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Checking for categories that should be "AI/테크 트렌드"...');
  
  // Find all posts where category is "AI/테크" or similar
  const { data, error } = await supabase
    .from('posts')
    .select('id, category, title')
    .or('category.eq.AI/테크,category.eq.Tech,category.eq.AI');
  
  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }
  
  if (data.length === 0) {
    console.log('No articles found with "AI/테크", "Tech", or "AI" categories.');
  } else {
    console.log(`Found ${data.length} articles to update.`);
    for (const post of data) {
      console.log(`Updating "${post.title}": ${post.category} -> AI/테크 트렌드`);
      const { error: updateError } = await supabase
        .from('posts')
        .update({ category: 'AI/테크 트렌드' })
        .eq('id', post.id);
      if (updateError) console.error(`Error updating post ${post.id}:`, updateError);
    }
  }
}

fixCategories();
