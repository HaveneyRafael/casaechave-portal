const fs = require('fs');
const content = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = content.match(/SUPABASE_URL\s*=\s*'([^']+)'/);
const keyMatch = content.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/);
console.log('URL:', urlMatch ? urlMatch[1] : 'not found');
console.log('KEY:', keyMatch ? keyMatch[1].substring(0,10) + '...' : 'not found');

fetch(urlMatch[1] + '/rest/v1/imoveis?select=*&status=neq.Pausado&limit=1', {
  headers: {
    'apikey': keyMatch[1],
    'Authorization': 'Bearer ' + keyMatch[1]
  }
}).then(res => res.json()).then(data => console.log('Data:', data)).catch(err => console.error('Error:', err));
