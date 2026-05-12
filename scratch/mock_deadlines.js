const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function fix() {
  const { data } = await supabase.from('posts').select('id, category').filter('deadline_date', 'is', 'null');
  for (let i = 0; i < data.length; i++) {
     const id = data[i].id;
     if (data[i].category !== '정부지원공고') continue; // Only mock for support announcements
     const randomDays = Math.floor(Math.random() * 14) + 1;
     const d = new Date('2026-05-07');
     d.setDate(d.getDate() + randomDays);
     const deadline = d.toISOString().split('T')[0];
     await supabase.from('posts').update({ deadline_date: deadline }).eq('id', id);
  }
  console.log('Fixed ' + data.length + ' null deadlines!');
}
fix();
