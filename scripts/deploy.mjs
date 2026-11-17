import fs from 'node:fs/promises';
import { JsonRpcProvider, ContractFactory } from 'ethers';
import { compile } from './compile.mjs';

const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:7545';
const url = new URL(rpcUrl);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Only local Ganache RPC URLs are allowed.');
const provider = new JsonRpcProvider(rpcUrl);
try {
  const { chainId } = await provider.getNetwork();
  if (chainId !== 1337n) throw new Error('Expected Ganache chain ID 1337.');
  const artifact = await compile();
  const signer = await provider.getSigner(0);
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, signer).deploy();
  await contract.waitForDeployment();
  const config = { address: await contract.getAddress(), administrator: await signer.getAddress(), chainId: Number(chainId), rpcUrl, abi: artifact.abi, deploymentBlock: (await contract.deploymentTransaction().wait()).blockNumber };
  await fs.writeFile('web/deployment.json', JSON.stringify(config, null, 2));
  console.log(JSON.stringify(config, (key, value) => key === 'abi' ? undefined : value, 2));
} finally { provider.destroy(); }
