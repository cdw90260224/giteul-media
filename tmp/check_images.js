const { createClient } = require('@supabase/supabase-js');

async function checkLatestPosts() {
  const supabase = createClient(
    'https://fvvmgrtkgblwmulowuki.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
  );

  const { data, error } = await supabase
    .from('posts')
    .select('title, image_url')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log('--- Database Check for image_url ---');
  data.forEach(post => {
    console.log(`Title: ${post.title}`);
    console.log(`Image URL: ${post.image_url}`);
    console.log('---');
  });
}

checkLatestPosts();
