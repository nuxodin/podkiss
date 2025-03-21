const DB_NAME = 'podkiss';
const DB_VERSION = 1;

const STORES = {
  PODCASTS: 'podcasts',
  EPISODES: 'episodes'
};

// Verbesserte ID-Generierung mit Fehlerbehandlung
async function generateId(str) {
  if (!str) return '';
  
  try {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Fehler bei ID-Generierung:', error);
    // Fallback-Methode, wenn Crypto API nicht verfügbar ist
    return Array.from(str)
      .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
      .toString(36);
  }
}

class DatabaseServiceClass {
  db = null;
  #dbInitPromise = null;

  async init() {
    // Singleton-Muster verwenden, um die Initialisierung zu cachen
    if (this.#dbInitPromise) return this.#dbInitPromise;

    this.#dbInitPromise = new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('Datenbank-Fehler:', event.target.error);
          reject(new Error('Datenbank konnte nicht geöffnet werden'));
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          this.db.onerror = (event) => {
            console.error('Datenbank-Fehler:', event.target.error);
          };
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          this.setupDatabase(event.target.result);
        };
      } catch (error) {
        console.error('Datenbank-Initialisierung fehlgeschlagen:', error);
        reject(new Error('Datenbank konnte nicht initialisiert werden'));
      }
    });
    
    return this.#dbInitPromise;
  }

  setupDatabase(db) {
    try {
      // Podcasts-Store erstellen
      if (!db.objectStoreNames.contains(STORES.PODCASTS)) {
        const podcastStore = db.createObjectStore(STORES.PODCASTS, { keyPath: 'id' });
        podcastStore.createIndex('feedUrl', 'feedUrl', { unique: true });
      }

      // Episodes-Store erstellen
      if (!db.objectStoreNames.contains(STORES.EPISODES)) {
        const episodeStore = db.createObjectStore(STORES.EPISODES, { keyPath: 'id' });
        episodeStore.createIndex('podcastId', 'podcastId', { unique: false });
        episodeStore.createIndex('guid', 'guid', { unique: false });
      }
    } catch (error) {
      console.error('Fehler beim Einrichten der Datenbank:', error);
      throw new Error('Datenbank-Schema konnte nicht erstellt werden');
    }
  }

  async getStore(storeName, mode = 'readonly') {
    await this.init();
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async savePodcast(podcast) {
    if (!podcast?.feedUrl) {
      throw new Error('Podcast benötigt eine Feed-URL');
    }

    try {
      const id = await generateId(podcast.feedUrl);
      const store = await this.getStore(STORES.PODCASTS, 'readwrite');
      
      const enhancedPodcast = {
        ...podcast,
        id,
        updatedAt: Date.now()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(enhancedPodcast);
        request.onerror = () => reject(new Error(`Podcast konnte nicht gespeichert werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => resolve(enhancedPodcast);
      });
    } catch (error) {
      console.error('Podcast konnte nicht gespeichert werden:', error);
      throw new Error(`Podcast konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  async saveEpisode(episode) {
    if (!episode?.guid || !episode?.podcastUrl) {
      throw new Error('Episode benötigt eine GUID und Podcast-URL');
    }

    try {
      const podcastId = await generateId(episode.podcastUrl);
      const id = await generateId(episode.guid + episode.podcastUrl);
      const store = await this.getStore(STORES.EPISODES, 'readwrite');
      
      const enhancedEpisode = {
        ...episode,
        id,
        podcastId,
        updatedAt: Date.now()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(enhancedEpisode);
        request.onerror = () => reject(new Error(`Episode konnte nicht gespeichert werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => resolve(enhancedEpisode);
      });
    } catch (error) {
      console.error('Episode konnte nicht gespeichert werden:', error);
      throw new Error(`Episode konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  async getAllPodcasts() {
    try {
      const store = await this.getStore(STORES.PODCASTS);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(new Error(`Podcasts konnten nicht geladen werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (error) {
      console.error('Podcasts konnten nicht geladen werden:', error);
      throw new Error(`Podcasts konnten nicht geladen werden: ${error.message}`);
    }
  }

  async getEpisodesByPodcast(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed-URL erforderlich');
    }

    try {
      const podcastId = await generateId(feedUrl);
      const store = await this.getStore(STORES.EPISODES);
      const index = store.index('podcastId');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(podcastId);
        request.onerror = () => reject(new Error(`Episoden konnten nicht geladen werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => {
          // Sortieren nach Veröffentlichungsdatum (neueste zuerst)
          const episodes = request.result || [];
          return resolve(episodes.sort((a, b) => {
            const dateA = new Date(a.pubDate || 0);
            const dateB = new Date(b.pubDate || 0);
            return dateB - dateA;
          }));
        };
      });
    } catch (error) {
      console.error('Episoden konnten nicht geladen werden:', error);
      throw new Error(`Episoden konnten nicht geladen werden: ${error.message}`);
    }
  }

  async deletePodcast(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed-URL erforderlich');
    }
    
    try {
      await this.init();
      const podcastId = await generateId(feedUrl);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORES.PODCASTS, STORES.EPISODES], 'readwrite');
        const podcastStore = transaction.objectStore(STORES.PODCASTS);
        const episodeStore = transaction.objectStore(STORES.EPISODES);
        const index = episodeStore.index('podcastId');
        
        // Podcast löschen
        podcastStore.delete(podcastId);
        
        // Zugehörige Episoden finden und löschen
        const episodeRequest = index.getAllKeys(podcastId);
        episodeRequest.onsuccess = () => {
          const episodeIds = episodeRequest.result || [];
          episodeIds.forEach(id => {
            episodeStore.delete(id);
          });
        };

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(new Error(`Podcast konnte nicht gelöscht werden: ${transaction.error?.message || 'Unbekannter Fehler'}`));
      });
    } catch (error) {
      console.error('Podcast konnte nicht gelöscht werden:', error);
      throw new Error(`Podcast konnte nicht gelöscht werden: ${error.message}`);
    }
  }

  async isPodcastSubscribed(feedUrl) {
    if (!feedUrl) {
      return false;
    }
    
    try {
      const id = await generateId(feedUrl);
      const store = await this.getStore(STORES.PODCASTS);
      
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onerror = () => resolve(false); // Bei Fehler als "nicht abonniert" ansehen
        request.onsuccess = () => resolve(!!request.result);
      });
    } catch (error) {
      console.error('Abonnement-Status konnte nicht geprüft werden:', error);
      return false; // Bei Fehler als "nicht abonniert" ansehen
    }
  }

  async getPodcastByFeedUrl(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed-URL erforderlich');
    }
    
    try {
      const id = await generateId(feedUrl);
      const store = await this.getStore(STORES.PODCASTS);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(new Error(`Podcast konnte nicht geladen werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('Podcast konnte nicht geladen werden:', error);
      throw new Error(`Podcast konnte nicht geladen werden: ${error.message}`);
    }
  }

  async getEpisodeById(id) {
    if (!id) {
      throw new Error('Episode-ID erforderlich');
    }
    
    try {
      const store = await this.getStore(STORES.EPISODES);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(new Error(`Episode konnte nicht geladen werden: ${request.error?.message || 'Unbekannter Fehler'}`));
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('Episode konnte nicht geladen werden:', error);
      throw new Error(`Episode konnte nicht geladen werden: ${error.message}`);
    }
  }
}

export const DatabaseService = new DatabaseServiceClass();