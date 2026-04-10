const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function deleteTodayPosts() {
  console.log('Searching for posts created on 2026-04-09...');
  
  // Get start and end of the day in ISO string (using UTC safely for the check)
  // Since created_at is usually TIMESTAMPTZ
  const startOfDay = '2026-04-09T00:00:00Z';
  const endOfDay = '2026-04-09T23:59:59Z';

  // First, count them
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, created_at')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (fetchError) {
    console.error('Error fetching posts:', fetchError);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('No posts found created today.');
    return;
  }

  console.log(`Found ${posts.length} posts created today:`);
  posts.forEach(p => console.log(`- [${p.created_at}] ${p.title}`));

  // Delete them
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (deleteError) {
    console.error('Error deleting posts:', deleteError);
  } else {
    console.log('Successfully deleted all posts created today.');
  }
}

deleteTodayPosts();
