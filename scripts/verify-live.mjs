import fs from 'node:fs';
import crypto from 'node:crypto';
const date = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto'}).format(new Date());
const edition = JSON.parse(fs.readFileSync(`content/editions/${date}.json`, 'utf8'));
if (edition.articles.length !== 6) throw Error('Expected six articles in today’s edition');
const stories = edition.articles.map(id => JSON.parse(fs.readFileSync(`content/articles/${id}.json`, 'utf8')));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const base = 'https://riftboundmag.com/';
async function read(file) {
  const response = await fetch(new URL(file, base), {signal:AbortSignal.timeout(30000),cache:'no-store'});
  if (!response.ok) throw Error(`${file}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
for (let attempt = 0; attempt < 8; attempt++) {
  try {
    const home = (await read('')).toString();
    if (!home.includes(`datetime="${date}"`)) throw Error('Homepage edition date is stale');
    await Promise.all(stories.map(async story => {
      const page = (await read(`stories/${story.id}.html`)).toString();
      if (!page.includes(story.image) || !page.includes(story.date)) throw Error(`Stale article: ${story.id}`);
      if (hash(await read(story.image)) !== hash(fs.readFileSync(story.image))) throw Error(`Cover mismatch: ${story.image}`);
    }));
    for (const file of ['chapters.html','gaming.html']) await read(file);
    console.log(`LIVE_VERIFIED ${date}: six articles and six matching covers`);
    process.exit(0);
  } catch (error) {
    if (attempt === 7) throw error;
    console.log(`Live deployment not ready: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}
