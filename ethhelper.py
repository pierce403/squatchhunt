import os
import sys
from web3 import Web3, HTTPProvider

import squatchnft

try:
  w3 = Web3(HTTPProvider(os.environ['web3']))
except:
  print("[!] WARNING: INVALID HTTPProvider ('web3' env variable)")
  sys.exit("NOPE")
erc20abi='''[{"inputs":[{"internalType":"uint256","name":"initialSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]'''

squatchAddress = '0x4CE7De6fA65EEFc6B641054679141f08b8595d8f'

squatchToken = w3.eth.contract(address=squatchAddress,abi=erc20abi)

def tokencount(address):
  decimals = squatchToken.functions.decimals().call()
  
  return int(squatchToken.functions.balanceOf(address).call())/10**decimals

#print("tokens at:")
#print(tokencount('0x7ab874Eeef0169ADA0d225E9801A3FfFfa26aAC3'))

#def squatch_club(address):
#  for i in range (1,14):
#  

def squatch_club(address):
  squatchNFT = w3.eth.contract(address=squatchnft.nftaddress,abi=squatchnft.nftabi)

  for i in range (1,15):
    print("[+] "+str(i))
    thisOwner = squatchNFT.functions.owner(i).call();
    print("[+] "+thisOwner)
    if thisOwner == address:
      return True
  return False

#print(squatch_club('0x7ab874Eeef0169ADA0d225E9801A3FfFfa26aAC3'))
#print(squatch_club('0x9A7F591eBD41c9f5bA22BeA1cBC25542448d5F1f'))
