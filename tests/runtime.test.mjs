import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as ethers from 'ethers';
import {Wallet} from 'ethers';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {execFileSync} from 'node:child_process';
import {issueSession,readSession,lounge} from '../src/worker.mjs';
test('sessions reject tampering, future activation and expiry; exact challenge thresholds remain strict',async()=>{
  const wallet=Wallet.createRandom(),secret='isolated-test-session-secret';
  const session=await issueSession(wallet.address,secret,1000);
  assert.equal(await readSession(session.token,secret,1001),wallet.address);
  assert.equal(await readSession(session.token,secret,1900),null);
  assert.equal(await readSession(session.token,secret,999),null);
  assert.equal(await readSession(session.token,secret+'different',1001),null);
  const parts=session.token.split('.');parts[1]=Buffer.from(JSON.stringify({sub:Wallet.createRandom().address,exp:9999,nbf:0,type:'access'})).toString('base64url');
  assert.equal(await readSession(parts.join('.'),secret,1001),null);
  const flags={FLAG200:'fixture-200',FLAG300:'fixture-300',FLAG400:'fixture-400'},unit=10n**18n;
  assert.doesNotMatch(lounge(wallet.address,unit,unit,flags),/fixture-200/);
  assert.match(lounge(wallet.address,unit+1n,unit,flags),/fixture-200/);
  assert.doesNotMatch(lounge(wallet.address,100n*unit,unit,flags),/fixture-300/);
  assert.match(lounge(wallet.address,100n*unit+1n,unit,flags),/fixture-300/);
  assert.doesNotMatch(lounge(wallet.address,10000n*unit,unit,flags),/fixture-400/);
  assert.match(lounge(wallet.address,10000n*unit+1n,unit,flags),/fixture-400/);
});
test('real Worker accepts correct controlled wallet, rejects wrong signer/domain/expired bucket and isolates cookies',async()=>{
  execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--outdir','build/worker'],{stdio:'pipe'});
  const opts=convertV4MiniflareOptions({name:'squatch-test',modules:true,scriptPath:'build/worker/worker.js',compatibilityDate:'2026-10-12',bindings:{AUTH_DOMAIN:'squatchhunt.test',SESSION_SECRET:'isolated-test-session-secret'},assets:{directory:'build/assets',binding:'ASSETS',run_worker_first:true}});
  opts.workers[0].config.assets.hasUserWorker=true;const mf=new Miniflare(opts);
  const wallet=Wallet.createRandom(),other=Wallet.createRandom(),now=Math.floor(Date.now()/1000),bucket=now-now%600;
  const login=async(address,signature)=>mf.dispatchFetch('https://squatchhunt.test/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([address,signature])});
  try {
    for(const [signer,domain,epoch] of [[other,'squatchhunt.test',bucket],[wallet,'wrong.test',bucket],[wallet,'squatchhunt.test',bucket-600]]) {
      const denied=await login(wallet.address,await signer.signMessage(`Signing in to ${domain} at ${epoch}`));assert.deepEqual(await denied.json(),{login:false});assert.equal(denied.headers.get('set-cookie'),null);
    }
    const accepted=await login(wallet.address,await wallet.signMessage(`Signing in to squatchhunt.test at ${bucket}`));assert.deepEqual(await accepted.json(),{login:true});assert.equal(accepted.headers.get('cache-control'),'no-store');
    const cookies=accepted.headers.getSetCookie();assert.equal(cookies.length,2);assert.ok(cookies[0].includes('HttpOnly'));assert.ok(cookies.every(c=>c.includes('Secure')&&c.includes('SameSite=Lax')));
    assert.equal((await mf.dispatchFetch('https://squatchhunt.test/lounge')).status,401);
    assert.equal((await mf.dispatchFetch('https://squatchhunt.test/squatch_club')).status,401);
    const selected=cookies[0].split(';')[0];assert.equal((await mf.dispatchFetch('https://squatchhunt.test/lounge',{headers:{cookie:selected}})).status,503);
    const rpcOptions=convertV4MiniflareOptions({name:'squatch-test',modules:true,scriptPath:'build/worker/worker.js',compatibilityDate:'2026-10-12',bindings:{AUTH_DOMAIN:'squatchhunt.test',SESSION_SECRET:'isolated-test-session-secret',RPC_URL:'https://rpc.test',FLAG200:'fixture-200',FLAG300:'fixture-300',FLAG400:'fixture-400',FLAG500:'fixture-500'},assets:{directory:'build/assets',binding:'ASSETS',run_worker_first:true},outboundService:async request=>{
      assert.equal(new URL(request.url).hostname,'rpc.test');const input=await request.json();assert.equal(input.method,'eth_call');assert.equal(input.params[1],'latest');
      const {to,data}=input.params[0];let result;
      if(data==='0x313ce567'){assert.equal(to,'0x4CE7De6fA65EEFc6B641054679141f08b8595d8f');result=18n;}
      else if(data.startsWith('0x70a08231')){assert.equal(to,'0x4CE7De6fA65EEFc6B641054679141f08b8595d8f');assert.equal(data.slice(-40).toLowerCase(),wallet.address.slice(2).toLowerCase());result=10001n*10n**18n;}
      else if(data.startsWith('0xa123c33e')){assert.equal(to,'0x3783E61456bd22fF77D70a6f4D40e3427B4979b2');assert.equal(BigInt('0x'+data.slice(10)),1n);result=BigInt(wallet.address);}
      else throw new Error('Unexpected RPC call');
      return new Response(JSON.stringify({jsonrpc:'2.0',id:input.id,result:'0x'+result.toString(16).padStart(64,'0')}),{headers:{'Content-Type':'application/json'}});
    }});rpcOptions.workers[0].config.assets.hasUserWorker=true;await mf.setOptions(rpcOptions);
    const granted=await mf.dispatchFetch('https://squatchhunt.test/lounge',{headers:{cookie:selected}});assert.equal(granted.status,200);assert.match(await granted.text(),/fixture-200[\s\S]*fixture-300[\s\S]*fixture-400/);
    const club=await mf.dispatchFetch('https://squatchhunt.test/squatch_club',{headers:{cookie:selected}});assert.equal(club.status,200);assert.match(await club.text(),/fixture-500/);
    for(const path of ['/','/freematic','/faucet','/casino','/squatches','/static/app.js'])assert.equal((await mf.dispatchFetch('https://squatchhunt.test'+path)).status,200,path);
    const script=await (await mf.dispatchFetch('https://squatchhunt.test/static/app.js')).text();assert.ok(script.includes('function connectWallet()'));assert.ok(!script.includes('ethereum.enable()'));
    assert.equal((await mf.dispatchFetch('https://squatchhunt.test/missing')).status,404);
  }finally{await mf.dispose();}
});
test('browser adapter connects the controlled EIP-1193 wallet explicitly with ethers 6',async()=>{
  const wallet=Wallet.createRandom(),node={textContent:''};let requests=0;
  const ethereum={request:async({method})=>{
    requests++;
    if(method==='eth_requestAccounts'||method==='eth_accounts')return [wallet.address];
    if(method==='eth_chainId')return '0x89';
    if(method==='eth_getBalance')return '0xde0b6b3a7640000';
    throw new Error('Unexpected method '+method);
  }};
  const context=vm.createContext({ethers,window:{ethereum},document:{getElementById:()=>node},console:{log:()=>{}}});
  vm.runInContext(readFileSync('build/assets/static/app.js','utf8'),context);assert.equal(requests,0);
  await vm.runInContext('connectWallet()',context);
  assert.equal(vm.runInContext('accountAddress',context),wallet.address);assert.equal(node.textContent,'MATIC Balance: 1.0000');
  vm.runInContext('provider.destroy()',context);
});
