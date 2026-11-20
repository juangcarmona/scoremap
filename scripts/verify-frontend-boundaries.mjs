import {readdir,readFile} from 'node:fs/promises';
import {posix,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
// Existing reviewed musical surface: library screens consume only these Sketch exports.
const tonalBoundary=(source,name)=>!name.startsWith('@tonaljs/')||source==='src/shared/music/theory.ts';
assert.equal(tonalBoundary('src/features/library/Sketch.tsx','@tonaljs/note'),false);
assert.equal(tonalBoundary('src/shared/music/theory.ts','@tonaljs/note'),true);
const musicalExports=new Set(['src/features/sketch/Piano.tsx','src/features/sketch/chords.ts','src/features/sketch/PerformedPiano.tsx']);
function allowed(source,target){
 if(source.startsWith('src/shared/'))return target.startsWith('src/shared/');
 const feature=source.match(/^src\/features\/([^/]+)\//u)?.[1];
 if(!feature)return true;
 if(target.startsWith('src/app/'))return false;
 const other=target.match(/^src\/features\/([^/]+)\//u)?.[1];
 return !other||feature===other||(feature==='library'&&musicalExports.has(target));
}
for(const [source,target,expected] of [
 ['src/features/library/a.ts','src/app/App.tsx',false],
 ['src/shared/http.ts','src/features/library/domain.ts',false],
 ['src/shared/a.ts','src/shared/b.ts',true],
 ['src/features/library/a.ts','src/features/sketch/internal.ts',false],
 ['src/features/library/a.ts','src/features/sketch/Piano.tsx',true],
 ['src/features/library/a.ts','src/features/library/domain.ts',true],
 ['src/app/App.tsx','src/features/library/Sketch.tsx',true],
])assert.equal(allowed(source,target),expected,source+' -> '+target);
// Parse the same syntax TypeScript accepts, including deferred and type-only imports.
export function verifySource(path,content){
 const file=ts.createSourceFile(path,content,ts.ScriptTarget.Latest,true);
 function check(node){
  let specifier;
  if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))specifier=node.moduleSpecifier;
  else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
   specifier=node.arguments[0];
   if(!specifier||!ts.isStringLiteralLike(specifier))throw new Error('Dynamic frontend import must use a literal specifier: '+path);
  }else if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument))specifier=node.argument.literal;
  if(specifier&&ts.isStringLiteralLike(specifier)&&!tonalBoundary(path,specifier.text))throw new Error('Tonal imports must stay behind the product theory adapter: '+path);
  if(specifier&&ts.isStringLiteralLike(specifier)&&specifier.text.startsWith('.')){
   const base=posix.normalize(posix.join(posix.dirname(path),specifier.text));
   const candidates=[base,base+'.ts',base+'.tsx',base+'/index.ts'];
   if(!candidates.some(target=>allowed(path,target)))throw new Error('Forbidden frontend import '+path+' -> '+specifier.text);
  }
  ts.forEachChild(node,check);
 }
 check(file);
}
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(['bin','obj'].includes(entry.name))continue;
  const path=dir+'/'+entry.name;
  if(entry.isDirectory())await walk(path);
  else if(/\.tsx?$/u.test(path))verifySource(path,await readFile(path,'utf8'));
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 await walk('src');
 console.log('Frontend dependency direction and boundary fixtures passed.');
}
