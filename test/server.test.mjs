import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('HTTP chat starts, enforces origin/consent and sends corrected knowledge to provider', async t => {
  const mock = "globalThis.fetch=async (_url,opts)=>new Response(JSON.stringify({choices:[{message:{content:JSON.parse(opts.body).messages[0].content}}]}),{status:200});";
  const child=spawn(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(mock),'server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'18787',ALLOWED_ORIGIN:'http://localhost:3000',OPENAI_API_KEY:'test-only-placeholder'},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server did not start')}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),5000);timer.unref();})]);
  const base='http://localhost:18787';
  assert.equal((await fetch(base+'/health')).status,200);
  const post=(body,origin='http://localhost:3000')=>fetch(base+'/api/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post({message:'hello'},'http://unauthorized.example')).status,403);
  assert.equal((await post(null)).status,400);
  assert.equal((await post({message:''})).status,400);
  assert.equal((await post({message:'Photo',photo:'data:image/png;base64,AAAA'})).status,400);
  const response=await post({message:'What does a catio cost?'});
  assert.equal(response.status,200);
  const {reply}=await response.json();
  for (const expected of ['"custom":5000','"window":2500','"freestanding":6000','"patioConversion":12000','"signature":35000','"consultationUSD":120','"freestandingPerSqFtUSD":[140,155]','at most two short questions','has not been saved or sent']) assert.ok(reply.includes(expected),expected);
  assert.equal((await post({message:'Photo',photo:'data:image/png;base64,AAAA',photoConsent:true})).status,200);
});
