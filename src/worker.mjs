import {getAddress, verifyMessage, Interface} from 'ethers';
const token = new Interface(['function decimals() view returns(uint8)','function balanceOf(address) view returns(uint256)']);
const nft = new Interface(['function owner(uint256) view returns(address)']);
const tokenAddress = '0x4CE7De6fA65EEFc6B641054679141f08b8595d8f';
const nftAddress = '0x3783E61456bd22fF77D70a6f4D40e3427B4979b2';
const encoder = new TextEncoder();
const b64 = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64 = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
const json = (body, status=200, headers={}) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
async function key(secret) {return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function loginInput(request) {
  const reader=request.body?.getReader();if(!reader)throw new Error('Missing body');
  const chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw new Error('Body too large');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function issueSession(address, secret, now=Math.floor(Date.now()/1000)) {
  const claims={fresh:false,iat:now,jti:crypto.randomUUID(),type:'access',sub:address,nbf:now,csrf:crypto.randomUUID(),exp:now+900};
  const input=b64(encoder.encode(JSON.stringify({alg:'HS256',typ:'JWT'})))+'.'+b64(encoder.encode(JSON.stringify(claims)));
  return {token:input+'.'+b64(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(input))),csrf:claims.csrf};
}
export async function readSession(value, secret, now=Math.floor(Date.now()/1000)) {
  try {
    if (!value || value.length>4096) return null;
    const [head,body,sig,...extra]=value.split('.');if(extra.length || !sig)return null;
    const header=JSON.parse(new TextDecoder().decode(unb64(head)));
    if(header.alg!=='HS256' || header.typ!=='JWT')return null;
    if(!await crypto.subtle.verify('HMAC',await key(secret),unb64(sig),encoder.encode(head+'.'+body)))return null;
    const claims=JSON.parse(new TextDecoder().decode(unb64(body)));
    if(claims.type!=='access' || !Number.isInteger(claims.exp) || !Number.isInteger(claims.nbf) || claims.exp<=now || claims.nbf>now)return null;
    return getAddress(claims.sub);
  } catch {return null;}
}
function cookie(request,name) {return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);}
async function call(env,address,iface,method,args=[]) {
  if(!env.RPC_URL)throw new Error('RPC unavailable');
  const response=await fetch(env.RPC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:address,data:iface.encodeFunctionData(method,args)},'latest']}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('RPC unavailable');
  const result=await response.json();if(result.error || typeof result.result!=='string')throw new Error('RPC error');
  return iface.decodeFunctionResult(method,result.result)[0];
}
async function balance(env,address) {
  const [decimals,raw]=await Promise.all([call(env,tokenAddress,token,'decimals'),call(env,tokenAddress,token,'balanceOf',[address])]);
  return {raw, unit:10n**BigInt(decimals)};
}
export function lounge(address,raw,unit,env) {
  if(raw<=unit)return "Hey, do you even have any SQUATCH tokens?<br>Maybe try the <a href='https://squatchhunt.com/faucet'>faucet</a>.";
  let message='<br><br>FLAG 200: '+env.FLAG200;
  if(raw<=100n*unit)return 'HELLO '+address+'<br><br>'+message+"<br><br>That's a good start, but you've got to pump up those rookie numbers.<br>Next flag when you have over 100 tokens. There exist shortcuts. See if you can find the source code for the contract, that should help find any potential weaknesses.";
  message+='<br>FLAG 300: '+env.FLAG300;
  if(raw>10000n*unit)message+='<br>FLAG 400: '+env.FLAG400+'<br>Look like you\'ve got enough SQUATCH to check out /squatches';
  else message+="<br><br>Still low on tokens? Try hitting up /casino.";
  return 'HELLO '+address+' '+message;
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url), path=url.pathname;
    if(path==='/login') {
      if(request.method!=='POST')return json({error:'Method Not Allowed'},405,{Allow:'POST'});
      if(!env.SESSION_SECRET)return json({error:'Login temporarily unavailable'},503);
      try {
        if(Number(request.headers.get('Content-Length')||0)>8192)return json({login:false},413);
        const input=await loginInput(request);if(!Array.isArray(input)||input.length!==2)return json({login:false},400);
        const address=getAddress(input[0]), now=Math.floor(Date.now()/1000),bucket=now-now%600;
        const signer=verifyMessage(`Signing in to ${env.AUTH_DOMAIN} at ${bucket}`,input[1]);
        if(signer!==address)return json({login:false});
        const session=await issueSession(address,env.SESSION_SECRET,now),response=json({login:true});
        response.headers.append('Set-Cookie',`access_token_cookie=${session.token}; Path=/; Secure; HttpOnly; SameSite=Lax`);
        response.headers.append('Set-Cookie',`csrf_access_token=${session.csrf}; Path=/; Secure; SameSite=Lax`);
        return response;
      } catch {return json({login:false});}
    }
    if(!['GET','HEAD'].includes(request.method))return json({error:'Method Not Allowed'},405,{Allow:'GET, HEAD'});
    if(path==='/lounge'||path==='/squatch_club') {
      const address=env.SESSION_SECRET&&await readSession(cookie(request,'access_token_cookie'),env.SESSION_SECRET);
      if(!address)return json({msg:'Missing or invalid access token'},401);
      try {
        let body;
        if(path==='/lounge') {
          if(!env.FLAG200||!env.FLAG300||!env.FLAG400)throw new Error('Flags unavailable');
          const {raw,unit}=await balance(env,address);body=lounge(address,raw,unit,env);
        } else {
          if(!env.FLAG500)throw new Error('Flags unavailable');
          let owns=false;
          for(let i=1;i<15;i++)if(getAddress(await call(env,nftAddress,nft,'owner',[i]))===address){owns=true;break;}
          body=owns?'Nice Squatch you got there  FLAG 500: '+env.FLAG500:'no squatches!';
        }
        return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      } catch {return json({error:'Token verification temporarily unavailable'},503);}
    }
    return env.ASSETS.fetch(request);
  },
};
