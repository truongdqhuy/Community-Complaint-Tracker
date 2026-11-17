import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory } from 'ethers';
import { compile } from '../scripts/compile.mjs';

test('Ganache: two-account submission, permissions, sequential resolution and events', async () => {
  const rpc = ganache.provider({ chain: { chainId: 1337 }, wallet: { totalAccounts: 3 }, logging: { quiet: true } });
  const provider = new BrowserProvider(rpc);
  const report = [];
  try {
    const admin = await provider.getSigner(0), resident = await provider.getSigner(1);
    const artifact = await compile();
    const tracker = await new ContractFactory(artifact.abi, artifact.bytecode, admin).deploy();
    await tracker.waitForDeployment();
    const receipt = await (await tracker.connect(resident).submitComplaint('Broken streetlight on Park Road')).wait();
    assert.equal(receipt.status, 1);
    assert.equal((await tracker.getComplaint(1)).submitter, await resident.getAddress());
    assert.equal((await tracker.getComplaint(1)).status, 0n);
    report.push(`PASS: Resident ${await resident.getAddress()} submitted complaint #1; transaction ${receipt.hash}`);
    // Explicit gas sends the unauthorized transaction to Ganache rather than stopping at estimation.
    const invalid = await tracker.connect(resident).updateStatus(1, 1, { gasLimit: 200000 });
    await assert.rejects(invalid.wait());
    assert.equal((await provider.getTransactionReceipt(invalid.hash)).status, 0);
    assert.equal((await tracker.getComplaint(1)).status, 0n);
    report.push(`PASS: Unauthorized resident update reverted on-chain; transaction ${invalid.hash}; state remained Submitted.`);
    await assert.rejects(tracker.updateStatus.staticCall(1, 2), /Must advance one status/);
    await assert.rejects(tracker.updateStatus.staticCall(999, 1), /Complaint does not exist/);
    for (const description of ['', '   ', 'a'.repeat(281)]) await assert.rejects(tracker.submitComplaint.staticCall(description));
    await (await tracker.updateStatus(1, 1)).wait();
    assert.equal((await tracker.connect(resident).getComplaint(1)).status, 1n);
    await assert.rejects(tracker.updateStatus.staticCall(1, 1), /Must advance one status/);
    await (await tracker.updateStatus(1, 2)).wait();
    assert.equal((await tracker.connect(resident).getComplaint(1)).status, 2n);
    await assert.rejects(tracker.updateStatus.staticCall(1, 1), /Already resolved/);
    assert.equal((await tracker.queryFilter(tracker.filters.ComplaintSubmitted())).length, 1);
    assert.equal((await tracker.queryFilter(tracker.filters.StatusChanged())).length, 2);
    report.push(`PASS: Administrator ${await admin.getAddress()} advanced Submitted → In Review → Resolved; resident read final state.`);
    report.push('PASS: Empty, blank and oversized descriptions, missing IDs, skipped/repeated/backward transitions rejected. Submission and both status events verified.');
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile('test-results/workflow.txt', report.join('\n') + '\n');
    console.log(report.join('\n'));
  } finally { provider.destroy(); await rpc.disconnect(); }
});
