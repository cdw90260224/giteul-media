const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function migratePosts() {
  console.log('Starting migration to clean titles and extract deadlines...');
  
  const { data: posts, error } = await supabase.from('posts').select('*');
  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${posts.length} posts. Processing...`);

  for (const post of posts) {
    let newTitle = post.title;
    let newDeadline = post.deadline_date;

    // 1. Clean Title: Remove D-Day patterns like (D-14), [D-7], (D-Day)
    const cleanedTitle = post.title.replace(/\s*[\[\(]D-(?:Day|\d+)[\]\)]\s*/gi, ' ').trim();
    if (cleanedTitle !== post.title) {
        newTitle = cleanedTitle;
        console.log(`- Cleaned title: "${post.title}" -> "${newTitle}"`);
    }

    // 2. Extract Deadline if missing
    if (!newDeadline) {
        // Look for YYYY-MM-DD in content
        const dateMatch = post.content.match(/(\d{4})[-\.]\s*(\d{1,2})[-\.]\s*(\d{1,2})/);
        if (dateMatch) {
            const y = dateMatch[1];
            const m = dateMatch[2].padStart(2, '0');
            const d = dateMatch[3].padStart(2, '0');
            newDeadline = `${y}-${m}-${d}`;
            console.log(`  - Extracted deadline for "${newTitle}": ${newDeadline}`);
        }
    }

    // 3. Update if changed
    if (newTitle !== post.title || newDeadline !== post.deadline_date) {
        const { error: updateError } = await supabase
            .from('posts')
            .update({ title: newTitle, deadline_date: newDeadline })
            .eq('id', post.id);
            
        if (updateError) console.error(`  - Failed to update post ${post.id}:`, updateError);
    }
  }

  console.log('Migration completed.');
}

migratePosts();
