import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { verificationInputs, sha256 } from './verification-inputs.mjs';
import { openRepository, validateBaseline } from '@prodshape/core';
const root=process.cwd();const repo=await openRepository(root,'v1alpha2');const baseline=await validateBaseline(repo);
if(baseline.diagnostics.some(d=>d.severity==='error'))throw new Error('The canonical model is invalid.');
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const unit=JSON.parse(await fs.readFile('test-results/vitest.json','utf8'));
const browser=JSON.parse(await fs.readFile('test-results/playwright.json','utf8'));
const source=await verificationInputs();
const reportReceipt=JSON.parse(await fs.readFile('test-results/execution-reports.json','utf8'));
if(JSON.stringify(reportReceipt.source)!==JSON.stringify(source))throw new Error('Unit/browser reports are not bound to current unchanged source.');
for(const [file,digest] of Object.entries(reportReceipt.filesSha256))if(sha256(await fs.readFile(file))!==digest)throw new Error('Execution report changed after completion: '+file);
const connectedReceipt=JSON.parse(await fs.readFile('test-results/connected/source-receipt.json','utf8'));
if(!connectedReceipt.passed||JSON.stringify(connectedReceipt.source)!==JSON.stringify(source))throw new Error('Complete current-source connected qualification is required.');
const connectedBytes=await fs.readFile(connectedReceipt.reportPath);
if(sha256(connectedBytes)!==connectedReceipt.reportSha256)throw new Error('Connected report changed after qualification.');
const connected=JSON.parse(connectedBytes);
if(connected.stats.expected!==48||connected.stats.unexpected||connected.stats.skipped)throw new Error('Connected qualification failed or skipped cases.');

if(!unit.success||unit.numFailedTests||browser.stats.unexpected||browser.stats.skipped)throw new Error('A required verification failed or was skipped.');
const artifacts=baseline.artifacts.filter(a=>a.type==='structured-behaviour');const byId=new Map(artifacts.map(a=>[a.id,a]));const cache=new Map();
function citation(id){if(!cache.has(id)){const artifact=byId.get(id);if(!artifact)throw new Error('Unknown test behaviour '+id);const text=execFileSync('node_modules/.bin/prodshape',['cite','--id',id,'--file',artifact.file,'--form','sidecar-ledger'],{encoding:'utf8'});cache.set(id,YAML.parse(text).citations[0]);}return cache.get(id);}
const results=[];const executable=[];
function add(testId,title,file,level,outcome){const ids=[...new Set(title.match(/\bSB-[A-Z0-9]+(?:-[A-Z0-9]+)*/g)??[])];if(!ids.length)return;results.push({'test-id':testId,level,outcome,citations:ids.map(citation)});executable.push({testId,file,level,outcome,behaviours:ids});}
for(const suite of unit.testResults)for(const [index,test] of suite.assertionResults.entries())add('vitest:'+path.relative(root,suite.name)+':'+index+':'+test.fullName,test.fullName,path.relative(root,suite.name),suite.name.endsWith('.tsx')?'component':/storage|application/.test(suite.name)?'integration':'domain',test.status==='passed'?'passed':'failed');
function walk(suites,folder){for(const suite of suites){for(const spec of suite.specs??[])for(const test of spec.tests){if(!test.results.length)throw new Error('Browser test has no terminal execution.');add('playwright:'+test.projectName+':'+spec.title,spec.title,'tests/'+folder+'/'+spec.file,spec.title.startsWith('SB-REMOTE-COMMIT:')?'integration':'end-to-end',test.results.every(r=>r.status==='passed')?'passed':'failed');}walk(suite.suites??[],folder);}}
walk(browser.suites,'e2e');
walk(connected.suites,'connected');
const deferred=new Set(['SB-PDF-ATTACH','SB-PDF-NAVIGATE','SB-PDF-REJECT']);const covered=new Set(executable.flatMap(t=>t.behaviours));const missing=artifacts.filter(a=>!covered.has(a.id));
if(missing.some(a=>!deferred.has(a.id)))throw new Error('Missing executable behaviour coverage: '+missing.filter(a=>!deferred.has(a.id)).map(a=>a.id).join(', '));
for(const a of missing)results.push({'test-id':'deferred:issue-13:'+a.id,level:'end-to-end',outcome:'inconclusive',citations:[citation(a.id)]});
const evidence={format:'pdac-verification-evidence/v1alpha1',provider:'ScoreMap Vitest and Playwright completed reports','run-id':process.env.GITHUB_ACTIONS==='true'?'github-actions-'+process.env.GITHUB_RUN_ID+'-'+process.env.GITHUB_RUN_ATTEMPT:'local-'+revision,revision,results};
const modelDigest=createHash('sha256').update(JSON.stringify(baseline.artifacts.map(a=>[a.id,a.digest]).sort())).digest('hex');
const coverage=artifacts.map(a=>({id:a.id,citation:citation(a.id),requirements:baseline.artifacts.filter(r=>['functional-requirement','quality-requirement'].includes(r.type)&&r.frontmatter.verification?.some(v=>v['scenario-ref']===a.id)).map(r=>r.id),illustrates:a.frontmatter.illustrates,transition:a.frontmatter['covers-transition']??null,tests:executable.filter(t=>t.behaviours.includes(a.id)),status:covered.has(a.id)?'executed-passed':'deferred-unimplemented',...(deferred.has(a.id)?{issue:'https://github.com/juangcarmona/scoremap/issues/13'}:{})}));
const dir='docs/evidence/mvp';await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/verification-evidence.json',JSON.stringify(evidence,null,2)+'\n');await fs.writeFile(dir+'/behaviour-coverage.json',JSON.stringify({sourceRevision:revision,modelDigest:'sha256:'+modelDigest,serializationVersion:'v1alpha2',executionOrigin:process.env.GITHUB_ACTIONS==='true'?{kind:'github-actions',url:`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`}:{kind:'local'},commands:['npm run verify:delivery','npm run verify:connected'],sourceBinding:{filesSha256:source.filesSha256,reportFilesSha256:reportReceipt.filesSha256,connectedReportSha256:connectedReceipt.reportSha256},qualificationLimits:{retentionAttachments:'Complete currently supported musical graphs qualified; PDF attachment delivery remains separately deferred under issue 13 and is not claimed',eightHourDeadline:'Domain exact-clock witness composed with native configured-earlier-deadline key lifecycle; no native eight-hour session claimed',remoteCommit:'Actual application/service integration with held transport gates; separately authenticated clean-browser reconstruction'},tests:{unit:unit.numPassedTests,browser:browser.stats.expected,connected:connected.stats.expected},summary:{behaviours:artifacts.length,executed:covered.size,deferred:missing.length},independentReview:'pending candidate review',physicalAndroid:'not available; browser/mobile emulation is not device installation',coverage},null,2)+'\n');console.log(JSON.stringify({unit:unit.numPassedTests,browser:browser.stats.expected,executed:covered.size,deferred:missing.length,revision}));
