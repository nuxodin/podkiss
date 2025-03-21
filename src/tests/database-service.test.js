// Verbesserte Tests für den DatabaseService
import { DatabaseService } from '../services/database.js';

describe('DatabaseService', () => {
  beforeEach(() => {
    // Mock für IndexedDB-Operationen zurücksetzen
    jest.clearAllMocks();
  });

  test('sollte Podcasts speichern und abrufen können', async () => {
    // Mock für IndexedDB-Operationen
    const mockStore = {
      put: jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      })),
      getAll: jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      })),
      get: jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      }))
    };
    
    // Original-Methode speichern
    const originalGetStore = DatabaseService.getStore;
    
    // Mock-Implementierung
    DatabaseService.getStore = jest.fn().mockResolvedValue(mockStore);
    
    try {
      // Test durchführen
      const mockPodcast = { 
        feedUrl: 'https://test.com/feed',
        title: 'Test Podcast'
      };
      
      // Podcast speichern
      await DatabaseService.savePodcast(mockPodcast);
      
      // Überprüfen, ob die Store-Methode aufgerufen wurde
      expect(DatabaseService.getStore).toHaveBeenCalledWith('podcasts', 'readwrite');
      expect(mockStore.put).toHaveBeenCalled();
      
      // Podcast abrufen
      const isSubscribed = await DatabaseService.isPodcastSubscribed('https://test.com/feed');
      expect(mockStore.get).toHaveBeenCalled();
    } finally {
      // Original wiederherstellen
      DatabaseService.getStore = originalGetStore;
    }
  });

  test('sollte Episoden speichern und abrufen können', async () => {
    // Mock für IndexedDB-Operationen
    const mockStore = {
      put: jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      })),
      getAll: jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      })),
      index: jest.fn().mockReturnValue({
        getAll: jest.fn().mockImplementation(() => ({
          onsuccess: null,
          onerror: null
        }))
      })
    };
    
    // Original-Methode speichern
    const originalGetStore = DatabaseService.getStore;
    
    // Mock-Implementierung
    DatabaseService.getStore = jest.fn().mockResolvedValue(mockStore);
    
    try {
      // Test durchführen
      const mockEpisode = { 
        guid: '12345',
        podcastUrl: 'https://test.com/feed',
        title: 'Test Episode',
        audioUrl: 'https://test.com/audio.mp3'
      };
      
      // Episode speichern
      await DatabaseService.saveEpisode(mockEpisode);
      
      // Überprüfen, ob die Store-Methode aufgerufen wurde
      expect(DatabaseService.getStore).toHaveBeenCalledWith('episodes', 'readwrite');
      expect(mockStore.put).toHaveBeenCalled();
      
      // Episoden abrufen
      await DatabaseService.getEpisodesByPodcast('https://test.com/feed');
      expect(mockStore.index).toHaveBeenCalledWith('podcastId');
    } finally {
      // Original wiederherstellen
      DatabaseService.getStore = originalGetStore;
    }
  });
  
  test('sollte mit ungültigen Eingaben umgehen können', async () => {
    // Original-Methode speichern
    const originalGetStore = DatabaseService.getStore;
    
    try {
      // Test für leeren Podcast
      await expect(DatabaseService.savePodcast(null))
        .rejects.toThrow('Podcast benötigt eine Feed-URL');
      
      // Test für leere Episode
      await expect(DatabaseService.saveEpisode(null))
        .rejects.toThrow('Episode benötigt eine GUID und Podcast-URL');
        
      // Test für fehlende Feed-URL
      await expect(DatabaseService.getEpisodesByPodcast(''))
        .rejects.toThrow('Feed-URL erforderlich');
    } finally {
      // Original wiederherstellen
      DatabaseService.getStore = originalGetStore;
    }
  });
});