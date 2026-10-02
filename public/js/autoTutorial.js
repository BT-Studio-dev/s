// Mpanel Auto Tutorial & Interactive Tour Engine
// Provides automated product walkthroughs, element spotlighting, interactive simulators, and guided onboarding tours.

class AutoTutorialManager {
  constructor() {
    this.currentTour = null;
    this.currentStepIndex = 0;
    this.isAutoPlaying = false;
    this.autoPlayDuration = 5500; // ms per step
    this.autoPlayTimer = null;
    this.progressInterval = null;
    this.progressStartTime = 0;

    // Tour Catalog
    this.tours = {
      'panel-tour': {
        id: 'panel-tour',
        title: 'Mpanel Complete Platform Tour',
        badge: 'Interactive Walkthrough',
        steps: [
          {
            target: '#sidebar-portal-section',
            title: 'Welcome to Mpanel',
            content: 'Your high-performance game and application management dashboard. Here in the sidebar you can swiftly navigate between your servers, marketplace, tutorials, and account credentials.',
            route: 'user-overview',
            placement: 'right'
          },
          {
            target: '#header-device-mode-container',
            title: 'Adaptive Screen Auto-Sizer',
            content: 'Switch instantly between Auto, Phone (<640px), Tablet (640-1024px), and PC/Laptop modes for optimal viewability across all devices.',
            placement: 'bottom'
          },
          {
            target: '#nav-user-servers',
            title: 'Your Server Instances',
            content: 'View and control all your active game servers, Discord bots, and Web apps. View live CPU, RAM, and SSD telemetry meters and trigger instant restarts.',
            route: 'user-servers',
            placement: 'right'
          },
          {
            target: '#nav-user-marketplace',
            title: 'Mod & Plugin Marketplace',
            content: 'Explore and install hundreds of Minecraft plugins (Spigot/Paper), Fabric mods, and pre-packaged server templates with 1-click automatic installation.',
            route: 'marketplace',
            placement: 'right'
          },
          {
            target: '#nav-user-tutorials',
            title: 'Interactive Tutorials & Guides',
            content: 'Access interactive simulators, connection builders for SFTP, MariaDB setup wizards, and Java optimization guides whenever you need help.',
            route: 'tutorials',
            placement: 'right'
          },
          {
            target: '#header-user-menu',
            title: 'Profile, Security & 2FA',
            content: 'Protect your account with Two-Factor Authentication (TOTP / Google Authenticator), manage API tokens, and update your credentials.',
            placement: 'bottom'
          }
        ]
      },
      'server-tour': {
        id: 'server-tour',
        title: 'Server Console & Control Suite',
        badge: 'Live Server Controls',
        steps: [
          {
            target: '#console-controls-bar',
            title: 'Power State Controls',
            content: 'Safely Start, Gracefully Restart, Stop, or Immediately Kill your running container instances with ultra-low latency response.',
            placement: 'bottom'
          },
          {
            target: '#terminal-container',
            title: 'Real-Time xterm.js Terminal',
            content: 'Live interactive server terminal with bidirectional WebSocket streaming, custom font sizing, auto-scroll locking, and command history.',
            placement: 'top'
          },
          {
            target: '#telemetry-stats-grid',
            title: 'Live Resource Telemetry',
            content: 'Monitors real-time CPU usage %, Memory consumption in MB/GB, Disk space, and live Inbound / Outbound network throughput.',
            placement: 'bottom'
          },
          {
            target: '#nav-tab-files',
            title: 'Embedded File Manager',
            content: 'Browse, edit config files with Ace code editor, upload archives, drag-and-drop mods, and extract tar/zip packages directly.',
            placement: 'right'
          },
          {
            target: '#nav-tab-databases',
            title: 'Dedicated MariaDB Databases',
            content: 'Create dedicated SQL databases on port 27017 with automatically generated passwords for plugins like LuckPerms and CoreProtect.',
            placement: 'right'
          },
          {
            target: '#nav-tab-backups',
            title: 'One-Click Automated Backups',
            content: 'Generate compressed snapshots of your whole server world and configs. Lock important milestones and restore in seconds.',
            placement: 'right'
          }
        ]
      }
    };

    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.currentTour) return;
      if (e.key === 'Escape') {
        this.stopTour();
      } else if (e.key === 'ArrowRight') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.prevStep();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.toggleAutoPlay();
      }
    });
  }

  startTour(tourId = 'panel-tour', autoPlay = false) {
    const tour = this.tours[tourId];
    if (!tour) return;

    this.currentTour = tour;
    this.currentStepIndex = 0;
    this.isAutoPlaying = autoPlay;

    // Create backdrop and card if not present
    this.ensureBackdrop();
    this.renderStep();

    if (autoPlay) {
      this.startAutoPlayTimer();
    }
  }

  ensureBackdrop() {
    let bd = document.getElementById('tutorial-spotlight-backdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.id = 'tutorial-spotlight-backdrop';
      bd.onclick = (e) => {
        // Clicking outside card advances step or pauses
        if (e.target === bd) this.toggleAutoPlay();
      };
      document.body.appendChild(bd);
    }

    let card = document.getElementById('tutorial-tooltip-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'tutorial-tooltip-card';
      document.body.appendChild(card);
    }
  }

  async renderStep() {
    if (!this.currentTour) return;
    const step = this.currentTour.steps[this.currentStepIndex];
    if (!step) {
      this.finishTour();
      return;
    }

    // If step requires navigating to a specific view
    if (step.route && window.app && window.location.hash.replace('#', '') !== step.route) {
      app.navigate(step.route);
      await new Promise(r => setTimeout(r, 250));
    }

    // Clean previous highlight
    document.querySelectorAll('.tutorial-highlighted-element').forEach(el => {
      el.classList.remove('tutorial-highlighted-element');
    });

    let targetEl = null;
    if (step.target) {
      targetEl = document.querySelector(step.target);
    }

    if (targetEl && !targetEl.classList.contains('hidden')) {
      targetEl.classList.add('tutorial-highlighted-element');
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }

    const card = document.getElementById('tutorial-tooltip-card');
    if (!card) return;

    const totalSteps = this.currentTour.steps.length;
    const currentNum = this.currentStepIndex + 1;
    const progressPct = Math.round((currentNum / totalSteps) * 100);

    card.innerHTML = `
      <div class="space-y-3.5">
        <!-- Top Header Info -->
        <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
              ${this.currentTour.badge} (${currentNum}/${totalSteps})
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="autoTutorial.toggleAutoPlay()" title="${this.isAutoPlaying ? 'Pause Auto-Play' : 'Start Auto-Play'}" class="px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1 ${this.isAutoPlaying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-slate-300 hover:text-white'}">
              <i data-lucide="${this.isAutoPlaying ? 'pause' : 'play'}" class="w-3 h-3"></i>
              <span>${this.isAutoPlaying ? 'Pause' : 'Auto'}</span>
            </button>
            <button onclick="autoTutorial.stopTour()" title="Exit Tour (Esc)" class="w-6 h-6 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center transition">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Step Title & Content -->
        <div class="space-y-1.5">
          <h4 class="text-base font-black text-white flex items-center gap-2">
            <span>${step.title}</span>
          </h4>
          <p class="text-xs text-slate-300 leading-relaxed">${step.content}</p>
        </div>

        <!-- Auto-Play Countdown Progress Bar -->
        ${this.isAutoPlaying ? `
          <div class="tutorial-progress-bar-bg" title="Auto-advancing...">
            <div id="tutorial-timer-fill" class="tutorial-progress-bar-fill" style="width: 0%;"></div>
          </div>
        ` : `
          <div class="tutorial-progress-bar-bg">
            <div class="tutorial-progress-bar-fill" style="width: ${progressPct}%;"></div>
          </div>
        `}

        <!-- Navigation Buttons -->
        <div class="pt-1 flex items-center justify-between gap-2 text-xs">
          <button onclick="autoTutorial.prevStep()" ${this.currentStepIndex === 0 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl font-semibold border transition flex items-center gap-1.5 ${this.currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed border-white/5 text-slate-500' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'}">
            <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> Previous
          </button>

          <span class="text-[10px] text-slate-400 font-mono">${currentNum} of ${totalSteps}</span>

          ${currentNum < totalSteps ? `
            <button onclick="autoTutorial.nextStep()" class="btn-cyber px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md">
              <span>Next</span> <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          ` : `
            <button onclick="autoTutorial.finishTour()" class="px-4 py-1.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> <span>Finish Tour</span>
            </button>
          `}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.positionCard(targetEl, step.placement);

    // Play feedback chime if sounds enabled
    if (window.app && typeof app.playSound === 'function') {
      app.playSound('online');
    }
  }

  positionCard(targetEl, placement = 'bottom') {
    const card = document.getElementById('tutorial-tooltip-card');
    if (!card) return;

    if (!targetEl) {
      // Center card on screen
      card.style.top = '50%';
      card.style.left = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const margin = 14;

    let top = 0;
    let left = 0;

    // Default positioning based on preference or screen edges
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile devices, dock card safely near the bottom of screen
      card.style.top = 'auto';
      card.style.bottom = '20px';
      card.style.left = '50%';
      card.style.transform = 'translateX(-50%)';
      return;
    }

    if (placement === 'right') {
      top = rect.top + (rect.height / 2) - (cardRect.height / 2);
      left = rect.right + margin;
    } else if (placement === 'left') {
      top = rect.top + (rect.height / 2) - (cardRect.height / 2);
      left = rect.left - cardRect.width - margin;
    } else if (placement === 'top') {
      top = rect.top - cardRect.height - margin;
      left = rect.left + (rect.width / 2) - (cardRect.width / 2);
    } else {
      // bottom
      top = rect.bottom + margin;
      left = rect.left + (rect.width / 2) - (cardRect.width / 2);
    }

    // Viewport bounding clamp
    const pad = 16;
    if (left < pad) left = pad;
    if (left + cardRect.width > window.innerWidth - pad) {
      left = window.innerWidth - cardRect.width - pad;
    }
    if (top < pad) top = pad;
    if (top + cardRect.height > window.innerHeight - pad) {
      top = window.innerHeight - cardRect.height - pad;
    }

    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;
    card.style.transform = 'none';
  }

  nextStep() {
    if (!this.currentTour) return;
    if (this.currentStepIndex < this.currentTour.steps.length - 1) {
      this.currentStepIndex++;
      this.renderStep();
      if (this.isAutoPlaying) {
        this.startAutoPlayTimer();
      }
    } else {
      this.finishTour();
    }
  }

  prevStep() {
    if (!this.currentTour) return;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderStep();
      if (this.isAutoPlaying) {
        this.startAutoPlayTimer();
      }
    }
  }

  toggleAutoPlay() {
    this.isAutoPlaying = !this.isAutoPlaying;
    if (this.isAutoPlaying) {
      this.startAutoPlayTimer();
      if (window.app) app.toast('Auto-play tutorial resumed', 'info');
    } else {
      this.stopAutoPlayTimer();
      if (window.app) app.toast('Auto-play paused', 'info');
    }
    this.renderStep();
  }

  startAutoPlayTimer() {
    this.stopAutoPlayTimer();
    this.progressStartTime = Date.now();

    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.progressStartTime;
      const pct = Math.min(100, (elapsed / this.autoPlayDuration) * 100);
      const fillEl = document.getElementById('tutorial-timer-fill');
      if (fillEl) {
        fillEl.style.width = `${pct}%`;
      }
    }, 50);

    this.autoPlayTimer = setTimeout(() => {
      this.nextStep();
    }, this.autoPlayDuration);
  }

  stopAutoPlayTimer() {
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  finishTour() {
    if (this.currentTour && window.app) {
      app.toast(`🎉 You completed the ${this.currentTour.title}!`, 'success');
      localStorage.setItem(`mpanel_tour_${this.currentTour.id}_completed`, '1');
      localStorage.setItem('mpanel_autotour_done', '1');
    }
    this.stopTour();
  }

  stopTour() {
    this.stopAutoPlayTimer();
    this.currentTour = null;

    document.querySelectorAll('.tutorial-highlighted-element').forEach(el => {
      el.classList.remove('tutorial-highlighted-element');
    });

    const bd = document.getElementById('tutorial-spotlight-backdrop');
    if (bd) bd.remove();

    const card = document.getElementById('tutorial-tooltip-card');
    if (card) card.remove();
  }

  // ==========================================================
  // Interactive Simulators (Calculators & Generators)
  // ==========================================================

  // 1. Aikar Java Flags Interactive RAM Calculator
  calculateAikarFlags(ramGb) {
    const gb = Math.max(1, parseInt(ramGb, 10) || 4);
    const mb = gb * 1024;
    return `java -Xms${mb}M -Xmx${mb}M -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -jar server.jar nogui`;
  }

  // 2. Interactive SFTP Connection Generator
  generateSftpDetails() {
    const username = (window.app && app.user && app.user.username) || 'your_username';
    const host = window.location.hostname || '127.0.0.1';
    const port = '3004';
    return {
      host,
      port,
      username,
      protocol: 'SFTP (SSH File Transfer Protocol)',
      connectionUri: `sftp://${username}@${host}:${port}`
    };
  }

  // 3. Interactive MariaDB Config Generator
  generateDbSnippet(plugin = 'luckperms', dbName = 's1_minecraft') {
    const host = window.location.hostname || '127.0.0.1';
    const port = 27017;
    const user = (window.app && app.user && app.user.username) ? `u1_${app.user.username.slice(0,6)}` : 'u1_user';
    const pass = 'YourGeneratedDbPassword';

    if (plugin === 'coreprotect') {
      return `# CoreProtect config.yml MariaDB Block
use-mysql: true
table-prefix: "cp_"
mysql-host: "${host}"
mysql-port: ${port}
mysql-database: "${dbName}"
mysql-username: "${user}"
mysql-password: "${pass}"`;
    }

    // Default LuckPerms
    return `# LuckPerms configuration (config.yml)
storage-method: MariaDB
data:
  address: "${host}:${port}"
  database: "${dbName}"
  username: "${user}"
  password: "${pass}"
  maximum-pool-size: 10
  minimum-idle-size: 2`;
  }
}

window.autoTutorial = new AutoTutorialManager();
