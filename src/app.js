import { h, render, Component } from 'https://unpkg.com/preact@10.15.1/dist/preact.module.js';
import { html } from 'https://esm.sh/htm@3.1.1/preact/index.mjs';

import { DatabaseService } from './services/database.js';
import { PodcastService } from './services/podcast.js';
import { AudioPlayer } from './services/audio-player.js';
import { PodcastList } from './components/podcast-list.js';
import { PodcastPlayer } from './components/podcast-player.js';
import { PodcastDetail } from './components/podcast-detail.js';
import { PodcastSearch } from './components/podcast-search.js';

class App extends Component {
  state = {
    podcasts: [],
    currentEpisode: null,
    selectedPodcast: null,
    view: 'list', // 'list', 'search', oder 'detail'
    error: null,
    isLoading: true
  };

  async componentDidMount() {
    try {
      await DatabaseService.init();
      const podcasts = await DatabaseService.getAllPodcasts();
      
      // Episoden für jeden Podcast laden
      const podcastsWithEpisodes = await Promise.all(
        podcasts.map(async (podcast) => {
          const episodes = await DatabaseService.getEpisodesByPodcast(podcast.feedUrl);
          return {
            ...podcast,
            episodes: episodes.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          };
        })
      );

      this.setState({ 
        podcasts: podcastsWithEpisodes, 
        isLoading: false 
      });
      
      // Cleanup bei Seitenentladung
      window.addEventListener('beforeunload', this.cleanup);
    } catch (error) {
      console.error('Fehler beim Laden der Podcasts:', error);
      this.setState({ 
        error: 'Podcasts konnten nicht geladen werden',
        isLoading: false 
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.cleanup);
    this.cleanup();
  }

  cleanup = () => {
    AudioPlayer.cleanup();
  };

  handleAddPodcast = async (feedUrl) => {
    this.setState({ isLoading: true });
    try {
      const { podcast, episodes } = await PodcastService.subscribe(feedUrl);
      
      this.setState(state => ({
        podcasts: [...state.podcasts, { ...podcast, episodes }],
        isLoading: false
      }));
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Podcasts:', error);
      this.setState({ isLoading: false });
      throw error;
    }
  };

  handleUnsubscribe = async (feedUrl) => {
    if (!feedUrl) return;

    this.setState({ isLoading: true });
    try {
      await DatabaseService.deletePodcast(feedUrl);
      this.setState(state => ({
        podcasts: state.podcasts.filter(p => p.feedUrl !== feedUrl),
        view: 'list',
        selectedPodcast: null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
      this.setState({ isLoading: false });
      throw error;
    }
  };

  handlePlayEpisode = async (episode) => {
    if (!episode?.audioUrl) return;

    try {
      const podcast = this.state.podcasts.find(p => p.feedUrl === episode.podcastUrl);
      
      const enhancedEpisode = {
        ...episode,
        podcastTitle: podcast?.title,
        author: podcast?.author,
        imageUrl: episode.imageUrl || podcast?.imageUrl,
        // URL kodieren für Sonderzeichen
        audioUrl: encodeURI(episode.audioUrl)
      };

      this.setState({ currentEpisode: enhancedEpisode });
      await AudioPlayer.play(enhancedEpisode);
    } catch (error) {
      console.error('Wiedergabe fehlgeschlagen:', error);
    }
  };

  handlePodcastClick = async (podcast) => {
    if (!podcast?.feedUrl) return;

    this.setState({ isLoading: true });
    try {
      // Episoden aus der Datenbank laden
      const episodes = await DatabaseService.getEpisodesByPodcast(podcast.feedUrl);
      
      const enhancedPodcast = {
        ...podcast,
        episodes: episodes.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      };

      this.setState({ 
        selectedPodcast: enhancedPodcast,
        view: 'detail',
        isLoading: false
      });
    } catch (error) {
      console.error('Fehler beim Laden der Episoden:', error);
      this.setState({ 
        error: 'Episoden konnten nicht geladen werden',
        isLoading: false 
      });
    }
  };

  handleRefreshPodcast = async (feedUrl) => {
    if (!feedUrl) return;

    this.setState({ isLoading: true });
    try {
      const { podcast, episodes } = await PodcastService.refreshPodcast(feedUrl);
      
      const enhancedPodcast = {
        ...podcast,
        episodes
      };
      
      this.setState(state => ({
        podcasts: state.podcasts.map(p => 
          p.feedUrl === feedUrl ? enhancedPodcast : p
        ),
        selectedPodcast: enhancedPodcast,
        isLoading: false
      }));
    } catch (error) {
      console.error('Aktualisierung fehlgeschlagen:', error);
      this.setState({ isLoading: false });
      throw error;
    }
  };

  navigateToList = () => {
    this.setState({ 
      view: 'list',
      selectedPodcast: null
    });
  };

  navigateToSearch = () => {
    this.setState({ 
      view: 'search',
      selectedPodcast: null
    });
  };

  renderHeader() {
    const { view } = this.state;

    return html`
      <header class="app-header">
        <div class="header-content">
          ${view === 'detail' ? html`
            <button 
              class="button"
              onClick=${this.navigateToList}
            >
              ← Zurück
            </button>
          ` : html`
            <h1>Podkiss</h1>
          `}
          
          ${view !== 'detail' && html`
            <button 
              class="button"
              onClick=${view === 'list' ? this.navigateToSearch : this.navigateToList}
            >
              ${view === 'list' ? 'Podcasts finden' : 'Meine Podcasts'}
            </button>
          `}
        </div>
      </header>
    `;
  }

  renderContent() {
    const { podcasts, currentEpisode, selectedPodcast, view } = this.state;

    if (view === 'detail' && selectedPodcast) {
      return html`
        <${PodcastDetail}
          podcast=${selectedPodcast}
          currentEpisode=${currentEpisode}
          onPlayEpisode=${this.handlePlayEpisode}
          onUnsubscribe=${this.handleUnsubscribe}
          onRefresh=${() => this.handleRefreshPodcast(selectedPodcast.feedUrl)}
        />
      `;
    }

    if (view === 'search') {
      return html`
        <${PodcastSearch} 
          onSubscribe=${podcast => this.handleAddPodcast(podcast.feedUrl)}
        />
      `;
    }

    return html`
      <${PodcastList} 
        podcasts=${podcasts}
        onPodcastClick=${this.handlePodcastClick}
      />
    `;
  }

  render() {
    const { currentEpisode, error, isLoading } = this.state;

    if (error) {
      return html`
        <div style="text-align: center; padding: 2rem;">
          <h2>Fehler</h2>
          <p>${error}</p>
          <button 
            class="button" 
            onClick=${() => window.location.reload()}
          >
            App neu laden
          </button>
        </div>
      `;
    }

    return html`
      <div class="app-container">
        ${this.renderHeader()}

        <main>
          ${isLoading ? html`
            <div class="loading-state">Laden...</div>
          ` : this.renderContent()}
        </main>

        ${currentEpisode && html`
          <${PodcastPlayer}
            episode=${currentEpisode}
          />
        `}
      </div>
    `;
  }
}

render(h(App), document.getElementById('app'));