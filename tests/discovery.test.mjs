import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {discovery,base} from '../scripts/build-discovery.mjs';
test('sitemap keeps permanent archived URLs and RSS escapes editorial text',()=>{
 const data=[{id:'old-story',date:'2020-01-01',title:'Old & good',dek:'A < B',category:'RPG'},{id:'new-story',date:'2026-10-23',title:'Today',dek:'New feature',category:'PC & TECH'}];
 const out=discovery(data);
 assert.equal(out.pages.length,6);
 assert.ok(out.sitemap.includes(base+'stories/old-story.html'));
 assert.ok(out.rss.includes('Old &amp; good'));
 assert.ok(out.rss.includes('A &lt; B'));
 assert.ok(out.rss.includes('PC &amp; TECH'));
 assert.ok(out.rss.indexOf('<title>Today</title>')<out.rss.indexOf('<title>Old &amp; good</title>'));
});
test('built discovery covers every article and does not link missing pages',()=>{
 const files=fs.readdirSync('content/articles').filter(f=>f.endsWith('.json'));
 const map=fs.readFileSync('sitemap.xml','utf8');
 for(const file of files){const a=JSON.parse(fs.readFileSync('content/articles/'+file));assert.ok(map.includes(base+'stories/'+a.id+'.html'));}
 assert.equal([...map.matchAll(/<loc>/g)].length,files.length+4);
 const key=fs.readFileSync('config/indexnow-key.txt','utf8').trim();assert.equal(fs.readFileSync(key+'.txt','utf8').trim(),key);
 assert.ok(fs.readFileSync('robots.txt','utf8').includes(base+'sitemap.xml'));
 assert.ok(fs.readFileSync('index.html','utf8').includes('rel="canonical" href="'+base+'"'));
});
