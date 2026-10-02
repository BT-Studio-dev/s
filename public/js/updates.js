/**
 * Mpanel - System Updates & Auto-Detection Engine
 * Real-time GitHub Releases Tracker & Live Update Terminal
 * Source: https://github.com/nobita329/Mpanel/releases
 */

class UpdatesManager {
  constructor() {
    this.statusData = null;
    this.ws = null;
    this.term = null;
    this.fitAddon = null;
    this.autoScroll = true;
    this.isUpdating = false;
    this.currentStep = { index: 0, total: 6, label: 'Idle' };
    this.logsHistory = [];
  }

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 pb-16">
        <!-- Header Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                System Lifecycle
              </span>
              <span id="update-top-badge" class="hidden text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Update Available
              </span>
            </div>
            <h2 class="text-2xl font-black text-white mt-2 flex items-center gap-2">
              <i data-lucide="arrow-up-circle" class="w-7 h-7 text-cyan-400"></i> System Updates & Version Control
            </h2>
            <p class="text-xs text-slate-400">
              Auto-detecting releases from <a href="https://github.com/nobita329/Mpanel/releases" target="_blank" class="text-cyan-400 hover:underline font-mono">github.com/nobita329/Mpanel/releases</a> with live streaming terminal
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="updatesManager.fetchStatus(true)" id="btn-check-updates" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center gap-2 transition active:scale-95 shadow-sm">
              <i data-lucide="refresh-cw" class="w-4 h-4 text-cyan-400" id="icon-check-updates"></i>
              <span>Check for Updates</span>
            </button>
            <a href="https://github.com/nobita329/Mpanel/releases" target="_blank" class="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 transition">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              <span>GitHub Releases</span>
            </a>
          </div>
        </div>

        <!-- 3 Summary & Version Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Card 1: Installed Version -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden">
            <div class="flex items-center justify-between text-purple-400">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <i data-lucide="server" class="w-4 h-4 text-purple-400"></i> Installed Version
              </span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20" id="card-current-ver-pill">
                Local
              </span>
            </div>
            <div>
              <h3 id="card-current-ver" class="text-3xl font-black text-white font-mono">v2.4.0</h3>
              <p class="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1.5" id="card-git-info">
                <span>Branch: <b class="text-slate-300">main</b></span>
                <span>&bull;</span>
                <span>Commit: <b class="text-purple-300" id="card-git-commit">--</b></span>
              </p>
            </div>
            <div class="text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 flex justify-between">
              <span>Node.js: <span id="card-node-ver">Active</span></span>
              <span>PM2: Cluster</span>
            </div>
          </div>

          <!-- Card 2: Latest Available Release -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden">
            <div class="flex items-center justify-between text-cyan-400">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <i data-lucide="github" class="w-4 h-4 text-cyan-400"></i> Latest GitHub Release
              </span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" id="card-latest-ver-tag">
                Checking...
              </span>
            </div>
            <div>
              <h3 id="card-latest-ver" class="text-3xl font-black text-cyan-400 font-mono">v2.4.0</h3>
              <p class="text-[11px] text-slate-400 mt-1 truncate" id="card-latest-title">
                Mpanel Release
              </p>
            </div>
            <div class="text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 flex justify-between">
              <span id="card-latest-date">Published: --</span>
              <span id="card-latest-author">By: nobita329</span>
            </div>
          </div>

          <!-- Card 3: Update Status & Action -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden flex flex-col justify-between" id="card-status-box">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400" id="icon-status-badge"></i> System Status
              </span>
              <span id="card-status-pill" class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Up to Date</span>
              </span>
            </div>
            <div class="space-y-1">
              <p id="card-status-headline" class="text-sm font-bold text-slate-200">System is fully synchronized</p>
              <p id="card-status-sub" class="text-xs text-slate-400">All core services, database schemas, and dependencies are on the latest build.</p>
            </div>
            <div class="pt-2">
              <button onclick="updatesManager.confirmAndStartUpdate()" id="btn-main-update-action" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-98">
                <i data-lucide="download-cloud" class="w-4 h-4"></i>
                <span id="btn-main-update-text">Run System Update</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Update Terminal Section -->
        <div class="glass-panel p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <!-- Terminal Header Bar -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span class="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="terminal" class="w-4 h-4 text-cyan-400"></i>
                <span>bash - root@mpanel:~/Mpanel (Live Update Terminal)</span>
              </span>
            </div>

            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span id="term-status-badge" class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                STANDBY
              </span>
              <button onclick="updatesManager.toggleAutoScroll()" id="btn-autoscroll" class="px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 transition">
                Auto-Scroll: ON
              </button>
              <button onclick="updatesManager.copyTerminalLogs()" class="px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition" title="Copy Terminal Logs">
                Copy Logs
              </button>
              <button onclick="updatesManager.clearTerminal()" class="px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition" title="Clear Screen">
                Clear
              </button>
            </div>
          </div>

          <!-- Step Progress Visualizer (6 Steps) -->
          <div class="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 space-y-2">
            <div class="flex justify-between items-center text-xs font-mono">
              <span class="text-slate-400 flex items-center gap-1.5 font-bold">
                <i data-lucide="activity" class="w-3.5 h-3.5 text-purple-400"></i> Execution Pipeline:
                <span id="pipeline-current-label" class="text-purple-300 font-semibold">Ready</span>
              </span>
              <span id="pipeline-step-counter" class="text-slate-500 font-bold">Step 0/6</span>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div id="pipeline-progress-bar" class="bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>

            <!-- 6 Pipeline Pills -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px] font-mono pt-1">
              <div id="pipe-step-1" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">1. Pre-flight</div>
              <div id="pipe-step-2" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">2. Git Sync</div>
              <div id="pipe-step-3" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">3. Dependencies</div>
              <div id="pipe-step-4" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">4. DB Migration</div>
              <div id="pipe-step-5" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">5. PM2 Reload</div>
              <div id="pipe-step-6" class="px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate">6. Verify Health</div>
            </div>
          </div>

          <!-- xterm.js Live Terminal Container -->
          <div class="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#07090e] shadow-inner" style="min-height: 340px; height: 380px;">
            <div id="update-terminal-container" class="w-full h-full p-2.5 font-mono"></div>
            <!-- Fallback DOM text container if xterm fails -->
            <div id="update-terminal-fallback" class="hidden absolute inset-0 p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap"></div>
          </div>

          <!-- Terminal Quick Action Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="updatesManager.confirmAndStartUpdate('standard')" id="btn-terminal-update" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 transition active:scale-95 shadow-md shadow-cyan-500/20">
                <i data-lucide="play" class="w-4 h-4"></i>
                <span>Start Full Update</span>
              </button>
              <button onclick="updatesManager.triggerSync()" id="btn-terminal-sync" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center gap-2 transition active:scale-95">
                <i data-lucide="database" class="w-4 h-4 text-purple-400"></i>
                <span>Sync Dependencies & Schema</span>
              </button>
              <button onclick="updatesManager.checkGitStatus()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center gap-2 transition active:scale-95">
                <i data-lucide="git-branch" class="w-4 h-4 text-emerald-400"></i>
                <span>Check Git Status</span>
              </button>
            </div>

            <div class="text-[11px] text-slate-500 font-mono text-right flex items-center gap-2 justify-end">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>WebSocket Connected</span>
            </div>
          </div>
        </div>

        <!-- Latest Release Changelog Section -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-4">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="file-text" class="w-5 h-5 text-purple-400"></i>
                <span id="changelog-header-title">Release Notes & Changelog</span>
              </h3>
              <p class="text-xs text-slate-400" id="changelog-header-sub">Official release details from GitHub</p>
            </div>
            <span id="changelog-tag-pill" class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              v2.4.0
            </span>
          </div>

          <!-- Formatted Markdown Content -->
          <div id="changelog-body-container" class="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5 font-sans">
            <p class="text-slate-500 italic">Fetching release notes...</p>
          </div>

          <!-- Release Assets Download List -->
          <div id="release-assets-section" class="border-t border-white/5 pt-4 space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <i data-lucide="download" class="w-4 h-4 text-cyan-400"></i> Release Downloads & Archives
            </h4>
            <div id="release-assets-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <!-- Dynamically rendered -->
            </div>
          </div>
        </div>

        <!-- Previous Releases History Section (Accordion) -->
        <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div class="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="history" class="w-5 h-5 text-amber-400"></i>
                <span>Release History</span>
              </h3>
              <p class="text-xs text-slate-400">Past version releases and changelogs for Mpanel</p>
            </div>
            <span class="text-xs font-mono text-slate-400">nobita329/Mpanel</span>
          </div>

          <div id="releases-history-list" class="space-y-2">
            <p class="text-xs text-slate-500 italic">Loading releases history...</p>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Initialize Terminal
    this.initTerminal();

    // Connect WebSocket
    this.connectWebSocket();

    // Fetch Status from GitHub
    await this.fetchStatus(false);
  }

  initTerminal() {
    const termContainer = document.getElementById('update-terminal-container');
    if (!termContainer) return;

    if (this.term) {
      try {
        this.term.dispose();
      } catch (e) {}
      this.term = null;
    }

    if (typeof Terminal !== 'undefined') {
      this.term = new Terminal({
        theme: {
          background: '#07090e',
          foreground: '#e2e8f0',
          cursor: '#22d3ee',
          selectionBackground: 'rgba(34, 211, 238, 0.3)',
          black: '#07090e',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#22d3ee',
          white: '#f8fafc'
        },
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 12,
        lineHeight: 1.3,
        cursorBlink: true,
        convertEol: true,
        disableStdin: true
      });

      if (typeof FitAddon !== 'undefined' && FitAddon.FitAddon) {
        this.fitAddon = new FitAddon.FitAddon();
        this.term.loadAddon(this.fitAddon);
      }

      this.term.open(termContainer);

      setTimeout(() => {
        if (this.fitAddon) this.fitAddon.fit();
      }, 60);

      window.addEventListener('resize', () => {
        if (this.fitAddon) this.fitAddon.fit();
      });

      // Write welcome banner in terminal
      this.term.writeln('\x1b[1;36m=== Mpanel System Update Terminal Initialized ===\x1b[0m');
      this.term.writeln('\x1b[90mReady to stream live system updates, migrations, and process reloads.\x1b[0m\r\n');

    } else {
      // Fallback
      const fallback = document.getElementById('update-terminal-fallback');
      if (fallback) {
        fallback.classList.remove('hidden');
        fallback.textContent = '=== Mpanel System Update Terminal (Fallback Mode) ===\nReady.\n';
      }
    }
  }

  writeToTerminal(text) {
    if (this.term) {
      this.term.writeln(text);
      if (this.autoScroll) {
        this.term.scrollToBottom();
      }
    } else {
      const fallback = document.getElementById('update-terminal-fallback');
      if (fallback) {
        fallback.textContent += text + '\n';
        if (this.autoScroll) fallback.scrollTop = fallback.scrollHeight;
      }
    }
  }

  clearTerminal() {
    if (this.term) {
      this.term.clear();
      this.term.writeln('\x1b[90mTerminal cleared.\x1b[0m\r\n');
    } else {
      const fallback = document.getElementById('update-terminal-fallback');
      if (fallback) fallback.textContent = '';
    }
  }

  copyTerminalLogs() {
    if (this.logsHistory && this.logsHistory.length) {
      const plain = this.logsHistory.map(l => `[${l.timestamp || ''}] ${l.line.replace(/\x1b\[[0-9;]*m/g, '')}`).join('\n');
      app.copyToClipboard(plain);
    } else {
      app.toast('No logs to copy yet.', 'info');
    }
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    const btn = document.getElementById('btn-autoscroll');
    if (btn) {
      btn.innerText = `Auto-Scroll: ${this.autoScroll ? 'ON' : 'OFF'}`;
      btn.className = this.autoScroll 
        ? 'px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 transition'
        : 'px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-500 transition';
    }
  }

  connectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    const token = localStorage.getItem('mpanel_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/admin/updates?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Connected
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWsMessage(data);
        } catch (e) {
          this.writeToTerminal(event.data);
        }
      };

      this.ws.onclose = () => {
        // Closed
      };

      this.ws.onerror = (err) => {
        console.warn('Updates WS error:', err);
      };
    } catch (err) {
      console.warn('Failed to initiate updates WS:', err);
    }
  }

  handleWsMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'init') {
      if (msg.logs && Array.isArray(msg.logs)) {
        this.logsHistory = msg.logs;
        for (const l of msg.logs) {
          this.writeToTerminal(l.line);
        }
      }
      if (msg.isUpdating) {
        this.setUpdatingState(true);
      }
      if (msg.step) {
        this.updateStepProgress(msg.step.index, msg.step.total, msg.step.label);
      }
    } else if (msg.type === 'start') {
      this.setUpdatingState(true);
      this.clearTerminal();
      this.logsHistory = [];
      this.writeToTerminal('\x1b[1;36m▶ Update process started...\x1b[0m\r\n');
    } else if (msg.type === 'log') {
      this.logsHistory.push(msg);
      this.writeToTerminal(msg.line);
    } else if (msg.type === 'step') {
      this.updateStepProgress(msg.index, msg.total, msg.label);
    } else if (msg.type === 'complete') {
      this.setUpdatingState(false);
      if (msg.success) {
        this.writeToTerminal('\r\n\x1b[1;32m' + (msg.message || 'Update completed successfully!') + '\x1b[0m\r\n');
        app.toast('System update completed successfully!', 'success');
        setTimeout(() => this.fetchStatus(true), 1500);
      } else {
        this.writeToTerminal('\r\n\x1b[1;31mUpdate failed: ' + (msg.error || 'Unknown error') + '\x1b[0m\r\n');
        app.toast('System update failed: ' + (msg.error || 'Check logs'), 'error');
      }
    } else if (msg.type === 'status' && msg.data) {
      this.applyStatusData(msg.data);
    }
  }

  setUpdatingState(isUpdating) {
    this.isUpdating = isUpdating;
    const badge = document.getElementById('term-status-badge');
    const btnMain = document.getElementById('btn-main-update-action');
    const btnTerm = document.getElementById('btn-terminal-update');
    const btnSync = document.getElementById('btn-terminal-sync');

    if (badge) {
      if (isUpdating) {
        badge.className = 'px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse';
        badge.innerText = 'UPDATING...';
      } else {
        badge.className = 'px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-slate-800 text-slate-400 border border-white/5';
        badge.innerText = 'STANDBY';
      }
    }

    if (btnMain) btnMain.disabled = isUpdating;
    if (btnTerm) btnTerm.disabled = isUpdating;
    if (btnSync) btnSync.disabled = isUpdating;
  }

  updateStepProgress(index, total, label) {
    this.currentStep = { index, total, label };
    const labelEl = document.getElementById('pipeline-current-label');
    const counterEl = document.getElementById('pipeline-step-counter');
    const barEl = document.getElementById('pipeline-progress-bar');

    if (labelEl) labelEl.innerText = label || `Step ${index}/${total}`;
    if (counterEl) counterEl.innerText = `Step ${index}/${total}`;

    const percent = Math.min(100, Math.round((index / (total || 6)) * 100));
    if (barEl) barEl.style.width = `${percent}%`;

    // Highlight pills
    for (let i = 1; i <= 6; i++) {
      const pill = document.getElementById(`pipe-step-${i}`);
      if (pill) {
        if (i < index) {
          pill.className = 'px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-center truncate font-bold';
        } else if (i === index) {
          pill.className = 'px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-center truncate font-bold animate-pulse';
        } else {
          pill.className = 'px-2 py-1 rounded-lg bg-slate-900/90 text-slate-500 border border-white/5 text-center truncate';
        }
      }
    }
  }

  async fetchStatus(force = false) {
    const icon = document.getElementById('icon-check-updates');
    if (icon) icon.classList.add('animate-spin');

    try {
      const res = await app.api(`/api/admin/updates/status?force=${force ? 'true' : 'false'}`);
      this.statusData = res;
      this.applyStatusData(res);
      if (force) {
        app.toast('Releases checked successfully from GitHub.', 'success');
      }
    } catch (err) {
      console.error('Error fetching updates status:', err);
      app.toast('Failed to query updates: ' + err.message, 'error');
    } finally {
      if (icon) icon.classList.remove('animate-spin');
    }
  }

  applyStatusData(data) {
    if (!data) return;

    // 1. Current Version Card
    const curVerEl = document.getElementById('card-current-ver');
    if (curVerEl) curVerEl.innerText = data.current_version ? `v${data.current_version}` : 'v2.4.0';

    const commitEl = document.getElementById('card-git-commit');
    if (commitEl && data.git) commitEl.innerText = data.git.commit || 'none';

    // 2. Latest Version Card
    const latVerEl = document.getElementById('card-latest-ver');
    const latTagPill = document.getElementById('card-latest-ver-tag');
    const latTitleEl = document.getElementById('card-latest-title');
    const latDateEl = document.getElementById('card-latest-date');

    if (latVerEl) latVerEl.innerText = data.latest_version || 'v2.4.0';
    if (latTagPill) latTagPill.innerText = data.latest_version || 'v2.4.0';

    if (data.latest_release) {
      if (latTitleEl) latTitleEl.innerText = data.latest_release.name || data.latest_release.tag_name;
      if (latDateEl && data.latest_release.published_at) {
        const d = new Date(data.latest_release.published_at);
        latDateEl.innerText = `Published: ${d.toLocaleDateString()}`;
      }
    }

    // 3. Status Box
    const statusBox = document.getElementById('card-status-box');
    const statusPill = document.getElementById('card-status-pill');
    const statusHead = document.getElementById('card-status-headline');
    const statusSub = document.getElementById('card-status-sub');
    const topBadge = document.getElementById('update-top-badge');
    const navBadge = document.getElementById('nav-update-badge');
    const btnAction = document.getElementById('btn-main-update-action');
    const btnActionText = document.getElementById('btn-main-update-text');

    if (data.has_update) {
      if (topBadge) topBadge.classList.remove('hidden');
      if (navBadge) {
        navBadge.classList.remove('hidden');
        navBadge.innerText = 'UPDATE';
      }

      if (statusPill) {
        statusPill.className = 'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse';
        statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Update Available</span>';
      }

      if (statusHead) statusHead.innerText = `New Release ${data.latest_version} Available!`;
      if (statusSub) statusSub.innerText = 'A newer version has been detected on GitHub. Upgrade with 1-click.';

      if (btnAction) {
        btnAction.className = 'w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-98 animate-bounce';
      }
      if (btnActionText) btnActionText.innerText = `Update to ${data.latest_version}`;

    } else {
      if (topBadge) topBadge.classList.add('hidden');
      if (navBadge) navBadge.classList.add('hidden');

      if (statusPill) {
        statusPill.className = 'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1';
        statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Up to Date</span>';
      }

      if (statusHead) statusHead.innerText = 'System is fully synchronized';
      if (statusSub) statusSub.innerText = 'Running the latest release. You can trigger a rebuild/migration sync anytime.';

      if (btnAction) {
        btnAction.className = 'w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-98';
      }
      if (btnActionText) btnActionText.innerText = 'Reinstall / Sync System';
    }

    // 4. Render Changelog
    this.renderChangelog(data.latest_release);

    // 5. Render History
    this.renderHistory(data.releases_history);

    if (window.lucide) lucide.createIcons();
  }

  renderChangelog(rel) {
    const headTitle = document.getElementById('changelog-header-title');
    const headSub = document.getElementById('changelog-header-sub');
    const tagPill = document.getElementById('changelog-tag-pill');
    const bodyCont = document.getElementById('changelog-body-container');
    const assetsList = document.getElementById('release-assets-list');

    if (!rel) {
      if (bodyCont) bodyCont.innerHTML = '<p class="text-slate-500 italic">No release data available from GitHub.</p>';
      return;
    }

    if (headTitle) headTitle.innerText = rel.name || rel.tag_name;
    if (headSub && rel.published_at) {
      headSub.innerText = `Published by ${rel.author || 'nobita329'} on ${new Date(rel.published_at).toLocaleString()}`;
    }
    if (tagPill) tagPill.innerText = rel.tag_name;

    if (bodyCont) {
      bodyCont.innerHTML = this.parseMarkdown(rel.body || 'No release notes provided for this version.');
    }

    if (assetsList) {
      const assets = rel.assets || [];
      const defaultZip = rel.zipball_url ? [{
        name: `${rel.tag_name}-source.zip`,
        browser_download_url: rel.zipball_url,
        size: 0
      }] : [];

      const allAssets = assets.length ? assets : defaultZip;

      assetsList.innerHTML = allAssets.map(a => `
        <a href="${a.browser_download_url}" target="_blank" class="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 flex items-center justify-between transition text-slate-200">
          <span class="flex items-center gap-2 truncate">
            <i data-lucide="package" class="w-4 h-4 text-purple-400 shrink-0"></i>
            <span class="truncate">${a.name}</span>
          </span>
          <span class="text-[10px] text-cyan-400 font-bold shrink-0 ml-2">
            ${a.size ? (a.size / 1024 / 1024).toFixed(1) + ' MB' : 'Download'}
          </span>
        </a>
      `).join('');
    }
  }

  renderHistory(history) {
    const list = document.getElementById('releases-history-list');
    if (!list) return;

    if (!history || !history.length) {
      list.innerHTML = '<p class="text-xs text-slate-500 italic">No previous releases found.</p>';
      return;
    }

    list.innerHTML = history.map((r, idx) => `
      <div class="border border-white/5 rounded-2xl bg-slate-900/60 overflow-hidden transition">
        <button onclick="updatesManager.toggleHistoryItem(${idx})" class="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-white/5 text-purple-300 border border-white/10">
              ${r.tag_name}
            </span>
            <span class="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-md">
              ${r.name || r.tag_name}
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>${r.published_at ? new Date(r.published_at).toLocaleDateString() : ''}</span>
            <i data-lucide="chevron-down" class="w-4 h-4 transition-transform" id="hist-chevron-${idx}"></i>
          </div>
        </button>
        <div id="hist-body-${idx}" class="hidden p-4 pt-0 border-t border-white/5 text-xs text-slate-300 space-y-2 prose prose-invert max-w-none">
          <div class="p-3 rounded-xl bg-slate-950/70 border border-white/5 font-sans leading-relaxed">
            ${this.parseMarkdown(r.body || 'No release description available.')}
          </div>
          <div class="flex justify-end pt-1">
            <a href="${r.html_url}" target="_blank" class="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1">
              <span>View full release notes on GitHub</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }

  toggleHistoryItem(idx) {
    const body = document.getElementById(`hist-body-${idx}`);
    const chev = document.getElementById(`hist-chevron-${idx}`);
    if (!body) return;

    const isHidden = body.classList.contains('hidden');
    if (isHidden) {
      body.classList.remove('hidden');
      if (chev) chev.classList.add('rotate-180');
      if (window.lucide) lucide.createIcons();
    } else {
      body.classList.add('hidden');
      if (chev) chev.classList.remove('rotate-180');
    }
  }

  parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-cyan-300 mt-2 mb-1">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-white mt-3 mb-1.5 pb-1 border-b border-white/10">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-white mt-3 mb-2">$1</h2>');

    // Code blocks
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre class="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto text-cyan-300 my-2"><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong class="text-slate-100 font-bold">$1</strong>');
    html = html.replace(/\*([^*]+)\*/gim, '<em class="text-slate-300">$1</em>');

    // Bullet points
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>');
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" class="text-cyan-400 hover:underline font-medium">$1</a>');

    // Paragraph breaks
    html = html.replace(/\n\n/gim, '<br/><br/>');

    return html;
  }

  confirmAndStartUpdate(mode = 'standard') {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div class="glass-card w-full max-w-lg rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2 text-cyan-400 font-bold">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400"></i>
              <span class="text-white text-base font-black">Confirm System Update</span>
            </div>
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <p>You are about to run the automated Mpanel system update pipeline.</p>
            <div class="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 font-mono text-[11px]">
              <div class="text-slate-400 font-bold uppercase tracking-wider mb-1">Pipeline Stages:</div>
              <div class="flex items-center gap-2 text-emerald-400"><i data-lucide="check" class="w-3.5 h-3.5"></i> 1. Git pull from repository (main)</div>
              <div class="flex items-center gap-2 text-emerald-400"><i data-lucide="check" class="w-3.5 h-3.5"></i> 2. Dependencies sync (npm install)</div>
              <div class="flex items-center gap-2 text-emerald-400"><i data-lucide="check" class="w-3.5 h-3.5"></i> 3. Database schema migrations</div>
              <div class="flex items-center gap-2 text-emerald-400"><i data-lucide="check" class="w-3.5 h-3.5"></i> 4. Seamless PM2 cluster reload</div>
            </div>
            <p class="text-slate-400 text-[11px]">
              Your database entries, game servers, and configuration settings in <code class="text-purple-300">.env</code> will be safely preserved.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition">
              Cancel
            </button>
            <button onclick="updatesManager.executeUpdate('${mode}')" class="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-95">
              <i data-lucide="play" class="w-4 h-4"></i>
              <span>Confirm &amp; Run Update</span>
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async executeUpdate(mode = 'standard') {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'start_update', mode }));
    } else {
      try {
        await app.api('/api/admin/updates/run', {
          method: 'POST',
          body: JSON.stringify({ mode })
        });
      } catch (err) {
        app.toast('Failed to trigger update: ' + err.message, 'error');
      }
    }
  }

  async triggerSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'sync' }));
    } else {
      try {
        await app.api('/api/admin/updates/sync-deps', { method: 'POST' });
        app.toast('Sync pipeline initiated.', 'info');
      } catch (err) {
        app.toast('Failed to trigger sync: ' + err.message, 'error');
      }
    }
  }

  async checkGitStatus() {
    try {
      const res = await app.api('/api/admin/updates/git-status');
      if (res && res.git) {
        const g = res.git;
        this.writeToTerminal(`\r\n\x1b[36m--- Git Repository Status ---\x1b[0m`);
        this.writeToTerminal(`Branch: \x1b[32m${g.branch}\x1b[0m | Commit: \x1b[35m${g.commit}\x1b[0m`);
        this.writeToTerminal(`Modified files: ${g.dirty ? `\x1b[33m${g.dirtyCount} uncommitted files\x1b[0m` : '\x1b[32mClean working tree\x1b[0m'}\r\n`);
        app.toast(`Git status: branch ${g.branch} (${g.commit})`, 'info');
      }
    } catch (err) {
      app.toast('Git status check failed: ' + err.message, 'error');
    }
  }
}

window.updatesManager = new UpdatesManager();

