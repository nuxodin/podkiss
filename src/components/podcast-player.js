import { html } from 'https://esm.sh/htm@3.1.1/preact/index.mjs';
import { Component } from 'https://unpkg.com/preact@10.15.1/dist/preact.module.js';
import { AudioPlayer } from '../services/audio-player.js';

export class PodcastPlayer extends Component {
  state = {
    currentTime: 0,
    duration: 0,
    progress: 0,
    isPlaying: false,
    playbackRate: 1,
    currentEpisode: null,
    error: null,
    showPlaybackRateOptions: false
  };

  componentDidMount() {
    this.unsubscribe = AudioPlayer.addEventListener(state => {
      this.setState(state);
    });

    // Tastaturkürzel für die Steuerung
    document.addEventListener('keydown', this.handleKeyboardShortcuts);
  }

  componentWillUnmount() {
    this.unsubscribe?.();
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
  }

  handleKeyboardShortcuts = (e) => {
    // Nur ausführen, wenn keine Modaltaste gedrückt ist und kein Input-Feld fokussiert ist
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || 
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case ' ': // Leertaste
        e.preventDefault();
        this.handlePlayPause();
        break;
      case 'ArrowLeft': // Pfeil nach links
        e.preventDefault();
        this.handleSkipBackward();
        break;
      case 'ArrowRight': // Pfeil nach rechts
        e.preventDefault();
        this.handleSkipForward();
        break;
      case '>': // Wiedergabegeschwindigkeit erhöhen
      case '.':
        e.preventDefault();
        this.handleChangePlaybackRate('up');
        break;
      case '<': // Wiedergabegeschwindigkeit verringern
      case ',':
        e.preventDefault();
        this.handleChangePlaybackRate('down');
        break;
    }
  };

  formatTime(seconds) {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  handlePlayPause = () => {
    AudioPlayer.togglePlayPause();
  };

  handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    AudioPlayer.seek(time);
  };

  handleSkipForward = () => {
    AudioPlayer.skipForward(30);
  };

  handleSkipBackward = () => {
    AudioPlayer.skipBackward(10);
  };

  handleChangePlaybackRate = (direction) => {
    AudioPlayer.changePlaybackRate(direction);
    this.setState({ showPlaybackRateOptions: false });
  };

  togglePlaybackRateOptions = () => {
    this.setState(state => ({
      showPlaybackRateOptions: !state.showPlaybackRateOptions
    }));
  };

  renderPlaybackRateOptions() {
    const { showPlaybackRateOptions, playbackRate } = this.state;
    
    if (!showPlaybackRateOptions) return null;
    
    return html`
      <div class="playback-rate-popup">
        <div class="playback-rate-options">
          <button 
            class=${playbackRate === 0.5 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('down')}
          >
            0.5x
          </button>
          <button 
            class=${playbackRate === 0.75 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('down')}
          >
            0.75x
          </button>
          <button 
            class=${playbackRate === 1.0 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('normal')}
          >
            1.0x
          </button>
          <button 
            class=${playbackRate === 1.25 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('up')}
          >
            1.25x
          </button>
          <button 
            class=${playbackRate === 1.5 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('up')}
          >
            1.5x
          </button>
          <button 
            class=${playbackRate === 1.75 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('up')}
          >
            1.75x
          </button>
          <button 
            class=${playbackRate === 2.0 ? 'active' : ''}
            onClick=${() => AudioPlayer.changePlaybackRate('up')}
          >
            2.0x
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const { episode } = this.props;
    const { currentTime, duration, isPlaying, progress, playbackRate, error } = this.state;

    if (!episode) return null;

    return html`
      <div class="fixed-player">
        ${error && html`
          <div class="player-error">
            <p>${error.message || 'Fehler beim Abspielen der Episode'}</p>
          </div>
        `}
        
        <div class="player-info">
          ${episode.imageUrl && html`
            <img 
              src=${episode.imageUrl}
              alt=${episode.title}
              class="player-cover"
            />
          `}
          <div class="player-meta">
            <h3 class="episode-title">${episode.title}</h3>
            <p class="podcast-title">${episode.podcastTitle}</p>
          </div>
        </div>

        <div class="player-progress">
          <input
            type="range"
            min="0"
            max=${duration || 100}
            value=${currentTime || 0}
            onInput=${this.handleSeek}
            class="progress-slider"
          />
          <div class="time-display">
            <span>${this.formatTime(currentTime)}</span>
            <span>${this.formatTime(duration)}</span>
          </div>
        </div>

        <div class="player-controls">
          <button 
            class="control-button secondary"
            onClick=${this.handleSkipBackward}
            title="10 Sekunden zurück"
          >
            ⏪
          </button>
          
          <button 
            class="control-button primary"
            style="scale:1.4"
            onClick=${this.handlePlayPause}
            title=${isPlaying ? 'Pause' : 'Abspielen'}
          >
            ${isPlaying ? '❚❚' : '▶'}
          </button>
          
          <button 
            class="control-button secondary"
            onClick=${this.handleSkipForward}
            title="30 Sekunden vorwärts"
          >
            ⏩
          </button>
          
          <button 
            class="control-button"
            onClick=${this.togglePlaybackRateOptions}
            title="Wiedergabegeschwindigkeit ändern"
          >
            ${playbackRate}x
          </button>
          
          ${this.renderPlaybackRateOptions()}
        </div>
      </div>
    `;
  }
}