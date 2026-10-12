# MirrorBloom

The site for the MirrorBloom homebrew world and *Tales of the Gilded Goose*, published at
https://natedog9928-png.github.io/MirrorBloom/

## How the site is put together

Every page is a plain `.html` file in this folder. The header, the Contents menu, the footer, the moons and the mirror crossing are added to every page by `assets/site.js`, so you never copy navigation between files.

| To change | Edit |
| --- | --- |
| The top menu or the Contents menu | `CONFIG` at the top of `assets/site.js` |
| The Royal Road link (every button on the site) | `royalRoad` in the same `CONFIG` |
| Colors, type and layout | `assets/site.css` (both worlds' colors are at the top) |
| Chapters in the on-site reader | `chapters.js` (instructions at the top) |
| Map pins, currents, tunnels and wells | `assets/map-data.js` (use Pin mode on the map page to read positions) |
| The Archfey sigils | `assets/sigils.js` |
| What goes in the printable Compendium | `PARTS` at the top of `assets/compendium.js` |

## Adding a page

Copy any page (for example `yenfin.html`), change the `<title>`, the `data-section` on `<body>` (it decides which menu item is highlighted), and the content inside `<main>`. Then add it to the Contents menu in `assets/site.js`, and to `assets/compendium.js` if it belongs in the book.

## Sealed content

Everything for the Dungeon Master lives in `vault.enc`, encrypted with a passphrase. Without the passphrase the file cannot be read, even here on GitHub.

- Sign in by clicking the hand mirror at the top of any page.
- Edit sealed lore in the **vault editor** (it is in the Sanctum), then download the new `vault.enc` and upload it here in place of the old one.
- To hide part of a public page, add a snippet in the vault editor and place `<div class="seal-block" data-seal="your-key" data-lines="3"></div>` (or `<span class="seal" data-seal="your-key" data-len="80"></span>` inside a sentence) where it should go. Visitors see redaction bars; signed in, you see the text.
- Never commit an unsealed backup of the vault to this repository.

The full guide is in the Sanctum under "How the Sanctum works".
