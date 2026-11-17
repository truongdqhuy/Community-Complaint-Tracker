# Community Complaint Tracker — Tests, Demonstration and Individual Explanation

## Project overview

The application tracks a resident's complaint from **Submitted → In Review → Resolved**. A resident submits a short description. The administrator assigned at deployment changes the status, and the submitter can view the resulting record. All accounts and transactions use local Ganache and test Ether.

## 1. Tests and image evidence

The automated tests were rerun on 17 November 2026 using the repository's test file:

```powershell
npm test
```

The evidence capture invoked the equivalent Node.js command directly: `node --test tests/workflow.test.mjs`. It passed **one workflow test containing multiple assertions, with zero failed tests**. The test starts a fresh in-process Ganache blockchain, so its account addresses differ from the persistent Ganache GUI accounts used in the live demonstration.

![Actual captured automated test output](evidence/tests.png)

**Evidence format:** This image renders actual captured test output; it is not a desktop screenshot. The unabridged captured output is available in [test-output.txt](evidence/test-output.txt). Ganache prints a native µWS compatibility warning on Node 24, then uses its JavaScript fallback; the test completes successfully.

| Check | Expected result | Verified result |
| --- | --- | --- |
| Resident submits a valid complaint | Successful transaction, recorded submitter, Submitted status | Passed |
| Resident directly calls administrator update | Mined transaction reverts, receipt status 0, status unchanged | Passed |
| Administrator skips Submitted to Resolved | Rejected with `Must advance one status` | Passed |
| Administrator updates a missing complaint | Rejected with `Complaint does not exist` | Passed |
| Empty, ASCII-whitespace-only or over-280-byte description | Rejected | Passed |
| Administrator moves Submitted to In Review | Status becomes In Review | Passed |
| Administrator repeats In Review | Rejected | Passed |
| Administrator moves In Review to Resolved | Status becomes Resolved and resident can read it | Passed |
| Administrator attempts to reopen Resolved | Rejected with `Already resolved` | Passed |
| Contract events | One submission event and two status-change events | Passed |

The unauthorized transaction is sent with an explicit gas limit so it reaches Ganache instead of stopping at gas estimation. Its failed receipt and unchanged state demonstrate that access control operates in the contract, independently of the interface. Other invalid-input and transition checks use static calls to inspect rejection without creating unnecessary transactions.

Test source: [workflow.test.mjs](../tests/workflow.test.mjs).

## 2. Live Ganache demonstration

The live demonstration used the Ganache GUI instance at `http://127.0.0.1:7545`, chain ID **1337**. The GUI network ID **5777** is a separate identifier. The deployed contract is:

```text
0x82bE84156B45DA8B20cb9ad9Fa3909F96d77b9e7
```

| Role | Ganache account | Address |
| --- | --- | --- |
| Administrator | Index 0 | `0xf2139a9b9c8B65E6E07416b87e4e5Da4b6838F53` |
| Resident | Index 1 | `0x125F90371661Fd172e5d2d00AB48DA81F4123D92` |

![Saved results of the actual local Ganache demonstration](evidence/demonstration.png)

This evidence image renders the saved live transaction output. The [terminal recording](demo.cast) and [plain-text results](demo-results.txt) are included. Replay the recording with `asciinema play docs/demo.cast` from the project root if asciinema is installed. No private keys or mnemonic phrases are included in these artifacts.

### Demonstration steps and results

1. The resident submitted **“Broken streetlight on Park Road”**, creating complaint **#2** with status Submitted.
2. The same resident attempted to advance the complaint to In Review. Ganache mined the transaction with receipt status **0**. The contract rejected it because the caller was not the administrator, and the complaint remained Submitted.
3. The administrator advanced complaint #2 to In Review.
4. The administrator advanced it to Resolved.
5. A read using the resident account confirmed the final Resolved status.

| Action | Outcome | Transaction hash |
| --- | --- | --- |
| Resident submission | Successful | `0x8fff542e2773393ef759ab85992bef4d393e2d8e3730f684c9a57342a753ae4a` |
| Unauthorized resident update | Reverted; state unchanged | `0x6fdc599279666dd98ffa3bca6582681bcad2f02d65b20535a3f6660f9d03dc73` |
| Administrator review | Successful | `0xb8aa8ad846957fef1f302b4a88ec5eec22586dbc2acafbb6be8b95d0e7532d1a` |
| Administrator resolution | Successful | `0xb68ea6625aac8163c31dc2f6816c1379f9495201d0a501e153d0ca032102455f` |

A reverted transaction changes no complaint data but still consumes test gas. The successful administrator transactions prove that the permitted role can complete the lifecycle. These hashes refer to the original local Ganache workspace and will not exist on a fresh or reset chain.

To repeat the live demonstration after deploying:

```powershell
node scripts/demo.mjs
```

Each run creates a new sample complaint and updates the saved demonstration artifacts. To regenerate the evidence images afterwards, run `python scripts/render-evidence.py` with Pillow installed. The test image uses the captured `docs/evidence/test-output.txt`; rerunning `npm test` alone does not replace that capture.

### Interface demonstration checklist

The command-line workflow above has been verified. The browser preview timed out, so the MetaMask flow has **not** been visually verified or recorded. Complete these steps before final submission if browser screenshots are required:

1. Keep Ganache GUI running. Run `npm start` and open `http://127.0.0.1:8080` in a MetaMask-enabled browser.
2. Connect Ganache resident account 1. Capture the connected address and submit a new complaint with test Ether.
3. Capture the confirmed transaction, Submitted record and submission event.
4. Switch to administrator account 0, reconnect, and capture In Review and Resolved after confirmation.
5. Switch back to resident account 1, reconnect, and capture the final status using My complaints.
6. Use the recorded unauthorized transaction or its Ganache receipt to show contract-level rejection. Hide mnemonics and private keys in every screenshot.

## 3. Individual explanation — review and adapt before submission

This section explains the implementation provided in this repository. Review the source and express your own understanding before submitting it as an individual assignment.

### Contract design

`ComplaintTracker.sol` stores each complaint under a numeric ID. A complaint contains the submitter address, description and status. IDs start at 1, and `complaintCount` tracks the number submitted. Descriptions must contain 1–280 UTF-8 bytes and cannot contain only the checked ASCII whitespace characters.

The contract obtains the submitter from `msg.sender`, rather than accepting an address supplied by the caller. This prevents a caller from attributing a complaint to another resident through a function argument.

The deploying address becomes the immutable administrator. Every status update checks that `msg.sender` equals this address. This project uses one assigned administrator for all complaints. The interface hides update buttons from residents, while Solidity independently enforces the permission.

The enum represents Submitted, In Review and Resolved as values 0, 1 and 2. An update must advance exactly one value. This prevents skipping review, repeating a status and moving backward. Resolved is final. Missing complaint IDs are rejected.

### Events and Web3 interaction

The contract emits `ComplaintSubmitted` for a new record and `StatusChanged` for each valid transition. The interface reads stored complaints for the current state and loads events for the activity history. It uses ethers.js and the wallet provider to request account access and sign transactions.

The interface displays the connected address, role, network and contract address. Transaction feedback covers wallet approval, pending hash, confirmed block and errors. The page reloads when the account or network changes to avoid retaining a signer for the previous account. Users reconnect after a switch.

### Deployment and testing choices

The deployment script compiles Solidity and deploys using unlocked Ganache account 0. It writes the ABI and deployed address into `web/deployment.json`. This avoids manually copying an ABI or using the unrelated address from the earlier Python storage example. The compiler targets the Paris EVM for compatibility with the Ganache GUI Merge hardfork.

Automated testing uses a separate temporary Ganache chain for repeatable results. The live script then demonstrates the same workflow on the GUI's persistent local chain using two different accounts. Sending an unauthorized transaction directly proves that hiding a button is not the security boundary.

### Limitations and learning points

Blockchain data is public, even when a Solidity mapping is declared private. Complaints should not include sensitive resident information. This demonstration loads all complaint records, so a larger application would need pagination. There is no administrator reassignment or complaint reopening. The contract records the administrator's resolution decision; it cannot independently verify real-world repairs.

The main concepts illustrated are address-based authorization, transaction reverts, sequential state transitions, event logs, wallet signing, and the difference between a read call and a state-changing transaction.

## 4. Assistance and references

The implementation, tests, scripts and this report were prepared with **OpenAI Codex assistance**. The evidence images are programmatic renderings of actual execution output, not AI-generated screenshots. Review and adapt the work and disclose assistance according to your course rules.

- [Solidity contracts and visibility](https://docs.soliditylang.org/en/latest/contracts.html)
- [ethers.js v6 documentation](https://docs.ethers.org/v6/getting-started/)
- [Ganache source and documentation](https://github.com/trufflesuite/ganache)
- Local implementation: [contract](../contracts/ComplaintTracker.sol), [interface](../web/index.html), [deployment](../scripts/deploy.mjs), [live demonstration](../scripts/demo.mjs).
