import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('build/assets/static',{recursive:true});cpSync('static','build/assets/static',{recursive:true});
cpSync('node_modules/ethers/dist/ethers.umd.min.js','build/assets/static/ethers-v4.min.js');
for(const [file,path] of [['index','index.html'],['free_matic','freematic.html'],['faucet','faucet.html'],['casino','casino.html'],['squatches','squatches.html']]) {
  let html=readFileSync(`templates/${file}.html`,'utf8');
  if(html.includes('static/app.js'))html=html.replace('<script src="static/ethers-v4.min.js">','<button onclick="connectWallet()">CONNECT WALLET</button><script src="static/ethers-v4.min.js">');
  writeFileSync('build/assets/'+path,html);
}
let js=readFileSync('static/app.js','utf8');
const start=js.indexOf('ethereum.enable()'), end=js.indexOf('function register()');
if(start<0||end<start)throw new Error('Wallet adapter source changed; review migration');
js=js.slice(0,start)+`async function connectWallet() {
  const msg=document.getElementById('msg');
  if(!window.ethereum){msg.textContent='Use a browser with an Ethereum wallet.';return;}
  try {
    await window.ethereum.request({method:'eth_requestAccounts'});
    provider=new ethers.BrowserProvider(window.ethereum);
    const network=await provider.getNetwork();
    if(network.chainId!==137n){msg.textContent='Switch to Polygon! '+network.chainId;return;}
    signer=await provider.getSigner();accountAddress=await signer.getAddress();
    const balance=await provider.getBalance(accountAddress);
    msg.textContent='MATIC Balance: '+Number(ethers.formatEther(balance)).toFixed(4);
  }catch{msg.textContent='Wallet connection was not completed.';}
}
\n`+js.slice(end);
js=js.replace('(Date.now()/1000).toFixed(0)','Math.floor(Date.now()/1000)');
js=js.replace(', accountAddress, "test password!")',')');
writeFileSync('build/assets/static/app.js',js);
writeFileSync('build/assets/deployment.json',JSON.stringify({repository:'pierce403/squatchhunt',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),originalHerokuCommit:'548151cf393768f16e3b884fde8bd0e768b24e02'})+'\n');
writeFileSync('build/assets/_headers','/deployment.json\n  Cache-Control: no-store\n');
