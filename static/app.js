let provider;
let accounts;

let accountAddress = "";
let signer;

function login()
{

  console.log('oh hey there');

 // signer.signMessage("hello");

rightnow = (Date.now()/1000).toFixed(0)
sortanow = rightnow-(rightnow%600)
console.log('[*] sortanow is '+sortanow)

signer.signMessage("Signing in to "+document.domain+" at "+sortanow, accountAddress, "test password!")
            .then((signature) => {               handleAuth(accountAddress, signature)
            });
}

function handleAuth(accountAddress, signature)
{
  console.log(accountAddress);
  console.log(signature);

  fetch('login', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify([accountAddress,signature])
  }).then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
    if(data['login']==true)
    {
      document.getElementById("login").textContent = "LOGIN SUCCESS"
    }
    else
    {
      document.getElementById("login").textContent = "LOGIN FAILED :-("
    }
  });

}

ethereum.enable().then(function () {

    console.log("enabling web3")
    provider = new ethers.providers.Web3Provider(web3.currentProvider);

    
    provider.getNetwork().then(function (result) {
        if (result['chainId'] != 137) {
            document.getElementById("msg").textContent = 'Switch to Polygon! '+result['chainId'];

        } else { // okay, confirmed we're on mainnet

            provider.listAccounts().then(function (result) {
                console.log(result);
                accountAddress = result[0]; // figure out the user's Eth address

                provider.getBalance(String(result[0])).then(function (balance) {
                    var myBalance = (balance / ethers.constants.WeiPerEther).toFixed(4);
                    console.log("Your Balance: " + myBalance);
                    document.getElementById("msg").textContent = 'MATIC Balance: ' + myBalance;
                });

                // get a signer object so we can do things that need signing
                signer = provider.getSigner();

                // build out the table of players
            })
        }
    })
})

function register()
{
  let address100 = "0x1A0644368aADc011cBe94Da9eD5dc3D424802d71"
  let abi100 = [
    "function register() public view returns(string result)",
  ];

  let contract100 = new ethers.Contract(address100, abi100, signer);

  contract100.register().then(function (value) {
        console.log("got: " + value);
        document.getElementById("flag").innerText = value
  })
}

function faucetDispense()
{
  let address200 = "0x579D35EDe5C92d2855F86fd60Fac057feE015Ec3"
  let abi200 = [
    "function pump() public returns(uint haul)",
  ];

  let contract200 = new ethers.Contract(address200, abi200, signer);
  
  try{
  
    contract200.pump().then(function (value) {
        console.log("got: " + value);
        document.getElementById("dispense").innerText = "Getting tokens."
    })
  }
  catch(e){
    document.getElementById("dispense").innerText = e
  }
}

function approveCasino()
{
  let squatchTokenAddress = "0x4CE7De6fA65EEFc6B641054679141f08b8595d8f"
  let tokenABI = [
    "function approve(address spender, uint amount) public"
  ];

  let squatchToken = new ethers.Contract(squatchTokenAddress, tokenABI, signer);
  squatchToken.approve("0xfb53dDCDb689914F21d19D5Bb3a56567bb2bB503","10000000000000000000000000000").then(function (value) {
     console.log("got: " + value);
  })
}

function approveBribes()
{
  let squatchTokenAddress = "0x4CE7De6fA65EEFc6B641054679141f08b8595d8f"
  let tokenABI = [
    "function approve(address spender, uint amount) public"
  ];

  let squatchToken = new ethers.Contract(squatchTokenAddress, tokenABI, signer);
  squatchToken.approve("0x3783E61456bd22fF77D70a6f4D40e3427B4979b2","10000000000000000000000000000").then(function (value) {
     console.log("got: " + value);
  })
}


function casinoGamble()
{
  let address400 = "0xfb53dDCDb689914F21d19D5Bb3a56567bb2bB503"
  let abi400 = [
    "function gamble(uint amount) public"
  ];

  let contract400 = new ethers.Contract(address400, abi400, signer);

    contract400.gamble("1000000000000000000").then(function (value) {
        console.log("got: " + value);
        document.getElementById("dispense").innerText = "submitting gamble"
    })


}


/*
web3.eth.getAccounts()
        .then((response) => {
            const publicAddressResponse = response[0];

            if (!(typeof publicAddressResponse === "undefined")) {
                setPublicAddress(publicAddressResponse);
                getNonce(publicAddressResponse);
            }
        })
        .catch((e) => {
            console.error(e);
        });
*/
