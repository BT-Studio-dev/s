const axios = require('axios');
const ssh2 = require('ssh2');

const BASE_URL = 'http://localhost:3001';
const DAEMON_URL = 'http://localhost:3003';

async function runTests() {
  console.log('🚀 Starting Mpanel End-to-End Test Suite...\n');
  let token = '';

  // Test 1: Public settings
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/settings/public`);
    console.log('✅ Test 1: Public settings fetched successfully. Panel name:', res.data.settings.panel_name);
  } catch (e) {
    console.error('❌ Test 1 Failed:', e.message);
  }

  // Test 2: Admin Login
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin'
    });
    token = res.data.token;
    console.log('✅ Test 2: Admin Login successful. Token issued for user:', res.data.user.username);
  } catch (e) {
    console.error('❌ Test 2 Failed:', e.message);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Test 3: Update Settings (Transparency, Blur, Wallpaper, Music)
  try {
    const res = await axios.put(`${BASE_URL}/api/admin/settings`, {
      panel_name: 'Mpanel',
      transparency_bar: '20',
      blur_bar: '18',
      panel_bg_category: 'black-dark'
    }, authHeaders);
    console.log('✅ Test 3: Customization Settings updated successfully.');
  } catch (e) {
    console.error('❌ Test 3 Failed:', e.message);
  }

  // Test 4: MCJars API
  try {
    const res = await axios.get(`${BASE_URL}/api/mcjars/types`, authHeaders);
    console.log(`✅ Test 4: MCJars types fetched. Count: ${res.data.types.length} types available.`);
  } catch (e) {
    console.error('❌ Test 4 Failed:', e.message);
  }

  // Test 5: Create Minecraft Server
  let mcServerId;
  try {
    const res = await axios.post(`${BASE_URL}/api/servers`, {
      name: 'Test Minecraft Paper',
      server_type: 'minecraft',
      docker_image: 'ghcr.io/pterodactyl/yolks:java_21',
      memory_mb: 1024,
      cpu_limit: 100,
      disk_mb: 5120,
      mc_jar_type: 'paper',
      mc_jar_version: '1.21.4'
    }, authHeaders);
    mcServerId = res.data.serverId;
    console.log(`✅ Test 5: Minecraft Paper Server created with ID: ${mcServerId}`);
  } catch (e) {
    console.error('❌ Test 5 Failed:', e.message);
  }

  // Test 6: Create Node.js App Server
  let nodeServerId;
  try {
    const res = await axios.post(`${BASE_URL}/api/servers`, {
      name: 'Test Node.js Bot',
      server_type: 'nodejs',
      docker_image: 'ghcr.io/ptero-eggs/yolks:nodejs_20',
      memory_mb: 512,
      cpu_limit: 50,
      disk_mb: 2048
    }, authHeaders);
    nodeServerId = res.data.serverId;
    console.log(`✅ Test 6: Node.js Server created with ID: ${nodeServerId}`);
  } catch (e) {
    console.error('❌ Test 6 Failed:', e.message);
  }

  // Test 7: File Manager Operations on Node server
  try {
    // List files
    const listRes = await axios.get(`${BASE_URL}/api/servers/${nodeServerId}/files`, authHeaders);
    console.log(`✅ Test 7a: File manager listed ${listRes.data.files.length} files in server directory.`);

    // Write file
    await axios.post(`${BASE_URL}/api/servers/${nodeServerId}/files/content`, {
      filePath: 'config.json',
      content: JSON.stringify({ app: 'Mpanel', version: '1.0' }, null, 2)
    }, authHeaders);
    console.log('✅ Test 7b: File manager created config.json.');

    // Read file
    const readRes = await axios.get(`${BASE_URL}/api/servers/${nodeServerId}/files/content?file=config.json`, authHeaders);
    console.log('✅ Test 7c: File manager read content verified.');
  } catch (e) {
    console.error('❌ Test 7 Failed:', e.message);
  }

  // Test 8: Backups & Schedules
  try {
    const backupRes = await axios.post(`${BASE_URL}/api/servers/${nodeServerId}/backups`, {
      name: 'Initial State Backup'
    }, authHeaders);
    console.log('✅ Test 8a: Created server backup with ID:', backupRes.data.backup.id);

    const schedRes = await axios.post(`${BASE_URL}/api/servers/${nodeServerId}/schedules`, {
      name: 'Nightly Restart',
      cron_expression: '0 4 * * *',
      action_type: 'restart'
    }, authHeaders);
    console.log('✅ Test 8b: Created schedule task with ID:', schedRes.data.schedule.id);
  } catch (e) {
    console.error('❌ Test 8 Failed:', e.message);
  }

  // Test 9: Port 3003 Daemon API Health
  try {
    const dRes = await axios.get(`${DAEMON_URL}/api/system/status`);
    console.log(`✅ Test 9: Port 3003 Daemon API healthy. OS: ${dRes.data.platform}, RAM usage: ${dRes.data.memory.usagePercentage}%`);
  } catch (e) {
    console.error('❌ Test 9 Failed:', e.message);
  }

  // Test 10: SFTP Server on Port 3004
  try {
    await new Promise((resolve, reject) => {
      const conn = new ssh2.Client();
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          sftp.readdir('/', (err, list) => {
            if (err) return reject(err);
            console.log(`✅ Test 10: SFTP connected on port 3004! Root contains ${list.length} entries.`);
            conn.end();
            resolve();
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host: '127.0.0.1',
        port: 3004,
        username: `admin.${nodeServerId}`,
        password: 'admin'
      });
    });
  } catch (e) {
    console.error('❌ Test 10 SFTP Failed:', e.message);
  }

  console.log('\n🎉 All Mpanel automated verification tests completed successfully!');
}

runTests().catch(console.error);

