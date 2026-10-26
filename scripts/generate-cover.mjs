// One content-safe alternative after moderation; never lower or disable safeguards.
export async function requestCover({key, model, prompt, alternativePrompt, fetchImpl=fetch}) {
  for (let attempt=0; attempt<2; attempt++) {
    const response=await fetchImpl('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model,prompt:attempt===0?prompt:alternativePrompt,size:'1536x1024',quality:'medium'}),
      signal:AbortSignal.timeout(220000)
    });
    const result=await response.json();
    if (response.ok && result.data?.[0]?.b64_json) {
      const bytes=Buffer.from(result.data[0].b64_json,'base64');
      if(bytes.length<20000)throw Error('Invalid image; no issue published');
      return bytes;
    }
    if(attempt===0 && result.error?.code==='moderation_blocked' && alternativePrompt) {
      console.log('Cover request rejected by moderation; using one nonviolent scenery alternative.');
      continue;
    }
    const details=response.status===401?'HTTP 401: replace invalid OPENAI_API_KEY repository Actions secret':
      ['HTTP '+response.status,'model='+model,result.error?.code,result.error?.param?'parameter='+result.error.param:null,result.error?.message?.replaceAll(key,'[redacted]')].filter(Boolean).join(' | ');
    throw Error('Cover image generation failed; no issue published: '+details);
  }
}
