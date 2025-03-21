class AudioPlayerService {
  #audio = new Audio();
  #stateListeners = new Set();
  #currentEpisode = null;
  #playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  #currentPlaybackRateIndex = 2; // Standard ist 1.0
  #savedPositions = new Map(); // Speichert die Positionen für Episoden

  constructor() {
    this.#initAudioEvents();
    this.#loadSavedState();
  }

  #initAudioEvents() {
    // Grundlegende Event-Listener einrichten
    const events = ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'error'];
    events.forEach(event => {
      this.#audio.addEventListener(event, () => this.#notifyListeners());
    });

    // Speichern der aktuellen Position alle 5 Sekunden
    setInterval(() => this.#saveCurrentPosition(), 5000);

    // Spezielle Behandlung beim Beenden einer Episode
    this.#audio.addEventListener('ended', () => {
      // Position zurücksetzen
      this.#savedPositions.delete(this.#getEpisodeId());
      this.#saveState();
    });

    // Fehlerbehandlung
    this.#audio.addEventListener('error', () => {
      console.error('Audio player error:', this.#audio.error);
      // Benachrichtigung mit dem Fehler
      this.#notifyListeners();
    });
  }

  #notifyListeners() {
    const state = this.getState();
    
    this.#stateListeners.forEach(listener => {
      if (typeof listener === 'function') {
        try {
          listener(state);
        } catch (error) {
          console.error('Error in audio player listener:', error);
        }
      }
    });
  }

  #calculateProgress() {
    if (!this.#audio.duration) return 0;
    return (this.#audio.currentTime / this.#audio.duration) * 100;
  }

  #getEpisodeId() {
    return this.#currentEpisode?.guid || this.#currentEpisode?.id;
  }

  #saveCurrentPosition() {
    if (!this.#audio.paused && this.#currentEpisode) {
      const episodeId = this.#getEpisodeId();
      if (episodeId) {
        this.#savedPositions.set(episodeId, this.#audio.currentTime);
        this.#saveState();
      }
    }
  }

  #saveState() {
    // Speichern des Zustands im localStorage
    try {
      localStorage.setItem('audioPlayerState', JSON.stringify({
        playbackRateIndex: this.#currentPlaybackRateIndex,
        savedPositions: Array.from(this.#savedPositions.entries())
      }));
    } catch (error) {
      console.warn('Fehler beim Speichern des Audio-Player-Zustands:', error);
    }
  }

  #loadSavedState() {
    try {
      const savedState = localStorage.getItem('audioPlayerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Playback-Rate wiederherstellen
        if (typeof state.playbackRateIndex === 'number') {
          this.#currentPlaybackRateIndex = Math.max(0, Math.min(state.playbackRateIndex, this.#playbackRates.length - 1));
          this.#audio.playbackRate = this.#playbackRates[this.#currentPlaybackRateIndex];
        }
        
        // Gespeicherte Positionen wiederherstellen
        if (Array.isArray(state.savedPositions)) {
          this.#savedPositions = new Map(state.savedPositions);
        }
      }
    } catch (error) {
      console.warn('Fehler beim Laden des Audio-Player-Zustands:', error);
    }
  }

  addEventListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.#stateListeners.add(listener);
    // Sofortige Benachrichtigung des neuen Listeners mit aktuellem Zustand
    try {
      listener(this.getState());
    } catch (error) {
      console.error('Error in newly added audio player listener:', error);
    }
    
    // Rückgabe einer Funktion zum Entfernen des Listeners
    return () => {
      this.#stateListeners.delete(listener);
    };
  }

  async play(episode = null) {
    try {
      const isNewEpisode = episode && episode !== this.#currentEpisode;
      
      if (isNewEpisode) {
        this.#currentEpisode = episode;
        this.#audio.src = episode.audioUrl;
        this.#audio.playbackRate = this.#playbackRates[this.#currentPlaybackRateIndex];
        
        // Prüfen, ob eine gespeicherte Position existiert
        const episodeId = this.#getEpisodeId();
        if (episodeId && this.#savedPositions.has(episodeId)) {
          this.#audio.currentTime = this.#savedPositions.get(episodeId);
        } else {
          this.#audio.currentTime = 0;
        }
      }

      if (this.#audio.src) {
        await this.#audio.play();
      }
    } catch (error) {
      console.error('Fehler beim Abspielen:', error);
      this.#notifyListeners(); // Benachrichtigung mit dem aktuellen Zustand inkl. Fehler
    }
  }

  pause() {
    this.#audio.pause();
    this.#saveCurrentPosition();
  }

  togglePlayPause() {
    if (this.#audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  seek(time) {
    if (!Number.isFinite(time)) return;
    this.#audio.currentTime = Math.max(0, Math.min(time, this.#audio.duration || 0));
  }

  skipForward(seconds = 30) {
    this.seek(this.#audio.currentTime + seconds);
  }

  skipBackward(seconds = 10) {
    this.seek(this.#audio.currentTime - seconds);
  }

  changePlaybackRate(direction) {
    if (direction === 'up') {
      this.#currentPlaybackRateIndex = Math.min(this.#playbackRates.length - 1, this.#currentPlaybackRateIndex + 1);
    } else if (direction === 'down') {
      this.#currentPlaybackRateIndex = Math.max(0, this.#currentPlaybackRateIndex - 1);
    }
    
    this.#audio.playbackRate = this.#playbackRates[this.#currentPlaybackRateIndex];
    this.#saveState();
    this.#notifyListeners();
  }

  getCurrentEpisode() {
    return this.#currentEpisode;
  }

  getState() {
    return {
      currentTime: this.#audio.currentTime,
      duration: this.#audio.duration || 0,
      isPlaying: !this.#audio.paused,
      progress: this.#calculateProgress(),
      playbackRate: this.#audio.playbackRate,
      currentEpisode: this.#currentEpisode,
      error: this.#audio.error ? {
        code: this.#audio.error.code,
        message: this.#getErrorMessage(this.#audio.error.code)
      } : null
    };
  }

  #getErrorMessage(errorCode) {
    const errorMessages = {
      1: 'Der Ladevorgang wurde abgebrochen',
      2: 'Netzwerkfehler',
      3: 'Fehler beim Dekodieren',
      4: 'Format wird nicht unterstützt'
    };
    
    return errorMessages[errorCode] || 'Unbekannter Fehler';
  }

  cleanup() {
    this.pause();
    this.#saveCurrentPosition();
    this.#audio.src = '';
    this.#currentEpisode = null;
    this.#stateListeners.clear();
  }
}

export const AudioPlayer = new AudioPlayerService();