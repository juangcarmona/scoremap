import {readFile,writeFile,mkdir,chmod,access,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const [applicationFile,usersFile]=process.argv.slice(2);
if(!applicationFile||!usersFile)throw new Error('Usage: npm run dev:private -- <application-file> <users-file>. Start with the synthetic config/*.example.json files.');
const config=JSON.parse(await readFile(applicationFile,'utf8'));const realm=JSON.parse(await readFile(usersFile,'utf8'));
function fields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||required.some(k=>!(k in value))||Object.keys(value).some(k=>!required.includes(k)&&!optional.includes(k)))throw new Error('Missing or unknown application settings: '+required.join(', '));}
fields(config,['SchemaVersion','Environment','InstanceId','Application','Identity','Storage','Development']);
fields(config.Application,['PublicOrigin','WebRoot','ProductionQualified']);fields(config.Identity,['Authority','ClientId','ClientSecret','DevelopmentFixture']);fields(config.Storage,['ConnectionString','KeysPath']);fields(config.Development,['IdentityPort','DatabasePort'],['DatabasePassword']);
if(config.SchemaVersion!==1||config.Environment!=='Development'||config.Identity.DevelopmentFixture!==true||!/^[a-z0-9-]{1,40}$/.test(config.InstanceId))throw new Error('This bootstrap accepts only version1 Development fixtures and a safe isolated InstanceId.');
const origin=new URL(config.Application.PublicOrigin);const authority=new URL(config.Identity.Authority);
if(origin.pathname!=='/'||origin.search||origin.hash||!realm.enabled||!realm.clients?.some(c=>c.clientId===config.Identity.ClientId)||!Array.isArray(realm.users)||!realm.users.length)throw new Error('Invalid origin or incomplete provider-native users fixture.');
if(!['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Development HTTP is loopback-only. Configure qualified HTTPS for a reachable trial; do not expose fixture passwords over a LAN.');
const runtime=resolve('.runtime',config.InstanceId);await mkdir(runtime,{recursive:true,mode:0o700});await chmod(runtime,0o700);
const target=join(runtime,'application.private.json');
try{await access(target);const existing=JSON.parse(await readFile(target,'utf8'));config.Development.DatabasePassword=existing.Development.DatabasePassword;}catch{config.Development.DatabasePassword=randomBytes(32).toString('hex');}
config.Storage.ConnectionString=`Host=localhost;Port=${config.Development.DatabasePort};Database=scoremap;Username=postgres;Password=${config.Development.DatabasePassword}`;
config.Storage.KeysPath=join(runtime,'keys');config.Application.WebRoot=resolve(config.Application.WebRoot);
await mkdir(config.Storage.KeysPath,{recursive:true,mode:0o700});await chmod(config.Storage.KeysPath,0o700);
// Native realm import runs only on first creation; never reset an existing user's realm or songs.
await mkdir(join(runtime,'realm'),{recursive:true,mode:0o700});
const client=realm.clients.find(c=>c.clientId===config.Identity.ClientId);
client.secret=config.Identity.ClientSecret;client.redirectUris=[origin.origin+'/signin-oidc'];client.webOrigins=[origin.origin];client.attributes={'post.logout.redirect.uris':origin.origin+'/##'+origin.origin+'/signout-callback-oidc'};
if(authority.pathname!==`/realms/${realm.realm}`)throw new Error('Identity Authority realm must match the selected users file.');
const importPath=join(runtime,'realm',realm.realm+'-realm.json');const importTemporary=importPath+'.'+randomBytes(8).toString('hex')+'.tmp';await writeFile(importTemporary,JSON.stringify(realm),{mode:0o444});await rename(importTemporary,importPath);const configTemporary=target+'.'+randomBytes(8).toString('hex')+'.tmp';await writeFile(configTemporary,JSON.stringify(config,null,2),{mode:0o600});await rename(configTemporary,target);
console.log(`Starting isolated ${config.InstanceId}. Trial: ${origin.origin}. Stop with Ctrl+C; persistent volumes and private files are retained.`);
const restored=spawnSync('dotnet',['tool','restore'],{stdio:'inherit'});if(restored.status!==0)throw new Error('The pinned Aspire CLI could not be restored.');
const child=spawn('dotnet',['tool','run','aspire','--','run','--apphost','src/root/ScoreMap.AppHost/ScoreMap.AppHost.csproj','--non-interactive'],{stdio:'inherit',env:{...process.env,SCOREMAP_APPLICATION_FILE:target,ASPIRE_ALLOW_UNSECURED_TRANSPORT:'true',DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS:'true',DOTNET_DASHBOARD_URLS:'http://localhost:18888',ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL:'http://localhost:18889'}});
child.on('exit',code=>process.exit(code??1));for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
