import fs from 'node:fs/promises';
import { JsonRpcProvider, Contract } from 'ethers';
const config = JSON.parse(await fs.readFile('web/deployment.json', 'utf8'));
if (config.rpcUrl !== 'http://127.0.0.1:7545') throw new Error('Local Ganache only');
const provider = new JsonRpcProvider(config.rpcUrl);
const start = Date.now(), lines = [], recording = [JSON.stringify({version:2,width:110,height:30,timestamp:Math.floor(start/1000),title:'Complaint Tracker live Ganache demo'})];
function log(s) { console.log(s); lines.push(s); recording.push(JSON.stringify([(Date.now()-start)/1000,'o',s+'\r\n'])); }
try {
 if ((await provider.getNetwork()).chainId !== 1337n) throw new Error('Expected chain 1337');
 const admin=await provider.getSigner(0), resident=await provider.getSigner(1);
 const tracker=new Contract(config.address,config.abi,admin);
 if ((await tracker.administrator()) !== await admin.getAddress()) throw new Error('Account 0 must be administrator');
 log('Contract: '+config.address); log('Administrator: '+await admin.getAddress()); log('Resident: '+await resident.getAddress());
 const receipt=await (await tracker.connect(resident).submitComplaint('Broken streetlight on Park Road')).wait();
 const event=receipt.logs.map(l=>{try{return tracker.interface.parseLog(l)}catch{return null}}).find(e=>e?.name==='ComplaintSubmitted');
 const id=event.args.id;
 log(`SUCCESS: resident submitted complaint #${id}; Submitted; tx ${receipt.hash}`);
 let invalidHash;
 try {
  const invalid=await tracker.connect(resident).updateStatus(id,1,{gasLimit:200000});
  invalidHash=invalid.hash;
  try {await invalid.wait(); throw new Error('Unexpected success')} catch(e) {if(e.receipt?.status!==0) throw e}
 } catch(e) {
  invalidHash=e.error?.data?.hash;
  if(!invalidHash) throw e;
 }
 if((await provider.getTransactionReceipt(invalidHash))?.status!==0) throw new Error('Missing reverted receipt');
 if ((await tracker.getComplaint(id)).status!==0n) throw new Error('State changed');
 log(`REJECTED ON CHAIN: tx ${invalidHash}; receipt status 0. Only administrator may update. State remains Submitted.`);
 for(const [next,label] of [[1,'In Review'],[2,'Resolved']]) {const r=await(await tracker.updateStatus(id,next)).wait(); log(`SUCCESS: administrator moved complaint to ${label}; tx ${r.hash}`)}
 if((await tracker.connect(resident).getComplaint(id)).status!==2n) throw new Error('Wrong final state');
 log('VERIFIED: resident reads Resolved. Test Ether only.');
 await fs.mkdir('docs',{recursive:true}); await fs.writeFile('docs/demo.cast',recording.join('\n')+'\n'); await fs.writeFile('docs/demo-results.txt',lines.join('\n')+'\n');
} finally {provider.destroy()}
