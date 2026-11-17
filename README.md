# Community Complaint Tracker

Name: Truong Duc Quoc Huy
Student ID: 29211154415

Residents submit short complaints. The deploying administrator advances Submitted → In Review → Resolved. Permissions and sequential transitions are enforced in Solidity. Residents can view all records and filter their own. One administrator is assigned to all complaints at deployment.

## Prerequisites and Ganache settings

Install Node.js 20+ with npm, the **Ganache Windows desktop app**, VS Code, and MetaMask in your browser. Use at least two funded Ganache test accounts. Never use real funds, production wallets or real private keys. Scripts use unlocked local accounts and contain no credentials.

Open the Ganache desktop app and open your existing workspace, or choose Quickstart to create one. Keep this window open while deploying and using the project.

| Setting | Value |
| --- | --- |
| RPC server | `http://127.0.0.1:7545` |
| Chain ID | `1337` |
| Ganache GUI network ID | `5777` in the demonstrated workspace; separate from chain ID |
| Currency | ETH (test Ether only) |
| Mining | Automining |
| Hardfork | Merge, as shown in the demonstrated workspace |

Check the RPC server shown at the top of Ganache. The deployment script verifies chain ID 1337. Do not enter network ID 5777 as the MetaMask chain ID.

## Install, deploy and run

1. Open the project folder in VS Code.
2. Start your workspace in the Ganache desktop app.
3. Open **Terminal → New Terminal** in VS Code and run:

```powershell
npm install
npm run compile
npm run deploy
npm start
```

Leave the server terminal and Ganache app running. **Do not run `npm run ganache` alongside the desktop app**: it attempts to start a second blockchain on the same port.

Open http://127.0.0.1:8080 in a browser containing MetaMask. Deployment uses Ganache account 0 as administrator and generates web/deployment.json with ABI, address and deployment block. Redeploy after resetting Ganache. Solidity targets Paris for older Ganache compatibility.

## Connect MetaMask to Ganache desktop

1. Add a custom network in MetaMask with a name such as **Ganache Desktop**, RPC URL `http://127.0.0.1:7545`, chain ID `1337`, and currency symbol `ETH`.
2. In Ganache's **Accounts** tab, use the key icon beside account index 0 to obtain that disposable test account's private key. Import it into a separate MetaMask test wallet. Repeat for Ganache account index 1. Never save these keys in source code, screenshots or Git.
3. Select the custom Ganache network and the imported account in MetaMask, then click **Connect wallet** in the web app.
4. Verify that the displayed address matches Ganache. Account index 0 is the administrator; account index 1 is the resident. MetaMask may give imported accounts different names or numbers, so identify them by address.

If MetaMask displays a name such as **Localhost 8545**, inspect its configured RPC URL rather than relying on the name. This project uses Ganache desktop on port **7545**.

Switching account or network reloads the page; reconnect afterwards. The interface displays the account, role, contract, transaction hashes, confirmations, errors and events. Use Refresh to fetch changes made elsewhere.

## Manual tests and demonstration

Perform these tests by hand using the Ganache Windows app, the web interface and MetaMask. No automated test or demonstration script is needed for this walkthrough. Keep the same Ganache workspace and deployed contract throughout, and record actual results as you complete each test.

### 1. Resident submits a complaint

1. Select Ganache account index 1 in MetaMask. Reload the web page and click **Connect wallet**.
2. Check that the displayed address matches account 1 and the role is **Resident**.
3. Enter **Streetlight near the community park is broken.** and click **Submit complaint**.
4. Confirm the transaction in MetaMask using test Ether and wait for confirmation.
5. Check that the complaint is **Submitted** and its submitter matches account 1. Note its complaint ID.
6. In Ganache, open **Transactions** and find the hash displayed by the web app. Capture the complaint, submission event and transaction details.

### 2. Administrator reviews the complaint

1. Switch MetaMask to Ganache account index 0, reload and reconnect.
2. Verify the **Administrator** role and find the complaint created in test 1.
3. Click **Move to In Review** and approve in MetaMask.
4. Wait for confirmation and verify **In Review** and the Submitted → In Review event.
5. Capture the result and MetaMask **Activity → transaction details**, showing **Confirmed**.

### 3. Administrator resolves the complaint

1. While connected as account 0, click **Move to Resolved**.
2. Approve in MetaMask and wait for confirmation.
3. Verify **Resolved**, the In Review → Resolved event, and that no further update button is available.
4. Capture the final state and the matching transaction in Ganache.

### 4. Resident views the final result

1. Switch back to account 1, reload and reconnect.
2. Select **My complaints** and verify that the same complaint is **Resolved**.
3. Verify that the resident has no status-update controls. Capture the connected resident address and final complaint status.

### 5. Reject an invalid description

1. As the resident, enter only spaces in the description and try to submit.
2. Verify that the page reports a validation error and no wallet transaction is requested.
3. Repeat with a description longer than 280 UTF-8 bytes. For a simple check, use more than 280 ASCII letters.
4. Verify that no complaint was created. Record this as **interface validation**, not proof of a contract revert.

### 6. Reject an unauthorized contract update manually

A hidden update button only verifies the interface. To demonstrate the contract permission by hand, use a contract interaction GUI such as Remix:

1. Open the project's `contracts/ComplaintTracker.sol` in Remix and compile it with Solidity 0.8.30, targeting the **Paris** EVM.
2. In its deployment/interactions panel, select the injected MetaMask provider and connect Ganache resident account 1. Verify chain ID 1337 and the account address.
3. Attach the compiled contract using **At Address** and the current address in `web/deployment.json`. Do not deploy another contract.
4. Choose an existing complaint that is still Submitted, or first submit a fresh one from the web app. Record its ID.
5. In the attached contract's `updateStatus` form, enter that ID and status value **1** (In Review), then attempt the call as account 1.
6. Expect a revert or gas-estimation rejection with **Only administrator**. Capture the error. If the wallet prevents sending, record it as a rejected call, not a mined failed transaction. There is no need to force-send it.
7. Refresh the web app and verify the complaint remains Submitted. If a transaction was actually mined, also capture its failed receipt in Ganache.

This manual check calls the contract outside the project interface and demonstrates that the resident cannot bypass address-based permissions.

### Evidence and results

Use screenshots or a screen recording of the steps above. Hide seed phrases and private keys. Include the account address, complaint ID, contract address, transaction hash, expected result and observed result where relevant.

| Manual check | Expected result | Current supplied evidence |
| --- | --- | --- |
| Wallet connection | Address, role and chain 1337 displayed | Screenshot supplied for administrator |
| Complaint submission | Submitted plus confirmed transaction and event | Screenshot supplied; submitted by administrator in that browser run |
| Administrator review | In Review plus confirmed transaction and event | Screenshot supplied, including MetaMask Confirmed details |
| Administrator resolution | Resolved plus status-change event | Browser screenshot still needed |
| Resident views own complaint | Resident address and final status displayed | Browser screenshot still needed |
| Invalid description | Validation error, no new complaint | Manual test still to be documented |
| Unauthorized direct contract call | Only administrator rejection, unchanged state | Manual GUI test still to be documented |

The existing Ganache block screenshots document an earlier command-line demonstration; they are not evidence that every manual step above has been completed. The [test and demonstration report](TESTS_AND_DEMONSTRATION.md) retains the provenance of each existing image.

## Verification and limits

The [test and demonstration report](TESTS_AND_DEMONSTRATION.md) includes Ganache desktop screenshots and user-supplied web app and MetaMask screenshots showing submission, In Review and a confirmed wallet transaction. The browser screenshots document a later deployment than the original Ganache demonstration. Browser screenshots of Resolved and a second connected resident account remain to be added. Node 24 may cause the test library to warn about its native µWS binary and use a JavaScript fallback. npm reports vulnerabilities in the legacy Ganache dependency tree; this is a local test-network exercise.

If deployment cannot connect, check that Ganache is open and its RPC server is `http://127.0.0.1:7545`. If the interface reports no contract code after a workspace reset or switch, run `npm run deploy` again and reload the page. If the terminal reports port 7545 is already in use when starting the CLI, use the open desktop app instead.

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
