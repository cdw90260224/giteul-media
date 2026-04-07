async function trigger() {
  try {
    const response = await fetch('http://localhost:3000/api/auto-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCategory: 'all' })
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Trigger failed:', e);
  }
}

trigger();
