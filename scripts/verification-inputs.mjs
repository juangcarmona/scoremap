import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const paths = ['src','tests','scripts','config','package.json','package-lock.json','*.config.ts','*.config.js','tsconfig.json','.product','docs/product/model','openspec','lighthouse.json','global.json','Directory.Build.props','Directory.Packages.props','ScoreMap.slnx','.lighthouse','.agents','docs/architecture','docs/profiles','docs/design','.github','.gitignore','.dockerignore','LIGHTHOUSE.md','.editorconfig','.config','deployment'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export async function verificationInputs() {
  const revision = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  execFileSync('git',['diff','--exit-code','HEAD','--',...paths],{stdio:'pipe'});
  if(execFileSync('git',['ls-files','--others','--exclude-standard','--',...paths],{encoding:'utf8'}).trim()) throw new Error('Commit verification inputs before qualification.');
  const names = execFileSync('git',['ls-tree','-r','--name-only',revision,'--',...paths],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  const filesSha256 = Object.fromEntries(await Promise.all(names.map(async name => [name,sha256(await readFile(name))])));
  return {revision,filesSha256};
}
export async function requireSameInputs(before) {
  if(JSON.stringify(await verificationInputs()) !== JSON.stringify(before)) throw new Error('Verification inputs changed during execution.');
}
