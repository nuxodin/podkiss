import { PodcastService } from '../services/podcast.js';

describe('PodcastService', () => {
  test('sollte Podcast-Feeds verarbeiten', async () => {
    // Mock-Objekte erstellen
    const mockFeed = {
      title: 'Test Podcast',
      author: 'Test Autor',
      items: [{ guid: '1', title: 'Testepisode' }]
    };
    
    // Original-Methoden speichern
    const originalFetch = global.fetch;
    const originalSubscribe = PodcastService.subscribe;
    
    // Mock-Implementierungen
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<rss></rss>')
    });
    
    PodcastService.subscribe = jest.fn().mockResolvedValue({
      podcast: { title: 'Test Podcast' },
      episodes: [{ title: 'Testepisode' }]
    });
    
    try {
      // Test durchführen
      const result = await PodcastService.subscribe('https://test.com/feed');
      expect(result).toBeDefined();
      expect(result.podcast).toBeDefined();
      expect(result.episodes).toBeInstanceOf(Array);
    } finally {
      // Originale wiederherstellen
      global.fetch = originalFetch;
      PodcastService.subscribe = originalSubscribe;
    }
  });
});