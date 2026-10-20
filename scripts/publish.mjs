import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const key=process.env.OPENAI_API_KEY;const model=process.env.RIFTBOUND_TEXT_MODEL||'gpt-4.1';const imageModel=process.env.RIFTBOUND_IMAGE_MODEL||'gpt-image-1';const tz='America/Toronto';
const date=process.env.RIFTBOUND_EDITION_DATE||new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(new Date());
if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid edition date');
const fail=m=>{throw Error(m)};
const dir='content/editions';fs.mkdirSync(dir,{recursive:true});if(fs.existsSync(path.join(dir,date+'.json'))){console.log('ALREADY_PUBLISHED '+date);process.exit(0)}
if(!key || key.trim()==='OPENAI_API_KEY')fail('Set OPENAI_API_KEY to a valid API credential in repository Actions secrets. Nothing published.');
const all=fs.readdirSync('content/articles').filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join('content/articles',x),'utf8')));
if(all.some(x=>x.date===date))fail('Partial existing edition; refusing overwrite');
const roadmap=JSON.parse(fs.readFileSync('content/roadmap.json','utf8'));
const priorLore=all.filter(x=>x.category==='THE 40K CHRONICLES').sort((a,b)=>a.date.localeCompare(b.date));
const chapter=priorLore.length+1;const topic=roadmap[chapter-2]||'The expanding Warhammer 40,000 universe: a new verified topic';
const categories=['GAMING CULTURE','PC & TECH','MMORPG','RPG','CONSOLE & CO-OP'];
const outputs=[];const sl=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-').slice(0,70);
const wc=s=>s.split(/\s+/).filter(Boolean).length;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const articleSchema={type:'object',additionalProperties:false,required:['title','dek','body','sources','visualBrief'],properties:{title:{type:'string'},dek:{type:'string'},body:{type:'array',items:{type:'string'}},sources:{type:'array',items:{type:'object',additionalProperties:false,required:['title','url'],properties:{title:{type:'string'},url:{type:'string'}}}},visualBrief:{type:'string'}}};
async function responseRequest(payload,label){
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(180000)});
  const j=await r.json();
  if(!r.ok){
   if(attempt<2&&[429,500,502,503,504].includes(r.status)&&j.error?.code!=='insufficient_quota'){await wait(5000*(attempt+1));continue;}
   fail(label+': '+(r.status===401?'HTTP 401: replace invalid OPENAI_API_KEY repository Actions secret':(j.error?.code||r.status)));
  }
  if(j.status!=='completed')fail(label+' response incomplete: '+j.status);
  return j;
 }
}
async function call(prompt,label){
 // Tool-required research may return only a search call. Drafting is a separate,
 // schema-constrained response that retains the actual research context.
 const research=await responseRequest({model,input:'Research the following editorial assignment using web search. Retrieve at least two reliable exact pages, including primary publisher documentation where possible. Do not draft the article yet. Assignment: '+prompt,tools:[{type:'web_search_preview'}],tool_choice:'required',include:['web_search_call.action.sources'],max_output_tokens:4000},label+' research');
 const observed=[...(research.output||[]).flatMap(x=>x.action?.sources||[]),...(research.output||[]).flatMap(x=>x.content||[]).flatMap(x=>x.annotations||[]).filter(x=>x.type==='url_citation')];
 const normalize=s=>{const u=new URL(s);u.hash='';return u.href.replace(/\/$/,'')};
 const urls=[...new Set(observed.map(x=>x.url).filter(x=>x?.startsWith('https:')))];
 if(!research.id||urls.length<2)fail(label+' research did not return two verifiable sources');
 const allowed=new Set(urls.map(normalize));
 const lore=label.startsWith('Chapter ');let feedback='';let draftContext=research.id;
 for(let attempt=0;attempt<3;attempt++){
  const reply=await responseRequest({model,previous_response_id:draftContext,input:prompt+'\nUse the research context above. The sources array may contain ONLY exact URLs from this verified registry: '+JSON.stringify(urls)+'. At least two sources. Return the requested JSON article, not research notes. '+feedback,text:{format:{type:'json_schema',name:'riftbound_article',strict:true,schema:articleSchema}},max_output_tokens:11000},label+' draft');
  const raw=(reply.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
  let a;try{a=JSON.parse(raw)}catch{feedback='Previous draft did not contain valid article JSON. Return the complete schema.';continue;}
  const issues=[];
  if(!Array.isArray(a.body)||!Array.isArray(a.sources)){feedback='Return complete body and sources arrays.';continue;}
  const words=wc(a.body.join(' '));
  if(words<(lore?2000:1000)||words>(lore?3500:2000))issues.push('Body length was '+words+' words; target '+(lore?'2300–2800':'1200–1600')+' words.');
  if(a.body.filter(x=>x.startsWith('## ')).length<5)issues.push('At least five section headings are required.');
  if(a.sources.length<2)issues.push('At least two verified sources required.');
  for(const source of a.sources){try{if(!allowed.has(normalize(source.url)))issues.push('Unretrieved URL: '+source.url)}catch{issues.push('Invalid source URL')}}
  if(!issues.length)return a;
  draftContext=reply.id||research.id;
  feedback='Revise the previous complete article, preserving verified claims and source URLs. EXPAND rather than summarize: add concrete explanatory paragraphs and examples to the existing sections. Return the entire replacement JSON. Correct these validation failures: '+issues.join(' ');
  console.log(label+' candidate rejected; '+feedback);
 }
 fail(label+' failed bounded editorial validation: '+feedback);
}
async function image(prompt,filepath){const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:imageModel,prompt:'Original cinematic editorial artwork for an independent science-fiction/fantasy gaming magazine. Create an entirely new non-derivative scene without text, watermarks, franchise logos, insignia, trademark emblems, named characters, recognisable game armour or copied promotional art. Futuristic gothic architecture, dramatic physical lighting, extraordinary atmosphere, painterly detail. '+prompt,size:'1536x1024',quality:'medium'}),signal:AbortSignal.timeout(220000)});const result=await response.json();if(!response.ok||!result.data?.[0]?.b64_json)fail('Cover image generation failed; no issue published: '+(response.status===401?'HTTP 401: replace invalid OPENAI_API_KEY repository Actions secret':(result.error?.code||response.status)));const bytes=Buffer.from(result.data[0].b64_json,'base64');if(bytes.length<20000)fail('Invalid image');fs.mkdirSync(path.dirname(filepath),{recursive:true});fs.writeFileSync(filepath,bytes)}
for(let i=0;i<6;i++){
 const isLore=i===0;const category=isLore?'THE 40K CHRONICLES':categories[i-1];const headline=isLore?'Chapter '+String(chapter).padStart(3,'0')+' — '+topic:'Fresh '+category+' story '+(i);
 const prompt=isLore?
 `You are the editorial researcher/writer for an UNOFFICIAL independent Warhammer 40,000 lore magazine. Date: ${date}. Topic: ${topic}. Write an original deep, accurate, highly readable lore guide. Use exactly TEN section headings. Under EACH heading write THREE developed paragraphs of 80-100 words, for 2400-3000 words of prose total. The body array contains "## section heading" strings followed by three full paragraph strings. Develop specific explanations and examples rather than filler. Do not stop at a short overview. First paragraph should hook the reader with a concrete narrative setting. Explain established canon and differences between eras/interpretations, mark uncertainty, offer background for newcomers, link logically to prior topics, end with tease toward next chapter. Absolutely no verbatim book passages, no game art copies, no copyrighted quoted passages. Do not pretend fictional lore is real history. Search reliable official 40K publisher material and at least one independent factual resource. Cite sources as valid HTTPS URLs you actually visited, do not invent links. Avoid obscure claims lacking evidence. Required exact title format: Chapter ${String(chapter).padStart(3,'0')} — ${topic}. Your visualBrief describes an ORIGINAL generic fantasy/sci-fi painting without copying protected characters/armour or factions.`:
 `Write one independently researched gaming magazine story dated ${date}, category ${category}, 1200-1600 words, five or more full sections (body array uses "## heading" strings and paragraph strings). This is feature ${i} of five today. Write a substantive evergreen feature in the assigned category, informed by current verified sources. Do not invent news. No unverified release dates, unsupported specs, fake reviews, experience claims, fabricated quotes or rumors disguised as fact. Distinguish predictions from announced information. Cross-check two first-party or reliable gaming sources and supply EXACT URLs you visited. Cover the assigned category only; the full edition spans gaming culture, PC, MMORPG, RPG and console/cooperative gaming. Today's and recent stories: ${all.slice(-30).map(x=>x.title).join(' | ')}. Produce headline, short dek, original 1200-1600 word body, verified source URLs and a truly novel visualBrief, with absolutely no trademarked/copyright-derived images.`;
 const a=await call(prompt,headline);
 const words=wc(a.body.join(' '));if(words<(isLore?2000:1000)||words>(isLore?3500:2000))fail(headline+' wrong length '+words);
 if(a.body.filter(x=>x.startsWith('## ')).length<5)fail(headline+' insufficient sections');
 if(isLore&&!a.title.startsWith('Chapter '+String(chapter).padStart(3,'0')))fail('Wrong chapter index');
 const id=(isLore?'chapter-'+String(chapter).padStart(3,'0')+'-':'')+sl(a.title).slice(0,55)+'-'+date.replaceAll('-','');
 if(all.some(x=>x.title.toLowerCase()===a.title.toLowerCase()))fail('Duplicate prior headline');
 if(all.some(x=>x.id===id)||outputs.some(x=>x.id===id))fail('Duplicate article id');
 const cover='assets/covers/'+id+'.png';await image(a.visualBrief,cover);
 const story={id,category,title:a.title,dek:a.dek,body:a.body,date,image:cover,byline:'RIFTBOUND Editorial',sources:a.sources,generatedAt:new Date().toISOString()};
 outputs.push(story);console.log('VERIFIED '+(i+1)+'/6 '+a.title+' words='+words);
}
for(const story of outputs){const dest=path.join('content/articles',story.id+'.json');fs.writeFileSync(dest,JSON.stringify(story,null,2)+'\n')}
fs.writeFileSync(path.join(dir,date+'.json'),JSON.stringify({date,chapter,articles:outputs.map(x=>x.id),status:'published',generated:'source-reviewed daily edition'},null,2)+'\n');
console.log('SIX_STORIES_WRITTEN '+date);
