// Background Music Player Controller
class MusicPlayer {
  constructor() {
    this.audio = document.getElementById('global-audio-element');
    this.isPlaying = false;
    this.currentTrack = '';
    this.volume = 0.3;
    this.init();
  }

  init() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.id = 'global-audio-element';
      this.audio.loop = true;
    }
    this.audio.volume = this.volume;

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUI();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio stream error or autoplay restricted.');
      this.isPlaying = false;
      this.updateUI();
    });
  }

  setupTrack(url, title = 'Background Lounge Audio', volume = 30) {
    if (!url) {
      const bar = document.getElementById('music-player-bar');
      if (bar) bar.classList.add('hidden');
      return;
    }

    const bar = document.getElementById('music-player-bar');
    if (bar) bar.classList.remove('hidden');

    this.currentTrack = url;
    const trackTitleEl = document.getElementById('music-track-title');
    if (trackTitleEl) trackTitleEl.innerText = title;
    this.setVolume(volume);

    if (this.audio.src !== url) {
      this.audio.src = url;
    }
  }

  togglePlay() {
    if (!this.audio.src || this.audio.src === window.location.href) {
      // Default Lo-Fi Chill Synth stream if no custom track set
      this.audio.src = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
      const trackTitleEl = document.getElementById('music-track-title');
      if (trackTitleEl) trackTitleEl.innerText = 'Lofi Beats Chill Stream';
    }

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(err => {
        console.warn('User interaction required for autoplay:', err);
      });
    }
  }

  setVolume(val) {
    this.volume = val / 100;
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    const slider = document.getElementById('music-volume-slider');
    if (slider) slider.value = val;
  }

  updateUI() {
    const icon = document.getElementById('music-play-icon');
    const headerBtn = document.getElementById('header-music-btn');

    if (icon) {
      icon.setAttribute('data-lucide', this.isPlaying ? 'pause' : 'play');
    }

    if (headerBtn) {
      if (this.isPlaying) {
        headerBtn.classList.add('text-cyan-400', 'border-cyan-500/40', 'bg-cyan-500/10');
      } else {
        headerBtn.classList.remove('text-cyan-400', 'border-cyan-500/40', 'bg-cyan-500/10');
      }
    }

    if (window.lucide) lucide.createIcons();
  }
}

window.musicPlayer = new MusicPlayer();

