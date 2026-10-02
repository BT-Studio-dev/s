/**
 * McTools - Minecraft Server Utilities Suite
 * Ported from Blueprint Extension: mctools.blueprint (nobita329/Nobita-Cloud)
 * Author: towsifkafi | Maintained by nobita.dev for Mpanel
 */
class McToolsController {
  constructor() {
    this.activeTab = 'motd'; // motd, colorpicker, smalltext, mcids, invlist, emojis, info
    this.activeIdCategory = 'items'; // items, entities, particles, enchantments, effects, sounds
    this.cachedData = {};
    this.searchQuery = '';

    // Color definitions
    this.mcColors = [
      { code: '0', hex: '#000000', name: 'Black', textClass: 'text-black' },
      { code: '1', hex: '#0000AA', name: 'Dark Blue', textClass: 'text-blue-900' },
      { code: '2', hex: '#00AA00', name: 'Dark Green', textClass: 'text-green-800' },
      { code: '3', hex: '#00AAAA', name: 'Dark Aqua', textClass: 'text-cyan-800' },
      { code: '4', hex: '#AA0000', name: 'Dark Red', textClass: 'text-red-800' },
      { code: '5', hex: '#AA00AA', name: 'Dark Purple', textClass: 'text-purple-800' },
      { code: '6', hex: '#FFAA00', name: 'Gold', textClass: 'text-amber-500' },
      { code: '7', hex: '#AAAAAA', name: 'Gray', textClass: 'text-slate-400' },
      { code: '8', hex: '#555555', name: 'Dark Gray', textClass: 'text-slate-600' },
      { code: '9', hex: '#5555FF', name: 'Blue', textClass: 'text-blue-500' },
      { code: 'a', hex: '#55FF55', name: 'Green', textClass: 'text-emerald-400' },
      { code: 'b', hex: '#55FFFF', name: 'Aqua', textClass: 'text-cyan-400' },
      { code: 'c', hex: '#FF5555', name: 'Red', textClass: 'text-rose-400' },
      { code: 'd', hex: '#FF55FF', name: 'Light Purple', textClass: 'text-pink-400' },
      { code: 'e', hex: '#FFFF55', name: 'Yellow', textClass: 'text-yellow-300' },
      { code: 'f', hex: '#FFFFFF', name: 'White', textClass: 'text-white' }
    ];

    this.mcFormats = [
      { code: 'l', name: 'Bold', label: 'Bold' },
      { code: 'o', name: 'Italic', label: 'Italic' },
      { code: 'n', name: 'Underline', label: 'Underline' },
      { code: 'm', name: 'Strikethrough', label: 'Strikethrough' },
      { code: 'k', name: 'Obfuscated', label: 'Magic' },
      { code: 'r', name: 'Reset', label: 'Reset' }
    ];

    // Unicode font replacement maps from mctools SmallText
    this.fontFormats = [
      {
        name: "SmallCaps",
        search: "abcdefghijklmnopqrstuvwxyz",
        replace: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ"
      },
      {
        name: "BigCaps",
        search: "abcdefghijklmnopqrstuvwxyz0123456789",
        replace: "ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ0123456789"
      },
      {
        name: "Bubble",
        search: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        replace: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨"
      },
      {
        name: "Fraktur",
        search: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        replace: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ0123456789"
      },
      {
        name: "Script",
        search: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        replace: "𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵"
      },
      {
        name: "FullWidth",
        search: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        replace: "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９"
      },
      {
        name: "Tiny",
        search: "abcdefghijklmnopqrstuvwxyz",
        replace: "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ"
      },
      {
        name: "Square",
        search: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        replace: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉"
      }
    ];

    this.invTypes = [
      { name: "Chest (Large - 54 Slots)", rows: 6, cols: 9 },
      { name: "Chest (Small - 27 Slots)", rows: 3, cols: 9 },
      { name: "Dispenser / Dropper (9 Slots)", rows: 3, cols: 3 },
      { name: "Hopper (5 Slots)", rows: 1, cols: 5 },
      { name: "Furnace (3 Slots: Input, Fuel, Result)", custom: 'furnace' },
      { name: "Brewing Stand (5 Slots)", custom: 'brewing' },
      { name: "Anvil (3 Slots)", custom: 'anvil' }
    ];
  }

  async fetchData(type) {
    if (this.cachedData[type]) return this.cachedData[type];
    try {
      const res = await fetch(`/api/marketplace/mctools/data/${type}`);
      if (res.ok) {
        const json = await res.json();
        this.cachedData[type] = json.data || [];
        return this.cachedData[type];
      }
    } catch (e) {
      console.warn(`[McTools] Failed to load data/${type}:`, e);
    }
    return [];
  }

  renderView(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Top Hero Card -->
        <div class="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-slate-900/60 shadow-2xl relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                  <i data-lucide="wrench" class="w-3.5 h-3.5"></i> Blueprint Extension
                </span>
                <span class="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  v1.0.1
                </span>
                <span class="text-[10px] text-slate-400 font-mono">by towsifkafi • nobita329</span>
              </div>
              <h2 class="text-2xl font-black text-white flex items-center gap-2">
                🛠️ McTools - Minecraft Server Utilities Suite
              </h2>
              <p class="text-xs text-slate-300 max-w-3xl">
                Ported directly from <code class="text-indigo-300">mctools.blueprint</code>. Real-time MOTD generator, Minecraft color codes, 1,200+ item & entity IDs directory, small text styler, sound explorer, and inventory maps.
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <a href="/downloads/mctools.blueprint" download="mctools.blueprint" class="btn-cyber px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95" title="Download raw mctools.blueprint file">
                <i data-lucide="download" class="w-4 h-4"></i> Download .blueprint
              </a>
              <a href="https://github.com/nobita329/Nobita-Cloud/blob/main/thame/Extension/mctools.blueprint" target="_blank" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition flex items-center gap-1.5" title="View Source on GitHub">
                <i data-lucide="github" class="w-4 h-4"></i> GitHub
              </a>
            </div>
          </div>
        </div>

        <!-- Sub-Navigation Bar -->
        <div class="glass-panel p-1.5 rounded-2xl border border-white/10 flex flex-wrap gap-1.5 bg-slate-900/60">
          <button onclick="mctools.switchTab('motd')" id="mct-tab-motd" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'motd' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="palette" class="w-3.5 h-3.5"></i> MOTD & Colored Text
          </button>
          <button onclick="mctools.switchTab('colorpicker')" id="mct-tab-colorpicker" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'colorpicker' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="pipette" class="w-3.5 h-3.5"></i> Color Palette & Codes
          </button>
          <button onclick="mctools.switchTab('smalltext')" id="mct-tab-smalltext" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'smalltext' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="type" class="w-3.5 h-3.5"></i> Small Text & Fonts
          </button>
          <button onclick="mctools.switchTab('mcids')" id="mct-tab-mcids" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'mcids' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="database" class="w-3.5 h-3.5"></i> Minecraft IDs Directory
          </button>
          <button onclick="mctools.switchTab('invlist')" id="mct-tab-invlist" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'invlist' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Inventory Slots Map
          </button>
          <button onclick="mctools.switchTab('emojis')" id="mct-tab-emojis" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'emojis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="smile" class="w-3.5 h-3.5"></i> Symbols & Emojis
          </button>
          <button onclick="mctools.switchTab('info')" id="mct-tab-info" class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${this.activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5'}">
            <i data-lucide="info" class="w-3.5 h-3.5"></i> Extension Info
          </button>
        </div>

        <!-- Tab Body Container -->
        <div id="mctools-tab-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.renderCurrentTab();
  }

  switchTab(tab) {
    this.activeTab = tab;
    ['motd', 'colorpicker', 'smalltext', 'mcids', 'invlist', 'emojis', 'info'].forEach(t => {
      const btn = document.getElementById(`mct-tab-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition bg-indigo-600 text-white shadow-lg shadow-indigo-600/30';
        } else {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-slate-300 hover:bg-white/5';
        }
      }
    });
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    const container = document.getElementById('mctools-tab-content');
    if (!container) return;

    switch (this.activeTab) {
      case 'motd':
        this.renderMotdTab(container);
        break;
      case 'colorpicker':
        this.renderColorPickerTab(container);
        break;
      case 'smalltext':
        this.renderSmallTextTab(container);
        break;
      case 'mcids':
        this.renderMcIdsTab(container);
        break;
      case 'invlist':
        this.renderInvListTab(container);
        break;
      case 'emojis':
        this.renderEmojisTab(container);
        break;
      case 'info':
        this.renderInfoTab(container);
        break;
    }

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================
  // TAB 1: MOTD & Colored Text Generator
  // ==========================================
  renderMotdTab(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Editor Left Column -->
        <div class="lg:col-span-7 space-y-4">
          <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="edit-3" class="w-4 h-4 text-indigo-400"></i> Text Input
              </span>
              <div class="flex items-center gap-1.5">
                <button onclick="mctools.insertTemplate('default')" class="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition">Template 1</button>
                <button onclick="mctools.insertTemplate('modern')" class="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition">Template 2</button>
                <button onclick="mctools.clearMotd()" class="text-[10px] px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition">Clear</button>
              </div>
            </div>

            <!-- Color Palette Swatches -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-mono text-slate-400">Click a color code to insert:</span>
              <div class="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                ${this.mcColors.map(c => `
                  <button type="button" onclick="mctools.insertColor('&${c.code}')" class="h-8 rounded-lg border border-white/20 shadow flex items-center justify-center font-mono font-black text-xs transition hover:scale-110 active:scale-95 text-shadow" style="background-color: ${c.hex}; color: ${c.code === '0' || c.code === '8' ? '#ffffff' : '#000000'};" title="&${c.code} (${c.name})">
                    &${c.code}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Formatting Codes -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              ${this.mcFormats.map(f => `
                <button type="button" onclick="mctools.insertColor('&${f.code}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-[11px] font-mono font-bold transition hover:scale-105" title="&${f.code} - ${f.name}">
                  &${f.code} (${f.label})
                </button>
              `).join('')}
            </div>

            <!-- Main Input Area -->
            <div class="relative">
              <textarea id="mctools-motd-input" oninput="mctools.updateMotdPreview()" rows="5" class="w-full glass-input p-3.5 rounded-xl font-mono text-xs text-white resize-none" placeholder="Enter your text with & codes, e.g.:&#10;&a&lNOBITA CLOUD &7» &bSurvival 1.21.x&#10;&e⚡ 50% SALE &7| &dplay.nobitahost.in">&a&lNOBITA HOST &7» &bCustom Minecraft Network&#10;&e✦ Join Now: &fplay.nobitahost.in &a[1.20 - 1.21.x]</textarea>
            </div>
          </div>
        </div>

        <!-- Preview & Copy Outputs Right Column -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Server List MOTD Preview Card -->
          <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 bg-[#0a0c10]">
            <div class="flex items-center justify-between pb-2 border-b border-white/5">
              <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <i data-lucide="monitor" class="w-4 h-4 text-cyan-400"></i> Server List Preview
              </span>
              <div class="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <span>124/500</span>
                <span class="flex items-end gap-0.5 h-3">
                  <span class="w-0.5 h-1 bg-emerald-400 rounded-full"></span>
                  <span class="w-0.5 h-2 bg-emerald-400 rounded-full"></span>
                  <span class="w-0.5 h-3 bg-emerald-400 rounded-full"></span>
                </span>
              </div>
            </div>

            <!-- Simulated Minecraft Server Card -->
            <div class="p-3 rounded-xl bg-black/80 border border-white/10 flex items-start gap-3 select-none">
              <div class="w-12 h-12 rounded-lg bg-slate-800 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/assets/favicon.svg" class="w-10 h-10 object-contain" alt="Server Icon">
              </div>
              <div class="min-w-0 flex-1 font-mono text-xs leading-relaxed" id="mctools-motd-live-preview">
                <!-- Preview injected via JS -->
              </div>
            </div>
          </div>

          <!-- Copyable Export Formats -->
          <div class="glass-panel p-4 rounded-2xl border border-white/10 space-y-2.5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider block">Copy Formatted Outputs</span>

            <div class="space-y-2">
              <div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Legacy (& Format - server.properties / Bungee):</span>
                  <button onclick="mctools.copyOutput('legacy')" class="text-indigo-400 hover:underline">Copy &</button>
                </div>
                <input type="text" id="mctools-out-legacy" readonly class="w-full glass-input px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              </div>

              <div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Section (§ Format - Essentials / Spigot):</span>
                  <button onclick="mctools.copyOutput('section')" class="text-indigo-400 hover:underline">Copy §</button>
                </div>
                <input type="text" id="mctools-out-section" readonly class="w-full glass-input px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              </div>

              <div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Tellraw / JSON Format:</span>
                  <button onclick="mctools.copyOutput('json')" class="text-indigo-400 hover:underline">Copy JSON</button>
                </div>
                <input type="text" id="mctools-out-json" readonly class="w-full glass-input px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateMotdPreview();
  }

  insertColor(code) {
    const textarea = document.getElementById('mctools-motd-input');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + code + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + code.length;
    this.updateMotdPreview();
  }

  insertTemplate(tpl) {
    const textarea = document.getElementById('mctools-motd-input');
    if (!textarea) return;
    if (tpl === 'default') {
      textarea.value = `&a&lNOBITA HOST &7» &bCustom Minecraft Network\n&e✦ Join Now: &fplay.nobitahost.in &a[1.20 - 1.21.x]`;
    } else {
      textarea.value = `&c&l⚔ HARDCORE SMP &7| &eSEASON 4\n&d⚡ 50% OFF RANKS &7» &bstore.nobitahost.in`;
    }
    this.updateMotdPreview();
  }

  clearMotd() {
    const textarea = document.getElementById('mctools-motd-input');
    if (!textarea) return;
    textarea.value = '';
    this.updateMotdPreview();
  }

  updateMotdPreview() {
    const textarea = document.getElementById('mctools-motd-input');
    const preview = document.getElementById('mctools-motd-live-preview');
    const outLegacy = document.getElementById('mctools-out-legacy');
    const outSection = document.getElementById('mctools-out-section');
    const outJson = document.getElementById('mctools-out-json');
    if (!textarea) return;

    const raw = textarea.value;
    if (outLegacy) outLegacy.value = raw.replace(/\n/g, '\\n');
    if (outSection) outSection.value = raw.replace(/&([0-9a-fk-or])/gi, '§$1').replace(/\n/g, '\\n');

    // Generate JSON
    if (outJson) {
      const jsonArr = [{ text: raw.replace(/\n/g, '\n') }];
      outJson.value = JSON.stringify(jsonArr);
    }

    // Generate HTML for live Minecraft preview
    if (preview) {
      const lines = raw.split('\n');
      const htmlLines = lines.slice(0, 2).map(line => this.parseMinecraftColors(line));
      preview.innerHTML = htmlLines.join('<br>') || '<span class="text-slate-500">A Minecraft Server</span>';
    }
  }

  parseMinecraftColors(text) {
    if (!text) return '';
    const colorMap = {
      '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
      '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
      '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
      'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
    };

    let curColor = '#FFFFFF';
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isStrike = false;

    let result = '';
    let i = 0;

    while (i < text.length) {
      if ((text[i] === '&' || text[i] === '§') && i + 1 < text.length) {
        const code = text[i + 1].toLowerCase();
        if (colorMap[code]) {
          curColor = colorMap[code];
          isBold = false;
          isItalic = false;
          isUnderline = false;
          isStrike = false;
          i += 2;
          continue;
        } else if (code === 'l') {
          isBold = true;
          i += 2;
          continue;
        } else if (code === 'o') {
          isItalic = true;
          i += 2;
          continue;
        } else if (code === 'n') {
          isUnderline = true;
          i += 2;
          continue;
        } else if (code === 'm') {
          isStrike = true;
          i += 2;
          continue;
        } else if (code === 'r') {
          curColor = '#FFFFFF';
          isBold = false;
          isItalic = false;
          isUnderline = false;
          isStrike = false;
          i += 2;
          continue;
        }
      }

      // Normal char
      let style = `color: ${curColor};`;
      if (isBold) style += ' font-weight: bold;';
      if (isItalic) style += ' font-style: italic;';
      let dec = '';
      if (isUnderline) dec += ' underline';
      if (isStrike) dec += ' line-through';
      if (dec) style += ` text-decoration:${dec};`;

      const char = text[i] === ' ' ? '&nbsp;' : escapeHtml(text[i]);
      result += `<span style="${style}">${char}</span>`;
      i++;
    }

    return result;
  }

  copyOutput(format) {
    let el;
    if (format === 'legacy') el = document.getElementById('mctools-out-legacy');
    if (format === 'section') el = document.getElementById('mctools-out-section');
    if (format === 'json') el = document.getElementById('mctools-out-json');

    if (el && el.value) {
      navigator.clipboard.writeText(el.value);
      if (window.app && typeof app.toast === 'function') {
        app.toast(`Copied ${format.toUpperCase()} format to clipboard!`, 'success');
      }
    }
  }

  // ==========================================
  // TAB 2: Color Palette & Codes
  // ==========================================
  renderColorPickerTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Palette Overview Card -->
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-white/5">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="palette" class="w-4 h-4 text-emerald-400"></i> Standard Minecraft Colors (§0 - §f)
            </span>
            <span class="text-[10px] text-slate-400">Click any card to copy code</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            ${this.mcColors.map(c => `
              <div onclick="mctools.copyColor('&${c.code}')" class="glass-card p-3 rounded-xl border border-white/10 flex flex-col justify-between space-y-2 cursor-pointer transition hover:scale-105 hover:border-indigo-400 active:scale-95 group">
                <div class="w-full h-12 rounded-lg shadow-inner flex items-center justify-center font-mono font-black text-sm text-shadow" style="background-color: ${c.hex}; color: ${c.code === '0' || c.code === '8' ? '#ffffff' : '#000000'};">
                  &${c.code}
                </div>
                <div>
                  <div class="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">${c.name}</div>
                  <div class="text-[10px] font-mono text-slate-400">${c.hex}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Custom Hex Color Converter Card -->
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="pipette" class="w-4 h-4 text-cyan-400"></i> Custom RGB / Hex Color Converter
          </span>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="text-xs text-slate-300">Pick Custom Color:</label>
              <div class="flex items-center gap-3">
                <input type="color" id="mct-hex-picker" value="#00AAAA" oninput="mctools.onCustomColorPick(this.value)" class="w-14 h-12 rounded-xl bg-transparent cursor-pointer border border-white/20">
                <input type="text" id="mct-hex-text" value="#00AAAA" oninput="mctools.onCustomColorPick(this.value)" class="glass-input px-3.5 py-2.5 rounded-xl font-mono text-sm text-cyan-300 w-36">
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <span class="text-[11px] text-slate-400">Minecraft Format Codes:</span>
              <div class="space-y-1.5 font-mono text-xs">
                <div class="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
                  <span class="text-slate-300">Hex Format: <strong id="mct-hex-fmt" class="text-cyan-400">&#00AAAA</strong></span>
                  <button onclick="mctools.copyText(document.getElementById('mct-hex-fmt').textContent)" class="text-indigo-400 hover:underline text-[10px]">Copy</button>
                </div>
                <div class="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
                  <span class="text-slate-300">Bungee Hex: <strong id="mct-bungee-fmt" class="text-cyan-400">&x&0&0&a&a&a&a</strong></span>
                  <button onclick="mctools.copyText(document.getElementById('mct-bungee-fmt').textContent)" class="text-indigo-400 hover:underline text-[10px]">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  onCustomColorPick(val) {
    const textInput = document.getElementById('mct-hex-text');
    const colorPicker = document.getElementById('mct-hex-picker');
    const hexFmt = document.getElementById('mct-hex-fmt');
    const bungeeFmt = document.getElementById('mct-bungee-fmt');

    let hex = val.replace('#', '').toUpperCase();
    if (hex.length === 6) {
      if (textInput && textInput !== document.activeElement) textInput.value = '#' + hex;
      if (colorPicker && colorPicker !== document.activeElement) colorPicker.value = '#' + hex;
      if (hexFmt) hexFmt.textContent = `&#${hex}`;
      if (bungeeFmt) {
        const b = `&x&${hex[0]}&${hex[1]}&${hex[2]}&${hex[3]}&${hex[4]}&${hex[5]}`.toLowerCase();
        bungeeFmt.textContent = b;
      }
    }
  }

  copyColor(code) {
    this.copyText(code);
  }

  copyText(txt) {
    navigator.clipboard.writeText(txt);
    if (window.app && typeof app.toast === 'function') {
      app.toast(`Copied "${txt}" to clipboard!`, 'success');
    }
  }

  // ==========================================
  // TAB 3: Small Text & Font Styler
  // ==========================================
  renderSmallTextTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="type" class="w-4 h-4 text-purple-400"></i> Minecraft Unicode Font Generator
            </span>
            <p class="text-xs text-slate-400">Type any text below to convert it into Minecraft-supported small caps, bubble, and decorative fonts.</p>
          </div>

          <div class="relative">
            <input type="text" id="mct-font-input" oninput="mctools.updateFontOutputs(this.value)" value="NobitaHost Network" class="w-full glass-input px-4 py-3 rounded-xl font-mono text-sm text-white" placeholder="Type text here...">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="mct-font-results">
            <!-- Results populated via JS -->
          </div>
        </div>
      </div>
    `;

    this.updateFontOutputs("NobitaHost Network");
  }

  updateFontOutputs(text) {
    const results = document.getElementById('mct-font-results');
    if (!results) return;

    results.innerHTML = this.fontFormats.map(fmt => {
      let converted = '';
      for (const char of text) {
        const idx = fmt.search.indexOf(char);
        if (idx !== -1 && idx < fmt.replace.length) {
          converted += fmt.replace[idx];
        } else {
          converted += char;
        }
      }

      return `
        <div class="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-3 hover:border-indigo-400/50 transition group">
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-0.5">${fmt.name}</span>
            <div class="text-sm font-bold text-white truncate">${escapeHtml(converted)}</div>
          </div>
          <button onclick="mctools.copyText('${escapeHtml(converted).replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-mono text-xs flex items-center gap-1 shrink-0 transition active:scale-95">
            <i data-lucide="copy" class="w-3 h-3"></i> Copy
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================
  // TAB 4: Minecraft IDs Explorer
  // ==========================================
  async renderMcIdsTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="database" class="w-4 h-4 text-cyan-400"></i> Registry IDs Explorer
              </span>
            </div>

            <!-- Sub Category Tabs -->
            <div class="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
              ${['items', 'entities', 'particles', 'enchantments', 'effects', 'sounds'].map(cat => `
                <button onclick="mctools.switchIdCategory('${cat}')" id="mct-idcat-${cat}" class="px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${this.activeIdCategory === cat ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Search Filter Bar -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text" id="mct-ids-search" oninput="mctools.filterIds(this.value)" placeholder="Search Minecraft ${this.activeIdCategory}..." class="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs text-white">
          </div>

          <!-- Grid Container -->
          <div id="mct-ids-grid-container" class="min-h-[300px]">
            <div class="flex items-center justify-center py-12 text-slate-400 text-xs">
              <i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> Loading Registry Data...
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.loadIdCategoryData();
  }

  async switchIdCategory(cat) {
    this.activeIdCategory = cat;
    ['items', 'entities', 'particles', 'enchantments', 'effects', 'sounds'].forEach(c => {
      const btn = document.getElementById(`mct-idcat-${c}`);
      if (btn) {
        btn.className = c === cat
          ? 'px-3 py-1 rounded-lg text-xs font-bold capitalize transition bg-cyan-600 text-white shadow'
          : 'px-3 py-1 rounded-lg text-xs font-bold capitalize transition text-slate-400 hover:text-white';
      }
    });
    const searchInput = document.getElementById('mct-ids-search');
    if (searchInput) searchInput.placeholder = `Search Minecraft ${cat}...`;
    await this.loadIdCategoryData();
  }

  async loadIdCategoryData() {
    const grid = document.getElementById('mct-ids-grid-container');
    if (!grid) return;

    grid.innerHTML = `
      <div class="flex items-center justify-center py-12 text-slate-400 text-xs">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2 text-cyan-400"></i> Loading ${this.activeIdCategory}...
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const data = await this.fetchData(this.activeIdCategory);
    this.renderIdGrid(data);
  }

  filterIds(q) {
    const raw = this.cachedData[this.activeIdCategory] || [];
    const lower = (q || '').toLowerCase().trim();
    if (!lower) {
      this.renderIdGrid(raw);
      return;
    }

    const filtered = raw.filter(item => {
      const name = (item.name || item.displayName || item.newID || '').toLowerCase();
      const id = String(item.id || item.legacyID || '').toLowerCase();
      return name.includes(lower) || id.includes(lower);
    });

    this.renderIdGrid(filtered);
  }

  renderIdGrid(items) {
    const grid = document.getElementById('mct-ids-grid-container');
    if (!grid) return;

    if (!items || items.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-12 text-slate-400 text-xs">
          No matching ${this.activeIdCategory} found.
        </div>
      `;
      return;
    }

    // Limit to first 120 items for snappy DOM performance
    const sliced = items.slice(0, 120);

    grid.innerHTML = `
      <div class="text-[11px] text-slate-400 mb-2">Showing ${sliced.length} of ${items.length} ${this.activeIdCategory} (Click to copy identifier)</div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
        ${sliced.map(item => {
          const identifier = item.newID ? `minecraft:${item.newID}` : (item.name ? (item.name.includes(':') ? item.name : `minecraft:${item.name}`) : `minecraft:${item.id}`);
          const display = item.displayName || item.name || item.newID || item.id;
          const sub = item.category || (item.legacyID ? `Legacy ID: ${item.legacyID}` : (item.maxLevel ? `Max Level: ${item.maxLevel}` : ''));

          return `
            <div onclick="mctools.copyText('${escapeHtml(identifier)}')" class="p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex flex-col justify-between group active:scale-95 shadow-sm">
              <div class="min-w-0">
                <div class="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">${escapeHtml(display)}</div>
                <div class="text-[10px] font-mono text-cyan-400/80 truncate mt-0.5">${escapeHtml(identifier)}</div>
              </div>
              ${sub ? `<div class="text-[9px] text-slate-400 truncate mt-1.5">${escapeHtml(sub)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ==========================================
  // TAB 5: Inventory Slots Map
  // ==========================================
  renderInvListTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="space-y-1">
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="layout-grid" class="w-4 h-4 text-amber-400"></i> Minecraft Inventory GUI Slot Maps
            </span>
            <p class="text-xs text-slate-400">Reference slot IDs (0, 1, 2...) for Spigot, Paper, Skript, and custom GUI plugin menus.</p>
          </div>

          <div class="space-y-6">
            <!-- Large Chest (54 slots) -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Large Chest GUI (6 Rows • 54 Slots: 0 - 53)</span>
                <span class="text-[10px] font-mono text-cyan-400">Size: 54</span>
              </div>
              <div class="grid grid-cols-9 gap-1 p-2 rounded-xl bg-black/60 border border-white/5 max-w-lg">
                ${Array.from({ length: 54 }, (_, i) => `
                  <div onclick="mctools.copyText('${i}')" class="aspect-square rounded border border-white/10 bg-slate-800/80 hover:bg-amber-500 hover:text-black hover:border-amber-400 font-mono text-[10px] flex items-center justify-center text-slate-400 transition cursor-pointer select-none" title="Slot ${i} (Click to copy)">
                    ${i}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Small Chest (27 slots) -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Small Chest GUI (3 Rows • 27 Slots: 0 - 26)</span>
                <span class="text-[10px] font-mono text-cyan-400">Size: 27</span>
              </div>
              <div class="grid grid-cols-9 gap-1 p-2 rounded-xl bg-black/60 border border-white/5 max-w-lg">
                ${Array.from({ length: 27 }, (_, i) => `
                  <div onclick="mctools.copyText('${i}')" class="aspect-square rounded border border-white/10 bg-slate-800/80 hover:bg-amber-500 hover:text-black hover:border-amber-400 font-mono text-[10px] flex items-center justify-center text-slate-400 transition cursor-pointer select-none" title="Slot ${i} (Click to copy)">
                    ${i}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Hopper / Dispenser -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <span class="text-xs font-bold text-white block">Dispenser / Dropper (9 Slots: 0 - 8)</span>
                <div class="grid grid-cols-3 gap-1 p-2 rounded-xl bg-black/60 border border-white/5 w-32">
                  ${Array.from({ length: 9 }, (_, i) => `
                    <div onclick="mctools.copyText('${i}')" class="aspect-square rounded border border-white/10 bg-slate-800/80 hover:bg-amber-500 hover:text-black font-mono text-[10px] flex items-center justify-center text-slate-400 transition cursor-pointer select-none" title="Slot ${i}">
                      ${i}
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <span class="text-xs font-bold text-white block">Hopper GUI (5 Slots: 0 - 4)</span>
                <div class="grid grid-cols-5 gap-1 p-2 rounded-xl bg-black/60 border border-white/5 w-52">
                  ${Array.from({ length: 5 }, (_, i) => `
                    <div onclick="mctools.copyText('${i}')" class="aspect-square rounded border border-white/10 bg-slate-800/80 hover:bg-amber-500 hover:text-black font-mono text-[10px] flex items-center justify-center text-slate-400 transition cursor-pointer select-none" title="Slot ${i}">
                      ${i}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // TAB 6: Symbols & Emojis
  // ==========================================
  async renderEmojisTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="smile" class="w-4 h-4 text-pink-400"></i> Minecraft Supported Symbols & Emojis
            </span>
            <span class="text-[10px] text-slate-400">Click any symbol to copy</span>
          </div>

          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text" id="mct-emoji-search" oninput="mctools.filterEmojis(this.value)" placeholder="Search symbols (heart, star, sword, skull, pickaxe)..." class="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs text-white">
          </div>

          <div id="mct-emojis-grid" class="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
            <div class="col-span-full text-center py-12 text-slate-400 text-xs">
              <i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> Loading Symbols...
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    const data = await this.fetchData('emojis');
    this.renderEmojisGrid(data);
  }

  filterEmojis(q) {
    const raw = this.cachedData['emojis'] || [];
    const lower = (q || '').toLowerCase().trim();
    if (!lower) {
      this.renderEmojisGrid(raw);
      return;
    }
    const filtered = raw.filter(e => (e.name || '').toLowerCase().includes(lower) || (e.emoji || '').includes(lower));
    this.renderEmojisGrid(filtered);
  }

  renderEmojisGrid(list) {
    const grid = document.getElementById('mct-emojis-grid');
    if (!grid) return;

    if (!list || list.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-xs">No matching symbols found.</div>`;
      return;
    }

    const sliced = list.slice(0, 180);
    grid.innerHTML = sliced.map(e => `
      <button type="button" onclick="mctools.copyText('${escapeHtml(e.emoji)}')" class="aspect-square rounded-xl bg-slate-900/80 border border-white/10 hover:border-pink-500/50 hover:bg-slate-800 transition flex flex-col items-center justify-center p-2 group shadow-sm active:scale-95" title="${escapeHtml(e.name || '')} (${e.emoji})">
        <span class="text-lg text-white group-hover:scale-125 transition select-none">${e.emoji}</span>
        <span class="text-[8px] font-mono text-slate-400 truncate w-full text-center mt-1">${escapeHtml(e.name || '')}</span>
      </button>
    `).join('');
  }

  // ==========================================
  // TAB 7: Extension Info
  // ==========================================
  renderInfoTab(container) {
    container.innerHTML = `
      <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl">
            🛠️
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              McTools Blueprint Extension
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.0.1</span>
            </h3>
            <p class="text-xs text-slate-400 font-mono">identifier: mctools • target: beta-2024-12</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <span class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="package" class="w-4 h-4 text-cyan-400"></i> Package Details
            </span>
            <ul class="text-xs text-slate-300 space-y-1.5">
              <li><strong>Extension Name:</strong> McTools</li>
              <li><strong>Author:</strong> towsifkafi</li>
              <li><strong>Mpanel Integration:</strong> nobita.dev</li>
              <li><strong>File:</strong> <code>mctools.blueprint</code> (352 KB)</li>
              <li><strong>Framework:</strong> Blueprint Extension Engine</li>
            </ul>
          </div>

          <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <span class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i> Included Features
            </span>
            <ul class="text-xs text-slate-300 space-y-1.5">
              <li>✓ Live MOTD & Colored Text Generator (Sign, Book, Chat)</li>
              <li>✓ 16 Standard Minecraft Colors & Custom Hex Picker</li>
              <li>✓ 1,228 Items, 149 Entities, 113 Particles Registry</li>
              <li>✓ 1,651 Sound Events & 42 Enchantments</li>
              <li>✓ SmallCaps & Unicode Decorative Font Styler</li>
              <li>✓ Interactive Slot Map for 7 Inventory Types</li>
            </ul>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div class="space-y-0.5">
            <div class="text-xs font-bold text-white">Repository Source</div>
            <div class="text-[11px] text-slate-400 font-mono break-all">https://github.com/nobita329/Nobita-Cloud/blob/main/thame/Extension/mctools.blueprint</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a href="/downloads/mctools.blueprint" download="mctools.blueprint" class="btn-cyber px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Download File
            </a>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }
}

window.mctools = new McToolsController();

