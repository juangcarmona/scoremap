import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const image = process.argv[2] ?? `scoremap-pdf-validator:${revision.slice(0, 12)}`;
if (!/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{1,200}$/u.test(image)) throw new Error('Select a valid image name.');
// The image is constructed only from the committed revision, never operator files.
const archive = spawn('git', ['archive', '--format=tar', revision], { stdio: ['ignore', 'pipe', 'inherit'] });
const build = spawn('docker', ['build', '-f', 'src/pdf-validator/Dockerfile', '--build-arg', `SOURCE_REVISION=${revision}`, '-t', image, '-'], { stdio: ['pipe', 'inherit', 'inherit'] });
archive.stdout.pipe(build.stdin);
const [archived, built] = await Promise.all([once(archive, 'exit'), once(build, 'exit')]);
if (archived[0] !== 0 || built[0] !== 0) throw new Error('Committed-context PDF validator build failed.');
console.log(`Built ${image} from committed source ${revision}`);
