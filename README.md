# Dot Line

A dependency-free web component for interactive dot lettering. Letters can be cut out of a field of dots or drawn with the dots themselves. Hovering pushes the dots away; springs bring them home, and the collision solver keeps the circles separated.

[Live playground](https://kraft.team/components/dot-line/) · [Source](https://github.com/ahmadTorkaman/dot-line) · [MIT license](LICENSE)

## Try it

Open `dist/demo.html` directly in a browser. It contains the component and demo in a single file, with no network requests or dependencies.

For the source demo, run `npm start` and open `http://localhost:4173`. This optional server needs Python 3.

## Add it to any website

Download or clone this repository, copy `dist/dot-line.js` to your website, and load it once:

```html
<script src="/assets/dot-line.js" defer></script>
<dot-line text="Robot"></dot-line>
```

The bundles are committed, so using the component requires no build step, package manager, or runtime dependency. This project is not currently published on npm. The live playground's **Copy code** button also provides a hosted, versioned script URL with your selected settings.

The element fills its container's width and derives its height from the text. No fixed canvas dimensions are needed. Long text wraps automatically; literal newlines create separate lines. The alphabet supports uppercase and lowercase letters, numbers, spaces, and common punctuation. Other characters use the alphabet module's fallback glyph.

For ES modules, use the single bundled `dist/dot-line.mjs`, or copy the three source modules together:

```html
<script type="module" src="/assets/dot-line/dot-line.mjs"></script>
<dot-line text="Hello"></dot-line>
```

You can also register the bundled module from browser-side application code:

```js
import './assets/dot-line.mjs';
```

In a framework, render the same `<dot-line>` element and pass its settings as attributes. In an application with server-side rendering, load the module on the client because registration uses browser APIs.

## Customize it

All settings belong to the component, so they work on your own website as well as in the playground:

```html
<dot-line
  text="Robot"
  dot-color="#d3b638"
  background="#241329"
  strength="70"
  radius="0.45"
  connect="vertical"
  dot-style="solid"
  mode="cutout"
  max-columns="70"
></dot-line>
```

| Attribute | Values | Default | Effect |
| --- | --- | --- | --- |
| `text` | Text string | `Robot` | Case-sensitive lettering; supports wrapping and newlines. |
| `radius` | 0.12–0.47 | 0.45 | Dot radius relative to grid pitch; diameter ranges from 24% to 94% of a grid cell. |
| `connect` | `none`, `vertical`, `horizontal` | `none` | Connect occupied grid neighbors along one axis. |
| `dot-style` | `solid`, `outline` | `solid` | Filled dots or hollow rings. |
| `mode` | `cutout`, `letters` | `cutout` | Dots surround the lettering or form its strokes. |
| `strength` | 0–120 | 70 | Cursor repulsion; `0` disables repulsion. |
| `dot-color` | CSS color | `#d3b638` | Dot, ring, and connection color. |
| `background` | CSS color | `#241329` | Canvas background color. |
| `max-columns` | Integer, 12–180 | `35` below 500px wide; otherwise `70` | Maximum grid columns, including outer margins; controls text wrapping. |
| `static` | Boolean attribute | Absent | Disables pointer interaction and animation when present. |

Radius is capped so the resting circles remain separated. Outline strokes stay inside the same collision radius, and outline connections stop at the circle boundaries to keep their centers hollow. Links follow their original neighboring dots; they never skip an empty grid cell or cross between text lines. Stretched links fade and disappear instead of extending across letters. The collision solver remains active in every mode.

For small outlined letter dots connected vertically:

```html
<dot-line text="Robot" radius="0.22" mode="letters" dot-style="outline" connect="vertical"></dot-line>
```

Numeric settings clamp to their valid range; `max-columns` is rounded to an integer. Empty or invalid numeric values use the defaults. Unrecognized mode, connection, or style values use the defaults. For `static`, presence means enabled: omit it or remove it to restore interaction, rather than writing `static="false"`.

Colors can also be set with CSS custom properties; color attributes take precedence:

```css
dot-line {
  --dot-color: #d3b638;
  --dot-background: #241329;
}
```

## Change settings at runtime

Changing an attribute rebuilds and redraws the component immediately. Each element has its own settings:

```js
await customElements.whenDefined('dot-line');
const lettering = document.querySelector('dot-line');
lettering.text = 'Play'; // Convenience property for the text attribute.
lettering.setAttribute('radius', '0.22');
lettering.setAttribute('connect', 'horizontal');
lettering.setAttribute('dot-style', 'outline');
lettering.setAttribute('mode', 'letters');
lettering.setAttribute('strength', '100');

lettering.setAttribute('static', ''); // Pause interaction.
lettering.removeAttribute('static'); // Restore interaction.

// Recompute geometry/colors after changing CSS or revealing a hidden container:
lettering.style.setProperty('--dot-color', '#f1ca4f');
lettering.refresh();
```

Use the `static` attribute to disable interaction. The component also respects `prefers-reduced-motion`, pauses while hidden or off screen, and removes its observers and listeners when removed from the document. Touch users can press and move; normal page scrolling remains available. The lettering has a hidden text equivalent for screen readers.

## Build and verify

Node 22 or newer is sufficient to build and run the tests. No installation step is needed:

```sh
npm test
npm run build
```

`alphabet.mjs` holds the editable glyph masks. `physics.mjs` owns repulsion, springs and collision constraints. `dot-line.mjs` is the responsive canvas custom element. The build creates standalone browser bundles and a self-contained demo.

The tests stress pointer sweeps and collision separation at both dot-size limits in cutout and letter modes, verify original-grid connection topology and outline drawing, and check settings and the custom element's event lifecycle. Check visual changes in your target browser as well. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License

MIT. You may use, modify, and redistribute Dot Line, including in commercial projects, under the terms in [LICENSE](LICENSE).
