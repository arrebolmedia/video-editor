const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'data.arrebolweddings.com',
  port: 443,
  path: '/editor-api/sync/baserow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  rejectUnauthorized: false
};

console.log('Sincronizando proyectos en producción...');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
