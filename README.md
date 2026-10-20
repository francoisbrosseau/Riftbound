# RIFTBOUND MAGAZINE

https://riftboundmag.com — an independent Infinite Horizon gaming publication.

## Source and artwork

`content/articles/*.json` is the editorial source; `npm run build` renders the homepage, archives and complete reading pages. The launch edition preserves Chapter 001 — The Wolves of Fenris and five gaming features. The six original raster covers and original shattered eclipse logo were recovered from the approved Riftbound conversation and optimized to local WebP files. Partner logos are authentic local copies. Stock-photo overrides have been removed.

The homepage follows the approved future-gothic composition: architectural background, crimson accents, antique gold framing, lead chronicle and five editorial cards. Mobile uses full-width images and stacked reading cards. Preserve CNAME and permanent story URLs.

## Validation

- `npm run check`: syntax-check the publisher, renderer and validator.
- `npm run build`: regenerate all public HTML from editorial JSON.
- `npm test`: check six-story editions, distinct original artwork, every local link/image in rendered pages, and publisher integration tests with mocked API responses (no paid generation).

## Publishing and deployment

`daily-publish.yml` is the single scheduled publisher. It starts at 07:15 America/Toronto using two UTC windows and a local-hour guard for daylight saving. Generation and deployment take additional time. The manual-only `daily-edition.yml` delegates to the same workflow for compatibility. Date-based idempotency prevents duplicate editions.

The publisher researches and generates one substantial lore chapter and five features spanning gaming culture, PC, MMORPGs, RPGs and console/cooperative gaming, each with original art. It validates the complete edition before committing. If main changes during generation, publication stops rather than rebasing stale rendered pages. A successful daily commit explicitly calls the reusable Pages workflow because commits made with GITHUB_TOKEN do not trigger another push workflow. Normal source commits also deploy through `pages.yml`.

### Current external blocker

The inspected failed launch-artwork run (39344361927) returned OpenAI HTTP 401 `invalid_api_key`. The repository Actions secret `OPENAI_API_KEY` must contain a valid API credential, not its variable name. Credentials were not copied from other repositories. API responses and paid daily generation cannot be confirmed until that credential is corrected and a new complete edition runs successfully. The launch-artwork workflow now only verifies the recovered files; it never regenerates them.

Publisher fixes include the malformed Responses request object, escaped template literals, missing console/culture categories, duplicate competing schedules, nested article image URLs and automatic deployment after bot commits. Publisher tests cover the API request schema, complete six-category output, repeat-run idempotency and fail-closed HTTP 401 handling. These tests do not establish that the configured external API credential works.

## Network

Footer links: HAYVN Studio, HAYVN Sanctuary, WILDWIRE and RITUWILD. Only Riftbound source was changed.

Warhammer 40,000 and related names belong to Games Workshop. RIFTBOUND is independent and unaffiliated. Its articles are original commentary, not reproduced novels or rulebooks; editorial illustrations are independent artwork rather than official screenshots.
