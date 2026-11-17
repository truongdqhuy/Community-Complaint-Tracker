import fs from 'node:fs/promises';
import solc from 'solc';

export async function compile() {
  const source = await fs.readFile(new URL('../contracts/ComplaintTracker.sol', import.meta.url), 'utf8');
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity', sources: { 'ComplaintTracker.sol': { content: source } },
    settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
  })));
  const errors = (output.errors ?? []).filter(e => e.severity === 'error');
  if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  const contract = output.contracts['ComplaintTracker.sol'].ComplaintTracker;
  return { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` };
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile('artifacts/ComplaintTracker.json', JSON.stringify(await compile(), null, 2));
  console.log('Compiled ComplaintTracker');
}

