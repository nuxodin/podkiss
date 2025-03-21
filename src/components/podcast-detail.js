import { html } from 'https://esm.sh/htm@3.1.1/preact/index.mjs';
import { Component } from 'https://unpkg.com/preact@10.15.1/dist/preact.module.js';

export class PodcastDetail extends Component {
  state = {
    isRefreshing: false,
    expandedEpisodes: new Set(), // Speichert die IDs der erweiterten Episoden
    filter: ''
  };

  componentDidMount() {
    // Tastaturkürzel für die Suche
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    // Nur aktivieren, wenn kein anderes Eingabefeld fokussiert ist
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      // Strg+F oder Cmd+F für Suche
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.searchInput?.focus();
      }
    }
  };

  handleRefresh = async (e) => {
    e.preventDefault();
    const { onRefresh } = this.props;
    
    this.setState({ isRefreshing: true });
    try {
      await onRefresh();
    } finally {
      this.setState({ isRefreshing: false });
    }
  };

  handleUnsubscribe = (e) => {
    e.preventDefault();
    const { podcast, onUnsubscribe } = this.props;
    
    if (confirm('Möchten Sie diesen Podcast wirklich abbestellen?')) {
      onUnsubscribe(podcast.feedUrl);
    }
  };

  toggleEpisodeExpanded = (episodeId) => {
    const { expandedEpisodes } = this.state;
    const newExpandedEpisodes = new Set(expandedEpisodes);
    
    if (newExpandedEpisodes.has(episodeId)) {
      newExpandedEpisodes.delete(episodeId);
    } else {
      newExpandedEpisodes.add(episodeId);
    }
    
    this.setState({ expandedEpisodes: newExpandedEpisodes });
  };

  handleFilterChange = (e) => {
    this.setState({ filter: e.target.value.toLowerCase() });
  };

  filterEpisodes = (episodes) => {
    const { filter } = this.state;
    if (!filter) return episodes;
    
    return episodes.filter(episode => 
      episode.title.toLowerCase().includes(filter) || 
      (episode.description && episode.description.toLowerCase().includes(filter))
    );
  };

  formatDuration = (duration) => {
    if (!duration) return '';
    
    // Wenn es bereits als MM:SS formatiert ist
    if (/^\d+:\d+$/.test(duration)) {
      return duration;
    }
    
    // Versuche, die Sekunden zu extrahieren
    let seconds = 0;
    if (!isNaN(duration)) {
      seconds = parseInt(duration, 10);
    }
    
    if (seconds <= 0) return '';
    
    // Formatiere die Sekunden als MM:SS oder HH:MM:SS
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  renderEpisode = (episode) => {
    const { currentEpisode, onPlayEpisode } = this.props;
    const { expandedEpisodes } = this.state;
    const isPlaying = currentEpisode?.guid === episode.guid;
    const isExpanded = expandedEpisodes.has(episode.id);
    const duration = this.formatDuration(episode.duration);

    return html`
      <div class=${`episode-item ${isPlaying ? 'playing' : ''}`} key=${episode.guid}>
        <div class="episode-header">
          <div class="episode-title-area">
            <h3>${episode.title}</h3>
            <div class="episode-meta">
              <small>
                <u2-time datetime=${episode.pubDate} type=relative>${episode.pubDate}</u2-time>
              </small>
              ${duration && html`<span class="episode-duration">${duration}</span>`}
            </div>
          </div>
          <div class="episode-controls">
            <button 
              class="control-button u2-unstyle"
              onClick=${() => onPlayEpisode(episode)} todo="should toggle, but it doesn't yet"
              title=${isPlaying ? 'Pause' : 'Abspielen'}
            >
              ${isPlaying ? '❚❚' : '▶'}
            </button>
            <button 
              class="control-button u2-unstyle"
              onClick=${() => this.toggleEpisodeExpanded(episode.id)}
              title=${isExpanded ? 'Beschreibung einklappen' : 'Beschreibung ausklappen'}
            >
              ${isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        ${isExpanded && html`
          <div class="episode-description">
            ${episode.description ? html`<p>${episode.description}</p>` : html`<p>Keine Beschreibung verfügbar.</p>`}
          </div>
        `}
      </div>
    `;
  };

  render() {
    const { podcast } = this.props;
    const { isRefreshing, filter } = this.state;
    const episodes = podcast.episodes || [];
    const filteredEpisodes = this.filterEpisodes(episodes);

    return html`
      <div class="podcast-detail">
        <div class="podcast-header">
          <div class="podcast-info">
            ${podcast.imageUrl && html`
              <img 
                src=${podcast.imageUrl} 
                alt=${podcast.title}
                class="podcast-cover"
              />
            `}
            <div class="podcast-meta">
              <h1>${podcast.title}</h1>
              <p class="podcast-author">${podcast.author || 'Unbekannter Autor'}</p>
              ${podcast.description && html`
                <p class="podcast-description">${podcast.description}</p>
              `}
            </div>
          </div>
          
          <div class="podcast-actions">
            <button 
              class="button"
              onClick=${this.handleRefresh}
              disabled=${isRefreshing}
              title="Podcast-Feed aktualisieren"
            >
              ${isRefreshing ? 'Aktualisiere...' : 'Aktualisieren'}
            </button>
            <button 
              class="button danger"
              onClick=${this.handleUnsubscribe}
              title="Podcast abbestellen"
            >
              Abbestellen
            </button>
          </div>
        </div>

        <div class="episodes-container">
          <div class="episodes-header">
            <h2>Episoden (${episodes.length})</h2>
            <div class="episodes-filter">
              <input
                type="text"
                placeholder="Episoden filtern..."
                value=${filter}
                onInput=${this.handleFilterChange}
                ref=${el => this.searchInput = el}
              />
              ${filter && html`
                <span class="filter-results">
                  ${filteredEpisodes.length} von ${episodes.length} Episoden
                </span>
              `}
            </div>
          </div>

          <div class="episodes-list">
            ${filteredEpisodes.length > 0 
              ? filteredEpisodes.map(this.renderEpisode)
              : html`
                <div class="empty-state">
                  ${filter 
                    ? `Keine Episoden gefunden, die "${filter}" enthalten.` 
                    : 'Keine Episoden gefunden.'}
                </div>
              `
            }
          </div>
        </div>
      </div>
    `;
  }
}