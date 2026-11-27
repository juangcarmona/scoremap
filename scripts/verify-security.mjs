import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const credentials=[/\bgh[pousr]_[A-Za-z0-9]{30,}\b/u,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/u,/\bnpm_[A-Za-z0-9]{30,}\b/u,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,/\bAKIA[A-Z0-9]{16}\b/u,/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/u];
export async function verifyCredentialInputs(paths){
for(const path of [...new Set(paths)]){
 const native=path.startsWith('src/android/');
 if(native&&/\.(?:jks|keystore|p12|pfx)$/iu.test(path))throw new Error('Native signing material must remain outside Git: '+path);
 if(!native&&(/(?:^|\/)(?:bin|obj|node_modules)\//u.test(path)||!path.match(/\.(?:cs|json|md|ya?ml|[cm]?js|tsx?|css|py|props|xml|txt|config)$/u)))continue;
 const text=await readFile(path,'utf8');
 if(credentials.some(pattern=>pattern.test(text)))throw new Error('Credential-like material detected in '+path+'; keep actual secrets outside Git.');
}
}
async function main(){
 const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
 await verifyCredentialInputs(paths);
await mkdir('test-results/security',{recursive:true});
for(const [name,args] of [['runtime-audit',['audit','--omit=dev','--audit-level=low']],['tooling-audit',['audit','--audit-level=high']],['browser-sbom',['sbom','--sbom-format','cyclonedx']]]){
 const sbom=name==='browser-sbom';
 const result=spawnSync(sbom?'npx':'npm',sbom?['--yes','--package=npm@10.9.4','--','npm',...args]:args,{encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});
 await writeFile('test-results/security/'+name+(sbom?'.json':'.txt'),result.stdout+(sbom?'':result.stderr));
 if(sbom)await writeFile('test-results/security/browser-sbom.stderr.txt',result.stderr);
 if(name==='browser-sbom'&&result.status===0){
  const bom=JSON.parse(result.stdout);if(bom.bomFormat!=='CycloneDX')throw new Error('Unexpected browser SBOM format.');
  const manifest=JSON.parse(await readFile('package.json','utf8'));
  const components=new Map(bom.components.map(component=>[component.name,component]));
  for(const dependency of Object.keys(manifest.dependencies)){
   if(!components.has(dependency))throw new Error('Build SBOM omitted runtime dependency '+dependency);
   const licenses=components.get(dependency).licenses??[];
   if(!licenses.some(entry=>['MIT','ISC','Apache-2.0'].includes(entry.license?.id)))throw new Error('Unapproved runtime dependency license: '+dependency);
  }
 }
 if(result.error||result.status!==0)throw new Error(name+' failed; see the private test-results/security report.');
}
console.log('Credential patterns, runtime vulnerability gate, high/critical tooling gate and complete browser/build SBOM passed. Lower-severity tooling advisories remain visible in the tooling report.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
