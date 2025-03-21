import RSSParser from '../lib/rss-parser.js';
import { DatabaseService } from './database.js';
import 'https://cdn.jsdelivr.net/gh/u2ui/u2@x.x.x/u2/auto.min.js';

class PodcastServiceClass {
  #parser;
  #proxyBaseUrl = 'http://localhost:8000/proxy';
  
  constructor() {
    this.#parser = new RSSParser();
  }

  async subscribe(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed-URL erforderlich');
    }

    try {
      // Prüfen, ob der Podcast bereits abonniert ist
      const isSubscribed = await DatabaseService.isPodcastSubscribed(feedUrl);
      if (isSubscribed) {
        // Wenn bereits abonniert, aktualisieren wir stattdessen
        return this.refreshPodcast(feedUrl);
      }

      return this.#processAndSavePodcast(feedUrl, 'Podcast konnte nicht abonniert werden');
    } catch (error) {
      console.error('Fehler beim Abonnieren:', error);
      throw new Error(`Podcast konnte nicht abonniert werden: ${error.message}`);
    }
  }

  async refreshPodcast(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed-URL erforderlich');
    }
    
    try {
      return this.#processAndSavePodcast(feedUrl, 'Podcast konnte nicht aktualisiert werden');
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      throw new Error(`Podcast konnte nicht aktualisiert werden: ${error.message}`);
    }
  }

  async #processAndSavePodcast(feedUrl, errorPrefix) {
    // RSS-Feed abrufen und verarbeiten
    const feed = await this.#fetchAndParseFeed(feedUrl);
    
    // Podcast-Objekt vorbereiten
    const podcastData = {
      feedUrl,
      title: feed.title,
      description: feed.description || feed.subtitle || '',
      author: feed.author || feed.creator || feed.owner?.name || '',
      imageUrl: feed.image?.url || feed.itunes?.image,
      link: feed.link,
      language: feed.language
    };
    
    // Podcast speichern/aktualisieren
    const podcast = await DatabaseService.savePodcast(podcastData);

    // Episoden speichern/aktualisieren
    const episodes = await this.#saveEpisodes(feed.items, feedUrl);

    return { podcast, episodes };
  }

  async #fetchAndParseFeed(feedUrl) {
    const response = await this.#fetchViaProxy(feedUrl);
    const xml = await response.text();
    return await this.#parser.parseString(xml);
  }

  async #saveEpisodes(items, feedUrl) {
    if (!items?.length) return [];
    
    return Promise.all(
      items.map(item => 
        DatabaseService.saveEpisode({
          guid: item.guid || item.id || `${feedUrl}#${item.title}`,
          podcastUrl: feedUrl,
          title: item.title,
          description: item.description || item.summary || '',
          pubDate: item.pubDate || item.published || new Date().toISOString(),
          duration: item.duration || item.itunes?.duration || '',
          imageUrl: item.image || item.itunes?.image,
          audioUrl: item.audioUrl || item.enclosure?.url
        })
      )
    );
  }

  async #fetchViaProxy(feedUrl) {
    const proxyUrl = `${this.#proxyBaseUrl}?url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Feed konnte nicht abgerufen werden: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
}

export const PodcastService = new PodcastServiceClass();