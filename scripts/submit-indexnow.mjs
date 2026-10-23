import fs from 'node:fs';
import {base,discovery} from './build-discovery.mjs';
const key=fs.readFileSync('config/indexnow-key.txt','utf8').trim();
if(!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw Error('Invalid IndexNow key');
const records=fs.readdirSync('content/articles').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync('content/articles/'+f,'utf8')));
const {pages}=discovery(records);
const latest=records.map(a=>a.date).sort().at(-1);
const selected=process.argv.includes('--all')?pages:pages.filter(p=>p.date===latest);
const urlList=selected.map(p=>base+p.file);
// Ownership file must be publicly deployed before submitting URLs.
const ownership=await fetch(base+key+'.txt',{signal:AbortSignal.timeout(30000),cache:'no-store'});
if(!ownership.ok||(await ownership.text()).trim()!==key) throw Error('Live IndexNow ownership file is missing or stale');
for(let attempt=0;attempt<4;attempt++) {
  try {
    const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:new URL(base).host,key,keyLocation:base+key+'.txt',urlList}),signal:AbortSignal.timeout(30000)});
    if(response.status===200||response.status===202){console.log(`INDEXNOW_RECEIVED HTTP ${response.status}: ${urlList.length} URLs (${latest}). Receipt is not proof of indexing.`);process.exit(0);}
    if(response.status!==429&&response.status<500)throw Object.assign(Error(`IndexNow rejected request: HTTP ${response.status}`),{permanent:true});
    throw Error(`IndexNow temporarily unavailable: HTTP ${response.status}`);
  }catch(error){if(error.permanent||attempt===3)throw error;console.log(error.message+'; retrying');await new Promise(resolve=>setTimeout(resolve,15000));}
}
