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

`daily-publish.yml` is the single scheduled publisher. It starts at 07:17 America/Toronto, with recovery windows at 08:17, 09:17, 10:17, 11:17, 12:17, 14:17 and 16:17. GitHub may delay or drop scheduled events; a configured schedule is not proof of publication. The manual-only `daily-edition.yml` delegates to the same workflow. Date-based idempotency prevents duplicate editions. If today's edition already exists, recovery redeploys and verifies it without generating paid content again. Every current workflow publication checks the public date, six article URLs and six cover hashes after deployment.

The publisher researches and generates one substantial lore chapter and five features spanning gaming culture, PC, MMORPGs, RPGs and console/cooperative gaming, each with original art. It validates the complete edition before committing. If main changes during generation, publication stops rather than rebasing stale rendered pages. A successful daily commit explicitly calls the reusable Pages workflow because commits made with GITHUB_TOKEN do not trigger another push workflow. Normal source commits also deploy through `pages.yml`.

### Verified automation test — October 19, 2026

The owner corrected the repository API secret and the read-only authentication check passed. The complete October 20 preview then passed in run https://github.com/francoisbrosseau/Riftbound/actions/runs/39353390224 on commit 1d5e168ddbfdf486f193002b2fa5fc8de1f0075f: six new sourced articles, six distinct generated covers, generated homepage/archives/reading pages and all validation checks. The next lore chapter contained 1,497 words. The preview had no Git credentials and confirmed production was untouched; October 20 was not published early.

Live API tests caught and repaired issues that mocks alone could not establish: research and schema-constrained drafting now use separate responses linked by the research response ID, source URLs must come from the retrieved registry, and short drafts receive bounded expansion using their previous context. Publisher tests still cover six-category output, request structure, duplicate-date prevention and failure on invalid credentials. The legacy launch-artwork workflow only verifies recovered original files.

The full paid API preview is now manual-only in automation-test.yml, so ordinary code edits do not automatically regenerate six articles and images. The daily schedule remains enabled, and the normal Pages deployment path has passed. A complete successful preview demonstrates the generation/build path, not a guarantee of future scheduler timing or external API availability. The first unattended newly generated edition remains to be observed.

## Network

Footer links: HAYVN Studio, HAYVN Sanctuary, WILDWIRE and RITUWILD.

Warhammer 40,000 and related names belong to Games Workshop. RIFTBOUND is independent and unaffiliated. Its articles are original commentary, not reproduced novels or rulebooks; editorial illustrations are independent artwork rather than official screenshots.
