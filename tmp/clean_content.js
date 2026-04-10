const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function cleanContent() {
  console.log('Cleaning D-Day text from article contents...');
  
  const { data: posts, error } = await supabase.from('posts').select('id, content');
  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  for (const post of posts) {
    // Remove (D-12), (D-Day), D-12, etc from content
    const cleanedContent = post.content.replace(/\s*[\[\(]D-(?:Day|\d+)[\]\)]\s*/gi, ' ').trim();
    // Also remove things like "| (D-12) |" in the header bar
    const finalContent = cleanedContent.replace(/\s*\|\s*\(D-\d+\)\s*\|/gi, ' |').replace(/\(D-Day\)/gi, '');

    if (finalContent !== post.content) {
        const { error: updateError } = await supabase
            .from('posts')
            .update({ content: finalContent })
            .eq('id', post.id);
            
        if (!updateError) console.log(`- Cleaned content for post ${post.id}`);
    }
  }

  console.log('Content cleaning completed.');
}

cleanContent();
