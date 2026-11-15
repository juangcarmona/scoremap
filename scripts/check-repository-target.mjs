import { execFileSync } from 'node:child_process';

const repository = JSON.parse(
  execFileSync('gh', ['api', 'repos/juangcarmona/scoremap'], { encoding: 'utf8' }),
);
if (
  repository.full_name !== 'juangcarmona/scoremap' ||
  repository.id !== 1458674261 ||
  repository.private
) {
  throw new Error('ScoreMap repository identity or visibility does not match.');
}
console.log(JSON.stringify({ repository: repository.full_name, id: repository.id, private: false }));
