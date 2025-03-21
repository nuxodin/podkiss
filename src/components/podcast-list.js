import { html } from 'https://esm.sh/htm@3.1.1/preact/index.mjs';
import { Component } from 'https://unpkg.com/preact@10.15.1/dist/preact.module.js';

export class PodcastList extends Component {
  render() {
    const { podcasts, onPodcastClick } = this.props;

    if (!podcasts?.length) {
      return html`
        <div class="empty-state">
          <p>Noch keine Podcasts abonniert. Nutzen Sie die "Podcasts finden"-Funktion, um Ihre ersten Podcasts hinzuzufügen.</p>
        </div>
      `;
    }

    return html`
      <div class="u2-grid" style="--u2-Items-width:15rem">
        ${podcasts.map(podcast => html`
          <div 
            class="card"
            onClick=${() => onPodcastClick(podcast)}
            key=${podcast.feedUrl}
            style="cursor: pointer; display:flex; flex-direction:column; align-items:center; text-align:center;"
          >
            ${podcast.imageUrl && html`
              <img 
                src=${podcast.imageUrl} 
                alt=${podcast.title}
                style="margin-bottom: .8rem;"
                width="140"
                height="140"
              />
            `}
            <h2 style="font-size: 1.1rem; margin:0">${podcast.title}</h2>
            <p style="font-size: 0.9rem; margin:0 0 .4rem 0">${podcast.author}</p>
            <p style="margin-top: auto;">
              <small>${podcast.episodes?.length || 0} Episoden</small>
            </p>
          </div>
        `)}
      </div>
    `;
  }
}