<?php
/**
 * Mpanel - Standalone Full-Page Server Deployment Application
 * File: deploy.php
 * 
 * Provides a dedicated, full-page interface for deploying game servers,
 * Node.js applications, Python bots, PHP projects, and LumenVM VPS instances.
 * Connects directly to Mpanel's REST API.
 */

session_start();

// --- Configuration & Default Settings ---
$defaultMpanelUrl = getenv('MPANEL_URL') ?: 'http://localhost:3003';
$defaultApiKey = getenv('MPANEL_API_KEY') ?: '';

if (!isset($_SESSION['mpanel_url'])) {
    $_SESSION['mpanel_url'] = $defaultMpanelUrl;
}
if (!isset($_SESSION['mpanel_token']) && $defaultApiKey) {
    $_SESSION['mpanel_token'] = $defaultApiKey;
}

// Generate CSRF Token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Helper: Make cURL Request to Mpanel API
function callMpanelApi($endpoint, $method = 'GET', $data = null, $token = null, $baseUrl = null) {
    if (!$baseUrl) {
        $baseUrl = $_SESSION['mpanel_url'] ?? 'http://localhost:3003';
    }
    $url = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    if ($data !== null) {
        $jsonData = is_string($data) ? $data : json_encode($data);
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    
    if ($curlErr) {
        return ['success' => false, 'error' => 'Connection failed: ' . $curlErr];
    }
    
    $decoded = json_decode($response, true);
    if ($decoded === null && $httpCode >= 400) {
        return ['success' => false, 'error' => "HTTP $httpCode: Server error or invalid response."];
    }
    
    return $decoded ?: ['success' => false, 'error' => 'Empty or invalid JSON response'];
}

$notice = null;
$error = null;
$createdServer = null;

// --- Handle Authentication Actions ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // Validate CSRF
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $error = 'Invalid security token (CSRF). Please refresh and try again.';
    } elseif ($_POST['action'] === 'set_config') {
        $url = trim($_POST['mpanel_url'] ?? '');
        $token = trim($_POST['mpanel_token'] ?? '');
        if ($url) $_SESSION['mpanel_url'] = rtrim($url, '/');
        if ($token) $_SESSION['mpanel_token'] = $token;
        
        // Test connection
        $test = callMpanelApi('/api/admin/settings/public', 'GET', null, null, $_SESSION['mpanel_url']);
        if (isset($test['success']) && $test['success']) {
            $notice = 'Successfully connected to Mpanel: ' . htmlspecialchars($test['settings']['panel_name'] ?? 'Mpanel');
        } else {
            $error = 'Connection test failed: ' . htmlspecialchars($test['error'] ?? 'Could not connect to Mpanel at ' . $url);
        }
    } elseif ($_POST['action'] === 'login') {
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');
        $url = trim($_POST['mpanel_url'] ?? $_SESSION['mpanel_url']);
        if ($url) $_SESSION['mpanel_url'] = rtrim($url, '/');
        
        $loginRes = callMpanelApi('/api/auth/login', 'POST', [
            'username' => $username,
            'password' => $password
        ], null, $_SESSION['mpanel_url']);
        
        if (!empty($loginRes['success']) && !empty($loginRes['token'])) {
            $_SESSION['mpanel_token'] = $loginRes['token'];
            $_SESSION['mpanel_user'] = $loginRes['user'] ?? null;
            $notice = 'Signed in successfully as ' . htmlspecialchars($loginRes['user']['username'] ?? 'Admin');
        } else {
            $error = 'Sign in failed: ' . htmlspecialchars($loginRes['error'] ?? 'Invalid credentials.');
        }
    } elseif ($_POST['action'] === 'logout') {
        unset($_SESSION['mpanel_token']);
        unset($_SESSION['mpanel_user']);
        $notice = 'Disconnected from Mpanel session.';
    } elseif ($_POST['action'] === 'deploy_server') {
        // --- Process Server Deployment ---
        $authToken = $_SESSION['mpanel_token'] ?? null;
        if (!$authToken) {
            $error = 'Authentication token is required to deploy a server.';
        } else {
            $srvName = trim($_POST['name'] ?? '');
            $srvType = trim($_POST['server_type'] ?? 'minecraft');
            $srvDesc = trim($_POST['description'] ?? '');
            
            $ramVal = intval($_POST['memory_val'] ?? 2048);
            $ramUnit = $_POST['memory_unit'] ?? 'MB';
            $memoryMb = ($ramUnit === 'GB') ? ($ramVal * 1024) : $ramVal;
            
            $cpuLimit = intval($_POST['cpu_limit'] ?? 100);
            
            $diskVal = intval($_POST['disk_val'] ?? 10);
            $diskUnit = $_POST['disk_unit'] ?? 'GB';
            $diskMb = ($diskUnit === 'GB') ? ($diskVal * 1024) : $diskVal;
            
            $userId = !empty($_POST['user_id']) ? intval($_POST['user_id']) : null;
            $nodeId = !empty($_POST['node_id']) ? intval($_POST['node_id']) : 1;
            $allocId = !empty($_POST['allocation_id']) ? intval($_POST['allocation_id']) : null;
            
            $dockerImage = trim($_POST['docker_image'] ?? '');
            $startupCmd = trim($_POST['startup_cmd'] ?? '');
            
            // Engine specific options
            $mcJarType = trim($_POST['mc_jar_type'] ?? '');
            $mcJarVersion = trim($_POST['mc_jar_version'] ?? '');
            
            // Environment Variables JSON
            $envVars = [];
            if (!empty($_POST['env_keys']) && is_array($_POST['env_keys'])) {
                foreach ($_POST['env_keys'] as $idx => $key) {
                    $key = trim($key);
                    $val = trim($_POST['env_vals'][$idx] ?? '');
                    if ($key !== '') {
                        $envVars[$key] = $val;
                    }
                }
            }
            
            // LumenVM specialized environment variables
            if ($srvType === 'lumenvm' || $srvType === 'nokvm') {
                $isNokvm = ($srvType === 'nokvm') || (!empty($_POST['vm_nokvm']) && $_POST['vm_nokvm'] === '1');
                $envVars['OS_HOSTNAME'] = trim($_POST['vm_hostname'] ?? 'lumenvm');
                $envVars['OS_PASSWORD'] = trim($_POST['vm_password'] ?? 'admin');
                $envVars['DISPLAY_MODE'] = trim($_POST['vm_display_mode'] ?? 'ssh');
                $envVars['KVM'] = $isNokvm ? 'off' : 'on';
                $envVars['NOKVM'] = $isNokvm ? '1' : '0';
            }
            
            $payload = [
                'name' => $srvName,
                'description' => $srvDesc,
                'server_type' => $srvType,
                'memory_mb' => $memoryMb,
                'cpu_limit' => $cpuLimit,
                'disk_mb' => $diskMb,
                'node_id' => $nodeId,
                'allocation_id' => $allocId,
                'user_id' => $userId,
                'docker_image' => $dockerImage ?: null,
                'startup_cmd' => $startupCmd ?: null,
                'env_vars' => $envVars,
                'mc_jar_type' => $mcJarType ?: null,
                'mc_jar_version' => $mcJarVersion ?: null
            ];
            
            $res = callMpanelApi('/api/servers', 'POST', $payload, $authToken);
            if (!empty($res['success'])) {
                $createdServer = [
                    'id' => $res['serverId'] ?? null,
                    'uuid' => $res['uuid'] ?? null,
                    'name' => $srvName,
                    'server_type' => $srvType,
                    'memory_mb' => $memoryMb,
                    'disk_mb' => $diskMb,
                    'cpu_limit' => $cpuLimit,
                    'console_url' => rtrim($_SESSION['mpanel_url'], '/') . '/#server-manage/' . ($res['serverId'] ?? '') . '/console'
                ];
                $notice = 'Server instance deployed successfully!';
            } else {
                $error = 'Deployment failed: ' . htmlspecialchars($res['error'] ?? 'Unknown error occurred.');
            }
        }
    }
}

// Fetch Remote Data (Users, Nodes, Allocations) if token exists
$authToken = $_SESSION['mpanel_token'] ?? null;
$usersList = [];
$nodesList = [];
$freeAllocations = [];
$publicSettings = [];

if ($authToken) {
    // 1. Fetch public settings
    $settingsRes = callMpanelApi('/api/admin/settings/public');
    if (!empty($settingsRes['settings'])) {
        $publicSettings = $settingsRes['settings'];
    }
    
    // 2. Fetch users list
    $uRes = callMpanelApi('/api/admin/users', 'GET', null, $authToken);
    if (!empty($uRes['users'])) {
        $usersList = $uRes['users'];
    }
    
    // 3. Fetch nodes & allocations
    $nRes = callMpanelApi('/api/admin/nodes', 'GET', null, $authToken);
    if (!empty($nRes['nodes'])) {
        $nodesList = $nRes['nodes'];
    }
    
    // 4. Fetch network allocations
    $netRes = callMpanelApi('/api/admin/network', 'GET', null, $authToken);
    if (!empty($netRes['allocations'])) {
        $freeAllocations = array_filter($netRes['allocations'], function($a) {
            return empty($a['assigned']) || $a['assigned'] == 0;
        });
    }
}

$panelName = $publicSettings['panel_name'] ?? 'Mpanel';
?>
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deploy New Server Instance &bull; <?= htmlspecialchars($panelName) ?></title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#ecfeff',
              400: '#22d3ee',
              500: '#06b6d4',
              600: '#0891b2',
              900: '#164e63'
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace']
          }
        }
      }
    }
  </script>
  
  <!-- Google Fonts & Lucide Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body {
      background: radial-gradient(circle at 10% 20%, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 1) 90%);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      color: #e2e8f0;
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-card:hover {
      border-color: rgba(6, 182, 212, 0.3);
    }
    .glass-input {
      background: rgba(2, 6, 23, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #f8fafc;
      transition: all 0.2s ease;
    }
    .glass-input:focus {
      outline: none;
      border-color: #06b6d4;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
    }
    .btn-cyber {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      color: #ffffff;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .btn-cyber:hover {
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.45);
      transform: translateY(-1px);
    }
    .type-tab-active {
      background: rgba(6, 182, 212, 0.15) !important;
      border-color: #06b6d4 !important;
      color: #ffffff !important;
    }
  </style>
</head>
<body class="p-4 sm:p-6 lg:p-8">

  <!-- Top Navigation Bar -->
  <header class="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-2xl border border-white/10 shadow-2xl">
    <div class="flex items-center gap-3.5">
      <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
        <i data-lucide="server" class="w-6 h-6"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-black text-white"><?= htmlspecialchars($panelName) ?></h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            PHP Standalone Suite
          </span>
        </div>
        <p class="text-xs text-slate-400">Deploy New Server Instance &bull; Full Page Provisioning Portal</p>
      </div>
    </div>

    <div class="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
      <?php if ($authToken): ?>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Connected (<?= htmlspecialchars($_SESSION['mpanel_url']) ?>)</span>
        </div>
        <form method="POST" class="inline">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
          <input type="hidden" name="action" value="logout">
          <button type="submit" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Disconnect
          </button>
        </form>
      <?php else: ?>
        <button onclick="document.getElementById('connection-modal').classList.remove('hidden')" class="btn-cyber px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md">
          <i data-lucide="key" class="w-3.5 h-3.5"></i> Connect / Authenticate
        </button>
      <?php endif; ?>
      <a href="<?= htmlspecialchars($_SESSION['mpanel_url']) ?>" target="_blank" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition flex items-center gap-1.5">
        <i data-lucide="external-link" class="w-3.5 h-3.5 text-cyan-400"></i> Open Panel
      </a>
    </div>
  </header>

  <main class="max-w-6xl mx-auto space-y-6">

    <!-- Notification Alert -->
    <?php if ($notice): ?>
      <div class="glass-card p-4 rounded-2xl border-emerald-500/40 bg-emerald-950/30 text-emerald-200 flex items-center gap-3 text-xs shadow-lg animate-fade-in">
        <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400 shrink-0"></i>
        <span><?= htmlspecialchars($notice) ?></span>
      </div>
    <?php endif; ?>

    <?php if ($error): ?>
      <div class="glass-card p-4 rounded-2xl border-rose-500/40 bg-rose-950/30 text-rose-200 flex items-center gap-3 text-xs shadow-lg animate-fade-in">
        <i data-lucide="alert-circle" class="w-5 h-5 text-rose-400 shrink-0"></i>
        <span><?= htmlspecialchars($error) ?></span>
      </div>
    <?php endif; ?>

    <!-- Success Deployment Showcase -->
    <?php if ($createdServer): ?>
      <div class="glass-card p-6 sm:p-8 rounded-3xl border-cyan-500/50 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-purple-950/40 shadow-2xl relative overflow-hidden space-y-5">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <i data-lucide="sparkles" class="w-6 h-6"></i>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Server Deployed Successfully</span>
              <h2 class="text-xl font-black text-white"><?= htmlspecialchars($createdServer['name']) ?></h2>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ID #<?= htmlspecialchars($createdServer['id']) ?>
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div class="bg-slate-900/80 p-3 rounded-xl border border-white/5">
            <span class="text-slate-400 text-[10px] block uppercase">Type</span>
            <span class="font-bold text-cyan-300"><?= htmlspecialchars(strtoupper($createdServer['server_type'])) ?></span>
          </div>
          <div class="bg-slate-900/80 p-3 rounded-xl border border-white/5">
            <span class="text-slate-400 text-[10px] block uppercase">Memory (RAM)</span>
            <span class="font-bold text-purple-300"><?= htmlspecialchars($createdServer['memory_mb']) ?> MB</span>
          </div>
          <div class="bg-slate-900/80 p-3 rounded-xl border border-white/5">
            <span class="text-slate-400 text-[10px] block uppercase">Disk Storage</span>
            <span class="font-bold text-amber-300"><?= htmlspecialchars($createdServer['disk_mb']) ?> MB</span>
          </div>
          <div class="bg-slate-900/80 p-3 rounded-xl border border-white/5">
            <span class="text-slate-400 text-[10px] block uppercase">UUID</span>
            <span class="font-bold text-slate-300 truncate block" title="<?= htmlspecialchars($createdServer['uuid']) ?>"><?= htmlspecialchars(substr($createdServer['uuid'] ?? '', 0, 13)) ?>...</span>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <a href="<?= htmlspecialchars($createdServer['console_url']) ?>" target="_blank" class="btn-cyber px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
            <i data-lucide="terminal" class="w-4 h-4"></i> Open Server Console in Mpanel
          </a>
          <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition">
            + Deploy Another Server
          </button>
        </div>
      </div>
    <?php endif; ?>

    <!-- Main Deployment Form -->
    <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
      <form method="POST" id="deploy-form" class="space-y-6">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
        <input type="hidden" name="action" value="deploy_server">
        <input type="hidden" name="server_type" id="hidden_server_type" value="minecraft">

        <!-- 1. Server Engine / Type Selection Tabs -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>1. Choose Server Platform</span>
            <span class="text-[11px] text-cyan-400 font-mono" id="selected-type-badge">Selected: Minecraft</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <!-- Minecraft -->
            <button type="button" onclick="setServerType('minecraft')" id="tab-minecraft" class="type-card type-tab-active p-3.5 rounded-2xl border border-white/10 glass-card flex flex-col items-center text-center gap-2 transition hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <i data-lucide="box" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="text-xs font-bold block text-white">Minecraft</span>
                <span class="text-[10px] text-slate-400">Paper, Fabric, Forge</span>
              </div>
            </button>

            <!-- Node.js -->
            <button type="button" onclick="setServerType('nodejs')" id="tab-nodejs" class="type-card p-3.5 rounded-2xl border border-white/10 glass-card flex flex-col items-center text-center gap-2 transition hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <i data-lucide="cpu" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="text-xs font-bold block text-white">Node.js</span>
                <span class="text-[10px] text-slate-400">v18 - v25 Apps & Bots</span>
              </div>
            </button>

            <!-- Python -->
            <button type="button" onclick="setServerType('python')" id="tab-python" class="type-card p-3.5 rounded-2xl border border-white/10 glass-card flex flex-col items-center text-center gap-2 transition hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="text-xs font-bold block text-white">Python</span>
                <span class="text-[10px] text-slate-400">v3.8 - v3.13 Flask, FastAPI</span>
              </div>
            </button>

            <!-- VM - KVM -->
            <button type="button" onclick="setServerType('lumenvm')" id="tab-lumenvm" class="type-card p-3.5 rounded-2xl border border-white/10 glass-card flex flex-col items-center text-center gap-2 transition hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <i data-lucide="server" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="text-xs font-bold block text-white">VM - KVM</span>
                <span class="text-[10px] text-slate-400">Hardware VPS Cloud</span>
              </div>
            </button>

            <!-- VM - No-KVM -->
            <button type="button" onclick="setServerType('nokvm')" id="tab-nokvm" class="type-card p-3.5 rounded-2xl border border-white/10 glass-card flex flex-col items-center text-center gap-2 transition hover:scale-[1.02]">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="text-xs font-bold block text-white">VM - No-KVM</span>
                <span class="text-[10px] text-slate-400">Universal Emulation</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 2. Server Identity & Description -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-slate-300">Server Name</label>
              <button type="button" onclick="generateServerName()" class="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Generate
              </button>
            </div>
            <input type="text" name="name" id="srv_name" required placeholder="e.g. Survival Craft SMP" class="w-full glass-input px-4 py-2.5 rounded-xl text-xs font-semibold">
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <button type="button" onclick="generateServerDesc()" class="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Generate
              </button>
            </div>
            <input type="text" name="description" id="srv_desc" placeholder="e.g. High-performance gaming server" class="w-full glass-input px-4 py-2.5 rounded-xl text-xs">
          </div>
        </div>

        <!-- 3. Minecraft Platform Options (Visible when Minecraft is chosen) -->
        <div id="section-minecraft-options" class="glass-card p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-slate-900/40 space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i> Minecraft Server Engine & Software Version
            </h3>
            <span class="text-[10px] font-mono text-cyan-400">Automated Java Match</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Software Engine</label>
              <select name="mc_jar_type" id="mc_jar_type" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" onchange="updateMinecraftVersions()">
                <option value="paper" selected>Paper (High Performance & Plugins)</option>
                <option value="purpur">Purpur (Optimized for Gameplay Tweaks)</option>
                <option value="fabric">Fabric (Fast Lightweight Modding)</option>
                <option value="forge">Forge (Classic Heavy Modpack Engine)</option>
                <option value="neoforge">NeoForge (Modern Community Forge Fork)</option>
                <option value="bungeecord">BungeeCord (Proxy Network Gateway)</option>
                <option value="velocity">Velocity (Next-Gen Ultra Proxy)</option>
                <option value="vanilla">Vanilla (Official Mojang Standard)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Game Release Version</label>
              <select name="mc_jar_version" id="mc_jar_version" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
                <option value="1.21.4" selected>1.21.4 (Latest Release &bull; Java 21)</option>
                <option value="1.21.1">1.21.1 (Java 21)</option>
                <option value="1.20.4">1.20.4 (Java 17)</option>
                <option value="1.20.1">1.20.1 (Modpacks &bull; Java 17)</option>
                <option value="1.19.4">1.19.4 (Java 17)</option>
                <option value="1.18.2">1.18.2 (Java 17)</option>
                <option value="1.16.5">1.16.5 (Classic &bull; Java 11/16)</option>
                <option value="1.12.2">1.12.2 (Legacy Modding &bull; Java 8)</option>
                <option value="1.8.8">1.8.8 (Competitive PvP &bull; Java 8)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 4. VM - KVM / No-KVM Specialized Options -->
        <div id="section-lumenvm-options" class="hidden glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/40 space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="shield" class="w-4 h-4 text-amber-400"></i> VM - KVM / No-KVM Settings
            </h3>
            <span class="text-[10px] font-mono text-amber-400">QEMU Container Cloud</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Hostname</label>
              <input type="text" name="vm_hostname" value="lumenvm-node" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Root / Sudo Password</label>
              <input type="text" name="vm_password" value="admin123" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Display / Shell Access</label>
              <select name="vm_display_mode" class="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono">
                <option value="ssh" selected>SSH / Console Terminal</option>
                <option value="vnc">VNC Desktop Graphical</option>
                <option value="web">Web Browser Shell</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 5. Ownership, Node & Network Port Allocation -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- User Assignment -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <i data-lucide="user" class="w-3.5 h-3.5 text-cyan-400"></i> Assigned User Owner
            </label>
            <?php if (!empty($usersList)): ?>
              <select name="user_id" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium">
                <?php foreach ($usersList as $u): ?>
                  <option value="<?= htmlspecialchars($u['id']) ?>">
                    <?= htmlspecialchars($u['username']) ?> (<?= htmlspecialchars($u['email']) ?>) - #<?= htmlspecialchars($u['id']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
            <?php else: ?>
              <input type="number" name="user_id" value="1" placeholder="User ID (e.g. 1)" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
            <?php endif; ?>
          </div>

          <!-- Target Node -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <i data-lucide="hard-drive" class="w-3.5 h-3.5 text-cyan-400"></i> Target Node
            </label>
            <?php if (!empty($nodesList)): ?>
              <select name="node_id" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium">
                <?php foreach ($nodesList as $n): ?>
                  <option value="<?= htmlspecialchars($n['id']) ?>">
                    <?= htmlspecialchars($n['name']) ?> (<?= htmlspecialchars($n['fqdn'] ?? '127.0.0.1') ?>)
                  </option>
                <?php endforeach; ?>
              </select>
            <?php else: ?>
              <select name="node_id" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs">
                <option value="1">Node 1 (Localhost / Primary)</option>
              </select>
            <?php endif; ?>
          </div>

          <!-- Port Allocation -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-cyan-400"></i> Port / Allocation
            </label>
            <select name="allocation_id" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium">
              <option value="">-- Auto-Allocate Next Free Port --</option>
              <?php if (!empty($freeAllocations)): ?>
                <?php foreach ($freeAllocations as $a): ?>
                  <option value="<?= htmlspecialchars($a['id']) ?>">
                    <?= htmlspecialchars($a['ip']) ?>:<?= htmlspecialchars($a['port']) ?> (ID #<?= htmlspecialchars($a['id']) ?>)
                  </option>
                <?php endforeach; ?>
              <?php endif; ?>
            </select>
          </div>
        </div>

        <!-- 6. Hardware Resource Allocations -->
        <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="sliders" class="w-4 h-4 text-cyan-400"></i> Hardware Resource Limits
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- RAM -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-300">Memory (RAM)</span>
                <span id="ram-display" class="font-mono font-bold text-cyan-400">2048 MB (2 GB)</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" name="memory_val" id="memory_val" value="2" min="128" class="glass-input px-3 py-2 rounded-xl text-xs w-24 font-bold" oninput="updateRamDisplay()">
                <select name="memory_unit" id="memory_unit" class="glass-input px-3 py-2 rounded-xl text-xs" onchange="updateRamDisplay()">
                  <option value="GB" selected>GB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              <div class="flex gap-1.5 flex-wrap">
                <button type="button" onclick="setRam(1, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">1GB</button>
                <button type="button" onclick="setRam(2, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">2GB</button>
                <button type="button" onclick="setRam(4, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">4GB</button>
                <button type="button" onclick="setRam(8, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">8GB</button>
              </div>
            </div>

            <!-- CPU Limit -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-300">CPU Core Limit</span>
                <span id="cpu-display" class="font-mono font-bold text-purple-400">100% (1 Core)</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" name="cpu_limit" id="cpu_limit" value="100" min="10" step="10" class="glass-input px-3 py-2 rounded-xl text-xs w-28 font-bold" oninput="updateCpuDisplay()">
                <span class="text-xs text-slate-400 font-mono">%</span>
              </div>
              <div class="flex gap-1.5 flex-wrap">
                <button type="button" onclick="setCpu(50)" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">50%</button>
                <button type="button" onclick="setCpu(100)" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">100%</button>
                <button type="button" onclick="setCpu(200)" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">200%</button>
                <button type="button" onclick="setCpu(400)" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">400%</button>
              </div>
            </div>

            <!-- SSD Storage -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-300">SSD Storage (Disk)</span>
                <span id="disk-display" class="font-mono font-bold text-amber-400">10240 MB (10 GB)</span>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" name="disk_val" id="disk_val" value="10" min="512" class="glass-input px-3 py-2 rounded-xl text-xs w-24 font-bold" oninput="updateDiskDisplay()">
                <select name="disk_unit" id="disk_unit" class="glass-input px-3 py-2 rounded-xl text-xs" onchange="updateDiskDisplay()">
                  <option value="GB" selected>GB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              <div class="flex gap-1.5 flex-wrap">
                <button type="button" onclick="setDisk(5, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">5GB</button>
                <button type="button" onclick="setDisk(10, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">10GB</button>
                <button type="button" onclick="setDisk(25, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">25GB</button>
                <button type="button" onclick="setDisk(50, 'GB')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5">50GB</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. Advanced Docker & Startup Configurations (Collapsible) -->
        <details class="glass-card p-5 rounded-2xl border border-white/10 space-y-4 group">
          <summary class="text-xs font-bold text-slate-300 cursor-pointer flex items-center justify-between list-none select-none">
            <span class="flex items-center gap-2">
              <i data-lucide="settings-2" class="w-4 h-4 text-cyan-400"></i> Advanced Container Runtime & Custom Images
            </span>
            <span class="text-cyan-400 font-mono text-[11px] group-open:rotate-180 transition-transform">▼</span>
          </summary>

          <div class="pt-4 space-y-4 border-t border-white/10 mt-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Custom Docker Image (Optional)</label>
              <input type="text" name="docker_image" id="docker_image" placeholder="Leave empty for auto-selected image" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Startup Command Override (Optional)</label>
              <input type="text" name="startup_cmd" id="startup_cmd" placeholder="Leave empty for default launch script" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono">
            </div>

            <!-- Custom Environment Variables -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold text-slate-300">Custom Environment Variables</label>
                <button type="button" onclick="addEnvRow()" class="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <i data-lucide="plus" class="w-3 h-3"></i> Add Variable
                </button>
              </div>
              <div id="env-container" class="space-y-2">
                <div class="flex items-center gap-2">
                  <input type="text" name="env_keys[]" placeholder="KEY (e.g. SERVER_PORT)" class="w-1/3 glass-input px-3 py-1.5 rounded-lg text-xs font-mono">
                  <input type="text" name="env_vals[]" placeholder="VALUE" class="flex-1 glass-input px-3 py-1.5 rounded-lg text-xs font-mono">
                  <button type="button" onclick="this.parentElement.remove()" class="text-slate-500 hover:text-rose-400 p-1.5">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        <!-- Submit Button -->
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-[11px] text-slate-400">
            Clicking deploy initiates instant container provisioning, port binding, and filesystem seeding.
          </p>
          <button type="submit" class="btn-cyber w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer">
            <i data-lucide="rocket" class="w-4 h-4"></i> Deploy Server Instance Now
          </button>
        </div>
      </form>
    </div>
  </main>

  <!-- Connection / Authentication Modal -->
  <div id="connection-modal" class="<?= $authToken ? 'hidden' : '' ?> fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div class="glass-card w-full max-w-md p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="shield-check" class="w-4 h-4 text-cyan-400"></i> Connect to Mpanel Engine
        </h3>
        <?php if ($authToken): ?>
          <button onclick="document.getElementById('connection-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        <?php endif; ?>
      </div>

      <!-- Option A: Login with Admin Username & Password -->
      <form method="POST" class="space-y-3.5">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
        <input type="hidden" name="action" value="login">
        
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Mpanel Base URL</label>
          <input type="url" name="mpanel_url" value="<?= htmlspecialchars($_SESSION['mpanel_url']) ?>" required placeholder="http://localhost:3003" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono">
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Admin Username / Email</label>
          <input type="text" name="username" required placeholder="admin" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Admin Password</label>
          <input type="password" name="password" required placeholder="••••••••" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
        </div>

        <button type="submit" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
          <i data-lucide="log-in" class="w-3.5 h-3.5"></i> Sign In to Mpanel
        </button>
      </form>

      <div class="relative flex items-center justify-center my-2">
        <div class="border-t border-white/10 w-full"></div>
        <span class="bg-slate-900 px-3 text-[10px] text-slate-400 font-mono uppercase absolute">Or Use API Key</span>
      </div>

      <!-- Option B: Direct API Key Token -->
      <form method="POST" class="space-y-3.5">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
        <input type="hidden" name="action" value="set_config">
        <input type="hidden" name="mpanel_url" value="<?= htmlspecialchars($_SESSION['mpanel_url']) ?>">
        
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Mpanel API Key (Token)</label>
          <input type="password" name="mpanel_token" placeholder="mpk_xxxxxxxx or JWT Token" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono">
        </div>

        <button type="submit" class="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center justify-center gap-2">
          <i data-lucide="key" class="w-3.5 h-3.5 text-cyan-400"></i> Set API Key Directly
        </button>
      </form>
    </div>
  </div>

  <footer class="max-w-6xl mx-auto mt-8 text-center text-[11px] text-slate-500 font-mono">
    &copy; <?= date('Y') ?> <?= htmlspecialchars($panelName) ?> &bull; Standalone PHP Server Deployment Suite
  </footer>

  <script>
    if (window.lucide) {
      lucide.createIcons();
    }

    const typeConfigs = {
      minecraft: {
        defaultImage: 'ghcr.io/pterodactyl/yolks:java_21',
        defaultCmd: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui',
        namePrefix: 'Minecraft SMP Server',
        desc: 'High-performance paper/purpur gaming instance'
      },
      nodejs: {
        defaultImage: 'ghcr.io/ptero-eggs/yolks:nodejs_20',
        defaultCmd: 'if [ -f package.json ]; then npm install; fi; npm start',
        namePrefix: 'Node.js Express App',
        desc: 'Ultra-low latency Node.js microservice / Discord bot'
      },
      python: {
        defaultImage: 'ghcr.io/ptero-eggs/yolks:python_3.12',
        defaultCmd: 'if [ -f requirements.txt ]; then pip install -r requirements.txt; fi; python3 app.py',
        namePrefix: 'Python Flask App',
        desc: 'High-speed Python application container'
      },
      lumenvm: {
        defaultImage: 'ghcr.io/sosuku325/aerovm:guest-debian-12',
        defaultCmd: '/start.sh',
        namePrefix: 'VM - KVM Instance',
        desc: 'Hardware accelerated KVM virtual machine cloud VPS'
      },
      nokvm: {
        defaultImage: 'ghcr.io/sosuku325/aerovm:guest-debian-12',
        defaultCmd: '/start.sh',
        namePrefix: 'VM - No-KVM Instance',
        desc: 'Universal software-emulated QEMU cloud virtual machine'
      }
    };

    function setServerType(type) {
      document.getElementById('hidden_server_type').value = type;
      
      // Update Tab Styles
      document.querySelectorAll('.type-card').forEach(el => el.classList.remove('type-tab-active'));
      const activeTab = document.getElementById('tab-' + type);
      if (activeTab) activeTab.classList.add('type-tab-active');

      const badge = document.getElementById('selected-type-badge');
      if (badge) badge.innerText = 'Selected: ' + type.charAt(0).toUpperCase() + type.slice(1);

      // Toggle sections
      const mcSection = document.getElementById('section-minecraft-options');
      const vmSection = document.getElementById('section-lumenvm-options');
      if (mcSection) mcSection.classList.toggle('hidden', type !== 'minecraft');
      if (vmSection) vmSection.classList.toggle('hidden', type !== 'lumenvm' && type !== 'nokvm');

      // Update placeholders
      const conf = typeConfigs[type];
      if (conf) {
        document.getElementById('docker_image').placeholder = 'Auto: ' + conf.defaultImage;
        document.getElementById('startup_cmd').placeholder = 'Auto: ' + conf.defaultCmd;
        if (!document.getElementById('srv_name').value) {
          generateServerName();
        }
        if (!document.getElementById('srv_desc').value) {
          generateServerDesc();
        }
      }
    }

    function generateServerName() {
      const type = document.getElementById('hidden_server_type').value || 'minecraft';
      const conf = typeConfigs[type] || typeConfigs.minecraft;
      const num = Math.floor(100 + Math.random() * 900);
      document.getElementById('srv_name').value = `${conf.namePrefix} #${num}`;
    }

    function generateServerDesc() {
      const type = document.getElementById('hidden_server_type').value || 'minecraft';
      const conf = typeConfigs[type] || typeConfigs.minecraft;
      document.getElementById('srv_desc').value = conf.desc;
    }

    function setRam(val, unit) {
      document.getElementById('memory_val').value = val;
      document.getElementById('memory_unit').value = unit;
      updateRamDisplay();
    }

    function updateRamDisplay() {
      const val = parseInt(document.getElementById('memory_val').value || 0, 10);
      const unit = document.getElementById('memory_unit').value;
      const mb = unit === 'GB' ? val * 1024 : val;
      const gb = unit === 'GB' ? val : (val / 1024).toFixed(1);
      document.getElementById('ram-display').innerText = `${mb} MB (${gb} GB)`;
    }

    function setCpu(val) {
      document.getElementById('cpu_limit').value = val;
      updateCpuDisplay();
    }

    function updateCpuDisplay() {
      const val = parseInt(document.getElementById('cpu_limit').value || 0, 10);
      const cores = (val / 100).toFixed(1);
      document.getElementById('cpu-display').innerText = `${val}% (${cores} ${cores == 1 ? 'Core' : 'Cores'})`;
    }

    function setDisk(val, unit) {
      document.getElementById('disk_val').value = val;
      document.getElementById('disk_unit').value = unit;
      updateDiskDisplay();
    }

    function updateDiskDisplay() {
      const val = parseInt(document.getElementById('disk_val').value || 0, 10);
      const unit = document.getElementById('disk_unit').value;
      const mb = unit === 'GB' ? val * 1024 : val;
      const gb = unit === 'GB' ? val : (val / 1024).toFixed(1);
      document.getElementById('disk-display').innerText = `${mb} MB (${gb} GB)`;
    }

    function addEnvRow() {
      const container = document.getElementById('env-container');
      const div = document.createElement('div');
      div.className = 'flex items-center gap-2';
      div.innerHTML = `
        <input type="text" name="env_keys[]" placeholder="KEY (e.g. PORT)" class="w-1/3 glass-input px-3 py-1.5 rounded-lg text-xs font-mono">
        <input type="text" name="env_vals[]" placeholder="VALUE" class="flex-1 glass-input px-3 py-1.5 rounded-lg text-xs font-mono">
        <button type="button" onclick="this.parentElement.remove()" class="text-slate-500 hover:text-rose-400 p-1.5">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;
      container.appendChild(div);
      if (window.lucide) lucide.createIcons();
    }

    function updateMinecraftVersions() {
      const jarType = document.getElementById('mc_jar_type').value;
      // You could dynamically tailor the versions dropdown based on engine if needed
    }

    // Initialize displays on load
    document.addEventListener('DOMContentLoaded', () => {
      if (!document.getElementById('srv_name').value) {
        generateServerName();
      }
      if (!document.getElementById('srv_desc').value) {
        generateServerDesc();
      }
      updateRamDisplay();
      updateCpuDisplay();
      updateDiskDisplay();
    });
  </script>
</body>
</html>

