- Projekt erst überblicken.
- Oft ist der Code absichtlich so geschrieben, wie er ist.
- Zerstöre nichts

## Minimalistisch
- So wenig wie möglich, so viel wie nötig.
- Code nicht aufblähen.
- Toten Code identifizieren
- Nicht unaufgefordert neue Funktionalität hinzufügen
- Nicht unaufgefordert stylen (nur funktional).

## Frontend
- Neue Webtechnologien, alte Browser ignorieren
- Kein Tooling (Tailwind, React, Sass...)
- Vermeide media-queries wenns geht, besser flexbox, grid oder container-queries
- Nutze rem, nicht px ausser vieleicht bei dünnen linien (1px)

## Projekt
- Hauptfunkitonalität: podcasts suchen, hinzufügen, abonnieren/deabonnieren, episoden abspielen
- Alles in indexeddb gespeichert
- Alles ohne Server lauffähig ausser dem proxy (server.ts) um cors zu umgehen.
- Verwende u2ui. Anweisungen: ./copilot-instructions.u2ui.md

