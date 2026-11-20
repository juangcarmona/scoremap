import {readFile,writeFile,mkdir,chmod,access,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const [applicationFile,usersFile]=process.argv.slice(2);
if(!applicationFile||!usersFile)throw new Error('Usage: npm run dev:private -- <application-file> <users-file>. Start with the synthetic config/*.example.json files.');
async function readJson(path){const contents=await readFile(path,'utf8');try{return JSON.parse(contents);}catch{throw new Error('Application or provider fixture is not valid JSON.');}}
const config=await readJson(applicationFile);const realm=await readJson(usersFile);
function fields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||required.some(k=>!(k in value))||Object.keys(value).some(k=>!required.includes(k)&&!optional.includes(k)))throw new Error('Missing or unknown application settings: '+required.join(', '));}
fields(config,['SchemaVersion','Environment','InstanceId','Application','Identity','Storage','Development']);
fields(config.Application,['PublicOrigin','WebRoot','ProductionQualified'],['PrivateOfflineMinutes']);if(config.Application.PrivateOfflineMinutes!==undefined&&(!Number.isInteger(config.Application.PrivateOfflineMinutes)||config.Application.PrivateOfflineMinutes<0||config.Application.PrivateOfflineMinutes>480))throw new Error('Application.PrivateOfflineMinutes must be 0 (disabled) through 480; no offline lease can exceed eight hours.');fields(config.Identity,['Authority','ClientId','ClientSecret','DevelopmentFixture']);fields(config.Storage,['ConnectionString','KeysPath']);fields(config.Development,['IdentityPort','DatabasePort'],['DatabasePassword']);
if(config.SchemaVersion!==1||config.Environment!=='Development'||config.Identity.DevelopmentFixture!==true||!/^[a-z0-9-]{1,40}$/.test(config.InstanceId))throw new Error('This bootstrap accepts only version1 Development fixtures and a safe isolated InstanceId.');
function safeUrl(value){try{return new URL(value);}catch{throw new Error('Application origin or identity authority is invalid.');}}
const origin=safeUrl(config.Application.PublicOrigin);const authority=safeUrl(config.Identity.Authority);
if(!['http:','https:'].includes(origin.protocol)||!['http:','https:'].includes(authority.protocol)||origin.username||origin.password||authority.username||authority.password||authority.search||authority.hash)throw new Error('Application and identity URLs must be valid HTTP(S) URLs without credentials, query or fragment.');
if(typeof config.Application.WebRoot!=='string'||!config.Application.WebRoot.trim()||typeof config.Identity.ClientId!=='string'||!config.Identity.ClientId.trim()||![config.Development.IdentityPort,config.Development.DatabasePort].every(port=>Number.isInteger(port)&&port>0&&port<=65535)||config.Development.IdentityPort===config.Development.DatabasePort)throw new Error('Web root, client ID and distinct valid development ports are required.');
if(origin.pathname!=='/'||origin.search||origin.hash||!realm.enabled||!realm.clients?.some(c=>c.clientId===config.Identity.ClientId)||!Array.isArray(realm.users)||!realm.users.length)throw new Error('Invalid origin or incomplete provider-native users fixture.');
if(!['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Development HTTP is loopback-only. Configure qualified HTTPS for a reachable trial; do not expose fixture passwords over a LAN.');
if(typeof config.Identity.ClientSecret !== 'string'||!config.Identity.ClientSecret.trim())throw new Error('The development identity client secret is required.');
if(typeof realm.realm !== 'string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(realm.realm)||authority.pathname!==`/realms/${realm.realm}`)throw new Error('Identity Authority must match a safe realm name in the selected users file.');
if(!Array.isArray(realm.clients))throw new Error('The users fixture must define provider clients.');
const clients=new Map();
for(const entry of realm.clients){
 if(!entry||typeof entry.clientId!=='string'||!entry.clientId.trim()||clients.has(entry.clientId))throw new Error('Provider client IDs must be nonempty and unique.');
 clients.set(entry.clientId,entry);
}
const selectedClient=clients.get(config.Identity.ClientId);
if(!selectedClient||selectedClient.enabled!==true||selectedClient.publicClient!==false)throw new Error('The selected provider client must be enabled and confidential.');
const ids=new Set(),names=new Set();
const realmRoleNames=new Set((realm.roles?.realm??[]).map(role=>role.name));
const clientRoleNames=realm.roles?.client??{};
for(const user of realm.users){
 if(!user||typeof user.id!=='string'||!user.id.trim()||user.id!==user.id.trim()||typeof user.username!=='string'||!user.username.trim()||user.username!==user.username.trim()||typeof user.enabled!=='boolean')throw new Error('Every provider user needs an ID, username and enabled flag.');
 const name=user.username.toLowerCase(),id=user.id.toLowerCase();
 if(ids.has(id)||names.has(name))throw new Error('Provider user IDs and usernames must be unique.');
 ids.add(id);names.add(name);
 if(!Array.isArray(user.credentials)||!user.credentials.some(credential=>credential?.type==='password'&&typeof credential.value==='string'&&credential.value.length>0))throw new Error('Every provider user needs a nonempty password credential.');
 if(user.realmRoles!==undefined&&(!Array.isArray(user.realmRoles)||user.realmRoles.some(role=>typeof role!=='string'||(!realmRoleNames.has(role)&&role!==`default-roles-${realm.realm}`&&role!=='offline_access'&&role!=='uma_authorization'))))throw new Error('Provider user realm roles must reference declared or built-in roles.');
 if(user.clientRoles!==undefined){
  if(!user.clientRoles||typeof user.clientRoles!=='object'||Array.isArray(user.clientRoles))throw new Error('Provider user client roles must be an object.');
  for(const [clientId,roles] of Object.entries(user.clientRoles)){
   const declared=clientRoleNames[clientId];
   if(!clients.has(clientId)||!Array.isArray(roles)||!Array.isArray(declared)||roles.some(role=>typeof role!=='string'||!declared.some(value=>value.name===role)))throw new Error('Provider user client roles must reference declared clients and roles.');
  }
 }
}
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
const importPath=join(runtime,'realm',realm.realm+'-realm.json');const importTemporary=importPath+'.'+randomBytes(8).toString('hex')+'.tmp';await writeFile(importTemporary,JSON.stringify(realm),{mode:0o444});await rename(importTemporary,importPath);const configTemporary=target+'.'+randomBytes(8).toString('hex')+'.tmp';await writeFile(configTemporary,JSON.stringify(config,null,2),{mode:0o600});await rename(configTemporary,target);
console.log(`Starting isolated ${config.InstanceId}. Trial: ${origin.origin}. Stop with Ctrl+C; persistent volumes and private files are retained.`);
const restored=spawnSync('dotnet',['tool','restore'],{stdio:'inherit'});if(restored.status!==0)throw new Error('The pinned Aspire CLI could not be restored.');
const child=spawn('dotnet',['tool','run','aspire','--','run','--apphost','src/root/ScoreMap.AppHost/ScoreMap.AppHost.csproj','--non-interactive'],{stdio:'inherit',env:{...process.env,SCOREMAP_APPLICATION_FILE:target,ASPIRE_ALLOW_UNSECURED_TRANSPORT:'true',DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS:'true',DOTNET_DASHBOARD_URLS:'http://localhost:18888',ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL:'http://localhost:18889'}});
child.on('exit',code=>process.exit(code??1));for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
