import fs from 'node:fs';
const key=process.env.OPENAI_API_KEY;
if(!key)throw Error('Missing OPENAI_API_KEY secret');
const topics=[
['wolves-of-fenris','A rugged original winter-cloaked wanderer and three spectral wolves on a jagged frozen mountain ridge; a distant ancient citadel illuminated with torchlight, swirling snow, imposing atmosphere. Avoid any copyrighted character, weapon, insignia or faction armor.'],
['games-worth-understanding','Solitary cloaked explorer surveying a colossal fantastical cityscape under two moons, overgrown monoliths and sunset haze.'],
['pc-upgrade-priorities','Luxurious futuristic PC gaming setup, side view of a person at a tower computer, crimson LEDs, charcoal metallic details and cinematic amber practical lighting.'],
['mmorpg-group-play','Five original fantasy adventurers gathering around glowing embers beside a ruined arch under a great blue moon, sense of warmth and friendship.'],
['rpg-choice-consequences','Lone traveler at a fork between two ruined monumental gateways, a red cloak billowing under radiant atmospheric twilight.'],
['console-couch-coop','Four friends viewed from behind on a couch sharing a cooperative game on a giant television, warm intimate living room lit by fireplace and a midnight city view.']
];
for(const [id,scene] of topics){
 const articlePath='content/articles/'+id+'.json',a=JSON.parse(fs.readFileSync(articlePath,'utf8'));
 const filename='assets/covers/'+id+'.png';
 if(fs.existsSync(filename)&&a.image===filename){console.log('Already generated '+id);continue}
 const prompt='Cinematic premium editorial cover art for an independent sci-fi/fantasy gaming magazine. '+scene+' Ultra detailed realistic painterly environment, premium matte painting, dramatic lighting, rich black shadows, antique-gold highlights and subtle crimson energy, refined restrained composition, strong focal point. Absolutely no words, letters, watermarks, publisher trademarks, franchise symbols, identifiable licensed characters, official Warhammer artwork or logos. Wide atmospheric composition adapted to a square crop.';
 const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1-mini',size:'1024x1024',quality:'low',n:1,prompt})});
 if(!response.ok)throw Error('Image creation failed for '+id+': HTTP '+response.status+' '+(await response.text()).slice(0,230));
 const payload=await response.json(),b64=payload.data?.[0]?.b64_json;
 if(!b64)throw Error('No image bytes for '+id);
 fs.writeFileSync(filename,Buffer.from(b64,'base64'));
 a.image=filename;fs.writeFileSync(articlePath,JSON.stringify(a,null,2)+'\n');
 console.log('Installed '+filename);
}
