# Community Complaint Tracker

Residents submit short complaints. The deploying administrator advances Submitted → In Review → Resolved. Permissions and sequential transitions are enforced in Solidity. Residents can view all records and filter their own. One administrator is assigned to all complaints at deployment.

## Prerequisites and Ganache settings

Node.js 20+ and npm; Ganache GUI or bundled CLI; MetaMask for the wallet interface. RPC: http://127.0.0.1:7545, chain ID **1337**, currency ETH (test Ether). Use at least two funded Ganache test accounts. Never use real funds, production wallets or real private keys. Scripts use unlocked local accounts and contain no credentials.

## Install, deploy and run

```powershell
npm install
# Separate terminal, unless Ganache GUI is already running:
npm run ganache
# Project terminal:
npm run compile
npm run deploy
npm start
```

Open http://127.0.0.1:8080 in a browser containing MetaMask. Deployment uses Ganache account 0 as administrator and generates web/deployment.json with ABI, address and deployment block. Redeploy after resetting Ganache. Solidity targets Paris for older Ganache compatibility.

Add the network above in MetaMask. Import only disposable Ganache accounts 0 and 1 into a separate test wallet using credentials shown by your own Ganache instance. Never commit credentials. Connect the wallet. Switching account or network reloads the page; reconnect afterwards. The interface displays the account, role, contract, transaction hashes, confirmations, errors and events. Use Refresh to fetch changes made elsewhere.

## Tests and recorded demonstration

```powershell
npm test
# Requires the running local Ganache and deployed contract:
node scripts/demo.mjs
```

Tests start an isolated in-process Ganache and deploy a fresh contract. Verified checks: resident submission; submitter and initial status; mined unauthorized update with receipt status 0 and unchanged state; administrator review and resolution; resident reads; submission/status events; rejection of empty, blank and oversized descriptions, missing IDs, skipped/repeated/backward transitions. Fresh test output is saved to test-results/workflow.txt.

The live demonstration creates one sample complaint per run using unlocked accounts 0 and 1. Actual transaction hashes and outcomes are saved in [docs/demo-results.txt](docs/demo-results.txt). [docs/demo.cast](docs/demo.cast) is a short terminal recording of the real Ganache interactions; replay with `asciinema play docs/demo.cast` if installed. This records the command-line workflow rather than MetaMask.

Wallet demonstration:

1. Connect resident account 1, submit a complaint and approve with test Ether. Observe Submitted and the event.
2. Switch to administrator account 0, reconnect and move it to In Review, then Resolved, waiting for each confirmation.
3. Switch back to account 1 and reconnect. Select My complaints and observe Resolved.
4. Residents have no update button. The test and live demo bypass the interface and send a resident update directly: it reverts because msg.sender is not the administrator. Receipt status is 0, state stays Submitted, and test gas is consumed.
5. Optionally capture wallet screenshots for your individual submission.

## Verification and limits

The automated workflow passed. Local deployment and live demo details are in docs/demo-results.txt. The built-in browser preview timed out reaching the local server, so wallet interactions and visual layout have not been manually verified. Complete the wallet walkthrough before submitting. Node 24 may cause Ganache to warn about its native µWS binary and use a JavaScript fallback. npm reports vulnerabilities in the legacy Ganache dependency tree; this is a local test-network exercise.

Descriptions are limited to 280 UTF-8 bytes. All blockchain data is public, including private Solidity mappings; do not include sensitive resident information. The interface loads all complaints and the latest 30 events and is intended for a small demonstration. The contract records the administrator's resolution decision; it cannot verify real-world work.

## Source and individual explanation

- contracts/ComplaintTracker.sol: storage, immutable administrator, validation, access control, lifecycle and events.
- web/: HTML/CSS/JavaScript; ethers served locally from the installed package.
- scripts/: compilation, deployment, local server and recording.
- tests/workflow.test.mjs: two-account lifecycle and rejection checks.
- ganache_contract.py: earlier storage-contract example, independent of this application.

The submitter is msg.sender, so callers cannot pass a forged resident address. The administrator is fixed at deployment. Updates must advance exactly one status; Resolved is final. Reverting an invalid update preserves stored state. Events show history; current status is read from contract storage. Review and adapt the code and explain these choices in your own submission.

## References and assistance

Created with OpenAI Codex assistance. Libraries: Solidity/solc, ethers.js and Ganache; versions are pinned in package files. References consulted: [ethers v6](https://docs.ethers.org/v6/getting-started/), [Solidity contracts and visibility](https://docs.soliditylang.org/en/latest/contracts.html), [Ganache](https://github.com/trufflesuite/ganache). No external application template was copied. Declare assistance according to your course policy.
