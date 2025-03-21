class PodcastIndexService {
  #apiUrl = 'https://itunes.apple.com';
  #cache = new Map();

  async searchPodcasts(query, limit = 8) {
    if (!query?.trim()) {
      throw new Error('Suchbegriff erforderlich');
    }

    try {
      const url = new URL('/search', this.#apiUrl);
      url.searchParams.set('term', query.trim());
      url.searchParams.set('media', 'podcast');
      url.searchParams.set('limit', limit.toString());

      const data = await this.#fetchWithCache(url.toString());
      
      return data.results?.map(item => ({
        feedUrl: item.feedUrl,
        title: item.collectionName || item.trackName,
        description: item.artistName,
        imageUrl: item.artworkUrl600 || item.artworkUrl100,
        author: item.artistName
      })) || [];
    } catch (error) {
      console.error('Podcast-Suche fehlgeschlagen:', error);
      throw new Error('Suche konnte nicht durchgeführt werden');
    }
  }

  async #fetchWithCache(url) {
    if (this.#cache.has(url)) {
      return this.#cache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }
      const data = await response.json();
      
      this.#cache.set(url, data);
      setTimeout(() => this.#cache.delete(url), 15 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error('Fetch-Fehler:', error);
      throw error;
    }
  }
}

export const PodcastIndexAPI = new PodcastIndexService();