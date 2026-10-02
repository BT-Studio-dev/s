/**
 * Mpanel Discord Live Profile Detector & Real-time Presence Engine
 * Developer ID: 924366651443527710 (Nobita / nobita.dev)
 * Website: https://nobitahost.in/
 */
(function() {
  const DEVELOPER_ID = '924366651443527710';
  const DISCORD_EPOCH = 1420070400000n;

  function calculateSnowflake(id) {
    try {
      const ms = Number((BigInt(id) >> 22n) + DISCORD_EPOCH);
      return new Date(ms);
    } catch(e) {
      return new Date('2021-12-25T18:23:03.000Z');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  class DiscordLiveManager {
    constructor() {
      this.userId = DEVELOPER_ID;
      this.ws = null;
      this.heartbeatTimer = null;
      this.reconnectTimer = null;
      this.pollTimer = null;
      this.viewMode = 'live'; // 'live' or 'popout'
      
      const createdDate = calculateSnowflake(this.userId);
      this.state = {
        id: this.userId,
        username: 'nobita.dev',
        global_name: 'nobita',
        avatar_url: '/images/nobita-discord.png',
        banner_color: '#5865F2',
        banner_url: null,
        status: 'online', // 'online' | 'idle' | 'dnd' | 'offline'
        activities: [],
        spotify: null,
        custom_status: 'hii I am a game devoloper / bot devoloper',
        lanyard_monitored: false,
        created_at: createdDate.toISOString(),
        formatted_created_at: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        website: 'https://nobitahost.in/',
        discord_url: `https://discord.com/users/${this.userId}`,
        mention: `<@${this.userId}>`
      };

      this.init();
    }

    async init() {
      // 1. Initial local fetch from Mpanel server API
      await this.fetchServerProfile();

      // 2. Connect to Lanyard WebSocket for instant real-time pushes
      this.connectLanyardWs();

      // 3. Fallback periodic poll every 45 seconds
      this.pollTimer = setInterval(() => {
        this.fetchServerProfile();
      }, 45000);

      // Initial DOM sync
      this.updateDOM();
    }

    async fetchServerProfile() {
      try {
        const res = await fetch('/api/public/developer-discord');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.profile) {
            this.applyProfileUpdate(data.profile);
          }
        }
      } catch (err) {
        // silent fallback
      }
    }

    connectLanyardWs() {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        this.ws = new WebSocket('wss://api.lanyard.rest/socket');

        this.ws.onopen = () => {
          // Connected, wait for Hello op 1
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            // OP 1: Hello from Lanyard
            if (msg.op === 1) {
              const interval = (msg.d && msg.d.heartbeat_interval) || 30000;
              if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
              this.heartbeatTimer = setInterval(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(JSON.stringify({ op: 3 }));
                }
              }, interval);

              // Subscribe to Developer ID
              this.ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: this.userId }
              }));
            }

            // OP 0: Event dispatch
            if (msg.op === 0) {
              if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
                const data = msg.d;
                if (data && data.discord_user) {
                  this.applyLanyardData(data);
                }
              }
            }
          } catch (e) {
            console.warn('[DiscordLive] WS parse error:', e);
          }
        };

        this.ws.onclose = () => {
          if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
          // Try reconnecting in 10s
          if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              this.connectLanyardWs();
            }, 10000);
          }
        };

        this.ws.onerror = () => {
          if (this.ws) this.ws.close();
        };
      } catch (err) {
        // WebSocket not available or blocked
      }
    }

    applyLanyardData(data) {
      const u = data.discord_user;
      const status = data.discord_status || 'online';
      const isMonitored = true;

      let avatarUrl = this.state.avatar_url;
      if (u.avatar) {
        const ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
        avatarUrl = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=256`;
      }

      let bannerUrl = null;
      if (u.banner) {
        const ext = u.banner.startsWith('a_') ? 'gif' : 'png';
        bannerUrl = `https://cdn.discordapp.com/banners/${u.id}/${u.banner}.${ext}?size=1024`;
      }

      // Find custom status (activity type 4)
      const activities = data.activities || [];
      const customStatusAct = activities.find(a => a.type === 4);
      let customStatusText = customStatusAct ? customStatusAct.state : (this.state.custom_status || 'hii I am a game devoloper / bot devoloper');

      this.state = {
        ...this.state,
        username: u.username || this.state.username,
        global_name: u.global_name || u.username || this.state.global_name,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        banner_color: u.banner_color || this.state.banner_color,
        status: status,
        activities: activities,
        spotify: data.listening_to_spotify ? data.spotify : null,
        custom_status: customStatusText,
        lanyard_monitored: isMonitored
      };

      this.updateDOM();
    }

    applyProfileUpdate(profile) {
      this.state = {
        ...this.state,
        ...profile
      };
      this.updateDOM();
    }

    getStatusConfig(status) {
      switch(status) {
        case 'online':
          return {
            color: '#22c55e',
            bgClass: 'bg-emerald-500',
            borderClass: 'border-emerald-500/40',
            textClass: 'text-emerald-400',
            label: 'Online',
            ringClass: 'ring-emerald-500/40',
            pulse: true
          };
        case 'idle':
          return {
            color: '#f59e0b',
            bgClass: 'bg-amber-400',
            borderClass: 'border-amber-400/40',
            textClass: 'text-amber-300',
            label: 'Idle / Away',
            ringClass: 'ring-amber-400/40',
            pulse: false
          };
        case 'dnd':
          return {
            color: '#f43f5e',
            bgClass: 'bg-rose-500',
            borderClass: 'border-rose-500/40',
            textClass: 'text-rose-400',
            label: 'Do Not Disturb',
            ringClass: 'ring-rose-500/40',
            pulse: false
          };
        case 'offline':
        default:
          return {
            color: '#94a3b8',
            bgClass: 'bg-slate-400',
            borderClass: 'border-slate-500/40',
            textClass: 'text-slate-400',
            label: 'Offline',
            ringClass: 'ring-slate-400/40',
            pulse: false
          };
      }
    }

    updateDOM() {
      const cfg = this.getStatusConfig(this.state.status);

      // 1. Sidebar Watermark
      const sbAvatar = document.getElementById('sidebar-dev-avatar');
      if (sbAvatar && this.state.avatar_url && this.state.avatar_url !== '/images/nobita-discord.png') {
        sbAvatar.src = this.state.avatar_url;
        sbAvatar.className = 'w-full h-full object-cover rounded-full';
      }
      const sbStatusDot = document.getElementById('sidebar-dev-status-dot');
      if (sbStatusDot) {
        sbStatusDot.className = `absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${cfg.bgClass} ring-2 ring-slate-950 ${cfg.pulse ? 'animate-pulse' : ''}`;
        sbStatusDot.title = `Discord: ${cfg.label}`;
      }
      const sbName = document.getElementById('sidebar-dev-name');
      if (sbName) sbName.textContent = this.state.global_name || 'Nobita';
      const sbHandle = document.getElementById('sidebar-dev-handle');
      if (sbHandle) sbHandle.textContent = this.state.username || 'nobita.dev';

      // 2. Global Footer Watermark
      const ftStatusDot = document.getElementById('footer-dev-status-dot');
      if (ftStatusDot) {
        ftStatusDot.className = `w-2 h-2 rounded-full ${cfg.bgClass} inline-block ${cfg.pulse ? 'animate-pulse' : ''}`;
        ftStatusDot.title = `Discord: ${cfg.label}`;
      }
      const ftName = document.getElementById('footer-dev-name');
      if (ftName) ftName.textContent = this.state.global_name || 'Nobita';

      // 3. Update Modal if currently open
      const liveModalContent = document.getElementById('discord-live-card-body');
      if (liveModalContent) {
        liveModalContent.innerHTML = this.renderCardInner();
        if (window.lucide) lucide.createIcons();
      }
    }

    toggleView(mode) {
      this.viewMode = mode;
      const container = document.getElementById('developer-modal-content-area');
      const btnLive = document.getElementById('dev-modal-btn-live');
      const btnPopout = document.getElementById('dev-modal-btn-popout');
      if (!container) return;

      if (btnLive && btnPopout) {
        if (mode === 'live') {
          btnLive.className = 'px-3 py-1 rounded-lg bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40 text-xs flex items-center gap-1.5 transition';
          btnPopout.className = 'px-3 py-1 rounded-lg bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition';
        } else {
          btnPopout.className = 'px-3 py-1 rounded-lg bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40 text-xs flex items-center gap-1.5 transition';
          btnLive.className = 'px-3 py-1 rounded-lg bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition';
        }
      }

      if (mode === 'popout') {
        container.innerHTML = `
          <div class="relative w-full bg-[#111214] flex justify-center items-center overflow-hidden animate-fade-in">
            <img src="/images/nobita-discord.png" class="w-full h-auto object-contain select-none" alt="Nobita Discord Profile">
          </div>
        `;
      } else {
        container.innerHTML = `
          <div id="discord-live-card-body" class="animate-fade-in">
            ${this.renderCardInner()}
          </div>
        `;
      }
      if (window.lucide) lucide.createIcons();
    }

    renderCardInner() {
      const cfg = this.getStatusConfig(this.state.status);
      const isCustomAvatar = this.state.avatar_url && this.state.avatar_url !== '/images/nobita-discord.png';
      
      // Check Spotify
      const spotify = this.state.spotify;
      let spotifyHtml = '';
      if (spotify) {
        spotifyHtml = `
          <div class="mt-3 p-2.5 rounded-2xl bg-[#1db954]/10 border border-[#1db954]/30 shadow-inner">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5 text-[10px] font-bold text-[#1db954] uppercase tracking-wider">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                <span>Listening to Spotify</span>
              </div>
              <div class="flex items-end gap-0.5 h-3">
                <span class="w-0.5 bg-[#1db954] rounded-full eq-bar" style="animation-delay: 0s;"></span>
                <span class="w-0.5 bg-[#1db954] rounded-full eq-bar" style="animation-delay: 0.2s;"></span>
                <span class="w-0.5 bg-[#1db954] rounded-full eq-bar" style="animation-delay: 0.4s;"></span>
                <span class="w-0.5 bg-[#1db954] rounded-full eq-bar" style="animation-delay: 0.1s;"></span>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              ${spotify.album_art_url ? `<img src="${spotify.album_art_url}" class="w-10 h-10 rounded-lg shadow-md shrink-0 object-cover" alt="Album Art">` : ''}
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white truncate">${escapeHtml(spotify.song || '')}</p>
                <p class="text-[11px] text-slate-300 truncate">by ${escapeHtml(spotify.artist || '')}</p>
              </div>
            </div>
          </div>
        `;
      }

      // Check Non-Spotify Activities (e.g. VS Code or Game)
      let activityHtml = '';
      const otherActivity = (this.state.activities || []).find(a => a.type !== 4 && a.name !== 'Spotify');
      if (otherActivity) {
        activityHtml = `
          <div class="mt-3 p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
              <i data-lucide="gamepad-2" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span>${otherActivity.type === 0 ? 'Playing' : 'Activity'}</span>
            </div>
            <div class="text-xs font-bold text-white truncate">${escapeHtml(otherActivity.name || '')}</div>
            ${otherActivity.details ? `<div class="text-[11px] text-slate-300 truncate">${escapeHtml(otherActivity.details)}</div>` : ''}
            ${otherActivity.state ? `<div class="text-[10px] text-slate-400 truncate">${escapeHtml(otherActivity.state)}</div>` : ''}
          </div>
        `;
      }

      return `
        <div class="relative">
          <!-- Discord Banner Top -->
          <div class="h-28 w-full relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700" style="${this.state.banner_url ? `background-image: url('${this.state.banner_url}'); background-size: cover; background-position: center;` : (this.state.banner_color ? `background-color: ${this.state.banner_color};` : '')}">
            <div class="absolute inset-0 bg-gradient-to-t from-[#111214] via-transparent to-black/30"></div>
            
            <!-- Discord Badges Top Right -->
            <div class="absolute top-2.5 right-12 flex items-center gap-1.5 p-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 shadow-lg">
              <!-- Active Developer Badge -->
              <span class="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:scale-110 transition" title="Active Developer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v7c0 5.25 4.25 9.75 10 11 5.75-1.25 10-5.75 10-11V7l-10-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
              </span>
              <!-- HypeSquad Bravery Badge -->
              <span class="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 hover:scale-110 transition" title="HypeSquad Bravery">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <!-- Discord Nitro Badge -->
              <span class="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 hover:scale-110 transition" title="Nitro Subscriber">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l-5 9h7l-3 11 11-12h-7l4-8H7z"/></svg>
              </span>
            </div>
          </div>

          <!-- Avatar & Status Section -->
          <div class="px-4 relative -mt-12 pb-1">
            <div class="flex items-end justify-between">
              <div class="relative inline-block">
                <div class="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#111214] bg-[#1e1f22] shadow-2xl relative">
                  ${isCustomAvatar ? `
                    <img src="${this.state.avatar_url}" class="w-full h-full object-cover" alt="Nobita Avatar">
                  ` : `
                    <div class="w-full h-full relative overflow-hidden bg-slate-900">
                      <img src="/images/nobita-discord.png" class="w-[190px] max-w-none absolute -top-5 -left-5 select-none" alt="Nobita">
                    </div>
                  `}
                </div>
                <!-- Status Dot -->
                <span class="absolute bottom-1 right-1 w-5 h-5 rounded-full ${cfg.bgClass} ring-4 ring-[#111214] flex items-center justify-center shadow-lg" title="Discord Status: ${cfg.label}">
                  ${this.state.status === 'dnd' ? '<span class="w-2.5 h-0.5 bg-[#111214] rounded-full"></span>' : ''}
                  ${this.state.status === 'idle' ? '<span class="w-1.5 h-1.5 bg-[#111214] rounded-full -ml-1 -mt-1"></span>' : ''}
                </span>
              </div>

              <!-- Live Presence Pulse Indicator -->
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md mb-2">
                <span class="w-2 h-2 rounded-full ${cfg.bgClass} ${cfg.pulse ? 'animate-ping' : ''}"></span>
                <span class="text-[10px] font-bold ${cfg.textClass}">Discord ${cfg.label}</span>
              </div>
            </div>

            <!-- Profile Names & Pronouns -->
            <div class="mt-2.5 space-y-0.5">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-white tracking-tight">${escapeHtml(this.state.global_name || 'Nobita')}</h3>
                <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">DEV</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>@${escapeHtml(this.state.username || 'nobita.dev')}</span>
                <span class="text-slate-600">&bull;</span>
                <span class="text-slate-500">he/him</span>
              </div>
            </div>

            <!-- Custom Status Pill -->
            <div class="mt-3 p-2 rounded-xl bg-[#1e1f22] border border-white/5 flex items-center gap-2 text-xs text-slate-200">
              <span class="text-sm">💬</span>
              <span class="truncate font-medium text-slate-300 text-[11px]">${escapeHtml(this.state.custom_status || 'hii I am a game devoloper / bot devoloper')}</span>
            </div>

            <!-- Spotify / Activities -->
            ${spotifyHtml}
            ${activityHtml}

            <!-- Discord Bio / About Me -->
            <div class="mt-3 p-3 rounded-2xl bg-[#1e1f22] border border-white/5 space-y-2">
              <h4 class="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">About Me</h4>
              <div class="text-xs text-slate-300 space-y-1 font-sans leading-relaxed">
                <p>hii I am a game devoloper / bot devoloper</p>
                <p class="text-indigo-400 font-medium">join for - <a href="https://nobitahost.in/" target="_blank" class="underline hover:text-indigo-300">nobitahost.in</a></p>
                <p class="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                  founder of nobitahost.in
                </p>
              </div>
            </div>

            <!-- Member Since & ID Info -->
            <div class="mt-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div class="flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-purple-400"></i>
                <span>Member Since: <strong class="text-slate-200">${this.state.formatted_created_at}</strong></span>
              </div>
              <span class="text-[10px] text-emerald-400 flex items-center gap-1">
                <i data-lucide="shield-check" class="w-3 h-3"></i> Verified
              </span>
            </div>

            <!-- Lanyard Live Status Notice -->
            ${!this.state.lanyard_monitored ? `
              <div class="mt-2.5 p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-slate-400 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <i data-lucide="zap" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i>
                  <span class="truncate">Real-time status sync via Lanyard Gateway</span>
                </div>
                <a href="https://discord.gg/lanyard" target="_blank" class="px-2 py-0.5 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 font-bold shrink-0 transition" title="Join Lanyard Discord server to enable 24/7 live presence">
                  Connect
                </a>
              </div>
            ` : `
              <div class="mt-2.5 p-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-1.5 justify-center font-mono">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Real-Time Gateway Sync Active</span>
              </div>
            `}
          </div>
        </div>
      `;
    }
  }

  window.discordLive = new DiscordLiveManager();
})();

