# The Global Ledger — Wednesday 18 November 2026 in one image

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node 22](https://img.shields.io/badge/Node-22-green.svg)](https://nodejs.org)
[![make.fun bounty](https://img.shields.io/badge/make.fun-news--image--20261118-blue.svg)](https://make.fun/bounty/news-image-20261118)

A [make.fun](https://make.fun/bounty/news-image-20261118) entry for
**news-image-20261118**: sum up 18 November 2026's world news in one image.

## What it is

One 1024×1024 PNG, drawn from scratch by `main.ts` (Node 22, standard
library only, no network, no dependencies): a newspaper front page with

- a navy masthead bar — **WEDNESDAY 18 NOVEMBER 2026**
- **30 stories** across 6 continents: a 4×3 grid of 12 illustrated features
  plus an 18-item ALSO list
- a dotted world map with 30 numbered pins (numbers match the stories)
- a hand-drawn vector sans font (bold strokes, no pixel font) so the page
  stays legible at 300px across

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png — deterministic: two runs give identical bytes
```

## Refresh the news

Every story lives in the single `STORIES` array at the top of `main.ts`
(headline, deck, theme, map pin). Edit that array only; the drawing code
below it never needs touching for a content refresh.

## License

MIT — see [LICENSE](LICENSE).
