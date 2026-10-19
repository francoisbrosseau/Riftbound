# RIFTBOUND MAG — An Infinite Horizon Publication

**Beyond the Screen. Into the Worlds.**

RIFTBOUND is an independent gothic-futurist gaming magazine. Every daily edition aims to publish:
- One substantial, original, source-checked, beginner-friendly Warhammer 40,000 lore chapter, serialized and indexed;
- Five researched gaming stories spanning news, PC, MMO, RPG and culture;
- Six original artwork images generated for that edition (no publisher-owned artwork or copied logos).

The Oct 19 launch edition ships with six original vector illustrations and six editorial articles. Future editions use the OpenAI image API for six distinct new visual artworks and the OpenAI text API for original editorial articles. Original generation does not guarantee noninfringement; prompts explicitly exclude protected character designs, faction insignia and promotional artwork. Faction names are only used in independent commentary, never represented as affiliation.

## Automation

GitHub Actions:
- `daily-publish.yml`: runs at 07:15 America/Toronto (DST-safe UTC windows), idempotent by edition date; requires an `OPENAI_API_KEY` GitHub Actions repository secret. GitHub Actions secrets are per-repository and **cannot be inherited automatically from WILDWIRE**.
- `pages.yml`: validates and deploys `main` to Pages.

Configure **Settings → Secrets and variables → Actions → New repository secret → OPENAI_API_KEY**, and **Settings → Pages → Source → GitHub Actions**. No API key has been read or added by this assistant. The scheduled workflow and generator have been committed, but actual unattended publishing is unverified until this secret is configured and a successful issue is observed. Once configured, generation consumes paid API tokens and images. Do not assume daily publication succeeds before its first real run passes.

`npm run build` regenerates all 40K and gaming archives and story pages from JSON article source. `npm test` validates each complete six-story edition and missing source artwork.

## Intellectual property and editorial boundaries

Independent, unofficial, unaffiliated. Warhammer 40,000 is intellectual property of Games Workshop. RIFTBOUND does not reproduce copyrighted novels, rulebooks, lore book chapters, or promotional art. Articles are independently authored commentary and explanations; canon can vary by edition and retcons. Gaming news requires external verification; missing evidence causes an editorial failure instead of a fabricated claim. The world of Warhammer contains many factions and events rather than a definitive finite chapter count, so this is a curated evolving study series, not a reproduction of every licensed work.

## Infinity Horizon network

Footer links: HAYVN Studio, HAYVN Sanctuary, WILDWIRE, RITUWILD.

Website URL after GitHub Pages is enabled: https://francoisbrosseau.github.io/Riftbound/

## Publication safeguards

Daily publishing skips a date already archived, checks one detailed lore chapter and five distinct 800–1450-character gaming articles, generates six different editorial covers, builds the site, and validates before committing. All articles and images are prepared before writing an issue file. On failed generation/validation no git commit is pushed. The generator intentionally focuses on evergreen gaming commentary rather than falsely inventing breaking news. The GitHub Actions schedule starts at 07:15 Toronto local time, not a guarantee that a completed issue is live at 07:15.
