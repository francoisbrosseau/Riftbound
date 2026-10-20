// Read-only credential check: no text or images are generated and no key is logged.
const key=process.env.OPENAI_API_KEY;
if(!key){console.error('::error::OPENAI_API_KEY is missing from this repository Actions secrets.');process.exit(1)}
const response=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(30000)});
if(!response.ok){
 const hint=response.status===401?'The stored OPENAI_API_KEY is invalid. Replace its VALUE with a valid OpenAI API key; the secret NAME must stay OPENAI_API_KEY.':response.status===403?'The API key was denied permission to list models; check project/key permissions.':'The API endpoint did not accept the request.';
 console.error('::error::OpenAI credential check: HTTP '+response.status+'. '+hint);process.exit(1);
}
console.log('OpenAI credential accepted. No generation or billing request was made.');
