# MirrorBloom

The site for the MirrorBloom homebrew world and *Tales of the Gilded Goose*, published at
https://mirrorbloom-gilded-goose.github.io/

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
| The newest chapter (the spoiler shield offers chapters up to it) | `latestChapter` in `CONFIG` |
| The countdown's release day and time, or a break message | `release` in `CONFIG` (`paused: 'Back on ...'` shows a message instead) |
| What is blurred as a spoiler, and from which chapter | `MAP` at the top of `assets/spoilers.js`, or `data-ch="12"` on any element |
| Linfay's lecture texts | `assets/lectures.js` (paste each snippet between the backticks) |
| Comments ("Leave your mark") | `comments` in `CONFIG` (needs Discussions and the giscus app on this repository) |
| Spells on the battle map | `SPELLS` in `assets/table-core.js` |
| Where each character is, chapter by chapter, on the map | `CAST` and `PLACES` at the top of `assets/story-map.js` |
| The hover definitions (underlined lore words) | `TERMS` at the top of `assets/glossary.js`; put `data-no-glossary` on a page's `<body>` to switch them off there |
| Festivals (dates, wording, and the look) | `seasons` in `CONFIG`; preview one any day with `?season=veil` (or `illuminance`, `founding`, `marking`, `unity`) on the end of a page address |

## The Table (D&D battle map)

`dm-table.html` is the Dungeon Master's side, sealed in the Sanctum. Maps, characters and logs are saved in that browser; use Map settings, Download map to keep a copy. Players join at `table.html` with the five letter code from Invite players. The DM's browser hosts the game, so keep that tab open while you play. Player screen opens a window for a TV that shows what the players see.

## The Writer's Desk

`desk.html`, sealed in the Sanctum. Drafts are saved in the browser on that device only; use More, Back up every draft. The story notes in the lore tabs are sealed inside `vault.enc`. The Music tab's moods are composed live in the browser by `assets/desk-music.js` (each mood's name, tempo and loudness are in `MOODS` there); YouTube and Spotify links you add are saved on that device. The instrument recordings in `assets/music/` are from the FluidR3 GM soundfont by Frank Wen (CC BY 3.0), via [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts); keep the credit on the Music tab if you reuse them.

## Adding a page

Copy any page (for example `yenfin.html`), change the `<title>`, the `data-section` on `<body>` (it decides which menu item is highlighted), and the content inside `<main>`. Then add it to the Contents menu in `assets/site.js`, and to `assets/compendium.js` if it belongs in the book.

## Sealed content

Everything for the Dungeon Master lives in `vault.enc`, encrypted with a passphrase. Without the passphrase the file cannot be read, even here on GitHub.

- Sign in by clicking the hand mirror at the top of any page.
- Edit sealed lore in the **vault editor** (it is in the Sanctum), then download the new `vault.enc` and upload it here in place of the old one.
- To hide part of a public page, add a snippet in the vault editor and place `<div class="seal-block" data-seal="your-key" data-lines="3"></div>` (or `<span class="seal" data-seal="your-key" data-len="80"></span>` inside a sentence) where it should go. Visitors see redaction bars; signed in, you see the text.
- Never commit an unsealed backup of the vault to this repository.

The full guide is in the Sanctum under "How the Sanctum works".
