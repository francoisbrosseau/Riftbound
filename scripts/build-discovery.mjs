import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export const base = 'https://riftboundmag.com/';
export const xml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function discovery(records) {
  const sorted = [...records].sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  if (!sorted.length) throw Error('Cannot publish an empty discovery index');
  const latest = sorted[0].date;
  const pages = [{file:'',date:latest},{file:'chapters.html',date:latest},{file:'gaming.html',date:latest},{file:'about.html'},...sorted.map(a=>({file:`stories/${encodeURIComponent(a.id)}.html`,date:a.date}))];
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.map(p=>`  <url><loc>${xml(base+p.file)}</loc>${p.date?`<lastmod>${p.date}</lastmod>`:''}</url>`).join('\n')+'\n</urlset>\n';
  const rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>RIFTBOUND MAG</title><link>'+base+'</link><description>Independent Warhammer 40,000 chronicles and gaming features.</description><language>en</language><atom:link href="'+base+'rss.xml" rel="self" type="application/rss+xml"/>' + sorted.slice(0,50).map(a=>`<item><title>${xml(a.title)}</title><link>${xml(base+'stories/'+encodeURIComponent(a.id)+'.html')}</link><guid isPermaLink="true">${xml(base+'stories/'+encodeURIComponent(a.id)+'.html')}</guid><description>${xml(a.dek)}</description><category>${xml(a.category)}</category><pubDate>${new Date(a.date+'T12:00:00Z').toUTCString()}</pubDate></item>`).join('')+'</channel></rss>\n';
  return {sitemap,rss,pages};
}
export function buildDiscovery() {
  const records = fs.readdirSync('content/articles').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join('content/articles',f),'utf8')));
  const {sitemap,rss,pages} = discovery(records);
  fs.writeFileSync('sitemap.xml',sitemap); fs.writeFileSync('rss.xml',rss);
  for (const p of pages) {
    const file=p.file||'index.html';
    const source=fs.readFileSync(file,'utf8');
    const metadata=`<link rel="canonical" href="${xml(base+p.file)}"><link rel="alternate" type="application/rss+xml" title="RIFTBOUND MAG" href="${base}rss.xml">`;
    // The main renderer runs first; replacing these tags also makes this step idempotent.
    const clean=source.replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g,'');
    fs.writeFileSync(file,clean.replace('</head>',metadata+'</head>'));
  }
  console.log(`DISCOVERY_BUILT: ${pages.length} sitemap URLs and ${Math.min(records.length,50)} RSS entries`);
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) buildDiscovery();
