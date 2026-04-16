const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPosts() {
  const yesterday = new Date('2026-04-13T00:00:00Z').toISOString();
  
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, category, created_at')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${data.length} posts since yesterday:`);
  data.forEach(post => {
    console.log(`- [${post.created_at}] [${post.category}] ${post.title}`);
  });
}

checkPosts();
