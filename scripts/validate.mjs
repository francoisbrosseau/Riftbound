import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const fail=m=>{throw Error(m)};
const dir='content/articles';const files=fs.readdirSync(dir).filter(n=>n.endsWith('.json'));
const ids=new Set();const editions=fs.readdirSync('content/editions').filter(n=>/^\d{4}-\d\d-\d\d\.json$/.test(n)).sort();
if(!editions.length)fail('No editions');
const latest=JSON.parse(fs.readFileSync(path.join('content/editions',editions.at(-1)),'utf8'));
if(latest.articles.length!==6)fail('Exactly six daily articles required');
const allowed=new Set(['THE 40K CHRONICLES','GAMING NEWS','GAMING CULTURE','PC & TECH','MMORPG','RPG','CONSOLE & CO-OP','INDUSTRY','GUIDES']);
let last=[];
for(const f of files){const a=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
 if(!a.id||a.id+'.json'!==f||ids.has(a.id))fail('Bad or duplicate ID: '+f);ids.add(a.id);
 if(!allowed.has(a.category)||!a.title||!a.dek||!Array.isArray(a.body)||a.body.length<4)fail('Incomplete article: '+f);
 if(!/^\d{4}-\d\d-\d\d$/.test(a.date)||!/^assets\/covers\/[a-z0-9-]+\.(svg|png|webp)$/.test(a.image)||!fs.existsSync(a.image))fail('Invalid date or missing original image: '+f);
 if(a.body.join(' ').match(/\b(as an AI|I cannot|lorem ipsum)\b/i))fail('Generated boilerplate: '+f);
 const wc=a.body.join(' ').split(/\s+/).length;if(wc<(a.category==='THE 40K CHRONICLES'?2000:1000))fail('Feature article is too brief: '+wc);
 if(a.date===latest.date)last.push(a);
}
for(const id of latest.articles)if(!ids.has(id))fail('Edition story missing: '+id);
if(last.filter(a=>latest.articles.includes(a.id)).length!==6)fail('Six dated articles required');
if(last.filter(a=>a.category==='THE 40K CHRONICLES'&&latest.articles.includes(a.id)).length!==1)fail('One lore chapter required');
if(!fs.readFileSync('index.html','utf8').includes(latest.date))fail('Homepage stale');
for(const id of latest.articles)if(!fs.existsSync(path.join('stories',id+'.html')))fail('Reading page missing '+id);
for(const x of ['HAYVN','WILDWIRE','RITUWILD','SANCTUARY'])if(!fs.readFileSync('index.html','utf8').includes(x))fail('Missing footer brand '+x);
console.log('PASS: Six dated stories, original artwork, lore depth, archive links and Infinite Horizon footers');
// Validate what readers receive, including relative image paths on nested pages.
const pages=['index.html','chapters.html','gaming.html','about.html',...fs.readdirSync('stories').filter(x=>x.endsWith('.html')).map(x=>'stories/'+x)];
for (const page of pages) {
 const html=fs.readFileSync(page,'utf8');
 if (/images\.unsplash\.com/.test(html)) fail('Stock image override returned: '+page);
 for (const [,attribute,value] of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
  if (/^(https?:|#|mailto:|tel:)/.test(value)) continue;
  const target=path.resolve(path.dirname(page),decodeURIComponent(value.split(/[?#]/)[0]));
  if(!fs.existsSync(target)) fail('Broken '+attribute+' in '+page+': '+value);
 }
 if (!html.includes('assets/riftbound-footer-logo.webp')) fail('Original logo missing: '+page);
}
for (const editionFile of editions) {
 const edition=JSON.parse(fs.readFileSync(path.join('content/editions',editionFile),'utf8'));
 if(edition.articles.length!==6||new Set(edition.articles).size!==6) fail('Invalid edition '+editionFile);
 const images=new Set();
 for(const id of edition.articles){
  const a=JSON.parse(fs.readFileSync(path.join(dir,id+'.json'),'utf8'));
  if(a.date!==edition.date) fail('Edition date mismatch: '+id);
  if(fs.statSync(a.image).size<1000) fail('Empty or corrupt cover: '+id);
  if(a.image.endsWith('.svg')) fail('Placeholder cover still active: '+id);
  const hash=crypto.createHash('sha256').update(fs.readFileSync(a.image)).digest('hex');
  if(images.has(hash)) fail('Repeated artwork: '+editionFile);images.add(hash);
 }
}
console.log('PASS: All rendered local links and images, original logo, six distinct covers per edition');
