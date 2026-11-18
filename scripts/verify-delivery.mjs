import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { verificationInputs, requireSameInputs, sha256 } from './verification-inputs.mjs';
const source=await verificationInputs();
const receipt={sourceRevision:source.revision,source,startedAt:new Date().toISOString(),executionOrigin:process.env.GITHUB_ACTIONS==='true'?'github-actions':'local',commands:[],status:'running'};
await fs.mkdir('docs/evidence/mvp',{recursive:true});
function run(command){
 const startedAt=new Date().toISOString();const result=spawnSync(command[0],command.slice(1),{stdio:'inherit',env:process.env});
 receipt.commands.push({command,startedAt,endedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal});
 return !result.error&&result.status===0;
}
let passed=run(['npm','run','verify']);
await requireSameInputs(source);
// Keep the aggregate gate failed while executing required functional checks it could not reach.
if(!passed){
 const boundaries=run(['npm','run','verify:frontend-boundaries']);
 const app=run(['npm','run','verify:app']);
 if(!boundaries||!app) receipt.functionalFailure=true;
}
const browser=run(['npm','run','test:e2e']);
await requireSameInputs(source);
const reports={source,completedAt:new Date().toISOString(),filesSha256:{}};
for(const file of ['test-results/vitest.json','test-results/playwright.json']) reports.filesSha256[file]=sha256(await fs.readFile(file));
await fs.mkdir('test-results',{recursive:true});
await fs.writeFile('test-results/execution-reports.json',JSON.stringify(reports,null,2)+'\n');
const evidence=run(['npm','run','evidence:record']);
await requireSameInputs(source);
receipt.status=passed&&browser&&evidence&&!receipt.functionalFailure?'passed':'failed';
receipt.endedAt=new Date().toISOString();
await fs.writeFile('docs/evidence/mvp/run-receipt.json',JSON.stringify(receipt,null,2)+'\n');
if(receipt.status!=='passed') process.exitCode=1;
