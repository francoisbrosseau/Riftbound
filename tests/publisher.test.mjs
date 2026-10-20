import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const publisher=path.resolve('scripts/publish.mjs');
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'riftbound-publisher-'));
 fs.mkdirSync(path.join(dir,'content/articles'),{recursive:true});
 fs.mkdirSync(path.join(dir,'content/editions'),{recursive:true});
 fs.writeFileSync(path.join(dir,'content/roadmap.json'),JSON.stringify(['The Adeptus Astartes']));
 fs.writeFileSync(path.join(dir,'content/articles/launch.json'),JSON.stringify({id:'launch',title:'Chapter 001 — The Wolves of Fenris',category:'THE 40K CHRONICLES',date:'2000-01-01',body:['existing content']}));
 return dir;
}
test('complete six-category edition, correct API schema, and no duplicate publication',()=>{
 const dir=fixture();
 try {
  const mock=path.join(dir,'mock.mjs');
  fs.writeFileSync(mock,`let article=0;globalThis.fetch=async(url,options)=>{
   const input=JSON.parse(options.body);
   if(url.endsWith('/responses')){
    if(input.tools){
     if(input.tool_choice!=='required'||!input.include.includes('web_search_call.action.sources'))throw Error('Research must search');
     return {ok:true,json:async()=>({id:'research-'+article,status:'completed',output:[{type:'web_search_call',action:{sources:[{url:'https://example.com/one'},{url:'https://example.com/two'}]}}]})};
    }
    if(!input.previous_response_id||input.max_output_tokens!==8000||input.text.max_output_tokens)throw Error('Draft must retain verified research and valid schema');
    const lore=article===0;
    const title=lore?'Chapter 002 — The Adeptus Astartes':'Feature '+article;
    const paragraph=Array(lore?260:125).fill('editorial').join(' ');
    const body=Array.from({length:6},(_,i)=>['## Section '+i,paragraph]).flat();
    article++;
    return {ok:true,json:async()=>({status:'completed',output:[{type:'web_search_call',action:{sources:[{url:'https://example.com/one'}]}},{content:[{type:'output_text',text:JSON.stringify({title,dek:'A distinct editorial feature.',body,sources:[{title:'Source one',url:'https://example.com/one'},{title:'Source two',url:'https://example.com/two'}],visualBrief:'A distinct gothic world.'}),annotations:[]}]}]})};
   }
   return {ok:true,json:async()=>({data:[{b64_json:Buffer.alloc(21000).toString('base64')}]})};
  };`);
  const args=['--import',mock,publisher];
  const first=spawnSync(process.execPath,args,{cwd:dir,env:{...process.env,OPENAI_API_KEY:'test-credential'},encoding:'utf8'});
  assert.equal(first.status,0,first.stderr);
  const issues=fs.readdirSync(path.join(dir,'content/editions'));
  assert.equal(issues.length,1);
  const issue=JSON.parse(fs.readFileSync(path.join(dir,'content/editions',issues[0])));
  assert.equal(issue.articles.length,6);
  assert.deepEqual(issue.articles.map(id=>JSON.parse(fs.readFileSync(path.join(dir,'content/articles',id+'.json'))).category),['THE 40K CHRONICLES','GAMING CULTURE','PC & TECH','MMORPG','RPG','CONSOLE & CO-OP']);
  const second=spawnSync(process.execPath,args,{cwd:dir,env:{...process.env,OPENAI_API_KEY:''},encoding:'utf8'});
  assert.equal(second.status,0,second.stderr);assert.match(second.stdout,/ALREADY_PUBLISHED/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('invalid API credentials publish no partial articles or issue',()=>{
 const dir=fixture();
 try {
  const mock=path.join(dir,'reject.mjs');
  fs.writeFileSync(mock,`globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:{code:'invalid_api_key'}})});`);
  const result=spawnSync(process.execPath,['--import',mock,publisher],{cwd:dir,env:{...process.env,OPENAI_API_KEY:'invalid-test-credential'},encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/HTTP 401/);
  assert.equal(fs.readdirSync(path.join(dir,'content/editions')).length,0);
  assert.equal(fs.readdirSync(path.join(dir,'content/articles')).length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
