import { html } from 'https://esm.sh/htm@3.1.1/preact/index.mjs';
import { Component } from 'https://unpkg.com/preact@10.15.1/dist/preact.module.js';
import { PodcastIndexAPI } from '../services/podcast-index.js';
import { DatabaseService } from '../services/database.js';

export class PodcastSearch extends Component {
  state = {
    query: '',
    url: '',
    results: [],
    isLoading: false,
    error: null,
    message: null
  };

  handleSearch = async (e) => {
    e.preventDefault();
    const { query } = this.state;
    if (!query.trim()) return;

    this.setState({ isLoading: true, error: null, message: null });
    
    try {
      const results = await PodcastIndexAPI.searchPodcasts(query);
      this.setState({ results, isLoading: false });
    } catch (error) {
      this.setState({ 
        error: `Suche fehlgeschlagen: ${error.message}`, 
        isLoading: false 
      });
    }
  };

  handleUrlSubmit = async (e) => {
    e.preventDefault();
    const { url } = this.state;
    if (!url.trim()) return;

    this.setState({ isLoading: true, error: null, message: null });
    
    try {
      await this.props.onSubscribe({ feedUrl: url.trim() });
      this.setState({ 
        url: '', 
        isLoading: false,
        message: 'Podcast erfolgreich abonniert'
      });
    } catch (error) {
      this.setState({ 
        error: `Abonnieren fehlgeschlagen: ${error.message}`, 
        isLoading: false 
      });
    }
  };

  handleSubscribe = async (podcast) => {
    try {
      const isSubscribed = await DatabaseService.isPodcastSubscribed(podcast.feedUrl);
      if (isSubscribed) {
        this.setState({ message: 'Podcast bereits abonniert' });
        return;
      }

      this.setState({ isLoading: true, error: null, message: null });
      await this.props.onSubscribe(podcast);
      this.setState({ 
        isLoading: false,
        message: `${podcast.title} erfolgreich abonniert`
      });
    } catch (error) {
      this.setState({ 
        error: `Abonnieren fehlgeschlagen: ${error.message}`, 
        isLoading: false 
      });
    }
  };

  renderPodcastItem = (podcast) => {
    return html`
      <div class="card podcast-item">
        <div style="display: flex; gap: 1rem; align-items: center;">
          ${podcast.imageUrl && html`
            <img 
              src=${podcast.imageUrl} 
              alt=${podcast.title}
              style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
            />
          `}
          <div style="flex: 1;">
            <h3>${podcast.title}</h3>
            <p>${podcast.author}</p>
          </div>
          <button 
            class="button"
            onClick=${() => this.handleSubscribe(podcast)}
            disabled=${this.state.isLoading}
          >
            Abonnieren
          </button>
        </div>
      </div>
    `;
  };

  render() {
    const { query, url, results, isLoading, error, message } = this.state;

    return html`
      <div class="podcast-search">
        <div class="search-methods">
          <form onSubmit=${this.handleSearch} class="card">
            <h2>Podcast suchen</h2>
            <div class=u2-flex>
              <input
                type="search"
                style="flex:1"
                placeholder="Nach Titel oder Autor suchen..."
                value=${query}
                onInput=${e => this.setState({ query: e.target.value })}
                disabled=${isLoading}
              />
              <button
                disabled=${isLoading || !query.trim()}
              >
                ${isLoading ? 'Suchen...' : 'Suchen'}
              </button>
            </div>
          </form>

          <form onSubmit=${this.handleUrlSubmit} class="card">
            <h2>Per RSS-Feed abonnieren</h2>
            <div class="u2-flex">
              <input
                type="url"
                style="flex:1"
                placeholder="RSS-Feed-URL eingeben"
                value=${url}
                onInput=${e => this.setState({ url: e.target.value })}
                disabled=${isLoading}
              />
              <button
                type="submit"
                class="button"
                disabled=${isLoading || !url.trim()}
              >
                ${isLoading ? 'Hinzufügen...' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>

        ${error && html`
          <div style="color: var(--color-error); padding: 1rem; margin: 1rem 0; background: #fee;">
            ${error}
          </div>
        `}

        ${message && html`
          <div style="color: #4caf50; padding: 1rem; margin: 1rem 0; background: #e8f5e9;">
            ${message}
          </div>
        `}

        ${query.trim() && results.length > 0 && html`
          <div class="search-results">
            <h2>Suchergebnisse</h2>
            ${results.map(this.renderPodcastItem)}
          </div>
        `}
        
        ${query.trim() && results.length === 0 && !isLoading && html`
          <div class="empty-state">
            <p>Keine Podcasts gefunden für "${query}"</p>
          </div>
        `}
      </div>
    `;
  }
}