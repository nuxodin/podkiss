class RSSParser {
  constructor() {
    this.parser = new DOMParser();
  }

  async parseString(xmlText) {
    if (!xmlText) {
      throw new Error('Keine XML-Daten vorhanden');
    }

    try {
      const doc = this.parser.parseFromString(xmlText, 'text/xml');
      
      if (doc.querySelector('parsererror')) {
        throw new Error('Ungültiges XML');
      }

      // Unterstützung für verschiedene Feed-Typen (RSS und Atom)
      const isAtom = !!doc.querySelector('feed');
      return isAtom ? this.parseAtomFeed(doc) : this.parseRSSFeed(doc);
    } catch (error) {
      console.error('Feed-Parsing fehlgeschlagen:', error);
      throw new Error('Fehler beim Parsen des Feeds: ' + error.message);
    }
  }

  parseRSSFeed(doc) {
    const channel = doc.querySelector('channel');
    if (!channel) {
      throw new Error('Kein gültiger RSS-Feed');
    }

    return {
      title: this.getElementText(channel, 'title'),
      description: this.getElementText(channel, 'description'),
      link: this.getElementText(channel, 'link'),
      image: this.getImage(channel),
      author: this.getAuthor(channel),
      language: this.getElementText(channel, 'language'),
      copyright: this.getElementText(channel, 'copyright'),
      lastBuildDate: this.getDate(channel, 'lastBuildDate'),
      items: this.parseRSSItems(channel)
    };
  }

  parseAtomFeed(doc) {
    const feed = doc.querySelector('feed');
    if (!feed) {
      throw new Error('Kein gültiger Atom-Feed');
    }

    return {
      title: this.getElementText(feed, 'title'),
      description: this.getElementText(feed, 'subtitle'),
      link: this.getAtomLink(feed, 'alternate'),
      image: this.getAtomImage(feed),
      author: this.getAtomAuthor(feed),
      language: feed.getAttribute('xml:lang') || '',
      copyright: this.getElementText(feed, 'rights'),
      lastBuildDate: this.getElementText(feed, 'updated'),
      items: this.parseAtomEntries(feed)
    };
  }

  getElementText(parent, selector) {
    const element = parent.querySelector(selector);
    return element?.textContent?.trim() || '';
  }

  getDate(parent, selector) {
    const dateStr = this.getElementText(parent, selector);
    if (!dateStr) return null;
    
    try {
      return new Date(dateStr).toISOString();
    } catch (error) {
      return null;
    }
  }

  getAuthor(channel) {
    return (
      this.getElementText(channel, 'itunes\\:author') ||
      this.getElementText(channel, 'author') ||
      this.getElementText(channel, 'managingEditor') ||
      ''
    );
  }

  getAtomAuthor(feed) {
    const author = feed.querySelector('author');
    return author ? this.getElementText(author, 'name') : '';
  }

  getImage(channel) {
    // iTunes-Bild prüfen
    const itunesImage = channel.querySelector('itunes\\:image');
    if (itunesImage?.hasAttribute('href')) {
      return {
        url: itunesImage.getAttribute('href')
      };
    }

    // Standard-RSS-Bild
    const image = channel.querySelector('image');
    if (image) {
      return {
        url: this.getElementText(image, 'url') || image.getAttribute('href') || ''
      };
    }

    return null;
  }

  getAtomImage(feed) {
    const logo = feed.querySelector('logo');
    if (logo) {
      return { url: logo.textContent.trim() };
    }
    
    const icon = feed.querySelector('icon');
    if (icon) {
      return { url: icon.textContent.trim() };
    }

    return null;
  }

  getAtomLink(parent, rel) {
    const links = Array.from(parent.querySelectorAll('link'));
    const link = links.find(l => l.getAttribute('rel') === rel) || links[0];
    return link ? link.getAttribute('href') : '';
  }

  parseRSSItems(channel) {
    return Array.from(channel.getElementsByTagName('item'))
      .map(item => this.parseRSSItem(item))
      .filter(Boolean);
  }

  parseAtomEntries(feed) {
    return Array.from(feed.getElementsByTagName('entry'))
      .map(entry => this.parseAtomEntry(entry))
      .filter(Boolean);
  }

  parseRSSItem(item) {
    try {
      const guid = this.getElementText(item, 'guid') || this.getElementText(item, 'link');
      const enclosure = item.querySelector('enclosure');
      const audioUrl = enclosure?.getAttribute('url');
      
      if (!guid || !audioUrl) {
        return null;
      }

      return {
        guid,
        title: this.getElementText(item, 'title'),
        description: this.cleanDescription(
          this.getElementText(item, 'description') ||
          this.getElementText(item, 'itunes\\:summary')
        ),
        pubDate: this.getDate(item, 'pubDate'),
        duration: this.getElementText(item, 'itunes\\:duration'),
        image: this.getItemImage(item),
        enclosure: {
          url: audioUrl,
          type: enclosure.getAttribute('type') || '',
          length: Number(enclosure.getAttribute('length')) || 0
        },
        link: this.getElementText(item, 'link'),
        author: this.getElementText(item, 'itunes\\:author') ||
                this.getElementText(item, 'author'),
        audioUrl
      };
    } catch (error) {
      console.warn('Fehler beim Parsen eines RSS-Elements:', error);
      return null;
    }
  }

  parseAtomEntry(entry) {
    try {
      const id = this.getElementText(entry, 'id');
      const mediaGroup = entry.querySelector('media\\:group');
      const mediaContent = mediaGroup?.querySelector('media\\:content') || entry.querySelector('media\\:content');
      const enclosure = entry.querySelector('link[rel="enclosure"]');
      
      const audioUrl = mediaContent?.getAttribute('url') || 
                     enclosure?.getAttribute('href') ||
                     '';
      
      if (!id || !audioUrl) {
        return null;
      }

      return {
        guid: id,
        title: this.getElementText(entry, 'title'),
        description: this.cleanDescription(
          this.getElementText(entry, 'content') ||
          this.getElementText(entry, 'summary')
        ),
        pubDate: this.getDate(entry, 'published') || this.getDate(entry, 'updated'),
        duration: this.getElementText(entry, 'itunes\\:duration'),
        image: this.getAtomEntryImage(entry),
        enclosure: {
          url: audioUrl,
          type: mediaContent?.getAttribute('type') || enclosure?.getAttribute('type') || '',
          length: Number(mediaContent?.getAttribute('length') || enclosure?.getAttribute('length')) || 0
        },
        link: this.getAtomLink(entry, 'alternate'),
        author: this.getAtomEntryAuthor(entry),
        audioUrl
      };
    } catch (error) {
      console.warn('Fehler beim Parsen eines Atom-Elements:', error);
      return null;
    }
  }

  getAtomEntryAuthor(entry) {
    const author = entry.querySelector('author');
    if (author) {
      return this.getElementText(author, 'name');
    }
    
    return this.getElementText(entry, 'itunes\\:author') || '';
  }

  getAtomEntryImage(entry) {
    // Verschiedene Medienbild-Formate probieren
    const mediaGroup = entry.querySelector('media\\:group');
    const mediaThumbnail = mediaGroup?.querySelector('media\\:thumbnail') || entry.querySelector('media\\:thumbnail');
    
    if (mediaThumbnail) {
      return mediaThumbnail.getAttribute('url');
    }
    
    // iTunes Bild-Format
    const itunesImage = entry.querySelector('itunes\\:image');
    if (itunesImage) {
      return itunesImage.getAttribute('href');
    }
    
    return null;
  }

  cleanDescription(html) {
    if (!html) return '';
    
    // Einfache Bereinigung von HTML-Tags
    return html
      .replace(/<[^>]+>/g, '') // Entfernen aller HTML-Tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  getItemImage(item) {
    const itunesImage = item.querySelector('itunes\\:image');
    return itunesImage?.getAttribute('href') || null;
  }
}

export default RSSParser;