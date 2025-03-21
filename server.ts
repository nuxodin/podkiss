import { serve } from "https://deno.land/std@0.212.0/http/server.ts";

async function handler(req) {
  const url = new URL(req.url);
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // OPTIONS-Anfragen für CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Nur GET-Anfragen an /proxy verarbeiten
  if (req.method !== 'GET' || !url.pathname.startsWith('/proxy')) {
    return new Response('Methode nicht erlaubt', { status: 405, headers });
  }

  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return new Response('URL-Parameter fehlt', { status: 400, headers });
  }

  try {
    // Ziel-URL abrufen
    const response = await fetch(targetUrl, { timeout: 10000 });
    
    // Kopiere die Original-Header
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control')) {
        headers.set(key, value);
      }
    });

    // Antwort streamen
    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Fehler beim Abrufen:', error);
    return new Response('Fehler beim Abrufen des Inhalts', { status: 500, headers });
  }
}

console.log("Proxy-Server läuft auf http://localhost:8000");
await serve(handler, { port: 8000 });