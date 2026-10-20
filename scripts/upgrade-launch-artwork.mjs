import fs from 'node:fs';
for (const name of fs.readdirSync('content/articles')) {
 const a=JSON.parse(fs.readFileSync('content/articles/'+name,'utf8'));
 if (!a.image.endsWith('.webp') || !fs.existsSync(a.image)) throw Error('Original artwork missing: '+a.id);
}
console.log('Recovered original launch artwork is installed. No generation needed.');
