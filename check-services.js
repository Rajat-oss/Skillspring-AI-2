
const http = require('http');

const checkService = (host, port, path = '/') => {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${host}:${port}${path} - Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${host}:${port}${path} - Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${host}:${port}${path} - Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

async function checkServices() {
  console.log('🔍 Checking services...\n');
  
  console.log('Backend Services:');
  await checkService('0.0.0.0', 8000, '/');
  await checkService('0.0.0.0', 8000, '/health');
  await checkService('localhost', 8000, '/');
  await checkService('127.0.0.1', 8000, '/');
  
  console.log('\nFrontend Services:');
  await checkService('localhost', 3000, '/');
  
  console.log('\n✨ Health check complete!');
}

checkServices();
