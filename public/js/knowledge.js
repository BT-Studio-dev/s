// Mpanel Interactive Auto Tutorials Module
class TutorialsManager {
  constructor() {
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.tutorials = [
      {
        id: 'panel-walkthrough',
        category: 'getting-started',
        badge: 'Auto Guided Tour',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        title: 'Complete Mpanel Dashboard & Navigation Auto-Tour',
        duration: '2 min auto-tour',
        interactiveAction: 'tour:panel-tour',
        summary: 'Take an automated guided walkthrough of server cards, live telemetry meters, marketplace addons, and custom themes.',
        content: `
          <h3>Mpanel Complete Overview</h3>
          <p>This automated walkthrough spotlights key features of your panel including real-time container management, responsive screen layout controls, and fast server switching.</p>
          
          <div class="my-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-white">Automated Guided Walkthrough</h4>
              <p class="text-[11px] text-slate-300">Experience live spotlights on panel navigation elements.</p>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''; autoTutorial.startTour('panel-tour', true);" class="btn-cyber px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
              <i data-lucide="play" class="w-3.5 h-3.5"></i> Run Auto Tour
            </button>
          </div>
        `
      },
      {
        id: 'sftp-connect',
        category: 'databases',
        badge: 'Interactive Tool',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        title: 'Connecting to your Server via SFTP & File Uploads',
        duration: '3 min interactive',
        interactiveAction: 'sim:sftp',
        summary: 'Learn how to connect FileZilla or WinSCP directly to your server using Mpanel embedded SFTP port 3004 with one-click URI copy.',
        content: `
          <h3>Overview</h3>
          <p>Mpanel features a high-performance embedded SFTP engine running on port <strong>3004</strong>. You can connect using any standard SFTP client like <strong>FileZilla</strong>, <strong>WinSCP</strong>, or <strong>Cyberduck</strong>.</p>
          
          <div class="p-3 my-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-1">
            <div class="text-cyan-400"># SFTP Connection Details</div>
            <div><strong>Host / Server:</strong> <span class="text-slate-300">your-server-ip or panel domain</span></div>
            <div><strong>Port:</strong> <span class="text-amber-400">3004</span> (Default embedded SFTP port)</div>
            <div><strong>Protocol:</strong> <span class="text-slate-300">SFTP - SSH File Transfer Protocol</span></div>
            <div><strong>Username:</strong> <span class="text-slate-300">Your Mpanel username</span></div>
            <div><strong>Password:</strong> <span class="text-slate-300">Your Mpanel account password</span></div>
          </div>

          <h4>Connecting with FileZilla</h4>
          <ol class="list-decimal list-inside space-y-2 text-slate-300">
            <li>Open FileZilla and navigate to <strong>File &rarr; Site Manager</strong>.</li>
            <li>Click <strong>New Site</strong> and select protocol <strong>SFTP - SSH File Transfer Protocol</strong>.</li>
            <li>In <strong>Host</strong>, enter your server IP or domain. In <strong>Port</strong>, enter <code>3004</code>.</li>
            <li>Set <strong>Logon Type</strong> to <code>Normal</code>, enter your Mpanel username and password.</li>
            <li>Click <strong>Connect</strong> and accept the host key when prompted.</li>
          </ol>

          <div class="p-3 my-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>Tip:</strong> You can upload large world archives, custom jars, and mods directly into the <code>/</code> root directory of your server.
          </div>
        `
      },
      {
        id: 'mariadb-database',
        category: 'databases',
        badge: 'Interactive Config',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        title: 'Managing MySQL & MariaDB Server Databases',
        duration: '4 min interactive',
        interactiveAction: 'sim:mariadb',
        summary: 'How to provision dedicated database instances, connect LuckPerms/CoreProtect, and allow remote connections on port 27017.',
        content: `
          <h3>Connecting Server Plugins to MariaDB</h3>
          <p>Mpanel automatically creates dedicated database credentials for each server database created under <strong>Databases</strong>.</p>

          <div class="p-3 my-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-1">
            <div><strong>Database Host:</strong> <span class="text-cyan-300">127.0.0.1 (or node public IP)</span></div>
            <div><strong>Port:</strong> <span class="text-amber-400">27017</span> (or host mapping)</div>
            <div><strong>Database Name:</strong> <span class="text-slate-300">s{id}_{name}</span></div>
            <div><strong>Username:</strong> <span class="text-slate-300">u{id}_{hash}</span></div>
          </div>

          <h4>Example: LuckPerms configuration</h4>
          <pre class="bg-black/60 p-3 rounded-xl text-xs text-emerald-300 overflow-x-auto">
storage-method: MariaDB
address: "127.0.0.1:27017"
database: "s1_luckperms"
username: "u1_lpuser"
password: "YourGeneratedPassword"
maximum-pool-size: 10
          </pre>
        `
      },
      {
        id: 'aikar-flags',
        category: 'performance',
        badge: 'RAM Calculator',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        title: 'Optimizing Minecraft Java Flags with Aikar\'s G1GC',
        duration: '3 min tool',
        interactiveAction: 'sim:aikar',
        summary: 'Eliminate GC lag spikes and improve tick rates with proven high-performance Java launch arguments tuned to your RAM.',
        content: `
          <h3>Why Use Aikar's Garbage Collection Flags?</h3>
          <p>Standard Java GC can trigger noticeable "stop-the-world" tick lag spikes when freeing memory. Aikar's flags configure Java's Garbage-First (G1) collector for ultra-short pause intervals.</p>

          <h4>Recommended Java 17 / 21 Startup Arguments:</h4>
          <pre class="bg-black/60 p-3 rounded-xl text-xs text-cyan-300 overflow-x-auto select-all">
-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1
          </pre>

          <p class="mt-3">Navigate to <strong>Startup &amp; Parameters</strong> on your server to add or customize these startup arguments.</p>
        `
      },
      {
        id: 'crash-diagnostics',
        category: 'troubleshooting',
        badge: 'Troubleshooting',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        title: 'Diagnosing Server Crash Logs & Out-of-Memory Errors',
        duration: '4 min read',
        interactiveAction: null,
        summary: 'How to read crash reports, resolve watchdog timeouts, and handle memory allocation limits in container environments.',
        content: `
          <h3>Common Crash Patterns</h3>
          <ul class="list-disc list-inside space-y-2 text-slate-300">
            <li><strong>OutOfMemoryError: Java heap space</strong> &rarr; Increase memory allocated to container or lower view distance.</li>
            <li><strong>Watchdog thread dump</strong> &rarr; Server tick exceeded 60s. Often caused by corrupted chunk or runaway entity count.</li>
            <li><strong>Port already in use (EADDRINUSE)</strong> &rarr; Server didn't terminate cleanly. Use "Kill" button on console.</li>
          </ul>
        `
      },
      {
        id: 'backups-schedules',
        category: 'getting-started',
        badge: 'Interactive Tour',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        title: 'Creating Automated Backups & Cron Schedules',
        duration: '3 min auto-tour',
        interactiveAction: 'tour:server-tour',
        summary: 'Protect your server data with automatic scheduled archives, locked restore points, and one-click restores.',
        content: `
          <h3>Automated Protection</h3>
          <p>Mpanel allows creating compressed snapshots of your server filesystem with one click.</p>

          <h4>Key Capabilities</h4>
          <ul class="list-disc list-inside space-y-2 text-slate-300">
            <li><strong>Locked Backups:</strong> Prevent essential milestone backups from being auto-deleted.</li>
            <li><strong>Cron Schedules:</strong> Use standard 5-part cron syntax (e.g. <code>0 4 * * *</code> for daily at 4:00 AM) to trigger automated server restarts or backups.</li>
            <li><strong>One-Click Restore:</strong> Instantly unpack and restore your entire server directory from any stored snapshot.</li>
          </ul>
        `
      },
      {
        id: 'plugins-mods',
        category: 'config',
        badge: 'Tutorial',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        title: 'Installing Plugins & Mods on Paper, Purpur & Fabric',
        duration: '3 min guide',
        interactiveAction: null,
        summary: 'Step-by-step guide to installing Spigot/Paper plugins (.jar) and Fabric mods without downtime.',
        content: `
          <h3>Installing Plugins</h3>
          <ol class="list-decimal list-inside space-y-2 text-slate-300">
            <li>Download your chosen plugin (e.g. EssentialsX, WorldEdit, LuckPerms) compatible with your server version.</li>
            <li>Open the <strong>Files</strong> manager in Mpanel or connect via <strong>SFTP</strong>.</li>
            <li>Navigate to the <code>/plugins</code> directory.</li>
            <li>Drag and drop the plugin <code>.jar</code> file to upload it.</li>
            <li>Restart your server from the <strong>Console</strong> tab to initialize the plugin.</li>
          </ol>
        `
      }
    ];
  }

  renderKnowledgeView() {
    this.renderTutorialsView();
  }

  renderTutorialsView() {
    if (window.admin && typeof window.admin.stopOverviewPolling === 'function') {
      window.admin.stopOverviewPolling();
    }

    const container = document.getElementById('view-container');
    if (!container) return;

    const filtered = this.tutorials.filter(a => {
      const matchesCategory = this.activeCategory === 'all' || a.category === this.activeCategory;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    const isTutEnabled = (window.app?.settings?.tutorials_enabled !== '0' && localStorage.getItem('mpanel_tutorials_enabled') !== '0');

    container.innerHTML = `
      <div class="space-y-6 pb-12 max-w-7xl mx-auto">
        ${(!isTutEnabled && window.app?.user?.role === 'admin') ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 text-xs">
            <div class="flex items-center gap-2.5">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0"></i>
              <span><strong>Admin Notice:</strong> The Tutorials page is currently <strong>TURNED OFF</strong> in Settings. Regular users cannot access or view this page in their sidebar.</span>
            </div>
            <button onclick="app.navigate('admin-settings')" class="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-white text-[11px] font-bold whitespace-nowrap">
              Turn ON in Settings
            </button>
          </div>
        ` : ''}

        <!-- Hero Header with Auto Tour Launcher -->
        <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111525] via-[#171d27] to-[#1a2230] relative overflow-hidden shadow-2xl">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute -left-10 -top-10 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 max-w-2xl space-y-4">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">Auto Tutorials</span>
              <span class="text-[10px] font-mono text-slate-400">Interactive Walkthrough &amp; Guides</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Interactive Auto Tutorials</h2>
            <p class="text-xs sm:text-sm text-slate-300">Run automated product walkthroughs, live element tours, and interactive configuration builders.</p>

            <!-- Auto Tour Launchers -->
            <div class="flex flex-wrap items-center gap-2.5 pt-1">
              <button onclick="autoTutorial.startTour('panel-tour', true)" class="btn-cyber px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                <i data-lucide="play-circle" class="w-4 h-4"></i>
                <span>Start Auto Guided Tour (5 Min)</span>
              </button>
              <button onclick="autoTutorial.startTour('panel-tour', false)" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center gap-2 transition">
                <i data-lucide="compass" class="w-4 h-4 text-cyan-400"></i>
                <span>Step-by-Step Tour</span>
              </button>
            </div>

            <!-- Live Search Bar -->
            <div class="relative pt-2">
              <div class="absolute inset-y-0 left-0 pt-2 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input type="text" id="tut-search-input" value="${this.searchQuery}" oninput="tutorialsManager.handleSearch(this.value)" placeholder="Search tutorials, e.g. SFTP, MariaDB, Aikar, Crash..." class="w-full glass-input pl-10 pr-4 py-3 rounded-2xl text-xs font-medium placeholder:text-slate-500">
            </div>
          </div>
        </div>

        <!-- Interactive Configuration Builders Suite -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i> Interactive Configuration Builders
              </h3>
              <p class="text-[11px] text-slate-400">Live generators for SFTP connections, MariaDB credentials, and Java Aikar flags</p>
            </div>
            <div class="flex items-center gap-1.5" id="sim-tabs">
              <button onclick="tutorialsManager.selectSimTab('sftp')" id="sim-tab-sftp" class="simulator-tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-cyan-500/20 text-cyan-300 border-cyan-500/40 transition active">SFTP Generator</button>
              <button onclick="tutorialsManager.selectSimTab('aikar')" id="sim-tab-aikar" class="simulator-tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-slate-300 hover:text-white transition">Aikar Flags</button>
              <button onclick="tutorialsManager.selectSimTab('mariadb')" id="sim-tab-mariadb" class="simulator-tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-slate-300 hover:text-white transition">MariaDB YAML</button>
            </div>
          </div>

          <!-- Tab 1: SFTP Builder -->
          <div id="sim-content-sftp" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase font-mono block">Host Server</span>
                <span class="font-mono text-cyan-300 text-xs truncate block" id="sim-sftp-host">${window.location.hostname || '127.0.0.1'}</span>
              </div>
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase font-mono block">Embedded Port</span>
                <span class="font-mono text-amber-300 text-xs block">3004 (SFTP)</span>
              </div>
              <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase font-mono block">Username</span>
                <span class="font-mono text-emerald-300 text-xs truncate block" id="sim-sftp-user">${(window.app && app.user && app.user.username) || 'your_username'}</span>
              </div>
            </div>
            <div class="bg-black/50 p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
              <span id="sim-sftp-uri" class="text-slate-300 truncate">sftp://${(window.app && app.user && app.user.username) || 'your_username'}@${window.location.hostname || '127.0.0.1'}:3004</span>
              <button onclick="tutorialsManager.copySftpUri()" class="btn-cyber px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy SFTP URI
              </button>
            </div>
          </div>

          <!-- Tab 2: Aikar Flags Calculator -->
          <div id="sim-content-aikar" class="hidden space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label class="text-xs text-slate-300 font-semibold">Allocated Server Memory (RAM):</label>
              <div class="flex items-center gap-3">
                <input type="range" id="sim-ram-range" min="1" max="32" value="4" oninput="tutorialsManager.updateAikarCalc(this.value)" class="w-48 accent-cyan-400 cursor-pointer">
                <span id="sim-ram-display" class="text-xs font-mono font-bold text-cyan-400 px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">4 GB (4096 MB)</span>
              </div>
            </div>
            <div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-xs font-mono text-cyan-300 relative group overflow-x-auto">
              <pre id="sim-aikar-flags" class="whitespace-pre-wrap select-all font-mono text-[11px] leading-relaxed">java -Xms4096M -Xmx4096M -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -jar server.jar nogui</pre>
              <button onclick="tutorialsManager.copyAikarFlags()" class="absolute top-2.5 right-2.5 btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow">
                <i data-lucide="copy" class="w-3 h-3"></i> Copy
              </button>
            </div>
          </div>

          <!-- Tab 3: MariaDB YAML Config Builder -->
          <div id="sim-content-mariadb" class="hidden space-y-3">
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-300 font-semibold">Select Plugin:</label>
              <select id="sim-db-plugin" onchange="tutorialsManager.updateDbSnippet(this.value)" class="glass-input px-3 py-1.5 rounded-xl text-xs">
                <option value="luckperms">LuckPerms (config.yml)</option>
                <option value="coreprotect">CoreProtect (config.yml)</option>
              </select>
            </div>
            <div class="bg-black/60 p-3.5 rounded-xl border border-white/10 text-xs font-mono text-emerald-300 relative group overflow-x-auto">
              <pre id="sim-db-snippet" class="whitespace-pre-wrap select-all font-mono text-[11px] leading-relaxed"># LuckPerms configuration (config.yml)
storage-method: MariaDB
data:
  address: "127.0.0.1:27017"
  database: "s1_luckperms"
  username: "u1_user"
  password: "YourGeneratedDbPassword"
  maximum-pool-size: 10
  minimum-idle-size: 2</pre>
              <button onclick="tutorialsManager.copyDbSnippet()" class="absolute top-2.5 right-2.5 btn-cyber px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow">
                <i data-lucide="copy" class="w-3 h-3"></i> Copy
              </button>
            </div>
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          ${[
            { id: 'all', label: 'All Tutorials', icon: 'layers' },
            { id: 'getting-started', label: 'Getting Started', icon: 'rocket' },
            { id: 'databases', label: 'Databases & SFTP', icon: 'database' },
            { id: 'performance', label: 'Performance & Flags', icon: 'zap' },
            { id: 'troubleshooting', label: 'Troubleshooting', icon: 'alert-triangle' },
            { id: 'config', label: 'Config & Plugins', icon: 'sliders' }
          ].map(cat => `
            <button onclick="tutorialsManager.setCategory('${cat.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${this.activeCategory === cat.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/15 hover:text-white'}">
              <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
              <span>${cat.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Tutorials Grid -->
        ${filtered.length === 0 ? `
          <div class="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <h4 class="text-base font-bold text-white">No tutorials found</h4>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">No tutorials matched your search query "${this.searchQuery}". Try searching for SFTP, MariaDB, or Flags.</p>
            <button onclick="tutorialsManager.clearSearch()" class="btn-cyber text-xs px-4 py-2 rounded-xl">Clear Search</button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filtered.map(a => `
              <div onclick="tutorialsManager.handleCardClick('${a.id}')" class="glass-card p-5 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-lg">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${a.badgeColor}">${a.badge}</span>
                    <span class="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <i data-lucide="clock" class="w-3 h-3"></i>
                      ${a.duration}
                    </span>
                  </div>
                  <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition leading-snug">${a.title}</h3>
                  <p class="text-xs text-slate-400 leading-relaxed line-clamp-3">${a.summary}</p>
                </div>

                <div class="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span class="flex items-center gap-1.5">
                    ${a.interactiveAction ? '<i data-lucide="play-circle" class="w-3.5 h-3.5 text-cyan-400"></i> Run Auto Guide' : '<i data-lucide="book-open" class="w-3.5 h-3.5"></i> Read Guide'}
                  </span>
                  <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Support Box -->
        <div class="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#ff5108]/20 border border-[#ff5108]/30 flex items-center justify-center text-[#ff5108] shrink-0">
              <i data-lucide="help-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Need personal assistance?</h4>
              <p class="text-xs text-slate-400">Our support engineers and community are ready to help with server setups.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a href="https://discord.com" target="_blank" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white transition flex items-center gap-2">
              <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
              <span>Discord Support</span>
            </a>
            <a href="mailto:support@mpanel.local" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition flex items-center gap-2">
              <i data-lucide="mail" class="w-3.5 h-3.5"></i>
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  handleCardClick(id) {
    const tut = this.tutorials.find(t => t.id === id);
    if (!tut) return;

    if (tut.interactiveAction) {
      if (tut.interactiveAction.startsWith('tour:')) {
        const tourId = tut.interactiveAction.replace('tour:', '');
        if (window.autoTutorial) {
          autoTutorial.startTour(tourId, true);
          return;
        }
      } else if (tut.interactiveAction.startsWith('sim:')) {
        const simTab = tut.interactiveAction.replace('sim:', '');
        this.selectSimTab(simTab);
        const simEl = document.getElementById('sim-tabs');
        if (simEl) simEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    this.openTutorialModal(id);
  }

  handleSearch(val) {
    this.searchQuery = val;
    this.renderTutorialsView();
  }

  clearSearch() {
    this.searchQuery = '';
    this.activeCategory = 'all';
    this.renderTutorialsView();
  }

  setCategory(cat) {
    this.activeCategory = cat;
    this.renderTutorialsView();
  }

  openTutorialModal(id) {
    const tut = this.tutorials.find(t => t.id === id);
    if (!tut) return;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="tutorial-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/15 shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tut.badgeColor}">${tut.badge}</span>
              <span class="text-xs text-slate-400 font-mono">${tut.duration}</span>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-slate-400 hover:text-white transition p-1 rounded-lg">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar">
            <h2 class="text-xl font-extrabold text-white leading-tight">${tut.title}</h2>
            <div class="border-t border-white/10 pt-4 prose prose-invert max-w-none">
              ${tut.content}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3.5 border-t border-white/10 bg-white/[0.01] flex justify-between items-center shrink-0">
            <span class="text-[11px] text-slate-400">Was this tutorial helpful?</span>
            <div class="flex gap-2">
              <button onclick="app.toast('Thanks for your feedback!', 'success'); document.getElementById('modal-container').innerHTML=''" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1.5">
                <i data-lucide="thumbs-up" class="w-3.5 h-3.5"></i>
                <span>Yes, Helpful</span>
              </button>
              <button onclick="document.getElementById('modal-container').innerHTML=''" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  // Backwards compatibility for old calls
  openArticle(id) {
    this.openTutorialModal(id);
  }

  selectSimTab(tab) {
    document.querySelectorAll('#sim-tabs .simulator-tab-btn').forEach(btn => {
      btn.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
      btn.classList.add('bg-white/5', 'text-slate-300');
    });
    const activeBtn = document.getElementById(`sim-tab-${tab}`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
      activeBtn.classList.remove('bg-white/5', 'text-slate-300');
    }

    ['sftp', 'aikar', 'mariadb'].forEach(t => {
      const el = document.getElementById(`sim-content-${t}`);
      if (el) {
        if (t === tab) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  copySftpUri() {
    const el = document.getElementById('sim-sftp-uri');
    if (el && window.app) {
      app.copyToClipboard(el.innerText);
    }
  }

  updateAikarCalc(val) {
    const gb = parseInt(val, 10) || 4;
    const mb = gb * 1024;
    const disp = document.getElementById('sim-ram-display');
    if (disp) disp.innerText = `${gb} GB (${mb} MB)`;

    const flagsEl = document.getElementById('sim-aikar-flags');
    if (flagsEl && window.autoTutorial) {
      flagsEl.innerText = autoTutorial.calculateAikarFlags(gb);
    }
  }

  copyAikarFlags() {
    const flagsEl = document.getElementById('sim-aikar-flags');
    if (flagsEl && window.app) {
      app.copyToClipboard(flagsEl.innerText);
    }
  }

  updateDbSnippet(plugin) {
    const snipEl = document.getElementById('sim-db-snippet');
    if (snipEl && window.autoTutorial) {
      snipEl.innerText = autoTutorial.generateDbSnippet(plugin);
    }
  }

  copyDbSnippet() {
    const snipEl = document.getElementById('sim-db-snippet');
    if (snipEl && window.app) {
      app.copyToClipboard(snipEl.innerText);
    }
  }
}

// Instantiate and expose globally
window.tutorialsManager = window.knowledgeManager = new TutorialsManager();
