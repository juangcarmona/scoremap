import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifySource} from '../../scripts/verify-frontend-boundaries.mjs';

for(const [name,source,code] of [
 ['dynamic import from shared to feature','src/shared/probe.ts',"const x = import('../features/library/domain');"],
 ['type import from shared to feature','src/shared/probe.ts',"type T = import('../features/library/domain').Library;"],
 ['dynamic import from feature to app','src/features/library/probe.ts',"const x = import('../../app/App');"],
 ['type import across features','src/features/library/probe.ts',"type T = import('../sketch/internal').T;"],
 ['static import from shared to feature','src/shared/probe.ts',"import {x} from '../features/library/domain';"],
 ['export across features','src/features/library/probe.ts',"export * from '../sketch/internal';"],
])test(`rejects ${name}`,()=>assert.throws(()=>verifySource(source,code),/Forbidden frontend import/));

test('restricts dynamic tonal imports',()=>assert.throws(()=>verifySource('src/features/library/probe.ts',"const x = import('@tonaljs/note');"),/Tonal imports/));
test('rejects dynamic targets that cannot be checked',()=>assert.throws(()=>verifySource('src/app/probe.ts','const x = import(path);'),/literal specifier/));
for(const [name,source,code] of [
 ['application importing a feature','src/app/App.tsx',"type T = import('../features/library/domain').Library;"],
 ['shared importing shared','src/shared/probe.ts',"const x = import('./other');"],
 ['approved sketch export','src/features/library/probe.ts',"const x = import('../sketch/Piano');"],
 ['literal template dynamic import','src/features/library/probe.ts','const x = import(`./domain`);'],
 ['tonal through theory adapter','src/shared/music/theory.ts',"const x = import('@tonaljs/note');"],
])test(`permits ${name}`,()=>assert.doesNotThrow(()=>verifySource(source,code)));
