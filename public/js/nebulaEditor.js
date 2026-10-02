/**
 * Mpanel - Nebula Theme Customizer & Studio Designer
 * Ported from Nebula Blueprint (prplwtf / nobita329)
 * Provides real-time theme tweaking, presets, color pickers, sidebar styling, magic patterns & alerts.
 */

class NebulaEditor {
  constructor() {
    this.storageKey = 'nebula_theme_config';
    this.presets = {
      default: {
        name: 'Default Nebula',
        desc: 'Signature deep space violet aesthetic with radiant purple accents.',
        sidebarPrimary: '#ffffff',
        sidebarPrimaryHover: '#ffffff',
        sidebarSecondary: '#251f30',
        sidebarSecondaryHover: '#23293e',
        sidebarSecondaryActive: '#23293e',
        sidebarSecondarySelected: '#b288ff',
        sidebarBackground: '#151221',
        sidebarButtonActive: '#b288ff',
        pagePrimary: '#e9eaee',
        pagePrimaryHover: '#b288ff',
        pageSecondary: '#1f1e24',
        pageSecondaryHover: '#2b2f3e',
        pageSecondaryActive: '#303443',
        pageSecondarySelected: '#363e57',
        pageBackground: '#0e0c17',
        pageButtonDefault: '#5a24e0',
        pageButtonHover: '#874fff',
        statusOnline: '#2cdd2f',
        statusStarting: '#dbc025',
        statusError: '#bc362f',
        statusOffline: '#787474'
      },
      slate: {
        name: 'Slate Ice',
        desc: 'Crisp arctic cyan accents with deep navy and gunmetal slate surfaces.',
        sidebarPrimary: '#f8fafc',
        sidebarPrimaryHover: '#38bdf8',
        sidebarSecondary: '#1e293b',
        sidebarSecondaryHover: '#334155',
        sidebarSecondaryActive: '#334155',
        sidebarSecondarySelected: '#38bdf8',
        sidebarBackground: '#0f172a',
        sidebarButtonActive: '#38bdf8',
        pagePrimary: '#f8fafc',
        pagePrimaryHover: '#38bdf8',
        pageSecondary: '#1e293b',
        pageSecondaryHover: '#334155',
        pageSecondaryActive: '#475569',
        pageSecondarySelected: '#0284c7',
        pageBackground: '#0b0f19',
        pageButtonDefault: '#0284c7',
        pageButtonHover: '#38bdf8',
        statusOnline: '#38bdf8',
        statusStarting: '#fbbf24',
        statusError: '#f87171',
        statusOffline: '#64748b'
      },
      pyro: {
        name: 'Pyro Blaze',
        desc: 'Fiery crimson & sunset amber with high-contrast obsidian panels.',
        sidebarPrimary: '#fff1f2',
        sidebarPrimaryHover: '#ff6b4a',
        sidebarSecondary: '#271414',
        sidebarSecondaryHover: '#3f1b1b',
        sidebarSecondaryActive: '#3f1b1b',
        sidebarSecondarySelected: '#ff6b4a',
        sidebarBackground: '#160a0a',
        sidebarButtonActive: '#ff6b4a',
        pagePrimary: '#fff1f2',
        pagePrimaryHover: '#ff6b4a',
        pageSecondary: '#241111',
        pageSecondaryHover: '#381919',
        pageSecondaryActive: '#4a1e1e',
        pageSecondarySelected: '#e11d48',
        pageBackground: '#0d0505',
        pageButtonDefault: '#e11d48',
        pageButtonHover: '#ff6b4a',
        statusOnline: '#22c55e',
        statusStarting: '#f59e0b',
        statusError: '#ef4444',
        statusOffline: '#71717a'
      },
      leaf: {
        name: 'Leaf Emerald',
        desc: 'Lush organic forest tones, jade highlights, and sleek deep pine backgrounds.',
        sidebarPrimary: '#ecfdf5',
        sidebarPrimaryHover: '#34d399',
        sidebarSecondary: '#0f231c',
        sidebarSecondaryHover: '#17382d',
        sidebarSecondaryActive: '#17382d',
        sidebarSecondarySelected: '#34d399',
        sidebarBackground: '#081410',
        sidebarButtonActive: '#34d399',
        pagePrimary: '#ecfdf5',
        pagePrimaryHover: '#34d399',
        pageSecondary: '#102820',
        pageSecondaryHover: '#193d31',
        pageSecondaryActive: '#204e3f',
        pageSecondarySelected: '#059669',
        pageBackground: '#050c0a',
        pageButtonDefault: '#059669',
        pageButtonHover: '#10b981',
        statusOnline: '#10b981',
        statusStarting: '#eab308',
        statusError: '#f43f5e',
        statusOffline: '#6b7280'
      },
      catppuccin: {
        name: 'Catppuccin Mocha',
        desc: 'Soft pastel mauve & lavender with warm chocolate and velvety deep crust.',
        sidebarPrimary: '#cdd6f4',
        sidebarPrimaryHover: '#cba6f7',
        sidebarSecondary: '#181825',
        sidebarSecondaryHover: '#242635',
        sidebarSecondaryActive: '#313244',
        sidebarSecondarySelected: '#cba6f7',
        sidebarBackground: '#11111b',
        sidebarButtonActive: '#cba6f7',
        pagePrimary: '#cdd6f4',
        pagePrimaryHover: '#cba6f7',
        pageSecondary: '#181825',
        pageSecondaryHover: '#242635',
        pageSecondaryActive: '#313244',
        pageSecondarySelected: '#45475a',
        pageBackground: '#1e1e2e',
        pageButtonDefault: '#89b4fa',
        pageButtonHover: '#cba6f7',
        statusOnline: '#a6e3a1',
        statusStarting: '#f9e2af',
        statusError: '#f38ba8',
        statusOffline: '#585b70'
      },
      cyberpunk: {
        name: 'Cyberpunk Neon',
        desc: 'Electric neon rose and cyan laser highlights on midnight black obsidian.',
        sidebarPrimary: '#ffffff',
        sidebarPrimaryHover: '#f43f5e',
        sidebarSecondary: '#18181b',
        sidebarSecondaryHover: '#27272a',
        sidebarSecondaryActive: '#27272a',
        sidebarSecondarySelected: '#f43f5e',
        sidebarBackground: '#09090b',
        sidebarButtonActive: '#f43f5e',
        pagePrimary: '#f43f5e',
        pagePrimaryHover: '#fb7185',
        pageSecondary: '#121216',
        pageSecondaryHover: '#1c1c22',
        pageSecondaryActive: '#272730',
        pageSecondarySelected: '#f43f5e',
        pageBackground: '#000000',
        pageButtonDefault: '#e11d48',
        pageButtonHover: '#06b6d4',
        statusOnline: '#06b6d4',
        statusStarting: '#eab308',
        statusError: '#f43f5e',
        statusOffline: '#52525b'
      }
    };

    this.defaultConfig = {
      preset: 'default',
      sidebarMode: 'wide', // 'wide' or 'compact'
      sidebarButtonStyle: 'default', // 'default', 'outline', 'line'
      borderRadius: 14,
      borderRadiusSidebar: 12,
      magicPattern: '', // '' (none) or 'cubes', 'tiles', 'rotated-squares', 'zig-zag', etc.
      magicPatternSize: 180,
      alertEnabled: false,
      alertText: '🚀 Welcome to Mpanel Nebula edition! Enjoy high performance server orchestration.',
      alertIcon: 'megaphone',
      alertPosition: 'static',
      alertDismissible: true,
      ...this.presets.default
    };

    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultConfig, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse nebula config from localStorage:', e);
    }
    return { ...this.defaultConfig };
  }

  saveConfig(silent = false) {
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    this.applyConfig(this.config);

    // Save to backend settings API if admin
    if (window.app && window.app.user && window.app.user.role === 'admin') {
      window.app.api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          nebula_config: JSON.stringify(this.config)
        })
      }).then(() => {
        if (!silent && window.app.toast) {
          window.app.toast('Nebula Theme customization saved successfully!', 'success');
        }
      }).catch(err => {
        console.error('Failed to sync nebula config to backend:', err);
      });
    } else if (!silent && window.app && window.app.toast) {
      window.app.toast('Nebula Theme settings saved locally!', 'success');
    }
  }

  applyConfig(cfg = this.config) {
    this.config = { ...this.config, ...cfg };
    const root = document.documentElement;

    // 1. Apply CSS Custom Properties
    const colorProps = [
      'sidebarPrimary', 'sidebarPrimaryHover', 'sidebarSecondary', 'sidebarSecondaryHover',
      'sidebarSecondaryActive', 'sidebarSecondarySelected', 'sidebarBackground', 'sidebarButtonActive',
      'pagePrimary', 'pagePrimaryHover', 'pageBackground', 'pageButtonDefault', 'pageButtonHover',
      'statusOnline', 'statusStarting', 'statusError', 'statusOffline'
    ];

    colorProps.forEach(prop => {
      if (this.config[prop]) {
        root.style.setProperty(`--${prop}`, this.config[prop]);
      }
    });

    // Handle transparency for pageSecondary cards
    const secondaryHex = this.config.pageSecondary || '#1f1e24';
    root.style.setProperty('--pageSecondary', secondaryHex.startsWith('rgba') ? secondaryHex : `${secondaryHex}db`);
    
    const secondaryHoverHex = this.config.pageSecondaryHover || '#2b2f3e';
    root.style.setProperty('--pageSecondaryHover', secondaryHoverHex.startsWith('rgba') ? secondaryHoverHex : `${secondaryHoverHex}e6`);

    // Geometry
    root.style.setProperty('--borderRadius', `${this.config.borderRadius || 14}px`);
    root.style.setProperty('--borderRadiusSidebar', `${this.config.borderRadiusSidebar || 12}px`);
    root.style.setProperty('--patternSizeDashboard', `${this.config.magicPatternSize || 180}px`);

    // 2. Sidebar Mode (Wide vs Compact)
    if (this.config.sidebarMode === 'compact') {
      document.body.classList.add('nebula-sidebar-compact');
      root.classList.add('nebula-sidebar-compact');
    } else {
      document.body.classList.remove('nebula-sidebar-compact');
      root.classList.remove('nebula-sidebar-compact');
    }

    // 3. Sidebar Button Style (Default vs Outline vs Line)
    document.body.classList.remove('nebula-btn-outline', 'nebula-btn-line');
    root.classList.remove('nebula-btn-outline', 'nebula-btn-line');
    if (this.config.sidebarButtonStyle === 'outline') {
      document.body.classList.add('nebula-btn-outline');
      root.classList.add('nebula-btn-outline');
    } else if (this.config.sidebarButtonStyle === 'line') {
      document.body.classList.add('nebula-btn-line');
      root.classList.add('nebula-btn-line');
    }

    // 4. Magic Background Pattern
    const wallLayer = document.getElementById('wallpaper-layer');
    if (wallLayer) {
      // Remove any previous pattern classes
      const patternClasses = Array.from(wallLayer.classList).filter(c => c.startsWith('nebula-pattern-'));
      patternClasses.forEach(c => wallLayer.classList.remove(c));

      if (this.config.magicPattern && this.config.magicPattern !== 'none') {
        wallLayer.classList.add(`nebula-pattern-${this.config.magicPattern}`);
        wallLayer.style.opacity = '0.9';
      } else {
        wallLayer.style.opacity = '1';
      }
    }

    // 5. Render / Update Alert Banner
    this.renderAlertBanner();

    // 6. Refresh Lucide icons if available
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  applyLive(key, value) {
    this.config[key] = value;
    this.applyConfig(this.config);
  }

  applyPreset(presetName) {
    if (!this.presets[presetName]) return;
    const p = this.presets[presetName];
    this.config = {
      ...this.config,
      preset: presetName,
      sidebarPrimary: p.sidebarPrimary,
      sidebarPrimaryHover: p.sidebarPrimaryHover,
      sidebarSecondary: p.sidebarSecondary,
      sidebarSecondaryHover: p.sidebarSecondaryHover,
      sidebarSecondaryActive: p.sidebarSecondaryActive,
      sidebarSecondarySelected: p.sidebarSecondarySelected,
      sidebarBackground: p.sidebarBackground,
      sidebarButtonActive: p.sidebarButtonActive,
      pagePrimary: p.pagePrimary,
      pagePrimaryHover: p.pagePrimaryHover,
      pageSecondary: p.pageSecondary,
      pageSecondaryHover: p.pageSecondaryHover,
      pageSecondaryActive: p.pageSecondaryActive,
      pageSecondarySelected: p.pageSecondarySelected,
      pageBackground: p.pageBackground,
      pageButtonDefault: p.pageButtonDefault,
      pageButtonHover: p.pageButtonHover,
      statusOnline: p.statusOnline,
      statusStarting: p.statusStarting,
      statusError: p.statusError,
      statusOffline: p.statusOffline
    };

    this.applyConfig(this.config);
    this.syncFormInputs();

    if (window.app && window.app.toast) {
      window.app.toast(`Applied ${p.name} preset!`, 'info');
    }
  }

  resetToDefault() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    this.syncFormInputs();
    if (window.app && window.app.toast) {
      window.app.toast('Nebula theme reset to author defaults!', 'info');
    }
  }

  renderAlertBanner() {
    let container = document.getElementById('nebula-alert-banner');
    if (!container) {
      const mainContent = document.getElementById('main-content') || document.getElementById('app-layout-body');
      if (mainContent) {
        container = document.createElement('div');
        container.id = 'nebula-alert-banner';
        mainContent.insertBefore(container, mainContent.firstChild);
      }
    }

    if (!container) return;

    // Check if Nebula is the active theme and alert is enabled
    const isNebula = document.documentElement.classList.contains('theme-nebula');
    const isDismissed = sessionStorage.getItem('nebula_alert_dismissed') === '1';

    if (!isNebula || !this.config.alertEnabled || !this.config.alertText || isDismissed) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');

    const iconMap = {
      megaphone: 'megaphone',
      rocket: 'rocket',
      warning: 'alert-triangle',
      check: 'check-circle-2',
      database: 'database',
      gear: 'settings'
    };

    const iconName = iconMap[this.config.alertIcon] || 'megaphone';
    const isSticky = this.config.alertPosition === 'sticky';

    container.innerHTML = `
      <div class="nebula-alert-wrapper ${isSticky ? 'sticky' : ''}">
        <div class="nebula-alert-container">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="nebula-alert-icon">
              <i data-lucide="${iconName}" class="w-5 h-5 text-purple-400"></i>
            </span>
            <div class="nebula-alert-text">
              ${this.escapeHTML(this.config.alertText)}
            </div>
          </div>
          ${this.config.alertDismissible ? `
            <button onclick="nebulaEditor.dismissAlert()" class="nebula-alert-close text-slate-400 hover:text-white" title="Dismiss announcement">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  dismissAlert() {
    sessionStorage.setItem('nebula_alert_dismissed', '1');
    const container = document.getElementById('nebula-alert-banner');
    if (container) {
      container.classList.add('hidden');
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  syncFormInputs() {
    // Synchronize inputs in settings customizer if currently rendered
    const map = {
      'nebula-color-primary': this.config.pagePrimaryHover,
      'nebula-color-page-bg': this.config.pageBackground,
      'nebula-color-sidebar-bg': this.config.sidebarBackground,
      'nebula-color-sidebar-btn': this.config.sidebarButtonActive,
      'nebula-color-card-bg': this.config.pageSecondary,
      'nebula-color-btn-default': this.config.pageButtonDefault,
      'nebula-color-btn-hover': this.config.pageButtonHover,
      'nebula-color-online': this.config.statusOnline,
      'nebula-color-starting': this.config.statusStarting,
      'nebula-color-error': this.config.statusError,
      'nebula-color-offline': this.config.statusOffline,
      'nebula-sidebar-mode': this.config.sidebarMode,
      'nebula-btn-style': this.config.sidebarButtonStyle,
      'nebula-border-radius': this.config.borderRadius,
      'nebula-sidebar-radius': this.config.borderRadiusSidebar,
      'nebula-pattern-select': this.config.magicPattern,
      'nebula-pattern-size': this.config.magicPatternSize,
      'nebula-alert-toggle': this.config.alertEnabled,
      'nebula-alert-text': this.config.alertText,
      'nebula-alert-icon': this.config.alertIcon,
      'nebula-alert-sticky': this.config.alertPosition === 'sticky',
      'nebula-alert-dismissible': this.config.alertDismissible
    };

    for (const [id, val] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = !!val;
        } else {
          el.value = val;
        }
      }
    }
  }

  /**
   * Open the full-featured Nebula Studio Designer Modal
   */
  openStudio() {
    let modal = document.getElementById('nebula-studio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'nebula-studio-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-[#120f1d] border border-purple-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/60 overflow-hidden">
        <!-- Studio Header -->
        <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151221]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 p-2 flex items-center justify-center">
              <img src="/assets/nebula-logo.svg" alt="Nebula Logo" class="w-full h-full object-contain">
            </div>
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                Nebula Theme Studio & Live Designer
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">v2.0</span>
              </h3>
              <p class="text-xs text-slate-400">Live real-time theme designer, color generator & layout customizer</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="nebulaEditor.saveConfig(); nebulaEditor.closeStudio();" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4"></i> Save & Apply
            </button>
            <button onclick="nebulaEditor.closeStudio()" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- Studio Body with Tabs -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200">
          <!-- 1. Color Palette Presets -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <i data-lucide="palette" class="w-4 h-4"></i> Instant Color Presets
              </h4>
              <span class="text-[11px] text-slate-400">Click any preset for instant live transformation</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              ${Object.entries(this.presets).map(([key, p]) => `
                <div onclick="nebulaEditor.applyPreset('${key}')" class="cursor-pointer p-3 rounded-2xl border transition-all hover:scale-105 flex flex-col justify-between ${this.config.preset === key ? 'border-purple-400 bg-purple-950/30 ring-2 ring-purple-500/40' : 'border-white/10 bg-slate-900/40 hover:border-white/25'}">
                  <div>
                    <div class="h-10 rounded-lg mb-2 overflow-hidden flex shadow-inner">
                      <div class="w-1/3 h-full" style="background-color: ${p.sidebarBackground}"></div>
                      <div class="w-1/3 h-full" style="background-color: ${p.pageBackground}"></div>
                      <div class="w-1/3 h-full" style="background-color: ${p.sidebarButtonActive}"></div>
                    </div>
                    <p class="text-xs font-bold text-white">${p.name}</p>
                  </div>
                  <span class="text-[10px] text-purple-300 font-semibold mt-1 flex items-center gap-1">
                    ${this.config.preset === key ? '✓ Selected' : 'Apply'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Interactive Color Pickers -->
          <div class="pt-4 border-t border-white/10 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <i data-lucide="sliders" class="w-4 h-4"></i> Detailed Color Overrides (Live Preview)
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Page Accent -->
              <div class="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Primary Accent</label>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="studio-color-primary" value="${this.config.pagePrimaryHover}" oninput="nebulaEditor.applyLive('pagePrimaryHover', this.value); nebulaEditor.applyLive('sidebarSecondarySelected', this.value);" class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0">
                  <input type="text" value="${this.config.pagePrimaryHover}" onchange="nebulaEditor.applyLive('pagePrimaryHover', this.value); document.getElementById('studio-color-primary').value = this.value;" class="glass-input text-xs px-2.5 py-1.5 flex-1 font-mono uppercase">
                </div>
              </div>
              <!-- Page Background -->
              <div class="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Page Background</label>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="studio-color-page-bg" value="${this.config.pageBackground}" oninput="nebulaEditor.applyLive('pageBackground', this.value)" class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0">
                  <input type="text" value="${this.config.pageBackground}" onchange="nebulaEditor.applyLive('pageBackground', this.value); document.getElementById('studio-color-page-bg').value = this.value;" class="glass-input text-xs px-2.5 py-1.5 flex-1 font-mono uppercase">
                </div>
              </div>
              <!-- Sidebar Background -->
              <div class="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Sidebar Background</label>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="studio-color-sidebar-bg" value="${this.config.sidebarBackground}" oninput="nebulaEditor.applyLive('sidebarBackground', this.value)" class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0">
                  <input type="text" value="${this.config.sidebarBackground}" onchange="nebulaEditor.applyLive('sidebarBackground', this.value); document.getElementById('studio-color-sidebar-bg').value = this.value;" class="glass-input text-xs px-2.5 py-1.5 flex-1 font-mono uppercase">
                </div>
              </div>
              <!-- Sidebar Active Accent -->
              <div class="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Sidebar Glow Accent</label>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="studio-color-sidebar-btn" value="${this.config.sidebarButtonActive}" oninput="nebulaEditor.applyLive('sidebarButtonActive', this.value)" class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0">
                  <input type="text" value="${this.config.sidebarButtonActive}" onchange="nebulaEditor.applyLive('sidebarButtonActive', this.value); document.getElementById('studio-color-sidebar-btn').value = this.value;" class="glass-input text-xs px-2.5 py-1.5 flex-1 font-mono uppercase">
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Sidebar Layout & Button Styling -->
          <div class="pt-4 border-t border-white/10 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <i data-lucide="layout" class="w-4 h-4"></i> Sidebar Layout & Button Styling
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Mode: Wide vs Compact -->
              <div class="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
                <label class="text-xs font-bold text-white block">Sidebar Width Mode</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" onclick="nebulaEditor.applyLive('sidebarMode', 'wide');" class="px-3 py-2 rounded-xl text-xs font-semibold border transition ${this.config.sidebarMode === 'wide' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">
                    Wide (Full)
                  </button>
                  <button type="button" onclick="nebulaEditor.applyLive('sidebarMode', 'compact');" class="px-3 py-2 rounded-xl text-xs font-semibold border transition ${this.config.sidebarMode === 'compact' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}">
                    Compact (Icons)
                  </button>
                </div>
                <p class="text-[11px] text-slate-400">Choose between full width navigation or minimal icon bar.</p>
              </div>

              <!-- Button Style -->
              <div class="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
                <label class="text-xs font-bold text-white block">Button Active Style</label>
                <select onchange="nebulaEditor.applyLive('sidebarButtonStyle', this.value)" class="glass-input text-xs w-full px-3 py-2 rounded-xl">
                  <option value="default" ${this.config.sidebarButtonStyle === 'default' ? 'selected' : ''}>Default Glow Solid</option>
                  <option value="outline" ${this.config.sidebarButtonStyle === 'outline' ? 'selected' : ''}>Cyber Outline Border</option>
                  <option value="line" ${this.config.sidebarButtonStyle === 'line' ? 'selected' : ''}>Minimal Left Line Accent</option>
                </select>
                <p class="text-[11px] text-slate-400">Active button accent presentation on the navigation bar.</p>
              </div>

              <!-- Border Radius Slider -->
              <div class="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-white block">Card Roundness</label>
                  <span id="studio-radius-val" class="text-xs font-mono text-purple-400">${this.config.borderRadius}px</span>
                </div>
                <input type="range" min="0" max="28" value="${this.config.borderRadius}" oninput="nebulaEditor.applyLive('borderRadius', parseInt(this.value, 10)); document.getElementById('studio-radius-val').innerText = this.value + 'px';" class="w-full accent-purple-500">
                <p class="text-[11px] text-slate-400">Adjust the corner curvature of cards and modals.</p>
              </div>
            </div>
          </div>

          <!-- 4. Magic Background Patterns -->
          <div class="pt-4 border-t border-white/10 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4"></i> Magic Background Patterns (Pure CSS)
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
                <label class="text-xs font-bold text-white block">Pattern Geometric Style</label>
                <select onchange="nebulaEditor.applyLive('magicPattern', this.value)" class="glass-input text-xs w-full px-3 py-2 rounded-xl">
                  <option value="" ${!this.config.magicPattern ? 'selected' : ''}>None (Pure Clean Space)</option>
                  <option value="cubes" ${this.config.magicPattern === 'cubes' ? 'selected' : ''}>3D Isometric Cubes</option>
                  <option value="tiles" ${this.config.magicPattern === 'tiles' ? 'selected' : ''}>Geometric Tiles</option>
                  <option value="rotated-squares" ${this.config.magicPattern === 'rotated-squares' ? 'selected' : ''}>Rotated Cyber Squares</option>
                  <option value="zig-zag" ${this.config.magicPattern === 'zig-zag' ? 'selected' : ''}>Zig-Zag Synth Wave</option>
                  <option value="chevrons" ${this.config.magicPattern === 'chevrons' ? 'selected' : ''}>High Velocity Chevrons</option>
                  <option value="polka" ${this.config.magicPattern === 'polka' ? 'selected' : ''}>Cosmic Polka Matrix</option>
                  <option value="moon" ${this.config.magicPattern === 'moon' ? 'selected' : ''}>Lunar Gradient Spheres</option>
                  <option value="wavy-checkerboard" ${this.config.magicPattern === 'wavy-checkerboard' ? 'selected' : ''}>Wavy Optical Checkerboard</option>
                  <option value="l-shape" ${this.config.magicPattern === 'l-shape' ? 'selected' : ''}>L-Shape Cyber Grid</option>
                </select>
                <p class="text-[11px] text-slate-400">Renders high-speed procedural CSS patterns behind dashboard cards.</p>
              </div>

              <div class="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-white block">Pattern Scale</label>
                  <span id="studio-pattern-val" class="text-xs font-mono text-purple-400">${this.config.magicPatternSize || 180}px</span>
                </div>
                <input type="range" min="60" max="320" value="${this.config.magicPatternSize || 180}" oninput="nebulaEditor.applyLive('magicPatternSize', parseInt(this.value, 10)); document.getElementById('studio-pattern-val').innerText = this.value + 'px';" class="w-full accent-purple-500">
                <p class="text-[11px] text-slate-400">Control the zoom density of the geometric pattern.</p>
              </div>
            </div>
          </div>

          <!-- 5. Nebula Announcement Alert Banner -->
          <div class="pt-4 border-t border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <i data-lucide="megaphone" class="w-4 h-4"></i> Dashboard Announcement Alert Banner
              </h4>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${this.config.alertEnabled ? 'checked' : ''} onchange="nebulaEditor.applyLive('alertEnabled', this.checked)" class="sr-only peer">
                <div class="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2 space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Announcement Text</label>
                <input type="text" value="${this.escapeHTML(this.config.alertText)}" oninput="nebulaEditor.applyLive('alertText', this.value)" class="glass-input text-xs w-full px-3 py-2.5 rounded-xl" placeholder="Write announcement message here...">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-300 block">Alert Icon</label>
                <select onchange="nebulaEditor.applyLive('alertIcon', this.value)" class="glass-input text-xs w-full px-3 py-2.5 rounded-xl">
                  <option value="megaphone" ${this.config.alertIcon === 'megaphone' ? 'selected' : ''}>Megaphone</option>
                  <option value="rocket" ${this.config.alertIcon === 'rocket' ? 'selected' : ''}>Rocket</option>
                  <option value="warning" ${this.config.alertIcon === 'warning' ? 'selected' : ''}>Warning</option>
                  <option value="check" ${this.config.alertIcon === 'check' ? 'selected' : ''}>Success Check</option>
                  <option value="database" ${this.config.alertIcon === 'database' ? 'selected' : ''}>Database</option>
                  <option value="gear" ${this.config.alertIcon === 'gear' ? 'selected' : ''}>Gear Settings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Studio Footer -->
        <div class="px-6 py-4 border-t border-white/10 bg-[#151221] flex items-center justify-between">
          <button type="button" onclick="nebulaEditor.resetToDefault(); nebulaEditor.openStudio();" class="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition flex items-center gap-1.5">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset to Defaults
          </button>
          <div class="flex items-center gap-3">
            <button type="button" onclick="nebulaEditor.closeStudio()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition">
              Close
            </button>
            <button type="button" onclick="nebulaEditor.saveConfig(); nebulaEditor.closeStudio();" class="btn-cyber px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> Save Configuration
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  closeStudio() {
    const modal = document.getElementById('nebula-studio-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// Global instance
window.nebulaEditor = new NebulaEditor();

// Automatically apply configuration on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.nebulaEditor) {
    window.nebulaEditor.applyConfig();
  }
});

