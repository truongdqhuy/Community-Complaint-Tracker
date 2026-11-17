import { BrowserProvider, Contract } from '/vendor/ethers.js';

const $ = id => document.getElementById(id);
const labels = ['Submitted', 'In Review', 'Resolved'];
let provider, contract, config, account, administrator, busy = false;
function status(message, error = false) { $('status').textContent = message; $('status').dataset.error = String(error); }
function errorText(error) { return error.reason || error.shortMessage || error.message || String(error); }
function entry(parent, message) { const li = document.createElement('li'); li.textContent = message; $(parent).prepend(li); }
function controls() {
  $('connect').disabled = busy;
  $('submit-button').disabled = busy || !contract;
  $('refresh').disabled = busy || !contract;
  document.querySelectorAll('[data-update]').forEach(button => { button.disabled = busy; });
}
async function transact(action) {
  busy = true; controls();
  try {
    status('Waiting for wallet approval…');
    const tx = await action();
    status(`Pending transaction: ${tx.hash}`);
    entry('activity', `Pending · ${tx.hash}`);
    const receipt = await tx.wait();
    entry('activity', `Confirmed · block ${receipt.blockNumber} · ${tx.hash}`);
    await refresh();
    status(`Confirmed in block ${receipt.blockNumber}. Contract state refreshed.`);
    return true;
  } catch (error) { status(errorText(error), true); entry('activity', `Rejected / failed · ${errorText(error)}`); return false; }
  finally { busy = false; controls(); }
}
async function refresh() {
  const count = Number(await contract.complaintCount());
  $('count').textContent = count;
  $('complaints').replaceChildren();
  let shown = 0;
  for (let id = count; id >= 1; id--) {
    const complaint = await contract.getComplaint(id);
    if ($('mine').checked && complaint.submitter.toLowerCase() !== account.toLowerCase()) continue;
    shown++;
    const card = document.createElement('article'); card.className = 'complaint';
    const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = `#${id} · ${labels[Number(complaint.status)]}`;
    const description = document.createElement('p'); description.textContent = complaint.description;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `Submitted by ${complaint.submitter}`;
    card.append(badge, description, meta);
    if (account.toLowerCase() === administrator.toLowerCase() && Number(complaint.status) < 2) {
      const next = Number(complaint.status) + 1;
      const button = document.createElement('button'); button.dataset.update = id; button.textContent = `Move to ${labels[next]}`;
      button.onclick = () => transact(() => contract.updateStatus(id, next)); card.append(button);
    }
    $('complaints').append(card);
  }
  if (!shown) { const p = document.createElement('p'); p.textContent = 'No complaints to display yet.'; $('complaints').append(p); }
  const events = await contract.queryFilter('*', config.deploymentBlock, 'latest');
  $('events').replaceChildren();
  for (const event of events.slice(-30)) {
    if (event.eventName === 'ComplaintSubmitted') entry('events', `Block ${event.blockNumber} · Complaint #${event.args.id} submitted by ${event.args.submitter}`);
    if (event.eventName === 'StatusChanged') entry('events', `Block ${event.blockNumber} · Complaint #${event.args.id}: ${labels[Number(event.args.previousStatus)]} → ${labels[Number(event.args.newStatus)]}`);
  }
  if (!events.length) entry('events', 'No contract events yet.');
  controls();
}
$('connect').onclick = async () => {
  busy = true; controls();
  try {
    if (!window.ethereum) throw new Error('Install MetaMask and add your local Ganache test network.');
    const response = await fetch('/deployment.json');
    if (!response.ok) throw new Error('Run npm run deploy before connecting.');
    config = await response.json();
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = '0x' + config.chainId.toString(16);
    try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] }); }
    catch (error) {
      if (error.code !== 4902) throw error;
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId, chainName: 'Ganache Local Test', rpcUrls: [config.rpcUrl], nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 } }] });
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    }
    provider = new BrowserProvider(window.ethereum);
    if ((await provider.getNetwork()).chainId !== 1337n) throw new Error('Connect to Ganache chain 1337.');
    if (await provider.getCode(config.address) === '0x') throw new Error('No contract found. Redeploy after restarting Ganache.');
    const signer = await provider.getSigner(); account = await signer.getAddress();
    contract = new Contract(config.address, config.abi, signer);
    administrator = await contract.administrator();
    $('account').textContent = account; $('contract').textContent = config.address;
    $('role').textContent = account.toLowerCase() === administrator.toLowerCase() ? 'Administrator' : 'Resident';
    $('chain').textContent = 'Ganache · Chain 1337';
    await refresh(); status('Connected. Ready for test transactions.');
  } catch (error) { contract = null; status(errorText(error), true); }
  finally { busy = false; controls(); }
};
$('submit').onsubmit = async event => {
  event.preventDefault(); if (!contract || busy) return;
  const description = $('description').value.trim();
  if (!description || new TextEncoder().encode(description).length > 280) { status('Enter a description of 1–280 UTF-8 bytes.', true); return; }
  if (await transact(() => contract.submitComplaint(description))) $('description').value = '';
};
$('refresh').onclick = () => refresh().catch(error => status(errorText(error), true));
$('mine').onchange = () => { if (contract) refresh().catch(error => status(errorText(error), true)); };
if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => location.reload());
  window.ethereum.on('chainChanged', () => location.reload());
}
