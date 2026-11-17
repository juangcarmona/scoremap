import fs from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const paths=['src','tests','scripts','package.json','package-lock.json','*.config.ts','*.config.js','tsconfig.json','.product','docs/product/model','openspec','lighthouse.json','.github/workflows/ci.yml','global.json','Directory.Build.props','Directory.Packages.props','ScoreMap.slnx','config','deployment','.lighthouse','.agents','docs/architecture','docs/profiles','docs/design','.github','.gitignore','.dockerignore','LIGHTHOUSE.md','.editorconfig','.config'];
function unchanged(){execFileSync('git',['diff','--exit-code','HEAD','--',...paths],{stdio:'pipe'});const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','--',...paths],{encoding:'utf8'}).trim();if(untracked)throw new Error('Commit verification inputs before retaining execution evidence.');}
unchanged();const receipt={sourceRevision:revision,startedAt:new Date().toISOString(),executionOrigin:process.env.GITHUB_ACTIONS==='true'?'github-actions':'local',commands:[],status:'running'};
await fs.mkdir('docs/evidence/mvp',{recursive:true});
for(const command of[['npm','run','verify'],['npm','run','test:e2e'],['npm','run','evidence:record']]){
 const startedAt=new Date().toISOString();const result=spawnSync(command[0],command.slice(1),{stdio:'inherit',env:process.env});receipt.commands.push({command,startedAt,endedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal});
 if(result.error||result.status!==0){receipt.status='failed';await fs.writeFile('docs/evidence/mvp/run-receipt.json',JSON.stringify(receipt,null,2)+'\n');process.exit(result.status??1);}
 unchanged();
}
receipt.status='passed';receipt.endedAt=new Date().toISOString();await fs.writeFile('docs/evidence/mvp/run-receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log('Delivery commands completed against unchanged committed verification inputs: '+revision);
