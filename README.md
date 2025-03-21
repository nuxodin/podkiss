# Podkiss

A minimalist podcast player that runs entirely in the browser.

## About the Project

Podkiss is a simple yet powerful podcast player that works client-side and stores all data locally in IndexedDB. The application allows users to search for podcasts, subscribe to them, and listen to episodes directly in the browser.

### Key Features

- 🔍 Search for podcasts
- ➕ Subscribe to and manage podcasts
- 🎧 Play episodes
- 💾 Local storage in IndexedDB
- 🔄 Update podcast feeds
- 📱 Responsive design for desktop and mobile

### Technologies

- Vanilla JavaScript
- Preact for the UI
- IndexedDB for data storage
- Deno for the CORS proxy server

## Installation & Execution

### Prerequisites

- [Deno](https://deno.land/) for the proxy server

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/your-username/podkiss.git
   cd podkiss
   ```

2. Start the CORS proxy server:
   ```
   deno task start
   ```

3. Open `index.html` in your browser or use a local HTTP server.

## Project Structure

```
podkiss/
├── index.html         # Main HTML file
├── server.ts          # CORS proxy server
├── src/
│   ├── app.js         # Main application logic
│   ├── components/    # UI components
│   ├── lib/           # Helper libraries
│   ├── services/      # Services for database, podcasts, etc.
│   └── styles/        # CSS stylesheets
└── tests/             # Test files
```

## Usage

1. **Search for podcasts**: Click on "Find podcasts" and search for your favorite podcasts
2. **Subscribe to a podcast**: Click on a podcast in the search results to subscribe to it
3. **Listen to episodes**: Select a podcast from your list and click on an episode to play it
4. **Update podcast**: In the detailed view of a podcast, you can update it to load new episodes

## Special Features

- Podkiss works completely client-side, the only server component is the CORS proxy
- All data is stored in the browser's IndexedDB
- The application uses modern web APIs and is optimized for current browsers

## License

MIT, See [LICENSE](LICENSE) for more information.