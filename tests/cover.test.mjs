import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestCover} from '../scripts/generate-cover.mjs';
const image=Buffer.alloc(21000);
const success={ok:true,status:200,json:async()=>({data:[{b64_json:image.toString('base64')}]})};
const reject=(code,status=400)=>({ok:false,status,json:async()=>({error:{code,message:'Request failed'}})});
const options={key:'test-key',model:'gpt-image-2.5-flare',prompt:'Original portrait',alternativePrompt:'Nonviolent architecture only'};
test('moderation uses one different scenery prompt with safeguards unchanged',async()=>{
 const requests=[];
 const bytes=await requestCover({...options,fetchImpl:async(url,init)=>{
  requests.push(JSON.parse(init.body));return requests.length===1?reject('moderation_blocked'):success;
 }});
 assert.deepEqual(bytes,image);assert.equal(requests.length,2);
 assert.equal(requests[0].prompt,options.prompt);assert.equal(requests[1].prompt,options.alternativePrompt);
 assert.deepEqual({...requests[0],prompt:options.alternativePrompt},requests[1]);
 assert.equal(requests[1].moderation,undefined);
});
test('second moderation rejection stops after two attempts',async()=>{
 let calls=0;await assert.rejects(requestCover({...options,fetchImpl:async()=>{calls++;return reject('moderation_blocked')}}),/moderation_blocked/);assert.equal(calls,2);
});
test('quota and authentication failures stop without scenery retry',async()=>{
 for(const [code,status] of [['insufficient_quota',429],['invalid_api_key',401]]){
  let calls=0;await assert.rejects(requestCover({...options,fetchImpl:async()=>{calls++;return reject(code,status)}}),/Cover image generation failed/);assert.equal(calls,1);
 }
});
