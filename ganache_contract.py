import json

from web3 import Web3
from web3.utils.abi import abi_to_signature


RPC_URL = 'http://127.0.0.1:7545'
CONTRACT_ADDRESS = '0x5e7a50cfa49D05d02fF1a78d5D47e46a8421Fe26'  # Paste the deployed contract address here.
ABI_JSON = '''
[
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "num",
                "type": "uint256"
            }
        ],
        "name": "store",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "retrieve",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
'''

w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={'timeout': 10}))
if not w3.is_connected():
    raise ConnectionError(f'Cannot connect to Ganache at {RPC_URL}. Check that Ganache is running and the URL is correct.')
if not Web3.is_address(CONTRACT_ADDRESS):
    raise ValueError('Paste a valid deployed contract address into CONTRACT_ADDRESS.')
try:
    abi = json.loads(ABI_JSON)
except json.JSONDecodeError as exc:
    raise ValueError('Paste the complete ABI JSON array into ABI_JSON.') from exc
if not isinstance(abi, list):
    raise ValueError('ABI_JSON must contain a JSON array.')

address = Web3.to_checksum_address(CONTRACT_ADDRESS)
if not w3.eth.get_code(address):
    raise ValueError('No contract code at this address on the connected network. Check the address and Ganache network.')
contract = w3.eth.contract(address=address, abi=abi)
accounts = w3.eth.accounts

print('Connected to Ganache and contract!')
print('Chain ID:', w3.eth.chain_id)
print('Contract:', address)
print('Available unlocked accounts:', accounts)
