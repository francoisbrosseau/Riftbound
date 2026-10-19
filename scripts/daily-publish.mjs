import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw Error('OPENAI_API_KEY repository secret missing. No edition published.');
const date = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const editionPath = 'content/editions/'+date+'.json';
if (fs.existsSync(editionPath)) {console.log('Issue already exists. No changes.');process.exit(0)}
const prior = fs.readdirSync('content/articles').filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join('content/articles',x),'utf8')));
const chapters = prior.filter(x=>x.category==='THE 40K CHRONICLES');
const next = chapters.length+1;
const planned = ['The Adeptus Astartes','The Blood Angels','The Imperium of Man','The Forces of Chaos','The Necrons','The Horus Heresy','The Thousand Sons','The Orks','The Aeldari','The Tyranids','The T’au Empire','The Adepta Sororitas','The Astra Militarum','The Custodes','The Mechanicus'];
const chapterTopic = planned[(next-2+planned.length)%planned.length];
const recent = prior.slice(-50).map(a=>a.title);
const request = async (url,body) => {
 const response = await fetch(url,{method:'POST',headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const raw=await response.text();if(!response.ok) throw Error('Generation HTTP '+response.status+': '+raw.slice(0,350));
 return JSON.parse(raw);
};
const instructions = `Write a complete editorial issue as JSON: {"articles":[six objects]}. Exactly one lore object and five gaming objects. Every object has keys category,title,dek,body,imagePrompt. body is an array of paragraphs; heading paragraphs begin with "## " and a newline followed by text. Lore must be 1600-2300 words, with at least 8 substantive sections and an accessible introduction, detailed history, culture, nuanced conflicts, canonical uncertainty and key characters. Topic: ${chapterTopic}; title must begin "Chapter ${String(next).padStart(3,'0')} — ". The remaining FIVE articles must each have 850-1250 CHARACTERS across body text, and at least four substantial paragraphs; they are evergreen practical features, one each for GAMING CULTURE, PC & TECH, MMORPG, RPG and CONSOLE & CO-OP. Their topics must differ substantially from these existing titles: ${recent.join(' | ')}. No made-up releases, patches, dates, developer quotes, sales figures, leaks or sources. No quotations from copyrighted lore texts. Clearly distinguish lore interpretations from established canon. All text new, literate, specific, credible and interesting. No fabricated experience, first-person reporting or official publisher affiliation. Each imagePrompt should describe an entirely original cinematic editorial cover, with no text, watermark, branded game logos, identifiable copyrighted characters or faction designs, using varied subjects and framings, but consistent black, antique-gold and molten-crimson Riftbound house palette. The Warhammer names are permitted in commentary but do not describe copying Warhammer visuals. Return only valid JSON.`;
const reply=await request('https://api.openai.com/v1/chat/completions',{
 model:'gpt-4.1',temperature:0.65,max_completion_tokens:11500,
 response_format:{type:'json_object'},
 messages:[{role:'system',content:'You are the careful independent editor of RIFTBOUND MAG. Do not invent factual developments. Follow required JSON structure.'},{role:'user',content:instructions}]
});
const data=JSON.parse(reply.choices?.[0]?.message?.content||'{}');
if(!Array.isArray(data.articles)||data.articles.length!==6)throw Error('Editorial generation returned wrong story count');
const cats=['THE 40K CHRONICLES','GAMING CULTURE','PC & TECH','MMORPG','RPG','CONSOLE & CO-OP'];
const slugify=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
const output=[];
for(let i=0;i<data.articles.length;i++){
 const a=data.articles[i],category=cats[i];
 if(a.category!==category||!Array.isArray(a.body)||a.body.length<4||!a.title||!a.dek||!a.imagePrompt)throw Error('Malformed editorial article '+i);
 const body=a.body.join(' '),words=body.trim().split(/\s+/).length;
 if(i===0 && (words<1600||words>2800||!a.title.startsWith('Chapter '+String(next).padStart(3,'0'))))throw Error('Lore depth or chapter title failed');
 if(i>0 && (body.length<800||body.length>1450))throw Error('Gaming article character length failed: '+a.title+' '+body.length);
 if(prior.some(x=>x.title.toLowerCase()===a.title.toLowerCase()))throw Error('Duplicate prior headline');
 const id=date+'-'+slugify(a.title.replace(/^Chapter \d+ — /,''));
 if(prior.some(x=>x.id===id)||output.some(x=>x.id===id))throw Error('Duplicate story identifier');
 output.push({id,category,title:a.title,dek:a.dek,date,byline:'RIFTBOUND Editorial',image:'assets/covers/'+id+'.png',body:a.body,sources:[]});
}
for(let i=0;i<output.length;i++){
 const prompt=data.articles[i].imagePrompt;
 const result=await request('https://api.openai.com/v1/images/generations',{model:'gpt-image-1-mini',size:'1024x1024',quality:'low',n:1,prompt:'Original editorial gaming magazine artwork. '+prompt+'. No text, brands, existing game characters, copyrighted insignia or publisher trade dress.'});
 const base64=result.data?.[0]?.b64_json;if(!base64)throw Error('Cover generation did not return an image for '+output[i].id);
 fs.writeFileSync(output[i].image,Buffer.from(base64,'base64'));
}
for(const a of output)fs.writeFileSync('content/articles/'+a.id+'.json',JSON.stringify(a,null,2)+'\n');
fs.writeFileSync(editionPath,JSON.stringify({date,chapter:next,articles:output.map(x=>x.id),status:'published',generated:'API-assisted original editorial edition'},null,2)+'\n');
console.log('Generated six original stories and images for '+date);
