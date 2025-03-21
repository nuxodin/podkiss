## install
<script type=module async src="https://cdn.jsdelivr.net/gh/u2ui/u2@x.x.x/u2/auto.min.js"></script>
Lädt CSS (Normalisierung, Hilfreiche Defaults).

## CSS
konfigurierbar:
--hsl-h: 262;
--hsl-s: 83%;
--hsl-l: 58%;
generiert:
--color: Theme-Farbe
--color-dark: Dunkle Variante
--color-text: Textfarbe
--color-bg: Hintergrund

## CSS Klassen
.u2-grid: Autoflow, Abstände enthalten.
.u2-flex: Abstände enthalten.
.u2-badge: badge-style, oft in verwendung mit <small>

## Elemente
<u2-time datetime="${iso}" second type=relative>fallback für schmaschienen, ohne js usw.</u2-time>: formatiert zeit
<u2-number>: formatiert nummern
<u2-bytes>333333</u2-bytes>: formatiert bytes
<u2-tabs>
    <h2>wird Tab<u2>
    <div>wird Panel (alles nach hx)</div>
</u2-tabs>
</u2-ico>star</u2-ico> oder wenn nicht accessible </u2-ico icon=star></u2-ico>

## Javascript
dialog.alert, prompt, confirm: Wie nativ, aber async.

## Attribute
u2-confirm="sure?": Verzögert Click/Submit bei Buttons/Formularen
u2-skin="invert": Tauscht BG-/Textfarben, setzt BG-Farbe