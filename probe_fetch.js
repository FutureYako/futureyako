const http = require('http');
const url = process.argv[2] || 'http://127.0.0.1:3001/link-details?types=bank';
http.get(url, (res) => {
  console.log('STATUS', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('LENGTH', data.length);
    console.log('HEAD', data.slice(0, 300));
  });
}).on('error', (e) => {
  console.error('ERR', e.message);
});
